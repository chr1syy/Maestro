/**
 * One durable scope cycle, NODE ONLY. Its scope worker must call this serially;
 * discovery uses metadata and only changed working tabs need history.
 * Transports must enforce the supplied guard at final admission. There is no
 * unguarded fallback, including for a delayed manager reply.
 */
import { createHash } from 'crypto';
import { canonicalJson } from '../canonicalJson';
import { isPathAtOrUnderRoot } from '../worktreePaths';
import type { PianolaFsStore } from './fs-store';
import {
	resolvePianolaScopeOwnership,
	type PianolaScopeCandidate,
	type PianolaScopeOwner,
	type PianolaScopeTab,
} from './pianola-scope';
import {
	validatePianolaScopeCheckpoint,
	isPianolaScopeCursor,
	type PianolaScopeCheckpoint,
	type PianolaScopeCheckpointTab,
	type PianolaScopeCursor,
} from './pianola-scope-checkpoint';
import {
	initialWatchState,
	rehydrateWatchState,
	runWatchIteration,
	type IterationResult,
	type PianolaJudgmentRequest,
	type WatchDeps,
	type WatchTarget,
} from './pianola-watcher';
import type { PianolaDecisionRecord, PianolaSupervisedTarget } from './storage';
import type { PianolaMessage } from './types';

export interface PianolaScopeSnapshotTab extends PianolaScopeTab {
	/** Host creation time, never the provider session's creation time. */
	createdAt: number;
	busy: boolean;
	cursorAvailable: boolean;
	cursor: PianolaScopeCursor | null;
}

export interface PianolaScopeSnapshot {
	/** Host time captured with the complete owner/tab snapshot. */
	capturedAt: number;
	complete: boolean;
	owners: PianolaScopeOwner[];
	tabs: PianolaScopeSnapshotTab[];
}

export interface PianolaScopeDeliveryGuard {
	scopeId: string;
	configurationFingerprint: string;
	bindingFingerprint: string;
	agentId: string;
	tabId: string;
	messageId: string;
	decisionId: string;
	cursor: PianolaScopeCursor;
}

/** Only a definitive admission rejection permits the watcher's bounded retry. */
export type PianolaScopeDeliveryResult =
	| { status: 'accepted' }
	| { status: 'rejected'; error: string }
	| { status: 'unknown'; error: string };

export interface PianolaScopeCycleDeps {
	store: Pick<
		PianolaFsStore,
		'readSupervisorTargets' | 'readScopeCheckpoint' | 'writeScopeCheckpoint' | 'readDecisions'
	>;
	/** Unavailable/incomplete metadata must throw or return complete:false. */
	readSnapshot: () => Promise<PianolaScopeSnapshot>;
	/** All log entries in native order, with stable IDs. A bounded fetch may refuse. */
	readTranscript: (target: WatchTarget) => Promise<{
		agentId: string;
		tabId: string;
		messages: PianolaMessage[];
	}>;
	watch: Omit<WatchDeps, 'dispatch' | 'requestJudgment'>;
	dispatch: (
		target: WatchTarget,
		answer: string,
		guard: PianolaScopeDeliveryGuard
	) => Promise<PianolaScopeDeliveryResult>;
	requestJudgment?: (
		request: PianolaJudgmentRequest,
		guard: PianolaScopeDeliveryGuard
	) => Promise<PianolaScopeDeliveryResult>;
}

export interface PianolaScopeCycleResult {
	status: PianolaScopeCheckpoint['status'];
	iterations: Array<{ agentId: string; tabId: string; result: IterationResult }>;
	/** Metadata, history or delivery uncertainty, suitable for scope health. */
	issues: string[];
}

