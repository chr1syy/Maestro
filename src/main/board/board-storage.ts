/** Central Board facade. Legacy project roots resolve only to explicitly registered or imported sources.
 * YAML is migration input only; no fallback reader or exporter exists here.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type Database from 'better-sqlite3';
import {
	validateBoard,
	validateBoardCard,
	CARD_STATUSES,
	type Board,
	type BoardCard,
	type CardStatus,
	type BoardStorageRef,
	type BoardWorkspaceQuery,
	type BoardWorkspaceQueryResult,
	type CardRun,
	type BoardCaptureCatalog,
	type BoardCaptureCommand,
} from '../../shared/board/types';
import {
	evaluateCaptureReadiness,
	validateCapture,
	type BoardCaptureContext,
} from '../../shared/board/domain';
import { hasCycle } from '../../shared/board/graph';
import { canonicalJson } from '../../shared/canonicalJson';
import { generateUUID } from '../../shared/uuid';
import { resolveUserDataDir } from '../../shared/userDataDir';
import { createKeyedWriteQueue } from '../../shared/keyedWriteQueue';
import { logger } from '../utils/logger';
import { isPathWithin, foldPathCase } from '../utils/real-path-containment';
import { openBoardDb } from './board-db';
import { boardMigrationSourceKey } from './board-migration';
import {
	BoardWorkspaceStorage,
	listBoardWorkers as listStoredBoardWorkers,
	listBoardWorkerAccessOptions as listStoredBoardWorkerAccessOptions,
	registerBoardWorker as registerStoredBoardWorker,
	setBoardWorkerPaused as setStoredBoardWorkerPaused,
	setBoardWorkerEnabled as setStoredBoardWorkerEnabled,
	setBoardWorkerAccess as setStoredBoardWorkerAccess,
	BoardWorkspaceStorageError,
	BOARD_CARD_EDITABLE_FIELDS,
	BOARD_COLLECTION_EDITABLE_FIELDS,
	type BoardCollectionSnapshot,
	type BoardCollectionWrite,
	type BoardWorkspacePatch,
	type BoardCardWrite,
} from './board-workspace-storage';

/** Changes to these fields invalidate a dispatch grant, independently of human review. */
const BOARD_CAPTURE_SPEC_FIELDS = [
	'title',
	'body',
	'parents',
	'kind',
	'executionScope',
	'assigneeAgentId',
	'assigneeProfileId',
	'profileNamespace',
	'role',
	'repositoryId',
	'workingDirectory',
	'startModeOverride',
	'worktree',
	'prOnDone',
] as const;

export { BoardWorkspaceStorageError as BoardStorageError } from './board-workspace-storage';
export type BoardSavedListener = (projectRoot: string, boards: Board[]) => void;
let boardSavedListener: BoardSavedListener | null = null;
export function setBoardSavedListener(listener: BoardSavedListener | null): void {
	boardSavedListener = listener;
}

/** Default local identity is exactly the canonical project-root identity used at import.
 * No file discovery/import, repository fallback, remote guessing, or YAML reads.
 * Custom/SSH identities must be supplied explicitly by the host resolver.
 */
export function resolveLocalBoardSourceKeys(projectRoot: string): string[] {
	try {
		return [
			boardMigrationSourceKey({ location: { kind: 'local' }, path: fs.realpathSync(projectRoot) }),
		];
	} catch {
		throw new BoardWorkspaceStorageError(
			'legacy-mapping-missing',
			'Canonical local Board source unavailable'
		);
	}
}

let hostRegisters: () => Pick<BoardCaptureCatalog, 'agents' | 'groups'> = () => ({
	agents: [],
	groups: [],
});
/** Host startup supplies live stores; the callback is re-read on every command. */
export function configureBoardCaptureHost(provider: typeof hostRegisters): void {
	hostRegisters = provider;
}

/** Injectable facade: fixtures and host share the same SQLite adapter and source resolver. */
export class BoardStorageFacade {
	readonly workspace: BoardWorkspaceStorage;
	constructor(
		readonly db: Database.Database,
		readonly resolveSourceKeys: (
			projectRoot: string
		) => readonly string[] = resolveLocalBoardSourceKeys
	) {
		this.workspace = new BoardWorkspaceStorage(db);
	}

