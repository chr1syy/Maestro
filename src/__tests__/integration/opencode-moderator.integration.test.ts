/**
 * @file opencode-moderator.test.ts
 * @description Integration tests for OpenCode as Group Chat Moderator.
 *
 * These tests verify that OpenCode can be properly used as a moderator provider
 * for the Group Chat feature, including:
 * - Moderator process spawning with correct arguments
 * - Batch mode prefix and read-only mode
 * - Output parsing and session ID extraction
 * - Message routing with @mentions
 * - Session continuation with --session flag
 * - Error handling for various failure modes
 *
 * Run with: npm run test:integration
 * Skip in CI with: SKIP_INTEGRATION_TESTS=true
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import os from 'os';
import path from 'path';

// Mock Electron app before importing modules
vi.mock('electron', () => ({
	app: {
		getPath: (name: string) => {
			if (name === 'userData') {
				return path.join(os.tmpdir(), 'maestro-test-opencode-moderator');
			}
			return os.tmpdir();
		},
	},
}));

import { OpenCodeOutputParser } from '../../main/parsers/opencode-output-parser';
import {
	extractTextFromAgentOutput,
	extractTextGeneric,
} from '../../main/group-chat/output-parser';
import { buildAgentArgs, applyAgentConfigOverrides } from '../../main/utils/agent-args';
import { AgentConfig } from '../../main/agents/definitions';
import { getAgentCapabilities } from '../../main/agents/capabilities';

/**
 * Test Suite: OpenCode Output Parser for Moderator Use
 */
describe('OpenCode Moderator - Output Parser', () => {
	const parser = new OpenCodeOutputParser();

	describe('Session ID Extraction', () => {
		it('should extract sessionID (camelCase) from step_start', () => {
			const line = JSON.stringify({
				type: 'step_start',
				sessionID: 'oc-session-abc-123',
			});

			const event = parser.parseJsonLine(line);
			expect(event).not.toBeNull();
			expect(event?.sessionId).toBe('oc-session-abc-123');
			expect(parser.extractSessionId(event!)).toBe('oc-session-abc-123');
		});

		it('should extract sessionID from step_finish', () => {
			const line = JSON.stringify({
				type: 'step_finish',
				sessionID: 'oc-session-def-456',
				part: { reason: 'stop' },
			});

			const event = parser.parseJsonLine(line);
			expect(event?.sessionId).toBe('oc-session-def-456');
		});

		it('should extract sessionID from text events', () => {
			const line = JSON.stringify({
				type: 'text',
				sessionID: 'oc-session-xyz-789',
				part: { text: 'Analyzing code...' },
			});

			const event = parser.parseJsonLine(line);
			expect(event?.sessionId).toBe('oc-session-xyz-789');
		});
	});

	describe('Usage Stats Extraction', () => {
		it('should extract tokens from step_finish', () => {
			const line = JSON.stringify({
				type: 'step_finish',
				sessionID: 'oc-sess-123',
				part: {
					reason: 'stop',
					tokens: {
						input: 1500,
						output: 800,
						reasoning: 0,
						cache: { read: 200, write: 100 },
					},
				},
			});

			const event = parser.parseJsonLine(line);
			expect(event?.usage).not.toBeNull();
			expect(event?.usage?.inputTokens).toBe(1500);
			expect(event?.usage?.outputTokens).toBe(800);
			expect(event?.usage?.cacheReadTokens).toBe(200);
			expect(event?.usage?.cacheCreationTokens).toBe(100);
		});

		it('should extract cost from step_finish', () => {
			const line = JSON.stringify({
				type: 'step_finish',
				sessionID: 'oc-sess-123',
				part: {
					reason: 'stop',
					cost: 0.0045,
					tokens: { input: 100, output: 50 },
				},
			});

			const event = parser.parseJsonLine(line);
			expect(event?.usage?.costUsd).toBe(0.0045);
		});

		it('should handle zero tokens gracefully', () => {
			const line = JSON.stringify({
				type: 'step_finish',
				sessionID: 'oc-sess-123',
				part: {
					reason: 'stop',
					tokens: { input: 0, output: 0 },
				},
			});

			const event = parser.parseJsonLine(line);
			expect(event?.usage?.inputTokens).toBe(0);
			expect(event?.usage?.outputTokens).toBe(0);
		});
	});

	describe('Text Content Extraction', () => {
		it('should distinguish between partial text and final result', () => {
			const textLine = JSON.stringify({
				type: 'text',
				sessionID: 'oc-sess-123',
				part: { text: 'Partial response...' },
			});

			const resultLine = JSON.stringify({
				type: 'step_finish',
				sessionID: 'oc-sess-123',
				part: { reason: 'stop' },
			});

			const textEvent = parser.parseJsonLine(textLine);
			const resultEvent = parser.parseJsonLine(resultLine);

			expect(textEvent?.type).toBe('text');
			expect(textEvent?.isPartial).toBe(true);

			expect(resultEvent?.type).toBe('result');
			expect(parser.isResultMessage(resultEvent!)).toBe(true);
		});

		it('should mark tool-calls as system events, not final results', () => {
			const line = JSON.stringify({
				type: 'step_finish',
				sessionID: 'oc-sess-123',
				part: { reason: 'tool-calls' },
			});

			const event = parser.parseJsonLine(line);
			expect(event?.type).toBe('system');
			expect(parser.isResultMessage(event!)).toBe(false);
		});
	});
});

