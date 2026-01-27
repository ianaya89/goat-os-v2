"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { AthleteLevel } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";

const levelColors: Record<string, string> = {
	beginner: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
	intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	advanced:
		"bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
	professional:
		"bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	elite:
		"bg-gradient-to-r from-yellow-400 to-orange-500 text-white dark:from-yellow-500 dark:to-orange-600",
};

export type LevelBadgeProps = {
	level: AthleteLevel | string;
	className?: string;
	/** Show only the badge without text (icon mode) */
	compact?: boolean;
};

export function LevelBadge({
	level,
	className,
	compact = false,
}: LevelBadgeProps): React.JSX.Element {
	const t = useTranslations("athletes.levels");

	const normalizedLevel = level.toLowerCase();
	const colorClass = levelColors[normalizedLevel] || levelColors.beginner;

	const getLevelLabel = (lvl: string): string => {
		return t(lvl as Parameters<typeof t>[0]);
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
				? getLevelLabel(normalizedLevel).charAt(0).toUpperCase()
				: getLevelLabel(normalizedLevel)}
		</Badge>
	);
}

/**
 * Hook to get level colors for custom styling
 */
export function useLevelColors() {
	return levelColors;
}
