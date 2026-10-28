---
type: reference
title: Pianola V2 isolated acceptance commands
created: 2026-10-28
tags:
  - pianola
  - acceptance
related:
  - '[[SPEC]]'
  - '[[IMPLEMENTATION-MAP]]'
  - '[[V2-13-HARNESS]]'
---

V2-13 authors the harness only. V2-14 has now executed and repaired it: 21/21
isolated cases pass. Full SPEC acceptance remains partial; see [[V2-14-ACCEPTANCE]]
and `acceptance.json` for exact failures and owners. The current
progress ledger leaves V2-05 and V2-10 incomplete and contains no V2-06, V2-07,
V2-11 or V2-12 completion receipts. Do not infer their success from these files.

Run from `/home/chris/code/worktrees/fix/pianola-project-watchers-20261028`:

```bash
node_modules/.bin/vitest run --config src/__tests__/integration/pianola-native-acceptance.config.ts --reporter=verbose --reporter=json --outputFile=.maestro/pianola-project-watchers-20261028/agent-group-v2/checks/V2-13-vitest.json
```

The dedicated configuration includes exactly one file, uses Node and one fork,
collects all 21 cases with bail disabled, and excludes real-provider integration
suites and the renderer's global setup. Do not replace this with the unfiltered
integration command, a built CLI invocation or a full suite.

Execution generates `checks/V2-13-vitest.json` (authoritative test outcomes) and
`checks/V2-13-traces.json` (production checkpoints, decisions, native send intents,
suggestions, rules, transport requests and guarded filesystem access by case).
The trace's per-case state is supplementary; use the Vitest reporter for final
hook failures. A collection failure may produce no trace file; that is a failure,
not an empty successful run. Fixtures live under `auto-run/Working/V2-13-fixture-*`
and are removed after each case. Receipts contain fixture data only.

Static authoring checks, which do not load or execute the harness:

```bash
node_modules/.bin/prettier --check src/__tests__/integration/pianola-native-acceptance.integration.test.ts src/__tests__/integration/pianola-native-acceptance.config.ts
node_modules/.bin/eslint -c eslint.dashes.config.mjs src/__tests__/integration/pianola-native-acceptance.integration.test.ts src/__tests__/integration/pianola-native-acceptance.config.ts
node .maestro/pianola-project-watchers-20261028/agent-group-v2/checks/V2-13-static.cjs
git diff --check
```

The TypeScript driver roots only the new harness/config and uses the main config
plus existing DNS and renderer ambient declarations, Node types and the DOM
library required by the shared test factories. See `checks/V2-13-static.json`.
The general ESLint config ignores tests; the explicit test configuration above is
the applicable repository check. Full push validation and all test execution are
intentionally deferred by this task's specific instructions.

## V2-14 observed execution

The harness command above remains the isolated execution entrypoint. Final
receipts are `checks/V2-13-vitest.json` and `checks/V2-13-traces.json`; the original
16-case failure receipt is `checks/V2-14-initial-vitest.json`. Added native cases
cover forged/broadened/stale approval, retained permission risk and definitive
refusal retries plus human resolution. Production fixture boundaries remain
closed. The harness passes 21/21 cases; this does not complete V2-05 or V2-10.

Run the following bounded regression command (622 tests in 12 files):

```bash
TMPDIR="$PWD/.maestro/pianola-project-watchers-20261028/auto-run/Working" node_modules/.bin/vitest run src/__tests__/renderer/components/RuleEditor.test.tsx src/__tests__/main/ipc/pianola-suggestions-handlers.test.ts src/__tests__/main/pianola/pianola-store-main.test.ts src/__tests__/main/pianola/pianola-relearn.test.ts src/__tests__/main/pianola/pianola-relearn-scheduler.test.ts src/__tests__/shared/pianola/pianola-synthesis.test.ts src/__tests__/shared/pianola/transcript-mining.test.ts src/__tests__/shared/pianola/pianola-policy.test.ts src/__tests__/shared/pianola/pianola-scope-cycle.test.ts src/__tests__/cli/commands/pianola.test.ts src/__tests__/main/web-server/handlers/messageHandlers.test.ts src/__tests__/main/web-server/web-server-factory.test.ts --reporter=json --outputFile=.maestro/pianola-project-watchers-20261028/agent-group-v2/checks/V2-14-targeted.json
```

The final scoped typecheck driver is:

```bash
node --max-old-space-size=8192 .maestro/pianola-project-watchers-20261028/agent-group-v2/checks/V2-14-static.cjs
```

It roots only the changed production/test modules plus the two harness roots and
existing ambient declarations, with JSX and jest-dom matcher types included.
See `checks/V2-14-static.json`. Exact final format, source/test lint and whitespace
commands/results appear in `checks/V2-14-checks.json`. The initial targeted run
had 576 passes and 46 stale-contract fixture failures; its receipt is
`checks/V2-14-targeted-initial.json`. No full suite or push validation is used.
