/**
 * Unwired trusted-host composition only: no setup principal or read API.
 * Admitted work and final completion failures retain the canonical account activity latch.
 */
import { AuthorizationStore, type AuthIdentity, type KeyringEntry } from './authorization-ledger';
import { assertMailActivityAuthority } from './mail-account-activity';
import {
	changeMailAccountConfiguration,
	parseMailAccountMutation,
	parseMailAccountId,
	parseMailAccountRevision,
	parseMailAccountSettings,
	parseMailSetupNavigation,
	requireMailAccountRevision,
	requireMailAccountTombstoneRevision,
	type MailAccountConfiguration,
	type MailSetupNavigationIntent,
} from './mail-account-config';
import {
	parseMailAgentRights,
	parseMailAuthIdentity,
	type MailAgentRights,
} from './mail-account-ledger';
import { MailCredentialSlot, type MailCredentialAuthority } from './mail-credentials';
import { assertImapQuotedString, IMAP_COMMAND_LIMITS } from './mail-imap-commands';
import { ImapConnectionError } from './mail-imap-connection';

/** Trusted setup must bind membership to live host agents, never plugin-supplied identity. */
export interface MailGrantAuthority extends MailCredentialAuthority {
	assertAgentActive(agentId: string): void;
}

/** Host-private coordinates only; every subsequent operation needs fresh setup authority. */
export type MailSetupNavigationTarget =
	| Readonly<{ action: 'add' }>
	| Readonly<
			Extract<MailSetupNavigationIntent, { accountId: string }> & { accountRevision: number }
	  >;

export class MailAccountCredentials {
	private readonly identity: AuthIdentity;
	private assertingSetup?: AbortController;

	constructor(
		private readonly store: AuthorizationStore,
		private readonly pluginId: string,
		identity: AuthIdentity,
		private readonly entryFactory?: (service: string, account: string) => KeyringEntry | null
	) {
		this.identity = parseMailAuthIdentity(identity);
	}

