import { z } from "zod/v4";

// Send bulk confirmations input schema
export const sendBulkConfirmationsSchema = z.object({
	scope: z.enum(["today", "week"]),
	channel: z.enum(["email", "sms", "whatsapp"]).default("email"),
	sessionIds: z.array(z.string().uuid()).optional(), // If provided, only these sessions
});
export type SendBulkConfirmationsInput = z.infer<
	typeof sendBulkConfirmationsSchema
>;

// Send confirmation for specific sessions input schema
export const sendConfirmationsForSessionsSchema = z.object({
	sessionIds: z.array(z.string().uuid()).min(1),
	channel: z.enum(["email", "sms", "whatsapp"]).default("email"),
});
export type SendConfirmationsForSessionsInput = z.infer<
	typeof sendConfirmationsForSessionsSchema
>;

// Get confirmation history input schema
export const getConfirmationHistorySchema = z.object({
	sessionId: z.string().uuid().optional(),
	athleteId: z.string().uuid().optional(),
	status: z.enum(["sent", "delivered", "failed", "confirmed"]).optional(),
	batchId: z.string().uuid().optional(),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});
export type GetConfirmationHistoryInput = z.infer<
	typeof getConfirmationHistorySchema
>;

// Get confirmation stats input schema
export const getConfirmationStatsSchema = z.object({
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});
export type GetConfirmationStatsInput = z.infer<
	typeof getConfirmationStatsSchema
>;

// Resend confirmation input schema
export const resendConfirmationSchema = z.object({
	historyId: z.string().uuid(),
	channel: z.enum(["email", "sms", "whatsapp"]).optional(), // Optional, defaults to original channel
});
export type ResendConfirmationInput = z.infer<typeof resendConfirmationSchema>;

// Confirmation history item type (for API responses)
export const confirmationHistoryItemSchema = z.object({
	id: z.string().uuid(),
	sessionId: z.string().uuid(),
	athleteId: z.string().uuid(),
	channel: z.enum(["email", "sms", "whatsapp"]),
	status: z.enum(["sent", "delivered", "failed", "confirmed"]),
	sentAt: z.date(),
	confirmedAt: z.date().nullable(),
	errorMessage: z.string().nullable(),
	batchId: z.string().uuid().nullable(),
	session: z
		.object({
			title: z.string(),
			startTime: z.date(),
		})
		.optional(),
	athlete: z
		.object({
			name: z.string(),
			email: z.string().nullable(),
			phone: z.string().nullable(),
		})
		.optional(),
});
export type ConfirmationHistoryItem = z.infer<
	typeof confirmationHistoryItemSchema
>;

// Confirmation stats type
export const confirmationStatsSchema = z.object({
	totalSent: z.number(),
	confirmed: z.number(),
	pending: z.number(),
	failed: z.number(),
	confirmationRate: z.number(), // percentage
});
export type ConfirmationStats = z.infer<typeof confirmationStatsSchema>;

// Bulk send result type
export const bulkSendResultSchema = z.object({
	batchId: z.string().uuid(),
	sent: z.number(),
	failed: z.number(),
	skipped: z.number(), // Athletes without valid contact info
	sessionCount: z.number(),
});
export type BulkSendResult = z.infer<typeof bulkSendResultSchema>;
