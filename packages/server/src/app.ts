import type { AppDeps, RouteHandler } from "./app.types";
import { handleCliRoute } from "./http/cli-routes";
import { handleProjectsRoute } from "./http/projects-routes";
import { withRequestLogging } from "./http/request-logger";
import { handleTasksRoute } from "./http/tasks-routes";
import { parseNotificationServerRequest } from "./notifications/notification-server-request";
import { parseNotificationRequest } from "./notifications/notifications-request";
import { READ_ONLY_SERVER_PATHS, handleServerRequest } from "./routes";
import { handleEntityCrudRequest, matchCrudRoute } from "./routes/entity-crud";

const WORKSPACE_PROJECTS_ROUTE = /^\/api\/workspaces\/([^/]+)\/projects\/?$/;
const WORKSPACE_PROJECT_BOARD_ROUTE =
	/^\/api\/workspaces\/([^/]+)\/projects\/([^/]+)\/board\/?$/;

export function createHandleRequest(deps: AppDeps): RouteHandler {
	const handler: RouteHandler = async (request) => {
		const { pathname } = new URL(request.url);

		if (pathname === "/health" && request.method === "GET") {
			return Response.json({ status: "ok" });
		}

		const cliResponse = await handleCliRoute(
			request,
			deps.cliExecutor,
			pathname,
		);
		if (cliResponse) {
			return cliResponse;
		}

		if (deps.db) {
			const projectResponse = await handleProjectsRoute(
				request,
				deps.db,
				pathname,
			);
			if (projectResponse) {
				return projectResponse;
			}
		}

		if (deps.db) {
			const taskResponse = await handleTasksRoute(request, deps.db, pathname);
			if (taskResponse) {
				return taskResponse;
			}
		}

		const crudRoute = matchCrudRoute(pathname);
		if (crudRoute) {
			if (!deps.db) {
				return Response.json(
					{ error: "Server database not configured" },
					{ status: 500 },
				);
			}
			const result = await handleEntityCrudRequest(
				request,
				{ db: deps.db },
				crudRoute,
			);
			if (result?.body === undefined) {
				return new Response(null, { status: result.status });
			}
			return Response.json(result.body, { status: result.status });
		}
		const projectMatch = pathname.match(WORKSPACE_PROJECTS_ROUTE);
		if (projectMatch) {
			if (request.method !== "GET") {
				return Response.json({ error: "Method Not Allowed" }, { status: 405 });
			}
			if (!deps.boardRepository) {
				return Response.json(
					{ error: "Board repository not configured" },
					{ status: 500 },
				);
			}
			const workspaceId = decodeURIComponent(projectMatch[1] ?? "");
			if (workspaceId.length === 0) {
				return Response.json({ error: "Not Found" }, { status: 404 });
			}
			const projects =
				await deps.boardRepository.listWorkspaceProjects(workspaceId);
			return Response.json({ workspaceId, projects });
		}

		const boardMatch = pathname.match(WORKSPACE_PROJECT_BOARD_ROUTE);
		if (boardMatch) {
			if (request.method !== "GET") {
				return Response.json({ error: "Method Not Allowed" }, { status: 405 });
			}
			if (!deps.boardRepository) {
				return Response.json(
					{ error: "Board repository not configured" },
					{ status: 500 },
				);
			}
			const workspaceId = decodeURIComponent(boardMatch[1] ?? "");
			const projectId = decodeURIComponent(boardMatch[2] ?? "");
			if (workspaceId.length === 0 || projectId.length === 0) {
				return Response.json({ error: "Not Found" }, { status: 404 });
			}
			const board = await deps.boardRepository.getWorkspaceProjectBoard(
				workspaceId,
				projectId,
			);
			if (!board) {
				return Response.json({ error: "Not Found" }, { status: 404 });
			}
			return Response.json(board);
		}

		if (pathname === "/api/notifications") {
			if (request.method !== "POST") {
				return Response.json({ error: "Method Not Allowed" }, { status: 405 });
			}
			const parsed = await parseNotificationServerRequest(request);
			if (parsed.status === "error") {
				return Response.json({ error: parsed.error }, { status: 400 });
			}
			if (!deps.notificationSender) {
				return Response.json(
					{ error: "Notification sender not configured" },
					{ status: 500 },
				);
			}
			await deps.notificationSender.sendNotification(parsed.request);
			return Response.json({ status: "accepted" }, { status: 202 });
		}

		if (pathname === "/api/notifications/email") {
			if (request.method !== "POST") {
				return Response.json({ error: "Method Not Allowed" }, { status: 405 });
			}
			const parsed = await parseNotificationRequest(request);
			if (parsed.status === "error") {
				return Response.json({ error: parsed.error }, { status: 400 });
			}
			if (!deps.notificationService) {
				return Response.json(
					{ error: "Notification service not configured" },
					{ status: 500 },
				);
			}
			const result = await deps.notificationService.send(parsed.request);
			if (result.status === "config_error") {
				return Response.json({ error: result.error }, { status: 503 });
			}
			if (result.status === "send_error") {
				return Response.json({ error: result.error }, { status: 502 });
			}
			return Response.json({ status: "sent" }, { status: 200 });
		}

		if ((READ_ONLY_SERVER_PATHS as readonly string[]).includes(pathname)) {
			if (!deps.repositories) {
				return Response.json(
					{ error: "Read repositories not configured" },
					{ status: 500 },
				);
			}
			return handleServerRequest(request, { repositories: deps.repositories });
		}

		return new Response("Not Found", { status: 404 });
	};
	return deps.logger ? withRequestLogging(handler, deps.logger) : handler;
}

export const handleRequest: RouteHandler = async (request) => {
	const { pathname } = new URL(request.url);

	if (pathname === "/health" && request.method === "GET") {
		return Response.json({ status: "ok" });
	}

	return new Response("Not Found", { status: 404 });
};
