"use client";

import type * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
	SidebarRail,
} from "@/components/ui/sidebar";
import { UserDropDownMenu } from "@/components/user/user-dropdown-menu";

export type SidebarLayoutProps = React.PropsWithChildren<{
	menuItems: React.ReactNode;
	defaultOpen?: boolean;
	defaultWidth?: string;
}>;

/**
 * Sidebar layout component with floating glass effect.
 * User menu is in the header, org switcher moved to topbar.
 */
export function SidebarLayout({
	menuItems,
	defaultOpen,
	defaultWidth,
	children,
}: SidebarLayoutProps): React.JSX.Element {
	return (
		<div className="flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-muted/50 via-background to-muted/30">
			<SidebarProvider defaultOpen={defaultOpen} defaultWidth={defaultWidth}>
				<Sidebar collapsible="icon" variant="floating">
					<SidebarHeader className="border-b border-sidebar-border/30 pb-2">
						<UserDropDownMenu />
					</SidebarHeader>
					<SidebarContent className="flex flex-col overflow-hidden pt-2">
						<div className="flex-1 overflow-hidden">{menuItems}</div>
					</SidebarContent>
					<SidebarRail />
				</Sidebar>
				<SidebarInset id="skip" className="size-full overflow-hidden">
					{children}
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
