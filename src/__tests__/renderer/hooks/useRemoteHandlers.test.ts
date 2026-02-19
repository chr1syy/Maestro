/**
 * Tests for useRemoteHandlers hook (Phase 2K extraction from App.tsx)
 *
 * Tests cover:
 * - Hook initialization and return shape
 * - sessionSshRemoteNames memo (SSH name mapping)
 * - handleQuickActionsToggleRemoteControl (live mode toggle)
 * - handleRemoteCommand event listener (terminal + AI dispatching)
 * - Remote slash command handling
 * - Error handling in remote commands
 * - Return value stability
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import type { Session, CustomAICommand } from '../../../renderer/types';

// ============================================================================
// Mock modules BEFORE importing the hook
// ============================================================================

vi.mock('../../../renderer/utils/ids', () => ({
	generateId: vi.fn(() => 'mock-id-' + Math.random().toString(36).slice(2, 8)),
}));

vi.mock('../../../renderer/utils/templateVariables', () => ({
	substituteTemplateVariables: vi.fn((prompt: string) => prompt),
}));

vi.mock('../../../renderer/services/git', () => ({
	gitService: {
		getStatus: vi.fn().mockResolvedValue({ branch: 'main' }),
		getDiff: vi.fn().mockResolvedValue({ diff: '' }),
	},
}));

vi.mock('../../../renderer/utils/tabHelpers', () => ({
	getActiveTab: vi.fn((session: Session) => {
		if (!session?.aiTabs?.length) return null;
		return session.aiTabs.find((t: any) => t.id === session.activeTabId) || session.aiTabs[0];
	}),
}));

// ============================================================================
// Now import the hook and stores
// ============================================================================

import {
	useRemoteHandlers,
	type UseRemoteHandlersDeps,
} from '../../../renderer/hooks/remote/useRemoteHandlers';
import { useSessionStore } from '../../../renderer/stores/sessionStore';
import { useSettingsStore } from '../../../renderer/stores/settingsStore';
import { useUIStore } from '../../../renderer/stores/uiStore';

// ============================================================================
// Helpers
// ============================================================================

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
				name: 'Tab 1',
				inputValue: '',
				data: [],
				logs: [],
				stagedImages: [],
			},
		],
		activeTabId: 'tab-1',
		inputMode: 'ai',
		isGitRepo: false,
		cwd: '/test',
		projectRoot: '/test',
		shellLogs: [],
		shellCwd: '/test',
		terminalDraftInput: '',
		...overrides,
	} as Session;
}

function createMockDeps(overrides: Partial<UseRemoteHandlersDeps> = {}): UseRemoteHandlersDeps {
	return {
		sessionsRef: { current: [createMockSession()] },
		customAICommandsRef: { current: [] },
		speckitCommandsRef: { current: [] },
		openspecCommandsRef: { current: [] },
		toggleGlobalLive: vi.fn().mockResolvedValue(undefined),
		isLiveMode: false,
		sshRemoteConfigs: [],
		...overrides,
	};
}

// ============================================================================
// Setup / Teardown
// ============================================================================

beforeEach(() => {
	vi.clearAllMocks();

	// Reset stores
	const session = createMockSession();
	useSessionStore.setState({
		sessions: [session],
		activeSessionId: 'session-1',
	} as any);

	useSettingsStore.setState({
		conductorProfile: 'default',
	} as any);

	useUIStore.setState({
		setSuccessFlashNotification: vi.fn(),
	} as any);

	// Mock window.maestro APIs
	(window as any).maestro = {
		process: {
			spawn: vi.fn().mockResolvedValue(undefined),
			runCommand: vi.fn().mockResolvedValue(undefined),
		},
		agents: {
			get: vi.fn().mockResolvedValue({
				command: 'claude',
				path: '/usr/local/bin/claude',
				args: [],
			}),
		},
	};

	// Spy on addEventListener/removeEventListener for event listener tests
	vi.spyOn(window, 'addEventListener');
	vi.spyOn(window, 'removeEventListener');
});

afterEach(() => {
	cleanup();
});

// ============================================================================
// Tests
// ============================================================================

describe('useRemoteHandlers', () => {
	// ========================================================================
	// Initialization & return shape
	// ========================================================================

	describe('initialization', () => {
		it('returns all expected properties', () => {
			const { result } = renderHook(() => useRemoteHandlers(createMockDeps()));

			expect(result.current).toHaveProperty('handleQuickActionsToggleRemoteControl');
			expect(result.current).toHaveProperty('sessionSshRemoteNames');
		});

		it('handleQuickActionsToggleRemoteControl is a function', () => {
			const { result } = renderHook(() => useRemoteHandlers(createMockDeps()));
			expect(typeof result.current.handleQuickActionsToggleRemoteControl).toBe('function');
		});

		it('sessionSshRemoteNames is a Map', () => {
			const { result } = renderHook(() => useRemoteHandlers(createMockDeps()));
			expect(result.current.sessionSshRemoteNames).toBeInstanceOf(Map);
		});
	});

	// ========================================================================
	// sessionSshRemoteNames
	// ========================================================================

	describe('sessionSshRemoteNames', () => {
		it('returns empty map when no sessions have SSH config', () => {
			const { result } = renderHook(() => useRemoteHandlers(createMockDeps()));
			expect(result.current.sessionSshRemoteNames.size).toBe(0);
		});

		it('maps session names to SSH remote config names', () => {
			const session = createMockSession({
				name: 'My Agent',
				sessionSshRemoteConfig: {
					enabled: true,
					remoteId: 'remote-1',
				},
			});

			useSessionStore.setState({
				sessions: [session],
				activeSessionId: 'session-1',
			} as any);

			const deps = createMockDeps({
				sshRemoteConfigs: [{ id: 'remote-1', name: 'Production Server' }],
			});

			const { result } = renderHook(() => useRemoteHandlers(deps));

			expect(result.current.sessionSshRemoteNames.size).toBe(1);
			expect(result.current.sessionSshRemoteNames.get('My Agent')).toBe('Production Server');
		});

		it('skips sessions without enabled SSH config', () => {
			const session = createMockSession({
				name: 'Local Agent',
				sessionSshRemoteConfig: {
					enabled: false,
					remoteId: 'remote-1',
				},
			});

			useSessionStore.setState({
				sessions: [session],
				activeSessionId: 'session-1',
			} as any);

			const deps = createMockDeps({
				sshRemoteConfigs: [{ id: 'remote-1', name: 'Server' }],
			});

			const { result } = renderHook(() => useRemoteHandlers(deps));
			expect(result.current.sessionSshRemoteNames.size).toBe(0);
		});

		it('skips sessions with no matching SSH config', () => {
			const session = createMockSession({
				name: 'My Agent',
				sessionSshRemoteConfig: {
					enabled: true,
					remoteId: 'nonexistent',
				},
			});

			useSessionStore.setState({
				sessions: [session],
				activeSessionId: 'session-1',
			} as any);

			const deps = createMockDeps({
				sshRemoteConfigs: [{ id: 'remote-1', name: 'Server' }],
			});

			const { result } = renderHook(() => useRemoteHandlers(deps));
			expect(result.current.sessionSshRemoteNames.size).toBe(0);
		});

		it('maps multiple sessions to their SSH configs', () => {
			const sessions = [
				createMockSession({
					id: 's1',
					name: 'Agent A',
					sessionSshRemoteConfig: { enabled: true, remoteId: 'r1' },
				}),
				createMockSession({
					id: 's2',
					name: 'Agent B',
					sessionSshRemoteConfig: { enabled: true, remoteId: 'r2' },
				}),
				createMockSession({
					id: 's3',
					name: 'Local Agent',
				}),
			];

			useSessionStore.setState({
				sessions,
				activeSessionId: 's1',
			} as any);

			const deps = createMockDeps({
				sshRemoteConfigs: [
					{ id: 'r1', name: 'Prod' },
					{ id: 'r2', name: 'Staging' },
				],
			});

			const { result } = renderHook(() => useRemoteHandlers(deps));

			expect(result.current.sessionSshRemoteNames.size).toBe(2);
			expect(result.current.sessionSshRemoteNames.get('Agent A')).toBe('Prod');
			expect(result.current.sessionSshRemoteNames.get('Agent B')).toBe('Staging');
		});
	});

	// ========================================================================
	// handleQuickActionsToggleRemoteControl
	// ========================================================================

	describe('handleQuickActionsToggleRemoteControl', () => {
		it('calls toggleGlobalLive', async () => {
			const mockToggle = vi.fn().mockResolvedValue(undefined);
			const deps = createMockDeps({ toggleGlobalLive: mockToggle });

			const { result } = renderHook(() => useRemoteHandlers(deps));

			await act(async () => {
				await result.current.handleQuickActionsToggleRemoteControl();
			});

			expect(mockToggle).toHaveBeenCalledOnce();
		});

		it('shows LIVE notification when enabling', async () => {
			const mockSetFlash = vi.fn();
			useUIStore.setState({ setSuccessFlashNotification: mockSetFlash } as any);

			const deps = createMockDeps({ isLiveMode: false });
			const { result } = renderHook(() => useRemoteHandlers(deps));

			await act(async () => {
				await result.current.handleQuickActionsToggleRemoteControl();
			});

			expect(mockSetFlash).toHaveBeenCalledWith(expect.stringContaining('LIVE'));
		});

		it('shows OFFLINE notification when disabling', async () => {
			const mockSetFlash = vi.fn();
			useUIStore.setState({ setSuccessFlashNotification: mockSetFlash } as any);

			const deps = createMockDeps({ isLiveMode: true });
			const { result } = renderHook(() => useRemoteHandlers(deps));

			await act(async () => {
				await result.current.handleQuickActionsToggleRemoteControl();
			});

			expect(mockSetFlash).toHaveBeenCalledWith(expect.stringContaining('OFFLINE'));
		});
	});

	// ========================================================================
	// handleRemoteCommand event listener
	// ========================================================================

	describe('handleRemoteCommand event listener', () => {
		it('registers event listener on mount and removes on unmount', () => {
			const { unmount } = renderHook(() => useRemoteHandlers(createMockDeps()));

			expect(window.addEventListener).toHaveBeenCalledWith(
				'maestro:remoteCommand',
				expect.any(Function)
			);

			unmount();

			expect(window.removeEventListener).toHaveBeenCalledWith(
				'maestro:remoteCommand',
				expect.any(Function)
			);
		});

		it('dispatches terminal commands via runCommand', async () => {
			const session = createMockSession({ inputMode: 'terminal' });
			const deps = createMockDeps({
				sessionsRef: { current: [session] },
			});

			renderHook(() => useRemoteHandlers(deps));

			// Get the registered event handler
			const addListenerCall = (window.addEventListener as any).mock.calls.find(
				(call: any[]) => call[0] === 'maestro:remoteCommand'
			);
			const handler = addListenerCall[1];

			// Dispatch a terminal command
			await act(async () => {
				await handler(
					new CustomEvent('maestro:remoteCommand', {
						detail: {
							sessionId: 'session-1',
							command: 'ls -la',
							inputMode: 'terminal',
						},
					})
				);
			});

			expect(window.maestro.process.runCommand).toHaveBeenCalledWith(
				expect.objectContaining({
					sessionId: 'session-1',
					command: 'ls -la',
				})
			);
		});

		it('dispatches AI commands via spawn', async () => {
			const session = createMockSession({ inputMode: 'ai' });
			const deps = createMockDeps({
				sessionsRef: { current: [session] },
			});

			renderHook(() => useRemoteHandlers(deps));

			const addListenerCall = (window.addEventListener as any).mock.calls.find(
				(call: any[]) => call[0] === 'maestro:remoteCommand'
			);
			const handler = addListenerCall[1];

			await act(async () => {
				await handler(
					new CustomEvent('maestro:remoteCommand', {
						detail: {
							sessionId: 'session-1',
							command: 'explain this code',
							inputMode: 'ai',
						},
					})
				);
			});

			expect(window.maestro.process.spawn).toHaveBeenCalledWith(
				expect.objectContaining({
					prompt: 'explain this code',
				})
			);
		});

		it('ignores command when session not found', async () => {
			const deps = createMockDeps({
				sessionsRef: { current: [] },
			});

			renderHook(() => useRemoteHandlers(deps));

			const addListenerCall = (window.addEventListener as any).mock.calls.find(
				(call: any[]) => call[0] === 'maestro:remoteCommand'
			);
			const handler = addListenerCall[1];

			await act(async () => {
				await handler(
					new CustomEvent('maestro:remoteCommand', {
						detail: {
							sessionId: 'nonexistent',
							command: 'test',
						},
					})
				);
			});

			expect(window.maestro.process.spawn).not.toHaveBeenCalled();
			expect(window.maestro.process.runCommand).not.toHaveBeenCalled();
		});

		it('skips AI commands for busy sessions', async () => {
			const session = createMockSession({ state: 'busy', inputMode: 'ai' });
			const deps = createMockDeps({
				sessionsRef: { current: [session] },
			});

			renderHook(() => useRemoteHandlers(deps));

			const addListenerCall = (window.addEventListener as any).mock.calls.find(
				(call: any[]) => call[0] === 'maestro:remoteCommand'
			);
			const handler = addListenerCall[1];

			await act(async () => {
				await handler(
					new CustomEvent('maestro:remoteCommand', {
						detail: {
							sessionId: 'session-1',
							command: 'test',
							inputMode: 'ai',
						},
					})
				);
			});

			expect(window.maestro.process.spawn).not.toHaveBeenCalled();
		});

		it('skips unsupported agent types for AI mode', async () => {
			const session = createMockSession({
				inputMode: 'ai',
				toolType: 'terminal' as any,
			});
			const deps = createMockDeps({
				sessionsRef: { current: [session] },
			});

			renderHook(() => useRemoteHandlers(deps));

			const addListenerCall = (window.addEventListener as any).mock.calls.find(
				(call: any[]) => call[0] === 'maestro:remoteCommand'
			);
			const handler = addListenerCall[1];

			await act(async () => {
				await handler(
					new CustomEvent('maestro:remoteCommand', {
						detail: {
							sessionId: 'session-1',
							command: 'test',
							inputMode: 'ai',
						},
					})
				);
			});

			expect(window.maestro.process.spawn).not.toHaveBeenCalled();
		});

		it('handles slash commands by looking up custom commands', async () => {
			const customCommand: CustomAICommand = {
				command: '/deploy',
				description: 'Deploy the app',
				prompt: 'Deploy the application to production',
			};

			const session = createMockSession({ inputMode: 'ai' });
			const deps = createMockDeps({
				sessionsRef: { current: [session] },
				customAICommandsRef: { current: [customCommand] },
			});

			renderHook(() => useRemoteHandlers(deps));

			const addListenerCall = (window.addEventListener as any).mock.calls.find(
				(call: any[]) => call[0] === 'maestro:remoteCommand'
			);
			const handler = addListenerCall[1];

			await act(async () => {
				await handler(
					new CustomEvent('maestro:remoteCommand', {
						detail: {
							sessionId: 'session-1',
							command: '/deploy',
							inputMode: 'ai',
						},
					})
				);
			});

			expect(window.maestro.process.spawn).toHaveBeenCalledWith(
				expect.objectContaining({
					prompt: 'Deploy the application to production',
				})
			);
		});

		it('uses SSH remote CWD for terminal commands on remote sessions', async () => {
			const session = createMockSession({
				inputMode: 'terminal',
				sshRemoteId: 'remote-1',
				remoteCwd: '/remote/path',
				sessionSshRemoteConfig: {
					enabled: true,
					remoteId: 'remote-1',
				},
			});
			const deps = createMockDeps({
				sessionsRef: { current: [session] },
			});

			renderHook(() => useRemoteHandlers(deps));

			const addListenerCall = (window.addEventListener as any).mock.calls.find(
				(call: any[]) => call[0] === 'maestro:remoteCommand'
			);
			const handler = addListenerCall[1];

			await act(async () => {
				await handler(
					new CustomEvent('maestro:remoteCommand', {
						detail: {
							sessionId: 'session-1',
							command: 'pwd',
							inputMode: 'terminal',
						},
					})
				);
			});

			expect(window.maestro.process.runCommand).toHaveBeenCalledWith(
				expect.objectContaining({
					cwd: '/remote/path',
				})
			);
		});

		it('sets session state to busy when dispatching terminal command', async () => {
			const session = createMockSession({ inputMode: 'terminal' });
			const deps = createMockDeps({
				sessionsRef: { current: [session] },
			});

			renderHook(() => useRemoteHandlers(deps));

			const addListenerCall = (window.addEventListener as any).mock.calls.find(
				(call: any[]) => call[0] === 'maestro:remoteCommand'
			);
			const handler = addListenerCall[1];

			await act(async () => {
				await handler(
					new CustomEvent('maestro:remoteCommand', {
						detail: {
							sessionId: 'session-1',
							command: 'ls',
							inputMode: 'terminal',
						},
					})
				);
			});

			const sessions = useSessionStore.getState().sessions;
			const updatedSession = sessions.find((s) => s.id === 'session-1');
			expect(updatedSession?.state).toBe('busy');
			expect(updatedSession?.busySource).toBe('terminal');
		});

		it('handles terminal command errors gracefully', async () => {
			(window.maestro.process.runCommand as any).mockRejectedValue(new Error('Connection refused'));

			const session = createMockSession({ inputMode: 'terminal' });
			const deps = createMockDeps({
				sessionsRef: { current: [session] },
			});

			renderHook(() => useRemoteHandlers(deps));

			const addListenerCall = (window.addEventListener as any).mock.calls.find(
				(call: any[]) => call[0] === 'maestro:remoteCommand'
			);
			const handler = addListenerCall[1];

			await act(async () => {
				await handler(
					new CustomEvent('maestro:remoteCommand', {
						detail: {
							sessionId: 'session-1',
							command: 'ls',
							inputMode: 'terminal',
						},
					})
				);
			});

			// Session should be reset to idle
			const sessions = useSessionStore.getState().sessions;
			const updatedSession = sessions.find((s) => s.id === 'session-1');
			expect(updatedSession?.state).toBe('idle');
			// Error should be in shell logs
			const lastLog = updatedSession?.shellLogs[updatedSession.shellLogs.length - 1];
			expect(lastLog?.text).toContain('Connection refused');
		});
	});

	// ========================================================================
	// Return stability
	// ========================================================================

	describe('return stability', () => {
		it('maintains stable handler references when deps are stable', () => {
			const deps = createMockDeps();
			const { result, rerender } = renderHook(() => useRemoteHandlers(deps));

			const first = result.current.handleQuickActionsToggleRemoteControl;
			rerender();
			expect(result.current.handleQuickActionsToggleRemoteControl).toBe(first);
		});
	});
});
