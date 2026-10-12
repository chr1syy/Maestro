// src/main/process-manager/spawners/ChildProcessSpawner.ts

import { spawn, type ChildProcess } from 'child_process';
import * as fs from 'fs';
import { projectMcpProcessPublication } from '../../../shared/plugins/mcp-agent-config';
import { EventEmitter } from 'events';
import * as path from 'path';
import { logger } from '../../utils/logger';
import { createOutputParser } from '../../parsers';
import { getAgentCapabilities } from '../../agents';
import { getAgentDefinition } from '../../agents/definitions';
import type { ProcessConfig, ManagedProcess, SpawnResult } from '../types';
import type { DataBufferManager } from '../handlers/DataBufferManager';
import { StdoutHandler } from '../handlers/StdoutHandler';
import { StderrHandler } from '../handlers/StderrHandler';
import { ExitHandler } from '../handlers/ExitHandler';
import { buildChildProcessEnv, collectMaestroEnvVars } from '../utils/envBuilder';
import { buildPromptArgv } from '../../../shared/maestro-lib/launch/prompt-delivery';
import { DEFAULT_QUERY_SOURCE } from '../../../shared/querySource';
import { saveImageToTempFile, buildImagePromptPrefix, cleanupTempFiles } from '../utils/imageUtils';
import { buildStreamJsonMessage } from '../utils/streamJsonBuilder';
import { escapeArgsForShell, isPowerShellShell } from '../utils/shellEscape';
import { planSpawnShell } from '../utils/windowsSpawnShell';
import { argsResumeSession } from '../utils/resumeArgs';
import { isWindows } from '../../../shared/platformDetection';
import type { WindowsShellReason } from '../../../shared/maestro-lib/launch/windows-command';
import { captureException } from '../../utils/sentry';
import { nextSpawnGeneration, isSupersededGeneration } from '../generation';
import { startTurn } from '../../../shared/maestro-lib/run/start-turn';
import { INTERACTIVE_STOP_GRACE_MS } from '../../../shared/maestro-lib/control/termination';

// The log line each Windows shell promotion writes (see windowsShellReason).
const WINDOWS_SHELL_LOG_MESSAGES: Record<WindowsShellReason, string> = {
	'bare-exe':
		'[ProcessManager] Auto-enabling shell for Windows to allow PATH resolution of basename exe',
	'batch-file': '[ProcessManager] Auto-enabling shell for Windows to spawn batch-file command',
	'shebang-script': '[ProcessManager] Auto-enabling shell for Windows to execute shell script',
};

/**
 * Handles spawning of child processes (non-PTY).
 * Used for AI agents in batch mode and interactive mode.
 */
export class ChildProcessSpawner {
	private stdoutHandler: StdoutHandler;
	private stderrHandler: StderrHandler;
	private exitHandler: ExitHandler;

	constructor(
		private processes: Map<string, ManagedProcess>,
		private emitter: EventEmitter,
		private bufferManager: DataBufferManager
	) {
		this.stdoutHandler = new StdoutHandler({
			processes: this.processes,
			emitter: this.emitter,
			bufferManager: this.bufferManager,
		});
		this.stderrHandler = new StderrHandler({
			processes: this.processes,
			emitter: this.emitter,
		});
		this.exitHandler = new ExitHandler({
			processes: this.processes,
			emitter: this.emitter,
			bufferManager: this.bufferManager,
		});
	}

