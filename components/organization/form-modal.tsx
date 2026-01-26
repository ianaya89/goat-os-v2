"use client";

import type * as React from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

export interface FormModalProps<TFieldValues extends FieldValues> {
	/**
	 * Whether the modal is open.
	 */
	open: boolean;
	/**
	 * Callback when the modal should be closed.
	 */
	onClose: () => void;
	/**
	 * The title of the modal.
	 */
	title: string;
	/**
	 * Optional description for accessibility.
	 */
	description?: string;
	/**
	 * The react-hook-form instance.
	 */
	form: UseFormReturn<TFieldValues>;
	/**
	 * Form submission handler.
	 */
	onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void> | void;
	/**
	 * Whether the form is currently submitting.
	 */
	isPending?: boolean;
	/**
	 * Label for the submit button.
	 */
	submitLabel?: string;
	/**
	 * Label for the cancel button.
	 */
	cancelLabel?: string;
	/**
	 * Whether this is an editing operation.
	 */
	isEditing?: boolean;
	/**
	 * Children to render inside the form.
	 */
	children: React.ReactNode;
	/**
	 * Optional callback for animation end capture.
	 */
	onAnimationEndCapture?: () => void;
	/**
	 * Maximum width of the sheet.
	 */
	maxWidth?: "sm" | "md" | "lg" | "xl";
	/**
	 * Optional extra content to render before the form fields (e.g., user info display).
	 */
	headerContent?: React.ReactNode;
}

const maxWidthClasses = {
	sm: "sm:max-w-sm",
	md: "sm:max-w-md",
	lg: "sm:max-w-lg",
	xl: "sm:max-w-xl",
};

/**
 * Reusable modal wrapper for form-based sheets.
 * Provides consistent layout with header, scrollable content area, and footer.
 */
export function FormModal<TFieldValues extends FieldValues>({
	open,
	onClose,
	title,
	description,
	form,
	onSubmit,
	isPending = false,
	submitLabel,
	cancelLabel = "Cancelar",
	isEditing = false,
	children,
	onAnimationEndCapture,
	maxWidth = "lg",
	headerContent,
}: FormModalProps<TFieldValues>): React.JSX.Element {
	const defaultSubmitLabel = isEditing ? "Actualizar" : "Crear";

	return (
		<Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<SheetContent
				className={maxWidthClasses[maxWidth]}
				onAnimationEndCapture={onAnimationEndCapture}
			>
				<SheetHeader>
					<SheetTitle>{title}</SheetTitle>
					<SheetDescription className="sr-only">
						{description ?? title}
					</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form
						onSubmit={onSubmit}
						className="flex flex-1 flex-col overflow-hidden"
					>
						<ScrollArea className="flex-1">
							<div className="space-y-4 px-6 py-4">
								{headerContent}
								{children}
							</div>
						</ScrollArea>

						<SheetFooter className="flex-row justify-end gap-2 border-t">
							<Button
								type="button"
								variant="outline"
								onClick={onClose}
								disabled={isPending}
							>
								{cancelLabel}
							</Button>
							<Button type="submit" disabled={isPending} loading={isPending}>
								{submitLabel ?? defaultSubmitLabel}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}

/**
 * Simple info display component for use in modal headers.
 * Shows user/entity information in a styled card.
 */
export function FormModalInfoCard({
	title,
	subtitle,
}: {
	title: string;
	subtitle?: string;
}): React.JSX.Element {
	return (
		<div className="rounded-lg border bg-muted/50 p-4">
			<p className="font-medium text-sm">{title}</p>
			{subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
		</div>
	);
}
