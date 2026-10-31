/** Pure planning of explicitly supplied legacy Board sources. No discovery or writes. */
import { createHash } from 'node:crypto';
import * as yaml from 'js-yaml';
import { canonicalJson } from '../../shared/canonicalJson';
import { validateBoard, validateBoardCard } from '../../shared/board/types';
import { validateAgentProfile } from '../../shared/profiles/types';

export interface BoardMigrationInput {
	/** Canonical location and source path supplied by the caller, never inferred from a worker. */
	source: { location: { kind: 'local' } | { kind: 'ssh'; remoteId: string }; path: string };
	repository: { id: string; workingDirectory: string; validated: boolean } | null;
	boardBytes: Uint8Array | null;
	profileBytes: Uint8Array | null;
	workers: unknown[];
}

export interface MigrationEntry {
	index: number;
	legacyId: string | null;
	raw: unknown;
	conflicts: string[];
}

export interface MigrationCard extends MigrationEntry {
	executionScope: { kind: 'agent'; agentId: string } | null;
	profileNamespace: string | null;
	intent:
		| 'approval-required'
		| 'legacy-direct'
		| 'human-review'
		| 'reconciliation-required'
		| 'inactive'
		| 'unknown';
	blockers: string[];
}

export interface BoardMigrationPlan {
	sourceKey: string;
	profileNamespace: string;
	snapshot: { boardBase64: string | null; profileBase64: string | null; workers: unknown[] };
	hashes: { board: string | null; profiles: string | null; workers: string };
	repository: BoardMigrationInput['repository'];
	boards: (MigrationEntry & { collectionKey: string | null; cards: MigrationCard[] })[];
	profiles: MigrationEntry[];
	conflicts: string[];
}

function hash(value: Uint8Array | string): string {
	return createHash('sha256').update(value).digest('hex');
}