	/**
	 * Spawn a child process for a session
	 */
	spawn(
		config: ProcessConfig,
		withholdProviderOutput = false,
		preparedOwnership?: {
			capture(process: ManagedProcess, rollback: () => void): void;
			fence(): void;
		}
	): SpawnResult {
		if (withholdProviderOutput) return this.spawnPrivate(config, true, preparedOwnership);
		const {
			sessionId,
			toolType,
			cwd,
			command,
			args,
			prompt,
			images,
			imageArgs,
			imagePromptBuilder,
			promptArgs,
			contextWindow,
			ompModelCatalogKey,
			customEnvVars,
			shellEnvVars,
			noPromptSeparator,
			sendPromptViaStdin,
			sendPromptViaStdinRaw,
		} = config;

		const hasImages = images && images.length > 0;
		const capabilities = getAgentCapabilities(toolType);

		// Check if prompt will be sent via stdin instead of command line
		// This is critical for SSH remote execution to avoid shell escaping issues
		// Also critical on Windows: when using stream-json output mode, the prompt is sent
		// via stdin (see stream-json stdin write below). Adding it as a CLI arg too would
		// exceed cmd.exe's ~8191 character command line limit, causing immediate exit code 1.
		//
		// IMPORTANT: Only match --input-format stream-json, NOT --output-format stream-json.
		// Matching --output-format caused promptViaStdin to be always true for Claude Code
		// (whose default args include --output-format stream-json), which prevented
		// --input-format stream-json from being added when sending images, causing Claude
		// to interpret the raw JSON+base64 blob as plain text and blow the token limit.
		const argsHaveInputStreamJson = args.some(
			(arg, i) => arg === 'stream-json' && i > 0 && args[i - 1] === '--input-format'
		);
		const promptViaStdin = sendPromptViaStdin || sendPromptViaStdinRaw || argsHaveInputStreamJson;

		// Build final args based on batch mode and images
		// Track whether the prompt was added to CLI args (used later to decide stdin behavior)
		let finalArgs: string[];
		let tempImageFiles: string[] = [];
		// effectivePrompt may be modified (e.g., image path prefix prepended for resume mode)
		let effectivePrompt = prompt;
		// If the caller pre-embedded the prompt in args (e.g., SSH tab naming wraps it
		// inside bash -c), skip the appending paths below and treat it as already-added.
		let promptAddedToArgs = !!config.promptAlreadyInArgs;

		if (hasImages && prompt && capabilities.supportsStreamJsonInput) {
			// For agents that support stream-json input (like Claude Code)
			// Always add --input-format stream-json when sending images via stdin.
			// This flag is required for Claude Code to parse the JSON+base64 message
			// correctly; without it, the raw JSON is treated as plain text prompt.
			const needsInputFormat = !args.includes('--input-format')
				? ['--input-format', 'stream-json']
				: [];
			finalArgs = [...args, ...needsInputFormat];
			// Prompt will be sent via stdin as stream-json with embedded images (not in CLI args)
		} else if (hasImages && prompt && (imageArgs || imagePromptBuilder)) {
			// For agents that use file-based image args (like Codex, OpenCode) or
			// prompt-embedded image mentions (like Copilot's @path syntax)
			finalArgs = [...args];
			tempImageFiles = [];
			for (let i = 0; i < images.length; i++) {
				const tempPath = saveImageToTempFile(images[i], i);
				if (tempPath) {
					tempImageFiles.push(tempPath);
				}
			}

			const isResumeWithPromptEmbed =
				capabilities.imageResumeMode === 'prompt-embed' && args.some((a) => a === 'resume');
			const shouldEmbedImagesInPrompt = !!imagePromptBuilder || isResumeWithPromptEmbed;

			if (shouldEmbedImagesInPrompt) {
				// Some agents consume images by mentioning temp file paths inside the prompt
				// instead of accepting a dedicated CLI image flag.
				const imagePrefix = imagePromptBuilder
					? imagePromptBuilder(tempImageFiles)
					: buildImagePromptPrefix(tempImageFiles);
				effectivePrompt = imagePrefix + prompt;
				if (!promptViaStdin) {
					finalArgs = [
						...finalArgs,
						...buildPromptArgv({ promptArgs, noPromptSeparator }, effectivePrompt),
					];
					promptAddedToArgs = true;
				}
				logger.debug('[ProcessManager] Embedded image paths in prompt', 'ProcessManager', {
					sessionId,
					imageCount: images.length,
					tempFiles: tempImageFiles,
					embedMode: imagePromptBuilder ? 'prompt-builder' : 'resume-prompt-embed',
					promptViaStdin,
				});
			} else {
				// Initial spawn: use -i flag as before
				for (const tempPath of tempImageFiles) {
					if (!imageArgs) {
						continue;
					}
					finalArgs = [...finalArgs, ...imageArgs(tempPath)];
				}
				if (!promptViaStdin) {
					finalArgs = [...finalArgs, ...buildPromptArgv({ promptArgs, noPromptSeparator }, prompt)];
					promptAddedToArgs = true;
				}
				logger.debug('[ProcessManager] Using file-based image args', 'ProcessManager', {
					sessionId,
					imageCount: images.length,
					tempFiles: tempImageFiles,
					promptViaStdin,
				});
			}
		} else if (prompt && !promptViaStdin && !promptAddedToArgs) {
			// Regular batch mode - prompt as CLI arg
			// SKIP this when prompt is sent via stdin to avoid shell escaping issues,
			// or when the caller already embedded the prompt in args (promptAlreadyInArgs).
			finalArgs = [...args, ...buildPromptArgv({ promptArgs, noPromptSeparator }, prompt)];
			promptAddedToArgs = true;
		} else {
			finalArgs = args;
		}

		// Some CLIs need an explicit query source to avoid opening their interactive UI.
		// SSH scripts own their remote arguments and must not receive local stdin flags.
		if (
			sendPromptViaStdinRaw &&
			effectivePrompt &&
			!config.sshStdinScript &&
			!config.promptAlreadyInArgs
		) {
			const stdinPromptArgs = getAgentDefinition(toolType)?.stdinPromptArgs;
			if (stdinPromptArgs) finalArgs = [...finalArgs, ...stdinPromptArgs];
		}

		// Log metadata only: prompts and argv can contain private user or playbook text.
		const spawnConfigLogFn = isWindows() ? logger.info.bind(logger) : logger.debug.bind(logger);
		spawnConfigLogFn('[ProcessManager] spawn() config', 'ProcessManager', {
			sessionId,
			toolType,
			platform: process.platform,
			hasPrompt: !!prompt,
			promptLength: prompt?.length,
			hasImages,
			hasImageArgs: !!imageArgs,
			tempImageFilesCount: tempImageFiles.length,
			command,
			commandHasExtension: path.extname(command).length > 0,
			baseArgsCount: args.length,
			finalArgsCount: finalArgs.length,
		});

		try {
			// Build environment
			const isResuming = argsResumeSession(args);
			const env = buildChildProcessEnv(
				customEnvVars,
				isResuming,
				shellEnvVars,
				config.extraPathDirs,
				config.querySource
			);

			// Log environment variable application for troubleshooting
			if (shellEnvVars && Object.keys(shellEnvVars).length > 0) {
				const globalVarKeys = Object.keys(shellEnvVars);
				logger.debug('[ProcessManager] Applying global environment variables', 'ProcessManager', {
					sessionId: config.sessionId,
					globalVarCount: globalVarKeys.length,
					globalVarKeys: globalVarKeys.slice(0, 10), // First 10 keys for visibility
					hasCustomVars: !!(customEnvVars && Object.keys(customEnvVars).length > 0),
					customVarCount: customEnvVars ? Object.keys(customEnvVars).length : 0,
				});
			}

			logger.debug('[ProcessManager] About to spawn child process', 'ProcessManager', {
				command,
				argsCount: finalArgs.length,
				cwd,
				PATH: env.PATH?.substring(0, 150),
				hasStdio: 'default (pipe)',
			});

			// Handle Windows shell requirements. Respect an explicit runInShell, and
			// auto-enable a shell on Windows when the command cannot be spawned
			// directly: a bare .exe (PATH resolution), a .cmd/.bat shim (spawn EINVAL
			// since the CVE-2024-27980 fix, MAESTRO-Q8), or an extensionless shebang
			// script. The decision lives in planSpawnShell(); the logging stays here.
			const shellPlan = planSpawnShell(command, finalArgs, {
				runInShell: config.runInShell,
				shell: config.shell,
			});
			const { command: spawnCommand, args: spawnArgs, shell: spawnShell } = shellPlan;

			if (shellPlan.autoReason) {
				logger.info(
					WINDOWS_SHELL_LOG_MESSAGES[shellPlan.autoReason],
					'ProcessManager',
					shellPlan.shebang !== undefined ? { command, shebang: shellPlan.shebang } : { command }
				);
			}

			if (isWindows() && spawnShell !== false) {
				logger.debug(
					'[ProcessManager] Forcing shell=true for agent spawn on Windows (runInShell or auto)',
					'ProcessManager',
					{ command }
				);
				const shellPath = typeof config.shell === 'string' ? config.shell : undefined;
				const shellType = isPowerShellShell(shellPath) ? 'PowerShell' : 'cmd.exe';
				logger.info(`[ProcessManager] Escaped args for ${shellType}`, 'ProcessManager', {
					originalArgsCount: finalArgs.length,
					escapedArgsCount: spawnArgs.length,
					escapedPromptArgLength: spawnArgs[spawnArgs.length - 1]?.length,
					argsModified: finalArgs.some((arg, i) => arg !== spawnArgs[i]),
				});
			}

			// Log spawn details
			const spawnLogFn = isWindows() ? logger.info.bind(logger) : logger.debug.bind(logger);
			spawnLogFn('[ProcessManager] About to spawn with shell option', 'ProcessManager', {
				sessionId,
				spawnCommand,
				// show the actual shell value passed to spawn (boolean or shell path)
				spawnShell: typeof spawnShell === 'string' ? spawnShell : !!spawnShell,
				isWindows: isWindows(),
				argsCount: spawnArgs.length,
				promptArgLength: prompt ? spawnArgs[spawnArgs.length - 1]?.length : undefined,
			});

			const isBatchMode = !!prompt;
			// Detect JSON streaming mode from args or config flag
			// IMPORTANT: SSH stdin script mode (sshStdinScript) MUST enable stream-json parsing
			// because the SSH command wraps the actual agent command. Without this, the output
			// parser won't process JSON output from remote agents, causing raw JSON to display.
			// NOTE: sendPromptViaStdinRaw sends RAW text (not JSON), so it should NOT set isStreamJsonMode
			// Use the pre-prompt args for detection to avoid false positives from prompt content
			// (e.g., a prompt like "Explain --json" should not flip isStreamJsonMode)
			const cliArgs = promptAddedToArgs ? args : finalArgs;
			const argsContain = (pattern: string) => cliArgs.some((arg) => arg.includes(pattern));
			const argsHaveFlagValue = (flag: string, value: string) =>
				cliArgs.some(
					(arg, index) =>
						arg === `${flag}=${value}` || (arg === flag && cliArgs[index + 1] === value)
				);

			// Create a fresh output parser instance for this process (not the shared singleton)
			// to isolate mutable state like tool name tracking across concurrent sessions
			const outputParser = createOutputParser(toolType) || undefined;

			const isStreamJsonMode =
				argsContain('stream-json') ||
				argsContain('--json') ||
				argsHaveFlagValue('--format', 'json') ||
				argsHaveFlagValue('--output-format', 'json') ||
				(hasImages && !!prompt) ||
				!!config.sendPromptViaStdin ||
				!!config.sshStdinScript ||
				!!outputParser; // Agents with output parsers use streaming JSONL, not batch JSON

			// What travels on stdin, decided before the process exists:
			// - SSH stdin script mode sends the entire script to /bin/bash on the
			//   remote, which bypasses all shell escaping issues.
			// - Raw stdin mode sends the prompt as literal text (non-stream-json
			//   agents on Windows). PowerShell treats the input as literal text, NOT
			//   as code to parse, so no escaping is needed.
			// - Stream-json mode sends the message as JSON, but only when the prompt
			//   was NOT already added to the CLI args. Without that guard, agents like
			//   Codex (whose --json flag sets isStreamJsonMode for output parsing)
			//   would receive the prompt both as a CLI arg and as stream-json stdin.
			// - Anything written here is the whole of what the process gets on
			//   stdin, so stdin is closed behind it. That includes the SSH script
			//   of a turn that carries no local prompt: the remote shell and the
			//   agent it starts both wait for the end of input.
			// - Batch mode with nothing to write closes stdin at once; interactive
			//   mode with nothing to write leaves it open for `ProcessManager.write()`.
			let stdinText: string | undefined;
			if (config.sshStdinScript) {
				stdinText = config.sshStdinScript;
				logger.debug('[ProcessManager] Sending SSH stdin script', 'ProcessManager', {
					sessionId,
					scriptLength: config.sshStdinScript.length,
				});
			} else if (config.sendPromptViaStdinRaw && effectivePrompt) {
				stdinText = effectivePrompt;
				logger.debug('[ProcessManager] Sending raw prompt via stdin', 'ProcessManager', {
					sessionId,
					promptLength: effectivePrompt.length,
				});
			} else if (isStreamJsonMode && effectivePrompt && !promptAddedToArgs) {
				const streamJsonMessage = buildStreamJsonMessage(effectivePrompt, images || []);
				stdinText = streamJsonMessage + '\n';
				logger.debug('[ProcessManager] Sending stream-json message via stdin', 'ProcessManager', {
					sessionId,
					messageLength: streamJsonMessage.length,
					imageCount: (images || []).length,
					hasImages: !!(images && images.length > 0),
				});
			} else if (isBatchMode) {
				logger.debug('[ProcessManager] Closing stdin for batch mode', 'ProcessManager', {
					sessionId,
				});
			}

			// The process is started, streamed and settled by the library's run
			// layer, the same one the CLI and Cue use. Everything the renderer
			// hears is still produced here, from the run layer's callbacks, in the
			// same order as before: raw stdout, then the stdout handler; stderr;
			// then exit. A killed predecessor's late events are dropped by the
			// generation check below. `managedProcess` is built once the process
			// exists; every callback that reads it runs later, from the event loop.
			const isSuperseded = (): boolean =>
				isSupersededGeneration(sessionId, managedProcess.spawnGeneration);

			const turn = startTurn(
				{
					command: spawnCommand,
					args: spawnArgs,
					cwd,
					env,
					stdin: stdinText,
					shell: spawnShell,
				},
				{
					onStdout: (output) => {
						if (isSuperseded()) return;
						// Emit raw stdout before processing for live-streaming consumers (e.g., group chat peek).
						// Wrapped in try/catch so a failing listener cannot prevent stdoutHandler from running.
						try {
							this.emitter.emit('raw-stdout', sessionId, output);
						} catch (err) {
							void captureException(err);
							logger.error('[ProcessManager] raw-stdout listener error', 'ProcessManager', {
								sessionId,
								error: String(err),
							});
						}
						this.stdoutHandler.handleData(sessionId, output);
					},
					onStderr: (stderrData) => {
						if (isSuperseded()) return;
						this.stderrHandler.handleData(sessionId, stderrData);
					},
				},
				{
					// The desktop stops through ProcessManager.interrupt() / kill(),
					// which run the same ladder on this child; the turn's own stop
					// methods are not used here.
					stopGraceMs: INTERACTIVE_STOP_GRACE_MS,
					keepStdinOpen: stdinText === undefined && !isBatchMode,
					// The stdout and stderr handlers keep what the desktop needs; a
					// second copy here would only grow for as long as the process lives.
					stdoutTailLimit: 0,
					stderrTailLimit: 0,
					sessionId,
					label: toolType,
				}
			);
			const childProcess = turn.child;

			// A stream error with no listener is an uncaught exception. stdin's is
			// the common one: EPIPE, from a prompt written to a process that has
			// already gone; the exit that follows reports what happened.
			childProcess.stdin?.on('error', (err) => {
				const errorCode = (err as NodeJS.ErrnoException).code;
				if (errorCode === 'EPIPE') {
					logger.debug(
						'[ProcessManager] stdin EPIPE - process closed before write completed',
						'ProcessManager',
						{ sessionId }
					);
				} else {
					logger.error('[ProcessManager] stdin error', 'ProcessManager', {
						sessionId,
						error: String(err),
						code: errorCode,
					});
				}
			});
			childProcess.stdout?.on('error', (err) => {
				logger.error('[ProcessManager] stdout error', 'ProcessManager', {
					sessionId,
					error: String(err),
				});
			});
			childProcess.stderr?.on('error', (err) => {
				logger.error('[ProcessManager] stderr error', 'ProcessManager', {
					sessionId,
					error: String(err),
				});
			});

			logger.debug('[ProcessManager] Child process spawned', 'ProcessManager', {
				sessionId,
				pid: childProcess.pid,
				hasStdout: !!childProcess.stdout,
				hasStderr: !!childProcess.stderr,
				hasStdin: !!childProcess.stdin,
				killed: childProcess.killed,
				exitCode: childProcess.exitCode,
			});

			logger.debug('[ProcessManager] Output parser lookup', 'ProcessManager', {
				sessionId,
				toolType,
				hasParser: !!outputParser,
				parserId: outputParser?.agentId,
				isStreamJsonMode,
				isBatchMode,
				hasSshStdinScript: !!config.sshStdinScript,
				command: config.command,
				argsCount: finalArgs.length,
			});

			const managedProcess: ManagedProcess = {
				sessionId,
				toolType,
				childProcess,
				cwd,
				pid: childProcess.pid || -1,
				isTerminal: false,
				isBatchMode,
				isStreamJsonMode,
				jsonBuffer: isBatchMode ? '' : undefined,
				startTime: Date.now(),
				outputParser,
				stderrBuffer: '',
				stdoutBuffer: '',
				contextWindow,
				ompModelCatalogKey,
				tempImageFiles: tempImageFiles.length > 0 ? tempImageFiles : undefined,
				command,
				args: finalArgs,
				querySource: config.querySource,
				tabId: config.tabId,
				projectPath: config.projectPath,
				sshRemoteId: config.sshRemoteId,
				sshRemoteHost: config.sshRemoteHost,
				sshRemoteCommand: config.sshRemoteCommand,
				// Seed from config on resume. Copilot emits `session.resume`
				// (no sessionId) instead of `session.start` when --resume=<id>
				// is set, so StdoutHandler can't populate this from the stream
				// for resumed sessions - without the seed, the post-exit disk
				// reconciliation (`ExitHandler.awaitCopilotShutdown` →
				// `readCopilotFinalAnswer` + `readCopilotShutdownUsage`)
				// short-circuits at its `if (!agentSessionId) return` guard and
				// the renderer falls back to the streamed commentary deltas
				// instead of the authoritative task_complete.summary, and the
				// context-window gauge never receives the on-disk currentTokens
				// snapshot. The stream-derived assignment in
				// `StdoutHandler.emitSessionIdIfNeeded` remains the source of
				// truth for fresh sessions.
				agentSessionId: config.agentSessionId,
				maestroEnvVars: collectMaestroEnvVars(
					shellEnvVars,
					customEnvVars,
					isResuming,
					config.querySource ?? DEFAULT_QUERY_SOURCE
				),
			};

			// A killed process keeps emitting stdio and fires `close` well after
			// ProcessManager has registered a replacement under the same sessionId
			// key (`spawn()` kills the predecessor first, then the spawner re-uses
			// the key). Everything downstream is keyed by sessionId alone, so those
			// late events get attributed to the live successor: its `close` reports
			// the dead turn's exit code (143 after SIGTERM) as the live agent
			// crashing AND deletes the successor's tracking entry, orphaning a
			// process the user can no longer stop.
			//
			// Generation, not map identity: the map answers "am I still the entry?",
			// which stops working the moment the successor finishes and deletes its
			// own entry - at which point a predecessor still draining would look
			// current again. See process-manager/generation.ts.
			managedProcess.spawnGeneration = nextSpawnGeneration(sessionId);
			this.processes.set(sessionId, managedProcess);

			// The run layer settles once the streams have ended, so every line the
			// process wrote has been read by then. A process that never started is
			// reported once, as an error, rather than as an error and then a close.
			void turn.done.then((exit) => {
				if (isSuperseded()) {
					logger.warn('[ProcessManager] Ignoring exit from superseded process', 'ProcessManager', {
						sessionId,
						pid: childProcess.pid,
						exitCode: exit.exitCode,
						error: exit.spawnError ? String(exit.spawnError) : undefined,
					});
					return;
				}
				if (exit.spawnError) {
					this.exitHandler.handleError(sessionId, exit.spawnError);
					return;
				}
				// Hand the exiting process in explicitly: it may already have been
				// unregistered, and handleExit must settle THIS process rather than
				// whatever currently owns the session id.
				// `signal` is what tells a kill from a clean exit once `code || 0` has
				// turned the killed process's null code into 0. `stdinError` says the
				// prompt never fully reached the agent.
				return this.exitHandler
					.handleExit(sessionId, exit.exitCode || 0, managedProcess, exit.signal, exit.stdinError)
					.catch((err) => {
						logger.error('[ProcessManager] handleExit threw', 'ProcessManager', {
							sessionId,
							error: String(err),
						});
					});
			});

			return { pid: childProcess.pid || -1, success: true };
		} catch (error) {
			void captureException(error);
			logger.error('[ProcessManager] Failed to spawn process', 'ProcessManager', {
				error: String(error),
			});
			return { pid: -1, success: false };
		}
	}
	private spawnPrivate(
		config: ProcessConfig,
		withholdProviderOutput = false,
		preparedOwnership?: {
			capture(process: ManagedProcess, rollback: () => void): void;
			fence(): void;
		}
	): SpawnResult {
		const {
			sessionId,
			toolType,
			cwd,
			command,
			args,
			prompt,
			images,
			imageArgs,
			imagePromptBuilder,
			promptArgs,
			contextWindow,
			ompModelCatalogKey,
			customEnvVars,
			shellEnvVars,
			noPromptSeparator,
			sendPromptViaStdin,
			sendPromptViaStdinRaw,
		} = config;
		const commandPublication = projectMcpProcessPublication([command]);
		const commandToLog = commandPublication.args[0];

		const hasImages = images && images.length > 0;
		const capabilities = getAgentCapabilities(toolType);

		// Check if prompt will be sent via stdin instead of command line
		// This is critical for SSH remote execution to avoid shell escaping issues
		// Also critical on Windows: when using stream-json output mode, the prompt is sent
		// via stdin (see stream-json stdin write below). Adding it as a CLI arg too would
		// exceed cmd.exe's ~8191 character command line limit, causing immediate exit code 1.
		//
		// IMPORTANT: Only match --input-format stream-json, NOT --output-format stream-json.
		// Matching --output-format caused promptViaStdin to be always true for Claude Code
		// (whose default args include --output-format stream-json), which prevented
		// --input-format stream-json from being added when sending images, causing Claude
		// to interpret the raw JSON+base64 blob as plain text and blow the token limit.
		const argsHaveInputStreamJson = args.some(
			(arg, i) => arg === 'stream-json' && i > 0 && args[i - 1] === '--input-format'
		);
		const promptViaStdin = sendPromptViaStdin || sendPromptViaStdinRaw || argsHaveInputStreamJson;

		// Build final args based on batch mode and images
		// Track whether the prompt was added to CLI args (used later to decide stdin behavior)
		let finalArgs: string[];
		let tempImageFiles: string[] = [];
		// effectivePrompt may be modified (e.g., image path prefix prepended for resume mode)
		let effectivePrompt = prompt;
		// If the caller pre-embedded the prompt in args (e.g., SSH tab naming wraps it
		// inside bash -c), skip the appending paths below and treat it as already-added.
		let promptAddedToArgs = !!config.promptAlreadyInArgs;

		let withholdErrors = withholdProviderOutput;
		let spawnedChild: ChildProcess | undefined;
		let registeredProcess: ManagedProcess | undefined;
		let rolledBack = false;
		let preparedExitStarted = false;
		let nativePreparationEntered = false;
		const listenerDisposers: (() => void)[] = [];
		// Track only our listeners; retain inert error consumers after disposal so
		// late native stream errors cannot become unhandled exceptions.
		const listen = (
			source: EventEmitter,
			event: string,
			listener: Parameters<EventEmitter['on']>[1]
		) => {
			if (withholdProviderOutput)
				listenerDisposers.push(() => source.removeListener(event, listener));
			source.on(event, listener);
		};
		const rollbackPrepared = () => {
			if (!withholdProviderOutput || rolledBack) return;
			rolledBack = true; // Fence data/settlement BEFORE abort/native callbacks.
			if (registeredProcess) this.exitHandler.discardPrivateOutput(registeredProcess);
			try {
				preparedOwnership?.fence();
			} catch {
				/* The fence is irreversible even if an abort observer throws. */
			}
			for (const dispose of listenerDisposers.splice(0)) dispose();
			let killFailed = false;
			if (spawnedChild) {
				for (const source of [
					spawnedChild,
					spawnedChild.stdin,
					spawnedChild.stdout,
					spawnedChild.stderr,
				])
					source?.on('error', () => {});
				try {
					// Prepared ownership admits local POSIX children only. Immediate
					// SIGKILL needs no new timer and targets this child, never a reused key.
					if (
						spawnedChild.exitCode === null &&
						spawnedChild.signalCode === null &&
						!spawnedChild.kill('SIGKILL')
					)
						throw new Error('PrivateMcpSpawnFailed');
				} catch {
					killFailed = true;
					logger.error('[ProcessManager] Prepared child rollback failed', 'ProcessManager', {
						error: 'PrivateMcpSpawnFailed',
					});
				}
				for (const stream of [spawnedChild.stdin, spawnedChild.stdout, spawnedChild.stderr]) {
					try {
						stream?.destroy();
					} catch {
						/* No native cause publication. */
					}
				}
			}
			// Cleanup belongs to the failed spawn even if a successor now owns the key.
			if (!preparedExitStarted) cleanupTempFiles(tempImageFiles, true);
			tempImageFiles = [];
			if (registeredProcess) this.exitHandler.discardPrivateOutput(registeredProcess);
			if (registeredProcess && !preparedExitStarted) {
				preparedExitStarted = true;
				registeredProcess.tempImageFiles = undefined;
				const failedProcess = registeredProcess;
				const settleRollback = () => {
					void this.exitHandler.handleExit(sessionId, 1, failedProcess, true).catch(() => {
						logger.error('[ProcessManager] Prepared rollback settlement failed', 'ProcessManager', {
							error: 'PrivateMcpSpawnFailed',
						});
					});
				};
				// A rejected kill is not an observed stop: retain tracking until close.
				// The manager may retry its canonical exact-object kill in the meantime.
				if (killFailed && spawnedChild?.exitCode === null && spawnedChild.signalCode === null)
					spawnedChild.once('close', settleRollback);
				else settleRollback();
			}
		};

		try {
			if (hasImages && prompt && capabilities.supportsStreamJsonInput) {
				// For agents that support stream-json input (like Claude Code)
				// Always add --input-format stream-json when sending images via stdin.
				// This flag is required for Claude Code to parse the JSON+base64 message
				// correctly; without it, the raw JSON is treated as plain text prompt.
				const needsInputFormat = !args.includes('--input-format')
					? ['--input-format', 'stream-json']
					: [];
				finalArgs = [...args, ...needsInputFormat];
				// Prompt will be sent via stdin as stream-json with embedded images (not in CLI args)
			} else if (hasImages && prompt && (imageArgs || imagePromptBuilder)) {
				// For agents that use file-based image args (like Codex, OpenCode) or
				// prompt-embedded image mentions (like Copilot's @path syntax)
				finalArgs = [...args];
				tempImageFiles = [];
				for (let i = 0; i < images.length; i++) {
					const tempPath = saveImageToTempFile(images[i], i, withholdProviderOutput);
					if (tempPath) {
						tempImageFiles.push(tempPath);
					}
				}

				const isResumeWithPromptEmbed =
					capabilities.imageResumeMode === 'prompt-embed' && args.some((a) => a === 'resume');
				const shouldEmbedImagesInPrompt = !!imagePromptBuilder || isResumeWithPromptEmbed;

				if (shouldEmbedImagesInPrompt) {
					// Some agents consume images by mentioning temp file paths inside the prompt
					// instead of accepting a dedicated CLI image flag.
					const imagePrefix = imagePromptBuilder
						? imagePromptBuilder(tempImageFiles)
						: buildImagePromptPrefix(tempImageFiles);
					effectivePrompt = imagePrefix + prompt;
					if (!promptViaStdin) {
						if (promptArgs) {
							finalArgs = [...finalArgs, ...promptArgs(effectivePrompt)];
						} else if (noPromptSeparator) {
							finalArgs = [...finalArgs, effectivePrompt];
						} else {
							finalArgs = [...finalArgs, '--', effectivePrompt];
						}
						promptAddedToArgs = true;
					}
					logger.debug('[ProcessManager] Embedded image paths in prompt', 'ProcessManager', {
						sessionId,
						imageCount: images.length,
						tempFiles: withholdProviderOutput ? undefined : tempImageFiles,
						embedMode: imagePromptBuilder ? 'prompt-builder' : 'resume-prompt-embed',
						promptViaStdin,
					});
				} else {
					// Initial spawn: use -i flag as before
					for (const tempPath of tempImageFiles) {
						if (!imageArgs) {
							continue;
						}
						finalArgs = [...finalArgs, ...imageArgs(tempPath)];
					}
					if (!promptViaStdin) {
						if (promptArgs) {
							finalArgs = [...finalArgs, ...promptArgs(prompt)];
						} else if (noPromptSeparator) {
							finalArgs = [...finalArgs, prompt];
						} else {
							finalArgs = [...finalArgs, '--', prompt];
						}
						promptAddedToArgs = true;
					}
					logger.debug('[ProcessManager] Using file-based image args', 'ProcessManager', {
						sessionId,
						imageCount: images.length,
						tempFiles: withholdProviderOutput ? undefined : tempImageFiles,
						promptViaStdin,
					});
				}
			} else if (prompt && !promptViaStdin && !promptAddedToArgs) {
				// Regular batch mode - prompt as CLI arg
				// SKIP this when prompt is sent via stdin to avoid shell escaping issues,
				// or when the caller already embedded the prompt in args (promptAlreadyInArgs).
				if (promptArgs) {
					finalArgs = [...args, ...promptArgs(prompt)];
				} else if (noPromptSeparator) {
					finalArgs = [...args, prompt];
				} else {
					finalArgs = [...args, '--', prompt];
				}
				promptAddedToArgs = true;
			} else {
				finalArgs = args;
			}

			// Publication copies never replace the actual args/env passed to spawn.
			const argsPublication = projectMcpProcessPublication(finalArgs, customEnvVars);
			const shellPublication = projectMcpProcessPublication([], shellEnvVars);
			withholdErrors ||=
				withholdProviderOutput ||
				argsPublication.withheld ||
				commandPublication.withheld ||
				shellPublication.withheld;
			// Log spawn config
			const spawnConfigLogFn = isWindows() ? logger.info.bind(logger) : logger.debug.bind(logger);
			spawnConfigLogFn('[ProcessManager] spawn() config', 'ProcessManager', {
				sessionId,
				toolType,
				platform: process.platform,
				hasPrompt: !!prompt,
				promptLength: prompt?.length,
				promptPreview:
					prompt && isWindows() && !withholdProviderOutput
						? {
								first100: prompt.substring(0, 100),
								last100: prompt.substring(Math.max(0, prompt.length - 100)),
							}
						: undefined,
				hasImages,
				hasImageArgs: !!imageArgs,
				tempImageFilesCount: tempImageFiles.length,
				command: commandToLog,
				commandHasExtension: path.extname(command).length > 0,
				baseArgsCount: args.length,
				finalArgsCount: finalArgs.length,
			});

			nativePreparationEntered = true;
			// Build environment
			const isResuming =
				args.some((arg) => arg === '--resume' || arg.startsWith('--resume=')) ||
				args.includes('--session');
			const env = buildChildProcessEnv(
				customEnvVars,
				isResuming,
				shellEnvVars,
				config.extraPathDirs,
				config.querySource
			);
			const publication = projectMcpProcessPublication(finalArgs, env);
			withholdErrors ||= publication.withheld;

			// Log environment variable application for troubleshooting
			if (shellEnvVars && Object.keys(shellEnvVars).length > 0) {
				const globalVarKeys = Object.keys(shellPublication.env);
				logger.debug('[ProcessManager] Applying global environment variables', 'ProcessManager', {
					sessionId: config.sessionId,
					globalVarCount: globalVarKeys.length,
					globalVarKeys: globalVarKeys.slice(0, 10), // First 10 keys for visibility
					hasCustomVars: !!(customEnvVars && Object.keys(customEnvVars).length > 0),
					customVarCount: customEnvVars ? Object.keys(customEnvVars).length : 0,
				});
			}

			logger.debug('[ProcessManager] About to spawn child process', 'ProcessManager', {
				command: commandToLog,
				finalArgs: publication.args,
				cwd,
				PATH: publication.env.PATH?.substring(0, 150),
				hasStdio: 'default (pipe)',
			});

			// Handle Windows shell requirements
			let spawnCommand = command;
			let spawnArgs = finalArgs;
			// Respect explicit request from caller, but also be defensive: if caller
			// did not set runInShell and we're on Windows with a bare .exe basename,
			// enable shell so PATH resolution occurs. This avoids ENOENT when callers
			// rewrite the command to basename (or pass a basename) but forget to set
			// the runInShell flag.
			let useShell = !!config.runInShell;

			// Auto-enable shell for Windows when command is a bare .exe (no path)
			const commandHasPath = /\\|\//.test(spawnCommand);
			const commandExt = path.extname(spawnCommand).toLowerCase();
			if (isWindows() && !useShell && !commandHasPath && commandExt === '.exe') {
				useShell = true;
				logger.info(
					'[ProcessManager] Auto-enabling shell for Windows to allow PATH resolution of basename exe',
					'ProcessManager',
					{ command: commandToLog }
				);
			}

			// Auto-enable shell for Windows when command is a batch file (.cmd/.bat).
			// Node.js refuses to spawn .cmd/.bat directly (throws "spawn EINVAL") after
			// the CVE-2024-27980 fix - they must be launched through a shell. npm-installed
			// agent CLIs resolve to shims like claude.cmd / codex.cmd / opencode.cmd, which
			// is exactly what tab naming spawns on Windows. Fixes MAESTRO-Q8.
			if (isWindows() && !useShell && (commandExt === '.cmd' || commandExt === '.bat')) {
				useShell = true;
				logger.info(
					'[ProcessManager] Auto-enabling shell for Windows to spawn batch-file command',
					'ProcessManager',
					{ command: commandToLog }
				);
			}

			// Auto-enable shell for Windows when command is a shell script (extensionless with shebang)
			// This handles tools like OpenCode installed via npm with shell scripts
			if (isWindows() && !useShell && !commandExt && commandHasPath) {
				try {
					const fileContent = fs.readFileSync(spawnCommand, 'utf8');
					if (fileContent.startsWith('#!')) {
						useShell = true;
						logger.info(
							'[ProcessManager] Auto-enabling shell for Windows to execute shell script',
							'ProcessManager',
							{ command: commandToLog }
						);
					}
				} catch {
					// If we can't read the file, just continue without special handling
				}
			}

			if (isWindows() && useShell) {
				logger.debug(
					'[ProcessManager] Forcing shell=true for agent spawn on Windows (runInShell or auto)',
					'ProcessManager',
					{ command: commandToLog }
				);

				// Use the shell escape utility for proper argument escaping
				const shellPath = typeof config.shell === 'string' ? config.shell : undefined;
				spawnArgs = escapeArgsForShell(finalArgs, shellPath);

				const shellType = isPowerShellShell(shellPath) ? 'PowerShell' : 'cmd.exe';
				const escapedPublication = escapeArgsForShell([...publication.args], shellPath);
				logger.info(`[ProcessManager] Escaped args for ${shellType}`, 'ProcessManager', {
					originalArgsCount: finalArgs.length,
					escapedArgsCount: spawnArgs.length,
					escapedPromptArgLength: spawnArgs[spawnArgs.length - 1]?.length,
					escapedPromptArgPreview: escapedPublication.at(-1)?.substring(0, 200),
					argsModified: finalArgs.some((arg, i) => arg !== spawnArgs[i]),
				});
			}

			// Determine shell option to pass to child_process.spawn.
			// If the caller provided a specific shell path, prefer that (string).
			// Otherwise pass a boolean indicating whether to use the default shell.
			let spawnShell: boolean | string = !!useShell;
			if (useShell && typeof config.shell === 'string' && config.shell.trim()) {
				spawnShell = config.shell.trim();
			}

			// When spawning through the default Windows shell (cmd.exe via ComSpec),
			// Node concatenates the command and args into a single command line without
			// quoting the command itself. A command path that contains spaces - e.g. an
			// npm shim under "C:\Users\First Last\AppData\Roaming\npm\claude.cmd" - would
			// be split by cmd.exe and fail. Quote it defensively. We only do this for the
			// boolean (cmd.exe) shell path; an explicit shell string carries its own
			// quoting rules and is the caller's responsibility.
			if (
				isWindows() &&
				spawnShell === true &&
				/\s/.test(spawnCommand) &&
				!spawnCommand.startsWith('"')
			) {
				spawnCommand = `"${spawnCommand}"`;
			}

			// Log spawn details
			const spawnArgsToLog =
				isWindows() && useShell
					? escapeArgsForShell(
							[...publication.args],
							typeof config.shell === 'string' ? config.shell : undefined
						)
					: publication.args;
			const spawnLogFn = isWindows() ? logger.info.bind(logger) : logger.debug.bind(logger);
			spawnLogFn('[ProcessManager] About to spawn with shell option', 'ProcessManager', {
				sessionId,
				spawnCommand: commandToLog,
				// show the actual shell value passed to spawn (boolean or shell path)
				spawnShell: typeof spawnShell === 'string' ? spawnShell : !!spawnShell,
				isWindows: isWindows(),
				argsCount: spawnArgs.length,
				promptArgLength: prompt ? spawnArgs[spawnArgs.length - 1]?.length : undefined,
				fullCommandPreview: `${commandToLog} ${spawnArgsToLog.join(' ')}`,
			});

			const childProcess = (spawnedChild = spawn(spawnCommand, spawnArgs, {
				cwd,
				env,
				shell: spawnShell,
				stdio: ['pipe', 'pipe', 'pipe'],
			}));

			// Cover partial setup before a ManagedProcess/lifetime capture exists.
			if (withholdProviderOutput) listen(childProcess, 'error', rollbackPrepared);

			logger.debug('[ProcessManager] Child process spawned', 'ProcessManager', {
				sessionId,
				pid: childProcess.pid,
				hasStdout: !!childProcess.stdout,
				hasStderr: !!childProcess.stderr,
				hasStdin: !!childProcess.stdin,
				killed: childProcess.killed,
				exitCode: childProcess.exitCode,
			});

			const isBatchMode = !!prompt;
			// Detect JSON streaming mode from args or config flag
			// IMPORTANT: SSH stdin script mode (sshStdinScript) MUST enable stream-json parsing
			// because the SSH command wraps the actual agent command. Without this, the output
			// parser won't process JSON output from remote agents, causing raw JSON to display.
			// NOTE: sendPromptViaStdinRaw sends RAW text (not JSON), so it should NOT set isStreamJsonMode
			// Use the pre-prompt args for detection to avoid false positives from prompt content
			// (e.g., a prompt like "Explain --json" should not flip isStreamJsonMode)
			const cliArgs = promptAddedToArgs ? args : finalArgs;
			const argsContain = (pattern: string) => cliArgs.some((arg) => arg.includes(pattern));
			const argsHaveFlagValue = (flag: string, value: string) =>
				cliArgs.some(
					(arg, index) =>
						arg === `${flag}=${value}` || (arg === flag && cliArgs[index + 1] === value)
				);

			// Create a fresh output parser instance for this process (not the shared singleton)
			// to isolate mutable state like tool name tracking across concurrent sessions
			const outputParser = createOutputParser(toolType) || undefined;

			const isStreamJsonMode =
				argsContain('stream-json') ||
				argsContain('--json') ||
				argsHaveFlagValue('--format', 'json') ||
				argsHaveFlagValue('--output-format', 'json') ||
				(hasImages && !!prompt) ||
				!!config.sendPromptViaStdin ||
				!!config.sshStdinScript ||
				!!outputParser; // Agents with output parsers use streaming JSONL, not batch JSON

			logger.debug('[ProcessManager] Output parser lookup', 'ProcessManager', {
				sessionId,
				toolType,
				hasParser: !!outputParser,
				parserId: outputParser?.agentId,
				isStreamJsonMode,
				isBatchMode,
				hasSshStdinScript: !!config.sshStdinScript,
				command: commandToLog,
				argsCount: finalArgs.length,
				argsPreview: publication.args.at(-1)?.substring(0, 500),
			});

			const managedProcess: ManagedProcess = {
				sessionId,
				toolType,
				childProcess,
				cwd,
				pid: childProcess.pid || -1,
				isTerminal: false,
				isBatchMode,
				isStreamJsonMode,
				jsonBuffer: isBatchMode ? '' : undefined,
				startTime: Date.now(),
				outputParser,
				stderrBuffer: '',
				stdoutBuffer: '',
				contextWindow,
				ompModelCatalogKey,
				tempImageFiles: tempImageFiles.length > 0 ? tempImageFiles : undefined,
				command,
				args: finalArgs,
				querySource: config.querySource,
				tabId: config.tabId,
				projectPath: config.projectPath,
				sshRemoteId: config.sshRemoteId,
				sshRemoteHost: config.sshRemoteHost,
				sshRemoteCommand: config.sshRemoteCommand,
				// Seed from config on resume. Copilot emits `session.resume`
				// (no sessionId) instead of `session.start` when --resume=<id>
				// is set, so StdoutHandler can't populate this from the stream
				// for resumed sessions - without the seed, the post-exit disk
				// reconciliation (`ExitHandler.awaitCopilotShutdown` →
				// `readCopilotFinalAnswer` + `readCopilotShutdownUsage`)
				// short-circuits at its `if (!agentSessionId) return` guard and
				// the renderer falls back to the streamed commentary deltas
				// instead of the authoritative task_complete.summary, and the
				// context-window gauge never receives the on-disk currentTokens
				// snapshot. The stream-derived assignment in
				// `StdoutHandler.emitSessionIdIfNeeded` remains the source of
				// truth for fresh sessions.
				agentSessionId: config.agentSessionId,
				maestroEnvVars: collectMaestroEnvVars(
					shellEnvVars,
					customEnvVars,
					isResuming,
					config.querySource ?? DEFAULT_QUERY_SOURCE
				),
			};

			// A killed process keeps emitting stdio and fires `close` well after
			// ProcessManager has registered a replacement under the same sessionId
			// key (`spawn()` kills the predecessor first, then the spawner re-uses
			// the key). Everything downstream is keyed by sessionId alone, so those
			// late events get attributed to the live successor: its `close` reports
			// the dead turn's exit code (143 after SIGTERM) as the live agent
			// crashing AND deletes the successor's tracking entry, orphaning a
			// process the user can no longer stop.
			//
			// Generation, not map identity: the map answers "am I still the entry?",
			// which stops working the moment the successor finishes and deletes its
			// own entry - at which point a predecessor still draining would look
			// current again. See process-manager/generation.ts.
			if (rolledBack) return { pid: -1, success: false };
			managedProcess.spawnGeneration = nextSpawnGeneration(sessionId);
			registeredProcess = managedProcess;
			this.processes.set(sessionId, managedProcess);
			if (withholdProviderOutput) preparedOwnership?.capture(managedProcess, rollbackPrepared);

			const isSuperseded = (): boolean =>
				rolledBack || isSupersededGeneration(sessionId, managedProcess.spawnGeneration);

			logger.debug('[ProcessManager] Setting up stdout/stderr/exit handlers', 'ProcessManager', {
				sessionId,
				hasStdout: childProcess.stdout ? 'exists' : 'null',
				hasStderr: childProcess.stderr ? 'exists' : 'null',
			});

			// Handle stdin errors
			if (childProcess.stdin) {
				listen(childProcess.stdin, 'error', (err: Error) => {
					if (rolledBack) return;
					if (withholdProviderOutput) {
						rollbackPrepared();
						return;
					}
					// Private native errors may have hostile getters. Do not inspect
					// code/message/cause even to recognize an otherwise harmless EPIPE.
					if (withholdErrors) {
						logger.error('[ProcessManager] stdin error', 'ProcessManager', {
							sessionId,
							error: 'PrivateMcpSpawnFailed',
						});
						return;
					}
					const errorCode = (err as NodeJS.ErrnoException).code;
					if (errorCode === 'EPIPE') {
						logger.debug(
							'[ProcessManager] stdin EPIPE - process closed before write completed',
							'ProcessManager',
							{ sessionId }
						);
					} else {
						logger.error('[ProcessManager] stdin error', 'ProcessManager', {
							sessionId,
							error: withholdErrors ? 'PrivateMcpSpawnFailed' : String(err),
							code: withholdErrors ? undefined : errorCode,
						});
					}
				});
			}

			// Handle stdout
			if (childProcess.stdout) {
				logger.debug('[ProcessManager] Attaching stdout data listener', 'ProcessManager', {
					sessionId,
				});
				if (!withholdProviderOutput) childProcess.stdout.setEncoding('utf8');
				listen(childProcess.stdout, 'error', (err: Error) => {
					if (rolledBack) return;
					logger.error('[ProcessManager] stdout error', 'ProcessManager', {
						sessionId,
						error: withholdErrors ? 'PrivateMcpSpawnFailed' : String(err),
					});
				});
				listen(childProcess.stdout, 'data', (data: Buffer | string) => {
					if (isSuperseded()) return;
					// Complete withholding is independent of chunk boundaries/encoding.
					// An empty raw event retains stdout liveness without provider bytes.
					const output = withholdProviderOutput ? '' : data.toString();
					// Emit raw stdout before processing for live-streaming consumers (e.g., group chat peek).
					// Wrapped in try/catch so a failing listener cannot prevent stdoutHandler from running.
					try {
						this.emitter.emit('raw-stdout', sessionId, output);
					} catch (err) {
						void captureException(withholdErrors ? new Error('PrivateMcpSpawnFailed') : err);
						logger.error('[ProcessManager] raw-stdout listener error', 'ProcessManager', {
							sessionId,
							error: withholdErrors ? 'PrivateMcpSpawnFailed' : String(err),
						});
					}
					if (!withholdProviderOutput) this.stdoutHandler.handleData(sessionId, output);
				});
			} else {
				logger.warn('[ProcessManager] childProcess.stdout is null', 'ProcessManager', {
					sessionId,
				});
			}

			// Handle stderr
			if (childProcess.stderr) {
				logger.debug('[ProcessManager] Attaching stderr data listener', 'ProcessManager', {
					sessionId,
				});
				if (!withholdProviderOutput) childProcess.stderr.setEncoding('utf8');
				listen(childProcess.stderr, 'error', (err: Error) => {
					if (rolledBack) return;
					logger.error('[ProcessManager] stderr error', 'ProcessManager', {
						sessionId,
						error: withholdErrors ? 'PrivateMcpSpawnFailed' : String(err),
					});
				});
				listen(childProcess.stderr, 'data', (data: Buffer | string) => {
					if (isSuperseded() || withholdProviderOutput) return;
					const stderrData = data.toString();
					this.stderrHandler.handleData(sessionId, stderrData);
				});
			}

			// Prepared native error and close must settle this exact child only once.
			const settleExit = (code: number): void => {
				if (withholdProviderOutput && preparedExitStarted) return;
				if (withholdProviderOutput) preparedExitStarted = true;
				void this.exitHandler
					.handleExit(sessionId, code, managedProcess, withholdProviderOutput)
					.catch((err) => {
						logger.error('[ProcessManager] handleExit threw', 'ProcessManager', {
							sessionId,
							error: withholdErrors ? 'PrivateMcpSpawnFailed' : String(err),
						});
					});
			};

			// Handle close (NOT exit) to ensure all stdout/stderr data is fully consumed.
			// The 'exit' event can fire before the stdio streams have been drained,
			// which causes data loss for short-lived processes where the result is
			// emitted near the end of stdout (e.g., tab-naming, batch operations).
			// The 'close' event guarantees all stdio streams are closed first.
			listen(childProcess, 'close', (code: number | null) => {
				if (rolledBack) return;
				if (isSuperseded()) {
					logger.warn('[ProcessManager] Ignoring exit from superseded process', 'ProcessManager', {
						sessionId,
						pid: childProcess.pid,
						exitCode: code,
					});
					return;
				}
				// Hand the exiting process in explicitly: it may already have been
				// unregistered, and handleExit must settle THIS process rather than
				// whatever currently owns the session id.
				settleExit(code || 0);
			});

			// Handle errors
			listen(childProcess, 'error', (error: Error) => {
				if (rolledBack) return;
				// An abort observer may have installed a successor before this
				// callback. Failed-child cleanup still belongs to the captured child.
				if (withholdProviderOutput) {
					rollbackPrepared();
					return;
				}
				if (isSuperseded()) {
					logger.warn('[ProcessManager] Ignoring error from superseded process', 'ProcessManager', {
						sessionId,
						pid: childProcess.pid,
						error: withholdErrors ? 'PrivateMcpSpawnFailed' : String(error),
					});
					return;
				}
				this.exitHandler.handleError(
					sessionId,
					withholdErrors ? new Error('PrivateMcpSpawnFailed') : error
				);
			});

			if (config.sshStdinScript) {
				// SSH stdin script mode: send the entire script to /bin/bash on remote
				// This bypasses all shell escaping issues by piping the script via stdin
				logger.debug('[ProcessManager] Sending SSH stdin script', 'ProcessManager', {
					sessionId,
					scriptLength: config.sshStdinScript.length,
				});
				childProcess.stdin?.write(config.sshStdinScript);
				if (!rolledBack) childProcess.stdin?.end();
			} else if (config.sendPromptViaStdinRaw && effectivePrompt) {
				// Raw stdin mode: send prompt as literal text (non-stream-json agents on Windows)
				// Note: When sending via stdin, PowerShell treats the input as literal text,
				// NOT as code to parse. No escaping is needed for special characters.
				logger.debug('[ProcessManager] Sending raw prompt via stdin', 'ProcessManager', {
					sessionId,
					promptLength: effectivePrompt.length,
				});
				childProcess.stdin?.write(effectivePrompt);
				if (!rolledBack) childProcess.stdin?.end();
			} else if (isStreamJsonMode && effectivePrompt && !promptAddedToArgs) {
				// Stream-json mode: send the message via stdin as JSON.
				// Only write when prompt was NOT already added to CLI args.
				// Without this guard, agents like Codex (whose --json flag sets isStreamJsonMode
				// for output parsing) would receive the prompt both as a CLI arg and as stream-json
				// stdin, causing unexpected behavior.
				// Carry the captured host policy through parsing and persisted-image
				// resolution before either helper can publish a reference/native cause.
				const streamJsonMessage = buildStreamJsonMessage(
					effectivePrompt,
					images || [],
					withholdProviderOutput
				);
				logger.debug('[ProcessManager] Sending stream-json message via stdin', 'ProcessManager', {
					sessionId,
					messageLength: streamJsonMessage.length,
					imageCount: (images || []).length,
					hasImages: !!(images && images.length > 0),
				});
				if (rolledBack) return { pid: -1, success: false };
				childProcess.stdin?.write(streamJsonMessage + '\n');
				if (!rolledBack) childProcess.stdin?.end();
			} else if (isBatchMode) {
				// Regular batch mode: close stdin immediately
				logger.debug('[ProcessManager] Closing stdin for batch mode', 'ProcessManager', {
					sessionId,
				});
				if (!rolledBack) childProcess.stdin?.end();
			}

			if (rolledBack) return { pid: -1, success: false };
			return { pid: childProcess.pid || -1, success: true };
		} catch (error) {
			if (!withholdProviderOutput && !nativePreparationEntered) throw error;
			rollbackPrepared();
			void captureException(withholdErrors ? new Error('PrivateMcpSpawnFailed') : error);
			logger.error('[ProcessManager] Failed to spawn process', 'ProcessManager', {
				error: withholdErrors ? 'PrivateMcpSpawnFailed' : String(error),
			});
			return { pid: -1, success: false };
		}
	}
}
