/**
 * Unwired host-private header/reference/source/body/attachment reads; no SDK/RPC.
 * Projections stay inside the read lease; external publication needs live authority.
 */
import { AuthorizationStore, type AuthIdentity, type KeyringEntry } from './authorization-ledger';
import { assertMailActivityAuthority, type MailActivityLease } from './mail-account-activity';
import {
	parseMailAttachmentReference,
	parseMailMessageReference,
	parseMailSearchCriteria,
	requireMailAccountRevision,
} from './mail-account-config';
import { parseMailAuthIdentity, type MailAgentRight } from './mail-account-ledger';
import { MailCredentialSlot } from './mail-credentials';
import { consumeMailHeaderDisplay, type MailHeaderDisplay } from './mail-header-projection';
import {
	consumeMailMimeContent,
	type MailMimeContent,
	type MailMimeAttachmentContent,
} from './mail-mime-content';
import { IMAP_FRAMING_LIMITS } from './mail-imap-framing';
import {
	assertImapUid,
	assertImapQuotedString,
	IMAP_COMMAND_LIMITS,
	type FixedImapCommand,
} from './mail-imap-commands';
import {
	openConfiguredImapConnection,
	ImapConnectionError,
	IMAP_CONNECTION_LIMITS,
	type ImapConnection,
	type ImapConnectionDeps,
} from './mail-imap-connection';

/** Only trusted host composition may supply this; never plugin arguments. */
export interface MailHeaderReadAuthority {
	readonly agentId: string;
	readonly signal: AbortSignal;
	/** Prove current caller/membership/policy for the reader's exact plugin/dual identity. */
	assertActive(
		right: MailAgentRight,
		pluginId: string,
		identity: AuthIdentity,
		agentId: string
	): void;
}

/** Host-private identifiers only; not a header page, cursor, event or permission. */
export interface MailHeaderSearchResult {
	readonly uidValidity: string;
	readonly references: readonly Readonly<{
		accountId: string;
		accountRevision: number;
		mailbox: string;
		uidValidity: string;
		uid: string;
	}>[];
}

/** Host-only admission timestamps may tighten, never restart, the existing read budgets. */
export interface MailNamespace {
	readonly uidValidity: string;
	readonly uidNext: string;
}
export interface MailMessageMetadata {
	readonly receivedAt: number;
	readonly sizeBytes: number;
}

export class MailAccountHeaderReader {
	inspectMailbox(
		criteria: unknown,
		caller: MailHeaderReadAuthority,
		admittedAt?: number
	): Promise<MailNamespace> {
		return this.read('inspect', criteria, caller, admittedAt);
	}
	readMetadata(
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admittedAt?: number
	): Promise<MailMessageMetadata> {
		return this.read('metadata', reference, caller, admittedAt);
	}
	private readonly identity: AuthIdentity;
	private readonly transport: Pick<ImapConnectionDeps, 'resolve' | 'blockedPorts' | 'connect'>;

	constructor(
		private readonly store: AuthorizationStore,
		private readonly pluginId: string,
		identity: AuthIdentity,
		transport: Pick<ImapConnectionDeps, 'resolve' | 'blockedPorts' | 'connect'> = {},
		private readonly entryFactory?: (service: string, account: string) => KeyringEntry | null
	) {
		this.identity = parseMailAuthIdentity(identity);
		// Injected seams are host-only. No caller endpoint, credential or connection factory.
		this.transport = Object.freeze({
			resolve: transport.resolve,
			blockedPorts: transport.blockedPorts,
			connect: transport.connect,
		});
	}

	/** Exact closed reference: accountId/accountRevision/mailbox/uidValidity/uid only. */
	readHeaderBytes(
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admittedAt?: number
	): Promise<Buffer> {
		return this.read('bytes', reference, caller, admittedAt);
	}

