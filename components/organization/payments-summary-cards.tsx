"use client";

import {
	CalendarCheckIcon,
	CalendarDaysIcon,
	CalendarIcon,
	ClockIcon,
	TrendingUpIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export function PaymentsSummaryCards(): React.JSX.Element {
	const t = useTranslations("finance.payments.summary");
	const locale = useLocale();

	const { data, isPending } =
		trpc.organization.trainingPayment.getPaymentsSummary.useQuery();

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
			style: "currency",
			currency: "ARS",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount / 100);
	};

	if (isPending) {
		return (
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
				{Array.from({ length: 5 }).map((_, i) => (
					<Card key={`skeleton-${i}`}>
						<CardContent className="p-4">
							<Skeleton className="h-4 w-20 mb-2" />
							<Skeleton className="h-6 w-24" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const cards = [
		{
			key: "today",
			label: t("today"),
			icon: CalendarCheckIcon,
			total: data?.today.total ?? 0,
			count: data?.today.count ?? 0,
			color: "text-green-600",
		},
		{
			key: "week",
			label: t("thisWeek"),
			icon: CalendarDaysIcon,
			total: data?.week.total ?? 0,
			count: data?.week.count ?? 0,
			color: "text-blue-600",
		},
		{
			key: "month",
			label: t("thisMonth"),
			icon: CalendarIcon,
			total: data?.month.total ?? 0,
			count: data?.month.count ?? 0,
			color: "text-indigo-600",
		},
		{
			key: "pending",
			label: t("pending"),
			icon: ClockIcon,
			total: data?.pending.total ?? 0,
			count: data?.pending.count ?? 0,
			color: "text-amber-600",
		},
		{
			key: "total",
			label: t("totalCollected"),
			icon: TrendingUpIcon,
			total: data?.totalCollected.total ?? 0,
			count: data?.totalCollected.count ?? 0,
			color: "text-emerald-600",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
			{cards.map((card) => (
				<Card key={card.key}>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 text-muted-foreground mb-1">
							<card.icon className="size-3.5" />
							<span className="text-xs">{card.label}</span>
						</div>
						<p className={`font-semibold text-lg ${card.color}`}>
							{formatAmount(card.total)}
						</p>
						<p className="text-muted-foreground text-xs">
							{t("paymentsCount", { count: card.count })}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
