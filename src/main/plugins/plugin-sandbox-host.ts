/**
 * Plugin sandbox host (main process).
 *
 * Forks one Electron utilityProcess per running tier-1 plugin (process + crash
 * isolation), ships the plugin's entry code into the confined child, and is the
 * ONLY path the child can affect the host: every HostRequest is authorized by
 * the permission broker (default deny) before an injected handler executes it.
 *
 * The host treats the child as hostile: it validates the method and request
 * shape, caps message size, and never evaluates anything the child sends. A
 * crashed or misbehaving child is isolated to itself; stop()/stopAll() tear
 * children down (graceful shutdown message, then hard kill after a grace).
 */

import { utilityProcess, type UtilityProcess } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { PermissionBroker } from './permission-broker';
import {
	isHostMethod,
	type HostMethod,
	type HostRequest,
	type HostResponse,
	type ToolResult,
} from '../../shared/plugins/rpc-protocol';
import type { PluginEvent } from '../../shared/plugins/events';
import {
	PluginToolRunIdentity,
	type PluginToolInvocationContext,
	type PluginToolCallerContext,
} from './plugin-tool-run-identity';
import { ImapConnectionError } from './mail-imap-connection';

export interface SandboxControlEvent {
	topic: string;
	at: string;
	payload: unknown;
}

/** An injected implementation of one host method. Receives the calling plugin
 * id (for per-plugin scoping) and the validated params. */
export type HostCallHandler = (pluginId: string, params: unknown) => Promise<unknown>;
export type HostCallHandlers = Partial<Record<HostMethod, HostCallHandler>>;

export interface PluginSandboxHostDeps {
	broker: PermissionBroker;
	handlers: HostCallHandlers;
	/** Host-private verified tool path. Both dependencies are mandatory for that path. */
	toolIdentity?: PluginToolRunIdentity;
	/** Recheck exact plugin identity/consent/feature generation; never supplied by a child. */
	assertToolPluginActive?: (pluginId: string) => void;
	/** Forward plugin console/log lines somewhere visible. */
	onLog?: (pluginId: string, level: string, message: string) => void;
	/** Notified when a child exits unexpectedly (non-zero / crash). */
	onCrash?: (pluginId: string, code: number) => void;
	/** Notified when a plugin is stopped ON PURPOSE (disable/uninstall/reload/
	 * quit), BEFORE the shutdown message is posted - so intentional stops can
	 * be distinguished from crashes by exit-time observers (e.g. the background
	 * supervisor clears registrations here and never restarts on the exit). */
	onStop?: (pluginId: string) => void;
}

/** One bounded recent-log entry observed for a running plugin. */
export interface ActivityLogLine {
	level: string;
	message: string;
	/** Epoch ms when the line was observed. */
	at: number;
}

/**
 * Read-only observability snapshot for one plugin (running tier-1). Pure data,
 * safe to serialize across IPC; produced by {@link PluginSandboxHost.getActivity}.
 */
export interface ActivitySnapshot {
	/** Total host calls dispatched to a handler for this plugin (cumulative). */
	totalCalls: number;
	/** Host calls currently executing. */
	inFlight: number;
	/** Highest concurrent in-flight count observed. */
	peakInFlight: number;
	/** Epoch ms of the last observed activity (host call or log line). */
	lastActivity: number;
	/** Times this plugin's child exited non-zero since the host started. */
	crashCount: number;
	/** Bounded ring buffer (oldest first) of the most recent log lines. */
	recentLogs: ActivityLogLine[];
}

/** Hard cap on a single RPC message to bound memory from a hostile child. */
const MAX_MESSAGE_BYTES = 1_000_000;
/** Grace period between a graceful shutdown message and a hard kill. */
const SHUTDOWN_GRACE_MS = 2000;
/** Max concurrent in-flight host calls per plugin (backpressure). */
const MAX_IN_FLIGHT = 32;
/** Sliding-window rate limit: max requests per window per plugin. */
const RATE_WINDOW_MS = 1000;
const RATE_MAX_PER_WINDOW = 200;
/** Bounded ring-buffer size for per-plugin recent log lines (observability). */
const ACTIVITY_LOG_LIMIT = 50;
/** How long the host waits for a child's `toolResult` before rejecting. */
const TOOL_INVOKE_TIMEOUT_MS = 30_000;
/** Max concurrent in-flight tool invocations per plugin (bounds the pending map
 *  against a stuck/hostile child that never replies). */
