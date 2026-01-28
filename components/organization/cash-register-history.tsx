"use client";

import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { format, isToday } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { EyeIcon, MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { parseAsInteger, useQueryState } from "nuqs";
import * as React from "react";
import { CashRegisterStatusBadge } from "@/components/organization/cash-register-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DataTable,
	type FilterConfig,
} from "@/components/ui/custom/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appConfig } from "@/config/app.config";
import {
	CashRegisterStatus,
	CashRegisterStatuses,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface CashRegisterRecord {
	id: string;
	date: Date;
	openingBalance: number;
	closingBalance: number | null;
	status: string;
	openedByUser: {
		id: string;
		name: string;
	} | null;
	closedByUser: {
		id: string;
		name: string;
	} | null;
	createdAt: Date;
	closedAt: Date | null;
}

export function CashRegisterHistory(): React.JSX.Element {
	const t = useTranslations("finance.cashRegister");
	const locale = useLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const [pageIndex, setPageIndex] = useQueryState(
		"pageIndex",
		parseAsInteger.withDefault(0).withOptions({
			shallow: true,
		}),
	);

	const [pageSize, setPageSize] = useQueryState(
		"pageSize",
		parseAsInteger.withDefault(appConfig.pagination.defaultLimit).withOptions({
			shallow: true,
		}),
	);

	const [statusFilter, setStatusFilter] = React.useState<string[]>([]);

	const columnFilters: ColumnFiltersState = React.useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (statusFilter.length > 0) {
			filters.push({ id: "status", value: statusFilter });
		}
		return filters;
	}, [statusFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const statusValues = filters.find((f) => f.id === "status");
		setStatusFilter(
			Array.isArray(statusValues?.value)
				? (statusValues.value as string[])
				: [],
		);
		setPageIndex(0);
	};

	const historyFilters: FilterConfig[] = [
		{
			key: "status",
			title: t("history.filterStatus"),
			options: CashRegisterStatuses.map((status) => ({
				value: status,
				label:
					status === CashRegisterStatus.closed
						? t("history.statusClosed")
						: t("history.statusOpen"),
			})),
		},
	];

	const { data, isPending } =
		trpc.organization.cashRegister.getHistory.useQuery(
			{
				limit: pageSize || appConfig.pagination.defaultLimit,
				offset:
					(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
				status:
					statusFilter.length > 0
						? (statusFilter as CashRegisterStatus[])
						: undefined,
			},
			{
				placeholderData: (prev) => prev,
			},
		);

	const formatAmount = (amount: number | null) => {
		if (amount === null) return "-";
		return new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
			style: "currency",
			currency: "ARS",
		}).format(amount / 100);
	};

	const dateFormat = locale === "es" ? "EEEE, d 'de' MMMM" : "EEEE, MMMM d";

	const columns: ColumnDef<CashRegisterRecord>[] = [
		{
			accessorKey: "date",
			header: t("history.date"),
			cell: ({ row }) => {
				const today = isToday(row.original.date);
				return (
					<div className="flex items-center gap-2">
						<span className="font-medium text-foreground capitalize">
							{format(row.original.date, dateFormat, {
								locale: dateLocale,
							})}
						</span>
						{today && (
							<Badge
								variant="outline"
								className="border-primary/30 bg-primary/5 text-primary text-[10px] px-1.5 py-0"
							>
								{t("history.today")}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "status",
			header: t("history.status"),
			cell: ({ row }) => (
				<CashRegisterStatusBadge status={row.original.status} />
			),
		},
		{
			accessorKey: "openingBalance",
			header: t("history.openingBalance"),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{formatAmount(row.original.openingBalance)}
				</span>
			),
		},
		{
			accessorKey: "closingBalance",
			header: t("history.closingBalance"),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{formatAmount(row.original.closingBalance)}
				</span>
			),
		},
		{
			accessorKey: "difference",
			header: t("history.difference"),
			cell: ({ row }) => {
				if (row.original.closingBalance === null) {
					return <span className="text-muted-foreground">-</span>;
				}
				const diff = row.original.closingBalance - row.original.openingBalance;
				return (
					<span
						className={cn(
							"font-medium",
							diff >= 0 ? "text-green-600" : "text-red-600",
						)}
					>
						{diff >= 0 ? "+" : ""}
						{formatAmount(diff)}
					</span>
				);
			},
		},
		{
			accessorKey: "openedByUser",
			header: t("history.openedBy"),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.openedByUser?.name ?? "-"}
				</span>
			),
		},
		{
			accessorKey: "closedByUser",
			header: t("history.closedBy"),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.closedByUser?.name ?? "-"}
				</span>
			),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex justify-end">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
								size="icon"
								variant="ghost"
							>
								<MoreHorizontalIcon className="shrink-0" />
								<span className="sr-only">{t("history.actions")}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link
									href={`/dashboard/organization/cash-register/${row.original.id}`}
								>
									<EyeIcon className="mr-2 size-4" />
									{t("history.viewMovements")}
								</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.registers as CashRegisterRecord[]) || []}
			emptyMessage={t("history.empty")}
			enableFilters
			enablePagination
			enableSearch
			filters={historyFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			searchPlaceholder={t("history.search")}
			totalCount={data?.total ?? 0}
		/>
	);
}
