"use client";

import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { CalendarCheckIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
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

export function SessionOccupancyCard(): React.JSX.Element {
	const t = useTranslations("dashboard.sessionOccupancy");
	const locale = useLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const { data, isLoading } =
		trpc.organization.dashboard.getSessionOccupancy.useQuery();

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

	const getOccupancyColor = (rate: number) => {
		if (rate >= 80) return "text-green-600";
		if (rate >= 50) return "text-amber-600";
		return "text-red-600";
	};

	const getOccupancyBg = (rate: number) => {
		if (rate >= 80) return "bg-green-100 dark:bg-green-900";
		if (rate >= 50) return "bg-amber-100 dark:bg-amber-900";
		return "bg-red-100 dark:bg-red-900";
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<CalendarCheckIcon className="size-5 text-indigo-500" />
							{t("title")}
						</CardTitle>
						<CardDescription>{t("thisWeek")}</CardDescription>
					</div>
					<div
						className={cn(
							"flex flex-col items-center rounded-lg px-3 py-2",
							getOccupancyBg(data.averageOccupancy),
						)}
					>
						<span
							className={cn(
								"text-2xl font-bold",
								getOccupancyColor(data.averageOccupancy),
							)}
						>
							{data.averageOccupancy}%
						</span>
						<span className="text-xs text-muted-foreground">
							{t("average")}
						</span>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{data.totalSessions > 0 ? (
					<div className="space-y-4">
						{/* Summary Stats */}
						<div className="grid grid-cols-3 gap-2 text-center">
							<div className="rounded-lg bg-muted/50 p-2">
								<p className="text-lg font-bold">{data.totalSessions}</p>
								<p className="text-xs text-muted-foreground">{t("sessions")}</p>
							</div>
							<div className="rounded-lg bg-muted/50 p-2">
								<p className="text-lg font-bold">{data.totalAttendance}</p>
								<p className="text-xs text-muted-foreground">
									{t("attendees")}
								</p>
							</div>
							<div className="rounded-lg bg-muted/50 p-2">
								<p className="text-lg font-bold">{data.totalCapacity}</p>
								<p className="text-xs text-muted-foreground">{t("capacity")}</p>
							</div>
						</div>

						{/* Session List */}
						{data.sessions.length > 0 && (
							<div className="space-y-2">
								<h4 className="text-xs font-medium text-muted-foreground">
									{t("weekSessions")}
								</h4>
								{data.sessions.map((session) => (
									<div
										key={session.id}
										className="flex items-center justify-between rounded-lg border p-2"
									>
										<div className="flex items-center gap-2 min-w-0">
											<div
												className={cn(
													"flex size-7 items-center justify-center rounded",
													getOccupancyBg(session.occupancyRate),
												)}
											>
												<UsersIcon
													className={cn(
														"size-3",
														getOccupancyColor(session.occupancyRate),
													)}
												/>
											</div>
											<div className="min-w-0">
												<p className="text-sm font-medium truncate">
													{session.title}
												</p>
												<p className="text-xs text-muted-foreground">
													{format(new Date(session.startTime), "EEE d, HH:mm", {
														locale: dateLocale,
													})}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Progress
												value={session.occupancyRate}
												className="w-16 h-2"
											/>
											<span className="text-xs w-12 text-right">
												{session.attendance}/{session.capacity}
											</span>
										</div>
									</div>
								))}
							</div>
						)}

						<Button variant="outline" size="sm" asChild className="w-full">
							<Link href="/dashboard/organization/training-sessions">
								{t("viewAllSessions")}
							</Link>
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center py-6 text-center">
						<CalendarCheckIcon className="size-10 text-muted-foreground/50 mb-2" />
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
