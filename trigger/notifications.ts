/**
 * Trigger.dev jobs for notification handling
 *
 * These jobs provide reliable, retryable notification delivery
 * with support for scheduling and batch processing.
 */

import { schedules, task } from "@trigger.dev/sdk/v3";
import {
	send,
	sendBatch,
	validatePayload,
} from "@/lib/notifications/notifications";
import type {
	BatchNotificationResult,
	NotificationJobPayload,
	NotificationPayload,
	NotificationResult,
} from "@/lib/notifications/types";

/**
 * Send a single notification with retries
 *
 * @example
 * import { sendNotification } from "@/trigger/notifications";
 *
 * // Trigger from anywhere in your app
 * await sendNotification.trigger({
 *   payload: {
 *     channel: "email",
 *     to: { email: "user@example.com" },
 *     template: "welcome",
 *     data: { name: "John" },
 *   },
 *   organizationId: "org_123",
 * });
 */
export const sendNotification = task({
	id: "send-notification",
	retry: {
		maxAttempts: 3,
		minTimeoutInMs: 1000,
		maxTimeoutInMs: 10000,
		factor: 2,
	},
	run: async (job: NotificationJobPayload): Promise<NotificationResult> => {
		const { payload } = job;

		// Validate payload
		const validation = validatePayload(payload);
		if (!validation.valid) {
			return {
				success: false,
				channel: payload.channel === "auto" ? "email" : payload.channel,
				status: "failed",
				error: {
					code: "validation_failed",
					message: validation.errors.join(", "),
					retryable: false,
				},
			};
		}

		// Send notification
		const result = await send(payload);

		// If failed and retryable, throw to trigger retry
		if (!result.success && result.error?.retryable) {
			throw new Error(`Notification failed: ${result.error.message}`);
		}

		return result;
	},
});

/**
 * Send notifications to multiple recipients
 *
 * @example
 * await sendBatchNotifications.trigger({
 *   payload: {
 *     channel: "sms",
 *     to: [
 *       { phone: "+1234567890" },
 *       { phone: "+0987654321" },
 *     ],
 *     template: "reminder",
 *     data: { message: "Don't forget!" },
 *   },
 * });
 */
export const sendBatchNotifications = task({
	id: "send-batch-notifications",
	retry: {
		maxAttempts: 2,
		minTimeoutInMs: 2000,
		maxTimeoutInMs: 30000,
		factor: 2,
	},
	run: async (
		job: NotificationJobPayload,
	): Promise<BatchNotificationResult> => {
		const { payload } = job;

		// Validate payload
		const validation = validatePayload(payload);
		if (!validation.valid) {
			return {
				total: 0,
				successful: 0,
				failed: 0,
				results: [
					{
						success: false,
						channel: payload.channel === "auto" ? "email" : payload.channel,
						status: "failed",
						error: {
							code: "validation_failed",
							message: validation.errors.join(", "),
							retryable: false,
						},
					},
				],
			};
		}

		return sendBatch(payload);
	},
});

/**
 * Schedule a notification for later delivery
 *
 * @example
 * await scheduleNotification.trigger({
 *   payload: {
 *     channel: "email",
 *     to: { email: "user@example.com" },
 *     template: "reminder",
 *     data: { event: "Meeting" },
 *   },
 *   scheduledFor: "2024-12-25T10:00:00Z",
 * });
 */
export const scheduleNotification = task({
	id: "schedule-notification",
	run: async (
		job: NotificationJobPayload,
	): Promise<{ scheduled: boolean; runAt: string }> => {
		const { scheduledFor } = job;

		if (!scheduledFor) {
			// No schedule, send immediately
			await sendNotification.trigger(job);
			return { scheduled: false, runAt: new Date().toISOString() };
		}

		// Schedule for later using Trigger.dev's delay
		const scheduledDate = new Date(scheduledFor);
		const now = new Date();

		if (scheduledDate <= now) {
			// Schedule time has passed, send immediately
			await sendNotification.trigger(job);
			return { scheduled: false, runAt: now.toISOString() };
		}

		// Calculate delay
		const delayMs = scheduledDate.getTime() - now.getTime();

		// Trigger with delay
		await sendNotification.trigger(job, {
			delay: `${Math.floor(delayMs / 1000)}s`,
		});

		return { scheduled: true, runAt: scheduledFor };
	},
});

/**
 * Get the start and end of "tomorrow" in a specific timezone
 */
