import { TRPCError } from "@trpc/server";
import {
	and,
	arrayOverlaps,
	asc,
	count,
	desc,
	eq,
	inArray,
	type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	WaitlistEntryStatus,
	WaitlistReferenceType,
} from "@/lib/db/schema/enums";
import {
	athleteGroupMemberTable,
	athleteGroupTable,
	athleteTable,
	waitlistEntryTable,
} from "@/lib/db/schema/tables";
import {
	assignFromWaitlistSchema,
	bulkDeleteWaitlistEntriesSchema,
	bulkUpdateWaitlistPrioritySchema,
	createWaitlistEntrySchema,
	getWaitlistCountSchema,
	getWaitlistEntrySchema,
	listWaitlistEntriesSchema,
	updateWaitlistEntrySchema,
} from "@/schemas/organization-waitlist-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationWaitlistRouter = createTRPCRouter({
	// List all waitlist entries with filtering
	list: protectedOrganizationProcedure
		.input(listWaitlistEntriesSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(waitlistEntryTable.organizationId, ctx.organization.id),
			];

			// Reference type filter
			if (input.filters?.referenceType) {
				conditions.push(
					eq(waitlistEntryTable.referenceType, input.filters.referenceType),
				);
			}

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(
					inArray(waitlistEntryTable.status, input.filters.status),
				);
			}

			// Priority filter
			if (input.filters?.priority && input.filters.priority.length > 0) {
				conditions.push(
					inArray(waitlistEntryTable.priority, input.filters.priority),
				);
			}

			// Specific reference filters
			if (input.filters?.athleteGroupId) {
				conditions.push(
					eq(waitlistEntryTable.athleteGroupId, input.filters.athleteGroupId),
				);
			}
			if (input.filters?.athleteId) {
				conditions.push(
					eq(waitlistEntryTable.athleteId, input.filters.athleteId),
				);
			}
			if (
				input.filters?.preferredDays &&
				input.filters.preferredDays.length > 0
			) {
				conditions.push(
					arrayOverlaps(
						waitlistEntryTable.preferredDays,
						input.filters.preferredDays,
					),
				);
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "priority":
					orderByColumn = sortDirection(waitlistEntryTable.priority);
					break;
				case "position":
					orderByColumn = sortDirection(waitlistEntryTable.position);
					break;
				case "status":
					orderByColumn = sortDirection(waitlistEntryTable.status);
					break;
				default:
					orderByColumn = sortDirection(waitlistEntryTable.createdAt);
					break;
			}

			const [entries, countResult] = await Promise.all([
				db.query.waitlistEntryTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						athlete: {
							with: {
								user: {
									columns: { id: true, name: true, email: true, image: true },
								},
							},
						},
						athleteGroup: {
							columns: { id: true, name: true },
						},
						createdByUser: {
							columns: { id: true, name: true },
						},
						assignedByUser: {
							columns: { id: true, name: true },
						},
					},
				}),
				db
					.select({ count: count() })
					.from(waitlistEntryTable)
					.where(whereCondition),
			]);

			return { entries, total: countResult[0]?.count ?? 0 };
		}),

	// Get single entry
	get: protectedOrganizationProcedure
		.input(getWaitlistEntrySchema)
		.query(async ({ ctx, input }) => {
			const entry = await db.query.waitlistEntryTable.findFirst({
				where: and(
					eq(waitlistEntryTable.id, input.id),
					eq(waitlistEntryTable.organizationId, ctx.organization.id),
				),
				with: {
					athlete: {
						with: {
							user: {
								columns: { id: true, name: true, email: true, image: true },
							},
						},
					},
					athleteGroup: true,
					createdByUser: { columns: { id: true, name: true } },
					assignedByUser: { columns: { id: true, name: true } },
				},
			});

			if (!entry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Waitlist entry not found",
				});
			}

			return entry;
		}),

	// Create new waitlist entry
	create: protectedOrganizationProcedure
		.input(createWaitlistEntrySchema)
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

			// Verify reference exists and belongs to organization
			if (input.referenceType === WaitlistReferenceType.athleteGroup) {
				const group = await db.query.athleteGroupTable.findFirst({
					where: and(
						eq(athleteGroupTable.id, input.athleteGroupId!),
						eq(athleteGroupTable.organizationId, ctx.organization.id),
					),
				});
				if (!group) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Athlete group not found",
					});
				}

				// Check if athlete is already on waitlist for this group
				const existingEntry = await db.query.waitlistEntryTable.findFirst({
					where: and(
						eq(waitlistEntryTable.athleteId, input.athleteId),
						eq(waitlistEntryTable.athleteGroupId, input.athleteGroupId!),
						eq(waitlistEntryTable.status, WaitlistEntryStatus.waiting),
					),
				});
				if (existingEntry) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Athlete is already on waitlist for this group",
					});
				}
			}
			// For schedule type, no need to verify - just check if athlete has existing waitlist entry for same days
			// (We allow multiple schedule entries for the same athlete with different day preferences)

			// Calculate next position based on reference type
			const referenceCondition =
				input.referenceType === WaitlistReferenceType.athleteGroup
					? eq(waitlistEntryTable.athleteGroupId, input.athleteGroupId!)
					: eq(
							waitlistEntryTable.referenceType,
							WaitlistReferenceType.schedule,
						);

			const lastEntry = await db.query.waitlistEntryTable.findFirst({
				where: and(
					eq(waitlistEntryTable.organizationId, ctx.organization.id),
					eq(waitlistEntryTable.status, WaitlistEntryStatus.waiting),
					referenceCondition,
				),
				orderBy: desc(waitlistEntryTable.position),
			});

			const nextPosition = (lastEntry?.position ?? 0) + 1;

			const [entry] = await db
				.insert(waitlistEntryTable)
				.values({
					organizationId: ctx.organization.id,
					athleteId: input.athleteId,
					referenceType: input.referenceType,
					preferredDays: input.preferredDays,
					preferredStartTime: input.preferredStartTime,
					preferredEndTime: input.preferredEndTime,
					athleteGroupId: input.athleteGroupId,
					priority: input.priority,
					reason: input.reason,
					notes: input.notes,
					expiresAt: input.expiresAt,
					position: nextPosition,
					createdBy: ctx.user.id,
				})
				.returning();

			if (!entry) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create waitlist entry",
				});
			}

			return entry;
		}),

	// Update waitlist entry
	update: protectedOrganizationProcedure
		.input(updateWaitlistEntrySchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updated] = await db
				.update(waitlistEntryTable)
				.set(data)
				.where(
					and(
						eq(waitlistEntryTable.id, id),
						eq(waitlistEntryTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Waitlist entry not found",
				});
			}

			return updated;
		}),

	// Delete (cancel) waitlist entry
	delete: protectedOrganizationProcedure
		.input(getWaitlistEntrySchema)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await db
				.update(waitlistEntryTable)
				.set({ status: WaitlistEntryStatus.cancelled })
				.where(
					and(
						eq(waitlistEntryTable.id, input.id),
						eq(waitlistEntryTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Waitlist entry not found",
				});
			}

			return { success: true };
		}),

	// Bulk delete (cancel)
	bulkDelete: protectedOrganizationProcedure
		.input(bulkDeleteWaitlistEntriesSchema)
		.mutation(async ({ ctx, input }) => {
			const updated = await db
				.update(waitlistEntryTable)
				.set({ status: WaitlistEntryStatus.cancelled })
				.where(
					and(
						inArray(waitlistEntryTable.id, input.ids),
						eq(waitlistEntryTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: waitlistEntryTable.id });

			return { success: true, count: updated.length };
		}),

	// Bulk update priority
	bulkUpdatePriority: protectedOrganizationProcedure
		.input(bulkUpdateWaitlistPrioritySchema)
		.mutation(async ({ ctx, input }) => {
			const updated = await db
				.update(waitlistEntryTable)
				.set({ priority: input.priority })
				.where(
					and(
						inArray(waitlistEntryTable.id, input.ids),
						eq(waitlistEntryTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: waitlistEntryTable.id });

			return { success: true, count: updated.length };
		}),

	// Assign athlete from waitlist to group (only for athlete_group type)
	// For schedule type, this just marks the entry as assigned (admin handled placement)
	assign: protectedOrganizationProcedure
		.input(assignFromWaitlistSchema)
		.mutation(async ({ ctx, input }) => {
			const entry = await db.query.waitlistEntryTable.findFirst({
				where: and(
					eq(waitlistEntryTable.id, input.id),
					eq(waitlistEntryTable.organizationId, ctx.organization.id),
					eq(waitlistEntryTable.status, WaitlistEntryStatus.waiting),
				),
			});

			if (!entry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Waitlist entry not found or already processed",
				});
			}

			// For athlete_group type, add athlete to the group
			if (entry.referenceType === WaitlistReferenceType.athleteGroup) {
				// Check if athlete is already a member
				const existing = await db.query.athleteGroupMemberTable.findFirst({
					where: and(
						eq(athleteGroupMemberTable.groupId, entry.athleteGroupId!),
						eq(athleteGroupMemberTable.athleteId, entry.athleteId),
					),
				});

				if (!existing) {
					await db.insert(athleteGroupMemberTable).values({
						groupId: entry.athleteGroupId!,
						athleteId: entry.athleteId,
					});
				}
			}
			// For schedule type, we just mark as assigned (admin manually placed the athlete)

			// Update waitlist entry status
			const [updated] = await db
				.update(waitlistEntryTable)
				.set({
					status: WaitlistEntryStatus.assigned,
					assignedAt: new Date(),
					assignedBy: ctx.user.id,
				})
				.where(eq(waitlistEntryTable.id, input.id))
				.returning();

			return updated;
		}),

	// Get waitlist count for a reference
	getCount: protectedOrganizationProcedure
		.input(getWaitlistCountSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(waitlistEntryTable.organizationId, ctx.organization.id),
				eq(waitlistEntryTable.status, WaitlistEntryStatus.waiting),
				eq(waitlistEntryTable.referenceType, input.referenceType),
			];

			if (
				input.referenceType === WaitlistReferenceType.athleteGroup &&
				input.athleteGroupId
			) {
				conditions.push(
					eq(waitlistEntryTable.athleteGroupId, input.athleteGroupId),
				);
			}

			if (
				input.referenceType === WaitlistReferenceType.schedule &&
				input.preferredDays &&
				input.preferredDays.length > 0
			) {
				conditions.push(
					arrayOverlaps(waitlistEntryTable.preferredDays, input.preferredDays),
				);
			}

			const result = await db
				.select({ count: count() })
				.from(waitlistEntryTable)
				.where(and(...conditions));

			return { count: result[0]?.count ?? 0 };
		}),
});
