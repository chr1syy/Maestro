/**
 * Host-private confirmation and fixed facade dispatch for the dedicated setup frame.
 * Main must register the dedicated frame and provide real policy/gesture/lifecycle adapters.
 */
import { DURATION_MS } from '../../shared/duration';
import { isValidAllowlistMember } from '../../shared/plugins/permissions';
import { AuthorizationStore, type AuthIdentity, type KeyringEntry } from './authorization-ledger';
import { assertMailActivityAuthority } from './mail-account-activity';
import { MailAccountCredentials, type MailGrantAuthority } from './mail-account-credentials';
import { mailRecord, type MailAccountConfiguration } from './mail-account-config';
import { parseMailAuthIdentity } from './mail-account-ledger';
import { ConsentNonceRegistry, sameConsentSender, type ConsentSender } from './consent-minter';
import { ImapConnectionError } from './mail-imap-connection';
import { assertImapQuotedString, IMAP_COMMAND_LIMITS } from './mail-imap-commands';
import {
	parseMailSetupOperationIntent,
	requireMailSetupOperationTarget,
	type MailSetupOperationIntent,
} from './mail-setup-operation-intent';

export interface MailSetupConfirmationDeps {
	readonly store: AuthorizationStore;
	readonly pluginId: string;
	readonly identity: AuthIdentity;
	/** Synthetic native seam for later tests; never a facade or operation override. */
	readonly entryFactory?: (service: string, account: string) => KeyringEntry | null;
	/** Actual current main-owned setup frame, never a renderer-supplied frame token. */
	currentSender(): ConsentSender;
	/** Check registered surface, feature/consent/capabilities and plugin generation. */
	assertSurfaceActive(sender: ConsentSender, pluginId: string, identity: AuthIdentity): void;
	/** Observe a real user activation in this exact host frame; no request boolean. */
	assertUserGesture(sender: ConsentSender): void;
	/** Main's live agent membership, never plugin-provided identity assertions. */
	assertAgentActive(agentId: string): void;
}

interface SetupConfirmation {
	readonly sender: ConsentSender;
	readonly source: AbortSignal;
	readonly controller: AbortController;
	readonly nonce: string;
	readonly expiresAt: number;
	readonly intent: MailSetupOperationIntent;
	readonly onAbort: () => void;
	installationId?: string | null;
	started: boolean;
	timer?: ReturnType<typeof setTimeout>;
	canceled: boolean;
	released: boolean;
	checking: boolean;
}

/** One pending prompt/operation, with no persistent policy, task state or alternate runner. */
export class MailSetupConfirmation {
	private readonly store: AuthorizationStore;
	private readonly pluginId: string;
	private readonly identity: AuthIdentity;
	private readonly accounts: MailAccountCredentials;
	private readonly currentSender: MailSetupConfirmationDeps['currentSender'];
	private readonly checkSurface: MailSetupConfirmationDeps['assertSurfaceActive'];
	private readonly checkGesture: MailSetupConfirmationDeps['assertUserGesture'];
	private readonly checkAgent: MailSetupConfirmationDeps['assertAgentActive'];
	private readonly nonces = new ConsentNonceRegistry({ ttlMs: DURATION_MS.minute });
	private pending?: SetupConfirmation;
	private transitioning = false;
	private running = false;

	constructor(deps: MailSetupConfirmationDeps) {
		try {
			const {
				store,
				pluginId,
				identity,
				entryFactory,
				currentSender,
				assertSurfaceActive,
				assertUserGesture,
				assertAgentActive,
			} = deps;
			if (
				!(store instanceof AuthorizationStore) ||
				(entryFactory !== undefined && typeof entryFactory !== 'function') ||
				[currentSender, assertSurfaceActive, assertUserGesture, assertAgentActive].some(
					(callback) => typeof callback !== 'function'
				)
			)
				throw new ImapConnectionError('MAIL_DENIED');
			this.store = store;
			this.pluginId = pluginId;
			this.identity = parseMailAuthIdentity(identity);
			this.accounts = new MailAccountCredentials(store, pluginId, this.identity, entryFactory);
			this.currentSender = currentSender.bind(deps);
			this.checkSurface = assertSurfaceActive.bind(deps);
			this.checkGesture = assertUserGesture.bind(deps);
			this.checkAgent = assertAgentActive.bind(deps);
		} catch {
			throw new ImapConnectionError('MAIL_DENIED');
		}
	}

	private sender(value: unknown): ConsentSender {
		const raw = mailRecord(value, ['webContentsId', 'frameId', 'url']);
		if (
			![raw.webContentsId, raw.frameId].every(
				(id) => typeof id === 'number' && Number.isSafeInteger(id) && id >= 0
			) ||
			typeof raw.url !== 'string' ||
			!raw.url ||
			raw.url.length > 2048
		)
			throw new ImapConnectionError('MAIL_DENIED');
		return Object.freeze({
			webContentsId: raw.webContentsId as number,
			frameId: raw.frameId as number,
			url: raw.url,
		});
	}