function getTomorrowBoundsInTimezone(timezone: string): {
	start: Date;
	end: Date;
} {
	const now = new Date();

	// Get current date parts in the target timezone
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	const parts = formatter.formatToParts(now);
	const year = Number.parseInt(
		parts.find((p) => p.type === "year")?.value ?? "0",
		10,
	);
	const month =
		Number.parseInt(parts.find((p) => p.type === "month")?.value ?? "0", 10) -
		1;
	const day = Number.parseInt(
		parts.find((p) => p.type === "day")?.value ?? "0",
		10,
	);

	// Tomorrow in local timezone
	const tomorrowLocal = new Date(year, month, day + 1);

	// Convert local midnight to UTC
	const startLocal = new Date(
		tomorrowLocal.getFullYear(),
		tomorrowLocal.getMonth(),
		tomorrowLocal.getDate(),
		0,
		0,
		0,
	);
	const endLocal = new Date(
		tomorrowLocal.getFullYear(),
		tomorrowLocal.getMonth(),
		tomorrowLocal.getDate(),
		23,
		59,
		59,
		999,
	);

	// Get UTC offset for this timezone at midnight
	const getUtcOffset = (date: Date, tz: string): number => {
		const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
		const tzDate = new Date(date.toLocaleString("en-US", { timeZone: tz }));
		return utcDate.getTime() - tzDate.getTime();
	};

	const offsetMs = getUtcOffset(startLocal, timezone);

	return {
		start: new Date(startLocal.getTime() + offsetMs),
		end: new Date(endLocal.getTime() + offsetMs),
	};
}

/**
 * Daily training session summary
 * Sends summary of tomorrow's sessions to all coaches, per organization
 * Runs every day at 6am UTC (can be adjusted per timezone needs)
 */
