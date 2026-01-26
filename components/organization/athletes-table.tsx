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
import { AthletesBulkActions } from "@/components/organization/athletes-bulk-actions";
import { AthletesModal } from "@/components/organization/athletes-modal";
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
import { UserAvatar } from "@/components/user/user-avatar";
import { appConfig } from "@/config/app.config";
import { AthleteLevels, AthleteStatuses } from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { AthleteSortField } from "@/schemas/organization-athlete-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: false }];

interface AthleteGroup {
	id: string;
	name: string;
}

interface Athlete {
	id: string;
	organizationId: string;
	userId: string | null;
	sport: string;
	birthDate: Date | null;
	level: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	} | null;
	groups?: AthleteGroup[];
}

const statusColors: Record<string, string> = {
	active: "bg-green-100 dark:bg-green-900",
	inactive: "bg-gray-100 dark:bg-gray-800",
};

const levelColors: Record<string, string> = {
	beginner: "bg-blue-100 dark:bg-blue-900",
	intermediate: "bg-yellow-100 dark:bg-yellow-900",
	advanced: "bg-purple-100 dark:bg-purple-900",
};

export function AthletesTable(): React.JSX.Element {
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

	const [levelFilter, setLevelFilter] = useQueryState(
		"level",
		parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			shallow: true,
		}),
	);

	const [createdAtFilter, setCreatedAtFilter] = useQueryState(
		"createdAt",
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
		if (levelFilter && levelFilter.length > 0) {
			filters.push({ id: "level", value: levelFilter });
		}
		if (createdAtFilter && createdAtFilter.length > 0) {
			filters.push({ id: "createdAt", value: createdAtFilter });
		}
		return filters;
	}, [statusFilter, levelFilter, createdAtFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("status"));
		setLevelFilter(getFilterValue("level"));
		setCreatedAtFilter(getFilterValue("createdAt"));

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
		const sortBy = AthleteSortField.options.includes(
			currentSort.id as AthleteSortField,
		)
			? (currentSort.id as AthleteSortField)
			: "createdAt";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.athlete.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				status: (statusFilter || []) as ("active" | "inactive")[],
				level: (levelFilter || []) as (
					| "beginner"
					| "intermediate"
					| "advanced"
				)[],
				createdAt: (createdAtFilter || []) as (
					| "today"
					| "this-week"
					| "this-month"
					| "older"
				)[],
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteAthleteMutation = trpc.organization.athlete.delete.useMutation({
		onSuccess: () => {
			toast.success("Athlete deleted successfully");
			utils.organization.athlete.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete athlete");
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

	const columns: ColumnDef<Athlete>[] = [
		createSelectionColumn<Athlete>(),
		{
			accessorKey: "name",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Name" />
			),
			cell: ({ row }) => {
				const name = row.original.user?.name ?? "Unknown";
				return (
					<Link
						className="flex max-w-[200px] items-center gap-2 hover:underline"
						href={`/dashboard/organization/athletes/${row.original.id}`}
					>
						<UserAvatar
							className="size-6 shrink-0"
							name={name}
							src={row.original.user?.image ?? undefined}
						/>
						<span className="truncate font-medium text-foreground" title={name}>
							{name}
						</span>
					</Link>
				);
			},
		},
		{
			accessorKey: "email",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Email" />
			),
			cell: ({ row }) => (
				<span
					className="block max-w-[250px] truncate text-foreground/80"
					title={row.original.user?.email ?? ""}
				>
					{row.original.user?.email ?? "-"}
				</span>
			),
		},
		{
			accessorKey: "sport",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Sport" />
			),
			cell: ({ row }) => (
				<span
					className="block max-w-[150px] truncate text-foreground/80"
					title={row.original.sport}
				>
					{row.original.sport}
				</span>
			),
		},
		{
			accessorKey: "level",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Level" />
			),
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
						levelColors[row.original.level] || "bg-gray-100 dark:bg-gray-800",
					)}
					variant="outline"
				>
					{capitalize(row.original.level)}
				</Badge>
			),
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Status" />
			),
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
						statusColors[row.original.status] || "bg-gray-100 dark:bg-gray-800",
					)}
					variant="outline"
				>
					{capitalize(row.original.status)}
				</Badge>
			),
		},
		{
			accessorKey: "groups",
			header: "Groups",
			enableSorting: false,
			cell: ({ row }) => {
				const groups = row.original.groups ?? [];
				if (groups.length === 0) {
					return <span className="text-muted-foreground">-</span>;
				}
				return (
					<div className="flex flex-wrap gap-1">
						{groups.slice(0, 2).map((group) => (
							<Badge
								key={group.id}
								className="border-none bg-indigo-100 px-2 py-0.5 font-medium text-foreground text-xs shadow-none dark:bg-indigo-900"
								variant="outline"
							>
								{group.name}
							</Badge>
						))}
						{groups.length > 2 && (
							<Badge
								className="border-none bg-gray-100 px-2 py-0.5 font-medium text-foreground text-xs shadow-none dark:bg-gray-800"
								variant="outline"
							>
								+{groups.length - 2}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "birthDate",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Birth Date" />
			),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.birthDate
						? format(row.original.birthDate, "dd MMM, yyyy")
						: "-"}
				</span>
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
							<DropdownMenuItem asChild>
								<Link
									href={`/dashboard/organization/athletes/${row.original.id}`}
								>
									<EyeIcon className="mr-2 size-4" />
									View Profile
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(AthletesModal, { athlete: row.original });
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "Delete athlete?",
										message:
											"Are you sure you want to delete this athlete? This action cannot be undone. The user account will remain in the organization.",
										confirmLabel: "Delete",
										destructive: true,
										onConfirm: () =>
											deleteAthleteMutation.mutate({ id: row.original.id }),
									});
								}}
								variant="destructive"
							>
								<Trash2Icon className="mr-2 size-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const athleteFilters: FilterConfig[] = [
		{
			key: "status",
			title: "Status",
			options: AthleteStatuses.map((status) => ({
				value: status,
				label: capitalize(status),
			})),
		},
		{
			key: "level",
			title: "Level",
			options: AthleteLevels.map((level) => ({
				value: level,
				label: capitalize(level),
			})),
		},
		{
			key: "createdAt",
			title: "Created",
			options: [
				{ value: "today", label: "Today" },
				{ value: "this-week", label: "This week" },
				{ value: "this-month", label: "This month" },
				{ value: "older", label: "Older" },
			],
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.athletes as Athlete[]) || []}
			emptyMessage="No athletes found."
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={athleteFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			renderBulkActions={(table) => <AthletesBulkActions table={table} />}
			rowSelection={rowSelection}
			searchPlaceholder="Search athletes..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button onClick={() => NiceModal.show(AthletesModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					Add Athlete
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
