import type { ReactElement } from "react";

export default function HomePage(): ReactElement {
	return (
		<main
			style={{
				display: "grid",
				minHeight: "100vh",
				placeItems: "center",
				padding: "2rem",
			}}
		>
			<section style={{ maxWidth: "40rem", textAlign: "center" }}>
				<h1 style={{ marginBottom: "0.75rem" }}>ADHD.ai Monitoring UI</h1>
				<p style={{ margin: 0, color: "#334155" }}>
					Next.js workspace scaffolded with TypeScript, shadcn/ui-compatible
					setup, and React Query provider plumbing.
				</p>
			</section>
		</main>
	);
}
