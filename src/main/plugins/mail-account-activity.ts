/** Host-private cancellation/admission only; never caller proof or stored authority. */
import { isPromise } from 'node:util/types';
import { createKeyedWriteQueue } from '../utils/atomic-json-store';
import { ImapConnectionError } from './mail-imap-connection';

export const MAIL_ACTIVITY_LIMITS = Object.freeze({
	accounts: 1024,
	readers: 512,
	readersPerAccount: 8,
	mutations: 64,
	mutationsPerAccount: 8,
});

export interface MailActivityLease {
	readonly signal: AbortSignal;
	/** Required before/after every await and immediately before publishing a result. */
	assertActive(): void;
	/** Abort cleanup is synchronous; released handles can never regain authority. */
	release(): void;
}

/** Synchronous no-result assertions only; normalize failures without native content. */
export function assertMailActivityAuthority(assertAuthorized: () => void): void {
	try {
		// A void callback type also accepts async functions. Never admit work on a promise.
		const result: unknown = assertAuthorized();
		if (result !== undefined) {
			if (isPromise(result)) {
				// Observe native rejection only; settlement cannot authorize or publish anything.
				// Do not inspect/assimilate arbitrary thenables or call an overridden .then.
				void Promise.prototype.then.call(
					result,
					() => undefined,
					() => undefined
				);
			}
			throw new ImapConnectionError('MAIL_DENIED');
		}
	} catch (error) {
		throw new ImapConnectionError(
			error instanceof ImapConnectionError ? error.code : 'MAIL_DENIED'
		);
	}
}

interface AccountActivity {
	readonly pluginId: string;
	readonly readers: Set<AbortController>;
	readonly mutations: Set<AbortController>;
	admittingRead?: AbortController;
	admittingMutation?: AbortController;
	completing?: AbortController;
	settlingMutations: number;
	blocked: boolean;
	invalidating: boolean;
}

/** One registry per canonical store, with exact host-owned IDs, never plugin inputs. */
export class MailAccountActivity {
	private readonly states = new Map<string, AccountActivity>();
	private readonly blockedPlugins = new Set<string>();
	private readonly queue = createKeyedWriteQueue();
	private readers = 0;
	private mutations = 0;
	private stopped = false;

	private state(pluginId: string, accountId: string): [string, AccountActivity] {
		if (this.stopped) throw new ImapConnectionError('MAIL_UNAVAILABLE');
		if (this.blockedPlugins.has(pluginId)) throw new ImapConnectionError('MAIL_UNAVAILABLE');
		const key = JSON.stringify([pluginId, accountId]);
		let state = this.states.get(key);
		if (!state) {
			if (this.states.size >= MAIL_ACTIVITY_LIMITS.accounts)
				throw new ImapConnectionError('MAIL_LIMIT');
			state = {
				pluginId,
				readers: new Set(),
				mutations: new Set(),
				settlingMutations: 0,
				blocked: false,
				invalidating: false,
			};
			this.states.set(key, state);
		}
		return [key, state];
	}

	private prune(key: string, state: AccountActivity): void {
		if (
			this.states.get(key) === state &&
			!state.blocked &&
			!state.invalidating &&
			!state.admittingRead &&
			!state.admittingMutation &&
			!state.completing &&
			!state.settlingMutations &&
			!state.readers.size &&
			!state.mutations.size
		)
			this.states.delete(key);
	}

