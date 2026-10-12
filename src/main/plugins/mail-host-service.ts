import { randomBytes } from 'crypto';
import type { HostMethod } from '../../shared/plugins/rpc-protocol';
import { MAIL_ERROR_MESSAGES, type MailResult } from '../../shared/plugins/mail';
import { AuthorizationStore, type AuthIdentity, type KeyringEntry } from './authorization-ledger';
import {
	mailRecord,
	parseMailMessageReference,
	parseMailSearchCriteria,
	parseMailSetupNavigation,
	requireMailAccountRevision,
} from './mail-account-config';
import type { MailAgentRight } from './mail-account-ledger';
import type { MailAttachmentSnapshot } from './mail-attachment-snapshot';
import { ImapConnectionError, type ImapConnectionDeps } from './mail-imap-connection';
import { MailInvocationReader } from './mail-invocation-reader';
import { PluginToolRunIdentity } from './plugin-tool-run-identity';

export interface MailHostServiceDeps {
	store: AuthorizationStore;
	toolIdentity: PluginToolRunIdentity;
	/** Resolves the CURRENT live, consented, trusted plugin's dual identity. */
	identityFor(pluginId: string): AuthIdentity;
	assertPolicyActive(
		pluginId: string,
		identity: AuthIdentity,
		agentId: string,
		right: MailAgentRight,
		accountId: string
	): void;
	requestSetup(pluginId: string, intent: ReturnType<typeof parseMailSetupNavigation>): void;
	transport?: Pick<ImapConnectionDeps, 'resolve' | 'blockedPorts' | 'connect'>;
	entryFactory?: (service: string, account: string) => KeyringEntry | null;
}

interface SnapshotEntry {
	pluginId: string;
	invocationId: string;
	reference: ReturnType<typeof parseMailMessageReference>;
	snapshot: MailAttachmentSnapshot;
	signal: AbortSignal;
	close(): void;
}

/** One host instance. No ambient caller, plugin-owned credential/config store, or raw socket API. */
export class MailHostService {
	private readonly snapshots = new Map<string, SnapshotEntry>();
	private stopped = false;
	constructor(private readonly deps: MailHostServiceDeps) {}

	stopPlugin(pluginId: string): void {
		for (const entry of [...this.snapshots.values()])
			if (entry.pluginId === pluginId) entry.close();
		this.deps.store.stopMailPluginActivity(pluginId);
	}
	stop(): void {
		this.stopped = true;
		for (const entry of [...this.snapshots.values()]) entry.close();
	}

