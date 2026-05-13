import { CliCommandExecutor } from "adhdai/features/server/cli-command-executor";
import { createHandleRequest } from "./app";
import { createNotificationSender } from "./notifications/notification-sender";

export const startServer = (port = 3000): Bun.Server<undefined> =>
	Bun.serve({
		port,
		fetch: createHandleRequest({
			cliExecutor: new CliCommandExecutor({
				cwd: process.cwd(),
				command: "bun",
				baseArgs: ["run", "./packages/cli/src/index.ts"],
			}),
			notificationSender: createNotificationSender({
				resendApiKey: process.env.RESEND_API_KEY?.trim(),
			}),
		}),
	});

if (import.meta.main) {
	startServer();
}
