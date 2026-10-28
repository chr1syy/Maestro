---
type: reference
title: Pianola native candidate acceptance harness
created: 2026-10-28
tags:
  - pianola
  - fixtures
  - acceptance
related:
  - '[[SPEC]]'
  - '[[IMPLEMENTATION-MAP]]'
  - '[[checks-plan]]'
---

Authored for V2-13; execution belongs to V2-14. `installed: false`. No runtime
acceptance, model execution, CI result or installed feature readiness is claimed.
No associated images were supplied or analyzed.

## Production composition

The harness uses `createPianolaLifecycle` and its actual supervisor/relearn
scheduler. A child-process fixture validates the supervisor's generated argv,
manager identity and data directory. Its controlled poll invokes the real
`pianolaWatchScope` CLI worker in once mode. Worker construction, scope cycles,
watcher, classifier, risk, policy and checkpoint logic are all production code.

The transport adapter routes requests to the actual native session/history,
reply, resolution and notification domain handlers. `registerSessionCallbacks`
builds real metadata and histories from the fixture session store and liveness
probe; the test never reconstructs the supervision census or its cursors.
`deliverPianolaScopeDecision` and `resolvePianolaDecision` perform native
admission, claims and receipts. The renderer send boundary asserts a durable
admission and checkpoint claim already exist, the exact agent/tab, background
placement, no force, and required receipt. A send receipt alone never appends
fictional receiver activity: tests explicitly supply later transcript/process
observations and require the real cycle to recognize them.

Human actions enter the registered `pianola:resolve-decision` IPC handler with
an explicitly bound fixture desktop identity. A transport adapter forwards its
actor to the same production resolver used by WebServer; the WebServer object,
HTTP/WebSocket listener, CLI command parser and renderer UI are not instantiated.
The actual main-process append event drives the lifecycle's real scheduler,
settled-evidence ingestion, synthesis and filesystem Suggestions store.
Suggestions read/accept uses registered native IPC. No test directly calls the
synthesis function or manually ticks the relearn job to make an event test pass.

## Expected traces

These are assertions, not observed pass receipts. Each row maps to a test; the
four admission variants are four separate cases (16 cases total).

| Case | Required production trace |
| --- | --- |
| Identity coverage | Existing stale ask baselined; old-tab new activity, a new tab and new group member handled; worktree included via parent ID despite a different group/cwd; same-directory outsider, excluded agent, manager and paused legacy watch untouched; one scope child. |
| Membership changes | Group-only agent suspended on move; worktree reparenting baselines its pending ask; removing group selection preserves explicitly selected agent. |
| Rule continuation | Durable intent/claim -> exact requesting tab accepted -> no acknowledgement yet -> observed user reply/live process becomes `agent_running` -> next finished assistant response becomes `done`. Active sibling receives nothing. |
| Bounded scheduling | 25 changed tabs -> first cycle reads exactly 20 histories -> round robin reaches all 25 -> one child. |
| Pause baseline | Disabled scope has no running child; a question added while paused is baselined on resume; only subsequent activity receives an answer. |
| Mira handoff | Unknown routine -> correct manager tab receives fenced context and decision-ID resolver -> wrong manager tab rejected -> bound manager answer to original receiver -> observed continuation/completion; no human sample. |
| High-risk Chris path | Earlier full-turn merge/production intent + innocuous final question -> high risk -> `waiting_human` -> no rule answer or Mira handoff; unchanged polling emits no second notice. |
| Three human decisions | Independent question IDs -> real human IPC -> immutable Chris evidence -> settlement event -> staged counts 1/2/3 -> disabled exact agent/group-condition proposal -> explicit accept -> persisted enabled rule -> restart -> fourth same-scope ask matches -> rule output does not increment human count; same words on another agent go to judgment. |
| Human provenance/dedup | Unbound desktop answer excluded; bound answer counted once; replayed same source does not regenerate Suggestions or increase count. |
| Uncertain delivery | Native claim -> lost receipt -> `blocked`/unknown -> supervised backoff/restart -> lifecycle restart -> durable pause -> resume -> no resend -> real observed receiver activity reconciles original claim. |
| Overlap/streaming | Two overlapping scopes -> busy stream baseline -> same-ID/same-text stream becomes idle -> one owner, one answer; repeated polling deduplicates. |
| Admission paused/busy/removed/changed-ask | Change after worker preparation and before native admission -> native rejection -> no renderer send, no dispatched record. |
| Isolation negative controls | Out-of-sandbox store read/write, nonfixture receiver and unsupported generic send transport rejected before I/O; CLI and main stores see the same isolated registry. |

## Isolation and limits

Real shared filesystem stores validate/serialize to a new worktree-local fixture
directory per case. `MAESTRO_USER_DATA` points there, CLI directory resolution is
controlled, and Electron directory fallback throws. A closed fs facade permits
only classified operations inside that directory, including both rename paths;
async fs is unavailable through that facade. All actual read/write paths and
violations are captured. The native fixture bootstrap/cleanup and named receipt
writer use the original fs solely for their explicit worktree-owned paths.

MaestroClient has no network implementation; process spawn has only the
argv-checked fixture implementation. Native send accepts only fixture-prefixed
agent/tab IDs in the fixture roster. Unsupported transport verbs throw, including
unguarded `send_command`. No real provider, productive registry, Cue, OS watcher,
desktop restart, install or productive agent message is involved. The fake OS
watcher is an Electron/process boundary; real supervisor reconciliation is driven
by native IPC. This harness does not prove kernel process spawning or actual
manager reasoning, and it does not replace renderer interaction or installed
single-tab acceptance.

## Known predecessor gaps

Source inspection before execution shows `pianola:apply-suggestion` persists the
supplied rule unchanged. Its current disabled proposal therefore remains
disabled. The acceptance test deliberately requires explicit approval to enable
that persisted draft and does not pre-enable it in the fixture payload. V2-14
must record the actual failure and repair V2-10 before claiming the learning
path passes. Current Suggestions storage also omits source-linked candidate
metadata/rejections/conflict provenance; the broader SPEC review still needs
those checks. V2-05 is unfinished and V2-06/07/11/12 receipts are absent. V2-13
completion means the harness was authored, not that these prerequisites passed.
