"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	BanknoteIcon,
	CalendarIcon,
	ClockIcon,
	EyeIcon,
	MapPinIcon,
	MoreHorizontalIcon,
	PlusIcon,
	RepeatIcon,
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
	TrainingSessionStatus,
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

const statusColors: Record<string, string> = {
	pending: "bg-yellow-100 dark:bg-yellow-900",
	confirmed: "bg-blue-100 dark:bg-blue-900",
	completed: "bg-green-100 dark:bg-green-900",
	cancelled: "bg-gray-100 dark:bg-gray-800",
};

const paymentStatusColors: Record<string, string> = {
	paid: "bg-green-100 dark:bg-green-900",
	partial: "bg-yellow-100 dark:bg-yellow-900",
	pending: "bg-orange-100 dark:bg-orange-900",
	cancelled: "bg-gray-100 dark:bg-gray-800",
};

export function TrainingSessionsTable(): React.JSX.Element {
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
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteSessionMutation =
		trpc.organization.trainingSession.delete.useMutation({
			onSuccess: () => {
				toast.success("Session deleted successfully");
				utils.organization.trainingSession.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to delete session");
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

	const columns: ColumnDef<TrainingSession>[] = [
		createSelectionColumn<TrainingSession>(),
		{
			accessorKey: "title",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Title" />
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
							<TooltipContent>Recurring session</TooltipContent>
						</Tooltip>
					)}
				</div>
			),
		},
		{
			accessorKey: "startTime",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Date & Time" />
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
			header: "Location",
			cell: ({ row }) =>
				row.original.location ? (
					<div className="flex items-center gap-1.5 text-foreground/80">
						<MapPinIcon className="size-4" />
						<span className="max-w-[120px] truncate">
							{row.original.location.name}
						</span>
					</div>
				) : (
					<span className="text-muted-foreground">-</span>
				),
		},
		{
			accessorKey: "coaches",
			header: "Coaches",
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
			header: "Participants",
			cell: ({ row }) => {
				const group = row.original.athleteGroup;
				const athletes = row.original.athletes;

				if (group) {
					return (
						<div className="flex items-center gap-1.5 text-foreground/80">
							<UsersIcon className="size-4" />
							<span className="max-w-[100px] truncate">{group.name}</span>
						</div>
					);
				}

				if (athletes.length > 0) {
					return (
						<div className="flex items-center gap-1.5 text-foreground/80">
							<UsersIcon className="size-4" />
							<span>
								{athletes.length} athlete{athletes.length > 1 ? "s" : ""}
							</span>
						</div>
					);
				}

				return <span className="text-muted-foreground">-</span>;
			},
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
			id: "payment",
			header: "Payment",
			cell: ({ row }) => {
				const payments = row.original.payments;
				if (payments.length === 0) {
					return (
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<BanknoteIcon className="size-4" />
							<span className="text-xs">No payment</span>
						</div>
					);
				}

				// Calculate overall payment status
				const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
				const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
				const allPaid = payments.every((p) => p.status === "paid");
				const somePaid = payments.some((p) => p.status === "paid" || p.status === "partial");

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
							paymentStatusColors[paymentStatus] || "bg-gray-100 dark:bg-gray-800",
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
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link
									href={`/dashboard/organization/training-sessions/${row.original.id}`}
								>
									<EyeIcon className="mr-2 size-4" />
									View
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(TrainingSessionsModal, {
										session: row.original,
									});
								}}
							>
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "Delete session?",
										message:
											"Are you sure you want to delete this session? This action cannot be undone.",
										confirmLabel: "Delete",
										destructive: true,
										onConfirm: () =>
											deleteSessionMutation.mutate({ id: row.original.id }),
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

	const sessionFilters: FilterConfig[] = [
		{
			key: "status",
			title: "Status",
			options: TrainingSessionStatuses.map((status) => ({
				value: status,
				label: capitalize(status),
			})),
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.sessions as TrainingSession[]) || []}
			emptyMessage="No training sessions found."
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
			searchPlaceholder="Search sessions..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				<Button
					onClick={() => NiceModal.show(TrainingSessionsModal)}
					size="sm"
				>
					<PlusIcon className="size-4 shrink-0" />
					Add Session
				</Button>
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
