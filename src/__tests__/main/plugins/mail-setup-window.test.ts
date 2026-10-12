import { EventEmitter } from 'node:events';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMailHostFixture } from '../../helpers/mailHostFixture';

const { calls, windows } = vi.hoisted(() => ({
	calls: new Map<string, (...args: unknown[]) => Promise<unknown>>(),
	windows: [] as unknown[],
}));
vi.mock('electron', () => ({
	ipcMain: {
		handle: (name: string, handler: (...args: unknown[]) => Promise<unknown>) =>
			calls.set(name, handler),
	},
	BrowserWindow: class extends EventEmitter {
		destroyed = false;
		webContents = Object.assign(new EventEmitter(), {
			id: 11,
			mainFrame: { routingId: 22, url: '' },
			setWindowOpenHandler: vi.fn(),
		});
		constructor(readonly options: unknown) {
			super();
			windows.push(this);
		}
		setMenu() {}
		async loadFile(file: string) {
			this.webContents.mainFrame.url = pathToFileURL(file).href;
		}
		show() {}
		isFocused() {
			return true;
		}
		isDestroyed() {
			return this.destroyed;
		}
		close() {
			this.destroyed = true;
			this.emit('closed');
		}
	},
}));
import { MailSetupWindows } from '../../../main/plugins/mail-setup-window';

interface SyntheticWindow extends EventEmitter {
	webContents: EventEmitter & { mainFrame: { routingId: number; url: string } };
	options: {
		webPreferences: { sandbox: boolean; contextIsolation: boolean; nodeIntegration: boolean };
	};
}
afterEach(() => {
	calls.clear();
	windows.splice(0);
});
describe('dedicated setup main-frame IPC boundary', () => {
	it('refuses the SPA, subframes and missing gestures; applies an exact-account confirmed intent', async () => {
		const f = await createMailHostFixture();
		const changed = vi.fn();
		const setup = new MailSetupWindows({
			store: f.store,
			dir: f.dir,
			identityFor: () => f.identity,
			agents: () => [{ id: f.agentId, name: 'Synthetic' }],
			onChanged: changed,
		});
		try {
			setup.request(f.pluginId, { action: 'rights', accountId: f.accountId });
			const window = windows[0] as SyntheticWindow;
			expect(window.options.webPreferences).toMatchObject({
				sandbox: true,
				contextIsolation: true,
				nodeIntegration: false,
			});
			const handler = calls.get('mail-setup:call')!;
			const frame = window.webContents.mainFrame;
			const call = (request: unknown) =>
				handler({ sender: window.webContents, senderFrame: frame }, request) as Promise<{
					ok: boolean;
					nonce?: string;
					error?: string;
				}>;
			expect(await handler({ sender: {}, senderFrame: frame }, { action: 'list' })).toEqual({
				ok: false,
				error: 'MAIL_DENIED',
			});
			expect(
				await handler({ sender: window.webContents, senderFrame: { ...frame } }, { action: 'list' })
			).toEqual({ ok: false, error: 'MAIL_DENIED' });
			const intent = {
				kind: 'replacePluginRights',
				accountId: f.accountId,
				expectedRevision: f.reference.accountRevision,
				rights: ['read'],
			};
			const denied = await call({ action: 'prepare', intent });
			expect(await call({ action: 'confirm', nonce: denied.nonce, userGesture: true })).toEqual({
				ok: false,
				error: 'MAIL_INVALID',
			});
			expect(await call({ action: 'confirm', nonce: denied.nonce })).toEqual({
				ok: false,
				error: 'MAIL_DENIED',
			});
			const prepared = await call({ action: 'prepare', intent });
			window.webContents.emit('before-input-event', {}, { type: 'keyDown', key: 'Enter' });
			expect(await call({ action: 'confirm', nonce: prepared.nonce })).toEqual({ ok: true });
			expect(f.store.readMailConfiguration(f.pluginId, f.identity)?.accounts[0].revision).toBe(
				f.reference.accountRevision + 1
			);
			const canceled = await call({
				action: 'prepare',
				intent: { ...intent, expectedRevision: f.reference.accountRevision + 1 },
			});
			expect(await call({ action: 'cancel' })).toEqual({ ok: true });
			window.webContents.emit('before-input-event', {}, { type: 'keyDown', key: 'Enter' });
			expect((await call({ action: 'confirm', nonce: canceled.nonce })).ok).toBe(false);
			setup.stop();
			expect((await call({ action: 'list' })).ok).toBe(false);
		} finally {
			setup.stop();
			f.dispose();
		}
	});
});
