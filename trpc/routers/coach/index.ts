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
	LanguageProficiencyLevel,
} from "@/lib/db/schema/enums";
import {
	coachAchievementTable,
	coachEducationTable,
	coachLanguageTable,
	coachReferenceTable,
	coachSportsExperienceTable,
	coachTable,
	memberTable,
	userTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import {
	deleteObject,
	generateStorageKey,
	getBucketName,
	getSignedUploadUrl,
	getSignedUrl,
} from "@/lib/storage";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

// Schema for updating own coach profile
const updateMyCoachProfileSchema = z.object({
	phone: z.string().trim().max(30).optional().nullable(),
	birthDate: z.coerce.date().optional().nullable(),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	specialty: z.string().trim().max(500).optional(),
	bio: z.string().trim().max(2000).optional().nullable(),
	// Social media profiles
	socialInstagram: z.string().trim().max(100).optional().nullable(),
	socialTwitter: z.string().trim().max(100).optional().nullable(),
	socialTiktok: z.string().trim().max(100).optional().nullable(),
	socialLinkedin: z.string().trim().max(500).optional().nullable(),
	socialFacebook: z.string().trim().max(500).optional().nullable(),
	// Public profile settings
	isPublicProfile: z.boolean().optional(),
	opportunityTypes: z.array(z.string()).optional(),
});

// Schema for languages
const createMyLanguageSchema = z.object({
	language: z.string().trim().min(2).max(50),
	level: z.nativeEnum(LanguageProficiencyLevel),
	notes: z.string().trim().max(200).optional().nullable(),
});

const updateMyLanguageSchema = z.object({
	id: z.string().uuid(),
	language: z.string().trim().min(2).max(50).optional(),
	level: z.nativeEnum(LanguageProficiencyLevel).optional(),
	notes: z.string().trim().max(200).optional().nullable(),
});

// Schema for references
const createMyReferenceSchema = z.object({
	name: z.string().trim().min(2).max(100),
	relationship: z.string().trim().min(2).max(50),
	organization: z.string().trim().max(100).optional().nullable(),
	position: z.string().trim().max(100).optional().nullable(),
	email: z.string().email().optional().nullable().or(z.literal("")),
	phone: z.string().trim().max(20).optional().nullable(),
	testimonial: z.string().trim().max(500).optional().nullable(),
	skillsHighlighted: z.array(z.string()).optional(),
	isPublic: z.boolean().optional(),
});

const updateMyReferenceSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(2).max(100).optional(),
	relationship: z.string().trim().min(2).max(50).optional(),
	organization: z.string().trim().max(100).optional().nullable(),
	position: z.string().trim().max(100).optional().nullable(),
	email: z.string().email().optional().nullable().or(z.literal("")),
	phone: z.string().trim().max(20).optional().nullable(),
	testimonial: z.string().trim().max(500).optional().nullable(),
	skillsHighlighted: z.array(z.string()).optional(),
	isPublic: z.boolean().optional(),
	displayOrder: z.number().int().optional(),
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
				languages: true,
				references: {
					orderBy: (references, { asc }) => [asc(references.displayOrder)],
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
			languages: primaryProfile.languages,
			references: primaryProfile.references,
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

	// ============================================================================
	// PROFILE PHOTO (self-managed - stored on user table)
	// ============================================================================

	getProfilePhotoUploadUrl: protectedProcedure
		.input(
			z.object({
				fileName: z.string().min(1),
				contentType: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify user has a coach profile
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

			const storageKey = generateStorageKey(
				"profile-photos",
				ctx.user.id,
				input.fileName,
			);

			const uploadUrl = await getSignedUploadUrl(storageKey, getBucketName(), {
				contentType: input.contentType,
				expiresIn: 3600,
			});

			return { uploadUrl, imageKey: storageKey };
		}),

	saveProfilePhoto: protectedProcedure
		.input(
			z.object({
				imageKey: z.string().min(1, "El archivo es requerido."),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Verify user has a coach profile
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

			// Get current user to check for existing image
			const currentUser = await db.query.userTable.findFirst({
				where: eq(userTable.id, ctx.user.id),
				columns: { imageKey: true },
			});

			// Delete old image from S3 if exists
			if (currentUser?.imageKey) {
				try {
					await deleteObject(currentUser.imageKey, getBucketName());
				} catch (error) {
					logger.error(
						{ error, imageKey: currentUser.imageKey },
						"Failed to delete old profile photo from S3",
					);
				}
			}

			// Update user's imageKey
			const [updated] = await db
				.update(userTable)
				.set({
					imageKey: input.imageKey,
					updatedAt: new Date(),
				})
				.where(eq(userTable.id, ctx.user.id))
				.returning();

			logger.info(
				{ userId: ctx.user.id, coachId: coachProfile.id },
				"Coach updated profile photo",
			);

			return updated;
		}),

	removeProfilePhoto: protectedProcedure.mutation(async ({ ctx }) => {
		// Verify user has a coach profile
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

		// Get current user
		const currentUser = await db.query.userTable.findFirst({
			where: eq(userTable.id, ctx.user.id),
			columns: { imageKey: true },
		});

		// Delete from S3 if exists
		if (currentUser?.imageKey) {
			try {
				await deleteObject(currentUser.imageKey, getBucketName());
			} catch (error) {
				logger.error(
					{ error, imageKey: currentUser.imageKey },
					"Failed to delete profile photo from S3",
				);
			}
		}

		// Clear imageKey
		const [updated] = await db
			.update(userTable)
			.set({
				imageKey: null,
				updatedAt: new Date(),
			})
			.where(eq(userTable.id, ctx.user.id))
			.returning();

		logger.info(
			{ userId: ctx.user.id, coachId: coachProfile.id },
			"Coach removed profile photo",
		);

		return updated;
	}),

	getProfilePhotoUrl: protectedProcedure.query(async ({ ctx }) => {
		const user = await db.query.userTable.findFirst({
			where: eq(userTable.id, ctx.user.id),
			columns: { imageKey: true, image: true },
		});

		if (!user) {
			return { hasProfilePhoto: false, signedUrl: null, source: null };
		}

		// If user has S3 image
		if (user.imageKey) {
			const signedUrl = await getSignedUrl(user.imageKey, getBucketName());
			return {
				hasProfilePhoto: true,
				signedUrl,
				source: "s3" as const,
			};
		}

		// If user has OAuth image
		if (user.image) {
			return {
				hasProfilePhoto: true,
				signedUrl: user.image,
				source: "oauth" as const,
			};
		}

		return { hasProfilePhoto: false, signedUrl: null, source: null };
	}),

	// ============================================================================
	// COVER PHOTO (self-managed)
	// ============================================================================

	getCoverPhotoUploadUrl: protectedProcedure
		.input(
			z.object({
				fileName: z.string().min(1),
				contentType: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Find the user's coach profile
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

			const storageKey = generateStorageKey(
				"cover-photos",
				coachProfile.id,
				input.fileName,
			);

			const uploadUrl = await getSignedUploadUrl(storageKey, getBucketName(), {
				contentType: input.contentType,
				expiresIn: 3600, // 1 hour
			});

			return { uploadUrl, fileKey: storageKey };
		}),

	saveCoverPhoto: protectedProcedure
		.input(
			z.object({
				fileKey: z.string().min(1, "El archivo es requerido."),
			}),
		)
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

			// If there's an existing cover photo, delete it from S3
			if (coachProfile.coverPhotoKey) {
				try {
					await deleteObject(coachProfile.coverPhotoKey, getBucketName());
				} catch (error) {
					logger.error(
						{ error, fileKey: coachProfile.coverPhotoKey },
						"Failed to delete old cover photo from S3",
					);
				}
			}

			const [updated] = await db
				.update(coachTable)
				.set({
					coverPhotoKey: input.fileKey,
					updatedAt: new Date(),
				})
				.where(eq(coachTable.id, coachProfile.id))
				.returning();

			logger.info({ coachId: coachProfile.id }, "Coach uploaded cover photo");

			return updated;
		}),

	removeCoverPhoto: protectedProcedure.mutation(async ({ ctx }) => {
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

		if (coachProfile.coverPhotoKey) {
			try {
				await deleteObject(coachProfile.coverPhotoKey, getBucketName());
			} catch (error) {
				logger.error(
					{ error, fileKey: coachProfile.coverPhotoKey },
					"Failed to delete cover photo from S3",
				);
			}
		}

		const [updated] = await db
			.update(coachTable)
			.set({
				coverPhotoKey: null,
				updatedAt: new Date(),
			})
			.where(eq(coachTable.id, coachProfile.id))
			.returning();

		logger.info({ coachId: coachProfile.id }, "Coach removed cover photo");

		return updated;
	}),

	getCoverPhotoUrl: protectedProcedure.query(async ({ ctx }) => {
		// Find the user's coach profile
		const coachProfile = await db.query.coachTable.findFirst({
			where: eq(coachTable.userId, ctx.user.id),
		});

		if (!coachProfile) {
			return { hasCoverPhoto: false, signedUrl: null };
		}

		if (!coachProfile.coverPhotoKey) {
			return { hasCoverPhoto: false, signedUrl: null };
		}

		const signedUrl = await getSignedUrl(
			coachProfile.coverPhotoKey,
			getBucketName(),
		);

		return {
			hasCoverPhoto: true,
			signedUrl,
		};
	}),

	// ============================================================================
	// LANGUAGES (self-managed)
	// ============================================================================

	listMyLanguages: protectedProcedure.query(async ({ ctx }) => {
		const coachProfile = await db.query.coachTable.findFirst({
			where: eq(coachTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!coachProfile) {
			return [];
		}

		const languages = await db.query.coachLanguageTable.findMany({
			where: eq(coachLanguageTable.coachId, coachProfile.id),
			orderBy: coachLanguageTable.language,
		});

		return languages;
	}),

	addLanguage: protectedProcedure
		.input(createMyLanguageSchema)
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

			// Check for duplicate language
			const existing = await db.query.coachLanguageTable.findFirst({
				where: and(
					eq(coachLanguageTable.coachId, coachProfile.id),
					eq(coachLanguageTable.language, input.language),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Ya tienes este idioma agregado",
				});
			}

			const [created] = await db
				.insert(coachLanguageTable)
				.values({
					coachId: coachProfile.id,
					...input,
				})
				.returning();

			logger.info(
				{ userId: ctx.user.id, coachId: coachProfile.id },
				"Coach added language",
			);

			return created;
		}),

	updateLanguage: protectedProcedure
		.input(updateMyLanguageSchema)
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

			// Verify the language belongs to this coach
			const language = await db.query.coachLanguageTable.findFirst({
				where: and(
					eq(coachLanguageTable.id, id),
					eq(coachLanguageTable.coachId, coachProfile.id),
				),
			});

			if (!language) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Language not found",
				});
			}

			const [updated] = await db
				.update(coachLanguageTable)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(coachLanguageTable.id, id))
				.returning();

			logger.info(
				{ userId: ctx.user.id, coachId: coachProfile.id, languageId: id },
				"Coach updated language",
			);

			return updated;
		}),

	deleteLanguage: protectedProcedure
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

			// Verify the language belongs to this coach
			const language = await db.query.coachLanguageTable.findFirst({
				where: and(
					eq(coachLanguageTable.id, input.id),
					eq(coachLanguageTable.coachId, coachProfile.id),
				),
			});

			if (!language) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Language not found",
				});
			}

			await db
				.delete(coachLanguageTable)
				.where(eq(coachLanguageTable.id, input.id));

			logger.info(
				{ userId: ctx.user.id, coachId: coachProfile.id, languageId: input.id },
				"Coach deleted language",
			);

			return { success: true };
		}),

	// ============================================================================
	// REFERENCES (self-managed)
	// ============================================================================

	listMyReferences: protectedProcedure.query(async ({ ctx }) => {
		const coachProfile = await db.query.coachTable.findFirst({
			where: eq(coachTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!coachProfile) {
			return [];
		}

		const references = await db.query.coachReferenceTable.findMany({
			where: eq(coachReferenceTable.coachId, coachProfile.id),
			orderBy: coachReferenceTable.displayOrder,
		});

		return references;
	}),

	addReference: protectedProcedure
		.input(createMyReferenceSchema)
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

			// Get max display order
			const maxOrder = await db.query.coachReferenceTable.findFirst({
				where: eq(coachReferenceTable.coachId, coachProfile.id),
				orderBy: desc(coachReferenceTable.displayOrder),
				columns: { displayOrder: true },
			});

			const [created] = await db
				.insert(coachReferenceTable)
				.values({
					coachId: coachProfile.id,
					...input,
					email: input.email || null,
					displayOrder: (maxOrder?.displayOrder ?? -1) + 1,
				})
				.returning();

			logger.info(
				{ userId: ctx.user.id, coachId: coachProfile.id },
				"Coach added reference",
			);

			return created;
		}),

	updateReference: protectedProcedure
		.input(updateMyReferenceSchema)
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

			// Verify the reference belongs to this coach
			const reference = await db.query.coachReferenceTable.findFirst({
				where: and(
					eq(coachReferenceTable.id, id),
					eq(coachReferenceTable.coachId, coachProfile.id),
				),
			});

			if (!reference) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Reference not found",
				});
			}

			const [updated] = await db
				.update(coachReferenceTable)
				.set({
					...data,
					email: data.email || null,
					updatedAt: new Date(),
				})
				.where(eq(coachReferenceTable.id, id))
				.returning();

			logger.info(
				{ userId: ctx.user.id, coachId: coachProfile.id, referenceId: id },
				"Coach updated reference",
			);

			return updated;
		}),

	deleteReference: protectedProcedure
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

			// Verify the reference belongs to this coach
			const reference = await db.query.coachReferenceTable.findFirst({
				where: and(
					eq(coachReferenceTable.id, input.id),
					eq(coachReferenceTable.coachId, coachProfile.id),
				),
			});

			if (!reference) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Reference not found",
				});
			}

			await db
				.delete(coachReferenceTable)
				.where(eq(coachReferenceTable.id, input.id));

			logger.info(
				{
					userId: ctx.user.id,
					coachId: coachProfile.id,
					referenceId: input.id,
				},
				"Coach deleted reference",
			);

			return { success: true };
		}),
});
