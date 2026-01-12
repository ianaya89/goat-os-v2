"use client";

import { CreditCardIcon } from "lucide-react";
import type * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

type RevenueByPaymentMethodChartProps = {
	dateRange: { from: Date; to: Date };
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	cash: "Efectivo",
	card: "Tarjeta",
	transfer: "Transferencia",
	other: "Otro",
};

const COLORS = ["#16a34a", "#2563eb", "#9333ea", "#f59e0b", "#6b7280"];

export function RevenueByPaymentMethodChart({
	dateRange,
}: RevenueByPaymentMethodChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getRevenueByPaymentMethod.useQuery({
			dateRange,
		});

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-4 w-56" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[250px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount / 100);
	};

	const chartData =
		data?.map((item, index) => ({
			name: PAYMENT_METHOD_LABELS[item.paymentMethod] ?? item.paymentMethod,
			method: item.paymentMethod,
			value: item.total,
			count: item.count,
			color: COLORS[index % COLORS.length],
		})) ?? [];

	const totalRevenue = chartData.reduce((acc, item) => acc + item.value, 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CreditCardIcon className="h-5 w-5 text-purple-600" />
					Ingresos por Método de Pago
				</CardTitle>
				<CardDescription>Total: {formatAmount(totalRevenue)}</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[250px] items-center justify-center text-muted-foreground">
						No hay datos de pagos para este periodo
					</div>
				) : (
					<div className="flex h-[250px] items-center">
						<div className="h-full w-1/2">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={chartData}
										cx="50%"
										cy="50%"
										innerRadius={50}
										outerRadius={80}
										paddingAngle={2}
										dataKey="value"
									>
										{chartData.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={entry.color}
												stroke={entry.color}
											/>
										))}
									</Pie>
									<Tooltip
										content={({ active, payload }) => {
											if (active && payload && payload.length > 0) {
												const data = payload[0]?.payload as {
													name: string;
													value: number;
													count: number;
												};
												const percentage =
													totalRevenue > 0
														? ((data.value / totalRevenue) * 100).toFixed(1)
														: 0;
												return (
													<div className="rounded-lg border bg-background p-3 shadow-sm">
														<p className="text-sm font-medium">{data.name}</p>
														<p className="text-sm">
															{formatAmount(data.value)}
														</p>
														<p className="text-sm text-muted-foreground">
															{percentage}% - {data.count} pagos
														</p>
													</div>
												);
											}
											return null;
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>
						<div className="w-1/2 space-y-2">
							{chartData.map((item, index) => {
								const percentage =
									totalRevenue > 0
										? ((item.value / totalRevenue) * 100).toFixed(1)
										: 0;
								return (
									<div key={index} className="flex items-center gap-2">
										<div
											className="h-3 w-3 rounded-full"
											style={{ backgroundColor: item.color }}
										/>
										<div className="flex-1">
											<div className="flex justify-between text-sm">
												<span>{item.name}</span>
												<span className="font-medium">{percentage}%</span>
											</div>
											<div className="text-xs text-muted-foreground">
												{formatAmount(item.value)} ({item.count} pagos)
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
