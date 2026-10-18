import * as fs from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { createMailHostFixture } from '../../helpers/mailHostFixture';
import { PermissionBroker } from '../../../main/plugins/permission-broker';
import { AuthorizationStore } from '../../../main/plugins/authorization-ledger';
import { MailInvocationReader } from '../../../main/plugins/mail-invocation-reader';

const fixtures: Awaited<ReturnType<typeof createMailHostFixture>>[] = [];
afterEach(() => {
	for (const fixture of fixtures.splice(0)) fixture.dispose();
});
async function fixture() {
	const value = await createMailHostFixture();
	fixtures.push(value);
	return value;
}

describe('actual callable mail boundary with synthetic TLS and keyring', () => {
	it('reads complete headers and plain text; exposes no native credentials or connection configuration', async () => {
		const f = await fixture();
		let guard: (() => void) | undefined;
		const headers = await f.service.call(
			f.pluginId,
			'mail.readHeaders',
			{ invocationId: f.invocationId, reference: f.reference },
			(value) => {
				guard = value;
			}
		);
		expect(headers).toEqual({
			ok: true,
			value: { reference: f.reference, subject: 'synthetic report', sender: 'Example' },
		});
		expect(guard).toBeTypeOf('function');
		guard!();
		const body = await f.service.call(
			f.pluginId,
			'mail.readBody',
			{ invocationId: f.invocationId, reference: f.reference },
			() => {}
		);
		expect(body).toEqual({
			ok: true,
			value: {
				reference: f.reference,
				mimeType: 'text/plain',
				text: 'complete body',
				sizeBytes: 13,
			},
		});
		expect(JSON.stringify([headers, body])).not.toMatch(
			/synthetic-secret|synthetic-user|mail.example/
		);
		expect(f.commands.some((command) => command.includes('BODY.PEEK'))).toBe(true);
		expect(f.commands.some((command) => /STORE|EXPUNGE|APPEND|SELECT/.test(command))).toBe(false);
		expect(f.sockets.every((socket) => socket.destroyed)).toBe(true);
		f.runs.revoke(f.token);
		expect(guard).toThrow();
	});
	it('returns a closed reference page and rejects wider public text before I/O', async () => {
		const f = await fixture();
		const criteria = {
			invocationId: f.invocationId,
			accountId: f.accountId,
			accountRevision: f.reference.accountRevision,
			mailbox: 'INBOX',
			fromUid: '1',
			toUid: '9',
			text: 'report',
		};
		const result = await f.service.call(f.pluginId, 'mail.searchHeaders', criteria, () => {});
		expect(result).toEqual({
			ok: true,
			value: { uidValidity: '7', references: [f.reference], truncated: false },
		});
		const before = f.connect.mock.calls.length;
		expect(
			await f.service.call(
				f.pluginId,
				'mail.searchHeaders',
				{ ...criteria, text: 'x'.repeat(257) },
				() => {}
			)
		).toMatchObject({ ok: false, error: { code: 'MAIL_INVALID' } });
		expect(f.connect.mock.calls.length).toBe(before);
	});
	it.each(['callerAgentId', 'password', 'host', 'command'])(
		'rejects unexpected %s without reading it or dialing',
		async (field) => {
			const f = await fixture();
			const request = { invocationId: f.invocationId, reference: f.reference };
			Object.defineProperty(request, field, {
				get: () => {
					throw new Error('secret getter');
				},
				enumerable: true,
			});
			expect(await f.service.call(f.pluginId, 'mail.readHeaders', request, () => {})).toMatchObject(
				{ ok: false, error: { code: 'MAIL_INVALID' } }
			);
			expect(f.connect).not.toHaveBeenCalled();
		}
	);
	it.each(['wrong-plugin', 'foreign-handle', 'stale-revision', 'wrong-mailbox', 'wrong-namespace'])(
		'denies %s through actual authority and fixed flow',
		async (mode) => {
			const f = await fixture();
			const request = {
				invocationId: mode === 'foreign-handle' ? 'f'.repeat(64) : f.invocationId,
				reference: {
					...f.reference,
					...(mode === 'stale-revision' ? { accountRevision: 1 } : {}),
					...(mode === 'wrong-mailbox' ? { mailbox: 'Other' } : {}),
					...(mode === 'wrong-namespace' ? { uidValidity: '8' } : {}),
				},
			};
			expect(
				await f.service.call(
					mode === 'wrong-plugin' ? 'foreign-plugin' : f.pluginId,
					'mail.readHeaders',
					request,
					() => {}
				)
			).toMatchObject({ ok: false });
			expect(f.sockets.every((socket) => socket.destroyed)).toBe(true);
		}
	);
	it('cancels an admitted read on exact-run teardown and suppresses late results', async () => {
		const f = await fixture();
		f.setBeforeResponse(() => f.runController.abort());
		expect(
			await f.service.call(
				f.pluginId,
				'mail.readBody',
				{ invocationId: f.invocationId, reference: f.reference },
				() => {}
			)
		).toMatchObject({ ok: false });
		expect(f.sockets.every((socket) => socket.destroyed)).toBe(true);
	});
	it('requires each independent agent right and keeps account consent scoped', async () => {
		const f = await fixture();
		const broker = new PermissionBroker({
			getGrants: () => [{ capability: 'mail:body', scope: f.accountId, grantedAt: 1 }],
		});
		expect(broker.authorize(f.pluginId, 'mail.readBody', { reference: f.reference }).allowed).toBe(
			true
		);
		expect(
			broker.authorize(f.pluginId, 'mail.readHeaders', { reference: f.reference }).allowed
		).toBe(false);
		expect(
			broker.authorize(f.pluginId, 'mail.readBody', {
				reference: { ...f.reference, accountId: 'b'.repeat(32) },
			}).allowed
		).toBe(false);
		await f.credentials.replaceAgentRights(
			f.accountId,
			f.reference.accountRevision,
			[{ agentId: f.agentId, rights: ['read'] }],
			f.setup
		);
		const reference = { ...f.reference, accountRevision: f.reference.accountRevision + 1 };
		expect(
			await f.service.call(
				f.pluginId,
				'mail.readBody',
				{ invocationId: f.invocationId, reference },
				() => {}
			)
		).toMatchObject({ ok: false });
	});
	it('persists canonical account configuration and rights; passwords remain solely in the synthetic native slot', async () => {
		const f = await fixture();
		const restored = new AuthorizationStore(f.deps);
		expect(restored.readMailConfiguration(f.pluginId, f.identity)?.accounts[0].revision).toBe(
			f.reference.accountRevision
		);
		expect(() =>
			restored.assertStoredMailAgentRight(
				f.pluginId,
				f.identity,
				f.accountId,
				f.reference.accountRevision,
				f.agentId,
				'read'
			)
		).not.toThrow();
		const accounts = await f.service.call(f.pluginId, 'mail.listAccounts', {}, () => {});
		expect(accounts).toEqual({
			ok: true,
			value: [
				{
					accountId: f.accountId,
					revision: f.reference.accountRevision,
					enabled: true,
					mailboxes: ['INBOX'],
					status: 'unknown',
					credentialStatus: 'unknown',
					agentGrantCounts: { read: 1, detail: 1, attachments: 1 },
				},
			],
		});
	});
	it('reads authenticated INTERNALDATE/SIZE metadata and signs only seven closed fields', async () => {
		const f = await fixture();
		const reader = new MailInvocationReader({
			store: f.store,
			pluginId: f.pluginId,
			identity: f.identity,
			toolIdentity: f.runs,
			entryFactory: f.entryFactory,
			transport: { resolve: async () => ['93.184.216.34'], connect: f.connect },
			assertPolicyActive: () => {},
		});
		const metadata = await reader.readMetadata(f.invocationId, f.reference);
		expect(metadata).toEqual({ receivedAt: Date.UTC(2026, 9, 12, 10, 11, 12), sizeBytes: 42 });
		const payload = {
			reference: `relay-mail:1:${f.accountId}:INBOX:7:2`,
			accountId: f.accountId,
			folder: 'INBOX',
			uidValidity: '7',
			uid: '2',
			...metadata,
		};
		const source = {
			pluginId: f.pluginId,
			accountId: f.accountId,
			accountRevision: f.reference.accountRevision,
			mailbox: 'INBOX',
			producerAgentId: f.agentId,
			sourceGeneration: 'c'.repeat(32),
		};
		const proof = f.store.mailEventProof(f.pluginId, f.identity, source, payload);
		expect(f.store.verifyMailEvent(f.identity, { ...source, proof }, payload, f.agentId)).toBe(
			true
		);
		const reorderedPayload = Object.fromEntries(
			Object.entries(payload).reverse()
		) as typeof payload;
		const reorderedSource = Object.fromEntries(Object.entries(source).reverse()) as typeof source;
		expect(
			f.store.verifyMailEvent(
				f.identity,
				{ ...reorderedSource, proof },
				reorderedPayload,
				f.agentId
			)
		).toBe(true);
		expect(f.store.mailEventProof(f.pluginId, f.identity, reorderedSource, reorderedPayload)).toBe(
			proof
		);
		expect(
			f.store.verifyMailEvent(
				f.identity,
				{ ...source, proof },
				{ ...payload, sizeBytes: 43 },
				f.agentId
			)
		).toBe(false);
		expect(
			f.store.verifyMailEvent(f.identity, { ...source, proof }, payload, 'foreign-agent')
		).toBe(false);
		f.store.revoke(f.pluginId);
		expect(f.store.verifyMailEvent(f.identity, { ...source, proof }, payload, f.agentId)).toBe(
			false
		);
	});

	it('keeps attachment bytes in one invocation-bound snapshot, enforces exact offsets, and erases on close', async () => {
		const f = await fixture();
		f.setSource(
			'MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="b"\r\n\r\n--b\r\nContent-Type: text/plain; charset=US-ASCII\r\n\r\nbody\r\n--b\r\nContent-Type: application/pdf\r\nContent-Disposition: attachment; filename="safe.pdf"\r\nContent-Transfer-Encoding: base64\r\n\r\nQUJD\r\n--b--\r\n'
		);
		const opened = await f.service.call(
			f.pluginId,
			'mail.openAttachment',
			{ invocationId: f.invocationId, reference: f.reference, partId: '2' },
			() => {}
		);
		expect(opened).toMatchObject({ ok: true, value: { filename: 'safe.pdf', sizeBytes: 3 } });
		if (!opened.ok) throw new Error('Expected synthetic snapshot');
		const snapshotId = (opened.value as { snapshotId: string }).snapshotId;
		const request = {
			invocationId: f.invocationId,
			accountId: f.accountId,
			snapshotId,
			offset: 0,
			limit: 2,
		};
		expect(await f.service.call(f.pluginId, 'mail.readAttachment', request, () => {})).toEqual({
			ok: true,
			value: { dataBase64: 'QUI=', nextOffset: 2, complete: false },
		});
		expect(
			await f.service.call(f.pluginId, 'mail.readAttachment', { ...request, offset: 2 }, () => {})
		).toEqual({ ok: true, value: { dataBase64: 'Qw==', nextOffset: 3, complete: true } });
		expect(
			await f.service.call(
				f.pluginId,
				'mail.closeAttachment',
				{ invocationId: f.invocationId, accountId: f.accountId, snapshotId },
				() => {}
			)
		).toEqual({ ok: true, value: { closed: true } });
		expect(
			await f.service.call(f.pluginId, 'mail.readAttachment', request, () => {})
		).toMatchObject({ ok: false });
		expect(f.connect).toHaveBeenCalledTimes(1);
	});
});