	/**
	 * Complete MIME bytes for a future trusted host parser, requiring independent detail rights.
	 * May contain attachments: never return these bytes through SDK/RPC/events. The host
	 * recipient must erase them, exclude attachments from detail projections and reauthorize
	 * any later publication. Successful transfer ends this lease; bytes cannot be recalled.
	 */
	readMessageSourceBytes(
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admittedAt?: number
	): Promise<Buffer> {
		return this.read('source', reference, caller, admittedAt);
	}

	/**
	 * Detail-only complete plain text under the original lease/deadline. Attachment
	 * bytes/descriptors remain private and are erased before any result transfer.
	 * Absent body differs from complete empty text. Strings cannot be erased or
	 * recalled; subsequent publication must reauthorize the exact reference/caller.
	 */
	readMessageBody(
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admittedAt?: number
	): Promise<Readonly<Pick<MailMimeContent, 'body'>>> {
		return this.read('body', reference, caller, admittedAt);
	}

	/**
	 * Independent attachments rights; complete metadata only under the original
	 * lease/deadline. Part IDs are private source paths, never read capabilities.
	 * MIME is sender-declared and filenames are untrusted labels, never paths.
	 * Every decoded buffer is erased before transfer; later publication must
	 * reauthorize the exact caller/reference. No body, bytes or snapshot retained.
	 */
	readAttachmentManifest(
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admittedAt?: number
	): Promise<readonly Readonly<Omit<MailMimeAttachmentContent, 'bytes'>>[]> {
		return this.read('manifest', reference, caller, admittedAt);
	}

	/**
	 * Closed reference plus partId; independent attachments rights. Transfer only
	 * the exact complete decoded part to trusted host code, never SDK/RPC/events.
	 * Recipient must erase bytes and reauthorize any later publication/chunk.
	 * Frozen shell does not freeze the Buffer; no cross-read snapshot is promised.
	 */
	readAttachmentContent(
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admittedAt?: number
	): Promise<MailMimeAttachmentContent> {
		return this.read('attachment', reference, caller, admittedAt);
	}

	/** Fixed display projection only; no arbitrary callback or raw result on failure. */
	readHeaderDisplay(
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admittedAt?: number
	): Promise<MailHeaderDisplay> {
		return this.read('display', reference, caller, admittedAt);
	}

	/** Fixed UID range and optional literal Subject-or-From text; no raw grammar. */
	searchReferences(
		criteria: unknown,
		caller: MailHeaderReadAuthority,
		admittedAt?: number
	): Promise<MailHeaderSearchResult> {
		return this.read('search', criteria, caller, admittedAt);
	}

