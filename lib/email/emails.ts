import { render } from "@react-email/render";
import { appConfig } from "@/config/app.config";
import { env } from "@/lib/env";
import { sendEmail } from "./resend";
import type { AthleteWelcomeEmailProps } from "./templates/athlete-welcome-email";
import type { CoachWelcomeEmailProps } from "./templates/coach-welcome-email";
import type { ConfirmEmailAddressChangeEmailProps } from "./templates/confirm-email-address-change-email";
import type { DailySessionSummaryEmailProps } from "./templates/daily-session-summary-email";
import type { DisputeReceivedEmailProps } from "./templates/dispute-received-email";
import type { ErrorReportEmailProps } from "./templates/error-report-email";
import type { FeedbackReportEmailProps } from "./templates/feedback-report-email";
import type { OrganizationInvitationEmailProps } from "./templates/organization-invitation-email";
import type { PasswordResetEmailProps } from "./templates/password-reset-email";
import type { PaymentFailedEmailProps } from "./templates/payment-failed-email";
import type { RevokedInvitationEmailProps } from "./templates/revoked-invitation-email";
import type { SubscriptionCanceledEmailProps } from "./templates/subscription-canceled-email";
import type { TrainingSessionReminderEmailProps } from "./templates/training-session-reminder-email";
import type { TrialEndingSoonEmailProps } from "./templates/trial-ending-soon-email";
import type { VerifyEmailAddressEmailProps } from "./templates/verify-email-address-email";
import { getEmailTranslations } from "./translations";

type EmailInput<T> = Omit<T, "t" | "logoUrl"> & {
	recipient: string;
	locale?: string;
};

// URL del logo para emails (version blanca para header con fondo oscuro)
// IMPORTANTE: Usar PNG para compatibilidad con clientes de email (SVG no es soportado)
const getLogoUrl = () => `${appConfig.baseUrl}/logo-email.png`;

export async function sendOrganizationInvitationEmail(
	input: EmailInput<OrganizationInvitationEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { OrganizationInvitationEmail } = await import(
		"./templates/organization-invitation-email"
	);
	const component = OrganizationInvitationEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	await sendEmail({
		recipient: input.recipient,
		subject: t.organizationInvitation.subject,
		html,
		text,
	});
}

export async function sendVerifyEmailAddressEmail(
	input: EmailInput<VerifyEmailAddressEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { VerifyEmailAddressEmail } = await import(
		"./templates/verify-email-address-email"
	);
	const component = VerifyEmailAddressEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	await sendEmail({
		recipient: input.recipient,
		subject: t.verifyEmail.subject,
		html,
		text,
	});
}

export async function sendPasswordResetEmail(
	input: EmailInput<PasswordResetEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { PasswordResetEmail } = await import(
		"./templates/password-reset-email"
	);
	const component = PasswordResetEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	await sendEmail({
		recipient: input.recipient,
		subject: t.passwordReset.subject,
		html,
		text,
	});
}

export async function sendConfirmEmailAddressChangeEmail(
	input: EmailInput<ConfirmEmailAddressChangeEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { ConfirmEmailAddressChangeEmail } = await import(
		"./templates/confirm-email-address-change-email"
	);
	const component = ConfirmEmailAddressChangeEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	await sendEmail({
		recipient: input.recipient,
		subject: t.confirmEmailChange.subject,
		html,
		text,
	});
}

export async function sendRevokedInvitationEmail(
	input: EmailInput<RevokedInvitationEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { RevokedInvitationEmail } = await import(
		"./templates/revoked-invitation-email"
	);
	const component = RevokedInvitationEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	await sendEmail({
		recipient: input.recipient,
		subject: t.revokedInvitation.subject,
		html,
		text,
	});
}

export async function sendPaymentFailedEmail(
	input: EmailInput<PaymentFailedEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { PaymentFailedEmail } = await import(
		"./templates/payment-failed-email"
	);
	const component = PaymentFailedEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	await sendEmail({
		recipient: input.recipient,
		subject: t.paymentFailed.subject.replace(
			"{organizationName}",
			input.organizationName,
		),
		html,
		text,
	});
}

export async function sendSubscriptionCanceledEmail(
	input: EmailInput<SubscriptionCanceledEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { SubscriptionCanceledEmail } = await import(
		"./templates/subscription-canceled-email"
	);
	const component = SubscriptionCanceledEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	await sendEmail({
		recipient: input.recipient,
		subject: t.subscriptionCanceled.subject.replace(
			"{planName}",
			input.planName,
		),
		html,
		text,
	});
}

export async function sendTrialEndingSoonEmail(
	input: EmailInput<TrialEndingSoonEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { TrialEndingSoonEmail } = await import(
		"./templates/trial-ending-soon-email"
	);
	const component = TrialEndingSoonEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	const daysText =
		input.daysRemaining === 1
			? t.trialEndingSoon.daysText.one
			: t.trialEndingSoon.daysText.other.replace(
					"{count}",
					String(input.daysRemaining),
				);
	await sendEmail({
		recipient: input.recipient,
		subject: t.trialEndingSoon.subject
			.replace("{planName}", input.planName)
			.replace("{daysText}", daysText),
		html,
		text,
	});
}

