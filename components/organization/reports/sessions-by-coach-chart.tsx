"use client";

import { PersonStandingIcon } from "lucide-react";
import type * as React from "react";
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
import { trpc } from "@/trpc/client";

type SessionsByCoachChartProps = {
	dateRange: { from: Date; to: Date };
};

export function SessionsByCoachChart({
	dateRange,
}: SessionsByCoachChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getSessionsByCoach.useQuery({
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
			name: item.coachName.split(" ").slice(0, 2).join(" "),
			fullName: item.coachName,
			completed: item.completed,
			cancelled: item.cancelled,
			total: item.total,
			completionRate: item.completionRate,
		})) ?? [];

	const totalSessions = chartData.reduce((acc, item) => acc + item.total, 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<PersonStandingIcon className="h-5 w-5 text-orange-600" />
					Sesiones por Entrenador
				</CardTitle>
				<CardDescription>
					Total: {totalSessions} sesiones asignadas a entrenadores
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[250px] items-center justify-center text-muted-foreground">
						No hay datos de entrenadores para este periodo
					</div>
				) : (
					<div className="h-[250px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} layout="vertical">
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis
									type="number"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									type="category"
									dataKey="name"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
									width={100}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0) {
											const data = payload[0]?.payload as {
												fullName: string;
												completed: number;
												cancelled: number;
												total: number;
												completionRate: number;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="text-sm font-medium mb-2">
														{data.fullName}
													</p>
													<div className="space-y-1">
														<p className="text-green-600 text-sm">
															Completadas: {data.completed}
														</p>
														<p className="text-red-600 text-sm">
															Canceladas: {data.cancelled}
														</p>
														<p className="text-sm">Total: {data.total}</p>
														<p className="text-sm font-medium border-t pt-1">
															Tasa de completitud:{" "}
															{data.completionRate.toFixed(1)}%
														</p>
													</div>
												</div>
											);
										}
										return null;
									}}
								/>
								<Legend />
								<Bar
									dataKey="completed"
									name="Completadas"
									fill="#16a34a"
									stackId="status"
									radius={[0, 0, 0, 0]}
								/>
								<Bar
									dataKey="cancelled"
									name="Canceladas"
									fill="#dc2626"
									stackId="status"
									radius={[0, 4, 4, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
