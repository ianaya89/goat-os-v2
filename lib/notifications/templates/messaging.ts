/**
 * SMS and WhatsApp message templates
 *
 * These templates are used with Sent.dm. Each template has:
 * - A unique ID that matches the template in Sent.dm
 * - Variable placeholders using {{variable}} syntax
 * - Character limits for SMS (160 chars) and WhatsApp (4096 chars)
 */

import type { MessagingTemplateName } from "../types";

export interface MessageTemplate {
	id: MessagingTemplateName;
	/** Template content with {{variable}} placeholders */
	content: string;
	/** Variables required by this template */
	variables: string[];
	/** Maximum character length (for SMS: 160, WhatsApp: 4096) */
	maxLength?: number;
	/** Description for developers */
	description: string;
}

/**
 * Message templates for SMS and WhatsApp
 *
 * Note: These need to be registered in Sent.dm dashboard first.
 * The template IDs here must match those in Sent.dm.
 */
export const messageTemplates: Record<MessagingTemplateName, MessageTemplate> =
	{
		welcome: {
			id: "welcome",
			content:
				"Welcome to {{appName}}, {{name}}! We're excited to have you on board.",
			variables: ["appName", "name"],
			maxLength: 160,
			description: "Sent when a new user signs up",
		},

		"verification-code": {
			id: "verification-code",
			content:
				"Your {{appName}} verification code is: {{code}}. Valid for {{expiry}} minutes.",
			variables: ["appName", "code", "expiry"],
			maxLength: 160,
			description: "OTP/verification code for login or signup",
		},

		"appointment-reminder": {
			id: "appointment-reminder",
			content:
				"Reminder: You have an appointment on {{date}} at {{time}}. Reply CONFIRM to confirm or CANCEL to reschedule.",
			variables: ["date", "time"],
			maxLength: 160,
			description: "Reminder for upcoming appointments",
		},

		"order-confirmation": {
			id: "order-confirmation",
			content:
				"Order #{{orderId}} confirmed! Total: {{total}}. Track your order: {{trackingUrl}}",
			variables: ["orderId", "total", "trackingUrl"],
			maxLength: 160,
			description: "Confirmation after order placement",
		},

		"payment-reminder": {
			id: "payment-reminder",
			content:
				"Payment reminder: Your invoice of {{amount}} is due on {{dueDate}}. Pay now: {{paymentUrl}}",
			variables: ["amount", "dueDate", "paymentUrl"],
			maxLength: 160,
			description: "Reminder for pending payments",
		},

		"training-session-reminder": {
			id: "training-session-reminder",
			content:
				'Reminder: Training "{{sessionTitle}}" on {{date}} at {{time}}. Confirm: {{confirmationUrl}}',
			variables: ["sessionTitle", "date", "time", "confirmationUrl"],
			maxLength: 160,
			description:
				"Reminder for upcoming training sessions with confirmation link",
		},

		custom: {
			id: "custom",
			content: "{{message}}",
			variables: ["message"],
			description: "Custom message - content provided at send time",
		},
	};

/**
 * Render a template with variables
 */
export function renderTemplate(
	templateId: MessagingTemplateName,
	variables: Record<string, unknown>,
): string {
	const template = messageTemplates[templateId];

	if (!template) {
		throw new Error(`Unknown template: ${templateId}`);
	}

	let content = template.content;

	// Replace variables
	for (const [key, value] of Object.entries(variables)) {
		content = content.replace(new RegExp(`{{${key}}}`, "g"), String(value));
	}

	// Check for unreplaced variables
	const unreplaced = content.match(/{{(\w+)}}/g);
	if (unreplaced) {
		throw new Error(
			`Missing variables in template ${templateId}: ${unreplaced.join(", ")}`,
		);
	}

	// Warn if exceeds max length (for SMS)
	if (template.maxLength && content.length > template.maxLength) {
		console.warn(
			`Template ${templateId} exceeds max length (${content.length}/${template.maxLength})`,
		);
	}

	return content;
}

/**
 * Validate that all required variables are provided
 */
export function validateTemplateVariables(
	templateId: MessagingTemplateName,
	variables: Record<string, unknown>,
): { valid: boolean; missing: string[] } {
	const template = messageTemplates[templateId];

	if (!template) {
		return { valid: false, missing: [`Unknown template: ${templateId}`] };
	}

	const missing = template.variables.filter(
		(v) =>
			!(v in variables) || variables[v] === undefined || variables[v] === null,
	);

	return {
		valid: missing.length === 0,
		missing,
	};
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): MessageTemplate[] {
	return Object.values(messageTemplates);
}
