"use client";

import { MailIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Format phone number for WhatsApp link (remove non-numeric characters)
 */
function formatPhoneForWhatsApp(phone: string): string {
	return phone.replace(/\D/g, "");
}

export type WhatsAppLinkProps = {
	phone: string;
	className?: string;
	/** Whether to show the phone icon */
	showIcon?: boolean;
	/** Icon size class (default: size-4) */
	iconSize?: string;
	/** Use WhatsApp green color style */
	variant?: "default" | "whatsapp";
	/** Additional children to render after the phone number */
	children?: React.ReactNode;
	/** Click handler to stop propagation in table rows */
	onClick?: (e: React.MouseEvent) => void;
};

export function WhatsAppLink({
	phone,
	className,
	showIcon = true,
	iconSize = "size-4",
	variant = "default",
	children,
	onClick,
}: WhatsAppLinkProps): React.JSX.Element {
	const variantStyles = {
		default: "text-muted-foreground hover:text-foreground",
		whatsapp:
			"text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300",
	};

	return (
		<a
			href={`https://wa.me/${formatPhoneForWhatsApp(phone)}`}
			target="_blank"
			rel="noopener noreferrer"
			title={`WhatsApp: ${phone}`}
			className={cn(
				"inline-flex items-center gap-1.5 transition-colors",
				variantStyles[variant],
				className,
			)}
			onClick={onClick}
		>
			{showIcon &&
				(variant === "whatsapp" ? (
					<MessageCircleIcon className={cn("shrink-0", iconSize)} />
				) : (
					<PhoneIcon className={cn("shrink-0", iconSize)} />
				))}
			<span>{phone}</span>
			{children}
		</a>
	);
}

export type MailtoLinkProps = {
	email: string;
	className?: string;
	/** Whether to show the mail icon */
	showIcon?: boolean;
	/** Icon size class (default: size-4) */
	iconSize?: string;
	/** Truncate email to max width */
	truncate?: boolean;
	/** Max width for truncation (default: max-w-[180px]) */
	maxWidth?: string;
	/** Additional children to render after the email */
	children?: React.ReactNode;
	/** Click handler to stop propagation in table rows */
	onClick?: (e: React.MouseEvent) => void;
};

export function MailtoLink({
	email,
	className,
	showIcon = true,
	iconSize = "size-4",
	truncate = false,
	maxWidth = "max-w-[180px]",
	children,
	onClick,
}: MailtoLinkProps): React.JSX.Element {
	return (
		<a
			href={`mailto:${email}`}
			title={email}
			className={cn(
				"inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors",
				className,
			)}
			onClick={onClick}
		>
			{showIcon && <MailIcon className={cn("shrink-0", iconSize)} />}
			<span className={truncate ? cn("truncate", maxWidth) : undefined}>
				{email}
			</span>
			{children}
		</a>
	);
}
