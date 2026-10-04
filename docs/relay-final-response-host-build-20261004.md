# Relay final response host: local package check (2026-10-04)

This is a local Linux `dir` package for checking the host change. It has not been installed or used to restart the user's app. No PR was merged upstream.

## Basis

- RC base: `upstream/rc` at `d2b9a3d03bceebf847e417a79916bce92280b16d`.
- Integration checkout: `build/relay-rc-own-prs-20261004` at `d9112ce8518f0b040759fc259e3218f1eeeaa145`.
- Existing local public progress integration: `aeed7a5da7d838e129739e6ee018f6289eb899e8`.
- Final response host change: `955bd5881026df9092cfda5db002014e00bdb4a5` on `feat/relay-final-response-host`.

The integration checkout contains the following open PR heads from the authenticated user's GitHub roster checked on 2026-10-04. PRs #1691 and #1695 were reconciled into the integration checkout as local commits `bd0f3ea98` / `9436739a9` and `42a178726` / `a5cef166c`, respectively; their current head objects are not ancestors of this checkout. The remaining heads are ancestors. These integrations are local and have not merged the PRs upstream.

| PR    | Head SHA                                   |
| ----- | ------------------------------------------ |
| #1695 | `8ca0254866f470d32e4bd7ece589ae8f34236c37` |
| #1691 | `3ad3629b89496804c11477cd3dca4f2e061967e9` |
| #1666 | `f3ad8e5360691e0fd09df2d47d5d712f7e13a5e1` |
| #1653 | `1aa1c8285f92e79295a16f5803f7e1ff55f240ed` |
| #1652 | `37402657e74a1c2b83998fa4cbe4a22d95fd30f8` |
| #1644 | `09c78671ee2454d6864ea56c76ed9dd1a294e545` |
| #1354 | `247a11b69433fe08002d7a59d5daaa1af0ac6241` |
| #1298 | `a7b9952048fbe9a4bd3c01ca94cd94779752e78f` |
| #1273 | `1433a47a3fda707da204992baf6970d04be352da` |
| #1272 | `ae5d66ccf518f016fd5919f763124b56990d781c` |

## Verification

- Focused host tests: 401 passed across the headless spawner, Codex parser, headless plugin runner, sandbox host, and plugin host handlers.
- `tsc -p tsconfig.cli.json --noEmit` and `tsc -p tsconfig.main.json --noEmit` passed.
- `npm run build` passed. The main build and CLI bundle were refreshed after the code commit so build metadata identifies `955bd588`.
- `electron-builder --linux dir --publish never` completed. The local package is `release/linux-unpacked/` under this worktree. This is an unpacked test app, not an installer.
- `node scripts/smoke-packaged-agent-send.mjs release/linux-unpacked` passed against the actual `app.asar` plugin headless runner and spawner under the packaged Electron runtime. It checked final-only Codex response, public interim/tool progress, no final text in progress, and commentary-only failure.
- Packaged `app.asar` SHA256: `9ccfc9291661dd9f125f0e459ea897364a7a04602d7199d6eeb288d299a48cc2`.
- Packaged `resources/maestro-cli.js` SHA256: `ec1529d4c8500d4f2dd2562e96b888d4f8f72cfbcb13c946a18bf2b7da819b79`.

The package was assembled with `node_modules` shared from the pre-existing local RC integration worktree. `electron-builder` warned about dependency lookup paths but completed; the packaged smoke test verified the affected host module loads and behaves correctly. This check does not exercise a live Discord Relay connection or plugin installation.
