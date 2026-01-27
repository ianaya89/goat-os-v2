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

export type AthleteGroupsBulkActionsProps<T> = {
	table: Table<T>;
};

export function AthleteGroupsBulkActions<T extends { id: string }>({
	table,
}: AthleteGroupsBulkActionsProps<T>): React.JSX.Element {
	const t = useTranslations("athletes.groups");
	const utils = trpc.useUtils();

	const bulkDelete = trpc.organization.athleteGroup.bulkDelete.useMutation();
	const bulkUpdateActive =
		trpc.organization.athleteGroup.bulkUpdateActive.useMutation();

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
					utils.organization.athleteGroup.list.invalidate();
					utils.organization.athleteGroup.listActive.invalidate();
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
			utils.organization.athleteGroup.list.invalidate();
			utils.organization.athleteGroup.listActive.invalidate();
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
