"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
	AlertTriangleIcon,
	CheckCircleIcon,
	HistoryIcon,
	LockIcon,
	PlusIcon,
	UnlockIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { CashMovementModal } from "@/components/organization/cash-movement-modal";
import { CashRegisterCloseModal } from "@/components/organization/cash-register-close-modal";
import { CashRegisterOpenModal } from "@/components/organization/cash-register-open-modal";
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
import { CashRegisterStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export function CashRegisterStatusCard(): React.JSX.Element {
	const t = useTranslations("dashboard.cashRegister");
	const locale = useLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const { data: currentRegister, isPending } =
		trpc.organization.cashRegister.getCurrent.useQuery();

	const { data: dailySummary } =
		trpc.organization.cashRegister.getDailySummary.useQuery({});

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
			style: "currency",
			currency: "ARS",
		}).format(amount / 100);
	};

	if (isPending) {
		return (
			<Card className="h-full flex flex-col">
				<CardHeader>
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent className="flex-1">
					<Skeleton className="h-full min-h-[150px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const isOpen = currentRegister?.status === CashRegisterStatus.open;
	const isClosed = currentRegister?.status === CashRegisterStatus.closed;

	const dateFormat = locale === "es" ? "EEEE, d 'de' MMMM" : "EEEE, MMMM d";

	return (
		<Card className="h-full flex flex-col">
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<CardTitle className="text-lg">{t("title")}</CardTitle>
						<Button variant="ghost" size="sm" asChild className="h-7 px-2">
							<Link href="/dashboard/organization/cash-register/history">
								<HistoryIcon className="mr-1 size-3.5" />
								{t("history")}
							</Link>
						</Button>
					</div>
					<CardDescription>
						{format(new Date(), dateFormat, { locale: dateLocale })}
					</CardDescription>
				</div>
				<Badge
					className={cn(
						"flex items-center gap-1.5 px-3 py-1",
						isOpen
							? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
							: isClosed
								? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
								: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
					)}
					variant="outline"
				>
					{isOpen ? (
						<>
							<UnlockIcon className="size-3.5" />
							{t("statusOpen")}
						</>
					) : isClosed ? (
						<>
							<LockIcon className="size-3.5" />
							{t("statusClosed")}
						</>
					) : (
						<>
							<AlertTriangleIcon className="size-3.5" />
							{t("statusNotOpened")}
						</>
					)}
				</Badge>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col justify-center">
				{!currentRegister ? (
					<div className="flex flex-col items-center gap-4 py-6">
						<div className="rounded-full bg-muted p-3">
							<AlertTriangleIcon className="size-6 text-muted-foreground" />
						</div>
						<div className="text-center">
							<p className="font-medium">{t("notOpenTitle")}</p>
							<p className="text-muted-foreground text-sm">
								{t("notOpenDescription")}
							</p>
						</div>
						<Button onClick={() => NiceModal.show(CashRegisterOpenModal)}>
							<UnlockIcon className="mr-2 size-4" />
							{t("openButton")}
						</Button>
					</div>
				) : (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<p className="text-muted-foreground text-sm">
									{t("openingBalance")}
								</p>
								<p className="font-semibold text-lg">
									{formatAmount(currentRegister.openingBalance)}
								</p>
							</div>
							{isClosed ? (
								<div className="space-y-1">
									<p className="text-muted-foreground text-sm">
										{t("closingBalance")}
									</p>
									<p className="font-semibold text-lg">
										{formatAmount(currentRegister.closingBalance ?? 0)}
									</p>
								</div>
							) : (
								<div className="space-y-1">
									<p className="text-muted-foreground text-sm">
										{t("netFlow")}
									</p>
									<p
										className={cn(
											"font-semibold text-lg",
											(dailySummary?.netCashFlow ?? 0) >= 0
												? "text-green-600"
												: "text-red-600",
										)}
									>
										{formatAmount(dailySummary?.netCashFlow ?? 0)}
									</p>
								</div>
							)}
						</div>

						{dailySummary && isOpen && (
							<div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
								<div className="text-center">
									<p className="text-muted-foreground text-xs">
										{t("incomeLabel")}
									</p>
									<p className="font-medium text-green-600">
										{formatAmount(dailySummary.movements.income.total)}
									</p>
									<p className="text-muted-foreground text-xs">
										({dailySummary.movements.income.count})
									</p>
								</div>
								<div className="text-center">
									<p className="text-muted-foreground text-xs">
										{t("expenseLabel")}
									</p>
									<p className="font-medium text-red-600">
										{formatAmount(dailySummary.movements.expense.total)}
									</p>
									<p className="text-muted-foreground text-xs">
										({dailySummary.movements.expense.count})
									</p>
								</div>
								<div className="text-center">
									<p className="text-muted-foreground text-xs">
										{t("paymentsLabel")}
									</p>
									<p className="font-medium text-blue-600">
										{formatAmount(dailySummary.paymentsReceived.total)}
									</p>
									<p className="text-muted-foreground text-xs">
										({dailySummary.paymentsReceived.count})
									</p>
								</div>
							</div>
						)}

						{isOpen && (
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									className="flex-1"
									onClick={() =>
										NiceModal.show(CashMovementModal, {
											cashRegisterId: currentRegister.id,
										})
									}
								>
									<PlusIcon className="mr-1 size-4" />
									{t("movementButton")}
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="flex-1"
									onClick={() =>
										NiceModal.show(CashRegisterCloseModal, {
											cashRegister: currentRegister,
										})
									}
								>
									<LockIcon className="mr-1 size-4" />
									{t("closeButton")}
								</Button>
							</div>
						)}

						{currentRegister.openedByUser && (
							<p className="text-muted-foreground text-xs">
								{t("openedBy", { name: currentRegister.openedByUser.name })}
								{currentRegister.closedByUser &&
									` - ${t("closedBy", { name: currentRegister.closedByUser.name })}`}
							</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
