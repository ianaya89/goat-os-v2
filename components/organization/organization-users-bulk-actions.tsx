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

interface OrganizationUser {
	id: string;
}

export type OrganizationUsersBulkActionsProps<T extends OrganizationUser> = {
	table: Table<T>;
};

export function OrganizationUsersBulkActions<T extends OrganizationUser>({
	table,
}: OrganizationUsersBulkActionsProps<T>): React.JSX.Element {
	const t = useTranslations("users");
	const utils = trpc.useUtils();

	const bulkRemove = trpc.organization.user.bulkRemove.useMutation();

	const handleBulkRemove = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error(t("bulkActions.noSelected"));
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: t("bulkRemove.title"),
			message: t("bulkRemove.message", { count: selectedRows.length }),
			confirmLabel: t("bulkRemove.confirm"),
			destructive: true,
			onConfirm: async () => {
				const userIds = selectedRows.map((row) => row.original.id);
				try {
					await bulkRemove.mutateAsync({ userIds });
					toast.success(
						t("bulkActions.removed", { count: selectedRows.length }),
					);
					table.resetRowSelection();
					utils.organization.user.list.invalidate();
				} catch (_err) {
					toast.error(t("bulkActions.removeFailed"));
				}
			},
		});
	};

	const actions: BulkActionItem[] = [
		{
			label: t("bulkActions.remove"),
			onClick: handleBulkRemove,
			variant: "destructive",
		},
	];

	return <DataTableBulkActions table={table} actions={actions} />;
}
