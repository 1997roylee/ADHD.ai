import { logger, normalizeError } from "../../utils/logger";

const DAEMON_EVENTS_PATH = "/daemon/events";
const NOTIFICATION_TIMEOUT_MS = 1000;

export interface BoardTaskNotifierWebSocket {
	send(message: string): void;
	close(): void;
	addEventListener(
		event: "open" | "message" | "error" | "close",
		listener: (event: { data?: unknown }) => void,
	): void;
}

export type BoardTaskNotifierWebSocketConstructor = new (
	url: string,
) => BoardTaskNotifierWebSocket;

export async function notifyBoardTaskChanged(
	taskId: string,
	options: {
		env?: NodeJS.ProcessEnv;
		WebSocketImpl?: BoardTaskNotifierWebSocketConstructor;
		timeoutMs?: number;
	} = {},
): Promise<void> {
	const env = options.env ?? process.env;
	let url: string | undefined;
	try {
		url = resolveDaemonEventsWsUrl(env);
	} catch (error) {
		logger.warn(
			{ err: normalizeError(error) },
			"Failed to resolve daemon task notification websocket URL",
		);
		return;
	}
	if (!url) {
		return;
	}
	const WebSocketImpl =
		options.WebSocketImpl ??
		(globalThis.WebSocket as unknown as
			| BoardTaskNotifierWebSocketConstructor
			| undefined);
	if (!WebSocketImpl) {
		logger.warn(
			{ taskId, url },
			"WebSocket is unavailable for task notification",
		);
		return;
	}

	await sendTaskChangedFrame(taskId, url, WebSocketImpl, options.timeoutMs);
}

export function resolveDaemonEventsWsUrl(
	env: NodeJS.ProcessEnv,
): string | undefined {
	if (env.DEVOS_SERVER_EVENTS_WS_URL) {
		return env.DEVOS_SERVER_EVENTS_WS_URL;
	}
	if (!env.DEVOS_SERVER_BASE_URL) {
		return undefined;
	}
	const url = new URL(DAEMON_EVENTS_PATH, env.DEVOS_SERVER_BASE_URL);
	if (url.protocol === "http:") {
		url.protocol = "ws:";
	}
	if (url.protocol === "https:") {
		url.protocol = "wss:";
	}
	return url.toString();
}

async function sendTaskChangedFrame(
	taskId: string,
	url: string,
	WebSocketImpl: BoardTaskNotifierWebSocketConstructor,
	timeoutMs = NOTIFICATION_TIMEOUT_MS,
): Promise<void> {
	return new Promise((resolve) => {
		let settled = false;
		let socket: BoardTaskNotifierWebSocket | undefined;
		const timeout = setTimeout(() => {
			logger.warn(
				{ taskId, url },
				"Timed out notifying server about task change",
			);
			finish();
		}, timeoutMs);
		const finish = () => {
			if (settled) {
				return;
			}
			settled = true;
			clearTimeout(timeout);
			try {
				socket?.close();
			} catch {
				// Closing a best-effort notification socket should never fail workflow.
			}
			resolve();
		};

		try {
			socket = new WebSocketImpl(url);
		} catch (error) {
			clearTimeout(timeout);
			logger.warn(
				{ taskId, url, err: normalizeError(error) },
				"Failed to open task notification websocket",
			);
			resolve();
			return;
		}

		socket.addEventListener("open", () => {
			socket?.send(JSON.stringify({ type: "task.changed", taskId }));
		});
		socket.addEventListener("message", (event) => {
			const response = parseDaemonEventResponse(event.data);
			if (response?.type === "error") {
				logger.warn(
					{ taskId, url, error: response.error },
					"Server rejected daemon task notification",
				);
			}
			finish();
		});
		socket.addEventListener("close", () => finish());
		socket.addEventListener("error", (event) => {
			logger.warn(
				{ taskId, url, err: normalizeError(event) },
				"Failed to notify server about daemon task change",
			);
			finish();
		});
	});
}

function parseDaemonEventResponse(
	data: unknown,
): { type: "error"; error: string } | undefined {
	if (typeof data !== "string") {
		return undefined;
	}
	try {
		const value = JSON.parse(data) as unknown;
		if (
			typeof value === "object" &&
			value !== null &&
			"type" in value &&
			value.type === "error" &&
			"error" in value &&
			typeof value.error === "string"
		) {
			return { type: "error", error: value.error };
		}
	} catch {
		return undefined;
	}
	return undefined;
}
