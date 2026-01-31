"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	BanknoteIcon,
	CalendarIcon,
	FileTextIcon,
	LayersIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsJson,
	parseAsString,
	useQueryState,
} from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { PaymentsBulkActions } from "@/components/organization/payments-bulk-actions";
import { PaymentsModal } from "@/components/organization/payments-modal";
import { PaymentReceiptModal } from "@/components/organization/receipt-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	createSelectionColumn,
	DataTable,
	type FilterConfig,
	SortableColumnHeader,
} from "@/components/ui/custom/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appConfig } from "@/config/app.config";
import {
	type TrainingPaymentMethod,
	TrainingPaymentMethods,
	type TrainingPaymentStatus,
	TrainingPaymentStatuses,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { TrainingPaymentSortField } from "@/schemas/organization-training-payment-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: true }];

interface TrainingPayment {
	id: string;
	organizationId: string;
	sessionId: string | null;
	athleteId: string | null;
	amount: number;
	currency: string;
	status: string;
	paymentMethod: string | null;
	paidAmount: number;
	paymentDate: Date | null;
	receiptNumber: string | null;
	description: string | null;
	notes: string | null;
	receiptImageKey: string | null;
	createdAt: Date;
	session: {
		id: string;
		title: string;
	} | null;
	// Linked sessions for package payments
	sessions: {
		id: string;
		session: {
			id: string;
			title: string;
			startTime: Date;
		};
	}[];
	athlete: {
		id: string;
		user: {
			id: string;
			name: string;
		} | null;
	} | null;
}

const statusColors: Record<string, string> = {
	pending: "bg-yellow-100 dark:bg-yellow-900",
	paid: "bg-green-100 dark:bg-green-900",
	partial: "bg-blue-100 dark:bg-blue-900",
	cancelled: "bg-gray-100 dark:bg-gray-800",
};

const methodKeys: Record<string, string> = {
	cash: "cash",
	bank_transfer: "bankTransfer",
	mercado_pago: "mercadoPago",
	card: "card",
	other: "other",
};

export function PaymentsTable(): React.JSX.Element {
	const t = useTranslations("finance.payments");
	const [rowSelection, setRowSelection] = React.useState({});

	const [searchQuery, setSearchQuery] = useQueryState(
		"query",
		parseAsString.withDefault("").withOptions({
			shallow: true,
		}),
	);

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

	const [statusFilter, setStatusFilter] = useQueryState(
		"status",
		parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			shallow: true,
		}),
	);

	const [methodFilter, setMethodFilter] = useQueryState(
		"method",
		parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			shallow: true,
		}),
	);

	const [sorting, setSorting] = useQueryState<SortingState>(
		"sort",
		parseAsJson<SortingState>((value) => {
			if (!Array.isArray(value)) return DEFAULT_SORTING;
			return value.filter(
				(item) =>
					item &&
					typeof item === "object" &&
					"id" in item &&
					typeof item.desc === "boolean",
			) as SortingState;
		})
			.withDefault(DEFAULT_SORTING)
			.withOptions({ shallow: true }),
	);

	const utils = trpc.useUtils();

	const columnFilters: ColumnFiltersState = React.useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (statusFilter && statusFilter.length > 0) {
			filters.push({ id: "status", value: statusFilter });
		}
		if (methodFilter && methodFilter.length > 0) {
			filters.push({ id: "paymentMethod", value: methodFilter });
		}
		return filters;
	}, [statusFilter, methodFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("status"));
		setMethodFilter(getFilterValue("paymentMethod"));

		if (pageIndex !== 0) {
			setPageIndex(0);
		}
	};

	const handleSortingChange = (newSorting: SortingState): void => {
		setSorting(newSorting.length > 0 ? newSorting : DEFAULT_SORTING);
		if (pageIndex !== 0) {
			setPageIndex(0);
		}
	};

	const sortParams = React.useMemo(() => {
		const fallbackSort = { id: "createdAt", desc: true } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = TrainingPaymentSortField.options.includes(
			currentSort.id as TrainingPaymentSortField,
		)
			? (currentSort.id as TrainingPaymentSortField)
			: "createdAt";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.trainingPayment.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				status: (statusFilter || []).filter((s) =>
					TrainingPaymentStatuses.includes(s as TrainingPaymentStatus),
				) as TrainingPaymentStatus[],
				paymentMethod: (methodFilter || []).filter((m) =>
					TrainingPaymentMethods.includes(m as TrainingPaymentMethod),
				) as TrainingPaymentMethod[],
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deletePaymentMutation =
		trpc.organization.trainingPayment.delete.useMutation({
			onSuccess: () => {
				toast.success(t("success.deleted"));
				utils.organization.trainingPayment.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || t("error.deleteFailed"));
			},
		});

	const handleSearchQueryChange = (value: string): void => {
		if (value !== searchQuery) {
			setSearchQuery(value);
			if (pageIndex !== 0) {
				setPageIndex(0);
			}
		}
	};

	const formatAmount = (amount: number, currency: string) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: currency,
		}).format(amount / 100);
	};

	const columns: ColumnDef<TrainingPayment>[] = [
		createSelectionColumn<TrainingPayment>(),
		{
			accessorKey: "description",
			header: t("table.description"),
			cell: ({ row }) => (
				<span
					className="block max-w-[200px] truncate font-medium text-foreground"
					title={row.original.description ?? t("table.defaultDescription")}
				>
					{row.original.description || t("table.defaultDescription")}
				</span>
			),
		},
		{
			id: "athleteSession",
			header: t("table.athlete"),
			cell: ({ row }) => {
				const { athlete, session, sessions } = row.original;
				const linkedSessionsCount = sessions?.length ?? 0;
				const hasLinkedSessions = linkedSessionsCount > 0;

				if (!athlete && !session && !hasLinkedSessions) {
					return <span className="text-muted-foreground">-</span>;
				}
				return (
					<div className="flex flex-col gap-0.5">
						{athlete && (
							<Link
								href={`/dashboard/organization/athletes/${athlete.id}`}
								className="flex items-center gap-1.5 text-foreground/80 hover:text-foreground hover:underline"
							>
								<UserIcon className="size-3.5 shrink-0" />
								<span className="max-w-[140px] truncate">
									{athlete.user?.name ?? t("table.unknown")}
								</span>
							</Link>
						)}
						{/* Show package indicator if multiple sessions */}
						{hasLinkedSessions ? (
							<div className="flex items-center gap-1.5 text-foreground/60 text-xs">
								<LayersIcon className="size-3 shrink-0" />
								<span>
									{t("table.sessionsCount", { count: linkedSessionsCount })}
								</span>
							</div>
						) : (
							session && (
								<Link
									href={`/dashboard/organization/training-sessions/${session.id}`}
									className="flex items-center gap-1.5 text-foreground/60 text-xs hover:text-foreground hover:underline"
								>
									<CalendarIcon className="size-3 shrink-0" />
									<span className="max-w-[140px] truncate">
										{session.title}
									</span>
								</Link>
							)
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "amount",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.amount")} />
			),
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<span className="font-medium text-foreground">
						{formatAmount(row.original.amount, row.original.currency)}
					</span>
					{row.original.status === "partial" && (
						<span className="text-foreground/70 text-xs">
							{t("table.paidLabel")}{" "}
							{formatAmount(row.original.paidAmount, row.original.currency)}
						</span>
					)}
					{row.original.paymentMethod && (
						<span className="flex items-center gap-1 text-foreground/60 text-xs">
							<BanknoteIcon className="size-3 shrink-0" />
							{t(
								`methods.${methodKeys[row.original.paymentMethod] ?? row.original.paymentMethod}`,
							)}
						</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.status")} />
			),
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
						statusColors[row.original.status] || "bg-gray-100 dark:bg-gray-800",
					)}
					variant="outline"
				>
					{t(`status.${row.original.status}`)}
				</Badge>
			),
		},
		{
			accessorKey: "paymentDate",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.date")} />
			),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.paymentDate
						? format(row.original.paymentDate, "dd MMM, yyyy")
						: "-"}
				</span>
			),
		},
		{
			id: "actions",
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
								<span className="sr-only">{t("table.openMenu")}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(PaymentsModal, { payment: row.original });
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								{t("edit")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(PaymentReceiptModal, {
										paymentId: row.original.id,
										hasReceipt: !!row.original.receiptImageKey,
									});
								}}
							>
								<FileTextIcon className="mr-2 size-4" />
								{t("receipt.manage")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: t("deleteConfirm.title"),
										message: t("deleteConfirm.message"),
										confirmLabel: t("deleteConfirm.confirm"),
										destructive: true,
										onConfirm: () =>
											deletePaymentMutation.mutate({ id: row.original.id }),
									});
								}}
								variant="destructive"
							>
								<Trash2Icon className="mr-2 size-4" />
								{t("delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const paymentFilters: FilterConfig[] = [
		{
			key: "status",
			title: t("table.status"),
			options: TrainingPaymentStatuses.map((status) => ({
				value: status,
				label: t(`status.${status}`),
			})),
		},
		{
			key: "paymentMethod",
			title: t("table.method"),
			options: TrainingPaymentMethods.map((method) => ({
				value: method,
				label: t(`methods.${methodKeys[method] ?? method}`),
			})),
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.payments as TrainingPayment[]) || []}
			emptyMessage={t("table.noPayments")}
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={paymentFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			renderBulkActions={(table) => <PaymentsBulkActions table={table} />}
			rowSelection={rowSelection}
			searchPlaceholder={t("search")}
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button onClick={() => NiceModal.show(PaymentsModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					{t("add")}
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
