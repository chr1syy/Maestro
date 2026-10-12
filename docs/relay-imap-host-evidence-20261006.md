---
type: execution-evidence
title: Relay IMAP host execution evidence
created: 2026-10-06
tags: [relay, imap, host, audit]
related: ['[[relay-imap-host-contract-20261006]]', '[[CLAUDE-PLUGINS]]', '[[CLAUDE-CUE]]']
---

# RELAY-IMAP-HOST-01 — audit and early contract

Completed one self-contained discovery task. Created the **proposed** contract
[[relay-imap-host-contract-20261006]], before any transport implementation. No
source/test/runtime/production changes, mail login, credentials, installation,
upstream merge, callback, Discord action or live Cue config. Mail acceptance is
not satisfied: no host mail methods are implemented, mock-tested or
production-tested. The six new prerequisite checkboxes in HOST-03 are planning
only and remain unchecked; no later task was executed.

## Checkout and execution identity

| Item                               | Observed value                                                                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worktree / branch                  | `/home/chris/code/worktrees/feat/relay-imap-host-20261006` / `feat/relay-imap-host-20261006`                                                         |
| Base and unchanged HEAD            | `1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45` (`rc` base)                                                                                               |
| Owner / registered execution agent | `0af39dab-3c06-40de-9077-99207660c1e9` / `228eef8c-75a8-46e8-bb67-2903da23bc06`                                                                      |
| CLI-confirmed execution tab        | `5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider `agentSessionId: null`                                                                              |
| Auto Run status                    | Owner and worktree queries both returned `running:false,state:null`; no launch/run ID is claimed or inferred. No engine launched by this task.       |
| Initial Git status                 | Clean; `AGENTS.md -> CLAUDE.md`; no worktree `node_modules`.                                                                                         |
| Commit / PR                        | None. Documentation remains uncommitted for the later review/commit task; no PR because mail implementation and acceptance gates remain outstanding. |

CLI receipts reside in the shared authorized playbook folder
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/`:
`host-01-execution-tab.json`, `host-01-owner-run-status.json`, and
`host-01-worktree-run-status.json`. CLI status is an observation, not proof of
an engine execution ID; this response reports the actual execution tab above.

## Audit findings and concrete decisions

Reviewed AGENTS/CLAUDE guidance, CLAUDE-PLUGINS, CLAUDE-CUE, CONTRIBUTING,
PLUGIN-DEVELOPMENT/CUE-PIPELINE/SHARED-UTILS guide sections, hooks/CI and actual
broker/SDK/runtime/egress/ledger/keyring/event/Cue queue/trigger code. Source wins
where older guide file paths/event counts disagree. No new utilities or tests.

- Existing net.connect is wss-only; preserve it. Proposed dedicated fixed-command
  IMAPS transport reuses EgressGuard admission and validating lookup on TLS.
- Plaintext KV and missing-as-empty parsing cannot store mail passwords or
  authoritative grants. Reuse host ledger sealing/freshness and native keyring
  entry patterns, with locked/missing backend failing closed. Package presence
  does not prove operational keyring support; no entry was read or constructed.
- Base host 1.16.0 / SDK 0.11.0 has no mail methods, verified tool caller context
  or plugin-to-Cue event ingress. Read-only comparisons identified existing
  caller-proof modules on registered fix/relay-host-only and conversation branches;
  no merge/copy/edit. Nested SDK mail calls additionally require host-bound
  invocation handles, not callerAgentId echoed by the plugin.
- Proposal specifies exact method/type/capability names, independent account/agent
  rights, trusted setup principal, safe DTOs, chunked attachments within RPC bounds,
  fixed errors, async reauthorization/cancellation, metadata projection, ordered
  polling, UIDVALIDITY reset and bounded checkpoints. Subject/sender excluded from
  initial Cue payload. No dispatch without user Cue consumers.
- Cue persistence is currently best-effort; no exactly-once claim. Mail-specific
  durable acceptance/dedupe and queue-drain/restored-replay authorization are
  necessary through existing Cue paths. Plugin event bus drops nested objects;
  optional plugin mail delivery must project its primitive UID tuple separately.
- Added six small unchecked HOST-03 prerequisite tasks for absent caller proof,
  context propagation, MCP bridge, run wiring, nested mail handles and trusted
  setup surface, retaining the three-file/<500-line source task budget. Remaining
  necessary IPC/lifecycle/renderer splits are explicitly required in those tasks.

## Backstage handoff and bounded consult

Sent concrete contract path, registered host worktree/branch/full base and explicit
PROPOSED/no-implementation status to Maestro-Backstage
`78582d73-395d-4839-a62d-e903f0f1cecc` using `maestro-cli ask --from
0af39dab-3c06-40de-9077-99207660c1e9 --json`. No plugin handoff/dispatch requested.

| Receipt / invocation                                | Exact outcome                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `host-01-backstage-consult.json`, timeout 120s      | CLI exit 1; `success:false,canceled:false`, "Maestro-Backstage produced no visible output (exit code 1)." Reply tab `024b970a-aa5b-48aa-aebf-fcaa03bff5c1`.               |
| `host-01-backstage-consult-retry.json`, timeout 90s | CLI exit 0; `success:true,canceled:false`, same agent and reply tab `024b970a-aa5b-48aa-aebf-fcaa03bff5c1`. Answer obtained; no readiness inferred from the first launch. |

Backstage reports independent accounts/policy/metadata/checkpoints implemented as
local seams, ready to inform an adapter; production integration blocked by the
proposed host contract and absent verified wiring. Method set fits if ownership /
identity, DTO pagination/search/chunk completeness/deadlines, watch baseline /
ordered scans/reset/dedupe/crash/revoke, and durable Cue acceptance are explicit.
It needs no generic socket or publish API. Its publication seam must adapt to
host-owned events. It flagged 1 MiB local snapshots vs host 64 KiB KV values.
The contract now specifies pagination/search semantics and host ownership of
scans/state, requires a bounded compatible Relay cache or proven transactional
adapter, and leaves generic KV limits unchanged. Final types and synthetic
end-to-end evidence are still required before integration acceptance.

## Dependency and verification outcomes

Node `v25.6.1`. Read-only package resolution from `/home/chris/code/Maestro` found
TypeScript 6.0.3, Vitest 4.1.11, esbuild 0.28.1, Prettier 3.8.3, keyring 1.3.0 and
undici 7.29.1. imapflow/imap/mailparser/emailjs-imap-client unavailable there.
No installation or dependency symlink created; formatting invokes the existing
Prettier executable directly with cwd in this registered worktree.

| Actual command / scope                                                                                                                                             | Outcome                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write docs/relay-imap-host-contract-20261006.md docs/relay-imap-host-evidence-20261006.md` | Exit 0; documentation formatting only.                                                                                                                                                                |
| Same executable `--check` on both docs                                                                                                                             | Exit 0; both match formatting.                                                                                                                                                                        |
| `git diff --check`                                                                                                                                                 | Exit 0; no tracked whitespace errors.                                                                                                                                                                 |
| `git diff --no-index --check /dev/null <each new doc>`                                                                                                             | Each exit 1, no diagnostic output: expected added-file differences; no whitespace diagnostic. Plain git diff excludes untracked docs.                                                                 |
| Structural document validation (frontmatter and proposed API surface)                                                                                              | Exit 0; both YAML metadata blocks parse, required wiki-links present, 9 proposed methods identified, referenced canonical/comparison source files exist. Documentation assertions, not product tests. |
| Source tests / SDK build / typecheck / Cue tests / repo full gates                                                                                                 | Not run in this audit checkbox; 0 tests created/run. Assigned to separate creation/execution tasks. No test pass or production readiness claimed.                                                     |

Normal later gates discovered: pre-commit `npx lint-staged`; pre-push toolchain
preflight and `npm run validate:push` (Bun formatting/type/lint/test scripts), branch
guard; CI formatting, lint:eslint, lint, lint:doc-refs and Linux/Windows tests.
CLAUDE-CUE requires full main/shared Cue suites before pushing Cue edits. SDK drift,
type parity, SDK build, security AST wiring and focused synthetic mail acceptance
are required in HOST-05. No hooks were bypassed; no git commit/push performed.

# RELAY-IMAP-HOST-02 — bounded framing foundation only

Completed one new self-contained source checkbox from the documented transport
split. The original full transport checkbox remains unchecked. Added a separate
unchecked TLS prerequisite; its completion and the fixed-operation/session layer
must each use a fresh context. No additional implementation or test task ran.

## Actual change and limits

- Added `src/main/plugins/mail-imap-framing.ts` (246 lines)
  with synchronous `ImapResponseDecoder`, typed response frames, fixed safe
  errors and tighten-only hard bounds. Exact CRLF and literal bytes, quoted
  escape/list/depth checks, count/byte/allocation limits and terminal cleanup
  are implemented. No transport API, socket, command, secret retrieval, timer,
  SDK/RPC method, Cue source or production wiring is available.
- Updated the contract's frontmatter/opening and implemented-framing subsection,
  explicitly separating framing from FETCH semantics, matching tag success,
  TLS/egress/deadlines, account rights, MIME and result publication. The restricted
  supported/rejected grammar, memory ownership and 25 MiB wire budget are explicit.
- Source/task checks are static only. No mock-tested or production-tested claim;
  broad mail acceptance remains unsatisfied. Existing dependencies were read
  through absolute executable/type paths; no installation/symlink/cache, upstream
  merge, plugin checkout change, live login, callback or Discord action.

## Commands and exact outcomes

All commands ran with cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Final static receipts:
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/host-02-framing-static-checks.log`.

1. Initial isolated `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc
--noEmit --strict --skipLibCheck --target ES2022 --module commonjs --types node
--typeRoots /home/chris/code/Maestro/node_modules/@types
src/main/plugins/mail-imap-framing.ts`: exit 1, TS5112 required explicit
   `--ignoreConfig` for TypeScript 6 with file arguments. This was a check invocation
   correction, not a repository configuration change.
2. Same command plus `--ignoreConfig`: exit 2, six TS2540 readonly mapped-type
   assignment diagnostics in the new module. Fixed by making the local limits
   mapped type mutable; also changed override-key checking to `Object.hasOwn`.
3. Final `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc
--ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters
--skipLibCheck --target ES2022 --module commonjs --types node --typeRoots
/home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-imap-framing.ts`:
   exit 0, no diagnostics. This isolated module check is not full repo/SDK type parity.
4. Existing Prettier executable `--write` on the source/contract: exit 0.
   Final `--check` on all three source/docs: exit 0. `git diff --check`:
   exit 0. `git diff --no-index --check /dev/null <path>` for each new source/doc:
   each exit 1 with no diagnostic output (added-file differences, no whitespace
   errors). Exact commands/exits are in the static receipt.
5. Product test commands: **none**. Tests created/run: **0/0**. No suite, full repo
   lint/type/build, SDK security/parity or Cue gate ran; creation/execution remain
   assigned to later checkboxes. No normal gate bypass or git stage/commit/push.

Static review corrected aggregate allocation accounting to use the marker's wire
position rather than charging the rest of its incoming chunk twice. Review also
ensured literal buffers in completed frames from an ultimately failed chunk are
cleared, while already returned frames stay consumer-owned. These are inspection
findings, not runtime test assertions.

## Observed execution and git/PR state

CLI `tab show 5262895a-6b3d-43fa-92cc-17449cdfa06f --json` and `auto-run-status
--agent <id> --json` for both owner/execution agent: each exit 0, success true.
Receipts: shared `host-02-framing-execution-tab.json`,
`host-02-framing-owner-run-status.json`, `host-02-framing-worktree-run-status.json`.

- Execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; owner
  `0af39dab-3c06-40de-9077-99207660c1e9`; exact execution tab
  `5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
- Both Auto Run status receipts: running false/state null. No launch/run ID
  observed or inferred; no engine was launched by this task.
- Worktree/branch unchanged; base/HEAD
  `1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. Git initially had the two
  untracked HOST-01 docs; this task preserves them and adds one untracked source.
- Commit/PR: none. Full transport/security/SDK/Cue implementation and normal
  acceptance gates are outstanding; review/commit/push/conditional PR belong to
  HOST-05. No misleading feature PR. No new Backstage consult/dispatch in this
  framing task; the HOST-01 bounded consult remains the only coordination evidence.

# RELAY-IMAP-HOST-02 — configured-account TLS foundation only

Completed exactly the next unchecked TLS connection source task on 2026-10-07.
Fixed-operation/session, account/security, SDK/Cue and test tasks remain unchecked.

## Code and remaining seams

- Added `src/main/plugins/mail-imap-connection.ts` (293 lines), composing the
  existing egress guard and framing decoder. Host configuration selects a copied
  DNS endpoint by account ID; TLS is mandatory, port 993 is default and other
  ports require explicit trusted setup opt-in. Literal IPs/numeric aliases reject.
- Actual TLS lookup is validated/pinned, with configured-name certificate checks,
  SNI, `rejectUnauthorized: true` and TLS 1.2 minimum. Tighten-only 10-second DNS/TLS
  and 30-second connection lifetime budgets, AbortSignal cancellation, late DNS
  suppression, paused bounded reads and terminal decoder/socket cleanup are source
  implemented. The internal connection exposes receive/close only, no raw write.
- The host account lookup and fake TLS/resolver injection seams are dependencies,
  not a production account store or mock-tested security claim. Native DNS cannot
  be interrupted; timed-out/canceled completion cannot dial. No RPC/SDK imports,
  secret/login, grant lifecycle, command semantics, MIME, metadata, event or Cue
  path is implemented. The next session task must preserve the total DNS/TLS/login
  budget and tagged success, and the account task must wire live authorization.
- Contract frontmatter/opening and TLS subsection now separate these implemented
  foundations from remaining proposals. Node TLS option/reference research used
  https://nodejs.org/api/tls.html#tlsconnectoptions-callback; existing utility/guide
  searches found no reusable TLS deadline helper (HTTP fetch timeout is unsuitable).

## Exact static outcomes

All source/tool/git cwd remained the registered worktree. Final receipt:
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/host-02-tls-static-checks.log`.

- First source formatting: existing absolute Prettier executable `--write` on
  the new source, exit 0. First isolated strict/noUnused TypeScript check, exit 2:
  TS2769, installed `@types/node` TLS ConnectionOptions omits autoSelectFamily.
  Corrected the local options type to include documented socket options (also
  allowHalfOpen/highWaterMark); no dependency/configuration change or cast-away check.
- Corrected isolated TypeScript check: exit 0. Final command is
  `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig
--noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck
--target ES2022 --module commonjs --types node --typeRoots
/home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-imap-connection.ts`.
  Imports include both the existing egress guard and framing source. This is
  isolated static verification, not a full repo/SDK type/build gate.
- Final Prettier `--write`/`--check` on new source and both host docs: exit 0.
  `git diff --check`: exit 0. Four `git diff --no-index --check /dev/null <path>`
  checks (both sources/docs): each exit 1, empty output (added files, no whitespace
  diagnostics). Exact invocations and outputs reside in the receipt.
- Static inspection corrected synchronous transport-error classification, cleanup
  if cancellation occurs inside the injected connect call, and late DNS/blocked
  port handling. No executable transport assertions or runtime acceptance claimed.
- Tests created/run: **0/0**. No suite, full repo lint/type/build, SDK parity/security,
  Cue or production gate ran; test creation/execution stay in their later checkboxes.

## Execution and PR outcome

Fresh CLI receipts `host-02-tls-execution-tab.json`, `host-02-tls-owner-run-status.json`
and `host-02-tls-worktree-run-status.json`: each exit 0/success true. Execution agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, owner `0af39dab-3c06-40de-9077-99207660c1e9`,
execution tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`, provider agentSessionId null.
Both Auto Run observations are running false/state null; no launch/run ID inferred
and no engine launched. Branch `feat/relay-imap-host-20261006`, unchanged base/HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`.

Three source/document files changed this task; prior untracked framing/docs are
preserved. Only checklist/evidence/receipts changed in the authorized shared
playbook folder. No install/symlink/shared dependency mutation, upstream merge,
real socket/mail login/credential retrieval, plugin checkout edit, callback,
Discord or new consult/dispatch. No git stage/commit/push or PR: full acceptance
and normal gates outstanding; conditional review/commit/PR remains HOST-05 work.

# RELAY-IMAP-HOST-02 - synchronous fixed-command validation only

Completed one additional self-contained source prerequisite on 2026-10-07.
Before implementation, inserted its unchecked task immediately before the original
fixed-operation/session task in HOST-02, as authorized by the transport split
rule. Command validation and async session composition require separate review;
the original transport/session checkbox remains unchecked. No account, session,
test-creation or test-execution checkbox was advanced in this context.

## Actual source changes and review

- Added `src/main/plugins/mail-imap-commands.ts`, 303 lines. Closed fixed command
  shapes build quoted ASCII LOGIN, EXAMINE, bounded numeric-range/header-text UID
  SEARCH, single-UID BODY.PEEK of fixed headers/complete source/numeric parts,
  NOOP and LOGOUT. Unknown command/extra fields reject; no raw verb/section/write.
- Reused `ImapConnectionError` and framing records/ceilings. Added exactly two
  lines to `mail-imap-connection.ts` for proposed MAIL_STALE code/message;
  no connection lifecycle or TLS behavior changed. Total source addition: 305
  lines in two modules, below the three-file/500-line task target.
- Complete-record validator requires exact final tagged OK, EXAMINE's mandatory
  FLAGS/EXISTS/RECENT plus one valid UIDVALIDITY and READ-ONLY, bounded unique
  in-range SEARCH identifiers sorted ascending, exact FETCH UID/section/literal,
  and BYE/tagged OK for LOGOUT. Unknown status codes/extensions/attributes reject.
  No results include server status text. Failure clears all consumer-owned input
  literal buffers; successful FETCH transfers one bounded buffer to its caller.
- Static review tightened response-code allowlisting so UIDNOTSTICKY/READ-WRITE,
  capability extensions and UIDVALIDITY changes outside EXAMINE cannot be treated
  as ordinary successful status text. It also made literal cleanup tolerate
  malformed data-record part arrays without masking the fixed error. These are
  inspection findings, not executed runtime assertions.
- Contract now documents implemented synchronous semantics separately from the
  proposed public SDK. ASCII-only restrictions, credential-bearing host wire
  buffers, exact supported FETCH shape, raw vs decoded bounds, unsupported
  metadata attributes and remaining seams are explicit. Protocol reference:
  https://www.rfc-editor.org/rfc/rfc3501 (sections 6/7).

## Exact commands and outcomes

All source/tool/git commands ran in the registered worktree. Receipt:
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/host-02-commands-static-checks.log`.

- Existing absolute Prettier executable `--write` on both source files and the
  contract: exit 0. Final source/contract/evidence `--check`: exit 0.
- Isolated TypeScript command: `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc
--ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters
--skipLibCheck --target ES2022 --module commonjs --types node --typeRoots
/home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-imap-commands.ts`:
  exit 0 initially and after final source review; no diagnostics. Imports include
  connection, framing and the existing egress guard. Not full repository/SDK parity.
- `git diff --check`: exit 0. Five `git diff --no-index --check /dev/null <path>`
  checks (three current source modules/two host docs): each exit 1 with no output,
  the expected added-file difference status and no whitespace diagnostics.
- Tests created/run: **0/0**; no product/runtime assertions, suite, full repo
  lint/build, SDK/security/parity, Cue or production gate ran. Test creation and
  execution remain assigned to separate later tasks. No normal gate was bypassed.

## Remaining seams and execution/PR outcome

No synchronous command is yet sent: production imports, greeting/session state,
record collection/coalescing, decoder tightening before allocation, combined
DNS/TLS/login deadline, concurrency, namespace matching, secret retrieval,
revocation/live authorization, safe header projection, metadata/MIME parsing,
decoded attachment/body bounds, snapshots, monitors/events and Cue remain unwired.
LOGIN buffers must be erased by the future writer; temporary JS strings cannot
promise zeroization. No fake or real mail transport was exercised.

Fresh CLI receipts `host-02-commands-execution-tab.json`,
`host-02-commands-owner-run-status.json`, `host-02-commands-worktree-run-status.json`:
all exits 0/success true. Owner `0af39dab-3c06-40de-9077-99207660c1e9`;
execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; exact execution tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both Auto Run observations running false/state null; no engine launched and no
launch/run ID inferred. Branch `feat/relay-imap-host-20261006`; base/HEAD unchanged
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`.

Four worktree files changed this task (new command module, two-line connection
addition, contract and this ledger); earlier untracked work preserved. Shared
writes confined to this playbook checklist/evidence/receipts. No installation,
shared dependency mutation, upstream merge, actual credential retrieval, socket,
mail login, plugin checkout edit, callback, Discord or new consult/dispatch.
No git stage/commit/push or PR: full feature acceptance and normal gates remain
outstanding, with conditional review/commit/PR reserved for HOST-05.

# RELAY-IMAP-HOST-02 — bounded async fixed-operation session

Completed exactly the next unchecked fixed-operation/session source task on
2026-10-07. Account/security, tests, verified caller, SDK, MIME and Cue tasks remain
unchecked. Full mail acceptance is not satisfied.

## Actual source change

- Extended `src/main/plugins/mail-imap-connection.ts` with a host-only fixed
  exchange and `runConfiguredImapSession`. Required live authorization dependency,
  strict greeting/LOGIN state, EXAMINE namespace tracking, exact UIDVALIDITY for
  SEARCH/FETCH, matching tags, coalesced/partial trailing-record refusal and LOGOUT
  validation reuse the existing command/framing code. No raw socket/write API.
- Shared admission: one session per exact account, four per host-bound plugin,
  one pending command, at most 64 commands. No queue. DNS/TLS/greeting/LOGIN share
  the admission 10-second timer; lifetime remains 30 seconds, with monotonic elapsed
  checks. Close/error/cancel/timeouts reject pending reads/writes, suppress late
  DNS/write success, erase owned buffers and release slots. The batch runner closes
  in finally and erases earlier FETCH results on any plan failure.
- Extended `mail-imap-framing.ts` with response-boundary literal-limit adjustment,
  retaining constructor ceiling and cumulative 25 MiB/256-response budgets.
  Nonempty status literals are refused; headers/part/source allocation limits are
  64 KiB/8 MiB/24 MiB. Exported the existing erasure helper from
  `mail-imap-commands.ts` for reuse rather than adding another copy.
- Static inspection addressed EOF racing buffered LOGOUT completion, ownership
  before promise resumption/cancel, pre-allocation literal limits and immutable
  prepared command kind after awaits. These are inspection findings, not tests.
- Production account config/ownership/grant generation and abort wiring must supply
  the required dependencies. No verified caller, credential retrieval/storage,
  grant ledger, MIME decode/projection, attachment manifest, monitor/checkpoint,
  SDK/RPC or mail event/Cue path exists. Incremental host callers must close in
  finally and erase already-transferred results on subsequent failure. Native
  JavaScript credential strings cannot promise zeroization. No mail compatibility
  or readiness claim follows from source compilation.

## Exact verification and git outcomes

- Initial existing Prettier `--write` exit 0; first isolated strict/noUnused tsc
  exit 2, TS6133 for an unused IMAP_FRAMING_LIMITS import. Removed the unused import.
  Subsequent strict checks exit 0, including after static review fixes.
- Final commands, individual exit codes, source diff counts and whitespace
  diagnostics are recorded in shared `host-02-session-static-checks.log`. Final
  strict/noUnused tsc, Prettier write/check and tracked whitespace checks exit 0.
  Five untracked-file no-index whitespace checks each exit 1 with empty diagnostics
  (expected added-file differences). Source diff against entry snapshots: 246
  additions and 26 removals, 272 changed lines across exactly three modules.
  Existing dependency executables/types were read by absolute paths only; no
  install, dependency symlink or shared dependency mutation.
- Tests created/run: **0/0**, as required by this source checkbox. No product/mock
  assertion, full repo test/lint/build, SDK security/parity or Cue suite ran;
  creation/execution and normal repository gates remain separate later checkboxes.
  Production tests are out of scope. Formatting/static checks are not mail tests.
- Updated contract and this durable ledger; concise status mirrored in shared
  EVIDENCE.md. Three source modules changed this task; entry snapshots for comparison
  live only in the ignored worktree `.maestro/verification/host-02-session/`.
  Earlier untracked docs/framing/TLS/commands were preserved. No other checkout edit.
- Branch `feat/relay-imap-host-20261006`; base and unchanged HEAD
  `1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No stage/commit/push/PR.
  No-PR reason: full implementation/acceptance and normal gates remain outstanding;
  review/commit/conditional PR are assigned to HOST-05.
- Protocol/write lifecycle references reviewed: RFC 3501 sections 3, 6.1.3 and
  6.3.2 (https://www.rfc-editor.org/rfc/rfc3501) and Node stream write completion
  documentation (https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback).
  No server contact, mail login, actual secret, installation, upstream merge,
  callback, Discord, deployment or plugin checkout change. No new consult/dispatch;
  HOST-01 Backstage consult remains the only coordination evidence.

## Observed execution identity

Fresh CLI receipts `host-02-session-execution-tab.json`,
`host-02-session-owner-run-status.json` and
`host-02-session-worktree-run-status.json`: each CLI invocation exit 0/success true.
Execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; owner
`0af39dab-3c06-40de-9077-99207660c1e9`; exact execution tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`, provider agentSessionId null.
Both Auto Run receipts show running false/state null. No launch/run ID observed
or inferred; no engine launched by this task. All source/test/git commands used
cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Main-checkout writes
are confined to the authorized shared playbook evidence/checklist/receipts.

# RELAY-IMAP-HOST-02 - host-private credential-slot prerequisite

Completed exactly one newly split self-contained source checkbox on 2026-10-07.
The broader account isolation/secret/grant lifecycle task remains unchecked.
The split was inserted before source edits because private persistence, sealed
account grants, verified invocation, trusted setup and MIME reads exceed a single
three-file/500-line source task. Tests remain separate creation/execution tasks.

## Actual changes and inspection

- Added `src/main/plugins/mail-credentials.ts` (171 lines): immutable native slot
  under `com.maestro.mail-credentials`, SHA-256 of the exact JSON tuple
  installation/plugin/account, canonical plugin/allowlist validation, bounded IDs
  and passwords, guarded save/removal with absence confirmation, and fixed-session
  LOGIN consumption returning void. No password getter, plaintext fallback, file
  storage, credential cache, SDK/RPC registration, logs or events.
- Extended `src/main/plugins/authorization-ledger.ts` with canonical
  `createKeyringEntry`, reusing the native loader for mail and authorization
  anchors. The existing anchor remains lazy/cached with the same unavailable
  fallback by inspection; no backend or anchor behavior was runtime-tested.
- Required host authority and AbortSignal before/after native work and after the
  LOGIN await; pending LOGIN cancellation closes the session, failure closes it,
  and revocation/cancellation suppresses late completion. Password references are
  cleared and native/transport errors reconstructed with fixed mail messages.
  JavaScript/native string memory cannot promise zeroization. Existing session
  writer owns LOGIN-byte erasure; the slot itself emits no protocol bytes.
- These callbacks are authority seams, not implemented grants. Future host code
  must bind slot, supplied session endpoint, username, plugin identity, account
  revision and verified agent to the same account/generation. Private account
  configuration, installation-ID persistence, sealed grants/migration, trusted
  setup minter, account mutation queue/invalidation/tombstones, monitor cleanup,
  verified caller handles, safe account projections, headers/body/attachment MIME
  operations, SDK/wiring and Cue remain unavailable. Native keyring operations
  are synchronous and have no independent deadline; existing session deadlines
  cover LOGIN. Failed setup mutations must keep the account stopped in the future
  lifecycle service. No production availability or full mail acceptance claim.

## Exact static/test/git outcomes

- Existing absolute Prettier write and isolated strict/noUnused TypeScript check
  initially both exit 0. Final strict TypeScript, Prettier write/check and tracked
  whitespace checks exit 0. No TypeScript or whitespace diagnostics. Six untracked
  no-index whitespace checks each exit 1 with empty output, expected added-file
  differences. Commands and individual exits: shared
  `host-02-credentials-static-checks.log`; final doc checks appended there.
- Source change: 187 additions and 5 removals (192 changed lines), exactly two
  source modules. Four worktree source/document files changed this task, preserving
  earlier untracked transport/docs. Canonical ledger entry snapshot is worktree-only
  `.maestro/verification/host-02-credentials/authorization-ledger.entry.ts`.
- Tests created/run **0/0** as required. No fake keyring/transport assertion, native
  keyring invocation, secret retrieval, socket or LOGIN ran. No full repository
  lint/build/test, SDK parity/security or Cue gate ran; all remain later tasks.
  Static compilation does not prove mail/keyring compatibility or security.
- Branch `feat/relay-imap-host-20261006`; unchanged base/HEAD
  `1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No stage/commit/push/PR.
  No-PR reason: full implementation/acceptance and normal gates remain pending;
  conditional review/commit/PR belongs to HOST-05.
- Updated host contract, this ledger and shared playbook checklist/evidence/receipts.
  Main-checkout writes confined to the authorized shared playbook directory.
  Every source/static/git command ran in the registered worktree. No install,
  symlink/shared dependency mutation, upstream merge, deployment, live mail/login,
  actual credentials, callback, Discord or plugin checkout edit. No new consult or
  dispatch; Backstage coordination is unchanged from HOST-01.

## Observed execution identity

Fresh `host-02-credentials-execution-tab.json`,
`host-02-credentials-owner-run-status.json` and
`host-02-credentials-worktree-run-status.json` receipts: all CLI exits 0,
success true. Execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; owner
`0af39dab-3c06-40de-9077-99207660c1e9`; execution tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both Auto Run observations running false/state null. No engine launched or
launch/run ID observed/inferred. Reported directly in this execution tab.

# RELAY-IMAP-HOST-02 - private account configuration schema prerequisite

Completed exactly one newly split self-contained source checkbox on 2026-10-07.
The split was inserted before source edits; full account/grant lifecycle and the
later test creation/execution tasks remain unchecked. Full acceptance is unmet.

## Actual source changes and static review

- Added `src/main/plugins/mail-account-config.ts` (222 lines). Private version-1
  JSON schema has exact installation/plugin identity fields, at most 32 accounts,
  32 exact ASCII mailboxes per account and 1024 removal tombstones. Checks UTF-8
  512 KiB ceiling before canonical BOM-aware JSON parse; validates canonical
  32-lowercase-hex opaque IDs, positive safe revisions, endpoint/username/mailbox
  bounds, unique IDs across accounts/tombstones and closed data-only shapes.
  Returns deeply frozen copies. Never discards corrupt state into an empty store.
- `createDisabledMailAccount` accepts only endpoint/username/mailboxes, generates
  a random 128-bit ID, revision 1 and disabled intent. No credential/right field.
  Future mutation admission must check collisions and removal history; neither
  parsed enabled intent nor syntactic identity creates authorization.
- Extracted existing `validateConfiguredImapEndpoint` in connection and
  `assertImapQuotedString` in commands; both original transport paths reuse them.
  DNS-name/IP-alias/port/TLS checks retain their prior error mapping. ASCII helper
  additionally refuses invalid maximum bounds. No duplicated endpoint/string
  rules, transport deadline/socket lifecycle or native credential changes.
- Static review moved array caps before descriptor-copy allocation, limited
  record key counts before copying, preserved fixed content-free errors and
  prevented input references/getters from being retained as configuration.
  Settings objects reject inherited/accessor/symbol/hidden/sparse fields; JSON
  duplicate keys follow the canonical parser's last-key semantics. These findings
  are inspection only, not executed security assertions.
- Source diff against worktree entry snapshots: **263 additions, 18 removals,
  281 changed lines across exactly three modules**. Breakdown: config +222/-0,
  connection +29/-17, commands +12/-1. Prior authorization/credential/framing
  edits were preserved. Exactly five worktree source/document files changed this
  task, plus ignored entry snapshots; main-checkout writes are only shared
  playbook checklist/evidence/receipts.

## Exact verification and test outcomes

- Initial absolute Prettier source write exit 0. First isolated strict/noUnused
  TypeScript check exit 2: TS2551 at config line 79, mapped array-descriptor type
  exposed length as number. Replaced that access with the actual own length
  descriptor; subsequent identical strict check exit 0, no diagnostics.
- Final isolated command:
  `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-config.ts`:
  exit 0. This also checks the imported existing command/connection/framing and
  canonical shared modules; not full repository/SDK parity.
- Final existing absolute Prettier source/docs write/check and `git diff --check`
  exit 0. Seven untracked-file `git diff --no-index --check /dev/null <path>`
  checks each exit 1 with empty output, expected added-file differences and no
  whitespace diagnostics. Exact commands, diagnostics, source diff counts and
  individual exits: shared `host-02-account-config-static-checks.log`.
- Tests created/run **0/0**, as required by this source task. No fake/runtime
  assertion or product test, native keyring/seal/config backend call, actual
  credential, socket or LOGIN ran. No full repository lint/test/build, SDK
  security/parity or Cue suite ran. Separate creation/execution and HOST-05 normal
  gates remain outstanding; no normal gate was bypassed.

## Remaining seams and git/PR outcome

The schema is unwired host-private source. No config persistence/path/reader,
installation-ID persistence, anchored freshness or rollback proof, canonical
account/agent grant-ledger migration, setup authority, verified invocation,
account generation/mutation queue/invalidation, safe account projection, MIME
reads, monitor/checkpoint/event, SDK or Cue path is implemented. The eventual
reader must bound ciphertext and decoded content before allocation and bind
installation/plugin identity to a trusted sealed freshness anchor. Private DNS
addresses are blocked at actual connection time, not proven safe by this parser.
Tombstone overflow must fail rather than prune history. Non-ASCII mailbox names
remain unsupported. Syntax/immutability/static compilation are not secure mail
acceptance, fake-tested behavior or production-tested readiness.

Branch `feat/relay-imap-host-20261006`; worktree
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`; base and unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45` (`rc`). No stage/commit/push/PR.
No-PR reason: full implementation/acceptance and normal gates remain outstanding;
conditional review/commit/PR belongs to HOST-05. No install, shared dependency
mutation/symlink, upstream merge, deployment, live mail login, callbacks, Discord,
other checkout/plugin changes or new consult/dispatch. HOST-01 Backstage
coordination remains the only handoff. Contract and durable/shared ledgers updated.

## Observed execution identity

Fresh `host-02-account-config-execution-tab.json`,
`host-02-account-config-owner-run-status.json` and
`host-02-account-config-worktree-run-status.json`: CLI exits 0/success true.
Execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; owner
`0af39dab-3c06-40de-9077-99207660c1e9`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both Auto Run observations: running false/state null; no launch/run ID observed
or inferred and no engine launched. Reported directly in this execution tab.
All source/static/git commands ran in the registered worktree.

# HOST-02 canonical account configuration persistence prerequisite (2026-10-07)

Completed exactly one self-contained source task split from the unchecked account
lifecycle task before source edits. Full lifecycle, test creation/execution and
HOST-05 review/PR remain separate. Full mail acceptance is unmet.

## Actual code and scope

- `authorization-ledger.ts` now owns private ledger version 2 with a `mail`
  extension. Only fresh anchored version-1 consent migrates, preserving existing
  plugin entries/tombstones and generating empty mail state plus a stable opaque
  installation ID. Migration bumps/persists the canonical epoch. Unsupported,
  malformed, unknown-root, stale or foreign state fails through re-consent; no
  mail rights are migrated or minted.
- Added `mail-account-ledger.ts`: closed immutable mail extension, 32 plugins,
  exact unique plugin/installation bindings, canonical configuration parser and
  independently retained plugin AuthIdentity. Exported existing `mailRecord`
  and `mailList` in config rather than duplicating descriptor/array validators.
- Host-only `readMailConfiguration` checks persistent/non-dropped state, live
  seal/anchor availability and exact anchor epoch/secret, current plugin consent
  and tombstones, and both identity bindings. Missing configuration returns null
  only after those checks; all errors have fixed content-free mail codes.
  `addDisabledMailAccount` validates settings, adds only a random revision-1
  disabled account, preserves removal history, rejects collisions/overflow,
  bumps/seals/persists and rechecks access. No secret or account/agent rights.
- Shared canonical reader caps ciphertext at 24 MiB before allocation and
  plaintext at 20 MiB before JSON parse; exact reads reject truncation/growth.
  Native unseal necessarily allocates its returned string before our size check.
  Writes reuse `assertSerializedJsonIsSafe`, bound plaintext/ciphertext, check
  backend availability, confirm the exact anchor by readback, create temp files
  with mode 0600 and retain the existing anchor-before-rename commit. Persistence
  failure permanently denies mail state in this process; ordinary plugin consent
  retains its existing session-only fallback. No fsync/power-loss guarantee.
- Source diff against entry snapshots: **254 additions, 11 removals, 265 changed
  lines across three modules**: ledger +177/-9, config +2/-2, new module +75/-0.
  Entry snapshots and exact check log are in ignored worktree
  `.maestro/verification/host-02-account-persistence/`. Earlier source edits and
  untracked documentation were preserved. Contract and shared evidence updated.

## Exact checks and tests

Initial and final isolated strict/noUnused TypeScript checks both exit 0, with no
diagnostics. Final exact command:
`node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-ledger.ts`.
Existing absolute Prettier source/docs writes and final check exit 0;
`git diff --check` exit 0. New-file no-index whitespace checks exit 1 with empty
diagnostics (expected added-file differences). Three no-index source numstat
commands exit 1 because their files differ, with exact counts above.
Exact commands, outputs, individual exits and fresh CLI receipts are mirrored in
shared `host-02-account-persistence-static-checks.log`.

Tests created/run **0/0**, as required by this source task. No mocked/runtime,
native keyring/seal, authorization store/backend, socket or LOGIN execution.
No full repository/build/SDK/Cue gate ran. Later tests must cover v1 migration,
malformed/rollback/foreign v2 state, bounds, exact identity and installation,
disabled additions, collision/overflow, anchor no-op/readback/failure and ordinary
plugin-ledger regression behavior. Static compilation is not a security assertion.

## Limitations and exact git/PR outcome

Mail methods are unwired main-process seams; canonical ledger source changes will
also affect the existing production authorization store when built/run. Trusted
setup proof, host feature/manifest/content-egress gates, verified agent invocation,
independent account/agent grant schemas, enabled-account editing/removal/rebinding,
canonical mutation queue and synchronous generation cancellation, credential
cleanup and orphan recovery, safe projections, MIME reads, monitor/checkpoint/event,
SDK/Cue integration are not implemented. Revoke/uninstall denies configuration
reads through existing consent; retained config/history awaits cleanup wiring.
The identity argument itself is not caller proof. No mock-tested or
production-tested readiness or complete account lifecycle claim.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`; branch
`feat/relay-imap-host-20261006`; base and unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45` (`rc`). No stage/commit/push/PR.
No-PR reason: complete implementation/acceptance and normal gates are pending;
conditional review/commit/PR belongs to HOST-05. No install, dependency mutation,
upstream merge, deployment, live mail/secret/login, callbacks, Discord, other
checkout/plugin writes or new consult/dispatch. All source/static/git work ran
inside the registered worktree; only authorized shared playbook/evidence/receipts
were written in the main checkout.

## Observed execution identity

Fresh shared `host-02-account-persistence-execution-tab.json`,
`host-02-account-persistence-owner-run-status.json` and
`host-02-account-persistence-worktree-run-status.json`: each CLI exit 0/success
true. Execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; owner
`0af39dab-3c06-40de-9077-99207660c1e9`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both Auto Run observations running false/state null. No engine launched or run ID
observed/inferred. Outcome reported directly in this execution tab.

# HOST-02 sealed agent-rights prerequisite (2026-10-07)

Completed exactly one self-contained source task inserted before the remaining
account lifecycle checkbox in RELAY-IMAP-HOST-02.md. Full lifecycle, test creation,
test execution, SDK/Cue and HOST-05 review/PR remain unchecked. Acceptance is unmet.

## Actual code and scope

- Extended `mail-account-ledger.ts` with closed immutable per-account agent
  grants, bound to an existing account at its exact revision within the sealed
  installation/plugin/configuration identity. Canonical dense array/record and
  allowlist-member validation reused. At most 128 unique exact ASCII agents per
  account, IDs 1-128 characters, nonempty unique independent read/detail/attachments
  rights; stale/removed/duplicate accounts, duplicate agents/rights, wildcards,
  unknown fields, explicit null and empty grant entries are refused. Older v2
  configs without agentGrants load as empty rights; no new storage/SDK version.
- `AuthorizationStore.replaceMailAgentRights` is an unwired host-only setup seam:
  live persistent configuration and dual identity checks, expected-revision guard,
  revision/epoch advancement, replacement of one account's full policy (empty list
  revokes all), existing seal/anchor path and post-persist access check. Disabled
  accounts may have staged policy but stay disabled. Unrelated grants are preserved
  when another disabled account is added; common commit logic was extracted rather
  than duplicating persistence. Revision overflow/mismatch use fixed errors.
- `assertStoredMailAgentRight` checks persistent/live anchor, both identities,
  enabled account, exact revision/agent/right. It proves stored policy only; it
  does not prove caller, current agent membership, manifest/capability/feature
  gates, generation, cancellation or network authority. No public route/caller.
- Canonical plugin mint/revoke/uninstall clear owned mail rights before the shared
  commit, retaining config/history pending cleanup. Re-consent cannot resurrect
  grants. Shared production consent behavior changes when this source is built;
  existing consent regression tests and all new policy tests remain later tasks.
- Entry-snapshot source diff: **192 additions, 20 removals, 212 changed lines in
  two modules**: authorization-ledger.ts +116/-17, mail-account-ledger.ts +76/-3.
  Snapshots/logs in ignored worktree `.maestro/verification/host-02-agent-grants/`.
  All earlier uncommitted source/docs preserved. No new test/source modules.

## Exact checks and tests

Initial source Prettier write exit 0. Initial isolated strict/noUnused TypeScript
check exit 0, no diagnostics. Final command (also recorded with individual exit
and output in the check log):
`node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-ledger.ts`.
Final TypeScript, source/docs Prettier and tracked whitespace checks exit 0.
No-index checks on untracked module/docs exit 1 with no whitespace diagnostics;
source numstat commands exit 1 because snapshots differ, with exact counts above.
Exact commands/output/exits mirrored in shared `host-02-agent-grants-static-checks.log`.

Tests created/run **0/0**, required separation from this source task. No product
suite/build/SDK/Cue/full repository gate. No native keyring/seal, authorization
store/backend, socket or LOGIN execution. Static checking establishes neither
secure mail acceptance nor runtime/mock/production readiness. Later tests need
closed/malformed/legacy empty-grant parsing, exact account/agent/independent rights,
stale/overflow revision, disabled policy, persistence failure, preserving other
accounts, canonical mint/revoke/uninstall clearing and re-consent non-resurrection.

## Limitations and exact git/PR outcome

No account enabling/edit/removal, safe projections, credential cleanup/orphan
recovery, trusted setup authority/live agent intersection, verified invocation,
plugin capability/manifest/egress policy, keyed mutation queue, synchronous abort,
MIME reads, monitors/events/checkpoints, SDK/Cue or production mail composition.
The supplied agentId/current identity are trusted-host inputs, not caller proof;
never expose these stored-policy seams as an authority-bearing plugin method.
No test/security/full lifecycle completion claim.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`; branch
`feat/relay-imap-host-20261006`; unchanged HEAD/base
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45` (`rc`). No stage/commit/push/PR.
No-PR reason: feature implementation/acceptance and normal gates pending;
review/conditional PR is HOST-05. No install/shared dependency mutation/symlink,
upstream merge, deployment, live mail/secret/login, callbacks, Discord, other
checkout/plugin writes or consult/dispatch. Only authorized shared playbook,
evidence/check logs and identity receipts were written in the main checkout.

## Observed execution identity

Fresh shared `host-02-agent-grants-execution-tab.json`,
`host-02-agent-grants-owner-run-status.json` and
`host-02-agent-grants-worktree-run-status.json`: CLI exits 0/success true.
Execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; owner
`0af39dab-3c06-40de-9077-99207660c1e9`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both Auto Run observations running false/state null; no engine launched and no
launch/run ID observed/inferred. Outcome reported directly in this execution tab.

# HOST-02 stored account mutations and projection prerequisite (2026-10-07)

Completed exactly one self-contained source task split out before the unchecked
full account lifecycle task in RELAY-IMAP-HOST-02.md. Full lifecycle, test creation,
test execution, SDK/Cue and HOST-05 review/PR remain unchecked. Acceptance is unmet.

## Actual code and scope

- Added pure closed disable/complete-settings-replacement/removal transitions in
  `mail-account-config.ts`. Canonical record/settings/endpoint/mailbox and full
  configuration validators reused. Exact opaque ID and positive expected revision
  are required; missing account denies, stale revision returns MAIL_STALE, account
  revision exhaustion returns MAIL_LIMIT. Unknown fields/accessors/settings on
  other operations reject. Disable/settings replacement always leaves disabled;
  no enable path. Removal advances revision into retained tombstone; 1024-entry
  history exhaustion refuses mutation and never trims ID history. Inputs remain
  unchanged, output copied/closed/frozen. Pure helper assumes parsed configuration.
- Shared `requireMailAccountRevision` now also guards stored agent-policy replacement
  rather than duplicating its revision rules. Malformed account IDs and revisions
  now consistently return MAIL_INVALID before account lookup; missing valid IDs
  remain MAIL_DENIED. Existing stored policy rights/identity bindings preserved.
- `AuthorizationStore.mutateMailAccount` is an unwired trusted-host seam. Live
  persistent store/anchor and dual identity reads precede transition; all rights
  for the changed account are cleared, unrelated account/plugin state preserved.
  Canonical epoch/seal/anchor commit and post-persist read are reused. Validation
  and epoch exhaustion do not modify stored mail state; persistence failure denies
  mail through the existing permanent process latch and restart freshness check.
- `listStoredMailAccounts` projects only accountId/revision/enabled/mailboxes into
  immutable closed summaries. No endpoint, username, identity, grants, tombstones,
  credential retrieval/presence or operational status. Absence returns [] only
  after successful private authorization; storage/identity errors still throw.
  This internal summary is not the proposed SDK MailAccountView response.
- Entry-snapshot diff: **114 additions, 8 removals, 122 changed source lines in two
  modules**: authorization-ledger.ts +51/-6; mail-account-config.ts +63/-2.
  Snapshots and check log in ignored `.maestro/verification/host-02-account-mutations/`.
  Prior source/docs preserved; no test/new source module. Contract and shared
  evidence updated; only the new prerequisite checkbox is completed.

## Exact checks and tests

Initial source Prettier write exit 0; initial isolated strict/noUnused TypeScript
check exit 0 with no diagnostics. Final exact type command:
`node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-config.ts`.
Final TypeScript, source/docs Prettier and tracked whitespace checks exit 0.
No-index whitespace checks on untracked config/contract/evidence exit 1 with no
whitespace diagnostics (expected added-file differences). Source snapshot numstat
checks exit 1 because files differ, with exact counts above. Commands, outputs
and individual exits mirrored in shared `host-02-account-mutations-static-checks.log`.

Tests created/run **0/0**, required separation from source implementation. No
runtime/mock assertions, native keyring/seal/store/backend, socket or LOGIN.
No product suite/build/full repository/SDK/Cue gate. Later tests must cover closed
mutation shapes and complete settings validation, missing/foreign/stale/overflow
IDs/revisions, disable/edit clearing all target rights and preserving others,
removal tombstone count/size/collision/non-reuse, persistence/anchor failure,
immutable projection allowlist and fail-closed errors, and shared grant guard
regressions. Static checking is not secure mail acceptance or runtime readiness.

## Limitations and exact git/PR outcome

No enable path, trusted setup/verified caller, manifest/capability/feature policy,
live agent membership, mutation queues, generation/cancel lifecycle, credential
cleanup/rebinding/retry/orphan recovery, operational credential/readiness views,
MIME/monitor/checkpoint/events/Cue/SDK/IPC or production composition. Live lifecycle
must cancel before mutations, including existing consent/agent-right changes,
and clean/rebind slots on settings replacement/removal. Retained tombstones alone
are not cleanup evidence. No mock-tested/production-tested/full lifecycle claim.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`; branch
`feat/relay-imap-host-20261006`; unchanged HEAD/base
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45` (`rc`). No stage/commit/push/PR.
No-PR reason: full feature implementation/acceptance and normal gates pending;
conditional review/PR belongs to HOST-05. No install/dependency mutation/symlink,
upstream merge, deployment, live mail/secret/login, callbacks, Discord, other
checkout/plugin writes or consult/dispatch. Source/static/git operations all used
this registered worktree; only authorized shared playbook/evidence/receipts/log
were written in the main checkout.

## Observed execution identity

Fresh shared `host-02-account-mutations-execution-tab.json`,
`host-02-account-mutations-owner-run-status.json` and
`host-02-account-mutations-worktree-run-status.json`: CLI exits 0/success true.
Execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; owner
`0af39dab-3c06-40de-9077-99207660c1e9`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both Auto Run observations running false/state null; no engine launched and no
launch/run ID observed/inferred. Outcome reported directly in this execution tab.

# HOST-02 account activity and mutation-admission prerequisite (2026-10-07)

Completed exactly one self-contained source task, inserted before full account
lifecycle in RELAY-IMAP-HOST-02.md under the required source-task split. Full
lifecycle, test creation/execution, SDK/Cue and HOST-05 review/PR remain unchecked.
Full mail acceptance is unmet; this is implementation/static evidence only.

## Actual changes and boundaries

- Added host-private `mail-account-activity.ts` (226 lines), owned per canonical
  AuthorizationStore. Canonical `createKeyedWriteQueue` main-process re-export
  reused. Exact plugin/account tuple keys; fresh abortable leases prevent stale
  handles reviving on key reuse. Required authority callbacks normalize failures;
  no default allow, caller/setup proof, persistent policy or dispatch engine.
- Added `AuthorizationStore.acquireMailActivity`: immutable parsed dual identity,
  required current caller/live-agent/feature/manifest/capability/broker/egress
  host callback plus stored enabled account/exact revision/agent/independent right
  checked at admission and every lease check. Parameters alone confer no authority.
  Registered readers abort synchronously; cancellation/release remains terminal.
- Added `enqueueMailAccountMutation`: trusted setup callback mandatory, exact
  account/expected revision checked at submission and queue drain; synchronous
  read admission closure and abort precede awaiting. Canonical per-account queue
  serializes host-only void callbacks. Authority/store checks surround awaited
  work, with in-callback per-await guards still mandatory. No work result is returned.
- Bounds: 1024 retained account states, 512 readers/8 per account, 64 mutations/8
  per account. Unblocked idle keys are pruned; failed admitted work latches the
  account and aborts its queued mutation tokens. Plugin consent changes with
  activity also retain bounded plugin latches. No recovery/reset authority exists.
- Canonical configuration commits invalidate affected revisions/removals before
  mutation and recheck the original configuration after synchronous abort listeners,
  covering direct disable/settings/remove/agent-policy paths. Mint/revoke/uninstall
  and accepted allowlist edits cancel registered plugin reads and queued setup.
  Persistence failure permanently stops all registry activity in this process.
  Existing consent behavior therefore needs later regression tests.
- Static review corrected reentrant admission during abort, counter cleanup,
  identity-safe pruning of reused keys, initial queue registration before authority
  callbacks, global/plugin/account latches and callback error normalization. These
  are source-inspection findings, not runtime assertions or a test pass.
- Entry-snapshot source diff: **311 additions, 2 removals, 313 changed lines across
  two modules**. authorization-ledger.ts +85/-2; new activity module +226/-0.
  Snapshots/check log in ignored `.maestro/verification/host-02-account-activity/`.
  Earlier source/docs preserved. Contract and shared playbook/evidence updated;
  later test-creation requirements extended for activity/queue regressions.

## Exact checks and tests

Initial and subsequent isolated strict/noUnused TypeScript checks exit 0, no
compiler diagnostics. Final commands, individual exits/output, source diff and
fresh CLI observations are recorded in `host-02-account-activity-static-checks.log`
and mirrored into the authorized shared evidence folder. Exact type command:
`node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-activity.ts`.
Final source/docs Prettier write/check and tracked whitespace checks exit 0.
No-index whitespace checks for new module/contract/evidence each exit 1 with no
whitespace diagnostics (expected added-file differences); snapshot numstat exit 1
records the counts above. Static checking is not runtime security acceptance.

Tests created/run **0/0**, as source/test creation/test execution must remain
separate. No runtime/fake transport/keyring/seal/store/backend invocation, socket
or LOGIN. No product suite/build/full repo/SDK/security/Cue gates run. Later tests
must check bounds, missing/failing/changing authority, exact revision/agent/right,
abort-before-await ordering, stale handles/key reuse, reentrant abort/pruning,
same-account queue order, queued revoke/stale denial, failure latch/counters,
direct stored/canonical consent invalidation and persistence-failure stop.

## Remaining lifecycle and exact git/PR outcome

No trusted setup nonce/gesture/caller verification, enable/recovery, credential
write/delete/rebind/retry/orphan cleanup, MIME/headers/attachment result handling,
monitor/events/checkpoints, SDK/IPC/Cue or production transport composition.
Actual resources must attach nonthrowing abort cleanup, use lease signal, check
before/after every await and publication, release in finally and erase owned
buffers on errors/discard. Direct synchronous ledger guards do not serialize
async setup; future host service must route that work through the keyed queue.
Never-settling work retains a bounded slot; no new callback timeout is supplied.
Failed-account/plugin latches are process-local, with no in-process reset;
restart can restore earlier sealed state. Durable stopped-state/recovery handling
is still required by full lifecycle. No mock/production-tested readiness claim.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`; branch
`feat/relay-imap-host-20261006`; unchanged HEAD/base
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45` (`rc`). No stage/commit/push/PR.
No-PR reason: full implementation/acceptance and normal gates pending; conditional
review/PR belongs to HOST-05. No install/dependency mutation/symlink, upstream
merge, live mail/secret/login, callbacks, Discord, deployment, plugin/other checkout
writes or consult/dispatch. Source/check/git operations used this registered
worktree; main-checkout writes only shared checklist/evidence/receipts/check log.

## Observed execution identity

Fresh `host-02-account-activity-execution-tab.json`,
`host-02-account-activity-owner-run-status.json` and
`host-02-account-activity-worktree-run-status.json`: CLI exits 0/success true.
Execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; owner
`0af39dab-3c06-40de-9077-99207660c1e9`; tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both Auto Run observations running false/state null. No engine launched or
launch/run ID observed/inferred. Result reported directly in this execution tab.

## HOST-02 queued credential mutation prerequisite — 2026-10-07

Completed exactly one new source prerequisite inserted before the larger unchecked
account lifecycle task in shared `RELAY-IMAP-HOST-02.md`, within its source-splitting
rule. Full host acceptance, trusted setup, enable/recovery and all tests remain
unchecked. Read the project plugin/Cue/development guidance, shared utility guide,
existing configuration, sealed ledger, activity registry, slots and fixed-command
validators first. Existing canonical code is reused; no new permission store,
keyring anchor, task engine or write queue was introduced.

### Actual source and scope

- New host-private `src/main/plugins/mail-account-credentials.ts` (202 lines):
  `MailAccountCredentials` binds canonical store/exact plugin/copied dual identity.
  Host-only mandatory live setup callback/AbortSignal are snapshotted. Neither
  constructor/parameters nor stored configuration mint setup/caller/network authority.
- `savePassword` admits only disabled exact-account/expected-revision work into
  canonical queued activity. It persists another disabled revision and clears
  that account's rights before the exact native slot write. No password getter,
  readiness status, transport, plugin callback or arbitrary result is exposed.
- `mutateAccount` uses existing closed disable/settings/remove transition validation,
  copies immutable replacement settings before waiting, commits disabled state or
  a removal tombstone through the canonical store, then deletes the old exact slot
  with confirmed absence. Native authorization checks live lease/setup/identity/
  persisted store and committed account/tombstone revision. Unrelated state survives;
  stale same-account mutations are denied. Both methods return Promise<void>.
- `mail-credentials.ts` reuses `assertImapQuotedString` rather than retain another
  ASCII/password-bound validator; save now confirms exact native readback, rejects
  no-op/mismatch/missing/native failure and clears local write/readback references.
  Required authority checks surround native operations, with content-free failures.
- Static inspection corrected account-object comparison: canonical parsing copies
  unrelated objects, so guards compare exact revisions/enabled state/tombstone
  presence instead. Setup signal and callback are snapshotted together. No runtime
  assertions are claimed for these source-review findings.
- Entry-snapshot diff: **221 additions, 11 removals, 232 changed source lines across
  two modules**: new composition +202/-0, credential slot +19/-11. Existing modified
  authorization ledger and other earlier files were preserved. Contract updated;
  later test-creation checkbox expanded, without creating or executing tests.

### Checks, evidence and exact test outcome

Worktree-local receipt directory `.maestro/verification/host-02-account-credentials/`
contains `mail-credentials.ts.before`, `static-checks.log`, `execution-tab.json`,
`owner-run-status.json`, `worktree-run-status.json`. Final static log commands
record individual output/exits; mirrored receipt log is
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/host-02-account-credentials-static-checks.log`.

Strict/noUnused TypeScript exit **0**, no diagnostics, using existing read-only
local dependency binaries/types, no installation or node_modules symlink:
`node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/authorization-ledger.ts src/main/plugins/mail-credentials.ts src/main/plugins/mail-account-credentials.ts`.
Final source/contract/evidence Prettier write/check exit **0**. Tracked whitespace
check exit **0**. No-index source/docs whitespace checks exit **1** with no
whitespace diagnostics, meaning expected file differences; source numstat exit
**1** records the counts above. These are static checks, not security acceptance.
Tests created/run **0/0**. No fake/native backend/store/transport/login invocation;
no full suite, repository lint/build, SDK drift, broker/security or Cue gates run.

### Remaining boundaries and honest crash behavior

This composition has no production caller and supplies no trusted setup minter,
verified invocation/agent membership, live feature/capability/content-egress gates,
enabling, recovery, MIME/header/body/attachment reads, monitors/events/checkpoints,
SDK/IPC/Cue or plugin uninstall cleanup orchestration. The future host must provide
all authority gates and abort setup signals on relevant lifecycle changes.
Setup-signal abort clears the queued password reference immediately; other terminal
failures clear it on queue settlement. Canonical revoke cancels a pending lease,
but without setup signal abort an earlier never-settling operation can retain the
bounded canceled closure until drain. No cancellation hook or interruptible native
keyring timeout was added; JavaScript/native string zeroization is not promised.

Persisting stopped state before native access prevents a crash between the steps
from leaving this path's account enabled. Failed readback/delete or revocation can
leave an old/new native credential; stopped account/tombstone is retained, but
cleanup intent/completion has no durable marker, retry/orphan scan or transaction
with keyring. Failed admitted queue work retains existing process-local latches;
restart recovery still requires a later task. Direct host-only stored mutations
remain unwired prerequisites and do not delete slots. No mock-tested, secure
backend or production-tested readiness claim. Full lifecycle remains unfinished.

### Git, PR and execution identity

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch
`feat/relay-imap-host-20261006`, unchanged HEAD/base
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45` (`rc`). **No stage/commit/push/PR**;
full acceptance and normal gates are pending, review/conditional PR belongs to
HOST-05. No install/shared dependency mutation, upstream merge, live mail/actual
secret/login, callbacks/Discord, deployment, plugin/other checkout write or
consult/dispatch. Source/check/git work used the registered worktree; main-checkout
writes only the authorized shared playbook/evidence receipt directory.

Fresh CLI receipts: exits **0**, success true. Execution agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, owner
`0af39dab-3c06-40de-9077-99207660c1e9`, execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`, provider agentSessionId null. Both
Auto Run observations running false/state null. No engine launched and no
launch/run ID observed or inferred. Outcome reported in this execution tab.

## HOST-02 removed-account credential cleanup retry prerequisite — 2026-10-07

Completed exactly the source prerequisite inserted ahead of full account lifecycle
in shared `RELAY-IMAP-HOST-02.md`, following its three-file/<500-line split rule.
Full lifecycle, all test creation/execution, SDK/caller/setup/Cue and HOST-05 remain
unchecked. Earlier uncommitted files were preserved. Source/static only;
**mail acceptance is not satisfied**.

### Source and review evidence

- `src/main/plugins/mail-account-config.ts`: 15 additions, no removals.
  `requireMailAccountTombstoneRevision` reuses canonical ID/revision parsing,
  denies missing/live/stale records and accepts terminal maximum revisions without
  advancing history. It confers no authority.
- `src/main/plugins/authorization-ledger.ts`: 36 additions, no removals.
  `enqueueRemovedMailAccountCleanup` composes the existing bounded account activity
  registry/keyed mutation queue. Exact tombstone revision and installation plus
  canonical persistent anchored plugin/dual identity and live host callback are
  checked at admission/drain/native completion. A final stored check after host
  callbacks addresses synchronous reentrant consent changes. No new store/queue.
- `src/main/plugins/mail-account-credentials.ts`: 34 additions, no removals.
  `cleanupRemovedAccount` snapshots mandatory live setup callback/AbortSignal,
  binds existing committed authority to the retained tombstone and exact slot,
  reuses deletion/absence confirmation and returns void with fixed errors.
- Total **85 added / 0 removed lines, three source files**, against entry snapshots
  `.maestro/verification/host-02-removed-cleanup/*.before`. Source patches saved
  alongside snapshots as `*.diff`; full earlier branch diff is larger.
- No configuration, epoch, tombstone, rights or unrelated state is mutated by
  this cleanup path. Repeated confirmed absence can succeed. Native errors/no-op
  deletes retaining a value/cancellation/revoke/stale checks cannot report success.
- Existing account/plugin/process failure latches remain permanent for that registry.
  A fresh canonical store after restart can retry a retained removal only if all
  normal consent/identity/seal/anchor/setup gates pass. Revoked/uninstalled accounts
  and disabled-account orphan slots have no new bypass or cleanup authority.
- Contract updated to describe actual seam and limits; later transport/account
  test task expanded with exact tombstone, slot, cancellation/reentrance, failure,
  preserved-state, repeat/restart and fail-closed denial assertions. No tests written.

### Commands and exact outcomes

All source/git/check commands ran with cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Existing tools were read
from the main checkout's dependency directory without install, symlink or mutation.
Exact command/output/exit log:
`.maestro/verification/host-02-removed-cleanup/static-checks.log`.

- Source Prettier `--write` with the existing binary: exit **0**, all unchanged.
- Isolated strict/noUnused TypeScript check: exit **0** on first invocation:
  `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-config.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts`.
- Tracked `git diff --check`: exit **0**. Three snapshot no-index whitespace
  checks: each exit **1** with empty output, expected differences without diagnostics.
  Three snapshot no-index numstat checks: each exit **1**, reporting 15/36/34 additions.
- Final source/docs Prettier write/check and tracked whitespace checks: exits **0**;
  exact commands and output appended to the same log.
  A documentation-edit script initially exited **1** because it assumed a double
  newline after the final test task; contract changes succeeded, checklist test
  requirements were then inserted using the exact unique existing sentence.
- Product tests created/run **0/0**. No suites, runtime/native/keyring/storage calls,
  sockets/LOGIN, secure-backend verification, full repository lint/build/SDK/Cue
  gates, mock-tested or production-tested claim. Runtime gates belong to later tasks.

### Remaining limitations and PR outcome

No production caller, automatic scan, durable pending/completion marker,
failed-process latch recovery, disabled-account orphan handling, credential
readiness, enable path, trusted setup/caller minter, revoke/uninstall cleanup
orchestration, SDK/IPC/Cue/MIME/watch/dispatch path. Tombstones stay permanently;
restart or retained history cannot establish successful cleanup. Native operations
are synchronous, not interruptibly time-bounded, and string zeroization is not
promised. Future lifecycle must add trusted production composition and tests.

Branch `feat/relay-imap-host-20261006`; base/HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45` (`git merge-base HEAD rc` matches).
No stage, commit, push or PR. No-PR reason: implementation/acceptance and normal
repository/SDK/Cue gates remain outstanding; conditional review/commit/PR is HOST-05.
No upstream merge, install, actual secret retrieval, live mail, callback, Discord,
deployment, plugin checkout edit, consult or dispatch. Backstage coordination remains
HOST-01's recorded consult; this internal unwired seam changes no public API/version.
Only authorized shared playbook checklist/evidence/identity receipts were written
in the main checkout; all source snapshots/check logs/docs are in this worktree.

### Observed execution identity

Fresh CLI commands and exits are recorded in
`.maestro/verification/host-02-removed-cleanup/identity-checks.log`, with selected
JSON receipts in that directory and shared `host-02-removed-cleanup-*.json`.
`session list --json` and both `auto-run-status --agent ... --json` exits **0**,
success true. Owner `0af39dab-3c06-40de-9077-99207660c1e9`; registered execution
agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both owner/worktree Auto Run observations running false/state null. No engine
launched and no launch/run ID observed or inferred. Outcome reported in this
execution tab, without callback or dispatch to another tab.

## HOST-02 durable removed-slot cleanup metadata prerequisite — 2026-10-07

Completed exactly one inserted source prerequisite under the playbook's mandatory
three-file/<500-line split rule. Full account lifecycle and all test creation,
execution, SDK/setup/caller/Cue/review tasks remain unfinished. Earlier uncommitted
work preserved; no production path or mail acceptance claim.

### Code outcome

- `mail-account-config.ts`: **+15/-2**. Closed bounded tombstones carry
  `credentialCleanup: 'pending' | 'confirmedAbsent'`; legacy omission defaults
  to pending, explicit invalid values fail closed, and new removals write pending.
- `authorization-ledger.ts`: **+48/-0**. Host-only
  `recordRemovedMailCredentialCleanup` reuses the canonical sealed commit and
  confirmed freshness anchor, exact retained revision and installation/plugin/dual
  identity gates, mandatory authority checks and reentrant configuration checks.
  Only cleanup metadata/epoch changes; removal revision (including terminal max),
  IDs/history/unrelated accounts/grants and existing stop latches are preserved.
- `mail-account-credentials.ts`: **+30/-0**. Existing queued retry persists pending
  before native access on every attempt, even after prior confirmation; exact-slot
  deletion/readback and live authority precede anchored confirmation. Initial queued
  removal also records confirmation after native absence. No other operations changed.
- Total **93 added / 2 removed = 95 changed source lines in three modules** against
  task-entry snapshots. Snapshots, diffs/counts, commands/output/exits and receipts
  are in `.maestro/verification/host-02-cleanup-state/` (ignored worktree evidence).
  Contract and later test-creation requirements updated to describe current behavior.

The stored outcome is historical native absence, not current backend truth,
credential readiness, authority or permission to skip native checks. Pending
survives a crash between successful native deletion and confirmation, unless partial
anchor-first persistence invalidates the ledger and requires normal re-consent.
Confirmation can be durable while a later live check fails the response. No atomic
ledger/keyring transaction, exactly-once result, secure-backend verification,
interruptible native timeout or string zeroization claim. Failed admitted work
retains stopped latches; canonical persistence failure stops all mail activity.
The outcome setter is a trusted-host seam, not proof by itself; production wiring
must keep it private and use the queued native composition.

### Verification and exact command outcomes

All code/git/check commands used cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Existing dependency
binaries were read from `/home/chris/code/Maestro/node_modules/`; no install,
symlink or dependency mutation.

- Source Prettier `--write`: exit **0**, all three unchanged.
- Strict isolated TypeScript: exit **0** on first invocation:
  `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-config.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts`.
- Tracked `git diff --check`: exit **0**. Three task-entry no-index whitespace
  checks: each exit **1**, empty diagnostics (expected differences). Source numstat
  and saved patch commands: exit **1**, expected differences/counts above.
- Final source/contract/evidence Prettier write/check and tracked whitespace:
  exits **0**; exact commands/output/exits in `static-checks.log`. Contract/evidence
  snapshot whitespace checks exit **1** with no diagnostics (expected differences).
- Tests created/run **0/0**, required by this source-only task. No fake/native
  keyring/store/transport invocation, actual secret retrieval, socket/LOGIN,
  full repository lint/build/test, SDK parity/security or Cue gates. Static review
  checked native ordering, legacy default, closed states, revision preservation,
  unrelated rights retention, live checks and failure/crash limits; no runtime claim.

### Execution, git and PR outcomes

Fresh CLI identity commands exit **0**, success true, recorded in
`identity-checks.log` and selected local/shared JSON receipts. Execution agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; owner
`0af39dab-3c06-40de-9077-99207660c1e9`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both owner/worktree Auto Run observations running false/state null. No engine
launch or run ID observed/inferred. Initial receipt-extraction script exit **1**
expected `tabs`; actual CLI key is `sessions`. Corrected extraction exit **0**;
the CLI itself succeeded and no state changed. Outcome reported in this tab.

Branch `feat/relay-imap-host-20261006`; unchanged HEAD/base/merge-base with `rc`
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No stage/commit/push/PR;
implementation/acceptance and normal gates remain outstanding, review/conditional
PR belongs to HOST-05. No upstream merge, install, actual/live secrets/mail/login,
callback, Discord, deployment, consult/dispatch or other checkout/plugin changes.
Only authorized shared checklist/evidence/receipts written in main checkout.

No production caller, scan, live-account orphan handling, enable/recovery/latch
reset, setup/caller minter, SDK/IPC/Cue/MIME/watch/dispatch path. Full lifecycle and
mail acceptance remain unmet. Only this source prerequisite is checked off.

## HOST-02 queued disabled-account enable prerequisite — 2026-10-07

Completed exactly one inserted source prerequisite under the playbook's required
three-file/<500-line split. Full lifecycle, test creation/execution, caller/setup,
SDK/Cue/MIME/production wiring and HOST-05 review remain unfinished. Existing
uncommitted work was preserved. No mail acceptance or runtime readiness claim.

### Code outcome

- `mail-credentials.ts`: **+18/-0**. Exact-slot trusted setup availability probe,
  existing bounded password grammar, mandatory live authority checks, void return,
  fixed safe errors and finally-cleared local secret reference; no getter/cache.
- `authorization-ledger.ts`: **+47/-0**. Narrow host-only disabled-to-enabled intent
  commit with required live callback, exact ownership/revision, revision/epoch
  advancement, account rights clearing, unrelated-state/history preservation,
  reentrant authority and committed enabled-revision checks. Generic mutation
  grammar remains unchanged. Stored setter alone is not a credential proof.
- `mail-account-credentials.ts`: **+52/-1**. Queued enable composition with
  snapshotted mandatory setup callback/signal, disabled-account and installation
  checks at admission/drain, native probe before canonical enable, live completion
  and exact committed-state checks, fixed errors and retained queue stop latches.
- Total **117 added / 1 removed = 118 changed source lines in three modules**
  against task-entry snapshots. Contract and later test-creation requirements
  updated. Snapshots, patches/counts, static commands/output/exits and CLI receipts
  are in ignored worktree `.maestro/verification/host-02-enable/`.

Enabling stores user intent and clears its agent rights; it creates no permission,
authentication or readiness. The slot may change after probing. Future transport
must retrieve/validate its credential and reauthorize anew. No zeroization,
interruptible native call, secure-backend availability, atomic ledger/keyring
transaction or exactly-once claim. Failed admitted work retains its account latch;
canonical persistence failure stops all mail. No existing latches are reset.

Failure before commit leaves disabled state; a failure after commit may leave
persisted enabled intent with no rights and a failed response. Failure in final
checks after queue settlement also fails the response without a new latch or
rollback. Restart infers no rights from enabled intent. Partial anchor-first
persistence can require normal re-consent. Production must use the queued path,
not expose the stored setter directly. No trusted setup/caller minter, recovery,
scan/orphan handling, read/MIME/watch/SDK/IPC/Cue/dispatch or production caller.

### Verification and exact command outcomes

All source/git/check commands used cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Read existing dependency
binaries from `/home/chris/code/Maestro/node_modules/`; no install, symlink or shared
dependency mutation. Source Prettier write and strict isolated TypeScript each
exit **0**, including the final source revision. Tracked `git diff --check` exit
**0**. Source task-entry no-index whitespace checks each exit **1** with empty
diagnostics; patches/numstat each exit **1** for expected differences/counts above.

Strict command:
`node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-credentials.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts`.

Tests created/run **0/0**, required for this source-only checkbox. No fake/native
store/keyring invocation, actual secret retrieval, transport/socket/LOGIN, full
repo lint/build/test, SDK parity/security or Cue gates. Static review checked
queue ordering, ownership/revision/disabled admission, native-before-commit order,
secret reference lifetime, grant clearing, unrelated-state preservation, callback
reentry/cancellation and failure/crash limits. Mock/production tests remain pending.

### Execution, git and PR outcomes

Fresh `session list --json` and owner/worktree `auto-run-status --agent ... --json`
commands each exit **0**, success true; exact commands/outputs/exits in
`identity-checks.log`. Execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`;
owner `0af39dab-3c06-40de-9077-99207660c1e9`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both observed Auto Runs running false/state null. No engine launch/run ID observed
or inferred. Selected local/shared receipts `host-02-enable-*.json`; outcome
reported directly in this execution tab without callback/dispatch.

Branch `feat/relay-imap-host-20261006`, unchanged HEAD/base/rc merge-base
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No stage/commit/push/PR;
acceptance/implementation and normal gates outstanding, conditional PR reserved
for HOST-05. No upstream merge, install, live mail/secret/login, callback, Discord,
deployment, consult/dispatch or plugin/other-checkout changes. Main-checkout writes
confined to authorized shared playbook checklist/evidence/identity receipts.
Only the queued-enable prerequisite is checked off; full lifecycle remains unchecked.

Final source/contract/evidence Prettier write/check and tracked whitespace checks
exit **0**. Contract/evidence snapshot whitespace checks exit **1** with empty
diagnostics (expected differences). Final HEAD/merge-base commands exit **0**,
matching the base above. Commands/output/exits recorded in `static-checks.log`.

## HOST-02 authenticated header-literal read prerequisite — 2026-10-07

Completed exactly one inserted source prerequisite under the required
three-file/<500-line split. Full lifecycle, header projection/MIME, test
creation/execution, setup/caller, SDK/Cue/production wiring and HOST-05 review
remain unfinished. Prior uncommitted work was preserved. This is implemented
source with static checks only, not mock-tested or production-tested acceptance.

### Code outcome

- `src/main/plugins/mail-account-read.ts`: **+199/-0**. Host-private
  `MailAccountHeaderReader.readHeaderBytes` composes closed exact-reference parsing,
  immutable dual plugin identity, canonical enabled-account/revision/read-right
  lease and configured mailbox/installation checks, exact native slot LOGIN and
  configured TLS with fixed read-only EXAMINE/UIDVALIDITY/header BODY.PEEK FETCH.
  Mandatory host callback/agent/signal captured; caller cancellation and canonical
  invalidation reach the real transport, erase owned discarded literals and clean
  listener/socket/lease state. Admission/login/operation share one monotonic budget.
- `src/main/plugins/mail-imap-commands.ts`: **+11/-7**. Export and reuse existing
  `assertImapUid` semantics as the canonical positive 32-bit decimal validator;
  existing command/status/search call sites use it. No broadened wire grammar.
- Total **210 added / 7 removed = 217 changed source lines in two modules**
  against task-entry snapshots. Saved source patches, numstat, snapshots, identity
  receipts and exact static commands/output/exits in ignored worktree
  `.maestro/verification/host-02-header-read/`. Contract and later focused test
  requirements updated; only this prerequisite checkbox is completed.

No proof is minted by an agent ID or callback. Future verified host context must
supply the caller callback and prove live agent, plugin identity, feature,
manifest/capability/broker/egress policy. No plugin/tool identity arguments, generic
plan/commands/socket, secret getter, search/body/source/attachment operation or
result/event publication was added. The constructor's injection seams are host-only.

Success transfers a <=64 KiB raw header buffer to trusted host code and releases
this read lease. That recipient must erase discarded/consumed bytes, perform bounded
allowlisted projection and acquire/check fresh authority before later publication.
Transferred bytes cannot be recalled. JavaScript credential strings cannot promise
zeroization, and synchronous native/backend/host callbacks cannot be preempted;
overtime fails on subsequent checks. Lower-layer authority normalization can yield
MAIL_DENIED for a deadline failure. Fetch is historical, never ongoing permission,
credential readiness, MIME validity, exactly-once delivery or production readiness.
No latches are reset; no durable recovery, setup/caller minter, watch/checkpoint/
metadata event/Cue/SDK/RPC or production caller exists. Full mail acceptance unmet.

### Verification and exact command outcomes

All source/git/check commands used cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Existing binaries read
from `/home/chris/code/Maestro/node_modules/`; no install, symlink or shared dependency
mutation. Source Prettier write and strict isolated TypeScript each exit **0**;
tracked `git diff --check` exit **0**. Task-entry/new-file source no-index whitespace
checks each exit **1**, with empty diagnostics (expected differences). Source
patch/numstat each exit **1**, with the expected changes/counts above.

Strict command:
`node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-read.ts src/main/plugins/mail-imap-commands.ts`.

Tests created/run **0/0**, as required for this source-only checkbox. No fake/native
store/anchor/keyring invocation, actual credential retrieval, transport/socket/LOGIN,
full repo lint/build/tests, SDK parity/security or Cue acceptance gates. Static
inspection checked fixed operation/reference closure, snapshotted authority,
stored read right and exact revision/installation/mailbox, reentrant cancellation,
shared budgets, literal ownership, final checks and cleanup. These are inspection
findings, not executed security assertions. Mock/production tests remain pending.

### Execution, git and PR outcomes

Fresh `session list --json` and owner/worktree `auto-run-status --agent ... --json`
commands each exit **0**, success true. Execution agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; owner
`0af39dab-3c06-40de-9077-99207660c1e9`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both observed Auto Runs running false/state null; no engine launch/run ID observed
or inferred. Full local receipts/command exits in `identity-checks.log`; selected
shared receipts `host-02-header-read-*.json`. Outcome reported directly in this
execution tab, without callbacks or dispatch.

Branch `feat/relay-imap-host-20261006`; unchanged HEAD/base/rc merge-base
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No stage/commit/push/PR;
implementation/acceptance and normal gates outstanding, conditional PR reserved
for HOST-05. No upstream merge, install, live mail/actual secrets/login, callback,
Discord, deployment, consult/dispatch or other checkout/plugin edits. Main-checkout
writes confined to authorized shared checklist/evidence/identity receipts.

Final source/contract/evidence Prettier write/check, strict/noUnused TypeScript,
tracked whitespace, HEAD and rc merge-base commands exit **0**. Final source and
doc snapshot no-index whitespace exits **1**, empty diagnostics (expected diffs).
Final source counts unchanged. Exact output/exits in `static-checks.log`.

Checklist audit initially exited **1** because an exact-text comparison included
the intentionally expanded future test requirements. Corrected state/prefix and
explicit test-text checks exited **0**: exactly one new completed checkbox,
all prior checkbox states preserved. No source or test check failed.

# RELAY-IMAP-HOST-02 — consumed header display projection only

Completed exactly one new self-contained source prerequisite inserted before the
still-unfinished account lifecycle checkbox. Test creation/execution remain
separate; no mail acceptance, mock-tested or production-tested claim.

## Actual source change and scope

- Added `src/main/plugins/mail-header-projection.ts` (184 lines), exporting
  `consumeMailHeaderDisplay`, its frozen limits and host-private `MailHeaderDisplay`.
  Complete bounded ASCII header-only buffers project only frozen optional
  subject/sender display strings. Exact CRLF/final empty line, closed unique
  allowlist, folds, bounds, restricted B/Q UTF-8/ASCII/Latin-1 decoding and Unicode
  safety checks fail closed. Owned input and temporary decoded buffers are erased
  in finally; no string zeroization promise.
- Extracted the canonical twelve-field `IMAP_HEADER_FIELDS` frozen list in
  `mail-imap-commands.ts`; the generated HEADER.FIELDS section is unchanged.
  Projection reuses that list and the canonical 64 KiB limit. Source snapshot
  diff **+200/-2 = 202 changed lines, two source modules**. Earlier source changes
  were preserved; no change to the existing header reader or authorization store.
- Updated [[relay-imap-host-contract-20261006]] with the implemented restricted
  grammar, byte/count/output bounds, ownership, safe error and display trust
  semantics, and separate remaining authority/integration. Extended the later
  focused test-creation checkbox; did not create or execute tests.
- Read relevant AGENTS/CLAUDE plugin/Cue, contributing and existing utility/plugin
  guides and searched main/shared/SDK code before adding the projection. No
  reusable mail-header decoder exists there. Used the official RFC 5322 folding
  and RFC 2047 encoded-word specifications linked in the contract; support remains
  a documented subset, not comprehensive RFC compatibility.

## Verification and exact outcomes

All code/check/git operations used cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Existing tools were
invoked by absolute path; no install, dependency mutation or symlink.
Exact argv/output/exits, source/document/checklist snapshots and review patches
are in `.maestro/verification/host-02-header-projection/`.

| Check                                                                                                                                                                                                                                                                                                                                           | Exact outcome                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-header-projection.ts src/main/plugins/mail-imap-commands.ts`                                                                                                                                                                                | Exit 0.                                                                                                                                                                                                                                                                                                         |
| `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-header-projection.ts src/main/plugins/mail-imap-commands.ts` | Exit 0, no diagnostics; isolated compilation includes imported canonical modules.                                                                                                                                                                                                                               |
| `git diff --check`                                                                                                                                                                                                                                                                                                                              | Exit 0.                                                                                                                                                                                                                                                                                                         |
| Source snapshot/new-file `git diff --no-index --numstat/--patch`                                                                                                                                                                                                                                                                                | Exit 1, expected differences; commands +16/-2, projection +184/-0. Patches saved.                                                                                                                                                                                                                               |
| Both source snapshot/new-file `git diff --no-index --check`                                                                                                                                                                                                                                                                                     | Exit 1, empty diagnostics: expected differences, no whitespace errors.                                                                                                                                                                                                                                          |
| Final source/contract/evidence Prettier write/check, document/checklist whitespace and checkbox audit                                                                                                                                                                                                                                           | Prettier write/check and tracked whitespace exit 0; four changed document/checklist no-index whitespace checks exit 1 with empty diagnostics (expected differences). Static checklist/field-list audit exit 0: exactly one new completed prerequisite, prior states preserved and fixed wire section unchanged. |
| Tests created/run                                                                                                                                                                                                                                                                                                                               | **0/0**, intentionally separate checkboxes. No runtime parser/fake/native/storage/transport invocation.                                                                                                                                                                                                         |
| Repo full lint/tests, SDK/parity/security/Cue gates                                                                                                                                                                                                                                                                                             | Not run in this source task; no production readiness claim.                                                                                                                                                                                                                                                     |

## Limits, checkout and execution identity

This module confers no authority and has no reader integration or production
caller. Successful display strings remain untrusted, with no parsed sender identity,
MIME/body/attachment/date/size/reference claim. Fresh live account/caller rights
must cover future integrated projection and publication. Unsupported encodings/
placements/messages are rejected; HTML/prompt/routing trust is never inferred.
Initial Cue metadata still excludes subject/sender. Full lifecycle, caller/setup,
SDK/RPC/watch/events/Cue/recovery and mail acceptance remain unfinished.

Fresh `session list --json` and owner/worktree `auto-run-status --agent ... --json`
commands each exited **0**, success true. Execution agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; owner
`0af39dab-3c06-40de-9077-99207660c1e9`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId null.
Both Auto Runs observed `running:false,state:null`; no engine or run ID launched
or inferred. Selected shared receipts `host-02-header-projection-*.json`;
full local identity receipts/log retained. Outcome reported in this execution tab.

Branch `feat/relay-imap-host-20261006`; unchanged HEAD/base/rc merge-base
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No stage/commit/push/PR;
acceptance and gates pending, HOST-05 owns review/conditional PR. Shared main
writes only authorized checklist/evidence/receipts. No install/upstream merge,
live mail/actual secrets/native keyring/storage/socket/login, callback/Discord,
deployment, consult/dispatch, other checkout/plugin changes or later task execution.

# RELAY-IMAP-HOST-02 — authorized header display read only

Completed exactly one new self-contained source prerequisite, added before the
remaining broad account lifecycle task. Full lifecycle and test creation/execution
remain unchecked. Implemented/static-checked only; no mail acceptance,
mock-tested or production-tested claim.

## Actual source and contract outcome

- Changed only `src/main/plugins/mail-account-read.ts`: source snapshot diff
  **+42/-3 = 45 changed lines, one source module**. `readHeaderDisplay` invokes
  the existing authenticated fixed flow and actual consumed header projector
  while its read lease remains active. It returns only the frozen optional
  subject/sender projection. No caller-supplied projector, raw fallback or extra
  wrapper await. Raw `readHeaderBytes` remains host-private and shares the flow.
- Original exact-reference, enabled-account/revision/installation/plugin/dual
  identity/mailbox/independent read rights, captured authority/signal, exact-slot
  LOGIN, EXAMINE UIDVALIDITY, fixed header FETCH and shared budgets remain in one
  implementation. Authority/deadline recheck before/after projection and after
  transport close precedes result transfer in both modes. Parser failures discard
  the display result with fixed errors and owned bytes are erased on all paths;
  existing listener/session/lease finally cleanup remains.
- Updated [[relay-imap-host-contract-20261006]] to describe this internal
  composition and corrected earlier no-integration statements. Extended future
  focused test requirements in HOST-02; tests were not created or executed.
  Existing projection/command/ledger/credential/activity sources and earlier work
  are preserved. Read AGENTS/CLAUDE plugin/Cue/contributing and relevant guide
  docs, searched existing helpers and reused the existing projector rather than
  adding a decoder, permission system, timer, queue or store.

## Exact checks and evidence

All source/check/git cwd:
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Logs, before-snapshots, source/document review patches and identity receipts:
`.maestro/verification/host-02-header-read-projection/`.
Existing absolute tool executables/types only; no install or dependency symlink.

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write
src/main/plugins/mail-account-read.ts`: **exit 0**.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig
--noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck
--target ES2022 --module commonjs --types node --typeRoots
/home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-read.ts`:
  **exit 0**, no diagnostics; imports compile the canonical store/transport/
  credential/activity/projector modules. This is isolated static compilation,
  not a repo/SDK build or type-parity gate.
- `git diff --no-index --numstat <source-before> src/main/plugins/mail-account-read.ts`:
  **exit 1**, expected source differences, +42/-3.
- Source snapshot `git diff --no-index --check`: **exit 1**, empty diagnostics,
  expected differences with no whitespace errors. `git diff --check`: **exit 0**.
- Final scoped source/contract/evidence Prettier write/check, changed-document
  no-index whitespace and task/source audit recorded in `final-checks.log`.
  Formatting and tracked whitespace **exit 0**; four changed-document whitespace
  checks **exit 1**, empty diagnostics (expected differences); static checklist/
  source audit **exit 0**, exactly one new completed prerequisite and prior states
  preserved. These are artifact assertions, not runtime/product tests.
- Product tests created/run: **0/0**, intentionally separate tasks. No parser/
  reader/fake/native/storage/transport runtime invocation. Repo lint/full tests,
  SDK drift/parity/security/build and Cue gates were not run in this source task.
  No normal git gate was bypassed; no stage/commit/push.

## Limits and execution/PR outcome

Future host proof/handle resolution must construct the authority; no trusted
setup/caller minter or public SDK/RPC/event/Cue/production path is available.
Successful display text is untrusted and cannot be zeroized/recalled in JavaScript;
any later external publication requires fresh live invocation/account checks,
especially after a consumer await. The initial Cue payload still excludes
subject/sender. Body/attachments/MIME, page/search DTOs, watch/checkpoints, durable
recovery, production lifecycle and full acceptance remain unfinished.

Fresh CLI commands (each **exit 0**, success true): `tab show
5262895a-6b3d-43fa-92cc-17449cdfa06f --json`, and `auto-run-status --agent <id>
--json` for owner/worktree. Owner **0af39dab-3c06-40de-9077-99207660c1e9**;
execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**;
execution tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**;
provider agentSessionId **null**. Both Auto Runs **running:false,state:null**;
no engine, launch or run ID started/observed/inferred. Identity receipts/logs
retained locally and selected receipts mirrored to the shared evidence directory.
This outcome is reported in the execution tab, with no callback or dispatch.

Branch **feat/relay-imap-host-20261006**; unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. Commit/PR: **none**;
implementation acceptance and normal gates remain pending, and HOST-05 owns
review/conditional commit/PR. No install, upstream merge, native/keyring/actual
secret retrieval, storage backend, real socket/mail/provider/login, deployment,
callback, Discord, other checkout/plugin edits or later checkbox execution.
Only authorized playbook/evidence files were written in the main checkout.

# RELAY-IMAP-HOST-02 — authorized UID reference search only

Completed one self-contained source prerequisite split from the broad lifecycle
task, which remains unchecked. Implemented/static-checked only; no mock-tested,
mail acceptance or production-tested claim. Related contract:
[[relay-imap-host-contract-20261006]].

## Code outcome and review

Changed only `src/main/plugins/mail-account-read.ts`: **+114/-38 = 152 changed
source lines, one module** against the preserved entry snapshot. Added host-private
`searchReferences` and frozen `MailHeaderSearchResult` by extending one fixed read
flow. Canonical closed criteria parsing and UID/ASCII validators snapshot an
inclusive range and optional expected namespace/header text before I/O. The actual
fixed builder validates the range/grammar before dialing; its temporary bytes
are erased. No second transport, store, authority helper or queue was created.

Search shares the existing enabled account/revision/installation/plugin/dual
identity/mailbox/independent `read` gates, captured host callback/signal/agent,
exact-slot LOGIN and total admission/authentication/lifetime budget. Fresh EXAMINE
establishes UIDVALIDITY; supplied mismatches fail, SEARCH uses that selected
namespace. Actual transport validation caps 1024 unique in-range UIDs and sorts
numerically. Each frozen output reference contains only accountId, accountRevision,
mailbox, uidValidity and uid; the frozen result includes UIDVALIDITY even when
empty. No truncation, cursor, content, search text or readiness is returned.

Source diff review traced both old header modes through their original gates,
exact-reference FETCH/consumed display branches and buffer-erasure cleanup. All
three modes keep the lease through projection and close, with live callback,
cancellation and monotonic deadline checks after async work and after synchronous
projection/transport cleanup before transfer. Frozen snapshots cannot be changed
by mutating criteria across awaits. Canonical revoke/disable/remove/policy and
persistence invalidation still close actual readers. Safe errors strip foreign
error content. Subsequent reads and external publication need fresh authority;
returned identifiers are historical observations, not a stable mailbox snapshot.

Read required local instructions and relevant utility/plugin/agent guides;
searched existing implementations and reused closed parsing, command builders,
credential/session and authorization/activity code. Contract documents exact
internal shapes, supported grammar/bounds and limitations. Extended the separate
future test-creation checkbox without creating or running product tests. Earlier
source work and other checkbox states are preserved.

## Exact verification

All code/check/git cwd: `/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Existing executables/types were used by absolute path; no dependency installation,
shared dependency mutation or node_modules symlink. Before snapshots, exact
argv/output/exits, review patches and CLI identity receipts are saved under
`.maestro/verification/host-02-reference-search/`.

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write
src/main/plugins/mail-account-read.ts`: **exit 0**.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig
--noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck
--target ES2022 --module commonjs --types node --typeRoots
/home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-read.ts`:
  **exit 0**, no diagnostics. Isolated static compilation includes imported
  canonical modules; not a repo/SDK build or parity gate.
- `git diff --check`: **exit 0**. Source snapshot `git diff --no-index --numstat`:
  **exit 1**, expected differences, +114/-38. Source snapshot `--check`:
  **exit 1**, empty diagnostics; differences with no whitespace errors.
- Final scoped source/contract/local-evidence Prettier write/check and tracked
  whitespace checks: **exit 0**. Source/document/playbook no-index whitespace:
  **exit 1**, empty diagnostics (expected differences). Static artifact/checklist
  audit: **exit 0**, one new completed source prerequisite, prior states retained,
  broad lifecycle/tests still unchecked. Exact logs: `source-checks.log` and
  `final-checks.log`; these checks do not execute runtime/product tests.
- Product tests created/run: **0/0** by the source task's explicit separation.
  No reader/parser/fake/native/storage/TLS runtime invocation. Repo full lint/tests,
  SDK drift/type/security/build and Cue gates were not run in this source task.

## Identity, git/PR and remaining work

Fresh CLI `tab show 5262895a-6b3d-43fa-92cc-17449cdfa06f --json` and owner/worktree
`auto-run-status --agent <id> --json`: each **exit 0**, success true. Execution
agent **228eef8c-75a8-46e8-bb67-2903da23bc06**; owner
**0af39dab-3c06-40de-9077-99207660c1e9**; execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider agentSessionId **null**.
Both Auto Runs observed **running:false,state:null**. No launch/run ID observed,
started or inferred. Selected `host-02-reference-search-*.json` receipts mirrored
to shared playbook evidence. Outcome reported in this execution tab.

Branch **feat/relay-imap-host-20261006**; unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **No stage/commit/push/PR**:
acceptance and normal gates pending; HOST-05 owns review/conditional PR. Trusted
setup/caller proof/handles, public header pages/search DTOs, MIME body/attachments,
lifecycle recovery/cleanup orchestration, monitors/checkpoints/dedupe, SDK/RPC,
events/Cue and production wiring remain unfinished. No Backstage coordination
was needed for this host-private seam and none was sent; earlier handoff evidence
remains unchanged. No install, upstream merge, secret/native backend retrieval,
live mail/provider/login, deployment, callback, Discord or other checkout/plugin
edits. Main-checkout writes only authorized checklist/evidence/identity receipts.

# RELAY-IMAP-HOST-02 — authorized complete-message source retrieval only

Completed exactly one bounded source prerequisite split from the still-unchecked
full account lifecycle task. Implemented/static-checked only, with no mock-tested,
production-tested or broader mail acceptance claim. Related contract:
[[relay-imap-host-contract-20261006]].

## Code and review outcome

Only `src/main/plugins/mail-account-read.ts` changed: **+27/-7 = 34 changed source
lines, one module**, compared with the preserved entry snapshot. Added
`MailAccountHeaderReader.readMessageSourceBytes(reference, authority)` through
the existing private fixed flow. Reused canonical closed reference/revision/UID/
mailbox parsing, configured TLS, exact credential-slot LOGIN, READ-ONLY EXAMINE,
fixed-command builder/semantic validator, store/lease cancellation and original
10-second authentication/30-second lifetime budgets. No utility/parser/store/
queue/type/constant/transport was duplicated.

The source mode requires independent `detail` rights on the exact enabled account
revision/installation/plugin/dual identity/agent/configured mailbox. Existing
header/search modes retain `read`; `read` or `attachments` alone cannot admit a
source read. The required UIDVALIDITY gates EXAMINE, then the canonical command
fetches exact UID `BODY.PEEK[]` only. Allocation is bounded by the transport's
24 MiB literal and 25 MiB aggregate wire ceilings; the reader's defensive check
uses the canonical source ceiling. No partial/truncated success, custom section,
command, endpoint or generic callback is exposed.

Source diff review traced the same captured mandatory host authority/signal/agent,
closed frozen request/command across awaits, live canonical policy checks and
byte ownership before callbacks. Lease spans synchronous close and final
post-close authority/deadline checks. Rejected/late bytes are erased; successful
bytes transfer to trusted host code, with terminal listener/session/lease cleanup.
Header bytes/display projection/search branches keep their prior grammar, limits
and rights. No production caller/proof/setup/SDK/RPC/events/Cue/MIME path was added.

Raw complete MIME can contain attachments and must never reach plugins or public
SDK/RPC/log/event/Cue boundaries. Later detail-only host projection must exclude
attachment content, separately gate attachments, erase consumed source and check
fresh authority at any later publication/await. Already transferred bytes cannot
be recalled. This source seam proves neither MIME validity nor readiness. Updated
the contract and deferred focused test requirements; full lifecycle, MIME/DTOs,
attachment operations, monitors/checkpoints and all tests remain unchecked.

## Exact verification

All source/check/git cwd: `/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Existing tools/types used by absolute path with no dependency install, symlink or
shared dependency mutation. Entry snapshots, exact argv/stdout/stderr/exits,
source patch and identity receipts are saved in
`.maestro/verification/host-02-message-source/`.

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write
src/main/plugins/mail-account-read.ts`: **exit 0**.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig
--noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck
--target ES2022 --module commonjs --types node --typeRoots
/home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-read.ts`:
  **exit 0**, no diagnostics. Isolated static compile includes imported modules;
  not a full repository/SDK build or parity gate.
- `git diff --check`: **exit 0**. Snapshot `git diff --no-index --numstat` and
  source patch: **exit 1**, expected differences, +27/-7. Snapshot `--check`:
  **exit 1**, empty diagnostics (differences, no whitespace errors).
- Final scoped Prettier source/contract/local-evidence formatting/check, all
  changed-file snapshot whitespace checks, source/change-budget/checklist audit
  and exact commands/exits are recorded in `final-checks.json` and
  `artifact-audit.json`. Final outcomes are appended after verification below.
- Product tests created/run: **0/0**, as required by separate source/test creation/
  test execution tasks. No parser/read/fake/native/keyring/storage/TLS runtime
  invocation. Repo full lint/test, SDK/security/drift/build and Cue gates not run.

## Execution identity and git/PR

Fresh CLI `tab show 5262895a-6b3d-43fa-92cc-17449cdfa06f --json`, and
`auto-run-status --agent <id> --json` for owner/worktree each returned **exit 0**,
success true. Execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**;
owner **0af39dab-3c06-40de-9077-99207660c1e9**; execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider agentSessionId **null**.
Both Auto Runs observed **running:false,state:null**. No engine/launch/run ID
started, observed or inferred. Exact receipts: `identity-checks.json`, with selected
`host-02-message-source-*.json` receipts mirrored to shared playbook evidence.
Outcome reported in this execution tab with no callback/dispatch/Discord.

Branch **feat/relay-imap-host-20261006**; unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **No stage/commit/push/PR**:
full acceptance and normal gates pending; HOST-05 owns review/conditional PR.
No installs, upstream merges, actual credential/native backend/storage access,
real socket/mail/provider/login, deployment, other checkout/plugin writes or later
checkbox execution. Prior work preserved; main writes restricted to the authorized
playbook/evidence/receipt directory.

Final verification: scoped source/contract/local-evidence Prettier write/check
and tracked whitespace **exit 0**. All five changed-file snapshot no-index
whitespace checks **exit 1**, expected differences with empty diagnostics.
Static source budget/document/checklist audit **exit 0**; exactly one newly split
prerequisite is complete, every prior checkbox state is preserved, broader
lifecycle/tests remain unchecked. Source remains +27/-7. Product tests **0/0**;
no runtime/mock/native/provider acceptance or commit/PR claimed.

# RELAY-IMAP-HOST-02 — bounded MIME transfer-byte decoding only (2026-10-07)

Completed exactly one newly split source prerequisite before the unfinished broad
account lifecycle checkbox. Added `src/main/plugins/mail-transfer-decoding.ts`
**+188/-0** and changed `src/main/plugins/mail-header-projection.ts` **+3/-4**:
**195 changed source lines, two modules** relative to this context's snapshots.
All prior source changes were preserved; no other source/test file edited.

The synchronous consumer accepts complete owned encoded bytes with a required
positive tighten-only cap <=8 MiB and canonical 24 MiB input bound. Strict 7bit/
8bit identity validation, CRLF-wrapped canonical base64 and two-pass bounded
quoted-printable decoding return host-owned bytes. Exact line/count/size checks
precede decoded allocation; padding/pad bits/escapes/truncation/unsupported forms
reject with fixed errors. Input and allocated rejected output are erased; successful
output must be erased by its host recipient. Shared linear base64 validation replaces
the header B branch's repeated regex/round-trip check while preserving its encoded
word grammar and bounds. QP underscores/hard/soft breaks differ explicitly from
unchanged header Q semantics. Static review covered allocation ordering, pad bits,
physical lines, ownership and exception normalization against RFC 2045
https://www.rfc-editor.org/rfc/rfc2045; runtime behavior remains untested.

Contract now states the exact strict subset, bounds, JavaScript string/alias
limitations and unfinished aggregate/charset/MIME/authorized composition. Deferred
focused test creation was expanded. No MIME header/structure/text/body/attachment
DTO, account reader integration, verified caller/setup, SDK/RPC/event/Cue or
production path added. This standalone helper cannot supervise live authorization
or elapsed deadlines: later integration must hold/recheck the original read lease
and operation budget and enforce aggregate/independent rights. Implemented/static-
checked only; mock-tested and production-tested false, broad acceptance unsatisfied.

## Exact verification and execution outcomes

All code/git/verification commands used cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`; existing absolute tools
were reused without installation, symlink or shared dependency writes. Full argv,
exits/stdout/stderr and source/document snapshots/patches are in
`.maestro/verification/host-02-transfer-decoding/`.

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-transfer-decoding.ts src/main/plugins/mail-header-projection.ts`:
  **exit 0**.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-transfer-decoding.ts src/main/plugins/mail-header-projection.ts src/main/plugins/mail-account-read.ts`:
  **exit 0**, no diagnostics; isolated strict source check, not repository lint.
- `git diff --check`: **exit 0**. Source snapshot `git diff --no-index --numstat`
  and patch commands: **exit 1**, expected differences, +188/-0 and +3/-4.
  Snapshot `--check`: **exit 1**, empty diagnostics; no whitespace errors.
- Product tests created/run **0/0**: explicitly separate later tasks. No runtime
  fake TLS/native/keyring/storage invocation. Repo/SDK/security/Cue suites/gates
  not executed. Final scoped formatting/document/checklist verification is recorded
  below after execution, without claiming unrun tests.

CLI session list and owner/worktree Auto Run status queries each **exit 0**,
success true. Owner `0af39dab-3c06-40de-9077-99207660c1e9`; execution agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; exact observed execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`, provider agentSessionId null. Both Auto
Runs `running:false,state:null`; no engine/launch/run ID observed or inferred.
Shared selected receipts: `host-02-transfer-decoding-*.json`; detailed identity
query argv/exits in local `identity-checks.json` and original JSON receipts.

Branch `feat/relay-imap-host-20261006`; unchanged HEAD/base/rc merge-base
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No stage/commit/push/PR:
full acceptance and required gates remain unfinished, with conditional review/PR
assigned to HOST-05. No install, upstream merge, live mail/provider/login, actual
secret retrieval, deployment, callbacks, Discord, consult/dispatch or other
checkout/plugin changes. Main-checkout writes only authorized shared playbook
checklist/evidence/identity receipts. Exact outcome reported in the execution tab.

Final verification: scoped source/contract/local-evidence Prettier write/check and
tracked whitespace **exit 0**. All six changed-file snapshot no-index whitespace
checks **exit 1**, expected differences with empty diagnostics. Static source/
document/checklist audit **exit 0**: two source modules, **195 changed source lines**,
exactly one newly split prerequisite completed and every prior checkbox state
preserved. Broader lifecycle and all test tasks remain unchecked. Product tests
**0/0**, no mock/production acceptance or commit/PR. Full commands/exits and patches
are saved in the host worktree `.maestro/verification/host-02-transfer-decoding/`.

# RELAY-IMAP-HOST-02 — bounded plain-text charset decoding only (2026-10-07)

Completed exactly one newly split source prerequisite before the unfinished broad
account lifecycle task. Added `src/main/plugins/mail-text-decoding.ts` **+91/-0**
and changed `src/main/plugins/mail-header-projection.ts` **+4/-17** relative to
this context's snapshots: **112 changed source lines, two modules**. Existing
source changes were preserved; no other source/test file edited.

The host-private consumer accepts complete already-transfer-decoded owned plain
text, explicit exact case-insensitive UTF-8/US-ASCII and a required positive
safe-integer tighten-only cap <=256 KiB. Input/output byte bounds precede text
construction; fatal UTF-8, ASCII high-byte rejection and strict Unicode character
policy refuse malformed/unsupported text without repair or partial success.
CRLF/HTAB/spacing/final ordinary lines remain intact; BOM, other controls,
formatting/bidi, surrogates/line separators and bare CR/LF reject. Consumed bytes
are erased on all outcomes; errors are content-free without original causes.

Extracted the existing header projector's charset and character policy into the
same module rather than duplicate it. Shared non-consuming core retains true
Latin-1 for bounded header use, counting UTF-8 expansion before construction;
plain-body consumption excludes it. Existing RFC 2047 B/Q grammar, field list,
word/display limits and buffer erasure remain unchanged by static inspection.
JavaScript strings/aliases cannot be recalled or zeroized; output remains untrusted
literal text. Reviewed canonical CRLF and strict UTF-8 semantics against RFC 2046
section 4.1.1 / RFC 3629 sections 3/4; links and the deliberate strict subset are
in the contract. Reuse search covered shared utility guides, plugin modules and
existing TextDecoder callers; unrelated permissive decoders were unsuitable.

Contract and deferred test-creation requirements now describe this exact source
seam and its obligations. No MIME media-type/header/structure/disposition parsing,
HTML conversion, body/attachment DTO, account-reader integration, live detail
lease/deadline, caller/setup proof, SDK/RPC/event/Cue/watch/checkpoint or production
path was added. Future composition must validate complete plain-body selection,
exclude attachments, enforce aggregate limits, hold the original independent detail
lease/deadline through parsing/decoding/close/final checks and reauthorize publication.
Implemented/static-checked only; mock-tested and production-tested false; full
account/feature acceptance remains unfinished.

## Exact verification and execution outcomes

All source/git/verification commands used cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Existing absolute
Prettier/TypeScript tools reused read-only; no installation, symlink or shared
dependency write. Full argv/exits/output, before snapshots and source patches:
`.maestro/verification/host-02-text-decoding/`.

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-text-decoding.ts src/main/plugins/mail-header-projection.ts`:
  **exit 0**.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-text-decoding.ts src/main/plugins/mail-header-projection.ts src/main/plugins/mail-account-read.ts`:
  **exit 0**, no diagnostics; isolated strict check, not repository lint.
- `git diff --check`: **exit 0**. Source snapshot no-index numstat/patch:
  **exit 1**, expected differences (+91/-0, +4/-17). Both no-index whitespace
  checks: **exit 1**, empty diagnostics; no whitespace errors.
- Product tests created/run **0/0**, explicitly deferred by this source checkbox.
  No runtime decoder, fake/native backend, keyring/storage/TLS/login invoked.
  Repo/SDK/security/Cue suites and feature gates remain unrun later tasks.

Fresh CLI session list and owner/worktree Auto Run queries: each **exit 0**,
success true. Owner `0af39dab-3c06-40de-9077-99207660c1e9`; execution agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; observed execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`, provider agentSessionId null. Both Auto
Runs `running:false,state:null`; no launch/engine/run ID observed or inferred.
Selected shared identity receipts `host-02-text-decoding-*.json`; full commands,
exits and selected responses in local identity checks.

Branch `feat/relay-imap-host-20261006`; unchanged HEAD/base/rc merge-base
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. **No stage/commit/push/PR**:
full acceptance and normal gates pending; HOST-05 owns review/conditional PR.
No upstream merge, installs, live mail/provider/credentials/login, callbacks,
Discord, deployment, consult/dispatch, other checkout/plugin writes or later
checkbox execution. Only shared checklist/evidence/selected receipt writes in
the authorized main-checkout playbook directory. Exact outcomes reported in the
execution tab; final scoped formatting/whitespace/static audit recorded below.

Final verification: scoped source/contract/local-evidence formatting **exit 0**;
tracked whitespace **exit 0**. All six changed-file snapshot no-index whitespace
checks **exit 1**, expected differences with empty diagnostics. Static source/
document/checklist audit **exit 0**: two source modules, **112 changed source
lines**, exactly one newly split prerequisite completed; every prior task state
preserved. Full lifecycle and test tasks remain unchecked. Product tests **0/0**;
no mock/production acceptance, commit or PR. Detailed commands/patches/receipts
are saved in the worktree `.maestro/verification/host-02-text-decoding/`.

# RELAY-IMAP-HOST-02 — bounded MIME header descriptors only (2026-10-07)

Completed one newly split source prerequisite before the unfinished broad account
lifecycle task. Added `src/main/plugins/mail-header-fields.ts` **+65/-0** and
`src/main/plugins/mail-mime-headers.ts` **+213/-0**; changed
`src/main/plugins/mail-header-projection.ts` **+7/-44** relative to entry snapshots:
**329 changed source lines, three modules**. Existing changes preserved; no other
source/test file edited. Shared playbook now records the prerequisite and extends
its existing deferred test-creation requirements; no later task executed.

Extracted the existing header projector's exact bounded ASCII/CRLF/folding scanner
rather than duplicate it. Display retains the fixed FETCH allowlist, encoded-word
B/Q/charset/display rules, duplicate/unknown denial and consumed-byte erasure by
static comparison. The shared non-consuming scanner validates field names and
all selected/discarded fields, including line/count/unfolded/block budgets; MIME
can discard ordinary repeated Received fields while rejecting duplicate selected
fields and unknown Content-\* headers.

The new consuming MIME-header seam returns a frozen closed host-private descriptor
only. It requires explicit supported media type, handles bounded token/quoted
parameters, UTF-8/US-ASCII plain-text charset (default US-ASCII), strict supported
transfer tokens (default 7bit), optional part MIME-Version exactly 1.0, exact
1-70-byte bchars multipart boundaries and independent leaf disposition/filename
labels. Unknown/comments/extended/RFC 2231 or RFC 2047 parameter syntax, HTML,
message/\*, unsupported encodings/charsets/versions, unsafe labels and conflicting
name/filename aliases reject. Multipart encoding must be 7bit/8bit; disposition
or names on multipart reject. Input bytes erase on all outcomes and errors contain
only fixed codes/messages without native/peer causes. No repair/truncation,
percent decoding, filename path/saving authority or media-content validation.

Reviewed RFC 2045 sections 4/5/6, RFC 2046 sections 4.1.2/5.1.1 and RFC 2183
section 2 using RFC Editor primary sources; the contract links them and describes
the deliberate strict interoperability limits, defaults and future root-version
policy. Canonical guide/source search covered existing header/charset/transfer
helpers and shared utilities; no existing mail MIME header parser was found.
No new dependency, queue, permission/task system or generic socket surface.

No MIME source splitting/traversal, body selection, transfer/text invocation,
attachment/body DTO, manifest/count/size inference, account-reader integration,
original detail/attachments lease/deadline composition, caller/setup proof,
SDK/RPC/event/Cue/watch/checkpoint or production path was added. Future actual
composition must exclude attachment-marked or named leaves from detail, enforce
structure/aggregate bounds, validate complete bytes and keep original live rights
and deadline through parsing/decoding/close/final checks with fresh publication
authorization. Strings/aliases cannot be zeroized or recalled; descriptors and
raw fields cannot be logged/persisted/forwarded as arbitrary event payloads.
Implemented/static-checked only; **mock-tested false, production-tested false**.
Full lifecycle and feature acceptance remain unfinished.

## Exact verification and execution outcomes

All source/git/verification commands used cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Existing absolute
Prettier/TypeScript tools reused read-only, with no installation, symlink or shared
dependency mutation. Command argv/exits/output, entry snapshots, source/document
patches and identity receipts are in `.maestro/verification/host-02-mime-headers/`.

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-header-fields.ts src/main/plugins/mail-header-projection.ts src/main/plugins/mail-mime-headers.ts docs/relay-imap-host-contract-20261006.md`:
  **exit 0**.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-header-fields.ts src/main/plugins/mail-header-projection.ts src/main/plugins/mail-mime-headers.ts src/main/plugins/mail-account-read.ts`:
  **exit 0**, no diagnostics. Isolated strict source check, not repository lint.
- Initial tracked `git diff --check`: **exit 0**. Entry snapshot source
  no-index numstat/patch/whitespace: **exit 1**, expected differences;
  whitespace diagnostics empty. Final audit recorded below after execution.
- Product tests created/run **0/0**, explicitly deferred by this source checkbox.
  No runtime parser, fake/native backend, keyring/storage/TLS/login invoked.
  Repository/SDK/security/Cue suites and feature gates remain later tasks.

Fresh CLI session list and owner/worktree Auto Run queries: each **exit 0**,
success true. Owner **0af39dab-3c06-40de-9077-99207660c1e9**, execution agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**, observed execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider agentSessionId null.
Both Auto Runs `running:false,state:null`; **no launch/engine/run ID** observed
or inferred. CLI cache redirected to this worktree's verification directory.
Selected shared identity receipts: `host-02-mime-headers-*.json`.

Branch `feat/relay-imap-host-20261006`; unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **No stage/commit/push/PR**:
full acceptance and normal gates pending; HOST-05 owns review/conditional PR.
No upstream merge, installs, live mail/provider/login/actual credentials,
callbacks, Discord, deployment, consult/dispatch, other checkout/plugin writes
or later checkbox execution. Only shared checklist/evidence/selected identity
receipts written in the authorized main-checkout playbook directory. Exact code,
static/test and PR outcomes reported in the execution tab.

Final verification: scoped source/contract/local-evidence formatting and tracked
whitespace **exit 0**; all seven changed-file snapshot whitespace checks **exit 1**
(expected differences), empty diagnostics. Scoped static audit **exit 0**:
three source modules, **329 changed source lines**, exactly one new prerequisite
completed, all prior checkbox states and RFC 2047/charset/display function bodies
preserved. Product tests **0/0**; no mock/production acceptance or commit/PR.
Initial full-status audit **exit 1** because unrelated new
`docs/relay-imap-host-backstage-needs-20261007.md` appeared during this task.
It was read only and left untouched; corrected source-scoped audit records that
concurrent document separately rather than claiming ownership. Detailed commands,
patches and both initial/corrected audit receipts remain in the host worktree
`.maestro/verification/host-02-mime-headers/`.

# HOST-02 MIME source splitting and traversal prerequisite — 2026-10-07

Completed one newly split source prerequisite ahead of the oversized lifecycle
checkbox, as the playbook permits. Full lifecycle and all pre-existing unchecked
tasks remain unfinished. Source changes in this context: `mail-mime-structure.ts`
(**153 added lines**) and `mail-mime-headers.ts` (**8 added / 2 removed**),
**163 changed source lines across two modules**. Entry snapshots and patches
measure this context independently of the branch's pre-existing uncommitted work.

## Implemented behavior and limits

Added a synchronous consuming complete-source parser with frozen closed tree
shells and ordered children, bounded header splitting, exact recursive mixed/
alternative delimiters and complete validation of every supported leaf before
allocation. Reused canonical source/header bounds and the actual header descriptor;
its optional trusted root-version flag preserves default part behavior, requires
MIME-Version 1.0 in traversal, and rejects nonboolean flag shapes. No second header
syntax parser, store, permission engine or dispatch system.

24 MiB complete source/encoded leaves, depth 16 (root/leaf count), 64 nodes,
32 leaves, 256 KiB aggregate headers, 384 MiB charged visited-entity spans before
scan. Header search itself is bounded to 64 KiB; delimiter search stays inside
its entity and advances monotonically. No preamble/epilogue, padding, equal/
prefix ancestor boundaries, empty multipart, unsupported child or partial success.
Closing EOF or exact CRLF is allowed. Delimiter CRLF is excluded from child data;
empty child bodies and final content CRLF require distinct framing. This is a
strict subset, documented with RFC 2045/2046 links in the contract, not broad MIME
compatibility or validated leaf content. Declared encoding is not byte proof.

Every consumed source/header copy/boundary marker is erased in finally. Full
structural validation precedes leaf copies; failed materialization erases all
tracked output buffers. Success transfers distinct mutable encoded leaf ownership
to the trusted caller; frozen shells do not freeze Buffer bytes or erase strings.
All errors are recreated fixed MAIL_INVALID/LIMIT/PROTOCOL without cause/content.
No transfer/text invocation, selection, attachment manifest/body DTO, media-content
validation, authorized reader integration, SDK/RPC/event/Cue/setup/caller or
production path. Original independent lease/deadline and fresh later publication
authorization remain mandatory integration obligations. Contract and deferred
focused test requirements updated. **Implemented/static-checked only; mock-tested
false; production-tested false.**

## Verification and exact execution outcomes

Every source/git/check command used cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Existing absolute
Prettier/TypeScript tools reused read-only; no install/symlink/dependency mutation.
Exact argv/exits/output, entry snapshots and patches are in
`.maestro/verification/host-02-mime-structure/`.

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-mime-headers.ts src/main/plugins/mail-mime-structure.ts`: **exit 0**.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-mime-headers.ts src/main/plugins/mail-mime-structure.ts src/main/plugins/mail-account-read.ts`: **exit 0**, no diagnostics. Isolated strict source check, not repository lint or feature acceptance.
- Initial tracked `git diff --check`: **exit 0**. Both source snapshot no-index patch/numstat/whitespace commands: **exit 1**, expected differences; whitespace diagnostics empty.
- Product tests created/run **0/0**, deferred by the selected source checkbox. No parser runtime, synthetic backend, native keyring/storage/TLS/mail login invoked. Repository/SDK/security/Cue suites, builds and feature gates remain later tasks.

Fresh `maestro-cli session list --json` and owner/worktree `auto-run-status`
queries: each **exit 0**, success true. CLI compilation cache redirected into this
worktree's verification folder. Owner `0af39dab-3c06-40de-9077-99207660c1e9`,
execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, exact observed execution
tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider agentSessionId
null. Both Auto Runs **running:false,state:null**; **no engine/launch/run ID**
observed or inferred. No dispatch/consult/callback used. Selected shared receipts:
`host-02-mime-structure-*.json`.

Branch `feat/relay-imap-host-20261006`; unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **No stage/commit/push/PR**;
full acceptance and normal gates pending, conditional PR reserved for HOST-05.
No install/upstream merge/live mail/provider login/actual credentials/callbacks/
Discord/deployment/other-checkout or plugin writes. Only shared playbook evidence
and selected identity receipts written outside the registered worktree. Final
formatting/document/scope verification recorded below after execution. Exact code,
static/test and PR outcomes reported in the execution tab.

Final verification: scoped source/contract/local-evidence formatting and tracked
whitespace **exit 0**. Static scope audit **exit 0**: **two source modules,
163 changed source lines**, exactly one new prerequisite checked; all prior
checkbox states and prior tracked/untracked status entries preserved. HEAD and
rc merge-base unchanged. Six changed-file snapshot patch/numstat/whitespace
checks **exit 1**, expected differences, empty whitespace diagnostics. Product
tests **0/0**; no runtime/mock/production acceptance, stage/commit/push/PR.
All command receipts, snapshots and patches are in
`.maestro/verification/host-02-mime-structure/` in the registered host worktree.

# HOST-02 MIME content composition prerequisite — 2026-10-07

Completed one newly split bounded source prerequisite before the oversized lifecycle
checkbox. Original lifecycle and all later unchecked tasks remain unfinished.
Added only `src/main/plugins/mail-mime-content.ts`: **147 added source lines**, one
module, no changes to preexisting source/test files. Contract and deferred focused
coverage updated; tests remain separate. **Implemented/static-checked only**;
mock-tested false, production-tested false, full feature acceptance unmet.

Actual consuming composition uses complete-source traversal, transfer-byte decoder
and plain-text consumer. Excludes all named/attachment-marked/nontext leaves from
body, checks every body alternative and selects the last body-only alternative;
mixed refuses multiple independent bodies. Frozen closed body/attachment results,
complete decoded sizes, unique physical numeric private part IDs and fixed absent
filename `attachment`. 256 KiB aggregate body candidates, 16 attachments, 8 MiB
each/16 MiB aggregate before decoded allocation; existing raw/structure bounds
unchanged. Source/encoded/body temporaries erased on all paths, failed attachment
allocations erased; successful owned mutable attachment Buffers require caller
cleanup. JavaScript strings cannot be zeroized. Declared MIME is not binary file
format verification; text attachments stay opaque bytes. Original independent
lease/deadline and fresh publication authorization are still future obligations.
No reader/public DTO/chunk/snapshot/RPC/SDK/event/Cue/setup/caller or production path.

All command cwd: `/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Receipts/exact argv/exits/stdout/stderr, entry snapshots, patch and selected CLI
identity: `.maestro/verification/host-02-mime-content/`. Existing absolute local
tools reused read-only; no install/symlink/shared dependency mutation.

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-mime-content.ts`: **exit 0**.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-mime-content.ts`: **exit 0**.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-mime-content.ts src/main/plugins/mail-account-read.ts`: **exit 0**, no diagnostics; isolated strict static verification, not repository lint/feature gates.
- `git diff --check`: **exit 0**. New-source `git diff --no-index` patch/numstat/check vs `/dev/null`: **exit 1** expected differences; whitespace output empty, numstat 147 additions/0 removals.
- Product tests created/run **0/0**; no parser or injected fake backend runtime, native keyring/storage/TLS/login invoked. Normal repository/SDK/security/Cue gates remain HOST-05, no bypass.
- Read-only discovery `rg` including a nonexistent `src/main/agent-run-store.ts` path: **exit 2** (path error); corrected with actual `agent-run list` CLI. No code/gate failure.

Fresh `session list --json`, `agent-run list --limit 20 --json` and owner/worktree
`auto-run-status --json`: all **exit 0**, success true. CLI compile cache redirected
inside this worktree. Owner **0af39dab-3c06-40de-9077-99207660c1e9**; execution agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**; CLI-observed tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider agentSessionId null.
AgentRun registry observes this source-task run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791331149760:1791331150079:gdz5dn** as
**running**, spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791331149760**. Auto Run status API reports
running:false/state:null despite registry progress; do not relaunch. Original
launch receipt is shared `LAUNCH.json`, initial run
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i`.
No launch/run/tab IDs invented, engine launched or completion callback used.

Branch `feat/relay-imap-host-20261006`, unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **No stage/commit/push/PR**;
conditional review/PR remains HOST-05 because production integration, focused
runtime security acceptance and normal gates are unfinished. No consult/dispatch,
upstream merge/install/live mail/actual credentials/callback/Discord/deployment,
other-checkout/plugin/source/test writes. Only authorized shared playbook evidence
and checklist outside this worktree. Existing coordination docs were read only.

Final document-format/snapshot/scope verification is recorded below after checking;
only this new source prerequisite may be marked complete. Execution-tab response
reports exact code/static-test/PR outcomes and observed identifiers.

Final verification: source/contract/local-evidence Prettier check and tracked
whitespace **exit 0**. All five changed-file snapshot patch/numstat/whitespace
commands **exit 1** expected differences, whitespace diagnostics empty. Static
scope audit **exit 0**: one source module, **147 added source lines**, exactly one
new prerequisite completed; all **25** prior checkbox states preserved. Prior Git
status entries preserved with only new `mail-mime-content.ts` added; HEAD/base
unchanged. Product tests **0/0**, no runtime/mock/production acceptance, no commit/PR.
Exact checks/patches and CLI identity in `.maestro/verification/host-02-mime-content/`.

# HOST-02 authorized plain-text body read prerequisite — 2026-10-07

Completed one newly split source prerequisite before the oversized lifecycle
checkbox. Changed only `src/main/plugins/mail-account-read.ts`: **44 added / 8
removed source lines**, **52 changed lines**, one module measured against its
entry snapshot. Preexisting uncommitted source/test changes preserved. Original
lifecycle, attachment/public integration and all test tasks remain unchecked.

`MailAccountHeaderReader.readMessageBody` reuses actual complete-source MIME,
transfer and plain-text composition and its existing body type. It requires
independent detail rights with unchanged exact closed reference, account revision,
installation/plugin/dual identity, configured mailbox/UIDVALIDITY/UID and mandatory
captured host callback/signal/agent gates. Fixed LOGIN/READ-ONLY EXAMINE/UID
BODY.PEEK[] retain the original admission/authentication/30s lifetime budgets.
The existing lease covers parsing, attachment erasure, synchronous close and final
live authority/deadline checks. Frozen closed optional-body-only results distinguish
absent body from complete empty text and retain complete UTF-8 sizes. No attachment
bytes/descriptors or raw fallback; every successful decoded attachment erased
before subsequent callbacks/close/transfer, failed allocations erased by consumer.
Whole-source validation uses unchanged strict MIME/structure/aggregate bounds.
Strings cannot be zeroized/recalled; synchronous work is bounded and elapsed time
checked after it. Fresh authority remains required for later publication.

Contract and deferred actual-composition test requirements updated. **Implemented/
static-checked only; mock-tested false; production-tested false.** No public DTO,
RPC/SDK/version/capability/snapshot/chunk/manifest/event/Cue/setup/caller proof or
production account path. Full feature acceptance remains unmet. No parser, store,
queue, timeout or permission utility duplicated; canonical guide/source search and
actual fixed read/ledger/activity/content composition inspected before edits.

## Exact verification and execution outcomes

All source/git/check commands used cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Existing absolute Prettier and
TypeScript tools reused read-only, no dependency installation/mutation or symlink.
Exact argv/exits/stdout/stderr, entry snapshots, patches and selected CLI identity:
`.maestro/verification/host-02-body-read/` in the registered worktree.

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-read.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-read.ts
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-read.ts src/main/plugins/mail-mime-content.ts
git diff --check
```

Each **exit 0**, no type/whitespace diagnostics. Isolated strict static verification,
not repository lint or runtime acceptance. Source snapshot no-index patch/numstat/
whitespace each **exit 1**, expected differences with empty whitespace diagnostics.
**Product tests created/run 0/0**, explicitly deferred by the selected source
checkbox. No parser runtime, synthetic backend or native keyring/storage/TLS/login
invoked. Repository/SDK/security/Cue normal gates/builds remain HOST-05, no bypass.
Read-only exploratory `rg` named two absent paths (`src/main/mcp-server.ts` and
`src/main/plugins/plugin-tool-router.ts`); actual CLI MCP paths were discovered and
inspected. These were discovery path errors, not implementation/test failures.

Fresh CLI `session list --json`, `agent-run list --limit 20 --json` and owner/worktree
`auto-run-status --json` all **exit 0**, success true, with compilation cache inside
this verification folder. Owner **0af39dab-3c06-40de-9077-99207660c1e9**; execution
agent **228eef8c-75a8-46e8-bb67-2903da23bc06**; CLI-observed tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider agentSessionId null.
AgentRun registry observed this source-task run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791331469802:1791331470424:k61l86** as **running**,
spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791331469802**. Both Auto Run status APIs report
running:false/state:null despite registry progress; do not relaunch. Original
launch receipt is shared `LAUNCH.json`, initial run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**.
No run/tab/launch ID inferred, new engine/consult/dispatch or callback used.
Selected shared identity receipts: `host-02-body-read-*.json`.

Branch `feat/relay-imap-host-20261006`; unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **No stage/commit/push/PR**:
production wiring, runtime security acceptance and normal gates unfinished;
conditional review/PR remains HOST-05. No upstream merge/install/live mail/actual
credentials/callback/Discord/deployment/other-checkout/plugin writes. Only shared
playbook checklist/evidence/selected identity receipts written outside this worktree.
Exact code/static/test/PR outcomes reported in this execution tab. Final scoped
formatting/snapshot/checkbox/source-hash audit recorded below after verification.

Final verification: scoped source/contract/local-evidence formatting and tracked
whitespace **exit 0**. Static scope audit **exit 0**: one source module, **52 changed
source lines**, exactly one newly split prerequisite completed; all **26** prior
checkbox states, prior source/test hashes and Git status entries preserved.
HEAD and rc merge-base unchanged. Five changed-file snapshot patch/numstat/check
commands each **exit 1**, expected differences; whitespace diagnostics empty.
Product tests **0/0**; no runtime/mock/production acceptance or commit/PR.
Detailed argv/exits/output, snapshots, patches and identity in the registered
worktree `.maestro/verification/host-02-body-read/`.

## HOST-02 authorized attachment manifest read prerequisite — 2026-10-07

Completed exactly one newly split bounded source prerequisite in
`src/main/plugins/mail-account-read.ts`: **+53/-13, 66 changed source lines**, one
source module. The oversized full lifecycle checkbox stays unchecked. Contract
`docs/relay-imap-host-contract-20261006.md` and deferred actual-composition test
requirements in shared `RELAY-IMAP-HOST-02.md` updated. All prior work preserved.

`MailAccountHeaderReader.readAttachmentManifest(reference, caller)` composes the
existing fixed read flow and actual complete-source MIME consumer, returning only
frozen closed four-field attachment metadata arrays with independent attachments
rights. Exact captured reference/caller, enabled account/installation/plugin/dual
identity/revision/mailbox/UIDVALIDITY/UID, exact-slot LOGIN/READ-ONLY EXAMINE/
UID BODY.PEEK[] and original 10s authentication/30s lifetime budgets remain shared.
Read/detail alone deny manifest; attachments alone confer no body/header/source
rights. Whole-source structure/transfer/text/body/attachment limits remain unchanged.
All decoded attachment buffers are erased before later callbacks/close/transfer,
including projection failure; late authority/deadline failures suppress output.
No body/raw source/bytes/secret, partial manifest or fallback result. Fixed errors
and lease/socket/listener cleanup shared. Numeric part paths are private identifiers,
labels untrusted, MIME sender-declared; strings cannot be zeroized/recalled.
Fresh later publication authority remains mandatory. No new parser/store/queue/
permission minter or public type/helper introduced; existing guides/source searched.

**Implemented/static-checked only; mock-tested false; production-tested false.**
Public SDK/RPC/version/capability/byte snapshots/chunks, trusted caller/setup,
production lifecycle, events/Cue and full runtime acceptance remain unfinished.
No test creation/execution or native/storage/TLS/login invocation in this source
checkbox. Product tests created/run **0/0**, deferred by task requirements.

Exact commands, all cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, existing tools read-only (no install/symlink):

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-read.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-read.ts
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-read.ts src/main/plugins/mail-mime-content.ts
git diff --check
```

Each **exit 0**; no type/whitespace diagnostics. Isolated strict static checks,
not full repository gates or behavioral security acceptance. Source no-index
patch/numstat/check each **exit 1**, expected differences; whitespace diagnostics
empty. Final scoped document/source formatting and preservation audit recorded in
`.maestro/verification/host-02-attachment-manifest/commands.json` and `scope-audit.json`,
with entry snapshots, stdout/stderr, source/doc patches and selected CLI identity.
Repository/SDK/Cue suites and normal gates remain HOST-05; none bypassed.
Read-only discovery `ls node_modules` and attempted prior `receipt.json` read found
absent paths; dependencies/receipts resolved by existing absolute tools and
`commands.json`. These discovery errors were not failed product checks.

Fresh `node /opt/Maestro/resources/maestro-cli.js session list --json` and
`node /opt/Maestro/resources/maestro-cli.js agent-run list --limit 20 --json` each
**exit 0**, success true; compilation cache set within this verification folder.
CLI-observed execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, owner
**0af39dab-3c06-40de-9077-99207660c1e9**, execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider agentSessionId null.
Current task AgentRun **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791331755352:1791331755942:7nbtg2** observed **running**;
spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791331755352**. Original launch receipt remains shared
`LAUNCH.json`; no run/tab ID inferred, no relaunch/consult/dispatch/callback.

Branch **feat/relay-imap-host-20261006**, unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. No stage/commit/push/PR: runtime acceptance,
production wiring and normal repository gates remain incomplete; conditional
PR review remains HOST-05. Full host feature acceptance **not satisfied**.
No install/upstream merge/live mail/actual credentials/Discord/callback/deployment/
other-checkout/plugin writes. Source/docs/git and receipts only within registered
worktree; shared playbook checklist/evidence are the only main-checkout writes.
Exact outcomes reported in this execution tab; no separate report dispatch at
this prerequisite (final HOST-05 handoff remains a separate task).

Final audit **exit 0**: scoped source/contract/local-evidence formatting and tracked
whitespace **exit 0**; source snapshot **+53/-13 (66 changed lines)**, one source
module; all **27** previous checkbox states and **5,146** other source/test hashes
preserved, exactly one new completed prerequisite. Git status entries/HEAD/base
unchanged. All five snapshot patch/numstat/whitespace checks **exit 1** for expected
differences, with empty whitespace diagnostics. Product tests **0/0**; no commit/PR.
Final stdout/stderr and audit retained under the verification directory above.

## HOST-02 authorized complete attachment content read prerequisite — 2026-10-07

Completed exactly one newly split source prerequisite before the oversized lifecycle
checkbox in shared `RELAY-IMAP-HOST-02.md`. Full lifecycle stays unchecked.
Only source change: `src/main/plugins/mail-account-read.ts`, **+86/-21 (107 changed
source lines)**, one source module. Prior source/test work preserved. Existing
plugin/shared utility guides and source searched; no new parser/type/store/queue/
permission minter, dependency installation or arbitrary projector introduced.

`MailAccountHeaderReader.readAttachmentContent(reference, caller)` composes the
existing read lease/fixed session and actual complete-source MIME consumer. Closed
captured six-field reference includes bounded canonical numeric partId before I/O.
Independent attachments rights required; read/detail alone deny. Existing exact
enabled account/installation/plugin/dual identity/revision/mailbox/UIDVALIDITY/UID,
captured host callback/signal/agent, exact-slot LOGIN/READ-ONLY EXAMINE/
UID BODY.PEEK[] and original 10s authentication/30s lifetime budgets remain shared.
Full MIME/transfer/text structure/body/attachment bounds validate before exact
part selection; absent/body/container paths fail MAIL_STALE without fallback.
Return only one frozen explicit five-field partId/filename/mimeType/sizeBytes/bytes
record with the exact complete decoded selected Buffer, including zero bytes.
Unselected decoded buffers are erased before host callbacks/close/transfer;
selected bytes remain reader-owned for cancel/failure/late result erasure through
final authority/deadline checks and synchronous close. Existing modes/fixed errors
and cleanup preserved by source review; behavioral verification remains deferred.

Contract `docs/relay-imap-host-contract-20261006.md` documents actual ownership,
independent rights, whole-message budgets, untrusted labels/sender-declared MIME,
mutable bytes/nonzeroizable strings, fresh later publication authority and recipient
erasure. No cross-read manifest/byte snapshot identity or public chunk service.
Shared task adds deferred actual-composition tests, including exact-path/rights,
malformed unselected content, all budgets, erasure and reentrant close/cancellation.

**Implemented/static-checked only; mock-tested false; production-tested false.**
Product tests created/run **0/0**, explicitly deferred to separate test-creation/
execution checkboxes. No native/keyring/storage/TLS/login runtime invocation.
Public SDK/RPC/version/capability/snapshot/chunk, trusted proof/setup, production
lifecycle/events/Cue and normal repository gates remain unfinished. Full host
feature acceptance **not satisfied**; no readiness claim.

Exact commands, cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, existing dependency tools read-only:

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-read.ts
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-read.ts src/main/plugins/mail-mime-content.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write docs/relay-imap-host-contract-20261006.md
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-read.ts docs/relay-imap-host-contract-20261006.md
git diff --check
```

Each **exit 0**, no type/whitespace diagnostics. Strict isolated static checks,
not runtime tests or complete repository gates. Source snapshot patch/numstat/
whitespace checks **exit 1** for expected differences; whitespace diagnostics
empty. All argv/exits/stdout/stderr/snapshots/patches and CLI-selected identity
retained in `.maestro/verification/host-02-attachment-bytes/commands.json` and
`identity.json`. Final source/document/checkbox/hash preservation audit recorded
in `scope-audit.json` after evidence formatting; SDK/Cue/normal gates remain HOST-05.

Fresh read-only CLI `session list --json` and `agent-run list --limit 20 --json`
**exit 0**, success true. Observed execution agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**, owner
**0af39dab-3c06-40de-9077-99207660c1e9**, execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider agentSessionId **null**.
Current AgentRun **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791331971333:1791331971660:qh8tru** observed **running**;
spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791331971333**. Original launch `LAUNCH.json` run
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**. No new launch or inferred IDs.

Registered worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`;
branch **feat/relay-imap-host-20261006**, unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **No stage/commit/push/PR**: production wiring/runtime security
acceptance and normal gates incomplete; conditional review/PR remains HOST-05.
No install/upstream merge/live mail/actual credentials/callback/Discord/deployment/
other-checkout/plugin writes. Source/docs/git/receipts only in this worktree;
shared task/evidence are the only main-checkout writes. No consult/dispatch/relaunch
or separate final report handoff in this source prerequisite. Exact outcomes
reported in this execution tab; final HOST-05 evidence handoff stays separate.

## HOST-02 queued exact-account rights prerequisite — 2026-10-07

Completed only the new self-contained queued-rights source checkbox inserted before
the oversized lifecycle checkbox in shared `RELAY-IMAP-HOST-02.md`. Lifecycle,
test creation/execution, public identity/SDK/Cue integration and normal gates remain
unchecked. Prior source/document changes preserved; no stage/commit/push/PR.

Source-only change from this context's snapshots: `mail-account-credentials.ts`
**77 additions/1 deletion**, `authorization-ledger.ts` **19 additions/3 deletions**,
two source modules, **100 changed source lines**, below the three-file/500-line cap.
`MailGrantAuthority` requires host live-agent membership, captured along with the
existing mandatory setup callback/signal. `replaceAgentRights` freezes closed
canonical policy before queue admission and checks every exact agent at admission,
drain, around persistence and final return. Empty lists revoke all rights;
read/detail/attachments remain independent. The canonical queue synchronously
blocks/cancels readers, rechecks installation/plugin/dual identity/account/revision,
advances account revision/epoch and preserves enabled intent/settings/unrelated
accounts/grants/history. No keyring/transport operation is introduced.
Synchronous stored replacement now requires live host authority, snapshots identity
and policy, checks configuration before/after commit and refuses stale committed
account state after reentrant callbacks. All failures use fixed content-free errors.

The contract `docs/relay-imap-host-contract-20261006.md` documents these unwired
internal types, mandatory future frame/gesture/live-registry binding and no proof
minting. Admission failures do not invent a stop latch; admitted queued failures
retain the canonical account latch, with plugin/global latches unchanged. Abort
while waiting is checked at drain; policy can persist despite a failed response
following authority loss. Post-settlement failure suppresses output but cannot
rollback policy or create a queue latch after pruning. Restart reloads durable
policy without resetting failed-process state in the existing process or promising
recovery/readiness. Deferred tests cover actual store/queue/parser, snapshots,
reentrancy, erasure/credential/read regressions and all stated authority boundaries.

**Implemented/static-checked only. Mock-tested false; production-tested false.**
Product tests created/run **0/0**; test creation and suite execution deliberately
remain separate unchecked tasks. No runtime native/keyring/storage/TLS/login use.
Full host acceptance **not satisfied**: trusted setup/proof/live-registry production
binding, public APIs/version/capabilities, snapshot/chunk service, monitor/events/Cue,
security/runtime tests and repository-wide gates remain pending. Conditional PR
review remains HOST-05; no misleading PR created.

Exact successful checks, cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-credentials.ts src/main/plugins/authorization-ledger.ts
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-credentials.ts src/main/plugins/authorization-ledger.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write docs/relay-imap-host-contract-20261006.md docs/relay-imap-host-evidence-20261006.md
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts src/main/plugins/authorization-ledger.ts docs/relay-imap-host-contract-20261006.md docs/relay-imap-host-evidence-20261006.md
git diff --check
```

Each **exit 0**; no type/whitespace diagnostics. Snapshot `git diff --no-index`
patch/numstat/check exits **1** for expected differences with empty whitespace
outputs, including untracked source/docs. Exact argv/exits/stdout/stderr, entry
snapshots, final patches/numstat and scope/checkbox preservation audit under
`.maestro/verification/host-02-queued-rights/`; `commands.json` and `scope-audit.json`
are the receipts. Existing dependency tree accessed read-only; CLI cache stays in
this worktree. No dependency installation or repository-wide gate claim.

Fresh CLI `session list --json` and `agent-run list --limit 20 --json` both
**exit 0**, success true. Observed execution agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**, owner **0af39dab-3c06-40de-9077-99207660c1e9**, execution
tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider agentSessionId **null**.
Current run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791332240327:1791332240462:o0ugjc** observed **running**; spawned session
**228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791332240327**. Original launch run
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**, from shared `LAUNCH.json`; no inferred IDs
or new launch. Shared EVIDENCE mirrors this result; final dispatch handoff remains
its separate HOST-05 task, with no consult/dispatch/callback in this prerequisite.

Registered worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch
**feat/relay-imap-host-20261006**. Unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. Commit/test/PR outcome: **uncommitted; 0 tests; no PR**,
because implemented production acceptance/security tests and normal gates are
incomplete. No install/upstream merge/live mail/actual credentials/Discord/callback/
deployment/other-checkout/plugin writes. Source/docs/git/receipts stay in this
worktree; shared playbook/evidence are the only main-checkout writes.

## HOST-02 trusted disabled-account addition prerequisite - 2026-10-07

Completed only the newly split synchronous disabled-account addition source
checkbox before the still-unchecked full lifecycle task in shared
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-02.md`.
Test creation/execution, trusted setup/proof, public identity/SDK/Cue and production
lifecycle remain separate unchecked tasks. Prior source/document work preserved.

Exact source change from entry snapshots: `mail-account-credentials.ts` **+34/-0**,
`authorization-ledger.ts` **+16/-3**, two source modules, **53 changed source lines**.
The synchronous `addDisabledAccount(settings, setup)` captures the mandatory live
setup callback/signal and returns a frozen exact accountId/revision/enabled/mailboxes
summary, with disabled revision-1 intent and frozen mailbox array. The canonical
addition now requires live host authority, snapshots dual identity/settings before
precommit checks, refuses reentrant changes and compares complete committed bounded
configuration after anchored persistence. Unrelated accounts/grants/tombstones
survive; no rights, keyring slot/probe, password, transport or readiness is created.
Fixed errors contain no callback/native/parser content or causes. No new parser,
store, queue, type or ID generator. No dead-code removal was needed.

Callback authority remains an unwired trusted-host dependency, requiring future
frame/nonce/gesture/plugin/feature/broker binding; no proof is minted. The operation
has no awaited gap or activity key/latch. Authority loss after commit can leave a
durable disabled account despite failed response; refresh before retry, no rollback
or request-ID dedupe. No existing account/plugin/process latch is reset; global
persistence failure still stops mail. Complete snapshot comparison adds bounded
JSON serialization only over the existing <=512 KiB closed private configuration;
no settings are logged or exposed. Contract and deferred actual-store/composition
test requirements document all these limits.

**Implemented and static-checked only; mock-tested false; production-tested false.**
Product tests **0 created/0 run**, deliberately separate. Full feature acceptance
**not satisfied**: setup/caller proof, production binding, SDK/version/policy,
snapshots/chunks, monitors/events/Cue, runtime security/restart tests and normal
repository gates remain pending. No commit/stage/push/PR: conditional review stays
HOST-05 and a production-readiness PR would be misleading.

Exact checks, cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-credentials.ts src/main/plugins/authorization-ledger.ts docs/relay-imap-host-contract-20261006.md
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-credentials.ts src/main/plugins/authorization-ledger.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write docs/relay-imap-host-evidence-20261006.md
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts src/main/plugins/authorization-ledger.ts docs/relay-imap-host-contract-20261006.md docs/relay-imap-host-evidence-20261006.md
git diff --check
```

Each **exit 0**; no type or whitespace diagnostics. Static review confirmed
synchronous authority boundaries, snapshot isolation/reentrancy refusal, bounded
closed metadata and no credential/native/transport calls in the added path.
Snapshot `git diff --no-index` patches/numstat/checks **exit 1** for expected
source/docs differences, with empty whitespace diagnostics. Exact argv/exits/
stdout/stderr, entry snapshots, final patches/numstat and checkbox/scope audit in
`.maestro/verification/host-02-disabled-addition/`; `commands.json`, `execution.json`
and `scope-audit.json` are the receipts. Existing dependencies used read-only,
CLI cache restricted to this worktree. No suite or repository-wide gate claim.

Observed CLI `session list --json` and `agent-run list --limit 20 --json`: **exit 0**,
success true. Owner **0af39dab-3c06-40de-9077-99207660c1e9**, execution agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**, execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider session **null**. Current run
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791332515789:1791332516229:9413zp**, observed **running**, spawned session
**228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791332515789**. Original launch remains shared `LAUNCH.json` run
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**;
no inferred IDs/relaunch/consult/dispatch/callback or final HOST-05 handoff here.

Registered worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch
**feat/relay-imap-host-20261006**, unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. Commit/test/PR outcome: **uncommitted; 0 tests; no PR**, because
production/runtime acceptance and normal gates are incomplete. No install/upstream
merge/live mail/actual credentials/Discord/callback/deployment/other-checkout/plugin
writes. Shared playbook/evidence are the only main-checkout writes; source/docs/git/
receipts remain in the registered worktree. Exact outcome reported in execution tab.

## HOST-02 trusted stored-account summary prerequisite - 2026-10-07

Completed only the newly split trusted stored-account summary source checkbox in
shared `/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-02.md`, before the still-unchecked full lifecycle
checkbox. One source module changed from entry: `mail-account-credentials.ts`
**+21/-0**, **21 changed source lines**. All prior source/doc changes preserved.

`MailAccountCredentials.listStoredAccounts(setup)` composes existing mandatory
captured callback/AbortSignal, canonical anchored configuration access and the
existing immutable closed account projector. Pure synchronous read with live
entry/post-projection authority and final configuration identity checks. An
authorized absent configuration yields a frozen empty array; populated output is
frozen exact accountId/revision/enabled/mailboxes records and mailbox arrays.
Fixed content-free errors, no private settings/identity/grants/history/secret or
credential/readiness claims. Existing 32-account/32-mailbox/512 KiB configuration
bounds apply; no new public wire budget. No new projector/store/type, refresh,
mutation/queue/lease/latch reset, keyring probe, transport or production caller.

Reentrant changes anywhere in this plugin configuration conservatively deny stale
results; other plugin changes remain subject to canonical live consent/anchor
checks. Enabled is stored intent, even when account activity is stopped. Global
persistence failure denies reads. The callback is still an unwired trusted-host
dependency: future frame/nonce/gesture/plugin/feature/broker binding is required;
a caller identity or no-op callback is not proof. Post-return publication must
reauthorize. Public account/rights/status views and refresh notifications, trusted
setup/caller proof, SDK/version/capabilities, lifecycle recovery, events/Cue and
runtime tests remain unfinished. Contract and deferred actual-store/composition
test requirements record these limits.

**Implemented and static-checked only; mock-tested false; production-tested false.**
Product tests **0 created/0 run**, as required by separate test tasks. Full feature
acceptance **not satisfied**. No stage/commit/push/PR; HOST-05 review is conditional
on implemented acceptance/runtime security and normal gates, which remain incomplete.
No dependency install, upstream merge, live mail/native secret/storage invocation,
callback/Discord/deployment or other-checkout/plugin source write.

Exact static checks from registered cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-credentials.ts docs/relay-imap-host-contract-20261006.md
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-credentials.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write docs/relay-imap-host-contract-20261006.md docs/relay-imap-host-evidence-20261006.md
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts docs/relay-imap-host-contract-20261006.md docs/relay-imap-host-evidence-20261006.md
git diff --check
```

Each **exit 0**, no type/whitespace diagnostics. Snapshot `git diff --no-index`
patches/numstat/checks **exit 1** for expected source/docs differences, with empty
whitespace diagnostics. Static review: callback/signal capture and cancellation,
null configuration semantics, exact ownership/anchor reads, canonical frozen
projection, final snapshot reentrancy denial, fixed error normalization and pure
read/latch behavior. Exact argv/exits/stdout/stderr, entry snapshots, final patches/
numstat and checkbox/scope audit under `.maestro/verification/host-02-trusted-summary/`;
`commands.json`, `execution.json`, `scope-audit.json` are receipts. Existing dependencies
used read-only; CLI compile cache stays within this worktree. No repository-wide
gate or runtime security-test claim.

CLI `session list --json` and `agent-run list --limit 20 --json`: **exit 0**, success
true. Observed owner **0af39dab-3c06-40de-9077-99207660c1e9**, execution agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**, execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider session **null**. Current run
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791332761695:1791332761963:72rq48**, observed **running**; spawned session
**228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791332761695**. Original launch from shared `LAUNCH.json` remains
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**. No inferred IDs/relaunch/consult/dispatch/callback or final
HOST-05 handoff in this prerequisite; exact outcomes reported in execution tab.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch **feat/relay-imap-host-20261006**, unchanged HEAD/base/rc
merge-base **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. Commit/test/PR outcome:
**uncommitted; 0 tests; no PR** because production/runtime acceptance and normal
gates are incomplete. Shared playbook/evidence are the only main-checkout writes;
source/docs/git/verification receipts remain in this registered worktree.

## HOST-02 trusted exact-account stored policy read prerequisite - 2026-10-07

Completed only the newly split trusted exact-account stored policy read source
checkbox in shared `RELAY-IMAP-HOST-02.md`. Full lifecycle and all test
creation/execution tasks remain unchecked. Three source modules changed from entry:
`mail-account-config.ts` **+5/-3**, `authorization-ledger.ts` **+32/-0**, and
`mail-account-credentials.ts` **+26/-0**: **66 changed source lines**. Prior
source/docs work preserved; no test changes.

`MailAccountCredentials.readStoredAgentRights(accountId, expectedRevision, setup)`
composes mandatory captured live setup/cancellation, canonical anchored stored
ownership and the new pure `AuthorizationStore.readStoredMailAgentRights` view.
Existing ID/revision guard gains a default-false terminal-read option used only
by this view; no existing terminal mutation/admission behavior changes. Returns
frozen exact accountId/accountRevision/agents, copied through existing closed
agent-right parser; all arrays/agent records are frozen and ledger aliases do
not escape. Read/detail/attachments stay independent. Empty grants and disabled
stored intent are supported; absent/removed/unknown/stale/foreign accounts are
denied. Neither current agent membership nor effective mail authority is inferred.

Canonical state checked after projection and after final captured setup callback;
same-plugin reentrant account/policy/config changes conservatively deny. Fixed
content-free errors without causes. No endpoint/username/identity/history/secret/
readiness field, schema/version/epoch mutation, queue/lease/latch recovery,
keyring/native probe, transport or public/proof/setup/UI/SDK/IPC/Cue route added.
Later trusted host wiring must mint actual frame/nonce/gesture/generation authority
and freshly authorize policy publication. Nonzeroizable strings cannot be recalled.
Contract and deferred actual-store/composition requirements record these limits.

**Implemented and static-checked only; mock-tested false; production-tested false.**
Product tests **0 created/0 run**, as required by separate test checkboxes.
Feature acceptance **not satisfied**. Source/static checks are not a suite or
repository-wide gate. No stage/commit/push/PR; HOST-05 remains conditional on
implemented acceptance/runtime security and normal gates.

Exact static checks from registered cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-config.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-credentials.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write docs/relay-imap-host-contract-20261006.md
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write docs/relay-imap-host-evidence-20261006.md
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-config.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts docs/relay-imap-host-contract-20261006.md docs/relay-imap-host-evidence-20261006.md
git diff --check
```

Each **exit 0**, no type/whitespace diagnostics. Snapshot no-index patches/numstats
exit 1 for expected differences; whitespace checks exit 1 with empty output for
expected changed files. Actual argv/exits/stdout/stderr, entry snapshots, patches,
numstats and scope/checkbox audit live in `.maestro/verification/host-02-trusted-policy/`:
`commands.json`, `identity-commands.json`, `diff-commands.json`, `execution.json`,
`scope-audit.json`, `static-review.md`. Existing dependencies reused read-only;
CLI compile cache constrained to this worktree. No install or backend invocation.

CLI `session list --json` and `agent-run list --limit 20 --json`: **exit 0**,
success true. Owner **0af39dab-3c06-40de-9077-99207660c1e9**; execution agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**; execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider session **null**. Current run
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791332965878:1791332966016:4bza4y**, observed **running**;
spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791332965878**. Original launch remains shared
`LAUNCH.json`; no inferred IDs/relaunch/consult/dispatch/callback or final HOST-05
handoff here. Exact source/test/PR outcomes reported in execution tab.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch
**feat/relay-imap-host-20261006**, unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. Commit/test/PR outcome:
**uncommitted; 0 tests; no PR** because production/runtime acceptance and normal
gates remain incomplete. Shared playbook/evidence are the only main-checkout
writes; source/docs/git/verification receipts stay in registered worktree. No
upstream merge/install/live mail/actual credentials/Discord/callback/deployment
or other-checkout/plugin write.

## HOST-02 bounded MCP run-proof registry source prerequisite — 2026-10-07

Completed exactly one split source task in registered worktree
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Source:
`src/main/plugins/plugin-tool-run-identity.ts` **+161/-0** and
`src/main/plugins/mail-account-ledger.ts` **+11/-8**, **180 changed source lines**,
two files. Existing source preserved except the exact canonical agent-ID parser
extraction, with unchanged stored-policy validation. Reviewed existing local
run-identity design read-only; no other-checkout edit or upstream merge.

New bounded host-private registry requires live membership and captured run
assertions/signal, uses independent 256-bit proofs, caps outstanding runs at 512
and TTL at four hours (one-hour default), rejects invalid TTL/collisions, enforces
monotonic expiry and unref timers. Frozen retained contexts recheck exact entry,
run/membership/lifetime around callbacks. Revoke/abort/expiry/stop remove entries,
listeners/timers before aborting contexts; stop permanently latches before
callbacks; bounded snapshot pruning and post-callback capacity checks handle
reentrancy. No singleton, private proof-file/env delivery, verified MCP ingress,
nested plugin/sandbox handle, account/feature/broker authority, setup/SDK/RPC/IPC/
Cue route or production caller. A callback or serialized agent ID alone is not
proof. Host lifecycle signal wiring and runtime tests remain unfinished.

Contract `docs/relay-imap-host-contract-20261006.md` and deferred actual-registry
test requirements in shared `RELAY-IMAP-HOST-02.md` updated. Static review, baseline
snapshots, command stdout/stderr/exit receipts, source diff and scope audit live in
`.maestro/verification/host-02-run-proof/`. **Implemented/static-checked only;
product tests 0 created/0 run, mock-tested false, production-tested false.** Full
lifecycle, public interfaces and runtime/security/SDK/Cue/normal gates remain
unchecked; full host acceptance not satisfied.

Checks (all cwd is this registered worktree; only existing dependencies used):

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-tool-run-identity.ts src/main/plugins/mail-account-ledger.ts`: exit **0**.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/plugin-tool-run-identity.ts src/main/plugins/mail-account-credentials.ts src/main/plugins/mail-account-read.ts`: exit **0**, no diagnostics; isolated transitive source check, not full repository typecheck.
- Source/contract formatting and `git diff --check`: exit **0**. Final scoped format/evidence/snapshot checks are recorded in the same receipts directory.
- Snapshot `git diff --no-index`/numstat: exit **1** for expected differences; whitespace checks must emit no diagnostics. No suite run or gate claim.

CLI `session list --json` and `agent-run list --limit 20 --json`: exit **0**, success
true. Observed owner **0af39dab-3c06-40de-9077-99207660c1e9**, execution agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**, tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**,
provider session **null**. Current run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791333203778:1791333204055:qsaeg8**,
observed **running**, spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791333203778**.
Original launch remains shared `LAUNCH.json`; no new launch or inferred callback.
This prerequisite needs no new Backstage consult; previous handoff artifacts
remain unchanged, final production handoff remains HOST-05.

Branch **feat/relay-imap-host-20261006**; HEAD/base/rc merge-base unchanged
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **No commit/push/PR**: production
integration/full acceptance and required gates are incomplete; conditional review
and PR remain HOST-05. No install, live provider/mail login, actual credential
retrieval, native/storage runtime invocation, upstream merge, callbacks, Discord,
deployment or plugin/other-checkout source writes. Shared task/evidence only
outside this worktree. Exact outcomes reported in this execution tab.

## HOST-02 plugin-bound nested invocation handle source prerequisite — 2026-10-07

Completed exactly one newly split source prerequisite before the still-unchecked
full lifecycle task in shared `RELAY-IMAP-HOST-02.md`. Registered worktree
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch
`feat/relay-imap-host-20261006`; HEAD/base/rc merge-base unchanged **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**.
Existing work preserved. One source file changed from the entry snapshot:
`src/main/plugins/plugin-tool-run-identity.ts` **+200/-1**, **201 changed source lines**.

The existing run registry now requires exact WeakMap-branded run contexts before
minting plugin-bound random 256-bit nested handles. Structural copies/foreign/
forged/nested contexts confer no mint authority. Required captured host plugin
assertion and signal bind sandbox/identity lifetime; callbacks supplied by a
plugin/model are not proof. Monotonic TTL defaults/maxes at 30 seconds, bounded
by remaining run lifetime; 512 global/32 per run/32 per plugin limits. Frozen
resolved contexts recheck handle/run/membership/plugin around callbacks. Wrong
plugin lookup preserves owner entries. Release/revoke/abort/expiry/failure/stop
remove exact entries/indexes/timers/shared lifetime listeners before context abort;
parent cancellation uses its bounded index with no per-handle parent listeners.
No source signals are aborted. Native errors normalized to fixed mail codes.

Contract `docs/relay-imap-host-contract-20261006.md` describes implementation and
obligations, and shared HOST-02 records deferred actual-registry test cases. Host
must still privately deliver/resolve run proofs at verified MCP ingress, propagate
handles to the exact sandbox/tool round trip, supply actual child provenance,
release at settlement, wire generation signals and enforce account/feature/
manifest/broker/agent rights and result erasure. No public mail SDK/RPC/IPC/Cue,
setup minter, production singleton, native keyring/storage or network operation.
**Implemented/static-checked only; mock-tested false; production-tested false.**
Full feature acceptance remains incomplete. **0 product tests created/0 run**:
source/test creation/test execution are separate playbook tasks.

Actual commands, cwd this registered worktree (argv/exits/stdout/stderr in
`.maestro/verification/host-02-invocation-handles/commands.json`):

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-tool-run-identity.ts
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/plugin-tool-run-identity.ts src/main/plugins/mail-account-credentials.ts src/main/plugins/mail-account-read.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/plugin-tool-run-identity.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write docs/relay-imap-host-contract-20261006.md docs/relay-imap-host-evidence-20261006.md
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-tool-run-identity.ts docs/relay-imap-host-contract-20261006.md docs/relay-imap-host-evidence-20261006.md
git diff --check
```

Final checks **exit 0**, no type/ESLint/whitespace diagnostics. Initial optional
ESLint attempt **exit 2**, because this worktree lacked `node_modules` and its
config could not resolve `@eslint/js`. Recovered with the documented worktree-local
symlink to existing dependencies, read-only use, then removed only that symlink;
no install or shared dependency mutation. Final source ESLint **exit 0**. This is
isolated source verification, not repository-wide gates or runtime acceptance.
Snapshot no-index patches/numstats **exit 1** for expected differences; whitespace
checks **exit 1** with empty diagnostics for changed files. Baselines, patches,
source hashes, scope/checkbox audit and static review retained in the same local
verification directory. No other source/test files changed in this task.

CLI `session list --json` and `agent-run list --limit 20 --json`: **exit 0**,
success true. Observed owner **0af39dab-3c06-40de-9077-99207660c1e9**; execution agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**; tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider session **null**. Current run
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791333629854:1791333629999:tubp7k**, observed **running**; spawned session
**228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791333629854**. Original launch
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i** remains shared `LAUNCH.json`; no inferred callback,
relaunch or new consult/dispatch. Previous Backstage handoff unchanged; final
production coordination remains HOST-05. Exact outcomes reported in execution tab.

**Uncommitted; no push/PR**: production/runtime acceptance and normal gates are
incomplete, with conditional review/PR left in HOST-05. No upstream merge,
installation, deployment, live mail/provider login, real credential retrieval,
native/storage runtime invocation, callbacks, Discord or other-checkout/plugin
writes. Only shared playbook/evidence changed outside this registered worktree.

## HOST-02 sandbox invocation propagation split — 2026-10-07

Completed exactly one source prerequisite, added before the oversized lifecycle
checkbox in the shared `RELAY-IMAP-HOST-02.md`. Three source files:
`plugin-sandbox-host.ts` (+154/-36), `plugin-sandbox-entry.ts` (+23/-2), internal
`rpc-protocol.ts` (+8/-1); total **185 additions/39 deletions, 224 changed lines**.
Existing prior mail implementation remains uncommitted and preserved.

The sandbox host now optionally consumes an exact run context from the actual
injected `PluginToolRunIdentity` with a captured required plugin/identity/feature
assertion and exact current child lifetime. Args are snapshotted, nested handles
stay outside args, and the child constructs a frozen context-realm second handler
argument. Ordinary tools have null invocationId; commands/events gain no authority.
Handles/pending work/listeners/timers release on every settlement/abort/stop/exit;
result checks include reentrant handle-release callbacks. Stale child messages and
old exits cannot affect replacements. Authenticated errors avoid raw child text.
Contract updated and deferred actual-registry/sandbox/realm tests added as prose.
No new public SDK type, capability, manager/MCP ingress, setup/account grant/RPC,
production dependency injection or Cue path. **Implemented/static-checked only;
mock-tested false; production-tested false. 0 product tests created/0 run.**

Commands ran only in this registered worktree; exact argv/exits/logs, source before
snapshots/patch/hashes, static review and receipt are under
`.maestro/verification/host-02-sandbox-invocations/`. Final source commands:

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-sandbox-host.ts src/main/plugins/plugin-sandbox-entry.ts src/shared/plugins/rpc-protocol.ts
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/plugin-sandbox-host.ts src/main/plugins/plugin-sandbox-entry.ts src/shared/plugins/rpc-protocol.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/plugin-sandbox-host.ts src/main/plugins/plugin-sandbox-entry.ts src/shared/plugins/rpc-protocol.ts
git diff --check
git diff --numstat -- src/main/plugins/plugin-sandbox-host.ts src/main/plugins/plugin-sandbox-entry.ts src/shared/plugins/rpc-protocol.ts
```

Each final command **exit 0**, no type/ESLint/whitespace diagnostics. Also compiled
the embedded bootstrap with `vm.Script` for syntax only (**exit 0**, not executed;
exact Node argv in `commands.json`). Initial isolated type check **exit 2** because
this worktree lacked dependency resolution for Electron/Sentry. Reused existing
dependencies through a temporary worktree-local `node_modules` symlink; subsequent
and final type/ESLint checks **exit 0**. Removed only that symlink afterwards; no
installation/shared dependency mutation. Final documentation/source Prettier check
and whitespace outcomes are recorded in the same command ledger. These are isolated
static checks, not full normal gates, SDK drift tests or runtime security acceptance.

CLI `session list --json` and `agent-run list --limit 20 --json` both **exit 0**,
success true; raw observations retained locally. Owner from existing launch receipt:
**0af39dab-3c06-40de-9077-99207660c1e9**; execution agent:
**228eef8c-75a8-46e8-bb67-2903da23bc06**; tab/sessionId:
**5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider session **null**.
Observed current run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791333908826:1791333908966:mytvcm**,
status **running**; spawned session
**228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791333908826**.
Original launch **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**.
Previous Backstage coordination unchanged; no new consult/dispatch/relaunch or callback.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch
`feat/relay-imap-host-20261006`; base/current HEAD
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **Uncommitted; no push/PR**:
production mail acceptance and normal gates remain unfinished; conditional review,
commit and PR remain HOST-05. No live mail/login/credential retrieval, native/storage/
network invocation, upstream merge/install/deployment/callback/Discord or other
checkout/plugin writes. Only shared playbook/evidence changed outside this worktree.

## HOST-02 verified manager tool ingress prerequisite — 2026-10-07

Completed exactly one bounded source task in the registered worktree: optional
host-private `PluginManager.invokeVerifiedTool(toolId, args, runProof)` plus the
canonical sandbox's reusable exact-child lifetime assertion. Reused actual
`PluginToolRunIdentity`, `getRecord`, `isRunnable`, `collectContributions` and
existing bounded sandbox snapshot/handle cleanup. Captured required-for-verified
host dependencies, enforced declared trusted runnable tools and live run/plugin/
record/feature/child authority around callbacks/awaited result, and invalidated
manager lifetime before stop callbacks. Errors are content-free fixed codes;
ordinary tool/command entry points gain no identity. Exact-child restart and
reentrant record replacement suppress stale result publication.

Task delta: **2 source files, 114 additions/7 deletions = 121 changed lines**:
`src/main/plugins/plugin-manager.ts`, `src/main/plugins/plugin-sandbox-host.ts`.
Saved before snapshots, task patch, SHA-256 hashes, static review and receipt:
`.maestro/verification/host-02-manager-invocations/`. Prior sandbox snapshot hash
matched the preceding task's receipt. Existing prior uncommitted changes preserved.
Contract updated: `docs/relay-imap-host-contract-20261006.md`; deferred actual-
registry/manager/sandbox tests added to HOST-02. **Implemented/static-checked only;
0 product tests created/0 run; mock-tested false; production-tested false.**

Exact source verification commands (cwd this worktree):

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-manager.ts src/main/plugins/plugin-sandbox-host.ts
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/plugin-manager.ts src/main/plugins/plugin-sandbox-host.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/plugin-manager.ts src/main/plugins/plugin-sandbox-host.ts
git diff --check
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-manager.ts src/main/plugins/plugin-sandbox-host.ts
```

All **exit 0**, no type/ESLint/whitespace diagnostics. Existing dependencies reused
via temporary worktree-local `node_modules` symlink, removed after checks; no
installation/shared dependency mutation. Exact argv/exits/logs for final docs/source
formatting and whitespace are also retained in `commands.json`. These are isolated
static checks; normal repository/SDK/Cue/security gates remain HOST-05.

Observed CLI `session list --json` and `agent-run list --limit 20 --json`: both
**exit 0**, success true; raw output saved locally. Owner (launch receipt):
**0af39dab-3c06-40de-9077-99207660c1e9**; execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**;
tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider session **null**.
Current observed run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791334249044:1791334249307:nwgfcj**, status **running**; spawned session
**228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791334249044**. Original launch **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**.
Previous Backstage coordination remains unchanged; no new consult/dispatch,
relaunch, callback or Discord operation.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch
`feat/relay-imap-host-20261006`; base/current HEAD **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**.
**Uncommitted; no push/PR**: production mail acceptance and normal gates remain
unfinished; conditional review/commit/PR remain HOST-05. No production caller/MCP
proof delivery, sealed-identity injection, mail RPC/capability/SDK/setup/monitor/
event/Cue wiring added. New entry conveys no account rights or risk approval;
future ingress must retain existing tool-risk gates and reauthorize publication.
Generic result strings cannot be zeroized; plugin computation is not killed by
manager settlement. No native/storage/network/login/credential retrieval,
upstream merge/install/deployment/callback/Discord or other-checkout/plugin writes.
Only shared playbook/evidence was written outside this worktree. Full lifecycle,
test creation/execution and host acceptance remain unfinished.

## HOST-02 verified read-authority composition prerequisite — 2026-10-07

Completed exactly one bounded source prerequisite in the registered worktree:
`MailInvocationReadAuthority.resolve(invocationId)` composes actual
`PluginToolRunIdentity` with the existing host-private account reader. Captured
mandatory registry/exact plugin/immutable dual identity/live policy callback;
retained frozen verified agent/signal/context; rechecked before/after callback.
Reader selects its fixed read/detail/attachments right and passes its own plugin,
identity and captured agent ID. Cross-reader or substituted-agent authority reuse
is denied. Original canonical sealed account/revision/mailbox/agent activity,
transport cleanup, deadlines and content erasure remain independent.

Task delta: **2 source files, 130 additions/11 deletions = 141 changed lines**:
`src/main/plugins/mail-invocation-read-authority.ts` and
`src/main/plugins/mail-account-read.ts`. Before snapshot, task patch, SHA-256 hashes,
static review, exact commands/logs and receipt:
`.maestro/verification/host-02-read-authority/`. Existing prior uncommitted changes
preserved. Contract updated: `docs/relay-imap-host-contract-20261006.md`.
One new prerequisite was split and completed in shared
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-02.md`;
deferred actual-registry/resolver/reader security requirements were added there.
Full lifecycle and test creation/execution remain unchecked.
**Implemented/static-checked only; 0 product tests created/0 run;
mock-tested false; production-tested false.**

Final source/static verification commands (cwd this worktree):

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-invocation-read-authority.ts src/main/plugins/mail-account-read.ts docs/relay-imap-host-contract-20261006.md
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-invocation-read-authority.ts src/main/plugins/mail-account-read.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/mail-invocation-read-authority.ts src/main/plugins/mail-account-read.ts
git diff --check
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-invocation-read-authority.ts src/main/plugins/mail-account-read.ts docs/relay-imap-host-contract-20261006.md
```

All **exit 0**, no type/ESLint/whitespace diagnostics. Existing dependencies reused
through a temporary worktree-local `node_modules` symlink, removed after checks;
no install/shared dependency mutation. Final evidence/docs formatting and whitespace
argv/exits are retained in `commands.json`. These isolated static checks are not
normal repository/SDK/Cue/security gates; those remain HOST-05.

Observed `node /opt/Maestro/resources/maestro-cli.js session list --json` and
`node /opt/Maestro/resources/maestro-cli.js agent-run list --limit 20 --json`:
both **exit 0**, success true; raw CLI evidence retained locally. Owner (launch):
**0af39dab-3c06-40de-9077-99207660c1e9**; execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**;
execution tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider session **null**.
Current observed run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791334526606:1791334526744:t34ru2**, status **running**;
spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791334526606**.
Original launch **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**. No new Backstage
consult/dispatch/relaunch/callback/Discord; previous coordination remains unchanged.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch `feat/relay-imap-host-20261006`;
base/current HEAD **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **Uncommitted; no push/PR**:
production mail acceptance and normal gates remain unfinished; conditional review,
commit and PR remain HOST-05. No production RPC/broker/policy injection, MCP
delivery, setup, SDK/capability/version, event/monitor/Cue or publication wrapper
added. A host callback is an injection obligation, not proven production policy;
low-level reader remains host-private and requires trusted composition. Original
read transfer ends its lease; later public/chunk publication must reauthorize
exact caller/account/revision. Strings/returned bytes cannot be recalled.
No native/storage/network/login/credential retrieval, upstream merge/install/
deployment/callback/Discord or other-checkout/plugin writes. Only shared
playbook/evidence changed outside the worktree. Full host acceptance is unfinished.

Supplementary task-delta whitespace checks (`git diff --no-index --check` for
before-vs-current reader and `/dev/null`-vs-new resolver) returned **exit 1** for
expected file differences, with **no whitespace diagnostics**. Exact argv and
exits are in the command receipt. An initial evidence script incorrectly expected
0 for this no-index mode and stopped before checkbox mutation; its interpretation
was corrected and the final artifact/checkbox audit completed.

## HOST-02 verified projected-read completion prerequisite — 2026-10-07

Completed exactly one bounded source prerequisite in this registered worktree.
`MailInvocationReader` composes the actual registry resolver, account reader and
canonical activity store. Its fixed header-display/body/attachment-manifest
methods resolve only nested handles and retain an outer exact-account/revision/
mailbox/installation/verified-agent/independent-right lease through the awaited
actual read and cleanup. The post-await check suppresses late results after
invalidation/expiry/cancellation/deadline; only existing frozen projections return.
Shared immutable `parseMailMessageReference` reuses canonical schema/ID/revision/
UID/mailbox validators in the facade and reader. No raw-byte or generic callback
surface, replacement reader, public API, broker route, publication or production
caller. Double leases count against existing limits; later serialization must
recheck authority and strings cannot be zeroized or recalled.

Task delta: **3 source files, 223 additions/11 deletions = 234 changed lines**:
`src/main/plugins/mail-account-config.ts`, `mail-account-read.ts` and new
`mail-invocation-reader.ts`. Before snapshots, task patch, source SHA-256 hashes,
static review, exact commands/exits/logs, CLI receipts and task receipt:
`.maestro/verification/host-02-invocation-read-completion/`. Prior changes preserved.
Updated contract `docs/relay-imap-host-contract-20261006.md`, added one bounded
HOST-02 source prerequisite and deferred actual-composition security requirements.
Full lifecycle, test creation/execution and HOST-05 normal gates remain unfinished.
**Implemented/static-checked only; 0 product tests created/0 run;
mock-tested false; production-tested false.**

Exact source verification commands (cwd this worktree):

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-config.ts src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-config.ts src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-config.ts src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts
git diff --check
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-config.ts src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts
```

All **exit 0**, no type/ESLint/whitespace diagnostics. Existing local dependencies
reused through a temporary worktree-local `node_modules` symlink, removed after
checks; no install/shared-tree mutation. Final documentation/evidence formatting
and task-delta whitespace command outcomes are retained in `commands.json`.
No product/runtime/backend/security suite was executed; isolated source checks
do not satisfy production acceptance or the normal HOST-05 gates.

Observed `node /opt/Maestro/resources/maestro-cli.js session list --json` and
`node /opt/Maestro/resources/maestro-cli.js agent-run list --limit 20 --json`:
both **exit 0**, success true. Owner (launch): **0af39dab-3c06-40de-9077-99207660c1e9**;
execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**; execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider session **null**.
Observed current run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791334904211:1791334904348:fm6ww6**, status **running**;
spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791334904211**. Original launch
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**. No new Backstage consult/dispatch/relaunch,
callback or Discord action; prior coordination unchanged.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch `feat/relay-imap-host-20261006`;
base/current HEAD **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **Uncommitted; no push/PR**:
production mail acceptance/normal gates remain unfinished and conditional review,
commit and PR remain HOST-05. No production policy/caller/RPC/broker/setup/SDK/
version/event/monitor/Cue wiring, installation, upstream merge, native/storage/
network runtime, real credential retrieval or login. Only shared playbook/evidence
changed outside this worktree. Full host acceptance is not satisfied.

## HOST-02 verified attachment-read completion prerequisite — 2026-10-07

Completed exactly one bounded source prerequisite in this registered worktree.
`MailInvocationReader.readAttachmentContent` composes the actual registry resolver,
canonical store and existing account reader, selecting independent attachments
rights and retaining an outer exact-account/revision/mailbox/installation/verified-
agent lease through actual fixed read/MIME selection/close/cleanup and its awaited
continuation. Returned bytes are owned before live callbacks, erased on late
rejection and synchronous outer cancellation, and transferred only after final
live authority/deadline checks. Successful normal release preserves bytes. Shared
`parseMailAttachmentReference` extracts/reuses the real reader's existing closed
reference/numeric path rules; other facade modes and original caps remain shared.

Task delta: **3 source files, 73 additions/37 deletions = 110 changed lines**:
`src/main/plugins/mail-account-config.ts`, `mail-account-read.ts` and
`mail-invocation-reader.ts`. Before snapshots, source patch/hashes, static review,
CLI observations, exact commands/exits/logs and receipt:
`.maestro/verification/host-02-invocation-attachment-completion/`. Prior source
changes preserved. Updated contract `docs/relay-imap-host-contract-20261006.md`
and shared HOST-02 task/deferred actual-composition test requirements. Full lifecycle,
test creation/execution and HOST-05 normal gates remain unchecked.
**Implemented/static-checked only; 0 product tests created/0 run;
mock-tested false; production-tested false.**

Source verification (cwd this worktree):

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-config.ts src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-config.ts src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-config.ts src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts
git diff --check
```

All **exit 0**, no type/ESLint/whitespace diagnostics. Existing local dependencies
reused via temporary worktree-local `node_modules` symlink, removed after checks;
no installation or shared dependency mutation. Final formatting/whitespace and
artifact audit commands/exits are retained in `commands.json`. These are isolated
static checks, not repository/security/SDK/Cue/runtime acceptance gates. No test
suite, synthetic backend, keyring/storage/network runtime or mail login ran.

CLI `session list --json` and `agent-run list --limit 20 --json`: both **exit 0**,
success true, raw output retained locally. Owner from launch:
**0af39dab-3c06-40de-9077-99207660c1e9**; execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**;
execution tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider session **null**.
Observed current run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791335234489:1791335234742:pqbrlz**, status **running**;
spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791335234489**. Original launch
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**. Previous Backstage coordination remains unchanged;
no new consult/dispatch/relaunch/callback/Discord operation.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch `feat/relay-imap-host-20261006`;
base/current HEAD **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**. **Uncommitted; no push/PR**:
production mail acceptance and normal gates remain unfinished; conditional review,
commit and PR remain HOST-05. No production caller/policy/RPC/broker/setup/SDK/
version/event/monitor/Cue wiring added. Complete attachment Buffer remains strictly
host-private; future public chunk/snapshot/serialization must freshly authorize
and bind content/descriptor identity. Recipient owns erasure after transfer;
mutable bytes/aliases and strings cannot be recalled. Double leases consume
unchanged caps; timers do not interrupt synchronous parsing. Only shared
playbook/evidence was written outside this worktree. Full acceptance is unmet.

## HOST-02 verified reference-search completion prerequisite — 2026-10-07

Completed exactly one bounded source prerequisite in this registered worktree.
`MailInvocationReader.searchReferences` now uses the actual registry authority,
canonical account activity and actual reader's fixed search flow. It fixes read
rights and holds an outer exact account/revision/mailbox/installation/verified-
agent lease across actual search/projection/close/inner cleanup and awaited
completion, rechecking live invocation/policy/deadline before transfer. Extracted
`parseMailSearchCriteria` shares the original closed criteria/fixed-command rules
with both readers; no replacement parser/read callback, raw result, public API,
cursor, cache or new authority. Invalid search account ID/revision now fails the
shared schema before configuration lookup. Other facade modes remain shared.

Task delta: **3 source files, 80 additions/29 deletions = 109 changed lines**:
`src/main/plugins/mail-account-config.ts`, `mail-account-read.ts` and
`mail-invocation-reader.ts`. Before snapshots, source patch/hashes, static review,
raw CLI observations, exact command argv/exits/logs and receipt retained at
`.maestro/verification/host-02-invocation-search-completion/`. Prior source changes
preserved. Updated contract and shared HOST-02 task/deferred actual-composition
security requirements. Full lifecycle, test creation/execution and HOST-05 normal
gates remain unchecked. **Implemented/static-checked only; 0 product tests
created/0 run; mock-tested false; production-tested false.**

Final source checks (cwd this worktree):

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-config.ts src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts  # exit 0
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/mail-account-config.ts src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts  # exit 0
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-config.ts src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts  # exit 0
git diff --check  # exit 0
```

All final checks **exit 0**, no type/ESLint/whitespace diagnostics. Initial
formatting write exited 0; initial type check exited **2** (unknown UID fields lost
TypeScript narrowing on extraction); corrected validated-string field typing,
then strict type check passed. Initial ESLint/whitespace exited 0. All attempts
are retained in `commands.json`; no failure is counted as passing. Existing local
dependencies reused via temporary worktree-local `node_modules` symlink removed
after checks, no installation/shared dependency mutation. These isolated static
checks do not satisfy repository/security/SDK/Cue/runtime acceptance; no test
suite, synthetic backend, keyring/storage/network runtime or login ran.

CLI `session list --json` and `agent-run list --limit 5 --json` both **exit 0**,
success true; raw responses retained. Owner from launch:
**0af39dab-3c06-40de-9077-99207660c1e9**; execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**;
execution tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider session **null**.
Observed current run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791335491993:1791335492251:09lod4**,
status **running**; spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791335491993**.
Original launch **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**.
No new Backstage consult/dispatch/relaunch/callback/Discord action.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch
`feat/relay-imap-host-20261006`; base/current HEAD **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**.
**Uncommitted; no push/PR**, production mail acceptance/normal gates unfinished;
conditional review/commit/PR remain HOST-05. No public caller/broker/setup/SDK/
version/event/monitor/Cue/production policy or lifecycle wiring added. Search is
a bounded historical observation, not a stable mailbox snapshot/checkpoint.
Double leases consume original caps; later publication requires fresh authority,
immutable coordinates cannot be recalled. Only shared playbook/evidence was
written outside this worktree. Full host acceptance remains unmet. Final
formatting/task-patch whitespace/artifact audits retained in `commands.json`.

Task-delta `git diff --no-index --check -- <before> <source>` returned **1**
for each of the three changed files with empty diagnostics: expected differing-
files status (`--no-index` implies `--exit-code`), no whitespace violations.
Final documentation formatting/check and tracked whitespace checks exited **0**.
The audit initially asserted every no-index exit must be 0 and stopped before
checkbox marking; corrected that audit's interpretation, retained exact exit 1,
and marked only the verified reference-search source prerequisite complete.

## HOST-02 verified attachment snapshots prerequisite — 2026-10-07

**Implemented and statically checked only.** Completed one source split of the
oversized lifecycle task; original lifecycle remains unchecked. Actual invocation
facade opens an owned snapshot through the actual fixed attachment read/MIME flow.
Independent attachments authority and exact account/revision/installation/mailbox/
verified invocation remain live across inner cleanup, outer await and chunk reads.
Source delta: two files, **223 additions/6 deletions (229 changed lines)**.

- `src/main/plugins/mail-attachment-snapshot.ts`: conservative global/per-plugin
  full-part reservations before I/O, frozen labels and sequential <=64 KiB base64
  chunks; before/after encoding reauthorization, fresh publication check, reentrant
  refusal and fixed errors, synchronous erasure/drop and idempotent cleanup.
- `src/main/plugins/mail-invocation-reader.ts`: `openAttachmentSnapshot` composes
  the actual reader; retains original outer lease after success and transfers
  ownership/listeners/reservation only after live checks. Other modes unchanged.

Reservations span facade instances: **64 MiB/eight globally, 16 MiB/two per
plugin**, each reserving the canonical 8 MiB maximum part including pending,
empty and completed snapshots. Completion immediately erases/drops binary bytes;
lease/reservation remain until explicit close or existing invocation expiry.
Original admission and verified-invocation deadlines are not extended; no new
store/queue/timer. Canceled/failed late continuation erases and unwinds ownership.
All accounting is process-local and covers snapshot capacity, not transport/MIME
peak memory. Returned strings/metadata cannot be recalled. Main-only object has
no binary alias or serialized proof; future external delivery must reauthorize.

Static verification using existing local dependencies (no install/shared writes):
Prettier source write/check, strict isolated TypeScript with no-unused checks,
ESLint and tracked `git diff --check` **exit 0**. Source TypeScript/ESLint were
rerun after final review edits, **exit 0**. Exact argv/exits/diagnostics and final
docs/task-delta/audit outcomes are stored in
`.maestro/verification/host-02-attachment-snapshots/commands.json`.
Before snapshots, source patch/delta/hashes, static review, receipt and CLI raw/
filtered observations live in that directory. This is execution-agent manual
static review; no independent/runtime verification is claimed.

**Product tests created: 0. Product tests run: 0. Mock-tested: false.
Production-tested: false.** Added explicit deferred actual-composition snapshot
coverage to HOST-02; test creation/execution remain separate. No production
RPC/SDK/capability/version/setup/policy/monitor/event/Cue route is available.
Normal gates and full acceptance remain HOST-05 prerequisites, not established.

All code/docs/git checks used registered worktree
`/home/chris/code/worktrees/feat/relay-imap-host-20261006` on
`feat/relay-imap-host-20261006`. Base/HEAD `1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`.
Changes **uncommitted; no push/PR** because acceptance and normal gates are open;
conditional commit/review/PR belongs to HOST-05. Temporary worktree dependency
symlink is removed during final artifact audit. Only shared playbook/evidence
writes occurred in the main checkout; no other-checkout code/test/git changes.

Owner `0af39dab-3c06-40de-9077-99207660c1e9`; execution agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider sessionId **null**.
Observed run **`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791335731882:1791335732028:42rjx9`** (**running** at read), spawned session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791335731882`. Session-list and agent-run-list commands **exit 0**,
success true; no relaunch/consult/dispatch/callback/Discord. Existing Backstage
coordination unchanged. No install, upstream merge, native/storage/network
runtime, real credential retrieval, provider traffic or mail login.

# HOST-03 — Backstage contract reconciliation (2026-10-07)

Completed one self-contained **documentation-only** checkbox, the reconciliation
at the start of RELAY-IMAP-HOST-03. HOST-02's broad unfinished lifecycle task
exceeds the source budget; this independent review establishes no lifecycle or
public API completion. Updated only the host contract and this evidence document;
shared checklist/evidence are the only main-checkout writes. Existing source and
package bytes are unchanged. No source/tests authored or product suites run.

## Reviewed provenance and mapping

Fully read Backstage HOST-HANDOFF-20261006.md, HOST-CONTRACT-REVIEW-20261006.md,
all 622 lines of its implementation ledger (needs/domain/tests/integration halt),
host backstage-needs document and actual plugin mail-metadata.ts. Inspected the
existing plugin metadata test vectors read-only. Required plugin commit
`71ae91ba87f96710213b4dd96f2f9b55422c8d5e` was verified by reading loose Git objects
without any plugin-checkout Git operation. Metadata blob
`3f68df21514aead25ef3aa82697723ab89e5a96b`, SHA-256
`fc4eb5903a8fbf0e1466df63c83d702c3c4289d90fa183082a60d5fc8728474a`,
exactly matches current source. Provenance/read receipts and before/task patches
are in `.maestro/verification/host-03-reconciliation/` in this registered worktree.

The contract now explicitly requires this closed adapter, with public names still
proposed and combined mapping tests deferred:

| Exact local field  | Proposed host mapping                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| reference (string) | Canonical relay-mail:1 token from structured accountId/mailbox/uidValidity/uid, no authority from token syntax. |
| accountId          | Exact host accountId and reference.accountId agree with authorized account.                                     |
| folder             | Exact mailbox/reference.mailbox, without normalization or namespace conflation.                                 |
| uidValidity        | Canonical positive 32-bit decimal string, equal to reference.uidValidity.                                       |
| uid                | Canonical positive 32-bit decimal string, equal to reference.uid.                                               |
| receivedAt         | arrivedAt integer UTC epoch milliseconds, 0..253402300799999.                                                   |
| sizeBytes          | size nonnegative safe integer complete message size.                                                            |

Trusted plugin provenance/event ID lives in the envelope, outside the exact
seven-field <=4096-byte UTF-8 local payload. No subject/sender/body/attachment
metadata/content/secret extras. Local attachment maps only to independent host
attachments right; read/detail map identically without implication. A synthetic
canonical vector and deferred bidirectional mismatch/escaping/opaque-ID/provenance/
revision tests are documented. Existing plugin-domain tests are historical evidence
(38 mail/275 overlapping total cases reported), **not a tested host adapter**;
no integration test is claimed by this reconciliation.

Additional reconciled requirements: host-authoritative IDs/sealed grants/revisions,
search <=256 and header <=512 characters (private limits differ), complete plain
text MIME/UTF-8 body counts, optional filename fallback, exact invocation/reference/
part/revision snapshot binding and canonical sequential base64/EOF/whole-size checks.
JSON RPC cannot carry an assumed AbortSignal; production cancel/delivery wiring
remains required. Central panel uses approved read-only rights/status/mask projections;
closed targeted setup intents only navigate, with every mutation/login requiring a
trusted frame/nonce/user gesture. Save/failure/close/cancel rereads the live safe view,
suppresses stale refresh replies and never applies optimistic grants/readiness.

Documented a concrete unresolved source conflict: proposed/plugin disable retains
credentials, while private MailAccountCredentials.mutateAccount deletes its exact
slot on disable and canonical disable clears rights. Later bounded lifecycle work
must reconcile/test this before public wiring. Failed persistence stays stopped;
restart/latch recovery and native cleanup cannot be inferred from intent or history.

Host watch service is the sole producer/checkpoint owner; local plugin event state
remains scaffolding. Generic 64 KiB KV is unchanged and cannot hold the local 1 MiB
character snapshot. Required host state is <=1 MiB UTF-8 with proven atomic writes.
Complete ascending paginated reconnect scans/max-UID baselines replay pending first.
Durable consumer-specific Cue receipts must cover disabled/filtered/no-subscriber
consumption, revoke-before-drain/restored replay, namespace fences and retention;
no eviction of pending/ambiguous receipts or time-only expiry without safe retry
fences. No exactly-once claim or agent/Vault work outside user-enabled Cue.

## Verification, execution identity and limitations

Cwd for all writes/Git/checks: registered host worktree
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`; branch
`feat/relay-imap-host-20261006`; base/HEAD unchanged
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. All changes remain **uncommitted**;
no push/PR: public implementation, combined identity/SDK/version/Discord/voice
compatibility, security/restart tests and normal acceptance gates are unfinished.
Host API remains 1.16.0, SDK 0.11.0; Relay minHostApi 1.22.0 is unchanged.
No available public mail methods/types/capabilities added. Private prerequisites
remain statically checked only, not runtime acceptance.

Exact commands/results captured in worktree `commands.json`: existing Prettier
executable `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs`
`--write` then `--check` on contract/evidence **exit 0**; `git diff --check`
**exit 0**. Task-specific document structure/requirement coverage, source/package
SHA-256 invariance and exact single-checkbox audit **exit 0** (final receipts in
`audit.json`). Untracked docs are also compared with before snapshots using
`git diff --no-index --check` (**exit 1**, expected differences, no whitespace
diagnostics); ordinary git diff does not cover untracked documents.
No typecheck/build/lint/product test run for this documentation-only task.
Product tests created/run: **0/0**; mock-tested/production-tested: **false**.
Implementation/security/SDK/Cue/restart/execution/review checkboxes stay unchecked.

CLI tab show and agent-run list **exit 0**, success true. Owner
`0af39dab-3c06-40de-9077-99207660c1e9`; registered execution agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`, provider agentSessionId **null**.
Observed latest run
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791336146311:1791336146453:kiagi9`
was **running** at read; spawned session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791336146311`.
Original LAUNCH.json records run
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i`.
These are observed registry/launch IDs, not proof of whole-package completion.
No relaunch, consult, dispatch, callback, Discord, installation, upstream merge,
native/storage runtime, provider traffic, credentials or live mail login.
Existing Backstage coordination is unchanged; full acceptance remains **unsatisfied**.

## HOST-03 canonical caller-proof preparation — 2026-10-07

Completed exactly one unchecked source task: reviewed read-only comparison
`/home/chris/code/worktrees/fix/relay-headless-dispatch/src/main/plugins/plugin-tool-run-identity.ts`
and `src/shared/plugins/rpc-protocol.ts` in full, and its manager's tool contract.
Reused this branch's existing stricter HOST-02 registry/context/nested handle and
manager ingress instead of copying the older nullable/unbounded proof design.
Comparison input hashes, before snapshots, source patch/delta, exact verification
commands/exits/logs, static review, CLI observations and audit are under
`/home/chris/code/worktrees/feat/relay-imap-host-20261006/.maestro/verification/host-03-proof-authority/`.

Source delta **1 file, +25/-4 = 29 changed lines**:
`src/main/plugins/plugin-tool-run-identity.ts`. Added host-only `revokeAgent` using
canonical agent validation and existing synchronous removal/cleanup, bounded
exact-agent reentrant fence and run snapshot. Same-agent resolution/replacement
issuance deny during fan-out; other agents remain isolated. Added exact proof/
handle length prechecks before regex validation. Existing manager/shared protocol
and every other source/package file are unchanged by this task. Contract updated
at `docs/relay-imap-host-contract-20261006.md` with actual types and remaining seams.

Retained canonical contracts: host-private caller context has callerAgentId:string,
AbortSignal and assertActive(); resolved invocation adds exact pluginId. Shared
host-to-child tool control carries opaque optional invocationId:string|null only,
never serialized agent authority. The manager resolves actual injected registry
proofs and passes registry-issued contexts, with live feature/record/child checks.
None of these are new public SDK exports. Host API **1.16.0**, SDK **0.11.0**;
no new mail capabilities/methods or version bump. Relay minHostApi **1.22.0** remains
an explicit unsatisfied compatibility gate.

Exact commands, cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

```bash
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-tool-run-identity.ts
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/plugin-tool-run-identity.ts src/main/plugins/plugin-manager.ts src/shared/plugins/rpc-protocol.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/plugin-tool-run-identity.ts src/main/plugins/plugin-manager.ts src/shared/plugins/rpc-protocol.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-tool-run-identity.ts src/main/plugins/plugin-manager.ts src/shared/plugins/rpc-protocol.ts
git diff --check
```

Each **exit 0**, no type/ESLint/whitespace diagnostics. Task-delta
`git diff --no-index --check` before/current source returned **exit 1** for expected
file differences with empty diagnostics. Final document formatting/whitespace and
single-checkbox/source-preservation audit are recorded in commands.json/audit.json.
These are isolated static checks, not normal repository gates or runtime tests.
**Product tests created/run: 0/0; mock-tested false; production-tested false.**
Existing local dependencies reused through a temporary worktree-local node_modules
symlink, removed after checks, without install/shared dependency mutation. Actual
registry agent-wide revoke/reentrant/concurrent isolation/late-denial test coverage
is retained in HOST-03's unchecked test-creation task; execution remains HOST-05.

Static review: exact-agent fence precedes all abort callbacks, bounds fan-out/state,
uses existing delete-before-abort cleanup and clears in finally; run checks guard
both existing contexts and nested invocation admission. No mutable current-agent
state or permissive fallback. All authority assertions remain trusted synchronous
throw-on-denial callbacks; production must inject live membership and actual run
lifetime, revoke on deletion/exit/stop and preserve current risk/consent gates.
Future lifecycle wiring must not treat transient revokeAgent as a durable tombstone.
MCP proof delivery, production membership/invocation ingress, public SDK/policy/
setup/lifecycle/event/Cue and runtime security/restart acceptance remain unfinished.
Full host acceptance **unsatisfied**; no operational readiness claim.

CLI `tab show` and `agent-run list --limit 6 --json`: **exit 0**, success true;
raw observations retained locally. Owner `0af39dab-3c06-40de-9077-99207660c1e9`;
execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider session **null**.
Observed run `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791336419198:1791336419339:2c3n2u` (**running** at observation), spawned session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791336419198`. Original launch `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i`.
Branch `feat/relay-imap-host-20261006`; base/current HEAD `1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`.
**Uncommitted; no commit/push/PR**: acceptance and required normal gates remain
unfinished and conditional review/commit/PR belong to HOST-05. Previous Backstage
coordination remains unchanged. No new consult/dispatch/relaunch/callback/Discord,
install/upstream merge/deployment, native/keyring/account-storage/network runtime,
credential retrieval or provider/mail login. Source/test/git operations stayed in
registered worktree; only shared playbook/evidence writes occurred outside it.

# HOST-03 — optional proof-bearing WebSocket ingress source prerequisite

Executed exactly one new self-contained source checkbox, inserted into
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-03.md`
before the existing broad propagation task. The broader task remains unchecked:
its production identity/lifecycle obligations are still unavailable. No test
creation/execution or next source task was performed.

## Actual code, contract and limitations

- Changed only `src/main/web-server/handlers/messageHandlers/plugins.ts` and
  `src/main/plugins/plugin-manager.ts` in this task. Relative to the saved input,
  manager delta **13 added/2 removed**, web handler delta **78 added/36 removed**:
  **2 source files, 129 changed lines**, below the <500 source-line limit. Existing
  sandbox/entry/protocol/registry/account code and all tests were preserved.
- Own envelope `runToken` presence selects actual manager verified ingress,
  outside model args; no caller/session ID is proof. Explicit undefined/null/
  malformed/forged/expired/revoked proofs or missing injected dependencies deny
  with no ordinary fallback. Missing proof retains ordinary invocation with null
  nested authority. Existing declared-tool and Pianola HIGH-risk gates remain.
- Manager accepts an optional captured host-only synchronous result publisher.
  After actual sandbox settlement it rechecks retained run/record/exact child/
  feature/consent/lifetime. Web publisher checks captured socket/open state,
  singleton/feature, retained assertion, and singleton/socket again before
  synchronous correlated send. No extra await gap precedes verified success;
  request ID/proof/socket are snapshotted. Verified exceptions use fixed codes;
  the proof is neither risk text nor forwarded/logged/echoed by this seam.
- Existing per-call frozen second handler argument, opaque nested handles,
  concurrent isolation, caps/timer/listener/abort/stop/exit cleanup are reused.
  Nested handles are released at sandbox settlement, while parent authority
  guards delivery. Disconnect is checked at admission/publication; no new early
  disconnect cancellation or plugin-computation kill behavior was implemented.
- Updated `docs/relay-imap-host-contract-20261006.md` with exact actual manager
  signature and private WebSocket envelope/publication semantics, trust obligations,
  ordinary path, cleanup and string/post-send limits. This is implemented and
  static-checked only, **not mock-tested or production-tested**. No actual
  issuance, membership/consent injection, MCP proof delivery, public mail API/
  SDK/capability/version, setup, event/watch/checkpoint or Cue integration exists.
  Host API **1.16.0**, SDK **0.11.0**; Relay's minHostApi **1.22.0** is unsatisfied.
- Added deferred actual registry/manager/sandbox/web composition security coverage
  to HOST-03 and the contract: forged/absent/present-invalid proof/no fallback,
  identity spoofing, risks, fixed errors/no proof disclosure, concurrency/realm,
  correlation, revocation across awaits/cleanup/reentrant callbacks, replaced/
  closed transport/singleton, publisher success/failure and ordinary/cleanup
  regressions. Creation remains HOST-03; execution remains HOST-05.

## Exact checks and execution identity

All checks ran with cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Receipts are in
`.maestro/verification/host-03-web-tool-ingress/` (`commands.json`, check logs,
`source-delta.diff`, saved input sources/docs, source hash snapshot, `tab.json`,
`runs.json`, `launch.json`; final document/scope audit in `audit.json`). Existing
local dependencies were reused through a temporary worktree-local `node_modules`
symlink, removed after checks. No install or shared dependency mutation.

Initial source formatting:
`node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-manager.ts src/main/web-server/handlers/messageHandlers/plugins.ts`:
**exit 0**, both unchanged after source edits.

- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --resolveJsonModule --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/plugin-manager.ts src/main/web-server/handlers/messageHandlers/plugins.ts`: exit **0**; `check-0.log`.
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/plugin-manager.ts src/main/web-server/handlers/messageHandlers/plugins.ts`: exit **0**; `check-1.log`.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-manager.ts src/main/web-server/handlers/messageHandlers/plugins.ts`: exit **0**; `check-2.log`.
- `git diff --check`: exit **0**; `check-3.log`.
- `git diff --no-index --check -- /home/chris/code/worktrees/feat/relay-imap-host-20261006/.maestro/verification/host-03-web-tool-ingress/plugin-manager.ts src/main/plugins/plugin-manager.ts`: exit **1** (expected file differences, no whitespace diagnostics).
- `git diff --no-index --check -- /home/chris/code/worktrees/feat/relay-imap-host-20261006/.maestro/verification/host-03-web-tool-ingress/plugins.ts src/main/web-server/handlers/messageHandlers/plugins.ts`: exit **1** (expected file differences, no whitespace diagnostics).

Final document formatting and static source/checkbox-preservation audit are
recorded separately in `final-commands.json`/`audit.json`. These isolated static
checks do not constitute SDK drift/type parity, normal repo gates or runtime
acceptance. **Product tests created/run: 0/0.** Full required Host/SDK/Cue suites
and normal formatting/type/lint/test gates remain in their later execution task.
No test pass or runtime security/readiness claim is made.

Observed CLI `tab show` and `agent-run list --limit 3 --json`: **exit 0**,
success true. Owner from retained LAUNCH receipt:
`0af39dab-3c06-40de-9077-99207660c1e9`; registered execution agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`. Execution tab/sessionId
`5262895a-6b3d-43fa-92cc-17449cdfa06f`; provider agentSessionId **null**.
Observed task run
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791336687487:1791336687742:da0279`
(**running** at observation); spawned session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791336687487`. Original launch
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i`.
Branch `feat/relay-imap-host-20261006`; base/current HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`.

**Uncommitted; no commit/push/PR**: host acceptance, production wiring and required
normal gates remain unfinished; conditional review/commit/PR is assigned to
HOST-05. Backstage coordination remains the previously recorded evidence; no new
consult/handoff was required for this private seam. No relaunch, dispatch,
completion callback, Discord/direct API, install, upstream merge, deployment,
real credential access, live socket/mail/provider login or live Cue mutation.
Source/test/git operations remained inside the registered worktree; only authorized
shared playbook/evidence changes occurred outside it. Full host acceptance remains
**unsatisfied**. This source prerequisite can be checked after final static audit;
the broader propagation, test and integration tasks must remain unchecked.

Final verification: document format/write/check and tracked whitespace each exited **0**; task-delta document whitespace checks each exited **1** with no diagnostics (expected differences). Static scope/checkbox audit exited **0**: exactly the new WebSocket ingress prerequisite is checked; all prior checkboxes and HOST-02 are preserved, exactly the two intended source files changed, every test is unchanged, dependency symlink is removed, and branch/HEAD are unchanged. `final-commands.json` and `audit.json` retain these results.

# HOST-03 optional MCP proof transport — 2026-10-07

Completed one unchecked self-contained MCP adapter source task from
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-03.md`.
The broader caller propagation task stays unchecked because production wiring is
unfinished. Implementation/test creation/test execution remain separate.

Actual source diff: `src/cli/commands/mcp.ts` **+76/-3**,
`src/cli/services/mcp-bridge.ts` **+52/-16**,
`src/shared/plugins/mcp-agent-config.ts` **+13/-0**: three files,
**141 additions + 19 deletions = 160 changed source lines**, under 500.
Adapted reviewed local comparison read-only (SHA-256 inputs retained), captured
private proof outside model args, bounded canonical private-file consumption,
explicit invalid configured proof denial, fixed proof-mode errors and existing
provider/Codex ordering. Config selection overrides inherited/conflicting env,
ordinary path carries no mail authority. No proof issuer, public surface/version,
production registry/lifetime injection, private-file creation/cleanup or actual
read acceptance is claimed. Windows ACL protection belongs to deferred issuer.
Contract details: [[relay-imap-host-contract-20261006]], final subsection.

Static commands ran with cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`, using existing read-only
local dependencies through a temporary worktree-local node_modules symlink only.
No installation/shared dependency writes. Symlink is removed at final audit.

- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --resolveJsonModule --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/cli/services/mcp-bridge.ts src/cli/commands/mcp.ts src/shared/plugins/mcp-agent-config.ts`: exit **0**; `.maestro/verification/host-03-mcp-proof-transport/final-check-0.log`.
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/cli/services/mcp-bridge.ts src/cli/commands/mcp.ts src/shared/plugins/mcp-agent-config.ts`: exit **0**; `.maestro/verification/host-03-mcp-proof-transport/final-check-1.log`.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/cli/services/mcp-bridge.ts src/cli/commands/mcp.ts src/shared/plugins/mcp-agent-config.ts`: exit **0**; `.maestro/verification/host-03-mcp-proof-transport/final-check-2.log`.
- `git diff --check`: exit **0**; `.maestro/verification/host-03-mcp-proof-transport/final-check-3.log`.

Initial strict TypeScript exited **2** with five TS2339 diagnostics from this
change's catch-result inferred union. Fixed by naming/reusing the private desktop
reply interface; final strict check exited **0**. This was a corrected task
regression, not an inherited baseline failure. Initial ESLint/format/whitespace
checks exited **0**; retained `commands.json`/`check-0.log`, with final results in
`final-commands.json`. Source format writes exited **0**. Final documentation
format/whitespace and scope audits are retained separately after this report.
**Product tests created/run: 0/0**. No test suite, SDK build/drift/type parity,
Cue acceptance, full normal repo gates or runtime/native/file-reader/network test
executed. Static verification is not security/runtime/production acceptance.
Deferred requirements are added to HOST-03; creation remains there, execution
remains HOST-05, with actual registry/manager/sandbox/realm and synthetic data.

Observed `tab show ... --json` and `agent-run list --limit 3 --json` each exited
**0**, success true; full receipts in
`.maestro/verification/host-03-mcp-proof-transport/`.
Owner from retained LAUNCH: **0af39dab-3c06-40de-9077-99207660c1e9**;
registered execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**;
execution tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**;
provider agentSessionId **null**.
Observed task run
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791337064389:1791337064535:a4gmke**
was **running** at observation; spawned session
**228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791337064389**.
Original launch
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**.
Branch **feat/relay-imap-host-20261006**, base/current HEAD
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45** (rc).

**Uncommitted; no stage/commit/push/PR.** No-PR reason: full host acceptance,
production wiring and required normal gates remain unfinished; conditional review
and PR belongs to HOST-05. Earlier work preserved. Backstage coordination remains
previously recorded evidence; no new public contract/handoff/consult is required
for this private transport task. No duplicate launch, dispatch, completion callback,
Discord/direct API, installation, upstream merge, deployment, real credential
access, live mail/provider login or live Cue mutation. Source/test/git operations
remain inside the registered worktree; only authorized shared playbook/evidence
writes occurred outside it. Full feature acceptance **unsatisfied**.

Final verification: forced documentation formatting/write/check and tracked
whitespace each exited **0**. All seven source/document task-delta whitespace
checks exited **1** with no diagnostics (expected differences). Scope audit
exited **0**: only the three MCP sources and two host docs changed, all unrelated
source/test hashes and HOST-02 preserved, selected MCP task alone checked, one
secure issuer follow-up added unchecked, other prior checkbox states preserved,
160 changed source lines, node_modules symlink removed and branch/HEAD unchanged.
Receipts: `.maestro/verification/host-03-mcp-proof-transport/`
`document-commands.json`, `final-commands.json` and `audit.json`.

# HOST-03 private run-proof file issuer resource - 2026-10-07

Completed exactly one previously unchecked self-contained source task in
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-03.md`: host-private bounded run-proof file issuer/cleanup.
The broader propagation, production issuance, test-creation and test-execution
checkboxes remain unchecked. Prior work was preserved; no second task executed.

## Actual source and contract

New `src/main/plugins/plugin-tool-run-proof-file.ts`: **+357/-0**, one source
file, **357 changed source lines**, fewer than 500. Exports host-only
`PluginToolRunProofFiles` and `PluginToolRunProofFile`; composes actual existing
`PluginToolRunIdentity.issue/resolve` and its captured registry abort signal.
No new proof registry/singleton, model-supplied identity, generic secret API,
production caller, public mail surface or version change.

The owner reserves bounded resources before reentrant admission, checks canonical
absolute private POSIX 0700 owner directories and non-writable owned ancestors,
creates a private per-run directory, opens exclusive/no-follow/nonblocking 0600
single-link regular files and writes exactly the registry's 64 lowercase hex bytes.
A bounded 65-byte readback compares exact bytes, with fd/path/device/inode/mode/
owner/link/size/mtime/ctime checks and live registry reauthorization before success.
Buffers are erased and descriptor close is attempted on every exit. Only a frozen
host-owned path/signal/assert/dispose resource is returned for later config wiring.

Dispose/abort/expiry/direct revoke/revokeAgent/registry stop revoke before cleanup;
owner stop fences first and attempts all cleanup. Exact inode checks, unlink/rmdir
and absence confirmation refuse substituted/unknown files and recursive deletion.
In-progress synchronous creation defers cleanup to finally; resource/cleanup
reentrancy is fenced. Filesystem/cleanup failure permanently stops issuance,
revokes siblings before cleanup fan-out, retains bounded failed slots for explicit
retry and never resets the latch. The existing 512-run cap includes pending and
failed resource slots. Only Linux/macOS with uid/no-follow/directory capabilities
are admitted; **Windows/other unsupported platforms deny before issue/I/O** until
verified ACL support exists. No real issuer or proof file was created/invoked.

Updated `docs/relay-imap-host-contract-20261006.md` with exact implemented private
API, root/caller obligations, early Windows denial, bounds, cleanup/latches and
honest same-user/crash limits. Added deferred actual-registry/filesystem failure,
revoke/cap/reentrant/cleanup/readback/isolation/platform tests in HOST-03; test
creation stays separate, execution stays HOST-05. Utility/process/plugin guides
and source were searched; comparison helper reviewed read-only, SHA-256 in
`comparison-input.json`. Its permissive singleton/temp/unbounded cleanup was not
copied. No other source/test file changed relative to saved input hashes.

**Implemented/static-checked only; not mock-tested or production-tested.**
Synchronous local filesystem operations cannot be interrupted inside the OS; no
network-filesystem support, same-user/tier-1 isolation, secure deletion/JS string
erasure or crash-orphan scan is claimed. Orphan bytes do not reestablish restarted
registry authority. Unknown/replaced files/directories or close/deletion failures
can leave bounded revoked resources; retry cannot restore authority/readiness.
Future production wiring must supply an existing private local directory outside
project/Vault, actual live membership/run authority and the same ingress registry,
verified supported provider paths and exit/stop/spawn-failure disposal. No interactive/
Cue/CLI production caller, account setup/public SDK/RPC/mail event/checkpoint/Cue
integration or runtime acceptance exists. Host API **1.16.0**, SDK **0.11.0**;
Relay minHostApi **1.22.0** remains unsatisfied. Full host acceptance **unsatisfied**.

## Exact checks and evidence

All source/test/git commands ran with cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Receipts: `.maestro/verification/host-03-proof-file-issuer/`: source/docs input hashes,
comparison provenance, saved documents, `commands.json`, `check-*.log`,
`document-commands.json`, `tab.json`, `runs.json` and `git-before.json`.
A temporary worktree-local node_modules symlink reused existing dependencies only;
no install/shared dependency mutation. It is removed before final audit.

- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --resolveJsonModule --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/plugin-tool-run-proof-file.ts`: exit **0**; `check-0.log`.
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/plugin-tool-run-proof-file.ts`: exit **0**; `check-1.log`.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-tool-run-proof-file.ts`: exit **0**; `check-2.log`.
- `git diff --check`: exit **0**; `check-3.log`.
- `git diff --no-index --check -- /dev/null src/main/plugins/plugin-tool-run-proof-file.ts`: exit **1**; `check-4.log`.

The no-index whitespace exit **1** indicates expected new-file differences with
**no diagnostics**. Strict TypeScript, ESLint, source formatting and tracked
whitespace all exited **0**. Initial source formatting writes and initial strict
TypeScript/ESLint also exited 0; no check regression occurred. Contract/playbook
format/write/check each exited **0**, retained in `document-commands.json`.
Final all-document/source format, whitespace and preservation audit are recorded
separately after this report. These are isolated static checks, not normal full
repository gates, SDK drift/type build, security/runtime/Cue suites or CI evidence.
**Product tests created/run: 0/0.** No test suite or issuer runtime was invoked.
Full normal gates and actual security/restart acceptance remain HOST-05.

CLI `tab show` and `agent-run list --limit 3 --json`: exit **0**, success true.
Owner from retained LAUNCH **0af39dab-3c06-40de-9077-99207660c1e9**;
registered execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**;
execution tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**;
provider agentSessionId **None**.
Observed task run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791337435128:1791337435267:rm47cn** was **running** at observation;
spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791337435128**.
Original launch **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**.
Branch **feat/relay-imap-host-20261006**, base/current HEAD
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45** (rc).

**Uncommitted; no stage/commit/push/PR.** No-PR reason: production wiring, host
acceptance and required normal gates are unfinished; conditional review/commit/PR
belongs to HOST-05. Existing Backstage coordination remains the earlier retained
records; no new consult/dispatch/public contract handoff was needed for this private
resource. No relaunch, completion callback, Discord/direct API, installation,
upstream merge/deployment, real credential access, native keyring/account storage,
live provider/mail login or user Cue mutation. Source/test/git operations remained
in the registered worktree; only authorized shared playbook/evidence writes occurred
outside it. Exactly the selected issuer source checkbox is complete; all broader
source, test and full acceptance obligations remain unchecked.

Final verification: all four source-task documents formatted/wrote/checked with
**exit 0**; tracked whitespace **exit 0**; all five task-delta whitespace checks
**exit 1** with no diagnostics (expected differences). Static scope/checkbox audit
**exit 0**: exactly one new source file (**357 additions/0 deletions**) plus the
two host docs changed; all prior sources/tests and checkbox states preserved,
only the selected issuer task checked, deferred requirements added without test
creation, dependency symlink removed and branch/HEAD unchanged. Receipts:
`.maestro/verification/host-03-proof-file-issuer/final-document-commands.json`,
`final-whitespace-commands.json`, `audit.json`, `final-hashes.json` and
`task-delta-*.diff`. Final evidence-only append formatting/check is recorded in
`report-commands.json`. No runtime, test, commit/push/PR or next task performed.

## HOST-03 manager run-proof issuance prerequisite — 2026-10-07

Completed one split source task in registered `/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Spawn caller wiring needs
an issuance boundary tied to the existing verified-ingress registry, so HOST-03 now
contains this prerequisite and a separate unchecked production injection task.
The original interactive/Cue propagation and all broader acceptance tasks remain
unchecked. No subsequent task was executed.

Only two source files changed: `src/main/plugins/plugin-manager.ts` captures
`toolProofFiles` and exposes host-only `createToolRunProofFile`; the existing issuer
`src/main/plugins/plugin-tool-run-proof-file.ts` adds exact-registry `assertIdentity`.
Issuance requires the same actual registry used by verified tools, actual issuer,
required sandbox/record infrastructure and a snapshotted trusted run callback/signal.
Live feature/generation/stop fence/dependency checks surround reentrant callbacks
and issuance; the existing resource is rechecked before return. No token getter,
RPC/SDK/version/capability surface or new registry/singleton/store is added.
Stop-all fences admission, aborts old-generation run resources before sandbox
callbacks, and restores its prior stop fence after nested stops/errors. Old proofs
stay dead after re-enable; registry caps/expiry and issuer cleanup failure latches
are reused. Errors contain fixed codes, no raw causes, token or proof path.

**Implemented/static-checked only.** Mock-tested/production-tested false.
Production registry/resource/private-directory construction, matching ingress
injection, host membership/record/child enforcement, immediate feature/replacement/
shutdown cancellation and interactive/Cue/CLI spawn/exit/kill/replay cleanup are
still unimplemented. The added production task precedes existing spawn wiring.
Existing MCP spawns remain ordinary, with no mail authority. POSIX/Windows/same-user/
crash orphan and failed-cleanup limits remain those of the issuer. Full host
acceptance unmet; host API **1.16.0**, SDK **0.11.0**, Relay minHostApi **1.22.0**
unsatisfied. Deferred actual manager/registry/issuer security coverage was added;
**product tests created/run: 0/0**. No suites, real proof files, keyring/store,
native/network/provider/mail or live agent experiments ran.

### Exact static checks and provenance

All source/test/git commands ran with cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Existing dependencies were
reused through a temporary worktree-local symlink; no install or shared dependency
mutation. The symlink was removed after checks. Receipts and before snapshots:
`.maestro/verification/host-03-manager-proof-issuance/`.

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-manager.ts src/main/plugins/plugin-tool-run-proof-file.ts`: exit **0**; `check-0.log`.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --resolveJsonModule --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/plugin-manager.ts src/main/plugins/plugin-tool-run-proof-file.ts`: exit **0**; `check-1.log`.
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/plugin-manager.ts src/main/plugins/plugin-tool-run-proof-file.ts`: exit **0**; `check-2.log`.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-manager.ts src/main/plugins/plugin-tool-run-proof-file.ts`: exit **0**; `check-3.log`.
- `git diff --check`: exit **0**; `check-4.log`.

Strict TypeScript/ESLint/format/whitespace all passed, with no diagnostics.
These are isolated static checks, not repository normal gates/runtime/security/Cue
or SDK tests. Final document formatting/task-delta whitespace and source/test/
checkbox preservation audit are recorded separately in this receipt directory.

CLI `tab show ... --json`: exit **0**, success true. First `agent-run list --agent
... --limit 3 --json`: exit **1**, unsupported `--agent` option, no state mutation.
`agent-run list --help`: exit **0**; corrected `agent-run list --limit 5 --json`:
exit **0**, success true. Exact CLI records: `cli-commands.json`, `cli-0.json`,
`runs.json`, `selected-run.json` (failed invocation stderr retained).
Owner from existing LAUNCH: **0af39dab-3c06-40de-9077-99207660c1e9**.
Execution agent: **228eef8c-75a8-46e8-bb67-2903da23bc06**.
Execution tab/sessionId: **5262895a-6b3d-43fa-92cc-17449cdfa06f**.
Provider agentSessionId: **null**. Observed run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791337969142:1791337969286:bd742f**:
**running** at observation, spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791337969142**.
Branch **feat/relay-imap-host-20261006**, base/HEAD
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**.

**Uncommitted; no stage/commit/push/PR.** Production wiring, host acceptance and
normal gates remain incomplete; conditional review/commit/PR stays HOST-05.
No relaunch, new consult/dispatch, callback/Discord/direct API, install, upstream
merge/deployment, live mail login, actual credential retrieval or user Cue changes.
Only the authorized shared playbook/evidence directory was written outside the
registered worktree. Exact outcomes reported in this execution tab.

Final verification: exactly **2 source files, 89 additions/2 deletions**;
all other sources/tests unchanged and all prior checkbox states preserved.
Only the new manager prerequisite is checked; its production injection follow-up
and original broad tasks remain unchecked. Document format/write/check, tracked
whitespace, unstaged-only audit and static scope/checkbox audit each exited **0**.
All six task-delta whitespace checks exited **1** with no diagnostics (expected
file differences). Dependency symlink removed; branch/HEAD unchanged. Receipts:
`.maestro/verification/host-03-manager-proof-issuance/{final-commands,delta-commands,audit,final-hashes}.json`.
Final evidence-append checks are in `report-commands.json`. No next task, runtime,
product test or commit/push/PR performed.

## HOST-03 private proof-directory prerequisite — 2026-10-07

Completed one newly split self-contained source prerequisite from
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-03.md`. Production composition needs provisioning plus
index/manager/singleton lifecycle changes (four source files); the three-file
limit requires this split. The original production checkbox and every other
prior checkbox remain unchanged/unchecked as applicable. Only this prerequisite
is checked after static verification. Full host acceptance remains **unsatisfied**.

Source: `src/main/plugins/plugin-tool-run-proof-file.ts`, **one file,
67 additions/22 deletions (89 changed source lines)** against the saved entry
snapshot. Reused the actual resource owner/registry and its canonical validator;
added supported-platform-first private-root provisioning, preflight before a
fixed nonrecursive 0700 child mkdir, EEXIST strict validation and captured-base
identity rechecks. Root and per-run constructor privacy remain exact 0700;
base permits current-owner 0755/0750 without write/special bits. File identity
comparison moved to the same canonical static method; issuer/revoke/cleanup
logic is otherwise unchanged. Errors are fixed MAIL_UNAVAILABLE without paths
or raw OS causes. No new production calls, credentials or proof-file bytes.

Location-policy selection outside project/Vault, authoritative membership/run
signals, matching manager/sandbox injection, sealed record/child checks,
feature/manager replacement/shutdown and spawn/exit/kill cleanup remain the
original unchecked production tasks. Same-user threats, synchronous OS stalls,
mode/ACL limitations, failed preflight empty root and crash orphan recovery are
explicit limitations. Host API **1.16.0**, SDK **0.11.0**, Relay minHostApi
**1.22.0** unchanged; public mail setup/RPC/SDK/events/Cue remain unfinished.
**Product tests created/run: 0/0; mock-tested false; production-tested false.**
No provisioning constructor/factory, proof issuer, native/storage/network/provider
or live mail runtime invocation in this task. Static checks are not runtime tests.

Exact source checks (cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`), all exit 0:

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-tool-run-proof-file.ts` — exit **0**, `check-0.log`.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --resolveJsonModule --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/plugin-tool-run-proof-file.ts` — exit **0**, `check-1.log`.
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/plugin-tool-run-proof-file.ts` — exit **0**, `check-2.log`.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-tool-run-proof-file.ts` — exit **0**, `check-3.log`.
- `git diff --check` — exit **0**, `check-4.log`.

Receipts under `.maestro/verification/host-03-proof-directory/`: entry snapshots,
source/test/package before hashes, commands/exits/logs, source and document task
deltas, static review, CLI receipts, launch receipt and final scope audit.
Existing local dependencies reused via a temporary worktree-only node_modules
symlink; no installation/shared dependency mutation. It is removed before audit.
Document formatting and final task-delta/whitespace/audit results recorded below.

CLI `node /opt/Maestro/resources/maestro-cli.js tab show
5262895a-6b3d-43fa-92cc-17449cdfa06f --json` and
`node /opt/Maestro/resources/maestro-cli.js agent-run list --limit 5 --json`
both exited **0**, success true (`cli-commands.json`). The retained run receipt
projects IDs/status/cwd/provider/timestamps; prompt text is omitted.
Owner **0af39dab-3c06-40de-9077-99207660c1e9**, execution/worktree agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**, tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**,
provider session **null**. Observed current task run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791338271368:1791338271509:w0pn0o**,
status **running** at read; spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791338271368**.
Original launch **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**, launch exit **0**, callback **null**.
No new Backstage consult/dispatch; prior coordination unchanged.

Branch `feat/relay-imap-host-20261006`, registered worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`;
base/HEAD **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45** unchanged.
**Uncommitted; no stage/commit/push/PR.** Acceptance/normal gates and public
production integration remain unfinished; conditional packaging belongs to HOST-05.
No install/upstream merge/deploy/login/callback/Discord, live user Cue change,
other-checkout source/test/git write, new engine or next task. Only shared playbook
and evidence writes outside this registered worktree.

Final verification: documentation format/write/check, tracked whitespace,
unstaged-only check and static scope/checkbox audit each **exit 0**. All five
source/document task-delta whitespace checks **exit 1** with empty diagnostics
(expected file differences). Exactly **one source file, 67 additions/22 deletions**;
**5,159** other source/test/package files and all **15** prior checkbox states
preserved; only the new provisioning prerequisite is checked. Dependency symlink
removed; branch/HEAD unchanged. `final-commands.json`, `delta-commands.json`,
`audit.json` and `final-hashes.json` retain exact receipts in worktree
`.maestro/verification/host-03-proof-directory/`. Final evidence-append checks
are recorded in `report-commands.json`. No runtime, product test, commit/push/PR
or next task performed.

## HOST-03 permanent manager proof retirement prerequisite — 2026-10-07

Completed exactly one newly split source prerequisite from shared HOST-03 in
registered `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch
`feat/relay-imap-host-20261006`. Production construction/injection requires a safe
outgoing-manager retirement boundary first. Original production injection and all
other prior checkboxes remain unchanged; only this prerequisite is checked. No
next task, test creation or suite execution performed. Full acceptance **unmet**.

Changed `src/main/plugins/plugin-manager.ts` and
`src/main/plugins/plugin-manager-singleton.ts`: **2 files, 63 additions/0 deletions**
relative to saved entry snapshots. `stopToolAuthority` permanently fences issuance,
verified completion/publication and manager generation before stopping the actual
registry, aborting run lifetime and stopping the actual proof-file owner. Every
cleanup step is attempted despite failure; fixed `MAIL_UNAVAILABLE`, no raw causes
or proof/path logging. Repeated retirement preserves cleanup retry and never
resets authority. The singleton detaches manager/predicate before replacement/clear
cleanup, rejects stale reentrant transitions (including clear while null), retires
abandoned candidates, preserves exact newer adoption and same-live-manager runs.
Ordinary plugin tools/commands and temporary feature-stop semantics are preserved.
Existing canonical lifetime/registry/issuer patterns were reused; no public SDK,
RPC/capability/version/new singleton/store/registry or production issuer was added.
Contract and deferred actual-composition/security/regression requirements updated.

**Implemented/static-checked only; mock-tested false; production-tested false.**
No production registry/resource/private-directory selection, host membership,
live sealed record/child injection, immediate feature/shutdown hook or interactive/
Cue/CLI spawn/exit/kill wiring exists yet. Shutdown currently uses temporary sandbox
stop; singleton replacement fencing is source-wired but no real proof runtime
was invoked. Retained cleanup failures may leave bounded revoked resources and
need retained old owner/method for retry; no secure deletion, crash orphan scan,
same-user isolation or Windows ACL guarantee. Public setup/mail SDK/events/Cue
acceptance still unfinished. Host API **1.16.0**, SDK **0.11.0**, Relay minHostApi
**1.22.0** unsatisfied. Product tests created/run **0/0**.

### Exact verification and provenance

All source/test/git commands used cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Existing local tools reused via temporary worktree-only node_modules symlink;
no install or dependency mutation. Removed before final preservation audit.
Receipt directory: `.maestro/verification/host-03-manager-proof-retirement/`,
including source/document snapshots, before hashes, `commands.json`, `check-*.log`,
`source-numstat.json`, `static-review.md`, CLI and launch receipts and final audit.

- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-manager.ts src/main/plugins/plugin-manager-singleton.ts`: exit **0**, `check-0.log`.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --esModuleInterop --resolveJsonModule --target ES2022 --module commonjs --types node --typeRoots /home/chris/code/Maestro/node_modules/@types src/main/plugins/plugin-manager.ts src/main/plugins/plugin-manager-singleton.ts`: exit **0**, `check-1.log`.
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/plugin-manager.ts src/main/plugins/plugin-manager-singleton.ts`: exit **0**, `check-2.log`.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-manager.ts src/main/plugins/plugin-manager-singleton.ts`: exit **0**, `check-3.log`.
- `git diff --check`: exit **0**, `check-4.log`.

These strict TypeScript/ESLint/source formatting/tracked whitespace checks each
passed without diagnostics. They are isolated static checks, not repository normal
full gates, SDK drift/type build, runtime/security/Cue suites or CI evidence.
Document formatting/task-delta whitespace and preservation results follow below.

CLI `tab show 5262895a-6b3d-43fa-92cc-17449cdfa06f --json` and
`agent-run list --limit 5 --json` each exit **0**, success true. Current observed
run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791338588010:1791338588155:51rhsv**, status **running** at read,
spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791338588010**.
Owner **0af39dab-3c06-40de-9077-99207660c1e9**, execution/worktree agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**, execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider session **null**.
Original launch **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**, launch exit **0**, callback **null**.
Branch `feat/relay-imap-host-20261006`, unchanged HEAD/base/rc merge-base
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**.

**Uncommitted; no stage/commit/push/PR.** Full production integration/acceptance
and normal gates are unfinished; conditional packaging remains HOST-05. No new
Backstage consult/dispatch; prior retained coordination remains unchanged and no
new public handoff was needed for this private lifecycle prerequisite. No install,
upstream merge/deploy, real credential/keyring/store/network/provider/mail runtime,
login, callback, Discord/direct API, relaunch, user Cue mutation or other-checkout
source/test/git write. Only authorized shared playbook/evidence writes outside the
registered worktree. Exact code/test/PR outcomes reported in this execution tab.

Final verification: all four documents formatted/wrote/checked with **exit 0**;
tracked whitespace, unstaged-only check and static preservation audit **exit 0**.
Six source/document task-delta whitespace checks each **exit 1** with no diagnostics
(expected file differences). Exactly **2 source files, 63 additions/0 deletions**;
**5,160** other source/test/package files and all **16** prior checkbox states
preserved. Only the new retirement prerequisite is checked; production injection
and all broader tasks remain unchecked. Dependency symlink removed; branch/HEAD
unchanged. Receipts: `final-commands.json`, `delta-commands.json`, `audit.json` and
`final-hashes.json` under registered worktree
`.maestro/verification/host-03-manager-proof-retirement/`. Final evidence append
format/check/whitespace results are in `report-commands.json`. No runtime, product
test, next task or commit/push/PR performed.

## HOST-03 feature-disable and confirmed-quit lifecycle prerequisite — 2026-10-07

Completed exactly one newly split bounded source task in registered
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch `feat/relay-imap-host-20261006`.
Production injection needed immediate stop hooks before admitting proof-bearing
runs. Only this lifecycle prerequisite is checked; original production injection,
propagation/spawn and all other prior checkboxes remain unchanged. No next task.

Source changes: `src/main/index.ts`, `src/main/app-lifecycle/quit-handler.ts`,
`src/main/plugins/plugin-manager-singleton.ts`: **3 files, 74 additions/5 deletions**
relative to retained entry snapshots. Feature disable now stops through the
manager's existing generation/run fence before sandbox callbacks, retains the
no-manager fallback and attempts grouping/view cleanup after fixed stop errors.
Confirmed cleanup calls a host-only retirement dependency before persistence/watch/
process callbacks. The accessor permanently fences/detaches ingress and predicate,
invalidates in-flight transitions, retires actual authority, rejects/retire later
candidates and retains one bounded owner for explicit cleanup retry. Reentrant
shutdown and same-owner registration avoid recursive cleanup. The main callback
also retires a different constructed manager even after accessor failure; quit
continues with a fixed content-free message. Pending/cancelled quit is unaffected.
Reused canonical manager/accessor/quit seams; no new registry/store/singleton,
public RPC/SDK/capability/version, credentials or production issuer added.
Contract and deferred actual-composition/security/regression coverage updated.

**Implemented/static-checked only; mock-tested false; production-tested false.**
Actual production registry/resource/membership/private-location/record/child injection
and interactive/Cue/CLI spawn/exit/kill wiring remain unchecked. Hooks have no
production proof owner yet. Failed rejected-candidate cleanup requires caller-held
retry ownership; the accessor retains only its one shutdown owner. Existing OS
stalls/ACL/same-user/crash orphan limitations remain. Full mail acceptance **unmet**;
host API **1.16.0**, SDK **0.11.0**, Relay minHostApi **1.22.0** unsatisfied.
**Product tests created/run: 0/0.** No real lifecycle, proof issuance/files, store,
native, network/provider/mail runtime or suite execution in this source task.

### Exact checks and provenance

All commands used cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`. Existing local dependencies reused by temporary
worktree-only node_modules symlink; no install/shared dependency mutation. Receipts
under `.maestro/verification/host-03-proof-lifecycle/`: before source/docs/checkbox
snapshots/hashes, `commands.json`, `check-*.log`, `source-numstat.json`, CLI receipts,
static review and final scope/whitespace audit.

- Baseline `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json`: exit **0**, `baseline-tsc.log`, no diagnostics.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/index.ts src/main/app-lifecycle/quit-handler.ts src/main/plugins/plugin-manager-singleton.ts`: exit **0**, `check-0.log`.
- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json`: exit **0**, `check-1.log`, no diagnostics.
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/index.ts src/main/app-lifecycle/quit-handler.ts src/main/plugins/plugin-manager-singleton.ts`: exit **0**, `check-2.log`, no diagnostics.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/index.ts src/main/app-lifecycle/quit-handler.ts src/main/plugins/plugin-manager-singleton.ts`: exit **0**, `check-3.log`.
- `git diff --check`: exit **0**, `check-4.log`.

Main-process strict project type-check passes before and after; these static checks
are not full renderer/CLI/SDK gates, runtime/security/Cue/SDK tests or CI evidence.
Document checks and source/test/checkbox preservation outcomes follow in the audit.

CLI `tab show 5262895a-6b3d-43fa-92cc-17449cdfa06f --json` and `agent-run list --limit 5 --json` each
exit **0**, success true (`cli-commands.json`). Observed task run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791338888663:1791338888809:u03tg9**,
status **running** at read; spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791338888663**.
Owner **0af39dab-3c06-40de-9077-99207660c1e9**; execution/worktree agent **228eef8c-75a8-46e8-bb67-2903da23bc06**;
execution tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**; provider session **null**.
Original launch **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**, launch exit **0**, callback **null**.
Branch/base/HEAD/rc merge-base unchanged: **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**.

**Uncommitted; no stage/commit/push/PR.** Full integration/acceptance and normal
gates remain unfinished; review/packaging stays HOST-05. No new Backstage consult/
dispatch or public handoff needed for this private lifecycle prerequisite. No
relaunch, callback/Discord/direct API, install/upstream merge/deploy, mail login,
live user Cue changes or other-checkout source/test/git write. Only authorized
shared playbook/evidence writes outside this worktree. Exact code/test/PR outcomes
reported in this execution tab.

Final verification: all four contract/evidence/playbook documents explicitly
formatted/checked using the worktree-local empty ignore file, **exit 0**
(`document-commands.json`). Main-source formatting, main strict project type-check,
ESLint and tracked whitespace **exit 0**. Unstaged-only check and preservation audit
**exit 0**; exactly **3 source files, 74 additions/5 deletions**, **5,370**
other source/test/package/document files and all **66** prior checkbox states
preserved. Only the new lifecycle prerequisite is checked. Seven task-delta
whitespace checks **exit 1** with empty diagnostics (expected file differences),
`delta-commands.json`. Dependency symlink removed; branch/HEAD unchanged. Receipts:
`.maestro/verification/host-03-proof-lifecycle/{audit,final-hashes,final-commands}.json`.
Final evidence-append format/whitespace/audit results are in `report-commands.json`.
No runtime, product test, next task, commit/push/PR or other-checkout source write.

# HOST-03 — completed verified sandbox context propagation (2026-10-07)

Completed exactly the previously unchecked propagation source task in
`RELAY-IMAP-HOST-03.md`; only that checkbox is newly checked. Reused the actual
prepared WebSocket/manager/registry/sandbox path and closed malformed-context and
verified-completion gaps. Source delta against the captured task baseline:
**3 files, 59 additions/20 deletions**:

- `src/main/plugins/plugin-sandbox-host.ts`: explicit fourth-argument verified
  selection (undefined/null deny), safe positive correlation IDs, bounded JSON
  verified-result snapshot and live nested/child checks before handle release.
- `src/main/plugins/plugin-sandbox-entry.ts`: closed realm payload/handle validation,
  preserved own-field presence before JSON, frozen per-invocation context, captured
  realm checks and correlated sync/async errors, safe verified missing-handler path.
- `src/main/web-server/handlers/messageHandlers/plugins.ts`: fixed verified
  missing-tool/disabled errors; retained main-only proof resolution and synchronous
  manager-authorized publisher with transport checks.

Existing per-call registry handles, limits, 30-second lifetime, pending-map/timer/
listener cleanup and final run/plugin/child publication assertions were retained.
No ambient current-agent state, new utility/store/registry, model-supplied identity
or parent proof forwarded to the child. Ordinary tools retain null context,
commands/panels have no invocation authority. Completion cap is not a preallocation
or arbitrary plugin-output/log sanitization claim. Contract and deferred actual-
composition security/regression requirements updated; no tests created or run.

**Implemented/static-checked only; mock-tested false; production-tested false.**
Production exact-registry/resource/membership/run/sealed-record/child injection and
spawn/exit/kill wiring, trusted setup, nested mail RPC, public SDK/version and Cue
acceptance remain unchecked. Host API **1.16.0**, SDK **0.11.0**, Relay minHostApi
**1.22.0** unsatisfied; full mail acceptance **unmet**. Product tests created/run:
**0/0**. No plugin/proof-file/native/storage/network/provider/mail runtime invoked.

### Exact validation and execution provenance

All commands ran in registered cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`; existing local dependencies were
reused by a temporary worktree-local node_modules symlink, with no install or
shared dependency mutation. Baseline and final strict main-process checks pass.
Receipts: `.maestro/verification/host-03-context-propagation/` (before hashes/source/
doc snapshots, commands/logs, source deltas, CLI identity and preservation audit).

- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json`: baseline **exit 0**, `baseline-tsc.log`; final **exit 0**, `check-0.log`, no diagnostics.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-sandbox-host.ts src/main/plugins/plugin-sandbox-entry.ts src/main/web-server/handlers/messageHandlers/plugins.ts`: **exit 0**, `source-format.log`.
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/plugins/plugin-sandbox-host.ts src/main/plugins/plugin-sandbox-entry.ts src/main/web-server/handlers/messageHandlers/plugins.ts`: **exit 0**, `check-1.log`, no diagnostics.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-sandbox-host.ts src/main/plugins/plugin-sandbox-entry.ts src/main/web-server/handlers/messageHandlers/plugins.ts`: **exit 0**, `check-2.log`.
- `git diff --check`: **exit 0**, `check-3.log`.
- `node .maestro/verification/host-03-context-propagation/verify-bootstrap.cjs`: **exit 0**, `document-0.log` (static Acorn parsing of extracted BOOTSTRAP_SOURCE). No bootstrap/plugin execution; this validates embedded JavaScript syntax, not behavior.

These are static checks, not full repository/renderer/CLI/SDK gates, runtime tests
or CI. Document formatting and final scope/checkbox/hash audit follow in receipts.

CLI `node /opt/Maestro/resources/maestro-cli.js tab show 5262895a-6b3d-43fa-92cc-17449cdfa06f --json`
and `node /opt/Maestro/resources/maestro-cli.js agent-run list --limit 5 --json`:
both **exit 0**, success true. Observed execution run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791339212878:1791339213018:414cof**,
status **running** at read; spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791339212878**.
Owner **0af39dab-3c06-40de-9077-99207660c1e9**; registered execution/worktree agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**; CLI execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider session **null**.
Original launch **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**, launch exit **0**, callback **null**.
Branch **feat/relay-imap-host-20261006**; base/HEAD **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45** unchanged.
Contract: `docs/relay-imap-host-contract-20261006.md`. All playbook documents remain
in `/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-01.md`
through `RELAY-IMAP-HOST-05.md`; original LAUNCH.json retains exact full paths.

**Uncommitted; no stage/commit/push/PR.** Acceptance and normal gates remain
unfinished; conditional review/PR stays HOST-05. No new Backstage consult/dispatch
needed for this internal propagation task. No next task, relaunch, callback,
Discord/direct API, install/upstream merge/deploy, live mail login/credentials or
user Cue mutation. Only authorized shared playbook/evidence writes outside this
worktree. Exact code/test/PR outcomes reported in this execution tab.

Final document formatting/checks and whitespace verification **exit 0**
(`document-commands.json`). Preservation audit **exit 0** (`audit.json`): exactly
three changed source modules (59 additions/20 deletions), two worktree documents,
5,574 other tracked/untracked files unchanged, all 18 existing HOST-03 checkbox
texts retained and only the selected propagation checkbox newly completed. No
unexpected tracked/untracked additions or staged changes; dependency symlink
removed and branch/HEAD unchanged. Durable shared evidence and deferred test
requirements updated. No next task, product tests, commit/push/PR or runtime work.
Final report formatting/whitespace/hashes are retained in `report-commands.json`
and `final-hashes.json`; static results do not establish runtime acceptance.

# HOST-03 - completed production run-proof dependency wiring (2026-10-07)

Completed exactly the previously unchecked production registry/resource composition
source task in `RELAY-IMAP-HOST-03.md`; only that checkbox is newly checked.
Task delta: **2 source files, 158 additions/0 deletions**, preserved prior work:

- `src/main/index.ts`: one canonical registry and matching proof-file owner;
  identical manager/sandbox registry injection, authoritative exact host membership,
  current manager/feature fence, private local userData provisioning and live
  project/vault exclusion, current trusted sealed plugin assertions and safe fallback.
- `src/main/plugins/plugin-manager.ts`: host-private `assertToolRecordCurrent`,
  reusing existing reconciled fingerprints and exact runnable records to deny stale
  children even after changed disk bytes are re-consented.

Reused existing identity/issuer, pluginIdentity, sealed verify/anchor admission,
provider-ID validation, getRecord, exact-child lifetime and manager/singleton/quit
retirement. No new singleton, store, public RPC/SDK/capability/version or live
issuance caller. Unsupported Windows/demo, unsafe/noncanonical/overlapping/marked
roots, unavailable local roots, deleted/duplicate/unknown/terminal/remote agents,
current-owner mismatch and unanchored/revoked/stale plugin policy deny. Provisioning
errors keep ordinary tools independent and log only fixed content-free text.
Existing feature disable aborts the old run generation and disposes resources;
replacement/clear/confirmed quit permanently stop that exact registry/resource owner.

**Source wired/static-checked only; mock-tested false; production-tested false.**
No actual startup, proof provisioning/issuance, credential/keyring/store/network/
provider/mail invocation. Membership still requires later real process/run callback,
signal and supported delivery; interactive/Cue/CLI spawn callers remain unwired.
Nested mail RPC/setup/SDK/version/Cue and full acceptance remain unfinished.
Host API **1.16.0**, SDK **0.11.0**, Relay minHostApi **1.22.0** unsatisfied.
Product tests created/run: **0/0**; no suites executed in this source checkbox.
Deferred synthetic actual-composition coverage was added to the contract and HOST-03.
The conservative location policy can deny all proofs for an unavailable local root;
unregistered directories without project/vault markers are not discoverable.
Filesystem privacy is not same-OS-user isolation; no crash orphan or performance claim.

### Exact commands and outcomes

All commands used cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Existing dependencies reused via temporary local `node_modules` symlink; no install
or dependency writes. Receipts: `.maestro/verification/host-03-production-proof-wiring/`
(source/document baselines, hashes, deltas, logs, command exits and CLI provenance).

- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json`: baseline and final **exit 0**, no diagnostics (`baseline-tsc.log`, `main-tsc.log`).
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/index.ts src/main/plugins/plugin-manager.ts`: **exit 0** (`source-format.log`).
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js src/main/index.ts src/main/plugins/plugin-manager.ts`: final **exit 0**, no diagnostics (`eslint.log`). Initial prefer-const warning was resolved before the final checks.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/index.ts src/main/plugins/plugin-manager.ts`: **exit 0** (`source-prettier.log`).
- `git diff --check`: **exit 0** (`whitespace.log`). Source baseline `git diff --no-index` commands each **exit 1**, expected differences, not check failures (`source-numstat.json`, source delta patches).
- `node /opt/Maestro/resources/maestro-cli.js tab show 5262895a-6b3d-43fa-92cc-17449cdfa06f --json`: **exit 0**, success true (`execution-tab.json`).
- `node /opt/Maestro/resources/maestro-cli.js agent-run list --limit 5 --json`: **exit 0**, success true (`agent-runs.json`).

Observed task run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791339520843:1791339521124:3blowu**, status **running** at read;
spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791339520843**. Execution/worktree agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**, execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider session **null**.
Owner **0af39dab-3c06-40de-9077-99207660c1e9**; original launch from `LAUNCH.json`
**run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**,
launch exit **0**, callback **null**. Branch **feat/relay-imap-host-20261006**;
base/HEAD **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45** unchanged.

**Uncommitted; no stage/commit/push/PR.** Conditional review/PR stays HOST-05:
full acceptance and normal runtime/SDK/Cue/repository gates remain unmet. No new
Backstage consult/dispatch needed for this internal source task. Contract/evidence
and shared playbook evidence updated. No next task, relaunch, install, upstream merge,
live credentials/login, callback, Discord or other-checkout source/test/git writes.
Final document formatting, scope/checkbox/hash audit and symlink removal are retained
in the same receipt directory; static checks do not establish runtime acceptance.

Final document format/check **exit 0** (`document-commands.json`); final tracked
whitespace and preservation audit **exit 0** (`audit-commands.json`, `audit.json`).
Exactly **2 source files, 158 additions/0 deletions**, two worktree documents and
shared HOST-03/evidence changed; **5,557** other worktree files and every other
playbook checkbox state/text preserved. Only the selected production-composition
checkbox completed. No staged changes or unexpected files; temporary dependency
symlink removed and branch/HEAD unchanged. Report append format/check, final
whitespace and document hashes retained in `report-commands.json` and final hash
receipts. No tests, runtime, next task, commit/push/PR or other-checkout source work.

## HOST-03 exact-process run lifetime prerequisite (2026-10-07)

Completed only the newly split lifetime prerequisite, because ProcessManager kill
can remove an entry without an exit event and interrupt leaves an entry registered.
Source delta **2 files, 166 additions/1 deletion**:

- `src/main/process-manager/ProcessManager.ts`: main-only synchronous `spawnWithRunLifetime`, snapshotted args/env/config, canonical verified provider-strategy gate and spawn generations, exact ManagedProcess/child/PID capture, permanent stale-handle denial, weak object-owned stop cleanup, listener removal before abort, synchronous interrupt/kill fences and successor-safe failed-capture/kill handling.
- `src/main/process-manager/types.ts`: frozen signal/assertion lifetime shape, with no IPC payload or agent/proof/secret fields.

No production caller, proof issuance/delivery or timer supervisor was added.
Preparation/capture gates cannot authenticate a custom binary: future callers must
verify actual selected provider/mode and compose active manager/sealed policy/agent
membership. Source review found raw argv in existing interactive spawn logs and
process-list DTOs; explicit unchecked privacy projection prerequisites were added
before delivery, plus Cue's independent exact-child lifecycle prerequisite. Existing
AgentRun spawn capture is already metadata-projected. Full interactive/Cue/CLI
issuance, expiry/resource cleanup composition and public mail/setup/SDK/Cue paths
remain unchecked. Ordinary spawns stay independent of this host-only seam.

**Implemented/static-checked only; mock-tested false; production-tested false.**
Product tests created/run **0/0**. No test suites, actual lifecycle, proof-file,
plugin, native/keyring, storage, provider or mail runtime invoked. Host API **1.16.0**,
SDK **0.11.0**, Relay minHostApi **1.22.0** unsatisfied; full mail acceptance **unmet**.

### Exact checks and provenance

Commands ran only from registered cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Existing `/home/chris/code/Maestro/node_modules` reused through a temporary worktree-local
symlink; no install/shared dependency mutation. Receipts in
`.maestro/verification/host-03-process-run-lifetime/` include before file hashes/source/
doc snapshots, static logs/command JSON, task-only patches/numstat and CLI identity.

- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json`: baseline **exit 0** (`baseline-tsc.log`), final **exit 0** (`main-tsc.log`), no diagnostics.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/process-manager/ProcessManager.ts src/main/process-manager/types.ts`: **exit 0**, `source-format.log`.
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/process-manager/ProcessManager.ts src/main/process-manager/types.ts`: **exit 0**, `eslint.log`, no warnings/diagnostics.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/process-manager/ProcessManager.ts src/main/process-manager/types.ts`: **exit 0**, `source-prettier.log`.
- `git diff --check`: **exit 0**, `whitespace.log`.

These are static main-process checks only, not tests/full repository/renderer/CLI/SDK/
Cue gates or CI. Deferred actual ProcessManager/registry/resource/Cue and projection
coverage is retained in HOST-03; no permissive lifecycle mock is acceptable.

CLI `node /opt/Maestro/resources/maestro-cli.js tab show 5262895a-6b3d-43fa-92cc-17449cdfa06f --json`
and `node /opt/Maestro/resources/maestro-cli.js agent-run list --limit 5 --json`:
both **exit 0**, success true. Observed execution run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791340079771:1791340080047:871ffg**,
status **running** at read; spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791340079771**.
Execution/worktree agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, execution tab/sessionId
**5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider session **null**. Owner from original launch evidence
**0af39dab-3c06-40de-9077-99207660c1e9**; original launch **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**, launch exit
**0**, callback **null**.
Branch **feat/relay-imap-host-20261006**; base/HEAD
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45** unchanged.
Contract `docs/relay-imap-host-contract-20261006.md`; full playbook document paths
remain the five exact paths recorded in original `LAUNCH.json`, under
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/`.

**Uncommitted; no stage/commit/push/PR.** Conditional review/PR remains HOST-05:
implemented acceptance and normal runtime/repository gates are unmet. No new Backstage
consult/dispatch needed for this internal seam; no plugin code changed. Shared
HOST-03/evidence updates are the only main-checkout writes. No next task execution,
relaunch, installation/upstream merge/deploy, live secret/login, callback, Discord,
user Cue mutation or other-checkout source/test/git operation.
Final document formatting, preservation/checkbox/hash audit and symlink removal
are recorded in the same receipt directory; static checks do not prove runtime acceptance.

Final document formatting/checks **exit 0** (`document-commands.json`,
`final-playbook-commands.json`); final tracked whitespace and preservation audit
**exit 0** (`final-whitespace.log`, `audit.json`). Exactly **2 source files,
166 additions/1 deletion**, two worktree documents and shared HOST-03/evidence
changed. **5,575** other tracked/untracked worktree files and every
pre-existing playbook task text/state preserved. Exactly one newly split lifetime
checkbox completed; three explicit privacy/Cue prerequisites added and left
unchecked. No unexpected files/staging, branch/HEAD unchanged, temporary dependency
symlink removed. Final report formatting/whitespace and source/document hashes are
retained in report receipts. Tests **0/0**, runtime **none**, commit/push/PR **none**.

## HOST-03 private MCP spawn-log publication prerequisite (2026-10-07)

Completed only the selected log-projection source checkbox. Task-only delta:
**3 source files, 185 additions/51 deletions** (236 changed lines): canonical
`mcp-agent-config.ts` adds frozen nonmutating lossy argument/environment publication;
`ChildProcessSpawner.ts` projects every argv preview before slicing/joining/shell
escaping and fixes private-config local/native/Sentry errors; `handle-spawn.ts`
projects its command/argument logs and preserves system-prompt redaction, with
content-free MCP cleanup/withheld relay failures. Executable args/env and private
ManagedProcess configuration were not replaced with projected data. All existing
unrelated source changes are retained.

The closed projector copies dense own data string argv and own plain-record
string/undefined env, with 4,096-entry and aggregate 4 Mi UTF-16 code-unit bounds.
It omits opaque MCP/config/env operands, including all Codex overrides to handle
escaped keys without parsing; strips private file/token/config env delivery; and
returns fixed unavailable publication for unsafe shapes. It does not scrub arbitrary
unlabeled secrets or erase JS strings. Command/flag/ordinary env diagnostics remain;
raw shebang content is omitted. No caller/run authority or public mail surface added.

Provider stdout/stderr/parser/result/exit/raw-stdout forwarding remains an uncovered
publication boundary, alongside separately pending process DTO/Cue projection.
Added exactly one small unchecked diagnostic/publication prerequisite before proof
delivery; no next task was executed. Contract documents exact scope and deferred
actual buildMcpInjection/projector/spawn/shell/error/nonmutation/security/regression
coverage, retained in HOST-03 test creation and HOST-05 execution. End-to-end
privacy/production acceptance remain **unmet**. Host **1.16.0**, SDK **0.11.0**,
Relay minHostApi **1.22.0** unsatisfied.

**Implemented/static-checked only; mock-tested false; production-tested false.**
Tests created/run **0/0**. No proof-file, agent/plugin, native/keyring/storage,
provider/mail runtime or synthetic product runtime invoked. No install, merge,
callback, Discord, live credentials/login or user Cue mutation.

### Commands, exits and execution provenance

All commands ran in registered cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Existing local dependencies were reused through a temporary worktree-local
node_modules symlink, without installation or shared dependency mutation.
Receipts: `.maestro/verification/host-03-proof-log-projection/` (entry hashes/source/
doc snapshots, CLI receipts, task-only source patches/numstat and static logs).

- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json`: baseline **exit 0** (`baseline-tsc.log`), final **exit 0** (`main-tsc.log`), no diagnostics.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/shared/plugins/mcp-agent-config.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/ipc/handlers/process/handle-spawn.ts`: **exit 0**, `source-format.log`.
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/shared/plugins/mcp-agent-config.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/ipc/handlers/process/handle-spawn.ts`: **exit 0**, `eslint.log`, no warnings/diagnostics.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/shared/plugins/mcp-agent-config.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/ipc/handlers/process/handle-spawn.ts`: **exit 0**, `source-prettier.log`.
- `git diff --check`: **exit 0**, `whitespace.log`.

Final structured command receipt: `source-commands.json`. These are static checks,
not full renderer/CLI/SDK/Cue/repository gates, runtime tests or CI. Documentation
formatting and final preservation/checkbox/hash receipts follow in this directory.

Read-only CLI `tab show 5262895a-6b3d-43fa-92cc-17449cdfa06f --json` and
`agent-run list --limit 5 --json`: both **exit 0**, success true. Observed execution
run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791340641101:1791340641238:4lcxl6**,
**running** at read; spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791340641101**.
Execution/worktree agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, execution
tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**, provider session **null**.
Owner **0af39dab-3c06-40de-9077-99207660c1e9**; original launch evidence/callback
unchanged (**null**, no inferred callback or new launch). Branch
**feat/relay-imap-host-20261006**, base/HEAD **1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45**.

**Uncommitted; no stage/commit/push/PR.** Full implementation, security/runtime
acceptance and normal gates remain unfinished; conditional review/PR stays HOST-05.
Contract: `docs/relay-imap-host-contract-20261006.md`; all five playbook paths and
LAUNCH.json unchanged. Shared playbook/evidence are the only main-checkout writes.
No plugin/other-checkout source/test/git work, Backstage dispatch, relaunch or next
task. Exact code/test/PR outcomes reported in this execution tab.

Final document format/check **exit 0** (`document-commands.json`); preservation
and scope auditor **exit 0** (`audit.py`, `audit.log`, `audit.json`). Exactly
three source files (185 additions/51 deletions), two worktree docs and shared
HOST-03/evidence changed. **5,573** other regular worktree files plus the unchanged
tracked AGENTS.md symlink preserved. No unexpected files/staging; branch/HEAD
unchanged and temporary dependency symlink removed. All existing checkbox texts
and other states preserved: only the selected log-projection task completed, one
provider-output prerequisite added unchecked. Final tracked whitespace **exit 0**;
no-index task/shared whitespace checks have empty diagnostics and expected diff
**exit 1** (recorded explicitly in audit.json, not reported as exit 0).
Final report format/check and hashes are recorded in report-commands.json and
final-hashes.json. Tests/runtime **0/none**, commit/push/PR **none**.

## HOST-03 process-detail and Cue native-error projection (2026-10-07)

Completed only the selected private process-detail publication source task in
`RELAY-IMAP-HOST-03.md`. Task delta **2 source files, 73 additions/20 deletions**
(93 changed source lines), preserving inherited source/test work:

- `src/main/ipc/handlers/process.ts`: canonical projected command/argv/Maestro-set
  env/remote process DTOs, copied metadata across child-inspection awaits, projected
  Cue callback entries, child PIDs retained with Windows opaque CommandLine and
  withheld-parent child text omitted; ordinary POSIX names retained.
- `src/main/cue/cue-process-lifecycle.ts`: projection before native spawn, copied
  active-process publication metadata and re-projected lists, fixed withheld-config
  synchronous/asynchronous spawn errors/results/Sentry. Exact native args/env and
  ordinary diagnostics remain; no authority, public API or executable delivery added.

AgentRun spawn capture, debug stats and debug-package collector audited read-only:
metadata selected, no raw config argv/env/proof forwarding; no changes needed.
Covered DTO/error paths do not protect provider output. Added **one unchecked Cue
output-publication source prerequisite**, before issuance, for raw buffers/polling/
parser/results/history/chain/auth diagnostics plus upstream builder/executor logs
and stdin/stream/kill/timeout/rejected-Promise errors. Interactive output task remains
unchecked. Neither was executed. Unsupported SSH/shell/wrapper/custom delivery
remains denied for future proof issuance; no end-to-end privacy or readiness claim.
Deferred actual injector/projector/IPC/Cue/AgentRun/nonmutation/concurrency/error/
Windows/POSIX regression coverage added to HOST-03; no permissive projection mocks.

**Source implemented/static-checked only; mock-tested false; production-tested
false.** Tests created/run **0/0**; no test suite or synthetic product runtime.
No proof-file, agent/provider/mail, native keyring/credentials/store or live user
Cue action. Host API **1.16.0**, SDK **0.11.0**, Relay minHostApi **1.22.0** remains
unsatisfied; full feature acceptance/normal repository gates remain unfinished.

### Exact checks and provenance

All code/docs/checks/git ran with cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Existing `/home/chris/code/Maestro/node_modules` reused via temporary worktree-local
symlink; no installation or shared dependency mutation. Receipts:
`.maestro/verification/host-03-process-detail-projection/` (baseline source/doc/hash
snapshots, CLI receipts, static command JSON/logs and task-only patches/numstat).

- `node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json`:
  baseline **exit 0** (`baseline-tsc.log`), final **exit 0** (`main-tsc.log`), no diagnostics.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/ipc/handlers/process.ts src/main/cue/cue-process-lifecycle.ts`:
  **exit 0** (`source-format.log`).
- `node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/ipc/handlers/process.ts src/main/cue/cue-process-lifecycle.ts`:
  **exit 0** (`eslint.log`), no warnings/diagnostics.
- `node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/ipc/handlers/process.ts src/main/cue/cue-process-lifecycle.ts`:
  **exit 0** (`source-prettier.log`).
- `git diff --check`: **exit 0** (`whitespace.log`). Per-source `git diff --no-index --numstat`
  returns **exit 1**, expected differences, not a validation failure (`source-numstat.json`).

These are static main-process checks only, not full renderer/CLI/SDK/Cue/repository
or CI/runtime gates. Required Cue suites stay before-push checks in HOST-05.
Read-only CLI `node /opt/Maestro/resources/maestro-cli.js tab show 5262895a-6b3d-43fa-92cc-17449cdfa06f --json`
and `node /opt/Maestro/resources/maestro-cli.js agent-run list --limit 5 --json`:
both **exit 0**, success true; receipts retain actual outputs.
Observed task run **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791341153056:1791341153196:lghgvg**, status **running** at read;
spawned session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791341153056**. Execution/worktree agent
**228eef8c-75a8-46e8-bb67-2903da23bc06**, execution tab/sessionId **5262895a-6b3d-43fa-92cc-17449cdfa06f**,
provider session **null**. Owner from LAUNCH.json **0af39dab-3c06-40de-9077-99207660c1e9**;
original launch **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i**, launch **exit 0**, callback **null**.
Branch **feat/relay-imap-host-20261006**, rc base/HEAD
**1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45** unchanged.
Contract: `docs/relay-imap-host-contract-20261006.md`.
Full playbook paths (unchanged launch evidence):

- `/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-01.md`
- `/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-02.md`
- `/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-03.md`
- `/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-04.md`
- `/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-05.md`

**Uncommitted; no staging/commit/push/PR.** Conditional PR/review remains HOST-05:
full implementation/acceptance and normal gates are unmet. No new Backstage
consult/dispatch needed for this internal source task; its plugin checkout was not
modified. Only shared HOST-03/evidence writes outside the registered worktree.
No next task, relaunch, install, upstream merge, deployment, live credentials/login,
callbacks, Discord or other-checkout source/test/git operations. Final document
formatting, preservation/checkbox/hash audit and dependency-symlink removal are
retained in this task's receipts; no static result establishes runtime acceptance.

Final document/shared format/checks **exit 0** (`document-commands.json`,
`shared-document-commands.json`); static preservation/checkbox/scope audit **exit 0**
(`audit.json`). Exactly **2 source files, 73 additions/20 deletions**, two worktree
documents and shared HOST-03/evidence changed. **9,264** other baseline
worktree files/symlinks preserved; all pre-existing task text and other checkbox
states preserved. Only the selected checkbox completed; one explicit Cue output
prerequisite added unchecked. No unexpected files or staging, branch/HEAD unchanged,
temporary dependency symlink removed. Final tracked whitespace **exit 0**;
no-index task/shared whitespace checks have no diagnostics and expected difference
**exit 1**, recorded explicitly in audit.json. Final report format/whitespace and
source/document hashes retained in report-commands.json/final-hashes.json.
Tests **0/0**, product runtime **none**, commit/push/PR **none**.

### HOST-03 prepared provider-output withholding prerequisite (2026-10-07)

Completed exactly one newly split self-contained source prerequisite; the broad
provider publication task and remaining diagnostics/Cue/issuance/tests remain
unchecked. **Source/static-checked only**, mock-tested **false**, production-tested
**false**, tests created/run **0/0**.

Actual source delta against captured pre-task files: **3 files, 80 additions /
16 deletions** (96 changed lines):

- `src/main/process-manager/ProcessManager.ts`: canonical private spawn composition
  takes a main-only captured policy; ordinary spawn false, prepared run true.
- `src/main/process-manager/spawners/ChildProcessSpawner.ts`: prepared streams
  drain without decoding/conversion/handlers and publish only empty stdout liveness;
  native/listener errors are fixed. Exact executable argv/env are unchanged. Prepared native error and close share
  captured once-only settlement instead of the ordinary native error publisher.
- `src/main/process-manager/handlers/ExitHandler.ts`: prepared close clears residual
  output/timer, bypasses parsing/previews/provider-disk/result fallback, emits a
  fixed nonrecoverable output-unavailable error even on code zero (except deliberate
  stop/prior error), then shares the extracted canonical settlement/ownership path.

This deliberately provides **no useful provider output** for prepared runs. It is
not a callable mail feature, a selective redactor, tested privacy or production
proof delivery. Ordinary no-proof spawn behavior including ordinary MCP config
keeps its existing output path. Audited raw-stdout subscribers are stdout liveness
and group-chat live peek; both receive only empty payloads on the prepared path.
Stdout/Stderr parser, errors, previews, tool/thinking/session/usage and data forwarding
are unreachable from those captured guarded chunks. Native buffers are not erased.
ProcessManager write/interrupt/kill, upstream preparation/delivery errors, provider
transcripts/external storage/debug/history readers, custom/wrapper/PTY/SSH/SDK and
Cue paths remain uncovered; the playbook now has an explicit diagnostic follow-up
before issuance. Full acceptance remains **unmet**. Host API **1.16.0**, SDK **0.11.0**
and required Relay minHostApi **1.22.0** are unchanged/incompatible.

Commands from registered cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`
using existing read-only dependencies through a temporary local node_modules symlink
(no installation, shared dependency mutation or runtime):

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/process-manager/ProcessManager.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/process-manager/handlers/ExitHandler.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/process-manager/ProcessManager.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/process-manager/handlers/ExitHandler.ts
git diff --check
```

Baseline/final strict main typecheck **exit 0**, no diagnostics. Source formatting,
ESLint (zero warnings) and tracked whitespace **exit 0**. These are static checks;
normal repository/security/Cue/runtime gates remain HOST-05. No tests or provider/
agent/proof-file/keyring/storage/mail runtime, install, upstream merge, callbacks,
Discord or external handoff performed. Formatting/source/doc command receipts,
before snapshots, exact task patches, hashes and run/tab evidence are under
`.maestro/verification/host-03-provider-output-fence/`.

Branch `feat/relay-imap-host-20261006`; base/current HEAD unchanged:
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. **Uncommitted; no commit/push/PR**.
Review/PR stays HOST-05 because production acceptance and normal gates are incomplete.
Observed run (running at inspection):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791341542851:1791341542995:s06cfk`;
spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791341542851`;
CLI-observed execution tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`, worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, recorded owner
`0af39dab-3c06-40de-9077-99207660c1e9`. The original launch remains recorded in
shared `LAUNCH.json`; no relaunch or callback was made.

### HOST-03 prepared ProcessManager control diagnostics (2026-10-07)

Completed exactly one newly split bounded source prerequisite, added before edits
to HOST-03. The original broad provider/diagnostic/Cue/issuance/test tasks remain
unchecked. **Source/static-checked only; mock-tested false, production-tested
false; tests created/run 0/0.**

Task delta: `src/main/process-manager/ProcessManager.ts`, **33 additions/11 deletions**
against the captured pre-task file (44 changed source lines; one source file).
The main-private weak publication marker binds to the exact prepared process and
survives stop/exit without authority or reusable session-key state. Prepared
write/interrupt/kill native failures publish only fixed PrivateMcpSpawnFailed
errors to logger/Sentry. Prepared kill drops residual data/timer; interrupt
escalation checks the original child/process before killing. Prepared cwd failures
omit cwd and use fixed diagnostics. Ordinary execution inputs/output policy are
unchanged. Full acceptance and production proof delivery remain **unmet**.

Read-only inventory recorded in the contract: ordinary handle-spawn MCP temp-file/
preparation failure paths, Claude/Codex disk transcript readers, history storage,
debug log/session collection and independent Cue output remain outside this gate.
The lifetime seam excludes PTY/Windows/SSH/shell/SDK paths, but provider slug checks
alone do not verify arbitrary custom executable identity. Future issuance must
bind trusted exact executable selection and deny unsupported delivery paths.
No selective redaction/useful provider output or end-to-end privacy claim.

All commands ran in registered cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`, reusing existing local
dependencies through a temporary worktree-only symlink without installation:

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/process-manager/ProcessManager.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/process-manager/ProcessManager.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/process-manager/ProcessManager.ts
git diff --check
```

Baseline/final strict main typechecks **exit 0**, no diagnostics. Source formatting,
ESLint (zero warnings) and tracked whitespace **exit 0**. Repo-wide/security/SDK/Cue
runtime gates remain HOST-05; no tests, native process/provider/proof-file/keyring/
mail runtime, credentials/login, installation, upstream merge, callbacks, Discord
or external handoff. Source receipts/snapshots/task patch and exact run/tab evidence:
`.maestro/verification/host-03-prepared-control-diagnostics/`. Contract and both
ledgers updated; final document/checkbox/preservation audits recorded there.

Branch `feat/relay-imap-host-20261006`; base/current HEAD unchanged:
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. **Uncommitted; no staging, commit,
push or PR**. Conditional review/PR stays HOST-05: implementation acceptance and
normal gates are incomplete. Host API **1.16.0**, SDK **0.11.0**, required Relay
minHostApi **1.22.0** unchanged. No plugin-checkout writes or new coordination.

CLI-observed run (running at inspection):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791341975574:1791341975723:7ldjz2`;
spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791341975574`;
execution tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`, worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, playbook-recorded owner
`0af39dab-3c06-40de-9077-99207660c1e9`. No relaunch or callback. Initial launch
remains in shared `LAUNCH.json`. Shared writes limited to HOST-03 and EVIDENCE;
no subsequent checkbox executed in this fresh context.

Final document and shared-document formatting checks **exit 0**. Preservation and
checkbox audit **exit 0**: all **5,576** other baseline git-visible files preserved,
all **26** pre-existing HOST-03 checkbox texts/states preserved, exactly **one**
new bounded source checkbox added and completed. No unexpected git-visible files;
branch, HEAD and index unchanged. Task delta remains one source file, **33 additions/
11 deletions**, two worktree documents and shared HOST-03/EVIDENCE. Tracked whitespace
**exit 0**; task/shared no-index whitespace checks have no diagnostics and expected
difference **exit 1** (not a failed gate). Temporary dependency symlink removed.
Actual command exits, scope/hashes and initial/final receipts are retained locally.
Tests **0/0**, product runtime **none**, commit/push/PR **none**.

## HOST-03 private exit settlement source task (2026-10-07)

Completed only the newly split private exit settlement checkbox. The broader
provider diagnostic/output task remains unchecked. **Implemented/static-checked;
mock-tested false; production-tested false; tests created/run 0/0.**

Source: `src/main/process-manager/handlers/ExitHandler.ts`, **71 additions and
45 deletions** against the pre-task snapshot (**116 changed lines, one source
file**). Captured withholding now reaches shared settlement, skipping its final
DataBufferManager publisher. Exact-object output/timer disposal runs before and
after synchronous notifications; synchronous cleanup/query failures cannot strand
the original entry. Ownership is released before exit; existing generation checks
protect replacements. Private failures use fixed PrivateMcpSpawnFailed without
inspecting the cause. Ordinary/native input behavior remains on existing paths.

Audited raw-stdout consumers and stdout/stderr/exit parser/log/result paths in the
contract. Independent image staging/async cleanup diagnostics remain uncovered;
an explicit bounded follow-up source checkbox was added. Separate upstream
preparation, exact executable verification, external provider disk/history/debug
readers, Cue and arbitrary direct/asynchronous host publication remain gated.
No end-to-end privacy, proof issuance, useful provider answer or mail readiness.

All commands ran in registered cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`, reusing existing local
dependencies with a temporary worktree-only node_modules symlink, no installation:

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/process-manager/handlers/ExitHandler.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/process-manager/handlers/ExitHandler.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/process-manager/handlers/ExitHandler.ts
git diff --check
```

Baseline and final strict main typechecks **exit 0**, no diagnostics. Source
formatting/check, ESLint with zero warnings and tracked whitespace **exit 0**.
No test creation/execution or product/native/provider/proof-file/keyring/mail
runtime, secret retrieval, live login, install, upstream merge, callback, Discord,
external coordination or other-checkout source/test/git operations. Security/SDK/
Cue and full repository gates remain HOST-05. Final document formatting,
preservation, task scope and checkbox receipts are stored with the task artifacts.

Contract and both evidence ledgers updated. Artifact directory:
`.maestro/verification/host-03-private-exit-settlement/` (pre-task snapshots/hashes,
source patch, actual command stdout/stderr/exits and observed execution identity).
Shared writes limited to `RELAY-IMAP-HOST-03.md` and `EVIDENCE.md`. All other
baseline git-visible files and pre-existing playbook checkboxes must remain intact.

Branch `feat/relay-imap-host-20261006`; base/current HEAD unchanged
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. **Uncommitted; staging/commit/push/PR
none.** No PR because implemented acceptance and normal before-push gates remain
incomplete; review/conditional PR is HOST-05. Host API **1.16.0**, SDK **0.11.0**,
required Relay minHostApi **1.22.0** unchanged. Existing Backstage coordination is
retained in the ledgers; no new plugin-checkout writes or handoff in this task.

CLI-observed run (running when inspected):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791342304549:1791342304904:plas7p`;
spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791342304549`;
execution tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`, worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, observed owner agent
`0af39dab-3c06-40de-9077-99207660c1e9`. Owner and worktree auto-run-status both
reported running false/state null; that does not override the recorded running
agent-run receipt. Initial launch remains shared `LAUNCH.json`. No relaunch,
callback or subsequent source/test/execution checkbox in this fresh context.

Final receipts: document formatting and tracked whitespace **exit 0**;
preservation/checkbox/scope audit **exit 0**. All **5,576** other baseline
git-visible files, **27** pre-existing HOST-03 checkbox texts/states and prior
document content preserved. Exactly **one** newly split source task completed;
**one** new image-diagnostic follow-up remains unchecked. No unexpected
git-visible files; branch, HEAD and index unchanged; temporary dependency symlink
removed. Source delta remains **71 additions/45 deletions**. Task-relative
no-index whitespace checks have no diagnostics; exact exits are in
`final-checks.json`. Tests **0/0**, product runtime **none**, commit/push/PR **none**.

## HOST-03 prepared image staging/cleanup diagnostics (2026-10-07)

Completed exactly one pre-existing unchecked source task in
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-03.md`.
Implementation is **statically checked**, neither mock-tested nor production-tested.
Source delta against this task's snapshots: **3 files, 38 additions/20 deletions**:

- `src/main/process-manager/utils/imageUtils.ts`: optional captured private policy
  for save/cleanup; omit temp paths, fixed save logger/Sentry and async unlink
  failure diagnostics with no original cause/code/getter inspection. Keep ordinary
  pre-write throws and ordinary native diagnostics/ENOENT behavior.
- `src/main/process-manager/spawners/ChildProcessSpawner.ts`: pass the existing
  host-only policy to staging and omit temp paths from both image-mode logs.
- `src/main/process-manager/handlers/ExitHandler.ts`: pass the captured policy into
  shared exit cleanup so delayed unlink callbacks remain fenced after retirement.

Native image bytes/paths/prefixes and executable argv/env are still passed through;
there is no privacy inference from model flags/substrings and no new registry,
logger, utility, proof getter or public API. No mutable/global suppression state.

Audit found independent persisted-image missing-ref logs/native error-code access
in `session-image-store.ts`, plus stream-json/SSH parsing and IPC SDK image cleanup.
Added **one** explicit unchecked bounded follow-up for persisted resolution,
image parsing and stream-json before advancing; no other source task executed.
Broader prompt/provider/Cue/external disk publishers and unsupported/bypass
execution remain outstanding. Local catches cannot retract an upstream log.
Contract inventory and deferred actual synthetic composition/error/nonmutation/
concurrency/ordinary regression coverage updated; creation stays HOST-03 and
execution stays HOST-05. Tests created **0**, tests run **0**, test counts **0**;
no mock/production readiness, private proof delivery or useful-output claim.

Actual checks from this worktree, using existing dependencies via temporary local
node_modules symlink (shared dependency tree never mutated; no installation):

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/process-manager/utils/imageUtils.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/process-manager/handlers/ExitHandler.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/process-manager/utils/imageUtils.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/process-manager/handlers/ExitHandler.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/process-manager/utils/imageUtils.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/process-manager/handlers/ExitHandler.ts
git diff --check
```

Baseline and final strict main typecheck **exit 0**, no diagnostics; source format
write/check, ESLint with zero warnings, tracked whitespace **exit 0**.
Task-relative no-index source diffs/numstats/whitespace checks **exit 1** because
files differ; whitespace stdout/stderr empty. These are not failing test receipts.
Document checks and final preservation/scope/checkbox audit have separate exact
command/exit artifacts. Full repository/security/SDK/Cue gates remain HOST-05.

Artifacts: `/home/chris/code/worktrees/feat/relay-imap-host-20261006/.maestro/verification/host-03-image-diagnostics/`
(pre-task snapshots/hashes, patches/numstats, baseline/source/final stdout/stderr/
exit JSON, CLI-observed identity). Worktree/branch
`/home/chris/code/worktrees/feat/relay-imap-host-20261006` /
`feat/relay-imap-host-20261006`; base/current HEAD unchanged
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. **Uncommitted; staging/commit/push/PR
none.** No PR: implemented acceptance/public wiring and normal before-push gates
remain incomplete; conditional review/commit/PR belongs to HOST-05. Host API
**1.16.0**, SDK **0.11.0**, required Relay minHostApi **1.22.0** unchanged.
Existing Backstage handoff evidence retained; no new consultation/message or
plugin-checkout writes in this task.

CLI-observed current run (running at inspection):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791342693268:1791342693417:etqfkq`;
spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791342693268`.
CLI session-list observed execution tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`,
worktree agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; agent roster observed owner
`0af39dab-3c06-40de-9077-99207660c1e9`. Both auto-run-status APIs report
running false/state null; that does not override the running agent-run receipt.
Original launch in shared `LAUNCH.json`:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i`.
No relaunch/callback/dispatch/Discord/install/merge/login, product/provider/native/
proof-file/keyring/mail runtime or real secret retrieval. Shared writes limited
to HOST-03 and EVIDENCE. No later source/test/execution checkbox completed.

Final receipts: initial document check **exit 1** for formatting in the two appended
worktree documents; corrected with targeted Prettier, final document write/check
and tracked whitespace **exit 0**. Preservation/scope/checkbox audit **exit 0**:
all **5,574** other baseline git-visible files, prior document content and **29**
pre-existing HOST-03 checkbox texts preserved, with only the selected source task
changed to completed. Exactly one new follow-up remains unchecked. Branch, HEAD
and index unchanged; temporary dependency symlink removed. No tests/runtime,
commit/push/PR or subsequent implementation task. Detailed final command/exit
receipts and final patches are in the image-diagnostics artifact directory.

## HOST-03 persisted-image helper diagnostic policy (2026-10-07)

Completed **one new self-contained helper prerequisite**, split before source edits
from the original persisted-image checkbox because actual stream-json propagation
requires a fourth module. The original checkbox remains **unchecked**, with an
explicit unchecked ChildProcessSpawner call-site prerequisite. No later source,
test-creation, test-execution or issuance task completed.

Implemented in exactly **3 source files, 99 additions/59 deletions (158 changed
lines)** against task-entry snapshots:

- `src/main/storage/session-image-store.ts`: optional per-call host-private sync
  resolver policy; fixed PrivateMcpImageResolutionFailed before native code/getter
  access or missing-ref log, including path preparation/inline decode failures.
  Private ENOENT throws safely; ordinary missing-ref/null/native errors unchanged.
- `src/main/process-manager/utils/imageUtils.ts`: parser forwards policy to actual
  resolver and normalizes private resolution/encoding failures; staging forwards
  its already captured policy into parser before independent resolver publication.
- `src/main/process-manager/utils/streamJsonBuilder.ts`: explicit optional policy
  forwards through parser/resolver and normalizes iteration/serialization failures.
  Its ChildProcessSpawner call still needs wiring and stays ordinary for now.

Successful bytes/paths/base64/JSON/prompt/argv/env are unchanged by source inspection;
actual synthetic nonmutation/error/concurrency/regression tests remain deferred.
No inferred policy, mutable current-agent state, public switch/type/API/version,
registry/logger/utility or proof getter was added. Audited SSH, SDK, CLI/direct,
browser/data-URL and custom consumers remain ordinary, unsupported proof channels;
existing lifetime denies SSH/PTY/shell/unsupported representations, but custom
binary verification and external provider disk readers remain separate gates.
No complete stream-json/disk/bypass/privacy or mail readiness claim is made.

Validation commands from this registered worktree, existing dependencies only:

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/storage/session-image-store.ts src/main/process-manager/utils/imageUtils.ts src/main/process-manager/utils/streamJsonBuilder.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/storage/session-image-store.ts src/main/process-manager/utils/imageUtils.ts src/main/process-manager/utils/streamJsonBuilder.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/storage/session-image-store.ts src/main/process-manager/utils/imageUtils.ts src/main/process-manager/utils/streamJsonBuilder.ts
git diff --check
```

Source checks **exit 0**, strict main typecheck no diagnostics, ESLint zero warnings.
The initial type receipt named baseline-type overlapped source editing; it is an
initial passing check, not a claimed pristine baseline result. Final checks have
separate receipts. No-index patches/numstats return **exit 1** for differing files;
whitespace checks return 1 with empty diagnostics. Document formatting and final
scope/preservation/checkbox checks are recorded separately. Tests created **0**,
tests executed **0**, test counts **0**; neither mock-tested nor production-tested.
No dependency installation or mutation of shared dependencies; temporary worktree
node_modules symlink only, removed after validation.

Artifacts: `.maestro/verification/host-03-image-resolution/` contains baseline
snapshots/hashes/status, actual command argv/cwd/stdout/stderr/exit receipts, source
and document patches/numstats, CLI run/tab evidence and final preservation audit.
Worktree/branch `/home/chris/code/worktrees/feat/relay-imap-host-20261006` /
`feat/relay-imap-host-20261006`, current HEAD/base unchanged
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. **Uncommitted; no staging, commit,
push or PR.** No PR because implemented acceptance/production wiring and normal
before-push gates remain incomplete; conditional commit/PR belongs to HOST-05.
Host API **1.16.0**, SDK **0.11.0**, Relay minHostApi **1.22.0** unchanged.

CLI-observed run **running** at inspection:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791343006247:1791343006547:2lm3w3`,
spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791343006247`.
Execution tab/session-list ID `5262895a-6b3d-43fa-92cc-17449cdfa06f`, worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; owner from playbook/launch evidence
`0af39dab-3c06-40de-9077-99207660c1e9`. auto-run-status reports running false/state
null, which does not override the AgentRun receipt. No relaunch or notification.
No tests, provider/proof-file/native/keyring/mail runtime, install, merge, live
login, callbacks, Discord, consultation/dispatch or plugin-checkout writes.
Shared writes limited to HOST-03 playbook and EVIDENCE.

Final document/source format write/check, strict main type, zero-warning ESLint and
tracked whitespace **exit 0**. Preservation review confirms all **5,574** other
baseline git-visible files and prior worktree document contents preserved; all
**30** pre-existing HOST-03 checkbox texts remain unchanged. Exactly **one** newly
split helper task is completed; original persisted-image task and new spawner task
remain unchecked. Branch, HEAD and index unchanged; dependency symlink removed.
Final patch/numstat/whitespace and scope/checkbox receipts saved with the task artifacts.

## HOST-03 captured stream-json caller policy (2026-10-07)

Completed one self-contained unchecked caller-wiring task in
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-03.md`.
Only source change: `src/main/process-manager/spawners/ChildProcessSpawner.ts`,
**17 additions/2 deletions (19 changed lines)** against task-entry snapshot.
Actual builder call now forwards captured host-only private policy through existing
parser/resolver helpers; private stdin errors branch before native code/getter/cause
access; captured private Windows prompt previews are omitted. Ordinary successful
JSON/bytes/argv/env and complete prepared provider-output withholding remain as in
prior source. No new API/type/version/permission, public flag, helper or authority.

Static audit found a separate pre-existing failure-lifecycle gap: builder or stdin
write/end failure after child registration returns failure before prepared manager
ownership capture, so exact-child rollback is not assured. Added an explicit small
unchecked source task before issuance; did not execute it. Original persisted-image
aggregate and all later tasks remain unchecked. External transcript/disk/history/
debug, trusted custom executable/preparation and independent Cue gates remain open.
No complete privacy, rollback, proof-delivery or public mail readiness claim.

Validation from this registered worktree, existing dependencies only:

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --write src/main/process-manager/spawners/ChildProcessSpawner.ts
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/process-manager/spawners/ChildProcessSpawner.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/process-manager/spawners/ChildProcessSpawner.ts
git diff --check
```

Initial and final strict main typecheck, targeted source format write/check,
zero-warning ESLint and tracked whitespace: **exit 0**. Main typecheck emitted no
diagnostics. Tests created **0**, tests executed **0**, counts **0**; static-only
source task, neither mock-tested nor production-tested. Deferred real synthetic
composition/nonmutation/hostile-error/concurrent/ordinary regression requirements
appended to HOST-03; execution remains HOST-05. Required full repository/SDK/Cue
before-push gates were not run in this task. Final document formatting and scope/
preservation receipts are in the artifact directory.

Artifacts: `.maestro/verification/host-03-stream-json-policy/` holds baseline
snapshots/hashes, exact command argv/cwd/stdout/stderr/exit receipts, patches and
scope review, plus CLI agent-run/session/roster evidence. Temporary worktree-local
node_modules symlink used for validation only; no shared dependency changes/install.
Branch `feat/relay-imap-host-20261006`, worktree
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`, HEAD/base unchanged
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`; **uncommitted, no staging, commit,
push or PR**. No PR because acceptance/production wiring and normal gates remain
incomplete; conditional git/PR task remains HOST-05. API **1.16.0**, SDK **0.11.0**,
Relay minimum **1.22.0** unchanged.

CLI-observed run at inspection (**running**):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791343326372:1791343326521:7z04ss`;
spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791343326372`.
Execution tab/session-list ID `5262895a-6b3d-43fa-92cc-17449cdfa06f`, worktree
agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; roster-confirmed owner
`0af39dab-3c06-40de-9077-99207660c1e9`. Reporting is this execution response;
no callback, relaunch, consultation, dispatch or Discord. No provider/proof-file/
native/keyring/mail runtime, real credentials/login, installs, upstream merge or
other-checkout source/test/git writes. Shared writes limited to HOST-03/EVIDENCE.

## HOST-03 prepared-child rollback (2026-10-07)

Completed exactly one self-contained unchecked source task in shared
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-03.md`:
prepared post-spawn rollback. Three canonical source modules changed against
`.maestro/verification/host-03-prepared-rollback/baseline/`:

| Source                                                     | Added | Deleted | Changed |
| ---------------------------------------------------------- | ----: | ------: | ------: |
| `src/main/process-manager/spawners/ChildProcessSpawner.ts` |   245 |     134 |     379 |
| `src/main/process-manager/ProcessManager.ts`               |    43 |      15 |      58 |
| `src/main/process-manager/handlers/ExitHandler.ts`         |    18 |      13 |      31 |
| Total                                                      |   306 |     162 |     468 |

Captured original native-child/managed-object/generation ownership now precedes
stdin preparation; rollback fences lifetime/output before callbacks, signals only
the failed native child, disposes owned listeners/streams/buffers/images and uses
canonical private exit settlement without touching a reentrant successor. Partial
native setup and synchronous builder/write/end failures are covered in source.
Rejected kill retains tracking until close, with exact canonical retry; signal
submission is not an observed OS-death guarantee. Successful ordinary executable
inputs/output remain as before, and ordinary pre-native-try exceptions retain their
throw behavior. Failed spawn results no longer create a successful spawn receipt.
No new public authority/API/version/token path or supervisor. Detailed boundaries
and limitations are appended to the host contract.

Exact final static commands, cwd this registered worktree:

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/process-manager/ProcessManager.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/process-manager/handlers/ExitHandler.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/process-manager/ProcessManager.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/process-manager/handlers/ExitHandler.ts
git diff --check
```

All **exit 0**; main typecheck emits no diagnostics, ESLint zero warnings.
Initial type/ESLint checks also exited 0; static inspection led to further cleanup
and ownership corrections, followed by final verification. Prettier source writes
exited 0; final document-format/whitespace and scope checks are separately receipted.
No-index source patch/numstat/whitespace commands exit **1** because files differ;
whitespace diagnostics empty. Tests created **0**, tests executed **0**, counts
**0**. Neither mock-tested nor production-tested; full repo/SDK/Cue before-push
gates remain HOST-05 work. Actual composed synthetic rollback tests were added to
the deferred HOST-03 requirements; no permissive helper-return tests or runtime.

Artifacts: `.maestro/verification/host-03-prepared-rollback/` contains entry
snapshots/hashes/status/index fingerprint, exact argv/cwd/stdout/stderr/exit static
receipts, source/document patches and CLI run/tab/roster/session receipts. Existing
main-checkout dependencies were read through a temporary worktree-local node_modules
symlink only, removed after validation. No dependency installation or mutation.
Source/test/git operations stayed in registered worktree; shared writes only
HOST-03 playbook and EVIDENCE. No other checkout source edits, native/keyring/mail/
proof runtime, real credentials/login, upstream merge, callbacks, Discord or
consultation/dispatch. API **1.16.0**, SDK **0.11.0**, Relay minimum **1.22.0** unchanged.

Branch `feat/relay-imap-host-20261006`; worktree
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`; base/current HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. **Uncommitted; no staging, commit,
push or PR.** No PR because public mail/production wiring, proof issuance and
acceptance/gates remain incomplete; conditional git task remains HOST-05.
All earlier work preserved. Other unchecked tasks remain unchecked.

CLI-observed current run (**running** at inspection):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791343591480:1791343591768:j4op6w`;
spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791343591480`.
Execution tab/session-list ID `5262895a-6b3d-43fa-92cc-17449cdfa06f`; worktree
agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; roster-confirmed owner
`0af39dab-3c06-40de-9077-99207660c1e9`. auto-run-status reports
`running:false,state:null`; AgentRun independently shows this active execution.
No run relaunched, no callback/notification or invented recipient; report is this
execution response. Launch provenance remains the existing shared `LAUNCH.json`.

Final preservation audit: **5,574** other task-entry git-visible files preserved;
prior contract/evidence prefixes preserved. All **33** pre-existing HOST-03 checkbox
texts preserved with exactly one unchecked-to-checked transition; no new task
executed. Source task is **468 changed lines/three files**. HEAD, branch and index
fingerprint unchanged. Dependency symlink removed. Scope receipt `scope-final.json`
and final source/doc patch, numstat and whitespace receipts are in the task artifact
directory. Final strict main type, targeted ESLint/format and tracked whitespace
checks exit **0**; tests remain **0/0**, no commit/PR and no runtime readiness claim.

The final appended-summary format check initially exited **1** for the worktree
evidence file; Prettier `--write` corrected the extra blank line (**exit 0**),
and the final format recheck exited **0**. No source or test failure was observed.

## HOST-03 persisted-image composition acceptance audit (2026-10-07)

Completed exactly one previously unchecked HOST-03 task: persisted-image and
stream-json diagnostic fencing, after its three completed helper/caller/rollback
prerequisites. Audited the actual captured policy chain and all resolver, staging,
builder and prepared-lifetime callers. **Source changes 0 files/0 lines; tests
created 0, executed 0; static-only, neither mock-tested nor production-tested.**
Updated the contract's acceptance audit and mirrored this evidence into shared
EVIDENCE. Only this checkbox changes; subsequent source/test/runtime tasks remain
unchecked. Historical pending call-site/rollback descriptions are superseded by
the new contract entry, with external/custom/Cue gates retained.

Actual boundaries: prepared local resolver/parser/builder errors avoid native
code/message/cause inspection and missing-reference publication; captured policy
also reaches staging and async cleanup. Completed prior rollback captures the
exact child before JSON/stdin preparation. Ordinary successful construction and
helper defaults are untouched. SSH/PTY/shell/unsupported provider paths are refused
by prepared lifetime; ordinary SSH/SDK/direct image callers receive no authority.
There are no production prepared-lifetime callers/proof issuance on this branch.
Arbitrary custom executable verification, external transcript/disk/debug/history
privacy and independent Cue publishers remain unfinished; this is not global
proof-delivery or public mail acceptance. No proof/native/keyring/provider/mail
runtime, secret retrieval, live login, installation, merge, callbacks, Discord,
consultation/dispatch or other-checkout source/test/git writes.

Exact checks from `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, using
existing dependencies via a temporary worktree-local symlink:

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/storage/session-image-store.ts src/main/process-manager/utils/imageUtils.ts src/main/process-manager/utils/streamJsonBuilder.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/process-manager/ProcessManager.ts src/main/process-manager/handlers/ExitHandler.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/storage/session-image-store.ts src/main/process-manager/utils/imageUtils.ts src/main/process-manager/utils/streamJsonBuilder.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/process-manager/ProcessManager.ts src/main/process-manager/handlers/ExitHandler.ts
git diff --check
```

Strict main typecheck, six-file source formatting and zero-warning ESLint each
**exit 0**; type/ESLint produce no diagnostics. Document format, whitespace and
preservation outcomes are receipted alongside final scope verification. Required
full repository/Host/SDK/Cue tests/gates remain HOST-05; no suites ran here.

Artifacts: `.maestro/verification/host-03-persisted-image-completion/` contains
entry hashes/document snapshots/git status/index fingerprint, exact argv/cwd/exits
and output, actual call-site inventory, CLI run/session/roster/status receipts,
final patches and scope/preservation audit. Shared writes limited to HOST-03 and
EVIDENCE. No shared dependency tree mutation; temporary symlink removed after
checks. Branch `feat/relay-imap-host-20261006`; full base/current HEAD unchanged
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. **Uncommitted; no staging, commit,
push or PR.** No PR because public mail/production wiring, proof issuance and
normal acceptance/gates remain incomplete; conditional git task stays HOST-05.
Host API **1.16.0**, SDK **0.11.0**, Relay minimum **1.22.0** unchanged.

CLI-observed active run (**running** at inspection):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791344143142:1791344143284:q3dxax`;
spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791344143142`.
CLI-confirmed execution tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`, worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, roster-confirmed owner
`0af39dab-3c06-40de-9077-99207660c1e9`. Session listing reports idle and provider
agentSessionId null; auto-run-status reports running false/state null. These do
not override the independent running AgentRun receipt; no relaunch was attempted.
Report is this execution response. Launch provenance remains shared LAUNCH.json.

## HOST-03 provider output composition acceptance audit (2026-10-07)

Completed exactly one previously unchecked HOST-03 provider diagnostic/output
publication task by auditing its completed source prerequisites and actual
manager/spawner/Stdout/Stderr/Exit/subscriber composition. **Source changes
0 files/0 lines; tests created 0, executed 0; static-only, neither mock-tested nor
production-tested.** Appended the acceptance audit to the contract and mirrored
this evidence to shared EVIDENCE. All other unchecked tasks remain unchecked.

Prepared ingress withholds all provider stdout/stderr before conversion/parsing;
raw subscribers receive only empty content/session liveness. Captured native and
listener errors use fixed diagnostics; exit/rollback bypass provider result,
preview and disk fallback and dispose exact residual buffers/timers without
flush. Existing executable input and ordinary diagnostics were preserved. No
handler-local duplicate policy was necessary. Boundary-by-boundary inventory and
deferred real-composition/split-stream/error/nonmutation/regression requirements
are in the contract and task receipt `audit.md`.

All commands ran from `/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/process-manager/ProcessManager.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/process-manager/handlers/StdoutHandler.ts src/main/process-manager/handlers/StderrHandler.ts src/main/process-manager/handlers/ExitHandler.ts src/shared/plugins/mcp-agent-config.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/process-manager/ProcessManager.ts src/main/process-manager/spawners/ChildProcessSpawner.ts src/main/process-manager/handlers/StdoutHandler.ts src/main/process-manager/handlers/StderrHandler.ts src/main/process-manager/handlers/ExitHandler.ts src/shared/plugins/mcp-agent-config.ts
git diff --check
```

Strict main typecheck, six-file source formatting, zero-warning ESLint and tracked
whitespace check each **exit 0**; type/ESLint emit no diagnostics. Document format
and scope/prefix/index/source preservation receipts accompany the final audit.
Existing dependencies were used through a temporary worktree-local symlink;
no installation/shared dependency mutation. Full repository/Host/SDK/Cue suites
and acceptance verification remain HOST-05; no tests or runtime ran here.

Proof issuance, upstream preparation diagnostics, external transcript/disk/history
readers, trusted custom executable selection, Cue output/lifetime and public mail
wiring remain unfinished. No production prepared caller is enabled; no useful
provider output or end-to-end proof privacy is claimed. Host API **1.16.0**, SDK
**0.11.0**, Relay minimum **1.22.0** unchanged/incompatible; full mail acceptance
**unmet**. No provider/proof/native/keyring/mail runtime, actual secret retrieval,
login, installation, upstream merge, callback, Discord or cross-agent dispatch.

Artifacts: `.maestro/verification/host-03-provider-output-completion/`, including
entry file hashes/document snapshots/git status/index fingerprint, exact argv/
cwd/exits/logs, publisher/caller inventory, CLI run/session/roster/status receipts
and final scope/patch verification. Shared writes limited to HOST-03 and EVIDENCE.
Branch `feat/relay-imap-host-20261006`; base/current HEAD unchanged
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. **No staging, commit, push or PR**;
conditional review/PR remains HOST-05 because production acceptance/gates are
incomplete. Earlier uncommitted host work was preserved.

CLI-observed active run (**running** at inspection):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791344329209:1791344329359:ht0bhf`;
spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791344329209`.
CLI-confirmed execution tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`, worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, roster-confirmed owner
`0af39dab-3c06-40de-9077-99207660c1e9`. Session listing reports idle/null provider
agentSessionId; auto-run-status reports running false/state null. Those observations
do not supersede the separate running AgentRun receipt; no relaunch was attempted.
Report is this execution response; launch provenance remains shared LAUNCH.json.

Final preservation audit: **5,577** other git-visible files and all three prior
document prefixes preserved; all **33** HOST-03 checkbox texts preserved with
exactly one unchecked-to-checked transition. HEAD/branch/index unchanged,
dependency symlink removed. Document formatting and final whitespace each
**exit 0**; `scope-final.json` and document/task patches record the verified scope.

## HOST-03 prepared spawn-event publication prerequisite (2026-10-07)

Completed exactly one newly split source prerequisite; the original broad
prepared-run diagnostic audit and all other pending tasks remain unchecked.
`src/main/process-manager/ProcessManager.ts`: **18 added/1 removed lines**, one
source file. Captured prepared runs now publish a frozen closed spawn-event
payload containing session/tool/cwd/tab/project metadata and empty command/args;
args are independently allocated and frozen, and prompt/env/images/callbacks/
unknown fields are excluded. Ordinary event identity and exact native execution
inputs remain unchanged. Audited actual AgentRun capture/store/broadcast and
session-only dispatch-correlation subscribers. No subscribers edited, callbacks
invoked, new helper/type/registry/logger/engine or public API added.

Contract appends the boundary inventory and deferred real-composition tests.
Upstream `handle-spawn` preparation/IPC failures, provider disk/transcript/session
readers, renderer backfill/history, plugin transcript projection, support-package
logs, custom executable trust and Cue publishers remain unproven before issuance.
Complete prepared output withholding remains; no production prepared caller,
useful-output policy or proof delivery is enabled. **Source/static-checked only;
no mock-tested or production-tested claim. Tests created/run: 0/0.**

Commands executed from `/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/main/process-manager/ProcessManager.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/process-manager/ProcessManager.ts
git diff --check
```

Each **exit 0**; strict main type/ESLint emit no diagnostics. Source format and
document format are checked with existing local dependencies through a temporary
worktree-local node_modules symlink; no shared dependency mutation or install.
Logs/argv/cwd/exits, source/document/task snapshots and patches, CLI run/session/
roster/status observations and final scope preservation audit are in
`.maestro/verification/host-03-prepared-spawn-publication/`. Full normal repository,
Host/SDK and required Cue suites remain HOST-05 before any push; none ran here.

Branch `feat/relay-imap-host-20261006`; base/current HEAD unchanged
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. **No staging/commit/push/PR**: conditional
review/PR remains HOST-05 because production wiring/acceptance/gates are incomplete.
All pre-existing host work is preserved. No provider/proof-file/native/keyring/mail
runtime, actual credential retrieval, login, installation, upstream merge,
callback, Discord, cross-agent dispatch or other-checkout source/test/git write.
Host API **1.16.0**, SDK **0.11.0**, Relay minimum **1.22.0** unchanged/incompatible;
full mail acceptance **unmet**.

CLI-observed active run at inspection (**running**):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791344619699:1791344619974:gp1123`;
spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791344619699`.
CLI-confirmed execution tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`, worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, roster-confirmed owner
`0af39dab-3c06-40de-9077-99207660c1e9`. Session listing reports idle/null provider
agentSessionId; auto-run-status reports running false/state null. Those separate
observations do not replace the active AgentRun receipt; no relaunch attempted.
Launch provenance remains shared `LAUNCH.json`; reporting is this execution tab.

Document formatting initially **exit 1** for the newly appended contract table;
formatted only that owned appendix while asserting the inherited prefix unchanged.
Final four-document formatting and whitespace checks each **exit 0**. Preservation
audit confirms all **5,576** other git-visible files and all three inherited
document prefixes unchanged; original **33** HOST-03 checkbox texts/statuses are
preserved, with exactly one added prerequisite checked complete. HEAD/branch/index
unchanged; temporary dependency symlink removed. See `scope-final.json` and patches
for exact checked artifacts.

## HOST-03 private MCP strategy admission prerequisite (2026-10-07)

Completed exactly one newly split self-contained source task in HOST-03; broad
diagnostic, Cue, issuance, test and review tasks remain unchecked. Changed only
`src/shared/plugins/mcp-agent-config.ts`: **13 added/3 removed lines** against the
entry snapshot. Explicit proof-file configuration now refuses unverified and
file-based/unknown strategies before env copying, serialization or file-builder
work. Only exactly verified Claude inline and Codex override strategies admit
host-selected file configuration. Captured path/strategy prevent later delivery
from rereading those values. Empty/non-string explicit values use the existing
fixed error; unsupported strategy denial uses `PrivateMcpSpawnFailed`. Ordinary
no-proof behavior and supported executable ordering/values remain unchanged by
source review. No new helper, type, registry, public API/version or production
caller. Contract records the actual caller and uncovered upstream, disk/history,
debug/custom executable/SSH/PTY/SDK and Cue boundaries plus deferred tests.

**Implemented/static-checked only; tests created/run: 0/0; no mock-tested or
production-tested claim.** Commands executed with cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

```bash
node /home/chris/code/Maestro/node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node /home/chris/code/Maestro/node_modules/prettier/bin/prettier.cjs --check src/shared/plugins/mcp-agent-config.ts
node /home/chris/code/Maestro/node_modules/eslint/bin/eslint.js --max-warnings 0 src/shared/plugins/mcp-agent-config.ts
git diff --check
```

Each **exit 0**; strict main typecheck and ESLint have no diagnostics. Full
repository/Host/SDK/security and required Cue suites remain HOST-05 before push;
none ran here. Existing dependencies were reused through a temporary
worktree-local node_modules symlink, with no installation/shared tree mutation.
New documentation sections alone were formatted; inherited prefixes are retained.
Final document formatting/scope/preservation results are in the task receipt.

Receipts: `.maestro/verification/host-03-proof-strategy-admission/`, with entry
hashes/snapshots, task/source patches, exact commands/cwd/exits/logs, CLI receipts
and final scope audit. Shared main-checkout writes are only HOST-03 and EVIDENCE
in `/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/`.
Branch `feat/relay-imap-host-20261006`; base/current HEAD unchanged
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. **No staging, commit, push or PR**;
production wiring, acceptance and repository gates remain incomplete. The
conditional review/PR task stays HOST-05. Earlier uncommitted work is preserved.

CLI-observed active run at inspection (**running**):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791344926462:1791344926604:gotw86`;
spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791344926462`.
CLI-confirmed execution tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`, worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; owner remains roster-confirmed
`0af39dab-3c06-40de-9077-99207660c1e9`. Session listing separately reports
idle/null provider agentSessionId, while auto-run-status reports false/null;
these do not replace the running AgentRun evidence. No engine was relaunched.
Initial launch receipt remains the shared `LAUNCH.json`.

No provider/proof-file/native/keyring/mail runtime, secret retrieval, live login,
installation, upstream merge, callback, Discord or cross-agent action occurred.
Host API **1.16.0**, SDK **0.11.0**, Relay minimum **1.22.0** unchanged/incompatible;
full mail acceptance **unmet**. Reporting is this execution tab only.

## HOST-02 focused transfer-decoding test creation (2026-10-07)

Completed exactly one newly split self-contained test-creation task in
`RELAY-IMAP-HOST-02.md`; broad lifecycle/security-test and HOST-03/04/05 tasks remain
unchecked. Added only `src/__tests__/main/plugins/mail-transfer-decoding.test.ts`:
**406 test lines, 25 declarations / 119 statically counted parameterized cases**.
Production source edits: **0**. Tests executed: **0**, by the selected task's
explicit separation of creation and execution; no runtime pass/fail count exists.
Actual consumer/shared-validator/header-projector behavior is asserted with
synthetic byte fixtures and narrow restored Buffer allocation instrumentation.
No decoder/projector/result mocks, real storage/keyring/network/provider or mail
activity were used. Coverage and remaining integration gates are in the contract
appendix; authored assertions are not mock-tested acceptance.

Static checks (all **exit 0**):

- `node node_modules/prettier/bin/prettier.cjs --check src/__tests__/main/plugins/mail-transfer-decoding.test.ts`
- `node node_modules/typescript/bin/tsc -p .maestro/verification/host-02-transfer-tests/typecheck.json --noEmit`
  (strict main/shared source plus this test; no emit or test import/execution).
- `node node_modules/eslint/bin/eslint.js -c eslint.dashes.config.mjs src/__tests__/main/plugins/mail-transfer-decoding.test.ts --max-warnings 0`
  (the repository's configured test ESLint pass; production ESLint ignores tests).
- `git diff --check`, plus final source/document formatting and scope/prefix
  preservation checks recorded in the receipt directory.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`; branch
`feat/relay-imap-host-20261006`; base and unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No commit or PR created: this is an
unexecuted test prerequisite and full mail acceptance/normal repository gates
remain incomplete. No upstream merge, install or shared dependency mutation.
Existing dependencies were exposed through a temporary worktree symlink for
static checks; the symlink is removed before settlement. Evidence receipt root:
`.maestro/verification/host-02-transfer-tests/` (entry hashes/document snapshots,
static check logs, AST inventory, CLI receipts and final scope report).

Observed CLI provenance (all read commands **exit 0**, no callback): worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, owner
`0af39dab-3c06-40de-9077-99207660c1e9`, execution tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. AgentRun list reports running receipt
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791345186719:1791345186996:8c5os6`
with actual session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791345186719` and this registered cwd.
Both separate auto-run-status queries report `running: false`, `state: null`;
these do not replace the running AgentRun receipt, and no relaunch was attempted.
No cross-agent contact or new launch/callback/Discord operation occurred.

## HOST-02 focused charset-decoding test creation (2026-10-07)

Completed exactly one newly split self-contained test-creation task in
`RELAY-IMAP-HOST-02.md`. Added only
`src/__tests__/main/plugins/mail-text-decoding.test.ts`: **396 lines,
23 declarations / 152 statically counted cases**.
Production source changes: **0**. Tests executed: **0**; creation and execution
remain separate by the selected checkbox. There is no runtime pass/fail count.
The real plain consumer/shared core/header projector are exercised by authored
synthetic fixtures, with restored observing spies and no permissive parser mocks.
Coverage and remaining gates are documented in the contract appendix.

Final static checks, all **exit 0**, cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

- `node node_modules/prettier/bin/prettier.cjs --check src/__tests__/main/plugins/mail-text-decoding.test.ts`
- `node node_modules/typescript/bin/tsc -p .maestro/verification/host-02-text-tests/typecheck.json --noEmit`
  (strict main/shared source plus the new test; no test import/execution).
- `node node_modules/eslint/bin/eslint.js -c eslint.dashes.config.mjs src/__tests__/main/plugins/mail-text-decoding.test.ts --max-warnings 0`
- `git diff --check`, final document formatting and new-file whitespace/scope/
  prefix-preservation checks in the receipt directory.

Initial typechecks exited **2** for test-table inference and the intentional
invalid-input cast; both were fixed in the new test. Original diagnostics and
final clean exit **0** are preserved in `checks.json` and logs. No production
fixes or test execution were required. Test inventory uses the TypeScript AST
without evaluating/importing the file.

Worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`; branch
`feat/relay-imap-host-20261006`; base and unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No staging, commit, push or PR: full mail acceptance,
production wiring and normal repository gates remain incomplete. Conditional
review/PR and suite execution stay in HOST-05. Existing uncommitted source/tests
and document prefixes are preserved. The temporary worktree-local dependency
symlink is removed before settlement; no installation/shared dependency mutation.
Shared main-checkout writes are only HOST-02 and EVIDENCE in the existing playbook
folder. Receipt root: `.maestro/verification/host-02-text-tests/`, with entry
hashes/document snapshots, exact checks/logs, AST inventory, CLI receipts, patches
and final scope report.

CLI-observed active run (**running**):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791345541677:1791345541821:3gsgur`;
actual session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791345541677`.
CLI-confirmed worktree agent `228eef8c-75a8-46e8-bb67-2903da23bc06`, owner
`0af39dab-3c06-40de-9077-99207660c1e9`, execution tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. All five CLI read commands exit **0**;
both separate auto-run-status queries return false/null and session listing
reports idle/null provider session. These do not override the running AgentRun
receipt. No engine relaunch. Original launch receipt remains shared `LAUNCH.json`,
run `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i`,
launch exit **0**, callback null.

No native/storage/keyring/provider/mail runtime, real credential access, login,
installation, upstream merge, callback, Discord or cross-agent contact occurred.
Host API **1.16.0**, SDK **0.11.0**, Relay minimum **1.22.0** remain incompatible;
full mail acceptance **unmet**. Reporting is this execution tab only.

## HOST-02 focused MIME header test creation (2026-10-07)

Completed exactly one newly split self-contained test-creation checkbox in
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-02.md`.
Added only `src/__tests__/main/plugins/mail-mime-headers.test.ts`: **441 lines,
21 declarations / 143 statically counted cases**, counted via TypeScript AST
without importing/evaluating the test. Production source changes: **0**.
Tests executed: **0**, with no runtime pass/fail count; execution remains HOST-05.
The contract appendix records actual authored coverage and unfinished acceptance.
No permissive descriptor/parser/projector/result mocks or real native/state/network
seams were used. Existing uncommitted source/tests were preserved.

Final static commands, cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`,
all **exit 0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/__tests__/main/plugins/mail-mime-headers.test.ts`
- `node node_modules/typescript/bin/tsc -p .maestro/verification/host-02-mime-header-tests/typecheck.json --noEmit`
  (strict main/shared source plus this test; no test import/execution).
- `node node_modules/eslint/bin/eslint.js -c eslint.dashes.config.mjs src/__tests__/main/plugins/mail-mime-headers.test.ts --max-warnings 0`
- `git diff --check`, plus document formatting/new-file whitespace/scope checks
  captured in the receipt directory.

Initial strict typecheck exited **2** for table tuple inference, corrected in the
new test; final strict check exits **0**. Initial and final logs are preserved in
`checks.json`. Source review also corrected the authored fixed-error message before
settlement. Receipt root `.maestro/verification/host-02-mime-header-tests/` contains
entry hashes/document snapshots, exact check logs, static inventory, CLI receipts,
patches and final scope report. A temporary worktree-local node_modules symlink
reused existing dependencies for static checks and is removed before settlement.
No installation or shared dependency mutation.

Branch `feat/relay-imap-host-20261006`; base and unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No staging/commit/push/PR: full mail
acceptance, production wiring and normal repository gates remain incomplete.
Conditional review/PR stays in HOST-05. Shared main-checkout writes are limited
to the existing playbook HOST-02 and EVIDENCE. No real credentials/keyring/storage/
provider/mail runtime, login, upstream merge, callback, Discord or cross-agent
contact. Full mail acceptance remains **unmet**, host API **1.16.0**, SDK **0.11.0**
and Relay minimum **1.22.0** unchanged.

CLI-observed running task receipt (all four read commands **exit 0**):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791345887004:1791345887143:1mco7m`,
actual session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791345887004`.
CLI-confirmed worktree agent `228eef8c-75a8-46e8-bb67-2903da23bc06`, owner
`0af39dab-3c06-40de-9077-99207660c1e9`, execution tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. Separate auto-run-status returns
false/null; session list reports idle/null provider session. These do not override
the running AgentRun receipt, and no relaunch occurred. Original shared
`LAUNCH.json` records run
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i`,
launch exit **0**, callback null. Report is this execution tab only.

## HOST-02 credential queue-settlement guard (2026-10-07)

Completed only the newly split self-contained source task before the oversized
account lifecycle integration checkbox. **Implemented/static-checked only;
tests authored/run: 0/0; no runtime or production-tested claim.** Source:
`src/main/plugins/mail-account-credentials.ts`, 27 added/9 removed lines.
All pre-existing source/tests preserved except this explicit module correction.

Reused the existing committedAuthority guard with captured setup authority after
savePassword/mutateAccount/cleanupRemovedAccount queues settle, retaining exact
installation/target revision/disabled state or removal history. Removal completion
requires the current confirmedAbsent marker; pending retry or stale/canceled/
revoked/anchor/persistence failure denies before success. Unrelated accounts can
change. No released lease is reused, no new store/queue/principal/latch recovery,
no extra native probe, no rollback; durable changes may survive a suppressed
response. Contract records actual boundary and deferred synthetic composition tests.

Commands from `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, using
existing dependencies via a temporary worktree-local node_modules symlink:

```bash
node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/plugins/mail-account-credentials.ts
git diff --check
```

Final commands all exit **0**. Initial formatting check exit **1** for indentation;
fixed using the existing Prettier (`--write`, exit 0). Initial type/ESLint/whitespace
also exit 0. This is static verification only; full repository/Host/SDK/required Cue
suites and test execution remain HOST-05. No dependency install or shared tree
mutation; temporary worktree symlink removed. Snapshots, source/doc/playbook diffs,
argv/cwd/exits/logs, CLI observations and scope hashes:
`.maestro/verification/host-02-credential-settlement/`.

Branch `feat/relay-imap-host-20261006`; base/current HEAD unchanged
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No stage/commit/push/PR: normal gates,
production integration and full acceptance are incomplete and conditional review
remains HOST-05. Public host API 1.16.0, SDK 0.11.0, Relay minimum 1.22.0 unchanged.
No actual keyring/storage/transport/provider invocation, real credentials/login,
installation, upstream merge, callbacks, Discord, cross-agent dispatch or other
checkout source/test/git write. Only shared playbook evidence is written in main.

CLI-observed active run at inspection:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791346257307:1791346257593:u8nu6k`
(**running**), spawned session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791346257307`.
CLI-confirmed execution tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`, worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, roster-confirmed owner
`0af39dab-3c06-40de-9077-99207660c1e9`. Session listing separately reports idle/null
provider agentSessionId; auto-run-status reports running false/state null. These
separate CLI observations do not establish completion and no run was relaunched.
Only this split checkbox is completed; larger lifecycle/test/publication acceptance
remains unfinished.

## HOST-02 complete MIME traversal test creation (2026-10-07)

Completed exactly one newly split self-contained test-creation prerequisite from
HOST-02. Added `src/__tests__/main/plugins/mail-mime-structure.test.ts`, **457 lines,
19 test declarations / 72 statically counted cases**. Inventory is TypeScript AST
parsing only, not test import/evaluation or execution. **Tests executed: 0**;
no runtime pass/fail count or mock-/production-tested acceptance is claimed.
Production source changes: **0**; baseline SHA-256 comparison verifies every
pre-existing source and test unchanged. Only this new checkbox is checked; larger
account lifecycle/security work and HOST-05 execution/review remain unchecked.

Actual traversal/header/scanner fixtures cover closed frozen ordered trees,
independent opaque binary/encoded leaf buffers and labels; complete delimiters,
empty parts and delimiter-owned CRLF; root version/type, case/boundary, padding,
preamble/epilogue/truncation/prefix and later unsupported/ambiguous-part denial.
Exact positive/negative pairs cover source/per-header/aggregate-header/depth/node/
leaf budgets. Before-allocation rejection, input alias and actual header/marker
copy erasure, failed/prior leaf allocation cleanup and fixed native-error refusal
are authored. No permissive parser/descriptor/result mocks; only restored narrow
synthetic Buffer failure/observation seams. Encoded bytes remain host-private;
no authority, decoding, content validation or public DTO acceptance is supplied.

Commands from `/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

```bash
node node_modules/prettier/bin/prettier.cjs --check src/__tests__/main/plugins/mail-mime-structure.test.ts
node node_modules/typescript/bin/tsc -p .maestro/verification/host-02-mime-structure-tests/typecheck.json --noEmit
node node_modules/eslint/bin/eslint.js -c eslint.dashes.config.mjs src/__tests__/main/plugins/mail-mime-structure.test.ts --max-warnings 0
git diff --check
node .maestro/verification/host-02-mime-structure-tests/inventory.cjs
```

Final commands all **exit 0**, no type/lint diagnostics. Initial static checks also
exit 0; existing Prettier formatted the new file, exit 0. The ESLint command uses
the repository's configured test pass (the main config ignores tests). Strict
config extends tsconfig.main.json and includes all main/shared/types plus this
new test. Final document formatting, new-file/document whitespace and scope
receipts are recorded alongside these logs. Full repository/Host/SDK/Cue suites
were not run; their execution is a separate HOST-05 task. Temporary worktree-local
node_modules symlink was removed; no installation or shared dependency mutation.

Receipt root `.maestro/verification/host-02-mime-structure-tests/` contains entry
source hashes/doc snapshots, exact argv/cwd/exits/logs, reproducible AST inventory,
CLI receipts, source-preservation and task/doc/playbook patches. Contract and both
evidence ledgers updated. Shared main-checkout writes: existing HOST-02 and EVIDENCE
only. No source/test/git operations in other checkouts, install, merge, credentials,
keyring/storage/provider/proof-file runtime, mail login, callback, Discord or
cross-agent messages.

Branch `feat/relay-imap-host-20261006`; base/unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No staging, commit, push or PR: full mail
acceptance, production wiring and normal repository gates remain incomplete;
conditional review/PR stays in HOST-05. Host API 1.16.0 / SDK 0.11.0 / Relay minimum
1.22.0 unchanged; overall acceptance remains **unmet**.

CLI-confirmed execution tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`, worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, owner
`0af39dab-3c06-40de-9077-99207660c1e9`. Active AgentRun observed:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791346568335:1791346568474:6ha7wk`
(**running**), actual session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791346568335`.
Separate tab/status observations remain idle/null provider session and Auto Run
false/null; they do not supersede the running AgentRun. An initial auto-run-status
command omitted required --agent (exit 1); corrected read exits 0. Other three
identity reads exit 0. No launch/run ID inferred or engine relaunched. Findings
are reported in this execution tab, with no callback or inferred recipient.

## HOST-02 focused MIME content composition test creation (2026-10-07)

Completed exactly one newly split test-creation prerequisite in HOST-02.
Added `src/__tests__/main/plugins/mail-mime-content.test.ts`: **497 lines,
15 test declarations / 55 statically counted parameterized cases**. Counts use
TypeScript AST parsing only, without importing/evaluating the test file.
**Tests executed: 0**; no runtime pass/fail result, mock-tested or production-tested
acceptance. Production source changes: **0**. SHA-256 comparison verifies every
pre-existing source/test unchanged. The larger lifecycle/security tasks and
HOST-05 suite execution/review remain unchecked.

Synthetic complete sources exercise real traversal, header, transfer and charset
consumers, with no permissive parser/consumer/result mocks. Authored coverage:
closed frozen complete empty/nonempty ASCII/UTF-8 body shells and exact UTF-8 sizes;
body absence vs empty, named/attachment text separation, sender-declared binary
labels and supported transfers, independent mutable attachment buffers and
source-order numeric paths/root ID. Mixed independent bodies reject; alternatives
choose the last complete candidate, including empty, while invalid/discarded or
attachment-containing alternatives reject without fallback. Exact boundary pairs
cover 256 KiB aggregate body candidates (nested/discarded), 16 attachments including
empty parts, 8 MiB per attachment and 16 MiB aggregate, with empty leaves allowed
at exhausted budgets and observed refusal before decoded allocation. Raw source,
depth/leaf/line overflow fixtures retain canonical structural/transfer limits.

Actual allocation observations assert source/encoded/header/marker/body-temporary
erasure and caller-owned successful buffers. Later protocol/limit failures and
narrow synthetic native allocation/fill failures assert earlier/failed attachment
cleanup, fixed errors and no native causes/content. Buffer instrumentation is
restored after every case. Declared MIME is not file-format proof; strings cannot
be zeroized. Authorized readers, leases/deadlines, DTO/chunk/publication/setup,
transport/account/security integration and production wiring remain unfinished.

Final static commands from `/home/chris/code/worktrees/feat/relay-imap-host-20261006`,
all **exit 0**:

```bash
node node_modules/prettier/bin/prettier.cjs --check src/__tests__/main/plugins/mail-mime-content.test.ts
node node_modules/typescript/bin/tsc -p .maestro/verification/host-02-mime-content-tests/typecheck.json --noEmit
node node_modules/eslint/bin/eslint.js -c eslint.dashes.config.mjs src/__tests__/main/plugins/mail-mime-content.test.ts --max-warnings 0
node .maestro/verification/host-02-mime-content-tests/inventory.cjs
```

The strict config includes main/shared/types and this test; ESLint uses the
repository's configured test pass. Initial typecheck exited **2** for overloaded
Buffer spy tuple indexing; corrected observation typing, final exit **0**.
Source review corrected a fixture MIME type to the actual supported PDF label;
no MIME sniffing/repair or production change. Formatting writes exit **0**;
tracked/new-file whitespace, final document formatting and scope checks are
recorded in the receipt root `.maestro/verification/host-02-mime-content-tests/`.
This contains exact argv/cwd/exits/logs, baseline/document snapshots, static
inventory, CLI observations and final patches. Temporary worktree-local dependency
symlink reuses existing dependencies and is removed before settlement; no install
or shared dependency mutation. No suite/native/storage/keyring/provider/proof-file/
mail runtime, credentials/login, upstream merge, callback, Discord or cross-agent
contact. Shared main-checkout writes: existing HOST-02 and EVIDENCE only.

Branch `feat/relay-imap-host-20261006`; base/unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No staging, commit, push or PR: normal
repository/SDK/required Cue gates, production wiring and full mail acceptance
remain incomplete; conditional review/PR stays HOST-05. Host API **1.16.0**, SDK
**0.11.0**, Relay minimum **1.22.0** unchanged; overall acceptance remains **unmet**.

CLI reads (sessions, roster, runs, owner/worktree auto-run-status) all exit **0**.
Confirmed worktree agent `228eef8c-75a8-46e8-bb67-2903da23bc06`, roster owner
`0af39dab-3c06-40de-9077-99207660c1e9`, execution tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. Observed active AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791346950046:1791346950189:9v217b` (**running**), actual spawned session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791346950046`.
Separate session listing reports idle/null provider agentSessionId, both Auto Run
status reads return false/null; these do not override the running AgentRun.
No engine relaunched or run ID inferred. Original shared `LAUNCH.json` records
launch exit **0**, callback null, run
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i`.
Report is this execution tab only.

## HOST-02 focused IMAP framing test creation (2026-10-07)

Completed exactly one newly split bounded test-creation prerequisite in
`/home/chris/code/Maestro/.maestro/2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-02.md`.
Added `src/__tests__/main/plugins/mail-imap-framing.test.ts`: **470 lines,
25 test declarations / 97 statically counted parameterized cases**. Counts use
TypeScript AST parsing only, without test import/evaluation. **Tests executed: 0**;
no runtime pass/fail, mock-tested or production-tested result. Production changes:
**0**. SHA-256 baseline verification confirms all pre-existing source/tests unchanged.
Only the new framing prerequisite is checked; broad lifecycle/security and HOST-05
execution/review remain unchecked.

Actual decoder fixtures cover every two-chunk split and byte-wise streaming;
ordered restricted frames, opaque status/quoted structure and binary/empty/multiple
literals; independent ownership and unchanged input. Malformed ASCII/CRLF,
unsupported extensions/continuations, numeric/tag/quote/escape/marker/structure
refusal poison the decoder. Exact hard line/literal/response/literal-count/depth
boundaries and tightened byte/structural budgets include before-allocation refusal,
boundary-only zero/restore literal caps and cumulative wire/response accounting.
EOF/cancel, pending line/literal and failed same-chunk frame erasure preserve
previously returned ownership. Restored narrow allocation/copy failure seams exercise
actual Buffer operations and fixed errors without native cause/content. Framing
success does not supply command/session/UID/account/authority/publication acceptance.

Final static commands, cwd this registered host worktree, all **exit 0**:

```bash
node node_modules/prettier/bin/prettier.cjs --check src/__tests__/main/plugins/mail-imap-framing.test.ts
node node_modules/typescript/bin/tsc -p .maestro/verification/host-02-imap-framing-tests/typecheck.json --noEmit
node node_modules/eslint/bin/eslint.js -c eslint.dashes.config.mjs src/__tests__/main/plugins/mail-imap-framing.test.ts --max-warnings 0
node .maestro/verification/host-02-imap-framing-tests/inventory.cjs
git diff --check
```

Strict config includes all main/shared/types and the new test. Configured test
ESLint checks only the dash rule, not full semantic lint. Initial type/lint/static
inventory checks also exit **0**; existing Prettier formatting writes exit **0**.
Final document formatting, whitespace and scope receipts are recorded in
`.maestro/verification/host-02-imap-framing-tests/`, alongside exact argv/cwd/exits,
baseline/document snapshots, AST inventory, source-preservation, CLI observations
and final patches. Temporary worktree-local node_modules symlink reuses existing
dependencies and is removed before settlement; no installation/shared dependency
mutation. No suite/native/storage/keyring/provider/proof-file/mail runtime, credentials,
login, upstream merge, callback, Discord or cross-agent contact. Shared main-checkout
writes are only existing HOST-02 and EVIDENCE.

Branch `feat/relay-imap-host-20261006`; worktree
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`; base/unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No staging, commit, push or PR:
production wiring, full mail acceptance and normal required repository/SDK/Cue
execution gates remain incomplete; conditional review/PR stays HOST-05.
Host API **1.16.0**, SDK **0.11.0**, Relay minimum **1.22.0** unchanged.
Overall acceptance remains **unmet**.

CLI sessions/roster/runs/owner and worktree Auto Run reads all exit **0**.
Observed registered worktree agent `228eef8c-75a8-46e8-bb67-2903da23bc06`, owner
`0af39dab-3c06-40de-9077-99207660c1e9`, execution tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. Active AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791347363790:1791347364069:1iuwoc`
(**running**), actual spawned session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791347363790`.
Separate tab listing reports idle/null provider session, both Auto Run status reads
false/null; these do not supersede the running AgentRun. Original shared LAUNCH.json
is the launch receipt; no engine relaunched and no new launch ID inferred. Report
is this execution tab only, with no callback/inferred recipient.

## HOST-02 focused fixed-command test creation (2026-10-07)

Completed exactly one newly split self-contained test-creation prerequisite in
shared `RELAY-IMAP-HOST-02.md`; broad lifecycle/security and HOST-05 execution/review
remain unchecked. Added `src/__tests__/main/plugins/mail-imap-commands.test.ts`:
**497 lines, 19 test declarations / 121 statically counted parameterized cases**.
Inventory uses TypeScript AST parsing only; no import/evaluation. **Tests executed:
0**, no runtime pass/fail, mock-tested or production-tested acceptance. Production
source changes: **0**. SHA-256 baseline confirms **5158** pre-existing source/test
files unchanged; only the named new test was added.

Actual composition exercised by the authored assertions is the fixed builder,
UID/quoted-string validators, response semantic validator, literal erasure and
real synchronous framing decoder; no permissive parser/result mocks. Synthetic
fixtures cover exact wire/closed shapes, tag/ASCII/field ceilings and before-buffer
allocation refusal, escaping/ampersand encoding, fixed header allowlist, numeric
ranges/part paths and raw/write refusal. Complete decoded response cases cover
exact final tag, fixed safe errors without causes/content, allowed/unsupported
status codes, exact READ-ONLY EXAMINE/UIDVALIDITY/data, empty/ordered/unique/in-range
SEARCH with 1024/1025 bounds; exact UID/BODY sections and both attribute orders,
empty/binary literals and caller ownership, exact 64 KiB headers/8 MiB parts plus
one-byte overflow, 24 MiB full source, all-literal erasure on later failures and
LOGIN/NOOP/LOGOUT restrictions. Defensive malformed typed frame lengths and >256
record count are labeled internal-record checks, not supported malformed wire.
Returned Buffers remain consumer-owned and explicitly erased; command LOGIN bytes
are erased by the tests. Strings cannot be zeroized. Account/grants/TLS/session/
setup/publication/SDK/Cue/runtime acceptance remains incomplete.

Final static commands, all from this registered worktree:

```bash
node node_modules/prettier/bin/prettier.cjs --check src/__tests__/main/plugins/mail-imap-commands.test.ts
node node_modules/typescript/bin/tsc -p .maestro/verification/host-02-imap-command-tests/typecheck.json --noEmit
node node_modules/eslint/bin/eslint.js -c eslint.dashes.config.mjs src/__tests__/main/plugins/mail-imap-commands.test.ts --max-warnings 0
node .maestro/verification/host-02-imap-command-tests/inventory.cjs
git diff --check
```

Final checks **exit 0**, no type/lint diagnostics. Strict config includes all
main/shared/types plus the new test. The configured test ESLint pass checks the
dash rule only, not full semantic lint. Prettier formatting writes also exit 0.
Final doc formatting/whitespace/scope checks are in the receipt root
`.maestro/verification/host-02-imap-command-tests/`, along with exact argv/cwd/exits,
baseline source hashes/doc snapshots, reproducible copied AST inventory, source
preservation, CLI observations and final patches. Temporary worktree-local dependency
symlink reuses installed dependencies and is removed before settlement; no install
or shared dependency mutation. Shared main-checkout writes: existing HOST-02 and
EVIDENCE only. No native/storage/keyring/network/provider/proof-file runtime,
credentials, login, upstream merge, callback, Discord or cross-agent contact.

Branch `feat/relay-imap-host-20261006`; worktree
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`; base/unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No staging, commit, push or PR: full
mail acceptance, normal required repository/SDK/Cue gates and production wiring
remain incomplete. Host API **1.16.0**, SDK **0.11.0**, Relay minimum **1.22.0**
unchanged; overall acceptance remains **unmet**.

All five CLI identity/status reads exit **0**. Worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`, roster owner
`0af39dab-3c06-40de-9077-99207660c1e9`, execution tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. Observed active AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791347743149:1791347743290:ahuz1s`
(**running**), actual spawned session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791347743149`.
Separate tab reports idle/null provider session and both Auto Run status reads
false/null; these do not supersede the running AgentRun. Original shared LAUNCH.json
remains the launch receipt; no relaunch or new launch ID inferred. Report is this
execution tab only, with no callback/inferred recipient.

## HOST-02 configured-account TLS connection test creation (2026-10-07)

Completed exactly one newly split test-creation prerequisite in shared
`RELAY-IMAP-HOST-02.md`. New file `src/__tests__/main/plugins/mail-imap-connection.test.ts`:
**498 lines, 22 declarations / 75 statically counted parameterized cases**.
Inventory parses TypeScript AST only, never imports/evaluates the test. **Tests
executed: 0**, no runtime pass/fail or mock-tested/production-tested acceptance.
Production source changes **0**; SHA-256 baseline verifies **5159**
pre-existing source/test files unchanged. Only the named test was added.

The authored assertions exercise actual endpoint/configured-connection/egress/
lookup/certificate-hostname/greeting-framing composition with a narrow synthetic
EventEmitter paused-read socket and injected DNS candidates. Existing TEST-PATTERNS
and socket fixtures were searched; no reusable TLS fixture was found. No permissive
guard/parser/result mocks. Coverage is authored for frozen trusted configuration
projection/stripped TLS overrides, host/port/IP/numeric aliases, required live host
config/authority and ID/tighten-only deadline admission; all-candidate preflight
and actual lookup private/rebinding/empty/failure/blocked-port/revocation denial;
exact TLS option keys/SNI/certificate-hostname delegation and public pinned address
(single/all callback shapes); secure-before-reading/split greetings, invalid status/
capability/multiple/partial/literal-limit/continuation refusal; native/certificate/
EOF/throw errors, content-free fixed errors; caller cancellation, delayed DNS result
suppression, original DNS/greeting/lifetime deadlines and synchronous elapsed-time
checks; permanent ready-session revocation, timer/listener/admission release,
account exclusion/four-socket plugin cap and unrelated-plugin admission. Synthetic
socket destruction does not prove native TLS cleanup or cryptographic validation.
LOGIN/fixed-session state and result bytes, shared authentication budget, pending
write cancellation, account/credential/read/setup/publication/SDK/Cue composition
remain separately unfinished. No source changes or production readiness claim.

Exact final static commands, all cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

```bash
node node_modules/prettier/bin/prettier.cjs --check src/__tests__/main/plugins/mail-imap-connection.test.ts
node node_modules/typescript/bin/tsc -p .maestro/verification/host-02-imap-connection-tests/typecheck.json --noEmit
node node_modules/eslint/bin/eslint.js -c eslint.dashes.config.mjs src/__tests__/main/plugins/mail-imap-connection.test.ts --max-warnings 0
node .maestro/verification/host-02-imap-connection-tests/inventory.cjs
git diff --check
```

Each final command **exit 0**. TypeScript config includes all main/shared/types and
the new test; scoped ESLint checks the repository dash rule only, not semantic test
lint. Initial TypeScript **exit 2** found recursive fixture return inference and a
literal-narrowed lookup host parameter; corrected locally, final **exit 0**. Initial
formatting/ESLint/inventory/whitespace checks exit 0; formatting writes exit 0.
Logs/exact argv/cwd/exits, baseline snapshots/source hashes, static inventory,
identity observations and final patches are in
`.maestro/verification/host-02-imap-connection-tests/`. Document format/whitespace/
prefix/checklist/source-preservation checks follow in `report-commands.json`.
Temporary worktree-local dependency symlink reuses installed dependencies only and
is removed before settlement. Shared main writes: existing HOST-02 and EVIDENCE.
No installation/shared dependency mutation, provider/proof/keyring/storage/network/
mail runtime, real credentials/login, callbacks/Discord/upstream merge/deployment,
other-checkout source/test/git changes or new Backstage contact. Existing Backstage
handoff evidence remains unchanged.

Branch `feat/relay-imap-host-20261006`; worktree `/home/chris/code/worktrees/feat/relay-imap-host-20261006`;
base/unchanged HEAD `1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No staging/commit/push/PR:
normal repository/SDK/Cue execution gates, full mail acceptance and production
wiring remain incomplete; review/conditional PR stays HOST-05. Host API **1.16.0**,
SDK **0.11.0**, Relay minimum **1.22.0** unchanged; overall acceptance **unmet**.

All five CLI identity/status reads **exit 0**. Registered worktree agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; roster owner
`0af39dab-3c06-40de-9077-99207660c1e9`; execution tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. Observed active AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791348103879:1791348104032:bao29r` (**running**), actual spawned session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791348103879`. Separate tab listing idle/null provider session and both
Auto Run status reads false/null do not supersede the running AgentRun. Original
shared LAUNCH.json remains the receipt for launch run `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791323323363:1791323323513:yise0i`
(exit **0**, five documents); no relaunch or new launch ID inferred. This evidence
is reported in the execution tab only, no callback or inferred recipient.

## HOST-02 verified read lease-release completion prerequisite - 2026-10-08

Completed exactly one bounded implementation prerequisite inserted before the
oversized first unchecked lifecycle task in the current `RELAY-IMAP-HOST-02.md`.
Only this new prerequisite is checked; previous boxes are preserved and parent
lifecycle/security test creation/production acceptance remain unchecked.

Source delta against captured dirty baseline:

| Source                                       | Added | Removed |
| -------------------------------------------- | ----: | ------: |
| `src/main/plugins/mail-account-activity.ts`  |    20 |       0 |
| `src/main/plugins/authorization-ledger.ts`   |    59 |       4 |
| `src/main/plugins/mail-invocation-reader.ts` |    29 |       6 |
| Total                                        |   108 |      10 |

The facade now releases its original outer lease before final success for verified
header/body/manifest/search/complete-attachment modes. The canonical activity
registry checks current global/plugin/account stop latches and pending mutation
state around live authority without admission/state allocation or latch reset.
The sealed ledger reuses one strengthened read guard for admission and completion,
including stored exact enabled-account/revision/independent-right checks after the
last host callback. Captured verified invocation/policy, exact installation/mailbox
and original caller cancellation/lifetime are rechecked after release; the last
time/cancellation check invokes no host callback. No released lease is reused or
second lease acquired. Complete attachment ownership remains local through the
guard, with byte erasure on denied late completion. Snapshot mode retains its
original lease/reservation/cleanup and never enters the released-read gate.
Unrelated account changes remain tolerated. No durable mutation rollback, extra
transport/keyring probe, second queue/store/runner or public surface was added.

Actual static commands, cwd `/home/chris/code/worktrees/feat/relay-imap-host-20261006`:

```bash
node node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-invocation-reader.ts
node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-invocation-reader.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-invocation-reader.ts
git diff --check
```

Each command **exit 0**. These are static checks, not executed tests. **Tests
created/executed: 0/0; images analyzed: 0** (no task image references). No imported
mail/provider/authority/keyring/storage/transport runtime was exercised. Existing
local dependencies were reused via a temporary worktree-local node_modules symlink
and removed before settlement; no install or shared dependency mutation.

Baseline hashes cover 4,904 existing source/test/Host-doc files; all pre-existing
source/test files except the three scoped source edits remain unchanged. Exact
patches/source delta, baseline snapshots, command argv/cwd/exits/logs, preservation
and checklist checks, and CLI receipts live in
`.maestro/verification/host-02-read-release-completion/`. Document formatting and
settlement receipts are recorded there separately. Initial document formatting
exited 1 for the new source-delta table; scoped evidence formatting exited 0 and
preserved its entire existing prefix. Final document formatting is recorded in
`format-documents-final.receipt.json`. Contract and shared EVIDENCE were appended,
and only the current executable HOST-02 document was edited.

Four read-only CLI observations each **exit 0**: agent-run list, session list,
agent roster, and registered-agent Auto Run status. Observed active AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791475191349:1791475191462:zfz8j8`
(**running** at observation). Actual spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791475191349`; no OS PID/provider
session ID is exposed in these CLI receipts. Registered worktree agent:
`228eef8c-75a8-46e8-bb67-2903da23bc06`; execution/report tab:
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. Desktop tab state idle/provider session null
and Auto Run status false/null are separate observations and do not supersede the
running AgentRun. No launch, callback, inferred recipient or agent dispatch occurred.
Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only;
this task reports through its own execution response and evidence.

Branch `feat/relay-imap-host-20261006`, unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. Overall acceptance remains unmet:
trusted setup/principal/policy injection, public SDK/RPC, production lifecycle,
monitors/events/Cue and runtime regression execution are unfinished. Host API
1.16.0, SDK 0.11.0, Relay minimum 1.22.0 unchanged. Backstage stays paused. No
commit/push/PR, hooks bypass, merge/deployment, real mail/server/login/credential,
live Cue subscription, direct Discord or callback. No true dependency blocker was
encountered for this prerequisite; no halt marker is warranted.

## HOST-02 queued mutation latch-completion prerequisite — 2026-10-08

Completed exactly one bounded source prerequisite inserted immediately before the
oversized first unchecked lifecycle task in the current HOST-02 document. Parent
lifecycle/security test creation/production acceptance remain unchecked; previous
completed boxes and dirty work are preserved.

Source delta against captured dirty baseline: `mail-account-activity.ts` **2 added /
2 removed**, `authorization-ledger.ts` **54 added / 1 removed** and
`mail-account-credentials.ts` **47 added / 17 removed**; total **103 added / 20
removed**, three source modules. The existing activity completion guard is reused
for all five queued setup operations after settlement. It checks pending/failed
account/plugin/global activity around mandatory captured setup/membership callbacks,
sealed exact plugin/dual identity/installation/target revision and enabled/cleanup
intent, and cancellation including during synchronous native freshness checks.
Confirmed removed-slot cleanup retains the actual anchored confirmedAbsent commit.
Unrelated-account changes at final completion remain admissible. Native work
ordering, canonical queue and stop latches remain intact. No new lease, retry
probe, store/queue/runner, rollback or public surface was introduced.

Static commands executed in this worktree:

```bash
node node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts
node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts
git diff --check
```

All **exit 0**. Static checks are not runtime tests. **Tests created/executed 0/0;
images analyzed 0** (no image references associated with this task). No mail,
native keyring, sealed store or transport runtime was invoked. Existing installed
local dependencies were reused through a temporary worktree-local node_modules
symlink; removed at settlement with no installation/shared dependency mutation.
Baseline hashes cover 5,373 pre-existing source/doc files. Scoped snapshots,
patches, argv/cwd/exit/log receipts, checklist/preservation checks and final document
format/whitespace receipts live in
`.maestro/verification/host-02-mutation-latch-completion/`.

Four read-only CLI observations each **exit 0**: recent AgentRuns, session list,
agent roster and registered-agent Auto Run status. Observed running AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791475716063:1791475716196:f1iutz`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791475716063`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. No OS PID/provider session ID is exposed by
these CLI observations. Desktop idle/provider session null and Auto Run
false/state null are separate observations, not completion evidence for the
running AgentRun. Coordinator tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context
only; report is confined to this execution response and evidence. No relaunch,
callback, notification or dispatch occurred.

Branch `feat/relay-imap-host-20261006`, unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No dependency blocker for this
prerequisite; no halt marker. Full lifecycle, trusted setup/principal/policy,
public SDK/RPC, monitors/events/Cue and runtime verification remain unfinished;
HOST-05 gates have not passed. Backstage stays paused. No commit/push/PR, hooks
bypass, merge/deployment, real mail/server/login/credential, live subscription or
Discord occurred. No production acceptance is claimed.

## HOST-02 synchronous stored-setup final cancellation prerequisite (2026-10-08)

Completed exactly one bounded source prerequisite inserted immediately before the
oversized first unchecked lifecycle task in current `RELAY-IMAP-HOST-02.md`.
Only that new prerequisite is checked; prior completed boxes and parent lifecycle,
broad security test creation, runtime execution and production acceptance remain
unchanged/unchecked. No later major checkbox was executed.

`src/main/plugins/mail-account-credentials.ts`: **4 added / 0 removed** against
captured dirty baseline. The three existing synchronous stored setup methods now
check their captured AbortSignal immediately after final sealed-state freshness
readback, before returning. Cancellation during that readback suppresses success
with fixed MAIL_CANCELED if freshness otherwise succeeds. Existing stale/sealed
errors retain precedence. This is a callback-free final gate; mandatory setup
checks, safe frozen projections and exact ownership remain intact. A late canceled
creation does not roll back already durable disabled-account intent. No new
helper/authority/store/queue/lease/probe, latch reset, API or production path.

Actual static commands in the registered worktree, each **exit 0**:

```bash
node node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-credentials.ts
node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/plugins/mail-account-credentials.ts
git diff --check
```

**Tests created/executed: 0/0; images analyzed: 0** (no task image references).
No mail/authority/native keyring/sealed-store/transport runtime was invoked.
Existing local dependencies were reused through a temporary worktree-local
node_modules symlink, removed at settlement; no installation/shared mutation.
Source static review confirms no callback after the final signal checks and no
change to queued native ordering or credential handling. Runtime regression
requirements were added as prose in the current document, separately deferred.

Receipts, command argv/cwd/exits/logs, five baseline snapshots, 5,373 pre-existing
source/doc hashes, source/document patches and preservation/checklist validation:
`.maestro/verification/host-02-sync-setup-cancellation/`. Final document-format,
whitespace and scope checks are recorded there as separate settlement receipts.
All pre-existing source/test files except the one scoped source module are
preserved; both evidence ledgers and contract retain their existing prefixes.

Four read-only CLI observations each **exit 0**: AgentRun list, session list,
agent roster and registered-agent Auto Run status. Running AgentRun at observation:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791476198290:1791476198430:zamico`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791476198290`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. No OS PID/provider session ID exposed by
these observations. Desktop idle/provider session null and Auto Run false/state
null are separate observations and do not establish AgentRun completion.
Coordinator tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; report is
confined to this task's own response/evidence, with no callback or dispatch.

Branch `feat/relay-imap-host-20261006`, unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No dependency blocker for this
prerequisite; no halt marker. Full lifecycle, trusted setup/principal injection,
public SDK/RPC, monitors/events/Cue and runtime verification remain unfinished;
HOST-05 gates have not passed. Backstage stays paused. No commit/push/PR, hook
bypass, merge/deployment, real mail/server/login/credential, live subscription,
notification or Discord. No production acceptance is claimed.

## HOST-02 inner fixed-read lease-release completion prerequisite (2026-10-08)

Completed exactly one bounded source prerequisite inserted immediately before the
oversized first unchecked account lifecycle task in current
`2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-02.md`. Only that prerequisite is
checked; previous boxes are preserved and parent lifecycle, broad security test
creation/execution and production acceptance remain unfinished. No next major
task was executed.

`src/main/plugins/mail-account-read.ts`: **33 added / 8 removed** against captured
dirty baseline, one existing source module. All seven fixed inner read modes now
release the original lease before final success, reuse canonical stored-right/
activity completion and captured caller/exact reference checks, and apply a final
callback-free captured-signal/original deadline guard. Raw header/source and
selected attachment buffers remain owned through completion and are erased on
late denial; own abort erasure is detached before ordinary release. No released
lease assertion or fresh lease/native/transport operation follows release.
Unchanged fixed command/MIME paths and frozen projections remain in place; actual
outer facade and snapshot retention remain independently enforced. Strings cannot
be erased, and post-return publication still needs fresh authority.

Actual static commands in the registered worktree, all **exit 0**:

```bash
node node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-read.ts
node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-read.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/plugins/mail-account-read.ts
git diff --check
```

**Tests created/executed 0/0; images analyzed 0** (no image references associated
with the task). No mail/authority/native keyring/sealed-store/transport runtime
was invoked. Deferred actual-reader/canonical-store/synthetic native/TLS
regressions are prose requirements in this current document, not authored tests
or runtime acceptance. Static review traced all seven modes through the same
close/release/completion/ownership boundary, normal success and late-denial erasure,
captured callback/signal, exact independent rights and original deadline. Strict
main type/ESLint checks are static checks, not execution of mail logic.

Baseline snapshots, scoped patches, source delta, 5,373 pre-existing source/doc
hashes, command argv/cwd/exits/logs, four CLI observations and preservation/
checklist/document-format/whitespace receipts are in
`.maestro/verification/host-02-inner-read-completion/`. Existing installed local
dependencies were reused via a temporary worktree-local node_modules symlink,
removed at settlement; no installation or shared dependency mutation. All
pre-existing source/test files except this one scoped module are preserved;
contract and both evidence ledgers retain their existing prefixes.

Read-only AgentRun/session/agent-roster/Auto Run status CLI observations each
**exit 0**. Observed running AgentRun: `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791476474380:1791476474665:eln2gx`.
Exact spawned process session: `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791476474380`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`.
No OS PID/provider session ID is exposed by those observations. Desktop idle/
provider session null and Auto Run false/state null are separate observations,
not completion evidence for the running AgentRun. Coordinator tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; report stays in this task's
own engine response/evidence. No callback/relaunch/notification/dispatch.

Branch `feat/relay-imap-host-20261006`, unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No dependency blocker for this
prerequisite, no halt marker. Full account lifecycle, trusted setup/principal/
policy injection, public SDK/RPC, monitors/events/Cue and runtime acceptance
remain unfinished. HOST-05 gates have not passed; Backstage plugin work stays
paused. No commit/push/PR, hook bypass, merge/deployment, live mail/server/login/
credential access, live Cue subscription or Discord. No production acceptance.

## HOST-02 retained attachment snapshot lifetime completion — 2026-10-08

Completed exactly one bounded source prerequisite inserted immediately before the
oversized first unchecked lifecycle parent in the current HOST-02 document. Only
this prerequisite is checked; the parent and broad security-test
creation remain unchecked. Existing checked boxes and dirty work are preserved.

`src/main/plugins/mail-invocation-reader.ts`: **2 added / 0 removed** against the
captured dirty baseline, one existing source module. Its shared outer live check
now ends with the existing callback-free captured-signal/original lifetime guard
after final canonical sealed-right readback. This covers actual snapshot adoption,
pre/post chunk encoding and retained publication assertions when synchronous
readback overruns while the invocation signal remains active. Static review traced
the actual facade/reservation/snapshot composition: existing catch/close erases
retained bytes and releases listeners/reservation/original lease on denial. No
released lease is reused, no lifetime renewed or native/transport work repeated.
Non-snapshot release-safe completion remains in place. No runtime outcome is
claimed, and previously returned JavaScript strings remain nonzeroizable.

Actual static commands in the registered worktree, each **exit 0**:

```bash
node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-invocation-reader.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/plugins/mail-invocation-reader.ts
git diff --check
```

**Tests created/executed 0/0; images analyzed 0** (no associated task images).
Mail/native keyring/sealed-store/TLS/provider logic was not invoked. Actual-composition
synthetic snapshot deadline/cancellation/ownership regression requirements were
added to the current document; test creation/execution remain separate phases.
Strict TypeScript and ESLint are static checks, not execution of mail logic.

Receipts: `.maestro/verification/host-02-snapshot-lifetime-completion/`, with five
baseline snapshots, 5,373 source/doc hashes, scoped patches, source delta, exact
argv/cwd/exits/logs, CLI observations and final preservation/checklist checks.
Existing dependencies reused via temporary worktree-local node_modules symlink;
removed at settlement, without installation or shared dependency mutation.
Contract and both evidence ledgers retain their previous content as prefixes.

Four read-only CLI observations each **exit 0**: running AgentRun list, session
list, agent roster, registered-agent Auto Run status. Observed running AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791476816892:1791476817242:dqggls`; exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791476816892`. Registered agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. No OS PID or provider session ID exposed.
Desktop idle/provider null and Auto Run false/state null are separate observations,
not running-AgentRun completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` remains context only; no callback/dispatch.

Branch `feat/relay-imap-host-20261006`; unchanged HEAD
`1ba9a8a92b7bd1b3106afd688c3a761ec2bd4f45`. No dependency blocker or halt marker.
Full lifecycle/trusted setup/policy/public API/monitors/events/Cue/runtime/production
acceptance remain unfinished. HOST-05 gates unmet; Backstage remains paused. No
commit/push/PR, hook bypass, dependency install, merge/deployment, real mail/server/
login/credential access, live Cue subscription, notification or Discord. Exit
after this one bounded task.

## HOST-02 inner fixed-reader pre-work lifetime gate — 2026-10-08

Completed one bounded source prerequisite inserted before the current document's
oversized first unchecked lifecycle parent. One existing source module,
`src/main/plugins/mail-account-read.ts`, **+2/-0**. Its shared live gate now finishes
with the original captured-signal/lifetime check after final synchronous sealed-right
readback, refusing further sensitive work on deadline overrun. Reuses existing
`assertLifetime` and authenticated-state transition, exact-right/reference/account/
installation/identity gates, byte/session/listener/lease cleanup and content-free
errors. No helper, timer, renewed budget, extra native probe, fresh lease, recovery,
setup minter or runtime/public integration. Source review only, no runtime claim.

Actual static commands, each **exit 0**, from the registered worktree:

```bash
node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-read.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json
node node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/plugins/mail-account-read.ts
git diff --check
```

**Tests created/executed 0/0; images analyzed 0**, no associated task images.
Contract and current HOST-02 deferred actual-composition regression requirements
updated. Strict TypeScript/ESLint are static checks; no mail/native keyring/sealed
storage/TLS/provider logic invoked. Source delta and five file baselines, 5,381-file
hash inventory, scoped patches, exact check argv/cwd/exits/logs and four read-only
CLI observations (all exit 0) saved under
`.maestro/verification/host-02-inner-read-lifetime/`. Existing installed local
packages reused through a temporary worktree-local node_modules symlink, removed
at settlement; no installation/shared dependency mutation.

Observed running AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791477162165:1791477163169:ldrilf`; exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791477162165`; registered agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. No OS PID/provider session ID exposed.
Auto Run false/state null is a separate observation, not completion evidence.
Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` context only;
no callback, dispatch or notification.

Branch `feat/relay-imap-host-20261006`; HEAD unchanged from baseline.
No dependency blocker or halt marker. Full lifecycle and broad test creation/
execution remain unchecked; HOST-05 gates unmet, Backstage paused. No production
acceptance, real mail/server/login/credential access, live Cue subscription, public
SDK/RPC/Cue wiring, install/merge/deploy/commit/push/PR/hooks bypass, Discord or
notification. Exit after this one task.

## HOST-02 queued disable credential retention (2026-10-08)

Completed the bounded source prerequisite inserted immediately before the first
unchecked oversized lifecycle task in the current `RELAY-IMAP-HOST-02.md`.
Static source tracing confirmed the contract's credential-retention mismatch:
`mutateAccount` deleted credentials for all three mutation kinds. It now excludes
only the closed disable snapshot from exact-slot deletion. One existing source
module `src/main/plugins/mail-account-credentials.ts`, **+4/-2** from the captured
dirty baseline, including the corrected method comment. No new helper/state/queue.

Canonical queued mutation still blocks read admission/cancels active leases before
awaiting, commits disabled intent with revision/epoch advancement and target rights
clearing, then checks captured setup/signal/lease/committed state and completion
latches. Disable constructs no slot and invokes no native entry factory/get/set/
delete; there is no secret presence/readiness probe. Settings replacement/removal
retain deletion/absence readback and removed-slot pending/confirmed markers.
Password-save native work and enable probing/rights clearing are unchanged. Public
stored-grant retention/re-enable semantics remain a separate unresolved seam; this
source prerequisite does not claim full Backstage lifecycle compatibility.

Actual commands/checks from the registered cwd, reusing installed local dependencies
through a temporary worktree-local `node_modules` symlink:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts`: initial exit **1** (formatting only). Scoped `--write`: exit **0**; final check exit **0**.
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.main.json`: exit **0**, strict main check, no emitted build.
- `node node_modules/eslint/bin/eslint.js --max-warnings 0 src/main/plugins/mail-account-credentials.ts`: exit **0**, configured scoped ESLint.
- `git diff --check`: exit **0**; added untracked-source lines manually/static checked for whitespace.
- Static scope/checklist preservation: exit **0**, 5,587-file baseline, 5,584 repository files outside the three permitted code/docs edits unchanged; all 57 original checkbox lines preserved, one bounded source prerequisite added.

Tests created/executed **0/0**, images analyzed **0**. Actual store/queue/anchor/
keyring regressions were specified in the current document and contract, not
created/run. Contract lifecycle-conflict/queued-mutation descriptions updated to
current behavior; both evidence ledgers record the source-only outcome. Dirty
baselines, source patch/delta, static receipts and filtered CLI identity observations
are in `.maestro/verification/host-02-disable-credential-retention/`. Document
format/whitespace and final preservation receipts are recorded there at settlement.
The temporary local dependency symlink is removed at settlement; no installation
or shared dependency writes.

Observed running AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791477428771:1791477429105:8w2sgy`; exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791477428771`; registered agent
`228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. Two read-only CLI observations exit 0.
Desktop idle/null provider session is a separate observation, not completion
proof; no OS PID/provider session ID exposed. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` remains context only; no callback,
dispatch or notification.

No dependency blocker or halt marker. The oversized lifecycle parent and broad
security-test creation remain unchecked. Credential retention is source-implemented
only; stored-grant retention/re-enable contract policy, trusted setup/production
lifecycle/public integration and runtime acceptance remain unfinished. HOST-05 gates
remain unmet, Backstage paused. No tests/native keyring/storage/network/mail/provider
runtime, real credentials/login, dependency installation/shared mutation, SDK/RPC/
Cue wiring/live subscription, Discord/callback/notification, commit/push/PR/hooks
bypass/upstream merge/deployment. Exit after this single source prerequisite.

## HOST-02 fixed LOGIN authority snapshot (2026-10-08)

Completed one bounded source prerequisite inserted immediately before the first
unchecked oversized lifecycle task in the current `RELAY-IMAP-HOST-02.md`.
Static source review found `MailCredentialSlot.authenticate` rereading the supplied
callback/signal after LOGIN await and using a potentially replaced signal for
listener cleanup. One existing module `src/main/plugins/mail-credentials.ts`,
**+14/-7** from the captured dirty baseline, now snapshots the original bound
callback and actual AbortSignal into frozen operation-local authority. Existing
native-entry/LOGIN/error checks and failure reauthorization use that snapshot;
listener removal uses the original signal. Invalid capture closes the session and
normalizes errors without rereading rejected fields during failure cleanup.

Pending LOGIN still closes immediately on original cancellation, and late success
requires original authority; password references are cleared and successful return
remains void. Account readers already pass frozen authority. No helper/store/queue/
lease/timer, cache, ownership proof, synchronous slot mutation semantics or public
API was introduced. Stored account rights/latches remain canonical and unchanged.
Actual slot/reader regressions were specified, not created/executed; JavaScript
strings and recipient/publication limitations remain honest.

Actual static commands from the registered cwd, using only installed dependencies
via a temporary worktree-local `node_modules` symlink:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-credentials.ts`: exit **0**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`: exit **0**, strict main check without emitted build/cache.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-credentials.ts --max-warnings 0`: exit **0**, configured scoped ESLint.

Whitespace, document and dirty-preservation checks are recorded at settlement in
`.maestro/verification/host-02-login-authority-snapshot/`, with source baseline,
scoped patch, hashes, logs and filtered CLI receipts. Contract/current playbook/both
ledgers updated. Tests created/executed **0/0**, images analyzed **0**. Existing
source/test dirty work and every original completed/unfinished checkbox preserved.
The temporary local dependency symlink is removed at settlement; no install/shared
mutation. No dependency blocker or halt marker.

Observed running AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791477841554:1791477841690:i8aymd`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791477841554`;
registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context). CLI run-list and
show-agent reads exit 0. No OS PID/provider session ID exposed by these reads.
Coordinator tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` context only; no callback,
dispatch or notification. Running observation is not task completion evidence.

Parent lifecycle and broad test creation/production acceptance remain unchecked;
HOST-05 gates unmet, Backstage paused. Trusted setup/policy/production wiring and
public rights-retention/re-enable policy remain unfinished. No real mail/server/
login/credentials or native/storage/network/provider runtime, SDK/RPC/Cue wiring,
live subscription, install, merge/deploy/commit/push/PR/hooks bypass, callback,
notification or Discord. Exit after this one source prerequisite.

Settlement checks: `git diff --check` exit **0**. Prettier explicitly checking the
four added Markdown excerpts with `--ignore-path .prettierignore` initially exited
**1** only for an excerpt's trailing section spacer; trimming that excerpt end
(without rewriting historical document content) yielded final exit **0**. Default
ignore-path checking skipped `.maestro` excerpts and is not validation evidence.
Strict source checks remain exit **0**; no suites executed. Temporary dependency
symlink removed. Final dirty-source/test/checklist preservation is recorded in
`scope.json`; full historical Markdown formatting was not asserted.

## HOST-02 trusted setup single-read authority capture — 2026-10-08

Completed one bounded prerequisite inserted immediately before the oversized first
unchecked lifecycle task in the current `RELAY-IMAP-HOST-02.md`. One existing source
module `src/main/plugins/mail-account-credentials.ts`, **+7/-6** from its preserved
dirty baseline: validate/use the same captured setup signal/host callback and exact
agent-member callback, each read once and bound to its original receiver. Existing
frozen authority, cancellation, canonical queue/state/native/completion guards and
safe errors remain. No new helper/store/queue/authority/public route. Deferred
actual synthetic composition regressions added to the current document only.

Actual static commands from registered worktree cwd:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts`: exit **0**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`: exit **0**, strict, no emitted build/cache.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-credentials.ts --max-warnings 0`: exit **0**.

Baseline hashes, before copies, scoped patches, check logs and CLI receipts:
`.maestro/verification/host-02-setup-authority-capture/`. Existing installed
dependencies reused via temporary worktree-local symlink, removed at settlement.
Contract/current document/both evidence ledgers updated. Tests created/executed
**0/0**; images analyzed **0**. Final whitespace/excerpt/checklist/source preservation
checks recorded at settlement; historical formatting not asserted.

Observed running AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791478423423:1791478423527:bga282`;
exact spawned process session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791478423423`;
registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context). Run-list/show-agent
read-only CLI exits **0/0**. No OS PID/provider session ID exposed. Coordinator
report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback,
dispatch or notification. Running observation is not completion evidence.

No dependency blocker or halt marker. Full lifecycle/production acceptance and
broad security-test creation remain unchecked; HOST-05 gates remain unmet and
Backstage remains paused. Trusted setup/principal, grant-retention/re-enable policy
and production lifecycle/public integration remain unfinished. No tests/native
keyring/storage/network/provider/mail/login runtime, real credentials, SDK/RPC/Cue
wiring/live subscription, dependency installation/shared mutation, commit/push/PR/
hooks bypass/upstream merge/deployment, callback/notification/Discord. Exit after
this single source prerequisite.

Settlement: tracked `git diff --check`, explicit added Markdown excerpt formatting
and source trailing-whitespace/final-newline inspection exit **0**. Source
`git diff --no-index --check` exits **1** because files differ, with no whitespace
diagnostics; an initial settlement script incorrectly expected zero and exited
**1**, then was corrected without source changes. Scope audit passes: **5,587**
baseline files checked, only the intended source and two local ledgers changed,
all **59** original task lines/states/order preserved, exactly one inserted source
prerequisite completed, lifecycle parent still unchecked. Temporary worktree-local
dependency symlink removed. Tests created/executed **0/0**, images analyzed **0**.

## HOST-02 evidence: synchronous credential-slot authority capture (2026-10-08)

Completed one source prerequisite inserted immediately before the oversized first
unchecked lifecycle task in the current HOST-02 document. Existing
`src/main/plugins/mail-credentials.ts`, **+44/-26** from preserved dirty baseline:
factor LOGIN authority capture into one private slot method reused by save/probe/
removal/LOGIN, with original callback/receiver/actual signal validated once;
save admission and native/completion work now share secret-reference cleanup.
Exact readback/absence confirmation, native safe errors, void results and LOGIN
close/original listener cleanup remain. No authority/registry/store/queue created.
Deferred actual synthetic slot/account regressions recorded. Full lifecycle parent,
broad test creation, production acceptance and HOST-05 gates remain unchecked;
Backstage stays paused. No dependency blocker or halt marker.

Actual registered-worktree static checks:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-credentials.ts`: exit **0**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`: exit **0**, strict, no build/cache emitted.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-credentials.ts --max-warnings 0`: exit **0**.

Baseline hashes, source/document copies, scoped patches, command logs and read-only
CLI receipts: `.maestro/verification/host-02-sync-slot-authority/`. Only existing
installed local dependencies reused via temporary worktree-local symlink;
settlement removes it without shared dependency mutation. Contract/current document/
both evidence ledgers updated; final whitespace/added-excerpt/scope receipts are
recorded there. Tests created/executed **0/0**, images analyzed **0**. Source
inspection and static checks are not mock or production acceptance.

Observed running AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791478753454:1791478753763:w8thh0`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791478753454`;
registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context). Read-only CLI agent-run
list and show-agent exits **0/0**. No OS PID/provider session ID exposed by these
reads. Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` remains
context only; no callback, dispatch or notification. Running observation is not
completion evidence.

Remaining: trusted setup/principal and production lifecycle/public policy wiring,
grant-retention/re-enable policy, monitor/Cue/public mail integration and actual
synthetic runtime verification. No tests/native keyring/storage/network/provider/
mail/login runtime, real credentials, SDK/RPC/Cue wiring/live subscription,
installation/shared mutation, commit/push/PR/hooks bypass/merge/deployment,
callback/notification/Discord. Exit after this one source prerequisite.

Settlement: tracked whitespace, source trailing-whitespace/final-newline and
explicit added Markdown excerpt checks exit **0**. Source no-index whitespace
check exits **1** solely because files differ, with no diagnostics. Scope audit
passes: **5,373** source/docs baseline files checked; only the intended slot source
and two local ledgers changed; tracked dirty diff preserved byte-for-byte; all
**60** original task lines/states/order preserved; exactly one inserted prerequisite
completed; lifecycle parent stays unchecked. Temporary worktree-local dependency
symlink removed. Tests created/executed **0/0**, images analyzed **0**. Historical
Markdown formatting and mock/production acceptance are not asserted.

## HOST-02 verified caller issuance authority capture (2026-10-08)

Completed only the bounded prerequisite inserted immediately before the current
first unchecked lifecycle task. Existing
`src/main/plugins/plugin-tool-run-identity.ts`, **+8/-12** from preserved dirty
baseline: `issue` and `issueInvocation` now validate/use the same original signal
and callback, each read once, with the original callback receiver bound. Retained
lifetime/listener/cleanup paths use those captured values. Existing fixed catches,
exact identity/context bindings, TTLs, limits, timers and independent account
rights remain. No new helper/registry/minter/store/queue or public wiring.

Actual static commands from the registered worktree cwd:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-tool-run-identity.ts`: exit **0**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`: exit **0**, strict, no build/cache emitted.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/plugin-tool-run-identity.ts --max-warnings 0`: exit **0**.

Dirty baseline hashes/copies, scoped patch, commands/logs, scope/checklist audit and
read-only CLI receipts are in
`.maestro/verification/host-02-proof-authority-capture/`. Contract/current document/
both evidence ledgers updated; synthetic actual-composition test requirements
recorded in the current document. Existing local installed dependencies reused
via a temporary worktree-local symlink, removed at settlement; no shared mutation.
Tests created/executed **0/0**; images analyzed **0**. Source/static checks are
neither mock nor production acceptance.

Observed running AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791479091801:1791479091958:8xkjzi`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791479091801`;
registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` from session context. Read-only CLI
agent-run list and show-agent exits **0/0**. No OS PID/provider session ID exposed
by these observations. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback, dispatch or
notification. Running observation is not completion evidence.

No dependency blocker or halt marker. Oversized lifecycle parent, broad security
test creation and production acceptance remain unchecked; HOST-05 gates unmet,
Backstage paused. Remaining trusted setup/policy, grant-retention/re-enable policy
and production lifecycle/public mail integration are not claimed complete.
No tests/native keyring/storage/network/provider/mail/login runtime, real credentials,
SDK/RPC/Cue wiring/live subscriptions, install/shared dependency mutation, commit/
push/PR/hooks bypass/merge/deploy, callback/notification/Discord. Exit after this
single source prerequisite.

Settlement: tracked whitespace, source trailing-whitespace/final-newline and
explicit added Markdown excerpt checks exit **0**. Source no-index whitespace
check exits **1** solely because files differ, with no whitespace diagnostics.
Scope audit passes: **5,373** source/docs baseline files checked; only the intended
registry source and two local ledgers changed; tracked dirty diff preserved
byte-for-byte; all **61** original task lines/states/order preserved; exactly one
inserted prerequisite completed; parent lifecycle stays unchecked. Temporary
worktree-local dependency symlink removed. Tests created/executed **0/0**, images
analyzed **0**. Historical Markdown formatting and runtime acceptance not asserted.

## HOST-02 inner account-reader authority capture (2026-10-08)

Completed only the bounded prerequisite inserted immediately before current
HOST-02's oversized first unchecked lifecycle parent. Existing
`src/main/plugins/mail-account-read.ts`, **+11/-6** from the preserved dirty
baseline: capture signal/callback/agent once, validate/use those original values,
bind the original receiver, retain original cancellation/listener cleanup through
all seven read modes. No new helper/state/queue/registry/public route. Existing
fixed errors, account/right/revision checks, original budgets, byte erasure and
release-safe completion remain. Deferred actual synthetic regressions recorded;
full lifecycle and broad test creation remain unchecked.

Actual registered-worktree static checks:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-read.ts`: exit **0**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`: exit **0**, strict, no build/cache emitted.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-read.ts --max-warnings 0`: exit **0**.

Baseline hashes/copies, scoped source/document patches, command logs, checklist/
scope/whitespace/excerpt settlement receipts and read-only CLI receipts are in
`.maestro/verification/host-02-read-authority-capture/`. Contract/current document/
both ledgers updated. Existing installed local dependencies reused through a
worktree-local temporary symlink; removed at settlement without shared mutation.
Tests created/executed **0/0**, images analyzed **0**. Static review is not runtime,
mock or production acceptance.

Observed running AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791479409847:1791479409952:2drjr1`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791479409847`;
registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` from session context. CLI agent-run list and
corrected `show agent` reads exit **0/0**; initial unsupported `show-agent` command
exit **1**, corrected after help discovery, recorded without mutation. OS PID/
provider session ID not exposed by these reads. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` remains context only; no callback/dispatch/
notification. Running observation is not completion evidence.

No dependency blocker or halt marker. Parent lifecycle, production acceptance
and HOST-05 gates remain unfinished; Backstage paused. Trusted setup/policy,
grant-retention/re-enable policy and production mail lifecycle remain unavailable.
No tests/native keyring/storage/network/provider/mail/login runtime, real
credentials, dependency install/shared mutation, SDK/RPC/Cue wiring/live
subscriptions, commit/push/PR/hooks bypass/merge/deploy, callback/notification/
Discord. Exit after this one source prerequisite.

Settlement: tracked whitespace, source trailing-whitespace/final-newline and
explicit added Markdown excerpt formatting checks exit **0**. Source no-index
whitespace exit **1** solely because files differ, with no diagnostics. Scope audit
exit **0**: **5,373** baseline source/docs files checked; only the intended reader
source and two local ledgers changed; tracked dirty diff preserved byte-for-byte;
all **62** original task lines/states/order preserved, exactly one inserted
prerequisite completed, parent lifecycle unchecked. Tests created/executed **0/0**,
images analyzed **0**. Temporary worktree-local dependency symlink removed;
no dependency installation/shared mutation or runtime acceptance asserted.

## Execution: closed trusted setup navigation prerequisite (2026-10-08)

Completed only the bounded source prerequisite inserted immediately before the
oversized first unchecked account lifecycle task in the current HOST-02 document.
Two existing modules changed: `mail-account-config.ts` +26/-0 and
`mail-account-credentials.ts` +45/-0, total +71/-0 relative to preserved dirty work.
Canonical closed records/opaque IDs, sealed configuration and captured setup
callback/signal are reused. Frozen navigation-only targets expose action plus
owned accountId/current accountRevision; add alone accepts an authorized absent
configuration. Invalid shape/actions/targets and stale/canceled completion fail
closed. No credential-slot, named operation, minter, frame or public path is added.

Static checks: initial scoped Prettier check exit 1 (formatting), scoped write exit
0, final scoped formatting exit 0, strict main no-emit TypeScript exit 0, configured
scoped ESLint with max-warnings 0 exit 0. These are static checks, not runtime tests.
Tests created/executed 0/0; images analyzed 0. Deferred synthetic regressions were
recorded in this same playbook; no product test file changed or loaded.
Baseline/source patches/commands/logs/scope receipts:
`.maestro/verification/host-02-setup-navigation/` in the registered worktree.

Observed running AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791479812348:1791479812450:1kh7at`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791479812348`;
agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Read-only CLI agent-run list and show agent exits 0/0. OS PID/provider session ID
not exposed. Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is
context only; no callback/dispatch/notification. Running observation is not
completion evidence.

No dependency blocker or halt marker. Parent lifecycle, broad test creation and
production acceptance remain unchecked; HOST-05 gates unmet and Backstage paused.
Trusted setup frame/nonce/gesture and public/lifecycle/policy integration remain
unfinished. No tests/native/storage/mail/server/credential/login runtime, installs,
shared dependency mutation, live Cue subscription, commit/push/PR/hooks bypass,
merge/deploy, Discord or callback. Exit after this one source prerequisite.

Settlement: scope audit of 5,373 baseline source/docs files passes; only two
intended source modules and two local ledgers changed, no source/test files added.
Tracked dirty diff and all 63 original task lines/states/order preserved; one
inserted prerequisite completed, lifecycle parent unchecked. Tracked whitespace
exit 0, explicit source/docs/playbook whitespace diagnostics 0 (no-index exit 1
solely for differing files). Added Markdown excerpt formatting exit 0; historical
Markdown formatting is not asserted. Temporary worktree-local dependency symlink
removed; tests created/executed 0/0, images 0. Static/source evidence only.

## Execution: disabled-add settings capture (2026-10-08)

Completed only the bounded source prerequisite inserted immediately before the
oversized first unchecked account lifecycle task in the current HOST-02 document.
Three existing modules reuse one settings parser: `mail-account-config.ts` +5/-4,
`mail-account-credentials.ts` +4/-1, `authorization-ledger.ts` +4/-1, total **+13/-6**
against preserved dirty baseline. Add settings now snapshot before setup property/
callback access in the facade and identity/callback/native freshness work in the
canonical ledger. Pure immutable parsing does not create account IDs or authority;
disabled creation, sealed rechecks and fixed wrapper errors remain in their existing
paths. No credential, network, grant, enable, minter or public path was added.

Static checks only: scoped Prettier **0**, strict main no-emit TypeScript **0**,
configured scoped ESLint with `--max-warnings 0` **0**, tracked whitespace **0**.
All three scoped no-index whitespace checks returned **1** solely because files
differ, with zero diagnostics. Exact command arguments/logs, dirty baseline and
scoped source patches are recorded under
`.maestro/verification/host-02-disabled-settings-snapshot/` in the registered worktree.
Tests created/executed **0/0**, images analyzed **0**. Actual synthetic add/parser/
sealed-store regressions are deferred in that document; no product test was created or executed.

Observed running AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791480282639:1791480282911:q74i7l`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791480282639`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Read-only CLI agent-run list/show agent exits **0/0**; OS PID/provider session ID
not exposed by these receipts. The running observation is not completion evidence.
Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only;
no callback, dispatch or notification.

No dependency blocker or halt marker. Lifecycle parent, broad test creation and
production acceptance remain unchecked; HOST-05 gates unmet and Backstage paused.
No tests/native keyring/storage/network/provider/mail/login/credential runtime,
dependency install/shared mutation, SDK/RPC/Cue integration/live subscriptions,
commit/push/PR/hooks bypass, upstream merge/deploy, Discord or callback. Exit after
this one prerequisite.

Settlement audit exit **0**: **5,373** baseline source/docs files checked; only
three intended source modules and two local ledgers changed, with no new/removed
source/test files. All **64** original task lines/states/order and unrelated
tracked dirty patches were preserved. Exactly one inserted prerequisite is done;
lifecycle parent remains unchecked. Final tracked whitespace exit **0**; all
seven scoped no-index whitespace exits **1** for differences only, with zero
diagnostics. Added Markdown excerpt formatting exit **0**; historical formatting
is not asserted. Temporary worktree-local dependency symlink removed. Tests
created/executed **0/0**, images analyzed **0**. Static/source evidence only.

## Execution: agent-rights payload capture (2026-10-08)

Completed only the bounded source prerequisite inserted immediately before the
oversized first unchecked lifecycle task in the current HOST-02 document.
`mail-account-credentials.ts` **+2/-1** and `authorization-ledger.ts` **+2/-1**,
total **+4/-2** from the preserved dirty baseline. Canonical immutable rights
parsing now precedes setup signal/host/member property access in the facade and
identity reflection/live/native checks in the direct ledger. Captured IDs/rights
feed the existing membership checks, queue and sealed replacement; original caller
payloads cannot retarget policy after capture. No new helper or production authority.
Contract and deferred actual synthetic regression requirements updated.

Static checks only: scoped Prettier **0**, strict main no-emit TypeScript **0**,
configured scoped ESLint (`--max-warnings 0`) **0**. Final whitespace and settlement
scope receipts follow. Tests created/executed **0/0**, images analyzed **0**.
Exact commands/exits/logs, dirty baseline and scoped patches:
`.maestro/verification/host-02-grant-payload-snapshot/` in the registered worktree.

Observed running AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791480685352:1791480685485:uk6bt0`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791480685352`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Read-only CLI run-list/show-agent exits **0/0**. Receipts retain only own run and
agent metadata; prompts/foreign runs and unrelated agent settings are omitted.
OS PID/provider session ID not exposed by the retained metadata. The running
observation is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback or notification.

No dependency blocker or halt marker. Lifecycle parent, broad test creation and
production acceptance remain unchecked. HOST-05 gates unmet; Backstage paused.
No tests/native keyring/storage/network/provider/mail/login/credential runtime,
installation/shared dependency mutation, SDK/RPC/Cue integration/live subscriptions,
commit/push/PR/hooks bypass/merge/deploy, Discord/dispatch/callback/notification.
Exit after this one prerequisite.

Settlement audit exit **0**: **5,373** baseline source/docs files checked;
only two intended source modules and two local ledgers changed, no new/removed
source/test files. All **65** original task lines/states/order and unrelated
tracked/staged dirty patches preserved. Exactly one inserted prerequisite is done;
lifecycle parent remains unchecked. Tracked whitespace exit **0**; all six scoped
no-index whitespace exits **1** for differences only, with zero diagnostics.
Added Markdown excerpts explicitly formatted/checked with `--ignore-path /dev/null`,
exits **0/0** (initial default-ignore excerpt command skipped `.maestro` artifacts
and is not formatting evidence). Historical Markdown formatting is not asserted.
Temporary worktree-local dependency symlink removed. Tests created/executed **0/0**,
images analyzed **0**. Static/source evidence only. Exit after this one prerequisite.

## Execution receipt: account mutation intent capture (2026-10-08)

Completed only the bounded source prerequisite inserted before the oversized first
unchecked lifecycle task in this current HOST-02 document. Existing modules:
`mail-account-config.ts` +34/-7, `mail-account-credentials.ts` +9/-20 and
`authorization-ledger.ts` +6/-3; total +49/-30 from preserved dirty baseline.
One extracted canonical closed immutable mutation parser now captures complete
intent before setup access in the facade and identity/native freshness in the
direct ledger. Direct reads/commit share one captured identity; the old inline
facade snapshot is removed. Existing preflight transition, queue/invalidation,
sealed commit, disable credential retention, settings/removal cleanup and completion
gates remain. Syntax errors precede ownership checks; no new authority/public route.
Contract/both ledgers and deferred actual synthetic regressions updated.

Static checks only: final scoped Prettier 0, strict main no-emit TypeScript 0,
configured scoped ESLint (`--max-warnings 0`) 0, tracked whitespace 0. Initial
formatting 1 corrected with scoped write 0 and final check 0. Three source no-index
whitespace exits 1 solely for differences, with zero diagnostics. Tests created/
executed 0/0, images analyzed 0. Exact commands/logs, baseline and scoped patches:
`.maestro/verification/host-02-mutation-intent-snapshot/` in the registered worktree.

Observed running AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791481114894:1791481115030:y0l8ts`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791481114894`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Read-only CLI running-run list/show agent exits 0/0; only own selected metadata
retained, no prompts/foreign runs/unrelated settings. OS PID/provider session ID
not exposed. Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is
context only; no callback/dispatch/notification. Running is not completion evidence.

No dependency blocker or halt marker. Lifecycle parent, broad test creation and
production acceptance remain unchecked; HOST-05 gates unmet and Backstage paused.
No runtime tests/native keyring/storage/network/provider/mail/login/credentials,
install/shared dependency mutation, SDK/RPC/Cue integration/live subscriptions,
commit/push/PR/hooks bypass/merge/deploy/Discord/callback/notification. Temporary
worktree-local dependency symlink removed at settlement. Exit after this one task.

Settlement audit exit 0: 5,373 baseline source/docs files checked; only the three
intended source modules and two local ledgers changed, no source/test files added
or removed. All 66 original task lines/states/order and unrelated tracked/staged
dirty patches preserved. Exactly one inserted prerequisite completed; lifecycle
parent unchecked. Tracked whitespace exit 0; seven scoped no-index whitespace
exits 1 for differences only, zero diagnostics. Explicit added Markdown excerpt
format/write/check exits 0/0; historical Markdown formatting not asserted.
Temporary dependency symlink removed. Tests created/executed 0/0, images analyzed 0.
Static/source evidence only; no runtime or production acceptance. Exit after this
one prerequisite.

## Execution receipt: fixed-session post-authority lifetime (2026-10-08)

Completed only the bounded source prerequisite inserted before the oversized
first unchecked lifecycle parent in this current HOST-02 document. Existing
`mail-imap-connection.ts` **+7/-1** from preserved dirty baseline: one extracted
closure-bound terminal/deadline check runs before and after Host authorization.
A normally returning callback cannot silently cancel/close or overrun the original
budget and still pass that session check. Existing first terminal error, original
admission time, pre-LOGIN/total limits and fail-before-report cleanup remain.
No new timer/helper system, authority, store, queue, policy or production route.
Contract and both ledgers updated; actual synthetic regressions deferred here.

Static checks only: scoped Prettier **0**, strict main no-emit TypeScript **0**,
configured scoped ESLint (`--max-warnings 0`) **0**. Tests created/executed **0/0**,
images analyzed **0**, mock/production tested **false/false**. Exact commands,
exits/logs, baseline and scoped patches are in the registered worktree at
`.maestro/verification/host-02-session-post-authority/`. Whitespace/scope settlement
receipts follow; historical Markdown formatting is not asserted.

Observed running AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791481595175:1791481595280:af18z2`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791481595175`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Read-only CLI running-run list/show agent exits **0/0**; only own selected metadata
retained, no prompts/foreign runs/unrelated settings. OS PID/provider session ID
not exposed. Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is
context only; no callback/dispatch/notification. Running is not completion evidence.

No dependency blocker or halt marker. Lifecycle parent, broad test creation and
production acceptance remain unchecked; HOST-05 gates unmet, Backstage paused.
Synchronous callbacks remain non-preemptible; session checks do not complete the
LOGOUT-plan publication or production lifecycle/setup/public integration seams.
No runtime tests/native keyring/storage/network/provider/mail/login/credentials,
install/shared dependency mutation, SDK/RPC/Cue/live subscription, commit/push/PR/
hooks bypass/merge/deploy/Discord/callback/notification. Exit after this one task.

Settlement audit exit **0**: **5,373** baseline source/docs files checked; only
one intended source module and two local ledgers changed, with no source/test
files added or removed. All **67** original task lines/states/order and unrelated
tracked/staged patches preserved. Exactly one inserted prerequisite completed;
lifecycle parent remains unchecked. Tracked whitespace exit **0**; five scoped
no-index whitespace checks exit **1** solely for differences, with zero diagnostics.
Explicit added Markdown excerpt formatting/check exits **0/0**; historical
formatting is not asserted. Temporary worktree-local dependency symlink removed
at settlement without shared dependency mutation. Tests created/executed **0/0**,
images analyzed **0**. Source/static evidence only; no runtime acceptance.

## Execution receipt: configured-session authority capture (2026-10-08)

Completed only the bounded source prerequisite inserted immediately before the
oversized first unchecked lifecycle parent in current `RELAY-IMAP-HOST-02.md`.
`mail-imap-connection.ts` **+25/-10** from preserved dirty baseline captures callback/
original receiver, optional signal, plugin ID and deadline values before initial
host authorization. Session checks, abort listener cleanup, plugin admission/release
and budgets use those retained values. Missing/nonfunction authority or malformed
provided signal fails closed; original-signal cancellation after initial callback
is rejected before endpoint resolution. Existing live policy checks, terminal/
deadline precedence and fixed TLS/command/cleanup paths remain in place.

Static checks only, all exits **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-imap-connection.ts`
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-imap-connection.ts --max-warnings 0`

Tests created/executed **0/0**; images analyzed **0**; mock-tested/production-tested
**false/false**. Actual fake TLS/DNS/clock capture regressions are deferred in this
current document's separate test phase. Contract and both evidence ledgers updated.
Receipts, per-command exits/stdout/stderr, baseline hashes and scoped patches:
`.maestro/verification/host-02-session-authority-snapshot/` in the registered worktree.
Formatting applies to the source and added Markdown excerpts; historical Markdown
formatting is not asserted. Scope/whitespace settlement is recorded below.

Observed running AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791481987983:1791481988092:l97h9o`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791481987983`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Read-only CLI running-run list/show-agent exits **0/0**; only own selected metadata
retained. OS PID/provider session ID not exposed. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback, dispatch or
notification. Running metadata is not completion evidence.

No dependency blocker or halt marker. Lifecycle parent, broad test creation and
production acceptance remain unchecked; endpoint/transport dependency capture,
plan/LOGOUT publication, trusted setup and production lifecycle/public wiring are
still unfinished. HOST-05 gates unmet; Backstage paused. No runtime tests/native
keyring/storage/network/provider/mail/login/credential access, install/shared
dependency mutation, SDK/RPC/Cue integration/live subscription, commit/push/PR/
hooks bypass/merge/deploy/Discord/callback/notification. Exit after this one task.

Settlement audit exit **0**: **5,373** baseline source/docs files checked; only
one intended source module and two local ledgers changed, with no source/test
files added or removed. All **68** original task lines/states/order and unrelated
tracked/staged dirty patches preserved. Exactly one inserted prerequisite completed;
lifecycle parent remains unchecked. Tracked whitespace exit **0**; five scoped
no-index whitespace exits **1** solely for differences, with zero diagnostics.
Added contract/receipt/prerequisite Markdown excerpt formatting/check exits **0/0**;
historical formatting is not asserted. Temporary worktree-local dependency symlink
removed without shared dependency mutation. Tests created/executed **0/0**, images
analyzed **0**. Static/source evidence only; no runtime or production acceptance.
Exit after this one prerequisite.

## Execution receipt: configured-session dependency capture (2026-10-08)

Completed only the bounded source prerequisite inserted immediately before the
oversized first unchecked lifecycle parent in current `RELAY-IMAP-HOST-02.md`.
Existing `mail-imap-connection.ts` **+25/-11** from preserved dirty baseline:
required endpoint selector and optional resolver/blocked-port/TLS callbacks are
captured before initial authorization and bound to their original receiver.
The endpoint, canonical guard and actual lookup/connect use retained callbacks;
the retained blocked-port method continues querying current policy. Malformed
provided callbacks deny before admission; optional absence keeps canonical defaults.
Original authority/cancellation are rechecked after endpoint selection/copy.
No new helper, authority, timer, store, queue or production/public integration.
Contract and separate deferred synthetic regression requirements updated.

Static checks: final scoped Prettier **0**, strict main no-emit TypeScript **0**,
configured scoped ESLint (`--max-warnings 0`) **0**. Initial formatting **1** corrected
by scoped write **0**, followed by final check **0**; only whitespace changed after
the type/lint checks. Added Markdown excerpt formatting **0**; historical Markdown
formatting is not asserted. Scope/whitespace settlement follows below.
Tests created/executed **0/0**, images analyzed **0**, mock-tested/production-tested
**false/false**. Exact command arrays/exits/stdout/stderr, baseline hashes and scoped
patches: `.maestro/verification/host-02-session-dependency-capture/` in the worktree.

Observed running AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791482369055:1791482369508:5pqfg4`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791482369055`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Read-only CLI running-run list/show-agent exits **0/0**; retained only own selected
metadata, no prompts/foreign runs/unrelated settings. OS PID/provider session ID
not exposed by retained metadata. Static-check shell session **13616**, completed
exit **0** (per-check exits above). Running metadata is not completion evidence.
Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only;
no callback, dispatch or notification.

No dependency blocker or halt marker. Lifecycle parent, broad test creation and
production acceptance remain unchecked. Plan/LOGOUT result publication, full
pre/post-callback lifetime checks at remaining transport seams, trusted setup and
production lifecycle/public wiring remain unfinished. HOST-05 gates unmet;
Backstage remains paused. No runtime tests/native keyring/storage/network/provider/
mail/login/credential access, installation/shared dependency mutation, SDK/RPC/Cue
integration/live subscriptions, commit/push/PR/hooks bypass/merge/deploy, Discord/
callback/notification. Exit after this one prerequisite.

Settlement audit exit **0**: **5,373** baseline source/docs files checked; only
one intended source module and two local ledgers changed, with no source/test
files added or removed. All **69** original task lines/states/order and unrelated
tracked/staged dirty patches preserved. Exactly one inserted prerequisite completed;
lifecycle parent remains unchecked. Tracked whitespace exit **0**; five scoped
no-index whitespace exits **1** solely for differences, with zero diagnostics.
Added Markdown excerpt formatting/check exits **0/0**; historical formatting is
not asserted. Temporary worktree-local dependency symlink removed without shared
dependency mutation. Tests created/executed **0/0**, images analyzed **0**.
Static/source evidence only; no runtime or production acceptance. Exit after this
one prerequisite.

## Execution receipt: configured-session live port-policy completion (2026-10-08)

Completed only the bounded source prerequisite inserted immediately before the
oversized first unchecked lifecycle parent in current `RELAY-IMAP-HOST-02.md`.
Existing `src/main/plugins/mail-imap-connection.ts` **+36/-13** against preserved
dirty baseline: one local live port-policy check composes the existing
`assertActive`/terminal/deadline/fail path with the captured provider and receiver.
Canonical egress preflight, pre-TLS and actual lookup entry/completion query that
check. Current lists are copied per invocation; cancellation, revoke, original
budget expiry, blocked port and thrown provider/list work deny before continuing.
Non-array/non-port policy results also deny. Lookup gates report existing fixed
terminal errors after cleanup, preserving first
terminal failure. Mismatched lookup hostname also stops the session. No new
shared helper, timer, authority, queue, store or production/public integration.
Contract and separate deferred synthetic regression requirements updated.

Static checks, each exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-imap-connection.ts`
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-imap-connection.ts --max-warnings 0`

Tests created/executed **0/0**, images analyzed **0**; mock-tested/production-tested
**false/false**. These are static checks, not executed transport/account tests.
Baseline hashes, exact command arrays/exits/stdout/stderr and scoped patches:
`.maestro/verification/host-02-port-policy-lifetime/` in the registered worktree.
Scope/whitespace settlement is recorded below. Added Markdown excerpts are
formatted separately; historical Markdown formatting is not asserted.

Observed running AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791482670868:1791482671119:z4zujv`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791482670868`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Read-only CLI running-run list/show-agent exits **0/0**; only own selected metadata
retained. OS PID/provider session ID not exposed by retained metadata. Static-check
shell sessions **16975** (TypeScript) and **9998** (ESLint), each completed exit
**0**. Final static checks after policy-list validation use shell session **37091**;
it completed exit **0**, with final Prettier/TypeScript/ESLint exits **0/0/0**. Running metadata is not
completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback or notification.

No dependency blocker or halt marker. Lifecycle parent, broad test creation and
production acceptance remain unchecked. Plan/LOGOUT result publication, trusted
setup and production lifecycle/public wiring remain unfinished; synchronous host
callbacks cannot be preempted. HOST-05 gates unmet; Backstage remains paused.
No tests/native keyring/storage/network/provider/mail/login/credential runtime,
installation/shared dependency mutation, SDK/RPC/Cue integration/live subscriptions,
commit/push/PR/hooks bypass/merge/deploy, Discord/callback/notification.
Exit after this one source prerequisite.

Settlement audit exit **0**: **5,373** baseline source/docs files checked; only
one intended existing source module and two local ledgers changed, with no
source/test files added or removed. All **70** original task lines/states/order
and unrelated tracked/staged dirty patches preserved. Exactly one inserted
prerequisite completed; lifecycle parent remains unchecked. Tracked whitespace
exit **0**; five scoped no-index whitespace exits **1** solely for differences,
with zero diagnostics. Added Markdown excerpt formatting/check exits **0/0**
(with ignored receipt paths explicitly included); historical formatting is not
asserted. Final scoped source delta **+36/-13**. Final Prettier/strict main no-emit
TypeScript/configured ESLint exits **0/0/0**, final static-check shell session
**37091** completed exit **0**. Temporary worktree-local dependency symlink
removed without shared dependency mutation. Tests created/executed **0/0**,
images analyzed **0**. Static/source evidence only, no runtime or production
acceptance. No dependency blocker or halt marker. Exit after this one prerequisite.

## HOST-02 fixed-plan original authority capture receipt (2026-10-08)

Completed only the bounded source prerequisite inserted immediately before the
current document's first unchecked lifecycle parent. One existing source module,
`src/main/plugins/mail-imap-connection.ts`, changed **+48/-22** against the captured
dirty baseline. Extracted the existing dependency capture for direct open and
fixed-plan reuse; the runner's final LOGOUT gate uses the original bound live
callback and original optional signal, checked before and after the callback.
No duplicated command/parser/authority/runner/timeout system or public integration.

Static checks, each exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-imap-connection.ts`
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-imap-connection.ts --max-warnings 0`

Static-check process PIDs: Prettier **562039**, TypeScript **562040**, ESLint
**562051**. Tool shell sessions **6057** (TypeScript) and **96841** (ESLint) both
completed exit **0**. Tests created/executed **0/0**, images analyzed **0**;
mock-tested/production-tested **false/false**. No transport/account runtime was
executed. Exact command arrays/exits/stdout/stderr, baseline hashes and scoped
patches live in `.maestro/verification/host-02-plan-authority-capture/` within the
registered worktree. Added Markdown excerpts are formatted separately;
historical Markdown formatting is not asserted. Scope settlement is recorded below.

Read-only CLI running-run list and show-agent exits **0/0**. Observed running
AgentRun: `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791483163273:1791483163396:jqiviu`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791483163273`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID not exposed by retained CLI metadata. Running
metadata is not completion evidence. Coordinator tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback or notification.

No dependency blocker or halt marker. The lifecycle parent, broad test creation
and production acceptance remain unchecked. Immutable plan intent and
original-budget/release-safe final plan/LOGOUT publication remain unfinished;
captured callbacks still must enforce live host authority and synchronous work
cannot be preempted. Trusted setup and lifecycle/public wiring remain unavailable,
HOST-05 gates unmet, Backstage paused. No tests, real native/storage/network/mail/
credential runtime, installation/shared dependency mutation, SDK/IPC/Cue route or
live subscription, commit/push/PR/hooks bypass/merge/deployment, Discord/callback/
notification. Exit after this one source prerequisite.

Settlement audit exit **0**: **5,373** baseline source/docs files checked;
only the intended existing source module and two local ledgers changed, with no
source/test additions or removals. All **71** original task lines/states/order and
tracked/staged dirty patches preserved. Exactly one inserted prerequisite is
complete; the lifecycle parent remains unchecked. Tracked whitespace exit **0**;
five scoped no-index whitespace exits **1** solely for differences, all with zero
diagnostics. Added Markdown excerpt format/check exits **0/0**; historical
formatting is not asserted. Final source delta **+48/-22**, static source
Prettier/strict main TypeScript/configured ESLint exits **0/0/0**. The temporary
worktree-local dependency symlink was removed without shared dependency mutation.
Tests created/executed **0/0**, images analyzed **0**. Static/source evidence only,
no runtime or production acceptance. No dependency blocker or halt marker.
Exit after this one prerequisite.

## HOST-02 fixed-plan immutable intent capture receipt (2026-10-08)

Completed only one bounded source prerequisite inserted immediately before the
current document's oversized first unchecked lifecycle parent. Existing
`src/main/plugins/mail-imap-connection.ts` **+43/-4** against the preserved dirty
baseline: one internal plan capture reuses canonical closed array/record schema,
fixed command builder and UID validation before dependency/authority callbacks,
admission or awaits. Frozen plan/steps/commands retain exact order/count/fields/
namespace and final LOGOUT classification; malformed/unknown/accessor/hidden/
inherited/symbol shapes and nonfinal LOGOUT fail before host work. Temporary
validation bytes, including LOGIN, are erased immediately. No second parser,
runner, authority, timeout, store, queue or production/public integration.

Static checks only, each exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-imap-connection.ts`
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-imap-connection.ts --max-warnings 0`

Scoped source formatting write exit **0**. Static-check process PIDs:
Prettier **564550**, TypeScript **564556**, ESLint **564562**. Tool shell sessions
**50365** (TypeScript) and **66535** (ESLint) both completed exit **0**.
Tests created/executed **0/0**, images analyzed **0**, mock-tested/production-tested
**false/false**. Contract and both evidence ledgers updated; actual regressions
remain in the separate test creation/execution phase of this current document.
Exact command arrays/exits/stdout/stderr, baseline hashes, own selected metadata,
scoped patches and settlement receipt:
`.maestro/verification/host-02-plan-intent-capture/` in the registered worktree.
Added Markdown excerpts are formatted separately; historical formatting is not
asserted. Whitespace and scope settlement are recorded below.

Read-only CLI running-run list and show-agent exits **0/0**. Observed running
AgentRun: `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791483606138:1791483606249:hi11aj`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791483606138`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID not exposed by retained CLI metadata. Running
metadata is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback/dispatch or
notification was sent.

No dependency blocker or halt marker. The lifecycle parent, broad test creation
and production acceptance remain unchecked. Final original-budget/release-safe
plan/LOGOUT publication, trusted setup and production lifecycle/public wiring
remain unfinished; strings cannot be zeroized and synchronous host/proxy work
cannot be preempted. HOST-05 gates unmet; Backstage remains paused. No transport/
account tests, real native/storage/network/mail/login/credential access, dependency
installation/shared mutation, SDK/IPC/Cue integration/live subscriptions,
commit/push/PR/hooks bypass/merge/deploy, Discord/callback/notification.
Exit after this one source prerequisite.

Settlement audit exit **0**: **5,373** baseline source/docs files checked; only
one intended existing source module and two local ledgers changed, with no
source/test additions or removals. All **72** original task lines/states/order
and unrelated tracked/staged dirty patches preserved. Exactly one inserted
prerequisite completed; lifecycle parent remains unchecked. Tracked whitespace
exit **0**; five scoped no-index whitespace exits **1** solely for differences,
all with zero diagnostics. Added Markdown excerpt formatting/check exits **0/0**;
historical formatting is not asserted. Final scoped source delta **+43/-4**,
source Prettier/strict main TypeScript/configured ESLint exits **0/0/0**.
Temporary worktree-local dependency symlink removed without shared mutation.
Tests created/executed **0/0**, images analyzed **0**. Static/source evidence only,
no runtime or production acceptance. No dependency blocker or halt marker.
Exit after this one prerequisite.

Final settlement reconstruction first exited **1** because the audit removed an
inserted section with incorrect blank-line handling. No original playbook content
was changed: removing the exact inserted section plus its separator restores the
complete baseline prefix. Corrected final audit exit **0** is retained in
`settlement.json`; no source change or static-check rerun was required.

## HOST-02 fixed-plan post-close completion prerequisite (2026-10-08)

Completed exactly one inserted bounded source prerequisite in this current
`RELAY-IMAP-HOST-02.md`; the oversized lifecycle parent remains unchecked. Actual
review of the captured-plan implementation found return-before-finally-close and
terminal LOGOUT lacking the existing admission budget at final publication. No
other Host document was used as an executable task source.

Changed only `src/main/plugins/mail-imap-connection.ts`, **+50/-19** against the
preserved dirty baseline. Private connection completion retains its canonical
admission clock, authenticated state, original signal/callback/receiver and
limits; direct open keeps its existing exported frozen session surface. The
runner explicitly closes before final live authority and cancellation/deadline
checks, including LOGOUT, and before result transfer. Failed completion erases
all accumulated FETCH buffers. Released sessions remain terminal; no runner,
clock, timer, queue, authority fallback or public route was added. Original
connection admission timing remains unchanged; synchronous host callbacks cannot
be preempted, successful bytes cannot be recalled and strings cannot be erased.

Static checks, all exit **0** (tests were not executed):

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-imap-connection.ts`
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-imap-connection.ts --max-warnings 0`

Scoped source formatting write exit **0**, PID **567870**. Static-check process
PIDs: Prettier **567918**, TypeScript **567924**, ESLint **567925**. Tool shell
sessions **10163** (TypeScript) and **71194** (ESLint) completed exit **0**.
Exact command arrays, exits, stdout/stderr, hashes, baseline snapshots and scoped
patch: `.maestro/verification/host-02-plan-completion/`. Added Markdown excerpts
are formatted separately; historical formatting is not asserted. Final scope
and whitespace settlement are recorded below.

Read-only CLI running-run list and show-agent exits **0/0**. Observed AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791484146406:1791484146525:ldbn94`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791484146406`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab from session context:
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. Agent OS PID/provider session ID were not
exposed in retained CLI metadata. Running metadata is not completion evidence.
Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no
callback tab, dispatch or notification was created/sent.

Tests created/executed **0/0**, images analyzed **0**; mock-tested and
production-tested **false**. Deferred actual fake TLS/DNS/clock completion
regressions are recorded alongside the prerequisite. Contract and both evidence
ledgers updated. No dependency blocker or halt marker. The lifecycle parent,
broad test creation/execution and production acceptance remain unchecked;
Backstage stays paused and HOST-05 gates are unmet. No real native keyring,
storage, network, mail, login or credential access, dependency installation/shared
mutation, SDK/IPC/Cue integration/live subscriptions, callback/notification/
Discord, commit/push/PR/hooks bypass/merge/deploy. Exit after this one prerequisite.

Settlement audit exit **0**: **5,373** baseline source/docs files verified; only
one intended existing source module and two local ledgers changed. All **73**
original task lines/states/order and tracked/staged dirty patches preserved;
exactly one inserted prerequisite completed and lifecycle parent remains
unchecked. No source/test additions or removals. Scoped source delta **+50/-19**;
source Prettier/strict main TypeScript/configured ESLint exits **0/0/0**. Tracked
whitespace exit **0**; five scoped no-index whitespace exits **1** solely for
differences, all with zero diagnostics. Added Markdown excerpt formatting/check
exits **0/0**; historical formatting is not asserted. Source unchanged since
static checks. Temporary worktree-local dependency symlink removed without
shared mutation. Tests created/executed **0/0**, images analyzed **0**. No
runtime/production acceptance or dependency blocker/halt marker. Exit after this
one source prerequisite.

## HOST-02 read request intent prerequisite (2026-10-08)

Completed exactly one inserted bounded source prerequisite in the current
`RELAY-IMAP-HOST-02.md`; the first unchecked lifecycle parent was oversized and
remains unchecked. Actual implementation review found both the direct private
reader and verified invocation facade parsing references only after initial host
authority callbacks. No other Host document was used as an executable task source.

Changed only `src/main/plugins/mail-account-read.ts` and
`src/main/plugins/mail-invocation-reader.ts`, each **+7/-6**, total **+14/-12**
against the preserved dirty baseline. Moved existing immutable canonical request
capture before caller signal/callback/agent getters and nested invocation
resolution/policy work. All seven direct and six facade modes, including snapshot,
execute captured exact intent. Invalid requests fail before authority/native/I/O;
when input and caller are both invalid, input error takes precedence. Existing
right selection, admission clock, provenance/caller capture, stored/reference
checks, completion, cleanup and byte/snapshot ownership are unchanged. No new
parser/helper/runner/authority/queue/store/production route. Static review only,
not mock or production acceptance; deferred actual synthetic regressions are
recorded immediately beside this prerequisite in the current document.

Static commands and actual exits, no tests:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts` — exit **0**, PID **569635**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false` — exit **0**, PID **569636**, tool shell session **82764**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts --max-warnings 0` — exit **0**, PID **569637**, tool shell session **64815**.

Source formatting write exit **0**, PID **569614**; both files already formatted.
Exact command arrays, exits, stdout/stderr, hashes, baseline snapshots and scoped
source patch are retained in `.maestro/verification/host-02-read-intent-capture/`.
Only added Markdown excerpts are formatted; historical formatting is not asserted.
Final scope/whitespace settlement is recorded below. The temporary worktree-local
`node_modules` symlink uses existing installed dependencies and is removed on
settlement, with no shared dependency writes or installation.

Read-only CLI running-run list and show-agent exit **0/0**, PIDs **569133/569141**.
Observed AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791484607155:1791484607410:qt9f4q`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791484607155`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab from session context:
`5262895a-6b3d-43fa-92cc-17449cdfa06f`.
Agent OS PID/provider session ID are not exposed by retained CLI metadata;
running metadata is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback/dispatch or
notification was created/sent.

Tests created/executed **0/0**, images analyzed **0**, mock-tested and
production-tested **false**. Contract and both evidence ledgers updated; no
dependency blocker or halt marker. Full lifecycle, trusted setup/policy/public
integration, broad test creation/execution and production acceptance remain
unfinished; Backstage stays paused and HOST-05 gates are unmet. No real native
keyring/storage/network/mail/login/credential access, install/shared mutation,
SDK/IPC/Cue integration/live subscriptions, callback/notification/Discord,
commit/push/PR/hooks bypass/merge/deploy. Exit after this single prerequisite.

## Read request intent prerequisite settlement (2026-10-08)

Completed exactly one inserted source prerequisite: existing private reader and
verified invocation facade capture immutable closed request intent before host
caller/invocation authority. Two existing source modules **+14/-12**; no new source,
helper, parser, runner or production route. Lifecycle parent remains unchecked;
all **74** original task lines/states/order and tracked/staged dirty patches are
preserved. Contract and both evidence ledgers updated. Source/static-reviewed
only; no runtime or production acceptance and no dependency blocker/halt marker.

Prettier/strict main no-emit TypeScript/configured scoped ESLint exits **0/0/0**,
PIDs **569635/569636/569637**; tool shell sessions **82764/64815** finished exit
**0**. Source format PID **569614** exit **0**. Added Markdown excerpt formatting/
check with explicit ignore-path override PIDs **569887/569898** exits **0/0**;
historical document formatting is not asserted. Precompletion audit exit **0**
verified **5,373** baseline source/docs files: only the two intended existing
source modules and two local ledgers changed; no source/test additions/removals
and source hashes unchanged since static checks. Six scoped no-index whitespace
checks exit **1** solely for differences with zero diagnostics; tracked whitespace
exit **0**. Final audit receipts and baseline/scoped patches:
`.maestro/verification/host-02-read-intent-capture/`. Temporary worktree-local
dependency symlink removed without shared dependency mutation.

Actual read-only CLI AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791484607155:1791484607410:qt9f4q`.
Spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791484607155`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab:
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. CLI run-list/show-agent PIDs
**569133/569141** exits **0/0**; agent OS PID/provider session ID not exposed.
Coordinator tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only and was
not contacted. Running metadata is not completion evidence.

Tests created/executed **0/0**, images analyzed **0**, mock/production tested
**false/false**. Deferred actual synthetic regressions are recorded beside the
prerequisite; test creation/execution remain separate unfinished tasks. Full
trusted setup/lifecycle/public integration and HOST-05 gates remain unmet;
Backstage stays paused. No real native keyring/storage/network/mail/login/
credential access, dependency installation/shared mutation, SDK/IPC/Cue
integration/live subscriptions, callback/notification/Discord, commit/push/PR,
hooks bypass/merge/deploy. Exit after this one prerequisite.

## HOST-02 verified-to-private read admission continuity (2026-10-08)

Completed one bounded source prerequisite inserted immediately before the first
unchecked oversized lifecycle parent in current `RELAY-IMAP-HOST-02.md`. Actual
review found facade admission preceding provenance/policy/sealed checks but the
inner reader restarting its pre-LOGIN clock. No other Host playbook was an
executable task source. The lifecycle parent and production acceptance remain
unchecked; full trusted setup/lifecycle/public integration and HOST-05 gates are
unmet. Backstage remains paused. No dependency blocker or halt marker.

Changed only two existing source modules: `mail-account-read.ts` **+53/-22** and
`mail-invocation-reader.ts` **+6/-5**, total **+59/-27**, against the preserved
dirty baseline. All six verified modes forward their original admission time;
the private reader validates the optional main-only finite/nonnegative/not-future
time before request/caller access, defaults direct reads to entry, and reuses
existing connect-until-LOGIN and total-lifetime checks. No new helper, parser,
timer, runner, store, queue, authority fallback or public route. Existing intent,
rights, cancellation, cleanup, final completion and byte erasure remain required.
Synchronous work cannot be preempted; returned strings/bytes cannot be recalled.

Static checks, all exit **0**, with exact command arrays/stdout/stderr/PIDs in
`.maestro/verification/host-02-reader-admission-continuity/`:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts`, PID **570866**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`, PID **570859**, tool shell session **27838**, finished exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-read.ts src/main/plugins/mail-invocation-reader.ts --max-warnings 0`, PID **570860**, tool shell session **20660**, finished exit **0**.

Source formatting write PID **570839**, exit **0**. Only installed dependencies
were reused through a temporary worktree-local symlink; no dependency installation
or shared dependency mutation. Baseline source/docs hashes cover **5,373** files;
scoped baseline bytes, source patch/stats, checked hashes and original tracked/
staged dirty patches retained. Markdown excerpt formatting, final scope/task
preservation/whitespace and symlink cleanup are recorded in settlement below.

Read-only CLI run-list/show-agent PIDs **570683/570691**, exits **0/0**. Observed
AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791485071141:1791485071248:9xrh4o`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791485071141`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID not exposed by retained CLI metadata. Running
metadata is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback, dispatch or
notification was created/sent.

Tests created/executed **0/0**, images analyzed **0**, mock/production tested
**false/false**. Actual synthetic regressions are requirements only, recorded
next to the inserted prerequisite; test creation/execution remain unfinished.
Contract and both evidence ledgers updated. No real native keyring/storage/
network/mail/login/credential access, SDK/IPC/Cue integration/live subscriptions,
install/shared dependency mutation, callback/notification/Discord, commit/push/PR,
hooks bypass/merge/deploy. Exit after this one source prerequisite.

Settlement audit exit **0**: **5,373** baseline source/docs files verified; only
the two intended existing source modules and two local ledgers changed. All
**75** original task lines/states/order and tracked/staged dirty patches preserved.
Exactly one inserted prerequisite is checked; lifecycle parent remains unchecked.
No source/test additions/removals. Scoped source delta **+59/-27**; checked source
hashes unchanged. Prettier/strict main TypeScript/scoped ESLint exits **0/0/0**.
Six scoped no-index whitespace checks exit **1** solely for differences, with
zero diagnostics; tracked whitespace exit **0**. Added Markdown excerpt format/
check exits **0/0**, PIDs **571000/571011**; historical document formatting is not
asserted. Settlement excerpt formatting and final audit receipts retained beside
the other checks. Temporary worktree-local dependency symlink removed without
shared mutation. Tests created/executed **0/0**, images analyzed **0**, mock/
production tested **false/false**. No dependency blocker or halt marker. Full
lifecycle/trusted setup/public integration and production acceptance remain
unfinished; HOST-05 gates unmet and Backstage stays paused. Exit after this one
source prerequisite.

## HOST-02 setup cancellation to mutation lease receipt (2026-10-08)

Completed one bounded source prerequisite inserted immediately before the first
unchecked oversized lifecycle task in current `RELAY-IMAP-HOST-02.md`. Actual
review found setup signals only checked at authority checkpoints, leaving
admitted mutation leases live until the next checkpoint. Full lifecycle and
production acceptance remain unchecked; no other Host document was executed.

Three existing modules changed against the preserved dirty baseline:
`mail-account-activity.ts` **+20/-5**, `authorization-ledger.ts` **+16/-2**,
`mail-account-credentials.ts` **+5/-0**, total **+41/-7**. All five queued paths
forward original captured mandatory setup signals; canonical admission checks
cancellation, subscribes admitted work, aborts same-account leases synchronously
and retains the existing failure latch. Queue/count/listener ownership ends only
at actual settlement. Unrelated states and sealed policy are preserved; no new
runner, queue, store, authority fallback, recovery or production route. In-flight
awaits/native work cannot be forcibly settled/preempted or rolled back.

Static checks only, each exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts`, PID **572319**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`, PID **572308**, tool shell session **80984**, completed exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts --max-warnings 0`, PID **572307**, tool shell session **3961**, completed exit **0**.

Source formatting write PID **572268**, exit **0**. Exact commands/stdout/stderr,
baseline bytes/hashes for **5,373** source/docs files, existing tracked/staged
dirty patches, scoped source patches/stats and settlement receipts:
`.maestro/verification/host-02-setup-queue-cancellation/`. Contract and both
evidence ledgers updated. Original Markdown is preserved; added excerpts are
formatted separately. Final whitespace/scope/task settlement is recorded below.

Read-only running-run list exit **0**. Observed AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791485451754:1791485451859:v7ttu9`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791485451754`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
`maestro-cli show-agent` discovery attempt exited **1** (unknown command);
corrected `maestro-cli show agent ... --json` exited **0**, retained PID **572435**.
Agent OS PID/provider session ID not exposed. Retained run metadata is selected to
this agent only. Running metadata is not completion evidence. Coordinator report
tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback or notice.

Tests created/executed **0/0**, images analyzed **0**, mock/production tested
**false/false**. Deferred actual synthetic regression requirements are recorded
beside this prerequisite. No dependency blocker/halt marker. Trusted setup/full
lifecycle/public integration and HOST-05 gates remain unmet; Backstage stays paused.
No real keyring/storage/network/mail/login/credential runtime, dependency install
or shared mutation, SDK/IPC/Cue integration/live subscriptions, callback/notify/
Discord, commit/push/PR/hooks bypass/merge/deploy. Exit after this one prerequisite.

Settlement audit exit **0**: **5,373** baseline source/docs files verified;
only the three intended existing source modules and two local ledgers changed,
with no source/test additions or removals. All **76** original task lines/states/
order and unrelated tracked/staged dirty patches preserved. Exactly one inserted
prerequisite is complete; lifecycle parent remains unchecked. Checked source
hashes unchanged, scoped source delta **+41/-7**, Prettier/strict main TypeScript/
scoped ESLint exits **0/0/0**. Tracked whitespace exit **0**; seven scoped no-index
whitespace exits **1** solely for differences, with zero diagnostics. Added
Markdown excerpt formatting/check exits **0/0**; historical formatting is not
asserted. Temporary worktree-local dependency symlink removed without shared
mutation. Tests created/executed **0/0**, images analyzed **0**; source/static
evidence only, no runtime/production acceptance. No dependency blocker/halt
marker. Full lifecycle/trusted setup/public integration and HOST-05 acceptance
remain unfinished; Backstage stays paused. Exit after this one prerequisite.

## HOST-02 canonical configuration commit authority receipt (2026-10-08)

Completed one bounded source prerequisite inserted immediately before the first
unchecked oversized lifecycle task in current `RELAY-IMAP-HOST-02.md`. That parent
remains unchecked; no earlier/different Host document was executed. Existing dirty
work was retained with a **5,373** source/docs hash baseline and byte snapshots of
the changed sources/local ledgers/shared current document and evidence ledger.

Changed existing source modules: `authorization-ledger.ts` **+49/-10** and
`mail-account-credentials.ts` **+12/-6**, total **+61/-16**. All five canonical mail
configuration commit paths now receive existing mandatory live setup/lease checks.
Direct account mutation requires a check; both queued facade call sites forward
the original admitted lease. The canonical boundary checks authority around reader
invalidation, anchor freshness and persistence, rejects reentrant mail/epoch changes
before replacing state, and suppresses late success without claiming rollback.
No helper/store/queue/runner or public/integration/recovery path was added.

Executed static checks, all exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts`, PID **573839**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`, PID **573845**, tool shell session **50911**, completed exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts --max-warnings 0`, PID **573846**, tool shell session **88595**, completed exit **0**.

Source formatting write PID **573771**, exit **0**. Exact commands, stdout/stderr,
PIDs/exits, preserved baseline tracked/staged patches, source deltas and settlement
receipts: `.maestro/verification/host-02-canonical-commit-authority/`. Added Markdown
excerpts are formatted separately; original ledger/playbook formatting is preserved.
Final whitespace/scope/task-state settlement is recorded below.

Read-only `maestro-cli agent-run list --status running --limit 100 --json` discovery
PID **573763**, exit **0**. Observed exact AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791485829265:1791485829373:oscnt4`.
Exact spawned process session: `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791485829265`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID not exposed by this discovery; none invented.
Retained metadata is selected to this agent; running metadata is not completion.
Coordinator tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback
or notice. Provenance: headless Relay thread `1557130738971971689`, requester
Mira/Obsidian Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Tests created/executed **0/0**, images analyzed **0**, mock/production tested
**false/false**. Deferred actual synthetic regressions remain requirements only.
No dependency blocker/halt marker. Full lifecycle/trusted setup/public integration
and HOST-05 gates remain unfinished; Backstage remains paused. Synchronous native
work cannot be preempted/rolled back and failed responses may follow durable changes.
No real keyring/storage/network/mail/login/credential runtime, install/shared
mutation, live Cue subscription, callback/notify/Discord, commit/push/PR/hooks
bypass/merge/deploy. Exactly one prerequisite completed; exit after this task.

Discovery-only combined `ls`/guide-symbol lookup exited **1** because worktree
`node_modules` was absent and the guide-symbol lookup had no match. This was
resolved using the already-authorized temporary worktree-local symlink to installed
`/home/chris/code/Maestro/node_modules`; no dependency installation or shared-tree
mutation. Both `agent-run --help` and `agent-run list --help` exited **0**. Source
static checks above ran successfully after the link was created.

Settlement audit exit **0**: **5,373** baseline source/docs files verified, only
the two intended existing source modules and two local ledgers changed, no
source/test additions or removals. All **77** original task lines/states/order
and unrelated tracked/staged dirty patches preserved. Exactly one inserted
prerequisite is complete; lifecycle parent remains unchecked. Source delta
**+61/-16**; checked sources unchanged after successful formatting/strict main
TypeScript/scoped ESLint, exits **0/0/0**. Tracked whitespace check PID **574463**,
exit **0**. Four scoped no-index whitespace checks exited **1** solely for file
differences, with no diagnostics. Final shared-doc whitespace receipts and scope
confirmation are in the verification directory.

Initial Markdown formatting command PID **574132** exited **0** but the repo
ignore rules skipped these verification files. Corrected explicit-ignore-path
formatting PID **574313** and check PID **574324** processed all three excerpts,
exits **0/0**. Historical document bytes were preserved; their formatting is not
asserted. Temporary worktree-local dependency symlink removed without shared
mutation. Tests created/executed **0/0**, images analyzed **0**, source/static
acceptance only. No dependency blocker or halt marker. Trusted setup/full
lifecycle/public integration, production acceptance and HOST-05 gates stay
unfinished; Backstage stays paused. Exit after this one prerequisite.

## HOST-02 canonical mutation release completion receipt (2026-10-08)

Completed one bounded source prerequisite inserted immediately before the first
unchecked oversized account lifecycle task in current `RELAY-IMAP-HOST-02.md`.
The lifecycle parent remains unchecked; no earlier/different Host document was
executed. Existing dirty work was preserved with **5,373** source/docs baseline
hashes and byte snapshots of the changed source/local ledgers/current shared
playbook/shared evidence, plus original tracked/staged dirty patches.

Changed one existing source module, `src/main/plugins/mail-account-activity.ts`,
**+27/-10**: mutation success now checks original setup cancellation/authority and
retained latches after synchronous lease release. The released controller stays
aborted; the existing private lifetime check is reused without reasserting a
released lease. Account state remains registered through final completion via a
settlement counter, preventing reentrant reader release from discarding a failed
latch. Completion failures latch and cancel same-account readers/siblings; pending
siblings alone still serialize normally. Exact committed-state facade checks
remain mandatory. No new helper/store/queue/runner or production integration.

Executed static checks, all exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-activity.ts`, PID **575688**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`, PID **575682**, tool shell session **59355**, completed exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-activity.ts --max-warnings 0`, PID **575700**, tool shell session **50396**, completed exit **0**.
- `git diff --check`, PID **575766**, exit **0**. Scoped source no-index whitespace PID **575778** exited **1** solely because the files differ, zero diagnostics.

Source formatting write PID **575666**, exit **0** (unchanged). Exact commands,
stdout/stderr, PIDs/exits, preserved dirty patches, byte/hash baselines and scoped
source diff/stat receipts:
`.maestro/verification/host-02-mutation-release-completion/`. Added Markdown
excerpts are formatted separately; historical Markdown bytes are preserved.
Final scope/task-state/whitespace settlement is recorded below.

Read-only `maestro-cli agent-run list --status running --limit 100 --json`, PID
**575474**, exit **0**. Observed exact AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791486273025:1791486273290:03aryv`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791486273025`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID not exposed by this discovery; none invented.
Running metadata is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback/notice.
Provenance: headless Relay thread `1557130738971971689`, requester Mira/Obsidian
Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Tests created/executed **0/0**, images analyzed **0**, mock/production tested
**false/false**. Actual synthetic regressions are requirements in this current
document only; no test files were authored or executed. No dependency blocker or
halt marker. Full lifecycle/trusted setup/public integration, production
acceptance and HOST-05 gates remain unfinished; Backstage stays paused.
Synchronous callbacks cannot be preempted; rejection can follow durable changes
without rollback. No real keyring/storage/network/mail/login/credential runtime,
dependency installation/shared mutation, live Cue subscriptions, callback/notify/
Discord, commit/push/PR/hooks bypass/merge/deploy. Exactly one source prerequisite;
exit after this task.

Settlement audit exit **0**: **5,373** baseline source/docs files verified; only
one intended existing source and two local ledgers changed. No source/test files
added/removed. All **78** original checkbox lines/states/order and original
tracked/staged dirty patches preserved. Exactly one inserted prerequisite marked
complete; lifecycle parent remains unchecked. Passed-check source hash unchanged,
delta **+27/-10**; formatting/strict main TypeScript/scoped ESLint exits **0/0/0**.
Added Markdown excerpt formatting PID **575883** and check PID **575935**, exits
**0/0**; historical document formatting is not asserted. Final scoped whitespace
receipts and task/scope confirmation are retained in the verification directory.
Temporary worktree-local dependency symlink removed without shared-tree mutation.
Tests created/executed **0/0**, images analyzed **0**, source/static acceptance only.
No dependency blocker/halt marker. Full lifecycle/trusted setup/public integration,
production acceptance and HOST-05 gates remain unfinished; Backstage stays paused.
Exit after this one prerequisite.

## HOST-02 final setup facade completion latch receipt (2026-10-08)

Completed one bounded prerequisite inserted immediately before the oversized
first unchecked lifecycle task. The lifecycle parent remains unchecked.
Actual review found a final setup callback outside the failure-latching queue,
and canonical completion rejection without a retained account latch after pruning.

Changes: `mail-account-activity.ts` **+18/-4** centralizes failed mutation
cancellation and retains bounded late latches; `authorization-ledger.ts` **+5/-0**
latches final completion failures and performs first captured authority inside
that gate before freshness; `mail-account-credentials.ts` **+1/-6** routes all five
post-queue authority checks into that gate. Total **+24/-10**, three existing
source files. Fixed errors, exact committed-state checks, read completion behavior
and disabled credential retention remain intact. Account blocking precedes abort
callbacks; unsettled mutation counters/queue ownership are retained. Ordinary
failures preserve unrelated state/activity. Exhausting the existing 1,024-account
late latch bound invokes permanent global stop. No rollback or latch recovery.

Actual static checks (no test execution):

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts`: PID **576752**, exit **0**.
- `node node_modules/typescript/bin/tsc --noEmit --project tsconfig.main.json --incremental false`: PID **576758**, exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts src/main/plugins/mail-account-credentials.ts --max-warnings 0`: PID **576746**, exit **0**.
- `git diff --check`: PID **576765**, exit **0**.

Scoped no-index whitespace checks cover all three source deltas, including
untracked files: exit **1** only because files differ, zero diagnostics. Exact
commands/PIDs are in the individual `*-whitespace.json` receipts. Source formatting
write PID **576709**, exit **0**, all files unchanged by formatting. Strict main
TypeScript tool shell session **53463** and scoped ESLint session **58179** both
settled exit **0**; other checks settled without tool shell session IDs.
Added Markdown excerpts are formatted separately; historical Markdown is preserved.

Read-only AgentRun discovery PID **576618**, exit **0**:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791486726990:1791486727104:5iby3x`.
Exact spawned process session: `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791486726990`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID not exposed by discovery; none invented.
Running AgentRun metadata is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback sent.
Provenance: headless Relay thread `1557130738971971689`, requester Mira/Obsidian
Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Tests created/executed **0/0**, images analyzed **0**. Mock/production-tested
**false/false**. Actual synthetic facade/store/activity/seal/anchor/keyring
regressions are requirements in this current document only. Source/static
acceptance only; full lifecycle/trusted setup/public integration and production
acceptance remain unavailable, HOST-05 gates unmet and Backstage paused.
No true dependency blocker/halt marker. No real credential/keyring/storage/mail/
network/login runtime, install/shared dependency mutation, live Cue subscription,
callback/notify/Discord, commit/push/PR/hooks bypass/merge/deploy. Exactly one
prerequisite; exit after this task.

Evidence directory: `.maestro/verification/host-02-facade-completion-latch/`.
Contains baseline byte/hash snapshots and dirty/staged patches, exact source delta,
commands/stdout/stderr/PIDs/exits, filtered read-only run discovery and final scope
and checkbox-state preservation audit. Historical evidence stays intact.

Settlement audit PID **577090**, exit **0**: **5,569** baseline files verified;
only the three intended existing source modules and two local ledgers changed.
No source/test files added or removed. All **79** original checkbox lines/states
and their order are preserved; exactly one inserted prerequisite is complete and
the lifecycle parent remains unchecked. Staged patch/dirty status and historical
document bytes are preserved; source hashes match passed static checks. Delta
**+24/-10**. Temporary worktree-local dependency symlink removed without writing
the shared tree. Scope/whitespace receipts are retained in the verification folder.

Initial Markdown invocations respected the ignored verification directory and
were not relied on for formatting. Explicit `--ignore-path /dev/null` excerpt
formatting PID **577003** and check PID **577014**, exits **0/0**, processed both
added excerpts (unchanged). Historical document formatting is not asserted.
Source formatting/strict main TypeScript/scoped ESLint exits **0/0/0**; tests
created/executed **0/0**, images analyzed **0**. No dependency blocker/halt marker.
Full lifecycle/production acceptance and HOST-05 remain unfinished; Backstage
stays paused. Exit after this one source prerequisite.

## HOST-02 trusted setup confirmation core receipt (2026-10-08)

Completed one bounded source prerequisite inserted immediately before the first
unchecked oversized account lifecycle task in current `RELAY-IMAP-HOST-02.md`.
The lifecycle parent remains unchecked; no earlier/different document was executed.
Added `src/main/plugins/mail-setup-confirmation.ts`, **266 lines**, reusing canonical
consent nonces/frame comparison, closed records/identity, sealed store checks,
activity errors, live member validation and duration constants. It captures one
host frame/lifetime/operation, requires exact one-time nonce plus mandatory actual
host gesture, cancels/disposes on close/expiry/failure/source abort, keeps canceled
unsettled work bounded to one execution slot, and denies late success after release.
It returns void at confirmation. No UI/IPC/SDK/RPC or production issuer/adapter.
The mandatory dedicated-surface, real-gesture, lifecycle-abort and closed exact
operation/revision adapters remain requirements, not verified production gates.

Actual static checks, all exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-setup-confirmation.ts`, PID **578119**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`, PID **578125**, tool shell session **92219**, settled exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-setup-confirmation.ts --max-warnings 0`, PID **578126**, tool shell session **89171**, settled exit **0**.

Source formatter write PID **578062**, exit **0**. Exact commands/stdout/stderr/
PIDs/exits and source hashes are in `.maestro/verification/host-02-trusted-setup-core/`.
Baseline hashes cover **5,373** existing source/docs files; original dirty/staged
patches and local/shared ledger/playbook bytes are preserved there. Final scope,
checkbox-state and whitespace settlement is recorded below. Added Markdown is
formatted separately; historical document formatting is not asserted.

Read-only AgentRun discovery PID **577802**, exit **0**; retained metadata filtered
to this agent and reduced to run identity/status (no prompt payload):
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791487111343:1791487111451:6315x1`.
Exact spawned process session: `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791487111343`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID not exposed by discovery; none invented.
Running metadata is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback or notice sent.
Provenance: headless Relay thread `1557130738971971689`, requester Mira/Obsidian
Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Tests created/executed **0/0**, images analyzed **0**; mock/production-tested
**false/false**. Deferred actual synthetic requirements are recorded in this
current document. No dependency blocker/halt marker. Full lifecycle/trusted setup
UI/IPC/adapters/public integration and production acceptance remain unavailable;
HOST-05 gates are unmet and Backstage remains paused. No forced settlement, native
preemption, rollback or latch recovery is claimed. No real keyring/storage/network/
mail/login/credential runtime, dependency install/shared mutation, live Cue
subscriptions, callback/notify/Discord, commit/push/PR/hooks bypass/merge/deploy.
Exit after exactly this one prerequisite.

Settlement audit PID **578577**, exit **0**: **5,373** baseline source/docs files
verified; only the two local ledgers changed and one intended 266-line source
module was added (**+266/-0**). No pre-existing source/test file changed or was
removed. All **80** original checkbox lines/states/order and original dirty/staged
patches preserved; exactly one inserted prerequisite is complete, lifecycle parent
unchecked. Historical Markdown bytes preserved. Passed-check source hash unchanged.
Temporary dependency link removed without shared-tree mutation.

Tracked whitespace PID **578411**, exit **0**. New-source no-index whitespace PID
**578423**, exit **1** solely for addition, zero diagnostics. Scoped contract/local
ledger/current playbook/shared ledger whitespace PIDs **578578/578579/578580/578587**,
exits **1/1/1/1** solely for differences, zero diagnostics. Added Markdown excerpt
format/check PIDs **578335/578398**, exits **0/0**; historical document formatting
not asserted. Exact receipts and source patch/numstat are in the verification
folder. Tests created/executed **0/0**, images analyzed **0**, source/static acceptance
only. No dependency blocker/halt marker. Full lifecycle/trusted setup adapters,
production acceptance and HOST-05 remain unfinished; Backstage stays paused.
Exit after exactly this one prerequisite.

## HOST-02 closed setup operation intent receipt (2026-10-08)

Completed one bounded prerequisite inserted immediately before the first unchecked
oversized account lifecycle task in current `RELAY-IMAP-HOST-02.md`. The full
lifecycle parent remains unchecked; no other Host task document was executed.
Added `src/main/plugins/mail-setup-operation-intent.ts` (124 lines) and three lines
of canonical parser alias exports in `mail-account-config.ts`, source delta
**+127/-0**, two source modules. Seven immutable secret-free operation shapes and
pure exact stored account/tombstone preflight reuse canonical validators; no
confirmation/facade wiring, credential input or production caller. Contract and
both evidence ledgers updated; actual synthetic tests remain deferred separately.

Static checks, each exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-config.ts src/main/plugins/mail-setup-operation-intent.ts`, PID **580374**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`, PID **580372**, shell session **45571**, settled exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-config.ts src/main/plugins/mail-setup-operation-intent.ts --max-warnings 0`, PID **580379**, shell session **74256**, settled exit **0**.

Source formatter write PID **580316**, exit **0**. Exact commands/stdout/stderr/
PIDs/exits/hashes and preserved baseline bytes/dirty/staged patches are retained in
worktree `.maestro/verification/host-02-setup-operation-intents/`. Source acceptance
only; static checks do not execute the implementation. Final whitespace/scope and
checkbox-preservation receipts are appended after settlement. Added Markdown is
formatted independently; historical formatting is not asserted.

Read-only AgentRun discovery PID **580287**, exit **0**:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791487732930:1791487733034:du4xq1`.
Exact spawned process session: `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791487732930`.
Agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab:
`5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID not exposed by discovery; none invented. Running
run metadata is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only, no callback sent.
Provenance: headless Relay thread `1557130738971971689`, requester Mira/Obsidian
Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Tests created/executed **0/0**, images analyzed **0**, mock/production-tested
**false/false**. No true dependency blocker/halt marker. Full lifecycle/trusted
setup adapters/public integration and production acceptance remain unavailable;
HOST-05 gates unmet and Backstage paused. No real mail/server/credential/login,
native/storage/network runtime, install/shared dependency mutation, Cue subscription,
callback/notify/Discord, commit/push/PR/hook bypass/merge/deployment. Exactly one
prerequisite completed; exit after this task.

Settlement audit PID **580678**, exit **0**: **5,587** baseline files verified;
only the intended three-line canonical source export and two local ledgers changed,
and one 124-line source module was added (**+127/-0**). No pre-existing source/test
file was removed; all **81** original checkbox lines/states/order and original
staged/dirty patches are preserved. Exactly one inserted prerequisite is complete;
the lifecycle parent remains unchecked. Historical contract/local/shared ledger
bytes preserved. Source hashes match passed static checks. Temporary dependency
link removed without shared-tree mutation.

Tracked whitespace PID **580590**, exit **0**. New/existing scoped source whitespace
PIDs **580607/580589**, exits **1/1** solely for differences, zero diagnostics.
Scoped document whitespace exits **1/1/1/1** solely for differences, zero diagnostics;
exact commands and final PIDs are retained in `settlement.json`. Added Markdown
format/check PIDs **580544/580588**, exits **0/0**. Historical formatting is not
asserted. Tests created/executed **0/0**, images analyzed **0**, source/static
acceptance only. No true dependency blocker/halt marker. Full lifecycle/production
acceptance and HOST-05 remain unfinished; Backstage stays paused. Exit after this
one prerequisite.

## HOST-02 setup confirmation intent binding receipt (2026-10-08)

Completed one bounded prerequisite inserted immediately before the first unchecked
oversized lifecycle task in current `RELAY-IMAP-HOST-02.md`. The lifecycle parent
remains unchecked. Changed only existing `mail-setup-confirmation.ts`, **+33/-7**
(292 total lines), to capture the canonical closed intent before host callbacks,
bind authorized stored installation and recheck exact target at issuance/confirmation.
A final sealed-store recheck rejects configuration changes inside frame callbacks.
Work receives the captured immutable intent; pre-mutation admission ends when work
starts while original lifetime/frame/policy/consent/membership/release gates remain.
No fixed facade dispatcher or production caller was added. Contract and both evidence
ledgers updated; historical evidence and pre-existing dirty work are preserved.

Actual static checks, each exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-setup-confirmation.ts`, PID **581386**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`, PID **581404**, tool shell session **13703**, settled exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-setup-confirmation.ts --max-warnings 0`, PID **581411**, tool shell session **92122**, settled exit **0**.
- `git diff --check`, PID **581392**, exit **0** (tracked changes only; scoped untracked delta is checked separately).

Source formatter write PID **581348**, exit **0**, unchanged. Exact commands/PIDs/
stdout/stderr/exits/source hashes and **5,375** baseline source/docs file hashes,
original dirty/staged patches and source/document bytes are retained in worktree
`.maestro/verification/host-02-confirmation-intent-binding/`. Source delta patch and
numstat are preserved. Final scope/checkbox/whitespace settlement follows separately.
Added Markdown excerpts are formatted independently; historical formatting is not
asserted. Tests created/executed **0/0**, images analyzed **0**; mock/production-tested
**false/false**. Actual synthetic requirements are deferred in this current document.

Read-only AgentRun discovery PID **581277**, exit **0**:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791488131282:1791488131404:xmetux`.
Exact spawned process session: `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791488131282`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID not exposed by discovery; none invented. Running
metadata is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback or notice sent.
Provenance: headless Relay thread `1557130738971971689`, requester Mira/Obsidian
Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

No true dependency blocker/halt marker. Full lifecycle/fixed facade dispatcher,
trusted setup UI/IPC/adapters/public integration and production acceptance remain
unavailable; HOST-05 gates are unmet and Backstage stays paused. No real credential/
keyring/storage/network/mail/server/login runtime, install/shared dependency mutation,
live Cue subscription, callback/notify/Discord, commit/push/PR/hooks bypass/merge/
deployment. No rollback/latch recovery is claimed. Exit after this one prerequisite.

Settlement audit PID **581666**, exit **0**: **5,375** baseline source/docs files
verified; only the intended existing confirmation module and two local ledgers
changed (**+33/-7** source delta). No source/test files were added or removed. All
**82** original checkbox lines/states/order and original staged/dirty patches are
preserved; exactly one inserted prerequisite is complete and the full lifecycle
parent remains unchecked. Historical document bytes are preserved. Source hashes
match passed formatting/strict main TypeScript/scoped ESLint checks (exits **0/0/0**).
Temporary local dependency symlink removed without shared-tree mutation.

Scoped source/contract/local-ledger/current-playbook/shared-ledger whitespace PIDs
**581695/581696/581697/581698/581699**, exits **1/1/1/1/1** solely for differences;
zero whitespace diagnostics. Exact commands/receipts are in the verification folder.
Tracked whitespace exit **0**. Added contract/requirements/receipt Markdown format
and check PIDs **581546/581585**, exits **0/0**; historical formatting is not asserted.
Final receipt-appended scope/whitespace audit is retained in `settlement.json`;
these first settlement receipts remain in `settlement-initial.json`.
Tests created/executed **0/0**, images analyzed **0**, source/static acceptance only.
No dependency blocker/halt marker. Full lifecycle/fixed facade dispatch/trusted setup
adapters/public integration, production acceptance and HOST-05 remain unfinished;
Backstage stays paused. Exit after this one prerequisite.

## HOST-02 setup confirmation fixed-facade dispatch receipt (2026-10-08)

Completed exactly one bounded source prerequisite inserted immediately before
current HOST-02's first unchecked oversized lifecycle task. That parent remains
unchecked. Existing `src/main/plugins/mail-setup-confirmation.ts` is the only
source change: **+51/-15**, 328 total lines. The core now owns the canonical
MailAccountCredentials facade with the same captured store/plugin/dual identity
and optional validated synthetic native factory. Removed arbitrary work callbacks;
all seven captured secret-free intents select existing guarded methods under
original confirmation authority. Facade returns are discarded; confirmation
returns void. No second store/queue/activity registry/runner, new source module,
password action or production issuer was added. Original target/install/frame/
gesture/membership/lifetime/cancellation/release checks remain; existing facades
retain mutation queues, cleanup and failure latches. Contract and deferred synthetic
regression requirements are updated. Existing dirty work and historical receipts
are preserved.

Actual static checks, all settled exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-setup-confirmation.ts`, PID **582339**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`, PID **582321**, tool shell session **80725**, settled exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-setup-confirmation.ts --max-warnings 0`, PID **582320**, tool shell session **9280**, settled exit **0**.
- `git diff --check`, PID **582322**, exit **0** (tracked changes; scoped untracked deltas are audited separately).

Source formatter write PID **582282**, exit **0**; contract excerpt formatter PID
**582403**, exit **0**. Exact commands/PIDs/exits/stdout/stderr/source hashes,
**5,375** baseline source/docs hashes, original dirty/staged patches and original
source/document bytes are retained in worktree
`.maestro/verification/host-02-confirmation-fixed-facades/`. Source patch and numstat
are retained. Final scope/checkbox/whitespace settlement follows below. Added
Markdown excerpts are checked independently; historical formatting is not asserted.
Tests created/executed **0/0**, images analyzed **0**; implemented/static only,
mock-tested and production-tested **false/false**. No implementation, native
keyring/storage/network/mail/server/login runtime was invoked for verification.

Read-only AgentRun discovery PID **582223**, exit **0**:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791488552804:1791488552940:r3x919`.
Exact spawned process session: `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791488552804`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID not exposed by discovery; none invented.
Running metadata is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback or notice sent.
Provenance: headless Relay thread `1557130738971971689`, requester Mira/Obsidian
Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

No true dependency blocker/halt marker. Full lifecycle/trusted setup UI/IPC/adapters,
password confirmation and public integration/production acceptance remain unavailable;
HOST-05 conditional gates remain unmet and Backstage stays paused. No dependency
installation/shared-tree mutation, live Cue subscription, direct Discord/callback/
notify, commit/push/PR/hooks bypass/upstream merge/deployment. No rollback or
latch recovery is claimed. Exit after this one prerequisite.

Settlement audit PID **582654**, exit **0**: all **5,375** baseline source/docs
files checked; only intended confirmation source and two local ledgers changed.
All **83** original checkbox lines/states/order, original staged/dirty patches and
historical document bytes are preserved; exactly one inserted prerequisite is
complete and the full lifecycle parent remains unchecked. Source **+51/-15**
hash matches passed formatting/strict type/scoped lint checks. Temporary local
dependency symlink removed without shared-tree mutation. Scoped source/contract/
local-ledger/current-playbook/shared-ledger whitespace PIDs **582669–582673**,
exits **1/1/1/1/1** solely for differences, with zero diagnostics; tracked whitespace
exit **0**. Exact commands/receipts retained. Added Markdown excerpts check PID
**582640**, exit **0**; summary/requirements format PIDs **582534/582546**, exits
**0/0**. Receipt-appended final audit is retained in `settlement-final.json` and
`settlement.json`; initial audit is preserved separately. Tests created/executed
**0/0**, images **0**. No blocker/halt marker; full lifecycle/production acceptance
and HOST-05 remain unfinished, Backstage paused. Exit after this one prerequisite.

## HOST-02 confirmation issuance snapshot — one-task receipt (2026-10-08)

Completed only the bounded issuance snapshot prerequisite inserted immediately
before the first unchecked oversized lifecycle task in current
`RELAY-IMAP-HOST-02.md`. Existing `mail-setup-confirmation.ts`: **+9/-3**,
334 lines. Sender and closed intent are captured before superseded-ticket abort
callbacks; malformed replacement sender/invalid source leave the old prompt usable.
One original monotonic deadline includes cleanup, with cancellation/expiry checked
before replacement allocation and its timer scheduled from the remaining budget.
Canonical nonce/frame/facade/store/activity/queue/release gates are preserved.
Lifecycle parent and production acceptance stay unchecked; no production issuer,
setup adapters/password confirmation/public integration or latch recovery added.

Actual static checks, all settled exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-setup-confirmation.ts`, PID **583221**, exit **0**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`, PID **583215**, exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-setup-confirmation.ts --max-warnings 0`, PID **583240**, exit **0**.
- `git diff --check`, PID **583227**, exit **0**.

TypeScript tool shell session **62942** and ESLint session **89199** settled exit
**0/0**. Source formatter write PID **583181**, exit **0**, unchanged.
Exact commands/PIDs/stdout/stderr/exits, checked source hash, source patch/numstat,
**5,375** baseline source/docs hashes, original source/document bytes and original
tracked/staged dirty patches are retained in worktree
`.maestro/verification/host-02-confirmation-issuance-snapshot/`.
Added Markdown is formatted independently; historical formatting is not asserted.
Final scope/checkbox/whitespace settlement is recorded separately.

Tests created/executed **0/0**, images analyzed **0**. This is source/static
acceptance only; mock-tested/production-tested **false/false**. Actual synthetic
regression requirements are deferred in this current document. Static tools did
not invoke confirmation/facade/credential/store/transport implementations.

Read-only AgentRun discovery PID **583122**, exit **0**:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791488903793:1791488903934:hlsg23`.
Exact spawned process session: `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791488903793`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (context).
Agent OS PID/provider session ID not exposed by discovery; none invented. Running
metadata is not completion evidence. Coordinator tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback/notice sent.
Origin thread `1557130738971971689`, requester Mira/Obsidian Codex
`76fd8ebe-7346-4db0-8799-edcd03071bb2`.

No true dependency blocker/halt marker. Full lifecycle/production acceptance and
HOST-05 remain unfinished; Backstage stays paused. No test/native/storage/network/
mail/server/login/credential runtime, dependency installation/shared mutation,
live Cue, callback/notification/Discord, commit/push/PR/hooks bypass/merge/deployment.
Exit after this one prerequisite.

Added Markdown formatting PIDs **583340/583406**, exits **0/0**; excerpts check
PID **583417**, exit **0**. Historical document formatting is not asserted.

Settlement audit PID **583453**, exit **0**: all **5,375** baseline source/docs
files verified; only the intended confirmation source and two local ledgers changed.
All **84** original checkbox lines/states/order, tracked/staged dirty patches and
historical document bytes are preserved. Exactly one inserted prerequisite is
complete; lifecycle parent remains unchecked. Source **+9/-3**, hash unchanged
since passed formatting/strict main TypeScript/scoped ESLint checks. Temporary
local dependency link removed without shared-tree mutation.

Scoped source/contract/local-ledger/current-playbook/shared-ledger whitespace PIDs
**583468/583469/583470/583471/583472**, exits **1/1/1/1/1** solely for differences,
zero whitespace diagnostics; tracked whitespace exit **0**. Exact commands and
receipts are retained. Receipt-appended final audit is in `settlement-final.json`
and `settlement.json`; this first scope audit is in `settlement-initial-scope.json`.
Tests created/executed **0/0**, images analyzed **0**. No true dependency blocker
or halt marker. Full lifecycle/production acceptance and HOST-05 remain unfinished;
Backstage stays paused. Exit after this one prerequisite.

## HOST-02 confirm-time password save — one-task receipt (2026-10-08)

Completed only the bounded prerequisite inserted immediately before the first
unchecked oversized lifecycle task in current `RELAY-IMAP-HOST-02.md`. Changed
existing `mail-setup-confirmation.ts` **+47/-10** (371 lines) and
`mail-setup-operation-intent.ts` **+5/-3** (126 lines), total **+52/-13** in two
source modules. Added secret-free exact disabled-account save intent and closed
confirm-time nonce/password ingestion routed only to the canonical owned save
facade. Password/input references are dropped before callbacks, on cancel,
after dispatch and every admitted exit; no ticket secret or returned data.
Existing nonce/frame/gesture/install/revision/lifetime/queue/sealed commit/readback/
cleanup/failure latch semantics remain. Strings/caller objects cannot be zeroized.
Full lifecycle parent and production acceptance remain unchecked; no production
issuer/surface/IPC/UI/SDK/RPC/login integration or latch recovery added.

Actual static checks, each settled exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-setup-confirmation.ts src/main/plugins/mail-setup-operation-intent.ts`, PID **584087**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`, PID **584088**, tool shell session **95763**, settled exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-setup-confirmation.ts src/main/plugins/mail-setup-operation-intent.ts --max-warnings 0`, PID **584111**, tool shell session **48369**, settled exit **0**.
- `git diff --check`, PID **584089**, exit **0** (tracked changes only; scoped deltas checked separately).

Source formatter PID **584061**, exit **0**, unchanged. Exact commands/PIDs/
stdout/stderr/exits/source hashes, source patch/numstat, **5,375** baseline
source/docs hashes and original document/source bytes and tracked/staged dirty
patches are retained in worktree
`.maestro/verification/host-02-confirmation-password-save/`.
Added Markdown is formatted separately; historical formatting is not asserted.
Final source/checkbox/scope/whitespace settlement follows separately.
Tests created/executed **0/0**, images analyzed **0**; mock/production-tested
**false/false**. Static checks did not invoke the implementation. Synthetic
regression requirements are deferred in this current document.

Read-only AgentRun discovery PID **583993**, exit **0**:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791489194117:1791489194223:wyb3ta`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791489194117`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID not exposed by discovery; none invented.
Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only;
no callback sent. Origin headless Relay thread `1557130738971971689`, requester
Mira/Obsidian Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.
Running metadata is not completion evidence.

No true dependency blocker/halt marker. Full lifecycle/production adapters/public
integration/production acceptance and HOST-05 remain unfinished; Backstage stays
paused. No test/native/keyring/storage/network/mail/server/login/real credential
runtime, dependency installation/shared mutation, live Cue, callback/notice/Discord,
commit/push/PR/hook bypass/merge/deployment. Exit after this one prerequisite.

Settlement audit PID **584366**, exit **0**: all **5,375** baseline source/docs
files verified; only the two intended existing source modules and two local ledgers
changed. All **85** original checkbox lines/states/order, staged/tracked dirty
patches and historical document bytes are preserved. Exactly one inserted
prerequisite is complete; full lifecycle parent remains unchecked. Source **+52/-13**
hashes match passed formatting/strict main TypeScript/scoped ESLint checks.
Temporary dependency symlink removed without shared-tree mutation.

Scoped source/intent-source/contract/local-ledger/current-playbook/shared-ledger
whitespace PIDs **584382–584387**, exits **1/1/1/1/1/1** solely for differences,
with zero diagnostics; tracked whitespace exit **0**. Exact commands/receipts are
retained. Markdown excerpts explicit formatting/check PIDs **584301/584332**,
exits **0/0**, with ignore paths disabled for these ignored verification artifacts;
historical document formatting is not asserted. Earlier default-ignore formatter
PID **584272**, exit **0**, skipped the ignored artifacts and is not formatting
acceptance. Final receipt-appended audit is retained in `settlement-final.json`
and `settlement.json`; the initial scope audit is preserved separately.
Tests created/executed **0/0**, images analyzed **0**; source/static acceptance only.
No true dependency blocker/halt marker. Full lifecycle/production acceptance and
HOST-05 remain unfinished; Backstage stays paused. Exit after this one prerequisite.

## HOST-02 synchronous assertion guards - one-task receipt (2026-10-08)

Completed only the bounded prerequisite inserted immediately before the first
unchecked oversized lifecycle task in current `RELAY-IMAP-HOST-02.md`. Existing
`mail-account-activity.ts`: **+16/-2**; existing `mail-setup-confirmation.ts`:
**+3/-1**; total **+19/-3**, two existing modules. The canonical authority guard
requires synchronous undefined success and denies every other result immediately;
ordinary native promise rejection is observed without content/authorization and
arbitrary thenables are not assimilated. Setup surface assertions now forward their
leaf result into the guard; existing gesture/membership wrappers share it. Prior
nonce/frame/install/target/lifetime/cancel/queue/lease/failure latch semantics remain.
Direct callbacks or wrappers discarding an inner promise elsewhere are not asserted
fixed. No production issuer, surface/policy adapter, public integration or recovery.
Full lifecycle parent and production acceptance remain unchecked; HOST-05 remains
unmet and Backstage paused. No true dependency blocker or halt marker.

Actual static checks, each settled exit **0**:

- `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-activity.ts src/main/plugins/mail-setup-confirmation.ts`, PID **586250**.
- `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`, PID **586251**, tool shell session **29635**, settled exit **0**.
- `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-activity.ts src/main/plugins/mail-setup-confirmation.ts --max-warnings 0`, PID **586262**, tool shell session **41487**, settled exit **0**.
- `git diff --check`, PID **586263**, exit **0** (tracked changes; scoped untracked deltas audited separately).

Source formatter PID **585478**, exit **0**. Exact command/PID/stdout/stderr/exit/
checked hashes, **5,375** baseline source/docs hashes, original document/source
bytes and tracked/staged dirty patches and source delta patch/numstat are retained
in worktree `.maestro/verification/host-02-synchronous-authority-guards/`. Added
Markdown excerpts are formatted separately; historical formatting is not asserted.
Final scope/checkbox/whitespace settlement follows separately. Tests created/executed
**0/0**, images analyzed **0**; mock-tested/production-tested **false/false**.
Static tools did not invoke the implementation. Actual synthetic requirements are
recorded in this current document for separate later test phases.

Read-only discovery PID **585130**, exit **0**. Actual AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791489595455:1791489595584:y812qy`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791489595455`.
Registered agent: `228eef8c-75a8-46e8-bb67-2903da23bc06`.
Own execution/report tab: `5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID were not exposed by discovery; none invented.
Running metadata is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback/notice sent.
Origin headless Relay thread `1557130738971971689`, requester Mira/Obsidian Codex
`76fd8ebe-7346-4db0-8799-edcd03071bb2`.

No tests, implementation/native/keyring/storage/network/mail/server/login/real
credential runtime, dependency installation/shared mutation, live Cue, callback/
notice/Discord, commit/push/PR/hook bypass/merge/deployment. No preemption or rollback
of invalid async adapter work, Promise subclass/species acceptance or latch recovery
claimed. Exit after this one prerequisite.

Settlement audit PID **586522**, exit **0**: all **5,375** baseline source/docs
files verified; only the two intended existing source modules and two local ledgers
changed. All **86** original checkbox lines/states/order and original staged/tracked
dirty patches are preserved, with historical document bytes retained. Exactly one
inserted prerequisite is complete; lifecycle parent remains unchecked. Source delta
**+19/-3** hashes match passed formatting/strict main TypeScript/scoped ESLint checks.
Temporary local dependency symlink removed without shared-tree mutation.

Scoped source/source/contract/local-ledger/current-playbook/shared-ledger whitespace
PIDs **586536-586541**, exits **1/1/1/1/1/1** solely for differences, zero diagnostics;
tracked whitespace exit **0**. Added Markdown formatter/check PIDs **586392/586467**,
exits **0/0**, with explicit empty ignore path for ignored verification artifacts.
Historical formatting is not asserted. Initial settlement script PID **586483**,
exit **1**, had an unclosed parenthesis in the verification script and did not run
its assertions. That script typo was corrected; its failure stdout/stderr/receipt
remain retained beside the successful audit. This was a verification-script failure,
not a source/tool/test failure. Final receipt-appended audit is retained separately.
Tests created/executed **0/0**, images **0**; no true dependency blocker or halt marker.
Full lifecycle/production acceptance/HOST-05 remain unfinished, Backstage paused.
Exit after this one prerequisite.

## HOST-02 synchronous credential-slot assertion prerequisite (2026-10-08)

Completed one bounded prerequisite inserted immediately before the first unchecked
lifecycle task in current `RELAY-IMAP-HOST-02.md`. The parent remains unchecked.
Actual review found direct `MailCredentialSlot.assertActive` discarded callback
results even after the canonical guard had been tightened. Changed only existing
`src/main/plugins/mail-credentials.ts`: import/reuse `assertMailActivityAuthority`
and forward the captured bound callback's actual result. Source delta **+2/-1**,
no new helper/store/queue/runner. Existing slot error/cancel/capture/native ordering,
exact namespace, secret reference and failed LOGIN cleanup semantics are retained.
Direct transport/nested-policy assertion audit and production lifecycle remain
unfinished. Test requirements were recorded separately; no test creation/execution.

Actual static checks (all exit **0**, implementation not invoked):

- Prettier PID **587168**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-credentials.ts`.
- Strict main TypeScript PID **587167**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`.
- Scoped ESLint PID **587179**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-credentials.ts --max-warnings 0`.
- Tracked whitespace PID **587186**: `git diff --check`.

Read-only AgentRun discovery PID **587117**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Actual AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791490106395:1791490106592:rb9xav`.
Exact spawned process session:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791490106395`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` (session context).
Agent OS PID/provider session ID were not exposed; none invented. Running metadata
is not completion. Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60`
is context only; no callback or notice sent. Origin headless Relay thread
`1557130738971971689`, requester Mira/Obsidian Codex
`76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Receipts, exact commands/PIDs/stdout/stderr/exits/checked hashes, original file
bytes, **5,375** source/docs baseline hashes, tracked/staged dirty patches and
source delta are retained in worktree
`.maestro/verification/host-02-credential-slot-synchronous-authority/`.
Added Markdown is formatted separately; historical formatting is not asserted.
Final scope/historical-byte/checkbox/whitespace audit follows separately.

Tests created/executed **0/0**, images analyzed **0**; mock-tested/production-tested
**false/false**. No implementation/native/keyring/storage/network/mail/server/login/
real credential runtime, installs/shared dependency mutation, live Cue, callback/
notice/Discord, commit/push/PR/hooks bypass/merge/deployment. No true dependency
blocker or halt marker. Full lifecycle/production acceptance/HOST-05 remain
unfinished and Backstage remains paused. Exit after this one prerequisite.

Settlement audit PID **587373**, exit **0**: verified all **5,375** baseline
source/docs files. Only the intended existing source module and two local
contract/evidence files changed; original staged/tracked dirty patches, all **87**
original checkbox states/order and historical document bytes are preserved.
Exactly one inserted prerequisite is complete; the lifecycle parent remains
unchecked. Source delta **+2/-1** matches passed checks. Temporary local dependency
symlink removed without shared dependency mutation.

Scoped source/contract/local-ledger/current-playbook/shared-ledger whitespace PIDs
**587388-587392**, exits **1/1/1/1/1** solely because files differ, zero diagnostics.
Tracked whitespace exit **0**. Added Markdown formatter/check PIDs **587296/587332**,
exits **0/0**, using an explicit empty ignore path for ignored local artifacts.
Final receipt-appended audit is retained separately. Tests created/executed **0/0**,
images **0**; no true blocker or halt marker. Full lifecycle/production acceptance
and HOST-05 remain unfinished; Backstage paused. Exit after this one prerequisite.

## HOST-02 synchronous configured-transport assertion prerequisite (2026-10-08)

Completed one bounded prerequisite inserted immediately before the first unchecked
lifecycle task in current `RELAY-IMAP-HOST-02.md`; the lifecycle parent remains
unchecked. Actual review found configured transport authority discarded callback
results. Changed only existing `src/main/plugins/mail-imap-connection.ts`: capture the
bound original assertion once and route all existing invocation sites through
canonical `assertMailActivityAuthority`. Source delta **+3/-1**; no new helper,
store, queue, runner or public route. Admission, live transport checks and fixed-plan
post-close completion now deny non-undefined asynchronous assertions synchronously.
Existing cancel/deadline/terminal cleanup, result erasure and live port policy remain.
No production lifecycle/caller/setup acceptance or comprehensive nested-policy audit
is claimed. Synthetic regressions are requirements only, deferred to the document's
separate test creation/execution phases.

Actual static checks (implementation not invoked):

- prettier PID **588002**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-imap-connection.ts`.
- typescript PID **587982**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`.
- eslint PID **588004**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-imap-connection.ts --max-warnings 0`.
- tracked-whitespace PID **588003**, exit **0**: `git diff --check`.

Read-only AgentRun discovery PID **587922**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Actual AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791490373335:1791490373465:5n06fz`;
exact spawned process session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791490373335`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` from supplied session context. Agent OS PID
and provider session ID were not exposed; none invented. Running metadata is not
completion. Coordinator tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only;
no callback or notice sent. Headless Relay origin `1557130738971971689`, requester
Mira/Obsidian Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Exact commands/PIDs/stdout/stderr/exits, checked source hashes, original file bytes,
**5,375** source/docs baseline hashes, tracked/staged dirty patches and source delta
are retained in worktree `.maestro/verification/host-02-transport-synchronous-authority/`.
The installed dependencies were reused via a temporary worktree-local symlink;
no installation or shared dependency mutation. Added Markdown is formatted
separately, preserving historical document bytes. Final settlement audit follows.

Tests created/executed **0/0**, images analyzed **0**; mock-tested/production-tested
**false/false**. No implementation/native/keyring/storage/network/mail/server/login/
real credential runtime, live Cue, callback/notice/Discord, commit/push/PR/hooks
bypass/merge/deployment. No true dependency blocker or halt marker. Full lifecycle,
production acceptance and HOST-05 gates remain unfinished; Backstage stays paused.
Exit after this one prerequisite.

Settlement audit PID **588188**, exit **0**: verified all **5,375**
baseline source/docs files; only the intended existing source module and two local
documents changed. Original tracked/staged dirty patches, all **88** original
checkbox states/order and historical document bytes are preserved. Exactly one
inserted prerequisite is complete; the lifecycle parent remains unchecked. Source
hashes match passed checks, delta **+3/-1**. Temporary dependency symlink removed
without shared mutation.

Scoped source/contract/local-ledger/current-playbook/shared-ledger whitespace PIDs
**588203/588204/588205/588206/588207**, exits **1/1/1/1/1** solely because files differ,
with zero diagnostics. Tracked whitespace exit **0**. Added Markdown format/check
PIDs **588134/588175**, exits **0/0**. Tests created/executed **0/0**, images **0**;
no true blocker or halt marker. Final receipt-appended audit is retained separately.
Full lifecycle/production acceptance and HOST-05 remain unfinished; Backstage stays
paused. Exit after this one prerequisite.

## HOST-02 synchronous nested read-policy assertion prerequisite (2026-10-08)

Completed only the bounded prerequisite inserted immediately before the first
unchecked lifecycle task in current `RELAY-IMAP-HOST-02.md`. Parent lifecycle and
production acceptance remain unchecked. Actual source review found the captured
policy callback result was discarded inside an outer guarded closure. Changed
only existing `src/main/plugins/mail-invocation-read-authority.ts`: forward the
actual bound policy result through canonical `assertMailActivityAuthority` and
document synchronous undefined success. Source delta **+4/-1**, one module;
no new helper/store/queue/runner/public route or production policy adapter.
Exact plugin/dual identity/verified agent/independent right and before/after
registry gates remain; no permissive callback or awaited authorization added.
Invalid async adapter side effects and wrappers discarding inner results remain
outside this acceptance. Synthetic regressions are requirements only, deferred
to separate test creation/execution phases.

Actual static checks (implementation not invoked), all settled exit **0**:

- prettier PID **588791**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-invocation-read-authority.ts`.
- typescript PID **588789**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`.
- eslint PID **588790**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-invocation-read-authority.ts --max-warnings 0`.
- tracked-whitespace PID **588797**, exit **0**: `git diff --check`.

Strict main TypeScript tool shell session **74201** and scoped ESLint tool shell
session **99113** both settled with exit **0**. Tracked whitespace covers tracked
changes only; the untracked source delta and appended/inserted documents receive
separate scoped whitespace and preservation audits.

Read-only AgentRun discovery PID **588738**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Actual AgentRun: `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791490651832:1791490651939:fhd33u`.
Exact spawned process session: `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791490651832`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` from supplied session context. Agent OS PID
and provider session ID were not exposed by discovery; none invented. Running
metadata is not completion evidence. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback/notice sent.
Headless Relay origin `1557130738971971689`, requester Mira/Obsidian Codex
`76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Exact commands/PIDs/stdout/stderr/exits, checked source hashes, original file
bytes, **5,375** baseline source/docs hashes, tracked/staged dirty patches and
source delta are retained in worktree
`.maestro/verification/host-02-nested-policy-synchronous-authority/`.
Installed dependencies reused through a temporary worktree-local symlink only;
no installation/shared-tree mutation. Added Markdown is formatted separately;
historical formatting is not asserted. Final settlement audit follows.

Tests created/executed **0/0**, images analyzed **0**; mock-tested and
production-tested **false**. No implementation/native/keyring/storage/network/
mail/server/login/real credential runtime, live Cue, callback/notice/Discord,
commit/push/PR/hook bypass/merge/deployment. No true dependency blocker or halt
marker. Full lifecycle/public integration/production acceptance and HOST-05
remain unfinished; Backstage stays paused. Exit after this one prerequisite.

Settlement audit PID **588977**, exit **0**: verified all **5,375** baseline
source/docs files. Only the intended source module and two local documents changed;
original tracked/staged dirty patches, all **89** original checkbox states/order
and historical document bytes are preserved. Exactly one inserted prerequisite
is complete; the lifecycle parent remains unchecked. Source delta **+4/-1** hashes
match passed checks. Temporary dependency symlink removed without shared mutation.

Scoped source/contract/local-ledger/current-playbook/shared-ledger whitespace PIDs
**588995-588999**, exits **1/1/1/1/1** solely because files differ, zero diagnostics;
tracked whitespace exit **0**. Added Markdown formatter/check PIDs
**588899/588964**, exits **0/0**, with explicit empty ignore path. Historical
formatting is not asserted. Final receipt-appended audit is retained separately.
Tests created/executed **0/0**, images **0**; no true blocker or halt marker.
Full lifecycle/production acceptance/HOST-05 remain unfinished; Backstage paused.
Exit after this one prerequisite.

## HOST-02 sealed-ledger synchronous nested assertion prerequisite (2026-10-08)

Completed only the bounded prerequisite inserted immediately before the first
unchecked lifecycle task in current `RELAY-IMAP-HOST-02.md`. Actual review found
six external caller/setup results discarded by the canonical sealed ledger's
outer guarded closures. Updated existing `mailReadAuthority`,
`enqueueMailAccountMutation` and `enqueueRemovedMailAccountCleanup` in
`src/main/plugins/authorization-ledger.ts` to guard the actual results with
canonical `assertMailActivityAuthority`. Source delta **+7/-7**, one module;
exact ownership/stored rights/cancellation/removal checks, queue/lease/latches and
fixed errors remain. No new helper/state/store/runner/public route or production
adapter. Parent lifecycle and production acceptance remain unchecked.

Actual static checks only, all settled exit **0**:

- prettier PID **589571**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/authorization-ledger.ts`.
- typescript PID **589572**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`.
- eslint PID **589573**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/authorization-ledger.ts --max-warnings 0`.
- tracked-whitespace PID **589574**, exit **0**: `git diff --check`.

Check orchestration tool shell session **79185** settled exit **0**. No product
implementation was invoked; TypeScript used strict `tsconfig.main.json`, no emit
and incremental false, scoped ESLint used max warnings zero. Tracked whitespace
covers tracked patches; appended documents and the source delta receive separate
scoped checks. Added Markdown formatting is checked separately from historical
formatting. Native/promise/reentrant regressions are requirements only, deferred
to separate creation/execution phases.

Read-only AgentRun discovery PID **589520**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Actual AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791490925790:1791490926051:yq4nse`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791490925790`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` from supplied context. Agent OS PID/provider
session ID were not exposed; none invented. Running metadata is not completion.
Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only, no
callback sent. Headless Relay origin `1557130738971971689`, requester Mira/Obsidian
Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Baseline receipt PID **589494**, source delta, checked source hash, exact static
commands/PIDs/stdout/stderr/exits, original document/source bytes, **5,375** baseline
source/docs hashes and tracked/staged dirty patches are retained in worktree
`.maestro/verification/host-02-sealed-callback-synchronous-authority/`.
Installed local dependencies reused through a temporary worktree-local symlink;
no installation or shared dependency mutation. Final preservation and scoped
whitespace receipts follow.

Tests created/executed **0/0**, images analyzed **0**; mock-tested/production-tested
**false/false**. No implementation/native/keyring/storage/network/mail/server/login/
real credential runtime, live Cue, callback/notice/Discord, commit/push/PR/hook bypass/
merge/deployment. No true dependency blocker or halt marker. Full lifecycle/public
integration/production acceptance and HOST-05 remain unfinished; Backstage paused.
Exit after this single prerequisite.

Settlement audit PID **589902**, exit **0**: verified all **5,375** baseline
source/docs files, exact **+7/-7** source delta and matching checked source hash.
Only the intended source module and two local documents changed. Existing staged
patches, original dirty source bytes outside the exact reviewed replacements,
all **90** original checkbox states/order and historical document bytes remain
preserved. Exactly one inserted prerequisite is checked; parent lifecycle remains
unchecked. Temporary dependency symlink removed without shared mutation.

Scoped source/contract/local-ledger/current-playbook/shared-ledger whitespace PIDs
**589905-589909**, exits **1/1/1/1/1** because compared files differ, **zero diagnostics**.
Tracked whitespace PID **589574** exits **0**. Initial added-fragment formatting
check PID **589779** exited **1** due to leading boundary blank lines in standalone
fragments; normalized new fragments only, retained failure receipt. Final added
Markdown check PID **589859**, exit **0**, explicit empty ignore path. No historical
formatting claim. Source checks remain passed without subsequent source edits.
Final receipt-appended preservation/whitespace audit is retained separately in
`.maestro/verification/host-02-sealed-callback-synchronous-authority/`.
Tests created/executed **0/0**, images **0**, no true blocker/halt marker.
Full lifecycle/production acceptance/HOST-05 stay unfinished; Backstage stays paused.
Exit after this one prerequisite.

## HOST-02 setup confirmation account completion (2026-10-08)

Completed only the inserted bounded prerequisite immediately before the first
unchecked account lifecycle parent in current `RELAY-IMAP-HOST-02.md`. The parent
and production acceptance remain unchecked. No other executable document was used.

Changed only `src/main/plugins/mail-setup-confirmation.ts`: **+31/-16** against
captured dirty source. The private fixed dispatcher retains the exact target ID,
including host-generated disabled addition. Public confirmation remains void.
Capture canonical settled configuration after facade resolution, before final
surface/release callbacks; reuse the existing canonical mutation completion guard
against the same target/configuration before and after synchronous release, with
original source cancellation and release-aware setup assertions. Preserve final
original lifetime, secret cleanup, earlier facade checks, canonical failure latches
and unrelated-account isolation. No new utility/store/queue/runner/public route.

The snapshot starts after awaited facade resolution: atomic facade-to-confirmation
handoff across promise adoption and stronger native-check deadline guarantees are
not established. Existing facade committed-state checks remain mandatory. No
production setup frame/policy/gesture/lifecycle integration or acceptance claim.

Static checks only, using installed dependencies via a temporary worktree-local
`node_modules` symlink; no install/shared mutation:

| Check                  | Exact command                                                                                                  | PID    | Exit |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ------ | ---- |
| Source formatting      | `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-setup-confirmation.ts`              | 590658 | 0    |
| Strict main TypeScript | `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true` | 590681 | 0    |
| Scoped ESLint          | `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-setup-confirmation.ts --max-warnings 0`          | 590682 | 0    |

Baseline capture PID **590540**, exit **0**, preserved **5,375** source/docs hashes,
original changed-source/document bytes, tracked dirty and staged patches. Actual
source delta, checked hash, exact commands/PIDs/stdout/stderr/exits and read-only
AgentRun discovery are retained in worktree
`.maestro/verification/host-02-confirmation-account-completion/`. Final whitespace,
added-fragment formatting and preservation receipts follow below.

Read-only CLI command `node /opt/Maestro/resources/maestro-cli.js agent-run list
--status running --limit 12 --json`, PID **590567**, exit **0**, observed AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791491241244:1791491241494:ulw7is`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791491241244`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` from supplied context. Agent OS PID/provider
session ID unavailable, not invented. Running metadata is not completion.
Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no
callback sent. Headless origin `1557130738971971689`, requester Mira/Obsidian Codex
`76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Tests created/executed **0/0**, images analyzed **0**. Implemented/static checked;
mock-tested/production-tested **false/false**. No implementation/native/keyring/
storage/network/mail/server/login/real credential runtime, live Cue, callback/
notice/Discord, commit/push/PR/hook bypass/merge/deployment. No true dependency
blocker or halt marker. Full lifecycle/production acceptance/HOST-05 remain
unfinished and Backstage remains paused. Exit after this single prerequisite.

Settlement audit PID **591000**, exit **0**: verified all **5,375** baseline
source/docs hashes; only intended source and two local documentation files changed.
Exact checked source hash and **+31/-16** delta remain; staged patch and all **91**
original checkbox states/order/historical document bytes preserved. Exactly one
inserted prerequisite is checked; lifecycle parent stays unchecked.

Tracked whitespace PID **590899**, exit **0**. Scoped source/contract/local-ledger/
current-playbook/shared-ledger whitespace PIDs **590911-590915**, exits **1/1/1/1/1**
from compared files differing, **zero diagnostics**. Added Markdown initial check
PID **590916**, exit **1**, found only the standalone inserted-fragment boundary
blank line; removed that artifact boundary blank without changing production
content. Final added-fragment Prettier recheck PID **591003**, exit **0**; historical
Markdown formatting is not claimed. Static source checks remain passed without
subsequent source edits. Final receipt-appended whitespace/preservation and local
dependency-symlink removal receipts are retained in the same artifact directory.
Final ledger whitespace initially found a trailing blank at EOF (diagnostic read
PID **591073**, exit **3**); normalized only the appended settlement fragment.
Tests created/executed **0/0**, images **0**, no true blocker/halt. Full lifecycle,
production acceptance and HOST-05 remain unfinished; Backstage stays paused.
Exit after this single prerequisite.

## HOST-02 run and invocation assertion reentrancy prerequisite (2026-10-08)

Completed only the bounded prerequisite inserted immediately before the first
unchecked lifecycle task in current `RELAY-IMAP-HOST-02.md`. Actual review found
existing run/invocation checks could recursively invoke their own host assertions.
Changed only `src/main/plugins/plugin-tool-run-identity.ts`, **+16/-0** source
lines: per-existing-record checking flags deny recursion through canonical fixed
errors/removal and restore prior flags in finally. Normal sequential parent
checks, exact bindings, stale-handle denial, limits and delete-before-abort
cleanup remain. No new helper/store/queue/registry/runner/production adapter.
Parent lifecycle and production acceptance remain unchecked. Synthetic regression
requirements are recorded separately; no runtime acceptance is claimed.

Actual static checks only, all settled exit **0**:

- prettier PID **592479**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-tool-run-identity.ts`.
- typescript PID **592480**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false`.
- eslint PID **592481**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/plugin-tool-run-identity.ts --max-warnings 0`.
- tracked-whitespace PID **592482**, exit **0**: `git diff --check`.

Static-check orchestration PID **592474**, tool shell session **9142**, exit **0**.
Checked source SHA-256
`16916bbb05c1b5be89192e2d5af202154916e920491737c930b890b996cba6b8`.
Tracked whitespace covers tracked patches only; untracked source/docs receive
separate scoped whitespace/preservation audits. Added Markdown formatting is
checked separately, preserving historical bytes.

Read-only AgentRun discovery PID **591634**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Actual AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791491782723:1791491782826:qiqkja`;
exact spawned process session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791491782723`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`, execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` from supplied context. Agent OS PID/provider
session ID were not exposed; none invented. Running metadata is not completion.
Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only;
no callback/notice sent. Headless Relay origin `1557130738971971689`, requester
Mira/Obsidian Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Baseline PID **591607**, original source/document bytes, **5,375** source/docs
hashes, original tracked/staged dirty patches, source delta, checked hashes and
exact commands/PIDs/stdout/stderr/exits are retained in worktree
`.maestro/verification/host-02-run-assertion-reentrancy/`. Existing installed
local dependencies reused through a temporary worktree-local symlink only;
no installation/shared-tree mutation. Final settlement receipts follow.

Tests created/executed **0/0**, images analyzed **0**; mock-tested/production-tested
**false/false**. No implementation/native/keyring/storage/network/mail/server/login/
real credential runtime, live Cue, callback/notice/Discord, commit/push/PR/hooks
bypass/merge/deployment. No true dependency blocker or halt marker. Full lifecycle,
public integration, production acceptance and HOST-05 remain unfinished; Backstage
stays paused. Exit after this single prerequisite.

Settlement audit PID **594963**, exit **0**: verified all **5,375** baseline
source/docs files, checked source hash and exact **+16/-0** delta. Only the intended
existing source module and two local documents changed. Original tracked/staged
dirty patches, all **92** original checkbox states/order and historical document
bytes are preserved. Exactly one inserted prerequisite is complete; the parent
lifecycle remains unchecked. Temporary dependency symlink removed without shared
mutation.

Scoped source/contract/local-ledger/current-playbook/shared-ledger whitespace PIDs
**594991-594995**, exits **1/1/1/1/1** solely because the compared files differ,
**zero diagnostics**. Tracked whitespace PID **592482**, exit **0**. New Markdown
fragment formatting check PID **594845**, exit **0**, explicit empty ignore path;
historical formatting is not asserted. Final receipt-appended preservation and
whitespace audit remains separately in
`.maestro/verification/host-02-run-assertion-reentrancy/`.

Tests created/executed **0/0**, images **0**; no true dependency blocker or halt
marker. Full lifecycle/production acceptance/HOST-05 remain unfinished and
Backstage remains paused. Exit after this one prerequisite.

## HOST-02 retained activity lease assertion reentrancy prerequisite (2026-10-08)

Completed only one bounded prerequisite inserted immediately before the first
unchecked account lifecycle parent in current `RELAY-IMAP-HOST-02.md`. Actual
source review found recursive authority assertions on retained read/queued
mutation leases were unfenced. Changed only existing
`src/main/plugins/mail-account-activity.ts`, **+22/-1** source lines. Per-lease
checking flags deny recursion before another callback and restore prior flags in
finally. Read failures release idempotently; mutation lease failures immediately
use canonical cancel/failure latching before a callback can catch inner denial.
Outer checks observe aborted controllers; existing queue ownership/counters stay
retained until settlement, with original authority, limits and account isolation.
No new helper/store/queue/runner/public or production path. Admission/completion
recursion and new lease issuance are outside this bounded prerequisite.
Parent lifecycle and production acceptance remain unchecked. Synthetic regression
requirements are recorded separately; no runtime acceptance is claimed.

Actual static checks only, all settled exit **0**:

- prettier PID **596492**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-activity.ts`.
- typescript PID **596493**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- eslint PID **596494**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-activity.ts --max-warnings 0`.
- tracked-whitespace PID **596495**, exit **0**: `git diff --check`.

Static-check orchestration PID **596491**, tool shell session
**33483**, exit **0**. Checked source SHA-256
`cc63b75502d48d2e4d0f3c181f495c6d33c117c643cea202d24c0d52046ef39a`.
Tracked whitespace covers tracked patches; changed untracked source and added
Markdown fragments receive separate scoped checks and preservation audits.

Read-only AgentRun discovery PID **596163**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791492191935:1791492192053:yolaum`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791492191935`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` from supplied context. Agent OS PID/provider
session ID unavailable, not invented. Running metadata is not completion.
Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only;
no callback/notice sent. Headless origin `1557130738971971689`, requester
Mira/Obsidian Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Baseline PID **596051**, exit **0**, preserved **5,375** source/docs hashes,
original changed-source/document bytes and tracked/staged dirty patches. Source
delta, checked hash, exact commands/PIDs/stdout/stderr/exits and read-only run
metadata reside in `.maestro/verification/host-02-activity-lease-reentrancy/`.
Installed local dependencies reused through a temporary worktree-local symlink
only; no installation/shared-tree mutation. Final settlement receipts follow.

Tests created/executed **0/0**, images analyzed **0**. Implemented/static checked;
mock-tested/production-tested **false/false**. No implementation/native/keyring/
storage/network/mail/server/login/real credential runtime, live Cue, callback/
notice/Discord, commit/push/PR/hooks bypass/merge/deployment. No true dependency
blocker or halt marker. Full lifecycle/production acceptance/HOST-05 remain
unfinished and Backstage remains paused. Exit after this single prerequisite.

Settlement audit PID **597134**, exit **0**: verified all **5,375** baseline
source/docs hashes; only the intended existing source module and two local
documents changed. Original staged/tracked dirty patches, all **93** original
checkbox states/order and historical document bytes are preserved. Exactly one
inserted prerequisite is checked; lifecycle parent remains unchecked. Temporary
local dependency symlink removed without shared dependency mutation.

Scoped source/contract/local-ledger/current-playbook/shared-ledger whitespace PIDs
**597135-597139**, exits **1/1/1/1/1** solely because compared files differ, with
**zero diagnostics**. Added Markdown fragment formatting PID **596888**, exit **0**,
with explicit empty ignore path; no claim about historical Markdown formatting.
Source checks settled without subsequent source edits. Final receipt-appended
preservation and whitespace audit remains in the same artifact directory.
Tests created/executed **0/0**, images **0**; no true blocker or halt marker.
Full lifecycle/production acceptance/HOST-05 remain unfinished; Backstage stays
paused. Exit after this one prerequisite.

## HOST-02 read admission through mutation settlement prerequisite (2026-10-08)

Completed only one bounded prerequisite inserted immediately before the first
unchecked lifecycle parent in current `RELAY-IMAP-HOST-02.md`. Actual source review
found that read acquire/assertion and completion checked the mutation controller
set while ignoring its already-retained settlement counter. During synchronous
mutation release listeners and final authority callbacks, that set is empty but
the mutation has not finished. Existing `mail-account-activity.ts` now refuses
same-account reads/completion throughout this window using `settlingMutations`.
Fixed `MAIL_UNAVAILABLE` at existing read pre/post-authority and completion
pre/post-state checks; the mutation owner's internal final check, sibling queue
ownership, counters/pruning/latches and unrelated accounts/plugins are preserved.
One existing source module changed, **+5/-2** lines; no new helper/state/store/
queue/runner or production integration. Broader recursive admission/completion and
post-queue facade delivery remain outside this prerequisite. Actual synthetic
regression requirements only were recorded; lifecycle parent remains unchecked.

Static checks settled, all exit **0**, without subsequent source edits:

- Prettier PID **598371**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-activity.ts`.
- Strict main TypeScript PID **598375**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- Scoped ESLint PID **598376**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-activity.ts --max-warnings 0`.
- Tracked whitespace PID **598377**, exit **0**: `git diff --check`.

Static orchestration PID **598364**, tool shell session **57456**, exit **0**.
Checked source SHA-256
`16b34d7ce9c16678c0399c2cdcc1813006d97f984ecbcc996b8fcd154c6c0f4b`.
Tracked whitespace covers tracked patches; changed untracked source/document
fragments receive separate scoped checks and preservation audits below.

Read-only metadata command PID **598378**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791492461687:1791492461931:ed8v1j`;
spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791492461687`.
Registered worktree agent `228eef8c-75a8-46e8-bb67-2903da23bc06`;
own execution/report tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`
from supplied context. Agent OS PID/provider session ID unavailable, not invented.
Running discovery is not completion. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback/notice sent.
Headless origin `1557130738971971689`, requester Mira/Obsidian Codex
`76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Baseline PID **598100**, exit **0**, captured **5,375** source/docs hashes,
original changed-file/document bytes and tracked/staged dirty patches. Baseline,
source patch/hash, commands/PIDs/stdout/stderr/exits and run metadata are in
`.maestro/verification/host-02-read-settlement-admission/`. Only installed local
dependencies reused through a temporary worktree-local symlink; no install/shared
dependency mutation. Final preservation/whitespace receipts follow.

Tests created/executed **0/0**, images analyzed **0**, mock-tested/production-tested
**false/false**. Source review and static checks only; no implementation/native/
keyring/storage/network/mail/server/login/real credential runtime, live Cue,
callback/notice/Discord, commit/push/PR/hooks bypass/merge/deployment. No true
blocker or halt marker. Full lifecycle/production acceptance/HOST-05 remain
unfinished and Backstage remains paused. Exit after this single prerequisite.

Settlement audit PID **599000**, exit **0**: verified all **5,375** baseline
source/docs hashes; only the intended existing source and two local documents
changed. Original tracked/staged dirty patches, all **94** original checkbox
states/order and historical document bytes are preserved. Exactly one inserted
prerequisite is checked; lifecycle parent remains unchecked. Temporary local
dependency symlink removed, no shared dependency mutation.

Scoped source/contract/local-ledger/current-playbook/shared-ledger whitespace PIDs
**599014-599018**, exits **1/1/1/1/1** solely because compared files differ, with
**zero diagnostics**. Added Markdown fragment formatting PID **599019**, exit **0**,
with explicit empty ignore path; historical Markdown formatting is not asserted.
Source checks settled with no subsequent source edits. Receipt-appended final
preservation/whitespace audit is in the same artifact directory.

Tests created/executed **0/0**, images **0**; no true blocker or halt marker.
Full lifecycle/production acceptance/HOST-05 remain unfinished and Backstage stays
paused. Exit after this single prerequisite.

## HOST-02 asynchronous committed-state handoff prerequisite (2026-10-08)

Completed exactly one bounded prerequisite inserted immediately before the first
unchecked lifecycle parent in current `RELAY-IMAP-HOST-02.md`. Actual source review
found asynchronous facades discarded their committed configuration and confirmation
resnapshotted current state after promise adoption. Five asynchronous methods in
existing `mail-account-credentials.ts` now return the original immutable commit
only after their canonical final gate. Existing `mail-setup-confirmation.ts`
passes that receipt and original intent accountId into both final account gates.
Private receipt never leaves public void confirmation; synchronous add retains
its safe summary and existing resnapshot seam. No new helper/state/store/queue/
runner/production adapter. Source delta **+47/-23**, two modules. Parent lifecycle
and production acceptance remain unchecked; synthetic regression requirements
only, no runtime or production acceptance.

Actual static checks, all settled exit **0**:

- prettier PID **602547**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts src/main/plugins/mail-setup-confirmation.ts`.
- typescript PID **602544**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- eslint PID **602545**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-credentials.ts src/main/plugins/mail-setup-confirmation.ts --max-warnings 0`.
- tracked-whitespace PID **602548**, exit **0**: `git diff --check`.

Source formatter PID **602524**, exit **0**; static orchestration PID **602540**,
tool shell session **93280**, exit **0**. No source edits after passing checks.
Checked hashes, exact commands/PIDs/stdout/stderr/exits and source patches are
retained in `.maestro/verification/host-02-async-confirmation-commit-handoff/`.
Tracked whitespace covers tracked patches; scoped untracked-source and added
Markdown formatting/preservation checks are recorded in settlement receipts.

Read-only AgentRun discovery PID **601630**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791492793368:1791492793567:k12u22`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791492793368`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`; own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f` from supplied context. Agent OS PID/provider
session ID not exposed, none invented. Running metadata is not completion.
Coordinator report tab `2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only,
no callback/notice sent. Headless origin `1557130738971971689`, requester
Mira/Obsidian Codex `76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Baseline PID **601412**, exit **0**, captured **5,375** source/docs hashes,
original source/document bytes and tracked/staged dirty patches. Installed local
dependencies reused through a temporary worktree-local symlink only; no install
or shared dependency mutation. Settlement verifies preservation and symlink
removal. Existing source and historical document bytes are preserved outside the
reviewed delta and inserted/appended sections; original checkbox order/states
remain intact. Only this prerequisite is checked; no later task executed.

Tests created/executed **0/0**, images analyzed **0**,
mock-tested/production-tested **false/false**. No implementation/native/keyring/
storage/network/mail/server/login/real credential runtime, live Cue, callback/
notice/Discord, commit/push/PR/hooks bypass/merge/deployment. No true dependency
blocker or halt marker. Full lifecycle/public integration/production acceptance/
HOST-05 remain unfinished; Backstage stays paused. Exit after this one task.

Settlement audit PID **603634**, exit **0**, verified all **5,375** baseline
source/docs files and matching checked source hashes. Only the intended two source
modules and two local documents changed. Original tracked/staged patches, all
**95** original checkbox states/order and historical document bytes are preserved.
Scoped source/contract/local-ledger/current-playbook/shared-ledger whitespace PIDs
**603655-603660**, exits **1/1/1/1/1/1** solely because compared files differ,
with **zero diagnostics**. Tracked whitespace exit **0**. Added Markdown fragment
format/check PIDs **603175/603186**, exits **0/0**, explicit empty ignore path;
historical formatting is not asserted. Only the inserted prerequisite is checked.
Temporary dependency symlink removed without shared dependency mutation; final
receipt-appended preservation/whitespace audit is retained in the same verification
directory. Tests created/executed **0/0**, images **0**, no true blocker/halt marker.
Lifecycle/production acceptance/HOST-05 remain unfinished; Backstage stays paused.
Exit after this one prerequisite.

## HOST-02 disabled-add committed-state handoff prerequisite (2026-10-08)

Completed exactly one bounded prerequisite inserted immediately before the first
unchecked lifecycle parent in current `RELAY-IMAP-HOST-02.md`. Source review found
synchronous add discarded its immutable commit, passed an account ID through
async execute, then resnapshotted current configuration after adoption. Existing
`mail-account-credentials.ts` now returns the original add commit after unchanged
synchronous persistence/setup/source checks. Existing `mail-setup-confirmation.ts`
carries that receipt, derives the appended disabled revision-1 account ID and uses
the original commit/ID for both existing canonical final completion gates.
Private add return shape supersedes its old safe summary; safe stored listings
and public void confirmation remain unchanged. No new helper/state/cache/store/
queue/runner, extra credential work, public route or production integration.
Source delta **+13/-26** in **two existing modules**. No later task executed.
Full lifecycle and production acceptance remain unchecked; Backstage stays paused.

Actual static checks, all settled exit **0**:

- prettier PID **606066**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts src/main/plugins/mail-setup-confirmation.ts`.
- typescript PID **606067**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- eslint PID **606068**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-credentials.ts src/main/plugins/mail-setup-confirmation.ts --max-warnings 0`.
- tracked-whitespace PID **606069**, exit **0**: `git diff --check`.

Source formatter PID **605998**, exit **0**. Static orchestration PID
**606065**, tool shell session **68557**, exit **0**.
No source edits after passing checks. Exact source patches, checked hashes,
commands/PIDs/stdout/stderr/exits are retained in
`.maestro/verification/host-02-add-confirmation-commit-handoff/`.
Tracked whitespace is distinct from scoped untracked-source/Markdown checks.

Read-only AgentRun discovery PID **605532**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791493303392:1791493303717:dfay8j`;
exact spawned process session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791493303392`.
Registered agent `228eef8c-75a8-46e8-bb67-2903da23bc06`, branch
`feat/relay-imap-host-20261006`; supplied own execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. Provider session/agent OS PID not exposed,
none invented. Running discovery is not completion. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only, no callback sent.
Headless origin `1557130738971971689`, requester Mira/Obsidian Codex
`76fd8ebe-7346-4db0-8799-edcd03071bb2`.

Baseline PID **605477**, exit **0**, captured **5,375** source/docs hashes,
original modified source/document bytes and tracked/staged dirty patches.
Existing installed dependencies reused by temporary worktree-local symlink only;
no installation/shared dependency mutation. Settlement audit separately verifies
unchanged files/patches, original checkbox states/order and historical bytes.
Only this prerequisite is checked; unfinished parent and later tasks remain.

Tests created/executed **0/0**, images analyzed **0**,
mock-tested/production-tested **false/false**. Deferred regression requirements
are prose only; no runtime or production security acceptance. No implementation/
native/keyring/storage/network/mail/server/login/real credential runtime, live
Cue, callback/notice/Discord, commit/push/PR/hooks bypass/merge/deployment.
No true dependency blocker or halt marker. Full lifecycle/public integration/
production acceptance/HOST-05 remain unfinished; Backstage remains paused.
Exit after this single prerequisite.

Settlement audit PID **607249**, exit **0**: verified all **5,375**
baseline source/docs files and matching checked source hashes. Only the intended
two source modules and two local documents changed. Original tracked/staged dirty
patches, all **96** original checkbox states/order and historical document
bytes are preserved. Exactly one inserted prerequisite is checked; parent remains
unchecked. Scoped source/local docs/current-playbook/shared-ledger whitespace PIDs
**607270/607271/607272/607273/607274/607275**, exits
**1/1/1/1/1/1**, solely because files differ,
with **zero diagnostics**. Added Markdown fragment check PID **607276**,
exit **0**, explicit empty ignore path; historical formatting is not asserted.
Temporary dependency symlink removed without shared dependency mutation. Final
receipt-appended preservation audit is retained in the same artifact directory.
Tests created/executed **0/0**, images **0**, no true blocker/halt marker.
Lifecycle/production acceptance/HOST-05 remain unfinished; Backstage stays paused.
Exit after this single prerequisite.

## HOST-02 same-account read admission reentrancy prerequisite (2026-10-08)

Completed exactly one bounded prerequisite inserted immediately before the first
unchecked lifecycle parent in current RELAY-IMAP-HOST-02.md. Actual source review
found host authority ran before activity registration and could recursively issue
new leases. Existing authorization-ledger.ts now performs captured-identity stored
validation before allocation and runs full live/stored checks inside guarded
activity admission. Existing mail-account-activity.ts retains the admitting read's
controller on its bounded account state, denies recursive same-account issuance
before another callback/reader, aborts outer admission even when inner denial is
caught, and clears/prunes the marker only after cleanup. Existing same-account
readers, sequential/other-account/plugin activity, limits/counters, retained lease
guards and canonical mutation/settlement/stop gates are preserved. No new helper,
registry/store/queue/runner or production integration. Source delta +27/-5 across
two modules. Native adapter, mutation admission and final completion recursion
remain outside this prerequisite. Synthetic regression requirements only were
recorded; parent lifecycle/production acceptance remain unchecked.

Actual static checks, all settled exit 0, without subsequent source edits:

- prettier PID **609645**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts`.
- typescript PID **609646**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- eslint PID **609647**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts --max-warnings 0`.
- tracked-whitespace PID **609648**, exit **0**: `git diff --check`.

Source formatter PID **609624**, exit **0**; static orchestration PID
**609644**, tool shell session **41153**, exit **0**.
Checked source SHA-256 hashes and exact commands/PIDs/stdout/stderr/exits are
retained in `.maestro/verification/host-02-read-admission-reentrancy/`.
Tracked whitespace covers tracked changes; scoped source/document preservation
and whitespace plus added Markdown fragment formatting are audited separately.

Read-only AgentRun discovery PID **609081**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791493655783:1791493656742:yg3oey`;
exact spawned process session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791493655783`.
Registered agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, branch
`feat/relay-imap-host-20261006`, supplied execution/report tab
**5262895a-6b3d-43fa-92cc-17449cdfa06f**. Agent OS PID/provider session ID
unavailable, none invented. Running metadata is not completion. Coordinator tab
**2515836c-307c-4e93-8fd0-c483b7b1ff60** is context only; no callback sent.
Headless Relay origin **1557130738971971689**, requester Mira/Obsidian Codex
**76fd8ebe-7346-4db0-8799-edcd03071bb2**.

Baseline PID **609045**, exit **0**, captured **5,375** source/docs hashes,
original affected-file bytes and tracked/staged dirty patches. Original history
and checkbox order/states are preserved; only the inserted prerequisite is checked.
Installed dependencies reused through a temporary worktree-local symlink only,
removed after checks, without installation or shared dependency mutation.
Settlement receipts are retained in the same verification directory.

Tests created/executed **0/0**, images analyzed **0**;
mock-tested/production-tested **false/false**. No implementation/native/keyring/
storage/network/mail/server/login/real credential runtime, live Cue, callback/
notice/Discord, commit/push/PR/hooks bypass/merge/deployment. No true dependency
blocker or halt marker. Full lifecycle/public integration/production acceptance/
HOST-05 remain unfinished; Backstage stays paused. Exit after this one prerequisite.
Settlement audit PID **610793**, exit **0**: verified all **5,375** baseline
source/docs hashes and checked source hashes; only two intended source modules
and two local documents changed. All **97** original checkbox states/order,
historical document bytes and staged dirty patch are preserved; exactly one
inserted prerequisite is complete and the lifecycle parent remains unchecked.
Temporary dependency symlink removed without shared mutation.

Scoped source/contract/local-ledger/current-playbook/shared-ledger whitespace PIDs
**610794, 610795, 610796, 610797, 610798, 610799**, exits **1/1/1/1/1/1** solely
because compared files differ, with **zero diagnostics**. Tracked whitespace exit
**0**. Added Markdown fragment format/check PIDs **610519/610800**, exits **0/0**,
explicit empty ignore path; historical Markdown formatting is not asserted.
Receipt-appended final preservation/whitespace audit is retained in the same
verification directory. Tests created/executed **0/0**, images **0**, no true
blocker/halt marker. Lifecycle/production acceptance/HOST-05 stay unfinished;
Backstage remains paused. Exit after this one prerequisite.

## HOST-02 same-account queued mutation admission recursion prerequisite (2026-10-08)

Completed exactly one bounded prerequisite inserted immediately before the first
unchecked lifecycle parent in current RELAY-IMAP-HOST-02.md. Canonical live-account
and removed-tombstone queued entry points retain captured identity and stored target
validation before allocation, and now invoke initial setup authority only inside
activity admission. Existing account state retains the admitting mutation controller;
recursive same-account enqueue latches/cancels account work before allocating another
controller or invoking another authority callback. Outer admission observes caught
inner denial; post-read-invalidation cancellation/latch checks prevent queue insertion
after reentrant read cleanup. Failure cleanup removes its source listener and own
counter/controller with the marker held; finally clears/prunes it. Existing queue,
limits, stored drain checks, ordinary queued siblings/other-account/plugin work,
retained leases and settlement gates remain. Recursive failure cancels earlier
same-account owners without dropping their counters before settlement. No new helper,
registry/store/queue/runner/public route or production setup/plugin integration.
Source delta **+71/-58**, two existing modules, including indentation changes.

Actual static checks all settled **exit 0**, no subsequent source edits:

- Prettier PID **615139**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts`.
- Strict main TypeScript PID **615140**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- Scoped ESLint PID **615142**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-activity.ts src/main/plugins/authorization-ledger.ts --max-warnings 0`.
- Tracked whitespace PID **615143**, exit **0**: `git diff --check`.

Source formatter PID **614588**, exit **0**. Static orchestration PID
**615132**, tool shell session **51206**, settled exit **0**. Exact commands,
PIDs/stdout/stderr/exits, checked source hashes, source delta and baseline are in
`.maestro/verification/host-02-mutation-admission-reentrancy/`. Tracked whitespace
covers tracked patches; scoped source/document whitespace, fragment formatting and
preservation are audited separately in the settlement receipt.

Read-only metadata command PID **613277**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791494106163:1791494106382:9c5e6t`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791494106163`.
Registered agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, branch
`feat/relay-imap-host-20261006`, supplied execution/report tab
**5262895a-6b3d-43fa-92cc-17449cdfa06f**. Agent OS PID/provider session ID
not exposed, none invented. Running metadata is not completion. Coordinator report
tab **2515836c-307c-4e93-8fd0-c483b7b1ff60** is context only; no callback sent.
Headless Relay origin **1557130738971971689**, requester Mira/Obsidian Codex
**76fd8ebe-7346-4db0-8799-edcd03071bb2**.

Baseline PID **613221**, exit **0**, captured **5,375** source/docs hashes,
original affected-file/document bytes and tracked/staged dirty patches. Existing
installed dependencies reused through a temporary worktree-local symlink only;
no installation/shared dependency mutation. Settlement verifies preservation and
symlink removal. Original completed boxes/order remain intact; only this inserted
prerequisite is checked and the lifecycle parent remains unchecked.

Tests created/executed **0/0**, images analyzed **0**,
mock-tested/production-tested **false/false**. Synthetic regression requirements
only in this current document. Native adapter recursion, facade pre-admission
assertions, recursive final completion and broader lifecycle remain separate.
No implementation/native/keyring/storage/network/mail/server/login/real credential
runtime, live Cue, callback/notice/Discord, commit/push/PR/hooks bypass/merge/deployment.
No true dependency blocker or halt marker. Full lifecycle/public integration/
production acceptance/HOST-05 remain unfinished; Backstage stays paused.
Exit after this one prerequisite.

Settlement audit PID **617091**, exit **0**, verified all **5,375** baseline
source/docs files and unchanged checked source hashes. Only the intended two
source modules and two local documents changed; original tracked/staged dirty
work, historical document bytes and all **98** original checkbox states/order
are preserved. Exactly one inserted prerequisite is completed; lifecycle parent
remains unchecked. Temporary local dependency symlink removed, no shared mutation.
Scoped source/contract/local-ledger/current-document/shared-ledger whitespace PIDs
**617132/617138/617139/617141/617142/617143**, exits **1/1/1/1/1/1** solely because
files differ, with **zero diagnostics**. Tracked whitespace exit **0**. Added
Markdown fragment format/check PIDs **616555/616573**, exits **0/0**, explicit empty
ignore path; historical Markdown formatting is not asserted. Receipt-appended
final preservation/whitespace audit is retained in the same artifact directory.
Tests created/executed **0/0**, images **0**; no true blocker/halt marker.
Full lifecycle/production acceptance/HOST-05 remain unfinished; Backstage stays
paused. Exit after this single prerequisite.

## HOST-02 same-account final completion recursion prerequisite (2026-10-08)

Completed exactly one bounded prerequisite inserted immediately before the first
unchecked lifecycle parent in current RELAY-IMAP-HOST-02.md. Source review traced
canonical read and mutation final completion to the shared activity method, which
previously invoked host authority without a same-account final-check marker.
Existing retained-lease and admission recursion guards did not cover this seam.
`mail-account-activity.ts` now retains a private completion controller on the
existing bounded account state, including after release pruned that state.
Recursive same-account final checks abort the outer controller and deny before
another callback/controller; caught inner denial cannot let outer completion
succeed. The marker prevents pruning through callback/cleanup/final current-state
checks and clears in finally. Existing account-state bounds, pending/settling
mutation and account/plugin/global stop checks, sequential and other-account/plugin
completion remain. Canonical mutation final failures retain their existing target
latch; read-only recursion creates no new mutation latch. Source delta +19/-3,
one existing module. No new helper/registry/store/queue/runner/public route or
production setup/plugin integration. Native adapter recursion, facade pre-admission
assertions and broader lifecycle remain separate.

Actual static checks settled exit 0 with no subsequent source edits:

- Prettier PID 619044, exit 0: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-activity.ts`.
- Strict main TypeScript PID 619045, exit 0: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- Scoped ESLint PID 619046, exit 0: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-activity.ts --max-warnings 0`.
- Tracked whitespace PID 619047, exit 0: `git diff --check`.

Source formatter PID 619031, exit 0. Static orchestration PID 619043,
tool shell session 53114, settled exit 0. Checked source hashes, exact commands,
PIDs/stdout/stderr/exits, source patch/delta and baseline are retained in
`.maestro/verification/host-02-completion-reentrancy/`. Scoped source/document
whitespace and preservation are audited separately; tracked whitespace alone
does not cover untracked source or appended Markdown.

Read-only metadata command PID 618782, exit 0:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791494465957:1791494466225:qn41j3`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791494465957`.
Registered agent 228eef8c-75a8-46e8-bb67-2903da23bc06, branch
`feat/relay-imap-host-20261006`, supplied execution/report tab
5262895a-6b3d-43fa-92cc-17449cdfa06f. Agent OS PID/provider session ID
not exposed, none invented. Running metadata is not completion. Coordinator tab
2515836c-307c-4e93-8fd0-c483b7b1ff60 is context only; no callback sent.
Headless Relay origin 1557130738971971689, requester Mira/Obsidian Codex
76fd8ebe-7346-4db0-8799-edcd03071bb2.

Baseline PID 618755, exit 0, captured 5,375 source/docs hashes, affected-file
original bytes and tracked/staged dirty patches. Existing installed dependencies
reused through a temporary worktree-local symlink only, without installation or
shared dependency mutation. Settlement receipts verify original history, dirty
work and all original checkbox states/order, plus dependency-symlink removal.
Only this inserted prerequisite is checked; the lifecycle parent stays unchecked.

Tests created/executed 0/0, images analyzed 0;
mock-tested/production-tested false/false. Synthetic regression requirements only
in this current document. No implementation/native/keyring/storage/network/mail/
server/login/real credential runtime, live Cue, callback/notice/Discord,
commit/push/PR/hooks bypass/merge/deployment. No true dependency blocker or halt
marker. Full lifecycle/public integration/production acceptance/HOST-05 remain
unfinished; Backstage stays paused. Exit after this single prerequisite.

Settlement audit PID 619419, exit 0: verified all 5,375 baseline source/docs
files, checked source hashes and preserved original tracked/staged dirty patches.
Only one intended source module and two local documents changed. Original historical
bytes and all 99 original checkbox states/order are preserved; exactly one inserted
prerequisite is complete and the lifecycle parent remains unchecked. Temporary
worktree dependency symlink removed without shared mutation. Scoped whitespace PIDs
619433/619434/619435/619436/619437, exits 1/1/1/1/1 solely because compared files
differ, with zero diagnostics; tracked whitespace exit 0. Added Markdown fragment
format/check exits 0/0 with an explicit empty ignore path. Final receipt-appended
preservation/whitespace audit is retained in the same verification directory.
Tests created/executed 0/0, images analyzed 0; no true blocker/halt marker.
Lifecycle/production acceptance/HOST-05 remain unfinished; Backstage stays paused.

## HOST-02 credential-slot operation recursion prerequisite (2026-10-08)

Completed exactly one bounded prerequisite inserted before the first unchecked
account lifecycle parent in current `RELAY-IMAP-HOST-02.md`. Actual existing slot
review found recursive/overlapping same-instance admission from authority/native
callbacks without an owner cancellation fence. `src/main/plugins/mail-credentials.ts`
now admits one transient operation before authority capture, aborts that owner and
denies nested operation work, checks caught denial around live assertions, and
closes active fixed LOGIN synchronously. Ownership survives its await and cleanup;
successful source-listener removal precedes the final live guard. Only the admitted
owner clears its fence. Source delta **+47/-4**, one existing module.
Cross-instance account queue, sealed identity/revision/grant policy and account/
plugin/global failure latches remain canonical. Already performed native mutations
cannot be rolled back; no credential cache/getter or real adapter trust is claimed.
No registry/store/queue/runner or production/public integration was added.

Final executed static checks, all settled exit 0 and no later source edits:

- prettier: PID **621813**, exit **0**; `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-credentials.ts`.
- strict-typescript: PID **621814**, exit **0**; `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- eslint: PID **621815**, exit **0**; `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-credentials.ts --max-warnings 0`.
- whitespace: PID **621816**, exit **0**; `git diff --check`.

Final source formatter PID **621802**, exit **0**. Static orchestration
PID **621800**, tool shell session **56854**, settled exit **0**.
Initial static orchestration PID **621068**, tool shell session
**35952**, exit **1**: first ESLint PID **621071**, exit **1**,
reported two `no-unsafe-finally` errors; initial Prettier/strict TypeScript/whitespace
PIDs **621069/621070/621072** each exited **0**. The cleanup check was moved
into the guarded success body, preserving failure ownership in finally, then all
four final static checks above passed. Initial source formatter PID **620925**,
exit **0**. Exact commands/PIDs/stdout/stderr/exits, source delta and checked source
hash are retained in `.maestro/verification/host-02-credential-slot-reentrancy/`.
These are static checks, not executed unit/integration tests. Tracked whitespace
covers tracked work; source/document whitespace and historical preservation are
recorded separately in the settlement receipt.

Read-only AgentRun discovery PID **620629**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791494761198:1791494761338:xvcbbh`;
exact spawned process session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791494761198`.
Registered agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, branch
`feat/relay-imap-host-20261006`, supplied execution/report tab
**5262895a-6b3d-43fa-92cc-17449cdfa06f**. Agent OS PID/provider session ID
not exposed, none invented. Coordinator report tab
**2515836c-307c-4e93-8fd0-c483b7b1ff60** is context only; no callback sent.
Headless Relay origin **1557130738971971689**, requester Mira/Obsidian Codex
**76fd8ebe-7346-4db0-8799-edcd03071bb2**. Running metadata is not completion.

Baseline PID **620602**, exit **0**, captured **5375** source/docs hashes,
affected-file/document bytes and original tracked/staged dirty patches. Existing
installed dependencies reused only via temporary worktree-local `node_modules`
symlink; no installation or shared dependency mutation. Settlement audit verifies
original source/tests/document history and checkbox order/states, only intended
changes and symlink removal. No relevant images were referenced by the selected
task or current document. Synthetic regression requirements only were recorded in
this current document; test creation/execution remain separate.

Tests created/executed **0/0**, images analyzed **0**;
mock-tested/production-tested **false/false**. No implementation/native/keyring/
storage/network/mail/server/login/real credential runtime, live Cue subscriptions,
callback/notice/Discord, commit/push/PR/hooks bypass/merge/deployment. No true
dependency blocker or halt marker. Full lifecycle/public integration/production
acceptance/HOST-05 remain unchecked; Backstage stays paused. Exit after this one
prerequisite. Related contract: [[relay-imap-host-contract-20261006]].

Settlement audit PID **622370**, exit **0**, verified all **5375**
baseline source/docs files and unchanged final checked source hash. Only one
intended source module and two local documents changed; original tracked/staged
dirty patches, historical document bytes and all **100** original checkbox
states/order are preserved. Exactly one inserted prerequisite is completed;
the lifecycle parent remains unchecked. Temporary local dependency symlink
removed without shared mutation. Scoped source/contract/local-ledger/current-
document/shared-ledger whitespace PIDs **622385/622386/622387/622388/622389**,
exits **1/1/1/1/1** solely because compared files differ, with **zero diagnostics**.
Tracked whitespace PID **622390**, exit **0**. Added Markdown fragment
format/check PIDs **622193/622359**, exits **0/0**, explicit empty ignore path;
historical Markdown formatting is not asserted. Receipt-appended final audit
retained in `.maestro/verification/host-02-credential-slot-reentrancy/`.
Tests created/executed **0/0**, images analyzed **0**; no true blocker/halt marker.
Full lifecycle/public integration/production acceptance/HOST-05 remain unfinished;
Backstage stays paused. Exit after this one prerequisite.

## HOST-02 setup facade authority assertion recursion prerequisite (2026-10-08)

Completed one bounded source prerequisite inserted immediately before the first
unchecked account lifecycle parent in the current `RELAY-IMAP-HOST-02.md`.
Existing facade setup-authority accessors/assertions ran before canonical account
admission fences. The existing wrapper now fences synchronous same-instance
capture and retained assertions with one transient private controller. Reentry
aborts its owner and denies before another source accessor/callback; checks
between capture fields and after evaluation prevent outer success after caught
inner denial. Only the owner clears its marker in finally. Source delta
**+38/-12**, one existing module, `src/main/plugins/mail-account-credentials.ts`.
No public/helper export, second registry/store/queue/runner or production adapter.
Original source/callback snapshots and canonical queue/grant/revision/cancellation/
failure latches remain required. Membership callbacks/native adapters/cross-instance
pre-admission recursion and broader lifecycle are separate; no rollback of earlier
committed/native effects or runtime security acceptance is claimed.

Executed static checks, all settled with no later source edits:

- `prettier`: PID **623532**, exit **0**; `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts`.
- `strict-typescript`: PID **623533**, exit **0**; `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- `eslint`: PID **623534**, exit **0**; `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-credentials.ts --max-warnings 0`.
- `whitespace`: PID **623535**, exit **0**; `git diff --check`.

Scoped untracked-source whitespace PID **623536**, exit **1**
solely because compared files differ, with zero diagnostics. Exact command/output
in `checks.json`. Source formatter PID **623479**, exit **0**.
Static orchestration PID **623531**, tool shell session
**12943**, settled exit **0**. Commands, PIDs, stdout/stderr/exits, source diff,
delta and checked source SHA-256 are retained in
`.maestro/verification/host-02-setup-assertion-reentrancy/`.
These are static checks; no unit/integration tests were authored or executed.

Baseline PID **623353**, exit **0**, captured **5375**
source/docs hashes, affected-file/document original bytes and tracked/staged dirty
patches. Read-only AgentRun discovery PID **623380**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791495236779:1791495236890:h3w02k`;
exact spawned process session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791495236779`.
Registered agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, branch
`feat/relay-imap-host-20261006`, supplied execution/report tab
**5262895a-6b3d-43fa-92cc-17449cdfa06f**. Agent OS PID/provider session ID not
exposed, none invented. Coordinator report tab
**2515836c-307c-4e93-8fd0-c483b7b1ff60** is context only; no callback sent.
Headless Relay origin **1557130738971971689**, requester Mira/Obsidian Codex
**76fd8ebe-7346-4db0-8799-edcd03071bb2**. Running metadata is not completion.

Existing installed dependencies were reused only through a temporary worktree-local
`node_modules` symlink, without installation/shared dependency mutation. Final
preservation/whitespace and symlink-removal results are recorded below. Synthetic
regression requirements only were added to this current document. No relevant
images were referenced by this task. Tests created/executed **0/0**, images
analyzed **0**, mock-tested/production-tested **false/false**.
No implementation/native/keyring/storage/network/mail/server/login/real credential
runtime, live Cue, callback/notice/Discord, commit/push/PR/hooks bypass/merge/deployment.
No true dependency blocker or halt marker. Full lifecycle/public integration/
production acceptance/HOST-05 remain unchecked; Backstage stays paused.
Exit after this one prerequisite. Related contract:
[[relay-imap-host-contract-20261006]].

Settlement audit PID **623993**, exit **0**, verified all **5375** baseline
source/docs files and the unchanged checked source hash. Only one intended source
module and two local documents changed. Historical bytes, tracked/staged dirty
patches and all **101** original checkbox states/order are preserved; exactly one
inserted prerequisite is checked and the lifecycle parent stays unchecked.
Temporary dependency symlink removed without shared mutation. Scoped source/
contract/local-ledger/current-document/shared-ledger whitespace PIDs
**624007/624008/624009/624010/624011**, exits **1/1/1/1/1** only for file
differences, zero diagnostics; tracked whitespace PID **624012**, exit **0**.
Added Markdown fragment check PID **623923**, exit **0**; historical formatting
is not asserted. Receipt-appended final audit retained in the same verification
directory. Tests created/executed **0/0**, images analyzed **0**; no true blocker
or halt marker. Full lifecycle/public integration/production acceptance/HOST-05
remain unfinished; Backstage stays paused. Exit after this one prerequisite.

## HOST-02 retained attachment assertion recursion prerequisite (2026-10-08)

Completed exactly one bounded source prerequisite inserted immediately before the
first unchecked lifecycle parent in current `RELAY-IMAP-HOST-02.md`. Actual existing
snapshot review found public publication-assertion recursion without an owner fence.
`src/main/plugins/mail-attachment-snapshot.ts` now guards one synchronous assertion,
closes/erases on recursive entry before another authority callback and suppresses
outer success when inner denial is caught. Only its admitted assertion clears the
transient marker; permanent closure, canonical reservation/lease cleanup and all
existing account/plugin/global latches remain unchanged. Source delta **+11/-0**,
one existing module. No new helper/store/queue/runner/timer/public/production route.
Previously returned base64 strings and labels cannot be recalled or erased.

Executed static checks, all settled; no later source edit:

- Prettier PID **625589**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-attachment-snapshot.ts`.
- Strict main TypeScript PID **625590**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- Scoped ESLint PID **625591**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-attachment-snapshot.ts --max-warnings 0`.
- Tracked whitespace PID **625592**, exit **0**: `git diff --check`.
- Scoped untracked-source whitespace PID **625593**, exit **1** only because compared files differ, with zero diagnostics: `git diff --no-index --check .maestro/verification/host-02-snapshot-assertion-reentrancy/before-0.txt src/main/plugins/mail-attachment-snapshot.ts`.

Formatter PID **625487**, exit **0**. Static orchestration PID
**625588**, tool shell session **25683**, settled exit **0**.
Source checked SHA-256 `e6c8816a4f1351045a98974cd4476182448ccdd484877fc44ec7d66411d27947`.
Exact commands/PIDs/stdout/stderr/exits and source patch are retained in
`.maestro/verification/host-02-snapshot-assertion-reentrancy/`. These are static
checks, not executed unit/integration tests. Only synthetic regression requirements
were written in the current document; test creation/execution stay separate.

Read-only metadata discovery PID **625244**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791495598109:1791495598373:un439k`;
exact spawned process session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791495598109`.
Registered agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, branch
`feat/relay-imap-host-20261006`, supplied own execution/report tab
**5262895a-6b3d-43fa-92cc-17449cdfa06f**. Agent OS PID/provider session ID
not exposed, none invented. Coordinator tab
**2515836c-307c-4e93-8fd0-c483b7b1ff60** is context only; no callback sent.
Headless Relay origin **1557130738971971689**, requester Mira/Obsidian Codex
**76fd8ebe-7346-4db0-8799-edcd03071bb2**. Running metadata is not completion.

Baseline PID **625205**, exit **0**, captured **5375** source/docs hashes,
affected files/document bytes and original tracked/staged dirty patches. Installed
local dependencies reused solely via a temporary worktree-local `node_modules`
symlink, no installation or shared mutation. Contract and both ledgers updated;
settlement preservation and scoped document-whitespace audit follows below.
No relevant images are associated with this task; images analyzed **0**.

Tests created/executed **0/0**; mock-tested/production-tested **false/false**.
No implementation/native/keyring/storage/network/mail/server/login/real credential
runtime, live Cue subscription, callback/notice/Discord, commit/push/PR/hooks bypass/
merge/deployment. No true dependency blocker or halt marker. Full lifecycle/public
integration/production acceptance/HOST-05 remain unchecked; Backstage stays paused.
Exit after this one prerequisite. Related contract:
[[relay-imap-host-contract-20261006]].

Settlement audit PID **626925**, exit **0**, verified all **5375** baseline
source/docs files and the unchanged checked source hash. Only the intended source
module and two local documents changed; tracked/staged dirty patches, historical
document bytes and all **102** original checkbox states/order are preserved.
Exactly one inserted prerequisite is completed; the lifecycle parent remains
unchecked. Temporary dependency symlink removed without shared mutation.
Scoped source/contract/local-ledger/current-document/shared-ledger whitespace PIDs
**626952/626953/626954/626955/626956**, exits **1/1/1/1/1** only for file
differences, zero diagnostics. Tracked whitespace PID **626968**, exit **0**.
Added Markdown fragment check PID **626957**, exit **0**; historical document
formatting is not asserted. Initial audit stopped on a fragment-format check:
the verification copy included its intentional inter-document blank separator.
Reproduced fragment check PID **626890**, exit **1**, isolated that trailing blank;
a standalone fragment without the separator then passed. The inserted document
separator and checked source were unchanged. The initial failed audit did not
retain its formatter PID, and none is invented. Final receipt-appended audit
is retained in `.maestro/verification/host-02-snapshot-assertion-reentrancy/`.
Tests created/executed **0/0**, images analyzed **0**; no true blocker/halt marker.
Full lifecycle/public integration/production acceptance/HOST-05 remain unfinished;
Backstage stays paused. Exit after this single prerequisite.

## HOST-02 run-proof issuance recursion prerequisite (2026-10-08)

Completed exactly one bounded source prerequisite inserted immediately before the
first unchecked account lifecycle parent in current `RELAY-IMAP-HOST-02.md`.
Actual existing issuer review found initial authority/membership callbacks outside
the retained proof guard. `src/main/plugins/plugin-tool-run-identity.ts` now retains
one transient issuance owner before authority capture. Nested same-registry `issue()`
cancels it and denies before another capture/allocation; admission gates suppress
outer proof return even if nested denial is caught. Ownership covers pruning,
registration, final retained checks and failed-proof cleanup. Only the admitted
owner clears it. Canonical proof removal, registry limits, sequential issuance,
independent registries, existing proofs/invocations, expiry and live stop/revoke gates
remain. Source delta **+23/-5**, one existing source module. No new exported helper,
registry/store/queue/runner/public/production route or timer. Nested invocation
issuance and facade/policy recursion remain separate. Static/source evidence only.

Executed static checks, all settled; no later source edit:

- prettier: PID **627774**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-tool-run-identity.ts`.
- strict-typescript: PID **627775**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- eslint: PID **627777**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/plugin-tool-run-identity.ts --max-warnings 0`.
- whitespace: PID **627780**, exit **0**: `git diff --check`.
- scoped-source-whitespace: PID **627779**, exit **1**: `git diff --no-index --check .maestro/verification/host-02-run-issuance-reentrancy/before-0.txt src/main/plugins/plugin-tool-run-identity.ts`.

Scoped untracked-source whitespace exit 1 means files differ; stdout/stderr have
zero diagnostics. Tracked whitespace exit 0 covers tracked patches only. Source
formatter PID **627760**, exit **0**. Static orchestration PID **627759**;
individual child exit receipts above are retained. Its tool-shell session ID and
orchestration exit were not retained, none invented. Checked source SHA-256
`5018b93f64eac7a54e6d7181d61c7f213bfef6d89eff1f9ee4128470bdae6197`. Exact commands/PIDs/stdout/stderr/exits and source patch
are retained in `.maestro/verification/host-02-run-issuance-reentrancy/`.

Read-only metadata discovery PID **627688**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791495899935:1791495900135:bdhrcf`;
exact spawned process session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791495899935`.

Registered agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, branch
`feat/relay-imap-host-20261006`, supplied own execution/report tab
**5262895a-6b3d-43fa-92cc-17449cdfa06f**. Agent OS PID/provider session ID
not exposed, none invented. Running metadata is not completion. Coordinator tab
**2515836c-307c-4e93-8fd0-c483b7b1ff60** is context only; no callback sent.
Headless Relay origin **1557130738971971689**, requester Mira/Obsidian Codex
**76fd8ebe-7346-4db0-8799-edcd03071bb2**.

Baseline PID **627660**, exit **0**, captured **5375** source/docs hashes,
affected files/documents and original tracked/staged dirty patches. Installed
local dependencies reused solely via a temporary worktree-local `node_modules`
symlink, with no installation/shared mutation. Contract and both evidence ledgers
updated; final settlement audits preserve source/docs history, original boxes and
dirty patches and remove the dependency symlink. No relevant task images.

Tests created/executed **0/0**, images analyzed **0**;
mock-tested/production-tested **false/false**. Synthetic requirements only were
recorded in this current document. No implementation/native/keyring/storage/network/
mail/server/login/real credential runtime, live Cue subscriptions, callback/notice/
Discord, commit/push/PR/hooks bypass/merge/deployment. No true dependency blocker
or halt marker. Full lifecycle/public integration/production acceptance/HOST-05
remain unchecked; Backstage stays paused. Exit after this one prerequisite.
Related contract: [[relay-imap-host-contract-20261006]].

Settlement audit PID **628094**, exit **0**, verified all **5375** baseline
source/docs hashes and unchanged checked source. Only one intended source module
and two local documents changed; original tracked/staged dirty patches, historical
document bytes and all **103** original checkbox states/order are preserved.
Exactly the inserted prerequisite is now checked; the lifecycle parent remains
unchecked. Temporary dependency symlink removed without shared dependency mutation.
Scoped source/contract/local-ledger/current-document/shared-ledger whitespace PIDs
**628111/628112/628113/628114/628115**, exits **1/1/1/1/1** solely for compared
file differences, zero diagnostics. Added Markdown fragment formatter/check PIDs
**628033/628049**, exits **0/0**, explicit empty ignore path; historical formatting
is not asserted. Receipt-appended final audit is retained in
`.maestro/verification/host-02-run-issuance-reentrancy/`. Tests created/executed **0/0**,
images analyzed **0**, no true dependency blocker or halt marker. Full lifecycle/
production acceptance/HOST-05 remain unfinished; Backstage stays paused.
Exit after this single prerequisite.

## HOST-02 invocation-handle issuance recursion prerequisite (2026-10-08)

Completed exactly one bounded source prerequisite inserted immediately before the
current first unchecked account lifecycle parent. Existing initial plugin authority
ran before retained invocation protection. `plugin-tool-run-identity.ts` now retains
one transient invocation issuance owner before context validation/authority capture.
Same-registry nested issuance cancels it and denies before another authority capture
or handle allocation; caught nested denial prevents outer handle return. Ownership
covers admission, expiry pruning, registration, final checks and failed-handle
cleanup. Original exact contexts/plugin lifetimes, bounds, expiry, live run/agent/
source/stop/revoke checks and shared listener accounting remain. No second registry,
store/queue/runner, exported helper, timer or public/production route.
Source delta **+17/-0**, one existing source module. Static evidence only; final
retained callbacks may finish before the following cancellation gate observes denial.
Facade/policy/native adapter recursion and production issuance remain separate.

Actual static commands, child PIDs and settled exits:

- Source formatting, PID **628935**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-tool-run-identity.ts`.
- Prettier, PID **628969**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-tool-run-identity.ts`.
- Strict TypeScript, PID **628968**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- Scoped ESLint, PID **628994**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/plugin-tool-run-identity.ts --max-warnings 0`.
- Tracked whitespace, PID **628981**, exit **0**: `git diff --check`.
- Scoped source whitespace, PID **628983**, exit **1**: `git diff --no-index --check .maestro/verification/host-02-invocation-issuance-reentrancy/before-0.txt src/main/plugins/plugin-tool-run-identity.ts`.

Scoped source exit 1 means files differ; stdout/stderr have zero diagnostics.
Strict TypeScript/ESLint tool-shell sessions **35163/72173**, both settled exit **0**.
No pending static process. Source SHA-256
`49874bb064fd678675181087f4aa8f66bf53b01918062136018b4f3356260236`.
Exact commands/PIDs/exits/stdout/stderr and patch retained in
`.maestro/verification/host-02-invocation-issuance-reentrancy/`.

Read-only metadata discovery PID **628793**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791496171383:1791496171707:xwjdbz`;
exact spawned process session
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791496171383`.
Registered agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, branch
`feat/relay-imap-host-20261006`, supplied execution/report tab
**5262895a-6b3d-43fa-92cc-17449cdfa06f**. Agent OS PID/provider session ID
not exposed, none invented. Running metadata is not completion. Coordinator tab
**2515836c-307c-4e93-8fd0-c483b7b1ff60** is context only, no callback sent.
Headless Relay origin **1557130738971971689**, requester Mira/Obsidian Codex
**76fd8ebe-7346-4db0-8799-edcd03071bb2**.

Baseline PID **628761**, exit **0**, captured **5375** source/docs hashes,
affected file/document bytes and tracked/staged dirty patches. Installed dependencies
reused only through a temporary worktree-local `node_modules` symlink; no installation
or shared dependency mutation. Contract, local ledger, current document and concise
shared ledger updated. Final preservation/whitespace/symlink-removal audit follows.

Tests created/executed **0/0**, images analyzed **0**; mock-tested/production-tested
**false/false**. No relevant task images. Synthetic regression requirements only;
no implementation/native/keyring/storage/network/mail/server/login/real credential
runtime, live Cue, callback/notice/Discord, commit/push/PR/hooks bypass/merge/deployment.
No true dependency blocker or halt marker. Full lifecycle/public integration/
production acceptance/HOST-05 remain unchecked; Backstage stays paused.
Exit after this one prerequisite. Related contract: [[relay-imap-host-contract-20261006]].

Settlement audit PID **629348**, exit **0**, verified all **5375** baseline
source/docs hashes and the unchanged statically checked source. Only the intended
source module and two local documents changed; original tracked/staged dirty
patches, historical document bytes and all **104** original checkbox states/order
are preserved. Exactly one inserted prerequisite is checked; the lifecycle parent
remains unchecked. Temporary local dependency symlink removed without shared
mutation. Scoped source/contract/local-ledger/current-document/shared-ledger
whitespace PIDs **629373/629374/629375/629376/629377**, exits **1/1/1/1/1**
solely for file differences, zero diagnostics. Added Markdown fragment formatter/
check PIDs **629206/629217**, exits **0/0**; historical formatting not asserted.
Exact receipts/commands in `.maestro/verification/host-02-invocation-issuance-reentrancy/`;
receipt-appended final audit retained there. Tests created/executed **0/0**, images
analyzed **0**; no true dependency blocker/halt marker. Full lifecycle/public
integration/production acceptance/HOST-05 remain unfinished, Backstage paused.
Exit after this single prerequisite.

## HOST-02 pending exact-agent run admission revocation (2026-10-08)

Completed exactly one source prerequisite inserted immediately before the current
first unchecked account lifecycle parent. Existing `revokeAgent()` only examined
registered proofs and could miss pending `issue()` authority/membership admission.
`src/main/plugins/plugin-tool-run-identity.ts` now binds the existing transient owner
to the validated exact agent and cancels matching admission before retained-proof
abort callbacks, including zero registered proofs. Existing admission/recursion/live
checks suppress the outer proof and retain cancellation through failed cleanup.
Different agents/registries, canonical removal, original bounds/expiry and later
fresh issuance remain. No permanent agent tombstone or new registry/store/queue/
runner/timer/export/public/production route. Source delta **+12/-5**, one module.
Static/source evidence only; deferred synthetic requirements are in this document.

Settled static commands and exact child processes:

- format: PID **630192**, exit **0**, `node node_modules/prettier/bin/prettier.cjs --write src/main/plugins/plugin-tool-run-identity.ts`.
- prettier: PID **630205**, exit **0**, `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/plugin-tool-run-identity.ts`.
- strict-typescript: PID **630206**, exit **0**, `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- eslint: PID **630207**, exit **0**, `node node_modules/eslint/bin/eslint.js src/main/plugins/plugin-tool-run-identity.ts --max-warnings 0`.
- tracked-whitespace: PID **630208**, exit **0**, `git diff --check`.
- source-whitespace: PID **630209**, exit **1**, `git diff --no-index --check /home/chris/code/worktrees/feat/relay-imap-host-20261006/.maestro/verification/host-02-pending-agent-revocation/before-0.txt src/main/plugins/plugin-tool-run-identity.ts`.

Scoped untracked-source whitespace exit **1** means compared files differ, with
zero stdout/stderr diagnostics. Tracked whitespace exit **0** covers tracked patches.
Static orchestration PID **630203**, tool-shell session **31254**, settled exit **0**.
Checked source SHA-256 `b519e1e2849d00d70fbf491ec0e6ff4a917f482fbda2d0b71f8485a32229a328`.
Exact receipts and patch: `.maestro/verification/host-02-pending-agent-revocation/`.
No pending checker or later source edits.

Read-only own-run metadata discovery PID **629988**, exit **0**, command
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Retained metadata projection excludes prompts and other agents.
Observed AgentRun **run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791496501380:1791496501597:62t5qr**;
spawned process session **228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791496501380**.
Registered agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, branch
`feat/relay-imap-host-20261006`, supplied execution/report tab
**5262895a-6b3d-43fa-92cc-17449cdfa06f**. Agent OS PID/provider session ID
not exposed, none invented. Running metadata is not completion. Coordinator tab
**2515836c-307c-4e93-8fd0-c483b7b1ff60** is context only; no callback sent.
Headless origin **1557130738971971689**, requester Mira/Obsidian Codex
**76fd8ebe-7346-4db0-8799-edcd03071bb2**.

Baseline PID **629958**, exit **0**, captured **5375** source/docs hashes,
affected file/document bytes and original tracked/staged dirty patches.
Installed dependencies reused solely through a temporary worktree-local symlink;
no installation or shared mutation. Contract/current document/local and shared
ledgers updated; final preservation/document whitespace audit recorded below.
Tests created/executed **0/0**, images analyzed **0**; no task images.
Mock-tested/production-tested **false/false**. No implementation/native/keyring/
storage/network/mail/server/login/real credential runtime, live Cue, callback/
notice/Discord, commit/push/PR/hooks bypass/merge/deployment. No true dependency
blocker or halt marker. Full lifecycle/production acceptance/HOST-05 unchecked;
Backstage paused. Exit after this single prerequisite.
Related contract: [[relay-imap-host-contract-20261006]].

Settlement audits PIDs **630802/630833**, exits **0/0**, verified all **5375**
baseline source/docs hashes, unchanged checked source, historical document bytes,
original tracked/staged dirty patches and all **105** original checkbox states/order.
Exactly one inserted prerequisite is now checked; the lifecycle parent is unchecked.
Only the intended source module and two local documents changed. Temporary local
dependency symlink removed without shared mutation. Added Markdown fragment formatter/
check PIDs **630469/630480**, exits **0/0**; historical formatting not asserted.
Final receipt-appended preservation and scoped whitespace receipts are retained in
`.maestro/verification/host-02-pending-agent-revocation/` in the registered worktree.
Completion spans **2026-10-08 UTC / 2026-10-09 Europe/Berlin** (observed UTC clock
**2026-10-08 22:00:26**); earlier task headings retain the admission date.
Tests created/executed **0/0**, images analyzed **0**, no true dependency blocker or
halt marker. Full lifecycle/public integration/production acceptance/HOST-05 remain
unfinished; Backstage paused. Exit after this single prerequisite.

## HOST-02 resolved read-policy assertion reentrancy prerequisite (2026-10-09)

Completed exactly one inserted source prerequisite before the oversized first
unchecked account lifecycle parent in current
`2026-10-06-Relay-Imap-Host/RELAY-IMAP-HOST-02.md`. Existing private resolver had
completed registry checking before invoking its captured policy callback, allowing
same-authority recursive policy assertion. Added a local checking fence and failure
latch to the existing returned assertion, with latch checks across callback-capable
work. Recursive/failed authority cannot recover after caught denial. No global
revocation, new public or production policy/setup/caller path, second store/runner,
controller/timer/listener, runtime acceptance or integration readiness is supplied.
Source delta **+38/-17**, one existing untracked module. Actual diff, source hash,
baseline file hashes, original tracked/staged patches and static receipts are under
`.maestro/verification/host-02-read-policy-reentrancy/` in the registered worktree.
Contract appended; historical bytes preserved. Deferred synthetic regression
requirements only were recorded in the current document.

Static checks (not tests):

| Command                                                                                                        | PID    | Exit | Result                                                |
| -------------------------------------------------------------------------------------------------------------- | ------ | ---- | ----------------------------------------------------- |
| `node node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-invocation-read-authority.ts`       | 631822 | 0    | Source formatted                                      |
| `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-invocation-read-authority.ts`       | 631834 | 0    | Source format passes                                  |
| `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true` | 631835 | 0    | Strict main-process static typing passes              |
| `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-invocation-read-authority.ts --max-warnings 0`   | 631836 | 0    | Scoped ESLint passes                                  |
| `git diff --check`                                                                                             | 631837 | 0    | Existing tracked dirty patch has no whitespace errors |
| `git diff --no-index --check <baseline-source> src/main/plugins/mail-invocation-read-authority.ts`             | 631838 | 1    | Files differ; no whitespace diagnostics               |

Static orchestrator PID **631820**. Baseline capture PID **631692** covered **5589**
original files; task insertion PID **631810** retained all **106** original checkbox
states/order. AgentRun lookup
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`
PID **631720**, exit **0**; retained receipt projects only own run metadata and omits
prompts/other agents. Observed running AgentRun:
`run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791496891814:1791496891920:xhpjc0`.
Observed process-session ID:
`228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791496891814`.
These identify admission/running execution, not completion evidence.
Registered execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, branch
`feat/relay-imap-host-20261006`, cwd
`/home/chris/code/worktrees/feat/relay-imap-host-20261006`.
Prompt-supplied execution/conversation tab **5262895a-6b3d-43fa-92cc-17449cdfa06f**;
coordinator report tab **2515836c-307c-4e93-8fd0-c483b7b1ff60** was not contacted.
Headless origin **1557130738971971689** has no callback tab; requester
Mira/Obsidian Codex **76fd8ebe-7346-4db0-8799-edcd03071bb2**. No callback, dispatch or
notice sent; this execution response and evidence provide the report.

Tests authored/executed **0/0**, images analyzed **0**. Implemented/static checked
only; mock-tested and production-tested **false**. Only installed local dependencies
were read through a temporary worktree-local symlink; no installation or shared
mutation. No implementation/native/keyring/storage/network/mail/server/login/real
credential runtime, live Cue subscriptions, plugin implementation/integration/
installation, commit/push/PR/hooks bypass/upstream merge or deployment. No true
dependency blocker and no halt marker. Full lifecycle/public/production acceptance
and HOST-05 remain unchecked; Backstage remains paused. Exit after this one task.
See [[relay-imap-host-contract-20261006]], [[CLAUDE-PLUGINS]] and [[CLAUDE-CUE]].

## HOST-02 resolved policy assertion settlement receipt (2026-10-09)

Preservation audit PID **632215**, exit **0**, verified all **5589** original files,
unchanged tracked/staged dirty patches and all **106** original checkbox states/order;
only the intended source module and two local documents changed. Checked source hash
matches the static-check receipt. Temporary local dependency symlink removed with no
shared mutation. Added Markdown-fragment formatter/check PIDs **632136/632147**,
exits **0/0**; historical document formatting was not asserted. Scoped final source/
contract/local-evidence/current-document/shared-evidence whitespace PIDs
**632158/632159/632160/632161/632162**, all exits **1** solely because files differ,
with empty diagnostic streams. Completion edit PID **632269** marks exactly
the inserted prerequisite complete; the full lifecycle parent and other original
checkboxes remain unchanged. Final completion/preservation receipts are retained in
`.maestro/verification/host-02-read-policy-reentrancy/` in registered worktree.
Tests created/executed **0/0**, images **0**, no true blocker or halt marker. Full
lifecycle/production acceptance/HOST-05 unfinished; Backstage remains paused.
Exit after this one prerequisite.

## HOST-02 single-task grant-membership assertion receipt (2026-10-09)

Completed one bounded source prerequisite inserted immediately before the first
unchecked oversized account lifecycle parent in the current HOST-02 document.
`MailAccountCredentials` now captures the mandatory original bound membership
callback and evaluates the closed grant snapshot under its existing setup-assertion
owner. Caught same-facade recursive denial prevents outer success, further callbacks
and pre-admission queue/native work. Original callback order, empty-rights clearing,
signal, exact independent rights, canonical queues and failure latches remain.
Source delta **+32/-14**, one existing source module; static/source evidence only.
No new helper/export/registry/store/queue/runner or production/public integration.

Actual executed static checks (all settled; no later source edit):

- format: PID **634585**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-credentials.ts`.
- prettier: PID **634663**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts`.
- strict-typescript: PID **634660**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- eslint: PID **634662**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-credentials.ts --max-warnings 0`.
- tracked-whitespace: PID **634661**, exit **0**: `git diff --check`.
- source-whitespace: PID **634659**, exit **1**: `git diff --no-index --check /home/chris/code/worktrees/feat/relay-imap-host-20261006/.maestro/verification/host-02-grant-membership-reentrancy/before-0.txt src/main/plugins/mail-account-credentials.ts`.

Scoped whitespace exit 1 is solely compared-file differences; stdout/stderr are
empty. Tracked whitespace covers tracked patches only. Static orchestration PID
**634653**, tool-shell session **37066**, settled exit **0**. Source SHA-256
`8f3e3f98205d59f7e5e453becdc08b231710cdf84374bcebdf94aa41e839e9db`. Exact commands/PIDs/exits/output,
source patch and preservation baseline are retained under
`.maestro/verification/host-02-grant-membership-reentrancy/` in this worktree.

Read-only AgentRun metadata query PID **633815**, exit **0**:
`node /opt/Maestro/resources/maestro-cli.js agent-run list --status running --limit 12 --json`.
Observed AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791497251481:1791497251793:te3vfu`;
exact spawned process session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791497251481`.
Registered execution agent **228eef8c-75a8-46e8-bb67-2903da23bc06**, branch
`feat/relay-imap-host-20261006`, supplied execution/report tab
**5262895a-6b3d-43fa-92cc-17449cdfa06f**. Agent OS PID/provider session ID
not exposed, none invented. Running discovery is not task completion. Coordinator
report tab **2515836c-307c-4e93-8fd0-c483b7b1ff60** is context only, no callback.
Headless Relay origin **1557130738971971689**, requester Mira/Obsidian Codex
**76fd8ebe-7346-4db0-8799-edcd03071bb2**; no callback tab exists.

Baseline PID **633338**, exit **0**, captured **5375** source/docs hashes and all
**107** original checkbox states, original tracked/staged dirty patches and exact
source/document bytes. Existing installed dependencies reused solely via a temporary
worktree-local `node_modules` symlink; no install or shared dependency mutation.
Contract, local/shared evidence and current document updated; preservation audit
and dependency-symlink cleanup follow before completion.

Tests created/executed **0/0**, images analyzed **0**; mock-tested/production-tested
**false/false**. No relevant task images. Deferred actual synthetic regression
requirements recorded only, no implementation/native/keyring/storage/network/mail/
server/login/real credential runtime, live Cue, callback/notice/Discord, commit/push/
PR/hooks bypass/merge/deployment. No true dependency blocker or halt marker.
Full lifecycle/public integration/production acceptance/HOST-05 remain unfinished;
Backstage stays paused. Exit after this single prerequisite.
Related contract: [[relay-imap-host-contract-20261006]].

## HOST-02 grant-membership settlement receipt (2026-10-09)

Preservation audit PID **635337**, exit **0**, verified all **5375** baseline
source/docs hashes, unchanged statically checked source, historical document bytes,
original tracked/staged dirty patches and all **107** original checkbox states/order.
Only the intended source module and two local documents changed. Scoped final
source/contract/local-evidence/current-document/shared-evidence whitespace PIDs
**635355/635357/635358/635360/635361**, exits **1/1/1/1/1** solely for compared
file differences, zero diagnostics. Added Markdown fragment formatter/check PIDs
**635129/635140**, exits **0/0**; historical document formatting not asserted.
Temporary local dependency symlink removed without shared dependency mutation.
Exactly the inserted prerequisite is checked by completion edit PID **635537**;
the lifecycle parent and all original boxes remain unchanged. Receipt-appended final
completion/preservation audit is retained in
`.maestro/verification/host-02-grant-membership-reentrancy/completed-audit.json`.
Tests created/executed **0/0**, images analyzed **0**, no true dependency blocker or
halt marker. Full lifecycle/public integration/production acceptance/HOST-05 remain
unfinished; Backstage stays paused. Exit after this one prerequisite.

## HOST-02 trusted stored-account settings review receipt (2026-10-09)

Completed exactly one bounded prerequisite inserted immediately before the oversized
first unchecked lifecycle task in current `RELAY-IMAP-HOST-02.md`. Code change:
`src/main/plugins/mail-account-credentials.ts`, **+34/-0**, one source module.
Added synchronous private `readStoredAccountSettings` using canonical target,
settings and sealed configuration validators and existing setup authority guard.
It returns a fresh frozen settings copy only after original live authority,
configuration equality and final cancellation checks. Enabled/disabled and
terminal-revision review is permitted; no credential or readiness probing occurs.
No new parser, store, queue, runner, public surface or production integration.

Actual executed static checks (settled, no later source edit):

- `format`: PID **637058**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --write src/main/plugins/mail-account-credentials.ts`.
- `prettier`: PID **637078**, exit **0**: `node node_modules/prettier/bin/prettier.cjs --check src/main/plugins/mail-account-credentials.ts`.
- `strict-typescript`: PID **637084**, exit **0**: `node node_modules/typescript/bin/tsc --project tsconfig.main.json --noEmit --incremental false --strict true`.
- `eslint`: PID **637103**, exit **0**: `node node_modules/eslint/bin/eslint.js src/main/plugins/mail-account-credentials.ts --max-warnings 0`.
- `tracked-whitespace`: PID **637085**, exit **0**: `git diff --check`.
- `source-whitespace`: PID **637091**, exit **1**: `git diff --no-index --check .maestro/verification/host-02-stored-settings-review/before-0.txt src/main/plugins/mail-account-credentials.ts`.

Scoped no-index whitespace exit 1 means compared-file differences only; output is
empty, no whitespace diagnostics. Tracked whitespace covers existing tracked dirty
patches only. Tool-shell sessions **74288** and **51780** (scoped ESLint and strict main
TypeScript checks) both settled exit **0**; session-to-check mapping was not retained. Exact commands/PIDs/exits/output, baseline and
source patch: `.maestro/verification/host-02-stored-settings-review/` in this worktree.
Source SHA-256 `4c90e6126427070c64bb244b7f7175e90a7554e110ff5132f847a4e5af61142f`.

AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791497567829:1791497568444:jilozo`; exact spawned process session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791497567829`.
Registered execution agent `228eef8c-75a8-46e8-bb67-2903da23bc06`, branch
`feat/relay-imap-host-20261006`; supplied execution/report tab
`5262895a-6b3d-43fa-92cc-17449cdfa06f`. Read-only metadata query PID
**636850**, exit **0**. Agent OS PID/provider session ID not
exposed, none invented. Coordinator report tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` is context only; no callback.
Headless Relay origin `1557130738971971689`, requester Mira/Obsidian Codex
`76fd8ebe-7346-4db0-8799-edcd03071bb2`; no callback tab exists.

Baseline PID **636813**, exit **0**, captured **5375** source/docs hashes, all
**108** original checkbox states/order, original tracked/staged patches and exact
source/document bytes. Contract/local/shared evidence/current document updated;
final preservation/whitespace audit and temporary local dependency symlink cleanup
are recorded separately below. Only existing installed dependencies were reused;
no installation or shared dependency mutation.

Tests created/executed **0/0**, images analyzed **0**; no relevant task images.
Mock-tested/production-tested **false/false**. Deferred synthetic test requirements
cover exact target/identity/revision, immutable closed copies, absent/stale/foreign/
removed state, authority capture/recursion/async denial, cancellation at final sealed
reads and configuration changes. Requirements only, not authored or executed tests.
No implementation/native/keyring/storage/mail/network/server/login/real credential
runtime, live Cue, callback/notice/Discord, commit/push/PR/hooks bypass/merge/deploy.
No true dependency blocker or halt marker. Full lifecycle/public integration/
production acceptance/HOST-05 remain unfinished, plugin owner Backstage paused.
Exit after this one prerequisite. Related: [[relay-imap-host-contract-20261006]].

## HOST-02 trusted settings review settlement (2026-10-09)

Preservation audit PID **637710**, exit **0**, verified **5375** baseline
source/docs hashes, unchanged checked source, historical document bytes, original
tracked/staged dirty patches and all **108** original checkbox states/order. Only
the intended source module and two local documents changed. Scoped contract/local
ledger/current-document/shared-ledger whitespace PIDs
**637743/637744/637745/637746**, exits **1/1/1/1** solely for file differences,
zero diagnostics. Added Markdown fragments were explicitly formatted/checked
with `--ignore-path /dev/null`, PIDs **637552/637564**, exits **0/0**; historical
formatting is not asserted. Commands and output are retained in the receipt directory.

Completion edit PID **637790**, exit **0**, removed only this task's temporary
worktree-local `node_modules` symlink and checked only the inserted settings-review
prerequisite. Full lifecycle and all original boxes remain unchanged. Final
receipt-appended preservation/whitespace evidence is retained under
`.maestro/verification/host-02-stored-settings-review/`, including
`completed-audit.json` and the `final-*-whitespace.json` command receipts.
Tests created/executed **0/0**, images analyzed **0**. No true blocker/halt marker.
Full lifecycle/public integration/production acceptance/HOST-05 remain unfinished;
Backstage remains paused. Exit after this one prerequisite.

## HOST-02 disk-space halt (2026-10-09)

First unchecked lifecycle reviewed; no source change, prerequisite insertion or
completion. Baseline mkdir failed ENOSPC; /dev/sda2 116G, 110G used, 0
available, 100% use; inodes 31%. Append size preflights exited 1, no writes.
`git diff --check` PID 639010 exit 0, no diagnostics. Format/type/lint not run.
Tests created/executed 0/0; images analyzed 0. Metadata query PID 638895 exit 0.
AgentRun `run:228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791497956756:1791497956870:y4iy6h`;
process-session `228eef8c-75a8-46e8-bb67-2903da23bc06-batch-1791497956756`.
Agent `228eef8c-75a8-46e8-bb67-2903da23bc06`, branch
`feat/relay-imap-host-20261006`, report tab `5262895a-6b3d-43fa-92cc-17449cdfa06f`.
Agent OS/provider PID unavailable; running is not completion. Coordinator tab
`2515836c-307c-4e93-8fd0-c483b7b1ff60` not contacted. Append/audit PID 639489.
Original source, all boxes and tracked/staged patches preserved; no deletions.
No dependency/runtime/native/network/mail/credential/Cue/callback/notice/Discord
or git publication. Lifecycle/production acceptance/HOST-05 unfinished; Backstage
paused. Resume needs disk space and halt-marker removal. Exit after this task.
