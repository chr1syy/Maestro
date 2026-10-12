import { isPermitted } from '../../shared/plugins/permissions';
import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import { performance } from 'perf_hooks';
import type { AuthorizationStore, AuthIdentity } from './authorization-ledger';
import { MailAccountCredentials } from './mail-account-credentials';
import { mailRecord, type MailSetupNavigationIntent } from './mail-account-config';
import { ImapConnectionError } from './mail-imap-connection';
import { MailSetupConfirmation } from './mail-setup-confirmation';
import type { ConsentSender } from './consent-minter';

interface SetupSurface {
	window: BrowserWindow;
	controller: AbortController;
	identity: AuthIdentity;
	confirmation: MailSetupConfirmation;
	lastActivation: number;
	sender(): ConsentSender;
}

export interface MailSetupWindowDeps {
	store: AuthorizationStore;
	dir: string;
	identityFor(pluginId: string): AuthIdentity;
	agents(): readonly { id: string; name: string }[];
	onChanged(pluginId: string): void;
}

/** Dedicated host page only. Main SPA, plugin guests and tool calls cannot confirm. */
export class MailSetupWindows {
	private readonly surfaces = new Map<string, SetupSurface>();
	constructor(private readonly deps: MailSetupWindowDeps) {
		ipcMain.handle('mail-setup:call', (event, request: unknown) => this.call(event, request));
	}
	closePlugin(pluginId: string): void {
		const surface = this.surfaces.get(pluginId);
		if (!surface) return;
		this.surfaces.delete(pluginId);
		surface.controller.abort();
		surface.confirmation.close();
		if (!surface.window.isDestroyed()) surface.window.close();
	}
	stop(): void {
		for (const id of [...this.surfaces.keys()]) this.closePlugin(id);
	}

	request(pluginId: string, intent: MailSetupNavigationIntent): void {
		const navigation = new MailAccountCredentials(
			this.deps.store,
			pluginId,
			this.deps.identityFor(pluginId)
		).resolveSetupNavigation(intent, {
			signal: new AbortController().signal,
			assertActive: () => {
				this.deps.identityFor(pluginId);
			},
		});
		if (this.surfaces.has(pluginId)) {
			const existing = this.surfaces.get(pluginId)!;
			existing.confirmation.close();
			void existing.window
				.loadFile(path.join(this.deps.dir, 'mail-setup.html'), {
					query: {
						action: navigation.action,
						...('accountId' in navigation ? { accountId: navigation.accountId } : {}),
					},
				})
				.then(() => existing.window.show())
				.catch(() => this.closePlugin(pluginId));
			return;
		}
		if (this.surfaces.size >= 8) throw new ImapConnectionError('MAIL_LIMIT');
		const identity = this.deps.identityFor(pluginId);
		const window = new BrowserWindow({
			width: 640,
			height: 740,
			show: false,
			title: 'Mail account setup',
			autoHideMenuBar: true,
			webPreferences: {
				preload: path.join(this.deps.dir, 'mail-setup-preload.js'),
				contextIsolation: true,
				sandbox: true,
				nodeIntegration: false,
			},
		});
		window.setMenu(null);
		window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
		window.webContents.on('will-navigate', (event) => event.preventDefault());
		window.webContents.on('will-attach-webview', (event) => event.preventDefault());
		const controller = new AbortController();
		const sender = (): ConsentSender => ({
			webContentsId: window.webContents.id,
			frameId: window.webContents.mainFrame.routingId,
			url: window.webContents.mainFrame.url,
		});
		const surface: SetupSurface = {
			window,
			controller,
			identity,
			sender,
			lastActivation: -Infinity,
			confirmation: new MailSetupConfirmation({
				store: this.deps.store,
				pluginId,
				identity,
				currentSender: sender,
				assertSurfaceActive: () => this.assertActive(pluginId, surface),
				assertUserGesture: () => {
					this.assertActive(pluginId, surface);
					if (!window.isFocused() || performance.now() - surface.lastActivation > 1000)
						throw new ImapConnectionError('MAIL_DENIED');
					surface.lastActivation = -Infinity;
				},
				assertAgentActive: (id) => {
					if (!this.deps.agents().some((agent) => agent.id === id))
						throw new ImapConnectionError('MAIL_DENIED');
				},
			}),
		};
		this.surfaces.set(pluginId, surface);
		window.webContents.on('before-input-event', (_event, input) => {
			if (input.type === 'keyDown' && (input.key === 'Enter' || input.key === ' '))
				surface.lastActivation = performance.now();
		});
		window.webContents.on('before-mouse-event', (_event, input) => {
			if (input.type === 'mouseUp' && input.button === 'left')
				surface.lastActivation = performance.now();
		});
		window.once('closed', () => this.closePlugin(pluginId));
		void window
			.loadFile(path.join(this.deps.dir, 'mail-setup.html'), {
				query: {
					action: intent.action,
					...('accountId' in intent ? { accountId: intent.accountId } : {}),
				},
			})
			.then(() => {
				this.assertActive(pluginId, surface);
				window.show();
			})
			.catch(() => this.closePlugin(pluginId));
	}

