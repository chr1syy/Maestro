import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMailHostFixture } from '../../../helpers/mailHostFixture';
import { createMockSession } from '../../../helpers/mockSession';
import { createMailCueHost } from '../../../../main/plugins/mail-cue-host';
import {
	configureMailCueHost,
	createCueMailTriggerSource,
	matchesMailCueSubscription,
} from '../../../../main/cue/triggers/cue-mail-trigger-source';
import { createCueSessionRegistry } from '../../../../main/cue/cue-session-registry';
import { createCueDispatchService } from '../../../../main/cue/cue-dispatch-service';
import type { CueEvent, CueSubscription } from '../../../../shared/cue/contracts';
import type { CueTriggerSource } from '../../../../main/cue/triggers/cue-trigger-source';

const fixtures: Awaited<ReturnType<typeof createMailHostFixture>>[] = [];
const sources: CueTriggerSource[] = [];
afterEach(() => {
	for (const source of sources.splice(0)) source.stop();
	configureMailCueHost(undefined);
	for (const f of fixtures.splice(0)) f.dispose();
});

async function setup() {
	const f = await createMailHostFixture();
	fixtures.push(f);
	let enabled = true,
		generation = 'c'.repeat(32);
	const mail = {
		plugin_id: f.pluginId,
		account_id: f.accountId,
		account_revision: f.reference.accountRevision,
		mailbox: 'INBOX',
		interval_minutes: 1,
	};
	const sub: CueSubscription = {
		name: 'mail-sub',
		event: 'relay.mail.received',
		enabled: true,
		prompt: 'Read approved mail metadata',
		mail,
	};
	const host = createMailCueHost({
		store: f.store,
		toolIdentity: f.runs,
		identityFor: () => f.identity,
		assertPolicyActive: (_id, identity, agent, right, account) =>
			f.store.assertStoredMailAgentRight(
				f.pluginId,
				identity,
				account,
				f.reference.accountRevision,
				agent,
				right
			),
		enabled: () => enabled,
		capturePluginLifetime: () => () => {},
		getPluginGeneration: () => generation,
		isSubscriptionActive: (_agent, name, envelope) =>
			name === sub.name && matchesMailCueSubscription(sub, envelope),
		checkpointPath: path.join(f.dir, 'checkpoint.json'),
		entryFactory: f.entryFactory,
		transport: { resolve: async () => ['93.184.216.34'], connect: f.connect },
	});
	configureMailCueHost(host);
	const executeRun = vi.fn(() => true);
	const dispatch = createCueDispatchService({
		getSessions: () => [{ id: f.agentId, name: 'Synthetic' }],
		executeRun,
		onLog: () => {},
	});
	const emitted: CueEvent[] = [],
		warnings: string[] = [];
	const makeSource = () => {
		const source = createCueMailTriggerSource({
			session: createMockSession({ id: f.agentId, name: 'Synthetic' }),
			subscription: sub,
			registry: createCueSessionRegistry(),
			enabled: () => enabled,
			onLog: (_level, message) => {
				warnings.push(message);
			},
			emit: (event) => {
				emitted.push(event);
				return dispatch.dispatchSubscription(f.agentId, sub, event, 'Synthetic');
			},
		})!;
		sources.push(source);
		return source;
	};
	return {
		f,
		host,
		mail,
		sub,
		executeRun,
		emitted,
		warnings,
		makeSource,
		restartPlugin: () => {
			generation = 'd'.repeat(32);
		},
		disable: () => {
			enabled = false;
		},
	};
}

