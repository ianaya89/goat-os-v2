"use client";

import { format, subDays } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { TrendingUpIcon, UsersIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import {
	Bar,
	BarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export function WeeklyAttendanceChart(): React.JSX.Element {
	const t = useTranslations("dashboard.weeklyAttendance");
	const locale = useLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const thirtyDaysAgo = subDays(new Date(), 30);

	const { data, isLoading, error } =
		trpc.organization.reports.getAttendanceTrend.useQuery({
			period: "week",
			dateRange: {
				from: thirtyDaysAgo,
				to: new Date(),
			},
		});

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUpIcon className="size-5 text-blue-500" />
						{t("title")}
					</CardTitle>
					<CardDescription>{t("description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center py-8 text-center">
						<UsersIcon className="size-10 text-destructive/50 mb-2" />
						<p className="text-destructive text-sm">{t("errorLoading")}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[200px] w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUpIcon className="size-5 text-blue-500" />
						{t("title")}
					</CardTitle>
					<CardDescription>{t("description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center py-8 text-center">
						<UsersIcon className="size-10 text-muted-foreground/50 mb-2" />
						<p className="text-muted-foreground text-sm">{t("noData")}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const chartData = data.map((d) => ({
		week: format(new Date(d.period), "d MMM", { locale: dateLocale }),
		present: d.present + d.late,
		absent: d.absent,
		rate: Math.round(d.rate),
	}));

	// Calculate average rate
	const avgRate =
		data.length > 0
			? Math.round(data.reduce((acc, d) => acc + d.rate, 0) / data.length)
			: 0;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<TrendingUpIcon className="size-5 text-blue-500" />
							{t("title")}
						</CardTitle>
						<CardDescription>{t("trend")}</CardDescription>
					</div>
					<div className="text-right">
						<p className="text-2xl font-bold text-blue-600">{avgRate}%</p>
						<p className="text-xs text-muted-foreground">{t("average")}</p>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={200}>
					<BarChart data={chartData}>
						<XAxis
							dataKey="week"
							fontSize={12}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis fontSize={12} tickLine={false} axisLine={false} />
						<Tooltip
							content={({ active, payload }) => {
								if (active && payload && payload.length) {
									const data = payload[0]?.payload;
									return (
										<div className="rounded-lg border bg-background p-2 shadow-sm">
											<p className="font-medium text-sm">{data.week}</p>
											<p className="text-xs text-green-600">
												{t("present")}: {data.present}
											</p>
											<p className="text-xs text-red-600">
												{t("absent")}: {data.absent}
											</p>
											<p className="text-xs text-blue-600">
												{t("rate")}: {data.rate}%
											</p>
										</div>
									);
								}
								return null;
							}}
						/>
						<Bar
							dataKey="present"
							fill="hsl(var(--chart-2))"
							radius={[4, 4, 0, 0]}
							name={t("present")}
						/>
						<Bar
							dataKey="absent"
							fill="hsl(var(--chart-1))"
							radius={[4, 4, 0, 0]}
							name={t("absent")}
						/>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
