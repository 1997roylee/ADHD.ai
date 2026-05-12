import type {
	AgentRecord,
	JobRecord,
	SkillRecord,
	TokenUsageRecord,
} from "./monitoring.types";

const monitoringEndpoints = {
	tokenUsage: "/api/token-usage",
	jobs: "/api/jobs",
	agents: "/api/agents",
	skills: "/api/skills",
} as const;

async function fetchMonitoringData<T>(path: string): Promise<T> {
	const response = await fetch(path, {
		method: "GET",
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(
			`Monitoring API request failed (${response.status} ${response.statusText}) for ${path}`,
		);
	}

	return (await response.json()) as T;
}

export function fetchTokenUsage(): Promise<TokenUsageRecord[]> {
	return fetchMonitoringData<TokenUsageRecord[]>(
		monitoringEndpoints.tokenUsage,
	);
}

export function fetchJobs(): Promise<JobRecord[]> {
	return fetchMonitoringData<JobRecord[]>(monitoringEndpoints.jobs);
}

export function fetchAgents(): Promise<AgentRecord[]> {
	return fetchMonitoringData<AgentRecord[]>(monitoringEndpoints.agents);
}

export function fetchSkills(): Promise<SkillRecord[]> {
	return fetchMonitoringData<SkillRecord[]>(monitoringEndpoints.skills);
}
