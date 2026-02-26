"use client";

import { SignalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
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

const COLORS = [
	{ fill: "var(--chart-1)", bg: "bg-chart-1" },
	{ fill: "var(--chart-2)", bg: "bg-chart-2" },
	{ fill: "var(--chart-3)", bg: "bg-chart-3" },
	{ fill: "var(--chart-4)", bg: "bg-chart-4" },
];

export function DemographicsLevelChart(): React.JSX.Element {
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
					<Skeleton className="h-[280px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const total = data?.summary?.total ?? 0;
	const chartData = (data?.level ?? [])
		.filter((item) => item.count > 0)
		.map((item, i) => ({
			name: item.value,
			value: item.count,
			fill: COLORS[i % COLORS.length]!.fill,
			bg: COLORS[i % COLORS.length]!.bg,
		}));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<SignalIcon className="h-5 w-5 text-emerald-600" />
					{t("charts.level.title")}
				</CardTitle>
				<CardDescription>{t("charts.level.description")}</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[280px] items-center justify-center text-muted-foreground">
						{t("noData")}
					</div>
				) : (
					<div className="flex items-center gap-4">
						<div className="relative h-[220px] w-[220px]">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={chartData}
										cx="50%"
										cy="50%"
										innerRadius={65}
										outerRadius={95}
										paddingAngle={3}
										dataKey="value"
										strokeWidth={0}
									>
										{chartData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.fill} />
										))}
									</Pie>
									<Tooltip
										content={({ active, payload }) => {
											if (active && payload && payload.length > 0) {
												const d = payload[0]?.payload as {
													name: string;
													value: number;
												};
												const pct =
													total > 0
														? ((d.value / total) * 100).toFixed(1)
														: "0";
												return (
													<div className="rounded-lg border bg-background p-3 shadow-sm">
														<p className="text-sm font-medium">{d.name}</p>
														<p className="text-sm text-muted-foreground">
															{d.value} ({pct}%)
														</p>
													</div>
												);
											}
											return null;
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<span className="text-2xl font-bold">{total}</span>
								<span className="text-xs text-muted-foreground">
									{t("charts.total")}
								</span>
							</div>
						</div>
						<div className="flex-1 space-y-3">
							{chartData.map((item) => {
								const pct =
									total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
								return (
									<div key={item.name} className="flex items-center gap-3">
										<div
											className={cn(
												"w-3 h-3 rounded-full flex-shrink-0",
												item.bg,
											)}
										/>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<span className="text-sm truncate">{item.name}</span>
												<span className="text-sm font-medium tabular-nums">
													{item.value} ({pct}%)
												</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
