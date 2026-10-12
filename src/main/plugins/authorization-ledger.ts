/**
 * Plugin authorization ledger (main process) - the security gate.
 *
 * Replaces the old plain-JSON enable-state + grants files with ONE sealed,
 * profile-wide ledger plus a freshness anchor held OUTSIDE the rollable file
 * tree (the OS credential store). This is what upholds the contract: a plugin,
 * however installed, can never enable or grant itself by modifying files.
 *
 * Layers:
 *  - SEAL (confidentiality + integrity at rest): the ledger JSON is sealed with
 *    Electron `safeStorage`. A file-writer without the OS key cannot read it or
 *    produce a blob we accept.
 *  - FRESHNESS ANCHOR (anti-rollback): a monotonic `epoch` + per-install secret
 *    live in a NAMED OS credential entry. Every mint/revoke/uninstall bumps the
 *    epoch and writes it into both the ledger and the anchor. On load we require
 *    `ledger.epoch === anchor.epoch` and matching install secret, so restoring
 *    an OLD sealed ledger (a rollback) is rejected - its epoch is stale.
 *  - TOMBSTONES: uninstall/revoke records `{ pluginId, removedAtEpoch }`, so a
 *    re-appearing plugin folder is a fresh install (disabled, re-consent), never
 *    a silent re-enable.
 *  - FAIL-SAFE = SESSION-ONLY: if the seal or the anchor is unavailable (e.g. a
 *    keyring-less headless Linux), grants are NOT persisted as trusted. They live
 *    in memory for the session and are re-consented next launch. There is NO mode
 *    in which authorization persists silently without the anchor. Uniform on
 *    every OS.
 *
 * The store is dependency-injected (seal / anchor / paths / clock) so the
 * rollback, tombstone, tamper, and session-only paths are unit-testable with
 * fakes; production wiring (`createAuthorizationStore`) binds `safeStorage` and
 * the keyring.
 */

import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { assertSerializedJsonIsSafe } from '../../shared/jsonUtils';
import { isAllowlistScoped, isValidAllowlistMember } from '../../shared/plugins/permissions';
import type { PermissionGrant, PluginCapability } from '../../shared/plugins/permissions';
import type { SignatureStatus } from '../../shared/plugins/signing';
import { PLUGIN_ID_PATTERN } from '../../shared/plugins/plugin-manifest';
import {
	createDisabledMailAccount,
	changeMailAccountConfiguration,
	parseMailAccountMutation,
	parseMailAccountSettings,
	parseMailAccountConfiguration,
	requireMailAccountRevision,
	requireMailAccountTombstoneRevision,
	type MailAccountConfiguration,
	type PrivateMailAccount,
	type MailCredentialCleanupState,
} from './mail-account-config';
import {
	emptyMailLedgerState,
	parseMailLedgerState,
	parseMailAuthIdentity,
	MAIL_LEDGER_LIMITS,
	MAIL_AGENT_RIGHTS,
	parseMailAgentRights,
	type MailAccountAgentGrant,
	type MailAgentRight,
	type MailLedgerState,
} from './mail-account-ledger';
import { ImapConnectionError } from './mail-imap-connection';
import {
	MailAccountActivity,
	assertMailActivityAuthority,
	type MailActivityLease,
} from './mail-account-activity';

/** Schema version of the sealed ledger payload. */
export const LEDGER_VERSION = 2 as const;

/** The identity a grant is bound to: the file digest PLUS the signature/trust
 * identity. Trust status drives policy (the transcripts+egress conflict is only
 * enforced for untrusted plugins) and the signer is part of what the user
 * approved, so a post-consent signer/trust change must force re-consent even
 * when files are unchanged (the content digest excludes signature.json). */
export interface AuthIdentity {
	contentHash: string;
	signatureStatus: SignatureStatus;
	signerKey: string | null;
}

/** One plugin's persisted authorization. */
export interface LedgerEntry {
	/** User toggled it on (an explicit consent gesture minted this). */
	enabled: boolean;
	/** The exact capability set the user approved (subset of the manifest's). */
	caps: PermissionGrant[];
	/** Identity (content digest + signature/trust) bound at consent time. Any
	 * change → the verifier disables the plugin → re-consent. */
	identity: AuthIdentity;
	/** When this entry was last minted (audit). */
	mintedAt: number;
}

/** A removed/revoked plugin - blocks silent re-enable of a restored folder. */
export interface Tombstone {
	pluginId: string;
	removedAtEpoch: number;
}

/** The full sealed ledger. */
export interface AuthorizationLedger {
	version: typeof LEDGER_VERSION;
	/** Monotonic; mirrored in the anchor. A regression means a rollback. */
	epoch: number;
	/** Binds the ledger to this install's anchor; mismatch → re-consent. */
	installSecret: string;
	entries: Record<string, LedgerEntry>;
	tombstones: Tombstone[];
	/** Private configuration and stored agent policy; never credentials or caller proof. */
	mail: MailLedgerState;
}

/** The freshness anchor stored in the OS credential vault. */
export interface Anchor {
	installSecret: string;
	epoch: number;
}

/** Seals/unseals bytes via an OS-key-backed primitive (safeStorage). */
export interface SealProvider {
	available(): boolean;
	seal(plaintext: string): Buffer;
	unseal(blob: Buffer): string;
}

export interface SafeStorageLike {
	isEncryptionAvailable(): boolean;
	encryptString(s: string): Buffer;
	decryptString(b: Buffer): string;
}

/** Named credential-store slot for the anchor, OUTSIDE the data-dir file tree. */
export interface AnchorStore {
	available(): boolean;
	read(): Anchor | null;
	write(anchor: Anchor): void;
	clear(): void;
}

export interface AuthorizationStoreDeps {
	seal: SealProvider;
	anchor: AnchorStore;
	/** Absolute path of the sealed ledger file. */
	ledgerPath: string;
	now?: () => number;
	newSecret?: () => string;
}

/** Why the persisted ledger was not trusted this session (for UI / audit). */
export type LedgerTrustState =
	| 'persistent' // sealed + anchored + fresh: trusted, persists across restarts
	| 'session-only' // seal/anchor unavailable: in-memory grants, re-consent next launch
	| 're-consent'; // tamper / rollback / anchor mismatch: persisted state dropped