	captureCatalog(): BoardCaptureCatalog {
		const registers = hostRegisters();
		for (const entries of [registers.agents, registers.groups]) {
			if (
				entries.some((entry) => typeof entry.id !== 'string' || !entry.id.trim()) ||
				new Set(entries.map((entry) => entry.id)).size !== entries.length
			)
				throw new BoardWorkspaceStorageError(
					'invalid-input',
					'Host register has missing or ambiguous identities'
				);
		}

		const profiles = this.db
			.prepare(
				'SELECT profile_namespace, payload_json FROM profiles ORDER BY profile_namespace, id'
			)
			.all() as { profile_namespace: string; payload_json: string }[];
		const repositories = this.db
			.prepare('SELECT id, payload_json FROM repositories ORDER BY id')
			.all() as { id: string; payload_json: string }[];
		return {
			...registers,
			profiles: profiles.map((row) => ({
				namespace: row.profile_namespace,
				profile: JSON.parse(row.payload_json),
			})),
			repositories: repositories.map((row) => ({ ...JSON.parse(row.payload_json), id: row.id })),
			defaultStartMode: 'approval',
		};
	}
	captureContext(board: Board, human = false): BoardCaptureContext {
		const catalog = this.captureCatalog();
		return {
			...catalog,
			defaultStartMode: board.defaultStartMode === 'direct' ? 'direct' : 'approval',
			canRelaxStartPolicy: human,
		};
	}

	captureReadiness(board: Board) {
		const catalog = this.captureCatalog();
		return Object.fromEntries(
			board.cards.map((card) => {
				const reasons = evaluateCaptureReadiness(card, {
					...this.captureContext(board),
					repositoryIds: catalog.repositories
						.filter((repo) => repo.validated)
						.map((repo) => repo.id),
				});
				const repository = catalog.repositories.find(
					(repo) => repo.id === card.repositoryId && repo.validated
				);
				try {
					if (
						!repository ||
						!card.workingDirectory ||
						!fs.statSync(card.workingDirectory).isDirectory() ||
						!isPathWithin(
							foldPathCase(fs.realpathSync(card.workingDirectory)),
							foldPathCase(fs.realpathSync(repository.workingDirectory))
						)
					) {
						if (!reasons.includes('repository-unresolved')) reasons.push('repository-unresolved');
					}
				} catch {
					if (!reasons.includes('repository-unresolved')) reasons.push('repository-unresolved');
				}
				return [card.id, reasons];
			})
		);
	}

	/** Atomic host mutation using the caller's collection AND card read revisions. */
	capture(command: BoardCaptureCommand, human = false): Board {
		return (() => {
			const board = this.read(command.projectRoot, command.boardId);
			if (board.storage!.expectedRevision !== command.expectedRevision)
				throw new BoardWorkspaceStorageError('stale-revision', 'Board changed since read');
			const previous = board.cards.find((card) => card.id === command.card.id);
			if (previous && previous.storageRevision !== command.card.storageRevision)
				throw new BoardWorkspaceStorageError('stale-revision', 'Card changed since read');
			if (
				previous?.status === 'running' ||
				command.card.status === 'running' ||
				command.card.status === 'ready'
			)
				throw new BoardWorkspaceStorageError('runtime-unavailable', 'Capture cannot start a run');
			if (previous && previous.status !== command.card.status)
				throw new BoardWorkspaceStorageError('invalid-input', 'Use the separate status command');
			const card = validateBoardCard({
				...command.card,
				createdAt: previous?.createdAt ?? nowIso(),
				updatedAt: nowIso(),
			});
			if (!card) throw new BoardWorkspaceStorageError('invalid-payload', 'Invalid card');
			board.cards = previous
				? board.cards.map((entry) => (entry.id === card.id ? card : entry))
				: [...board.cards, card];
			return this.save(command.projectRoot, [board], human)[0];
		})();
	}

	sourceKeys(projectRoot: string): string[] {
		const keys = [...new Set(this.resolveSourceKeys(projectRoot))].filter(
			(key) =>
				!!this.db
					.prepare(
						'SELECT source_key FROM migrations WHERE source_key = ? UNION SELECT source_key FROM board_sources WHERE source_key = ?'
					)
					.get(key, key)
		);
		if (!keys.length)
			throw new BoardWorkspaceStorageError(
				'legacy-mapping-missing',
				'No registered or imported central source for this project'
			);
		return keys;
	}

