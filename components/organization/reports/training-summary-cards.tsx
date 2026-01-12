"use client";

import {
	CalendarCheckIcon,
	CalendarXIcon,
	ClockIcon,
	UsersIcon,
} from "lucide-react";
import type * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-20" />
							<Skeleton className="mt-1 h-3 w-32" />
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

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Sesiones Totales
					</CardTitle>
					<ClockIcon className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{sessions.total}</div>
					<p className="text-xs text-muted-foreground">
						{sessions.pending} pendientes
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Completadas</CardTitle>
					<CalendarCheckIcon className="h-4 w-4 text-green-600" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-green-600">
						{sessions.completed}
					</div>
					<p className="text-xs text-muted-foreground">
						{sessions.total > 0
							? ((sessions.completed / sessions.total) * 100).toFixed(1)
							: 0}
						% del total
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Canceladas</CardTitle>
					<CalendarXIcon className="h-4 w-4 text-red-600" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-red-600">
						{sessions.cancelled}
					</div>
					<p className="text-xs text-muted-foreground">
						{sessions.total > 0
							? ((sessions.cancelled / sessions.total) * 100).toFixed(1)
							: 0}
						% del total
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Asistencia</CardTitle>
					<UsersIcon className="h-4 w-4 text-blue-600" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-blue-600">
						{attendance.rate.toFixed(1)}%
					</div>
					<p className="text-xs text-muted-foreground">
						{attendance.present + attendance.late} presentes de{" "}
						{attendance.total}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
