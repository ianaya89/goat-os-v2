"use client";

import { MedalIcon } from "lucide-react";
import type * as React from "react";
import {
	Bar,
	BarChart,
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

type RevenueByAthleteChartProps = {
	dateRange: { from: Date; to: Date };
	limit?: number;
};

export function RevenueByAthleteChart({
	dateRange,
	limit = 10,
}: RevenueByAthleteChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getRevenueByAthlete.useQuery({
			dateRange,
			limit,
		});

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount / 100);
	};

	const chartData =
		data?.map((item) => ({
			name: item.athleteName.split(" ")[0] ?? item.athleteName,
			fullName: item.athleteName,
			total: item.total,
			count: item.count,
		})) ?? [];

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MedalIcon className="h-5 w-5 text-primary" />
					Top Atletas por Ingresos
				</CardTitle>
				<CardDescription>
					{chartData.length} atletas con mayor volumen de pagos
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						No hay datos de atletas para este periodo
					</div>
				) : (
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} layout="vertical">
								<XAxis
									type="number"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
									tickFormatter={(value) =>
										new Intl.NumberFormat("es-AR", {
											notation: "compact",
											compactDisplay: "short",
										}).format(value / 100)
									}
								/>
								<YAxis
									type="category"
									dataKey="name"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
									width={80}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0 && payload[0]) {
											const item = payload[0].payload as {
												fullName: string;
												total: number;
												count: number;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="mb-1 text-sm font-medium">
														{item.fullName}
													</p>
													<p className="text-green-600 text-sm">
														{formatAmount(item.total)}
													</p>
													<p className="text-muted-foreground text-xs">
														{item.count} pagos
													</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Bar
									dataKey="total"
									fill="hsl(var(--primary))"
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
