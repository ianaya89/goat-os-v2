"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	ArrowUpIcon,
	BanknoteIcon,
	CalendarIcon,
	CheckCircleIcon,
	TrendingUpIcon,
	UsersIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
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

export function WeeklySummaryCard(): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.dashboard.getWeeklyActivity.useQuery();

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(amount / 100);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-48 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Resumen Semanal</CardTitle>
					<CardDescription>No hay datos disponibles</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	// Format daily breakdown for chart
	const chartData = data.dailyBreakdown.map((day) => ({
		date: day.date,
		sessions: day.sessions,
		label: format(new Date(day.date), "EEE", { locale: es }),
	}));

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<TrendingUpIcon className="size-5 text-primary" />
							Resumen Semanal
						</CardTitle>
						<CardDescription>
							{format(data.period.from, "d MMM", { locale: es })} -{" "}
							{format(data.period.to, "d MMM yyyy", { locale: es })}
						</CardDescription>
					</div>
					<Button variant="outline" size="sm" asChild>
						<Link href="/dashboard/organization/reports">Ver reportes</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Summary Stats */}
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<CalendarIcon className="size-4" />
							Sesiones
						</div>
						<p className="text-2xl font-bold">{data.sessions.total}</p>
						<div className="flex items-center gap-2 text-xs">
							<span className="flex items-center gap-1 text-green-600">
								<CheckCircleIcon className="size-3" />
								{data.sessions.completed}
							</span>
							<span className="text-muted-foreground">completadas</span>
						</div>
					</div>

					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<UsersIcon className="size-4" />
							Asistencia
						</div>
						<p className="text-2xl font-bold">{data.attendance.rate}%</p>
						<div className="flex items-center gap-2 text-xs">
							<span className="text-muted-foreground">
								{data.attendance.present + data.attendance.late} de{" "}
								{data.attendance.total}
							</span>
						</div>
					</div>

					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<BanknoteIcon className="size-4" />
							Ingresos
						</div>
						<p className="text-xl font-bold text-green-600">
							{formatAmount(data.income.total)}
						</p>
						<div className="flex items-center gap-2 text-xs">
							<span className="text-muted-foreground">
								{data.income.count} pagos
							</span>
						</div>
					</div>

					<div className="space-y-1">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<XCircleIcon className="size-4" />
							Canceladas
						</div>
						<p className="text-2xl font-bold text-muted-foreground">
							{data.sessions.cancelled}
						</p>
						<div className="flex items-center gap-2 text-xs">
							<span className="text-muted-foreground">
								{data.sessions.total > 0
									? Math.round(
											(data.sessions.cancelled / data.sessions.total) * 100,
										)
									: 0}
								%
							</span>
						</div>
					</div>
				</div>

				{/* Daily Sessions Chart */}
				{chartData.length > 0 && (
					<div className="space-y-2">
						<h4 className="text-sm font-medium text-muted-foreground">
							Sesiones por dia
						</h4>
						<div className="h-32 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={chartData}>
									<XAxis
										dataKey="label"
										axisLine={false}
										tickLine={false}
										tick={{ fontSize: 12 }}
									/>
									<Tooltip
										content={({ active, payload }) => {
											if (
												active &&
												payload &&
												payload.length > 0 &&
												payload[0]
											) {
												const item = payload[0];
												return (
													<div className="rounded-lg border bg-background p-2 shadow-sm">
														<p className="text-sm font-medium">
															{(item.payload as { label: string }).label}
														</p>
														<p className="text-muted-foreground text-xs">
															{item.value} sesiones
														</p>
													</div>
												);
											}
											return null;
										}}
									/>
									<Bar
										dataKey="sessions"
										fill="hsl(var(--primary))"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				)}

				{/* Attendance Breakdown */}
				{data.attendance.total > 0 && (
					<div className="space-y-2">
						<h4 className="text-sm font-medium text-muted-foreground">
							Desglose de asistencia
						</h4>
						<div className="grid grid-cols-4 gap-2">
							<div
								className={cn(
									"rounded-lg p-2 text-center",
									"bg-green-50 dark:bg-green-950",
								)}
							>
								<p className="font-bold text-green-600">
									{data.attendance.present}
								</p>
								<p className="text-muted-foreground text-xs">Presentes</p>
							</div>
							<div
								className={cn(
									"rounded-lg p-2 text-center",
									"bg-yellow-50 dark:bg-yellow-950",
								)}
							>
								<p className="font-bold text-yellow-600">
									{data.attendance.late}
								</p>
								<p className="text-muted-foreground text-xs">Tarde</p>
							</div>
							<div
								className={cn(
									"rounded-lg p-2 text-center",
									"bg-red-50 dark:bg-red-950",
								)}
							>
								<p className="font-bold text-red-600">
									{data.attendance.absent}
								</p>
								<p className="text-muted-foreground text-xs">Ausentes</p>
							</div>
							<div
								className={cn(
									"rounded-lg p-2 text-center",
									"bg-blue-50 dark:bg-blue-950",
								)}
							>
								<p className="font-bold text-blue-600">
									{data.attendance.excused}
								</p>
								<p className="text-muted-foreground text-xs">Justificados</p>
							</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
