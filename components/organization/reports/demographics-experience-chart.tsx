"use client";

import { ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
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

const EXP_ORDER = ["0-1", "2-3", "4-5", "6-10", "10+", "N/A"];

export function DemographicsExperienceChart(): React.JSX.Element {
	const t = useTranslations("organization.pages.reports.demographics");
	const { data, isLoading } =
		trpc.organization.reports.getDemographics.useQuery({});

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[250px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const chartData = (data?.experience ?? [])
		.sort((a, b) => EXP_ORDER.indexOf(a.range) - EXP_ORDER.indexOf(b.range))
		.map((item) => ({
			name: item.range,
			count: item.count,
		}));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ClockIcon className="h-5 w-5 text-lime-600" />
					{t("charts.experience.title")}
				</CardTitle>
				<CardDescription>{t("charts.experience.description")}</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[250px] items-center justify-center text-muted-foreground">
						{t("noData")}
					</div>
				) : (
					<div className="h-[250px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis
									dataKey="name"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0) {
											const d = payload[0]?.payload as {
												name: string;
												count: number;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="text-sm font-medium">
														{d.name} {t("charts.experience.years")}
													</p>
													<p className="text-sm text-muted-foreground">
														{d.count} {t("charts.athletes")}
													</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Bar
									dataKey="count"
									fill="hsl(var(--chart-2))"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
