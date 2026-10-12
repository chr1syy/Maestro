/**
 * Host-private configuration schema only. Parsing is NOT authorization.
 * Persistence and grants belong to the canonical authorization ledger.
 * No disk, keyring, setup, SDK or mail I/O here.
 */
import { randomBytes } from 'crypto';
import { parseJsonWithBom } from '../../shared/jsonUtils';
import { PLUGIN_ID_PATTERN } from '../../shared/plugins/plugin-manifest';
import {
	assertImapUid,
	assertImapQuotedString,
	prepareImapCommand,
	IMAP_COMMAND_LIMITS,
} from './mail-imap-commands';
import { MAIL_MIME_STRUCTURE_LIMITS } from './mail-mime-structure';
import {
	ImapConnectionError,
	validateConfiguredImapEndpoint,
	type ConfiguredImapEndpoint,
} from './mail-imap-connection';

export const MAIL_ACCOUNT_CONFIG_LIMITS = Object.freeze({
	version: 1,
	bytes: 512 * 1024,
	accounts: 32,
	mailboxes: 32,
	tombstones: 1024,
});

export interface MailAccountSettings {
	readonly endpoint: ConfiguredImapEndpoint;
	readonly username: string;
	readonly mailboxes: readonly string[];
}

/** Enabled is stored user intent, never sufficient to open a session. */
export interface PrivateMailAccount extends MailAccountSettings {
	readonly accountId: string;
	readonly revision: number;
	readonly enabled: boolean;
}

/** Historical native absence only; never credential readiness or authorization. */
export type MailCredentialCleanupState = 'pending' | 'confirmedAbsent';

export interface MailAccountTombstone {
	readonly accountId: string;
	readonly revision: number;
	readonly credentialCleanup: MailCredentialCleanupState;
}

export interface MailAccountConfiguration {
	readonly version: 1;
	readonly installationId: string;
	readonly pluginId: string;
	readonly accounts: readonly PrivateMailAccount[];
	readonly tombstones: readonly MailAccountTombstone[];
}

function invalid(): never {
	throw new ImapConnectionError('MAIL_INVALID');
}

/** Closed data fields only: no inherited fields, accessors, symbols or hidden keys. */
export function mailRecord(
	value: unknown,
	required: readonly string[],
	optional: readonly string[] = []
): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) invalid();
	if (Reflect.ownKeys(value).length > required.length + optional.length) invalid();
	const fields = Object.getOwnPropertyDescriptors(value);
	const result: Record<string, unknown> = Object.create(null);
	for (const key of Reflect.ownKeys(fields)) {
		if (typeof key !== 'string' || (!required.includes(key) && !optional.includes(key))) invalid();
		const field = fields[key];
		if (!field.enumerable || !Object.hasOwn(field, 'value')) invalid();
		result[key] = field.value;
	}
	if (required.some((key) => !Object.hasOwn(result, key))) invalid();
	return result;
}

/** Dense bounded arrays; copy data descriptors without evaluating array getters. */
export function mailList(value: unknown, max: number): unknown[] {
	if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) invalid();
	const length = Object.getOwnPropertyDescriptor(value, 'length')?.value;
	if (!Number.isSafeInteger(length) || length < 0 || length > max) invalid();
	const fields = Object.getOwnPropertyDescriptors(value);
	if (Reflect.ownKeys(fields).length !== length + 1) invalid();
	const result: unknown[] = [];
	for (let index = 0; index < length; index++) {
		const field = fields[String(index)];
		if (!field || !field.enumerable || !Object.hasOwn(field, 'value')) invalid();
		result.push(field.value);
	}
	return result;
}

function opaqueId(value: unknown): string {
	if (typeof value !== 'string' || !/^[0-9a-f]{32}$/.test(value)) invalid();
	return value;
}

function revision(value: unknown): number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) invalid();
	return value;
}

/** Canonical syntax only; exported aliases confer no account ownership or authority. */
export { opaqueId as parseMailAccountId, revision as parseMailAccountRevision };

/** Navigation only: these labels never authorize their named operations. */
export type MailSetupNavigationIntent = Readonly<
	{ action: 'add' } | { action: 'test' | 'rights' | 'disable' | 'remove'; accountId: string }
>;

