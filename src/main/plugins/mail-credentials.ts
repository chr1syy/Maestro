/**
 * Host-private credential slots; production setup, RPC and SDK remain unwired.
 * Authority callbacks MUST be bound by the host to live setup/account generations.
 * This module creates no authority and never exports a password getter.
 */
import { createHash } from 'crypto';
import { canonicalJson } from '../../shared/canonicalJson';
import { PLUGIN_ID_PATTERN } from '../../shared/plugins/plugin-manifest';
import { isValidAllowlistMember } from '../../shared/plugins/permissions';
import { createKeyringEntry, type KeyringEntry } from './authorization-ledger';
import { assertMailActivityAuthority } from './mail-account-activity';
import { assertImapQuotedString, IMAP_COMMAND_LIMITS } from './mail-imap-commands';
import { ImapConnectionError, type ImapConnection } from './mail-imap-connection';

const MAIL_CREDENTIAL_SERVICE = 'com.maestro.mail-credentials';

export interface MailCredentialIdentity {
	/** Stable host-owned installation ID from the canonical private sealed ledger. */
	readonly installationId: string;
	readonly pluginId: string;
	readonly accountId: string;
}

export interface MailCredentialAuthority {
	/** No default: setup gesture/nonce for writes, live read grant for LOGIN. */
	assertActive(): void;
	/** Account/setup generation cancellation, required for immediate pending LOGIN close. */
	readonly signal: AbortSignal;
}

/** One immutable exact-account slot. Methods are reachable only by trusted host code. */
export class MailCredentialSlot {
	private readonly slot: string;
	private operation?: AbortController;

	constructor(
		identity: MailCredentialIdentity,
		private readonly entryFactory: (
			service: string,
			account: string
		) => KeyringEntry | null = createKeyringEntry
	) {
		if (!identity || typeof identity !== 'object') throw new ImapConnectionError('MAIL_INVALID');
		const { installationId, pluginId, accountId } = identity;
		if (
			[installationId, accountId].some(
				(id) => !isValidAllowlistMember(id) || id.length > 128 || /[^\x21-\x7e]/.test(id)
			) ||
			typeof pluginId !== 'string' ||
			pluginId.length < 3 ||
			pluginId.length > 100 ||
			!PLUGIN_ID_PATTERN.test(pluginId)
		)
			throw new ImapConnectionError('MAIL_INVALID');
		// JSON tuple preserves boundaries; digest keeps native slot names bounded.
		this.slot = createHash('sha256')
			.update(canonicalJson([installationId, pluginId, accountId]))
			.digest('hex');
	}

	/** Fence this instance before any host/native callback; account queues remain canonical. */
	private beginOperation(): AbortController {
		if (this.operation) {
			// Poison the owner even when a native/authority callback catches this denial.
			// LOGIN registers close on this signal before capturing caller authority.
			this.operation.abort();
			throw new ImapConnectionError('MAIL_DENIED');
		}
		const operation = new AbortController();
		this.operation = operation;
		return operation;
	}

	/** One admitted lifetime for every slot operation, including synchronous native callbacks. */
	private captureAuthority(authority: MailCredentialAuthority): MailCredentialAuthority {
		try {
			const signal = authority?.signal;
			const check = authority?.assertActive;
			if (!(signal instanceof AbortSignal) || typeof check !== 'function')
				throw new ImapConnectionError('MAIL_DENIED');
			return Object.freeze({ signal, assertActive: check.bind(authority) });
		} catch {
			throw new ImapConnectionError('MAIL_DENIED');
		}
	}

	private assertActive(authority: MailCredentialAuthority): void {
		if (this.operation?.signal.aborted) throw new ImapConnectionError('MAIL_DENIED');
		if (!authority?.signal) throw new ImapConnectionError('MAIL_DENIED');
		if (authority?.signal?.aborted) throw new ImapConnectionError('MAIL_CANCELED');
		try {
			assertMailActivityAuthority(() => authority.assertActive());
		} catch {
			throw new ImapConnectionError('MAIL_DENIED');
		}
		if (this.operation?.signal.aborted) throw new ImapConnectionError('MAIL_DENIED');
		if (authority.signal?.aborted) throw new ImapConnectionError('MAIL_CANCELED');
	}

	private entry(authority: MailCredentialAuthority): KeyringEntry {
		this.assertActive(authority);
		let entry: KeyringEntry | null;
		try {
			entry = this.entryFactory(MAIL_CREDENTIAL_SERVICE, this.slot);
		} catch {
			throw new ImapConnectionError('MAIL_UNAVAILABLE');
		}
		this.assertActive(authority);
		if (!entry) throw new ImapConnectionError('MAIL_UNAVAILABLE');
		return entry;
	}

