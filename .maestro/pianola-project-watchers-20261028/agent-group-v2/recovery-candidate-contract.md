---
type: reference
title: Pianola R05 durable candidate review contract
created: 2026-10-28
tags:
  - pianola
  - recovery
  - learning
related:
  - '[[SPEC]]'
  - '[[recovery-diagnosis]]'
  - '[[recovery-checks]]'
---

R05 implements storage and native review only. R06 owns correction/conflict
projection, R07 the UI, R08 regression authoring and R09 execution. L08/L09 and
V2-10 remain incomplete until their remaining tasks and checks pass.

## Persistent contract

The existing `maestro-pianola-suggestions.json` now retains `candidates`,
`rejections` and `approvals`. Legacy files can omit these fields. A legacy
proposal without linked evidence needs native regeneration before approval.

Each candidate has `id` (the stable synthesis rule ID), exact disabled `rule`,
concrete `action`, full `conditions`, explicit `exclusions`, `sampleCount`,
complete independent `evidence` and `evidenceFingerprint`. Sources retain
actor/principal, agent/group/tab, question/answer event IDs, full question/answer
examples, timestamps and original semantic metadata. Count is the deduplicated
source count. Exclusions describe existing enforced boundaries: medium/high
risk, low confidence, another exact question or a different native scope/group.
They do not invent excluded agent IDs or introduce new evaluator predicates.

Fingerprint uses canonical JSON of exact scope/match/action/answer/conditions/
exclusions and sorted full sources. Generation timestamps and source ordering
do not change it; a new or changed source does. It is an opaque equality token,
not a security hash. Existing attributable-human filtering, conservative action
allowlist, independent-source threshold and contradiction veto remain in force.

Rejections retain candidate snapshot, ID/fingerprint, reviewer, timestamp and
optional reason. Both relearn and the filesystem write boundary suppress an
identical rejected candidate. New evidence can produce a changed fingerprint;
the old rejection remains available for comparison. Atomic staging writes merge
existing rejection/approval records, including after an empty corpus or legacy
write. Invalid review metadata/corrupt JSON throws instead of erasing consent.

## Native review

`window.maestro.pianola.reviewSuggestion(review)` invokes
`pianola:review-suggestion`; returns `{ rules, suggestions }` after persistence.
Every payload supplies `candidateId`, the displayed `evidenceFingerprint` and:

- `operation: 'accept'`: enable the unchanged exact draft.
- `operation: 'edit', rule`: explicitly approve an edited answer, description
  and/or priority. Rule ID, scope, exact match and risk/action boundaries must
  remain identical. Broader edits fail with `BroadenedSuggestionEdit`.
- `operation: 'reject', reason?`: durably suppress this evidence version only;
  no live rule/profile writes occur.

Each operation synchronously resynthesizes current settled native evidence in
the candidate's agent/group scope before any write; stale fingerprints, missing
sources, duplicates/contradictions and already-active rules cannot be approved.
Encore gating and the existing explicit desktop-owner/Chris web-user binding
apply. Unconfirmed reviewers fail with `HumanSuggestionReviewRequired`. Review
records persist `sourceKind: 'native-human-review'`, `principal: 'chris'` and the
transport-derived actor; payload role/actor assertions grant nothing. Web UI
uses the registered channel; CLI bridge calls cannot review or use legacy apply.

Approvals retain the original candidate AND the explicitly approved rule,
`approvedAt`, reviewer and `edited`. Authorization is persisted before the rules
write; an approval receipt alone never activates/retries policy. A failed rule
write leaves the pending candidate for an explicit retry. A later staging prune
failure is reported separately after successful activation. Synthesis suppresses
existing candidate IDs even after an approved answer edit or manual disable.
Legacy `applySuggestion({rule})` delegates unchanged drafts through this same
review path; profile-only explicit UI apply retains its existing behavior.

## Handoff and verification boundary

R06 can consume `approvals[].candidate.evidence` as the accepted source baseline
and `approvals[].rule` as the human-approved policy. Edited answers are intentional;
do not mistake their difference from original examples for a later correction.
Live activation is determined from rules, not from the existence of an approval.
Add durable conflict/review metadata without rewriting either live policy or
these authorization receipts. R07 must use the fingerprint displayed with each
candidate, reload returned persisted state and show prior rejection evidence when
a changed candidate returns. It must not relabel proposal generation as approval.

R08/R09 need storage round-trip/corruption/legacy-write tests, restart rejection
suppression, changed/reordered/duplicate evidence, native accept/edit/reject,
stale evidence before scheduler refresh, unknown reviewers/CLI denial, failure
ordering and no duplicate proposal after edited approval. Reuse existing native
acceptance, synthesis, store, relearn and IPC fixtures; use isolated stores only.
No permanent tests, lint, types or runtime checks ran in R05. Formatter write and
`git diff --check` passed; exact source hashes and boundaries are recorded in
`checks/recovery-candidates-source.json`. No productive config or runtime changed.
