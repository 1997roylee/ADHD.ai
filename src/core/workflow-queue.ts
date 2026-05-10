import { normalizeIssueKey } from "./state";
import type { RunOptions } from "./types";

export interface WorkflowQueueIssue {
	identifier: string;
	priority: {
		value: number;
		name: string;
	};
}

export function dedupeIssuesByKey<T extends WorkflowQueueIssue>(
	issues: T[],
): T[] {
	const seen = new Set<string>();
	const unique: T[] = [];
	for (const issue of issues) {
		const key = normalizeIssueKey(issue.identifier);
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		unique.push(issue);
	}
	return unique;
}

export function buildPrioritizedIssueQueue<T extends WorkflowQueueIssue>(
	assignedIssues: T[],
	staleRetryIssues: T[],
): T[] {
	return dedupeIssuesByKey([...assignedIssues, ...staleRetryIssues]);
}

export function selectIssueQueueForCycle<T extends WorkflowQueueIssue>(
	issueArg: string | undefined,
	assignedIssues: T[],
	staleRetryIssues: T[],
	options: Pick<RunOptions, "reviewOnly"> = {},
): T[] {
	if (options.reviewOnly) {
		return [];
	}
	if (issueArg !== undefined) {
		return assignedIssues;
	}
	return buildPrioritizedIssueQueue(assignedIssues, staleRetryIssues);
}
