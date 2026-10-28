# Pianola agent/group V2 implementation map

## Baseline and existing work

`baseline/` records the pre-task HEAD, porcelain status, recent/relevant history, and `git diff --binary HEAD`. Existing WIP is staged across the CLI, scope-cycle, desktop tab snapshot, and web-server session callbacks/types/registry. Preserve it. Commits `517b0f829c`, `c7f4ef3192`, `85b28f93b1`, and `25d8e81254` respectively add durable scope cycle/checkpoints, focused lifecycle/checkpoint regressions, lifecycle/snapshot verification, and streaming-question/full-turn-risk enrollment handling.

## Reusable production seams and task ownership

| Task | Existing seam / bounded files |
| --- | --- |
| V2-02 selection | `src/shared/pianola/pianola-scope.ts` (selection validation/ownership; currently root-path based), `src/shared/pianola/storage.ts` (persisted supervisor target validation), `src/shared/pianola/pianola-scope-cycle.ts` (candidate/owner reconciliation), `src/main/stores/types.ts` and `src/shared/types.ts` (native group/worktree metadata). Restrict changes to selection/storage contracts and cycle integration. |
| V2-03 runtime | `src/shared/pianola/pianola-scope-cycle.ts`, `pianola-scope-checkpoint.ts`, `pianola-watcher.ts`; `src/main/pianola/pianola-supervisor.ts` and `pianola-lifecycle.ts`; `src/main/web-server/callbacks/sessionCallbacks.ts`, `src/main/web-server/handlers/messageHandlers/sessions.ts`, `src/shared/desktopTabs.ts`; `src/cli/commands/pianola-supervise.ts` / `pianola.ts`. The supervisor and lifecycle already run; cycle/checkpoint hooks and callback snapshot updates are current WIP. |
| V2-04 decisions/handoff | `src/shared/pianola/pianola-watcher.ts` (rule decision, durable intent, judgment handoff, timeout/failure), `pianola-risk.ts`, `decision-log.ts`; `src/cli/commands/pianola.ts` (handoff payload/transport); existing session callback/registry path. Wire selection and recipient/current-ask revalidation through these seams. |
| V2-05 UI/CLI | `src/main/ipc/handlers/pianola.ts`, `src/main/preload/pianola.ts`, `src/renderer/components/PianolaDashboard/{PianolaDashboard.tsx,PianolaTabControls.tsx,usePianolaSupervisor.ts}` and `src/renderer/components/PianolaModal/*`; extend `src/cli/commands/pianola.ts`. Reuse existing supervisor UI, modal, rules, and IPC APIs. |
| V2-06 regression authoring | Existing tests: `src/__tests__/shared/pianola/pianola-scope-cycle.test.ts`, `pianola-scope-checkpoint.test.ts`, `src/__tests__/cli/commands/pianola.test.ts`, web-server message handler/factory tests. Add focused selection, lifecycle, handoff, CLI, IPC, and rendered-control coverage at these seams. |
| V2-07 execution | Commands and exact files to be recorded in `checks-plan.md` by V2-06; do not broaden to full suite. |

Native groups use session `groupId` (`src/main/stores/types.ts`, `src/shared/types.ts`) and group registry/CRUD; worktree agents use `parentSessionId` in session records. The existing supervisor auto-registers top-level sessions and explicitly excludes children. Neither path alone supplies persisted group/whole-agent selection.

Rules are defined/validated in `src/shared/pianola/types.ts` and `storage.ts`, evaluated by `src/shared/pianola/pianola-policy.ts` and `pianola-watcher.ts`, and managed by the Pianola CLI. Judgment handoff is in watcher + CLI transport. Risk classification is in `pianola-risk.ts` and full-turn detection in `pianola-watcher.ts`. Learning reuses `transcript-mining.ts`, `decision-log.ts`, `pianola-relearn.ts`, `pianola-synthesis.ts`, `pianola-store-main.ts`, and `pianola-relearn-scheduler.ts`; Suggestions persist through `storage.ts` / `fs-store.ts` and render in `PianolaModal/SuggestionsView.tsx`.

## SPEC acceptance case to seam map

| SPEC acceptance area | Existing seam to extend / evidence to target |
| --- | --- |
| Whole agent and group identity selection; new/existing chats; worktree ancestry; movement, exclusions, manager/self, overlap and legacy paused watches | Scope contract/ownership + cycle candidate snapshot; native groupId and parentSessionId metadata; storage validation/migration. V2-02, then production reconciliation V2-03. |
| Bounded scheduling, discovery, pause/restart, enrollment baseline, streaming same-ID update, dedup, per-tab isolation, full-turn risk | Supervisor/lifecycle + scope cycle/checkpoint + watcher; web-server session callbacks provide native tab snapshots. V2-03. |
| Rule vs Mira vs Chris decision path, recipient/selection/pause/current-pending revalidation, provenance, intent/ack and uncertain delivery | Watcher/policy/risk/decision log + CLI handoff and native send callback. V2-04. |
| Human-only learning, attributable Chris decisions, idempotent source, scoped equivalence, threshold/contradictions, approve/edit/reject-only activation | Decision log/transcript mining/relearn/synthesis/store + Suggestions view. V2-04 for attributable lifecycle inputs, V2-05 for existing UI integration. |
| Truthful coverage and six actor/status states; setup by agent/group, exclude and pause/resume; manager setup CLI | Supervisor health and IPC/preload + Pianola dashboard/tab controls/modal + CLI. V2-05. |
| Regressions fail when production wiring is removed; fixtures isolate stores/transports and do not message productive agents | Shared/CLI/web-server existing test files plus focused renderer/IPC coverage. V2-06; execute only in V2-07. |
| Installed runtime distinction and no live activation/restart/install | Source/fixture evidence only in this worktree; installed acceptance remains outside this playbook per SPEC. |

## Run metadata

Native `auto-run-status --json` reported task-based progress: 3 documents, 16 total tasks, current task index 0, loop disabled. The SPEC declares low/medium/high as Luna6/Terra6.1/Sol6.1; actual per-task model/effort telemetry was not exposed to this task and is recorded as unknown in `PROGRESS.json`.
