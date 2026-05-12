import { describe, expect, it } from "bun:test";

import { handleRequest } from "../src/app";

describe("handleRequest", () => {
	it("returns 200 and JSON for GET /health", async () => {
		const response = await handleRequest(
			new Request("http://localhost/health", { method: "GET" }),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("application/json");
		expect(await response.json()).toEqual({ status: "ok" });
	});

	it("returns 404 for unknown routes", async () => {
		const response = await handleRequest(
			new Request("http://localhost/missing", { method: "GET" }),
		);

		expect(response.status).toBe(404);
	});
});