const MAX_PENDING_TOOLS = 64;

/** One outstanding `invokeTool` round-trip awaiting the child's `toolResult`. */
interface PendingTool {
	resolve: (value: unknown) => void;
	reject: (err: Error) => void;
	timer: NodeJS.Timeout;
}

interface RunningPlugin {
	proc: UtilityProcess;
	/** Stops invocation authority synchronously, before shutdown/exit callbacks. */
	lifetime: AbortController;
	shutdownTimer?: NodeJS.Timeout;
	inFlight: number;
	windowStart: number;
	windowCount: number;
	/** Outstanding tool invocations keyed by correlation id. */
	pendingTools: Map<number, PendingTool>;
	/** Monotonic correlation id for the next tool invocation. */
	nextToolId: number;
}

/** Mutable per-plugin observability accumulator. Kept separate from `running`
 *  so a crash count outlives the child that produced it. */
interface Activity {
	totalCalls: number;
	inFlight: number;
	peakInFlight: number;
	lastActivity: number;
	crashCount: number;
	recentLogs: ActivityLogLine[];
}

/** Project a mutable accumulator into a serializable read-only snapshot. */
function toActivitySnapshot(a: Activity): ActivitySnapshot {
	return {
		totalCalls: a.totalCalls,
		inFlight: a.inFlight,
		peakInFlight: a.peakInFlight,
		lastActivity: a.lastActivity,
		crashCount: a.crashCount,
		recentLogs: a.recentLogs.map((l) => ({ ...l })),
	};
}

export class PluginSandboxHost {
	private readonly toolIdentity?: PluginToolRunIdentity;
	private readonly assertToolPluginActive?: (pluginId: string) => void;
	private running = new Map<string, RunningPlugin>();
	/** Per-plugin observability, keyed by plugin id. Separate from `running` so
	 *  it survives a crashed child (crash counts must persist). */
	private activity = new Map<string, Activity>();

	constructor(private readonly deps: PluginSandboxHostDeps) {
		this.toolIdentity = deps.toolIdentity;
		this.assertToolPluginActive =
			typeof deps.assertToolPluginActive === 'function'
				? deps.assertToolPluginActive.bind(deps)
				: undefined;
	}

	isRunning(pluginId: string): boolean {
		return this.running.has(pluginId);
	}

	/** Host-private exact-child assertion; conveys no run/account authority. */
	captureToolLifetime(pluginId: string): () => void {
		const record = this.running.get(pluginId);
		return () => {
			if (!record || this.running.get(pluginId) !== record || record.lifetime.signal.aborted)
				throw new ImapConnectionError('MAIL_DENIED');
		};
	}

	runningIds(): string[] {
		return [...this.running.keys()];
	}

	/**
	 * Read-only observability for plugins (running tier-1). With no argument,
	 * returns a snapshot map keyed by plugin id; with an id, returns that
	 * plugin's snapshot (or undefined). Snapshots are copies, so mutating them
	 * never affects host state and the ring buffer is safe to serialize.
	 */
	getActivity(): Record<string, ActivitySnapshot>;
	getActivity(pluginId: string): ActivitySnapshot | undefined;
	getActivity(pluginId?: string): Record<string, ActivitySnapshot> | ActivitySnapshot | undefined {
		if (typeof pluginId === 'string') {
			const a = this.activity.get(pluginId);
			return a ? toActivitySnapshot(a) : undefined;
		}
		const out: Record<string, ActivitySnapshot> = {};
		for (const [id, a] of this.activity) out[id] = toActivitySnapshot(a);
		return out;
	}

