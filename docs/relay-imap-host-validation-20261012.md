# IMAP host continuation validation

The implemented contract is [Host API 1.26.0 / SDK 0.20.0](relay-imap-host-contract-20261012.md). Canonical checkout `/home/chris/code/Maestro` was inspected read-only at RC `4751ef9aa498d85d53fa984df7d97acbf456cd86`; its source and dependency tree were left unchanged. The registered worktree is `/home/chris/code/worktrees/feat/relay-imap-host-20261006`, branch `feat/relay-imap-host-20261006`.

## Preserved work and implementation

- `593db36af` preserves the pre-existing transport, MIME, authorization and private preparation foundation, including historical evidence.
- `4f3e2092d` reconciles the canonical RC and implements the callable SDK/RPC, exact-account broker permissions, trusted setup, native-keyring composition, verified invocation lifetimes, attachments and host-owned Cue source.
- `5941401aa`, `b532f3319`, `a68ff28d9`, `aba80a966` and `026e9a19a` cover anchored migration/CLI compatibility, durable fan-out admission, Cue catalog regression coverage, signed output-phase metadata and preservation of canonical Relay authorization errors.

The continued session began at `026e9a19a` with a clean worktree. No original checked task was reset or removed. Historical planning documents retain their original unchecked entries; their proposed signatures and micro-task execution restrictions are superseded by Chris's 2026-10-12 continuation authorization and the implemented contract. Synthetic verification establishes the current bounded implementation, not every historical proposal.

## Settled synthetic evidence

Existing dependencies are reused through a worktree-local `node_modules` symlink. Caches, generated builds and test temporary files stay in the worktree. TLS, credentials, native keyring and authorization persistence are injected synthetic fixtures. Tests do not fetch real mailbox credentials or perform real mail/provider traffic.

| Validation                                                                        | Result                             | Worktree log                                              |
| --------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------- |
| Fresh complete Cue/shared-Cue plus mail service/setup/verified sandbox invocation | 104 files, 2,157 passed, 2 skipped | `.maestro/imap-continuation/resumed-contract-tests.log`   |
| Fresh standalone SDK runtime/packed-copy/drift/type parity                        | 3 files, 36 passed, no type errors | `.maestro/imap-continuation/resumed-sdk-tests.log`        |
| Transport, framing, fixed commands, MIME/charset/encoding and mail authority      | 10 files, 860 passed               | `.maestro/imap-continuation/mail-verified-tests.log`      |
| Actual VM/RPC bridge and durable Cue admission                                    | 4 files, 137 passed                | `.maestro/imap-continuation/rpc-durable-tests.log`        |
| Canonical Relay MCP and short Unix-socket regressions                             | 3 files, 339 passed                | `.maestro/imap-continuation/relay-socket-gates-tests.log` |

Counts overlap and are not a unique-test total. All listed runs settled successfully. Earlier failed or interrupted logs remain intact; they are not used as passing receipts.

Fresh command lines, executed from the worktree (SDK command from `packages/plugin-sdk`):

```bash
TMPDIR="$PWD/.t" node node_modules/vitest/vitest.mjs run --configLoader runner src/__tests__/main/plugins/mail-host-service.test.ts src/__tests__/main/plugins/mail-setup-window.test.ts src/__tests__/main/plugins/mail-setup-confirmation.test.ts src/__tests__/main/plugins/plugin-sandbox-host-invoke-tool.test.ts src/__tests__/main/cue src/__tests__/shared/cue --reporter=dot
TMPDIR="$PWD/.t" node ../../node_modules/vitest/vitest.mjs run --configLoader runner --typecheck --reporter=dot
```

The normal pre-push hook must finish `npm run validate:push`: repository-wide formatting, renderer/main/CLI TypeScript, ESLint and the complete default test suite. Its settled result and PR URL belong in the PR evidence and shared continuation ledger; starting that hook is not a successful gate. The exact push receipt is `.maestro/imap-continuation/resumed-push.log`.

The complete gate uses the existing Node **22.22.1** toolchain, matching CI's Node 22 configuration. An initial Node 25 gate was stopped after its experimental storage globals caused 74 failures in `AutoRunDocumentSelector.test.tsx`; the identical file passes all 86 tests under Node 22. The focused differential receipt is `.maestro/imap-continuation/node22-storage-repro.log`. Application code was unchanged for this environment correction. An earlier push's idle SSH connection closed during validation; the final atomic push uses per-command keepalives and publishes both the feature and a review base pinned to canonical RC, leaving the fork's old `rc` unchanged.

## Review and rollout limits

Production plugin integration remains gated on the committed complete contract, passing repository gates and review. No plugin installation, Maestro restart, consent/settings change, live subscription or Discord reporting is authorized or performed. Packaged desktop UX and live mailbox compatibility remain unverified.

Mail rights are independent, exactly account-scoped and bound to verified caller/plugin lifetimes. Credentials stay in the host-owned native keyring. Unsupported IMAP/MIME forms fail closed with bounded errors. Delivery is at least once across crashes; a partially admitted fan-out can repeat accepted targets on retry. Authorization persistence moves anchored v1 state to v2 with empty mail rights; older binaries may require re-consent. Existing private prepared-run proof resources remain separate from the canonical production caller issuer.

Progress and final evidence are delivered only by background queued desktop dispatch to owner agent `0af39dab-3c06-40de-9077-99207660c1e9`, tab `4e66d8fe-9748-4a44-bfb1-65459322ad10`; final interface handoff also targets Backstage agent `78582d73-395d-4839-a62d-e903f0f1cecc`, tab `5461a629-0304-4f8c-a7ae-343a3dfb788e`. Reporting does not authorize plugin integration or launch another Auto Run.
