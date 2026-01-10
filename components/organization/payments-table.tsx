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
	MoreHorizontalIcon,
	PlusIcon,
	UserIcon,
} from "lucide-react";
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
	TrainingPaymentMethod,
	TrainingPaymentMethods,
	TrainingPaymentStatus,
	TrainingPaymentStatuses,
} from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
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
	createdAt: Date;
	session: {
		id: string;
		title: string;
	} | null;
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

const methodLabels: Record<string, string> = {
	cash: "Cash",
	bank_transfer: "Bank Transfer",
	mercado_pago: "Mercado Pago",
	card: "Card",
	other: "Other",
};

export function PaymentsTable(): React.JSX.Element {
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
				toast.success("Payment deleted successfully");
				utils.organization.trainingPayment.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to delete payment");
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
			header: "Description",
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<span
						className="block max-w-[200px] truncate font-medium text-foreground"
						title={row.original.description ?? "Payment"}
					>
						{row.original.description || "Payment"}
					</span>
					{row.original.session && (
						<span className="text-foreground/70 text-xs">
							{row.original.session.title}
						</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "athlete",
			header: "Athlete",
			cell: ({ row }) =>
				row.original.athlete ? (
					<div className="flex items-center gap-1.5 text-foreground/80">
						<UserIcon className="size-4" />
						<span className="max-w-[120px] truncate">
							{row.original.athlete.user?.name ?? "Unknown"}
						</span>
					</div>
				) : (
					<span className="text-muted-foreground">-</span>
				),
		},
		{
			accessorKey: "amount",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Amount" />
			),
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<span className="font-medium text-foreground">
						{formatAmount(row.original.amount, row.original.currency)}
					</span>
					{row.original.status === "partial" && (
						<span className="text-foreground/70 text-xs">
							Paid: {formatAmount(row.original.paidAmount, row.original.currency)}
						</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "paymentMethod",
			header: "Method",
			cell: ({ row }) =>
				row.original.paymentMethod ? (
					<div className="flex items-center gap-1.5 text-foreground/80">
						<BanknoteIcon className="size-4" />
						<span>
							{methodLabels[row.original.paymentMethod] ??
								row.original.paymentMethod}
						</span>
					</div>
				) : (
					<span className="text-muted-foreground">-</span>
				),
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Status" />
			),
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
						statusColors[row.original.status] || "bg-gray-100 dark:bg-gray-800",
					)}
					variant="outline"
				>
					{capitalize(row.original.status)}
				</Badge>
			),
		},
		{
			accessorKey: "paymentDate",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Date" />
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
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(PaymentsModal, { payment: row.original });
								}}
							>
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "Delete payment?",
										message:
											"Are you sure you want to delete this payment? This action cannot be undone.",
										confirmLabel: "Delete",
										destructive: true,
										onConfirm: () =>
											deletePaymentMutation.mutate({ id: row.original.id }),
									});
								}}
								variant="destructive"
							>
								Delete
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
			title: "Status",
			options: TrainingPaymentStatuses.map((status) => ({
				value: status,
				label: capitalize(status),
			})),
		},
		{
			key: "paymentMethod",
			title: "Method",
			options: TrainingPaymentMethods.map((method) => ({
				value: method,
				label: methodLabels[method] ?? method,
			})),
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.payments as TrainingPayment[]) || []}
			emptyMessage="No payments found."
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
			searchPlaceholder="Search payments..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button onClick={() => NiceModal.show(PaymentsModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					Add Payment
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
