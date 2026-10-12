# Implemented IMAP host contract

The callable contract is Host API **1.26.0**, SDK **0.20.0**, based on the read-only canonical RC `4751ef9aa498d85d53fa984df7d97acbf456cd86`. The original foundation is preserved in `593db36af`. This document supersedes the proposed public signatures and production-readiness claims in [the historical foundation contract](relay-imap-host-contract-20261006.md). Those historical notes remain intact as implementation history.

## Authoring surface

`maestro.mail` is frozen in the sandbox. `PluginToolContext.mailInvocationId` exists only for a host-verified invocation. A caller-supplied agent name, ordinary command context, copied context object, stale handle or foreign plugin cannot establish mail authority.

| Method                                                                  | Permission                                 | Result                                                                                                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requestSetup(intent?)`                                                 | `mail:accounts`                            | Navigation requested; never consent or credentials                                                                                                        |
| `listAccounts()`                                                        | `mail:accounts`                            | Own opaque IDs, revisions, enabled intent, mailbox names, stored aggregate right counts; operational and credential status remain unknown without probing |
| `readHeaders({invocationId, reference})`                                | `mail:read` scoped to exact account        | Safe bounded subject/sender and exact reference                                                                                                           |
| `searchHeaders(request)`                                                | `mail:read` scoped to exact account        | Bounded UID reference page, namespace and continuation; no invented timestamps or counts                                                                  |
| `readBody({invocationId, reference})`                                   | `mail:body` scoped to exact account        | Complete bounded plain text with UTF-8 byte count                                                                                                         |
| `listAttachments({invocationId, reference})`                            | `mail:attachments` scoped to exact account | Approved complete decoded metadata                                                                                                                        |
| `openAttachment({invocationId, reference, partId})`                     | `mail:attachments` scoped to exact account | Same metadata plus invocation-owned snapshot ID                                                                                                           |
| `readAttachment({invocationId, accountId, snapshotId, offset, limit?})` | `mail:attachments` scoped to exact account | Base64 chunk, exact next byte offset, completion flag                                                                                                     |
| `closeAttachment({invocationId, accountId, snapshotId})`                | `mail:attachments` scoped to exact account | Release acknowledgement                                                                                                                                   |

A reference is exactly `{accountId, accountRevision, mailbox, uidValidity, uid}`. Account IDs are host-minted opaque values; revisions and actual EXAMINE namespaces must match. Every read additionally needs independently stored agent rights: `read`, `detail`, and `attachments` do not imply each other. Policy is rechecked at admission, async boundaries and final response publication. The verified handle binds the run, caller, plugin and sandbox lifetime and is released when the tool settles.

All results use `MailResult<T>`: `{ok:true,value}` or `{ok:false,error:{code,message}}`. The only codes are `MAIL_DENIED`, `MAIL_INVALID`, `MAIL_STALE`, `MAIL_UNAVAILABLE`, `MAIL_TIMEOUT`, `MAIL_CANCELED`, `MAIL_PROTOCOL`, `MAIL_LIMIT`; messages are fixed and content-free. The service and broker both enforce live account scopes. There is no raw socket, arbitrary IMAP verb, plugin-supplied endpoint, UID wildcards, write/mark-seen operation, partial-body success or ambient caller identity.

```ts
maestro.commands.register('read-approved-header', async (args, context) => {
	if (!context?.mailInvocationId) throw new Error('Verified invocation required');
	return maestro.mail.readHeaders({
		invocationId: context.mailInvocationId,
		reference: args.reference,
	});
});
```

The SDK command handler receives untrusted arguments. A plugin validates its own tool schema before using this illustrative argument shape. The host independently validates all mail parameters.

## Trusted setup and persistence

`mail.requestSetup` opens the dedicated host-owned page, restricted preload and main-frame IPC. The ordinary SPA and plugin guests cannot confirm. A captured secret-free action requires a single-use nonce bound to that exact frame, current plugin identity, setup lifetime and a main-observed real activation. Cancel closes the pending confirmation. Passwords are submitted only at confirmation, cleared from the page immediately and handled exclusively by the native keyring facade.

The page supports add disabled, replace endpoint/username, save password, enable intent, fixed TLS login test, replace plugin account scopes, replace independent agent rights, disable, remove and removed-slot cleanup retry. Plugin scope edits can only narrow/widen an already-consented capability for the exact account; they cannot mint a new capability. They advance the revision and clear old agent rights. Generic SPA allowlist editing cannot change mail scopes.

Canonical sealed authorization persistence is version 2, anchored by the existing native keyring. Fresh version-1 state migrates with empty mail policy. Missing, foreign, malformed, rolled-back, session-only or failed persistence cannot authorize mail. Mutations serialize per account, cancel active readers before state changes and never restore stale grants on enable or re-consent. Native deletion failure leaves a pending tombstone and blocks affected activity; cleanup retry is explicit. There is no automatic keyring scan. JavaScript secret strings cannot be reliably zeroized; owned byte buffers are erased when released.

## Bounded transport and snapshots

Host-selected TLS endpoints require certificate verification and guarded DNS/address resolution. The fixed path uses LOGIN, EXAMINE, bounded UID SEARCH and BODY.PEEK; metadata uses only UID/INTERNALDATE/RFC822.SIZE. The grammar intentionally supports a restricted IMAP4rev1/MIME subset and denies unsupported extensions, unsafe charsets, malformed encodings, duplicate descriptors and ambiguous source trees.

The source cap is 24 MiB; decoded text is 256 KiB; each attachment is at most 8 MiB and aggregate decoded attachments at most 16 MiB. Only text/plain, PDF, PNG, JPEG, GIF and WebP attachments are exposed. No HTML rendering is provided. Search pages contain at most 50 references. Attachment chunks are at most 64 KiB, require exact monotonic offsets and use one complete decoded snapshot; reads never silently combine content from different fetches. Complete snapshots release bytes while retaining the publication lease until close. Run termination, scope/revision changes, plugin stop/crash and explicit close release snapshot resources. At most 64 snapshots are retained per host instance.

## Host-owned Cue source

A user-configured `relay.mail.received` subscription carries a closed source block:

```yaml
mail:
  plugin_id: com.example.relay
  account_id: 0123456789abcdef0123456789abcdef
  account_revision: 4
  mailbox: INBOX
  interval_minutes: 1
