import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
	ne,
	or,
	type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { seasonTable } from "@/lib/db/schema/tables";
import {
	createSeasonSchema,
	deleteSeasonSchema,
	getSeasonSchema,
	listSeasonsSchema,
	setCurrentSeasonSchema,
	updateSeasonSchema,
} from "@/schemas/organization-season-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationSeasonRouter = createTRPCRouter({
	list: protectedOrganizationProcedure
		.input(listSeasonsSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [eq(seasonTable.organizationId, ctx.organization.id)];

			// Search query
			if (input.query) {
				conditions.push(ilike(seasonTable.name, `%${input.query}%`));
			}

			// Active filter
			if (input.filters?.isActive !== undefined) {
				conditions.push(eq(seasonTable.isActive, input.filters.isActive));
			}

			// Current filter
			if (input.filters?.isCurrent !== undefined) {
				conditions.push(eq(seasonTable.isCurrent, input.filters.isCurrent));
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "name":
					orderByColumn = sortDirection(seasonTable.name);
					break;
				case "startDate":
					orderByColumn = sortDirection(seasonTable.startDate);
					break;
				case "endDate":
					orderByColumn = sortDirection(seasonTable.endDate);
					break;
				case "isActive":
					orderByColumn = sortDirection(seasonTable.isActive);
					break;
				default:
					orderByColumn = sortDirection(seasonTable.createdAt);
					break;
			}

			const [seasons, countResult] = await Promise.all([
				db.query.seasonTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
				}),
				db.select({ count: count() }).from(seasonTable).where(whereCondition),
			]);

			return { seasons, total: countResult[0]?.count ?? 0 };
		}),

	get: protectedOrganizationProcedure
		.input(getSeasonSchema)
		.query(async ({ ctx, input }) => {
			const season = await db.query.seasonTable.findFirst({
				where: and(
					eq(seasonTable.id, input.id),
					eq(seasonTable.organizationId, ctx.organization.id),
				),
				with: {
					teams: true,
					competitions: true,
				},
			});

			if (!season) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Season not found",
				});
			}

			return season;
		}),

	listActive: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const seasons = await db.query.seasonTable.findMany({
			where: and(
				eq(seasonTable.organizationId, ctx.organization.id),
				eq(seasonTable.isActive, true),
			),
			orderBy: desc(seasonTable.startDate),
		});

		return seasons;
	}),

	create: protectedOrganizationProcedure
		.input(createSeasonSchema)
		.mutation(async ({ ctx, input }) => {
			// Check for duplicate name
			const existing = await db.query.seasonTable.findFirst({
				where: and(
					eq(seasonTable.organizationId, ctx.organization.id),
					eq(seasonTable.name, input.name),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A season with this name already exists",
				});
			}

			// If setting as current, unset other current seasons
			if (input.isCurrent) {
				await db
					.update(seasonTable)
					.set({ isCurrent: false })
					.where(
						and(
							eq(seasonTable.organizationId, ctx.organization.id),
							eq(seasonTable.isCurrent, true),
						),
					);
			}

			const [season] = await db
				.insert(seasonTable)
				.values({
					organizationId: ctx.organization.id,
					name: input.name,
					startDate: input.startDate,
					endDate: input.endDate,
					isActive: input.isActive,
					isCurrent: input.isCurrent,
					createdBy: ctx.user.id,
				})
				.returning();

			return season;
		}),

	update: protectedOrganizationProcedure
		.input(updateSeasonSchema)
		.mutation(async ({ ctx, input }) => {
			const season = await db.query.seasonTable.findFirst({
				where: and(
					eq(seasonTable.id, input.id),
					eq(seasonTable.organizationId, ctx.organization.id),
				),
			});

			if (!season) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Season not found",
				});
			}

			// Check for duplicate name if name is being changed
			if (input.name && input.name !== season.name) {
				const existing = await db.query.seasonTable.findFirst({
					where: and(
						eq(seasonTable.organizationId, ctx.organization.id),
						eq(seasonTable.name, input.name),
						ne(seasonTable.id, input.id),
					),
				});

				if (existing) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A season with this name already exists",
					});
				}
			}

			// If setting as current, unset other current seasons
			if (input.isCurrent) {
				await db
					.update(seasonTable)
					.set({ isCurrent: false })
					.where(
						and(
							eq(seasonTable.organizationId, ctx.organization.id),
							eq(seasonTable.isCurrent, true),
							ne(seasonTable.id, input.id),
						),
					);
			}

			const [updated] = await db
				.update(seasonTable)
				.set({
					name: input.name,
					startDate: input.startDate,
					endDate: input.endDate,
					isActive: input.isActive,
					isCurrent: input.isCurrent,
				})
				.where(eq(seasonTable.id, input.id))
				.returning();

			return updated;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteSeasonSchema)
		.mutation(async ({ ctx, input }) => {
			const season = await db.query.seasonTable.findFirst({
				where: and(
					eq(seasonTable.id, input.id),
					eq(seasonTable.organizationId, ctx.organization.id),
				),
			});

			if (!season) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Season not found",
				});
			}

			await db.delete(seasonTable).where(eq(seasonTable.id, input.id));

			return { success: true };
		}),

	setCurrent: protectedOrganizationProcedure
		.input(setCurrentSeasonSchema)
		.mutation(async ({ ctx, input }) => {
			const season = await db.query.seasonTable.findFirst({
				where: and(
					eq(seasonTable.id, input.id),
					eq(seasonTable.organizationId, ctx.organization.id),
				),
			});

			if (!season) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Season not found",
				});
			}

			// Unset other current seasons
			await db
				.update(seasonTable)
				.set({ isCurrent: false })
				.where(
					and(
						eq(seasonTable.organizationId, ctx.organization.id),
						eq(seasonTable.isCurrent, true),
					),
				);

			// Set this season as current
			const [updated] = await db
				.update(seasonTable)
				.set({ isCurrent: true })
				.where(eq(seasonTable.id, input.id))
				.returning();

			return updated;
		}),
});
