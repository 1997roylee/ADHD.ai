import { describe, expect, it } from "bun:test";
import { resolveDaemonEventsWsUrl } from "../src/features/workflow/board-task-notifier";

describe("resolveDaemonEventsWsUrl", () => {
	it("uses explicit daemon events websocket urls", () => {
		expect(
			resolveDaemonEventsWsUrl({
				DEVOS_SERVER_EVENTS_WS_URL: "ws://events.example.test/socket",
			}),
		).toBe("ws://events.example.test/socket");
	});

	it("falls back from http server base urls", () => {
		expect(
			resolveDaemonEventsWsUrl({
				DEVOS_SERVER_BASE_URL: "http://server.test",
			}),
		).toBe("ws://server.test/daemon/events");
	});

	it("falls back from https server base urls", () => {
		expect(
			resolveDaemonEventsWsUrl({
				DEVOS_SERVER_BASE_URL: "https://api.example.test",
			}),
		).toBe("wss://api.example.test/daemon/events");
	});

	it("no-ops when no server url is configured", () => {
		expect(resolveDaemonEventsWsUrl({})).toBeUndefined();
	});
});
