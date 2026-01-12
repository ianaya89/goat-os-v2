"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
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

type SessionsTrendChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

export function SessionsTrendChart({
	dateRange,
	period,
}: SessionsTrendChartProps): React.JSX.Element {
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
					<CalendarIcon className="h-5 w-5 text-blue-600" />
					Sesiones por Periodo
				</CardTitle>
				<CardDescription>
					Total: {totalSessions} sesiones ({chartData.length} periodos)
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[250px] items-center justify-center text-muted-foreground">
						No hay datos de sesiones para este periodo
					</div>
				) : (
					<div className="h-[250px] w-full">
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
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="text-sm font-medium mb-2">
														{data.label}
													</p>
													<div className="space-y-1">
														<p className="text-green-600 text-sm">
															Completadas: {data.completed}
														</p>
														<p className="text-red-600 text-sm">
															Canceladas: {data.cancelled}
														</p>
														<p className="text-yellow-600 text-sm">
															Pendientes: {data.pending}
														</p>
														<p className="text-sm font-medium border-t pt-1">
															Total: {data.total}
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
									radius={[0, 0, 0, 0]}
								/>
								<Bar
									dataKey="pending"
									name="Pendientes"
									fill="#ca8a04"
									stackId="status"
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
