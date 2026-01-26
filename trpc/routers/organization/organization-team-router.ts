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
	ne,
	or,
	type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	athleteTable,
	coachTable,
	teamMemberTable,
	teamStaffTable,
	teamTable,
	userTable,
} from "@/lib/db/schema/tables";
import {
	addTeamMembersSchema,
	addTeamStaffSchema,
	bulkDeleteTeamsSchema,
	bulkUpdateTeamsStatusSchema,
	createTeamSchema,
	deleteTeamSchema,
	getTeamSchema,
	listTeamsByAthleteSchema,
	listTeamsSchema,
	removeTeamMembersSchema,
	removeTeamStaffSchema,
	setTeamMembersSchema,
	updateTeamMemberSchema,
	updateTeamSchema,
	updateTeamStaffSchema,
} from "@/schemas/organization-team-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationTeamRouter = createTRPCRouter({
	list: protectedOrganizationProcedure
		.input(listTeamsSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [eq(teamTable.organizationId, ctx.organization.id)];

			// Search query
			if (input.query) {
				conditions.push(
					or(
						ilike(teamTable.name, `%${input.query}%`),
						ilike(teamTable.description, `%${input.query}%`),
					)!,
				);
			}

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(inArray(teamTable.status, input.filters.status));
			}

			// Sport filter
			if (input.filters?.sport && input.filters.sport.length > 0) {
				conditions.push(inArray(teamTable.sport, input.filters.sport));
			}

			// Season filter
			if (input.filters?.seasonId !== undefined) {
				if (input.filters.seasonId === null) {
					conditions.push(isNull(teamTable.seasonId));
				} else {
					conditions.push(eq(teamTable.seasonId, input.filters.seasonId));
				}
			}

			// Age category filter
			if (input.filters?.ageCategoryId) {
				conditions.push(
					eq(teamTable.ageCategoryId, input.filters.ageCategoryId),
				);
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "name":
					orderByColumn = sortDirection(teamTable.name);
					break;
				case "sport":
					orderByColumn = sortDirection(teamTable.sport);
					break;
				case "status":
					orderByColumn = sortDirection(teamTable.status);
					break;
				default:
					orderByColumn = sortDirection(teamTable.createdAt);
					break;
			}

			const [teams, countResult] = await Promise.all([
				db.query.teamTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						season: true,
						ageCategory: true,
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
						staff: {
							with: {
								coach: {
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
				}),
				db.select({ count: count() }).from(teamTable).where(whereCondition),
			]);

			const teamsWithCount = teams.map((team) => ({
				...team,
				memberCount: team.members.length,
				staffCount: team.staff.length,
			}));

			return { teams: teamsWithCount, total: countResult[0]?.count ?? 0 };
		}),

	get: protectedOrganizationProcedure
		.input(getTeamSchema)
		.query(async ({ ctx, input }) => {
			const team = await db.query.teamTable.findFirst({
				where: and(
					eq(teamTable.id, input.id),
					eq(teamTable.organizationId, ctx.organization.id),
				),
				with: {
					season: true,
					ageCategory: true,
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
					staff: {
						with: {
							coach: {
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
					competitions: {
						with: {
							competition: true,
						},
					},
					homeMatches: true,
					awayMatches: true,
				},
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			return team;
		}),

	listActive: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const teams = await db.query.teamTable.findMany({
			where: and(
				eq(teamTable.organizationId, ctx.organization.id),
				eq(teamTable.status, "active"),
			),
			orderBy: asc(teamTable.name),
			with: {
				season: true,
			},
		});

		return teams;
	}),

	create: protectedOrganizationProcedure
		.input(createTeamSchema)
		.mutation(async ({ ctx, input }) => {
			// Check for duplicate name in same season
			const existing = await db.query.teamTable.findFirst({
				where: and(
					eq(teamTable.organizationId, ctx.organization.id),
					eq(teamTable.name, input.name),
					input.seasonId
						? eq(teamTable.seasonId, input.seasonId)
						: isNull(teamTable.seasonId),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A team with this name already exists in this season",
				});
			}

			const [team] = await db
				.insert(teamTable)
				.values({
					organizationId: ctx.organization.id,
					name: input.name,
					description: input.description,
					sport: input.sport,
					seasonId: input.seasonId,
					ageCategoryId: input.ageCategoryId,
					logoKey: input.logoKey,
					primaryColor: input.primaryColor,
					secondaryColor: input.secondaryColor,
					status: input.status,
					homeVenue: input.homeVenue,
					createdBy: ctx.user.id,
				})
				.returning();

			if (!team) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create team",
				});
			}

			// Add initial members if provided
			if (input.memberIds && input.memberIds.length > 0) {
				// Validate that all athletes belong to the organization
				const athletes = await db.query.athleteTable.findMany({
					where: and(
						inArray(athleteTable.id, input.memberIds),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
				});

				if (athletes.length !== input.memberIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Some athletes do not belong to this organization",
					});
				}

				await db.insert(teamMemberTable).values(
					input.memberIds.map((athleteId) => ({
						teamId: team.id,
						athleteId,
					})),
				);
			}

			return team;
		}),

	update: protectedOrganizationProcedure
		.input(updateTeamSchema)
		.mutation(async ({ ctx, input }) => {
			const team = await db.query.teamTable.findFirst({
				where: and(
					eq(teamTable.id, input.id),
					eq(teamTable.organizationId, ctx.organization.id),
				),
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			// Check for duplicate name if name or season is being changed
			if (
				(input.name && input.name !== team.name) ||
				(input.seasonId !== undefined && input.seasonId !== team.seasonId)
			) {
				const newName = input.name ?? team.name;
				const newSeasonId =
					input.seasonId !== undefined ? input.seasonId : team.seasonId;

				const existing = await db.query.teamTable.findFirst({
					where: and(
						eq(teamTable.organizationId, ctx.organization.id),
						eq(teamTable.name, newName),
						newSeasonId
							? eq(teamTable.seasonId, newSeasonId)
							: isNull(teamTable.seasonId),
						ne(teamTable.id, input.id),
					),
				});

				if (existing) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A team with this name already exists in this season",
					});
				}
			}

			const [updated] = await db
				.update(teamTable)
				.set({
					name: input.name,
					description: input.description,
					sport: input.sport,
					seasonId: input.seasonId,
					ageCategoryId: input.ageCategoryId,
					logoKey: input.logoKey,
					primaryColor: input.primaryColor,
					secondaryColor: input.secondaryColor,
					status: input.status,
					homeVenue: input.homeVenue,
				})
				.where(eq(teamTable.id, input.id))
				.returning();

			return updated;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteTeamSchema)
		.mutation(async ({ ctx, input }) => {
			const team = await db.query.teamTable.findFirst({
				where: and(
					eq(teamTable.id, input.id),
					eq(teamTable.organizationId, ctx.organization.id),
				),
			});

			if (!team) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team not found",
				});
			}

			await db.delete(teamTable).where(eq(teamTable.id, input.id));

			return { success: true };
		}),

	bulkDelete: protectedOrganizationProcedure
		.input(bulkDeleteTeamsSchema)
		.mutation(async ({ ctx, input }) => {
			await db
				.delete(teamTable)
				.where(
					and(
						inArray(teamTable.id, input.ids),
						eq(teamTable.organizationId, ctx.organization.id),
					),
				);

			return { success: true };
		}),

	bulkUpdateStatus: protectedOrganizationProcedure
		.input(bulkUpdateTeamsStatusSchema)
		.mutation(async ({ ctx, input }) => {
			await db
				.update(teamTable)
				.set({ status: input.status })
				.where(
					and(
						inArray(teamTable.id, input.ids),
						eq(teamTable.organizationId, ctx.organization.id),
					),
				);

			return { success: true };
		}),

	// ============================================================================
	// TEAM MEMBERS
	// ============================================================================

	addMembers: protectedOrganizationProcedure
		.input(addTeamMembersSchema)
		.mutation(async ({ ctx, input }) => {
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

			// Validate athletes
			const athleteIds = input.members.map((m) => m.athleteId);
			const athletes = await db.query.athleteTable.findMany({
				where: and(
					inArray(athleteTable.id, athleteIds),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
			});

			if (athletes.length !== athleteIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Some athletes do not belong to this organization",
				});
			}

			// Check for existing members
			const existingMembers = await db.query.teamMemberTable.findMany({
				where: and(
					eq(teamMemberTable.teamId, input.teamId),
					inArray(teamMemberTable.athleteId, athleteIds),
				),
			});

			const existingAthleteIds = new Set(
				existingMembers.map((m) => m.athleteId),
			);
			const newMembers = input.members.filter(
				(m) => !existingAthleteIds.has(m.athleteId),
			);

			if (newMembers.length > 0) {
				await db.insert(teamMemberTable).values(
					newMembers.map((member) => ({
						teamId: input.teamId,
						athleteId: member.athleteId,
						jerseyNumber: member.jerseyNumber,
						position: member.position,
						role: member.role,
					})),
				);
			}

			return { added: newMembers.length };
		}),

	removeMembers: protectedOrganizationProcedure
		.input(removeTeamMembersSchema)
		.mutation(async ({ ctx, input }) => {
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
				.delete(teamMemberTable)
				.where(
					and(
						eq(teamMemberTable.teamId, input.teamId),
						inArray(teamMemberTable.athleteId, input.athleteIds),
					),
				);

			return { success: true };
		}),

	updateMember: protectedOrganizationProcedure
		.input(updateTeamMemberSchema)
		.mutation(async ({ ctx, input }) => {
			const member = await db.query.teamMemberTable.findFirst({
				where: eq(teamMemberTable.id, input.id),
				with: {
					team: true,
				},
			});

			if (!member || member.team.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Team member not found",
				});
			}

			const [updated] = await db
				.update(teamMemberTable)
				.set({
					jerseyNumber: input.jerseyNumber,
					position: input.position,
					role: input.role,
					notes: input.notes,
				})
				.where(eq(teamMemberTable.id, input.id))
				.returning();

			return updated;
		}),

	setMembers: protectedOrganizationProcedure
		.input(setTeamMembersSchema)
		.mutation(async ({ ctx, input }) => {
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

			// Validate athletes if any
			if (input.members.length > 0) {
				const athleteIds = input.members.map((m) => m.athleteId);
				const athletes = await db.query.athleteTable.findMany({
					where: and(
						inArray(athleteTable.id, athleteIds),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
				});

				if (athletes.length !== athleteIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Some athletes do not belong to this organization",
					});
				}
			}

			// Delete all current members
			await db
				.delete(teamMemberTable)
				.where(eq(teamMemberTable.teamId, input.teamId));

			// Insert new members
			if (input.members.length > 0) {
				await db.insert(teamMemberTable).values(
					input.members.map((member) => ({
						teamId: input.teamId,
						athleteId: member.athleteId,
						jerseyNumber: member.jerseyNumber,
						position: member.position,
						role: member.role,
					})),
				);
			}

			return { success: true };
		}),

	// ============================================================================
	// TEAM STAFF
	// ============================================================================

	addStaff: protectedOrganizationProcedure
		.input(addTeamStaffSchema)
		.mutation(async ({ ctx, input }) => {
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

			// Validate coach if provided
			if (input.coachId) {
				const coach = await db.query.coachTable.findFirst({
					where: and(
						eq(coachTable.id, input.coachId),
						eq(coachTable.organizationId, ctx.organization.id),
					),
				});

				if (!coach) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Coach not found in this organization",
					});
				}
			}

			// Validate user if provided
			if (input.userId) {
				const user = await db.query.userTable.findFirst({
					where: eq(userTable.id, input.userId),
				});

				if (!user) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "User not found",
					});
				}
			}

			const [staff] = await db
				.insert(teamStaffTable)
				.values({
					teamId: input.teamId,
					coachId: input.coachId,
					userId: input.userId,
					role: input.role,
					title: input.title,
					isPrimary: input.isPrimary,
					notes: input.notes,
				})
				.returning();

			return staff;
		}),

	removeStaff: protectedOrganizationProcedure
		.input(removeTeamStaffSchema)
		.mutation(async ({ ctx, input }) => {
			const staff = await db.query.teamStaffTable.findFirst({
				where: eq(teamStaffTable.id, input.id),
				with: {
					team: true,
				},
			});

			if (!staff || staff.team.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Staff member not found",
				});
			}

			await db.delete(teamStaffTable).where(eq(teamStaffTable.id, input.id));

			return { success: true };
		}),

	updateStaff: protectedOrganizationProcedure
		.input(updateTeamStaffSchema)
		.mutation(async ({ ctx, input }) => {
			const staff = await db.query.teamStaffTable.findFirst({
				where: eq(teamStaffTable.id, input.id),
				with: {
					team: true,
				},
			});

			if (!staff || staff.team.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Staff member not found",
				});
			}

			const [updated] = await db
				.update(teamStaffTable)
				.set({
					role: input.role,
					title: input.title,
					isPrimary: input.isPrimary,
					notes: input.notes,
				})
				.where(eq(teamStaffTable.id, input.id))
				.returning();

			return updated;
		}),

	// List teams by athlete
	listByAthlete: protectedOrganizationProcedure
		.input(listTeamsByAthleteSchema)
		.query(async ({ ctx, input }) => {
			const teamMembers = await db.query.teamMemberTable.findMany({
				where: eq(teamMemberTable.athleteId, input.athleteId),
				with: {
					team: {
						with: {
							season: true,
							ageCategory: true,
						},
					},
				},
			});

			// Filter to only include teams from this organization
			const teams = teamMembers
				.filter((tm) => tm.team.organizationId === ctx.organization.id)
				.map((tm) => ({
					...tm.team,
					membership: {
						id: tm.id,
						role: tm.role,
						jerseyNumber: tm.jerseyNumber,
						position: tm.position,
						joinedAt: tm.joinedAt,
						leftAt: tm.leftAt,
					},
				}));

			return teams;
		}),
});
