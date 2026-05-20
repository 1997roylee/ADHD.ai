import type {
	AgentAdapter,
	AgentAdapterRuntimeConfig,
	AgentResult,
} from "../agent-adapter.types";
import { runCommand } from "../shell";
import { buildClaudeCommonArgs } from "./args";
import { mapClaudeError } from "./errors";
import { extractFinalMessage, extractSessionId, extractUsage } from "./output";
import { getClaudeBinaryPath } from "./path";

export class ClaudeCodeAdapter implements AgentAdapter {
	private claudePath: string;

	constructor(private config: AgentAdapterRuntimeConfig) {
		this.claudePath = getClaudeBinaryPath(config.codex?.binary);
	}

	async runPlan(prompt: string): Promise<AgentResult> {
		return this.runClaude(prompt);
	}

	async runTaskIntake(prompt: string): Promise<AgentResult> {
		return this.runClaude(prompt);
	}

	async resume(sessionId: string, prompt: string): Promise<AgentResult> {
		return this.runClaudeResume(sessionId, prompt);
	}

	async runReview(prompt: string): Promise<AgentResult> {
		return this.runClaude(prompt);
	}

	async runGithubComment(prompt: string): Promise<AgentResult> {
		return this.runClaude(prompt);
	}

	private async runClaude(prompt: string): Promise<AgentResult> {
		const args = ["-p", prompt, ...buildClaudeCommonArgs(this.config)];

		const result = await runCommand(this.claudePath, args, {
			cwd: this.config.executionPath,
			streamStdout: this.config.codex.streamLogs,
			streamStderr: this.config.codex.streamLogs,
			stdinMode: "ignore",
		});

		if (result.code !== 0) {
			throw mapClaudeError(this.claudePath, args, result);
		}

		const finalMessage = extractFinalMessage(result.stdout);
		const sessionId = extractSessionId(result.stdout);
		const usage = extractUsage(result.stdout);

		return {
			sessionId,
			finalMessage,
			stdout: result.stdout,
			usage,
		};
	}

	private async runClaudeResume(
		sessionId: string,
		prompt: string,
	): Promise<AgentResult> {
		const args = [
			"--resume",
			sessionId,
			"-p",
			prompt,
			...buildClaudeCommonArgs(this.config),
		];

		const result = await runCommand(this.claudePath, args, {
			cwd: this.config.executionPath,
			streamStdout: this.config.codex.streamLogs,
			streamStderr: this.config.codex.streamLogs,
			stdinMode: "ignore",
		});

		if (result.code !== 0) {
			throw mapClaudeError(this.claudePath, args, result);
		}

		const finalMessage = extractFinalMessage(result.stdout);
		const resumedSessionId = extractSessionId(result.stdout) ?? sessionId;
		const usage = extractUsage(result.stdout);

		return {
			sessionId: resumedSessionId,
			finalMessage,
			stdout: result.stdout,
			usage,
		};
	}
}
