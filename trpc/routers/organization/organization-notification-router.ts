/**
 * Notification router for sending notifications from the UI
 *
 * Supports:
 * - Direct sending (immediate)
 * - Queued sending via Trigger.dev (with retries)
 * - Scheduled sending (future delivery)
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { logger } from "@/lib/logger";
import {
	getAvailableChannels,
	send,
	validatePayload,
} from "@/lib/notifications/notifications";
import type { NotificationPayload } from "@/lib/notifications/types";
import {
	scheduleNotification,
	sendNotification,
} from "@/trigger/notifications";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

// Zod schemas for input validation
const emailRecipientSchema = z.object({
	email: z.string().email(),
	name: z.string().optional(),
});

const phoneRecipientSchema = z.object({
	phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format"),
	name: z.string().optional(),
});

const multiChannelRecipientSchema = z.object({
	email: z.string().email().optional(),
	phone: z
		.string()
		.regex(/^\+[1-9]\d{1,14}$/)
		.optional(),
	name: z.string().optional(),
});

const emailNotificationSchema = z.object({
	channel: z.literal("email"),
	to: z.union([emailRecipientSchema, z.array(emailRecipientSchema)]),
	template: z.enum([
		"verify-email",
		"password-reset",
		"organization-invitation",
		"payment-failed",
		"subscription-canceled",
		"trial-ending",
		"welcome",
	]),
	data: z.record(z.string(), z.unknown()),
	subject: z.string().optional(),
	replyTo: z.string().email().optional(),
});

const smsNotificationSchema = z.object({
	channel: z.literal("sms"),
	to: z.union([phoneRecipientSchema, z.array(phoneRecipientSchema)]),
	template: z.enum([
		"welcome",
		"verification-code",
		"appointment-reminder",
		"order-confirmation",
		"payment-reminder",
		"custom",
	]),
	data: z.record(z.string(), z.unknown()),
	body: z.string().optional(),
});

const whatsappNotificationSchema = z.object({
	channel: z.literal("whatsapp"),
	to: z.union([phoneRecipientSchema, z.array(phoneRecipientSchema)]),
	template: z.enum([
		"welcome",
		"verification-code",
		"appointment-reminder",
		"order-confirmation",
		"payment-reminder",
		"custom",
	]),
	data: z.record(z.string(), z.unknown()),
	body: z.string().optional(),
});

const autoNotificationSchema = z.object({
	channel: z.literal("auto"),
	to: z.union([
		multiChannelRecipientSchema,
		z.array(multiChannelRecipientSchema),
	]),
	template: z.string(),
	data: z.record(z.string(), z.unknown()),
	priority: z.array(z.enum(["email", "sms", "whatsapp"])).optional(),
});

const notificationPayloadSchema = z.discriminatedUnion("channel", [
	emailNotificationSchema,
	smsNotificationSchema,
	whatsappNotificationSchema,
	autoNotificationSchema,
]);

const sendNotificationInputSchema = z.object({
	payload: notificationPayloadSchema,
	/** If true, send via Trigger.dev for retries and reliability */
	useQueue: z.boolean().default(false),
	/** ISO date string for scheduled delivery */
	scheduledFor: z.iso.datetime().optional(),
});

export const organizationNotificationRouter = createTRPCRouter({
	/**
	 * Get available notification channels (based on configuration)
	 */
	getChannels: protectedOrganizationProcedure.query(() => {
		return {
			channels: getAvailableChannels(),
			configured: {
				email: getAvailableChannels().includes("email"),
				sms: getAvailableChannels().includes("sms"),
				whatsapp: getAvailableChannels().includes("whatsapp"),
			},
		};
	}),

	/**
	 * Send a notification (directly or via queue)
	 *
	 * @example
	 * // Send email directly
	 * await trpc.organization.notification.send.mutate({
	 *   payload: {
	 *     channel: "email",
	 *     to: { email: "user@example.com" },
	 *     template: "welcome",
	 *     data: { name: "John" },
	 *   },
	 * });
	 *
	 * @example
	 * // Send via queue with retries
	 * await trpc.organization.notification.send.mutate({
	 *   payload: {
	 *     channel: "whatsapp",
	 *     to: { phone: "+1234567890" },
	 *     template: "reminder",
	 *     data: { message: "Don't forget!" },
	 *   },
	 *   useQueue: true,
	 * });
	 *
	 * @example
	 * // Schedule for later
	 * await trpc.organization.notification.send.mutate({
	 *   payload: { ... },
	 *   useQueue: true,
	 *   scheduledFor: "2024-12-25T10:00:00Z",
	 * });
	 */
	send: protectedOrganizationProcedure
		.input(sendNotificationInputSchema)
		.mutation(async ({ ctx, input }) => {
			const { payload, useQueue, scheduledFor } = input;

			// Validate payload
			const validation = validatePayload(payload as NotificationPayload);
			if (!validation.valid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Invalid notification payload: ${validation.errors.join(", ")}`,
				});
			}

			logger.info(
				{
					channel: payload.channel,
					template: payload.template,
					useQueue,
					scheduledFor,
					organizationId: ctx.organization.id,
					userId: ctx.user.id,
				},
				"Sending notification",
			);

			// If scheduled or using queue, trigger via Trigger.dev
			if (useQueue || scheduledFor) {
				const jobPayload = {
					payload: payload as NotificationPayload,
					organizationId: ctx.organization.id,
					triggeredBy: ctx.user.id,
					scheduledFor,
				};

				if (scheduledFor) {
					const result = await scheduleNotification.trigger(jobPayload);
					return {
						success: true,
						queued: true,
						scheduled: true,
						scheduledFor,
						jobId: result.id,
					};
				}

				const result = await sendNotification.trigger(jobPayload);
				return {
					success: true,
					queued: true,
					scheduled: false,
					jobId: result.id,
				};
			}

			// Direct send
			const result = await send(payload as NotificationPayload);

			if (!result.success) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: result.error?.message || "Failed to send notification",
				});
			}

			return {
				success: true,
				queued: false,
				scheduled: false,
				messageId: result.messageId,
				channel: result.channel,
			};
		}),

	/**
	 * Send notification to multiple recipients in batch
	 */
	sendBatch: protectedOrganizationProcedure
		.input(
			z.object({
				payload: notificationPayloadSchema,
				useQueue: z.boolean().default(true), // Default to queue for batch
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { payload, useQueue } = input;
			const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

			logger.info(
				{
					channel: payload.channel,
					template: payload.template,
					recipientCount: recipients.length,
					organizationId: ctx.organization.id,
				},
				"Sending batch notification",
			);

			if (useQueue) {
				// Trigger individual jobs for each recipient
				const jobs = await Promise.all(
					recipients.map((recipient) =>
						sendNotification.trigger({
							payload: { ...payload, to: recipient } as NotificationPayload,
							organizationId: ctx.organization.id,
							triggeredBy: ctx.user.id,
						}),
					),
				);

				return {
					success: true,
					queued: true,
					total: recipients.length,
					jobIds: jobs.map((j) => j.id),
				};
			}

			// Direct batch send
			const results = await Promise.all(
				recipients.map((recipient) =>
					send({ ...payload, to: recipient } as NotificationPayload),
				),
			);

			const successful = results.filter((r) => r.success).length;

			return {
				success: successful === results.length,
				queued: false,
				total: results.length,
				successful,
				failed: results.length - successful,
				results,
			};
		}),
});
