"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import {
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { AgeCategoriesModal } from "@/components/organization/age-categories-modal";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ui/category-badge";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { formatBirthYearRange } from "@/lib/format-event";
import { trpc } from "@/trpc/client";

interface AgeCategory {
	id: string;
	organizationId: string;
	name: string;
	displayName: string;
	minBirthYear: number | null;
	maxBirthYear: number | null;
	sortOrder: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export function AgeCategoriesTable(): React.JSX.Element {
	const t = useTranslations("ageCategories");
	const [rowSelection, setRowSelection] = React.useState({});
	const utils = trpc.useUtils();

	const [statusFilter, setStatusFilter] = useQueryState(
		"status",
		parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			shallow: true,
		}),
	);

	const { data, isPending } =
		trpc.organization.sportsEvent.listAgeCategories.useQuery(
			{ includeInactive: true },
			{ placeholderData: (prev) => prev },
		);

	const filteredData = React.useMemo(() => {
		if (!data) return [];
		if (!statusFilter || statusFilter.length === 0) return data;

		return data.filter((category) => {
			const status = category.isActive ? "active" : "inactive";
			return statusFilter.includes(status);
		});
	}, [data, statusFilter]);

	const deleteAgeCategoryMutation =
		trpc.organization.sportsEvent.deleteAgeCategory.useMutation({
			onSuccess: () => {
				toast.success(t("success.deleted"));
				utils.organization.sportsEvent.listAgeCategories.invalidate();
			},
			onError: (error: { message?: string }) => {
				toast.error(error.message || t("error.deleteFailed"));
			},
		});

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
	};

	const ageCategoryFilters: FilterConfig[] = [
		{
			key: "status",
			title: t("table.status"),
			options: [
				{
					value: "active",
					label: t("statuses.active"),
				},
				{
					value: "inactive",
					label: t("statuses.inactive"),
				},
			],
		},
	];

	const columns: ColumnDef<AgeCategory>[] = [
		createSelectionColumn<AgeCategory>(),
		{
			accessorKey: "displayName",
			header: t("table.name"),
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<CategoryBadge name={row.original.name} />
					<span className="font-medium text-foreground">
						{row.original.displayName}
					</span>
				</div>
			),
		},
		{
			id: "birthYearRange",
			header: t("table.birthYearRange"),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{formatBirthYearRange(
						row.original.minBirthYear,
						row.original.maxBirthYear,
					)}
				</span>
			),
		},
		{
			accessorKey: "isActive",
			header: t("table.status"),
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
								<span className="sr-only">{t("table.openMenu")}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(AgeCategoriesModal, {
										ageCategory: row.original,
									});
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								{t("table.edit")}
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
											deleteAgeCategoryMutation.mutate({ id: row.original.id }),
									});
								}}
								variant="destructive"
							>
								<Trash2Icon className="mr-2 size-4" />
								{t("table.delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(filteredData as AgeCategory[] | undefined) || []}
			emptyMessage={t("table.noCategories")}
			enableFilters
			enableRowSelection
			filters={ageCategoryFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onRowSelectionChange={setRowSelection}
			rowSelection={rowSelection}
			toolbarActions={
				<Button onClick={() => NiceModal.show(AgeCategoriesModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					{t("add")}
				</Button>
			}
			totalCount={filteredData?.length ?? 0}
		/>
	);
}
