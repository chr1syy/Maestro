/**
 * Host-only synchronous IMAP4rev1 command/response semantics, not an SDK API.
 * No socket, credentials lookup, logging or asynchronous session state here.
 * See RFC 3501 sections 6/7 and the documented restricted transport grammar.
 */
import { ImapConnectionError } from './mail-imap-connection';
import { IMAP_FRAMING_LIMITS, type ImapResponseFrame } from './mail-imap-framing';

export const IMAP_COMMAND_LIMITS = Object.freeze({
	username: 256,
	password: 1024,
	mailbox: 256,
	searchText: 512,
	searchUids: 1024,
	headerBytes: 64 * 1024,
	partBytes: 8 * 1024 * 1024,
});

/** One allowlist for the fixed wire section and host-private header projection. */
export const IMAP_HEADER_FIELDS = Object.freeze([
	'SUBJECT',
	'FROM',
	'TO',
	'CC',
	'DATE',
	'MESSAGE-ID',
	'IN-REPLY-TO',
	'REFERENCES',
	'MIME-VERSION',
	'CONTENT-TYPE',
	'CONTENT-TRANSFER-ENCODING',
	'CONTENT-DISPOSITION',
]);
const HEADER_SECTION = `HEADER.FIELDS (${IMAP_HEADER_FIELDS.join(' ')})`;

export type FixedImapCommand =
	| { kind: 'login'; username: string; password: string }
	| { kind: 'examine'; mailbox: string }
	| { kind: 'search'; fromUid: string; toUid: string; text?: string }
	| { kind: 'fetch'; uid: string; content: 'headers' | 'source' }
	| { kind: 'fetch'; uid: string; content: 'part'; part: string }
	| { kind: 'noop' | 'logout' };

/** LOGIN bytes contain secrets. No credential fields; erase bytes after write. */
export interface PreparedImapCommand {
	readonly tag: string;
	readonly kind: FixedImapCommand['kind'];
	readonly bytes: Buffer;
	readonly section?: string;
	readonly literalLimit?: number;
	readonly uid?: string;
	readonly fromUid?: string;
	readonly toUid?: string;
}

/** Internal results only. MIME/header projection and live grants are separate. */
export type ImapCommandResult =
	| { kind: 'status' }
	| { kind: 'examine'; uidValidity: string }
	| { kind: 'search'; uids: string[] }
	| { kind: 'fetch'; uid: string; bytes: Buffer };

function fail(code: ConstructorParameters<typeof ImapConnectionError>[0] = 'MAIL_PROTOCOL'): never {
	throw new ImapConnectionError(code);
}

/** Canonical positive IMAP identifier; also used by host-private reference readers. */
export function assertImapUid(
	value: unknown,
	code: 'MAIL_INVALID' | 'MAIL_PROTOCOL' = 'MAIL_INVALID'
): asserts value is string {
	if (typeof value !== 'string' || !/^[1-9][0-9]{0,9}$/.test(value) || Number(value) > 0xffffffff)
		fail(code);
}

/** Shared by fixed commands and private config; no normalization or wire allocation. */
export function assertImapQuotedString(
	value: unknown,
	max: number,
	allowEmpty = false
): asserts value is string {
	if (
		!Number.isSafeInteger(max) ||
		max < 0 ||
		typeof value !== 'string' ||
		value.length > max ||
		(!allowEmpty && !value.length) ||
		/[^\x20-\x7e]/.test(value)
	)
		fail('MAIL_INVALID');
}

function quote(value: string, max: number, allowEmpty = false): string {
	assertImapQuotedString(value, max, allowEmpty);
	return `"${value.replace(/["\\]/g, '\\$&')}"`;
}

function assertFields(command: FixedImapCommand, fields: string[]): void {
	if (Object.keys(command).some((key) => !fields.includes(key))) fail('MAIL_INVALID');
}

