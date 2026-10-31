import { afterEach, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { openBoardDb } from '../../../main/board/board-db';
import { BoardStorageFacade } from '../../../main/board/board-storage';
import { boardMigrationSourceKey } from '../../../main/board/board-migration';
import { discoverBoardSources } from '../../../main/board/board-source-host';
import { listBoardWorkers } from '../../../main/board/board-workspace-storage';

let dir = '';
afterEach(() => {
	if (dir) fs.rmSync(dir, { recursive: true, force: true });
});
it('cold-discovers registered repositories and legacy input, retains closed sources, and edits roles centrally', async () => {
	dir = fs.mkdtempSync(path.resolve('.maestro/board-global-workers-20261031/source-host-'));
	const roots = ['a', 'b'].map((name) => {
		const root = path.join(dir, name);
		fs.mkdirSync(path.join(root, '.maestro'), { recursive: true });
		execFileSync('git', ['init', '--quiet', root]);
		return root;
	});
	const original = Buffer.from(
		JSON.stringify({ boards: [{ id: 'board', name: 'Legacy', cards: [] }] })
	);
	fs.writeFileSync(path.join(roots[0], '.maestro/board.yaml'), original);
	const profiles = Buffer.from(
		JSON.stringify({ profiles: [{ id: 'legacy-role', name: 'Legacy role' }] })
	);
	fs.writeFileSync(path.join(roots[0], '.maestro/profiles.yaml'), profiles);
	const db = openBoardDb(path.join(dir, 'board.sqlite'));
	try {
		const storage = new BoardStorageFacade(db);
		const sessions = roots.map((root, i) => ({ id: `worker-${i}`, dir: root, boardWorker: true }));
		await discoverBoardSources(storage, sessions);
		const first = storage.query();
		expect(first.sources.map((s) => s.location?.path).sort()).toEqual(roots);
		expect(first.collections).toHaveLength(1);
		expect(storage.captureCatalog().repositories).toHaveLength(2);
		expect(
			listBoardWorkers(db).map((w) =>
				Array.isArray(w.payload.allowedRepositoryIds) ? w.payload.allowedRepositoryIds.length : null
			)
		).toEqual([1, 1]);
		const role = storage.upsertRole(roots[0], { id: 'central-role', name: 'Central role' });
		expect(
			storage
				.captureCatalog()
				.profiles.find((p) => p.namespace === role.namespace && p.profile.id === role.profileId)
				?.profile.name
		).toBe('Central role');
		await discoverBoardSources(storage, []);
		await discoverBoardSources(storage, [...sessions].reverse());
		expect(storage.query().collections).toEqual(first.collections);
		expect(storage.captureCatalog().profiles).toHaveLength(2);
		expect(fs.readFileSync(path.join(roots[0], '.maestro/board.yaml'))).toEqual(original);
		expect(fs.readFileSync(path.join(roots[0], '.maestro/profiles.yaml'))).toEqual(profiles);
		expect(db.prepare('SELECT count(*) AS n FROM migrations').get()).toEqual({ n: 2 });
	} finally {
		db.close();
	}
});

it('never treats an SSH session directory as a local migration source', async () => {
	dir = fs.mkdtempSync(path.resolve('.maestro/board-global-workers-20261031/source-remote-'));
	const db = openBoardDb(path.join(dir, 'board.sqlite'));
	try {
		const storage = new BoardStorageFacade(db);
		await discoverBoardSources(storage, [
			{ id: 'remote', dir, boardWorker: true, sessionSshRemoteConfig: { enabled: true } },
		]);
		expect(storage.query().sources).toEqual([]);
		expect(listBoardWorkers(db)).toEqual([]);
	} finally {
		db.close();
	}
});

it('completes repository discovery when the first collection was created before the first catalog read', async () => {
	dir = fs.mkdtempSync(path.resolve('.maestro/board-global-workers-20261031/source-bootstrap-'));
	execFileSync('git', ['init', '--quiet', dir]);
	const db = openBoardDb(path.join(dir, 'board.sqlite'));
	try {
		const storage = new BoardStorageFacade(db);
		const sourceKey = boardMigrationSourceKey({ location: { kind: 'local' }, path: dir });
		storage.workspace.createCollection({
			sourceKey,
			collectionKey: 'first',
			legacyBoardId: 'first',
			expectedRevision: null,
			set: { name: 'First' },
		});
		await discoverBoardSources(storage, [{ id: 'creator', dir }]);
		expect(storage.captureCatalog().repositories).toEqual([
			{ id: `source:${sourceKey}`, workingDirectory: dir, validated: true },
		]);
		expect(storage.query().sources[0].location?.path).toBe(dir);
		expect(storage.query().collections[0].board.name).toBe('First');
		expect(db.prepare('SELECT * FROM migrations').all()).toEqual([]);
	} finally {
		db.close();
	}
});
