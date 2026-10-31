/** Board commands carried by the existing authenticated desktop/runtime bridge.
 * Authority is never part of the wire contract. Domain validation stays in the host facade.
 */
import { CARD_STATUSES } from './types';
import type {
	Board,
	BoardCaptureCatalog,
	BoardCaptureCommand,
	BoardCaptureResponse,
	BoardWorkspaceQuery,
	BoardWorkspaceQueryResult,
	CardStatus,
} from './types';

export interface BoardCommandTarget {
	projectRoot: string;
	sourceKey: string;
	collectionKey: string;
	expectedRevision: number;
}
export type BoardCommand =
	| { action: 'query'; query: BoardWorkspaceQuery }
	| { action: 'catalog' }
	| { action: 'capture'; target: BoardCommandTarget; capture: BoardCaptureCommand }
	| { action: 'create'; projectRoot: string; sourceKey: string; name: string }
	| { action: 'rename'; target: BoardCommandTarget; name: string }
	| { action: 'delete'; target: BoardCommandTarget; force?: boolean }
	| { action: 'delete-card'; target: BoardCommandTarget; cardId: string; cardRevision: number }
	| {
			action: 'status';
			target: BoardCommandTarget;
			cardId: string;
			cardRevision: number;
			status: CardStatus;
	  };
export type BoardCommandResult =
	| {
			ok: true;
			value: BoardWorkspaceQueryResult | BoardCaptureCatalog | Board | Board[];
			readiness?: Record<string, string[]>;
	  }
	| Extract<BoardCaptureResponse, { ok: false }>;
export type BoardCommandHost = (command: BoardCommand) => Promise<BoardCommandResult>;
export type BoardCommandReply = BoardCommandResult & {
	type: 'board_command_result';
	requestId?: string;
};

const record = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string =>
	typeof value === 'string' && !!value.trim() && !value.includes('\0');
const revision = (value: unknown): value is number =>
	Number.isSafeInteger(value) && (value as number) >= 0;
const keys = (value: Record<string, unknown>, allowed: string[]) =>
	Object.keys(value).every((key) => allowed.includes(key));

export function parseBoardCommand(message: Record<string, unknown>): BoardCommand | undefined {
	const { action, target } = message;
	const fields: Record<string, string[]> = {
		query: ['query'],
		catalog: [],
		capture: ['target', 'capture'],
		create: ['projectRoot', 'sourceKey', 'name'],
		rename: ['target', 'name'],
		delete: ['target', 'force'],
		'delete-card': ['target', 'cardId', 'cardRevision'],
		status: ['target', 'cardId', 'cardRevision', 'status'],
	};
	if (
		typeof action !== 'string' ||
		!Object.prototype.hasOwnProperty.call(fields, action) ||
		!keys(message, ['type', 'requestId', 'action', ...fields[action]])
	)
		return;
	if (action === 'query')
		return record(message.query)
			? { action, query: message.query as BoardWorkspaceQuery }
			: undefined;
	if (action === 'catalog') return { action };
	if (action === 'create')
		return text(message.projectRoot) && text(message.sourceKey) && text(message.name)
			? {
					action,
					projectRoot: message.projectRoot,
					sourceKey: message.sourceKey,
					name: message.name,
				}
			: undefined;
	if (
		!record(target) ||
		!keys(target, ['projectRoot', 'sourceKey', 'collectionKey', 'expectedRevision']) ||
		!text(target.projectRoot) ||
		!text(target.sourceKey) ||
		!text(target.collectionKey) ||
		!revision(target.expectedRevision)
	)
		return;
	if (action === 'capture') {
		const command = message.capture;
		if (
			!record(command) ||
			!keys(command, ['projectRoot', 'boardId', 'expectedRevision', 'card']) ||
			command.projectRoot !== target.projectRoot ||
			!text(command.boardId) ||
			command.expectedRevision !== target.expectedRevision ||
			!record(command.card) ||
			['human', 'actorAuthority', 'canRelaxStartPolicy'].some(
				(key) => key in (command.card as Record<string, unknown>)
			)
		)
			return;
	} else if (action === 'rename' && !text(message.name)) return;
	else if (action === 'delete' && message.force !== undefined && typeof message.force !== 'boolean')
		return;
	else if (action === 'delete-card' || action === 'status') {
		if (!text(message.cardId) || !revision(message.cardRevision)) return;
		if (
			action === 'status' &&
			(!(CARD_STATUSES as readonly unknown[]).includes(message.status) ||
				message.status === 'ready' ||
				message.status === 'running')
		)
			return;
	}
	return message as unknown as BoardCommand;
}

/** Called only after the transport's native authentication gate. */
export async function answerBoardCommand(
	message: Record<string, unknown>,
	host?: BoardCommandHost
): Promise<BoardCommandReply> {
	const command = parseBoardCommand(message);
	const result: BoardCommandResult = !command
		? {
				ok: false,
				error: {
					code: 'invalid-input',
					message: 'Invalid Board command; caller authority is not accepted',
				},
			}
		: !host
			? {
					ok: false,
					error: { code: 'runtime-unavailable', message: 'Board host is not configured' },
				}
			: await host(command);
	return {
		type: 'board_command_result',
		...result,
		requestId: typeof message.requestId === 'string' ? message.requestId : undefined,
	};
}
