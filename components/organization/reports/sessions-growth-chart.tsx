"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUpDownIcon } from "lucide-react";
import * as React from "react";
import {
	Bar,
	CartesianGrid,
	Cell,
	ComposedChart,
	Line,
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

type SessionsGrowthChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

export function SessionsGrowthChart({
	dateRange,
	period,
}: SessionsGrowthChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getSessionsByPeriod.useQuery({
			dateRange,
			period,
		});

	const chartData = React.useMemo(() => {
		const rawData =
			data?.map((item) => ({
				label: format(
					new Date(item.period),
					period === "year" ? "yyyy" : "MMM yy",
					{ locale: es },
				),
				total: item.total,
				completed: item.completed,
			})) ?? [];

		return rawData.map((item, index) => {
			const prev = index > 0 ? rawData[index - 1] : null;
			const growth =
				prev && prev.total > 0
					? ((item.total - prev.total) / prev.total) * 100
					: null;

			return {
				...item,
				growth: growth !== null ? Math.round(growth * 10) / 10 : null,
			};
		});
	}, [data, period]);

	// Skip first period (no previous to compare)
	const displayData = chartData.slice(1);

	const avgGrowth = React.useMemo(() => {
		const withGrowth = displayData.filter((d) => d.growth !== null);
		if (withGrowth.length === 0) return 0;
		return (
			withGrowth.reduce((acc, d) => acc + (d.growth ?? 0), 0) /
			withGrowth.length
		);
	}, [displayData]);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ArrowUpDownIcon className="h-5 w-5" />
					Variacion entre Periodos
				</CardTitle>
				<CardDescription>
					Crecimiento promedio:{" "}
					<span className={avgGrowth >= 0 ? "text-green-600" : "text-red-600"}>
						{avgGrowth >= 0 ? "+" : ""}
						{avgGrowth.toFixed(1)}%
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent>
				{displayData.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						Se necesitan al menos 2 periodos para mostrar variacion
					</div>
				) : (
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<ComposedChart data={displayData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis
									dataKey="label"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									yAxisId="growth"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
									tickFormatter={(value) => `${value}%`}
								/>
								<YAxis
									yAxisId="amount"
									orientation="right"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0) {
											const item = payload[0]?.payload as {
												label: string;
												total: number;
												completed: number;
												growth: number | null;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="mb-2 text-sm font-medium">
														{item.label}
													</p>
													<div className="space-y-1 text-sm">
														<p>
															Sesiones: {item.total} ({item.completed}{" "}
															completadas)
														</p>
														{item.growth !== null && (
															<p>
																Variacion:{" "}
																<span
																	className={`font-medium ${item.growth >= 0 ? "text-green-600" : "text-red-600"}`}
																>
																	{item.growth >= 0 ? "+" : ""}
																	{item.growth.toFixed(1)}%
																</span>
															</p>
														)}
													</div>
												</div>
											);
										}
										return null;
									}}
								/>
								<Bar
									yAxisId="growth"
									dataKey="growth"
									radius={[4, 4, 0, 0]}
									maxBarSize={40}
								>
									{displayData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={(entry.growth ?? 0) >= 0 ? "#16a34a" : "#dc2626"}
											fillOpacity={0.7}
										/>
									))}
								</Bar>
								<Line
									yAxisId="amount"
									type="monotone"
									dataKey="total"
									stroke="hsl(var(--primary))"
									strokeWidth={2}
									dot={{
										fill: "hsl(var(--primary))",
										r: 3,
									}}
									activeDot={{ r: 5 }}
								/>
							</ComposedChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
