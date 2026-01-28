"use client";

import { es } from "date-fns/locale";
import { PercentIcon } from "lucide-react";
import * as React from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
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

type ProfitMarginTrendChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

export function ProfitMarginTrendChart({
	dateRange,
	period,
}: ProfitMarginTrendChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getCashFlowReport.useQuery({
			dateRange,
			period,
		});

	const chartData = React.useMemo(() => {
		const allDates = generatePeriodDates(dateRange, period);
		const dataMap = new Map(
			(data ?? []).map((item) => [
				getPeriodKey(new Date(item.period), period),
				item,
			]),
		);

		return allDates.map((date) => {
			const item = dataMap.get(getPeriodKey(date, period));
			const revenue = item?.revenue ?? 0;
			const expenses = item?.expenses ?? 0;
			const margin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;
			return {
				margin: Math.round(margin * 10) / 10,
				label: getPeriodLabel(date, period, es),
			};
		});
	}, [data, dateRange, period]);

	const avgMargin =
		chartData.length > 0
			? chartData.reduce((acc, item) => acc + item.margin, 0) /
					chartData.filter((item) => item.margin !== 0).length || 0
			: 0;

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[250px] w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<PercentIcon className="h-5 w-5 text-blue-600" />
					Margen de Ganancia
				</CardTitle>
				<CardDescription>
					Promedio: {avgMargin.toFixed(1)}% ({chartData.length} periodos)
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[250px] items-center justify-center text-muted-foreground">
						No hay datos para este periodo
					</div>
				) : (
					<div className="h-[250px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis
									dataKey="label"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
									tickFormatter={(value) => `${value}%`}
									domain={["auto", "auto"]}
								/>
								<ReferenceLine
									y={0}
									stroke="#dc2626"
									strokeDasharray="3 3"
									strokeOpacity={0.5}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0 && payload[0]) {
											const item = payload[0];
											const margin = item.value as number;
											return (
												<div className="rounded-lg border bg-background p-2 shadow-sm">
													<p className="text-sm font-medium">
														{(item.payload as { label: string }).label}
													</p>
													<p
														className={`text-sm font-medium ${margin >= 0 ? "text-green-600" : "text-red-600"}`}
													>
														{margin.toFixed(1)}%
													</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Line
									type="monotone"
									dataKey="margin"
									stroke="#3b82f6"
									strokeWidth={2}
									dot={{ fill: "#3b82f6", r: 3 }}
									activeDot={{ r: 5 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
