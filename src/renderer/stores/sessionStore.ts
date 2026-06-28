/**
 * sessionStore - Zustand store for centralized session and group state management
 *
 * All session, group, active session, bookmark, worktree tracking, and
 * initialization states live here. Components subscribe to individual slices
 * via selectors to avoid unnecessary re-renders.
 *
 * Key advantages:
 * - Selector-based subscriptions: components only re-render when their slice changes
 * - No refs needed: store.getState() gives current state anywhere
 * - Works outside React: services and orchestrators can read/write store directly
 *
 * Can be used outside React via useSessionStore.getState() / useSessionStore.setState().
 */

import { create } from 'zustand';
import type {
	Session,
	Group,
	LogEntry,
	AITab,
	QueuedItem,
	QueuedItemType,
	SessionState,
} from '../types';
import { generateId } from '../utils/ids';
import { getActiveTab } from '../utils/tabHelpers';
import { logger } from '../utils/logger';
import { useUIStore } from './uiStore';

// ============================================================================
// Store Types
// ============================================================================

export interface SessionStoreState {
	// Core entities
	sessions: Session[];
	groups: Group[];

	// Active session
	activeSessionId: string;

	// Initialization
	sessionsLoaded: boolean;
	initialLoadComplete: boolean;
	initialFileTreeReady: boolean;

	// Worktree tracking (prevents re-discovery of manually removed worktrees)
	removedWorktreePaths: Set<string>;

	// Navigation cycling position (for Cmd+J/K session cycling)
	cyclePosition: number;
}

export interface SessionStoreActions {
	// === Session CRUD ===

	/**
	 * Set the sessions array. Supports both direct value and functional updater
	 * to match React's setState signature (200+ call sites use the updater form).
	 */
	setSessions: (sessions: Session[] | ((prev: Session[]) => Session[])) => void;

	/** Add a single session to the end of the list. */
	addSession: (session: Session) => void;

	/** Remove a session by ID. */
	removeSession: (id: string) => void;

	/**
	 * Update a session by ID with a partial update.
	 * More efficient than setSessions for single-session updates.
	 */
	updateSession: (id: string, updates: Partial<Session>) => void;

	// === Active session ===

	/**
	 * Set the active session ID.
	 * Resets cycle position (so next Cmd+J/K starts fresh).
	 */
	setActiveSessionId: (id: string) => void;

	/**
	 * Set the active session ID from persisted state on startup.
	 * Updates local state only — does not write back to disk.
	 */
	hydrateActiveSessionId: (id: string) => void;

	/**
	 * Set the active session ID without resetting cycle position.
	 * Used internally by session cycling (Cmd+J/K).
	 */
	setActiveSessionIdInternal: (id: string | ((prev: string) => string)) => void;

	// === Groups ===

	/**
	 * Set the groups array. Supports both direct value and functional updater.
	 */
	setGroups: (groups: Group[] | ((prev: Group[]) => Group[])) => void;

	/** Add a single group. */
	addGroup: (group: Group) => void;

	/** Remove a group by ID. */
	removeGroup: (id: string) => void;

	/** Update a group by ID with a partial update. */
	updateGroup: (id: string, updates: Partial<Group>) => void;

	/** Toggle a group's collapsed state. */
	toggleGroupCollapsed: (id: string) => void;

	// === Initialization ===

	setSessionsLoaded: (loaded: boolean | ((prev: boolean) => boolean)) => void;
	setInitialLoadComplete: (complete: boolean | ((prev: boolean) => boolean)) => void;
	setInitialFileTreeReady: (ready: boolean | ((prev: boolean) => boolean)) => void;

	// === Bookmarks ===

	/** Toggle the bookmark flag on a session. */
	toggleBookmark: (sessionId: string) => void;

	// === Worktree tracking ===

	/** Mark a worktree path as removed (prevents re-discovery during this session). */
	addRemovedWorktreePath: (path: string) => void;

	/** Replace the entire removed worktree paths set. */
	setRemovedWorktreePaths: (paths: Set<string> | ((prev: Set<string>) => Set<string>)) => void;

	// === Navigation ===

	setCyclePosition: (pos: number) => void;
	resetCyclePosition: () => void;

	// === Log management ===

	/**
	 * Add a log entry to a specific tab's logs (or active tab if no tabId provided).
	 * Used for slash commands, system messages, queued items, etc.
	 */
	addLogToTab: (
		sessionId: string,
		logEntry: Omit<LogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: number },
		tabId?: string
	) => void;
}

