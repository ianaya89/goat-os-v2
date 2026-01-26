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
	ShieldIcon,
	Trash2Icon,
	UsersIcon,
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
import { TeamsModal } from "@/components/organization/teams-modal";
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
import type { TeamStatus } from "@/lib/db/schema/enums";
import { cn, getInitials } from "@/lib/utils";
import { TeamSortField } from "@/schemas/organization-team-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: true }];

const statusColors: Record<string, string> = {
	active: "bg-green-100 dark:bg-green-900",
	inactive: "bg-gray-100 dark:bg-gray-800",
	archived: "bg-amber-100 dark:bg-amber-900",
};

const statusLabels: Record<string, string> = {
	active: "Activo",
	inactive: "Inactivo",
	archived: "Archivado",
};

interface TeamMember {
	id: string;
	athlete: {
		id: string;
		user: {
			id: string;
			name: string;
			email: string;
			image: string | null;
		} | null;
	};
}

interface Team {
	id: string;
	organizationId: string;
	name: string;
	description: string | null;
	sport: string | null;
	status: string;
	season: { id: string; name: string } | null;
	ageCategory: { id: string; name: string } | null;
	members: TeamMember[];
	memberCount: number;
	staffCount: number;
	createdAt: Date;
}

export function TeamsTable(): React.JSX.Element {
	const [rowSelection, setRowSelection] = React.useState({});

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
		const fallbackSort = { id: "createdAt", desc: true } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = TeamSortField.options.includes(
			currentSort.id as (typeof TeamSortField.options)[number],
		)
			? (currentSort.id as (typeof TeamSortField.options)[number])
			: "createdAt";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.team.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				status: statusFilter?.length
					? (statusFilter as (typeof TeamStatus)[keyof typeof TeamStatus][])
					: undefined,
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteTeamMutation = trpc.organization.team.delete.useMutation({
		onSuccess: () => {
			toast.success("Equipo eliminado");
			utils.organization.team.list.invalidate();
			utils.organization.team.listActive.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar equipo");
		},
	});

	const handleDelete = (team: Team): void => {
		NiceModal.show(ConfirmationModal, {
			title: "Eliminar equipo",
			description: `¿Estás seguro de eliminar "${team.name}"? Esta acción no se puede deshacer.`,
			confirmText: "Eliminar",
			variant: "destructive",
			onConfirm: () => deleteTeamMutation.mutate({ id: team.id }),
		});
	};

	const basePath = `/dashboard/organization/teams`;

	const columns: ColumnDef<Team>[] = [
		createSelectionColumn<Team>(),
		{
			accessorKey: "name",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Equipo" />
			),
			cell: ({ row }) => (
				<Link
					href={`${basePath}/${row.original.id}`}
					className="flex items-center gap-3 hover:underline"
				>
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
						<ShieldIcon className="h-5 w-5 text-primary" />
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
			accessorKey: "memberCount",
			header: "Miembros",
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<UsersIcon className="h-4 w-4 text-muted-foreground" />
					<span>{row.original.memberCount}</span>
					{row.original.members.slice(0, 3).map((member) => (
						<Avatar
							key={member.id}
							className="-ml-2 h-6 w-6 border-2 border-background"
						>
							<AvatarImage src={member.athlete.user?.image ?? undefined} />
							<AvatarFallback className="text-xs">
								{getInitials(member.athlete.user?.name ?? "")}
							</AvatarFallback>
						</Avatar>
					))}
					{row.original.memberCount > 3 && (
						<span className="text-xs text-muted-foreground">
							+{row.original.memberCount - 3}
						</span>
					)}
				</div>
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
			accessorKey: "createdAt",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Creado" />
			),
			cell: ({ row }) => format(new Date(row.original.createdAt), "dd/MM/yyyy"),
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
							onClick={() => NiceModal.show(TeamsModal, { team: row.original })}
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
			key: "status",
			title: "Estado",
			options: [
				{ label: "Activo", value: "active" },
				{ label: "Inactivo", value: "inactive" },
				{ label: "Archivado", value: "archived" },
			],
		},
	];

	const _selectedTeams = React.useMemo(() => {
		const selectedIds = Object.keys(rowSelection);
		return data?.teams.filter((team) => selectedIds.includes(team.id)) ?? [];
	}, [rowSelection, data?.teams]);

	return (
		<DataTable
			columns={columns}
			data={data?.teams ?? []}
			totalCount={data?.total ?? 0}
			loading={isPending}
			searchPlaceholder="Buscar equipos..."
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
			rowSelection={rowSelection}
			onRowSelectionChange={setRowSelection}
			enableSearch
			enableFilters
			enablePagination
			enableRowSelection
			toolbarActions={
				<Button onClick={() => NiceModal.show(TeamsModal)}>
					<PlusIcon className="mr-2 h-4 w-4" />
					Nuevo equipo
				</Button>
			}
		/>
	);
}
