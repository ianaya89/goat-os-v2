"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUpIcon } from "lucide-react";
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

type AttendanceTrendChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

export function AttendanceTrendChart({
	dateRange,
	period,
}: AttendanceTrendChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getAttendanceTrend.useQuery({
			dateRange,
			period,
		});

	const chartData =
		data?.map((item) => ({
			date: item.period,
			label: format(
				new Date(item.period),
				period === "year" ? "yyyy" : "MMM yy",
				{
					locale: es,
				},
			),
			rate: item.rate,
			total: item.total,
			attended: item.present + item.late,
		})) ?? [];

	const averageRate =
		chartData.length > 0
			? chartData.reduce((acc, item) => acc + item.rate, 0) / chartData.length
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
					<TrendingUpIcon className="h-5 w-5 text-blue-600" />
					Tendencia de Asistencia
				</CardTitle>
				<CardDescription>
					Promedio: {averageRate.toFixed(1)}% ({chartData.length} periodos)
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[250px] items-center justify-center text-muted-foreground">
						No hay datos de asistencia para este periodo
					</div>
				) : (
					<div className="h-[250px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData}>
								<defs>
									<linearGradient
										id="colorAttendance"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis
									dataKey="label"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									domain={[0, 100]}
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
									tickFormatter={(value) => `${value}%`}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0 && payload[0]) {
											const item = payload[0];
											const data = item.payload as {
												label: string;
												rate: number;
												total: number;
												attended: number;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="text-sm font-medium">{data.label}</p>
													<p className="text-blue-600 text-sm">
														Asistencia: {data.rate.toFixed(1)}%
													</p>
													<p className="text-sm text-muted-foreground">
														{data.attended} de {data.total} asistencias
													</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Area
									type="monotone"
									dataKey="rate"
									stroke="#2563eb"
									strokeWidth={2}
									fillOpacity={1}
									fill="url(#colorAttendance)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
