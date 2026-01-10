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

export type LocationsBulkActionsProps<T> = {
	table: Table<T>;
};

export function LocationsBulkActions<T extends { id: string }>({
	table,
}: LocationsBulkActionsProps<T>): React.JSX.Element {
	const utils = trpc.useUtils();

	const bulkDelete = trpc.organization.location.bulkDelete.useMutation();
	const bulkUpdateActive =
		trpc.organization.location.bulkUpdateActive.useMutation();

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No locations selected.");
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: "Delete locations?",
			message: `Are you sure you want to delete ${selectedRows.length} location${selectedRows.length > 1 ? "s" : ""}? This action cannot be undone.`,
			confirmLabel: "Delete",
			destructive: true,
			onConfirm: async () => {
				const ids = selectedRows.map((row) => row.original.id);
				try {
					await bulkDelete.mutateAsync({ ids });
					toast.success(
						`${selectedRows.length} location${selectedRows.length > 1 ? "s" : ""} deleted.`,
					);
					table.resetRowSelection();
					utils.organization.location.list.invalidate();
					utils.organization.location.listActive.invalidate();
				} catch (_err) {
					toast.error("Failed to delete locations.");
				}
			},
		});
	};

	const handleBulkUpdateActive = async (isActive: boolean) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No locations selected.");
			return;
		}

		const ids = selectedRows.map((row) => row.original.id);
		try {
			await bulkUpdateActive.mutateAsync({ ids, isActive });
			toast.success(
				`${selectedRows.length} location${selectedRows.length > 1 ? "s" : ""} ${isActive ? "activated" : "deactivated"}.`,
			);
			table.resetRowSelection();
			utils.organization.location.list.invalidate();
			utils.organization.location.listActive.invalidate();
		} catch (_err) {
			toast.error("Failed to update locations.");
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
