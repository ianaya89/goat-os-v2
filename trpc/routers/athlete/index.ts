import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import {
	AchievementScope,
	AchievementType,
	AthleteLevel,
	AthleteMedicalDocumentType,
	AthleteOpportunityType,
	AthleteSport,
	AthleteStatus,
	DominantSide,
	LanguageProficiencyLevel,
} from "@/lib/db/schema/enums";
import {
	athleteAchievementTable,
	athleteCareerHistoryTable,
	athleteEducationTable,
	athleteLanguageTable,
	athleteMedicalDocumentTable,
	athleteReferenceTable,
	athleteSponsorTable,
	athleteTable,
	memberTable,
	organizationTable,
	userTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import {
	deleteObject,
	generateStorageKey,
	getBucketName,
	getSignedUploadUrl,
	getSignedUrl,
} from "@/lib/storage/s3";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

// Schema for updating own athlete profile (no status field - that's admin-only)
const updateMyAthleteProfileSchema = z.object({
	// Basic info
	sport: z.nativeEnum(AthleteSport).optional(),
	birthDate: z.coerce.date().optional().nullable(),
	level: z.nativeEnum(AthleteLevel).optional(),
	// Physical attributes
	height: z.number().int().min(50).max(300).optional().nullable(),
	weight: z.number().int().min(10000).max(300000).optional().nullable(),
	dominantFoot: z.nativeEnum(DominantSide).optional().nullable(),
	dominantHand: z.nativeEnum(DominantSide).optional().nullable(),
	// Profile information
	nationality: z.string().trim().max(100).optional().nullable(),
	position: z.string().trim().max(100).optional().nullable(),
	secondaryPosition: z.string().trim().max(100).optional().nullable(),
	jerseyNumber: z.number().int().min(0).max(999).optional().nullable(),
	bio: z.string().trim().max(2000).optional().nullable(),
	yearsOfExperience: z.number().int().min(0).max(50).optional().nullable(),
	// Contact information
	phone: z.string().trim().max(30).optional().nullable(),
	// Parent/Guardian contact
	parentName: z.string().trim().max(200).optional().nullable(),
	parentPhone: z.string().trim().max(30).optional().nullable(),
	parentEmail: z.string().trim().email().max(255).optional().nullable(),
	parentRelationship: z.string().trim().max(100).optional().nullable(),
	// YouTube videos
	youtubeVideos: z.array(z.string().url()).max(10).optional().nullable(),
	// Social media
	socialInstagram: z.string().trim().max(100).optional().nullable(),
	socialTwitter: z.string().trim().max(100).optional().nullable(),
	socialTiktok: z.string().trim().max(100).optional().nullable(),
	socialLinkedin: z.string().trim().max(500).optional().nullable(),
	socialFacebook: z.string().trim().max(500).optional().nullable(),
	// Education information
	educationInstitution: z.string().trim().max(200).optional().nullable(),
	educationYear: z.string().trim().max(50).optional().nullable(),
	expectedGraduationDate: z.coerce.date().optional().nullable(),
	gpa: z.string().trim().max(10).optional().nullable(),
	// Health & dietary
	dietaryRestrictions: z.string().trim().max(500).optional().nullable(),
	allergies: z.string().trim().max(500).optional().nullable(),
	// Residence
	residenceCity: z.string().trim().max(100).optional().nullable(),
	residenceCountry: z.string().trim().max(100).optional().nullable(),
	// Club info (athlete can update these)
	currentClub: z.string().trim().max(200).optional().nullable(),
	category: z.string().trim().max(100).optional().nullable(),
	// Public profile settings
	isPublicProfile: z.boolean().optional(),
	opportunityTypes: z
		.array(z.nativeEnum(AthleteOpportunityType))
		.max(5)
		.optional(),
});

// Schema for career history
const createMyCareerHistorySchema = z.object({
	clubId: z.string().uuid().optional(),
	nationalTeamId: z.string().uuid().optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	position: z.string().trim().max(100).optional(),
	achievements: z.string().trim().max(2000).optional(),
	notes: z.string().trim().max(1000).optional(),
});

const updateMyCareerHistorySchema = z.object({
	id: z.string().uuid(),
	clubId: z.string().uuid().optional().nullable(),
	nationalTeamId: z.string().uuid().optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	position: z.string().trim().max(100).optional().nullable(),
	achievements: z.string().trim().max(2000).optional().nullable(),
	notes: z.string().trim().max(1000).optional().nullable(),
});

export const athleteRouter = createTRPCRouter({
	/**
	 * Get the current user's athlete profile (if they have one)
	 * This doesn't require an organization - it's the user's own profile
	 */
	getMyProfile: protectedProcedure.query(async ({ ctx }) => {
		// Get all athlete profiles for this user (can have multiple across orgs)
		const athleteProfiles = await db.query.athleteTable.findMany({
			where: eq(athleteTable.userId, ctx.user.id),
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
			},
		});

		if (athleteProfiles.length === 0) {
			return null;
		}

		// Return the first profile (primary) - typically an athlete without org
		// or the one with a null organizationId
		const primaryProfile =
			athleteProfiles.find((p) => !p.organizationId) ?? athleteProfiles[0];

		if (!primaryProfile) {
			return null;
		}

		// Get career history for the primary profile
		const careerHistory = await db.query.athleteCareerHistoryTable.findMany({
			where: eq(athleteCareerHistoryTable.athleteId, primaryProfile.id),
			orderBy: desc(athleteCareerHistoryTable.startDate),
		});

		// Get languages for the primary profile
		const languages = await db.query.athleteLanguageTable.findMany({
			where: eq(athleteLanguageTable.athleteId, primaryProfile.id),
		});

		// Get references for the primary profile
		const references = await db.query.athleteReferenceTable.findMany({
			where: eq(athleteReferenceTable.athleteId, primaryProfile.id),
			orderBy: athleteReferenceTable.displayOrder,
		});

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
			athlete: primaryProfile,
			allProfiles: athleteProfiles,
			careerHistory,
			languages,
			references,
			organizations: memberships.map((m) => ({
				...m.organization,
				role: m.role,
			})),
		};
	}),

	/**
	 * Update the current user's athlete profile
	 */
	updateMyProfile: protectedProcedure
		.input(updateMyAthleteProfileSchema)
		.mutation(async ({ ctx, input }) => {
			// Find the user's athlete profile (prefer one without org, else first one)
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				orderBy: (athletes, { asc }) => [asc(athletes.organizationId)],
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Handle publicProfileEnabledAt timestamp
			const updateData: typeof input & {
				publicProfileEnabledAt?: Date | null;
				updatedAt: Date;
			} = {
				...input,
				updatedAt: new Date(),
			};

			// If isPublicProfile is being toggled, update the timestamp
			if (input.isPublicProfile !== undefined) {
				if (input.isPublicProfile && !athleteProfile.isPublicProfile) {
					// Enabling public profile
					updateData.publicProfileEnabledAt = new Date();
				} else if (!input.isPublicProfile && athleteProfile.isPublicProfile) {
					// Disabling public profile
					updateData.publicProfileEnabledAt = null;
				}
			}

			// Update the profile
			const [updated] = await db
				.update(athleteTable)
				.set(updateData)
				.where(eq(athleteTable.id, athleteProfile.id))
				.returning();

			logger.info(
				{
					userId: ctx.user.id,
					athleteId: athleteProfile.id,
					isPublicProfile: input.isPublicProfile,
				},
				"Athlete updated own profile",
			);

			return updated;
		}),

	/**
	 * Check if current user is an athlete
	 */
	isAthlete: protectedProcedure.query(async ({ ctx }) => {
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
			columns: { id: true },
		});

		return !!athleteProfile;
	}),

	/**
	 * Get all organizations the user can join/is member of
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
	// CAREER HISTORY (self-managed)
	// ============================================================================

	listMyCareerHistory: protectedProcedure.query(async ({ ctx }) => {
		// Find the user's athlete profile
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!athleteProfile) {
			return [];
		}

		const careerHistory = await db.query.athleteCareerHistoryTable.findMany({
			where: eq(athleteCareerHistoryTable.athleteId, athleteProfile.id),
			orderBy: desc(athleteCareerHistoryTable.startDate),
		});

		return careerHistory;
	}),

	addCareerHistory: protectedProcedure
		.input(createMyCareerHistorySchema)
		.mutation(async ({ ctx, input }) => {
			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			const [created] = await db
				.insert(athleteCareerHistoryTable)
				.values({
					athleteId: athleteProfile.id,
					...input,
				})
				.returning();

			if (!created) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create career history entry",
				});
			}

			// If the career entry has a club and is still active (no endDate), sync currentClubId
			if (input.clubId && !input.endDate) {
				await db
					.update(athleteTable)
					.set({ currentClubId: input.clubId })
					.where(eq(athleteTable.id, athleteProfile.id));
			}

			logger.info(
				{
					userId: ctx.user.id,
					athleteId: athleteProfile.id,
					careerHistoryId: created.id,
				},
				"Athlete added career history",
			);

			return created;
		}),

	updateCareerHistory: protectedProcedure
		.input(updateMyCareerHistorySchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Verify the career history belongs to this athlete
			const careerEntry = await db.query.athleteCareerHistoryTable.findFirst({
				where: and(
					eq(athleteCareerHistoryTable.id, id),
					eq(athleteCareerHistoryTable.athleteId, athleteProfile.id),
				),
			});

			if (!careerEntry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Career history entry not found",
				});
			}

			const [updated] = await db
				.update(athleteCareerHistoryTable)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(athleteCareerHistoryTable.id, id))
				.returning();

			// If the career entry has a club and is still active (no endDate), sync currentClubId
			if (updated) {
				const effectiveClubId =
					data.clubId !== undefined ? data.clubId : careerEntry.clubId;
				const effectiveEndDate =
					data.endDate !== undefined ? data.endDate : careerEntry.endDate;

				if (effectiveClubId && !effectiveEndDate) {
					await db
						.update(athleteTable)
						.set({ currentClubId: effectiveClubId })
						.where(eq(athleteTable.id, athleteProfile.id));
				}
			}

			logger.info(
				{
					userId: ctx.user.id,
					athleteId: athleteProfile.id,
					careerHistoryId: id,
				},
				"Athlete updated career history",
			);

			return updated;
		}),

	deleteCareerHistory: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Verify the career history belongs to this athlete
			const careerEntry = await db.query.athleteCareerHistoryTable.findFirst({
				where: and(
					eq(athleteCareerHistoryTable.id, input.id),
					eq(athleteCareerHistoryTable.athleteId, athleteProfile.id),
				),
			});

			if (!careerEntry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Career history entry not found",
				});
			}

			await db
				.delete(athleteCareerHistoryTable)
				.where(eq(athleteCareerHistoryTable.id, input.id));

			logger.info(
				{
					userId: ctx.user.id,
					athleteId: athleteProfile.id,
					careerHistoryId: input.id,
				},
				"Athlete deleted career history",
			);

			return { success: true };
		}),

	// ============================================================================
	// MEDICAL DOCUMENTS (self-service)
	// ============================================================================

	listMyMedicalDocuments: protectedProcedure
		.input(
			z
				.object({
					documentType: z.nativeEnum(AthleteMedicalDocumentType).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				return [];
			}

			const conditions = [
				eq(athleteMedicalDocumentTable.athleteId, athleteProfile.id),
			];

			if (input?.documentType) {
				conditions.push(
					eq(athleteMedicalDocumentTable.documentType, input.documentType),
				);
			}

			const documents = await db.query.athleteMedicalDocumentTable.findMany({
				where: and(...conditions),
				orderBy: [desc(athleteMedicalDocumentTable.createdAt)],
				with: {
					uploadedByUser: {
						columns: { id: true, name: true, image: true },
					},
				},
			});

			// Generate signed URLs for each document
			const documentsWithUrls = await Promise.all(
				documents.map(async (doc) => {
					const signedUrl = await getSignedUrl(doc.fileKey, getBucketName());
					return { ...doc, signedUrl };
				}),
			);

			return documentsWithUrls;
		}),

	createMyMedicalDocument: protectedProcedure
		.input(
			z.object({
				documentType: z.nativeEnum(AthleteMedicalDocumentType),
				title: z.string().trim().min(1, "El título es requerido.").max(200),
				description: z.string().trim().max(1000).optional(),
				fileKey: z.string().min(1, "El archivo es requerido."),
				fileName: z.string().min(1),
				fileSize: z.number().int().positive().optional(),
				mimeType: z.string().optional(),
				documentDate: z.coerce.date().optional(),
				expiresAt: z.coerce.date().optional(),
				doctorName: z.string().trim().max(200).optional(),
				medicalInstitution: z.string().trim().max(200).optional(),
				notes: z.string().trim().max(1000).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			const [document] = await db
				.insert(athleteMedicalDocumentTable)
				.values({
					...input,
					athleteId: athleteProfile.id,
					uploadedBy: ctx.user.id,
				})
				.returning();

			logger.info(
				{
					athleteId: athleteProfile.id,
					documentId: document?.id,
					type: input.documentType,
				},
				"Athlete created medical document",
			);

			return document;
		}),

	deleteMyMedicalDocument: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Find the document and verify ownership
			const document = await db.query.athleteMedicalDocumentTable.findFirst({
				where: and(
					eq(athleteMedicalDocumentTable.id, input.id),
					eq(athleteMedicalDocumentTable.athleteId, athleteProfile.id),
				),
			});

			if (!document) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Documento no encontrado",
				});
			}

			// Delete from S3
			try {
				await deleteObject(document.fileKey, getBucketName());
			} catch (error) {
				logger.error(
					{ error, fileKey: document.fileKey },
					"Failed to delete file from S3",
				);
			}

			// Delete from database
			await db
				.delete(athleteMedicalDocumentTable)
				.where(eq(athleteMedicalDocumentTable.id, input.id));

			logger.info(
				{ documentId: input.id, athleteId: athleteProfile.id },
				"Athlete deleted medical document",
			);

			return { success: true };
		}),

	getMyMedicalUploadUrl: protectedProcedure
		.input(
			z.object({
				fileName: z.string().min(1),
				contentType: z.string().optional(),
				isCertificate: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			const prefix = input.isCertificate
				? "medical-certificates"
				: "medical-documents";
			const storageKey = generateStorageKey(
				prefix,
				athleteProfile.id,
				input.fileName,
			);

			const uploadUrl = await getSignedUploadUrl(storageKey, getBucketName(), {
				contentType: input.contentType,
				expiresIn: 3600, // 1 hour
			});

			return { uploadUrl, fileKey: storageKey };
		}),

	// ============================================================================
	// MEDICAL CERTIFICATE (Special - stored in athlete table)
	// ============================================================================

	uploadMyCertificate: protectedProcedure
		.input(
			z.object({
				fileKey: z.string().min(1, "El archivo es requerido."),
				expiresAt: z.coerce.date().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// If there's an existing certificate, delete it from S3
			if (athleteProfile.medicalCertificateKey) {
				try {
					await deleteObject(
						athleteProfile.medicalCertificateKey,
						getBucketName(),
					);
				} catch (error) {
					logger.error(
						{ error, fileKey: athleteProfile.medicalCertificateKey },
						"Failed to delete old certificate from S3",
					);
				}
			}

			const [updated] = await db
				.update(athleteTable)
				.set({
					medicalCertificateKey: input.fileKey,
					medicalCertificateUploadedAt: new Date(),
					medicalCertificateExpiresAt: input.expiresAt,
				})
				.where(eq(athleteTable.id, athleteProfile.id))
				.returning();

			logger.info(
				{ athleteId: athleteProfile.id },
				"Athlete uploaded medical certificate",
			);

			return updated;
		}),

	removeMyCertificate: protectedProcedure.mutation(async ({ ctx }) => {
		// Find the user's athlete profile
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
		});

		if (!athleteProfile) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Athlete profile not found",
			});
		}

		if (athleteProfile.medicalCertificateKey) {
			try {
				await deleteObject(
					athleteProfile.medicalCertificateKey,
					getBucketName(),
				);
			} catch (error) {
				logger.error(
					{ error, fileKey: athleteProfile.medicalCertificateKey },
					"Failed to delete certificate from S3",
				);
			}
		}

		const [updated] = await db
			.update(athleteTable)
			.set({
				medicalCertificateKey: null,
				medicalCertificateUploadedAt: null,
				medicalCertificateExpiresAt: null,
			})
			.where(eq(athleteTable.id, athleteProfile.id))
			.returning();

		logger.info(
			{ athleteId: athleteProfile.id },
			"Athlete removed medical certificate",
		);

		return updated;
	}),

	getMyCertificateUrl: protectedProcedure.query(async ({ ctx }) => {
		// Find the user's athlete profile
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
		});

		if (!athleteProfile) {
			return { hasCertificate: false, signedUrl: null };
		}

		if (!athleteProfile.medicalCertificateKey) {
			return { hasCertificate: false, signedUrl: null };
		}

		const signedUrl = await getSignedUrl(
			athleteProfile.medicalCertificateKey,
			getBucketName(),
		);

		return {
			hasCertificate: true,
			signedUrl,
			uploadedAt: athleteProfile.medicalCertificateUploadedAt,
			expiresAt: athleteProfile.medicalCertificateExpiresAt,
		};
	}),

	// ============================================================================
	// LANGUAGE SKILLS (self-managed)
	// ============================================================================

	listMyLanguages: protectedProcedure.query(async ({ ctx }) => {
		// Find the user's athlete profile
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!athleteProfile) {
			return [];
		}

		const languages = await db.query.athleteLanguageTable.findMany({
			where: eq(athleteLanguageTable.athleteId, athleteProfile.id),
		});

		return languages;
	}),

	addLanguage: protectedProcedure
		.input(
			z.object({
				language: z.string().trim().min(2).max(50),
				level: z.nativeEnum(LanguageProficiencyLevel),
				notes: z.string().trim().max(200).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Check if language already exists
			const existing = await db.query.athleteLanguageTable.findFirst({
				where: and(
					eq(athleteLanguageTable.athleteId, athleteProfile.id),
					eq(athleteLanguageTable.language, input.language),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Ya tienes este idioma agregado",
				});
			}

			const [created] = await db
				.insert(athleteLanguageTable)
				.values({
					athleteId: athleteProfile.id,
					...input,
				})
				.returning();

			logger.info(
				{
					userId: ctx.user.id,
					athleteId: athleteProfile.id,
					language: input.language,
				},
				"Athlete added language",
			);

			return created;
		}),

	updateLanguage: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				level: z.nativeEnum(LanguageProficiencyLevel).optional(),
				notes: z.string().trim().max(200).optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Verify the language entry belongs to this athlete
			const languageEntry = await db.query.athleteLanguageTable.findFirst({
				where: and(
					eq(athleteLanguageTable.id, id),
					eq(athleteLanguageTable.athleteId, athleteProfile.id),
				),
			});

			if (!languageEntry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Language entry not found",
				});
			}

			const [updated] = await db
				.update(athleteLanguageTable)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(athleteLanguageTable.id, id))
				.returning();

			logger.info(
				{
					userId: ctx.user.id,
					athleteId: athleteProfile.id,
					languageId: id,
				},
				"Athlete updated language",
			);

			return updated;
		}),

	deleteLanguage: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Verify the language entry belongs to this athlete
			const languageEntry = await db.query.athleteLanguageTable.findFirst({
				where: and(
					eq(athleteLanguageTable.id, input.id),
					eq(athleteLanguageTable.athleteId, athleteProfile.id),
				),
			});

			if (!languageEntry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Language entry not found",
				});
			}

			await db
				.delete(athleteLanguageTable)
				.where(eq(athleteLanguageTable.id, input.id));

			logger.info(
				{
					userId: ctx.user.id,
					athleteId: athleteProfile.id,
					languageId: input.id,
				},
				"Athlete deleted language",
			);

			return { success: true };
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
			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			const storageKey = generateStorageKey(
				"cover-photos",
				athleteProfile.id,
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
			// Find the user's athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// If there's an existing cover photo, delete it from S3
			if (athleteProfile.coverPhotoKey) {
				try {
					await deleteObject(athleteProfile.coverPhotoKey, getBucketName());
				} catch (error) {
					logger.error(
						{ error, fileKey: athleteProfile.coverPhotoKey },
						"Failed to delete old cover photo from S3",
					);
				}
			}

			const [updated] = await db
				.update(athleteTable)
				.set({
					coverPhotoKey: input.fileKey,
					updatedAt: new Date(),
				})
				.where(eq(athleteTable.id, athleteProfile.id))
				.returning();

			logger.info(
				{ athleteId: athleteProfile.id },
				"Athlete uploaded cover photo",
			);

			return updated;
		}),

	removeCoverPhoto: protectedProcedure.mutation(async ({ ctx }) => {
		// Find the user's athlete profile
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
		});

		if (!athleteProfile) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Athlete profile not found",
			});
		}

		if (athleteProfile.coverPhotoKey) {
			try {
				await deleteObject(athleteProfile.coverPhotoKey, getBucketName());
			} catch (error) {
				logger.error(
					{ error, fileKey: athleteProfile.coverPhotoKey },
					"Failed to delete cover photo from S3",
				);
			}
		}

		const [updated] = await db
			.update(athleteTable)
			.set({
				coverPhotoKey: null,
				updatedAt: new Date(),
			})
			.where(eq(athleteTable.id, athleteProfile.id))
			.returning();

		logger.info(
			{ athleteId: athleteProfile.id },
			"Athlete removed cover photo",
		);

		return updated;
	}),

	getCoverPhotoUrl: protectedProcedure.query(async ({ ctx }) => {
		// Find the user's athlete profile
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
		});

		if (!athleteProfile) {
			return { hasCoverPhoto: false, signedUrl: null };
		}

		if (!athleteProfile.coverPhotoKey) {
			return { hasCoverPhoto: false, signedUrl: null };
		}

		const signedUrl = await getSignedUrl(
			athleteProfile.coverPhotoKey,
			getBucketName(),
		);

		return {
			hasCoverPhoto: true,
			signedUrl,
		};
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
			// Verify user has an athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
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
			// Verify user has an athlete profile
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
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
				{ userId: ctx.user.id, athleteId: athleteProfile.id },
				"Athlete updated profile photo",
			);

			return updated;
		}),

	removeProfilePhoto: protectedProcedure.mutation(async ({ ctx }) => {
		// Verify user has an athlete profile
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!athleteProfile) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Athlete profile not found",
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
			{ userId: ctx.user.id, athleteId: athleteProfile.id },
			"Athlete removed profile photo",
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
	// REFERENCES (self-managed by athlete)
	// ============================================================================

	listMyReferences: protectedProcedure.query(async ({ ctx }) => {
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!athleteProfile) {
			return [];
		}

		const references = await db.query.athleteReferenceTable.findMany({
			where: eq(athleteReferenceTable.athleteId, athleteProfile.id),
			orderBy: athleteReferenceTable.displayOrder,
		});

		return references;
	}),

	addReference: protectedProcedure
		.input(
			z.object({
				name: z.string().trim().min(2, "El nombre es requerido").max(100),
				relationship: z
					.string()
					.trim()
					.min(2, "La relación es requerida")
					.max(50),
				organization: z.string().trim().max(100).optional().nullable(),
				position: z.string().trim().max(100).optional().nullable(),
				email: z.string().trim().email().optional().nullable(),
				phone: z.string().trim().max(20).optional().nullable(),
				testimonial: z.string().trim().max(500).optional().nullable(),
				skillsHighlighted: z.array(z.string().max(50)).max(10).optional(),
				isPublic: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Get the max display order
			const existingRefs = await db.query.athleteReferenceTable.findMany({
				where: eq(athleteReferenceTable.athleteId, athleteProfile.id),
				columns: { displayOrder: true },
			});
			const maxOrder = existingRefs.reduce(
				(max, ref) => Math.max(max, ref.displayOrder),
				-1,
			);

			const [reference] = await db
				.insert(athleteReferenceTable)
				.values({
					athleteId: athleteProfile.id,
					name: input.name,
					relationship: input.relationship,
					organization: input.organization,
					position: input.position,
					email: input.email,
					phone: input.phone,
					testimonial: input.testimonial,
					skillsHighlighted: input.skillsHighlighted ?? [],
					isPublic: input.isPublic,
					displayOrder: maxOrder + 1,
				})
				.returning();

			if (!reference) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create reference",
				});
			}

			logger.info(
				{ athleteId: athleteProfile.id, referenceId: reference.id },
				"Athlete added reference",
			);

			return reference;
		}),

	updateReference: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().trim().min(2).max(100).optional(),
				relationship: z.string().trim().min(2).max(50).optional(),
				organization: z.string().trim().max(100).optional().nullable(),
				position: z.string().trim().max(100).optional().nullable(),
				email: z.string().trim().email().optional().nullable(),
				phone: z.string().trim().max(20).optional().nullable(),
				testimonial: z.string().trim().max(500).optional().nullable(),
				skillsHighlighted: z.array(z.string().max(50)).max(10).optional(),
				isPublic: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Verify ownership
			const existing = await db.query.athleteReferenceTable.findFirst({
				where: and(
					eq(athleteReferenceTable.id, input.id),
					eq(athleteReferenceTable.athleteId, athleteProfile.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Reference not found",
				});
			}

			const { id, ...updateData } = input;
			const [updated] = await db
				.update(athleteReferenceTable)
				.set({
					...updateData,
					updatedAt: new Date(),
				})
				.where(eq(athleteReferenceTable.id, id))
				.returning();

			logger.info(
				{ athleteId: athleteProfile.id, referenceId: id },
				"Athlete updated reference",
			);

			return updated;
		}),

	deleteReference: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Verify ownership
			const existing = await db.query.athleteReferenceTable.findFirst({
				where: and(
					eq(athleteReferenceTable.id, input.id),
					eq(athleteReferenceTable.athleteId, athleteProfile.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Reference not found",
				});
			}

			await db
				.delete(athleteReferenceTable)
				.where(eq(athleteReferenceTable.id, input.id));

			logger.info(
				{ athleteId: athleteProfile.id, referenceId: input.id },
				"Athlete deleted reference",
			);

			return { success: true };
		}),

	reorderReferences: protectedProcedure
		.input(
			z.object({
				referenceIds: z.array(z.string().uuid()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Update display order for each reference
			await Promise.all(
				input.referenceIds.map((id, index) =>
					db
						.update(athleteReferenceTable)
						.set({ displayOrder: index, updatedAt: new Date() })
						.where(
							and(
								eq(athleteReferenceTable.id, id),
								eq(athleteReferenceTable.athleteId, athleteProfile.id),
							),
						),
				),
			);

			return { success: true };
		}),

	// ============================================================================
	// EDUCATION (self-managed by athlete)
	// ============================================================================

	listMyEducation: protectedProcedure.query(async ({ ctx }) => {
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!athleteProfile) {
			return [];
		}

		const education = await db.query.athleteEducationTable.findMany({
			where: eq(athleteEducationTable.athleteId, athleteProfile.id),
			orderBy: [
				desc(athleteEducationTable.isCurrent),
				desc(athleteEducationTable.startDate),
			],
		});

		return education;
	}),

	addEducation: protectedProcedure
		.input(
			z.object({
				institution: z
					.string()
					.trim()
					.min(2, "La institucion es requerida")
					.max(200),
				degree: z.string().trim().max(100).optional().nullable(),
				fieldOfStudy: z.string().trim().max(100).optional().nullable(),
				academicYear: z.string().trim().max(50).optional().nullable(),
				startDate: z.date().optional().nullable(),
				endDate: z.date().optional().nullable(),
				expectedGraduationDate: z.date().optional().nullable(),
				gpa: z.string().optional().nullable(),
				isCurrent: z.boolean().optional().default(false),
				notes: z.string().trim().max(500).optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Perfil de atleta no encontrado",
				});
			}

			const [created] = await db
				.insert(athleteEducationTable)
				.values({
					athleteId: athleteProfile.id,
					institution: input.institution,
					degree: input.degree ?? null,
					fieldOfStudy: input.fieldOfStudy ?? null,
					academicYear: input.academicYear ?? null,
					startDate: input.startDate ?? null,
					endDate: input.endDate ?? null,
					expectedGraduationDate: input.expectedGraduationDate ?? null,
					gpa: input.gpa ?? null,
					isCurrent: input.isCurrent ?? false,
					notes: input.notes ?? null,
				})
				.returning();

			if (!created) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Error al crear educacion",
				});
			}

			logger.info(
				{ athleteId: athleteProfile.id, educationId: created.id },
				"Education entry added",
			);

			return created;
		}),

	updateEducation: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				institution: z
					.string()
					.trim()
					.min(2, "La institucion es requerida")
					.max(200),
				degree: z.string().trim().max(100).optional().nullable(),
				fieldOfStudy: z.string().trim().max(100).optional().nullable(),
				academicYear: z.string().trim().max(50).optional().nullable(),
				startDate: z.date().optional().nullable(),
				endDate: z.date().optional().nullable(),
				expectedGraduationDate: z.date().optional().nullable(),
				gpa: z.string().optional().nullable(),
				isCurrent: z.boolean().optional().default(false),
				notes: z.string().trim().max(500).optional().nullable(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;

			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Perfil de atleta no encontrado",
				});
			}

			const education = await db.query.athleteEducationTable.findFirst({
				where: and(
					eq(athleteEducationTable.id, id),
					eq(athleteEducationTable.athleteId, athleteProfile.id),
				),
			});

			if (!education) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Educacion no encontrada",
				});
			}

			const [updated] = await db
				.update(athleteEducationTable)
				.set({
					institution: updateData.institution,
					degree: updateData.degree ?? null,
					fieldOfStudy: updateData.fieldOfStudy ?? null,
					academicYear: updateData.academicYear ?? null,
					startDate: updateData.startDate ?? null,
					endDate: updateData.endDate ?? null,
					expectedGraduationDate: updateData.expectedGraduationDate ?? null,
					gpa: updateData.gpa ?? null,
					isCurrent: updateData.isCurrent ?? false,
					notes: updateData.notes ?? null,
				})
				.where(eq(athleteEducationTable.id, id))
				.returning();

			logger.info(
				{ athleteId: athleteProfile.id, educationId: id },
				"Education entry updated",
			);

			return updated;
		}),

	deleteEducation: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Perfil de atleta no encontrado",
				});
			}

			const education = await db.query.athleteEducationTable.findFirst({
				where: and(
					eq(athleteEducationTable.id, input.id),
					eq(athleteEducationTable.athleteId, athleteProfile.id),
				),
			});

			if (!education) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Educacion no encontrada",
				});
			}

			await db
				.delete(athleteEducationTable)
				.where(eq(athleteEducationTable.id, input.id));

			logger.info(
				{ athleteId: athleteProfile.id, educationId: input.id },
				"Education entry deleted",
			);

			return { success: true };
		}),

	// ============================================================================
	// SPONSORS (self-managed by athlete)
	// ============================================================================

	listMySponsors: protectedProcedure.query(async ({ ctx }) => {
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!athleteProfile) {
			return [];
		}

		const sponsors = await db.query.athleteSponsorTable.findMany({
			where: eq(athleteSponsorTable.athleteId, athleteProfile.id),
			orderBy: athleteSponsorTable.displayOrder,
		});

		// Generate signed URLs for logos
		const sponsorsWithUrls = await Promise.all(
			sponsors.map(async (sponsor) => {
				let logoUrl: string | null = null;
				if (sponsor.logoKey) {
					try {
						logoUrl = await getSignedUrl(sponsor.logoKey, getBucketName());
					} catch {
						// Ignore errors
					}
				}
				return { ...sponsor, logoUrl };
			}),
		);

		return sponsorsWithUrls;
	}),

	addSponsor: protectedProcedure
		.input(
			z.object({
				name: z.string().trim().min(2, "El nombre es requerido").max(100),
				logoKey: z.string().optional().nullable(),
				website: z.string().url().optional().nullable(),
				description: z.string().trim().max(500).optional().nullable(),
				partnershipType: z.string().trim().max(50).optional().nullable(),
				startDate: z.coerce.date().optional().nullable(),
				endDate: z.coerce.date().optional().nullable(),
				isPublic: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Get the max display order
			const existingSponsors = await db.query.athleteSponsorTable.findMany({
				where: eq(athleteSponsorTable.athleteId, athleteProfile.id),
				columns: { displayOrder: true },
			});
			const maxOrder = existingSponsors.reduce(
				(max, s) => Math.max(max, s.displayOrder),
				-1,
			);

			const [sponsor] = await db
				.insert(athleteSponsorTable)
				.values({
					athleteId: athleteProfile.id,
					name: input.name,
					logoKey: input.logoKey,
					website: input.website,
					description: input.description,
					partnershipType: input.partnershipType,
					startDate: input.startDate,
					endDate: input.endDate,
					isPublic: input.isPublic,
					displayOrder: maxOrder + 1,
				})
				.returning();

			if (!sponsor) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create sponsor",
				});
			}

			logger.info(
				{ athleteId: athleteProfile.id, sponsorId: sponsor.id },
				"Athlete added sponsor",
			);

			return sponsor;
		}),

	updateSponsor: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().trim().min(2).max(100).optional(),
				logoKey: z.string().optional().nullable(),
				website: z.string().url().optional().nullable(),
				description: z.string().trim().max(500).optional().nullable(),
				partnershipType: z.string().trim().max(50).optional().nullable(),
				startDate: z.coerce.date().optional().nullable(),
				endDate: z.coerce.date().optional().nullable(),
				isPublic: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Verify ownership
			const existing = await db.query.athleteSponsorTable.findFirst({
				where: and(
					eq(athleteSponsorTable.id, input.id),
					eq(athleteSponsorTable.athleteId, athleteProfile.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor not found",
				});
			}

			const { id, ...updateData } = input;
			const [updated] = await db
				.update(athleteSponsorTable)
				.set({
					...updateData,
					updatedAt: new Date(),
				})
				.where(eq(athleteSponsorTable.id, id))
				.returning();

			logger.info(
				{ athleteId: athleteProfile.id, sponsorId: id },
				"Athlete updated sponsor",
			);

			return updated;
		}),

	deleteSponsor: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Verify ownership and get the sponsor
			const existing = await db.query.athleteSponsorTable.findFirst({
				where: and(
					eq(athleteSponsorTable.id, input.id),
					eq(athleteSponsorTable.athleteId, athleteProfile.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor not found",
				});
			}

			// Delete logo from S3 if exists
			if (existing.logoKey) {
				try {
					await deleteObject(existing.logoKey, getBucketName());
				} catch (error) {
					logger.error(
						{ error, logoKey: existing.logoKey },
						"Failed to delete logo from S3",
					);
				}
			}

			await db
				.delete(athleteSponsorTable)
				.where(eq(athleteSponsorTable.id, input.id));

			logger.info(
				{ athleteId: athleteProfile.id, sponsorId: input.id },
				"Athlete deleted sponsor",
			);

			return { success: true };
		}),

	getSponsorLogoUploadUrl: protectedProcedure
		.input(
			z.object({
				fileName: z.string().min(1),
				contentType: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			const storageKey = generateStorageKey(
				"sponsor-logos",
				athleteProfile.id,
				input.fileName,
			);

			const uploadUrl = await getSignedUploadUrl(storageKey, getBucketName(), {
				contentType: input.contentType,
				expiresIn: 3600, // 1 hour
			});

			return { uploadUrl, fileKey: storageKey };
		}),

	// ============================================================================
	// ACHIEVEMENTS / PALMARÉS (self-managed by athlete)
	// ============================================================================

	listMyAchievements: protectedProcedure.query(async ({ ctx }) => {
		const athleteProfile = await db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, ctx.user.id),
			columns: { id: true },
		});

		if (!athleteProfile) {
			return [];
		}

		const achievements = await db.query.athleteAchievementTable.findMany({
			where: eq(athleteAchievementTable.athleteId, athleteProfile.id),
			orderBy: [
				desc(athleteAchievementTable.year),
				athleteAchievementTable.displayOrder,
			],
		});

		return achievements;
	}),

	addAchievement: protectedProcedure
		.input(
			z.object({
				title: z.string().trim().min(2, "El título es requerido").max(200),
				type: z.nativeEnum(AchievementType),
				scope: z.nativeEnum(AchievementScope),
				year: z.number().int().min(1900).max(2100),
				organization: z.string().trim().max(200).optional().nullable(),
				team: z.string().trim().max(200).optional().nullable(),
				competition: z.string().trim().max(200).optional().nullable(),
				position: z.string().trim().max(100).optional().nullable(),
				description: z.string().trim().max(1000).optional().nullable(),
				isPublic: z.boolean().default(true),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Get the max display order
			const existingAchievements =
				await db.query.athleteAchievementTable.findMany({
					where: eq(athleteAchievementTable.athleteId, athleteProfile.id),
					columns: { displayOrder: true },
				});
			const maxOrder = existingAchievements.reduce(
				(max, a) => Math.max(max, a.displayOrder),
				-1,
			);

			const [achievement] = await db
				.insert(athleteAchievementTable)
				.values({
					athleteId: athleteProfile.id,
					title: input.title,
					type: input.type,
					scope: input.scope,
					year: input.year,
					organization: input.organization,
					team: input.team,
					competition: input.competition,
					position: input.position,
					description: input.description,
					isPublic: input.isPublic,
					displayOrder: maxOrder + 1,
				})
				.returning();

			if (!achievement) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create achievement",
				});
			}

			logger.info(
				{ athleteId: athleteProfile.id, achievementId: achievement.id },
				"Athlete added achievement",
			);

			return achievement;
		}),

	updateAchievement: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				title: z.string().trim().min(2).max(200).optional(),
				type: z.nativeEnum(AchievementType).optional(),
				scope: z.nativeEnum(AchievementScope).optional(),
				year: z.number().int().min(1900).max(2100).optional(),
				organization: z.string().trim().max(200).optional().nullable(),
				team: z.string().trim().max(200).optional().nullable(),
				competition: z.string().trim().max(200).optional().nullable(),
				position: z.string().trim().max(100).optional().nullable(),
				description: z.string().trim().max(1000).optional().nullable(),
				isPublic: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Verify ownership
			const existing = await db.query.athleteAchievementTable.findFirst({
				where: and(
					eq(athleteAchievementTable.id, input.id),
					eq(athleteAchievementTable.athleteId, athleteProfile.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Achievement not found",
				});
			}

			const { id, ...updateData } = input;
			const [updated] = await db
				.update(athleteAchievementTable)
				.set({
					...updateData,
					updatedAt: new Date(),
				})
				.where(eq(athleteAchievementTable.id, id))
				.returning();

			logger.info(
				{ athleteId: athleteProfile.id, achievementId: id },
				"Athlete updated achievement",
			);

			return updated;
		}),

	deleteAchievement: protectedProcedure
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Verify ownership
			const existing = await db.query.athleteAchievementTable.findFirst({
				where: and(
					eq(athleteAchievementTable.id, input.id),
					eq(athleteAchievementTable.athleteId, athleteProfile.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Achievement not found",
				});
			}

			await db
				.delete(athleteAchievementTable)
				.where(eq(athleteAchievementTable.id, input.id));

			logger.info(
				{ athleteId: athleteProfile.id, achievementId: input.id },
				"Athlete deleted achievement",
			);

			return { success: true };
		}),

	reorderAchievements: protectedProcedure
		.input(
			z.object({
				achievementIds: z.array(z.string().uuid()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const athleteProfile = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.userId, ctx.user.id),
				columns: { id: true },
			});

			if (!athleteProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Update display order for each achievement
			await Promise.all(
				input.achievementIds.map((id, index) =>
					db
						.update(athleteAchievementTable)
						.set({ displayOrder: index, updatedAt: new Date() })
						.where(
							and(
								eq(athleteAchievementTable.id, id),
								eq(athleteAchievementTable.athleteId, athleteProfile.id),
							),
						),
				),
			);

			return { success: true };
		}),
});