/** No arbitrary verb, command string, section expression, URL or socket write. */
export function prepareImapCommand(tag: string, command: FixedImapCommand): PreparedImapCommand {
	if (
		typeof tag !== 'string' ||
		!/^A[1-9][0-9]{0,5}$/.test(tag) ||
		!command ||
		typeof command !== 'object'
	)
		fail('MAIL_INVALID');
	let body: string;
	const expected: Omit<PreparedImapCommand, 'bytes'> = { tag, kind: command.kind };
	let details: Partial<PreparedImapCommand> = {};
	switch (command.kind) {
		case 'login':
			assertFields(command, ['kind', 'username', 'password']);
			body = `LOGIN ${quote(command.username, IMAP_COMMAND_LIMITS.username)} ${quote(command.password, IMAP_COMMAND_LIMITS.password, true)}`;
			break;
		case 'examine':
			assertFields(command, ['kind', 'mailbox']);
			// ASCII mailbox names only; literal ampersands use modified UTF-7 &-.
			quote(command.mailbox, IMAP_COMMAND_LIMITS.mailbox);
			body = `EXAMINE ${quote(command.mailbox.replace(/&/g, '&-'), IMAP_COMMAND_LIMITS.mailbox * 2)}`;
			break;
		case 'search':
			assertFields(command, ['kind', 'fromUid', 'toUid', 'text']);
			assertImapUid(command.fromUid);
			assertImapUid(command.toUid);
			if (Number(command.fromUid) > Number(command.toUid)) fail('MAIL_INVALID');
			body = `UID SEARCH UID ${command.fromUid}:${command.toUid}`;
			if (command.text !== undefined) {
				const text = quote(command.text, IMAP_COMMAND_LIMITS.searchText);
				body += ` OR HEADER SUBJECT ${text} HEADER FROM ${text}`;
			}
			details = { fromUid: command.fromUid, toUid: command.toUid };
			break;
		case 'fetch': {
			assertFields(
				command,
				command.content === 'part' ? ['kind', 'uid', 'content', 'part'] : ['kind', 'uid', 'content']
			);
			assertImapUid(command.uid);
			let section: string;
			let literalLimit: number;
			if (command.content === 'headers') {
				section = HEADER_SECTION;
				literalLimit = IMAP_COMMAND_LIMITS.headerBytes;
			} else if (command.content === 'source') {
				section = '';
				literalLimit = IMAP_FRAMING_LIMITS.literalBytes;
			} else if (command.content === 'part') {
				if (
					typeof command.part !== 'string' ||
					!/^[1-9][0-9]{0,2}(?:\.[1-9][0-9]{0,2}){0,15}$/.test(command.part)
				)
					fail('MAIL_INVALID');
				section = command.part;
				literalLimit = IMAP_COMMAND_LIMITS.partBytes;
			} else fail('MAIL_INVALID');
			body = `UID FETCH ${command.uid} (UID BODY.PEEK[${section}])`;
			details = { uid: command.uid, section, literalLimit };
			break;
		}
		case 'noop':
		case 'logout':
			assertFields(command, ['kind']);
			body = command.kind.toUpperCase();
			break;
		default:
			fail('MAIL_INVALID');
	}
	return Object.freeze({
		...expected,
		...details,
		bytes: Buffer.from(`${tag} ${body}\r\n`, 'ascii'),
	});
}

/** Erase consumer-owned literals on semantic, session or authorization failure. */
export function eraseImapFrameLiterals(frames: readonly ImapResponseFrame[]): void {
	for (const frame of frames) {
		if (frame?.kind === 'data' && Array.isArray(frame.parts)) {
			for (const part of frame.parts) if (Buffer.isBuffer(part)) part.fill(0);
		}
	}
}

/** Only these rev1 response codes are understood; all extensions fail closed. */
function validateStatusCode(kind: FixedImapCommand['kind'], text: string): void {
	if (!text.startsWith('[')) return; // Ordinary human-readable text is opaque.
	const code = /^\[([A-Z-]+)(?: ([^\]]*))?\](?: |$)/i.exec(text);
	if (!code) fail();
	const name = code[1].toUpperCase();
	if (name === 'ALERT' && code[2] === undefined) return;
	if (kind !== 'examine') fail();
	if (name === 'READ-ONLY' && code[2] === undefined) return;
	if (name === 'UIDVALIDITY' || name === 'UIDNEXT' || name === 'UNSEEN') {
		assertImapUid(code[2], 'MAIL_PROTOCOL');
		return;
	}
	if (
		name === 'PERMANENTFLAGS' &&
		/^\((?:\\?[A-Za-z0-9_.*-]{1,64}(?: \\?[A-Za-z0-9_.*-]{1,64})*)?\)$/.test(code[2] ?? '')
	)
		return;
	fail();
}

/**
 * Complete command records only, including the final matching tagged status.
 * Failure erases all input literals; successful FETCH transfers its one buffer.
 * Caller still owns deadline, cancellation, UIDVALIDITY matching and authorization.
 */
