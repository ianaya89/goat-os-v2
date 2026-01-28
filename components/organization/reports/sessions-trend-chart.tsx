"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
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
			total: item.total,
			completed: item.completed,
			cancelled: item.cancelled,
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
					<Skeleton className="h-[250px] w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CalendarIcon className="h-5 w-5 text-primary" />
					Sesiones por Periodo
				</CardTitle>
				<CardDescription>
					Total: {totalSessions} sesiones -{" "}
					{totalSessions > 0
						? ((totalCompleted / totalSessions) * 100).toFixed(0)
						: 0}
					% completadas
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
							<AreaChart data={chartData}>
								<defs>
									<linearGradient
										id="colorSessions"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="hsl(var(--primary))"
											stopOpacity={0.3}
										/>
										<stop
											offset="95%"
											stopColor="hsl(var(--primary))"
											stopOpacity={0}
										/>
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
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
									width={35}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0 && payload[0]) {
											const item = payload[0];
											const d = item.payload as {
												label: string;
												total: number;
												completed: number;
												cancelled: number;
											};
											return (
												<div className="rounded-lg border bg-background p-2 shadow-sm">
													<p className="text-sm font-medium">{d.label}</p>
													<p className="text-primary text-sm">
														{d.total} sesiones
													</p>
													<p className="text-xs text-muted-foreground">
														{d.completed} completadas, {d.cancelled} canceladas
													</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Area
									type="monotone"
									dataKey="total"
									stroke="hsl(var(--primary))"
									strokeWidth={2}
									fillOpacity={1}
									fill="url(#colorSessions)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
