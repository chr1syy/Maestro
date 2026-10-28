---
type: report
title: Pianola V2 source acceptance and remaining requirements
created: 2026-10-28
tags:
  - pianola
  - acceptance
  - source-verification
related:
  - '[[SPEC]]'
  - '[[checks-plan]]'
  - '[[V2-13-HARNESS]]'
---

Current acceptance is recorded in [[recovery-acceptance]] and `acceptance.json`:
R10 passes all 32 SPEC criteria, 58 current native cases and 11 original R00
reproductions. Source/isolated integration is accepted; publication remains R11
and `installed: false`. V2-16 remains partial pending R11/R12.

## Historical V2-14 review before recovery

The following findings describe the pre-recovery source. R01-R09 resolved its
four failed criteria; R10 independently verified the complete composition.

V2-14 executed the isolated production composition and repaired the defects it
exposed. The final harness passes **21/21** cases and the targeted regressions
pass **622/622** tests in 12 files. Full SPEC acceptance **fails**: the candidate
is partial, and `installed: false`. The requirement matrix, exact source pointers,
test names, outstanding owners and next actions are in `acceptance.json`.

## Observed defects and repairs

The original V2-13 harness passed 10 of 16 cases. Five failures used “May I run
`git status`?” while expecting a low-risk question. Production intentionally
classifies permission wording as medium risk. The fixture now asks “Should I run
`git status`?” and an additional case verifies that the permission guard stays
intact. The sixth failure was a real approval defect: approving a disabled draft
persisted it unchanged, so the next question could never match an enabled rule.

Native approval now activates only a current staged proposal with the same exact
scope, conditions and answer. It synchronously rereads settled human evidence,
so a contradictory correction cannot race an asynchronous relearn tick. Arbitrary
and broadened payloads are rejected. Exact question/group conditions survive
editing a rule's description or answer. A changed settlement is no longer
silenced as a duplicate event; an identical replay remains quiet. A staging-prune
failure is reported through Sentry while the already-persisted approval returns
its real successful result.

Additional native refusal testing found that a definitely rejected attempt kept
an open lifecycle/claim that blocked bounded retries and later explicit human
resolution. Rejected attempts now permit the existing three-attempt limit and
human resolution after exhaustion. Unknown or accepted delivery still retains
its claim; the crash/restart/pause/no-resend test passes unchanged.

Regression fixtures still using the superseded project-path selection, anonymous
transcript samples, overlapping-scope priority and poll-count handoff timeout
were updated to the approved native identity, provenance and deadline contracts.
No production risk threshold was lowered to make a test pass. A shared native
human-pair factory replaces repeated unauthenticated samples. The two related
entry-staged scope/factory test changes are incorporated; the untouched staged
CLI/message-handler tests remain for V2-15.

## Verification and limits

`checks/V2-14-initial-vitest.json` records the initial failures;
`checks/V2-14-regression-red.json`, `V2-14-editor-red.json`, `V2-14-retry-red.json`
and `V2-14-exhausted-retry-red.json` demonstrate the new checks failing before
the corresponding fixes. `checks/V2-13-vitest.json` is the final 21-case result;
`checks/V2-13-traces.json` contains native intents, decisions, checkpoints,
Suggestions, transport requests and filesystem accesses. All 21 fixture cases
record zero productive-boundary violations. `checks/V2-14-targeted.json` records
the final 622 targeted tests. Initial targeted failures and subsequent corrected
receipts are retained separately; no full suite or `validate:push` was run.

The scoped TypeScript driver checks 15 production/test roots and dependencies
with Node/DOM/JSX/jest-dom declarations. Early check configuration lacked JSX and
matcher types; the driver was corrected. Existing callable/cast mock typing in
the changed web-server test and a mutable boolean fixture were corrected. The
final typecheck has zero root or dependency diagnostics. Final check commands,
exit codes and logs are recorded in `checks/V2-14-checks.json`.

The harness uses the actual lifecycle/supervisor, selected CLI worker, native
session callbacks/domain handlers, admission/resolution, filesystem stores,
settlement event, scheduler, synthesis, evaluator and Suggestions IPC. It replaces
OS child execution, Electron, transport framing and the renderer send boundary.
It does not execute the live WebServer listener, actual manager reasoning or the
installed candidate. The read-only installed single-tab receipt at
`/home/chris/.maestro/pianola-setup-20261028/live-autoanswer-acceptance.json` proves
its previously exercised path only. It does not establish installation of this
candidate or fleet coverage.

## Unfulfilled requirements and next actors

- **U02 — V2-05/06/07 Auto Run agent:** finish current per-agent failure/coverage
  reporting and rendered scope-control/lifecycle tests. Worker health and census
  counts are present; they do not establish complete current per-agent health.
- **L08 — V2-10 Auto Run agent:** persist candidate/evidence/rejection identities,
  linked source examples, exact condition/scope/exclusions and accept/edit/reject;
  prove rejection suppression across restart. Current staging discards synthesis
  candidate evidence and the UI only offers approval/profile apply.
- **L09 — V2-10 Auto Run agent:** retain accepted provenance and expose later
  contradictions as active-rule conflicts with actor/next action, preserving user
  policy. Pending invalidation is repaired; active conflict state is absent.
- **P01 — Mira/prerequisite Auto Run agents:** reconcile and complete unchecked
  V2-05/06/07/10/11/12. This acceptance execution does not mark those tasks done.
  Rerun the affected matrix before claiming full V2-16 completion.

V2-15 owns the scoped commit/WIP/upstream-diff and publication assessment. It may
review this partial candidate, but must retain these failures and the
installation boundary. No PR/CI or installed-readiness claim is made here. After
source completion and independent review, installation/restart/productive
activation would require Chris's separate explicit authorization. No such action
was performed. No images were supplied or analyzed. Actual effective model and
effort remain unknown; configured high/high hints are not execution evidence.
