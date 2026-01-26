"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDaysIcon } from "lucide-react";
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

type RevenueByEventChartProps = {
	dateRange: { from: Date; to: Date };
	limit?: number;
};

const EVENT_TYPE_COLORS: Record<string, string> = {
	competition: "#ef4444",
	championship: "#f97316",
	tournament: "#eab308",
	friendly: "#22c55e",
	exhibition: "#3b82f6",
	training_camp: "#8b5cf6",
	clinic: "#ec4899",
	other: "#6b7280",
};

export function RevenueByEventChart({
	dateRange,
	limit = 10,
}: RevenueByEventChartProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getRevenueByEvent.useQuery({
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
			id: item.eventId,
			name:
				item.eventTitle.length > 20
					? `${item.eventTitle.slice(0, 20)}...`
					: item.eventTitle,
			fullName: item.eventTitle,
			eventType: item.eventType,
			eventDate: item.eventDate,
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
					<CalendarDaysIcon className="h-5 w-5 text-orange-600" />
					Ingresos por Evento
				</CardTitle>
				<CardDescription>
					Total: {formatAmount(totalRevenue)} de {chartData.length} eventos
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						No hay datos de eventos para este periodo
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
												eventType: string;
												eventDate: Date;
												total: number;
												count: number;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="mb-1 text-sm font-medium">
														{item.fullName}
													</p>
													<p className="text-xs text-muted-foreground mb-2">
														{item.eventDate
															? format(
																	new Date(item.eventDate),
																	"dd MMM yyyy",
																	{
																		locale: es,
																	},
																)
															: "Sin fecha"}
													</p>
													<p className="text-green-600 font-medium">
														{formatAmount(item.total)}
													</p>
													<p className="text-muted-foreground text-xs">
														{item.count} inscripciones
													</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Bar dataKey="total" radius={[0, 4, 4, 0]}>
									{chartData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={
												EVENT_TYPE_COLORS[entry.eventType ?? "other"] ??
												"#6b7280"
											}
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
