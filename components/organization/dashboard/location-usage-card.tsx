"use client";

import { ArrowRightIcon, MapPinIcon } from "lucide-react";
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
import { trpc } from "@/trpc/client";

export function LocationUsageCard(): React.JSX.Element {
	const t = useTranslations("dashboard.locationUsage");

	const { data, isLoading } =
		trpc.organization.dashboard.getLocationUsage.useQuery();

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

	// Max sessions for scaling the progress bars
	const maxSessions =
		data.locations.length > 0
			? Math.max(...data.locations.map((l) => l.sessionCount))
			: 0;

	return (
		<Card className="flex flex-col">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<MapPinIcon className="size-5 text-muted-foreground" />
							{t("title")}
						</CardTitle>
						<CardDescription>{t("thisWeek")}</CardDescription>
					</div>
					<div className="flex flex-col items-center rounded-lg bg-muted/50 px-3 py-2">
						<span className="text-2xl font-bold">{data.totalSessions}</span>
						<span className="text-xs text-muted-foreground">
							{t("sessions")}
						</span>
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col">
				{data.locations.length > 0 ? (
					<div className="flex flex-1 flex-col space-y-4">
						{/* Summary Stats */}
						<div className="grid grid-cols-2 gap-2 text-center">
							<div className="rounded-lg bg-muted/50 p-2">
								<p className="text-lg font-bold">{data.totalLocations}</p>
								<p className="text-xs text-muted-foreground">
									{t("locations")}
								</p>
							</div>
							<div className="rounded-lg bg-muted/50 p-2">
								<p className="text-lg font-bold">{data.totalSessions}</p>
								<p className="text-xs text-muted-foreground">{t("sessions")}</p>
							</div>
						</div>

						{/* Location Ranking */}
						<div className="space-y-2">
							<h4 className="text-xs font-medium text-muted-foreground">
								{t("ranking")}
							</h4>
							{data.locations.map((location, index) => (
								<div
									key={location.id}
									className="flex items-center justify-between rounded-lg border p-2"
								>
									<div className="flex items-center gap-2 min-w-0">
										<div
											className="flex size-7 items-center justify-center rounded bg-muted/50"
											style={
												location.color
													? { backgroundColor: `${location.color}20` }
													: undefined
											}
										>
											<span className="text-xs font-bold text-muted-foreground">
												#{index + 1}
											</span>
										</div>
										<div className="min-w-0">
											<p className="text-sm font-medium truncate">
												{location.name}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Progress
											value={
												maxSessions > 0
													? (location.sessionCount / maxSessions) * 100
													: 0
											}
											className="w-16 h-2"
										/>
										<span className="text-xs w-12 text-right">
											{t("sessionCount", { count: location.sessionCount })}
										</span>
									</div>
								</div>
							))}
						</div>

						<Button
							variant="ghost"
							size="sm"
							asChild
							className="mt-auto w-full gap-1.5"
						>
							<Link href="/dashboard/organization/locations">
								{t("viewAllLocations")}
								<ArrowRightIcon className="size-3.5" />
							</Link>
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center py-6 text-center">
						<MapPinIcon className="size-10 text-muted-foreground/50 mb-2" />
						<p className="text-muted-foreground text-sm">{t("noSessions")}</p>
						<Button variant="link" size="sm" asChild className="mt-2">
							<Link href="/dashboard/organization/training-sessions">
								{t("viewCalendar")}
							</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
