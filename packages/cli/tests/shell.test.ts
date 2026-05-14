import { describe, expect, it } from "bun:test";
import { assertCommandOk, runCommand } from "../src/utils/shell";

describe("runCommand", () => {
	it("returns a timeout result when the child process exceeds timeoutMs", async () => {
		const result = await runCommand(
			process.execPath,
			["-e", "setTimeout(() => {}, 1000)"],
			{
				cwd: process.cwd(),
				timeoutMs: 10,
			},
		);

		expect(result.code).toBe(124);
		expect(result.stderr).toContain("timed out after 10ms");
	});

	it("surfaces child output before the command preview on failure", () => {
		expect(() =>
			assertCommandOk("codex", ["exec", "very long prompt"], {
				code: 1,
				stdout: "",
				stderr: "Error: No such file or directory (os error 2)",
			}),
		).toThrow(
			[
				"codex failed with exit code 1",
				"stderr:",
				"Error: No such file or directory (os error 2)",
				"command: codex exec",
			].join("\n"),
		);
	});
});
