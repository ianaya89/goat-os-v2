"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	CheckIcon,
	ClockIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	UsersIcon,
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
import { WaitlistBulkActions } from "@/components/organization/waitlist-bulk-actions";
import { WaitlistModal } from "@/components/organization/waitlist-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
	DayOfWeek,
	WaitlistEntryStatus,
	WaitlistPriority,
	WaitlistReferenceType,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { WaitlistSortField } from "@/schemas/organization-waitlist-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: true }];

interface WaitlistEntry {
	id: string;
	organizationId: string;
	athleteId: string;
	referenceType: WaitlistReferenceType;
	preferredDays: DayOfWeek[] | null;
	preferredStartTime: string | null;
	preferredEndTime: string | null;
	athleteGroupId: string | null;
	priority: WaitlistPriority;
	status: WaitlistEntryStatus;
	reason: string | null;
	notes: string | null;
	position: number | null;
	assignedAt: Date | null;
	expiresAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	athlete: {
		id: string;
		user: {
			id: string;
			name: string;
			email: string;
			image: string | null;
		} | null;
	};
	athleteGroup: {
		id: string;
		name: string;
	} | null;
	createdByUser: {
		id: string;
		name: string;
	} | null;
	assignedByUser: {
		id: string;
		name: string;
	} | null;
}

const dayLabels: Record<DayOfWeek, string> = {
	[DayOfWeek.monday]: "Lun",
	[DayOfWeek.tuesday]: "Mar",
	[DayOfWeek.wednesday]: "Mie",
	[DayOfWeek.thursday]: "Jue",
	[DayOfWeek.friday]: "Vie",
	[DayOfWeek.saturday]: "Sab",
	[DayOfWeek.sunday]: "Dom",
};

const priorityColors: Record<WaitlistPriority, string> = {
	[WaitlistPriority.high]:
		"bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
	[WaitlistPriority.medium]:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
	[WaitlistPriority.low]:
		"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusColors: Record<WaitlistEntryStatus, string> = {
	[WaitlistEntryStatus.waiting]:
		"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
	[WaitlistEntryStatus.assigned]:
		"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
	[WaitlistEntryStatus.cancelled]:
		"bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
	[WaitlistEntryStatus.expired]:
		"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const priorityLabels: Record<WaitlistPriority, string> = {
	[WaitlistPriority.high]: "Alta",
	[WaitlistPriority.medium]: "Media",
	[WaitlistPriority.low]: "Baja",
};

const statusLabels: Record<WaitlistEntryStatus, string> = {
	[WaitlistEntryStatus.waiting]: "En espera",
	[WaitlistEntryStatus.assigned]: "Asignado",
	[WaitlistEntryStatus.cancelled]: "Cancelado",
	[WaitlistEntryStatus.expired]: "Expirado",
};

const referenceTypeLabels: Record<WaitlistReferenceType, string> = {
	[WaitlistReferenceType.schedule]: "Horario",
	[WaitlistReferenceType.athleteGroup]: "Grupo",
};

