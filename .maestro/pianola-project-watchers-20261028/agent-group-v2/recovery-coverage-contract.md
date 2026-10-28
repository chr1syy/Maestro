---
type: reference
title: Pianola R01 current coverage contract
created: 2026-10-28
tags:
  - pianola
  - recovery
related:
  - '[[SPEC]]'
  - '[[recovery-diagnosis]]'
---

## Production contract for R02/R03

Every native supervisor snapshot (list/upsert/remove/setEnabled) now populates
`checkpoints[].coverage`. The original `checkpoint` is historical evidence;
R02 must use the projection rather than counting `checkpoint.tabs[].status`.
The optional TypeScript field permits old snapshot fixtures/clients; an absent
projection means unknown coverage, never healthy. No new channel/preload required.

Scope fields: `configurationFingerprint` (current), `checkpointFingerprint`,
`censusAt`, `ageMs`, `staleAfterMs`, `fresh`, `status`, `reason`, `nextActor`,
`nextAction`, `tabs`. Status is covered/blocked/stale/paused. Freshness measures
metadata census recency, not delivery/acknowledgment or a live all-agent guarantee.
Fresh requires matching selection AND ownership-registry fingerprints, a nonfuture
census within max(30 seconds, three configured poll intervals), and no older census
than the current worker start. Any registry watch/selection/enable change invalidates
historical coverage immediately, including overlap and disabled legacy watches.
Worker missing/failed/backoff/stopped, checkpoint corruption, census failure and
unarmed checkpoints block coverage. Disabled scope projects paused with nobody acting.

`tabs` are keyed by actual agentId/tabId; R02 groups them by agentId. Fields:
status (covered/blocked/stale/suspended/paused/excluded/closed), ownerScopeId,
observedAt, reason, nextActor, nextAction, optional error. Scope stale/pause/worker
failure overrides historical live-tab health and clears current ownership. Closed
tabs remain historical closed entries. Blocked per-tab errors remain visible in
`error` even under a scope override. One blocked tab blocks the scope summary;
other healthy tabs keep their own coverage and continue independently. Current
coverage means enrolled in the last complete native census with an available
cursor, not that an answer was delivered or that every transcript was read this poll.

Persisted checkpoint additions (version 1, backward compatible):
`coverageRegistryFingerprint`, `lastCycleError: { observedAt, reason }`, and
`tabs[].coverage: { observedAt, status, ownerScopeId, reason, nextActor, nextAction }`.
Validation rejects malformed additions. Older checkpoints load but project stale
until refreshed. Missing-cursor first enrollment now persists a suspended member
with blocked coverage; restoration gets a fresh baseline. Closed/excluded/paused
membership has explicit cause/action. History/cursor/iteration-delivery errors
persist; unchanged cursors do not erase them. Successful bounded retries clear
errors; unknown delivery intents remain protected. Failed native census persists
its latest error without refreshing the last successful census, then propagates.

## Source receipt and deferred verification

R01 changes only three production files: shared checkpoint contract/validator,
shared scope cycle producer, and existing main IPC status snapshot. Inspected
producer/persistence/projection call sites and formatted these edits. No tests, type checks, repros, full suites or live operations executed. The existing
commit hook ran staged-file prettier --write and eslint --fix successfully despite
the command-scoped HUSKY=0 environment. This incidental check is recorded here;
regression authoring/execution remains reserved for R03/R04.

R03 must cover missing-cursor first enrollment/restoration; per-tab history and
iteration-delivery errors/recovery; failed/incomplete census; corrupt/old checkpoint;
selection and overlapping registry changes before another cycle; stale/future
census; restarted/stopped worker; closed/excluded/paused membership; grouping by
agent with one blocked and one healthy tab; unknown-intent preservation; the existing
R00 production supervisor repro adapted to this `coverage.tabs` contract. R02 wires
this contract into existing controls; R04 supplies runtime/static passing receipts.
Original V2-05/U02 remain incomplete until those later tasks pass. Installed false;
productive configuration untouched. Effective model/effort unknown. Images: zero.
