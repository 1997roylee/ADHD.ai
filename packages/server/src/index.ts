import { handleRequest } from "./app";

export const startServer = (port = 3000): Server =>
	Bun.serve({
		port,
		fetch: handleRequest,
	});

if (import.meta.main) {
	startServer();
}
