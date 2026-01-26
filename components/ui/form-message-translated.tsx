"use client";

import { Slot } from "@radix-ui/react-slot";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { useFormField } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export type TranslatedFormMessageProps = React.ComponentPropsWithoutRef<"p"> & {
	asChild?: boolean;
};

/**
 * A form message component that automatically translates validation errors.
 *
 * Uses the `validation` namespace from next-intl translations.
 * Error messages from Zod schemas should use translation keys like:
 * - "required"
 * - "email.invalid"
 * - "password.requirements"
 *
 * If the message is not a valid translation key, it will be displayed as-is.
 */
export function TranslatedFormMessage({
	className,
	asChild,
	...props
}: TranslatedFormMessageProps): React.JSX.Element | null {
	const { error, formMessageId } = useFormField();
	const t = useTranslations("validation");

	const rawMessage = error ? String(error?.message ?? "") : props.children;

	if (!rawMessage) {
		return null;
	}

	// Try to translate the message as a key
	let translatedMessage: React.ReactNode = rawMessage;
	if (typeof rawMessage === "string" && rawMessage.length > 0) {
		try {
			// Check if this looks like a translation key (no spaces, uses dots)
			const isTranslationKey =
				!rawMessage.includes(" ") || rawMessage.includes(".");
			if (isTranslationKey) {
				const translated = t(rawMessage as Parameters<typeof t>[0]);
				// Only use translation if it's different (meaning the key was found)
				if (translated !== rawMessage) {
					translatedMessage = translated;
				}
			}
		} catch {
			// If translation fails, use original message
			translatedMessage = rawMessage;
		}
	}

	const Comp = asChild ? Slot : "p";

	return (
		<Comp
			data-slot="form-message"
			id={formMessageId}
			className={cn("text-destructive text-sm", className)}
			{...props}
		>
			{translatedMessage}
		</Comp>
	);
}
