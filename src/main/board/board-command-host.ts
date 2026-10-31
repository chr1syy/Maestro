/** Ordinary (non-human) commands share the desktop's current facade and host registers. */
import type { BoardCommandHost } from '../../shared/board/commands';
import {
	BoardStorageError,
	captureBoardCard,
	createBoard,
	deleteBoard,
	deleteCard,
	enqueueBoardWrite,
	getBoardCaptureCatalog,
	queryBoardWorkspace,
	renameBoard,
	updateCardStatus,
} from './board-storage';

export const executeBoardCommand: BoardCommandHost = async (command) => {
	try {
		if (command.action === 'query') return { ok: true, value: queryBoardWorkspace(command.query) };
		if (command.action === 'catalog') return { ok: true, value: getBoardCaptureCatalog() };
		const projectRoot =
			command.action === 'create' ? command.projectRoot : command.target.projectRoot;
		return await enqueueBoardWrite(projectRoot, () => {
			if (command.action === 'create') {
				return {
					ok: true as const,
					value: createBoard(projectRoot, command.name, { expectedSourceKey: command.sourceKey }),
				};
			}
			const target = command.target;
			const snapshot = queryBoardWorkspace({ projectRoot, sourceKey: target.sourceKey });
			const entry = snapshot.collections.find(
				(collection) =>
					collection.sourceKey === target.sourceKey &&
					collection.collectionKey === target.collectionKey
			);
			if (!entry)
				throw new BoardStorageError(
					'not-found',
					'Board collection not found in the selected source/project'
				);
			if (entry.revision !== target.expectedRevision)
				throw new BoardStorageError('stale-revision', 'Board changed since read');
			if (command.action === 'capture') {
				if (command.capture.boardId !== entry.board.id)
					throw new BoardStorageError(
						'identity-mismatch',
						'Board legacy identity does not match collection'
					);
				return captureBoardCard(command.capture, false);
			}
			if (command.action === 'rename')
				return {
					ok: true as const,
					value: renameBoard(projectRoot, entry.board.id, command.name, target.expectedRevision),
				};
			if (command.action === 'delete')
				return {
					ok: true as const,
					value: deleteBoard(projectRoot, entry.board.id, {
						force: command.force,
						expectedRevision: target.expectedRevision,
					}),
				};
			const card = entry.board.cards.find((card) => card.id === command.cardId);
			if (!card) throw new BoardStorageError('not-found', 'Board card not found');
			if (card.storageRevision !== command.cardRevision)
				throw new BoardStorageError('stale-revision', 'Card changed since read');
			return {
				ok: true as const,
				value:
					command.action === 'delete-card'
						? deleteCard(projectRoot, entry.board.id, card.id, target.expectedRevision)
						: updateCardStatus(
								projectRoot,
								entry.board.id,
								card.id,
								command.status,
								target.expectedRevision
							),
			};
		});
	} catch (error) {
		if (!(error instanceof BoardStorageError)) throw error;
		return {
			ok: false,
			error: {
				code: error.code,
				message: error.message,
				captureErrors: error.details.captureErrors,
			},
		};
	}
};