function fingerprint(value: unknown): string {
	return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

/** Labels and polling cadence do not change consent; unordered selections are sets. */
export function pianolaScopeConfigurationFingerprint(scope: PianolaScopeCandidate): string {
	const { selection } = scope;
	return fingerprint({
		managerAgentId: scope.managerAgentId,
		mode: selection.mode,
		projectRoots: [...selection.projectRoots].sort(),
		ownerRoots: selection.ownerRoots,
		includeWorktrees: selection.includeWorktrees,
		excludedAgentIds: [...selection.excludedAgentIds].sort(),
	});
}

function scopesFrom(targets: PianolaSupervisedTarget[]): PianolaScopeCandidate[] {
	if (new Set(targets.map((target) => target.id)).size !== targets.length)
		throw new Error('Ambiguous Pianola registry IDs');
	return targets
		.filter((target) => target.kind === 'watch-scope')
		.map((target) => {
			if (!target.selection || !target.managerAgentId)
				throw new Error('Incomplete Pianola scope configuration');
			return { ...target, selection: target.selection, managerAgentId: target.managerAgentId };
		});
}

function assertSnapshot(snapshot: PianolaScopeSnapshot): void {
	if (
		snapshot.complete !== true ||
		!Number.isSafeInteger(snapshot.capturedAt) ||
		snapshot.capturedAt < 0 ||
		snapshot.tabs.length > 10000 ||
		new Set(snapshot.owners.map((owner) => owner.id)).size !== snapshot.owners.length ||
		snapshot.tabs.some(
			(tab) =>
				typeof tab.paused !== 'boolean' ||
				typeof tab.consult !== 'boolean' ||
				typeof tab.ephemeral !== 'boolean' ||
				typeof tab.busy !== 'boolean' ||
				typeof tab.cursorAvailable !== 'boolean' ||
				!isPianolaScopeCursor(tab.cursor)
		) ||
		new Set(snapshot.tabs.map((tab) => canonicalJson([tab.agentId, tab.tabId]))).size !==
			snapshot.tabs.length
	)
		throw new Error('Incomplete or ambiguous Pianola scope snapshot');
}

/**
 * Hash the effective binding, so adding an unrelated project root preserves
 * existing cursors while changing an owner's root/lineage requires a baseline.
 * Only called after the ownership resolver has verified the entire chain.
 */
function bindingFingerprint(
	scope: PianolaScopeCandidate,
	agentId: string,
	owners: PianolaScopeOwner[]
): string {
	const chain: PianolaScopeOwner[] = [];
	let owner = owners.find((candidate) => candidate.id === agentId)!;
	for (;;) {
		chain.push({
			id: owner.id,
			cwd: owner.cwd,
			parentSessionId: owner.parentSessionId ?? null,
			isPianola: owner.isPianola,
			remote: owner.remote,
		});
		if (!owner.parentSessionId) break;
		owner = owners.find((candidate) => candidate.id === owner.parentSessionId)!;
	}
	return fingerprint({
		managerAgentId: scope.managerAgentId,
		mode: scope.selection.mode,
		chain,
		boundRoot: scope.selection.ownerRoots[owner.id] ?? null,
		roots: scope.selection.projectRoots
			.filter((root) => isPathAtOrUnderRoot(owner.cwd, root))
			.sort(),
	});
}

function sameCursor(a: PianolaScopeCursor | null, b: PianolaScopeCursor | null): boolean {
	return (
		a === b || (!!a && !!b && a.id === b.id && a.count === b.count && a.textLength === b.textLength)
	);
}

function atCursor(messages: PianolaMessage[], cursor: PianolaScopeCursor | null): boolean {
	if (!cursor) return true;
	const message = messages[cursor.count - 1];
	return message?.id === cursor.id && message.content.length >= cursor.textLength;
}

function deliveryOutcome(result: PianolaScopeDeliveryResult): { success: boolean; error?: string } {
	if (result.status === 'accepted') return { success: true };
	if (result.status === 'rejected' && typeof result.error === 'string')
		return { success: false, error: result.error };
	throw new Error('Delivery outcome unknown; automatic retry suspended');
}

/**
 * Restores the checkpoint on every invocation. Persistence failures propagate;
 * the next cycle must read durable state, never continue with an uncommitted
 * in-memory cursor. A thrown/uncertain send retains its intent and is not retried.
 */
export async function runPianolaScopeCycle(
	scopeId: string,
	deps: PianolaScopeCycleDeps,
	options: { dryRun: boolean }
): Promise<PianolaScopeCycleResult> {
	const targets = deps.store.readSupervisorTargets();
	const scopes = scopesFrom(targets);
	const scope = scopes.find((candidate) => candidate.id === scopeId);
	let checkpoint = deps.store.readScopeCheckpoint(scopeId);
	const result: PianolaScopeCycleResult = { status: 'suspended', iterations: [], issues: [] };
	let persistenceFailed = false;
	const persist = (): void => {
		try {
			deps.store.writeScopeCheckpoint(checkpoint!);
		} catch (error) {
			persistenceFailed = true;
			throw error;
		}
	};
	if (!scope?.enabled) {
		if (checkpoint) {
			checkpoint.status = 'suspended';
			persist();
		}
		return result;
	}
	const snapshot = await deps.readSnapshot();
	assertSnapshot(snapshot);
	const configurationFingerprint = pianolaScopeConfigurationFingerprint(scope);
	const firstActivation = !checkpoint;
	const resume = checkpoint?.status !== 'armed';
	if (!checkpoint) {
		checkpoint = {
			version: 1,
			scopeId,
			configurationFingerprint,
			activatedAt: snapshot.capturedAt,
			status: 'baselining',
			tabs: [],
		};
		persist();
	} else if (!validatePianolaScopeCheckpoint(checkpoint, scopeId)) {
		throw new Error('Invalid Pianola scope checkpoint');
	}
	if (snapshot.capturedAt < (checkpoint.lastSnapshotAt ?? checkpoint.activatedAt))
		throw new Error('Pianola host clock precedes activation; scope remains inert');
	const configurationChanged = checkpoint.configurationFingerprint !== configurationFingerprint;
	const decisions = deps.store.readDecisions();
	const savedByKey = new Map(
		checkpoint.tabs.map((tab) => [canonicalJson([tab.agentId, tab.tabId]), tab])
	);
	const liveKeys = new Set(snapshot.tabs.map((tab) => canonicalJson([tab.agentId, tab.tabId])));
	for (const saved of checkpoint.tabs) {
		if (!liveKeys.has(canonicalJson([saved.agentId, saved.tabId]))) saved.status = 'closed';
	}
	const working: Array<{ tab: PianolaScopeSnapshotTab; saved: PianolaScopeCheckpointTab }> = [];
	let baselineUnavailable = false;
	for (const tab of snapshot.tabs) {
		const key = canonicalJson([tab.agentId, tab.tabId]);
		let saved = savedByKey.get(key);
		// Paused members are included in the enrollment baseline, never in work.
		const ownership = resolvePianolaScopeOwnership(
			{ ...tab, paused: false },
			snapshot.owners,
			scopes,
			targets.filter((target) => target.kind === 'watch')
		);
		if (ownership.kind !== 'scope' || ownership.scopeId !== scopeId) {
			if (saved) saved.status = 'suspended';
			continue;
		}
		if (!tab.cursorAvailable) {
			// Initial activation requires a complete baseline. Once armed, isolate
			// this tab rather than losing unrelated tabs' pending work.
			if (firstActivation || resume) baselineUnavailable = true;
			if (saved) saved.status = 'suspended';
			result.issues.push(`Transcript cursor unavailable: ${tab.agentId}/${tab.tabId}`);
			continue;
		}
		const binding = bindingFingerprint(scope, tab.agentId, snapshot.owners);
		const needsBaseline =
			firstActivation ||
			resume ||
			saved?.status !== 'active' ||
			saved.bindingFingerprint !== binding;
		if (!saved) {
			// Only a genuinely new host-created tab may expose its first ask. An
			// old/unknown timestamp, re-enrollment or ownership change baselines it.
			const createdAfterActivation =
				!firstActivation &&
				!resume &&
				!configurationChanged &&
				checkpoint.lastSnapshotAt !== undefined &&
				tab.createdAt > checkpoint.lastSnapshotAt &&
				tab.createdAt <= snapshot.capturedAt;
			saved = {
				agentId: tab.agentId,
				tabId: tab.tabId,
				bindingFingerprint: binding,
				baseline: createdAfterActivation && !tab.paused ? null : tab.cursor,
				baselineBusy: tab.busy && !tab.paused,
				lastSeen: createdAfterActivation && !tab.paused ? null : tab.cursor,
				state:
					createdAfterActivation && !tab.paused
						? rehydrateWatchState(
								decisions.filter((decision) => decision.agentId === tab.agentId),
								tab.tabId
							)
						: initialWatchState(),
				status: tab.paused ? 'suspended' : 'active',
				unresolvedIntent: null,
			};
			checkpoint.tabs.push(saved);
			savedByKey.set(key, saved);
		} else if (needsBaseline || tab.paused) {
			saved.baseline = tab.cursor;
			saved.baselineBusy = tab.busy && !tab.paused;
			saved.lastSeen = tab.cursor;
			saved.bindingFingerprint = binding;
			saved.state = initialWatchState();
			saved.status = tab.paused ? 'suspended' : 'active';
			// An unresolved intent survives loss of ownership, disable and close.
		}
		if (saved.unresolvedIntent) {
			result.issues.push(`Delivery outcome unknown: ${tab.agentId}/${tab.tabId}`);
			continue;
		}
		if (
			!tab.paused &&
			!tab.busy &&
			(!sameCursor(saved.lastSeen, tab.cursor) ||
				saved.state.pendingRetry ||
				saved.state.pendingHandoff)
		)
			working.push({ tab, saved });
	}
	if (checkpoint.tabs.length > 10000) throw new Error('Pianola scope checkpoint membership limit');
	checkpoint.configurationFingerprint = configurationFingerprint;
	checkpoint.lastSnapshotAt = snapshot.capturedAt;
	checkpoint.status = baselineUnavailable ? 'baselining' : 'armed';
	// Commit the entire membership/baseline before any rule, handoff or notice.
	persist();
	result.status = checkpoint.status;
	if (checkpoint.status !== 'armed') return result;
	for (const { tab, saved } of working) {
		try {
			const target: WatchTarget = {
				agentId: tab.agentId,
				tabId: tab.tabId,
				projectPath: snapshot.owners.find((owner) => owner.id === tab.agentId)!.cwd,
			};
			const history = await deps.readTranscript(target);
			const messages = history.messages;
			if (
				history.agentId !== tab.agentId ||
				history.tabId !== tab.tabId ||
				messages.length !== (tab.cursor?.count ?? 0) ||
				new Set(messages.map((message) => message.id)).size !== messages.length ||
				messages.some((message) => !message.id) ||
				!atCursor(messages, tab.cursor) ||
				!atCursor(messages, saved.baseline) ||
				!atCursor(messages, saved.lastSeen) ||
				(tab.cursor && messages[messages.length - 1]?.content.length !== tab.cursor.textLength)
			)
				throw new Error('Transcript cursor gap or changed snapshot');
			// Classify the full transcript so earlier assistant intent in the current
			// turn still raises risk. Eligibility is separate: unchanged history must
			// never become actionable just because a tool/system entry was appended.
			const offset = saved.baseline?.count ?? 0;
			const actionableIds = new Set(messages.slice(offset).map((message) => message.id));
			if (saved.baselineBusy && saved.baseline) {
				const streamed = messages[offset - 1];
				if (streamed?.content.length > saved.baseline.textLength) actionableIds.add(streamed.id);
			}
			let latestRecord: PianolaDecisionRecord | undefined;
			const guard = async (): Promise<PianolaScopeDeliveryGuard> => {
				const messageId = latestRecord?.classification.evidence.messageId;
				if (
					!messageId ||
					!actionableIds.has(messageId) ||
					!messages.some((message) => message.id === messageId && message.role === 'assistant') ||
					!tab.cursor
				)
					throw new Error('Missing post-baseline delivery evidence');
				const currentTargets = deps.store.readSupervisorTargets();
				const currentScopes = scopesFrom(currentTargets);
				const currentScope = currentScopes.find((candidate) => candidate.id === scopeId);
				const current = await deps.readSnapshot();
				assertSnapshot(current);
				const currentTab = current.tabs.find(
					(candidate) => candidate.agentId === tab.agentId && candidate.tabId === tab.tabId
				);
				if (
					!currentScope?.enabled ||
					current.capturedAt < snapshot.capturedAt ||
					pianolaScopeConfigurationFingerprint(currentScope) !== configurationFingerprint ||
					!currentTab ||
					currentTab.busy ||
					!currentTab.cursorAvailable ||
					!sameCursor(currentTab.cursor, tab.cursor)
				)
					throw new Error('Scope or awaiting transcript changed before delivery');
				const winner = resolvePianolaScopeOwnership(
					currentTab,
					current.owners,
					currentScopes,
					currentTargets.filter((candidate) => candidate.kind === 'watch')
				);
				if (
					winner.kind !== 'scope' ||
					winner.scopeId !== scopeId ||
					bindingFingerprint(currentScope, tab.agentId, current.owners) !== saved.bindingFingerprint
				)
					throw new Error('Scope ownership changed before delivery');
				saved.unresolvedIntent = { decisionId: latestRecord!.id, messageId };
				persist();
				return {
					scopeId,
					configurationFingerprint,
					bindingFingerprint: saved.bindingFingerprint!,
					agentId: tab.agentId,
					tabId: tab.tabId,
					messageId,
					decisionId: latestRecord!.id,
					cursor: tab.cursor,
				};
			};
			const iteration = await runWatchIteration(
				messages,
				target,
				saved.state,
				{
					...deps.watch,
					recordDecision: (record) => {
						deps.watch.recordDecision(record);
						latestRecord = record;
					},
					dispatch: async (destination, answer) =>
						deliveryOutcome(await deps.dispatch(destination, answer, await guard())),
					requestJudgment: deps.requestJudgment
						? async (request) =>
								deliveryOutcome(await deps.requestJudgment!(request, await guard()))
						: undefined,
				},
				{ ...options, canActOnMessage: (messageId) => actionableIds.has(messageId) }
			);
			saved.state = iteration.state;
			saved.lastSeen = tab.cursor;
			saved.unresolvedIntent = null;
			persist();
			result.iterations.push({ agentId: tab.agentId, tabId: tab.tabId, result: iteration.result });
		} catch (error) {
			// Do not persist a cleared intent on failure: the durable copy is the
			// recovery authority even if the send succeeded before an outcome failed.
			result.issues.push(
				`${tab.agentId}/${tab.tabId}: ${error instanceof Error ? error.message : 'scope cycle failed'}`
			);
			if (persistenceFailed) throw error;
			// Isolate an unavailable/stale tab, preserving any durable uncertain
			// intent, so another healthy tab in this scope can still make progress.
		}
	}
	return result;
}
