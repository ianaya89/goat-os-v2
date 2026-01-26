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
import { MatchStatus } from "@/lib/db/schema/enums";
import { matchTable, teamTable } from "@/lib/db/schema/tables";
import {
	createMatchSchema,
	deleteMatchSchema,
	endMatchSchema,
	getMatchSchema,
	getTeamCalendarSchema,
	listMatchesByTeamSchema,
	listMatchesSchema,
	listRecentMatchesSchema,
	listUpcomingMatchesSchema,
	startMatchSchema,
	updateMatchResultSchema,
	updateMatchSchema,
} from "@/schemas/organization-match-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationMatchRouter = createTRPCRouter({
	list: protectedOrganizationProcedure
		.input(listMatchesSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [eq(matchTable.organizationId, ctx.organization.id)];

			// Search query (opponent name)
			if (input.query) {
				conditions.push(ilike(matchTable.opponentName, `%${input.query}%`));
			}

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(inArray(matchTable.status, input.filters.status));
			}

			// Competition filter
			if (input.filters?.competitionId) {
				conditions.push(
					eq(matchTable.competitionId, input.filters.competitionId),
				);
			}

			// Team filter (home or away)
			if (input.filters?.teamId) {
				conditions.push(
					or(
						eq(matchTable.homeTeamId, input.filters.teamId),
						eq(matchTable.awayTeamId, input.filters.teamId),
					)!,
				);
			}

			// Date range filter
			if (input.filters?.dateFrom) {
				conditions.push(gte(matchTable.scheduledAt, input.filters.dateFrom));
			}
			if (input.filters?.dateTo) {
				conditions.push(lte(matchTable.scheduledAt, input.filters.dateTo));
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "scheduledAt":
					orderByColumn = sortDirection(matchTable.scheduledAt);
					break;
				case "status":
					orderByColumn = sortDirection(matchTable.status);
					break;
				default:
					orderByColumn = sortDirection(matchTable.createdAt);
					break;
			}

			const [matches, countResult] = await Promise.all([
				db.query.matchTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						competition: true,
						homeTeam: true,
						awayTeam: true,
						location: true,
					},
				}),
				db.select({ count: count() }).from(matchTable).where(whereCondition),
			]);

			return { matches, total: countResult[0]?.count ?? 0 };
		}),

	listByTeam: protectedOrganizationProcedure
		.input(listMatchesByTeamSchema)
		.query(async ({ ctx, input }) => {
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

			const conditions = [
				eq(matchTable.organizationId, ctx.organization.id),
				or(
					eq(matchTable.homeTeamId, input.teamId),
					eq(matchTable.awayTeamId, input.teamId),
				)!,
			];

			if (input.status && input.status.length > 0) {
				conditions.push(inArray(matchTable.status, input.status));
			}

			const matches = await db.query.matchTable.findMany({
				where: and(...conditions),
				limit: input.limit,
				offset: input.offset,
				orderBy: desc(matchTable.scheduledAt),
				with: {
					competition: true,
					homeTeam: true,
					awayTeam: true,
					location: true,
				},
			});

			return matches;
		}),

	listUpcoming: protectedOrganizationProcedure
		.input(listUpcomingMatchesSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(matchTable.organizationId, ctx.organization.id),
				eq(matchTable.status, MatchStatus.scheduled),
				gte(matchTable.scheduledAt, new Date()),
			];

			if (input.teamId) {
				conditions.push(
					or(
						eq(matchTable.homeTeamId, input.teamId),
						eq(matchTable.awayTeamId, input.teamId),
					)!,
				);
			}

			const matches = await db.query.matchTable.findMany({
				where: and(...conditions),
				limit: input.limit,
				orderBy: asc(matchTable.scheduledAt),
				with: {
					competition: true,
					homeTeam: true,
					awayTeam: true,
					location: true,
				},
			});

			return matches;
		}),

	listRecent: protectedOrganizationProcedure
		.input(listRecentMatchesSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(matchTable.organizationId, ctx.organization.id),
				eq(matchTable.status, MatchStatus.completed),
			];

			if (input.teamId) {
				conditions.push(
					or(
						eq(matchTable.homeTeamId, input.teamId),
						eq(matchTable.awayTeamId, input.teamId),
					)!,
				);
			}

			const matches = await db.query.matchTable.findMany({
				where: and(...conditions),
				limit: input.limit,
				orderBy: desc(matchTable.scheduledAt),
				with: {
					competition: true,
					homeTeam: true,
					awayTeam: true,
					location: true,
				},
			});

			return matches;
		}),

	get: protectedOrganizationProcedure
		.input(getMatchSchema)
		.query(async ({ ctx, input }) => {
			const match = await db.query.matchTable.findFirst({
				where: and(
					eq(matchTable.id, input.id),
					eq(matchTable.organizationId, ctx.organization.id),
				),
				with: {
					competition: true,
					homeTeam: {
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
					awayTeam: {
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
					location: true,
				},
			});

			if (!match) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Match not found",
				});
			}

			return match;
		}),

	create: protectedOrganizationProcedure
		.input(createMatchSchema)
		.mutation(async ({ ctx, input }) => {
			// Validate teams if provided
			if (input.homeTeamId) {
				const homeTeam = await db.query.teamTable.findFirst({
					where: and(
						eq(teamTable.id, input.homeTeamId),
						eq(teamTable.organizationId, ctx.organization.id),
					),
				});

				if (!homeTeam) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Home team not found in this organization",
					});
				}
			}

			if (input.awayTeamId) {
				const awayTeam = await db.query.teamTable.findFirst({
					where: and(
						eq(teamTable.id, input.awayTeamId),
						eq(teamTable.organizationId, ctx.organization.id),
					),
				});

				if (!awayTeam) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Away team not found in this organization",
					});
				}
			}

			const [match] = await db
				.insert(matchTable)
				.values({
					organizationId: ctx.organization.id,
					competitionId: input.competitionId,
					homeTeamId: input.homeTeamId,
					awayTeamId: input.awayTeamId,
					opponentName: input.opponentName,
					isHomeGame: input.isHomeGame,
					scheduledAt: input.scheduledAt,
					status: input.status,
					venue: input.venue,
					locationId: input.locationId,
					round: input.round,
					matchday: input.matchday,
					referee: input.referee,
					preMatchNotes: input.preMatchNotes,
					createdBy: ctx.user.id,
				})
				.returning();

			return match;
		}),

	update: protectedOrganizationProcedure
		.input(updateMatchSchema)
		.mutation(async ({ ctx, input }) => {
			const match = await db.query.matchTable.findFirst({
				where: and(
					eq(matchTable.id, input.id),
					eq(matchTable.organizationId, ctx.organization.id),
				),
			});

			if (!match) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Match not found",
				});
			}

			const [updated] = await db
				.update(matchTable)
				.set({
					competitionId: input.competitionId,
					homeTeamId: input.homeTeamId,
					awayTeamId: input.awayTeamId,
					opponentName: input.opponentName,
					isHomeGame: input.isHomeGame,
					scheduledAt: input.scheduledAt,
					status: input.status,
					venue: input.venue,
					locationId: input.locationId,
					round: input.round,
					matchday: input.matchday,
					referee: input.referee,
					preMatchNotes: input.preMatchNotes,
					postMatchNotes: input.postMatchNotes,
					highlights: input.highlights,
				})
				.where(eq(matchTable.id, input.id))
				.returning();

			return updated;
		}),

	updateResult: protectedOrganizationProcedure
		.input(updateMatchResultSchema)
		.mutation(async ({ ctx, input }) => {
			const match = await db.query.matchTable.findFirst({
				where: and(
					eq(matchTable.id, input.id),
					eq(matchTable.organizationId, ctx.organization.id),
				),
			});

			if (!match) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Match not found",
				});
			}

			const [updated] = await db
				.update(matchTable)
				.set({
					homeScore: input.homeScore,
					awayScore: input.awayScore,
					homeScoreHT: input.homeScoreHT,
					awayScoreHT: input.awayScoreHT,
					result: input.result,
					attendance: input.attendance,
					postMatchNotes: input.postMatchNotes,
					status: MatchStatus.completed,
					endedAt: new Date(),
				})
				.where(eq(matchTable.id, input.id))
				.returning();

			return updated;
		}),

	startMatch: protectedOrganizationProcedure
		.input(startMatchSchema)
		.mutation(async ({ ctx, input }) => {
			const match = await db.query.matchTable.findFirst({
				where: and(
					eq(matchTable.id, input.id),
					eq(matchTable.organizationId, ctx.organization.id),
				),
			});

			if (!match) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Match not found",
				});
			}

			if (match.status !== MatchStatus.scheduled) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Match is not in scheduled status",
				});
			}

			const [updated] = await db
				.update(matchTable)
				.set({
					status: MatchStatus.inProgress,
					startedAt: new Date(),
				})
				.where(eq(matchTable.id, input.id))
				.returning();

			return updated;
		}),

	endMatch: protectedOrganizationProcedure
		.input(endMatchSchema)
		.mutation(async ({ ctx, input }) => {
			const match = await db.query.matchTable.findFirst({
				where: and(
					eq(matchTable.id, input.id),
					eq(matchTable.organizationId, ctx.organization.id),
				),
			});

			if (!match) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Match not found",
				});
			}

			const [updated] = await db
				.update(matchTable)
				.set({
					status: MatchStatus.completed,
					endedAt: new Date(),
					homeScore: input.homeScore,
					awayScore: input.awayScore,
					result: input.result,
				})
				.where(eq(matchTable.id, input.id))
				.returning();

			return updated;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteMatchSchema)
		.mutation(async ({ ctx, input }) => {
			const match = await db.query.matchTable.findFirst({
				where: and(
					eq(matchTable.id, input.id),
					eq(matchTable.organizationId, ctx.organization.id),
				),
			});

			if (!match) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Match not found",
				});
			}

			await db.delete(matchTable).where(eq(matchTable.id, input.id));

			return { success: true };
		}),

	getTeamCalendar: protectedOrganizationProcedure
		.input(getTeamCalendarSchema)
		.query(async ({ ctx, input }) => {
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

			const matches = await db.query.matchTable.findMany({
				where: and(
					eq(matchTable.organizationId, ctx.organization.id),
					or(
						eq(matchTable.homeTeamId, input.teamId),
						eq(matchTable.awayTeamId, input.teamId),
					)!,
					gte(matchTable.scheduledAt, input.startDate),
					lte(matchTable.scheduledAt, input.endDate),
				),
				orderBy: asc(matchTable.scheduledAt),
				with: {
					competition: true,
					homeTeam: true,
					awayTeam: true,
					location: true,
				},
			});

			return matches;
		}),
});
