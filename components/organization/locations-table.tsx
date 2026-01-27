"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import {
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
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
import { LocationsBulkActions } from "@/components/organization/locations-bulk-actions";
import { LocationsModal } from "@/components/organization/locations-modal";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { appConfig } from "@/config/app.config";
import { getLocationColor } from "@/lib/utils/location-colors";
import { LocationSortField } from "@/schemas/organization-location-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: false }];

interface Location {
	id: string;
	organizationId: string;
	name: string;
	address: string | null;
	city: string | null;
	state: string | null;
	country: string | null;
	postalCode: string | null;
	capacity: number | null;
	notes: string | null;
	color: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export function LocationsTable(): React.JSX.Element {
	const t = useTranslations("locations");
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
		const sortBy = LocationSortField.options.includes(
			currentSort.id as LocationSortField,
		)
			? (currentSort.id as LocationSortField)
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

	const { data, isPending } = trpc.organization.location.list.useQuery(
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

	const deleteLocationMutation = trpc.organization.location.delete.useMutation({
		onSuccess: () => {
			toast.success(t("success.deleted"));
			utils.organization.location.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || t("error.deleteFailed"));
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

	const columns: ColumnDef<Location>[] = [
		createSelectionColumn<Location>(),
		{
			accessorKey: "name",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.name")} />
			),
			cell: ({ row }) => {
				const color = getLocationColor(row.original.id, row.original.color);
				return (
					<div className="flex items-center gap-2">
						<span
							className="size-2.5 shrink-0 rounded-full"
							style={{ backgroundColor: color }}
						/>
						<span
							className="block max-w-[200px] truncate font-medium text-foreground"
							title={row.original.name}
						>
							{row.original.name}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "address",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.address")} />
			),
			cell: ({ row }) => {
				const parts = [
					row.original.address,
					row.original.city,
					row.original.state,
				].filter(Boolean);
				const fullAddress = parts.join(", ");
				return (
					<span
						className="block max-w-[250px] truncate text-foreground/80"
						title={fullAddress}
					>
						{fullAddress || "-"}
					</span>
				);
			},
		},
		{
			accessorKey: "capacity",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.capacity")} />
			),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.capacity ?? "-"}
				</span>
			),
		},
		{
			accessorKey: "isActive",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.status")} />
			),
			cell: ({ row }) => (
				<StatusBadge status={row.original.isActive ? "active" : "inactive"} />
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
									NiceModal.show(LocationsModal, { location: row.original });
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								{t("actions.edit")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: t("delete.title"),
										message: t("delete.message"),
										confirmLabel: t("delete.confirm"),
										destructive: true,
										onConfirm: () =>
											deleteLocationMutation.mutate({ id: row.original.id }),
									});
								}}
								variant="destructive"
							>
								<Trash2Icon className="mr-2 size-4" />
								{t("actions.delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const locationFilters: FilterConfig[] = [
		{
			key: "isActive",
			title: t("filters.status"),
			options: [
				{ value: "active", label: t("filters.active") },
				{ value: "inactive", label: t("filters.inactive") },
			],
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.locations as Location[]) || []}
			emptyMessage={t("table.noLocations")}
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={locationFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			renderBulkActions={(table) => <LocationsBulkActions table={table} />}
			rowSelection={rowSelection}
			searchPlaceholder={t("search")}
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button onClick={() => NiceModal.show(LocationsModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					{t("add")}
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
