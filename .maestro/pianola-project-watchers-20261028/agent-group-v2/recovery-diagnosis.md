---
type: analysis
title: Pianola recovery R00 reproducible diagnosis
created: 2026-10-28
tags:
  - pianola
  - recovery
related:
  - '[[SPEC]]'
  - '[[recovery-mandate]]'
  - '[[V2-14-ACCEPTANCE]]'
---

R00 diagnoses U02/L08/L09/P01 on source 5edef58da8. No production source changes.
Read SPEC, mandate, acceptance and recovery ledgers; no repository GLOSSARY/ADR found.
Skill phases 1–4 apply; fixes/permanent regressions (phases 5–6) belong to R01–R09.
No images supplied/analyzed. Actual model/effort unknown; configured hints are not evidence.

## Exact feedback loop

From the registered worktree root:

```bash
python3 .maestro/pianola-project-watchers-20261028/auto-run/Working/R00-repro.py
```

Disposable debug driver reuses the existing native acceptance fixture scaffolding,
then generates/removes its temporary test/config. Cases live in Working/R00-cases.debug.txt.
Real lifecycle, native census callbacks, CLI worker, IPC, filesystem validation/relearn,
and server-rendered SuggestionsView execute. OS/Electron/transport remain closed fixtures.
Pinned clock and fixture-only filesystem/recipients; no network, model or live policy I/O.
Receipts: checks/R00-native.json (assertions), R00-native.log (exact output), R00-traces.json
(checkpoints/staging/cycle issues/boundary violations). Exit 1 is expected: 7 red, 4 green,
11 cases in seconds, same verdicts across two final-shape executions. All boundaries clean.
The initial empty-selection probe failed validation; replaced with valid other-agent selection.
No 622-test replay. Debug files are explicitly disposable, not R03/R08 permanent regressions.

## Ranked falsifiable causes and observed probes

1. **Coverage error data is lost between cycle and status.** Prediction: missing native
   cursor produces cycle issue but supervisor status lacks it. Confirmed: cycle emits
   `Transcript cursor unavailable: fixture-agent/fixture-old-tab`; status has worker running,
   checkpoint armed, tab suspended, without failure cause/actor/action. Existing suspension
   protects delivery; it does not explain failure. A valid selection change before another
   cycle returns the old fingerprint/active tab. Current freshness/ownership must be projected.
   Seams: scope-cycle.ts:428; scope-checkpoint.ts contracts; IPC pianola.ts snapshot.
2. **Relearn/storage discard existing synthesis evidence.** Prediction: three real attributed
   settlements stage a disabled proposal, but restart/get-suggestions omit exact source IDs.
   Confirmed: source `fixture-message-1` absent; aggregate pairCount survives, individual
   candidates do not. Synthesis already returns candidates/evidence; runRelearnJob discards
   them and validatePianolaSuggestionsFile accepts only legacy fields.
3. **Review operations are absent rather than broken freshness checks.** Prediction: real
   Suggestions render contains Approve but no Reject/Edit/source links; native rejection
   handler absent; changing only proposed answer fails `StaleOrChangedSuggestion`. Confirmed.
   That rejection is a working safety guard, not permission to weaken stale-evidence checks.
   Reject restart suppression cannot execute past missing handler; storage inspection also
   finds no rejection records. Diagnostic endpoint/field names are provisional R05 contracts.
4. **Accepted provenance/conflict persistence is absent.** Prediction: accept an exact rule,
   correct its human source, restart: rule remains enabled but no review conflict is exposed.
   Confirmed (`conflicts` absent). Existing duplicate-rule suppression in synthesis is not
   conflict detection. Preserve user policy while adding review metadata. Notification control
   passes: first correction of learned evidence triggers once; identical replay stays quiet.

## Already fixed; preserve

Three reused native controls pass: forged, broadened and corrected/stale approvals rejected.
Corrected pending proposals clear through native settlement scheduling; no poll inference.
Existing synthesis threshold/source identity, exact scoped disabled proposal, explicit exact
approval and native group/selection/pause controls exist. Six lifecycle labels/actor/action
rendering already exists in PianolaDashboard; complete rendered/control receipts remain due.
Do not replace these mechanisms or certify V2-05/V2-10 from old 622 passing checks.

## Bounded next edits and ownership

Paths below are relative to src/; tests/check execution remain separate tasks.
- R01: shared/pianola/pianola-scope-checkpoint.ts, pianola-scope-cycle.ts and
  main/ipc/handlers/pianola.ts: persist current failures; project config/freshness/actor/action.
- R02: renderer/components/PianolaDashboard/{PianolaScopeControls,PianolaDashboard}.tsx
  plus existing usePianolaSupervisor.ts contract: consume R01, wire guarded human resolution.
- R03/R04: extend existing scope-cycle/native IPC and rendered dashboard tests; run only affected checks.
- R05: shared/pianola/{storage,fs-store}.ts, main/pianola/pianola-relearn.ts and
  main/ipc/handlers/pianola.ts: durable source-linked review records and explicit edit/reject APIs;
  extend existing preload/renderer API declarations as required by that contract, no new subsystem.
- R06: reuse R05 storage, main/pianola/pianola-store-main.ts settlement event and relearn/synthesis:
  accepted provenance/conflict revalidation. Notification already passes; change only if new evidence needs it.
- R07: renderer/components/PianolaModal/{SuggestionsView,PianolaModal}.tsx and existing bridge:
  evidence links/count/exclusions, explicit edits/rejections and durable conflict review.
- R08/R09: existing storage/relearn/native/rendered tests; restart/source identity/correction matrix.
- P01: PROGRESS.json confirms V2-05/10 in_progress; V2-06/07/11/12 receipts absent.
  Reconcile only after R04/R09. R10 reruns original repros after adapting provisional field contracts.
- R11/R12: current-base publication/report only after zero failed acceptance criteria; no PR now.

Owner/next actor: same worktree Auto Run agent, starting R01. No human blocker or halt.
Acceptance remains 28 pass/4 fail, candidateReady false, installed false. No activation/restart.
