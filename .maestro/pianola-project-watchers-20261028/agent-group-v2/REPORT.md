---
type: report
title: Pianola V2 partial handoff
created: 2026-10-28
tags:
  - pianola
  - handoff
related:
  - '[[SPEC]]'
  - '[[V2-14-ACCEPTANCE]]'
  - '[[V2-15-PUBLICATION]]'
---

# Pianola V2 partial handoff

## Candidate and changed behavior

Reviewed candidate source head: `d020c15d4b` (`MAESTRO: preserve Pianola census tests and document publication boundary`). The implemented candidate adds native agent/group identity selection, scope workers and guarded admission, manager decision lifecycle, human-decision evidence and narrow relearning, plus a controlled native acceptance harness. The source changes are only a partial implementation of [[SPEC]]. The fork branch is not a focused upstream PR composition.

## Verification receipts

- Native isolated production composition: **21/21 cases passed** (V2-14 receipt in `checks/`).
- Targeted working-tree regressions: **622/622 tests passed across 12 files** (V2-14 receipt in `checks/`).
- Preserved census regressions: **339 tests passed across two files** (V2-15 publication report).
- Scoped static checks are recorded in `checks/V2-14-checks.json`; do not interpret these targeted receipts as a full-suite or installed-runtime result.
- Acceptance ledger: **28 pass, 4 fail** in `acceptance.json`.

## Unfulfilled acceptance criteria

| Criterion | Status and cause | Owner | Next action |
| --- | --- | --- | --- |
| U02 current per-agent/per-tab coverage, failures and rendered lifecycle controls | Failed. Current UI lacks complete current per-tab failure reporting and complete rendered acceptance. | V2-05/06/07 owners | Finish per-agent failure/freshness display and rendered control/status regressions; record V2-05/06/07 receipts. |
| L08 durable source-linked suggestions, counts/scope/exclusions, edit/reject and rejection suppression | Failed. Candidate evidence is not durably persisted and Suggestions lacks the complete review flow. | V2-10 owner | Persist candidate identity/evidence and rejection fingerprints; implement linked examples and accept/edit/reject; add restart regressions in V2-11/12. |
| L09 accepted learned-rule conflict handling | Failed. Accepted provenance/conflict state and review UI are absent. | V2-10 owner | Persist accepted provenance and surface contradictory evidence as a review conflict without changing policy; test correction/restart. |
| P01 prerequisite implementation/regression receipts | Failed. V2-05/10 are in progress; V2-06/07/11/12 lack completion receipts. | Mira / prerequisite Auto Run owners | Resume these tasks, reconcile actual commits/checks, then rerun affected acceptance. |

## Model, publication and runtime state

Actual effective model and effort telemetry are unavailable. Configured per-task model hints are not evidence of the executed model. No PR exists, no CI result was checked, and the current branch is not ready to publish: the recorded upstream `rc` comparison reports 16 merge conflicts and the candidate requires a focused current-base port. Candidate readiness is **partial / not ready for full acceptance**. Installed runtime status: **installed:false**. No installation, restart, live activation or upstream merge occurred.

## Activation boundary

No native setup or rollback commands are supplied: the current native roster/group IDs are not evidenced in the acceptance inputs, and the candidate is not complete. The existing `selection-proposal.json` is an unapplied draft only. Once the remaining criteria pass, refresh the roster and prepare exact, reviewable setup and rollback commands from those IDs. Do not run them as part of this handoff.

## Next action

Complete V2-05/06/07/10/11/12, update the acceptance ledger from their actual receipts, and rerun affected end-to-end acceptance. Then port the focused implementation to current upstream `rc`, resolve conflicts, run scoped checks, and open a PR. Keep `installed:false` until separately authorized installation and runtime acceptance.
