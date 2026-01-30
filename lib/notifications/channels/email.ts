/**
 * Email channel adapter
 *
 * Wraps existing Resend integration for use with the notification system.
 */

import { render } from "@react-email/render";
import { sendEmail as sendEmailViaResend } from "@/lib/email/resend";
import { getEmailTranslations } from "@/lib/email/translations";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type {
	DeliveryStatus,
	EmailRecipient,
	EmailTemplateName,
	NotificationResult,
} from "../types";

// Template imports - lazy loaded
// Using any for template modules as each template has different props
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const templateModules: Record<
	EmailTemplateName,
	() => Promise<{ default: any }>
> = {
	"verify-email": () =>
		import("@/lib/email/templates/verify-email-address-email"),
	"password-reset": () => import("@/lib/email/templates/password-reset-email"),
	"organization-invitation": () =>
		import("@/lib/email/templates/organization-invitation-email"),
	"payment-failed": () => import("@/lib/email/templates/payment-failed-email"),
	"subscription-canceled": () =>
		import("@/lib/email/templates/subscription-canceled-email"),
	"trial-ending": () => import("@/lib/email/templates/trial-ending-soon-email"),
	welcome: () => import("@/lib/email/templates/coach-welcome-email"),
	"training-session-reminder": () =>
		import("@/lib/email/templates/training-session-reminder-email"),
	"daily-session-summary": () =>
		import("@/lib/email/templates/daily-session-summary-email"),
};

// Subject key mapping for each template
const templateSubjectKeys: Record<
	EmailTemplateName,
	{ key: string; params?: string[] }
> = {
	"verify-email": { key: "verifyEmail.subject" },
	"password-reset": { key: "passwordReset.subject" },
	"organization-invitation": { key: "organizationInvitation.subject" },
	"payment-failed": {
		key: "paymentFailed.subject",
		params: ["organizationName"],
	},
	"subscription-canceled": {
		key: "subscriptionCanceled.subject",
		params: ["planName"],
	},
	"trial-ending": {
		key: "trialEndingSoon.subject",
		params: ["planName", "daysText"],
	},
	welcome: { key: "coachWelcome.subject", params: ["organizationName"] },
	"training-session-reminder": { key: "trainingSessionReminder.subject" },
	"daily-session-summary": { key: "dailySessionSummary.subject" },
};

/**
 * Get translated subject for a template
 */
function getTranslatedSubject(
	template: EmailTemplateName,
	locale: string,
	data: Record<string, unknown>,
): string {
	const t = getEmailTranslations(locale);
	const subjectConfig = templateSubjectKeys[template];

	// Navigate to the subject string
	const keys = subjectConfig.key.split(".");
	let subject: unknown = t;
	for (const key of keys) {
		if (subject && typeof subject === "object") {
			subject = (subject as Record<string, unknown>)[key];
		}
	}

	if (typeof subject !== "string") {
		// Fallback subjects
		const fallbackSubjects: Record<EmailTemplateName, string> = {
			"verify-email": "Verify your email address",
			"password-reset": "Reset your password",
			"organization-invitation": "You've been invited to join",
			"payment-failed": "Payment failed",
			"subscription-canceled": "Your subscription has been canceled",
			"trial-ending": "Your trial is ending soon",
			welcome: "Welcome!",
			"training-session-reminder": "Training Session Reminder",
			"daily-session-summary": "Your Daily Training Summary",
		};
		return fallbackSubjects[template];
	}

	// Replace parameters in subject
	let result = subject;
	if (subjectConfig.params) {
		for (const param of subjectConfig.params) {
			const value = data[param];
			if (value !== undefined) {
				result = result.replace(`{${param}}`, String(value));
			}
		}
	}

	return result;
}

/**
 * Render email template to HTML and plain text
 */
async function renderTemplate(
	template: EmailTemplateName,
	data: Record<string, unknown>,
	locale: string,
): Promise<{ html: string; text: string }> {
	const templateLoader = templateModules[template];

	if (!templateLoader) {
		throw new Error(`Unknown email template: ${template}`);
	}

	const t = getEmailTranslations(locale);
	const { default: Template } = await templateLoader();
	const element = Template({ ...data, t });

	const [html, text] = await Promise.all([
		render(element),
		render(element, { plainText: true }),
	]);

	return { html, text };
}

/**
 * Send email notification
 */
export async function sendEmailNotification(
	to: EmailRecipient,
	template: EmailTemplateName,
	data: Record<string, unknown>,
	options?: {
		subject?: string;
		replyTo?: string;
		locale?: string;
	},
): Promise<NotificationResult> {
	try {
		const locale = options?.locale || "es";
		const { html, text } = await renderTemplate(template, data, locale);
		const subject =
			options?.subject || getTranslatedSubject(template, locale, data);

		const response = await sendEmailViaResend({
			recipient: to.email,
			subject,
			html,
			text,
			replyTo: options?.replyTo,
		});

		logger.info(
			{ to: to.email, template, messageId: response.data?.id },
			"Email notification sent",
		);

		return {
			success: true,
			channel: "email",
			messageId: response.data?.id,
			status: "sent",
			sentAt: new Date(),
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		logger.error({ to: to.email, template, error }, "Failed to send email");

		return {
			success: false,
			channel: "email",
			status: "failed",
			error: {
				code: "email_send_failed",
				message: errorMessage,
				retryable: isRetryableError(error),
			},
		};
	}
}

/**
 * Send email to multiple recipients
 */
export async function sendBulkEmail(
	recipients: EmailRecipient[],
	template: EmailTemplateName,
	data: Record<string, unknown>,
	options?: {
		subject?: string;
		replyTo?: string;
		locale?: string;
	},
): Promise<NotificationResult[]> {
	const results = await Promise.allSettled(
		recipients.map((recipient) =>
			sendEmailNotification(recipient, template, data, options),
		),
	);

	return results.map((result, _index) => {
		if (result.status === "fulfilled") {
			return result.value;
		}

		return {
			success: false,
			channel: "email" as const,
			status: "failed" as DeliveryStatus,
			error: {
				code: "send_failed",
				message: result.reason?.message || "Unknown error",
				retryable: true,
			},
		};
	});
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
	if (!(error instanceof Error)) return true;

	const message = error.message.toLowerCase();
	const permanentErrors = [
		"invalid email",
		"email address is not valid",
		"unauthorized",
		"forbidden",
		"unsubscribed",
		"blocked",
		"spam",
		"bounce",
	];

	return !permanentErrors.some((pe) => message.includes(pe));
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
	return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}
