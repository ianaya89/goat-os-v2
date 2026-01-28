"use client";

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
import {
	generatePeriodDates,
	getPeriodKey,
	getPeriodLabel,
} from "@/lib/utils/chart-periods";
import { trpc } from "@/trpc/client";

type PeriodGrowthChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

export function PeriodGrowthChart({
	dateRange,
	period,
}: PeriodGrowthChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getCashFlowReport.useQuery({
			dateRange,
			period,
		});

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount / 100);
	};

	const chartData = React.useMemo(() => {
		const allDates = generatePeriodDates(dateRange, period);
		const dataMap = new Map(
			(data ?? []).map((item) => [
				getPeriodKey(new Date(item.period), period),
				item,
			]),
		);

		const rawData = allDates.map((date) => {
			const item = dataMap.get(getPeriodKey(date, period));
			return {
				revenue: item?.revenue ?? 0,
				expenses: item?.expenses ?? 0,
				label: getPeriodLabel(date, period, es),
			};
		});

		return rawData.map((item, index) => {
			const prev = index > 0 ? rawData[index - 1] : null;

			const revenueGrowth =
				prev && prev.revenue > 0
					? ((item.revenue - prev.revenue) / prev.revenue) * 100
					: null;

			const expenseGrowth =
				prev && prev.expenses > 0
					? ((item.expenses - prev.expenses) / prev.expenses) * 100
					: null;

			return {
				...item,
				revenueGrowth:
					revenueGrowth !== null ? Math.round(revenueGrowth * 10) / 10 : null,
				expenseGrowth:
					expenseGrowth !== null ? Math.round(expenseGrowth * 10) / 10 : null,
			};
		});
	}, [data, dateRange, period]);

	// Skip first period (no previous to compare)
	const displayData = chartData.slice(1);

	const avgRevenueGrowth = React.useMemo(() => {
		const withGrowth = displayData.filter((d) => d.revenueGrowth !== null);
		if (withGrowth.length === 0) return 0;
		return (
			withGrowth.reduce((acc, d) => acc + (d.revenueGrowth ?? 0), 0) /
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
					<ArrowUpDownIcon className="h-5 w-5 text-primary" />
					Variacion entre Periodos
				</CardTitle>
				<CardDescription>
					Crecimiento promedio de ingresos:{" "}
					<span
						className={
							avgRevenueGrowth >= 0 ? "text-green-600" : "text-red-600"
						}
					>
						{avgRevenueGrowth >= 0 ? "+" : ""}
						{avgRevenueGrowth.toFixed(1)}%
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
									tickFormatter={(value) =>
										new Intl.NumberFormat("es-AR", {
											notation: "compact",
											compactDisplay: "short",
										}).format(value / 100)
									}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0) {
											const item = payload[0]?.payload as {
												label: string;
												revenue: number;
												expenses: number;
												revenueGrowth: number | null;
												expenseGrowth: number | null;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="mb-2 text-sm font-medium">
														{item.label}
													</p>
													<div className="space-y-1 text-sm">
														<p>
															Ingresos: {formatAmount(item.revenue)}
															{item.revenueGrowth !== null && (
																<span
																	className={`ml-1 font-medium ${item.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
																>
																	({item.revenueGrowth >= 0 ? "+" : ""}
																	{item.revenueGrowth.toFixed(1)}
																	%)
																</span>
															)}
														</p>
														<p>
															Gastos: {formatAmount(item.expenses)}
															{item.expenseGrowth !== null && (
																<span
																	className={`ml-1 font-medium ${item.expenseGrowth <= 0 ? "text-green-600" : "text-red-600"}`}
																>
																	({item.expenseGrowth >= 0 ? "+" : ""}
																	{item.expenseGrowth.toFixed(1)}
																	%)
																</span>
															)}
														</p>
													</div>
												</div>
											);
										}
										return null;
									}}
								/>
								<Bar
									yAxisId="growth"
									dataKey="revenueGrowth"
									radius={[4, 4, 0, 0]}
									maxBarSize={40}
								>
									{displayData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={
												(entry.revenueGrowth ?? 0) >= 0 ? "#16a34a" : "#dc2626"
											}
											fillOpacity={0.7}
										/>
									))}
								</Bar>
								<Line
									yAxisId="amount"
									type="monotone"
									dataKey="revenue"
									stroke="#3b82f6"
									strokeWidth={2}
									dot={{ fill: "#3b82f6", r: 3 }}
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
