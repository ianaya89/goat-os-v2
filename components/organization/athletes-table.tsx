"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	ArchiveIcon,
	ArchiveRestoreIcon,
	CheckCircle2Icon,
	ClockIcon,
	EyeIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	UserXIcon,
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
import { AthletesBulkActions } from "@/components/organization/athletes-bulk-actions";
import { AthletesModal } from "@/components/organization/athletes-modal";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { LevelBadge } from "@/components/ui/level-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user/user-avatar";
import { appConfig } from "@/config/app.config";
import type {
	AthleteLevel,
	AthleteSport,
	AthleteStatus,
} from "@/lib/db/schema/enums";
import {
	AthleteLevels,
	AthleteSports,
	AthleteStatuses,
} from "@/lib/db/schema/enums";
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
	phone: string | null;
	isPublicProfile: boolean;
	createdAt: Date;
	updatedAt: Date;
	archivedAt: Date | null;
	user: {
		id: string;
		name: string;
		email: string;
		image: string | null;
		imageKey: string | null;
		emailVerified: boolean;
	} | null;
	groups?: AthleteGroup[];
}

export type AthletesTableMode = "admin" | "coach";

interface AthletesTableProps {
	/** Mode determines permissions and data scope */
	mode?: AthletesTableMode;
	/** Optional toolbar actions to render */
	toolbarActions?: React.ReactNode;
}

