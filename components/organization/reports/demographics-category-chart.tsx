"use client";

import { TagsIcon } from "lucide-react";
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

export function DemographicsCategoryChart(): React.JSX.Element {
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

	const chartData = (data?.category ?? []).map((item) => ({
		name: item.value,
		count: item.count,
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TagsIcon className="h-5 w-5 text-amber-600" />
					{t("charts.category.title")}
				</CardTitle>
				<CardDescription>{t("charts.category.description")}</CardDescription>
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
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
									interval={0}
									angle={-45}
									textAnchor="end"
									height={60}
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
													<p className="text-sm font-medium">{d.name}</p>
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
									fill="hsl(var(--chart-3))"
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
