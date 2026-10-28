import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import console from 'node:console';
const roots = [
	'src/main/ipc/handlers/pianola.ts',
	'src/main/pianola/pianola-lifecycle.ts',
	'src/main/pianola/pianola-relearn.ts',
	'src/main/pianola/pianola-store-main.ts',
	'src/main/preload/pianola.ts',
	'src/main/web-server/handlers/bridgeDenyList.ts',
	'src/main/web-server/handlers/bridgeHandlers.ts',
	'src/shared/pianola/fs-store.ts',
	'src/shared/pianola/pianola-synthesis.ts',
	'src/shared/pianola/storage.ts',
	'src/renderer/components/PianolaModal/PianolaModal.tsx',
	'src/renderer/components/PianolaModal/SuggestionsView.tsx',
	'src/__tests__/shared/pianola/pianola-synthesis.test.ts',
	'src/__tests__/renderer/components/PianolaModal.test.tsx',
	'src/__tests__/integration/pianola-native-acceptance.integration.test.ts',
	'src/shared/pianola/pianola-scope-checkpoint.ts',
	'src/shared/pianola/pianola-scope-cycle.ts',
	'src/renderer/components/PianolaDashboard/PianolaDashboard.tsx',
	'src/renderer/components/PianolaDashboard/PianolaScopeControls.tsx',
	'src/__tests__/shared/pianola/pianola-scope-cycle.test.ts',
	'src/__tests__/shared/pianola/pianola-scope-checkpoint.test.ts',
	'src/__tests__/renderer/components/PianolaDashboard/PianolaDashboard.test.tsx',
	'src/__tests__/renderer/components/PianolaDashboard/PianolaScopeControls.test.tsx',
];
const ambientRoots = [
	'src/types/dns-packet.d.ts',
	'src/types/css.d.ts',
	'src/renderer/global.d.ts',
	'src/renderer/assets.d.ts',
];
const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.main.json');
const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
const config = ts.parseJsonConfigFileContent(loaded.config, ts.sys, path.dirname(configPath));
const options = {
	...config.options,
	noEmit: true,
	rootDir: undefined,
	types: ['node', '@testing-library/jest-dom/vitest'],
	jsx: ts.JsxEmit.ReactJSX,
	module: ts.ModuleKind.ESNext,
	incremental: false,
	composite: false,
	lib: [...config.options.lib, 'lib.dom.d.ts'],
};
const program = ts.createProgram([...roots, ...ambientRoots], options);
const diagnostics = ts.getPreEmitDiagnostics(program);
const rows = diagnostics.map((d) => ({
	file: d.file ? path.relative(process.cwd(), d.file.fileName) : null,
	code: d.code,
	line:
		d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : null,
	message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
}));
const own = rows.filter((d) => !d.file || roots.includes(d.file));
const receipt = {
	status: rows.length ? 'failed' : 'pass',
	checkKind: 'scoped-typecheck',
	roots,
	ambientRoots,
	compilerOptions: {
		config: configPath,
		nodeAmbientTypes: true,
		jsx: 'react-jsx',
		jestDomMatchers: true,
		domLibrary: true,
	},
	changedRootDiagnostics: own,
	dependencyDiagnostics: rows.filter((d) => !own.includes(d)),
};
fs.mkdirSync('.maestro/pianola-project-watchers-20261028/agent-group-v2/checks', {
	recursive: true,
});
fs.writeFileSync(
	'.maestro/pianola-project-watchers-20261028/agent-group-v2/checks/recovery-acceptance-static.json',
	JSON.stringify(receipt, null, 2) + '\n'
);
console.log(JSON.stringify(receipt, null, 2));
process.exitCode = rows.length ? 1 : 0;
