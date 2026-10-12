/** Private mail extension of the canonical ledger; stored policy, never I/O authority. */
import { randomBytes } from 'crypto';
import type { AuthIdentity } from './authorization-ledger';
import { isValidAllowlistMember } from '../../shared/plugins/permissions';
import {
	mailRecord,
	mailList,
	parseMailAccountConfiguration,
	type MailAccountConfiguration,
} from './mail-account-config';
import { ImapConnectionError } from './mail-imap-connection';

export const MAIL_LEDGER_LIMITS = Object.freeze({
	plugins: 32,
	agentsPerAccount: 128,
	plaintextBytes: 20 * 1024 * 1024,
	ciphertextBytes: 24 * 1024 * 1024,
});

export interface MailConfigurationEntry {
	readonly identity: AuthIdentity;
	readonly configuration: MailAccountConfiguration;
	readonly agentGrants: readonly MailAccountAgentGrant[];
}

export const MAIL_AGENT_RIGHTS = Object.freeze(['read', 'detail', 'attachments'] as const);
export type MailAgentRight = (typeof MAIL_AGENT_RIGHTS)[number];

export interface MailAgentRights {
	readonly agentId: string;
	readonly rights: readonly MailAgentRight[];
}

export interface MailAccountAgentGrant {
	readonly accountId: string;
	readonly accountRevision: number;
	readonly agents: readonly MailAgentRights[];
}

/** Exact stored-policy identifier syntax only; live membership requires host authority. */
export function requireMailAgentId(value: unknown): string {
	if (!isValidAllowlistMember(value) || !/^[\x21-\x7e]{1,128}$/.test(value))
		throw new ImapConnectionError('MAIL_INVALID');
	return value;
}

/** Trusted setup must additionally intersect IDs with live host agent membership. */
export function parseMailAgentRights(value: unknown): readonly MailAgentRights[] {
	const ids = new Set<string>();
	return Object.freeze(
		mailList(value, MAIL_LEDGER_LIMITS.agentsPerAccount).map((value) => {
			const raw = mailRecord(value, ['agentId', 'rights']);
			const agentId = requireMailAgentId(raw.agentId);
			if (ids.has(agentId)) throw new ImapConnectionError('MAIL_INVALID');
			ids.add(agentId);
			return Object.freeze({ agentId, rights: parseMailRights(raw.rights) });
		})
	);
}

export function parseMailRights(value: unknown, allowEmpty = false): readonly MailAgentRight[] {
	const rights = mailList(value, MAIL_AGENT_RIGHTS.length).map((right) => {
		if (!MAIL_AGENT_RIGHTS.includes(right as MailAgentRight))
			throw new ImapConnectionError('MAIL_INVALID');
		return right as MailAgentRight;
	});
	if ((!allowEmpty && !rights.length) || new Set(rights).size !== rights.length)
		throw new ImapConnectionError('MAIL_INVALID');
	return Object.freeze(rights);
}

function parseAccountAgentGrants(
	configuration: MailAccountConfiguration,
	value: unknown
): readonly MailAccountAgentGrant[] {
	const ids = new Set<string>();
	return Object.freeze(
		mailList(value, configuration.accounts.length).map((value) => {
			const raw = mailRecord(value, ['accountId', 'accountRevision', 'agents']);
			const account = configuration.accounts.find((a) => a.accountId === raw.accountId);
			if (!account || account.revision !== raw.accountRevision || ids.has(account.accountId))
				throw new ImapConnectionError('MAIL_INVALID');
			ids.add(account.accountId);
			const agents = parseMailAgentRights(raw.agents);
			if (!agents.length) throw new ImapConnectionError('MAIL_INVALID');
			return Object.freeze({
				accountId: account.accountId,
				accountRevision: account.revision,
				agents,
			});
		})
	);
}

export interface MailLedgerState {
	readonly installationId: string;
	readonly configurations: readonly MailConfigurationEntry[];
}

export function emptyMailLedgerState(): MailLedgerState {
	return Object.freeze({
		installationId: randomBytes(16).toString('hex'),
		configurations: Object.freeze([]),
	});
}

/** This stricter identity schema is only for new mail state, not legacy consent. */
export function parseMailAuthIdentity(value: unknown): AuthIdentity {
	const raw = mailRecord(value, ['contentHash', 'signatureStatus', 'signerKey']);
	if (
		typeof raw.contentHash !== 'string' ||
		!/^[0-9a-f]{64}$/.test(raw.contentHash) ||
		!['unsigned', 'untrusted', 'trusted'].includes(raw.signatureStatus as string) ||
		(raw.signatureStatus === 'unsigned'
			? raw.signerKey !== null
			: typeof raw.signerKey !== 'string' ||
				!raw.signerKey.length ||
				raw.signerKey.length > 4096 ||
				!/^[A-Za-z0-9+/=]+$/.test(raw.signerKey))
	)
		throw new ImapConnectionError('MAIL_INVALID');
	return Object.freeze({
		contentHash: raw.contentHash,
		signatureStatus: raw.signatureStatus as AuthIdentity['signatureStatus'],
		signerKey: raw.signerKey as string | null,
	});
}

/** Parse sealed JSON state into independent, closed, immutable records. */
export function parseMailLedgerState(value: unknown): MailLedgerState {
	const raw = mailRecord(value, ['installationId', 'configurations']);
	if (typeof raw.installationId !== 'string' || !/^[0-9a-f]{32}$/.test(raw.installationId))
		throw new ImapConnectionError('MAIL_INVALID');
	const plugins = new Set<string>();
	const configurations = mailList(raw.configurations, MAIL_LEDGER_LIMITS.plugins).map((value) => {
		const entry = mailRecord(value, ['identity', 'configuration'], ['agentGrants']);
		const configuration = parseMailAccountConfiguration(JSON.stringify(entry.configuration));
		if (configuration.installationId !== raw.installationId || plugins.has(configuration.pluginId))
			throw new ImapConnectionError('MAIL_INVALID');
		plugins.add(configuration.pluginId);
		return Object.freeze({
			identity: parseMailAuthIdentity(entry.identity),
			configuration,
			// Pre-grant v2 state conveys no rights. Explicit null/malformed fields fail closed.
			agentGrants: parseAccountAgentGrants(
				configuration,
				Object.prototype.hasOwnProperty.call(entry, 'agentGrants') ? entry.agentGrants : []
			),
		});
	});
	return Object.freeze({
		installationId: raw.installationId,
		configurations: Object.freeze(configurations),
	});
}
