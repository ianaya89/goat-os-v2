import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
	inArray,
	or,
	type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	ageCategoryTable,
	athleteGroupMemberTable,
	athleteGroupTable,
	athleteTable,
} from "@/lib/db/schema/tables";
import {
	addMembersToGroupSchema,
	bulkDeleteAthleteGroupsSchema,
	bulkUpdateAthleteGroupsActiveSchema,
	createAthleteGroupSchema,
	deleteAthleteGroupSchema,
	listAthleteGroupsSchema,
	removeMembersFromGroupSchema,
	setGroupMembersSchema,
	updateAthleteGroupSchema,
} from "@/schemas/organization-athlete-group-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationAthleteGroupRouter = createTRPCRouter({
	list: protectedOrganizationProcedure
		.input(listAthleteGroupsSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(athleteGroupTable.organizationId, ctx.organization.id),
			];

			// Search query
			if (input.query) {
				conditions.push(
					or(
						ilike(athleteGroupTable.name, `%${input.query}%`),
						ilike(athleteGroupTable.description, `%${input.query}%`),
					)!,
				);
			}

			// Active filter
			if (input.filters?.isActive !== undefined) {
				conditions.push(eq(athleteGroupTable.isActive, input.filters.isActive));
			}

			// Age category filter (single or multiple)
			if (
				input.filters?.ageCategoryIds &&
				input.filters.ageCategoryIds.length > 0
			) {
				conditions.push(
					inArray(
						athleteGroupTable.ageCategoryId,
						input.filters.ageCategoryIds,
					),
				);
			} else if (input.filters?.ageCategoryId) {
				conditions.push(
					eq(athleteGroupTable.ageCategoryId, input.filters.ageCategoryId),
				);
			}

			// Sport filter
			if (input.filters?.sport && input.filters.sport.length > 0) {
				conditions.push(inArray(athleteGroupTable.sport, input.filters.sport));
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "name":
					orderByColumn = sortDirection(athleteGroupTable.name);
					break;
				case "sport":
					orderByColumn = sortDirection(athleteGroupTable.sport);
					break;
				case "isActive":
					orderByColumn = sortDirection(athleteGroupTable.isActive);
					break;
				default:
					orderByColumn = sortDirection(athleteGroupTable.createdAt);
					break;
			}

			// Run queries in parallel
			const [groups, countResult] = await Promise.all([
				db.query.athleteGroupTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						ageCategory: true,
						service: {
							columns: {
								id: true,
								name: true,
								currentPrice: true,
								currency: true,
							},
						},
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
				}),
				db
					.select({ count: count() })
					.from(athleteGroupTable)
					.where(whereCondition),
			]);

			// Add member count to each group
			const groupsWithCount = groups.map((group) => ({
				...group,
				memberCount: group.members.length,
			}));

			return { groups: groupsWithCount, total: countResult[0]?.count ?? 0 };
		}),

	get: protectedOrganizationProcedure
		.input(deleteAthleteGroupSchema)
		.query(async ({ ctx, input }) => {
			const group = await db.query.athleteGroupTable.findFirst({
				where: and(
					eq(athleteGroupTable.id, input.id),
					eq(athleteGroupTable.organizationId, ctx.organization.id),
				),
				with: {
					ageCategory: true,
					service: {
						columns: {
							id: true,
							name: true,
							currentPrice: true,
							currency: true,
						},
					},
					members: {
						with: {
							athlete: {
								columns: {
									id: true,
									birthDate: true,
									level: true,
									phone: true,
								},
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
			});

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete group not found",
				});
			}

			return {
				...group,
				memberCount: group.members.length,
			};
		}),

	// Get all active groups (for dropdowns)
	listActive: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const groups = await db.query.athleteGroupTable.findMany({
			where: and(
				eq(athleteGroupTable.organizationId, ctx.organization.id),
				eq(athleteGroupTable.isActive, true),
			),
			orderBy: asc(athleteGroupTable.name),
			columns: {
				id: true,
				name: true,
				description: true,
				sport: true,
				ageCategoryId: true,
				maxCapacity: true,
				serviceId: true,
			},
			with: {
				ageCategory: true,
				members: {
					columns: { id: true },
				},
			},
		});

		return groups.map((g) => ({
			...g,
			memberCount: g.members.length,
		}));
	}),

	create: protectedOrganizationProcedure
		.input(createAthleteGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const { memberIds, ...groupData } = input;

			// Check for duplicate name
			const existingGroup = await db.query.athleteGroupTable.findFirst({
				where: and(
					eq(athleteGroupTable.organizationId, ctx.organization.id),
					eq(athleteGroupTable.name, input.name),
				),
			});

			if (existingGroup) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A group with this name already exists",
				});
			}

			// Create the group
			const [group] = await db
				.insert(athleteGroupTable)
				.values({
					organizationId: ctx.organization.id,
					...groupData,
				})
				.returning();

			if (!group) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create athlete group",
				});
			}

			// Add initial members if provided
			if (memberIds && memberIds.length > 0) {
				// Verify all athletes belong to this organization
				const athletes = await db.query.athleteTable.findMany({
					where: and(
						inArray(athleteTable.id, memberIds),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
					columns: { id: true },
				});

				const validAthleteIds = athletes.map((a) => a.id);

				if (validAthleteIds.length > 0) {
					await db.insert(athleteGroupMemberTable).values(
						validAthleteIds.map((athleteId) => ({
							groupId: group.id,
							athleteId,
						})),
					);
				}
			}

			return group;
		}),

	update: protectedOrganizationProcedure
		.input(updateAthleteGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Check for duplicate name if name is being changed
			if (data.name) {
				const existingGroup = await db.query.athleteGroupTable.findFirst({
					where: and(
						eq(athleteGroupTable.organizationId, ctx.organization.id),
						eq(athleteGroupTable.name, data.name),
					),
				});

				if (existingGroup && existingGroup.id !== id) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A group with this name already exists",
					});
				}
			}

			const [updatedGroup] = await db
				.update(athleteGroupTable)
				.set(data)
				.where(
					and(
						eq(athleteGroupTable.id, id),
						eq(athleteGroupTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updatedGroup) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete group not found",
				});
			}

			return updatedGroup;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteAthleteGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const [deletedGroup] = await db
				.delete(athleteGroupTable)
				.where(
					and(
						eq(athleteGroupTable.id, input.id),
						eq(athleteGroupTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!deletedGroup) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete group not found",
				});
			}

			return { success: true };
		}),

	bulkDelete: protectedOrganizationProcedure
		.input(bulkDeleteAthleteGroupsSchema)
		.mutation(async ({ ctx, input }) => {
			const deleted = await db
				.delete(athleteGroupTable)
				.where(
					and(
						inArray(athleteGroupTable.id, input.ids),
						eq(athleteGroupTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: athleteGroupTable.id });

			return { success: true, count: deleted.length };
		}),

	bulkUpdateActive: protectedOrganizationProcedure
		.input(bulkUpdateAthleteGroupsActiveSchema)
		.mutation(async ({ ctx, input }) => {
			const updated = await db
				.update(athleteGroupTable)
				.set({ isActive: input.isActive })
				.where(
					and(
						inArray(athleteGroupTable.id, input.ids),
						eq(athleteGroupTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: athleteGroupTable.id });

			return { success: true, count: updated.length };
		}),

	// Member management
	addMembers: protectedOrganizationProcedure
		.input(addMembersToGroupSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify group belongs to organization
			const group = await db.query.athleteGroupTable.findFirst({
				where: and(
					eq(athleteGroupTable.id, input.groupId),
					eq(athleteGroupTable.organizationId, ctx.organization.id),
				),
			});

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete group not found",
				});
			}

			// Verify all athletes belong to this organization
			const athletes = await db.query.athleteTable.findMany({
				where: and(
					inArray(athleteTable.id, input.athleteIds),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
				columns: { id: true },
			});

			const validAthleteIds = athletes.map((a) => a.id);

			if (validAthleteIds.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No valid athletes provided",
				});
			}

			// Get existing members to avoid duplicates
			const existingMembers = await db.query.athleteGroupMemberTable.findMany({
				where: and(
					eq(athleteGroupMemberTable.groupId, input.groupId),
					inArray(athleteGroupMemberTable.athleteId, validAthleteIds),
				),
				columns: { athleteId: true },
			});

			const existingAthleteIds = new Set(
				existingMembers.map((m) => m.athleteId),
			);
			const newAthleteIds = validAthleteIds.filter(
				(id) => !existingAthleteIds.has(id),
			);

			if (newAthleteIds.length > 0) {
				await db.insert(athleteGroupMemberTable).values(
					newAthleteIds.map((athleteId) => ({
						groupId: input.groupId,
						athleteId,
					})),
				);
			}

			return { success: true, addedCount: newAthleteIds.length };
		}),

	removeMembers: protectedOrganizationProcedure
		.input(removeMembersFromGroupSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify group belongs to organization
			const group = await db.query.athleteGroupTable.findFirst({
				where: and(
					eq(athleteGroupTable.id, input.groupId),
					eq(athleteGroupTable.organizationId, ctx.organization.id),
				),
			});

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete group not found",
				});
			}

			const deleted = await db
				.delete(athleteGroupMemberTable)
				.where(
					and(
						eq(athleteGroupMemberTable.groupId, input.groupId),
						inArray(athleteGroupMemberTable.athleteId, input.athleteIds),
					),
				)
				.returning({ id: athleteGroupMemberTable.id });

			return { success: true, removedCount: deleted.length };
		}),

	setMembers: protectedOrganizationProcedure
		.input(setGroupMembersSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify group belongs to organization
			const group = await db.query.athleteGroupTable.findFirst({
				where: and(
					eq(athleteGroupTable.id, input.groupId),
					eq(athleteGroupTable.organizationId, ctx.organization.id),
				),
			});

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete group not found",
				});
			}

			// Verify all athletes belong to this organization
			let validAthleteIds: string[] = [];
			if (input.athleteIds.length > 0) {
				const athletes = await db.query.athleteTable.findMany({
					where: and(
						inArray(athleteTable.id, input.athleteIds),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
					columns: { id: true },
				});
				validAthleteIds = athletes.map((a) => a.id);
			}

			// Delete all existing members
			await db
				.delete(athleteGroupMemberTable)
				.where(eq(athleteGroupMemberTable.groupId, input.groupId));

			// Insert new members
			if (validAthleteIds.length > 0) {
				await db.insert(athleteGroupMemberTable).values(
					validAthleteIds.map((athleteId) => ({
						groupId: input.groupId,
						athleteId,
					})),
				);
			}

			return { success: true, memberCount: validAthleteIds.length };
		}),

	// List groups that the current user (as athlete) belongs to
	listMyGroups: protectedOrganizationProcedure.query(async ({ ctx }) => {
		// First, find the athlete record for the current user
		const athlete = await db.query.athleteTable.findFirst({
			where: and(
				eq(athleteTable.userId, ctx.user.id),
				eq(athleteTable.organizationId, ctx.organization.id),
			),
		});

		if (!athlete) {
			return { groups: [], athlete: null };
		}

		// Get all group memberships for this athlete
		const memberships = await db.query.athleteGroupMemberTable.findMany({
			where: eq(athleteGroupMemberTable.athleteId, athlete.id),
			with: {
				group: {
					with: {
						ageCategory: true,
						members: {
							with: {
								athlete: {
									with: {
										user: {
											columns: {
												id: true,
												name: true,
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
		});

		const groups = memberships
			.map((m) => m.group)
			.filter((g) => g.isActive)
			.map((group) => ({
				...group,
				memberCount: group.members.length,
			}));

		return { groups, athlete };
	}),
});
