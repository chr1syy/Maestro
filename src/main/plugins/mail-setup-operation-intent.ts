/**
 * Host-private secret-free intent schema for the dedicated setup frame.
 * Stored target validation is not authority; use the existing guarded facades later.
 */
import {
	MAIL_ACCOUNT_CONFIG_LIMITS,
	changeMailAccountConfiguration,
	mailRecord,
	parseMailAccountId,
	parseMailAccountMutation,
	parseMailAccountRevision,
	parseMailAccountSettings,
	requireMailAccountRevision,
	requireMailAccountTombstoneRevision,
	type MailAccountConfiguration,
	type MailAccountMutation,
	type MailAccountSettings,
} from './mail-account-config';
import {
	parseMailAgentRights,
	parseMailRights,
	type MailAgentRight,
	type MailAgentRights,
} from './mail-account-ledger';
import { ImapConnectionError } from './mail-imap-connection';

/** Operation names differ from navigation labels; none carries credentials or permits login. */
export type MailSetupOperationIntent =
	| Readonly<{ kind: 'addDisabled'; settings: MailAccountSettings }>
	| MailAccountMutation
	| Readonly<{
			kind: 'replacePluginRights';
			accountId: string;
			expectedRevision: number;
			rights: readonly MailAgentRight[];
	  }>
	| Readonly<{
			kind: 'enable' | 'cleanupRemoved' | 'savePassword' | 'test';
			accountId: string;
			expectedRevision: number;
	  }>
	| Readonly<{
			kind: 'replaceRights';
			accountId: string;
			expectedRevision: number;
			agents: readonly MailAgentRights[];
	  }>;

/** Capture before host callbacks; never retain the caller's records or nested arrays. */
export function parseMailSetupOperationIntent(value: unknown): MailSetupOperationIntent {
	try {
		const raw = mailRecord(
			value,
			['kind'],
			['accountId', 'expectedRevision', 'settings', 'agents', 'rights']
		);
		switch (raw.kind) {
			case 'addDisabled': {
				const fields = mailRecord(raw, ['kind', 'settings']);
				return Object.freeze({
					kind: raw.kind,
					settings: parseMailAccountSettings(fields.settings),
				});
			}
			case 'disable':
			case 'replaceSettings':
			case 'remove':
				return parseMailAccountMutation(raw);
			case 'enable':
			case 'test':
			case 'cleanupRemoved':
			case 'savePassword':
			case 'replaceRights': {
				const fields = mailRecord(raw, [
					'kind',
					'accountId',
					'expectedRevision',
					...(raw.kind === 'replaceRights' ? ['agents'] : []),
				]);
				const accountId = parseMailAccountId(fields.accountId);
				const expectedRevision = parseMailAccountRevision(fields.expectedRevision);
				return raw.kind === 'replaceRights'
					? Object.freeze({
							kind: raw.kind,
							accountId,
							expectedRevision,
							agents: parseMailAgentRights(fields.agents),
						})
					: Object.freeze({ kind: raw.kind, accountId, expectedRevision });
			}
			case 'replacePluginRights': {
				const fields = mailRecord(raw, ['kind', 'accountId', 'expectedRevision', 'rights']);
				return Object.freeze({
					kind: raw.kind,
					accountId: parseMailAccountId(fields.accountId),
					expectedRevision: parseMailAccountRevision(fields.expectedRevision),
					rights: parseMailRights(fields.rights, true),
				});
			}
			default:
				throw new ImapConnectionError('MAIL_INVALID');
		}
	} catch {
		throw new ImapConnectionError('MAIL_INVALID');
	}
}

/**
 * Pure preflight against a canonical immutable configuration from the sealed store.
 * Null means authorized empty state only when the caller actually read that store.
 * The future issuer must bind plugin/identity/installation and recheck at confirmation;
 * facades still own queued revision checks, live authority, cancellation and cleanup.
 */
export function requireMailSetupOperationTarget(
	configuration: MailAccountConfiguration | null,
	value: unknown
): MailSetupOperationIntent {
	try {
		const intent = parseMailSetupOperationIntent(value);
		if (intent.kind === 'addDisabled') {
			if (configuration && configuration.accounts.length >= MAIL_ACCOUNT_CONFIG_LIMITS.accounts)
				throw new ImapConnectionError('MAIL_LIMIT');
		} else if (intent.kind === 'cleanupRemoved') {
			requireMailAccountTombstoneRevision(configuration, intent.accountId, intent.expectedRevision);
		} else {
			const account = requireMailAccountRevision(
				configuration,
				intent.accountId,
				intent.expectedRevision
			);
			if ((intent.kind === 'enable' || intent.kind === 'savePassword') && account.enabled)
				throw new ImapConnectionError('MAIL_DENIED');
			if (
				intent.kind === 'disable' ||
				intent.kind === 'replaceSettings' ||
				intent.kind === 'remove'
			)
				// Validate transition bounds, including retained removal history, without mutation.
				changeMailAccountConfiguration(configuration!, intent);
		}
		return intent;
	} catch (error) {
		throw new ImapConnectionError(
			error instanceof ImapConnectionError ? error.code : 'MAIL_INVALID'
		);
	}
}
