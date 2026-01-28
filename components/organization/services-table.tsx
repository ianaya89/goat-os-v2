"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
	DollarSignIcon,
	HistoryIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { ServiceModal } from "@/components/organization/service-modal";
import { ServicePriceHistoryModal } from "@/components/organization/service-price-history-modal";
import { ServicePriceUpdateModal } from "@/components/organization/service-price-update-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/custom/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appConfig } from "@/config/app.config";
import type { ServiceStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const statusColors: Record<ServiceStatus, string> = {
	active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	archived: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

type ServiceRow = {
	id: string;
	name: string;
	description: string | null;
	currentPrice: number;
	currency: string;
	status: ServiceStatus;
	sortOrder: number;
	createdAt: Date;
};

export function ServicesTable(): React.JSX.Element {
	const t = useTranslations("finance.services");
	const utils = trpc.useUtils();

	const [searchQuery, setSearchQuery] = useQueryState("q", {
		defaultValue: "",
		shallow: true,
	});
	const [pageIndex, setPageIndex] = useQueryState("page", {
		defaultValue: 0,
		parse: Number,
		shallow: true,
	});

	const pageSize = appConfig.pagination.defaultLimit;

	const { data, isPending } = trpc.organization.service.list.useQuery(
		{
			limit: pageSize,
			offset: (pageIndex || 0) * pageSize,
			query: searchQuery || "",
		},
		{ placeholderData: (prev) => prev },
	);

	const deleteMutation = trpc.organization.service.delete.useMutation({
		onSuccess: (result) => {
			if (result.archived) {
				toast.success(t("success.updated"));
			} else {
				toast.success(t("success.deleted"));
			}
			utils.organization.service.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || t("error.deleteFailed"));
		},
	});

	const formatPrice = (price: number, currency: string) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(price / 100);
	};

	const columns: ColumnDef<ServiceRow>[] = React.useMemo(
		() => [
			{
				accessorKey: "name",
				header: t("table.name"),
				cell: ({ row }) => (
					<div>
						<p className="font-medium">{row.original.name}</p>
						{row.original.description && (
							<p className="text-xs text-muted-foreground truncate max-w-[200px]">
								{row.original.description}
							</p>
						)}
					</div>
				),
			},
			{
				accessorKey: "currentPrice",
				header: t("table.currentPrice"),
				cell: ({ row }) => (
					<span className="font-medium">
						{formatPrice(row.original.currentPrice, row.original.currency)}
					</span>
				),
			},
			{
				accessorKey: "status",
				header: t("table.status"),
				cell: ({ row }) => (
					<Badge
						variant="outline"
						className={cn(
							"border-none px-2 py-0.5 font-medium text-xs shadow-none",
							statusColors[row.original.status],
						)}
					>
						{t(`status.${row.original.status}`)}
					</Badge>
				),
			},
			{
				id: "actions",
				header: t("table.actions"),
				cell: ({ row }) => (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">{t("table.openMenu")}</span>
								<MoreHorizontalIcon className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() =>
									NiceModal.show(ServiceModal, {
										service: row.original,
									})
								}
							>
								<PencilIcon className="mr-2 size-4" />
								{t("edit")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() =>
									NiceModal.show(ServicePriceUpdateModal, {
										service: row.original,
									})
								}
							>
								<DollarSignIcon className="mr-2 size-4" />
								{t("priceUpdate.title")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() =>
									NiceModal.show(ServicePriceHistoryModal, {
										service: row.original,
									})
								}
							>
								<HistoryIcon className="mr-2 size-4" />
								{t("priceHistory.title")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								variant="destructive"
								onClick={() =>
									NiceModal.show(ConfirmationModal, {
										title: t("deleteConfirm.title"),
										message: t("deleteConfirm.message"),
										confirmLabel: t("deleteConfirm.confirm"),
										destructive: true,
										onConfirm: () =>
											deleteMutation.mutate({ id: row.original.id }),
									})
								}
							>
								<Trash2Icon className="mr-2 size-4" />
								{t("delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
			},
		],
		[t, deleteMutation],
	);

	return (
		<DataTable
			data={(data?.items as ServiceRow[]) ?? []}
			columns={columns}
			totalCount={data?.total ?? 0}
			loading={isPending}
			enableSearch
			searchQuery={searchQuery ?? ""}
			onSearchQueryChange={setSearchQuery}
			searchPlaceholder={t("search")}
			pageIndex={pageIndex ?? 0}
			onPageIndexChange={setPageIndex}
			pageSize={pageSize}
			enablePagination
			emptyMessage={t("table.noServices")}
			toolbarActions={
				<Button size="sm" onClick={() => NiceModal.show(ServiceModal)}>
					<PlusIcon className="mr-1.5 h-4 w-4" />
					{t("add")}
				</Button>
			}
		/>
	);
}
