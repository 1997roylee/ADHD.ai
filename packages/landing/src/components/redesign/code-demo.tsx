import type { ReactElement } from "react";

const languages = [
	["typescript", "var(--neon-cyan)"],
	["python", "var(--neon-yellow)"],
	["go", "var(--neon-pink)"],
	["rust", "var(--neon-lime)"],
];

const codeSample = `import { defineAgent, tool } from "@devos/core";
import { z } from "zod";

export default defineAgent({
  name: "support-triage",
  model: "claude-opus-4-7",
  memory: { kind: "persistent", scope: "user" },

  tools: [
    tool("search_tickets", {
      input: z.object({ query: z.string() }),
      run: async ({ query }) => db.tickets.search(query),
    }),
    tool("escalate", {
      input: z.object({ ticketId: z.string(), reason: z.string() }),
      requiresApproval: true,
      run: async (input) => pagerduty.page(input),
    }),
  ],
});`;

export function CodeDemo(): ReactElement {
	return (
		<section
			className="relative overflow-hidden border-foreground border-y-2 bg-foreground py-16 text-background sm:py-24 md:py-32"
			id="docs"
		>
			<div className="pointer-events-none absolute inset-0 scanlines opacity-30" />
			<div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
				<div>
					<p className="mb-3 text-background/60 text-xs uppercase">
						Developer first
					</p>
					<h2 className="font-pixel text-[clamp(2.5rem,5vw,4rem)] uppercase leading-none">
						Define an agent in a file.{" "}
						<span className="text-[var(--neon-lime)]">
							Ship it from your terminal.
						</span>
					</h2>
					<p className="mt-6 max-w-md text-background/70 leading-relaxed">
						No drag-and-drop. No proprietary YAML. Write real code with real
						types, then deploy to a runtime that scales itself.
					</p>
					<div className="mt-8 flex flex-wrap gap-2 font-mono text-xs">
						{languages.map(([language, color]) => (
							<span
								className="border-2 px-2.5 py-1 uppercase"
								key={language}
								style={{ borderColor: color, color }}
							>
								{language}
							</span>
						))}
					</div>
				</div>
				<div className="overflow-hidden border-2 border-[var(--neon-pink)] bg-black shadow-[8px_8px_0_0_var(--neon-cyan)]">
					<div className="flex h-9 items-center justify-between border-[var(--neon-pink)] border-b-2 px-4 font-mono text-[var(--neon-pink)] text-xs">
						<span>agents/support.ts</span>
						<span>devos.ing / v0.0.1</span>
					</div>
					<pre className="overflow-x-auto p-4 font-mono text-[11px] leading-6 sm:p-5 sm:text-xs">
						{codeSample}
					</pre>
				</div>
			</div>
		</section>
	);
}
