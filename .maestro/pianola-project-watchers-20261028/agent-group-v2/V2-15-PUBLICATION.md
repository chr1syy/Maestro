---
type: report
title: Pianola V2 publication boundary
created: 2026-10-28
tags:
  - pianola
  - publication
related:
  - '[[SPEC]]'
  - '[[V2-14-ACCEPTANCE]]'
---

The reviewed candidate at `550b3b79b5d44b92b5b4a774a0e54f05f0f1b7ca` is partial. V2-14 records four failed SPEC requirements and missing V2-05/06/07/10/11/12 completion receipts. Its 21 isolated integration cases and 622 targeted tests passed on the recorded working tree; the candidate is not installed or ready for full acceptance.

Fetched `upstream/rc` at `be54af44351895e630efccac07d51564cd12e9b9` and fork branch at the candidate commit above. Their merge base is `9c1561e538f17ac61a949ccab3211b55bfd6f647`; upstream has 960 commits absent from candidate and candidate has 19 commits absent from upstream. The five LAN commits immediately before the first Pianola commit are in the merge base, already reachable from upstream, and are not extra PR commits. The merge-base diff contains 102 files and 50,106 insertions, including 40,701 lines of fixture traces and other internal execution evidence; it needs review and pruning for an upstream PR.

`git merge-tree --write-tree upstream/rc HEAD` exited 1 with 16 content conflicts: CLAUDE.md; docs/agent-guides/CANONICAL-UTILITIES.md; docs/agent-guides/CLI-UI-PARITY.md; src/__tests__/main/web-server/web-server-factory.test.ts; src/cli/commands/pianola.ts; src/main/pianola/pianola-lifecycle.ts; src/main/pianola/pianola-supervisor.ts; src/main/web-server/WebServer.ts; src/main/web-server/callbacks/commandCallbacks.ts; src/main/web-server/callbacks/sessionCallbacks.ts; src/main/web-server/handlers/bridgeDenyList.ts; src/main/web-server/handlers/messageHandlers/types.ts; src/main/web-server/managers/CallbackRegistry.ts; src/main/web-server/types.ts; src/renderer/components/PianolaDashboard/PianolaDashboard.tsx; src/shared/pianola/storage.ts. This was a merge simulation; no merge or working-tree conflict was performed.

The preserved staged CLI census and WebSocket census tests directly exercise the candidate's native discovery transport; they are included in the V2-15 commit. Their focused Vitest run passed 339 tests across two files. `git diff --check` and `git diff --cached --check` passed before the task edits. Full push validation was skipped under the scoped-check instruction. Actual model and effort are unknown; no image was supplied.

No upstream PR exists for this fork branch (GitHub `gh pr list`, all states). Do not publish the existing branch as a reviewable PR: first complete the missing SPEC work and regressions, prepare a clean branch from current upstream rc, port only relevant source/tests/docs, resolve the listed conflicts, exclude internal fixture receipts, and rerun relevant checks on that composition. The instruction for this run explicitly prohibits creating a new worktree or delegating, so that branch preparation belongs to the subsequent owner. The existing commit range and this WIP test commit preserve the local candidate for that port. No CI result was checked or claimed; no install, restart, live activation or merge was performed.
