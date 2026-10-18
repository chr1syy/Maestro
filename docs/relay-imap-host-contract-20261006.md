---
type: interface-contract
title: Relay IMAP host early contract
created: 2026-10-06
status: proposed-with-transport-foundations
tags: [relay, imap, host, security, cue]
related: ['[[CLAUDE-PLUGINS]]', '[[CLAUDE-CUE]]', '[[relay-imap-host-evidence-20261006]]']
---

> Historical foundation record. The implemented public signatures and production gate are defined in [the 2026-10-12 contract](relay-imap-host-contract-20261012.md); retain the notes below as history.

# Relay IMAP host early contract

This is a reviewable proposal, not an available SDK. The IMAP response framing,
configured-account TLS, fixed-command validation, bounded async session and
host-private credential-slot, private account configuration, canonical sealed-ledger persistence
and stored agent-rights/account-mutation/projection/activity/queued-credential/removed-account-cleanup/queued-enable/header-literal-read/header-display/authorized-header-display-read/authorized-reference-search/authorized-complete-source/transfer-byte-decoding/plain-text-charset/MIME-header-descriptor/MIME-source-traversal/MIME-content-composition/authorized-plain-text-body-read foundations below are implemented and statically checked only.
Host-private run-proof, nested-handle, manager/sandbox/web propagation, verified read
completion and attachment-snapshot prerequisites also exist below, statically checked
only. Optional MCP proof-file transport and its host-private issuer resource are
now also source-implemented below; neither has production issuance callers.
Production registry/resource dependency composition is now source-wired below;
no interactive/Cue/CLI proof issuance caller, account service, trusted setup, public
mail SDK/RPC/broker route or Cue mail source is implemented on this branch.
No new capability/version can be claimed by Relay yet. The local
host advertises `HOST_API_VERSION = 1.16.0`, SDK package `0.11.0`. Assign the additive
host/SDK version only after reconciling other local host contracts; Relay's current
`minHostApi: 1.22.0` does not establish compatibility with this base.

Host owner `0af39dab-3c06-40de-9077-99207660c1e9`; registered worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; worktree
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`; branch
`feat/relay-imap-host-20261006`; base `rc` / full commit
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. Plugin work belongs to Backstage
`78582d73-395d-4839-a62d-e903f0f1cecc`; its independent implementation ledger is
`/home/chris/code/worktrees/feat/relay-imap-provider-20261006/docs/relay-mail-implementation-20261006.md`.

## Observed foundations and missing seams

| Observed source on this base                                                             | Reuse / limitation                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/plugins/rpc-protocol.ts`, `permissions.ts`                                   | One method/capability table and default-deny scope matcher; no mail rows. New exact account scopes must be allowlists, never host globs or broad fallback.                                                                                      |
| `src/main/plugins/permission-broker.ts`, `authorization-ledger.ts`, `consent-minter.ts`  | Live plugin grants, sealed identity-bound consent, freshness anchor and revocation tombstones. Extend this authorization mechanism for account/agent rights, not plugin KV as an authoritative grant source.                                    |
| `src/main/plugins/net-egress-guard.ts`                                                   | `createEgressGuard`, `createGuardedLookup`, `classifyBlockedAddress`; blocks private/loopback/link-local/metadata addresses, mixed unsafe DNS answers and configured ports. Connection pinning must be used at the actual TLS connect.          |
| `src/main/plugins/plugin-host-handlers.ts`, `src/main/index.ts`                          | `net.connect` checks `wss:` and constructs a WebSocket with guarded lookup. It cannot carry raw IMAP TCP and must retain its current meaning.                                                                                                   |
| `src/main/plugins/plugin-kv-store.ts`                                                    | Atomic private **plaintext** `store.json`, per-value 64 KiB, corrupt/missing reads become empty. Suitable for bounded non-secret plugin state, not credentials or fail-closed security configuration.                                           |
| `src/main/plugins/authorization-ledger.ts`                                               | `KeyringEntry`, canonical lazy `createKeyringEntry`/`createKeyringAnchor`, `safeStorageSeal` exist. The anchor stores authorization freshness, not mail passwords. Missing seal/keyring uses session-only grants. No generic secret SDK exists. |
| `plugin-manager.ts`, `plugin-sandbox-host.ts`, `plugin-sandbox-entry.ts`                 | Tool round-trip on this base accepts args only, with no verified second-parameter caller context. Main IPC and MCP must not turn a tool-supplied agent ID into authority.                                                                       |
| `src/main/cue/triggers/cue-trigger-source.ts`, `cue-trigger-source-registry.ts`          | Existing `start/stop/nextTriggerAt` lifecycle and per-subscription emit callback; no mail/plugin-source trigger.                                                                                                                                |
| `src/shared/cue/contracts.ts`, `cue-session-runtime-service.ts`                          | Closed event catalog, enabled-subscription and owner/agent registration gates. Config/renderer/schema/template additions are required.                                                                                                          |
| `cue-dispatch-service.ts`, `cue-run-manager.ts`, `cue-queue-persistence.ts`, `cue-db.ts` | Reuse execution, concurrency, root overlap, fan-out/chaining and persisted queue. Current persistence is best-effort; replay checks known sessions, age and shape, not live mail grants. Mail needs additional admission/replay gates.          |
| `src/main/plugins/plugin-event-bus.ts`, `src/shared/plugins/events.ts`                   | Fixed host-to-plugin metadata delivery. Cue's `emitPluginEvent` reports Cue lifecycle outward; neither is a plugin-to-Cue mail ingress. No arbitrary publish passthrough.                                                                       |

Read-only comparison found `PluginToolRunIdentity` and second-parameter
`PluginToolInvocationContext { callerAgentId: string | null }` on registered
`fix/relay-host-only` worktree `/home/chris/code/worktrees/fix/relay-headless-dispatch`
at `83c579b99be29524c4fccae0ce94b6b7146494a8`. It issues ephemeral random proof,
expires/revokes it, sends a mode-0600 proof file to the MCP bridge, and resolves
`runToken` in main WebSocket tool handling. `fix/relay-conversation-transport`
at `39131ef601eb0567cd5705470dbe1afec46989b4` extends that work. Neither was merged,
copied or modified. Reuse reviewed identity code in small explicit tasks when
integrating; its callerAgentId passed back by a plugin alone is **not** proof for
nested mail RPCs. The host needs a plugin-bound invocation handle for those calls.

## Backstage reconciliation — 2026-10-07 (proposal and integration gates)

This section reconciles [[relay-imap-host-backstage-needs-20261007]], Backstage's
HOST-HANDOFF-20261006.md, HOST-CONTRACT-REVIEW-20261006.md and its complete
implementation ledger. It takes precedence over conflicting early proposal text
below; it does **not** freeze public names, create SDK exports or establish adapter
readiness. Historical absence/no-source observations in those ledgers predate the
current uncommitted private foundations. Public mail methods/capabilities remain
absent. Plugin ownership stays with Backstage; no second host package or engine.

Reviewed plugin commit: `71ae91ba87f96710213b4dd96f2f9b55422c8d5e`
(`MAESTRO: add durable Relay mail dedupe and checkpoint state`). Its exact
`plugins/relay/src/mail-metadata.ts` blob is
`3f68df21514aead25ef3aa82697723ab89e5a96b`; SHA-256
`fc4eb5903a8fbf0e1466df63c83d702c3c4289d90fa183082a60d5fc8728474a`.
Read-only object comparison confirmed current metadata source matches that commit.
Backstage reports 38 independent mail cases and 275 overlapping total regressions
passed, plus workspace typecheck; these are **historical plugin-domain evidence**,
not host or combined adapter tests. No product tests were created/run here.

### Exact local projection and deferred tested adapter

The local `buildMailCuePayload` returns exactly these seven primitive fields:

```typescript
interface LocalRelayMailMetadata {
	reference: string;
	accountId: string;
	folder: string;
	uidValidity: string;
	uid: string;
	receivedAt: number;
	sizeBytes: number;
}
```

| Local field   | Early host proposal                       | Required closed mapping                                                                                                                                                                                           |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reference`   | Structured `reference`                    | Encode only the four approved coordinates as `relay-mail:1:<accountId>:<encodeURIComponent(mailbox)>:<uidValidity>:<uid>`. Decode canonically and compare all coordinates; the local string confers no authority. |
| `accountId`   | `accountId` and `reference.accountId`     | Both must equal the exact authorized host-issued account; never remint or infer ownership from syntax.                                                                                                            |
| `folder`      | `mailbox` and `reference.mailbox`         | Preserve exact decoded mailbox bytes/Unicode; no case folding, path normalization or cross-folder UID reuse. Unsupported transport encoding denies.                                                               |
| `uidValidity` | `uidValidity` and `reference.uidValidity` | Equal canonical positive decimal strings, at most 4294967295; no lossy numeric conversion.                                                                                                                        |
| `uid`         | `uid` and `reference.uid`                 | Same canonical decimal rule and exact message coordinate.                                                                                                                                                         |
| `receivedAt`  | `arrivedAt`                               | Same integer UTC epoch milliseconds, 0..253402300799999, derived by host from validated arrival metadata; never reinterpret seconds as milliseconds or use the consumer clock.                                    |
| `sizeBytes`   | `size`                                    | Same nonnegative safe integer complete message source size, distinct from decoded body/part byte counts.                                                                                                          |

Host-derived plugin provenance and stable event ID belong in a **trusted envelope**
bound to the real producer/plugin and account; they are not an eighth/ninth local
payload field or caller-controlled values. The old eight-field host payload below
is a candidate representation requiring this explicit adapter, not an assertion
that it already matches Relay's seven-field schema. Final shared/Cue/public names
remain pending. Payload serialization, including the escaped reference, must fit
4096 UTF-8 bytes. Select fields individually; never spread broker records or read
subject/sender/header/preview/body/attachment/credential extras into Cue.

Example deferred round-trip vector: host coordinates
`{ accountId: "mail_1_0123456789abcdef0123456789abcdef", mailbox: "INBOX", uidValidity: "1", uid: "2" }`
map to local reference
`relay-mail:1:mail_1_0123456789abcdef0123456789abcdef:INBOX:1:2`;
`arrivedAt: 1791320000000, size: 42` map unchanged to
`receivedAt: 1791320000000, sizeBytes: 42`. This synthetic account conforms to
legacy local syntax for illustration only. Host IDs remain opaque: the old
`assertMailAccountId` parser may reject valid host IDs and must be adapted later,
never used as authorization. Local tokens omit account revision, plugin and proof;
content calls must use a host-resolved exact reference/current revision and nested
invocation, without upgrading cached stale references by inserting a new revision.

Existing plugin tests cover canonical Unicode/colon reference escaping and the
seven-field allowlist, but **no host-to-plugin adapter is implemented or tested**.
Required later mapping tests cover both directions, every duplicated-coordinate
mismatch, percent-escape canonicality, opaque host IDs, unknown/hidden/inherited
fields, throwing sensitive getters, payload UTF-8 overflow, provenance forgery and
revision/namespace changes. Invalid records fail as a whole, without skipping rows.
A documented vector/manual review is not a passing combined mapping test.

Rights map exactly: local `read` -> host `read`, `detail` -> `detail`, singular
`attachment` -> plural `attachments`. Unknown/duplicate values deny; neither
rename nor content access implies any other right. Proposed `mail:read`,
`mail:body`, `mail:attachments` consent additionally requires exact account scope
and the verified agent's independent sealed right. Plugin consent, local policy
WeakMaps or a echoed callerAgentId are insufficient for nested mail calls.

### Ownership, bounds and complete content

Host-issued account IDs/configuration, dual plugin identity, revisions, grants and
removal tombstones are authoritative. Local ID generation, connection config,
private grants and event cursors are independent mock scaffolding. Production must
not persist a competing security store in Relay KV. Preserve `net.connect` as
wss-only; IMAPS uses only fixed private operations with validated TLS, EXAMINE and
BODY.PEEK. No mutation/send/raw socket escape hatch.

Public search text is nonempty and at most **256 characters**; subject/sender
labels are at most **512 characters** with validated Unicode/control rules.
Private fixed search currently permits 512 ASCII characters and display projection
1024 UTF-8 bytes; public admission must enforce the tighter search budget before
I/O and validate final header labels independently. A byte budget does not prove
a character/control contract. Unsupported header conversion must fail explicitly,
not silently trim. Pages have at most 50 rows and 64 KiB serialized UTF-8 including
envelope; only list pages may return explicit prefix truncation and a safe cursor.

Bodies are complete `text/plain`, decoded from the private parser's documented
UTF-8/US-ASCII charset and transfer rules. Proposed output must carry the exact
reference, normalized MIME type, text and **UTF-8 sizeBytes** equal to the complete
returned text (the early MailBody sketch omits this required count). Empty complete
text differs from absent/unsupported body; reject NUL/unpaired surrogate,
unsupported HTML/charset/encoding, partial and oversized data. Limit is 256 KiB,
including the private parser's discarded body alternatives. Map `mimeType` to
local `contentType`, preserve text/count; MIME is sender-declared, not file proof.

Attachment MIME allowlist is exactly text/plain, application/pdf, image/png,
image/jpeg, image/gif and image/webp. At most 16 unique parts, 8 MiB decoded each,
16 MiB aggregate; validate the complete manifest before assembly/download and bound
transport/source/MIME temporaries before allocation. Map host `mimeType`/`size`
(or private `sizeBytes`) to local `contentType`/`sizeBytes`. Missing optional
filename becomes the fixed label `attachment`, as the private consumer already
does. Names are untrusted display text, never paths; reject separators, dot/dot-dot,
controls and malformed Unicode, and enforce the local 256-character maximum
(private descriptor's supported ASCII labels are stricter, at 128 bytes).
No partial body or attachment success, implicit truncation or file sniffing claim.

A content snapshot must bind the original verified invocation, exact plugin,
account **revision**, mailbox, UIDVALIDITY, UID and numeric part path. Independent
attachments rights and original operation deadline remain live throughout source
read, MIME validation, chunking, serialization and final delivery. The private
snapshot object below implements a local seam only; the early readAttachment
signature has no published snapshot lookup/close mechanism. Later RPC must specify
and test invocation-bound lookup/closure; it must not refetch a changed message for
each offset or accept a plugin-selected reference as bearer authority.

Chunks start at byte offset 0, accept only the exact next safe-integer offset and
1..65536 byte limit, and use canonical standard padded base64 (decode/re-encode
must match). Decoded length must equal `nextOffset - requestedOffset` and never
exceed the requested budget or declared whole size. `complete` is true iff the
next offset equals that size; empty data is valid only for a zero-size complete
part. Reject replay/seek, premature EOF, trailing bytes, malformed base64 and size
mismatch. Allocate against the validated whole size before assembly. Completion
erases host binary storage; retained final publication authority closes at explicit
close or original invocation expiry. No deadline extension on each chunk.

Run/tool expiry/completion, host abort/stop, sandbox teardown, revoke/disable/remove,
identity change and persistence failure must abort sockets, erase/drop snapshots,
release reservations/listeners and suppress late results/chunks at final delivery.
A JSON RPC cannot carry a JavaScript AbortSignal. Main-process signals here are
internal only; production needs implemented host-bound cancellation/deadline and
teardown propagation, with any wire cancellation shape separately reviewed/tested.
Already delivered strings/bytes cannot be recalled. Fixed MailResult errors map to
local fixed errors without raw peer/native/plugin diagnostics or causes.

### Trusted setup and central panel

The central Relay panel remains the user entry point. Ordinary plugin callers may
receive only their plugin's host-issued account IDs, revision, enabled intent,
mailbox labels, honest closed status (including stopped/unavailable/unknown) and
credential presence/mask from a trusted status projection, plus approved aggregate
counts of independent account rights. They do not receive per-agent identities,
endpoint, username, password, sealed identity or credential slot names. A status
read must not fetch secrets or test login. Private stored summaries currently have
only accountId/revision/enabled/mailboxes; enabled intent is **not** ready status.
These additional view fields/notification semantics remain proposals, unavailable
until actual shared types, policy, SDK and UI evidence exists.

Only the dedicated trusted host setup frame may see/edit exact live agent rights
and configuration under its narrowly registered IPC, sender-frame identity,
one-time nonce and real user gesture. Passwords remain host-local, outside
project/Vault/settings/ordinary command payloads. Clear form input and exclude
setup parameters from logs, traces, history, prompts, errors, events and Cue;
return fixed presence/mask/status only, never the stored secret. A read-only
agent/tool principal cannot acquire setup authority from an ID or navigation intent.

Proposed entry navigation is closed: `add` has no account target; `test`, `rights`,
`disable`, `remove` require an exact existing account owned by this plugin. Unknown
or foreign IDs/actions/extra fields deny. Opening/selecting a page only navigates;
it cannot save, test login, grant, revoke, enable, disable or remove anything.
The frame re-resolves current revision/ownership and obtains fresh user authorization
before each operation. Proposed requestSetup() alone does not supply these
parameters; no new available SDK method/topic/nonce is asserted by this review.

On saved/failed/closed/canceled setup, a future approved invalidation notification
contains opaque account IDs/revision/status only. The central panel rereads the
live safe view through the implemented read path, discards stale refresh replies
using the host view revision/lifecycle generation, and never optimistically applies
local grants or ready status. Close/cancel triggers refresh too, since an earlier
save may have committed. Failed administrative persistence reports failure and
keeps activity stopped, including when native work or a durable write partly
succeeded. Restart must reload authoritative state and reconcile unresolved work;
no latch reset, automatic enable or readiness claim without explicit recovery tests.

**Lifecycle retention prerequisite, source-only:** Backstage intends disable
to retain credentials; the early host lifecycle proposal agrees. The private
`MailAccountCredentials.mutateAccount` disable branch now retains the exact native
slot without any slot construction/probe/read/write/delete. Canonical disable still
advances revision and clears rights; canonical enable also clears rights. Backstage's
stored-grant retention/re-enable behavior therefore remains an unresolved public
adaptation seam. The credential branch is statically checked only; actual queue/
store/keyring regressions, rights-retention policy and trusted setup/lifecycle wiring
remain unfinished. Do not infer public compatibility, grants, presence or readiness.
Settings replacement/removal still delete the exact slot and confirm absence.
Removal must tombstone the ID; failed cleanup stays stopped/pending, never success.
Historical cleanup confirmation is not current credential availability or recovery.

### Single producer, ordered replay and durable Cue receipts

Choose **host watch service** as the sole production producer/checkpoint owner.
Relay's local mail-events publisher/cursor remains test scaffolding and must be
adapted out of production ownership; no generic publish RPC or duplicate owner.
Use existing Cue trigger/dispatch/run/queue machinery, never direct agent/Vault
work or a second task-state engine. The plugin's atomic 1 MiB **character** snapshot
is not equivalent to a 1 MiB UTF-8 bound and cannot be stored via generic 64 KiB
KV. Keep generic KV unchanged. Host bounded private producer state is <=1 MiB
UTF-8; any residual plugin cache requires a separately proven bounded atomic
adapter, never nontransactional security-state sharding or a silent cap increase.

Namespace state/dedupe by `(pluginId, accountId, mailbox, uidValidity, uid)`.
First/reset baseline needs a consistent validated maximum UID under one namespace;
empty mailbox has an explicit zero checkpoint sentinel, never a message UID 0.
Notifications trigger scans only. Reconnect replays pending first, then enumerates
**all** arrivals above the durable cursor in ascending paginated order. A bounded
unordered UID SEARCH window is not a complete mailbox enumeration. Page caps,
expunges, new arrivals and UIDVALIDITY changes must not advance past unseen lower
UIDs; fail/retry rather than skip a failed UID. A new namespace fences old pending
and queued references before taking its baseline. Remove prunes/fences namespaces;
re-enable resumes the cursor for unstaged gap arrivals, while canceled staged UIDs
remain deliberately consumed without dispatch.

Persist closed pending metadata before publication; stable host event ID uses the
versioned length-safe namespace hash. Existing Cue paths need durable event and
**consumer-specific** event-ID receipts for acceptance, queued/dispatched/dropped/
consumed outcomes and restart. Persist receipt/queue outcome before durable ack;
failed persistence yields no ack/cursor advance and stops admission. Dedupe for
one subscription cannot suppress another. Queue drain/restored replay/final spawn
recheck current source/plugin/account revision/enablement, configured mailbox and
namespace, active user-enabled subscription/filter/owner and each target agent's
read right. Disable, revoke, removed folder/account, feature/plugin stop or stale
identity drop queued work using existing bookkeeping; never dispatch it on restart.

Zero subscribers, disabled subscribers and filtered events cause zero dispatch
and a durable consumed outcome for that publication; enabling a pipeline later
must not replay those historical consumed events. Define consumer identity/config
revision so retries cannot reinterpret previously consumed membership as a new
historical delivery. During global stop do not accept fresh work; reconcile already
pending state under live authority before replay. No live subscription is created.

Receipt retention must cover every possible producer retry and restored queue.
Pending/queued/ambiguous receipts cannot expire or be evicted. Terminal receipts
can be retired only after durable producer checkpoint acknowledgement and all
consumer outcomes/queues settle, with a durable namespace/watermark fence rejecting
older retries. If that proof is absent, retain the receipt and fail closed on
capacity; time-only expiry is insufficient. Bounds, atomic ack/checkpoint ordering,
consumer config fences and restart retention remain implementation/test gates,
not present Cue guarantees. At-least-once publication attempts and a possible
ambiguous spawn/crash duplicate remain explicit; no exactly-once agent execution.

### Deferred reconciliation acceptance

Keep HOST-02 security test creation, HOST-03 SDK/wiring tests, HOST-04 event/Cue
implementation and tests, and HOST-05 execution/review/PR gates **unchecked**.
They must prove the closed bidirectional metadata/right adapter; tighter public
limits; host IDs/revisions; trusted navigation/frame/nonce/gesture and secret
redaction; honest rights/status projections and refresh races; failed-persistence
stop/restart; complete MIME counts and canonical sequential snapshots; complete
ascending paginated scans/max-UID baseline/pending-first replay; consumer receipt
retention and disabled/revoked queued/restored events through real Cue paths.

Compatibility requires actual combined identity/MCP/nested handle, shared/SDK
version and drift parity, existing Discord caller/send/Gateway and voice/media
regression evidence with exact commits and commands. Host API 1.16.0/SDK 0.11.0
cannot satisfy Relay minHostApi 1.22.0. Do **not** lower the plugin minimum, change
its manifest or infer compatibility from private source/static checks. No adapter
or public API name is final until this evidence is available.

## Proposed public types and narrow SDK

All names below are proposed. Define canonical contracts in `src/shared/plugins/`
and mirror through SDK parity guards. JSON-only wire shapes fit the existing
sandbox; attachment data must use bounded chunks, since its RPC cap is 1 MB.

```typescript
type MailAccountId = string; // host-generated opaque ID, never reused
// Canonical positive decimal strings, <= 4294967295 (IMAP 32-bit identifiers).
type MailUid = string;
type MailRight = 'read' | 'detail' | 'attachments'; // independent, no implied rights
interface MailReference {
	accountId: MailAccountId;
	mailbox: string;
	uidValidity: MailUid;
	uid: MailUid;
}
interface MailAccountView {
	accountId: MailAccountId;
	revision: number;
	enabled: boolean;
	credentialPresent: boolean;
	mailboxes: string[];
	status: 'disabled' | 'ready' | 'unavailable';
}
interface MailHeaderRow {
	reference: MailReference;
	arrivedAt: number;
	size: number;
	attachmentCount: number;
	subject?: string;
	sender?: string;
}
interface MailPage {
	uidValidity: MailUid;
	messages: MailHeaderRow[];
	truncated: boolean;
	nextAfterUid?: MailUid;
}
interface MailBody {
	reference: MailReference;
	mimeType: 'text/plain';
	text: string;
}
interface MailAttachment {
	partId: string;
	filename?: string;
	mimeType:
		| 'text/plain'
		| 'application/pdf'
		| 'image/png'
		| 'image/jpeg'
		| 'image/gif'
		| 'image/webp';
	size: number; // decoded byte size, checked against complete data
}
interface MailInvocationContext {
	callerAgentId: string | null;
	mailInvocationId?: string; // main-minted random capability handle; never model input
}
interface MailChunk {
	dataBase64: string;
	nextOffset: number;
	complete: boolean;
}
type MailErrorCode =
	| 'MAIL_DENIED'
	| 'MAIL_INVALID'
	| 'MAIL_UNAVAILABLE'
	| 'MAIL_STALE'
	| 'MAIL_LIMIT'
	| 'MAIL_TIMEOUT'
	| 'MAIL_CANCELED'
	| 'MAIL_PROTOCOL';
type MailResult<T> =
	| { ok: true; value: T }
	| { ok: false; error: { code: MailErrorCode; message: string } };
interface ProposedMailSdk {
	requestSetup(): Promise<MailResult<{ requested: true }>>;
	listAccounts(): Promise<MailResult<MailAccountView[]>>;
	readHeaders(p: {
		invocationId: string;
		accountId: MailAccountId;
		mailbox: string;
		afterUid?: MailUid;
		uidValidity?: MailUid; // required when afterUid is provided
		limit?: number;
	}): Promise<MailResult<MailPage>>;
	searchHeaders(p: {
		invocationId: string;
		accountId: MailAccountId;
		mailbox: string;
		text: string;
		limit?: number;
	}): Promise<MailResult<MailPage>>;
	readBody(p: { invocationId: string; reference: MailReference }): Promise<MailResult<MailBody>>;
	listAttachments(p: {
		invocationId: string;
		reference: MailReference;
	}): Promise<MailResult<MailAttachment[]>>;
	readAttachment(p: {
		invocationId: string;
		reference: MailReference;
		partId: string;
		offset: number;
		limit?: number;
	}): Promise<MailResult<MailChunk>>;
	watchStart(p: {
		accountId: MailAccountId;
		mailbox: string;
	}): Promise<MailResult<{ watchId: string }>>;
	watchStop(p: { watchId: string }): Promise<MailResult<{ stopped: true }>>;
}
```

SDK namespace is `maestro.mail`. Wire method names match the property names,
e.g. `mail.readHeaders`; do not add generic `connect`, `write`, `execute`, `command`,
URL, password or raw IMAP request arguments. Closed parsers reject unknown keys,
prototype/inherited fields, controls, invalid Unicode, sparse arrays and malformed
IDs/references. Mailbox strings use decoded Unicode at the SDK boundary; transport
must explicitly encode supported IMAP mailbox syntax. No mailbox normalization
that conflates two accounts/folders. Host owns IDs, endpoint and username.

| Proposed method(s)                            | Proposed capability / additional authority                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mail.requestSetup`, `mail.listAccounts`      | `mail:accounts` (unscoped, medium). Can request host-owned UI / see only this plugin's safe projection; cannot set secrets or grants. No credential reads.                                                                  |
| `mail.readHeaders`, `mail.searchHeaders`      | `mail:read` (high, exact account allowlist) AND that account's verified agent `read` right.                                                                                                                                 |
| `mail.readBody`                               | `mail:body` (high, exact account allowlist) AND independent `detail` right.                                                                                                                                                 |
| `mail.listAttachments`, `mail.readAttachment` | `mail:attachments` (high, exact account allowlist) AND independent `attachments` right.                                                                                                                                     |
| `mail.watchStart`, `mail.watchStop`           | `mail:watch` (medium, exact account allowlist), user-enabled account watch, active matching Cue consumers; metadata only. `watchStop` reauthorizes the watch's stored account; lifecycle cleanup always bypasses admission. |

Manifest declares capabilities; the user chooses exact host-owned account IDs
through trusted consent. Empty/missing/malformed scope denies, including broad
`*`. Grants cannot cross plugin ownership even if an account ID is known. Until
trusted UI can mint these grants, all calls fail closed. Body/attachment content
capabilities must join existing content-plus-egress policy checks; a plugin holding
network/process egress needs the same trusted-signature policy as transcript reads.
Do not accidentally reject Relay's trusted, consented egress or allow an untrusted
plugin to combine content read and egress. No mail permission grants dispatch.

Header pages are ascending UID, default limit 50; `nextAfterUid` is the last
returned UID only when more results exist. `afterUid` requires matching
`uidValidity`; a reset returns MAIL_STALE, never silently a different namespace.
An empty page still returns UIDVALIDITY. `searchHeaders.text` is literal text for
Subject OR From header matching, never raw IMAP search grammar or body search;
server charset support is restricted to the transport's documented grammar.
Explicit truncation must not skip unreturned UIDs when advancing a page. Host
monitors own ordered scans; Relay's local checkpoints cannot independently publish
an event or advance the host cursor through these content APIs.

Backstage consult confirmed the proposed methods can inform its adapter, with
these DTO/chunk/deadline/watch details and implemented synthetic wiring still
required. Its local account/event snapshots permit up to 1 MiB, while existing
host KV is only 64 KiB per value. This proposal does **not** increase generic KV:
authoritative host account/grant/checkpoint state uses the host-private stores
above, and Relay must reduce its optional cache to 64 KiB or replace it with a
separately proven bounded transactional storage adapter. Splitting security state
across ordinary nontransactional KV writes is not an acceptable workaround. Final
SDK type acceptance and adapter mapping remain later integration tasks; consult
receipt is in the evidence ledger.

## Principals, credentials and live authorization

### Implemented credential-slot foundation (HOST-02 split task)

`src/main/plugins/mail-credentials.ts` implements host-only `MailCredentialSlot`
and `MailCredentialIdentity`/`MailCredentialAuthority`. No production, setup IPC,
SDK/RPC, account service or native backend is wired or exercised. This is source
implementation with static checks only; tests remain separate tasks.

The canonical `createKeyringEntry(service, account, loadModule?)` in
`authorization-ledger.ts` now owns lazy native module loading and construction.
`createKeyringAnchor` delegates to it and retains the existing cached lazy anchor
behavior. Constructing an entry does not prove an unlocked/usable native backend.
Mail uses separate service `com.maestro.mail-credentials`, with a bounded SHA-256
slot name over the JSON tuple `[installationId, pluginId, accountId]`. Host-owned
installation/account IDs are exact printable ASCII allowlist tokens, 1-128
characters; plugin IDs use the canonical pattern and 3-100 length. IDs are never
normalized or conflated. The future private account store must supply a stable
installation ID and never reuse removed account IDs.

Host-only methods `savePassword(password, authority)` and
`removePassword(authority)` return no secret/result. Saving now confirms exact native readback; removal confirms native
absence, including already-absent entries; exceptions or retained credentials
return fixed MAIL_UNAVAILABLE, so the future lifecycle must retain a stopped
cleanup tombstone. Saving requires nonempty printable ASCII, at most the existing
1024-character LOGIN password limit. No plaintext fallback, file persistence,
secret cache, logs/events or SDK getter exists. Native operations are synchronous;
the surrounding account mutation must invalidate/cancel work before calling them
and use the canonical account write queue.

`authenticate(session, username, authority): Promise<void>` reads a password
only after required live host authorization, hands it solely to the fixed LOGIN
operation, and returns no arbitrary transport value. The supplied account/setup
AbortSignal is required; abort closes a pending LOGIN session. The slot captures
that actual signal and the original bound host callback once at LOGIN entry into
an immutable local authority. Native checks, awaited completion and failure checks
use that snapshot, and cleanup removes the listener from its original signal even
if supplied authority fields are later replaced. Rejected capture never rereads
those fields in failure cleanup. Authorization is checked before/after native work
and after the LOGIN await, with cancellation and revocation suppressing late success. Failed LOGIN closes the session; all native
and transport errors are reconstructed as content-free mail errors. No plaintext
password field or peer cause is attached. Local string references are cleared,
but JavaScript/native string memory cannot promise zeroization; the existing
session writer erases owned LOGIN byte buffers.

These required authority callbacks are dependency seams, not proof of a setup
principal or account/agent grant. Future host composition must bind the exact
slot, session endpoint, username, plugin identity, account revision and verified
agent right to one account and generation. The slot does not independently prove
that a supplied host session belongs to that account. No plugin/user argument may
supply the authority or session. Setup identity checks, sealed account/config/grant
schema, live invalidation/monitor cleanup, safe projections, MIME reads and caller
proof remain unchecked. Production native usability is unavailable/unverified;
no actual credential was retrieved and no fake or real LOGIN was run.

### Implemented queued credential mutation prerequisite (HOST-02 split task)

`mail-account-credentials.ts` adds unwired host-only `MailAccountCredentials`,
bound to one canonical `AuthorizationStore`, plugin and immutable parsed
`AuthIdentity`. Its optional entry factory is a later synthetic-test seam, not
an SDK argument. It creates neither a setup principal nor network authority;
trusted setup must supply a live host callback and actual AbortSignal, with
feature/plugin/gesture/nonce/capability/generation gates. Callback and signal
are snapshotted at entry; errors carry fixed codes without paths/secret/native
causes. No production caller, trusted setup minter, IPC/RPC or SDK route exists.

`savePassword(accountId, expectedRevision, password, setup): Promise<void>`
requires an already-disabled exact account and bounded printable ASCII secret,
using the canonical fixed-command string validator. The existing store/activity
queue blocks admission and cancels registered readers before awaiting, checks
exact ownership/revision at submission and drain, and serializes account work.
Before the keyring write it commits another disabled revision and clears that
account's agent rights through the existing sealed/anchored ledger mutation.
`MailCredentialSlot.savePassword` now confirms exact native readback, checking
live authority around set/get; no-op, mismatch, missing value and native failure
cannot report success. Both write/readback local references are cleared.

`mutateAccount(mutation, setup): Promise<void>` accepts only the existing closed
`disable`, `replaceSettings`, `remove` record. It validates the complete transition
and snapshots copied immutable settings before queueing; mutable caller objects
are not retained as authority or settings. At drain it persists disabled state
or a never-reused-ID tombstone, with revision advancement/rights clearing. Disable
now retains credentials without any native slot work. Settings replacement/removal
then delete the exact installation/plugin/account slot and confirm absence.
Removal cleanup authority checks the committed tombstone; it cannot grant reads.
Both operations return void and preserve unrelated sealed accounts/policies.
Their native authority rechecks lease/setup/store and committed exact revision,
enabled state and account-vs-tombstone presence. Checks use canonical revisions,
not object identity, so copying unrelated records cannot make valid work stale.
Direct same-account changes or canonical consent/persistence failures suppress
success; failures inside admitted queue work retain its process-local stop latch.

Setup-signal abort immediately clears the queued save's local password reference;
otherwise it clears after write or in outer settlement/failure finally. A pending
canonical revoke cancels the lease but can retain the bounded queued closure until
queue drain if earlier work never settles. Future trusted setup must abort its
signal on all relevant lifecycle changes; no proof/minter or pending-work erasure
hook is implemented here. JavaScript/native strings cannot promise zeroization.
Native operations remain synchronous and have no interruptible timeout. All slot
access here follows persisted stopped state; no persisted readiness flag exists.

A crash, revocation, failed readback/delete or persistence failure may leave a
credential or old credential in the native slot. The persisted account remains
disabled or tombstoned. Durable removed-slot cleanup intent/confirmation and retry
are implemented below only for an otherwise admissible activity registry; live-account
orphan cleanup intent/completion is still unavailable. There is no orphan scan, rollback, enable/recovery or plugin-uninstall
cleanup orchestration. Direct stored mutation methods remain host prerequisites and do
not themselves erase keyring slots. Future lifecycle must route through this
composition and add the remaining live-account cleanup/recovery; re-consent is not proof of cleanup.
Everything here is source implementation/static checking only, not mock-tested,
secure-backend verification, available setup or production-tested readiness.

### Implemented removed-account credential cleanup retry (HOST-02 split task)

`MailAccountCredentials.cleanupRemovedAccount(accountId, expectedRevision, setup):
Promise<void>` is an unwired trusted-host seam. It requires an actual AbortSignal
and mandatory live setup callback using the existing setup snapshot. It accepts
only a retained exact removal tombstone, never a live account, disabled account,
unknown ID or stale revision. `requireMailAccountTombstoneRevision` reuses the
configuration's opaque-ID and safe positive revision validators. It permits a
terminal maximum-safe-integer tombstone because cleanup never advances revisions.

`AuthorizationStore.enqueueRemovedMailAccountCleanup` uses the same canonical
activity registry/keyed mutation queue as account edits, bounded by its existing
1024 account states, 64 total/eight per-account pending mutations. It parses the
host identity, checks canonical persistent/anchored configuration and both plugin
identity bindings, snapshots the installation ID, and validates exact tombstone
presence/revision at admission, queue drain, around native work and completion.
Host callbacks are checked before and after stored checks; a final stored check
also detects a callback that synchronously changes consent/state. It returns no
account or credential data. The queue itself does not commit history; the credential
wrapper records durable cleanup outcomes as described below, preserving all IDs.

The credential wrapper reuses the exact installation/plugin/account slot and the
existing committed-state authority, then calls `removePassword`, which checks
native deletion and readback absence. Already-absent slots may complete only if
the backend confirms absence; native throw, no-op deletion leaving a value,
cancellation, stale state or revoked authority cannot report success. Repeated
successful cleanup is safe; no password getter, cache, readiness flag, arbitrary
native target, transport command, SDK/RPC or invocation identity is added.

A failure in admitted work retains the account's stopped latch. Cleanup never
resets account/plugin/process latches or creates a replacement registry. After a
restart, a fresh canonical store may retry the retained tombstone only if seal,
anchor, identity, consent and live setup all validate normally. Canonical revoke,
uninstall, identity mismatch and persistence failure still deny this seam; cleanup
across those states requires separately designed host lifecycle authority.

Durable pending/confirmation metadata for removed slots is implemented below.
No automatic scan/production caller, disabled-account orphan cleanup, enable/recovery,
trusted setup minter, verified
caller, SDK/IPC/Cue/MIME/monitor or dispatch path exists. Tombstones are retained
permanently; a restart does not prove cleanup succeeded. Native calls remain
synchronous and cannot guarantee interruptible timeout or string zeroization.
Source/static checks only: no fake/backend/runtime or production acceptance claim.

### Implemented durable removed-slot cleanup metadata (HOST-02 split task)

Retained tombstones now carry `credentialCleanup: 'pending' | 'confirmedAbsent'`.
Older configuration records without this field load as pending, without inferring
native absence. Explicit null, other strings/types, hidden/accessor fields or
unknown keys fail the existing closed schema. Counts/bytes/history remain bounded;
no ledger/config/public API version bump is required for this private additive
migration. Removal writes pending alongside the stopped state before native access.

`AuthorizationStore.recordRemovedMailCredentialCleanup(pluginId, identity,
accountId, expectedRevision, credentialCleanup, assertSetupActive)` is an unwired
trusted-host composition seam, never an RPC/IPC or plugin-controlled outcome.
It reuses canonical sealed configuration commits/anchor readback, exact retained
revision and persistent installation/plugin/dual identity gates, plus mandatory
live authority before/after committing. A reentrant callback changing configuration
or consent is rejected. Only the marker and canonical epoch change; the removal
revision (including terminal maximum), all IDs/history, unrelated accounts and
agent rights stay intact. It neither creates nor resets activity stop latches.
Its trusted caller must run in the existing queue and supply native absence proof;
passing a string to this host-only method is not itself such proof.

`cleanupRemovedAccount` now commits pending on every admitted attempt before
constructing/touching its exact native slot, including attempts previously marked
confirmedAbsent. It then confirms deletion/readback under live lease/setup/store
checks, commits confirmedAbsent and rechecks authority before reporting success.
The existing `mutateAccount` removal path also records confirmedAbsent after native
absence confirmation; disable/settings changes still have no durable outcome marker.
Failed admitted commits/native work retain stopped latches; canonical persistence
failure stops all mail activity. There is no new queue, store or public surface.

Crash policy: pending means cleanup has not durably completed. A crash after native
absence but before confirmation leaves pending, permitting an otherwise authorized
fresh-store retry. Anchor-first partial persistence may require ordinary re-consent
and can deny recovery; this task supplies no bypass. ConfirmedAbsent records only
historical exact-slot absence. It is not readiness, current backend truth, read
permission or permission to skip native checks. A crash/revocation after the
confirmation commit but before the final check may leave that historical marker
while the request fails; no atomic ledger/keyring transaction or exactly-once result
is promised. Native operations remain synchronous and string zeroization unproven.

No scan, live-account orphan recovery, enable/latch reset, setup/caller minter,
SDK/IPC/Cue/MIME/monitor/dispatch or production caller. Static source checks only;
no native/backend/store invocation, tests or production acceptance claim.

### Implemented queued disabled-account enable prerequisite (HOST-02 split task)

`MailAccountCredentials.enableAccount(accountId, expectedRevision, setup)` is a
host-private unwired composition, not an SDK/setup/RPC method. It reuses the
canonical account activity queue and exact-slot credential adapter. Required
snapshotted setup callback and AbortSignal are checked at admission, queue drain,
native entry creation/readback, before commit and at completion. The canonical
sealed configuration binds installation, exact plugin, both AuthIdentity bindings,
account ID and expected revision; unknown/removed/foreign/stale/enabled accounts,
revision exhaustion and inadmissible stopped activity deny before native access.

`MailCredentialSlot.assertPasswordAvailable(authority)` reads only the exact bound
slot, validates the existing bounded ASCII LOGIN password grammar, drops its local
reference in finally and returns void. Missing, malformed, locked or failing native
entries produce fixed content-free errors. It returns no password, presence flag,
metadata, protocol result or credential cache; JavaScript string zeroization and
interruptible native calls are not promised.

After a successful probe and live disabled-account recheck,
`AuthorizationStore.enableMailAccount` advances the account revision and canonical
epoch through the existing sealed commit/confirmed anchor. It stores enabled user
intent, clears ALL of that account's agent rights and preserves unrelated
accounts/grants/settings and removal history. Old disabled-account grants are never
rebound or revived; explicit fresh policy is still required. The narrow setter
requires live host authority and checks reentrant configuration changes plus the
committed exact enabled revision. The generic stored mutation parser still rejects
an enable kind. Production setup MUST use the queued credential composition, not
wire the stored setter directly; a host callback alone is not a credential proof.

The probe records only availability at that instant. No TLS, authentication,
connection test, secure-backend verification, agent content read or operational
readiness is established. A credential may change out of band after the probe;
future reads must validate native availability and all live gates anew. No native
runtime, fake backend or production path was invoked in this source task.

Failures inside admitted queue work retain the canonical stopped-account latch;
persistence failure retains the global stop. Existing plugin/account/process latches
are never reset, even after a good probe. Before commit, failed work leaves disabled
state; after commit, enabled intent with no rights may persist while the response
fails. A final authority/configuration failure after the queue has settled can also
fail the response after a durable commit, without inventing a new latch or rollback.
Restart does not infer grants from enabled intent. Partial anchor-first persistence
may require normal re-consent. There is no ledger/keyring atomic transaction or
exactly-once claim. Trusted setup/caller minting, production rights controls, failed-latch
recovery, native backend verification and read/MIME/watch/SDK/IPC/Cue/production
wiring remain unavailable.

### Implemented queued exact-account rights prerequisite (HOST-02 split task)

`MailAccountCredentials.replaceAgentRights(accountId, expectedRevision, agents,
setup): Promise<void>` now composes the canonical account mutation queue and sealed
rights replacement. It is host-private, unwired and statically checked only.
`MailGrantAuthority` extends the existing private credential authority with required
`assertAgentActive(agentId): void`. Setup signal/callback and this membership callback
are captured before awaiting; `parseMailAgentRights` creates the closed frozen copy
of the entire requested list and independent read/detail/attachments rights.
No supplied agent ID is caller proof. Future trusted setup must bind the callback
to the live host agent registry and bind setup authority to the exact approved
account/list/gesture/frame/generation. These callbacks do not create those principals.

Both callbacks are mandatory even for an empty list; an empty list invokes no
membership lookup and revokes all exact-account rights. Each listed agent is checked
at admission, queue drain, around persistence and before return, with setup abort
checks between agents. No permissive default, keyring probe or credential access.
The existing parser denies malformed/duplicate/wildcard/overflow policy before
queuing; stored installation/plugin/dual identity/account/revision validation denies
unknown/removed/foreign/stale state. Revision exhaustion remains MAIL_LIMIT.
Policy may be staged on a disabled account, but it never enables that account.

Canonical queue admission synchronously blocks new readers and cancels existing
readers before waiting. Drain rechecks exact installation/revision/enabled intent.
The synchronous `AuthorizationStore.replaceMailAgentRights` now also requires
`assertSetupActive`, snapshots the plugin identity and checks authority plus current
configuration before and after the anchored commit. It advances the account revision
and canonical epoch, preserving enabled intent, settings, unrelated accounts/grants
and retained removal history. Reentrant account change/removal/revoke or persistence
failure suppresses success. The queued composition rechecks the exact committed
account revision/enabled state after callbacks and queue settlement. Changes to
unrelated accounts are preserved; the synchronous commit conservatively refuses
configuration changes during its pre/post authority callbacks.

Admitted queue-work failure keeps the existing stopped-account latch; plugin revoke
and global persistence failures retain their canonical latches. This operation never
resets one. Abort while waiting is detected at drain (no immediate promise settlement
if earlier queue work never settles). Failure before commit leaves old durable policy
but stops admitted account activity; a successful commit followed by authority loss
can leave the new policy durable while returning failure. Post-settlement failure
suppresses the response, but cannot roll back policy or create a new queue latch once
the completed queue entry has been pruned. Future live proof/membership enforcement
must deny deleted agents and fresh publication must reauthorize. Restart reloads
anchored policy without reconstructing failed-process latches; this seam creates no
restart recovery or authentication/readiness guarantee. No credential cleanup,
setup UI/proof minter, live registry binding, broker/SDK/RPC/version/Cue/production
wiring, tests or runtime backend invocation exists from this source task.

### Implemented private account configuration schema (HOST-02 split task)

`src/main/plugins/mail-account-config.ts` implements only source-level private
configuration validation. `parseMailAccountConfiguration(serialized)` checks the
UTF-8 input ceiling before BOM-aware JSON parsing, requires version 1 and exact
root fields `version`, `installationId`, `pluginId`, `accounts`, `tombstones`, and
returns deeply frozen copied records. Installation/account IDs are canonical
32-character lowercase hex strings; plugin IDs reuse `PLUGIN_ID_PATTERN` and the
existing 3-100 character bounds. Revisions are positive safe integers. This
schema is host-private and is not a public SDK contract or authorization ledger.

Each account has exactly `accountId`, `revision`, `enabled`, `endpoint`,
`username`, `mailboxes`. Endpoint fields are exactly `host`, `port`, `tls: true`
and optional boolean `allowNonstandardPort`. Account endpoint checks reuse the
extracted `validateConfiguredImapEndpoint` used by the actual connection layer:
DNS hostname grammar, explicit port, nonstandard-port opt-in, no literal IP or
URL-normalized numeric aliases. DNS resolution/private-IP checks remain at actual
connection time; accepting a hostname here does not prove safe egress. Username
and mailbox checks reuse `assertImapQuotedString` from fixed commands, with their
256-character printable-ASCII bounds. Mailbox arrays are nonempty, unique and
exact, without trimming/case folding/ampersand normalization. Non-ASCII mailbox
setup remains unsupported, consistently with the current transport grammar.

Limits are 512 KiB decoded JSON, 32 accounts per plugin, 32 mailboxes per account
and 1024 tombstones. Tombstones contain only `accountId`, `revision` and the closed `credentialCleanup`
field described above (legacy omission defaults to pending); IDs must be
unique across accounts and tombstones. Overflow fails rather than discarding
removal history. Closed object/data-descriptor and dense-array checks reject
extra, inherited, accessor, symbol, hidden and sparse fields where host settings
objects are accepted. Passwords, agent rights, raw TLS overrides and arbitrary
connection fields are excluded. Failures return fixed `MAIL_INVALID` errors with
no parser/native/config cause attached; corrupt/missing input never becomes an
empty trusted store. JSON duplicate-key handling follows the canonical JSON
parser's last-key semantics; future persistence must supply host-produced JSON.

`createDisabledMailAccount(settings)` validates exact `endpoint`, `username`,
`mailboxes` settings and generates a 128-bit random opaque account ID, revision 1
and `enabled: false`. It accepts no supplied ID, enable flag, credential or right.
It creates no grant. The canonical ledger addition below checks generated IDs against live records
and removal history before committing, persists the stable installation ID, and
binds plugin ownership and AuthIdentity independently. Parsed `enabled`
is only stored intent; it is not proof of consent or permission to connect.

The schema module has no disk/native/socket/handler operations. Its persistence
prerequisite is implemented below. Agent-rights storage is implemented below; trusted setup
and caller proofs, live generation/abort wiring, operational account projections, MIME
operations, SDK and Cue remain unavailable. Stored summaries are implemented below. Neither runtime nor fake assertions
have run; static compilation does not establish mail compatibility, secure
persistence or full acceptance.

### Implemented canonical account persistence prerequisite (HOST-02 split task)

`authorization-ledger.ts` now uses private ledger schema version 2, with a single
`mail` extension parsed by `mail-account-ledger.ts`. This is an internal storage
version, not a host API/SDK version. The existing production authorization store
will use this migration when this source is eventually built/run; mail methods
have no runtime callers, IPC or SDK routes. Only source/static checks ran here.

A fresh, sealed version-1 ledger whose install secret and epoch match its anchor
is migrated with a new 128-bit opaque installation ID and empty configuration
list, preserving existing plugin consent. Migration increments the same canonical
epoch and persists through the existing seal/anchor path; it creates no mail
rights. Version-1 mail fields, unknown root fields, malformed version-2 mail state,
unsupported versions and stale/foreign seals fail closed through re-consent.
The loaded extension is closed and immutable, permits 32 plugin configurations,
and reuses per-plugin configuration limits and tombstones. Each configuration
must match the shared installation ID and a unique exact plugin ID, and carries
an immutable AuthIdentity binding (64 lowercase hex digest, unsigned/null or
trusted/untrusted bounded signer key). Invalid signature status is refused.
Legacy plugin consent identity parsing is unchanged.

Host-only `readMailConfiguration(pluginId, current)` returns immutable private
configuration or null only for genuinely absent configuration in an otherwise
trusted store. It validates the current host-supplied identity, live plugin
consent/tombstones, the configuration's independent identity binding, persistent
storage mode, seal/anchor availability, and exact live anchor secret/epoch.
Session-only, dropped prior state and any persistence failure deny mail state.
`addDisabledMailAccount(pluginId, current, settings, assertSetupActive)` requires live
trusted-host setup authority and validates and adds a random
revision-1 disabled account, preserves removal history, refuses ID collisions or
account/plugin overflow, increments the canonical epoch, persists, then checks
access and the complete committed configuration again. Identity and settings are
closed immutable snapshots before the precommit authority check. It cannot edit,
enable, remove, rebind identity or grant rights.
These methods assume a trusted main-process caller; an identity argument is not
an invocation proof. Neither method may be exposed to a plugin or generic IPC.

The common ledger reader bounds the opened ciphertext to 24 MiB before buffer
allocation, handles short reads and rejects concurrent growth, and bounds unsealed
text to 20 MiB before JSON parsing (the seal adapter necessarily returns the
plaintext first). Writes bound serialized/sealed data, confirm seal/anchor
availability and read back the exact anchor after writing it. Newly created temp
files use mode 0600. Existing atomic rename and anchor-first commit semantics
remain: a partial commit fails mail access in this process and stale state is
rejected on restart. No fsync/power-loss durability guarantee is added. Ordinary
plugin consent keeps its session-only fallback; mail does not use that fallback.
These shared-path changes require later canonical-ledger regression tests.

No store/backend/native invocation ran during implementation. Stored agent rights
and revision bindings are implemented in the prerequisite below. Credentials,
setup/caller proof, feature/manifest policy gates,
account mutation queues/invalidation, operational projections, MIME operations and Cue remain
unimplemented. Stored disable/edit/remove and summaries are implemented below. Plugin revoke/uninstall denies private reads through existing
consent, but configuration/history is retained for later credential cleanup;
purging that state is not implemented. Exact removed-account cleanup retry is
implemented above only while canonical plugin consent remains valid. Dropped/tampered
state cannot recover orphan credential slots yet. This is not secure mail
acceptance, mock-tested behavior or production-tested readiness.

### Implemented sealed agent-rights prerequisite (HOST-02 split task)

`mail-account-ledger.ts` now parses optional `agentGrants` alongside each sealed
configuration and its independent AuthIdentity. Older version-2 configurations
without that field receive an immutable empty array, never inferred rights;
explicit null, unknown fields and malformed records fail closed. The private
ledger remains version 2; the public host/SDK versions remain unchanged.

Each grant has exactly `accountId`, `accountRevision`, `agents`. The account must
exist in this configuration at that exact revision, cannot be tombstoned, and may
appear only once. The configuration binds installation and plugin ownership.
Each agent has exactly `agentId`, `rights`; there are at most 128 unique agents
per account, with exact printable ASCII IDs of 1-128 characters additionally
validated by canonical `isValidAllowlistMember` (no wildcard/shell/scope syntax).
Rights are a nonempty unique subset of independent `read`, `detail`,
`attachments`; no implication, default, watch or dispatch right. A present account
grant must have agents; removal is represented by omitting the account grant.
Closed record/dense array parsing and frozen copies reuse the existing validators.
The shared 20 MiB plaintext/24 MiB ciphertext ceilings still bound persisted state.

Host-only `replaceMailAgentRights(pluginId, current, accountId, expectedRevision,
agents, assertSetupActive)` replaces one account's complete agent policy. An empty agent list revokes
all its rights. It requires live persistent configuration and both plugin identity
bindings, validates the expected revision, increments the account revision and
canonical epoch, preserves other accounts' grants, seals/anchors through the
existing store and rechecks access after persistence. Revision exhaustion returns
MAIL_LIMIT, revision mismatch MAIL_STALE; failures use only fixed mail errors.
It may stage policy for a disabled account but never enables an account. All
new accounts still start disabled and without grants. Adding a different disabled
account now preserves existing grants through the same private commit helper.

`assertStoredMailAgentRight(pluginId, current, accountId, expectedRevision,
agentId, right)` checks current persistent store/anchor and both AuthIdentity
bindings, enabled account, exact revision, agent and requested independent right.
This is a stored-policy predicate, **not invocation or I/O authority**. Host
composition must additionally verify live agent membership/proof, manifest and
plugin capabilities/content-egress policy, feature flags, generation/cancellation
and reauthorization across awaits. There are no callers or SDK/IPC routes.

Canonical plugin `mint`, `revoke` and `uninstall` clear this plugin's stored mail
rights in the same epoch/commit, retaining private configuration/removal history
for later credential cleanup. Re-consent therefore cannot revive old agent rights;
fresh mail consent is required. Stored account disable/edit/remove and summaries
are implemented below. Re-enable, cleanup, trusted setup, verified caller, live
queue/generation abort, operational projections,
MIME/monitor/events/Cue and production wiring remain unimplemented. The existing
production authorization store will execute these shared consent changes when
built/run; canonical regression tests remain required. No test or runtime/native
store invocation ran, and no mock-tested or production-tested readiness is claimed.

### Implemented stored account mutation and projection prerequisite (HOST-02 split task)

`mail-account-config.ts` adds `requireMailAccountRevision` (also reused by stored
agent-policy replacement) and pure `changeMailAccountConfiguration`. The latter
accepts a closed `{ kind, accountId, expectedRevision }` record, with required
`settings` only for `kind: 'replaceSettings'`. Kinds are exactly `disable`,
`replaceSettings`, `remove`; unknown fields, controls, malformed IDs/revisions,
accessors and unsupported settings fail with fixed content-free errors. Existing
settings/endpoint/mailbox validators are reused. An exact missing account denies,
revision mismatch returns MAIL_STALE, revision exhaustion returns MAIL_LIMIT.
The pure helper assumes configuration from the existing closed sealed-state parser;
it confers no authorization and mutates no input.

Disable and settings replacement increment the account revision and always leave
it disabled. Settings replacement is complete, not a partial patch, and preserves
the host-generated account ID. Removal increments the revision into a tombstone
and removes the account. History is never trimmed: at 1024 tombstones removal
returns MAIL_LIMIT before changing state. Existing configuration validation bounds
total size/counts and refuses collisions between active and removed IDs; account
addition therefore cannot reuse a tombstoned ID. No new private/public version.

Host-only `AuthorizationStore.mutateMailAccount(pluginId, current, mutation)`
first checks live persistent configuration/anchor and both AuthIdentity bindings,
then applies the transition, clears all agent rights for that exact account, and
preserves every unrelated account/plugin/grant/history record. It uses the common
canonical epoch/seal/anchor commit and access recheck. Pre-commit validation and
epoch exhaustion leave stored mail state unchanged. Persistence failure retains
the existing permanent in-process mail denial and restart freshness behavior;
there is no crash/power-loss durability upgrade. No account enable path is added.

Host-only `listStoredMailAccounts(pluginId, current)` uses the same live private
reader and returns a frozen array of closed frozen records containing only
`accountId`, `revision`, `enabled`, and frozen exact `mailboxes`. Empty means
absent configuration or no accounts in an otherwise authorized persistent store;
failed authorization/storage is never converted into an empty list. It exposes no
endpoint, username, installation/plugin identity, grants, tombstones or credentials.
It does not probe keyring slots or invent credential/readiness status. This stored
summary is **not** the proposed public `MailAccountView`/`mail.listAccounts` result.

These are unwired stored-state seams, with no caller, SDK/IPC route or setup proof.
The activity prerequisite below now cancels registered reads synchronously before
canonical account/policy/consent mutations. Future trusted lifecycle must bind
actual sockets/monitors to those leases and route asynchronous setup through the
account mutation queue. It must remove/rebind credentials on
settings replacement/removal and retry failures from retained removal history;
this task does not clean slots, discover orphans, enable an account, or grant I/O
or dispatch authority. Feature/manifest/content-egress and live-agent/caller gates,
MIME, monitor/checkpoint/events/Cue and full lifecycle remain unavailable.
Only source formatting/strict type/whitespace checks ran. No tests/native keyring,
storage runtime, socket or login ran; no mock/production readiness claim.

### Implemented account activity prerequisite (HOST-02 split task)

`src/main/plugins/mail-account-activity.ts` and `AuthorizationStore` now provide
host-private activity/admission seams. These are source/static foundations only,
with no setup, verified-caller, transport, credential, monitor, SDK/IPC or Cue
production composition and no runtime/mock tests.

- Each canonical store owns one registry and the canonical `createKeyedWriteQueue`
  from `src/main/utils/atomic-json-store.ts`. JSON tuples key exact plugin/account
  IDs; installation is bound by the owning sealed store. No second persistent
  policy store, numeric generation counter or dispatch engine is introduced.
- `acquireMailActivity` snapshots the parsed immutable dual plugin identity and
  requires a host callback proving **current** caller/live agent membership,
  plugin identity, feature, manifest/capability and broker/egress policy. Stored
  enabled-account, exact agent, independent right and revision checks are composed
  at admission and every `assertActive`. Missing/failing callbacks deny; host
  input parameters alone are not caller proof. Callback errors become fixed
  content-free errors, with no cause or peer content.
- Each lease has a fresh AbortController as its generation token. Cancellation
  or release permanently denies that handle even if an idle key is later reused.
  Idle unblocked states are pruned. Abort is synchronous; read admission is also
  denied while invalidation is invoking abort listeners. Snapshotting reader sets,
  removing them before callbacks and matching state identity on pruning prevent
  reentrant cleanup from deleting a new account generation.
- `enqueueMailAccountMutation` is trusted-host-only **void** work. It requires live
  setup authority (nonce/gesture/generation checks must come from the future setup
  minter), checks exact ownership/revision at submission and queue drain, and
  blocks new readers/cancels existing readers synchronously before any await.
  Same-account callbacks serialize; different accounts remain concurrent. Setup
  authority and private store identity/availability recheck before and after
  work. The post-check allows the work's own revision advancement or removal;
  it does not infer an enabled account or new rights and returns no work result.
  Every awaited step inside the callback still requires lease checks.
- Limits per store: 1024 retained account states, 512 active readers (8/account),
  64 queued/running mutations (8/account). Limit rejection starts no work; failed
  admitted mutations block that account and abort its pending mutation tokens.
  Queued work then fails before running. A never-settling callback can retain its
  bounded slot; this foundation does not add timeout or recovery authority.
- The canonical configuration commit cancels affected old revisions/removals
  before state change, including direct disable/settings/remove/agent-right paths,
  and rechecks the original configuration after abort callbacks to prevent a
  reentrant mutation/revoke being overwritten. Plugin mint/revoke/uninstall and
  accepted allowlist-scope edits invalidate all registered plugin activity before
  mutation. They also cancel queued setup and retain a bounded plugin latch,
  denying new accounts of that plugin during abort callbacks. A seal/anchor/disk
  persistence failure globally stops the registry permanently in this process.

**Conservative stopped state:** failed admitted account work and plugin consent
changes with registered activity have no in-process reset in this prerequisite.
Retained latches count against the state bound and cannot be cleared by re-consent.
A future separately reviewed trusted recovery/enable path is required. Latches
are process-local: restart discards them and can restore earlier sealed account
state. Durable stopped-state handling across restart remains a full-lifecycle
requirement; this primitive supplies no keyring cleanup or caller proof.
Unrelated accounts survive account-local cancellation; plugin-wide invalidation
intentionally stops all registered accounts of that plugin.

**Composition obligations:** host code must attach nonthrowing abort cleanup to
close its actual socket/watch, pass the signal into connection/credential seams,
check before/after every await and immediately before publishing, release reads
in `finally`, and erase owned MIME/literal buffers on failure or discarded result.
The registry does not own those buffers and cannot erase them. All async setup,
credential writes/cleanup and policy/config changes must compose the keyed queue;
direct synchronous ledger methods are cancellation guards, not async setup
serialization. No callback may come from a plugin or manufacture setup/caller
proof. Live plugin-disable/feature-off/uninstall/shutdown handlers still need to
bind runtime cancellation, and credential cleanup/retry, enable/recovery,
MIME/headers/attachments, monitor/events/checkpoints and Cue wiring remain absent.

Only strict type/format/whitespace checks and source inspection ran. No keyring,
storage backend, socket/login, product test or mock/production acceptance claim.

### Implemented authenticated header-literal read prerequisite (HOST-02 split task)

`src/main/plugins/mail-account-read.ts` now exports the host-private
`MailAccountHeaderReader` and `MailHeaderReadAuthority`. This source composes the
existing canonical sealed account store/activity lease, exact native credential
slot and configured TLS/fixed-command transport. It has no production caller,
SDK/RPC registration, proof minter or trusted setup. Source/static checks only;
mock-tested and production-tested status are false. The independent public
`mail.readHeaders` proposal remains unavailable.

The constructor binds the canonical store, exact plugin and parsed immutable dual
`AuthIdentity`, with snapshotted host transport dependencies and optional fake
native entry factory. `readHeaderBytes(reference, authority)` accepts a closed
host-private reference containing only `accountId`, `accountRevision`, `mailbox`,
`uidValidity` and `uid`. Closed data descriptors, supported ASCII mailbox and
canonical positive 32-bit decimal identifiers are validated before dialing.
`assertImapUid` is extracted from the existing fixed-command validator without
changing its identifier/error rules; both fixed commands and this reader reuse it.
No caller endpoint, username/password, generic plan, commands or socket is exposed.

Authority requires a snapshotted host callback, agent ID and AbortSignal, never a
permissive default. The callback must prove live verified caller/agent membership,
plugin identity, feature and manifest/capability/broker/egress policy at every
boundary. An agent ID and callback supplied by a plugin are **not** proof; future
production code must construct this authority only from its host proof/handle
resolver. No caller identity is accepted in the reference. The callback's function
and signal are captured; its trusted receiver may maintain live host state.

Canonical acquisition requires the exact enabled account revision and independent
`read` right. `detail`/`attachments` confer no header authority. Exact installation,
plugin/dual identity, account revision and configured mailbox recheck around each
await and before transferring a result. Unrelated-account configuration commits
are tolerated; the current account need not retain JavaScript object identity.
Caller abort releases the lease; canonical mutation/consent/persistence-failure
invalidation aborts it directly. Its signal reaches the real transport and LOGIN;
abort closes pending transport and wipes any reader-owned literal. The successful transport closes while the lease is still active and authority
rechecks after close, before byte/display transfer. Listener cleanup, fallback
socket close and terminal lease release occur in finally on every path.
Rejected/late fetched results are taken into host ownership before callbacks and
erased on error; no late result is published by this reader.

One fixed sequence opens the configured account with pinned validating TLS,
authenticates from its exact installation/plugin/account slot with no secret
getter, EXAMINEs the configured mailbox against the supplied UIDVALIDITY, and
fetches only the exact UID's fixed allowlisted header BODY.PEEK section. All TLS,
framing, command/concurrency and wire/response limits remain canonical. Returned
header bytes are limited to 64 KiB. The later reference-search and complete-source
seams are documented below; no numeric-part fetch, LOGOUT-dependent completion
or arbitrary work callback is available. The raw-byte mode
does not decode headers; the fixed display mode is documented below.
The connection is destroyed after validated FETCH; no background watch or event.

The monotonic operation budget starts before caller/account admission. The existing
10-second DNS/TLS/greeting/LOGIN and 30-second total session limits are tightened
to the remaining budget rather than restarted after ledger/native checks. Live
checks supplement transport timers, including after native credential reads and
before result transfer. Synchronous native/backend or callback work cannot be
preempted by timers; overruns fail on the next check. Lower layers can normalize
an authority/deadline failure to MAIL_DENIED; no raw native/peer error is retained.

**Ownership limit:** success transfers a raw header buffer to trusted host code and
ends this lease. The recipient must erase it after use or discard, run a bounded
allowlisted header projection, and acquire/check fresh live invocation authority
before any later publication. Already transferred bytes cannot be recalled by this
reader, and JavaScript secret strings cannot promise zeroization. Fetch success
is historical, never ongoing authorization or credential/readiness state. MIME,
header DTO/pagination/search, body/attachments, durable stopped-state recovery,
watch/checkpoint/events/Cue, caller/setup, SDK/RPC and lifecycle production wiring
remain separate. No native/storage/transport invocation or test ran in this task.

### Implemented consumed header display projection (HOST-02 split task)

`src/main/plugins/mail-header-projection.ts` implements the pure host-private
`consumeMailHeaderDisplay(bytes)` prerequisite. It consumes a trusted host-owned
Buffer and returns only frozen optional `subject` and `sender` strings. The pure function has no
store/native/network operation, caller proof or live lease of its own,
SDK/RPC/event/Cue route or production caller. Implemented/static-checked only;
mock-tested and production-tested status remain false.

The canonical frozen `IMAP_HEADER_FIELDS` list extracted in
`mail-imap-commands.ts` supplies both the unchanged fixed HEADER.FIELDS wire
section and this parser's closed case-insensitive allowlist. All fields must be
unique, including fields discarded from the projection. Unknown fields, orphan
continuations, whitespace before the colon, bare CR/LF, NUL/DEL/other controls,
8-bit wire bytes, missing final empty CRLF line and any suffix after that line
fail closed. An empty complete block (`CRLF`) returns an empty projection.
Headers need not include Subject or From; absent and present-empty are distinct.

Limits are the canonical 64 KiB input cap, 998 bytes per physical line, 256 lines
including the final empty line, at most the twelve allowlisted fields, 8192
unfolded bytes per field, 75 bytes per encoded word, 128 encoded words per display
field and 1024 UTF-8 bytes per projected string. Bounds are fixed and cannot be
loosened by a caller. Overflow fails without truncation. Folding removes only
CRLF and retains continuation whitespace; display whitespace then collapses to
single spaces and trims edges. Only Subject/From receive display decoding;
To/Cc/Date/message references/MIME fields are validated as bounded ASCII header
text and discarded without interpretation.

The restricted display decoder follows the folding and encoded-word foundations
in [RFC 5322 section 2.2.3](https://www.rfc-editor.org/rfc/rfc5322#section-2.2.3)
and [RFC 2047](https://www.rfc-editor.org/rfc/rfc2047). It accepts case-insensitive
UTF-8, US-ASCII and ISO-8859-1 charset names with B or Q encoding. B requires
canonical padded base64 including pad-bit readback; Q requires uppercase `=HH`
escapes and converts underscore to space. Encoded words must have SP/HTAB
boundaries; whitespace between adjacent words is discarded. A Q payload starting
with an escape is not mistaken for the word terminator. UTF-8 decoding is fatal,
ASCII refuses high bytes, and Latin-1 is the actual ISO byte mapping rather than
Windows-1252. Unknown charsets/encodings, charset-language extensions, malformed
words/escapes, replacement decoding, raw UTF-8 headers and unsupported placement
fail rather than being guessed. Unicode controls, formatting/bidi controls,
surrogates and line/paragraph separators are refused, including decoded CR/LF,
NUL and BOM. This is a deliberately restricted display decoder, not a complete
RFC 2047 placement validator, address parser or MIME implementation; it does not
promise compatibility with every valid Internet message.

Sender is the complete From display text, never a parsed or verified mailbox,
identity or authorization principal. Both strings are attacker-controlled plain
text: later renderers must escape them and must not treat them as markup,
instructions, trusted routing or authentication. No arrival timestamp, message
size, attachment count, reference or MIME/body claim is invented from these bytes.
The initial metadata-only Cue proposal still excludes subject/sender.

Input buffers (including oversized/malformed input) and temporary B/Q decoded
buffers are erased in finally on success and failure. Failures are reconstructed
as fixed content-free MAIL_INVALID/MAIL_PROTOCOL/MAIL_LIMIT errors without a
parser/peer cause. The caller must exclusively own all input aliases; clearing
an alias can affect other views. JavaScript header/decoded/output strings cannot
be zeroized, and consumed bytes cannot be reused. The integrated display reader below retains/rechecks live invocation/account
rights through projection. Any later external publication must reauthorize again,
discard stale results and never send raw headers to a plugin.
This pure function supplies no ongoing authority or cancellation/revocation
boundary. Public header pagination/search/DTO integration, body/attachments/MIME, caller/
setup, lifecycle recovery and production/event/Cue wiring remain separate.

### Implemented authorized header display read (HOST-02 split task)

`MailAccountHeaderReader.readHeaderDisplay(reference, authority)` now composes the
actual authenticated exact-reference read and `consumeMailHeaderDisplay` inside
one private fixed flow. The raw-byte method remains a host-private seam with its
post-transfer ownership obligations. Neither method is a registered SDK/RPC API
or a production caller/proof resolver; implementation is statically checked only,
not mock-tested or production-tested.

Both modes use the same closed reference, captured callback/signal/agent ID,
sealed enabled-account revision/independent read right, exact installation/plugin/
dual identity/configured mailbox, credential LOGIN, EXAMINE UIDVALIDITY and fixed
header FETCH. Display mode has no caller-supplied projector or fallback returning
raw bytes. The fixed pure projector consumes the actual literal while the read
lease remains active, and returns only frozen optional subject/sender strings,
including the empty projection when both headers are absent. The reference and
projection do not confer sender identity, MIME/body/attachment or readiness claims.

Checks cover authority/cancellation and the original monotonic total budget
immediately before and after synchronous projection. Transport close occurs
before result transfer while the lease remains active; another check catches
synchronous transport cleanup callbacks that revoke/cancel/mutate or overrun the
budget. Both modes have that close-before-transfer check. No wrapper await adds
an extra async boundary between the private flow and method return. Canonical
lease/listener cleanup remains in finally. Parsing/close/authority/deadline failure
rejects with the existing fixed content-free errors and suppresses the display
result; owned literal bytes are erased on success, rejection and cancellation.

Projection uses bounded synchronous work and adds no timer, queue or store.
Native/callback/projection work cannot be preempted; deadline overruns fail at the
next boundary. JavaScript display strings cannot be zeroized or recalled, so
success is only a historical authorized host result. A future SDK/event/UI
publication must perform its own live invocation/account authorization at that
boundary, including after any consumer await. Initial Cue metadata still excludes
subject/sender. There is no public header page/search/DTO integration, caller/setup
minter, lifecycle recovery, body/attachment MIME, watch/checkpoint/event/Cue or
production wiring from this task. No source runtime or product test was invoked.

### Implemented authorized reference search (HOST-02 split task)

`MailAccountHeaderReader.searchReferences(criteria, authority)` is a host-private
identifier-discovery seam, implemented and statically checked only. It uses the
same private fixed read flow as byte/display header reads, with the existing
`MailHeaderReadAuthority` callback/signal/verified-agent obligation. No new
permission store, transport, generic plan, public SDK/RPC or production caller
is introduced. It is not the proposed `mail.searchHeaders` or `MailPage`.

The closed criteria record requires `accountId`, `accountRevision`, `mailbox`,
`fromUid`, `toUid`; only `uidValidity` and `text` are optional. Canonical data-field
parsing rejects inherited/accessor/symbol/hidden/unknown/missing fields. UIDs use
positive canonical decimal strings at most 4294967295; the inclusive range must
be ascending. Optional fields must be omitted or valid, never explicitly
undefined/null. Optional text is nonempty printable ASCII, at most 512 characters,
for literal Subject OR From matching only. The existing fixed-command builder
validates the snapshotted frozen search command before any dialing/native access;
its temporary validation bytes are erased without being written. No body search,
raw grammar, wildcard ranges, caller endpoint or mailbox normalization is allowed.

The exact sealed enabled account/revision, installation, plugin, dual identity,
configured ASCII mailbox and independent agent `read` right gates are unchanged.
The host callback, signal, agent ID, exact request and command are captured before
awaiting. Exact-slot LOGIN and shared admission/authentication/lifetime budgets
remain in one flow. EXAMINE establishes the actual UIDVALIDITY and refuses a
supplied mismatching namespace with MAIL_STALE. SEARCH always executes against
that selected namespace; fresh discovery without an expected namespace is allowed.
Its actual session validator rejects wrong tags, malformed identifiers, duplicates,
out-of-range identifiers or more than 1024 matches, then sorts numerically.
Overflow fails rather than truncating or advancing an inferred cursor. The result
is a bounded historical observation, not a stable mailbox snapshot: messages may
vanish between SEARCH and a later exact-reference header read.

The frozen `MailHeaderSearchResult` contains only `uidValidity` and a frozen
`references` array. Each frozen reference has exactly accountId, accountRevision,
mailbox, uidValidity and uid, ready for the existing host-private header methods.
Even an empty result carries the EXAMINE namespace. No header content, search
text, endpoint, username, credentials, agent/identity/grants, timestamp, message
size, attachment count, readiness, cursor or checkpoint is projected. Only the
reference metadata is transferred; no SEARCH response text or literal is exposed.

The same lease remains active through synchronous projection, transport close
and the final live authority/deadline check. Callback revoke/disable/remove/policy
change, cancellation, persistence failure or budget overrun suppresses the result.
Existing listener/session/lease cleanup and fixed content-free errors apply to
all three modes. Header byte/display behavior and owned literal erasure remain
in the same fixed branches. Successful identifiers confer no ongoing authority;
future external publication and every subsequent read must reauthorize, including
after consumer awaits. Public pages/search DTOs, MIME body/attachments, trusted
setup/proof resolution, monitors/checkpoints, restart recovery, SDK/event/Cue and
production wiring remain unfinished. Tests are separate and have not run.

### Proposed principal and lifecycle composition

**Setup principal:** a dedicated host-owned surface with trusted sender-frame,
one-time nonce and real user gesture checks, modeled on `consent-window.ts` /
`consent-minter.ts`. Proposed main-only channels: `plugins:mail-save-account`,
`plugins:mail-test-account`, `plugins:mail-set-enabled`, `plugins:mail-set-agent-rights`,
`plugins:mail-remove-account`. Not SDK methods; no plugin guest, command args,
MCP, CLI proof, untrusted renderer or generic IPC wrapper grants access. An agent
can request that surface, but cannot act as the setup principal. Setup and tests
never return raw errors, server traces, username, endpoint or password to a plugin.
No live setup/login occurs in this playbook.

**Secret lifecycle:** use a separate native keyring entry per installation + plugin

- account under proposed service `com.maestro.mail-credentials`; do not repurpose
  the authorization anchor. Reuse the lazy KeyringEntry adapter pattern, extending a
  canonical factory rather than duplicating native loading. Password submission
  travels only from the dedicated host frame to its restricted IPC handler and
  keyring. Clear form data immediately; omit it from logging, activity, diagnostics,
  Sentry, events, SDK/IPC returns and persistence snapshots. Do not route setup
  through the usual plugin invoke-command channel or plaintext KV. Read the secret
  only inside an authorized host transport operation or exact-slot trusted setup
  availability/save confirmation, never via a `getPassword` SDK.
  Locked/unavailable/missing keyring is `MAIL_UNAVAILABLE`; no plaintext fallback.
  Production native keyring availability is unverified here; merely resolving the
  package does not establish an unlocked secure backend. JavaScript string memory
  cannot promise zeroization; minimize references and never retain protocol logs.

Account connection configuration (host, port, TLS=true, username, configured
mailboxes) belongs to host-private sealed state under userData, outside project /
Vault / plugin KV. Reuse the existing ledger sealing/freshness approach; account
and agent grants must be bound to plugin AuthIdentity and revision with tombstones.
Extend the existing authorization ledger with a validated schema migration for
these grants rather than trusting plaintext plugin `relayMailAccounts`. Corrupt,
unreadable, stale or unsupported state denies access; native seal unavailability
never creates silently trusted persistent grants. New accounts are disabled with
no agent rights. Purelymail presets and generic public IMAPS endpoints are allowed
only after explicit host setup. No STARTTLS, certificate exceptions, proxy, redirect
or automatic alternate-host discovery. Ports are explicit integers 1–65535;
normal default 993. Private/literal local hosts remain blocked by egress policy.

**Agent invocation principal:** host resolves the main-minted MCP run proof,
validates current session membership, and carries verified context as the handler's
second argument. For nested SDK calls, host mints `mailInvocationId` bound to the
live tool round-trip, plugin ID, agent ID, run expiry and sandbox generation.
A guessed/string callerAgentId or plugin-supplied context cannot mint it. Maximum
lifetime is the active invocation (also capped at 30 seconds), and at most 32
active handles per plugin. On completion/timeout/stop/crash, invalidate the handle.
Concurrent invocations never share a mutable global "current agent". Ordinary
panel/command/background calls receive no invocation authority. Without the
reviewed proof wiring, deny all agent mail content calls.

Before each network request, secret read, returned row/chunk and event publication,
check live feature flags, plugin identity/enablement/grants, account ownership /
enablement/revision, verified live agent and exact independent right (content
calls), watch generation (monitor calls), and cancellation. Recheck immediately
after every async boundary; an admission snapshot alone is insufficient.
Serialize mutation per account with canonical `createKeyedWriteQueue`, and
invalidate generation/abort work synchronously **before** awaiting a write.

Disable retains private credentials/config but cancels reads/watches and drops
pending publication. Revoke removes only selected rights but invalidates affected
in-flight work. Connection/credential edit disables account, clears rights and
requires re-consent. Remove tombstones its ID, cancels work and deletes keyring /
account/checkpoint state; failed deletion is fixed failure with a disabled tombstone
and retryable cleanup, never success. Plugin revoke/disable/identity change/crash,
feature off and uninstall close transport/watches/handles; uninstall purges owned
mail state and credentials. A failed grant/config mutation keeps affected account
stopped until successfully reconciled. Generation checks suppress late results;
already-running agents cannot have previously delivered information retracted.

### Implemented authorized complete-message source retrieval (HOST-02 split task)

`MailAccountHeaderReader.readMessageSourceBytes(reference, authority): Promise<Buffer>`
is a host-private complete-source seam in `mail-account-read.ts`, implemented and
statically checked only. The existing class name is retained for its earlier
header/search callers. This method directly selects a fixed private source mode;
it introduces no wrapper await, generic content/section argument, work callback,
transport, parser, store, queue or public API. It is not `mail.readBody`.

The same closed exact reference as header reads is required: only `accountId`,
`accountRevision`, `mailbox`, `uidValidity` and `uid`. Canonical field, revision,
ASCII mailbox and positive 32-bit UID validators reject malformed, inherited,
accessor, missing or extra fields before I/O. Validated request/command state and
the mandatory host authority callback, signal and agent ID are captured before
awaits. Authority must come from a future verified host proof/handle resolver,
including current feature, manifest/capability/broker and egress checks; neither
an agent ID nor a plugin-supplied callback is proof.

Canonical live acquisition uses the independent `detail` right for this mode,
with exact enabled account revision, installation, plugin, both identity bindings
and configured mailbox. `read` or `attachments` alone confer no source authority;
`detail` alone confers no header/search or public attachment authority. Rechecks
around async boundaries retain the original account isolation and tolerate
unrelated-account commits. Canonical disable/remove/rights/consent changes and
persistence failures abort the same lease; caller cancellation reaches the
configured transport and exact-slot LOGIN.

The shared sequence authenticates from the exact host-private credential slot,
EXAMINEs the configured mailbox with the required UIDVALIDITY, then executes only
`UID FETCH <uid> (UID BODY.PEEK[])`. The existing canonical builder/semantic
validator requires matching tagged success, exact UID, empty BODY section and
one complete literal; partial sections, wrong namespaces/UIDs, unknown extensions
and malformed/truncated responses fail. The complete source ceiling stays
`IMAP_FRAMING_LIMITS.literalBytes` (24 MiB), with the canonical 25 MiB aggregate
wire budget. The reader defensively rechecks the same literal ceiling before
transfer, while the transport bounds allocation beforehand. No truncation or
partial success is reported, and there is no numeric-part operation.

Admission through LOGIN still shares the original 10-second budget, with a
30-second total lifetime. Lease/cancellation/deadline checks cover FETCH completion
and synchronous transport close, with a final check while the lease is held
before byte transfer. Late or rejected reader-owned bytes are erased; listeners,
session and lease are cleaned on every path. Header byte/display and reference
search modes retain their independent `read` gate, fixed sections/projection and
existing limits. No MIME decoder, storage backend or transport was invoked in
this source task; tests created/run are zero.

**Ownership and publication:** successful bytes transfer only to trusted host
code and end this lease. Raw complete MIME can contain attachment bytes and must
never reach plugins, SDK/RPC, logs, events or Cue. A later bounded host MIME parser
must consume/erase the buffer, exclude attachment content from a detail-only body
projection, enforce independent attachment rights at attachment publication and
check fresh live authority at any later result boundary (especially after an
await). Already transferred bytes cannot be recalled; the recipient must erase
on success/discard/failure. Source success proves neither MIME validity nor
ongoing authorization, authentication readiness or a public body read.

MIME body/attachment parsing, projected DTOs/chunks, verified caller/setup,
production lifecycle/recovery/cleanup, SDK/RPC, monitors/checkpoints/dedupe,
events/Cue and production wiring remain unavailable. This seam is not mock-tested
or production-tested; the broader lifecycle and all test tasks remain unchecked.

## TLS transport and bounded grammar

### Implemented framing foundation (HOST-02 split task)

`src/main/plugins/mail-imap-framing.ts` exports `ImapResponseDecoder`,
`ImapResponseFrame`, `ImapFramingError` and `IMAP_FRAMING_LIMITS`. This is an
internal host module, unconnected to production, RPC or the SDK; host/SDK versions
are unchanged. It is source-implemented and statically checked only, with no
mock or production tests yet. Its byte framing follows RFC 3501 sections 4 and 9
(https://www.rfc-editor.org/rfc/rfc3501).

`push(Buffer)` consumes arbitrary chunks and returns complete framing records.
`finish()` closes the decoder and rejects EOF inside a line, literal or unfinished
FETCH. `dispose()` cancels permanently, clears owned pending byte buffers and
releases pending parts. Failure yields no frames from the failing chunk, clears
pending state and rejects reuse. Previously returned frames remain owned by the
host consumer, which must discard/erase them on operation failure; no result may
be published before matching tagged success and live authorization.

Supported subset: ASCII CRLF framing; tagged alphanumeric tags of 1-32 characters
with OK/NO/BAD; untagged OK/NO/BAD/BYE; numeric EXISTS/RECENT; SEARCH positive
32-bit UID lists; FLAGS with restricted flag atoms (optional backslash followed
by 1-64 alphanumeric/underscore/dot/hyphen characters); and FETCH with a positive
32-bit sequence number and one balanced parenthesized structure. FETCH supports
nested lists, quoted strings with quote/backslash escapes, and trailing decimal
`{n}` markers followed by exactly n opaque bytes, including zero-length literals.
Literal contents are never interpreted as framing. Status text is opaque and
never treated as literal/quoted/list data. Unsupported untagged responses
(including PREAUTH, CAPABILITY and EXPUNGE), continuations, non-ASCII/control line
bytes, literal+/literal8 extensions, malformed escapes and incomplete structures
fail closed. This restrictive subset can reject otherwise valid server responses;
expand it only with explicit bounded grammar and later tests.

Hard ceilings per decoder/session: 64 KiB per non-literal line including CRLF,
24 MiB per literal, 25 MiB aggregate wire input (message source plus overhead),
256 complete responses, 16 literals per FETCH and nesting depth 16. Host-only
constructor overrides can tighten these ceilings. The decoder charges input
before processing and checks announced literal allocation against the remaining
wire budget at that marker's actual position, independent of chunk grouping.
Errors contain only fixed MAIL_PROTOCOL/MAIL_LIMIT/MAIL_CANCELED codes/messages;
no peer response/cause/logging or credentials are attached.

`setLiteralLimit(bytes)` changes the current operation's literal ceiling at an
empty response boundary only, preserving the constructor ceiling and cumulative
wire/count budgets. Zero forbids nonempty literals for greeting/status operations.
Invalid limits or pending partial framing poison and clear the decoder.

These are framing records, **not semantically validated mail results**. The fixed
validator and async session below implement restricted FETCH/UID/UIDVALIDITY,
tag semantics, login/lifetime deadlines and concurrency. General FETCH attributes,
production account reauthorization/cancellation wiring, bounded MIME and safe
metadata projection remain separate unchecked work. This decoder opens no socket,
creates no timer, sends no command, retrieves no secret and emits no event/agent work.

### Implemented configured-account TLS foundation (HOST-02 split task)

`src/main/plugins/mail-imap-connection.ts` exports host-internal
`openConfiguredImapConnection(accountId, deps, options?)`, endpoint/dependency/
connection types, `ImapConnectionError` and `IMAP_CONNECTION_LIMITS`. Nothing
imports it into production, RPC or the SDK. Source and static checks only;
no fake transport or real server was exercised. No account configuration store,
credential storage, grants or publication are implemented here. The source-only
session extension below now composes fixed commands into this connection.

Trusted host `getEndpoint(accountId)` selects a copied endpoint; absent accounts
deny. The future account service must return null for disabled/corrupt configuration
and authorize before opening and after every async read. Endpoints require
`tls: true`, ASCII DNS labels (63 characters each, 253 total), port 993 or an
explicit host-configured `allowNonstandardPort: true` for another integer port.
Caller URLs/hosts/ports and extra TLS properties are never accepted. Literal IPs
and URL-normalized numeric aliases are rejected, closing Node's lookup-bypass
path; this initial implementation deliberately supports DNS names only.

An internal HTTPS URL feeds `createEgressGuard.assertUrlAllowed`. Its validating
lookup is installed on the actual `tls.connect`, checks the configured hostname
and live blocked ports, rejects any unsafe DNS candidate and returns no address
after terminal cancellation/timeout. No dispatcher or unguarded resolver fallback.
TLS uses `rejectUnauthorized: true`, configured DNS SNI and
`tls.checkServerIdentity(configuredHost, cert)`, TLS 1.2 minimum, and no custom CA,
proxy, redirect or certificate exceptions. Node's supported options are documented
at https://nodejs.org/api/tls.html#tlsconnectoptions-callback.

Deadlines are tighten-only: 10 seconds for admission DNS, TLS, greeting and LOGIN and
30 seconds total connection lifetime, starting before DNS. AbortSignal remains
attached after handshake; it destroys the socket immediately and suppresses late
DNS success. Native DNS promises cannot themselves be canceled; their late results
are ignored and can never establish a connection. Owned timers/abort/read listeners
and decoder state are disposed on close/error/EOF/cancel; the error listener drains
pending socket errors until close and is then removed.

The frozen internal seam now offers `execute(FixedImapCommand, expectedUidValidity?)`,
`assertActive()` and `close()`; raw receive/socket/write access is absent. Paused
readable mode with a 64 KiB high-water mark supplies backpressure. One decoder owns
the whole session's framing budget. EOF inside pending framing yields MAIL_PROTOCOL;
ordinary clean EOF yields MAIL_UNAVAILABLE. Buffered LOGOUT completion is preserved
for required BYE/tag validation before terminal cleanup. Native errors and abort
reasons are discarded in favor of fixed errors. The implemented session below
provides command state/deadlines/concurrency and required host authorization seams;
their production account/grant wiring remains absent.

### Implemented synchronous fixed-command validation (HOST-02 split task)

`src/main/plugins/mail-imap-commands.ts` exports `prepareImapCommand`,
`validateImapCommandResult`, `FixedImapCommand`, `PreparedImapCommand`,
`ImapCommandResult` and `IMAP_COMMAND_LIMITS`. It reuses framing records and
`ImapConnectionError`; the connection error catalog now also includes the already
proposed fixed `MAIL_STALE` message. These are host-internal synchronous functions,
not SDK/RPC methods. Source/static checks only; no runtime assertion or server
contact. Protocol semantics reference RFC 3501 sections 6 and 7 at
https://www.rfc-editor.org/rfc/rfc3501.

The builder accepts a closed discriminated command shape and host-generated tags
`A1` through `A999999`. Unknown kinds/extra enumerable fields fail `MAIL_INVALID`.
All string inputs are printable ASCII; quote/backslash escaping prevents command
injection, and controls/Unicode are refused. LOGIN accepts a nonempty username
up to 256 characters and a password up to 1024 (empty allowed). The returned wire
buffer necessarily contains credentials for LOGIN; it is host-private, must never
be logged/returned/persisted, and its future writer must erase it immediately
following write completion/failure, as the session writer now does. No credential fields or original input object
are retained in the frozen command descriptor. JavaScript temporary strings
cannot promise zeroization. This module retrieves no actual credential.

EXAMINE accepts a nonempty ASCII mailbox up to 256 characters, with literal `&`
encoded as modified UTF-7 `&-`; full Unicode mailbox encoding is unsupported.
SEARCH accepts inclusive canonical positive decimal UID endpoints up to
4294967295, never `*` or arbitrary search grammar. Optional literal text (1-512
ASCII characters) searches Subject OR From header substrings. FETCH accepts one
exact UID and either the fixed HEADER.FIELDS allowlist, complete source (`[]`),
or a numeric MIME part path (1-999 per component, at most 16 components). Every
fetch uses `BODY.PEEK`; NOOP and LOGOUT are the only remaining kinds. No SELECT,
STORE, APPEND, arbitrary command/section/raw write or generic socket API.

The validator consumes complete records from the real framing decoder and the
unchanged prepared descriptor. The last record must be the exact matching tag
with OK; NO/BAD map to content-free MAIL_UNAVAILABLE. Earlier tagged records,
missing completion and unsupported responses fail closed. Status response codes
are limited to ALERT, plus EXAMINE's READ-ONLY, UIDVALIDITY, UIDNEXT, UNSEEN and
restricted PERMANENTFLAGS. Other codes/extensions (including CAPABILITY and
UIDNOTSTICKY) reject. EXAMINE requires exactly one FLAGS/EXISTS/RECENT record,
one valid untagged UIDVALIDITY and final tagged READ-ONLY. UIDVALIDITY changes
outside EXAMINE reject; matching a caller's prior namespace remains session work.

SEARCH requires one response, at most 1024 unique in-range UIDs, and returns them
sorted ascending; overflow fails without a partial page. Pagination remains
account-service work. FETCH requires exactly UID plus the exact requested BODY
section, in either attribute order, and one decimal literal of its stated length.
Additional attributes/FLAGS, NIL/quoted contents, partial origin suffixes, different
sections, duplicate responses and wrong UIDs reject. Successful empty FETCH data
is MAIL_STALE. Headers are capped at 64 KiB, raw part bytes at 8 MiB and complete
source at the framing 24 MiB ceiling. NOOP allows only EXISTS/RECENT data; LOGOUT
requires untagged BYE plus tagged OK. No peer status text enters results/errors.

Validation failure uses exported `eraseImapFrameLiterals` to erase every input
literal; connection/session cleanup reuses it. Successful FETCH transfers its
one buffer to the host caller; buffers must still be erased if any later grant
or projection check fails. Frames/command descriptors are internal typed inputs,
not an RPC parser. The session below implements allocation bounds, completion
collection, greeting/state/deadlines/concurrency and a mandatory authorization seam.
Metadata attributes (INTERNALDATE/RFC822.SIZE/BODYSTRUCTURE), MIME interpretation,
header projection, decoded content bounds and attachment manifests remain
unimplemented; no raw content can yet be published to a plugin or Cue event.

### Authored fixed-command tests (HOST-02 test-creation split, 2026-10-07)

`src/__tests__/main/plugins/mail-imap-commands.test.ts` adds 497 lines,
19 declarations and 121 statically counted parameterized cases using actual fixed
commands, canonical UID/quoted-string validators, semantic validation, literal
erasure and the real framing decoder. Synthetic complete wire fixtures cover
closed read-only command construction, exact tags/ASCII/escaping/bounds, fixed
header allowlist, numeric ranges/part paths; exact tagged completion/status codes,
READ-ONLY EXAMINE namespace, unique bounded sorted SEARCH, exact UID/BODY section
and attribute order, empty/binary literal ownership, hard header/part/source
boundaries, LOGIN/NOOP/LOGOUT rules and erasure of all literals on semantic failure.
The decoder is not mocked: malformed internal frame-length/count cases are explicitly
identified defensive checks on typed records, not accepted malformed wire.

**Tests authored only, 0 executed.** Strict static type, formatting and configured
test ESLint checks do not prove runtime protocol/security acceptance. No source
change, socket, credential, store, provider or mail login was invoked. Account,
TLS/session/lifecycle/publication/SDK/Cue acceptance remains separately unfinished;
full suite execution remains HOST-05. Receipt root:
`.maestro/verification/host-02-imap-command-tests/`.

### Implemented bounded async session (HOST-02 fixed-operation task)

`mail-imap-connection.ts` now exports `runConfiguredImapSession(accountId, deps,
steps, options?)`, `ImapSessionStep` and `IMAP_SESSION_LIMITS`. Each host-only step
contains a `FixedImapCommand` and optional `expectedUidValidity`; no prepared bytes,
URL, socket or arbitrary command string can enter the writer. Results are internal
status/UID/FETCH byte records, not plugin DTOs or decoded MIME. Nothing is wired to
production, SDK/RPC, native secrets, events or Cue. Source/static checks only;
mock-tested and production-tested status are both false.

The runner executes 1-64 steps sequentially and closes in finally on success or
failure. Any failure erases all previously collected FETCH results. The connection
admits one session per exact account and four per host-bound plugin ID, including
DNS/TLS/login time. Overlap rejects MAIL_LIMIT with no queue; terminal cleanup
releases slots synchronously. The frozen connection is an internal incremental
seam; a direct host caller must close it in finally and erase already-transferred
FETCH bytes on subsequent failure. It admits one pending command and uses private
ascending tags A1-A64. There is no parallel command pipeline or dispatch engine.

Admission requires `deps.pluginId`, `getEndpoint` and synchronous `assertActive`
with no permissive authorization default. Checks occur before admission/dial,
after DNS, before write and around async write/read/result boundaries. The future
account service must bind these dependencies to verified ownership/rights and a
live generation, and supply its cancellation signal. These are required seams,
not an implemented grant ledger or identity proof. Revocation/disable/remove
production wiring remains unchecked.

Only one untagged OK greeting is accepted (opaque text or ALERT code); PREAUTH,
CAPABILITY, continuations and extra/coalesced/partial greeting records reject.
LOGIN is mandatory and allowed once. Other commands require authentication.
EXAMINE records UIDVALIDITY, optionally requiring an existing namespace; SEARCH
and FETCH require its exact current UIDVALIDITY and a prior successful EXAMINE.
All commands use the existing closed builder/semantic validator, including
READ-ONLY and BODY.PEEK rules. Wrong tags, complete or partial trailing records,
unsupported attributes and malformed/truncated data fail closed. LOGOUT must be
last in a runner plan and requires BYE plus matching tagged success.

The admission timer now survives TLS/greeting until validated LOGIN success:
10 seconds total, tighten-only. The 30-second session lifetime also starts before
DNS. Monotonic elapsed checks at authorization boundaries supplement these timers.
Socket destruction rejects pending reader/write waits; late DNS/write callbacks
cannot reopen or publish a canceled result. Existing connection timers, TLS egress
pinning and cancellation are reused. HTTP `fetchWithTimeout`, process idle
watchdogs and queued fan-out helpers do not supervise this fixed TLS exchange.

Before each operation, the same decoder tightens its literal ceiling to zero for
status commands, 64 KiB headers, 8 MiB raw part or 24 MiB source, preserving the
25 MiB wire/256-response budget across the entire session. Consumer literals are
owned synchronously before EOF/cancel can interleave. Prepared command buffers
are erased after the socket write callback, or after destruction on failure;
JavaScript credential strings cannot promise zeroization and must never be logged.
No credential getter or actual secret read is implemented. MIME/header projection,
decoded content bounds, attachment manifests, watches, queues, metadata events and
production authorization/SDK/Cue integration remain later tasks. The 30-second
bound currently covers the transport plan; later MIME work must share the same
operation budget rather than starting a new independent deadline.

### Implemented host-private MIME transfer-byte decoding (HOST-02 prerequisite)

`mail-transfer-decoding.ts` exports `consumeMailTransferBytes(bytes, encoding,
maxDecodedBytes)`, `decodeMailBase64(payload, maxDecodedBytes)` and frozen
`MAIL_TRANSFER_LIMITS`. These are synchronous host-private byte helpers, with no
MIME headers/structure/charset/body/attachment DTO, reader integration or public
SDK/RPC/event/Cue/setup/caller path. Implemented and statically checked only;
no runtime/mock/production tests or acceptance. The restricted grammar follows
RFC 2045 sections 2.7/2.8/6.7/6.8 at
https://www.rfc-editor.org/rfc/rfc2045. Deliberate strict refusals below are a subset,
not a general interoperable MIME parser or recovery decoder.

The consuming entry requires an owned complete Buffer, an exact case-insensitive
encoding token and an explicit positive safe-integer decoded cap <=8 MiB; it has
no permissive default. Invalid host arguments use MAIL_INVALID. Input is bounded
by the canonical 24 MiB literal ceiling; oversized input/output/physical lines
use MAIL_LIMIT before decoded allocation. Unsupported or malformed wire encodings
use MAIL_PROTOCOL. All errors are content-free and carry no original exception.
Empty parts are supported; successful output is a distinct host-owned Buffer.

- `7bit` and `8bit` preserve bytes, require exact CRLF for present line breaks,
  reject NUL/bare LF/CR and lines over 998 bytes; 7bit additionally rejects high
  bytes. An unterminated final line is accepted. This is byte validation, not
  Unicode/text safety: later charset/text checks must still run.
- `base64` accepts standard alphabet/padding with nonempty physical lines <=76
  bytes and optional CRLF, including one terminal CRLF. Empty input is valid;
  whitespace/blank lines, URL alphabet, junk, misplaced/excess/missing padding,
  incomplete quanta and nonzero pad bits reject. Bound encoded character count
  before string construction, then validate exact decoded size and every character
  before Node allocation. No large repeated regex or whole-output round-trip copy.
  `decodeMailBase64` is the shared no-whitespace core; the existing RFC 2047 header
  B-word branch now uses it, retaining its 75-byte word, nonempty payload, strict
  charset/control/output checks and finally erasure. Header Q decoding is unchanged.
- `quoted-printable` validates/counts in a first linear pass and fills an exact
  bounded allocation in a second pass. Uppercase `=HH` escapes decode any byte;
  printable ASCII and internal SP/HTAB remain, hard CRLF remains and `=CRLF`
  soft breaks disappear. Literal underscores remain literal. Reject raw controls/
  high bytes, lowercase/incomplete/invalid escapes, bare LF/CR, raw trailing
  whitespace at a hard line end or EOF, terminal dangling soft breaks and physical
  lines over 76 bytes. A final ordinary line may lack CRLF. No repair, whitespace
  stripping or truncation fallback.

Owned encoded input is erased in finally on every success/error path, and any
allocated rejected output is erased. Callers must own every alias and erase
successful output after use. Temporary JavaScript base64 strings cannot be
zeroized; results and errors must not be logged or persisted. The standalone core
accepts a string whose lifetime remains the trusted caller's responsibility.

This helper confers no account/agent/attachment rights and enforces neither the
message aggregate nor a wall-clock budget. Later actual MIME parsing must identify
complete parts under depth/count/raw limits, enforce the 256 KiB decoded body /
8 MiB attachment /16 MiB aggregate bounds, decode supported charsets and separate
attachment contents from detail projections. Authorized composition must keep the
live lease and original operation deadline through decoding, transport close and
final checks, erase all discarded bytes and freshly authorize later publication.
No body or attachment read acceptance is claimed by the complete-source or
transfer-byte seams alone. MIME structure/body projection, manifests and integration
require separate bounded source tasks and separate tests before production wiring.

### Implemented host-private plain-text charset decoding (HOST-02 prerequisite)

`mail-text-decoding.ts` exports `consumeMailPlainText(bytes, charset,
maxTextBytes)`, shared non-consuming `decodeMailCharsetBytes(bytes, charset,
maxTextBytes)`, `assertMailTextCharacters(text, mode)` and frozen
`MAIL_TEXT_LIMITS.plainTextBytes` (256 KiB). Implemented and statically checked
only; no runtime/mock/production acceptance. This is charset/character policy for
an already-transfer-decoded complete part, not MIME structure/body projection.
The existing header projector now composes the shared charset/character helpers;
its RFC 2047 B/Q grammar, true Latin-1 mapping, display limits, fixed field list
and consumed/temporary-buffer erasure remain unchanged.

The plain consumer requires an owned Buffer, explicit exact case-insensitive
UTF-8 or US-ASCII token and a positive safe-integer tighten-only UTF-8 output cap
<=256 KiB. There is no charset guessing, alias, missing-charset or Latin-1 body
fallback. Invalid argument shapes/caps use MAIL_INVALID; input/output overflow
uses MAIL_LIMIT; unsupported/malformed text uses MAIL_PROTOCOL, with no peer
content, original exception or partial success. Empty text is supported.

Input length is checked before string construction. Fatal UTF-8 decoding preserves
BOM for refusal and rejects incomplete/overlong/surrogate/out-of-range sequences;
accepted UTF-8 has exactly the same UTF-8 output byte count as input. ASCII rejects
high bytes before decoding and likewise preserves byte count. The bounded shared
core additionally accepts true ISO-8859-1 for existing header use only; it counts
high-byte UTF-8 expansion against the requested cap before constructing the string.
Core input and charset token checks are closed; unsupported tokens reject.

Plain text permits HTAB and exact CRLF pairs, preserving spaces, blank lines,
line endings and a final ordinary line without trimming or normalization. Bare
CR/LF, other Unicode Cc/Cf/Cs/Zl/Zp characters, BOM and bidi/formatting controls
reject. Unicode content is never replaced, transliterated or normalized. This
strict character subset excludes some otherwise valid text. RFC 2046 section
4.1.1 supplies canonical CRLF semantics; RFC 3629 sections 3/4 describe valid
UTF-8: https://www.rfc-editor.org/rfc/rfc2046 and
https://www.rfc-editor.org/rfc/rfc3629. Explicit host arguments deliberately do
not implement MIME missing-charset defaults or Content-Type parsing.

The consumer erases owned bytes in finally on success/failure. The shared charset
core does not consume: its trusted caller owns all aliases and must erase them,
as the existing header projector does. Strings and temporary character-check
strings cannot be zeroized. Returned text is untrusted literal text, with no
HTML/Markdown rendering or sanitization guarantee, sender proof or media-type/
disposition inference. Never log/persist raw text or publish it in events.

Future MIME parsing must validate complete text/plain media type/disposition,
exclude attachments from detail output, enforce structure/part/aggregate limits
and compose transfer decoding before this consumer. Authorized integration must
retain the original independent detail lease and operation deadline through
parsing, decoding, close and final checks, then freshly authorize any later
publication. This pure synchronous seam has no account, caller, grant, cancellation
or time authority. No body/attachment DTO, reader integration, setup/proof,
SDK/RPC/event/Cue/watch/checkpoint or production path was added; full lifecycle
and all runtime tests remain separate and unfinished.

### Implemented host-private MIME header descriptors (HOST-02 prerequisite)

`mail-mime-headers.ts` exports `consumeMailMimeHeaders(bytes)` and the frozen
`MAIL_MIME_HEADER_LIMITS` (three parameters per structured field, 128 ASCII
filename bytes, 70 boundary bytes). Its immutable closed host-private descriptor
contains only `mimeType`, `transferEncoding` and applicable `charset`, `boundary`,
`disposition`, `filename`. Implemented and statically checked only; no runtime,
mock or production acceptance. It consumes a complete owned ASCII header-only
block including the terminating empty CRLF line, never a complete message source.
The caller must split headers from content in a later bounded MIME structure task.

`mail-header-fields.ts` extracts the existing display projector's syntax scanner:
64 KiB block, 998 bytes per physical line, 256 lines including terminator,
8192 bytes per unfolded field. Exact CRLF, ASCII printable bytes/HTAB, valid
nonempty field names, folding only after a field and final terminator with no
body suffix are mandatory. Unfolding removes only CRLF. Limits precede field
concatenation; complete input is bounded before strings are constructed. Selected
fields reject case-insensitive duplicates. Ordinary fields are validated and
discarded in MIME mode, including permitted repeated Received fields, with the
same folded-field limits. MIME mode selects only MIME-Version, Content-Type,
Content-Transfer-Encoding and Content-Disposition and rejects all other Content-\*
fields (including Content-ID/Description/Location) as unsupported. The scanner
is non-consuming with a trusted host selector; both consuming projections own
error normalization and input erasure. Its temporary Map/strings remain private.

The existing display projector composes this one scanner with its unchanged fixed
IMAP field allowlist, rejecting every unknown/duplicate field. Its RFC 2047 B/Q,
charset/character/output rules, subject/sender projection and erasure remain
unchanged by static source comparison; regression tests are deferred.

Restricted structured grammar follows RFC 2045 sections 4/5/6, RFC 2046 sections
4.1.2/5.1.1 and RFC 2183 section 2:
https://www.rfc-editor.org/rfc/rfc2045,
https://www.rfc-editor.org/rfc/rfc2046,
https://www.rfc-editor.org/rfc/rfc2183. This is a deliberately narrow subset,
not general MIME conformance or repair. It accepts ASCII tokens and bounded quoted
parameter values, SP/HTAB around delimiters and only quote/backslash quoted pairs.
Comments, empty parameter values, malformed quoting, unknown/duplicate/extended
parameters, RFC 2231 continuations/charset syntax and RFC 2047 parameter words
are refused. Token case is normalized only where the protocol permits it;
filename and boundary values remain exact.

Explicit Content-Type is required, with no missing-type fallback. Supported types
are text/plain, multipart/mixed, multipart/alternative, application/pdf and
image/png, image/jpeg, image/gif, image/webp. HTML, message/\* and all other types
reject, including HTML children of alternative containers; recognizing a container
is not traversal/selection. Text/plain accepts only charset and optional name;
charset is exact case-insensitive UTF-8/US-ASCII, defaulting to US-ASCII when
absent. Other leaves accept only name. Multipart accepts only required boundary,
with exact RFC 2046 bchars, 1-70 ASCII bytes and no trailing space. Its declared
encoding must be 7bit/8bit, and multipart disposition/name is unsupported.

Content-Transfer-Encoding accepts exact case-insensitive 7bit, 8bit, base64 or
quoted-printable with surrounding SP/HTAB; absence defaults to 7bit. These header
defaults do not change the existing byte/text consumers' explicit-argument rules.
No transfer/text consumer or payload validation is invoked here. MIME-Version is
optional for part headers; when present it must be exactly 1.0 with surrounding
SP/HTAB only. This descriptor does not prove top-level MIME conformance; future
source traversal must separately enforce its root-version policy.

Leaf disposition, if present, is inline/attachment with only optional filename.
Filename/name labels are 1-128 printable ASCII bytes without outer whitespace,
slash/backslash/colon or Windows punctuation, dot/dot-dot names, trailing dot or
encoded words; unequal name/filename aliases reject. Values are untrusted labels,
never filesystem-safe paths or saving authority (reserved platform names and
collisions require separate destination rules). No encoded/percent decoding,
normalization or silent sanitization occurs. Future detail selection must exclude
attachment disposition or any named leaf even if text/plain/inline. Nontext leaf
support is classification only, never proof of valid image/PDF bytes or an
attachment manifest, count, size, part ID or attachment grant.

All consumed buffer bytes are erased in finally on success/failure. Invalid input
shape uses MAIL_INVALID, byte/count/field/boundary/filename overflow MAIL_LIMIT,
malformed/unsupported grammar MAIL_PROTOCOL; errors contain no peer content or
original cause. JavaScript strings cannot be erased or recalled; callers own all
aliases and must not log/persist raw headers/descriptors or forward them as arbitrary
event payloads. The syntax core has no account, right, cancellation or deadline.
Future integration must retain the original independent detail/attachments lease
and operation deadline through source splitting, bounded traversal/selection,
aggregate checks, decoding, close and final checks, then reauthorize any later
publication. No source splitting/traversal, body/attachment DTO, reader/SDK/RPC,
setup/caller proof, event/Cue/watch/checkpoint or production path was added. Full
lifecycle and all runtime tests remain separate unfinished tasks.

### Implemented host-private complete MIME traversal (HOST-02 prerequisite)

`mail-mime-structure.ts` exports `consumeMailMimeSource(bytes)` and frozen
`MAIL_MIME_STRUCTURE_LIMITS`. This synchronous consuming seam returns a closed
host-private `MailMimePart` tree: frozen `kind`/`headers` shells, frozen ordered
`children` for multipart nodes, and distinct owned mutable `encodedBytes` Buffers
for leaves. It is implemented and statically checked only; no runtime/mock or
production acceptance. No public part identifier, attachment manifest, body DTO
or authority is inferred from node order, media type, encoding or labels.

A complete owned Buffer is required, bounded by the canonical 24 MiB IMAP literal
ceiling before traversal or payload allocation. Each entity's exact CRLF header
terminator is searched only within its first 64 KiB. The existing consuming MIME
header descriptor scans a bounded copy, so no new header grammar or charset/label
parser exists. `consumeMailMimeHeaders(bytes, requireMimeVersion = false)` gains
an optional trusted boolean root policy: traversal requires MIME-Version 1.0 at
the root; the default preserves optional part-version behavior. Invalid boolean
shapes reject. Existing supported media/parameter/encoding/disposition rules
apply to every child, including all alternatives; no unsupported HTML is skipped.

Traversal handles only explicit multipart/mixed and multipart/alternative plus
the descriptor's supported leaves. It requires at least one complete child per
container and a matching final close; no truncated result or repair is returned.
Boundaries are exact and case-sensitive; any equal or prefix-related ancestor
boundary is refused. Delimiter suffix junk, padding, preambles and epilogues,
even whitespace, are unsupported. An opening delimiter must be followed by CRLF;
a closing delimiter must end the entity at EOF or after one exact CRLF. The CRLF
immediately preceding a delimiter belongs to the delimiter, so leaf payloads do
not acquire that framing. A final payload CRLF requires a separate preceding CRLF;
an empty child body requires its full header terminator plus the delimiter's own
CRLF. A nested final close can end at its parent-owned framing CRLF. Header/body
and delimiter ownership follow the structure described in RFC 2045 sections 2/4
and RFC 2046 section 5.1.1; this deliberately stricter subset is not general MIME
conformance: https://www.rfc-editor.org/rfc/rfc2045 and
https://www.rfc-editor.org/rfc/rfc2046.

Hard bounds: depth 16 with root depth one and leaves counted; 64 total nodes;
32 leaves; 256 KiB aggregate header bytes; 24 MiB aggregate encoded leaf bytes.
Traversal charges each visited entity's complete span against a 384 MiB work
budget before searching; this bounds repeated nested range scans, not elapsed
time or an exact count of native byte comparisons. Boundary searches stay within
the current entity and monotonically advance. Full structural validation precedes
all leaf allocation, then disjoint ranges are copied into owned Buffers. All source
bytes, header copies and boundary marker bytes are erased on success/failure;
allocated leaves are also erased if materialization fails. Successful leaves
remain the trusted caller's responsibility, including aliases and abandoned trees.
Frozen shells do not make Buffer contents immutable; strings cannot be zeroized
or recalled. Never persist/log or forward this tree through SDK/events.

Invalid input uses MAIL_INVALID; source/depth/node/leaf/header/work/aggregate
limits use MAIL_LIMIT; malformed/unsupported structure uses MAIL_PROTOCOL.
All errors are recreated without peer content or original cause. Leaf bytes are
still encoded and unvalidated; even the container's declared 7bit/8bit token is
classification, not proof of payload byte validity. Transfer/text consumers are
not invoked. Future selection must exclude named/attachment-marked text, define
mixed/alternative selection, validate encodings and actual image/PDF content,
enforce decoded body/attachment/manifest/count/aggregate budgets and account for
all owned encoded and decoded snapshots. This pure synchronous seam has no live
account, independent right, caller, cancellation or deadline. Authorized integration
must retain the original detail/attachments lease and deadline through traversal,
selection, decoding, cleanup, close and final checks, then freshly authorize later
publication. Reader integration, body/attachment DTOs, setup/caller proof, lifecycle,
SDK/RPC/event/Cue/watch/checkpoint and runtime tests remain separate unfinished tasks.

### Implemented host-private MIME content composition (HOST-02 prerequisite)

`src/main/plugins/mail-mime-content.ts` adds `consumeMailMimeContent(bytes)`,
`MailMimeContent`, `MailMimeBodyContent`, `MailMimeAttachmentContent` and
`MAIL_MIME_CONTENT_LIMITS`. These are synchronous host-private source interfaces,
implemented/static-checked only. The pure module has no authority or I/O; the
body-only reader composition below is also static-checked only. No mock/production
acceptance, public SDK/DTO/RPC/chunk/snapshot cache or event/Cue path.

The consumer takes complete owned source, calls the actual structure parser and
transfer decoder for every leaf, and calls the actual strict UTF-8/US-ASCII plain
consumer for body candidates. No result/parser replacement or partial fallback.
Every named leaf, attachment-disposition leaf and nontext leaf is an attachment,
including inline named text and unnamed inline images. Only unnamed text/plain
without attachment disposition can supply body. Text attachments remain opaque
transfer-decoded bytes: their charset/characters are not interpreted as body.

Mixed containers permit zero or one body-producing child; multiple independent
bodies fail rather than concatenate or discard text. Alternatives require every
child to produce a complete body without attachments, then select the last one.
Every discarded body is validated and charged. The last-choice policy follows
[RFC 2046 section 5.1.4](https://www.rfc-editor.org/rfc/rfc2046#section-5.1.4),
with explicitly stricter refusal of unsupported alternatives rather than fallback.
Nested mixed/alternative containers compose the same rules. Complete empty body
is `{ mimeType: 'text/plain', text: '', sizeBytes: 0 }`; attachment-only messages
omit `body`. A future public readBody must define absent-body refusal; this is no
empty-body inference or public readBody acceptance.

Limits before decoded allocation: **256 KiB total body candidates**, including
all nonselected alternatives; **16 attachment leaves**, **8 MiB each**, **16 MiB
attachment aggregate**. Transfer decoding receives the lesser per-part/remaining
budget; plain text receives the remaining body budget before string construction.
At an exhausted aggregate only empty encoded leaves may continue. Existing 24 MiB
source/encoded-copy, depth/node/leaf/header/scan bounds remain unchanged. Complete
sizes count decoded bytes (UTF-8 bytes for body), not base64 wire characters or
JavaScript UTF-16 code units. No truncated content success. Total retained decoded
attachment bytes plus body-candidate bytes cannot exceed 16 MiB + 256 KiB; source
and encoded snapshots have their separate preexisting 24 MiB caps.

Returned body/attachment/result shells and arrays are frozen closed records.
Attachment fields are exactly `partId`, `filename`, `mimeType`, `sizeBytes`,
`bytes`; physical numeric paths are one-based (`1`, `2`, `1.1`, ...), with root
leaf `1`. Paths are private source positions, not opaque public handles or
account/reference/IMAP-fetch authority. Parsed safe labels are retained; missing
filename uses fixed `attachment`. Labels remain untrusted display text, never
paths. MIME labels are sender declarations under the existing allowlist, **not
magic/signature/file-format verification or safe rendering/execution proof**.
No binary format parser, repair, sniffing, automatic file open or HTML conversion.

Source and every encoded leaf are erased on success/failure. Temporary decoded
body bytes and all decoded attachment allocations on failure are erased. Successful
attachments transfer distinct mutable Buffer ownership to trusted host code, which
must erase all on use/abandonment; frozen shells do not freeze bytes. JavaScript
body/parameter/base64 strings cannot be erased or recalled. All errors are recreated
fixed MAIL_INVALID/LIMIT/PROTOCOL without original cause/content. This consuming
seam accepts source, not externally supplied tree shells or arbitrary part IDs.

The pure consumer cannot prove account/plugin/verified caller or independent
rights, enforce elapsed deadlines, cancel synchronous work, or authorize result
publication. Future integration must keep the original detail/attachments lease,
operation deadline and live context through parsing/decoding/cleanup/final checks;
reauthorize body, manifest and each chunk at its own publication boundary. Never
return this mixed private result to a detail-only caller: its attachment Buffers
must remain private and be erased. Manifest projection and invocation-bound bounded
chunk snapshots require separate independent-attachment authority and lifecycle.
The body-only reader composition below does not provide manifest/chunk access.
Public acceptance, trusted setup/caller, attachment reader composition, lifecycle
recovery, SDK/events/Cue and all focused runtime tests remain unfinished.

### Implemented host-private authorized plain-text body read (HOST-02 prerequisite)

`MailAccountHeaderReader.readMessageBody(reference, caller)` in
`src/main/plugins/mail-account-read.ts` returns
`Promise<Readonly<Pick<MailMimeContent, 'body'>>>`. It reuses the actual
`consumeMailMimeContent` and `MailMimeBodyContent` type, without a second parser
or arbitrary projector callback. This is an unwired host-private source method,
implemented/static-checked only; not the proposed public `mail.readBody`, SDK DTO,
RPC, body snapshot/cache, trusted caller proof or production account service.

The exact closed reference remains `accountId`, `accountRevision`, `mailbox`,
`uidValidity`, `uid`, captured before I/O. Mandatory captured caller agent, signal
and live host authority callback remain required. Enabled account, installation,
plugin/dual identity, revision, configured mailbox, namespace and exact UID checks
are shared with complete-source reads. **Independent detail rights** are required;
read-only or attachments-only policy does not admit body mode. That callback is
still a future trusted host obligation, never proof from caller-supplied arguments.

Fixed exact-slot LOGIN, READ-ONLY EXAMINE and UID BODY.PEEK[] fetch stay inside
one existing account activity lease. Body mode never calls the raw source method
and reacquires authority afterwards. Original admission time supplies the unchanged
10s authentication and 30s lifetime budgets; synchronous MIME composition,
attachment cleanup and session close remain inside that same lease/budget.
Authority is checked after literal ownership and immediately before composition,
after composition/attachment erasure, and after synchronous close before transfer.
Canonical revoke/disable/remove/policy/persistence invalidation and caller abort
close the connection and erase reader-owned source; final checks refuse late output.
Synchronous parsing cannot be interrupted by a queued timer while it runs: bounded
work is followed by elapsed-time checks, never a fresh parsing deadline.

The actual structure/transfer/text composition validates the whole supported MIME
source, including attachment leaves and discarded alternatives. Existing limits
remain: 24 MiB source/literal, 25 MiB aggregate wire, bounded structure/header/work,
256 KiB aggregate UTF-8 body candidates, 16 attachments, 8 MiB each and 16 MiB
aggregate before decoded allocation. Malformed/unsupported/truncated/oversized MIME
or text fails without partial body, raw source or header fallback. Detail-only work
internally validates/decodes attachments for complete-message acceptance, but every
successful decoded attachment Buffer is erased in a finally block **before** any
subsequent authority callback, close or result transfer; the consumer erases failed
attachment allocations. This does not grant attachment access or public MIME proof.

The result is a frozen closed `{ body }` or `{}`; body is the existing frozen
`{ mimeType: 'text/plain', text, sizeBytes }`, with complete decoded UTF-8 byte size.
Absent body differs from complete empty text. Named/attachment-marked text and
nontext content never become body; attachment descriptors, counts, filenames,
part IDs and bytes never enter this result. This private absence representation
does not define public readBody absence policy. No cached source or attachment
snapshot survives the read. Source/encoded/body temporaries are erased by the
actual consumers, and reader-owned rejected/late bytes are erased by the read flow.
JavaScript body/parameter/base64 strings cannot be zeroized or recalled, including
when final authority/deadline checks reject. Errors retain fixed codes/messages
without native/peer content or cause chaining.

Successful transfer ends the internal lease. Any later body publication must
recheck trusted invocation, exact reference/revision and current detail authority;
returned strings cannot enforce that future check. Attachment manifests/reads,
invocation-bound chunks/lifetime/cancellation, public SDK/RPC, trusted setup/caller,
account lifecycle recovery, mail events/Cue and runtime acceptance remain unfinished.
**Mock-tested false; production-tested false; no readiness or version change.**

### Implemented host-private authorized attachment manifest read (HOST-02 prerequisite)

`MailAccountHeaderReader.readAttachmentManifest(reference, caller)` in
`src/main/plugins/mail-account-read.ts` returns
`Promise<readonly Readonly<Omit<MailMimeAttachmentContent, 'bytes'>>[]>`.
This source method is implemented/static-checked only, unwired and host-private;
it is not public `mail.listAttachments`, an SDK/RPC DTO, trusted caller proof,
byte/chunk snapshot or production service. Earlier unfinished-manifest statements
above describe the state before this prerequisite; public manifest integration
and runtime verification remain unfinished.

The existing fixed read flow requires **independent attachments rights** before
network/keyring access. Read/detail alone never admit this mode, and attachments
alone still cannot read header/search/body/raw-source results. The closed captured
reference is accountId/accountRevision/mailbox/uidValidity/uid. Mandatory captured
host callback/signal/agent, exact enabled account/installation/plugin/dual identity/
revision/configured mailbox/namespace/UID checks remain shared. Caller arguments
or callbacks do not mint trusted invocation authority; the future host resolver
must supply that authority and its live feature/broker/caller checks.

Manifest mode acquires one existing activity lease and performs exact-slot LOGIN,
READ-ONLY EXAMINE and fixed UID BODY.PEEK[] with unchanged 10s authentication and
30s original-admission lifetime budgets. It never reacquires after a raw read.
Actual `consumeMailMimeContent` validates the entire supported complete source,
including body candidates and discarded alternatives, before manifest projection.
No partial manifest, permissive result callback or malformed-content fallback.
Unchanged limits apply: 24 MiB literal/25 MiB wire, bounded MIME structure/header/
scan work, 256 KiB aggregate body candidates, 16 attachment leaves, 8 MiB each
and 16 MiB decoded aggregate before allocations. Body decoding here validates
whole-message content; it conveys no detail right or body publication permission.

Return is a frozen array (including empty), with frozen explicit closed records
`{ partId, filename, mimeType, sizeBytes }` in physical source order. Sizes are
complete decoded byte lengths, including zero; no raw source/header/body/bytes,
endpoint, secret or mutable buffer is returned. Existing numeric part paths are
unique within this source, not account/reference capabilities. Existing ASCII
filename limit is 128 bytes; absent names use fixed `attachment`. With 16 parts,
structure-bounded paths, fixed MIME strings and bounded integer sizes, this closed
projection remains below the proposed 64 KiB metadata budget without truncation.
Names are untrusted display labels, never paths, and MIME is sender-declared,
not proof of format or safe contents. No source/snapshot persists across reads.

Source/encoded/body temporaries and failed decoded buffers are erased by the
actual consumers. All successful decoded attachment buffers are erased in the
shared projection finally block, even on projection failure, **before** any later
host callback/session close/transfer. The original lease covers composition,
projection, erasure, synchronous close and final live authority/deadline checks.
Canonical invalidation/caller abort closes the session and discards reader-owned
source; late results fail closed. Bounded synchronous parsing is followed by
elapsed checks because timers cannot interrupt synchronous work. Existing fixed
content-free errors and listener/session/lease cleanup remain shared.

Frozen shells cannot erase or recall JavaScript strings; internally decoded body
strings and returned label strings retain that language limitation. Successful
transfer ends this lease. Later publication must freshly reauthorize trusted
invocation, exact reference/revision and attachments rights; these descriptors
are not reusable permissions. Authorized attachment bytes, invocation-bound
snapshots/chunks/cancellation, trusted setup/caller, SDK/capabilities/version,
lifecycle recovery, events/Cue and runtime acceptance remain unfinished.
**Mock-tested false; production-tested false; full host acceptance unmet.**

### Implemented host-private authorized complete attachment content read (HOST-02 prerequisite)

`MailAccountHeaderReader.readAttachmentContent(reference, caller)` in
`src/main/plugins/mail-account-read.ts` returns
`Promise<MailMimeAttachmentContent>`. Implemented/static-checked only, unwired and
host-private. This is a complete owned byte read for trusted host composition;
public attachment snapshots/chunks and verified invocation authority remain
unfinished. Earlier unavailable-byte statements describe prior prerequisites.

The closed captured reference contains exactly accountId/accountRevision/mailbox/
uidValidity/uid/**partId**. Before any I/O, the part ID is bounded using canonical
MIME depth/node limits and the fixed-command quoted-string/numeric validators.
Each segment is a canonical positive decimal <=64, at most 15 segments and
47 ASCII bytes; leading zeros, empty segments and arbitrary IMAP grammar deny.
Only an exact source-derived attachment path from the current complete message
can succeed. Well-formed absent paths or paths identifying a body/container fail
`MAIL_STALE`; no body fallback, arbitrary section read or partial result.

Admission requires **independent attachments rights**. Read/detail alone deny;
attachments do not confer header/search/body/source rights. Mandatory captured
host callback/signal/agent, exact enabled account/installation/plugin/dual identity/
revision/configured mailbox/UIDVALIDITY/UID, canonical activity cancellation and
exact-slot credential use remain unchanged. Callback/input validation supplies no
caller proof: a future host resolver must establish live caller/feature/broker
policy. This mode uses the original read lease through exact-slot LOGIN,
READ-ONLY EXAMINE and UID BODY.PEEK[], with original 10s authentication and 30s
admission lifetime budgets. It never reacquires a lease after a raw-source read.

Actual complete-source MIME/transfer/text composition validates all supported
leaves, including body/discarded alternatives and unselected attachments, before
selection. All existing limits apply: 24 MiB literal/25 MiB wire, bounded MIME
structure/header/scan work, 256 KiB aggregate body candidates, 16 attachment
leaves, 8 MiB per decoded part and 16 MiB decoded aggregate before allocation.
Any malformed/unsupported/truncated content or exceeded budget rejects the whole
read, even when the requested part itself would otherwise be valid.

Return is one frozen explicit closed record
`{ partId, filename, mimeType, sizeBytes, bytes }`, with only the selected complete
owned decoded Buffer and its exact decoded size (including zero). No source,
body, other attachment bytes or host configuration is returned. MIME is
sender-declared; filename is an untrusted <=128-byte label with fixed absent-name
`attachment`, never a path. Numeric part IDs do not confer authority.

The actual consumers erase source/encoded/body temporaries and failed decoded
allocations. All unselected attachment bytes are erased in the projection finally
block before any later host callback/close/transfer. Selected bytes are owned by
the reader before result construction, remain covered by synchronous abort cleanup
and are erased on projection failure, stale/revoked/canceled authority, deadline
overrun, reentrant close or other late rejection. Original authority/deadline
checks run after composition and after synchronous close before ownership transfer;
existing content-free errors and session/listener/lease cleanup remain shared.
Timers cannot interrupt synchronous parsing; the original elapsed budget is
checked afterwards without reset.

Successful transfer ends this lease. The trusted host recipient owns erasure on
use/abandonment and must freshly authorize exact caller/reference/revision and
attachments rights at every later publication/chunk boundary. Frozen shells do
not freeze Buffer contents; aliases and JavaScript strings cannot be recalled or
zeroized. No cache/snapshot handle or descriptor-to-byte identity is established
across separate reads: a later public chunk service must bind descriptor and bytes
to one invocation/reference/part/revision snapshot with its own expiry/cancellation.
Never pass this complete host-private Buffer through SDK/RPC/events. Public SDK,
RPC/version/capability/chunk serialization, trusted setup/caller, production lifecycle,
Cue/events and runtime verification remain unfinished.
**Mock-tested false; production-tested false; full host acceptance unmet.**

### Remaining proposed transport and MIME integration

`fetchWithTimeout` is for HTTP, not TLS socket supervision; reuse appropriate
existing cancellation/timeout primitives without pretending HTTP fetch speaks IMAP.

No installed `imapflow`, `imap`, `mailparser` or `emailjs-imap-client` was resolved
from the existing main dependency tree. A minimal reader must therefore be
explicitly constrained: CRLF framing; bounded tagged OK/NO/BAD and untagged
responses; quoted strings/escapes, lists and decimal literals; exact literal-byte
consumption across arbitrary chunks, matching tag completion, UIDVALIDITY and UID
validation. Reject malformed/truncated/oversized or unsupported syntax without
partial success. Do not split response lines inside a literal. Reject unexpected
continuations/extensions/compression and raw errors. MIME needs separately reviewed
bounded parsing, not an invented availability claim.

Host-generated operations only: authentication (quoted, injection-safe LOGIN on
validated TLS, with no credential echo), EXAMINE (not SELECT), UID SEARCH with
escaped bounded text or numeric range, UID FETCH of allowlisted headers /
INTERNALDATE / RFC822.SIZE / BODYSTRUCTURE and `BODY.PEEK[section]`, NOOP and LOGOUT.
No STORE, APPEND, COPY, MOVE, EXPUNGE, DELETE, CREATE, subscription changes, SMTP,
POP or arbitrary raw command. Initial monitoring uses bounded ordered polling,
not plugin raw IDLE. MIME initially supports complete text/plain (UTF-8/US-ASCII),
base64/quoted-printable parts and the listed attachment types; nested depth and
charset/transfer-encoding support must be documented by implementation. Reject
unsupported MIME/HTML-only body rather than silently inventing content.

| Proposed hard bound                               | Value / behavior                                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts / mailboxes / grants                     | 32 per plugin / 32 per account / 100 live agents per account; refuse overflow.                                                                                |
| Host/username / mailbox / search / header strings | 255 / 256 / 256 / 512 characters, plus validated Unicode/control rules.                                                                                       |
| Metadata page / count / attachments               | 64 KiB UTF-8 / 50 rows / 16 unique parts; explicit page `truncated`, never partial content success.                                                           |
| Decoded body / attachment / attachment aggregate  | 256 KiB / 8 MiB / 16 MiB per message. Validate manifest before downloads.                                                                                     |
| Attachment RPC chunk                              | At most 64 KiB decoded (base64 <= 87384 chars), sequential exact byte offsets on a bounded host snapshot; no arbitrary files or URLs. Reauthorize each chunk. |
| Raw MIME/literal / frame / nesting                | 24 MiB complete source per message, 64 KiB line/header block, nesting 16; account/read byte counters apply before allocation.                                 |
| Work / sockets / watches                          | 1 operation per account, 4 sockets per plugin, 32 watches per plugin, 64 admitted queued operations; overflow fails, cleanup not queued behind work.          |
| Time                                              | 10s DNS+TLS+login, 30s operation including MIME decoding, idle polling >=30s, capped exponential reconnect <=5min; cancel closes socket immediately.          |
| Durable state                                     | <=1024 folder checkpoints, one pending event each, <=1 MiB UTF-8 state; storage/overflow denies publication, no eviction of pending records.                  |

Timers/listeners/sockets/part snapshots are bounded and disposed on every failure,
EOF, cancellation or completion. Offsets do not allow cross-message or stale
snapshot reuse. Never expose transport/raw MIME/password/error objects to plugin
metadata. Attachment chunks are for authorized content tools only, never events.

## Fixed errors and metadata event

All proposed SDK results use `MailResult<T> = { ok: true; value: T } |
{ ok: false; error: { code: MailErrorCode; message: string } }`; the signatures
above include that envelope. Errors
have no cause/stack/host/user/server transcript. Fixed code/message pairs:

| Code               | Message                               |
| ------------------ | ------------------------------------- |
| `MAIL_DENIED`      | Mail access denied.                   |
| `MAIL_INVALID`     | Invalid mail request.                 |
| `MAIL_UNAVAILABLE` | Mail service unavailable.             |
| `MAIL_STALE`       | Mail reference is no longer valid.    |
| `MAIL_LIMIT`       | Mail request exceeds a limit.         |
| `MAIL_TIMEOUT`     | Mail request timed out.               |
| `MAIL_CANCELED`    | Mail request canceled.                |
| `MAIL_PROTOCOL`    | Unsupported or invalid mail response. |

Normalize errors at the secret/transport boundary before generic host RPC/MCP
logging sees them. Broker/grant errors must similarly avoid interpolating private
account config; audit only opaque IDs, operation, fixed status and byte counts.

Proposed Cue event type: `relay.mail.received`. Host owns provenance and projects
only the following closed payload; do not forward plugin records or raw errors:

```typescript
interface MailReceivedPayload {
	pluginId: string; // host-derived, never an argument
	accountId: MailAccountId;
	mailbox: string;
	uidValidity: MailUid;
	uid: MailUid;
	reference: MailReference;
	arrivedAt: number; // bounded UTC epoch milliseconds
	size: number; // finite nonnegative safe integer
}
```

Payload <=4 KiB UTF-8. Initial event allowlist deliberately excludes subject,
sender and attachment names/counts, though authorized headers may return them;
this matches Backstage's current metadata-only projection. No body, previews,
username/password, endpoint, attachment bytes, arbitrary headers or plugin-defined
keys. Derive a stable opaque event ID using SHA-256 of a versioned length-safe
encoding of `(pluginId, accountId, mailbox, uidValidity, uid)`. A future richer
metadata allowlist requires explicit contract/schema tests. `watchStart` authorizes
the host to acquire/project/publish that metadata directly; there is no arbitrary
`events.publish(payload)` RPC. Optional plugin delivery uses the same projection.

Cue subscription requires explicit `mail: { plugin_id, account_id, mailbox }`
(proposed new field) and normal `agent_id`, `enabled`, `filter` and ownership rules.
No agent dispatch without an active matching user-created subscription and that
target agent's live account `read` grant. Fan-out targets are each revalidated.
Register listeners as normal CueTriggerSources; stop/start/refresh tear them down /
rebuild them. Use `passesFilter` and existing `CueDispatchService -> CueRunManager`
path, never `agents.dispatch` from a monitor. Revalidate current source, subscription,
account/grants and filters at queue admission, drain, restored replay and final
execution; drop stale authority using existing queue bookkeeping. No live YAML is
written by this effort. Renderer pipeline/YAML round-trip and template variable
surfaces need explicit tasks before claiming pipeline support.

## Restart, ordered scans and crash policy

Namespace checkpoints by account + mailbox + UIDVALIDITY (also plugin ownership).
First enable takes a consistent mailbox UID baseline without flooding old mail.
Reconnect retains cursor; process arrivals **in ascending UID order** above it,
replay pending first and never skip a failed UID to advance a larger one. UIDVALIDITY
change invalidates references/pending work and takes a fresh baseline. Enable after
disable resumes the cursor for unstaged arrivals; canceled staged UIDs are consumed
without dispatch, documented as deliberate suppression. Remove erases namespace;
account IDs are never reused. Persist metadata-only pending state before publication,
then cursor advance + pending removal atomically. No message content in checkpoints.

This proposes at-least-once publication attempts with a stable event identity,
not exactly-once agent execution. A crash after Cue acceptance but before cursor
save can retry; a crash after starting an agent but before marking execution can
repeat work. Existing Cue queue helpers are fail-open and cannot substantiate a
durable acknowledgement. Production integration must add mail-specific durable
acceptance/deduplication in existing Cue DB/queue paths (including no-subscription,
filtered, queued/dropped outcomes) and refuse durable ack if persistence fails.
Subscription+event identity is the delivery dedupe key; duplicates for one consumer
must not suppress another consumer. Retention must cover producer replay; never
evict pending receipts. No consumer means zero dispatch and a documented consumed
outcome, not replaying historical mail when a pipeline is later enabled. Bound
storage and fail closed when unable to retain required receipts. Precise crash and
retention policy must be verified in implementation/tests before production claims.

## Implementation gates and verification plan

Transport can be developed with injected fake TLS independently. Public runtime
calls remain unavailable until shared types/capabilities, verified nested-invocation
identity, trusted account/secret setup, lifecycle handlers, SDK, production wiring
and mail-specific Cue replay gates all exist and pass tests. Break these additions
into 1–3 file, <500-line tasks; keep test creation and execution separate. Do not
merge another checkout/upstream or install an IMAP library to bypass these gates.

Required later checks from this worktree, using only existing dependencies:

- Focused fake-TLS/IMAP/account/secret/identity tests: egress pin, certificate
  failure, read-only grammar/literal bounds, timeout/cancel, wrong principal,
  independent rights, before/after-await revoke, cleanup and safe diagnostics.
- Host/SDK parity: `packages/plugin-sdk/src/__tests__/drift.test.ts`, `sdk.test.ts`,
  type drift config `packages/plugin-sdk/tsconfig.test.json`, SDK build and
  `src/__tests__/main/plugins/plugin-host-deps-wiring.test.ts`.
- Cue: all `src/__tests__/main/cue/` and `src/__tests__/shared/cue/` before pushing;
  no/disabled/mismatched subscription zero dispatch, real matching path, filters,
  ownership, fan-out, stop/start/refresh, UIDVALIDITY/restart/crash, persisted
  replay reauthorization and schema/editor/template round-trip.
- Repository normal gates: formatting, `npm run lint`, `npm run lint:eslint`,
  normal tests/builds as required by hooks/CI; no hook bypass or install.
  Executed commands/counts belong in the evidence ledger, not this plan.

Host event-bus delivery currently drops nested objects; if plugin delivery is
added, use a closed primitive projection (the UID tuple), not the nested reference
object through that sanitizer. Cue accepts its own typed payload.

All production tests, actual mail login, installation, deployment and upstream
merge remain out of scope. Backstage adapter consult receipt and any agreed
amendments are recorded in [[relay-imap-host-evidence-20261006]].

### Implemented host-private trusted disabled-account addition (HOST-02 prerequisite)

`MailAccountCredentials.addDisabledAccount(settings, setup)` is a synchronous
trusted-host composition, statically checked only. It reuses the canonical sealed
ledger addition, closed settings/disabled-account constructor, exact dual identity
and existing mandatory setup callback/AbortSignal snapshot. No public SDK, generic
IPC, account service, frame/gesture proof or production setup caller exists.

The captured signal and live callback are checked at entry, before and after the
anchored commit and immediately before the metadata return. The direct canonical
`addDisabledMailAccount` now also requires a live host callback; missing/throwing
authority denies. That callback must be bound by future trusted setup to the exact
frame, nonce, gesture, plugin identity, feature/manifest/broker policy and live
window lifetime. An identity argument or a caller-provided no-op is not proof.

The canonical parser generates a random opaque never-reused account ID at revision
1 with disabled intent. It snapshots endpoint, username and exact mailboxes into
closed immutable records, rejecting extra fields/passwords, invalid settings,
account/plugin/configuration limits and collisions with live IDs or retained
removal history before persistence. It preserves all unrelated accounts, exact
agent policies and tombstones and advances only the canonical epoch. No account
rights, credential slot, password, availability probe, enable or login is created.

A precommit live callback may reenter the host; any intervening configuration change
or loss of plugin/anchor authority denies before the planned commit. After commit,
canonical access, current configuration identity and equality of the bounded full
configuration snapshot are rechecked, then the wrapper rechecks authority and
configuration identity before returning. Fixed content-free mail errors carry no
native/parser cause, endpoint, username, settings or callback text.

The result is a frozen four-field record: `{ accountId, revision, enabled,
mailboxes }`, where revision is 1, enabled is false and mailboxes is the canonical
frozen array. It contains no endpoint, username, identity, agent grants, password,
credential/readiness status or I/O authority. These strings remain untrusted labels
and do not confer plugin/agent access. Future publication still requires its own
fresh trusted-host authorization.

There is no awaited gap or native credential/transport operation, and no new queue
or activity key is allocated. Synchronous work uses the existing store; reentrant
changes are refused rather than silently overwritten. A canceled/closed/revoked
setup or reentrant change after a successful commit can suppress the response while
the disabled account remains durable. The caller must refresh stored state before
retrying; no request-ID dedupe or rollback guarantee is provided. This path does
not create an account activity failure latch on setup denial or reset any existing
account/plugin/process latch. Persistence failure retains the existing global mail
stop; no recovery/readiness promise follows. Runtime tests, trusted setup/proof,
public views, SDK/Cue and production lifecycle wiring remain unfinished.

### Implemented host-private trusted stored-account summary (HOST-02 prerequisite)

`MailAccountCredentials.listStoredAccounts(setup)` is a pure synchronous trusted-
host read, implemented and static-checked only. It composes the existing mandatory
captured setup callback/AbortSignal and canonical `AuthorizationStore` configuration
ownership and `listStoredMailAccounts` projection; no new store, projector, type,
account service, trusted setup proof, SDK/RPC/IPC or production caller is added.

The captured authority checks cancellation before and after the live callback.
It is checked at entry and after projection. Canonical sealed-store reads enforce
persistent mode, intact state, available seal/anchor, current installation/epoch,
plugin consent and both content/signature identity bindings at every read. A final
canonical configuration identity check after the callback refuses reentrant
configuration changes, including unrelated changes within this plugin, with
MAIL_STALE. Reentrant consent/revoke/persistence/anchor failure also denies; callback
and backend errors are fixed content-free mail errors without a cause. This is a
conservative whole-configuration snapshot, not an account revision promise or an
atomic multi-process publication protocol.

An authorized plugin with no stored configuration yields a frozen empty array.
Otherwise the existing canonical projector returns a frozen array of frozen exact
`{ accountId, revision, enabled, mailboxes }` records with frozen mailbox arrays.
The existing closed configuration limits apply: at most 32 accounts and 32 exact
mailboxes per account within a 512 KiB configuration. No new public wire/metadata
budget or paging contract is claimed.
No endpoint, username, identity, agent rights, removal history, password, credential
status, authentication or recovery readiness is included. Enabled is persisted
intent only; a stopped activity latch does not turn this view into operational
readiness. Global persistence failure denies even this view.

The operation performs no refresh, mutation, activity admission/queue allocation,
credential slot/probe, transport or login and cannot clear any stop latch. It
confers no agent mail rights or later publication authority. Future host setup
must bind the callback to a live trusted frame/nonce/gesture, exact plugin and all
feature/broker policy gates; a plugin-supplied callback is not proof. Safe setup/
panel notification and public rights/status views, runtime tests and production
lifecycle remain separate unfinished work. Reads use only existing canonical
storage access; no native/storage runtime invocation was performed in this task.

### Implemented host-private trusted exact-account stored policy read (HOST-02 prerequisite)

`MailAccountCredentials.readStoredAgentRights(accountId, expectedRevision, setup)`
is a pure synchronous trusted-host view for later account-policy review. It uses
the existing captured mandatory live setup callback and AbortSignal, canonical
anchored persistent configuration access and both plugin identity bindings. The
new canonical `AuthorizationStore.readStoredMailAgentRights` validates the exact
opaque ID and expected positive safe revision and copies through the existing
closed `parseMailAgentRights` parser. An authorized account with no stored grant
returns empty agents; absent configuration, unknown/removed IDs and stale
revisions fail rather than becoming empty policies. Disabled accounts may be
reviewed because these are stored intentions, not effective authority.

The existing exact-revision guard now has a default-false `allowTerminalRevision`
argument used only by this pure view. Maximum-safe-integer revisions may be read;
all existing mutation/read admission sites retain their original terminal denial
and no revision/epoch is advanced. No state schema/version or persistence change.

The return is a frozen exact three-field record `accountId`, `accountRevision`,
`agents`; its dense agents array, exact two-field `agentId`/`rights` records and
rights arrays are independently copied and frozen, including empty arrays. It
reuses the existing 128-agent, three independent rights and 128-byte exact ASCII
agent-ID limits. Neither read/detail/attachments nor current host membership is
inferred. Deleted host agents may remain in this stored view; a future trusted
setup editor must resolve host membership and require fresh authority before
replacing policy. Stored grant revision mismatch denies even if configuration
validation has otherwise succeeded.

Canonical configuration is checked again after projection. The wrapper rechecks
captured setup/cancellation and the exact plugin configuration again before
return. Synchronous reentrant configuration/rights changes anywhere in this
plugin conservatively suppress stale results; callback revoke, identity change,
unavailable seal/anchor/consent or persistence failure deny. No endpoint, username,
identity, removal history, credential/readiness status, secret or content escapes.
Errors retain only fixed mail codes, without native/authority causes.

This adds no mutation, refresh, lease, queue, failure-latch reset, keyring probe,
transport, proof/minter, public SDK/RPC/IPC/event/Cue route or production caller.
Future trusted setup must bind callback authority to the actual host
frame/nonce/gesture/plugin/feature/broker generation. A no-op callback is not that
proof. Policy strings cannot be erased or recalled after return; later UI/wire
publication needs fresh setup authorization and revision validation. Stored policy
is not invocation authority, mail readiness or proof of live agents. Runtime
actual-store/composition tests, trusted setup UI/proof, public views, lifecycle
recovery and full feature acceptance remain unfinished. Source/static-checked
only; mock-tested false; production-tested false.

### Implemented host-private bounded MCP run-proof registry (HOST-02 prerequisite)

`PluginToolRunIdentity` in `src/main/plugins/plugin-tool-run-identity.ts` implements
an ephemeral main-process registry, static-checked only. The random 256-bit hex
proof design was inspected read-only in the reviewed local
`fix/relay-headless-dispatch/src/main/plugins/plugin-tool-run-identity.ts` reference
identified above. No upstream merge, proof-file helper or production singleton is
introduced. `requireMailAgentId` is extracted from the canonical stored-policy
parser without changing its exact ASCII/allowlist bounds or duplicate rejection.

The constructor requires a host membership assertion; `issue(agentId, authority,
ttlMs?)` requires a captured actual AbortSignal and bound live run assertion.
There is no permissive default. The host must resolve the agent from its own
session store and bind the run assertion/signal to the actual spawned process;
plugin/model arguments and supplied callbacks cannot act as that proof. Assertions
are synchronous trusted-host checks that throw on denial. Their contract includes
making membership/run changes cancel the supplied signal; the registry cannot
observe host state outside these assertions and signal.

Proofs are cryptographic bearer secrets, never labels to publish in prompts,
logs, events or plugin state. Entries bind exact agent and run lifetime, with a
512-entry hard limit, a one-hour default and four-hour maximum TTL. Invalid or
non-integer/out-of-range TTL is refused rather than clamped. The monotonic budget
starts before synchronous admission. Expired entries are pruned over a bounded
snapshot; reentrant abort callbacks cannot make that loop unbounded. Capacity and
stop/cancellation are rechecked after callbacks; a random collision is refused
without replacing another run. Per-entry unref timers abort outstanding contexts
on expiry; live checks enforce the deadline even if timer execution is delayed.

`resolve(token)` accepts only an exact outstanding 64-character lowercase hex
proof and returns frozen host-private `{ callerAgentId, signal, assertActive }`.
Forged, malformed, expired, revoked and stopped proofs throw a fixed mail error;
there is no anonymous fallback. Each retained context checks exact entry identity,
monotonic lifetime and cancellation before, between and after the captured run
and live membership assertions. Reentrant revoke/stop/abort and assertion failures
remove the entry and deny; an old context can never become valid after revocation.
Entry removal happens before synchronous abort callbacks and clears its native
run-signal listener and timer. Explicit `revoke(token)`, source abort and expiry
abort resolved contexts; `stop()` permanently closes minting before clearing all
entries. Foreign/unrecognized revocation is an idempotent no-op.

The registry owns no account grants, feature/capability policy, setup authority
or mail operation. The separate prerequisite below adds host-private invocation
handles with mandatory plugin/sandbox lifetime assertions. A future MCP adapter
must privately deliver the run proof, resolve it in main, retain/recheck this live
context and mint/release the plugin-bound handle for each tool round trip before
nested mail calls. Serializing
`callerAgentId` alone loses proof; a context's signal/assertion must not be treated
as complete mail authorization. Ordinary panel/background calls cannot mint it.
Completion/kill/session deletion must abort the source or revoke the exact proof;
production callbacks and lifecycle wiring are absent. No file/environment/MCP/
SDK/RPC/IPC/Cue/network/native-storage route or executable caller is added.
Runtime tests and all full-feature acceptance remain outstanding.

### Implemented host-private plugin-bound invocation handles (HOST-02 prerequisite)

`PluginToolRunIdentity` now composes bounded nested invocation handles with the
same run registry. This is implemented and static-checked source only; no runtime
or mock tests ran. No MCP delivery/ingress, sandbox propagation, public DTO/RPC,
account grant or mail operation is wired.

`issueInvocation(context, pluginId, authority, ttlMs?)` accepts only the **exact
object** returned by this registry's `resolve(runProof)`. A private WeakMap binds
that object to its original run record/token. Structural copies, forged fields,
foreign-registry contexts and resolved nested contexts cannot mint handles;
no caller-supplied `assertActive` on the context is invoked. A retained authentic
context still must pass live run/membership/lifetime checks. The host must choose
the exact plugin ID and supply a captured bound assertion plus actual AbortSignal
for its current plugin identity/sandbox generation. These callbacks are dependency
seams: arbitrary plugin/model callbacks never constitute host authority. The
captured signal must abort whenever that plugin generation/identity or required
host policy changes, including reentrant changes during run/membership assertions.
There is no plugin identity or policy discovery inside this source primitive.

Each handle is an independent cryptographic 256-bit lowercase-hex bearer, bound
to exact plugin and run. Lifetime defaults to and cannot exceed 30 seconds; it may
be tightened to a positive safe integer, and never exceeds the parent run's
remaining monotonic lifetime. There are at most 512 handles globally, 32 per run,
and 32 per plugin (aggregated across runs). Expired entries prune over a bounded
snapshot before capacity is rechecked. Collisions refuse insertion and preserve
existing entries. Timers are unref'd; live checks enforce expiry despite delay.

`resolveInvocation(hostPluginId, handle)` requires child-process provenance from
future host dispatch, never a request's claimed plugin ID. Wrong-plugin or forged
lookups deny without canceling an unrelated owner's handle. A successful lookup
returns a frozen host-private `{ pluginId, callerAgentId, signal, assertActive }`.
Checks surround captured callbacks and recheck the run after the plugin assertion.
Only the original run determines caller identity. This object alone is **not**
complete mail authorization: future production code still must recheck feature,
plugin manifest/capabilities, broker/content-egress, account revision and the
independent exact-agent rights at every operation/publication boundary.

`releaseInvocation(handle)` is host tool-settlement cleanup, not a child-callable
method. Release, parent revoke/abort/expiry, plugin signal abort, failed live check
and permanent registry stop remove the exact entry, parent index, timer and
plugin-lifetime subscription before aborting retained contexts. Plugin signals
share one listener with a bounded handle set, removed when the last handle leaves;
parent cancellation walks its own bounded index, avoiding per-handle parent
listeners. Host source signals are never aborted by this registry. Old contexts
retain their entry identity and cannot recover authority if an ID is later reused.
Native Error messages/causes are not forwarded; errors use fixed mail codes.

Production still must mint at verified MCP ingress, privately propagate each
handle to its exact sandbox/tool callback, resolve nested calls with actual child
provenance, abort captured lifetimes on all stop/disable/revoke/feature/shutdown
paths, release in tool `finally`, and cancel/erase operation-owned buffers. None
of these callers, public contract rows or lifecycle bindings is implemented here.
Runtime tests and full host acceptance remain outstanding; no live provider,
credentials, storage, socket, event or Cue dispatch was invoked.

### Implemented optional host-private sandbox invocation propagation (HOST-02 prerequisite)

`PluginSandboxHost.invokeTool(pluginId, commandId, args, runContext?)` now has
an optional internal verified path. This is implemented/static-checked only;
no runtime/security tests or production wiring are complete. The ordinary
`PluginManager.invokeTool` retains the ordinary three-argument path; the separate
verified manager entry below is host-private. Optional proof-bearing WebSocket
ingress is described below; production proof-file delivery, public mail API
or SDK invocation types remain unavailable.

The sandbox host captures optional injected `toolIdentity: PluginToolRunIdentity`
and `assertToolPluginActive(pluginId)` dependencies. Supplying any explicit
fourth argument (including undefined or null) requires both, the actual registry instance and exact registry-issued
frozen run context; structural/plugin/model-supplied agent data cannot mint a
handle. The host assertion must synchronously recheck exact plugin identity,
consent, feature and generation. Production must supply this assertion and revoke
its generation/run lifetimes; an unwired callback is not proven membership or
account authority. The host additionally binds each invocation to the exact current
utility-process record and its AbortController lifetime, rechecking before/after
host callbacks. Args are JSON-snapshotted once before admission, with the existing
1,000,000 UTF-16-code-unit JSON limit; getters/toJSON cannot change the later posted
snapshot. Unsupported/nonserializable and oversized args fail before handle delivery.

The actual registry issues a distinct plugin-bound 256-bit nested handle with its
existing 30-second maximum/run-bounded lifetime and 512 global/32 per run/32 per
plugin limits. The control message's optional internal `invocationId` is separate
from args and carries only this handle, never callerAgentId or the parent run proof.
The child rejects an explicitly malformed/null/undefined handle instead of treating it
as ordinary authority, validates its lowercase 64-hex syntax and constructs a frozen
**context-realm** second handler argument `{ invocationId: string | null }` from
host control data. Ordinary tool calls receive null; fire-and-forget command,
event and background callbacks receive no invocation authority. No ambient current
agent/context is stored; concurrent tools carry distinct handles. Context objects
contain no host intrinsic/callback/signal. This internal protocol type is not a
vendored/public SDK type and does not add any HOST_API row or capability/version.

The pending host call retains its resolved registry context and abort listener.
Before post and successful result settlement it rechecks sandbox/run/plugin/handle
liveness. Result/error/post failure/timeout/run abort/plugin stop/exit remove pending
entries, timers and listeners and release the handle, aborting retained nested
contexts. Success additionally rechecks parent run/plugin/sandbox authority after
release-triggered callbacks before resolving. Stop aborts authority and rejects
pending work before invoking lifecycle callbacks or posting shutdown. Incoming
requests/replies/logs from a stopped or noncurrent utility process are ignored;
a delayed old exit cannot delete a replacement process record. Already executing
ordinary host calls keep their existing handler obligations; this change does not
cancel arbitrary host work or kill plugin computation at tool settlement.

Authenticated host errors retain only fixed mail codes, without native causes or
child error text. The realm's authenticated handler-throw paths also avoid logging
raw exceptions; ordinary tool error behavior remains separate. Plugins can still
intentionally log/reflect their own received handles or results, so this is not a
universal logging/result-content sanitizer. Handles are invalid before result
publication and never confer account rights on their own; strings/structured-clone
aliases cannot be zeroized. Future nested mail RPC ingress must derive pluginId
from current child provenance, resolve the handle with the same registry, enforce
all independent live account/agent/manifest/broker rights, cancel/erase late content
and reauthorize each publication. Trusted setup, production proof issuance/injection, nested mail RPC wiring,
snapshots/chunks, public DTO/SDK parity and Cue remain unfinished. The verified
manager/WebSocket context path is source-implemented below, not runtime-tested.

### Implemented host-private verified manager tool entry (HOST-02 prerequisite)

`PluginManager.invokeVerifiedTool(toolId, args, runProof, publish?)` resolves an opaque
run proof with the actual injected `PluginToolRunIdentity` and passes only its exact
registry-issued context through the sandbox's optional fourth parameter. The proof
is outside args and never forwarded to the child. Ordinary `invokeTool`/commands,
IPC routes still have no verified identity. Optional proof-bearing WebSocket
ingress is described below; no production registry/authority injection, MCP proof
delivery, public SDK/type/capability/version, mail RPC or
account authority has been added. This is implemented/static-checked only; runtime
security tests and host acceptance remain outstanding.

Construction captures the optional registry, sandbox, feature getter and live
`assertToolRecordActive(record)` callback. Verified calls require every dependency,
including the sandbox's exact-child `captureToolLifetime(pluginId)` assertion; no
plain-JSON grants, refresh-time optional `verifyRecord`, structural caller objects,
model-supplied IDs or ordinary fallback may substitute. The callback must bind
fresh sealed consent, disk identity and plugin generation to the exact captured
record; the sandbox must use the same registry and independently enforce its live
plugin/identity/feature assertion. Both remain trusted-host injection obligations,
not proof that any production dependency is wired.

The manager reuses canonical `getRecord`, `isRunnable` and `collectContributions`
for a current enabled/compatible/trusted code record and exact declared namespaced
tool. Arbitrary command handlers are denied on this path. No refresh, grant-store
read, new parser, queue, state store or identity engine is introduced. Checks surround
run/host callbacks and awaited sandbox settlement. A replaced/disabled/removed
record, disabled feature, replaced dependency, revoked/expired run or stopped/
replaced child suppresses the result. `stopAllSandboxes` invalidates the manager
lifetime before stop callbacks, including synchronous restart. The sandbox captures
its exact process record in a reusable host-private assertion; it exposes neither
process nor socket nor run/account authority and replaces its prior inline guard.

Args snapshot/bounds, nested-handle cleanup and transport cancellation stay with
the actual sandbox/registry. Manager errors retain only fixed mail codes, without
raw plugin/native/proof content or causes. Stale results are suppressed, but generic
JavaScript result strings/objects cannot be zeroized here. This entry does not kill
plugin computation or authorize later publication. The optional host-only
synchronous publisher below retains these assertions at the WebSocket send
boundary. Future MCP proof delivery must preserve the existing tool-risk/approval
gates and mint/revoke run authority from actual host lifecycles. Nested mail RPCs must
still resolve plugin provenance/handle and enforce every independent account,
agent, manifest/broker and live revision right. Trusted setup, credentials lifecycle
wiring, SDK DTO/chunks, monitors/events/Cue and normal repository gates remain
separate. No test creation/execution, native/storage/network invocation or live
login occurred in this source task.

### Implemented host-private verified read-authority composition (HOST-02 prerequisite)

`MailInvocationReadAuthority` in `src/main/plugins/mail-invocation-read-authority.ts`
provides a host-private bridge from an actual plugin-bound nested handle to the
existing `MailAccountHeaderReader` caller seam. This is source/static-checked
only, with no product/runtime/security tests or production caller. It introduces
no SDK/RPC/capability/version, broker row, setup authority or I/O route.

Construction requires the actual injected `PluginToolRunIdentity`, exact host
plugin provenance, a closed immutable dual `AuthIdentity` and a captured bound
`assertPolicyActive(pluginId, identity, verifiedAgentId, right)` callback. No
registry, policy or identity default exists. Callback authority must synchronously
recheck live feature/manifest/broker/consent/exact identity/plugin generation and
throw on denial. This is an explicit future host injection obligation; the
presence of a callback is not evidence of production authorization. Lifecycle
changes must abort the run/plugin signals bound by the actual registry.

`resolve(invocationId)` resolves only an outstanding nested handle for the
captured plugin in that registry. Parent run proofs, null/forged/expired/revoked/
wrong-plugin/foreign-registry handles and structural caller contexts cannot
substitute. The returned frozen host-only `{ agentId, signal, assertActive }`
retains the actual registry context; it never mints, releases, extends or publishes
a handle. Its signal is the registry's actual nested lifetime, so settlement,
run/plugin abort, expiry and permanent stop invalidate retained authority. No
new listener, timer, registry, queue or account activity key is allocated here.

The internal `MailHeaderReadAuthority.assertActive` now takes `(right, pluginId,
identity, agentId)`. The actual reader supplies these from its fixed operation,
captured plugin/immutable identity and snapshotted caller ID, outside request
fields. Header bytes/display/search select `read`, complete source/body select
`detail`, and attachment manifest/content select `attachments`. The same selected
right is used by the existing sealed-ledger activity lease. A copied resolver
authority with a substituted agent ID, another plugin's reader or a reader with
any changed contentHash/signatureStatus/signerKey is denied. Unknown rights and
malformed identities are rejected with fixed content-free mail errors.

Every reader caller check verifies the retained run/plugin/handle context before
and after its live policy callback. Reentrant stop/revoke/child replacement cannot
survive the final registry check. Canonical exact-account/revision/mailbox/agent
rights, read deadline, credential containment, connection cleanup and byte erasure
remain in the original reader/ledger/transport; this resolver grants none of them.
The lower-level reader is still host-private and requires trusted composition;
an arbitrary no-op authority is not verified. Only the resolver path binds the
actual registry, and no production ingress uses it yet.

Successful read transfer ends its original lease. Subsequent SDK/RPC/chunk/result
publication still requires fresh exact invocation/account/revision policy checks;
this task adds no outer publication wrapper or attachment snapshot/chunk lifetime.
Raw header/source/attachment buffers remain private. Strings and returned bytes
cannot be recalled after transfer. Production MCP delivery, child provenance/RPC
handling, broker capabilities/policy injection, setup, events/Cue, SDK parity and
runtime security tests remain unfinished; full acceptance is not satisfied.

### Implemented host-private verified projected-read completion (HOST-02 prerequisite)

`MailInvocationReader` in `src/main/plugins/mail-invocation-reader.ts` composes the
actual `MailInvocationReadAuthority`, `MailAccountHeaderReader` and canonical
`AuthorizationStore`. Implemented/static-checked only; no product tests, runtime
backend invocation or production caller. No public mail RPC/SDK/capability/version,
broker route, event, Cue subscription, setup, monitor or attachment chunk surface.

Construction captures the actual store/registry, exact plugin and immutable dual
identity and mandatory bound live-policy callback. No resolver/reader replacement,
caller callback, callerAgentId, account endpoint or credential request parameter
is accepted. Host-only transport/native seams remain for later synthetic tests;
production policy and lifecycle injection are still missing.

The original projected-only prerequisite supplies `readHeaderDisplay(invocationId, reference)`,
`readMessageBody(invocationId, reference)` and
`readAttachmentManifest(invocationId, reference)`. These select independent
`read`, `detail` and `attachments` rights respectively. Only an outstanding
plugin-bound nested handle resolves; run proofs, forged contexts or identities
cannot substitute. `parseMailMessageReference` in `mail-account-config.ts` shares
the reader's closed immutable exact accountId/accountRevision/mailbox/uidValidity/
uid validation. IDs/revisions, UID grammar and ASCII mailbox bounds reuse existing
validators. No accessors, inherited/hidden/symbol/extra fields, mutable reference
alias or attachment partId is accepted. Search and raw attachment-part reads keep
their separate existing grammars. Parsing grants no authority.

The facade snapshots the reference and installation before awaiting the actual
reader, requires exact configured mailbox and account revision, and holds an outer
canonical activity lease bound to the verified agent and fixed independent right.
It checks live run/plugin/handle/policy, sealed ownership/rights, account revision,
installation and mailbox before and after the awaited read. The post-await check
covers inner transport close, projection and inner lease cleanup plus the promise
continuation gap. Reentrant stop/revoke/disable/remove/policy/identity mutation or
expiry suppresses late results. Unrelated account changes do not invalidate the
captured revision. Caller abort synchronously releases the outer lease; canonical
invalidation aborts both leases. The listener and outer lease are released on all
settlement paths; outer lease release has no downstream listeners or host callbacks.

The existing 30s lifetime bounds facade admission, parsing, the actual read and
completion checks. Nested-handle expiry/cancellation remains the actual registry's
timer; no second timer/queue/store is created. Inner connection/authentication
continues to use the reader's existing 10s budget. Both outer and inner leases count
against the existing 8-per-account/512-global caps, so at most four fully admitted
facade reads per account fit concurrently; mixed calls/admissions may hit caps
earlier and fail closed. No cap is raised or activity accounting bypassed.

Results are the actual reader's frozen subject/sender-only display, complete
plain-text body projection or attachment metadata array. There is no raw source,
header buffer, decoded attachment byte path, generic read callback, mixed MIME
result, cache or partial-result fallback. Errors retain only fixed mail codes.
Denied strings are dropped; JavaScript strings cannot be zeroized. Once returned,
values cannot be recalled. Future broker/RPC serialization or deferred publication
must reauthorize exact caller/account/revision again; this facade's completion
check is not proof of an external publication path. Attachment snapshots/chunks,
search/page composition, public DTOs, MCP delivery, trusted setup, production
broker/lifecycle policy, SDK parity, events/Cue and security/restart tests remain
unfinished. Full host acceptance remains unsatisfied.

### Implemented host-private verified attachment-read completion (HOST-02 prerequisite)

`MailInvocationReader.readAttachmentContent(invocationId, reference)` now composes
its actual nested-handle resolver, canonical activity store and existing
`MailAccountHeaderReader.readAttachmentContent`. This extends the earlier
projected-only facade; the earlier no-byte-surface statements describe that prior
prerequisite. **Implemented/static-checked only; no product tests or production
caller.** No public RPC, SDK, capability/version, broker route or chunk surface.

`parseMailAttachmentReference` in `mail-account-config.ts` extracts the actual
reader's closed six-field reference and numeric part-path validation. Both readers
now reuse it, composing `parseMailMessageReference` and existing MIME tree and
fixed IMAP validators instead of copying rules. It returns a frozen snapshot of
accountId/accountRevision/mailbox/uidValidity/uid/partId; inherited/accessor/hidden/
symbol/extra fields deny. Part paths retain the existing canonical positive
segments <=64, at most 15 segments and 47 ASCII-byte admission ceiling. Parsing
supplies no authority, metadata snapshot, content identity or arbitrary IMAP path.
Only an attachment selected by the real complete-message MIME consumer succeeds;
absent/body/container paths retain `MAIL_STALE`, without fallback.

The fixed method always selects **independent attachments rights**. Neither
read nor detail rights admit it. It accepts only a live plugin-bound nested handle,
never run proofs, caller IDs, caller callbacks, replacement readers, endpoints or
credentials. The existing captured actual store/registry/plugin/immutable dual
identity/live-policy dependencies remain mandatory. Production broker/feature/
manifest/lifecycle injection is still required; source callbacks are not proof of
production enforcement.

The outer canonical exact-account/revision/mailbox/installation/verified-agent
lease remains held through the actual fixed LOGIN/READ-ONLY EXAMINE/BODY.PEEK[],
complete MIME traversal/decoding/selection, synchronous transport close and inner
lease cleanup plus the promise continuation. The facade takes ownership of the
returned selected Buffer **before any live callback** at that continuation, even
if run/account cancellation already happened while the bytes were being returned.
It then rechecks live invocation, policy, sealed rights, account revision,
installation/mailbox and original elapsed deadline. A late denial erases those
bytes and drops the result. Outer-lease abort synchronously erases bytes already
owned by the facade. Caller abort releases the outer lease; canonical account,
plugin or store invalidation cancels both leases. Reentrant policy cancellation,
run expiry/settlement and persistence failure cannot restore the old lease.

On success the erasure listener is removed before normal outer release, preserving
the returned bytes. No host callback or await intervenes after the final check;
normal outer release has no remaining downstream listeners. On error owned bytes
are erased, errors retain only fixed mail codes and listeners/leases are removed
on every settlement path. The actual inner reader still erases source, unselected
parts and late inner results; there is no raw-source/body result or retained cache.

Result is the existing frozen shell
`{ partId, filename, mimeType, sizeBytes, bytes }` containing only one complete
owned decoded attachment (including empty), with original MIME/8 MiB part/16 MiB
aggregate and count/structure bounds. Filename remains an untrusted display label,
MIME is sender-declared and the Buffer remains mutable. The existing facade 30s
admission/completion deadline, inner 10s authentication budget and actual nested
handle lifetime are unchanged. Timers cannot interrupt synchronous parsing.
Both leases count against the unchanged 8/account and 512/global limits; at most
four fully admitted facade reads per account fit, with mixed admissions possibly
failing earlier. No timer, store, queue, snapshot handle or dispatch engine added.

Trusted host recipients own erasure after transfer and must freshly reauthorize
exact invocation/account/reference/revision/part before any later serialization
or chunk publication. Returned bytes/aliases and strings cannot be recalled.
This complete private Buffer must never cross SDK/RPC/events. The facade does not
bind a previously read manifest to later bytes or establish public snapshot/chunk
semantics. Public serialization, production caller/broker/lifecycle, setup,
MCP proof delivery, SDK parity, monitoring/events/Cue and runtime security/restart
tests remain unfinished. **Mock-tested false; production-tested false; full host
acceptance remains unmet.**

## Implemented host-private verified reference-search completion — 2026-10-07

**Source implemented/static-checked only, no production caller.**
`MailInvocationReader.searchReferences(invocationId, criteria)` now composes the
actual nested-handle resolver, canonical sealed store and actual account reader.
It accepts no caller ID, run proof, endpoint, password, replacement reader or
projection callback. Public `mail.searchHeaders` remains proposed: no RPC, broker,
SDK, capability/version, cursor, monitoring/event or Cue wiring was added.

`parseMailSearchCriteria` in `mail-account-config.ts` extracts the actual reader's
closed criteria rules for shared use before I/O. Required fields are exact opaque
`accountId`, positive safe-integer `accountRevision`, ASCII bounded `mailbox` and
canonical decimal `fromUid`/`toUid`. Optional `uidValidity` and literal `text` must
be valid when present; explicit undefined/null, inherited/accessor/unknown fields
are refused. The existing fixed command builder enforces ordered UID range and
literal Subject-or-From grammar; its temporary validation bytes are erased.
The immutable snapshot contains only validated primitives. Parsing supplies no
membership, account rights or network authority. Malformed account IDs/revisions
now fail in this shared parser before configuration lookup, as message references
already do; previously search deferred those checks to account lookup.

The facade fixes independent **read** rights and captures the installation ID,
account revision and exact mailbox in its existing outer activity lease. The
actual inner reader independently rechecks agent/account rights, performs fixed
keyring LOGIN/READ-ONLY EXAMINE/UID SEARCH and validates optional expected
UIDVALIDITY, exact tag, UID uniqueness/range/count/order. It returns the existing
frozen `{ uidValidity, references }` with frozen exact
`{ accountId, accountRevision, mailbox, uidValidity, uid }` rows, including an empty
result, without header/body/attachment bytes or caller/secret metadata.

Outer authority remains live through the awaited real read, projection, transport
close and inner lease cleanup. Registry/handle/plugin policy, account/revision/
mailbox/installation and the original 30s facade deadline are checked again after
that continuation. Caller abort synchronously releases the outer lease; settled
listeners and leases are removed on every path. Denial drops the result and uses
existing fixed content-free errors without permissive fallback. No cache, timer,
store, queue, snapshot handle or dispatch engine is introduced; other facade modes
retain their existing behavior. Both leases consume unchanged canonical caps
(8/account, 512/global), permitting at most four fully admitted facade reads per
account, with mixed admissions possibly failing earlier. Inner 10s authentication
and actual nested-handle expiry remain independently enforced; synchronous work
cannot be interrupted by timers.

This is a bounded historical search observation, not a stable mailbox snapshot or
replay checkpoint. Later serialization/publication must freshly authorize the
same invocation/account/revision/reference. Returned immutable coordinates cannot
be recalled after transfer. Production policy/lifecycle injection, MCP proof
delivery, trusted setup, public pages/SDK parity, monitoring/events/Cue and actual
security/restart tests remain unfinished. **Mock-tested false; production-tested
false; full host acceptance unmet.**

### Implemented host-private verified attachment snapshots (HOST-02 prerequisite)

`MailInvocationReader.openAttachmentSnapshot(invocationId, reference)` now composes
its actual fixed attachment reader and `mail-attachment-snapshot.ts`. This is
implemented/static-checked only; no public `mail.readAttachment`, SDK/RPC handle,
broker/capability/version, production setup/policy injection, event or Cue route.
The reference is the existing closed accountId/accountRevision/mailbox/UIDVALIDITY/
UID/partId tuple. Caller identity comes only from the existing exact-plugin nested
invocation resolver; independent attachments rights and exact sealed configuration
remain required. No plugin-supplied reader/result/authority callback is accepted.

The original outer activity lease remains held across full source/MIME validation,
inner reader cleanup/await continuation, snapshot construction and later chunk
reads. The constructor transfers ownership only after live checks. Its abort
listeners move with the bytes and lease; canceled/denied late continuations erase
bytes and release the reservation. The inner read retains existing protocol/MIME
bounds, including validation of unselected leaves; raw-content mode is unchanged.

Before attachment I/O the facade reserves one canonical maximum decoded part
(currently 8 MiB). Module-wide accounting spans all facade instances: at most
64 MiB/eight pending-or-open snapshots globally and 16 MiB/two per exact plugin.
Even empty or completed snapshots reserve a full slot until closure; this is
conservative admission accounting, not a cap on all transport/MIME temporaries.
Existing reader/account activity caps can further reduce admission. Failed reads,
explicit close, invocation expiry/run/plugin stop and canonical account/policy/
consent/persistence cancellation release reservations/listeners/leases. Canonical
host invalidation is synchronous; no new timer, disk cache, permission store or
queue is added. A lost host reference remains bounded until invocation expiry.

The returned frozen main-only object has exactly partId/filename/mimeType/sizeBytes,
`readChunk(offset, limit?)`, `assertActive()` and `close()`. Labels retain the actual
MIME consumer's sender-declared type and untrusted filename semantics. There is no
Buffer, source, body, credential, endpoint, account grant or serialized snapshot ID.
`readChunk` starts at numeric offset zero, requires the exact next safe-integer
offset and a positive safe-integer limit <=65536 (omitted/undefined defaults to
65536), and returns frozen `{ dataBase64, nextOffset, complete }`. A full chunk is
at most 87384 base64 characters. Empty attachments yield one empty complete chunk.
No seeking, replay, truncation or refill; a valid but unexpected offset or read
following completion returns MAIL_STALE and closes the snapshot. Invalid limits/
offsets return MAIL_INVALID and close it. Reentrant reads deny and close it.

Live exact invocation/account/agent/attachments policy and the original 30-second
admission budget are checked before and after encoding; invocation expiry can only
shorten that budget. Reentrant revoke/close/abort is checked after callbacks.
Completion erases and drops the retained Buffer immediately, while preserving the
original authority lease and conservative reservation until explicit close or
invocation expiry. `assertActive()` supports a fresh main-side publication check,
including after completion; denial closes and erases. Close is idempotent, detaches
listeners and releases the lease; closed objects cannot recover. Error messages
are reconstructed fixed mail errors without peer/native causes or content.

The object itself never crosses a process boundary and is not independently
verified bearer identity. Future RPC must bind any snapshot lookup to the exact
nested invocation/plugin and reference, reauthorize serialization/delivery and
close at settlement. Already returned base64 strings/metadata cannot be recalled
or zeroized; holding a lease does not prove a later external publication succeeded.
Normal repository gates and actual-composition security tests remain deferred.

### HOST-03 canonical caller-proof preparation and exact-agent revocation

Reviewed the comparison worktree's complete `plugin-tool-run-identity.ts` and
`rpc-protocol.ts`, plus its manager invocation contract, read-only. Input SHA-256
hashes are in `.maestro/verification/host-03-proof-authority/comparison-inputs.json`.
The existing HOST-02 adaptations in this branch are canonical: reuse the actual
`PluginToolRunIdentity`, host-private frozen `PluginToolCallerContext` and
`PluginManager.invokeVerifiedTool`, rather than importing the comparison's
permissive null context, unbounded map, singleton or proof-file implementation.
The shared control message retains only optional opaque `invocationId`; it does
not serialize the host-private signal/assertion or trust callerAgentId from args.
The shared protocol and manager source remain unchanged in this task.

`revokeAgent(agentId)` now validates the canonical exact agent ID and synchronously
revokes all its current run proofs and nested invocations through the existing
removal paths. A bounded transient exact-agent fence is installed before the first
abort callback. During that fan-out, run/context/invocation checks deny and remove
that agent's remaining proofs; replacement issuance is denied before host admission
callbacks. Reentrant same-agent revocation is idempotent. Other agents retain their
own proofs and authority. The bounded run snapshot and at-most-512 concurrent
agent fences prevent unbounded registry iteration/state. The fence is released in
`finally`; it is not a persistent tombstone or permission for later issuance.
Future production deletion/stop wiring must update authoritative membership/run
lifetimes and use this method or exact-proof revocation/source abort. Once deleted,
old contexts remain stale; a recreated agent still needs fresh host run admission.

Both run-proof and nested-handle resolution reject strings whose length is not
64 before inspecting the fixed lowercase-hex grammar. Caps/monotonic expiry,
source abort, permanent registry stop and concurrent context isolation otherwise
retain their existing contracts. Membership and run assertions remain trusted
synchronous host checks that throw on denial, not plugin-supplied predicates.

Implemented and statically checked only: no product tests created/run. Actual
registry reentrant revocation/concurrent isolation tests remain in HOST-03's test
creation task; test execution remains HOST-05. No production membership injection,
MCP/CLI proof delivery or interactive/Cue lifecycle caller is wired. No public mail
SDK/RPC/capability/version/setup/event contract is introduced: Host API remains
1.16.0 and SDK 0.11.0, below Relay's required 1.22.0. Full mail acceptance remains
unsatisfied.

### HOST-03 optional proof-bearing WebSocket ingress and synchronous completion

**Source implemented/static-checked only; no runtime test or production proof
issuance/registry injection is complete.** The existing `plugins_call_tool` handler
in `src/main/web-server/handlers/messageHandlers/plugins.ts` recognizes an own
optional `runToken` field in the transport envelope, outside model `args`. Presence
selects `PluginManager.invokeVerifiedTool`; explicit undefined/null, forged,
malformed/expired/revoked proofs and missing actual registry/liveness dependencies
deny without ordinary fallback. The registry resolves proof only in main;
`callerAgentId`, `sessionId`, model arguments and structural contexts do not prove
identity. Absent proof retains the existing ordinary tool path, whose sandbox
handler receives null invocation authority and cannot read mail through a handle.

Both paths preserve exact declared-tool lookup and the existing Pianola risk gate
on the tool name/description/arguments. A HIGH verdict blocks before invocation.
The envelope proof is neither added to risk text nor logged, echoed, forwarded to
the child or included in a result. This is a private bearer transport seam, not a
model-facing input schema or a new SDK/RPC method/capability/version. Production
must securely deliver an ephemeral host-issued proof to the MCP bridge and inject
the same actual registry/live host policies into manager and sandbox. No new
singleton, proof issuer, durable state, agent runner or permissive resolver exists.

The manager's optional fourth parameter is a captured trusted synchronous host
publisher `(result, assertActive) => void`, never request/plugin input. Invalid
publisher values deny before execution. After awaited actual sandbox settlement,
the manager rechecks its retained run, record, exact child, feature/consent and
lifetime, then invokes this publisher synchronously with its existing assertion.
The WebSocket publisher checks the active singleton manager, feature flag and
captured client socket/open state, invokes the retained authority assertion, then
checks singleton/socket identity/open state again and synchronously sends the
correlated success. No further awaited continuation precedes publication. A
replacement manager/socket, closed socket, revoked run or changed plugin suppresses
success. The request ID/socket/proof are captured at ingress, not reread after the
await. The publisher must keep its send synchronous; it does not return authority
in the wire result. Existing direct manager callers retain their own later
publication obligations.

Verified failures normalize to fixed mail codes without raw plugin/peer/proof
content or native causes; static missing-tool/feature/risk responses remain
content-free. Ordinary errors retain their previous behavior. Existing registry
and sandbox caps, per-call handle/context isolation, 30-second timeout and
settlement/abort/stop/exit cleanup are reused unchanged. This seam checks socket
closure at admission/publication; it does not subscribe disconnect to cancel
plugin computation early. Nested handles are already released at sandbox
settlement; only retained parent-run/plugin authority guards tool-result delivery.
No arbitrary tool-result sanitizer or exactly-once delivery promise is made, and
already sent JavaScript strings/structured-clone copies cannot be recalled.

Runtime tests must use the actual registry/manager/sandbox plus synthetic web
clients: own absent versus undefined/null/malformed/forged/foreign/expired/revoked
proofs, args/session/caller-ID spoofing, unsupported injection denial without
ordinary fallback, declared-tool/HIGH-risk gates, fixed errors/no proof disclosure,
concurrent calls and second-argument realm isolation, disconnect/socket and
singleton replacement, run/account/plugin revoke during each await/cleanup and
reentrant feature/host callbacks, successful correlated synchronous publication,
publication rejection, normal-path regressions and existing bounded handle/timer/
listener teardown. Test creation is retained in HOST-03; execution in HOST-05.
No tests were created/run in this source task. Trusted setup, production proof
issuance/revocation/injection/MCP delivery, public mail API/SDK versions, monitoring,
events/Cue, normal repo gates and full mail acceptance remain unfinished.

### HOST-03 optional MCP proof-file transport (2026-10-07)

**Implemented/static-checked only; no runtime acceptance or live delivery.**
The reviewed local comparison's MCP bridge/command/config sources were read only;
input hashes are in `.maestro/verification/host-03-mcp-proof-transport/comparison-inputs.json`.
This adaptation keeps the existing provider strategies and Codex override ordering,
without copying the comparison's unbounded `readFileSync(...).trim()` or invalid-file
anonymous fallback. No upstream merge or other-checkout source write occurred.

`McpServerSpec.runTokenFile` is an optional host-selected canonical absolute file
path. `buildMcpInjection` copies the spec/env without mutation and overrides the
reserved `MAESTRO_PLUGIN_RUN_TOKEN_FILE` entry: explicit host path when selected,
empty for ordinary tools, regardless of a conflicting supplied env value. Empty
explicit `runTokenFile` rejects. Only the path appears in provider configuration;
never the bearer bytes. Existing strategy/global-argument order, unrelated env,
verified-provider flags and Codex ordering are retained. Unsupported provider
strategies are still unverified and must not acquire mail authority.

The command captures then removes that env entry before connecting. Absent/empty
means ordinary tools with no verified mail context. A nonempty configured path
must be absolute and canonical through `realpath`, a regular single-link file,
exactly 64 bytes, same inode/device before opening and after reading; symlink and
non-regular replacements deny. One descriptor uses no-follow where available and
nonblocking open, with a 65-byte read ceiling and exact lowercase hexadecimal ASCII
bytes (no trim, newline or high-bit alias). Post-read size/mtime/ctime and current
path checks reject observed replacement/mutation. POSIX requires owner uid and
0600; Windows private ACL creation/verification is a still-unimplemented trusted
host issuer obligation. The temporary Buffer is erased and the descriptor close
is attempted in `finally`; close errors are suppressed without raw file details.
No file is written/deleted and no native credentials are accessed by this reader.

A configured invalid/unreadable proof becomes a null denial sentinel. The bridge
captures own-property presence and proof once; explicit undefined/null/invalid proof
rejects tool calls locally with `MAIL_DENIED`, never falling back. Valid-shape proof
is carried only in the existing `plugins_call_tool` envelope outside args, not
in tools/list schemas, model inputs, caller IDs, risk text, prompts or diagnostics.
Main's actual registry remains the authority for foreign/forged/expired/revoked
proofs; file bytes and syntax alone confer no permission. Missing proof uses the
ordinary manager/sandbox path with null handle, so cannot authorize mail reads.
Proof-mode transport/tool failures, risk reasons and protocol diagnostics use fixed
messages; command connection/handler errors also omit raw errors. Ordinary bridge
behavior otherwise remains. No result-publication authority is inferred from a
successful transport handshake, and strings already returned cannot be recalled.

This source task does not mint proofs, create private files, inject a production
registry, establish live host membership, revoke/delete at process stop or expose
public mail SDK/RPC/grants. Interactive/Cue and CLI spawn lifecycle wiring, secure
host issuer/cleanup and Windows ACL policy remain separate source tasks. The same
registry/live checks must be injected into manager and sandbox; future issuer must
use canonical absolute paths and exact token bytes, verified provider paths only,
protect parent directories and own cleanup/revocation. JavaScript token strings
remain in the private bridge process for its lifetime and cannot be zeroized; no
cross-process proof reclamation or runtime redaction guarantee is claimed.
Host API remains 1.16.0 / SDK 0.11.0; Relay minHostApi 1.22.0 is unsatisfied.
Runtime actual-composition tests and normal gates remain deferred. Tests 0/0;
full mail acceptance remains unsatisfied.

### HOST-03 host-private run-proof file resource (2026-10-07)

**Implemented/static-checked only; issuer never invoked, no runtime acceptance.**
`src/main/plugins/plugin-tool-run-proof-file.ts` exports `PluginToolRunProofFiles`
and its host-only resource type `PluginToolRunProofFile`. This supersedes the
missing issuer-helper observation in the preceding transport task; production
issuance, provider configuration and run lifecycle injection remain unavailable.
The existing comparison helper was reviewed read-only (input SHA-256 retained in
`.maestro/verification/host-03-proof-file-issuer/comparison-input.json`); its global
singleton, unconstrained token input, temp fallback and recursive deletion were
not adopted. No existing canonical secure ephemeral-file helper was found in the
required utility/process/plugin guides or source search.

The host constructs one resource owner with the **actual** `PluginToolRunIdentity`
instance and an existing absolute canonical private directory. There is no default
registry, membership callback, root creation, chmod repair or anonymous fallback.
The future production caller must select a local host-private directory outside
project/Vault and inject the same live registry used by manager/sandbox ingress.
`create(agentId, authority, ttlMs?)` reserves one bounded slot before reentrant
host admission, calls the actual registry's `issue`/`resolve`, captures the resolved
abort signal and returns a frozen `{ runTokenFile, signal, assertActive, dispose }`.
Only the path may enter the existing `McpServerSpec.runTokenFile`; the resource and
bearer bytes must never enter plugin/model arguments, prompts, logs, events or
results. The agent ID is a trusted host lifecycle input, never proof by itself.
Registry membership/run assertions, synchronous denial, monotonic TTL bounds and
revokeAgent/stop semantics are reused unchanged. Stored file bytes confer no mail
rights and cannot replace live ingress resolution or plugin/account authorization.

**POSIX platform policy:** Linux and macOS only, requiring `getuid`, `O_NOFOLLOW`
and `O_DIRECTORY`. Windows and every unsupported platform deny with
`MAIL_UNAVAILABLE` before issuance or filesystem access. Windows requires a future
verified private ACL implementation; mode bits are not used as an ACL substitute.
The supplied root and each created run directory must be canonical nonsymlink
0700 directories owned by the host uid. At most 64 ancestors are checked; every
ancestor must be a nonsymlink directory owned by uid 0 or the host uid without
any group/other write bit. This deliberately refuses writable/sticky temp parents
and unexpected home layouts; no fallback or repair is attempted. Paths are capped
at 4096 characters, NUL/relative/noncanonical paths deny, and directory descriptor
checks pin observed inode/device to the path. Root identity is retained and
rechecked before/after file creation and cleanup. Private modes do not isolate
hostile code or tier-1 plugins running under the same OS user, privileged actors,
mount changes or races performed with that authority. Node has no portable openat
here; observed substitution denies, not a claim of same-user race elimination.

Each run gets a private exclusive `mkdtemp` directory and fixed `proof` basename,
never a token-bearing filename. File creation uses `O_RDWR|O_CREAT|O_EXCL|O_NOFOLLOW|
O_NONBLOCK`, mode 0600, with descriptor/path regular-file, uid, exact mode,
single-link, inode/device and empty-file checks before writing. One 64-byte write
must complete exactly, followed by one read capped at 65 bytes with exact-byte
comparison, size/inode and final path/mode/link/mtime/ctime checks. The actual
registry always issues exactly 64 lowercase hexadecimal ASCII bytes, no newline.
Descriptor close must succeed before publication and live authority is checked
again. Buffers are erased in `finally`, with close attempted on failure. JavaScript
strings cannot be reliably zeroized; no secure erasure of filesystem blocks or
open descriptors held elsewhere is promised. Synchronous local filesystem calls
have bounded byte/operation counts but cannot be preempted while blocked in the
OS; registry expiry is checked before success and its timer runs when the event
loop resumes. A future caller must not supply a network filesystem.

`dispose` marks closed and removes the captured abort listener **before** revoking
the registry proof, then attempts exact-file and empty-directory deletion.
Abort/expiry/direct revoke/revokeAgent/registry stop use that same cleanup path.
Creation holds a busy slot so reentrant abort cannot race its descriptor; its
`finally` closes/erases and cleans up after invalidation. Owner `stop` fences new
admission first, revokes all captured proofs and attempts every resource cleanup.
Cleanup checks captured root/directory/file identities, refuses substituted files,
links or unknown inodes, uses only unlink/rmdir (never recursive removal), confirms
absence and rechecks the root. Successful disposal is idempotent. A filesystem
or cleanup failure permanently stops this owner, revokes sibling resources before
attempting their cleanup and keeps bounded failed slots for explicit disposal/stop
retry. Retry success never resets the stop latch. At most the existing registry's
512 run slots, including pending/failed resources, can be owned; there is no
unbounded queue, background retry or second proof state machine.

Crash/forced termination can leave private orphan files; the restarted in-memory
registry rejects their old tokens. No automatic orphan scan/recovery is implemented.
Unknown/replaced directories, descriptor failures and deletion uncertainty may
leave resources behind with authority revoked. Issuance is not operational until
interactive/Cue/other supported spawn callers establish live membership/lifetime,
configure verified local provider delivery, and call dispose/stop on exit, stop or
spawn failure. No production caller or public RPC/SDK/capability/version changed.
Host API **1.16.0**, SDK **0.11.0**, Relay minHostApi **1.22.0** remains unsatisfied.
Synthetic actual-composition failure/revoke/cleanup coverage is retained unchecked
in HOST-03; execution and required normal gates remain HOST-05. Tests created/run
**0/0**; full host acceptance remains unsatisfied.

## Host-private manager issuance boundary (2026-10-07)

Implemented/static-checked only: `PluginManagerDeps.toolProofFiles` captures the
existing `PluginToolRunProofFiles` resource owner; `PluginManager.createToolRunProofFile(agentId,
authority, ttlMs?)` uses the captured `toolIdentity` also used by verified tool ingress.
The issuer's `assertIdentity(identity)` requires exact object identity and denies
its stopped latch. Missing registry/resource/sandbox exact-child support or sealed
record callback denies issuance. No public method, SDK/RPC/capability/version
change, token getter, singleton or second registry is introduced.

The method snapshots the mandatory host run callback and AbortSignal, combines
that signal with the captured manager run generation using native `AbortSignal.any`,
and checks generation, stop fence, feature and retained identity/resource/sandbox
dependencies around callbacks, before issuance and before returning the existing
frozen private resource. The actual registry still checks current host membership,
run lifetime, caps and monotonic expiry. `agentId` here must come from future trusted
main lifecycle code; this main-only method is not a proof-bearing IPC endpoint.
The path is for host `McpServerSpec.runTokenFile` only; the token stays internal.

`stopAllSandboxes()` invalidates the existing tool generation, replaces the run
controller and fences admission before aborting the old controller. Registry abort
revokes its proofs/handles and issuer abort attempts private-file cleanup synchronously
before sandbox stop callbacks. Nested stops retain the admission fence. The fence
is released in finally; fresh runs after stop need fresh admission, while old
resources stay revoked. Cleanup uncertainty retains the existing issuer failure
latch; neither a completed stop nor feature re-enable promises deletion/readiness
or revives an old resource. Run abort/expiry/resource disposal stay independent.
Errors are canonical content-free mail codes; there is no ordinary issuance fallback.

Production construction, private-directory provisioning, authoritative membership,
matching manager/ingress injection, feature/replacement/shutdown hooks, and trusted
interactive/Cue/CLI process authority, spawn failure/exit/kill/replay disposal remain
**unimplemented**. Existing spawn paths still inject ordinary MCP tools without a
proof. Direct feature/dependency changes deny on the next live assertion; immediate
cancellation requires the production stop/lifecycle hook. This source boundary does
not establish transport, caller or public mail readiness. Supported POSIX/private
path checks, Windows ACL refusal, same-OS-user and crash orphan limitations remain
unchanged. Host API 1.16.0, SDK 0.11.0; Relay minHostApi 1.22.0 remains unsatisfied.
Product tests created/run 0/0; mock-tested false, production-tested false. Synthetic
registry/issuer/manager lifecycle coverage is deferred to HOST-03 creation/HOST-05
execution. Full host acceptance remains unmet.

### HOST-03 private proof-directory provisioning prerequisite (2026-10-07)

**Source implemented/static-checked only; no production caller or runtime test.**
The existing host-private `PluginToolRunProofFiles.provision(identities,
hostPrivateBase)` constructs the canonical file-resource owner using the supplied
actual registry. It creates only the fixed direct child `plugin-tool-run-proofs`.
The existing constructor still accepts only an existing private root; no new
singleton, proof registry, secret store, public SDK/RPC/capability or version.

A shared validator preserves the constructor's exact 0700 private leaf requirement
and existing canonical absolute/non-symlink path, current uid, safe bounded ancestor
and no-follow directory descriptor checks. Provisioning first validates an existing
base owned by the current uid, with owner read/write/search, no group/other write
or special mode bits; 0755/0750 bases are permitted, but the proof root is always 0700. All ancestors must be owned by uid 0 or the host uid and disallow group/other
write. Opened descriptors must retain the inspected mode/uid/device/inode; the base's
captured device/inode is rechecked after creation and after owner construction.

Nonrecursive `mkdirSync(..., { mode: 0o700 })` does not create parents. EEXIST
continues only to the same strict root validation, refusing wrong mode, symlinks,
non-directories or substitution; there is no chmod repair, arbitrary temporary
fallback, scan, recursive cleanup or permission widening. The supported-platform
check runs before filesystem access: Windows and non-Linux/non-macOS deny, with
no claim that POSIX modes verify Windows ACLs. Invalid inputs, preflight/creation/
readback/close failures normalize to `MAIL_UNAVAILABLE` without paths/raw causes.
No proof is minted or written by provisioning. Failed setup may leave one empty
fixed directory; no arbitrary deletion or automatic orphan recovery is attempted.

The future trusted production caller MUST select and maintain a base outside
project/Vault content, validate its origin against live host configuration, and
inject this same registry into manager and sandbox. Filesystem privacy does not
establish location policy, live membership/run authority, sealed plugin identity,
process lifetime or mail grants. The index/manager/singleton replacement and
production proof dependency injection remains unchecked, as do interactive/Cue/CLI
spawn callers. Feature-disable and confirmed-quit hooks are source-wired below.
Same-user hostile code, synchronous filesystem stalls, crash orphan cleanup and
live path races are not resolved by these POSIX checks. Actual synthetic composition
coverage remains required; no production readiness or full acceptance claim.

### HOST-03 permanent manager proof-authority retirement prerequisite (2026-10-07)

**Implemented/static-checked only; mock-tested false; production-tested false.**
`PluginManager.stopToolAuthority()` is host-private replacement/shutdown cleanup,
separate from the existing temporary `stopAllSandboxes()` feature-stop boundary.
It permanently fences run issuance and verified invocation/result publication,
invalidates captured manager generation, stops the exact captured registry before
abort callbacks, aborts the manager run lifetime and stops its exact proof-file
owner. All three cleanup steps are attempted despite another step failing. Errors
normalize to `MAIL_UNAVAILABLE` without token/path/raw cause. Repeated calls retain
bounded issuer cleanup retry; they never clear the manager or registry stop fence.
A later feature stop/re-enable or same-manager registration cannot revive proofs.
Ordinary tool/command invocation and plugin discovery remain independent.

The existing `setActivePluginManager(manager, isEnabled?)` now detaches both outgoing
manager and feature predicate before retiring the old authority on replacement or
clear. Each call replaces a private transition marker, including a clear while
already detached. Synchronous cleanup reentrancy cannot make an older setter
overwrite the newer assignment. An abandoned incoming candidate is retired unless
a newer setter adopted that exact candidate. Failed non-reentrant replacement
keeps ingress detached, retires its candidate and throws a fixed unavailable code.
A newer reentrant assignment remains its owner even when outgoing cleanup reports
failure; outgoing/candidate authority remains permanently fenced. Re-registering
the same active live manager updates only the predicate and preserves its runs.
A directly retired manager remains incapable of verified authority even if
registered again. No second singleton, registry, store or public route was added.

Source composition is still unavailable: index does not construct/inject the
registry/resource owner, authoritative membership, location policy, live sealed
record/child checks. Feature-disable and confirmed-quit cleanup hooks are now
source-wired below. The existing shutdown path
now wires permanent retirement at confirmed cleanup entry as described below.
Interactive/Cue/CLI spawning still supplies no proof. Replacing/clearing through
the existing singleton has the new source fence, but no production proof runtime
was invoked or verified. Filesystem cleanup failures may leave bounded revoked
resources and require the retained owner/method for retry; no automatic orphan
scan, secure deletion, same-user isolation or Windows ACL support is claimed.
Actual synthetic lifecycle/issuer/registry/singleton regressions remain required.
Host API 1.16.0/SDK 0.11.0 remain unchanged; Relay minHostApi 1.22.0 and full host
acceptance remain unsatisfied. Product tests created/run: **0/0**.

### HOST-03 feature-disable and confirmed-quit proof lifecycle (2026-10-07)

**Source wired/static-checked only; mock-tested false; production-tested false.**
The production Encore-feature callback in `src/main/index.ts` now invokes the
actual manager's `stopAllSandboxes()` before child stop callbacks. This reuses its
admission fence, generation invalidation and run-lifetime abort, so old resources
cannot regain authority after a temporary feature re-enable. Direct sandbox stop
is retained only before a manager exists. Fixed content-free failure reporting
preserves grouping/view teardown after a stop error. No registry/resource owner
has been constructed or injected by this task.

Confirmed quit now passes the host-only `stopPluginToolAuthority` dependency to
the existing quit handler. Its synchronous cleanup entry calls this fence before
logging, persistence, history/window/watch/process cleanup. Pending confirmation
and cancellation never call it. The production callback calls the existing
accessor's new `stopActivePluginManager()` and also retires a constructed local
manager if it differs from the captured active manager, even if accessor cleanup
fails. Quit catches only to report a fixed retirement message and continue other
cleanup; proof tokens, private paths and native/plugin causes are never formatted.

The canonical accessor permanently fences admission and invalidates in-progress
transitions, detaches manager/predicate before retirement callbacks, and rejects
all later non-null adoption, retiring rejected candidates. It retains at most one
detached shutdown owner for explicit cleanup retry. Reentrant shutdown calls are
no-ops while cleanup runs; reentrant same-owner adoption is denied before recursive
cleanup. Retry never resets the host or manager stop fence. This is an extension
of the existing accessor, not another registry, state engine or public API.
Failed rejected-candidate cleanup still requires the candidate's caller to retain
its reference for retry; shutdown does not accumulate abandoned managers. Synchronous
OS stalls and crashes can still leave the issuer's previously documented residues.

Actual production membership, location exclusion/provisioning, exact shared registry
and file-owner construction, sealed record checks and child injection, and all
interactive/Cue/CLI spawn/exit/kill cleanup remain unchecked. The hooks have no
production proof owner to retire yet. No real lifecycle, proof-file, storage,
credential, network or provider invocation was performed. Host API **1.16.0**,
SDK **0.11.0**, Relay minHostApi **1.22.0** unchanged; full host acceptance unmet.
Runtime security/regression tests remain the separate creation/execution tasks.

### HOST-03 verified sandbox context propagation completion (2026-10-07)

**Implemented/static-checked only; mock-tested false; production-tested false.**
The checked HOST-03 propagation task composes the already prepared WebSocket,
manager, actual registry and sandbox path. An own envelope runToken resolves only
in the main manager, never from args/session/callerAgentId. The sandbox's explicit
fourth parameter now always selects verified admission, including undefined/null,
and requires the exact registry-issued context and captured plugin/child lifetime.
Ordinary three-argument calls remain independent. No parent proof/agent ID, native
AbortSignal or host callback enters the realm. Only a distinct plugin-bound nested
invocationId travels outside args into the frozen per-call realm second argument;
ordinary tools receive a null invocationId, while commands/panels confer no handle.

Both child control ingress and realm parsing reject explicitly malformed handles;
JSON omission cannot erase undefined into an ordinary call. The existing internal
protocol's nullable type is broader than runtime admission: the ordinary control
message omits the field, and null exists only in the ordinary handler context.
Correlation IDs must be positive safe integers; exhaustion denies without reuse.
The child captures its realm, checks it before invocation and result delivery, and
normalizes synchronous serialization/entry and asynchronous failures through the
same correlated response. Verified missing-handler errors do not log command text.
These checks neither terminate a hung plugin computation nor create a public SDK.

Verified successful host completion JSON-snapshots the result under the existing
1,000,000 UTF-16-code-unit cap before releasing its handle, then rechecks the actual
nested authority and exact child. Invalid serialization and oversized results deny;
ordinary result behavior remains unchanged. This is a completion cap, not a claim
that hostile-child allocations are bounded before structured-clone delivery or
that arbitrary plugin results/logs are sanitized. Existing run/plugin/child checks,
30-second timers, abort listeners and pending-map cleanup remain per invocation;
success/error/abort/timeout/post failure/stop/exit release the handle before final
parent-run/plugin/child checks and manager/transport publication. Retained nested
contexts cannot regain authority after settlement. WebSocket missing-tool/disabled
verified errors now use fixed MAIL_INVALID/MAIL_DENIED codes.

Actual production registry/resource owner, authoritative membership/run/record/
child injection, interactive/Cue/CLI spawn proof issuance and nested mail RPC remain
unchecked. No source callback counts as live host integration. No runtime/product
suite was executed, no public RPC/SDK/version/capability changed, and full mail
acceptance including Relay minHostApi 1.22.0 remains unmet (host API 1.16.0,
SDK 0.11.0). Deferred actual-composition tests are recorded in HOST-03; execution
remains HOST-05. No proof-file/native/storage/network/provider/mail invocation.

### HOST-03 production run-proof dependency composition (2026-10-07)

**Source wired/static-checked only; mock-tested false; production-tested false.**
`src/main/index.ts` constructs one `PluginToolRunIdentity` and provisions its exact
`PluginToolRunProofFiles` owner. The sandbox and manager receive that same registry;
manager issuance receives the matching file owner. The existing WebSocket ingress
still resolves proofs through that manager. No run proof is issued by startup and
no new registry accessor, singleton, store, RPC, SDK method or version is added.

The host selects only its captured `app.getPath('userData')` base, already excluded
by the broker's protected-path policy, and the canonical provisioner creates only
its fixed 0700 `plugin-tool-run-proofs` child. Location admission runs before and
after provisioning and during live membership/plugin assertions: canonical unchanged
userData, Linux/macOS only, no demo instance, no overlap in either direction with
registered local cwd/projectRoot/fullPath, and no containing `.git` or `.obsidian`
marker (including Git worktree marker files). Known project symlinks resolve before
comparison. Missing/unreadable/nonabsolute project roots, malformed local stored
rows or indeterminate marker checks fail closed. Remote roots are not interpreted
as local paths; remote agents receive no authority. Unregistered directories with
no project/vault marker are not discoverable as projects by this policy. Existing
provisioner uid/mode/no-follow/ancestor/substitution checks remain mandatory; no
Windows ACL claim, chmod repair, temp fallback, orphan scan or crash cleanup claim.
Location failures disable proof infrastructure until restart and emit only the fixed
message `Verified plugin tool authority unavailable`; ordinary tools remain independent.
A failed provision may leave its empty fixed directory, never an issued run file.

Membership re-reads the authoritative sessions store on every registry admission
and resolved-context check, requires exactly one matching host ID and a known
nonterminal local provider, and checks the exact constructed manager remains the
active singleton with the plugins feature enabled. Membership is not a run lifetime:
the upcoming spawn task must capture the real process/run callback and AbortSignal,
provider delivery and exit/stop/failure disposal. No name, provider session ID,
model argument, plugin-echoed caller ID or cached agent list replaces that proof.

Both manager and sandbox receive live host plugin assertions. Reuse
`pluginIdentity`, `AuthorizationStore.verify` and `readMailConfiguration` for
current trusted on-disk/consented identity, exact requested capabilities and live
persistent sealed/anchor freshness. Null mail configuration at this boundary confers
no account rights. Session-only, rollback/re-consent, failed persistence, removed,
revoked or changed-identity state denies. `PluginManager.assertToolRecordCurrent`
reuses its existing reconciled fingerprint and exact runnable record before and
after the sealed check: newly consented disk bytes cannot authorize an older child.
Existing exact-child capture, invocation signals and before/after-async completion
checks remain in the manager/sandbox. These synchronous filesystem/identity checks
are conservative and may deny all proof issuance when a registered local root is
unavailable; no performance or same-OS-user isolation guarantee is asserted.

Existing feature disable aborts manager run generations before child callbacks and
attempts file disposal; a fresh feature generation cannot revive old proofs.
Singleton replacement/clear and confirmed quit permanently stop that exact registry
and file owner with ingress detached first. Pending/cancelled quit keeps authority.
Construction/policy errors never format proof tokens, paths or raw native causes.
No actual startup, native/keyring, proof-file, storage, provider or mail invocation
was performed in this task. Host API 1.16.0 / SDK 0.11.0 remain unchanged; Relay
minHostApi 1.22.0 remains unsatisfied. Nested mail RPC, trusted setup, spawn callers,
SDK/version, Cue and full synthetic acceptance remain unchecked.

Deferred actual-composition coverage must exercise shared registry/owner identity,
live deleted/duplicate/foreign/terminal/unknown/remote membership and required run
lifetime; unsupported/demo/canonical/uid/mode/symlink/missing-root/marker/overlap and
location-change failures; ordinary-tool behavior when infrastructure is unavailable;
trusted on-disk/consented/reconciled-child identity, re-consent without refresh,
anchor/session-only/persistence/revoke failures and callback reentrancy; exact child
restart/crash, feature disable/re-enable, manager replacement/clear and confirmed
versus cancelled quit; cleanup attempts, safe errors/logs, concurrency and stale
completion denial. Use actual registry/issuer/manager/sandbox and synthetic storage,
filesystem/keyring/child backends only. Test creation stays HOST-03, execution HOST-05.

### HOST-03 exact-process run lifetime prerequisite (2026-10-07)

**Implemented and static-checked only; no production caller or runtime validation.**
`ProcessManager.spawnWithRunLifetime(config, prepare)` is a main-only synchronous
composition seam, with `ProcessRunLifetime` in the canonical process-manager types.
The frozen lifetime contains only `signal` and `assertActive()`, never an agent ID,
proof token, password or private path. This proves process lifetime only; later
callers must combine it with the exact active PluginManager, authoritative host
agent membership, canonical proof resource and independent sealed plugin/mail
policy. No lifetime field was added to the `process:spawn` IPC payload.

The method copies args, custom/global env, image/path arrays and scalar spawn
configuration before the trusted preparation callback. Preparation may return only
args/custom env; these are copied again, with live checks around callback/result
access. It refuses occupied slots, nested lifetime preparation, same-slot ordinary
spawn during preparation, invalid/saturated canonical generation, unsupported
platform/provider, PTY/shell/SSH modes and the Electron/Node `process.execPath`
wrapper. It uses the canonical verified Claude/Codex MCP-strategy table; this is
**not binary authentication**. The future caller must verify the actual selected
provider command and deny custom/unverified wrappers or execution modes. Other
unsupported paths retain ordinary spawning with no lifetime/proof.

During preparation, assertions require the exact preparation object, empty process
slot and unchanged canonical spawn generation. During the synchronous spawn handoff,
assertions deny until the exact managed child is captured. Successful capture requires
matching session/provider, actual child and managed PID, nonterminal/non-PTY/non-SDK
representation and exactly the next generation. Subsequent assertions recheck exact
map/child/generation identity, provider/session/local representation, interrupted
state and Node exit/signal status. A failed or released assertion permanently
fences and aborts its handle; neither a reused session key/PID nor later generation
can restore it. There is no wall-clock supervisor, extra proof registry or run store.

A weak association on the exact ManagedProcess owns synchronous stop cleanup.
Interrupt/kill invoke it before buffer, signal or other callbacks, then recheck map
identity. Child exit/error/close use prepended once listeners. Cleanup marks closed,
drops only its own weak association and removes all three listeners before aborting
listeners such as the future canonical registry/resource cleanup. Failed preparation,
spawn or final capture revokes; a failure after exact capture attempts kill of only
that owned current child. Reentrant successors cannot lose their stop association
or be signalled/deleted by old cleanup. Kill's final map deletion now also checks
exact identity. Ordinary `spawn()` consumers receive no authority, and existing
process signal/escalation behavior is retained. There is no cleanup timer or global
current-agent state; lifetime expiry remains the future canonical proof registry's job.

**Not delivered or accepted:** interactive/Cue/CLI proof-file issuance, selected
provider verification, expiry/resource composition, actual callback/child lifecycle
behavior, private argument/environment publication, mail/setup/SDK/Cue wiring and
full security/normal repository tests remain unfinished. Existing interactive spawn
logs and renderer process-list DTOs forward complete command arguments. HOST-03 now
contains explicit privacy projection tasks before any proof-path delivery, plus a
separate Cue-child lifetime prerequisite because Cue's stop/timeout map is independent
of ProcessManager. AgentRun's observed spawn capture already selects metadata rather
than argv/env. No claimed privacy fix, test or public surface accompanies this seam.

Source task delta: **2 files, 166 additions/1 deletion**. Baseline/final strict main
TypeScript, source Prettier, ESLint with zero warnings and tracked whitespace pass.
Tests created/run **0/0**, mock-tested **false**, production-tested **false**; no
process, plugin, proof file, storage/keyring, provider or mail runtime invoked.
Host API **1.16.0**, SDK **0.11.0** and Relay minHostApi **1.22.0** remain unchanged
and incompatible. Full mail acceptance remains **unmet**; conditional review/PR
remains HOST-05. Receipts: `.maestro/verification/host-03-process-run-lifetime/`.

### HOST-03 private MCP spawn-log publication prerequisite (2026-10-07)

Source-implemented and static-checked only: the canonical bundle-safe
`projectMcpProcessPublication(args, env?)` in `src/shared/plugins/mcp-agent-config.ts`
returns frozen copied `args`, a frozen copied `env` and a `withheld` flag. It grants
no caller/run/mail authority and its lossy output must NEVER be used for execution.
The actual `buildMcpInjection` output, executable argv/environment, configuration
files and retained private ManagedProcess configuration remain unchanged.

The projector withholds entire opaque Claude `--mcp-config` operands and all
Codex `-c`/`--config` operands, including compact/equals variants, rather than
parsing untrusted JSON/TOML. This includes ordinary config overrides because a
quoted/escaped TOML key may conceal private delivery. Direct environment/token/file
operands, composite MCP/proof markers and case-insensitive private environment
keys are withheld; OPENCODE_CONFIG/OPENCODE_CONFIG_CONTENT and MCP_CONFIG/
MCP_CONFIG_FILE environment values are also omitted. Nonconfiguration argv,
ordinary command paths/flags and nonprivate environment entries remain diagnostics.
No proof-path length/content is substituted for an omitted operand.

Input admission copies dense own data-only string argv and plain/null-prototype
own data-only string/undefined environment records, at most 4,096 entries each
and 4 Mi UTF-16 code units total (keys included). Sparse/accessor/symbol/extra-array
properties, wrong types, unsupported environment prototypes, excess bounds,
dangling/ambiguous flag operands or inspection failures yield only a fixed
unavailable-publication marker, empty environment and `withheld: true`. There is
no JSON/TOML parse, raw-cause formatting, authority callback or filesystem I/O.
These are publication scanning/copy bounds, not preallocation protections for
arbitrary hostile Proxy traps/own-key enumeration or execution limits. Copies do
not erase immutable JavaScript strings and do not scrub arbitrary unlabeled secrets.

`ChildProcessSpawner.ts` projects before argument slicing/command joins and before
shell escaping for all argv previews, including its output-parser lookup preview.
It projects the logged command/PATH/global-env keys, omits raw shebang content,
and substitutes fixed content-free errors for withheld/rejected configurations
at local stream/native/listener/exit errors, Sentry capture and delegated native
child-error handling. The original error is retained for ordinary configurations.
`handle-spawn.ts` applies the same projector before its existing system-prompt
redaction and full-command logging, command-path diagnostics/breadcrumbs and
Windows argument logging; MCP temp-config cleanup emits a fixed error without a
path/cause. Permission-relay failures are fixed when publication was withheld.
Execution args/env and ordinary process monitoring are never fed projected copies.

**Delivery remains gated.** Process-list/detail DTOs and Cue publication await the
next source task. Provider stdout/stderr/result/parser/exit diagnostic forwarding
in StdoutHandler/StderrHandler/ExitHandler and raw-stdout subscribers is not covered
by this log projector; it can echo a private config/path. An explicit small source
prerequisite is now unchecked before proof delivery to audit/fence those sinks.
Other spawners/wrappers/SSH/custom env-file names remain unsupported for proof
issuance. No global logger redaction, end-to-end secrecy, tested privacy or executable
proof delivery is claimed. Host API 1.16.0/SDK 0.11.0 remain unchanged; no mail RPC,
SDK, permissions, version or live setup surface was added.

Deferred actual-composition tests must use canonical buildMcpInjection plus this
projector and real spawn orchestrators with synthetic backends: both verified
providers, ordinary/no-proof configs, inline/equal/compact/quoted/escaped and
malformed JSON/TOML, file/env/token operands, private-key case variants, opaque
environment payloads, frozen nonmutation and exact executable argv/env, dense/
sparse/accessor/symbol/prototype/type/count/code-unit limits, dangling/ambiguous
operands, fixed errors/no raw causes or Sentry paths, all command/argv/PATH/parser/
shell preview sinks, concurrent configurations and ordinary diagnostic regressions.
Include retained system-prompt redaction. No permissive projector/result mock may
replace the composition. Test creation remains HOST-03; test execution/full gates
remain HOST-05. Tests created/run here: 0/0, mock/production tested false/false.

### HOST-03 process-detail and Cue native-error publication prerequisite (2026-10-07)

**Source implemented and statically checked only; mock-tested false,
production-tested false.** This task composes the existing bounded, frozen,
nonmutating `projectMcpProcessPublication`; no new projector/utility/type/registry,
public SDK/RPC, permission or host API/version was introduced.

`src/main/ipc/handlers/process.ts` projects managed argv and Maestro-set env,
command and remote display before building `process:getActiveProcesses` DTOs.
Missing optional args/env/command retain their missing state; unsafe argv/env
shapes return the canonical fixed unavailable publication rather than raw input.
A remote display is omitted when any projected field is withheld. Args are copied
and env is frozen, so the child-inspection await does not retain a live raw argv/env
reference. Command paths/ordinary flags/env and process IDs/status/cwd/start times
remain visible under the canonical policy. Private delivery cannot be transported
through a retained opaque config operand/environment channel in these DTOs.

Child process DTOs keep PIDs but withhold command text for withheld parent configs
and for Windows, whose `wmic` returns an opaque full CommandLine. This deliberately
reduces Windows terminal-child diagnostics; no unsafe shell tokenization is attempted.
Ordinary POSIX command names are canonically projected. Cue callback metadata is
projected again at IPC, so that callback cannot directly bypass the argument policy.
Preload `process/core.ts` invokes this canonical handler. No separate raw argv/env
process-list publisher was found in web-server searches; this does not prove web
integration or authorize later publisher bypasses.

`src/main/cue/cue-process-lifecycle.ts` snapshots publication before native spawn,
stores copied publication command/args/remote metadata in its existing main-only
active-process map, and projects again on `getProcessList`. The actual SpawnSpec
and native `spawn(spec.command, spec.args, {env: spec.env, ...})` execution input
remain unchanged/private; lossy metadata is never executed. Env-only delivery is
included in the admission snapshot despite env not being a Cue DTO field. For
withheld/rejected configuration, synchronous native spawn errors and asynchronous
child error diagnostics use only `Cue process spawn failed`, projected command
metadata and existing fixed Sentry operation tags; ordinary native errors retain
existing diagnostics. No path/token/error cause is formatted in the withheld branch.

Read-only audit: `setupAgentRunCapture` selects only session/tool/cwd/tab/prompt/
project metadata; it does not forward config argv/env/MCP proof fields and was not
edited. `debug:getAppStats` and `debug-package/collectors/processes.ts` similarly
select metadata, not argv/env. Existing prompt redaction remains unchanged. These
selection boundaries do not protect provider-originated stdout/stderr or arbitrary
unlabeled secrets and cannot erase immutable JavaScript strings.

**Proof delivery remains blocked.** Cue raw stdout/stderr, in-flight output polling,
parser/fallback/result/history/chaining and auth diagnostics remain uncovered.
Native stdin/stream/kill/timeout/rejected-Promise errors and upstream Cue
builder/executor logs still need their actual composition audit. Added one explicit
unchecked Cue output-publication task before issuance because the interactive
Stdout/Stderr/Exit prerequisite cannot cover Cue's independent buffers/publishers.
That task is planning only and was not executed. Neither opaque shell/SSH/wrapper
command reconstruction nor custom delivery names are supported proof paths;
canonical lifetime/issuance must deny these, not infer privacy from this projector.
Canonical projector bounds/limitations from the preceding section still apply.

Deferred actual-composition/security/regression tests are recorded in HOST-03:
real injector/projector/IPC/Cue paths with synthetic backends, exact native input
and source nonmutation, optional/malformed shapes, both verified providers/config
variants/limits, env-only Cue delivery, native error/Sentry privacy, concurrent/
repeated list and callback isolation, Windows/POSIX child display, child-inspection
await mutation, AgentRun/debug metadata selection and ordinary behavior. No
permissive projection mock may replace composition. Test creation/execution remain
separate HOST-03/HOST-05 tasks; required Cue suites remain before-push gates.
Tests created/run **0/0**; no proof-file, agent/provider, native/keyring, mail or
product runtime. Host API **1.16.0**, SDK **0.11.0**, Relay minHostApi **1.22.0**
unchanged/unsatisfied; full mail acceptance and normal repository gates are unmet.
Receipts: `.maestro/verification/host-03-process-detail-projection/`.

### Prepared ProcessManager provider-output withholding prerequisite (2026-10-07)

**Implemented and statically checked only; mock-tested false, production-tested
false.** The new main-private ProcessManager spawn composition passes a captured
boolean to ChildProcessSpawner and ExitHandler. Ordinary `spawn()` passes false;
`spawnWithRunLifetime()` passes true. No ProcessConfig/IPC/model option, mutable
current-caller state, new registry or proof accessor was added. This is a complete
withholding policy for prepared runs, not selective secret redaction or useful
mail integration. Even a prepared run without a proof suppresses provider output;
ordinary runs with regular MCP configuration retain their existing output path.

Prepared stdout/stderr are drained without enabling UTF-8 decoding or converting
chunks, and never reach StdoutHandler/StderrHandler, parser/error detection,
output buffers, provider logs/Sentry, data/thinking/tool/session/usage publishers
or their renderer/web/history consumers. Each stdout chunk emits only an empty
`raw-stdout` event, preserving the existing liveness subscriber while withholding
the group-chat peek payload. Split, encoded and interleaved chunk contents cannot
become a partially published path through these guarded ingress callbacks. There
is no output accumulator, search/replacement algorithm, output-sized copy or timer.
The native argv/environment and existing canonical argument/environment publication
projector remain unchanged. This does not erase native buffers or immutable strings.

Prepared close bypasses all exit parsing, preview/provisional-error/result/disk
fallback paths. It clears residual output fields and their flush timer, emits only
`Private provider output unavailable` as a fixed nonrecoverable agent error when
not deliberately interrupted/already errored, and invokes the extracted canonical
exit settlement even if that error listener throws. Code-zero close is therefore
not represented as a successful usable answer. Shared settlement retains temp-image
cleanup, metadata-only query completion, final flush and exact generation/map
ownership checks before release/exit. Child-native/stream/listener/exit failures
reuse the existing fixed `PrivateMcpSpawnFailed` branch for every prepared run.
No answer, usage, tool detail or provider session ID is published for these runs.
Prepared child error and close share one captured settlement callback with a
one-way per-child latch; raw native causes do not reach the ordinary error handler
and a later close cannot repeat query/exit publication.

**Delivery remains gated.** No production caller uses this prepared path or issues
a proof yet. Ordinary direct spawns are not private proof channels; the projector's
`withheld` result cannot establish host run authority or end-to-end output privacy.
ProcessManager write/interrupt/kill diagnostics, upstream preparation/delivery,
provider-managed disk transcripts and external session/history/debug readers,
custom binaries/wrappers/PTY/SSH/SDK paths and Cue's independent output publishers
remain separately unaudited. The HOST-03 broad publication checkbox remains
unchecked; a separate diagnostic prerequisite is now explicit. No proof delivery
may bypass the canonical prepared path, and any future useful-output policy needs
an independently reviewed bounded contract rather than substring scrubbing.

Deferred tests must exercise actual ProcessManager/spawner/handlers and canonical
injector/projector with synthetic children only: exact native input and ordinary
no-proof MCP behavior, prepared runs with/without private config, split/encoded/
interleaved stdout/stderr, empty liveness vs no payload, no parsing/conversion/
accumulation/publication, fixed native/listener/Sentry errors, trailing remainder/
residual buffer/timer disposal, zero/nonzero/interrupted/already-errored exits,
query/cleanup ordering and listener reentry/throw, concurrent/replaced generations
and successor isolation. No permissive projector/handler mock establishes this
gate. Creation/execution remain HOST-03/HOST-05. Tests created/run: 0/0. No public
API/SDK/permission/version changed; host 1.16.0 and SDK 0.11.0 still do not satisfy
Relay minHostApi 1.22.0 or full mail acceptance.

### Prepared ProcessManager control diagnostic prerequisite (2026-10-07)

**Implemented/static-checked only; mock-tested false, production-tested false.**
A main-private weak publication marker now follows the actual ManagedProcess,
independently of the lifetime stop callback. The captured prepared spawn policy
marks it before the spawn event can reenter controls. Stop/exit never removes that
marker; weak ownership neither keeps an otherwise unreachable process alive nor
confers authority. There is no session-key policy, model/IPC/config toggle or new
run-state registry. Native execution arguments/environment and ordinary control
inputs/diagnostics stay on their existing paths.

Prepared write/interrupt/kill catches send a freshly constructed fixed
`PrivateMcpSpawnFailed` Error to Sentry and its fixed string to logger. The native
cause is neither inspected nor stringified on this branch. Interrupt/kill capture
publication policy before aborting authority; write checks its captured exact
process, so synchronous native reentry/retirement cannot restore raw publication
or transfer policy to a successor. Prepared kill clears the flush timer and drops
residual data instead of invoking DataBufferManager's data publisher. Prepared
interrupt escalation requires both the original process and child object; an old
timer cannot kill a replacement. Prepared cwd refusal omits cwd and emits a fixed
error. Existing ordinary spawn and control behavior is retained, including its
ordinary escalation behavior. This is a bounded diagnostic change, not proof of
end-to-end privacy, cancellation or safe runtime behavior.

Remaining publication inventory (read-only audit, not implemented gates):

- `ipc/handlers/process/handle-spawn.ts` still calls ordinary `spawn`, not
  `spawnWithRunLifetime`, and builds ordinary MCP injection without a run proof.
  Its mkdtemp/writeFile/injection failures are not contained by a prepared-run
  policy; permission-relay log projection depends on argv/env scanning. Upstream
  IPC/error wrappers and future proof preparation require separate composition.
- `storage/claude-session-storage.ts` and `storage/codex-session-storage.ts` read
  provider-owned disk transcripts and derive previews/conversations. Dropped
  stdio does not protect these independent readers or their native/parser errors.
  `history-manager.ts` persists/reads history independently. No policy or private
  run provenance was added to these paths.
- Debug log collection drops structured data and sanitizes message paths; debug
  session collection omits conversations. These existing behaviors do not prove
  private proof protection for logs, external storage, history or other readers.
- Cue owns independent native output/result/polling/preparation paths. PTY,
  Windows, SSH, shell and SDK runs are excluded by the current prepared lifetime
  seam. Ordinary/direct spawn is not a proof-delivery channel. The seam's provider
  slug checks do not verify an arbitrary custom executable/wrapper's identity;
  exact trusted executable selection must be enforced before issuance. No
  production proof-bearing caller is enabled here, and unsupported/bypass paths
  must remain unavailable for proof delivery.

The broader provider diagnostics/output audit and Cue tasks remain unchecked;
proof issuance stays blocked, and complete provider output withholding remains
in force. Deferred tests in HOST-03/HOST-05 must exercise real control/spawn
composition, fixed errors after abort/exit, throwing native causes (including
hostile string conversion), native reentry, timer/data disposal without any
publication, exact successor isolation, failed/partial spawn, cwd failure and
ordinary no-proof regressions. Tests created/run: **0/0**. Host API 1.16.0/SDK
0.11.0 remain unchanged and incompatible with required Relay minHostApi 1.22.0.

### Private provider exit settlement prerequisite (2026-10-07)

**Implemented/static-checked only; mock-tested false, production-tested false.**
`ExitHandler.handleExit` now carries its captured host-only withholding policy
into the existing `finishExit`. Private settlement never calls
`DataBufferManager.flushDataBuffer`: the previous shared final flush followed
synchronous query-complete callbacks and could publish a refilled residual buffer.
An exact-object cleanup closure drops the timer, data/JSON/stdout/stderr/streamed
text and provisional error both before notification and in an outer finally after
error/query/exit notification, including throwing listeners. It never touches a
successor's buffers. JavaScript strings are dropped, not securely zeroized.

Synchronous cleanup/query notification failures are retained as a boolean until
canonical ownership retirement and exit notification. The private outer catch
throws only a new `PrivateMcpSpawnFailed` error, without reading or stringifying
the original cause. The existing spawner catches it with fixed diagnostics. A
throwing private agent-error listener still runs settlement; a throwing private
exit listener finds the original ownership already released and still triggers
output disposal. Exact object/generation checks suppress stale exits and avoid
deleting a replacement. Ordinary settlement retains its buffer flush, diagnostic
content and exception behavior; executable argv/environment are untouched.

Read-only publication inventory for this prerequisite:

| Boundary                        | Actual coverage and remaining limit                                                                                                                                                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Child stdout/raw-stdout         | Existing captured prepared policy drops chunks before conversion and sends only empty raw liveness. `data-listener.ts` forwards raw chunks to group-chat peek; `group-chat-liveness-listener.ts` notes activity. No prepared payload reaches them through this publisher.                           |
| StdoutHandler/StderrHandler     | Prepared child callbacks bypass both handlers before parsing, previews, buffers, provider errors, usage/session/tool/thinking/results and stderr forwarding. These handlers have no independent private policy; ordinary/direct/custom paths are not proof-delivery channels.                       |
| Exit parser/disk/fallback       | Existing private early branch skips provider parsing, Copilot disk reconciliation, provisional/SSH errors, raw batch fallback and provider content. This task fences its shared final buffer flush and synchronous listener failures.                                                               |
| Query/exit downstream listeners | Query metadata and numeric exit still use canonical listeners, which may flush their own previously accumulated buffers. No new ingress to those buffers is enabled. Direct host listener publication, asynchronous reentry and arbitrary use of DataBufferManager remain outside this local fence. |
| Image staging/cleanup           | `imageUtils.ts` has independent save/cleanup logger/Sentry paths; async unlink failures stringify native causes outside handleExit's promise. This task does not gate them. A separate explicit source prerequisite is required before issuance.                                                    |
| Other publishers                | ProcessManager controls have their prior private marker; upstream IPC preparation, trusted executable identity, Claude/Codex disk/history/debug readers and Cue remain separately gated. Dropping stdio cannot establish privacy for those readers.                                                 |

No proof file, token delivery, provider run, useful-answer publication or readiness
is enabled. The broad HOST-03 provider diagnostic task remains unchecked. Future
issuance must deny unsupported/bypass executable paths and pass all publication
prerequisites plus actual synthetic composition tests. Host API 1.16.0/SDK 0.11.0
remain unchanged and do not satisfy required Relay minHostApi 1.22.0.

Deferred HOST-03 creation/HOST-05 execution must exercise actual
ProcessManager/spawner/ExitHandler/DataBufferManager with synthetic children and
errors: zero private flush calls/data, reentrant error/query/exit listeners that
refill every residual field and arm timers, synchronous cleanup/query/exit throws
with hostile message/string conversion, final timer disposal, ownership release
before exit, concurrent/replaced/reused generations and successor isolation,
zero/nonzero/interrupted/already-errored exits and exact ordinary diagnostics,
flush/error behavior and native input preservation. Direct/asynchronous listener
publication and independent image/disk/Cue sinks must not be mistaken for tested
coverage of this local fence. Tests created/run in this task: **0/0**.

## Prepared image staging and cleanup publication prerequisite (2026-10-07)

Source-implemented and statically checked only; tests created/run **0/0**.
`ChildProcessSpawner.spawn` passes its captured host-only
`withholdProviderOutput` policy to `saveImageToTempFile`; `ExitHandler.finishExit`
passes the same policy to `cleanupTempFiles`. Policy is a per-call boolean captured
before asynchronous callbacks, never a model/config flag, string inspection,
mutable process DTO or global suppression switch. Existing ordinary callers
continue to default to false. No new public type/capability/version or proof
issuance is enabled.

For prepared calls the helper's save-success/temp-cleanup logs and the spawner's
two image-mode diagnostics omit temp paths. Image sizes/counts and fixed messages
remain metadata. Save failures send only `PrivateMcpImageSaveFailed` to logger and
a fresh fixed Error to Sentry, including resolution/preparation exceptions caught
by the helper. Neither publication stringifies or inspects the original cause.
Private async unlink failures emit only `PrivateMcpImageCleanupFailed`, without
reading native code/message/getters, including ENOENT. The captured policy stays
in the promise closures after exit retirement. Native input paths/bytes, image
prefixes, returned staging paths and unlink attempts remain execution inputs.
Ordinary save/cleanup path data, native errors/Sentry and ENOENT suppression retain
their prior behavior; ordinary pre-write resolution/preparation throws still
propagate. These claims await actual synthetic composition tests.

Audited publishers and outstanding prerequisites:

- `imageUtils.ts` save/cleanup and `ChildProcessSpawner.ts` image-mode temp-path
  diagnostics are covered locally; private exit cleanup uses captured policy.
  Ordinary `ExitHandler.handleError` cleanup stays ordinary; prepared native
  error callbacks already route through the private exit branch.
- `parseDataUrl` calls `session-image-store.resolveToBytesSync`, whose missing-ref
  logger and native-error code getter remain independent publishers. Catching a
  resolver throw cannot retract its earlier log. A new unchecked HOST-03 task
  covers this module, image parsing and `streamJsonBuilder.ts`; no complete
  persisted-image or stream-json privacy claim is made here.
- `streamJsonBuilder.ts` and SSH image handling use ordinary parsing. SSH/PTY/SDK
  paths are not admitted by `spawnWithPreparedProcessRun`; direct/custom callers
  are not supported proof channels. IPC `handle-spawn.ts` owns separate SDK temp
  staging/cleanup. Existing broader audit tasks must fence/deny bypasses.
- Spawner Windows prompt previews/remaining provider/config diagnostics, external
  disk/transcript/history readers, ProcessManager controls and Cue publishers
  retain their separately recorded prerequisites. Complete stdout withholding
  does not establish privacy for these sinks.

Deferred HOST-03 test creation/HOST-05 execution must exercise actual
ProcessManager/spawner/ExitHandler/image helpers with fake filesystem/storage,
logger/Sentry and child seams: prepared staging success/failure and missing/throwing
resolution; hostile error code/message/string getters never accessed by the local
private save/cleanup publishers; delayed unlink success/rejection after ownership
retirement; failed/missing unlink fixed error; identical native bytes/path arguments
and prompt/argv/environment, array nonmutation, ordinary logs/ENOENT/native throws,
concurrent ordinary/private runs and reused/replaced generations. Keep resolver,
stream-json, SDK/SSH, prompt-preview and external provider sinks explicitly
uncovered until their separate tasks/tests pass. No runtime has been exercised.
Public Relay mail API/account setup/nested invocation/Cue acceptance and normal
before-push gates remain incomplete. Host API **1.16.0**, SDK **0.11.0**, required
Relay minHostApi **1.22.0** unchanged.

## Persisted-image helper diagnostic policy prerequisite (2026-10-07)

**Source-implemented/static-checked only; mock-tested false; production-tested
false.** This completes only the new helper split in HOST-03. The original
persisted-image task and an explicit ChildProcessSpawner call-site task remain
unchecked; no proof is issued or delivered by this change.

The existing `resolveToBytesSync(value, withholdProviderOutput = false)`,
`parseDataUrl(value, withholdProviderOutput = false)` and
`buildStreamJsonMessage(prompt, images, withholdProviderOutput = false)` accept
one explicit main-only per-call host policy. No ProcessConfig/IPC/SDK/model flag,
new utility/type/logger/registry or current-agent suppression state is introduced.
The parser passes it to the actual resolver; staging passes its existing captured
policy to the actual parser; the builder passes it to that parser. Success keeps
original inline base64 spelling, persisted image bytes/path/media type, image-first
JSON and prompt unchanged by source inspection. This is awaiting synthetic tests.

Private resolver failures, including inline decode/path preparation/unconfigured
store and every file-read failure, throw a fresh `PrivateMcpImageResolutionFailed`
with no cause before code/message/getter inspection or missing-ref logging. Missing
private files also throw, because examining an error code to recover ENOENT would
inspect a native getter. Invalid reference grammar still returns null. Private
parser/encoding failures become `PrivateMcpImageParseFailed`; private builder
iteration/resolution/serialization failures become `PrivateMcpStreamJsonFailed`.
Neither layer formats or retains native causes. Existing staging catches its fixed
parser error and publishes its existing PrivateMcpImageSaveFailed diagnostic.
Ordinary missing-ref logger/null, native error identity/code behavior and preparation
throws remain unchanged. Async/data-URL/browser/CLI resolver consumers remain
ordinary and gain no proof authority.

| Actual consumer                                              | Covered boundary and remaining prerequisite                                                                                                                                                         |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ChildProcessSpawner image staging                            | Already passes captured private policy into saveImageToTempFile; now continues through parser and persisted resolver before native cause/log publication.                                           |
| ChildProcessSpawner stream-json                              | Still calls builder with two arguments. Helper supports policy, actual call-site wiring remains a separate explicit unchecked task before issuance. No complete prepared stream-json privacy claim. |
| wrap-spawn-for-ssh / ssh-command-builder                     | Ordinary builder/parser callers remain unchanged. Existing spawnWithRunLifetime admission rejects SSH modes; these are unsupported proof-delivery paths.                                            |
| handle-spawn SDK image stage/cleanup                         | Independent ordinary SDK publishers remain outside this seam. Prepared lifetime admits only supported local Claude/Codex child representation; SDK proof delivery is unavailable.                   |
| CLI image save / browser/export/data-URL resolvers           | Ordinary direct consumers, not verified proof channels. Their logs/native failures are not covered by a private policy they do not receive.                                                         |
| Custom/direct callers and external provider disk/transcripts | Helper policy is no authority. Issuance/provider verification and broader diagnostic/disk audits remain unchecked; no permissive private delivery is added.                                         |

Existing lifetime code denies PTY/shell/SSH/unsupported providers and process.execPath
wrapper, not arbitrary custom binary authentication. No complete bypass or external
provider transcript/disk privacy claim follows from helper errors. Actual production
issuance is still unavailable and must deny unverified custom wrappers/direct
channels before delivery. Complete provider-output withholding remains mandatory.

Source delta: **3 files, 99 additions/59 deletions (158 changed lines)**. Strict
main typecheck, source Prettier, zero-warning ESLint and tracked whitespace checks
pass; tests created/run **0/0**. Deferred actual-composition coverage lives in
HOST-03, execution HOST-05. Contract/public versions remain host API **1.16.0**,
SDK **0.11.0**, Relay required minHostApi **1.22.0**; full acceptance remains unmet.

## HOST-03 captured stream-json caller policy (2026-10-07)

**Source-implemented/static-checked only; mock-tested false; production-tested false.**
Completes only the selected ChildProcessSpawner call-site prerequisite. The original
persisted-image aggregate checkbox remains unchecked for its later acceptance audit;
no proof is issued or delivered and no subsequent source/test task is executed.

`ChildProcessSpawner.spawn` now passes its captured main-only `withholdProviderOutput`
argument to the actual `buildStreamJsonMessage` call. That builder passes the same
policy through `parseDataUrl` into `resolveToBytesSync` before persisted-reference
resolution. The prior helpers' fixed errors reach the existing spawn catch, which
publishes only `PrivateMcpSpawnFailed` to logger/Sentry for prepared runs. No public
ProcessConfig/IPC/model switch, new utility/registry/logger or inferred string policy
was introduced. Successful stream JSON, image bytes/base64/media type/order, prompt,
argv and environment retain their existing construction by source inspection.

Immediate stdin-error publication now branches on the captured error policy before
accessing native `code`, including EPIPE, or formatting the native error. Private
stdin errors publish the fixed `PrivateMcpSpawnFailed` with session metadata only.
Ordinary stdin EPIPE/debug and non-EPIPE error/code behavior remains unchanged.
Windows spawn-log prompt previews are also omitted for captured private runs;
Windows remains excluded from prepared proof lifetime admission.

| Inspected boundary                                         | Actual coverage and remaining gates                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stream-json resolver/parser/builder                        | Captured policy now reaches the actual persisted resolver. Private preparation/iteration/serialization throws are normalized by helpers and the existing spawner catch without inspecting causes. Ordinary calls still pass false.                                                                                   |
| Native stdin/stdout/stderr/error/close and listener errors | stdin no longer reads a private native error code. Existing captured fixed-error branches cover stream/native/listener/exit failures; provider output remains completely withheld before conversion/parsing/buffering, with empty raw-stdout liveness only.                                                          |
| Pre-spawn image/prompt callbacks                           | Existing image staging receives captured policy. Exceptions before the spawner's native try reach the prepared ProcessManager catch, which throws fixed ProcessRunUnavailable without inspecting the cause. Custom callback/executable trust remains an issuance prerequisite.                                       |
| Post-spawn builder or stdin failure                        | Fixed publication is covered, but the spawner catch returns failure after registering a child, before prepared ProcessManager captures ownership. That failure may leave a child running. An explicit unchecked exact-child rollback task is inserted before proof issuance; no resource-lifecycle acceptance claim. |
| SSH/PTY/SDK/direct/custom consumers                        | Existing prepared lifetime denies SSH/PTY/shell/unsupported providers/process.execPath wrappers; ordinary SDK/SSH/CLI/direct image consumers acquire no proof authority. Arbitrary custom executable verification and preparation bypass audit remain incomplete; proof delivery stays gated.                        |
| External disk/history/debug and Cue                        | Independently read/published provider content remains outside this call-site policy. Existing unchecked broader audits and Cue lifetime/publication work remain mandatory.                                                                                                                                           |

No substring redaction, useful-output policy relaxation or raw fallback was added.
Deferred HOST-03 creation/HOST-05 execution must exercise the actual prepared
ProcessManager/spawner/builder/parser/resolver composition with synthetic children
and files only: exact successful input/nonmutation, inline/persisted/missing images,
hostile native code/message/cause getters, synchronous builder/iteration/write/end
failure, private vs ordinary EPIPE diagnostics, captured policy across concurrent
and replaced runs, no image reference/cause in logger/Sentry, complete split-stream
withholding and unsupported delivery refusal. Exact-child rollback requires its
separate source implementation before corresponding tests. No permissive helper or
projector result mocks. Tests created/executed: **0/0**.

Host API **1.16.0**, SDK **0.11.0**, Relay minHostApi **1.22.0** unchanged. Public
mail SDK/setup/Cue wiring and normal before-push acceptance remain incomplete.

## HOST-03 prepared-child rollback prerequisite (2026-10-07)

**Implemented, static-checked only.** This section supersedes the earlier
stream-json audit row that described post-spawn rollback as unavailable. It does
not admit proof delivery, establish runtime security, or complete the public mail
contract. Source-task delta is three existing modules, **306 additions/162 deletions
(468 changed source lines)** against the task-entry snapshot, including indentation
from extending the existing preparation try/catch.

`ProcessManager.spawnWithRunLifetime` now receives the actual managed child,
original native child and generation through a host-only capture callback before
stdin preparation. Its private publication/stop ownership is installed immediately;
post-return checks keep that original capture rather than discovering another
entry under the session ID. Aborted preparation cannot become running authority.
The host-only rollback callback still refers to the original child after session
reuse; the canonical kill retry requires exact managed-object and child ownership.
A failed spawn no longer emits a successful `spawn` capture event. No configuration,
IPC, model flag, SDK method, token/file getter or new registry/timer is introduced.

`ChildProcessSpawner` retains the returned native child before parser/registration
work and installs a private native-error handler during partial setup. The extended
try/catch covers temp-image/prompt preparation, native spawn, parser/registration,
stream-json construction and stdin write/end. On prepared failure it permanently
fences output and the captured lifetime before callbacks; removes only its own
listeners; requests immediate SIGKILL on the original still-running POSIX child;
destroys its streams; schedules canonical private temp-image cleanup; and settles
through the existing private ExitHandler path at most once. A synchronous stdin
error cannot be followed by `end` on the rolled-back child. Late data/error/close
callbacks remain fenced, with inert native error consumers preventing unhandled
late errors. Private causes are never inspected or returned; errors stay fixed.
Ordinary successful native args/env/JSON/bytes and output routing are unchanged;
ordinary errors thrown before the original native try remain thrown.

Rejected/throwing termination is reported as `PrivateMcpSpawnFailed` without a
native cause. A registered child still observed running remains tracked until a
one-shot close settlement, with inactive authority and discarded buffers; the
manager can retry canonical kill only while it owns that exact original child.
A submitted signal is not a runtime observation of OS termination. Synchronous
native spawn failure with no returned child provides no handle to signal; no
claim is made about an inaccessible native process. Image unlink is asynchronous
and failure is reported by the existing private cleanup policy; deletion success
has not been runtime-tested. Prepared ingress still excludes Windows/SSH/PTYS/SDK
and unsupported providers; custom executable trust and external transcript/disk/
history/debug publishers remain separate issuance gates.

The existing exact-object private buffer disposal is factored into
`ExitHandler.discardPrivateOutput`, shared by rollback and exit settlement. It runs
before and after rollback callbacks, and even for a superseded failed object;
notification/map deletion still requires the existing generation/ownership checks.
A reentrant successor's listeners, images, buffers, child and map entry are not
selected for failed-child cleanup. Successful ordinary disposal is unchanged.

Validation: strict main typecheck, targeted Prettier and zero-warning ESLint,
tracked and task-local whitespace review. Tests created/executed **0/0** by this
source-only checkbox; actual synthetic composition/hostile throw/reentry/concurrent/
ordinary tests are explicitly deferred to HOST-03 creation and HOST-05 execution.
No provider/proof-file/native/keyring/mail runtime, dependency installation, real
credential retrieval/login, upstream merge, callback or Discord operation. Host API
**1.16.0**, SDK **0.11.0**, Relay minimum **1.22.0** unchanged. Proof issuance and
full mail acceptance remain blocked. No staging, commit, push or PR.

## HOST-03 persisted-image composition acceptance audit (2026-10-07)

**Implemented and static-checked only; mock-tested false; production-tested false.**
The original persisted-image/stream-json diagnostic checkbox is now complete after
its helper, captured caller-policy and exact-child rollback prerequisites. This
entry supersedes their historical pending-call-site/rollback descriptions above.
No source changes were needed in this acceptance audit; no proof is issued.

Actual local composition is ProcessManager's captured main-only prepared policy
→ ChildProcessSpawner → buildStreamJsonMessage → parseDataUrl → resolveToBytesSync.
Image staging independently passes the same captured policy through
saveImageToTempFile → parseDataUrl → resolveToBytesSync. Async image cleanup keeps
its captured policy after settlement. Private resolution/parsing/serialization
failures use fixed errors before native code/message/cause/getter inspection or
missing-reference logging; the native spawn boundary publishes fixed
PrivateMcpSpawnFailed. Exact-child ownership/rollback now precedes stdin JSON
preparation. Ordinary helper defaults and construction of successful image
bytes/base64/media type/prompt/JSON/argv/env are unchanged by this audit.
These are source inspection findings, not observed runtime/security regressions.

Audited all actual helper call sites. SSH wrap-spawn-for-ssh and
ssh-command-builder remain ordinary callers; the prepared lifetime rejects SSH,
PTY/shell, unsupported providers/platforms and process.execPath. OpenCode SDK image
staging, CLI/browser/export/data-URL resolvers and direct helpers receive no run
proof or invocation authority. There are no production spawnWithRunLifetime call
sites on this branch, and handle-spawn/Cue issue no proof. This absence of delivery
is the current gate for ordinary/custom paths; it does not authenticate arbitrary
custom executables. Future issuance must deny unverified wrappers/custom binaries
and direct delivery bypasses under the separate preparation/audit tasks.

Complete provider-output withholding remains required. External provider disk,
transcript/session-storage/history/debug publishers, upstream custom preparation
and Cue's independent lifetime/output remain separate unchecked gates. No global
privacy, useful-output, proof-delivery or public mail acceptance claim follows.
Deferred actual composition/nonmutation/hostile-getter/concurrent/ordinary and
rollback tests remain HOST-03 creation/HOST-05 execution. No new helper, public
flag, permission, API/version, source/test change or runtime was introduced.

### HOST-03 provider diagnostic/output composition acceptance audit (2026-10-07)

**Audited and statically checked only; source changes 0 files/0 lines, tests
created/run 0/0; mock-tested false, production-tested false.** The previously
unchecked provider publication checkbox is now satisfied by its completed
prepared-lifetime, output-withholding, private-exit and rollback prerequisites.
No duplicate handler policy, logger, registry, utility or DTO field was added.
This entry supersedes earlier descriptions of that checkbox as pending; all
separate upstream/Cue/external-reader/issuance gates remain unfinished.

Actual production-shaped composition, inspected without starting it:

- `ProcessManager.spawnWithRunLifetime` captures host-only withholding and passes
  it through `spawnProcess` to `ChildProcessSpawner`. Ordinary `spawn` passes false.
  Prepared run ownership is exact child/object/generation, independent of reusable
  session IDs; its publication policy survives authority stop. No production
  caller invokes this seam or supplies a run proof yet.
- `ChildProcessSpawner` drains prepared stdout without UTF-8 decoding or chunk
  conversion, emits only an empty `raw-stdout` payload and never calls
  `StdoutHandler`. Stderr returns before conversion/`StderrHandler`. Rollback and
  generation guards suppress late callbacks. Split, encoded or interleaved echoes
  cannot publish even a path fragment through these ingress callbacks. This is
  complete withholding, with no provider-text accumulator or permissive fallback.
- Consequently StdoutHandler's JSON/legacy/batch/ANSI/error paths and
  StderrHandler's previews, buffers, parser/SSH detection, Codex tracing and text
  fallback receive no prepared provider content. Neither parsing nor usage/tool/
  thinking/session/result publication happens for such a run. The canonical
  main-private `getParser`/`parseLine` accessors have no production prepared producer
  and are not independent privacy guards; future callers must preserve admission.
- Both existing raw subscribers were inspected: group-chat peek in
  `process-listeners/data-listener.ts` receives an empty chunk; the dedicated
  liveness listener consumes only session identity. Existing data/forwarding/
  error/plugin/exit listeners receive no provider content from prepared ingress.
  Fixed agent errors carry no raw provider cause; query/exit notifications retain
  host-owned metadata/code. This does not globally clear unrelated or pre-existing
  downstream per-session content or protect a future arbitrary EventEmitter call.
- Private close and rollback use captured `ExitHandler.handleExit(..., true)`;
  they bypass all ordinary exit previews, provisional errors, batch/raw/streamed
  result fallback and Copilot disk reconciliation. Exact-object residual buffers
  and their timer are dropped before/after notifications, including throwing or
  reentrant listeners; private settlement never flushes DataBufferManager. The
  fixed unavailable-output error avoids representing code-zero output as a usable
  answer unless the run was deliberately interrupted/already errored.
- Captured prepared native/listener errors use canonical `PrivateMcpSpawnFailed`
  before logger/Sentry, without inspecting/stringifying native causes. Child
  errors take exact rollback instead of ordinary raw `handleChildError`. Actual
  injector configuration, native argv/env/stdin and ordinary diagnostics remain
  unchanged; the bounded frozen canonical publication projector is not executed
  or treated as proof authority. No secure erasure of immutable/native data is
  claimed.

**Proof issuance remains blocked.** Separate unchecked tasks retain upstream
preparation/IPC diagnostics, external provider transcript/session/disk/debug/
history readers, independent trusted executable selection, Cue output/polling/
result/history and exact-run lifetime, production proof delivery and public mail
wiring. Prepared admission refuses Windows/PTY/SSH/shell/SDK/unsupported providers;
Claude/Codex slug admission alone does not authenticate a custom binary/wrapper.
No end-to-end proof channel or full mail acceptance follows from this audit.
Host API 1.16.0, SDK 0.11.0 and Relay minimum 1.22.0 remain unchanged/incompatible.

Deferred actual-composition tests must cover canonical injector/projector/manager/
spawner/handlers with synthetic children: split/encoded/interleaved chunks; no
conversion/parser/buffer/provider event content; empty liveness versus peek;
hostile native/listener errors without getter/cause access; residual buffer/timer
and reentrant query/error/exit cleanup; partial setup and rollback; concurrent/
replaced generations; exact executable nonmutation and ordinary MCP/no-proof
regressions. No permissive handler/projector replacement proves the gate. Test
creation remains HOST-03, execution/full Host/SDK/Cue/repository gates HOST-05.
Receipts and boundary inventory:
`.maestro/verification/host-03-provider-output-completion/`.

## HOST-03 prepared spawn-event publication prerequisite (2026-10-07)

Implemented source-only in `src/main/process-manager/ProcessManager.ts`, after
observing a separate publisher outside child stdout/stderr: `spawn` emitted the
entire executable `ProcessConfig` even for captured prepared runs. This context
completes one newly split prerequisite (18 added/1 removed source lines); the
broader upstream preparation/external-reader audit remains unchecked. No proof
is issued or delivered, no runtime or tests were executed, and no full privacy
or mail acceptance claim follows.

The existing main-private `withholdProviderOutput` parameter selects a closed
`ProcessConfig`-checked publication object before child preparation/native
callbacks. It includes only `sessionId`, `toolType`, `cwd`, `tabId`, `projectPath`,
empty `command` and empty `args` placeholders. Both object and its independently
allocated empty args array are frozen. There is no spread or executable-input
reference: prompt, images, callbacks, shell configuration, args/env, and unknown
fields are excluded, regardless of delivery flag spellings or chunk boundaries.
The host-selected correlation metadata remains available; these fields are not
an authorized channel for proof delivery. The actual `configWithCoworkingSession`
and native args/env/stdin keep their prior values. Ordinary no-proof spawn events
still publish the same existing config object. Failed spawns still publish none;
subscriber exceptions retain the existing guarded best-effort event behavior.

Actual subscribers audited:

- `src/main/agent-run/setup-capture-listener.ts` reads session/tool/cwd/tab/project
  metadata and prompt, then feeds `capture-service.ts` and broadcast/store paths.
  Prepared events now have no prompt or private execution config to ingest;
  ordinary capture retains its prompt. `producers.ts` uses captured cwd/project
  for existing exit enrichment; that metadata remains present.
- `src/main/process-listeners/dispatch-callback-listener.ts` consumes only
  sessionId; its correlation behavior is preserved without invoking any callback
  or changing callback registration in this task.
- No other production ProcessManager `spawn` publisher or subscriber was found
  by the recorded source search. Future subscribers receive the same frozen
  closed object. This event payload is publication, not executable config or
  invocation authority.

Remaining uncovered boundaries (inventory, not completion):

| Boundary                                  | Current evidence and retained gate                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interactive upstream delivery/preparation | `handle-spawn.ts` builds ordinary MCP specs, performs asynchronous config/image/permission-relay preparation, logs prompts and catches some raw failures; `process.ts` wraps its IPC boundary. No `spawnWithRunLifetime` production caller or runTokenFile injection exists there. Its future proof-bearing caller must capture private policy before preparation and normalize all failures; this source task does not fence those publishers.                                                               |
| External provider disk/transcript readers | `storage/claude-session-storage.ts` and `storage/codex-session-storage.ts` independently read provider files and publish parsed messages/errors. `ipc/handlers/agentSessions.ts` serves messages/session paths and performs direct file reads; renderer `hooks/agent/useAgentSessionManagement.ts` resumes/backfills those messages into tab logs/history. Dropped child stdio does not protect these readers, persisted provider configuration or transcripts. They remain a pre-issuance audit/policy gate. |
| Host/plugin history and debug             | `plugin-host-handlers.ts` projects fields from `readSessionTranscript` for `transcripts.read`; renderer/main history, AgentRun enrichment and support-package log readers are independent sinks. This task removes executable config/prompt from the prepared spawn event only; existing historical/disk/log contents and their errors are not proven private.                                                                                                                                                |
| Unsupported delivery                      | Prepared admission excludes Windows, SSH, PTY, shell, SDK/unsupported providers and process.execPath wrappers. Arbitrary custom executables/callbacks need trusted host selection before issuance. Ordinary/direct spawn acquires no proof authority; there is no safe custom/wrapper bypass established by event withholding.                                                                                                                                                                                |
| Cue and useful output                     | Cue has independent output/polling/result/history/preparation/lifetime paths and separate unchecked tasks. Complete provider withholding remains the current prepared child policy; no substring-redaction or useful-output policy is enabled.                                                                                                                                                                                                                                                                |

Deferred HOST-03 test creation/HOST-05 execution must exercise the real
ProcessManager/spawner/capture composition with fake children: exact closed keys,
empty command/args, missing prompt/env/images/unknown fields, frozen top-level and
nested array, listener mutation/throw/reentry, synchronous stop/replacement,
concurrent prepared/ordinary isolation, no event on failure, preserved capture
correlation and absent prepared prompt, exact executable argv/env/stdin
nonmutation, opaque config and split-stream echoes, and ordinary event identity/
prompt regressions. Static strict main type, source formatting, zero-warning
ESLint and whitespace checks are recorded in both evidence ledgers. Tests
created/executed **0/0**. Host API **1.16.0**, SDK **0.11.0**, Relay minHostApi
**1.22.0** unchanged; compatibility/full mail acceptance remain unmet.

### HOST-03 private MCP strategy admission prerequisite (2026-10-07)

**Implemented/static-checked only; tests created/run: 0/0.** The canonical
`buildMcpInjection` now captures the selected `runTokenFile` and strategy once.
Explicit non-string or empty file values produce the existing fixed
`Invalid MCP proof file` error. Any explicit file with `verified !== true` or
with a strategy other than `claude-mcp-config` / `codex-config-override` produces
`PrivateMcpSpawnFailed` before environment copying, JSON/TOML serialization or
`opts.join`/temporary configuration construction. Marking a file-based strategy
verified cannot opt it into proof delivery. Omitted paths preserve ordinary
strategy behavior, including the reserved empty bridge environment entry.
Verified inline/override ordering and executable values remain the same; no
input mutation, utility, type, permission, API version or authority was added.

This is strategy admission, not filesystem validation: canonical path, owner,
mode, exact registry authority and resource lifecycle still belong to the actual
issuer/reader/manager. A capability flag or successful configuration build does
not establish provider executable trust, output privacy or authorization.
The builder emits neither a proof resource nor bearer bytes.

| Audited boundary        | Actual status and remaining prerequisite                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical configuration | Unverified, OpenCode/file-based and unknown strategies refuse explicit files. Supported inline/override construction is the only admitted shape.                                                                                                                                                                                                                             |
| Production caller       | `src/main/ipc/handlers/process/handle-spawn.ts` contains the two production builder calls, both using an ordinary spec without `runTokenFile`; local/verified/non-interactive checks are present. No production proof issuance or prepared-run caller was added. Its preparation logs/async failure/IPC publishers remain unaudited for actual proof-bearing composition.    |
| Interactive execution   | `spawnWithRunLifetime` still refuses SSH, PTY, shell, unsupported platform/provider and Electron-wrapper paths. Direct ordinary spawn/SDK/custom executables are not a verified delivery path; this builder cannot detect or authorize their execution. Existing complete prepared output withholding stays in force.                                                        |
| Provider disk/history   | `src/main/storage/claude-session-storage.ts` and `codex-session-storage.ts` read provider files independently of stdio. `starred-transcript-mirror.ts` copies provider files; `plugin-host-handlers.ts` projects separately consented transcript reads. Dropped stdio does not prove these paths private. Production issuance remains blocked pending their reviewed policy. |
| Debug/export            | `src/main/debug-package/collectors/logs.ts` sanitizes published messages and drops data, but reads existing logs. This is not proof of upstream privacy or split/encoded echo containment.                                                                                                                                                                                   |
| Cue                     | `cue-spawn-builder.ts`, `cue-process-lifecycle.ts` and `cue-executor.ts` still own separate preparation, stdio buffers, polling, parser/results/provider-session extraction and callbacks. Their unchecked output/lifetime/issuance tasks remain required.                                                                                                                   |

Deferred HOST-03 test creation/HOST-05 execution must use the actual builder,
projector and eventual production composition with synthetic inputs only. Cover
both supported strategies, exact argv/TOML/JSON/env/order and frozen/nonmutation
regressions; absent versus empty/non-string explicit paths; every unsupported,
unknown or unverified strategy (including file-based marked verified); fixed
errors without path/token/native cause; denial before env getter, serialization
or join/file side effects; independently concurrent builds and ordinary no-proof
file/unknown strategy behavior. Capture path/strategy once across host input
accessors and mutation. Existing issuer/registry/lifetime/executable/private-output
checks must remain separate; no permissive builder mock establishes acceptance.
No source-task product tests, runtime/proof files, provider connection or new
production authority were created. Host API 1.16.0 / SDK 0.11.0 remain unchanged;
Relay minimum 1.22.0 and full mail acceptance remain unmet.

## HOST-02 focused transfer-decoding test creation (2026-10-07)

**Tests authored only; no mock-tested or production-tested claim.** Added
`src/__tests__/main/plugins/mail-transfer-decoding.test.ts` (406 lines), using the
actual consuming transfer module, shared base64 validator and header projector.
Static AST inventory counts 25 declarations / **119 parameterized cases**;
**0 tests executed**. Production source and public API remain unchanged.

The cases assert exact complete identity/base64/quoted-printable decoding,
case-insensitive exact encoding tokens, required tighten-only caps, empty parts,
24 MiB literal overflow and exact 8 MiB decoded identity ceiling, physical-line
and decoded-output boundaries, and refusal before output allocation. They cover
high-byte/NUL/CRLF restrictions, strict base64 alphabet/quantum/padding/pad bits
and arbitrary supported CRLF wrapping, quoted-printable uppercase escapes,
literal underscores/internal whitespace, hard/soft breaks, trailing whitespace,
dangling/truncated/malformed input and overlong lines without fallback.

Ownership assertions include consumed input and alias erasure on success/failure,
independent returned bytes, failed native base64-result allocation erasure,
quoted-printable fill-pass failure erasure, and fixed errors without native causes
or private content. Narrow `Buffer.from`/`Buffer.alloc` spies observe preallocation
refusal and simulate hostile allocation outcomes; `afterEach` restores them.
No parser/decoder/projector is replaced. Actual RFC 2047 B/Q UTF-8/ASCII/Latin-1,
adjacent-word and underscore behavior is asserted through header projection.

Static strict type-check includes the test plus the existing entire main/shared
source under `tsconfig.main.json`; formatting, repository test ESLint pass and
whitespace checks passed (exit 0). Receipts, inventory and scope hashes are under
`.maestro/verification/host-02-transfer-tests/`. This is test creation, not evidence
that the cases pass at runtime. Account/transport/TLS/keyring/verified identity,
MIME structure and authorized read/snapshot composition coverage remain in the
unchecked broad HOST-02 test task. HOST-05 must execute these tests plus required
Host/SDK/Cue/repository gates in a later context. No source or production state,
mail setup/login, API/SDK version, monitor/event/Cue subscription or PR changed.

### Authored focused charset security tests (HOST-02 prerequisite, 2026-10-07)

Added `src/__tests__/main/plugins/mail-text-decoding.test.ts` only: **396 lines,
23 declarations / 152 statically counted parameterized cases**. **Tests executed:
0**; these are authored assertions, not runtime or mock-tested acceptance.
Production source, public SDK/RPC/version and production injection are unchanged.

The tests import the actual plain consumer, shared charset/character core and
header projector. Synthetic fixtures cover exact/tightened/maximum byte caps,
refusal before text construction, preserved empty/ASCII/multibyte/combining text,
required exact charset tokens, no Latin-1 body fallback, malformed UTF-8 without
replacement, ASCII high bytes, forbidden controls/BOM/bidi/separators/surrogates,
consumed input alias erasure on success/error, non-consuming core ownership,
true Latin-1 UTF-8 expansion and actual RFC 2047 B/Q/header regressions. Observing
spies on native text construction retain the actual implementations and restore
after each test; there is no replacement decoder, projector or result mock.
Malformed native UTF-8 errors must become fixed errors without cause/content.

Final Prettier, strict main/shared-plus-test typecheck, configured test ESLint and
whitespace/scope checks are recorded in
`.maestro/verification/host-02-text-tests/`. Initial test-table inference and an
intentional invalid-argument cast required correction; all final checks exit 0.
Full transport/account/MIME/verified integration/security tests and HOST-05 suite
execution remain unchecked. This synchronous seam alone supplies no account,
caller, grant, deadline or publication authority; JavaScript strings cannot be
erased. Full mail acceptance is still unmet; production testing is out of scope.

### Authored MIME header security tests (HOST-02, 2026-10-07)

Created `src/__tests__/main/plugins/mail-mime-headers.test.ts`, **441 lines,
21 test declarations / 143 statically counted cases**. Inventory is computed
with the TypeScript AST only: no test module evaluation/import or suite execution.
**Tests executed: 0**; no runtime pass/fail count or mock-tested acceptance.
Production source changes in this task: **0**. All existing source/tests remain
unchanged. This completes only the newly split MIME-header test-creation checkbox;
the broad account/transport task and HOST-05 execution remain unchecked.

Authored synthetic fixtures exercise the actual consuming descriptor, canonical
header scanner and display projector, without permissive parser/result mocks.
They cover closed frozen supported leaf/container shells, explicit type, optional
part versus required root MIME-Version, exact case-insensitive/default tokens,
folding and discarded ordinary fields, selected duplicate/unknown Content-\* denial;
bounded parameter grammar, malformed/unknown/extended/duplicate parameters and
quoted escapes; name/filename agreement, unsafe labels and exact 128/129-byte
filename and 70/71-byte boundary limits. Complete ASCII/CRLF/header-only framing,
invalid ownership/root-flag shapes and exact physical-line/count/unfolded/64 KiB
limits (including discarded fields) have authored acceptance/refusal pairs.
Input alias erasure and fixed content-free normalized errors without native cause
are asserted; the hostile Buffer-method fixture affects only its synthetic input.
Actual folded B/Q display and closed display allowlist/duplicate/orphan regressions
are included. Strings remain unerasable; declared descriptors do not validate
payload bytes, sniff file formats or supply authority.

Final formatting, strict main/shared-plus-test no-emit typecheck, configured test
ESLint and whitespace checks exit **0**; initial typecheck exit **2** for a
parameterized table's tuple inference was fixed solely in this new test.
Commands/logs/inventory/CLI/scope receipts live in
`.maestro/verification/host-02-mime-header-tests/`. Full repository/SDK/Cue suites,
MIME traversal/content composition, transport/account/security/production wiring,
trusted setup/proof publication, SDK/RPC and event/replay acceptance remain
unfinished. No public API/version or production-tested claim changes here.

### Implemented credential queue-settlement state guard (HOST-02 split, 2026-10-07)

**Implemented/static-checked only; tests created/executed: 0/0.** The existing
host-private `MailAccountCredentials.committedAuthority` now accepts the existing
`MailCredentialAuthority` shape, allowing an active activity lease during queued
work and the captured live setup authority at completion. It never reuses the
released queue lease or creates a new principal, registry, queue or stop-latch reset.

`savePassword` and `mutateAccount` retain the actual canonical committed
configuration across queue settlement. After their existing final setup check,
they recheck that setup authority, its captured cancellation signal and sealed
configuration access, installation, target account revision and disabled intent
(or exact removal revision/absence of a live account) before returning success.
Target changes during queue cleanup, promise continuation or a reentrant setup
callback suppress success. Unrelated account/configuration changes are tolerated;
this is an exact target-state check, not whole-configuration object equality.
The existing `enableAccount`/`replaceAgentRights` completion guards are unchanged.

Completed removal through `mutateAccount` and retry through
`cleanupRemovedAccount` additionally require the current tombstone marker to be
`confirmedAbsent` at that final boundary. An intervening cleanup retry recording
`pending` cannot be reported as confirmed cleanup. The helper's default remains
false during queued pending/delete/readback/confirmation work, so the existing
pending-before-native and confirmation-after-readback ordering is preserved.
The final check does not repeat native credential access or deletion. Signal
cancellation is also checked after the final synchronous canonical read.

All denial uses existing fixed content-free errors without native causes.
A final stale/canceled/revoked/persistence-failure response can occur after a durable
mutation and native credential operation succeeded. No rollback, secret erasure
for JavaScript strings, credential-readiness, multi-process atomic publication or
success guarantee beyond this host boundary is provided. Refresh trusted stored
state before retrying; future external publication needs its own live authority.
Existing account/plugin/global stop latches remain permanent as before; a failure
outside the already-settled queue does not invent a new activity mutation.

Deferred security test creation must exercise these actual methods, canonical
queue/sealed fake store/anchor/keyring, and captured setup callback/signal with
synthetic credentials only. Cover target changes during queue cleanup and after
settlement; stale revisions/enable/settings/policy/removal, canceled and reentrant
revoked setup, anchor/persistence denial and fixed errors. Cover confirmed removal
followed by another pending retry, unchanged removal revisions, unrelated account
changes that still succeed, no repeat native access, existing lease release/stop
latches, durable successful mutation with suppressed response and normal success.
Do not replace the queue, guard or mutation result with permissive mocks.
Tests remain the separate HOST-02 creation and HOST-05 execution tasks.

Final source formatting, strict main no-emit typecheck, configured ESLint and
whitespace checks are recorded in
`.maestro/verification/host-02-credential-settlement/`; final checks exit 0.
Source delta: one existing module, 27 added/9 removed lines. No setup production
proof/injection, SDK/RPC/broker/version, mail monitor/event/Cue or public API is
added. Host API 1.16.0 / SDK 0.11.0 / Relay minimum 1.22.0 remain incompatible;
overall lifecycle and mail acceptance remain unmet.

### Authored complete MIME traversal security tests (HOST-02 split, 2026-10-07)

Created `src/__tests__/main/plugins/mail-mime-structure.test.ts`: **457 lines,
19 test declarations / 72 statically counted cases**. Inventory uses TypeScript
AST parsing only, without module evaluation. **Tests executed: 0**. This completes
only the new bounded test-creation prerequisite, not the broad lifecycle/security
checkbox, HOST-05 suite execution or mail acceptance. Production source changes: 0;
all pre-existing source/tests are hash-verified unchanged.

Synthetic complete sources exercise actual `consumeMailMimeSource`, descriptor
and shared scanner, without permissive parser/result mocks. Authored assertions
cover closed frozen tree/header/child shells; ordered nested mixed/alternative
parts and disjoint sibling boundaries; exact opaque encoded leaf ownership,
binary bytes and labels without decoding or content validation; delimiter-owned
CRLF, empty parts, final close at EOF/CRLF, exact case and 1/70-byte or spaced
boundaries. Invalid root version/type/framing, preamble/epilogue/padding/truncation,
ancestor equality/prefixes and unsupported/ambiguous later children reject whole
trees before leaf allocation; no skipped HTML alternatives or partial success.

Exact acceptance/refusal fixtures pin the 24 MiB source, 64 KiB per-header search,
256 KiB aggregate headers (including discarded fields), depth 16, 32 leaves and
64 nodes independently. The aggregate scan and leaf-byte guards remain canonical;
they are not independently exhaustible under the source/depth/disjoint-leaf limits,
and no runtime coverage of those branches is claimed. Authored erasure assertions
include source aliases, actual temporary header/marker copies on success/refusal,
and failed/prior leaf allocations after synthetic native allocation/copy errors.
Narrow Buffer instrumentation is restored by afterEach. Fixed errors exclude raw
native messages/causes. Successful encoded buffers remain caller-owned mutable
bytes and must be erased by the caller; JavaScript strings cannot be zeroized.

Final source formatting, configured test ESLint, strict main/shared-plus-test
no-emit typechecking and tracked whitespace checks exit **0**. Commands, logs,
AST inventory, CLI observations, baseline hashes and task/document patches live in
`.maestro/verification/host-02-mime-structure-tests/`. Existing dependencies were
reused through a temporary worktree-local node_modules symlink, removed before
settlement; no install/shared dependency mutation. Tests were authored only:
no transport/account/authority/proof/provider/keyring/storage/mail runtime, decoded
body/attachment DTO, SDK/RPC/Cue/publication or production-tested claim. Full
security suites and normal repository/SDK/required Cue gates remain HOST-05.

## Focused MIME content composition tests authored (2026-10-07)

`src/__tests__/main/plugins/mail-mime-content.test.ts` adds **497 lines,
15 declarations / 55 statically counted cases**, via TypeScript AST parsing only.
**Tests executed: 0**; creation and execution remain separate. No runtime,
mock-tested or production-tested claim. Every pre-existing source/test is
SHA-256 verified unchanged; only this HOST-02 prerequisite is completed.

Authored synthetic complete sources exercise actual traversal/descriptor/transfer/
charset composition without permissive parser/consumer mocks. Coverage includes
empty/nonempty ASCII/UTF-8 bodies and exact UTF-8 sizes, body absence vs empty,
named/attachment text separation, unverified sender-declared binary labels and
supported transfers, nested source order/unique numeric paths and root ID, closed
frozen shells and independent caller-owned mutable attachment bytes. Mixed
multiple bodies reject; alternatives select the last complete body (including
empty) while every discarded/nested candidate is validated/counted and invalid,
unsupported or attachment-containing children cause whole-source refusal.

Exact acceptance/refusal fixtures cover 256 KiB aggregate body candidates,
16 attachments including empty leaves, 8 MiB per attachment and 16 MiB aggregate,
empty parts after byte-budget exhaustion and observed rejection before decoded
allocation. Source/depth/leaf/identity-line overflow guards retain the canonical
raw/structural/transfer policy. Actual Buffer observations assert source/encoded/
header/marker/body-temporary erasure, successful attachment ownership and cleanup
of earlier/failed attachments on later protocol/limit or narrow synthetic native
allocation/fill failure. Instrumentation is restored after each test. Fixed
errors omit raw content/native causes; labels are not file-format proof and
JavaScript strings cannot be zeroized. No public DTO/cache/chunk/read-authority/
publication acceptance or changed decoder/header/structure behavior is implied.

Final formatting/configured test ESLint/strict main/shared-plus-test no-emit
checks exit **0**; initial Buffer-overload observation typing diagnostics were
corrected in the test. Initial/final logs, exact commands/cwd/exits, AST inventory,
source hashes, CLI observations and document/task patches are in
`.maestro/verification/host-02-mime-content-tests/`. Full repository/Host/SDK/Cue
suite execution remains HOST-05. Temporary worktree-local dependencies are
removed before settlement; no install/runtime/mail/native/provider/credentials,
SDK/RPC/setup/Cue or other-checkout source/test/git operations. Full acceptance
and normal repository/production gates remain unfinished, with no commit or PR.

### Authored focused IMAP framing security tests (HOST-02 split, 2026-10-07)

`src/__tests__/main/plugins/mail-imap-framing.test.ts` contains **25 test
declarations / 97 statically counted parameterized cases**, **470 lines**. This
bounded prerequisite was split from the oversized transport/account security
creation task. Inventory parses TypeScript AST only: **tests executed: 0**.
No runtime pass/fail, mock-tested or production-tested acceptance is claimed.
Production source changes: **0**; baseline hashes verify all pre-existing source
and test files unchanged. Only the new framing prerequisite is checked.

Authored fixtures exercise the actual incremental `ImapResponseDecoder` with
synthetic buffers, without replacement parsers or permissive result mocks:

- Every two-chunk split and byte-wise streaming of ordered status/FETCH/completion
  records; binary/empty/multiple literals, independent transferred ownership and
  unchanged input. Status text and quoted braces/parentheses remain opaque.
- Restricted status/count/search/flags/FETCH framing; strict ASCII/CRLF outside
  literals; unsupported extensions, continuations, numeric overflow, invalid
  tags, quotes/escapes/literal markers and unbalanced structure fail closed.
  Semantic command/tag/UID/section acceptance remains the separate session gate.
- Tighten-only constructor caps, exact 64 KiB lines including CRLF, exact 24 MiB
  opaque literal and over-ceiling preallocation refusal, tightened exact literal
  and total-wire budgets, canonical response/literal-count/depth boundaries and
  lowered structural ceilings. Literal cap changes require response boundaries,
  permit zero and retain cumulative wire/response budgets and constructor ceiling.
- EOF/cancel/permanent closure, malformed-chunk atomic failure and same-chunk
  literal erasure, earlier transferred ownership, pending/current literal and
  line erasure. Narrow restored allocation/copy failures use actual Buffer work
  and assert fixed framing errors without native cause or peer content.

Strict main-plus-new-test typecheck, Prettier check, configured test ESLint pass
and tracked/new-file whitespace/scope checks pass. The test ESLint config enables
only the repository's dash rule; it is not a full semantic lint pass.
Exact argv/cwd/exits, AST inventory, baseline/document snapshots, source-preservation
and task/document/test patches are in
`.maestro/verification/host-02-imap-framing-tests/`.
HOST-05 must execute tests and normal required gates; command semantics, TLS/session,
sealed account/credential/activity, invocation, publication/setup/SDK/Cue/production
acceptance remain unfinished. No versions/capabilities changed: host **1.16.0**,
SDK **0.11.0**, Relay minimum **1.22.0**. No install, live login or PR.

## HOST-02 configured-account connection test creation (2026-10-07)

Authored `src/__tests__/main/plugins/mail-imap-connection.test.ts`: **498 lines,
22 declarations / 75 statically counted cases**, tests executed **0**. The actual
endpoint validator, configured connection, canonical EgressGuard/socket lookup,
certificate hostname checker and greeting framing compose with injected synthetic
resolver/EventEmitter socket; no guard/parser/connection-result replacement.
Assertions cover trusted field projection, host/port/IP aliases, authority/config/
ID/deadline admission, preflight private/mixed/empty/error/blocked-port denial,
actual lookup rebinding/revocation/port checks, exact TLS options and SNI/hostname
validation, pre-secure buffering/split/invalid/over-limit greetings, native errors/
EOF, cancel/late DNS/deadlines, terminal cleanup and account/plugin admission caps.
Timers/performance and sockets are synthetic; no cryptographic handshake, real DNS,
LOGIN, network, keyring or runtime call occurred. These assertions are **authored**,
not mock-tested or production-tested. Fixed-session command state/result ownership,
authentication budgets and credential/account/reader/security composition remain
in the broad HOST-02 task; HOST-05 retains suite execution and normal SDK/Cue gates.
Scoped formatting/strict main/shared-plus-new-test TypeScript/dash-rule ESLint and
tracked whitespace checks exit 0. Initial test-local TypeScript errors were fixed
without production edits. Receipts/static inventory/source hashes/CLI observations:
`.maestro/verification/host-02-imap-connection-tests/`. Host API 1.16.0, SDK 0.11.0,
Relay minimum 1.22.0 remain unchanged; overall acceptance remains unmet.

## Verified read lease-release completion guard (HOST-02, 2026-10-08)

Implemented host-private source only in `mail-invocation-reader.ts`,
`authorization-ledger.ts` and `mail-account-activity.ts`: **108 added / 10 removed
source lines across three modules**, relative to this task's captured dirty baseline.
The first unchecked lifecycle task was oversized; this bounded prerequisite was
inserted immediately before it. The full lifecycle and security test tasks stay
unchecked. See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

Non-snapshot verified header display, body, manifest, reference search and complete
attachment reads now release their original outer lease before final success.
Release aborts synchronously; the canonical release-safe completion gate then
checks account/plugin/global failure latches and pending mutation admission before
and after live authority work, without allocating state or acquiring a fresh lease.
The shared sealed-ledger read guard checks stored exact account/revision/enabled
intent and independent agent right again after its final host callback. Admission
uses the same strengthened guard. No released lease is asserted or recovered.

The facade reuses its captured exact installation/account/revision/mailbox check,
verified invocation and mandatory host policy callback, with caller cancellation
and the original monotonic lifetime. A final callback-free lifetime check catches
synchronous sealed checks that overrun. Unrelated account changes are tolerated;
target changes, unavailable anchored persistence, caller/policy loss and retained
activity latches suppress success. No durable state is rolled back or I/O repeated.
Selected attachment bytes remain privately owned until this final guard succeeds;
denial erases them. Successful bytes transfer to the trusted host recipient, which
still owns erasure and fresh later publication authorization. Header/body/label
JavaScript strings cannot be zeroized.

Snapshot mode retains its original outer lease, reservation, cancellation wiring
and ownership; it does not enter this released-read gate. No public SDK/RPC/API,
versions, manifest/capability policy or production caller/setup injection changed.
This gate confers no new read admission, credential, network or publication
permission. Public DTOs/handles, trusted setup/policy, lifecycle/cleanup wiring,
monitors/events/Cue and production mail acceptance remain unfinished; Backstage
implementation/integration/installation remains paused.

Static Prettier, strict main/shared/type TypeScript, configured source ESLint and
tracked whitespace checks each exit **0**. **Tests created: 0; tests executed: 0;
images analyzed: 0**. This is implemented/static-reviewed only, not mock-tested or
production-tested. Synthetic actual-composition regressions are recorded in the
current HOST-02 document for a later test-creation task. Receipts, dirty-baseline
hashes, exact patches and CLI identity observations are in
`.maestro/verification/host-02-read-release-completion/`. HOST-05 acceptance and
normal required gates remain unmet; no commit, push or PR.

## Queued setup mutation completion latch gate — 2026-10-08

Implemented and statically checked only. `MailAccountActivity.assertCompletion`
generalizes the existing released-read latch check; `assertMailReadCompletion`
still uses the same canonical guard. `AuthorizationStore.assertMailMutationCompletion`
uses that guard after the original mutation queue settles, without allocating
activity, acquiring/asserting a released lease or resetting any stop latch.
It requires sealed plugin/dual identity ownership, exact installation and target
account/tombstone revision, expected account enabled intent or removal cleanup
marker, and captured setup cancellation before/after stored/native checks.
The mandatory captured setup callback (including live membership for rights
replacement) runs between committed-state checks; activity latches and pending
mutations are checked before/after the callback. Failures remain content-free.

All five queued `MailAccountCredentials` operations use this final boundary:
password save, enable, rights replacement, disable/settings replacement/removal,
and removed-slot cleanup retry. Removal and retry retain the actual anchored
`confirmedAbsent` configuration for final comparison. Unrelated-account changes
at completion are tolerated; target changes, pending work, failed account/plugin/
global activity and cancellation suppress success. In-work native probe/write/
delete/confirmation ordering is unchanged. Terminal committed account/removal
revisions are permitted for completion only, never new mutation admission.
Historical credential-settlement descriptions above are superseded by this
canonical latch-aware gate; `committedAuthority` remains an in-work lease guard.

No setup principal is minted, policy is not injected into a public API, and no
credential is probed again at completion. This adds no store, queue, timer,
rollback, operational-readiness claim, SDK/RPC/broker/event/Cue or production path.
Runtime synthetic regressions remain deferred to the HOST-02 test phases. Full
lifecycle and production acceptance remain unfinished; Backstage stays paused.

## Synchronous stored-setup final cancellation gate (HOST-02, 2026-10-08)

Implemented and statically checked only. The existing synchronous
`MailAccountCredentials.listStoredAccounts`, `readStoredAgentRights` and
`addDisabledAccount` now check the captured setup signal after the final canonical
sealed configuration freshness comparison, immediately before returning. A signal
aborted during synchronous anchor/storage freshness readback cannot return success
when the stored comparison otherwise succeeds: the result is suppressed with fixed
`MAIL_CANCELED`. Existing stale/persistence errors retain their precedence when
freshness itself fails. The final gate invokes no host callback or native operation.

Mandatory captured live setup checks and immutable allowlisted account/policy
projections remain in place, including authorized empty configuration. Disabled
account creation may already have durably committed before a late cancellation;
this gate suppresses its success summary without rollback. It does not mint setup
provenance, prove operational readiness, alter stored-policy semantics, admit an
activity lease, reset stop latches, or change the five queued mutation guards.
No helper, store, queue, timer or public SDK/RPC/broker/Cue surface was added.

Source delta: one module, four added lines, zero removed. Formatting, configured
ESLint, strict main TypeScript and whitespace checks exited 0; tests created/run
0/0, images analyzed 0. Runtime synthetic verification, trusted setup/principal
injection, public publication and full lifecycle acceptance remain unfinished.
Backstage remains paused and public API versions unchanged. See
[[relay-imap-host-evidence-20261006]] for scoped receipts.

## Inner fixed-reader release-safe completion (HOST-02, 2026-10-08)

This source correction supersedes the earlier inner-reader description that ended
live checks before finally-based lease release. All seven actual
`MailAccountHeaderReader` modes (raw headers, display, search, complete source,
plain-text body, manifest and selected complete attachment) now complete the
synchronous session close and leased checks, detach only their own abort erasure
listener, and release the original inner lease **before** final success checks.
Release aborts synchronously and may run other listeners. The actual canonical
`AuthorizationStore.assertMailReadCompletion` rechecks stored independent rights,
exact plugin/dual identity/account revision and activity pending/failure/plugin/
global latches, around the captured live host caller callback and exact original
installation/mailbox check. It allocates no fresh activity lease or registry and
never resets a stop latch. A changed target is denied; unrelated accounts remain
allowed under the existing exact-target rules.

The original captured signal and monotonic authentication/lifetime budget share
one local guard, applied before/after host authority and again without callbacks
after the final sealed checks. Successful readback that synchronously aborts or
overruns cannot return success. Existing fixed errors and failed sealed-state
checks are preserved; no peer/native cause is returned. Raw header/source bytes
and the selected decoded attachment remain owned until completion succeeds; a
late denial erases them in catch/final cleanup. Ordinary successful release does
not erase transferred buffers. All other source/attachment erasure and immutable
projection rules remain unchanged, and strings remain nonzeroizable.

The actual verified facade still independently retains and completes its outer
lease across the inner await. Snapshot mode continues to adopt its original outer
lease/reservation and owned bytes; the inner lease is never retained by a snapshot.
Both leases still count against canonical caps. No repeated LOGIN/probe/transport,
new store/queue/permission engine, raw plugin result, SDK/RPC/capability/version,
setup principal, Cue event/subscription or production caller is introduced.
Post-return result publication still requires fresh authority; transferred bytes
cannot be recalled. Runtime synthetic regressions remain deferred, and this static
source correction does not satisfy full lifecycle or production acceptance.

## Retained attachment snapshot final lifetime gate (HOST-02, 2026-10-08)

Implemented and statically checked only. The shared outer `assertActive` closure
in `MailInvocationReader` now invokes its existing callback-free `assertLifetime`
after the final original live lease assertion. That lease assertion ends with
canonical synchronous sealed-right readback after its last caller callback; a
successful readback can overrun the original admission budget while the invocation
signal remains active. The new final check refuses this with fixed `MAIL_TIMEOUT`
or captured-signal `MAIL_CANCELED` before success. Failed sealed-state checks retain
their existing error precedence. No host callback or I/O follows the added check
inside this closure.

Actual retained snapshot adoption, pre/post chunk encoding and explicit retained
publication checks already use this closure. Their existing catch/close paths
consume a denied result, erase retained bytes and release original listeners,
reservation and lease. Snapshot completion still retains publication authority
until explicit close or existing invocation expiry. Exact account/installation/
revision/mailbox/independent attachments right, original nested invocation and
canonical stop latches remain enforced. Non-snapshot reads retain their separate
release-safe final completion check; the new shared check also strengthens their
leased boundaries. No new lease, helper, queue, timer, deadline renewal, native
probe, transport operation, latch reset or production/public API was introduced.

Source delta: one existing module, two added lines, zero removed. Prettier check,
strict main no-emit TypeScript, configured ESLint and whitespace checks exit 0.
Tests created/executed 0/0; images analyzed 0. Actual synthetic regressions remain
requirements in current HOST-02, not runtime evidence. JavaScript strings returned
previously cannot be recalled or erased; external publication still needs fresh
authority. Full lifecycle, trusted setup/policy injection, SDK/RPC/broker/Cue and
production acceptance remain unfinished; Backstage stays paused.

## Inner fixed-reader pre-work lifetime gate (HOST-02, 2026-10-08)

`MailAccountHeaderReader` now finishes its shared live `assertActive` closure with
the existing callback-free `assertLifetime`, after the last sealed stored-right
readback. That readback may block synchronously while timers cannot run. An
expired original connect/LOGIN budget or operation lifetime must therefore refuse
further transport admission, keyring entry/password access, fixed commands and
header/MIME projection. Previously the final stored-right readback could overrun
after the last lifetime check and still admit the next action; release-safe final
completion and the outer facade alone did not close this pre-work boundary.

The original captured signal, admission timestamp, 10-second pre-authentication
budget and 30-second total lifetime remain unchanged. Authentication becomes true
only after the checked LOGIN continuation. Existing lease/reference/installation/
independent-right checks precede the new check, retaining their denial precedence;
`MAIL_CANCELED` precedes timeout when the captured caller signal is aborted.
Existing catch/finally retains byte zeroization, session close and listener/lease
cleanup on denial. No new helper/timer, native probe, fresh lease, deadline renewal,
stop-latch recovery, setup minter or SDK/RPC/Cue/runtime wiring was added.

This is source implementation and static review only. Later tests must exercise
actual reader/store/activity/transport/native composition with synthetic backends,
including synchronous deadline overrun or cancellation at final sealed readback
before sensitive work, checked authentication transition, safe errors and cleanup.
Tests are not authored or executed by this source task. Full lifecycle/trusted setup,
public publication, monitoring/events/Cue and production acceptance remain open.

## HOST-02 queued disable credential retention (2026-10-08)

`MailAccountCredentials.mutateAccount` now skips `slot(...).removePassword(...)`
only for the canonical closed `disable` snapshot. The same queued sealed commit
first cancels readers, persists disabled intent, advances account revision/canonical
epoch and clears that account's rights. Its captured setup/signal, queued lease,
committed authority and post-settlement canonical completion checks remain required.
This branch constructs no `MailCredentialSlot` and invokes no entry factory or native
get/set/delete. Missing, locked, malformed or absent credentials therefore do not
make an otherwise authorized disable fail or imply credential presence/readiness.
No native failure can be encountered by disable through this skipped slot branch.

Settings replacement still commits disabled state before exact-slot deletion and
absence readback. Removal still commits a never-reused tombstone with pending
cleanup before native work, then confirms absence durably. Reentrant target changes,
setup cancellation, anchor/persistence failure and pending/stopped activity suppress
completion through the existing guards; admitted failures preserve stop latches.
Unrelated account settings/grants/history are preserved by the canonical mutation.
A failed final response can follow durable disable; no rollback is promised.

Canonical disable and enable rights clearing is unchanged. Backstage's grant
retention/re-enable behavior remains a separate unresolved public contract seam;
this source prerequisite resolves only credential retention. No stored right is
rebound to a new revision, no account enabled, no latch recovered and no status
projection/native availability probe added. Trusted setup/lifecycle/plugin cleanup,
SDK/RPC/broker/version and Cue/public integration remain unfinished. No runtime
mail/credential/store access was performed.

Source delta is one existing module, +4/-2 lines. Initial Prettier check exit 1
was corrected with scoped Prettier write exit 0; final source formatting, strict
main no-emit TypeScript and configured scoped ESLint checks exit 0. Tests authored/
executed 0/0; synthetic execution remains in HOST-05. Required future regressions
must use the actual facade/canonical queue/store/anchor with a synthetic keyring:
verify zero factory/get/set/delete calls on disable for present/missing/locked slots,
reader abort before queue drain/commit, revision/epoch/rights clearing, unrelated
state preservation, mandatory captured setup/signal, stale/reentrant/cancel/anchor/
persistence/latch denials and durable disable when final success is suppressed.
Verify settings replacement/removal/save still exercise their actual native work,
remove pending/confirmed ordering and enable probe/rights-clearing behavior. No
permissive queue/result mock or grant/readiness inference is acceptable.

## Fixed LOGIN authority snapshot (HOST-02, 2026-10-08)

Source-only correction in existing `MailCredentialSlot.authenticate`, **+14/-7**
from the captured dirty baseline. The slot now validates and captures the original
host callback, its receiver and actual AbortSignal before admission/native work.
Its existing authorization guard, exact entry, fixed LOGIN and content-free errors
operate on one frozen local authority through settlement. Replacing supplied fields
cannot replace the admitted callback or move the abort listener/cleanup to another
signal. Original-signal cancellation still closes pending LOGIN immediately and
suppresses late success. Capture failure closes the session without rereading
rejected fields; local password references are cleared on every existing path.
Callback/native/transport/capture errors expose no private content or native cause.

The authenticated account reader already supplies frozen authority; this correction
also covers independent trusted-host slot use. It creates no helper, registry,
queue, store, lease, timer, credential cache or session/account ownership proof.
Callbacks still must represent real live host authority; captured fields alone
confer no account or agent rights. Synchronous save/probe/removal semantics and
canonical stop latches are unchanged. JavaScript/native strings remain impossible
to promise zeroization for, and the fixed writer retains LOGIN-byte erasure duties.

Deferred actual-slot/reader regressions are recorded in the current HOST-02
playbook: original-signal/callback capture across native and LOGIN awaits, original
receiver, replacement/throwing/getter fields, abort/revoke/late rejection/success,
listener/session cleanup, exact native call counts, no returned secret and unchanged
reader rights/reference/lifetime gates. Actual canonical store/keyring/TLS/session
composition with synthetic inputs is required; no permissive result/guard mocks.
No tests created/executed by this source prerequisite (0/0), images analyzed 0.
Source Prettier/strict main no-emit TypeScript/configured ESLint checks exit 0;
whitespace/scope/document receipts are recorded at settlement in
`.maestro/verification/host-02-login-authority-snapshot/`.

Full lifecycle, trusted setup/policy/production wiring, grant-retention/re-enable
policy, public mail publication and runtime acceptance remain unfinished. HOST-05
gates remain unmet; Backstage paused. No native/storage/network/provider/mail/login
runtime, credential access, install/shared dependency mutation, commit/push/PR,
merge/deploy, callback/notification/Discord, SDK/Cue wiring or live subscription.

## Trusted setup single-read authority capture (HOST-02, 2026-10-08)

Source-implemented only in `mail-account-credentials.ts`, **+7/-6** against this
task's dirty baseline. The existing `setupAuthority` wrapper captures `signal` and
`assertActive` once, validates those captured values and binds the original host
callback receiver. `replaceAgentRights` likewise captures, validates and binds the
same original `assertAgentActive` member callback once. Getter-backed inputs cannot
substitute a second value between validation and capture. Missing/invalid values
and getter errors flow through existing public method content-free catches without
rereading rejected authority fields or reaching native/queue mutation work.

All existing frozen-wrapper cancellation checks, per-agent live membership checks,
policy/settings snapshots, exact account/revision/installation/dual identity,
canonical queue/commit/completion gates and stopped/pending latches remain required.
Original callbacks still must prove real host authority; this correction creates
none. Native slot synchronous semantics and grant retention policy are unchanged.
The current HOST-02 playbook records deferred actual composition/getter/receiver/
field-replacement/cancellation regressions, not authored or executed tests.

Source formatting, strict main no-emit TypeScript and configured source ESLint
passed (each exit **0**). Whitespace, added Markdown excerpt and dirty preservation
checks are recorded in `.maestro/verification/host-02-setup-authority-capture/`.
Tests created/executed **0/0**, images analyzed **0**. Full historical Markdown
formatting is not asserted; mock/production acceptance and public wiring remain
unfinished.

## Synchronous credential-slot authority capture (HOST-02, 2026-10-08)

`mail-credentials.ts` now uses one private `captureAuthority` for all four slot
operations. It factors the existing LOGIN capture rather than introducing another
authority system. Save, availability probe and removal each read the original
host callback and actual AbortSignal once, validate those same values and freeze
a locally bound callback/signal pair before native access. Reentrant entry/native
callbacks may replace supplied fields, but later admission/native/completion
checks still use the original lifetime and receiver. Live original callback
revocation/throw and original signal abort continue to deny work. Missing,
nonfunction, forged or capture-throw authority returns fixed `MAIL_DENIED` without
rereading rejected fields or invoking native work. LOGIN uses this same capture,
retaining failed-session close and original abort-listener cleanup.

All save admission, password validation, entry/native work and completion checks
now sit inside its existing `finally`: local password/readback references are
cleared on early failures as well as native/completion failures and success.
Probe retains its local reference cleanup, exact save equality and confirmed
removal absence stay unchanged, and synchronous void results expose no secret.
Native error normalization remains content-free. This does not promise
JavaScript/native string memory zeroization, rollback of a native write/delete
already performed before cancellation, account/session ownership, a trusted setup
principal, grant retention/re-enable policy or production lifecycle integration.
Canonical queued account wrappers remain the required mutation boundary.

One source file changed, **+44/-26** against preserved dirty baseline. Formatting,
configured ESLint and strict main no-emit type checks are recorded in
`.maestro/verification/host-02-sync-slot-authority/`; source inspection only,
not runtime acceptance. Deferred actual synthetic slot/account regressions live
in the current HOST-02 document. Tests created/executed **0/0**, images analyzed
**0**. [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]] remain the governing architecture;
full lifecycle/production acceptance and HOST-05 gates remain unfinished.

## Verified caller issuance single-read authority capture (HOST-02, 2026-10-08)

Implemented and static-checked only in existing
`src/main/plugins/plugin-tool-run-identity.ts`. Both `issue` and
`issueInvocation` read the supplied host authority's signal and callback once,
validate those same captured values and bind the original callback receiver.
Previously validation and capture read each property separately, allowing an
accessor to substitute an unvalidated callback or cancellation source.

The captured actual AbortSignal and bound callback remain the only sources for
admission, retained records, live checks, abort listeners and listener cleanup.
Missing/nonfunction callbacks, forged/missing signals and capture errors use the
existing content-free issuance catches; rejected fields are not reread. There is
no proof/handle insertion before this validation. Host authority still must come
from the actual run/plugin lifecycle; a plugin-supplied callback or agent ID does
not become verified authority.

Exact run/context/registry/plugin/agent bindings, TTLs, limits, timers, pruning,
reentrant checks and revocation behavior retain their existing implementation.
No new helper, registry, minter, account rights, public API or production caller
was added. This does not change the independent sealed account-right checks.
Source diff from preserved dirty baseline: **8 added / 12 removed lines**, one
module. Prettier, strict main no-emit TypeScript and configured ESLint exit **0**;
whitespace and scope checks are recorded in the evidence receipts.

Tests created/executed **0/0**, images analyzed **0**. Actual registry and verified
reader synthetic regression requirements are deferred in the current HOST-02
playbook. Runtime behavior, trusted setup/policy, grant-retention/re-enable policy,
public mail integration, monitors/events/Cue and full production acceptance remain
unfinished. Backstage stays paused; HOST-05 gates remain unmet.

## Inner account-reader single-read authority capture (HOST-02, 2026-10-08)

`MailAccountHeaderReader` in existing `src/main/plugins/mail-account-read.ts` now
captures original caller signal, host callback and agent string once at read
admission, then validates those same values. It binds the callback to its original
receiver and reuses the captured values across raw header/source, display, search,
body, manifest and selected-attachment modes. An accessor cannot substitute a
second unchecked callback or signal between validation and capture. Invalid
signal/callback/agent type or capture failure takes the existing fixed error path
before lease/native/transport admission; failure cleanup does not reread the caller.

Existing original admission deadlines, sealed account/revision/independent-right
checks, immutable references/criteria, native LOGIN and fixed protocol, MIME
projection, owned-byte erasure and release-safe completion are unchanged. Listener
cleanup uses the original admitted signal. Replacement fields cannot renew this
read's lifetime or agent binding. No new helper, state, registry, minter, store,
queue, public SDK/RPC/Cue route or setup authority was introduced.

Source delta **+11/-6**, one existing module. Prettier, strict main no-emit TypeScript
and configured scoped ESLint exit **0/0/0**. Receipts and dirty baseline:
`.maestro/verification/host-02-read-authority-capture/`. Actual synthetic regressions
for single getter access, alternating values, receiver binding, replacements,
original cancellation/revoke/deadlines, safe capture failure and cleanup across all
modes are deferred in current HOST-02; tests created/executed **0/0**, images **0**.
These are source/static checks only. Full lifecycle/trusted setup/policy/public
integration, grant-retention/re-enable policy and runtime acceptance remain
unfinished; HOST-05 gates unmet, Backstage paused.

## Closed host-private setup navigation (HOST-02, 2026-10-08)

Source/static prerequisite only: `parseMailSetupNavigation` in
`mail-account-config.ts` composes canonical closed data-record and opaque-ID
validation. It accepts exactly `{ action: 'add' }` or
`{ action: 'test' | 'rights' | 'disable' | 'remove', accountId }`. Add rejects an
accountId field even when explicitly undefined/null; targeted actions require an
exact canonical ID. Unknown actions/extra keys, inherited/accessor/hidden/symbol
fields and throwing descriptor/prototype traps fail with fixed `MAIL_INVALID`.
The frozen parsed request is captured before any host-authority callback runs.

`MailAccountCredentials.resolveSetupNavigation` reuses mandatory captured setup
callback/signal and the canonical sealed exact-plugin/dual-identity configuration
read. Only add permits an authorized absent configuration; every targeted action
requires a live owned account, so foreign, unknown and retained removed IDs deny.
The frozen result contains only action, and for targeted navigation accountId and
current accountRevision. Terminal stored revisions may be reviewed, never advanced.
No endpoint, username, credential, enabled/readiness status, mailbox, grant or agent
identity is projected. A final live setup check, unchanged configuration identity
check and post-anchor cancellation gate suppress reentrant stale/canceled results.
Any plugin configuration replacement, including an unrelated account update during
these checks, conservatively requires navigation to be resolved again.

Navigation performs no mutation or credential-slot construction/probe and never
runs its named operation. It creates no nonce/frame/gesture/setup/caller authority,
lease, queue, persistence schema or public SDK/IPC/RPC/event/Cue route. Future
trusted host frame admission and fresh operation-specific authorization remain
required; a returned target is neither bearer authority nor operational readiness.
Errors keep existing content-free codes without causes or peer/native diagnostics.

Exactly two existing source modules, +71/-0 from the preserved dirty baseline.
Final formatting/strict main no-emit TypeScript/configured scoped ESLint exits
0/0/0. Initial formatting exit 1 was corrected with scoped Prettier write exit 0.
Tests created/executed 0/0; images analyzed 0. Actual closed-input/authority/sealed
state/reentrancy/secret-isolation regressions are deferred in the current HOST-02
playbook. Receipts: `.maestro/verification/host-02-setup-navigation/`. Full account
lifecycle, trusted setup/policy, grant-retention/re-enable policy, public integration
and production acceptance remain unfinished; Backstage stays paused.

## Disabled-account add settings captured before callbacks (HOST-02, 2026-10-08)

Implemented and static-checked only. The existing private settings validator in
`mail-account-config.ts` is now exported host-private as `parseMailAccountSettings`.
Its closed descriptor, configured TLS endpoint, ASCII username/mailbox, dense list,
uniqueness and count validation is unchanged. It returns the same frozen settings,
endpoint and copied frozen mailbox list; pure parsing generates no account ID and
confers no setup, caller, credential or I/O authority. Configuration loading,
disabled construction and settings replacement reuse this one parser.

`MailAccountCredentials.addDisabledAccount` snapshots settings before reading
setup authority properties or invoking the host callback. Independently callable
`AuthorizationStore.addDisabledMailAccount` snapshots before identity parsing,
setup callbacks and native sealed freshness reads. Only these captured settings
are used to construct and persist new disabled intent. Reentrant callbacks and
setup/identity accessors cannot retarget the original endpoint, username or
mailboxes after capture. Invalid settings are rejected inside existing fixed-error
wrapper catches before authority/storage admission; rejected descriptor getters
are not evaluated. Raw reflection/proxy exceptions are not exposed by these wrappers.

Random host account-ID generation remains after live authority and existing
configuration checks. Disabled revision-1 construction, canonical anchored commit
and completion rechecks, exact plugin/dual identity, unrelated accounts/grants/
tombstones and immutable credential-free summary fields remain unchanged. No
password-slot, enable/grant, network/login, new helper/store/queue, principal,
public route or production integration was added. This captures the add payload;
trusted frame/nonce/gesture and operation-specific authorization remain unfinished.
Parsing alone is never authorization. [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]] still govern.

Three existing source modules changed, **+13/-6** relative to preserved dirty work.
Scoped Prettier, strict main no-emit TypeScript, configured ESLint and tracked
whitespace checks exit **0**; scoped no-index whitespace exit **1** solely for
file differences with zero diagnostics. Receipts are in
`.maestro/verification/host-02-disabled-settings-snapshot/`. Tests created/executed
**0/0**, images analyzed **0**. Synthetic regressions are deferred in the current
HOST-02 document. Full lifecycle, production acceptance and HOST-05 remain unfinished.

## Agent rights captured before setup and identity access (HOST-02, 2026-10-08)

Implemented source prerequisite only: `MailAccountCredentials.replaceAgentRights`
now invokes the existing closed immutable `parseMailAgentRights` before any setup
signal, host callback or membership-callback property access. Independently callable
`AuthorizationStore.replaceMailAgentRights` invokes the same parser before identity
reflection, host callbacks or native sealed freshness checks. Reentrant setup
accessors or identity proxy traps cannot retarget the submitted policy after this
capture. Rejected malformed payloads cannot reach those subsequent accesses.

The facade's live membership checks and queued canonical replacement use only the
captured agent IDs and nested independent read/detail/attachments rights. The direct
ledger uses only its own captured rights. Parsing remains pure stored intent; it
creates no live membership, caller proof or I/O authority. Existing mandatory
setup/member callbacks, original receivers and cancellation signal, exact expected
account revision/installation/plugin/dual identity, anchored revision/epoch advance,
empty-list revocation, unrelated settings/grants/history and completion/latch checks
remain in their existing paths. Fixed wrapper errors normalize parser/proxy failures.

Two existing modules changed **+4/-2** from preserved dirty baseline; no helper,
parser copy, store, queue, registry, type, principal or production route was added.
Static Prettier/strict main no-emit TypeScript/configured ESLint exits **0/0/0**.
Actual synthetic parser/setup/sealed-store/queue regressions are deferred in the
current HOST-02 playbook; tests created/executed **0/0**, images analyzed **0**.
Receipts: `.maestro/verification/host-02-grant-payload-snapshot/`.
Full lifecycle/trusted setup/policy/public integration and production acceptance
remain unfinished; HOST-05 gates unmet and Backstage paused. No runtime keyring/
storage/mail/network/login/credentials, installation or live Cue activity.

## Account mutation intent captured before host work (HOST-02, 2026-10-08)

Source prerequisite only: `parseMailAccountMutation` extracts the existing closed
`disable`/`replaceSettings`/`remove` grammar from `changeMailAccountConfiguration`.
It reuses `mailRecord`, opaque ID/revision and `parseMailAccountSettings` validators
and returns frozen exact kind/accountId/expectedRevision intent, with frozen
settings/endpoint/mailboxes for replacement only. Unknown kinds or fields,
inherited/accessor/hidden/symbol fields, malformed IDs/revisions/settings and
missing or forbidden settings yield fixed `MAIL_INVALID` without native causes.
Parsing confers no setup, caller, stored-policy or I/O authority.

`MailAccountCredentials.mutateAccount` captures that complete request before setup
signal/callback properties, host callbacks or sealed freshness reads. It retains
the actual pure transition as preflight before canonical queue admission, so
ownership/revision/terminal/history/serialized configuration limits still apply.
The queue closure uses the captured request; the prior inline second snapshot is
removed. `AuthorizationStore.mutateMailAccount` independently captures intent
before identity parsing/native freshness and uses one parsed identity for both
configuration reads and sealed commit. Reentrant host/native work cannot change
the original caller-owned request or identity between those boundaries.

Syntactic validation now precedes account lookup: malformed replacement settings
are rejected as `MAIL_INVALID` even when the target would also fail ownership or
revision checks. A well-formed intent still requires all existing exact ownership,
revision, live authority, queue/invalidation and sealed freshness checks. Existing
revision advancement, rights clearing, disabled intent, disable credential retention,
settings/removal exact-slot cleanup, pending/confirmed tombstones and final completion
latches remain in their existing implementations. Direct ledger mutations remain
host-private seams requiring the trusted queued lifecycle for native cleanup.

Static evidence: three existing source modules, +49/-30 lines against the preserved
dirty baseline; scoped final Prettier, strict main no-emit TypeScript, configured
ESLint and tracked whitespace exits 0/0/0/0. Initial formatting exit 1 was corrected
by scoped formatting write 0, then final check 0. Source no-index whitespace exits
1 reflect differences only, with no diagnostics. Tests created/executed 0/0,
images analyzed 0. Actual synthetic parser/transition/setup/sealed-store/queue
regressions are deferred in the current HOST-02 document. Receipts:
`.maestro/verification/host-02-mutation-intent-snapshot/`. Full lifecycle, trusted
setup/policy/public integration, grant-retention/re-enable policy and production
acceptance remain unfinished; HOST-05 gates unmet and Backstage paused.

## Fixed-session post-authority lifetime check (HOST-02, 2026-10-08)

`mail-imap-connection.ts` now extracts its existing closure-bound terminal and
monotonic deadline check into `assertLifetime`, invoked before and immediately
after the live host authorization callback by the fixed session's `assertActive`.
A normally returning callback that synchronously closes/cancels the session,
triggers a terminal transport error or crosses the original budget can no longer
make that check succeed. Existing terminal errors retain precedence; timeout uses
the same fail path before throwing, closing the socket, disposing the decoder,
erasing pending wire/literals and rejecting pending work.

Original admission time, tighten-only pre-LOGIN/total limits, authentication state,
timers, fixed command/response grammar, TLS policy and account/credential consumers
remain in their existing paths. This is one internal session extraction, no new
shared timeout helper, authority, queue, account rights or public integration.
Synchronous callbacks cannot be preempted; overruns are detected when they return.
The existing denial normalization on thrown host callbacks remains. This change
covers session checks, not the separate LOGOUT plan publication boundary or
production setup/lifecycle/public delivery authority.

Source delta against preserved dirty baseline: one existing module, **+7/-1**.
Prettier, strict main no-emit TypeScript and configured scoped ESLint each exit
**0**. Actual fake TLS/DNS/clock and fixed-flow cancellation/timeout regressions
are deferred in the current HOST-02 document; tests created/executed **0/0**,
images analyzed **0**. Mock-tested/production-tested **false/false**. Receipts:
`.maestro/verification/host-02-session-post-authority/`. Lifecycle parent and
production acceptance remain unchecked; trusted setup/policy/public wiring and
HOST-05 publication gates remain unfinished. Backstage remains paused.

## Configured connection retains its admitted authority (HOST-02, 2026-10-08)

Source prerequisite only: `openConfiguredImapConnection` captures the host's
`assertActive` callback and original receiver, optional `AbortSignal`, plugin ID
and both tighten-only deadline values once before initial authorization. Its
live checks invoke that retained callback; original plugin identity owns bounded
admission and release, and the original signal owns abort registration/removal.
Replacing fields on `deps` or `options` after capture cannot redirect those session
checks, listeners, admission bookkeeping or budgets. Missing/nonfunction authority
or a malformed provided signal yields fixed `MAIL_DENIED`; an absent signal remains
supported. Capture failures are normalized without peer/native error content.
The original signal is checked before and after initial authorization, so a normally
returning callback cannot cancel admission and continue to endpoint resolution.

Existing monotonic admission time, pre-LOGIN/total limits, before/after authority
terminal checks, terminal-error precedence, fail-before-report socket/decoder/wire
cleanup and fixed command/TLS/egress policy remain. This introduces no new helper,
timeout system, permission, queue, store or production route. The original callback must still check live host policy on every invocation. Synchronous callbacks remain non-preemptible.

Endpoint/transport dependency capture and `runConfiguredImapSession` plan/LOGOUT
result publication are separate unfinished seams. Trusted setup, lifecycle/public
wiring and production acceptance remain unavailable. Actual fake TLS/DNS/clock
capture regressions are deferred in current HOST-02; tests created/executed **0/0**,
images analyzed **0**, mock-tested/production-tested **false/false**.
One existing source module changed **+25/-10** against preserved dirty baseline.
Exact static check receipts are recorded in the local/shared evidence ledgers and
`.maestro/verification/host-02-session-authority-snapshot/`.
[[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]] still govern; HOST-05 gates remain unmet and
Backstage remains paused.

## Configured connection retains endpoint and transport callbacks (HOST-02, 2026-10-08)

Source prerequisite only: `openConfiguredImapConnection` now captures required
`getEndpoint` and optional `resolve`, `blockedPorts` and `connect` callbacks once,
before initial host authorization. Each provided method is retained with its
original `deps` receiver. Endpoint selection, canonical egress preflight and
actual TLS lookup/connect use those retained methods, so replacing properties
from authorization or while DNS is pending cannot redirect the admitted flow.
The existing endpoint validator copies and freezes only configured connection
fields. Original live authority and signal are checked again after endpoint
selection/copy, before admission, to catch synchronous revoke/cancellation there.

Missing/nonfunction endpoint selection and malformed provided optional callbacks
(including null) fail `MAIL_DENIED` before admission; throwing property capture
is normalized without native/peer content. Undefined optional dependencies keep
the canonical egress resolver, empty blocked-port default and normal `tls.connect`.
The captured blocked-port provider is still called at existing policy boundaries;
its returned list is not frozen or cached. Binding the receiver retains method
identity, not a snapshot of live host policy or arbitrary receiver state.

Configured TLS validation/SNI, canonical validating lookup, fixed command grammar,
original deadlines/admission bounds and terminal cleanup remain in existing paths.
No new helper, store, queue, timer, authority minter or production route. This does
not complete plan/LOGOUT result publication or full pre/post-callback checks around
every transport seam. Synchronous host callbacks remain non-preemptible; trusted
setup and lifecycle/public wiring remain unfinished. Historical sections above
are superseded only for this dependency-capture seam.

Actual fake TLS/DNS/clock regressions are deferred in current HOST-02. Source
change: `mail-imap-connection.ts` **+25/-11** against preserved dirty baseline;
tests created/executed **0/0**, images analyzed **0**, mock-tested/production-tested
**false/false**. Static receipts live in
`.maestro/verification/host-02-session-dependency-capture/` and the evidence ledgers.
[[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]] still govern; lifecycle parent/production
acceptance remain unchecked, HOST-05 gates unmet and Backstage paused.

## Configured connection checks live port policy through its lifetime (HOST-02, 2026-10-08)

Source prerequisite only: `mail-imap-connection.ts` now routes the captured
blocked-port provider through one session-local `readPortPolicy` check. It invokes
existing live host authority, terminal-state and original monotonic deadline
checks before and after provider work and copying the current returned list.
The canonical egress guard's preflight, the final pre-TLS check and actual lookup
entry/completion use this same check. Each invocation queries current policy;
its copied list is local to that invocation, without caching policy across DNS.
Non-array results and entries outside the integer TCP port range fail closed.
An absent provider still uses an empty list and the existing lifetime checks.

A normally returning provider that cancels, revokes authority or overruns the
original connect/total budget cannot permit the next DNS/TLS operation or address
delivery. A blocked configured port or throwing/malformed provider/list result
uses the existing fixed denial and fail-before-report cleanup. An already latched
terminal cancellation/timeout/denial remains first. Lookup gate failures deliver
that fixed terminal error without exposing resolver/provider error text or causes;
a mismatched lookup hostname now also terminates the session before reporting.

The original captured provider and receiver, configured endpoint/TLS identity,
canonical address validation/pinning, fixed IMAP grammar, deadlines and admission
bounds remain. No shared timeout helper, timer, store, queue, policy authority or
public production path was introduced. Callbacks/iteration are synchronous and
cannot be preempted; expired/canceled work is rejected when they return. This does
not establish trust in injected transports or complete plan/LOGOUT publication,
trusted setup, lifecycle/public wiring or production acceptance.

Scoped source change against preserved dirty baseline: one existing module,
**+36/-13**. Prettier, strict main no-emit TypeScript and configured scoped ESLint
all exit **0**. Actual fake DNS/TLS/clock regressions are deferred in current
HOST-02; tests created/executed **0/0**, images analyzed **0**,
mock-tested/production-tested **false/false**. Receipts and scoped baseline patch:
`.maestro/verification/host-02-port-policy-lifetime/`. [[CLAUDE-PLUGINS]] and
[[CLAUDE-CUE]] continue to govern; lifecycle parent and HOST-05 publication gates
remain incomplete. Backstage remains paused.

## Fixed-plan completion retains original authority (HOST-02, 2026-10-08)

Source prerequisite only: `mail-imap-connection.ts` extracts its actual connection
capture into private `captureImapConnection`. Direct open and the existing fixed
plan each capture once before host authorization, then use the same private
`openCapturedImapConnection` implementation. This retains the original callback
and receiver, optional actual signal, plugin ID, both deadline values and endpoint,
resolver, live port-policy and connect providers without rereading caller
properties or spreading their objects. The frozen internal capture is not a grant
or a public API; live policy still comes from the original host callback.

After terminal LOGOUT the runner checks that original signal before and after
invoking the original bound authority callback, replacing its former reads of
`deps.assertActive` and `options.signal`. Replacing those properties from earlier
callbacks or across awaits cannot redirect this final check. Missing/malformed
callbacks, supplied signal and throwing capture remain content-free failures.
Absent optional providers retain their existing defaults. Existing fixed grammar,
TLS/egress policy, admission, original monotonic session budget, listeners and
cleanup/result-erasure paths remain in the same connection implementation.

This specifically closes the original-authority capture seam. The runner still
needs immutable plan intent, original-budget and release-safe final publication
checks, including terminal LOGOUT; this task does not provide those guarantees.
Synchronous callbacks cannot be preempted. Trusted setup, lifecycle/public wiring
and production acceptance remain unavailable. Historical unfinished-seam notes
above are superseded only for plan callback/signal capture.

Scoped source delta against preserved dirty baseline: one existing module,
**+48/-22**. Prettier, strict main no-emit TypeScript and configured scoped ESLint
all exit **0**. Tests created/executed **0/0**, images analyzed **0**,
mock-tested/production-tested **false/false**. Actual synthetic TLS/DNS/clock
capture regressions are deferred in the current HOST-02 document. Receipts:
`.maestro/verification/host-02-plan-authority-capture/`. [[CLAUDE-PLUGINS]] and
[[CLAUDE-CUE]] govern; lifecycle parent and HOST-05 publication gates remain
unfinished and Backstage remains paused.

## Fixed-plan command intent captured before host work (HOST-02, 2026-10-08)

`runConfiguredImapSession` now owns its nonempty, at-most-64-step plan before
reading dependency properties, invoking host authorization or admitting a
connection. One internal capture reuses `mailList` and `mailRecord` from the
existing closed private schema, the canonical `prepareImapCommand` grammar and
`assertImapUid`; it does not implement another parser or runner. The copied plan,
steps and commands are frozen. No caller-owned array, command, kind, fields or
expected UIDVALIDITY is read after capture. Order, command count and final LOGOUT
classification use that retained plan throughout callbacks and awaits.

Closed dense arrays and own enumerable data records are required. Sparse/custom
arrays, accessors, inherited/hidden/symbol/unknown fields and malformed commands
fail with fixed `MAIL_INVALID`, before dependency/authority/transport work. Each
copied command is checked by the actual fixed wire builder; temporary validation
bytes, including LOGIN bytes, are immediately erased rather than retained. An
optional defined expected UIDVALIDITY must be a canonical positive IMAP UID;
absent or explicit `undefined` retains the prior optional meaning. LOGOUT is
validated as final before connection admission. LOGIN order, authentication and
selected namespace equality remain enforced by the existing session state machine.

No credential retrieval, cache, returned secret, grant, setup, socket or public
route is added. Existing transient command strings, including a caller-provided
LOGIN password, cannot be zeroized and remain host-private for this plan's
lifetime; this capture establishes no credential ownership or account authority.
Canonical live authorization, TLS/egress checks, deadlines, command-result erasure
and connection cleanup remain separate existing mechanisms. Trusted JavaScript
proxy traps cannot be made side-effect-free; this schema rejects getters without
executing them and normalizes capture exceptions, rather than sandboxing objects.

Implemented/source-reviewed only: `mail-imap-connection.ts` **+43/-4** against the
preserved dirty baseline. Scoped Prettier, strict main no-emit TypeScript and
configured ESLint each exit **0**; tests created/executed **0/0**, mock-tested and
production-tested **false**. Deferred mutation/grammar/import-order regressions
are specified in current `RELAY-IMAP-HOST-02.md`. Original-budget/release-safe final
publication, including terminal LOGOUT, full trusted setup and production
lifecycle/public integration remain unfinished. Earlier immutable-plan limitation
statements are superseded only for this source capture; no production acceptance
is checked off. Receipts: `.maestro/verification/host-02-plan-intent-capture/`.
See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

## Fixed-plan publication after close and original budget checks (HOST-02, 2026-10-08)

`runConfiguredImapSession` now closes inside its guarded success path, before
returning any accumulated command results. A private connection-completion
wrapper supplies the same connection closure's original monotonic `admittedAt`,
authenticated state, captured optional signal and live callback/receiver to the
runner. Direct open still returns only the existing frozen
`execute`/`assertActive`/`close` session; no exported completion method or new
production entry is added. The completion check requires terminal close and
cannot authorize more I/O or revive admission.

The existing elapsed-budget check is shared by live-session and final completion
checks. It rejects original-signal cancellation and elapsed time at or beyond the
original tighten-only lifetime, plus the original connect budget until LOGIN has
validated. Final completion checks this before and after the original live
callback, after socket destruction and admission release. Terminal LOGOUT follows
the same final gate; cleared timers no longer make synchronous destroy/authority
callback time invisible. No replacement clock, timer, queue, admission or runner
is introduced. The clock still begins at the existing connection admission,
after initial configuration/authority validation; this change does not add a
pre-admission deadline or preempt synchronous host callbacks.

Earlier FETCH buffers remain owned by the runner through explicit close and
final checks. On close/completion failure, the existing catch erases all retained
FETCH results and emits fixed errors. The finally close remains idempotent and
provides failure cleanup; on normal terminal completion it invokes no further
host callback. Session terminal checks continue to refuse reuse. Existing
TLS/egress policy, fixed grammar and listener/decoder/wire cleanup stay in the
canonical connection implementation. Successful transfer ends this ownership;
bytes cannot be recalled and strings cannot be zeroized. Future publication must
recheck account/verified caller authority in its own host composition.

Implemented/source-reviewed only: one existing module, **+50/-19** against the
preserved dirty baseline. Prettier, strict main no-emit TypeScript and configured
scoped ESLint each exit **0**. Tests created/executed **0/0**, images analyzed
**0**, mock-tested/production-tested **false/false**. Actual fake TLS/clock
completion regressions are deferred in this current HOST-02 document. Historical
plan/LOGOUT final-budget/release-publication absence notes are superseded only
for this private runner source change. Full trusted setup, lifecycle/public
integration and production acceptance remain unfinished. Backstage stays paused
and HOST-05 publication gates are not passed. Receipts:
`.maestro/verification/host-02-plan-completion/`. See [[CLAUDE-PLUGINS]] and
[[CLAUDE-CUE]].

## Read request intent captured before authority (HOST-02, 2026-10-08)

The existing `MailAccountHeaderReader` and `MailInvocationReader` now capture
request intent through `parseMailMessageReference`, `parseMailAttachmentReference`
or `parseMailSearchCriteria` at the start of the guarded read, before accessing
caller authority properties, resolving nested invocation provenance or invoking
live policy callbacks. This covers all seven direct private modes and all six
verified facade modes, including retained attachment snapshots. The facade
passes its immutable capture to the inner reader, whose independent capture
also protects direct private callers. No caller-owned reference is read again.

Reentrant authority accessors/callbacks can no longer retarget the account,
revision, mailbox, UIDVALIDITY, UID, part or search range/text before validation.
The actual canonical parsers still enforce closed own data records, fixed bounds,
namespace/part syntax, optional-field presence and ordered search grammar. They
reject malformed requests before any authority, sealed/native or transport work;
the existing outer catch normalizes all failures without peer/native causes.
Malformed input errors now precede caller/invocation denial when both are invalid.
Capture alone confers no authority. Parser proxy traps remain host JavaScript
side effects, not a sandbox guarantee; no new parser or permissive fallback exists.

The original monotonic admission timestamp is still taken before parsing, so
capture time remains within the existing read budget. Fixed mode/independent
right selection, mandatory captured caller/receiver/signal/agent, exact stored
ownership/revision and namespace checks, post-close/release live completion,
byte erasure and snapshot lease/reservation ownership are unchanged. Parsing
creates no additional I/O, grant, timer, queue, store, runner or public route.
Successfully transferred strings/bytes cannot be recalled and synchronous host
callbacks cannot be preempted.

Source/static-reviewed only: two existing source modules, **+14/-12** against the
preserved dirty baseline. Prettier, strict main no-emit TypeScript and configured
scoped ESLint each exit **0**. Tests created/executed **0/0**, images analyzed **0**;
mock-tested and production-tested **false**. Actual synthetic mutation/order/
cleanup regressions are deferred in current `RELAY-IMAP-HOST-02.md`, with test
creation and execution kept separate. Receipts:
`.maestro/verification/host-02-read-intent-capture/`. Full trusted setup,
lifecycle/public integration and production acceptance remain unfinished;
Backstage stays paused and HOST-05 gates are unmet. See [[CLAUDE-PLUGINS]] and
[[CLAUDE-CUE]].

## Verified-to-private read admission continuity (HOST-02, 2026-10-08)

`MailInvocationReader` now passes its original `performance.now()` admission
value to every actual inner reader operation: search, display, body, manifest
and attachment content, the latter serving both attachment and snapshot modes.
The timestamp precedes facade request capture, invocation resolution/policy,
sealed account checks and outer lease acquisition. Those steps now spend the
same private reader DNS/TLS/greeting/LOGIN and total budgets instead of receiving
a fresh inner admission clock.

The existing host-private `MailAccountHeaderReader` methods accept an optional
numeric admission time. Omission retains the existing direct-entry clock. The
private implementation captures its entry time once and rejects nonnumber,
nonfinite, negative or later-than-entry values with `MAIL_INVALID` before
request parsing or caller/authority/native/transport work. No coercion or caller
clock object is accepted. Earlier/equal values can only tighten the direct-entry
budget and confer no policy, identity, reference or credential authority. This
argument is main-only; no public SDK/RPC/IPC method or caller field exposes it.

The existing pre-LOGIN connect budget ends only after successful LOGIN and its
original authority/deadline check. EXAMINE, SEARCH, FETCH, MIME projection, close,
lease release and final completion retain the original total lifetime, with no
new timer, timeout helper, runner, queue, store or admission engine. Retained
snapshots still use the facade's original lifetime and cancellation/lease gates.
Captured intent, independent rights, live revision/namespace checks, canonical
leases and result erasure are unchanged. Synchronous host work cannot be
preempted; strings and successfully transferred bytes cannot be recalled.

Two existing source files changed, **+59/-27** against this task's preserved
dirty baseline. Source Prettier, strict main no-emit TypeScript and configured
scoped ESLint passed, each exit **0**. Actual synthetic clock/policy/reader/TLS
regressions are deferred in current `RELAY-IMAP-HOST-02.md`, with test creation
and execution remaining separate. Tests created/executed **0/0**, images analyzed
**0**; no mock-tested or production-tested acceptance. Receipts and baseline:
`.maestro/verification/host-02-reader-admission-continuity/`.

Full trusted setup, lifecycle/public integration and production acceptance remain
unfinished; Backstage stays paused and HOST-05 gates remain unmet. This section
supersedes historical separate-inner-clock descriptions only for the private
verified-to-reader composition. No real keyring/storage/network/mail/login or
credential access, dependency installation/shared mutation, live subscription,
callback/notification/Discord, commit/push/PR/hooks bypass/merge/deployment.

## Setup cancellation reaches admitted mutation leases (HOST-02, 2026-10-08)

All five queued `MailAccountCredentials` operations (password save, enable,
agent-right replacement, retained-removal cleanup and account mutation) forward
their original captured setup AbortSignal through the two canonical
`AuthorizationStore` queue entry points into `MailAccountActivity.enqueueMutation`.
The signal is now mandatory at both store entry points and activity admission.
Missing/non-AbortSignal inputs deny; already-canceled inputs return fixed
`MAIL_CANCELED` before identity/authority/storage/activity work. Existing live
setup callbacks and sealed account/revision/installation checks remain mandatory;
cancellation is not proof of authority.

After successful admission checks, the existing activity registry subscribes to
the original signal before invalidating readers or scheduling queued work. Abort
synchronously retains the existing target-account failure latch, invalidates its
readers and aborts all admitted same-account mutation controllers. No later lease
checkpoint is needed to signal cancellation. Pending drain checks deny before
calling mutation work; new admissions deny while the latch remains. Unrelated
account/plugin states are untouched. Failure and cancellation reuse one internal
closure over existing state; no additional registry, runner, queue, timer, store
or recovery path exists. Pre-admission cancellation retains the previous cleanup
behavior and creates no new failure latch.

Queue slots, counts and listeners stay owned until actual queued/in-flight work
settles. Original signal listeners are removed in canonical queue finally cleanup
on success, error and cancellation; released controllers stay terminal. A pending
promise is not forcibly completed and synchronous native/host work cannot be
preempted or rolled back. Cancellation may suppress success after durable changes;
callers must refresh state. Existing passwords cannot be zeroized, stop latches
cannot be reset and committed intent does not establish operational readiness.

Source/static-reviewed only: three existing source modules, **+41/-7** against the
preserved dirty baseline. Prettier/strict main no-emit TypeScript/scoped configured
ESLint each exit **0**. Tests created/executed **0/0**, images analyzed **0**;
mock-tested/production-tested **false/false**. Actual synthetic queue/facade/store
regressions are requirements in current `RELAY-IMAP-HOST-02.md`, not authored tests.
Full trusted setup/lifecycle/public integration and production acceptance remain
unchecked; Backstage stays paused and HOST-05 gates remain unmet. Receipts:
`.maestro/verification/host-02-setup-queue-cancellation/`. See [[CLAUDE-PLUGINS]] and
[[CLAUDE-CUE]].

## Live authority at canonical configuration commit (HOST-02, 2026-10-08)

Every `AuthorizationStore.saveMailConfiguration` caller now supplies its existing
mandatory setup or queue-lease callback. `mutateMailAccount` requires that callback
and checks it before sealed configuration access, after closed mutation/identity
capture. Both queued password-save revision and disable/settings/removal paths
forward the original admitted lease's `assertActive`; disabled addition, enable,
agent-right replacement and removed-slot cleanup commits forward their existing
checks. No setup principal, credential getter or public route is created.

The canonical commit captures its immutable mail state reference and epoch before
calling authority, and prepares replacement state from that captured mail value.
It checks authority before preparation, after synchronous affected-reader abort
listeners and final anchor freshness work, and after persistence/freshness.
Immediately before epoch/state replacement, it compares both captured mail state
and epoch with the current canonical ledger. Reentrant same-account, other-account,
other-plugin or consent commits are refused rather than overwritten. No host/native
callback occurs between that comparison and the in-memory replacement. The final
post-persistence authority check and exact resulting mail/epoch comparison suppress
late success after cancellation or another intervening mutation.

Cancellation is not rollback: synchronous seal/anchor work cannot be preempted,
and a change already committed may remain even when the response is denied.
Callers must refresh stored state after failures. Existing admitted queue failure
latches/counts/listener ownership, revisions, rights clearing, retained tombstones,
credential retention on disable and stopped persistence behavior are preserved.
No new store, queue, helper, timer, runner, recovery or permissive authority exists.

Source/static review only: two existing modules, **+61/-16** against this task's
preserved dirty baseline. Prettier, strict main no-emit TypeScript and configured
scoped ESLint each exit **0**. Tests created/executed **0/0**, images analyzed **0**;
mock-tested/production-tested **false/false**. Actual synthetic regressions are
requirements in current `RELAY-IMAP-HOST-02.md`; creation and execution stay separate.
Full trusted setup/lifecycle/public integration and production acceptance remain
unfinished. Backstage stays paused and HOST-05 gates remain unmet. Receipts:
`.maestro/verification/host-02-canonical-commit-authority/`. See [[CLAUDE-PLUGINS]]
and [[CLAUDE-CUE]].

## Canonical mutation completion after lease release (HOST-02, 2026-10-08)

Source implementation only: `MailAccountActivity.enqueueMutation` now checks the
original setup signal/host authority and retained account/process latches after
removing the setup listener, releasing mutation ownership/counts and synchronously
aborting the lease. This closes a success boundary at which a release listener
could previously cancel setup or stop activity after the final live-lease check.

The existing private normalized lifetime check accepts no controller only for
this post-release completion gate. Released lease methods still check their
aborted controller and cannot be revived. The canonical keyed queue still owns
serialization; pending siblings alone do not fail this gate. The facade's exact
committed installation/account/revision/tombstone completion checks remain
mandatory; the activity registry confers no stored policy or setup principal.

A settlement counter in each existing account activity record prevents pruning
until completion checks finish, including reentrant acquire/release callbacks.
Failure before cleanup closes admission before abort listeners; completion failure
retains the existing failed-account latch and cancels same-account readers and
sibling mutations. Original signal listener removal and count release occur once.
Successful settlement prunes only when otherwise idle and unblocked. Unrelated
accounts/plugins remain independent. No second state store, queue or runner.

Synchronous native/host callbacks cannot be preempted; failed completion can follow
already committed durable changes. No rollback, latch recovery, credential echo,
readiness inference or post-return authority is provided. The separate facade gate
still protects returned committed state. Actual synthetic regressions are deferred
in current `RELAY-IMAP-HOST-02.md`; no tests created/executed or runtime acceptance.

One source module, delta **+27/-10**. Prettier/strict main TypeScript/scoped ESLint
all exit **0**; tracked whitespace exit **0**, scoped no-index whitespace exit
**1** only because files differ, no diagnostics. Receipts:
`.maestro/verification/host-02-mutation-release-completion/`. Tests created/executed
**0/0**, images analyzed **0**, mock/production tested **false/false**. Full trusted
setup/lifecycle/public integration and production acceptance remain unfinished;
Backstage stays paused and HOST-05 gates remain unmet. [[CLAUDE-PLUGINS]] and
[[CLAUDE-CUE]] continue to govern.

## Final queued setup facade failure latches (HOST-02, 2026-10-08)

The existing five queued `MailAccountCredentials` paths (password save, enable,
rights replacement, removed-slot cleanup and disable/settings/removal) now run
their first post-queue setup check inside the canonical
`AuthorizationStore.assertMailMutationCompletion` gate. Original captured setup
signal/callback, authority-before-freshness ordering, exact installation,
revision/enabled state or tombstone cleanup marker checks remain mandatory.
The existing second authority/committed-state check still follows freshness work.
No released lease is reacquired or revived.

A completion rejection now invokes the canonical activity registry's
`failAccountMutation`. Queue failures reuse that same cancellation implementation.
A failed account is blocked before synchronous abort callbacks; its readers and
queued/in-flight mutation controllers are canceled. Mutation ownership and counts
remain until their actual settlement. If successful queue cleanup already pruned
that account's state, the failure creates a retained blocked state. Existing read
completion semantics are unchanged. Ordinary failures preserve unrelated accounts
and plugins. Late latch retention uses the existing 1,024-account bound; if a
missing latch cannot fit, the existing permanent process stop closes all activity
rather than losing the failure. There is no automatic latch recovery.

This host-private completion method accepts trusted queued-operation coordinates;
it is not a plugin/public setup route or proof of admission by itself. Error
normalization preserves existing content-free codes. Already committed sealed or
native changes are not rolled back. Synchronous work cannot be preempted. No trusted
setup principal, UI, capability/SDK/RPC/version, credential getter, lifecycle public
integration, monitoring/event/Cue subscription or production acceptance is added.
Full lifecycle and HOST-05 gates remain unfinished; Backstage stays paused.

Source delta: three existing modules, **+24/-10** lines. Formatting, strict main
TypeScript, configured scoped ESLint and tracked/scoped whitespace checks passed.
Tests created/executed **0/0**, images analyzed **0**; implemented/static-reviewed
only, mock/production-tested **false/false**. Actual synthetic regressions are
requirements in the current HOST-02 document, reserved for its separate test
creation/execution phases. Exact commands/PIDs/exits and preservation receipts:
`.maestro/verification/host-02-facade-completion-latch/`. See [[CLAUDE-PLUGINS]] and
[[CLAUDE-CUE]] for governing architecture.

## Host-private trusted setup confirmation core (HOST-02, 2026-10-08)

`src/main/plugins/mail-setup-confirmation.ts` adds `MailSetupConfirmation`, a
single-operation host-only confirmation/lifetime core. This supersedes historical
statements that no private setup confirmation core exists. Dedicated setup UI,
registered IPC, real surface/gesture adapters, per-operation closed intent admission
and production issuance remain absent. This is implemented and statically checked
only, not mock-tested or production-tested, and publishes no mail API/capability.

The core reuses `ConsentNonceRegistry`, `sameConsentSender`, canonical
`AuthorizationStore.readMailConfiguration`, closed `mailRecord` and dual-identity
validation, live-agent allowlist-member validation, activity error normalization and
`DURATION_MS.minute`. No second nonce algorithm, permission store, account/task state
engine, credential store, queue or dispatch runner is introduced.

All constructor dependencies are captured once: exact store/plugin/parsed dual
identity and bound current-frame, registered-surface policy, actual-user-gesture and
live-agent callbacks. No callback/signal has a permissive default. The private frame
snapshot requires closed data fields `webContentsId`, `frameId`, `url`, safe integer
IDs and a nonempty bounded URL; these coordinates alone never establish trust.
The mandatory host surface adapter must verify that main created/registered the
specific dedicated setup frame and that feature/plugin/consent/capability/generation
policy remains live. The gesture adapter must observe real activation in that exact
frame; a renderer request flag cannot replace it. The per-prompt original source
signal must abort on surface navigation/destruction/close, plugin generation/identity
loss, feature/consent revoke and host shutdown. `close()` is an additional explicit
host teardown seam. None of these Electron/lifecycle adapters is implemented here.

`open(sender, source, work)` is main-owned issuance only. It captures one already
validated host operation callback and closed immutable intent/account/revision;
these are the future host adapter's obligations, not inferred from the frame or
navigation labels. It returns a canonical opaque nonce only for the trusted frame.
Superseding an unconfirmed prompt consumes its nonce and aborts its old lifetime.
Only one pending prompt or running operation is retained; issuance during transition
or an unsettled running operation denies. Each original lifetime is at most one
minute from issuance, including confirmation and work. The core combines canonical
nonce expiry with a monotonic deadline and an unref'd cancellation timer; confirming
or performing work never extends it.

`confirm(sender, { nonce })` accepts a closed nonce-only request and exact actual
sender coordinates. One attempt consumes or cancels the ticket; replay, mismatch,
extra/accessor/inherited fields, stale frame, missing policy/gesture, unavailable
anchored persistence and source cancellation deny before work. A successful gate
calls only the captured host operation, with a frozen internal `MailGrantAuthority`.
That authority checks live frame/policy/anchored consent plus original lifetime;
agent checks additionally require main's live membership. It creates no sealed
agent/account rights. The confirmer receives `Promise<void>`, no operation data,
credential or authority object. Nonces, callbacks and signals must never enter a
plugin/tool/event/history/log path.

On normal work settlement, authority is permanently released and aborted before a
final original-lifetime/frame/policy/store check. Release callbacks can revoke/close
or fail that gate; late success is suppressed without reasserting a released lease.
Close, expiry, source abort, authority/membership failure and confirmation failure
forget the ticket before abort callbacks, consume the nonce and dispose its timer
and source listener. Reentrant issuance and confirmation deny. Canceled awaited
work retains the single execution slot until actual settlement; no forced promise
settlement, native preemption, rollback or account-failure-latch recovery is claimed.
The core does not itself mutate/enable accounts, save passwords, authenticate,
open frames or publish invalidation/status/events. Existing facades still own
exact account/revision/installation and canonical account failure latches. A later
host adapter must route every operation through those facades and separately
capture/validate its closed intent before issuance; it must not treat a reusable
navigation request or an arbitrary trusted callback as production acceptance.

Verification: one new source module, 266 lines; Prettier, strict main TypeScript,
scoped ESLint and whitespace checks only. Tests created/executed 0/0; images 0.
Actual synthetic tests for the core/facade/store/native seams remain deferred in
current HOST-02. Full lifecycle, setup UI/IPC/adapters, public SDK/RPC, production
acceptance and HOST-05 gates remain unfinished; Backstage remains paused.

## Host-private closed setup operation intents (HOST-02, 2026-10-08)

`src/main/plugins/mail-setup-operation-intent.ts` implements a secret-free closed
operation schema and pure stored-target preflight. This supplies the missing
intent-schema prerequisite to the private confirmation core; it does not wire
confirmation, call an account facade or issue production setup authority. See
[[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]]. Implemented and statically checked only;
mock-tested and production-tested remain false.

`parseMailSetupOperationIntent` snapshots exactly seven operation kinds:
`addDisabled`, `enable`, `replaceRights`, `disable`, `replaceSettings`, `remove`
and `cleanupRemoved`. Only add/settings replacement accepts bounded `settings`;
only rights replacement accepts bounded independent `agents` rights. Every other
operation carries only kind, exact opaque accountId and expectedRevision. Add has
no caller-supplied account ID or revision and cannot generate one. The parser
rejects navigation labels, password/secret fields, connection-test/login actions,
unknown fields, missing fields, accessors, inherited/non-enumerable/symbol fields
and malformed IDs/revisions/settings/rights with fixed `MAIL_INVALID` errors.
It returns independent frozen records and nested settings/rights arrays. Empty
rights are a valid clearing intent, never inferred read/detail/attachments access.

Canonical ID/revision implementations in `mail-account-config.ts` are re-exported
as `parseMailAccountId` and `parseMailAccountRevision`; no validation algorithm
is duplicated or relaxed. The new module composes `mailRecord`, settings/mutation/
agent-rights parsers, exact account/tombstone revision checks, existing account
limits and the pure configuration transition validator.

`requireMailSetupOperationTarget(configuration, request)` parses before preflight
and returns that captured snapshot. Its configuration must be the immutable
canonical configuration obtained by a trusted caller from the sealed store. Null
supports add only, and means authorized empty configuration only if that caller
actually read the store successfully; passing null cannot establish authorization.
Existing-account intents require the exact current revision and a nonterminal
revision capable of advancement. Enable additionally requires a disabled account.
Cleanup requires a retained exact tombstone, denies live/unknown/stale targets and
permits terminal tombstone revisions, matching the canonical cleanup seam.
Add checks account capacity; removal/settings/disable reuse pure transition bounds,
including exhaustion of never-trimmed removal history. No configuration is changed
or returned. Stored denial/staleness/limit errors remain fixed content-free codes.

These functions cannot verify a frame, gesture, plugin identity, installation,
agent membership, seal/anchor freshness or live activity/lifetime. A future host
issuer must bind the actual store/plugin/dual identity/installation, capture the
snapshot before callbacks, preflight again at confirmation and dispatch only to
existing guarded facades under the original confirmation authority. Facades still
own serialized admission, final revision checks, cancellation, native cleanup and
failure latches. No generic operation callback, password retention/ingestion, setup
UI/IPC/SDK/RPC, connection test, native/storage/network invocation, new store/queue/
runner, recovery or public route is added. These helpers have no production caller.
Full lifecycle/setup integration, production acceptance and HOST-05 remain unfinished;
Backstage remains paused. Actual tests are deferred separately in current HOST-02.

## Host-private setup confirmation intent binding (HOST-02, 2026-10-08)

`MailSetupConfirmation` now composes the existing closed operation intent parser
and stored-target validator. This supersedes the prior callback-only `open` shape:
`open(sender, source, request, work)` requires one of the seven existing secret-free
intents and snapshots it before host callbacks or superseded-ticket abort listeners.
Its captured work receives `(intent, authority)`; caller-owned request fields are
never reread. No second issuer, store, activity registry, queue or runner is added.
See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]]. Implemented and statically checked only;
mock-tested and production-tested remain false.

Before nonce return and during confirmation checks (including after the real gesture
adapter), the core preflights the captured intent against exact sealed-store plugin/
dual identity configuration. It captures the installation ID once, with explicit
null for authorized empty state. Installation replacement or empty-to-configured
state while pending denies. Target checks reuse canonical exact account/tombstone/
revision, account-capacity, disabled-enable and removal-history transition bounds.
Unrelated configuration changes between checks may pass when installation and target
remain valid; a configuration change inside the final current-frame callback denies
through an additional sealed-store reference recheck. No host callback follows that
recheck; original cancellation/deadline is checked again before success.

Immediately before invoking work, the ticket ends pre-mutation target admission.
Its own facade revision/configuration changes must not invalidate setup authority.
Original frame/policy/consent/store/lifetime/live-membership and release gates remain
active during and after work. Existing facades must still enforce exact queued
revision/installation, live cancellation, cleanup and canonical completion latches.
The core passes a snapshot to host work, but does not select or enforce a particular
facade. A future dedicated host adapter must route only that snapshot through the
existing fixed facades and must not reinterpret navigation or mutable request data.

No production caller, setup UI/IPC/SDK/RPC, real frame/gesture/lifecycle adapter,
credential input or connection-test/login action is added. No implementation runtime,
native keyring/storage/network access or tests were invoked for verification.
The private signature has no existing source callers; no public API version changes.
Malformed new intents fail before superseding an existing prompt; other original
nonce/lifetime/cleanup semantics remain in place. No rollback, latch recovery or
production acceptance is claimed. Full lifecycle/facade dispatch/setup integration,
HOST-05 gates and Backstage integration remain unfinished/paused. Actual synthetic
regressions are requirements in current HOST-02, for later separate phases.

## Host-private setup confirmation fixed-facade dispatch (HOST-02, 2026-10-08)

`MailSetupConfirmation` now owns a canonical `MailAccountCredentials` facade
constructed from the same captured store/plugin/parsed dual identity. This
supersedes the earlier callback-based confirmation shapes and statements that
fixed facade selection is absent. `open(sender, source, request)` accepts only
the existing closed secret-free intent. No operation callback or replacement
facade can be supplied; the ticket retains only its immutable captured intent.
See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]]. Implemented and statically checked
only; mock-tested and production-tested remain false.

The fixed internal switch maps all seven admitted kinds:

| Intent                                 | Existing guarded facade                                              |
| -------------------------------------- | -------------------------------------------------------------------- |
| `addDisabled`                          | `addDisabledAccount(settings, authority)`                            |
| `enable`                               | `enableAccount(accountId, expectedRevision, authority)`              |
| `replaceRights`                        | `replaceAgentRights(accountId, expectedRevision, agents, authority)` |
| `disable`, `replaceSettings`, `remove` | `mutateAccount(intent, authority)`                                   |
| `cleanupRemoved`                       | `cleanupRemovedAccount(accountId, expectedRevision, authority)`      |

Only the captured intent reaches these methods under the original internal
confirmation authority. Add's summary is discarded; confirmation returns
`Promise<void>` for every kind and publishes no account/configuration/credential/
authority result. Enable is stored intent with a slot availability probe, never
login or operational readiness. Independent rights still require live main-owned
membership and exact sealed account revision; no claimed tool agentId creates
rights. Disable retains the credential slot; settings/removal and tombstone
cleanup preserve the canonical stopped-intent and native-cleanup semantics.

An optional `entryFactory` is captured once with constructor dependencies,
validated as a function when present and passed to the existing facade solely
as its synthetic native seam for later tests. No facade, queue, store, dispatcher
or result override is exposed. Default construction retains the existing lazy
keyring factory; constructing this core performs no credential or native I/O.
No native/storage/network runtime was invoked for this implementation task.

Original issuance and confirmation installation/target preflight, single pending/
running slot, real frame/policy/gesture/membership checks, original one-minute
monotonic deadline, cancellation and release-before-final-check semantics remain.
The existing facades own serialized mutation admission, exact installation/revision,
cleanup and retained completion failure latches; this switch neither duplicates
nor resets them. Errors pass through the existing content-free confirmation
normalizer. No rollback or recovery after failure is claimed.

The module still has no production issuer or source caller. Dedicated setup frame,
Electron surface/gesture/lifecycle adapters, password ingestion/save confirmation,
UI/IPC/SDK/RPC and connection-test/login routes remain unavailable. Full lifecycle,
production acceptance and HOST-05 gates remain unfinished; Backstage stays paused.
This private signature changes no public API version. Actual synthetic regressions
are recorded in current HOST-02 for separate test creation/execution; tests
created/executed 0/0, images analyzed 0. Static checks and exact process/run/tab
receipts are in the evidence ledgers and worktree verification artifacts.

## Host-private confirmation issuance snapshots (HOST-02, 2026-10-08)

`MailSetupConfirmation.open` now captures the immutable validated sender and
closed intent before superseding the old prompt. Old-ticket abort listeners
cannot retarget the replacement through its caller-owned sender object. Main's
actual current frame still must match the original snapshot at every existing
authority check. The existing canonical sender parser, nonce registry, fixed
account facades, sealed store and activity queue are reused. See
[[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]]. Implemented and statically checked only;
mock-tested and production-tested remain false.

Malformed sender records and invalid/already-aborted source signals now deny
before closing an existing valid pending prompt. Malformed intents retain their
existing pre-supersession denial. This preserves the prior nonce and timer; it
does not mint or extend authority. A syntactically valid frame that fails later
live frame/policy checks still denies after supersession as before.

The one-minute monotonic deadline starts at issuance admission, before parsing
or superseded-ticket abort callbacks. Before and after old-ticket cleanup, the
core refuses expired admission; after cleanup it also checks the original source
signal before allocating a replacement nonce/controller/timer. Cancellation or
budget exhaustion during cleanup returns fixed `MAIL_CANCELED`. Replacement
expiry is scheduled using only the original remaining duration. Existing lifetime
checks retain that same deadline during confirmation, fixed facade work and final
release. The canonical nonce registry's wall clock cannot extend the monotonic
core deadline. Synchronous callbacks cannot be preempted; expiry suppresses work
and nonce return when control resumes, rather than promising an interrupt.

Single pending/running-slot ownership, exact plugin/dual identity/installation/
target binding, live surface/gesture/membership gates, cancellation, cleanup,
fixed dispatch and release gates remain unchanged. This is one existing-module
source prerequisite, without new helpers or runners. No production issuer,
Electron surface/gesture/lifecycle adapters, password input/save confirmation,
UI/IPC/SDK/RPC, credential/native/storage/network runtime or recovery was added.
Full lifecycle and production acceptance remain unchecked; HOST-05 gates remain
unmet and Backstage stays paused. Actual synthetic regression requirements are
in current HOST-02 for separate test creation/execution, neither performed here.

## Host-private confirm-time password save (HOST-02, 2026-10-08)

The existing closed intent parser and fixed `MailSetupConfirmation` now support
an eighth secret-free operation: `{ kind: 'savePassword', accountId,
expectedRevision }`. This supersedes earlier statements that password-save
confirmation is absent from the private core. Issuance still rejects all secret
fields; tickets retain only immutable secret-free intent and original authority
coordinates. Canonical target admission requires a live exact account/revision
capable of advancement and disabled state, at issuance and again at confirmation.
Unknown, removed, stale, terminal or enabled targets deny. Parsing confers no
authority. See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]]. Implemented and statically
checked only; mock-tested/production-tested remain false.

Only confirmation of this captured kind accepts the closed `{ nonce, password }`
input. Other kinds continue to accept exactly `{ nonce }` and reject credential
fields. The core snapshots the password before host policy/gesture callbacks and
uses canonical `assertImapQuotedString` with the existing 1024-character bound:
nonempty printable ASCII, no control characters or newlines. Malformed, inherited,
accessor, extra, symbol and hidden fields are rejected by canonical `mailRecord`.
The exact nonce/frame and real host-observed gesture, installation/target preflight,
consent/store/policy/cancellation and original monotonic one-minute lifetime gates
remain mandatory. The password never enters the ticket, intent, nonce registry,
logs, events, output or returned data; confirmation still resolves to void.

The owned fixed dispatcher invokes only canonical
`MailAccountCredentials.savePassword(accountId, expectedRevision, password, authority)`.
It drops its local secret reference immediately after handing ownership to that
facade, before adopting its promise. Confirmation drops its input-record reference
before host callbacks, clears its local password on controller cancellation and
after dispatch, and clears both on every admitted exit with listener removal.
The facade already owns queued secret lifetime/abort cleanup, exact installation/
revision admission, anchored disabled revision and rights clearing before native
save, exact-slot readback, final live checks and retained failure latches. These
semantics are composed unchanged; no second store/queue/runner or rollback/recovery
is introduced. The single running slot remains held through actual settlement,
including canceled queued work, and existing release/final checks suppress late
success.

JavaScript strings and caller-owned request objects cannot be zeroized: reference
dropping is not memory erasure or a claim to clear a future renderer input. Dedicated
host adapters must clear their input, authenticate the main-owned surface/gesture,
avoid request logging/history, and never route this through plugin or agent tools.
Those production issuer/surface/lifecycle/UI/IPC adapters and public integration
remain unavailable. There is no connection test, login, automatic enable, inferred
agent access or readiness claim. No implementation/native/storage/network/credential
runtime or tests were invoked here. Full lifecycle/production acceptance and
HOST-05 remain unfinished; Backstage stays paused. Actual synthetic regressions
are deferred in current HOST-02 to separate test-creation/execution phases.

## Synchronous mail authority assertions (HOST-02, 2026-10-08)

The existing `assertMailActivityAuthority` now requires synchronous successful
return of exactly `undefined`. TypeScript's `() => void` permits async functions;
the prior guard discarded their promises and could proceed before authorization
settled. Native promises, arbitrary thenables, booleans, null and every other
non-undefined return now deny immediately with content-free `MAIL_DENIED`. A late
fulfillment cannot admit work. Ordinary native promise rejection is observed using
Node's native `isPromise` brand check and intrinsic `Promise.prototype.then`, with
empty fulfillment/rejection handlers and no output, error content or authorization
from settlement. Arbitrary thenables are never inspected or assimilated, and a
promise's overridden `.then` method is not called. Synchronous assertion exceptions
retain the prior fixed ImapConnectionError code normalization without native causes.
See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

`MailSetupConfirmation.check` now forwards the actual registered-surface assertion's
return value through this canonical guard instead of discarding it inside its larger
closure. The existing gesture and live-agent assertion wrappers already forward their
leaf results and now receive the same synchronous refusal. A refused surface check
cancels/detaches its ticket through the existing path; no nonce return, subsequent
sealed-target admission or facade dispatch follows it. Existing exact sender/plugin/
dual identity/install/target checks, single running ownership, monotonic lifetime,
queue/lease cleanup and failure latches remain. No new authority, state, runner,
callback default or public route is introduced.

This change enforces the guard's direct callback contract, not a comprehensive audit
of every nested assertion or direct callback in private slot/transport/verified-policy
code. Wrappers must forward their leaf assertion results or guard them explicitly;
returning undefined after discarding an inner promise cannot prove synchronous policy.
Adapters must throw synchronously on denial. The guard cannot cancel an invalid async
adapter's own side effects or preempt synchronous callbacks; observing rejection is
not cancellation, rollback, recovery or production frame/gesture proof. Ordinary
native promise observation is not acceptance of arbitrary Promise subclass/species
behavior. Full trusted setup/lifecycle/public integration and production acceptance
remain unchecked; HOST-05 gates are unmet and Backstage remains paused.

Changed two existing modules, total **+19/-3** source lines. Prettier, strict main
TypeScript, scoped ESLint and tracked whitespace all exit **0**. Tests created/
executed **0/0**, images analyzed **0**; implemented/static checked only,
mock-tested/production-tested **false/false**. No implementation/native/storage/
network/mail/login runtime invoked. Exact receipts and source baseline/delta are in
`.maestro/verification/host-02-synchronous-authority-guards/`; synthetic regression
requirements are deferred in current `RELAY-IMAP-HOST-02.md`.

## Synchronous private credential-slot assertions (HOST-02, 2026-10-08)

`MailCredentialSlot.assertActive` now forwards its captured actual callback result
through existing `assertMailActivityAuthority`. Previously its direct invocation
discarded an async callback's promise and admitted native credential work before
authorization settled. Exactly `undefined` is now required synchronously at every
existing slot check: save, availability probe, removal and fixed LOGIN. Native
promises, arbitrary thenables and other values deny immediately without awaiting
or thenable assimilation; ordinary native rejections are observed by the canonical
guard without exposing content or authorizing from settlement.

The slot retains its existing fixed `MAIL_DENIED` normalization for assertion
failures, original-signal checks before/after callbacks, captured bound receiver,
exact installation/plugin/account namespace, native operation ordering, secret
reference cleanup and failed LOGIN close/listener cleanup. No new guard, state,
queue, runner, password getter or public route was added. This boundary does not
cancel an invalid async callback's own side effects, preempt synchronous work,
recover latches or establish production setup policy. Direct transport and nested
verified-policy callback auditing remain separate prerequisites, as do full
lifecycle, production issuer/surface/IPC/SDK/RPC and integration acceptance.
See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]]. Backstage remains paused; HOST-05 gates
are unmet.

One existing source module changed, **+2/-1** lines. Prettier, strict main
TypeScript, scoped ESLint and tracked whitespace exit **0**. Tests created/executed
**0/0**, images **0**; implemented/static checked only, mock-tested and
production-tested **false**. No implementation/native/storage/network/mail/login
runtime invoked. Exact baseline, delta, process and check receipts are retained in
`.maestro/verification/host-02-credential-slot-synchronous-authority/`; actual
synthetic requirements are deferred in current `RELAY-IMAP-HOST-02.md` for separate
test creation/execution.

## Synchronous configured IMAP transport assertions (HOST-02, 2026-10-08)

The existing configured connection capture now binds its original host assertion
once and invokes it through canonical `assertMailActivityAuthority`. All four
existing captured invocation sites share this guarded closure: initial admission
before endpoint work, post-endpoint admission, live session checks, and fixed-plan
post-close completion. TypeScript void callbacks can be async; their return was
previously discarded. Successful authorization now requires exactly `undefined`
synchronously. Promises, thenables and other return values deny immediately with
fixed content-free `MAIL_DENIED`, without awaiting or arbitrary thenable inspection.
The canonical guard observes ordinary native rejection without publishing content
or treating promise settlement as authorization. See [[CLAUDE-PLUGINS]] and
[[CLAUDE-CUE]].

Existing connection failure handling still destroys the socket, disposes framing,
erases owned pending literals/writes, clears timers/listeners and releases account/
plugin admission. Fixed-plan completion still erases accumulated FETCH bytes on
failure after close. Original callback receiver, signal, deadlines, configured
endpoint, live port policy and terminal-session semantics remain. No new helper,
guard, store, queue, runner, SDK/RPC or production route was added. Static review of
the existing cyclic mail imports found no top-level guard invocation; module-load
and transport runtime regressions remain deferred to the separate test phases.

This assertion boundary does not cancel an invalid async adapter's own side effects,
preempt synchronous work, or prove real caller/setup policy. Nested verified-policy
assertion review, dedicated setup/frame/gesture adapters, lifecycle/public delivery
and production integration remain unfinished. No tests or implementation/native/
storage/network/mail/login/credential runtime were invoked. One existing source
module changed, **+3/-1** lines; static check receipts and exact process/run/tab IDs
are in `.maestro/verification/host-02-transport-synchronous-authority/` and the Host
evidence ledgers. Tests created/executed **0/0**, images analyzed **0**; mock-tested
and production-tested **false**. HOST-05 gates remain unmet and Backstage stays
paused; full lifecycle/production acceptance remains unchecked.

## Synchronous nested read-policy assertions (HOST-02, 2026-10-08)

`MailInvocationReadAuthority` now forwards the actual captured bound
`assertPolicyActive` result through canonical `assertMailActivityAuthority` at
its leaf invocation. The outer guarded closure previously discarded that result,
so a pending, fulfilled or rejected promise could appear as synchronous success.
Successful policy assertion now requires exactly `undefined` synchronously.
Promises, arbitrary thenables and all other return values deny with fixed
`MAIL_DENIED`, without awaiting or inspecting arbitrary `.then` properties.
Ordinary native rejection observation belongs to the existing guard and confers
no authorization or published content. Synchronous fixed mail exceptions retain
canonical normalization. See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

The original bound callback/receiver, immutable plugin/dual identity, verified
agent, operation-selected independent right, and registry checks before/after
policy remain. No callback argument comes from a tool-supplied caller ID. Denial
stops before the post-policy registry check and subsequent sensitive work; valid
synchronous policy still reaches that check, preserving reentrant invalidation.
No new helper, authority, store, queue, runner, public route or production policy
adapter was added. Invalid async adapter side effects cannot be canceled or
rolled back by observing their promise. A wrapper that discards its own inner
async result still requires a separate leaf audit; no comprehensive adapter
acceptance, latch recovery or production frame/gesture/caller proof is implied.

One existing source module changed, **+4/-1** lines. Formatting, strict main
TypeScript, scoped ESLint and tracked whitespace exit **0**. Tests created and
executed **0/0**, images analyzed **0**; implemented/static checked only,
mock-tested and production-tested **false**. No implementation/native/keyring/
storage/network/mail/login runtime was invoked. Deferred actual synthetic
regressions are recorded in current `RELAY-IMAP-HOST-02.md`; exact baseline,
source delta and receipts are retained in
`.maestro/verification/host-02-nested-policy-synchronous-authority/`.
Full lifecycle/public integration/production acceptance and HOST-05 remain
unfinished; Backstage stays paused.

## Synchronous sealed-ledger nested assertions (HOST-02, 2026-10-08)

Actual source review found six external assertion results discarded inside the
canonical ledger's outer guarded closures. The outer closure returned undefined
regardless of an inner promise. Existing `mailReadAuthority` now passes both
actual caller assertion results through `assertMailActivityAuthority`; existing
`enqueueMailAccountMutation` and `enqueueRemovedMailAccountCleanup` each pass both
actual setup assertion results through the same canonical guard. Exactly undefined
is required synchronously. Native promises, arbitrary thenables and all other
values deny immediately with fixed `MAIL_DENIED`; no awaiting, arbitrary thenable
inspection or authorization from settlement is added. Ordinary native rejection
observation remains the canonical guard's behavior, with no rejection content.
See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

Read admission and release-safe completion retain exact plugin, dual identity,
account/revision and independent sealed agent-right checks on both sides of caller
callbacks. Queued mutation and removed-account cleanup retain source cancellation
checks before/after external assertions, existing revision/installation/removal
checks, canonical queue/lease settlement and permanent failure latches. A first
invalid assertion denies before subsequent stored checks/admission; a later invalid
assertion denies after the preceding stored read, before the next step. In-flight
rechecks use the existing queue failure/cleanup path. No new authority/helper/store/
queue/runner, credential route, policy adapter or production caller is introduced.

This closes these six leaf-result gaps only. It does not cancel side effects of an
invalid async adapter, preempt synchronous work, establish frame/gesture/caller
proof, or fix an adapter that discards its own inner results. Full trusted setup,
lifecycle/public integration, production acceptance and HOST-05 remain unfinished;
Backstage stays paused. Synthetic regression requirements are recorded in current
`RELAY-IMAP-HOST-02.md`; test creation and execution remain separate.

Changed one existing module `src/main/plugins/authorization-ledger.ts`, source delta
**+7/-7** including its assertion-contract comment. Prettier, strict main TypeScript,
scoped ESLint and tracked whitespace exit **0**. Tests created/executed **0/0**,
images analyzed **0**; implemented and statically checked only, mock-tested and
production-tested **false**. No implementation/native/storage/network/mail/login
runtime invoked. Exact receipts and preservation baseline/delta are retained in
`.maestro/verification/host-02-sealed-callback-synchronous-authority/`.

## Account-bound setup confirmation completion (HOST-02, 2026-10-08)

Actual review found `MailSetupConfirmation.confirm` used only setup surface and
lifetime checks after facade success, including after synchronous release. A final
surface assertion or release listener could change the settled target or admit a
same-account mutation without a canonical account completion recheck.

The existing fixed `execute` now retains only the exact account ID internally for
all eight intent kinds. Disabled addition uses the host-generated ID from the
canonical facade summary; the other kinds use their captured intent ID. This
supersedes the earlier statement that add's entire summary is discarded. The
public `confirm` still returns `Promise<void>`; no ID, configuration, authority,
credential, body or attachment is published. Password dispatch still drops its
local secret reference before promise adoption settles; its continuation captures
only the secret-free intent.

After fixed facade success, confirmation captures the canonical settled
configuration before final surface checks or release callbacks. It reuses
`AuthorizationStore.assertMailMutationCompletion` with that same configuration
and exact target both before and after synchronous controller release. The original
source signal supplies cancellation after the internal controller is intentionally
aborted; post-release setup checks use the existing release-aware path and never
assert or revive released authority. The original final monotonic lifetime check
remains after the canonical gate.

The canonical completion guard owns exact installation/plugin/dual identity,
account revision/enabled or removal revision/cleanup metadata checks, persistence
freshness, pending/failed account mutations and plugin/global stop latches. It
checks stored target state around setup callbacks and latches its completion
failures, preserving unrelated-account isolation. No second lease, queue, store,
runner, native credential operation, recovery or public route was introduced.
Existing facade committed-state completion checks remain mandatory.

This snapshot is captured **after** the awaited facade result. It does not prove
an atomic handoff of the facade's original committed configuration across promise
adoption, close that earlier scheduling boundary, or strengthen native-check
synchronous deadline guarantees. No rollback or readiness is inferred. Dedicated
production setup frame/policy/gesture/lifecycle adapters, public integration,
full lifecycle acceptance and HOST-05 remain unfinished; Backstage remains paused.
See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

Implemented/static-checked only: one source module, **+31/-16** lines relative to
this task's dirty baseline. Source Prettier, strict main TypeScript and scoped
ESLint exits **0/0/0**. Tests created/executed **0/0**, images analyzed **0**,
mock-tested/production-tested **false/false**. Actual synthetic regression
requirements are in current HOST-02; creation and execution stay separate. Receipts
are retained in `.maestro/verification/host-02-confirmation-account-completion/`.

## Run and invocation synchronous assertion reentrancy (HOST-02, 2026-10-08)

Source implementation/static checks only: existing `PluginToolRunIdentity.check`
and `checkInvocation` now fence recursive checks of the same record before another
host assertion is invoked. Each existing RunProof/Invocation initializes one
checking flag; each check restores its prior flag in finally. Recursion throws
fixed `MAIL_DENIED` through the existing failure path: run recursion removes the
run and its nested handles; invocation recursion removes that invocation. Removal
still forgets the record before abort callbacks and cleans the existing timers,
indexes and source listeners. Catching the recursive denial inside a host callback
cannot restore a removed record; outer lifetime gates also refuse completion.

Normal sequential parent-run checks inside invocation checks remain available.
Exact registry context/plugin binding, captured callbacks/signals, membership,
deadlines, global/per-run/per-plugin limits and stopped/revoked-record denial are
unchanged. No second registry, queue, store, helper or runner is added. This is not
production membership, mail policy, issuance or public setup/SDK/RPC/Cue acceptance.
New-record issuance from callbacks and broader arbitrary adapter side effects are
outside this prerequisite; the flags only fence checks of existing records.
Synthetic recursion/cleanup/isolation regressions remain requirements for the
separate test creation/execution phases. Tests created/executed 0/0; no product,
keyring/storage/network/login runtime was invoked.

## Retained account activity lease assertion reentrancy (HOST-02, 2026-10-08)

Implemented and statically checked only: existing read and queued mutation leases
in `mail-account-activity.ts` now fence recursive `assertActive` of the same lease
before another host authority callback. Each closure keeps one local checking flag
and restores its prior value in finally. Inner recursion throws fixed `MAIL_DENIED`.
The existing read failure path releases that handle idempotently; outer checks
observe its aborted controller even when the callback catches inner denial.

Queued mutation lease assertion failures now immediately use the existing cancel
path, before callback code can catch denial and continue with an active lease.
Canonical account failure latching aborts target readers and queued/in-flight
mutation controllers. The original queue retains mutation ownership and counters
until actual settlement; existing failure normalization and final cleanup remain.
Neither catching inner denial nor finally restoring the local flag revives an
aborted handle or clears the account failure latch. Ordinary sequential checks,
original source/authority, limits and unrelated-account state remain unchanged.

One existing source module changed, **+22/-1** lines. No new helper, store, queue,
runner, public route or production adapter. This fences existing lease assertions
only; new lease issuance from callbacks, admission/completion recursion and broader
arbitrary adapter side effects are outside this prerequisite. It cannot preempt
host work that ignores a canceled lease or undo already committed effects.
Synthetic regressions are requirements in current HOST-02, neither authored nor
executed. Full lifecycle/production acceptance/HOST-05 remain unfinished; Backstage
stays paused. See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]]. Tests created/executed **0/0**,
images analyzed **0**; mock-tested/production-tested **false/false**.

## Same-account reads wait through mutation settlement (HOST-02, 2026-10-08)

Implemented and statically checked only: `mail-account-activity.ts` now uses the
existing `AccountActivity.settlingMutations` counter in read acquisition prechecks,
retained read post-authority checks and the existing completion state-check closure
before/after its authority callback. The mutation controller set is emptied before
synchronous release listeners and the owner's final authority check; the settlement
counter remains positive through both. Same-account activity read admission and
completion now deny this window with fixed `MAIL_UNAVAILABLE`. Acquisition denies
before its read callback/controller allocation at the activity boundary; canonical
store wrappers still perform their own earlier stored-right/authority checks.

The mutation owner's final check remains the existing internal `check(undefined, ...)`,
so its own settlement does not deny itself. Queued sibling mutation admission and
ownership are preserved. Successful settlement decrements the counter and permits
normal subsequent reads; failure retains the canonical blocked-account latch.
Existing release/cancellation counters, pruning, original authority/signal and
unrelated account/plugin isolation are preserved. No new state/helper/store/queue/
runner or production route. This closes only read admission/completion during
canonical queue settlement, not broader callback recursion or final facade delivery.

One existing source module, **+5/-2** lines; formatting, strict main TypeScript,
scoped ESLint and tracked whitespace each exit **0**. Actual source/receipt artifacts:
`.maestro/verification/host-02-read-settlement-admission/`. Synthetic regression
requirements are in current `RELAY-IMAP-HOST-02.md`, neither authored nor executed.
Tests created/executed **0/0**, images analyzed **0**, mock-tested/production-tested
**false/false**. Full lifecycle/setup/public integration, production acceptance and
HOST-05 remain unfinished; Backstage stays paused. [[CLAUDE-PLUGINS]] and
[[CLAUDE-CUE]] continue to govern. No runtime security or recovery claim.

## Asynchronous setup facade committed-state handoff (2026-10-08)

Implemented and statically checked only. The five host-private asynchronous
`MailAccountCredentials` methods `savePassword`, `enableAccount`,
`replaceAgentRights`, `cleanupRemovedAccount` and `mutateAccount` now return their
existing immutable `MailAccountConfiguration` after the canonical final mutation
completion gate. This supersedes their historical private `Promise<void>` return
contract. The receipt contains private configuration, never a password or new
permission; trusted host callers must not project it to SDK/IPC/logs/events.
Existing safe stored summaries and public confirmation remain unchanged.

Fixed `MailSetupConfirmation.execute` carries that exact snapshot through promise
adoption. Confirmation binds it to the captured intent accountId and supplies it
to both existing `assertMailMutationCompletion` gates, before and after synchronous
release. It cannot adopt a later target revision, enabled state or removal cleanup
status as this asynchronous operation's success by reading a fresh snapshot.
Canonical account-bound comparison still tolerates unrelated-account changes and
retains its failure latch when a gate fails. Original setup lifetime, cancellation,
nonce/frame/gesture checks, queue ownership and password-reference cleanup remain.
No receipt persistence, cache, extra native operation or alternate helper/store/
queue/runner. No production adapter, public route or plugin integration.

Synchronous `addDisabledAccount` continues to return only its safe summary.
Confirmation's add branch still reads configuration after its existing promise
handoff; exact synchronous-add handoff is outside this bounded prerequisite.
Downstream publication must retain its own live checks. Runtime security and
atomicity are not established by source/static checks. Separate synthetic
regression requirements are in current `RELAY-IMAP-HOST-02.md`; no tests created
or executed. Two existing modules changed, **+47/-23** lines. Formatting, strict
main TypeScript, scoped ESLint and tracked whitespace each exit **0**. Artifacts:
`.maestro/verification/host-02-async-confirmation-commit-handoff/`.
Full lifecycle/public integration/production acceptance and HOST-05 remain
unfinished; Backstage stays paused. [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]] govern.

## Synchronous disabled-add committed-state handoff (HOST-02, 2026-10-08)

Implemented and statically checked only. The host-private
`MailAccountCredentials.addDisabledAccount` now returns the same original
immutable `MailAccountConfiguration` its canonical synchronous add committed,
after the existing setup, sealed-persistence, revision-1/disabled and source
cancellation checks. This supersedes its earlier private safe-summary return
shape, including historical sections above. Private receipts contain endpoint,
username and configuration metadata, never a password or new authority, and must
not be projected to SDK/IPC/logs/events. Existing `listStoredAccounts` and
`AuthorizationStore.listStoredMailAccounts` still return only their unchanged
allowlisted stored summaries. Public `MailSetupConfirmation.confirm` stays void.

Fixed `execute` now carries a configuration for every operation. After promise
adoption, confirmation derives the exact host-generated new account ID from the
last account in the original add commit, requires disabled revision 1 and supplies
that same configuration/ID to both existing account-bound canonical completion
gates. It never reads fresh configuration to determine add completion. A later
target mutation cannot become the add's apparent original success, and an
unrelated appended account cannot retarget it. Existing account-bound gates still
tolerate unrelated-account changes after handoff and retain target failure
latches. Earlier whole-configuration checks inside synchronous add remain intact.
Original settings capture, setup lifetime/source cancellation, frame/gesture/nonce
checks, release-aware final checks, and async operation behavior remain intact.

No new receipt cache/persistence, helper, store, queue, runner, credential operation,
production setup adapter or public route. Synthetic regression requirements are
recorded only in current `RELAY-IMAP-HOST-02.md`; no tests authored or executed.
This source handoff is not runtime or production acceptance. Downstream publication
needs its own live checks. Full lifecycle, production issuance/integration,
production acceptance and HOST-05 remain unfinished; Backstage remains paused.
Two existing modules changed, +13/-26 source lines. Verification artifacts:
`.maestro/verification/host-02-add-confirmation-commit-handoff/`.
[[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]] remain governing references.

## Same-account read admission recursion (HOST-02, 2026-10-08)

Implemented and statically checked only in existing authorization-ledger.ts and
mail-account-activity.ts. Canonical read acquisition captures exact identity and
uses the existing stored account/revision/agent/independent-right assertion before
allocating an activity key. Its live host callbacks now run within activity
admission, with the existing live/stored double check intact. Stored validation
alone cannot authorize or return a lease.

The existing bounded account state temporarily retains the current admission
controller. Another same-account read acquisition aborts it and returns fixed
MAIL_DENIED before allocating another reader or calling another host assertion.
The outer check observes cancellation even if that callback catches the inner
error. The marker remains registered through release/failure cleanup, then clears
and prunes in finally. Existing readers of that account are not canceled merely
by recursive issuance; sequential acquisitions and other account/plugin admission
remain available under their original policy and limits. No second registry,
helper, store, queue, runner or public/production route was introduced.

This fences synchronous host-authority recursion during new read admission only.
Native anchor/seal adapter reentrancy, recursive mutation admission and recursive
final completion remain outside this prerequisite. Retained lease guards,
canonical mutation/stop invalidation and settlement gates remain mandatory.
Synthetic regression requirements are recorded in current RELAY-IMAP-HOST-02.md;
tests created/executed 0/0, images analyzed 0, mock-tested/production-tested false/false.
Source delta +27/-5 across two modules. Full lifecycle, production setup/issuance,
public integration/acceptance and HOST-05 remain unfinished; Backstage stays paused.
Evidence and exact checks are retained in
.maestro/verification/host-02-read-admission-reentrancy/.
[[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]] govern the remaining work.

## Same-account queued mutation admission recursion (HOST-02, 2026-10-08)

Implemented in existing authorization-ledger.ts and mail-account-activity.ts;
static verification only, not mock/production acceptance. Both canonical queued
entry points capture identity and validate the exact live account or retained
removal tombstone/revision before activity allocation. Initial setup callbacks
now run inside guarded activity admission. Stored validation does not authorize
work by itself; original live checks and stored queue-drain checks remain required.

The existing bounded account state retains its admitting mutation controller.
Recursive same-account enqueue fails with fixed MAIL_DENIED before another
controller, authority callback or queue item. It invokes the existing account
failure path, canceling readers and queued/in-flight mutations and retaining the
failure latch. Outer admission observes cancellation even if the callback catches
inner denial. The marker stays registered through read invalidation, source abort
listener registration, queue insertion and failure cleanup. An explicit post-read-
invalidation cancellation/latch check prevents insertion after a read abort listener
recursively denies the admission. Synchronous admission failures remove the source
listener and only their own controller/counter; queued owners retain their counters
until settlement. Finally clears the marker and prunes only eligible empty state.

Ordinary nonrecursive queued siblings and other-account/plugin admission preserve
the existing limits, queue, captured policy, mutation leases, cancellation, release
and settlement gates. A recursive failure cancels existing same-account siblings;
it cannot reset a latch. No new helper, registry, store, queue, runner, public route
or production setup/plugin integration. Source delta +71/-58 across two modules,
including formatter indentation; fewer than 500 changed source lines.

Native anchor/seal adapter recursion before stored validation completes, facade
pre-admission setup assertions, recursive final completion and broader lifecycle
remain separate. Synthetic regression requirements are in the current
RELAY-IMAP-HOST-02.md. Tests created/executed 0/0, images analyzed 0;
mock-tested/production-tested false/false. Full lifecycle, production setup/issuance,
public integration/acceptance and HOST-05 remain unchecked; Backstage stays paused.
Evidence: .maestro/verification/host-02-mutation-admission-reentrancy/.
[[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]] govern the remaining work.

## Same-account final completion recursion fence (HOST-02, 2026-10-08)

Implemented and statically checked only. Both canonical final read and queued
mutation completion gates already use `MailAccountActivity.assertCompletion`.
That existing method now retains a private completion controller on its existing
bounded exact-plugin/account activity state before invoking host authority.
Completion after a released lease pruned its state allocates only through the
existing account-state limit; capacity denial invokes no authority callback.
Recursive same-account completion aborts the original controller and throws fixed
`MAIL_DENIED` before another callback or controller allocation. Caught inner denial
cannot authorize the outer completion: it observes cancellation and denies with
`MAIL_CANCELED`, or an existing authority/stored-state/stop failure first.
This applies across read and mutation final gates sharing the same account.

Pruning now retains active completion state through the host callback and final
current-state check. Finally clears the marker and prunes only eligible empty
state. Sequential and different-account/plugin completions keep their existing
behavior; existing pending/settling mutation and account/plugin/global stop gates
still run before and after authority. Canonical mutation completion continues to
latch any final failure through its existing catch path. Read-only recursion does
not introduce a permanent mutation latch. No released lease is revived, no
completion handle escapes and no second registry/helper/store/queue/runner or
public route is introduced.

One existing source module changed, +19/-3 lines. Formatting, strict main
TypeScript, scoped ESLint and tracked whitespace each exit 0. Verification:
`.maestro/verification/host-02-completion-reentrancy/`. Synthetic regression
requirements are recorded in current `RELAY-IMAP-HOST-02.md`, neither authored nor
executed. This source/static evidence does not establish runtime security.
Native anchor/seal adapter recursion, facade pre-admission assertions, production
setup/issuance and broader lifecycle remain separate. Tests created/executed 0/0,
images analyzed 0; mock-tested/production-tested false/false. Full lifecycle/public
integration/production acceptance/HOST-05 remain unfinished; Backstage stays paused.
See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

## Credential-slot operation recursion fence (HOST-02, 2026-10-08)

Implemented and statically checked only. Existing `MailCredentialSlot` now retains
one transient private `AbortController` for its active save, availability probe,
removal or fixed LOGIN operation. Admission precedes authority field capture and
all authority/native callbacks. Recursive or overlapping operations on that same
instance abort the owner's fence and fail with fixed `MAIL_DENIED` before another
operation captures authority or performs native work. The inner call never owns or
clears the outer fence. Existing live assertions check this denial before and after
host callbacks, so catching inner denial cannot authorize outer continuation.

LOGIN registers its existing safe close callback on the private fence before
capturing caller authority, holds it across the fixed operation await, checks after
session assertions and removes the source cancellation listener while still fenced.
A final live/denial check follows successful listener removal; failure cleanup
retains ownership through close/listener removal and clears only an admitted
operation's own fence in finally. Failed cleanup adapters cannot return native
error content. Independent slot instances and ordinary sequential same-instance
reuse remain available under their existing required authority. No fence, signal,
credential or native entry is exported; no credential cache/getter is introduced.

This fence is instance-local, not an account-wide lock or an assertion of real
native-adapter trust. Canonical `MailAccountActivity`, sealed store and existing
facades still own cross-instance account admission, mutation ordering, generation
checks and retained failure latches. No account/plugin/global latch is reset here.
A native write/delete already performed before its callback reenters is not rolled
back, and JavaScript strings cannot be zeroized; existing facade commits, cleanup
metadata and failure latches remain necessary. Asynchronous arbitrary adapter side
effects, production setup/frame/gesture/membership adapters, public SDK/RPC/Cue and
full lifecycle delivery remain separate. No authentication/readiness or production
acceptance is claimed.

One existing source module, +47/-4 lines; final Prettier, strict main TypeScript,
scoped ESLint and tracked whitespace exit 0. First static pass found two
`no-unsafe-finally` ESLint errors (exit 1); the success cleanup check was moved into
the guarded body and all four final checks were rerun successfully. Receipts and
checked source hash: `.maestro/verification/host-02-credential-slot-reentrancy/`.
Tests created/executed 0/0, images analyzed 0, mock-tested/production-tested
false/false. Full lifecycle/production acceptance/HOST-05 remain unchecked;
Backstage stays paused. See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

## Setup facade authority assertion recursion fence (HOST-02, 2026-10-08)

Implemented and statically checked only in existing `mail-account-credentials.ts`.
The existing `MailAccountCredentials.setupAuthority` wrapper now shares one
transient private assertion controller per facade instance. Capture enters before
reading the original `signal` or `assertActive` fields; each retained setup
assertion enters before invoking its original bound callback. Nested capture or
assertion on that facade aborts the active controller and fails with fixed
`MAIL_DENIED` before another source accessor or callback. Checks between capture
accessors and after callback evaluation detect caught recursion and refuse outer
success with `MAIL_CANCELED`, or an earlier normalized authority failure.

The controller stays private and its owner clears it in finally. Sequential
assertions and independent instances remain available under their original
required authority. Callback/source snapshots, synchronous no-result validation,
exact installation/plugin/account/revision/grant checks, canonical admission and
queue ordering, cancellation and permanent account/plugin/global failure latches
are retained. The facade fence does not span awaits or replace canonical account
activity; it creates no exported utility, second registry/store/queue/runner,
credential getter/cache, public route or production adapter.

This covers only setup-authority capture and `assertActive` evaluation on one
facade instance. Agent-membership callbacks, native adapters and cross-instance
pre-admission recursion remain separate. Already committed/native effects cannot
be rolled back. No production setup, frame/gesture, issuance, SDK/RPC/Cue or full
lifecycle acceptance is implied. Synthetic regression requirements are recorded
in the current `RELAY-IMAP-HOST-02.md`; tests created/executed **0/0**, images
analyzed **0**, mock-tested/production-tested **false/false**. One source module,
**+38/-12** lines; static formatting, strict main TypeScript, scoped ESLint
and tracked whitespace exit **0**. Receipts:
`.maestro/verification/host-02-setup-assertion-reentrancy/`.
Full lifecycle/public integration/production acceptance/HOST-05 remain unfinished;
Backstage stays paused. See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

## Retained attachment publication assertion recursion guard (2026-10-08)

Implemented and static-checked only in `mail-attachment-snapshot.ts`; no runtime
acceptance, production caller or public surface. Existing `readChunk` guarded
recursive chunk reads, but retained public `assertActive()` had no assertion owner
and could recursively call the same authorization callback. A transient per-snapshot
marker now admits only one synchronous publication assertion before signal checks
or authorization callbacks. Nested entry closes the snapshot through its existing
erasure/listener/reservation/lease cleanup and throws fixed `MAIL_DENIED` before
another authority callback. If the callback catches that denial, the original
post-callback closed-state check rejects with `MAIL_CANCELED`. The rejected inner
call cannot clear the outer marker; only the admitted assertion clears it in
finally. Closure remains permanent.

The same path protects assertions before/after chunk encoding and explicit
publication checks, including after final chunk completion. Existing sequential
checks, chunk offsets/completion, independent snapshot accounting, exact invocation/
account/agent/attachments policy and original deadline checks are preserved.
No canonical account/plugin/global failure latch is reset; no helper, registry,
store, queue, runner, timer or production adapter is introduced. Previously returned
base64 strings/labels cannot be erased or recalled. Synthetic actual-composition
regression requirements are recorded in current `RELAY-IMAP-HOST-02.md`; tests
remain separately uncreated/unexecuted for this prerequisite. Full lifecycle,
public integration and production acceptance remain incomplete; Backstage paused.
Related architecture: [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

## Run-proof issuance recursion guard (HOST-02, 2026-10-08)

Implemented with static checks only in existing `plugin-tool-run-identity.ts`.
`PluginToolRunIdentity.issue()` retains one transient private issuance controller
before capturing authority fields or evaluating host assertions. Recursive same-
registry `issue()` cancels the owner and throws fixed `MAIL_DENIED` before another
authority capture, controller or proof token. Admission checks before/after initial
run and membership assertions, after bounded expiry pruning, after source listener
registration and after final retained proof checks observe caught nested denial.
The fence survives failure removal and synchronous cleanup listeners; only the
admitted owner clears it in finally. Failed admission cannot return a proof.

Sequential issuance, independent registry instances and unrelated existing proofs
remain available under existing limits, captured policy, source/agent/run/stop gates
and expiry. The local guard neither revokes unrelated proofs nor resets canonical
account/plugin/process latches. It adds no registry/store/queue/runner/public route,
timer, credential or production adapter. One existing source module: +23/-5 lines.
The existing issuance deadline calculation is retained; no expiry extension occurs.

Nested invocation issuance, facade/policy recursion, native adapter trust, production
membership/run lifecycle integration and public delivery remain separate. In a final
retained check, nested denial is observed at the following admission gate; existing
retained assertions may finish synchronously before failed-proof removal. No claim
of transactional callback effects or runtime security follows from static checks.
Synthetic regression requirements are in current `RELAY-IMAP-HOST-02.md`; tests
created/executed 0/0, images analyzed 0, mock-tested/production-tested false/false.
Full lifecycle/public integration/production acceptance/HOST-05 remain unfinished;
Backstage stays paused. Verification: `.maestro/verification/host-02-run-issuance-reentrancy/`.
See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

## Invocation-handle issuance recursion guard (HOST-02, 2026-10-08)

Implemented with static checks only in existing `plugin-tool-run-identity.ts`.
`PluginToolRunIdentity.issueInvocation()` now retains one transient private
invocation admission controller before context validation or authority capture.
Nested same-registry invocation issuance cancels the owner and throws fixed
`MAIL_DENIED` before another authority capture, controller or handle allocation.
Checks after each authority accessor, around existing initial plugin/run/membership
checks, after bounded expiry pruning and lifetime registration, and after final
retained invocation checks suppress outer handle return when nested denial is
caught. Only the admitted owner clears the fence in finally, after failed-handle
removal and synchronous cleanup callbacks. Cleanup cannot mint a replacement while
that owner remains active.

Exact registry-issued context membership, plugin lifetime binding, shared lifetime
listener accounting, original run/invocation expiry and hard global/per-run/per-
plugin bounds remain. The existing retained checks still own run/source/agent/
stop/revoke authority and remove stale handles. Sequential issuance and independent
registries retain their existing gates; unrelated handles and run proofs are not
revoked solely by the transient fence. There is no new exported helper, registry,
store, queue, runner, timer, credential or public/production route.

The fence covers synchronous invocation issuance on one registry. Final retained
callbacks may finish synchronously before the final admission cancellation check
observes nested denial; no transactional callback effects are promised. Existing
source cleanup/native adapter trust and facade/policy recursion remain separate.
Production run membership/lifecycle issuance, setup adapters, SDK/RPC/Cue mail
delivery and full account lifecycle acceptance remain unfinished; plugin-owner
Backstage implementation/integration/installation stays paused.

Source delta **+17/-0**, one existing module. Prettier, strict main TypeScript,
scoped ESLint and tracked whitespace checks exited **0**. Scoped untracked-source
whitespace exited **1** solely because compared files differ, with no diagnostics.
Synthetic regression requirements are in current `RELAY-IMAP-HOST-02.md`;
tests created/executed **0/0**, images analyzed **0**, mock-tested/production-tested
**false/false**. Evidence and checked source hash:
`.maestro/verification/host-02-invocation-issuance-reentrancy/`.
Full lifecycle/production acceptance/HOST-05 remain unchecked.
See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

## Pending exact-agent run admission revocation (HOST-02, 2026-10-08)

`PluginToolRunIdentity` now binds its existing transient run-proof admission owner
to the validated exact agent before authority getters/callbacks. `revokeAgent()`
includes that pending owner even when no proof has been registered, and cancels
it before retained-proof removal/abort callbacks. Existing admission checks keep
that cancellation latched through final checks and failed-proof cleanup, so a
callback returning normally after revocation cannot admit the pending proof.
The existing synchronous issuance/agent revocation fences and canonical removal
remain; no extra registry, queue, runner, timer or permanent agent tombstone.
Different agents' pending admissions/proofs and independent registries are unchanged.
Fresh sequential issuance still requires actual live membership and run authority.

This is one private source prerequisite, statically checked only. Synthetic actual
registry regressions are recorded in current `RELAY-IMAP-HOST-02.md`, not authored
or executed. No production membership adapter, mail policy, caller authority or
public SDK/RPC route is supplied. Full lifecycle, trusted setup, public integration,
production acceptance and HOST-05 remain unfinished; Backstage stays paused.
Related evidence: [[relay-imap-host-evidence-20261006]].

## Resolved read-policy assertion reentrancy guard (HOST-02, 2026-10-09)

Implemented and statically checked only in existing
`src/main/plugins/mail-invocation-read-authority.ts`. Each authority returned by
`MailInvocationReadAuthority.resolve()` now owns a transient checking flag and a
permanent local failure latch. Same-authority synchronous reentry denies with fixed
`MAIL_DENIED` before another registry or policy callback. The outer assertion checks
its latch after initial registry checks, closed identity parsing, captured policy
and final registry checks; catching recursive denial cannot turn that assertion
into success. All assertion failures retain local denial for subsequent calls.
Successful sequential assertions reset only the transient checking flag.

The scope is the same returned authority object, not a global plugin/run/handle
revocation. Independent resolved authorities remain independently gated. The guard
does not abort the original invocation signal, mint/release/revoke a proof or
handle, or add listeners, timers, controllers, registries, stores, queues, runners,
exports or public routes. A fresh resolution must still pass actual registry and
live policy checks; it cannot restore this object's failed latch. Unlimited fresh
resolution, arbitrary host callback effects and other facade/adapter recursion are
not claimed to be solved. Existing fixed synchronous no-result policy checking,
original bound callback/receiver, immutable exact plugin/dual identity/verified
agent/independent right, invocation lifetime and canonical reader's separate sealed
account/revision/mailbox rights remain required.

One existing source module, **+38/-17** lines relative to admission baseline.
Prettier, strict main TypeScript, scoped ESLint and tracked whitespace exited **0**.
Scoped baseline-to-untracked-source whitespace comparison exited **1** because the
files differ, with no diagnostics. Deferred synthetic actual-registry/authority/
reader regressions are recorded in current `RELAY-IMAP-HOST-02.md`; tests created/
executed **0/0**, images analyzed **0**, mock-tested/production-tested **false/false**.
No implementation/native/keyring/storage/network/mail/server/login/credential
runtime was invoked. Full lifecycle, production policy/setup/caller/public/Cue
integration, production acceptance and HOST-05 remain unfinished. Backstage's plugin
implementation/integration/installation stays paused. Evidence retained under
`.maestro/verification/host-02-read-policy-reentrancy/`.
See [[CLAUDE-PLUGINS]], [[CLAUDE-CUE]] and [[relay-imap-host-evidence-20261006]].

## Grant-membership facade assertion guard (HOST-02, 2026-10-09)

Implemented and statically checked only in existing `mail-account-credentials.ts`.
Grant replacement now passes its canonical immutable agent/right snapshot into
`setupAuthority`. The existing facade owner captures the mandatory original
`assertAgentActive` callback and bound receiver; an empty replacement still validates
that callback but invokes no membership checks. The returned setup assertion keeps
that same owner across the original setup callback, each member callback and the
setup recheck after each member. Recursion into the same facade denies before
another authority/member capture or evaluation and aborts the outer owner. Checks
between callbacks detect caught recursive denial before subsequent membership work
or canonical queue admission. Fixed errors and synchronous undefined-result checks
remain canonical; no callback, cancellation source or grant intent is resnapshotted.

The original setup/member ordering and independent account read/detail/attachments
policy remain. Sequential assertions and independent facades retain their live
required authority. Queued leases and final completion reuse this guarded assertion;
canonical account admission/commit/completion latches, cleanup and durable policy
are unchanged. Source delta **+32/-14**, one existing module. No new helper/export,
controller mechanism, registry/store/queue/runner, membership inference, SDK/RPC/Cue
route, setup issuer or production adapter. This does not fence arbitrary native or
cross-instance effects, roll back earlier effects, or provide production integration.

Prettier, strict main TypeScript, scoped ESLint and tracked whitespace all exit **0**.
Scoped untracked-source whitespace exits **1** for file differences only with no
diagnostics. Receipts in `.maestro/verification/host-02-grant-membership-reentrancy/`.
Synthetic regression requirements are in the current HOST-02 document; tests
created/executed **0/0**, images analyzed **0**, mock-tested/production-tested
**false/false**. Full lifecycle/public integration/production acceptance/HOST-05
remain unchecked; Backstage stays paused. See [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

## Trusted host stored-account settings review (HOST-02, 2026-10-09)

`MailAccountCredentials.readStoredAccountSettings(accountId, expectedRevision,
setup)` is implemented as a synchronous host-private review seam. The actual
facade previously exposed stored summaries and rights review, but no guarded
settings read for future trusted host editing. Ordinary summaries still omit
endpoint and username. No production caller, frame adapter or public route exists.

Canonical account ID/revision syntax is validated before setup authority capture.
The existing setup guard captures the original receiver/signal and validates
synchronous assertions, including caught recursive denial. After initial authority,
the canonical sealed store binds exact plugin/dual identity/installation and the
requested live account/revision. Enabled and disabled accounts, including terminal
revisions, can be reviewed; review never advances or revives them. Removed, unknown,
foreign or stale targets fail closed. Parsing confers no setup authority.

The existing `parseMailAccountSettings` copies and freezes the closed endpoint,
username and exact mailboxes into a fresh settings record. It does not return the
account/configuration/grants, stored secret, keyring coordinates or status. Setup
assertion runs again; any intervening configuration replacement, including an
unrelated-account change, conservatively denies with `MAIL_STALE`. Final sealed
freshness must succeed and original cancellation is checked afterwards with no
later callback. Unexpected exceptions map to fixed `MAIL_UNAVAILABLE`; no native,
input or peer content is attached.

No credential-slot probe, keyring access, network/login, mutation, queue/latch
reset, agent rights, authority issuer, UI/IPC/SDK/RPC/Cue or readiness path was
added. A future dedicated trusted host setup caller must bind sender/frame,
policy and lifetime before supplying authority; ordinary plugin/tool IDs are not
authority. Delivered strings cannot be erased or recalled. Static source evidence
only: +34/-0 in one module, tests created/executed 0/0, images analyzed 0,
mock-tested/production-tested false/false. Synthetic regression requirements reside
in the current HOST-02 document; full lifecycle, production acceptance and HOST-05
remain unchecked. Backstage remains paused. See [[CLAUDE-PLUGINS]], [[CLAUDE-CUE]]
and [[relay-imap-host-evidence-20261006]].

## HOST-02 interrupted continuation (2026-10-09)

ENOSPC (/dev/sda2 zero available space) blocked baseline creation before source
changes. Private captured-confirmation-intent review was considered but remains
unimplemented/unavailable. No readiness/acceptance claimed. Current HOST-02 has
the halt; production gaps and plugin-owner pause remain. Tests 0/0, images 0;
tracked whitespace PID 639010 exit 0. [[relay-imap-host-evidence-20261006]]
