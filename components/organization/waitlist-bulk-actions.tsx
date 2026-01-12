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
import { WaitlistPriority } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

export type WaitlistBulkActionsProps<T> = {
	table: Table<T>;
};

const priorityLabels: Record<WaitlistPriority, string> = {
	[WaitlistPriority.high]: "Alta",
	[WaitlistPriority.medium]: "Media",
	[WaitlistPriority.low]: "Baja",
};

export function WaitlistBulkActions<T extends { id: string }>({
	table,
}: WaitlistBulkActionsProps<T>): React.JSX.Element {
	const utils = trpc.useUtils();

	const bulkDelete = trpc.organization.waitlist.bulkDelete.useMutation();
	const bulkUpdatePriority =
		trpc.organization.waitlist.bulkUpdatePriority.useMutation();

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No hay entradas seleccionadas.");
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: "Cancelar entradas?",
			message: `Esta seguro que desea cancelar ${selectedRows.length} entrada${selectedRows.length > 1 ? "s" : ""} de la lista de espera?`,
			confirmLabel: "Cancelar entradas",
			destructive: true,
			onConfirm: async () => {
				const ids = selectedRows.map((row) => row.original.id);
				try {
					await bulkDelete.mutateAsync({ ids });
					toast.success(
						`${selectedRows.length} entrada${selectedRows.length > 1 ? "s" : ""} cancelada${selectedRows.length > 1 ? "s" : ""}.`,
					);
					table.resetRowSelection();
					utils.organization.waitlist.list.invalidate();
				} catch (_err) {
					toast.error("Error al cancelar entradas.");
				}
			},
		});
	};

	const handleBulkUpdatePriority = async (priority: WaitlistPriority) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No hay entradas seleccionadas.");
			return;
		}

		const ids = selectedRows.map((row) => row.original.id);
		try {
			await bulkUpdatePriority.mutateAsync({ ids, priority });
			toast.success(
				`Prioridad actualizada a "${priorityLabels[priority]}" para ${selectedRows.length} entrada${selectedRows.length > 1 ? "s" : ""}.`,
			);
			table.resetRowSelection();
			utils.organization.waitlist.list.invalidate();
		} catch (_err) {
			toast.error("Error al actualizar prioridad.");
		}
	};

	const priorityActions: BulkActionItem[] = [
		{
			label: "Alta",
			onClick: () => handleBulkUpdatePriority(WaitlistPriority.high),
		},
		{
			label: "Media",
			onClick: () => handleBulkUpdatePriority(WaitlistPriority.medium),
		},
		{
			label: "Baja",
			onClick: () => handleBulkUpdatePriority(WaitlistPriority.low),
		},
	];

	const actions: BulkActionItem[] = [
		{
			label: "Cambiar prioridad",
			actions: priorityActions,
		},
		{
			label: "Cancelar",
			onClick: handleBulkDelete,
			variant: "destructive",
			separator: true,
		},
	];

	return <DataTableBulkActions table={table} actions={actions} />;
}
