"use client";

import { RadarIcon } from "lucide-react";
import type * as React from "react";
import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
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

type GroupPerformanceRadarProps = {
	dateRange: { from: Date; to: Date };
};

export function GroupPerformanceRadar({
	dateRange,
}: GroupPerformanceRadarProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getAttendanceByGroup.useQuery({
			dateRange,
		});

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

	const chartData =
		data?.slice(0, 8).map((item) => ({
			group:
				item.groupName.length > 12
					? `${item.groupName.slice(0, 12)}...`
					: item.groupName,
			fullName: item.groupName,
			rate: Math.round(item.rate),
			present: item.present,
			late: item.late,
			absent: item.absent,
			total: item.total,
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

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10">
						<RadarIcon className="h-4 w-4 text-chart-2" />
					</div>
					Rendimiento por Grupo
				</CardTitle>
				<CardDescription>
					{chartData.length} grupos - Promedio:{" "}
					<span className={cn("font-medium", getRateColor(averageRate))}>
						{averageRate.toFixed(0)}%
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						No hay datos de grupos para este periodo
					</div>
				) : chartData.length < 3 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						Se necesitan al menos 3 grupos para el grafico radar
					</div>
				) : (
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<RadarChart data={chartData} cx="50%" cy="50%">
								<PolarGrid
									gridType="polygon"
									stroke="hsl(var(--muted))"
									strokeDasharray="3 3"
								/>
								<PolarAngleAxis
									dataKey="group"
									tick={{
										fontSize: 11,
										fill: "hsl(var(--muted-foreground))",
									}}
								/>
								<PolarRadiusAxis
									angle={90}
									domain={[0, 100]}
									tick={{
										fontSize: 10,
										fill: "hsl(var(--muted-foreground))",
									}}
									tickFormatter={(value) => `${value}%`}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0) {
											const data = payload[0]?.payload as {
												fullName: string;
												rate: number;
												present: number;
												late: number;
												absent: number;
												total: number;
											};
											return (
												<div className="rounded-xl border bg-background/95 backdrop-blur-sm p-4 shadow-lg">
													<p className="text-sm font-semibold mb-2">
														{data.fullName}
													</p>
													<div className="space-y-2">
														<div className="flex items-center justify-between gap-4">
															<span className="text-sm">Asistencia:</span>
															<span
																className={cn(
																	"text-sm font-bold",
																	getRateColor(data.rate),
																)}
															>
																{data.rate}%
															</span>
														</div>
														<div className="border-t pt-2 space-y-1">
															<div className="flex items-center gap-2 text-xs text-muted-foreground">
																<div className="w-2 h-2 rounded-full bg-success" />
																Presentes: {data.present}
															</div>
															<div className="flex items-center gap-2 text-xs text-muted-foreground">
																<div className="w-2 h-2 rounded-full bg-warning" />
																Tardes: {data.late}
															</div>
															<div className="flex items-center gap-2 text-xs text-muted-foreground">
																<div className="w-2 h-2 rounded-full bg-destructive" />
																Ausentes: {data.absent}
															</div>
														</div>
														<div className="border-t pt-2">
															<span className="text-xs text-muted-foreground">
																{data.present + data.late} de {data.total}{" "}
																registros
															</span>
														</div>
													</div>
												</div>
											);
										}
										return null;
									}}
								/>
								<Radar
									name="Asistencia"
									dataKey="rate"
									stroke="hsl(var(--chart-2))"
									fill="hsl(var(--chart-2))"
									fillOpacity={0.3}
									strokeWidth={2}
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
							</RadarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
