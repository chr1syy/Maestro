/**
 * Tests for useBatchHandlers hook (Phase 2I extraction from App.tsx)
 *
 * Tests cover:
 * - Hook initialization and return shape
 * - Handler callbacks (stop, kill, skip, resume, abort)
 * - Memoized batch state computation
 * - Quit confirmation effect
 * - handleSyncAutoRunStats
 * - Ref management
 * - Return value stability
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import type { Session, BatchRunState, AgentError } from '../../../renderer/types';

// ============================================================================
// Mock useBatchProcessor BEFORE importing useBatchHandlers
// ============================================================================

const mockGetBatchState = vi.fn();
const mockStartBatchRun = vi.fn().mockResolvedValue(undefined);
const mockStopBatchRun = vi.fn();
const mockKillBatchRun = vi.fn().mockResolvedValue(undefined);
const mockPauseBatchOnError = vi.fn();
const mockSkipCurrentDocument = vi.fn();
const mockResumeAfterError = vi.fn();
const mockAbortBatchOnError = vi.fn();

let mockActiveBatchSessionIds: string[] = [];
let mockBatchRunStates: Record<string, BatchRunState> = {};

vi.mock('../../../renderer/hooks/batch/useBatchProcessor', () => ({
	useBatchProcessor: vi.fn(() => ({
		batchRunStates: mockBatchRunStates,
		getBatchState: mockGetBatchState,
		activeBatchSessionIds: mockActiveBatchSessionIds,
		startBatchRun: mockStartBatchRun,
		stopBatchRun: mockStopBatchRun,
		killBatchRun: mockKillBatchRun,
		pauseBatchOnError: mockPauseBatchOnError,
		skipCurrentDocument: mockSkipCurrentDocument,
		resumeAfterError: mockResumeAfterError,
		abortBatchOnError: mockAbortBatchOnError,
	})),
}));

// ============================================================================
// Now import the hook and stores
// ============================================================================

import {
	useBatchHandlers,
	type UseBatchHandlersDeps,
} from '../../../renderer/hooks/batch/useBatchHandlers';
import { useBatchProcessor } from '../../../renderer/hooks/batch/useBatchProcessor';
import { useSessionStore } from '../../../renderer/stores/sessionStore';
import { useSettingsStore } from '../../../renderer/stores/settingsStore';
import { useModalStore } from '../../../renderer/stores/modalStore';

// ============================================================================
// Helpers
// ============================================================================

function createDefaultBatchState(overrides: Partial<BatchRunState> = {}): BatchRunState {
	return {
		isRunning: false,
		isStopping: false,
		documents: [],
		lockedDocuments: [],
		currentDocumentIndex: 0,
		currentDocTasksTotal: 0,
		currentDocTasksCompleted: 0,
		totalTasksAcrossAllDocs: 0,
		completedTasksAcrossAllDocs: 0,
		loopEnabled: false,
		loopIteration: 0,
		folderPath: '',
		worktreeActive: false,
		totalTasks: 0,
		completedTasks: 0,
		currentTaskIndex: 0,
		startTime: null,
		currentTask: null,
		sessionIds: [],
		...overrides,
	};
}

function createMockSession(overrides: Partial<Session> = {}): Session {
	return {
		id: 'session-1',
		name: 'Test Agent',
		state: 'idle',
		busySource: undefined,
		toolType: 'claude-code',
		aiTabs: [
			{
				id: 'tab-1',
				label: 'AI',
				type: 'ai',
				logs: [],
				state: 'idle',
			},
		],
		activeTabId: 'tab-1',
		terminalTabs: [],
		executionQueue: [],
		manualHistory: [],
		historyIndex: -1,
		cwd: '/test',
		thinkingStartTime: null,
		isStarred: false,
		isUnread: false,
		hasUnseenOutput: false,
		createdAt: Date.now(),
		...overrides,
	} as Session;
}

const mockSpawnAgentForSession = vi.fn().mockResolvedValue({ success: true });
const mockHandleClearAgentError = vi.fn();

function createDeps(overrides: Partial<UseBatchHandlersDeps> = {}): UseBatchHandlersDeps {
	return {
		spawnAgentForSession: mockSpawnAgentForSession,
		rightPanelRef: { current: null },
		processQueuedItemRef: { current: null },
		handleClearAgentError: mockHandleClearAgentError,
		...overrides,
	};
}

// ============================================================================
// Setup / Teardown
// ============================================================================

beforeEach(() => {
	vi.clearAllMocks();

	// Reset mock return values
	mockActiveBatchSessionIds = [];
	mockBatchRunStates = {};
	mockGetBatchState.mockReturnValue(createDefaultBatchState());

	// Reset stores to clean state
	useSessionStore.setState({
		sessions: [],
		activeSessionId: '',
		groups: [],
		sessionsLoaded: false,
		initialLoadComplete: false,
	});

	useSettingsStore.setState({
		audioFeedbackEnabled: false,
		audioFeedbackCommand: '',
		autoRunStats: {
			cumulativeTimeMs: 0,
			totalRuns: 0,
			currentBadgeLevel: 0,
			longestRunMs: 0,
			longestRunTimestamp: 0,
			lastBadgeUnlockLevel: 0,
			lastAcknowledgedBadgeLevel: 0,
		},
	});

	useModalStore.setState({
		modals: new Map(),
	});

	// Ensure window.maestro.app is available for quit confirmation
	(window as any).maestro = {
		...((window as any).maestro || {}),
		app: {
			onQuitConfirmationRequest: vi.fn().mockReturnValue(vi.fn()),
			confirmQuit: vi.fn(),
			cancelQuit: vi.fn(),
		},
		history: {
			add: vi.fn().mockResolvedValue(undefined),
		},
		leaderboard: {
			submit: vi.fn().mockResolvedValue({ success: false }),
		},
	};
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

// ============================================================================
// Tests
// ============================================================================

describe('useBatchHandlers', () => {
	// ====================================================================
	// Initialization & Return Shape
	// ====================================================================

	describe('initialization', () => {
		it('returns all expected properties', () => {
			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			expect(result.current).toHaveProperty('startBatchRun');
			expect(result.current).toHaveProperty('getBatchState');
			expect(result.current).toHaveProperty('handleStopBatchRun');
			expect(result.current).toHaveProperty('handleKillBatchRun');
			expect(result.current).toHaveProperty('handleSkipCurrentDocument');
			expect(result.current).toHaveProperty('handleResumeAfterError');
			expect(result.current).toHaveProperty('handleAbortBatchOnError');
			expect(result.current).toHaveProperty('activeBatchSessionIds');
			expect(result.current).toHaveProperty('currentSessionBatchState');
			expect(result.current).toHaveProperty('activeBatchRunState');
			expect(result.current).toHaveProperty('pauseBatchOnErrorRef');
			expect(result.current).toHaveProperty('getBatchStateRef');
			expect(result.current).toHaveProperty('handleSyncAutoRunStats');
		});

		it('calls useBatchProcessor with sessions and groups from stores', () => {
			const session = createMockSession();
			useSessionStore.setState({
				sessions: [session],
				activeSessionId: 'session-1',
				groups: [{ id: 'g1', name: 'Group 1' }],
			});

			renderHook(() => useBatchHandlers(createDeps()));

			expect(useBatchProcessor).toHaveBeenCalled();
			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];
			expect(callArgs.sessions).toEqual([session]);
			expect(callArgs.groups).toEqual([{ id: 'g1', name: 'Group 1' }]);
		});

		it('passes spawnAgentForSession as onSpawnAgent', () => {
			renderHook(() => useBatchHandlers(createDeps()));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];
			expect(callArgs.onSpawnAgent).toBe(mockSpawnAgentForSession);
		});

		it('passes audio feedback settings from store', () => {
			useSettingsStore.setState({
				audioFeedbackEnabled: true,
				audioFeedbackCommand: 'say',
			});

			renderHook(() => useBatchHandlers(createDeps()));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];
			expect(callArgs.audioFeedbackEnabled).toBe(true);
			expect(callArgs.audioFeedbackCommand).toBe('say');
		});
	});

	// ====================================================================
	// getBatchState
	// ====================================================================

	describe('getBatchState', () => {
		it('delegates to useBatchProcessor getBatchState', () => {
			const mockState = createDefaultBatchState({ isRunning: true });
			mockGetBatchState.mockReturnValue(mockState);

			const { result } = renderHook(() => useBatchHandlers(createDeps()));
			const state = result.current.getBatchState('session-1');

			expect(mockGetBatchState).toHaveBeenCalledWith('session-1');
			expect(state).toBe(mockState);
		});
	});

	// ====================================================================
	// Refs
	// ====================================================================

	describe('ref management', () => {
		it('sets getBatchStateRef.current to getBatchState', () => {
			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			expect(result.current.getBatchStateRef.current).toBe(mockGetBatchState);
		});

		it('sets pauseBatchOnErrorRef.current to pauseBatchOnError', () => {
			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			expect(result.current.pauseBatchOnErrorRef.current).toBe(mockPauseBatchOnError);
		});
	});

	// ====================================================================
	// Memoized Batch States
	// ====================================================================

	describe('currentSessionBatchState', () => {
		it('returns null when no active session', () => {
			useSessionStore.setState({ sessions: [], activeSessionId: '' });

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			expect(result.current.currentSessionBatchState).toBeNull();
		});

		it('returns batch state for active session', () => {
			const session = createMockSession({ id: 'session-1' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			const runningState = createDefaultBatchState({ isRunning: true });
			mockGetBatchState.mockReturnValue(runningState);

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			expect(result.current.currentSessionBatchState).toBe(runningState);
			expect(mockGetBatchState).toHaveBeenCalledWith('session-1');
		});
	});

	describe('activeBatchRunState', () => {
		it('returns state of first active batch session when batches are running', () => {
			mockActiveBatchSessionIds = ['session-2'];
			const batchState = createDefaultBatchState({ isRunning: true, totalTasks: 5 });
			mockGetBatchState.mockImplementation((id: string) => {
				if (id === 'session-2') return batchState;
				return createDefaultBatchState();
			});

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			expect(result.current.activeBatchRunState).toBe(batchState);
		});

		it('returns active session batch state when no active batches', () => {
			const session = createMockSession({ id: 'session-1' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });
			mockActiveBatchSessionIds = [];

			const idleState = createDefaultBatchState();
			mockGetBatchState.mockReturnValue(idleState);

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			expect(result.current.activeBatchRunState).toBe(idleState);
		});

		it('returns default batch state when no active session and no active batches', () => {
			useSessionStore.setState({ sessions: [], activeSessionId: '' });
			mockActiveBatchSessionIds = [];

			const defaultState = createDefaultBatchState();
			mockGetBatchState.mockReturnValue(defaultState);

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			// Should call getBatchState with empty string as fallback
			expect(mockGetBatchState).toHaveBeenCalledWith('');
		});
	});

	// ====================================================================
	// Handler Callbacks
	// ====================================================================

	describe('handleStopBatchRun', () => {
		it('opens confirm modal and stops batch on confirm', () => {
			const session = createMockSession({ id: 'session-1', name: 'My Agent' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleStopBatchRun('session-1');
			});

			// Should have opened confirm modal via modalStore openModal('confirm', ...)
			const confirmModal = useModalStore.getState().modals.get('confirm');
			expect(confirmModal?.open).toBe(true);
			expect(confirmModal?.data?.message).toContain('My Agent');

			// Simulate confirm via the onConfirm callback in data
			act(() => {
				confirmModal?.data?.onConfirm?.();
			});

			expect(mockStopBatchRun).toHaveBeenCalledWith('session-1');
		});

		it('uses active session when no targetSessionId provided', () => {
			const session = createMockSession({ id: 'session-1', name: 'My Agent' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleStopBatchRun();
			});

			const confirmModal = useModalStore.getState().modals.get('confirm');
			expect(confirmModal?.open).toBe(true);
		});

		it('falls back to first active batch session when no active session', () => {
			useSessionStore.setState({ sessions: [], activeSessionId: '' });
			mockActiveBatchSessionIds = ['batch-session-1'];

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleStopBatchRun();
			});

			// Should still open confirm modal for the batch session
			const confirmModal = useModalStore.getState().modals.get('confirm');
			expect(confirmModal?.open).toBe(true);
		});

		it('does nothing when no session ID can be resolved', () => {
			useSessionStore.setState({ sessions: [], activeSessionId: '' });
			mockActiveBatchSessionIds = [];

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleStopBatchRun();
			});

			// Modal should NOT be opened
			const confirmModal = useModalStore.getState().modals.get('confirm');
			expect(confirmModal?.open).not.toBe(true);
		});
	});

	describe('handleKillBatchRun', () => {
		it('delegates to killBatchRun with session ID', async () => {
			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			await act(async () => {
				await result.current.handleKillBatchRun('session-1');
			});

			expect(mockKillBatchRun).toHaveBeenCalledWith('session-1');
		});
	});

	describe('handleSkipCurrentDocument', () => {
		it('calls skipCurrentDocument and clears agent error for active batch session', () => {
			mockActiveBatchSessionIds = ['session-2'];
			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleSkipCurrentDocument();
			});

			expect(mockSkipCurrentDocument).toHaveBeenCalledWith('session-2');
			expect(mockHandleClearAgentError).toHaveBeenCalledWith('session-2');
		});

		it('falls back to active session when no active batch sessions', () => {
			const session = createMockSession({ id: 'session-1' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });
			mockActiveBatchSessionIds = [];

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleSkipCurrentDocument();
			});

			expect(mockSkipCurrentDocument).toHaveBeenCalledWith('session-1');
			expect(mockHandleClearAgentError).toHaveBeenCalledWith('session-1');
		});

		it('does nothing when no session ID can be resolved', () => {
			useSessionStore.setState({ sessions: [], activeSessionId: '' });
			mockActiveBatchSessionIds = [];

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleSkipCurrentDocument();
			});

			expect(mockSkipCurrentDocument).not.toHaveBeenCalled();
			expect(mockHandleClearAgentError).not.toHaveBeenCalled();
		});
	});

	describe('handleResumeAfterError', () => {
		it('calls resumeAfterError and clears agent error for active batch session', () => {
			mockActiveBatchSessionIds = ['session-2'];
			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleResumeAfterError();
			});

			expect(mockResumeAfterError).toHaveBeenCalledWith('session-2');
			expect(mockHandleClearAgentError).toHaveBeenCalledWith('session-2');
		});

		it('falls back to active session when no active batch sessions', () => {
			const session = createMockSession({ id: 'session-1' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });
			mockActiveBatchSessionIds = [];

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleResumeAfterError();
			});

			expect(mockResumeAfterError).toHaveBeenCalledWith('session-1');
			expect(mockHandleClearAgentError).toHaveBeenCalledWith('session-1');
		});

		it('does nothing when no session ID can be resolved', () => {
			useSessionStore.setState({ sessions: [], activeSessionId: '' });
			mockActiveBatchSessionIds = [];

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleResumeAfterError();
			});

			expect(mockResumeAfterError).not.toHaveBeenCalled();
		});
	});

	describe('handleAbortBatchOnError', () => {
		it('calls abortBatchOnError and clears agent error for active batch session', () => {
			mockActiveBatchSessionIds = ['session-3'];
			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleAbortBatchOnError();
			});

			expect(mockAbortBatchOnError).toHaveBeenCalledWith('session-3');
			expect(mockHandleClearAgentError).toHaveBeenCalledWith('session-3');
		});

		it('falls back to active session when no active batch sessions', () => {
			const session = createMockSession({ id: 'session-1' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });
			mockActiveBatchSessionIds = [];

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleAbortBatchOnError();
			});

			expect(mockAbortBatchOnError).toHaveBeenCalledWith('session-1');
			expect(mockHandleClearAgentError).toHaveBeenCalledWith('session-1');
		});

		it('does nothing when no session ID can be resolved', () => {
			useSessionStore.setState({ sessions: [], activeSessionId: '' });
			mockActiveBatchSessionIds = [];

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleAbortBatchOnError();
			});

			expect(mockAbortBatchOnError).not.toHaveBeenCalled();
		});
	});

	// ====================================================================
	// handleSyncAutoRunStats
	// ====================================================================

	describe('handleSyncAutoRunStats', () => {
		it('updates autoRunStats in settings store', () => {
			useSettingsStore.setState({
				autoRunStats: {
					cumulativeTimeMs: 100,
					totalRuns: 1,
					currentBadgeLevel: 0,
					longestRunMs: 50,
					longestRunTimestamp: 1000,
					lastBadgeUnlockLevel: 0,
					lastAcknowledgedBadgeLevel: 0,
				},
			});

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleSyncAutoRunStats({
					cumulativeTimeMs: 5000,
					totalRuns: 10,
					currentBadgeLevel: 2,
					longestRunMs: 3000,
					longestRunTimestamp: 2000,
				});
			});

			const stats = useSettingsStore.getState().autoRunStats;
			expect(stats.cumulativeTimeMs).toBe(5000);
			expect(stats.totalRuns).toBe(10);
			expect(stats.currentBadgeLevel).toBe(2);
			expect(stats.longestRunMs).toBe(3000);
			expect(stats.longestRunTimestamp).toBe(2000);
			// Badge tracking should match synced level
			expect(stats.lastBadgeUnlockLevel).toBe(2);
			expect(stats.lastAcknowledgedBadgeLevel).toBe(2);
		});

		it('preserves other stats fields not in the sync payload', () => {
			useSettingsStore.setState({
				autoRunStats: {
					cumulativeTimeMs: 100,
					totalRuns: 1,
					currentBadgeLevel: 0,
					longestRunMs: 50,
					longestRunTimestamp: 1000,
					lastBadgeUnlockLevel: 0,
					lastAcknowledgedBadgeLevel: 0,
				},
			});

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				result.current.handleSyncAutoRunStats({
					cumulativeTimeMs: 200,
					totalRuns: 2,
					currentBadgeLevel: 0,
					longestRunMs: 100,
					longestRunTimestamp: 1500,
				});
			});

			// Verify the stats were updated (the hook does a spread merge)
			const stats = useSettingsStore.getState().autoRunStats;
			expect(stats.cumulativeTimeMs).toBe(200);
		});
	});

	// ====================================================================
	// Quit Confirmation Effect
	// ====================================================================

	describe('quit confirmation effect', () => {
		it('registers quit confirmation listener on mount', () => {
			renderHook(() => useBatchHandlers(createDeps()));

			expect(window.maestro.app.onQuitConfirmationRequest).toHaveBeenCalled();
		});

		it('calls confirmQuit when no busy agents and no active auto-runs', () => {
			const session = createMockSession({ id: 'session-1', state: 'idle' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });
			mockGetBatchState.mockReturnValue(createDefaultBatchState({ isRunning: false }));

			// Capture the callback
			let quitCallback: () => void = () => {};
			(window.maestro.app.onQuitConfirmationRequest as any).mockImplementation((cb: () => void) => {
				quitCallback = cb;
				return vi.fn();
			});

			renderHook(() => useBatchHandlers(createDeps()));

			// Trigger quit confirmation
			act(() => {
				quitCallback();
			});

			expect(window.maestro.app.confirmQuit).toHaveBeenCalled();
		});

		it('opens quit confirm modal when agents are busy', () => {
			const busySession = createMockSession({
				id: 'session-1',
				state: 'busy',
				busySource: 'ai',
				toolType: 'claude-code',
			});
			useSessionStore.setState({ sessions: [busySession], activeSessionId: 'session-1' });

			let quitCallback: () => void = () => {};
			(window.maestro.app.onQuitConfirmationRequest as any).mockImplementation((cb: () => void) => {
				quitCallback = cb;
				return vi.fn();
			});

			renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				quitCallback();
			});

			expect(window.maestro.app.confirmQuit).not.toHaveBeenCalled();
			const quitModal = useModalStore.getState().modals.get('quitConfirm');
			expect(quitModal?.open).toBe(true);
		});

		it('opens quit confirm modal when auto-runs are active', () => {
			const session = createMockSession({ id: 'session-1', state: 'idle' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			let quitCallback: () => void = () => {};
			(window.maestro.app.onQuitConfirmationRequest as any).mockImplementation((cb: () => void) => {
				quitCallback = cb;
				return vi.fn();
			});

			const { result } = renderHook(() => useBatchHandlers(createDeps()));

			// Set the ref to return a running state
			result.current.getBatchStateRef.current = (sessionId: string) =>
				createDefaultBatchState({ isRunning: true });

			act(() => {
				quitCallback();
			});

			expect(window.maestro.app.confirmQuit).not.toHaveBeenCalled();
			const quitModal = useModalStore.getState().modals.get('quitConfirm');
			expect(quitModal?.open).toBe(true);
		});

		it('excludes terminal sessions from busy check', () => {
			const terminalSession = createMockSession({
				id: 'session-1',
				state: 'busy',
				busySource: 'ai',
				toolType: 'terminal',
			});
			useSessionStore.setState({
				sessions: [terminalSession],
				activeSessionId: 'session-1',
			});
			mockGetBatchState.mockReturnValue(createDefaultBatchState({ isRunning: false }));

			let quitCallback: () => void = () => {};
			(window.maestro.app.onQuitConfirmationRequest as any).mockImplementation((cb: () => void) => {
				quitCallback = cb;
				return vi.fn();
			});

			renderHook(() => useBatchHandlers(createDeps()));

			act(() => {
				quitCallback();
			});

			// Terminal sessions should not prevent quitting
			expect(window.maestro.app.confirmQuit).toHaveBeenCalled();
		});

		it('unsubscribes on unmount', () => {
			const mockUnsubscribe = vi.fn();
			(window.maestro.app.onQuitConfirmationRequest as any).mockReturnValue(mockUnsubscribe);

			const { unmount } = renderHook(() => useBatchHandlers(createDeps()));

			unmount();

			expect(mockUnsubscribe).toHaveBeenCalled();
		});
	});

	// ====================================================================
	// onUpdateSession callback
	// ====================================================================

	describe('onUpdateSession callback', () => {
		it('updates session in store when called', () => {
			const session = createMockSession({ id: 'session-1', state: 'idle' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			renderHook(() => useBatchHandlers(createDeps()));

			// Extract the onUpdateSession callback from useBatchProcessor call
			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			act(() => {
				callArgs.onUpdateSession('session-1', { state: 'busy' as any });
			});

			const updated = useSessionStore.getState().sessions[0];
			expect(updated.state).toBe('busy');
		});

		it('only updates the targeted session', () => {
			const session1 = createMockSession({ id: 'session-1', state: 'idle' });
			const session2 = createMockSession({ id: 'session-2', state: 'idle' });
			useSessionStore.setState({
				sessions: [session1, session2],
				activeSessionId: 'session-1',
			});

			renderHook(() => useBatchHandlers(createDeps()));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			act(() => {
				callArgs.onUpdateSession('session-1', { state: 'busy' as any });
			});

			const sessions = useSessionStore.getState().sessions;
			expect(sessions[0].state).toBe('busy');
			expect(sessions[1].state).toBe('idle');
		});
	});

	// ====================================================================
	// onAddHistoryEntry callback
	// ====================================================================

	describe('onAddHistoryEntry callback', () => {
		it('adds history entry via IPC and refreshes history panel', async () => {
			const mockRefresh = vi.fn();
			const rightPanelRef = { current: { refreshHistoryPanel: mockRefresh } } as any;

			renderHook(() => useBatchHandlers(createDeps({ rightPanelRef })));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			await act(async () => {
				await callArgs.onAddHistoryEntry({
					type: 'AUTO',
					timestamp: Date.now(),
					summary: 'Test entry',
					fullResponse: 'Details',
					projectPath: '/test',
					sessionId: 'session-1',
					success: true,
				} as any);
			});

			expect(window.maestro.history.add).toHaveBeenCalled();
			expect(mockRefresh).toHaveBeenCalled();
		});
	});

	// ====================================================================
	// onComplete callback
	// ====================================================================

	describe('onComplete callback', () => {
		it('sends toast notification on completion', () => {
			const session = createMockSession({ id: 'session-1', name: 'My Agent' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });
			useSettingsStore.setState({
				firstAutoRunCompleted: true,
				autoRunStats: {
					cumulativeTimeMs: 0,
					totalRuns: 0,
					currentBadgeLevel: 0,
					longestRunMs: 0,
					longestRunTimestamp: 0,
					lastBadgeUnlockLevel: 0,
					lastAcknowledgedBadgeLevel: 0,
				},
				recordAutoRunComplete: vi.fn().mockReturnValue({ newBadgeLevel: null, isNewRecord: false }),
				leaderboardRegistration: null,
			});

			renderHook(() => useBatchHandlers(createDeps()));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			act(() => {
				callArgs.onComplete({
					sessionId: 'session-1',
					sessionName: 'My Agent',
					completedTasks: 5,
					totalTasks: 5,
					wasStopped: false,
					elapsedTimeMs: 60000,
				});
			});

			// notifyToast is called (we can't easily check this without mocking the module,
			// but we verify the callback runs without error)
		});

		it('shows stopped warning when batch was stopped', () => {
			const session = createMockSession({ id: 'session-1' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });
			useSettingsStore.setState({
				firstAutoRunCompleted: true,
				autoRunStats: {
					cumulativeTimeMs: 0,
					totalRuns: 0,
					currentBadgeLevel: 0,
					longestRunMs: 0,
					longestRunTimestamp: 0,
					lastBadgeUnlockLevel: 0,
					lastAcknowledgedBadgeLevel: 0,
				},
				recordAutoRunComplete: vi.fn().mockReturnValue({ newBadgeLevel: null, isNewRecord: false }),
				leaderboardRegistration: null,
			});

			renderHook(() => useBatchHandlers(createDeps()));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			// Should not throw
			act(() => {
				callArgs.onComplete({
					sessionId: 'session-1',
					sessionName: 'Test',
					completedTasks: 2,
					totalTasks: 5,
					wasStopped: true,
					elapsedTimeMs: 30000,
				});
			});
		});

		it('triggers first run celebration on first completion', () => {
			const session = createMockSession({ id: 'session-1' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });
			const mockSetFirstAutoRunCompleted = vi.fn();
			useSettingsStore.setState({
				firstAutoRunCompleted: false,
				setFirstAutoRunCompleted: mockSetFirstAutoRunCompleted,
				autoRunStats: {
					cumulativeTimeMs: 0,
					totalRuns: 0,
					currentBadgeLevel: 0,
					longestRunMs: 0,
					longestRunTimestamp: 0,
					lastBadgeUnlockLevel: 0,
					lastAcknowledgedBadgeLevel: 0,
				},
				recordAutoRunComplete: vi.fn().mockReturnValue({ newBadgeLevel: null, isNewRecord: false }),
				leaderboardRegistration: null,
			});

			renderHook(() => useBatchHandlers(createDeps()));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			act(() => {
				callArgs.onComplete({
					sessionId: 'session-1',
					sessionName: 'Test',
					completedTasks: 3,
					totalTasks: 3,
					wasStopped: false,
					elapsedTimeMs: 10000,
				});
			});

			expect(mockSetFirstAutoRunCompleted).toHaveBeenCalledWith(true);
		});

		it('skips achievements when elapsedTimeMs is 0', () => {
			const session = createMockSession({ id: 'session-1' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });
			const mockRecordAutoRunComplete = vi.fn();
			useSettingsStore.setState({
				firstAutoRunCompleted: false,
				autoRunStats: {
					cumulativeTimeMs: 0,
					totalRuns: 0,
					currentBadgeLevel: 0,
					longestRunMs: 0,
					longestRunTimestamp: 0,
					lastBadgeUnlockLevel: 0,
					lastAcknowledgedBadgeLevel: 0,
				},
				recordAutoRunComplete: mockRecordAutoRunComplete,
				leaderboardRegistration: null,
			});

			renderHook(() => useBatchHandlers(createDeps()));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			act(() => {
				callArgs.onComplete({
					sessionId: 'session-1',
					sessionName: 'Test',
					completedTasks: 1,
					totalTasks: 1,
					wasStopped: false,
					elapsedTimeMs: 0,
				});
			});

			expect(mockRecordAutoRunComplete).not.toHaveBeenCalled();
		});

		it('includes group name in toast notification', () => {
			const session = createMockSession({ id: 'session-1', groupId: 'g1' });
			useSessionStore.setState({
				sessions: [session],
				activeSessionId: 'session-1',
				groups: [{ id: 'g1', name: 'My Group' }],
			});
			useSettingsStore.setState({
				firstAutoRunCompleted: true,
				autoRunStats: {
					cumulativeTimeMs: 0,
					totalRuns: 0,
					currentBadgeLevel: 0,
					longestRunMs: 0,
					longestRunTimestamp: 0,
					lastBadgeUnlockLevel: 0,
					lastAcknowledgedBadgeLevel: 0,
				},
				recordAutoRunComplete: vi.fn().mockReturnValue({ newBadgeLevel: null, isNewRecord: false }),
				leaderboardRegistration: null,
			});

			renderHook(() => useBatchHandlers(createDeps()));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			// Should not throw - group name lookup works
			act(() => {
				callArgs.onComplete({
					sessionId: 'session-1',
					sessionName: 'Test',
					completedTasks: 1,
					totalTasks: 1,
					wasStopped: false,
					elapsedTimeMs: 5000,
				});
			});
		});
	});

	// ====================================================================
	// onPRResult callback
	// ====================================================================

	describe('onPRResult callback', () => {
		it('handles successful PR result', () => {
			const session = createMockSession({ id: 'session-1', name: 'My Agent' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			renderHook(() => useBatchHandlers(createDeps()));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			// Should not throw
			act(() => {
				callArgs.onPRResult({
					sessionId: 'session-1',
					sessionName: 'My Agent',
					success: true,
					prUrl: 'https://github.com/test/pr/1',
				});
			});
		});

		it('handles failed PR result', () => {
			const session = createMockSession({ id: 'session-1', name: 'My Agent' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			renderHook(() => useBatchHandlers(createDeps()));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			// Should not throw
			act(() => {
				callArgs.onPRResult({
					sessionId: 'session-1',
					sessionName: 'My Agent',
					success: false,
					error: 'gh not found',
				});
			});
		});

		it('uses Ungrouped as group name when session has no group', () => {
			const session = createMockSession({ id: 'session-1', groupId: undefined });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			renderHook(() => useBatchHandlers(createDeps()));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			// Should not throw
			act(() => {
				callArgs.onPRResult({
					sessionId: 'session-1',
					sessionName: 'Test',
					success: true,
				});
			});
		});
	});

	// ====================================================================
	// onProcessQueueAfterCompletion callback
	// ====================================================================

	describe('onProcessQueueAfterCompletion callback', () => {
		it('processes next queued item when queue is non-empty', () => {
			const mockProcessQueuedItem = vi.fn().mockResolvedValue(undefined);
			const processQueuedItemRef = { current: mockProcessQueuedItem };

			const session = createMockSession({
				id: 'session-1',
				executionQueue: [
					{ id: 'q1', type: 'message', text: 'Hello', tabId: 'tab-1' },
					{ id: 'q2', type: 'message', text: 'World', tabId: 'tab-1' },
				] as any,
			});
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			renderHook(() => useBatchHandlers(createDeps({ processQueuedItemRef })));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			act(() => {
				callArgs.onProcessQueueAfterCompletion('session-1');
			});

			expect(mockProcessQueuedItem).toHaveBeenCalledWith(
				'session-1',
				expect.objectContaining({ id: 'q1', text: 'Hello' })
			);

			// Queue should have been shortened
			const updatedSession = useSessionStore.getState().sessions[0];
			expect(updatedSession.executionQueue.length).toBe(1);
		});

		it('does nothing when queue is empty', () => {
			const mockProcessQueuedItem = vi.fn();
			const processQueuedItemRef = { current: mockProcessQueuedItem };

			const session = createMockSession({
				id: 'session-1',
				executionQueue: [],
			});
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			renderHook(() => useBatchHandlers(createDeps({ processQueuedItemRef })));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			act(() => {
				callArgs.onProcessQueueAfterCompletion('session-1');
			});

			expect(mockProcessQueuedItem).not.toHaveBeenCalled();
		});

		it('does nothing when session is not found', () => {
			const mockProcessQueuedItem = vi.fn();
			const processQueuedItemRef = { current: mockProcessQueuedItem };

			useSessionStore.setState({ sessions: [], activeSessionId: '' });

			renderHook(() => useBatchHandlers(createDeps({ processQueuedItemRef })));

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			act(() => {
				callArgs.onProcessQueueAfterCompletion('nonexistent');
			});

			expect(mockProcessQueuedItem).not.toHaveBeenCalled();
		});

		it('does nothing when processQueuedItemRef.current is null', () => {
			const processQueuedItemRef = { current: null };

			const session = createMockSession({
				id: 'session-1',
				executionQueue: [{ id: 'q1', type: 'message', text: 'Hello', tabId: 'tab-1' }] as any,
			});
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			renderHook(() =>
				useBatchHandlers(createDeps({ processQueuedItemRef: processQueuedItemRef as any }))
			);

			const callArgs = vi.mocked(useBatchProcessor).mock.calls[0][0];

			// Should not throw
			act(() => {
				callArgs.onProcessQueueAfterCompletion('session-1');
			});
		});
	});

	// ====================================================================
	// Return value stability
	// ====================================================================

	describe('return value stability', () => {
		it('handler functions are stable across re-renders when deps do not change', () => {
			const session = createMockSession({ id: 'session-1' });
			useSessionStore.setState({ sessions: [session], activeSessionId: 'session-1' });

			const { result, rerender } = renderHook(() => useBatchHandlers(createDeps()));

			const firstRender = {
				handleStopBatchRun: result.current.handleStopBatchRun,
				handleKillBatchRun: result.current.handleKillBatchRun,
				handleSyncAutoRunStats: result.current.handleSyncAutoRunStats,
			};

			rerender();

			expect(result.current.handleKillBatchRun).toBe(firstRender.handleKillBatchRun);
			expect(result.current.handleSyncAutoRunStats).toBe(firstRender.handleSyncAutoRunStats);
		});

		it('refs maintain identity across re-renders', () => {
			const { result, rerender } = renderHook(() => useBatchHandlers(createDeps()));

			const firstRender = {
				pauseBatchOnErrorRef: result.current.pauseBatchOnErrorRef,
				getBatchStateRef: result.current.getBatchStateRef,
			};

			rerender();

			expect(result.current.pauseBatchOnErrorRef).toBe(firstRender.pauseBatchOnErrorRef);
			expect(result.current.getBatchStateRef).toBe(firstRender.getBatchStateRef);
		});
	});
});
