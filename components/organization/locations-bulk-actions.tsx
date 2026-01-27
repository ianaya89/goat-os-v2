"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { Table } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import {
	type BulkActionItem,
	DataTableBulkActions,
} from "@/components/ui/custom/data-table";
import { trpc } from "@/trpc/client";

export type LocationsBulkActionsProps<T> = {
	table: Table<T>;
};

export function LocationsBulkActions<T extends { id: string }>({
	table,
}: LocationsBulkActionsProps<T>): React.JSX.Element {
	const t = useTranslations("locations");
	const utils = trpc.useUtils();

	const bulkDelete = trpc.organization.location.bulkDelete.useMutation();
	const bulkUpdateActive =
		trpc.organization.location.bulkUpdateActive.useMutation();

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error(t("bulkActions.noSelected"));
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: t("bulkDelete.title"),
			message: t("bulkDelete.message", { count: selectedRows.length }),
			confirmLabel: t("bulkDelete.confirm"),
			destructive: true,
			onConfirm: async () => {
				const ids = selectedRows.map((row) => row.original.id);
				try {
					await bulkDelete.mutateAsync({ ids });
					toast.success(
						t("bulkActions.deleted", { count: selectedRows.length }),
					);
					table.resetRowSelection();
					utils.organization.location.list.invalidate();
					utils.organization.location.listActive.invalidate();
				} catch (_err) {
					toast.error(t("bulkActions.deleteFailed"));
				}
			},
		});
	};

	const handleBulkUpdateActive = async (isActive: boolean) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error(t("bulkActions.noSelected"));
			return;
		}

		const ids = selectedRows.map((row) => row.original.id);
		try {
			await bulkUpdateActive.mutateAsync({ ids, isActive });
			toast.success(
				isActive
					? t("bulkActions.activated", { count: selectedRows.length })
					: t("bulkActions.deactivated", { count: selectedRows.length }),
			);
			table.resetRowSelection();
			utils.organization.location.list.invalidate();
			utils.organization.location.listActive.invalidate();
		} catch (_err) {
			toast.error(t("bulkActions.updateFailed"));
		}
	};

	const statusActions: BulkActionItem[] = [
		{
			label: t("bulkActions.setActive"),
			onClick: () => handleBulkUpdateActive(true),
		},
		{
			label: t("bulkActions.setInactive"),
			onClick: () => handleBulkUpdateActive(false),
		},
	];

	const actions: BulkActionItem[] = [
		{
			label: t("bulkActions.changeStatus"),
			actions: statusActions,
		},
		{
			label: t("bulkActions.delete"),
			onClick: handleBulkDelete,
			variant: "destructive",
			separator: true,
		},
	];

	return <DataTableBulkActions table={table} actions={actions} />;
}
