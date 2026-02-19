"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { Table } from "@tanstack/react-table";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

interface Expense {
	id: string;
	organizationId: string;
	categoryId: string | null;
	category: string | null;
	amount: number;
	currency: string;
	description: string;
	expenseDate: Date;
	paymentMethod: string | null;
	receiptNumber: string | null;
	receiptImageKey: string | null;
	vendor: string | null;
	notes: string | null;
	eventId: string | null;
	event: { id: string; title: string } | null;
	createdAt: Date;
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
	const t = useTranslations("finance.expenses");
	const utils = trpc.useUtils();

	const bulkDeleteMutation = trpc.organization.expense.bulkDelete.useMutation({
		onSuccess: (data) => {
			toast.success(t("bulk.deleted", { count: data.deletedCount }));
			utils.organization.expense.invalidate();
			table.resetRowSelection();
		},
		onError: (error) => {
			toast.error(error.message || t("bulk.deleteFailed"));
		},
	});

	const selectedRows = table.getFilteredSelectedRowModel().rows;

	if (selectedRows.length === 0) {
		return null;
	}

	const handleBulkDelete = (): void => {
		NiceModal.show(ConfirmationModal, {
			title: t("bulk.deleteTitle"),
			message: t("bulk.deleteMessage", { count: selectedRows.length }),
			confirmLabel: t("deleteConfirm.confirm"),
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
				{t("bulk.selected", { count: selectedRows.length })}
			</span>
			<Button
				variant="destructive"
				size="sm"
				onClick={handleBulkDelete}
				disabled={bulkDeleteMutation.isPending}
			>
				<Trash2Icon className="mr-1 size-4" />
				{t("deleteConfirm.confirm")}
			</Button>
		</div>
	);
}
