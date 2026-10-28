---
type: reference
title: Pianola narrow action candidates
created: 2026-10-28
tags:
  - pianola
  - learning
related:
  - '[[SPEC]]'
  - '[[V2-08-human-evidence]]'
---

# V2-09 contract

Synthesis uses attributable deduplicated human evidence only. Default threshold is three; `SynthesisInput.minSamples` and persisted `pianolaLearningMinSamples` configure it. Invalid thresholds fail the staging pass without changing live policy. Group pooling requires explicit `learningScope: group`; native relearning defaults to agent scope. Agent identity, decision-time group identity, action and full question partition candidates. No cwd matching.

The deliberately closed deterministic grammar recognizes only `May I`, `Can I`, or `Should I` followed by ` run `, a backtick-quoted `git status`, `git diff --stat`, or `git log -5 --oneline`, and a final question mark. No arguments, compound commands or other prose are generalized. The complete question is the material condition. Unknown wording yields no proposal; no inference is invoked. Wider semantic coverage requires a later explicit design, not a generic yes fallback.

Every independent sample must be a confident low-risk question with the identical affirmative answer. All other answers, changed answers, mismatched semantic metadata and duplicate-source corrections veto the cluster. Dedup preserves conflictingEvidence on one sample rather than counting a correction twice. Mapping derives from the question, never the generic answer. This closed action set cannot encode merge, permission changes, external communication or other single-action approval requirements.

Rules are disabled proposals. Candidate IDs deterministically encode scope/group/action/question. `SynthesisResult.candidates` adds exact action/conditions and linked full source evidence for V2-10; legacy `proposals` remains available. V2-10 must persist candidate metadata and rejection identity and implement explicit accept/edit activation; those storage/UI changes are intentionally not implemented here. No profile or rule is auto-applied. The profile draft now explicitly says historical risk counts grant no authorization.

Storage validates/preserves new agent/group scopes, required native scope IDs, exactQuestion and groupId predicates. Legacy scopes remain valid. Classification carries full questionText separately from the truncated topic; the evaluator requires exact equality and current group context. Native scope workers pass agent/group identity at evaluation and again at synchronous desktop admission. Missing question/group metadata fails closed (including legacy standalone watches without a group census); global/project/tab legacy rules retain prior behavior. Full-turn risk and confidence guards remain in force.

# Verification and next work

Changed-source ESLint, Prettier and scoped TypeScript (11 roots, zero diagnostics) passed, as did whitespace checks. An initial type error from a type-only import was fixed by retaining dependency injection for the settings read. No tests were authored or executed: V2-11/V2-12 own those steps. No installed runtime verification, productive messages/selection/rules, activation, install/restart or PR publication. Publication remains V2-15. Four entry-staged test files remain outside this task commit.

V2-10 should consume candidates and the exact rule predicates without dropping group context, persist linked evidence/count and rejection, invalidate pending candidates and flag active rules on later conflicting evidence. V2-11 must cover duplicate-source corrections, generic yes on unrelated actions, changing native group membership and missing full question context in addition to the SPEC cases. Missing V2-05/V2-06/V2-07 completion receipts remain an acceptance precondition.
