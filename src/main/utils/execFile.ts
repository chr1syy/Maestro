import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execFileAsync = promisify(execFile);

export interface ExecOptions {
	input?: string; // Content to write to stdin
	timeout?: number; // Timeout in milliseconds
	env?: NodeJS.ProcessEnv; // Environment variables
}

// Maximum buffer size for command output (10MB)
const EXEC_MAX_BUFFER = 10 * 1024 * 1024;

// Default timeout values (in milliseconds)
const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds
const WINDOWS_DEFAULT_TIMEOUT_MS = 120000; // 120 seconds on Windows

export interface ExecErrorContext {
	code: string; // Error code: numeric exit code as string, 'ETIMEDOUT', 'ENOENT', 'EACCES', 'EPERM', 'SIGTERM', 'SIGKILL', etc.
	detail: string; // Human-readable detail about the error
	isTimeout: boolean; // true if error was due to timeout
	isPermission: boolean; // true if error was permission-related
	signal?: string; // Signal name if process was killed
}

export interface ExecResult {
	stdout: string;
	stderr: string;
	/**
	 * The exit code or error classification of the process.
	 * - A number (0 for success, 1-255 for exit code) when the process ran and exited
	 * - An error context object when an error occurs
	 */
	exitCode: number | ExecErrorContext;
}

/**
 * Create an error context from spawn or exec errors
 */
function createErrorContext(error: any, isTimeout: boolean = false): ExecErrorContext {
	const isPermissionError = error?.code === 'EACCES' || error?.code === 'EPERM';

	if (isTimeout) {
		return {
			code: 'ETIMEDOUT',
			detail: 'Command timed out',
			isTimeout: true,
			isPermission: false,
		};
	}

	if (error?.code === 'ENOENT') {
		return {
			code: 'ENOENT',
			detail: 'Command not found',
			isTimeout: false,
			isPermission: false,
		};
	}

	if (error?.code === 'EACCES') {
		return {
			code: 'EACCES',
			detail: 'Permission denied',
			isTimeout: false,
			isPermission: true,
		};
	}

	if (error?.code === 'EPERM') {
		return {
			code: 'EPERM',
			detail: 'Operation not permitted',
			isTimeout: false,
			isPermission: true,
		};
	}

	if (error?.signal) {
		return {
			code: error.signal,
			detail: `Process killed by signal ${error.signal}`,
			isTimeout: false,
			isPermission: false,
			signal: error.signal,
		};
	}

	return {
		code: error?.code || 'UNKNOWN',
		detail: error?.message || 'Unknown error',
		isTimeout: false,
		isPermission: isPermissionError,
	};
}

/**
 * Get the effective timeout for a command based on platform and command type
 */
