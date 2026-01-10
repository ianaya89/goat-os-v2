"use client";

import {
	ArrowDown,
	ArrowUp,
	CalendarIcon,
	Menu,
	MedalIcon,
	TrendingUp,
	UserCheckIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { CenteredSpinner } from "@/components/ui/custom/centered-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export default function DashboardDemo() {
	const { data: stats, isLoading: statsLoading } =
		trpc.organization.dashboard.getStats.useQuery();
	const { data: sessionsOverTime, isLoading: sessionsLoading } =
		trpc.organization.dashboard.getSessionsOverTime.useQuery();
	const { data: attendanceStats, isLoading: attendanceLoading } =
		trpc.organization.dashboard.getAttendanceStats.useQuery();
	const { data: upcomingSessions, isLoading: upcomingLoading } =
		trpc.organization.dashboard.getUpcomingSessions.useQuery();

	if (statsLoading) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center py-24">
				<CenteredSpinner size="large" />
			</div>
		);
	}

	return (
		<div className="fade-in flex animate-in flex-col space-y-4 duration-500">
			{/* KPI Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				<KpiCard
					title="Atletas"
					icon={MedalIcon}
					value={stats?.athletes.total ?? 0}
					subtitle={`${stats?.athletes.active ?? 0} activos`}
					trend={stats?.athletes.active ? "up" : "stale"}
					trendValue={
						stats?.athletes.total
							? `${Math.round(((stats.athletes.active ?? 0) / stats.athletes.total) * 100)}%`
							: "0%"
					}
					href="/dashboard/organization/athletes"
				/>

				<KpiCard
					title="Coaches"
					icon={UserCheckIcon}
					value={stats?.coaches.total ?? 0}
					subtitle={`${stats?.coaches.active ?? 0} activos`}
					trend={stats?.coaches.active ? "up" : "stale"}
					trendValue={
						stats?.coaches.total
							? `${Math.round(((stats.coaches.active ?? 0) / stats.coaches.total) * 100)}%`
							: "0%"
					}
					href="/dashboard/organization/coaches"
				/>

				<KpiCard
					title="Grupos"
					icon={UsersIcon}
					value={stats?.groups.total ?? 0}
					subtitle={`${stats?.groups.active ?? 0} activos`}
					trend={stats?.groups.active ? "up" : "stale"}
					trendValue={
						stats?.groups.total
							? `${Math.round(((stats.groups.active ?? 0) / stats.groups.total) * 100)}%`
							: "0%"
					}
					href="/dashboard/organization/athlete-groups"
				/>

				<KpiCard
					title="Sesiones"
					icon={CalendarIcon}
					value={stats?.sessions.total ?? 0}
					subtitle={`${stats?.sessions.completed ?? 0} completadas`}
					trend={stats?.sessions.completed ? "up" : "stale"}
					trendValue={
						stats?.sessions.total
							? `${Math.round(((stats.sessions.completed ?? 0) / stats.sessions.total) * 100)}%`
							: "0%"
					}
					href="/dashboard/organization/training-sessions"
				/>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<SessionsChart data={sessionsOverTime} isLoading={sessionsLoading} />
				<AttendanceChart data={attendanceStats} isLoading={attendanceLoading} />
			</div>

			{/* Upcoming Sessions */}
			<UpcomingSessionsCard
				sessions={upcomingSessions}
				isLoading={upcomingLoading}
			/>
		</div>
	);
}

type KpiCardProps = {
	title: string;
	icon: React.ComponentType<{ className?: string }>;
	value: number;
	subtitle: string;
	trend: "up" | "down" | "stale";
	trendValue: string;
	href: string;
};

