import { createApiClient } from "./client";
import type { ApiClient } from "./client.types";

const WEB_SERVER_PROXY_WS_URL = "/api/cli/stream";

export function createWebApiClient(): ApiClient {
	return createApiClient({
		wsUrl: resolveWebServerProxyWsUrl(),
	});
}

export function resolveWebServerProxyWsUrl(
	env: NodeJS.ProcessEnv = process.env,
): string {
	return env.NEXT_PUBLIC_DEVOS_SERVER_WS_URL ?? WEB_SERVER_PROXY_WS_URL;
}