function emptyLedger(installSecret: string): AuthorizationLedger {
	return {
		version: LEDGER_VERSION,
		epoch: 0,
		installSecret,
		entries: {},
		tombstones: [],
		mail: emptyMailLedgerState(),
	};
}

type LoadedLedger = Omit<AuthorizationLedger, 'version' | 'mail'> &
	({ version: 1 } | { version: 2; mail: MailLedgerState });

function isLedger(value: unknown): value is LoadedLedger {
	if (typeof value !== 'object' || value === null) return false;
	const allowed = ['version', 'epoch', 'installSecret', 'entries', 'tombstones', 'mail'];
	if (Object.keys(value).some((key) => !allowed.includes(key))) return false;
	if (
		!('version' in value) ||
		!('epoch' in value) ||
		!('installSecret' in value) ||
		!('entries' in value) ||
		!('tombstones' in value)
	) {
		return false;
	}
	return (
		(value.version === 1
			? !('mail' in value)
			: value.version === LEDGER_VERSION && 'mail' in value) &&
		typeof value.epoch === 'number' &&
		Number.isSafeInteger(value.epoch) &&
		value.epoch >= 0 &&
		typeof value.installSecret === 'string' &&
		typeof value.entries === 'object' &&
		value.entries !== null &&
		!Array.isArray(value.entries) &&
		Array.isArray(value.tombstones)
	);
}

/** Why a plugin's verification resolved the way it did (for the UI / audit). */
export type VerifyReason = 'ok' | 'not-authorized' | 'identity-changed' | 'removed';

/** Result of verifying a discovered plugin against its consented authorization. */
export interface VerifyResult {
	authorized: boolean;
	reason: VerifyReason;
	/** Caps to hand the broker - empty unless `authorized`. */
	caps: PermissionGrant[];
}

export function shouldDisablePluginForVerifyResult(result: VerifyResult): boolean {
	return !result.authorized;
}

/**
 * The authorization gate. Holds the verified in-memory view of the ledger plus,
 * in session-only mode, the ephemeral grants minted this run.
 */

export class AuthorizationStore {
	private readonly seal: SealProvider;
	private readonly anchor: AnchorStore;
	private readonly ledgerPath: string;
	private readonly now: () => number;
	private readonly newSecret: () => string;

	/** The trusted view. In persistent mode this mirrors disk; in session-only
	 * mode it starts empty and accumulates this run's grants (never written). */
	private ledger: AuthorizationLedger;
	private storageMode: 'persistent' | 'session-only';
	private droppedPriorState = false;
	private loaded = false;
	private mailPersistenceFailed = false;
	private readonly mailActivity = new MailAccountActivity();

	constructor(deps: AuthorizationStoreDeps) {
		this.seal = deps.seal;
		this.anchor = deps.anchor;
		this.ledgerPath = deps.ledgerPath;
		this.now = deps.now ?? (() => Date.now());
		this.newSecret = deps.newSecret ?? (() => randomBytes(32).toString('base64url'));
		this.ledger = emptyLedger('');
		this.storageMode = 'session-only';
	}

	/**
	 * Reporting state for the Plugins UI / audit log:
	 *  - `session-only`  storage unavailable → grants live in memory, re-consent next launch
	 *  - `re-consent`    persistent storage, but prior persisted state was dropped at load
	 *                    (tamper / rollback / anchor mismatch) so plugins need re-approval
	 *  - `persistent`    sealed + anchored + fresh; grants persist across restarts
	 */
	trustState(): LedgerTrustState {
		this.ensureLoaded();
		if (this.storageMode === 'session-only') return 'session-only';
		return this.droppedPriorState ? 're-consent' : 'persistent';
	}

	/** True ONLY when authorization cannot persist at all (no seal / no anchor). This
	 * is storage mode, NOT the transient re-consent signal: a re-consent load still
	 * persists once the user re-approves, so it reports false here. */
	isSessionOnly(): boolean {
		this.ensureLoaded();
		return this.storageMode === 'session-only';
	}

	/** True when the prior persisted ledger was dropped at load (tamper / rollback /
	 * anchor mismatch); the UI should prompt re-approval. Cleared once a fresh
	 * authoritative write re-establishes the ledger. */
	priorStateDropped(): boolean {
		this.ensureLoaded();
		return this.droppedPriorState;
	}

	/**
	 * Load + verify the persisted ledger once. Any failure (no seal, no anchor,
	 * tamper, rollback, anchor mismatch) fails safe: the in-memory ledger starts
	 * empty and nothing persisted is trusted until the user re-consents.
	 */
	private ensureLoaded(): void {
		if (this.loaded) return;
		this.loaded = true;

		// No seal or no anchor → session-only. We cannot verify freshness, so we
		// refuse to silently honor anything on disk.
		if (!this.seal.available() || !this.anchor.available()) {
			this.ledger = emptyLedger(this.newSecret());
			this.storageMode = 'session-only';
			return;
		}

		const anchor = this.anchor.read();
		if (!anchor) {
			this.ledger = emptyLedger(this.newSecret());
			this.storageMode = 'persistent';
			if (fs.existsSync(this.ledgerPath)) {
				// Existing sealed bytes without the keyring freshness anchor are
				// untrustworthy. Do not persist here: persisting would clear
				// droppedPriorState and silently bless a replacement anchor before the
				// user re-consents. The next mint writes a fresh authoritative ledger.
				this.droppedPriorState = true;
				return;
			}
			this.persist(); // clean first run: establish anchor at epoch 0
			return;
		}

		let parsed: unknown = null;
		try {
			// Bound the opened file, including a concurrent growth, before decrypting.
			const fd = fs.openSync(this.ledgerPath, 'r');
			let blob: Buffer;
			try {
				const size = fs.fstatSync(fd).size;
				if (!Number.isSafeInteger(size) || size < 1 || size > MAIL_LEDGER_LIMITS.ciphertextBytes)
					throw new Error();
				blob = Buffer.alloc(size);
				let offset = 0;
				while (offset < size) {
					const count = fs.readSync(fd, blob, offset, size - offset, null);
					if (!count) throw new Error();
					offset += count;
				}
				if (fs.readSync(fd, Buffer.alloc(1), 0, 1, null)) throw new Error();
			} finally {
				fs.closeSync(fd);
			}
			const plaintext = this.seal.unseal(blob);
			if (
				plaintext.length > MAIL_LEDGER_LIMITS.plaintextBytes ||
				Buffer.byteLength(plaintext) > MAIL_LEDGER_LIMITS.plaintextBytes
			)
				throw new Error();
			parsed = JSON.parse(plaintext);
			if (isLedger(parsed) && parsed.version === 2) parsed.mail = parseMailLedgerState(parsed.mail);
		} catch {
			parsed = null; // missing, unsealable (tampered/foreign), or unparseable
		}

		if (
			!isLedger(parsed) ||
			parsed.installSecret !== anchor.installSecret || // anchor reset / foreign ledger
			parsed.epoch !== anchor.epoch // ROLLBACK: restored an old sealed ledger
		) {
			// Drop the untrusted persisted state; keep the anchor authoritative.
			// Re-mint the ledger empty at the anchor's epoch so future writes are
			// consistent, but the user must re-consent for any plugin.
			this.ledger = emptyLedger(anchor.installSecret);
			this.ledger.epoch = anchor.epoch;
			this.storageMode = 'persistent';
			this.droppedPriorState = true;
			return;
		}

		this.ledger = {
			...parsed,
			version: LEDGER_VERSION,
			mail: parsed.version === 1 ? emptyMailLedgerState() : parsed.mail,
		};
		this.storageMode = 'persistent';
		if (parsed.version === 1) {
			// Only an already fresh anchored v1 consent is migrated. No mail rights.
			this.bump();
			this.persist();
		}
	}

