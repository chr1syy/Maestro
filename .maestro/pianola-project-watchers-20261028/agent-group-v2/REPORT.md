---
type: report
title: Pianola V2 source acceptance and publication handoff
created: 2026-10-28
tags:
  - pianola
  - handoff
related:
  - '[[SPEC]]'
  - '[[recovery-acceptance]]'
  - '[[recovery-publication]]'
---

# Pianola V2 final source handoff

## Acceptance

The recovered source candidate satisfies all 32/32 criteria in `acceptance.json` (zero failures), including the original U02, L08, L09 and P01 failures. Current-base isolated native composition passed 58/58 cases; original diagnostic reproductions passed 11/11. The scoped publication checks passed 778 tests across 12 files, scoped static checks (36 roots, zero diagnostics), formatting, lint and documentation verification. See `checks/recovery-acceptance.json` and `checks/recovery-publication.json`.

## Candidate and publication

Focused current-`rc` candidate: `b355436661bbe1b10c4dc17aef8d4905f55756a7`, based on `be54af44351895e630efccac07d51564cd12e9b9`. Upstream PR [#1942](https://github.com/RunMaestro/Maestro/pull/1942) is open and mergeable. CI and review were pending at the recorded snapshot; no CI pass is claimed. The original source and WIP remain preserved in backup ref `refs/heads/backup/pianola-r11-20261028` and the verified bundle/patch documented in `checks/recovery-publication.json`.

## Proposed productive selection (not applied)

The following native IDs were read from the current Maestro roster. Proposed supervisor manager is Mira (`bd4b5d0b-1ec3-4280-9549-b9584c0da261`). Proposed selected groups are Synapse (`group-a5814954-a23a-43ab-b226-2ad90d073195`), Maestro (`group-e4f486d7-914c-4939-a783-1f0e852fea7a`) and Clippmann (`group-8d4cffcc-b460-418c-9f9d-8d33ed22e078`). Exclude Mira by ID. These group selections cover future members according to the accepted identity-based contract; review the broad Maestro group membership before any activation. Later RC-Solutions is intentionally not selected yet and remains enrollable by adding its actual native group or agent ID after creation.

Unapplied setup payload:

```json
{
  "kind": "watch-scope",
  "managerAgentId": "bd4b5d0b-1ec3-4280-9549-b9584c0da261",
  "selection": {
    "label": "Synapse, Maestro and Clippmann",
    "mode": "agents-and-groups",
    "agentIds": [],
    "groupIds": [
      "group-a5814954-a23a-43ab-b226-2ad90d073195",
      "group-e4f486d7-914c-4939-a783-1f0e852fea7a",
      "group-8d4cffcc-b460-418c-9f9d-8d33ed22e078"
    ],
    "excludedAgentIds": ["bd4b5d0b-1ec3-4280-9549-b9584c0da261"]
  },
  "enabled": true
}
```

Rollback proposal: disable the created `watch-scope` by its returned scope ID using the native Pianola scope controls, then remove that same scope ID if permanent removal is desired. No productive scope was created, changed or activated in this run; the JSON is a review payload, not a command to execute.

## Runtime boundary and ownership

Source candidate is ready; upstream CI/review is pending; installed runtime is **false/unverified**. No merge, installation, restart, or live activation occurred. Effective model and effort telemetry are unavailable (`unknown`); configured task tiers are not execution evidence. No images were analyzed. Mira owns the next step: monitor PR #1942 CI/review, then separately coordinate any approved installation and productive activation. See `results.json` and `RECOVERY.json` for the task receipt.
