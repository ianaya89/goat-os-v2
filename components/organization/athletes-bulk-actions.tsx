"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { Table } from "@tanstack/react-table";
import type * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import {
	CsvDelimiterModal,
	type DelimiterType,
} from "@/components/csv-delimiter-modal";
import {
	type BulkActionItem,
	DataTableBulkActions,
} from "@/components/ui/custom/data-table";
import type { AthleteStatus } from "@/lib/db/schema/enums";
import { AthleteStatuses } from "@/lib/db/schema/enums";
import { capitalize, downloadCsv, downloadExcel } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export type AthletesBulkActionsProps<T> = {
	table: Table<T>;
};

const statusLabels: Record<string, string> = {
	active: "Active",
	inactive: "Inactive",
};

export function AthletesBulkActions<T extends { id: string }>({
	table,
}: AthletesBulkActionsProps<T>): React.JSX.Element {
	const utils = trpc.useUtils();

	const exportCsv =
		trpc.organization.athlete.exportSelectedToCsv.useMutation();
	const exportExcel =
		trpc.organization.athlete.exportSelectedToExcel.useMutation();
	const bulkDelete = trpc.organization.athlete.bulkDelete.useMutation();
	const bulkUpdateStatus =
		trpc.organization.athlete.bulkUpdateStatus.useMutation();

	const getDelimiterChar = (delimiterType: DelimiterType): string => {
		switch (delimiterType) {
			case "comma":
				return ",";
			case "semicolon":
				return ";";
			case "tab":
				return "\t";
			default:
				return ",";
		}
	};

	const handleExportSelectedToCsv = async (delimiter: DelimiterType) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No athletes selected.");
			return;
		}
		const athleteIds = selectedRows.map((row) => row.original.id);
		try {
			const csv = await exportCsv.mutateAsync({ athleteIds });
			const delimiterChar = getDelimiterChar(delimiter);
			const csvData =
				delimiter === "comma" ? csv : csv.replace(/,/g, delimiterChar);
			downloadCsv(csvData, "athletes.csv");
			toast.success("CSV exported.");
		} catch (_err) {
			toast.error("Failed to export CSV.");
		}
	};

	const handleExportSelectedToExcel = async () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No athletes selected.");
			return;
		}
		const athleteIds = selectedRows.map((row) => row.original.id);
		try {
			const base64 = await exportExcel.mutateAsync({ athleteIds });
			downloadExcel(base64, "athletes.xlsx");
			toast.success("Excel exported.");
		} catch (_err) {
			toast.error("Failed to export Excel.");
		}
	};

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No athletes selected.");
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: "Delete athletes?",
			message: `Are you sure you want to delete ${selectedRows.length} athlete${selectedRows.length > 1 ? "s" : ""}? This action cannot be undone. User accounts will remain in the organization.`,
			confirmLabel: "Delete",
			destructive: true,
			onConfirm: async () => {
				const ids = selectedRows.map((row) => row.original.id);
				try {
					await bulkDelete.mutateAsync({ ids });
					toast.success(
						`${selectedRows.length} athlete${selectedRows.length > 1 ? "s" : ""} deleted.`,
					);
					table.resetRowSelection();
					utils.organization.athlete.list.invalidate();
				} catch (_err) {
					toast.error("Failed to delete athletes.");
				}
			},
		});
	};

	const handleBulkUpdateStatus = async (status: AthleteStatus) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No athletes selected.");
			return;
		}

		const ids = selectedRows.map((row) => row.original.id);
		try {
			await bulkUpdateStatus.mutateAsync({ ids, status });
			toast.success(
				`${selectedRows.length} athlete${selectedRows.length > 1 ? "s" : ""} updated to ${statusLabels[status] || capitalize(status)}.`,
			);
			table.resetRowSelection();
			utils.organization.athlete.list.invalidate();
		} catch (_err) {
			toast.error("Failed to update athletes.");
		}
	};

	const statusActions: BulkActionItem[] = AthleteStatuses.map((status) => ({
		label: `Set to ${statusLabels[status] || capitalize(status)}`,
		onClick: () => handleBulkUpdateStatus(status as AthleteStatus),
	}));

	const actions: BulkActionItem[] = [
		{
			label: "Change status",
			actions: statusActions,
		},
		{
			label: "Export to CSV",
			separator: true,
			onClick: () => {
				NiceModal.show(CsvDelimiterModal, {
					onConfirm: handleExportSelectedToCsv,
				});
			},
		},
		{
			label: "Export to Excel",
			onClick: handleExportSelectedToExcel,
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
