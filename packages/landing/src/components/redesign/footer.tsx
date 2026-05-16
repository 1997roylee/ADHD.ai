import type { ReactElement } from "react";

const columns = [
	{
		title: "Product",
		links: [
			{ href: "#platform", label: "Workflow" },
			{ href: "#board", label: "Board" },
			{ href: "#inbox", label: "Telegram inbox" },
			{
				href: "https://github.com/1997roylee/show-me-ur-agents",
				label: "Changelog",
			},
		],
	},
	{
		title: "Developers",
		links: [
			{ href: "#docs", label: "Docs" },
			{
				href: "https://github.com/1997roylee/show-me-ur-agents#readme",
				label: "CLI reference",
			},
			{
				href: "https://github.com/1997roylee/show-me-ur-agents",
				label: "Examples",
			},
			{
				href: "https://github.com/1997roylee/show-me-ur-agents",
				label: "GitHub",
			},
		],
	},
	{
		title: "Community",
		links: [
			{
				href: "https://github.com/1997roylee/show-me-ur-agents/discussions",
				label: "Discussions",
			},
			{
				href: "https://github.com/1997roylee/show-me-ur-agents/blob/main/README.md",
				label: "Contributing",
			},
			{
				href: "https://github.com/1997roylee/show-me-ur-agents/issues",
				label: "Issues",
			},
			{
				href: "https://github.com/1997roylee/show-me-ur-agents/blob/main/docs/PLANS.md",
				label: "Roadmap",
			},
		],
	},
];

export function Footer(): ReactElement {
	return (
		<footer className="border-foreground border-t-2 bg-card">
			<div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-16 md:grid-cols-5">
				<div className="col-span-2">
					<div className="flex items-center gap-2">
						<div className="relative h-6 w-6 border-2 border-foreground bg-[var(--neon-pink)]">
							<div className="-bottom-1 -right-1 absolute -z-10 h-6 w-6 border-2 border-foreground bg-[var(--neon-cyan)]" />
						</div>
						<span className="font-pixel text-xl">devos.ing</span>
					</div>
					<p className="mt-4 max-w-xs text-muted-foreground text-sm">
						Code is cheap, show me your agent system.
					</p>
				</div>
				{columns.map((column) => (
					<div key={column.title}>
						<div className="mb-4 text-muted-foreground text-xs uppercase">
							{column.title}
						</div>
						<ul className="space-y-2.5 text-sm">
							{column.links.map((link) => (
								<li key={link.label}>
									<a
										className="text-foreground/80 hover:underline"
										href={link.href}
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
			<div className="border-border/60 border-t">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-muted-foreground text-xs sm:flex-row sm:px-6 sm:text-left">
					<div>2026 devos.ing / open source, runs locally</div>
					<div className="font-mono">v0.0.1 / MIT</div>
				</div>
			</div>
		</footer>
	);
}
