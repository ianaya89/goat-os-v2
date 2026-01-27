"use client";

import {
	TrendingUpIcon,
	UserCheckIcon,
	UserMinusIcon,
	UserPlusIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export function RetentionCard(): React.JSX.Element {
	const t = useTranslations("dashboard.retention");
	const { data, isLoading } =
		trpc.organization.dashboard.getAthleteRetention.useQuery();

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-40 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("title")}</CardTitle>
					<CardDescription>{t("noData")}</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const getRetentionColor = (rate: number) => {
		if (rate >= 80) return "text-green-600";
		if (rate >= 60) return "text-amber-600";
		return "text-red-600";
	};

	const getRetentionBg = (rate: number) => {
		if (rate >= 80) return "bg-green-50 dark:bg-green-950";
		if (rate >= 60) return "bg-amber-50 dark:bg-amber-950";
		return "bg-red-50 dark:bg-red-950";
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<TrendingUpIcon className="size-5 text-cyan-500" />
							{t("title")}
						</CardTitle>
						<CardDescription>{t("description")}</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{data.total > 0 ? (
					<div className="space-y-4">
						{/* Retention Rate */}
						<div
							className={cn(
								"rounded-lg p-4 text-center",
								getRetentionBg(data.retentionRate),
							)}
						>
							<p
								className={cn(
									"text-3xl font-bold",
									getRetentionColor(data.retentionRate),
								)}
							>
								{data.retentionRate}%
							</p>
							<p className="text-sm text-muted-foreground">
								{t("retentionRate")}
							</p>
							<Progress value={data.retentionRate} className="mt-2 h-2" />
						</div>

						{/* Status Breakdown */}
						<div className="grid grid-cols-3 gap-2">
							<div className="flex flex-col items-center rounded-lg border p-2">
								<UserCheckIcon className="size-4 text-green-600 mb-1" />
								<span className="text-lg font-bold">{data.active}</span>
								<span className="text-xs text-muted-foreground">
									{t("active")}
								</span>
							</div>
							<div className="flex flex-col items-center rounded-lg border p-2">
								<UsersIcon className="size-4 text-amber-600 mb-1" />
								<span className="text-lg font-bold">{data.inactive}</span>
								<span className="text-xs text-muted-foreground">
									{t("inactive")}
								</span>
							</div>
							<div className="flex flex-col items-center rounded-lg border p-2">
								<UserMinusIcon className="size-4 text-red-600 mb-1" />
								<span className="text-lg font-bold">{data.churned}</span>
								<span className="text-xs text-muted-foreground">
									{t("churned")}
								</span>
							</div>
						</div>

						{/* Recent Activity */}
						<div className="space-y-2">
							<h4 className="text-xs font-medium text-muted-foreground">
								{t("last30Days")}
							</h4>
							<div className="flex gap-2">
								<div className="flex-1 flex items-center gap-2 rounded-lg bg-green-50 p-2 dark:bg-green-950">
									<UserPlusIcon className="size-4 text-green-600" />
									<div>
										<p className="text-sm font-medium text-green-600">
											+{data.newLast30Days}
										</p>
										<p className="text-xs text-muted-foreground">{t("new")}</p>
									</div>
								</div>
								<div className="flex-1 flex items-center gap-2 rounded-lg bg-red-50 p-2 dark:bg-red-950">
									<UserMinusIcon className="size-4 text-red-600" />
									<div>
										<p className="text-sm font-medium text-red-600">
											-{data.churnedLast30Days}
										</p>
										<p className="text-xs text-muted-foreground">
											{t("churned")}
										</p>
									</div>
								</div>
							</div>
						</div>

						<Button variant="outline" size="sm" asChild className="w-full">
							<Link href="/dashboard/organization/athletes">
								{t("viewAthletes")}
							</Link>
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center py-6 text-center">
						<UsersIcon className="size-10 text-muted-foreground/50 mb-2" />
						<p className="text-muted-foreground text-sm">{t("noAthletes")}</p>
						<Button variant="link" size="sm" asChild className="mt-2">
							<Link href="/dashboard/organization/athletes">
								{t("addAthletes")}
							</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