/**
 * Test Suite: OpenCode Argument Building for Moderator
 */
describe('OpenCode Moderator - Argument Building', () => {
	const mockOpenCodeAgent: AgentConfig = {
		id: 'opencode',
		name: 'OpenCode',
		binaryName: 'opencode',
		command: 'opencode',
		args: [],
		batchModePrefix: ['run'],
		jsonOutputArgs: ['--format', 'json'],
		resumeArgs: (sessionId: string) => ['--session', sessionId],
		readOnlyArgs: ['--agent', 'plan'],
		modelArgs: (modelId: string) => ['--model', modelId],
		noPromptSeparator: true,
		available: true,
		capabilities: getAgentCapabilities('opencode'),
	};

	describe('Batch Mode Prefix', () => {
		it('should add batch mode prefix "run" to arguments', () => {
			const args = buildAgentArgs(mockOpenCodeAgent, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
			});

			expect(args).toContain('run');
			expect(args.indexOf('run')).toBe(0);
		});

		it('should apply batch mode prefix before JSON output args', () => {
			const args = buildAgentArgs(mockOpenCodeAgent, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
			});

			const runIndex = args.indexOf('run');
			const formatIndex = args.indexOf('--format');

			expect(runIndex).toBeLessThan(formatIndex);
		});
	});

	describe('Read-Only Mode', () => {
		it('should include --agent plan for read-only mode', () => {
			const args = buildAgentArgs(mockOpenCodeAgent, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
				readOnlyMode: true,
			});

			expect(args).toContain('--agent');
			expect(args).toContain('plan');
		});

		it('should not include --agent plan when read-only mode is false', () => {
			const args = buildAgentArgs(mockOpenCodeAgent, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
				readOnlyMode: false,
			});

			expect(args).not.toContain('plan');
		});
	});

	describe('Session Continuation', () => {
		it('should include --session flag for session ID', () => {
			const sessionId = 'oc-session-xyz-123';
			const args = buildAgentArgs(mockOpenCodeAgent, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
				agentSessionId: sessionId,
			});

			expect(args).toContain('--session');
			expect(args).toContain(sessionId);
		});

		it('should place --session flag after batch mode prefix and before prompt', () => {
			const args = buildAgentArgs(mockOpenCodeAgent, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
				agentSessionId: 'oc-session-xyz-123',
			});

			const runIndex = args.indexOf('run');
			const sessionIndex = args.indexOf('--session');

			expect(runIndex).toBeLessThan(sessionIndex);
		});
	});

	describe('Model Selection', () => {
		it('should include --model flag with model ID', () => {
			const modelId = 'ollama/qwen3:8b';
			const args = buildAgentArgs(mockOpenCodeAgent, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
				modelId,
			});

			expect(args).toContain('--model');
			expect(args).toContain(modelId);
		});

		it('should support different model formats', () => {
			const models = ['ollama/qwen3:8b', 'anthropic/claude-sonnet-4-20250514', 'openai/gpt-4'];

			for (const modelId of models) {
				const args = buildAgentArgs(mockOpenCodeAgent, {
					baseArgs: [],
					prompt: 'Test prompt',
					cwd: os.homedir(),
					modelId,
				});

				expect(args).toContain(modelId);
			}
		});
	});

	describe('Custom Arguments and Environment', () => {
		it('should apply custom args from moderator config', () => {
			const baseArgs = buildAgentArgs(mockOpenCodeAgent, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
				readOnlyMode: true,
			});

			const resolution = applyAgentConfigOverrides(mockOpenCodeAgent, baseArgs, {
				agentConfigValues: {},
				sessionCustomArgs: '--verbose --debug',
			});

			expect(resolution.args).toContain('--verbose');
			expect(resolution.args).toContain('--debug');
		});

		it('should apply custom env vars from moderator config', () => {
			const baseArgs = buildAgentArgs(mockOpenCodeAgent, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
			});

			const customEnvVars = {
				OPENCODE_CONFIG_CONTENT: '{"permission":{"*":"allow"},"tools":{"question":false}}',
				MY_CUSTOM_VAR: 'custom-value',
			};

			const resolution = applyAgentConfigOverrides(mockOpenCodeAgent, baseArgs, {
				agentConfigValues: {},
				sessionCustomEnvVars: customEnvVars,
			});

			expect(resolution.effectiveCustomEnvVars).toEqual(expect.objectContaining(customEnvVars));
		});

		it('should merge agent default env vars with custom env vars', () => {
			const agentWithDefaults: AgentConfig = {
				...mockOpenCodeAgent,
				defaultEnvVars: {
					OPENCODE_DEFAULT: 'default-value',
				},
			};

			const baseArgs = buildAgentArgs(agentWithDefaults, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
			});

			const resolution = applyAgentConfigOverrides(agentWithDefaults, baseArgs, {
				agentConfigValues: {},
				sessionCustomEnvVars: {
					MY_CUSTOM: 'custom',
				},
			});

			expect(resolution.effectiveCustomEnvVars).toEqual(
				expect.objectContaining({
					OPENCODE_DEFAULT: 'default-value',
					MY_CUSTOM: 'custom',
				})
			);
		});
	});

	describe('Command Line Format', () => {
		it('should NOT include -- separator before prompt (noPromptSeparator: true)', () => {
			const args = buildAgentArgs(mockOpenCodeAgent, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
				readOnlyMode: true,
			});

			// Should NOT have '--' as a standalone argument
			expect(args).not.toContain('--');
		});

		it('should produce valid command line arguments in correct order', () => {
			const args = buildAgentArgs(mockOpenCodeAgent, {
				baseArgs: [],
				prompt: 'Test prompt',
				cwd: os.homedir(),
				readOnlyMode: true,
				modelId: 'ollama/qwen3:8b',
			});

			// Expected order: run --format json --model ... --agent plan
			const runIdx = args.indexOf('run');
			const formatIdx = args.indexOf('--format');
			const modelIdx = args.indexOf('--model');
			const agentIdx = args.indexOf('--agent');

			expect(runIdx).toBeLessThan(formatIdx);
			// Model comes after format
			expect(formatIdx).toBeLessThan(modelIdx);
			// Agent comes after everything else (applied as readOnlyArgs override)
			expect(agentIdx).toBeGreaterThan(-1);
		});
	});
});

