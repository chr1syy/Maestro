/**
 * V2-13 source acceptance: real lifecycle/supervisor -> CLI worker -> native
 * admission/decision log -> settlement event -> relearn -> Suggestions IPC.
 * Only Electron, OS processes, transport and desktop stores are fixtures.
 * Run the exact command in agent-group-v2/checks-plan.md, never a live CLI.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import type { SpawnOptions } from 'child_process';
import type { WebServer } from '../../main/web-server/WebServer';
import type {
	MessageHandlerCallbacks,
	MessageHandlerContext,
	WebClient,
	WebClientMessage,
} from '../../main/web-server/handlers/messageHandlers/types';
import type { PianolaSupervisedTarget, PianolaSuggestionsFile } from '../../shared/pianola/storage';
import type { PianolaRule } from '../../shared/pianola/types';

const boundary = vi.hoisted(() => ({
	root: '',
	settings: {} as Record<string, unknown>,
	handlers: new Map<string, (...args: unknown[]) => Promise<unknown>>(),
	violations: [] as string[],
	reads: [] as string[],
	writes: [] as string[],
	spawn: undefined as
		| ((command: string, args: string[], opts: SpawnOptions) => unknown)
		| undefined,
	request: undefined as
		| ((message: Record<string, unknown>, resultType: string) => Promise<unknown>)
		| undefined,
}));

// Closed filesystem facade: new/unclassified I/O fails closed. Native fs below
// is reserved for test-owned sandbox creation/cleanup and the named receipt.
vi.mock('fs', async (importOriginal) => {
	const native = await importOriginal<typeof import('fs')>();
	const paths = await import('path');
	const reads = new Set(['existsSync', 'readFileSync', 'statSync', 'readdirSync']);
	const writes = new Set([
		'mkdirSync',
		'writeFileSync',
		'appendFileSync',
		'renameSync',
		'unlinkSync',
		'rmSync',
	]);
	const guard = (raw: unknown, operation: string) => {
		const file = typeof raw === 'string' ? paths.resolve(raw) : '';
		if (!boundary.root || (file !== boundary.root && !file.startsWith(boundary.root + paths.sep))) {
			boundary.violations.push(`${operation}:${String(raw)}`);
			throw new Error('Fixture filesystem boundary');
		}
		(reads.has(operation) ? boundary.reads : boundary.writes).push(file);
	};
	const facade = new Proxy(native, {
		get(target, key) {
			if (key === 'default') return facade;
			if (key === 'promises') throw new Error('Async filesystem forbidden');
			const value = Reflect.get(target, key);
			if (typeof value !== 'function') return value;
			return (...args: unknown[]) => {
				guard(args[0], String(key));
				if (key === 'watch') return { on: vi.fn(), close: vi.fn() };
				if (!reads.has(String(key)) && !writes.has(String(key)))
					throw new Error(`Unclassified fixture I/O: ${String(key)}`);
				if (key === 'renameSync') guard(args[1], String(key));
				return Reflect.apply(value, target, args);
			};
		},
	});
	return facade;
});
vi.mock('electron', () => ({
	app: {
		getPath: () => {
			throw new Error('Productive Electron directory forbidden');
		},
	},
	ipcMain: {
		handle: (name: string, fn: (...args: unknown[]) => Promise<unknown>) =>
			boundary.handlers.set(name, fn),
	},
}));
vi.mock(
	'fs/promises',
	() =>
		new Proxy(
			{},
			{
				get: (_target, operation) => {
					if (operation === 'then') return undefined;
					return () => {
						boundary.violations.push(`async-fs:${String(operation)}`);
						throw new Error('Async filesystem forbidden in acceptance fixture');
					};
				},
			}
		)
);
vi.mock('child_process', () => ({
	spawn: (command: string, args: string[], opts: SpawnOptions) => {
		if (!boundary.spawn) throw new Error('OS process spawning forbidden');
		return boundary.spawn(command, args, opts);
	},
	exec: () => {
		throw new Error('Shell execution forbidden');
	},
	execFile: () => {
		throw new Error('External execution forbidden');
	},
	execSync: () => {
		throw new Error('Shell execution forbidden');
	},
	execFileSync: () => {
		throw new Error('External execution forbidden');
	},
}));
vi.mock('../../cli/services/maestro-client', () => ({
	MaestroClient: class {
		async connect() {}
		disconnect() {}
		async sendCommand(message: Record<string, unknown>, resultType: string) {
			if (!boundary.request) throw new Error('Productive Maestro connection forbidden');
			return boundary.request(message, resultType);
		}
	},
}));
vi.mock('../../cli/services/storage', () => ({
	getConfigDirectory: () => {
		if (!boundary.root) throw new Error('No fixture store');
		return boundary.root;
	},
	readSettingValue: (key: string) => boundary.settings[key],
}));
vi.mock('../../main/stores', () => ({
	getSettingsStore: () => ({
		get: (key: string, fallback?: unknown) => boundary.settings[key] ?? fallback,
	}),
}));
vi.mock('../../main/utils/logger', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../main/utils/sentry', () => ({ captureException: vi.fn() }));
vi.mock('../../main/process-manager', () => ({ ProcessManager: class {} }));
vi.mock('../../main/cue/cue-cli-executor', () => ({
	resolveMaestroCliScriptPath: () => `${boundary.root}/fixture-cli.js`,
}));
vi.mock('../../shared/maestro-lib/control/termination', () => ({
	BACKGROUND_STOP_GRACE_MS: 0,
	stopProcess: ({ child }: { child: { exit: (code: number) => void } }) => child.exit(0),
}));
vi.mock('../../shared/cli-activity', () => ({
	getSessionIdsBusyWithCli: () => new Set<string>(),
	isSessionBusyWithCli: () => false,
}));

import { createMockSession } from '../helpers/mockSession';
import { createMockAITab } from '../helpers/mockTab';
import { createPianolaLifecycle } from '../../main/pianola/pianola-lifecycle';
import { registerPianolaHandlers } from '../../main/ipc/handlers/pianola';
import { registerSessionCallbacks } from '../../main/web-server/callbacks/sessionCallbacks';
import { resolvePianolaDecision } from '../../main/pianola/pianola-decisions';
import {
	handlePianolaDecisionResolve,
	handlePianolaScopeReply,
} from '../../main/web-server/handlers/messageHandlers/commands';
import {
	handleGetSessionHistory,
	handleListDesktopSessions,
} from '../../main/web-server/handlers/messageHandlers/sessions';
import { handleNotifyToast } from '../../main/web-server/handlers/messageHandlers/notifications';
import { pianolaWatchScope } from '../../cli/commands/pianola-scope-watch';
import * as mainStore from '../../main/pianola/pianola-store-main';
import * as cliStore from '../../cli/services/pianola-store';

const SCOPE = '11111111-1111-4111-8111-111111111111';
const OVERLAP = '22222222-2222-4222-8222-222222222222';
const AGENT = 'fixture-agent',
	MANAGER = 'fixture-mira',
	GROUP = 'fixture-group',
	TAB = 'fixture-old-tab';
const ASK = 'May I run `git status`?',
	ANSWER = 'Yes, run git status.';
const EVIDENCE = '.maestro/pianola-project-watchers-20261028/agent-group-v2';
const WORKING = '.maestro/pianola-project-watchers-20261028/auto-run/Working';

// No shared child-process factory exists. This double models the OS lifecycle;
// poll runs the real worker selected by the actual supervisor's argv.
class FixtureChild extends EventEmitter {
	exitCode: number | null = null;
	signalCode = null;
	stdout = Object.assign(new EventEmitter(), { setEncoding: vi.fn() });
	stderr = Object.assign(new EventEmitter(), { setEncoding: vi.fn() });
	constructor(
		readonly pid: number,
		readonly scopeId: string
	) {
		super();
	}
	exit(code: number) {
		this.exitCode = code;
		this.emit('exit', code, null);
	}
	async poll() {
		await pianolaWatchScope(this.scopeId, { once: true, json: true });
	}
}
type NativeSend = { agentId: string; tabId: string; text: string; decisionId: string };
class AcceptanceFixture {
	sessions: ReturnType<typeof createMockSession>[] = [];
	busy = new Set<string>();
	children: FixtureChild[] = [];
	sends: NativeSend[] = [];
	requests: Record<string, unknown>[] = [];
	notices: unknown[] = [];
	trace: unknown[] = [];
	spawnArgs: unknown[] = [];
	callbacks: Partial<MessageHandlerCallbacks> = {};
	lifecycle!: ReturnType<typeof createPianolaLifecycle>;
	receipt: 'accepted' | 'unknown' = 'accepted';
	beforeAdmission?: () => void;
	sequence = 0;
	settingsStore = { get: (key: string, fallback?: unknown) => boundary.settings[key] ?? fallback };
	sessionsStore = {
		get: <T>(key: string, fallback?: T): T => (key === 'sessions' ? this.sessions : fallback) as T,
	};
	constructor() {
		boundary.spawn = (command, args, opts) => {
			expect(command).toBe(process.execPath);
			expect(args.slice(0, 3)).toEqual([
				`${boundary.root}/fixture-cli.js`,
				'pianola',
				'watch-scope',
			]);
			expect([SCOPE, OVERLAP]).toContain(args[3]);
			expect(args).toHaveLength(4);
			expect(opts.env?.MAESTRO_AGENT_ID).toBe(MANAGER);
			expect(opts.env?.MAESTRO_USER_DATA).toBe(boundary.root);
			expect(opts.detached).not.toBe(true);
			this.spawnArgs.push({ command, args, manager: opts.env?.MAESTRO_AGENT_ID });
			const child = new FixtureChild(this.children.length + 1, args[3]);
			this.children.push(child);
			return child;
		};
		boundary.request = (message, resultType) => this.request(message, resultType);
		// Capture real session callbacks; never recreate their census/cursors.
		const server = new Proxy(
			{},
			{
				get: (_target, key: string) => (callback: unknown) => {
					if (key === 'setListDesktopSessionsCallback')
						this.callbacks.listDesktopSessions =
							callback as MessageHandlerCallbacks['listDesktopSessions'];
					if (key === 'setGetSessionHistoryCallback')
						this.callbacks.getSessionHistory =
							callback as MessageHandlerCallbacks['getSessionHistory'];
				},
			}
		) as WebServer;
		registerSessionCallbacks(server, {
			sessionsStore: this.sessionsStore,
			groupsStore: { get: <T>(_key: string, fallback?: T) => fallback as T },
			getProcessManager: (() => ({
				get: (id: string) => (this.busy.has(id) ? {} : undefined),
			})) as Parameters<typeof registerSessionCallbacks>[1]['getProcessManager'],
		});
		this.callbacks.executeCommand = async (
			agentId,
			text,
			mode,
			tabId,
			force,
			_images,
			background,
			requireReceipt
		) => {
			this.assertDestination(agentId, tabId);
			expect({ mode, force, background, requireReceipt }).toEqual({
				mode: 'ai',
				force: false,
				background: true,
				requireReceipt: true,
			});
			const record = mainStore
				.readDecisions()
				.find(
					(entry) =>
						entry.lifecycle?.delivery === 'intent' &&
						entry.deliveryStatus === 'admitted' &&
						(entry.lifecycle.phase === 'judgment'
							? agentId === MANAGER && tabId === entry.lifecycle.managerTabId
							: agentId === entry.agentId && tabId === entry.tabId)
				);
			expect(record, 'durable admission must precede every native send').toBeDefined();
			const saved = mainStore
				.readScopeCheckpoint(record!.lifecycle!.guard.scopeId)
				?.tabs.find((tab) => tab.tabId === record!.tabId);
			expect(saved?.unresolvedIntent).toMatchObject({ decisionId: record!.id, admitted: true });
			this.sends.push({ agentId, tabId: tabId!, text, decisionId: record!.id });
			if (this.receipt === 'unknown') throw new Error('Fixture receipt lost after admission');
			return true;
		};
		this.callbacks.notifyToast = async (notice) => {
			this.notices.push(notice);
			return true;
		};
	}
	startLifecycle() {
		this.lifecycle = createPianolaLifecycle({
			settingsStore: this.settingsStore,
			sessionsStore: this.sessionsStore,
			logger: { info: vi.fn() },
		} as unknown as Parameters<typeof createPianolaLifecycle>[0]);
		registerPianolaHandlers({
			settingsStore: this.settingsStore,
			supervisor: this.lifecycle.supervisor,
			// Transport adapter mirrors WebServer's single forwarding method. Real
			// IPC binds the human actor; real resolution performs all admission.
			getWebServer: () =>
				({
					resolvePianolaHumanDecision: (payload: unknown, actorId: string, principal?: 'chris') =>
						resolvePianolaDecision(this.callbacks, payload, { kind: 'human', actorId, principal }),
				}) as WebServer,
		});
		this.lifecycle.supervisor.start();
		this.lifecycle.relearnScheduler.start();
	}
	stop() {
		this.lifecycle.relearnScheduler.stop();
		this.lifecycle.supervisor.stopAll();
	}
	restart() {
		this.stop();
		this.startLifecycle();
	}
	assertDestination(agentId: string, tabId: unknown) {
		if (
			!agentId.startsWith('fixture-') ||
			typeof tabId !== 'string' ||
			!tabId.startsWith('fixture-') ||
			!this.sessions.some(
				(agent) => agent.id === agentId && agent.aiTabs.some((tab) => tab.id === tabId)
			)
		) {
			boundary.violations.push(`transport:${agentId}/${String(tabId)}`);
			throw new Error('Fixture recipient boundary');
		}
	}
	async request<T = Record<string, unknown>>(
		message: Record<string, unknown>,
		resultType: string
	): Promise<T> {
		this.requests.push(structuredClone(message));
		if (message.type === 'pianola_scope_reply') {
			const hook = this.beforeAdmission;
			this.beforeAdmission = undefined;
			hook?.();
		}
		let receive!: (response: Record<string, unknown>) => void;
		const response = new Promise<Record<string, unknown>>((resolve) => {
			receive = resolve;
		});
		const ctx = {
			callbacks: this.callbacks,
			send: (_client: unknown, value: Record<string, unknown>) => {
				receive(value);
			},
			sendError: () => {
				throw new Error('Unexpected native transport error');
			},
			reportHandlerError: () => {
				throw new Error('Unexpected native handler error');
			},
		} as MessageHandlerContext;
		const client = { cli: true } as WebClient,
			msg = message as WebClientMessage;
		// Actual domain entrypoints registered by the production router. This
		// adapter replaces transport framing only; it never decides an outcome.
		switch (message.type) {
			case 'list_desktop_sessions':
				handleListDesktopSessions(ctx, client, msg);
				break;
			case 'get_session_history':
				handleGetSessionHistory(ctx, client, msg);
				break;
			case 'pianola_scope_reply':
				await handlePianolaScopeReply(ctx, client, msg);
				break;
			case 'pianola_decision_resolve':
				await handlePianolaDecisionResolve(ctx, client, msg);
				break;
			case 'notify_toast':
				handleNotifyToast(ctx, client, msg);
				break;
			default:
				throw new Error(`No external transport fallback: ${String(message.type)}`);
		}
		// Some native domain handlers send their response in a Promise callback.
		// Await the frame just as MaestroClient does, rather than inventing a
		// synchronous notification receipt in the fixture.
		const frame = await response;
		expect(frame.type).toBe(resultType);
		return frame as T;
	}
	async ipc<T = unknown>(name: string, ...args: unknown[]): Promise<T> {
		const handler = boundary.handlers.get(`pianola:${name}`);
		expect(handler, `production IPC ${name} must exist`).toBeDefined();
		return (await handler!({ sender: { id: 1 } }, ...args)) as T;
	}
	agent(id = AGENT, groupId: string | undefined = GROUP, parentSessionId?: string) {
		const session = createMockSession({
			id,
			name: id,
			groupId,
			parentSessionId,
			cwd: `${boundary.root}/${id}`,
			isPianola: id === MANAGER,
			aiTabs: [],
		});
		this.sessions.push(session);
		return session;
	}
	tab(agentId = AGENT, tabId = TAB, createdAt = 1) {
		const owner = this.sessions.find((session) => session.id === agentId)!;
		const tab = createMockAITab({ id: tabId, createdAt, logs: [] });
		owner.aiTabs.push(tab);
		owner.activeTabId = tabId;
		return tab;
	}
	getTab(tabId = TAB) {
		return this.sessions.flatMap((agent) => agent.aiTabs).find((tab) => tab.id === tabId)!;
	}
	log(tabId: string, text: string, source: 'ai' | 'user' | 'tool' = 'ai') {
		const entry = { id: `fixture-message-${++this.sequence}`, timestamp: Date.now(), source, text };
		this.getTab(tabId).logs.push(entry);
		return entry;
	}
	async select(overrides: Partial<PianolaSupervisedTarget> = {}) {
		await this.ipc('supervisor-add', {
			id: SCOPE,
			kind: 'watch-scope',
			enabled: true,
			createdAt: 1,
			intervalSeconds: 5,
			managerAgentId: MANAGER,
			selection: {
				mode: 'agents-and-groups',
				label: 'Fixture selection',
				agentIds: [AGENT],
				groupIds: [],
				excludedAgentIds: [],
			},
			...overrides,
		});
	}
	async pump(label: string) {
		vi.setSystemTime(Date.now() + 10);
		for (const child of this.children.filter((entry) => entry.exitCode === null))
			await child.poll();
		await vi.advanceTimersByTimeAsync(0);
		this.capture(label);
	}
	capture(label: string) {
		this.trace.push({
			label,
			time: Date.now(),
			health: this.lifecycle.supervisor.getHealth(),
			checkpoints: mainStore
				.readSupervisorTargets()
				.filter((target) => target.kind === 'watch-scope')
				.map((target) => mainStore.readScopeCheckpoint(target.id)),
			decisions: mainStore.readDecisions(),
			suggestions: mainStore.readSuggestions(),
			rules: mainStore.readRules(),
			sends: structuredClone(this.sends),
		});
	}
	decision(messageId: string) {
		const record = mainStore
			.readDecisions()
			.find((entry) => entry.classification.evidence.messageId === messageId);
		expect(record, `production watcher must handle ${messageId}`).toBeDefined();
		return record!;
	}
	async rule(overrides: Partial<PianolaRule> = {}) {
		await this.ipc('save-rules', [
			{
				id: 'fixture-rule',
				enabled: true,
				scope: 'agent',
				scopeId: AGENT,
				match: { maxRisk: 'low', kinds: ['question'], exactQuestion: ASK, groupId: GROUP },
				action: 'auto_answer',
				answer: ANSWER,
				priority: 1,
				createdAt: 1,
				updatedAt: 1,
				...overrides,
			},
		]);
	}
	async resolveManager(decisionId: string, tabId = 'fixture-mira-tab', answer = ANSWER) {
		return this.request(
			{
				type: 'pianola_decision_resolve',
				decisionId,
				answer,
				fromSessionId: MANAGER,
				fromTabId: tabId,
			},
			'pianola_decision_resolve_result'
		);
	}
	async continueRecipient(messageId: string, answer = ANSWER, tabId = TAB, agentId = AGENT) {
		this.log(tabId, answer, 'user');
		this.busy.add(`${agentId}-ai-${tabId}`);
		await this.pump('recipient acknowledged and running');
		expect(this.decision(messageId).lifecycle).toMatchObject({
			status: 'agent_running',
			nextActor: 'recipient',
			acknowledgedAt: expect.any(String),
		});
		this.log(tabId, 'Inspection finished.');
		this.busy.delete(`${agentId}-ai-${tabId}`);
		await this.pump('recipient finished');
		expect(this.decision(messageId).lifecycle).toMatchObject({ status: 'done', nextActor: 'none' });
	}
}
let fixture: AcceptanceFixture;
const receipts: unknown[] = [];
let nativeFs: typeof import('fs');
beforeEach(async () => {
	nativeFs = await vi.importActual<typeof import('fs')>('fs');
	vi.clearAllMocks();
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-28T12:00:00Z'));
	const parent = path.resolve(WORKING);
	nativeFs.mkdirSync(parent, { recursive: true });
	boundary.root = nativeFs.mkdtempSync(path.join(parent, 'V2-13-fixture-'));
	boundary.violations = [];
	boundary.reads = [];
	boundary.writes = [];
	boundary.handlers.clear();
	boundary.settings = {
		encoreFeatures: { pianola: true },
		pianolaLearningMinSamples: 3,
		pianolaLearningIdentity: { desktopOwnerIsChris: true },
	};
	vi.stubEnv('MAESTRO_USER_DATA', boundary.root);
	vi.spyOn(console, 'log').mockImplementation(() => {});
	fixture = new AcceptanceFixture();
	fixture.agent();
	fixture.tab();
	fixture.agent(MANAGER);
	fixture.tab(MANAGER, 'fixture-mira-tab');
	fixture.startLifecycle();
	mainStore.setProfile({
		profile: 'Prefer local inspection. Ask Chris for sensitive actions.',
		updatedAt: Date.now(),
	});
});
afterEach(async (context) => {
	try {
		await vi.advanceTimersByTimeAsync(0);
		fixture.capture('final evidence');
		expect(boundary.violations, 'productive I/O must never be attempted').toEqual([]);
		expect(boundary.reads.length).toBeGreaterThan(0);
		expect(boundary.writes.length).toBeGreaterThan(0);
	} finally {
		try {
			if (fixture?.lifecycle) fixture.stop();
		} finally {
			receipts.push({
				name: context.task.name,
				state: context.task.result?.state ?? 'unknown',
				root: boundary.root,
				trace: fixture?.trace,
				requests: fixture?.requests,
				spawns: fixture?.spawnArgs,
				reads: boundary.reads,
				writes: boundary.writes,
				violations: boundary.violations,
			});
			if (boundary.root) nativeFs.rmSync(boundary.root, { recursive: true, force: true });
			boundary.root = '';
			boundary.request = undefined;
			boundary.spawn = undefined;
			vi.unstubAllEnvs();
			vi.restoreAllMocks();
			vi.useRealTimers();
		}
	}
});
afterAll(() => {
	const target = path.resolve(EVIDENCE, 'checks/V2-13-traces.json');
	nativeFs.mkdirSync(path.dirname(target), { recursive: true });
	nativeFs.writeFileSync(
		target,
		JSON.stringify(
			{
				type: 'candidate-fixture-execution',
				installed: false,
				generatedAt: new Date().toISOString(),
				cases: receipts,
			},
			null,
			2
		) + '\n'
	);
});

describe('Pianola native candidate acceptance (isolated production composition)', () => {
	it('covers old/new tabs, group members and worktree ancestry by identity with one scope worker', async () => {
		fixture.agent('fixture-child', 'fixture-worktree-group', AGENT);
		fixture.tab('fixture-child', 'fixture-child-tab');
		const outsider = fixture.agent('fixture-outsider', 'fixture-other-group');
		outsider.cwd = fixture.sessions[0].cwd;
		fixture.tab(outsider.id, 'fixture-outsider-tab');
		fixture.agent('fixture-excluded');
		fixture.tab('fixture-excluded', 'fixture-excluded-tab');
		fixture.agent('fixture-explicit', 'fixture-other-group');
		fixture.tab('fixture-explicit', 'fixture-explicit-tab');
		mainStore.writeSupervisorTargets([
			{
				id: 'fixture-paused-watch',
				kind: 'watch',
				enabled: false,
				createdAt: 1,
				agentId: AGENT,
				tabId: 'fixture-parked-tab',
			},
		]);
		fixture.tab(AGENT, 'fixture-parked-tab');
		const stale = fixture.log(TAB, ASK);
		await fixture.rule({
			scope: 'global',
			scopeId: undefined,
			match: { maxRisk: 'low', kinds: ['question'] },
		});
		await fixture.select({
			selection: {
				mode: 'agents-and-groups',
				label: 'Group + explicit fixture',
				agentIds: ['fixture-explicit'],
				groupIds: [GROUP],
				excludedAgentIds: ['fixture-excluded'],
			},
		});
		await fixture.pump('enrollment baseline');
		expect(fixture.sends).toEqual([]);
		expect(
			mainStore
				.readDecisions()
				.some((record) => record.classification.evidence.messageId === stale.id)
		).toBe(false);
		expect(
			mainStore
				.readScopeCheckpoint(SCOPE)!
				.tabs.map((tab) => tab.tabId)
				.sort()
		).toEqual([TAB, 'fixture-child-tab', 'fixture-explicit-tab'].sort());
		fixture.tab(AGENT, 'fixture-future-tab', Date.now() + 1);
		const fresh = fixture.log('fixture-future-tab', ASK);
		fixture.log(TAB, 'A new inspection task.', 'user');
		fixture.log(TAB, ASK);
		fixture.log('fixture-child-tab', ASK);
		fixture.agent('fixture-future-member');
		fixture.tab('fixture-future-member', 'fixture-member-tab', Date.now() + 1);
		fixture.log('fixture-member-tab', ASK);
		await fixture.pump('new agent and new tab discovered');
		expect(fixture.decision(fresh.id).dispatched).toBe(true);
		expect(fixture.sends.map((send) => send.tabId).sort()).toEqual(
			[TAB, 'fixture-child-tab', 'fixture-future-tab', 'fixture-member-tab'].sort()
		);
		expect(fixture.children.filter((child) => child.exitCode === null)).toHaveLength(1);
		expect(
			mainStore.readSupervisorTargets().find((target) => target.id === 'fixture-paused-watch')
				?.enabled
		).toBe(false);
	});
	it('keeps explicit coverage after group removal and baselines a changed worktree parent', async () => {
		const groupAgent = fixture.agent('fixture-group-only');
		fixture.tab(groupAgent.id, 'fixture-group-tab');
		const child = fixture.agent('fixture-child', 'fixture-worktree-group', groupAgent.id);
		fixture.tab(child.id, 'fixture-child-tab');
		await fixture.rule();
		await fixture.select({
			selection: {
				mode: 'agents-and-groups',
				label: 'Overlap',
				agentIds: [AGENT],
				groupIds: [GROUP],
				excludedAgentIds: [],
			},
		});
		await fixture.pump('initial membership');
		fixture.sessions[0].groupId = 'fixture-other-group';
		groupAgent.groupId = 'fixture-other-group';
		child.parentSessionId = AGENT;
		fixture.log('fixture-child-tab', ASK);
		await fixture.pump('group move and parent change');
		expect(fixture.sends).toEqual([]);
		expect(
			mainStore.readScopeCheckpoint(SCOPE)!.tabs.find((tab) => tab.tabId === 'fixture-group-tab')
				?.status
		).toBe('suspended');
		await fixture.select();
		await fixture.pump('group selection removed');
		await fixture.rule({
			match: { maxRisk: 'low', exactQuestion: ASK, groupId: 'fixture-other-group' },
		});
		const ask = fixture.log(TAB, ASK);
		await fixture.pump('explicit agent still covered');
		expect(fixture.decision(ask.id).dispatched).toBe(true);
		expect(fixture.sends.map((send) => send.tabId)).toEqual([TAB]);
	});
	it('distinguishes native rule receipt, exact receiver acknowledgement and completion', async () => {
		fixture.tab(AGENT, 'fixture-active-decoy');
		await fixture.rule();
		await fixture.select();
		await fixture.pump('baseline');
		const ask = fixture.log(TAB, ASK);
		await fixture.pump('native rule answer accepted');
		expect(fixture.sends).toEqual([
			{ agentId: AGENT, tabId: TAB, text: ANSWER, decisionId: fixture.decision(ask.id).id },
		]);
		expect(fixture.decision(ask.id).lifecycle).toMatchObject({
			delivery: 'accepted',
			status: 'blocked',
			nextActor: 'recipient',
			source: { kind: 'rule' },
		});
		expect(fixture.decision(ask.id).lifecycle?.acknowledgedAt).toBeUndefined();
		await fixture.continueRecipient(ask.id);
		expect(mainStore.readSuggestions().pairCount).toBe(0);
	});
	it('bounds each worker cycle to 20 histories and reaches later tabs without extra children', async () => {
		for (let index = 0; index < 25; index++) fixture.tab(AGENT, `fixture-many-${index}`);
		await fixture.rule();
		await fixture.select();
		await fixture.pump('many tabs baselined');
		for (let index = 0; index < 25; index++) fixture.log(`fixture-many-${index}`, ASK);
		const before = fixture.requests.length;
		await fixture.pump('first bounded batch');
		expect(
			fixture.requests.slice(before).filter((request) => request.type === 'get_session_history')
		).toHaveLength(20);
		expect(fixture.sends).toHaveLength(20);
		await fixture.pump('round robin reaches later tabs');
		expect(new Set(fixture.sends.map((send) => send.tabId)).size).toBe(25);
		expect(fixture.children.filter((child) => child.exitCode === null)).toHaveLength(1);
	});
	it('baselines questions added during pause and answers only subsequent activity on resume', async () => {
		await fixture.rule();
		await fixture.select();
		await fixture.pump('baseline');
		await fixture.ipc('supervisor-set-enabled', SCOPE, false);
		const parked = fixture.log(TAB, ASK);
		await fixture.pump('paused worker does no work');
		expect(fixture.children.filter((child) => child.exitCode === null)).toHaveLength(0);
		await fixture.ipc('supervisor-set-enabled', SCOPE, true);
		await fixture.pump('resume baselines parked question');
		expect(fixture.sends).toEqual([]);
		expect(
			mainStore
				.readDecisions()
				.some((record) => record.classification.evidence.messageId === parked.id)
		).toBe(false);
		fixture.log(TAB, 'A new task after resume.', 'user');
		const fresh = fixture.log(TAB, ASK);
		await fixture.pump('new activity after resume');
		expect(fixture.decision(fresh.id).dispatched).toBe(true);
		expect(fixture.sends).toHaveLength(1);
	});
	it('routes Mira judgment through the bound manager tab back to the original receiver', async () => {
		await fixture.select();
		await fixture.pump('baseline');
		const ask = fixture.log(TAB, 'Should I inspect the local summary first?');
		await fixture.pump('Mira handoff');
		const record = fixture.decision(ask.id);
		expect(record.lifecycle).toMatchObject({
			status: 'mira_processing',
			managerAgentId: MANAGER,
			managerTabId: 'fixture-mira-tab',
			phase: 'judgment',
			delivery: 'accepted',
		});
		expect(fixture.sends[0]).toMatchObject({ agentId: MANAGER, tabId: 'fixture-mira-tab' });
		expect(fixture.sends[0].text).toContain(`pianola resolve ${record.id}`);
		expect(fixture.sends[0].text).toContain(`Tab: ${TAB}`);
		expect(fixture.sends[0].text).toContain('BEGIN UNTRUSTED AGENT CONTENT');
		fixture.tab(MANAGER, 'fixture-wrong-manager-tab');
		expect(await fixture.resolveManager(record.id, 'fixture-wrong-manager-tab')).toMatchObject({
			status: 'rejected',
		});
		expect(await fixture.resolveManager(record.id)).toMatchObject({ status: 'accepted' });
		expect(fixture.sends[1]).toMatchObject({ agentId: AGENT, tabId: TAB, text: ANSWER });
		expect(fixture.decision(ask.id).lifecycle?.source.kind).toBe('manager');
		await fixture.continueRecipient(ask.id);
		expect(fixture.decision(ask.id).humanEvidence).toBeUndefined();
		expect(mainStore.readSuggestions().pairCount).toBe(0);
	});
	it('escalates high-risk full-turn intent to Chris without a rule answer or Mira send', async () => {
		await fixture.rule({
			scope: 'global',
			scopeId: undefined,
			match: { maxRisk: 'high', kinds: ['question'] },
		});
		await fixture.select();
		await fixture.pump('baseline');
		fixture.log(TAB, 'I will merge the pull request and push to production.');
		const ask = fixture.log(TAB, 'May I proceed?');
		await fixture.pump('high-risk escalation');
		expect(fixture.decision(ask.id)).toMatchObject({
			classification: { risk: 'high' },
			lifecycle: { status: 'waiting_human', nextActor: 'human' },
		});
		expect(fixture.sends).toEqual([]);
		expect(fixture.notices).toHaveLength(1);
		expect(await fixture.resolveManager(fixture.decision(ask.id).id)).toMatchObject({
			status: 'rejected',
		});
		await fixture.pump('unchanged escalation is quiet');
		expect(fixture.notices).toHaveLength(1);
		expect(fixture.sends).toEqual([]);
	});
	it('learns three Chris settlements via native events, stages then explicitly accepts a scoped rule', async () => {
		await fixture.select();
		await fixture.pump('baseline');
		for (let index = 0; index < 3; index++) {
			const ask = fixture.log(TAB, ASK);
			await fixture.pump(`human sample ${index + 1}`);
			const record = fixture.decision(ask.id);
			expect(
				await fixture.ipc('resolve-decision', { decisionId: record.id, answer: ANSWER })
			).toMatchObject({ status: 'accepted' });
			await fixture.continueRecipient(ask.id);
			expect(fixture.decision(ask.id).humanEvidence).toMatchObject({
				principal: 'chris',
				actorId: 'desktop',
				agentId: AGENT,
				groupId: GROUP,
				tabId: TAB,
				questionMessageId: ask.id,
				question: ASK,
				answer: ANSWER,
			});
			const staged = await fixture.ipc<PianolaSuggestionsFile>('get-suggestions');
			expect(staged.pairCount).toBe(index + 1);
			expect(staged.proposals).toHaveLength(index === 2 ? 1 : 0);
			expect(mainStore.readRules()).toEqual([]);
		}
		const proposal = (await fixture.ipc<PianolaSuggestionsFile>('get-suggestions')).proposals[0];
		expect(proposal).toMatchObject({
			enabled: false,
			scope: 'agent',
			scopeId: AGENT,
			answer: ANSWER,
			match: { exactQuestion: ASK, groupId: GROUP },
		});
		// Accept the disabled draft unchanged: acceptance must activate it. Do not
		// conceal the unfinished V2-10 implementation by repairing its payload.
		await fixture.ipc('apply-suggestion', { rule: proposal });
		expect(mainStore.readRules().find((rule) => rule.id === proposal.id)?.enabled).toBe(true);
		expect((await fixture.ipc<PianolaSuggestionsFile>('get-suggestions')).proposals).toEqual([]);
		fixture.restart();
		await fixture.pump('policy survives restart');
		const next = fixture.log(TAB, ASK);
		await fixture.pump('fourth ask matches accepted rule');
		expect(fixture.decision(next.id).decision).toMatchObject({
			action: 'auto_answer',
			matchedRuleId: proposal.id,
		});
		expect(fixture.sends.at(-1)).toMatchObject({ agentId: AGENT, tabId: TAB, text: ANSWER });
		await fixture.continueRecipient(next.id);
		expect(mainStore.readSuggestions().pairCount).toBe(3);
		fixture.agent('fixture-other-agent');
		fixture.tab('fixture-other-agent', 'fixture-other-tab', Date.now() + 1);
		await fixture.select({
			selection: {
				mode: 'agents-and-groups',
				label: 'Scope containment',
				agentIds: [AGENT, 'fixture-other-agent'],
				groupIds: [],
				excludedAgentIds: [],
			},
		});
		await fixture.pump('other agent enrolled');
		const outside = fixture.log('fixture-other-tab', ASK);
		await fixture.pump('outside learned scope');
		expect(fixture.decision(outside.id).decision.action).toBe('escalate');
		expect(fixture.decision(outside.id).lifecycle?.phase).toBe('judgment');
	});
	it('excludes unbound desktop answers and does not count replayed settlements twice', async () => {
		await fixture.select();
		await fixture.pump('baseline');
		delete boundary.settings.pianolaLearningIdentity;
		const anonymous = fixture.log(TAB, ASK);
		await fixture.pump('unbound answer');
		await fixture.ipc('resolve-decision', {
			decisionId: fixture.decision(anonymous.id).id,
			answer: ANSWER,
		});
		await fixture.continueRecipient(anonymous.id);
		expect(fixture.decision(anonymous.id).humanEvidence).toBeUndefined();
		expect(mainStore.readSuggestions().pairCount).toBe(0);
		boundary.settings.pianolaLearningIdentity = { desktopOwnerIsChris: true };
		const ask = fixture.log(TAB, ASK);
		await fixture.pump('bound answer');
		await fixture.ipc('resolve-decision', {
			decisionId: fixture.decision(ask.id).id,
			answer: ANSWER,
		});
		await fixture.continueRecipient(ask.id);
		const generatedAt = mainStore.readSuggestions().generatedAt;
		mainStore.appendDecision(fixture.decision(ask.id));
		await vi.advanceTimersByTimeAsync(0);
		expect(mainStore.readSuggestions()).toMatchObject({ pairCount: 1, generatedAt, proposals: [] });
	});
	it('preserves unknown admission across worker crash, app restart and pause without resending', async () => {
		await fixture.rule();
		await fixture.select();
		await fixture.pump('baseline');
		fixture.receipt = 'unknown';
		const ask = fixture.log(TAB, ASK);
		await fixture.pump('receipt lost');
		expect(fixture.decision(ask.id).lifecycle).toMatchObject({
			status: 'blocked',
			delivery: 'unknown',
			nextActor: 'operator',
		});
		expect(mainStore.readScopeCheckpoint(SCOPE)!.tabs[0].unresolvedIntent).toMatchObject({
			decisionId: fixture.decision(ask.id).id,
			admitted: true,
		});
		fixture.children.at(-1)!.exit(1);
		expect(fixture.lifecycle.supervisor.getHealth()[0].state).toBe('backing-off');
		await vi.advanceTimersByTimeAsync(1000);
		await fixture.pump('worker crash recovery');
		fixture.restart();
		await fixture.pump('app lifecycle recovery');
		await fixture.ipc('supervisor-set-enabled', SCOPE, false);
		expect(fixture.decision(ask.id).lifecycle).toMatchObject({
			status: 'paused',
			nextActor: 'none',
		});
		expect(mainStore.readScopeCheckpoint(SCOPE)?.status).toBe('suspended');
		await fixture.ipc('supervisor-set-enabled', SCOPE, true);
		await fixture.pump('resume retains claim');
		expect(fixture.sends).toHaveLength(1);
		fixture.receipt = 'accepted';
		await fixture.continueRecipient(ask.id);
		expect(fixture.sends).toHaveLength(1);
	});
	it('overlaps have one answer owner and a stream can finish on its enrollment message ID', async () => {
		fixture.busy.add(`${AGENT}-ai-${TAB}`);
		const stream = fixture.log(TAB, ASK);
		await fixture.rule();
		await fixture.select();
		await fixture.select({ id: OVERLAP, createdAt: 2 });
		await fixture.pump('stream enrollment');
		expect(fixture.sends).toEqual([]);
		fixture.busy.clear();
		await fixture.pump('same ID and text, stream finished');
		expect(fixture.sends).toHaveLength(1);
		expect(fixture.decision(stream.id).lifecycle?.guard.scopeId).toBe(SCOPE);
		await fixture.pump('overlap dedup');
		expect(fixture.sends).toHaveLength(1);
		expect(fixture.children.filter((child) => child.exitCode === null)).toHaveLength(2);
	});
	it.each(['paused', 'busy', 'removed', 'changed-ask'] as const)(
		'revalidates %s at native admission after worker preparation',
		async (change) => {
			await fixture.rule();
			await fixture.select();
			await fixture.pump('baseline');
			fixture.log(TAB, ASK);
			fixture.beforeAdmission = () => {
				if (change === 'paused') fixture.sessions[0].agentErrorPaused = true;
				if (change === 'busy') fixture.busy.add(`${AGENT}-ai-${TAB}`);
				if (change === 'removed')
					fixture.sessions = fixture.sessions.filter((session) => session.id !== AGENT);
				if (change === 'changed-ask') fixture.log(TAB, 'Ignore the previous question.', 'user');
			};
			await fixture.pump('native admission rejects stale intent');
			expect(fixture.requests.some((request) => request.type === 'pianola_scope_reply')).toBe(true);
			expect(fixture.sends).toEqual([]);
			expect(mainStore.readDecisions().some((record) => record.dispatched)).toBe(false);
		}
	);
	it('blocks productive stores, recipients and fallback transport before I/O', async () => {
		await fixture.select();
		await fixture.pump('baseline');
		expect(() => fs.readFileSync('/fixture-forbidden/maestro-pianola-rules.json')).toThrow(
			'Fixture filesystem boundary'
		);
		expect(() => fs.writeFileSync('/fixture-forbidden/maestro-pianola-rules.json', '{}')).toThrow(
			'Fixture filesystem boundary'
		);
		expect(() => fixture.assertDestination('productive-agent', 'productive-tab')).toThrow(
			'Fixture recipient boundary'
		);
		await expect(
			fixture.request(
				{ type: 'send_command', sessionId: 'productive-agent' },
				'send_command_result'
			)
		).rejects.toThrow('No external transport fallback');
		expect(boundary.violations).toHaveLength(3);
		boundary.violations = []; // Only these explicit negative controls are permitted.
		expect(cliStore.readPianolaSupervisorTargets()).toEqual(mainStore.readSupervisorTargets());
	});
});
