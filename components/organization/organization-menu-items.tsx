"use client";

import {
	BanknoteIcon,
	BarChart3Icon,
	BotIcon,
	CalendarDaysIcon,
	CalendarIcon,
	ChevronRight,
	ClipboardListIcon,
	CoinsIcon,
	CreditCardIcon,
	DumbbellIcon,
	LayoutDashboardIcon,
	MapPinIcon,
	MedalIcon,
	ReceiptIcon,
	SettingsIcon,
	TagsIcon,
	UserCheckIcon,
	UserIcon,
	UsersIcon,
	UsersRoundIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

type MenuItem = {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	external?: boolean;
	exactMatch?: boolean;
};

type MenuGroup = {
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	items: MenuItem[];
	defaultOpen?: boolean;
};

const STORAGE_KEY = "sidebar-open-groups";

export function OrganizationMenuItems(): React.JSX.Element {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { state } = useSidebar();

	// Get current user's profile info to determine which menu items to show
	const { data: userProfile } = trpc.organization.user.me.useQuery();

	const basePath = "/dashboard/organization";

	// Build sports items conditionally
	const sportsItems: MenuItem[] = [
		{
			label: "Athletes",
			href: `${basePath}/athletes`,
			icon: MedalIcon,
		},
		{
			label: "Athlete Groups",
			href: `${basePath}/athlete-groups`,
			icon: UsersIcon,
		},
		{
			label: "Coaches",
			href: `${basePath}/coaches`,
			icon: UserCheckIcon,
		},
		{
			label: "Training Sessions",
			href: `${basePath}/training-sessions`,
			icon: CalendarIcon,
		},
		{
			label: "Events",
			href: `${basePath}/events`,
			icon: CalendarDaysIcon,
		},
		{
			label: "Age Categories",
			href: `${basePath}/age-categories`,
			icon: TagsIcon,
		},
	];

	// Add coach sessions if user is a coach
	if (userProfile?.isCoach) {
		sportsItems.push({
			label: "My Sessions (Coach)",
			href: `${basePath}/my-sessions/coach`,
			icon: ClipboardListIcon,
		});
	}

	// Add athlete sessions if user is an athlete
	if (userProfile?.isAthlete) {
		sportsItems.push({
			label: "My Sessions (Athlete)",
			href: `${basePath}/my-sessions/athlete`,
			icon: UserIcon,
		});
	}

	const menuGroups: MenuGroup[] = [
		{
			label: "Deporte",
			icon: MedalIcon,
			items: sportsItems,
			defaultOpen: true,
		},
		{
			label: "Finanzas",
			icon: WalletIcon,
			items: [
				{
					label: "Payments",
					href: `${basePath}/payments`,
					icon: BanknoteIcon,
				},
				{
					label: "Expenses",
					href: `${basePath}/expenses`,
					icon: ReceiptIcon,
				},
				{
					label: "Cash Register",
					href: `${basePath}/cash-register`,
					icon: WalletIcon,
				},
			],
			defaultOpen: false,
		},
		{
			label: "Reportes",
			icon: BarChart3Icon,
			items: [
				{
					label: "Financieros",
					href: `${basePath}/reports/financial`,
					icon: BanknoteIcon,
				},
				{
					label: "Deportivos",
					href: `${basePath}/reports/sports`,
					icon: DumbbellIcon,
				},
			],
			defaultOpen: false,
		},
		{
			label: "General",
			icon: LayoutDashboardIcon,
			items: [
				{
					label: "Locations",
					href: `${basePath}/locations`,
					icon: MapPinIcon,
				},
				{
					label: "Users",
					href: `${basePath}/users`,
					icon: UsersRoundIcon,
				},
				{
					label: "AI Chatbot",
					href: `${basePath}/chatbot`,
					icon: BotIcon,
				},
			],
			defaultOpen: false,
		},
		{
			label: "Settings",
			icon: SettingsIcon,
			items: [
				{
					label: "General",
					href: `${basePath}/settings?tab=general`,
					icon: SettingsIcon,
				},
				{
					label: "Members",
					href: `${basePath}/settings?tab=members`,
					icon: UsersIcon,
				},
				{
					label: "Subscription",
					href: `${basePath}/settings?tab=subscription`,
					icon: CreditCardIcon,
				},
				{
					label: "Credits",
					href: `${basePath}/settings?tab=credits`,
					icon: CoinsIcon,
				},
			],
			defaultOpen: false,
		},
	];

	// Initialize open groups from localStorage or defaults
	const [openGroups, setOpenGroups] = React.useState<Set<string>>(() => {
		if (typeof window === "undefined") {
			return new Set(
				menuGroups.filter((g) => g.defaultOpen).map((g) => g.label),
			);
		}
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				return new Set(JSON.parse(stored));
			}
		} catch {
			// Ignore localStorage errors
		}
		return new Set(menuGroups.filter((g) => g.defaultOpen).map((g) => g.label));
	});

	// Persist open groups to localStorage
	React.useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([...openGroups]));
		} catch {
			// Ignore localStorage errors
		}
	}, [openGroups]);

	const getIsActive = React.useCallback(
		(item: MenuItem): boolean => {
			if (item.external) {
				return false;
			}
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
				// 2. item is the default tab (general) and no tab is set in URL
				if (pathname === itemPath) {
					if (currentTab === itemTab) return true;
					if (itemTab === "general" && !currentTab) return true;
				}
				return false;
			}
			return pathname.startsWith(item.href);
		},
		[pathname, searchParams],
	);

	const isCollapsed = state === "collapsed";

	const toggleGroup = (groupLabel: string) => {
		setOpenGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupLabel)) {
				next.delete(groupLabel);
			} else {
				next.add(groupLabel);
			}
			return next;
		});
	};

	// Check if any item in a group is active (for highlighting the group)
	const isGroupActive = React.useCallback(
		(group: MenuGroup): boolean => {
			return group.items.some((item) => getIsActive(item));
		},
		[getIsActive],
	);

	return (
		<ScrollArea
			className="[&>[data-radix-scroll-area-viewport]>div]:flex! h-full [&>[data-radix-scroll-area-viewport]>div]:h-full [&>[data-radix-scroll-area-viewport]>div]:flex-col"
			verticalScrollBar
		>
			{/* Dashboard link - always visible at top */}
			<SidebarGroup className="pb-0">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={pathname === basePath}
							tooltip="Dashboard"
						>
							<Link href={basePath}>
								<LayoutDashboardIcon
									className={cn(
										"size-4 shrink-0",
										pathname === basePath
											? "text-foreground"
											: "text-muted-foreground",
									)}
								/>
								<span
									className={cn(
										pathname === basePath
											? "dark:text-foreground"
											: "dark:text-muted-foreground",
									)}
								>
									Dashboard
								</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>

			{/* Collapsible groups */}
			{menuGroups.map((group) => {
				const isOpen = openGroups.has(group.label);
				const groupActive = isGroupActive(group);

				// When sidebar is collapsed, show all items as individual menu buttons
				if (isCollapsed) {
					return (
						<SidebarGroup className="pb-0" key={group.label}>
							<SidebarMenu>
								{group.items.map((item) => {
									const isActive = getIsActive(item);
									return (
										<SidebarMenuItem key={item.href}>
											<SidebarMenuButton
												asChild
												isActive={isActive}
												tooltip={item.label}
											>
												<Link
													href={item.href}
													{...(item.external && {
														target: "_blank",
														rel: "noopener noreferrer",
													})}
												>
													<item.icon
														className={cn(
															"size-4 shrink-0",
															isActive
																? "text-foreground"
																: "text-muted-foreground",
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
								})}
							</SidebarMenu>
						</SidebarGroup>
					);
				}

				// When expanded, show collapsible groups
				return (
					<SidebarGroup className="pb-0" key={group.label}>
						<SidebarMenu>
							<Collapsible
								className="group/collapsible"
								open={isOpen}
								onOpenChange={() => toggleGroup(group.label)}
							>
								<SidebarMenuItem>
									<CollapsibleTrigger asChild>
										<SidebarMenuButton
											className={cn(
												"flex w-full items-center justify-between",
												groupActive && !isOpen && "bg-sidebar-accent/50",
											)}
											tooltip={group.label}
										>
											<div className="flex items-center gap-2">
												<group.icon
													className={cn(
														"size-4 shrink-0",
														groupActive
															? "text-foreground"
															: "text-muted-foreground",
													)}
												/>
												<span
													className={cn(
														"font-medium",
														groupActive
															? "text-foreground"
															: "text-muted-foreground",
													)}
												>
													{group.label}
												</span>
											</div>
											<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub className="ml-0 border-l-0 pl-4">
											{group.items.map((item) => {
												const isActive = getIsActive(item);
												return (
													<SidebarMenuSubItem key={item.href}>
														<SidebarMenuSubButton asChild isActive={isActive}>
															<Link
																href={item.href}
																{...(item.external && {
																	target: "_blank",
																	rel: "noopener noreferrer",
																})}
															>
																<item.icon
																	className={cn(
																		"size-4 shrink-0",
																		isActive
																			? "text-foreground"
																			: "text-muted-foreground",
																	)}
																/>
																<span
																	className={cn(
																		isActive
																			? "text-foreground"
																			: "text-muted-foreground",
																	)}
																>
																	{item.label}
																</span>
															</Link>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												);
											})}
										</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
							</Collapsible>
						</SidebarMenu>
					</SidebarGroup>
				);
			})}
		</ScrollArea>
	);
}
