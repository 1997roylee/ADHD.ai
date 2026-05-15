import type { Server } from "node:http";
import type { RawData } from "ws";

export interface CliStreamProxyOptions {
	server: Server;
	path: string;
	daemonUrl: string;
}

export interface CliStreamProxy {
	close(): Promise<void>;
}

export interface CliStreamSocket {
	readonly readyState: number;
	send(message: RawData | string): void;
	close(): void;
	on(event: string, listener: (...args: unknown[]) => void): this;
}

export type CliStreamDaemonSocketConstructor = new (
	url: string,
) => CliStreamSocket;
