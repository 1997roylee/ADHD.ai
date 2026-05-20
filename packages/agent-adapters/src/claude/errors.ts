export function mapClaudeError(
	command: string,
	args: string[],
	result: { code: number; stdout: string; stderr: string },
): Error {
	const output = result.stderr || result.stdout;
	const base = `${command} ${args.join(" ")} failed with exit code ${result.code}`;

	if (output.includes("rate limit") || output.includes("429")) {
		return new Error(
			`${base}\nClaude API rate limit hit. Wait a moment and retry, or set CLAUDE_CODE_MODEL to a model with higher limits.`,
		);
	}

	if (
		output.includes("authentication") ||
		output.includes("API key") ||
		output.includes("ANTHROPIC_API_KEY")
	) {
		return new Error(
			`${base}\nClaude Code authentication failed. Run 'claude' interactively once to log in, or set ANTHROPIC_API_KEY in your environment.`,
		);
	}

	if (output.includes("model") && output.includes("not found")) {
		return new Error(
			`${base}\nThe specified model was not found. Check CLAUDE_CODE_MODEL in your .env file.`,
		);
	}

	if (result.code === 127) {
		return new Error(
			`${base}\nClaude Code binary not found. Install with: npm install -g @anthropic-ai/claude-code`,
		);
	}

	return new Error(`${base}\n${output}`);
}
