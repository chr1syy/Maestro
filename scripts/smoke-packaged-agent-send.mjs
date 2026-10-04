/**
 * Exercise the actual packaged plugin headless runner and spawner under Electron.
 * Usage: node scripts/smoke-packaged-agent-send.mjs release/linux-unpacked
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const packageRoot = process.argv[2] && resolve(process.argv[2]);
if (!packageRoot) {
	console.error('Usage: node scripts/smoke-packaged-agent-send.mjs <package-root>');
	process.exit(2);
}
const electron = join(packageRoot, 'maestro');
const asar = join(packageRoot, 'resources', 'app.asar');
if (!existsSync(electron) || !existsSync(asar)) {
	throw new Error(`Packaged Electron or app.asar missing under ${packageRoot}`);
}

const smoke = String.raw`
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const childProcess = require('node:child_process');
const path = require('node:path');

const sequences = [];
const originalSpawn = childProcess.spawn;
childProcess.spawn = (command, args) => {
  const child = Object.assign(new EventEmitter(), {
    stdin: { write() {}, end() {} },
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  setImmediate(() => {
    if (command === 'which' || command === 'where') {
      child.stdout.emit('data', Buffer.from('/usr/bin/codex\n'));
    } else {
      const lines = sequences.shift();
      assert(lines, 'unexpected provider spawn');
      child.stdout.emit('data', Buffer.from(lines.map(JSON.stringify).join('\n') + '\n'));
    }
    child.emit('close', 0);
  });
  return child;
};

const { spawnAgent } = require(path.join(process.argv[1], 'dist/cli/services/agent-spawner.js'));
const { createPluginHeadlessAgentRunner } = require(path.join(process.argv[1], 'dist/main/plugins/plugin-headless-agent-runner.js'));
const run = createPluginHeadlessAgentRunner({
  getAgent: () => ({ id: 'smoke-agent', toolType: 'codex', cwd: process.cwd() }),
  detectAgent: async () => ({ available: true }),
  hasPluginTools: () => false,
  spawn: spawnAgent,
  prepareSystemPrompt: async () => undefined,
  issueRunToken: () => 'unused',
  revokeRunToken: () => {},
  cliScriptPath: () => '/unused',
  audit: () => {},
});
(async () => {
  sequences.push([
    { type: 'item.completed', item: { type: 'agent_message', text: 'Inspecting' } },
    { type: 'item.started', item: { type: 'command_execution', id: 'tool-1', command: 'private command' } },
    { type: 'item.completed', item: { type: 'command_execution', id: 'tool-1', status: 'completed' } },
    { type: 'item.completed', item: { type: 'agent_message', text: 'Final answer' } },
  ]);
  const progress = [];
  const first = await run('smoke-agent', 'smoke', undefined, undefined, 'auto', (event) => progress.push(event));
  assert.equal(first.success, true);
  assert.equal(first.response, 'Final answer');
  assert(progress.some((event) => event.type === 'commentary' && event.text === 'Inspecting'));
  assert(progress.some((event) => event.type === 'tool'));
  assert(!JSON.stringify(progress).includes('Final answer'));
  assert(!JSON.stringify(progress).includes('private command'));

  sequences.push([
    { type: 'event_msg', payload: { type: 'agent_message', phase: 'commentary', message: 'Still working' } },
    { type: 'item.completed', item: { type: 'reasoning', text: 'private reasoning' } },
  ]);
  const second = await run('smoke-agent', 'smoke');
  assert.equal(second.success, false);
  assert.equal(second.response, null);
  assert.match(second.error, /no final text/);
  childProcess.spawn = originalSpawn;
  console.log('packaged host: final-only answer, public progress, and missing-final failure passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
`;

const result = spawnSync(electron, ['-e', smoke, asar], {
	env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
	encoding: 'utf8',
	timeout: 60_000,
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
