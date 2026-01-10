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
import { locationTable } from "@/lib/db/schema/tables";
import {
	bulkDeleteLocationsSchema,
	bulkUpdateLocationsActiveSchema,
	createLocationSchema,
	deleteLocationSchema,
	listLocationsSchema,
	updateLocationSchema,
} from "@/schemas/organization-location-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationLocationRouter = createTRPCRouter({
	list: protectedOrganizationProcedure
		.input(listLocationsSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [eq(locationTable.organizationId, ctx.organization.id)];

			// Search query
			if (input.query) {
				conditions.push(
					or(
						ilike(locationTable.name, `%${input.query}%`),
						ilike(locationTable.address, `%${input.query}%`),
						ilike(locationTable.city, `%${input.query}%`),
					)!,
				);
			}

			// Active filter
			if (input.filters?.isActive !== undefined) {
				conditions.push(eq(locationTable.isActive, input.filters.isActive));
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "name":
					orderByColumn = sortDirection(locationTable.name);
					break;
				case "city":
					orderByColumn = sortDirection(locationTable.city);
					break;
				case "capacity":
					orderByColumn = sortDirection(locationTable.capacity);
					break;
				case "isActive":
					orderByColumn = sortDirection(locationTable.isActive);
					break;
				default:
					orderByColumn = sortDirection(locationTable.createdAt);
					break;
			}

			// Run queries in parallel
			const [locations, countResult] = await Promise.all([
				db.query.locationTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
				}),
				db.select({ count: count() }).from(locationTable).where(whereCondition),
			]);

			return { locations, total: countResult[0]?.count ?? 0 };
		}),

	get: protectedOrganizationProcedure
		.input(deleteLocationSchema)
		.query(async ({ ctx, input }) => {
			const location = await db.query.locationTable.findFirst({
				where: and(
					eq(locationTable.id, input.id),
					eq(locationTable.organizationId, ctx.organization.id),
				),
			});

			if (!location) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Location not found",
				});
			}

			return location;
		}),

	// Get all active locations (for dropdowns)
	listActive: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const locations = await db.query.locationTable.findMany({
			where: and(
				eq(locationTable.organizationId, ctx.organization.id),
				eq(locationTable.isActive, true),
			),
			orderBy: asc(locationTable.name),
			columns: {
				id: true,
				name: true,
				address: true,
				city: true,
			},
		});

		return locations;
	}),

	create: protectedOrganizationProcedure
		.input(createLocationSchema)
		.mutation(async ({ ctx, input }) => {
			const [location] = await db
				.insert(locationTable)
				.values({
					organizationId: ctx.organization.id,
					...input,
				})
				.returning();

			return location;
		}),

	update: protectedOrganizationProcedure
		.input(updateLocationSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updatedLocation] = await db
				.update(locationTable)
				.set(data)
				.where(
					and(
						eq(locationTable.id, id),
						eq(locationTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updatedLocation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Location not found",
				});
			}

			return updatedLocation;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteLocationSchema)
		.mutation(async ({ ctx, input }) => {
			const [deletedLocation] = await db
				.delete(locationTable)
				.where(
					and(
						eq(locationTable.id, input.id),
						eq(locationTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!deletedLocation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Location not found",
				});
			}

			return { success: true };
		}),

	bulkDelete: protectedOrganizationProcedure
		.input(bulkDeleteLocationsSchema)
		.mutation(async ({ ctx, input }) => {
			const deleted = await db
				.delete(locationTable)
				.where(
					and(
						inArray(locationTable.id, input.ids),
						eq(locationTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: locationTable.id });

			return { success: true, count: deleted.length };
		}),

	bulkUpdateActive: protectedOrganizationProcedure
		.input(bulkUpdateLocationsActiveSchema)
		.mutation(async ({ ctx, input }) => {
			const updated = await db
				.update(locationTable)
				.set({ isActive: input.isActive })
				.where(
					and(
						inArray(locationTable.id, input.ids),
						eq(locationTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: locationTable.id });

			return { success: true, count: updated.length };
		}),
});
