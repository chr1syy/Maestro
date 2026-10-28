---
type: reference
title: Pianola R06 correction and learned-rule conflict contract
created: 2026-10-28
tags:
  - pianola
  - recovery
  - learning
related:
  - '[[SPEC]]'
  - '[[recovery-candidate-contract]]'
  - '[[recovery-checks]]'
---

R06 implements production event/conflict paths. R07 owns their UI, R08 permanent
regressions, R09 runtime/static execution and R10 complete acceptance. L09 and
V2-10 remain unaccepted until those receipts pass. No images supplied/analyzed.

## Native correction event and source authority

`settledDecisionPairs(records)` still returns independent, deduplicated samples.
`{ snapshots: true }` returns attributable source snapshots before ask folding,
so conflict review retains the actual corrected answer/event. Both modes require
native Chris evidence, a human lifecycle with the same actor and group, and an
explicit committed answer. Manager/rule/unknown/dry-run records do not qualify.

`appendDecision` compares each incoming human snapshot with the existing native
snapshots before its durable append. Matching evidence plus classification is a
replay and emits no settlement event. Changed evidence emits after persistence;
replaying that correction under another record ID is also quiet. The existing
serialized relearn scheduler handles the event and queues a follow-up if needed.
No Cue, extra watcher, model invocation or timer was added. Corpus dedup now also
vetoes changed provenance/conditions/classification for an existing source rather
than comparing answer text alone. A correction never adds an independent sample.

## Durable conflict projection

`PianolaSuggestionsFile.conflicts` is optional for legacy files. Each record has
`ruleId`, the accepted candidate's `evidenceFingerprint`, `approvedAt`, stable
first `detectedAt`, `reason` (`source_corrected` or `contradictory_decision`),
`status: needs_review`, `nextActor: human`, concrete `nextAction`, and full new
or corrected human `evidence`. Join the first three fields to `approvals` for
the original candidate/examples and the explicitly approved rule/reviewer.
The conflict's evidence fingerprint identifies the accepted baseline, rather
than a new proposal. Conflicts are advisory review requests, never live policy.

`reconcileSuggestionEvidence` composes existing synthesis and human filtering.
It removes pending candidates whose current source fingerprint no longer agrees
(including changed risk/conditions or contradictions) and compares accepted
sources with later native snapshots. A changed accepted source creates review
even when its question/scope changed. An independent later answer creates review
only for the same exact question, scope, group and material conditions. Earlier
unrelated decisions, another scope, and raw unknown-author transcripts cannot.

An intentionally edited approved answer is not a correction: original accepted
examples are checked against their original snapshots. Later equivalent answers
are compared to the explicitly approved answer, including an edited refusal.
New conflicts require a matching persisted rule ID and policy, so a failed
activation receipt alone cannot create an active-rule conflict. Existing review
requests survive subsequent rule edits, disables or removal as audit history.
R07 must read current rules to distinguish active, disabled and replaced policy;
`needs_review` alone does not assert that a rule is currently enabled.

## Persistence and native API

Relearn uses native snapshots and stages revalidated review metadata. Shared
filesystem writes merge approvals/rejections/conflicts, union conflict examples,
retain first detection time, then reread current native evidence/rules before
the atomic write. Empty, legacy or stale writers cannot clear durable conflicts
or restore corrected candidates. Invalid conflict metadata or an absent matching
approval throws instead of silently losing review state. Missing log evidence
invalidates pending approval; it does not erase accepted provenance/conflicts.

`getSuggestions()` / `pianola:get-suggestions` revalidates through this same
boundary, catching up after restart or before an incremental job completes.
Identical resulting state is not rewritten. No new API/bridge channel is needed;
the existing preload return type exposes conflicts and approvals. Explicit native
review retains the R05 fresh-evidence and transport-owner checks. Generation,
conflict detection, rejection and replay never write rules or profiles. Chris
can explicitly edit/disable a conflicting policy through existing Rules controls;
there is no automatic conflict dismissal or new consent/permission mechanism.

## Required R08/R09 verification

Reuse native acceptance, synthesis, main/CLI filesystem, settlement and IPC tests.
Add correction under the same and a different record ID (one new event, replay
quiet); changed conditions/risk with unchanged text; manager/rule/unknown exclusion;
pending invalidation and stale approval; accepted source correction after restart;
new matching contradiction vs other scope/conditions or earlier evidence; edited
approval without false conflict; failed activation receipt; unchanged live rule;
conflict retention after empty/legacy/stale staging, log compaction and restart;
corrupt/mismatched conflict metadata; repeated API reads without duplicate writes.
Persisted candidate fixtures must seed their real native decision log: the shared
write boundary now revalidates sources rather than trusting supplied snapshots.
Only formatter write, source inspection and `git diff --check` ran in R06.
Exact source hashes and check boundaries are in `checks/recovery-conflicts-source.json`.