	/** Get-or-create the observability accumulator for a plugin. */
	private activityFor(pluginId: string): Activity {
		let a = this.activity.get(pluginId);
		if (!a) {
			a = {
				totalCalls: 0,
				inFlight: 0,
				peakInFlight: 0,
				lastActivity: Date.now(),
				crashCount: 0,
				recentLogs: [],
			};
			this.activity.set(pluginId, a);
		}
		return a;
	}

	/** Append a log line to a plugin's bounded ring buffer and bump activity. */
	private recordLog(pluginId: string, level: string, message: string): void {
		const a = this.activityFor(pluginId);
		const now = Date.now();
		a.recentLogs.push({ level, message, at: now });
		if (a.recentLogs.length > ACTIVITY_LOG_LIMIT) a.recentLogs.shift();
		a.lastActivity = now;
	}

	/**
	 * Start a plugin: read its entry code from disk and fork the confined sandbox
	 * child with that code. No-op if already running. Throws if the entry file
	 * cannot be read (caller decides how to surface it).
	 */
	start(pluginId: string, pluginDir: string, entryRelPath: string): void {
		if (this.running.has(pluginId)) return;

		// Resolve and confine the entry path inside the plugin dir (defense in
		// depth; the manifest validator already rejects traversal).
		const resolvedDir = path.resolve(pluginDir);
		const entryAbs = path.resolve(resolvedDir, entryRelPath);
		if (entryAbs !== resolvedDir && !entryAbs.startsWith(resolvedDir + path.sep)) {
			throw new Error(`entry path escapes plugin directory: ${entryRelPath}`);
		}
		const entryCode = fs.readFileSync(entryAbs, 'utf-8');

		const sandboxModule = path.join(__dirname, 'plugin-sandbox-entry.js');
		const proc = utilityProcess.fork(sandboxModule, [], {
			serviceName: `maestro-plugin-${pluginId}`,
			// No extra env: the child should not inherit Maestro secrets.
			env: {},
		});

		const record: RunningPlugin = {
			proc,
			lifetime: new AbortController(),
			inFlight: 0,
			windowStart: Date.now(),
			windowCount: 0,
			pendingTools: new Map(),
			nextToolId: 1,
		};
		this.running.set(pluginId, record);
		// Ensure an observability record exists so a freshly started plugin shows
		// up in getActivity() even before it makes its first host call.
		this.activityFor(pluginId).lastActivity = Date.now();

		proc.on('message', (data: unknown) => {
			void this.handleChildMessage(pluginId, proc, data);
		});
		proc.on('exit', (code: number) => {
			if (record.shutdownTimer) clearTimeout(record.shutdownTimer);
			record.lifetime.abort();
			this.rejectPendingTools(record, 'plugin exited before returning a tool result');
			// An old child's delayed exit must never remove a replacement sandbox.
			if (this.running.get(pluginId) !== record) return;
			this.running.delete(pluginId);
			const act = this.activity.get(pluginId);
			if (act) act.inFlight = 0;
			if (code !== 0) {
				if (act) act.crashCount += 1;
				logger.warn(`[Plugins] sandbox "${pluginId}" exited with code ${code}`, '[Plugins]');
				this.deps.onCrash?.(pluginId, code);
			}
		});

		proc.postMessage({ kind: 'init', pluginId, entryCode });
	}

