---
type: integration-handoff
title: Relay IMAP host implemented interface status
created: 2026-10-07
status: integration-blocked
tags: [relay, imap, host, backstage]
related: ['[[relay-imap-host-contract-20261006]]', '[[relay-imap-host-evidence-20261006]]']
---

# Relay IMAP host integration status

This historical snapshot is superseded by [the implemented 2026-10-12 contract](relay-imap-host-contract-20261012.md) and [the continuation validation record](relay-imap-host-validation-20261012.md). The snapshot below is preserved as history.

**No callable mail SDK/RPC contract is implemented yet.** Backstage must keep
production integration gated. This is a snapshot of the existing authorized host
package, not a second implementation or a feature-completion report.

Worktree: `/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Branch: `feat/relay-imap-host-20261006`. Base and current HEAD:
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. Mail source changes are uncommitted;
there is **no mail implementation commit or PR**. Source snapshot hashes and
verification receipt are in the shared Auto Run folder's
`host-coordination-status-20261007.json`.

## Public contract and integration gates

| Requested boundary              | Actual implemented status                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SDK methods/types               | No `maestro.mail`, `mail.*` RPC rows or public mail DTOs in the SDK. The nine methods in the early contract are proposals only.                                                                                                                                                            |
| Permissions/version             | No `mail:*` capabilities registered. This base remains host API `1.16.0`, SDK package `0.11.0`; it does not satisfy Relay's declared `minHostApi: 1.22.0`. No additive mail version assigned.                                                                                              |
| Trusted `callerAgentId`         | No verified mail tool-context or nested invocation-handle wiring on this branch. A caller-supplied ID or `assertActive` callback is not proof.                                                                                                                                             |
| Credential setup/redaction      | Internal keyring-slot/account helpers exist; dedicated trusted setup IPC/UI, production injection and end-to-end logging/redaction checks do not. Never submit passwords through plugin commands, ordinary settings, Vault, Cue or an invented SDK method.                                 |
| Grants/revoke/cancel            | Internal sealed-ledger exact-account/agent rights and activity leases exist, with revision/identity checks and mutation cancellation. Production broker/principal/lifecycle enforcement and runtime security tests remain pending.                                                         |
| List/search/details/attachments | Internal fixed-command header/reference/source reads exist. No public page/search/body/attachment methods, bounded attachment DTO/chunk API or complete MIME/detail composition is available. Raw source bytes can contain attachments and must never be returned through the plugin seam. |
| Cue monitoring/replay           | No mail Cue event/trigger source or SDK watch methods are wired. Durable publication acknowledgement, consumer dedupe and restored-queue authority checks remain pending. No exactly-once claim.                                                                                           |

## Source interfaces currently present, host-private only

These names are imports for future host composition, **not** plugin APIs:

- `mail-imap-framing.ts`: `ImapResponseDecoder`, `ImapResponseFrame`,
  `ImapFramingError`, `IMAP_FRAMING_LIMITS`.
- `mail-imap-connection.ts`: `ConfiguredImapEndpoint`, `ImapConnectionDeps`,
  `ImapConnectionOptions`, `ImapConnection`, `ImapSessionStep`,
  `openConfiguredImapConnection`, `runConfiguredImapSession`.
- `mail-imap-commands.ts`: `FixedImapCommand`, `PreparedImapCommand`,
  `ImapCommandResult`, `prepareImapCommand`, `validateImapCommandResult`.
  Commands are LOGIN, EXAMINE, fixed UID SEARCH, UID BODY.PEEK fetch, NOOP/LOGOUT;
  there is no arbitrary command/write surface.
- `mail-account-read.ts`: `MailAccountHeaderReader.readHeaderBytes`,
  `.readHeaderDisplay`, `.searchReferences`, `.readMessageSourceBytes`.
  `MailHeaderReadAuthority` is `{ agentId, signal, assertActive() }` supplied only
  by future trusted host code. `MailHeaderSearchResult` contains `uidValidity`
  and references with `accountId`, `accountRevision`, `mailbox`, `uidValidity`, `uid`.
- `mail-account-credentials.ts`: `MailAccountCredentials.savePassword(accountId,
expectedRevision, password, setup)`, `.enableAccount(accountId, expectedRevision,
setup)`, `.cleanupRemovedAccount(accountId, expectedRevision, setup)`.
  `MailCredentialAuthority` requires `signal` and `assertActive()`. This callback
  does not create the missing trusted setup principal.
- `mail-credentials.ts`: `MailCredentialSlot`, exact installation/plugin/account
  keyring namespace `com.maestro.mail-credentials`, no password getter exported
  to plugins. Native keyring usability and setup/redaction are unverified.
- Account configuration/ledger/activity and header/transfer/charset projection
  modules provide internal bounded parsing and cancellation. They confer no
  public authority or event-publication permission.

Transport source limits include 10s authentication/connect, 30s lifetime,
24 MiB literal/25 MiB wire, 64 KiB header and 8 MiB part. Plain-text decoding is
capped at 256 KiB. TLS uses configured DNS hosts, certificate validation and
guarded lookup; no live connection/login was performed. Static checks alone do
not establish runtime enforcement.

## Agreed direction, still requiring implementation and tests

The detailed proposal is [[relay-imap-host-contract-20261006]]. Preserve mailbox
namespace in every reference/checkpoint/dedupe key:
`(pluginId, accountId, mailbox, uidValidity, uid)`. Never dedupe UIDs across folders.
Project only closed metadata into proposed `relay.mail.received`; never include
body, attachment bytes, password or raw errors. No direct mail-triggered
agent/Vault activity: only active user-enabled Cue subscriptions may dispatch
through the existing Cue path. Persisted delivery/replay must recheck current
source, consumer and account/agent authority. Restart semantics must be tested
before any durability/idempotency guarantee is published.

## Verification and execution evidence

Independent coordination check, cwd this host worktree:

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-read.ts src/main/plugins/mail-account-credentials.ts src/main/plugins/mail-header-projection.ts src/main/plugins/mail-text-decoding.ts src/main/plugins/mail-transfer-decoding.ts
git diff --check
```

Both exited **0**, no diagnostics. This is isolated static verification, not a
repository gate or runtime test. Mail product tests created/run: **0/0**.
Host/SDK/Cue security suites, full normal gates and synthetic integration acceptance
remain outstanding. No installation, real credentials, provider traffic or login.

The AgentRun registry proves the original Auto Run is progressing despite
`auto-run-status` returning `running:false,state:null`. Latest observed task run:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791330160857:1791330161533:czz41i`
(`running`); preceding source-task runs are `completed`. Initial launch receipt:
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/LAUNCH.json`.
Do not relaunch this package based on the null status response.

Report path/actual commit-or-uncommitted status/tests in the supplied host dispatch
tab. Backstage origin reporting tab is `83e2b4a4-64cd-463f-82b4-625e5b31eff9`;
there is no callback. Later packaging, if requested, must start from latest RC and
locally combine only Chris's own approved PR heads, record exact RC/head provenance
and verify those packaged features before recommending an installer. Never merge
upstream or install as part of this work.