function KpiCard({
	title,
	icon: Icon,
	value,
	subtitle,
	trend,
	trendValue,
	href,
}: KpiCardProps) {
	return (
		<Card className="relative overflow-hidden">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<Icon className="h-4 w-4" />
						{title}
					</CardTitle>
					<TrendIndicator trend={trend}>{trendValue}</TrendIndicator>
				</div>
			</CardHeader>
			<CardContent>
				<div className="font-heading text-3xl font-bold">{value}</div>
				<p className="text-xs text-muted-foreground">{subtitle}</p>
			</CardContent>
			<CardFooter className="pt-0">
				<Button variant="ghost" size="sm" className="-ml-2 h-auto p-2" asChild>
					<Link href={href}>Ver todos</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}

type SessionsChartProps = {
	data:
		| Array<{
				week: string;
				completed: number;
				pending: number;
				cancelled: number;
		  }>
		| undefined;
	isLoading: boolean;
};

function SessionsChart({ data, isLoading }: SessionsChartProps) {
	const chartConfig = {
		sessions: {
			label: "Sesiones",
		},
		completed: {
			label: "Completadas",
			color: "var(--chart-1)",
		},
		pending: {
			label: "Pendientes",
			color: "var(--chart-2)",
		},
		cancelled: {
			label: "Canceladas",
			color: "var(--chart-3)",
		},
	} satisfies ChartConfig;

	const totalCompleted = useMemo(
		() => data?.reduce((acc, curr) => acc + curr.completed, 0) ?? 0,
		[data],
	);

	const totalPending = useMemo(
		() => data?.reduce((acc, curr) => acc + curr.pending, 0) ?? 0,
		[data],
	);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-64 w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Sesiones de Entrenamiento</CardTitle>
				<CardDescription>Ultimas 12 semanas</CardDescription>
			</CardHeader>

			<CardContent>
				<ChartContainer className="h-64 w-full" config={chartConfig}>
					<AreaChart accessibilityLayer data={data}>
						<defs>
							<linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-completed)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-completed)"
									stopOpacity={0.1}
								/>
							</linearGradient>
							<linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-pending)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-pending)"
									stopOpacity={0.1}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="week"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={32}
							tickFormatter={(value: string) => {
								const date = new Date(value);
								return date.toLocaleDateString("es-AR", {
									month: "short",
									day: "numeric",
								});
							}}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dot" />}
						/>
						<Area
							dataKey="pending"
							type="natural"
							fill="url(#fillPending)"
							fillOpacity={0.4}
							stroke="var(--color-pending)"
							stackId="a"
						/>
						<Area
							dataKey="completed"
							type="natural"
							fill="url(#fillCompleted)"
							fillOpacity={0.4}
							stroke="var(--color-completed)"
							stackId="a"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>

			<CardFooter>
				<div className="flex w-full items-start gap-2 text-sm">
					<div className="grid gap-2">
						<div className="flex items-center gap-2 font-medium leading-none">
							{totalCompleted} completadas, {totalPending} pendientes
							<TrendingUp className="h-4 w-4" />
						</div>
						<div className="flex items-center gap-2 text-muted-foreground leading-none">
							Periodo: ultimas 12 semanas
						</div>
					</div>
				</div>
			</CardFooter>
		</Card>
	);
}

type AttendanceChartProps = {
	data:
		| {
				present: number;
				absent: number;
				late: number;
				excused: number;
				total: number;
				attendanceRate: number;
		  }
		| undefined;
	isLoading: boolean;
};

function AttendanceChart({ data, isLoading }: AttendanceChartProps) {
	const chartConfig = {
		attendance: {
			label: "Asistencia",
		},
		present: {
			label: "Presente",
			color: "var(--chart-1)",
		},
		late: {
			label: "Tarde",
			color: "var(--chart-2)",
		},
		absent: {
			label: "Ausente",
			color: "var(--chart-3)",
		},
		excused: {
			label: "Justificado",
			color: "var(--chart-4)",
		},
	} satisfies ChartConfig;

	const pieData = useMemo(() => {
		if (!data) return [];
		return [
			{ name: "present", value: data.present, fill: "var(--color-present)" },
			{ name: "late", value: data.late, fill: "var(--color-late)" },
			{ name: "absent", value: data.absent, fill: "var(--color-absent)" },
			{ name: "excused", value: data.excused, fill: "var(--color-excused)" },
		].filter((item) => item.value > 0);
	}, [data]);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-64 w-full" />
				</CardContent>
			</Card>
		);
	}

	const hasData = data && data.total > 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Asistencia</CardTitle>
				<CardDescription>Ultimos 30 dias</CardDescription>
			</CardHeader>

			<CardContent>
				{hasData ? (
					<ChartContainer className="h-64 w-full" config={chartConfig}>
						<PieChart>
							<Pie
								data={pieData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								innerRadius={60}
								outerRadius={100}
								paddingAngle={2}
							>
								{pieData.map((entry) => (
									<Cell key={entry.name} fill={entry.fill} />
								))}
							</Pie>
							<ChartTooltip content={<ChartTooltipContent />} />
						</PieChart>
					</ChartContainer>
				) : (
					<div className="flex h-64 items-center justify-center text-muted-foreground">
						No hay datos de asistencia disponibles
					</div>
				)}
			</CardContent>

			<CardFooter>
				<div className="flex w-full items-start gap-2 text-sm">
					<div className="grid gap-2">
						{hasData ? (
							<>
								<div className="flex items-center gap-2 font-medium leading-none">
									Tasa de asistencia: {data.attendanceRate}%
									{data.attendanceRate >= 80 ? (
										<ArrowUp className="h-4 w-4 text-green-500" />
									) : (
										<ArrowDown className="h-4 w-4 text-destructive" />
									)}
								</div>
								<div className="flex items-center gap-2 text-muted-foreground leading-none">
									{data.total} registros totales
								</div>
							</>
						) : (
							<div className="text-muted-foreground">
								Registra asistencia para ver estadisticas
							</div>
						)}
					</div>
				</div>
			</CardFooter>
		</Card>
	);
}

