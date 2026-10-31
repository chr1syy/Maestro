import type { Board } from '../../shared/board/types';

/** Loaded board runs are observations, not a global reservation source. */
export function observedWorkerRun(boards: Board[], agentId: string): string | undefined {
	for (const board of boards) {
		for (const card of board.cards) {
			const run = card.runs?.[card.runs.length - 1];
			if (card.status === 'running' && run?.workerAgentId === agentId && !run.endedAt) {
				return card.title;
			}
		}
	}
	return undefined;
}
