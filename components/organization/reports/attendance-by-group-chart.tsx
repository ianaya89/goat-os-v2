"use client";

import { UsersIcon } from "lucide-react";
import type * as React from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
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

type AttendanceByGroupChartProps = {
	dateRange: { from: Date; to: Date };
};

export function AttendanceByGroupChart({
	dateRange,
}: AttendanceByGroupChartProps): React.JSX.Element {
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
					<Skeleton className="h-[250px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const chartData =
		data?.map((item) => ({
			name:
				item.groupName.length > 15
					? `${item.groupName.slice(0, 15)}...`
					: item.groupName,
			fullName: item.groupName,
			rate: item.rate,
			present: item.present,
			late: item.late,
			absent: item.absent,
			total: item.total,
		})) ?? [];

	const getBarColor = (rate: number) => {
		if (rate >= 80) return "#16a34a";
		if (rate >= 60) return "#ca8a04";
		return "#dc2626";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<UsersIcon className="h-5 w-5 text-purple-600" />
					Asistencia por Grupo
				</CardTitle>
				<CardDescription>
					Porcentaje de asistencia por grupo de entrenamiento
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[250px] items-center justify-center text-muted-foreground">
						No hay datos de grupos para este periodo
					</div>
				) : (
					<div className="h-[250px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis
									dataKey="name"
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
									interval={0}
									angle={-45}
									textAnchor="end"
									height={60}
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
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="text-sm font-medium mb-2">
														{data.fullName}
													</p>
													<div className="space-y-1">
														<p className="text-sm">
															Asistencia:{" "}
															<span className="font-medium">
																{data.rate.toFixed(1)}%
															</span>
														</p>
														<p className="text-green-600 text-sm">
															Presentes: {data.present}
														</p>
														<p className="text-yellow-600 text-sm">
															Tardes: {data.late}
														</p>
														<p className="text-red-600 text-sm">
															Ausentes: {data.absent}
														</p>
														<p className="text-sm text-muted-foreground">
															Total: {data.total} registros
														</p>
													</div>
												</div>
											);
										}
										return null;
									}}
								/>
								<Bar dataKey="rate" radius={[4, 4, 0, 0]}>
									{chartData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={getBarColor(entry.rate)}
										/>
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
