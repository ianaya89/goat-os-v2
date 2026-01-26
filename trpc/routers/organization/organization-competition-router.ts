import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
	or,
	type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	competitionTable,
	teamCompetitionTable,
	teamTable,
} from "@/lib/db/schema/tables";
import {
	createCompetitionSchema,
	deleteCompetitionSchema,
	getCompetitionSchema,
	getCompetitionStandingsSchema,
	listCompetitionsSchema,
	registerTeamToCompetitionSchema,
	updateCompetitionSchema,
	updateTeamCompetitionSchema,
	updateTeamCompetitionStatsSchema,
	withdrawTeamFromCompetitionSchema,
} from "@/schemas/organization-competition-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationCompetitionRouter = createTRPCRouter({
	list: protectedOrganizationProcedure
		.input(listCompetitionsSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(competitionTable.organizationId, ctx.organization.id),
			];

			// Search query
			if (input.query) {
				conditions.push(
					or(
						ilike(competitionTable.name, `%${input.query}%`),
						ilike(competitionTable.description, `%${input.query}%`),
					)!,
				);
			}

			// Type filter
			if (input.filters?.type && input.filters.type.length > 0) {
				conditions.push(inArray(competitionTable.type, input.filters.type));
			}

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(inArray(competitionTable.status, input.filters.status));
			}

			// Sport filter
			if (input.filters?.sport && input.filters.sport.length > 0) {
				conditions.push(inArray(competitionTable.sport, input.filters.sport));
			}

			// Season filter
			if (input.filters?.seasonId !== undefined) {
				if (input.filters.seasonId === null) {
					conditions.push(isNull(competitionTable.seasonId));
				} else {
					conditions.push(
						eq(competitionTable.seasonId, input.filters.seasonId),
					);
				}
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "name":
					orderByColumn = sortDirection(competitionTable.name);
					break;
				case "type":
					orderByColumn = sortDirection(competitionTable.type);
					break;
				case "status":
					orderByColumn = sortDirection(competitionTable.status);
					break;
				case "startDate":
					orderByColumn = sortDirection(competitionTable.startDate);
					break;
				default:
					orderByColumn = sortDirection(competitionTable.createdAt);
					break;
			}

			const [competitions, countResult] = await Promise.all([
				db.query.competitionTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						season: true,
						teams: {
							with: {
								team: true,
							},
						},
					},
				}),
				db
					.select({ count: count() })
					.from(competitionTable)
					.where(whereCondition),
			]);

			const competitionsWithCount = competitions.map((competition) => ({
				...competition,
				teamCount: competition.teams.length,
			}));

			return {
				competitions: competitionsWithCount,
				total: countResult[0]?.count ?? 0,
			};
		}),

	get: protectedOrganizationProcedure
		.input(getCompetitionSchema)
		.query(async ({ ctx, input }) => {
			const competition = await db.query.competitionTable.findFirst({
				where: and(
					eq(competitionTable.id, input.id),
					eq(competitionTable.organizationId, ctx.organization.id),
				),
				with: {
					season: true,
					teams: {
						with: {
							team: {
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
						},
					},
					matches: {
						with: {
							homeTeam: true,
							awayTeam: true,
						},
						orderBy: desc(competitionTable.createdAt),
					},
				},
			});

			if (!competition) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			return competition;
		}),

	listActive: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const competitions = await db.query.competitionTable.findMany({
			where: and(
				eq(competitionTable.organizationId, ctx.organization.id),
				inArray(competitionTable.status, ["upcoming", "in_progress"]),
			),
			orderBy: asc(competitionTable.startDate),
			with: {
				season: true,
			},
		});

		return competitions;
	}),

	create: protectedOrganizationProcedure
		.input(createCompetitionSchema)
		.mutation(async ({ ctx, input }) => {
			const [competition] = await db
				.insert(competitionTable)
				.values({
					organizationId: ctx.organization.id,
					name: input.name,
					description: input.description,
					type: input.type,
					sport: input.sport,
					seasonId: input.seasonId,
					startDate: input.startDate,
					endDate: input.endDate,
					status: input.status,
					logoKey: input.logoKey,
					externalId: input.externalId,
					venue: input.venue,
					rules: input.rules,
					createdBy: ctx.user.id,
				})
				.returning();

			return competition;
		}),

	update: protectedOrganizationProcedure
		.input(updateCompetitionSchema)
		.mutation(async ({ ctx, input }) => {
			const competition = await db.query.competitionTable.findFirst({
				where: and(
					eq(competitionTable.id, input.id),
					eq(competitionTable.organizationId, ctx.organization.id),
				),
			});

			if (!competition) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			const [updated] = await db
				.update(competitionTable)
				.set({
					name: input.name,
					description: input.description,
					type: input.type,
					sport: input.sport,
					seasonId: input.seasonId,
					startDate: input.startDate,
					endDate: input.endDate,
					status: input.status,
					logoKey: input.logoKey,
					externalId: input.externalId,
					venue: input.venue,
					rules: input.rules,
				})
				.where(eq(competitionTable.id, input.id))
				.returning();

			return updated;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteCompetitionSchema)
		.mutation(async ({ ctx, input }) => {
			const competition = await db.query.competitionTable.findFirst({
				where: and(
					eq(competitionTable.id, input.id),
					eq(competitionTable.organizationId, ctx.organization.id),
				),
			});

			if (!competition) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			await db
				.delete(competitionTable)
				.where(eq(competitionTable.id, input.id));

			return { success: true };
		}),

	// ============================================================================
	// TEAM COMPETITION (REGISTRATION)
	// ============================================================================

	registerTeam: protectedOrganizationProcedure
		.input(registerTeamToCompetitionSchema)
		.mutation(async ({ ctx, input }) => {
			// Validate competition
			const competition = await db.query.competitionTable.findFirst({
				where: and(
					eq(competitionTable.id, input.competitionId),
					eq(competitionTable.organizationId, ctx.organization.id),
				),
			});

			if (!competition) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			// Validate team
			const team = await db.query.teamTable.findFirst({
				where: and(
					eq(teamTable.id, input.teamId),
					eq(teamTable.organizationId, ctx.organization.id),
				),
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			// Check if already registered
			const existing = await db.query.teamCompetitionTable.findFirst({
				where: and(
					eq(teamCompetitionTable.teamId, input.teamId),
					eq(teamCompetitionTable.competitionId, input.competitionId),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Team is already registered in this competition",
				});
			}

			const [registration] = await db
				.insert(teamCompetitionTable)
				.values({
					teamId: input.teamId,
					competitionId: input.competitionId,
					division: input.division,
					seedPosition: input.seedPosition,
				})
				.returning();

			return registration;
		}),

	withdrawTeam: protectedOrganizationProcedure
		.input(withdrawTeamFromCompetitionSchema)
		.mutation(async ({ ctx, input }) => {
			// Validate team belongs to org
			const team = await db.query.teamTable.findFirst({
				where: and(
					eq(teamTable.id, input.teamId),
					eq(teamTable.organizationId, ctx.organization.id),
				),
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			await db
				.delete(teamCompetitionTable)
				.where(
					and(
						eq(teamCompetitionTable.teamId, input.teamId),
						eq(teamCompetitionTable.competitionId, input.competitionId),
					),
				);

			return { success: true };
		}),

	updateTeamRegistration: protectedOrganizationProcedure
		.input(updateTeamCompetitionSchema)
		.mutation(async ({ ctx, input }) => {
			const registration = await db.query.teamCompetitionTable.findFirst({
				where: eq(teamCompetitionTable.id, input.id),
				with: {
					team: true,
				},
			});

			if (
				!registration ||
				registration.team.organizationId !== ctx.organization.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Registration not found",
				});
			}

			const [updated] = await db
				.update(teamCompetitionTable)
				.set({
					status: input.status,
					division: input.division,
					seedPosition: input.seedPosition,
					finalPosition: input.finalPosition,
					notes: input.notes,
				})
				.where(eq(teamCompetitionTable.id, input.id))
				.returning();

			return updated;
		}),

	updateTeamStats: protectedOrganizationProcedure
		.input(updateTeamCompetitionStatsSchema)
		.mutation(async ({ ctx, input }) => {
			const registration = await db.query.teamCompetitionTable.findFirst({
				where: eq(teamCompetitionTable.id, input.id),
				with: {
					team: true,
				},
			});

			if (
				!registration ||
				registration.team.organizationId !== ctx.organization.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Registration not found",
				});
			}

			const [updated] = await db
				.update(teamCompetitionTable)
				.set({
					points: input.points,
					wins: input.wins,
					draws: input.draws,
					losses: input.losses,
					goalsFor: input.goalsFor,
					goalsAgainst: input.goalsAgainst,
				})
				.where(eq(teamCompetitionTable.id, input.id))
				.returning();

			return updated;
		}),

	getStandings: protectedOrganizationProcedure
		.input(getCompetitionStandingsSchema)
		.query(async ({ ctx, input }) => {
			// Validate competition
			const competition = await db.query.competitionTable.findFirst({
				where: and(
					eq(competitionTable.id, input.competitionId),
					eq(competitionTable.organizationId, ctx.organization.id),
				),
			});

			if (!competition) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Competition not found",
				});
			}

			const conditions = [
				eq(teamCompetitionTable.competitionId, input.competitionId),
			];

			if (input.division) {
				conditions.push(eq(teamCompetitionTable.division, input.division));
			}

			const standings = await db.query.teamCompetitionTable.findMany({
				where: and(...conditions),
				with: {
					team: true,
				},
				orderBy: [
					desc(teamCompetitionTable.points),
					desc(teamCompetitionTable.wins),
				],
			});

			// Calculate goal difference and add position
			const standingsWithPosition = standings.map((s, index) => ({
				...s,
				position: index + 1,
				goalDifference: (s.goalsFor ?? 0) - (s.goalsAgainst ?? 0),
				played: (s.wins ?? 0) + (s.draws ?? 0) + (s.losses ?? 0),
			}));

			return standingsWithPosition;
		}),
});