	/** Seal + write the ledger and bump/write the anchor. No-op in session-only
	 * mode (nothing is ever written to disk or the credential store then). */
	private persist(): void {
		if (this.storageMode === 'session-only') return;
		try {
			if (!this.seal.available() || !this.anchor.available()) throw new Error();
			const plaintext = JSON.stringify(this.ledger);
			assertSerializedJsonIsSafe(plaintext, 'authorization ledger');
			if (Buffer.byteLength(plaintext) > MAIL_LEDGER_LIMITS.plaintextBytes) throw new Error();
			const blob = this.seal.seal(plaintext);
			if (!blob.length || blob.length > MAIL_LEDGER_LIMITS.ciphertextBytes) throw new Error();
			// Anchor first: a locked/unavailable credential store throws here, before
			// we commit a ledger file the anchor can't vouch for.
			this.anchor.write({ installSecret: this.ledger.installSecret, epoch: this.ledger.epoch });
			const confirmed = this.anchor.read();
			if (
				confirmed?.installSecret !== this.ledger.installSecret ||
				confirmed.epoch !== this.ledger.epoch
			)
				throw new Error();
			const dir = path.dirname(this.ledgerPath);
			if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
			const tmp = `${this.ledgerPath}.tmp`;
			fs.writeFileSync(tmp, blob, { mode: 0o600 });
			fs.renameSync(tmp, this.ledgerPath);
			this.droppedPriorState = false;
		} catch {
			// Seal / anchor / disk failure (locked keyring, read-only disk, …). Fail
			// safe: degrade to session-only so this run's grants live only in memory
			// and nothing is left half-persisted. Any partial write is caught next
			// launch by the epoch check → re-consent.
			this.storageMode = 'session-only';
			this.mailPersistenceFailed = true;
			this.mailActivity.stop();
		}
	}

	/** Advance the monotonic epoch for any authoritative mutation. */
	private bump(): void {
		if (!Number.isSafeInteger(this.ledger.epoch) || this.ledger.epoch >= Number.MAX_SAFE_INTEGER)
			throw new ImapConnectionError('MAIL_UNAVAILABLE');
		this.ledger.epoch += 1;
	}

