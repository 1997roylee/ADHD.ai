import { createInterface } from "node:readline/promises";

export async function readStdinText(): Promise<string> {
	let input = "";
	for await (const chunk of process.stdin) {
		input += chunk.toString();
	}
	return input.trim();
}

export async function withQuestionReader<T>(
	run: (askQuestion: (question: string) => Promise<string>) => Promise<T>,
): Promise<T> {
	const readline = createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	try {
		return await run((question) => readline.question(`${question}\n> `));
	} finally {
		readline.close();
	}
}
