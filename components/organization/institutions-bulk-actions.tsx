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

interface Institution {
	id: string;
	type: "club" | "nationalTeam";
}

export type InstitutionsBulkActionsProps<T extends Institution> = {
	table: Table<T>;
};

export function InstitutionsBulkActions<T extends Institution>({
	table,
}: InstitutionsBulkActionsProps<T>): React.JSX.Element {
	const t = useTranslations("institutions");
	const utils = trpc.useUtils();

	const bulkDeleteClubs =
		trpc.organization.institution.bulkDeleteClubs.useMutation();
	const bulkDeleteNationalTeams =
		trpc.organization.institution.bulkDeleteNationalTeams.useMutation();

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error(t("bulkActions.noSelected"));
			return;
		}

		// Separate clubs and national teams
		const clubs = selectedRows.filter((row) => row.original.type === "club");
		const nationalTeams = selectedRows.filter(
			(row) => row.original.type === "nationalTeam",
		);

		NiceModal.show(ConfirmationModal, {
			title: t("bulkDelete.title"),
			message: t("bulkDelete.message", { count: selectedRows.length }),
			confirmLabel: t("bulkDelete.confirm"),
			destructive: true,
			onConfirm: async () => {
				try {
					const promises: Promise<unknown>[] = [];

					if (clubs.length > 0) {
						promises.push(
							bulkDeleteClubs.mutateAsync({
								ids: clubs.map((row) => row.original.id),
							}),
						);
					}

					if (nationalTeams.length > 0) {
						promises.push(
							bulkDeleteNationalTeams.mutateAsync({
								ids: nationalTeams.map((row) => row.original.id),
							}),
						);
					}

					await Promise.all(promises);

					toast.success(
						t("bulkActions.deleted", { count: selectedRows.length }),
					);
					table.resetRowSelection();
					utils.organization.institution.list.invalidate();
				} catch (_err) {
					toast.error(t("bulkActions.deleteFailed"));
				}
			},
		});
	};

	const actions: BulkActionItem[] = [
		{
			label: t("bulkActions.delete"),
			onClick: handleBulkDelete,
			variant: "destructive",
		},
	];

	return <DataTableBulkActions table={table} actions={actions} />;
}