describe('anchored ledger migration and fail-closed restores', () => {
	it('migrates a fresh v1 anchor with empty mail configuration and independent rights', async () => {
		const f = await fixture();
		const ledger = JSON.parse(f.deps.seal.unseal(fs.readFileSync(f.deps.ledgerPath)));
		ledger.version = 1;
		delete ledger.mail;
		fs.writeFileSync(f.deps.ledgerPath, f.deps.seal.seal(JSON.stringify(ledger)));
		const before = f.entryFactory.mock.calls.length;
		const restored = new AuthorizationStore(f.deps);
		expect(restored.readMailConfiguration(f.pluginId, f.identity)).toBeNull();
		expect(JSON.parse(f.deps.seal.unseal(fs.readFileSync(f.deps.ledgerPath))).version).toBe(2);
		expect(() =>
			restored.assertStoredMailAgentRight(
				f.pluginId,
				f.identity,
				f.accountId,
				f.reference.accountRevision,
				f.agentId,
				'read'
			)
		).toThrow();
		expect(f.entryFactory.mock.calls.length).toBe(before);
	});
	it('refuses a malformed sealed v2 mail object before native access', async () => {
		const f = await fixture();
		const ledger = JSON.parse(f.deps.seal.unseal(fs.readFileSync(f.deps.ledgerPath)));
		ledger.mail = { unexpected: 'synthetic malformed mail state' };
		fs.writeFileSync(f.deps.ledgerPath, f.deps.seal.seal(JSON.stringify(ledger)));
		const restored = new AuthorizationStore(f.deps);
		const before = f.entryFactory.mock.calls.length;
		expect(() => restored.readMailConfiguration(f.pluginId, f.identity)).toThrow();
		expect(() =>
			restored.assertStoredMailAgentRight(
				f.pluginId,
				f.identity,
				f.accountId,
				f.reference.accountRevision,
				f.agentId,
				'read'
			)
		).toThrow();
		expect(f.entryFactory.mock.calls.length).toBe(before);
	});
});
