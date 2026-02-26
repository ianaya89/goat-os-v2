"use client";

import { TrendingUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import {
	Area,
	AreaChart,
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

export function DemographicsGrowthChart(): React.JSX.Element {
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
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const chartData = (data?.growth ?? []).map((item) => ({
		month: item.month,
		newAthletes: item.newAthletes,
		cumulative: item.cumulative,
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUpIcon className="h-5 w-5 text-green-600" />
					{t("charts.growth.title")}
				</CardTitle>
				<CardDescription>{t("charts.growth.description")}</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						{t("noData")}
					</div>
				) : (
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData}>
								<defs>
									<linearGradient
										id="growthGradient"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--chart-1)"
											stopOpacity={0.3}
										/>
										<stop
											offset="95%"
											stopColor="var(--chart-1)"
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis
									dataKey="month"
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
									interval="preserveStartEnd"
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
												month: string;
												newAthletes: number;
												cumulative: number;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="text-sm font-medium">{d.month}</p>
													<p className="text-sm text-muted-foreground">
														{t("charts.growth.new")}: {d.newAthletes}
													</p>
													<p className="text-sm text-muted-foreground">
														{t("charts.growth.cumulative")}: {d.cumulative}
													</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Area
									type="monotone"
									dataKey="cumulative"
									stroke="var(--chart-1)"
									fill="url(#growthGradient)"
									strokeWidth={2}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
