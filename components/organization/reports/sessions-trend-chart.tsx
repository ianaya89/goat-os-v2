"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
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
import { trpc } from "@/trpc/client";

type SessionsTrendChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

type ViewMode = "stacked" | "area";

// Using CSS variables from the design system
const _COLORS = {
	completed: "var(--success)", // Green
	cancelled: "var(--destructive)", // Red
	pending: "var(--warning)", // Amber
};

export function SessionsTrendChart({
	dateRange,
	period,
}: SessionsTrendChartProps): React.JSX.Element {
	const [viewMode, setViewMode] = useState<ViewMode>("area");

	const { data, isLoading } =
		trpc.organization.reports.getSessionsByPeriod.useQuery({
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
			completed: item.completed,
			cancelled: item.cancelled,
			pending: item.pending,
			total: item.total,
		})) ?? [];

	const totalSessions = chartData.reduce((acc, item) => acc + item.total, 0);
	const totalCompleted = chartData.reduce(
		(acc, item) => acc + item.completed,
		0,
	);

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

	const renderAreaChart = () => (
		<AreaChart data={chartData}>
			<defs>
				<linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
					<stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
					<stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
				</linearGradient>
				<linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
					<stop
						offset="5%"
						stopColor="hsl(var(--destructive))"
						stopOpacity={0.4}
					/>
					<stop
						offset="95%"
						stopColor="hsl(var(--destructive))"
						stopOpacity={0}
					/>
				</linearGradient>
				<linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
					<stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
					<stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
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
							completed: number;
							cancelled: number;
							pending: number;
							total: number;
						};
						return (
							<div className="rounded-lg border bg-background/95 backdrop-blur-sm p-4 shadow-lg">
								<p className="text-sm font-semibold mb-3">{data.label}</p>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-success" />
										<span className="text-sm">Completadas:</span>
										<span className="text-sm font-medium ml-auto">
											{data.completed}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-destructive" />
										<span className="text-sm">Canceladas:</span>
										<span className="text-sm font-medium ml-auto">
											{data.cancelled}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-warning" />
										<span className="text-sm">Pendientes:</span>
										<span className="text-sm font-medium ml-auto">
											{data.pending}
										</span>
									</div>
									<div className="border-t pt-2 mt-2">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">Total</span>
											<span className="text-sm font-bold">{data.total}</span>
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
			<Area
				type="monotone"
				dataKey="completed"
				name="Completadas"
				stroke="hsl(var(--success))"
				strokeWidth={2}
				fillOpacity={1}
				fill="url(#colorCompleted)"
				dot={{ r: 3, fill: "hsl(var(--success))", strokeWidth: 0 }}
				activeDot={{
					r: 5,
					fill: "hsl(var(--success))",
					strokeWidth: 2,
					stroke: "#fff",
				}}
			/>
			<Area
				type="monotone"
				dataKey="cancelled"
				name="Canceladas"
				stroke="hsl(var(--destructive))"
				strokeWidth={2}
				fillOpacity={1}
				fill="url(#colorCancelled)"
				dot={{ r: 3, fill: "hsl(var(--destructive))", strokeWidth: 0 }}
				activeDot={{
					r: 5,
					fill: "hsl(var(--destructive))",
					strokeWidth: 2,
					stroke: "#fff",
				}}
			/>
			<Area
				type="monotone"
				dataKey="pending"
				name="Pendientes"
				stroke="hsl(var(--warning))"
				strokeWidth={2}
				fillOpacity={1}
				fill="url(#colorPending)"
				dot={{ r: 3, fill: "hsl(var(--warning))", strokeWidth: 0 }}
				activeDot={{
					r: 5,
					fill: "hsl(var(--warning))",
					strokeWidth: 2,
					stroke: "#fff",
				}}
			/>
		</AreaChart>
	);

	const renderStackedChart = () => (
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
							completed: number;
							cancelled: number;
							pending: number;
							total: number;
						};
						return (
							<div className="rounded-lg border bg-background/95 backdrop-blur-sm p-4 shadow-lg">
								<p className="text-sm font-semibold mb-3">{data.label}</p>
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-success" />
										<span className="text-sm">Completadas:</span>
										<span className="text-sm font-medium ml-auto">
											{data.completed}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-destructive" />
										<span className="text-sm">Canceladas:</span>
										<span className="text-sm font-medium ml-auto">
											{data.cancelled}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 rounded-full bg-warning" />
										<span className="text-sm">Pendientes:</span>
										<span className="text-sm font-medium ml-auto">
											{data.pending}
										</span>
									</div>
									<div className="border-t pt-2 mt-2">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">Total</span>
											<span className="text-sm font-bold">{data.total}</span>
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
				dataKey="completed"
				name="Completadas"
				fill="hsl(var(--success))"
				stackId="status"
				radius={[0, 0, 0, 0]}
			/>
			<Bar
				dataKey="cancelled"
				name="Canceladas"
				fill="hsl(var(--destructive))"
				stackId="status"
				radius={[0, 0, 0, 0]}
			/>
			<Bar
				dataKey="pending"
				name="Pendientes"
				fill="hsl(var(--warning))"
				stackId="status"
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
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
								<CalendarIcon className="h-4 w-4 text-primary" />
							</div>
							Sesiones por Periodo
						</CardTitle>
						<CardDescription>
							{totalSessions} sesiones -{" "}
							{totalSessions > 0
								? ((totalCompleted / totalSessions) * 100).toFixed(0)
								: 0}
							% completadas
						</CardDescription>
					</div>
					<div className="flex gap-1">
						<Button
							variant={viewMode === "area" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("area")}
							className="h-8 px-3 text-xs"
						>
							Lineas
						</Button>
						<Button
							variant={viewMode === "stacked" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("stacked")}
							className="h-8 px-3 text-xs"
						>
							Barras
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[280px] items-center justify-center text-muted-foreground">
						No hay datos de sesiones para este periodo
					</div>
				) : (
					<div className="h-[280px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							{viewMode === "area" ? renderAreaChart() : renderStackedChart()}
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
