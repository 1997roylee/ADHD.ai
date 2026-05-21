import { describe, expect, it } from "bun:test";
import { resolveServerHost, resolveServerPort } from "../src/index";

describe("server startup config", () => {
	it("resolves host and port from env", () => {
		expect(resolveServerHost({ PIV_SERVER_HOST: "127.0.0.1" })).toBe(
			"127.0.0.1",
		);
		expect(resolveServerHost({})).toBe("127.0.0.1");
		expect(resolveServerPort({ PIV_SERVER_PORT: "3100" })).toBe(3100);
	});

	it("rejects invalid server ports", () => {
		expect(() => resolveServerPort({ PIV_SERVER_PORT: "0" })).toThrow(
			"PIV_SERVER_PORT must be a valid TCP port",
		);
		expect(() => resolveServerPort({ PIV_SERVER_PORT: "70000" })).toThrow(
			"PIV_SERVER_PORT must be a valid TCP port",
		);
	});
});
