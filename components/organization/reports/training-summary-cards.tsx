"use client";

import {
	CalendarCheckIcon,
	CalendarXIcon,
	ClockIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import type * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

type TrainingSummaryCardsProps = {
	dateRange: { from: Date; to: Date };
};

export function TrainingSummaryCards({
	dateRange,
}: TrainingSummaryCardsProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getTrainingSummary.useQuery({
			dateRange,
		});

	if (isLoading) {
		return (
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i} className="overflow-hidden">
						<CardContent className="p-4">
							<Skeleton className="h-10 w-10 rounded-xl mb-3" />
							<Skeleton className="h-4 w-24 mb-2" />
							<Skeleton className="h-8 w-16 mb-2" />
							<Skeleton className="h-2 w-full" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const sessions = data?.sessions ?? {
		total: 0,
		completed: 0,
		cancelled: 0,
		pending: 0,
		confirmed: 0,
		completionRate: 0,
	};

	const attendance = data?.attendance ?? {
		total: 0,
		present: 0,
		late: 0,
		absent: 0,
		excused: 0,
		rate: 0,
	};

	const completionRate =
		sessions.total > 0 ? (sessions.completed / sessions.total) * 100 : 0;
	const cancellationRate =
		sessions.total > 0 ? (sessions.cancelled / sessions.total) * 100 : 0;
	const pendingRate =
		sessions.total > 0
			? ((sessions.pending + sessions.confirmed) / sessions.total) * 100
			: 0;

	const getRateColor = (rate: number, isInverse = false) => {
		if (isInverse) {
			if (rate <= 10) return "text-success";
			if (rate <= 20) return "text-warning";
			return "text-destructive";
		}
		if (rate >= 80) return "text-success";
		if (rate >= 60) return "text-warning";
		return "text-destructive";
	};

	const getProgressColor = (rate: number, isInverse = false) => {
		if (isInverse) {
			if (rate <= 10) return "bg-success";
			if (rate <= 20) return "bg-warning";
			return "bg-destructive";
		}
		if (rate >= 80) return "bg-success";
		if (rate >= 60) return "bg-warning";
		return "bg-destructive";
	};

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{/* Total Sessions */}
			<Card className="overflow-hidden border-l-4 border-l-primary">
				<CardContent className="p-4">
					<div className="flex items-start justify-between">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
							<ClockIcon className="h-5 w-5 text-primary" />
						</div>
						<div className="flex items-center gap-1 text-xs text-muted-foreground">
							<TrendingUpIcon className="h-3 w-3" />
							{pendingRate.toFixed(0)}% pendientes
						</div>
					</div>
					<div className="mt-3">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Sesiones Totales
						</p>
						<p className="text-2xl font-bold mt-1">{sessions.total}</p>
					</div>
					<div className="mt-3 space-y-1">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">Distribucion</span>
						</div>
						<div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="bg-success transition-all duration-500"
								style={{
									width: `${completionRate}%`,
								}}
							/>
							<div
								className="bg-destructive transition-all duration-500"
								style={{
									width: `${cancellationRate}%`,
								}}
							/>
							<div
								className="bg-warning transition-all duration-500"
								style={{
									width: `${pendingRate}%`,
								}}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Completed */}
			<Card className="overflow-hidden border-l-4 border-l-success">
				<CardContent className="p-4">
					<div className="flex items-start justify-between">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
							<CalendarCheckIcon className="h-5 w-5 text-success" />
						</div>
						<span
							className={cn(
								"text-xs font-medium",
								getRateColor(completionRate),
							)}
						>
							{completionRate.toFixed(0)}%
						</span>
					</div>
					<div className="mt-3">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Completadas
						</p>
						<p className="text-2xl font-bold text-success mt-1">
							{sessions.completed}
						</p>
					</div>
					<div className="mt-3 space-y-1">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">Tasa de completitud</span>
						</div>
						<Progress
							value={completionRate}
							className="h-2"
							indicatorClassName={getProgressColor(completionRate)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Cancelled */}
			<Card className="overflow-hidden border-l-4 border-l-destructive">
				<CardContent className="p-4">
					<div className="flex items-start justify-between">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
							<CalendarXIcon className="h-5 w-5 text-destructive" />
						</div>
						<span
							className={cn(
								"text-xs font-medium",
								getRateColor(cancellationRate, true),
							)}
						>
							{cancellationRate.toFixed(0)}%
						</span>
					</div>
					<div className="mt-3">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Canceladas
						</p>
						<p className="text-2xl font-bold text-destructive mt-1">
							{sessions.cancelled}
						</p>
					</div>
					<div className="mt-3 space-y-1">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">Tasa de cancelacion</span>
						</div>
						<Progress
							value={cancellationRate}
							className="h-2"
							indicatorClassName={getProgressColor(cancellationRate, true)}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Attendance */}
			<Card className="overflow-hidden border-l-4 border-l-chart-5">
				<CardContent className="p-4">
					<div className="flex items-start justify-between">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-5/10">
							<UsersIcon className="h-5 w-5 text-chart-5" />
						</div>
						<span
							className={cn(
								"text-xs font-medium",
								getRateColor(attendance.rate),
							)}
						>
							{attendance.rate.toFixed(0)}%
						</span>
					</div>
					<div className="mt-3">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Asistencia
						</p>
						<p className="text-2xl font-bold text-chart-5 mt-1">
							{attendance.present + attendance.late}
							<span className="text-sm font-normal text-muted-foreground">
								/{attendance.total}
							</span>
						</p>
					</div>
					<div className="mt-3 space-y-1">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">Tasa de asistencia</span>
						</div>
						<Progress
							value={attendance.rate}
							className="h-2"
							indicatorClassName={getProgressColor(attendance.rate)}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
