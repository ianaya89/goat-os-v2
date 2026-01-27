"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import {
	endOfDay,
	endOfMonth,
	endOfWeek,
	format,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import {
	BanknoteIcon,
	CalendarIcon,
	ClockIcon,
	CopyIcon,
	EditIcon,
	EyeIcon,
	MoreHorizontalIcon,
	RepeatIcon,
	Trash2Icon,
	UsersIcon,
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
import { LocationBadge } from "@/components/organization/location-badge";
import { TrainingSessionStatusBadge } from "@/components/organization/training-session-status-badge";
import { TrainingSessionsBulkActions } from "@/components/organization/training-sessions-bulk-actions";
import { TrainingSessionsModal } from "@/components/organization/training-sessions-modal";
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
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user/user-avatar";
import { appConfig } from "@/config/app.config";
import {
	type TrainingSessionStatus,
	TrainingSessionStatuses,
} from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { TrainingSessionSortField } from "@/schemas/organization-training-session-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "startTime", desc: false }];

interface SessionCoach {
	id: string;
	isPrimary: boolean;
	coach: {
		id: string;
		user: {
			id: string;
			name: string;
			image: string | null;
		} | null;
	};
}

interface SessionAthlete {
	id: string;
	athlete: {
		id: string;
		user: {
			id: string;
			name: string;
			image: string | null;
		} | null;
	};
}

interface SessionPayment {
	id: string;
	status: string;
	amount: number;
	paidAmount: number;
}

interface TrainingSession {
	id: string;
	organizationId: string;
	title: string;
	description: string | null;
	startTime: Date;
	endTime: Date;
	status: string;
	isRecurring: boolean;
	rrule: string | null;
	location: {
		id: string;
		name: string;
		color: string | null;
	} | null;
	athleteGroup: {
		id: string;
		name: string;
	} | null;
	coaches: SessionCoach[];
	athletes: SessionAthlete[];
	payments: SessionPayment[];
	createdAt: Date;
}

const paymentStatusColors: Record<string, string> = {
	paid: "bg-green-100 dark:bg-green-900",
	partial: "bg-yellow-100 dark:bg-yellow-900",
	pending: "bg-orange-100 dark:bg-orange-900",
	cancelled: "bg-gray-100 dark:bg-gray-800",
};

type TrainingSessionsTableProps = {
	toolbarActions?: React.ReactNode;
};

export function TrainingSessionsTable({
	toolbarActions,
}: TrainingSessionsTableProps): React.JSX.Element {
	const t = useTranslations("training");
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

	const [locationFilter, setLocationFilter] = useQueryState(
		"locationId",
		parseAsString.withDefault("").withOptions({
			shallow: true,
		}),
	);

	const [coachFilter, setCoachFilter] = useQueryState(
		"coachId",
		parseAsString.withDefault("").withOptions({
			shallow: true,
		}),
	);

	const [athleteFilter, setAthleteFilter] = useQueryState(
		"athleteId",
		parseAsString.withDefault("").withOptions({
			shallow: true,
		}),
	);

	// Period filter - default to "week" (current week)
	const [periodFilter, setPeriodFilter] = useQueryState(
		"period",
		parseAsString.withDefault("week").withOptions({
			shallow: true,
		}),
	);

	// Calculate date range based on period filter
	const dateRange = React.useMemo(() => {
		const now = new Date();
		switch (periodFilter) {
			case "day":
				return { from: startOfDay(now), to: endOfDay(now) };
			case "week":
				return {
					from: startOfWeek(now, { weekStartsOn: 1 }),
					to: endOfWeek(now, { weekStartsOn: 1 }),
				};
			case "month":
				return { from: startOfMonth(now), to: endOfMonth(now) };
			default:
				// "all" or any other value - no date filter
				return undefined;
		}
	}, [periodFilter]);

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

	// Fetch filter options
	const { data: locationsData } =
		trpc.organization.location.listActive.useQuery();
	const { data: coachesData } = trpc.organization.coach.list.useQuery({
		limit: 100,
		offset: 0,
	});
	const { data: athletesData } = trpc.organization.athlete.list.useQuery({
		limit: 100,
		offset: 0,
	});

	const locations = locationsData ?? [];
	const coaches = coachesData?.coaches ?? [];
	const athletes = athletesData?.athletes ?? [];

	const columnFilters: ColumnFiltersState = React.useMemo(() => {
		const filters: ColumnFiltersState = [];
		// Period filter (single select, always show current value)
		if (periodFilter) {
			filters.push({ id: "period", value: [periodFilter] });
		}
		if (statusFilter && statusFilter.length > 0) {
			filters.push({ id: "status", value: statusFilter });
		}
		if (locationFilter) {
			filters.push({ id: "locationId", value: [locationFilter] });
		}
		if (coachFilter) {
			filters.push({ id: "coachId", value: [coachFilter] });
		}
		if (athleteFilter) {
			filters.push({ id: "athleteId", value: [athleteFilter] });
		}
		return filters;
	}, [periodFilter, statusFilter, locationFilter, coachFilter, athleteFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		// Period is single-select, default to "week" if cleared
		const periodValue = getFilterValue("period")[0];
		setPeriodFilter(periodValue || "week");

		setStatusFilter(getFilterValue("status"));
		setLocationFilter(getFilterValue("locationId")[0] || "");
		setCoachFilter(getFilterValue("coachId")[0] || "");
		setAthleteFilter(getFilterValue("athleteId")[0] || "");

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
		const fallbackSort = { id: "startTime", desc: false } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = TrainingSessionSortField.options.includes(
			currentSort.id as TrainingSessionSortField,
		)
			? (currentSort.id as TrainingSessionSortField)
			: "startTime";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.trainingSession.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				status: (statusFilter || []).filter((s) =>
					TrainingSessionStatuses.includes(s as TrainingSessionStatus),
				) as TrainingSessionStatus[],
				locationId: locationFilter || undefined,
				coachId: coachFilter || undefined,
				athleteId: athleteFilter || undefined,
				dateRange: dateRange,
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const createSessionMutation =
		trpc.organization.trainingSession.create.useMutation({
			onSuccess: () => {
				toast.success(t("success.duplicated"));
				utils.organization.trainingSession.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || t("error.duplicateFailed"));
			},
		});

	const deleteSessionMutation =
		trpc.organization.trainingSession.delete.useMutation({
			onSuccess: () => {
				toast.success(t("success.deleted"));
				utils.organization.trainingSession.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || t("error.deleteFailed"));
			},
		});

	// Duplicate a session - creates a copy with new date (tomorrow same time)
	const handleDuplicateSession = (session: TrainingSession) => {
		const originalStart = new Date(session.startTime);
		const originalEnd = new Date(session.endTime);
		const duration = originalEnd.getTime() - originalStart.getTime();

		// Set to tomorrow same time
		const newStart = new Date(originalStart);
		newStart.setDate(newStart.getDate() + 1);
		const newEnd = new Date(newStart.getTime() + duration);

		createSessionMutation.mutate({
			title: `${session.title} (Copy)`,
			description: session.description ?? undefined,
			startTime: newStart,
			endTime: newEnd,
			status: "pending",
			locationId: session.location?.id ?? null,
			athleteGroupId: session.athleteGroup?.id ?? null,
			coachIds: session.coaches.map((c) => c.coach.id),
			primaryCoachId: session.coaches.find((c) => c.isPrimary)?.coach.id,
			athleteIds: session.athleteGroup
				? undefined
				: session.athletes.map((a) => a.athlete.id),
		});
	};

	const handleSearchQueryChange = (value: string): void => {
		if (value !== searchQuery) {
			setSearchQuery(value);
			if (pageIndex !== 0) {
				setPageIndex(0);
			}
		}
	};

	const columns: ColumnDef<TrainingSession>[] = [
		createSelectionColumn<TrainingSession>(),
		{
			accessorKey: "title",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.title")} />
			),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<Link
						href={`/dashboard/organization/training-sessions/${row.original.id}`}
						className="block max-w-[180px] truncate font-medium text-foreground hover:text-primary hover:underline"
						title={row.original.title}
					>
						{row.original.title}
					</Link>
					{row.original.isRecurring && (
						<Tooltip>
							<TooltipTrigger>
								<RepeatIcon className="size-4 text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent>{t("table.recurringSession")}</TooltipContent>
						</Tooltip>
					)}
				</div>
			),
		},
		{
			accessorKey: "startTime",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.dateAndTime")} />
			),
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<div className="flex items-center gap-1.5 text-foreground">
						<CalendarIcon className="size-3.5" />
						<span>{format(row.original.startTime, "dd MMM, yyyy")}</span>
					</div>
					<div className="flex items-center gap-1.5 text-foreground/70 text-xs">
						<ClockIcon className="size-3" />
						<span>
							{format(row.original.startTime, "HH:mm")} -{" "}
							{format(row.original.endTime, "HH:mm")}
						</span>
					</div>
				</div>
			),
		},
		{
			accessorKey: "location",
			header: t("table.location"),
			cell: ({ row }) =>
				row.original.location ? (
					<LocationBadge
						locationId={row.original.location.id}
						name={row.original.location.name}
						color={row.original.location.color}
					/>
				) : (
					<span className="text-muted-foreground">-</span>
				),
		},
		{
			accessorKey: "coaches",
			header: t("table.coaches"),
			cell: ({ row }) => {
				const coaches = row.original.coaches;
				if (coaches.length === 0) return "-";

				const primaryCoach = coaches.find((c) => c.isPrimary)?.coach;
				const displayCoach = primaryCoach ?? coaches[0]?.coach;

				return (
					<div className="flex items-center gap-1.5">
						<UserAvatar
							className="size-6"
							name={displayCoach?.user?.name ?? ""}
							src={displayCoach?.user?.image ?? undefined}
						/>
						<span className="max-w-[100px] truncate text-foreground/80">
							{displayCoach?.user?.name ?? "Unknown"}
						</span>
						{coaches.length > 1 && (
							<Badge variant="secondary" className="text-xs">
								+{coaches.length - 1}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "participants",
			header: t("table.participants"),
			cell: ({ row }) => {
				const group = row.original.athleteGroup;
				const athletesList = row.original.athletes;

				if (group) {
					return (
						<div className="flex items-center gap-1.5 text-foreground/80">
							<UsersIcon className="size-4 shrink-0" />
							<span className="max-w-[140px] truncate">{group.name}</span>
						</div>
					);
				}

				if (athletesList.length > 0) {
					const first = athletesList[0]?.athlete;
					const remaining = athletesList.length - 1;

					return (
						<div className="flex items-center gap-1.5">
							<UserAvatar
								className="size-6"
								name={first?.user?.name ?? ""}
								src={first?.user?.image ?? undefined}
							/>
							<span className="max-w-[100px] truncate text-foreground/80">
								{first?.user?.name ?? "Unknown"}
							</span>
							{remaining > 0 && (
								<Badge variant="secondary" className="text-xs">
									+{remaining}
								</Badge>
							)}
						</div>
					);
				}

				return <span className="text-muted-foreground">-</span>;
			},
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.status")} />
			),
			cell: ({ row }) => (
				<TrainingSessionStatusBadge status={row.original.status} />
			),
		},
		{
			id: "payment",
			header: t("table.payment"),
			cell: ({ row }) => {
				const payments = row.original.payments;
				if (payments.length === 0) {
					return (
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<BanknoteIcon className="size-4" />
							<span className="text-xs">{t("table.noPayment")}</span>
						</div>
					);
				}

				// Calculate overall payment status
				const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
				const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
				const allPaid = payments.every((p) => p.status === "paid");
				const somePaid = payments.some(
					(p) => p.status === "paid" || p.status === "partial",
				);

				let paymentStatus: string;
				if (allPaid || totalPaid >= totalAmount) {
					paymentStatus = "paid";
				} else if (somePaid || totalPaid > 0) {
					paymentStatus = "partial";
				} else {
					paymentStatus = "pending";
				}

				return (
					<Badge
						className={cn(
							"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
							paymentStatusColors[paymentStatus] ||
								"bg-gray-100 dark:bg-gray-800",
						)}
						variant="outline"
					>
						{capitalize(paymentStatus)}
					</Badge>
				);
			},
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
								<span className="sr-only">{t("table.openMenu")}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link
									href={`/dashboard/organization/training-sessions/${row.original.id}`}
								>
									<EyeIcon className="mr-2 size-4" />
									{t("view")}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(TrainingSessionsModal, {
										session: row.original,
									});
								}}
							>
								<EditIcon className="mr-2 size-4" />
								{t("edit")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => handleDuplicateSession(row.original)}
								disabled={createSessionMutation.isPending}
							>
								<CopyIcon className="mr-2 size-4" />
								{t("table.duplicate")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: t("table.deleteConfirmTitle"),
										message: t("table.deleteConfirmMessage"),
										confirmLabel: t("delete"),
										destructive: true,
										onConfirm: () =>
											deleteSessionMutation.mutate({ id: row.original.id }),
									});
								}}
								variant="destructive"
							>
								<Trash2Icon className="mr-2 size-4" />
								{t("delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const sessionFilters: FilterConfig[] = [
		{
			key: "period",
			title: t("table.period"),
			options: [
				{ value: "day", label: t("table.today") },
				{ value: "week", label: t("table.thisWeek") },
				{ value: "month", label: t("table.thisMonth") },
				{ value: "all", label: t("table.allTime") },
			],
		},
		{
			key: "status",
			title: t("table.status"),
			options: TrainingSessionStatuses.map((status) => ({
				value: status,
				label: capitalize(status),
			})),
		},
		{
			key: "locationId",
			title: t("table.location"),
			options: locations.map((loc) => ({
				value: loc.id,
				label: loc.name,
			})),
		},
		{
			key: "coachId",
			title: t("table.coach"),
			options: coaches.map((coach) => ({
				value: coach.id,
				label: coach.user?.name ?? "Unknown",
			})),
		},
		{
			key: "athleteId",
			title: t("table.athlete"),
			options: athletes.map((athlete) => ({
				value: athlete.id,
				label: athlete.user?.name ?? "Unknown",
			})),
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.sessions as TrainingSession[]) || []}
			emptyMessage={t("table.empty")}
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={sessionFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			renderBulkActions={(table) => (
				<TrainingSessionsBulkActions table={table} />
			)}
			rowSelection={rowSelection}
			searchPlaceholder={t("search")}
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={toolbarActions}
			totalCount={data?.total ?? 0}
		/>
	);
}
