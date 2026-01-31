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
	EyeIcon,
	KeyRoundIcon,
	MailIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	ShieldBanIcon,
	ShieldCheckIcon,
	SmartphoneIcon,
	UserXIcon,
	XCircleIcon,
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
import { OrganizationBanUserModal } from "@/components/organization/organization-ban-user-modal";
import { OrganizationUserFormModal } from "@/components/organization/organization-user-form-modal";
import { OrganizationUserModal } from "@/components/organization/organization-user-modal";
import { OrganizationUsersBulkActions } from "@/components/organization/organization-users-bulk-actions";
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
import { MemberRoles } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
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
	banned: boolean;
	banReason: string | null;
	banExpires: Date | null;
	twoFactorEnabled: boolean;
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
	staff: "bg-orange-100 dark:bg-orange-900",
	member: "bg-gray-100 dark:bg-gray-800",
	coach: "bg-emerald-100 dark:bg-emerald-900",
	athlete: "bg-amber-100 dark:bg-amber-900",
};

export function OrganizationUsersTable(): React.JSX.Element {
	const t = useTranslations("users");
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

	const [roleFilter, setRoleFilter] = useQueryState(
		"role",
		parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			shallow: true,
		}),
	);

	const [emailStatusFilter, setEmailStatusFilter] = useQueryState(
		"emailStatus",
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
		if (emailStatusFilter && emailStatusFilter.length > 0) {
			filters.push({ id: "emailStatus", value: emailStatusFilter });
		}
		return filters;
	}, [roleFilter, emailStatusFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setRoleFilter(getFilterValue("role"));
		setEmailStatusFilter(getFilterValue("emailStatus"));

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

	// Separate role filter values into actual member roles vs profile types
	const parsedRoleFilter = React.useMemo(() => {
		const values = roleFilter || [];
		const memberRoles = values.filter(
			(v) => v !== "coach" && v !== "athlete",
		) as ("owner" | "admin" | "staff" | "member")[];
		const hasCoach = values.includes("coach");
		const hasAthlete = values.includes("athlete");
		return { memberRoles, hasCoach, hasAthlete };
	}, [roleFilter]);

	// Parse email status filter into a boolean or undefined
	const parsedEmailVerified = React.useMemo(() => {
		const values = emailStatusFilter || [];
		if (values.length === 0 || values.length === 2) return undefined;
		return values.includes("verified") ? true : false;
	}, [emailStatusFilter]);

	const { data, isPending } = trpc.organization.user.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			filters: {
				role:
					parsedRoleFilter.memberRoles.length > 0
						? parsedRoleFilter.memberRoles
						: undefined,
				hasCoachProfile: parsedRoleFilter.hasCoach ? true : undefined,
				hasAthleteProfile: parsedRoleFilter.hasAthlete ? true : undefined,
				emailVerified: parsedEmailVerified,
			},
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const removeUserMutation = trpc.organization.user.remove.useMutation({
		onSuccess: () => {
			toast.success(t("success.removed"));
			utils.organization.user.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || t("error.removeFailed"));
		},
	});

	const sendPasswordResetMutation =
		trpc.organization.user.sendPasswordReset.useMutation({
			onSuccess: () => {
				toast.success(t("success.passwordResetSent"));
			},
			onError: (error) => {
				toast.error(error.message || t("error.passwordResetFailed"));
			},
		});

	const resendVerificationMutation =
		trpc.organization.user.resendVerificationEmail.useMutation({
			onSuccess: () => {
				toast.success(t("success.verificationSent"));
			},
			onError: (error) => {
				toast.error(error.message || t("error.verificationFailed"));
			},
		});

	const unbanUserMutation = trpc.organization.user.unban.useMutation({
		onSuccess: () => {
			toast.success(t("success.unbanned"));
			utils.organization.user.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || t("error.unbanFailed"));
		},
	});

	const resetMfaMutation = trpc.organization.user.resetMfa.useMutation({
		onSuccess: () => {
			toast.success(t("success.mfaReset"));
			utils.organization.user.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || t("error.mfaResetFailed"));
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
		createSelectionColumn<OrganizationUser>(),
		{
			accessorKey: "name",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.name")} />
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
				<SortableColumnHeader column={column} title={t("table.email")} />
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
			accessorKey: "twoFactorEnabled",
			header: () => <span className="text-xs">{t("table.mfa")}</span>,
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center justify-center">
					{row.original.twoFactorEnabled ? (
						<SmartphoneIcon className="size-4 text-green-500" />
					) : (
						<span className="text-muted-foreground">—</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "role",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.role")} />
			),
			cell: ({ row }) => {
				const hasCoach = !!row.original.coachProfile;
				const hasAthlete = !!row.original.athleteProfile;
				const hasProfiles = hasCoach || hasAthlete;

				return (
					<div className="flex flex-wrap items-center gap-1.5">
						{hasCoach && (
							<Link
								href={`/dashboard/organization/coaches/${row.original.coachProfile!.id}`}
							>
								<Badge
									className={cn(
										"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none hover:opacity-80",
										roleColors.coach,
									)}
									variant="outline"
								>
									{t("roles.coach")}
								</Badge>
							</Link>
						)}
						{hasAthlete && (
							<Link
								href={`/dashboard/organization/athletes/${row.original.athleteProfile!.id}`}
							>
								<Badge
									className={cn(
										"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none hover:opacity-80",
										roleColors.athlete,
									)}
									variant="outline"
								>
									{t("roles.athlete")}
								</Badge>
							</Link>
						)}
						{!hasProfiles && (
							<Badge
								className={cn(
									"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
									roleColors[row.original.role] ||
										"bg-gray-100 dark:bg-gray-800",
								)}
								variant="outline"
							>
								{t(`roles.${row.original.role}` as Parameters<typeof t>[0])}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "joinedAt",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.joined")} />
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
									NiceModal.show(OrganizationUserFormModal, {
										user: {
											id: row.original.id,
											name: row.original.name,
											email: row.original.email,
											role: row.original.role,
											hasProfiles:
												!!row.original.coachProfile ||
												!!row.original.athleteProfile,
										},
									});
								}}
							>
								<PencilIcon className="size-4" />
								{t("table.editUser")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(OrganizationUserModal, {
										user: row.original,
									});
								}}
							>
								<EyeIcon className="size-4" />
								{t("table.viewDetails")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: t("resetPasswordConfirm.title"),
										message: t("resetPasswordConfirm.message", {
											email: row.original.email,
										}),
										confirmLabel: t("resetPasswordConfirm.confirm"),
										onConfirm: () =>
											sendPasswordResetMutation.mutate({
												userId: row.original.id,
											}),
									});
								}}
								disabled={sendPasswordResetMutation.isPending}
							>
								<KeyRoundIcon className="size-4" />
								{t("table.resetPassword")}
							</DropdownMenuItem>
							{row.original.twoFactorEnabled && (
								<DropdownMenuItem
									onClick={() => {
										NiceModal.show(ConfirmationModal, {
											title: t("resetMfaConfirm.title"),
											message: t("resetMfaConfirm.message", {
												name: row.original.name,
											}),
											confirmLabel: t("resetMfaConfirm.confirm"),
											onConfirm: () =>
												resetMfaMutation.mutate({
													userId: row.original.id,
												}),
										});
									}}
									disabled={resetMfaMutation.isPending}
								>
									<SmartphoneIcon className="size-4" />
									{t("table.resetMfa")}
								</DropdownMenuItem>
							)}
							{!row.original.emailVerified && (
								<DropdownMenuItem
									onClick={() => {
										NiceModal.show(ConfirmationModal, {
											title: t("resendVerificationConfirm.title"),
											message: t("resendVerificationConfirm.message", {
												email: row.original.email,
											}),
											confirmLabel: t("resendVerificationConfirm.confirm"),
											onConfirm: () =>
												resendVerificationMutation.mutate({
													userId: row.original.id,
												}),
										});
									}}
									disabled={resendVerificationMutation.isPending}
								>
									<MailIcon className="size-4" />
									{t("table.resendVerification")}
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							{row.original.banned ? (
								<DropdownMenuItem
									onClick={() => {
										NiceModal.show(ConfirmationModal, {
											title: t("unban.title"),
											message: t("unban.message", {
												name: row.original.name,
											}),
											confirmLabel: t("unban.confirm"),
											onConfirm: () =>
												unbanUserMutation.mutate({
													userId: row.original.id,
												}),
										});
									}}
									disabled={unbanUserMutation.isPending}
								>
									<ShieldCheckIcon className="size-4" />
									{t("table.unbanUser")}
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem
									onClick={() => {
										NiceModal.show(OrganizationBanUserModal, {
											userId: row.original.id,
											userName: row.original.name,
										});
									}}
									variant="destructive"
								>
									<ShieldBanIcon className="size-4" />
									{t("table.banUser")}
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: t("remove.title"),
										message: t("remove.message"),
										confirmLabel: t("remove.confirm"),
										destructive: true,
										onConfirm: () =>
											removeUserMutation.mutate({ userId: row.original.id }),
									});
								}}
								variant="destructive"
							>
								<UserXIcon className="size-4" />
								{t("table.removeFromOrg")}
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
			title: t("table.role"),
			options: [
				...MemberRoles.map((role) => ({
					value: role,
					label: t(`roles.${role}` as Parameters<typeof t>[0]),
				})),
				{
					value: "coach",
					label: t("roles.coach"),
				},
				{
					value: "athlete",
					label: t("roles.athlete"),
				},
			],
		},
		{
			key: "emailStatus",
			title: t("table.email"),
			options: [
				{
					value: "verified",
					label: t("emailStatus.verified"),
				},
				{
					value: "pending",
					label: t("emailStatus.pending"),
				},
			],
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.users as OrganizationUser[]) || []}
			emptyMessage={t("table.noUsers")}
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={userFilters}
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
				<OrganizationUsersBulkActions table={table} />
			)}
			rowSelection={rowSelection}
			searchPlaceholder={t("search")}
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			totalCount={data?.total ?? 0}
			toolbarActions={
				<Button
					size="sm"
					onClick={() => NiceModal.show(OrganizationUserFormModal)}
				>
					<PlusIcon className="mr-1.5 h-4 w-4" />
					{t("add")}
				</Button>
			}
		/>
	);
}
