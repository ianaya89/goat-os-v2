"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircleIcon } from "lucide-react";
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

type SessionsCompletionChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

export function SessionsCompletionChart({
	dateRange,
	period,
}: SessionsCompletionChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getSessionsByPeriod.useQuery({
			dateRange,
			period,
		});

	const chartData =
		data?.map((item) => ({
			label: format(
				new Date(item.period),
				period === "year" ? "yyyy" : "MMM yy",
				{ locale: es },
			),
			completed: item.completed,
			cancelled: item.cancelled,
			total: item.total,
		})) ?? [];

	const totalCompleted = chartData.reduce(
		(acc, item) => acc + item.completed,
		0,
	);
	const totalCancelled = chartData.reduce(
		(acc, item) => acc + item.cancelled,
		0,
	);
	const totalAll = chartData.reduce((acc, item) => acc + item.total, 0);
	const completionRate = totalAll > 0 ? (totalCompleted / totalAll) * 100 : 0;

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
					<CheckCircleIcon className="h-5 w-5" />
					Completadas vs Canceladas
				</CardTitle>
				<CardDescription>
					{totalCompleted} completadas, {totalCancelled} canceladas -{" "}
					{completionRate.toFixed(0)}% completitud
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
										if (active && payload && payload.length > 0 && payload[0]) {
											const d = payload[0].payload as {
												label: string;
												completed: number;
												cancelled: number;
												total: number;
											};
											const rate =
												d.total > 0
													? ((d.completed / d.total) * 100).toFixed(0)
													: "0";
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="mb-2 text-sm font-medium">{d.label}</p>
													<div className="space-y-1 text-sm">
														<p className="text-green-600">
															Completadas: {d.completed}
														</p>
														<p className="text-red-600">
															Canceladas: {d.cancelled}
														</p>
														<p className="text-muted-foreground text-xs">
															{rate}% completitud
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
										if (value === "completed") return "Completadas";
										if (value === "cancelled") return "Canceladas";
										return value;
									}}
								/>
								<Bar dataKey="completed" fill="#16a34a" radius={[4, 4, 0, 0]} />
								<Bar dataKey="cancelled" fill="#dc2626" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