/** Closed entry request, snapshotted before invoking any live host authority. */
export function parseMailSetupNavigation(value: unknown): MailSetupNavigationIntent {
	try {
		const raw = mailRecord(value, ['action'], ['accountId']);
		if (raw.action === 'add') {
			if (Object.hasOwn(raw, 'accountId')) invalid();
			return Object.freeze({ action: 'add' });
		}
		if (
			raw.action !== 'test' &&
			raw.action !== 'rights' &&
			raw.action !== 'disable' &&
			raw.action !== 'remove'
		)
			invalid();
		return Object.freeze({ action: raw.action, accountId: opaqueId(raw.accountId) });
	} catch {
		invalid();
	}
}

/** Exact immutable message coordinates only; parsing confers no read authority. */
export type MailMessageReference = Readonly<{
	accountId: string;
	accountRevision: number;
	mailbox: string;
	uidValidity: string;
	uid: string;
}>;

/** Shared by the private reader and verified completion facade, before any await. */
export function parseMailMessageReference(value: unknown): MailMessageReference {
	const raw = mailRecord(value, ['accountId', 'accountRevision', 'mailbox', 'uidValidity', 'uid']);
	const accountId = opaqueId(raw.accountId);
	const accountRevision = revision(raw.accountRevision);
	assertImapQuotedString(raw.mailbox, IMAP_COMMAND_LIMITS.mailbox);
	assertImapUid(raw.uidValidity);
	assertImapUid(raw.uid);
	return Object.freeze({
		accountId,
		accountRevision,
		mailbox: raw.mailbox,
		uidValidity: raw.uidValidity,
		uid: raw.uid,
	});
}

/** Closed immutable fixed-search criteria only; parsing confers no authority. */
export function parseMailSearchCriteria(value: unknown): Readonly<{
	accountId: string;
	accountRevision: number;
	mailbox: string;
	fromUid: string;
	toUid: string;
	uidValidity?: string;
	text?: string;
}> {
	const raw = mailRecord(
		value,
		['accountId', 'accountRevision', 'mailbox', 'fromUid', 'toUid'],
		['uidValidity', 'text']
	);
	const accountId = opaqueId(raw.accountId);
	const accountRevision = revision(raw.accountRevision);
	assertImapQuotedString(raw.mailbox, IMAP_COMMAND_LIMITS.mailbox);
	assertImapUid(raw.fromUid);
	assertImapUid(raw.toUid);
	if (Object.hasOwn(raw, 'uidValidity')) assertImapUid(raw.uidValidity);
	if (Object.hasOwn(raw, 'text')) assertImapQuotedString(raw.text, IMAP_COMMAND_LIMITS.searchText);
	const criteria = Object.freeze({
		accountId,
		accountRevision,
		mailbox: raw.mailbox,
		fromUid: raw.fromUid,
		toUid: raw.toUid,
		...(Object.hasOwn(raw, 'uidValidity') ? { uidValidity: raw.uidValidity as string } : {}),
		...(Object.hasOwn(raw, 'text') ? { text: raw.text as string } : {}),
	});
	// Validate ordered range/fixed grammar before I/O; never write or retain this buffer.
	prepareImapCommand('A1', {
		kind: 'search',
		fromUid: criteria.fromUid,
		toUid: criteria.toUid,
		...(Object.hasOwn(criteria, 'text') ? { text: criteria.text } : {}),
	}).bytes.fill(0);
	return criteria;
}

/** Exact complete-part selection only; numeric paths are never capabilities. */
export function parseMailAttachmentReference(
	value: unknown
): MailMessageReference & Readonly<{ partId: string }> {
	const raw = mailRecord(value, [
		'accountId',
		'accountRevision',
		'mailbox',
		'uidValidity',
		'uid',
		'partId',
	]);
	const { partId, ...coordinates } = raw;
	const reference = parseMailMessageReference(coordinates);
	// Bound before splitting, using the same tree/numeric limits as the actual reader.
	assertImapQuotedString(
		partId,
		MAIL_MIME_STRUCTURE_LIMITS.depth * (String(MAIL_MIME_STRUCTURE_LIMITS.nodes).length + 1) - 1
	);
	const segments = partId.split('.');
	if (segments.length > Math.max(1, MAIL_MIME_STRUCTURE_LIMITS.depth - 1)) invalid();
	for (const segment of segments) {
		assertImapUid(segment);
		if (Number(segment) > MAIL_MIME_STRUCTURE_LIMITS.nodes) invalid();
	}
	return Object.freeze({ ...reference, partId });
}