export function WaitlistTable(): React.JSX.Element {
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

	const [priorityFilter, setPriorityFilter] = useQueryState(
		"priority",
		parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			shallow: true,
		}),
	);

	const [referenceTypeFilter, setReferenceTypeFilter] = useQueryState(
		"referenceType",
		parseAsString.withDefault("").withOptions({
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
		if (priorityFilter && priorityFilter.length > 0) {
			filters.push({ id: "priority", value: priorityFilter });
		}
		if (referenceTypeFilter) {
			filters.push({ id: "referenceType", value: [referenceTypeFilter] });
		}
		return filters;
	}, [statusFilter, priorityFilter, referenceTypeFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("status"));
		setPriorityFilter(getFilterValue("priority"));
		const refType = getFilterValue("referenceType");
		setReferenceTypeFilter(refType[0] || "");

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
		const fallbackSort = { id: "createdAt", desc: true } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = WaitlistSortField.options.includes(
			currentSort.id as WaitlistSortField,
		)
			? (currentSort.id as WaitlistSortField)
			: "createdAt";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.waitlist.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				status: statusFilter?.length
					? (statusFilter as WaitlistEntryStatus[])
					: undefined,
				priority: priorityFilter?.length
					? (priorityFilter as WaitlistPriority[])
					: undefined,
				referenceType: referenceTypeFilter
					? (referenceTypeFilter as WaitlistReferenceType)
					: undefined,
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteMutation = trpc.organization.waitlist.delete.useMutation({
		onSuccess: () => {
			toast.success("Entrada cancelada exitosamente");
			utils.organization.waitlist.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Error al cancelar entrada");
		},
	});

	const assignMutation = trpc.organization.waitlist.assign.useMutation({
		onSuccess: () => {
			toast.success("Atleta asignado exitosamente");
			utils.organization.waitlist.list.invalidate();
			utils.organization.athleteGroup.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Error al asignar atleta");
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

	const columns: ColumnDef<WaitlistEntry>[] = [
		createSelectionColumn<WaitlistEntry>(),
		{
			accessorKey: "athlete",
			header: "Atleta",
			cell: ({ row }) => {
				const user = row.original.athlete.user;
				return (
					<div className="flex items-center gap-2">
						<Avatar className="size-8">
							<AvatarImage src={user?.image ?? undefined} />
							<AvatarFallback>
								{user?.name?.charAt(0).toUpperCase() ?? "A"}
							</AvatarFallback>
						</Avatar>
						<span
							className="block max-w-[150px] truncate font-medium text-foreground"
							title={user?.name ?? ""}
						>
							{user?.name ?? "Sin nombre"}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "referenceType",
			header: "Tipo",
			cell: ({ row }) => (
				<Badge
					className="border-none px-2 py-0.5 font-medium text-xs shadow-none"
					variant="outline"
				>
					{row.original.referenceType === WaitlistReferenceType.schedule ? (
						<>
							<ClockIcon className="mr-1 size-3" />
							{referenceTypeLabels[row.original.referenceType]}
						</>
					) : (
						<>
							<UsersIcon className="mr-1 size-3" />
							{referenceTypeLabels[row.original.referenceType]}
						</>
					)}
				</Badge>
			),
		},
		{
			id: "reference",
			header: "Preferencia",
			cell: ({ row }) => {
				if (row.original.referenceType === WaitlistReferenceType.schedule) {
					const days = row.original.preferredDays;
					const startTime = row.original.preferredStartTime;
					const endTime = row.original.preferredEndTime;

					const daysText = days?.map((d) => dayLabels[d]).join(", ") ?? "-";
					const timeText =
						startTime && endTime ? `${startTime} - ${endTime}` : "";

					const fullText = timeText ? `${daysText} (${timeText})` : daysText;

					return (
						<span
							className="block max-w-[180px] truncate text-foreground/80"
							title={fullText}
						>
							{fullText}
						</span>
					);
				}
				if (row.original.athleteGroup) {
					return (
						<span
							className="block max-w-[180px] truncate text-foreground/80"
							title={row.original.athleteGroup.name}
						>
							{row.original.athleteGroup.name}
						</span>
					);
				}
				return <span className="text-muted-foreground">-</span>;
			},
		},
		{
			accessorKey: "priority",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Prioridad" />
			),
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-xs shadow-none",
						priorityColors[row.original.priority],
					)}
					variant="outline"
				>
					{priorityLabels[row.original.priority]}
				</Badge>
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
						statusColors[row.original.status],
					)}
					variant="outline"
				>
					{statusLabels[row.original.status]}
				</Badge>
			),
		},
		{
			accessorKey: "reason",
			header: "Motivo",
			cell: ({ row }) => (
				<span
					className="block max-w-[150px] truncate text-foreground/80"
					title={row.original.reason ?? ""}
				>
					{row.original.reason || "-"}
				</span>
			),
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Fecha" />
			),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{format(row.original.createdAt, "dd MMM, yyyy")}
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
									NiceModal.show(WaitlistModal, { entry: row.original });
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								Editar
							</DropdownMenuItem>
							{row.original.status === WaitlistEntryStatus.waiting && (
								<>
									<DropdownMenuItem
										onClick={() => {
											const targetName =
												row.original.referenceType ===
												WaitlistReferenceType.schedule
													? `horario preferido (${row.original.preferredDays?.map((d) => dayLabels[d]).join(", ") ?? "dias"})`
													: (row.original.athleteGroup?.name ??
														"la referencia");
											NiceModal.show(ConfirmationModal, {
												title: "Asignar atleta?",
												message: `Se asignara a ${row.original.athlete.user?.name ?? "el atleta"} a ${targetName}. Esta seguro?`,
												confirmLabel: "Asignar",
												onConfirm: () =>
													assignMutation.mutate({ id: row.original.id }),
											});
										}}
									>
										<CheckIcon className="mr-2 size-4" />
										Asignar
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => {
											NiceModal.show(ConfirmationModal, {
												title: "Cancelar entrada?",
												message:
													"Esta seguro que desea cancelar esta entrada de la lista de espera?",
												confirmLabel: "Cancelar",
												destructive: true,
												onConfirm: () =>
													deleteMutation.mutate({ id: row.original.id }),
											});
										}}
										variant="destructive"
									>
										<XCircleIcon className="mr-2 size-4" />
										Cancelar
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const waitlistFilters: FilterConfig[] = [
		{
			key: "status",
			title: "Estado",
			options: [
				{ value: WaitlistEntryStatus.waiting, label: "En espera" },
				{ value: WaitlistEntryStatus.assigned, label: "Asignado" },
				{ value: WaitlistEntryStatus.cancelled, label: "Cancelado" },
				{ value: WaitlistEntryStatus.expired, label: "Expirado" },
			],
		},
		{
			key: "priority",
			title: "Prioridad",
			options: [
				{ value: WaitlistPriority.high, label: "Alta" },
				{ value: WaitlistPriority.medium, label: "Media" },
				{ value: WaitlistPriority.low, label: "Baja" },
			],
		},
		{
			key: "referenceType",
			title: "Tipo",
			options: [
				{ value: WaitlistReferenceType.schedule, label: "Horario" },
				{ value: WaitlistReferenceType.athleteGroup, label: "Grupo" },
			],
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.entries as WaitlistEntry[]) || []}
			emptyMessage="No hay entradas en la lista de espera."
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={waitlistFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			renderBulkActions={(table) => <WaitlistBulkActions table={table} />}
			rowSelection={rowSelection}
			searchPlaceholder="Buscar por atleta..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button onClick={() => NiceModal.show(WaitlistModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					Agregar
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
