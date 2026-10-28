---
type: report
title: Pianola current rc candidate publication
created: 2026-10-28
tags:
  - pianola
  - recovery
  - publication
related:
  - '[[SPEC]]'
  - '[[recovery-acceptance]]'
---

R11 passed: [upstream PR #1942](https://github.com/RunMaestro/Maestro/pull/1942) is open and non-draft against current `rc` at `be54af44351895e630efccac07d51564cd12e9b9`. Candidate `b355436661bbe1b10c4dc17aef8d4905f55756a7` is the single commit on fork branch `fix/pianola-agent-group-supervision-20261028`. GitHub reports mergeable. CI/review was running at the recorded snapshot; no CI pass is claimed.

All 17 actual source/base conflict files were resolved (the earlier simulation recorded 16). Upstream routing, Encore defaults, idle/retirement behavior, parked-tab history, live-agent filtering and Relay accounting are retained. Strict native receipts now follow the existing routing argument. Native acceptance fixtures reflect the new settings contract and accept an optional trace output path.

The verified remote diff equals the local diff: 67 source/test/doc files, 9,178 insertions and 432 deletions. It excludes internal receipts, unrelated ancestry, CI/hooks and package changes. Actual PR/base/remote/diff receipts and source hashes are in `checks/recovery-publication*.json`; bulky fixture receipts are gzip-compressed.

Current-base checks passed: 778 tests across 12 affected files, including 58 native composition cases with zero filesystem/recipient boundary violations; scoped TypeScript (36 roots, zero diagnostics); changed-source/test lint, formatting, whitespace and documentation verification (1,086 paths and 364 index pairs). Earlier unaffected receipts are reused. The initial global pre-push check ignored `HUSKY=0`; it was stopped during formatting before later checks. A command-only hooks override completed the scoped push. No global/versioned hook changed.

Original source `a4805bc814412f00ace57823b4d5de71b2b59ea0`, including `5edef58da8`, remains reachable through verified backup ref `refs/heads/backup/pianola-r11-20261028` and checked bundle/patch under `auto-run/Working`. Original tracked worktree was clean. The same registered worktree was used throughout; it is back on the original branch for the internal ledger and R12. Publication and internal bookkeeping use separate commits to keep receipts outside the PR.

Authoritative bounded receipt: `checks/recovery-publication.json`. Model/effort: unknown. No images. Installed: false; no restart, installation, live coverage activation or merge. R12 owns final reporting; CI/review owns the publication boundary.
