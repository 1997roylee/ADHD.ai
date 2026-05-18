import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import { createTaskRepository, createTaskService } from "../tasks";
import type {
	DaemonEventsProxy,
	DaemonEventsProxyOptions,
	DaemonEventsSocket,
	DaemonEventsWebSocketServer,
} from "./daemon-events.types";

export const DAEMON_EVENTS_PATH = "/daemon/events";

export function attachDaemonEventsSocket(
	options: DaemonEventsProxyOptions,
	WebSocketServerImpl: new (options: {
		noServer: true;
	}) => DaemonEventsWebSocketServer = WebSocketServer,
): DaemonEventsProxy {
	const webSocketServer = new WebSocketServerImpl({ noServer: true });
	const onUpgrade = (
		request: IncomingMessage,
		socket: Duplex,
		head: Buffer,
	): void => {
		if (!shouldHandleDaemonEventsUpgrade(request, options.path)) {
			return;
		}
		webSocketServer.handleUpgrade(request, socket, head, (client) => {
			webSocketServer.emit("connection", client);
		});
	};

	webSocketServer.on("connection", (client) => {
		bindDaemonEventsClient(client, options);
	});
	options.server.on("upgrade", onUpgrade);

	return {
		close: () =>
			new Promise((resolve, reject) => {
				options.server.off("upgrade", onUpgrade);
				webSocketServer.close((error) => (error ? reject(error) : resolve()));
			}),
	};
}

export function bindDaemonEventsClient(
	client: DaemonEventsSocket,
	options: Pick<DaemonEventsProxyOptions, "db" | "realtimeEvents">,
): void {
	client.on("message", (message) => {
		void handleDaemonEventMessage(client, String(message), options);
	});
}

export function shouldHandleDaemonEventsUpgrade(
	request: IncomingMessage,
	path: string,
): boolean {
	const url = new URL(request.url ?? "/", "http://localhost");
	return url.pathname === path;
}

async function handleDaemonEventMessage(
	client: DaemonEventsSocket,
	message: string,
	options: Pick<DaemonEventsProxyOptions, "db" | "realtimeEvents">,
): Promise<void> {
	const parsed = parseDaemonEventFrame(message);
	if (parsed.status === "error") {
		sendFrame(client, { type: "error", error: parsed.error });
		return;
	}

	const service = createTaskService(createTaskRepository(options.db));
	const result = await service.getTask(parsed.taskId);
	if (result.status === "ok") {
		options.realtimeEvents.publish({
			type: "issue.updated",
			issue: result.value,
		});
		sendFrame(client, {
			type: "task.changed.ack",
			taskId: parsed.taskId,
			status: "published",
		});
		return;
	}

	sendFrame(client, {
		type: "task.changed.ack",
		taskId: parsed.taskId,
		status: "not_found",
	});
}

function parseDaemonEventFrame(
	input: string,
): { status: "ok"; taskId: string } | { status: "error"; error: string } {
	let value: unknown;
	try {
		value = JSON.parse(input);
	} catch {
		return {
			status: "error",
			error: "Malformed daemon event frame: invalid JSON",
		};
	}
	if (!isRecord(value) || value.type !== "task.changed") {
		return {
			status: "error",
			error: "Malformed daemon event frame: type must be task.changed",
		};
	}
	if (typeof value.taskId !== "string" || value.taskId.trim().length === 0) {
		return {
			status: "error",
			error: "Malformed daemon event frame: taskId is required",
		};
	}
	return { status: "ok", taskId: value.taskId };
}

function sendFrame(client: DaemonEventsSocket, frame: Record<string, unknown>) {
	if (client.readyState === WebSocket.OPEN) {
		client.send(JSON.stringify(frame));
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
