import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	desc,
	eq,
	ilike,
	inArray,
	or,
	type SQL,
	sql,
	sum,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	EventBudgetStatus,
	EventChecklistStatus,
	EventMilestoneStatus,
	EventRegistrationStatus,
	EventRiskStatus,
	EventSponsorBenefitStatus,
	EventStaffType,
} from "@/lib/db/schema/enums";
import {
	eventBudgetLineTable,
	eventChecklistTable,
	eventDocumentTable,
	eventInventoryTable,
	eventMilestoneTable,
	eventNoteTable,
	eventRegistrationTable,
	eventRiskLogTable,
	eventRiskTable,
	eventSponsorBenefitTable,
	eventSponsorTable,
	eventStaffShiftTable,
	eventStaffTable,
	eventTaskTable,
	eventVendorAssignmentTable,
	eventVendorTable,
	eventZoneStaffTable,
	eventZoneTable,
	expenseTable,
	sportsEventTable,
} from "@/lib/db/schema/tables";
import {
	assignStaffToZoneSchema,
	confirmStaffSchema,
	confirmVendorAssignmentSchema,
	createBenefitSchema,
	createBudgetLineSchema,
	createChecklistItemSchema,
	createDocumentSchema,
	createInventoryItemSchema,
	createMilestoneSchema,
	createNoteSchema,
	createRiskSchema,
	createShiftSchema,
	createSponsorSchema,
	createStaffSchema,
	createTaskSchema,
	createVendorAssignmentSchema,
	createVendorSchema,
	createZoneSchema,
	idSchema,
	listBenefitsSchema,
	listBudgetLinesSchema,
	listChecklistsSchema,
	listDocumentsSchema,
	listInventorySchema,
	listMilestonesSchema,
	listNotesSchema,
	listRiskLogsSchema,
	listRisksSchema,
	listShiftsSchema,
	listSponsorsSchema,
	listStaffSchema,
	listTasksSchema,
	listVendorAssignmentsSchema,
	listVendorsSchema,
	listZoneStaffSchema,
	listZonesSchema,
	markBenefitDeliveredSchema,
	moveTaskSchema,
	pinNoteSchema,
	removeStaffFromZoneSchema,
	reorderChecklistSchema,
	toggleChecklistItemSchema,
	updateBenefitSchema,
	updateBudgetLineSchema,
	updateChecklistItemSchema,
	updateInventoryItemSchema,
	updateMilestoneSchema,
	updateNoteSchema,
	updateRiskSchema,
	updateShiftSchema,
	updateSponsorSchema,
	updateStaffSchema,
	updateTaskSchema,
	updateVendorAssignmentSchema,
	updateVendorSchema,
	updateZoneSchema,
} from "@/schemas/organization-event-organization-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

// Helper to verify event belongs to organization
async function verifyEventOwnership(eventId: string, organizationId: string) {
	const event = await db.query.sportsEventTable.findFirst({
		where: and(
			eq(sportsEventTable.id, eventId),
			eq(sportsEventTable.organizationId, organizationId),
		),
	});
	if (!event) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
	}
	return event;
}

