import { TRPCError } from "@trpc/server";
import {
	and,
	count,
	desc,
	eq,
	gte,
	ilike,
	isNotNull,
	lte,
	type SQL,
	sql,
} from "drizzle-orm";
import { z } from "zod/v4";
import { appConfig } from "@/config/app.config";
import { db } from "@/lib/db";
import {
	AthleteLevel,
	AthleteOpportunityType,
	AthleteSport,
} from "@/lib/db/schema/enums";
import {
	athleteAchievementTable,
	athleteCareerHistoryTable,
	athleteLanguageTable,
	athleteReferenceTable,
	athleteSponsorTable,
	athleteTable,
	userTable,
} from "@/lib/db/schema/tables";
import { getBucketName, getSignedUrl } from "@/lib/storage/s3";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";

// Schema for listing public athletes with filters
const listPublicAthletesSchema = z.object({
	limit: z
		.number()
		.min(1)
		.max(appConfig.pagination.maxLimit)
		.default(appConfig.pagination.defaultLimit),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	// Filters
	sport: z.nativeEnum(AthleteSport).optional(),
	level: z.nativeEnum(AthleteLevel).optional(),
	country: z.string().optional(),
	position: z.string().optional(),
	ageMin: z.number().int().min(10).max(100).optional(),
	ageMax: z.number().int().min(10).max(100).optional(),
	opportunityTypes: z.array(z.nativeEnum(AthleteOpportunityType)).optional(),
	// Sorting
	sortBy: z.enum(["recent", "name", "level"]).default("recent"),
});

