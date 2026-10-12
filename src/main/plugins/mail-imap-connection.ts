/**
 * Host-only bounded IMAPS session. Not wired to production, RPC or SDK.
 * The account service must supply live authorization; no grants or secret store here.
 */
import * as net from 'net';
import * as tls from 'tls';
import { assertMailActivityAuthority } from './mail-account-activity';
import { createEgressGuard, type EgressGuardDeps, type GuardedLookup } from './net-egress-guard';
import { ImapFramingError, ImapResponseDecoder, type ImapResponseFrame } from './mail-imap-framing';
import { mailList, mailRecord } from './mail-account-config';
import {
	assertImapUid,
	prepareImapCommand,
	validateImapCommandResult,
	eraseImapFrameLiterals,
	type FixedImapCommand,
	type ImapCommandResult,
} from './mail-imap-commands';

export const IMAP_CONNECTION_LIMITS = Object.freeze({ connectMs: 10_000, lifetimeMs: 30_000 });
export const IMAP_SESSION_LIMITS = Object.freeze({ socketsPerPlugin: 4, commands: 64 });
// Admission is shared by all callers; no work queue or background dispatch engine.
const activeAccounts = new Set<string>();
const activePlugins = new Map<string, number>();

export interface ConfiguredImapEndpoint {
	readonly host: string;
	readonly port: number;
	readonly tls: true;
	/** Trusted setup must explicitly opt in to a port other than 993. */
	readonly allowNonstandardPort?: boolean;
}

export interface ImapConnectionDeps extends Pick<EgressGuardDeps, 'resolve' | 'blockedPorts'> {
	/** Host-bound ownership, never taken from plugin/tool arguments. */
	pluginId: string;
	/** Synchronous generation/grant check; throws to deny. No permissive default. */
	assertActive(): void;
	/** Host configuration only; missing, disabled or corrupt accounts return null. */
	getEndpoint(accountId: string): ConfiguredImapEndpoint | null;
	/** Host test seam only. Production uses tls.connect with these exact options. */
	connect?: (options: tls.ConnectionOptions) => tls.TLSSocket;
}

export interface ImapConnectionOptions {
	signal?: AbortSignal;
	/** Tighten-only deadlines from admission: DNS/TLS/greeting/LOGIN and total lifetime. */
	connectMs?: number;
	lifetimeMs?: number;
}

type ConnectionErrorCode =
	| 'MAIL_DENIED'
	| 'MAIL_INVALID'
	| 'MAIL_STALE'
	| 'MAIL_UNAVAILABLE'
	| 'MAIL_TIMEOUT'
	| 'MAIL_CANCELED'
	| 'MAIL_PROTOCOL'
	| 'MAIL_LIMIT';

/** Fixed content-free errors. Never carry a peer error, cause or account config. */
export class ImapConnectionError extends Error {
	constructor(readonly code: ConnectionErrorCode) {
		const messages: Record<ConnectionErrorCode, string> = {
			MAIL_DENIED: 'Mail access denied.',
			MAIL_INVALID: 'Invalid mail request.',
			MAIL_STALE: 'Mail reference is no longer valid.',
			MAIL_UNAVAILABLE: 'Mail service unavailable.',
			MAIL_TIMEOUT: 'Mail request timed out.',
			MAIL_CANCELED: 'Mail request canceled.',
			MAIL_PROTOCOL: 'Unsupported or invalid mail response.',
			MAIL_LIMIT: 'Mail request exceeds a limit.',
		};
		super(messages[code]);
		this.name = 'ImapConnectionError';
	}
}

/** Internal session seam only: no raw socket, prepared byte buffer or arbitrary write. */
export interface ImapConnection {
	/** LOGIN first; SEARCH/FETCH require the selected mailbox's exact UIDVALIDITY. */
	execute(command: FixedImapCommand, expectedUidValidity?: string): Promise<ImapCommandResult>;
	/** Check terminal state and the supplied live host authorization. */
	assertActive(): void;
	/** Terminal, idempotent; destroys socket and clears pending decoder bytes. */
	close(): void;
}

export interface ImapSessionStep {
	readonly command: FixedImapCommand;
	readonly expectedUidValidity?: string;
}

