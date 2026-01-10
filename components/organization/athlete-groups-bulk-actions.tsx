"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { Table } from "@tanstack/react-table";
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
	const utils = trpc.useUtils();

	const bulkDelete = trpc.organization.athleteGroup.bulkDelete.useMutation();
	const bulkUpdateActive =
		trpc.organization.athleteGroup.bulkUpdateActive.useMutation();

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No groups selected.");
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: "Delete groups?",
			message: `Are you sure you want to delete ${selectedRows.length} group${selectedRows.length > 1 ? "s" : ""}? Athletes in these groups will not be deleted.`,
			confirmLabel: "Delete",
			destructive: true,
			onConfirm: async () => {
				const ids = selectedRows.map((row) => row.original.id);
				try {
					await bulkDelete.mutateAsync({ ids });
					toast.success(
						`${selectedRows.length} group${selectedRows.length > 1 ? "s" : ""} deleted.`,
					);
					table.resetRowSelection();
					utils.organization.athleteGroup.list.invalidate();
					utils.organization.athleteGroup.listActive.invalidate();
				} catch (_err) {
					toast.error("Failed to delete groups.");
				}
			},
		});
	};

	const handleBulkUpdateActive = async (isActive: boolean) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No groups selected.");
			return;
		}

		const ids = selectedRows.map((row) => row.original.id);
		try {
			await bulkUpdateActive.mutateAsync({ ids, isActive });
			toast.success(
				`${selectedRows.length} group${selectedRows.length > 1 ? "s" : ""} ${isActive ? "activated" : "deactivated"}.`,
			);
			table.resetRowSelection();
			utils.organization.athleteGroup.list.invalidate();
			utils.organization.athleteGroup.listActive.invalidate();
		} catch (_err) {
			toast.error("Failed to update groups.");
		}
	};

	const statusActions: BulkActionItem[] = [
		{
			label: "Set to Active",
			onClick: () => handleBulkUpdateActive(true),
		},
		{
			label: "Set to Inactive",
			onClick: () => handleBulkUpdateActive(false),
		},
	];

	const actions: BulkActionItem[] = [
		{
			label: "Change status",
			actions: statusActions,
		},
		{
			label: "Delete",
			onClick: handleBulkDelete,
			variant: "destructive",
			separator: true,
		},
	];

	return <DataTableBulkActions table={table} actions={actions} />;
}
