import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TLSSocket } from 'node:tls';
import { vi } from 'vitest';
import {
	AuthorizationStore,
	type Anchor,
	type AuthIdentity,
	type KeyringEntry,
} from '../../main/plugins/authorization-ledger';
import { MailAccountCredentials } from '../../main/plugins/mail-account-credentials';
import { ImapConnectionError } from '../../main/plugins/mail-imap-connection';
import { MailHostService } from '../../main/plugins/mail-host-service';
import { PluginToolRunIdentity } from '../../main/plugins/plugin-tool-run-identity';
import type { PermissionGrant } from '../../shared/plugins/permissions';

/** Synthetic TLS, keyring and seal only; uses actual ledger, fixed commands, readers and MIME code. */
export async function createMailHostFixture() {
	const root = path.join(process.cwd(), '.maestro', 'imap-continuation', 'tmp');
	fs.mkdirSync(root, { recursive: true });
	const dir = fs.mkdtempSync(path.join(root, 'fixture-'));
	const pluginId = 'synthetic-plugin',
		agentId = 'synthetic-agent';
	const identity: AuthIdentity = {
		contentHash: 'a'.repeat(64),
		signatureStatus: 'trusted',
		signerKey: 'c3ludGhldGlj',
	};
	let anchor: Anchor | null = null;
	const deps = {
		ledgerPath: path.join(dir, 'sealed'),
		seal: {
			available: () => true,
			seal: (value: string) => Buffer.from('sealed:' + value),
			unseal: (value: Buffer) => {
				if (!value.toString().startsWith('sealed:')) throw new Error('InvalidSeal');
				return value.toString().slice(7);
			},
		},
		anchor: {
			available: () => true,
			read: () => anchor,
			write: (value: Anchor) => {
				anchor = { ...value };
			},
			clear: () => {
				anchor = null;
			},
		},
	};
	const store = new AuthorizationStore(deps);
	store.mint(pluginId, [{ capability: 'mail:accounts', grantedAt: 1 }], identity);
	const slots = new Map<string, string>();
	const entryFactory = vi.fn(
		(service: string, slot: string): KeyringEntry => ({
			getPassword: () => slots.get(service + slot) ?? null,
			setPassword: (password) => {
				slots.set(service + slot, password);
			},
			deletePassword: () => slots.delete(service + slot),
		})
	);
	const setupController = new AbortController();
	const setup = {
		signal: setupController.signal,
		assertActive: () => {
			if (setupController.signal.aborted) throw new ImapConnectionError('MAIL_CANCELED');
		},
		assertAgentActive: (id: string) => {
			if (id !== agentId) throw new ImapConnectionError('MAIL_DENIED');
		},
	};
	const credentials = new MailAccountCredentials(store, pluginId, identity, entryFactory);
	let configuration = credentials.addDisabledAccount(
		{
			endpoint: { host: 'mail.example.test', port: 993, tls: true },
			username: 'synthetic-user',
			mailboxes: ['INBOX'],
		},
		setup
	);
	const accountId = configuration.accounts[0].accountId;
	const grants: PermissionGrant[] = ['read', 'body', 'attachments'].map((cap) => ({
		capability: `mail:${cap}` as PermissionGrant['capability'],
		scope: accountId,
		grantedAt: 1,
	}));
	store.mint(pluginId, [...grants, { capability: 'mail:accounts', grantedAt: 1 }], identity);
	configuration = await credentials.savePassword(accountId, 1, 'synthetic-secret', setup);
	configuration = await credentials.enableAccount(
		accountId,
		configuration.accounts[0].revision,
		setup
	);
	configuration = await credentials.replaceAgentRights(
		accountId,
		configuration.accounts[0].revision,
		[{ agentId, rights: ['read', 'detail', 'attachments'] }],
		setup
	);
	const reference = Object.freeze({
		accountId,
		accountRevision: configuration.accounts[0].revision,
		mailbox: 'INBOX',
		uidValidity: '7',
		uid: '2',
	});
	let active = true;
	const runs = new PluginToolRunIdentity((id) => {
		if (!active || id !== agentId) throw new ImapConnectionError('MAIL_DENIED');
	});
	const runController = new AbortController(),
		pluginController = new AbortController();
	const assertActive = () => {
		if (!active) throw new ImapConnectionError('MAIL_DENIED');
	};
	const token = runs.issue(agentId, { signal: runController.signal, assertActive });
	const invocationId = runs.issueInvocation(runs.resolveVerified(token), pluginId, {
		signal: pluginController.signal,
		assertActive,
	});
	const sockets: SyntheticMailSocket[] = [];
	const commands: string[] = [];
	let source = 'MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\ncomplete body';
	let beforeResponse: (() => void) | undefined;
	const connect = vi.fn(() => {
		const socket = new SyntheticMailSocket((command, write) => {
			commands.push(command);
			const tag = command.split(' ')[0];
			let response: string | Buffer;
			if (command.includes(' LOGIN ')) response = `${tag} OK logged in\r\n`;
			else if (command.includes(' EXAMINE '))
				response = `* FLAGS (\\Seen)\r\n* 1 EXISTS\r\n* 0 RECENT\r\n* OK [UIDVALIDITY 7] stable\r\n* OK [UIDNEXT 3] next\r\n${tag} OK [READ-ONLY] selected\r\n`;
			else if (command.includes(' UID SEARCH ')) {
				const range = /UID SEARCH UID ([0-9]+):([0-9]+)/.exec(command)!;
				response = `* SEARCH${Number(range[1]) <= 2 && Number(range[2]) >= 2 ? ' 2' : ''}\r\n${tag} OK found\r\n`;
			} else if (command.includes('INTERNALDATE'))
				response = `* 1 FETCH (UID 2 INTERNALDATE "12-Oct-2026 10:11:12 +0000" RFC822.SIZE 42)\r\n${tag} OK fetched\r\n`;
			else if (command.includes(' UID FETCH ')) {
				const section = command.includes('HEADER.FIELDS')
					? command.slice(command.indexOf('BODY.PEEK[') + 10, command.lastIndexOf(']'))
					: '';
				const literal = Buffer.from(
					section ? 'Subject: synthetic report\r\nFrom: Example\r\n\r\n' : source
				);
				response = Buffer.concat([
					Buffer.from(`* 1 FETCH (UID 2 BODY[${section}] {${literal.length}}\r\n`),
					literal,
					Buffer.from(`)\r\n${tag} OK fetched\r\n`),
				]);
			} else response = `${tag} OK done\r\n`;
			queueMicrotask(() => {
				beforeResponse?.();
				write();
				socket.feed(response);
			});
		});
		sockets.push(socket);
		queueMicrotask(() => {
			socket.emit('secureConnect');
			socket.feed('* OK synthetic greeting\r\n');
		});
		return socket as unknown as TLSSocket;
	});
	const service = new MailHostService({
		store,
		toolIdentity: runs,
		identityFor: (id) => {
			assertActive();
			if (id !== pluginId) throw new ImapConnectionError('MAIL_DENIED');
			return identity;
		},
		assertPolicyActive: (_id, _identity, id) => {
			assertActive();
			if (id !== agentId) throw new ImapConnectionError('MAIL_DENIED');
		},
		requestSetup: vi.fn(),
		entryFactory,
		transport: { resolve: async () => ['93.184.216.34'], connect },
	});
	return {
		dir,
		deps,
		store,
		credentials,
		setup,
		identity,
		pluginId,
		agentId,
		accountId,
		reference,
		runs,
		token,
		invocationId,
		runController,
		pluginController,
		service,
		connect,
		sockets,
		commands,
		slots,
		entryFactory,
		setSource: (value: string) => {
			source = value;
		},
		setBeforeResponse: (fn: () => void) => {
			beforeResponse = fn;
		},
		revoke: () => {
			active = false;
			runs.revoke(token);
		},
		dispose: () => {
			service.stop();
			runs.stop();
			for (const socket of sockets) socket.destroy();
			fs.rmSync(dir, { recursive: true, force: true });
		},
	};
}

class SyntheticMailSocket extends EventEmitter {
	authorized = true;
	destroyed = false;
	private chunks: Buffer[] = [];
	constructor(private respond: (command: string, written: () => void) => void) {
		super();
	}
	read(): Buffer | null {
		return this.chunks.shift() ?? null;
	}
	write(bytes: Buffer, done: () => void): boolean {
		this.respond(bytes.toString('ascii'), done);
		return true;
	}
	feed(value: string | Buffer): void {
		if (this.destroyed) return;
		this.chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
		this.emit('readable');
	}
	destroy(): this {
		if (this.destroyed) return this;
		this.destroyed = true;
		for (const bytes of this.chunks) bytes.fill(0);
		this.chunks = [];
		this.emit('close');
		return this;
	}
}