/**
 * Test Suite: Group Chat Output Parsing with OpenCode
 */
describe('OpenCode Moderator - Output Parsing', () => {
	describe('Sample OpenCode Output Processing', () => {
		it('should extract text from OpenCode JSONL output', () => {
			const opencodeOutput = [
				'{"type":"step_start","sessionID":"oc-sess-001","timestamp":1234567890}',
				'{"type":"text","sessionID":"oc-sess-001","part":{"text":"I need to analyze the request."}}',
				'{"type":"text","sessionID":"oc-sess-001","part":{"text":" The best approach would be..."}}',
				'{"type":"step_finish","sessionID":"oc-sess-001","part":{"reason":"stop","tokens":{"input":200,"output":150}}}',
			].join('\n');

			const text = extractTextFromAgentOutput(opencodeOutput, 'opencode');
			expect(text).toBeTruthy();
			// Should contain the streaming parts (or be empty if only result is extracted)
			expect(text.length).toBeGreaterThan(0);
		});

		it('should handle moderator delegation response', () => {
			const delegationOutput = [
				'{"type":"step_start","sessionID":"oc-mod-001"}',
				'{"type":"text","sessionID":"oc-mod-001","part":{"text":"I\'ll delegate this to @agent-a for implementation."}}',
				'{"type":"step_finish","sessionID":"oc-mod-001","part":{"reason":"stop"}}',
			].join('\n');

			const text = extractTextFromAgentOutput(delegationOutput, 'opencode');
			expect(text).toContain('@agent-a');
		});

		it('should preserve @mention syntax during parsing', () => {
			const outputWithMention =
				'{"type":"text","sessionID":"oc-sess-001","part":{"text":"Let @claude-code review this"}}';

			const text = extractTextGeneric(outputWithMention);
			expect(text).toContain('@claude-code');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty responses', () => {
			const emptyOutput = ['{"type":"step_start","sessionID":"oc-sess-001"}'].join('\n');

			const text = extractTextFromAgentOutput(emptyOutput, 'opencode');
			expect(typeof text).toBe('string');
		});

		it('should handle malformed JSON gracefully', () => {
			const mixedOutput = [
				'{"type":"text","sessionID":"oc-sess-001","part":{"text":"Valid JSON"}}',
				'This is invalid JSON but should be handled',
				'{"type":"step_finish","sessionID":"oc-sess-001","part":{"reason":"stop"}}',
			].join('\n');

			expect(() => extractTextFromAgentOutput(mixedOutput, 'opencode')).not.toThrow();
		});

		it('should handle large responses without truncation', () => {
			const largeText = 'x'.repeat(10000);
			const output = JSON.stringify({
				type: 'text',
				sessionID: 'oc-sess-001',
				part: { text: largeText },
			});

			const text = extractTextGeneric(output);
			expect(text.length).toBeGreaterThan(5000);
		});
	});
});

