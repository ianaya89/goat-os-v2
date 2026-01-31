"use client";

import {
	BanknoteIcon,
	BarChart3Icon,
	BellIcon,
	BotIcon,
	CalendarDaysIcon,
	CalendarIcon,
	ChartLineIcon,
	ChevronRight,
	ClipboardListIcon,
	ContactRoundIcon,
	DumbbellIcon,
	FileTextIcon,
	HandshakeIcon,
	HardHatIcon,
	HistoryIcon,
	LandmarkIcon,
	LayoutDashboardIcon,
	MapPinIcon,
	MedalIcon,
	PackageIcon,
	ReceiptIcon,
	ShieldIcon,
	SwordsIcon,
	TagsIcon,
	TicketIcon,
	TrophyIcon,
	TruckIcon,
	UserCheckIcon,
	UserIcon,
	UsersIcon,
	WalletCardsIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { useOrganizationUserProfile } from "@/app/(saas)/dashboard/(sidebar)/organization/providers";
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
import { OrganizationFeature } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";

type MenuItem = {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	external?: boolean;
	exactMatch?: boolean;
	/** Optional prefix to use for active state detection instead of href */
	activePrefix?: string;
	/** Optional feature flag - if set, item only shows when this feature is enabled */
	feature?: OrganizationFeature;
};

type MenuGroup = {
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	items: MenuItem[];
	defaultOpen?: boolean;
};

const STORAGE_KEY = "sidebar-open-groups";

export function OrganizationMenuItems(): React.JSX.Element {
	const t = useTranslations("organization.menu");
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { state } = useSidebar();

	// Get user profile from context (set by server-side layout)
	const userProfile = useOrganizationUserProfile();

	const basePath = "/dashboard/organization";

	// Use pre-computed capability from context
	const isRestrictedMember = userProfile.capabilities.isRestrictedMember;

	// Menu items for restricted members (athletes) - no "My" prefix needed
	// since they can only see their own data anyway
	const restrictedMemberMenuItems: MenuItem[] = [
		{
			label: t("calendar"),
			href: `${basePath}/my-calendar`,
			icon: CalendarIcon,
			feature: OrganizationFeature.trainingSessions,
		},
		{
			label: t("sessions"),
			href: `${basePath}/my-sessions/athlete`,
			icon: ClipboardListIcon,
			feature: OrganizationFeature.trainingSessions,
		},
		{
			label: t("groupsItem"),
			href: `${basePath}/my-groups`,
			icon: UsersIcon,
			feature: OrganizationFeature.athleteGroups,
		},
		{
			label: t("paymentsSimple"),
			href: `${basePath}/my-payments`,
			icon: BanknoteIcon,
			feature: OrganizationFeature.payments,
		},
		{
			label: t("eventsSimple"),
			href: `${basePath}/my-events`,
			icon: CalendarDaysIcon,
			feature: OrganizationFeature.events,
		},
	];

	// Build sports items conditionally (for admin/owner view)
	const sportsItems: MenuItem[] = [
		{
			label: t("athletes"),
			href: `${basePath}/athletes`,
			icon: MedalIcon,
			feature: OrganizationFeature.athletes,
		},
		{
			label: t("athleteGroups"),
			href: `${basePath}/athlete-groups`,
			icon: UsersIcon,
			feature: OrganizationFeature.athleteGroups,
		},
		{
			label: t("coaches"),
			href: `${basePath}/coaches`,
			icon: UserCheckIcon,
			feature: OrganizationFeature.coaches,
		},
		{
			label: t("trainingSessions"),
			href: `${basePath}/training-sessions`,
			icon: CalendarIcon,
			feature: OrganizationFeature.trainingSessions,
		},
		{
			label: t("confirmations"),
			href: `${basePath}/confirmations`,
			icon: BellIcon,
			feature: OrganizationFeature.trainingSessions,
		},
		{
			label: t("events"),
			href: `${basePath}/events`,
			icon: CalendarDaysIcon,
			feature: OrganizationFeature.events,
		},
		{
			label: t("eventTemplates"),
			href: `${basePath}/events/templates`,
			icon: FileTextIcon,
			feature: OrganizationFeature.eventTemplates,
		},
		{
			label: t("waitlist"),
			href: `${basePath}/waitlist`,
			icon: ClipboardListIcon,
			feature: OrganizationFeature.waitlist,
		},
		{
			label: t("equipment"),
			href: `${basePath}/equipment`,
			icon: HardHatIcon,
			feature: OrganizationFeature.equipment,
		},
		{
			label: t("inventoryAudit"),
			href: `${basePath}/equipment/audit`,
			icon: ClipboardListIcon,
			feature: OrganizationFeature.equipmentAudit,
		},
	];

	// Add coach sessions if user is a coach
	if (userProfile.isCoach) {
		sportsItems.push({
			label: t("mySessionsCoach"),
			href: `${basePath}/my-sessions/coach`,
			icon: ClipboardListIcon,
			feature: OrganizationFeature.trainingSessions,
		});
	}

	// Add athlete sessions if user is an athlete (but not restricted - they have their own menu)
	if (userProfile.isAthlete && !isRestrictedMember) {
		sportsItems.push({
			label: t("mySessionsAthlete"),
			href: `${basePath}/my-sessions/athlete`,
			icon: UserIcon,
			feature: OrganizationFeature.trainingSessions,
		});
	}

	// Restricted member menu groups (simpler, no "My" prefix)
	const restrictedMemberMenuGroups: MenuGroup[] = [
		{
			label: t("groups.activity"),
			icon: CalendarIcon,
			items: restrictedMemberMenuItems,
			defaultOpen: true,
		},
	];

	// Competition items (teams, matches, tournaments)
	const competitionItems: MenuItem[] = [
		{
			label: t("seasons"),
			href: `${basePath}/seasons`,
			icon: CalendarIcon,
			feature: OrganizationFeature.teams,
		},
		{
			label: t("teams"),
			href: `${basePath}/teams`,
			icon: ShieldIcon,
			feature: OrganizationFeature.teams,
		},
		{
			label: t("competitions"),
			href: `${basePath}/competitions`,
			icon: TrophyIcon,
			feature: OrganizationFeature.competitions,
		},
		{
			label: t("matches"),
			href: `${basePath}/matches`,
			icon: SwordsIcon,
			feature: OrganizationFeature.matches,
		},
	];

	// Admin/Owner menu groups
	const adminMenuGroups: MenuGroup[] = [
		{
			label: t("groups.sports"),
			icon: MedalIcon,
			items: sportsItems,
			defaultOpen: true,
		},
		{
			label: t("groups.competitions"),
			icon: TrophyIcon,
			items: competitionItems,
			defaultOpen: false,
		},
		{
			label: t("groups.finance"),
			icon: WalletIcon,
			items: [
				{
					label: t("payments"),
					href: `${basePath}/payments`,
					icon: BanknoteIcon,
					feature: OrganizationFeature.payments,
				},
				{
					label: t("expenses"),
					href: `${basePath}/expenses`,
					icon: ReceiptIcon,
					feature: OrganizationFeature.expenses,
				},
				{
					label: t("cashRegister"),
					href: `${basePath}/cash-register`,
					exactMatch: true,
					icon: LandmarkIcon,
					feature: OrganizationFeature.cashRegister,
				},
				{
					label: t("cashRegisterHistory"),
					href: `${basePath}/cash-register/history`,
					activePrefix: `${basePath}/cash-register/`,
					icon: HistoryIcon,
					feature: OrganizationFeature.cashRegister,
				},
				{
					label: t("products"),
					href: `${basePath}/products`,
					icon: PackageIcon,
					feature: OrganizationFeature.products,
				},
				{
					label: t("payroll"),
					href: `${basePath}/payroll`,
					icon: WalletCardsIcon,
					feature: OrganizationFeature.payroll,
				},
			],
			defaultOpen: false,
		},
		{
			label: t("groups.reports"),
			icon: BarChart3Icon,
			items: [
				{
					label: t("financialReports"),
					href: `${basePath}/reports/financial`,
					icon: ChartLineIcon,
					feature: OrganizationFeature.financialReports,
				},
				{
					label: t("sportsReports"),
					href: `${basePath}/reports/sports`,
					icon: DumbbellIcon,
					feature: OrganizationFeature.sportsReports,
				},
			],
			defaultOpen: false,
		},
		{
			label: t("groups.general"),
			icon: LayoutDashboardIcon,
			items: [
				{
					label: t("institutions"),
					href: `${basePath}/institutions`,
					icon: ShieldIcon,
					// No feature flag - institutions management is always available
				},
				{
					label: t("ageCategories"),
					href: `${basePath}/age-categories`,
					icon: TagsIcon,
					feature: OrganizationFeature.ageCategories,
				},
				{
					label: t("locations"),
					href: `${basePath}/locations`,
					icon: MapPinIcon,
					feature: OrganizationFeature.locations,
				},
				{
					label: t("users"),
					href: `${basePath}/users`,
					icon: ContactRoundIcon,
					// No feature flag - users management is always available
				},
				{
					label: t("vendors"),
					href: `${basePath}/vendors`,
					icon: TruckIcon,
					feature: OrganizationFeature.vendors,
				},
				{
					label: t("sponsors"),
					href: `${basePath}/sponsors`,
					icon: HandshakeIcon,
					feature: OrganizationFeature.sponsors,
				},
				{
					label: t("services"),
					href: `${basePath}/services`,
					icon: TicketIcon,
					feature: OrganizationFeature.services,
				},
				{
					label: t("chatbot"),
					href: `${basePath}/chatbot`,
					icon: BotIcon,
					feature: OrganizationFeature.chatbot,
				},
			],
			defaultOpen: false,
		},
	];

	// Filter menu items based on enabled features
	const enabledFeatures = userProfile.enabledFeatures;
	const filterByFeature = (items: MenuItem[]): MenuItem[] =>
		items.filter((item) => !item.feature || enabledFeatures.has(item.feature));

	// Filter groups and remove empty groups
	const filterMenuGroups = (groups: MenuGroup[]): MenuGroup[] =>
		groups
			.map((group) => ({
				...group,
				items: filterByFeature(group.items),
			}))
			.filter((group) => group.items.length > 0);

	// Use restricted member menu if user has restricted access, otherwise use admin menu
	const menuGroups: MenuGroup[] = filterMenuGroups(
		isRestrictedMember ? restrictedMemberMenuGroups : adminMenuGroups,
	);

	// Initialize open groups with defaults (consistent for SSR and client hydration)
	const [openGroups, setOpenGroups] = React.useState<Set<string>>(
		() => new Set(menuGroups.filter((g) => g.defaultOpen).map((g) => g.label)),
	);

	// Track if we've restored from localStorage to avoid overwriting on first render
	const hasRestoredRef = React.useRef(false);

	// Restore from localStorage after hydration (client-side only)
	React.useEffect(() => {
		if (hasRestoredRef.current) return;
		hasRestoredRef.current = true;

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				setOpenGroups(new Set(JSON.parse(stored)));
			}
		} catch {
			// Ignore localStorage errors
		}
	}, []);

	// Persist open groups to localStorage
	React.useEffect(() => {
		// Don't persist until we've restored (to avoid overwriting stored state)
		if (!hasRestoredRef.current) return;

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
			if (item.activePrefix) {
				return pathname.startsWith(item.activePrefix);
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
							tooltip={t("dashboard")}
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
									{t("dashboard")}
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
