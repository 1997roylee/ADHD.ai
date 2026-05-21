import type { Server } from "node:http";
import type { Express } from "express";

export async function listenExpressApp(
	app: Express,
	port: number,
	host = "127.0.0.1",
): Promise<Server> {
	const attempts = port === 0 ? 10 : 1;
	let lastError: unknown;
	for (let index = 0; index < attempts; index += 1) {
		const listenPort = port === 0 ? randomLoopbackPort() : port;
		try {
			return await listenOnce(app, listenPort, host);
		} catch (error) {
			lastError = error;
			if (!isAddressInUseError(error) || index === attempts - 1) {
				throw error;
			}
		}
	}
	throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function listenOnce(app: Express, port: number, host: string): Promise<Server> {
	return new Promise((resolve, reject) => {
		const server = app.listen(port, host);
		server.once("listening", () => resolve(server));
		server.once("error", reject);
	});
}

function randomLoopbackPort(): number {
	return 31_000 + Math.floor(Math.random() * 20_000);
}

function isAddressInUseError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		error.code === "EADDRINUSE"
	);
}
