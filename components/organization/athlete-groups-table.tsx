"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontalIcon, PlusIcon, UsersIcon } from "lucide-react";
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
import { AthleteGroupsBulkActions } from "@/components/organization/athlete-groups-bulk-actions";
import { AthleteGroupsModal } from "@/components/organization/athlete-groups-modal";
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
import { cn } from "@/lib/utils";
import { AthleteGroupSortField } from "@/schemas/organization-athlete-group-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: false }];

interface AthleteGroupMember {
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

interface AthleteGroup {
	id: string;
	organizationId: string;
	name: string;
	description: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	members: AthleteGroupMember[];
	memberCount: number;
}

const statusColors: Record<string, string> = {
	active: "bg-green-100 dark:bg-green-900",
	inactive: "bg-gray-100 dark:bg-gray-800",
};

export function AthleteGroupsTable(): React.JSX.Element {
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
		"isActive",
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
			filters.push({ id: "isActive", value: statusFilter });
		}
		return filters;
	}, [statusFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("isActive"));

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
		const fallbackSort = { id: "createdAt", desc: false } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = AthleteGroupSortField.options.includes(
			currentSort.id as AthleteGroupSortField,
		)
			? (currentSort.id as AthleteGroupSortField)
			: "createdAt";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	// Convert status filter to boolean
	const isActiveFilter = React.useMemo(() => {
		if (!statusFilter || statusFilter.length === 0) return undefined;
		if (statusFilter.includes("active") && !statusFilter.includes("inactive")) {
			return true;
		}
		if (statusFilter.includes("inactive") && !statusFilter.includes("active")) {
			return false;
		}
		return undefined;
	}, [statusFilter]);

	const { data, isPending } = trpc.organization.athleteGroup.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				isActive: isActiveFilter,
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteGroupMutation =
		trpc.organization.athleteGroup.delete.useMutation({
			onSuccess: () => {
				toast.success("Group deleted successfully");
				utils.organization.athleteGroup.list.invalidate();
				utils.organization.athleteGroup.listActive.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to delete group");
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

	const columns: ColumnDef<AthleteGroup>[] = [
		createSelectionColumn<AthleteGroup>(),
		{
			accessorKey: "name",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Name" />
			),
			cell: ({ row }) => (
				<span
					className="block max-w-[200px] truncate font-medium text-foreground"
					title={row.original.name}
				>
					{row.original.name}
				</span>
			),
		},
		{
			accessorKey: "description",
			header: "Description",
			cell: ({ row }) => (
				<span
					className="block max-w-[250px] truncate text-foreground/80"
					title={row.original.description ?? ""}
				>
					{row.original.description || "-"}
				</span>
			),
		},
		{
			accessorKey: "memberCount",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Members" />
			),
			cell: ({ row }) => (
				<div className="flex items-center gap-1.5 text-foreground/80">
					<UsersIcon className="size-4" />
					<span>{row.original.memberCount}</span>
				</div>
			),
		},
		{
			accessorKey: "isActive",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Status" />
			),
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
						row.original.isActive
							? statusColors.active
							: statusColors.inactive,
					)}
					variant="outline"
				>
					{row.original.isActive ? "Active" : "Inactive"}
				</Badge>
			),
		},
		{
			accessorKey: "createdAt",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Created" />
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
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(AthleteGroupsModal, { group: row.original });
								}}
							>
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "Delete group?",
										message:
											"Are you sure you want to delete this group? Athletes in this group will not be deleted.",
										confirmLabel: "Delete",
										destructive: true,
										onConfirm: () =>
											deleteGroupMutation.mutate({ id: row.original.id }),
									});
								}}
								variant="destructive"
							>
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const groupFilters: FilterConfig[] = [
		{
			key: "isActive",
			title: "Status",
			options: [
				{ value: "active", label: "Active" },
				{ value: "inactive", label: "Inactive" },
			],
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.groups as AthleteGroup[]) || []}
			emptyMessage="No groups found."
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={groupFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			renderBulkActions={(table) => <AthleteGroupsBulkActions table={table} />}
			rowSelection={rowSelection}
			searchPlaceholder="Search groups..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button onClick={() => NiceModal.show(AthleteGroupsModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					Add Group
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
