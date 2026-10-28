/**
 * Selection and ownership rules for project-scoped Pianola watches.
 *
 * This module only resolves metadata. It does not start watches, read a
 * transcript, or authorize a send. The caller must recheck the result at the
 * delivery boundary against a current snapshot.
 */
import { isAbsolutePath } from '../formatters';
import { isPathAtOrUnderRoot, normalizeWorktreePath } from '../worktreePaths';

/** Scope IDs also name checkpoint files; never allow paths or arbitrary strings. */
export function isPianolaScopeId(id: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export interface PianolaScopeSelection {
	label: string;
	mode: 'project' | 'agents';
	projectRoots: string[];
	/** The root each selected owner was explicitly enrolled under. */
	ownerRoots: Record<string, string>;
	includeWorktrees: boolean;
	excludedAgentIds: string[];
}

export interface PianolaScopeOwner {
	id: string;
	cwd: string;
	parentSessionId?: string | null;
	isPianola: boolean;
	/** Remote identities are excluded until a host-bound scope is supported. */
	remote: boolean;
}

export interface PianolaScopeTab {
	agentId: string;
	tabId: string;
	paused: boolean;
	consult: boolean;
	ephemeral: boolean;
}

export interface PianolaScopeCandidate {
	id: string;
	enabled: boolean;
	createdAt: number;
	managerAgentId: string;
	selection: PianolaScopeSelection;
}

export interface PianolaExplicitWatch {
	agentId?: string;
	tabId?: string;
	enabled: boolean;
}

export type PianolaScopeOwnership =
	| { kind: 'scope'; scopeId: string }
	| { kind: 'explicit-watch' }
	| { kind: 'excluded'; reason: string };

/** Reject ambiguous paths instead of normalizing away an authorization boundary. */
function localPath(value: unknown): string | null {
	if (typeof value !== 'string' || !value || !isAbsolutePath(value)) return null;
	if (value.split(/[\\/]/).some((part) => part === '.' || part === '..')) return null;
	return normalizeWorktreePath(value);
}

/** Validate an untrusted selection before it is admitted to a registry. */
export function validatePianolaScopeSelection(raw: unknown): PianolaScopeSelection | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const value = raw as Record<string, unknown>;
	if (typeof value.label !== 'string' || !value.label.trim() || value.label.length > 200)
		return null;
	if (value.mode !== 'project' && value.mode !== 'agents') return null;
	if (typeof value.includeWorktrees !== 'boolean') return null;
	if (
		!Array.isArray(value.projectRoots) ||
		value.projectRoots.length === 0 ||
		value.projectRoots.length > 100
	)
		return null;
	const roots = value.projectRoots.map(localPath);
	if (roots.some((root) => root === null)) return null;
	const projectRoots = [...new Set(roots as string[])];
	if (!value.ownerRoots || typeof value.ownerRoots !== 'object' || Array.isArray(value.ownerRoots))
		return null;
	const entries = Object.entries(value.ownerRoots as Record<string, unknown>);
	if (entries.length > 500 || (value.mode === 'agents' && entries.length === 0)) return null;
	const ownerRoots: Record<string, string> = Object.create(null);
	for (const [id, rawRoot] of entries) {
		const root = localPath(rawRoot);
		if (!id.trim() || id.length > 200 || !root || !projectRoots.includes(root)) return null;
		ownerRoots[id] = root;
	}
	if (
		!Array.isArray(value.excludedAgentIds) ||
		value.excludedAgentIds.length > 500 ||
		value.excludedAgentIds.some((id) => typeof id !== 'string' || !id.trim() || id.length > 200)
	)
		return null;
	return {
		label: value.label.trim(),
		mode: value.mode,
		projectRoots,
		ownerRoots,
		includeWorktrees: value.includeWorktrees,
		excludedAgentIds: [...new Set(value.excludedAgentIds as string[])],
	};
}

/** A worktree must have a resolvable parent chain to an eligible direct owner. */
function ownerMatches(
	selection: PianolaScopeSelection,
	owner: PianolaScopeOwner,
	owners: ReadonlyMap<string, PianolaScopeOwner>,
	excluded: ReadonlySet<string>
): boolean {
	const seen = new Set<string>();
	let current: PianolaScopeOwner | undefined = owner;
	while (current) {
		if (
			seen.has(current.id) ||
			excluded.has(current.id) ||
			current.remote !== false ||
			current.isPianola !== false
		)
			return false;
		seen.add(current.id);
		const cwd = localPath(current.cwd);
		if (!cwd) return false;
		if (!current.parentSessionId) {
			const boundRoot = selection.ownerRoots[current.id];
			// A selected owner remains bound to the root it was enrolled under,
			// even when another root in the same project scope would match.
			if (boundRoot && !isPathAtOrUnderRoot(cwd, boundRoot)) return false;
			return selection.mode === 'agents'
				? !!boundRoot && isPathAtOrUnderRoot(cwd, boundRoot)
				: selection.projectRoots.some((root) => isPathAtOrUnderRoot(cwd, root));
		}
		if (!selection.includeWorktrees) return false;
		current = owners.get(current.parentSessionId);
	}
	return false;
}

/**
 * Resolve one owner for a tab. Explicit legacy watches take precedence; a
 * disabled watch or matching disabled scope vetoes automatic coverage.
 */
export function resolvePianolaScopeOwnership(
	tab: PianolaScopeTab,
	ownerList: readonly PianolaScopeOwner[],
	scopes: readonly PianolaScopeCandidate[],
	watches: readonly PianolaExplicitWatch[]
): PianolaScopeOwnership {
	const owners = new Map(ownerList.map((owner) => [owner.id, owner]));
	const owner = owners.get(tab.agentId);
	if (
		owners.size !== ownerList.length ||
		!owner ||
		owner.isPianola !== false ||
		owner.remote !== false ||
		tab.paused !== false ||
		tab.consult !== false ||
		tab.ephemeral !== false
	) {
		return { kind: 'excluded', reason: 'owner or tab is unavailable or ineligible' };
	}
	const excluded = new Set(
		scopes.flatMap((scope) => [scope.managerAgentId, ...scope.selection.excludedAgentIds])
	);
	if (excluded.has(owner.id)) {
		return { kind: 'excluded', reason: 'manager or excluded agent' };
	}
	const explicit = watches.filter(
		(watch) => watch.agentId === tab.agentId && watch.tabId === tab.tabId
	);
	if (explicit.some((watch) => !watch.enabled))
		return { kind: 'excluded', reason: 'disabled watch' };
	if (explicit.length) return { kind: 'explicit-watch' };
	const matching = scopes.filter((scope) => ownerMatches(scope.selection, owner, owners, excluded));
	if (matching.some((scope) => !scope.enabled))
		return { kind: 'excluded', reason: 'disabled scope' };
	matching.sort(
		(a, b) =>
			(a.selection.mode === b.selection.mode ? 0 : a.selection.mode === 'agents' ? -1 : 1) ||
			a.createdAt - b.createdAt ||
			a.id.localeCompare(b.id)
	);
	return matching[0]
		? { kind: 'scope', scopeId: matching[0].id }
		: { kind: 'excluded', reason: 'outside selected scope' };
}
