"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart3Icon, LineChartIcon, TrendingUpIcon } from "lucide-react";
import * as React from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ComposedChart,
	Legend,
	Line,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { trpc } from "@/trpc/client";

type RevenueCumulativeChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

type ViewMode = "monthly" | "cumulative" | "combined";

export function RevenueCumulativeChart({
	dateRange,
	period,
}: RevenueCumulativeChartProps): React.JSX.Element {
	const [viewMode, setViewMode] = React.useState<ViewMode>("combined");

	const { data, isLoading } =
		trpc.organization.reports.getRevenueWithCumulative.useQuery({
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

	const formatCompact = (value: number) => {
		return new Intl.NumberFormat("es-AR", {
			notation: "compact",
			compactDisplay: "short",
		}).format(value / 100);
	};

	const chartData =
		data?.map((item) => ({
			date: item.period,
			label: format(
				new Date(item.period),
				period === "year" ? "yyyy" : "MMM yy",
				{ locale: es },
			),
			total: item.total,
			cumulative: item.cumulative,
			count: item.count,
		})) ?? [];

	const lastCumulative =
		chartData.length > 0
			? (chartData[chartData.length - 1]?.cumulative ?? 0)
			: 0;

	const totalPeriod = chartData.reduce((acc, item) => acc + item.total, 0);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const renderChart = () => {
		if (chartData.length === 0) {
			return (
				<div className="flex h-[300px] items-center justify-center text-muted-foreground">
					No hay datos de ingresos para este periodo
				</div>
			);
		}

		const tooltipContent = ({
			active,
			payload,
		}: {
			active?: boolean;
			payload?: Array<{
				payload?: {
					label: string;
					total: number;
					cumulative: number;
					count: number;
				};
			}>;
		}) => {
			if (active && payload && payload.length > 0) {
				const item = payload[0]?.payload;
				if (!item) return null;
				return (
					<div className="rounded-lg border bg-background p-3 shadow-sm">
						<p className="mb-2 text-sm font-medium">{item.label}</p>
						<div className="space-y-1 text-sm">
							{(viewMode === "monthly" || viewMode === "combined") && (
								<p className="text-blue-600">Mes: {formatAmount(item.total)}</p>
							)}
							{(viewMode === "cumulative" || viewMode === "combined") && (
								<p className="text-green-600 font-medium">
									Acumulado: {formatAmount(item.cumulative)}
								</p>
							)}
							<p className="text-muted-foreground text-xs">
								{item.count} pagos
							</p>
						</div>
					</div>
				);
			}
			return null;
		};

		if (viewMode === "monthly") {
			return (
				<div className="h-[300px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={chartData}>
							<defs>
								<linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
								tickFormatter={formatCompact}
							/>
							<Tooltip content={tooltipContent} />
							<Area
								type="monotone"
								dataKey="total"
								name="Mensual"
								stroke="#3b82f6"
								strokeWidth={2}
								fill="url(#colorMonthly)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			);
		}

		if (viewMode === "cumulative") {
			return (
				<div className="h-[300px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={chartData}>
							<defs>
								<linearGradient
									id="colorCumulative"
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
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
								tickFormatter={formatCompact}
							/>
							<Tooltip content={tooltipContent} />
							<Area
								type="monotone"
								dataKey="cumulative"
								name="Acumulado"
								stroke="#16a34a"
								strokeWidth={2}
								fill="url(#colorCumulative)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			);
		}

		// Combined view
		return (
			<div className="h-[300px] w-full">
				<ResponsiveContainer width="100%" height="100%">
					<ComposedChart data={chartData}>
						<defs>
							<linearGradient
								id="colorMonthlyCombined"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
								<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
							yAxisId="left"
							tick={{ fontSize: 12 }}
							tickLine={false}
							axisLine={false}
							tickFormatter={formatCompact}
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tick={{ fontSize: 12 }}
							tickLine={false}
							axisLine={false}
							tickFormatter={formatCompact}
						/>
						<Tooltip content={tooltipContent} />
						<Legend
							formatter={(value) => {
								if (value === "total") return "Mensual";
								if (value === "cumulative") return "Acumulado";
								return value;
							}}
						/>
						<Area
							yAxisId="left"
							type="monotone"
							dataKey="total"
							name="total"
							stroke="#3b82f6"
							strokeWidth={2}
							fill="url(#colorMonthlyCombined)"
						/>
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="cumulative"
							name="cumulative"
							stroke="#16a34a"
							strokeWidth={2}
							dot={{ fill: "#16a34a", strokeWidth: 2, r: 3 }}
						/>
					</ComposedChart>
				</ResponsiveContainer>
			</div>
		);
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<TrendingUpIcon className="h-5 w-5 text-green-600" />
							Ingresos por Periodo
						</CardTitle>
						<CardDescription>
							{viewMode === "monthly" &&
								`Total del periodo: ${formatAmount(totalPeriod)}`}
							{viewMode === "cumulative" &&
								`Total acumulado: ${formatAmount(lastCumulative)}`}
							{viewMode === "combined" &&
								`Mensual: ${formatAmount(totalPeriod)} | Acumulado: ${formatAmount(lastCumulative)}`}
						</CardDescription>
					</div>
					<ToggleGroup
						type="single"
						value={viewMode}
						onValueChange={(value) => value && setViewMode(value as ViewMode)}
						className="bg-muted rounded-lg p-1"
					>
						<ToggleGroupItem
							value="monthly"
							aria-label="Vista mensual"
							className="gap-1.5 px-3 data-[state=on]:bg-background"
						>
							<BarChart3Icon className="h-4 w-4" />
							<span className="hidden sm:inline">Mensual</span>
						</ToggleGroupItem>
						<ToggleGroupItem
							value="cumulative"
							aria-label="Vista acumulada"
							className="gap-1.5 px-3 data-[state=on]:bg-background"
						>
							<LineChartIcon className="h-4 w-4" />
							<span className="hidden sm:inline">Acumulado</span>
						</ToggleGroupItem>
						<ToggleGroupItem
							value="combined"
							aria-label="Vista combinada"
							className="gap-1.5 px-3 data-[state=on]:bg-background"
						>
							<TrendingUpIcon className="h-4 w-4" />
							<span className="hidden sm:inline">Ambos</span>
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
			</CardHeader>
			<CardContent>{renderChart()}</CardContent>
		</Card>
	);
}
