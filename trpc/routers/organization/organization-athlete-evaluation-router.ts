import { TRPCError } from "@trpc/server";
import { and, avg, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	athleteEvaluationTable,
	athleteTable,
	trainingSessionTable,
} from "@/lib/db/schema/tables";
import {
	bulkUpsertEvaluationsSchema,
	deleteEvaluationSchema,
	getAthleteAverageRatingsSchema,
	getAthleteEvaluationsSchema,
	getEvaluationSchema,
	getSessionEvaluationsSchema,
	upsertEvaluationSchema,
} from "@/schemas/organization-athlete-evaluation-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationAthleteEvaluationRouter = createTRPCRouter({
	// Get evaluations for a session
	getSessionEvaluations: protectedOrganizationProcedure
		.input(getSessionEvaluationsSchema)
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

			const evaluations = await db.query.athleteEvaluationTable.findMany({
				where: eq(athleteEvaluationTable.sessionId, input.sessionId),
				with: {
					athlete: {
						with: {
							user: {
								columns: { id: true, name: true, email: true, image: true },
							},
						},
					},
					evaluatedByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			return evaluations;
		}),

	// Get evaluation history for an athlete
	getAthleteEvaluations: protectedOrganizationProcedure
		.input(getAthleteEvaluationsSchema)
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
				eq(athleteEvaluationTable.athleteId, input.athleteId),
			];

			if (input.dateRange) {
				conditions.push(
					gte(athleteEvaluationTable.createdAt, input.dateRange.from),
				);
				conditions.push(
					lte(athleteEvaluationTable.createdAt, input.dateRange.to),
				);
			}

			const evaluations = await db.query.athleteEvaluationTable.findMany({
				where: and(...conditions),
				limit: input.limit,
				offset: input.offset,
				orderBy: desc(athleteEvaluationTable.createdAt),
				with: {
					session: {
						columns: { id: true, title: true, startTime: true },
					},
					evaluatedByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			return evaluations;
		}),

	// Get single evaluation
	get: protectedOrganizationProcedure
		.input(getEvaluationSchema)
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

			const evaluation = await db.query.athleteEvaluationTable.findFirst({
				where: and(
					eq(athleteEvaluationTable.sessionId, input.sessionId),
					eq(athleteEvaluationTable.athleteId, input.athleteId),
				),
				with: {
					athlete: {
						with: {
							user: {
								columns: { id: true, name: true, email: true, image: true },
							},
						},
					},
					evaluatedByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			return evaluation;
		}),

	// Get average ratings for an athlete
	getAthleteAverageRatings: protectedOrganizationProcedure
		.input(getAthleteAverageRatingsSchema)
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
				eq(athleteEvaluationTable.athleteId, input.athleteId),
			];

			if (input.dateRange) {
				conditions.push(
					gte(athleteEvaluationTable.createdAt, input.dateRange.from),
				);
				conditions.push(
					lte(athleteEvaluationTable.createdAt, input.dateRange.to),
				);
			}

			const [averages] = await db
				.select({
					avgPerformance: avg(athleteEvaluationTable.performanceRating),
					avgAttitude: avg(athleteEvaluationTable.attitudeRating),
					avgPhysicalFitness: avg(athleteEvaluationTable.physicalFitnessRating),
				})
				.from(athleteEvaluationTable)
				.where(and(...conditions));

			return {
				performanceAverage: averages?.avgPerformance
					? Number(averages.avgPerformance)
					: null,
				attitudeAverage: averages?.avgAttitude
					? Number(averages.avgAttitude)
					: null,
				physicalFitnessAverage: averages?.avgPhysicalFitness
					? Number(averages.avgPhysicalFitness)
					: null,
			};
		}),

	// Create or update evaluation
	upsert: protectedOrganizationProcedure
		.input(upsertEvaluationSchema)
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

			// Check if evaluation already exists
			const existingEvaluation =
				await db.query.athleteEvaluationTable.findFirst({
					where: and(
						eq(athleteEvaluationTable.sessionId, input.sessionId),
						eq(athleteEvaluationTable.athleteId, input.athleteId),
					),
				});

			const { sessionId, athleteId, ...data } = input;

			if (existingEvaluation) {
				// Update existing
				const [updated] = await db
					.update(athleteEvaluationTable)
					.set({
						...data,
						evaluatedBy: ctx.user.id,
					})
					.where(eq(athleteEvaluationTable.id, existingEvaluation.id))
					.returning();

				return updated;
			}

			// Create new
			const [evaluation] = await db
				.insert(athleteEvaluationTable)
				.values({
					sessionId,
					athleteId,
					...data,
					evaluatedBy: ctx.user.id,
				})
				.returning();

			return evaluation;
		}),

	// Bulk create/update evaluations for a session
	bulkUpsert: protectedOrganizationProcedure
		.input(bulkUpsertEvaluationsSchema)
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

			const athleteIds = input.evaluations.map((e) => e.athleteId);

			// Verify all athletes belong to organization
			const athletes = await db.query.athleteTable.findMany({
				where: and(
					inArray(athleteTable.id, athleteIds),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
				columns: { id: true },
			});

			const validAthleteIds = new Set(athletes.map((a) => a.id));
			const validEvaluations = input.evaluations.filter((e) =>
				validAthleteIds.has(e.athleteId),
			);

			if (validEvaluations.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No valid athletes provided",
				});
			}

			// Get existing evaluations
			const existingEvaluations =
				await db.query.athleteEvaluationTable.findMany({
					where: and(
						eq(athleteEvaluationTable.sessionId, input.sessionId),
						inArray(
							athleteEvaluationTable.athleteId,
							validEvaluations.map((e) => e.athleteId),
						),
					),
				});

			const existingMap = new Map(
				existingEvaluations.map((e) => [e.athleteId, e]),
			);

			const toInsert: typeof validEvaluations = [];
			const toUpdate: Array<{
				id: string;
				data: (typeof validEvaluations)[0];
			}> = [];

			for (const evaluation of validEvaluations) {
				const existing = existingMap.get(evaluation.athleteId);
				if (existing) {
					toUpdate.push({ id: existing.id, data: evaluation });
				} else {
					toInsert.push(evaluation);
				}
			}

			// Insert new evaluations
			if (toInsert.length > 0) {
				await db.insert(athleteEvaluationTable).values(
					toInsert.map((e) => ({
						sessionId: input.sessionId,
						athleteId: e.athleteId,
						performanceRating: e.performanceRating,
						performanceNotes: e.performanceNotes,
						attitudeRating: e.attitudeRating,
						attitudeNotes: e.attitudeNotes,
						physicalFitnessRating: e.physicalFitnessRating,
						physicalFitnessNotes: e.physicalFitnessNotes,
						generalNotes: e.generalNotes,
						evaluatedBy: ctx.user.id,
					})),
				);
			}

			// Update existing evaluations
			for (const { id, data } of toUpdate) {
				await db
					.update(athleteEvaluationTable)
					.set({
						performanceRating: data.performanceRating,
						performanceNotes: data.performanceNotes,
						attitudeRating: data.attitudeRating,
						attitudeNotes: data.attitudeNotes,
						physicalFitnessRating: data.physicalFitnessRating,
						physicalFitnessNotes: data.physicalFitnessNotes,
						generalNotes: data.generalNotes,
						evaluatedBy: ctx.user.id,
					})
					.where(eq(athleteEvaluationTable.id, id));
			}

			return {
				success: true,
				insertedCount: toInsert.length,
				updatedCount: toUpdate.length,
			};
		}),

	// Delete evaluation
	delete: protectedOrganizationProcedure
		.input(deleteEvaluationSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify evaluation exists and session belongs to organization
			const evaluation = await db.query.athleteEvaluationTable.findFirst({
				where: eq(athleteEvaluationTable.id, input.id),
				with: {
					session: {
						columns: { organizationId: true },
					},
				},
			});

			if (
				!evaluation ||
				evaluation.session.organizationId !== ctx.organization.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Evaluation not found",
				});
			}

			await db
				.delete(athleteEvaluationTable)
				.where(eq(athleteEvaluationTable.id, input.id));

			return { success: true };
		}),
});
