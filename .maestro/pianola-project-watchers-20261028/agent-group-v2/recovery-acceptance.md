---
type: report
title: Pianola R10 source and isolated integration acceptance
created: 2026-10-28
tags:
  - pianola
  - recovery
  - acceptance
related:
  - '[[SPEC]]'
  - '[[recovery-checks]]'
  - '[[recovery-diagnosis]]'
  - '[[V2-14-ACCEPTANCE]]'
---

R10 accepts **32/32 SPEC criteria, zero failures** on the recovered source.
`acceptance.json` links each criterion to actual passed assertion pointers or
the explicit execution/ledger audit. `candidateReady: true` describes source and
isolated integration. Current-upstream composition and publication remain R11;
`installed: false`. V2-16 remains partial until R11/R12 finish their work.

## Executed and reused evidence

- **58/58 current native composition cases:** real lifecycle/supervisor, selected
  CLI worker, census, admission, decisions, filesystem stores, settlement events,
  scheduler, synthesis, evaluator and native Suggestions handlers. Includes
  original/current/future chats, group/worktree ownership, exclusions, pause,
  same-ID streaming, bounded scheduling, guarded delivery and Mira handoff,
  high-risk human escalation, uncertain receipt/restart, explicit learned-rule
  approval followed by a later scoped match, durable reviews and corrections.
- **11/11 original R00 reproductions:** seven formerly missing cases plus four
  already-working controls. Coverage assertions now use the current projection;
  edit/reject use the final native candidate ID/fingerprint contract. Server
  rendering uses current props/Accept label and isolates navigation interaction.
  The initial fixture load failure and subsequent passing receipt are retained.
- **161 monitoring and 67 learning/rendered tests reused:** verified test files
  and monitoring source are unchanged since the R04/R09 receipts. The current
  native composition reruns the changed main/storage dependencies. Includes all
  six rendered actor/action states, persisted selection/pause, guarded human
  resolution, linked evidence, edit/reject/reload and truthful conflict states.
- **Scoped types, formatting and lint pass:** union of the R04/R09 type roots
  and dependencies, with zero diagnostics; changed harness formatting/test lint
  pass. No full suite or `validate:push`.

Exact commands, counts, hashes, reused receipts and cleanup are in
`checks/recovery-acceptance.json`. Native assertions are in
`checks/recovery-acceptance-native.json`; complete native traces are losslessly
compressed in `checks/recovery-acceptance-traces.json.gz` (`gzip -dc` to inspect).
All 58 cases record zero boundary violations, all filesystem access stays in
their worktree-local fixture, and all recipients are fixture identities.
Original-repro receipts use `checks/recovery-original-repro*`; original red R00
and prior R04/R09 receipts are preserved.

## Source and ledger reconciliation

R10 changes the harness receipt destination through the optional
`PIANOLA_ACCEPTANCE_TRACE_FILE` environment variable, preserving historical
receipts across future executions. No production behavior changes were needed.
The disposable R00 driver/cases and their generated test/config are removed;
permanent native/rendered regressions retain the same criteria. Original debug
inputs remain recoverable from commit `88ba5ff8f3`.

V2-05/06/07/10/11/12 now have implementation, permanent regression and execution
receipts, plus this complete composition recheck. Their current ledger evidence
replaces outdated partial findings while retaining those findings as history.
V2-14's earlier 28-pass/4-fail result is historical. Original document checkboxes
are unchanged under the current-task-only instruction. Only R10 is checked off.

## Remaining boundary

R11 owns backup/source preservation, the recorded current-base conflicts,
focused upstream-rc composition and PR/CI receipts. R12 owns refreshed REPORT,
results and setup/rollback handoff. Existing REPORT/results describe an earlier
snapshot until R12 updates them. No installation, restart, productive coverage,
policy/profile mutation, provider request, peer grant, Cue or merge occurred.
Live listener framing, actual Mira reasoning and the installed candidate remain
outside this fixture acceptance. Actual model/effort are unknown; configured
high/high hints are not execution evidence. Images analyzed: zero.
