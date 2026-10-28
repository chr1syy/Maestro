/**
 * Pianola suggestion synthesis - PURE, runtime-agnostic.
 *
 * Turns a mined decision corpus (DecisionPair[]) plus the user's existing rules
 * and profile into APPROVABLE suggestions: a short set of hard-rule proposals and
 * a refreshed decision-profile draft (with a diff against the current profile).
 *
 * Deterministic and code-driven (no LLM): the same corpus always yields the same
 * proposals, so the scheduled re-learn job (Step 2) and the in-app suggestions UI
 * (Step 3) share one source of truth. Nothing here auto-applies; the caller (a
 * staging write, or a user clicking approve) decides what to persist.
 *
 * Safety: only a closed set of concrete local inspection questions is mapped.
 * Every candidate retains the full question, exact answer and native scope,
 * remains disabled and requires explicit acceptance. Unknown semantics and
 * conflicting evidence yield no candidate. Full-turn risk guards still apply.
 */

import type { PianolaRule } from './types';
import { learnableDecisionAction } from './pianola-policy';
import { canonicalJson } from '../canonicalJson';
import type { DecisionAggregates, DecisionPair } from './transcript-mining';
import { aggregateDecisionPairs, confirmedHumanDecisionPairs } from './transcript-mining';

/** Configurable heuristic; never an authorization threshold. */
export const SUGGESTION_MIN_SAMPLES = 3;
/** Retained export for legacy consumers; every matching sample must agree. */
export const SUGGESTION_MIN_AFFIRM_RATIO = 1;

/** A before/after view of the decision-profile markdown. */
export interface ProfileDiff {
	before: string;
	after: string;
	changed: boolean;
}

export interface SynthesisInput {
	/** Mined ask -> reply decisions to learn from. */
	pairs: readonly DecisionPair[];
	/** The user's current rules, so we never propose a duplicate. */
	existingRules: readonly PianolaRule[];
	/** The current decision-profile markdown for this scope (empty when none). */
	existingProfile?: string;
	/** Epoch ms stamped onto proposals; injected for deterministic tests. */
	now?: number;
	minSamples?: number;
	/** Group pooling must be explicitly requested; default is individual agent. */
	learningScope?: 'agent' | 'group';
}

export interface SynthesisResult {
	/** Hard-rule proposals, each valid per validatePianolaRule. Never auto-applied. */
	proposals: PianolaRule[];
	/** Source-linked candidates for Suggestions; no live policy mutation. */
	candidates: Array<{
		rule: PianolaRule;
		action: string;
		conditions: string[];
		evidence: NonNullable<DecisionPair['evidence']>[];
	}>;

	/** Proposed profile draft vs the current one. */
	profileDiff: ProfileDiff;
	/** The aggregates the synthesis reasoned over (for the UI summary). */
	aggregates: DecisionAggregates;
}

/** Render a short, deterministic decision-profile draft from the aggregates. */
function renderProfile(aggregates: DecisionAggregates): string {
	if (aggregates.total === 0) return '';
	const line = (risk: string): string => {
		const cell = aggregates.byRiskPolarity[risk];
		if (!cell) return `- ${risk} risk: no observed decisions.`;
		return `- ${risk} risk: ${cell.affirmative} approved, ${cell.negative} declined, ${cell.other} other.`;
	};
	return [
		'# Decision profile (synthesized)',
		'',
		`Synthesized from ${aggregates.total} observed decisions.`,
		'',
		'How you tend to respond, by risk:',
		line('low'),
		line('medium'),
		line('high'),
		'',
		'Guidance for Pianola:',
		'- High-risk asks ALWAYS escalate to me, regardless of any rule.',
		'- Counts describe history only; they grant no permission. Require an explicitly accepted exact scoped rule.',
		'- For medium-risk asks, prefer to ask me unless a specific rule clearly applies.',
		'',
	].join('\n');
}

/**
 * Synthesize approvable suggestions from a mined corpus. Pure: deterministic in
 * its inputs (pass `now` for stable proposal timestamps in tests).
 */
export function synthesizeSuggestions(input: SynthesisInput): SynthesisResult {
	const now = input.now ?? Date.now();
	const pairs = confirmedHumanDecisionPairs(input.pairs);
	const aggregates = aggregateDecisionPairs(pairs);

	const candidates: SynthesisResult['candidates'] = [];
	const threshold = input.minSamples ?? SUGGESTION_MIN_SAMPLES;
	if (!Number.isSafeInteger(threshold) || threshold < 1)
		throw new Error('Invalid learning sample threshold');
	const clusters = new Map<string, DecisionPair[]>();
	for (const pair of pairs) {
		const evidence = pair.evidence!;
		const action = learnableDecisionAction(evidence.question);
		if (!action) continue;
		const scope = input.learningScope ?? 'agent';
		const scopeId = scope === 'agent' ? evidence.agentId : evidence.groupId;
		if (!scopeId) continue;
		const key = canonicalJson([scope, scopeId, evidence.groupId, action, evidence.question]);
		const cluster = clusters.get(key) ?? [];
		cluster.push(pair);
		clusters.set(key, cluster);
	}
	for (const [key, cluster] of clusters) {
		const first = cluster[0];
		// Include all matching responses in the veto, including negative/other/high-risk
		// and changed answers. A correction cannot be outvoted by old yes counts.
		if (
			cluster.length < threshold ||
			cluster.some(
				(pair) =>
					pair.conflictingEvidence ||
					(pair.evidence!.action !== null &&
						pair.evidence!.action !== learnableDecisionAction(pair.ask)) ||
					(pair.evidence!.conditions !== null &&
						canonicalJson(pair.evidence!.conditions) !== canonicalJson([pair.ask])) ||
					pair.polarity !== 'affirmative' ||
					pair.reply !== first.reply ||
					pair.classification.risk !== 'low' ||
					pair.classification.kind !== 'question' ||
					pair.classification.confidence === 'low'
			)
		)
			continue;
		const evidence = first.evidence!;
		const scope = input.learningScope ?? 'agent';
		const scopeId = scope === 'agent' ? evidence.agentId : evidence.groupId!;
		if (
			input.existingRules.some(
				(rule) =>
					rule.scope === scope &&
					rule.scopeId === scopeId &&
					rule.match.exactQuestion === evidence.question &&
					rule.match.groupId === evidence.groupId &&
					rule.answer === first.reply
			)
		)
			continue;
		const rule: PianolaRule = {
			id: `suggested:${key}`,
			enabled: false,
			scope,
			scopeId,
			match: {
				kinds: ['question'],
				maxRisk: 'low',
				exactQuestion: evidence.question,
				groupId: evidence.groupId,
			},
			action: 'auto_answer',
			answer: first.reply,
			priority: 100,
			createdAt: now,
			updatedAt: now,
			description: `${cluster.length} independent Chris decisions for this exact action and condition; explicit acceptance required.`,
		};
		candidates.push({
			rule,
			action: learnableDecisionAction(evidence.question)!,
			conditions: [evidence.question],
			evidence: cluster.map((pair) => pair.evidence!),
		});
	}
	const proposals = candidates.map((candidate) => candidate.rule);

	const before = input.existingProfile ?? '';
	const after = renderProfile(aggregates);
	const profileDiff: ProfileDiff = { before, after, changed: after.length > 0 && after !== before };

	return { proposals, candidates, profileDiff, aggregates };
}