	/** Trusted-host only. Configuration is private and confers no mail authority. */
	readMailConfiguration(pluginId: string, current: AuthIdentity): MailAccountConfiguration | null {
		try {
			current = parseMailAuthIdentity(current);
			if (
				typeof pluginId !== 'string' ||
				pluginId.length < 3 ||
				pluginId.length > 100 ||
				!PLUGIN_ID_PATTERN.test(pluginId)
			)
				throw new ImapConnectionError('MAIL_INVALID');
			this.ensureLoaded();
			if (
				this.storageMode !== 'persistent' ||
				this.droppedPriorState ||
				this.mailPersistenceFailed ||
				!this.seal.available() ||
				!this.anchor.available()
			)
				throw new ImapConnectionError('MAIL_UNAVAILABLE');
			const anchor = this.anchor.read();
			if (anchor?.installSecret !== this.ledger.installSecret || anchor.epoch !== this.ledger.epoch)
				throw new ImapConnectionError('MAIL_UNAVAILABLE');
			const verified = this.verify(
				pluginId,
				current,
				this.readGrants(pluginId).map((c) => c.capability)
			);
			if (!verified.authorized) throw new ImapConnectionError('MAIL_DENIED');
			const entry = this.ledger.mail.configurations.find(
				(c) => c.configuration.pluginId === pluginId
			);
			if (!entry) return null;
			if (
				entry.identity.contentHash !== current.contentHash ||
				entry.identity.signatureStatus !== current.signatureStatus ||
				entry.identity.signerKey !== current.signerKey
			)
				throw new ImapConnectionError('MAIL_DENIED');
			return entry.configuration;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Synchronous trusted setup only: append a disabled account, never edit/enable/grant. */
	addDisabledMailAccount(
		pluginId: string,
		current: AuthIdentity,
		settings: unknown,
		assertSetupActive: () => void
	): MailAccountConfiguration {
		try {
			// Direct host callers need the same pre-callback snapshot as the setup facade.
			const snapshot = parseMailAccountSettings(settings);
			current = parseMailAuthIdentity(current);
			assertMailActivityAuthority(assertSetupActive);
			const existing = this.readMailConfiguration(pluginId, current);
			const configuration = parseMailAccountConfiguration(
				JSON.stringify({
					version: 1,
					installationId: this.ledger.mail.installationId,
					pluginId,
					accounts: [...(existing?.accounts ?? []), createDisabledMailAccount(snapshot)],
					tombstones: existing?.tombstones ?? [],
				})
			);
			const grants =
				this.ledger.mail.configurations.find((c) => c.configuration.pluginId === pluginId)
					?.agentGrants ?? [];
			assertMailActivityAuthority(assertSetupActive);
			if (this.readMailConfiguration(pluginId, current) !== existing)
				throw new ImapConnectionError('MAIL_STALE');
			const saved = this.saveMailConfiguration(
				pluginId,
				current,
				configuration,
				grants,
				assertSetupActive
			);
			assertMailActivityAuthority(assertSetupActive);
			if (
				this.readMailConfiguration(pluginId, current) !== saved ||
				JSON.stringify(saved) !== JSON.stringify(configuration)
			)
				throw new ImapConnectionError('MAIL_STALE');
			return saved;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Stored summaries only; no credential probing or claim of operational readiness. */
	listStoredMailAccounts(
		pluginId: string,
		current: AuthIdentity
	): readonly Readonly<
		Pick<PrivateMailAccount, 'accountId' | 'revision' | 'enabled' | 'mailboxes'>
	>[] {
		const configuration = this.readMailConfiguration(pluginId, current);
		return Object.freeze(
			(configuration?.accounts ?? []).map((account) =>
				Object.freeze({
					accountId: account.accountId,
					revision: account.revision,
					enabled: account.enabled,
					mailboxes: account.mailboxes,
				})
			)
		);
	}

	/** Pure trusted-host stored policy view, never effective rights or live membership. */
	readStoredMailAgentRights(
		pluginId: string,
		current: AuthIdentity,
		accountId: string,
		expectedRevision: number
	): MailAccountAgentGrant {
		try {
			const identity = parseMailAuthIdentity(current);
			const configuration = this.readMailConfiguration(pluginId, identity);
			const account = requireMailAccountRevision(configuration, accountId, expectedRevision, true);
			const grant = this.ledger.mail.configurations
				.find((entry) => entry.configuration.pluginId === pluginId)!
				.agentGrants.find((grant) => grant.accountId === account.accountId);
			if (grant && grant.accountRevision !== account.revision)
				throw new ImapConnectionError('MAIL_STALE');
			const result = Object.freeze({
				accountId: account.accountId,
				accountRevision: account.revision,
				// Copy through the closed parser: expose no aliases into the sealed ledger.
				agents: parseMailAgentRights(grant?.agents ?? []),
			});
			if (this.readMailConfiguration(pluginId, identity) !== configuration)
				throw new ImapConnectionError('MAIL_STALE');
			return result;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Trusted-host seam: live setup/lease authority also guards the canonical commit. */
	mutateMailAccount(
		pluginId: string,
		current: AuthIdentity,
		mutation: unknown,
		assertSetupActive: () => void
	): MailAccountConfiguration {
		try {
			const snapshot = parseMailAccountMutation(mutation);
			const identity = parseMailAuthIdentity(current);
			assertMailActivityAuthority(assertSetupActive);
			const configuration = this.readMailConfiguration(pluginId, identity);
			if (!configuration) throw new ImapConnectionError('MAIL_DENIED');
			const changed = changeMailAccountConfiguration(configuration, snapshot);
			const entry = this.ledger.mail.configurations.find(
				(c) => c.configuration.pluginId === pluginId
			)!;
			return this.saveMailConfiguration(
				pluginId,
				identity,
				changed.configuration,
				entry.agentGrants.filter((g) => g.accountId !== changed.accountId),
				assertSetupActive
			);
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Unwired trusted-host intent only; use queued credential composition, never RPC directly. */
	enableMailAccount(
		pluginId: string,
		current: AuthIdentity,
		accountId: string,
		expectedRevision: number,
		assertSetupActive: () => void
	): MailAccountConfiguration {
		try {
			const identity = parseMailAuthIdentity(current);
			assertMailActivityAuthority(assertSetupActive);
			const prior = this.readMailConfiguration(pluginId, identity);
			const account = requireMailAccountRevision(prior, accountId, expectedRevision);
			if (account.enabled) throw new ImapConnectionError('MAIL_DENIED');
			assertMailActivityAuthority(assertSetupActive);
			if (this.readMailConfiguration(pluginId, identity) !== prior)
				throw new ImapConnectionError('MAIL_STALE');
			const configuration = parseMailAccountConfiguration(
				JSON.stringify({
					...prior,
					accounts: prior!.accounts.map((a) =>
						a.accountId === accountId ? { ...a, enabled: true, revision: a.revision + 1 } : a
					),
				})
			);
			// Enabling must not revive policy stored while disabled or at an older revision.
			const grants = this.ledger.mail.configurations
				.find((entry) => entry.configuration.pluginId === pluginId)!
				.agentGrants.filter((grant) => grant.accountId !== accountId);
			const saved = this.saveMailConfiguration(
				pluginId,
				identity,
				configuration,
				grants,
				assertSetupActive
			);
			assertMailActivityAuthority(assertSetupActive);
			const enabled = saved.accounts.find((a) => a.accountId === accountId);
			if (
				this.readMailConfiguration(pluginId, identity) !== saved ||
				saved.installationId !== prior!.installationId ||
				!enabled?.enabled ||
				enabled.revision !== expectedRevision + 1
			)
				throw new ImapConnectionError('MAIL_STALE');
			return saved;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** One synchronous canonical commit; cancels affected readers before changing state. */
	private saveMailConfiguration(
		pluginId: string,
		current: AuthIdentity,
		configuration: MailAccountConfiguration,
		agentGrants: readonly MailAccountAgentGrant[],
		assertSetupActive: () => void
	): MailAccountConfiguration {
		// Snapshot before callbacks/native freshness so reentrant commits cannot be lost.
		const priorMail = this.ledger.mail;
		const priorEpoch = this.ledger.epoch;
		assertMailActivityAuthority(assertSetupActive);
		const mail = parseMailLedgerState({
			installationId: priorMail.installationId,
			configurations: [
				...priorMail.configurations.filter((c) => c.configuration.pluginId !== pluginId),
				{ identity: parseMailAuthIdentity(current), configuration, agentGrants },
			],
		});
		const prior = this.readMailConfiguration(pluginId, current);
		for (const account of prior?.accounts ?? []) {
			const next = configuration.accounts.find((a) => a.accountId === account.accountId);
			if (!next || next.revision !== account.revision)
				this.mailActivity.invalidateAccount(pluginId, account.accountId);
		}
		// Abort listeners run synchronously; they must not let a reentrant revoke be overwritten.
		if (this.readMailConfiguration(pluginId, current) !== prior)
			throw new ImapConnectionError('MAIL_STALE');
		assertMailActivityAuthority(assertSetupActive);
		// No callback or native work follows this gate before the in-memory replacement.
		if (this.ledger.mail !== priorMail || this.ledger.epoch !== priorEpoch)
			throw new ImapConnectionError('MAIL_STALE');
		this.bump();
		this.ledger.mail = mail;
		this.persist();
		// Failure permanently stops mail in this process, including later plugin re-consent.
		const saved = this.readMailConfiguration(pluginId, current);
		if (!saved) throw new ImapConnectionError('MAIL_UNAVAILABLE');
		assertMailActivityAuthority(assertSetupActive);
		if (this.ledger.mail !== mail || this.ledger.epoch !== priorEpoch + 1)
			throw new ImapConnectionError('MAIL_STALE');
		return saved;
	}

	/** Shared live caller/stored-right gate; external assertions must return undefined synchronously. */
	private mailReadAuthority(
		pluginId: string,
		current: AuthIdentity,
		accountId: string,
		expectedRevision: number,
		agentId: string,
		right: MailAgentRight,
		assertAuthorized: () => void
	): () => void {
		const identity = parseMailAuthIdentity(current);
		return () =>
			assertMailActivityAuthority(() => {
				assertMailActivityAuthority(assertAuthorized);
				this.assertStoredMailAgentRight(
					pluginId,
					identity,
					accountId,
					expectedRevision,
					agentId,
					right
				);
				assertMailActivityAuthority(assertAuthorized);
				// The last host callback can change exact-account rights synchronously.
				this.assertStoredMailAgentRight(
					pluginId,
					identity,
					accountId,
					expectedRevision,
					agentId,
					right
				);
			});
	}

	/** Unwired host read/watch seam. Callback must prove live caller, feature and broker gates. */
	acquireMailActivity(
		pluginId: string,
		current: AuthIdentity,
		accountId: string,
		expectedRevision: number,
		agentId: string,
		right: MailAgentRight,
		assertAuthorized: () => void
	): MailActivityLease {
		const identity = parseMailAuthIdentity(current);
		const check = this.mailReadAuthority(
			pluginId,
			identity,
			accountId,
			expectedRevision,
			agentId,
			right,
			assertAuthorized
		);
		// Validate stored ownership before allocating a key; live callbacks run only
		// inside guarded activity admission, where recursive issuance can cancel it.
		this.assertStoredMailAgentRight(
			pluginId,
			identity,
			accountId,
			expectedRevision,
			agentId,
			right
		);
		return this.mailActivity.acquire(pluginId, accountId, check);
	}

	/** Host-only final read gate after cleanup; no fresh admission or latch recovery. */
	assertMailReadCompletion(
		pluginId: string,
		current: AuthIdentity,
		accountId: string,
		expectedRevision: number,
		agentId: string,
		right: MailAgentRight,
		assertAuthorized: () => void
	): void {
		this.mailActivity.assertCompletion(
			pluginId,
			accountId,
			this.mailReadAuthority(
				pluginId,
				current,
				accountId,
				expectedRevision,
				agentId,
				right,
				assertAuthorized
			)
		);
	}

	/** Final queued setup gate; committed intent is never operational readiness. */
	assertMailMutationCompletion(
		pluginId: string,
		current: AuthIdentity,
		committed: MailAccountConfiguration,
		accountId: string,
		assertSetupActive: () => void,
		signal: AbortSignal
	): void {
		try {
			if (!(signal instanceof AbortSignal)) throw new ImapConnectionError('MAIL_DENIED');
			const identity = parseMailAuthIdentity(current);
			const account = committed.accounts.find((a) => a.accountId === accountId);
			const tombstone = committed.tombstones.find((a) => a.accountId === accountId);
			if (committed.pluginId !== pluginId || (!account && !tombstone))
				throw new ImapConnectionError('MAIL_STALE');
			const assertCommitted = () => {
				if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
				const configuration = this.readMailConfiguration(pluginId, identity);
				if (configuration?.installationId !== committed.installationId)
					throw new ImapConnectionError('MAIL_STALE');
				if (account) {
					const stored = requireMailAccountRevision(
						configuration,
						accountId,
						account.revision,
						true
					);
					if (stored.enabled !== account.enabled) throw new ImapConnectionError('MAIL_STALE');
				} else if (tombstone) {
					const stored = requireMailAccountTombstoneRevision(
						configuration,
						accountId,
						tombstone.revision
					);
					if (stored.credentialCleanup !== tombstone.credentialCleanup)
						throw new ImapConnectionError('MAIL_STALE');
				}
				if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			};
			// Cleanup already released the queue lease. Never acquire or assert it again.
			this.mailActivity.assertCompletion(pluginId, accountId, () => {
				if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
				assertMailActivityAuthority(assertSetupActive);
				assertCommitted();
				assertMailActivityAuthority(assertSetupActive);
				assertCommitted();
			});
		} catch (error) {
			// Trusted queued callers already completed admitted work. Retain failure
			// even if its successful queue settlement pruned the account state.
			this.mailActivity.failAccountMutation(pluginId, accountId);
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Unwired trusted-setup seam; no nonce/gesture/caller authority is minted here. */
	enqueueMailAccountMutation(
		pluginId: string,
		current: AuthIdentity,
		accountId: string,
		expectedRevision: number,
		assertSetupActive: () => void,
		signal: AbortSignal,
		work: (lease: MailActivityLease) => Promise<void>
	): Promise<void> {
		if (!(signal instanceof AbortSignal)) throw new ImapConnectionError('MAIL_DENIED');
		if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
		const identity = parseMailAuthIdentity(current);
		const check = () =>
			assertMailActivityAuthority(() => {
				if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
				assertMailActivityAuthority(assertSetupActive);
				if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
				this.readMailConfiguration(pluginId, identity);
				assertMailActivityAuthority(assertSetupActive);
				if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			});
		// Validate stored target before allocation; setup callbacks run inside guarded admission.
		requireMailAccountRevision(
			this.readMailConfiguration(pluginId, identity),
			accountId,
			expectedRevision
		);
		return this.mailActivity.enqueueMutation(pluginId, accountId, check, signal, async (lease) => {
			// Recheck at queue drain, but not after our own revision advance/removal.
			requireMailAccountRevision(
				this.readMailConfiguration(pluginId, identity),
				accountId,
				expectedRevision
			);
			lease.assertActive();
			return work(lease);
		});
	}

	/** Unwired exact-tombstone cleanup only; never resets an activity failure latch. */
	enqueueRemovedMailAccountCleanup(
		pluginId: string,
		current: AuthIdentity,
		accountId: string,
		expectedRevision: number,
		assertSetupActive: () => void,
		signal: AbortSignal,
		work: (lease: MailActivityLease) => Promise<void>
	): Promise<void> {
		if (!(signal instanceof AbortSignal)) throw new ImapConnectionError('MAIL_DENIED');
		if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
		const identity = parseMailAuthIdentity(current);
		// Stored removal validation precedes allocation, without an unfenced setup callback.
		const configuration = this.readMailConfiguration(pluginId, identity);
		requireMailAccountTombstoneRevision(configuration, accountId, expectedRevision);
		const installationId = configuration!.installationId;
		const assertStoredRemoval = () => {
			const current = this.readMailConfiguration(pluginId, identity);
			requireMailAccountTombstoneRevision(current, accountId, expectedRevision);
			if (current!.installationId !== installationId) throw new ImapConnectionError('MAIL_STALE');
		};
		const check = () =>
			assertMailActivityAuthority(() => {
				if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
				assertMailActivityAuthority(assertSetupActive);
				if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
				assertStoredRemoval();
				assertMailActivityAuthority(assertSetupActive);
				if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
				// Host callbacks can reenter: revalidate after their final call too.
				assertStoredRemoval();
				if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			});
		return this.mailActivity.enqueueMutation(pluginId, accountId, check, signal, async (lease) => {
			lease.assertActive();
			await work(lease);
			lease.assertActive();
		});
	}

	/**
	 * Unwired queued credential composition only. Pending commits precede native work;
	 * confirmedAbsent may be recorded only after exact-slot deletion/readback.
	 * Neither outcome changes removal revisions, grants or activity stop latches.
	 */
	recordRemovedMailCredentialCleanup(
		pluginId: string,
		current: AuthIdentity,
		accountId: string,
		expectedRevision: number,
		credentialCleanup: MailCredentialCleanupState,
		assertSetupActive: () => void
	): MailAccountConfiguration {
		try {
			if (credentialCleanup !== 'pending' && credentialCleanup !== 'confirmedAbsent')
				throw new ImapConnectionError('MAIL_INVALID');
			const identity = parseMailAuthIdentity(current);
			assertMailActivityAuthority(assertSetupActive);
			const prior = this.readMailConfiguration(pluginId, identity);
			requireMailAccountTombstoneRevision(prior, accountId, expectedRevision);
			assertMailActivityAuthority(assertSetupActive);
			// A callback may reenter consent/account paths; never overwrite its changes.
			if (this.readMailConfiguration(pluginId, identity) !== prior)
				throw new ImapConnectionError('MAIL_STALE');
			const configuration = parseMailAccountConfiguration(
				JSON.stringify({
					...prior,
					tombstones: prior!.tombstones.map((tombstone) =>
						tombstone.accountId === accountId ? { ...tombstone, credentialCleanup } : tombstone
					),
				})
			);
			const grants = this.ledger.mail.configurations.find(
				(entry) => entry.configuration.pluginId === pluginId
			)!.agentGrants;
			const saved = this.saveMailConfiguration(
				pluginId,
				identity,
				configuration,
				grants,
				assertSetupActive
			);
			assertMailActivityAuthority(assertSetupActive);
			if (this.readMailConfiguration(pluginId, identity) !== saved)
				throw new ImapConnectionError('MAIL_STALE');
			return saved;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Host setup seam only. Replaces ONE account's policy; [] revokes all its agents. */
	replaceMailAgentRights(
		pluginId: string,
		current: AuthIdentity,
		accountId: string,
		expectedRevision: number,
		agents: unknown,
		assertSetupActive: () => void
	): MailAccountConfiguration {
		try {
			// Capture intent before identity accessors or live/native checks can retarget it.
			const checkedAgents = parseMailAgentRights(agents);
			current = parseMailAuthIdentity(current);
			assertMailActivityAuthority(assertSetupActive);
			const configuration = this.readMailConfiguration(pluginId, current);
			const account = requireMailAccountRevision(configuration, accountId, expectedRevision);
			if (!configuration) throw new ImapConnectionError('MAIL_DENIED');
			const revision = account.revision + 1;
			const updated = parseMailAccountConfiguration(
				JSON.stringify({
					...configuration,
					accounts: configuration.accounts.map((a) =>
						a.accountId === accountId ? { ...a, revision } : a
					),
				})
			);
			const existing = this.ledger.mail.configurations.find(
				(c) => c.configuration.pluginId === pluginId
			)!;
			const grants = existing.agentGrants.filter((g) => g.accountId !== accountId);
			if (checkedAgents.length)
				grants.push({ accountId, accountRevision: revision, agents: checkedAgents });
			assertMailActivityAuthority(assertSetupActive);
			if (this.readMailConfiguration(pluginId, current) !== configuration)
				throw new ImapConnectionError('MAIL_STALE');
			const saved = this.saveMailConfiguration(
				pluginId,
				current,
				updated,
				grants,
				assertSetupActive
			);
			assertMailActivityAuthority(assertSetupActive);
			const savedAccount = saved.accounts.find((a) => a.accountId === accountId);
			if (
				this.readMailConfiguration(pluginId, current) !== saved ||
				saved.installationId !== configuration.installationId ||
				savedAccount?.revision !== revision ||
				savedAccount.enabled !== account.enabled
			)
				throw new ImapConnectionError('MAIL_STALE');
			return saved;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Stored policy only: caller MUST separately prove live agent, broker gates and generation. */
	assertStoredMailAgentRight(
		pluginId: string,
		current: AuthIdentity,
		accountId: string,
		expectedRevision: number,
		agentId: string,
		right: MailAgentRight
	): void {
		const configuration = this.readMailConfiguration(pluginId, current);
		const account = configuration?.accounts.find((a) => a.accountId === accountId);
		if (!account || !account.enabled) throw new ImapConnectionError('MAIL_DENIED');
		if (
			!Number.isSafeInteger(expectedRevision) ||
			expectedRevision < 1 ||
			!MAIL_AGENT_RIGHTS.includes(right)
		)
			throw new ImapConnectionError('MAIL_INVALID');
		if (account.revision !== expectedRevision) throw new ImapConnectionError('MAIL_STALE');
		const grant = this.ledger.mail.configurations
			.find((c) => c.configuration.pluginId === pluginId)
			?.agentGrants.find(
				(g) => g.accountId === accountId && g.accountRevision === expectedRevision
			);
		if (!grant?.agents.find((a) => a.agentId === agentId)?.rights.includes(right))
			throw new ImapConnectionError('MAIL_DENIED');
	}

	/** Retain private settings/history for later secret cleanup; never revive old rights. */
	private clearMailAgentRights(pluginId: string): void {
		this.ledger.mail = Object.freeze({
			...this.ledger.mail,
			configurations: Object.freeze(
				this.ledger.mail.configurations.map((entry) =>
					entry.configuration.pluginId === pluginId
						? Object.freeze({ ...entry, agentGrants: Object.freeze([]) })
						: entry
				)
			),
		});
	}

	/**
	 * Mint an authorization for one plugin: enable it with EXACTLY the approved
	 * capability set, bound to the plugin's identity (content digest + signature/
	 * trust). The ONLY path that creates trust; callers (the consent IPC handler)
	 * MUST already have verified sender-frame + nonce + user-activation.
	 */
	mint(pluginId: string, caps: PermissionGrant[], identity: AuthIdentity): void {
		this.ensureLoaded();
		this.mailActivity.invalidatePlugin(pluginId);
		this.bump();
		this.clearMailAgentRights(pluginId);
		this.ledger.entries[pluginId] = {
			enabled: true,
			caps: caps.map((c) => ({ ...c })),
			identity: { ...identity },
			mintedAt: this.now(),
		};
		// A fresh mint clears any prior tombstone for this id.
		this.ledger.tombstones = this.ledger.tombstones.filter((t) => t.pluginId !== pluginId);
		this.persist();
	}

	/** Revoke a plugin's authorization (disable + drop grants) with a tombstone.
	 * No-op when the plugin holds no grant (nothing to revoke). */
	revoke(pluginId: string): void {
		this.ensureLoaded();
		this.mailActivity.invalidatePlugin(pluginId);
		if (!this.ledger.entries[pluginId]) return;
		this.bump();
		this.clearMailAgentRights(pluginId);
		delete this.ledger.entries[pluginId];
		this.ledger.tombstones = this.ledger.tombstones.filter((t) => t.pluginId !== pluginId);
		this.ledger.tombstones.push({ pluginId, removedAtEpoch: this.ledger.epoch });
		this.persist();
	}

	/** Uninstall: an AUTHORITATIVE user removal. Always records a tombstone at a
	 * fresh epoch (deduped) and drops any grant, even when the plugin was never
	 * enabled - so a later restored folder is recognized as removed-by-user and a
	 * rolled-back ledger that still enables it fails the epoch check. */
	uninstall(pluginId: string): void {
		this.ensureLoaded();
		this.mailActivity.invalidatePlugin(pluginId);
		const hadEntry = !!this.ledger.entries[pluginId];
		const alreadyTombstoned = this.ledger.tombstones.some((t) => t.pluginId === pluginId);
		if (!hadEntry && alreadyTombstoned) return; // already authoritatively removed
		this.bump();
		this.clearMailAgentRights(pluginId);
		delete this.ledger.entries[pluginId];
		this.ledger.tombstones = this.ledger.tombstones.filter((t) => t.pluginId !== pluginId);
		this.ledger.tombstones.push({ pluginId, removedAtEpoch: this.ledger.epoch });
		this.persist();
	}

	/**
	 * Host-managed allowlist edit: replace the member scope of an ALREADY-CONSENTED
	 * allowlist-scoped grant (agents:dispatch / process:spawn) with a new set the
	 * USER chose in Settings. The user is a DIFFERENT principal from the plugin;
	 * the plugin can never reach this. It mutates ONLY the scope of a capability
	 * the user already granted: it never adds a capability, never touches the
	 * unattended flag, and never changes identity (the plugin's files are
	 * unchanged, so a later verify() still matches). Authoritative like any mint:
	 * bumps the epoch and persists (sealed + anchored, or the session-only fallback).
	 *
	 * `members` are exact tokens (agent ids / host-blessed binary names); an empty
	 * set clears the scope to deny-all, a valid lockdown short of a full revoke.
	 * Returns false when the capability is not allowlist-scoped, when the plugin
	 * holds no grant for it (nothing to widen: the user must first consent to the
	 * capability through the host-owned consent window), or when any member is not
	 * a valid allowlist token.
	 */
	setAllowlistScope(
		pluginId: string,
		capability: PluginCapability,
		members: readonly string[]
	): boolean {
		this.ensureLoaded();
		if (!isAllowlistScoped(capability)) return false;
		const entry = this.ledger.entries[pluginId];
		if (!entry || !entry.enabled) return false;
		const idx = entry.caps.findIndex((c) => c.capability === capability);
		if (idx === -1) return false;
		// Defense-in-depth: this is the authoritative sealed-ledger mutation, so it
		// self-guards rather than trusting the caller. Refuse the whole edit if any
		// member is invalid (empty, or a character that could split or smuggle
		// through the comma-joined scope) - fail loud, never silently narrow.
		if (!members.every(isValidAllowlistMember)) return false;
		const scope = members.length > 0 ? [...members].join(',') : undefined;
		this.mailActivity.invalidatePlugin(pluginId);
		this.bump();
		entry.caps = entry.caps.map((c, i) => (i === idx ? { ...c, scope } : { ...c }));
		entry.mintedAt = this.now();
		this.persist();
		return true;
	}

	/** The granted capabilities for a plugin - the broker's live source of truth.
	 * Empty unless the plugin is currently enabled in the verified ledger. */
	readGrants(pluginId: string): PermissionGrant[] {
		this.ensureLoaded();
		const entry = this.ledger.entries[pluginId];
		if (!entry || !entry.enabled) return [];
		return entry.caps.map((c) => ({ ...c }));
	}

	/** Whether a plugin is currently authorized-enabled. */
	isEnabled(pluginId: string): boolean {
		this.ensureLoaded();
		return this.ledger.entries[pluginId]?.enabled === true;
	}

	/** The identity (content digest + signature/trust) bound at consent time, or
	 * undefined if not authorized. The verifier recomputes the plugin's CURRENT
	 * identity and compares: any difference (code OR signer/trust change) → the
	 * plugin is disabled and must be re-consented. */
	entryIdentity(pluginId: string): AuthIdentity | undefined {
		this.ensureLoaded();
		const entry = this.ledger.entries[pluginId];
		return entry ? { ...entry.identity } : undefined;
	}

	/** Whether a plugin id currently carries a tombstone (removed, not re-consented). */
	isTombstoned(pluginId: string): boolean {
		this.ensureLoaded();
		return this.ledger.tombstones.some((t) => t.pluginId === pluginId);
	}

	/** Ids of all currently-authorized plugins (enabled in the verified ledger). */
	authorizedIds(): string[] {
		this.ensureLoaded();
		return Object.keys(this.ledger.entries).filter((id) => this.ledger.entries[id].enabled);
	}

	/**
	 * Verify a discovered plugin against its consented authorization. The caller
	 * (plugin-manager.refresh) passes the plugin's CURRENT identity and the
	 * manifest's requested capabilities; this returns the caps to honor, or a
	 * reason the plugin must be disabled / re-consented. Pure given the loaded
	 * ledger - no I/O.
	 */
	verify(
		pluginId: string,
		current: AuthIdentity,
		manifestRequested: readonly PluginCapability[]
	): VerifyResult {
		this.ensureLoaded();
		if (this.isTombstoned(pluginId)) return { authorized: false, reason: 'removed', caps: [] };
		const entry = this.ledger.entries[pluginId];
		if (!entry || !entry.enabled) {
			return { authorized: false, reason: 'not-authorized', caps: [] };
		}
		const id = entry.identity;
		if (
			id.contentHash !== current.contentHash ||
			id.signatureStatus !== current.signatureStatus ||
			id.signerKey !== current.signerKey
		) {
			return { authorized: false, reason: 'identity-changed', caps: [] };
		}
		// Defense in depth: never hand the broker a cap the CURRENT manifest no longer
		// requests. (A plugin.json change also moves contentHash → identity-changed
		// above, but this keeps grants ⊆ the manifest regardless.)
		const requested = new Set(manifestRequested);
		const kept = entry.caps.filter((c) => requested.has(c.capability));
		if (kept.length !== entry.caps.length) {
			return { authorized: false, reason: 'identity-changed', caps: [] };
		}
		return { authorized: true, reason: 'ok', caps: kept.map((c) => ({ ...c })) };
	}
}

/** Production `SealProvider` over Electron `safeStorage`. */
export function safeStorageSeal(safeStorage: SafeStorageLike): SealProvider {
	return {
		available: () => {
			try {
				return safeStorage.isEncryptionAvailable();
			} catch {
				return false;
			}
		},
		seal: (plaintext) => safeStorage.encryptString(plaintext),
		unseal: (blob) => safeStorage.decryptString(blob),
	};
}

/**
 * Production `AnchorStore` over a named OS credential entry. `entryFactory`
 * lazily constructs the keyring entry so a missing/unavailable native module
 * degrades to `available() === false` (→ session-only) instead of throwing.
 */
export interface KeyringEntry {
	getPassword(): string | null;
	setPassword(password: string): void;
	deletePassword(): boolean;
}

export function keyringAnchor(entryFactory: () => KeyringEntry | null): AnchorStore {
	let entry: KeyringEntry | null | undefined;
	const get = (): KeyringEntry | null => {
		if (entry === undefined) {
			try {
				entry = entryFactory();
			} catch {
				entry = null;
			}
		}
		return entry;
	};
	return {
		available: () => get() !== null,
		read: () => {
			const e = get();
			if (!e) return null;
			try {
				const raw = e.getPassword();
				if (!raw) return null;
				const parsed: unknown = JSON.parse(raw);
				if (
					typeof parsed !== 'object' ||
					parsed === null ||
					!('installSecret' in parsed) ||
					!('epoch' in parsed) ||
					typeof parsed.installSecret !== 'string' ||
					typeof parsed.epoch !== 'number'
				) {
					return null;
				}
				return { installSecret: parsed.installSecret, epoch: parsed.epoch };
			} catch {
				return null;
			}
		},
		write: (anchor) => {
			const e = get();
			if (!e) return;
			e.setPassword(JSON.stringify(anchor));
		},
		clear: () => {
			const e = get();
			if (!e) return;
			try {
				e.deletePassword();
			} catch {
				/* best-effort */
			}
		},
	};
}

/** A no-op anchor - `available() === false`, so the store runs session-only. */
export function noAnchor(): AnchorStore {
	return {
		available: () => false,
		read: () => null,
		write: () => {},
		clear: () => {},
	};
}

export interface KeyringModule {
	Entry: new (service: string, account: string) => KeyringEntry;
}

/** Canonical lazy native-entry factory. Construction is not a backend health check. */
export function createKeyringEntry(
	service: string,
	account: string,
	loadModule: () => KeyringModule | null = () => {
		try {
			const mod = require('@napi-rs/keyring') as Partial<KeyringModule>;
			return typeof mod.Entry === 'function' ? (mod as KeyringModule) : null;
		} catch {
			return null;
		}
	}
): KeyringEntry | null {
	try {
		const mod = loadModule();
		if (!mod) return null;
		return new mod.Entry(service, account);
	} catch {
		return null;
	}
}

/** Lazily adapt the canonical entry factory for authorization freshness only. */
export function createKeyringAnchor(
	service: string,
	account: string,
	loadModule?: () => KeyringModule | null
): AnchorStore {
	return keyringAnchor(() => createKeyringEntry(service, account, loadModule));
}
export function createAuthorizationStore(opts: {
	safeStorage: SafeStorageLike;
	ledgerPath: string;
	anchor?: AnchorStore;
}): AuthorizationStore {
	return new AuthorizationStore({
		seal: safeStorageSeal(opts.safeStorage),
		anchor: opts.anchor ?? noAnchor(),
		ledgerPath: opts.ledgerPath,
	});
}
