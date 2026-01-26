"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	CheckCircleIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlayCircleIcon,
	PlusIcon,
	Trash2Icon,
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
import { MatchResultModal } from "@/components/organization/match-result-modal";
import { MatchesModal } from "@/components/organization/matches-modal";
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
import type { MatchStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { MatchSortField } from "@/schemas/organization-match-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "scheduledAt", desc: true }];

const statusColors: Record<string, string> = {
	scheduled: "bg-blue-100 dark:bg-blue-900",
	in_progress: "bg-yellow-100 dark:bg-yellow-900",
	completed: "bg-green-100 dark:bg-green-900",
	postponed: "bg-orange-100 dark:bg-orange-900",
	cancelled: "bg-red-100 dark:bg-red-900",
};

const statusLabels: Record<string, string> = {
	scheduled: "Programado",
	in_progress: "En curso",
	completed: "Completado",
	postponed: "Aplazado",
	cancelled: "Cancelado",
};

interface Match {
	id: string;
	organizationId: string;
	competitionId: string | null;
	competition: { id: string; name: string } | null;
	homeTeamId: string | null;
	awayTeamId: string | null;
	homeTeam: { id: string; name: string } | null;
	awayTeam: { id: string; name: string } | null;
	opponentName: string | null;
	isHomeGame: boolean;
	scheduledAt: Date;
	status: string;
	venue: string | null;
	homeScore: number | null;
	awayScore: number | null;
	round: string | null;
	matchday: number | null;
	referee: string | null;
	preMatchNotes: string | null;
	createdAt: Date;
}

export function MatchesTable(): React.JSX.Element {
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
		return filters;
	}, [statusFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("status"));

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
		const fallbackSort = { id: "scheduledAt", desc: true } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = MatchSortField.options.includes(
			currentSort.id as (typeof MatchSortField.options)[number],
		)
			? (currentSort.id as (typeof MatchSortField.options)[number])
			: "scheduledAt";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.match.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				status: statusFilter?.length
					? (statusFilter as (typeof MatchStatus)[keyof typeof MatchStatus][])
					: undefined,
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteMatchMutation = trpc.organization.match.delete.useMutation({
		onSuccess: () => {
			toast.success("Partido eliminado");
			utils.organization.match.list.invalidate();
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message || "Error al eliminar partido");
		},
	});

	const startMatchMutation = trpc.organization.match.startMatch.useMutation({
		onSuccess: () => {
			toast.success("Partido iniciado");
			utils.organization.match.list.invalidate();
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message || "Error al iniciar partido");
		},
	});

	const handleDelete = (match: Match): void => {
		NiceModal.show(ConfirmationModal, {
			title: "Eliminar partido",
			description:
				"¿Estás seguro de eliminar este partido? Esta acción no se puede deshacer.",
			confirmText: "Eliminar",
			variant: "destructive",
			onConfirm: () => deleteMatchMutation.mutate({ id: match.id }),
		});
	};

	const handleStart = (match: Match): void => {
		startMatchMutation.mutate({ id: match.id });
	};

	const getMatchTitle = (match: Match): string => {
		const home = match.homeTeam?.name ?? "Local";
		const away = match.awayTeam?.name ?? match.opponentName ?? "Visitante";
		return `${home} vs ${away}`;
	};

	const columns: ColumnDef<Match>[] = [
		{
			accessorKey: "scheduledAt",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Fecha" />
			),
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="font-medium">
						{format(new Date(row.original.scheduledAt), "dd/MM/yyyy")}
					</span>
					<span className="text-sm text-muted-foreground">
						{format(new Date(row.original.scheduledAt), "HH:mm")}
					</span>
				</div>
			),
		},
		{
			id: "match",
			header: "Partido",
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="font-medium">{getMatchTitle(row.original)}</span>
					{row.original.competition && (
						<span className="text-sm text-muted-foreground">
							{row.original.competition.name}
						</span>
					)}
				</div>
			),
		},
		{
			id: "score",
			header: "Resultado",
			cell: ({ row }) => {
				if (
					row.original.status !== "completed" &&
					row.original.status !== "in_progress"
				) {
					return <span className="text-muted-foreground">-</span>;
				}
				return (
					<span className="font-bold text-lg">
						{row.original.homeScore ?? 0} - {row.original.awayScore ?? 0}
					</span>
				);
			},
		},
		{
			accessorKey: "venue",
			header: "Sede",
			cell: ({ row }) =>
				row.original.venue || <span className="text-muted-foreground">-</span>,
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
						<DropdownMenuItem
							onClick={() =>
								NiceModal.show(MatchesModal, { match: row.original })
							}
						>
							<PencilIcon className="mr-2 h-4 w-4" />
							Editar
						</DropdownMenuItem>
						{row.original.status === "scheduled" && (
							<DropdownMenuItem onClick={() => handleStart(row.original)}>
								<PlayCircleIcon className="mr-2 h-4 w-4" />
								Iniciar partido
							</DropdownMenuItem>
						)}
						{(row.original.status === "in_progress" ||
							row.original.status === "completed") && (
							<DropdownMenuItem
								onClick={() =>
									NiceModal.show(MatchResultModal, { match: row.original })
								}
							>
								<CheckCircleIcon className="mr-2 h-4 w-4" />
								{row.original.status === "completed"
									? "Editar resultado"
									: "Registrar resultado"}
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

	const filterConfigs: FilterConfig[] = [
		{
			key: "status",
			title: "Estado",
			options: [
				{ label: "Programado", value: "scheduled" },
				{ label: "En curso", value: "in_progress" },
				{ label: "Completado", value: "completed" },
				{ label: "Aplazado", value: "postponed" },
				{ label: "Cancelado", value: "cancelled" },
			],
		},
	];

	return (
		<DataTable
			columns={columns}
			data={(data?.matches ?? []) as Match[]}
			totalCount={data?.total ?? 0}
			loading={isPending}
			searchPlaceholder="Buscar partidos..."
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
				<Button onClick={() => NiceModal.show(MatchesModal)}>
					<PlusIcon className="mr-2 h-4 w-4" />
					Nuevo partido
				</Button>
			}
		/>
	);
}
