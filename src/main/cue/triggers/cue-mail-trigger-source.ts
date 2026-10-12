import { parseCueMailSource } from '../../../shared/plugins/mail';
import * as fs from 'fs';
import { createKeyedWriteQueue, atomicWriteJson } from '../../utils/atomic-json-store';
import type { CueEvent, CueMailSource, CueSubscription } from '../../../shared/cue/contracts';
import type { CueTriggerSource, CueTriggerSourceContext } from './cue-trigger-source';
import { passesFilter } from './cue-trigger-filter';
import { DURATION_MS } from '../../../shared/duration';

export interface MailCueHost {
	poll(
		source: CueMailSource,
		agentId: string,
		afterUid: string | undefined,
		uidValidity: string | undefined,
		signal: AbortSignal
	): Promise<{ events: readonly CueEvent[]; checkpoint?: Checkpoint }>;
	authorize(event: CueEvent, agentId: string, subscriptionName: string, queued?: boolean): boolean;
	checkpointPath: string;
}
let host: MailCueHost | undefined;
const writes = createKeyedWriteQueue();

/** Desktop main only. Standalone engines deny mail while no authority is injected. */
export function configureMailCueHost(value: MailCueHost | undefined): void {
	host = value;
}
export function authorizeMailCueEvent(
	event: CueEvent,
	agentId: string,
	subscriptionName: string,
	queued = true
): boolean {
	if (event.type !== 'relay.mail.received') return event.mailSource === undefined;
	try {
		return host?.authorize(event, agentId, subscriptionName, queued) === true;
	} catch {
		return false;
	}
}

interface Checkpoint {
	uidValidity: string;
	uid: string;
}
function loadCheckpoints(file: string): Record<string, Checkpoint> {
	try {
		const stat = fs.statSync(file);
		if (stat.size > 256 * 1024) throw new Error('MailCheckpointLimit');
		const value: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
		if (
			!value ||
			typeof value !== 'object' ||
			Array.isArray(value) ||
			Object.keys(value).length > 512
		)
			throw new Error('MailCheckpointInvalid');
		for (const [key, entry] of Object.entries(value)) {
			if (
				key.length > 2048 ||
				!entry ||
				typeof entry !== 'object' ||
				Array.isArray(entry) ||
				Object.keys(entry).sort().join(',') !== 'uid,uidValidity' ||
				![entry.uid, entry.uidValidity].every(
					(v) => typeof v === 'string' && /^[1-9][0-9]{0,9}$/.test(v) && Number(v) <= 4294967295
				)
			)
				throw new Error('MailCheckpointInvalid');
		}
		return value as Record<string, Checkpoint>;
	} catch (error) {
		if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return {};
		throw new Error('MailCheckpointUnavailable');
	}
}

/** One checkpoint owner per consumer. Receipt follows accepted Cue admission; crash before receipt may duplicate delivery. */
export function createCueMailTriggerSource(ctx: CueTriggerSourceContext): CueTriggerSource | null {
	let source: CueMailSource;
	try {
		source = parseCueMailSource(ctx.subscription.mail);
	} catch {
		return null;
	}
	let controller: AbortController | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;
	let busy = false;
	const key = JSON.stringify([
		ctx.session.id,
		ctx.subscription.name,
		source.plugin_id,
		source.account_id,
		source.account_revision,
		source.mailbox,
	]);
	const poll = async (): Promise<void> => {
		const ownedHost = host,
			owner = controller;
		if (!ownedHost || !owner || owner.signal.aborted || busy || !ctx.enabled()) return;
		busy = true;
		try {
			const previous = loadCheckpoints(ownedHost.checkpointPath)[key];
			const result = await ownedHost.poll(
				source,
				ctx.session.id,
				previous?.uid,
				previous?.uidValidity,
				owner.signal
			);
			for (const event of result.events) {
				if (owner.signal.aborted || host !== ownedHost || !ctx.enabled()) return;
				if (!ownedHost.authorize(event, ctx.session.id, ctx.subscription.name)) return;
				const payload = event.payload;
				const accepted = passesFilter(ctx.subscription, event, ctx.onLog);
				await writes.enqueue(ownedHost.checkpointPath, async () => {
					if (
						owner.signal.aborted ||
						host !== ownedHost ||
						!ctx.enabled() ||
						!ownedHost.authorize(event, ctx.session.id, ctx.subscription.name)
					)
						return;
					const checkpoints = loadCheckpoints(ownedHost.checkpointPath);
					const current = checkpoints[key];
					if (
						current?.uidValidity === payload.uidValidity &&
						Number(current.uid) >= Number(payload.uid)
					)
						return;
					if (
						!Object.prototype.hasOwnProperty.call(checkpoints, key) &&
						Object.keys(checkpoints).length >= 512
					)
						throw new Error('MailCheckpointLimit');
					if (accepted) {
						const admitted = ctx.emit({ ...event, triggerName: ctx.subscription.name });
						if (typeof admitted !== 'number' || admitted < 1)
							throw new Error('MailDeliveryNotAccepted');
					}
					checkpoints[key] = {
						uidValidity: payload.uidValidity as string,
						uid: payload.uid as string,
					};
					await atomicWriteJson(ownedHost.checkpointPath, checkpoints);
				});
			}
			if (result.checkpoint && !owner.signal.aborted && host === ownedHost && ctx.enabled())
				await writes.enqueue(ownedHost.checkpointPath, async () => {
					if (owner.signal.aborted || host !== ownedHost || !ctx.enabled()) return;
					const checkpoints = loadCheckpoints(ownedHost.checkpointPath);
					const current = checkpoints[key];
					if (
						current?.uidValidity === result.checkpoint!.uidValidity &&
						Number(current.uid) > Number(result.checkpoint!.uid)
					)
						return;
					if (
						!Object.prototype.hasOwnProperty.call(checkpoints, key) &&
						Object.keys(checkpoints).length >= 512
					)
						throw new Error('MailCheckpointLimit');
					checkpoints[key] = result.checkpoint!;
					await atomicWriteJson(ownedHost.checkpointPath, checkpoints);
				});
		} catch {
			// No peer/native diagnostics or mailbox content in logs.
			ctx.onLog('warn', '[CUE] Mail source unavailable; checkpoint preserved');
		} finally {
			busy = false;
		}
	};
	return {
		start() {
			if (controller) return;
			controller = new AbortController();
			timer = setInterval(() => {
				void poll();
			}, source.interval_minutes * DURATION_MS.minute);
			timer.unref?.();
			void poll();
		},
		stop() {
			controller?.abort();
			controller = undefined;
			if (timer) clearInterval(timer);
			timer = undefined;
		},
		nextTriggerAt() {
			return timer ? Date.now() + source.interval_minutes * DURATION_MS.minute : null;
		},
	};
}

export function matchesMailCueSubscription(
	sub: CueSubscription,
	source: CueEvent['mailSource']
): boolean {
	return (
		sub.enabled !== false &&
		sub.event === 'relay.mail.received' &&
		!!sub.mail &&
		!!source &&
		sub.mail.plugin_id === source.pluginId &&
		sub.mail.account_id === source.accountId &&
		sub.mail.account_revision === source.accountRevision &&
		sub.mail.mailbox === source.mailbox
	);
}
