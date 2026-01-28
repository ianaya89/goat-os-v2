"use client";

import {
	ArrowDownIcon,
	ArrowUpIcon,
	BanknoteIcon,
	ClockIcon,
	ReceiptIcon,
	TrendingUpIcon,
} from "lucide-react";
import type * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

type FinancialSummaryCardsProps = {
	dateRange: { from: Date; to: Date };
};

export function FinancialSummaryCards({
	dateRange,
}: FinancialSummaryCardsProps): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getFinancialSummary.useQuery({
			dateRange,
		});

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

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
			{/* Revenue Card */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<BanknoteIcon className="h-4 w-4" />
						Ingresos
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold text-green-600">
						{formatAmount(data?.revenue.total ?? 0)}
					</div>
					<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						<span>{data?.revenue.count ?? 0} pagos</span>
					</p>
				</CardContent>
			</Card>

			{/* Expenses Card */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<ReceiptIcon className="h-4 w-4" />
						Gastos
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold text-red-600">
						{formatAmount(data?.expenses.total ?? 0)}
					</div>
					<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						<span>{data?.expenses.count ?? 0} gastos</span>
					</p>
				</CardContent>
			</Card>

			{/* Net Profit Card */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<TrendingUpIcon className="h-4 w-4" />
						Ganancia Neta
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div
						className={cn(
							"font-heading text-2xl font-bold",
							(data?.netProfit ?? 0) >= 0 ? "text-green-600" : "text-red-600",
						)}
					>
						{formatAmount(data?.netProfit ?? 0)}
					</div>
					<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						{(data?.profitMargin ?? 0) >= 0 ? (
							<ArrowUpIcon className="h-3 w-3 text-green-600" />
						) : (
							<ArrowDownIcon className="h-3 w-3 text-red-600" />
						)}
						<span>{(data?.profitMargin ?? 0).toFixed(1)}% margen</span>
					</p>
				</CardContent>
			</Card>

			{/* Pending Payments Card */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<ClockIcon className="h-4 w-4" />
						Por Cobrar
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="font-heading text-2xl font-bold text-yellow-600">
						{formatAmount(data?.pending.total ?? 0)}
					</div>
					<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						<span>{data?.pending.count ?? 0} pagos pendientes</span>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
