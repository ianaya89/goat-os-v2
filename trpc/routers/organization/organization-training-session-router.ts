import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	lte,
	or,
	type SQL,
} from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { TrainingSessionStatus } from "@/lib/db/schema/enums";
import {
	athleteEvaluationTable,
	athleteGroupMemberTable,
	athleteSessionFeedbackTable,
	athleteTable,
	attendanceTable,
	coachTable,
	recurringSessionExceptionTable,
	trainingSessionAthleteTable,
	trainingSessionCoachTable,
	trainingSessionTable,
} from "@/lib/db/schema/tables";
import { env } from "@/lib/env";
import {
	deleteObject,
	generateStorageKey,
	getSignedUploadUrl,
	getSignedUrl,
} from "@/lib/storage";
import {
	bulkDeleteTrainingSessionsSchema,
	bulkUpdateTrainingSessionsStatusSchema,
	cancelRecurringOccurrenceSchema,
	completeSessionSchema,
	createTrainingSessionSchema,
	deleteSessionAttachmentSchema,
	deleteTrainingSessionSchema,
	getSessionAttachmentDownloadUrlSchema,
	getSessionAttachmentUploadUrlSchema,
	listTrainingSessionsForCalendarSchema,
	listTrainingSessionsSchema,
	modifyRecurringOccurrenceSchema,
	updateSessionAthletesSchema,
	updateSessionAttachmentSchema,
	updateSessionCoachesSchema,
	updateTrainingSessionSchema,
} from "@/schemas/organization-training-session-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationTrainingSessionRouter = createTRPCRouter({
	list: protectedOrganizationProcedure
		.input(listTrainingSessionsSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(trainingSessionTable.organizationId, ctx.organization.id),
			];

			// Search query
			if (input.query) {
				conditions.push(
					or(
						ilike(trainingSessionTable.title, `%${input.query}%`),
						ilike(trainingSessionTable.description, `%${input.query}%`),
					)!,
				);
			}

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(
					inArray(trainingSessionTable.status, input.filters.status),
				);
			}

			// Location filter
			if (input.filters?.locationId) {
				conditions.push(
					eq(trainingSessionTable.locationId, input.filters.locationId),
				);
			}

			// Athlete group filter
			if (input.filters?.athleteGroupId) {
				conditions.push(
					eq(trainingSessionTable.athleteGroupId, input.filters.athleteGroupId),
				);
			}

			// Date range filter
			if (input.filters?.dateRange) {
				conditions.push(
					and(
						gte(trainingSessionTable.startTime, input.filters.dateRange.from),
						lte(trainingSessionTable.startTime, input.filters.dateRange.to),
					)!,
				);
			}

			// Recurring filter
			if (input.filters?.isRecurring !== undefined) {
				conditions.push(
					eq(trainingSessionTable.isRecurring, input.filters.isRecurring),
				);
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "title":
					orderByColumn = sortDirection(trainingSessionTable.title);
					break;
				case "startTime":
					orderByColumn = sortDirection(trainingSessionTable.startTime);
					break;
				case "endTime":
					orderByColumn = sortDirection(trainingSessionTable.endTime);
					break;
				case "status":
					orderByColumn = sortDirection(trainingSessionTable.status);
					break;
				default:
					orderByColumn = sortDirection(trainingSessionTable.createdAt);
					break;
			}

			// Run queries in parallel
			const [sessions, countResult] = await Promise.all([
				db.query.trainingSessionTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						location: {
							columns: { id: true, name: true },
						},
						athleteGroup: {
							columns: { id: true, name: true },
						},
						coaches: {
							with: {
								coach: {
									with: {
										user: {
											columns: { id: true, name: true, image: true },
										},
									},
								},
							},
						},
						athletes: {
							with: {
								athlete: {
									with: {
										user: {
											columns: { id: true, name: true, image: true },
										},
									},
								},
							},
						},
						payments: {
							columns: {
								id: true,
								status: true,
								amount: true,
								paidAmount: true,
							},
						},
					},
				}),
				db
					.select({ count: count() })
					.from(trainingSessionTable)
					.where(whereCondition),
			]);

			return { sessions, total: countResult[0]?.count ?? 0 };
		}),

	// Calendar view - returns sessions in date range
	listForCalendar: protectedOrganizationProcedure
		.input(listTrainingSessionsForCalendarSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(trainingSessionTable.organizationId, ctx.organization.id),
				gte(trainingSessionTable.startTime, input.from),
				lte(trainingSessionTable.startTime, input.to),
				eq(trainingSessionTable.isRecurring, false), // Only non-template sessions
			];

			if (input.locationId) {
				conditions.push(eq(trainingSessionTable.locationId, input.locationId));
			}

			if (input.athleteGroupId) {
				conditions.push(
					eq(trainingSessionTable.athleteGroupId, input.athleteGroupId),
				);
			}

			const sessions = await db.query.trainingSessionTable.findMany({
				where: and(...conditions),
				orderBy: asc(trainingSessionTable.startTime),
				with: {
					location: { columns: { id: true, name: true, color: true } },
					athleteGroup: {
						columns: { id: true, name: true },
						with: {
							members: {
								limit: 5,
								with: {
									athlete: {
										with: {
											user: { columns: { id: true, name: true, image: true } },
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
									user: { columns: { id: true, name: true, image: true } },
								},
							},
						},
					},
					athletes: {
						limit: 5,
						with: {
							athlete: {
								with: {
									user: { columns: { id: true, name: true, image: true } },
								},
							},
						},
					},
				},
			});

			return sessions;
		}),

	get: protectedOrganizationProcedure
		.input(deleteTrainingSessionSchema)
		.query(async ({ ctx, input }) => {
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.id),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
				with: {
					location: true,
					athleteGroup: {
						with: {
							members: {
								with: {
									athlete: {
										with: {
											user: {
												columns: {
													id: true,
													name: true,
													email: true,
													image: true,
												},
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
									user: {
										columns: { id: true, name: true, email: true, image: true },
									},
								},
							},
						},
					},
					athletes: {
						with: {
							athlete: {
								with: {
									user: {
										columns: { id: true, name: true, email: true, image: true },
									},
								},
							},
						},
					},
					attendances: true,
					evaluations: true,
					payments: true,
				},
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Training session not found",
				});
			}

			return session;
		}),

	create: protectedOrganizationProcedure
		.input(createTrainingSessionSchema)
		.mutation(async ({ ctx, input }) => {
			const {
				coachIds,
				primaryCoachId,
				athleteIds,
				athleteGroupId,
				...sessionData
			} = input;

			// Validate endTime > startTime
			if (input.endTime <= input.startTime) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "End time must be after start time",
				});
			}

			// Verify coaches belong to organization (if any provided)
			if (coachIds && coachIds.length > 0) {
				const coaches = await db.query.coachTable.findMany({
					where: and(
						inArray(coachTable.id, coachIds),
						eq(coachTable.organizationId, ctx.organization.id),
					),
					columns: { id: true },
				});

				if (coaches.length !== coachIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "One or more coaches not found in this organization",
					});
				}
			}

			// Verify athletes belong to organization (if any provided and no group)
			let validAthleteIds: string[] = [];
			if (!athleteGroupId && athleteIds && athleteIds.length > 0) {
				const athletes = await db.query.athleteTable.findMany({
					where: and(
						inArray(athleteTable.id, athleteIds),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
					columns: { id: true },
				});

				if (athletes.length !== athleteIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "One or more athletes not found in this organization",
					});
				}

				validAthleteIds = athletes.map((a) => a.id);
			}

			// Use transaction to ensure atomicity of session creation with coaches and athletes
			const session = await db.transaction(async (tx) => {
				// Create the session
				const [newSession] = await tx
					.insert(trainingSessionTable)
					.values({
						organizationId: ctx.organization.id,
						createdBy: ctx.user.id,
						athleteGroupId: athleteGroupId ?? null,
						...sessionData,
					})
					.returning();

				if (!newSession) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create training session",
					});
				}

				// Assign coaches (if any provided)
				if (coachIds && coachIds.length > 0) {
					await tx.insert(trainingSessionCoachTable).values(
						coachIds.map((coachId) => ({
							sessionId: newSession.id,
							coachId,
							isPrimary: primaryCoachId
								? coachId === primaryCoachId
								: coachIds[0] === coachId,
						})),
					);
				}

				// Assign individual athletes if provided (and no group)
				if (validAthleteIds.length > 0) {
					await tx.insert(trainingSessionAthleteTable).values(
						validAthleteIds.map((athleteId) => ({
							sessionId: newSession.id,
							athleteId,
						})),
					);
				}

				return newSession;
			});

			return session;
		}),

	update: protectedOrganizationProcedure
		.input(updateTrainingSessionSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Validate endTime > startTime if both provided
			if (data.startTime && data.endTime && data.endTime <= data.startTime) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "End time must be after start time",
				});
			}

			const [updatedSession] = await db
				.update(trainingSessionTable)
				.set(data)
				.where(
					and(
						eq(trainingSessionTable.id, id),
						eq(trainingSessionTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updatedSession) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Training session not found",
				});
			}

			return updatedSession;
		}),

	updateAthletes: protectedOrganizationProcedure
		.input(updateSessionAthletesSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify session belongs to organization
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.sessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Training session not found",
				});
			}

			// Verify athletes belong to organization
			let validAthleteIds: string[] = [];
			if (input.athleteIds.length > 0) {
				const athletes = await db.query.athleteTable.findMany({
					where: and(
						inArray(athleteTable.id, input.athleteIds),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
					columns: { id: true },
				});
				validAthleteIds = athletes.map((a) => a.id);
			}

			// Delete existing assignments
			await db
				.delete(trainingSessionAthleteTable)
				.where(eq(trainingSessionAthleteTable.sessionId, input.sessionId));

			// Insert new assignments
			if (validAthleteIds.length > 0) {
				await db.insert(trainingSessionAthleteTable).values(
					validAthleteIds.map((athleteId) => ({
						sessionId: input.sessionId,
						athleteId,
					})),
				);
			}

			return { success: true, athleteCount: validAthleteIds.length };
		}),

	updateCoaches: protectedOrganizationProcedure
		.input(updateSessionCoachesSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify session belongs to organization
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.sessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Training session not found",
				});
			}

			// Delete existing assignments
			await db
				.delete(trainingSessionCoachTable)
				.where(eq(trainingSessionCoachTable.sessionId, input.sessionId));

			// If coaches are provided, verify and insert
			if (input.coachIds.length > 0) {
				const coaches = await db.query.coachTable.findMany({
					where: and(
						inArray(coachTable.id, input.coachIds),
						eq(coachTable.organizationId, ctx.organization.id),
					),
					columns: { id: true },
				});

				if (coaches.length !== input.coachIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "One or more coaches not found in this organization",
					});
				}

				// Insert new assignments
				await db.insert(trainingSessionCoachTable).values(
					input.coachIds.map((coachId) => ({
						sessionId: input.sessionId,
						coachId,
						isPrimary: input.primaryCoachId
							? coachId === input.primaryCoachId
							: input.coachIds[0] === coachId,
					})),
				);
			}

			return { success: true, coachCount: input.coachIds.length };
		}),

	delete: protectedOrganizationProcedure
		.input(deleteTrainingSessionSchema)
		.mutation(async ({ ctx, input }) => {
			const [deletedSession] = await db
				.delete(trainingSessionTable)
				.where(
					and(
						eq(trainingSessionTable.id, input.id),
						eq(trainingSessionTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!deletedSession) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Training session not found",
				});
			}

			return { success: true };
		}),

	bulkDelete: protectedOrganizationProcedure
		.input(bulkDeleteTrainingSessionsSchema)
		.mutation(async ({ ctx, input }) => {
			const deleted = await db
				.delete(trainingSessionTable)
				.where(
					and(
						inArray(trainingSessionTable.id, input.ids),
						eq(trainingSessionTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: trainingSessionTable.id });

			return { success: true, count: deleted.length };
		}),

	bulkUpdateStatus: protectedOrganizationProcedure
		.input(bulkUpdateTrainingSessionsStatusSchema)
		.mutation(async ({ ctx, input }) => {
			const updated = await db
				.update(trainingSessionTable)
				.set({ status: input.status })
				.where(
					and(
						inArray(trainingSessionTable.id, input.ids),
						eq(trainingSessionTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: trainingSessionTable.id });

			return { success: true, count: updated.length };
		}),

	// Complete session
	complete: protectedOrganizationProcedure
		.input(completeSessionSchema)
		.mutation(async ({ ctx, input }) => {
			const [updatedSession] = await db
				.update(trainingSessionTable)
				.set({
					status: TrainingSessionStatus.completed,
					postSessionNotes: input.postSessionNotes,
				})
				.where(
					and(
						eq(trainingSessionTable.id, input.id),
						eq(trainingSessionTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updatedSession) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Training session not found",
				});
			}

			return updatedSession;
		}),

	// Cancel a single occurrence of a recurring session
	cancelRecurringOccurrence: protectedOrganizationProcedure
		.input(cancelRecurringOccurrenceSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify recurring session belongs to organization
			const recurringSession = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.recurringSessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
					eq(trainingSessionTable.isRecurring, true),
				),
			});

			if (!recurringSession) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Recurring session not found",
				});
			}

			// Create exception (without replacement = cancelled)
			const [exception] = await db
				.insert(recurringSessionExceptionTable)
				.values({
					recurringSessionId: input.recurringSessionId,
					exceptionDate: input.occurrenceDate,
					replacementSessionId: null,
				})
				.returning();

			return exception;
		}),

	// Modify a single occurrence of a recurring session
	modifyRecurringOccurrence: protectedOrganizationProcedure
		.input(modifyRecurringOccurrenceSchema)
		.mutation(async ({ ctx, input }) => {
			const { recurringSessionId, originalDate, ...sessionData } = input;

			// Verify recurring session belongs to organization
			const recurringSession = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, recurringSessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
					eq(trainingSessionTable.isRecurring, true),
				),
			});

			if (!recurringSession) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Recurring session not found",
				});
			}

			// Create replacement session
			const [replacementSession] = await db
				.insert(trainingSessionTable)
				.values({
					organizationId: ctx.organization.id,
					title: sessionData.title ?? recurringSession.title,
					description: sessionData.description ?? recurringSession.description,
					startTime: sessionData.startTime,
					endTime: sessionData.endTime,
					status: TrainingSessionStatus.pending,
					locationId: sessionData.locationId ?? recurringSession.locationId,
					athleteGroupId: recurringSession.athleteGroupId,
					isRecurring: false,
					recurringSessionId: recurringSessionId,
					originalStartTime: originalDate,
					objectives: sessionData.objectives ?? recurringSession.objectives,
					planning: sessionData.planning ?? recurringSession.planning,
					createdBy: ctx.user.id,
				})
				.returning();

			if (!replacementSession) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create replacement session",
				});
			}

			// Copy coaches from recurring session (verify they belong to org)
			const sessionCoaches = await db.query.trainingSessionCoachTable.findMany({
				where: eq(trainingSessionCoachTable.sessionId, recurringSessionId),
				with: {
					coach: {
						columns: { id: true, organizationId: true },
					},
				},
			});

			// Filter to only coaches that belong to this organization
			const validCoaches = sessionCoaches.filter(
				(c) => c.coach.organizationId === ctx.organization.id,
			);

			if (validCoaches.length > 0) {
				await db.insert(trainingSessionCoachTable).values(
					validCoaches.map((c) => ({
						sessionId: replacementSession.id,
						coachId: c.coachId,
						isPrimary: c.isPrimary,
					})),
				);
			}

			// Copy athletes from recurring session (verify they belong to org)
			const sessionAthletes =
				await db.query.trainingSessionAthleteTable.findMany({
					where: eq(trainingSessionAthleteTable.sessionId, recurringSessionId),
					with: {
						athlete: {
							columns: { id: true, organizationId: true },
						},
					},
				});

			// Filter to only athletes that belong to this organization
			const validAthletes = sessionAthletes.filter(
				(a) => a.athlete.organizationId === ctx.organization.id,
			);

			if (validAthletes.length > 0) {
				await db.insert(trainingSessionAthleteTable).values(
					validAthletes.map((a) => ({
						sessionId: replacementSession.id,
						athleteId: a.athleteId,
					})),
				);
			}

			// Create exception with replacement
			await db.insert(recurringSessionExceptionTable).values({
				recurringSessionId: recurringSessionId,
				exceptionDate: originalDate,
				replacementSessionId: replacementSession.id,
			});

			return replacementSession;
		}),

	// Get sessions for the current user as a coach
	listMySessionsAsCoach: protectedOrganizationProcedure
		.input(listTrainingSessionsSchema)
		.query(async ({ ctx, input }) => {
			// First, find the coach record for the current user
			const coach = await db.query.coachTable.findFirst({
				where: and(
					eq(coachTable.userId, ctx.user.id),
					eq(coachTable.organizationId, ctx.organization.id),
				),
			});

			if (!coach) {
				return { sessions: [], total: 0, coach: null };
			}

			// Get session IDs where this coach is assigned
			const coachSessions = await db.query.trainingSessionCoachTable.findMany({
				where: eq(trainingSessionCoachTable.coachId, coach.id),
				columns: { sessionId: true, isPrimary: true },
			});

			if (coachSessions.length === 0) {
				return { sessions: [], total: 0, coach };
			}

			const sessionIds = coachSessions.map((cs) => cs.sessionId);

			const conditions = [
				eq(trainingSessionTable.organizationId, ctx.organization.id),
				inArray(trainingSessionTable.id, sessionIds),
				eq(trainingSessionTable.isRecurring, false),
			];

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(
					inArray(trainingSessionTable.status, input.filters.status),
				);
			}

			// Date range filter
			if (input.filters?.dateRange) {
				conditions.push(
					and(
						gte(trainingSessionTable.startTime, input.filters.dateRange.from),
						lte(trainingSessionTable.startTime, input.filters.dateRange.to),
					)!,
				);
			}

			const whereCondition = and(...conditions);

			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			const orderByColumn = sortDirection(trainingSessionTable.startTime);

			const [sessions, countResult] = await Promise.all([
				db.query.trainingSessionTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						location: { columns: { id: true, name: true } },
						athleteGroup: {
							columns: { id: true, name: true },
							with: {
								members: {
									with: {
										athlete: {
											with: {
												user: {
													columns: { id: true, name: true, image: true },
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
										user: { columns: { id: true, name: true, image: true } },
									},
								},
							},
						},
						athletes: {
							with: {
								athlete: {
									with: {
										user: { columns: { id: true, name: true, image: true } },
									},
								},
							},
						},
					},
				}),
				db
					.select({ count: count() })
					.from(trainingSessionTable)
					.where(whereCondition),
			]);

			return { sessions, total: countResult[0]?.count ?? 0, coach };
		}),

	// Get sessions for the current user as an athlete
	listMySessionsAsAthlete: protectedOrganizationProcedure
		.input(listTrainingSessionsSchema)
		.query(async ({ ctx, input }) => {
			// First, find the athlete record for the current user
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.userId, ctx.user.id),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
			});

			if (!athlete) {
				return { sessions: [], total: 0, athlete: null };
			}

			// Get session IDs from direct assignment
			const athleteSessions =
				await db.query.trainingSessionAthleteTable.findMany({
					where: eq(trainingSessionAthleteTable.athleteId, athlete.id),
					columns: { sessionId: true },
				});

			// Get sessions from athlete groups
			const athleteGroups = await db.query.athleteGroupMemberTable.findMany({
				where: eq(athleteGroupMemberTable.athleteId, athlete.id),
				columns: { groupId: true },
			});

			const groupIds = athleteGroups.map((ag) => ag.groupId);

			// Get sessions assigned to these groups
			let groupSessionIds: string[] = [];
			if (groupIds.length > 0) {
				const groupSessions = await db.query.trainingSessionTable.findMany({
					where: and(
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						inArray(trainingSessionTable.athleteGroupId, groupIds),
					),
					columns: { id: true },
				});
				groupSessionIds = groupSessions.map((s) => s.id);
			}

			const directSessionIds = athleteSessions.map((as) => as.sessionId);
			const allSessionIds = [
				...new Set([...directSessionIds, ...groupSessionIds]),
			];

			if (allSessionIds.length === 0) {
				return { sessions: [], total: 0, athlete };
			}

			const conditions = [
				eq(trainingSessionTable.organizationId, ctx.organization.id),
				inArray(trainingSessionTable.id, allSessionIds),
				eq(trainingSessionTable.isRecurring, false),
			];

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(
					inArray(trainingSessionTable.status, input.filters.status),
				);
			}

			// Date range filter
			if (input.filters?.dateRange) {
				conditions.push(
					and(
						gte(trainingSessionTable.startTime, input.filters.dateRange.from),
						lte(trainingSessionTable.startTime, input.filters.dateRange.to),
					)!,
				);
			}

			const whereCondition = and(...conditions);

			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			const orderByColumn = sortDirection(trainingSessionTable.startTime);

			const [sessions, countResult] = await Promise.all([
				db.query.trainingSessionTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						location: { columns: { id: true, name: true } },
						athleteGroup: { columns: { id: true, name: true } },
						coaches: {
							with: {
								coach: {
									with: {
										user: { columns: { id: true, name: true, image: true } },
									},
								},
							},
						},
						attendances: {
							where: eq(attendanceTable.athleteId, athlete.id),
						},
						evaluations: {
							where: eq(athleteEvaluationTable.athleteId, athlete.id),
						},
						feedback: {
							where: eq(athleteSessionFeedbackTable.athleteId, athlete.id),
						},
					},
				}),
				db
					.select({ count: count() })
					.from(trainingSessionTable)
					.where(whereCondition),
			]);

			return { sessions, total: countResult[0]?.count ?? 0, athlete };
		}),

	// Send daily summary to coaches
	sendDailySummary: protectedOrganizationProcedure
		.input(
			z
				.object({
					date: z.iso.date().optional(), // ISO date string (YYYY-MM-DD), defaults to tomorrow
				})
				.optional(),
		)
		.mutation(async ({ ctx, input }) => {
			const { format, startOfDay, endOfDay, addDays } = await import(
				"date-fns"
			);
			const { sendNotification } = await import("@/trigger/notifications");
			const { appConfig } = await import("@/config/app.config");

			// Determine target date (default to tomorrow)
			let targetDate: Date;
			if (input?.date) {
				targetDate = new Date(input.date);
			} else {
				targetDate = addDays(new Date(), 1);
			}

			const dayStart = startOfDay(targetDate);
			const dayEnd = endOfDay(targetDate);

			// Get all sessions for the target date
			const sessions = await db.query.trainingSessionTable.findMany({
				where: and(
					eq(trainingSessionTable.organizationId, ctx.organization.id),
					gte(trainingSessionTable.startTime, dayStart),
					lte(trainingSessionTable.startTime, dayEnd),
					eq(trainingSessionTable.isRecurring, false),
					// Exclude cancelled sessions
					or(
						eq(trainingSessionTable.status, TrainingSessionStatus.pending),
						eq(trainingSessionTable.status, TrainingSessionStatus.confirmed),
					),
				),
				orderBy: asc(trainingSessionTable.startTime),
				with: {
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

			if (sessions.length === 0) {
				return {
					success: true,
					sent: 0,
					message: "No sessions scheduled for the specified date",
				};
			}

			// Get all unique coaches from all sessions
			const coachMap = new Map<
				string,
				{ id: string; name: string; email: string }
			>();
			for (const session of sessions) {
				for (const sc of session.coaches) {
					if (sc.coach.user?.email) {
						coachMap.set(sc.coach.id, {
							id: sc.coach.id,
							name: sc.coach.user.name ?? "Coach",
							email: sc.coach.user.email,
						});
					}
				}
			}

			const coaches = Array.from(coachMap.values());

			if (coaches.length === 0) {
				return {
					success: true,
					sent: 0,
					message: "No coaches with email addresses found",
				};
			}

			// Format sessions for email
			const formattedSessions = sessions.map((session) => {
				const athleteCount = session.athleteGroup?.members
					? session.athleteGroup.members.length
					: session.athletes.length;

				return {
					title: session.title,
					time: `${format(new Date(session.startTime), "h:mm a")} - ${format(new Date(session.endTime), "h:mm a")}`,
					location: session.location?.name ?? "TBD",
					coaches: session.coaches.map((c) => c.coach.user?.name ?? "Coach"),
					athleteCount,
					groupName: session.athleteGroup?.name,
				};
			});

			// Calculate totals
			const totalAthletes = formattedSessions.reduce(
				(sum, s) => sum + s.athleteCount,
				0,
			);

			const summaryDate = format(targetDate, "EEEE, MMMM d, yyyy");

			// Send to all coaches via Trigger.dev
			const notifications = coaches.map((coach) =>
				sendNotification.trigger({
					payload: {
						channel: "email" as const,
						to: { email: coach.email, name: coach.name },
						template: "daily-session-summary" as const,
						data: {
							appName: appConfig.appName,
							recipientName: coach.name,
							organizationName: ctx.organization.name,
							summaryDate,
							sessions: formattedSessions,
							totalSessions: sessions.length,
							totalAthletes,
						},
					},
					organizationId: ctx.organization.id,
					triggeredBy: ctx.user.id,
				}),
			);

			const results = await Promise.allSettled(notifications);
			const successful = results.filter((r) => r.status === "fulfilled").length;
			const failed = results.filter((r) => r.status === "rejected").length;

			return {
				success: true,
				sent: successful,
				failed,
				totalCoaches: coaches.length,
				totalSessions: sessions.length,
				date: summaryDate,
			};
		}),

	// Send reminder notifications to athletes for a session
	sendReminder: protectedOrganizationProcedure
		.input(
			deleteTrainingSessionSchema.extend({
				channel: z
					.enum(["email", "sms", "whatsapp"])
					.default("email")
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { format } = await import("date-fns");
			const { sendNotification } = await import("@/trigger/notifications");
			const { appConfig } = await import("@/config/app.config");
			const { generateConfirmationUrl } = await import(
				"@/lib/notifications/confirmation-token"
			);
			const { getBaseUrl } = await import("@/lib/utils");

			const channel = input.channel ?? "email";

			// Get the session with all related data
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.id),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
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

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Session not found",
				});
			}

			// Check if session is in the future
			if (new Date(session.startTime) <= new Date()) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot send reminder for past or ongoing sessions",
				});
			}

			// Check if session is cancelled
			if (session.status === TrainingSessionStatus.cancelled) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot send reminder for cancelled sessions",
				});
			}

			// Get athletes list with contact info
			const allAthletes = session.athleteGroup?.members
				? session.athleteGroup.members.map((m) => ({
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

			if (athletes.length === 0) {
				const contactType =
					channel === "email" ? "email addresses" : "phone numbers";
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `No athletes with ${contactType} found for this session`,
				});
			}

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
			const baseUrl = getBaseUrl();

			// Send notifications via Trigger.dev for reliability
			const notifications = athletes.map((athlete) => {
				const confirmationUrl = generateConfirmationUrl(
					baseUrl,
					session.id,
					athlete.id,
				);

				if (channel === "email") {
					return sendNotification.trigger({
						payload: {
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
						},
						organizationId: ctx.organization.id,
						triggeredBy: ctx.user.id,
					});
				}

				// SMS or WhatsApp
				return sendNotification.trigger({
					payload: {
						channel: channel as "sms" | "whatsapp",
						to: { phone: athlete.phone!, name: athlete.name },
						template: "training-session-reminder" as const,
						data: {
							sessionTitle: session.title,
							date: shortDate,
							time: shortTime,
							confirmationUrl,
						},
					},
					organizationId: ctx.organization.id,
					triggeredBy: ctx.user.id,
				});
			});

			const results = await Promise.allSettled(notifications);
			const successful = results.filter((r) => r.status === "fulfilled").length;
			const failed = results.filter((r) => r.status === "rejected").length;

			return {
				success: true,
				channel,
				sent: successful,
				failed,
				total: athletes.length,
			};
		}),

	// ============================================================================
	// ATTACHMENT UPLOAD
	// ============================================================================

	getAttachmentUploadUrl: protectedOrganizationProcedure
		.input(getSessionAttachmentUploadUrlSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify session belongs to organization
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.sessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Session not found",
				});
			}

			// Generate unique storage key
			const key = generateStorageKey(
				"session-attachments",
				ctx.organization.id,
				input.filename,
			);

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			// Generate signed upload URL
			const uploadUrl = await getSignedUploadUrl(key, bucket, {
				contentType: input.contentType,
				expiresIn: 300, // 5 minutes to upload
			});

			return {
				uploadUrl,
				key,
			};
		}),

	updateAttachment: protectedOrganizationProcedure
		.input(updateSessionAttachmentSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify session belongs to organization
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.sessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Session not found",
				});
			}

			// Delete old attachment if exists
			if (session.attachmentKey) {
				const bucket = env.S3_BUCKET;
				if (bucket) {
					try {
						await deleteObject(session.attachmentKey, bucket);
					} catch {
						// Ignore deletion errors
					}
				}
			}

			// Update session with new attachment
			const [updated] = await db
				.update(trainingSessionTable)
				.set({
					attachmentKey: input.attachmentKey,
					attachmentUploadedAt: new Date(),
				})
				.where(eq(trainingSessionTable.id, input.sessionId))
				.returning();

			return updated;
		}),

	deleteAttachment: protectedOrganizationProcedure
		.input(deleteSessionAttachmentSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify session belongs to organization
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.sessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Session not found",
				});
			}

			if (!session.attachmentKey) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Session has no attachment",
				});
			}

			const bucket = env.S3_BUCKET;
			if (bucket) {
				try {
					await deleteObject(session.attachmentKey, bucket);
				} catch {
					// Ignore deletion errors
				}
			}

			// Update session to remove attachment
			const [updated] = await db
				.update(trainingSessionTable)
				.set({
					attachmentKey: null,
					attachmentUploadedAt: null,
				})
				.where(eq(trainingSessionTable.id, input.sessionId))
				.returning();

			return updated;
		}),

	getAttachmentDownloadUrl: protectedOrganizationProcedure
		.input(getSessionAttachmentDownloadUrlSchema)
		.query(async ({ ctx, input }) => {
			// Verify session belongs to organization
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.sessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Session not found",
				});
			}

			if (!session.attachmentKey) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Session has no attachment",
				});
			}

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			// Generate signed download URL (valid for 1 hour)
			const downloadUrl = await getSignedUrl(session.attachmentKey, bucket, {
				expiresIn: 3600,
			});

			return {
				downloadUrl,
				key: session.attachmentKey,
			};
		}),
});