	/** guard is retained by main and called immediately before posting the response to this child. */
	async call(
		pluginId: string,
		method: HostMethod,
		params: unknown,
		setResponseGuard: (guard: () => void) => void
	): Promise<MailResult<unknown>> {
		let opened: SnapshotEntry | undefined;
		try {
			if (this.stopped) throw new ImapConnectionError('MAIL_DENIED');
			const identity = this.deps.identityFor(pluginId);
			const checkPlugin = () => {
				if (this.stopped) throw new ImapConnectionError('MAIL_DENIED');
				const current = this.deps.identityFor(pluginId);
				if (
					current.contentHash !== identity.contentHash ||
					current.signatureStatus !== identity.signatureStatus ||
					current.signerKey !== identity.signerKey
				)
					throw new ImapConnectionError('MAIL_DENIED');
			};
			if (method === 'mail.listAccounts') {
				mailRecord(params, []);
				const value = this.deps.store.listStoredMailAccounts(pluginId, identity).map((account) => {
					const stored = this.deps.store.readStoredMailAgentRights(
						pluginId,
						identity,
						account.accountId,
						account.revision
					);
					const agentGrantCounts = Object.freeze({
						read: stored.agents.filter((a) => a.rights.includes('read')).length,
						detail: stored.agents.filter((a) => a.rights.includes('detail')).length,
						attachments: stored.agents.filter((a) => a.rights.includes('attachments')).length,
					});
					return Object.freeze({
						...account,
						agentGrantCounts,
						credentialStatus: 'unknown',
						status: account.enabled ? 'unknown' : 'disabled',
					});
				});
				checkPlugin();
				setResponseGuard(checkPlugin);
				return { ok: true, value };
			}
			if (method === 'mail.requestSetup') {
				const intent = parseMailSetupNavigation(params);
				checkPlugin();
				this.deps.requestSetup(pluginId, intent);
				setResponseGuard(checkPlugin);
				return { ok: true, value: { requested: true } };
			}
			const search = method === 'mail.searchHeaders';
			const chunk = method === 'mail.readAttachment' || method === 'mail.closeAttachment';
			const raw = mailRecord(
				params,
				[
					'invocationId',
					...(search
						? ['accountId', 'accountRevision', 'mailbox', 'fromUid', 'toUid']
						: chunk
							? ['accountId', 'snapshotId', ...(method === 'mail.readAttachment' ? ['offset'] : [])]
							: ['reference']),
				],
				search
					? ['text', 'uidValidity', 'limit']
					: method === 'mail.openAttachment'
						? ['partId']
						: method === 'mail.readAttachment'
							? ['limit']
							: []
			);

			const invocationId = raw.invocationId;
			const caller = this.deps.toolIdentity.resolveInvocation(pluginId, invocationId);
			let entry: SnapshotEntry | undefined;
			if (chunk) {
				if (typeof raw.snapshotId !== 'string') throw new ImapConnectionError('MAIL_INVALID');
				entry = this.snapshots.get(raw.snapshotId);
				if (
					!entry ||
					entry.pluginId !== pluginId ||
					entry.invocationId !== invocationId ||
					entry.reference.accountId !== raw.accountId
				)
					throw new ImapConnectionError('MAIL_DENIED');
			}
			const criteria = search
				? parseMailSearchCriteria(
						Object.fromEntries(
							Object.entries(raw).filter(([key]) => key !== 'invocationId' && key !== 'limit')
						)
					)
				: undefined;
			const reference = search
				? undefined
				: (entry?.reference ?? parseMailMessageReference(raw.reference));
			const accountId = criteria?.accountId ?? reference!.accountId;
			const revision = criteria?.accountRevision ?? reference!.accountRevision;
			const right: MailAgentRight =
				method === 'mail.readBody'
					? 'detail'
					: method.includes('Attachment')
						? 'attachments'
						: 'read';
			const check = () => {
				checkPlugin();
				caller.assertActive();
				this.deps.store.assertMailReadCompletion(
					pluginId,
					identity,
					accountId,
					revision,
					caller.callerAgentId,
					right,
					() => {
						caller.assertActive();
						this.deps.assertPolicyActive(
							pluginId,
							identity,
							caller.callerAgentId,
							right,
							accountId
						);
					}
				);
				const account = requireMailAccountRevision(
					this.deps.store.readMailConfiguration(pluginId, identity),
					accountId,
					revision
				);
				if (!account.mailboxes.includes(criteria?.mailbox ?? reference!.mailbox))
					throw new ImapConnectionError('MAIL_DENIED');
				caller.assertActive();
			};
			check();
			const reader = new MailInvocationReader({
				...this.deps,
				pluginId,
				identity,
				assertPolicyActive: (id, auth, agent, requestedRight) =>
					this.deps.assertPolicyActive(id, auth, agent, requestedRight, accountId),
			});
			let value: unknown;
			switch (method) {
				case 'mail.readHeaders': {
					const headers = await reader.readHeaderDisplay(invocationId, reference);
					for (const label of [headers.subject, headers.sender])
						if (label !== undefined && [...label].length > 512)
							throw new ImapConnectionError('MAIL_LIMIT');
					value = { reference, ...headers };
					break;
				}
				case 'mail.searchHeaders': {
					const limit = raw.limit ?? 50;
					if (!Number.isSafeInteger(limit) || (limit as number) < 1 || (limit as number) > 50)
						throw new ImapConnectionError('MAIL_INVALID');
					if (criteria!.text !== undefined && (!criteria!.text || [...criteria!.text].length > 256))
						throw new ImapConnectionError('MAIL_INVALID');
					const result = await reader.searchReferences(invocationId, criteria);
					const references = result.references.slice(0, limit as number);
					const truncated = result.references.length > references.length;
					value = {
						uidValidity: result.uidValidity,
						references,
						truncated,
						...(truncated ? { nextAfterUid: references.at(-1)!.uid } : {}),
					};
					break;
				}
				case 'mail.readBody': {
					const result = await reader.readMessageBody(invocationId, reference);
					if (!result.body) throw new ImapConnectionError('MAIL_PROTOCOL');
					value = {
						reference,
						...result.body,
						sizeBytes: Buffer.byteLength(result.body.text, 'utf8'),
					};
					break;
				}
				case 'mail.listAttachments':
					value = await reader.readAttachmentManifest(invocationId, reference);
					break;
				case 'mail.openAttachment': {
					if (this.snapshots.size >= 64) throw new ImapConnectionError('MAIL_LIMIT');
					const snapshot = await reader.openAttachmentSnapshot(invocationId, {
						...reference,
						partId: raw.partId,
					});
					const snapshotId = randomBytes(32).toString('hex');
					const owned: SnapshotEntry = {
						pluginId,
						invocationId: invocationId as string,
						reference: reference!,
						snapshot,
						signal: caller.signal,
						close: () => {
							this.snapshots.delete(snapshotId);
							caller.signal.removeEventListener('abort', owned.close);
							snapshot.signal.removeEventListener('abort', owned.close);
							snapshot.close();
						},
					};
					opened = owned;
					this.snapshots.set(snapshotId, owned);
					caller.signal.addEventListener('abort', owned.close, { once: true });
					snapshot.signal.addEventListener('abort', owned.close, { once: true });
					snapshot.assertActive();
					value = {
						snapshotId,
						partId: snapshot.partId,
						filename: snapshot.filename,
						mimeType: snapshot.mimeType,
						sizeBytes: snapshot.sizeBytes,
					};
					break;
				}
				case 'mail.readAttachment':
					value = entry!.snapshot.readChunk(raw.offset, raw.limit);
					break;
				case 'mail.closeAttachment':
					entry!.close();
					value = { closed: true };
					break;
				default:
					throw new ImapConnectionError('MAIL_INVALID');
			}
			const maxBytes = search
				? 64 * 1024
				: method === 'mail.readBody'
					? 2 * 1024 * 1024
					: 128 * 1024;
			if (Buffer.byteLength(JSON.stringify({ ok: true, value }), 'utf8') > maxBytes)
				throw new ImapConnectionError('MAIL_LIMIT');
			check();
			setResponseGuard(() => {
				try {
					check();
					if (method === 'mail.readAttachment' || opened)
						(entry ?? opened)!.snapshot.assertActive();
				} catch {
					opened?.close();
					throw new ImapConnectionError('MAIL_DENIED');
				}
			});
			return { ok: true, value };
		} catch (error) {
			opened?.close();
			const code = error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE';
			return { ok: false, error: { code, message: MAIL_ERROR_MESSAGES[code] } };
		}
	}
}