	/** Filters are views of the same central snapshot; they never open another DB. */
	query(query: BoardWorkspaceQuery = {}): BoardWorkspaceQueryResult {
		if (
			!query ||
			typeof query !== 'object' ||
			Array.isArray(query) ||
			Object.keys(query).some((key) => !['sourceKey', 'projectRef', 'projectRoot'].includes(key))
		)
			throw new BoardWorkspaceStorageError('invalid-input', 'Invalid Board query');
		for (const key of ['sourceKey', 'projectRoot'] as const) {
			if (
				query[key] !== undefined &&
				(typeof query[key] !== 'string' || !query[key]!.trim() || query[key]!.includes('\0'))
			)
				throw new BoardWorkspaceStorageError('invalid-input', 'Invalid Board query filter');
		}
		if (
			query.projectRef !== undefined &&
			(!query.projectRef ||
				typeof query.projectRef.sourceKey !== 'string' ||
				!query.projectRef.sourceKey.trim() ||
				query.projectRef.sourceKey.includes('\0') ||
				Object.keys(query.projectRef).some((key) => key !== 'sourceKey'))
		)
			throw new BoardWorkspaceStorageError('invalid-input', 'Invalid Board project reference');
		return this.db.transaction(() => {
			const snapshot = this.workspace.readWorkspace();
			let projectSource: string | undefined;
			if (query.projectRoot !== undefined) {
				const keys = [...new Set(this.resolveSourceKeys(query.projectRoot))];
				if (!keys.length)
					throw new BoardWorkspaceStorageError(
						'legacy-mapping-missing',
						'No Board source for project'
					);
				if (keys.length !== 1)
					throw new BoardWorkspaceStorageError(
						'legacy-mapping-ambiguous',
						'Project resolves to multiple Board sources'
					);
				projectSource = keys[0];
			}
			const filters = [query.sourceKey, query.projectRef?.sourceKey, projectSource].filter(
				(key): key is string => key !== undefined
			);
			if (filters.some((key) => !snapshot.sourceKeys.includes(key)))
				throw new BoardWorkspaceStorageError(
					'legacy-mapping-missing',
					'Board source is not registered'
				);
			return {
				revision: snapshot.revision,
				sources: snapshot.sourceKeys.map((sourceKey) => ({ sourceKey, projectRef: { sourceKey } })),
				collections: snapshot.collections
					.filter((entry) => filters.every((key) => key === entry.sourceKey))
					.map((entry) => ({
						sourceKey: entry.sourceKey,
						collectionKey: entry.collectionKey,
						revision: entry.revision,
						projectRef: { sourceKey: entry.sourceKey },
						board: this.project(entry),
					})),
			};
		})();
	}

	read(projectRoot: string, boardId: string): Board {
		const key = this.workspace.resolveLegacyCollection(this.sourceKeys(projectRoot), boardId);
		const snapshot = this.workspace.readCollection(key)!;
		if (snapshot.archived)
			throw new BoardWorkspaceStorageError('not-found', 'Board archived', { key });
		return this.project(snapshot);
	}

	list(projectRoot: string): Board[] {
		return this.sourceKeys(projectRoot)
			.flatMap((sourceKey) => this.workspace.listCollections(sourceKey))
			.filter((entry) => !entry.archived)
			.map((entry) => this.project(this.workspace.readCollection(entry)!));
	}

	project(snapshot: BoardCollectionSnapshot): Board {
		const raw = {
			...snapshot.payload,
			cards: snapshot.cards.filter((card) => !card.archived).map((card) => card.payload),
		};
		const board = validateBoard(raw);
		// Malformed imported records remain in SQLite and its snapshot, never silently disappear on save.
		if (!board)
			throw new BoardWorkspaceStorageError(
				'invalid-payload',
				'Central Board needs repair before legacy projection',
				{ key: snapshot }
			);
		board.cards.forEach((card) => {
			card.storageRevision = snapshot.cards.find((entry) => entry.cardId === card.id)!.revision;
		});
		board.storage = {
			sourceKey: snapshot.sourceKey,
			collectionKey: snapshot.collectionKey,
			expectedRevision: snapshot.revision,
			cardRevisions: Object.fromEntries(snapshot.cards.map((card) => [card.cardId, card.revision])),
		};
		return board;
	}

	reference(projectRoot: string, board: Board): BoardStorageRef {
		const ref = board.storage;
		if (
			!ref ||
			typeof ref.sourceKey !== 'string' ||
			typeof ref.collectionKey !== 'string' ||
			(ref.expectedRevision !== null &&
				(!Number.isSafeInteger(ref.expectedRevision) || ref.expectedRevision < 0)) ||
			!ref.cardRevisions ||
			typeof ref.cardRevisions !== 'object' ||
			Array.isArray(ref.cardRevisions)
		)
			throw new BoardWorkspaceStorageError(
				'invalid-input',
				'Board save requires the identity and revision returned by its read'
			);
		if (!this.sourceKeys(projectRoot).includes(ref.sourceKey))
			throw new BoardWorkspaceStorageError(
				'identity-mismatch',
				'Board source does not belong to project'
			);
		const stored = this.workspace.readCollection(ref);
		if (stored && (stored.legacyBoardId !== board.id || stored.archived))
			throw new BoardWorkspaceStorageError(
				'identity-mismatch',
				'Board identity changed or archived'
			);
		return ref;
	}

