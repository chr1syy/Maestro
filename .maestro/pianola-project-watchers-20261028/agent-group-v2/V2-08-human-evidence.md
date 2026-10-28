---
type: reference
title: Pianola V2-08 human decision evidence contract
created: 2026-10-28
tags:
  - pianola
  - human-evidence
related:
  - '[[SPEC]]'
  - '[[IMPLEMENTATION-MAP]]'
---

# V2-08 source contract

The production path is the existing `pianola:resolve-decision` IPC handler -> WebServer -> `resolvePianolaDecision` -> durable main-process decision append -> `onHumanDecisionSettled` -> existing native relearn scheduler -> `settledDecisionPairs` -> synthesis/staged Suggestions. No Cue, new process or inference per watcher poll.

## Identity and source

`MaestroSettings.pianolaLearningIdentity` is an optional, explicit identity binding: `{desktopOwnerIsChris?: boolean, chrisWebUserId?: string}`. Absent or malformed binding means no Chris evidence. The desktop branch additionally requires an actual native event sender and no bridge/user context; web attribution requires the exact authenticated user ID. Anonymous web-owner, display-name guesses, unknown CLI transcript authors, rule replies and Mira replies never establish Chris identity. Remote `settings:set` cannot write this binding; no live binding was created in this task. The future native Suggestions/settings work may expose owner configuration, without silently asserting identity.

An optional validated `PianolaDecisionRecord.humanEvidence` stores source kind/version, principal and actor ID, recipient agent/tab IDs, group ID at resolution time (null explicitly means ungrouped), exact question and answer, timestamps, original question message ID and a generated native answer-event ID. The recipient's eventual transcript echo ID remains separately in `lifecycle.answerMessageId`; the answer-event ID is not claimed to be that echo. Missing timestamp/group metadata, empty/oversized question or audit byte overflow excludes evidence while preserving the original answer path. Legacy logs remain readable without evidence.

`action` and `conditions` are explicit nullable semantic fields. They remain unknown until V2-09 establishes equivalence; unknown semantics cannot produce rule candidates. No invented action is inferred from generic yes text. Existing full-turn risk checks and explicit human approval boundaries remain in the production resolver.

## Settlement, replay and scheduling

Settlement means the explicit owner's answer decision has been durably committed, independent of delivery to the recipient. Rejected/unknown delivery is not described as agent continuation. The event is emitted after the answer intent append; native send receipts and subsequent transcript reconciliation remain separate lifecycle outcomes. This also avoids losing the learning trigger when a worker observes the recipient before the send receipt returns.

`settledDecisionPairs` rejects dry runs, other phases, manager/rule origins, mismatched recipient/ask/answer and malformed evidence. `confirmedHumanDecisionPairs` applies the same provenance boundary at relearn, synthesis and aggregation. Ask identity is `(agentId, tabId, questionMessageId)`; answer identity is `(actorId, answerMessageId)`. Either repeated identity is counted once, regardless of polling, duplicate audit snapshots or re-import. Counts are recomputed from the deduplicated corpus, never added to an old aggregate on each run.

The main store suppresses duplicate settlement events against the durable corpus. The existing scheduler subscribes on start, unsubscribes on stop and coalesces new evidence arriving during a run into one subsequent serial run. Its existing Encore gating and periodic restart/recovery cadence remain. Native learning now uses attributable audit records rather than an unverified raw CLI crawler; raw transcript parsing remains available for inspection and backward compatibility.

## Remaining tasks and evidence limits

V2-09 owns narrow equivalence/scoped candidates, contradictions and configurable thresholds; V2-10 owns Suggestions approval/edit/rejection persistence. Do not treat the old synthesis policy as the completed V2 feature. V2-11 authors regressions and V2-12 executes them; no tests were authored or executed in V2-08. Required cases include explicit/missing identity bindings, remote binding-write denial, unknown/Mira/rule exclusion, duplicate ask/answer IDs, audit budget, settlement before receipt and coalesced in-flight scheduler events. Update legacy raw-role aggregate/synthesis fixtures to carry explicit evidence only where attributable.

At entry PROGRESS still recorded V2-05 in progress, with no V2-06/V2-07 completion receipts. This independent source task does not establish those predecessor acceptances. Later controlled acceptance must verify their completion rather than infer it from this commit. No installed-runtime acceptance, productive activation, restart/install or upstream PR publication occurred; publication remains V2-15.
