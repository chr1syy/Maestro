import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { openBoardDb } from '../../../main/board/board-db';
import { applyBoardMigration, planBoardMigration } from '../../../main/board/board-migration';

const root = path.resolve('.maestro/board-global-workers-20261031');
let dir: string;
afterEach(() => {
	if (dir) fs.rmSync(dir, { recursive: true, force: true });
});

describe('central board migration with SQLite', () => {
	it('rolls back atomically, preserves central state on retry and fences uncertain runs', () => {
		dir = fs.mkdtempSync(path.join(root, 'migration-test-'));
		const file = path.join(dir, 'board.sqlite');
		const input = (name: string, running = false) => {
			const project = path.join(dir, name);
			const card = {
				id: 'card',
				title: 'Work',
				body: '',
				status: running ? 'running' : 'todo',
				parents: [],
				heldByUser: true,
				assigneeAgentId: 'worker',
				unknown: { retained: true },
				runs: running
					? [{ attempt: 1, startedAt: 'then', workerAgentId: 'worker' }]
					: [{ attempt: 1, startedAt: 'then', outcome: 'done' }],
			};
			return {
				source: { location: { kind: 'local' as const }, path: project },
				repository: { id: name, workingDirectory: project, validated: true },
				boardBytes: Buffer.from(JSON.stringify({ boards: [{ id: 'board', name, cards: [card] }] })),
				profileBytes: Buffer.from(JSON.stringify({ profiles: [{ id: 'role', name: 'Role' }] })),
				workers: [{ id: 'worker', dir: project, boardWorker: true }],
			};
		};
		const a = planBoardMigration(input('a'));
		const b = planBoardMigration(input('b', true));
		let db = openBoardDb(file);
		try {
			expect(() =>
				applyBoardMigration(db, a, {
					beforeCommit: () => {
						throw new Error('injected');
					},
				})
			).toThrow('injected');
			for (const table of ['collections', 'cards', 'runs', 'workers', 'migrations'])
				expect(db.prepare(`SELECT count(*) AS n FROM ${table}`).get()).toEqual({ n: 0 });
			db.prepare('INSERT INTO workers VALUES (?,0,1,?)').run('worker', '{"central":true}');
			const first = applyBoardMigration(db, a);
			const second = applyBoardMigration(db, b);
			expect(first.status).toBe('imported');
			expect(second.mapping.boards[0].collectionKey).not.toBe(
				first.mapping.boards[0].collectionKey
			);
			expect(db.prepare('SELECT count(*) AS n FROM cards').get()).toEqual({ n: 2 });
			expect(
				db
					.prepare('SELECT enabled, paused, payload_json FROM workers WHERE agent_id=?')
					.get('worker')
			).toEqual({ enabled: 0, paused: 1, payload_json: '{"central":true}' });
			expect(db.prepare('SELECT count(*) AS n FROM migration_worker_holds').get()).toEqual({
				n: 1,
			});
			const key = first.mapping.boards[0].collectionKey;
			const row = db.prepare('SELECT payload_json FROM cards WHERE collection_key=?').get(key) as {
				payload_json: string;
			};
			const edited = { ...JSON.parse(row.payload_json), title: 'Central edit', heldByUser: true };
			db.prepare('UPDATE cards SET payload_json=? WHERE collection_key=?').run(
				JSON.stringify(edited),
				key
			);
			db.close();
			db = openBoardDb(file);
			const again = applyBoardMigration(db, a);
			expect(again.status).toBe('already-imported');
			expect(again.mapping).toEqual(first.mapping);
			expect(applyBoardMigration(db, b).status).toBe('already-imported');
			const changed = input('a');
			changed.boardBytes = Buffer.from('{"boards":[]}');
			expect(applyBoardMigration(db, planBoardMigration(changed)).status).toBe('source-changed');
			expect(
				JSON.parse(
					(
						db.prepare('SELECT payload_json FROM cards WHERE collection_key=?').get(key) as {
							payload_json: string;
						}
					).payload_json
				)
			).toEqual(edited);
			expect(db.prepare('SELECT count(*) AS n FROM migrations').get()).toEqual({ n: 2 });
			expect(db.pragma('foreign_key_check')).toEqual([]);
		} finally {
			db.close();
		}
	});
});
