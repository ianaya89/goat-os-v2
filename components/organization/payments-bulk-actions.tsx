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
	type TrainingPaymentStatus,
	TrainingPaymentStatuses,
} from "@/lib/db/schema/enums";
import { capitalize } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export type PaymentsBulkActionsProps<T> = {
	table: Table<T>;
};

export function PaymentsBulkActions<T extends { id: string }>({
	table,
}: PaymentsBulkActionsProps<T>): React.JSX.Element {
	const utils = trpc.useUtils();

	const bulkDelete = trpc.organization.trainingPayment.bulkDelete.useMutation();
	const bulkUpdateStatus =
		trpc.organization.trainingPayment.bulkUpdateStatus.useMutation();

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No payments selected.");
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: "Delete payments?",
			message: `Are you sure you want to delete ${selectedRows.length} payment${selectedRows.length > 1 ? "s" : ""}? This action cannot be undone.`,
			confirmLabel: "Delete",
			destructive: true,
			onConfirm: async () => {
				const ids = selectedRows.map((row) => row.original.id);
				try {
					await bulkDelete.mutateAsync({ ids });
					toast.success(
						`${selectedRows.length} payment${selectedRows.length > 1 ? "s" : ""} deleted.`,
					);
					table.resetRowSelection();
					utils.organization.trainingPayment.list.invalidate();
				} catch (_err) {
					toast.error("Failed to delete payments.");
				}
			},
		});
	};

	const handleBulkUpdateStatus = async (status: TrainingPaymentStatus) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No payments selected.");
			return;
		}

		const ids = selectedRows.map((row) => row.original.id);
		try {
			await bulkUpdateStatus.mutateAsync({ ids, status });
			toast.success(
				`${selectedRows.length} payment${selectedRows.length > 1 ? "s" : ""} updated to ${capitalize(status)}.`,
			);
			table.resetRowSelection();
			utils.organization.trainingPayment.list.invalidate();
		} catch (_err) {
			toast.error("Failed to update payments.");
		}
	};

	const statusActions: BulkActionItem[] = TrainingPaymentStatuses.map(
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
