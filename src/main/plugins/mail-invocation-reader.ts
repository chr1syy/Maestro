/**
 * Host-private search/projected/attachment-read completion; no RPC, SDK, event or caller wiring.
 * Retains account authority across the inner reader's result/cleanup await boundary.
 */
import { performance } from 'perf_hooks';
import { AuthorizationStore, type AuthIdentity, type KeyringEntry } from './authorization-ledger';
import { assertMailActivityAuthority, type MailActivityLease } from './mail-account-activity';
import {
	parseMailAttachmentReference,
	parseMailMessageReference,
	parseMailSearchCriteria,
	requireMailAccountRevision,
} from './mail-account-config';
import { parseMailAuthIdentity, type MailAgentRight } from './mail-account-ledger';
import {
	reserveMailAttachmentSnapshot,
	type MailAttachmentSnapshot,
} from './mail-attachment-snapshot';
import { MailAccountHeaderReader, type MailHeaderSearchResult } from './mail-account-read';
import type { MailHeaderDisplay } from './mail-header-projection';
import type { MailMimeContent, MailMimeAttachmentContent } from './mail-mime-content';
import {
	ImapConnectionError,
	IMAP_CONNECTION_LIMITS,
	type ImapConnectionDeps,
} from './mail-imap-connection';
import {
	MailInvocationReadAuthority,
	type MailInvocationReadAuthorityDeps,
} from './mail-invocation-read-authority';

export interface MailInvocationReaderDeps extends MailInvocationReadAuthorityDeps {
	readonly store: AuthorizationStore;
	/** Host-only fake transport/native seams for later synthetic tests. */
	readonly transport?: Pick<ImapConnectionDeps, 'resolve' | 'blockedPorts' | 'connect'>;
	readonly entryFactory?: (service: string, account: string) => KeyringEntry | null;
}

/** Actual resolver/reader only; no supplied caller, projection or read callback. */
export class MailInvocationReader {
	inspectMailbox(invocationId: unknown, criteria: unknown) {
		return this.read('inspect', invocationId, criteria);
	}
	readMetadata(invocationId: unknown, reference: unknown) {
		return this.read('metadata', invocationId, reference);
	}
	private readonly store: AuthorizationStore;
	private readonly pluginId: string;
	private readonly identity: AuthIdentity;
	private readonly authority: MailInvocationReadAuthority;
	private readonly reader: MailAccountHeaderReader;