/** Run one bounded host plan, erase results on failure, close on every completion. */
export async function runConfiguredImapSession(
	accountId: string,
	deps: ImapConnectionDeps,
	steps: readonly ImapSessionStep[],
	options: ImapConnectionOptions = {}
): Promise<ImapCommandResult[]> {
	const plan = captureImapSessionPlan(steps);
	const captured = captureImapConnection(deps, options);
	const { session, assertCompletion } = await openCapturedImapConnection(accountId, captured);
	const results: ImapCommandResult[] = [];
	try {
		for (const step of plan) {
			const logout = step.command.kind === 'logout';
			results.push(await session.execute(step.command, step.expectedUidValidity));
			// LOGOUT closes as part of its validated completion; it must be last.
			if (!logout) session.assertActive();
		}
		// Destroy may run synchronous host callbacks. Keep results owned until it
		// settles and the original authority/budgets pass, even after final LOGOUT.
		session.close();
		assertCompletion();
		return results;
	} catch (error) {
		for (const result of results) if (result.kind === 'fetch') result.bytes.fill(0);
		throw error instanceof ImapConnectionError ? error : new ImapConnectionError('MAIL_INVALID');
	} finally {
		session.close();
	}
}

/** Own fixed intent before callbacks/awaits; parsing confers no session authority. */
function captureImapSessionPlan(steps: readonly ImapSessionStep[]): readonly ImapSessionStep[] {
	try {
		const values = mailList(steps, IMAP_SESSION_LIMITS.commands);
		if (!values.length) throw new ImapConnectionError('MAIL_INVALID');
		return Object.freeze(
			values.map((value, index) => {
				const step = mailRecord(value, ['command'], ['expectedUidValidity']);
				const command = Object.freeze(
					mailRecord(
						step.command,
						['kind'],
						[
							'username',
							'password',
							'mailbox',
							'fromUid',
							'toUid',
							'text',
							'uid',
							'content',
							'part',
						]
					)
				) as unknown as FixedImapCommand;
				// Canonical grammar/field checks only; never retain validation LOGIN bytes.
				prepareImapCommand(`A${index + 1}`, command).bytes.fill(0);
				const expectedUidValidity = step.expectedUidValidity;
				if (expectedUidValidity !== undefined) assertImapUid(expectedUidValidity);
				if (command.kind === 'logout' && index !== values.length - 1)
					throw new ImapConnectionError('MAIL_INVALID');
				return Object.freeze({ command, expectedUidValidity });
			})
		);
	} catch {
		throw new ImapConnectionError('MAIL_INVALID');
	}
}

/** Canonical configured-endpoint check; DNS/egress still checked at connection time. */
export function validateConfiguredImapEndpoint(
	configured: ConfiguredImapEndpoint
): ConfiguredImapEndpoint {
	try {
		// Copy only trusted connection fields; never spread TLS overrides or secrets.
		const endpoint: ConfiguredImapEndpoint = {
			host: configured.host,
			port: configured.port,
			tls: configured.tls,
			allowNonstandardPort: configured.allowNonstandardPort,
		};
		const { host, port } = endpoint;
		if (
			endpoint.tls !== true ||
			typeof host !== 'string' ||
			host.length > 253 ||
			!host.split('.').every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) ||
			!Number.isInteger(port) ||
			port < 1 ||
			port > 65535 ||
			(port !== 993 && endpoint.allowNonstandardPort !== true)
		)
			throw new ImapConnectionError('MAIL_INVALID');
		const parsed = new URL(`https://${host}:${port}`);
		// Reject literal IPs AND URL-normalized numeric aliases which bypass lookup.
		if (parsed.hostname !== host.toLowerCase() || net.isIP(parsed.hostname) !== 0) {
			throw new ImapConnectionError('MAIL_DENIED');
		}
		return Object.freeze(endpoint);
	} catch (error) {
		throw error instanceof ImapConnectionError ? error : new ImapConnectionError('MAIL_DENIED');
	}
}

