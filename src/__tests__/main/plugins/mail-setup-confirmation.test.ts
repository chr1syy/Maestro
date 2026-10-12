import { afterEach, describe, expect, it } from 'vitest';
import { createMailHostFixture } from '../../helpers/mailHostFixture';
import { MailSetupConfirmation } from '../../../main/plugins/mail-setup-confirmation';
import { MailAccountCredentials } from '../../../main/plugins/mail-account-credentials';

const fixtures: Awaited<ReturnType<typeof createMailHostFixture>>[] = [];
afterEach(() => {
	for (const fixture of fixtures.splice(0)) fixture.dispose();
});

describe('trusted setup identity and confirmation', () => {
	it.each([
		'foreign-frame',
		'foreign-window',
		'foreign-url',
		'no-gesture',
		'wrong-nonce',
		'closed',
	])('denies %s without changing account grants', async (mode) => {
		const f = await createMailHostFixture();
		fixtures.push(f);
		const sender = { webContentsId: 11, frameId: 22, url: 'file:///synthetic/mail-setup.html' };
		const confirmation = new MailSetupConfirmation({
			store: f.store,
			pluginId: f.pluginId,
			identity: f.identity,
			currentSender: () => sender,
			assertSurfaceActive: () => {},
			assertUserGesture: () => {
				if (mode === 'no-gesture') throw new Error('Denied');
			},
			assertAgentActive: () => {},
		});
		const controller = new AbortController();
		const nonce = confirmation.open(sender, controller.signal, {
			kind: 'replaceRights',
			accountId: f.accountId,
			expectedRevision: f.reference.accountRevision,
			agents: [],
		});
		if (mode === 'closed') confirmation.close();
		const caller = {
			...sender,
			...(mode === 'foreign-frame'
				? { frameId: 23 }
				: mode === 'foreign-window'
					? { webContentsId: 12 }
					: mode === 'foreign-url'
						? { url: 'file:///ordinary-spa.html' }
						: {}),
		};
		await expect(
			confirmation.confirm(caller, { nonce: mode === 'wrong-nonce' ? 'wrong' : nonce })
		).rejects.toThrow();
		expect(f.store.readMailConfiguration(f.pluginId, f.identity)?.accounts[0].revision).toBe(
			f.reference.accountRevision
		);
		confirmation.close();
	});
	it('applies a captured exact-account action once and refuses nonce replay', async () => {
		const f = await createMailHostFixture();
		fixtures.push(f);
		const sender = { webContentsId: 11, frameId: 22, url: 'file:///synthetic/mail-setup.html' };
		const confirmation = new MailSetupConfirmation({
			store: f.store,
			pluginId: f.pluginId,
			identity: f.identity,
			currentSender: () => sender,
			assertSurfaceActive: () => {},
			assertUserGesture: () => {},
			assertAgentActive: () => {},
		});
		const nonce = confirmation.open(sender, new AbortController().signal, {
			kind: 'replaceRights',
			accountId: f.accountId,
			expectedRevision: f.reference.accountRevision,
			agents: [],
		});
		await confirmation.confirm(sender, { nonce });
		expect(f.store.readMailConfiguration(f.pluginId, f.identity)?.accounts[0].revision).toBe(
			f.reference.accountRevision + 1
		);
		await expect(confirmation.confirm(sender, { nonce })).rejects.toThrow();
		confirmation.close();
	});
	it('tests authentication only through the fixed configured TLS/LOGIN path without changing state', async () => {
		const f = await createMailHostFixture();
		fixtures.push(f);
		const credentials = new MailAccountCredentials(
			f.store,
			f.pluginId,
			f.identity,
			f.entryFactory,
			{ resolve: async () => ['93.184.216.34'], connect: f.connect }
		);
		await credentials.testAccount(f.accountId, f.reference.accountRevision, f.setup);
		expect(f.commands).toHaveLength(1);
		expect(f.commands[0]).toMatch(/^A1 LOGIN /);
		expect(f.store.readMailConfiguration(f.pluginId, f.identity)?.accounts[0].revision).toBe(
			f.reference.accountRevision
		);
		expect(f.sockets.every((socket) => socket.destroyed)).toBe(true);
	});
});

describe('trusted exact plugin scope editing', () => {
	it('clears agent rights and invalidates the account revision when narrowing plugin scope', async () => {
		const f = await createMailHostFixture();
		fixtures.push(f);
		expect(f.store.setAllowlistScope(f.pluginId, 'mail:read', [f.accountId])).toBe(false);
		const next = await f.credentials.replacePluginRights(
			f.accountId,
			f.reference.accountRevision,
			['read'],
			f.setup
		);
		expect(next.accounts[0].revision).toBe(f.reference.accountRevision + 1);
		expect(
			f.store.readGrants(f.pluginId).find((g) => g.capability === 'mail:body')?.scope
		).toBeUndefined();
		expect(f.store.readGrants(f.pluginId).find((g) => g.capability === 'mail:read')?.scope).toBe(
			f.accountId
		);
		expect(() =>
			f.store.assertStoredMailAgentRight(
				f.pluginId,
				f.identity,
				f.accountId,
				next.accounts[0].revision,
				f.agentId,
				'read'
			)
		).toThrow();
	});
	it('cannot add an unconsented mail capability', async () => {
		const f = await createMailHostFixture();
		fixtures.push(f);
		f.store.mint(f.pluginId, [{ capability: 'mail:accounts', grantedAt: 1 }], f.identity);
		await expect(
			f.credentials.replacePluginRights(
				f.accountId,
				f.reference.accountRevision,
				['attachments'],
				f.setup
			)
		).rejects.toThrow();
		expect(f.store.readGrants(f.pluginId)).toHaveLength(1);
	});
});