```

The desktop host polls through the same sealed independent rights, verified invocation registry, TLS transport and readers. This is the implemented replacement for historical plugin-owned `watchStart`/arbitrary event-publish proposals; those methods are not exposed in this SDK. No source, disabled Cue/subscription, absent host authority, wrong account, failed scope or revoked read rights yields agent dispatch.

The payload has exactly seven fields: `reference`, `accountId`, `folder`, `uidValidity`, `uid`, `receivedAt`, `sizeBytes`. Received time and size come from authenticated IMAP metadata. The reference string is `relay-mail:1:<accountId>:<encodeURIComponent(mailbox)>:<uidValidity>:<uid>` and conveys no authority. Producer plugin/account revision, owner agent, sandbox generation and host HMAC proof live outside the payload in `mailSource`. Plugins cannot manufacture that proof. Provenance is excluded from template enrichment; only the seven `CUE_MAIL_*` variables are substituted. Output-prompt phases retain the original signed seven-field event and recheck current rights before starting; agent output stays in the prompt/result, outside the mail payload.

Polls are bounded to 30 seconds, UID windows of 1,024 and at most eight metadata events. UIDNEXT bounds the checkpoint to observed history rather than future UIDs. There is one durable checkpoint owner per consumer subscription. Filtered events are consumed; accepted events advance the checkpoint only after Cue confirms durable admission. Failed/no-op database writes and partial fan-out admission refuse the consumer receipt, preserving the cursor. A retry can duplicate targets that were already admitted. Pending mail rows remain durable through execution and are reauthorized on replay and queue drain. Accepted replay may survive a sandbox restart, but fresh publication from an old generation is denied. Known changed UIDVALIDITY rejects old events; when a restarted host has no observed namespace, authentic historical metadata can replay under live rights, while any later content fetch must independently verify the actual current namespace.

Delivery is **at least once** across crashes: a crash between admission and checkpoint persistence, or before terminal queue-row cleanup, can duplicate delivery. There is no exactly-once business-side-effect claim. Visual editor/YAML roundtrip preserves the exact source block. Standalone Cue has no injected desktop mail authority and denies mail delivery.

## Validation and integration gate

Synthetic tests use injected TLS, keyring and storage only. They cover actual readers and sealed state, real frozen VM SDK → RPC → permission broker → host service, caller spoofing and authority release, trusted setup frame/nonce/gesture, complete attachment chunks, signed metadata and real Cue dispatch, durable admission/readback, revoked queued events, stale sandbox generations, checkpoint retry and editor/template roundtrip.

Observed focused results: mail security/readers **860 passing tests**, full Cue/shared-Cue **2,100 passing tests, 2 skipped**, SDK runtime/drift/type parity **36 passing tests and zero type errors**, VM/RPC/durable admission **137 passing tests**. The dedicated frame/editor additions and repository gates are recorded in the continuation evidence after their runs settle. Main/preload and CLI builds passed. These counts overlap and must not be added into a unique-test total.

Production integration remains gated on the final committed contract, successful repository gates and review. This continuation has not installed the plugin, launched a provider, sent live mail traffic, used real mail credentials, restarted Maestro, changed consent/settings or reported to Discord. No live mailbox compatibility or packaged desktop UX is claimed by synthetic tests.