export const publicAthleteRouter = createTRPCRouter({
	/**
	 * Get public athlete profile by athlete ID
	 * Only returns public-safe information
	 */
	getProfile: publicProcedure
		.input(
			z.object({
				athleteId: z.string().uuid(),
			}),
		)
		.query(async ({ input }) => {
			const athlete = await db.query.athleteTable.findFirst({
				where: eq(athleteTable.id, input.athleteId),
				columns: {
					id: true,
					sport: true,
					birthDate: true,
					level: true,
					status: true,
					height: true,
					weight: true,
					dominantFoot: true,
					dominantHand: true,
					nationality: true,
					position: true,
					secondaryPosition: true,
					jerseyNumber: true,
					bio: true,
					yearsOfExperience: true,
					category: true,
					residenceCity: true,
					residenceCountry: true,
					youtubeVideos: true,
					// Education - public
					educationInstitution: true,
					educationYear: true,
					gpa: true,
					// Social media - public
					socialInstagram: true,
					socialTwitter: true,
					socialTiktok: true,
					socialLinkedin: true,
					socialFacebook: true,
					// Cover photo
					coverPhotoKey: true,
					// Public profile settings
					isPublicProfile: true,
					opportunityTypes: true,
					// Exclude private info: phone, parent info, medical info, etc.
				},
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							image: true,
							imageKey: true,
							// Exclude email for privacy
						},
					},
					currentClub: true,
					currentNationalTeam: true,
				},
			});

			if (!athlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Only show active athletes with public profiles
			if (athlete.status !== "active" || !athlete.isPublicProfile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not available",
				});
			}

			// Get career history
			const careerHistory = await db.query.athleteCareerHistoryTable.findMany({
				where: eq(athleteCareerHistoryTable.athleteId, athlete.id),
				orderBy: desc(athleteCareerHistoryTable.startDate),
				columns: {
					id: true,
					startDate: true,
					endDate: true,
					position: true,
					achievements: true,
					// Exclude private notes
				},
				with: {
					club: true,
					nationalTeam: true,
				},
			});

			// Get languages
			const languages = await db.query.athleteLanguageTable.findMany({
				where: eq(athleteLanguageTable.athleteId, athlete.id),
				columns: {
					id: true,
					language: true,
					level: true,
				},
			});

			// Get public references
			const references = await db.query.athleteReferenceTable.findMany({
				where: and(
					eq(athleteReferenceTable.athleteId, athlete.id),
					eq(athleteReferenceTable.isPublic, true),
				),
				orderBy: athleteReferenceTable.displayOrder,
				columns: {
					id: true,
					name: true,
					relationship: true,
					organization: true,
					position: true,
					testimonial: true,
					skillsHighlighted: true,
					isVerified: true,
					// Exclude contact info for privacy
				},
			});

			// Get public sponsors
			const sponsorsRaw = await db.query.athleteSponsorTable.findMany({
				where: and(
					eq(athleteSponsorTable.athleteId, athlete.id),
					eq(athleteSponsorTable.isPublic, true),
				),
				orderBy: athleteSponsorTable.displayOrder,
				columns: {
					id: true,
					name: true,
					logoKey: true,
					website: true,
					description: true,
					partnershipType: true,
					startDate: true,
					endDate: true,
				},
			});

			// Generate signed URLs for sponsor logos
			const sponsors = await Promise.all(
				sponsorsRaw.map(async (sponsor) => {
					let logoUrl: string | null = null;
					if (sponsor.logoKey) {
						try {
							logoUrl = await getSignedUrl(sponsor.logoKey, getBucketName());
						} catch {
							// Ignore errors for sponsor logos
						}
					}
					return {
						...sponsor,
						logoUrl,
					};
				}),
			);

			// Get public achievements
			const achievements = await db.query.athleteAchievementTable.findMany({
				where: and(
					eq(athleteAchievementTable.athleteId, athlete.id),
					eq(athleteAchievementTable.isPublic, true),
				),
				orderBy: [
					desc(athleteAchievementTable.year),
					athleteAchievementTable.displayOrder,
				],
				columns: {
					id: true,
					title: true,
					type: true,
					scope: true,
					year: true,
					organization: true,
					team: true,
					competition: true,
					position: true,
					description: true,
				},
			});

			// Generate signed URL for profile image if stored in S3
			let profileImageUrl: string | null = null;
			if (athlete.user?.imageKey) {
				try {
					profileImageUrl = await getSignedUrl(
						athlete.user.imageKey,
						getBucketName(),
					);
				} catch {
					// Fall back to OAuth image if S3 fails
					profileImageUrl = athlete.user.image;
				}
			} else if (athlete.user?.image) {
				profileImageUrl = athlete.user.image;
			}

			// Generate signed URL for cover photo if exists
			let coverPhotoUrl: string | null = null;
			if (athlete.coverPhotoKey) {
				try {
					coverPhotoUrl = await getSignedUrl(
						athlete.coverPhotoKey,
						getBucketName(),
					);
				} catch {
					// Ignore errors for cover photo
				}
			}

			return {
				athlete: {
					...athlete,
					coverPhotoUrl,
					user: athlete.user
						? {
								...athlete.user,
								image: profileImageUrl,
							}
						: null,
				},
				careerHistory,
				languages,
				references,
				sponsors,
				achievements,
			};
		}),

	/**
	 * Get public athlete profile by user slug (for vanity URLs in the future)
	 */
	getProfileByUserId: publicProcedure
		.input(
			z.object({
				userId: z.string().uuid(),
			}),
		)
		.query(async ({ input }) => {
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.userId, input.userId),
					eq(athleteTable.status, "active"),
					eq(athleteTable.isPublicProfile, true),
				),
				columns: {
					id: true,
					sport: true,
					birthDate: true,
					level: true,
					status: true,
					height: true,
					weight: true,
					dominantFoot: true,
					dominantHand: true,
					nationality: true,
					position: true,
					secondaryPosition: true,
					jerseyNumber: true,
					bio: true,
					yearsOfExperience: true,
					category: true,
					residenceCity: true,
					residenceCountry: true,
					youtubeVideos: true,
					educationInstitution: true,
					educationYear: true,
					gpa: true,
					// Social media - public
					socialInstagram: true,
					socialTwitter: true,
					socialTiktok: true,
					socialLinkedin: true,
					socialFacebook: true,
					coverPhotoKey: true,
					isPublicProfile: true,
					opportunityTypes: true,
				},
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							image: true,
							imageKey: true,
						},
					},
					currentClub: true,
					currentNationalTeam: true,
				},
			});

			if (!athlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete profile not found",
				});
			}

			// Get career history
			const careerHistory = await db.query.athleteCareerHistoryTable.findMany({
				where: eq(athleteCareerHistoryTable.athleteId, athlete.id),
				orderBy: desc(athleteCareerHistoryTable.startDate),
				columns: {
					id: true,
					startDate: true,
					endDate: true,
					position: true,
					achievements: true,
				},
				with: {
					club: true,
					nationalTeam: true,
				},
			});

			// Get languages
			const languages = await db.query.athleteLanguageTable.findMany({
				where: eq(athleteLanguageTable.athleteId, athlete.id),
				columns: {
					id: true,
					language: true,
					level: true,
				},
			});

			// Get public references
			const references = await db.query.athleteReferenceTable.findMany({
				where: and(
					eq(athleteReferenceTable.athleteId, athlete.id),
					eq(athleteReferenceTable.isPublic, true),
				),
				orderBy: athleteReferenceTable.displayOrder,
				columns: {
					id: true,
					name: true,
					relationship: true,
					organization: true,
					position: true,
					testimonial: true,
					skillsHighlighted: true,
					isVerified: true,
				},
			});

			// Get public sponsors
			const sponsorsRaw = await db.query.athleteSponsorTable.findMany({
				where: and(
					eq(athleteSponsorTable.athleteId, athlete.id),
					eq(athleteSponsorTable.isPublic, true),
				),
				orderBy: athleteSponsorTable.displayOrder,
				columns: {
					id: true,
					name: true,
					logoKey: true,
					website: true,
					description: true,
					partnershipType: true,
					startDate: true,
					endDate: true,
				},
			});

			// Generate signed URLs for sponsor logos
			const sponsors = await Promise.all(
				sponsorsRaw.map(async (sponsor) => {
					let logoUrl: string | null = null;
					if (sponsor.logoKey) {
						try {
							logoUrl = await getSignedUrl(sponsor.logoKey, getBucketName());
						} catch {
							// Ignore errors for sponsor logos
						}
					}
					return {
						...sponsor,
						logoUrl,
					};
				}),
			);

			// Get public achievements
			const achievements = await db.query.athleteAchievementTable.findMany({
				where: and(
					eq(athleteAchievementTable.athleteId, athlete.id),
					eq(athleteAchievementTable.isPublic, true),
				),
				orderBy: [
					desc(athleteAchievementTable.year),
					athleteAchievementTable.displayOrder,
				],
				columns: {
					id: true,
					title: true,
					type: true,
					scope: true,
					year: true,
					organization: true,
					team: true,
					competition: true,
					position: true,
					description: true,
				},
			});

			// Generate signed URL for profile image if stored in S3
			let profileImageUrl: string | null = null;
			if (athlete.user?.imageKey) {
				try {
					profileImageUrl = await getSignedUrl(
						athlete.user.imageKey,
						getBucketName(),
					);
				} catch {
					profileImageUrl = athlete.user.image;
				}
			} else if (athlete.user?.image) {
				profileImageUrl = athlete.user.image;
			}

			// Generate signed URL for cover photo if exists
			let coverPhotoUrl: string | null = null;
			if (athlete.coverPhotoKey) {
				try {
					coverPhotoUrl = await getSignedUrl(
						athlete.coverPhotoKey,
						getBucketName(),
					);
				} catch {
					// Ignore errors for cover photo
				}
			}

			return {
				athlete: {
					...athlete,
					coverPhotoUrl,
					user: athlete.user
						? {
								...athlete.user,
								image: profileImageUrl,
							}
						: null,
				},
				careerHistory,
				languages,
				references,
				sponsors,
				achievements,
			};
		}),

	/**
	 * List public athletes with filters
	 * For the public athletes search page
	 */
	list: publicProcedure
		.input(listPublicAthletesSchema)
		.query(async ({ input }) => {
			const conditions: SQL[] = [
				eq(athleteTable.isPublicProfile, true),
				eq(athleteTable.status, "active"),
				isNotNull(athleteTable.userId),
			];

			// Sport filter
			if (input.sport) {
				conditions.push(eq(athleteTable.sport, input.sport));
			}

			// Level filter
			if (input.level) {
				conditions.push(eq(athleteTable.level, input.level));
			}

			// Country filter
			if (input.country) {
				conditions.push(eq(athleteTable.residenceCountry, input.country));
			}

			// Position filter
			if (input.position) {
				conditions.push(ilike(athleteTable.position, `%${input.position}%`));
			}

			// Age range filter (based on birth date)
			const now = new Date();
			if (input.ageMax) {
				const minBirthDate = new Date(
					now.getFullYear() - input.ageMax - 1,
					now.getMonth(),
					now.getDate(),
				);
				conditions.push(gte(athleteTable.birthDate, minBirthDate));
			}
			if (input.ageMin) {
				const maxBirthDate = new Date(
					now.getFullYear() - input.ageMin,
					now.getMonth(),
					now.getDate(),
				);
				conditions.push(lte(athleteTable.birthDate, maxBirthDate));
			}

			// Opportunity types filter (JSONB array contains any)
			if (input.opportunityTypes && input.opportunityTypes.length > 0) {
				conditions.push(
					sql`${athleteTable.opportunityTypes} ?| array[${sql.join(
						input.opportunityTypes.map((t) => sql`${t}`),
						sql`, `,
					)}]`,
				);
			}

			// Get total count
			const [countResult] = await db
				.select({ count: count() })
				.from(athleteTable)
				.where(and(...conditions));

			// Build the query with user join for name search
			const athletesQuery = db.query.athleteTable.findMany({
				where: and(...conditions),
				limit: input.limit,
				offset: input.offset,
				orderBy:
					input.sortBy === "recent"
						? desc(athleteTable.publicProfileEnabledAt)
						: desc(athleteTable.createdAt),
				columns: {
					id: true,
					sport: true,
					level: true,
					position: true,
					nationality: true,
					residenceCountry: true,
					birthDate: true,
					yearsOfExperience: true,
					opportunityTypes: true,
					publicProfileEnabledAt: true,
				},
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							image: true,
							imageKey: true,
						},
					},
					currentClub: true,
				},
			});

			const athletes = await athletesQuery;

			// Filter by name search if provided (post-query because name is on user table)
			let filteredAthletes = athletes;
			if (input.query?.trim()) {
				const searchLower = input.query.trim().toLowerCase();
				filteredAthletes = athletes.filter((a) =>
					a.user?.name?.toLowerCase().includes(searchLower),
				);
			}

			// Generate signed URLs for profile images
			const athletesWithImages = await Promise.all(
				filteredAthletes.map(async (athlete) => {
					let profileImageUrl: string | null = null;
					if (athlete.user?.imageKey) {
						try {
							profileImageUrl = await getSignedUrl(
								athlete.user.imageKey,
								getBucketName(),
							);
						} catch {
							profileImageUrl = athlete.user.image;
						}
					} else if (athlete.user?.image) {
						profileImageUrl = athlete.user.image;
					}

					return {
						...athlete,
						user: athlete.user
							? { ...athlete.user, image: profileImageUrl }
							: null,
					};
				}),
			);

			return {
				athletes: athletesWithImages,
				total: countResult?.count ?? 0,
			};
		}),
});
