import {
	ArrowRight,
	Code2,
	Compass,
	FlaskConical,
	ListTree,
	RefreshCw,
} from "lucide-react";
import type { ReactElement } from "react";

import type { WorkflowStep } from "@/components/redesign/redesign.types";

const steps: WorkflowStep[] = [
	{
		key: "explore",
		icon: Compass,
		title: "Explore",
		body: "Agents read your repo, docs, and history to ground every task in real context.",
	},
	{
		key: "plan",
		icon: ListTree,
		title: "Plan",
		body: "A typed plan with subtasks, owners, and acceptance criteria before code runs.",
	},
	{
		key: "implement",
		icon: Code2,
		title: "Implement",
		body: "Coder agents work in branches, edit files, and open PRs against your workflow.",
	},
	{
		key: "test",
		icon: FlaskConical,
		title: "Test",
		body: "Unit, integration, and behavior tests route failures back to the planner.",
	},
	{
		key: "loop",
		icon: RefreshCw,
		title: "Loop",
		body: "Replan, repair, retry, then page a human when the decision needs judgment.",
	},
];

export function Workflow(): ReactElement {
	return (
		<section className="border-border/50 border-t py-16 sm:py-24 md:py-32">
			<div className="mx-auto max-w-7xl px-4 sm:px-6">
				<div className="max-w-2xl">
					<p className="mb-3 text-muted-foreground text-xs uppercase">
						The agentic loop
					</p>
					<h2 className="font-pixel text-[clamp(2.5rem,5vw,4rem)] uppercase leading-none">
						Five steps.{" "}
						<span className="text-[var(--neon-pink)]">One closed loop.</span>
					</h2>
					<p className="mt-5 text-muted-foreground leading-relaxed">
						Every devos.ing agent follows the same disciplined cycle. You stay
						in control at every checkpoint.
					</p>
				</div>
				<div className="mt-14 hidden items-stretch gap-3 md:flex">
					{steps.map((step, index) => (
						<div className="flex min-w-0 flex-1 items-stretch" key={step.key}>
							<StepCard index={index} step={step} />
							{index < steps.length - 1 ? (
								<div className="flex items-center px-1 text-muted-foreground/50">
									<ArrowRight className="h-4 w-4" />
								</div>
							) : null}
						</div>
					))}
				</div>
				<div className="mt-10 space-y-3 md:hidden">
					{steps.map((step, index) => (
						<StepCard index={index} key={step.key} step={step} />
					))}
				</div>
			</div>
		</section>
	);
}

function StepCard({
	step,
	index,
}: {
	step: WorkflowStep;
	index: number;
}): ReactElement {
	const Icon = step.icon;
	const colors = [
		"var(--neon-pink)",
		"var(--neon-cyan)",
		"var(--neon-yellow)",
		"var(--neon-lime)",
		"var(--neon-purple)",
	];

	return (
		<div
			className="min-w-0 flex-1 border-2 border-foreground bg-card p-5 shadow-retro-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--foreground)]"
			style={{
				background: `linear-gradient(180deg, ${colors[index]} 0, ${colors[index]} 36px, var(--card) 36px)`,
			}}
		>
			<div className="-mt-1 mb-3 flex items-center justify-between text-foreground">
				<span className="font-pixel text-lg">STEP 0{index + 1}</span>
				<Icon className="h-5 w-5" />
			</div>
			<h3 className="mt-3 font-pixel text-2xl uppercase">{step.title}</h3>
			<p className="mt-2 text-foreground/70 text-sm leading-relaxed">
				{step.body}
			</p>
		</div>
	);
}
