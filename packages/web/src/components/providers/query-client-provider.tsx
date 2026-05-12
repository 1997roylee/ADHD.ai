"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactElement, type ReactNode, useState } from "react";

type Props = {
	children: ReactNode;
};

export function AppQueryClientProvider({ children }: Props): ReactElement {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
