"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { format } from "date-fns";
import {
	CalendarIcon,
	CheckCircleIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	StarIcon,
	Trash2Icon,
} from "lucide-react";
import {
	parseAsInteger,
	parseAsJson,
	parseAsString,
	useQueryState,
} from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { SeasonsModal } from "@/components/organization/seasons-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DataTable,
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
import { cn } from "@/lib/utils";
import { SeasonSortField } from "@/schemas/organization-season-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "startDate", desc: true }];

interface Season {
	id: string;
	organizationId: string;
	name: string;
	startDate: Date;
	endDate: Date;
	isActive: boolean;
	isCurrent: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export function SeasonsTable(): React.JSX.Element {
	const [searchQuery, setSearchQuery] = useQueryState(
		"query",
		parseAsString.withDefault("").withOptions({ shallow: true }),
	);

	const [pageIndex, setPageIndex] = useQueryState(
		"pageIndex",
		parseAsInteger.withDefault(0).withOptions({ shallow: true }),
	);

	const [pageSize, setPageSize] = useQueryState(
		"pageSize",
		parseAsInteger.withDefault(appConfig.pagination.defaultLimit).withOptions({
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

	const handleSortingChange = (newSorting: SortingState): void => {
		setSorting(newSorting.length > 0 ? newSorting : DEFAULT_SORTING);
		if (pageIndex !== 0) {
			setPageIndex(0);
		}
	};

	const sortParams = React.useMemo(() => {
		const fallbackSort = { id: "startDate", desc: true } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = SeasonSortField.options.includes(
			currentSort.id as (typeof SeasonSortField.options)[number],
		)
			? (currentSort.id as (typeof SeasonSortField.options)[number])
			: "startDate";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.season.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteSeasonMutation = trpc.organization.season.delete.useMutation({
		onSuccess: () => {
			toast.success("Temporada eliminada");
			utils.organization.season.list.invalidate();
			utils.organization.season.listActive.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar temporada");
		},
	});

	const setCurrentMutation = trpc.organization.season.setCurrent.useMutation({
		onSuccess: () => {
			toast.success("Temporada actual actualizada");
			utils.organization.season.list.invalidate();
			utils.organization.season.listActive.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Error al establecer temporada actual");
		},
	});

	const handleDelete = (season: Season): void => {
		NiceModal.show(ConfirmationModal, {
			title: "Eliminar temporada",
			description: `¿Estás seguro de eliminar "${season.name}"? Esta acción no se puede deshacer.`,
			confirmText: "Eliminar",
			variant: "destructive",
			onConfirm: () => deleteSeasonMutation.mutate({ id: season.id }),
		});
	};

	const handleSetCurrent = (season: Season): void => {
		setCurrentMutation.mutate({ id: season.id });
	};

	const columns: ColumnDef<Season>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Nombre" />
			),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<CalendarIcon className="h-4 w-4 text-muted-foreground" />
					<span className="font-medium">{row.original.name}</span>
					{row.original.isCurrent && (
						<Badge variant="default" className="ml-2">
							<StarIcon className="mr-1 h-3 w-3" />
							Actual
						</Badge>
					)}
				</div>
			),
		},
		{
			accessorKey: "startDate",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Inicio" />
			),
			cell: ({ row }) => format(new Date(row.original.startDate), "dd/MM/yyyy"),
		},
		{
			accessorKey: "endDate",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Fin" />
			),
			cell: ({ row }) => format(new Date(row.original.endDate), "dd/MM/yyyy"),
		},
		{
			accessorKey: "isActive",
			header: "Estado",
			cell: ({ row }) => (
				<Badge
					variant="outline"
					className={cn(
						row.original.isActive
							? "bg-green-100 dark:bg-green-900"
							: "bg-gray-100 dark:bg-gray-800",
					)}
				>
					{row.original.isActive ? "Activa" : "Inactiva"}
				</Badge>
			),
		},
		{
			id: "actions",
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm">
							<MoreHorizontalIcon className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={() =>
								NiceModal.show(SeasonsModal, { season: row.original })
							}
						>
							<PencilIcon className="mr-2 h-4 w-4" />
							Editar
						</DropdownMenuItem>
						{!row.original.isCurrent && (
							<DropdownMenuItem onClick={() => handleSetCurrent(row.original)}>
								<StarIcon className="mr-2 h-4 w-4" />
								Establecer como actual
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => handleDelete(row.original)}
							className="text-destructive"
						>
							<Trash2Icon className="mr-2 h-4 w-4" />
							Eliminar
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];

	return (
		<DataTable
			columns={columns}
			data={data?.seasons ?? []}
			totalCount={data?.total ?? 0}
			loading={isPending}
			searchPlaceholder="Buscar temporadas..."
			searchQuery={searchQuery ?? ""}
			onSearchQueryChange={setSearchQuery}
			sorting={sorting}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex ?? 0}
			pageSize={pageSize ?? appConfig.pagination.defaultLimit}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			enableSearch
			enablePagination
			toolbarActions={
				<Button onClick={() => NiceModal.show(SeasonsModal)}>
					<PlusIcon className="mr-2 h-4 w-4" />
					Nueva temporada
				</Button>
			}
		/>
	);
}
