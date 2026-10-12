import { EventEmitter } from 'node:events';
import type { ConnectionOptions, TLSSocket, PeerCertificate } from 'node:tls';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ImapConnectionError,
	openConfiguredImapConnection,
	validateConfiguredImapEndpoint,
	type ConfiguredImapEndpoint,
	type ImapConnectionDeps,
	type ImapConnectionOptions,
} from '../../../main/plugins/mail-imap-connection';
import type { GuardedLookup } from '../../../main/plugins/net-egress-guard';

// No reusable TLS socket fixture exists in the test helpers. This double implements
// paused reads/events only; it never opens a socket or replaces guard/parser logic.
class SyntheticSocket extends EventEmitter {
	authorized = true;
	destroyed = false;
	chunks: Buffer[] = [];
	read = vi.fn(() => this.chunks.shift() ?? null);
	write = vi.fn();
	destroy = vi.fn(() => {
		this.destroyed = true;
		this.chunks.forEach((chunk) => chunk.fill(0));
		this.chunks = [];
		this.emit('close');
		return this;
	});
	feed(text: string): void {
		this.chunks.push(Buffer.from(text, 'ascii'));
		this.emit('readable');
	}
}

const endpoint = { host: 'mail.example.test', port: 993, tls: true } as const;
let sequence = 0;
const cleanup: Array<() => Promise<void>> = [];
function fixture(
	overrides: Partial<ImapConnectionDeps> = {},
	options: ImapConnectionOptions = {},
	account = `synthetic-account-${++sequence}`
) {
	const socket = new SyntheticSocket();
	const controller = new AbortController();
	let capture!: (options: ConnectionOptions) => void;
	const connected = new Promise<ConnectionOptions>((resolve) => (capture = resolve));
	const connect = vi.fn((options: ConnectionOptions) => {
		capture(options);
		return socket as unknown as TLSSocket;
	});
	const deps: ImapConnectionDeps = {
		pluginId: 'synthetic-plugin',
		assertActive: vi.fn(),
		getEndpoint: vi.fn(() => endpoint),
		resolve: vi.fn(async () => ['93.184.216.34']),
		connect,
		...overrides,
	};
	const pending = openConfiguredImapConnection(account, deps, {
		...options,
		signal: controller.signal,
	});
	void pending.catch(() => undefined);
	const value = { socket, controller, connected, connect, deps, pending, account };
	cleanup.push(async () => {
		controller.abort();
		await pending.catch(() => undefined);
		socket.destroy();
	});
	return value;
}
async function ready(f: ReturnType<typeof fixture>) {
	await f.connected;
	f.socket.feed('* OK synthetic greeting\r\n');
	f.socket.emit('secureConnect');
	return f.pending;
}
async function lookup(
	f: ReturnType<typeof fixture>,
	host: string = endpoint.host,
	options: { all?: boolean } = {}
) {
	const connectionOptions = await f.connected;
	return new Promise<{ error: Error | null; address: unknown; family?: number }>((resolve) => {
		(connectionOptions.lookup as GuardedLookup)(host, options, (error, address, family) =>
			resolve({ error, address, family })
		);
	});
}
function safeError(error: unknown, code: ImapConnectionError['code']): void {
	expect(error).toBeInstanceOf(ImapConnectionError);
	expect(error).toMatchObject({ code, name: 'ImapConnectionError' });
	expect((error as Error).message).toBe(new ImapConnectionError(code).message);
	expect(error).not.toHaveProperty('cause');
	expect(String(error)).not.toContain('sensitive peer text');
}

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] }));
afterEach(async () => {
	for (const dispose of cleanup.splice(0)) await dispose();
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('configured endpoint validation', () => {
	it('copies frozen trusted fields and strips TLS overrides without mutating configuration', () => {
		const config = { ...endpoint, rejectUnauthorized: false, password: 'synthetic' };
		const result = validateConfiguredImapEndpoint(config);
		expect(result).toStrictEqual(endpoint);
		expect(Object.isFrozen(result)).toBe(true);
		expect(result === config).toBe(false);
		expect(config.rejectUnauthorized).toBe(false);
	});
	it.each([
		{ host: '' },
		{ host: 'a..test' },
		{ host: 'mail-.test' },
		{ host: 'mail.test.' },
		{ host: 'máil.test' },
		{ host: 'a'.repeat(64) + '.test' },
		{ host: 'a.'.repeat(127) + 'a' },
		{ port: 0 },
		{ port: 65536 },
		{ port: 1.5 },
		{ port: 994 },
		{ tls: false },
	] as const)('refuses malformed configuration %j', (patch) => {
		expect(() =>
			validateConfiguredImapEndpoint({ ...endpoint, ...patch } as ConfiguredImapEndpoint)
		).toThrow(new ImapConnectionError('MAIL_INVALID'));
	});
	it.each(['127.0.0.1', '93.184.216.34', '2130706433', '0x7f000001', '127.1'])(
		'denies literal IP or numeric URL alias %s',
		(host) => {
			expect(() => validateConfiguredImapEndpoint({ ...endpoint, host })).toThrow(
				new ImapConnectionError('MAIL_DENIED')
			);
		}
	);
	it('accepts case-preserved names and explicit nonstandard port opt-in', () => {
		expect(validateConfiguredImapEndpoint({ ...endpoint, host: 'MAIL.Example.Test' }).host).toBe(
			'MAIL.Example.Test'
		);
		expect(
			validateConfiguredImapEndpoint({ ...endpoint, port: 65535, allowNonstandardPort: true }).port
		).toBe(65535);
	});
});

describe('admission and pinned synthetic TLS', () => {
	it.each([
		{ pluginId: '' },
		{ pluginId: 'p'.repeat(257) },
		{ connectMs: 0 },
		{ connectMs: 10001 },
		{ connectMs: 1.5 },
		{ lifetimeMs: 0 },
		{ lifetimeMs: 30001 },
		{ lifetimeMs: NaN },
	] as const)('rejects invalid admission %j before DNS/socket', async (patch) => {
		const f = fixture('pluginId' in patch ? patch : {}, 'pluginId' in patch ? {} : patch);
		safeError(await f.pending.catch((e: unknown) => e), 'MAIL_INVALID');
		expect(f.deps.resolve).not.toHaveBeenCalled();
		expect(f.connect).not.toHaveBeenCalled();
	});
	it.each(['', 'a'.repeat(129)])('rejects invalid account %s before I/O', async (account) => {
		const f = fixture({}, {}, account);
		safeError(await f.pending.catch((e: unknown) => e), 'MAIL_INVALID');
		expect(f.connect).not.toHaveBeenCalled();
	});
	it.each(['missing', 'throw-config', 'throw-authority', 'missing-authority'] as const)(
		'denies unavailable host authority/configuration: %s',
		async (mode) => {
			const f = fixture({
				...(mode === 'missing' ? { getEndpoint: () => null } : {}),
				...(mode === 'throw-config'
					? {
							getEndpoint: () => {
								throw new Error('sensitive peer text');
							},
						}
					: {}),
				...(mode === 'throw-authority'
					? {
							assertActive: () => {
								throw new Error('sensitive peer text');
							},
						}
					: {}),
				...(mode === 'missing-authority'
					? { assertActive: undefined as unknown as () => void }
					: {}),
			});
			safeError(await f.pending.catch((e: unknown) => e), 'MAIL_DENIED');
			expect(f.connect).not.toHaveBeenCalled();
		}
	);
	it('refuses already canceled admission before touching host configuration', async () => {
		const controller = new AbortController();
		controller.abort();
		const getEndpoint = vi.fn(() => endpoint);
		await expect(
			openConfiguredImapConnection(
				'account',
				{
					pluginId: 'plugin',
					getEndpoint,
					assertActive: vi.fn(),
				},
				{ signal: controller.signal }
			)
		).rejects.toMatchObject({ code: 'MAIL_CANCELED' });
		expect(getEndpoint).not.toHaveBeenCalled();
	});
	it.each([
		{ addresses: [] },
		{ addresses: ['127.0.0.1'] },
		{ addresses: ['10.0.0.1'] },
		{ addresses: ['169.254.169.254'] },
		{ addresses: ['::1'] },
		{ addresses: ['fc00::1'] },
		{ addresses: ['::ffff:7f00:1'] },
		{ addresses: ['not-an-ip'] },
		{ addresses: ['93.184.216.34', '192.168.1.1'] },
	])('denies preflight address set %j without dialing', async ({ addresses }) => {
		const f = fixture({ resolve: async () => addresses });
		safeError(await f.pending.catch((e: unknown) => e), 'MAIL_DENIED');
		expect(f.connect).not.toHaveBeenCalled();
		expect(vi.getTimerCount()).toBe(0);
	});
	it('normalizes resolver failure and configured blocked port before dialing', async () => {
		for (const patch of [
			{
				resolve: async (): Promise<string[]> => {
					throw new Error('sensitive peer text');
				},
			},
			{ blockedPorts: () => [993] },
		]) {
			const f = fixture(patch);
			safeError(await f.pending.catch((e: unknown) => e), 'MAIL_DENIED');
			expect(f.connect).not.toHaveBeenCalled();
		}
	});
	it('passes exact guarded TLS options and delegates certificate identity to configured host', async () => {
		const f = fixture();
		const options = await f.connected;
		expect(Object.keys(options).sort()).toEqual(
			[
				'host',
				'port',
				'servername',
				'rejectUnauthorized',
				'checkServerIdentity',
				'minVersion',
				'lookup',
				'autoSelectFamily',
				'allowHalfOpen',
				'highWaterMark',
			].sort()
		);
		expect(options).toMatchObject({ host: endpoint.host, port: endpoint.port });
		expect(options).toMatchObject({
			servername: endpoint.host,
			rejectUnauthorized: true,
			minVersion: 'TLSv1.2',
		});
		expect(options).toMatchObject({
			autoSelectFamily: false,
			allowHalfOpen: false,
			highWaterMark: 65536,
		});
		const cert = {
			subjectaltname: 'DNS:mail.example.test',
			subject: { CN: 'mail.example.test' },
		} as PeerCertificate;
		expect(options.checkServerIdentity!('foreign.test', cert)).toBeUndefined();
		expect(
			options.checkServerIdentity!(endpoint.host, { ...cert, subjectaltname: 'DNS:foreign.test' })
		).toBeInstanceOf(Error);
		expect(await lookup(f)).toStrictEqual({ error: null, address: '93.184.216.34', family: 4 });
		expect(await lookup(f, endpoint.host, { all: true })).toStrictEqual({
			error: null,
			address: [{ address: '93.184.216.34', family: 4 }],
			family: undefined,
		});
		await ready(f);
		expect(f.socket.write).not.toHaveBeenCalled();
	});
	it.each(['private', 'empty', 'error', 'blocked', 'revoked'] as const)(
		'rechecks the actual socket lookup after preflight: %s',
		async (mode) => {
			let calls = 0;
			let blocked = false;
			let active = true;
			const f = fixture({
				resolve: async () => {
					if (++calls === 1) return ['93.184.216.34'];
					if (mode === 'error') throw new Error('sensitive peer text');
					if (mode === 'blocked') blocked = true;
					if (mode === 'revoked') active = false;
					return mode === 'private' ? ['10.0.0.1'] : mode === 'empty' ? [] : ['1.1.1.1'];
				},
				blockedPorts: () => (blocked ? [993] : []),
				assertActive: () => {
					if (!active) throw new Error('sensitive peer text');
				},
			});
			const result = await lookup(f);
			safeError(result.error, 'MAIL_DENIED');
			expect(result.address).toBe('');
			expect(result.family).toBe(0);
			safeError(await f.pending.catch((e: unknown) => e), 'MAIL_DENIED');
			expect(f.socket.destroyed).toBe(true);
		}
	);
	it('never resolves a foreign lookup hostname and returns terminal cancellation after close', async () => {
		const f = fixture();
		await f.connected;
		safeError((await lookup(f, 'foreign.test')).error, 'MAIL_DENIED');
		expect(f.deps.resolve).toHaveBeenCalledTimes(1);
		f.controller.abort();
		safeError((await lookup(f)).error, 'MAIL_DENIED');
		expect(f.deps.resolve).toHaveBeenCalledTimes(1);
	});
});

describe('greeting ownership, terminal cleanup and bounds', () => {
	it('buffers paused greeting until secureConnect, exposes only frozen session methods, detaches on close', async () => {
		const f = fixture();
		await f.connected;
		let settled = false;
		void f.pending.then(() => {
			settled = true;
		});
		f.socket.feed('* OK [ALERT] synthetic\r\n');
		await Promise.resolve();
		expect(settled).toBe(false);
		expect(f.socket.read).not.toHaveBeenCalled();
		f.socket.emit('secureConnect');
		const session = await f.pending;
		expect(Object.keys(session).sort()).toEqual(['assertActive', 'close', 'execute']);
		expect(Object.isFrozen(session)).toBe(true);
		session.close();
		session.close();
		expect(f.socket.destroy).toHaveBeenCalledTimes(1);
		expect(f.socket.eventNames()).toEqual([]);
		expect(vi.getTimerCount()).toBe(0);
		expect(() => session.assertActive()).toThrow(new ImapConnectionError('MAIL_CANCELED'));
		await ready(fixture({}, {}, f.account)); // admission released
	});
	it.each([
		'* PREAUTH synthetic\r\n',
		'* BYE sensitive peer text\r\n',
		'A1 OK synthetic\r\n',
		'* OK [CAPABILITY IMAP4rev1] synthetic\r\n',
		'* OK synthetic\r\n* OK extra\r\n',
		'* OK synthetic\r\npartial',
		'* 1 FETCH (BODY[] {1}\r\nx)\r\n',
		'+ continue\r\n',
	])('refuses greeting %j without command writes', async (greeting) => {
		const f = fixture();
		await f.connected;
		f.socket.feed(greeting);
		f.socket.emit('secureConnect');
		safeError(
			await f.pending.catch((e: unknown) => e),
			greeting.includes('{1}') ? 'MAIL_LIMIT' : 'MAIL_PROTOCOL'
		);
		expect(f.socket.write).not.toHaveBeenCalled();
		expect(f.socket.eventNames()).toEqual([]);
		expect(vi.getTimerCount()).toBe(0);
	});
	it('accepts split greeting through actual framing', async () => {
		const f = fixture();
		await f.connected;
		f.socket.emit('secureConnect');
		f.socket.feed('* O');
		await Promise.resolve();
		f.socket.feed('K synthetic\r');
		await Promise.resolve();
		f.socket.feed('\n');
		(await f.pending).assertActive();
	});
	it.each(['unauthorized', 'error', 'close', 'end', 'truncated', 'connect-throw'] as const)(
		'normalizes synthetic TLS/native/EOF failure: %s',
		async (mode) => {
			const f = fixture(
				mode === 'connect-throw'
					? {
							connect: () => {
								throw new Error('sensitive peer text');
							},
						}
					: {}
			);
			if (mode !== 'connect-throw') {
				await f.connected;
				if (mode === 'unauthorized') {
					f.socket.authorized = false;
					f.socket.emit('secureConnect');
				} else if (mode === 'error') f.socket.emit('error', new Error('sensitive peer text'));
				else if (mode === 'truncated') {
					f.socket.emit('secureConnect');
					f.socket.feed('* OK incomplete');
					f.socket.emit('end');
				} else f.socket.emit(mode);
			}
			safeError(
				await f.pending.catch((e: unknown) => e),
				mode === 'truncated' ? 'MAIL_PROTOCOL' : 'MAIL_UNAVAILABLE'
			);
			expect(vi.getTimerCount()).toBe(0);
		}
	);
	it.each(['preflight', 'lookup'] as const)(
		'suppresses late DNS completion after cancellation at %s',
		async (stage) => {
			let release!: (addresses: string[]) => void;
			let calls = 0;
			const delayed = new Promise<string[]>((resolve) => {
				release = resolve;
			});
			const f = fixture({
				resolve: async () =>
					++calls === (stage === 'preflight' ? 1 : 2) ? delayed : ['93.184.216.34'],
			});
			const lookupResult = stage === 'lookup' ? lookup(f) : undefined;
			if (stage === 'lookup') {
				await f.connected;
				await Promise.resolve();
			}
			f.controller.abort();
			safeError(await f.pending.catch((e: unknown) => e), 'MAIL_CANCELED');
			release(['1.1.1.1']);
			if (lookupResult) {
				const result = await lookupResult;
				safeError(result.error, 'MAIL_CANCELED');
				expect(result.address).toBe('');
			} else {
				await vi.advanceTimersByTimeAsync(0);
				expect(f.connect).not.toHaveBeenCalled();
			}
			expect(vi.getTimerCount()).toBe(0);
		}
	);
	it.each(['dns', 'greeting', 'lifetime'] as const)(
		'times out the original admission budget during %s',
		async (stage) => {
			const f = fixture(stage === 'dns' ? { resolve: () => new Promise(() => {}) } : {}, {
				connectMs: stage === 'lifetime' ? 100 : 10,
				lifetimeMs: stage === 'lifetime' ? 10 : 100,
			});
			if (stage !== 'dns') await f.connected;
			await vi.advanceTimersByTimeAsync(10);
			safeError(await f.pending.catch((e: unknown) => e), 'MAIL_TIMEOUT');
			expect(vi.getTimerCount()).toBe(0);
		}
	);
	it('rechecks synchronous elapsed budget even before timers run', async () => {
		let now = 0;
		vi.spyOn(performance, 'now').mockImplementation(() => now);
		const f = fixture({}, { connectMs: 10 });
		await f.connected;
		now = 10;
		f.socket.emit('secureConnect');
		f.socket.feed('* OK synthetic\r\n');
		safeError(await f.pending.catch((e: unknown) => e), 'MAIL_TIMEOUT');
	});
	it('reauthorizes ready session and permanently denies it after host revocation', async () => {
		let active = true;
		const f = fixture({
			assertActive: () => {
				if (!active) throw new Error('sensitive peer text');
			},
		});
		const session = await ready(f);
		active = false;
		expect(() => session.assertActive()).toThrow(new ImapConnectionError('MAIL_DENIED'));
		active = true;
		expect(() => session.assertActive()).toThrow(new ImapConnectionError('MAIL_DENIED'));
		expect(f.socket.destroyed).toBe(true);
		expect(vi.getTimerCount()).toBe(0);
	});
	it('enforces global account exclusion, plugin four-socket cap and unrelated plugin admission', async () => {
		const first = fixture();
		const session = await ready(first);
		for (let i = 0; i < 3; i++) await ready(fixture());
		safeError(await fixture().pending.catch((e: unknown) => e), 'MAIL_LIMIT');
		safeError(
			await fixture({ pluginId: 'other' }, {}, first.account).pending.catch((e: unknown) => e),
			'MAIL_LIMIT'
		);
		await ready(fixture({ pluginId: 'other' }));
		session.close();
		await ready(fixture({}, {}, first.account));
	});
});
