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

type SessionsCumulativeChartProps = {
	dateRange: { from: Date; to: Date };
	period: "day" | "week" | "month" | "year";
};

type ViewMode = "period" | "cumulative" | "combined";

export function SessionsCumulativeChart({
	dateRange,
	period,
}: SessionsCumulativeChartProps): React.JSX.Element {
	const [viewMode, setViewMode] = React.useState<ViewMode>("combined");

	const { data, isLoading } =
		trpc.organization.reports.getSessionsByPeriod.useQuery({
			dateRange,
			period,
		});

	const chartData = React.useMemo(() => {
		let cumulative = 0;
		return (
			data?.map((item) => {
				cumulative += item.total;
				return {
					label: format(
						new Date(item.period),
						period === "year" ? "yyyy" : "MMM yy",
						{ locale: es },
					),
					total: item.total,
					completed: item.completed,
					cumulative,
				};
			}) ?? []
		);
	}, [data, period]);

	const totalSessions = chartData.reduce((acc, item) => acc + item.total, 0);
	const lastCumulative =
		chartData.length > 0
			? (chartData[chartData.length - 1]?.cumulative ?? 0)
			: 0;

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

	const tooltipContent = ({
		active,
		payload,
	}: {
		active?: boolean;
		payload?: Array<{
			payload?: {
				label: string;
				total: number;
				completed: number;
				cumulative: number;
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
						{(viewMode === "period" || viewMode === "combined") && (
							<p className="text-primary">
								Periodo: {item.total} sesiones ({item.completed} completadas)
							</p>
						)}
						{(viewMode === "cumulative" || viewMode === "combined") && (
							<p className="text-green-600 font-medium">
								Acumulado: {item.cumulative} sesiones
							</p>
						)}
					</div>
				</div>
			);
		}
		return null;
	};

	const renderChart = () => {
		if (chartData.length === 0) {
			return (
				<div className="flex h-[300px] items-center justify-center text-muted-foreground">
					No hay datos de sesiones para este periodo
				</div>
			);
		}

		if (viewMode === "period") {
			return (
				<div className="h-[300px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={chartData}>
							<defs>
								<linearGradient
									id="colorSessionsPeriod"
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor="hsl(var(--primary))"
										stopOpacity={0.3}
									/>
									<stop
										offset="95%"
										stopColor="hsl(var(--primary))"
										stopOpacity={0}
									/>
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
							/>
							<Tooltip content={tooltipContent} />
							<Area
								type="monotone"
								dataKey="total"
								name="Por periodo"
								stroke="hsl(var(--primary))"
								strokeWidth={2}
								fill="url(#colorSessionsPeriod)"
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
									id="colorSessionsCumulative"
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
							/>
							<Tooltip content={tooltipContent} />
							<Area
								type="monotone"
								dataKey="cumulative"
								name="Acumulado"
								stroke="#16a34a"
								strokeWidth={2}
								fill="url(#colorSessionsCumulative)"
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
								id="colorSessionsPeriodCombined"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="hsl(var(--primary))"
									stopOpacity={0.2}
								/>
								<stop
									offset="95%"
									stopColor="hsl(var(--primary))"
									stopOpacity={0}
								/>
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
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tick={{ fontSize: 12 }}
							tickLine={false}
							axisLine={false}
						/>
						<Tooltip content={tooltipContent} />
						<Legend
							formatter={(value) => {
								if (value === "total") return "Por periodo";
								if (value === "cumulative") return "Acumulado";
								return value;
							}}
						/>
						<Area
							yAxisId="left"
							type="monotone"
							dataKey="total"
							name="total"
							stroke="hsl(var(--primary))"
							strokeWidth={2}
							fill="url(#colorSessionsPeriodCombined)"
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
							<TrendingUpIcon className="h-5 w-5" />
							Sesiones por Periodo
						</CardTitle>
						<CardDescription>
							{viewMode === "period" &&
								`Total del periodo: ${totalSessions} sesiones`}
							{viewMode === "cumulative" &&
								`Total acumulado: ${lastCumulative} sesiones`}
							{viewMode === "combined" &&
								`Periodo: ${totalSessions} | Acumulado: ${lastCumulative}`}
						</CardDescription>
					</div>
					<ToggleGroup
						type="single"
						value={viewMode}
						onValueChange={(value) => value && setViewMode(value as ViewMode)}
						className="bg-muted rounded-lg p-1"
					>
						<ToggleGroupItem
							value="period"
							aria-label="Vista por periodo"
							className="gap-1.5 px-3 data-[state=on]:bg-background"
						>
							<BarChart3Icon className="h-4 w-4" />
							<span className="hidden sm:inline">Periodo</span>
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
