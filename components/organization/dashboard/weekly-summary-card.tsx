"use client";

import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
	ArrowRightIcon,
	BanknoteIcon,
	CalendarIcon,
	CheckCircleIcon,
	TrendingUpIcon,
	UsersIcon,
	XCircleIcon,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export function WeeklySummaryCard(): React.JSX.Element {
	const t = useTranslations("dashboard.weekly");
	const locale = useLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const { data, isLoading } =
		trpc.organization.dashboard.getWeeklyActivity.useQuery();

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
			style: "currency",
			currency: "ARS",
		}).format(amount / 100);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-48 w-full" />
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

	// Format daily breakdown for chart
	const chartData = data.dailyBreakdown.map((day) => ({
		date: day.date,
		sessions: day.sessions,
		label: format(new Date(day.date), "EEE", { locale: dateLocale }),
	}));

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<TrendingUpIcon className="size-5 text-primary" />
							{t("title")}
						</CardTitle>
						<CardDescription>
							{format(data.period.from, "d MMM", { locale: dateLocale })} -{" "}
							{format(data.period.to, "d MMM yyyy", { locale: dateLocale })}
						</CardDescription>
					</div>
					<Button variant="ghost" size="sm" asChild className="gap-1.5">
						<Link href="/dashboard/organization/reports">
							{t("viewReports")}
							<ArrowRightIcon className="size-3.5" />
						</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Summary Stats */}
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<CalendarIcon className="size-4" />
							{t("sessions")}
						</div>
						<p className="text-2xl font-bold">{data.sessions.total}</p>
						<div className="flex items-center gap-2 text-xs">
							<span className="flex items-center gap-1 text-green-600">
								<CheckCircleIcon className="size-3" />
								{data.sessions.completed}
							</span>
							<span className="text-muted-foreground">{t("completed")}</span>
						</div>
					</div>

					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<UsersIcon className="size-4" />
							{t("attendance")}
						</div>
						<p className="text-2xl font-bold">{data.attendance.rate}%</p>
						<div className="flex items-center gap-2 text-xs">
							<span className="text-muted-foreground">
								{data.attendance.present + data.attendance.late} /{" "}
								{data.attendance.total}
							</span>
						</div>
					</div>

					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<BanknoteIcon className="size-4" />
							{t("income")}
						</div>
						<p className="text-xl font-bold text-green-600">
							{formatAmount(data.income.total)}
						</p>
						<div className="flex items-center gap-2 text-xs">
							<span className="text-muted-foreground">
								{data.income.count} {t("payments")}
							</span>
						</div>
					</div>

					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<XCircleIcon className="size-4" />
							{t("cancelled")}
						</div>
						<p className="text-2xl font-bold text-muted-foreground">
							{data.sessions.cancelled}
						</p>
						<div className="flex items-center gap-2 text-xs">
							<span className="text-muted-foreground">
								{data.sessions.total > 0
									? Math.round(
											(data.sessions.cancelled / data.sessions.total) * 100,
										)
									: 0}
								%
							</span>
						</div>
					</div>
				</div>

				{/* Daily Sessions Chart */}
				{chartData.length > 0 && (
					<div className="space-y-3">
						<h4 className="text-sm font-medium text-muted-foreground">
							{t("sessionsPerDay")}
						</h4>
						<div className="flex items-end justify-between gap-2">
							{chartData.map((day) => {
								const maxSessions = Math.max(
									...chartData.map((d) => d.sessions),
									1,
								);
								const heightPercent = (day.sessions / maxSessions) * 100;
								const hasSession = day.sessions > 0;

								return (
									<div
										key={day.date}
										className="flex flex-1 flex-col items-center gap-1"
									>
										<span
											className={cn(
												"text-xs font-medium",
												hasSession ? "text-primary" : "text-muted-foreground",
											)}
										>
											{day.sessions}
										</span>
										<div className="relative h-20 w-full">
											<div
												className={cn(
													"absolute bottom-0 left-1/2 w-10 -translate-x-1/2 rounded-t-md transition-all",
													hasSession
														? "bg-primary/80 hover:bg-primary"
														: "bg-muted",
												)}
												style={{
													height: hasSession
														? `${Math.max(heightPercent, 15)}%`
														: "8px",
												}}
											/>
										</div>
										<span className="text-xs text-muted-foreground capitalize">
											{day.label}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Attendance Breakdown */}
				{data.attendance.total > 0 && (
					<div className="space-y-2">
						<h4 className="text-sm font-medium text-muted-foreground">
							{t("attendanceBreakdown")}
						</h4>
						<div className="grid grid-cols-4 gap-2">
							<div className="rounded-lg bg-muted/50 p-2 text-center">
								<p className="font-bold">{data.attendance.present}</p>
								<p className="text-muted-foreground text-xs">
									{t("presentLabel")}
								</p>
							</div>
							<div className="rounded-lg bg-muted/50 p-2 text-center">
								<p className="font-bold">{data.attendance.late}</p>
								<p className="text-muted-foreground text-xs">
									{t("lateLabel")}
								</p>
							</div>
							<div className="rounded-lg bg-muted/50 p-2 text-center">
								<p className="font-bold">{data.attendance.absent}</p>
								<p className="text-muted-foreground text-xs">
									{t("absentLabel")}
								</p>
							</div>
							<div className="rounded-lg bg-muted/50 p-2 text-center">
								<p className="font-bold">{data.attendance.excused}</p>
								<p className="text-muted-foreground text-xs">
									{t("excusedLabel")}
								</p>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
