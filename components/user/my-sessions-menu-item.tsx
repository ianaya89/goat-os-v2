"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { clearOrganizationScopedQueries } from "@/trpc/query-client";

type MySessionsMenuItemProps = {
	label: string;
	href: string;
	isActive: boolean;
};

export function MySessionsMenuItem({
	label,
	href,
	isActive,
}: MySessionsMenuItemProps): React.JSX.Element | null {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isNavigating, setIsNavigating] = React.useState(false);

	const { data: activeOrganization } = authClient.useActiveOrganization();
	const { data: allOrganizations, isLoading } =
		trpc.organization.list.useQuery();

	// Don't render if user has no organizations
	if (!isLoading && (!allOrganizations || allOrganizations.length === 0)) {
		return null;
	}

	const handleClick = async (e: React.MouseEvent) => {
		e.preventDefault();

		// If already have an active organization, just navigate
		if (activeOrganization) {
			router.push(href);
			return;
		}

		// If no organizations available, do nothing
		if (!allOrganizations || allOrganizations.length === 0) {
			return;
		}

		// Auto-select the first organization and navigate
		const firstOrg = allOrganizations[0];
		if (!firstOrg) return;

		setIsNavigating(true);
		try {
			await authClient.organization.setActive({
				organizationId: firstOrg.id,
			});
			clearOrganizationScopedQueries(queryClient);
			router.push(href);
		} catch (error) {
			console.error("Failed to set active organization:", error);
		} finally {
			setIsNavigating(false);
		}
	};

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				isActive={isActive}
				tooltip={label}
				onClick={handleClick}
				disabled={isLoading || isNavigating}
			>
				<CalendarIcon
					className={cn(
						"size-4 shrink-0",
						isActive ? "text-foreground" : "text-muted-foreground",
					)}
				/>
				<span
					className={cn(
						isActive ? "dark:text-foreground" : "dark:text-muted-foreground",
					)}
				>
					{label}
				</span>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}
