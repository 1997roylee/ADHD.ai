export interface CliCommandStreamRequest {
	action: string;
	[key: string]: unknown;
}

export type CliCommandStreamEvent =
	| {
			type: "start";
			request: CliCommandStreamRequest;
			invocation: { command: string; args: string[] };
	  }
	| { type: "stdout"; text: string }
	| { type: "stderr"; text: string }
	| { type: "error"; error: string }
	| {
			type: "complete";
			result: {
				status: "succeeded" | "failed" | "rejected";
				request: CliCommandStreamRequest;
				invocation?: { command: string; args: string[] };
				commandResult?: { code: number; stdout: string; stderr: string };
				error?: string;
			};
	  };

export type CliCommandStreamHandler = (event: CliCommandStreamEvent) => void;
