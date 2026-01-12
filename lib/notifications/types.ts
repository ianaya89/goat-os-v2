/**
 * Notification module types
 *
 * Supports multi-channel notifications (email, SMS, WhatsApp)
 * with both manual (UI) and automated (cron/trigger) sending.
 */

// Channel types
export type NotificationChannel = "email" | "sms" | "whatsapp";

// Template names for each channel
export type EmailTemplateName =
	| "verify-email"
	| "password-reset"
	| "organization-invitation"
	| "payment-failed"
	| "subscription-canceled"
	| "trial-ending"
	| "welcome"
	| "training-session-reminder"
	| "daily-session-summary";

export type MessagingTemplateName =
	| "welcome"
	| "verification-code"
	| "appointment-reminder"
	| "order-confirmation"
	| "payment-reminder"
	| "training-session-reminder"
	| "custom";

// Recipient types
export interface EmailRecipient {
	email: string;
	name?: string;
}

export interface PhoneRecipient {
	phone: string; // E.164 format: +1234567890
	name?: string;
}

export interface MultiChannelRecipient {
	email?: string;
	phone?: string;
	name?: string;
}

// Base notification payload
export interface BaseNotificationPayload {
	/** Unique idempotency key to prevent duplicate sends */
	idempotencyKey?: string;
	/** Metadata for tracking/analytics */
	metadata?: Record<string, string>;
}

// Channel-specific payloads
export interface EmailNotificationPayload extends BaseNotificationPayload {
	channel: "email";
	to: EmailRecipient | EmailRecipient[];
	template: EmailTemplateName;
	data: Record<string, unknown>;
	/** Optional: override default from address */
	from?: string;
	/** Optional: reply-to address */
	replyTo?: string;
	/** Optional: custom subject (overrides template default) */
	subject?: string;
}

export interface SmsNotificationPayload extends BaseNotificationPayload {
	channel: "sms";
	to: PhoneRecipient | PhoneRecipient[];
	template: MessagingTemplateName;
	data: Record<string, unknown>;
	/** For custom template: the message body */
	body?: string;
}

export interface WhatsAppNotificationPayload extends BaseNotificationPayload {
	channel: "whatsapp";
	to: PhoneRecipient | PhoneRecipient[];
	template: MessagingTemplateName;
	data: Record<string, unknown>;
	/** For custom template: the message body */
	body?: string;
}

// Auto-channel: system picks best channel based on recipient capabilities
export interface AutoNotificationPayload extends BaseNotificationPayload {
	channel: "auto";
	to: MultiChannelRecipient | MultiChannelRecipient[];
	template: MessagingTemplateName | EmailTemplateName;
	data: Record<string, unknown>;
	/** Priority order for channel selection */
	priority?: NotificationChannel[];
	/** Fallback content for each channel */
	fallback?: {
		email?: { subject?: string; body?: string };
		sms?: { body?: string };
		whatsapp?: { body?: string };
	};
}

// Union type for all notification payloads
export type NotificationPayload =
	| EmailNotificationPayload
	| SmsNotificationPayload
	| WhatsAppNotificationPayload
	| AutoNotificationPayload;

// Delivery status
export type DeliveryStatus =
	| "pending"
	| "queued"
	| "sent"
	| "delivered"
	| "failed"
	| "bounced"
	| "spam"
	| "unsubscribed";

// Notification result
export interface NotificationResult {
	success: boolean;
	channel: NotificationChannel;
	messageId?: string;
	status: DeliveryStatus;
	error?: {
		code: string;
		message: string;
		retryable: boolean;
	};
	/** Timestamp when the message was sent */
	sentAt?: Date;
	/** Cost in credits (for billing tracking) */
	cost?: number;
}

// Batch notification result
export interface BatchNotificationResult {
	total: number;
	successful: number;
	failed: number;
	results: NotificationResult[];
}

// Webhook event types (for delivery tracking)
export type WebhookEventType =
	| "message.sent"
	| "message.delivered"
	| "message.failed"
	| "message.read"
	| "message.clicked";

export interface WebhookEvent {
	type: WebhookEventType;
	messageId: string;
	channel: NotificationChannel;
	recipient: string;
	timestamp: Date;
	metadata?: Record<string, unknown>;
}

// Notification preferences (per user/organization)
export interface NotificationPreferences {
	email: boolean;
	sms: boolean;
	whatsapp: boolean;
	/** Quiet hours: don't send during these times */
	quietHours?: {
		enabled: boolean;
		start: string; // HH:mm format
		end: string;
		timezone: string;
	};
}

// Queue job payload (for Trigger.dev)
export interface NotificationJobPayload {
	payload: NotificationPayload;
	/** Number of retry attempts so far */
	attempt?: number;
	/** Scheduled send time (ISO string) */
	scheduledFor?: string;
	/** Organization context */
	organizationId?: string;
	/** User who triggered the notification */
	triggeredBy?: string;
}
