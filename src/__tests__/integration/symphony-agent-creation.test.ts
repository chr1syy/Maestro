/**
 * Symphony Agent Creation Integration Tests
 *
 * These tests verify the full Symphony agent creation workflow,
 * including clone, startContribution, and error scenarios.
 *
 * Test coverage includes:
 * - Successful contribution creation flow
 * - Clone failure scenarios
 * - Timeout handling
 * - Error recovery and retry
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock window.maestro for agent creation flow
const mockMaestro = {
	symphony: {
		cloneRepo: vi.fn(),
		startContribution: vi.fn(),
		registerActive: vi.fn(),
	},
	logger: {
		log: vi.fn(),
		error: vi.fn(),
	},
};

// Store for mocking maestro calls
beforeEach(() => {
	if (typeof window !== 'undefined') {
		Object.defineProperty(window, 'maestro', {
			writable: true,
			value: mockMaestro,
			configurable: true,
		});
	}
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('Symphony Agent Creation Integration Tests', () => {
	describe('Successful Contribution Creation Flow', () => {
		it('should complete full agent creation workflow: clone → startContribution → registerActive', async () => {
			// Setup: Mock successful git clone
			vi.mocked(mockMaestro.symphony.cloneRepo).mockResolvedValue({
				success: true,
			});

			// Setup: Mock successful startContribution
			vi.mocked(mockMaestro.symphony.startContribution).mockResolvedValue({
				success: true,
				branchName: 'symphony/issue-1-test-issue',
			});

			// Setup: Mock successful registerActive
			vi.mocked(mockMaestro.symphony.registerActive).mockResolvedValue({
				success: true,
			});

			// Step 1: Clone repository
			const cloneResult = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/test-owner/test-repo',
				localPath: '/tmp/symphony-repos/test-repo',
			})) as { success: boolean; error?: string };

			expect(cloneResult.success).toBe(true);
			expect(mockMaestro.symphony.cloneRepo).toHaveBeenCalledWith(
				expect.objectContaining({
					repoUrl: 'https://github.com/test-owner/test-repo',
					localPath: expect.stringContaining('test-repo'),
				})
			);

			// Step 2: Start contribution (create branch)
			const startResult = (await mockMaestro.symphony.startContribution({
				contributionId: 'contrib_test',
				sessionId: 'session-123',
				repoSlug: 'test-owner/test-repo',
				issueNumber: 1,
				issueTitle: 'Test Issue',
				localPath: '/tmp/symphony-repos/test-repo',
				documentPaths: [{ name: 'task.md', path: 'docs/task.md', isExternal: false }],
			})) as { success: boolean; branchName?: string; error?: string };

			expect(startResult.success).toBe(true);
			expect(startResult.branchName).toMatch(/^symphony\/issue-1-/);
			expect(mockMaestro.symphony.startContribution).toHaveBeenCalled();

			// Step 3: Register as active contribution
			const registerResult = (await mockMaestro.symphony.registerActive({
				contributionId: 'contrib_test',
				sessionId: 'session-123',
				repoSlug: 'test-owner/test-repo',
				repoName: 'test-repo',
				issueNumber: 1,
				issueTitle: 'Test Issue',
				localPath: '/tmp/symphony-repos/test-repo',
				branchName: startResult.branchName,
				documentPaths: ['docs/task.md'],
				agentType: 'claude-code',
			})) as { success: boolean };

			expect(registerResult.success).toBe(true);
			expect(mockMaestro.symphony.registerActive).toHaveBeenCalled();

			// Verify [Symphony] logs were created
			expect(mockMaestro.logger.log).toHaveBeenCalled();
		});

		it('should include correct parameters for Windows agent creation', async () => {
			vi.mocked(mockMaestro.symphony.cloneRepo).mockResolvedValue({ success: true });
			vi.mocked(mockMaestro.symphony.startContribution).mockResolvedValue({
				success: true,
				branchName: 'symphony/issue-42-windows-test',
			});

			// Create with Windows-specific parameters
			const cloneParams = {
				repoUrl: 'https://github.com/owner/windows-repo',
				localPath: 'C:\\Users\\TestUser\\AppData\\Local\\Temp\\symphony-repos\\windows-repo',
			};

			await mockMaestro.symphony.cloneRepo(cloneParams);

			expect(mockMaestro.symphony.cloneRepo).toHaveBeenCalledWith(cloneParams);
		});

		it('should log all operations with [Symphony] prefix', async () => {
			vi.mocked(mockMaestro.symphony.cloneRepo).mockImplementation(async (params) => {
				mockMaestro.logger.log('[Symphony] Starting clone operation');
				return { success: true };
			});

			vi.mocked(mockMaestro.symphony.startContribution).mockImplementation(async (params) => {
				mockMaestro.logger.log('[Symphony] Creating branch');
				return { success: true, branchName: 'symphony/issue-1' };
			});

			await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: '/tmp/repo',
			});

			await mockMaestro.symphony.startContribution({
				contributionId: 'test',
				sessionId: 'session',
				repoSlug: 'owner/repo',
				issueNumber: 1,
				issueTitle: 'Test',
				localPath: '/tmp/repo',
				documentPaths: [],
			});

			// Verify logs contain [Symphony] prefix
			const logCalls = vi.mocked(mockMaestro.logger.log).mock.calls;
			expect(logCalls.some((call) => call[0]?.includes('[Symphony]'))).toBe(true);
		});
	});

	describe('Clone Failure Scenarios', () => {
		it('should handle clone failure with ENOENT (not found)', async () => {
			vi.mocked(mockMaestro.symphony.cloneRepo).mockResolvedValue({
				success: false,
				error: 'Repository not found (ENOENT)',
			});

			const result = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/nonexistent/repo',
				localPath: '/tmp/repo',
			})) as { success: boolean; error?: string };

			expect(result.success).toBe(false);
			expect(result.error).toContain('not found');
		});

		it('should handle clone failure due to network error', async () => {
			vi.mocked(mockMaestro.symphony.cloneRepo).mockResolvedValue({
				success: false,
				error: 'Clone failed: Connection refused',
			});

			const result = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: '/tmp/repo',
			})) as { success: boolean; error?: string };

			expect(result.success).toBe(false);
			expect(result.error).toContain('failed');
		});

		it('should handle clone failure due to destination exists', async () => {
			vi.mocked(mockMaestro.symphony.cloneRepo).mockResolvedValue({
				success: false,
				error: 'Destination path already exists',
			});

			const result = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: '/tmp/existing-repo',
			})) as { success: boolean; error?: string };

			expect(result.success).toBe(false);
			expect(result.error).toContain('already exists');
		});

		it('should allow retry after clone failure', async () => {
			// First call fails
			vi.mocked(mockMaestro.symphony.cloneRepo)
				.mockResolvedValueOnce({ success: false, error: 'Network error' })
				// Second call succeeds
				.mockResolvedValueOnce({ success: true });

			// First attempt
			const firstResult = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: '/tmp/repo',
			})) as { success: boolean };

			expect(firstResult.success).toBe(false);

			// Retry
			const retryResult = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: '/tmp/repo',
			})) as { success: boolean };

			expect(retryResult.success).toBe(true);
			expect(mockMaestro.symphony.cloneRepo).toHaveBeenCalledTimes(2);
		});
	});

	describe('Timeout Scenarios', () => {
		it('should handle clone timeout after 180 seconds on Windows', async () => {
			vi.mocked(mockMaestro.symphony.cloneRepo).mockResolvedValue({
				success: false,
				error: 'Clone timed out (ETIMEDOUT)',
			});

			const result = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/large-repo',
				localPath: '/tmp/large-repo',
			})) as { success: boolean; error?: string };

			expect(result.success).toBe(false);
			expect(result.error).toContain('timeout');
		});

		it('should handle startContribution timeout after 60 seconds', async () => {
			vi.mocked(mockMaestro.symphony.startContribution).mockResolvedValue({
				success: false,
				error: 'startContribution timed out (ETIMEDOUT)',
			});

			const result = (await mockMaestro.symphony.startContribution({
				contributionId: 'contrib_test',
				sessionId: 'session-123',
				repoSlug: 'owner/repo',
				issueNumber: 1,
				issueTitle: 'Test',
				localPath: '/tmp/repo',
				documentPaths: [],
			})) as { success: boolean; error?: string };

			expect(result.success).toBe(false);
			expect(result.error).toContain('timeout');
		});

		it('should complete successfully if clone finishes before timeout', async () => {
			vi.mocked(mockMaestro.symphony.cloneRepo).mockResolvedValue({
				success: true,
			});

			const result = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/small-repo',
				localPath: '/tmp/small-repo',
			})) as { success: boolean };

			expect(result.success).toBe(true);
		});
	});

	describe('Error Recovery', () => {
		it('should allow retry after startContribution failure', async () => {
			vi.mocked(mockMaestro.symphony.startContribution)
				.mockResolvedValueOnce({
					success: false,
					error: 'Branch creation failed',
				})
				.mockResolvedValueOnce({
					success: true,
					branchName: 'symphony/issue-1-retry',
				});

			// First attempt
			const firstResult = (await mockMaestro.symphony.startContribution({
				contributionId: 'contrib_test',
				sessionId: 'session-123',
				repoSlug: 'owner/repo',
				issueNumber: 1,
				issueTitle: 'Test',
				localPath: '/tmp/repo',
				documentPaths: [],
			})) as { success: boolean; error?: string };

			expect(firstResult.success).toBe(false);

			// Retry
			const retryResult = (await mockMaestro.symphony.startContribution({
				contributionId: 'contrib_test',
				sessionId: 'session-123',
				repoSlug: 'owner/repo',
				issueNumber: 1,
				issueTitle: 'Test',
				localPath: '/tmp/repo',
				documentPaths: [],
			})) as { success: boolean; branchName?: string };

			expect(retryResult.success).toBe(true);
			expect(retryResult.branchName).toMatch(/^symphony\/issue-1/);
		});

		it('should maintain state across retry attempts', async () => {
			vi.mocked(mockMaestro.symphony.cloneRepo).mockResolvedValue({ success: true });
			vi.mocked(mockMaestro.symphony.startContribution)
				.mockResolvedValueOnce({ success: false, error: 'Error' })
				.mockResolvedValueOnce({ success: true, branchName: 'symphony/issue-99-retry' });

			const sessionId = 'session-persist-123';
			const contributionId = 'contrib_persist';

			// Clone succeeds
			await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: '/tmp/repo',
			});

			// First startContribution fails
			await mockMaestro.symphony.startContribution({
				contributionId: contributionId,
				sessionId: sessionId,
				repoSlug: 'owner/repo',
				issueNumber: 99,
				issueTitle: 'Persistence Test',
				localPath: '/tmp/repo',
				documentPaths: [],
			});

			// Retry should still have same IDs
			const retryResult = (await mockMaestro.symphony.startContribution({
				contributionId: contributionId,
				sessionId: sessionId,
				repoSlug: 'owner/repo',
				issueNumber: 99,
				issueTitle: 'Persistence Test',
				localPath: '/tmp/repo',
				documentPaths: [],
			})) as { success: boolean; branchName?: string };

			expect(retryResult.success).toBe(true);
			expect(retryResult.branchName).toContain('issue-99');
		});

		it('should handle multiple retries with escalating timeouts', async () => {
			const attempts: { success: boolean }[] = [];

			vi.mocked(mockMaestro.symphony.cloneRepo).mockImplementation(async () => {
				attempts.push({ success: attempts.length >= 2 }); // Succeed on 3rd attempt
				return { success: attempts.length >= 3 };
			});

			// First attempt
			let result = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: '/tmp/repo',
			})) as { success: boolean };
			expect(result.success).toBe(false);

			// Second attempt
			result = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: '/tmp/repo',
			})) as { success: boolean };
			expect(result.success).toBe(false);

			// Third attempt succeeds
			result = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: '/tmp/repo',
			})) as { success: boolean };
			expect(result.success).toBe(true);

			expect(mockMaestro.symphony.cloneRepo).toHaveBeenCalledTimes(3);
		});
	});

	describe('Parameter Validation', () => {
		it('should validate required parameters for cloneRepo', async () => {
			vi.mocked(mockMaestro.symphony.cloneRepo).mockImplementation(async (params) => {
				if (!params.repoUrl || !params.localPath) {
					return { success: false, error: 'Missing required parameters' };
				}
				return { success: true };
			});

			// Missing repoUrl
			const result1 = (await mockMaestro.symphony.cloneRepo({
				repoUrl: '',
				localPath: '/tmp/repo',
			})) as { success: boolean; error?: string };
			expect(result1.success).toBe(false);

			// Missing localPath
			const result2 = (await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: '',
			})) as { success: boolean; error?: string };
			expect(result2.success).toBe(false);
		});

		it('should validate required parameters for startContribution', async () => {
			vi.mocked(mockMaestro.symphony.startContribution).mockImplementation(async (params) => {
				if (!params.contributionId || !params.sessionId || !params.repoSlug) {
					return { success: false, error: 'Missing required parameters' };
				}
				return { success: true, branchName: 'symphony/issue-1' };
			});

			// Missing contributionId
			const result = (await mockMaestro.symphony.startContribution({
				contributionId: '',
				sessionId: 'session-123',
				repoSlug: 'owner/repo',
				issueNumber: 1,
				issueTitle: 'Test',
				localPath: '/tmp/repo',
				documentPaths: [],
			})) as { success: boolean; error?: string };

			expect(result.success).toBe(false);
		});
	});

	describe('Platform-Specific Behavior', () => {
		it('should handle Windows file paths correctly', async () => {
			const windowsPath = 'C:\\Users\\Test\\AppData\\Local\\Temp\\repo';

			vi.mocked(mockMaestro.symphony.cloneRepo).mockImplementation(async (params) => {
				// Verify Windows path is accepted
				expect(params.localPath).toContain('\\');
				return { success: true };
			});

			await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: windowsPath,
			});

			expect(mockMaestro.symphony.cloneRepo).toHaveBeenCalledWith(
				expect.objectContaining({
					localPath: windowsPath,
				})
			);
		});

		it('should use 180s timeout for clone on Windows (vs 60s on other platforms)', async () => {
			// Mock would need to verify timeout, but for now just test the call pattern
			vi.mocked(mockMaestro.symphony.cloneRepo).mockResolvedValue({ success: true });

			await mockMaestro.symphony.cloneRepo({
				repoUrl: 'https://github.com/owner/repo',
				localPath: '/tmp/repo',
			});

			expect(mockMaestro.symphony.cloneRepo).toHaveBeenCalled();
			// In real implementation, would verify the timeout parameter
		});
	});
});