/** Closed immutable settings snapshot; parsing never creates authority or an account ID. */
export function parseMailAccountSettings(value: unknown): MailAccountSettings {
	const raw = mailRecord(value, ['endpoint', 'username', 'mailboxes']);
	const endpoint = mailRecord(raw.endpoint, ['host', 'port', 'tls'], ['allowNonstandardPort']);
	if (
		typeof endpoint.host !== 'string' ||
		typeof endpoint.port !== 'number' ||
		endpoint.tls !== true ||
		(Object.hasOwn(endpoint, 'allowNonstandardPort') &&
			typeof endpoint.allowNonstandardPort !== 'boolean')
	)
		invalid();
	const checkedEndpoint = validateConfiguredImapEndpoint({
		host: endpoint.host,
		port: endpoint.port,
		tls: true,
		...(Object.hasOwn(endpoint, 'allowNonstandardPort')
			? { allowNonstandardPort: endpoint.allowNonstandardPort as boolean }
			: {}),
	});
	assertImapQuotedString(raw.username, IMAP_COMMAND_LIMITS.username);
	const mailboxes = mailList(raw.mailboxes, MAIL_ACCOUNT_CONFIG_LIMITS.mailboxes).map((mailbox) => {
		assertImapQuotedString(mailbox, IMAP_COMMAND_LIMITS.mailbox);
		return mailbox;
	});
	// Preserve exact case, whitespace and ampersands; no conflating mailbox names.
	if (!mailboxes.length || new Set(mailboxes).size !== mailboxes.length) invalid();
	return Object.freeze({
		endpoint: checkedEndpoint,
		username: raw.username,
		mailboxes: Object.freeze(mailboxes),
	});
}

/** Future trusted setup only; admission must also check ID collisions/tombstones. */
export function createDisabledMailAccount(value: unknown): PrivateMailAccount {
	try {
		return Object.freeze({
			...parseMailAccountSettings(value),
			accountId: randomBytes(16).toString('hex'),
			revision: 1,
			enabled: false,
		});
	} catch {
		invalid();
	}
}

/** Shared exact-revision guard; pure stored views may permit terminal revisions. */
export function requireMailAccountRevision(
	configuration: MailAccountConfiguration | null,
	accountId: unknown,
	expectedRevision: unknown,
	allowTerminalRevision = false
): PrivateMailAccount {
	const id = opaqueId(accountId);
	const expected = revision(expectedRevision);
	const account = configuration?.accounts.find((a) => a.accountId === id);
	if (!account) throw new ImapConnectionError('MAIL_DENIED');
	if (account.revision !== expected) throw new ImapConnectionError('MAIL_STALE');
	if (!allowTerminalRevision && account.revision >= Number.MAX_SAFE_INTEGER)
		throw new ImapConnectionError('MAIL_LIMIT');
	return account;
}

/** Cleanup never advances or drops removal history, including the maximum revision. */
export function requireMailAccountTombstoneRevision(
	configuration: MailAccountConfiguration | null,
	accountId: unknown,
	expectedRevision: unknown
): MailAccountTombstone {
	const id = opaqueId(accountId);
	const expected = revision(expectedRevision);
	const tombstone = configuration?.tombstones.find((a) => a.accountId === id);
	if (!tombstone || configuration?.accounts.some((a) => a.accountId === id))
		throw new ImapConnectionError('MAIL_DENIED');
	if (tombstone.revision !== expected) throw new ImapConnectionError('MAIL_STALE');
	return tombstone;
}

/** Stored mutation intent only; parsing confers no setup or mutation authority. */
export type MailAccountMutation = Readonly<
	{ accountId: string; expectedRevision: number } & (
		| { kind: 'disable' | 'remove' }
		| { kind: 'replaceSettings'; settings: MailAccountSettings }
	)
>;

/** Capture the entire closed request before live host callbacks or freshness work. */
export function parseMailAccountMutation(value: unknown): MailAccountMutation {
	try {
		const raw = mailRecord(value, ['kind', 'accountId', 'expectedRevision'], ['settings']);
		if (
			(raw.kind !== 'disable' && raw.kind !== 'replaceSettings' && raw.kind !== 'remove') ||
			Object.hasOwn(raw, 'settings') !== (raw.kind === 'replaceSettings')
		)
			invalid();
		const accountId = opaqueId(raw.accountId);
		const expectedRevision = revision(raw.expectedRevision);
		return raw.kind === 'replaceSettings'
			? Object.freeze({
					kind: raw.kind,
					accountId,
					expectedRevision,
					settings: parseMailAccountSettings(raw.settings),
				})
			: Object.freeze({ kind: raw.kind, accountId, expectedRevision });
	} catch {
		invalid();
	}
}