	plan(projectRoot: string, board: Board, human = false): BoardCollectionWrite {
		const ref = this.reference(projectRoot, board);
		const stored = this.workspace.readCollection(ref);
		if (stored && ref.expectedRevision !== stored.revision)
			throw new BoardWorkspaceStorageError('stale-revision', 'Board changed since read', {
				key: ref,
				expectedRevision: ref.expectedRevision,
				actualRevision: stored.revision,
			});
		if (hasCycle(board))
			throw new BoardWorkspaceStorageError('invalid-input', 'Board has a cyclic parent graph');
		const validated = validateBoard(board);
		if (!validated || validated.cards.length !== board.cards.length)
			throw new BoardWorkspaceStorageError('invalid-payload', 'Invalid Board; no data written');
		const cards: BoardCardWrite[] = board.cards.map((card) => {
			const original = stored?.cards.find((entry) => entry.cardId === card.id);
			if (original?.archived)
				throw new BoardWorkspaceStorageError('protected-field', 'Cannot reuse an archived card ID');
			if (card.status === 'running' && original?.payload.status !== 'running')
				throw new BoardWorkspaceStorageError(
					'runtime-unavailable',
					'Global fenced claims require Phase03 runtime'
				);
			if (
				original &&
				canonicalJson({ runs: validateBoardCard(original.payload)?.runs }) !==
					canonicalJson({ runs: card.runs })
			)
				throw new BoardWorkspaceStorageError(
					'runtime-unavailable',
					'Run lifecycle requires the fenced runtime; use stampBoardRunPr for PR results'
				);
			if (!original && card.runs?.length)
				throw new BoardWorkspaceStorageError('protected-field', 'CRUD cannot create run history');
			if (original?.payload.heldByUser === true && card.heldByUser !== true)
				throw new BoardWorkspaceStorageError(
					'protected-field',
					'Clearing a hold requires an explicit resume command'
				);

			const captureChanged =
				!original ||
				BOARD_CAPTURE_SPEC_FIELDS.some(
					(field) =>
						canonicalJson({ value: original?.payload[field] }) !==
						canonicalJson({ value: (card as unknown as Record<string, unknown>)[field] })
				);
			if (captureChanged) {
				const captureInput = { ...card } as unknown as Record<string, unknown>;
				// Migration persisted explicit nulls for unresolved bindings. Retain those bytes;
				// only an unchanged, already persisted null is treated as missing for validation.
				for (const field of [
					'executionScope',
					'profileNamespace',
					'repositoryId',
					'workingDirectory',
				]) {
					if (original?.payload[field] === null && captureInput[field] === null)
						delete captureInput[field];
				}
				const result = validateCapture(captureInput, {
					...this.captureContext(board, human),
					canRelaxStartPolicy:
						human ||
						(original?.payload.capturePolicy as { effectiveStartMode?: string } | undefined)
							?.effectiveStartMode === 'direct' ||
						(original?.payload.migration as { intent?: string } | undefined)?.intent ===
							'legacy-direct',
				});
				const repository = this.captureCatalog().repositories.find(
					(repo) => repo.id === card.repositoryId
				);
				if (repository?.validated && card.workingDirectory) {
					try {
						if (
							!isPathWithin(
								foldPathCase(fs.realpathSync(card.workingDirectory)),
								foldPathCase(fs.realpathSync(repository.workingDirectory))
							)
						)
							throw new BoardWorkspaceStorageError(
								'invalid-input',
								'Repository and working directory conflict'
							);
					} catch (error) {
						if (error instanceof BoardWorkspaceStorageError) throw error;
						// A vanished path remains a repairable reference, never executable.
					}
				}
				if (!result.ok)
					throw new BoardWorkspaceStorageError(
						'invalid-input',
						`Invalid capture: ${result.errors.join(', ')}`,
						{ captureErrors: result.errors }
					);
			}
			return {
				cardId: card.id,
				expectedRevision: original ? ref.cardRevisions[card.id] : null,
				...this.patch(
					original?.payload ?? { id: card.id },
					card as unknown as Record<string, unknown>,
					BOARD_CARD_EDITABLE_FIELDS,
					['storageRevision', 'runs'],
					(validateBoardCard(original?.payload) as unknown as Record<string, unknown> | null) ??
						undefined
				),
			};
		});
		for (const original of stored?.cards ?? []) {
			if (original.archived || board.cards.some((card) => card.id === original.cardId)) continue;
			cards.push({
				cardId: original.cardId,
				expectedRevision: ref.cardRevisions[original.cardId],
				delete: true,
			});
		}
		return {
			sourceKey: ref.sourceKey,
			collectionKey: ref.collectionKey,
			expectedRevision: ref.expectedRevision,
			legacyBoardId: board.id,
			...this.patch(
				stored?.payload ?? { id: board.id },
				board as unknown as Record<string, unknown>,
				BOARD_COLLECTION_EDITABLE_FIELDS,
				['cards', 'storage'],
				stored
					? (validateBoard({ ...stored.payload, cards: [] }) as unknown as Record<string, unknown>)
					: undefined
			),
			cards,
		};
	}

