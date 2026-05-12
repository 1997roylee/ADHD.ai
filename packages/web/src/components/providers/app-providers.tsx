"use client";

import type { ReactElement, ReactNode } from "react";

import { AppQueryClientProvider } from "@/components/providers/query-client-provider";

type Props = {
	children: ReactNode;
};

export function AppProviders({ children }: Props): ReactElement {
	return <AppQueryClientProvider>{children}</AppQueryClientProvider>;
}
