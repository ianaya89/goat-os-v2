"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { format } from "date-fns";
import {
	FileTextIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	StoreIcon,
	Trash2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryState,
} from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { ExpenseCategoryBadge } from "@/components/organization/expense-category-badge";
import { ExpensesModal } from "@/components/organization/expenses-modal";
import { ExpenseReceiptModal } from "@/components/organization/receipt-modal";
import { Button } from "@/components/ui/button";
import {
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
	ExpenseCategories,
	type ExpenseCategory,
	type TrainingPaymentMethod,
	TrainingPaymentMethods,
} from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

const methodKeys: Record<string, string> = {
	cash: "cash",
	bank_transfer: "bankTransfer",
	mercado_pago: "mercadoPago",
	card: "card",
	other: "other",
};

interface Expense {
	id: string;
	organizationId: string;
	categoryId: string | null;
	category: string | null;
	amount: number;
	currency: string;
	description: string;
	expenseDate: Date;
	paymentMethod: string | null;
	receiptNumber: string | null;
	receiptImageKey: string | null;
	vendor: string | null;
	notes: string | null;
	eventId: string | null;
	createdAt: Date;
}

interface EventExpensesTableProps {
	eventId: string;
}

export function EventExpensesTable({
	eventId,
}: EventExpensesTableProps): React.JSX.Element {
	const t = useTranslations("finance.expenses");

	const [pageIndex, setPageIndex] = useQueryState(
		"expPageIndex",
		parseAsInteger.withDefault(0).withOptions({ shallow: true }),
	);

	const [pageSize, setPageSize] = useQueryState(
		"expPageSize",
		parseAsInteger
			.withDefault(appConfig.pagination.defaultLimit)
			.withOptions({ shallow: true }),
	);

	const [categoryFilter, setCategoryFilter] = useQueryState(
		"expCategory",
		parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({ shallow: true }),
	);

	const [methodFilter, setMethodFilter] = useQueryState(
		"expMethod",
		parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({ shallow: true }),
	);

	const utils = trpc.useUtils();

	const { data, isPending } = trpc.organization.expense.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			filters: {
				eventId,
				category:
					categoryFilter && categoryFilter.length > 0
						? (categoryFilter.filter((c) =>
								ExpenseCategories.includes(c as ExpenseCategory),
							) as ExpenseCategory[])
						: undefined,
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
			toast.success(t("success.deleted"));
			utils.organization.expense.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || t("error.deleteFailed"));
		},
	});

	const columnFilters: ColumnFiltersState = React.useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (categoryFilter && categoryFilter.length > 0) {
			filters.push({ id: "category", value: categoryFilter });
		}
		if (methodFilter && methodFilter.length > 0) {
			filters.push({ id: "paymentMethod", value: methodFilter });
		}
		return filters;
	}, [categoryFilter, methodFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setCategoryFilter(getFilterValue("category"));
		setMethodFilter(getFilterValue("paymentMethod"));

		if (pageIndex !== 0) {
			setPageIndex(0);
		}
	};

	const formatAmount = (amount: number, currency: string) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: currency,
		}).format(amount / 100);
	};

	const columns: ColumnDef<Expense>[] = [
		{
			accessorKey: "description",
			header: t("table.description"),
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
			header: t("table.category"),
			cell: ({ row }) =>
				row.original.category ? (
					<ExpenseCategoryBadge
						category={row.original.category}
						name={t(`categories.${row.original.category}`)}
					/>
				) : (
					<span className="text-muted-foreground">{t("table.noCategory")}</span>
				),
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
					{row.original.paymentMethod && (
						<span className="text-foreground/60 text-xs">
							{t(
								`methods.${methodKeys[row.original.paymentMethod] ?? row.original.paymentMethod}`,
							)}
						</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "vendor",
			header: t("table.vendor"),
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
			accessorKey: "expenseDate",
			header: t("table.date"),
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
								<span className="sr-only">{t("table.openMenu")}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ExpensesModal, {
										expense: row.original,
										fixedEventId: eventId,
									});
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								{t("edit")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ExpenseReceiptModal, {
										expenseId: row.original.id,
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
											deleteExpenseMutation.mutate({ id: row.original.id }),
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

	const expenseFilters: FilterConfig[] = [
		{
			key: "category",
			title: t("table.category"),
			options: ExpenseCategories.map((cat) => ({
				value: cat,
				label: t(`categories.${cat}`),
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
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button
					onClick={() =>
						NiceModal.show(ExpensesModal, { fixedEventId: eventId })
					}
					size="sm"
				>
					<PlusIcon className="size-4 shrink-0" />
					{t("add")}
				</Button>
			</div>

			<DataTable
				columnFilters={columnFilters}
				columns={columns}
				data={(data?.expenses as Expense[]) || []}
				emptyMessage={t("table.noExpenses")}
				enableFilters
				enablePagination
				filters={expenseFilters}
				loading={isPending}
				onFiltersChange={handleFiltersChange}
				onPageIndexChange={setPageIndex}
				onPageSizeChange={setPageSize}
				pageIndex={pageIndex || 0}
				pageSize={pageSize || appConfig.pagination.defaultLimit}
				totalCount={data?.total ?? 0}
			/>
		</div>
	);
}
