import { initializeServerDatabase } from "devos-db";
import { loadConfig } from "devos/features/config";
import { createHandleRequest } from "./app";
import { createBoardRepository } from "./board";
import { createCliDaemonClient } from "./daemon/daemon-client";
import { createExpressApp, listenExpressApp } from "./express-server";
import type { ServerInstance } from "./express-server.types";
import {
	logger,
	normalizeError,
	setupServerProcessErrorHandlers,
} from "./logger";
import { createNotificationSender } from "./notifications/notification-sender";
import {
	createNotificationConfigFromEnv,
	createNotificationService,
} from "./notifications/notifications-service";
import { createResendClient } from "./notifications/resend-client";
import { createRealtimeEventBus } from "./realtime";
import { createReadRepositories } from "./repositories";
import {
	resolveServerDatabasePath,
	resolveServerWorkspacePath,
} from "./startup-paths";
import { WORKFLOW_DATA_WS_PATH } from "./workflow-data";
import { attachWorkflowDataSocket } from "./workflow-data/workflow-data-socket";
import { attachCliStreamProxy } from "./ws/cli-stream-proxy";
import {
	DAEMON_EVENTS_PATH,
	attachDaemonEventsSocket,
} from "./ws/daemon-events";
import { attachRealtimeEventsSocket } from "./ws/realtime-events";

const DEFAULT_SERVER_PORT = 3001;
const DEFAULT_SERVER_HOST = "127.0.0.1";
const DEFAULT_CLI_DAEMON_WS_URL = "ws://127.0.0.1:3002";

export async function startServer(
	port = resolveServerPort(process.env),
	host = resolveServerHost(process.env),
): Promise<ServerInstance> {
	const cwd = process.cwd();
	const workspacePath = resolveServerWorkspacePath(process.env);
	const config = await loadConfig(workspacePath);
	const databasePath = resolveServerDatabasePath(
		process.env,
		workspacePath,
		config,
	);
	const daemonUrl =
		process.env.DEVOS_CLI_DAEMON_WS_URL ?? DEFAULT_CLI_DAEMON_WS_URL;
	const pgliteDebug = resolvePgliteDebug(process.env);
	logger.info(
		{ port, host, databasePath, cwd, workspacePath, daemonUrl },
		"Starting server",
	);
	const serverDatabase = await initializeServerDatabase(databasePath, {
		pgliteDebug,
	});
	const cliExecutor = createCliDaemonClient({ url: daemonUrl });
	const realtimeEvents = createRealtimeEventBus();
	const app = createExpressApp(
		createHandleRequest({
			db: serverDatabase.db,
			cliExecutor,
			boardRepository: createBoardRepository(serverDatabase.db),
			notificationSender: createNotificationSender({
				resendApiKey: process.env.RESEND_API_KEY,
			}),
			notificationService: createNotificationService({
				config: createNotificationConfigFromEnv(process.env),
				resendClient: createResendClient(process.env.RESEND_API_KEY ?? ""),
			}),
			realtimeEvents,
			repositories: createReadRepositories(serverDatabase),
		}),
		{ logger },
	);
	const server = await listenExpressApp(app, port, host);
	const cliStreamProxy = attachCliStreamProxy({
		server,
		path: "/api/cli/stream",
		daemonUrl,
	});
	const realtimeEventsSocket = attachRealtimeEventsSocket({
		server,
		path: "/api/events",
		eventBus: realtimeEvents,
	});
	const daemonEventsSocket = attachDaemonEventsSocket({
		server,
		path: DAEMON_EVENTS_PATH,
		db: serverDatabase.db,
		realtimeEvents,
	});
	const workflowDataSocket = attachWorkflowDataSocket({
		server,
		path: WORKFLOW_DATA_WS_PATH,
		db: serverDatabase.db,
		realtimeEvents,
	});
	server.once("close", () => {
		void cliStreamProxy.close();
		void realtimeEventsSocket.close();
		void daemonEventsSocket.close();
		void workflowDataSocket.close();
	});
	const address = server.address();
	const listeningPort = typeof address === "object" ? address?.port : port;
	logger.info(
		{ port: listeningPort ?? port, host, databasePath, cwd, workspacePath },
		"Server started",
	);
	return server;
}

if (import.meta.main) {
	setupServerProcessErrorHandlers();
	startServer().catch((error) => {
		logger.fatal({ err: normalizeError(error) }, "Server startup failed");
		process.exit(1);
	});
}

export function resolveServerPort(env: NodeJS.ProcessEnv): number {
	const rawPort = env.PIV_SERVER_PORT ?? String(DEFAULT_SERVER_PORT);
	const port = Number(rawPort);
	if (!Number.isInteger(port) || port <= 0 || port > 65535) {
		throw new Error("PIV_SERVER_PORT must be a valid TCP port");
	}
	return port;
}

export function resolveServerHost(env: NodeJS.ProcessEnv): string {
	return env.PIV_SERVER_HOST?.trim() || DEFAULT_SERVER_HOST;
}

function resolvePgliteDebug(env: NodeJS.ProcessEnv): 1 | undefined {
	if (env.PIV_PGLITE_DEBUG === "1") {
		return 1;
	}
	return undefined;
}