export const organizationEventOrganizationRouter = createTRPCRouter({
	// ============================================================================
	// VENDORS (Organization-level)
	// ============================================================================

	listVendors: protectedOrganizationProcedure
		.input(listVendorsSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(eventVendorTable.organizationId, ctx.organization.id),
			];

			if (!input.includeInactive) {
				conditions.push(eq(eventVendorTable.isActive, true));
			}

			if (input.query) {
				conditions.push(
					or(
						ilike(eventVendorTable.name, `%${input.query}%`),
						ilike(eventVendorTable.contactName, `%${input.query}%`),
					) as SQL,
				);
			}

			return db.query.eventVendorTable.findMany({
				where: and(...conditions),
				orderBy: asc(eventVendorTable.name),
			});
		}),

	createVendor: protectedOrganizationProcedure
		.input(createVendorSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventVendorTable.findFirst({
				where: and(
					eq(eventVendorTable.organizationId, ctx.organization.id),
					eq(eventVendorTable.name, input.name),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A vendor with this name already exists",
				});
			}

			const [vendor] = await db
				.insert(eventVendorTable)
				.values({
					organizationId: ctx.organization.id,
					...input,
					categories: input.categories
						? JSON.stringify(input.categories)
						: null,
					createdBy: ctx.user.id,
				})
				.returning();

			return vendor;
		}),

	updateVendor: protectedOrganizationProcedure
		.input(updateVendorSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventVendorTable.findFirst({
				where: and(
					eq(eventVendorTable.id, input.id),
					eq(eventVendorTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
			}

			const { id, categories, ...updateData } = input;

			const [updated] = await db
				.update(eventVendorTable)
				.set({
					...updateData,
					categories: categories
						? JSON.stringify(categories)
						: existing.categories,
				})
				.where(eq(eventVendorTable.id, id))
				.returning();

			return updated;
		}),

	deleteVendor: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventVendorTable.findFirst({
				where: and(
					eq(eventVendorTable.id, input.id),
					eq(eventVendorTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
			}

			await db
				.delete(eventVendorTable)
				.where(eq(eventVendorTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// ZONES
	// ============================================================================

	listZones: protectedOrganizationProcedure
		.input(listZonesSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [eq(eventZoneTable.eventId, input.eventId)];

			if (!input.includeInactive) {
				conditions.push(eq(eventZoneTable.isActive, true));
			}

			return db.query.eventZoneTable.findMany({
				where: and(...conditions),
				orderBy: asc(eventZoneTable.name),
				with: {
					staff: {
						with: {
							staff: {
								with: {
									user: {
										columns: { id: true, name: true, email: true, image: true },
									},
								},
							},
						},
					},
				},
			});
		}),

	createZone: protectedOrganizationProcedure
		.input(createZoneSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const [zone] = await db
				.insert(eventZoneTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
				})
				.returning();

			return zone;
		}),

	updateZone: protectedOrganizationProcedure
		.input(updateZoneSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventZoneTable.findFirst({
				where: and(
					eq(eventZoneTable.id, input.id),
					eq(eventZoneTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Zone not found" });
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventZoneTable)
				.set(updateData)
				.where(eq(eventZoneTable.id, id))
				.returning();

			return updated;
		}),

	deleteZone: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventZoneTable.findFirst({
				where: and(
					eq(eventZoneTable.id, input.id),
					eq(eventZoneTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Zone not found" });
			}

			await db.delete(eventZoneTable).where(eq(eventZoneTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// ZONE STAFF
	// ============================================================================

	listZoneStaff: protectedOrganizationProcedure
		.input(listZoneStaffSchema)
		.query(async ({ ctx, input }) => {
			const zone = await db.query.eventZoneTable.findFirst({
				where: and(
					eq(eventZoneTable.id, input.zoneId),
					eq(eventZoneTable.organizationId, ctx.organization.id),
				),
			});

			if (!zone) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Zone not found" });
			}

			return db.query.eventZoneStaffTable.findMany({
				where: eq(eventZoneStaffTable.zoneId, input.zoneId),
				with: {
					staff: {
						with: {
							user: {
								columns: { id: true, name: true, email: true, image: true },
							},
						},
					},
				},
			});
		}),

	assignStaffToZone: protectedOrganizationProcedure
		.input(assignStaffToZoneSchema)
		.mutation(async ({ ctx, input }) => {
			const zone = await db.query.eventZoneTable.findFirst({
				where: and(
					eq(eventZoneTable.id, input.zoneId),
					eq(eventZoneTable.organizationId, ctx.organization.id),
				),
			});

			if (!zone) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Zone not found" });
			}

			const [assignment] = await db
				.insert(eventZoneStaffTable)
				.values({
					zoneId: input.zoneId,
					staffId: input.staffId,
					roleAtZone: input.roleAtZone,
					isPrimary: input.isPrimary,
					notes: input.notes,
				})
				.onConflictDoUpdate({
					target: [eventZoneStaffTable.zoneId, eventZoneStaffTable.staffId],
					set: {
						roleAtZone: input.roleAtZone,
						isPrimary: input.isPrimary,
						notes: input.notes,
					},
				})
				.returning();

			return assignment;
		}),

	removeStaffFromZone: protectedOrganizationProcedure
		.input(removeStaffFromZoneSchema)
		.mutation(async ({ ctx, input }) => {
			const zone = await db.query.eventZoneTable.findFirst({
				where: and(
					eq(eventZoneTable.id, input.zoneId),
					eq(eventZoneTable.organizationId, ctx.organization.id),
				),
			});

			if (!zone) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Zone not found" });
			}

			await db
				.delete(eventZoneStaffTable)
				.where(
					and(
						eq(eventZoneStaffTable.zoneId, input.zoneId),
						eq(eventZoneStaffTable.staffId, input.staffId),
					),
				);

			return { success: true };
		}),

	// ============================================================================
	// CHECKLISTS
	// ============================================================================

	listChecklists: protectedOrganizationProcedure
		.input(listChecklistsSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [
				eq(eventChecklistTable.eventId, input.eventId),
			];

			if (input.status) {
				conditions.push(eq(eventChecklistTable.status, input.status));
			}
			if (input.category) {
				conditions.push(eq(eventChecklistTable.category, input.category));
			}

			return db.query.eventChecklistTable.findMany({
				where: and(...conditions),
				orderBy: [
					asc(eventChecklistTable.sortOrder),
					asc(eventChecklistTable.createdAt),
				],
				with: {
					completedByUser: { columns: { id: true, name: true, image: true } },
				},
			});
		}),

	createChecklistItem: protectedOrganizationProcedure
		.input(createChecklistItemSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const [item] = await db
				.insert(eventChecklistTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
				})
				.returning();

			return item;
		}),

	updateChecklistItem: protectedOrganizationProcedure
		.input(updateChecklistItemSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventChecklistTable.findFirst({
				where: and(
					eq(eventChecklistTable.id, input.id),
					eq(eventChecklistTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Checklist item not found",
				});
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventChecklistTable)
				.set(updateData)
				.where(eq(eventChecklistTable.id, id))
				.returning();

			return updated;
		}),

	toggleChecklistItem: protectedOrganizationProcedure
		.input(toggleChecklistItemSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventChecklistTable.findFirst({
				where: and(
					eq(eventChecklistTable.id, input.id),
					eq(eventChecklistTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Checklist item not found",
				});
			}

			const [updated] = await db
				.update(eventChecklistTable)
				.set({
					status: input.completed
						? EventChecklistStatus.completed
						: EventChecklistStatus.pending,
					completedAt: input.completed ? new Date() : null,
					completedBy: input.completed ? ctx.user.id : null,
				})
				.where(eq(eventChecklistTable.id, input.id))
				.returning();

			return updated;
		}),

	deleteChecklistItem: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventChecklistTable.findFirst({
				where: and(
					eq(eventChecklistTable.id, input.id),
					eq(eventChecklistTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Checklist item not found",
				});
			}

			await db
				.delete(eventChecklistTable)
				.where(eq(eventChecklistTable.id, input.id));
			return { success: true };
		}),

	reorderChecklist: protectedOrganizationProcedure
		.input(reorderChecklistSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			await db.transaction(async (tx) => {
				for (const item of input.items) {
					await tx
						.update(eventChecklistTable)
						.set({ sortOrder: item.sortOrder })
						.where(
							and(
								eq(eventChecklistTable.id, item.id),
								eq(eventChecklistTable.organizationId, ctx.organization.id),
							),
						);
				}
			});

			return { success: true };
		}),

	// ============================================================================
	// TASKS (KANBAN)
	// ============================================================================

	listTasks: protectedOrganizationProcedure
		.input(listTasksSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [eq(eventTaskTable.eventId, input.eventId)];

			if (input.status) {
				conditions.push(eq(eventTaskTable.status, input.status));
			}
			if (input.assigneeId) {
				conditions.push(eq(eventTaskTable.assigneeId, input.assigneeId));
			}
			if (input.priority) {
				conditions.push(eq(eventTaskTable.priority, input.priority));
			}

			return db.query.eventTaskTable.findMany({
				where: and(...conditions),
				orderBy: [
					asc(eventTaskTable.columnPosition),
					desc(eventTaskTable.createdAt),
				],
				with: {
					assignee: { columns: { id: true, name: true, image: true } },
				},
			});
		}),

	createTask: protectedOrganizationProcedure
		.input(createTaskSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const [task] = await db
				.insert(eventTaskTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					tags: input.tags ? JSON.stringify(input.tags) : null,
					createdBy: ctx.user.id,
				})
				.returning();

			return task;
		}),

	updateTask: protectedOrganizationProcedure
		.input(updateTaskSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventTaskTable.findFirst({
				where: and(
					eq(eventTaskTable.id, input.id),
					eq(eventTaskTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
			}

			const { id, tags, ...updateData } = input;

			const [updated] = await db
				.update(eventTaskTable)
				.set({
					...updateData,
					tags:
						tags !== undefined
							? tags
								? JSON.stringify(tags)
								: null
							: existing.tags,
				})
				.where(eq(eventTaskTable.id, id))
				.returning();

			return updated;
		}),

	moveTask: protectedOrganizationProcedure
		.input(moveTaskSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventTaskTable.findFirst({
				where: and(
					eq(eventTaskTable.id, input.id),
					eq(eventTaskTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
			}

			const [updated] = await db
				.update(eventTaskTable)
				.set({
					status: input.status,
					columnPosition: input.columnPosition,
					startedAt:
						input.status === "in_progress" && !existing.startedAt
							? new Date()
							: existing.startedAt,
					completedAt: input.status === "done" ? new Date() : null,
				})
				.where(eq(eventTaskTable.id, input.id))
				.returning();

			return updated;
		}),

	deleteTask: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventTaskTable.findFirst({
				where: and(
					eq(eventTaskTable.id, input.id),
					eq(eventTaskTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
			}

			await db.delete(eventTaskTable).where(eq(eventTaskTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// STAFF/VOLUNTEERS
	// ============================================================================

	listStaff: protectedOrganizationProcedure
		.input(listStaffSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [eq(eventStaffTable.eventId, input.eventId)];

			if (input.role) {
				conditions.push(eq(eventStaffTable.role, input.role));
			}
			if (input.staffType) {
				conditions.push(eq(eventStaffTable.staffType, input.staffType));
			}
			if (input.isConfirmed !== undefined) {
				conditions.push(eq(eventStaffTable.isConfirmed, input.isConfirmed));
			}

			return db.query.eventStaffTable.findMany({
				where: and(...conditions),
				orderBy: [asc(eventStaffTable.role), asc(eventStaffTable.createdAt)],
				with: {
					user: { columns: { id: true, name: true, email: true, image: true } },
					shifts: true,
				},
			});
		}),

	createStaff: protectedOrganizationProcedure
		.input(createStaffSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			// Validate based on staff type
			if (input.staffType === EventStaffType.systemUser && !input.userId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "User ID is required for system user staff type",
				});
			}
			if (input.staffType === EventStaffType.external && !input.externalName) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "External name is required for external staff type",
				});
			}

			const [staff] = await db
				.insert(eventStaffTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
				})
				.returning();

			return staff;
		}),

	updateStaff: protectedOrganizationProcedure
		.input(updateStaffSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventStaffTable.findFirst({
				where: and(
					eq(eventStaffTable.id, input.id),
					eq(eventStaffTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Staff not found" });
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventStaffTable)
				.set(updateData)
				.where(eq(eventStaffTable.id, id))
				.returning();

			return updated;
		}),

	confirmStaff: protectedOrganizationProcedure
		.input(confirmStaffSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventStaffTable.findFirst({
				where: and(
					eq(eventStaffTable.id, input.id),
					eq(eventStaffTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Staff not found" });
			}

			const [updated] = await db
				.update(eventStaffTable)
				.set({
					isConfirmed: input.confirmed,
					confirmedAt: input.confirmed ? new Date() : null,
				})
				.where(eq(eventStaffTable.id, input.id))
				.returning();

			return updated;
		}),

	deleteStaff: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventStaffTable.findFirst({
				where: and(
					eq(eventStaffTable.id, input.id),
					eq(eventStaffTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Staff not found" });
			}

			await db.delete(eventStaffTable).where(eq(eventStaffTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// STAFF SHIFTS
	// ============================================================================

	listShifts: protectedOrganizationProcedure
		.input(listShiftsSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [
				eq(eventStaffShiftTable.eventId, input.eventId),
			];

			if (input.staffId) {
				conditions.push(eq(eventStaffShiftTable.staffId, input.staffId));
			}
			if (input.zoneId) {
				conditions.push(eq(eventStaffShiftTable.zoneId, input.zoneId));
			}

			return db.query.eventStaffShiftTable.findMany({
				where: and(...conditions),
				orderBy: [
					asc(eventStaffShiftTable.shiftDate),
					asc(eventStaffShiftTable.startTime),
				],
				with: {
					staff: {
						with: {
							user: { columns: { id: true, name: true, image: true } },
						},
					},
					zone: true,
				},
			});
		}),

	createShift: protectedOrganizationProcedure
		.input(createShiftSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const [shift] = await db
				.insert(eventStaffShiftTable)
				.values(input)
				.returning();

			return shift;
		}),

	updateShift: protectedOrganizationProcedure
		.input(updateShiftSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventStaffShiftTable.findFirst({
				where: eq(eventStaffShiftTable.id, input.id),
				with: { event: true },
			});

			if (!existing || existing.event.organizationId !== ctx.organization.id) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Shift not found" });
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventStaffShiftTable)
				.set(updateData)
				.where(eq(eventStaffShiftTable.id, id))
				.returning();

			return updated;
		}),

	deleteShift: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventStaffShiftTable.findFirst({
				where: eq(eventStaffShiftTable.id, input.id),
				with: { event: true },
			});

			if (!existing || existing.event.organizationId !== ctx.organization.id) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Shift not found" });
			}

			await db
				.delete(eventStaffShiftTable)
				.where(eq(eventStaffShiftTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// BUDGET
	// ============================================================================

	listBudgetLines: protectedOrganizationProcedure
		.input(listBudgetLinesSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [
				eq(eventBudgetLineTable.eventId, input.eventId),
			];

			if (input.categoryId) {
				conditions.push(eq(eventBudgetLineTable.categoryId, input.categoryId));
			}
			if (input.status) {
				conditions.push(eq(eventBudgetLineTable.status, input.status));
			}
			if (input.isRevenue !== undefined) {
				conditions.push(eq(eventBudgetLineTable.isRevenue, input.isRevenue));
			}

			return db.query.eventBudgetLineTable.findMany({
				where: and(...conditions),
				orderBy: [asc(eventBudgetLineTable.name)],
				with: {
					category: true,
					vendor: true,
				},
			});
		}),

	createBudgetLine: protectedOrganizationProcedure
		.input(createBudgetLineSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const [line] = await db
				.insert(eventBudgetLineTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
				})
				.returning();

			return line;
		}),

	updateBudgetLine: protectedOrganizationProcedure
		.input(updateBudgetLineSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventBudgetLineTable.findFirst({
				where: and(
					eq(eventBudgetLineTable.id, input.id),
					eq(eventBudgetLineTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Budget line not found",
				});
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventBudgetLineTable)
				.set(updateData)
				.where(eq(eventBudgetLineTable.id, id))
				.returning();

			return updated;
		}),

	deleteBudgetLine: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventBudgetLineTable.findFirst({
				where: and(
					eq(eventBudgetLineTable.id, input.id),
					eq(eventBudgetLineTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Budget line not found",
				});
			}

			await db
				.delete(eventBudgetLineTable)
				.where(eq(eventBudgetLineTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// SPONSORS
	// ============================================================================

	listSponsors: protectedOrganizationProcedure
		.input(listSponsorsSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [eq(eventSponsorTable.eventId, input.eventId)];

			if (input.tier) {
				conditions.push(eq(eventSponsorTable.tier, input.tier));
			}

			return db.query.eventSponsorTable.findMany({
				where: and(...conditions),
				orderBy: [
					asc(eventSponsorTable.sortOrder),
					asc(eventSponsorTable.name),
				],
				with: {
					benefits: true,
				},
			});
		}),

	createSponsor: protectedOrganizationProcedure
		.input(createSponsorSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const [sponsor] = await db
				.insert(eventSponsorTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
				})
				.returning();

			return sponsor;
		}),

	updateSponsor: protectedOrganizationProcedure
		.input(updateSponsorSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventSponsorTable.findFirst({
				where: and(
					eq(eventSponsorTable.id, input.id),
					eq(eventSponsorTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor not found",
				});
			}

			const { id, contractSigned, ...updateData } = input;

			const [updated] = await db
				.update(eventSponsorTable)
				.set({
					...updateData,
					contractSigned: contractSigned ?? existing.contractSigned,
					contractSignedAt:
						contractSigned && !existing.contractSigned
							? new Date()
							: existing.contractSignedAt,
				})
				.where(eq(eventSponsorTable.id, id))
				.returning();

			return updated;
		}),

	deleteSponsor: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventSponsorTable.findFirst({
				where: and(
					eq(eventSponsorTable.id, input.id),
					eq(eventSponsorTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor not found",
				});
			}

			await db
				.delete(eventSponsorTable)
				.where(eq(eventSponsorTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// SPONSOR BENEFITS
	// ============================================================================

	listBenefits: protectedOrganizationProcedure
		.input(listBenefitsSchema)
		.query(async ({ ctx, input }) => {
			const sponsor = await db.query.eventSponsorTable.findFirst({
				where: and(
					eq(eventSponsorTable.id, input.sponsorId),
					eq(eventSponsorTable.organizationId, ctx.organization.id),
				),
			});

			if (!sponsor) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor not found",
				});
			}

			const conditions: SQL[] = [
				eq(eventSponsorBenefitTable.sponsorId, input.sponsorId),
			];

			if (input.status) {
				conditions.push(eq(eventSponsorBenefitTable.status, input.status));
			}

			return db.query.eventSponsorBenefitTable.findMany({
				where: and(...conditions),
				orderBy: [
					asc(eventSponsorBenefitTable.dueDate),
					asc(eventSponsorBenefitTable.title),
				],
			});
		}),

	createBenefit: protectedOrganizationProcedure
		.input(createBenefitSchema)
		.mutation(async ({ ctx, input }) => {
			const sponsor = await db.query.eventSponsorTable.findFirst({
				where: and(
					eq(eventSponsorTable.id, input.sponsorId),
					eq(eventSponsorTable.organizationId, ctx.organization.id),
				),
			});

			if (!sponsor) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor not found",
				});
			}

			const [benefit] = await db
				.insert(eventSponsorBenefitTable)
				.values(input)
				.returning();

			return benefit;
		}),

	updateBenefit: protectedOrganizationProcedure
		.input(updateBenefitSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventSponsorBenefitTable.findFirst({
				where: eq(eventSponsorBenefitTable.id, input.id),
				with: { sponsor: true },
			});

			if (
				!existing ||
				existing.sponsor.organizationId !== ctx.organization.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Benefit not found",
				});
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventSponsorBenefitTable)
				.set(updateData)
				.where(eq(eventSponsorBenefitTable.id, id))
				.returning();

			return updated;
		}),

	markBenefitDelivered: protectedOrganizationProcedure
		.input(markBenefitDeliveredSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventSponsorBenefitTable.findFirst({
				where: eq(eventSponsorBenefitTable.id, input.id),
				with: { sponsor: true },
			});

			if (
				!existing ||
				existing.sponsor.organizationId !== ctx.organization.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Benefit not found",
				});
			}

			const [updated] = await db
				.update(eventSponsorBenefitTable)
				.set({
					status: EventSponsorBenefitStatus.delivered,
					deliveredAt: new Date(),
					deliveryNotes: input.deliveryNotes,
				})
				.where(eq(eventSponsorBenefitTable.id, input.id))
				.returning();

			return updated;
		}),

	deleteBenefit: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventSponsorBenefitTable.findFirst({
				where: eq(eventSponsorBenefitTable.id, input.id),
				with: { sponsor: true },
			});

			if (
				!existing ||
				existing.sponsor.organizationId !== ctx.organization.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Benefit not found",
				});
			}

			await db
				.delete(eventSponsorBenefitTable)
				.where(eq(eventSponsorBenefitTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// MILESTONES
	// ============================================================================

	listMilestones: protectedOrganizationProcedure
		.input(listMilestonesSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [
				eq(eventMilestoneTable.eventId, input.eventId),
			];

			if (input.status) {
				conditions.push(eq(eventMilestoneTable.status, input.status));
			}
			if (input.responsibleId) {
				conditions.push(
					eq(eventMilestoneTable.responsibleId, input.responsibleId),
				);
			}

			return db.query.eventMilestoneTable.findMany({
				where: and(...conditions),
				orderBy: [asc(eventMilestoneTable.targetDate)],
				with: {
					responsible: { columns: { id: true, name: true, image: true } },
				},
			});
		}),

	createMilestone: protectedOrganizationProcedure
		.input(createMilestoneSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const [milestone] = await db
				.insert(eventMilestoneTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					dependsOn: input.dependsOn ? JSON.stringify(input.dependsOn) : null,
					createdBy: ctx.user.id,
				})
				.returning();

			return milestone;
		}),

	updateMilestone: protectedOrganizationProcedure
		.input(updateMilestoneSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventMilestoneTable.findFirst({
				where: and(
					eq(eventMilestoneTable.id, input.id),
					eq(eventMilestoneTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Milestone not found",
				});
			}

			const { id, dependsOn, status, ...updateData } = input;

			// Handle status transitions
			let completedAt = existing.completedAt;
			if (status === EventMilestoneStatus.completed && !existing.completedAt) {
				completedAt = new Date();
			} else if (status && status !== EventMilestoneStatus.completed) {
				completedAt = null;
			}

			const [updated] = await db
				.update(eventMilestoneTable)
				.set({
					...updateData,
					status,
					completedAt,
					dependsOn:
						dependsOn !== undefined
							? dependsOn
								? JSON.stringify(dependsOn)
								: null
							: existing.dependsOn,
				})
				.where(eq(eventMilestoneTable.id, id))
				.returning();

			return updated;
		}),

	deleteMilestone: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventMilestoneTable.findFirst({
				where: and(
					eq(eventMilestoneTable.id, input.id),
					eq(eventMilestoneTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Milestone not found",
				});
			}

			await db
				.delete(eventMilestoneTable)
				.where(eq(eventMilestoneTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// NOTES
	// ============================================================================

	listNotes: protectedOrganizationProcedure
		.input(listNotesSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [eq(eventNoteTable.eventId, input.eventId)];

			if (input.noteType) {
				conditions.push(eq(eventNoteTable.noteType, input.noteType));
			}
			if (input.relatedEntityType) {
				conditions.push(
					eq(eventNoteTable.relatedEntityType, input.relatedEntityType),
				);
			}
			if (input.relatedEntityId) {
				conditions.push(
					eq(eventNoteTable.relatedEntityId, input.relatedEntityId),
				);
			}

			return db.query.eventNoteTable.findMany({
				where: and(...conditions),
				orderBy: [
					desc(eventNoteTable.isPinned),
					desc(eventNoteTable.createdAt),
				],
				with: {
					author: { columns: { id: true, name: true, image: true } },
					replies: {
						with: {
							author: { columns: { id: true, name: true, image: true } },
						},
						orderBy: [asc(eventNoteTable.createdAt)],
					},
				},
			});
		}),

	createNote: protectedOrganizationProcedure
		.input(createNoteSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const [note] = await db
				.insert(eventNoteTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					mentions: input.mentions ? JSON.stringify(input.mentions) : null,
					authorId: ctx.user.id,
				})
				.returning();

			return note;
		}),

	updateNote: protectedOrganizationProcedure
		.input(updateNoteSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventNoteTable.findFirst({
				where: and(
					eq(eventNoteTable.id, input.id),
					eq(eventNoteTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" });
			}

			// Only author can edit
			if (existing.authorId !== ctx.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only author can edit this note",
				});
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventNoteTable)
				.set(updateData)
				.where(eq(eventNoteTable.id, id))
				.returning();

			return updated;
		}),

	pinNote: protectedOrganizationProcedure
		.input(pinNoteSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventNoteTable.findFirst({
				where: and(
					eq(eventNoteTable.id, input.id),
					eq(eventNoteTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" });
			}

			const [updated] = await db
				.update(eventNoteTable)
				.set({
					isPinned: input.pinned,
					pinnedAt: input.pinned ? new Date() : null,
					pinnedBy: input.pinned ? ctx.user.id : null,
				})
				.where(eq(eventNoteTable.id, input.id))
				.returning();

			return updated;
		}),

	deleteNote: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventNoteTable.findFirst({
				where: and(
					eq(eventNoteTable.id, input.id),
					eq(eventNoteTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Note not found" });
			}

			await db.delete(eventNoteTable).where(eq(eventNoteTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// DOCUMENTS
	// ============================================================================

	listDocuments: protectedOrganizationProcedure
		.input(listDocumentsSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [eq(eventDocumentTable.eventId, input.eventId)];

			if (input.documentType) {
				conditions.push(
					eq(eventDocumentTable.documentType, input.documentType),
				);
			}

			return db.query.eventDocumentTable.findMany({
				where: and(...conditions),
				orderBy: [desc(eventDocumentTable.createdAt)],
			});
		}),

	createDocument: protectedOrganizationProcedure
		.input(createDocumentSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const { tags, ...rest } = input;

			const [document] = await db
				.insert(eventDocumentTable)
				.values({
					...rest,
					organizationId: ctx.organization.id,
					uploadedBy: ctx.user.id,
					tags: tags ? JSON.stringify(tags) : null,
				})
				.returning();

			return document;
		}),

	deleteDocument: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventDocumentTable.findFirst({
				where: and(
					eq(eventDocumentTable.id, input.id),
					eq(eventDocumentTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found",
				});
			}

			await db
				.delete(eventDocumentTable)
				.where(eq(eventDocumentTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// INVENTORY
	// ============================================================================

	listInventory: protectedOrganizationProcedure
		.input(listInventorySchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [
				eq(eventInventoryTable.eventId, input.eventId),
			];

			if (input.category) {
				conditions.push(eq(eventInventoryTable.category, input.category));
			}
			if (input.status) {
				conditions.push(eq(eventInventoryTable.status, input.status));
			}
			if (input.zoneId) {
				conditions.push(eq(eventInventoryTable.zoneId, input.zoneId));
			}

			return db.query.eventInventoryTable.findMany({
				where: and(...conditions),
				orderBy: [
					asc(eventInventoryTable.category),
					asc(eventInventoryTable.name),
				],
				with: {
					vendor: true,
					zone: true,
					responsible: { columns: { id: true, name: true, image: true } },
				},
			});
		}),

	createInventoryItem: protectedOrganizationProcedure
		.input(createInventoryItemSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const [item] = await db
				.insert(eventInventoryTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
				})
				.returning();

			return item;
		}),

	updateInventoryItem: protectedOrganizationProcedure
		.input(updateInventoryItemSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventInventoryTable.findFirst({
				where: and(
					eq(eventInventoryTable.id, input.id),
					eq(eventInventoryTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Inventory item not found",
				});
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventInventoryTable)
				.set(updateData)
				.where(eq(eventInventoryTable.id, id))
				.returning();

			return updated;
		}),

	deleteInventoryItem: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventInventoryTable.findFirst({
				where: and(
					eq(eventInventoryTable.id, input.id),
					eq(eventInventoryTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Inventory item not found",
				});
			}

			await db
				.delete(eventInventoryTable)
				.where(eq(eventInventoryTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// VENDOR ASSIGNMENTS
	// ============================================================================

	listVendorAssignments: protectedOrganizationProcedure
		.input(listVendorAssignmentsSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			return db.query.eventVendorAssignmentTable.findMany({
				where: eq(eventVendorAssignmentTable.eventId, input.eventId),
				with: {
					vendor: true,
				},
			});
		}),

	createVendorAssignment: protectedOrganizationProcedure
		.input(createVendorAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			// Verify vendor belongs to org
			const vendor = await db.query.eventVendorTable.findFirst({
				where: and(
					eq(eventVendorTable.id, input.vendorId),
					eq(eventVendorTable.organizationId, ctx.organization.id),
				),
			});

			if (!vendor) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
			}

			const [assignment] = await db
				.insert(eventVendorAssignmentTable)
				.values(input)
				.returning();

			return assignment;
		}),

	updateVendorAssignment: protectedOrganizationProcedure
		.input(updateVendorAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventVendorAssignmentTable.findFirst({
				where: eq(eventVendorAssignmentTable.id, input.id),
				with: { event: true },
			});

			if (!existing || existing.event.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Vendor assignment not found",
				});
			}

			const { id, isConfirmed, ...updateData } = input;

			const [updated] = await db
				.update(eventVendorAssignmentTable)
				.set({
					...updateData,
					isConfirmed: isConfirmed ?? existing.isConfirmed,
					confirmedAt:
						isConfirmed && !existing.isConfirmed
							? new Date()
							: existing.confirmedAt,
				})
				.where(eq(eventVendorAssignmentTable.id, id))
				.returning();

			return updated;
		}),

	deleteVendorAssignment: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventVendorAssignmentTable.findFirst({
				where: eq(eventVendorAssignmentTable.id, input.id),
				with: { event: true },
			});

			if (!existing || existing.event.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Vendor assignment not found",
				});
			}

			await db
				.delete(eventVendorAssignmentTable)
				.where(eq(eventVendorAssignmentTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// RISKS
	// ============================================================================

	listRisks: protectedOrganizationProcedure
		.input(listRisksSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions: SQL[] = [eq(eventRiskTable.eventId, input.eventId)];

			if (input.category) {
				conditions.push(eq(eventRiskTable.category, input.category));
			}
			if (input.status) {
				conditions.push(eq(eventRiskTable.status, input.status));
			}
			if (input.severity) {
				conditions.push(eq(eventRiskTable.severity, input.severity));
			}
			if (input.ownerId) {
				conditions.push(eq(eventRiskTable.ownerId, input.ownerId));
			}

			return db.query.eventRiskTable.findMany({
				where: and(...conditions),
				orderBy: [desc(eventRiskTable.riskScore), asc(eventRiskTable.title)],
				with: {
					owner: { columns: { id: true, name: true, image: true } },
				},
			});
		}),

	createRisk: protectedOrganizationProcedure
		.input(createRiskSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			// Calculate risk score
			const severityScore: Record<string, number> = {
				low: 1,
				medium: 2,
				high: 3,
				critical: 4,
			};
			const probabilityScore: Record<string, number> = {
				unlikely: 1,
				possible: 2,
				likely: 3,
				almost_certain: 4,
			};
			const riskScore =
				(severityScore[input.severity] ?? 1) *
				(probabilityScore[input.probability] ?? 1);

			const [risk] = await db
				.insert(eventRiskTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					riskScore,
					createdBy: ctx.user.id,
				})
				.returning();

			if (!risk) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create risk",
				});
			}

			// Create initial log entry
			await db.insert(eventRiskLogTable).values({
				riskId: risk.id,
				action: "created",
				newStatus: input.status,
				description: "Risk created",
				userId: ctx.user.id,
			});

			return risk;
		}),

	updateRisk: protectedOrganizationProcedure
		.input(updateRiskSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventRiskTable.findFirst({
				where: and(
					eq(eventRiskTable.id, input.id),
					eq(eventRiskTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Risk not found" });
			}

			const { id, ...updateData } = input;

			// Recalculate risk score if severity or probability changed
			let riskScore = existing.riskScore;
			if (updateData.severity || updateData.probability) {
				const severityScore: Record<string, number> = {
					low: 1,
					medium: 2,
					high: 3,
					critical: 4,
				};
				const probabilityScore: Record<string, number> = {
					unlikely: 1,
					possible: 2,
					likely: 3,
					almost_certain: 4,
				};
				const severity = updateData.severity || existing.severity;
				const probability = updateData.probability || existing.probability;
				riskScore =
					(severityScore[severity] ?? 1) * (probabilityScore[probability] ?? 1);
			}

			const [updated] = await db
				.update(eventRiskTable)
				.set({
					...updateData,
					riskScore,
				})
				.where(eq(eventRiskTable.id, id))
				.returning();

			// Log status change if applicable
			if (updateData.status && updateData.status !== existing.status) {
				await db.insert(eventRiskLogTable).values({
					riskId: id,
					action: "status_change",
					previousStatus: existing.status,
					newStatus: updateData.status,
					description: `Status changed from ${existing.status} to ${updateData.status}`,
					userId: ctx.user.id,
				});
			}

			return updated;
		}),

	deleteRisk: protectedOrganizationProcedure
		.input(idSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventRiskTable.findFirst({
				where: and(
					eq(eventRiskTable.id, input.id),
					eq(eventRiskTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Risk not found" });
			}

			await db.delete(eventRiskTable).where(eq(eventRiskTable.id, input.id));
			return { success: true };
		}),

	listRiskLogs: protectedOrganizationProcedure
		.input(listRiskLogsSchema)
		.query(async ({ ctx, input }) => {
			const risk = await db.query.eventRiskTable.findFirst({
				where: and(
					eq(eventRiskTable.id, input.riskId),
					eq(eventRiskTable.organizationId, ctx.organization.id),
				),
			});

			if (!risk) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Risk not found" });
			}

			return db.query.eventRiskLogTable.findMany({
				where: eq(eventRiskLogTable.riskId, input.riskId),
				orderBy: [desc(eventRiskLogTable.createdAt)],
				with: {
					user: { columns: { id: true, name: true, image: true } },
				},
			});
		}),

	// ============================================================================
	// PROJECTION (Financial Projections)
	// ============================================================================

	getProjection: protectedOrganizationProcedure
		.input(idSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.id, ctx.organization.id);

			// Get all registrations for this event
			const registrations = await db
				.select({
					status: eventRegistrationTable.status,
					price: eventRegistrationTable.price,
					paidAmount: eventRegistrationTable.paidAmount,
					discountAmount: eventRegistrationTable.discountAmount,
				})
				.from(eventRegistrationTable)
				.where(
					and(
						eq(eventRegistrationTable.eventId, input.id),
						eq(eventRegistrationTable.organizationId, ctx.organization.id),
					),
				);

			// Get budget lines (expenses)
			const budgetLines = await db
				.select({
					plannedAmount: eventBudgetLineTable.plannedAmount,
					actualAmount: eventBudgetLineTable.actualAmount,
					isRevenue: eventBudgetLineTable.isRevenue,
					status: eventBudgetLineTable.status,
					name: eventBudgetLineTable.name,
				})
				.from(eventBudgetLineTable)
				.where(
					and(
						eq(eventBudgetLineTable.eventId, input.id),
						eq(eventBudgetLineTable.organizationId, ctx.organization.id),
					),
				);

			// Get recorded expenses from the expense table (linked to this event)
			const recordedExpenses = await db
				.select({
					amount: expenseTable.amount,
					description: expenseTable.description,
					category: expenseTable.category,
				})
				.from(expenseTable)
				.where(
					and(
						eq(expenseTable.eventId, input.id),
						eq(expenseTable.organizationId, ctx.organization.id),
					),
				);

			// Calculate registration metrics
			const registrationsByStatus = {
				confirmed: 0,
				pendingPayment: 0,
				waitlist: 0,
				cancelled: 0,
				refunded: 0,
				noShow: 0,
			};

			let expectedRevenue = 0; // From confirmed + pending registrations
			let collectedRevenue = 0; // Sum of paidAmount from active registrations
			let pendingPayments = 0; // Expected minus collected for active registrations
			let refundedAmount = 0; // Sum of paidAmount from refunded registrations
			let totalDiscounts = 0;

			for (const reg of registrations) {
				switch (reg.status) {
					case EventRegistrationStatus.confirmed:
						registrationsByStatus.confirmed++;
						expectedRevenue += reg.price;
						collectedRevenue += reg.paidAmount;
						break;
					case EventRegistrationStatus.pendingPayment:
						registrationsByStatus.pendingPayment++;
						expectedRevenue += reg.price;
						collectedRevenue += reg.paidAmount;
						break;
					case EventRegistrationStatus.waitlist:
						registrationsByStatus.waitlist++;
						break;
					case EventRegistrationStatus.cancelled:
						registrationsByStatus.cancelled++;
						break;
					case EventRegistrationStatus.refunded:
						registrationsByStatus.refunded++;
						refundedAmount += reg.paidAmount;
						break;
					case EventRegistrationStatus.noShow:
						registrationsByStatus.noShow++;
						break;
				}
				totalDiscounts += reg.discountAmount ?? 0;
			}

			// Pending is the difference between expected and collected
			pendingPayments = Math.max(0, expectedRevenue - collectedRevenue);

			// Calculate budget metrics (expenses only, not revenue lines)
			let plannedExpenses = 0;
			let actualExpenses = 0;
			let plannedBudgetRevenue = 0;
			let actualBudgetRevenue = 0;

			const expenseBreakdown: {
				name: string;
				planned: number;
				actual: number;
				variance: number;
			}[] = [];

			for (const line of budgetLines) {
				if (line.isRevenue) {
					plannedBudgetRevenue += line.plannedAmount;
					actualBudgetRevenue += line.actualAmount;
				} else {
					plannedExpenses += line.plannedAmount;
					actualExpenses += line.actualAmount;
					expenseBreakdown.push({
						name: line.name,
						planned: line.plannedAmount,
						actual: line.actualAmount,
						variance: line.plannedAmount - line.actualAmount,
					});
				}
			}

			// Calculate recorded expenses from the expense table
			let totalRecordedExpenses = 0;
			const recordedExpensesByCategory = new Map<string, number>();
			for (const expense of recordedExpenses) {
				totalRecordedExpenses += expense.amount;
				const cat = expense.category ?? expense.description;
				recordedExpensesByCategory.set(
					cat,
					(recordedExpensesByCategory.get(cat) ?? 0) + expense.amount,
				);
			}

			// If there are recorded expenses, add them to breakdown and actuals
			if (totalRecordedExpenses > 0) {
				actualExpenses += totalRecordedExpenses;
				for (const [name, amount] of recordedExpensesByCategory) {
					expenseBreakdown.push({
						name,
						planned: 0,
						actual: amount,
						variance: -amount,
					});
				}
			}

			// Calculate projections
			const projectedProfit = expectedRevenue - plannedExpenses;
			const currentProfit = collectedRevenue - actualExpenses;
			const projectedMargin =
				expectedRevenue > 0
					? Math.round((projectedProfit / expectedRevenue) * 100)
					: 0;
			const currentMargin =
				collectedRevenue > 0
					? Math.round((currentProfit / collectedRevenue) * 100)
					: 0;

			return {
				// Registration metrics
				registrations: {
					total:
						registrationsByStatus.confirmed +
						registrationsByStatus.pendingPayment,
					byStatus: registrationsByStatus,
				},

				// Revenue metrics
				revenue: {
					expected: expectedRevenue,
					collected: collectedRevenue,
					pending: pendingPayments,
					refunded: refundedAmount,
					discounts: totalDiscounts,
					collectionRate:
						expectedRevenue > 0
							? Math.round((collectedRevenue / expectedRevenue) * 100)
							: 0,
				},

				// Expense metrics
				expenses: {
					planned: plannedExpenses,
					actual: actualExpenses,
					variance: plannedExpenses - actualExpenses,
					executionRate:
						plannedExpenses > 0
							? Math.round((actualExpenses / plannedExpenses) * 100)
							: actualExpenses > 0
								? 100
								: 0,
					breakdown: expenseBreakdown,
				},

				// Budget revenue (from sponsors, etc.)
				budgetRevenue: {
					planned: plannedBudgetRevenue,
					actual: actualBudgetRevenue,
				},

				// Profit projections
				profit: {
					projected: projectedProfit,
					current: currentProfit,
					projectedMargin,
					currentMargin,
				},

				// Summary
				summary: {
					totalExpectedIncome: expectedRevenue + plannedBudgetRevenue,
					totalActualIncome: collectedRevenue + actualBudgetRevenue,
					totalPlannedCosts: plannedExpenses,
					totalActualCosts: actualExpenses,
					projectedBalance:
						expectedRevenue + plannedBudgetRevenue - plannedExpenses,
					currentBalance:
						collectedRevenue + actualBudgetRevenue - actualExpenses,
				},
			};
		}),
});
