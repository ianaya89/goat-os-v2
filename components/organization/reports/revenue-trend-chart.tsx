"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUpIcon } from "lucide-react";
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

type RevenueTrendChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

export function RevenueTrendChart({
	dateRange,
	period,
}: RevenueTrendChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getRevenueByPeriod.useQuery({
			dateRange,
			period,
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
			date: item.period,
			revenue: item.total,
			label: format(
				new Date(item.period),
				period === "year" ? "yyyy" : "MMM yy",
				{
					locale: es,
				},
			),
		})) ?? [];

	const totalRevenue = chartData.reduce((acc, item) => acc + item.revenue, 0);

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
					<TrendingUpIcon className="h-5 w-5 text-green-600" />
					Ingresos
				</CardTitle>
				<CardDescription>
					Total: {formatAmount(totalRevenue)} ({chartData.length} periodos)
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[250px] items-center justify-center text-muted-foreground">
						No hay datos de ingresos para este periodo
					</div>
				) : (
					<div className="h-[250px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData}>
								<defs>
									<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
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
									tickFormatter={(value) =>
										new Intl.NumberFormat("es-AR", {
											notation: "compact",
											compactDisplay: "short",
										}).format(value / 100)
									}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0 && payload[0]) {
											const item = payload[0];
											return (
												<div className="rounded-lg border bg-background p-2 shadow-sm">
													<p className="text-sm font-medium">
														{(item.payload as { label: string }).label}
													</p>
													<p className="text-green-600 text-sm">
														{formatAmount(item.value as number)}
													</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Area
									type="monotone"
									dataKey="revenue"
									stroke="#16a34a"
									strokeWidth={2}
									fillOpacity={1}
									fill="url(#colorRevenue)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
