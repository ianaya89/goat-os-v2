"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUpIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
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

type AttendanceTrendChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

type ViewMode = "rate" | "breakdown";

export function AttendanceTrendChart({
	dateRange,
	period,
}: AttendanceTrendChartProps): React.JSX.Element {
	const [viewMode, setViewMode] = useState<ViewMode>("rate");

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
			present: item.present,
			late: item.late,
			absent: item.absent,
			attended: item.present + item.late,
		})) ?? [];

	const averageRate =
		chartData.length > 0
			? chartData.reduce((acc, item) => acc + item.rate, 0) / chartData.length
			: 0;

	const getRateColor = (rate: number) => {
		if (rate >= 80) return "text-success";
		if (rate >= 60) return "text-warning";
		return "text-destructive";
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[280px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const renderRateChart = () => (
		<AreaChart data={chartData}>
			<defs>
				<linearGradient id="colorAttendanceRate" x1="0" y1="0" x2="0" y2="1">
					<stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
					<stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
				</linearGradient>
			</defs>
			<CartesianGrid
				strokeDasharray="3 3"
				className="stroke-muted"
				vertical={false}
			/>
			<XAxis
				dataKey="label"
				tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
				tickLine={false}
				axisLine={false}
			/>
			<YAxis
				domain={[0, 100]}
				tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
				tickLine={false}
				axisLine={false}
				tickFormatter={(value) => `${value}%`}
				width={40}
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
							present: number;
							late: number;
							absent: number;
						};
						return (
							<div className="rounded-lg border bg-background/95 backdrop-blur-sm p-4 shadow-lg">
								<p className="text-sm font-semibold mb-3">{data.label}</p>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<span className="text-sm">Asistencia:</span>
										<span
											className={cn(
												"text-sm font-bold ml-auto",
												getRateColor(data.rate),
											)}
										>
											{data.rate.toFixed(1)}%
										</span>
									</div>
									<div className="border-t pt-2 space-y-1">
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 rounded-full bg-success" />
											<span className="text-xs text-muted-foreground">
												Presentes: {data.present}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 rounded-full bg-warning" />
											<span className="text-xs text-muted-foreground">
												Tardes: {data.late}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 rounded-full bg-destructive" />
											<span className="text-xs text-muted-foreground">
												Ausentes: {data.absent}
											</span>
										</div>
									</div>
									<div className="border-t pt-2">
										<span className="text-xs text-muted-foreground">
											{data.attended} de {data.total} asistencias
										</span>
									</div>
								</div>
							</div>
						);
					}
					return null;
				}}
			/>
			<Area
				type="monotone"
				dataKey="rate"
				stroke="hsl(var(--chart-2))"
				strokeWidth={3}
				fillOpacity={1}
				fill="url(#colorAttendanceRate)"
				dot={{
					r: 4,
					fill: "hsl(var(--chart-2))",
					strokeWidth: 2,
					stroke: "#fff",
				}}
				activeDot={{
					r: 6,
					fill: "hsl(var(--chart-2))",
					strokeWidth: 2,
					stroke: "#fff",
				}}
			/>
			{/* Reference line for average */}
			<Line
				type="monotone"
				dataKey={() => averageRate}
				stroke="hsl(var(--chart-2))"
				strokeWidth={1}
				strokeDasharray="5 5"
				dot={false}
				name="Promedio"
			/>
		</AreaChart>
	);

	const renderBreakdownChart = () => (
		<BarChart data={chartData}>
			<CartesianGrid
				strokeDasharray="3 3"
				className="stroke-muted"
				vertical={false}
			/>
			<XAxis
				dataKey="label"
				tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
				tickLine={false}
				axisLine={false}
			/>
			<YAxis
				tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
				tickLine={false}
				axisLine={false}
				width={35}
			/>
			<Tooltip
				content={({ active, payload }) => {
					if (active && payload && payload.length > 0) {
						const data = payload[0]?.payload as {
							label: string;
							rate: number;
							present: number;
							late: number;
							absent: number;
							total: number;
						};
						return (
							<div className="rounded-lg border bg-background/95 backdrop-blur-sm p-4 shadow-lg">
								<p className="text-sm font-semibold mb-3">{data.label}</p>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-success" />
										<span className="text-sm">Presentes:</span>
										<span className="text-sm font-medium ml-auto">
											{data.present}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-warning" />
										<span className="text-sm">Tardes:</span>
										<span className="text-sm font-medium ml-auto">
											{data.late}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-destructive" />
										<span className="text-sm">Ausentes:</span>
										<span className="text-sm font-medium ml-auto">
											{data.absent}
										</span>
									</div>
									<div className="border-t pt-2 mt-2">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">Asistencia</span>
											<span
												className={cn(
													"text-sm font-bold",
													getRateColor(data.rate),
												)}
											>
												{data.rate.toFixed(1)}%
											</span>
										</div>
									</div>
								</div>
							</div>
						);
					}
					return null;
				}}
			/>
			<Legend
				wrapperStyle={{ paddingTop: "20px" }}
				formatter={(value) => (
					<span className="text-xs text-muted-foreground">{value}</span>
				)}
			/>
			<Bar
				dataKey="present"
				name="Presentes"
				fill="hsl(var(--success))"
				stackId="attendance"
				radius={[0, 0, 0, 0]}
			/>
			<Bar
				dataKey="late"
				name="Tardes"
				fill="hsl(var(--warning))"
				stackId="attendance"
				radius={[0, 0, 0, 0]}
			/>
			<Bar
				dataKey="absent"
				name="Ausentes"
				fill="hsl(var(--destructive))"
				stackId="attendance"
				radius={[4, 4, 0, 0]}
			/>
		</BarChart>
	);

	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<CardTitle className="flex items-center gap-2 text-base">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10">
								<TrendingUpIcon className="h-4 w-4 text-chart-2" />
							</div>
							Tendencia de Asistencia
						</CardTitle>
						<CardDescription>
							Promedio:{" "}
							<span className={cn("font-medium", getRateColor(averageRate))}>
								{averageRate.toFixed(1)}%
							</span>{" "}
							({chartData.length} periodos)
						</CardDescription>
					</div>
					<div className="flex gap-1">
						<Button
							variant={viewMode === "rate" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("rate")}
							className="h-8 px-3 text-xs"
						>
							Porcentaje
						</Button>
						<Button
							variant={viewMode === "breakdown" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("breakdown")}
							className="h-8 px-3 text-xs"
						>
							Desglose
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[280px] items-center justify-center text-muted-foreground">
						No hay datos de asistencia para este periodo
					</div>
				) : (
					<div className="h-[280px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							{viewMode === "rate" ? renderRateChart() : renderBreakdownChart()}
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