	private read(
		mode: 'bytes' | 'source',
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admissionStart?: number
	): Promise<Buffer>;
	private read(
		mode: 'display',
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admissionStart?: number
	): Promise<MailHeaderDisplay>;
	private read(
		mode: 'search',
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admissionStart?: number
	): Promise<MailHeaderSearchResult>;
	private read(
		mode: 'body',
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admissionStart?: number
	): Promise<Readonly<Pick<MailMimeContent, 'body'>>>;
	private read(
		mode: 'manifest',
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admissionStart?: number
	): Promise<readonly Readonly<Omit<MailMimeAttachmentContent, 'bytes'>>[]>;
	private read(
		mode: 'attachment',
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admissionStart?: number
	): Promise<MailMimeAttachmentContent>;
	private read(
		mode: 'metadata',
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admissionStart?: number
	): Promise<MailMessageMetadata>;
	private read(
		mode: 'inspect',
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admissionStart?: number
	): Promise<MailNamespace>;
	private async read(
		mode:
			| 'inspect'
			| 'metadata'
			| 'bytes'
			| 'display'
			| 'search'
			| 'source'
			| 'body'
			| 'manifest'
			| 'attachment',
		reference: unknown,
		caller: MailHeaderReadAuthority,
		admissionStart?: number
	): Promise<
		| Buffer
		| MailHeaderDisplay
		| MailNamespace
		| MailMessageMetadata
		| MailHeaderSearchResult
		| MailMimeAttachmentContent
		| Readonly<Pick<MailMimeContent, 'body'>>
		| readonly Readonly<Omit<MailMimeAttachmentContent, 'bytes'>>[]
	> {
		const enteredAt = performance.now();
		const admittedAt = admissionStart === undefined ? enteredAt : admissionStart;
		const needsSource =
			mode === 'source' || mode === 'body' || mode === 'manifest' || mode === 'attachment';
		// The operation, never a plugin request, selects the independent policy right.
		const right: MailAgentRight =
			mode === 'manifest' || mode === 'attachment'
				? 'attachments'
				: needsSource
					? 'detail'
					: 'read';
		let authenticated = false;
		let lease: MailActivityLease | undefined;
		let session: ImapConnection | undefined;
		let bytes: Buffer | undefined;
		let attachmentBytes: Buffer | undefined;
		let callerSignal: AbortSignal | undefined;
		let cancelCaller: (() => void) | undefined;
		const cancelRead = () => {
			bytes?.fill(0);
			attachmentBytes?.fill(0);
			try {
				session?.close();
			} catch {
				/* Cleanup must not expose peer/native error content. */
			}
		};
		try {
			// The verified facade includes provenance/policy/account work in this same budget.
			// An optional host timestamp can only move admission earlier, never extend it.
			if (
				typeof admittedAt !== 'number' ||
				!Number.isFinite(admittedAt) ||
				admittedAt < 0 ||
				admittedAt > enteredAt
			)
				throw new ImapConnectionError('MAIL_INVALID');
			// Own closed intent before caller accessors or host callbacks can retarget it.
			const raw: Record<string, unknown> =
				mode === 'search' || mode === 'inspect'
					? parseMailSearchCriteria(reference)
					: mode === 'attachment'
						? parseMailAttachmentReference(reference)
						: parseMailMessageReference(reference);
			// Validate the same values used throughout this read; host getters may be reentrant.
			const signal = caller?.signal;
			const callback = caller?.assertActive;
			const agentId = caller?.agentId;
			if (
				!(signal instanceof AbortSignal) ||
				typeof callback !== 'function' ||
				typeof agentId !== 'string'
			)
				throw new ImapConnectionError('MAIL_DENIED');
			callerSignal = signal;
			const checkAuthority = callback.bind(caller);
			const checkCaller = () => checkAuthority(right, this.pluginId, this.identity, agentId);
			const assertLifetime = () => {
				if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
				const elapsed = performance.now() - admittedAt;
				if (
					elapsed >= IMAP_CONNECTION_LIMITS.lifetimeMs ||
					(!authenticated && elapsed >= IMAP_CONNECTION_LIMITS.connectMs)
				)
					throw new ImapConnectionError('MAIL_TIMEOUT');
			};
			const assertCaller = () => {
				assertLifetime();
				assertMailActivityAuthority(checkCaller);
				assertLifetime();
			};
			assertCaller();
			const partId = mode === 'attachment' ? (raw.partId as string) : undefined;
			let expectedUidValidity: string | undefined;
			if (Object.prototype.hasOwnProperty.call(raw, 'uidValidity')) {
				assertImapUid(raw.uidValidity);
				expectedUidValidity = raw.uidValidity;
			}
			let command: FixedImapCommand;
			if (mode === 'search' || mode === 'inspect') {
				command = Object.freeze({
					kind: 'search',
					fromUid: raw.fromUid as string,
					toUid: raw.toUid as string,
					...(Object.prototype.hasOwnProperty.call(raw, 'text')
						? { text: raw.text as string }
						: {}),
				});
			} else {
				assertImapUid(raw.uid);
				command =
					mode === 'metadata'
						? Object.freeze({ kind: 'metadata', uid: raw.uid })
						: Object.freeze({
								kind: 'fetch',
								uid: raw.uid,
								content: needsSource ? 'source' : 'headers',
							});
			}
			assertImapQuotedString(raw.mailbox, IMAP_COMMAND_LIMITS.mailbox);
			const configuration = this.store.readMailConfiguration(this.pluginId, this.identity);
			const account = requireMailAccountRevision(configuration, raw.accountId, raw.accountRevision);
			if (!configuration || !account.mailboxes.includes(raw.mailbox))
				throw new ImapConnectionError('MAIL_DENIED');
			const request = Object.freeze({
				accountId: account.accountId,
				accountRevision: account.revision,
				mailbox: raw.mailbox,
			});
			lease = this.store.acquireMailActivity(
				this.pluginId,
				this.identity,
				request.accountId,
				request.accountRevision,
				agentId,
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
					current?.installationId !== configuration.installationId ||
					!currentAccount.mailboxes.includes(request.mailbox)
				)
					throw new ImapConnectionError('MAIL_STALE');
			};
			const assertActive = () => {
				activeLease.assertActive();
				assertReference();
				// Reentrant host callbacks cannot bypass the lease's terminal generation.
				activeLease.assertActive();
				// Final sealed reads must not let sensitive work exceed the original budgets.
				assertLifetime();
			};
			cancelCaller = () => activeLease.release();
			signal.addEventListener('abort', cancelCaller, { once: true });
			activeLease.signal.addEventListener('abort', cancelRead, { once: true });
			assertActive();
			const elapsed = performance.now() - admittedAt;
			session = await openConfiguredImapConnection(
				request.accountId,
				{
					...this.transport,
					pluginId: this.pluginId,
					assertActive,
					getEndpoint: (id) => {
						assertActive();
						return id === request.accountId ? account.endpoint : null;
					},
				},
				{
					signal: activeLease.signal,
					connectMs: Math.max(1, Math.floor(IMAP_CONNECTION_LIMITS.connectMs - elapsed)),
					lifetimeMs: Math.max(1, Math.floor(IMAP_CONNECTION_LIMITS.lifetimeMs - elapsed)),
				}
			);
			assertActive();
			const slot = new MailCredentialSlot(
				{
					installationId: configuration.installationId,
					pluginId: this.pluginId,
					accountId: request.accountId,
				},
				this.entryFactory
			);
			await slot.authenticate(session, account.username, {
				signal: activeLease.signal,
				assertActive,
			});
			assertActive(); // LOGIN must still complete inside the original admission budget.
			authenticated = true;
			const selected = await session.execute(
				{ kind: 'examine', mailbox: request.mailbox },
				expectedUidValidity
			);
			assertActive();
			session.assertActive();
			if (selected.kind !== 'examine') throw new ImapConnectionError('MAIL_PROTOCOL');
			const result =
				mode === 'inspect' ? selected : await session.execute(command, selected.uidValidity);
			// Take ownership before any callback can revoke and discard the result.
			if (result.kind === 'fetch') bytes = result.bytes;
			assertActive();
			session.assertActive();
			let projection:
				| MailHeaderDisplay
				| MailNamespace
				| MailMessageMetadata
				| MailHeaderSearchResult
				| MailMimeAttachmentContent
				| Readonly<Pick<MailMimeContent, 'body'>>
				| readonly Readonly<Omit<MailMimeAttachmentContent, 'bytes'>>[]
				| undefined;
			if (mode === 'inspect') {
				if (result.kind !== 'examine' || !result.uidNext)
					throw new ImapConnectionError('MAIL_PROTOCOL');
				projection = Object.freeze({ uidValidity: result.uidValidity, uidNext: result.uidNext });
			} else if (mode === 'metadata') {
				if (result.kind !== 'metadata') throw new ImapConnectionError('MAIL_PROTOCOL');
				projection = Object.freeze({ receivedAt: result.receivedAt, sizeBytes: result.sizeBytes });
			} else if (mode === 'search') {
				if (result.kind !== 'search') throw new ImapConnectionError('MAIL_PROTOCOL');
				// The canonical session validates count, uniqueness, range and UID ordering.
				projection = Object.freeze({
					uidValidity: selected.uidValidity,
					references: Object.freeze(
						result.uids.map((uid) =>
							Object.freeze({
								accountId: request.accountId,
								accountRevision: request.accountRevision,
								mailbox: request.mailbox,
								uidValidity: selected.uidValidity,
								uid,
							})
						)
					),
				});
			} else {
				if (
					!bytes ||
					result.kind !== 'fetch' ||
					command.kind !== 'fetch' ||
					result.uid !== command.uid
				)
					throw new ImapConnectionError('MAIL_PROTOCOL');
				const byteLimit = needsSource
					? IMAP_FRAMING_LIMITS.literalBytes
					: IMAP_COMMAND_LIMITS.headerBytes;
				if (bytes.length > byteLimit) throw new ImapConnectionError('MAIL_LIMIT');
				assertActive();
				// Projection consumes the literal even when its restricted grammar rejects.
				// Keep this synchronous: no consumer sees a result between lease checks.
				if (mode === 'display') {
					projection = consumeMailHeaderDisplay(bytes);
					bytes = undefined;
				} else if (mode === 'body' || mode === 'manifest' || mode === 'attachment') {
					const content = consumeMailMimeContent(bytes);
					bytes = undefined; // The actual consumer erases source on every path.
					try {
						// Explicit projections never return the mixed body/attachment result.
						if (mode === 'attachment') {
							const attachment = content.attachments.find((item) => item.partId === partId);
							if (!attachment) throw new ImapConnectionError('MAIL_STALE');
							// Own selected bytes before constructing the result or calling host code.
							attachmentBytes = attachment.bytes;
							projection = Object.freeze({
								partId: attachment.partId,
								filename: attachment.filename,
								mimeType: attachment.mimeType,
								sizeBytes: attachment.sizeBytes,
								bytes: attachmentBytes,
							});
						} else
							projection =
								mode === 'body'
									? Object.freeze(content.body === undefined ? {} : { body: content.body })
									: Object.freeze(
											content.attachments.map((attachment) =>
												Object.freeze({
													partId: attachment.partId,
													filename: attachment.filename,
													mimeType: attachment.mimeType,
													sizeBytes: attachment.sizeBytes,
												})
											)
										);
					} finally {
						for (const attachment of content.attachments)
							if (attachment.bytes !== attachmentBytes) attachment.bytes.fill(0);
					}
				}
			}
			assertActive();
			// Closing can run synchronous host transport callbacks. Recheck while leased.
			session.close();
			session = undefined;
			assertActive();
			if (!projection && !bytes) throw new ImapConnectionError('MAIL_PROTOCOL');
			// Release also aborts synchronously. Retain owned bytes through final completion,
			// but detach our cleanup listener so ordinary release does not erase success.
			activeLease.signal.removeEventListener('abort', cancelRead);
			activeLease.release();
			lease = undefined;
			this.store.assertMailReadCompletion(
				this.pluginId,
				this.identity,
				request.accountId,
				request.accountRevision,
				agentId,
				right,
				() => {
					assertCaller();
					assertReference();
				}
			);
			// Final sealed reads can abort or overrun synchronously; no callbacks follow.
			assertLifetime();
			if (projection) {
				attachmentBytes = undefined; // Transfer after close, release and final live checks.
				return projection;
			}
			if (!bytes) throw new ImapConnectionError('MAIL_PROTOCOL');
			const transferred = bytes;
			bytes = undefined;
			return transferred;
		} catch (error) {
			bytes?.fill(0);
			attachmentBytes?.fill(0);
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		} finally {
			if (cancelCaller) callerSignal?.removeEventListener('abort', cancelCaller);
			lease?.signal.removeEventListener('abort', cancelRead);
			cancelRead();
			lease?.release();
		}
	}
}
