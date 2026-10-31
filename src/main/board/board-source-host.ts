/** Discover only registered local roots. Legacy files are immutable import input;
 * central data owns subsequent edits. No recursive scan or remote/local fallback. */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BOARD_CONFIG_PATH, PROFILES_CONFIG_PATH } from '../../shared/maestro-paths';
import { canonicalJson } from '../../shared/canonicalJson';
import { execGitReadOnly } from '../utils/remote-git';
import {
	applyBoardMigration,
	boardMigrationSourceKey,
	planBoardMigration,
} from './board-migration';
import { BoardStorageError, getBoardStorage, type BoardStorageFacade } from './board-storage';

interface SourceSession {
	id: string;
	dir?: string;
	projectRoot?: string;
	boardWorker?: boolean;
	sessionSshRemoteConfig?: { enabled?: boolean };
}
let sessions: () => SourceSession[] = () => [];
export function configureBoardSourceHost(provider: typeof sessions): void {
	sessions = provider;
}
let pending: Promise<void> | null = null;
export function refreshBoardSources(): Promise<void> {
	const registered = sessions();
	if (!registered.length) return Promise.resolve();
	if (!pending)
		pending = discoverBoardSources(getBoardStorage(), registered).finally(() => {
			pending = null;
		});
	return pending;
}

/** Injectable storage and recorded sessions keep fixture discovery away from live data. */
export async function discoverBoardSources(
	storage: BoardStorageFacade,
	registered: SourceSession[]
): Promise<void> {
	const roots = new Set(
		registered
			.filter((s) => !s.sessionSshRemoteConfig?.enabled)
			.map((s) => s.projectRoot || s.dir)
			.filter((root): root is string => !!root)
	);
	for (const root of roots) {
		let physical: string;
		try {
			physical = fs.realpathSync(root);
		} catch (error) {
			if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) continue;
			throw error;
		}
		const source = { location: { kind: 'local' as const }, path: physical };
		const sourceKey = boardMigrationSourceKey(source);
		// An import is a point-in-time transfer, never a YAML synchronization loop.
		const existing = storage.db
			.prepare('SELECT snapshot FROM migrations WHERE source_key=?')
			.get(sourceKey) as { snapshot: Buffer } | undefined;
		if (existing) {
			applyBoardMigration(storage.db, JSON.parse(existing.snapshot.toString()));
			continue;
		}
		if (
			storage.db.prepare('SELECT 1 FROM board_sources WHERE source_key=?').get(sourceKey) &&
			storage.db.prepare('SELECT 1 FROM repositories WHERE id=?').get(`source:${sourceKey}`)
		)
			continue;
		const read = (relative: string): Buffer | null => {
			try {
				return fs.readFileSync(path.join(physical, relative));
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
				throw error;
			}
		};
		const boardBytes = read(BOARD_CONFIG_PATH);
		const profileBytes = read(PROFILES_CONFIG_PATH);
		const git = await execGitReadOnly(['rev-parse', '--show-toplevel'], physical);
		const repository =
			git.exitCode === 0 && fs.realpathSync(git.stdout.trim()) === physical
				? { id: `source:${sourceKey}`, workingDirectory: physical, validated: true }
				: null;
		if (
			boardBytes ||
			profileBytes ||
			registered.some(
				(s) =>
					s.boardWorker && !s.sessionSshRemoteConfig?.enabled && (s.projectRoot || s.dir) === root
			)
		) {
			applyBoardMigration(
				storage.db,
				planBoardMigration({ source, repository, boardBytes, profileBytes, workers: registered })
			);
		} else {
			storage.db
				.transaction(() => {
					const inserted = storage.db
						.prepare('INSERT OR IGNORE INTO board_sources VALUES (?)')
						.run(sourceKey);
					storage.db
						.prepare('INSERT OR IGNORE INTO board_source_locations VALUES (?, ?)')
						.run(sourceKey, canonicalJson(source));
					const repositoryAdded = repository
						? storage.db
								.prepare('INSERT OR IGNORE INTO repositories VALUES (?, ?)')
								.run(repository.id, canonicalJson(repository)).changes
						: 0;
					if (inserted.changes || repositoryAdded)
						storage.db.prepare('UPDATE workspace SET revision=revision+1 WHERE id=1').run();
				})
				.immediate();
		}
	}
}