/** No caller URL/host/port. Only a host-configured account ID selects an endpoint. */
export async function openConfiguredImapConnection(
	accountId: string,
	deps: ImapConnectionDeps,
	options: ImapConnectionOptions = {}
): Promise<ImapConnection> {
	return (await openCapturedImapConnection(accountId, captureImapConnection(deps, options)))
		.session;
}

/** Retain the same original dependencies for direct connections and fixed plans. */
function captureImapConnection(deps: ImapConnectionDeps, options: ImapConnectionOptions) {
	try {
		// Retain one authority/lifetime across host callbacks, awaits and teardown.
		const signal = options.signal;
		const callback = deps.assertActive;
		const pluginId = deps.pluginId;
		const connectMs = options.connectMs ?? IMAP_CONNECTION_LIMITS.connectMs;
		const lifetimeMs = options.lifetimeMs ?? IMAP_CONNECTION_LIMITS.lifetimeMs;
		const endpointCallback = deps.getEndpoint;
		const resolveCallback = deps.resolve;
		const portsCallback = deps.blockedPorts;
		const connectCallback = deps.connect;
		if (
			typeof callback !== 'function' ||
			typeof endpointCallback !== 'function' ||
			(resolveCallback !== undefined && typeof resolveCallback !== 'function') ||
			(portsCallback !== undefined && typeof portsCallback !== 'function') ||
			(connectCallback !== undefined && typeof connectCallback !== 'function') ||
			(signal !== undefined && !(signal instanceof AbortSignal))
		)
			throw new ImapConnectionError('MAIL_DENIED');
		const checkAuthority = callback.bind(deps);
		return Object.freeze({
			signal,
			pluginId,
			connectMs,
			lifetimeMs,
			assertAuthority: () => assertMailActivityAuthority(checkAuthority),
			getEndpoint: endpointCallback.bind(deps),
			resolve: resolveCallback?.bind(deps),
			blockedPorts: portsCallback?.bind(deps),
			connect: connectCallback === undefined ? tls.connect : connectCallback.bind(deps),
		});
	} catch (error) {
		throw error instanceof ImapConnectionError ? error : new ImapConnectionError('MAIL_DENIED');
	}
}

/** Only the fixed runner receives this completion check; the session stays terminal. */
interface ImapSessionCompletion {
	readonly session: ImapConnection;
	assertCompletion(): void;
}

