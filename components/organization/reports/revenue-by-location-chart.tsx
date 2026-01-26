"use client";

import { MapPinIcon } from "lucide-react";
import type * as React from "react";
import {
	Bar,
	BarChart,
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

type RevenueByLocationChartProps = {
	dateRange: { from: Date; to: Date };
	limit?: number;
};

export function RevenueByLocationChart({
	dateRange,
	limit = 10,
}: RevenueByLocationChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getRevenueByLocation.useQuery({
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
			id: item.locationId,
			name:
				item.locationName.length > 18
					? `${item.locationName.slice(0, 18)}...`
					: item.locationName,
			fullName: item.locationName,
			address: item.locationAddress,
			total: item.total,
			count: item.count,
		})) ?? [];

	const totalRevenue = chartData.reduce((acc, item) => acc + item.total, 0);

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

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MapPinIcon className="h-5 w-5 text-purple-600" />
					Ingresos por Locación
				</CardTitle>
				<CardDescription>
					Total: {formatAmount(totalRevenue)} de {chartData.length} locaciones
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						No hay datos de locaciones para este periodo
					</div>
				) : (
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} layout="vertical">
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
									width={110}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0 && payload[0]) {
											const item = payload[0].payload as {
												fullName: string;
												address: string | null;
												total: number;
												count: number;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="mb-1 text-sm font-medium">
														{item.fullName}
													</p>
													{item.address && (
														<p className="text-xs text-muted-foreground mb-2">
															{item.address}
														</p>
													)}
													<p className="text-green-600 font-medium">
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
								<Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
