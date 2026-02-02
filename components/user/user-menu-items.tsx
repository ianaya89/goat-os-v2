"use client";

import {
	ArrowLeftIcon,
	ClipboardListIcon,
	HomeIcon,
	MedalIcon,
	MonitorSmartphoneIcon,
	ShieldIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MySessionsMenuItem } from "@/components/user/my-sessions-menu-item";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

type MenuItem = {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	exactMatch?: boolean;
};

type MenuGroup = {
	label: string;
	items?: MenuItem[];
};

export function UserMenuItems(): React.JSX.Element {
	const t = useTranslations("common.menu");
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Check if user has an active organization to show "back" link
	const { data: activeOrganization } = authClient.useActiveOrganization();

	// Check if user is an athlete or coach
	const { data: isAthlete } = trpc.athlete.isAthlete.useQuery();
	const { data: isCoach } = trpc.coach.isCoach.useQuery();

	// Build application items - Home and profiles for athletes/coaches
	const applicationItems: MenuItem[] = [];
	if (isAthlete || isCoach) {
		applicationItems.push({
			label: t("home"),
			href: "/dashboard",
			icon: HomeIcon,
			exactMatch: true,
		});
	}
	if (isAthlete) {
		applicationItems.push({
			label: t("athleteProfile"),
			href: "/dashboard/my-profile",
			icon: MedalIcon,
		});
	}
	if (isCoach) {
		applicationItems.push({
			label: t("coachProfile"),
			href: "/dashboard/my-profile",
			icon: ClipboardListIcon,
		});
	}

	// Sessions items - rendered separately with special handling for org selection
	// Both athletes and coaches use the unified /sessions URL
	const mySessionsItem =
		isAthlete || isCoach
			? {
					label: t("mySessions"),
					href: "/dashboard/organization/sessions",
				}
			: null;

	// Build settings items
	const settingsItems: MenuItem[] = [
		{
			label: t("profile"),
			href: "/dashboard/settings?tab=profile",
			icon: UserIcon,
		},
		{
			label: t("security"),
			href: "/dashboard/settings?tab=security",
			icon: ShieldIcon,
		},
		{
			label: t("sessions"),
			href: "/dashboard/settings?tab=sessions",
			icon: MonitorSmartphoneIcon,
		},
	];

	// Include application group if there are items OR if there's a sessions item
	const hasApplicationSection =
		applicationItems.length > 0 || mySessionsItem !== null;

	const menuGroups: MenuGroup[] = [
		...(hasApplicationSection
			? [
					{
						label: t("application"),
						items: applicationItems,
					},
				]
			: []),
		{
			label: t("settings"),
			items: settingsItems,
		},
	];

	const getIsActive = React.useCallback(
		(item: MenuItem): boolean => {
			if (item.exactMatch) {
				return pathname === item.href;
			}
			// Check if the href contains query params
			if (item.href.includes("?")) {
				const [itemPath, itemQuery] = item.href.split("?");
				const itemParams = new URLSearchParams(itemQuery);
				const itemTab = itemParams.get("tab");
				const currentTab = searchParams.get("tab");

				// Match if pathname matches and either:
				// 1. tabs match exactly, or
				// 2. item is the default tab (profile) and no tab is set in URL
				if (pathname === itemPath) {
					if (currentTab === itemTab) return true;
					if (itemTab === "profile" && !currentTab) return true;
				}
				return false;
			}
			return pathname.startsWith(item.href);
		},
		[pathname, searchParams],
	);

	const renderMenuItem = (item: MenuItem, index: number) => {
		const isActive = getIsActive(item);
		return (
			<SidebarMenuItem key={index}>
				<SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
					<Link href={item.href}>
						<item.icon
							className={cn(
								"size-4 shrink-0",
								isActive ? "text-foreground" : "text-muted-foreground",
							)}
						/>
						<span
							className={cn(
								isActive
									? "dark:text-foreground"
									: "dark:text-muted-foreground",
							)}
						>
							{item.label}
						</span>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	};

	return (
		<ScrollArea
			className="[&>[data-radix-scroll-area-viewport]>div]:flex! h-full [&>[data-radix-scroll-area-viewport]>div]:h-full [&>[data-radix-scroll-area-viewport]>div]:flex-col"
			verticalScrollBar
		>
			{activeOrganization && (
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild tooltip={t("backToOrganization")}>
								<Link href="/dashboard/organization">
									<ArrowLeftIcon className="size-4 shrink-0 text-muted-foreground" />
									<span className="dark:text-muted-foreground">
										{t("backToOrganization")}
									</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
			)}
			{menuGroups.map((group, groupIndex) => {
				const isApplicationGroup = group.label === t("application");
				return (
					<SidebarGroup key={groupIndex}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarMenu suppressHydrationWarning>
							{group.items?.map(renderMenuItem)}
							{isApplicationGroup && mySessionsItem && (
								<MySessionsMenuItem
									label={mySessionsItem.label}
									href={mySessionsItem.href}
									isActive={pathname.startsWith(mySessionsItem.href)}
								/>
							)}
						</SidebarMenu>
					</SidebarGroup>
				);
			})}
		</ScrollArea>
	);
}
