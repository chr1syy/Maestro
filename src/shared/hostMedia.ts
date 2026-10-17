import type { MediaModelId } from './plugins/media-tools';

/** Desktop host diagnostic only. Never exposed through the plugin SDK. */
export interface HostMediaDetection {
	tools: ('ffprobe' | 'ffmpeg' | 'whisper-cli')[];
	checkedDirectories: string[];
	directories: { directory: string; models: MediaModelId[] }[];
}
