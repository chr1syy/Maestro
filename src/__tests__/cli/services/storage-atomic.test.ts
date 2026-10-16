import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { once } from 'events';
import { Worker } from 'worker_threads';

vi.mock('fs', async (importOriginal) => {
	const actual = await importOriginal<typeof import('fs')>();
	return {
		...actual,
		writeFileSync: vi.fn(actual.writeFileSync),
		renameSync: vi.fn(actual.renameSync),
	};
});

import { writeSettingValue } from '../../../cli/services/storage';

describe('CLI settings persistence', () => {
	let directory: string;
	let settingsPath: string;
	let original: string;
	let previousUserData: string | undefined;

	beforeEach(() => {
		previousUserData = process.env.MAESTRO_USER_DATA;
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'settings-atomic-'));
		process.env.MAESTRO_USER_DATA = directory;
		settingsPath = path.join(directory, 'maestro-settings.json');
		original = JSON.stringify({
			pluginTrustedKeys: ['fixture-publisher'],
			conductorProfile: 'a'.repeat(600_000),
			fontSize: 14,
		});
		fs.writeFileSync(settingsPath, original);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		if (previousUserData === undefined) delete process.env.MAESTRO_USER_DATA;
		else process.env.MAESTRO_USER_DATA = previousUserData;
		fs.rmSync(directory, { recursive: true, force: true });
	});

	it('preserves publisher trust and the complete settings file after a partial write fails', async () => {
		const actual = await vi.importActual<typeof import('fs')>('fs');
		vi.mocked(fs.writeFileSync).mockImplementationOnce((file, contents, options) => {
			actual.writeFileSync(file, String(contents).slice(0, 524_288), options);
			throw new Error('ENOSPC: interrupted write');
		});

		expect(() => writeSettingValue('fontSize', 18)).toThrow('ENOSPC');
		expect(fs.readFileSync(settingsPath, 'utf8') === original).toBe(true);
		expect(fs.readdirSync(directory)).toEqual(['maestro-settings.json']);
	});

	it('preserves the previous settings if replacing the file fails', () => {
		vi.mocked(fs.renameSync).mockImplementationOnce(() => {
			throw new Error('replacement failed');
		});

		expect(() => writeSettingValue('fontSize', 18)).toThrow('replacement failed');
		expect(fs.readFileSync(settingsPath, 'utf8') === original).toBe(true);
		expect(fs.readdirSync(directory)).toEqual(['maestro-settings.json']);
	});

	it('commits a complete settings edit while retaining publisher trust', () => {
		expect(writeSettingValue('fontSize', 18)).toBe(true);
		expect(JSON.parse(fs.readFileSync(settingsPath, 'utf8'))).toEqual({
			...JSON.parse(original),
			fontSize: 18,
		});
	});

	it('a concurrent reader sees complete settings while the CLI write is paused at 512 KiB', async () => {
		const actual = await vi.importActual<typeof import('fs')>('fs');
		const progress = new Int32Array(new SharedArrayBuffer(8));
		const reader = new Worker(
			`
			const fs = require('fs');
			const { parentPort, workerData } = require('worker_threads');
			const progress = new Int32Array(workerData.progress);
			const read = (phase) => {
				try {
					const settings = JSON.parse(fs.readFileSync(workerData.settingsPath, 'utf8'));
					parentPort.postMessage({ phase, fontSize: settings.fontSize, keys: settings.pluginTrustedKeys });
				} catch (error) {
					parentPort.postMessage({ phase, error: error.name });
				}
			};
			parentPort.postMessage('ready');
			Atomics.wait(progress, 0, 0, 5000);
			read('during');
			Atomics.store(progress, 1, 1);
			Atomics.notify(progress, 1);
			parentPort.once('message', () => read('after'));
			`,
			{ eval: true, workerData: { settingsPath, progress: progress.buffer } }
		);
		try {
			expect(await once(reader, 'message')).toEqual(['ready']);
			vi.mocked(fs.writeFileSync).mockImplementationOnce((file, contents, options) => {
				const payload = String(contents);
				actual.writeFileSync(file, payload.slice(0, 524_288), options);
				Atomics.store(progress, 0, 1);
				Atomics.notify(progress, 0);
				if (Atomics.wait(progress, 1, 0, 5000) === 'timed-out') {
					throw new Error('Concurrent settings reader did not finish');
				}
				actual.appendFileSync(file, payload.slice(524_288), options);
			});
			const during = once(reader, 'message');
			expect(writeSettingValue('fontSize', 18)).toBe(true);
			expect(await during).toEqual([
				{ phase: 'during', fontSize: 14, keys: ['fixture-publisher'] },
			]);
			const after = once(reader, 'message');
			reader.postMessage('read committed settings');
			expect(await after).toEqual([{ phase: 'after', fontSize: 18, keys: ['fixture-publisher'] }]);
		} finally {
			await reader.terminate();
		}
	});
});
