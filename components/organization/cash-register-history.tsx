"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircleIcon, ClockIcon } from "lucide-react";
import { parseAsInteger, useQueryState } from "nuqs";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/custom/data-table";
import { appConfig } from "@/config/app.config";
import { CashRegisterStatus } from "@/lib/db/schema/enums";
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

	const { data, isPending } =
		trpc.organization.cashRegister.getHistory.useQuery(
			{
				limit: pageSize || appConfig.pagination.defaultLimit,
				offset:
					(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			},
			{
				placeholderData: (prev) => prev,
			},
		);

	const formatAmount = (amount: number | null) => {
		if (amount === null) return "-";
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(amount / 100);
	};

	const columns: ColumnDef<CashRegisterRecord>[] = [
		{
			accessorKey: "date",
			header: "Fecha",
			cell: ({ row }) => (
				<span className="font-medium text-foreground">
					{format(row.original.date, "EEEE, d 'de' MMMM", { locale: es })}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "Estado",
			cell: ({ row }) => {
				const isClosed = row.original.status === CashRegisterStatus.closed;
				return (
					<Badge
						className={cn(
							"flex w-fit items-center gap-1.5 border-none px-2 py-0.5 font-medium text-xs shadow-none",
							isClosed
								? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
								: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
						)}
						variant="outline"
					>
						{isClosed ? (
							<>
								<CheckCircleIcon className="size-3.5" />
								Cerrada
							</>
						) : (
							<>
								<ClockIcon className="size-3.5" />
								Abierta
							</>
						)}
					</Badge>
				);
			},
		},
		{
			accessorKey: "openingBalance",
			header: "Saldo Inicial",
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{formatAmount(row.original.openingBalance)}
				</span>
			),
		},
		{
			accessorKey: "closingBalance",
			header: "Saldo Final",
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{formatAmount(row.original.closingBalance)}
				</span>
			),
		},
		{
			accessorKey: "difference",
			header: "Diferencia",
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
			header: "Abierta por",
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.openedByUser?.name ?? "-"}
				</span>
			),
		},
		{
			accessorKey: "closedByUser",
			header: "Cerrada por",
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.closedByUser?.name ?? "-"}
				</span>
			),
		},
	];

	return (
		<DataTable
			columns={columns}
			data={(data?.registers as CashRegisterRecord[]) || []}
			emptyMessage="No hay historial de caja."
			enablePagination
			loading={isPending}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			totalCount={data?.total ?? 0}
		/>
	);
}
