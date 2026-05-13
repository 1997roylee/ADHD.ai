import type {
	CliCommandExecutionHistoryEntry,
	CliCommandExecutionResult,
	CliCommandRequest,
	NotificationServerRequest,
} from "adhdai/features/server";

export interface CliExecutor {
	execute(request: CliCommandRequest): Promise<CliCommandExecutionResult>;
	getHistory(): CliCommandExecutionHistoryEntry[];
}

export interface AppDeps {
	cliExecutor: CliExecutor;
	notificationSender: {
		sendNotification(request: NotificationServerRequest): Promise<void>;
	};
}

export type RouteHandler = (request: Request) => Response | Promise<Response>;
