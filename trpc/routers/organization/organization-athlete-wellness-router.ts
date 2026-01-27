import { TRPCError } from "@trpc/server";
import { and, avg, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	athleteTable,
	athleteWellnessSurveyTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import {
	createWellnessSurveyForAthleteSchema,
	createWellnessSurveySchema,
	deleteWellnessSurveySchema,
	getTodayWellnessSchema,
	getWellnessStatsSchema,
	listWellnessSurveysSchema,
	updateWellnessSurveySchema,
} from "@/schemas/organization-athlete-wellness-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationAthleteWellnessRouter = createTRPCRouter({
	// Get today's wellness survey for the current athlete
	getToday: protectedOrganizationProcedure
		.input(getTodayWellnessSchema)
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

			// Get today's start (midnight)
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const survey = await db.query.athleteWellnessSurveyTable.findFirst({
				where: and(
					eq(athleteWellnessSurveyTable.athleteId, input.athleteId),
					gte(athleteWellnessSurveyTable.surveyDate, today),
				),
				orderBy: desc(athleteWellnessSurveyTable.surveyDate),
			});

			return survey ?? null;
		}),

	// Get my today's wellness (for athlete self-service)
	getMyToday: protectedOrganizationProcedure.query(async ({ ctx }) => {
		// Find athlete record for current user
		const athlete = await db.query.athleteTable.findFirst({
			where: and(
				eq(athleteTable.userId, ctx.user.id),
				eq(athleteTable.organizationId, ctx.organization.id),
			),
		});

		if (!athlete) {
			return null;
		}

		// Get today's start (midnight)
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const survey = await db.query.athleteWellnessSurveyTable.findFirst({
			where: and(
				eq(athleteWellnessSurveyTable.athleteId, athlete.id),
				gte(athleteWellnessSurveyTable.surveyDate, today),
			),
			orderBy: desc(athleteWellnessSurveyTable.surveyDate),
		});

		return {
			athleteId: athlete.id,
			survey: survey ?? null,
		};
	}),

	// Create a new wellness survey (athlete self-service)
	create: protectedOrganizationProcedure
		.input(createWellnessSurveySchema)
		.mutation(async ({ ctx, input }) => {
			// Find athlete record for current user
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.userId, ctx.user.id),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
			});

			if (!athlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "You are not registered as an athlete in this organization",
				});
			}

			// Check if already submitted today
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const existingSurvey =
				await db.query.athleteWellnessSurveyTable.findFirst({
					where: and(
						eq(athleteWellnessSurveyTable.athleteId, athlete.id),
						gte(athleteWellnessSurveyTable.surveyDate, today),
					),
				});

			if (existingSurvey) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "You have already submitted a wellness survey today",
				});
			}

			// Create the survey
			const [survey] = await db
				.insert(athleteWellnessSurveyTable)
				.values({
					athleteId: athlete.id,
					organizationId: ctx.organization.id,
					surveyDate: new Date(),
					sleepHours: input.sleepHours,
					sleepQuality: input.sleepQuality,
					fatigue: input.fatigue,
					muscleSoreness: input.muscleSoreness,
					mood: input.mood,
					stressLevel: input.stressLevel,
					energy: input.energy,
					notes: input.notes,
				})
				.returning();

			if (!survey) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create wellness survey",
				});
			}

			logger.info(
				{ athleteId: athlete.id, surveyId: survey.id },
				"Wellness survey created",
			);

			return survey;
		}),

	// List wellness surveys for an athlete
	list: protectedOrganizationProcedure
		.input(listWellnessSurveysSchema)
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

			const surveys = await db.query.athleteWellnessSurveyTable.findMany({
				where: eq(athleteWellnessSurveyTable.athleteId, input.athleteId),
				orderBy: desc(athleteWellnessSurveyTable.surveyDate),
				limit: input.limit,
				offset: input.offset,
			});

			return surveys;
		}),

	// Get my wellness surveys (for athlete self-service)
	listMySurveys: protectedOrganizationProcedure
		.input(
			listWellnessSurveysSchema
				.omit({ athleteId: true })
				.extend({ limit: listWellnessSurveysSchema.shape.limit }),
		)
		.query(async ({ ctx, input }) => {
			// Find athlete record for current user
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.userId, ctx.user.id),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
			});

			if (!athlete) {
				return [];
			}

			const surveys = await db.query.athleteWellnessSurveyTable.findMany({
				where: eq(athleteWellnessSurveyTable.athleteId, athlete.id),
				orderBy: desc(athleteWellnessSurveyTable.surveyDate),
				limit: input.limit,
				offset: input.offset,
			});

			return surveys;
		}),

	// Get wellness stats (averages) for an athlete
	getStats: protectedOrganizationProcedure
		.input(getWellnessStatsSchema)
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

			// Calculate date range
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - input.days);
			startDate.setHours(0, 0, 0, 0);

			const [stats] = await db
				.select({
					count: sql<number>`count(*)::int`,
					avgSleepHours: avg(athleteWellnessSurveyTable.sleepHours),
					avgSleepQuality: avg(athleteWellnessSurveyTable.sleepQuality),
					avgFatigue: avg(athleteWellnessSurveyTable.fatigue),
					avgMuscleSoreness: avg(athleteWellnessSurveyTable.muscleSoreness),
					avgMood: avg(athleteWellnessSurveyTable.mood),
					avgStressLevel: avg(athleteWellnessSurveyTable.stressLevel),
					avgEnergy: avg(athleteWellnessSurveyTable.energy),
				})
				.from(athleteWellnessSurveyTable)
				.where(
					and(
						eq(athleteWellnessSurveyTable.athleteId, input.athleteId),
						gte(athleteWellnessSurveyTable.surveyDate, startDate),
					),
				);

			return {
				days: input.days,
				surveyCount: stats?.count ?? 0,
				averages: {
					sleepHours: stats?.avgSleepHours ? Number(stats.avgSleepHours) : null,
					sleepQuality: stats?.avgSleepQuality
						? Number(stats.avgSleepQuality)
						: null,
					fatigue: stats?.avgFatigue ? Number(stats.avgFatigue) : null,
					muscleSoreness: stats?.avgMuscleSoreness
						? Number(stats.avgMuscleSoreness)
						: null,
					mood: stats?.avgMood ? Number(stats.avgMood) : null,
					stressLevel: stats?.avgStressLevel
						? Number(stats.avgStressLevel)
						: null,
					energy: stats?.avgEnergy ? Number(stats.avgEnergy) : null,
				},
			};
		}),

	// Create wellness survey for an athlete (admin/coach)
	createForAthlete: protectedOrganizationProcedure
		.input(createWellnessSurveyForAthleteSchema)
		.mutation(async ({ ctx, input }) => {
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

			const surveyDate = input.surveyDate ?? new Date();

			// Create the survey
			const [survey] = await db
				.insert(athleteWellnessSurveyTable)
				.values({
					athleteId: input.athleteId,
					organizationId: ctx.organization.id,
					surveyDate,
					sleepHours: input.sleepHours,
					sleepQuality: input.sleepQuality,
					fatigue: input.fatigue,
					muscleSoreness: input.muscleSoreness,
					mood: input.mood,
					stressLevel: input.stressLevel,
					energy: input.energy,
					notes: input.notes,
				})
				.returning();

			if (!survey) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create wellness survey",
				});
			}

			logger.info(
				{
					athleteId: input.athleteId,
					surveyId: survey.id,
					createdBy: ctx.user.id,
				},
				"Wellness survey created by admin/coach",
			);

			return survey;
		}),

	// Update wellness survey (admin/coach)
	updateForAthlete: protectedOrganizationProcedure
		.input(updateWellnessSurveySchema)
		.mutation(async ({ ctx, input }) => {
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

			// Verify survey exists and belongs to athlete
			const existing = await db.query.athleteWellnessSurveyTable.findFirst({
				where: and(
					eq(athleteWellnessSurveyTable.id, input.id),
					eq(athleteWellnessSurveyTable.athleteId, input.athleteId),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Wellness survey not found",
				});
			}

			const [updated] = await db
				.update(athleteWellnessSurveyTable)
				.set({
					surveyDate: input.surveyDate ?? existing.surveyDate,
					sleepHours: input.sleepHours,
					sleepQuality: input.sleepQuality,
					fatigue: input.fatigue,
					muscleSoreness: input.muscleSoreness,
					mood: input.mood,
					stressLevel: input.stressLevel,
					energy: input.energy,
					notes: input.notes,
				})
				.where(eq(athleteWellnessSurveyTable.id, input.id))
				.returning();

			logger.info(
				{
					surveyId: input.id,
					athleteId: input.athleteId,
					updatedBy: ctx.user.id,
				},
				"Wellness survey updated",
			);

			return updated;
		}),

	// Delete wellness survey (admin/coach)
	deleteForAthlete: protectedOrganizationProcedure
		.input(deleteWellnessSurveySchema)
		.mutation(async ({ ctx, input }) => {
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

			// Verify survey exists and belongs to athlete
			const existing = await db.query.athleteWellnessSurveyTable.findFirst({
				where: and(
					eq(athleteWellnessSurveyTable.id, input.id),
					eq(athleteWellnessSurveyTable.athleteId, input.athleteId),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Wellness survey not found",
				});
			}

			await db
				.delete(athleteWellnessSurveyTable)
				.where(eq(athleteWellnessSurveyTable.id, input.id));

			logger.info(
				{
					surveyId: input.id,
					athleteId: input.athleteId,
					deletedBy: ctx.user.id,
				},
				"Wellness survey deleted",
			);
		}),
});
