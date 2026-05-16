import { Bell, Check, CheckCheck, Send } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import type { ChatMessage } from "@/components/redesign/redesign.types";

const messages: ChatMessage[] = [
	{
		from: "bot",
		time: "09:14",
		body: (
			<>
				<div className="mb-1 font-mono text-[10px] text-sky-300/90">
					[planner]
				</div>
				Decomposed <b>DEV-204</b> into six steps. Dispatching to coder and
				reviewer.
			</>
		),
	},
	{ from: "you", time: "09:15", body: "/status DEV-204", read: true },
	{
		from: "bot",
		time: "09:15",
		body: (
			<>
				<b>DEV-204</b> / Refactor billing audit flow
				<div className="mt-1.5 space-y-0.5 text-[12px]">
					<div>Explore complete / 12 files scanned</div>
					<div>Plan complete / 6 steps</div>
					<div>Implementing / tests running</div>
					<div>Testing queued</div>
				</div>
			</>
		),
	},
	{
		from: "bot",
		time: "09:22",
		body: (
			<>
				<div className="mb-1 font-mono text-[10px] text-amber-300/90">
					[reviewer]
				</div>
				PR <b>#1294</b> ready / 2 suggestions / 0 blockers.
				<div className="mt-2 flex flex-wrap gap-1.5">
					<Pill>Approve</Pill>
					<Pill>Request changes</Pill>
					<Pill>Open PR</Pill>
				</div>
			</>
		),
	},
];

export function Telegram(): ReactElement {
	return (
		<section
			className="border-border/50 border-y bg-muted/20 py-16 sm:py-24 md:py-32"
			id="inbox"
		>
			<div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12">
				<div className="order-2 lg:order-1 lg:col-span-7">
					<div className="relative mx-auto max-w-md">
						<div className="-inset-6 -z-10 absolute rounded-3xl bg-gradient-to-br from-sky-300/20 via-transparent to-violet-300/20 blur-2xl" />
						<div className="overflow-hidden border-2 border-foreground bg-[#17212b] text-white shadow-retro-pink">
							<div className="flex h-12 items-center gap-3 border-white/10 border-b bg-[#1f2c38] px-4">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-violet-500 text-[11px]">
									dv
								</div>
								<div className="min-w-0 flex-1">
									<div className="text-sm">devos bot</div>
									<div className="text-[10px] text-white/50">
										online / workspace q2-platform
									</div>
								</div>
								<Bell className="h-4 w-4 text-white/60" />
							</div>
							<div className="min-h-[360px] space-y-2.5 p-4">
								{messages.map((message) => (
									<Bubble
										key={`${message.from}-${message.time}`}
										message={message}
									/>
								))}
							</div>
							<div className="flex items-center gap-2 border-white/10 border-t bg-[#1f2c38] p-2.5">
								<input
									className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-white/40"
									placeholder="Message devos bot..."
									readOnly
								/>
								<button
									className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500"
									type="button"
								>
									<Send className="h-3.5 w-3.5" />
								</button>
							</div>
						</div>
					</div>
				</div>
				<div className="order-1 lg:order-2 lg:col-span-5">
					<p className="mb-3 text-muted-foreground text-xs uppercase">
						Telegram inbox
					</p>
					<h2 className="font-pixel text-[clamp(2.5rem,5vw,4rem)] text-[var(--neon-cyan)] uppercase leading-none">
						Your agents
						<br />
						in your pocket.
					</h2>
					<p className="mt-5 max-w-md text-muted-foreground leading-relaxed">
						Check status, approve PRs, and unblock agents from anywhere.
					</p>
					<ul className="mt-7 space-y-3 text-muted-foreground text-sm">
						{[
							["/status", "Live state of any task"],
							["/inbox", "Everything waiting on approval"],
							["/pause", "Stop an agent mid-loop"],
							["/resume", "Restart from any checkpoint"],
						].map(([command, description]) => (
							<li className="flex items-start gap-3" key={command}>
								<code className="shrink-0 bg-foreground px-1.5 py-0.5 font-mono text-background text-xs">
									{command}
								</code>
								<span>{description}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}

function Bubble({ message }: { message: ChatMessage }): ReactElement {
	const isYou = message.from === "you";

	return (
		<div className={`flex ${isYou ? "justify-end" : "justify-start"}`}>
			<div
				className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
					isYou
						? "rounded-br-md bg-sky-500 text-white"
						: "rounded-bl-md border border-white/5 bg-[#182533] text-white/90"
				}`}
			>
				<div>{message.body}</div>
				<div
					className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isYou ? "text-white/70" : "text-white/40"}`}
				>
					{message.time}
					{isYou ? (
						message.read ? (
							<CheckCheck className="h-3 w-3" />
						) : (
							<Check className="h-3 w-3" />
						)
					) : null}
				</div>
			</div>
		</div>
	);
}

function Pill({ children }: { children: ReactNode }): ReactElement {
	return (
		<button
			className="rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[11px] transition hover:bg-white/15"
			type="button"
		>
			{children}
		</button>
	);
}