export type SessionStore = SessionStoreState & SessionStoreActions;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Helper to resolve a value-or-updater argument, matching React's setState signature.
 */
function resolve<T>(valOrFn: T | ((prev: T) => T), prev: T): T {
	return typeof valOrFn === 'function' ? (valOrFn as (prev: T) => T)(prev) : valOrFn;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useSessionStore = create<SessionStore>()((set) => ({
	// --- State ---
	sessions: [],
	groups: [],
	activeSessionId: '',
	sessionsLoaded: false,
	initialLoadComplete: false,
	initialFileTreeReady: false,
	removedWorktreePaths: new Set(),
	cyclePosition: -1,

	// --- Actions ---

	// Session CRUD
	setSessions: (v) =>
		set((s) => {
			const newSessions = resolve(v, s.sessions);
			// Skip if same reference (no-op update)
			if (newSessions === s.sessions) return s;
			return { sessions: newSessions };
		}),

	addSession: (session) => set((s) => ({ sessions: [...s.sessions, session] })),

	removeSession: (id) =>
		set((s) => {
			const filtered = s.sessions.filter((session) => session.id !== id);
			// Skip if nothing was removed
			if (filtered.length === s.sessions.length) return s;
			return { sessions: filtered };
		}),

	updateSession: (id, updates) =>
		set((s) => {
			let found = false;
			const newSessions = s.sessions.map((session) => {
				if (session.id === id) {
					found = true;
					return { ...session, ...updates };
				}
				return session;
			});
			// Skip if session not found
			if (!found) return s;
			return { sessions: newSessions };
		}),

	// Active session
	setActiveSessionId: (id) => {
		set({ activeSessionId: id, cyclePosition: -1 });
		// Activating an agent through the public setter (clicks, external jumps)
		// clears the Starred/Group-Chat keyboard cursor so a stale non-agent
		// highlight never lingers. The cycle re-sets it afterward when it lands on
		// a starred row (see useCycleSession.activateVisualItem).
		useUIStore.getState().setSidebarExtraSelection(null);
		// Fire-and-forget: persist to disk for restore on next launch.
		// Not awaited — UI state must update synchronously; if the write
		// fails the only consequence is the session won't be pre-selected
		// on next launch (falls back to first session).
		window.maestro?.sessions?.setActiveSessionId(id);
	},

	hydrateActiveSessionId: (id) => set({ activeSessionId: id, cyclePosition: -1 }),

	setActiveSessionIdInternal: (v) =>
		set((s) => ({ activeSessionId: resolve(v, s.activeSessionId) })),

	// Groups
	setGroups: (v) =>
		set((s) => {
			const newGroups = resolve(v, s.groups);
			if (newGroups === s.groups) return s;
			return { groups: newGroups };
		}),

	addGroup: (group) => set((s) => ({ groups: [...s.groups, group] })),

	removeGroup: (id) =>
		set((s) => {
			const filtered = s.groups.filter((g) => g.id !== id);
			if (filtered.length === s.groups.length) return s;
			return { groups: filtered };
		}),

	updateGroup: (id, updates) =>
		set((s) => {
			let found = false;
			const newGroups = s.groups.map((g) => {
				if (g.id === id) {
					found = true;
					return { ...g, ...updates };
				}
				return g;
			});
			if (!found) return s;
			return { groups: newGroups };
		}),

	toggleGroupCollapsed: (id) =>
		set((s) => ({
			groups: s.groups.map((g) => (g.id === id ? { ...g, collapsed: !g.collapsed } : g)),
		})),

	// Initialization
	setSessionsLoaded: (v) => set((s) => ({ sessionsLoaded: resolve(v, s.sessionsLoaded) })),
	setInitialLoadComplete: (v) =>
		set((s) => ({ initialLoadComplete: resolve(v, s.initialLoadComplete) })),
	setInitialFileTreeReady: (v) =>
		set((s) => ({ initialFileTreeReady: resolve(v, s.initialFileTreeReady) })),

	// Bookmarks
	toggleBookmark: (sessionId) =>
		set((s) => ({
			sessions: s.sessions.map((session) =>
				session.id === sessionId ? { ...session, bookmarked: !session.bookmarked } : session
			),
		})),

	// Worktree tracking
	addRemovedWorktreePath: (path) =>
		set((s) => {
			const newPaths = new Set(s.removedWorktreePaths);
			newPaths.add(path);
			return { removedWorktreePaths: newPaths };
		}),

	setRemovedWorktreePaths: (v) =>
		set((s) => ({
			removedWorktreePaths: resolve(v, s.removedWorktreePaths),
		})),

	// Navigation
	setCyclePosition: (pos) => set({ cyclePosition: pos }),
	resetCyclePosition: () => set({ cyclePosition: -1 }),

	// Log management
	addLogToTab: (sessionId, logEntry, tabId?) =>
		set((s) => {
			const entry: LogEntry = {
				id: logEntry.id || generateId(),
				timestamp: logEntry.timestamp || Date.now(),
				source: logEntry.source,
				text: logEntry.text,
				...(logEntry.images && { images: logEntry.images }),
				...(logEntry.delivered !== undefined && { delivered: logEntry.delivered }),
				...('aiCommand' in logEntry && logEntry.aiCommand && { aiCommand: logEntry.aiCommand }),
			};

			const newSessions = s.sessions.map((session) => {
				if (session.id !== sessionId) return session;

				const targetTab = tabId
					? session.aiTabs.find((tab) => tab.id === tabId)
					: getActiveTab(session);

				if (!targetTab) {
					logger.error(
						'[addLogToTab] No target tab found - session has no aiTabs, this should not happen'
					);
					return session;
				}

				return {
					...session,
					aiTabs: session.aiTabs.map((tab) =>
						tab.id === targetTab.id ? { ...tab, logs: [...tab.logs, entry] } : tab
					),
				};
			});

			return { sessions: newSessions };
		}),
}));

// ============================================================================
// Selector Helpers
// ============================================================================

/**
 * Select the active session object (derived from sessions + activeSessionId).
 * Falls back to first session if activeSessionId doesn't match, then null.
 *
 * @example
 * const activeSession = useSessionStore(selectActiveSession);
 */
export const selectActiveSession = (state: SessionStore): Session | null =>
	state.sessions.find((s) => s.id === state.activeSessionId) || state.sessions[0] || null;

/**
 * Select a specific session by ID.
 *
 * @example
 * const session = useSessionStore(selectSessionById('abc-123'));
 */
export const selectSessionById =
	(id: string) =>
	(state: SessionStore): Session | undefined =>
		state.sessions.find((s) => s.id === id);

export const selectIsAnySessionBusy = (state: SessionStore): boolean =>
	state.sessions.some((s) => s.state === 'busy');

// ============================================================================
// Non-React Access
// ============================================================================

/**
 * Update a session by ID using a mapper function.
 * Convenience helper for call sites that need a full session → session transform
 * rather than just a Partial<Session> update.
 *
 * Operates directly on the store outside of React — safe to call from callbacks.
 *
 * @example
 * updateSessionWith(activeSession.id, (s) => ({ ...s, batchRunnerPrompt: prompt }));
 */
export function updateSessionWith(sessionId: string, updater: (session: Session) => Session): void {
	useSessionStore
		.getState()
		.setSessions((prev: Session[]) => prev.map((s) => (s.id === sessionId ? updater(s) : s)));
}

/**
 * Update a specific AI tab within a session using a mapper function.
 * Convenience helper for tab-level updates that need a full tab → tab transform.
 *
 * Operates directly on the store outside of React — safe to call from callbacks.
 *
 * @example
 * updateAiTab(sessionId, tabId, (tab) => ({ ...tab, autoSendOnActivate: false }));
 */
export function updateAiTab(
	sessionId: string,
	tabId: string,
	updater: (tab: AITab) => AITab
): void {
	useSessionStore.getState().setSessions((prev: Session[]) =>
		prev.map((s) => {
			if (s.id !== sessionId) return s;
			return {
				...s,
				aiTabs: s.aiTabs.map((t) => (t.id === tabId ? updater(t) : t)),
			};
		})
	);
}

// ============================================================================
// Execution-queue enqueue / dispatch
// ============================================================================

/**
 * Fields needed to construct a {@link QueuedItem}. Shared by every "send into a
 * tab" path (local input bar, slash commands, remote new-tab offload).
 */
export interface BuildQueuedItemParams {
	/** Target tab for this item. */
	tabId: string;
	/** 'message' or 'command'. */
	type: QueuedItemType;
	/** Message text (for type 'message'). */
	text?: string;
	/** Attached images (base64 data URLs). */
	images?: string[];
	/** Slash command (for type 'command'). */
	command?: string;
	/** Arguments after the command (for $ARGUMENTS substitution). */
	commandArgs?: string;
	/** Command description for display. */
	commandDescription?: string;
	/** Tab name at time of queuing (for display). */
	tabName?: string;
	/** True when the item originates from a read-only tab. */
	readOnlyMode: boolean;
	/** Force-parallel: dispatch as soon as THIS tab is free, skipping cross-tab wait. */
	forceParallel?: boolean;
}

/**
 * Build a {@link QueuedItem} from the given fields. Centralizes the item shape so
 * the local input path and the remote offload path don't hand-roll the literal.
 */
export function buildQueuedItem(params: BuildQueuedItemParams): QueuedItem {
	const {
		tabId,
		type,
		text,
		images,
		command,
		commandArgs,
		commandDescription,
		tabName,
		readOnlyMode,
		forceParallel,
	} = params;
	return {
		id: generateId(),
		timestamp: Date.now(),
		tabId,
		type,
		...(text !== undefined && { text }),
		...(images !== undefined && { images }),
		...(command !== undefined && { command }),
		...(commandArgs !== undefined && { commandArgs }),
		...(commandDescription !== undefined && { commandDescription }),
		...(tabName !== undefined && { tabName }),
		readOnlyMode,
		...(forceParallel && { forceParallel: true }),
	};
}

export interface EnqueueOrDispatchInputParams extends BuildQueuedItemParams {
	/** The session that owns the target tab. */
	sessionId: string;
	/** Snapshot of that session used for the run-now-vs-queue decision. */
	session: Session;
	/** Whether an Auto Run batch is active for this session (forces queuing). */
	isAutoRunActive: boolean;
	/** Dispatcher for immediate execution (the renderer's processQueuedItem). */
	processQueuedItem: (sessionId: string, item: QueuedItem) => void;
	/**
	 * Optional extra session fields merged into BOTH branches (immediate dispatch
	 * and queue append), e.g. updating `aiCommandHistory`. Receives the previous
	 * session so the patch can read existing values.
	 */
	sessionPatch?: (session: Session) => Partial<Session>;
}

export interface EnqueueOrDispatchInputResult {
	/** The built queued item (whether dispatched now or appended to the queue). */
	item: QueuedItem;
	/** True when the item was appended to the queue; false when dispatched now. */
	queued: boolean;
}

/**
 * Hybrid run-now-vs-queue decision shared by the local input path and the remote
 * new-tab offload path. Builds the {@link QueuedItem}, decides whether to run it
 * immediately or queue it, and applies the matching session mutation via
 * {@link updateSessionWith}:
 *
 * - **forceParallel**: run now unless THIS tab is already busy.
 * - **otherwise**: run now when the session is idle and Auto Run isn't active;
 *   else append to the execution queue. `useQueueProcessing` then dispatches the
 *   queued item once the session goes idle.
 *
 * When running immediately, the session and target tab are flipped to busy and
 * the item is dispatched on a 50ms timeout so React commits the busy state
 * before the agent spawns (prevents duplicate processing). When queued, the item
 * is appended and nothing spawns yet.
 */
export function enqueueOrDispatchInput(
	params: EnqueueOrDispatchInputParams
): EnqueueOrDispatchInputResult {
	const { sessionId, session, isAutoRunActive, processQueuedItem, sessionPatch, ...buildParams } =
		params;
	const item = buildQueuedItem(buildParams);
	const targetTab = session.aiTabs.find((t) => t.id === item.tabId);

	const sessionIsIdle = buildParams.forceParallel
		? targetTab?.state !== 'busy'
		: session.state !== 'busy' && !isAutoRunActive;

	if (sessionIsIdle) {
		// Set up session + tab busy state, then dispatch immediately. Don't add to
		// executionQueue: it's not actually queued, and adding it would double-render
		// (once as a sent message, once in the queue section).
		updateSessionWith(sessionId, (s) => ({
			...s,
			state: 'busy' as SessionState,
			busySource: 'ai',
			thinkingStartTime: Date.now(),
			currentCycleTokens: 0,
			currentCycleBytes: 0,
			aiTabs: s.aiTabs.map((tab) =>
				tab.id === item.tabId
					? { ...tab, state: 'busy' as const, thinkingStartTime: Date.now() }
					: tab
			),
			...(sessionPatch?.(s) ?? {}),
		}));

		// 50ms delay lets React flush the busy state above before processQueuedItem
		// runs, so the session is already 'busy' when the agent spawns.
		setTimeout(() => {
			processQueuedItem(sessionId, item);
		}, 50);

		return { item, queued: false };
	}

	// Session is busy - append to the queue; it will be dispatched when the
	// session goes idle (via useQueueProcessing's runtime recovery / on-exit).
	updateSessionWith(sessionId, (s) => ({
		...s,
		executionQueue: [...s.executionQueue, item],
		...(sessionPatch?.(s) ?? {}),
	}));

	return { item, queued: true };
}