describe('real mail source -> Cue dispatch with synthetic transport', () => {
	it('polls under sealed independent rights and dispatches only seven metadata fields', async () => {
		const s = await setup();
		s.makeSource().start();
		await vi.waitFor(() => expect(s.executeRun).toHaveBeenCalledTimes(1));
		expect(Object.keys(s.emitted[0].payload).sort()).toEqual(
			['accountId', 'folder', 'receivedAt', 'reference', 'sizeBytes', 'uid', 'uidValidity'].sort()
		);
		expect(JSON.stringify(s.emitted[0].payload)).not.toMatch(
			/synthetic-secret|subject|body|password|username/
		);
		expect(s.host.authorize(s.emitted[0], s.f.agentId, s.sub.name)).toBe(true);
		expect(
			s.host.authorize(
				{ ...s.emitted[0], payload: { ...s.emitted[0].payload, sizeBytes: 43 } },
				s.f.agentId,
				s.sub.name
			)
		).toBe(false);
		expect(s.host.authorize(s.emitted[0], 'other-agent', s.sub.name)).toBe(false);
		s.sub.enabled = false;
		expect(s.host.authorize(s.emitted[0], s.f.agentId, s.sub.name)).toBe(false);
	});
	it.each(['disabled', 'filtered', 'wrong-account', 'revoked', 'stopped'])(
		'dispatches nothing for %s',
		async (mode) => {
			const s = await setup();
			if (mode === 'disabled') s.disable();
			if (mode === 'filtered') s.sub.filter = { uid: '99' };
			if (mode === 'wrong-account') s.mail.account_id = 'b'.repeat(32);
			if (mode === 'revoked') s.f.store.revoke(s.f.pluginId);
			const source = s.makeSource();
			source.start();
			if (mode === 'stopped') source.stop();
			await new Promise((resolve) => setTimeout(resolve, 100));
			expect(s.executeRun).not.toHaveBeenCalled();
		}
	);
	it('records a durable consumer receipt and prevents dispatch after stop/start', async () => {
		const s = await setup();
		const first = s.makeSource();
		first.start();
		await vi.waitFor(() => expect(s.executeRun).toHaveBeenCalledTimes(1));
		await vi.waitFor(() => expect(fs.existsSync(s.host.checkpointPath)).toBe(true));
		first.stop();
		s.makeSource().start();
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(s.executeRun).toHaveBeenCalledTimes(1);
		s.f.store.revoke(s.f.pluginId);
		expect(s.host.authorize(s.emitted[0], s.f.agentId, s.sub.name)).toBe(false);
	});
	it('preserves the consumer checkpoint when Cue rejects admission and retries on restart', async () => {
		const s = await setup();
		s.executeRun.mockReturnValue(false);
		const first = s.makeSource();
		first.start();
		await vi.waitFor(() =>
			expect(s.warnings).toContain('[CUE] Mail source unavailable; checkpoint preserved')
		);
		first.stop();
		expect(fs.existsSync(s.host.checkpointPath)).toBe(false);
		s.executeRun.mockReturnValue(true);
		s.makeSource().start();
		await vi.waitFor(() => expect(s.executeRun).toHaveBeenCalledTimes(2));
		await vi.waitFor(() => expect(fs.existsSync(s.host.checkpointPath)).toBe(true));
	});
	it('denies fresh delivery from a stale sandbox but permits authenticated queued replay', async () => {
		const s = await setup();
		const source = s.makeSource();
		source.start();
		await vi.waitFor(() => expect(s.executeRun).toHaveBeenCalledTimes(1));
		source.stop();
		s.restartPlugin();
		expect(s.host.authorize(s.emitted[0], s.f.agentId, s.sub.name, false)).toBe(false);
		expect(s.host.authorize(s.emitted[0], s.f.agentId, s.sub.name, true)).toBe(true);
		s.f.store.revoke(s.f.pluginId);
		expect(s.host.authorize(s.emitted[0], s.f.agentId, s.sub.name, true)).toBe(false);
	});
	it('treats an absent source as no subscription and refuses corrupt durable checkpoints', async () => {
		const s = await setup();
		expect(
			createCueMailTriggerSource({
				session: createMockSession(),
				subscription: { ...s.sub, mail: undefined },
				registry: createCueSessionRegistry(),
				enabled: () => true,
				onLog: () => {},
				emit: () => {
					throw new Error('Unexpected dispatch');
				},
			})
		).toBeNull();
		fs.writeFileSync(s.host.checkpointPath, 'corrupt');
		s.makeSource().start();
		await vi.waitFor(() => expect(s.warnings.length).toBeGreaterThan(0));
		expect(s.f.connect).not.toHaveBeenCalled();
		expect(s.executeRun).not.toHaveBeenCalled();
	});
});
