const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const roots = [
	'src/main/ipc/handlers/pianola.ts',
	'src/main/pianola/pianola-store-main.ts',
	'src/main/pianola/pianola-decisions.ts',
	'src/shared/pianola/pianola-scope-cycle.ts',
	'src/renderer/components/PianolaModal/RuleEditor.tsx',
	'src/__tests__/helpers/pianola.ts',
	'src/__tests__/main/ipc/pianola-suggestions-handlers.test.ts',
	'src/__tests__/main/pianola/pianola-relearn.test.ts',
	'src/__tests__/main/web-server/web-server-factory.test.ts',
	'src/__tests__/renderer/components/RuleEditor.test.tsx',
	'src/__tests__/shared/pianola/pianola-scope-cycle.test.ts',
	'src/__tests__/shared/pianola/pianola-synthesis.test.ts',
	'src/__tests__/shared/pianola/transcript-mining.test.ts',
	'src/__tests__/integration/pianola-native-acceptance.integration.test.ts',
	'src/__tests__/integration/pianola-native-acceptance.config.ts',
];
const ambientRoots = ['src/types/dns-packet.d.ts', 'src/renderer/global.d.ts'];
const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.main.json');
const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
const config = ts.parseJsonConfigFileContent(loaded.config, ts.sys, path.dirname(configPath));
const options = {
	...config.options,
	noEmit: true,
	rootDir: undefined,
	types: ['node', '@testing-library/jest-dom/vitest'],
	jsx: ts.JsxEmit.ReactJSX,
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
	compilerOptions: { config: configPath, nodeAmbientTypes: true,
		jsx: 'react-jsx',
		jestDomMatchers: true, domLibrary: true },
	changedRootDiagnostics: own,
	dependencyDiagnostics: rows.filter((d) => !own.includes(d)),
};
fs.mkdirSync('.maestro/pianola-project-watchers-20261028/agent-group-v2/checks', {
	recursive: true,
});
fs.writeFileSync(
	'.maestro/pianola-project-watchers-20261028/agent-group-v2/checks/V2-14-static.json',
	JSON.stringify(receipt, null, 2) + '\n'
);
console.log(JSON.stringify(receipt, null, 2));
process.exitCode = rows.length ? 1 : 0;