	private patch(
		stored: Record<string, unknown>,
		next: Record<string, unknown>,
		allowed: ReadonlySet<string>,
		ignored: readonly string[] = [],
		baseline: Record<string, unknown> = stored
	): BoardWorkspacePatch {
		const set: Record<string, unknown> = {};
		const unset: (string | readonly string[])[] = [];
		for (const field of new Set([...Object.keys(stored), ...Object.keys(next)])) {
			if (ignored.includes(field)) continue;
			// Older callers do not know these execution fields. Omission is not an unset.
			if (
				!(field in next) &&
				[
					'kind',
					'executionScope',
					'role',
					'profileNamespace',
					'repositoryId',
					'workingDirectory',
					'startModeOverride',
				].includes(field)
			)
				continue;
			if (canonicalJson({ value: baseline[field] }) === canonicalJson({ value: next[field] }))
				continue;
			if (!allowed.has(field)) {
				// Unmentioned raw fields are retained; caller-supplied replacements are rejected.
				if (next[field] !== undefined)
					throw new BoardWorkspaceStorageError(
						'protected-field',
						`Cannot edit Board field: ${field}`
					);
				continue;
			}
			if (next[field] === undefined) unset.push(field);
			else set[field] = next[field];
		}
		const scope = set.executionScope as { kind?: string } | undefined;
		const previous = stored.executionScope as { kind?: string } | undefined;
		if (scope && previous && scope.kind !== previous.kind) {
			if (scope.kind === 'agent') unset.push(['executionScope', 'groupId']);
			if (scope.kind === 'group') unset.push(['executionScope', 'agentId']);
		}
		return { set, unset };
	}

	save(projectRoot: string, boards: Board[], human = false): Board[] {
		const saved = (() => {
			const plans = boards.map((board) => this.plan(projectRoot, board, human));
			const before = plans.map((plan) => this.workspace.readCollection(plan));
			const snapshots = this.workspace.writeCollections(plans, (snapshots) => {
				snapshots.forEach((snapshot, i) =>
					snapshot.cards.forEach((card) => {
						const previous = before[i]?.cards.find((entry) => entry.cardId === card.cardId);

						const changed =
							!previous ||
							BOARD_CAPTURE_SPEC_FIELDS.some(
								(field) =>
									canonicalJson({ v: previous.payload[field] }) !==
									canonicalJson({ v: card.payload[field] })
							);
						if (changed && !card.archived) {
							const context = this.captureContext(boards[i], human);
							const effectiveStartMode =
								card.payload.startModeOverride ??
								(previous?.payload.capturePolicy as { effectiveStartMode?: string } | undefined)
									?.effectiveStartMode ??
								((previous?.payload.migration as { intent?: string } | undefined)?.intent ===
								'legacy-direct'
									? 'direct'
									: context.defaultStartMode);
							this.workspace.recordCapturePolicy(snapshot, card.cardId, {
								effectiveStartMode,
								specificationRevision: card.revision,
								dispatchApproval: effectiveStartMode === 'direct' ? 'not-required' : 'required',
							});
						}
					})
				);
			});
			return snapshots.map((snapshot) => this.project(snapshot));
		})();
		saved.forEach((board, index) => Object.assign(boards[index], board));
		return saved;
	}
}

let configuredFacade: BoardStorageFacade | null = null;
let defaultFacade: BoardStorageFacade | null = null;
/** Injection does not own/close the supplied DB. Restoring null returns to the lazy machine-local DB. */
export function configureBoardStorage(facade: BoardStorageFacade | null): void {
	configuredFacade = facade;
}
function storage(): BoardStorageFacade {
	if (configuredFacade) return configuredFacade;
	return (defaultFacade ??= new BoardStorageFacade(
		openBoardDb(path.join(resolveUserDataDir(), 'board', 'board.sqlite'))
	));
}
export function closeBoardStorage(): void {
	defaultFacade?.db.close();
	defaultFacade = null;
}

export function getBoardCaptureCatalog(): BoardCaptureCatalog {
	return storage().captureCatalog();
}
export function captureBoardCard(command: BoardCaptureCommand, human = false) {
	const board = storage().capture(command, human);
	announce(command.projectRoot);
	return { ok: true as const, value: board, readiness: storage().captureReadiness(board) };
}

/** Machine-local registry shared by every Board collection. */
export function listBoardWorkers() {
	return listStoredBoardWorkers(storage().db);
}
export function listBoardWorkerAccessOptions() {
	return listStoredBoardWorkerAccessOptions(storage().db);
}
export function registerBoardWorker(agentId: string) {
	return registerStoredBoardWorker(storage().db, agentId);
}
export function setBoardWorkerPaused(agentId: string, paused: boolean) {
	return setStoredBoardWorkerPaused(storage().db, agentId, paused);
}
export function setBoardWorkerEnabled(agentId: string, enabled: boolean) {
	return setStoredBoardWorkerEnabled(storage().db, agentId, enabled);
}
export function setBoardWorkerAccess(
	agentId: string,
	roleRefs: { namespace: string; profileId: string }[],
	allowedRepositoryIds: string[]
) {
	return setStoredBoardWorkerAccess(storage().db, agentId, roleRefs, allowedRepositoryIds);
}

