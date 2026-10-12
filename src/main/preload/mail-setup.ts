/** Self-contained isolated bridge. Never loaded in the main SPA or a plugin guest. */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
	'mailSetup',
	Object.freeze({
		cancel: () => ipcRenderer.invoke('mail-setup:call', { action: 'cancel' }),
		list: () => ipcRenderer.invoke('mail-setup:call', { action: 'list' }),
		prepare: (intent: unknown) =>
			ipcRenderer.invoke('mail-setup:call', { action: 'prepare', intent }),
		confirm: (nonce: string, password?: string) =>
			ipcRenderer.invoke('mail-setup:call', {
				action: 'confirm',
				nonce,
				...(password === undefined ? {} : { password }),
			}),
	})
);
