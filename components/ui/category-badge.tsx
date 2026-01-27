"use client";

import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Generates a deterministic color based on a string.
 * Uses a hash function to ensure the same string always produces the same color.
 */
function stringToColor(str: string): { bg: string; text: string } {
	// Predefined color palette that looks good for badges
	const colors = [
		{
			bg: "bg-blue-100 dark:bg-blue-900",
			text: "text-blue-700 dark:text-blue-300",
		},
		{
			bg: "bg-purple-100 dark:bg-purple-900",
			text: "text-purple-700 dark:text-purple-300",
		},
		{
			bg: "bg-pink-100 dark:bg-pink-900",
			text: "text-pink-700 dark:text-pink-300",
		},
		{
			bg: "bg-indigo-100 dark:bg-indigo-900",
			text: "text-indigo-700 dark:text-indigo-300",
		},
		{
			bg: "bg-cyan-100 dark:bg-cyan-900",
			text: "text-cyan-700 dark:text-cyan-300",
		},
		{
			bg: "bg-teal-100 dark:bg-teal-900",
			text: "text-teal-700 dark:text-teal-300",
		},
		{
			bg: "bg-emerald-100 dark:bg-emerald-900",
			text: "text-emerald-700 dark:text-emerald-300",
		},
		{
			bg: "bg-orange-100 dark:bg-orange-900",
			text: "text-orange-700 dark:text-orange-300",
		},
		{
			bg: "bg-amber-100 dark:bg-amber-900",
			text: "text-amber-700 dark:text-amber-300",
		},
		{
			bg: "bg-rose-100 dark:bg-rose-900",
			text: "text-rose-700 dark:text-rose-300",
		},
		{
			bg: "bg-violet-100 dark:bg-violet-900",
			text: "text-violet-700 dark:text-violet-300",
		},
		{
			bg: "bg-fuchsia-100 dark:bg-fuchsia-900",
			text: "text-fuchsia-700 dark:text-fuchsia-300",
		},
	];

	// Simple hash function
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	const index = Math.abs(hash) % colors.length;
	return colors[index]!;
}

export type CategoryBadgeProps = {
	name: string;
	className?: string;
};

export function CategoryBadge({
	name,
	className,
}: CategoryBadgeProps): React.JSX.Element {
	const colors = stringToColor(name);

	return (
		<Badge
			variant="outline"
			className={cn(
				"border-none px-2 py-0.5 font-medium text-xs shadow-none",
				colors.bg,
				colors.text,
				className,
			)}
		>
			{name}
		</Badge>
	);
}

/**
 * Hook to get the color for a category name
 */
export function useCategoryColor(name: string) {
	return stringToColor(name);
}
