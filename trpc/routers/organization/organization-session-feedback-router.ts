import { TRPCError } from "@trpc/server";
import { and, avg, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { TrainingSessionStatus } from "@/lib/db/schema/enums";
import {
	athleteGroupMemberTable,
	athleteSessionFeedbackTable,
	athleteTable,
	trainingSessionAthleteTable,
	trainingSessionTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import {
	getAthleteAverageFeedbackSchema,
	getAthleteFeedbackHistorySchema,
	getMySessionFeedbackSchema,
	getSessionFeedbackListSchema,
	upsertSessionFeedbackSchema,
} from "@/schemas/organization-session-feedback-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

// Helper function to verify athlete is assigned to a session
async function verifyAthleteSessionAssignment(
	sessionId: string,
	athleteId: string,
	organizationId: string,
): Promise<boolean> {
	// Get session
	const session = await db.query.trainingSessionTable.findFirst({
		where: and(
			eq(trainingSessionTable.id, sessionId),
			eq(trainingSessionTable.organizationId, organizationId),
		),
		columns: { athleteGroupId: true },
	});

	if (!session) return false;

	// Check direct assignment
	const directAssignment =
		await db.query.trainingSessionAthleteTable.findFirst({
			where: and(
				eq(trainingSessionAthleteTable.sessionId, sessionId),
				eq(trainingSessionAthleteTable.athleteId, athleteId),
			),
		});

	if (directAssignment) return true;

	// Check group assignment
	if (session.athleteGroupId) {
		const groupMembership = await db.query.athleteGroupMemberTable.findFirst({
			where: and(
				eq(athleteGroupMemberTable.groupId, session.athleteGroupId),
				eq(athleteGroupMemberTable.athleteId, athleteId),
			),
		});

		if (groupMembership) return true;
	}

	return false;
}

export const organizationSessionFeedbackRouter = createTRPCRouter({
	// Get my feedback for a session (athlete only)
	getMyFeedback: protectedOrganizationProcedure
		.input(getMySessionFeedbackSchema)
		.query(async ({ ctx, input }) => {
			// Find athlete profile for current user
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.userId, ctx.user.id),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
			});

			if (!athlete) {
				return { feedback: null, canSubmitRpe: false };
			}

			// Verify athlete is assigned to this session
			const isAssigned = await verifyAthleteSessionAssignment(
				input.sessionId,
				athlete.id,
				ctx.organization.id,
			);

			if (!isAssigned) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not assigned to this session",
				});
			}

			// Get feedback
			const feedback =
				await db.query.athleteSessionFeedbackTable.findFirst({
					where: and(
						eq(athleteSessionFeedbackTable.sessionId, input.sessionId),
						eq(athleteSessionFeedbackTable.athleteId, athlete.id),
					),
				});

			// Get session to determine if RPE can be submitted
			const session = await db.query.trainingSessionTable.findFirst({
				where: eq(trainingSessionTable.id, input.sessionId),
				columns: { status: true, startTime: true },
			});

			const canSubmitRpe = session
				? session.status === TrainingSessionStatus.completed ||
					new Date(session.startTime) < new Date()
				: false;

			return { feedback: feedback ?? null, canSubmitRpe };
		}),

	// Submit/update feedback (athlete only)
	upsert: protectedOrganizationProcedure
		.input(upsertSessionFeedbackSchema)
		.mutation(async ({ ctx, input }) => {
			// Find athlete profile for current user
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.userId, ctx.user.id),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
			});

			if (!athlete) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You must be an athlete to submit feedback",
				});
			}

			// Verify athlete is assigned to this session
			const isAssigned = await verifyAthleteSessionAssignment(
				input.sessionId,
				athlete.id,
				ctx.organization.id,
			);

			if (!isAssigned) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not assigned to this session",
				});
			}

			// Validate RPE submission timing
			if (input.rpeRating !== null && input.rpeRating !== undefined) {
				const session = await db.query.trainingSessionTable.findFirst({
					where: eq(trainingSessionTable.id, input.sessionId),
					columns: { status: true, startTime: true },
				});

				if (!session) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Session not found",
					});
				}

				const canSubmitRpe =
					session.status === TrainingSessionStatus.completed ||
					new Date(session.startTime) < new Date();

				if (!canSubmitRpe) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"RPE can only be submitted after the session has started or completed",
					});
				}
			}

			// Check if feedback already exists
			const existingFeedback =
				await db.query.athleteSessionFeedbackTable.findFirst({
					where: and(
						eq(athleteSessionFeedbackTable.sessionId, input.sessionId),
						eq(athleteSessionFeedbackTable.athleteId, athlete.id),
					),
				});

			if (existingFeedback) {
				// Update existing
				const [updated] = await db
					.update(athleteSessionFeedbackTable)
					.set({
						rpeRating: input.rpeRating,
						satisfactionRating: input.satisfactionRating,
						notes: input.notes,
					})
					.where(eq(athleteSessionFeedbackTable.id, existingFeedback.id))
					.returning();

				logger.info(
					{ athleteId: athlete.id, feedbackId: updated?.id },
					"Session feedback updated",
				);

				return updated;
			}

			// Create new
			const [feedback] = await db
				.insert(athleteSessionFeedbackTable)
				.values({
					sessionId: input.sessionId,
					athleteId: athlete.id,
					rpeRating: input.rpeRating,
					satisfactionRating: input.satisfactionRating,
					notes: input.notes,
				})
				.returning();

			if (!feedback) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create session feedback",
				});
			}

			logger.info(
				{ athleteId: athlete.id, feedbackId: feedback.id },
				"Session feedback created",
			);

			return feedback;
		}),

	// Get all feedback for a session (coach view)
	getSessionFeedback: protectedOrganizationProcedure
		.input(getSessionFeedbackListSchema)
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
					message: "Training session not found",
				});
			}

			// Get all feedback for this session
			const feedbackList =
				await db.query.athleteSessionFeedbackTable.findMany({
					where: eq(athleteSessionFeedbackTable.sessionId, input.sessionId),
					with: {
						athlete: {
							with: {
								user: {
									columns: { id: true, name: true, email: true, image: true },
								},
							},
						},
					},
				});

			// Calculate averages
			const rpeValues = feedbackList
				.map((f) => f.rpeRating)
				.filter((r): r is number => r !== null);
			const satisfactionValues = feedbackList
				.map((f) => f.satisfactionRating)
				.filter((r): r is number => r !== null);

			const avgRpe =
				rpeValues.length > 0
					? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length
					: null;
			const avgSatisfaction =
				satisfactionValues.length > 0
					? satisfactionValues.reduce((a, b) => a + b, 0) /
						satisfactionValues.length
					: null;

			return {
				feedback: feedbackList,
				averageRpe: avgRpe,
				averageSatisfaction: avgSatisfaction,
				totalFeedback: feedbackList.length,
			};
		}),

	// Get feedback history for an athlete (coach view)
	getAthleteFeedbackHistory: protectedOrganizationProcedure
		.input(getAthleteFeedbackHistorySchema)
		.query(async ({ ctx, input }) => {
			// Verify athlete belongs to organization
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.id, input.athleteId),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
			});

			if (!athlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete not found",
				});
			}

			const conditions = [
				eq(athleteSessionFeedbackTable.athleteId, input.athleteId),
			];

			if (input.dateRange) {
				conditions.push(
					gte(athleteSessionFeedbackTable.createdAt, input.dateRange.from),
				);
				conditions.push(
					lte(athleteSessionFeedbackTable.createdAt, input.dateRange.to),
				);
			}

			const feedbackHistory =
				await db.query.athleteSessionFeedbackTable.findMany({
					where: and(...conditions),
					limit: input.limit,
					offset: input.offset,
					orderBy: desc(athleteSessionFeedbackTable.createdAt),
					with: {
						session: {
							columns: { id: true, title: true, startTime: true },
						},
					},
				});

			return feedbackHistory;
		}),

	// Get average feedback stats for an athlete
	getAthleteAverageFeedback: protectedOrganizationProcedure
		.input(getAthleteAverageFeedbackSchema)
		.query(async ({ ctx, input }) => {
			// Verify athlete belongs to organization
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.id, input.athleteId),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
			});

			if (!athlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete not found",
				});
			}

			const conditions = [
				eq(athleteSessionFeedbackTable.athleteId, input.athleteId),
			];

			if (input.dateRange) {
				conditions.push(
					gte(athleteSessionFeedbackTable.createdAt, input.dateRange.from),
				);
				conditions.push(
					lte(athleteSessionFeedbackTable.createdAt, input.dateRange.to),
				);
			}

			const [averages] = await db
				.select({
					count: sql<number>`count(*)::int`,
					avgRpe: avg(athleteSessionFeedbackTable.rpeRating),
					avgSatisfaction: avg(athleteSessionFeedbackTable.satisfactionRating),
				})
				.from(athleteSessionFeedbackTable)
				.where(and(...conditions));

			return {
				totalFeedback: averages?.count ?? 0,
				averageRpe: averages?.avgRpe ? Number(averages.avgRpe) : null,
				averageSatisfaction: averages?.avgSatisfaction
					? Number(averages.avgSatisfaction)
					: null,
			};
		}),
});
