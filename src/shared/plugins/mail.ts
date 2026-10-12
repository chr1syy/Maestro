import { PLUGIN_ID_PATTERN } from './plugin-manifest';
/** Host-owned, read-only mail boundary. References are coordinates, never authority. */
export interface MailReference {
	readonly accountId: string;
	readonly accountRevision: number;
	readonly mailbox: string;
	readonly uidValidity: string;
	readonly uid: string;
}

export const MAIL_ERROR_MESSAGES = {
	MAIL_DENIED: 'Mail access denied.',
	MAIL_INVALID: 'Invalid mail request.',
	MAIL_STALE: 'Mail reference is no longer valid.',
	MAIL_UNAVAILABLE: 'Mail service unavailable.',
	MAIL_TIMEOUT: 'Mail request timed out.',
	MAIL_CANCELED: 'Mail request canceled.',
	MAIL_PROTOCOL: 'Unsupported or invalid mail response.',
	MAIL_LIMIT: 'Mail request exceeds a limit.',
} as const;
export type MailErrorCode = keyof typeof MAIL_ERROR_MESSAGES;
export type MailResult<T> =
	| { readonly ok: true; readonly value: T }
	| {
			readonly ok: false;
			readonly error: { readonly code: MailErrorCode; readonly message: string };
	  };
export interface MailAccountView {
	readonly accountId: string;
	readonly revision: number;
	readonly enabled: boolean;
	readonly mailboxes: readonly string[];
	/** No credential lookup or login is performed by listAccounts. */
	readonly status: 'disabled' | 'unknown' | 'stopped';
	readonly credentialStatus: 'unknown';
	/** Stored counts only, without agent identities or effective-right claims. */
	readonly agentGrantCounts: Readonly<{ read: number; detail: number; attachments: number }>;
}
export interface MailHeaders {
	readonly reference: MailReference;
	readonly subject?: string;
	readonly sender?: string;
}
export interface MailBody {
	readonly reference: MailReference;
	readonly mimeType: 'text/plain';
	readonly text: string;
	readonly sizeBytes: number;
}
export interface MailAttachment {
	readonly partId: string;
	readonly filename: string;
	readonly mimeType:
		| 'text/plain'
		| 'application/pdf'
		| 'image/png'
		| 'image/jpeg'
		| 'image/gif'
		| 'image/webp';
	readonly sizeBytes: number;
}
export interface MailSearchRequest {
	readonly invocationId: string;
	readonly accountId: string;
	readonly accountRevision: number;
	readonly mailbox: string;
	readonly fromUid: string;
	readonly toUid: string;
	readonly uidValidity?: string;
	readonly text?: string;
	readonly limit?: number;
}
export interface MailPage {
	readonly uidValidity: string;
	readonly references: readonly MailReference[];
	readonly truncated: boolean;
	readonly nextAfterUid?: string;
}
export interface MailChunk {
	readonly dataBase64: string;
	readonly nextOffset: number;
	readonly complete: boolean;
}
export interface MaestroMailApi {
	requestSetup(
		intent?:
			| { action: 'add' }
			| { action: 'test' | 'rights' | 'disable' | 'remove'; accountId: string }
	): Promise<MailResult<{ requested: true }>>;
	listAccounts(): Promise<MailResult<readonly MailAccountView[]>>;
	readHeaders(p: {
		invocationId: string;
		reference: MailReference;
	}): Promise<MailResult<MailHeaders>>;
	searchHeaders(p: MailSearchRequest): Promise<MailResult<MailPage>>;
	readBody(p: { invocationId: string; reference: MailReference }): Promise<MailResult<MailBody>>;
	listAttachments(p: {
		invocationId: string;
		reference: MailReference;
	}): Promise<MailResult<readonly MailAttachment[]>>;
	openAttachment(p: {
		invocationId: string;
		reference: MailReference;
		partId: string;
	}): Promise<MailResult<MailAttachment & { snapshotId: string }>>;
	readAttachment(p: {
		invocationId: string;
		accountId: string;
		snapshotId: string;
		offset: number;
		limit?: number;
	}): Promise<MailResult<MailChunk>>;
	closeAttachment(p: {
		invocationId: string;
		accountId: string;
		snapshotId: string;
	}): Promise<MailResult<{ closed: true }>>;
}

/** Exact seven-field Relay adapter projection. Producer provenance lives in Cue's envelope. */
export interface RelayMailMetadata {
	readonly reference: string;
	readonly accountId: string;
	readonly folder: string;
	readonly uidValidity: string;
	readonly uid: string;
	readonly receivedAt: number;
	readonly sizeBytes: number;
}

/** Closed user configuration for a host-supervised metadata-only Cue source. */
export function parseCueMailSource(value: unknown): import('../cue/contracts').CueMailSource {
	if (
		!value ||
		typeof value !== 'object' ||
		Array.isArray(value) ||
		![Object.prototype, null].includes(Object.getPrototypeOf(value))
	)
		throw new Error('InvalidMailSource');
	const keys = ['plugin_id', 'account_id', 'account_revision', 'mailbox', 'interval_minutes'];
	const fields = Object.getOwnPropertyDescriptors(value);
	if (
		Reflect.ownKeys(value).length !== keys.length ||
		keys.some((key) => !fields[key] || !('value' in fields[key]))
	)
		throw new Error('InvalidMailSource');
	const raw = Object.fromEntries(keys.map((key) => [key, fields[key].value]));
	if (
		typeof raw.plugin_id !== 'string' ||
		raw.plugin_id.length < 3 ||
		raw.plugin_id.length > 100 ||
		!PLUGIN_ID_PATTERN.test(raw.plugin_id) ||
		typeof raw.account_id !== 'string' ||
		!/^[0-9a-f]{32}$/.test(raw.account_id) ||
		!Number.isSafeInteger(raw.account_revision) ||
		raw.account_revision < 1 ||
		typeof raw.mailbox !== 'string' ||
		!raw.mailbox ||
		raw.mailbox.length > 256 ||
		/[^\x20-\x7e]/.test(raw.mailbox) ||
		!Number.isSafeInteger(raw.interval_minutes) ||
		raw.interval_minutes < 1 ||
		raw.interval_minutes > 10080
	)
		throw new Error('InvalidMailSource');
	return Object.freeze(raw) as import('../cue/contracts').CueMailSource;
}
