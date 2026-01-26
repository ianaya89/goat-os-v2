"use client";

import { AlertCircleIcon, BanknoteIcon, CreditCardIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export function PendingPaymentsCard(): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getPendingSummary.useQuery({});

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
					<Skeleton className="h-32 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Pagos Pendientes</CardTitle>
					<CardDescription>No hay datos disponibles</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const totalPending = data.combined.count;
	const totalAmount = data.combined.totalAmount;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<BanknoteIcon className="size-5 text-amber-500" />
							Pagos Pendientes
						</CardTitle>
						<CardDescription>Cuotas y eventos por cobrar</CardDescription>
					</div>
					{totalPending > 0 && (
						<Badge variant="secondary" className="flex items-center gap-1">
							<AlertCircleIcon className="size-3" />
							{totalPending}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{totalPending > 0 ? (
					<div className="space-y-4">
						{/* Total Outstanding */}
						<div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									Total por cobrar
								</span>
								<span className="text-2xl font-bold text-amber-600">
									{formatAmount(totalAmount)}
								</span>
							</div>
						</div>

						{/* Breakdown */}
						<div className="space-y-3">
							{/* Training Payments */}
							<div className="flex items-center justify-between rounded-lg border p-3">
								<div className="flex items-center gap-3">
									<div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
										<CreditCardIcon className="size-4 text-blue-600" />
									</div>
									<div>
										<p className="font-medium text-sm">Entrenamientos</p>
										<p className="text-xs text-muted-foreground">
											{data.training.count} pagos pendientes
										</p>
									</div>
								</div>
								<span className="font-semibold text-blue-600">
									{formatAmount(data.training.totalAmount)}
								</span>
							</div>

							{/* Event Payments */}
							<div className="flex items-center justify-between rounded-lg border p-3">
								<div className="flex items-center gap-3">
									<div className="flex size-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
										<BanknoteIcon className="size-4 text-purple-600" />
									</div>
									<div>
										<p className="font-medium text-sm">Eventos</p>
										<p className="text-xs text-muted-foreground">
											{data.events.count} registros pendientes
										</p>
									</div>
								</div>
								<span className="font-semibold text-purple-600">
									{formatAmount(data.events.totalAmount)}
								</span>
							</div>
						</div>

						<Button variant="outline" size="sm" asChild className="w-full">
							<Link href="/dashboard/organization/reports/pending">
								Ver detalle de pagos
							</Link>
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center py-6 text-center">
						<BanknoteIcon className="size-10 text-green-500/50 mb-2" />
						<p className="text-muted-foreground text-sm">
							No hay pagos pendientes
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Todos los pagos estan al dia
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
