# Durable headless dispatch completion: proposed host contract

Status: **design fallback, not an implemented or supported runtime API**.
Source review date: 2026-10-05. Base: `9fe58c7ea` (Chris's Relay host PR #1652 head). This source-only draft
adds characterization tests and a reviewed design. It adds no executable
registration API, scheduler, grant, tool, delivery journal, or Discord sender.
The proposed names below must not be used against the installed application.

## Outcome and precise blocker

The existing primitives cannot safely be composed into the requested return
path. A timer plus desktop callback plus `--require-tool-receipt` would lack
exact-dispatch evidence, retained thread authorization and a durable attempt
claim. It could report a predecessor's result or repeat an accepted send.

The cross-repository blocker is an authenticated **origin binding and completion
queue adapter**. Relay privately owns the mapping from Discord thread to agent
and provider session. The host receives only `agents.send(agentId, prompt,
{ sessionId })`; neither the thread nor its binding revision reaches the host.
The host cannot recover that association from prompt text, another tab, the
agent's latest provider session, or its generic session-ownership ledger.
Backstage must opt into the contract below, supply the already registered
thread through its trusted SDK invocation, validate it live, and serialize
completion turns with normal inbound turns without echoing their final answer.
Implementing a host-only sender that bypasses that missing contract would guess
authorization or duplicate Relay's existing queue replies.

Two additional host implementation gaps are mandatory work, not external
permissions: queue/run/Auto Run provenance and a transactional completion
journal with an MCP pre-send claim. They are specified below. Existing receipt
collection occurs after invocation and has no dispatch or destination field;
it cannot substitute for that journal. A full integration should not ship
until all three pieces and their acceptance tests exist.

For **this handoff**, the original Discord thread was not supplied and there is
no native callback. No future API can retroactively authenticate a guessed
origin for it. Its evidence remains in host dispatch tab
`39a21146-1d46-438c-b8c0-b6471e33cd18`. Backstage can inspect that exact tab
on an explicit manual status check. No automatic return or live delivery was
registered, attempted or verified here.

## Source evidence

| Boundary         | Current implementation                                                                                                                        | Consequence                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| SDK origin       | `plugin-host-handlers.ts`: `agents.send opts` permits only `sessionId`; `rpc-protocol.ts` caller context contains only `callerAgentId`        | Adding a thread to prompt text establishes no retained binding          |
| Resume ownership | `plugin-agent-session-bindings.ts` keys provider sessions by plugin and agent                                                                 | Two threads of the same agent are indistinguishable to this ledger      |
| Dispatch queue   | `hooks/remote/useRemoteIntegration.ts` returns a queued `itemId`, but immediate commands have no equivalent identity passed to process events | Tab identity cannot identify one turn across queue drain/restart        |
| Completion       | `dispatch-callback-registry.ts` accepts tab-key spawn/exit, parks Auto Run by agent and start time                                            | A not-yet-started queued predecessor or later unrelated batch can match |
| Restart          | Native callback registry and `PluginToolRunIdentity` are in-memory maps                                                                       | Registrations and observed receipts disappear on host restart           |
| Receipt          | `messageHandlers/plugins.ts` calls `recordReceipt` after `invokeTool`; receipt stores only run/agent/tool/message IDs                         | No durable pre-send claim, destination evidence or dispatch association |
| Report run       | `plugin-headless-agent-runner.ts` can issue fresh local MCP authority and return host-observed receipts                                       | Reusable execution primitive, not durable reporting/delivery by itself  |
| Relay reply      | Backstage `message-queue.ts` posts a successful `agents.send` final answer to the inbound thread                                              | A completion turn must explicitly suppress that ordinary echo           |

These statements concern the inspected source, not the installed RC's effective
provider configuration. The existing desktop callbacks remain unchanged. Keep
their supported native use with a real originating tab; do not advertise them
as a durable headless return or Discord receipt. Do not extend their agent-level
closed-tab fallback to external completions.

## Proposed API and ownership

This is a generic host completion API with an opt-in Relay adapter, not a
Discord REST implementation in Maestro. No bot credentials cross the boundary.
Allocate a new Host API/SDK minor version at implementation time and update
the vendored SDK and parity tests together. Old plugins keep existing behavior.

### 1. Trusted plugin attaches an origin to an inbound run

Extend SDK `agents.send` with the closed optional `origin` descriptor:

```ts
await maestro.agents.send(thread.agentId, inboundPrompt, {
	sessionId: thread.sessionId,
	origin: {
		adapterId: 'relay-thread',
		bindingKey: thread.threadId,
		bindingRevision: thread.revision,
		inboundKey: discordMessageId,
	},
});
```

The authenticated sandbox supplies plugin identity outside parameters. The
host resolves the exact stored agent and checks trusted code identity, live
feature/plugin state, scoped `agents:dispatch`, unattended consent, prompt
risk, closed schema, ActionGuard and existing provider-session ownership.
`origin` can only reference that plugin's declared completion adapter. It is
not accepted through model arguments, CLI `send`, generic WebSocket dispatch
or user text. `bindingKey` is routing data; it grants no destination rights.

The plugin registers a completion adapter through its sandbox activation:

```ts
maestro.completions.registerAdapter('relay-thread', {
	validateOrigin, // pure read of current registered thread/channel bindings
	enqueueResume, // joins the same queue as ordinary inbound turns
	finishResume, // releases that reservation without posting a normal reply
});
```

The adapter must be declared in the signed manifest with its exact outbound
tool contribution ID (`sh.maestro.relay/send`) and an explicit destination
argument schema (`threadId`, no default-channel fallback). Host-to-sandbox
requests are typed control messages; they cannot invoke arbitrary commands.
Registration adds no capability or consent. Host methods that execute work
use `agents:dispatch`, check its exact target allowlist, and independently
require unattended consent. No wildcard grant is minted.

`registerAdapter` installs local sandbox handlers, like `tools.register`; it
does not make an unscoped `agents:dispatch` RPC. The declared signed adapter
is the host's allowlist for control-message invocation. ID-based completion
operations resolve the stored agent/origin before checking scoped grants;
missing target extraction must never accidentally permit a wildcard call.

`validateOrigin({ bindingKey, expectedAgentId, expectedRevision })` returns
either a denial or `{ threadId, guildId, parentChannelId, agentId, revision,
providerSessionId }` from current plugin-owned bindings. The host requires
agent/revision/key equality and its existing provider-session ownership check.
Unknown/rebound/deleted threads are denied. The host trusts this attestation
only from the currently enabled, trusted owning sandbox; model output cannot
attest it. Relay's outbound tool remains the final destination authority and
must recheck bindings immediately before network work.

The host persists a private `originId` and associates it with the original
host run. Its run proof contains only an in-memory reference to that origin;
proofs are never persisted in this ledger. A first inbound run with no provider
session may register work while running, but reporting is gated until its
actual provider session and the original queue's reply disposition are saved.
If session capture/reply disposition is ambiguous, pause for review; never
resume a different or newly fabricated session to approximate context.

### 2. Originating model atomically dispatches and registers

Expose host-owned MCP tools, discovered through `tools/list`, only on a run
with the retained origin. A registration-only API for arbitrary old tab IDs
is intentionally omitted: the host cannot prove which turn created them.

```ts
// Host-owned tool, proposed name maestro_completion_dispatch.
{
  requestKey: 'caller-stable-key',
  targetAgentId: 'exact-stored-agent-id',
  prompt: 'bounded work request',
  target: { kind: 'new-tab' },
  timeoutMs: 3600000,
}
// Or target: { kind: 'queue', tabId: 'exact-existing-target-tab' }

// Response only after registration and queue admission are committed:
{
  dispatchId: 'host-uuid',
  registrationId: 'host-uuid',
  targetAgentId: 'exact-stored-agent-id',
  targetTabId: 'host-created-or-explicit-tab',
  executionId: 'host-uuid',
  state: 'pending',
  registered: true,
}
```

The host derives `originId`, originating agent, plugin, provider session and
destination from its proof/run association. Caller fields claiming any of
those identities are schema errors. A worker receives its own authority and
no origin proof or outbound rights. Reject self-poke and arbitrary active-tab
fallback; each registration covers exactly one execution identity.

Recheck the **owning plugin's** allowlist and unattended consent for both the
worker and originator. Apply the existing trusted-act, prompt/tool risk,
ActionGuard and audit gates to worker execution and later resumption. Deny
unsupported providers/remote transport or unavailable adapter/tool before
acknowledging a return promise. This authorization is a subset of existing
grants; an agent's OS shell privileges are not a plugin grant.

The host owns a durable work outbox and allocates `executionId` before renderer
admission. Queue/immediate-command messages, persisted `QueuedItem`, queue
drain, spawn config and terminal evidence all carry this ID. New tabs use a
preallocated ID. Admission is idempotent on `executionId` with a durable
renderer acknowledgment. Deduplicate `requestKey` within the original inbound
run/origin plus a canonical payload hash: equal retries return the same record;
different payloads conflict. Never silently replay unknown preexisting work.

Before spawn, commit a unique start claim for the execution ID and actual run
ID. The renderer cannot drain/replay that execution without the host's claim.
A crash between claiming and spawning is an uncertain execution, not a safe
second launch: persist orphan evidence and stop automatic work replay. Queue
deduplication alone cannot prevent duplicate filesystem effects after a run
started and its queue item disappeared.

Persist the intent before handing it to the renderer. A lost acknowledgment
is an admission ambiguity, not permission to dispatch again. Reconcile against
the exact execution ID and durable acknowledgment; if reconciliation cannot
prove admission or non-admission, return `registered: false` with the IDs and
review reason, stop the check, and do not execute/send again. A persisted
registration by itself must not be represented as an accepted dispatch.

### 3. Exact status, evidence and cancellation

Proposed host MCP tools `maestro_completion_status({ dispatchId })` and
`maestro_completion_cancel({ dispatchId })` require the run's attested origin
binding to match the record, including plugin, agent and thread/revision.
Same-agent other-thread proofs are insufficient. A separately authenticated
user-facing manual status read may inspect metadata but cannot create report
authority. Status metadata is unavailable to unrelated agents/runs.
Cancellation never creates a report
or transfers rights; it removes/pauses exactly this check. A worker's generic
run proof cannot cancel another agent's registrations.

Status returns dispatch/registration/execution IDs, target agent/tab, queue
admission phase, actual worker run ID, timestamps/deadline, terminal status,
delivery state, stopped reason and durable receipt when present. It never
returns proof tokens or bot credentials. Transcript/artifact contents remain
behind existing project-scoped `transcripts:read` authorization and auditing;
metadata status is not a transcript exfiltration API.

Terminal evidence is a host-created immutable record linked to `executionId`
and the actual worker run, not provider prose or agent-wide idle state. Include
the exit/failure/cancellation/timeout signal and references/digests for that
run's saved result and artifacts. Exit 0 is a process result, not proof that
requested artifacts exist. Report prompts must preserve that distinction.
Queued predecessors, later runs, unrelated tabs and agent-wide output are
excluded even when their clocks or provider session IDs match.

Auto Run counts/finality may extend a dispatch only when the batch creation
retains the initiating `executionId` and batch ID, propagated into every task
run and final event. No timestamp inference. Reject unsupported detached
batch following explicitly; do not turn the parent exit into success for
unfinished batch work. Missing durable evidence becomes timeout/uncertain,
never a synthesized successful result after restart.

## Durable journal and recovery

Use a main-process-owned SQLite journal under userData with transactions,
unique constraints and foreign keys. Existing `StatsDB` and plugin SQL use
SQLite, but this ledger must be private to the host, not writable through
plugin storage. Configure WAL plus `synchronous=FULL`; disk errors deny
acknowledgment or sending. Verify filesystem durability behavior on supported
platforms before promising power-loss recovery. `atomicWriteJson` provides
rename atomicity but no fsync, and per-key queues are not cross-process locks. Provider-session ownership also
evicts old entries at its cap; an evicted retained session must stop the check
for review, never fall back to a fresh conversation.

Proposed schema, bounded metadata only (enforce sizes on all ingress):

| Table       | Required fields / constraints                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| origins     | originId; pluginId + consented code identity; originAgentId; adapterId; binding key/revision; exact thread/guild/parent IDs; providerSessionId; inboundKey; inbound run ID; reply disposition; createdAt/expiresAt |
| dispatches  | dispatchId; originId FK; executionId UNIQUE; targetAgentId/tabId; original requestKey + payload hash UNIQUE per inbound run; queue phase; worker run ID; terminal evidence reference; deadline                     |
| completions | registrationId; dispatchId UNIQUE FK; delivery state; stoppedAt/reason; report run ID; attemptId UNIQUE nullable; expected tool/destination; claimedAt/reportDeadline; receipt JSON; revision                      |
| admissions  | executionId PK; persisted queued/start/terminal phase; worker run ID; exact batch lineage; timestamps and evidence refs                                                                                            |

Do not store the prompt's raw contents or secrets in broad metadata access.
Store execution payload/result in the existing protected content store and
retain only references/hashes in the journal. At implementation time define
and migrate an explicit schema version, validate startup records, refuse
unknown/corrupt versions, and stop reporting until review. Never fall back to
an empty ledger: forgetting an attempted send makes it replayable.

Use `createKeyedWriteQueue` for process-local sequencing of one registration;
SQL compare-and-swap on revision/state is the actual transaction boundary.
Multiple check ticks, process events and report callbacks may race, but only
one transaction may acquire the attempt. Serialize origin **provider-session
resumption** and thread reply work through Relay's adapter queue too. A host
claim alone does not serialize a separate plugin's inbound queue.

Delivery transitions (dispatch execution phase is separate):

| Transition                           | Required committed evidence and behavior                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| new → pending                        | Origin validated, dispatch intent committed; acknowledgment additionally requires reconciled durable admission                                                                                                     |
| pending → reporting                  | Exact terminal evidence; original inbound turn finished; adapter queue turn reserved; fresh origin validation + grants/tool discovery; report run issued; bounded report deadline committed BEFORE that run starts |
| reporting → reporting with attemptId | MCP host interceptor atomically claims this run's ONE permitted report call and persists exact destination/tool/argument hash BEFORE invoking the plugin                                                           |
| reporting → delivered                | That exact invocation returned nonempty validated real messageIds; commit receipt and stoppedAt atomically BEFORE returning tool success to the provider                                                           |
| reporting → uncertain                | Call error/timeout/missing receipt, crash, provider outcome with no durable receipt, or persistence failure after call; persist reason and stoppedAt, deny further report calls                                    |
| pending → pending with stoppedAt     | Grant/binding/tool/adapter revoked or unavailable, user cancel, origin/session lost, orphan bound reached; this is stopped without an attempted send, requires explicit review/rearm                               |

`pending` represents delivery, not worker success. Worker terminal states are
`completed`, `failed`, `timeout`, `cancelled`, `orphaned`; evidence includes the
reason. Delivered can carry a failure/timeout report. `uncertain` is absorbing
for automation. Never convert it back to pending because the model says it
did not send. An explicit review records its actor/evidence; rearm is allowed
only with proven non-delivery or a separately authorized duplicate-risk choice.

On restart, recover pending admissions by exact identity. Pending registrations
with durable terminal evidence may be checked after fresh authorization.
Every recovered reporting row without a delivered receipt becomes uncertain
and stopped, even if there is no attemptId (a conservative missed-report
boundary). Delivered rows remain stopped. Restart must never resurrect an
old run proof, resume a model report blindly or make a new registration for
an already delivered dispatch.

Default work deadline 1 hour, minimum 1 second, maximum 24 hours; include queue
time. Bound report runs to 2 minutes and tool calls to 30 seconds. Timeout
claims race transactionally with a terminal event; one wins. Timeout removes
the exact queue item or kills only the matching execution/run before reporting
the observed timeout. Persist whether termination was confirmed; a failed kill
is disclosed as work possibly still running and cannot authorize success or
replacement work. Late exits cannot start a second report.

Cap active registrations at 200 per host, 20 per origin; refuse new admission
on cap. Stop orphaned origins at 24 hours. Retain delivered/uncertain tombstones
and request-key deduplication for 30 days (at most 10,000 rows); no new API may
reuse expired inbound run identities. Never evict an active or unresolved
uncertain row to make room: deny new registrations if the retention cap is
full. Content storage uses existing output compaction and bounded projections.
Disable/crash immediately aborts report processes and denies new invocations;
uninstall invalidates registrations and purges plugin content per existing
policy. An already-entered invocation leaves a stopped uncertain tombstone
without credentials so reinstall cannot silently resend it.

## Reporting execution and receipt boundary

`enqueueResume` is a trusted plugin adapter handshake, not a new arbitrary
agent dispatch. It reserves a turn in the origin's exact thread queue, waits
for ordinary predecessors and reports readiness to the host. The host then
validates current grants/binding again and invokes the existing headless runner
for the stored originAgentId and retained providerSessionId. It issues a
**fresh** run proof internally associated with registrationId, report run ID,
exact tool and exact destination. Resume cannot borrow the original or worker
proof. Failure to find the retained provider session stops for review.

The adapter reservation request is closed:
`{ registrationId, bindingKey, expectedRevision, providerSessionId,
reportDeadline, replyMode: 'tool-only' }`. It returns an idempotent reservation
ID and readiness only after thread predecessors finish; that ID is persisted
with the registration. No provider work starts in the adapter. Host control
`finishResume({ reservationId, providerSessionId, deliveryState })` releases
only that reservation, persists permitted provider-session updates and never
sends a final-answer echo. Crash/timeout cleanup also releases by ID; a lost
release acknowledgment cannot re-run the report. A plugin restart invalidates
readiness until revalidation; abandoned reporting reservations are cancelled,
never replayed. Bound all reservation/validation waits by the report deadline.

The prompt supplies exact dispatch evidence and retained thread as routing
context. It asks for one concise report and live `tools/list` discovery of the
adapter's declared send tool. Discovery alone is not authorization or proof
that the provider sees the tool; absent tools stop the check. No direct HTTP,
shell sender or synthetic desktop callback is used. All risk and plugin tool
invocation gates still run. The current Relay text bound is 1,900 characters;
require a single-message-sized text with `threadId` equal to the origin and
no `channelId`, implicit destination or attachment. Oversize text is denied
before the durable send claim.

Add a host MCP interceptor in `handlePluginsCallTool` before `invokeTool`.
For a completion report proof it resolves the retained registration (never a
model-provided ID), rejects other outbound destinations, takes the durable
attempt claim, and invokes only the exact declared send tool with host-observed
arguments. Status/transcript tools remain available through their existing
grants, but no second outbound tool call is permitted on that report proof.
At claim time revalidate the live plugin/code identity, grant, origin binding
and report run; at actual send the plugin rechecks destination bindings. A
revoke during network I/O cannot undo accepted network work; it produces a
stopped receipt or uncertain outcome, never retry authorization.

Record `{ registrationId, dispatchId, executionId, attemptId, reportRunId,
originAgentId, pluginId, toolId, threadId, observedAt, messageIds }` from the
host's invocation and return value. Do not accept correlation fields from the
result, and do not parse IDs from final answer text. Real IDs come from the
trusted tool result, validated using the existing receipt limits. Store them
even if the provider later fails/cancels or loses final prose. A result with
no valid receipt is uncertain even if it claims success.

The adapter's completion turn is marked `replyMode: 'tool-only'` by host control
metadata. It updates the retained provider session on success under the same
ownership check, but never posts the provider's final answer through Relay's
ordinary inbound reply path. This is distinct from normal inbound turns,
whose plugin-managed reply behavior remains unchanged. A late provider failure
after a delivered tool receipt must not trigger a second queue reply.

There is an unavoidable interval between the remote accepting a send and the
local transaction saving its receipt. A host crash in that interval becomes
**uncertain and stopped**. Persisting reporting before send prevents blind
retry; it does not guarantee delivery. Likewise, one bounded tool invocation
does not prove exactly one remote POST: Relay's transport/chunking/retry rules
must be reviewed for completion mode. No exactly-once Discord claim is made.

Stronger semantics require a plugin/Discord reconciliation contract keyed by
durable attemptId, with documented idempotency retention and authoritative
lookup of accepted message IDs. Do not infer reconciliation from a Discord
nonce, transcript, callback, timestamp or a model's assertion. No such
contract exists in the inspected sender. Uncertain review is the supported
safety choice for this design.

## Implementation map and acceptance gates

| Work                                   | Required source changes                                                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Origin adapter/control messages        | `rpc-protocol.ts`, signed manifest contributions, SDK vendor, sandbox entry/host, handlers and broker target reauthorization                                                |
| Retained authenticated run association | `plugin-agent-session-bindings.ts`, `plugin-tool-run-identity.ts`, headless runner; first-session capture and original-reply disposition                                    |
| Durable dispatch admission/provenance  | CLI/MCP dispatch handlers, web-server enqueue, renderer remote/queue drain, `QueuedItem`, spawn IPC/ProcessManager, exact run exit/result and Auto Run batch lineage        |
| Ledger + check lifecycle               | new private host completion service, transactional journal/migrations, startup recovery, shutdown/revocation/uninstall hooks, bounded sweep using existing lifecycle wiring |
| One report attempt + receipt           | `messageHandlers/plugins.ts` before/after invoke; commit-before-ack; retained destination and dispatch metadata                                                             |
| Backstage integration (separate repo)  | trusted origin descriptor, binding revision/live validator, queue reservation, tool-only completion reply mode, outbound one-message policy; no changes made here           |

New production helpers must first be checked against the agent guides. Reuse
`createKeyedWriteQueue`, existing headless runner/MCP injection, provider-session
ownership, ActionGuard/risk/broker gates, existing SQL conventions, output
compaction and lifecycle cleanup. Do not add a parallel permission ledger or
generic invoke/HTTP escape hatch. Do not modify safe native callback behavior
to satisfy the external return design.

Acceptance tests required **before runtime support is advertised**:

1. Real journal reopen across registration acknowledgment, admission/start,
   terminal persistence, report reservation, pre-invoke claim and receipt commit.
   Crash injection at each boundary; no forgotten attempt becomes retryable.
2. Queue P before D, same-tab runs before/after D, unrelated tabs/agents,
   identical timestamps, out-of-order events and concurrent Auto Run batches.
   Only D's execution ID/run/batch lineage can make D terminal.
3. Concurrent sweep/event/tool calls from the same and separate processes:
   one claim, one invocation, no lost receipt. Different dispatches retain
   isolated evidence. Same origin thread/provider resumes serialize against
   normal inbound queue predecessors, with no duplicated final-answer echo.
4. Exact origin binding/session persists across restart; foreign plugin/agent,
   same-agent other thread, forged IDs/proofs, rebound thread/revision, changed
   plugin bytes, revoked unattended or dispatch grants, removed binding,
   plugin disable/crash/uninstall and missing adapter all deny continuation.
5. Provider lacks callable tools despite host discovery; provider/CLI absent,
   unverified provider, SSH and shell-only check. No unauthorized fallback.
6. Target fails/exits/cancels/times out before start and during work; termination
   confirmed or unconfirmed; timeout races exit; late events and restart orphan.
   No timeout is success and no broad agent/tab kill terminates unrelated work.
7. Provider succeeds without invoking send; send fails, times out, returns no
   IDs, returns malformed IDs, or remote accepts then local receipt write fails.
   All ambiguous attempts stop as uncertain. Post-send provider failure keeps
   the real IDs and never retries. Foreign tool/run/thread receipts cannot win.
8. Ledger corrupt/unknown schema, failed transaction, disk full, caps/retention,
   invalid payload, missing return context, lost ack and retry request hash
   conflict. No false registration or delivery acknowledgment.
9. Existing native callback/CLI risk/consent tests remain passing. A native
   callback acknowledgment is never recorded as external delivery.

## Design review and validation limits

This design received a source-based adversarial self-review; it has not
received an independent maintainer review or live integration validation.
Review findings incorporated:

- A tab start gate rejects a running predecessor's exit, but cannot reject a
  queued predecessor's later spawn. Require execution identity end to end.
- Agent/time Auto Run correlation can borrow an unrelated tab's batch counts.
  Require explicit batch lineage rather than copying native callback inference.
- Same-agent receipts are run-isolated, yet generic ownership/receipt APIs omit
  the thread. Require an attested origin and host-observed call destination.
- Report final-answer queue echo can duplicate the authenticated tool send.
  Require a typed tool-only adapter turn, including after provider failure.
- A pre-send durable state protects restart only if every outbound invocation
  is intercepted. Require the claim at the host tool boundary, never in prose.
- SQL claim serialization does not order provider resumes against plugin queue
  work. Require both the journal transaction and adapter queue reservation.
- Atomic rename is insufficient for promised power-loss durability. Specify
  SQL durability and require fault injection; do not advertise exactly-once.

The draft's tests characterize the **existing** host limits and preserve its
safety gates. They are not acceptance tests for an implemented journal or
adapter: those runtime components do not exist in this draft. Restart tests
show ownership persistence and authority/receipt loss; they do not demonstrate
durable completion recovery. No installation, build, desktop restart, consent
change, Cue schedule or live Discord send was performed.

Validation on base `9fe58c7ead373b2460a676c08b4d2858d5a6d706`: 587 tests
passed across 13 focused suites, including the 17 added boundary cases and
existing native dispatch, CLI send, tool invocation/risk, revocation and Cue
MCP provisioning suites. Main and CLI TypeScript no-emit checks, changed-file
Prettier, test-file ESLint and `git diff --check` passed. Existing runner tests
use mocked provider results and host receipt injection; no network delivery
was exercised. Journal recovery, destination revocation and cross-process
claims remain acceptance requirements, not proven runtime behavior.

Repository-wide pre-push formatting, all three type-check projects and ESLint
also passed. The full unit run was interrupted after unrelated renderer
failures; it did **not** pass and has no complete aggregate result. Examples
include missing `Wand2` in icon mocks and `localStorage.getItem` failures. The
four tests in `DocumentGraph/graph-screenshot.test.tsx` fail on the unchanged
base `9fe58c7ea` too, reproduced in the same worktree with Node `25.6.1` and
the existing dependency tree. All renderer sources, tests and setup files are
unchanged by this draft. Those failures are not repaired in this work package.
Publication is limited to an explicitly unready design-review draft; the
failed/incomplete full gate is not presented as successful validation.

Remaining work is the implementation map plus the full acceptance matrix,
Backstage adapter agreement/integration and independent review. Any later local
test package remains a separate authorization: latest fetched RC plus Chris's
own current PR heads merged **locally**, recorded by exact revision and checked
in the packaged application before recommending an installer. Never merge
these host PRs upstream to make that package.
