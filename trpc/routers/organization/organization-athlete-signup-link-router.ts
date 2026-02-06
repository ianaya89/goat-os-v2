import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
	athleteGroupTable,
	athleteSignupLinkTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import {
	createAthleteSignupLinkSchema,
	deleteAthleteSignupLinkSchema,
	listAthleteSignupLinksSchema,
	updateAthleteSignupLinkSchema,
} from "@/schemas/organization-athlete-signup-link-schemas";
import { createTRPCRouter, protectedOrgAdminProcedure } from "@/trpc/init";

export const organizationAthleteSignupLinkRouter = createTRPCRouter({
	list: protectedOrgAdminProcedure
		.input(listAthleteSignupLinksSchema)
		.query(async ({ ctx, input }) => {
			const links = await db.query.athleteSignupLinkTable.findMany({
				where: eq(athleteSignupLinkTable.organizationId, ctx.organization.id),
				with: {
					athleteGroup: {
						columns: { id: true, name: true, sport: true },
					},
				},
				orderBy: desc(athleteSignupLinkTable.createdAt),
				limit: input.limit,
				offset: input.offset,
			});

			return links;
		}),

	create: protectedOrgAdminProcedure
		.input(createAthleteSignupLinkSchema)
		.mutation(async ({ ctx, input }) => {
			// If athleteGroupId provided, verify it belongs to this org
			if (input.athleteGroupId) {
				const group = await db.query.athleteGroupTable.findFirst({
					where: and(
						eq(athleteGroupTable.id, input.athleteGroupId),
						eq(athleteGroupTable.organizationId, ctx.organization.id),
					),
				});

				if (!group) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Athlete group not found in this organization",
					});
				}
			}

			const token = nanoid(24);

			const [link] = await db
				.insert(athleteSignupLinkTable)
				.values({
					organizationId: ctx.organization.id,
					token,
					name: input.name,
					athleteGroupId: input.athleteGroupId ?? null,
					isActive: input.isActive,
					createdBy: ctx.user.id,
				})
				.returning();

			logger.info(
				{
					linkId: link?.id,
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
				},
				"Athlete signup link created",
			);

			return link;
		}),

	update: protectedOrgAdminProcedure
		.input(updateAthleteSignupLinkSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.athleteSignupLinkTable.findFirst({
				where: and(
					eq(athleteSignupLinkTable.id, input.id),
					eq(athleteSignupLinkTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Signup link not found",
				});
			}

			// If athleteGroupId is changing, verify the new group belongs to this org
			if (input.athleteGroupId !== undefined && input.athleteGroupId !== null) {
				const group = await db.query.athleteGroupTable.findFirst({
					where: and(
						eq(athleteGroupTable.id, input.athleteGroupId),
						eq(athleteGroupTable.organizationId, ctx.organization.id),
					),
				});

				if (!group) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Athlete group not found in this organization",
					});
				}
			}

			const updateData: Record<string, unknown> = {};
			if (input.name !== undefined) updateData.name = input.name;
			if (input.isActive !== undefined) updateData.isActive = input.isActive;
			if (input.athleteGroupId !== undefined)
				updateData.athleteGroupId = input.athleteGroupId;

			const [updated] = await db
				.update(athleteSignupLinkTable)
				.set(updateData)
				.where(eq(athleteSignupLinkTable.id, input.id))
				.returning();

			logger.info(
				{
					linkId: input.id,
					organizationId: ctx.organization.id,
					changes: Object.keys(updateData),
				},
				"Athlete signup link updated",
			);

			return updated;
		}),

	delete: protectedOrgAdminProcedure
		.input(deleteAthleteSignupLinkSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.athleteSignupLinkTable.findFirst({
				where: and(
					eq(athleteSignupLinkTable.id, input.id),
					eq(athleteSignupLinkTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Signup link not found",
				});
			}

			await db
				.delete(athleteSignupLinkTable)
				.where(eq(athleteSignupLinkTable.id, input.id));

			logger.info(
				{
					linkId: input.id,
					organizationId: ctx.organization.id,
				},
				"Athlete signup link deleted",
			);

			return { success: true };
		}),
});
