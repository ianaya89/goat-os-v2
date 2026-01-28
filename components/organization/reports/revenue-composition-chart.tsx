"use client";

import { es } from "date-fns/locale";
import { LayersIcon } from "lucide-react";
import * as React from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
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

type RevenueCompositionChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

export function RevenueCompositionChart({
	dateRange,
	period,
}: RevenueCompositionChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getRevenueComposition.useQuery({
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

		return allDates.map((date) => {
			const item = dataMap.get(getPeriodKey(date, period));
			return {
				training: item?.training ?? 0,
				events: item?.events ?? 0,
				label: getPeriodLabel(date, period, es),
			};
		});
	}, [data, dateRange, period]);

	const totalTraining = chartData.reduce((acc, item) => acc + item.training, 0);
	const totalEvents = chartData.reduce((acc, item) => acc + item.events, 0);
	const grandTotal = totalTraining + totalEvents;
	const trainingPct =
		grandTotal > 0 ? ((totalTraining / grandTotal) * 100).toFixed(0) : "0";
	const eventsPct =
		grandTotal > 0 ? ((totalEvents / grandTotal) * 100).toFixed(0) : "0";

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
					<LayersIcon className="h-5 w-5 text-primary" />
					Composicion de Ingresos
				</CardTitle>
				<CardDescription>
					Entrenamientos: {formatAmount(totalTraining)} ({trainingPct}%)
					&middot; Eventos: {formatAmount(totalEvents)} ({eventsPct}%)
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						No hay datos de ingresos para este periodo
					</div>
				) : (
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData}>
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
												training: number;
												events: number;
											};
											const total = item.training + item.events;
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="mb-2 text-sm font-medium">
														{item.label}
													</p>
													<div className="space-y-1 text-sm">
														<p className="text-blue-600">
															Entrenamientos: {formatAmount(item.training)}
														</p>
														<p className="text-amber-600">
															Eventos: {formatAmount(item.events)}
														</p>
														<p className="font-medium">
															Total: {formatAmount(total)}
														</p>
													</div>
												</div>
											);
										}
										return null;
									}}
								/>
								<Legend
									formatter={(value) => {
										if (value === "training") return "Entrenamientos";
										if (value === "events") return "Eventos";
										return value;
									}}
								/>
								<Bar
									dataKey="training"
									stackId="revenue"
									fill="#3b82f6"
									radius={[0, 0, 0, 0]}
								/>
								<Bar
									dataKey="events"
									stackId="revenue"
									fill="#f59e0b"
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
