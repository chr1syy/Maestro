import { parseDataUrl } from './imageUtils';

interface ImageContent {
	type: 'image';
	source: {
		type: 'base64';
		media_type: string;
		data: string;
	};
}

interface TextContent {
	type: 'text';
	text: string;
}

type MessageContent = ImageContent | TextContent;

/**
 * Build a stream-json message for Claude Code with images and text.
 *
 * Claude Code expects this format:
 * {"type":"user","message":{"role":"user","content":[...]}}
 *
 * Content array should have images first (Claude convention), then text.
 * Private callers must pass their captured host-only policy explicitly. The
 * default preserves ordinary callers; this helper does not admit proof delivery.
 */
export function buildStreamJsonMessage(
	prompt: string,
	images: string[],
	withholdProviderOutput = false
): string {
	try {
		const content: MessageContent[] = [];

		// Add images first (Claude convention: images before text)
		for (const dataUrl of images) {
			const parsed = parseDataUrl(dataUrl, withholdProviderOutput);
			if (parsed) {
				content.push({
					type: 'image',
					source: {
						type: 'base64',
						media_type: parsed.mediaType,
						data: parsed.base64,
					},
				});
			}
		}

		// Add text content
		content.push({
			type: 'text',
			text: prompt,
		});

		const message = {
			type: 'user',
			message: {
				role: 'user',
				content,
			},
		};

		return JSON.stringify(message);
	} catch (error) {
		// Catch iteration/resolution/serialization as one publication boundary.
		// Successful execution JSON is unchanged; ordinary exceptions propagate.
		if (withholdProviderOutput) throw new Error('PrivateMcpStreamJsonFailed');
		throw error;
	}
}
