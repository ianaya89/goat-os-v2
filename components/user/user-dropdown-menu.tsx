"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	ExternalLinkIcon,
	LaptopIcon,
	MedalIcon,
	MoonIcon,
	MoreHorizontalIcon,
	SunIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import * as React from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarGroup,
	type SidebarGroupProps,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user/user-avatar";
import { appConfig } from "@/config/app.config";
import { authConfig } from "@/config/auth.config";
import { useProgressRouter } from "@/hooks/use-progress-router";
import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth/client";
import { LOCALE_COOKIE_NAME, type Locale, locales } from "@/lib/i18n/config";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

function isDialogOpen(): boolean {
	return !!document.querySelector('[role="dialog"]');
}

function isInputFocused(): boolean {
	const focusedElement = document.activeElement;
	return (
		!!focusedElement &&
		(focusedElement.tagName === "INPUT" ||
			focusedElement.tagName === "TEXTAREA")
	);
}

function getPlatform(): string {
	if (typeof window === "undefined") {
		return "unknown"; // Handle server-side rendering
	}

	const nav = navigator as Navigator & {
		userAgentData?: {
			platform: string;
		};
	};

	// Check for userAgentData (modern browsers)
	if (nav.userAgentData?.platform) {
		return nav.userAgentData.platform;
	}

	// Fallback to navigator.platform (older browsers)
	if (navigator.platform) {
		// Check for Android specifically
		if (navigator.userAgent && /android/i.test(navigator.userAgent)) {
			return "android";
		}
		return navigator.platform;
	}

	return "unknown";
}

function isMac(): boolean {
	return getPlatform().includes("mac");
}

// Build available theme modes from config + system option
const MODES = ["system", ...appConfig.theme.available];

const localeConfig: Record<Locale, { name: string; flag: string }> = {
	es: { name: "Español", flag: "🇪🇸" },
	en: { name: "English", flag: "🇺🇸" },
};

function Icon({ theme }: { theme: string | undefined }) {
	switch (theme) {
		case "light":
			return <SunIcon className="h-4" />;
		case "dark":
			return <MoonIcon className="h-4" />;
		default:
			return <LaptopIcon className="h-4" />;
	}
}

