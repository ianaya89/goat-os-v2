"use client";

import {
	ArrowDownIcon,
	ArrowUpIcon,
	CalendarCheckIcon,
	CalendarXIcon,
	ClockIcon,
	UsersIcon,
} from "lucide-react";
import type * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-32" />
							<Skeleton className="mt-2 h-3 w-20" />
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

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
			{/* Total Sessions */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<ClockIcon className="h-4 w-4" />
						Sesiones Totales
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold">
						{sessions.total}
					</div>
					<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						<span>
							{sessions.completed} completadas, {sessions.cancelled} canceladas
						</span>
					</p>
				</CardContent>
			</Card>

			{/* Completed */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<CalendarCheckIcon className="h-4 w-4" />
						Completadas
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold text-green-600">
						{sessions.completed}
					</div>
					<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						{completionRate >= 80 ? (
							<ArrowUpIcon className="h-3 w-3 text-green-600" />
						) : (
							<ArrowDownIcon className="h-3 w-3 text-red-600" />
						)}
						<span>{completionRate.toFixed(0)}% tasa de completitud</span>
					</p>
				</CardContent>
			</Card>

			{/* Cancelled */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<CalendarXIcon className="h-4 w-4" />
						Canceladas
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold text-red-600">
						{sessions.cancelled}
					</div>
					<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						<span>{cancellationRate.toFixed(0)}% tasa de cancelacion</span>
					</p>
				</CardContent>
			</Card>

			{/* Attendance */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<UsersIcon className="h-4 w-4" />
						Asistencia
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div
						className={cn(
							"font-heading text-2xl font-bold",
							attendance.rate >= 80
								? "text-green-600"
								: attendance.rate >= 60
									? "text-yellow-600"
									: "text-red-600",
						)}
					>
						{attendance.rate.toFixed(0)}%
					</div>
					<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						<span>
							{attendance.present + attendance.late} de {attendance.total}{" "}
							asistencias
						</span>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
