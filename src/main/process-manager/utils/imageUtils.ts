import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { logger } from '../../utils/logger';
import { captureException } from '../../utils/sentry';
import { resolveToBytesSync } from '../../storage/session-image-store';

/**
 * Resolve an image value to base64 + media type.
 *
 * Accepts BOTH inline `data:image/...;base64,...` data URLs (freshly pasted,
 * not yet persisted) AND `maestro-image://store/<sha>.<ext>` references (images
 * relocated to the content-addressed store on persistence - see
 * src/main/storage/session-image-store.ts). Because every send-to-agent path
 * (normal send, replay of an old message, SSH, stream-json) funnels through
 * this function, making it ref-aware transparently lets agents receive images
 * regardless of whether they're still inline or already on disk.
 * The optional main-only host policy fences diagnostics through resolution;
 * it never selects image bytes or authorizes a proof-bearing delivery path.
 */
export function parseDataUrl(
	value: string,
	withholdProviderOutput = false
): { base64: string; mediaType: string } | null {
	try {
		// Inline data URL (freshly pasted): return the original base64 substring
		// verbatim - no decode/re-encode - so this path stays byte-identical to the
		// historical behavior (re-encoding would canonicalize padding/whitespace).
		const match = value.match(/^data:(image\/[^;]+);base64,(.+)$/);
		if (match) return { mediaType: match[1], base64: match[2] };

		// maestro-image ref (persisted image relocated to the content-addressed
		// store): read the bytes off disk and encode them for the agent hand-off.
		const resolved = resolveToBytesSync(value, withholdProviderOutput);
		if (!resolved) return null;
		return { mediaType: resolved.mediaType, base64: resolved.buffer.toString('base64') };
	} catch (error) {
		// The policy comes from the host call, never from the image value. Do not
		// inspect/stringify a private resolution or encoding failure.
		if (withholdProviderOutput) throw new Error('PrivateMcpImageParseFailed');
		throw error;
	}
}

/**
 * Save a base64 data URL image to a temp file.
 * Returns the full path to the temp file, or null on failure.
 */
export function saveImageToTempFile(
	dataUrl: string,
	index: number,
	withholdProviderOutput = false
): string | null {
	// Captured host policy controls publication only, never image bytes or paths.
	// Keep ordinary resolution/preparation exceptions propagating as before.
	let prepared = false;
	try {
		const parsed = parseDataUrl(dataUrl, withholdProviderOutput);
		if (!parsed) {
			logger.warn('[ProcessManager] Failed to parse data URL for temp file', 'ProcessManager');
			return null;
		}

		const ext = parsed.mediaType.split('/')[1] || 'png';
		const filename = `maestro-image-${Date.now()}-${index}.${ext}`;
		const tempPath = path.join(os.tmpdir(), filename);
		prepared = true;
		const buffer = Buffer.from(parsed.base64, 'base64');
		fs.writeFileSync(tempPath, buffer);
		logger.debug('[ProcessManager] Saved image to temp file', 'ProcessManager', {
			tempPath: withholdProviderOutput ? undefined : tempPath,
			size: buffer.length,
		});
		return tempPath;
	} catch (error) {
		if (!withholdProviderOutput && !prepared) throw error;
		void captureException(withholdProviderOutput ? new Error('PrivateMcpImageSaveFailed') : error);
		logger.error('[ProcessManager] Failed to save image to temp file', 'ProcessManager', {
			error: withholdProviderOutput ? 'PrivateMcpImageSaveFailed' : String(error),
		});
		return null;
	}
}

/**
 * Build a text prefix for embedding image file paths in the prompt.
 * Used when an agent's resume mode doesn't support -i flag (e.g., codex exec resume).
 * The prefix is prepended to the user's prompt so the agent knows where to find images on disk.
 */
export function buildImagePromptPrefix(tempPaths: string[]): string {
	if (tempPaths.length === 0) return '';
	return `[Attached images: ${tempPaths.join(', ')}]\n\n`;
}

/**
 * Clean up temp image files asynchronously.
 * Fire-and-forget to avoid blocking the main thread.
 */
export function cleanupTempFiles(files: string[], withholdProviderOutput = false): void {
	for (const file of files) {
		fsPromises
			.unlink(file)
			.then(() => {
				logger.debug('[ProcessManager] Cleaned up temp file', 'ProcessManager', {
					file: withholdProviderOutput ? undefined : file,
				});
			})
			.catch((error) => {
				// This callback outlives exit settlement. Never inspect even an error
				// code/getter or stringify a private native cause (including ENOENT).
				if (withholdProviderOutput) {
					logger.warn('[ProcessManager] Failed to clean up temp file', 'ProcessManager', {
						error: 'PrivateMcpImageCleanupFailed',
					});
					return;
				}
				if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
					logger.warn('[ProcessManager] Failed to clean up temp file', 'ProcessManager', {
						file,
						error: String(error),
					});
				}
			});
	}
}