function getEffectiveTimeout(_command: string, override?: number): number {
	// If explicit timeout is provided, use it
	if (override !== undefined) {
		return override;
	}

	// Windows gets a longer default timeout
	const isWindows = process.platform === 'win32';
	return isWindows ? WINDOWS_DEFAULT_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

/**
 * Determine if a command needs shell execution on Windows
 * - Batch files (.cmd, .bat) always need shell
 * - Commands without extensions normally need PATHEXT resolution via shell,
 *   BUT we avoid shell for known commands that have .exe variants (git, node, etc.)
 *   to prevent percent-sign escaping issues in arguments
 * - Executables (.exe, .com) can run directly
 */
export function needsWindowsShell(command: string): boolean {
	const lowerCommand = command.toLowerCase();

	// Batch files always need shell
	if (lowerCommand.endsWith('.cmd') || lowerCommand.endsWith('.bat')) {
		return true;
	}

	// Known executables don't need shell
	if (lowerCommand.endsWith('.exe') || lowerCommand.endsWith('.com')) {
		return false;
	}

	// Commands without extension: skip shell for known commands that have .exe variants
	// This prevents issues like % being interpreted as environment variables on Windows
	// Extract basename to handle full paths like 'C:\Program Files\Git\bin\git'
	// Use regex to handle both Unix (/) and Windows (\) path separators
	const knownExeCommands = new Set([
		'git',
		'node',
		'npm',
		'npx',
		'yarn',
		'pnpm',
		'python',
		'python3',
		'pip',
		'pip3',
	]);
	const commandBaseName = lowerCommand.split(/[\\/]/).pop() || lowerCommand;
	if (knownExeCommands.has(commandBaseName)) {
		return false;
	}

	// Other commands without extension still need shell for PATHEXT resolution
	const hasExtension = path.extname(command).length > 0;
	return !hasExtension;
}

/**
 * Safely execute a command without shell injection vulnerabilities
 * Uses execFile instead of exec to prevent shell interpretation
 *
 * On Windows, batch files and commands without extensions are handled
 * by enabling shell mode, since execFile cannot directly execute them.
 *
 * @param command - The command to execute
 * @param args - Arguments to pass to the command
 * @param cwd - Working directory for the command
 * @param options - Additional options (input for stdin, timeout for timeout, env for environment)
 */
export async function execFileNoThrow(
	command: string,
	args: string[] = [],
	cwd?: string,
	options?: ExecOptions | NodeJS.ProcessEnv
): Promise<ExecResult> {
	// Handle backward compatibility: options can be env (old signature) or ExecOptions (new)
	let env: NodeJS.ProcessEnv | undefined;
	let input: string | undefined;
	let timeout: number | undefined;

	if (options) {
		if ('input' in options || 'timeout' in options || 'env' in options) {
			// New signature with ExecOptions
			const opts = options as ExecOptions;
			input = opts.input;
			timeout = opts.timeout;
			env = opts.env;
		} else {
			// Old signature with just env
			env = options as NodeJS.ProcessEnv;
		}
	}

	// If input is provided, use spawn instead of execFile to write to stdin
	if (input !== undefined) {
		return execFileWithInput(command, args, cwd, input, timeout);
	}

	const effectiveTimeout = getEffectiveTimeout(command, timeout);

	try {
		// On Windows, some commands need shell execution
		// This is safe because we're executing a specific file path, not user input
		const isWindows = process.platform === 'win32';
		const useShell = isWindows && needsWindowsShell(command);

		const execPromise = execFileAsync(command, args, {
			cwd,
			env,
			encoding: 'utf8',
			maxBuffer: EXEC_MAX_BUFFER,
			shell: useShell,
			timeout: effectiveTimeout,
		});

		const { stdout, stderr } = await execPromise;

		return {
			stdout,
			stderr,
			exitCode: 0,
		};
	} catch (error: any) {
		// Check if it's a timeout error
		const isTimeout = error?.code === 'ETIMEDOUT' || error?.killed === true;

		if (isTimeout) {
			// Log timeout
			console.error(`[execFile] Command "${command}" timed out after ${effectiveTimeout}ms`);
			return {
				stdout: error.stdout || '',
				stderr: error.stderr || '',
				exitCode: createErrorContext(error, true),
			};
		}

		// Check for spawn/exec errors (command not found, permission denied, etc.)
		if (typeof error?.code === 'string' && ['ENOENT', 'EACCES', 'EPERM'].includes(error.code)) {
			return {
				stdout: error.stdout || '',
				stderr: error.stderr || error.message || '',
				exitCode: createErrorContext(error),
			};
		}

		// Normal exit code error (process ran but exited with non-zero code)
		// Use ?? instead of || to correctly handle exit code 0 (which is falsy but valid)
		const exitCode = error.code ?? error.status ?? 1;
		return {
			stdout: error.stdout || '',
			stderr: error.stderr || error.message || '',
			exitCode: typeof exitCode === 'number' ? exitCode : 1,
		};
	}
}

/**
 * Execute a command with input written to stdin
 * Uses spawn to allow writing to the process stdin
 */
async function execFileWithInput(
	command: string,
	args: string[],
	cwd: string | undefined,
	input: string,
	timeout?: number
): Promise<ExecResult> {
	const effectiveTimeout = getEffectiveTimeout(command, timeout);

	return new Promise((resolve) => {
		const isWindows = process.platform === 'win32';
		const useShell = isWindows && needsWindowsShell(command);

		const child = spawn(command, args, {
			cwd,
			shell: useShell,
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';
		let timeoutHandle: NodeJS.Timeout | null = null;
		let isResolved = false;

		// Set up timeout
		if (effectiveTimeout > 0) {
			timeoutHandle = setTimeout(() => {
				if (!isResolved) {
					isResolved = true;
					console.error(`[execFile] Command "${command}" timed out after ${effectiveTimeout}ms`);
					child.kill('SIGTERM');
					resolve({
						stdout,
						stderr,
						exitCode: createErrorContext({ code: 'ETIMEDOUT' }, true),
					});
				}
			}, effectiveTimeout);
		}

		child.stdout?.on('data', (data) => {
			stdout += data.toString();
		});

		child.stderr?.on('data', (data) => {
			stderr += data.toString();
		});

		child.on('close', (code) => {
			if (!isResolved) {
				isResolved = true;
				if (timeoutHandle) {
					clearTimeout(timeoutHandle);
				}
				resolve({
					stdout,
					stderr,
					exitCode: code ?? 1,
				});
			}
		});

		child.on('error', (err) => {
			if (!isResolved) {
				isResolved = true;
				if (timeoutHandle) {
					clearTimeout(timeoutHandle);
				}

				// Check if it's a spawn error
				const anyErr = err as any;
				if (
					typeof anyErr?.code === 'string' &&
					['ENOENT', 'EACCES', 'EPERM'].includes(anyErr.code)
				) {
					resolve({
						stdout: '',
						stderr: anyErr.message,
						exitCode: createErrorContext(anyErr),
					});
				} else {
					resolve({
						stdout: '',
						stderr: anyErr.message,
						exitCode: 1,
					});
				}
			}
		});

		// Write input to stdin and close it
		if (child.stdin) {
			child.stdin.write(input);
			child.stdin.end();
		}
	});
}
