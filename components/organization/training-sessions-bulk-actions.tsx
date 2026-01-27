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
	const t = useTranslations("training.bulk");
	const utils = trpc.useUtils();

	const bulkDelete = trpc.organization.trainingSession.bulkDelete.useMutation();
	const bulkUpdateStatus =
		trpc.organization.trainingSession.bulkUpdateStatus.useMutation();

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error(t("noSessionsSelected"));
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: t("deleteTitle"),
			message: t("deleteMessage", { count: selectedRows.length }),
			confirmLabel: t("delete"),
			destructive: true,
			onConfirm: async () => {
				const ids = selectedRows.map((row) => row.original.id);
				try {
					await bulkDelete.mutateAsync({ ids });
					toast.success(t("deleted", { count: selectedRows.length }));
					table.resetRowSelection();
					utils.organization.trainingSession.list.invalidate();
				} catch (_err) {
					toast.error(t("deleteFailed"));
				}
			},
		});
	};

	const handleBulkUpdateStatus = async (status: TrainingSessionStatus) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error(t("noSessionsSelected"));
			return;
		}

		const ids = selectedRows.map((row) => row.original.id);
		try {
			await bulkUpdateStatus.mutateAsync({ ids, status });
			toast.success(
				t("statusUpdated", {
					count: selectedRows.length,
					status: capitalize(status),
				}),
			);
			table.resetRowSelection();
			utils.organization.trainingSession.list.invalidate();
		} catch (_err) {
			toast.error(t("statusUpdateFailed"));
		}
	};

	const statusActions: BulkActionItem[] = TrainingSessionStatuses.map(
		(status) => ({
			label: t("setTo", { status: capitalize(status) }),
			onClick: () => handleBulkUpdateStatus(status),
		}),
	);

	const actions: BulkActionItem[] = [
		{
			label: t("changeStatus"),
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
