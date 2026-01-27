"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/**
 * Unified Profile Edit Sheet Component
 *
 * A distinctive, full-height slide-in panel for editing athlete profile sections.
 * Features a bold header with accent stripe, smooth animations, and consistent layout.
 */

export interface ProfileEditSheetProps<TFieldValues extends FieldValues> {
	/** Whether the sheet is open */
	open: boolean;
	/** Callback when sheet should close */
	onClose: () => void;
	/** Sheet title */
	title: string;
	/** Optional subtitle/description */
	subtitle?: string;
	/** Icon component to display in header */
	icon?: React.ReactNode;
	/** Accent color for the header stripe */
	accentColor?:
		| "primary"
		| "slate"
		| "emerald"
		| "amber"
		| "rose"
		| "violet"
		| "sky";
	/** Form instance for form-based sheets */
	form?: UseFormReturn<TFieldValues>;
	/** Form submission handler */
	onSubmit?: (e?: React.BaseSyntheticEvent) => Promise<void> | void;
	/** Whether currently submitting */
	isPending?: boolean;
	/** Submit button label */
	submitLabel?: string;
	/** Cancel button label */
	cancelLabel?: string;
	/** Sheet content */
	children: React.ReactNode;
	/** Maximum width */
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
	/** Optional footer content (replaces default buttons) */
	customFooter?: React.ReactNode;
	/** Optional animation end callback */
	onAnimationEndCapture?: () => void;
}

const accentColors = {
	primary: "from-primary to-primary/80",
	slate: "from-slate-400 to-slate-500",
	emerald: "from-emerald-500 to-emerald-600",
	amber: "from-amber-500 to-amber-600",
	rose: "from-rose-500 to-rose-600",
	violet: "from-violet-500 to-violet-600",
	sky: "from-sky-500 to-sky-600",
};

const maxWidthClasses = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
	"2xl": "max-w-2xl",
};

export function ProfileEditSheet<TFieldValues extends FieldValues>({
	open,
	onClose,
	title,
	subtitle,
	icon,
	accentColor = "primary",
	form,
	onSubmit,
	isPending = false,
	submitLabel = "Guardar",
	cancelLabel = "Cancelar",
	children,
	maxWidth = "lg",
	customFooter,
	onAnimationEndCapture,
}: ProfileEditSheetProps<TFieldValues>): React.JSX.Element {
	// Handle escape key
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && open && !isPending) {
				onClose();
			}
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [open, onClose, isPending]);

	// Lock body scroll when open
	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	const content = (
		<>
			{/* Header with accent stripe */}
			<div className="relative shrink-0">
				{/* Accent stripe */}
				<div
					className={cn(
						"absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
						accentColors[accentColor],
					)}
				/>

				{/* Header content */}
				<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
					<div className="flex items-start gap-3">
						{icon && (
							<div
								className={cn(
									"flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
									accentColors[accentColor],
									"text-white",
								)}
							>
								{icon}
							</div>
						)}
						<div>
							<h2 className="font-semibold text-lg tracking-tight">{title}</h2>
							{subtitle && (
								<p className="mt-0.5 text-muted-foreground text-sm">
									{subtitle}
								</p>
							)}
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isPending}
						className={cn(
							"flex size-8 items-center justify-center rounded-lg transition-all duration-150",
							"text-muted-foreground hover:text-foreground hover:bg-muted",
							"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							"disabled:pointer-events-none disabled:opacity-50",
						)}
					>
						<XIcon className="size-4" />
						<span className="sr-only">Cerrar</span>
					</button>
				</div>

				{/* Separator */}
				<div className="h-px bg-border" />
			</div>

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto">
				<div className="px-6 py-5">{children}</div>
			</div>

			{/* Footer */}
			<div className="shrink-0 border-t bg-muted/30 px-6 py-4">
				{customFooter ?? (
					<div className="flex items-center justify-end gap-3">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={isPending}
							className="min-w-[100px]"
						>
							<XIcon className="size-4" />
							{cancelLabel}
						</Button>
						<Button
							type="submit"
							disabled={isPending}
							loading={isPending}
							className="min-w-[100px]"
						>
							<CheckIcon className="size-4" />
							{submitLabel}
						</Button>
					</div>
				)}
			</div>
		</>
	);

	return (
		<AnimatePresence mode="wait">
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
						onClick={() => !isPending && onClose()}
						aria-hidden="true"
					/>

					{/* Sheet */}
					<motion.div
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{
							type: "spring",
							damping: 30,
							stiffness: 300,
						}}
						onAnimationComplete={() => {
							if (!open) {
								onAnimationEndCapture?.();
							}
						}}
						className={cn(
							"fixed inset-y-0 right-0 z-50 flex w-full flex-col",
							"bg-background shadow-2xl",
							"border-l border-border",
							maxWidthClasses[maxWidth],
						)}
					>
						{form && onSubmit ? (
							<Form {...form}>
								<form onSubmit={onSubmit} className="flex h-full flex-col">
									{content}
								</form>
							</Form>
						) : (
							<div className="flex h-full flex-col">{content}</div>
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

/**
 * Section wrapper for grouping related fields
 */
export function ProfileEditSection({
	title,
	description,
	children,
	className,
}: {
	title?: string;
	description?: string;
	children: React.ReactNode;
	className?: string;
}): React.JSX.Element {
	return (
		<div className={cn("space-y-4", className)}>
			{(title || description) && (
				<div className="space-y-1">
					{title && <h3 className="font-medium text-sm">{title}</h3>}
					{description && (
						<p className="text-muted-foreground text-xs">{description}</p>
					)}
				</div>
			)}
			{children}
		</div>
	);
}

/**
 * Grid layout for form fields
 */
export function ProfileEditGrid({
	children,
	cols = 1,
	className,
}: {
	children: React.ReactNode;
	cols?: 1 | 2 | 3;
	className?: string;
}): React.JSX.Element {
	return (
		<div
			className={cn(
				"grid gap-4",
				cols === 1 && "grid-cols-1",
				cols === 2 && "grid-cols-1 sm:grid-cols-2",
				cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
				className,
			)}
		>
			{children}
		</div>
	);
}

/**
 * Empty state for sections without data
 */
export function ProfileEditEmpty({
	icon,
	title,
	description,
	action,
}: {
	icon?: React.ReactNode;
	title: string;
	description?: string;
	action?: React.ReactNode;
}): React.JSX.Element {
	return (
		<div className="flex flex-col items-center justify-center py-8 text-center">
			{icon && <div className="mb-3 text-muted-foreground/50">{icon}</div>}
			<p className="font-medium text-muted-foreground text-sm">{title}</p>
			{description && (
				<p className="mt-1 text-muted-foreground/80 text-xs">{description}</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}

/**
 * Item card for list-based sections (languages, videos, etc.)
 */
export function ProfileEditItem({
	children,
	onRemove,
	isRemoving,
	className,
}: {
	children: React.ReactNode;
	onRemove?: () => void;
	isRemoving?: boolean;
	className?: string;
}): React.JSX.Element {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className={cn(
				"group relative flex items-center gap-3 rounded-xl border bg-card p-3",
				"transition-shadow hover:shadow-sm",
				className,
			)}
		>
			<div className="flex-1">{children}</div>
			{onRemove && (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={cn(
						"size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
						"text-destructive hover:text-destructive hover:bg-destructive/10",
					)}
					onClick={onRemove}
					disabled={isRemoving}
				>
					<XIcon className="size-4" />
				</Button>
			)}
		</motion.div>
	);
}
