"use client";

import NiceModal from "@ebay/nice-modal-react";
import { addDays, format } from "date-fns";
import { MailIcon, PlusIcon, SendIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
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

	const sendDailySummaryMutation =
		trpc.organization.trainingSession.sendDailySummary.useMutation({
			onSuccess: (data) => {
				if (data.sent === 0 && data.message) {
					toast.info(data.message);
				} else {
					toast.success(
						t("success.dailySummarySent", {
							sent: data.sent,
							date: data.date ?? "",
						}),
					);
				}
			},
			onError: (error) => {
				toast.error(error.message || t("error.sendDailySummaryFailed"));
			},
		});

	const handleSendSummary = (daysFromNow: number) => {
		const targetDate = addDays(new Date(), daysFromNow);
		const dateString = format(targetDate, "yyyy-MM-dd");
		sendDailySummaryMutation.mutate({ date: dateString });
	};

	const toolbarActions = (
		<div className="flex items-center gap-2">
			<TrainingSessionViewToggle
				viewMode={viewMode}
				onViewModeChange={setViewMode}
			/>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						disabled={sendDailySummaryMutation.isPending}
					>
						<MailIcon className="size-4 shrink-0" />
						<span className="hidden sm:inline">
							{sendDailySummaryMutation.isPending
								? t("viewToggle.sending")
								: t("viewToggle.sendDailySummary")}
						</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => handleSendSummary(0)}>
						<SendIcon className="mr-2 size-4" />
						{t("viewToggle.todaysSessions")}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => handleSendSummary(1)}>
						<SendIcon className="mr-2 size-4" />
						{t("viewToggle.tomorrowsSessions")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Button onClick={() => NiceModal.show(TrainingSessionsModal)} size="sm">
				<PlusIcon className="size-4 shrink-0" />
				{t("add")}
			</Button>
		</div>
	);

	return viewMode === "table" ? (
		<TrainingSessionsTable toolbarActions={toolbarActions} />
	) : (
		<TrainingSessionCalendar toolbarActions={toolbarActions} />
	);
}