const boardWriteQueue = createKeyedWriteQueue();
/** Advisory in-process queue only. SQLite revisions protect across desktop/CLI processes. */
export function enqueueBoardWrite<T>(projectRoot: string, work: () => T | Promise<T>): Promise<T> {
	const facade = storage();
	const sources = facade.sourceKeys(projectRoot).sort();
	return boardWriteQueue.enqueue(canonicalJson(sources), async () => work());
}
function nowIso(): string {
	return new Date().toISOString();
}
export function loadBoards(projectRoot: string): Board[] {
	return storage().list(projectRoot);
}
export function queryBoardWorkspace(query?: BoardWorkspaceQuery): BoardWorkspaceQueryResult {
	return storage().query(query);
}
export function listBoards(projectRoot: string): Board[] {
	return loadBoards(projectRoot);
}
export function getBoard(projectRoot: string, boardId: string): Board | null {
	// Missing/ambiguous legacy mapping deliberately throws a typed error, never YAML fallback.
	return storage().read(projectRoot, boardId);
}
function announce(projectRoot: string): void {
	try {
		boardSavedListener?.(projectRoot, loadBoards(projectRoot));
	} catch (error) {
		logger.warn(`Board saved listener threw: ${String(error)}`, 'Board');
	}
}
/** Batch patches only named collections; omission never deletes siblings. */
export function saveBoards(projectRoot: string, boards: Board[]): string {
	storage().save(projectRoot, boards);
	announce(projectRoot);
	return 'board:workspace';
}
/** expectedRevision must be the token of the read that produced this board. */
export function saveBoard(
	projectRoot: string,
	board: Board,
	expectedRevision = board.storage?.expectedRevision
): string {
	if (!board.storage || expectedRevision !== board.storage.expectedRevision)
		throw new BoardWorkspaceStorageError('invalid-input', 'Explicit read revision required');
	return saveBoards(projectRoot, [board]);
}
/** Existing-run PR result path shared by desktop and CLI, with exact run identity and revisions. */
export function stampBoardRunPr(
	projectRoot: string,
	board: Board,
	cardId: string,
	run: Pick<CardRun, 'attempt' | 'startedAt'>,
	result: { prUrl: string } | { prError: string }
): Board {
	const facade = storage();
	const ref = facade.reference(projectRoot, board);
	if (ref.expectedRevision === null)
		throw new BoardWorkspaceStorageError('not-found', 'Board is not persisted');
	const snapshot = facade.workspace.stampRunPr({
		...ref,
		cardId,
		expectedRevision: ref.expectedRevision,
		expectedCardRevision: ref.cardRevisions[cardId],
		run,
		result,
		updatedAt: nowIso(),
	});
	const saved = facade.project(snapshot);
	announce(projectRoot);
	return saved;
}

/** Optional board settings accepted at creation time. */
export interface CreateBoardOptions {
	/** Cap on how many cards may be `running` at once. Must be a positive integer. */
	maxInProgress?: number;
	/** Opt this board into the LLM auto-decompose pass for `triage` cards. */
	autoDecompose?: boolean;
}

/**
 * Create a new, empty board and persist it. Mints a UUID id, trims the name
 * (required), and upserts it alongside any existing boards. Returns the created
 * board. Used by the Board UI (Phase 4) to stand up the first board on demand,
 * and by `maestro-cli board create` to bootstrap a board headlessly.
 */
export function createBoard(
	projectRoot: string,
	name: string,
	options: CreateBoardOptions = {}
): Board {
	const trimmed = (name ?? '').trim();
	if (!trimmed) {
		throw new Error('createBoard: name is required');
	}
	const board: Board = { id: generateUUID(), name: trimmed, cards: [] };
	if (options.maxInProgress !== undefined) {
		if (!Number.isFinite(options.maxInProgress) || options.maxInProgress < 1) {
			throw new Error('createBoard: maxInProgress must be a positive integer');
		}
		board.maxInProgress = Math.floor(options.maxInProgress);
	}
	if (options.autoDecompose) board.autoDecompose = true;
	const facade = storage();
	const sources = [...new Set(facade.resolveSourceKeys(projectRoot))];
	if (sources.length !== 1)
		throw new BoardWorkspaceStorageError(
			sources.length ? 'legacy-mapping-ambiguous' : 'legacy-mapping-missing',
			'Creating a collection requires exactly one explicit source'
		);
	const saved = facade.project(
		facade.workspace.createCollection({
			sourceKey: sources[0],
			collectionKey: generateUUID(),
			legacyBoardId: board.id,
			expectedRevision: null,
			set: {
				name: board.name,
				...(board.maxInProgress !== undefined ? { maxInProgress: board.maxInProgress } : {}),
				...(board.autoDecompose ? { autoDecompose: true } : {}),
			},
		})
	);
	announce(projectRoot);
	return saved;
}

