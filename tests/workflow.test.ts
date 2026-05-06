import { describe, expect, it } from "bun:test";
import { buildPlanComment, parseReviewOutcome } from "../src/workflow";

describe("parseReviewOutcome", () => {
	it("parses pass with no bugs", () => {
		const text = `
RESULT: PASS
SUMMARY: Looks good.
BUGS_JSON:
[]
`;
		const outcome = parseReviewOutcome(text);
		expect(outcome.passed).toBe(true);
		expect(outcome.bugs).toHaveLength(0);
	});

	it("parses fail with bugs", () => {
		const text = `
RESULT: FAIL
SUMMARY: Found regressions.
BUGS_JSON:
[{"title":"Bug A","body":"Details"}]
`;
		const outcome = parseReviewOutcome(text);
		expect(outcome.passed).toBe(false);
		expect(outcome.bugs).toHaveLength(1);
		expect(outcome.bugs[0]?.title).toBe("Bug A");
	});
});

describe("buildPlanComment", () => {
	it("includes header and plan summary", () => {
		const comment = buildPlanComment("ENG-1", "1. Do A\n2. Do B");
		expect(comment).toContain("PIV loop plan for ENG-1");
		expect(comment).toContain("Planning completed; implementation started.");
		expect(comment).toContain("1. Do A");
	});

	it("uses fallback when no summary is returned", () => {
		const comment = buildPlanComment("ENG-1", "   ");
		expect(comment).toContain("(No plan summary returned by planning agent.)");
	});
});
