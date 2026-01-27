import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	/** Icon to display */
	icon?: LucideIcon;
	/** Title/message to display */
	title: string;
	/** Optional description text */
	description?: string;
	/** Optional action element (button, link, etc.) */
	action?: React.ReactNode;
	/** Additional className */
	className?: string;
	/** Size variant */
	size?: "sm" | "md" | "lg";
}

const sizeClasses = {
	sm: {
		container: "py-6",
		icon: "size-8",
		title: "text-sm",
		description: "text-xs",
	},
	md: {
		container: "py-8",
		icon: "size-10",
		title: "text-sm",
		description: "text-xs",
	},
	lg: {
		container: "py-12",
		icon: "size-12",
		title: "text-base",
		description: "text-sm",
	},
};

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
	size = "md",
}: EmptyStateProps) {
	const sizes = sizeClasses[size];

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center text-center text-muted-foreground",
				sizes.container,
				className,
			)}
		>
			{Icon && (
				<Icon className={cn("mb-3 opacity-40", sizes.icon)} strokeWidth={1.5} />
			)}
			<p className={cn("font-medium", sizes.title)}>{title}</p>
			{description && (
				<p className={cn("mt-1 max-w-sm", sizes.description)}>{description}</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}