/** Revalidate only the persisted identity. Never reimport changed YAML or clear provenance/fences. */
export async function executeBoardSourceCommand(
	command: import('../../shared/board/types').BoardSourceCommand,
	storage = getBoardStorage()
): Promise<import('../../shared/board/types').BoardSourceResponse> {
	try {
		if (!command || typeof command.sourceKey !== 'string' || !command.sourceKey.trim())
			throw new BoardStorageError('invalid-input', 'Explicit source identity required');
		if (command.action === 'save-role' || command.action === 'delete-role') {
			storage.editSourceRole(command);
			return { ok: true };
		}
		if (command.action !== 'revalidate')
			throw new BoardStorageError('invalid-input', 'Unknown source operation');
		const entry = storage
			.query({ sourceKey: command.sourceKey })
			.sources.find((s) => s.sourceKey === command.sourceKey);
		if (!entry?.location || entry.location.location.kind !== 'local')
			throw new BoardStorageError(
				'legacy-mapping-missing',
				'Source location requires an explicit supported adapter'
			);
		const source = entry.location;
		const migration = storage.db
			.prepare('SELECT snapshot FROM migrations WHERE source_key=?')
			.get(command.sourceKey) as { snapshot: Buffer } | undefined;
		const importedRepository = migration
			? (
					JSON.parse(migration.snapshot.toString()) as {
						repository?: { id: string; workingDirectory: string };
					}
				).repository
			: undefined;
		if (importedRepository && importedRepository.workingDirectory !== source.path)
			throw new BoardStorageError(
				'identity-mismatch',
				'Imported repository does not match selected source'
			);
		const repositoryId = importedRepository?.id ?? `source:${command.sourceKey}`;
		const registeredRepository = storage.db
			.prepare('SELECT payload_json FROM repositories WHERE id=?')
			.get(repositoryId) as { payload_json: string } | undefined;
		const retainedRepository = registeredRepository
			? JSON.parse(registeredRepository.payload_json)
			: {};
		if (registeredRepository && retainedRepository.workingDirectory !== source.path)
			throw new BoardStorageError(
				'identity-mismatch',
				'Repository identity belongs to another location'
			);
		let validated = false;
		let identityError: BoardStorageError | undefined;
		try {
			const physical = fs.realpathSync(source.path);
			if (
				physical !== source.path ||
				boardMigrationSourceKey({ ...source, path: physical }) !== command.sourceKey
			)
				throw new BoardStorageError('identity-mismatch', 'Source physical identity changed');
			const git = await execGitReadOnly(['rev-parse', '--show-toplevel'], physical);
			validated =
				git.exitCode === 0 &&
				fs.realpathSync(git.stdout.trim()) === physical &&
				fs.realpathSync(source.path) === physical;
		} catch (error) {
			if (error instanceof BoardStorageError) identityError = error;
			else if (!['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? ''))
				throw error;
		}
		// Persist the host observation, including invalidation, without touching migration state.
		storage.db
			.transaction(() => {
				storage.db
					.prepare(
						'INSERT INTO repositories VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET payload_json=excluded.payload_json'
					)
					.run(
						repositoryId,
						canonicalJson({
							...retainedRepository,
							id: repositoryId,
							workingDirectory: source.path,
							validated,
						})
					);
				storage.db.prepare('UPDATE workspace SET revision=revision+1 WHERE id=1').run();
			})
			.immediate();
		if (identityError) throw identityError;
		if (!validated)
			throw new BoardStorageError(
				'invalid-input',
				'Repository remains unresolved: selected source must be an existing Git root'
			);
		return { ok: true };
	} catch (error) {
		if (!(error instanceof BoardStorageError)) throw error;
		return { ok: false, error: { code: error.code, message: error.message } };
	}
}
