import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { openBoardDb } from '../../../main/board/board-db';
import { applyBoardMigration, planBoardMigration } from '../../../main/board/board-migration';
import {
	BoardStorageFacade,
	configureBoardStorage,
	configureBoardCaptureHost,
	addCard,
	updateCard,
	updateCardStatus,
} from '../../../main/board/board-storage';
import type { BoardCaptureCommand, BoardCard } from '../../../shared/board/types';

const transport = vi.hoisted(() => ({
	handlers: new Map<string, (...args: any[]) => any>(),
	event: {} as any,
}));
vi.mock('electron', () => ({
	ipcMain: {
		handle: (key: string, handler: (...args: any[]) => any) => transport.handlers.set(key, handler),
	},
	ipcRenderer: {
		invoke: async (key: string, ...args: unknown[]) =>
			JSON.parse(JSON.stringify(await transport.handlers.get(key)!(transport.event, ...args))),
	},
}));
vi.mock('../../../main/utils/ipcHandler', () => ({
	withIpcErrorLogging:
		(_: unknown, fn: (...args: any[]) => any) =>
		(_event: unknown, ...args: unknown[]) =>
			fn(...args),
}));
vi.mock('../../../main/stores/getters', () => ({ getLiveSessions: () => [] }));
vi.mock('../../../main/board/board-dispatcher', () => ({ applyCardCancel: vi.fn() }));
vi.mock('../../../main/board/board-pr', () => ({ startCardPr: vi.fn() }));
vi.mock('../../../main/utils/logger', () => ({
	logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
import { registerBoardHandlers } from '../../../main/ipc/handlers/board';
import { createBoardApi } from '../../../main/preload/board';

let dir: string;
let db: ReturnType<typeof openBoardDb>;
let facade: BoardStorageFacade;
let agents: { id: string; groupId?: string }[];
let namespace: string;
const api = createBoardApi();
function card(extra: Partial<BoardCard> = {}): BoardCard {
	return {
		id: 'c',
		title: 'Work',
		body: 'Do work',
		parents: [],
		status: 'todo',
		createdAt: '',
		updatedAt: '',
		executionScope: { kind: 'group', groupId: 'g' },
		assigneeAgentId: 'a',
		role: { namespace, profileId: 'role' },
		repositoryId: 'repo',
		workingDirectory: dir,
		...extra,
	};
}
function command(value = card()): BoardCaptureCommand {
	const board = facade.read(dir, 'b');
	return {
		projectRoot: dir,
		boardId: 'b',
		expectedRevision: board.storage!.expectedRevision!,
		card: value,
	};
}
beforeEach(() => {
	dir = fs.mkdtempSync(path.resolve('.maestro/board-global-workers-20261031/capture-'));
	db = openBoardDb(path.join(dir, 'board.sqlite'));
	const plan = planBoardMigration({
		source: { location: { kind: 'local' }, path: dir },
		repository: { id: 'repo', workingDirectory: dir, validated: true },
		profileBytes: Buffer.from(
			JSON.stringify({ profiles: [{ id: 'role', name: 'Role', baseAgentId: 'a' }] })
		),
		workers: [],
		boardBytes: Buffer.from(JSON.stringify({ boards: [{ id: 'b', name: 'Board', cards: [] }] })),
	});
	applyBoardMigration(db, plan);
	namespace = plan.profileNamespace;
	agents = [
		{ id: 'a', groupId: 'g' },
		{ id: 'foreign', groupId: 'other' },
	];
	configureBoardCaptureHost(() => ({ agents, groups: [{ id: 'g' }, { id: 'other' }] }));
	facade = new BoardStorageFacade(db);
	configureBoardStorage(facade);
	const mainFrame = {};
	const webContents = { mainFrame };
	registerBoardHandlers({
		getCueEngine: () => null,
		getMainWindow: () => ({ isDestroyed: () => false, webContents }) as any,
	});
	transport.event = { sender: webContents, senderFrame: mainFrame };
});
afterEach(() => {
	configureBoardStorage(null);
	configureBoardCaptureHost(() => ({ agents: [], groups: [] }));
	db.close();
	fs.rmSync(dir, { recursive: true, force: true });
});

describe('authoritative host capture over real SQLite and preload/IPC', () => {
	it('persists a separate dependent review and leaves work and human review unchanged', async () => {
		const work = await api.captureCard(command(card({ kind: 'work' })));
		if (!work.ok) throw new Error(work.error.message);
		const review = await api.captureCard(
			command(
				card({
					id: 'review',
					kind: 'review',
					parents: ['c'],
					assigneeAgentId: undefined,
					body: 'Branch: topic\nCommit: ' + 'a'.repeat(40) + '\nChecks: passed',
				})
			)
		);
		if (!review.ok) throw new Error(review.error.message);
		const reopened = new BoardStorageFacade(db).read(dir, 'b');
		expect(reopened.cards).toHaveLength(2);
		expect(reopened.cards.find((entry) => entry.id === 'review')).toMatchObject({
			kind: 'review',
			parents: ['c'],
			status: 'todo',
		});
		expect(reopened.cards.find((entry) => entry.id === 'c')).toMatchObject({
			kind: 'work',
			status: 'todo',
		});
	});

	it('captures colliding legacy IDs in the explicitly selected source and adopts returned revisions', async () => {
		const first = await api.captureCard(command());
		if (!first.ok) throw new Error(first.error.message);
		const before = facade.read(dir, 'b');
		const other = path.join(dir, 'second-source');
		fs.mkdirSync(other);
		const plan = planBoardMigration({
			source: { location: { kind: 'local' }, path: other },
			repository: { id: 'second-repo', workingDirectory: other, validated: true },
			profileBytes: Buffer.from(
				JSON.stringify({
					profiles: [{ id: 'role', name: 'Same ID, another role', baseAgentId: 'a' }],
				})
			),
			workers: [],
			boardBytes: Buffer.from(
				JSON.stringify({
					boards: [
						{
							id: 'b',
							name: 'Second board',
							cards: [
								{
									...card(),
									role: undefined,
									repositoryId: undefined,
									workingDirectory: undefined,
									title: 'Second source card',
								},
							],
						},
					],
				})
			),
		});
		applyBoardMigration(db, plan);
		const selected = await api.queryWorkspace({ projectRoot: other });
		if (!selected.ok) throw new Error(selected.error.message);
		const collection = selected.value.collections[0];
		const current = collection.board.cards[0];
		const result = await api.captureCard({
			projectRoot: other,
			boardId: collection.board.id,
			expectedRevision: collection.revision,
			card: {
				...current,
				title: 'Edited second source',
				role: { namespace: plan.profileNamespace, profileId: 'role' },
				profileNamespace: plan.profileNamespace,
				assigneeProfileId: 'role',
				repositoryId: 'second-repo',
				workingDirectory: other,
				startModeOverride: 'approval',
			} as BoardCard,
		});
		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error(result.error.message);
		expect(result.value.storage).toMatchObject({
			sourceKey: collection.sourceKey,
			collectionKey: collection.collectionKey,
			expectedRevision: collection.revision + 1,
		});
		expect(result.value.cards[0]).toMatchObject({
			id: 'c',
			title: 'Edited second source',
			role: { namespace: plan.profileNamespace, profileId: 'role' },
			storageRevision: current.storageRevision! + 1,
			capturePolicy: { dispatchApproval: 'required' },
		});
		expect(facade.read(dir, 'b')).toEqual(before);
		expect(result.readiness.c).toEqual([]);
		expect(
			await api.captureCard({
				projectRoot: other,
				boardId: 'b',
				expectedRevision: collection.revision,
				card: current,
			})
		).toMatchObject({ ok: false, error: { code: 'stale-revision' } });
	});

	it('accepts a full editor snapshot with retained host fields and explicit assignment unsets', async () => {
		const initial = await api.captureCard(command(card({ startModeOverride: 'direct' })));
		if (!initial.ok) throw new Error(initial.error.message);
		const saved = initial.value.cards[0];
		const captured = await api.captureCard(
			command({
				...saved,
				body: 'Edited body with unchanged policy',
				executionScope: { kind: 'agent', agentId: 'a' },
				role: undefined,
				assigneeProfileId: undefined,
				profileNamespace: undefined,
				assigneeAgentId: undefined,
			} as BoardCard)
		);
		expect(captured).toMatchObject({
			ok: true,
			readiness: { c: [] },
			value: {
				cards: [
					expect.objectContaining({
						capturePolicy: expect.objectContaining({
							effectiveStartMode: 'direct',
							dispatchApproval: 'not-required',
						}),
					}),
				],
			},
		});
		const value = facade.read(dir, 'b').cards[0];
		expect(value.role).toBeUndefined();
		expect(value.assigneeAgentId).toBeUndefined();
		expect(value.storageRevision).toBe(saved.storageRevision! + 1);
	});

	it('reads current host/catalog data and persists direct intent with revisions across reopen', async () => {
		const catalog = await api.captureCatalog();
		expect(catalog.agents).toEqual(agents);
		expect(catalog.groups).toHaveLength(2);
		expect(catalog.profiles[0]).toMatchObject({
			namespace,
			profile: { id: 'role', baseAgentId: 'a' },
		});
		expect(catalog.repositories[0]).toMatchObject({
			id: 'repo',
			validated: true,
			workingDirectory: dir,
		});
		expect(catalog.defaultStartMode).toBe('approval');
		const response = await api.captureCard(
			command(card({ startModeOverride: 'direct', kind: 'review' }))
		);
		expect(response.ok).toBe(true);
		if (!response.ok) throw Error(response.error.message);
		expect(response.readiness.c).toEqual([]);
		const saved = response.value.cards[0];
		expect(saved).toMatchObject({
			kind: 'review',
			role: { namespace, profileId: 'role' },
			capturePolicy: {
				effectiveStartMode: 'direct',
				dispatchApproval: 'not-required',
				specificationRevision: saved.storageRevision,
			},
		});
		expect((saved as any).humanReview).toBeUndefined();
		db.close();
		db = openBoardDb(path.join(dir, 'board.sqlite'));
		facade = new BoardStorageFacade(db);
		configureBoardStorage(facade);
		expect(facade.read(dir, 'b').cards[0]).toEqual(saved);
	});
	it.each([
		['foreign pin', { assigneeAgentId: 'foreign' }, 'pin-role-conflict'],
		['foreign role pin', { role: undefined, assigneeAgentId: 'foreign' }, 'pin-outside-scope'],
		['agent scope', { executionScope: { kind: 'agent', agentId: 'foreign' } }, 'pin-outside-scope'],
		[
			'ambiguous profile',
			{ profileNamespace: 'elsewhere', assigneeProfileId: 'role' },
			'invalid-role',
		],
		[
			'repository conflict',
			{ workingDirectory: process.cwd() },
			'Repository and working directory conflict',
		],
	] as const)('rejects %s without writing', async (_, change, message) => {
		const before = facade.query();
		const result = await api.captureCard(command(card(change as any)));
		expect(result).toMatchObject({
			ok: false,
			error: { code: 'invalid-input', message: expect.stringContaining(message) },
		});
		expect(facade.query()).toEqual(before);
	});
	it('re-reads membership and profile pins rather than keeping an initial snapshot', async () => {
		agents = agents.map((agent) => ({ ...agent, groupId: 'other' }));
		expect(await api.captureCard(command())).toMatchObject({
			ok: false,
			error: { message: expect.stringContaining('pin-outside-scope') },
		});
		agents = [{ id: 'a', groupId: 'g' }];
		db.prepare('UPDATE profiles SET payload_json = ?').run(
			JSON.stringify({ id: 'role', name: 'Role', baseAgentId: 'foreign' })
		);
		expect(await api.captureCard(command())).toMatchObject({
			ok: false,
			error: { message: expect.stringContaining('pin-role-conflict') },
		});
	});
	it('captures missing references honestly and reports why they cannot run', async () => {
		const result = await api.captureCard(
			command(
				card({
					executionScope: { kind: 'group', groupId: 'deleted' },
					assigneeAgentId: 'gone',
					role: { namespace: 'deleted', profileId: 'role' },
					repositoryId: 'deleted',
				})
			)
		);
		expect(result).toMatchObject({
			ok: true,
			readiness: {
				c: expect.arrayContaining([
					'group-missing',
					'target-missing',
					'role-missing',
					'repository-unresolved',
				]),
			},
		});
	});
	it('rejects stale collection and card tokens while keeping policy intact', async () => {
		const old = command();
		expect((await api.captureCard(old)).ok).toBe(true);
		const saved = facade.read(dir, 'b').cards[0];
		expect(await api.captureCard(old)).toMatchObject({
			ok: false,
			error: { code: 'stale-revision' },
		});
		expect(
			await api.captureCard(command({ ...saved, storageRevision: saved.storageRevision! + 1 }))
		).toMatchObject({
			ok: false,
			error: { code: 'stale-revision' },
		});
	});
	it('rejects forged authority, remote senders and subframes; ordinary creators cannot relax policy', async () => {
		expect(await api.captureCard({ ...command(), actorAuthority: 'human' } as any)).toMatchObject({
			ok: false,
			error: { code: 'invalid-input' },
		});
		transport.event = { sender: {}, senderFrame: {} };
		expect(await api.captureCard(command(card({ startModeOverride: 'direct' })))).toMatchObject({
			ok: false,
			error: { code: 'protected-field' },
		});
		expect(() => addCard(dir, 'b', card({ startModeOverride: 'direct' }))).toThrow(
			/unauthorized-start-mode/
		);
		expect(() =>
			addCard(dir, 'b', { ...card(), capturePolicy: { effectiveStartMode: 'direct' } } as any)
		).toThrow(/Cannot edit Board field/);
	});
	it('keeps approval and human review separate, resets grants after a specification edit, and blocks forged grants', async () => {
		const first = await api.captureCard(command());
		expect(first.ok).toBe(true);
		let saved = facade.read(dir, 'b').cards[0];
		expect(saved).toMatchObject({
			capturePolicy: { effectiveStartMode: 'approval', dispatchApproval: 'required' },
		});
		// Host grant fixture, independent of CRUD; human review must survive policy recapture.
		const policy = { ...(saved as any).capturePolicy, dispatchApproval: 'granted' };
		db.prepare('UPDATE cards SET payload_json = ?').run(
			JSON.stringify({ ...saved, capturePolicy: policy, humanReview: { state: 'pending' } })
		);
		saved = facade.read(dir, 'b').cards[0];
		expect(() =>
			updateCard(dir, 'b', {
				...saved,
				capturePolicy: { ...policy, dispatchApproval: 'not-required' },
			} as any)
		).toThrow(/Cannot edit Board field/);
		updateCard(dir, 'b', { ...saved, body: 'New specification' });
		saved = facade.read(dir, 'b').cards[0];
		expect(saved).toMatchObject({
			capturePolicy: { dispatchApproval: 'required', specificationRevision: saved.storageRevision },
			humanReview: { state: 'pending' },
		});
		updateCardStatus(dir, 'b', 'c', 'done');
		expect(facade.read(dir, 'b').cards[0]).toMatchObject({
			capturePolicy: { dispatchApproval: 'required' },
			humanReview: { state: 'pending' },
		});
	});

	it('rejects symlink escape and retains missing paths as non-executable drafts', async () => {
		fs.symlinkSync(process.cwd(), path.join(dir, 'escape'));
		expect(
			await api.captureCard(command(card({ workingDirectory: path.join(dir, 'escape') })))
		).toMatchObject({ ok: false, error: { code: 'invalid-input' } });
		const result = await api.captureCard(
			command(card({ workingDirectory: path.join(dir, 'gone') }))
		);
		expect(result).toMatchObject({ ok: true, readiness: { c: ['repository-unresolved'] } });
	});
	it('reports a later membership conflict and deleted role pin from current host state', async () => {
		expect((await api.captureCard(command())).ok).toBe(true);
		agents = [{ id: 'a', groupId: 'other' }];
		expect(facade.captureReadiness(facade.read(dir, 'b')).c).toContain('scope-conflict');
		agents = [];
		expect(facade.captureReadiness(facade.read(dir, 'b')).c).toContain('target-missing');
	});
	it('keeps explicitly approved direct intent on ordinary edits but allows a human to tighten it', async () => {
		expect((await api.captureCard(command(card({ startModeOverride: 'direct' })))).ok).toBe(true);
		let saved = facade.read(dir, 'b').cards[0];
		updateCard(dir, 'b', { ...saved, body: 'Updated direct work' });
		saved = facade.read(dir, 'b').cards[0];
		expect(saved).toMatchObject({
			capturePolicy: { effectiveStartMode: 'direct', dispatchApproval: 'not-required' },
		});
		expect(
			await api.captureCard(command({ ...saved, startModeOverride: 'approval' }))
		).toMatchObject({
			ok: true,
			value: {
				cards: [
					expect.objectContaining({
						capturePolicy: expect.objectContaining({ dispatchApproval: 'required' }),
					}),
				],
			},
		});
	});

	it('rejects ambiguous host identities and validates legacy explicitly namespaced roles without guessing', async () => {
		const qualified = card({
			role: undefined,
			assigneeProfileId: 'role',
			profileNamespace: namespace,
		} as any);
		expect((await api.captureCard(command(qualified))).ok).toBe(true);
		agents = [
			{ id: 'a', groupId: 'g' },
			{ id: 'a', groupId: 'other' },
		];
		expect(
			await api.captureCard(command({ ...facade.read(dir, 'b').cards[0], body: 'Changed' }))
		).toMatchObject({
			ok: false,
			error: { code: 'invalid-input', message: expect.stringContaining('ambiguous identities') },
		});
	});

	it('preserves imported direct intent on metadata edits without changing original migration data', () => {
		// A distinct explicit source for this fixture, never a guessed namespace.
		const other = path.join(dir, 'other');
		fs.mkdirSync(other);
		const imported = planBoardMigration({
			...{
				source: { location: { kind: 'local' as const }, path: other },
				repository: null,
				profileBytes: null,
				workers: [],
			},
			boardBytes: Buffer.from(
				JSON.stringify({
					boards: [
						{
							id: 'legacy',
							name: 'Legacy',
							cards: [
								{
									id: 'old',
									title: 'Old',
									body: '',
									status: 'todo',
									parents: [],
									createdAt: '2026-10-31',
									updatedAt: '2026-10-31',
								},
							],
						},
					],
				})
			),
		});
		applyBoardMigration(db, imported);
		const legacy = facade.read(other, 'legacy');
		const original = (legacy.cards[0] as any).migration;
		updateCard(other, 'legacy', { ...legacy.cards[0], body: 'Edited' });
		const saved = facade.read(other, 'legacy').cards[0];
		expect(saved).toMatchObject({
			capturePolicy: { effectiveStartMode: 'direct', dispatchApproval: 'not-required' },
			migration: original,
		});
	});
	it('rolls back the card and policy together if host policy persistence fails', async () => {
		const before = facade.query();
		db.exec(
			"CREATE TRIGGER fail_policy BEFORE UPDATE ON cards WHEN json_extract(NEW.payload_json, '$.capturePolicy') IS NOT NULL BEGIN SELECT RAISE(ABORT, 'policy write failed'); END"
		);
		await expect(api.captureCard(command())).rejects.toThrow(/policy write failed/);
		expect(facade.query()).toEqual(before);
	});
});
