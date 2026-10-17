import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HostMediaSection } from '../../../../renderer/components/Settings/HostMediaSection';
import { useSettingsStore } from '../../../../renderer/stores/settingsStore';
import { mockTheme } from '../../../helpers/mockTheme';
import { THEMES } from '../../../../shared/themes';

const persistDirectory = useSettingsStore.getState().setMediaModelDirectory;
const getMediaStatus = vi.fn();
const setDirectory = vi.fn();
const detectMediaTools = vi.fn();

beforeEach(() => {
	getMediaStatus
		.mockReset()
		.mockResolvedValue({ profiles: [], models: [], missing: ['model-directory'] });
	setDirectory.mockReset().mockResolvedValue(false);
	window.maestro.settings.getMediaStatus = getMediaStatus;
	window.maestro.settings.detectMediaTools = detectMediaTools;
	detectMediaTools.mockReset().mockResolvedValue({
		tools: ['ffmpeg', 'ffprobe', 'whisper-cli'],
		checkedDirectories: ['/existing/models'],
		directories: [{ directory: '/existing/models', models: ['base'] }],
	});
	useSettingsStore.setState({ mediaModelDirectory: '', setMediaModelDirectory: setDirectory });
});

describe('HostMediaSection', () => {
	it('detects a bounded proposal without saving or replacing an explicit draft', async () => {
		useSettingsStore.setState({ mediaModelDirectory: '/manual/models' });
		render(<HostMediaSection theme={mockTheme} />);
		fireEvent.click(screen.getByText('Auto-detect'));
		expect(await screen.findByText('Models: base')).toBeInTheDocument();
		expect(screen.getByLabelText('Whisper model directory')).toHaveValue('/manual/models');
		expect(setDirectory).not.toHaveBeenCalled();
		fireEvent.click(screen.getByText('Use this directory'));
		expect(screen.getByLabelText('Whisper model directory')).toHaveValue('/existing/models');
		expect(setDirectory).not.toHaveBeenCalled();
		fireEvent.click(screen.getByText('Save directory'));
		await waitFor(() => expect(setDirectory).toHaveBeenCalledWith('/existing/models'));
	});

	it('persists a chosen proposal through the real store action and restores it on remount', async () => {
		let persisted = '';
		useSettingsStore.setState({ setMediaModelDirectory: persistDirectory });
		vi.mocked(window.maestro.settings.set).mockImplementation(async (key, value) => {
			expect(key).toBe('mediaModelDirectory');
			persisted = value as string;
			return true;
		});
		vi.mocked(window.maestro.settings.get).mockImplementation(async () => persisted);
		getMediaStatus.mockImplementation(async () =>
			persisted
				? { profiles: ['whisper-cli'], models: ['base'], missing: [] }
				: { profiles: [], models: [], missing: ['model-directory'] }
		);
		const view = render(<HostMediaSection theme={mockTheme} />);
		fireEvent.click(screen.getByText('Auto-detect'));
		await screen.findByText('Models: base');
		expect(persisted).toBe('');
		fireEvent.click(screen.getByText('Use this directory'));
		expect(persisted).toBe('');
		fireEvent.click(screen.getByText('Save directory'));
		await screen.findByText('Host media status: Ready');
		expect(persisted).toBe('/existing/models');
		expect(useSettingsStore.getState().mediaModelDirectory).toBe(persisted);
		view.unmount();
		render(<HostMediaSection theme={mockTheme} />);
		expect(screen.getByLabelText('Whisper model directory')).toHaveValue(persisted);
		await screen.findByText('Available models: base');
	});

	it('requires a choice when several model folders are found', async () => {
		detectMediaTools.mockResolvedValue({
			tools: [],
			checkedDirectories: [],
			directories: [
				{ directory: '/first', models: ['base'] },
				{ directory: '/second', models: ['small'] },
			],
		});
		render(<HostMediaSection theme={mockTheme} />);
		fireEvent.click(screen.getByText('Auto-detect'));
		await screen.findByText('Multiple model folders found. Choose one explicitly.');
		expect(screen.getByLabelText('Whisper model directory')).toHaveValue('');
		fireEvent.click(screen.getAllByText('Use this directory')[1]);
		expect(screen.getByLabelText('Whisper model directory')).toHaveValue('/second');
		expect(setDirectory).not.toHaveBeenCalled();
	});

	it('keeps manual input on no result and allows retry after a sanitized detection failure', async () => {
		detectMediaTools
			.mockRejectedValueOnce(new Error('private host path'))
			.mockResolvedValueOnce({ tools: [], checkedDirectories: ['/missing'], directories: [] });
		render(<HostMediaSection theme={mockTheme} />);
		fireEvent.change(screen.getByLabelText('Whisper model directory'), {
			target: { value: '/manual' },
		});
		fireEvent.click(screen.getByText('Auto-detect'));
		await screen.findByText(/Could not detect host media tools/);
		expect(screen.queryByText('private host path')).not.toBeInTheDocument();
		fireEvent.click(screen.getByText('Auto-detect'));
		await screen.findByText(/No supported multilingual models found/);
		expect(screen.getByLabelText('Whisper model directory')).toHaveValue('/manual');
		expect(setDirectory).not.toHaveBeenCalled();
	});

	it.each(['ayu-light', 'solarized-dark'])(
		'shows actual missing prerequisites using %s',
		async (themeId) => {
			render(<HostMediaSection theme={THEMES[themeId]} />);
			expect(await screen.findByText('Missing prerequisites: model-directory')).toBeInTheDocument();
			expect(screen.getByText('Host media status: Unavailable')).toBeInTheDocument();
			expect(screen.getByText(/small requires ggml-small.bin/)).toBeInTheDocument();
		}
	);

	it('reports save failure while keeping the draft and previous status', async () => {
		render(<HostMediaSection theme={mockTheme} />);
		await screen.findByText('Missing prerequisites: model-directory');
		fireEvent.change(screen.getByLabelText('Whisper model directory'), {
			target: { value: '~/models' },
		});
		fireEvent.click(screen.getByText('Save directory'));
		expect(await screen.findByText(/Could not save. Use an absolute path/)).toBeInTheDocument();
		expect(screen.getByLabelText('Whisper model directory')).toHaveValue('~/models');
		expect(getMediaStatus).toHaveBeenCalledTimes(1);
	});

	it('saves the host setting and shows the available base model without assuming small exists', async () => {
		setDirectory.mockImplementation(async () => {
			getMediaStatus.mockResolvedValue({
				profiles: ['whisper-cli'],
				models: ['base'],
				missing: [],
			});
			useSettingsStore.setState({ mediaModelDirectory: '/canonical/models' });
			return true;
		});
		render(<HostMediaSection theme={mockTheme} />);
		await screen.findByText('Missing prerequisites: model-directory');
		fireEvent.change(screen.getByLabelText('Whisper model directory'), {
			target: { value: '/alias/models' },
		});
		fireEvent.click(screen.getByText('Save directory'));
		expect(await screen.findByText('Available models: base')).toBeInTheDocument();
		expect(screen.getByText('Host media status: Ready')).toBeInTheDocument();
		expect(screen.getByLabelText('Whisper model directory')).toHaveValue('/canonical/models');
		expect(setDirectory).toHaveBeenCalledWith('/alias/models');
	});

	it('allows retrying a failed status read', async () => {
		getMediaStatus.mockRejectedValueOnce(new Error('private host diagnostic'));
		render(<HostMediaSection theme={mockTheme} />);
		expect(await screen.findByText(/Could not read host media status/)).toBeInTheDocument();
		expect(screen.queryByText('private host diagnostic')).not.toBeInTheDocument();
		fireEvent.click(screen.getByText('Check status'));
		await waitFor(() =>
			expect(screen.getByText('Missing prerequisites: model-directory')).toBeInTheDocument()
		);
	});
});