type UpcomingSessionsCardProps = {
	sessions:
		| Array<{
				id: string;
				title: string;
				startTime: Date;
				endTime: Date;
				status: string;
		  }>
		| undefined;
	isLoading: boolean;
};

function UpcomingSessionsCard({
	sessions,
	isLoading,
}: UpcomingSessionsCardProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Proximas Sesiones</CardTitle>
						<CardDescription>Sesiones programadas esta semana</CardDescription>
					</div>
					<Button variant="outline" size="sm" asChild>
						<Link href="/dashboard/organization/training-sessions">
							Ver todas
						</Link>
					</Button>
				</div>
			</CardHeader>

			<CardContent>
				{sessions && sessions.length > 0 ? (
					<div className="space-y-4">
						{sessions.map((session) => (
							<Link
								key={session.id}
								href={`/dashboard/organization/training-sessions/${session.id}`}
								className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
							>
								<div className="flex items-center gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
										<CalendarIcon className="h-5 w-5 text-primary" />
									</div>
									<div>
										<p className="font-medium">{session.title}</p>
										<p className="text-sm text-muted-foreground">
											{new Date(session.startTime).toLocaleDateString("es-AR", {
												weekday: "short",
												month: "short",
												day: "numeric",
											})}{" "}
											-{" "}
											{new Date(session.startTime).toLocaleTimeString("es-AR", {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
								</div>
								<Badge
									variant={
										session.status === "confirmed" ? "default" : "secondary"
									}
								>
									{session.status === "confirmed" ? "Confirmada" : "Pendiente"}
								</Badge>
							</Link>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
						<p className="mt-4 text-muted-foreground">
							No hay sesiones programadas para esta semana
						</p>
						<Button className="mt-4" asChild>
							<Link href="/dashboard/organization/training-sessions">
								Crear sesion
							</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function TrendBadge(props: React.PropsWithChildren<{ trend: string }>) {
	const className = useMemo(() => {
		switch (props.trend) {
			case "up":
				return "text-green-500";
			case "down":
				return "text-destructive";
			case "stale":
				return "text-orange-500";
		}
	}, [props.trend]);

	return (
		<Badge variant="outline" className="border-transparent px-1.5 font-normal">
			<span className={className}>{props.children}</span>
		</Badge>
	);
}

function TrendIndicator(
	props: React.PropsWithChildren<{
		trend: "up" | "down" | "stale";
	}>,
) {
	const Icon = useMemo(() => {
		switch (props.trend) {
			case "up":
				return <ArrowUp className="h-3 w-3 text-green-500" />;
			case "down":
				return <ArrowDown className="h-3 w-3 text-destructive" />;
			case "stale":
				return <Menu className="h-3 w-3 text-orange-500" />;
		}
	}, [props.trend]);

	return (
		<div>
			<TrendBadge trend={props.trend}>
				<span className="flex items-center space-x-1">
					{Icon}
					<span>{props.children}</span>
				</span>
			</TrendBadge>
		</div>
	);
}
