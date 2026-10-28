---
type: reference
title: Pianola recovery focused regression checks
created: 2026-10-28
tags:
  - pianola
  - recovery
  - regression
related:
  - '[[SPEC]]'
  - '[[recovery-coverage-contract]]'
  - '[[recovery-diagnosis]]'
---

R03 authors monitoring regressions only. **No tests, lint or type checks executed.**
Formatter write and whitespace inspection are the only local mechanical operations.
R04 owns execution, bounded repairs and `checks/recovery-monitoring.json` receipts.
No production source or productive configuration changed. Actual model/effort unknown.

## Monitoring matrix and production seams

| Required behavior | Existing meaningful regression reused / new assertion |
| --- | --- |
| First enrollment with missing cursor; restoration baseline; healthy sibling | scope-cycle test strengthened; native acceptance `R03 current native coverage status` asserts actual supervisor-list projection and no stale send |
| Current configuration/registry ownership, selection/overlap/legacy pause before next cycle | native R03 table: matching old census retained as history, current fingerprint/ownership stale immediately |
| Freshness, future census, old schema, restart/stopped worker, corrupt/unarmed checkpoint | native R03 table checks stale/blocked, actor/action, owner cleared; no worker-running shortcut |
| History failure/retry with unchanged cursor; delivery refusal/retry; failed census | scope-cycle new `current coverage failure producers`; old incomplete-census assertion updated to require persisted error with zero enrolled tabs |
| Durable error/schema fields and unknown admitted intent | checkpoint new `current coverage persistence contract`, round trip via a second filesystem store; malformed timestamps/actors/status rejected |
| Paused/excluded/closed membership | scope-cycle producer table; native paused projection retains closed history and error cause |
| Six decision states with responsible actor/action | dashboard table renders all six; explicit question/recommendation remains in real component |
| Human resolution controls, in-flight double submit, acceptance vs acknowledgment, refusal/error | dashboard real form + mocked transport, only decisionId/answer emitted; guard table hides dry-run/acknowledged/admitted/unknown/accepted/wrong-actor forms |
| Real persisted selection/pause/resume, disabled new selection, cancellation | new ScopeControls rendered test composes real usePianolaSupervisor and store with isolated reloadable IPC transport; native select/set-enabled already exercise actual registry storage |
| Native desktop admission/provenance/pending-ask revalidation | native `R03 explicit desktop resolution admission`: paused/busy/removed/changed ask/selection; human actor comes from IPC despite forged payload; duplicate send blocked |
| Existing/new chats, native groups, worktree ancestry changes, explicit selection survives group removal | existing native tests `covers old/new tabs...`, `keeps explicit coverage...`; existing scope lifecycle tests reused |
| Exclusions/overlap/self/Pianola/legacy watches | existing scope-cycle `excludes %s`, oldest overlapping worktree owner; native old/new/overlap tests reused |
| Stream completion with same ID and full-turn risk | existing scope-cycle same-ID/restart and full-risk table; native overlap/stream and high-risk tests reused |
| Restart/dedup/unknown delivery, CLI/desktop admission | existing native unknown admission crash/restart/pause, bounded refusals, final native admission recheck; existing unit durable-intent-before-send tests reused |

The integration harness is closed to productive stores/processes/transport. It runs real
CLI watch-scope, native census, registry/checkpoint stores, admission and IPC handlers;
Electron/OS/transport framing stay fixtures. Renderer controls use real components;
selection tests use the real hook. This is source acceptance, not installed-desktop proof.

## R04 exact narrow commands

Run from the registered worktree root. Capture output and exit status; do not infer pass
from authoring, collection counts or previous 622-test receipts. Create the existing
`checks/` directory if necessary. No full suite or validate:push.

```bash
npx vitest run src/__tests__/shared/pianola/pianola-scope-cycle.test.ts src/__tests__/shared/pianola/pianola-scope-checkpoint.test.ts src/__tests__/renderer/components/PianolaDashboard/PianolaDashboard.test.tsx src/__tests__/renderer/components/PianolaDashboard/PianolaScopeControls.test.tsx src/__tests__/renderer/components/PianolaDashboard/usePianolaSupervisor.test.ts --maxWorkers=1 --reporter=json --outputFile=.maestro/pianola-project-watchers-20261028/agent-group-v2/checks/recovery-monitoring-unit.json

npx vitest run --config src/__tests__/integration/pianola-native-acceptance.config.ts -t 'R03|covers old/new tabs|keeps explicit coverage|distinguishes native rule receipt|bounds each worker cycle|baselines questions added during pause|routes Mira judgment|escalates high-risk full-turn|retries only definitive|preserves unknown admission|overlaps have one answer|revalidates .* at native admission|blocks productive stores' --reporter=json --outputFile=.maestro/pianola-project-watchers-20261028/agent-group-v2/checks/recovery-monitoring-native.json

node .maestro/pianola-project-watchers-20261028/agent-group-v2/checks/recovery-monitoring-static.cjs

npx prettier --check src/shared/pianola/pianola-scope-checkpoint.ts src/shared/pianola/pianola-scope-cycle.ts src/main/ipc/handlers/pianola.ts src/renderer/components/PianolaDashboard/PianolaScopeControls.tsx src/renderer/components/PianolaDashboard/PianolaDashboard.tsx src/__tests__/shared/pianola/pianola-scope-cycle.test.ts src/__tests__/shared/pianola/pianola-scope-checkpoint.test.ts src/__tests__/renderer/components/PianolaDashboard/PianolaScopeControls.test.tsx src/__tests__/renderer/components/PianolaDashboard/PianolaDashboard.test.tsx src/__tests__/integration/pianola-native-acceptance.integration.test.ts

npx eslint src/shared/pianola/pianola-scope-checkpoint.ts src/shared/pianola/pianola-scope-cycle.ts src/main/ipc/handlers/pianola.ts src/renderer/components/PianolaDashboard/PianolaScopeControls.tsx src/renderer/components/PianolaDashboard/PianolaDashboard.tsx

npx eslint -c eslint.dashes.config.mjs src/__tests__/shared/pianola/pianola-scope-cycle.test.ts src/__tests__/shared/pianola/pianola-scope-checkpoint.test.ts src/__tests__/renderer/components/PianolaDashboard/PianolaScopeControls.test.tsx src/__tests__/renderer/components/PianolaDashboard/PianolaDashboard.test.tsx src/__tests__/integration/pianola-native-acceptance.integration.test.ts

git diff --check
```

The static driver reuses V2-14's compiler options, restricting roots to R01/R02 source
and R03 tests plus their dependencies. It writes `checks/recovery-monitoring-static.json`.
The integration harness writes its existing `checks/V2-13-traces.json`; preserve that
trace as `checks/recovery-monitoring-traces.json` immediately after this selected run.
Prior V2-13/V2-14 learning and unrelated receipts remain historical; do not rerun those
learning cases until R09 unless a monitoring repair changes their production dependencies.

## Source-inspection lead for R04

The failed-census branch in scope-cycle currently assigns `deps.watch.now()` (ISO string)
to checkpoint `activatedAt` / `lastCycleError.observedAt` (integer milliseconds). New
regressions deliberately require numeric persisted errors both before and after enrollment.
This is an unexecuted source finding, not a test receipt. R04 must diagnose/repair within
its authorized bounded-defect scope; do not weaken schema assertions to obtain green.

R03 completion means missing cases are authored and mapped. Original V2-05/06/07 and U02
remain pending R04 checks. Publication remains R11 after R10; no PR from this authoring task.