export const dailyTrainingSummary = schedules.task({
	id: "daily-training-summary",
	cron: "0 6 * * *", // 6am UTC daily
	run: async () => {
		const { db } = await import("@/lib/db");
		const { trainingSessionTable } = await import("@/lib/db/schema/tables");
		const { TrainingSessionStatus } = await import("@/lib/db/schema/enums");
		const { eq, and, gte, lte, or } = await import("drizzle-orm");
		// date-fns not needed - using Intl.DateTimeFormat for timezone-aware formatting
		const { appConfig } = await import("@/config/app.config");
		const { logger } = await import("@/lib/logger");

		// First, get all organizations with their timezones
		const organizations = await db.query.organizationTable.findMany({
			columns: { id: true, name: true, timezone: true },
		});

		if (organizations.length === 0) {
			logger.info("No organizations found");
			return { organizations: 0, coaches: 0, sessions: 0 };
		}

		// Calculate the widest possible date range (covers all timezones)
		// UTC-12 to UTC+14 = 26 hour spread
		const now = new Date();
		const wideRangeStart = new Date(now.getTime() + (24 - 12) * 60 * 60 * 1000); // Tomorrow - 12h
		const wideRangeEnd = new Date(now.getTime() + (48 + 14) * 60 * 60 * 1000); // Day after tomorrow + 14h

		// Get all sessions in the wide range
		const allSessions = await db.query.trainingSessionTable.findMany({
			where: and(
				gte(trainingSessionTable.startTime, wideRangeStart),
				lte(trainingSessionTable.startTime, wideRangeEnd),
				eq(trainingSessionTable.isRecurring, false),
				or(
					eq(trainingSessionTable.status, TrainingSessionStatus.pending),
					eq(trainingSessionTable.status, TrainingSessionStatus.confirmed),
				),
			),
			with: {
				organization: { columns: { id: true, name: true, timezone: true } },
				location: { columns: { id: true, name: true } },
				athleteGroup: {
					columns: { id: true, name: true },
					with: {
						members: { columns: { athleteId: true } },
					},
				},
				coaches: {
					with: {
						coach: {
							with: {
								user: { columns: { id: true, name: true, email: true } },
							},
						},
					},
				},
				athletes: { columns: { athleteId: true } },
			},
		});

		// Filter sessions per organization based on their timezone
		const sessionsWithOrg = allSessions.filter((session) => {
			if (!session.organization?.timezone) return false;

			const { start, end } = getTomorrowBoundsInTimezone(
				session.organization.timezone,
			);
			const sessionStart = new Date(session.startTime);

			return sessionStart >= start && sessionStart <= end;
		});

		if (sessionsWithOrg.length === 0) {
			logger.info("No training sessions scheduled for tomorrow");
			return { organizations: 0, coaches: 0, sessions: 0 };
		}

		// Group sessions by organization
		const sessionsByOrg = new Map<
			string,
			{
				orgName: string;
				timezone: string;
				sessions: typeof sessionsWithOrg;
				coaches: Map<string, { id: string; name: string; email: string }>;
			}
		>();

		for (const session of sessionsWithOrg) {
			const orgId = session.organization?.id;
			if (!orgId) continue;

			if (!sessionsByOrg.has(orgId)) {
				sessionsByOrg.set(orgId, {
					orgName: session.organization?.name ?? "Organization",
					timezone: session.organization?.timezone ?? "UTC",
					sessions: [],
					coaches: new Map(),
				});
			}

			const orgData = sessionsByOrg.get(orgId)!;
			orgData.sessions.push(session);

			// Collect coaches
			for (const sc of session.coaches) {
				if (sc.coach.user?.email) {
					orgData.coaches.set(sc.coach.id, {
						id: sc.coach.id,
						name: sc.coach.user.name ?? "Coach",
						email: sc.coach.user.email,
					});
				}
			}
		}

		// Helper to format date in organization's timezone
		const formatInTimezone = (
			date: Date,
			tz: string,
			formatStr: string,
		): string => {
			const options: Intl.DateTimeFormatOptions = { timeZone: tz };

			if (formatStr === "time") {
				return date.toLocaleTimeString("en-US", {
					...options,
					hour: "numeric",
					minute: "2-digit",
					hour12: true,
				});
			}
			if (formatStr === "date") {
				return date.toLocaleDateString("en-US", {
					...options,
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				});
			}
			return date.toLocaleString("en-US", options);
		};

		let totalCoachesSent = 0;

		// Send summary for each organization
		for (const [orgId, orgData] of sessionsByOrg) {
			// Get tomorrow's date in this org's timezone for the summary header
			const { start: tomorrowStart } = getTomorrowBoundsInTimezone(
				orgData.timezone,
			);
			const summaryDate = formatInTimezone(
				tomorrowStart,
				orgData.timezone,
				"date",
			);

			const formattedSessions = orgData.sessions.map((session) => {
				const athleteCount = session.athleteGroup?.members
					? session.athleteGroup.members.length
					: session.athletes.length;

				const startTime = formatInTimezone(
					new Date(session.startTime),
					orgData.timezone,
					"time",
				);
				const endTime = formatInTimezone(
					new Date(session.endTime),
					orgData.timezone,
					"time",
				);

				return {
					title: session.title,
					time: `${startTime} - ${endTime}`,
					location: session.location?.name ?? "TBD",
					coaches: session.coaches.map((c) => c.coach.user?.name ?? "Coach"),
					athleteCount,
					groupName: session.athleteGroup?.name,
				};
			});

			const totalAthletes = formattedSessions.reduce(
				(sum, s) => sum + s.athleteCount,
				0,
			);

			// Send to each coach in this organization
			for (const coach of orgData.coaches.values()) {
				try {
					await sendNotification.trigger({
						payload: {
							channel: "email" as const,
							to: { email: coach.email, name: coach.name },
							template: "daily-session-summary" as const,
							data: {
								appName: appConfig.appName,
								recipientName: coach.name,
								organizationName: orgData.orgName,
								summaryDate,
								sessions: formattedSessions,
								totalSessions: orgData.sessions.length,
								totalAthletes,
							},
						},
						organizationId: orgId,
					});
					totalCoachesSent++;
				} catch (error) {
					logger.error(
						{ error, coachId: coach.id, orgId },
						"Failed to send daily summary to coach",
					);
				}
			}
		}

		logger.info(
			{
				organizations: sessionsByOrg.size,
				coaches: totalCoachesSent,
				sessions: sessionsWithOrg.length,
			},
			"Daily training summary completed",
		);

		return {
			organizations: sessionsByOrg.size,
			coaches: totalCoachesSent,
			sessions: sessionsWithOrg.length,
		};
	},
});

/**
 * Daily digest - sends a summary of pending notifications
 * Runs every day at 9am UTC
 */
export const dailyDigest = schedules.task({
	id: "daily-notification-digest",
	cron: "0 9 * * *", // 9am UTC daily
	run: async () => {
		// This is a placeholder for digest logic
		// In a real implementation, you would:
		// 1. Query pending/failed notifications from DB
		// 2. Group by user/organization
		// 3. Send summary emails

		console.log("Daily notification digest running...");

		return { processed: 0 };
	},
});

/**
 * Retry failed notifications
 * Runs every hour to pick up failed notifications and retry them
 */
export const retryFailedNotifications = schedules.task({
	id: "retry-failed-notifications",
	cron: "0 * * * *", // Every hour
	run: async () => {
		// This is a placeholder for retry logic
		// In a real implementation, you would:
		// 1. Query failed notifications from DB that are retryable
		// 2. Re-trigger them through sendNotification

		console.log("Retrying failed notifications...");

		return { retried: 0 };
	},
});
