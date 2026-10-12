import { createHash } from 'crypto';
import { canonicalJson } from '../../shared/canonicalJson';
import type { CueEvent, CueMailSource } from '../../shared/cue/contracts';
import type { RelayMailMetadata } from '../../shared/plugins/mail';
import type { MailCueHost } from '../cue/triggers/cue-mail-trigger-source';
import { ImapConnectionError } from './mail-imap-connection';
import { MailInvocationReader } from './mail-invocation-reader';
import type { MailHostServiceDeps } from './mail-host-service';

export interface MailCueHostDeps extends Omit<MailHostServiceDeps, 'requestSetup'> {
	checkpointPath: string;
	enabled(): boolean;
	capturePluginLifetime(pluginId: string): () => void;
	getPluginGeneration(pluginId: string): string;
	isSubscriptionActive(agentId: string, name: string, source: CueEvent['mailSource']): boolean;
}

/** Configured Cue sources use the same registry, ledger, policy, TLS and reader as tool calls. */
export function createMailCueHost(deps: MailCueHostDeps): MailCueHost {
	const namespaces = new Map<string, { uidValidity: string; signal: AbortSignal }>();
	const namespaceKey = (
		plugin: string,
		account: string,
		revision: number,
		mailbox: string,
		agent: string
	) => canonicalJson([plugin, account, revision, mailbox, agent]);
	return {
		checkpointPath: deps.checkpointPath,
		authorize(event, agentId, name, queued = false) {
			try {
				const source = event.mailSource;
				if (
					event.type !== 'relay.mail.received' ||
					!deps.enabled() ||
					!source ||
					!deps.isSubscriptionActive(source.producerAgentId, name, source)
				)
					return false;
				if (!queued && source.sourceGeneration !== deps.getPluginGeneration(source.pluginId))
					return false;
				const known = namespaces.get(
					namespaceKey(
						source.pluginId,
						source.accountId,
						source.accountRevision,
						source.mailbox,
						source.producerAgentId
					)
				);
				if (!queued && (!known || known.signal.aborted)) return false;
				if (known && !known.signal.aborted && known.uidValidity !== event.payload.uidValidity)
					return false;
				const expectedId = createHash('sha256')
					.update(
						canonicalJson([
							source.pluginId,
							{
								accountId: source.accountId,
								accountRevision: source.accountRevision,
								mailbox: source.mailbox,
								uidValidity: event.payload.uidValidity,
								uid: event.payload.uid,
							},
						])
					)
					.digest('hex');
				if (event.id !== expectedId) return false;
				const identity = deps.identityFor(source.pluginId);
				deps.assertPolicyActive(source.pluginId, identity, agentId, 'read', source.accountId);
				return deps.store.verifyMailEvent(
					identity,
					source,
					event.payload as unknown as RelayMailMetadata,
					agentId
				);
			} catch {
				return false;
			}
		},
		async poll(source: CueMailSource, agentId, afterUid, uidValidity, signal) {
			const identity = deps.identityFor(source.plugin_id);
			const assertChild = deps.capturePluginLifetime(source.plugin_id);
			const sourceGeneration = deps.getPluginGeneration(source.plugin_id);
			const assertActive = () => {
				if (signal.aborted || !deps.enabled()) throw new ImapConnectionError('MAIL_CANCELED');
				assertChild();
				if (sourceGeneration !== deps.getPluginGeneration(source.plugin_id))
					throw new ImapConnectionError('MAIL_DENIED');
				const current = deps.identityFor(source.plugin_id);
				if (
					current.contentHash !== identity.contentHash ||
					current.signerKey !== identity.signerKey ||
					current.signatureStatus !== identity.signatureStatus
				)
					throw new ImapConnectionError('MAIL_DENIED');
				deps.assertPolicyActive(source.plugin_id, identity, agentId, 'read', source.account_id);
			};
			assertActive();
			const run = deps.toolIdentity.issue(agentId, { signal, assertActive }, 30_000);
			let handle: string | undefined;
			try {
				handle = deps.toolIdentity.issueInvocation(
					deps.toolIdentity.resolveVerified(run),
					source.plugin_id,
					{ signal, assertActive }
				);
				const reader = new MailInvocationReader({
					...deps,
					pluginId: source.plugin_id,
					identity,
					assertPolicyActive: () => {
						assertActive();
						deps.store.assertStoredMailAgentRight(
							source.plugin_id,
							identity,
							source.account_id,
							source.account_revision,
							agentId,
							'read'
						);
					},
				});
				const base = {
					accountId: source.account_id,
					accountRevision: source.account_revision,
					mailbox: source.mailbox,
				};
				const namespace = await reader.inspectMailbox(handle, {
					...base,
					fromUid: '1',
					toUid: '4294967295',
				});
				const key = namespaceKey(
					source.plugin_id,
					source.account_id,
					source.account_revision,
					source.mailbox,
					agentId
				);
				if (!namespaces.has(key) && namespaces.size >= 512)
					throw new ImapConnectionError('MAIL_LIMIT');
				namespaces.set(key, { uidValidity: namespace.uidValidity, signal });
				const from = uidValidity === namespace.uidValidity && afterUid ? Number(afterUid) + 1 : 1;
				const to = Math.min(Number(namespace.uidNext) - 1, from + 1023);
				if (from > to) return { events: [] };
				const result = await reader.searchReferences(handle, {
					...base,
					fromUid: String(from),
					toUid: String(to),
					uidValidity: namespace.uidValidity,
				});

				const events: CueEvent[] = [];
				for (const reference of result.references.slice(0, 8)) {
					const metadata = await reader.readMetadata(handle, reference);
					assertActive();
					const payload: RelayMailMetadata = {
						reference: `relay-mail:1:${reference.accountId}:${encodeURIComponent(reference.mailbox)}:${reference.uidValidity}:${reference.uid}`,
						accountId: reference.accountId,
						folder: reference.mailbox,
						uidValidity: reference.uidValidity,
						uid: reference.uid,
						receivedAt: metadata.receivedAt,
						sizeBytes: metadata.sizeBytes,
					};
					const envelope = {
						pluginId: source.plugin_id,
						accountId: reference.accountId,
						accountRevision: reference.accountRevision,
						mailbox: reference.mailbox,
						producerAgentId: agentId,
						sourceGeneration,
					};
					const proof = deps.store.mailEventProof(source.plugin_id, identity, envelope, payload);
					const id = createHash('sha256')
						.update(canonicalJson([source.plugin_id, reference]))
						.digest('hex');
					events.push({
						id,
						type: 'relay.mail.received',
						timestamp: new Date(metadata.receivedAt).toISOString(),
						triggerName: 'mail',
						payload: { ...payload },
						mailSource: { ...envelope, proof },
					});
				}
				assertActive();
				deps.toolIdentity.resolveInvocation(source.plugin_id, handle).assertActive();
				return {
					events,
					checkpoint: {
						uidValidity: namespace.uidValidity,
						uid:
							result.references.length > events.length
								? String(events.at(-1)!.payload.uid)
								: String(to),
					},
				};
			} finally {
				if (handle) deps.toolIdentity.releaseInvocation(handle);
				deps.toolIdentity.revoke(run);
			}
		},
	};
}
