import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
	title: "ADHD.ai Monitoring UI",
	description: "Monitoring workspace for ADHD.ai agent runs",
};

type Props = {
	children: ReactNode;
};

export default function RootLayout({ children }: Props): JSX.Element {
	return (
		<html lang="en">
			<body>
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	);
}
