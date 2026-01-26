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
	Users,
	Wallet,
} from "lucide-react";
import type * as React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface EventProjectionTabProps {
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
	className,
}: {
	title: string;
	value: string;
	subtitle?: string;
	icon: React.ElementType;
	trend?: "up" | "down" | "neutral";
	trendLabel?: string;
	className?: string;
}) {
	return (
		<Card className={className}>
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

export function EventProjectionTab({
	eventId,
}: EventProjectionTabProps): React.JSX.Element {
	const { data, isPending } =
		trpc.organization.eventOrganization.getProjection.useQuery({ id: eventId });

	if (isPending) {
		return (
			<div className="space-y-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<Skeleton className="h-64" />
					<Skeleton className="h-64" />
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<Card>
				<CardContent className="py-10 text-center text-muted-foreground">
					No se pudieron cargar los datos de proyección
				</CardContent>
			</Card>
		);
	}

	const { registrations, revenue, expenses, profit, summary } = data;

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Ingresos Esperados"
					value={formatCurrency(revenue.expected)}
					subtitle={`${registrations.total} inscripciones`}
					icon={CircleDollarSign}
				/>
				<StatCard
					title="Ingresos Recaudados"
					value={formatCurrency(revenue.collected)}
					subtitle={`${revenue.collectionRate}% recaudado`}
					icon={Wallet}
					trend={
						revenue.collectionRate >= 80
							? "up"
							: revenue.collectionRate >= 50
								? "neutral"
								: "down"
					}
					trendLabel={
						revenue.collectionRate >= 80
							? "Buen progreso"
							: revenue.collectionRate >= 50
								? "En progreso"
								: "Pendiente"
					}
				/>
				<StatCard
					title="Gastos Planificados"
					value={formatCurrency(expenses.planned)}
					subtitle={`${expenses.executionRate}% ejecutado`}
					icon={Receipt}
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

			{/* Detailed Cards */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Revenue Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="size-5" />
							Ingresos
						</CardTitle>
						<CardDescription>
							Detalle de ingresos por inscripciones
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									Progreso de recaudación
								</span>
								<span className="font-medium">{revenue.collectionRate}%</span>
							</div>
							<Progress value={revenue.collectionRate} className="h-2" />
						</div>

						<div className="space-y-3 pt-2">
							<div className="flex items-center justify-between">
								<span className="text-sm">Ingresos esperados</span>
								<span className="font-medium">
									{formatCurrency(revenue.expected)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Recaudado</span>
								<span className="font-medium text-green-600">
									{formatCurrency(revenue.collected)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Pagos pendientes</span>
								<span className="font-medium text-yellow-600">
									{formatCurrency(revenue.pending)}
								</span>
							</div>
							{revenue.discounts > 0 && (
								<div className="flex items-center justify-between">
									<span className="text-sm">Descuentos aplicados</span>
									<span className="font-medium text-orange-600">
										-{formatCurrency(revenue.discounts)}
									</span>
								</div>
							)}
							{revenue.refunded > 0 && (
								<div className="flex items-center justify-between">
									<span className="text-sm">Reembolsos</span>
									<span className="font-medium text-red-600">
										-{formatCurrency(revenue.refunded)}
									</span>
								</div>
							)}
						</div>

						<div className="border-t pt-4 mt-4">
							<h4 className="text-sm font-medium mb-3 flex items-center gap-2">
								<Users className="size-4" />
								Inscripciones por estado
							</h4>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Confirmadas</span>
									<span className="font-medium text-green-600">
										{registrations.byStatus.confirmed}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Pendientes</span>
									<span className="font-medium text-yellow-600">
										{registrations.byStatus.pendingPayment}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Lista de espera</span>
									<span className="font-medium text-blue-600">
										{registrations.byStatus.waitlist}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Canceladas</span>
									<span className="font-medium text-red-600">
										{registrations.byStatus.cancelled}
									</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Expenses Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingDown className="size-5" />
							Gastos
						</CardTitle>
						<CardDescription>Detalle del presupuesto y gastos</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">
									Ejecución presupuestaria
								</span>
								<span className="font-medium">{expenses.executionRate}%</span>
							</div>
							<Progress
								value={expenses.executionRate}
								className={cn(
									"h-2",
									expenses.executionRate > 100 && "[&>div]:bg-red-500",
								)}
							/>
						</div>

						<div className="space-y-3 pt-2">
							<div className="flex items-center justify-between">
								<span className="text-sm">Presupuesto planificado</span>
								<span className="font-medium">
									{formatCurrency(expenses.planned)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Gastos reales</span>
								<span className="font-medium text-orange-600">
									{formatCurrency(expenses.actual)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Variación</span>
								<span
									className={cn(
										"font-medium",
										expenses.variance > 0 ? "text-green-600" : "text-red-600",
									)}
								>
									{expenses.variance > 0 ? "+" : ""}
									{formatCurrency(expenses.variance)}
								</span>
							</div>
						</div>

						{expenses.breakdown.length > 0 && (
							<div className="border-t pt-4 mt-4">
								<h4 className="text-sm font-medium mb-3">Desglose de gastos</h4>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-xs">Concepto</TableHead>
											<TableHead className="text-xs text-right">
												Planificado
											</TableHead>
											<TableHead className="text-xs text-right">Real</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{expenses.breakdown.slice(0, 5).map((item, index) => (
											<TableRow key={index}>
												<TableCell className="text-xs py-2">
													{item.name}
												</TableCell>
												<TableCell className="text-xs py-2 text-right">
													{formatCurrency(item.planned)}
												</TableCell>
												<TableCell className="text-xs py-2 text-right">
													{formatCurrency(item.actual)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
								{expenses.breakdown.length > 5 && (
									<p className="text-xs text-muted-foreground mt-2">
										Y {expenses.breakdown.length - 5} más...
									</p>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Profit Summary */}
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