export function AthletesTable({
	mode = "admin",
	toolbarActions,
}: AthletesTableProps): React.JSX.Element {
	const t = useTranslations("athletes");
	const tCommon = useTranslations("common.sports");
	const tCommonButtons = useTranslations("common.buttons");
	const tCommonConfirmation = useTranslations("common.confirmation");
	const tCommonSuccess = useTranslations("common.success");
	const tCommonStatus = useTranslations("common.status");

	// Translation helpers
	const translateSport = (sport: AthleteSport) => {
		// Normalize to lowercase for translation key lookup
		const normalizedSport = sport.toLowerCase() as Parameters<
			typeof tCommon
		>[0];
		return tCommon(normalizedSport);
	};

	const translateLevel = (level: AthleteLevel) => {
		return t(`levels.${level}` as Parameters<typeof t>[0]);
	};

	const translateStatus = (status: AthleteStatus) => {
		return t(`statuses.${status}` as Parameters<typeof t>[0]);
	};
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

	const [sportFilter, setSportFilter] = useQueryState(
		"sport",
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

	// Build columnFilters from URL state
	const columnFilters: ColumnFiltersState = React.useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (statusFilter && statusFilter.length > 0) {
			filters.push({ id: "status", value: statusFilter });
		}
		if (levelFilter && levelFilter.length > 0) {
			filters.push({ id: "level", value: levelFilter });
		}
		if (sportFilter && sportFilter.length > 0) {
			filters.push({ id: "sport", value: sportFilter });
		}
		return filters;
	}, [statusFilter, levelFilter, sportFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("status"));
		setLevelFilter(getFilterValue("level"));
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
		const sortBy = AthleteSortField.options.includes(
			currentSort.id as AthleteSortField,
		)
			? (currentSort.id as AthleteSortField)
			: "createdAt";
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy, sortOrder };
	}, [sorting]);

	// For coach mode, first get the athlete IDs this coach has access to
	const { data: coachAthleteData, isLoading: isLoadingCoachAthletes } =
		trpc.organization.trainingSession.getMyAthleteIdsAsCoach.useQuery(
			undefined,
			{ enabled: mode === "coach" },
		);

	const coachAthleteIds = coachAthleteData?.athleteIds ?? [];

	const { data, isPending } = trpc.organization.athlete.list.useQuery(
		{
			limit: pageSize || appConfig.pagination.defaultLimit,
			offset:
				(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
			query: searchQuery || "",
			sortBy: sortParams.sortBy,
			sortOrder: sortParams.sortOrder,
			includeArchived: mode === "admin" ? (includeArchived ?? false) : false,
			// In coach mode, filter by the coach's athlete IDs
			athleteIds: mode === "coach" ? coachAthleteIds : undefined,
			filters: {
				status: (statusFilter || []) as ("active" | "inactive")[],
				level: (levelFilter || []) as (
					| "beginner"
					| "intermediate"
					| "advanced"
				)[],
				sport: (sportFilter || []) as (
					| "soccer"
					| "basketball"
					| "tennis"
					| "swimming"
					| "athletics"
					| "volleyball"
					| "rugby"
					| "hockey"
					| "golf"
					| "boxing"
					| "martial_arts"
					| "cycling"
					| "other"
				)[],
			},
		},
		{
			placeholderData: (prev) => prev,
			// In coach mode, wait for athlete IDs before querying
			enabled: mode === "admin" || !isLoadingCoachAthletes,
		},
	);

	const isLoading = isPending || (mode === "coach" && isLoadingCoachAthletes);

	const deleteAthleteMutation = trpc.organization.athlete.delete.useMutation({
		onSuccess: () => {
			toast.success(t("success.deleted"));
			utils.organization.athlete.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || t("error.deleteFailed"));
		},
	});

	const archiveAthleteMutation = trpc.organization.athlete.archive.useMutation({
		onSuccess: () => {
			toast.success(tCommonSuccess("archived"));
			utils.organization.athlete.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const unarchiveAthleteMutation =
		trpc.organization.athlete.unarchive.useMutation({
			onSuccess: () => {
				toast.success(tCommonSuccess("unarchived"));
				utils.organization.athlete.list.invalidate();
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

	const columns: ColumnDef<Athlete>[] = [
		// Selection column only for admin mode
		...(mode === "admin" ? [createSelectionColumn<Athlete>()] : []),
		{
			accessorKey: "name",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.name")} />
			),
			cell: ({ row }) => {
				const name = row.original.user?.name ?? "Unknown";
				const age = calculateAge(row.original.birthDate);
				const isArchived = row.original.archivedAt !== null;
				return (
					<Link
						className="flex items-center gap-3 hover:opacity-80"
						href={`/dashboard/organization/athletes/${row.original.id}`}
					>
						<UserAvatar
							className="size-9 shrink-0"
							name={name}
							src={
								row.original.user?.imageKey ??
								row.original.user?.image ??
								undefined
							}
						/>
						<div className="min-w-0">
							<p className="truncate font-medium text-foreground" title={name}>
								{name}
							</p>
							<div className="flex items-center gap-2">
								{age !== null && (
									<p className="text-muted-foreground text-xs">
										<span className="font-semibold">{age}</span> {t("yearsOld")}
									</p>
								)}
								{isArchived && (
									<Badge variant="secondary" className="text-xs">
										{tCommonStatus("archived")}
									</Badge>
								)}
							</div>
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
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.sport")} />
			),
			cell: ({ row }) => (
				<div className="flex flex-col gap-1">
					<span className="text-sm text-foreground">
						{translateSport(row.original.sport as AthleteSport)}
					</span>
					<LevelBadge level={row.original.level} />
				</div>
			),
		},
		{
			accessorKey: "status",
			header: t("table.status"),
			cell: ({ row }) => (
				<StatusBadge status={row.original.status as AthleteStatus} />
			),
		},
		{
			id: "accountStatus",
			header: t("table.accountStatus"),
			cell: ({ row }) => {
				const user = row.original.user;
				if (!user) {
					return (
						<Tooltip>
							<TooltipTrigger>
								<div className="flex items-center gap-1.5 text-muted-foreground">
									<UserXIcon className="size-4" />
									<span className="text-xs">{t("table.noAccount")}</span>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>{t("table.noAccountTooltip")}</p>
							</TooltipContent>
						</Tooltip>
					);
				}
				if (user.emailVerified) {
					return (
						<Tooltip>
							<TooltipTrigger>
								<div className="flex items-center gap-1.5 text-green-600">
									<CheckCircle2Icon className="size-4" />
									<span className="text-xs">{t("table.accountActive")}</span>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>{t("table.accountActiveTooltip")}</p>
							</TooltipContent>
						</Tooltip>
					);
				}
				return (
					<Tooltip>
						<TooltipTrigger>
							<div className="flex items-center gap-1.5 text-amber-600">
								<ClockIcon className="size-4" />
								<span className="text-xs">{t("table.accountPending")}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>{t("table.accountPendingTooltip")}</p>
						</TooltipContent>
					</Tooltip>
				);
			},
		},
		{
			id: "actions",
			enableSorting: false,
			cell: ({ row }) => {
				const isArchived = row.original.archivedAt !== null;

				// Coach mode: only show view button
				if (mode === "coach") {
					return (
						<div className="flex justify-end">
							<Button variant="ghost" size="sm" asChild>
								<Link
									href={`/dashboard/organization/athletes/${row.original.id}`}
								>
									<EyeIcon className="mr-1 size-4" />
									{t("table.viewProfile")}
								</Link>
							</Button>
						</div>
					);
				}

				// Admin mode: full actions menu
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
										href={`/dashboard/organization/athletes/${row.original.id}`}
									>
										<EyeIcon className="mr-2 size-4" />
										{t("table.viewProfile")}
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										NiceModal.show(AthletesModal, { athlete: row.original });
									}}
								>
									<PencilIcon className="mr-2 size-4" />
									{t("edit")}
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
													unarchiveAthleteMutation.mutate({
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
													archiveAthleteMutation.mutate({
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
											title: t("delete.title"),
											message: t("delete.message"),
											confirmLabel: t("delete.confirm"),
											destructive: true,
											onConfirm: () =>
												deleteAthleteMutation.mutate({ id: row.original.id }),
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
				);
			},
		},
	];

	const athleteFilters: FilterConfig[] = [
		{
			key: "status",
			title: t("table.status"),
			options: AthleteStatuses.map((status) => ({
				value: status,
				label: translateStatus(status),
			})),
		},
		{
			key: "level",
			title: t("table.level"),
			options: AthleteLevels.map((level) => ({
				value: level,
				label: translateLevel(level),
			})),
		},
		{
			key: "sport",
			title: t("table.sport"),
			options: AthleteSports.map((sport) => ({
				value: sport,
				label: translateSport(sport),
			})),
		},
	];

	// Admin toolbar with archive toggle and add button
	const adminToolbar = (
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
			<Button onClick={() => NiceModal.show(AthletesModal)} size="sm">
				<PlusIcon className="size-4 shrink-0" />
				{t("add")}
			</Button>
		</div>
	);

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.athletes as Athlete[]) || []}
			emptyMessage={t("table.noAthletes")}
			enableFilters
			enablePagination
			enableRowSelection={mode === "admin"}
			enableSearch
			filters={athleteFilters}
			loading={isLoading}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={mode === "admin" ? setRowSelection : undefined}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			renderBulkActions={
				mode === "admin"
					? (table) => <AthletesBulkActions table={table} />
					: undefined
			}
			rowSelection={mode === "admin" ? rowSelection : {}}
			searchPlaceholder={t("search")}
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			toolbarActions={
				toolbarActions ?? (mode === "admin" ? adminToolbar : null)
			}
			totalCount={data?.total ?? 0}
		/>
	);
}
