/**
 * Sent.dm client for SMS and WhatsApp messaging
 *
 * API Reference: https://docs.sent.dm/docs/reference/api
 */

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type {
	DeliveryStatus,
	MessagingTemplateName,
	NotificationResult,
	PhoneRecipient,
} from "../types";

// Sent.dm API configuration
const SENT_DM_API_URL = "https://api.sent.dm";

// Permanent errors that should not be retried
const PERMANENT_ERROR_CODES = [
	"invalid_phone",
	"invalid_template",
	"unauthorized",
	"forbidden",
	"blocked",
	"unsubscribed",
];

interface SentDmConfig {
	senderId: string;
	apiKey: string;
}

interface SendMessageRequest {
	phone: string;
	templateId: string;
	channel: "sms" | "whatsapp";
	variables?: Record<string, string>;
}

interface SendMessageResponse {
	id: string;
	status: string;
	channel: string;
	createdAt: string;
}

interface SentDmError {
	code: string;
	message: string;
}

/**
 * Get Sent.dm configuration from environment
 */
function getConfig(): SentDmConfig | null {
	const senderId = env.SENT_DM_SENDER_ID;
	const apiKey = env.SENT_DM_API_KEY;

	if (!senderId || !apiKey) {
		return null;
	}

	return { senderId, apiKey };
}

/**
 * Make authenticated request to Sent.dm API
 */
async function makeRequest<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const config = getConfig();

	if (!config) {
		throw new Error("Sent.dm not configured");
	}

	const url = `${SENT_DM_API_URL}${endpoint}`;

	const response = await fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			"x-sender-id": config.senderId,
			"x-api-key": config.apiKey,
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = (await response.json().catch(() => ({}))) as SentDmError;
		throw new SentDmApiError(
			error.code || `http_${response.status}`,
			error.message || response.statusText,
			response.status,
		);
	}

	return response.json() as Promise<T>;
}

/**
 * Custom error class for Sent.dm API errors
 */
export class SentDmApiError extends Error {
	constructor(
		public code: string,
		message: string,
		public statusCode: number,
	) {
		super(message);
		this.name = "SentDmApiError";
	}

	get isRetryable(): boolean {
		// Don't retry permanent errors
		if (PERMANENT_ERROR_CODES.includes(this.code)) {
			return false;
		}
		// Retry on rate limits and server errors
		return this.statusCode === 429 || this.statusCode >= 500;
	}
}

/**
 * Map Sent.dm status to our DeliveryStatus
 */
function mapStatus(sentDmStatus: string): DeliveryStatus {
	const statusMap: Record<string, DeliveryStatus> = {
		pending: "pending",
		queued: "queued",
		sent: "sent",
		delivered: "delivered",
		failed: "failed",
		bounced: "bounced",
		blocked: "spam",
		unsubscribed: "unsubscribed",
	};

	return statusMap[sentDmStatus.toLowerCase()] || "pending";
}

/**
 * Log message to console in development (when Sent.dm not configured)
 */
function logMessageToConsole(
	channel: "sms" | "whatsapp",
	to: string,
	template: string,
	data: Record<string, unknown>,
): void {
	const channelEmoji = channel === "whatsapp" ? "📱" : "💬";
	const channelName = channel.toUpperCase();

	console.log("\n");
	console.log("=".repeat(60));
	console.log(`${channelEmoji} ${channelName} MESSAGE (DEV MODE)`);
	console.log("=".repeat(60));
	console.log(`To: ${to}`);
	console.log(`Template: ${template}`);
	console.log(`Data: ${JSON.stringify(data, null, 2)}`);
	console.log("=".repeat(60));
	console.log("\n");
}

/**
 * Send a message via SMS or WhatsApp
 */
export async function sendMessage(
	channel: "sms" | "whatsapp",
	to: PhoneRecipient,
	template: MessagingTemplateName,
	data: Record<string, unknown>,
	customBody?: string,
): Promise<NotificationResult> {
	const config = getConfig();

	// Development mode: log to console
	if (!config) {
		logger.warn(
			{ channel, to: to.phone, template },
			"Sent.dm not configured, logging message to console",
		);
		logMessageToConsole(channel, to.phone, template, data);

		return {
			success: true,
			channel,
			messageId: `dev_${Date.now()}`,
			status: "sent",
			sentAt: new Date(),
		};
	}

	try {
		// For custom template, we need to use the quick message endpoint
		if (template === "custom" && customBody) {
			// Note: Quick message endpoint is rate-limited to 5/day
			// For production, create a template first
			logger.warn(
				{ channel, to: to.phone },
				"Using quick message endpoint - limited to 5/day",
			);
		}

		const request: SendMessageRequest = {
			phone: to.phone,
			templateId: template,
			channel,
			variables: Object.fromEntries(
				Object.entries(data).map(([k, v]) => [k, String(v)]),
			),
		};

		const response = await makeRequest<SendMessageResponse>(
			"/v1/messages/phone",
			{
				method: "POST",
				body: JSON.stringify(request),
			},
		);

		logger.info(
			{ channel, to: to.phone, messageId: response.id },
			"Message sent successfully",
		);

		return {
			success: true,
			channel,
			messageId: response.id,
			status: mapStatus(response.status),
			sentAt: new Date(response.createdAt),
		};
	} catch (error) {
		const sentDmError =
			error instanceof SentDmApiError
				? error
				: new SentDmApiError("unknown", String(error), 500);

		logger.error(
			{ channel, to: to.phone, error: sentDmError },
			"Failed to send message",
		);

		return {
			success: false,
			channel,
			status: "failed",
			error: {
				code: sentDmError.code,
				message: sentDmError.message,
				retryable: sentDmError.isRetryable,
			},
		};
	}
}

/**
 * Send SMS message
 */
export async function sendSms(
	to: PhoneRecipient,
	template: MessagingTemplateName,
	data: Record<string, unknown>,
	customBody?: string,
): Promise<NotificationResult> {
	return sendMessage("sms", to, template, data, customBody);
}

/**
 * Send WhatsApp message
 */
export async function sendWhatsApp(
	to: PhoneRecipient,
	template: MessagingTemplateName,
	data: Record<string, unknown>,
	customBody?: string,
): Promise<NotificationResult> {
	return sendMessage("whatsapp", to, template, data, customBody);
}

/**
 * Send message to multiple recipients
 */
export async function sendBulkMessage(
	channel: "sms" | "whatsapp",
	recipients: PhoneRecipient[],
	template: MessagingTemplateName,
	data: Record<string, unknown>,
): Promise<NotificationResult[]> {
	const results = await Promise.allSettled(
		recipients.map((recipient) =>
			sendMessage(channel, recipient, template, data),
		),
	);

	return results.map((result, _index) => {
		if (result.status === "fulfilled") {
			return result.value;
		}

		return {
			success: false,
			channel,
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
 * Validate phone number format (E.164)
 */
export function isValidPhoneNumber(phone: string): boolean {
	// E.164 format: + followed by 1-15 digits
	const e164Regex = /^\+[1-9]\d{1,14}$/;
	return e164Regex.test(phone);
}

/**
 * Check if Sent.dm is configured
 */
export function isSentDmConfigured(): boolean {
	return getConfig() !== null;
}
