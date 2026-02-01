import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
	AchievementScope,
	AchievementType,
	AthleteSport,
	CoachExperienceLevel,
	CoachStatus,
} from "@/lib/db/schema/enums";
import {
	coachAchievementTable,
	coachEducationTable,
	coachSportsExperienceTable,
	coachTable,
	memberTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

// Schema for updating own coach profile
const updateMyCoachProfileSchema = z.object({
	phone: z.string().trim().max(30).optional().nullable(),
	birthDate: z.coerce.date().optional().nullable(),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	specialty: z.string().trim().max(500).optional(),
	bio: z.string().trim().max(2000).optional().nullable(),
});

// Schema for sports experience
const createMySportsExperienceSchema = z.object({
	clubId: z.string().uuid().optional().nullable(),
	nationalTeamId: z.string().uuid().optional().nullable(),
	role: z.string().trim().max(100),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	level: z.nativeEnum(CoachExperienceLevel).optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	achievements: z.string().trim().max(2000).optional().nullable(),
	description: z.string().trim().max(2000).optional().nullable(),
});

const updateMySportsExperienceSchema = z.object({
	id: z.string().uuid(),
	clubId: z.string().uuid().optional().nullable(),
	nationalTeamId: z.string().uuid().optional().nullable(),
	role: z.string().trim().max(100).optional(),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	level: z.nativeEnum(CoachExperienceLevel).optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	achievements: z.string().trim().max(2000).optional().nullable(),
	description: z.string().trim().max(2000).optional().nullable(),
});

// Schema for achievements
const createMyAchievementSchema = z.object({
	title: z.string().trim().min(1).max(200),
	type: z.nativeEnum(AchievementType),
	scope: z.nativeEnum(AchievementScope),
	year: z.number().int().min(1900).max(2100),
	organization: z.string().trim().max(200).optional().nullable(),
	team: z.string().trim().max(200).optional().nullable(),
	competition: z.string().trim().max(200).optional().nullable(),
	position: z.string().trim().max(100).optional().nullable(),
	description: z.string().trim().max(2000).optional().nullable(),
	isPublic: z.boolean().optional(),
	displayOrder: z.number().int().optional(),
});

const updateMyAchievementSchema = z.object({
	id: z.string().uuid(),
	title: z.string().trim().min(1).max(200).optional(),
	type: z.nativeEnum(AchievementType).optional(),
	scope: z.nativeEnum(AchievementScope).optional(),
	year: z.number().int().min(1900).max(2100).optional(),
	organization: z.string().trim().max(200).optional().nullable(),
	team: z.string().trim().max(200).optional().nullable(),
	competition: z.string().trim().max(200).optional().nullable(),
	position: z.string().trim().max(100).optional().nullable(),
	description: z.string().trim().max(2000).optional().nullable(),
	isPublic: z.boolean().optional(),
	displayOrder: z.number().int().optional(),
});

// Schema for education
const createMyEducationSchema = z.object({
	institution: z.string().trim().min(1).max(200),
	degree: z.string().trim().max(100).optional().nullable(),
	fieldOfStudy: z.string().trim().max(100).optional().nullable(),
	academicYear: z.string().trim().max(50).optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	expectedGraduationDate: z.coerce.date().optional().nullable(),
	gpa: z.string().trim().max(10).optional().nullable(),
	isCurrent: z.boolean().optional(),
	notes: z.string().trim().max(1000).optional().nullable(),
	displayOrder: z.number().int().optional(),
});

const updateMyEducationSchema = z.object({
	id: z.string().uuid(),
	institution: z.string().trim().min(1).max(200).optional(),
	degree: z.string().trim().max(100).optional().nullable(),
	fieldOfStudy: z.string().trim().max(100).optional().nullable(),
	academicYear: z.string().trim().max(50).optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	expectedGraduationDate: z.coerce.date().optional().nullable(),
	gpa: z.string().trim().max(10).optional().nullable(),
	isCurrent: z.boolean().optional(),
	notes: z.string().trim().max(1000).optional().nullable(),
	displayOrder: z.number().int().optional(),
});

export const coachRouter = createTRPCRouter({
	/**
	 * Get the current user's coach profile (if they have one)
	 * This doesn't require an organization - it's the user's own profile
	 */
	getMyProfile: protectedProcedure.query(async ({ ctx }) => {
		// Get all coach profiles for this user (can have multiple across orgs)
		const coachProfiles = await db.query.coachTable.findMany({
			where: eq(coachTable.userId, ctx.user.id),
			with: {
				user: {
					columns: {
						id: true,
						name: true,
						email: true,
						image: true,
						imageKey: true,
					},
				},
				organization: {
					columns: {
						id: true,
						name: true,
						slug: true,
						logo: true,
					},
				},
				sportsExperience: true,
				achievements: {
					orderBy: (achievements, { desc }) => [desc(achievements.year)],
				},
				education: {
					orderBy: (education, { asc }) => [asc(education.displayOrder)],
				},
			},
		});

		if (coachProfiles.length === 0) {
			return null;
		}

		// Return the first profile (primary)
		const primaryProfile = coachProfiles[0];

		if (!primaryProfile) {
			return null;
		}

		// Get all organizations this user is a member of
		const memberships = await db.query.memberTable.findMany({
			where: eq(memberTable.userId, ctx.user.id),
			with: {
				organization: {
					columns: {
						id: true,
						name: true,
						slug: true,
						logo: true,
					},
				},
			},
		});

		return {
			coach: primaryProfile,
			allProfiles: coachProfiles,
			sportsExperience: primaryProfile.sportsExperience,
			achievements: primaryProfile.achievements,
			education: primaryProfile.education,
			organizations: memberships.map((m) => ({
				...m.organization,
				role: m.role,
				joinedAt: m.createdAt,
			})),
		};
	}),

	/**
	 * Update the current user's coach profile
	 */
	updateMyProfile: protectedProcedure
		.input(updateMyCoachProfileSchema)
		.mutation(async ({ ctx, input }) => {
			// Find the user's coach profile
			const coachProfile = await db.query.coachTable.findFirst({
				where: eq(coachTable.userId, ctx.user.id),
			});

			if (!coachProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach profile not found",
				});
			}

			// Update the profile
			const [updated] = await db
				.update(coachTable)
				.set({
					...input,
					updatedAt: new Date(),
				})
				.where(eq(coachTable.id, coachProfile.id))
				.returning();

			logger.info(
				{
					userId: ctx.user.id,
					coachId: coachProfile.id,
				},
				"Coach updated own profile",
			);

			return updated;
		}),

	/**
	 * Check if current user is a coach
	 */
	isCoach: protectedProcedure.query(async ({ ctx }) => {
		const coachProfile = await db.query.coachTable.findFirst({
			where: eq(coachTable.userId, ctx.user.id),
			columns: { id: true },
		});

		return !!coachProfile;
	}),

	/**
	 * Get all organizations the user is a member of
	 */
	getMyOrganizations: protectedProcedure.query(async ({ ctx }) => {
		const memberships = await db.query.memberTable.findMany({
			where: eq(memberTable.userId, ctx.user.id),
			with: {
				organization: {
					columns: {
						id: true,
						name: true,
						slug: true,
						logo: true,
					},
				},
			},
		});

		return memberships.map((m) => ({
			...m.organization,
			role: m.role,
			joinedAt: m.createdAt,
		}));
	}),

	// ============================================================================
	// SPORTS EXPERIENCE (self-managed)
	// ============================================================================

	listMySportsExperience: protectedProcedure.query(async ({ ctx }) => {
		const coachProfile = await db.query.coachTable.findFirst({
			where: eq(coachTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!coachProfile) {
			return [];
		}

		const experience = await db.query.coachSportsExperienceTable.findMany({
			where: eq(coachSportsExperienceTable.coachId, coachProfile.id),
			orderBy: desc(coachSportsExperienceTable.startDate),
		});

		return experience;
	}),

	addSportsExperience: protectedProcedure
		.input(createMySportsExperienceSchema)
		.mutation(async ({ ctx, input }) => {
			const coachProfile = await db.query.coachTable.findFirst({
				where: eq(coachTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!coachProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach profile not found",
				});
			}

			const [created] = await db
				.insert(coachSportsExperienceTable)
				.values({
					coachId: coachProfile.id,
					...input,
				})
				.returning();

			if (!created) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create sports experience entry",
				});
			}

			logger.info(
				{
					userId: ctx.user.id,
					coachId: coachProfile.id,
					experienceId: created.id,
				},
				"Coach added sports experience",
			);

			return created;
		}),

	updateSportsExperience: protectedProcedure
		.input(updateMySportsExperienceSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const coachProfile = await db.query.coachTable.findFirst({
				where: eq(coachTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!coachProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach profile not found",
				});
			}

			// Verify the entry belongs to this coach
			const entry = await db.query.coachSportsExperienceTable.findFirst({
				where: and(
					eq(coachSportsExperienceTable.id, id),
					eq(coachSportsExperienceTable.coachId, coachProfile.id),
				),
			});

			if (!entry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sports experience entry not found",
				});
			}

			const [updated] = await db
				.update(coachSportsExperienceTable)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(coachSportsExperienceTable.id, id))
				.returning();

			logger.info(
				{
					userId: ctx.user.id,
					coachId: coachProfile.id,
					experienceId: id,
				},
				"Coach updated sports experience",
			);

			return updated;
		}),

	deleteSportsExperience: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const coachProfile = await db.query.coachTable.findFirst({
				where: eq(coachTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!coachProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach profile not found",
				});
			}

			// Verify the entry belongs to this coach
			const entry = await db.query.coachSportsExperienceTable.findFirst({
				where: and(
					eq(coachSportsExperienceTable.id, input.id),
					eq(coachSportsExperienceTable.coachId, coachProfile.id),
				),
			});

			if (!entry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sports experience entry not found",
				});
			}

			await db
				.delete(coachSportsExperienceTable)
				.where(eq(coachSportsExperienceTable.id, input.id));

			logger.info(
				{
					userId: ctx.user.id,
					coachId: coachProfile.id,
					experienceId: input.id,
				},
				"Coach deleted sports experience",
			);

			return { success: true };
		}),

	// ============================================================================
	// ACHIEVEMENTS (self-managed)
	// ============================================================================

	listMyAchievements: protectedProcedure.query(async ({ ctx }) => {
		const coachProfile = await db.query.coachTable.findFirst({
			where: eq(coachTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!coachProfile) {
			return [];
		}

		const achievements = await db.query.coachAchievementTable.findMany({
			where: eq(coachAchievementTable.coachId, coachProfile.id),
			orderBy: [
				desc(coachAchievementTable.year),
				coachAchievementTable.displayOrder,
			],
		});

		return achievements;
	}),

	addAchievement: protectedProcedure
		.input(createMyAchievementSchema)
		.mutation(async ({ ctx, input }) => {
			const coachProfile = await db.query.coachTable.findFirst({
				where: eq(coachTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!coachProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach profile not found",
				});
			}

			const [created] = await db
				.insert(coachAchievementTable)
				.values({
					coachId: coachProfile.id,
					...input,
				})
				.returning();

			if (!created) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create achievement",
				});
			}

			logger.info(
				{
					userId: ctx.user.id,
					coachId: coachProfile.id,
					achievementId: created.id,
				},
				"Coach added achievement",
			);

			return created;
		}),

	updateAchievement: protectedProcedure
		.input(updateMyAchievementSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const coachProfile = await db.query.coachTable.findFirst({
				where: eq(coachTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!coachProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach profile not found",
				});
			}

			// Verify the achievement belongs to this coach
			const achievement = await db.query.coachAchievementTable.findFirst({
				where: and(
					eq(coachAchievementTable.id, id),
					eq(coachAchievementTable.coachId, coachProfile.id),
				),
			});

			if (!achievement) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Achievement not found",
				});
			}

			const [updated] = await db
				.update(coachAchievementTable)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(coachAchievementTable.id, id))
				.returning();

			logger.info(
				{
					userId: ctx.user.id,
					coachId: coachProfile.id,
					achievementId: id,
				},
				"Coach updated achievement",
			);

			return updated;
		}),

	deleteAchievement: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const coachProfile = await db.query.coachTable.findFirst({
				where: eq(coachTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!coachProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach profile not found",
				});
			}

			// Verify the achievement belongs to this coach
			const achievement = await db.query.coachAchievementTable.findFirst({
				where: and(
					eq(coachAchievementTable.id, input.id),
					eq(coachAchievementTable.coachId, coachProfile.id),
				),
			});

			if (!achievement) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Achievement not found",
				});
			}

			await db
				.delete(coachAchievementTable)
				.where(eq(coachAchievementTable.id, input.id));

			logger.info(
				{
					userId: ctx.user.id,
					coachId: coachProfile.id,
					achievementId: input.id,
				},
				"Coach deleted achievement",
			);

			return { success: true };
		}),

	// ============================================================================
	// EDUCATION (self-managed)
	// ============================================================================

	listMyEducation: protectedProcedure.query(async ({ ctx }) => {
		const coachProfile = await db.query.coachTable.findFirst({
			where: eq(coachTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!coachProfile) {
			return [];
		}

		const education = await db.query.coachEducationTable.findMany({
			where: eq(coachEducationTable.coachId, coachProfile.id),
			orderBy: coachEducationTable.displayOrder,
		});

		return education;
	}),

	addEducation: protectedProcedure
		.input(createMyEducationSchema)
		.mutation(async ({ ctx, input }) => {
			const coachProfile = await db.query.coachTable.findFirst({
				where: eq(coachTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!coachProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach profile not found",
				});
			}

			const [created] = await db
				.insert(coachEducationTable)
				.values({
					coachId: coachProfile.id,
					...input,
				})
				.returning();

			if (!created) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create education entry",
				});
			}

			logger.info(
				{
					userId: ctx.user.id,
					coachId: coachProfile.id,
					educationId: created.id,
				},
				"Coach added education",
			);

			return created;
		}),

	updateEducation: protectedProcedure
		.input(updateMyEducationSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const coachProfile = await db.query.coachTable.findFirst({
				where: eq(coachTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!coachProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach profile not found",
				});
			}

			// Verify the education entry belongs to this coach
			const education = await db.query.coachEducationTable.findFirst({
				where: and(
					eq(coachEducationTable.id, id),
					eq(coachEducationTable.coachId, coachProfile.id),
				),
			});

			if (!education) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Education entry not found",
				});
			}

			const [updated] = await db
				.update(coachEducationTable)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(coachEducationTable.id, id))
				.returning();

			logger.info(
				{
					userId: ctx.user.id,
					coachId: coachProfile.id,
					educationId: id,
				},
				"Coach updated education",
			);

			return updated;
		}),

	deleteEducation: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const coachProfile = await db.query.coachTable.findFirst({
				where: eq(coachTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!coachProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach profile not found",
				});
			}

			// Verify the education entry belongs to this coach
			const education = await db.query.coachEducationTable.findFirst({
				where: and(
					eq(coachEducationTable.id, input.id),
					eq(coachEducationTable.coachId, coachProfile.id),
				),
			});

			if (!education) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Education entry not found",
				});
			}

			await db
				.delete(coachEducationTable)
				.where(eq(coachEducationTable.id, input.id));

			logger.info(
				{
					userId: ctx.user.id,
					coachId: coachProfile.id,
					educationId: input.id,
				},
				"Coach deleted education",
			);

			return { success: true };
		}),
});

export default coachRouter;