	/** Snapshot the host callback and cancellation source; neither has a permissive default. */
	private setupAuthority(
		authority: MailCredentialAuthority,
		agents?: readonly MailAgentRights[]
	): MailCredentialAuthority {
		// Account admission guards start later; fence capture and retained callbacks here.
		const guarded = <T>(work: (checkCurrent: () => void) => T): T => {
			if (this.assertingSetup) {
				this.assertingSetup.abort();
				throw new ImapConnectionError('MAIL_DENIED');
			}
			const controller = new AbortController();
			this.assertingSetup = controller;
			const checkCurrent = () => {
				if (controller.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			};
			try {
				const result = work(checkCurrent);
				// Caught recursive denial cannot authorize the original assertion/capture.
				checkCurrent();
				return result;
			} finally {
				if (this.assertingSetup === controller) this.assertingSetup = undefined;
			}
		};
		return guarded((checkCurrent) => {
			const signal = authority?.signal;
			checkCurrent();
			const callback = authority?.assertActive;
			checkCurrent();
			if (!(signal instanceof AbortSignal) || typeof callback !== 'function')
				throw new ImapConnectionError('MAIL_DENIED');
			const check = callback.bind(authority);
			let checkMember: MailGrantAuthority['assertAgentActive'] | undefined;
			if (agents) {
				// Grant membership must share the capture/assertion owner before queue admission.
				const member = (authority as MailGrantAuthority).assertAgentActive;
				checkCurrent();
				if (typeof member !== 'function') throw new ImapConnectionError('MAIL_DENIED');
				checkMember = member.bind(authority);
			}
			return Object.freeze({
				signal,
				assertActive: () =>
					guarded((checkCurrent) => {
						if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
						assertMailActivityAuthority(check);
						checkCurrent();
						if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
						if (agents && checkMember) {
							const member = checkMember;
							for (const agent of agents) {
								assertMailActivityAuthority(() => member(agent.agentId));
								checkCurrent();
								if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
								assertMailActivityAuthority(check);
								checkCurrent();
								if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
							}
						}
					}),
			});
		});
	}

	private configuration(): MailAccountConfiguration {
		const configuration = this.store.readMailConfiguration(this.pluginId, this.identity);
		if (!configuration) throw new ImapConnectionError('MAIL_DENIED');
		return configuration;
	}

	private slot(configuration: MailAccountConfiguration, accountId: string): MailCredentialSlot {
		return new MailCredentialSlot(
			{ installationId: configuration.installationId, pluginId: this.pluginId, accountId },
			this.entryFactory
		);
	}

	/** Live lease during queued work; never assert a released queue lease. */
	private committedAuthority(
		authority: MailCredentialAuthority,
		committed: MailAccountConfiguration,
		accountId: string
	): MailCredentialAuthority {
		const account = committed.accounts.find((a) => a.accountId === accountId);
		const tombstone = committed.tombstones.find((a) => a.accountId === accountId);
		if ((!account && !tombstone) || account?.enabled)
			throw new ImapConnectionError('MAIL_UNAVAILABLE');
		return Object.freeze({
			signal: authority.signal,
			assertActive: () => {
				authority.assertActive();
				if (authority.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
				const current = this.configuration();
				const currentAccount = current.accounts.find((a) => a.accountId === accountId);
				const currentTombstone = current.tombstones.find((a) => a.accountId === accountId);
				if (
					current.installationId !== committed.installationId ||
					currentAccount?.revision !== account?.revision ||
					currentAccount?.enabled !== account?.enabled ||
					currentTombstone?.revision !== tombstone?.revision
				)
					throw new ImapConnectionError('MAIL_STALE');
				if (authority.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			},
		});
	}

	/** Resolve navigation only; no frame opening, credential work or account mutation. */
	resolveSetupNavigation(
		request: unknown,
		setup: MailCredentialAuthority
	): MailSetupNavigationTarget {
		try {
			const intent = parseMailSetupNavigation(request);
			const authority = this.setupAuthority(setup);
			authority.assertActive();
			const configuration = this.store.readMailConfiguration(this.pluginId, this.identity);
			let target: MailSetupNavigationTarget;
			if (intent.action === 'add') target = intent;
			else {
				const account = configuration?.accounts.find((a) => a.accountId === intent.accountId);
				if (!account) throw new ImapConnectionError('MAIL_DENIED');
				// Navigation may review terminal revisions; it cannot advance or revive them.
				requireMailAccountRevision(configuration, intent.accountId, account.revision, true);
				target = Object.freeze({
					action: intent.action,
					accountId: intent.accountId,
					accountRevision: account.revision,
				});
			}
			authority.assertActive();
			if (this.store.readMailConfiguration(this.pluginId, this.identity) !== configuration)
				throw new ImapConnectionError('MAIL_STALE');
			// Final anchor checks can cancel synchronously; no host callback follows this gate.
			if (authority.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			return target;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Pure trusted-host view of stored intent; enabled does not mean operational readiness. */
	listStoredAccounts(
		setup: MailCredentialAuthority
	): ReturnType<AuthorizationStore['listStoredMailAccounts']> {
		try {
			const authority = this.setupAuthority(setup);
			authority.assertActive();
			// Null is a valid authorized empty configuration, unlike mutation/read admission.
			const configuration = this.store.readMailConfiguration(this.pluginId, this.identity);
			const accounts = this.store.listStoredMailAccounts(this.pluginId, this.identity);
			authority.assertActive();
			if (this.store.readMailConfiguration(this.pluginId, this.identity) !== configuration)
				throw new ImapConnectionError('MAIL_STALE');
			// Native freshness checks can cancel synchronously; invoke no callback after this gate.
			if (authority.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			return accounts;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Private setup form data only; never an ordinary account view or readiness probe. */
	readStoredAccountSettings(
		accountId: string,
		expectedRevision: number,
		setup: MailCredentialAuthority
	): ReturnType<typeof parseMailAccountSettings> {
		try {
			// Own the exact target before setup accessors or callbacks can affect admission.
			const targetId = parseMailAccountId(accountId);
			const targetRevision = parseMailAccountRevision(expectedRevision);
			const authority = this.setupAuthority(setup);
			authority.assertActive();
			const configuration = this.configuration();
			const account = requireMailAccountRevision(configuration, targetId, targetRevision, true);
			// Reuse the closed settings parser to copy/freeze every nested settings value.
			const settings = parseMailAccountSettings({
				endpoint: account.endpoint,
				username: account.username,
				mailboxes: account.mailboxes,
			});
			authority.assertActive();
			if (this.configuration() !== configuration) throw new ImapConnectionError('MAIL_STALE');
			// Final sealed freshness can abort synchronously; no callback follows this gate.
			if (authority.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			return settings;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Trusted setup review only; stored agents/rights are not live caller authority. */
	readStoredAgentRights(
		accountId: string,
		expectedRevision: number,
		setup: MailCredentialAuthority
	): ReturnType<AuthorizationStore['readStoredMailAgentRights']> {
		try {
			const authority = this.setupAuthority(setup);
			authority.assertActive();
			const configuration = this.configuration();
			const policy = this.store.readStoredMailAgentRights(
				this.pluginId,
				this.identity,
				accountId,
				expectedRevision
			);
			authority.assertActive();
			if (this.configuration() !== configuration) throw new ImapConnectionError('MAIL_STALE');
			if (authority.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			return policy;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** No awaited gap or credential work: only trusted setup can add stored disabled intent. */
	addDisabledAccount(settings: unknown, setup: MailCredentialAuthority): MailAccountConfiguration {
		try {
			// Capture before even setup accessors: callbacks cannot retarget saved intent.
			const snapshot = parseMailAccountSettings(settings);
			const authority = this.setupAuthority(setup);
			authority.assertActive();
			const committed = this.store.addDisabledMailAccount(
				this.pluginId,
				this.identity,
				snapshot,
				authority.assertActive
			);
			const account = committed.accounts[committed.accounts.length - 1];
			if (!account || account.revision !== 1 || account.enabled)
				throw new ImapConnectionError('MAIL_STALE');
			authority.assertActive();
			if (this.configuration() !== committed) throw new ImapConnectionError('MAIL_STALE');
			if (authority.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			// Private completion receipt only; safe summaries use listStoredAccounts.
			return committed;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Save is disabled-only and clears rights in an anchored revision before native work. */
	async savePassword(
		accountId: string,
		expectedRevision: number,
		password: string,
		setup: MailCredentialAuthority
	): Promise<MailAccountConfiguration> {
		let clearPassword: (() => void) | undefined;
		let setupSignal: AbortSignal | undefined;
		try {
			const setupAuthority = this.setupAuthority(setup);
			const check = setupAuthority.assertActive;
			check();
			assertImapQuotedString(password, IMAP_COMMAND_LIMITS.password);
			const configuration = this.configuration();
			const account = requireMailAccountRevision(configuration, accountId, expectedRevision);
			if (account.enabled) throw new ImapConnectionError('MAIL_DENIED');
			let committed: MailAccountConfiguration | undefined;
			setupSignal = setupAuthority.signal;
			clearPassword = () => {
				password = '';
			};
			setupSignal.addEventListener('abort', clearPassword, { once: true });
			await this.store.enqueueMailAccountMutation(
				this.pluginId,
				this.identity,
				accountId,
				expectedRevision,
				check,
				setupAuthority.signal,
				async (lease) => {
					lease.assertActive();
					const current = this.configuration();
					if (
						current.installationId !== configuration.installationId ||
						requireMailAccountRevision(current, accountId, expectedRevision).enabled
					)
						throw new ImapConnectionError('MAIL_STALE');
					committed = this.store.mutateMailAccount(
						this.pluginId,
						this.identity,
						{ kind: 'disable', accountId, expectedRevision },
						lease.assertActive
					);
					const authority = this.committedAuthority(lease, committed, accountId);
					authority.assertActive();
					this.slot(committed, accountId).savePassword(password, authority);
					password = '';
					authority.assertActive();
				}
			);
			if (!committed) throw new ImapConnectionError('MAIL_STALE');
			this.store.assertMailMutationCompletion(
				this.pluginId,
				this.identity,
				committed,
				accountId,
				check,
				setupAuthority.signal
			);
			// Private completion receipt only; never project configuration to SDK/IPC/logs.
			return committed;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		} finally {
			password = '';
			if (clearPassword) setupSignal?.removeEventListener('abort', clearPassword);
		}
	}

	/** Enable stored intent after an exact slot probe; no authentication or agent rights. */
	async enableAccount(
		accountId: string,
		expectedRevision: number,
		setup: MailCredentialAuthority
	): Promise<MailAccountConfiguration> {
		try {
			const setupAuthority = this.setupAuthority(setup);
			const check = setupAuthority.assertActive;
			check();
			const configuration = this.configuration();
			if (requireMailAccountRevision(configuration, accountId, expectedRevision).enabled)
				throw new ImapConnectionError('MAIL_DENIED');
			let committed: MailAccountConfiguration | undefined;
			await this.store.enqueueMailAccountMutation(
				this.pluginId,
				this.identity,
				accountId,
				expectedRevision,
				check,
				setupAuthority.signal,
				async (lease) => {
					lease.assertActive();
					const current = this.configuration();
					if (
						current.installationId !== configuration.installationId ||
						requireMailAccountRevision(current, accountId, expectedRevision).enabled
					)
						throw new ImapConnectionError('MAIL_STALE');
					const authority = this.committedAuthority(lease, current, accountId);
					this.slot(current, accountId).assertPasswordAvailable(authority);
					authority.assertActive();
					committed = this.store.enableMailAccount(
						this.pluginId,
						this.identity,
						accountId,
						expectedRevision,
						lease.assertActive
					);
					lease.assertActive();
					if (this.configuration() !== committed) throw new ImapConnectionError('MAIL_STALE');
				}
			);
			if (!committed) throw new ImapConnectionError('MAIL_STALE');
			this.store.assertMailMutationCompletion(
				this.pluginId,
				this.identity,
				committed,
				accountId,
				check,
				setupAuthority.signal
			);
			// Private completion receipt only; never project configuration to SDK/IPC/logs.
			return committed;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Serialized exact-account policy replacement; no credential access or authority minting. */
	async replaceAgentRights(
		accountId: string,
		expectedRevision: number,
		agents: unknown,
		setup: MailGrantAuthority
	): Promise<MailAccountConfiguration> {
		try {
			// Capture intent before setup accessors or callbacks can change caller-owned grants.
			const snapshot = parseMailAgentRights(agents);
			const setupAuthority = this.setupAuthority(setup, snapshot);
			const check = setupAuthority.assertActive;
			check();
			const configuration = this.configuration();
			const account = requireMailAccountRevision(configuration, accountId, expectedRevision);
			let committed: MailAccountConfiguration | undefined;
			const assertCommitted = () => {
				const current = this.configuration();
				const changed = current.accounts.find((a) => a.accountId === accountId);
				if (
					!committed ||
					current.installationId !== configuration.installationId ||
					changed?.revision !== account.revision + 1 ||
					changed.enabled !== account.enabled
				)
					throw new ImapConnectionError('MAIL_STALE');
			};
			await this.store.enqueueMailAccountMutation(
				this.pluginId,
				this.identity,
				accountId,
				expectedRevision,
				check,
				setupAuthority.signal,
				async (lease) => {
					lease.assertActive();
					const current = this.configuration();
					if (
						current.installationId !== configuration.installationId ||
						requireMailAccountRevision(current, accountId, expectedRevision).enabled !==
							account.enabled
					)
						throw new ImapConnectionError('MAIL_STALE');
					committed = this.store.replaceMailAgentRights(
						this.pluginId,
						this.identity,
						accountId,
						expectedRevision,
						snapshot,
						lease.assertActive
					);
					lease.assertActive();
					assertCommitted();
				}
			);
			if (!committed) throw new ImapConnectionError('MAIL_STALE');
			this.store.assertMailMutationCompletion(
				this.pluginId,
				this.identity,
				committed,
				accountId,
				check,
				setupAuthority.signal
			);
			// Private completion receipt only; never project configuration to SDK/IPC/logs.
			return committed;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Retry a retained removal after restart; never revive an account or clear stop latches. */
	async cleanupRemovedAccount(
		accountId: string,
		expectedRevision: number,
		setup: MailCredentialAuthority
	): Promise<MailAccountConfiguration> {
		try {
			const setupAuthority = this.setupAuthority(setup);
			const check = setupAuthority.assertActive;
			check();
			const configuration = this.configuration();
			requireMailAccountTombstoneRevision(configuration, accountId, expectedRevision);
			let committed: MailAccountConfiguration | undefined;
			await this.store.enqueueRemovedMailAccountCleanup(
				this.pluginId,
				this.identity,
				accountId,
				expectedRevision,
				check,
				setupAuthority.signal,
				async (lease) => {
					const authority = this.committedAuthority(lease, configuration, accountId);
					authority.assertActive();
					// Reopen intent on every attempt: historical absence cannot skip native checks.
					this.store.recordRemovedMailCredentialCleanup(
						this.pluginId,
						this.identity,
						accountId,
						expectedRevision,
						'pending',
						authority.assertActive
					);
					this.slot(configuration, accountId).removePassword(authority);
					authority.assertActive();
					committed = this.store.recordRemovedMailCredentialCleanup(
						this.pluginId,
						this.identity,
						accountId,
						expectedRevision,
						'confirmedAbsent',
						authority.assertActive
					);
					authority.assertActive();
				}
			);
			if (!committed) throw new ImapConnectionError('MAIL_STALE');
			this.store.assertMailMutationCompletion(
				this.pluginId,
				this.identity,
				committed,
				accountId,
				check,
				setupAuthority.signal
			);
			// Private completion receipt only; never project configuration to SDK/IPC/logs.
			return committed;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}

	/** Disable retains credentials; settings replacement/removal erase only after stopped intent. */
	async mutateAccount(
		mutation: unknown,
		setup: MailCredentialAuthority
	): Promise<MailAccountConfiguration> {
		try {
			// Capture before setup accessors, callbacks and native freshness can retarget intent.
			const snapshot = parseMailAccountMutation(mutation);
			const setupAuthority = this.setupAuthority(setup);
			const check = setupAuthority.assertActive;
			check();
			const configuration = this.configuration();
			const changed = changeMailAccountConfiguration(configuration, snapshot);
			const accountId = changed.accountId;
			const account = requireMailAccountRevision(
				configuration,
				accountId,
				snapshot.expectedRevision
			);
			let committed: MailAccountConfiguration | undefined;
			await this.store.enqueueMailAccountMutation(
				this.pluginId,
				this.identity,
				accountId,
				account.revision,
				check,
				setupAuthority.signal,
				async (lease) => {
					lease.assertActive();
					const current = this.configuration();
					if (
						current.installationId !== configuration.installationId ||
						requireMailAccountRevision(current, accountId, account.revision).enabled !==
							account.enabled
					)
						throw new ImapConnectionError('MAIL_STALE');
					committed = this.store.mutateMailAccount(
						this.pluginId,
						this.identity,
						snapshot,
						lease.assertActive
					);
					const authority = this.committedAuthority(lease, committed, accountId);
					authority.assertActive();
					// Disable preserves the slot without probing availability or implying readiness.
					if (snapshot.kind !== 'disable')
						this.slot(committed, accountId).removePassword(authority);
					authority.assertActive();
					if (snapshot.kind === 'remove') {
						const tombstone = committed.tombstones.find((a) => a.accountId === accountId)!;
						committed = this.store.recordRemovedMailCredentialCleanup(
							this.pluginId,
							this.identity,
							accountId,
							tombstone.revision,
							'confirmedAbsent',
							authority.assertActive
						);
						authority.assertActive();
					}
				}
			);
			if (!committed) throw new ImapConnectionError('MAIL_STALE');
			this.store.assertMailMutationCompletion(
				this.pluginId,
				this.identity,
				committed,
				accountId,
				check,
				setupAuthority.signal
			);
			// Private completion receipt only; never project configuration to SDK/IPC/logs.
			return committed;
		} catch (error) {
			throw new ImapConnectionError(
				error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
			);
		}
	}
}
