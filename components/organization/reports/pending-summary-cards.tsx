"use client";

import { CalendarIcon, ClockIcon, DumbbellIcon } from "lucide-react";
import type * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export function PendingSummaryCards(): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getPendingSummary.useQuery({});

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount / 100);
	};

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{[...Array(3)].map((_, i) => (
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

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			{/* Total Pending Card */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<ClockIcon className="h-4 w-4 text-yellow-600" />
						Total Pendiente
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold text-yellow-600">
						{formatAmount(data?.combined.totalAmount ?? 0)}
					</div>
					<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						<span>{data?.combined.count ?? 0} pagos por cobrar</span>
					</p>
				</CardContent>
			</Card>

			{/* Training Pending Card */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<DumbbellIcon className="h-4 w-4 text-blue-600" />
						Entrenamientos
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold text-blue-600">
						{formatAmount(data?.training.totalAmount ?? 0)}
					</div>
					<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						<span>{data?.training.count ?? 0} pagos pendientes</span>
					</p>
				</CardContent>
			</Card>

			{/* Events Pending Card */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<CalendarIcon className="h-4 w-4 text-purple-600" />
						Eventos
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold text-purple-600">
						{formatAmount(data?.events.totalAmount ?? 0)}
					</div>
					<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						<span>{data?.events.count ?? 0} inscripciones pendientes</span>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
