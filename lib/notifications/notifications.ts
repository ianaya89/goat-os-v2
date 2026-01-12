/**
 * Unified notification service
 *
 * Supports multi-channel notifications (email, SMS, WhatsApp)
 * with both direct sending and queued/scheduled delivery via Trigger.dev.
 */

import { logger } from "@/lib/logger";
import {
	isEmailConfigured,
	sendBulkEmail,
	sendEmailNotification,
} from "./channels/email";
import {
	isSentDmConfigured,
	isValidPhoneNumber,
	sendBulkMessage,
	sendSms,
	sendWhatsApp,
} from "./channels/sent-dm";
import type {
	AutoNotificationPayload,
	BatchNotificationResult,
	EmailNotificationPayload,
	EmailRecipient,
	NotificationChannel,
	NotificationPayload,
	NotificationResult,
	PhoneRecipient,
	SmsNotificationPayload,
	WhatsAppNotificationPayload,
} from "./types";

/**
 * Send a notification through the specified channel
 *
 * @example
 * // Send email
 * await send({
 *   channel: "email",
 *   to: { email: "user@example.com" },
 *   template: "welcome",
 *   data: { name: "John" },
 * });
 *
 * @example
 * // Send WhatsApp
 * await send({
 *   channel: "whatsapp",
 *   to: { phone: "+5491155555555" },
 *   template: "order-confirmation",
 *   data: { orderId: "123" },
 * });
 *
 * @example
 * // Auto-select channel
 * await send({
 *   channel: "auto",
 *   to: { email: "user@example.com", phone: "+5491155555555" },
 *   template: "reminder",
 *   data: { message: "Don't forget!" },
 *   priority: ["whatsapp", "sms", "email"],
 * });
 */
export async function send(
	payload: NotificationPayload,
): Promise<NotificationResult> {
	logger.info(
		{ channel: payload.channel, template: payload.template },
		"Sending notification",
	);

	switch (payload.channel) {
		case "email":
			return sendEmailChannel(payload);
		case "sms":
			return sendSmsChannel(payload);
		case "whatsapp":
			return sendWhatsAppChannel(payload);
		case "auto":
			return sendAutoChannel(payload);
		default:
			throw new Error(
				`Unknown channel: ${(payload as NotificationPayload).channel}`,
			);
	}
}

/**
 * Send notification to multiple recipients
 */
export async function sendBatch(
	payload: NotificationPayload,
): Promise<BatchNotificationResult> {
	const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
	const results: NotificationResult[] = [];

	for (const recipient of recipients) {
		const singlePayload = { ...payload, to: recipient } as NotificationPayload;
		const result = await send(singlePayload);
		results.push(result);
	}

	const successful = results.filter((r) => r.success).length;

	return {
		total: results.length,
		successful,
		failed: results.length - successful,
		results,
	};
}

// Channel-specific handlers

async function sendEmailChannel(
	payload: EmailNotificationPayload,
): Promise<NotificationResult> {
	const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
	const recipient = recipients[0];

	if (!recipient) {
		return {
			success: false,
			channel: "email",
			status: "failed",
			error: {
				code: "no_recipient",
				message: "No recipient provided",
				retryable: false,
			},
		};
	}

	return sendEmailNotification(recipient, payload.template, payload.data, {
		subject: payload.subject,
		replyTo: payload.replyTo,
	});
}

async function sendSmsChannel(
	payload: SmsNotificationPayload,
): Promise<NotificationResult> {
	const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
	const recipient = recipients[0];

	if (!recipient) {
		return {
			success: false,
			channel: "sms",
			status: "failed",
			error: {
				code: "no_recipient",
				message: "No recipient provided",
				retryable: false,
			},
		};
	}

	if (!isValidPhoneNumber(recipient.phone)) {
		return {
			success: false,
			channel: "sms",
			status: "failed",
			error: {
				code: "invalid_phone",
				message: `Invalid phone number format: ${recipient.phone}. Use E.164 format (+1234567890)`,
				retryable: false,
			},
		};
	}

	return sendSms(recipient, payload.template, payload.data, payload.body);
}