	private assertActive(pluginId: string, surface: SetupSurface): void {
		if (
			this.surfaces.get(pluginId) !== surface ||
			surface.controller.signal.aborted ||
			surface.window.isDestroyed()
		)
			throw new ImapConnectionError('MAIL_DENIED');
		const current = this.deps.identityFor(pluginId);
		if (
			current.contentHash !== surface.identity.contentHash ||
			current.signerKey !== surface.identity.signerKey ||
			current.signatureStatus !== surface.identity.signatureStatus
		)
			throw new ImapConnectionError('MAIL_DENIED');
	}

	private async call(event: IpcMainInvokeEvent, request: unknown): Promise<unknown> {
		try {
			const pair = [...this.surfaces.entries()].find(
				([, surface]) => surface.window.webContents === event.sender
			);
			if (!pair || event.senderFrame !== event.sender.mainFrame)
				throw new ImapConnectionError('MAIL_DENIED');
			const [pluginId, surface] = pair;
			this.assertActive(pluginId, surface);
			const current = surface.sender();
			if (event.senderFrame.url !== current.url || !current.url.startsWith('file:'))
				throw new ImapConnectionError('MAIL_DENIED');
			const raw = mailRecord(request, ['action'], ['intent', 'nonce', 'password']);
			if (raw.action === 'list') {
				mailRecord(raw, ['action']);
				const accounts = new MailAccountCredentials(
					this.deps.store,
					pluginId,
					surface.identity
				).listStoredAccounts({
					signal: surface.controller.signal,
					assertActive: () => this.assertActive(pluginId, surface),
				});
				const removedAccounts = (
					this.deps.store.readMailConfiguration(pluginId, surface.identity)?.tombstones ?? []
				).map((t) => ({
					accountId: t.accountId,
					revision: t.revision,
					credentialCleanup: t.credentialCleanup,
				}));
				return {
					ok: true,
					pluginId,
					removedAccounts,
					accounts: accounts.map((account) => ({
						...account,
						pluginRights: (['read', 'detail', 'attachments'] as const).filter((right) =>
							isPermitted(
								this.deps.store.readGrants(pluginId),
								right === 'detail'
									? 'mail:body'
									: right === 'attachments'
										? 'mail:attachments'
										: 'mail:read',
								account.accountId
							)
						),
					})),
					agents: this.deps.agents(),
				};
			}
			if (raw.action === 'cancel') {
				mailRecord(raw, ['action']);
				surface.confirmation.close();
				return { ok: true };
			}
			if (raw.action === 'prepare') {
				mailRecord(raw, ['action', 'intent']);
				return {
					ok: true,
					nonce: surface.confirmation.open(current, surface.controller.signal, raw.intent),
				};
			}
			if (raw.action === 'confirm') {
				mailRecord(raw, ['action', 'nonce'], ['password']);
				try {
					await surface.confirmation.confirm(current, {
						nonce: raw.nonce,
						...(Object.prototype.hasOwnProperty.call(raw, 'password')
							? { password: raw.password }
							: {}),
					});
				} finally {
					this.deps.onChanged(pluginId);
				}
				this.assertActive(pluginId, surface);
				return { ok: true };
			}
			throw new ImapConnectionError('MAIL_INVALID');
		} catch (error) {
			return {
				ok: false,
				error: error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE',
			};
		}
	}
}
