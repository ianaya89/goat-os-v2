"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	EyeIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	TrophyIcon,
} from "lucide-react";
import Link from "next/link";
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
import { CompetitionsModal } from "@/components/organization/competitions-modal";
import { Badge } from "@/components/ui/badge";
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
import type { CompetitionStatus, CompetitionType } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { CompetitionSortField } from "@/schemas/organization-competition-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "startDate", desc: true }];

const typeColors: Record<string, string> = {
	league: "bg-blue-100 dark:bg-blue-900",
	tournament: "bg-purple-100 dark:bg-purple-900",
	cup: "bg-amber-100 dark:bg-amber-900",
	friendly: "bg-green-100 dark:bg-green-900",
	championship: "bg-red-100 dark:bg-red-900",
	playoff: "bg-orange-100 dark:bg-orange-900",
	other: "bg-gray-100 dark:bg-gray-800",
};

const typeLabels: Record<string, string> = {
	league: "Liga",
	tournament: "Torneo",
	cup: "Copa",
	friendly: "Amistoso",
	championship: "Campeonato",
	playoff: "Playoff",
	other: "Otro",
};

const statusColors: Record<string, string> = {
	upcoming: "bg-blue-100 dark:bg-blue-900",
	in_progress: "bg-green-100 dark:bg-green-900",
	completed: "bg-gray-100 dark:bg-gray-800",
	cancelled: "bg-red-100 dark:bg-red-900",
};

const statusLabels: Record<string, string> = {
	upcoming: "Próximo",
	in_progress: "En curso",
	completed: "Completado",
	cancelled: "Cancelado",
};

interface Competition {
	id: string;
	organizationId: string;
	name: string;
	description: string | null;
	type: string;
	sport: string | null;
	seasonId: string | null;
	season: { id: string; name: string } | null;
	startDate: Date | null;
	endDate: Date | null;
	status: string;
	venue: string | null;
	teamCount: number;
	createdAt: Date;
}

export function CompetitionsTable(): React.JSX.Element {
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

	const [statusFilter, setStatusFilter] = useQueryState(
		"status",
		parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			shallow: true,
		}),
	);

	const [typeFilter, setTypeFilter] = useQueryState(
		"type",
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
		if (typeFilter && typeFilter.length > 0) {
			filters.push({ id: "type", value: typeFilter });
		}
		return filters;
	}, [statusFilter, typeFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("status"));
		setTypeFilter(getFilterValue("type"));

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
		const fallbackSort = { id: "startDate", desc: true } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = CompetitionSortField.options.includes(
			currentSort.id as (typeof CompetitionSortField.options)[number],
		)
			? (currentSort.id as (typeof CompetitionSortField.options)[number])
			: "startDate";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.competition.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				status: statusFilter?.length
					? (statusFilter as (typeof CompetitionStatus)[keyof typeof CompetitionStatus][])
					: undefined,
				type: typeFilter?.length
					? (typeFilter as (typeof CompetitionType)[keyof typeof CompetitionType][])
					: undefined,
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteCompetitionMutation =
		trpc.organization.competition.delete.useMutation({
			onSuccess: () => {
				toast.success("Competencia eliminada");
				utils.organization.competition.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar competencia");
			},
		});

	const handleDelete = (competition: Competition): void => {
		NiceModal.show(ConfirmationModal, {
			title: "Eliminar competencia",
			description: `¿Estás seguro de eliminar "${competition.name}"? Esta acción no se puede deshacer.`,
			confirmText: "Eliminar",
			variant: "destructive",
			onConfirm: () => deleteCompetitionMutation.mutate({ id: competition.id }),
		});
	};

	const basePath = `/dashboard/organization/competitions`;

	const columns: ColumnDef<Competition>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Competencia" />
			),
			cell: ({ row }) => (
				<Link
					href={`${basePath}/${row.original.id}`}
					className="flex items-center gap-3 hover:underline"
				>
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
						<TrophyIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<div className="font-medium">{row.original.name}</div>
						{row.original.season && (
							<div className="text-sm text-muted-foreground">
								{row.original.season.name}
							</div>
						)}
					</div>
				</Link>
			),
		},
		{
			accessorKey: "type",
			header: "Tipo",
			cell: ({ row }) => (
				<Badge variant="outline" className={cn(typeColors[row.original.type])}>
					{typeLabels[row.original.type] ?? row.original.type}
				</Badge>
			),
			filterFn: (row, id, value: string[]) => {
				return value.includes(row.getValue(id));
			},
		},
		{
			accessorKey: "startDate",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Fecha" />
			),
			cell: ({ row }) => {
				const start = row.original.startDate;
				const end = row.original.endDate;
				if (!start) return <span className="text-muted-foreground">-</span>;
				const startStr = format(new Date(start), "dd/MM/yyyy");
				if (!end) return startStr;
				const endStr = format(new Date(end), "dd/MM/yyyy");
				return `${startStr} - ${endStr}`;
			},
		},
		{
			accessorKey: "teamCount",
			header: "Equipos",
			cell: ({ row }) => (
				<span className="text-muted-foreground">{row.original.teamCount}</span>
			),
		},
		{
			accessorKey: "status",
			header: "Estado",
			cell: ({ row }) => (
				<Badge
					variant="outline"
					className={cn(statusColors[row.original.status])}
				>
					{statusLabels[row.original.status] ?? row.original.status}
				</Badge>
			),
			filterFn: (row, id, value: string[]) => {
				return value.includes(row.getValue(id));
			},
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
						<DropdownMenuItem asChild>
							<Link href={`${basePath}/${row.original.id}`}>
								<EyeIcon className="mr-2 h-4 w-4" />
								Ver detalles
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								NiceModal.show(CompetitionsModal, { competition: row.original })
							}
						>
							<PencilIcon className="mr-2 h-4 w-4" />
							Editar
						</DropdownMenuItem>
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

	const filterConfigs: FilterConfig[] = [
		{
			key: "type",
			title: "Tipo",
			options: [
				{ label: "Liga", value: "league" },
				{ label: "Torneo", value: "tournament" },
				{ label: "Copa", value: "cup" },
				{ label: "Amistoso", value: "friendly" },
				{ label: "Campeonato", value: "championship" },
			],
		},
		{
			key: "status",
			title: "Estado",
			options: [
				{ label: "Próximo", value: "upcoming" },
				{ label: "En curso", value: "in_progress" },
				{ label: "Completado", value: "completed" },
				{ label: "Cancelado", value: "cancelled" },
			],
		},
	];

	return (
		<DataTable
			columns={columns}
			data={data?.competitions ?? []}
			totalCount={data?.total ?? 0}
			loading={isPending}
			searchPlaceholder="Buscar competencias..."
			searchQuery={searchQuery ?? ""}
			onSearchQueryChange={setSearchQuery}
			sorting={sorting}
			onSortingChange={handleSortingChange}
			columnFilters={columnFilters}
			onFiltersChange={handleFiltersChange}
			filters={filterConfigs}
			pageIndex={pageIndex ?? 0}
			pageSize={pageSize ?? appConfig.pagination.defaultLimit}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			enableSearch
			enableFilters
			enablePagination
			toolbarActions={
				<Button onClick={() => NiceModal.show(CompetitionsModal)}>
					<PlusIcon className="mr-2 h-4 w-4" />
					Nueva competencia
				</Button>
			}
		/>
	);
}
