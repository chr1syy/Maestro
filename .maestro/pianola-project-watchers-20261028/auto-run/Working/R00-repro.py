"""Disposable R00 diagnostic; reuses closed production harness, not permanent regressions."""
from pathlib import Path
import subprocess
import sys

root = Path.cwd()
working = root / '.maestro/pianola-project-watchers-20261028/auto-run/Working'
evidence = root / '.maestro/pianola-project-watchers-20261028/agent-group-v2/checks'
base = (root / 'src/__tests__/integration/pianola-native-acceptance.integration.test.ts').read_text()
source = base.split("describe('Pianola native candidate acceptance")[0]
for prefix, target in [('../../', root / 'src'), ('../helpers/', root / 'src/__tests__/helpers')]:
    source = source.replace("'" + prefix, "'" + str(target) + '/')
source = source.replace('checks/V2-13-traces.json', 'checks/R00-traces.json')
source = source.replace('trace: fixture?.trace,', "trace: fixture?.trace.slice(-2).map((t: any) => ({label:t.label,time:t.time,checkpoints:t.checkpoints,suggestions:t.suggestions,rules:t.rules})), cycleOutput: vi.mocked(console.log).mock.calls.map(call => call[0]).filter(value => typeof value === 'string' && value.startsWith('{')).map(value => {const parsed = JSON.parse(value); return {scopeId:parsed.scopeId,status:parsed.status,issues:parsed.issues};}),")
source = source.replace('requests: fixture?.requests,', 'requests: [],').replace('reads: boundary.reads,', 'reads: [],').replace('writes: boundary.writes,', 'writes: [],')
source += (working / 'R00-cases.debug.txt').read_text().replace('__ROOT__', str(root))
script = working / 'R00-native.debug.test.ts'
config = working / 'R00-debug.config.ts'
script.write_text(source)
config.write_text("import { defineConfig } from 'vitest/config'; export default defineConfig({esbuild:{jsx:'automatic'},test:{include:['" + str(script.relative_to(root)) + "'],exclude:[],environment:'node',pool:'forks',maxWorkers:1,minWorkers:1,fileParallelism:false,testTimeout:10000,hookTimeout:10000,bail:0}});")
try:
    with (evidence / 'R00-native.log').open('w') as log:
        result = subprocess.run(['node_modules/.bin/vitest', 'run', '--config', str(config.relative_to(root)), '--reporter=verbose', '--reporter=json', '--outputFile=' + str((evidence / 'R00-native.json').relative_to(root))], stdout=log, stderr=subprocess.STDOUT)
    print((evidence / 'R00-native.log').read_text())
    sys.exit(result.returncode)
finally:
    script.unlink(missing_ok=True)
    config.unlink(missing_ok=True)
