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
	type NotificationChannel,
	type TrainingSessionStatus,
	TrainingSessionStatuses,
} from "@/lib/db/schema/enums";
import { capitalize } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface SessionWithAthletes {
	id: string;
	athletes: { athlete: { id: string } }[];
}

export type TrainingSessionsBulkActionsProps<T> = {
	table: Table<T>;
};

export function TrainingSessionsBulkActions<T extends SessionWithAthletes>({
	table,
}: TrainingSessionsBulkActionsProps<T>): React.JSX.Element {
	const t = useTranslations("training.bulk");
	const tConfirmations = useTranslations("confirmations");
	const utils = trpc.useUtils();

	const bulkDelete = trpc.organization.trainingSession.bulkDelete.useMutation();
	const bulkUpdateStatus =
		trpc.organization.trainingSession.bulkUpdateStatus.useMutation();
	const sendConfirmations =
		trpc.organization.confirmation.sendForSessions.useMutation();

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

	const handleSendConfirmations = (channel: NotificationChannel) => {
		const selectedRows = table.getSelectedRowModel().rows;
		if (selectedRows.length === 0) {
			toast.error(t("noSessionsSelected"));
			return;
		}

		// Count unique athletes across all selected sessions
		const athleteIds = new Set<string>();
		for (const row of selectedRows) {
			for (const sa of row.original.athletes) {
				athleteIds.add(sa.athlete.id);
			}
		}
		const athleteCount = athleteIds.size;

		const channelLabel =
			channel === "email"
				? "Email"
				: channel === "whatsapp"
					? "WhatsApp"
					: "SMS";

		NiceModal.show(ConfirmationModal, {
			title: tConfirmations("bulkSend.confirmTitle"),
			message: tConfirmations("bulkSend.confirmMessage", {
				count: athleteCount,
				channel: channelLabel,
			}),
			confirmLabel: tConfirmations("bulkSend.confirmButton"),
			onConfirm: async () => {
				const sessionIds = selectedRows.map((row) => row.original.id);
				try {
					const result = await sendConfirmations.mutateAsync({
						sessionIds,
						channel,
					});
					toast.success(t("confirmationsSent", { count: result.sent }));
					table.resetRowSelection();
					utils.organization.confirmation.getHistory.invalidate();
					utils.organization.confirmation.getStats.invalidate();
				} catch (_err) {
					toast.error(t("confirmationsFailed"));
				}
			},
		});
	};

	const statusActions: BulkActionItem[] = TrainingSessionStatuses.map(
		(status) => ({
			label: t("setTo", { status: capitalize(status) }),
			onClick: () => handleBulkUpdateStatus(status),
		}),
	);

	const confirmationActions: BulkActionItem[] = [
		{
			label: t("viaEmail"),
			onClick: () => handleSendConfirmations("email"),
		},
		{
			label: t("viaWhatsApp"),
			onClick: () => handleSendConfirmations("whatsapp"),
		},
		{
			label: t("viaSms"),
			onClick: () => handleSendConfirmations("sms"),
		},
	];

	const actions: BulkActionItem[] = [
		{
			label: t("changeStatus"),
			actions: statusActions,
		},
		{
			label: t("sendConfirmations"),
			actions: confirmationActions,
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
