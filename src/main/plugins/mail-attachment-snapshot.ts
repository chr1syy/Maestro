/** Host-private owned attachment chunks; no RPC handle, file cache or caller proof. */
import { PLUGIN_ID_PATTERN } from '../../shared/plugins/plugin-manifest';
import { assertMailActivityAuthority, type MailActivityLease } from './mail-account-activity';
import { ImapConnectionError } from './mail-imap-connection';
import { MAIL_MIME_CONTENT_LIMITS, type MailMimeAttachmentContent } from './mail-mime-content';

export const MAIL_ATTACHMENT_SNAPSHOT_LIMITS = Object.freeze({
	chunkBytes: 64 * 1024,
	reservedBytes: 8 * MAIL_MIME_CONTENT_LIMITS.attachmentBytes,
	reservedBytesPerPlugin: 2 * MAIL_MIME_CONTENT_LIMITS.attachmentBytes,
});

export interface MailAttachmentChunk {
	readonly dataBase64: string;
	readonly nextOffset: number;
	readonly complete: boolean;
}

/** Main-only object bound to its original exact reference and nested invocation. */
export interface MailAttachmentSnapshot {
	readonly partId: string;
	readonly filename: string;
	readonly mimeType: MailMimeAttachmentContent['mimeType'];
	readonly sizeBytes: number;
	/** Fresh main-process publication check; denial closes and erases this snapshot. */
	assertActive(): void;
	readChunk(offset: unknown, limit?: unknown): MailAttachmentChunk;
	/** Needed even after completion; otherwise the original invocation expiry closes it. */
	close(): void;
}

/** Shared across reader instances: constructing another facade cannot bypass caps. */
const pluginReservations = new Map<string, number>();
let reservedBytes = 0;

/** Reserve a whole maximum part before I/O, including empty and pending snapshots. */
export function reserveMailAttachmentSnapshot(pluginId: string) {
	if (
		typeof pluginId !== 'string' ||
		pluginId.length < 3 ||
		pluginId.length > 100 ||
		!PLUGIN_ID_PATTERN.test(pluginId)
	)
		throw new ImapConnectionError('MAIL_DENIED');
	const capacity = MAIL_MIME_CONTENT_LIMITS.attachmentBytes;
	const pluginBytes = pluginReservations.get(pluginId) ?? 0;
	if (
		reservedBytes > MAIL_ATTACHMENT_SNAPSHOT_LIMITS.reservedBytes - capacity ||
		pluginBytes > MAIL_ATTACHMENT_SNAPSHOT_LIMITS.reservedBytesPerPlugin - capacity
	)
		throw new ImapConnectionError('MAIL_LIMIT');
	reservedBytes += capacity;
	pluginReservations.set(pluginId, pluginBytes + capacity);
	let released = false;
	let adopted = false;
	let closeSnapshot: (() => void) | undefined;
	const releaseBudget = () => {
		if (released) return;
		released = true;
		reservedBytes -= capacity;
		const remaining = (pluginReservations.get(pluginId) ?? capacity) - capacity;
		if (remaining) pluginReservations.set(pluginId, remaining);
		else pluginReservations.delete(pluginId);
	};
	return Object.freeze({
		release: () => (closeSnapshot ? closeSnapshot() : releaseBudget()),
		/** Consume only actual facade output. No plugin may supply a lease/callback/Buffer. */
		consume(
			content: MailMimeAttachmentContent,
			lease: MailActivityLease,
			callerSignal: AbortSignal,
			assertAuthorized: () => void
		): MailAttachmentSnapshot {
			// A repeated consume must not erase bytes belonging to an earlier snapshot.
			if (adopted) throw new ImapConnectionError('MAIL_DENIED');
			adopted = true;
			let bytes: Buffer | undefined = content.bytes;
			const sizeBytes = content.sizeBytes;
			let closed = false;
			let reading = false;
			let asserting = false;
			let complete = false;
			let nextOffset = 0;
			const close = () => {
				if (closed) return;
				closed = true;
				if (Buffer.isBuffer(bytes)) bytes.fill(0);
				bytes = undefined;
				callerSignal.removeEventListener('abort', close);
				lease.signal.removeEventListener('abort', close);
				releaseBudget();
				lease.release();
			};
			closeSnapshot = close;
			const assertActive = () => {
				// Publication callbacks must not recursively reuse this snapshot's authority.
				// Close before denying so a callback that catches denial cannot resume success.
				if (asserting) {
					close();
					throw new ImapConnectionError('MAIL_DENIED');
				}
				asserting = true;
				try {
					if (closed || released || callerSignal.aborted || lease.signal.aborted)
						throw new ImapConnectionError('MAIL_CANCELED');
					assertMailActivityAuthority(assertAuthorized);
					// The callback may synchronously close, revoke or stop this snapshot.
					if (closed || released || callerSignal.aborted || lease.signal.aborted)
						throw new ImapConnectionError('MAIL_CANCELED');
				} catch (error) {
					close();
					throw new ImapConnectionError(
						error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
					);
				} finally {
					// Only the admitted assertion owns this transient guard; close is permanent.
					asserting = false;
				}
			};
			try {
				if (!Buffer.isBuffer(bytes) || bytes.length !== sizeBytes || sizeBytes > capacity)
					throw new ImapConnectionError('MAIL_LIMIT');
				callerSignal.addEventListener('abort', close, { once: true });
				lease.signal.addEventListener('abort', close, { once: true });
				assertActive();
				const snapshot: MailAttachmentSnapshot = Object.freeze({
					partId: content.partId,
					filename: content.filename,
					mimeType: content.mimeType,
					sizeBytes,
					close,
					assertActive,
					readChunk(offset: unknown, limit: unknown = MAIL_ATTACHMENT_SNAPSHOT_LIMITS.chunkBytes) {
						try {
							if (reading) throw new ImapConnectionError('MAIL_DENIED');
							reading = true;
							assertActive();
							if (
								typeof offset !== 'number' ||
								!Number.isSafeInteger(offset) ||
								offset < 0 ||
								typeof limit !== 'number' ||
								!Number.isSafeInteger(limit) ||
								limit < 1 ||
								limit > MAIL_ATTACHMENT_SNAPSHOT_LIMITS.chunkBytes
							)
								throw new ImapConnectionError('MAIL_INVALID');
							if (complete || offset !== nextOffset) throw new ImapConnectionError('MAIL_STALE');
							const end = Math.min(sizeBytes, offset + limit);
							// Subarray is an internal alias only; no binary value leaves the snapshot.
							if (!bytes) throw new ImapConnectionError('MAIL_CANCELED');
							const dataBase64 = bytes.subarray(offset, end).toString('base64');
							assertActive();
							const result = Object.freeze({
								dataBase64,
								nextOffset: end,
								complete: end === sizeBytes,
							});
							nextOffset = end;
							complete = result.complete;
							if (complete) {
								bytes?.fill(0);
								bytes = undefined;
							}
							// Retain the lease for publication; explicit close or invocation expiry releases it.
							return result;
						} catch (error) {
							close();
							throw new ImapConnectionError(
								error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
							);
						} finally {
							reading = false;
						}
					},
				});
				assertActive();
				return snapshot;
			} catch (error) {
				close();
				throw new ImapConnectionError(
					error instanceof ImapConnectionError ? error.code : 'MAIL_UNAVAILABLE'
				);
			}
		},
	});
}
