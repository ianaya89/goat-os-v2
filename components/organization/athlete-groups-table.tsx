"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import {
	ArchiveIcon,
	ArchiveRestoreIcon,
	EyeIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	parseAsArrayOf,
	parseAsBoolean,
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
import { CategoryBadge } from "@/components/ui/category-badge";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { appConfig } from "@/config/app.config";
import { type AthleteSport, AthleteSports } from "@/lib/db/schema/enums";
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

interface AgeCategory {
	id: string;
	name: string;
}

interface AthleteGroup {
	id: string;
	organizationId: string;
	name: string;
	description: string | null;
	sport: AthleteSport | null;
	ageCategory: AgeCategory | null;
	maxCapacity: number | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	archivedAt: Date | null;
	members: AthleteGroupMember[];
	memberCount: number;
}

const statusColors: Record<string, string> = {
	active: "bg-green-100 dark:bg-green-900",
	inactive: "bg-gray-100 dark:bg-gray-800",
};

export function AthleteGroupsTable(): React.JSX.Element {
	const t = useTranslations("athletes.groups");
	const tCommon = useTranslations("common.sports");
	const tCommonButtons = useTranslations("common.buttons");
	const tCommonConfirmation = useTranslations("common.confirmation");
	const tCommonSuccess = useTranslations("common.success");
	const tCommonStatus = useTranslations("common.status");
	const [rowSelection, setRowSelection] = React.useState({});

	// Translation helper for sports
	const translateSport = (sport: AthleteSport) => {
		const normalizedSport = sport.toLowerCase() as Parameters<
			typeof tCommon
		>[0];
		return tCommon(normalizedSport);
	};

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

	const [sportFilter, setSportFilter] = useQueryState(
		"sport",
		parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			shallow: true,
		}),
	);

	const [categoryFilter, setCategoryFilter] = useQueryState(
		"category",
		parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			shallow: true,
		}),
	);

	const [includeArchived, setIncludeArchived] = useQueryState(
		"archived",
		parseAsBoolean.withDefault(false).withOptions({
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

	const { data: ageCategories } =
		trpc.organization.sportsEvent.listAgeCategories.useQuery({
			includeInactive: false,
		});

	// Build columnFilters from URL state
	const columnFilters: ColumnFiltersState = React.useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (statusFilter && statusFilter.length > 0) {
			filters.push({ id: "isActive", value: statusFilter });
		}
		if (sportFilter && sportFilter.length > 0) {
			filters.push({ id: "sport", value: sportFilter });
		}
		if (categoryFilter && categoryFilter.length > 0) {
			filters.push({ id: "ageCategory", value: categoryFilter });
		}
		return filters;
	}, [statusFilter, sportFilter, categoryFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("isActive"));
		setSportFilter(getFilterValue("sport"));
		setCategoryFilter(getFilterValue("ageCategory"));

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

	// Convert sport filter to AthleteSport array
	const sportFilterValues = React.useMemo(() => {
		if (!sportFilter || sportFilter.length === 0) return undefined;
		return sportFilter as AthleteSport[];
	}, [sportFilter]);

	// Category filter values
	const ageCategoryIdsFilter = React.useMemo(() => {
		if (!categoryFilter || categoryFilter.length === 0) return undefined;
		return categoryFilter;
	}, [categoryFilter]);

	const { data, isPending } = trpc.organization.athleteGroup.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			includeArchived: includeArchived ?? false,
			filters: {
				isActive: isActiveFilter,
				sport: sportFilterValues,
				ageCategoryIds: ageCategoryIdsFilter,
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteGroupMutation = trpc.organization.athleteGroup.delete.useMutation(
		{
			onSuccess: () => {
				toast.success(t("success.deleted"));
				utils.organization.athleteGroup.list.invalidate();
				utils.organization.athleteGroup.listActive.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || t("error.deleteFailed"));
			},
		},
	);

	const archiveGroupMutation =
		trpc.organization.athleteGroup.archive.useMutation({
			onSuccess: () => {
				toast.success(tCommonSuccess("archived"));
				utils.organization.athleteGroup.list.invalidate();
				utils.organization.athleteGroup.listActive.invalidate();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const unarchiveGroupMutation =
		trpc.organization.athleteGroup.unarchive.useMutation({
			onSuccess: () => {
				toast.success(tCommonSuccess("unarchived"));
				utils.organization.athleteGroup.list.invalidate();
				utils.organization.athleteGroup.listActive.invalidate();
			},
			onError: (error) => {
				toast.error(error.message);
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
				<SortableColumnHeader column={column} title={t("table.name")} />
			),
			cell: ({ row }) => {
				const isArchived = row.original.archivedAt !== null;
				return (
					<div className="flex items-center gap-2">
						<Link
							href={`/dashboard/organization/athlete-groups/${row.original.id}`}
							className="block max-w-[200px] truncate font-medium text-foreground hover:text-primary hover:underline"
							title={row.original.name}
						>
							{row.original.name}
						</Link>
						{isArchived && (
							<Badge variant="secondary" className="text-xs">
								{tCommonStatus("archived")}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "description",
			header: t("table.description"),
			cell: ({ row }) => (
				<span
					className="block max-w-[200px] truncate text-foreground/80"
					title={row.original.description ?? ""}
				>
					{row.original.description || "-"}
				</span>
			),
		},
		{
			accessorKey: "sport",
			header: ({ column }) => (
				<SortableColumnHeader
					column={column}
					title={t("table.sportCategory")}
				/>
			),
			cell: ({ row }) => {
				const { sport, ageCategory } = row.original;
				if (!sport && !ageCategory) {
					return <span className="text-muted-foreground">-</span>;
				}
				return (
					<div className="flex flex-col gap-1">
						{sport && (
							<span className="text-foreground/80 text-sm">
								{translateSport(sport)}
							</span>
						)}
						{ageCategory && <CategoryBadge name={ageCategory.name} />}
					</div>
				);
			},
		},
		{
			accessorKey: "memberCount",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.members")} />
			),
			cell: ({ row }) => {
				const { memberCount, maxCapacity } = row.original;
				return (
					<div className="flex items-center gap-1.5 text-foreground/80">
						<UsersIcon className="size-4" />
						<span>
							<span className="font-semibold">{memberCount}</span>
							<span className="text-muted-foreground">
								/{maxCapacity ?? "∞"}
							</span>
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "isActive",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.status")} />
			),
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
						row.original.isActive ? statusColors.active : statusColors.inactive,
					)}
					variant="outline"
				>
					{row.original.isActive ? t("status.active") : t("status.inactive")}
				</Badge>
			),
		},
		{
			id: "actions",
			enableSorting: false,
			cell: ({ row }) => {
				const isArchived = row.original.archivedAt !== null;
				return (
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
										href={`/dashboard/organization/athlete-groups/${row.original.id}`}
									>
										<EyeIcon className="mr-2 size-4" />
										{t("actions.view")}
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										NiceModal.show(AthleteGroupsModal, { group: row.original });
									}}
								>
									<PencilIcon className="mr-2 size-4" />
									{t("actions.edit")}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								{isArchived ? (
									<DropdownMenuItem
										onClick={() => {
											NiceModal.show(ConfirmationModal, {
												title: tCommonConfirmation("unarchiveTitle"),
												message: tCommonConfirmation("unarchiveMessage"),
												confirmLabel: tCommonButtons("unarchive"),
												onConfirm: () =>
													unarchiveGroupMutation.mutate({
														id: row.original.id,
													}),
											});
										}}
									>
										<ArchiveRestoreIcon className="mr-2 size-4" />
										{tCommonButtons("unarchive")}
									</DropdownMenuItem>
								) : (
									<DropdownMenuItem
										onClick={() => {
											NiceModal.show(ConfirmationModal, {
												title: tCommonConfirmation("archiveTitle"),
												message: tCommonConfirmation("archiveMessage"),
												confirmLabel: tCommonButtons("archive"),
												onConfirm: () =>
													archiveGroupMutation.mutate({
														id: row.original.id,
													}),
											});
										}}
									>
										<ArchiveIcon className="mr-2 size-4" />
										{tCommonButtons("archive")}
									</DropdownMenuItem>
								)}
								<DropdownMenuItem
									onClick={() => {
										NiceModal.show(ConfirmationModal, {
											title: t("deleteConfirm.title"),
											message: t("deleteConfirm.message"),
											confirmLabel: t("deleteConfirm.confirm"),
											destructive: true,
											onConfirm: () =>
												deleteGroupMutation.mutate({ id: row.original.id }),
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
				);
			},
		},
	];

	const sportFilterOptions = React.useMemo(
		() =>
			AthleteSports.map((sport) => ({
				value: sport,
				label: translateSport(sport),
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const categoryFilterOptions = React.useMemo(
		() =>
			(ageCategories ?? []).map((cat) => ({
				value: cat.id,
				label: cat.name,
			})),
		[ageCategories],
	);

	const groupFilters: FilterConfig[] = [
		{
			key: "sport",
			title: tCommon("selectSport"),
			options: sportFilterOptions,
		},
		...(categoryFilterOptions.length > 0
			? [
					{
						key: "ageCategory",
						title: t("modal.ageCategory"),
						options: categoryFilterOptions,
					},
				]
			: []),
		{
			key: "isActive",
			title: t("table.status"),
			options: [
				{ value: "active", label: t("status.active") },
				{ value: "inactive", label: t("status.inactive") },
			],
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.groups as AthleteGroup[]) || []}
			emptyMessage={t("table.noGroups")}
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
			searchPlaceholder={t("search")}
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<Switch
							id="show-archived"
							checked={includeArchived ?? false}
							onCheckedChange={setIncludeArchived}
						/>
						<Label
							htmlFor="show-archived"
							className="text-sm text-muted-foreground"
						>
							{t("showArchived")}
						</Label>
					</div>
					<Button onClick={() => NiceModal.show(AthleteGroupsModal)} size="sm">
						<PlusIcon className="size-4 shrink-0" />
						{t("add")}
					</Button>
				</div>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
