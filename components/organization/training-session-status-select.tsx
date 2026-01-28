"use client";

import { CheckIcon, ChevronDownIcon, LoaderIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { toast } from "sonner";
import {
	TrainingSessionStatusBadge,
	trainingSessionStatusConfig,
} from "@/components/organization/training-session-status-badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	type TrainingSessionStatus,
	TrainingSessionStatuses,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export type TrainingSessionStatusSelectProps = {
	sessionId: string;
	currentStatus: TrainingSessionStatus | string;
	onStatusChange?: (newStatus: TrainingSessionStatus) => void;
	disabled?: boolean;
	className?: string;
	/** Size variant for the trigger */
	size?: "sm" | "default";
};

export function TrainingSessionStatusSelect({
	sessionId,
	currentStatus,
	onStatusChange,
	disabled,
	className,
	size = "default",
}: TrainingSessionStatusSelectProps): React.JSX.Element {
	const t = useTranslations("training");
	const tStatus = useTranslations("training.status");
	const utils = trpc.useUtils();

	const updateMutation = trpc.organization.trainingSession.update.useMutation({
		onSuccess: (_, variables) => {
			toast.success(t("success.statusUpdated"));
			// Invalidate relevant queries
			utils.organization.trainingSession.list.invalidate();
			utils.organization.trainingSession.listForCalendar.invalidate();
			utils.organization.dashboard.getDailyActivity.invalidate();
			onStatusChange?.(variables.status as TrainingSessionStatus);
		},
		onError: (error) => {
			toast.error(error.message || t("error.statusUpdateFailed"));
		},
	});

	const handleStatusChange = (newStatus: TrainingSessionStatus) => {
		if (newStatus === currentStatus) return;
		updateMutation.mutate({ id: sessionId, status: newStatus });
	};

	const isLoading = updateMutation.isPending;
	const config =
		trainingSessionStatusConfig[currentStatus as TrainingSessionStatus] ??
		trainingSessionStatusConfig.pending;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={disabled || isLoading}>
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"h-auto gap-1 px-2 py-0.5 font-medium text-xs shadow-none border-none hover:bg-opacity-80",
						config.badge,
						size === "sm" && "px-1.5 py-0.5 text-[11px]",
						className,
					)}
				>
					{isLoading ? (
						<LoaderIcon className="size-3 animate-spin" />
					) : (
						<>
							{tStatus(currentStatus as Parameters<typeof tStatus>[0])}
							<ChevronDownIcon className="size-3 opacity-60" />
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-[140px]">
				{TrainingSessionStatuses.map((status) => {
					const statusConfig = trainingSessionStatusConfig[status];
					const isSelected = status === currentStatus;

					return (
						<DropdownMenuItem
							key={status}
							onClick={() => handleStatusChange(status)}
							className="gap-2"
							disabled={isSelected}
						>
							<span
								className={cn("size-2 rounded-full shrink-0", statusConfig.dot)}
							/>
							<span className="flex-1">
								{tStatus(status as Parameters<typeof tStatus>[0])}
							</span>
							{isSelected && <CheckIcon className="size-3.5 text-primary" />}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
