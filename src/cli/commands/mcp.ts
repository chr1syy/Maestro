/**
 * `maestro-cli mcp serve` - an MCP stdio server that exposes the running app's
 * registered plugin tools to an agent's model.
 *
 * An agent (claude/codex/opencode/...) launches this as a subprocess and speaks
 * MCP over its stdin/stdout. We bridge `tools/list` / `tools/call` to the desktop
 * app over the existing CLI WebSocket, where each call is risk-gated before the
 * broker invokes the plugin handler.
 *
 * Wire discipline (MCP stdio, 2025-06-18 spec): messages are newline-delimited
 * JSON, one per line, no embedded newlines. stdout carries ONLY MCP messages; all
 * diagnostics go to stderr. The framing lives here; the protocol + app bridge are
 * in `mcp-protocol.ts` / `mcp-bridge.ts`.
 */
import { MaestroClient } from '../services/maestro-client';
import { createMcpBridge } from '../services/mcp-bridge';
import * as fs from 'fs';
import * as path from 'path';
import { PLUGIN_RUN_TOKEN_FILE_ENV } from '../../shared/plugins/mcp-agent-config';

interface McpServeOptions {
	/** Originating desktop tab id - diagnostics only. */
	tab?: string;
}

/** Read one bounded private file, never a raw env token or a model argument.
 * Invalid configured delivery is a denial sentinel, not anonymous fallback.
 * The host issuer owns deletion/revocation; this process only closes its fd. */
function readRunProof(): string | null | undefined {
	const file = process.env[PLUGIN_RUN_TOKEN_FILE_ENV];
	delete process.env[PLUGIN_RUN_TOKEN_FILE_ENV];
	// Empty is the config adapter's explicit ordinary-tools sentinel.
	if (file === undefined || file === '') return undefined;
	let fd: number | undefined;
	const bytes = Buffer.alloc(65);
	try {
		if (!path.isAbsolute(file) || fs.realpathSync(file) !== file) return null;
		const before = fs.lstatSync(file);
		fd = fs.openSync(
			file,
			fs.constants.O_RDONLY | fs.constants.O_NONBLOCK | (fs.constants.O_NOFOLLOW ?? 0)
		);
		const stat = fs.fstatSync(fd);
		if (
			!before.isFile() ||
			!stat.isFile() ||
			stat.dev !== before.dev ||
			stat.ino !== before.ino ||
			stat.nlink !== 1 ||
			stat.size !== 64
		)
			return null;
		// Windows ACL enforcement belongs to the host issuer; POSIX must be 0600
		// and owned by this user. This never establishes registry authority.
		if (
			process.platform !== 'win32' &&
			((stat.mode & 0o777) !== 0o600 ||
				typeof process.getuid !== 'function' ||
				stat.uid !== process.getuid())
		)
			return null;
		const length = fs.readSync(fd, bytes, 0, bytes.length, 0);
		const after = fs.fstatSync(fd);
		const current = fs.lstatSync(file);
		if (
			length !== 64 ||
			after.size !== 64 ||
			after.mtimeMs !== stat.mtimeMs ||
			after.ctimeMs !== stat.ctimeMs ||
			!current.isFile() ||
			current.dev !== stat.dev ||
			current.ino !== stat.ino
		)
			return null;
		const token = bytes.subarray(0, 64).toString('ascii');
		// Check bytes too: ASCII conversion alone masks the high bit.
		if (bytes.subarray(0, 64).some((byte) => byte > 0x7f) || !/^[0-9a-f]{64}$/.test(token))
			return null;
		return token;
	} catch {
		return null;
	} finally {
		bytes.fill(0);
		if (fd !== undefined) {
			try {
				fs.closeSync(fd);
			} catch {
				/* Never log file errors or retry opening a different path. */
			}
		}
	}
}

export async function mcpServe(options: McpServeOptions): Promise<void> {
	// stderr is the ONLY log channel; stdout is reserved for MCP messages.
	const log = (msg: string): void => {
		process.stderr.write(`${msg}\n`);
	};

	if (options.tab) log(`[mcp] serving plugin tools for tab ${options.tab}`);

	const runToken = readRunProof();
	const client = new MaestroClient();
	try {
		await client.connect();
	} catch {
		// Serve anyway: the agent's MCP handshake should still succeed; tools/list
		// will report zero tools until the app is reachable.
		log('[mcp] not connected to Maestro');
	}

	const { server } = createMcpBridge({
		serverInfo: { name: 'maestro-plugins', version: '1.0.0' },
		...(runToken !== undefined ? { runToken } : {}),
		request: (message, responseType, timeoutMs) =>
			client.sendCommand(message, responseType, timeoutMs),
		log,
	});

	// Newline-delimited JSON-RPC read loop.
	let buffer = '';
	process.stdin.setEncoding('utf8');

	const handleLine = (line: string): void => {
		const trimmed = line.trim();
		if (!trimmed) return;
		let parsed: unknown;
		try {
			parsed = JSON.parse(trimmed);
		} catch {
			// Malformed JSON-RPC frame: per the spec, answer with a Parse Error
			// (id null) rather than silently dropping it, which can hang clients.
			log('[mcp] malformed JSON-RPC frame on stdin');
			const parseError = {
				jsonrpc: '2.0',
				id: null,
				error: { code: -32700, message: 'Parse error' },
			};
			process.stdout.write(`${JSON.stringify(parseError)}\n`);
			return;
		}
		void server
			.handleMessage(parsed)
			.then((response) => {
				if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
			})
			.catch(() => log('[mcp] handler error'));
	};

	process.stdin.on('data', (chunk: string) => {
		buffer += chunk;
		let nl = buffer.indexOf('\n');
		while (nl >= 0) {
			const line = buffer.slice(0, nl);
			buffer = buffer.slice(nl + 1);
			handleLine(line);
			nl = buffer.indexOf('\n');
		}
	});

	// Resolve when the client closes stdin (subprocess teardown).
	await new Promise<void>((resolve) => {
		process.stdin.on('end', () => {
			client.disconnect();
			resolve();
		});
		process.stdin.on('close', () => {
			client.disconnect();
			resolve();
		});
	});
}
