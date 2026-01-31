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
import { ServiceStatus } from "@/lib/db/schema/enums";
import {
	athleteGroupTable,
	servicePriceHistoryTable,
	serviceTable,
	trainingSessionTable,
} from "@/lib/db/schema/tables";
import {
	bulkDeleteServicesSchema,
	bulkUpdateServicesStatusSchema,
	createServiceSchema,
	deleteServiceSchema,
	getServicePriceHistorySchema,
	getServiceSchema,
	listServicesSchema,
	updateServicePriceSchema,
	updateServiceSchema,
} from "@/schemas/organization-service-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationServiceRouter = createTRPCRouter({
	// List services with filtering, sorting, and pagination
	list: protectedOrganizationProcedure
		.input(listServicesSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(serviceTable.organizationId, ctx.organization.id),
			];

			// Text search
			if (input.query) {
				conditions.push(
					or(
						ilike(serviceTable.name, `%${input.query}%`),
						ilike(serviceTable.description, `%${input.query}%`),
					) ?? eq(serviceTable.id, serviceTable.id),
				);
			}

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(inArray(serviceTable.status, input.filters.status));
			}

			// Sort
			const sortColumn =
				input.sortBy === "name"
					? serviceTable.name
					: input.sortBy === "currentPrice"
						? serviceTable.currentPrice
						: input.sortBy === "status"
							? serviceTable.status
							: serviceTable.createdAt;

			const orderFn = input.sortOrder === "desc" ? desc : asc;

			const services = await db.query.serviceTable.findMany({
				where: and(...conditions),
				orderBy: orderFn(sortColumn),
				limit: input.limit,
				offset: input.offset,
			});

			// Get total count for pagination
			const [totalResult] = await db
				.select({ count: count() })
				.from(serviceTable)
				.where(and(...conditions));

			return {
				items: services,
				total: totalResult?.count ?? 0,
			};
		}),

	// List only active services (for dropdowns/selectors)
	listActive: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const services = await db.query.serviceTable.findMany({
			where: and(
				eq(serviceTable.organizationId, ctx.organization.id),
				eq(serviceTable.status, ServiceStatus.active),
			),
			orderBy: [asc(serviceTable.sortOrder), asc(serviceTable.name)],
			columns: {
				id: true,
				name: true,
				currentPrice: true,
				currency: true,
			},
		});

		return services;
	}),

	// Get single service with price history
	get: protectedOrganizationProcedure
		.input(getServiceSchema)
		.query(async ({ ctx, input }) => {
			const service = await db.query.serviceTable.findFirst({
				where: and(
					eq(serviceTable.id, input.id),
					eq(serviceTable.organizationId, ctx.organization.id),
				),
				with: {
					priceHistory: {
						orderBy: desc(servicePriceHistoryTable.effectiveFrom),
						limit: 10,
						with: {
							createdByUser: {
								columns: { id: true, name: true },
							},
						},
					},
					createdByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			if (!service) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Servicio no encontrado",
				});
			}

			return service;
		}),

	// Create new service + initial price history entry
	create: protectedOrganizationProcedure
		.input(createServiceSchema)
		.mutation(async ({ ctx, input }) => {
			const [service] = await db
				.insert(serviceTable)
				.values({
					organizationId: ctx.organization.id,
					name: input.name,
					description: input.description,
					currentPrice: input.currentPrice,
					currency: input.currency,
					status: input.status,
					sortOrder: input.sortOrder,
					createdBy: ctx.user.id,
				})
				.returning();

			if (!service) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Error al crear servicio",
				});
			}

			// Create initial price history entry
			await db.insert(servicePriceHistoryTable).values({
				serviceId: service.id,
				price: input.currentPrice,
				currency: input.currency,
				effectiveFrom: new Date(),
				createdBy: ctx.user.id,
			});

			return service;
		}),

	// Update service metadata (name, description, status)
	update: protectedOrganizationProcedure
		.input(updateServiceSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.serviceTable.findFirst({
				where: and(
					eq(serviceTable.id, input.id),
					eq(serviceTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Servicio no encontrado",
				});
			}

			const { id, ...data } = input;

			const [updated] = await db
				.update(serviceTable)
				.set(data)
				.where(eq(serviceTable.id, id))
				.returning();

			return updated;
		}),

	// Update service price (creates new price history entry)
	updatePrice: protectedOrganizationProcedure
		.input(updateServicePriceSchema)
		.mutation(async ({ ctx, input }) => {
			const service = await db.query.serviceTable.findFirst({
				where: and(
					eq(serviceTable.id, input.id),
					eq(serviceTable.organizationId, ctx.organization.id),
				),
			});

			if (!service) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Servicio no encontrado",
				});
			}

			// Close the current active price history entry
			const currentActiveEntry =
				await db.query.servicePriceHistoryTable.findFirst({
					where: and(
						eq(servicePriceHistoryTable.serviceId, input.id),
						isNull(servicePriceHistoryTable.effectiveUntil),
					),
					orderBy: desc(servicePriceHistoryTable.effectiveFrom),
				});

			if (currentActiveEntry) {
				await db
					.update(servicePriceHistoryTable)
					.set({ effectiveUntil: input.effectiveFrom })
					.where(eq(servicePriceHistoryTable.id, currentActiveEntry.id));
			}

			// Create new price history entry
			await db.insert(servicePriceHistoryTable).values({
				serviceId: input.id,
				price: input.price,
				currency: service.currency,
				effectiveFrom: input.effectiveFrom,
				createdBy: ctx.user.id,
			});

			// Update current price on service
			const [updated] = await db
				.update(serviceTable)
				.set({ currentPrice: input.price })
				.where(eq(serviceTable.id, input.id))
				.returning();

			return updated;
		}),

	// Delete service (archive if referenced, hard delete otherwise)
	delete: protectedOrganizationProcedure
		.input(deleteServiceSchema)
		.mutation(async ({ ctx, input }) => {
			const service = await db.query.serviceTable.findFirst({
				where: and(
					eq(serviceTable.id, input.id),
					eq(serviceTable.organizationId, ctx.organization.id),
				),
			});

			if (!service) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Servicio no encontrado",
				});
			}

			// Check references
			const [sessionRef] = await db
				.select({ count: count() })
				.from(trainingSessionTable)
				.where(eq(trainingSessionTable.serviceId, input.id));

			const [groupRef] = await db
				.select({ count: count() })
				.from(athleteGroupTable)
				.where(eq(athleteGroupTable.serviceId, input.id));

			const hasReferences =
				(sessionRef?.count ?? 0) > 0 || (groupRef?.count ?? 0) > 0;

			if (hasReferences) {
				// Soft delete - archive
				const [updated] = await db
					.update(serviceTable)
					.set({ status: ServiceStatus.archived })
					.where(eq(serviceTable.id, input.id))
					.returning();
				return { deleted: false, archived: true, service: updated };
			}

			// Hard delete (cascade will clean up price history)
			await db.delete(serviceTable).where(eq(serviceTable.id, input.id));
			return { deleted: true, archived: false, service: null };
		}),

	// Bulk delete/archive services
	bulkDelete: protectedOrganizationProcedure
		.input(bulkDeleteServicesSchema)
		.mutation(async ({ ctx, input }) => {
			let archivedCount = 0;
			let deletedCount = 0;

			for (const id of input.ids) {
				const service = await db.query.serviceTable.findFirst({
					where: and(
						eq(serviceTable.id, id),
						eq(serviceTable.organizationId, ctx.organization.id),
					),
				});

				if (!service) continue;

				const [sessionRef] = await db
					.select({ count: count() })
					.from(trainingSessionTable)
					.where(eq(trainingSessionTable.serviceId, id));

				const [groupRef] = await db
					.select({ count: count() })
					.from(athleteGroupTable)
					.where(eq(athleteGroupTable.serviceId, id));

				const hasReferences =
					(sessionRef?.count ?? 0) > 0 || (groupRef?.count ?? 0) > 0;

				if (hasReferences) {
					await db
						.update(serviceTable)
						.set({ status: ServiceStatus.archived })
						.where(eq(serviceTable.id, id));
					archivedCount++;
				} else {
					await db.delete(serviceTable).where(eq(serviceTable.id, id));
					deletedCount++;
				}
			}

			return { archivedCount, deletedCount };
		}),

	// Bulk update services status
	bulkUpdateStatus: protectedOrganizationProcedure
		.input(bulkUpdateServicesStatusSchema)
		.mutation(async ({ ctx, input }) => {
			const updated = await db
				.update(serviceTable)
				.set({ status: input.status })
				.where(
					and(
						inArray(serviceTable.id, input.ids),
						eq(serviceTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: serviceTable.id });

			return { success: true, count: updated.length };
		}),

	// Get price history for a service
	getPriceHistory: protectedOrganizationProcedure
		.input(getServicePriceHistorySchema)
		.query(async ({ ctx, input }) => {
			// Verify service belongs to org
			const service = await db.query.serviceTable.findFirst({
				where: and(
					eq(serviceTable.id, input.serviceId),
					eq(serviceTable.organizationId, ctx.organization.id),
				),
				columns: { id: true },
			});

			if (!service) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Servicio no encontrado",
				});
			}

			const history = await db.query.servicePriceHistoryTable.findMany({
				where: eq(servicePriceHistoryTable.serviceId, input.serviceId),
				orderBy: desc(servicePriceHistoryTable.effectiveFrom),
				limit: input.limit,
				with: {
					createdByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			return history;
		}),
});