export async function sendDisputeReceivedEmail(
	input: EmailInput<DisputeReceivedEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { DisputeReceivedEmail } = await import(
		"./templates/dispute-received-email"
	);
	const component = DisputeReceivedEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	await sendEmail({
		recipient: input.recipient,
		subject: t.disputeReceived.subject.replace(
			"{organizationName}",
			input.organizationName,
		),
		html,
		text,
	});
}

export async function sendCoachWelcomeEmail(
	input: EmailInput<CoachWelcomeEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { CoachWelcomeEmail } = await import("./templates/coach-welcome-email");
	const component = CoachWelcomeEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	await sendEmail({
		recipient: input.recipient,
		subject: t.coachWelcome.subject.replace(
			"{organizationName}",
			input.organizationName,
		),
		html,
		text,
	});
}

export async function sendAthleteWelcomeEmail(
	input: EmailInput<AthleteWelcomeEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { AthleteWelcomeEmail } = await import(
		"./templates/athlete-welcome-email"
	);
	const component = AthleteWelcomeEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	await sendEmail({
		recipient: input.recipient,
		subject: t.athleteWelcome.subject.replace(
			"{organizationName}",
			input.organizationName,
		),
		html,
		text,
	});
}

export async function sendDailySessionSummaryEmail(
	input: EmailInput<DailySessionSummaryEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { DailySessionSummaryEmail } = await import(
		"./templates/daily-session-summary-email"
	);
	const component = DailySessionSummaryEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	const preview = t.dailySessionSummary.preview
		.replace(
			/{totalSessions, plural, one \{([^}]+)\} other \{([^}]+)\}}/,
			input.totalSessions === 1 ? "$1" : "$2",
		)
		.replace("{totalSessions}", String(input.totalSessions))
		.replace("{summaryDate}", input.summaryDate);

	await sendEmail({
		recipient: input.recipient,
		subject: preview,
		html,
		text,
	});
}

export async function sendTrainingSessionReminderEmail(
	input: EmailInput<TrainingSessionReminderEmailProps>,
): Promise<void> {
	const t = getEmailTranslations(input.locale || "es");
	const { TrainingSessionReminderEmail } = await import(
		"./templates/training-session-reminder-email"
	);
	const component = TrainingSessionReminderEmail({
		...input,
		t,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	const subject = t.trainingSessionReminder.preview
		.replace("{sessionTitle}", input.sessionTitle)
		.replace("{sessionDate}", input.sessionDate);

	await sendEmail({
		recipient: input.recipient,
		subject,
		html,
		text,
	});
}

export async function sendErrorReportEmail(
	input: Omit<ErrorReportEmailProps, "appName" | "logoUrl">,
): Promise<void> {
	const { ErrorReportEmail } = await import("./templates/error-report-email");
	const component = ErrorReportEmail({
		...input,
		appName: appConfig.appName,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	const recipient = env.ERROR_REPORT_EMAIL;
	const subject = `[Error Report] ${input.errorMessage.slice(0, 50)}${input.errorMessage.length > 50 ? "..." : ""}`;

	await sendEmail({
		recipient,
		subject,
		html,
		text,
	});
}

export async function sendFeedbackEmail(
	input: Omit<FeedbackReportEmailProps, "appName" | "logoUrl">,
): Promise<void> {
	const { FeedbackReportEmail } = await import(
		"./templates/feedback-report-email"
	);

	// Convert base64 data URLs to attachments
	const attachments: Array<{ filename: string; content: string }> = [];
	if (input.images && input.images.length > 0) {
		input.images.forEach((dataUrl, index) => {
			// Extract base64 content from data URL (remove "data:image/png;base64," prefix)
			const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
			if (matches?.[1] && matches[2]) {
				const extension = matches[1];
				const base64Content = matches[2];
				attachments.push({
					filename: `screenshot-${index + 1}.${extension}`,
					content: base64Content,
				});
			}
		});
	}

	// Create email without embedded images
	const component = FeedbackReportEmail({
		...input,
		images: [], // Don't embed images in HTML
		imageCount: attachments.length, // Pass count for display
		appName: appConfig.appName,
		logoUrl: getLogoUrl(),
	});
	const html = await render(component);
	const text = await render(component, { plainText: true });

	const recipient = env.ERROR_REPORT_EMAIL;
	const subject = `[Feedback] ${input.title.slice(0, 50)}${input.title.length > 50 ? "..." : ""}`;

	await sendEmail({
		recipient,
		subject,
		html,
		text,
		attachments: attachments.length > 0 ? attachments : undefined,
	});
}
