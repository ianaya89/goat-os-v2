"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import {
	EyeIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import Link from "next/link";
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
import { CoachesBulkActions } from "@/components/organization/coaches-bulk-actions";
import { CoachesModal } from "@/components/organization/coaches-modal";
import { Button } from "@/components/ui/button";
import { MailtoLink, WhatsAppLink } from "@/components/ui/contact-links";
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
import { UserAvatar } from "@/components/user/user-avatar";
import { appConfig } from "@/config/app.config";
import {
	type AthleteSport,
	AthleteSports,
	CoachStatuses,
} from "@/lib/db/schema/enums";
import { CoachSortField } from "@/schemas/organization-coach-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: false }];

interface Coach {
	id: string;
	organizationId: string;
	userId: string | null;
	phone: string | null;
	birthDate: Date | null;
	sport: string | null;
	specialty: string;
	bio: string | null;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
		imageKey: string | null;
	} | null;
}

export function CoachesTable(): React.JSX.Element {
	const t = useTranslations("coaches");
	const tCommon = useTranslations("common.sports");
	const [rowSelection, setRowSelection] = React.useState({});

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
		"status",
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

	const [sportFilter, setSportFilter] = useQueryState(
		"sport",
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
		if (createdAtFilter && createdAtFilter.length > 0) {
			filters.push({ id: "createdAt", value: createdAtFilter });
		}
		if (sportFilter && sportFilter.length > 0) {
			filters.push({ id: "sport", value: sportFilter });
		}
		return filters;
	}, [statusFilter, createdAtFilter, sportFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("status"));
		setCreatedAtFilter(getFilterValue("createdAt"));
		setSportFilter(getFilterValue("sport"));

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
		const sortBy = CoachSortField.options.includes(
			currentSort.id as CoachSortField,
		)
			? (currentSort.id as CoachSortField)
			: "createdAt";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.coach.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				status: (statusFilter || []) as ("active" | "inactive")[],
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

	const deleteCoachMutation = trpc.organization.coach.delete.useMutation({
		onSuccess: () => {
			toast.success(t("success.deleted"));
			utils.organization.coach.list.invalidate();
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

	// Calculate age from birth date
	const calculateAge = (birthDate: Date | null): number | null => {
		if (!birthDate) return null;
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birth.getDate())
		) {
			age--;
		}
		return age;
	};

	const columns: ColumnDef<Coach>[] = [
		createSelectionColumn<Coach>(),
		{
			accessorKey: "name",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.name")} />
			),
			cell: ({ row }) => {
				const name = row.original.user?.name ?? "Unknown";
				const age = calculateAge(row.original.birthDate);
				return (
					<Link
						className="flex items-center gap-3 hover:opacity-80"
						href={`/dashboard/organization/coaches/${row.original.id}`}
					>
						<UserAvatar
							className="size-9 shrink-0"
							name={name}
							src={row.original.user?.image ?? undefined}
						/>
						<div className="min-w-0">
							<p className="truncate font-medium text-foreground" title={name}>
								{name}
							</p>
							{age !== null && (
								<p className="text-muted-foreground text-xs">
									<span className="font-semibold">{age}</span>{" "}
									{t("table.yearsOld")}
								</p>
							)}
						</div>
					</Link>
				);
			},
		},
		{
			accessorKey: "email",
			header: t("table.email"),
			cell: ({ row }) => {
				const email = row.original.user?.email;
				return email ? (
					<MailtoLink
						email={email}
						className="text-sm"
						iconSize="size-3.5"
						truncate
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					<span className="text-muted-foreground">-</span>
				);
			},
		},
		{
			accessorKey: "phone",
			header: t("table.phone"),
			cell: ({ row }) => {
				const phone = row.original.phone;
				return phone ? (
					<WhatsAppLink
						phone={phone}
						variant="whatsapp"
						className="text-sm"
						iconSize="size-3.5"
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					<span className="text-muted-foreground">-</span>
				);
			},
		},
		{
			accessorKey: "sport",
			header: t("table.sport"),
			cell: ({ row }) => {
				const sport = row.original.sport;
				return sport ? (
					<span className="text-foreground/80 text-sm">
						{translateSport(sport as AthleteSport)}
					</span>
				) : (
					<span className="text-muted-foreground">-</span>
				);
			},
		},
		{
			accessorKey: "specialty",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.specialty")} />
			),
			cell: ({ row }) => (
				<span
					className="block max-w-[200px] truncate text-foreground/80 text-sm"
					title={row.original.specialty}
				>
					{row.original.specialty}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: t("table.status"),
			cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
								<span className="sr-only">{t("table.actions")}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link
									href={`/dashboard/organization/coaches/${row.original.id}`}
								>
									<EyeIcon className="mr-2 size-4" />
									{t("table.viewProfile")}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(CoachesModal, { coach: row.original });
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								{t("edit")}
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
											deleteCoachMutation.mutate({ id: row.original.id }),
									});
								}}
								variant="destructive"
							>
								<Trash2Icon className="mr-2 size-4" />
								{t("deleteAction")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const coachFilters: FilterConfig[] = [
		{
			key: "sport",
			title: t("table.sport"),
			options: AthleteSports.map((sport) => ({
				value: sport,
				label: translateSport(sport),
			})),
		},
		{
			key: "status",
			title: t("table.status"),
			options: CoachStatuses.map((status) => ({
				value: status,
				label: t(`statuses.${status}` as Parameters<typeof t>[0]),
			})),
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.coaches as Coach[]) || []}
			emptyMessage={t("table.noCoaches")}
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={coachFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			renderBulkActions={(table) => <CoachesBulkActions table={table} />}
			rowSelection={rowSelection}
			searchPlaceholder={t("search")}
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button onClick={() => NiceModal.show(CoachesModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					{t("add")}
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
