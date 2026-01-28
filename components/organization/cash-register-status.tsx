"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
	AlertTriangleIcon,
	ArrowDownIcon,
	ArrowUpIcon,
	BanknoteIcon,
	EyeIcon,
	LockIcon,
	PlusIcon,
	TrendingUpIcon,
	UnlockIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { CashMovementModal } from "@/components/organization/cash-movement-modal";
import { CashRegisterCloseModal } from "@/components/organization/cash-register-close-modal";
import { CashRegisterOpenModal } from "@/components/organization/cash-register-open-modal";
import { CashRegisterStatusBadge } from "@/components/organization/cash-register-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CashRegisterStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface CashRegisterStatusCardProps {
	cashRegisterId?: string;
}

export function CashRegisterStatusCard({
	cashRegisterId,
}: CashRegisterStatusCardProps = {}): React.JSX.Element {
	const t = useTranslations("dashboard.cashRegister");
	const locale = useLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const isHistorical = !!cashRegisterId;

	const { data: currentRegister, isPending: isCurrentPending } =
		trpc.organization.cashRegister.getCurrent.useQuery(undefined, {
			enabled: !isHistorical,
		});

	const { data: historicalRegister, isPending: isHistoricalPending } =
		trpc.organization.cashRegister.getById.useQuery(
			{ id: cashRegisterId! },
			{ enabled: isHistorical },
		);

	const register = isHistorical ? historicalRegister : currentRegister;
	const isPending = isHistorical ? isHistoricalPending : isCurrentPending;

	const { data: dailySummary } =
		trpc.organization.cashRegister.getDailySummary.useQuery(
			isHistorical && register ? { date: register.date } : {},
			{ enabled: !!register },
		);

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
			style: "currency",
			currency: "ARS",
		}).format(amount / 100);
	};

	if (isPending) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-8 w-24" />
				</div>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
					{Array.from({ length: 5 }).map((_, i) => (
						<Card key={`skeleton-${i}`}>
							<CardContent className="p-4">
								<Skeleton className="h-4 w-20 mb-2" />
								<Skeleton className="h-6 w-24" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	const isOpen = register?.status === CashRegisterStatus.open;
	const isClosed = register?.status === CashRegisterStatus.closed;

	const dateFormat = locale === "es" ? "EEEE, d 'de' MMMM" : "EEEE, MMMM d";

	const showEmptyState =
		(!register && !isPending) || (!isHistorical && isClosed);

	if (showEmptyState) {
		const wasClosed = !isHistorical && isClosed;
		return (
			<div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8">
				<div className="rounded-full bg-muted p-3">
					{wasClosed ? (
						<LockIcon className="size-6 text-muted-foreground" />
					) : (
						<AlertTriangleIcon className="size-6 text-muted-foreground" />
					)}
				</div>
				<div className="text-center">
					<p className="font-medium">
						{wasClosed ? t("closedTitle") : t("notOpenTitle")}
					</p>
					<p className="text-muted-foreground text-sm">
						{wasClosed ? t("closedDescription") : t("notOpenDescription")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{wasClosed && register && (
						<Button variant="ghost" size="sm" asChild>
							<Link
								href={`/dashboard/organization/cash-register/${register.id}`}
							>
								<EyeIcon className="mr-1 size-4" />
								{t("closedViewLink")}
							</Link>
						</Button>
					)}
					<Button
						size="sm"
						disabled={wasClosed}
						onClick={
							wasClosed
								? undefined
								: () => NiceModal.show(CashRegisterOpenModal)
						}
					>
						<UnlockIcon className="mr-1 size-4" />
						{t("openButton")}
					</Button>
				</div>
			</div>
		);
	}

	if (!register) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-8 w-24" />
				</div>
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
					{Array.from({ length: 5 }).map((_, i) => (
						<Card key={`skeleton-${i}`}>
							<CardContent className="p-4">
								<Skeleton className="h-4 w-20 mb-2" />
								<Skeleton className="h-6 w-24" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	const displayDate = isHistorical ? register.date : new Date();

	return (
		<div className="space-y-4">
			{/* Toolbar: date, status, actions */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<span className="text-muted-foreground text-sm capitalize">
						{format(displayDate, dateFormat, { locale: dateLocale })}
					</span>
					<CashRegisterStatusBadge status={register.status} />
					{register.openedByUser && (
						<span className="text-muted-foreground text-xs hidden sm:inline">
							{t("openedBy", { name: register.openedByUser.name })}
							{register.closedByUser &&
								` · ${t("closedBy", { name: register.closedByUser.name })}`}
						</span>
					)}
				</div>
				{!isHistorical && isOpen && (
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								NiceModal.show(CashMovementModal, {
									cashRegisterId: register.id,
								})
							}
						>
							<PlusIcon className="mr-1 size-3.5" />
							{t("movementButton")}
						</Button>
						<Button
							size="sm"
							onClick={() =>
								NiceModal.show(CashRegisterCloseModal, {
									cashRegister: register,
								})
							}
						>
							<LockIcon className="mr-1 size-3.5" />
							{t("closeButton")}
						</Button>
					</div>
				)}
			</div>

			{/* Stat cards row */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
				{/* Opening Balance */}
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 text-muted-foreground mb-1">
							<WalletIcon className="size-3.5" />
							<span className="text-xs">{t("openingBalance")}</span>
						</div>
						<p className="font-semibold text-lg">
							{formatAmount(register.openingBalance)}
						</p>
					</CardContent>
				</Card>

				{/* Net Flow / Closing Balance */}
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 text-muted-foreground mb-1">
							<TrendingUpIcon className="size-3.5" />
							<span className="text-xs">
								{isClosed ? t("closingBalance") : t("netFlow")}
							</span>
						</div>
						<p
							className={cn(
								"font-semibold text-lg",
								isClosed
									? ""
									: (dailySummary?.netCashFlow ?? 0) >= 0
										? "text-green-600"
										: "text-red-600",
							)}
						>
							{isClosed
								? formatAmount(register.closingBalance ?? 0)
								: formatAmount(dailySummary?.netCashFlow ?? 0)}
						</p>
					</CardContent>
				</Card>

				{/* Income */}
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 text-muted-foreground mb-1">
							<ArrowUpIcon className="size-3.5" />
							<span className="text-xs">{t("incomeLabel")}</span>
						</div>
						<p className="font-semibold text-lg text-green-600">
							{formatAmount(dailySummary?.movements.income.total ?? 0)}
						</p>
						<p className="text-muted-foreground text-xs">
							({dailySummary?.movements.income.count ?? 0})
						</p>
					</CardContent>
				</Card>

				{/* Expenses */}
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 text-muted-foreground mb-1">
							<ArrowDownIcon className="size-3.5" />
							<span className="text-xs">{t("expenseLabel")}</span>
						</div>
						<p className="font-semibold text-lg text-red-600">
							{formatAmount(dailySummary?.movements.expense.total ?? 0)}
						</p>
						<p className="text-muted-foreground text-xs">
							({dailySummary?.movements.expense.count ?? 0})
						</p>
					</CardContent>
				</Card>

				{/* Payments Received */}
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2 text-muted-foreground mb-1">
							<BanknoteIcon className="size-3.5" />
							<span className="text-xs">{t("paymentsLabel")}</span>
						</div>
						<p className="font-semibold text-lg text-blue-600">
							{formatAmount(dailySummary?.paymentsReceived.total ?? 0)}
						</p>
						<p className="text-muted-foreground text-xs">
							({dailySummary?.paymentsReceived.count ?? 0})
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