	/**
	 * Dispatch a command into a running plugin's sandbox. The local command id
	 * (the part after `<pluginId>/`) is sent; the plugin's registered handler
	 * runs. No-op (returns false) if the plugin is not running.
	 */
	invokeCommand(pluginId: string, commandId: string, args?: unknown): boolean {
		const record = this.running.get(pluginId);
		if (!record) return false;
		// Cap the host->child payload the same way HostRequest params are bounded:
		// a non-serializable or oversized args object is dropped, never posted.
		let serialized: string;
		try {
			serialized = JSON.stringify(args ?? null);
		} catch {
			return false;
		}
		if (serialized.length > MAX_MESSAGE_BYTES) return false;
		try {
			record.proc.postMessage({ kind: 'invokeCommand', commandId, args });
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Invoke a tool in a running plugin's sandbox and await its result. Unlike
	 * {@link invokeCommand} (fire-and-forget), this is a brokered request/response
	 * round-trip: a correlation id is assigned, an `invokeTool` control message is
	 * posted to the child, and the returned promise settles when the matching
	 * `toolResult` arrives (resolve `result` / reject `error`). Rejects if the
	 * plugin is not running, the args cannot be serialized or exceed the size cap,
	 * too many tool calls are already in flight, the round-trip exceeds
	 * {@link TOOL_INVOKE_TIMEOUT_MS}, or the child exits before replying.
	 * A fourth, host-private registry-issued run context enables a nested handle.
	 * The verified manager supplies it; production issuance remains unwired.
	 * Args never confer caller authority, and an explicit invalid context denies.
	 */
	invokeTool(
		pluginId: string,
		commandId: string,
		args?: unknown,
		runContext?: unknown
	): Promise<unknown> {
		const record = this.running.get(pluginId);
		const verified = arguments.length >= 4;
		if (!record && !verified)
			return Promise.reject(new Error(`plugin "${pluginId}" is not running`));
		const identity = this.toolIdentity;
		const assertPlugin = this.assertToolPluginActive;
		let handle: string | undefined;
		let invocation: PluginToolInvocationContext | undefined;
		let checkRun: (() => void) | undefined;
		let capturedArgs: unknown;
		const assertSandbox = this.captureToolLifetime(pluginId);
		const safeError = (error: unknown): Error =>
			verified
				? new ImapConnectionError(error instanceof ImapConnectionError ? error.code : 'MAIL_DENIED')
				: error instanceof Error
					? error
					: new Error('tool invocation failed');
		try {
			assertSandbox();
			// Serialize once: getters/toJSON cannot change the posted args after admission.
			let serialized: string | undefined;
			try {
				serialized = JSON.stringify(args ?? null);
			} catch {
				throw new Error('tool args are not serializable');
			}
			if (typeof serialized !== 'string') throw new Error('tool args are not serializable');
			if (serialized.length > MAX_MESSAGE_BYTES) throw new Error('tool args exceed size limit');
			capturedArgs = JSON.parse(serialized);
			assertSandbox();
			if (verified) {
				if (!(identity instanceof PluginToolRunIdentity) || typeof assertPlugin !== 'function')
					throw new ImapConnectionError('MAIL_DENIED');
				handle = identity.issueInvocation(runContext, pluginId, {
					signal: record!.lifetime.signal,
					assertActive: () => {
						assertSandbox();
						assertPlugin(pluginId);
						assertSandbox();
					},
				});
				invocation = identity.resolveInvocation(pluginId, handle);
				// issueInvocation proved exact frozen context membership, not structural shape.
				checkRun = (runContext as PluginToolCallerContext).assertActive;
			}
			assertSandbox();
			if (record!.pendingTools.size >= MAX_PENDING_TOOLS)
				throw new Error('too many concurrent tool invocations');
			if (!Number.isSafeInteger(record!.nextToolId) || record!.nextToolId < 1)
				throw new Error('tool correlation limit exceeded');
		} catch (error) {
			if (handle) identity?.releaseInvocation(handle);
			return Promise.reject(safeError(error));
		}
		// Admission proved this exact record, rechecked after all host callbacks.
		const running = record!;
		const id = running.nextToolId++;
		return new Promise<unknown>((resolve, reject) => {
			let settled = false;
			const cleanup = () => {
				settled = true;
				running.pendingTools.delete(id);
				clearTimeout(timer);
				invocation?.signal.removeEventListener('abort', onAbort);
				if (handle) identity?.releaseInvocation(handle);
			};
			const fail = (error: unknown) => {
				if (settled) return;
				cleanup();
				reject(safeError(error));
			};
			const onAbort = () => fail(new ImapConnectionError('MAIL_CANCELED'));
			const timer = setTimeout(() => {
				fail(
					verified
						? new ImapConnectionError('MAIL_TIMEOUT')
						: new Error(`tool "${commandId}" timed out after ${TOOL_INVOKE_TIMEOUT_MS}ms`)
				);
			}, TOOL_INVOKE_TIMEOUT_MS);
			if (typeof timer.unref === 'function') timer.unref();
			running.pendingTools.set(id, {
				timer,
				reject: fail,
				resolve: (value) => {
					if (settled) return;
					try {
						assertSandbox();
						invocation?.assertActive();
						assertSandbox();
						// Verified completion is bounded before releasing the nested lifetime.
						// Snapshot once; any serialization callbacks are followed by live checks.
						if (verified) {
							const serialized = JSON.stringify(value === undefined ? null : value);
							if (typeof serialized !== 'string') throw new ImapConnectionError('MAIL_INVALID');
							if (serialized.length > MAX_MESSAGE_BYTES)
								throw new ImapConnectionError('MAIL_LIMIT');
							value = JSON.parse(serialized);
							invocation!.assertActive();
							assertSandbox();
						}
						if (settled) return; // Reentrant authority callback canceled this call.
						cleanup();
						// Releasing a handle aborts retained nested contexts and may reenter host code.
						checkRun?.();
						if (verified) assertPlugin!(pluginId);
						assertSandbox();
						checkRun?.();
						assertSandbox();
						resolve(value);
					} catch (error) {
						if (settled) reject(safeError(error));
						else fail(error);
					}
				},
			});
			invocation?.signal.addEventListener('abort', onAbort, { once: true });
			try {
				assertSandbox();
				invocation?.assertActive();
				assertSandbox();
				if (invocation?.signal.aborted) onAbort();
				if (settled) return;
				running.proc.postMessage({
					kind: 'invokeTool',
					id,
					commandId,
					args: capturedArgs,
					...(handle ? { invocationId: handle } : {}),
				});
			} catch (error) {
				fail(error);
			}
		});
	}

	/** Reject and clear every outstanding tool round-trip for a plugin (called
	 *  when the child exits so awaiting callers never hang). */
	private rejectPendingTools(record: RunningPlugin, reason: string): void {
		for (const pending of [...record.pendingTools.values()]) {
			clearTimeout(pending.timer);
			pending.reject(new Error(reason));
		}
		record.pendingTools.clear();
	}

	/**
	 * Push a host event into a running plugin's sandbox (the event-bus sink).
	 * Sends the metadata-only `{ kind:'event', topic, at, payload }` control
	 * message and applies the SAME hostile-child posture as every other path:
	 * it never hands the child a handle, only a structured-clone message, and
	 * swallows post failures (a dead/gone child just yields false so the bus can
	 * prune the subscription). No-op (returns false) when the plugin is not
	 * running. Re-authorization happens in the bus BEFORE this is ever called.
	 */
	pushEvent(pluginId: string, event: PluginEvent | SandboxControlEvent): boolean {
		const record = this.running.get(pluginId);
		if (!record) return false;
		try {
			record.proc.postMessage({
				kind: 'event',
				topic: event.topic,
				at: event.at,
				payload: event.payload,
			});
			return true;
		} catch {
			return false;
		}
	}

	/** Stop a plugin: ask it to shut down, then hard-kill after a grace period. */
	stop(pluginId: string): void {
		const record = this.running.get(pluginId);
		if (!record || record.lifetime.signal.aborted) return;
		record.lifetime.abort();
		this.rejectPendingTools(record, 'plugin stopped before returning a tool result');
		this.deps.onStop?.(pluginId);
		try {
			record.proc.postMessage({ kind: 'shutdown' });
		} catch {
			// Child may already be gone; fall through to kill.
		}
		record.shutdownTimer = setTimeout(() => {
			try {
				record.proc.kill();
			} catch {
				// Already dead.
			}
		}, SHUTDOWN_GRACE_MS);
	}

	/** Stop every running plugin (app shutdown / feature disable). */
	stopAll(): void {
		for (const id of this.runningIds()) this.stop(id);
	}

	/** Authorize and execute one host request from a child. */
	private async handleChildMessage(
		pluginId: string,
		proc: UtilityProcess,
		data: unknown
	): Promise<void> {
		const current = this.running.get(pluginId);
		if (!current || current.proc !== proc || current.lifetime.signal.aborted) return;
		if (typeof data !== 'object' || data === null) return;
		const msg = data as Record<string, unknown>;

		// Child log line (not a host call).
		if (msg.kind === 'log') {
			const level = String(msg.level ?? 'info');
			const message = String(msg.message ?? '');
			this.recordLog(pluginId, level, message);
			this.deps.onLog?.(pluginId, level, message);
			return;
		}

		// Child reply to one of our outstanding invokeTool round-trips.
		if (msg.kind === 'toolResult') {
			this.handleToolResult(pluginId, msg as unknown as ToolResult);
			return;
		}

		// Must be a HostRequest.
		if (typeof msg.id !== 'number' || !isHostMethod(msg.method)) return;
		const request = msg as unknown as HostRequest;

		const respond = (res: Omit<HostResponse, 'id'>): void => {
			try {
				proc.postMessage({ id: request.id, ...res });
			} catch {
				// Child gone; nothing to do.
			}
		};

		// Backpressure + rate limiting against a flooding child.
		const record = this.running.get(pluginId);
		if (record) {
			const now = Date.now();
			if (now - record.windowStart > RATE_WINDOW_MS) {
				record.windowStart = now;
				record.windowCount = 0;
			}
			record.windowCount += 1;
			if (record.inFlight >= MAX_IN_FLIGHT) {
				respond({ ok: false, error: 'too many concurrent host calls' });
				return;
			}
			if (record.windowCount > RATE_MAX_PER_WINDOW) {
				respond({ ok: false, error: 'host call rate limit exceeded' });
				return;
			}
		}

		// Bound message size from a hostile child.
		let serializedSize = 0;
		try {
			serializedSize = JSON.stringify(request.params ?? null).length;
		} catch {
			respond({ ok: false, error: 'params are not serializable' });
			return;
		}
		if (serializedSize > MAX_MESSAGE_BYTES) {
			respond({ ok: false, error: 'request params exceed size limit' });
			return;
		}

		const method = request.method;
		const decision = this.deps.broker.authorize(pluginId, method, request.params);
		if (!decision.allowed) {
			respond({ ok: false, error: decision.reason ?? 'permission denied' });
			return;
		}

		const handler = this.deps.handlers[method];
		if (!handler) {
			respond({ ok: false, error: `host method ${method} is not implemented` });
			return;
		}

		if (record) record.inFlight += 1;
		const act = this.activityFor(pluginId);
		act.totalCalls += 1;
		act.inFlight += 1;
		act.lastActivity = Date.now();
		if (act.inFlight > act.peakInFlight) act.peakInFlight = act.inFlight;
		try {
			const result = await handler(pluginId, request.params);
			respond({ ok: true, result });
		} catch (err) {
			respond({ ok: false, error: err instanceof Error ? err.message : String(err) });
		} finally {
			if (record) record.inFlight = Math.max(0, record.inFlight - 1);
			act.inFlight = Math.max(0, act.inFlight - 1);
		}
	}

	/** Correlate a child's `toolResult` to its pending round-trip and settle it.
	 *  Ignored when the plugin/id is unknown (late reply after timeout/exit). */
	private handleToolResult(pluginId: string, res: ToolResult): void {
		const record = this.running.get(pluginId);
		if (!record) return;
		if (typeof res.id !== 'number') return;
		const pending = record.pendingTools.get(res.id);
		if (!pending) return;
		record.pendingTools.delete(res.id);
		clearTimeout(pending.timer);
		if (res.ok === true) {
			pending.resolve(res.result);
		} else {
			pending.reject(
				new Error(typeof res.error === 'string' ? res.error : 'tool invocation failed')
			);
		}
	}
}