/**
 * Test Suite: Error Handling for OpenCode Moderator
 */
describe('OpenCode Moderator - Error Handling', () => {
	const parser = new OpenCodeOutputParser();

	describe('Error Detection', () => {
		it('should detect API errors from OpenCode', () => {
			const errorOutput =
				'{"type":"error","error":{"name":"APIError","data":{"message":"API rate limit exceeded"}}}';

			const error = parser.detectErrorFromLine(errorOutput);
			expect(error).not.toBeNull();
			expect(error?.message.toLowerCase()).toContain('rate limit');
		});

		it('should detect connection errors', () => {
			const errorOutput = '{"type":"error","error":{"message":"Connection failed: timeout"}}';

			const error = parser.detectErrorFromLine(errorOutput);
			expect(error).not.toBeNull();
			expect(error?.message).toContain('Connection');
		});

		it('should handle error objects with complex nesting', () => {
			const errorOutput = JSON.stringify({
				type: 'error',
				error: {
					name: 'ValidationError',
					data: {
						message: 'Invalid model ID provided',
					},
					responseBody: {
						error: {
							type: 'invalid_request',
							message: 'Model not found',
						},
					},
				},
			});

			const error = parser.detectErrorFromLine(errorOutput);
			expect(error).not.toBeNull();
			expect(error?.message).toBeTruthy();
		});

		it('should not detect errors in normal text content', () => {
			const normalOutput = JSON.stringify({
				type: 'text',
				sessionID: 'oc-sess-001',
				part: { text: 'The code has an error in line 42' },
			});

			const error = parser.detectErrorFromLine(normalOutput);
			expect(error).toBeNull();
		});
	});

	describe('Exit Code Handling', () => {
		it('should detect agent crash with non-zero exit code', () => {
			const error = parser.detectErrorFromExit(1, 'Agent process crashed', '');
			expect(error).not.toBeNull();
			expect(error?.type).toBe('agent_crashed');
		});

		it('should not treat exit code 0 as error', () => {
			const error = parser.detectErrorFromExit(0, '', '');
			expect(error).toBeNull();
		});

		it('should handle stderr output on exit', () => {
			const error = parser.detectErrorFromExit(1, 'Error: command not found', '');
			expect(error).not.toBeNull();
		});
	});
});

