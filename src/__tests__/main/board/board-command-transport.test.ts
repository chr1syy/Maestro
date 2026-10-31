// @vitest-environment node
import { afterAll, beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import WebSocket from 'ws';
import { buildSync } from 'esbuild';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { openBoardDb } from '../../../main/board/board-db';
import { applyBoardMigration, planBoardMigration } from '../../../main/board/board-migration';
import {
	BoardStorageFacade,
	configureBoardStorage,
	configureBoardCaptureHost,
} from '../../../main/board/board-storage';
import { executeBoardCommand } from '../../../main/board/board-command-host';
import { handleBoardCommand } from '../../../main/web-server/handlers/messageHandlers/board';
import { startRuntimeServer, type RuntimeServer } from '../../../shared/maestro-lib/runtime/server';
import { createMaestroRuntime, type MaestroRuntime } from '../../../shared/maestro-lib/runtime';
import { BridgeConnection } from '../../../shared/maestro-lib/client/bridge-connection';
import { writeCliServerInfoTo } from '../../../shared/maestro-lib/client/discovery';
import { requestBoardCommand } from '../../../shared/maestro-lib/client/board';
import type { BoardCommand, BoardCommandReply } from '../../../shared/board/commands';
import type { Board, BoardCard } from '../../../shared/board/types';
import { CLI_SECRET_HEADER } from '../../../shared/webLogin';

vi.mock('../../../main/utils/logger', () => ({
	logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../../main/utils/sentry', () => ({ captureException: vi.fn() }));

let cliBuildDir: string;
beforeAll(() => {
	cliBuildDir = fs.mkdtempSync(path.resolve('.maestro/board-global-workers-20261031/cli-build-'));
	buildSync({
		entryPoints: ['src/cli/index.ts'],
		outfile: path.join(cliBuildDir, 'cli.cjs'),
		bundle: true,
		platform: 'node',
		packages: 'external',
		logLevel: 'silent',
	});
});
afterAll(() => fs.rmSync(cliBuildDir, { recursive: true, force: true }));
async function cli(...args: string[]) {
	try {
		const output = await promisify(execFile)(
			'node',
			[path.join(cliBuildDir, 'cli.cjs'), 'board', ...args],
			{
				env: { ...process.env, MAESTRO_USER_DATA: dir },
				timeout: 15000,
			}
		);
		return { code: 0, value: JSON.parse(output.stdout) };
	} catch (error) {
		const failure = error as { code: number; stdout: string; stderr: string };
		return {
			code: failure.code,
			value: failure.stdout ? JSON.parse(failure.stdout) : { stderr: failure.stderr },
		};
	}
}

let dir: string;
let db: ReturnType<typeof openBoardDb>;
let facade: BoardStorageFacade;
let runtime: MaestroRuntime;
let server: RuntimeServer;
let connection: BridgeConnection;
let agents: { id: string; groupId?: string }[];
let roots: string[];
let namespaces: string[];
const result = <T>(reply: BoardCommandReply): T => {
	if (!reply.ok) throw new Error(reply.error.message);
	return reply.value as T;
};
function card(extra: Partial<BoardCard> = {}): BoardCard {
	return {
		id: 'c',
		title: 'Work',
		body: 'Work instructions',
		parents: [],
		status: 'todo',
		createdAt: '',
		updatedAt: '',
		executionScope: { kind: 'group', groupId: 'g' },
		assigneeAgentId: 'a',
		repositoryId: 'repo0',
		workingDirectory: roots[0],
		...extra,
	};
}
function target(index = 0) {
	const board = facade.read(roots[index], 'b');
	return {
		projectRoot: roots[index],
		sourceKey: board.storage!.sourceKey,
		collectionKey: board.storage!.collectionKey,
		expectedRevision: board.storage!.expectedRevision!,
	};
}
function capture(value = card(), index = 0): BoardCommand {
	const selected = target(index);
	return {
		action: 'capture',
		target: selected,
		capture: {
			projectRoot: selected.projectRoot,
			boardId: 'b',
			expectedRevision: selected.expectedRevision,
			card: value,
		},
	};
}
const send = (command: BoardCommand) => requestBoardCommand(connection, command);
const raw = (fields: Record<string, unknown>) =>
	connection.sendCommand<BoardCommandReply>(
		{ type: 'board_command', ...fields },
		'board_command_result'
	);

beforeEach(async () => {
	dir = fs.mkdtempSync(path.resolve('.maestro/board-global-workers-20261031/transport-'));
	roots = [path.join(dir, 'one'), path.join(dir, 'two')];
	db = openBoardDb(path.join(dir, 'board.sqlite'));
	namespaces = roots.map((root, i) => {
		fs.mkdirSync(root);
		const plan = planBoardMigration({
			source: { location: { kind: 'local' }, path: root },
			repository: { id: `repo${i}`, workingDirectory: root, validated: true },
			profileBytes: Buffer.from(
				JSON.stringify({ profiles: [{ id: 'role', name: 'Role', baseAgentId: 'a' }] })
			),
			workers: [],
			boardBytes: Buffer.from(
				JSON.stringify({ boards: [{ id: 'b', name: `Board ${i}`, cards: [] }] })
			),
		});
		applyBoardMigration(db, plan);
		return plan.profileNamespace;
	});
	fs.writeFileSync(
		path.join(dir, 'maestro-settings.json'),
		JSON.stringify({ encoreFeatures: { board: true } })
	);
	fs.writeFileSync(
		path.join(dir, 'maestro-sessions.json'),
		JSON.stringify({
			sessions: [
				{ id: 'creator', name: 'Creator', toolType: 'codex', projectRoot: roots[0], cwd: roots[0] },
				{ id: 'a', name: 'A', toolType: 'codex', projectRoot: roots[0] },
				{ id: 'foreign', name: 'Foreign', toolType: 'codex', projectRoot: roots[1] },
			],
		})
	);
	agents = [{ id: 'creator' }, { id: 'a', groupId: 'g' }, { id: 'foreign', groupId: 'other' }];
	configureBoardCaptureHost(() => ({ agents, groups: [{ id: 'g' }, { id: 'other' }] }));
	facade = new BoardStorageFacade(db);
	configureBoardStorage(facade);
	const started = await createMaestroRuntime({
		dataDir: dir,
		mode: 'host',
		deps: { watchDirectory: () => ({ close() {} }) },
	});
	if (!started.ok) throw new Error(started.refusal.message);
	runtime = started.runtime;
	server = await startRuntimeServer({
		runtime,
		token: 'fixture-token',
		cliSecret: 'fixture-secret',
		boardHost: executeBoardCommand,
		onStopRequested() {},
	});
	writeCliServerInfoTo(dir, {
		port: server.port,
		token: 'fixture-token',
		cliSecret: 'fixture-secret',
		pid: process.pid,
		startedAt: Date.now(),
		hostKind: 'headless',
	});
	connection = new BridgeConnection({ userDataDir: dir, strictReplies: true });
	await connection.connect();
});
afterEach(async () => {
	connection?.disconnect();
	await server?.close();
	await runtime?.connection.close();
	configureBoardStorage(null);
	configureBoardCaptureHost(() => ({ agents: [], groups: [] }));
	db?.close();
	fs.rmSync(dir, { recursive: true, force: true });
});

describe('Board through native runtime/WebSocket and real SQLite', () => {
	it('uses central sources, current host register and explicit colliding legacy identities', async () => {
		const catalog = await send({ action: 'catalog' });
		expect(catalog).toMatchObject({
			ok: true,
			value: { agents: expect.arrayContaining([{ id: 'creator' }]) },
		});
		expect(db.prepare('SELECT * FROM workers').all()).toEqual([]);
		const first = result<Board>(await send(capture()));
		const second = result<Board>(
			await send(
				capture(
					card({ repositoryId: 'repo1', workingDirectory: roots[1], title: 'Second source' }),
					1
				)
			)
		);
		expect(first.cards[0].id).toBe(second.cards[0].id);
		expect(first.storage!.sourceKey).not.toBe(second.storage!.sourceKey);
		expect(await send({ action: 'query', query: {} })).toMatchObject({
			ok: true,
			value: { collections: [expect.anything(), expect.anything()] },
		});
		expect(
			await send({ action: 'query', query: { sourceKey: second.storage!.sourceKey } })
		).toMatchObject({
			ok: true,
			value: {
				collections: [
					expect.objectContaining({
						board: expect.objectContaining({
							cards: [expect.objectContaining({ title: 'Second source' })],
						}),
					}),
				],
			},
		});
		const edited = result<Board>(await send(capture({ ...second.cards[0], title: 'Edited' }, 1)));
		expect(edited.cards[0].storageRevision).toBe(second.cards[0].storageRevision! + 1);
		expect(facade.read(roots[0], 'b')).toEqual(first);
	});

	it('rejects source/collection mismatch, stale collection/card revisions and invalid query without writes', async () => {
		const old = capture();
		const saved = result<Board>(await send(old));
		const before = facade.query();
		expect(await send(old)).toMatchObject({ ok: false, error: { code: 'stale-revision' } });
		expect(await send(capture({ ...saved.cards[0], storageRevision: 900 }))).toMatchObject({
			ok: false,
			error: { code: 'stale-revision' },
		});
		expect(
			await raw({
				...capture(saved.cards[0]),
				target: { ...target(), collectionKey: target(1).collectionKey },
			})
		).toMatchObject({ ok: false, error: { code: 'not-found' } });
		expect(await send({ action: 'query', query: { sourceKey: 'missing' } })).toMatchObject({
			ok: false,
			error: { code: 'legacy-mapping-missing' },
		});
		expect(await raw({ action: 'query', query: { surprise: true } })).toMatchObject({
			ok: false,
			error: { code: 'invalid-input' },
		});
		expect(facade.query()).toEqual(before);
	});

	it('re-reads membership and rejects foreign pins, incompatible roles and repository escape', async () => {
		for (const change of [
			{ assigneeAgentId: 'foreign' },
			{ role: { namespace: namespaces[0], profileId: 'role' }, assigneeAgentId: 'foreign' },
			{ workingDirectory: roots[1] },
		]) {
			expect(await send(capture(card(change)))).toMatchObject({
				ok: false,
				error: { code: 'invalid-input' },
			});
		}
		agents = agents.map((agent) => (agent.id === 'a' ? { ...agent, groupId: 'other' } : agent));
		expect(await send(capture())).toMatchObject({
			ok: false,
			error: { code: 'invalid-input', message: expect.stringContaining('pin-outside-scope') },
		});
		expect(facade.read(roots[0], 'b').cards).toEqual([]);
	});

	it('refuses authority forgery at each envelope and never grants approval through status or capture', async () => {
		const command = capture();
		if (command.action !== 'capture') throw new Error('fixture');
		for (const forged of [
			{ ...command, human: true },
			{ ...command, actorAuthority: 'human' },
			{ ...command, capture: { ...command.capture, human: true } },
			{
				...command,
				capture: { ...command.capture, card: { ...command.capture.card, actorAuthority: 'human' } },
			},
		]) {
			expect(await raw(forged)).toMatchObject({ ok: false, error: { code: 'invalid-input' } });
		}
		expect(await send(capture(card({ startModeOverride: 'direct' })))).toMatchObject({
			ok: false,
			error: { code: 'invalid-input', message: expect.stringContaining('unauthorized-start-mode') },
		});
		let saved = result<Board>(await send(command));
		expect(
			await send(
				capture({
					...saved.cards[0],
					capturePolicy: { ...saved.cards[0].capturePolicy!, dispatchApproval: 'granted' },
				})
			)
		).toMatchObject({ ok: false, error: { code: 'protected-field' } });
		expect(
			await raw({
				action: 'status',
				target: target(),
				cardId: 'c',
				cardRevision: saved.cards[0].storageRevision,
				status: 'ready',
			})
		).toMatchObject({ ok: false, error: { code: 'invalid-input' } });
		saved = result<Board>(
			await send({
				action: 'status',
				target: target(),
				cardId: 'c',
				cardRevision: saved.cards[0].storageRevision!,
				status: 'done',
			})
		);
		expect(saved.cards[0].capturePolicy!.dispatchApproval).toBe('required');
	});

	it('preserves authorized direct collection intent for ordinary creators', async () => {
		const board = facade.read(roots[0], 'b');
		// Fixture of a collection whose owner already authorized direct planning.
		db.prepare(
			"UPDATE collections SET payload_json = json_set(payload_json, '$.defaultStartMode', 'direct') WHERE source_key = ? AND collection_key = ?"
		).run(board.storage!.sourceKey, board.storage!.collectionKey);
		const saved = result<Board>(await send(capture(card({ startModeOverride: 'direct' }))));
		expect(saved.cards[0].capturePolicy).toMatchObject({
			effectiveStartMode: 'direct',
			dispatchApproval: 'not-required',
		});
	});

	it('runs revision-bound CRUD on the same persisted facade and refuses wrong create sources', async () => {
		expect(
			await send({
				action: 'create',
				projectRoot: roots[0],
				sourceKey: target(1).sourceKey,
				name: 'Wrong',
			})
		).toMatchObject({ ok: false, error: { code: 'identity-mismatch' } });
		const created = result<Board>(
			await send({
				action: 'create',
				projectRoot: roots[0],
				sourceKey: target().sourceKey,
				name: 'New',
			})
		);
		expect(facade.read(roots[0], created.id).name).toBe('New');
		const saved = result<Board>(await send(capture()));
		const renamed = result<Board>(
			await send({ action: 'rename', target: target(), name: 'Renamed' })
		);
		expect(renamed.name).toBe('Renamed');
		expect(
			await send({ action: 'delete-card', target: target(), cardId: 'c', cardRevision: 999 })
		).toMatchObject({ ok: false, error: { code: 'stale-revision' } });
		expect(
			result<Board>(
				await send({
					action: 'delete-card',
					target: target(),
					cardId: 'c',
					cardRevision: saved.cards[0].storageRevision!,
				})
			).cards
		).toEqual([]);
		expect((await send({ action: 'delete', target: target() })).ok).toBe(true);
	});

	it('preserves the caller revision if another SQLite connection writes between host query and CRUD', async () => {
		const selected = target();
		const otherDb = openBoardDb(path.join(dir, 'board.sqlite'));
		const query = facade.query.bind(facade);
		const spy = vi.spyOn(facade, 'query').mockImplementationOnce((filter) => {
			const snapshot = query(filter);
			const other = new BoardStorageFacade(otherDb);
			const board = other.read(roots[0], 'b');
			board.name = 'Concurrent writer';
			other.save(roots[0], [board]);
			return snapshot;
		});
		try {
			expect(
				await send({ action: 'rename', target: selected, name: 'Stale writer' })
			).toMatchObject({ ok: false, error: { code: 'stale-revision' } });
			expect(facade.read(roots[0], 'b').name).toBe('Concurrent writer');
		} finally {
			spy.mockRestore();
			otherDb.close();
		}
	});

	it('rolls back capture and policy together on a real SQLite write failure', async () => {
		const before = facade.query();
		db.exec(
			"CREATE TRIGGER fail_transport_policy BEFORE UPDATE ON cards WHEN json_extract(NEW.payload_json, '$.capturePolicy') IS NOT NULL BEGIN SELECT RAISE(ABORT, 'fixture policy failure'); END"
		);
		expect(await send(capture())).toMatchObject({
			type: 'error',
			success: false,
			error: expect.stringContaining('fixture policy failure'),
		});
		expect(facade.query()).toEqual(before);
	});

	it('rejects unauthenticated native WebSocket upgrades', async () => {
		const status = await new Promise<number>((resolve, reject) => {
			const socket = new WebSocket(`ws://127.0.0.1:${server.port}/fixture-token/ws`, {
				headers: { [CLI_SECRET_HEADER]: 'wrong-secret' },
			});
			socket.on('unexpected-response', (_request, response) => {
				response.resume();
				socket.terminate();
				resolve(response.statusCode!);
			});
			socket.on('error', reject);
		});
		expect(status).toBe(401);
	});

	it('routes the desktop handler to the same host and rejects revoked sessions', async () => {
		const frames: Record<string, unknown>[] = [];
		const socket = {
			readyState: WebSocket.OPEN,
			send: (frame: string) => frames.push(JSON.parse(frame)),
		};
		const context = {
			send: (_client: unknown, frame: Record<string, unknown>) => frames.push(frame),
			reportHandlerError: vi.fn(),
		} as any;
		const client = { id: 'fixture', socket, isAuthorized: () => true } as any;
		await handleBoardCommand(context, client, {
			type: 'board_command',
			requestId: 'desktop-query',
			action: 'query',
			query: {},
		});
		await vi.waitFor(() =>
			expect(frames).toContainEqual(
				expect.objectContaining({
					type: 'board_command_result',
					requestId: 'desktop-query',
					ok: true,
				})
			)
		);
		client.isAuthorized = () => false;
		await handleBoardCommand(context, client, {
			type: 'board_command',
			requestId: 'revoked',
			...capture(),
		});
		expect(frames[1]).toMatchObject({
			requestId: 'revoked',
			ok: false,
			error: { code: 'protected-field' },
		});
		expect(facade.read(roots[0], 'b').cards).toEqual([]);
	});
});

describe('actual CLI parser, commands, authenticated host and SQLite', () => {
	it('captures as an unregistered creator and round-trips explicit identity, revision, scope, role and repository', async () => {
		const selected = target();
		const common = [
			'--agent',
			'creator',
			'--source',
			selected.sourceKey,
			'--collection',
			selected.collectionKey,
			'--json',
		];
		expect((await cli('list', '--json')).value).toHaveLength(2);
		expect((await cli('list', '--source', selected.sourceKey, '--json')).value).toHaveLength(1);
		expect(
			(await cli('list', '--collection', selected.collectionKey, '--json')).value
		).toHaveLength(1);
		expect((await cli('show', 'b', '--json')).value.details.message).toContain('ambiguous');
		expect(
			(
				await cli(
					'add-card',
					'b',
					'--title',
					'Captured',
					'--scope-group',
					'g',
					'--assignee-agent',
					'a',
					'--assignee',
					'role',
					'--profile-namespace',
					namespaces[0],
					'--repository',
					'repo0',
					'--working-directory',
					roots[0],
					'--start-mode',
					'approval',
					'--revision',
					String(selected.expectedRevision),
					...common
				)
			).code
		).toBe(0);
		let saved = facade.read(roots[0], 'b');
		const id = saved.cards[0].id;
		expect(saved.cards[0]).toMatchObject({
			title: 'Captured',
			role: { namespace: namespaces[0], profileId: 'role' },
			executionScope: { kind: 'group', groupId: 'g' },
			capturePolicy: { dispatchApproval: 'required' },
		});
		expect(db.prepare('SELECT * FROM workers').all()).toEqual([]);
		expect(
			(
				await cli(
					'update-card',
					id,
					'--title',
					'Edited',
					'--card-revision',
					String(saved.cards[0].storageRevision),
					...common
				)
			).code
		).toBe(0);
		saved = facade.read(roots[0], 'b');
		expect(saved.cards[0].title).toBe('Edited');
		expect((await cli('rename', 'b', 'Renamed', ...common)).code).toBe(0);
		expect((await cli('show', 'b', ...common)).value.name).toBe('Renamed');
		expect(
			(
				await cli(
					'remove-card',
					id,
					'--card-revision',
					String(saved.cards[0].storageRevision),
					...common
				)
			).code
		).toBe(0);
		expect(facade.read(roots[0], 'b').cards).toEqual([]);
		const created = await cli(
			'create',
			'Created',
			'--max-in-progress',
			'2',
			'--auto-decompose',
			...common
		);
		expect(created).toMatchObject({
			code: 0,
			value: { name: 'Created', maxInProgress: 2, autoDecompose: true },
		});
		expect((await cli('delete', 'b', ...common)).code).toBe(0);
		expect(facade.read(roots[1], 'b').name).toBe('Board 1');
	});

	it('rejects stale revisions, foreign pins, repository escapes, membership changes and authority flags without writes', async () => {
		const common = ['--project-root', roots[0], '--source', target().sourceKey, '--json'];
		const captureArgs = ['add-card', 'b', '--title', 'Invalid', '--scope-group', 'g'];
		for (const flags of [
			['--assignee-agent', 'foreign'],
			['--repository', 'repo0', '--working-directory', roots[1]],
			['--revision', '999'],
			['--start-mode', 'direct'],
			['--scope-agent', 'a'],
			['--revision', '-1'],
		]) {
			const reply = await cli(...captureArgs, ...flags, ...common);
			expect(reply.code).toBe(1);
			expect(reply.value.details).toMatchObject({ code: expect.any(String) });
		}
		for (const flag of ['--human', '--actor-authority'])
			expect((await cli(...captureArgs, flag, 'true', ...common)).code).toBe(1);
		expect(facade.read(roots[0], 'b').cards).toEqual([]);
		agents = agents.map((agent) => (agent.id === 'a' ? { ...agent, groupId: 'other' } : agent));
		expect(
			(await cli(...captureArgs, '--assignee-agent', 'a', ...common)).value.details.captureErrors
		).toContain('pin-outside-scope');
	});

	it('preserves source/card collisions, current card revisions and approval on status patches while allowing authorized direct capture', async () => {
		const first = result<Board>(await send(capture()));
		await send(capture(card({ repositoryId: 'repo1', workingDirectory: roots[1] }), 1));
		expect(
			(await cli('update-card', 'c', '--title', 'Ambiguous', '--json')).value.details.message
		).toContain('ambiguous');
		const common = ['--project-root', roots[0], '--source', target().sourceKey, '--json'];
		expect(
			(await cli('update-card', 'c', '--title', 'Stale', '--card-revision', '999', ...common)).value
				.details.code
		).toBe('stale-revision');
		expect(
			(await cli('rename', 'b', 'Stale', '--revision', '999', ...common)).value.details.code
		).toBe('stale-revision');
		expect((await cli('set-status', 'c', 'ready', ...common)).value.details.code).toBe(
			'invalid-input'
		);
		expect((await cli('set-status', 'c', 'done', ...common)).code).toBe(0);
		expect(facade.read(roots[0], 'b').cards[0].capturePolicy!.dispatchApproval).toBe('required');
		expect(facade.read(roots[1], 'b').cards[0].title).toBe('Work');
		db.prepare(
			"UPDATE collections SET payload_json = json_set(payload_json, '$.defaultStartMode', 'direct') WHERE source_key = ? AND collection_key = ?"
		).run(first.storage!.sourceKey, first.storage!.collectionKey);
		expect(
			(
				await cli(
					'add-card',
					'b',
					'--title',
					'Direct',
					'--scope-agent',
					'a',
					'--repository',
					'repo0',
					'--working-directory',
					roots[0],
					'--start-mode',
					'direct',
					...common
				)
			).code
		).toBe(0);
		expect(facade.read(roots[0], 'b').cards[1].capturePolicy!.dispatchApproval).toBe(
			'not-required'
		);
	});
});

it('reports an unavailable owning host as machine-readable CLI error without local DB fallback', async () => {
	fs.unlinkSync(path.join(dir, 'cli-server.json'));
	expect(await cli('list', '--json')).toMatchObject({
		code: 1,
		value: { details: { code: 'runtime-unavailable' } },
	});
});

it('updates canonical roles without legacy aliases and refuses CLI human review approval on the host', async () => {
	const saved = result<Board>(
		await send(capture(card({ role: { namespace: namespaces[0], profileId: 'role' } })))
	);
	const common = ['--project-root', roots[0], '--source', target().sourceKey, '--json'];
	expect(
		(await cli('update-card', 'c', '--profile-namespace', namespaces[0], ...common)).code
	).toBe(0);
	expect(facade.read(roots[0], 'b').cards[0].role).toEqual(saved.cards[0].role);
	await cli('set-status', 'c', 'review', ...common);
	expect((await cli('set-status', 'c', 'done', ...common)).value.details.code).toBe(
		'protected-field'
	);
	expect(facade.read(roots[0], 'b').cards[0].status).toBe('review');
	for (const status of ['todo', 'blocked', 'done'])
		expect((await cli('set-status', 'c', status, ...common)).value.details.code).toBe(
			'protected-field'
		);
	const reviewing = facade.read(roots[0], 'b').cards[0];
	expect(await send(capture({ ...reviewing, status: 'done' }))).toMatchObject({
		ok: false,
		error: { code: 'protected-field' },
	});
});
