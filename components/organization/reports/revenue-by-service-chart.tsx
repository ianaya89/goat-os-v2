"use client";

import { TicketIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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

type RevenueByServiceChartProps = {
	dateRange: { from: Date; to: Date };
	limit?: number;
};

const COLORS = [
	"#3b82f6",
	"#22c55e",
	"#f97316",
	"#8b5cf6",
	"#ef4444",
	"#eab308",
	"#ec4899",
	"#14b8a6",
	"#6366f1",
	"#f43f5e",
];

export function RevenueByServiceChart({
	dateRange,
	limit = 10,
}: RevenueByServiceChartProps): React.JSX.Element {
	const t = useTranslations("finance.services.reports");

	const { data, isLoading } =
		trpc.organization.reports.getRevenueByService.useQuery({
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
			id: item.serviceId,
			name:
				item.serviceName.length > 20
					? `${item.serviceName.slice(0, 20)}...`
					: item.serviceName,
			fullName: item.serviceName,
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
					<TicketIcon className="h-5 w-5 text-blue-600" />
					{t("revenueByService")}
				</CardTitle>
				<CardDescription>
					{t("totalFromServices", {
						amount: formatAmount(totalRevenue),
						count: chartData.length,
					})}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						{t("noData")}
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
									width={120}
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
													<p className="text-green-600 font-medium">
														{formatAmount(item.total)}
													</p>
													<p className="text-muted-foreground text-xs">
														{t("payments", { count: item.count })}
													</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Bar dataKey="total" radius={[0, 4, 4, 0]}>
									{chartData.map((_, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
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
