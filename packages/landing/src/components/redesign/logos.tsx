import type { ReactElement } from "react";

const logos = [
	"Linear",
	"Vercel",
	"Ramp",
	"Notion",
	"Anthropic",
	"Supabase",
	"Stripe",
];
const marqueeLogos = ["a", "b", "c"].flatMap((round) =>
	logos.map((logo) => ({ id: `${round}-${logo}`, logo })),
);

export function Logos(): ReactElement {
	return (
		<section className="overflow-hidden border-foreground border-b-2 bg-foreground py-4 text-background">
			<div className="flex items-center justify-center gap-8 px-4 md:hidden">
				{logos.slice(0, 4).map((logo) => (
					<span
						className="flex items-center gap-2 font-pixel text-xl"
						key={logo}
					>
						<span className="text-[var(--neon-cyan)]">*</span>
						{logo}
					</span>
				))}
			</div>
			<div className="ticker hidden items-center gap-12 whitespace-nowrap md:flex">
				{marqueeLogos.map((item) => (
					<span
						className="flex items-center gap-12 font-pixel text-2xl"
						key={item.id}
					>
						<span className="text-[var(--neon-cyan)]">*</span>
						{item.logo}
					</span>
				))}
			</div>
		</section>
	);
}
