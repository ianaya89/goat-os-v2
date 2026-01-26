"use client";

import { PieChartIcon } from "lucide-react";
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

type AttendanceDistributionChartProps = {
	dateRange: { from: Date; to: Date };
};

// Using CSS variable values for recharts (which needs actual hex values)
const COLORS = {
	present: "hsl(var(--success))",
	late: "hsl(var(--warning))",
	absent: "hsl(var(--destructive))",
	excused: "hsl(var(--chart-5))",
};

export function AttendanceDistributionChart({
	dateRange,
}: AttendanceDistributionChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getTrainingSummary.useQuery({
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
					<Skeleton className="h-[280px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const attendance = data?.attendance ?? {
		total: 0,
		present: 0,
		late: 0,
		absent: 0,
		excused: 0,
		rate: 0,
	};

	const chartData = [
		{
			name: "Presentes",
			value: attendance.present,
			color: COLORS.present,
			bgClass: "bg-success",
		},
		{
			name: "Tardes",
			value: attendance.late,
			color: COLORS.late,
			bgClass: "bg-warning",
		},
		{
			name: "Ausentes",
			value: attendance.absent,
			color: COLORS.absent,
			bgClass: "bg-destructive",
		},
		{
			name: "Excusados",
			value: attendance.excused,
			color: COLORS.excused,
			bgClass: "bg-chart-5",
		},
	].filter((item) => item.value > 0);

	const totalAttendance = attendance.total;
	const attendedCount = attendance.present + attendance.late;
	const attendanceRate =
		totalAttendance > 0 ? (attendedCount / totalAttendance) * 100 : 0;

	const getRateColor = (rate: number) => {
		if (rate >= 80) return "text-success";
		if (rate >= 60) return "text-warning";
		return "text-destructive";
	};

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-5/10">
						<PieChartIcon className="h-4 w-4 text-chart-5" />
					</div>
					Distribucion de Asistencia
				</CardTitle>
				<CardDescription>
					{totalAttendance} registros totales en el periodo
				</CardDescription>
			</CardHeader>
			<CardContent>
				{totalAttendance === 0 ? (
					<div className="flex h-[280px] items-center justify-center text-muted-foreground">
						No hay datos de asistencia para este periodo
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
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip
										content={({ active, payload }) => {
											if (active && payload && payload.length > 0) {
												const data = payload[0]?.payload as {
													name: string;
													value: number;
													bgClass: string;
												};
												const percentage =
													totalAttendance > 0
														? ((data.value / totalAttendance) * 100).toFixed(1)
														: 0;
												return (
													<div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
														<div className="flex items-center gap-2">
															<div
																className={cn(
																	"w-3 h-3 rounded-full",
																	data.bgClass,
																)}
															/>
															<span className="text-sm font-medium">
																{data.name}
															</span>
														</div>
														<div className="mt-1 text-sm text-muted-foreground">
															{data.value} ({percentage}%)
														</div>
													</div>
												);
											}
											return null;
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
							{/* Center text */}
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<span
									className={cn(
										"text-3xl font-bold",
										getRateColor(attendanceRate),
									)}
								>
									{attendanceRate.toFixed(0)}%
								</span>
								<span className="text-xs text-muted-foreground">
									asistencia
								</span>
							</div>
						</div>

						{/* Legend */}
						<div className="flex-1 space-y-3">
							{chartData.map((item) => {
								const percentage =
									totalAttendance > 0
										? ((item.value / totalAttendance) * 100).toFixed(1)
										: 0;
								return (
									<div key={item.name} className="flex items-center gap-3">
										<div
											className={cn(
												"w-3 h-3 rounded-full flex-shrink-0",
												item.bgClass,
											)}
										/>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<span className="text-sm truncate">{item.name}</span>
												<span className="text-sm font-medium tabular-nums">
													{item.value}
												</span>
											</div>
											<div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
												<div
													className={cn(
														"h-full rounded-full transition-all duration-500",
														item.bgClass,
													)}
													style={{
														width: `${percentage}%`,
													}}
												/>
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
