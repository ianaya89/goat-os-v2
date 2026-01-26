"use client";

import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowDownIcon, ArrowUpIcon, WalletIcon } from "lucide-react";
import type * as React from "react";
import {
	Area,
	AreaChart,
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

export function IncomeExpensesChart(): React.JSX.Element {
	const sixMonthsAgo = subMonths(new Date(), 6);

	const { data, isLoading, error } =
		trpc.organization.reports.getCashFlowReport.useQuery({
			period: "month",
			dateRange: {
				from: sixMonthsAgo,
				to: new Date(),
			},
		});

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
			notation: "compact",
		}).format(amount / 100);
	};

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<WalletIcon className="size-5 text-emerald-500" />
						Ingresos vs Gastos
					</CardTitle>
					<CardDescription>Ultimos 6 meses</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center py-8 text-center">
						<WalletIcon className="size-10 text-destructive/50 mb-2" />
						<p className="text-destructive text-sm">
							Error al cargar datos financieros
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[200px] w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<WalletIcon className="size-5 text-emerald-500" />
						Ingresos vs Gastos
					</CardTitle>
					<CardDescription>Ultimos 6 meses</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center py-8 text-center">
						<WalletIcon className="size-10 text-muted-foreground/50 mb-2" />
						<p className="text-muted-foreground text-sm">
							No hay datos financieros
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const chartData = data.map((d) => ({
		month: format(new Date(d.period), "MMM", { locale: es }),
		ingresos: d.revenue / 100,
		gastos: d.expenses / 100,
		neto: d.net / 100,
	}));

	// Calculate totals
	const totalRevenue = data.reduce((acc, d) => acc + d.revenue, 0);
	const totalExpenses = data.reduce((acc, d) => acc + d.expenses, 0);
	const totalNet = totalRevenue - totalExpenses;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<WalletIcon className="size-5 text-emerald-500" />
							Ingresos vs Gastos
						</CardTitle>
						<CardDescription>Comparativa mensual</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Summary Stats */}
				<div className="grid grid-cols-3 gap-2">
					<div className="rounded-lg bg-green-50 p-2 text-center dark:bg-green-950">
						<div className="flex items-center justify-center gap-1">
							<ArrowUpIcon className="size-3 text-green-600" />
							<span className="text-xs text-muted-foreground">Ingresos</span>
						</div>
						<p className="font-bold text-green-600 text-sm">
							{formatAmount(totalRevenue)}
						</p>
					</div>
					<div className="rounded-lg bg-red-50 p-2 text-center dark:bg-red-950">
						<div className="flex items-center justify-center gap-1">
							<ArrowDownIcon className="size-3 text-red-600" />
							<span className="text-xs text-muted-foreground">Gastos</span>
						</div>
						<p className="font-bold text-red-600 text-sm">
							{formatAmount(totalExpenses)}
						</p>
					</div>
					<div className="rounded-lg bg-blue-50 p-2 text-center dark:bg-blue-950">
						<span className="text-xs text-muted-foreground">Neto</span>
						<p
							className={`font-bold text-sm ${totalNet >= 0 ? "text-blue-600" : "text-red-600"}`}
						>
							{formatAmount(totalNet)}
						</p>
					</div>
				</div>

				{/* Chart */}
				<ResponsiveContainer width="100%" height={180}>
					<AreaChart data={chartData}>
						<defs>
							<linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
								<stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
							</linearGradient>
							<linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
								<stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
							</linearGradient>
						</defs>
						<XAxis
							dataKey="month"
							fontSize={12}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							fontSize={12}
							tickLine={false}
							axisLine={false}
							tickFormatter={(value) =>
								new Intl.NumberFormat("es-AR", { notation: "compact" }).format(
									value,
								)
							}
						/>
						<Tooltip
							content={({ active, payload }) => {
								if (active && payload && payload.length) {
									const data = payload[0]?.payload;
									return (
										<div className="rounded-lg border bg-background p-2 shadow-sm">
											<p className="font-medium text-sm capitalize">
												{data.month}
											</p>
											<p className="text-xs text-green-600">
												Ingresos: {formatAmount(data.ingresos * 100)}
											</p>
											<p className="text-xs text-red-600">
												Gastos: {formatAmount(data.gastos * 100)}
											</p>
											<p className="text-xs text-blue-600 font-medium">
												Neto: {formatAmount(data.neto * 100)}
											</p>
										</div>
									);
								}
								return null;
							}}
						/>
						<Area
							type="monotone"
							dataKey="ingresos"
							stroke="#22c55e"
							fill="url(#colorIngresos)"
							strokeWidth={2}
						/>
						<Area
							type="monotone"
							dataKey="gastos"
							stroke="#ef4444"
							fill="url(#colorGastos)"
							strokeWidth={2}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