/**
 * Rename a board in place. Trims the new name (required) and leaves every card
 * untouched, so card ids referenced by the CLI, Cue pipelines, or open UI keep
 * resolving. Throws if the board is missing or the name is blank. Returns the
 * renamed board.
 */
export function renameBoard(projectRoot: string, boardId: string, name: string): Board {
	const trimmed = (name ?? '').trim();
	if (!trimmed) {
		throw new Error('renameBoard: name is required');
	}
	const boards = loadBoards(projectRoot);
	const board = requireBoard(boards, boardId);
	board.name = trimmed;
	saveBoard(projectRoot, board, board.storage?.expectedRevision);
	return board;
}

/**
 * Archive a board while retaining cards and historical run references. Returns remaining boards
 * (mirroring `deleteProfile`). Throws if the board is missing.
 *
 * A board with unfinished cards requires force. Running cards or reservations
 * always prevent archival. SQLite rows and their foreign keys remain intact.
 */
export function deleteBoard(
	projectRoot: string,
	boardId: string,
	options: { force?: boolean } = {}
): Board[] {
	const boards = loadBoards(projectRoot);
	const board = requireBoard(boards, boardId);
	if (board.cards.some((card) => card.status === 'running')) {
		throw new Error('This board has running cards. Stop them before deleting the board.');
	}
	if (!options.force) {
		const unfinished = board.cards.filter((c) => c.status !== 'done');
		if (unfinished.length > 0) {
			throw new Error(
				`Board "${board.name}" still has ${unfinished.length} card(s) that are not done. ` +
					`Pass --force to delete it and everything on it anyway.`
			);
		}
	}
	const facade = storage();
	const ref = facade.reference(projectRoot, board);
	facade.workspace.writeCollection({ ...ref, delete: true });
	announce(projectRoot);
	return loadBoards(projectRoot);
}

/** Load a board by id or throw a caller-surfaceable error when it is missing. */
function requireBoard(boards: Board[], boardId: string): Board {
	const board = boards.find((b) => b.id === boardId);
	if (!board) {
		throw new Error(`Board "${boardId}" not found`);
	}
	return board;
}

/**
 * Add a card to a board. Validates the card, stamps `createdAt`/`updatedAt` when
 * absent, and rejects (via {@link saveBoards}) if the addition would introduce a
 * cycle. Throws if the board or a card with the same id already exists. Returns
 * the updated board.
 */
export function addCard(projectRoot: string, boardId: string, card: BoardCard): Board {
	const validated = validateBoardCard(card, nowIso());
	if (!validated) {
		throw new Error('addCard: invalid card shape');
	}
	if (DERIVED_STATUSES.has(validated.status)) throw new Error('addCard: dispatcher-owned status');
	const boards = loadBoards(projectRoot);
	const board = requireBoard(boards, boardId);
	if (board.cards.some((c) => c.id === validated.id)) {
		throw new Error(`addCard: card "${validated.id}" already exists on board "${boardId}"`);
	}
	board.cards.push(validated);
	saveBoard(projectRoot, board, board.storage?.expectedRevision);
	return board;
}

/**
 * Statuses the dispatcher DERIVES and therefore owns. `ready` is computed from
 * the DAG (`todo` with all parents `done`) and `running` is stamped when a card
 * is claimed and an agent is actually spawned for it. Accepting either from IPC
 * or the CLI produces a card the engine's own bookkeeping disagrees with: a
 * hand-set `running` card has no open run, so the dispatcher's stale-reclaim
 * pass eventually drags it back, and a hand-set `ready` card jumps the DAG gate
 * and can dispatch before its parents are done.
 *
 * Authors write `todo`; the engine does the rest.
 */
const DERIVED_STATUSES: ReadonlySet<CardStatus> = new Set<CardStatus>(['ready', 'running']);

/**
 * Update a card's status. Stamps `updatedAt`. Throws if the board or card is
 * missing, if `status` is not a real {@link CardStatus}, or if the caller tried
 * to set a dispatcher-derived status (see {@link DERIVED_STATUSES}). Returns the
 * updated board.
 *
 * Status changes preserve user holds. An explicit resume command owns release.

 */
