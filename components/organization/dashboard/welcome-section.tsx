"use client";

import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
	BanknoteIcon,
	BarChart3Icon,
	CalendarDaysIcon,
	CalendarPlusIcon,
	CreditCardIcon,
	LayoutDashboardIcon,
	MoreHorizontalIcon,
	UserPlusIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";

type WelcomeSectionProps = {
	variant: "admin" | "athlete" | "coach";
};

export function WelcomeSection({
	variant,
}: WelcomeSectionProps): React.JSX.Element {
	const t = useTranslations("dashboard.welcomeSection");
	const { user } = useSession();
	const locale = useLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const dateFormat =
		locale === "es" ? "EEEE, d 'de' MMMM 'de' yyyy" : "EEEE, MMMM d, yyyy";
	const today = format(new Date(), dateFormat, { locale: dateLocale });
	const firstName = user?.name?.split(" ")[0] ?? "";

	const adminActions = [
		{
			label: t("addAthlete"),
			href: "/dashboard/organization/athletes",
			icon: UserPlusIcon,
		},
		{
			label: t("createSession"),
			href: "/dashboard/organization/training-sessions",
			icon: CalendarPlusIcon,
		},
		{
			label: t("recordPayment"),
			href: "/dashboard/organization/payments",
			icon: BanknoteIcon,
		},
		{
			label: t("viewReports"),
			href: "/dashboard/organization/reports",
			icon: BarChart3Icon,
		},
	];

	const coachActions = [
		{
			label: t("createSession"),
			href: "/dashboard/organization/training-sessions",
			icon: CalendarPlusIcon,
		},
		{
			label: t("myAthletes"),
			href: "/dashboard/organization/my-athletes",
			icon: UsersIcon,
		},
		{
			label: t("mySessions"),
			href: "/dashboard/organization/my-sessions/coach",
			icon: CalendarDaysIcon,
		},
	];

	const athleteActions = [
		{
			label: t("myCalendar"),
			href: "/dashboard/organization/my-calendar",
			icon: CalendarDaysIcon,
		},
		{
			label: t("myGroups"),
			href: "/dashboard/organization/my-groups",
			icon: UsersIcon,
		},
		{
			label: t("myPayments"),
			href: "/dashboard/organization/my-payments",
			icon: CreditCardIcon,
		},
	];

	const actions =
		variant === "admin"
			? adminActions
			: variant === "coach"
				? coachActions
				: athleteActions;

	// Only show quick actions for admin
	const showQuickActions = variant === "admin";

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="space-y-1">
				<h1 className="flex items-center gap-2 font-bold text-xl sm:text-2xl">
					<LayoutDashboardIcon className="size-5 text-muted-foreground" />
					{t("greeting", { name: firstName })}
				</h1>
				<p className="text-muted-foreground text-sm capitalize">{today}</p>
			</div>
			{showQuickActions && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="default" size="sm" className="gap-1.5">
							<MoreHorizontalIcon className="size-4" />
							{t("quickActions")}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						{actions.map((action) => (
							<DropdownMenuItem key={action.href} asChild>
								<Link href={action.href} className="flex items-center gap-2">
									<action.icon className="size-4" />
									{action.label}
								</Link>
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}
