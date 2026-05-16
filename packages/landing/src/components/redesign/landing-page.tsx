import type { ReactElement } from "react";

import { CodeDemo } from "@/components/redesign/code-demo";
import { CTA } from "@/components/redesign/cta";
import { Features } from "@/components/redesign/features";
import { Footer } from "@/components/redesign/footer";
import { Hero } from "@/components/redesign/hero";
import { Logos } from "@/components/redesign/logos";
import { Metrics } from "@/components/redesign/metrics";
import { Nav } from "@/components/redesign/nav";
import { Onboard } from "@/components/redesign/onboard";
import { ProjectBoard } from "@/components/redesign/project-board";
import { Telegram } from "@/components/redesign/telegram";
import { Workflow } from "@/components/redesign/workflow";

export function RedesignLandingPage(): ReactElement {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Nav />
			<main>
				<Hero />
				<Logos />
				<Onboard />
				<Workflow />
				<ProjectBoard />
				<Telegram />
				<Features />
				<CodeDemo />
				<Metrics />
				<CTA />
			</main>
			<Footer />
		</div>
	);
}
