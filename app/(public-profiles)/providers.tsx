"use client";

import NiceModal from "@ebay/nice-modal-react";
import NextTopLoader from "nextjs-toploader";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type * as React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appConfig } from "@/config/app.config";
import { ThemeProvider } from "@/hooks/use-theme";
import { TRPCProvider } from "@/trpc/client";

/**
 * Public Profiles providers.
 * Lightweight providers for public-facing profile pages.
 * Includes TRPC for public API calls and theme support.
 */
export function PublicProfilesProviders({
	children,
}: React.PropsWithChildren): React.JSX.Element {
	return (
		<NuqsAdapter>
			<NextTopLoader color="var(--color-primary)" />
			<ThemeProvider
				attribute="class"
				defaultTheme={appConfig.theme.default}
				disableTransitionOnChange
				enableSystem
				themes={[...appConfig.theme.available]}
			>
				<TRPCProvider>
					<TooltipProvider>
						<NiceModal.Provider>{children}</NiceModal.Provider>
					</TooltipProvider>
				</TRPCProvider>
			</ThemeProvider>
			<Toaster position="top-right" />
		</NuqsAdapter>
	);
}
