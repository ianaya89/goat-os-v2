/**
 * Notification module
 *
 * Multi-channel notification system supporting:
 * - Email (via Resend)
 * - SMS (via Sent.dm)
 * - WhatsApp (via Sent.dm)
 *
 * Supports both direct sending and queued delivery via Trigger.dev.
 *
 * @example
 * import { notifications } from "@/lib/notifications";
 *
 * // Send email
 * await notifications.send({
 *   channel: "email",
 *   to: { email: "user@example.com" },
 *   template: "welcome",
 *   data: { name: "John" },
 * });
 *
 * // Send WhatsApp
 * await notifications.send({
 *   channel: "whatsapp",
 *   to: { phone: "+1234567890" },
 *   template: "reminder",
 *   data: { message: "Don't forget!" },
 * });
 *
 * // Auto-select best channel
 * await notifications.send({
 *   channel: "auto",
 *   to: { email: "user@example.com", phone: "+1234567890" },
 *   template: "alert",
 *   data: { ... },
 *   priority: ["whatsapp", "sms", "email"],
 * });
 */

// Channel adapters (for advanced use)
export { isEmailConfigured, sendEmailNotification } from "./channels/email";
export {
	isSentDmConfigured,
	isValidPhoneNumber,
	sendSms,
	sendWhatsApp,
} from "./channels/sent-dm";
// Main notification service
export {
	getAvailableChannels,
	send,
	sendBatch,
	validatePayload,
} from "./notifications";
// Templates
export {
	getAvailableTemplates,
	messageTemplates,
	renderTemplate,
	validateTemplateVariables,
} from "./templates/messaging";
// Types
export type {
	AutoNotificationPayload,
	BatchNotificationResult,
	DeliveryStatus,
	EmailNotificationPayload,
	EmailRecipient,
	EmailTemplateName,
	MessagingTemplateName,
	MultiChannelRecipient,
	NotificationChannel,
	NotificationJobPayload,
	NotificationPayload,
	NotificationPreferences,
	NotificationResult,
	PhoneRecipient,
	SmsNotificationPayload,
	WebhookEvent,
	WebhookEventType,
	WhatsAppNotificationPayload,
} from "./types";

// Convenience namespace
import {
	getAvailableChannels,
	send,
	sendBatch,
	validatePayload,
} from "./notifications";

export const notifications = {
	send,
	sendBatch,
	getAvailableChannels,
	validatePayload,
};
