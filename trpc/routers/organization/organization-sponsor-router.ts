import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	eventSponsorAssignmentTable,
	sponsorTable,
	sportsEventTable,
} from "@/lib/db/schema/tables";
import {
	confirmSponsorAssignmentSchema,
	createSponsorAssignmentSchema,
	createSponsorOrgSchema,
	deleteSponsorAssignmentSchema,
	deleteSponsorOrgSchema,
	listSponsorAssignmentsSchema,
	listSponsorsOrgSchema,
	updateSponsorAssignmentSchema,
	updateSponsorOrgSchema,
} from "@/schemas/organization-sponsor-schemas";
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

export const organizationSponsorRouter = createTRPCRouter({
	// ============================================================================
	// SPONSORS (Organization-level)
	// ============================================================================

	list: protectedOrganizationProcedure
		.input(listSponsorsOrgSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(sponsorTable.organizationId, ctx.organization.id),
			];

			if (!input.includeInactive) {
				conditions.push(eq(sponsorTable.isActive, true));
			}

			if (input.status) {
				conditions.push(eq(sponsorTable.status, input.status));
			}

			if (input.tier) {
				conditions.push(eq(sponsorTable.tier, input.tier));
			}

			if (input.query) {
				conditions.push(
					or(
						ilike(sponsorTable.name, `%${input.query}%`),
						ilike(sponsorTable.contactName, `%${input.query}%`),
					) as SQL,
				);
			}

			return db.query.sponsorTable.findMany({
				where: and(...conditions),
				orderBy: [asc(sponsorTable.name)],
			});
		}),

	get: protectedOrganizationProcedure
		.input(deleteSponsorOrgSchema)
		.query(async ({ ctx, input }) => {
			const sponsor = await db.query.sponsorTable.findFirst({
				where: and(
					eq(sponsorTable.id, input.id),
					eq(sponsorTable.organizationId, ctx.organization.id),
				),
				with: {
					eventAssignments: {
						with: {
							event: {
								columns: {
									id: true,
									title: true,
									startDate: true,
									endDate: true,
								},
							},
						},
					},
				},
			});

			if (!sponsor) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor not found",
				});
			}

			return sponsor;
		}),

	create: protectedOrganizationProcedure
		.input(createSponsorOrgSchema)
		.mutation(async ({ ctx, input }) => {
			// Check for duplicate name
			const existing = await db.query.sponsorTable.findFirst({
				where: and(
					eq(sponsorTable.organizationId, ctx.organization.id),
					eq(sponsorTable.name, input.name),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A sponsor with this name already exists",
				});
			}

			const [sponsor] = await db
				.insert(sponsorTable)
				.values({
					organizationId: ctx.organization.id,
					...input,
					createdBy: ctx.user.id,
				})
				.returning();

			return sponsor;
		}),

	update: protectedOrganizationProcedure
		.input(updateSponsorOrgSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.sponsorTable.findFirst({
				where: and(
					eq(sponsorTable.id, input.id),
					eq(sponsorTable.organizationId, ctx.organization.id),
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
				.update(sponsorTable)
				.set(updateData)
				.where(eq(sponsorTable.id, id))
				.returning();

			return updated;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteSponsorOrgSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.sponsorTable.findFirst({
				where: and(
					eq(sponsorTable.id, input.id),
					eq(sponsorTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor not found",
				});
			}

			// Soft delete - mark as inactive
			const [updated] = await db
				.update(sponsorTable)
				.set({ isActive: false })
				.where(eq(sponsorTable.id, input.id))
				.returning();

			return updated;
		}),

	// ============================================================================
	// SPONSOR ASSIGNMENTS (Event-level)
	// ============================================================================

	listAssignments: protectedOrganizationProcedure
		.input(listSponsorAssignmentsSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			return db.query.eventSponsorAssignmentTable.findMany({
				where: eq(eventSponsorAssignmentTable.eventId, input.eventId),
				orderBy: [asc(eventSponsorAssignmentTable.sortOrder)],
				with: {
					sponsor: true,
				},
			});
		}),

	createAssignment: protectedOrganizationProcedure
		.input(createSponsorAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			// Verify sponsor belongs to organization
			const sponsor = await db.query.sponsorTable.findFirst({
				where: and(
					eq(sponsorTable.id, input.sponsorId),
					eq(sponsorTable.organizationId, ctx.organization.id),
				),
			});

			if (!sponsor) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor not found",
				});
			}

			// Check if already assigned
			const existing = await db.query.eventSponsorAssignmentTable.findFirst({
				where: and(
					eq(eventSponsorAssignmentTable.eventId, input.eventId),
					eq(eventSponsorAssignmentTable.sponsorId, input.sponsorId),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "This sponsor is already assigned to this event",
				});
			}

			const [assignment] = await db
				.insert(eventSponsorAssignmentTable)
				.values({
					...input,
				})
				.returning();

			return assignment;
		}),

	updateAssignment: protectedOrganizationProcedure
		.input(updateSponsorAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventSponsorAssignmentTable.findFirst({
				where: eq(eventSponsorAssignmentTable.id, input.id),
				with: {
					event: true,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor assignment not found",
				});
			}

			// Verify event ownership
			await verifyEventOwnership(existing.eventId, ctx.organization.id);

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventSponsorAssignmentTable)
				.set(updateData)
				.where(eq(eventSponsorAssignmentTable.id, id))
				.returning();

			return updated;
		}),

	deleteAssignment: protectedOrganizationProcedure
		.input(deleteSponsorAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventSponsorAssignmentTable.findFirst({
				where: eq(eventSponsorAssignmentTable.id, input.id),
				with: {
					event: true,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor assignment not found",
				});
			}

			// Verify event ownership
			await verifyEventOwnership(existing.eventId, ctx.organization.id);

			await db
				.delete(eventSponsorAssignmentTable)
				.where(eq(eventSponsorAssignmentTable.id, input.id));

			return { success: true };
		}),

	confirmAssignment: protectedOrganizationProcedure
		.input(confirmSponsorAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventSponsorAssignmentTable.findFirst({
				where: eq(eventSponsorAssignmentTable.id, input.id),
				with: {
					event: true,
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sponsor assignment not found",
				});
			}

			// Verify event ownership
			await verifyEventOwnership(existing.eventId, ctx.organization.id);

			const [updated] = await db
				.update(eventSponsorAssignmentTable)
				.set({
					isConfirmed: input.confirmed,
					confirmedAt: input.confirmed ? new Date() : null,
				})
				.where(eq(eventSponsorAssignmentTable.id, input.id))
				.returning();

			return updated;
		}),
});
