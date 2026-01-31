import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clubTable, nationalTeamTable } from "@/lib/db/schema/tables";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
	deleteObject,
	generateStorageKey,
	getSignedUploadUrl,
	getSignedUrl,
} from "@/lib/storage/s3";
import {
	bulkDeleteClubsSchema,
	bulkDeleteNationalTeamsSchema,
	createClubSchema,
	createNationalTeamSchema,
	deleteClubLogoSchema,
	deleteClubSchema,
	deleteNationalTeamLogoSchema,
	deleteNationalTeamSchema,
	getClubLogoDownloadUrlSchema,
	getClubLogoUploadUrlSchema,
	getNationalTeamLogoDownloadUrlSchema,
	getNationalTeamLogoUploadUrlSchema,
	listInstitutionsSchema,
	updateClubLogoSchema,
	updateClubSchema,
	updateNationalTeamLogoSchema,
	updateNationalTeamSchema,
} from "@/schemas/organization-institution-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationInstitutionRouter = createTRPCRouter({
	// =========================================================================
	// LIST
	// =========================================================================

	list: protectedOrganizationProcedure
		.input(listInstitutionsSchema)
		.query(async ({ ctx, input }) => {
			const bucket = env.S3_BUCKET;

			const results: Array<{
				id: string;
				type: "club" | "nationalTeam";
				name: string;
				country: string | null;
				city: string | null;
				category: string | null;
				shortName: string | null;
				website: string | null;
				notes: string | null;
				logoKey: string | null;
				logoUrl: string | null;
				createdAt: Date;
			}> = [];

			// Fetch clubs
			if (input.type === "all" || input.type === "club") {
				const clubs = await db.query.clubTable.findMany({
					where: eq(clubTable.organizationId, ctx.organization.id),
					orderBy: asc(clubTable.name),
				});

				for (const club of clubs) {
					let logoUrl: string | null = null;
					if (club.logoKey && bucket) {
						try {
							logoUrl = await getSignedUrl(club.logoKey, bucket, {
								expiresIn: 3600,
							});
						} catch {
							// Ignore errors
						}
					}

					results.push({
						id: club.id,
						type: "club",
						name: club.name,
						country: club.country,
						city: club.city,
						category: null,
						shortName: club.shortName,
						website: club.website,
						notes: club.notes,
						logoKey: club.logoKey,
						logoUrl,
						createdAt: club.createdAt,
					});
				}
			}

			// Fetch national teams
			if (input.type === "all" || input.type === "nationalTeam") {
				const nationalTeams = await db.query.nationalTeamTable.findMany({
					where: eq(nationalTeamTable.organizationId, ctx.organization.id),
					orderBy: asc(nationalTeamTable.name),
				});

				for (const team of nationalTeams) {
					let logoUrl: string | null = null;
					if (team.logoKey && bucket) {
						try {
							logoUrl = await getSignedUrl(team.logoKey, bucket, {
								expiresIn: 3600,
							});
						} catch {
							// Ignore errors
						}
					}

					results.push({
						id: team.id,
						type: "nationalTeam",
						name: team.name,
						country: team.country,
						city: null,
						category: team.category,
						shortName: null,
						website: null,
						notes: team.notes,
						logoKey: team.logoKey,
						logoUrl,
						createdAt: team.createdAt,
					});
				}
			}

			// Sort by name
			return results.sort((a, b) => a.name.localeCompare(b.name));
		}),

	// =========================================================================
	// CLUBS - CREATE
	// =========================================================================

	createClub: protectedOrganizationProcedure
		.input(createClubSchema)
		.mutation(async ({ ctx, input }) => {
			// Check for duplicates
			const existing = await db.query.clubTable.findFirst({
				where: and(
					eq(clubTable.organizationId, ctx.organization.id),
					eq(clubTable.name, input.name),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Ya existe un club con este nombre",
				});
			}

			const [club] = await db
				.insert(clubTable)
				.values({
					organizationId: ctx.organization.id,
					name: input.name,
					shortName: input.shortName || null,
					country: input.country || null,
					city: input.city || null,
					website: input.website || null,
					notes: input.notes || null,
				})
				.returning();

			logger.info(
				{
					organizationId: ctx.organization.id,
					clubId: club?.id,
					userId: ctx.user.id,
				},
				"Club created",
			);

			return club;
		}),

	// =========================================================================
	// CLUBS - UPDATE
	// =========================================================================

	updateClub: protectedOrganizationProcedure
		.input(updateClubSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Verify the club exists and belongs to this organization
			const existing = await db.query.clubTable.findFirst({
				where: and(
					eq(clubTable.id, id),
					eq(clubTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Club no encontrado",
				});
			}

			// Check for name duplicates if name is being updated
			if (data.name && data.name !== existing.name) {
				const duplicate = await db.query.clubTable.findFirst({
					where: and(
						eq(clubTable.organizationId, ctx.organization.id),
						eq(clubTable.name, data.name),
					),
				});

				if (duplicate) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Ya existe un club con este nombre",
					});
				}
			}

			const [updated] = await db
				.update(clubTable)
				.set({
					...data,
					website: data.website === "" ? null : data.website,
					updatedAt: new Date(),
				})
				.where(eq(clubTable.id, id))
				.returning();

			logger.info(
				{
					organizationId: ctx.organization.id,
					clubId: id,
					userId: ctx.user.id,
				},
				"Club updated",
			);

			return updated;
		}),

	// =========================================================================
	// CLUBS - DELETE
	// =========================================================================

	deleteClub: protectedOrganizationProcedure
		.input(deleteClubSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the club exists and belongs to this organization
			const existing = await db.query.clubTable.findFirst({
				where: and(
					eq(clubTable.id, input.id),
					eq(clubTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Club no encontrado",
				});
			}

			await db.delete(clubTable).where(eq(clubTable.id, input.id));

			logger.info(
				{
					organizationId: ctx.organization.id,
					clubId: input.id,
					userId: ctx.user.id,
				},
				"Club deleted",
			);

			return { success: true };
		}),

	// =========================================================================
	// NATIONAL TEAMS - CREATE
	// =========================================================================

	createNationalTeam: protectedOrganizationProcedure
		.input(createNationalTeamSchema)
		.mutation(async ({ ctx, input }) => {
			// Check for duplicates (same country + category)
			const existing = await db.query.nationalTeamTable.findFirst({
				where: and(
					eq(nationalTeamTable.organizationId, ctx.organization.id),
					eq(nationalTeamTable.country, input.country),
					input.category
						? eq(nationalTeamTable.category, input.category)
						: undefined,
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Ya existe una selección con este país y categoría",
				});
			}

			const [team] = await db
				.insert(nationalTeamTable)
				.values({
					organizationId: ctx.organization.id,
					name: input.name,
					country: input.country,
					category: input.category || null,
					notes: input.notes || null,
				})
				.returning();

			logger.info(
				{
					organizationId: ctx.organization.id,
					nationalTeamId: team?.id,
					userId: ctx.user.id,
				},
				"National team created",
			);

			return team;
		}),

	// =========================================================================
	// NATIONAL TEAMS - UPDATE
	// =========================================================================

	updateNationalTeam: protectedOrganizationProcedure
		.input(updateNationalTeamSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Verify the team exists and belongs to this organization
			const existing = await db.query.nationalTeamTable.findFirst({
				where: and(
					eq(nationalTeamTable.id, id),
					eq(nationalTeamTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Selección no encontrada",
				});
			}

			const [updated] = await db
				.update(nationalTeamTable)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(nationalTeamTable.id, id))
				.returning();

			logger.info(
				{
					organizationId: ctx.organization.id,
					nationalTeamId: id,
					userId: ctx.user.id,
				},
				"National team updated",
			);

			return updated;
		}),

	// =========================================================================
	// NATIONAL TEAMS - DELETE
	// =========================================================================

	deleteNationalTeam: protectedOrganizationProcedure
		.input(deleteNationalTeamSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the team exists and belongs to this organization
			const existing = await db.query.nationalTeamTable.findFirst({
				where: and(
					eq(nationalTeamTable.id, input.id),
					eq(nationalTeamTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Selección no encontrada",
				});
			}

			await db
				.delete(nationalTeamTable)
				.where(eq(nationalTeamTable.id, input.id));

			logger.info(
				{
					organizationId: ctx.organization.id,
					nationalTeamId: input.id,
					userId: ctx.user.id,
				},
				"National team deleted",
			);

			return { success: true };
		}),

	// =========================================================================
	// CLUB LOGO ENDPOINTS
	// =========================================================================

	getClubLogoUploadUrl: protectedOrganizationProcedure
		.input(getClubLogoUploadUrlSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify club belongs to organization
			const club = await db.query.clubTable.findFirst({
				where: and(
					eq(clubTable.id, input.clubId),
					eq(clubTable.organizationId, ctx.organization.id),
				),
			});

			if (!club) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Club no encontrado",
				});
			}

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			const key = generateStorageKey(
				"club-logos",
				ctx.organization.id,
				input.filename,
			);

			const uploadUrl = await getSignedUploadUrl(key, bucket, {
				contentType: input.contentType,
				expiresIn: 300, // 5 minutes
			});

			return { uploadUrl, key };
		}),

	updateClubLogo: protectedOrganizationProcedure
		.input(updateClubLogoSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify club belongs to organization
			const club = await db.query.clubTable.findFirst({
				where: and(
					eq(clubTable.id, input.clubId),
					eq(clubTable.organizationId, ctx.organization.id),
				),
			});

			if (!club) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Club no encontrado",
				});
			}

			// Delete old logo if exists
			if (club.logoKey) {
				const bucket = env.S3_BUCKET;
				if (bucket) {
					try {
						await deleteObject(club.logoKey, bucket);
					} catch {
						// Ignore delete errors
					}
				}
			}

			await db
				.update(clubTable)
				.set({ logoKey: input.logoKey, updatedAt: new Date() })
				.where(eq(clubTable.id, input.clubId));

			logger.info(
				{
					organizationId: ctx.organization.id,
					clubId: input.clubId,
					userId: ctx.user.id,
				},
				"Club logo updated",
			);

			return { success: true };
		}),

	deleteClubLogo: protectedOrganizationProcedure
		.input(deleteClubLogoSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify club belongs to organization
			const club = await db.query.clubTable.findFirst({
				where: and(
					eq(clubTable.id, input.clubId),
					eq(clubTable.organizationId, ctx.organization.id),
				),
			});

			if (!club) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Club no encontrado",
				});
			}

			if (!club.logoKey) {
				return { success: true };
			}

			const bucket = env.S3_BUCKET;
			if (bucket) {
				try {
					await deleteObject(club.logoKey, bucket);
				} catch {
					// Ignore delete errors
				}
			}

			await db
				.update(clubTable)
				.set({ logoKey: null, updatedAt: new Date() })
				.where(eq(clubTable.id, input.clubId));

			logger.info(
				{
					organizationId: ctx.organization.id,
					clubId: input.clubId,
					userId: ctx.user.id,
				},
				"Club logo deleted",
			);

			return { success: true };
		}),

	getClubLogoDownloadUrl: protectedOrganizationProcedure
		.input(getClubLogoDownloadUrlSchema)
		.query(async ({ ctx, input }) => {
			const club = await db.query.clubTable.findFirst({
				where: and(
					eq(clubTable.id, input.clubId),
					eq(clubTable.organizationId, ctx.organization.id),
				),
			});

			if (!club) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Club no encontrado",
				});
			}

			if (!club.logoKey) {
				return { downloadUrl: null };
			}

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			const downloadUrl = await getSignedUrl(club.logoKey, bucket, {
				expiresIn: 3600,
			});

			return { downloadUrl };
		}),

	// =========================================================================
	// NATIONAL TEAM LOGO ENDPOINTS
	// =========================================================================

	getNationalTeamLogoUploadUrl: protectedOrganizationProcedure
		.input(getNationalTeamLogoUploadUrlSchema)
		.mutation(async ({ ctx, input }) => {
			const team = await db.query.nationalTeamTable.findFirst({
				where: and(
					eq(nationalTeamTable.id, input.nationalTeamId),
					eq(nationalTeamTable.organizationId, ctx.organization.id),
				),
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Selección no encontrada",
				});
			}

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			const key = generateStorageKey(
				"national-team-logos",
				ctx.organization.id,
				input.filename,
			);

			const uploadUrl = await getSignedUploadUrl(key, bucket, {
				contentType: input.contentType,
				expiresIn: 300,
			});

			return { uploadUrl, key };
		}),

	updateNationalTeamLogo: protectedOrganizationProcedure
		.input(updateNationalTeamLogoSchema)
		.mutation(async ({ ctx, input }) => {
			const team = await db.query.nationalTeamTable.findFirst({
				where: and(
					eq(nationalTeamTable.id, input.nationalTeamId),
					eq(nationalTeamTable.organizationId, ctx.organization.id),
				),
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Selección no encontrada",
				});
			}

			// Delete old logo if exists
			if (team.logoKey) {
				const bucket = env.S3_BUCKET;
				if (bucket) {
					try {
						await deleteObject(team.logoKey, bucket);
					} catch {
						// Ignore delete errors
					}
				}
			}

			await db
				.update(nationalTeamTable)
				.set({ logoKey: input.logoKey, updatedAt: new Date() })
				.where(eq(nationalTeamTable.id, input.nationalTeamId));

			logger.info(
				{
					organizationId: ctx.organization.id,
					nationalTeamId: input.nationalTeamId,
					userId: ctx.user.id,
				},
				"National team logo updated",
			);

			return { success: true };
		}),

	deleteNationalTeamLogo: protectedOrganizationProcedure
		.input(deleteNationalTeamLogoSchema)
		.mutation(async ({ ctx, input }) => {
			const team = await db.query.nationalTeamTable.findFirst({
				where: and(
					eq(nationalTeamTable.id, input.nationalTeamId),
					eq(nationalTeamTable.organizationId, ctx.organization.id),
				),
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Selección no encontrada",
				});
			}

			if (!team.logoKey) {
				return { success: true };
			}

			const bucket = env.S3_BUCKET;
			if (bucket) {
				try {
					await deleteObject(team.logoKey, bucket);
				} catch {
					// Ignore delete errors
				}
			}

			await db
				.update(nationalTeamTable)
				.set({ logoKey: null, updatedAt: new Date() })
				.where(eq(nationalTeamTable.id, input.nationalTeamId));

			logger.info(
				{
					organizationId: ctx.organization.id,
					nationalTeamId: input.nationalTeamId,
					userId: ctx.user.id,
				},
				"National team logo deleted",
			);

			return { success: true };
		}),

	getNationalTeamLogoDownloadUrl: protectedOrganizationProcedure
		.input(getNationalTeamLogoDownloadUrlSchema)
		.query(async ({ ctx, input }) => {
			const team = await db.query.nationalTeamTable.findFirst({
				where: and(
					eq(nationalTeamTable.id, input.nationalTeamId),
					eq(nationalTeamTable.organizationId, ctx.organization.id),
				),
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Selección no encontrada",
				});
			}

			if (!team.logoKey) {
				return { downloadUrl: null };
			}

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			const downloadUrl = await getSignedUrl(team.logoKey, bucket, {
				expiresIn: 3600,
			});

			return { downloadUrl };
		}),

	// =========================================================================
	// BULK DELETE CLUBS
	// =========================================================================

	bulkDeleteClubs: protectedOrganizationProcedure
		.input(bulkDeleteClubsSchema)
		.mutation(async ({ ctx, input }) => {
			const deleted = await db
				.delete(clubTable)
				.where(
					and(
						inArray(clubTable.id, input.ids),
						eq(clubTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: clubTable.id });

			logger.info(
				{
					organizationId: ctx.organization.id,
					deletedCount: deleted.length,
					userId: ctx.user.id,
				},
				"Clubs bulk deleted",
			);

			return { success: true, count: deleted.length };
		}),

	// =========================================================================
	// BULK DELETE NATIONAL TEAMS
	// =========================================================================

	bulkDeleteNationalTeams: protectedOrganizationProcedure
		.input(bulkDeleteNationalTeamsSchema)
		.mutation(async ({ ctx, input }) => {
			const deleted = await db
				.delete(nationalTeamTable)
				.where(
					and(
						inArray(nationalTeamTable.id, input.ids),
						eq(nationalTeamTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: nationalTeamTable.id });

			logger.info(
				{
					organizationId: ctx.organization.id,
					deletedCount: deleted.length,
					userId: ctx.user.id,
				},
				"National teams bulk deleted",
			);

			return { success: true, count: deleted.length };
		}),
});
