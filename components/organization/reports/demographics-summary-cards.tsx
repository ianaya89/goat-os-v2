"use client";

import {
	BuildingIcon,
	CalendarIcon,
	PercentIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export function DemographicsSummaryCards(): React.JSX.Element {
	const t = useTranslations("organization.pages.reports.demographics");
	const { data, isLoading } =
		trpc.organization.reports.getDemographics.useQuery({});

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-32" />
							<Skeleton className="mt-2 h-3 w-20" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const summary = data?.summary ?? {
		total: 0,
		avgAge: 0,
		withClubCount: 0,
		withClubPercentage: 0,
	};

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<UsersIcon className="h-4 w-4" />
						{t("cards.totalAthletes")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold">{summary.total}</div>
					<p className="mt-1 text-xs text-muted-foreground">
						{t("cards.activeAthletes")}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<CalendarIcon className="h-4 w-4" />
						{t("cards.avgAge")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold">
						{summary.avgAge > 0
							? t("cards.years", { count: summary.avgAge })
							: "N/A"}
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						{t("cards.avgAgeDesc")}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<BuildingIcon className="h-4 w-4" />
						{t("cards.withClub")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold">
						{summary.withClubCount}
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						{t("cards.ofTotal", { total: summary.total })}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<PercentIcon className="h-4 w-4" />
						{t("cards.clubPercentage")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold">
						{summary.withClubPercentage}%
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						{t("cards.clubPercentageDesc")}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
