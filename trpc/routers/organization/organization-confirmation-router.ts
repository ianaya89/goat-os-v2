import { TRPCError } from "@trpc/server";
import { addDays, endOfDay, endOfWeek, format, startOfWeek } from "date-fns";
import { and, between, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { appConfig } from "@/config/app.config";
import { db } from "@/lib/db";
import {
	ConfirmationStatus,
	type NotificationChannel,
	TrainingSessionStatus,
} from "@/lib/db/schema/enums";
import {
	athleteTable,
	sessionConfirmationHistoryTable,
	trainingSessionAthleteTable,
	trainingSessionTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import { generateConfirmationUrl } from "@/lib/notifications/confirmation-token";
import { sendNotificationWithFallback } from "@/lib/notifications/send-with-fallback";
import { getBaseUrl } from "@/lib/utils";
import {
	getConfirmationHistorySchema,
	getConfirmationStatsSchema,
	resendConfirmationSchema,
	sendBulkConfirmationsSchema,
	sendConfirmationsForSessionsSchema,
} from "@/schemas/organization-confirmation-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const confirmationRouter = createTRPCRouter({
	// Preview confirmation count before sending
	previewBulk: protectedOrganizationProcedure
		.input(
			z.object({
				scope: z.enum(["today", "week"]),
			}),
		)
		.query(async ({ ctx, input }) => {
			const now = new Date();

			// Determine date range based on scope
			// Always start from now (not start of day) to exclude past sessions
			const startDate = now;
			let endDate: Date;

			if (input.scope === "today") {
				endDate = endOfDay(now);
			} else {
				endDate = endOfWeek(now, { weekStartsOn: 1 });
			}

			// Get sessions in the date range
			const sessions = await db.query.trainingSessionTable.findMany({
				where: and(
					eq(trainingSessionTable.organizationId, ctx.organization.id),
					between(trainingSessionTable.startTime, startDate, endDate),
					eq(trainingSessionTable.status, TrainingSessionStatus.pending),
				),
				with: {
					athleteGroup: {
						with: {
							members: true,
						},
					},
					athletes: true,
				},
			});

			// Count total notifications to send (athletes per session)
			let totalNotifications = 0;
			const uniqueAthleteIds = new Set<string>();

			for (const session of sessions) {
				// Count athletes for this session
				if (session.athleteGroup && session.athleteGroup.members.length > 0) {
					// Use group members
					totalNotifications += session.athleteGroup.members.length;
					for (const member of session.athleteGroup.members) {
						uniqueAthleteIds.add(member.athleteId);
					}
				} else if (session.athletes.length > 0) {
					// Use individual athletes
					totalNotifications += session.athletes.length;
					for (const sa of session.athletes) {
						uniqueAthleteIds.add(sa.athleteId);
					}
				}
			}

			return {
				sessionCount: sessions.length,
				athleteCount: totalNotifications,
				uniqueAthleteCount: uniqueAthleteIds.size,
			};
		}),

	// Send bulk confirmations for today or week
	sendBulk: protectedOrganizationProcedure
		.input(sendBulkConfirmationsSchema)
		.mutation(async ({ ctx, input }) => {
			const now = new Date();
			const channel = input.channel ?? "email";

			// Determine date range based on scope
			// Always start from now (not start of day) to exclude past sessions
			const startDate = now;
			let endDate: Date;

			if (input.scope === "today") {
				endDate = endOfDay(now);
			} else {
				// week - from now to end of week
				endDate = endOfWeek(now, { weekStartsOn: 1 }); // Monday as week start
			}

			// Get sessions in the date range
			const sessionsQuery = db.query.trainingSessionTable.findMany({
				where: and(
					eq(trainingSessionTable.organizationId, ctx.organization.id),
					between(trainingSessionTable.startTime, startDate, endDate),
					eq(trainingSessionTable.status, TrainingSessionStatus.pending),
				),
				with: {
					location: { columns: { id: true, name: true } },
					athleteGroup: {
						with: {
							members: {
								with: {
									athlete: {
										columns: { id: true, phone: true },
										with: {
											user: {
												columns: { id: true, name: true, email: true },
											},
										},
									},
								},
							},
						},
					},
					coaches: {
						with: {
							coach: {
								with: {
									user: { columns: { id: true, name: true } },
								},
							},
						},
					},
					athletes: {
						with: {
							athlete: {
								columns: { id: true, phone: true },
								with: {
									user: { columns: { id: true, name: true, email: true } },
								},
							},
						},
					},
				},
			});

			// If specific session IDs provided, filter by them
			const sessions = input.sessionIds
				? (await sessionsQuery).filter((s) => input.sessionIds?.includes(s.id))
				: await sessionsQuery;

			if (sessions.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No pending sessions found in the specified date range",
				});
			}

			// Generate batch ID
			const batchId = crypto.randomUUID();
			const baseUrl = getBaseUrl();

			let totalSent = 0;
			let totalFailed = 0;
			let totalSkipped = 0;
			const historyRecords: (typeof sessionConfirmationHistoryTable.$inferInsert)[] =
				[];

			for (const session of sessions) {
				// Get athletes list with contact info
				// Use group members if group exists and has members, otherwise use individual athletes
				const hasGroupMembers =
					session.athleteGroup?.members &&
					session.athleteGroup.members.length > 0;

				const allAthletes = hasGroupMembers
					? session.athleteGroup!.members.map((m) => ({
							id: m.athlete.id,
							name: m.athlete.user?.name ?? "Athlete",
							email: m.athlete.user?.email ?? null,
							phone: m.athlete.phone ?? null,
						}))
					: session.athletes.map((a) => ({
							id: a.athlete.id,
							name: a.athlete.user?.name ?? "Athlete",
							email: a.athlete.user?.email ?? null,
							phone: a.athlete.phone ?? null,
						}));

				// Filter athletes based on channel
				const athletes =
					channel === "email"
						? allAthletes.filter((a) => a.email)
						: allAthletes.filter((a) => a.phone);

				// Track skipped athletes
				totalSkipped += allAthletes.length - athletes.length;

				if (athletes.length === 0) continue;

				// Get primary coach name
				const primaryCoach = session.coaches.find((c) => c.isPrimary);
				const coachName =
					primaryCoach?.coach.user?.name ??
					session.coaches[0]?.coach.user?.name ??
					"Your Coach";

				// Format session details
				const sessionDate = format(
					new Date(session.startTime),
					"EEEE, MMMM d, yyyy",
				);
				const shortDate = format(new Date(session.startTime), "MMM d");
				const sessionTime = `${format(new Date(session.startTime), "h:mm a")} - ${format(new Date(session.endTime), "h:mm a")}`;
				const shortTime = format(new Date(session.startTime), "h:mm a");
				const locationName = session.location?.name ?? "TBD";

				// Send notifications via Trigger.dev
				const notifications = athletes.map(async (athlete) => {
					const confirmationUrl = generateConfirmationUrl(
						baseUrl,
						session.id,
						athlete.id,
					);

					const payload =
						channel === "email"
							? {
									channel: "email" as const,
									to: { email: athlete.email!, name: athlete.name },
									template: "training-session-reminder" as const,
									data: {
										appName: appConfig.appName,
										athleteName: athlete.name,
										sessionTitle: session.title,
										sessionDate,
										sessionTime,
										location: locationName,
										coachName,
										organizationName: ctx.organization.name,
										confirmationUrl,
									},
								}
							: {
									channel: channel as "sms" | "whatsapp",
									to: { phone: athlete.phone!, name: athlete.name },
									template: "training-session-reminder" as const,
									data: {
										sessionTitle: session.title,
										date: shortDate,
										time: shortTime,
										confirmationUrl,
									},
								};

					const result = await sendNotificationWithFallback(payload, {
						organizationId: ctx.organization.id,
						triggeredBy: ctx.user.id,
					});

					if (result.success) {
						// Create history record for successful send
						historyRecords.push({
							organizationId: ctx.organization.id,
							sessionId: session.id,
							athleteId: athlete.id,
							channel: channel as NotificationChannel,
							status: ConfirmationStatus.sent,
							triggerJobId: result.id,
							batchId,
							initiatedBy: ctx.user.id,
						});

						return { success: true, athleteId: athlete.id };
					}

					logger.error(
						{
							error: result.error,
							athleteId: athlete.id,
							sessionId: session.id,
						},
						"Failed to send notification",
					);

					// Create history record for failed send
					historyRecords.push({
						organizationId: ctx.organization.id,
						sessionId: session.id,
						athleteId: athlete.id,
						channel: channel as NotificationChannel,
						status: ConfirmationStatus.failed,
						errorMessage: result.error ?? "Unknown error",
						batchId,
						initiatedBy: ctx.user.id,
					});

					return { success: false, athleteId: athlete.id };
				});

				const results = await Promise.all(notifications);
				totalSent += results.filter((r) => r.success).length;
				totalFailed += results.filter((r) => !r.success).length;
			}

			// Insert all history records
			if (historyRecords.length > 0) {
				await db.insert(sessionConfirmationHistoryTable).values(historyRecords);
			}

			return {
				batchId,
				sent: totalSent,
				failed: totalFailed,
				skipped: totalSkipped,
				sessionCount: sessions.length,
			};
		}),

	// Send confirmations for specific sessions (used by bulk actions)
	sendForSessions: protectedOrganizationProcedure
		.input(sendConfirmationsForSessionsSchema)
		.mutation(async ({ ctx, input }) => {
			const baseUrl = getBaseUrl();
			const batchId = crypto.randomUUID();

			// Get the specific sessions
			const sessions = await db.query.trainingSessionTable.findMany({
				where: and(
					eq(trainingSessionTable.organizationId, ctx.organization.id),
					sql`${trainingSessionTable.id} IN ${input.sessionIds}`,
				),
				with: {
					location: { columns: { id: true, name: true } },
					athleteGroup: {
						with: {
							members: {
								with: {
									athlete: {
										columns: { id: true, phone: true },
										with: {
											user: {
												columns: { id: true, name: true, email: true },
											},
										},
									},
								},
							},
						},
					},
					coaches: {
						with: {
							coach: {
								with: {
									user: { columns: { id: true, name: true } },
								},
							},
						},
					},
					athletes: {
						with: {
							athlete: {
								columns: { id: true, phone: true },
								with: {
									user: { columns: { id: true, name: true, email: true } },
								},
							},
						},
					},
				},
			});

			if (sessions.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "No sessions found",
				});
			}

			let totalSent = 0;
			let totalFailed = 0;
			let totalSkipped = 0;
			const historyRecords: (typeof sessionConfirmationHistoryTable.$inferInsert)[] =
				[];

			// Determine which channels to send to
			const channelsToSend: Array<"email" | "sms" | "whatsapp"> =
				input.channel === "all"
					? ["email", "whatsapp", "sms"]
					: [input.channel ?? "email"];

			for (const session of sessions) {
				// Skip non-pending and past sessions
				if (
					session.status !== TrainingSessionStatus.pending ||
					new Date(session.startTime) <= new Date()
				) {
					continue;
				}

				// Get athletes list with contact info
				// Use group members if group exists and has members, otherwise use individual athletes
				const hasGroupMembers =
					session.athleteGroup?.members &&
					session.athleteGroup.members.length > 0;

				const allAthletes = hasGroupMembers
					? session.athleteGroup!.members.map((m) => ({
							id: m.athlete.id,
							name: m.athlete.user?.name ?? "Athlete",
							email: m.athlete.user?.email ?? null,
							phone: m.athlete.phone ?? null,
						}))
					: session.athletes.map((a) => ({
							id: a.athlete.id,
							name: a.athlete.user?.name ?? "Athlete",
							email: a.athlete.user?.email ?? null,
							phone: a.athlete.phone ?? null,
						}));

				// Get primary coach name
				const primaryCoach = session.coaches.find((c) => c.isPrimary);
				const coachName =
					primaryCoach?.coach.user?.name ??
					session.coaches[0]?.coach.user?.name ??
					"Your Coach";

				// Format session details
				const sessionDate = format(
					new Date(session.startTime),
					"EEEE, MMMM d, yyyy",
				);
				const shortDate = format(new Date(session.startTime), "MMM d");
				const sessionTime = `${format(new Date(session.startTime), "h:mm a")} - ${format(new Date(session.endTime), "h:mm a")}`;
				const shortTime = format(new Date(session.startTime), "h:mm a");
				const locationName = session.location?.name ?? "TBD";

				// Send notifications for each channel
				for (const channel of channelsToSend) {
					// Filter athletes based on channel
					const athletes =
						channel === "email"
							? allAthletes.filter((a) => a.email)
							: allAthletes.filter((a) => a.phone);

					// Only count skipped for single channel mode (not "all")
					if (input.channel !== "all") {
						totalSkipped += allAthletes.length - athletes.length;
					}

					if (athletes.length === 0) continue;

					// Send notifications
					for (const athlete of athletes) {
						const confirmationUrl = generateConfirmationUrl(
							baseUrl,
							session.id,
							athlete.id,
						);

						const payload =
							channel === "email"
								? {
										channel: "email" as const,
										to: { email: athlete.email!, name: athlete.name },
										template: "training-session-reminder" as const,
										data: {
											appName: appConfig.appName,
											athleteName: athlete.name,
											sessionTitle: session.title,
											sessionDate,
											sessionTime,
											location: locationName,
											coachName,
											organizationName: ctx.organization.name,
											confirmationUrl,
										},
									}
								: {
										channel: channel as "sms" | "whatsapp",
										to: { phone: athlete.phone!, name: athlete.name },
										template: "training-session-reminder" as const,
										data: {
											sessionTitle: session.title,
											date: shortDate,
											time: shortTime,
											confirmationUrl,
										},
									};

						const result = await sendNotificationWithFallback(payload, {
							organizationId: ctx.organization.id,
							triggeredBy: ctx.user.id,
						});

						if (result.success) {
							historyRecords.push({
								organizationId: ctx.organization.id,
								sessionId: session.id,
								athleteId: athlete.id,
								channel: channel as NotificationChannel,
								status: ConfirmationStatus.sent,
								triggerJobId: result.id,
								batchId,
								initiatedBy: ctx.user.id,
							});

							totalSent++;
						} else {
							logger.error(
								{
									error: result.error,
									athleteId: athlete.id,
									sessionId: session.id,
									channel,
								},
								"Failed to send notification",
							);

							historyRecords.push({
								organizationId: ctx.organization.id,
								sessionId: session.id,
								athleteId: athlete.id,
								channel: channel as NotificationChannel,
								status: ConfirmationStatus.failed,
								errorMessage: result.error ?? "Unknown error",
								batchId,
								initiatedBy: ctx.user.id,
							});

							totalFailed++;
						}
					}
				}
			}

			// Insert history records
			if (historyRecords.length > 0) {
				await db.insert(sessionConfirmationHistoryTable).values(historyRecords);
			}

			return {
				batchId,
				sent: totalSent,
				failed: totalFailed,
				skipped: totalSkipped,
				sessionCount: sessions.length,
			};
		}),

	// Get confirmation history
	getHistory: protectedOrganizationProcedure
		.input(getConfirmationHistorySchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(sessionConfirmationHistoryTable.organizationId, ctx.organization.id),
			];

			if (input.sessionId) {
				conditions.push(
					eq(sessionConfirmationHistoryTable.sessionId, input.sessionId),
				);
			}

			if (input.athleteId) {
				conditions.push(
					eq(sessionConfirmationHistoryTable.athleteId, input.athleteId),
				);
			}

			if (input.status) {
				conditions.push(
					eq(
						sessionConfirmationHistoryTable.status,
						input.status as ConfirmationStatus,
					),
				);
			}

			if (input.batchId) {
				conditions.push(
					eq(sessionConfirmationHistoryTable.batchId, input.batchId),
				);
			}

			if (input.dateRange) {
				conditions.push(
					between(
						sessionConfirmationHistoryTable.sentAt,
						input.dateRange.from,
						input.dateRange.to,
					),
				);
			}

			const [history, totalCount] = await Promise.all([
				db.query.sessionConfirmationHistoryTable.findMany({
					where: and(...conditions),
					with: {
						session: {
							columns: { id: true, title: true, startTime: true },
						},
						athlete: {
							columns: { id: true, phone: true },
							with: {
								user: { columns: { name: true, email: true } },
							},
						},
					},
					orderBy: [desc(sessionConfirmationHistoryTable.sentAt)],
					limit: input.limit,
					offset: input.offset,
				}),
				db
					.select({ count: count() })
					.from(sessionConfirmationHistoryTable)
					.where(and(...conditions))
					.then((r) => r[0]?.count ?? 0),
			]);

			return {
				items: history.map((h) => ({
					id: h.id,
					sessionId: h.sessionId,
					athleteId: h.athleteId,
					channel: h.channel,
					status: h.status,
					sentAt: h.sentAt,
					confirmedAt: h.confirmedAt,
					errorMessage: h.errorMessage,
					batchId: h.batchId,
					session: h.session
						? {
								title: h.session.title,
								startTime: h.session.startTime,
							}
						: undefined,
					athlete: h.athlete
						? {
								name: h.athlete.user?.name ?? "Unknown",
								email: h.athlete.user?.email ?? null,
								phone: h.athlete.phone ?? null,
							}
						: undefined,
				})),
				total: totalCount,
				hasMore: input.offset + history.length < totalCount,
			};
		}),

	// Get confirmation stats
	getStats: protectedOrganizationProcedure
		.input(getConfirmationStatsSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(sessionConfirmationHistoryTable.organizationId, ctx.organization.id),
			];

			if (input.dateRange) {
				conditions.push(
					between(
						sessionConfirmationHistoryTable.sentAt,
						input.dateRange.from,
						input.dateRange.to,
					),
				);
			}

			const stats = await db
				.select({
					status: sessionConfirmationHistoryTable.status,
					count: count(),
				})
				.from(sessionConfirmationHistoryTable)
				.where(and(...conditions))
				.groupBy(sessionConfirmationHistoryTable.status);

			const totalSent = stats.reduce((acc, s) => acc + s.count, 0);
			const confirmed =
				stats.find((s) => s.status === ConfirmationStatus.confirmed)?.count ??
				0;
			const failed =
				stats.find((s) => s.status === ConfirmationStatus.failed)?.count ?? 0;
			const pending = totalSent - confirmed - failed;

			return {
				totalSent,
				confirmed,
				pending,
				failed,
				confirmationRate:
					totalSent > 0 ? Math.round((confirmed / totalSent) * 100) : 0,
			};
		}),

	// Resend a confirmation
	resend: protectedOrganizationProcedure
		.input(resendConfirmationSchema)
		.mutation(async ({ ctx, input }) => {
			// Get the original history record
			const original = await db.query.sessionConfirmationHistoryTable.findFirst(
				{
					where: and(
						eq(sessionConfirmationHistoryTable.id, input.historyId),
						eq(
							sessionConfirmationHistoryTable.organizationId,
							ctx.organization.id,
						),
					),
					with: {
						session: {
							with: {
								location: { columns: { id: true, name: true } },
								coaches: {
									with: {
										coach: {
											with: {
												user: { columns: { id: true, name: true } },
											},
										},
									},
								},
							},
						},
						athlete: {
							columns: { id: true, phone: true },
							with: {
								user: { columns: { id: true, name: true, email: true } },
							},
						},
					},
				},
			);

			if (!original) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Confirmation record not found",
				});
			}

			if (!original.session || !original.athlete) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Session or athlete no longer exists",
				});
			}

			// Check if session is still in the future
			if (new Date(original.session.startTime) <= new Date()) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot resend confirmation for past sessions",
				});
			}

			const channel = input.channel ?? original.channel;
			const baseUrl = getBaseUrl();

			const athlete = {
				id: original.athlete.id,
				name: original.athlete.user?.name ?? "Athlete",
				email: original.athlete.user?.email ?? null,
				phone: original.athlete.phone ?? null,
			};

			// Validate contact info for channel
			if (channel === "email" && !athlete.email) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Athlete does not have an email address",
				});
			}
			if (channel !== "email" && !athlete.phone) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Athlete does not have a phone number",
				});
			}

			// Get primary coach name
			const primaryCoach = original.session.coaches.find((c) => c.isPrimary);
			const coachName =
				primaryCoach?.coach.user?.name ??
				original.session.coaches[0]?.coach.user?.name ??
				"Your Coach";

			// Format session details
			const sessionDate = format(
				new Date(original.session.startTime),
				"EEEE, MMMM d, yyyy",
			);
			const shortDate = format(new Date(original.session.startTime), "MMM d");
			const sessionTime = `${format(new Date(original.session.startTime), "h:mm a")} - ${format(new Date(original.session.endTime), "h:mm a")}`;
			const shortTime = format(new Date(original.session.startTime), "h:mm a");
			const locationName = original.session.location?.name ?? "TBD";
			const confirmationUrl = generateConfirmationUrl(
				baseUrl,
				original.session.id,
				athlete.id,
			);

			const payload =
				channel === "email"
					? {
							channel: "email" as const,
							to: { email: athlete.email!, name: athlete.name },
							template: "training-session-reminder" as const,
							data: {
								appName: appConfig.appName,
								athleteName: athlete.name,
								sessionTitle: original.session.title,
								sessionDate,
								sessionTime,
								location: locationName,
								coachName,
								organizationName: ctx.organization.name,
								confirmationUrl,
							},
						}
					: {
							channel: channel as "sms" | "whatsapp",
							to: { phone: athlete.phone!, name: athlete.name },
							template: "training-session-reminder" as const,
							data: {
								sessionTitle: original.session.title,
								date: shortDate,
								time: shortTime,
								confirmationUrl,
							},
						};

			const result = await sendNotificationWithFallback(payload, {
				organizationId: ctx.organization.id,
				triggeredBy: ctx.user.id,
			});

			if (!result.success) {
				logger.error(
					{ error: result.error, historyId: input.historyId },
					"Failed to resend confirmation",
				);

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: result.error ?? "Failed to resend confirmation",
				});
			}

			// Create new history record
			const [newRecord] = await db
				.insert(sessionConfirmationHistoryTable)
				.values({
					organizationId: ctx.organization.id,
					sessionId: original.sessionId,
					athleteId: original.athleteId,
					channel: channel as NotificationChannel,
					status: ConfirmationStatus.sent,
					triggerJobId: result.id,
					initiatedBy: ctx.user.id,
				})
				.returning();

			if (!newRecord) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create confirmation history record",
				});
			}

			return {
				success: true,
				historyId: newRecord.id,
			};
		}),
});
