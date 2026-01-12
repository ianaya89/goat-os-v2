"use client";

import { UserIcon } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/trpc/client";

type AttendanceByAthleteChartProps = {
	dateRange: { from: Date; to: Date };
};

export function AttendanceByAthleteChart({
	dateRange,
}: AttendanceByAthleteChartProps): React.JSX.Element {
	const { data: bestData, isLoading: isLoadingBest } =
		trpc.organization.reports.getAttendanceByAthlete.useQuery({
			dateRange,
			sortBy: "best",
			limit: 10,
		});

	const { data: worstData, isLoading: isLoadingWorst } =
		trpc.organization.reports.getAttendanceByAthlete.useQuery({
			dateRange,
			sortBy: "worst",
			limit: 10,
		});

	const isLoading = isLoadingBest || isLoadingWorst;

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-4 w-56" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const formatChartData = (data: typeof bestData) =>
		data?.map((item) => ({
			name: item.athleteName.split(" ").slice(0, 2).join(" "),
			fullName: item.athleteName,
			rate: item.rate,
			present: item.present,
			late: item.late,
			absent: item.absent,
			total: item.total,
		})) ?? [];

	const bestChartData = formatChartData(bestData);
	const worstChartData = formatChartData(worstData);

	const getBarColor = (rate: number) => {
		if (rate >= 80) return "#16a34a";
		if (rate >= 60) return "#ca8a04";
		return "#dc2626";
	};

	const renderChart = (
		chartData: ReturnType<typeof formatChartData>,
		sortBy: "best" | "worst",
	) => {
		if (chartData.length === 0) {
			return (
				<div className="flex h-[300px] items-center justify-center text-muted-foreground">
					No hay datos de asistencia para este periodo
				</div>
			);
		}

		return (
			<div className="h-[300px] w-full">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={chartData} layout="vertical">
						<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
						<XAxis
							type="number"
							domain={[0, 100]}
							tick={{ fontSize: 12 }}
							tickLine={false}
							axisLine={false}
							tickFormatter={(value) => `${value}%`}
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
													Total: {data.total} sesiones
												</p>
											</div>
										</div>
									);
								}
								return null;
							}}
						/>
						<Bar dataKey="rate" radius={[0, 4, 4, 0]}>
							{chartData.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={getBarColor(entry.rate)} />
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>
		);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<UserIcon className="h-5 w-5 text-blue-600" />
					Asistencia por Atleta
				</CardTitle>
				<CardDescription>
					Top 10 atletas con mejor y peor asistencia
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="best">
					<TabsList className="mb-4">
						<TabsTrigger value="best">Mejor Asistencia</TabsTrigger>
						<TabsTrigger value="worst">Peor Asistencia</TabsTrigger>
					</TabsList>
					<TabsContent value="best">
						{renderChart(bestChartData, "best")}
					</TabsContent>
					<TabsContent value="worst">
						{renderChart(worstChartData, "worst")}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