async function sendWhatsAppChannel(
	payload: WhatsAppNotificationPayload,
): Promise<NotificationResult> {
	const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
	const recipient = recipients[0];

	if (!recipient) {
		return {
			success: false,
			channel: "whatsapp",
			status: "failed",
			error: {
				code: "no_recipient",
				message: "No recipient provided",
				retryable: false,
			},
		};
	}

	if (!isValidPhoneNumber(recipient.phone)) {
		return {
			success: false,
			channel: "whatsapp",
			status: "failed",
			error: {
				code: "invalid_phone",
				message: `Invalid phone number format: ${recipient.phone}. Use E.164 format (+1234567890)`,
				retryable: false,
			},
		};
	}

	return sendWhatsApp(recipient, payload.template, payload.data, payload.body);
}

async function sendAutoChannel(
	payload: AutoNotificationPayload,
): Promise<NotificationResult> {
	const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
	const recipient = recipients[0];
	const priority = payload.priority || ["whatsapp", "sms", "email"];

	if (!recipient) {
		return {
			success: false,
			channel: priority[0] || "email",
			status: "failed",
			error: {
				code: "no_recipient",
				message: "No recipient provided",
				retryable: false,
			},
		};
	}

	// Determine available channels based on recipient data
	const availableChannels: NotificationChannel[] = [];

	if (recipient.phone && isValidPhoneNumber(recipient.phone)) {
		if (isSentDmConfigured()) {
			availableChannels.push("whatsapp", "sms");
		}
	}

	if (recipient.email && isEmailConfigured()) {
		availableChannels.push("email");
	}

	// Try channels in priority order
	for (const channel of priority) {
		if (!availableChannels.includes(channel)) {
			continue;
		}

		try {
			let result: NotificationResult;

			switch (channel) {
				case "email":
					result = await sendEmailChannel({
						channel: "email",
						to: { email: recipient.email!, name: recipient.name },
						template: payload.template as EmailNotificationPayload["template"],
						data: payload.data,
						subject: payload.fallback?.email?.subject,
					});
					break;

				case "sms":
					result = await sendSmsChannel({
						channel: "sms",
						to: { phone: recipient.phone!, name: recipient.name },
						template: payload.template as SmsNotificationPayload["template"],
						data: payload.data,
						body: payload.fallback?.sms?.body,
					});
					break;

				case "whatsapp":
					result = await sendWhatsAppChannel({
						channel: "whatsapp",
						to: { phone: recipient.phone!, name: recipient.name },
						template:
							payload.template as WhatsAppNotificationPayload["template"],
						data: payload.data,
						body: payload.fallback?.whatsapp?.body,
					});
					break;

				default:
					continue;
			}

			if (result.success) {
				return result;
			}

			// If not retryable, try next channel
			if (!result.error?.retryable) {
				logger.warn(
					{ channel, error: result.error },
					"Channel failed with permanent error, trying next",
				);
				continue;
			}

			// If retryable, return the error (let Trigger.dev handle retry)
			return result;
		} catch (error) {
			logger.error({ channel, error }, "Channel threw exception, trying next");
		}
	}

	return {
		success: false,
		channel: priority[0] || "email",
		status: "failed",
		error: {
			code: "all_channels_failed",
			message: "All notification channels failed",
			retryable: false,
		},
	};
}

/**
 * Check which channels are available/configured
 */
export function getAvailableChannels(): NotificationChannel[] {
	const channels: NotificationChannel[] = [];

	if (isEmailConfigured()) {
		channels.push("email");
	}

	if (isSentDmConfigured()) {
		channels.push("sms", "whatsapp");
	}

	return channels;
}

/**
 * Validate notification payload
 */
export function validatePayload(payload: NotificationPayload): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!payload.channel) {
		errors.push("Channel is required");
	}

	if (!payload.to) {
		errors.push("Recipient is required");
	}

	if (!payload.template) {
		errors.push("Template is required");
	}

	// Channel-specific validation
	if (payload.channel === "email") {
		const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
		for (const r of recipients) {
			if (!("email" in r) || !r.email) {
				errors.push("Email recipient must have email field");
			}
		}
	}

	if (payload.channel === "sms" || payload.channel === "whatsapp") {
		const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
		for (const r of recipients) {
			if (!("phone" in r) || !r.phone) {
				errors.push("Phone recipient must have phone field");
			} else if (!isValidPhoneNumber(r.phone)) {
				errors.push(
					`Invalid phone format: ${r.phone}. Use E.164 format (+1234567890)`,
				);
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