function record(value: unknown): Record<string, unknown> | null {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function id(value: unknown): string | null {
	const candidate = record(value)?.id;
	return typeof candidate === 'string' && candidate.length > 0 ? candidate : null;
}

function entries(bytes: Uint8Array | null, field: string): unknown[] {
	if (bytes === null) return [];
	const parsed: unknown = yaml.load(Buffer.from(bytes).toString('utf8'), {
		schema: yaml.JSON_SCHEMA,
	});
	if (parsed == null) return [];
	const root = record(parsed);
	if (!root || (root[field] != null && !Array.isArray(root[field]))) {
		throw new Error(`Invalid legacy ${field} document`);
	}
	return (root[field] as unknown[] | null | undefined) ?? [];
}

function duplicates(values: unknown[]): Set<string> {
	const seen = new Set<string>();
	const repeated = new Set<string>();
	for (const value of values) {
		const key = id(value);
		if (key && seen.has(key)) repeated.add(key);
		if (key) seen.add(key);
	}
	return repeated;
}

/** Retains raw entries and bytes even when legacy validators reject or normalize them. */
export function planBoardMigration(input: BoardMigrationInput): BoardMigrationPlan {
	if (
		!input.source.path ||
		(input.source.location.kind === 'ssh' && !input.source.location.remoteId)
	) {
		throw new Error('Canonical source identity is required');
	}
	const sourceKey = hash(canonicalJson(input.source));
	const profileNamespace = `legacy:${sourceKey}`;
	const rawBoards = entries(input.boardBytes, 'boards');
	const rawProfiles = entries(input.profileBytes, 'profiles');
	const duplicateBoards = duplicates(rawBoards);
	const duplicateProfiles = duplicates(rawProfiles);
	const profiles = rawProfiles.map((raw, index): MigrationEntry => {
		const legacyId = id(raw);
		return {
			index,
			legacyId,
			raw,
			conflicts: [
				...(!validateAgentProfile(raw) ? ['invalid-profile'] : []),
				...(legacyId && duplicateProfiles.has(legacyId) ? ['duplicate-profile-id'] : []),
			],
		};
	});
	const boards = rawBoards.map((raw, index) => {
		const legacyId = id(raw);
		const board = record(raw);
		const rawCards = Array.isArray(board?.cards) ? board.cards : [];
		const duplicateCards = duplicates(rawCards);
		const conflicts = [
			...(!validateBoard(raw) ? ['invalid-board'] : []),
			...(legacyId && duplicateBoards.has(legacyId) ? ['duplicate-board-id'] : []),
			...(duplicateCards.size ? ['duplicate-card-id'] : []),
		];
		const cards = rawCards.map((cardRaw, cardIndex): MigrationCard => {
			const card = record(cardRaw);
			const cardId = id(cardRaw);
			const role = typeof card?.assigneeProfileId === 'string' ? card.assigneeProfileId : null;
			const matchingProfiles = profiles.filter((p) => p.legacyId === role);
			const base =
				matchingProfiles.length === 1 && matchingProfiles[0].conflicts.length === 0
					? record(matchingProfiles[0].raw)?.baseAgentId
					: undefined;
			const pin =
				typeof card?.assigneeAgentId === 'string' && card.assigneeAgentId
					? card.assigneeAgentId
					: null;
			const basePin = typeof base === 'string' && base ? base : null;
			const blockers = [...conflicts];
			if (!validateBoardCard(cardRaw, '1970-01-01T00:00:00.000Z')) blockers.push('invalid-card');
			if (cardId && duplicateCards.has(cardId)) blockers.push('duplicate-card-id');
			if (role && (matchingProfiles.length !== 1 || matchingProfiles[0].conflicts.length))
				blockers.push('profile-unresolved');
			if (pin && basePin && pin !== basePin) blockers.push('pin-role-conflict');
			const agentId = pin || basePin;
			if (!agentId) blockers.push('missing-scope');
			if (!input.repository?.validated) blockers.push('repository-unresolved');
			const status = card?.status;
			const intent =
				status === 'triage'
					? 'approval-required'
					: status === 'todo' || status === 'ready'
						? 'legacy-direct'
						: status === 'review'
							? 'human-review'
							: status === 'running'
								? 'reconciliation-required'
								: status === 'blocked' || status === 'done'
									? 'inactive'
									: 'unknown';
			if (intent !== 'legacy-direct') blockers.push(intent);
			if (card?.heldByUser === true) blockers.push('held');
			return {
				index: cardIndex,
				legacyId: cardId,
				raw: cardRaw,
				conflicts: blockers,
				blockers,
				executionScope: agentId ? { kind: 'agent', agentId } : null,
				profileNamespace: role ? profileNamespace : null,
				intent,
			};
		});
		return {
			index,
			legacyId,
			raw,
			conflicts,
			collectionKey: legacyId ? `legacy:${hash(canonicalJson([sourceKey, legacyId]))}` : null,
			cards,
		};
	});
	// A worker named by multiple unfinished runs is a conflict, not a winner selection.
	const runningWorkers = new Map<string, MigrationCard[]>();
	for (const board of boards) {
		for (const card of board.cards) {
			if (card.intent !== 'reconciliation-required') continue;
			const runs = record(card.raw)?.runs;
			const unfinished = Array.isArray(runs) ? runs.filter((run) => !record(run)?.endedAt) : [];
			const workerIds = unfinished
				.map((run) => record(run)?.workerAgentId)
				.filter((worker): worker is string => typeof worker === 'string' && worker.length > 0);
			if (!workerIds.length) card.blockers.push('running-worker-unknown');
			for (const worker of workerIds) {
				const claims = runningWorkers.get(worker) ?? [];
				claims.push(card);
				runningWorkers.set(worker, claims);
			}
		}
	}
	for (const claims of runningWorkers.values()) {
		if (claims.length > 1) for (const card of claims) card.blockers.push('running-worker-conflict');
	}
	return {
		sourceKey,
		profileNamespace,
		snapshot: {
			boardBase64:
				input.boardBytes === null ? null : Buffer.from(input.boardBytes).toString('base64'),
			profileBase64:
				input.profileBytes === null ? null : Buffer.from(input.profileBytes).toString('base64'),
			workers: input.workers,
		},
		hashes: {
			board: input.boardBytes === null ? null : hash(input.boardBytes),
			profiles: input.profileBytes === null ? null : hash(input.profileBytes),
			workers: hash(canonicalJson(input.workers)),
		},
		repository: input.repository,
		boards,
		profiles,
		conflicts: [
			...(duplicateBoards.size ? ['duplicate-board-id'] : []),
			...(duplicateProfiles.size ? ['duplicate-profile-id'] : []),
		],
	};
}