	constructor(deps: MailInvocationReaderDeps) {
		try {
			const store = deps?.store;
			const pluginId = deps?.pluginId;
			const identity = parseMailAuthIdentity(deps?.identity);
			const toolIdentity = deps?.toolIdentity;
			const policy = deps?.assertPolicyActive;
			if (!(store instanceof AuthorizationStore) || typeof policy !== 'function')
				throw new ImapConnectionError('MAIL_DENIED');
			this.authority = new MailInvocationReadAuthority({
				toolIdentity,
				pluginId,
				identity,
				assertPolicyActive: policy.bind(deps),
			});
			this.store = store;
			this.pluginId = pluginId;
			this.identity = identity;
			this.reader = new MailAccountHeaderReader(
				store,
				pluginId,
				identity,
				deps.transport,
				deps.entryFactory
			);
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_DENIED'
			);
		}
	}

	readHeaderDisplay(invocationId: unknown, reference: unknown) {
		return this.read('read', invocationId, reference);
	}

	readMessageBody(invocationId: unknown, reference: unknown) {
		return this.read('detail', invocationId, reference);
	}

	readAttachmentManifest(invocationId: unknown, reference: unknown) {
		return this.read('attachments', invocationId, reference);
	}

	/** Fixed bounded references only; no stable mailbox snapshot or public search page. */
	searchReferences(invocationId: unknown, criteria: unknown) {
		return this.read('search', invocationId, criteria);
	}

	/** Complete private bytes only. Recipient owns erasure and later publication checks. */
	readAttachmentContent(invocationId: unknown, reference: unknown) {
		return this.read('attachment', invocationId, reference);
	}

	/** Host-private snapshot; no serialized handle, public DTO or cross-invocation lookup. */
	openAttachmentSnapshot(
		invocationId: unknown,
		reference: unknown
	): Promise<MailAttachmentSnapshot> {
		return this.read('snapshot', invocationId, reference);
	}

	private read(
		mode: 'snapshot',
		invocationId: unknown,
		reference: unknown
	): Promise<MailAttachmentSnapshot>;
	private read(
		right: 'read',
		invocationId: unknown,
		reference: unknown
	): ReturnType<MailAccountHeaderReader['readHeaderDisplay']>;
	private read(
		right: 'detail',
		invocationId: unknown,
		reference: unknown
	): ReturnType<MailAccountHeaderReader['readMessageBody']>;
	private read(
		right: 'attachments',
		invocationId: unknown,
		reference: unknown
	): ReturnType<MailAccountHeaderReader['readAttachmentManifest']>;
	private read(
		mode: 'attachment',
		invocationId: unknown,
		reference: unknown
	): ReturnType<MailAccountHeaderReader['readAttachmentContent']>;
	private read(
		mode: 'search',
		invocationId: unknown,
		criteria: unknown
	): ReturnType<MailAccountHeaderReader['searchReferences']>;
	private read(
		mode: 'metadata',
		invocationId: unknown,
		reference: unknown
	): ReturnType<MailAccountHeaderReader['readMetadata']>;
	private read(
		mode: 'inspect',
		invocationId: unknown,
		reference: unknown
	): ReturnType<MailAccountHeaderReader['inspectMailbox']>;
	private async read(
		mode: MailAgentRight | 'inspect' | 'metadata' | 'attachment' | 'search' | 'snapshot',
		invocationId: unknown,
		reference: unknown
	): Promise<
		| MailAttachmentSnapshot
		| MailHeaderDisplay
		| Awaited<ReturnType<MailAccountHeaderReader['inspectMailbox']>>
		| Awaited<ReturnType<MailAccountHeaderReader['readMetadata']>>
		| MailHeaderSearchResult
		| MailMimeAttachmentContent
		| Readonly<Pick<MailMimeContent, 'body'>>
		| readonly Readonly<Omit<MailMimeAttachmentContent, 'bytes'>>[]
	> {
		const admittedAt = performance.now();
		const right: MailAgentRight =
			mode === 'attachment' || mode === 'snapshot'
				? 'attachments'
				: mode === 'search' || mode === 'metadata' || mode === 'inspect'
					? 'read'
					: mode;
		let lease: MailActivityLease | undefined;
		let signal: AbortSignal | undefined;
		let attachmentBytes: Buffer | undefined;
		let reservation: ReturnType<typeof reserveMailAttachmentSnapshot> | undefined;
		let retained = false;
		const eraseAttachment = () => attachmentBytes?.fill(0);
		const cancel = () => lease?.release();
		try {
			// Resolve provenance only after owning the original closed request intent.
			const request =
				mode === 'attachment' || mode === 'snapshot'
					? parseMailAttachmentReference(reference)
					: mode === 'search' || mode === 'inspect'
						? parseMailSearchCriteria(reference)
						: parseMailMessageReference(reference);
			const caller = this.authority.resolve(invocationId);
			signal = caller.signal;
			const assertLifetime = () => {
				if (caller.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
				if (performance.now() - admittedAt >= IMAP_CONNECTION_LIMITS.lifetimeMs)
					throw new ImapConnectionError('MAIL_TIMEOUT');
			};
			const assertCaller = () => {
				assertLifetime();
				assertMailActivityAuthority(() =>
					caller.assertActive(right, this.pluginId, this.identity, caller.agentId)
				);
				assertLifetime();
			};
			assertCaller();
			const configuration = this.store.readMailConfiguration(this.pluginId, this.identity);
			const account = requireMailAccountRevision(
				configuration,
				request.accountId,
				request.accountRevision
			);
			if (!configuration || !account.mailboxes.includes(request.mailbox))
				throw new ImapConnectionError('MAIL_DENIED');
			const installationId = configuration.installationId;
			lease = this.store.acquireMailActivity(
				this.pluginId,
				this.identity,
				request.accountId,
				request.accountRevision,
				caller.agentId,
				right,
				assertCaller
			);
			const activeLease = lease;
			const assertReference = () => {
				const current = this.store.readMailConfiguration(this.pluginId, this.identity);
				const currentAccount = requireMailAccountRevision(
					current,
					request.accountId,
					request.accountRevision
				);
				if (
					current?.installationId !== installationId ||
					!currentAccount.mailboxes.includes(request.mailbox)
				)
					throw new ImapConnectionError('MAIL_STALE');
			};
			const assertActive = () => {
				activeLease.assertActive();
				assertReference();
				activeLease.assertActive();
				// Final sealed reads can overrun synchronously, including retained snapshot checks.
				assertLifetime();
			};
			signal.addEventListener('abort', cancel, { once: true });
			activeLease.signal.addEventListener('abort', eraseAttachment, { once: true });
			assertActive();
			if (mode === 'snapshot') reservation = reserveMailAttachmentSnapshot(this.pluginId);
			// Include facade provenance/policy/account work in the inner pre-LOGIN/total budgets.
			// Both leases count against canonical caps. No raw header/source surface.
			const result =
				mode === 'inspect'
					? await this.reader.inspectMailbox(request, caller, admittedAt)
					: mode === 'metadata'
						? await this.reader.readMetadata(request, caller, admittedAt)
						: mode === 'search'
							? await this.reader.searchReferences(request, caller, admittedAt)
							: mode === 'attachment' || mode === 'snapshot'
								? await this.reader.readAttachmentContent(request, caller, admittedAt)
								: mode === 'read'
									? await this.reader.readHeaderDisplay(request, caller, admittedAt)
									: mode === 'detail'
										? await this.reader.readMessageBody(request, caller, admittedAt)
										: await this.reader.readAttachmentManifest(request, caller, admittedAt);
			// Own bytes before any callback, even if cancellation preceded this continuation.
			if (mode === 'attachment' || mode === 'snapshot')
				attachmentBytes = (result as MailMimeAttachmentContent).bytes;
			// Inner transport close and lease cleanup have completed before this check.
			assertActive();
			if (mode === 'snapshot' && reservation) {
				const snapshot = reservation.consume(
					result as MailMimeAttachmentContent,
					activeLease,
					signal,
					assertActive
				);
				// Snapshot now owns bytes, abort listeners, reservation and the original lease.
				attachmentBytes = undefined;
				retained = true;
				return snapshot;
			}
			// Release's synchronous abort must not erase the successfully transferred Buffer.
			activeLease.signal.removeEventListener('abort', eraseAttachment);
			activeLease.release();
			lease = undefined;
			// Release runs synchronous abort cleanup. Check without reusing that stale lease.
			this.store.assertMailReadCompletion(
				this.pluginId,
				this.identity,
				request.accountId,
				request.accountRevision,
				caller.agentId,
				right,
				() => {
					assertCaller();
					assertReference();
				}
			);
			// Sealed/native checks may overrun synchronously; no callbacks after this boundary.
			assertLifetime();
			attachmentBytes = undefined;
			return result;
		} catch (error) {
			eraseAttachment();
			// No raw result fallback, peer errors, causes or retained result cache.
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		} finally {
			signal?.removeEventListener('abort', cancel);
			lease?.signal.removeEventListener('abort', eraseAttachment);
			if (!retained) {
				reservation?.release();
				lease?.release();
			}
		}
	}
}