/** Same connection implementation; a capture never grants authority on its own. */
async function openCapturedImapConnection(
	accountId: string,
	captured: ReturnType<typeof captureImapConnection>
): Promise<ImapSessionCompletion> {
	const {
		assertAuthority,
		signal,
		pluginId,
		connectMs,
		lifetimeMs,
		getEndpoint,
		resolve,
		blockedPorts,
		connect,
	} = captured;
	let endpoint: ConfiguredImapEndpoint;
	try {
		if (signal?.aborted) throw new ImapConnectionError('MAIL_CANCELED');
		assertAuthority();
		if (signal?.aborted) throw new ImapConnectionError('MAIL_CANCELED');
		if (typeof pluginId !== 'string' || !pluginId || pluginId.length > 256)
			throw new ImapConnectionError('MAIL_INVALID');
		if (typeof accountId !== 'string' || !accountId || accountId.length > 128) {
			throw new ImapConnectionError('MAIL_INVALID');
		}
		const configured = getEndpoint(accountId);
		if (!configured) throw new ImapConnectionError('MAIL_DENIED');
		endpoint = validateConfiguredImapEndpoint(configured);
		assertAuthority();
		if (signal?.aborted) throw new ImapConnectionError('MAIL_CANCELED');
	} catch (error) {
		throw error instanceof ImapConnectionError ? error : new ImapConnectionError('MAIL_DENIED');
	}
	if (
		!Number.isSafeInteger(connectMs) ||
		connectMs < 1 ||
		connectMs > IMAP_CONNECTION_LIMITS.connectMs ||
		!Number.isSafeInteger(lifetimeMs) ||
		lifetimeMs < 1 ||
		lifetimeMs > IMAP_CONNECTION_LIMITS.lifetimeMs
	)
		throw new ImapConnectionError('MAIL_INVALID');
	const pluginCount = activePlugins.get(pluginId) ?? 0;
	if (activeAccounts.has(accountId) || pluginCount >= IMAP_SESSION_LIMITS.socketsPerPlugin)
		throw new ImapConnectionError('MAIL_LIMIT');
	activeAccounts.add(accountId);
	activePlugins.set(pluginId, pluginCount + 1);
	const admittedAt = performance.now();

	return new Promise<ImapSessionCompletion>((resolveReady, rejectReady) => {
		const decoder = new ImapResponseDecoder();
		decoder.setLiteralLimit(0); // Greeting/status operations cannot allocate content.
		let socket: tls.TLSSocket | undefined;
		let terminal: ImapConnectionError | undefined;
		let secure = false;
		let busy = false;
		let authenticated = false;
		let uidValidity: string | undefined;
		let sequence = 0;
		let logoutTag: string | undefined;
		let wireBytes: Buffer | undefined;
		const frames: ImapResponseFrame[] = [];
		let rejectWrite: ((error: ImapConnectionError) => void) | undefined;
		let reader:
			| {
					resolve(frames: ImapResponseFrame[]): void;
					reject(error: ImapConnectionError): void;
			  }
			| undefined;

		const onAbort = (): void => fail('MAIL_CANCELED');
		const connectTimer = setTimeout(() => fail('MAIL_TIMEOUT'), connectMs);
		const lifetimeTimer = setTimeout(() => fail('MAIL_TIMEOUT'), lifetimeMs);

		function detach(): void {
			socket?.removeListener('secureConnect', onSecure);
			socket?.removeListener('readable', pump);
			socket?.removeListener('end', onEnd);
		}

		function fail(code: ConnectionErrorCode): void {
			eraseImapFrameLiterals(frames);
			frames.length = 0; // Also covers batches delivered after terminal cancellation.
			if (terminal) return;
			terminal = new ImapConnectionError(code);
			clearTimeout(connectTimer);
			clearTimeout(lifetimeTimer);
			signal?.removeEventListener('abort', onAbort);
			decoder.dispose();
			detach();
			// Drain errors until close, since a pending TLS error can follow destroy.
			socket?.destroy();
			wireBytes?.fill(0);
			wireBytes = undefined;
			activeAccounts.delete(accountId);
			const remaining = (activePlugins.get(pluginId) ?? 1) - 1;
			if (remaining) activePlugins.set(pluginId, remaining);
			else activePlugins.delete(pluginId);
			rejectReady(terminal);
			rejectWrite?.(terminal);
			rejectWrite = undefined;
			reader?.reject(terminal);
			reader = undefined;
		}

		function assertBudget(): void {
			if (signal?.aborted) {
				fail('MAIL_CANCELED');
				throw new ImapConnectionError('MAIL_CANCELED');
			}
			const elapsed = performance.now() - admittedAt;
			if (elapsed >= lifetimeMs || (!authenticated && elapsed >= connectMs)) {
				fail('MAIL_TIMEOUT');
				throw new ImapConnectionError('MAIL_TIMEOUT');
			}
		}

		function assertLifetime(): void {
			if (terminal) throw terminal;
			assertBudget();
		}

		/** Private plan completion only; never authorizes I/O on a closed session. */
		function assertCompletion(): void {
			if (!terminal || terminal.code !== 'MAIL_CANCELED')
				throw terminal ?? new ImapConnectionError('MAIL_INVALID');
			assertBudget();
			try {
				assertAuthority();
			} catch {
				throw new ImapConnectionError('MAIL_DENIED');
			}
			// Timers have been cleared; synchronous callbacks still spend this budget.
			assertBudget();
		}

		function assertActive(): void {
			assertLifetime();
			try {
				assertAuthority();
			} catch {
				fail('MAIL_DENIED');
				throw terminal;
			}
			// A returning host callback can synchronously close/cancel or overrun the budget.
			assertLifetime();
		}

		function readPortPolicy(): readonly number[] {
			assertActive();
			try {
				// Query live policy and own this check's list before any later host callback.
				const configuredPorts = blockedPorts === undefined ? [] : blockedPorts();
				if (!Array.isArray(configuredPorts)) throw new ImapConnectionError('MAIL_DENIED');
				const ports = [...configuredPorts];
				if (ports.some((port) => !Number.isInteger(port) || port < 1 || port > 65535))
					throw new ImapConnectionError('MAIL_DENIED');
				assertActive();
				if (ports.includes(endpoint.port)) {
					fail('MAIL_DENIED');
					throw terminal;
				}
				return ports;
			} catch {
				fail('MAIL_DENIED');
				throw terminal;
			}
		}

		async function receive(): Promise<ImapResponseFrame[]> {
			assertActive();
			const batch = await new Promise<ImapResponseFrame[]>((resolve, reject) => {
				reader = { resolve, reject };
				pump();
			});
			assertActive();
			return batch;
		}

		async function execute(
			command: FixedImapCommand,
			expectedUidValidity?: string
		): Promise<ImapCommandResult> {
			assertActive();
			if (busy) throw new ImapConnectionError('MAIL_LIMIT');
			busy = true;
			try {
				if (++sequence > IMAP_SESSION_LIMITS.commands) throw new ImapConnectionError('MAIL_LIMIT');
				const prepared = prepareImapCommand(`A${sequence}`, command);
				wireBytes = prepared.bytes;
				if ((prepared.kind === 'login') === authenticated)
					throw new ImapConnectionError('MAIL_INVALID');
				if (prepared.kind === 'search' || prepared.kind === 'fetch') {
					if (!uidValidity || expectedUidValidity !== uidValidity)
						throw new ImapConnectionError('MAIL_STALE');
				}
				decoder.setLiteralLimit(prepared.literalLimit ?? 0);
				logoutTag = prepared.kind === 'logout' ? prepared.tag : undefined;
				assertActive();
				await new Promise<void>((resolve, reject) => {
					rejectWrite = reject;
					socket!.write(prepared.bytes, (error) => {
						prepared.bytes.fill(0);
						wireBytes = undefined;
						rejectWrite = undefined;
						if (error) {
							fail('MAIL_UNAVAILABLE');
							reject(terminal);
						} else resolve();
					});
				});
				assertActive();
				for (;;) {
					const batch = await receive();
					const tagged = batch.findIndex((frame) => frame.kind === 'status' && frame.tag !== null);
					if (tagged < 0) continue;
					// Never discard coalesced trailing records or accept a wrong tag.
					if (tagged !== batch.length - 1) throw new ImapConnectionError('MAIL_PROTOCOL');
					break;
				}
				const result = validateImapCommandResult(prepared, frames);
				// Reject a coalesced partial record after the tagged completion too.
				decoder.setLiteralLimit(prepared.literalLimit ?? 0);
				assertActive();
				if (result.kind === 'examine') {
					if (expectedUidValidity !== undefined && result.uidValidity !== expectedUidValidity)
						throw new ImapConnectionError('MAIL_STALE');
					uidValidity = result.uidValidity;
				}
				if (prepared.kind === 'login') {
					authenticated = true;
					clearTimeout(connectTimer);
				}
				frames.length = 0; // Validated FETCH transfers its sole literal to the host.
				if (prepared.kind === 'logout') fail('MAIL_CANCELED');
				return result;
			} catch (error) {
				fail(error instanceof ImapConnectionError ? error.code : 'MAIL_PROTOCOL');
				throw terminal;
			} finally {
				busy = false;
			}
		}

		function onError(): void {
			fail('MAIL_UNAVAILABLE');
		}
		function onClose(): void {
			if (!hasLogoutCompletion()) fail('MAIL_UNAVAILABLE');
			socket?.removeListener('error', onError);
			socket?.removeListener('close', onClose);
		}
		function onEnd(): void {
			try {
				// EOF after buffered LOGOUT completion must not outrun its promise.
				// This checks framing only; the pending command still validates BYE/tag.
				if (hasLogoutCompletion()) {
					decoder.setLiteralLimit(0);
					return;
				}
				decoder.finish();
			} catch {
				fail('MAIL_PROTOCOL');
				return;
			}
			// A framing boundary alone is never session/tagged command success.
			fail('MAIL_UNAVAILABLE');
		}

		function hasLogoutCompletion(): boolean {
			const last = frames[frames.length - 1];
			return !!logoutTag && last?.kind === 'status' && last.tag === logoutTag;
		}

		function pump(): void {
			if (!secure || terminal || !reader || !socket) return;
			try {
				let chunk: Buffer | null;
				while (reader && !terminal && (chunk = socket.read() as Buffer | null) !== null) {
					const batch = decoder.push(chunk);
					if (batch.length) {
						// Own literals synchronously, before EOF/abort or promise resumption.
						// receive() returns this batch while retaining the full command records.
						frames.push(...batch);
						const pending = reader;
						reader = undefined;
						pending.resolve(batch);
					}
				}
			} catch (error) {
				fail(error instanceof ImapFramingError ? error.code : 'MAIL_PROTOCOL');
			}
		}

		function onSecure(): void {
			if (terminal || !socket) return;
			if (!socket.authorized) {
				fail('MAIL_UNAVAILABLE');
				return;
			}
			secure = true;
			void (async () => {
				await receive();
				const greeting = frames[0];
				if (
					frames.length !== 1 ||
					greeting.kind !== 'status' ||
					greeting.tag !== null ||
					greeting.status !== 'OK' ||
					(greeting.text.startsWith('[') && !/^\[ALERT\](?: |$)/i.test(greeting.text))
				)
					throw new ImapConnectionError('MAIL_PROTOCOL');
				decoder.setLiteralLimit(0);
				frames.length = 0;
				assertActive();
				resolveReady(
					Object.freeze({
						session: Object.freeze({
							execute,
							assertActive,
							close: (): void => fail('MAIL_CANCELED'),
						}),
						assertCompletion,
					})
				);
			})().catch((error) =>
				fail(error instanceof ImapConnectionError ? error.code : 'MAIL_PROTOCOL')
			);
		}

		signal?.addEventListener('abort', onAbort, { once: true });
		if (signal?.aborted) {
			onAbort();
			return;
		}
		void (async () => {
			const guard = createEgressGuard({
				resolve,
				blockedPorts: readPortPolicy,
				makeDispatcher: () => undefined,
			});
			try {
				await guard.assertUrlAllowed(`https://${endpoint.host}:${endpoint.port}`);
			} catch {
				fail('MAIL_DENIED');
				return;
			}
			if (terminal) return;
			assertActive();
			const lookup: GuardedLookup = (hostname, lookupOptions, callback) => {
				try {
					if (hostname !== endpoint.host) {
						fail('MAIL_DENIED');
						throw terminal;
					}
					readPortPolicy();
				} catch {
					callback(terminal!, '', 0);
					return;
				}
				guard.lookup(hostname, lookupOptions, (error, address, family) => {
					// Late DNS completion must never hand an address to a canceled socket.
					if (terminal) {
						callback(terminal, '', 0);
						return;
					}
					try {
						readPortPolicy();
						if (error) {
							fail('MAIL_DENIED');
							throw terminal;
						}
					} catch {
						callback(terminal!, '', 0);
						return;
					}
					callback(null, address, family);
				});
			};
			readPortPolicy();
			// Node supports these socket options; @types/node's TLS shape omits them.
			const tlsOptions: tls.ConnectionOptions & {
				autoSelectFamily: boolean;
				allowHalfOpen: boolean;
				highWaterMark: number;
			} = {
				host: endpoint.host,
				port: endpoint.port,
				servername: endpoint.host,
				rejectUnauthorized: true,
				checkServerIdentity: (_hostname, cert) => tls.checkServerIdentity(endpoint.host, cert),
				minVersion: 'TLSv1.2',
				lookup: lookup as net.LookupFunction,
				autoSelectFamily: false,
				allowHalfOpen: false,
				highWaterMark: 64 * 1024,
			};
			socket = connect(tlsOptions);
			socket.on('error', onError);
			socket.once('close', onClose);
			// Paused reads provide backpressure; never accumulate a host frame queue.
			socket.on('readable', pump);
			socket.once('end', onEnd);
			socket.once('secureConnect', onSecure);
			if (terminal) {
				detach();
				socket.destroy();
			}
		})().catch(() => fail('MAIL_UNAVAILABLE'));
	});
}