describe('OpenCode Moderator - Integration Flow', () => {
	it('should demonstrate full moderator spawn scenario', () => {
		const agent: AgentConfig = {
			id: 'opencode',
			name: 'OpenCode',
			binaryName: 'opencode',
			command: 'opencode',
			args: [],
			batchModePrefix: ['run'],
			jsonOutputArgs: ['--format', 'json'],
			readOnlyArgs: ['--agent', 'plan'],
			resumeArgs: (sessionId) => ['--session', sessionId],
			modelArgs: (modelId) => ['--model', modelId],
			noPromptSeparator: true,
			available: true,
			capabilities: getAgentCapabilities('opencode'),
		};

		// Simulate moderator spawn with all features
		const prompt = 'Coordinate the following request: @agent-a should analyze the data';
		const sessionId = 'oc-mod-12345';

		const baseArgs = buildAgentArgs(agent, {
			baseArgs: [],
			prompt,
			cwd: os.homedir(),
			readOnlyMode: true,
			modelId: 'ollama/qwen3:8b',
			agentSessionId: sessionId,
		});

		// Verify the command structure
		expect(baseArgs[0]).toBe('run');
		expect(baseArgs).toContain('--format');
		expect(baseArgs).toContain('json');
		expect(baseArgs).toContain('--model');
		expect(baseArgs).toContain('ollama/qwen3:8b');
		expect(baseArgs).toContain('--agent');
		expect(baseArgs).toContain('plan');
		expect(baseArgs).toContain('--session');
		expect(baseArgs).toContain(sessionId);

		// Should NOT contain '--' separator
		expect(baseArgs).not.toContain('--');
	});

	/**
	 * Test Suite: Model Selection with ModeratorConfig
	 * Verifies that model selection is properly preserved when passed through
	 * the ModeratorConfig from UI and applied during moderator spawning.
	 */
	it('should apply custom model from moderatorConfig via applyAgentConfigOverrides', () => {
		const agent: AgentConfig = {
			id: 'opencode',
			name: 'OpenCode',
			binaryName: 'opencode',
			command: 'opencode',
			args: [],
			batchModePrefix: ['run'],
			jsonOutputArgs: ['--format', 'json'],
			readOnlyArgs: ['--agent', 'plan'],
			resumeArgs: (sessionId) => ['--session', sessionId],
			modelArgs: (modelId) => ['--model', modelId],
			noPromptSeparator: true,
			available: true,
			capabilities: getAgentCapabilities('opencode'),
		};

		// Simulate moderator spawning with custom model from UI
		const prompt = 'Moderate this discussion: @participant should help';
		const baseArgs = buildAgentArgs(agent, {
			baseArgs: [],
			prompt,
			cwd: os.homedir(),
			readOnlyMode: true,
		});

		// User selected model in UI - passed via moderatorConfig
		const selectedModel = 'ollama/qwen3:8b';
		const resolution = applyAgentConfigOverrides(agent, baseArgs, {
			agentConfigValues: {},
			sessionCustomModel: selectedModel, // This comes from moderatorConfig.customModel
		});

		// Verify --model flag with correct value is in final args
		expect(resolution.args).toContain('--model');
		expect(resolution.args).toContain(selectedModel);
		expect(resolution.modelSource).toBe('session');
	});

	it('should support different model formats through moderatorConfig', () => {
		const agent: AgentConfig = {
			id: 'opencode',
			name: 'OpenCode',
			binaryName: 'opencode',
			command: 'opencode',
			args: [],
			batchModePrefix: ['run'],
			jsonOutputArgs: ['--format', 'json'],
			readOnlyArgs: ['--agent', 'plan'],
			modelArgs: (modelId) => ['--model', modelId],
			noPromptSeparator: true,
			available: true,
			capabilities: getAgentCapabilities('opencode'),
		};

		const models = ['ollama/qwen3:8b', 'anthropic/claude-sonnet-4-20250514', 'openai/gpt-4'];
		const baseArgs = buildAgentArgs(agent, { baseArgs: [], prompt: 'Test', cwd: os.homedir() });

		for (const modelId of models) {
			const resolution = applyAgentConfigOverrides(agent, baseArgs, {
				agentConfigValues: {},
				sessionCustomModel: modelId,
			});

			expect(resolution.args).toContain(modelId);
		}
	});

	it('should combine custom model with custom args and env vars from moderatorConfig', () => {
		const agent: AgentConfig = {
			id: 'opencode',
			name: 'OpenCode',
			binaryName: 'opencode',
			command: 'opencode',
			args: [],
			batchModePrefix: ['run'],
			jsonOutputArgs: ['--format', 'json'],
			readOnlyArgs: ['--agent', 'plan'],
			modelArgs: (modelId) => ['--model', modelId],
			defaultEnvVars: { OPENCODE_DEFAULT: 'value' },
			noPromptSeparator: true,
			available: true,
			capabilities: getAgentCapabilities('opencode'),
		};

		const baseArgs = buildAgentArgs(agent, {
			baseArgs: [],
			prompt: 'Test prompt',
			cwd: os.homedir(),
			readOnlyMode: true,
		});

		const resolution = applyAgentConfigOverrides(agent, baseArgs, {
			agentConfigValues: {},
			sessionCustomModel: 'ollama/custom:latest',
			sessionCustomArgs: '--verbose --timeout 300',
			sessionCustomEnvVars: { CUSTOM_VAR: 'test_value' },
		});

		// Verify all three customizations are applied
		expect(resolution.args).toContain('--model');
		expect(resolution.args).toContain('ollama/custom:latest');
		expect(resolution.args).toContain('--verbose');
		expect(resolution.args).toContain('--timeout');
		expect(resolution.args).toContain('300');

		// Verify env vars are merged (defaults + custom)
		expect(resolution.effectiveCustomEnvVars).toEqual({
			OPENCODE_DEFAULT: 'value',
			CUSTOM_VAR: 'test_value',
		});
	});
});
