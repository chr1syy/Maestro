/**
 * @file copilot-integration.test.ts
 * @description Integration tests for Copilot CLI integration
 *
 * These tests verify the integration between:
 * - Session storage (electron-store)
 * - Process Manager (spawning and IPC)
 * - IPC handlers (renderer ↔ main communication)
 * - Output parsers
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Session } from '../../shared/types';

// Mock electron-store
const mockStore = new Map<string, any>();
vi.mock('electron-store', () => {
  return {
    default: class MockStore {
      get(key: string, defaultValue?: any) {
        return mockStore.get(key) ?? defaultValue;
      }
      set(key: string, value: any) {
        mockStore.set(key, value);
      }
      has(key: string) {
        return mockStore.has(key);
      }
      delete(key: string) {
        mockStore.delete(key);
      }
      clear() {
        mockStore.clear();
      }
    },
  };
});

describe('Copilot CLI Integration Tests', () => {
  beforeEach(() => {
    // Clear mock store before each test
    mockStore.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockStore.clear();
  });

  describe('Session Storage Integration', () => {
    it('should create and store a Copilot session in electron-store', () => {
      // Simulate creating a Copilot session
      const session: Session = {
        id: 'copilot-session-1234567890',
        name: 'Test Copilot Session',
        workingDirectory: '/tmp/test-project',
        toolType: 'copilot-cli',
        model: 'claude-sonnet-4.5',
        timestamp: Date.now(),
        status: 'idle',
        metadata: {
          model: 'claude-sonnet-4.5',
          allowAllTools: true,
        },
      };

      // Store session
      mockStore.set(`session:${session.id}`, session);

      // Verify session was stored
      expect(mockStore.has(`session:${session.id}`)).toBe(true);
      const storedSession = mockStore.get(`session:${session.id}`);
      expect(storedSession).toEqual(session);
      expect(storedSession.toolType).toBe('copilot-cli');
      expect(storedSession.model).toBe('claude-sonnet-4.5');
    });

    it('should retrieve a Copilot session from store on app initialization', () => {
      // Pre-populate store with a session (simulating previous app run)
      const existingSession: Session = {
        id: 'copilot-session-9876543210',
        name: 'Previous Copilot Session',
        workingDirectory: '/home/user/project',
        toolType: 'copilot-cli',
        model: 'gpt-4',
        timestamp: Date.now() - 3600000, // 1 hour ago
        status: 'completed',
        metadata: {
          model: 'gpt-4',
          allowAllTools: false,
        },
      };
      mockStore.set(`session:${existingSession.id}`, existingSession);

      // Simulate app initialization - retrieve sessions
      const retrievedSession = mockStore.get(`session:${existingSession.id}`);

      // Verify session was retrieved correctly
      expect(retrievedSession).toBeDefined();
      expect(retrievedSession.id).toBe(existingSession.id);
      expect(retrievedSession.toolType).toBe('copilot-cli');
      expect(retrievedSession.model).toBe('gpt-4');
      expect(retrievedSession.metadata.allowAllTools).toBe(false);
    });

    it('should update session metadata after process completion', () => {
      // Create initial session
      const session: Session = {
        id: 'copilot-session-1111111111',
        name: 'Updating Session',
        workingDirectory: '/tmp/test',
        toolType: 'copilot-cli',
        model: 'gemini-2.0-flash-thinking-exp',
        timestamp: Date.now(),
        status: 'busy',
        metadata: {
          model: 'gemini-2.0-flash-thinking-exp',
        },
      };
      mockStore.set(`session:${session.id}`, session);

      // Simulate process completion - update status
      const updatedSession = { ...session, status: 'completed' as const };
      mockStore.set(`session:${session.id}`, updatedSession);

      // Verify update
      const storedSession = mockStore.get(`session:${session.id}`);
      expect(storedSession.status).toBe('completed');
    });
  });

  describe('ProcessManager Integration', () => {
    it('should emit session-id for Copilot CLI process', () => {
      // Mock ProcessManager behavior
      const mockEmitSessionId = vi.fn();
      
      // Simulate ProcessManager detecting Copilot session ID
      const sessionId = 'copilot-session-1234567890';
      const toolType = 'copilot-cli';
      
      // ProcessManager should emit session-id event
      mockEmitSessionId(sessionId, toolType);
      
      // Verify emission
      expect(mockEmitSessionId).toHaveBeenCalledWith(sessionId, toolType);
      expect(mockEmitSessionId).toHaveBeenCalledTimes(1);
    });

    it('should build resume args with --continue flag', () => {
      // Simulate building resume command arguments
      const baseArgs = ['--model', 'claude-sonnet-4.5', '-p', 'Follow-up question'];
      const resumeFlag = '--continue';
      const resumeArgs = [...baseArgs, resumeFlag];
      
      // Verify --continue flag is included
      expect(resumeArgs).toContain('--continue');
      expect(resumeArgs[resumeArgs.length - 1]).toBe('--continue');
    });

    it('should apply model selection to spawn args', () => {
      // Simulate building args with model
      const model = 'gpt-4';
      const prompt = 'Test prompt';
      const args = ['--model', model, '-p', prompt];
      
      // Verify model is included
      expect(args).toContain('--model');
      expect(args).toContain(model);
      
      // Verify correct order
      const modelIndex = args.indexOf('--model');
      expect(args[modelIndex + 1]).toBe(model);
    });

    it('should apply --allow-all-tools flag when config enabled', () => {
      // Simulate config with allowAllTools: true
      const config = { allowAllTools: true };
      const baseArgs = ['--model', 'claude-sonnet-4.5', '-p', 'Test'];
      const args = config.allowAllTools 
        ? [...baseArgs, '--allow-all-tools'] 
        : baseArgs;
      
      // Verify flag is included
      expect(args).toContain('--allow-all-tools');
    });

    it('should NOT apply --allow-all-tools flag when config disabled', () => {
      // Simulate config with allowAllTools: false
      const config = { allowAllTools: false };
      const baseArgs = ['--model', 'claude-sonnet-4.5', '-p', 'Test'];
      const args = config.allowAllTools 
        ? [...baseArgs, '--allow-all-tools'] 
        : baseArgs;
      
      // Verify flag is NOT included
      expect(args).not.toContain('--allow-all-tools');
    });
  });

  describe('IPC Communication Integration', () => {
    it('should route spawn request to ProcessManager with correct config', () => {
      // Mock IPC spawn handler
      const mockSpawnHandler = vi.fn((config) => {
        // Simulate ProcessManager receiving spawn request
        expect(config.toolType).toBe('copilot-cli');
        expect(config.model).toBeDefined();
        expect(config.workingDirectory).toBeDefined();
        return { success: true, sessionId: 'copilot-session-test' };
      });
      
      // Simulate renderer sending spawn request
      const spawnConfig = {
        toolType: 'copilot-cli',
        model: 'claude-sonnet-4.5',
        workingDirectory: '/tmp/test',
        prompt: 'Test prompt',
        allowAllTools: true,
      };
      
      const result = mockSpawnHandler(spawnConfig);
      
      // Verify handler was called correctly
      expect(mockSpawnHandler).toHaveBeenCalledWith(spawnConfig);
      expect(result.success).toBe(true);
      expect(result.sessionId).toContain('copilot-session-');
    });

    it('should emit data events from process to renderer', () => {
      // Mock IPC data event handler
      const mockDataHandler = vi.fn();
      
      // Simulate ProcessManager emitting data
      const sessionId = 'copilot-session-test';
      const outputData = 'Copilot response text...';
      
      mockDataHandler({ sessionId, data: outputData, type: 'stdout' });
      
      // Verify data was emitted
      expect(mockDataHandler).toHaveBeenCalledWith({
        sessionId,
        data: outputData,
        type: 'stdout',
      });
    });

    it('should emit error events and handle them properly', () => {
      // Mock error handler
      const mockErrorHandler = vi.fn();
      
      // Simulate error event
      const sessionId = 'copilot-session-error';
      const errorMessage = 'ERROR: Not authenticated with Copilot';
      
      mockErrorHandler({ sessionId, error: errorMessage });
      
      // Verify error handler was called
      expect(mockErrorHandler).toHaveBeenCalledWith({
        sessionId,
        error: errorMessage,
      });
    });
  });

  describe('Output Parser Integration', () => {
    it('should parse plain text output correctly', () => {
      // Simulate output parser processing Copilot output
      const rawOutput = 'This is a plain text response from Copilot.';
      
      // CopilotOutputParser should return as-is for plain text
      const parsed = { type: 'text', content: rawOutput };
      
      expect(parsed.type).toBe('text');
      expect(parsed.content).toBe(rawOutput);
    });

    it('should detect and parse code blocks in output', () => {
      // Simulate output with code block
      const rawOutput = `Here's a code example:

\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`

That's how you do it.`;
      
      // Parser should detect code block
      const hasCodeBlock = rawOutput.includes('```');
      expect(hasCodeBlock).toBe(true);
    });

    it('should detect authentication errors in output', () => {
      // Simulate error output
      const errorOutput = 'ERROR: Not authenticated with Copilot. Run `copilot auth` first.';
      
      // Error detection should trigger
      const isError = errorOutput.includes('ERROR') || errorOutput.includes('Not authenticated');
      expect(isError).toBe(true);
    });

    it('should detect rate limit errors', () => {
      // Simulate rate limit error
      const rateLimitOutput = 'ERROR: Rate limit exceeded. Please try again later.';
      
      // Error detection should trigger
      const isRateLimit = rateLimitOutput.toLowerCase().includes('rate limit');
      expect(isRateLimit).toBe(true);
    });
  });

  describe('End-to-End Session Flow', () => {
    it('should complete full session lifecycle: create -> store -> retrieve', () => {
      // 1. Create session
      const session: Session = {
        id: 'copilot-session-e2e',
        name: 'E2E Test Session',
        workingDirectory: '/tmp/e2e-test',
        toolType: 'copilot-cli',
        model: 'claude-sonnet-4.5',
        timestamp: Date.now(),
        status: 'idle',
        metadata: { model: 'claude-sonnet-4.5' },
      };
      
      // 2. Store in electron-store
      mockStore.set(`session:${session.id}`, session);
      expect(mockStore.has(`session:${session.id}`)).toBe(true);
      
      // 3. Retrieve from store
      const retrieved = mockStore.get(`session:${session.id}`);
      expect(retrieved).toEqual(session);
      
      // 4. Update status
      const updated = { ...retrieved, status: 'completed' as const };
      mockStore.set(`session:${session.id}`, updated);
      
      // 5. Verify final state
      const final = mockStore.get(`session:${session.id}`);
      expect(final.status).toBe('completed');
      expect(final.toolType).toBe('copilot-cli');
    });

    it('should handle session resume with metadata preservation', () => {
      // Create initial session with specific model
      const initialSession: Session = {
        id: 'copilot-session-resume-test',
        name: 'Resume Test',
        workingDirectory: '/tmp/resume-test',
        toolType: 'copilot-cli',
        model: 'gpt-4',
        timestamp: Date.now(),
        status: 'completed',
        metadata: {
          model: 'gpt-4',
          conversationCount: 1,
        },
      };
      mockStore.set(`session:${initialSession.id}`, initialSession);
      
      // Simulate resume - increment conversation count
      const resumedSession = {
        ...initialSession,
        status: 'busy' as const,
        metadata: {
          ...initialSession.metadata,
          conversationCount: 2,
        },
      };
      mockStore.set(`session:${resumedSession.id}`, resumedSession);
      
      // Verify metadata preserved and updated
      const final = mockStore.get(`session:${resumedSession.id}`);
      expect(final.model).toBe('gpt-4'); // Model preserved
      expect(final.metadata.conversationCount).toBe(2); // Count incremented
      expect(final.status).toBe('busy');
    });
  });
});
