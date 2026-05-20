import type { AgentAdapterRuntimeConfig } from "../agent-adapter.types";

export function buildClaudeCommonArgs(
	config: AgentAdapterRuntimeConfig,
): string[] {
	const permissionMode = config.agent?.permissionMode ?? "bypassPermissions";
	return [
		"--output-format",
		"json",
		"--permission-mode",
		permissionMode,
		...buildModelArgs(config),
		...buildMaxTurnsArgs(config),
		...buildAllowedToolsArgs(config),
	];
}

function buildModelArgs(config: AgentAdapterRuntimeConfig): string[] {
	const model = config.agent?.model;
	if (!model) return [];
	return ["--model", model];
}

function buildMaxTurnsArgs(config: AgentAdapterRuntimeConfig): string[] {
	const maxTurns = config.agent?.maxTurns;
	if (!maxTurns || maxTurns <= 0) return [];
	return ["--max-turns", String(maxTurns)];
}

function buildAllowedToolsArgs(config: AgentAdapterRuntimeConfig): string[] {
	const tools = config.agent?.allowedTools;
	if (!tools || tools.length === 0) return [];
	return ["--allowedTools", ...tools];
}