export function validateImapCommandResult(
	command: PreparedImapCommand,
	frames: readonly ImapResponseFrame[]
): ImapCommandResult {
	try {
		if (!frames.length || frames.length > IMAP_FRAMING_LIMITS.responses) fail();
		const completion = frames[frames.length - 1];
		if (completion.kind !== 'status' || completion.tag !== command.tag) fail();
		if (completion.status === 'NO' || completion.status === 'BAD') fail('MAIL_UNAVAILABLE');
		if (completion.status !== 'OK') fail();
		validateStatusCode(command.kind, completion.text);
		const data: Extract<ImapResponseFrame, { kind: 'data' }>[] = [];
		let uidValidity: string | undefined;
		let bye = false;
		for (const frame of frames.slice(0, -1)) {
			if (frame.kind === 'data') {
				data.push(frame);
				continue;
			}
			if (frame.tag !== null) fail();
			validateStatusCode(command.kind, frame.text);
			if (frame.status === 'BYE' && command.kind === 'logout' && !bye) {
				bye = true;
				continue;
			}
			if (frame.status !== 'OK' || bye) fail();
			if (/^\[UIDVALIDITY(?:\s|\])/i.test(frame.text)) {
				const match = /^\[UIDVALIDITY ([1-9][0-9]{0,9})\](?: |$)/i.exec(frame.text);
				if (command.kind !== 'examine' || uidValidity || !match) fail();
				assertImapUid(match[1], 'MAIL_PROTOCOL');
				uidValidity = match[1];
			}
		}
		switch (command.kind) {
			case 'examine': {
				if (!uidValidity || !/^\[READ-ONLY\](?: |$)/i.test(completion.text)) fail();
				const names = data.map((frame) => frame.name);
				if (
					names.length !== 3 ||
					!['FLAGS', 'EXISTS', 'RECENT'].every((name) => names.includes(name))
				)
					fail();
				return { kind: 'examine', uidValidity };
			}
			case 'search': {
				if (data.length !== 1 || data[0].name !== 'SEARCH' || data[0].parts.length !== 1) fail();
				const line = data[0].parts[0];
				if (typeof line !== 'string' || !/^\* SEARCH(?: [1-9][0-9]{0,9})*$/i.test(line)) fail();
				const uids = line.split(' ').slice(2);
				if (uids.length > IMAP_COMMAND_LIMITS.searchUids) fail('MAIL_LIMIT');
				const seen = new Set<string>();
				for (const uid of uids) {
					assertImapUid(uid, 'MAIL_PROTOCOL');
					if (
						seen.has(uid) ||
						Number(uid) < Number(command.fromUid) ||
						Number(uid) > Number(command.toUid)
					)
						fail();
					seen.add(uid);
				}
				return { kind: 'search', uids: uids.sort((a, b) => Number(a) - Number(b)) };
			}
			case 'fetch':
				if (data.length === 0) fail('MAIL_STALE');
				if (data.length !== 1 || data[0].name !== 'FETCH') fail();
				return validateFetch(command, data[0]);
			case 'noop':
				if (data.some((frame) => frame.name !== 'EXISTS' && frame.name !== 'RECENT')) fail();
				return { kind: 'status' };
			case 'logout':
				if (!bye || data.length) fail();
				return { kind: 'status' };
			case 'login':
				if (data.length) fail();
				return { kind: 'status' };
			default:
				fail();
		}
	} catch (error) {
		eraseImapFrameLiterals(frames);
		throw error instanceof ImapConnectionError ? error : new ImapConnectionError('MAIL_PROTOCOL');
	}
}

/** Exactly UID + the requested BODY section, in either attribute order. */
function validateFetch(
	command: PreparedImapCommand,
	frame: Extract<ImapResponseFrame, { kind: 'data' }>
): Extract<ImapCommandResult, { kind: 'fetch' }> {
	const [prefix, before, bytes, after] = frame.parts;
	if (
		frame.parts.length !== 4 ||
		typeof prefix !== 'string' ||
		typeof before !== 'string' ||
		!Buffer.isBuffer(bytes) ||
		typeof after !== 'string'
	)
		fail();
	const marker = /\{([0-9]{1,10})\}$/.exec(before);
	if (
		!marker ||
		Number(marker[1]) !== bytes.length ||
		command.section === undefined ||
		command.uid === undefined ||
		command.literalLimit === undefined
	)
		fail();
	if (bytes.length > command.literalLimit) fail('MAIL_LIMIT');
	const section = command.section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const body = `BODY\\[${section}\\] \x00`;
	const uid = '([1-9][0-9]{0,9})';
	const expression = new RegExp(
		`^\\* [1-9][0-9]{0,9} FETCH \\((?:UID ${uid} ${body}|${body} UID ${uid})\\)$`,
		'i'
	);
	const match = expression.exec(prefix + before.slice(0, marker.index) + '\x00' + after);
	if (!match || (match[1] ?? match[2]) !== command.uid) fail();
	return { kind: 'fetch', uid: command.uid, bytes };
}
