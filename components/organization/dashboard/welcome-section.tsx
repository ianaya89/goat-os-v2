"use client";

import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
	BanknoteIcon,
	BarChart3Icon,
	CalendarDaysIcon,
	CalendarPlusIcon,
	CreditCardIcon,
	UserPlusIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

type WelcomeSectionProps = {
	variant: "admin" | "athlete";
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

	const actions = variant === "admin" ? adminActions : athleteActions;

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="space-y-1">
				<h1 className="font-bold text-xl sm:text-2xl">
					{t("greeting", { name: firstName })}
				</h1>
				<p className="text-muted-foreground text-sm capitalize">{today}</p>
			</div>
			<div className="flex flex-wrap gap-2">
				{actions.map((action) => (
					<Button
						key={action.href}
						variant="outline"
						size="sm"
						asChild
						className="gap-1.5"
					>
						<Link href={action.href}>
							<action.icon className="size-3.5" />
							{action.label}
						</Link>
					</Button>
				))}
			</div>
		</div>
	);
}
