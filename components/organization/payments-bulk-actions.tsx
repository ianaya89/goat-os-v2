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
import {
	type TrainingPaymentStatus,
	TrainingPaymentStatuses,
} from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

export type PaymentsBulkActionsProps<T> = {
	table: Table<T>;
};

export function PaymentsBulkActions<T extends { id: string }>({
	table,
}: PaymentsBulkActionsProps<T>): React.JSX.Element {
	const t = useTranslations("finance.payments");
	const utils = trpc.useUtils();

	const bulkDelete = trpc.organization.trainingPayment.bulkDelete.useMutation();
	const bulkUpdateStatus =
		trpc.organization.trainingPayment.bulkUpdateStatus.useMutation();

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error(t("bulk.noSelected"));
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: t("bulk.deleteTitle"),
			message: t("bulk.deleteMessage", { count: selectedRows.length }),
			confirmLabel: t("deleteConfirm.confirm"),
			destructive: true,
			onConfirm: async () => {
				const ids = selectedRows.map((row) => row.original.id);
				try {
					await bulkDelete.mutateAsync({ ids });
					toast.success(t("bulk.deleted", { count: selectedRows.length }));
					table.resetRowSelection();
					utils.organization.trainingPayment.invalidate();
				} catch (_err) {
					toast.error(t("bulk.deleteFailed"));
				}
			},
		});
	};

	const handleBulkUpdateStatus = async (status: TrainingPaymentStatus) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error(t("bulk.noSelected"));
			return;
		}

		const ids = selectedRows.map((row) => row.original.id);
		try {
			await bulkUpdateStatus.mutateAsync({ ids, status });
			toast.success(
				t("bulk.updated", {
					count: selectedRows.length,
					status: t(`status.${status}`),
				}),
			);
			table.resetRowSelection();
			utils.organization.trainingPayment.invalidate();
		} catch (_err) {
			toast.error(t("bulk.updateFailed"));
		}
	};

	const statusActions: BulkActionItem[] = TrainingPaymentStatuses.map(
		(status) => ({
			label: t("bulk.setTo", { status: t(`status.${status}`) }),
			onClick: () => handleBulkUpdateStatus(status),
		}),
	);

	const actions: BulkActionItem[] = [
		{
			label: t("bulk.changeStatus"),
			actions: statusActions,
		},
		{
			label: t("delete"),
			onClick: handleBulkDelete,
			variant: "destructive",
			separator: true,
		},
	];

	return <DataTableBulkActions table={table} actions={actions} />;
}
