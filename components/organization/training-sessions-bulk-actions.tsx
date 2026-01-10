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
import {
	type TrainingSessionStatus,
	TrainingSessionStatuses,
} from "@/lib/db/schema/enums";
import { capitalize } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export type TrainingSessionsBulkActionsProps<T> = {
	table: Table<T>;
};

export function TrainingSessionsBulkActions<T extends { id: string }>({
	table,
}: TrainingSessionsBulkActionsProps<T>): React.JSX.Element {
	const utils = trpc.useUtils();

	const bulkDelete = trpc.organization.trainingSession.bulkDelete.useMutation();
	const bulkUpdateStatus =
		trpc.organization.trainingSession.bulkUpdateStatus.useMutation();

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No sessions selected.");
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: "Delete sessions?",
			message: `Are you sure you want to delete ${selectedRows.length} session${selectedRows.length > 1 ? "s" : ""}? This action cannot be undone.`,
			confirmLabel: "Delete",
			destructive: true,
			onConfirm: async () => {
				const ids = selectedRows.map((row) => row.original.id);
				try {
					await bulkDelete.mutateAsync({ ids });
					toast.success(
						`${selectedRows.length} session${selectedRows.length > 1 ? "s" : ""} deleted.`,
					);
					table.resetRowSelection();
					utils.organization.trainingSession.list.invalidate();
				} catch (_err) {
					toast.error("Failed to delete sessions.");
				}
			},
		});
	};

	const handleBulkUpdateStatus = async (status: TrainingSessionStatus) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No sessions selected.");
			return;
		}

		const ids = selectedRows.map((row) => row.original.id);
		try {
			await bulkUpdateStatus.mutateAsync({ ids, status });
			toast.success(
				`${selectedRows.length} session${selectedRows.length > 1 ? "s" : ""} updated to ${capitalize(status)}.`,
			);
			table.resetRowSelection();
			utils.organization.trainingSession.list.invalidate();
		} catch (_err) {
			toast.error("Failed to update sessions.");
		}
	};

	const statusActions: BulkActionItem[] = TrainingSessionStatuses.map(
		(status) => ({
			label: `Set to ${capitalize(status)}`,
			onClick: () => handleBulkUpdateStatus(status),
		}),
	);

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
