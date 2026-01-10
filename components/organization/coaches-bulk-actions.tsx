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
import type { CoachStatus } from "@/lib/db/schema/enums";
import { CoachStatuses } from "@/lib/db/schema/enums";
import { capitalize, downloadCsv, downloadExcel } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export type CoachesBulkActionsProps<T> = {
	table: Table<T>;
};

const statusLabels: Record<string, string> = {
	active: "Active",
	inactive: "Inactive",
};

export function CoachesBulkActions<T extends { id: string }>({
	table,
}: CoachesBulkActionsProps<T>): React.JSX.Element {
	const utils = trpc.useUtils();

	const exportCsv = trpc.organization.coach.exportSelectedToCsv.useMutation();
	const exportExcel =
		trpc.organization.coach.exportSelectedToExcel.useMutation();
	const bulkDelete = trpc.organization.coach.bulkDelete.useMutation();
	const bulkUpdateStatus =
		trpc.organization.coach.bulkUpdateStatus.useMutation();

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
			toast.error("No coaches selected.");
			return;
		}
		const coachIds = selectedRows.map((row) => row.original.id);
		try {
			const csv = await exportCsv.mutateAsync({ coachIds });
			const delimiterChar = getDelimiterChar(delimiter);
			const csvData =
				delimiter === "comma" ? csv : csv.replace(/,/g, delimiterChar);
			downloadCsv(csvData, "coaches.csv");
			toast.success("CSV exported.");
		} catch (_err) {
			toast.error("Failed to export CSV.");
		}
	};

	const handleExportSelectedToExcel = async () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No coaches selected.");
			return;
		}
		const coachIds = selectedRows.map((row) => row.original.id);
		try {
			const base64 = await exportExcel.mutateAsync({ coachIds });
			downloadExcel(base64, "coaches.xlsx");
			toast.success("Excel exported.");
		} catch (_err) {
			toast.error("Failed to export Excel.");
		}
	};

	const handleBulkDelete = () => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No coaches selected.");
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: "Delete coaches?",
			message: `Are you sure you want to delete ${selectedRows.length} coach${selectedRows.length > 1 ? "es" : ""}? This action cannot be undone. User accounts will remain in the organization.`,
			confirmLabel: "Delete",
			destructive: true,
			onConfirm: async () => {
				const ids = selectedRows.map((row) => row.original.id);
				try {
					await bulkDelete.mutateAsync({ ids });
					toast.success(
						`${selectedRows.length} coach${selectedRows.length > 1 ? "es" : ""} deleted.`,
					);
					table.resetRowSelection();
					utils.organization.coach.list.invalidate();
				} catch (_err) {
					toast.error("Failed to delete coaches.");
				}
			},
		});
	};

	const handleBulkUpdateStatus = async (status: CoachStatus) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error("No coaches selected.");
			return;
		}

		const ids = selectedRows.map((row) => row.original.id);
		try {
			await bulkUpdateStatus.mutateAsync({ ids, status });
			toast.success(
				`${selectedRows.length} coach${selectedRows.length > 1 ? "es" : ""} updated to ${statusLabels[status] || capitalize(status)}.`,
			);
			table.resetRowSelection();
			utils.organization.coach.list.invalidate();
		} catch (_err) {
			toast.error("Failed to update coaches.");
		}
	};

	const statusActions: BulkActionItem[] = CoachStatuses.map((status) => ({
		label: `Set to ${statusLabels[status] || capitalize(status)}`,
		onClick: () => handleBulkUpdateStatus(status as CoachStatus),
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
