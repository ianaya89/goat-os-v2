"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { WalletIcon } from "lucide-react";
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

type CashFlowChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

export function CashFlowChart({
	dateRange,
	period,
}: CashFlowChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getCashFlowReport.useQuery({
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
			revenue: item.revenue,
			expenses: item.expenses,
			net: item.net,
			label: format(
				new Date(item.period),
				period === "year" ? "yyyy" : "MMM yy",
				{
					locale: es,
				},
			),
		})) ?? [];

	const totalNet = chartData.reduce((acc, item) => acc + item.net, 0);

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
					<WalletIcon className="h-5 w-5 text-primary" />
					Flujo de Caja
				</CardTitle>
				<CardDescription>
					Neto del periodo: {formatAmount(totalNet)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						No hay datos de flujo de caja para este periodo
					</div>
				) : (
					<div className="h-[300px] w-full">
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
									tickFormatter={(value) =>
										new Intl.NumberFormat("es-AR", {
											notation: "compact",
											compactDisplay: "short",
										}).format(value / 100)
									}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0) {
											const item = payload[0]?.payload as {
												label: string;
												revenue: number;
												expenses: number;
												net: number;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="mb-2 text-sm font-medium">
														{item.label}
													</p>
													<div className="space-y-1 text-sm">
														<p className="text-green-600">
															Ingresos: {formatAmount(item.revenue)}
														</p>
														<p className="text-red-600">
															Gastos: {formatAmount(item.expenses)}
														</p>
														<p
															className={
																item.net >= 0
																	? "font-medium text-green-600"
																	: "font-medium text-red-600"
															}
														>
															Neto: {formatAmount(item.net)}
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
										if (value === "revenue") return "Ingresos";
										if (value === "expenses") return "Gastos";
										return value;
									}}
								/>
								<Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
								<Bar dataKey="expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