/** Pure stored-state transition. Live lifecycle must cancel BEFORE committing it. */
export function changeMailAccountConfiguration(
	configuration: MailAccountConfiguration,
	value: unknown
): { readonly accountId: string; readonly configuration: MailAccountConfiguration } {
	try {
		const raw = parseMailAccountMutation(value);
		const account = requireMailAccountRevision(configuration, raw.accountId, raw.expectedRevision);
		const nextRevision = account.revision + 1;
		let accounts: readonly PrivateMailAccount[];
		let tombstones = configuration.tombstones;
		if (raw.kind === 'remove') {
			// Never trim history: evicting a tombstone would allow an ID to be reused.
			if (tombstones.length >= MAIL_ACCOUNT_CONFIG_LIMITS.tombstones)
				throw new ImapConnectionError('MAIL_LIMIT');
			accounts = configuration.accounts.filter((a) => a.accountId !== account.accountId);
			tombstones = [
				...tombstones,
				{ accountId: account.accountId, revision: nextRevision, credentialCleanup: 'pending' },
			];
		} else {
			const replacement = {
				...account,
				...(raw.kind === 'replaceSettings' ? raw.settings : {}),
				revision: nextRevision,
				enabled: false,
			};
			accounts = configuration.accounts.map((a) =>
				a.accountId === account.accountId ? replacement : a
			);
		}
		return Object.freeze({
			accountId: account.accountId,
			configuration: parseMailAccountConfiguration(
				JSON.stringify({ ...configuration, accounts, tombstones })
			),
		});
	} catch (error) {
		throw new ImapConnectionError(
			error instanceof ImapConnectionError ? error.code : 'MAIL_INVALID'
		);
	}
}

/** Bound decoded JSON before parsing; no missing/corrupt-state empty-store fallback. */
export function parseMailAccountConfiguration(serialized: unknown): MailAccountConfiguration {
	try {
		if (
			typeof serialized !== 'string' ||
			serialized.length > MAIL_ACCOUNT_CONFIG_LIMITS.bytes ||
			Buffer.byteLength(serialized, 'utf8') > MAIL_ACCOUNT_CONFIG_LIMITS.bytes
		)
			invalid();
		const raw = mailRecord(parseJsonWithBom(serialized), [
			'version',
			'installationId',
			'pluginId',
			'accounts',
			'tombstones',
		]);
		if (raw.version !== MAIL_ACCOUNT_CONFIG_LIMITS.version) invalid();
		const installationId = opaqueId(raw.installationId);
		if (
			typeof raw.pluginId !== 'string' ||
			raw.pluginId.length < 3 ||
			raw.pluginId.length > 100 ||
			!PLUGIN_ID_PATTERN.test(raw.pluginId)
		)
			invalid();
		const ids = new Set<string>();
		const claimId = (value: unknown): string => {
			const id = opaqueId(value);
			if (ids.has(id)) invalid();
			ids.add(id);
			return id;
		};
		const accounts = mailList(raw.accounts, MAIL_ACCOUNT_CONFIG_LIMITS.accounts).map((value) => {
			const account = mailRecord(value, [
				'accountId',
				'revision',
				'enabled',
				'endpoint',
				'username',
				'mailboxes',
			]);
			if (typeof account.enabled !== 'boolean') invalid();
			return Object.freeze({
				...parseMailAccountSettings({
					endpoint: account.endpoint,
					username: account.username,
					mailboxes: account.mailboxes,
				}),
				accountId: claimId(account.accountId),
				revision: revision(account.revision),
				enabled: account.enabled,
			});
		});
		const tombstones = mailList(raw.tombstones, MAIL_ACCOUNT_CONFIG_LIMITS.tombstones).map(
			(value) => {
				const tombstone = mailRecord(value, ['accountId', 'revision'], ['credentialCleanup']);
				// Legacy history has no native outcome proof. Explicit invalid values fail closed.
				const credentialCleanup = Object.hasOwn(tombstone, 'credentialCleanup')
					? tombstone.credentialCleanup
					: 'pending';
				if (credentialCleanup !== 'pending' && credentialCleanup !== 'confirmedAbsent') invalid();
				return Object.freeze({
					accountId: claimId(tombstone.accountId),
					revision: revision(tombstone.revision),
					credentialCleanup,
				});
			}
		);
		return Object.freeze({
			version: 1,
			installationId,
			pluginId: raw.pluginId,
			accounts: Object.freeze(accounts),
			tombstones: Object.freeze(tombstones),
		});
	} catch {
		// Do not attach peer/native/parser errors, paths, settings or serialized input.
		invalid();
	}
}