	private check(
		controller: AbortController | undefined,
		state: AccountActivity,
		assertAuthorized: () => void
	): void {
		if (controller?.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
		if (this.stopped || state.blocked || state.invalidating)
			throw new ImapConnectionError('MAIL_UNAVAILABLE');
		assertMailActivityAuthority(assertAuthorized);
		if (controller?.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
		if (this.stopped || state.blocked || state.invalidating)
			throw new ImapConnectionError('MAIL_UNAVAILABLE');
	}

	/** Final check after read release or mutation settlement; never revives a lease. */
	assertCompletion(pluginId: string, accountId: string, assertAuthorized: () => void): void {
		const key = JSON.stringify([pluginId, accountId]);
		const check = () => {
			const state = this.states.get(key);
			if (
				this.stopped ||
				this.blockedPlugins.has(pluginId) ||
				state?.blocked ||
				state?.invalidating ||
				state?.settlingMutations ||
				state?.mutations.size
			)
				throw new ImapConnectionError('MAIL_UNAVAILABLE');
		};
		check();
		const [, state] = this.state(pluginId, accountId);
		if (state.completing) {
			// Poison the outer completion even when its callback catches recursive denial.
			state.completing.abort();
			throw new ImapConnectionError('MAIL_DENIED');
		}
		const controller = new AbortController();
		state.completing = controller;
		try {
			assertMailActivityAuthority(assertAuthorized);
			if (controller.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			// Read current state again: the callback may have admitted or failed a mutation.
			check();
		} finally {
			state.completing = undefined;
			this.prune(key, state);
		}
	}

	acquire(pluginId: string, accountId: string, assertAuthorized: () => void): MailActivityLease {
		const [key, state] = this.state(pluginId, accountId);
		if (state.admittingRead) {
			// Deny new issuance and cancel the outer admission even if its callback catches denial.
			state.admittingRead.abort();
			throw new ImapConnectionError('MAIL_DENIED');
		}
		if (state.blocked || state.invalidating || state.settlingMutations || state.mutations.size)
			throw new ImapConnectionError('MAIL_UNAVAILABLE');
		if (
			this.readers >= MAIL_ACTIVITY_LIMITS.readers ||
			state.readers.size >= MAIL_ACTIVITY_LIMITS.readersPerAccount
		) {
			this.prune(key, state);
			throw new ImapConnectionError('MAIL_LIMIT');
		}
		const controller = new AbortController();
		state.readers.add(controller);
		this.readers++;
		const release = () => {
			if (!state.readers.delete(controller)) return;
			this.readers--;
			controller.abort();
			this.prune(key, state);
		};
		let checking = false;
		const assertActive = () => {
			const wasChecking = checking;
			try {
				// Recursive checks cancel this handle before another authority callback.
				if (wasChecking) throw new ImapConnectionError('MAIL_DENIED');
				checking = true;
				this.check(controller, state, assertAuthorized);
				// A mutation retains ownership through release listeners and its final check.
				if (state.settlingMutations || state.mutations.size)
					throw new ImapConnectionError('MAIL_UNAVAILABLE');
			} catch (error) {
				release();
				throw error;
			} finally {
				checking = wasChecking;
			}
		};
		state.admittingRead = controller;
		try {
			assertActive();
			return Object.freeze({ signal: controller.signal, assertActive, release });
		} finally {
			state.admittingRead = undefined;
			this.prune(key, state);
		}
	}

	/** Called before even a synchronous stored mutation; abort listeners close readers. */
	invalidateAccount(pluginId: string, accountId: string): void {
		const key = JSON.stringify([pluginId, accountId]);
		const state = this.states.get(key);
		if (!state) return;
		// Delete before callbacks: no reentrant acquisition may keep an old lease alive.
		const readers = [...state.readers];
		state.readers.clear();
		this.readers -= readers.length;
		const invalidating = state.invalidating;
		state.invalidating = true;
		for (const controller of readers) controller.abort();
		state.invalidating = invalidating;
		this.prune(key, state);
	}

	/** Admitted mutation failure, including the facade's gate after queue settlement. */
	failAccountMutation(pluginId: string, accountId: string): void {
		if (this.stopped || this.blockedPlugins.has(pluginId)) return;
		const key = JSON.stringify([pluginId, accountId]);
		// A successful queue may already have pruned its state. Never lose a late
		// failure latch to capacity exhaustion and later admit that account again.
		if (!this.states.has(key) && this.states.size >= MAIL_ACTIVITY_LIMITS.accounts) {
			this.stop();
			return;
		}
		const [, state] = this.state(pluginId, accountId);
		state.blocked = true;
		this.invalidateAccount(pluginId, accountId);
		// Cancellation retains each queued/in-flight owner's counters until settlement.
		for (const controller of [...state.mutations]) controller.abort();
	}

	/** Canonical consent changes also cancel queued/in-flight setup work. */
	invalidatePlugin(pluginId: string): void {
		// Retained plugin latches are bounded by retained account states. Prevent a
		// synchronous abort listener from opening a different account of this plugin.
		if (![...this.states.values()].some((state) => state.pluginId === pluginId)) return;
		this.blockedPlugins.add(pluginId);
		for (const state of this.states.values()) {
			if (state.pluginId !== pluginId) continue;
			state.blocked = true;
			const readers = [...state.readers];
			state.readers.clear();
			this.readers -= readers.length;
			for (const controller of [...readers, ...state.mutations]) controller.abort();
		}
	}

	/** Permanent process latch; failed persistence can never be repaired by re-consent. */
	stop(): void {
		this.stopped = true;
		for (const state of this.states.values()) {
			state.blocked = true;
			const readers = [...state.readers];
			state.readers.clear();
			this.readers -= readers.length;
			for (const controller of [...readers, ...state.mutations]) controller.abort();
		}
	}

	/** Internal host work only. Never pass a plugin callback, secret or SDK handler. */
	enqueueMutation(
		pluginId: string,
		accountId: string,
		assertAuthorized: () => void,
		signal: AbortSignal,
		work: (lease: MailActivityLease) => Promise<void>
	): Promise<void> {
		if (!(signal instanceof AbortSignal)) throw new ImapConnectionError('MAIL_DENIED');
		if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
		const check = () => {
			if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			assertMailActivityAuthority(assertAuthorized);
			if (signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
		};
		const [key, state] = this.state(pluginId, accountId);
		if (state.admittingMutation) {
			// Latch/cancel the outer admission even when its callback catches recursive denial.
			this.failAccountMutation(pluginId, accountId);
			throw new ImapConnectionError('MAIL_DENIED');
		}
		if (state.blocked || state.invalidating) throw new ImapConnectionError('MAIL_UNAVAILABLE');
		if (
			this.mutations >= MAIL_ACTIVITY_LIMITS.mutations ||
			state.mutations.size >= MAIL_ACTIVITY_LIMITS.mutationsPerAccount
		) {
			this.prune(key, state);
			throw new ImapConnectionError('MAIL_LIMIT');
		}
		const controller = new AbortController();
		state.mutations.add(controller);
		this.mutations++;
		const cancel = () => {
			this.failAccountMutation(pluginId, accountId);
		};
		state.admittingMutation = controller;
		try {
			this.check(controller, state, check);
			signal.addEventListener('abort', cancel, { once: true });
			if (signal.aborted) cancel();
			// Admission closes synchronously, before the canonical queue schedules any await.
			this.invalidateAccount(pluginId, accountId);
			// Read cancellation listeners can recursively deny and cancel this admission.
			if (controller.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
			if (this.stopped || state.blocked || state.invalidating)
				throw new ImapConnectionError('MAIL_UNAVAILABLE');
			return this.queue.enqueue(key, async () => {
				let checking = false;
				const lease = Object.freeze({
					signal: controller.signal,
					assertActive: () => {
						const wasChecking = checking;
						try {
							if (wasChecking) throw new ImapConnectionError('MAIL_DENIED');
							checking = true;
							this.check(controller, state, check);
						} catch (error) {
							// Latch before callback code can catch denial and continue with this lease.
							cancel();
							throw error;
						} finally {
							checking = wasChecking;
						}
					},
					release: () => controller.abort(),
				});
				try {
					try {
						lease.assertActive();
						await work(lease);
						lease.assertActive();
					} catch (error) {
						// Close admission before cleanup callbacks on a failed operation.
						cancel();
						throw error;
					} finally {
						state.settlingMutations++;
						signal.removeEventListener('abort', cancel);
						state.mutations.delete(controller);
						this.mutations--;
						controller.abort();
					}
					// Release listeners can cancel setup or stop activity. Check the original
					// source/authority and retained state, never the permanently released lease.
					// Queued siblings remain valid; only the facade checks committed result state.
					this.check(undefined, state, check);
				} catch (error) {
					cancel();
					throw new ImapConnectionError(
						error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
					);
				} finally {
					// Keep this state registered through completion so a late failure is latched.
					state.settlingMutations--;
					this.prune(key, state);
				}
			});
		} catch (error) {
			signal.removeEventListener('abort', cancel);
			if (state.mutations.delete(controller)) this.mutations--;
			controller.abort();
			throw error;
		} finally {
			// Keep the fence through cancellation callbacks, cleanup and synchronous queue insertion.
			state.admittingMutation = undefined;
			this.prune(key, state);
		}
	}
}
