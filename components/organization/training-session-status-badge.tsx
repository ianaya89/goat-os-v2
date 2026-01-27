"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { TrainingSessionStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";

/**
 * Canonical color config for training session statuses.
 * Every component that renders a status should use these values.
 */
export const trainingSessionStatusConfig: Record<
	TrainingSessionStatus,
	{
		badge: string;
		dot: string;
		bg: string;
	}
> = {
	pending: {
		badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
		dot: "bg-amber-500",
		bg: "bg-amber-50 dark:bg-amber-950",
	},
	confirmed: {
		badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
		dot: "bg-blue-500",
		bg: "bg-blue-50 dark:bg-blue-950",
	},
	completed: {
		badge:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
		dot: "bg-emerald-500",
		bg: "bg-emerald-50 dark:bg-emerald-950",
	},
	cancelled: {
		badge: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
		dot: "bg-gray-400",
		bg: "bg-gray-50 dark:bg-gray-900",
	},
};

export type TrainingSessionStatusBadgeProps = {
	status: TrainingSessionStatus | string;
	className?: string;
};

export function TrainingSessionStatusBadge({
	status,
	className,
}: TrainingSessionStatusBadgeProps): React.JSX.Element {
	const t = useTranslations("training.status");

	const config =
		trainingSessionStatusConfig[status as TrainingSessionStatus] ??
		trainingSessionStatusConfig.pending;

	return (
		<Badge
			variant="outline"
			className={cn(
				"border-none px-2 py-0.5 font-medium text-xs shadow-none",
				config.badge,
				className,
			)}
		>
			{t(status as Parameters<typeof t>[0])}
		</Badge>
	);
}
