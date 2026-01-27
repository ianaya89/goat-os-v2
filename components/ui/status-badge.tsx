"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { AthleteStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
	active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	injured: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
	suspended:
		"bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

export type StatusBadgeProps = {
	status: AthleteStatus | string;
	className?: string;
	/** Show only the first letter (icon mode) */
	compact?: boolean;
};

export function StatusBadge({
	status,
	className,
	compact = false,
}: StatusBadgeProps): React.JSX.Element {
	const t = useTranslations("athletes.statuses");

	const normalizedStatus = status.toLowerCase();
	const colorClass = statusColors[normalizedStatus] || statusColors.inactive;

	const getStatusLabel = (s: string): string => {
		return t(s as Parameters<typeof t>[0]);
	};

	return (
		<Badge
			variant="outline"
			className={cn(
				"border-none px-2 py-0.5 font-medium text-xs shadow-none",
				colorClass,
				className,
			)}
		>
			{compact
				? getStatusLabel(normalizedStatus).charAt(0).toUpperCase()
				: getStatusLabel(normalizedStatus)}
		</Badge>
	);
}

/**
 * Hook to get status colors for custom styling
 */
export function useStatusColors() {
	return statusColors;
}
