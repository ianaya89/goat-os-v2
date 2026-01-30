"use client";

import NiceModal from "@ebay/nice-modal-react";
import {
	ChevronDownIcon,
	MailIcon,
	MessageSquareIcon,
	PlusIcon,
	SmartphoneIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { TrainingSessionCalendar } from "@/components/organization/training-session-calendar";
import { TrainingSessionViewToggle } from "@/components/organization/training-session-view-toggle";
import { TrainingSessionsModal } from "@/components/organization/training-sessions-modal";
import { TrainingSessionsTable } from "@/components/organization/training-sessions-table";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationChannel } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

type ViewMode = "table" | "calendar";

function isViewMode(value: string | null): value is ViewMode {
	return value === "table" || value === "calendar";
}

export function TrainingSessionsView() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const viewParam = searchParams.get("view");
	const [viewMode, setViewModeState] = React.useState<ViewMode>(
		isViewMode(viewParam) ? viewParam : "table",
	);
	const t = useTranslations("training");

	const setViewMode = React.useCallback(
		(mode: ViewMode) => {
			setViewModeState(mode);
			const params = new URLSearchParams(searchParams.toString());
			if (mode === "table") {
				params.delete("view");
			} else {
				params.set("view", mode);
			}
			const qs = params.toString();
			router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
		},
		[searchParams, router, pathname],
	);

	const renderToolbarActions = (periodFilter: string) => (
		<ToolbarActions
			viewMode={viewMode}
			onViewModeChange={setViewMode}
			periodFilter={periodFilter}
		/>
	);

	// For calendar view, use a static toolbar (no period filter)
	const calendarToolbarActions = (
		<ToolbarActions
			viewMode={viewMode}
			onViewModeChange={setViewMode}
			periodFilter={null}
		/>
	);

	return viewMode === "table" ? (
		<TrainingSessionsTable renderToolbarActions={renderToolbarActions} />
	) : (
		<TrainingSessionCalendar toolbarActions={calendarToolbarActions} />
	);
}

// Separate component for toolbar actions to handle state properly
function ToolbarActions({
	viewMode,
	onViewModeChange,
	periodFilter,
}: {
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
	periodFilter: string | null;
}) {
	const t = useTranslations("training");
	const tConfirmations = useTranslations("confirmations");
	const utils = trpc.useUtils();

	// Determine if confirmations can be sent based on period filter
	const canSendConfirmations =
		periodFilter === "day" || periodFilter === "week";
	const confirmationScope =
		periodFilter === "week" ? ("week" as const) : ("today" as const);

	// Preview confirmation count before sending
	const { data: preview } = trpc.organization.confirmation.previewBulk.useQuery(
		{ scope: confirmationScope },
		{ enabled: canSendConfirmations },
	);

	const sendBulkConfirmationsMutation =
		trpc.organization.confirmation.sendBulk.useMutation({
			onSuccess: (data) => {
				if (data.sent === 0) {
					toast.info(t("viewToggle.noAthletes"));
				} else {
					toast.success(t("bulk.confirmationsSent", { count: data.sent }));
				}
				utils.organization.confirmation.getHistory.invalidate();
				utils.organization.confirmation.getStats.invalidate();
				utils.organization.confirmation.previewBulk.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || t("bulk.confirmationsFailed"));
			},
		});

	const handleSendConfirmations = (channel: NotificationChannel) => {
		const channelLabel =
			channel === "email"
				? "Email"
				: channel === "whatsapp"
					? "WhatsApp"
					: "SMS";

		NiceModal.show(ConfirmationModal, {
			title: tConfirmations("bulkSend.confirmTitle"),
			message: tConfirmations("bulkSend.confirmMessage", {
				count: preview?.athleteCount ?? 0,
				channel: channelLabel,
			}),
			confirmLabel: tConfirmations("bulkSend.confirmButton"),
			onConfirm: () => {
				sendBulkConfirmationsMutation.mutate({
					scope: confirmationScope,
					channel,
				});
			},
		});
	};

	return (
		<div className="flex items-center gap-2">
			<TrainingSessionViewToggle
				viewMode={viewMode}
				onViewModeChange={onViewModeChange}
			/>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						disabled={
							!canSendConfirmations || sendBulkConfirmationsMutation.isPending
						}
					>
						<MailIcon className="size-4 shrink-0" />
						<span className="hidden sm:inline">
							{sendBulkConfirmationsMutation.isPending
								? t("viewToggle.sending")
								: t("bulk.sendConfirmations")}
						</span>
						{canSendConfirmations && preview && preview.athleteCount > 0 && (
							<span className="text-muted-foreground text-xs">
								({preview.athleteCount})
							</span>
						)}
						<ChevronDownIcon className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => handleSendConfirmations("email")}>
						<MailIcon className="mr-2 size-4" />
						{t("bulk.viaEmail")}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => handleSendConfirmations("whatsapp")}>
						<MessageSquareIcon className="mr-2 size-4" />
						{t("bulk.viaWhatsApp")}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => handleSendConfirmations("sms")}>
						<SmartphoneIcon className="mr-2 size-4" />
						{t("bulk.viaSms")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Button onClick={() => NiceModal.show(TrainingSessionsModal)} size="sm">
				<PlusIcon className="size-4 shrink-0" />
				{t("add")}
			</Button>
		</div>
	);
}
