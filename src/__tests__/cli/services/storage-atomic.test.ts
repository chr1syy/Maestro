import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

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
});
