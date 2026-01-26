"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	BanknoteIcon,
	CheckCircleIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	XCircleIcon,
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
import { PayrollModal } from "@/components/organization/payroll-modal";
import { PayrollPayModal } from "@/components/organization/payroll-pay-modal";
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
	PayrollPeriodTypes,
	type PayrollStaffType,
	PayrollStaffTypes,
	PayrollStatus,
	PayrollStatuses,
} from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { PayrollSortField } from "@/schemas/organization-payroll-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "periodStart", desc: true }];

interface Payroll {
	id: string;
	organizationId: string;
	staffType: string;
	coachId: string | null;
	userId: string | null;
	externalName: string | null;
	externalEmail: string | null;
	periodStart: Date;
	periodEnd: Date;
	periodType: string;
	baseSalary: number;
	bonuses: number;
	deductions: number;
	totalAmount: number;
	currency: string;
	concept: string | null;
	status: string;
	paymentMethod: string | null;
	paymentDate: Date | null;
	notes: string | null;
	createdAt: Date;
	coach?: {
		id: string;
		specialty: string;
		user?: {
			id: string;
			name: string;
			email: string;
		} | null;
	} | null;
	user?: {
		id: string;
		name: string;
		email: string;
	} | null;
}

const statusColors: Record<string, string> = {
	pending:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
	approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
	paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
	cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const statusLabels: Record<string, string> = {
	pending: "Pendiente",
	approved: "Aprobado",
	paid: "Pagado",
	cancelled: "Cancelado",
};

const staffTypeLabels: Record<string, string> = {
	coach: "Coach",
	staff: "Staff",
	external: "Externo",
};

const periodTypeLabels: Record<string, string> = {
	monthly: "Mensual",
	biweekly: "Quincenal",
	weekly: "Semanal",
	event: "Evento",
};

export function PayrollTable(): React.JSX.Element {
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

	const [staffTypeFilter, setStaffTypeFilter] = useQueryState(
		"staffType",
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

	// Build columnFilters from URL state
	const columnFilters: ColumnFiltersState = React.useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (statusFilter && statusFilter.length > 0) {
			filters.push({ id: "status", value: statusFilter });
		}
		if (staffTypeFilter && staffTypeFilter.length > 0) {
			filters.push({ id: "staffType", value: staffTypeFilter });
		}
		return filters;
	}, [statusFilter, staffTypeFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("status"));
		setStaffTypeFilter(getFilterValue("staffType"));

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

	// Build sort params from sorting state
	const sortParams = React.useMemo(() => {
		const fallbackSort = { id: "periodStart", desc: true } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = PayrollSortField.options.includes(
			currentSort.id as (typeof PayrollSortField.options)[number],
		)
			? (currentSort.id as (typeof PayrollSortField.options)[number])
			: "periodStart";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.payroll.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				status: (statusFilter || []) as PayrollStatus[],
				staffType: (staffTypeFilter || []) as PayrollStaffType[],
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deletePayrollMutation = trpc.organization.payroll.delete.useMutation({
		onSuccess: () => {
			toast.success("Liquidacion eliminada");
			utils.organization.payroll.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar");
		},
	});

	const approvePayrollMutation = trpc.organization.payroll.approve.useMutation({
		onSuccess: () => {
			toast.success("Liquidacion aprobada");
			utils.organization.payroll.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Error al aprobar");
		},
	});

	const cancelPayrollMutation = trpc.organization.payroll.cancel.useMutation({
		onSuccess: () => {
			toast.success("Liquidacion cancelada");
			utils.organization.payroll.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Error al cancelar");
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

	const getRecipientName = (row: Payroll): string => {
		if (row.staffType === "coach" && row.coach) {
			return row.coach.user?.name ?? "Coach";
		}
		if (row.staffType === "staff" && row.user) {
			return row.user.name ?? "Staff";
		}
		return row.externalName ?? "Externo";
	};

	const columns: ColumnDef<Payroll>[] = [
		createSelectionColumn<Payroll>(),
		{
			accessorKey: "recipient",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Destinatario" />
			),
			cell: ({ row }) => {
				const name = getRecipientName(row.original);
				return (
					<div className="flex max-w-[200px] flex-col">
						<span className="truncate font-medium" title={name}>
							{name}
						</span>
						<span className="text-muted-foreground text-xs">
							{staffTypeLabels[row.original.staffType] ||
								row.original.staffType}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "period",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Periodo" />
			),
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="text-sm">
						{format(row.original.periodStart, "dd MMM", { locale: es })} -{" "}
						{format(row.original.periodEnd, "dd MMM yyyy", { locale: es })}
					</span>
					<span className="text-muted-foreground text-xs">
						{periodTypeLabels[row.original.periodType] ||
							row.original.periodType}
					</span>
				</div>
			),
		},
		{
			accessorKey: "totalAmount",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Total" />
			),
			cell: ({ row }) => (
				<span className="font-medium">
					$
					{(row.original.totalAmount / 100).toLocaleString("es-AR", {
						minimumFractionDigits: 2,
					})}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Estado" />
			),
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-xs shadow-none",
						statusColors[row.original.status] || "bg-gray-100 dark:bg-gray-800",
					)}
					variant="outline"
				>
					{statusLabels[row.original.status] || capitalize(row.original.status)}
				</Badge>
			),
		},
		{
			accessorKey: "concept",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Concepto" />
			),
			cell: ({ row }) => (
				<span
					className="block max-w-[150px] truncate text-muted-foreground text-sm"
					title={row.original.concept ?? ""}
				>
					{row.original.concept ?? "-"}
				</span>
			),
		},
		{
			id: "actions",
			enableSorting: false,
			cell: ({ row }) => {
				const status = row.original.status;
				const canEdit = status === PayrollStatus.pending;
				const canApprove = status === PayrollStatus.pending;
				const canPay = status === PayrollStatus.approved;
				const canCancel =
					status === PayrollStatus.pending || status === PayrollStatus.approved;
				const canDelete =
					status === PayrollStatus.pending ||
					status === PayrollStatus.cancelled;

				return (
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
								{canEdit && (
									<DropdownMenuItem
										onClick={() => {
											NiceModal.show(PayrollModal, { payroll: row.original });
										}}
									>
										<PencilIcon className="mr-2 size-4" />
										Editar
									</DropdownMenuItem>
								)}
								{canApprove && (
									<DropdownMenuItem
										onClick={() => {
											NiceModal.show(ConfirmationModal, {
												title: "Aprobar liquidacion?",
												message:
													"Esta seguro que desea aprobar esta liquidacion?",
												confirmLabel: "Aprobar",
												onConfirm: () =>
													approvePayrollMutation.mutate({
														id: row.original.id,
													}),
											});
										}}
									>
										<CheckCircleIcon className="mr-2 size-4" />
										Aprobar
									</DropdownMenuItem>
								)}
								{canPay && (
									<DropdownMenuItem
										onClick={() => {
											NiceModal.show(PayrollPayModal, {
												payroll: row.original,
											});
										}}
									>
										<BanknoteIcon className="mr-2 size-4" />
										Registrar Pago
									</DropdownMenuItem>
								)}
								{canCancel && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => {
												NiceModal.show(ConfirmationModal, {
													title: "Cancelar liquidacion?",
													message:
														"Esta seguro que desea cancelar esta liquidacion?",
													confirmLabel: "Cancelar",
													destructive: true,
													onConfirm: () =>
														cancelPayrollMutation.mutate({
															id: row.original.id,
														}),
												});
											}}
											variant="destructive"
										>
											<XCircleIcon className="mr-2 size-4" />
											Cancelar
										</DropdownMenuItem>
									</>
								)}
								{canDelete && (
									<DropdownMenuItem
										onClick={() => {
											NiceModal.show(ConfirmationModal, {
												title: "Eliminar liquidacion?",
												message:
													"Esta seguro que desea eliminar esta liquidacion? Esta accion no se puede deshacer.",
												confirmLabel: "Eliminar",
												destructive: true,
												onConfirm: () =>
													deletePayrollMutation.mutate({
														id: row.original.id,
													}),
											});
										}}
										variant="destructive"
									>
										<Trash2Icon className="mr-2 size-4" />
										Eliminar
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];

	const payrollFilters: FilterConfig[] = [
		{
			key: "status",
			title: "Estado",
			options: PayrollStatuses.map((status) => ({
				value: status,
				label: statusLabels[status] || capitalize(status),
			})),
		},
		{
			key: "staffType",
			title: "Tipo",
			options: PayrollStaffTypes.filter((t) => t !== "staff").map((type) => ({
				value: type,
				label: staffTypeLabels[type] || capitalize(type),
			})),
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.payrolls as Payroll[]) || []}
			emptyMessage="No hay liquidaciones."
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={payrollFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			rowSelection={rowSelection}
			searchPlaceholder="Buscar liquidaciones..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button onClick={() => NiceModal.show(PayrollModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					Nueva Liquidacion
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
