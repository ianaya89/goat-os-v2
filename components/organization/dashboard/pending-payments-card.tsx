"use client";

import {
	AlertCircleIcon,
	ArrowRightIcon,
	BanknoteIcon,
	CreditCardIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export function PendingPaymentsCard(): React.JSX.Element {
	const t = useTranslations("dashboard.pendingPayments");
	const locale = useLocale();

	const { data, isLoading } =
		trpc.organization.reports.getPendingSummary.useQuery({});

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
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
					<CardTitle>{t("title")}</CardTitle>
					<CardDescription>{t("noData")}</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const totalPending = data.combined.count;
	const totalAmount = data.combined.totalAmount;

	return (
		<Card className="flex flex-col">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<BanknoteIcon className="size-5 text-muted-foreground" />
							{t("title")}
						</CardTitle>
						<CardDescription>{t("description")}</CardDescription>
					</div>
					{totalPending > 0 && (
						<Badge variant="destructive" className="flex items-center gap-1">
							<AlertCircleIcon className="size-3" />
							{totalPending}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col">
				{totalPending > 0 ? (
					<div className="flex flex-1 flex-col space-y-4">
						{/* Total Outstanding */}
						<div className="rounded-lg bg-muted/50 p-4">
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">
									{t("totalOutstanding")}
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
									<div className="flex size-9 items-center justify-center rounded-lg bg-muted">
										<CreditCardIcon className="size-4 text-muted-foreground" />
									</div>
									<div>
										<p className="font-medium text-sm">{t("training")}</p>
										<p className="text-xs text-muted-foreground">
											{t("trainingPending", { count: data.training.count })}
										</p>
									</div>
								</div>
								<span className="font-semibold">
									{formatAmount(data.training.totalAmount)}
								</span>
							</div>

							{/* Event Payments */}
							<div className="flex items-center justify-between rounded-lg border p-3">
								<div className="flex items-center gap-3">
									<div className="flex size-9 items-center justify-center rounded-lg bg-muted">
										<BanknoteIcon className="size-4 text-muted-foreground" />
									</div>
									<div>
										<p className="font-medium text-sm">{t("events")}</p>
										<p className="text-xs text-muted-foreground">
											{t("eventsPending", { count: data.events.count })}
										</p>
									</div>
								</div>
								<span className="font-semibold">
									{formatAmount(data.events.totalAmount)}
								</span>
							</div>
						</div>

						<Button
							variant="ghost"
							size="sm"
							asChild
							className="mt-auto w-full gap-1.5"
						>
							<Link href="/dashboard/organization/reports/pending">
								{t("viewDetails")}
								<ArrowRightIcon className="size-3.5" />
							</Link>
						</Button>
					</div>
				) : (
					<div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
						<BanknoteIcon className="size-10 text-muted-foreground/50 mb-2" />
						<p className="text-muted-foreground text-sm">{t("noPending")}</p>
						<p className="text-xs text-muted-foreground mt-1">
							{t("allUpToDate")}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
