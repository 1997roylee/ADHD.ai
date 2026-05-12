"use client";

import type { ReactNode } from "react";

import { AppQueryClientProvider } from "@/components/providers/query-client-provider";

type Props = {
	children: ReactNode;
};

export function AppProviders({ children }: Props): JSX.Element {
	return <AppQueryClientProvider>{children}</AppQueryClientProvider>;
}
