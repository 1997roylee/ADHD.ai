import type {
	NotificationEmailPayload,
	NotificationServerRequest,
} from "adhdai/features/server";
import type { AppDeps, RouteHandler } from "./app.types";

const UNSAFE_RAW_COMMAND_FIELDS = ["command", "cmd", "args", "argv", "shell"];

export function createHandleRequest(deps: AppDeps): RouteHandler {
	return async (request) => {
		const { pathname } = new URL(request.url);

		if (pathname === "/health" && request.method === "GET") {
			return Response.json({ status: "ok" });
		}

		if (pathname === "/api/cli/history") {
			if (request.method !== "GET") {
				return Response.json({ error: "Method Not Allowed" }, { status: 405 });
			}
			return Response.json(deps.cliExecutor.getHistory());
		}

		if (pathname === "/api/cli/dispatch") {
			if (request.method !== "POST") {
				return Response.json({ error: "Method Not Allowed" }, { status: 405 });
			}
			const parsed = await parseDispatchRequest(request);
			if (parsed.status === "error") {
				return Response.json({ error: parsed.error }, { status: 400 });
			}
			const result = await deps.cliExecutor.execute(parsed.request);
			return Response.json(result, {
				status: result.status === "rejected" ? 400 : 200,
			});
		}

		if (pathname === "/api/notifications") {
			if (request.method !== "POST") {
				return Response.json({ error: "Method Not Allowed" }, { status: 405 });
			}
			const parsed = await parseNotificationRequest(request);
			if (parsed.status === "error") {
				return Response.json({ error: parsed.error }, { status: 400 });
			}
			await deps.notificationSender.sendNotification(parsed.request);
			return Response.json({ status: "accepted" }, { status: 202 });
		}

		return new Response("Not Found", { status: 404 });
	};
}

export const handleRequest: RouteHandler = (request) => {
	const { pathname } = new URL(request.url);

	if (pathname === "/health" && request.method === "GET") {
		return Response.json({ status: "ok" });
	}

	return new Response("Not Found", { status: 404 });
};

async function parseDispatchRequest(
	request: Request,
): Promise<
	| { status: "ok"; request: Record<string, unknown> & { action: string } }
	| { status: "error"; error: string }
> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return { status: "error", error: "Malformed JSON body" };
	}

	if (!isRecord(body)) {
		return {
			status: "error",
			error: "Malformed dispatch request: expected object body",
		};
	}
	if (typeof body.action !== "string" || body.action.trim().length === 0) {
		return {
			status: "error",
			error: "Malformed dispatch request: action must be a non-empty string",
		};
	}
	for (const field of UNSAFE_RAW_COMMAND_FIELDS) {
		if (field in body) {
			return {
				status: "error",
				error: `Unsafe dispatch request: raw command field '${field}' is not allowed`,
			};
		}
	}

	return {
		status: "ok",
		request: body as Record<string, unknown> & { action: string },
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function parseNotificationRequest(
	request: Request,
): Promise<
	| { status: "ok"; request: NotificationServerRequest }
	| { status: "error"; error: string }
> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return { status: "error", error: "Malformed JSON body" };
	}
	if (!isRecord(body)) {
		return {
			status: "error",
			error: "Malformed notification request: expected object body",
		};
	}
	const payload = body.payload;
	if (!isNotificationEmailPayload(payload)) {
		return {
			status: "error",
			error:
				"Malformed notification request: payload must include from, to, subject, and text",
		};
	}
	if (body.type === "task-outcome") {
		return {
			status: "ok",
			request: { type: "task-outcome", payload },
		};
	}
	if (body.type === "human-review-required") {
		if (typeof body.complexityScore !== "number") {
			return {
				status: "error",
				error:
					"Malformed notification request: complexityScore must be a number",
			};
		}
		if (typeof body.reason !== "string" || body.reason.trim().length === 0) {
			return {
				status: "error",
				error:
					"Malformed notification request: reason must be a non-empty string",
			};
		}
		return {
			status: "ok",
			request: {
				type: "human-review-required",
				payload,
				complexityScore: body.complexityScore,
				reason: body.reason,
			},
		};
	}
	return {
		status: "error",
		error:
			"Malformed notification request: type must be 'task-outcome' or 'human-review-required'",
	};
}

function isNotificationEmailPayload(
	value: unknown,
): value is NotificationEmailPayload {
	if (!isRecord(value)) {
		return false;
	}
	if (typeof value.from !== "string") {
		return false;
	}
	if (
		!Array.isArray(value.to) ||
		!value.to.every((item) => typeof item === "string")
	) {
		return false;
	}
	if (typeof value.subject !== "string") {
		return false;
	}
	return typeof value.text === "string";
}
