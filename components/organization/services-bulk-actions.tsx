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
import { ServiceStatus } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

interface Service {
	id: string;
}

export type ServicesBulkActionsProps<T extends Service> = {
	table: Table<T>;
};

export function ServicesBulkActions<T extends Service>({
	table,
}: ServicesBulkActionsProps<T>): React.JSX.Element {
	const t = useTranslations("finance.services");
	const utils = trpc.useUtils();

	const bulkDelete = trpc.organization.service.bulkDelete.useMutation();
	const bulkUpdateStatus =
		trpc.organization.service.bulkUpdateStatus.useMutation();

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
					const result = await bulkDelete.mutateAsync({ ids });
					const total = result.deletedCount + result.archivedCount;
					if (result.archivedCount > 0 && result.deletedCount > 0) {
						toast.success(
							t("bulkActions.deletedAndArchived", {
								deleted: result.deletedCount,
								archived: result.archivedCount,
							}),
						);
					} else if (result.archivedCount > 0) {
						toast.success(
							t("bulkActions.archived", { count: result.archivedCount }),
						);
					} else {
						toast.success(t("bulkActions.deleted", { count: total }));
					}
					table.resetRowSelection();
					utils.organization.service.invalidate();
				} catch (_err) {
					toast.error(t("bulkActions.deleteFailed"));
				}
			},
		});
	};

	const handleBulkUpdateStatus = async (status: ServiceStatus) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error(t("bulkActions.noSelected"));
			return;
		}

		const ids = selectedRows.map((row) => row.original.id);
		try {
			await bulkUpdateStatus.mutateAsync({ ids, status });
			toast.success(
				t("bulkActions.statusUpdated", { count: selectedRows.length }),
			);
			table.resetRowSelection();
			utils.organization.service.invalidate();
		} catch (_err) {
			toast.error(t("bulkActions.updateFailed"));
		}
	};

	const statusActions: BulkActionItem[] = [
		{
			label: t("bulkActions.setActive"),
			onClick: () => handleBulkUpdateStatus(ServiceStatus.active),
		},
		{
			label: t("bulkActions.setInactive"),
			onClick: () => handleBulkUpdateStatus(ServiceStatus.inactive),
		},
		{
			label: t("bulkActions.setArchived"),
			onClick: () => handleBulkUpdateStatus(ServiceStatus.archived),
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