	private validPassword(password: unknown): password is string {
		try {
			assertImapQuotedString(password, IMAP_COMMAND_LIMITS.password);
			return true;
		} catch {
			return false;
		}
	}

	/** Only the future dedicated setup minter may supply this authority. No echo. */
	savePassword(password: string, authority: MailCredentialAuthority): void {
		let confirmed: string | null = null;
		let operation: AbortController | undefined;
		try {
			operation = this.beginOperation();
			const captured = this.captureAuthority(authority);
			this.assertActive(captured);
			if (!this.validPassword(password)) throw new ImapConnectionError('MAIL_INVALID');
			const entry = this.entry(captured);
			entry.setPassword(password);
			this.assertActive(captured);
			confirmed = entry.getPassword();
			this.assertActive(captured);
			if (confirmed !== password) throw new ImapConnectionError('MAIL_UNAVAILABLE');
			this.assertActive(captured);
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		} finally {
			password = '';
			confirmed = null;
			if (operation) this.operation = undefined;
		}
	}

	/** Trusted setup probe only: historical slot availability, never authentication/readiness. */
	assertPasswordAvailable(authority: MailCredentialAuthority): void {
		let password: string | null = null;
		let operation: AbortController | undefined;
		try {
			operation = this.beginOperation();
			const captured = this.captureAuthority(authority);
			const entry = this.entry(captured);
			password = entry.getPassword();
			this.assertActive(captured);
			if (!this.validPassword(password)) throw new ImapConnectionError('MAIL_UNAVAILABLE');
			this.assertActive(captured);
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		} finally {
			password = null;
			if (operation) this.operation = undefined;
		}
	}

	/** Cleanup authority may permit a tombstoned account; it must never enable reads. */
	removePassword(authority: MailCredentialAuthority): void {
		let operation: AbortController | undefined;
		try {
			operation = this.beginOperation();
			const captured = this.captureAuthority(authority);
			const entry = this.entry(captured);
			try {
				entry.deletePassword();
			} catch {
				throw new ImapConnectionError('MAIL_UNAVAILABLE');
			}
			this.assertActive(captured);
			try {
				// false can mean already absent. Confirm absence rather than report blind success.
				if (entry.getPassword() !== null) throw new Error();
			} catch {
				throw new ImapConnectionError('MAIL_UNAVAILABLE');
			}
			this.assertActive(captured);
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		} finally {
			if (operation) this.operation = undefined;
		}
	}

	/** Consume the secret solely through fixed LOGIN; never return it or arbitrary results. */
	async authenticate(
		session: ImapConnection,
		username: string,
		authority: MailCredentialAuthority
	): Promise<void> {
		let password: string | null = null;
		let captured: MailCredentialAuthority | undefined;
		let operation: AbortController | undefined;
		let detached = false;
		const cancel = () => {
			try {
				session.close();
			} catch {
				/* Never leak cleanup errors. */
			}
		};
		try {
			operation = this.beginOperation();
			operation.signal.addEventListener('abort', cancel, { once: true });
			// Capture once: caller field replacement cannot renew LOGIN authority or move cleanup.
			captured = this.captureAuthority(authority);
			this.assertActive(captured);
			captured.signal.addEventListener('abort', cancel, { once: true });
			const entry = this.entry(captured);
			try {
				password = entry.getPassword();
			} catch {
				throw new ImapConnectionError('MAIL_UNAVAILABLE');
			}
			this.assertActive(captured);
			if (!this.validPassword(password)) throw new ImapConnectionError('MAIL_UNAVAILABLE');
			session.assertActive();
			this.assertActive(captured);
			const pending = session.execute({ kind: 'login', username, password });
			password = null;
			const result = await pending;
			this.assertActive(captured);
			session.assertActive();
			this.assertActive(captured);
			if (result.kind !== 'status') throw new ImapConnectionError('MAIL_PROTOCOL');
			// Detach while still fenced, then deny cleanup reentry before LOGIN success.
			captured.signal.removeEventListener('abort', cancel);
			detached = true;
			this.assertActive(captured);
		} catch (error) {
			// Suppress completion after revocation even when the transport failed first.
			try {
				if (captured) this.assertActive(captured);
			} finally {
				cancel();
			}
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		} finally {
			password = null;
			try {
				if (!detached) captured?.signal.removeEventListener('abort', cancel);
			} catch {
				cancel();
			} finally {
				operation?.signal.removeEventListener('abort', cancel);
				if (operation) this.operation = undefined;
			}
		}
	}
}
