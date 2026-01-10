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
import { db } from "@/lib/db";
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
import { TrainingSessionStatus } from "@/lib/db/schema/enums";
import {
	bulkDeleteTrainingSessionsSchema,
	bulkUpdateTrainingSessionsStatusSchema,
	cancelRecurringOccurrenceSchema,
	completeSessionSchema,
	createTrainingSessionSchema,
	deleteTrainingSessionSchema,
	listTrainingSessionsForCalendarSchema,
	listTrainingSessionsSchema,
	modifyRecurringOccurrenceSchema,
	updateSessionAthletesSchema,
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
							columns: { id: true, status: true, amount: true, paidAmount: true },
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
												columns: { id: true, name: true, email: true, image: true },
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

			// Create the session
			const [session] = await db
				.insert(trainingSessionTable)
				.values({
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
					athleteGroupId: athleteGroupId ?? null,
					...sessionData,
				})
				.returning();

			if (!session) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create training session",
				});
			}

			// Assign coaches (if any provided)
			if (coachIds && coachIds.length > 0) {
				await db.insert(trainingSessionCoachTable).values(
					coachIds.map((coachId) => ({
						sessionId: session.id,
						coachId,
						isPrimary: primaryCoachId ? coachId === primaryCoachId : coachIds[0] === coachId,
					})),
				);
			}

			// Assign individual athletes if provided (and no group)
			if (!athleteGroupId && athleteIds && athleteIds.length > 0) {
				// Verify athletes belong to organization
				const athletes = await db.query.athleteTable.findMany({
					where: and(
						inArray(athleteTable.id, athleteIds),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
					columns: { id: true },
				});

				const validAthleteIds = athletes.map((a) => a.id);

				if (validAthleteIds.length > 0) {
					await db.insert(trainingSessionAthleteTable).values(
						validAthleteIds.map((athleteId) => ({
							sessionId: session.id,
							athleteId,
						})),
					);
				}
			}

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

			// Copy coaches from recurring session
			const coaches = await db.query.trainingSessionCoachTable.findMany({
				where: eq(trainingSessionCoachTable.sessionId, recurringSessionId),
			});

			if (coaches.length > 0) {
				await db.insert(trainingSessionCoachTable).values(
					coaches.map((c) => ({
						sessionId: replacementSession.id,
						coachId: c.coachId,
						isPrimary: c.isPrimary,
					})),
				);
			}

			// Copy athletes from recurring session
			const athletes = await db.query.trainingSessionAthleteTable.findMany({
				where: eq(trainingSessionAthleteTable.sessionId, recurringSessionId),
			});

			if (athletes.length > 0) {
				await db.insert(trainingSessionAthleteTable).values(
					athletes.map((a) => ({
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
});
