import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ui/custom/theme-toggle";
import { appConfig } from "@/config/app.config";
import { PublicProfilesProviders } from "./providers";

/**
 * Public Profiles Layout
 * Minimal layout for public profile pages (athletes, coaches, etc.)
 */
export default function PublicProfilesLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<PublicProfilesProviders>
			<main className="min-h-screen bg-background">{children}</main>

			{/* Footer */}
			<footer className="border-t bg-muted/30 py-6">
				<div className="container mx-auto flex flex-col items-center justify-center gap-2 px-4 text-center">
					<a
						href="/"
						className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
					>
						<Logo size="sm" withLabel={false} />
						<span className="font-medium text-sm">
							Powered by {appConfig.appName}
						</span>
					</a>
					<p className="max-w-md text-muted-foreground text-xs">
						{appConfig.description}
					</p>
				</div>
			</footer>

			<ThemeToggle className="fixed right-4 bottom-4 z-50 rounded-full" />
		</PublicProfilesProviders>
	);
}
