"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { Table } from "@tanstack/react-table";
import { Trash2Icon } from "lucide-react";
import type * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

interface Expense {
	id: string;
	organizationId: string;
	categoryId: string | null;
	amount: number;
	currency: string;
	description: string;
	expenseDate: Date;
	paymentMethod: string | null;
	receiptNumber: string | null;
	vendor: string | null;
	notes: string | null;
	createdAt: Date;
	category: {
		id: string;
		name: string;
		type: string;
	} | null;
	recordedByUser: {
		id: string;
		name: string;
	} | null;
}

export function ExpensesBulkActions({
	table,
}: {
	table: Table<Expense>;
}): React.JSX.Element | null {
	const utils = trpc.useUtils();

	const bulkDeleteMutation = trpc.organization.expense.bulkDelete.useMutation({
		onSuccess: (data) => {
			toast.success(`${data.deletedCount} gastos eliminados`);
			utils.organization.expense.list.invalidate();
			table.resetRowSelection();
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar los gastos");
		},
	});

	const selectedRows = table.getFilteredSelectedRowModel().rows;

	if (selectedRows.length === 0) {
		return null;
	}

	const handleBulkDelete = (): void => {
		NiceModal.show(ConfirmationModal, {
			title: "Eliminar gastos seleccionados?",
			message: `Estas por eliminar ${selectedRows.length} gasto(s). Esta accion no se puede deshacer.`,
			confirmLabel: "Eliminar",
			destructive: true,
			onConfirm: () => {
				bulkDeleteMutation.mutate({
					ids: selectedRows.map((row) => row.original.id),
				});
			},
		});
	};

	return (
		<div className="flex items-center gap-2">
			<span className="text-muted-foreground text-sm">
				{selectedRows.length} seleccionado(s)
			</span>
			<Button
				variant="destructive"
				size="sm"
				onClick={handleBulkDelete}
				disabled={bulkDeleteMutation.isPending}
			>
				<Trash2Icon className="mr-1 size-4" />
				Eliminar
			</Button>
		</div>
	);
}