	private detach(ticket: SetupConfirmation): void {
		if (this.pending === ticket) this.pending = undefined;
		this.nonces.consume(ticket.nonce, this.pluginId, []);
		ticket.source.removeEventListener('abort', ticket.onAbort);
		if (ticket.timer) clearTimeout(ticket.timer);
	}

	private cancel(ticket: SetupConfirmation): void {
		ticket.canceled = true;
		const transitioning = this.transitioning;
		this.transitioning = true;
		try {
			// Forget before abort callbacks; they cannot confirm or supersede this ticket.
			this.detach(ticket);
			ticket.controller.abort();
		} finally {
			this.transitioning = transitioning;
		}
	}

	/** Dedicated host close/navigation/destroy handlers must call this or abort source. */
	close(): void {
		if (this.pending) this.cancel(this.pending);
	}

	private lifetime(ticket: SetupConfirmation): void {
		if (this.pending !== ticket || ticket.canceled || ticket.source.aborted)
			throw new ImapConnectionError('MAIL_CANCELED');
		if (performance.now() >= ticket.expiresAt) throw new ImapConnectionError('MAIL_CANCELED');
	}

	private check(ticket: SetupConfirmation, afterRelease = false): void {
		try {
			this.lifetime(ticket);
			if (ticket.checking || (!afterRelease && ticket.released))
				throw new ImapConnectionError('MAIL_DENIED');
			ticket.checking = true;
			assertMailActivityAuthority(() => {
				if (!sameConsentSender(ticket.sender, this.sender(this.currentSender())))
					throw new ImapConnectionError('MAIL_DENIED');
				this.lifetime(ticket);
				assertMailActivityAuthority(() =>
					this.checkSurface(ticket.sender, this.pluginId, this.identity)
				);
				this.lifetime(ticket);
				// Null means authorized empty setup, not missing persistence or consent.
				const configuration = this.store.readMailConfiguration(this.pluginId, this.identity);
				this.lifetime(ticket);
				if (!sameConsentSender(ticket.sender, this.sender(this.currentSender())))
					throw new ImapConnectionError('MAIL_DENIED');
				this.lifetime(ticket);
				// Frame callbacks may synchronously mutate policy; no callback follows this gate.
				if (this.store.readMailConfiguration(this.pluginId, this.identity) !== configuration)
					throw new ImapConnectionError('MAIL_STALE');
				if (!ticket.started) {
					const installationId = configuration?.installationId ?? null;
					if (ticket.installationId !== undefined && ticket.installationId !== installationId)
						throw new ImapConnectionError('MAIL_STALE');
					requireMailSetupOperationTarget(configuration, ticket.intent);
					ticket.installationId = installationId;
				}
			});
			this.lifetime(ticket);
		} catch (error) {
			this.cancel(ticket);
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_DENIED'
			);
		} finally {
			ticket.checking = false;
		}
	}

	/**
	 * Main-owned issuance only. Capture intent before even superseded-ticket listeners.
	 * Confirmation routes only this snapshot through the owned canonical account facade.
	 * Never send the nonce to a plugin, ordinary tool, history or event.
	 */
	open(sender: unknown, source: AbortSignal, request: unknown): string {
		if (this.transitioning || this.running) throw new ImapConnectionError('MAIL_UNAVAILABLE');
		const expiresAt = performance.now() + DURATION_MS.minute;
		this.transitioning = true;
		let ticket: SetupConfirmation | undefined;
		try {
			const intent = parseMailSetupOperationIntent(request);
			const capturedSender = this.sender(sender);
			if (!(source instanceof AbortSignal) || source.aborted)
				throw new ImapConnectionError('MAIL_DENIED');
			// Superseded-ticket abort listeners must not retarget the new frame or reset its budget.
			// Invalid replacement inputs leave the existing prompt available.
			if (performance.now() >= expiresAt) throw new ImapConnectionError('MAIL_CANCELED');
			this.close();
			if (source.aborted || performance.now() >= expiresAt)
				throw new ImapConnectionError('MAIL_CANCELED');
			ticket = {
				sender: capturedSender,
				source,
				controller: new AbortController(),
				nonce: this.nonces.issue(this.pluginId, []),
				expiresAt,
				intent,
				onAbort: () => {
					if (ticket) this.cancel(ticket);
				},
				canceled: false,
				released: false,
				checking: false,
				started: false,
			};
			this.pending = ticket;
			ticket.timer = setTimeout(ticket.onAbort, Math.max(0, expiresAt - performance.now()));
			ticket.timer.unref();
			source.addEventListener('abort', ticket.onAbort, { once: true });
			if (source.aborted) this.cancel(ticket);
			this.check(ticket);
			return ticket.nonce;
		} catch (error) {
			if (ticket) this.cancel(ticket);
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_DENIED'
			);
		} finally {
			this.transitioning = false;
		}
	}

	/** No caller-selected work or result publication; facades own mutation and cleanup. */
	private async execute(
		intent: MailSetupOperationIntent,
		authority: MailGrantAuthority,
		password: string
	): Promise<MailAccountConfiguration> {
		if (intent.kind === 'savePassword') {
			try {
				// The canonical facade captures the secret and owns queue/cancellation cleanup.
				// Return without awaiting so this frame drops its copy before adoption settles.
				return this.accounts.savePassword(
					intent.accountId,
					intent.expectedRevision,
					password,
					authority
				);
			} finally {
				password = '';
			}
		}
		switch (intent.kind) {
			case 'replacePluginRights':
				return this.accounts.replacePluginRights(
					intent.accountId,
					intent.expectedRevision,
					intent.rights,
					authority
				);
			case 'test':
				return this.accounts.testAccount(intent.accountId, intent.expectedRevision, authority);
			case 'addDisabled':
				return this.accounts.addDisabledAccount(intent.settings, authority);
			case 'enable':
				return this.accounts.enableAccount(intent.accountId, intent.expectedRevision, authority);
			case 'replaceRights':
				return this.accounts.replaceAgentRights(
					intent.accountId,
					intent.expectedRevision,
					intent.agents,
					authority
				);
			case 'disable':
			case 'replaceSettings':
			case 'remove':
				return this.accounts.mutateAccount(intent, authority);
			case 'cleanupRemoved':
				return this.accounts.cleanupRemovedAccount(
					intent.accountId,
					intent.expectedRevision,
					authority
				);
			default:
				throw new ImapConnectionError('MAIL_INVALID');
		}
	}

	/** Main's actual sender only. Password input is accepted only at save confirmation. */
	async confirm(sender: unknown, request: unknown): Promise<void> {
		if (this.transitioning || this.running) throw new ImapConnectionError('MAIL_UNAVAILABLE');
		const ticket = this.pending;
		if (!ticket) throw new ImapConnectionError('MAIL_DENIED');
		this.running = true;
		let password = '';
		const clearPassword = () => {
			password = '';
		};
		try {
			const capturedSender = this.sender(sender);
			{
				// Capture before policy/gesture callbacks; never retain the input on a ticket.
				const raw = mailRecord(
					request,
					ticket.intent.kind === 'savePassword' ? ['nonce', 'password'] : ['nonce']
				);
				if (
					raw.nonce !== ticket.nonce ||
					!sameConsentSender(capturedSender, ticket.sender) ||
					!this.nonces.consume(ticket.nonce, this.pluginId, [])
				)
					throw new ImapConnectionError('MAIL_DENIED');
				if (ticket.intent.kind === 'savePassword') {
					assertImapQuotedString(raw.password, IMAP_COMMAND_LIMITS.password);
					password = raw.password;
				}
			}
			request = undefined;
			ticket.controller.signal.addEventListener('abort', clearPassword, { once: true });
			this.check(ticket);
			assertMailActivityAuthority(() => this.checkGesture(ticket.sender));
			this.check(ticket);
			const authority: MailGrantAuthority = Object.freeze({
				signal: ticket.controller.signal,
				assertActive: () => this.check(ticket),
				assertAgentActive: (agentId: string) => {
					try {
						this.check(ticket);
						if (!isValidAllowlistMember(agentId)) throw new ImapConnectionError('MAIL_DENIED');
						assertMailActivityAuthority(() => this.checkAgent(agentId));
						this.check(ticket);
					} catch (error) {
						this.cancel(ticket);
						throw new ImapConnectionError(
							error instanceof ImapConnectionError ? error.code : 'MAIL_DENIED'
						);
					}
				},
			});
			// Admission is against the original target until work starts. Facades own later
			// revision changes and completion latches; setup authority keeps checking lifetime.
			ticket.started = true;
			const work = this.execute(ticket.intent, authority, password);
			password = '';
			// Every facade carries its original commit through promise adoption. Never
			// resnapshot here and adopt an intervening target mutation as our success.
			const committed = await work;
			let accountId: string;
			if (ticket.intent.kind === 'addDisabled') {
				// The canonical add appends exactly one host-generated account to this commit.
				const account = committed.accounts[committed.accounts.length - 1];
				if (!account || account.revision !== 1 || account.enabled)
					throw new ImapConnectionError('MAIL_STALE');
				accountId = account.accountId;
			} else {
				accountId = ticket.intent.accountId;
			}
			this.store.assertMailMutationCompletion(
				this.pluginId,
				this.identity,
				committed,
				accountId,
				() => this.check(ticket),
				ticket.source
			);
			// Release listeners can close/abort/change policy. Keep original lifetime registered
			// through the final gate, without asserting the permanently released authority.
			ticket.released = true;
			ticket.controller.abort();
			this.store.assertMailMutationCompletion(
				this.pluginId,
				this.identity,
				committed,
				accountId,
				() => this.check(ticket, true),
				ticket.source
			);
			this.lifetime(ticket);
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_DENIED'
			);
		} finally {
			request = undefined;
			password = '';
			ticket.controller.signal.removeEventListener('abort', clearPassword);
			this.cancel(ticket);
			// Cancellation cannot force awaited host work to settle; retain the single slot.
			this.running = false;
		}
	}
}