export function UserDropDownMenu(
	props: SidebarGroupProps,
): React.JSX.Element | null {
	const t = useTranslations("settings.user");
	const tAuth = useTranslations("auth");
	const tMenu = useTranslations("common.menu");
	const { user } = useSession();
	const { setTheme, theme } = useTheme();
	const router = useProgressRouter();
	const queryClient = useQueryClient();
	const { state: sidebarState } = useSidebar();
	const locale = useLocale() as Locale;
	const [mounted, setMounted] = React.useState(false);

	// Check if user is an athlete
	const { data: isAthlete } = trpc.athlete.isAthlete.useQuery();

	React.useEffect(() => {
		setMounted(true);
	}, []);

	const MenuItems = React.useMemo(
		() =>
			MODES.map((mode) => {
				const isSelected = theme === mode;
				return (
					<DropdownMenuItem
						className={cn("flex cursor-pointer items-center space-x-2", {
							"bg-muted": isSelected,
						})}
						key={mode}
						onClick={() => {
							setTheme(mode);
						}}
					>
						<Icon theme={mode} />
						<span>{capitalize(mode)}</span>
					</DropdownMenuItem>
				);
			}),
		[setTheme, theme],
	);

	const handleNavigateToProfile = (): void => {
		router.push("/dashboard/settings?tab=profile");
	};

	const handleNavigateToAthleteProfile = (): void => {
		router.push("/dashboard/my-profile");
	};

	const handleLocaleChange = (newLocale: Locale) => {
		document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
		// Full page reload to apply new locale (router.refresh doesn't re-read cookies)
		window.location.reload();
	};

	const handleSignOut = async () => {
		try {
			await authClient.signOut();
		} finally {
			// Clear the query cache to prevent any user data from persisting
			// This is critical for security when switching users
			queryClient.clear();

			// Preserve device-level preferences
			const theme = localStorage.getItem("theme");
			const cookieConsent = localStorage.getItem("cookie_consent");

			localStorage.clear();
			sessionStorage.clear();

			// Restore device-level preferences
			if (theme) localStorage.setItem("theme", theme);
			if (cookieConsent) localStorage.setItem("cookie_consent", cookieConsent);

			router.refresh();
			window.location.href = new URL(
				authConfig.redirectAfterLogout,
				window.location.origin,
			).toString();
		}
	};

	React.useEffect(() => {
		const mac = isMac();
		const hotkeys: Record<string, { action: () => void; shift: boolean }> = {
			p: { action: handleNavigateToProfile, shift: true },
			s: { action: handleSignOut, shift: true },
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (isDialogOpen() || isInputFocused()) {
				return;
			}

			const modifierKey = mac ? e.metaKey : e.ctrlKey;
			if (!modifierKey) {
				return;
			}

			const hotkey = hotkeys[e.key];
			if (!hotkey) {
				return;
			}
			if (hotkey.shift && !e.shiftKey) {
				return;
			}

			e.preventDefault();
			hotkey.action();
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Show skeleton placeholder during SSR and initial hydration
	if (!mounted || !user) {
		return (
			<SidebarGroup className="p-0" {...props}>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							className="group-data-[collapsible=icon]:!p-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:-ml-[1px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full"
							size="lg"
						>
							{sidebarState === "collapsed" ? (
								<Skeleton className="size-8 rounded-full bg-muted" />
							) : (
								<>
									<Skeleton className="size-8 rounded-full bg-muted" />
									<Skeleton className="h-4 flex-1 rounded bg-muted" />
									<Skeleton className="ml-auto h-4 w-4 rounded bg-muted" />
								</>
							)}
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>
		);
	}

	return (
		<SidebarGroup className="p-0" {...props}>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								className="group-data-[collapsible=icon]:!p-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:-ml-[1px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full"
								size="lg"
							>
								<UserAvatar
									className="size-6"
									name={user.name}
									src={user.image ?? undefined}
								/>
								<div className="flex w-full flex-col truncate text-left group-data-[collapsible=icon]:hidden">
									<p className="truncate font-medium text-sm leading-none">
										{user.name}
									</p>
									<p className="text-muted-foreground text-xs leading-none">
										{user.email}
									</p>
								</div>
								<MoreHorizontalIcon className="h-8 text-muted-foreground group-data-[collapsible=icon]:hidden" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-60" forceMount>
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="truncate font-medium text-sm leading-none">
										{user.name}
									</p>
									<p className="text-muted-foreground text-xs leading-none">
										{user.email}
									</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								{isAthlete && (
									<DropdownMenuItem
										className="cursor-pointer"
										onClick={handleNavigateToAthleteProfile}
									>
										<MedalIcon className="mr-2 size-4" />
										{tMenu("athleteProfile")}
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={handleNavigateToProfile}
								>
									{t("profile.title")}
									<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								{appConfig.theme.available.length > 1 && (
									<>
										<DropdownMenuSub>
											<DropdownMenuSubTrigger
												className={
													"hidden w-full items-center justify-between gap-x-3 lg:flex"
												}
											>
												<p>{t("preferences.theme")}</p>
											</DropdownMenuSubTrigger>
											<DropdownMenuSubContent>
												{MenuItems}
											</DropdownMenuSubContent>
										</DropdownMenuSub>
										<DropdownMenuSeparator />
									</>
								)}
								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="hidden w-full items-center justify-between gap-x-3 lg:flex">
										<p>{t("preferences.language")}</p>
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent>
										{locales.map((loc) => (
											<DropdownMenuItem
												key={loc}
												className={cn("cursor-pointer", {
													"bg-muted": locale === loc,
												})}
												onClick={() => handleLocaleChange(loc)}
											>
												<span className="mr-2">{localeConfig[loc].flag}</span>
												{localeConfig[loc].name}
											</DropdownMenuItem>
										))}
									</DropdownMenuSubContent>
								</DropdownMenuSub>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={() => window.open("/", "_blank")}
								>
									{tAuth("menu.homepage")}
									<ExternalLinkIcon className="ml-auto size-4 text-muted-foreground" />
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={handleSignOut}
							>
								{tAuth("menu.signOut")}
								<DropdownMenuShortcut>⇧⌘S</DropdownMenuShortcut>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
