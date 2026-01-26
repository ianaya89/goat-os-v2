"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { FileTextIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
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
import { type EventType, EventTypes } from "@/lib/db/schema/enums";
import {
	getEventTypeColor,
	getEventTypeIcon,
	getEventTypeLabel,
} from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { TemplateSortField } from "@/schemas/organization-event-template-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "usageCount", desc: true }];

interface EventTemplate {
	id: string;
	organizationId: string;
	name: string;
	description: string | null;
	category: string | null;
	isActive: boolean;
	usageCount: number;
	eventType: string;
	defaultTitle: string | null;
	defaultDescription: string | null;
	defaultDurationDays: number | null;
	maxCapacity: number | null;
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
	templateData: string | null;
	sourceEventId: string | null;
	createdBy: string | null;
	createdAt: Date;
	updatedAt: Date;
	sourceEvent?: {
		id: string;
		title: string;
		slug: string;
	} | null;
	createdByUser?: {
		id: string;
		name: string | null;
		image: string | null;
	} | null;
}

export function EventTemplatesTable(): React.JSX.Element {
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
		if (eventTypeFilter && eventTypeFilter.length > 0) {
			filters.push({ id: "eventType", value: eventTypeFilter });
		}
		return filters;
	}, [eventTypeFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

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
		const fallbackSort = { id: "usageCount", desc: true } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = TemplateSortField.options.includes(
			currentSort.id as TemplateSortField,
		)
			? (currentSort.id as TemplateSortField)
			: "usageCount";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.eventTemplate.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || undefined,
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			eventType: (eventTypeFilter?.[0] as EventType) || undefined,
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteTemplateMutation =
		trpc.organization.eventTemplate.delete.useMutation({
			onSuccess: () => {
				toast.success("Template eliminado");
				utils.organization.eventTemplate.list.invalidate();
			},
			onError: (error: { message?: string }) => {
				toast.error(error.message || "Error al eliminar el template");
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

	const columns: ColumnDef<EventTemplate>[] = [
		createSelectionColumn<EventTemplate>(),
		{
			accessorKey: "name",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Nombre" />
			),
			cell: ({ row }) => {
				const TypeIcon = getEventTypeIcon(row.original.eventType as EventType);
				return (
					<div className="flex items-center gap-2 max-w-[280px]">
						<TypeIcon className="size-4 shrink-0 text-muted-foreground" />
						<Link
							href={`/dashboard/organization/events/templates/${row.original.id}`}
							className="truncate font-medium text-foreground hover:underline"
							title={row.original.name}
						>
							{row.original.name}
						</Link>
					</div>
				);
			},
		},
		{
			accessorKey: "category",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Categoria" />
			),
			cell: ({ row }) =>
				row.original.category ? (
					<Badge variant="outline" className="font-normal">
						{row.original.category}
					</Badge>
				) : (
					<span className="text-muted-foreground">-</span>
				),
		},
		{
			accessorKey: "eventType",
			header: "Tipo de Evento",
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
			accessorKey: "usageCount",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Usos" />
			),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.usageCount} eventos
				</span>
			),
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Creado" />
			),
			cell: ({ row }) => (
				<span className="text-foreground/80 whitespace-nowrap">
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
							<DropdownMenuItem asChild>
								<Link
									href={`/dashboard/organization/events/templates/${row.original.id}`}
								>
									Ver detalle
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link
									href={`/dashboard/organization/events/templates/${row.original.id}/edit`}
								>
									Editar
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									router.push(
										`/dashboard/organization/events/new?templateId=${row.original.id}`,
									);
								}}
							>
								Crear evento desde template
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "Eliminar template?",
										message:
											"Esta seguro de que desea eliminar este template? Esta accion no se puede deshacer.",
										confirmLabel: "Eliminar",
										destructive: true,
										onConfirm: () =>
											deleteTemplateMutation.mutate({ id: row.original.id }),
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

	const templateFilters: FilterConfig[] = [
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
			data={(data?.templates as EventTemplate[]) || []}
			emptyMessage="No hay templates de eventos."
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={templateFilters}
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
			searchPlaceholder="Buscar templates..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button
					onClick={() =>
						router.push("/dashboard/organization/events/templates/new")
					}
					size="sm"
				>
					<PlusIcon className="size-4 shrink-0" />
					Nuevo Template
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
