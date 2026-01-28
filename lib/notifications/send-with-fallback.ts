/**
 * Notification sending with Trigger.dev fallback
 *
 * Uses Trigger.dev for background processing when configured,
 * otherwise falls back to direct sending.
 */

import { logger } from "@/lib/logger";
import { send } from "./notifications";
import type { NotificationPayload, NotificationResult } from "./types";

/**
 * Check if Trigger.dev is configured
 */
export function isTriggerConfigured(): boolean {
	return !!process.env.TRIGGER_SECRET_KEY;
}

/**
 * Send notification with automatic fallback
 *
 * - If Trigger.dev is configured: uses background job for reliable delivery
 * - If not configured: sends directly (synchronous)
 *
 * @returns Object with success status and optional job/message ID
 */
export async function sendNotificationWithFallback(
	payload: NotificationPayload,
	options?: {
		organizationId?: string;
		triggeredBy?: string;
	},
): Promise<{
	success: boolean;
	id?: string;
	error?: string;
	usedTrigger: boolean;
}> {
	// Try Trigger.dev if configured
	if (isTriggerConfigured()) {
		try {
			// Dynamic import to avoid initialization errors when not configured
			const { sendNotification } = await import("@/trigger/notifications");

			const handle = await sendNotification.trigger({
				payload,
				organizationId: options?.organizationId,
				triggeredBy: options?.triggeredBy,
			});

			return {
				success: true,
				id: handle.id,
				usedTrigger: true,
			};
		} catch (error) {
			logger.error(
				{ error },
				"Trigger.dev failed, falling back to direct send",
			);
			// Fall through to direct send
		}
	}

	// Direct send (fallback or when Trigger.dev not configured)
	try {
		const result: NotificationResult = await send(payload);

		if (!result.success) {
			return {
				success: false,
				error: result.error?.message ?? "Failed to send notification",
				usedTrigger: false,
			};
		}

		return {
			success: true,
			id: result.messageId,
			usedTrigger: false,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger.error({ error }, "Direct notification send failed");

		return {
			success: false,
			error: errorMessage,
			usedTrigger: false,
		};
	}
}
