---
type: requirements-reconciliation
title: Relay IMAP host and Backstage interface reconciliation
created: 2026-10-07
status: required-before-public-contract
tags: [relay, imap, host, backstage]
related:
  ['[[relay-imap-host-contract-20261006]]', '[[relay-imap-host-integration-status-20261007]]']
---

# Backstage requirements for this existing host package

Read in full:
`/home/chris/code/Maestro-Backstage/.maestro/playbooks/2026-10-06-Relay-Mail/HOST-HANDOFF-20261006.md`.
Also read the implementation plan, host gate, independent event-state semantics,
test execution and integration-halt records in
`/home/chris/code/worktrees/feat/relay-imap-provider-20261006/docs/relay-mail-implementation-20261006.md`.
Read-only source inspection confirms the local payload in `mail-metadata.ts`.
Plugin commit `71ae91ba87f96710213b4dd96f2f9b55422c8d5e` exists
(`MAESTRO: add durable Relay mail dedupe and checkpoint state`). These are plugin
domain seams; they do not establish a callable host SDK contract.

The host's early proposal now exists at
`/home/chris/code/worktrees/feat/relay-imap-host-20261006/docs/relay-imap-host-contract-20261006.md`.
Its prior absence in the Backstage ledger is a historical inspection, not current
absence. Public SDK implementation and readiness remain pending. No launch or
consult timeout establishes agreement.

## Exact event projection and mapping to reconcile

Backstage's local projection requires **exactly** this seven-field payload:

```typescript
interface RelayMailMetadata {
	reference: string;
	accountId: string;
	folder: string;
	uidValidity: string;
	uid: string;
	receivedAt: number;
	sizeBytes: number;
}
```

This is a requirement/local plugin type, not a newly implemented SDK export.
The current host proposal uses `mailbox`, `arrivedAt`, `size`, an object reference
and host-derived `pluginId`. Reconcile these differences **before** shared SDK/event
types are written: explicitly map local folder/receivedAt/sizeBytes/reference to
host mailbox/arrivedAt/size/structured reference and back through a tested closed
adapter. This review does not freeze public host field names. Preserve host-derived
plugin provenance while retaining the exact seven-field local projection; provenance
can live in the trusted event envelope. Never spread broker records or include
subject, sender, attachment descriptors/content, previews, body or credentials.
Closed projection and serialized UTF-8 payload must be <=4 KiB.

Independent rights also differ in spelling: plugin `attachment`, proposed host
`attachments`. Explicit mapping must preserve independent read/detail/attachment
authority; renaming never implies or widens rights. All public names stay proposed
until implemented versions, capabilities and tests are reported.

## Admission, setup and bounded reads

Administrative setup is user-authorized and separate from read-only agent
principals. It must support masked status and explicit exact-account/agent grants,
keep credentials in private host storage and exclude setup payloads from logs,
traces, history, prompts and Cue. No account/grant mutation tool or plugin-supplied
caller identity. Null, spoofed, deleted, stale or foreign callers deny before fetch
and delivery. Async context must remain invocation-specific. Revoke/disable/remove
cancel reads/watches and suppress late delivery; failed administrative persistence
retains stopped state until successful reconciliation, with restart behavior stated.

Generic configured IMAPS with validated TLS, EXAMINE and BODY.PEEK must preserve
Seen/flags. Required limits: 50 rows, 64 KiB metadata/page, 256 KiB UTF-8 body,
16 attachments, 8 MiB each and 16 MiB aggregate; search <=256 characters,
header fields <=512 characters. The proposed host search/display limits are larger;
public admission/projection must enforce these tighter budgets or document an
explicit verified adapter. Bound network/literals/decoded bytes/allocation/time,
refuse incomplete or oversized bodies/attachments, allow explicit truncation only
for lists, use fixed errors and the plugin's allowlisted MIME set.

## One state owner and durable acceptance

Deduplicate within `(pluginId, accountId, folder, uidValidity, uid)`; UIDs are
folder-scoped. First/reset requires a consistent max-UID snapshot. Reconnect scans
must enumerate **all** arrivals above the checkpoint in ascending UID order:
pagination/bounds must never advance past unobserved lower UIDs. Replay pending
first and do not skip failed delivery. A notification triggers a scan, not cursor
advancement.

Choose and document one producer/checkpoint owner. The host proposal owns watches
and producer state; plugin `mail-events` owns an independent injected local seam.
Do not deploy two authoritative cursors. The plugin's atomic 1 MiB snapshot cannot
be written through the existing generic 64 KiB KV value cap. Use an explicit proven
storage/state adapter or keep host producer ownership and adapt the plugin; never
claim ordinary KV already supplies that contract or widen it silently.

