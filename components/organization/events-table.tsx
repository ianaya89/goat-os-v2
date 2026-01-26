"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import {
	ClipboardListIcon,
	CopyIcon,
	EyeIcon,
	FileTextIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { SaveAsTemplateModal } from "@/components/organization/save-as-template-modal";
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
import { Progress } from "@/components/ui/progress";
import { appConfig } from "@/config/app.config";
import {
	type EventStatus,
	EventStatuses,
	type EventType,
	EventTypes,
} from "@/lib/db/schema/enums";
import {
	formatEventCapacity,
	formatEventDateRange,
	getCapacityPercentage,
	getEventStatusColor,
	getEventStatusLabel,
	getEventTypeColor,
	getEventTypeIcon,
	getEventTypeLabel,
} from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { EventSortField } from "@/schemas/organization-sports-event-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "startDate", desc: false }];

interface SportsEvent {
	id: string;
	organizationId: string;
	title: string;
	slug: string;
	description: string | null;
	eventType: string;
	status: string;
	startDate: Date;
	endDate: Date;
	registrationOpenDate: Date | null;
	registrationCloseDate: Date | null;
	locationId: string | null;
	venueDetails: string | null;
	maxCapacity: number | null;
	currentRegistrations: number;
	enableWaitlist: boolean;
	maxWaitlistSize: number | null;
	allowPublicRegistration: boolean;
	allowEarlyAccessForMembers: boolean;
	memberEarlyAccessDays: number | null;
	requiresApproval: boolean;
	currency: string;
	acceptedPaymentMethods: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	coverImageUrl: string | null;
	createdBy: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export function EventsTable(): React.JSX.Element {
	const router = useRouter();
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

	const [eventTypeFilter, setEventTypeFilter] = useQueryState(
		"eventType",
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
		if (eventTypeFilter && eventTypeFilter.length > 0) {
			filters.push({ id: "eventType", value: eventTypeFilter });
		}
		return filters;
	}, [statusFilter, eventTypeFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("status"));
		setEventTypeFilter(getFilterValue("eventType"));

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
		const fallbackSort = { id: "startDate", desc: false } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = EventSortField.options.includes(
			currentSort.id as EventSortField,
		)
			? (currentSort.id as EventSortField)
			: "startDate";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.sportsEvent.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || undefined,
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				status: (statusFilter || []) as EventStatus[],
				eventType: (eventTypeFilter || []) as EventType[],
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteEventMutation = trpc.organization.sportsEvent.delete.useMutation({
		onSuccess: () => {
			toast.success("Evento eliminado");
			utils.organization.sportsEvent.list.invalidate();
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message || "Error al eliminar el evento");
		},
	});

	const duplicateEventMutation =
		trpc.organization.sportsEvent.duplicate.useMutation({
			onSuccess: () => {
				toast.success("Evento duplicado");
				utils.organization.sportsEvent.list.invalidate();
			},
			onError: (error: { message?: string }) => {
				toast.error(error.message || "Error al duplicar el evento");
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

	const columns: ColumnDef<SportsEvent>[] = [
		createSelectionColumn<SportsEvent>(),
		{
			accessorKey: "title",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Título" />
			),
			cell: ({ row }) => {
				const TypeIcon = getEventTypeIcon(row.original.eventType as EventType);
				return (
					<div className="flex items-center gap-2 max-w-[280px]">
						<TypeIcon className="size-4 shrink-0 text-muted-foreground" />
						<Link
							href={`/dashboard/organization/events/${row.original.id}`}
							className="truncate font-medium text-foreground hover:underline"
							title={row.original.title}
						>
							{row.original.title}
						</Link>
					</div>
				);
			},
		},
		{
			accessorKey: "eventType",
			header: "Tipo",
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-xs shadow-none",
						getEventTypeColor(row.original.eventType as EventType),
					)}
					variant="outline"
				>
					{getEventTypeLabel(row.original.eventType as EventType)}
				</Badge>
			),
		},
		{
			accessorKey: "startDate",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Fechas" />
			),
			cell: ({ row }) => (
				<span className="text-foreground/80 whitespace-nowrap">
					{formatEventDateRange(row.original.startDate, row.original.endDate)}
				</span>
			),
		},
		{
			id: "capacity",
			header: "Capacidad",
			cell: ({ row }) => {
				const percentage = getCapacityPercentage(
					row.original.currentRegistrations,
					row.original.maxCapacity,
				);
				return (
					<div className="min-w-[100px] space-y-1">
						<span className="text-foreground/80 text-sm">
							{formatEventCapacity(
								row.original.currentRegistrations,
								row.original.maxCapacity,
							)}
						</span>
						{row.original.maxCapacity && (
							<Progress value={percentage} className="h-1.5" />
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Estado" />
			),
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-xs shadow-none whitespace-nowrap",
						getEventStatusColor(row.original.status as EventStatus),
					)}
					variant="outline"
				>
					{getEventStatusLabel(row.original.status as EventStatus)}
				</Badge>
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
								<span className="sr-only">Abrir menú</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link
									href={`/dashboard/organization/events/${row.original.id}`}
								>
									<EyeIcon className="mr-2 size-4" />
									Ver detalle
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link
									href={`/dashboard/organization/events/${row.original.id}/edit`}
								>
									<PencilIcon className="mr-2 size-4" />
									Editar
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link
									href={`/dashboard/organization/events/${row.original.id}/organization`}
								>
									<ClipboardListIcon className="mr-2 size-4" />
									Organización
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									const now = new Date();
									const newTitle = `${row.original.title} (Copia)`;
									const newSlug = `${row.original.slug}-copia-${now.getTime()}`;
									NiceModal.show(ConfirmationModal, {
										title: "¿Duplicar evento?",
										message:
											"Se creará una copia del evento con las mismas configuraciones, pero sin inscripciones.",
										confirmLabel: "Duplicar",
										onConfirm: () =>
											duplicateEventMutation.mutate({
												id: row.original.id,
												newTitle,
												newSlug,
												newStartDate: row.original.startDate,
												newEndDate: row.original.endDate,
											}),
									});
								}}
							>
								<CopyIcon className="mr-2 size-4" />
								Duplicar
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(SaveAsTemplateModal, {
										eventId: row.original.id,
										eventTitle: row.original.title,
									});
								}}
							>
								<FileTextIcon className="mr-2 size-4" />
								Guardar como Template
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "¿Eliminar evento?",
										message:
											"¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer y eliminará todas las inscripciones asociadas.",
										confirmLabel: "Eliminar",
										destructive: true,
										onConfirm: () =>
											deleteEventMutation.mutate({ id: row.original.id }),
									});
								}}
								variant="destructive"
							>
								<Trash2Icon className="mr-2 size-4" />
								Eliminar
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const eventFilters: FilterConfig[] = [
		{
			key: "status",
			title: "Estado",
			options: EventStatuses.map((status) => ({
				value: status,
				label: getEventStatusLabel(status as EventStatus),
			})),
		},
		{
			key: "eventType",
			title: "Tipo",
			options: EventTypes.map((type) => ({
				value: type,
				label: getEventTypeLabel(type as EventType),
			})),
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.events as SportsEvent[]) || []}
			emptyMessage="No hay eventos."
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={eventFilters}
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
			searchPlaceholder="Buscar eventos..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button
					onClick={() => router.push("/dashboard/organization/events/new")}
					size="sm"
				>
					<PlusIcon className="size-4 shrink-0" />
					Nuevo Evento
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
