import { describe, expect, it } from "bun:test";
import {
	applyRunLease,
	clearRunLease,
	hasRunLeaseConflict,
	isRunLeaseExpired,
	normalizeIssueKey,
	transitionStage,
} from "../src/core/state";
import type { RunState } from "../src/core/types";

describe("state helpers", () => {
	it("normalizes issue key from URL", () => {
		const key = normalizeIssueKey(
			"https://linear.app/acme/issue/ENG-321/task-name",
		);
		expect(key).toBe("ENG-321");
	});

	it("transitions stage", () => {
		const now = new Date().toISOString();
		const state: RunState = {
			projectId: "default",
			projectName: "Default",
			workspacePath: "/tmp/work",
			repository: {
				owner: "o",
				name: "n",
				baseBranch: "main",
			},
			issue: { id: "1", key: "ENG-1", title: "t", url: "u" },
			stage: "planning",
			bugs: [],
			startedAt: now,
			updatedAt: now,
		};
		const next = transitionStage(state, "implementing");
		expect(next.stage).toBe("implementing");
	});

	it("applies and clears lease metadata", () => {
		const now = new Date().toISOString();
		const state: RunState = {
			projectId: "default",
			projectName: "Default",
			workspacePath: "/tmp/work",
			repository: {
				owner: "o",
				name: "n",
				baseBranch: "main",
			},
			issue: { id: "1", key: "ENG-1", title: "t", url: "u" },
			stage: "planning",
			bugs: [],
			startedAt: now,
			updatedAt: now,
		};

		const leased = applyRunLease(state, "worker-1", 30000, 1000);
		expect(leased.lease?.ownerId).toBe("worker-1");
		expect(leased.lease?.acquiredAt).toBe("1970-01-01T00:00:01.000Z");
		expect(leased.lease?.expiresAt).toBe("1970-01-01T00:00:31.000Z");

		const cleared = clearRunLease(leased);
		expect(cleared.lease).toBeUndefined();
	});

	it("detects lease expiry and conflicts", () => {
		const now = new Date().toISOString();
		const state: RunState = {
			projectId: "default",
			projectName: "Default",
			workspacePath: "/tmp/work",
			repository: {
				owner: "o",
				name: "n",
				baseBranch: "main",
			},
			issue: { id: "1", key: "ENG-1", title: "t", url: "u" },
			stage: "planning",
			bugs: [],
			lease: {
				ownerId: "worker-a",
				acquiredAt: "1970-01-01T00:00:00.000Z",
				heartbeatAt: "1970-01-01T00:00:05.000Z",
				expiresAt: "1970-01-01T00:00:10.000Z",
			},
			startedAt: now,
			updatedAt: now,
		};

		expect(isRunLeaseExpired(state, 9999)).toBe(false);
		expect(isRunLeaseExpired(state, 10000)).toBe(true);
		expect(hasRunLeaseConflict(state, "worker-b", 9999)).toBe(true);
		expect(hasRunLeaseConflict(state, "worker-a", 9999)).toBe(false);
	});
});
