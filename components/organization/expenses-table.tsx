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
	FolderIcon,
	MoreHorizontalIcon,
	PlusIcon,
	StoreIcon,
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
import { ExpensesBulkActions } from "@/components/organization/expenses-bulk-actions";
import { ExpensesModal } from "@/components/organization/expenses-modal";
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
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { ExpenseSortField } from "@/schemas/organization-expense-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: true }];

interface Expense {
	id: string;
	organizationId: string;
	categoryId: string | null;
	amount: number;
	currency: string;
	description: string;
	expenseDate: Date;
	paymentMethod: string | null;
	receiptNumber: string | null;
	vendor: string | null;
	notes: string | null;
	createdAt: Date;
	category: {
		id: string;
		name: string;
		type: string;
	} | null;
	recordedByUser: {
		id: string;
		name: string;
	} | null;
}

const categoryTypeColors: Record<string, string> = {
	operational: "bg-blue-100 dark:bg-blue-900",
	personnel: "bg-purple-100 dark:bg-purple-900",
	other: "bg-gray-100 dark:bg-gray-800",
};

const methodLabels: Record<string, string> = {
	cash: "Efectivo",
	bank_transfer: "Transferencia",
	mercado_pago: "Mercado Pago",
	card: "Tarjeta",
	other: "Otro",
};

export function ExpensesTable(): React.JSX.Element {
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
		if (methodFilter && methodFilter.length > 0) {
			filters.push({ id: "paymentMethod", value: methodFilter });
		}
		return filters;
	}, [methodFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

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
		const sortBy = ExpenseSortField.options.includes(
			currentSort.id as (typeof ExpenseSortField.options)[number],
		)
			? (currentSort.id as (typeof ExpenseSortField.options)[number])
			: "createdAt";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.expense.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				paymentMethod: (methodFilter || []).filter((m) =>
					TrainingPaymentMethods.includes(m as TrainingPaymentMethod),
				) as TrainingPaymentMethod[],
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteExpenseMutation = trpc.organization.expense.delete.useMutation({
		onSuccess: () => {
			toast.success("Gasto eliminado exitosamente");
			utils.organization.expense.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar el gasto");
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

	const columns: ColumnDef<Expense>[] = [
		createSelectionColumn<Expense>(),
		{
			accessorKey: "description",
			header: "Descripcion",
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<span
						className="block max-w-[200px] truncate font-medium text-foreground"
						title={row.original.description}
					>
						{row.original.description}
					</span>
					{row.original.receiptNumber && (
						<span className="text-foreground/70 text-xs">
							#{row.original.receiptNumber}
						</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "category",
			header: "Categoria",
			cell: ({ row }) =>
				row.original.category ? (
					<div className="flex items-center gap-1.5">
						<FolderIcon className="size-4 text-foreground/60" />
						<Badge
							className={cn(
								"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
								categoryTypeColors[row.original.category.type] ||
									"bg-gray-100 dark:bg-gray-800",
							)}
							variant="outline"
						>
							{row.original.category.name}
						</Badge>
					</div>
				) : (
					<span className="text-muted-foreground">Sin categoria</span>
				),
		},
		{
			accessorKey: "amount",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Monto" />
			),
			cell: ({ row }) => (
				<span className="font-medium text-foreground">
					{formatAmount(row.original.amount, row.original.currency)}
				</span>
			),
		},
		{
			accessorKey: "vendor",
			header: "Proveedor",
			cell: ({ row }) =>
				row.original.vendor ? (
					<div className="flex items-center gap-1.5 text-foreground/80">
						<StoreIcon className="size-4" />
						<span className="max-w-[120px] truncate">
							{row.original.vendor}
						</span>
					</div>
				) : (
					<span className="text-muted-foreground">-</span>
				),
		},
		{
			accessorKey: "paymentMethod",
			header: "Metodo",
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
			accessorKey: "expenseDate",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Fecha" />
			),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{format(row.original.expenseDate, "dd MMM, yyyy")}
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
								<span className="sr-only">Abrir menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ExpensesModal, { expense: row.original });
								}}
							>
								Editar
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "Eliminar gasto?",
										message:
											"Estas seguro de eliminar este gasto? Esta accion no se puede deshacer.",
										confirmLabel: "Eliminar",
										destructive: true,
										onConfirm: () =>
											deleteExpenseMutation.mutate({ id: row.original.id }),
									});
								}}
								variant="destructive"
							>
								Eliminar
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const expenseFilters: FilterConfig[] = [
		{
			key: "paymentMethod",
			title: "Metodo",
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
			data={(data?.expenses as Expense[]) || []}
			emptyMessage="No se encontraron gastos."
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={expenseFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			renderBulkActions={(table) => <ExpensesBulkActions table={table} />}
			rowSelection={rowSelection}
			searchPlaceholder="Buscar gastos..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button onClick={() => NiceModal.show(ExpensesModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					Agregar Gasto
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
