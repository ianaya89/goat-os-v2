"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { CheckCircleIcon, MoreHorizontalIcon, XCircleIcon } from "lucide-react";
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
import { OrganizationUserModal } from "@/components/organization/organization-user-modal";
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
import { UserAvatar } from "@/components/user/user-avatar";
import { appConfig } from "@/config/app.config";
import { MemberRoles } from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { OrganizationUserSortField } from "@/schemas/organization-user-schemas";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "joinedAt", desc: true }];

interface OrganizationUser {
	id: string;
	memberId: string;
	name: string;
	email: string;
	image: string | null;
	emailVerified: boolean;
	role: string;
	joinedAt: Date;
	userCreatedAt: Date;
	coachProfile: {
		id: string;
		specialty: string;
		status: string;
	} | null;
	athleteProfile: {
		id: string;
		sport: string;
		level: string;
		status: string;
	} | null;
}

const roleColors: Record<string, string> = {
	owner: "bg-purple-100 dark:bg-purple-900",
	admin: "bg-blue-100 dark:bg-blue-900",
	member: "bg-gray-100 dark:bg-gray-800",
};

export function OrganizationUsersTable(): React.JSX.Element {
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

	const [roleFilter, setRoleFilter] = useQueryState(
		"role",
		parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			shallow: true,
		}),
	);

	const [joinedAtFilter, setJoinedAtFilter] = useQueryState(
		"joinedAt",
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
		if (roleFilter && roleFilter.length > 0) {
			filters.push({ id: "role", value: roleFilter });
		}
		if (joinedAtFilter && joinedAtFilter.length > 0) {
			filters.push({ id: "joinedAt", value: joinedAtFilter });
		}
		return filters;
	}, [roleFilter, joinedAtFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setRoleFilter(getFilterValue("role"));
		setJoinedAtFilter(getFilterValue("joinedAt"));

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
		const fallbackSort = { id: "joinedAt", desc: true } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortBy = OrganizationUserSortField.options.includes(
			currentSort.id as OrganizationUserSortField,
		)
			? (currentSort.id as OrganizationUserSortField)
			: "joinedAt";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	const { data, isPending } = trpc.organization.user.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				role: (roleFilter || []) as ("owner" | "admin" | "member")[],
				joinedAt: (joinedAtFilter || []) as (
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

	const removeUserMutation = trpc.organization.user.remove.useMutation({
		onSuccess: () => {
			toast.success("User removed from organization");
			utils.organization.user.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to remove user");
		},
	});

	const sendPasswordResetMutation =
		trpc.organization.user.sendPasswordReset.useMutation({
			onSuccess: () => {
				toast.success("Password reset email sent successfully");
			},
			onError: (error) => {
				toast.error(error.message || "Failed to send password reset email");
			},
		});

	const resendVerificationMutation =
		trpc.organization.user.resendVerificationEmail.useMutation({
			onSuccess: () => {
				toast.success("Verification email sent successfully");
			},
			onError: (error) => {
				toast.error(error.message || "Failed to send verification email");
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

	const columns: ColumnDef<OrganizationUser>[] = [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Name" />
			),
			cell: ({ row }) => {
				return (
					<div className="flex max-w-[200px] items-center gap-2">
						<UserAvatar
							className="size-6 shrink-0"
							name={row.original.name}
							src={row.original.image ?? undefined}
						/>
						<span
							className="truncate font-medium text-foreground"
							title={row.original.name}
						>
							{row.original.name}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "email",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Email" />
			),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<span
						className="block max-w-[200px] truncate text-foreground/80"
						title={row.original.email}
					>
						{row.original.email}
					</span>
					{row.original.emailVerified ? (
						<CheckCircleIcon className="size-4 text-green-500" />
					) : (
						<XCircleIcon className="size-4 text-muted-foreground" />
					)}
				</div>
			),
		},
		{
			accessorKey: "role",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Role" />
			),
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
						roleColors[row.original.role] || "bg-gray-100 dark:bg-gray-800",
					)}
					variant="outline"
				>
					{capitalize(row.original.role)}
				</Badge>
			),
		},
		{
			id: "profiles",
			header: "Profiles",
			cell: ({ row }) => (
				<div className="flex gap-1">
					{row.original.coachProfile && (
						<Badge
							className="border-none bg-amber-100 px-2 py-0.5 font-medium text-foreground text-xs shadow-none dark:bg-amber-900"
							variant="outline"
						>
							Coach
						</Badge>
					)}
					{row.original.athleteProfile && (
						<Badge
							className="border-none bg-teal-100 px-2 py-0.5 font-medium text-foreground text-xs shadow-none dark:bg-teal-900"
							variant="outline"
						>
							Athlete
						</Badge>
					)}
					{!row.original.coachProfile && !row.original.athleteProfile && (
						<span className="text-muted-foreground text-sm">-</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "joinedAt",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Joined" />
			),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{format(row.original.joinedAt, "dd MMM, yyyy")}
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
									NiceModal.show(OrganizationUserModal, {
										user: row.original,
									});
								}}
							>
								View Details
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									sendPasswordResetMutation.mutate({
										userId: row.original.id,
									});
								}}
								disabled={sendPasswordResetMutation.isPending}
							>
								Reset Password
							</DropdownMenuItem>
							{!row.original.emailVerified && (
								<DropdownMenuItem
									onClick={() => {
										resendVerificationMutation.mutate({
											userId: row.original.id,
										});
									}}
									disabled={resendVerificationMutation.isPending}
								>
									Resend Verification
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "Remove user?",
										message:
											"Are you sure you want to remove this user from the organization? Their coach and athlete profiles will also be removed.",
										confirmLabel: "Remove",
										destructive: true,
										onConfirm: () =>
											removeUserMutation.mutate({ userId: row.original.id }),
									});
								}}
								variant="destructive"
							>
								Remove from Organization
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const userFilters: FilterConfig[] = [
		{
			key: "role",
			title: "Role",
			options: MemberRoles.map((role) => ({
				value: role,
				label: capitalize(role),
			})),
		},
		{
			key: "joinedAt",
			title: "Joined",
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
			data={(data?.users as OrganizationUser[]) || []}
			emptyMessage="No users found."
			enableFilters
			enablePagination
			enableSearch
			filters={userFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			searchPlaceholder="Search users..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			totalCount={data?.total ?? 0}
		/>
	);
}