Stable retries require durable host event-ID receipts through Cue acceptance,
queueing and dispatch/restart. Record disabled/zero-subscriber consumption versus
later enablement, filtered delivery, revoke-before-drain/restored execution,
UIDVALIDITY reset, folder removal, shutdown and receipt retention/expiry. Refuse
durable acknowledgement on failed persistence. Retention must cover possible
producer retries; pending receipts cannot be evicted. Do not promise exactly-once
agent execution across an ambiguous spawn/crash boundary. No dispatch without an
active user-enabled Cue consumer; no mail-directed Vault work or separate task-state.

## Execution and reporting

The existing host Auto Run is the sole implementation path. Its discovery task
already completed before this follow-up arrived; an unchecked reconciliation task
is inserted at the beginning of the existing HOST-03 document, before public
identity/SDK names are selected. It must reread both ledgers and incorporate this
mapping into the proposal/evidence without treating it as implementation. Future
HOST-04 event work must read this requirement too.

No new engine, host dispatch, callback, installation, real login, Discord message,
plugin edits or upstream merge. Report exact implemented types/version/permissions,
commit and host/SDK/Cue tests in supplied dispatch tab
`49b2bcba-9860-41b1-904e-4ed34c10a74e` when they exist. Current status remains
[[relay-imap-host-integration-status-20261007]].

## Additional contract review: central panel and content snapshots

Fully read the review ledger
`/home/chris/code/Maestro-Backstage/.maestro/playbooks/2026-10-06-Relay-Mail/HOST-CONTRACT-REVIEW-20261006.md`.
Its initial absence/no-source observations are historical; its adapter differences
and final public-gate-closed addendum remain relevant. Host IDs, sealed config,
grants/revisions/tombstones are authoritative. Plugin ID minting, private grants,
WeakMap admissions and local event publisher/cursor remain mock scaffolding.
Never re-mint host IDs or use local strict ID syntax as host authority. Preserve
`net.connect` as wss-only. Nested calls require host-minted plugin-bound
`mailInvocationId`; verified callerAgentId alone cannot authorize them.

The current `requestSetup()`/`listAccounts()` proposal is insufficient for the
central Relay panel. The reconciliation task must specify the following secure
user flow and actual implemented types before plugin integration:

- Central panel shows only host-issued account IDs, revision, enabled/status,
  credential presence/mask, configured mailbox labels and an approved read-only
  rights projection/summary for that plugin's accounts. State which view is
  available to ordinary plugin callers versus the dedicated trusted setup frame;
  never expose username/endpoint/password to compensate for missing view fields.
- A setup-entry request may select a closed navigation intent (add, test, rights,
  disable or remove) and an exact existing account ID where appropriate. These are
  proposed navigation semantics, not implemented methods. Opening/selecting a
  host setup screen never executes that operation, grants rights or tests login.
  Unknown/foreign accounts fail closed; the frame re-resolves current revision.
- All credential/config/grant/revoke/test/disable/remove operations occur only
  after user authorization inside the trusted host setup frame. Intent targeting
  is not a setup capability, nonce or user gesture. No plugin command carrying
  passwords or grant mutation, and no read-only agent can become setup principal.
- Document how saved/failed/closed/canceled setup refreshes the central panel's
  account/status/rights view: safe invalidation/version notification or an actual
  read-only refresh path. Notifications contain opaque IDs/revision/status only,
  not secrets. Reread the live host view rather than applying optimistic local
  grants; failed administrative persistence retains stopped state and honest status.
- Test cross-plugin account targeting, invalid navigation actions, frame/nonce/
  gesture identity, masked rights/status projections, refresh races and logging/
  history redaction. Do not claim any new notification topic or setup parameters
  are available until SDK/host/UI wiring and tests prove them.

Body and attachment adaptation must document complete text/plain encoding/byte
counts, allowed MIME types and safe fixed fallback labels for absent filenames.
Names are untrusted display labels, never paths. Define snapshot binding to the
verified invocation, exact account revision/UIDVALIDITY/UID and part, lifetime,
whole decoded size, sequential offsets, canonical base64 and the meaning of
`nextOffset`/`complete`. Enforce limits before chunk assembly and require whole
size/EOF agreement; no partial binary/body success. Document how invocation expiry,
abort/stop, revoke/disable/remove and sandbox teardown close in-flight requests,
discard snapshots and suppress late chunks. A JSON RPC cannot carry an assumed
JavaScript AbortSignal; only an implemented cancellation/lifetime contract counts.

Compatibility remains an explicit gate: host 1.16.0/SDK 0.11.0 versus Relay
minHostApi 1.22.0. Do not lower Relay's minimum or infer Discord/voice/caller
compatibility. Require actual combined identity/SDK/version/Discord/media commits,
parity and regression tests before adapter or manifest edits. Review feedback is
not final-name agreement or API readiness.
