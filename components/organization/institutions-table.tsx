"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import {
	FlagIcon,
	MapPinIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	ShieldIcon,
	TrashIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { InstitutionModal } from "@/components/organization/institution-modal";
import { InstitutionsBulkActions } from "@/components/organization/institutions-bulk-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	createSelectionColumn,
	DataTable,
	type FilterConfig,
} from "@/components/ui/custom/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/trpc/client";

interface Institution {
	id: string;
	type: "club" | "nationalTeam";
	name: string;
	country: string | null;
	city: string | null;
	category: string | null;
	shortName: string | null;
	website: string | null;
	notes: string | null;
	logoKey: string | null;
	logoUrl: string | null;
	createdAt: Date;
}

/**
 * Get initials from institution name or shortName (max 3 characters)
 */
function getInitials(institution: Institution): string {
	// Prefer shortName if available
	if (institution.shortName) {
		return institution.shortName.slice(0, 3).toUpperCase();
	}
	// Otherwise, get first letters of words from name
	return institution.name
		.split(" ")
		.map((word) => word[0])
		.filter(Boolean)
		.slice(0, 3)
		.join("")
		.toUpperCase();
}

export function InstitutionsTable(): React.JSX.Element {
	const t = useTranslations("institutions");
	const tCommon = useTranslations("common");
	const utils = trpc.useUtils();

	const [rowSelection, setRowSelection] = React.useState({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [searchQuery, setSearchQuery] = React.useState("");

	// Get the type filter value from column filters
	const typeFilter = React.useMemo(() => {
		const filter = columnFilters.find((f) => f.id === "type");
		const values = Array.isArray(filter?.value)
			? (filter.value as string[])
			: [];
		if (values.length === 1) {
			return values[0] as "club" | "nationalTeam";
		}
		return "all" as const;
	}, [columnFilters]);

	const { data, isPending } = trpc.organization.institution.list.useQuery({
		type: typeFilter,
	});

	// Filter data by search query (client-side filtering for simplicity)
	const filteredData = React.useMemo(() => {
		if (!data) return [];
		if (!searchQuery.trim()) return data;

		const query = searchQuery.toLowerCase().trim();
		return data.filter(
			(item) =>
				item.name.toLowerCase().includes(query) ||
				item.shortName?.toLowerCase().includes(query),
		);
	}, [data, searchQuery]);

	// Filter config for the type column
	const filters: FilterConfig[] = React.useMemo(
		() => [
			{
				key: "type",
				title: t("filterByType"),
				singleSelect: true,
				options: [
					{
						value: "club",
						label: t("club.label"),
						icon: ShieldIcon,
					},
					{
						value: "nationalTeam",
						label: t("nationalTeam.label"),
						icon: FlagIcon,
					},
				],
			},
		],
		[t],
	);

	const deleteClubMutation =
		trpc.organization.institution.deleteClub.useMutation({
			onSuccess: () => {
				toast.success(t("club.deleteSuccess"));
				utils.organization.institution.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteNationalTeamMutation =
		trpc.organization.institution.deleteNationalTeam.useMutation({
			onSuccess: () => {
				toast.success(t("nationalTeam.deleteSuccess"));
				utils.organization.institution.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const handleDelete = (institution: Institution) => {
		NiceModal.show(ConfirmationModal, {
			title: t("deleteConfirmTitle"),
			message: t("deleteConfirmMessage", { name: institution.name }),
			confirmLabel: tCommon("delete"),
			destructive: true,
			onConfirm: () => {
				if (institution.type === "club") {
					deleteClubMutation.mutate({ id: institution.id });
				} else {
					deleteNationalTeamMutation.mutate({ id: institution.id });
				}
			},
		});
	};

	const columns: ColumnDef<Institution>[] = [
		createSelectionColumn<Institution>(),
		{
			accessorKey: "name",
			header: t("name"),
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<Avatar className="size-9 shrink-0">
						{row.original.logoUrl && (
							<AvatarImage src={row.original.logoUrl} alt={row.original.name} />
						)}
						<AvatarFallback
							className={
								row.original.type === "club"
									? "bg-blue-100 text-blue-700 text-xs font-semibold dark:bg-blue-900 dark:text-blue-300"
									: "bg-amber-100 text-amber-700 text-xs font-semibold dark:bg-amber-900 dark:text-amber-300"
							}
						>
							{getInitials(row.original)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex flex-col gap-0.5">
						<span className="font-medium text-foreground truncate">
							{row.original.name}
						</span>
						{row.original.category && (
							<span className="text-muted-foreground text-xs truncate">
								{row.original.category}
							</span>
						)}
					</div>
				</div>
			),
		},
		{
			accessorKey: "shortName",
			header: t("shortName"),
			cell: ({ row }) => {
				if (!row.original.shortName) {
					return <span className="text-muted-foreground">-</span>;
				}
				return (
					<span className="text-sm font-medium">{row.original.shortName}</span>
				);
			},
		},
		{
			accessorKey: "type",
			header: t("type"),
			cell: ({ row }) => (
				<Badge
					variant="outline"
					className={
						row.original.type === "club"
							? "gap-1.5 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
							: "gap-1.5 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
					}
				>
					{row.original.type === "club" ? (
						<>
							<ShieldIcon className="size-3" />
							{t("club.label")}
						</>
					) : (
						<>
							<FlagIcon className="size-3" />
							{t("nationalTeam.label")}
						</>
					)}
				</Badge>
			),
		},
		{
			accessorKey: "location",
			header: t("location"),
			cell: ({ row }) => {
				const parts = [];
				if (row.original.city) parts.push(row.original.city);
				if (row.original.country) parts.push(row.original.country);

				if (parts.length === 0) {
					return <span className="text-muted-foreground">-</span>;
				}

				return (
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<MapPinIcon className="size-3.5" />
						<span className="text-sm">{parts.join(", ")}</span>
					</div>
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
								<span className="sr-only">{t("openMenu")}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(InstitutionModal, {
										institution: row.original,
									});
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								{row.original.type === "club"
									? t("club.edit")
									: t("nationalTeam.edit")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => handleDelete(row.original)}
								variant="destructive"
							>
								<TrashIcon className="mr-2 size-4" />
								{row.original.type === "club"
									? t("club.delete")
									: t("nationalTeam.delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	return (
		<DataTable
			columns={columns}
			columnFilters={columnFilters}
			data={(filteredData as Institution[]) || []}
			emptyMessage={t("emptyMessage")}
			enableFilters
			enableRowSelection
			enableSearch
			filters={filters}
			loading={isPending}
			onFiltersChange={setColumnFilters}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={setSearchQuery}
			renderBulkActions={(table) => <InstitutionsBulkActions table={table} />}
			rowSelection={rowSelection}
			searchPlaceholder={t("searchPlaceholder")}
			searchQuery={searchQuery}
			toolbarActions={
				<Button onClick={() => NiceModal.show(InstitutionModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					{t("addButton")}
				</Button>
			}
			totalCount={filteredData?.length ?? 0}
		/>
	);
}
