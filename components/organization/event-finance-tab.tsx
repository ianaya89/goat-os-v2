"use client";

import {
	ArrowDownRight,
	ArrowUpRight,
	Banknote,
	CircleDollarSign,
	Minus,
	Receipt,
	TrendingDown,
	TrendingUp,
	Wallet,
} from "lucide-react";
import type * as React from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
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
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface EventFinanceTabProps {
	eventId: string;
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: "ARS",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount / 100);
}

function StatCard({
	title,
	value,
	subtitle,
	icon: Icon,
	trend,
	trendLabel,
}: {
	title: string;
	value: string;
	subtitle?: string;
	icon: React.ElementType;
	trend?: "up" | "down" | "neutral";
	trendLabel?: string;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Icon className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				{subtitle && (
					<p className="text-xs text-muted-foreground">{subtitle}</p>
				)}
				{trend && trendLabel && (
					<div className="flex items-center gap-1 mt-1">
						{trend === "up" && (
							<ArrowUpRight className="size-3 text-green-600" />
						)}
						{trend === "down" && (
							<ArrowDownRight className="size-3 text-red-600" />
						)}
						{trend === "neutral" && (
							<Minus className="size-3 text-muted-foreground" />
						)}
						<span
							className={cn(
								"text-xs",
								trend === "up" && "text-green-600",
								trend === "down" && "text-red-600",
								trend === "neutral" && "text-muted-foreground",
							)}
						>
							{trendLabel}
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444", "#f97316"];

function CustomTooltip({
	active,
	payload,
}: {
	active?: boolean;
	payload?: Array<{ name: string; value: number; payload?: { fill?: string } }>;
}) {
	if (active && payload && payload.length > 0 && payload[0]) {
		const item = payload[0];
		return (
			<div className="rounded-lg border bg-background p-2 shadow-sm">
				<p className="text-sm font-medium">{item.name}</p>
				<p className="text-sm">{formatCurrency(item.value)}</p>
			</div>
		);
	}
	return null;
}

function BarTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: Array<{ name: string; value: number; color: string }>;
	label?: string;
}) {
	if (active && payload && payload.length > 0) {
		return (
			<div className="rounded-lg border bg-background p-2 shadow-sm">
				{label && <p className="text-sm font-medium mb-1">{label}</p>}
				{payload.map((entry) => (
					<p
						key={entry.name}
						className="text-sm"
						style={{ color: entry.color }}
					>
						{entry.name}: {formatCurrency(entry.value)}
					</p>
				))}
			</div>
		);
	}
	return null;
}

export function EventFinanceTab({
	eventId,
}: EventFinanceTabProps): React.JSX.Element {
	const { data, isPending } =
		trpc.organization.eventOrganization.getProjection.useQuery({
			id: eventId,
		});

	if (isPending) {
		return (
			<div className="space-y-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<Skeleton className="h-[300px]" />
					<Skeleton className="h-[300px]" />
				</div>
				<Skeleton className="h-[250px]" />
				<Skeleton className="h-64" />
			</div>
		);
	}

	if (!data) {
		return (
			<Card>
				<CardContent className="py-10 text-center text-muted-foreground">
					No se pudieron cargar los datos financieros
				</CardContent>
			</Card>
		);
	}

	const { revenue, expenses, profit, summary } = data;

	// Bar chart data: Actual vs Projected
	const comparisonData = [
		{
			name: "Ingresos",
			Recaudado: revenue.collected,
			Esperado: revenue.expected,
		},
		{
			name: "Gastos",
			Recaudado: expenses.actual,
			Esperado: expenses.planned,
		},
	];

	// Pie chart data: Revenue distribution
	const pieData = [
		{ name: "Recaudado", value: revenue.collected },
		{ name: "Pendiente", value: revenue.pending },
		...(revenue.refunded > 0
			? [{ name: "Reembolsado", value: revenue.refunded }]
			: []),
		...(revenue.discounts > 0
			? [{ name: "Descuentos", value: revenue.discounts }]
			: []),
	].filter((item) => item.value > 0);

	const hasPieData = pieData.length > 0;

	// Expense breakdown for horizontal bar chart
	const hasBreakdown = expenses.breakdown.length > 0;

	return (
		<div className="space-y-6">
			{/* Section 1: Summary Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Ingresos Recaudados"
					value={formatCurrency(revenue.collected)}
					subtitle={`${revenue.collectionRate}% de ${formatCurrency(revenue.expected)}`}
					icon={Wallet}
					trend={
						revenue.collectionRate >= 80
							? "up"
							: revenue.collectionRate >= 50
								? "neutral"
								: "down"
					}
					trendLabel={`${revenue.collectionRate}% recaudado`}
				/>
				<StatCard
					title="Gastos Reales"
					value={formatCurrency(expenses.actual)}
					subtitle={`${expenses.executionRate}% de ${formatCurrency(expenses.planned)}`}
					icon={Receipt}
					trend={
						expenses.executionRate <= 100
							? expenses.executionRate >= 50
								? "neutral"
								: "up"
							: "down"
					}
					trendLabel={`${expenses.executionRate}% ejecutado`}
				/>
				<StatCard
					title="Balance Actual"
					value={formatCurrency(summary.currentBalance)}
					icon={CircleDollarSign}
					trend={
						summary.currentBalance > 0
							? "up"
							: summary.currentBalance < 0
								? "down"
								: "neutral"
					}
					trendLabel={
						summary.currentBalance > 0
							? "Ganancia"
							: summary.currentBalance < 0
								? "Pérdida"
								: "Punto de equilibrio"
					}
				/>
				<StatCard
					title="Balance Proyectado"
					value={formatCurrency(summary.projectedBalance)}
					icon={Banknote}
					trend={
						summary.projectedBalance > 0
							? "up"
							: summary.projectedBalance < 0
								? "down"
								: "neutral"
					}
					trendLabel={
						summary.projectedBalance > 0
							? "Ganancia esperada"
							: summary.projectedBalance < 0
								? "Pérdida esperada"
								: "Punto de equilibrio"
					}
				/>
			</div>

			{/* Section 2: Charts */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Left: Revenue vs Expenses Bar Chart */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="size-5" />
							Ingresos vs Gastos
						</CardTitle>
						<CardDescription>
							Comparación entre valores reales y esperados
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[280px] w-full">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={comparisonData}>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-muted"
									/>
									<XAxis
										dataKey="name"
										tick={{ fontSize: 12 }}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										tick={{ fontSize: 12 }}
										tickLine={false}
										axisLine={false}
										tickFormatter={(value) => formatCurrency(value as number)}
									/>
									<Tooltip content={<BarTooltip />} />
									<Legend />
									<Bar
										dataKey="Recaudado"
										fill="#22c55e"
										radius={[4, 4, 0, 0]}
									/>
									<Bar
										dataKey="Esperado"
										fill="#94a3b8"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				{/* Right: Revenue Distribution Pie Chart */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CircleDollarSign className="size-5" />
							Distribución de Ingresos
						</CardTitle>
						<CardDescription>Estado de los pagos del evento</CardDescription>
					</CardHeader>
					<CardContent>
						{hasPieData ? (
							<div className="h-[280px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={pieData}
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={100}
											paddingAngle={3}
											dataKey="value"
											nameKey="name"
										>
											{pieData.map((_, index) => (
												<Cell
													key={pieData[index]?.name ?? index}
													fill={PIE_COLORS[index % PIE_COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip content={<CustomTooltip />} />
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</div>
						) : (
							<div className="flex h-[280px] items-center justify-center text-muted-foreground">
								No hay datos de ingresos
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Section 3: Expense Breakdown */}
			{hasBreakdown && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingDown className="size-5" />
							Desglose de Gastos
						</CardTitle>
						<CardDescription>
							Planificado vs real por línea de presupuesto
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div
							className="w-full"
							style={{
								height: Math.max(200, expenses.breakdown.length * 50 + 40),
							}}
						>
							<ResponsiveContainer width="100%" height="100%">
								<BarChart
									data={expenses.breakdown}
									layout="vertical"
									margin={{ left: 20 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-muted"
									/>
									<XAxis
										type="number"
										tick={{ fontSize: 12 }}
										tickLine={false}
										axisLine={false}
										tickFormatter={(value) => formatCurrency(value as number)}
									/>
									<YAxis
										type="category"
										dataKey="name"
										tick={{ fontSize: 12 }}
										tickLine={false}
										axisLine={false}
										width={120}
									/>
									<Tooltip content={<BarTooltip />} />
									<Legend />
									<Bar
										dataKey="planned"
										name="Planificado"
										fill="#94a3b8"
										radius={[0, 4, 4, 0]}
									/>
									<Bar
										dataKey="actual"
										name="Real"
										fill="#ef4444"
										radius={[0, 4, 4, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Section 4: Profitability Summary */}
			<Card>
				<CardHeader>
					<CardTitle>Resumen de Rentabilidad</CardTitle>
					<CardDescription>
						Comparación entre proyección y situación actual
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-6 md:grid-cols-2">
						{/* Projected */}
						<div className="space-y-4">
							<h4 className="font-medium text-sm text-muted-foreground">
								Proyectado (basado en inscripciones)
							</h4>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">
										Ingresos esperados
									</p>
									<p className="text-lg font-semibold">
										{formatCurrency(summary.totalExpectedIncome)}
									</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">
										Gastos planificados
									</p>
									<p className="text-lg font-semibold">
										{formatCurrency(summary.totalPlannedCosts)}
									</p>
								</div>
							</div>
							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
								<span className="font-medium">Balance proyectado</span>
								<span
									className={cn(
										"text-xl font-bold",
										profit.projected > 0 ? "text-green-600" : "text-red-600",
									)}
								>
									{formatCurrency(profit.projected)}
								</span>
							</div>
							{profit.projectedMargin !== 0 && (
								<p className="text-xs text-muted-foreground text-center">
									Margen proyectado: {profit.projectedMargin}%
								</p>
							)}
						</div>

						{/* Current */}
						<div className="space-y-4">
							<h4 className="font-medium text-sm text-muted-foreground">
								Actual (recaudado vs gastado)
							</h4>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">
										Ingresos recaudados
									</p>
									<p className="text-lg font-semibold">
										{formatCurrency(summary.totalActualIncome)}
									</p>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground">Gastos reales</p>
									<p className="text-lg font-semibold">
										{formatCurrency(summary.totalActualCosts)}
									</p>
								</div>
							</div>
							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
								<span className="font-medium">Balance actual</span>
								<span
									className={cn(
										"text-xl font-bold",
										profit.current > 0 ? "text-green-600" : "text-red-600",
									)}
								>
									{formatCurrency(profit.current)}
								</span>
							</div>
							{profit.currentMargin !== 0 && (
								<p className="text-xs text-muted-foreground text-center">
									Margen actual: {profit.currentMargin}%
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