export function updateCardStatus(
	projectRoot: string,
	boardId: string,
	cardId: string,
	status: CardStatus
): Board {
	// The `CardStatus` annotation is compile-time only, and this runs behind an
	// IPC boundary the renderer and the web-desktop bridge both reach. An
	// off-enum string used to be written straight through, and the load-side
	// validator then dropped the whole card as malformed - a silent delete. Fail
	// the write instead.
	if (!(CARD_STATUSES as readonly string[]).includes(status)) {
		throw new Error(
			`updateCardStatus: "${status}" is not a valid card status. ` +
				`Valid: ${CARD_STATUSES.join(', ')}.`
		);
	}
	if (DERIVED_STATUSES.has(status)) {
		throw new Error(
			`updateCardStatus: "${status}" is set by the dispatcher, not manually. ` +
				`Move the card to "todo" instead - it is promoted to "ready" once its parents are done.`
		);
	}
	const boards = loadBoards(projectRoot);
	const board = requireBoard(boards, boardId);
	const card = board.cards.find((c) => c.id === cardId);
	if (!card) {
		throw new Error(`updateCardStatus: card "${cardId}" not found on board "${boardId}"`);
	}
	if (card.status === 'running') {
		throw new Error('This card is running. Stop it before changing its status.');
	}
	card.status = status;
	// Status changes preserve intake holds and never grant dispatch approval.
	card.updatedAt = nowIso();
	saveBoard(projectRoot, board, board.storage?.expectedRevision);
	return board;
}

/**
 * Replace a card in place (used for edits to title/body/assignee/parents/etc.).
 * Stamps `updatedAt`, preserves `createdAt`, and rejects if the edit would
 * introduce a cycle. Throws if the board or card is missing. Returns the
 * updated board.
 */
export function updateCard(projectRoot: string, boardId: string, card: BoardCard): Board {
	const boards = loadBoards(projectRoot);
	const board = requireBoard(boards, boardId);
	const index = board.cards.findIndex((c) => c.id === card.id);
	if (index < 0) {
		throw new Error(`updateCard: card "${card.id}" not found on board "${boardId}"`);
	}
	if (
		card.storageRevision === undefined ||
		card.storageRevision !== board.storage?.cardRevisions[card.id]
	) {
		throw new BoardWorkspaceStorageError('stale-revision', 'Card edit requires its read revision');
	}
	const stored = board.cards[index];
	if (card.status !== stored.status && DERIVED_STATUSES.has(card.status)) {
		throw new Error(`updateCard: "${card.status}" is set by the dispatcher, not manually.`);
	}
	if (card.status !== stored.status) {
		throw new Error(
			'updateCard: card status changed. Refresh the card before editing; use updateCardStatus to move it.'
		);
	}
	if (stored.status === 'running') {
		throw new Error('updateCard: running cards cannot be edited. Stop the run before editing.');
	}

	const validated = validateBoardCard(
		{
			...stored,
			...card,
			runs: card.runs ?? stored.runs,
			heldByUser: card.heldByUser === undefined ? stored.heldByUser : card.heldByUser,
			createdAt: card.createdAt || stored.createdAt,
			updatedAt: nowIso(),
		},
		nowIso()
	);
	if (!validated) {
		throw new Error('updateCard: invalid card shape');
	}
	board.cards[index] = validated;
	saveBoard(projectRoot, board, board.storage?.expectedRevision);
	return board;
}

/**
 * Delete a card from a board by id, keeping the DAG referentially intact.
 * Returns the updated board. A no-op (and no write) when no card matches.
 * Throws if the board is missing.
 *
 * Referential integrity, in two parts:
 *
 *  1. **Detach.** The deleted id is spliced out of every other card's `parents`.
 *     `getBlockers` and `getEligibleCards` treat a parent id with no matching
 *     card as a permanent blocker (deliberately - a dependency that does not
 *     exist yet cannot be satisfied), so leaving the dangling id behind wedged
 *     every child of a deleted card forever, with nothing in the UI explaining
 *     why they never promoted.
 *
 *  2. **Grandparent adoption.** The deleted card's own parents are reattached to
 *     its children. Deleting a middle card would otherwise sever the ordering it
 *     encoded (`A -> B -> C`, delete `B`, and `C` becomes runnable before `A` is
 *     done). Adoption preserves reachability, and cannot introduce a cycle: the
 *     new edges are a subset of paths that already existed through the deleted
 *     card, so an acyclic board stays acyclic.
 *
 * A card is never made its own parent (a self-edge, if the deleted card somehow
 * listed one of its own children as a parent).
 */
export function deleteCard(projectRoot: string, boardId: string, cardId: string): Board {
	const boards = loadBoards(projectRoot);
	const board = requireBoard(boards, boardId);
	const doomed = board.cards.find((c) => c.id === cardId);
	if (!doomed) return board;
	if (doomed.status === 'running') {
		throw new Error('This card is running. Stop it before deleting the card.');
	}

	const inheritedParents = doomed.parents.filter((id) => id !== cardId);
	board.cards = board.cards.filter((c) => c.id !== cardId);
	for (const card of board.cards) {
		if (!card.parents.includes(cardId)) continue;
		const rest = card.parents.filter((id) => id !== cardId);
		card.parents = Array.from(new Set([...rest, ...inheritedParents])).filter(
			(id) => id !== card.id
		);
		card.updatedAt = nowIso();
	}
	saveBoard(projectRoot, board, board.storage?.expectedRevision);
	return board;
}
