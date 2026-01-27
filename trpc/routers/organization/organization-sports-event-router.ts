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
	isNull,
	lte,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { createCashMovementIfCash } from "@/lib/cash-register-helpers";
import { db } from "@/lib/db";
import {
	CashMovementReferenceType,
	DiscountMode,
	DiscountValueType,
	EventPaymentStatus,
	EventRegistrationStatus,
	PricingTierType,
} from "@/lib/db/schema/enums";
import {
	ageCategoryTable,
	athleteTable,
	eventAgeCategoryTable,
	eventCoachTable,
	eventDiscountTable,
	eventDiscountUsageTable,
	eventPaymentTable,
	eventPricingTierTable,
	eventRegistrationTable,
	sportsEventTable,
} from "@/lib/db/schema/tables";
import { env } from "@/lib/env";
import {
	deleteObject,
	generateStorageKey,
	getSignedUploadUrl,
	getSignedUrl,
} from "@/lib/storage";
import {
	assignEventCoachSchema,
	bulkUpdateRegistrationStatusSchema,
	calculatePriceSchema,
	cancelEventRegistrationSchema,
	confirmFromWaitlistSchema,
	createAgeCategorySchema,
	createDiscountSchema,
	createEventPaymentSchema,
	createEventRegistrationSchema,
	createPricingTierSchema,
	createSportsEventSchema,
	deleteAgeCategorySchema,
	deleteDiscountSchema,
	deletePaymentReceiptSchema,
	deletePricingTierSchema,
	deleteSportsEventSchema,
	duplicateSportsEventSchema,
	getApplicableDiscountsSchema,
	getEventRegistrationSchema,
	getReceiptDownloadUrlSchema,
	getReceiptUploadUrlSchema,
	listAgeCategoriesSchema,
	listDiscountsSchema,
	listEventCoachesSchema,
	listEventPaymentsSchema,
	listEventRegistrationsSchema,
	listPricingTiersSchema,
	listSportsEventsSchema,
	processRefundSchema,
	registerExistingAthletesSchema,
	removeEventCoachSchema,
	updateAgeCategorySchema,
	updateDiscountSchema,
	updateEventAgeCategoriesSchema,
	updateEventPaymentSchema,
	updateEventRegistrationSchema,
	updatePaymentReceiptSchema,
	updatePricingTierSchema,
	updateSportsEventSchema,
	updateSportsEventStatusSchema,
	validateDiscountCodeSchema,
} from "@/schemas/organization-sports-event-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate the applicable price for a registration
 * Combines date-based and capacity-based tiers
 */
async function calculateRegistrationPrice(
	eventId: string,
	registrationNumber: number,
	ageCategoryId: string | null,
	now: Date = new Date(),
): Promise<{ price: number; tierId: string | null; tierName: string }> {
	const tiers = await db.query.eventPricingTierTable.findMany({
		where: and(
			eq(eventPricingTierTable.eventId, eventId),
			eq(eventPricingTierTable.isActive, true),
		),
		orderBy: [
			asc(eventPricingTierTable.sortOrder),
			asc(eventPricingTierTable.price),
		],
	});

	const applicableTiers = tiers.filter((tier) => {
		// Check age category match (null matches all)
		if (tier.ageCategoryId && tier.ageCategoryId !== ageCategoryId) {
			return false;
		}

		// Check date-based conditions
		if (tier.tierType === PricingTierType.dateBased) {
			if (tier.validFrom && now < tier.validFrom) return false;
			if (tier.validUntil && now > tier.validUntil) return false;
		}

		// Check capacity-based conditions
		if (tier.tierType === PricingTierType.capacityBased) {
			if (tier.capacityStart && registrationNumber < tier.capacityStart)
				return false;
			if (tier.capacityEnd && registrationNumber > tier.capacityEnd)
				return false;
		}

		return true;
	});

	if (applicableTiers.length === 0) {
		const baseTier = tiers[0];
		if (baseTier) {
			return {
				price: baseTier.price,
				tierId: baseTier.id,
				tierName: baseTier.name,
			};
		}
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No pricing configured for this event",
		});
	}

	const sortedTiers = applicableTiers.sort((a, b) => a.price - b.price);
	const bestTier = sortedTiers[0];

	if (!bestTier) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No pricing configured for this event",
		});
	}

	return {
		price: bestTier.price,
		tierId: bestTier.id,
		tierName: bestTier.name,
	};
}

// ============================================================================
// ROUTER
// ============================================================================

export const organizationSportsEventRouter = createTRPCRouter({
	// ============================================================================
	// AGE CATEGORIES
	// ============================================================================

	listAgeCategories: protectedOrganizationProcedure
		.input(listAgeCategoriesSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(ageCategoryTable.organizationId, ctx.organization.id),
			];

			if (!input.includeInactive) {
				conditions.push(eq(ageCategoryTable.isActive, true));
			}

			const categories = await db.query.ageCategoryTable.findMany({
				where: and(...conditions),
				orderBy: asc(ageCategoryTable.displayName),
			});

			return categories;
		}),

	createAgeCategory: protectedOrganizationProcedure
		.input(createAgeCategorySchema)
		.mutation(async ({ ctx, input }) => {
			const [category] = await db
				.insert(ageCategoryTable)
				.values({
					organizationId: ctx.organization.id,
					...input,
				})
				.returning();

			return category;
		}),

	updateAgeCategory: protectedOrganizationProcedure
		.input(updateAgeCategorySchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updated] = await db
				.update(ageCategoryTable)
				.set(data)
				.where(
					and(
						eq(ageCategoryTable.id, id),
						eq(ageCategoryTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Age category not found",
				});
			}

			return updated;
		}),

	deleteAgeCategory: protectedOrganizationProcedure
		.input(deleteAgeCategorySchema)
		.mutation(async ({ ctx, input }) => {
			const [deleted] = await db
				.delete(ageCategoryTable)
				.where(
					and(
						eq(ageCategoryTable.id, input.id),
						eq(ageCategoryTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!deleted) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Age category not found",
				});
			}

			return { success: true };
		}),

	// ============================================================================
	// SPORTS EVENTS
	// ============================================================================

	list: protectedOrganizationProcedure
		.input(listSportsEventsSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(sportsEventTable.organizationId, ctx.organization.id),
			];

			// Search query
			if (input.query) {
				conditions.push(
					or(
						ilike(sportsEventTable.title, `%${input.query}%`),
						ilike(sportsEventTable.description, `%${input.query}%`),
					)!,
				);
			}

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(inArray(sportsEventTable.status, input.filters.status));
			}

			// Event type filter
			if (input.filters?.eventType && input.filters.eventType.length > 0) {
				conditions.push(
					inArray(sportsEventTable.eventType, input.filters.eventType),
				);
			}

			// Date range filter
			if (input.filters?.dateRange) {
				conditions.push(
					gte(sportsEventTable.startDate, input.filters.dateRange.from),
				);
				conditions.push(
					lte(sportsEventTable.endDate, input.filters.dateRange.to),
				);
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "title":
					orderByColumn = sortDirection(sportsEventTable.title);
					break;
				case "startDate":
					orderByColumn = sortDirection(sportsEventTable.startDate);
					break;
				case "endDate":
					orderByColumn = sortDirection(sportsEventTable.endDate);
					break;
				case "status":
					orderByColumn = sortDirection(sportsEventTable.status);
					break;
				case "eventType":
					orderByColumn = sortDirection(sportsEventTable.eventType);
					break;
				default:
					orderByColumn = sortDirection(sportsEventTable.createdAt);
					break;
			}

			const [events, countResult] = await Promise.all([
				db.query.sportsEventTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						location: {
							columns: { id: true, name: true, city: true },
						},
						ageCategories: {
							with: {
								ageCategory: true,
							},
						},
					},
				}),
				db
					.select({ count: count() })
					.from(sportsEventTable)
					.where(whereCondition),
			]);

			return { events, total: countResult[0]?.count ?? 0 };
		}),

	get: protectedOrganizationProcedure
		.input(deleteSportsEventSchema)
		.query(async ({ ctx, input }) => {
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.id),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
				with: {
					location: true,
					ageCategories: {
						with: {
							ageCategory: true,
						},
					},
					pricingTiers: {
						where: eq(eventPricingTierTable.isActive, true),
						orderBy: asc(eventPricingTierTable.sortOrder),
					},
					coaches: {
						with: {
							coach: {
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

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			return {
				...event,
				organizationSlug: ctx.organization.slug,
			};
		}),

	create: protectedOrganizationProcedure
		.input(createSportsEventSchema)
		.mutation(async ({ ctx, input }) => {
			const { ageCategoryIds, coachIds, acceptedPaymentMethods, ...eventData } =
				input;

			// Check slug uniqueness
			const existingSlug = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.organizationId, ctx.organization.id),
					eq(sportsEventTable.slug, input.slug),
				),
			});

			if (existingSlug) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "An event with this slug already exists",
				});
			}

			const [event] = await db
				.insert(sportsEventTable)
				.values({
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
					acceptedPaymentMethods: acceptedPaymentMethods
						? JSON.stringify(acceptedPaymentMethods)
						: null,
					...eventData,
				})
				.returning();

			if (!event) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create event",
				});
			}

			// Link age categories
			if (ageCategoryIds && ageCategoryIds.length > 0) {
				await db.insert(eventAgeCategoryTable).values(
					ageCategoryIds.map((ageCategoryId) => ({
						eventId: event.id,
						ageCategoryId,
					})),
				);
			}

			// Assign coaches
			if (coachIds && coachIds.length > 0) {
				await db.insert(eventCoachTable).values(
					coachIds.map((coachId) => ({
						eventId: event.id,
						coachId,
					})),
				);
			}

			return event;
		}),

	update: protectedOrganizationProcedure
		.input(updateSportsEventSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, acceptedPaymentMethods, ageCategoryIds, ...data } = input;

			// Check slug uniqueness if changing
			if (data.slug) {
				const existingSlug = await db.query.sportsEventTable.findFirst({
					where: and(
						eq(sportsEventTable.organizationId, ctx.organization.id),
						eq(sportsEventTable.slug, data.slug),
					),
				});

				if (existingSlug && existingSlug.id !== id) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "An event with this slug already exists",
					});
				}
			}

			const updateData: Record<string, unknown> = { ...data };
			if (acceptedPaymentMethods !== undefined) {
				updateData.acceptedPaymentMethods = acceptedPaymentMethods
					? JSON.stringify(acceptedPaymentMethods)
					: null;
			}

			const [updated] = await db
				.update(sportsEventTable)
				.set(updateData)
				.where(
					and(
						eq(sportsEventTable.id, id),
						eq(sportsEventTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			// Update age categories if provided
			if (ageCategoryIds !== undefined) {
				// Delete existing associations
				await db
					.delete(eventAgeCategoryTable)
					.where(eq(eventAgeCategoryTable.eventId, id));

				// Create new associations
				if (ageCategoryIds.length > 0) {
					await db.insert(eventAgeCategoryTable).values(
						ageCategoryIds.map((ageCategoryId) => ({
							eventId: id,
							ageCategoryId,
						})),
					);
				}
			}

			return updated;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteSportsEventSchema)
		.mutation(async ({ ctx, input }) => {
			const [deleted] = await db
				.delete(sportsEventTable)
				.where(
					and(
						eq(sportsEventTable.id, input.id),
						eq(sportsEventTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!deleted) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			return { success: true };
		}),

	updateStatus: protectedOrganizationProcedure
		.input(updateSportsEventStatusSchema)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await db
				.update(sportsEventTable)
				.set({ status: input.status })
				.where(
					and(
						eq(sportsEventTable.id, input.id),
						eq(sportsEventTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			return updated;
		}),

	duplicate: protectedOrganizationProcedure
		.input(duplicateSportsEventSchema)
		.mutation(async ({ ctx, input }) => {
			// Get original event
			const original = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.id),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
				with: {
					ageCategories: true,
					pricingTiers: true,
					coaches: true,
				},
			});

			if (!original) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			// Check slug uniqueness
			const existingSlug = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.organizationId, ctx.organization.id),
					eq(sportsEventTable.slug, input.newSlug),
				),
			});

			if (existingSlug) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "An event with this slug already exists",
				});
			}

			// Create new event
			const [newEvent] = await db
				.insert(sportsEventTable)
				.values({
					organizationId: ctx.organization.id,
					title: input.newTitle,
					slug: input.newSlug,
					description: original.description,
					eventType: original.eventType,
					status: "draft",
					startDate: input.newStartDate,
					endDate: input.newEndDate,
					locationId: original.locationId,
					venueDetails: original.venueDetails,
					maxCapacity: original.maxCapacity,
					currentRegistrations: 0,
					enableWaitlist: original.enableWaitlist,
					maxWaitlistSize: original.maxWaitlistSize,
					allowPublicRegistration: original.allowPublicRegistration,
					allowEarlyAccessForMembers: original.allowEarlyAccessForMembers,
					memberEarlyAccessDays: original.memberEarlyAccessDays,
					requiresApproval: original.requiresApproval,
					currency: original.currency,
					acceptedPaymentMethods: original.acceptedPaymentMethods,
					contactEmail: original.contactEmail,
					contactPhone: original.contactPhone,
					coverImageUrl: original.coverImageUrl,
					createdBy: ctx.user.id,
				})
				.returning();

			if (!newEvent) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to duplicate event",
				});
			}

			// Copy age categories
			if (original.ageCategories.length > 0) {
				await db.insert(eventAgeCategoryTable).values(
					original.ageCategories.map((ac) => ({
						eventId: newEvent.id,
						ageCategoryId: ac.ageCategoryId,
						maxCapacity: ac.maxCapacity,
					})),
				);
			}

			// Copy pricing tiers
			if (original.pricingTiers.length > 0) {
				await db.insert(eventPricingTierTable).values(
					original.pricingTiers.map((tier) => ({
						eventId: newEvent.id,
						name: tier.name,
						description: tier.description,
						tierType: tier.tierType,
						price: tier.price,
						currency: tier.currency,
						capacityStart: tier.capacityStart,
						capacityEnd: tier.capacityEnd,
						ageCategoryId: tier.ageCategoryId,
						isActive: tier.isActive,
						sortOrder: tier.sortOrder,
					})),
				);
			}

			// Copy coaches
			if (original.coaches.length > 0) {
				await db.insert(eventCoachTable).values(
					original.coaches.map((c) => ({
						eventId: newEvent.id,
						coachId: c.coachId,
						role: c.role,
					})),
				);
			}

			return newEvent;
		}),

	// ============================================================================
	// EVENT AGE CATEGORIES
	// ============================================================================

	updateEventAgeCategories: protectedOrganizationProcedure
		.input(updateEventAgeCategoriesSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			// Delete existing associations
			await db
				.delete(eventAgeCategoryTable)
				.where(eq(eventAgeCategoryTable.eventId, input.eventId));

			// Create new associations
			if (input.ageCategoryIds.length > 0) {
				await db.insert(eventAgeCategoryTable).values(
					input.ageCategoryIds.map((ageCategoryId) => ({
						eventId: input.eventId,
						ageCategoryId,
					})),
				);
			}

			return { success: true };
		}),

	// ============================================================================
	// PRICING TIERS
	// ============================================================================

	listPricingTiers: protectedOrganizationProcedure
		.input(listPricingTiersSchema)
		.query(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			const conditions: SQL[] = [
				eq(eventPricingTierTable.eventId, input.eventId),
			];

			if (!input.includeInactive) {
				conditions.push(eq(eventPricingTierTable.isActive, true));
			}

			const tiers = await db.query.eventPricingTierTable.findMany({
				where: and(...conditions),
				orderBy: asc(eventPricingTierTable.sortOrder),
				with: {
					ageCategory: true,
				},
			});

			return tiers;
		}),

	createPricingTier: protectedOrganizationProcedure
		.input(createPricingTierSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			const [tier] = await db
				.insert(eventPricingTierTable)
				.values(input)
				.returning();

			return tier;
		}),

	updatePricingTier: protectedOrganizationProcedure
		.input(updatePricingTierSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Verify tier belongs to an event in this organization
			const tier = await db.query.eventPricingTierTable.findFirst({
				where: eq(eventPricingTierTable.id, id),
				with: {
					event: true,
				},
			});

			if (!tier || tier.event.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Pricing tier not found",
				});
			}

			const [updated] = await db
				.update(eventPricingTierTable)
				.set(data)
				.where(eq(eventPricingTierTable.id, id))
				.returning();

			return updated;
		}),

	deletePricingTier: protectedOrganizationProcedure
		.input(deletePricingTierSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify tier belongs to an event in this organization
			const tier = await db.query.eventPricingTierTable.findFirst({
				where: eq(eventPricingTierTable.id, input.id),
				with: {
					event: true,
				},
			});

			if (!tier || tier.event.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Pricing tier not found",
				});
			}

			await db
				.delete(eventPricingTierTable)
				.where(eq(eventPricingTierTable.id, input.id));

			return { success: true };
		}),

	calculatePrice: protectedOrganizationProcedure
		.input(calculatePriceSchema)
		.query(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			const nextRegistrationNumber = event.currentRegistrations + 1;
			const result = await calculateRegistrationPrice(
				input.eventId,
				nextRegistrationNumber,
				input.ageCategoryId ?? null,
			);

			return {
				...result,
				currency: event.currency,
				registrationNumber: nextRegistrationNumber,
			};
		}),

	// ============================================================================
	// REGISTRATIONS
	// ============================================================================

	listRegistrations: protectedOrganizationProcedure
		.input(listEventRegistrationsSchema)
		.query(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			const conditions: SQL[] = [
				eq(eventRegistrationTable.eventId, input.eventId),
			];

			// Search query
			if (input.query) {
				conditions.push(
					or(
						ilike(eventRegistrationTable.registrantName, `%${input.query}%`),
						ilike(eventRegistrationTable.registrantEmail, `%${input.query}%`),
					)!,
				);
			}

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(
					inArray(eventRegistrationTable.status, input.filters.status),
				);
			}

			// Age category filter
			if (input.filters?.ageCategoryId) {
				conditions.push(
					eq(eventRegistrationTable.ageCategoryId, input.filters.ageCategoryId),
				);
			}

			// Waitlist filter
			if (input.filters?.isWaitlist === true) {
				conditions.push(
					eq(eventRegistrationTable.status, EventRegistrationStatus.waitlist),
				);
			} else if (input.filters?.isWaitlist === false) {
				conditions.push(isNull(eventRegistrationTable.waitlistPosition));
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "registrantName":
					orderByColumn = sortDirection(eventRegistrationTable.registrantName);
					break;
				case "registrantEmail":
					orderByColumn = sortDirection(eventRegistrationTable.registrantEmail);
					break;
				case "status":
					orderByColumn = sortDirection(eventRegistrationTable.status);
					break;
				case "price":
					orderByColumn = sortDirection(eventRegistrationTable.price);
					break;
				case "registeredAt":
					orderByColumn = sortDirection(eventRegistrationTable.registeredAt);
					break;
				default:
					orderByColumn = sortDirection(
						eventRegistrationTable.registrationNumber,
					);
					break;
			}

			const [registrations, countResult] = await Promise.all([
				db.query.eventRegistrationTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						athlete: {
							columns: { id: true, sport: true, level: true },
						},
						ageCategory: true,
						payments: {
							where: eq(eventPaymentTable.status, EventPaymentStatus.paid),
						},
					},
				}),
				db
					.select({ count: count() })
					.from(eventRegistrationTable)
					.where(whereCondition),
			]);

			return { registrations, total: countResult[0]?.count ?? 0 };
		}),

	getRegistration: protectedOrganizationProcedure
		.input(getEventRegistrationSchema)
		.query(async ({ ctx, input }) => {
			const registration = await db.query.eventRegistrationTable.findFirst({
				where: and(
					eq(eventRegistrationTable.id, input.id),
					eq(eventRegistrationTable.organizationId, ctx.organization.id),
				),
				with: {
					event: true,
					athlete: true,
					user: {
						columns: { id: true, name: true, email: true, image: true },
					},
					ageCategory: true,
					appliedPricingTier: true,
					payments: true,
				},
			});

			if (!registration) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Registration not found",
				});
			}

			return registration;
		}),

	createRegistration: protectedOrganizationProcedure
		.input(createEventRegistrationSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			// Use transaction to prevent race conditions
			const result = await db.transaction(async (tx) => {
				// Get current registration count
				const [countResult] = await tx
					.select({ count: count() })
					.from(eventRegistrationTable)
					.where(eq(eventRegistrationTable.eventId, input.eventId));

				const currentCount = countResult?.count ?? 0;
				const registrationNumber = currentCount + 1;

				// Check capacity
				let status = input.status;
				let waitlistPosition: number | null = null;

				if (
					event.maxCapacity &&
					currentCount >= event.maxCapacity &&
					status !== EventRegistrationStatus.waitlist
				) {
					if (event.enableWaitlist) {
						status = EventRegistrationStatus.waitlist;
						// Get next waitlist position
						const [waitlistCount] = await tx
							.select({ count: count() })
							.from(eventRegistrationTable)
							.where(
								and(
									eq(eventRegistrationTable.eventId, input.eventId),
									eq(
										eventRegistrationTable.status,
										EventRegistrationStatus.waitlist,
									),
								),
							);
						waitlistPosition = (waitlistCount?.count ?? 0) + 1;
					} else {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Event is at capacity and waitlist is disabled",
						});
					}
				}

				// Calculate price
				let price = input.overridePrice;
				let tierId: string | null = null;

				if (price === undefined) {
					const priceResult = await calculateRegistrationPrice(
						input.eventId,
						registrationNumber,
						input.ageCategoryId ?? null,
					);
					price = priceResult.price;
					tierId = priceResult.tierId;
				}

				// Create registration
				const [registration] = await tx
					.insert(eventRegistrationTable)
					.values({
						eventId: input.eventId,
						organizationId: ctx.organization.id,
						registrationNumber,
						athleteId: input.athleteId,
						registrantName: input.registrantName,
						registrantEmail: input.registrantEmail,
						registrantPhone: input.registrantPhone,
						registrantBirthDate: input.registrantBirthDate,
						emergencyContactName: input.emergencyContactName,
						emergencyContactPhone: input.emergencyContactPhone,
						emergencyContactRelation: input.emergencyContactRelation,
						ageCategoryId: input.ageCategoryId,
						status,
						waitlistPosition,
						appliedPricingTierId: tierId,
						price,
						currency: event.currency,
						notes: input.notes,
						internalNotes: input.internalNotes,
						registrationSource: "admin",
					})
					.returning();

				// Update event registration count if not waitlist
				if (status !== EventRegistrationStatus.waitlist) {
					await tx
						.update(sportsEventTable)
						.set({
							currentRegistrations: sql`${sportsEventTable.currentRegistrations} + 1`,
						})
						.where(eq(sportsEventTable.id, input.eventId));
				}

				return registration;
			});

			return result;
		}),

	updateRegistration: protectedOrganizationProcedure
		.input(updateEventRegistrationSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updated] = await db
				.update(eventRegistrationTable)
				.set(data)
				.where(
					and(
						eq(eventRegistrationTable.id, id),
						eq(eventRegistrationTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Registration not found",
				});
			}

			return updated;
		}),

	cancelRegistration: protectedOrganizationProcedure
		.input(cancelEventRegistrationSchema)
		.mutation(async ({ ctx, input }) => {
			const registration = await db.query.eventRegistrationTable.findFirst({
				where: and(
					eq(eventRegistrationTable.id, input.id),
					eq(eventRegistrationTable.organizationId, ctx.organization.id),
				),
			});

			if (!registration) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Registration not found",
				});
			}

			const wasConfirmed =
				registration.status !== EventRegistrationStatus.waitlist &&
				registration.status !== EventRegistrationStatus.cancelled;

			const [updated] = await db
				.update(eventRegistrationTable)
				.set({
					status: EventRegistrationStatus.cancelled,
					cancelledAt: new Date(),
					internalNotes: input.reason
						? `${registration.internalNotes ?? ""}\nCancellation reason: ${input.reason}`.trim()
						: registration.internalNotes,
				})
				.where(eq(eventRegistrationTable.id, input.id))
				.returning();

			// Decrement event registration count if was confirmed
			if (wasConfirmed) {
				await db
					.update(sportsEventTable)
					.set({
						currentRegistrations: sql`GREATEST(${sportsEventTable.currentRegistrations} - 1, 0)`,
					})
					.where(eq(sportsEventTable.id, registration.eventId));
			}

			return updated;
		}),

	confirmFromWaitlist: protectedOrganizationProcedure
		.input(confirmFromWaitlistSchema)
		.mutation(async ({ ctx, input }) => {
			const registration = await db.query.eventRegistrationTable.findFirst({
				where: and(
					eq(eventRegistrationTable.id, input.id),
					eq(eventRegistrationTable.organizationId, ctx.organization.id),
					eq(eventRegistrationTable.status, EventRegistrationStatus.waitlist),
				),
			});

			if (!registration) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Waitlist registration not found",
				});
			}

			const [updated] = await db
				.update(eventRegistrationTable)
				.set({
					status: EventRegistrationStatus.pendingPayment,
					waitlistPosition: null,
				})
				.where(eq(eventRegistrationTable.id, input.id))
				.returning();

			// Increment event registration count
			await db
				.update(sportsEventTable)
				.set({
					currentRegistrations: sql`${sportsEventTable.currentRegistrations} + 1`,
				})
				.where(eq(sportsEventTable.id, registration.eventId));

			return updated;
		}),

	bulkUpdateRegistrationStatus: protectedOrganizationProcedure
		.input(bulkUpdateRegistrationStatusSchema)
		.mutation(async ({ ctx, input }) => {
			const updated = await db
				.update(eventRegistrationTable)
				.set({ status: input.status })
				.where(
					and(
						inArray(eventRegistrationTable.id, input.ids),
						eq(eventRegistrationTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: eventRegistrationTable.id });

			return { success: true, count: updated.length };
		}),

	// Register existing athletes from the organization to an event
	registerExistingAthletes: protectedOrganizationProcedure
		.input(registerExistingAthletesSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			// Get athletes with their user data (for name/email)
			const athletes = await db.query.athleteTable.findMany({
				where: and(
					inArray(athleteTable.id, input.athleteIds),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
				with: {
					user: {
						columns: {
							name: true,
							email: true,
						},
					},
				},
			});

			if (athletes.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No valid athletes found",
				});
			}

			// Check which athletes are already registered
			const existingRegistrations =
				await db.query.eventRegistrationTable.findMany({
					where: and(
						eq(eventRegistrationTable.eventId, input.eventId),
						inArray(
							eventRegistrationTable.athleteId,
							athletes.map((a) => a.id),
						),
					),
				});

			const alreadyRegisteredIds = new Set(
				existingRegistrations
					.filter((r) => r.athleteId)
					.map((r) => r.athleteId),
			);

			// Filter out already registered athletes
			const athletesToRegister = athletes.filter(
				(a) => !alreadyRegisteredIds.has(a.id),
			);

			if (athletesToRegister.length === 0) {
				return {
					success: true,
					registered: 0,
					skipped: athletes.length,
					message: "Todos los atletas ya están registrados",
				};
			}

			// Use transaction to prevent race conditions
			const result = await db.transaction(async (tx) => {
				// Get current registration count
				const [countResult] = await tx
					.select({ count: count() })
					.from(eventRegistrationTable)
					.where(eq(eventRegistrationTable.eventId, input.eventId));

				let currentCount = countResult?.count ?? 0;
				const registrations = [];

				for (const athlete of athletesToRegister) {
					currentCount++;
					const registrationNumber = currentCount;

					// Check capacity
					let status = input.status;
					let waitlistPosition: number | null = null;

					if (
						event.maxCapacity &&
						currentCount > event.maxCapacity &&
						status !== EventRegistrationStatus.waitlist
					) {
						if (event.enableWaitlist) {
							status = EventRegistrationStatus.waitlist;
							// Get next waitlist position
							const [waitlistCount] = await tx
								.select({ count: count() })
								.from(eventRegistrationTable)
								.where(
									and(
										eq(eventRegistrationTable.eventId, input.eventId),
										eq(
											eventRegistrationTable.status,
											EventRegistrationStatus.waitlist,
										),
									),
								);
							waitlistPosition = (waitlistCount?.count ?? 0) + 1;
						} else {
							// Skip this athlete - event is full
							continue;
						}
					}

					// Calculate price for this registration
					const priceResult = await calculateRegistrationPrice(
						input.eventId,
						registrationNumber,
						null, // No age category specified for bulk registration
					);

					const [registration] = await tx
						.insert(eventRegistrationTable)
						.values({
							eventId: input.eventId,
							organizationId: ctx.organization.id,
							registrationNumber,
							athleteId: athlete.id,
							userId: athlete.userId,
							registrantName: athlete.user?.name || "Sin nombre",
							registrantEmail:
								athlete.user?.email || `athlete-${athlete.id}@noemail.com`,
							registrantPhone: athlete.phone,
							registrantBirthDate: athlete.birthDate,
							// Use parent info as emergency contact
							emergencyContactName: athlete.parentName,
							emergencyContactPhone: athlete.parentPhone,
							emergencyContactRelation: athlete.parentRelationship,
							status,
							waitlistPosition,
							appliedPricingTierId: priceResult.tierId,
							price: priceResult.price,
							currency: event.currency,
							notes: input.notes,
							registrationSource: "admin",
						})
						.returning();

					if (registration) {
						registrations.push(registration);
					}
				}

				return registrations;
			});

			return {
				success: true,
				registered: result.length,
				skipped: athletes.length - athletesToRegister.length,
				registrations: result,
			};
		}),

	// ============================================================================
	// PAYMENTS
	// ============================================================================

	listPayments: protectedOrganizationProcedure
		.input(listEventPaymentsSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(eventPaymentTable.organizationId, ctx.organization.id),
			];

			if (input.registrationId) {
				conditions.push(
					eq(eventPaymentTable.registrationId, input.registrationId),
				);
			}

			if (input.eventId) {
				// Get registrations for this event
				const registrations = await db.query.eventRegistrationTable.findMany({
					where: eq(eventRegistrationTable.eventId, input.eventId),
					columns: { id: true },
				});
				const registrationIds = registrations.map((r) => r.id);
				if (registrationIds.length > 0) {
					conditions.push(
						inArray(eventPaymentTable.registrationId, registrationIds),
					);
				} else {
					return { payments: [], total: 0 };
				}
			}

			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(
					inArray(eventPaymentTable.status, input.filters.status),
				);
			}

			if (
				input.filters?.paymentMethod &&
				input.filters.paymentMethod.length > 0
			) {
				conditions.push(
					inArray(eventPaymentTable.paymentMethod, input.filters.paymentMethod),
				);
			}

			const whereCondition = and(...conditions);

			const [payments, countResult] = await Promise.all([
				db.query.eventPaymentTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: desc(eventPaymentTable.createdAt),
					with: {
						registration: {
							columns: {
								id: true,
								registrantName: true,
								registrantEmail: true,
							},
						},
					},
				}),
				db
					.select({ count: count() })
					.from(eventPaymentTable)
					.where(whereCondition),
			]);

			return { payments, total: countResult[0]?.count ?? 0 };
		}),

	createPayment: protectedOrganizationProcedure
		.input(createEventPaymentSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify registration belongs to organization
			const registration = await db.query.eventRegistrationTable.findFirst({
				where: and(
					eq(eventRegistrationTable.id, input.registrationId),
					eq(eventRegistrationTable.organizationId, ctx.organization.id),
				),
				with: {
					event: { columns: { title: true } },
				},
			});

			if (!registration) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Registration not found",
				});
			}

			const [payment] = await db
				.insert(eventPaymentTable)
				.values({
					registrationId: input.registrationId,
					organizationId: ctx.organization.id,
					amount: input.amount,
					currency: registration.currency,
					status: EventPaymentStatus.paid,
					paymentMethod: input.paymentMethod,
					paymentDate: input.paymentDate ?? new Date(),
					receiptNumber: input.receiptNumber,
					notes: input.notes,
					processedBy: ctx.user.id,
				})
				.returning();

			// Update registration paid amount
			const newPaidAmount = registration.paidAmount + input.amount;
			const newStatus =
				newPaidAmount >= registration.price
					? EventRegistrationStatus.confirmed
					: registration.status;

			await db
				.update(eventRegistrationTable)
				.set({
					paidAmount: newPaidAmount,
					status: newStatus,
					confirmedAt:
						newStatus === EventRegistrationStatus.confirmed
							? new Date()
							: registration.confirmedAt,
				})
				.where(eq(eventRegistrationTable.id, input.registrationId));

			// Create cash movement if payment is in cash
			if (payment) {
				const eventTitle = registration.event?.title ?? "Evento";
				const registrantName = registration.registrantName ?? "Participante";
				await createCashMovementIfCash({
					organizationId: ctx.organization.id,
					paymentMethod: input.paymentMethod,
					amount: input.amount,
					description: `Pago de evento "${eventTitle}" - ${registrantName}`,
					referenceType: CashMovementReferenceType.eventPayment,
					referenceId: payment.id,
					recordedBy: ctx.user.id,
				});
			}

			return payment;
		}),

	updatePayment: protectedOrganizationProcedure
		.input(updateEventPaymentSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updated] = await db
				.update(eventPaymentTable)
				.set(data)
				.where(
					and(
						eq(eventPaymentTable.id, id),
						eq(eventPaymentTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			return updated;
		}),

	processRefund: protectedOrganizationProcedure
		.input(processRefundSchema)
		.mutation(async ({ ctx, input }) => {
			const payment = await db.query.eventPaymentTable.findFirst({
				where: and(
					eq(eventPaymentTable.id, input.paymentId),
					eq(eventPaymentTable.organizationId, ctx.organization.id),
				),
				with: {
					registration: true,
				},
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			const currentRefunded = payment.refundedAmount ?? 0;
			const newRefundedAmount = currentRefunded + input.refundAmount;

			if (newRefundedAmount > payment.amount) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Refund amount exceeds payment amount",
				});
			}

			const [updated] = await db
				.update(eventPaymentTable)
				.set({
					refundedAmount: newRefundedAmount,
					refundedAt: new Date(),
					refundReason: input.reason,
					status:
						newRefundedAmount === payment.amount
							? EventPaymentStatus.refunded
							: EventPaymentStatus.partial,
				})
				.where(eq(eventPaymentTable.id, input.paymentId))
				.returning();

			// Update registration paid amount
			await db
				.update(eventRegistrationTable)
				.set({
					paidAmount: sql`GREATEST(${eventRegistrationTable.paidAmount} - ${input.refundAmount}, 0)`,
				})
				.where(eq(eventRegistrationTable.id, payment.registrationId));

			return updated;
		}),

	// ============================================================================
	// PAYMENT RECEIPT UPLOAD
	// ============================================================================

	getReceiptUploadUrl: protectedOrganizationProcedure
		.input(getReceiptUploadUrlSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify payment belongs to organization
			const payment = await db.query.eventPaymentTable.findFirst({
				where: and(
					eq(eventPaymentTable.id, input.paymentId),
					eq(eventPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			// Generate unique storage key
			const key = generateStorageKey(
				"payment-receipts",
				ctx.organization.id,
				input.filename,
			);

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			// Generate signed upload URL
			const uploadUrl = await getSignedUploadUrl(key, bucket, {
				contentType: input.contentType,
				expiresIn: 300, // 5 minutes to upload
			});

			return {
				uploadUrl,
				key,
			};
		}),

	updatePaymentReceipt: protectedOrganizationProcedure
		.input(updatePaymentReceiptSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify payment belongs to organization
			const payment = await db.query.eventPaymentTable.findFirst({
				where: and(
					eq(eventPaymentTable.id, input.paymentId),
					eq(eventPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			// Delete old receipt if exists
			if (payment.receiptImageKey) {
				const bucket = env.S3_BUCKET;
				if (bucket) {
					try {
						await deleteObject(payment.receiptImageKey, bucket);
					} catch {
						// Ignore deletion errors
					}
				}
			}

			// Update payment with new receipt
			const [updated] = await db
				.update(eventPaymentTable)
				.set({
					receiptImageKey: input.receiptImageKey,
					receiptImageUploadedAt: new Date(),
				})
				.where(eq(eventPaymentTable.id, input.paymentId))
				.returning();

			return updated;
		}),

	deletePaymentReceipt: protectedOrganizationProcedure
		.input(deletePaymentReceiptSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify payment belongs to organization
			const payment = await db.query.eventPaymentTable.findFirst({
				where: and(
					eq(eventPaymentTable.id, input.paymentId),
					eq(eventPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			if (!payment.receiptImageKey) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Payment has no receipt image",
				});
			}

			const bucket = env.S3_BUCKET;
			if (bucket) {
				try {
					await deleteObject(payment.receiptImageKey, bucket);
				} catch {
					// Ignore deletion errors
				}
			}

			// Update payment to remove receipt
			const [updated] = await db
				.update(eventPaymentTable)
				.set({
					receiptImageKey: null,
					receiptImageUploadedAt: null,
				})
				.where(eq(eventPaymentTable.id, input.paymentId))
				.returning();

			return updated;
		}),

	getReceiptDownloadUrl: protectedOrganizationProcedure
		.input(getReceiptDownloadUrlSchema)
		.query(async ({ ctx, input }) => {
			// Verify payment belongs to organization
			const payment = await db.query.eventPaymentTable.findFirst({
				where: and(
					eq(eventPaymentTable.id, input.paymentId),
					eq(eventPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			if (!payment.receiptImageKey) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Payment has no receipt image",
				});
			}

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			// Generate signed download URL (valid for 1 hour)
			const downloadUrl = await getSignedUrl(payment.receiptImageKey, bucket, {
				expiresIn: 3600,
			});

			return {
				downloadUrl,
				key: payment.receiptImageKey,
				uploadedAt: payment.receiptImageUploadedAt,
			};
		}),

	// ============================================================================
	// EVENT COACHES
	// ============================================================================

	listEventCoaches: protectedOrganizationProcedure
		.input(listEventCoachesSchema)
		.query(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			const coaches = await db.query.eventCoachTable.findMany({
				where: eq(eventCoachTable.eventId, input.eventId),
				with: {
					coach: {
						with: {
							user: {
								columns: { id: true, name: true, email: true, image: true },
							},
						},
					},
				},
			});

			return coaches;
		}),

	assignEventCoach: protectedOrganizationProcedure
		.input(assignEventCoachSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			const [assignment] = await db
				.insert(eventCoachTable)
				.values({
					eventId: input.eventId,
					coachId: input.coachId,
					role: input.role,
				})
				.onConflictDoNothing()
				.returning();

			return assignment ?? { eventId: input.eventId, coachId: input.coachId };
		}),

	removeEventCoach: protectedOrganizationProcedure
		.input(removeEventCoachSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			await db
				.delete(eventCoachTable)
				.where(
					and(
						eq(eventCoachTable.eventId, input.eventId),
						eq(eventCoachTable.coachId, input.coachId),
					),
				);

			return { success: true };
		}),

	// ============================================================================
	// EVENT DISCOUNTS
	// ============================================================================

	listDiscounts: protectedOrganizationProcedure
		.input(listDiscountsSchema)
		.query(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			const conditions = [eq(eventDiscountTable.eventId, input.eventId)];

			if (!input.includeInactive) {
				conditions.push(eq(eventDiscountTable.isActive, true));
			}

			const discounts = await db.query.eventDiscountTable.findMany({
				where: and(...conditions),
				orderBy: [
					desc(eventDiscountTable.priority),
					asc(eventDiscountTable.createdAt),
				],
			});

			return discounts;
		}),

	createDiscount: protectedOrganizationProcedure
		.input(createDiscountSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify event belongs to organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			// If code mode, verify code doesn't already exist for this event
			if (input.discountMode === DiscountMode.code && input.code) {
				const existingCode = await db.query.eventDiscountTable.findFirst({
					where: and(
						eq(eventDiscountTable.eventId, input.eventId),
						eq(eventDiscountTable.code, input.code),
					),
				});

				if (existingCode) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Ya existe un descuento con este código para este evento",
					});
				}
			}

			const [discount] = await db
				.insert(eventDiscountTable)
				.values({
					eventId: input.eventId,
					organizationId: ctx.organization.id,
					name: input.name,
					description: input.description,
					discountMode: input.discountMode,
					code: input.discountMode === DiscountMode.code ? input.code : null,
					discountValueType: input.discountValueType,
					discountValue: input.discountValue,
					maxUses: input.maxUses,
					maxUsesPerUser: input.maxUsesPerUser,
					validFrom: input.validFrom,
					validUntil: input.validUntil,
					minPurchaseAmount: input.minPurchaseAmount,
					priority: input.priority,
					isActive: input.isActive,
				})
				.returning();

			return discount;
		}),

	updateDiscount: protectedOrganizationProcedure
		.input(updateDiscountSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Verify discount belongs to organization
			const existing = await db.query.eventDiscountTable.findFirst({
				where: and(
					eq(eventDiscountTable.id, id),
					eq(eventDiscountTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Discount not found",
				});
			}

			// If changing to code mode and providing a code, verify it's unique
			const newMode = data.discountMode ?? existing.discountMode;
			const newCode = data.code ?? existing.code;

			if (
				newMode === DiscountMode.code &&
				newCode &&
				newCode !== existing.code
			) {
				const existingCode = await db.query.eventDiscountTable.findFirst({
					where: and(
						eq(eventDiscountTable.eventId, existing.eventId),
						eq(eventDiscountTable.code, newCode),
					),
				});

				if (existingCode && existingCode.id !== id) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Ya existe un descuento con este código para este evento",
					});
				}
			}

			const [updated] = await db
				.update(eventDiscountTable)
				.set({
					...data,
					// Clear code if mode is automatic
					code: newMode === DiscountMode.automatic ? null : newCode,
				})
				.where(eq(eventDiscountTable.id, id))
				.returning();

			return updated;
		}),

	deleteDiscount: protectedOrganizationProcedure
		.input(deleteDiscountSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify discount belongs to organization
			const existing = await db.query.eventDiscountTable.findFirst({
				where: and(
					eq(eventDiscountTable.id, input.id),
					eq(eventDiscountTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Discount not found",
				});
			}

			await db
				.delete(eventDiscountTable)
				.where(eq(eventDiscountTable.id, input.id));

			return { success: true };
		}),

	validateDiscountCode: protectedOrganizationProcedure
		.input(validateDiscountCodeSchema)
		.query(async ({ input }) => {
			const now = new Date();

			// Find the discount code
			const discount = await db.query.eventDiscountTable.findFirst({
				where: and(
					eq(eventDiscountTable.eventId, input.eventId),
					eq(eventDiscountTable.code, input.code),
					eq(eventDiscountTable.discountMode, DiscountMode.code),
					eq(eventDiscountTable.isActive, true),
				),
			});

			if (!discount) {
				return {
					valid: false,
					errorMessage: "Código de descuento no válido",
				};
			}

			// Check date validity
			if (discount.validFrom && now < discount.validFrom) {
				return {
					valid: false,
					errorMessage: "Este código aún no está activo",
				};
			}

			if (discount.validUntil && now > discount.validUntil) {
				return {
					valid: false,
					errorMessage: "Este código ha expirado",
				};
			}

			// Check total usage limit
			if (discount.maxUses && discount.currentUses >= discount.maxUses) {
				return {
					valid: false,
					errorMessage: "Este código ha alcanzado su límite de uso",
				};
			}

			// Check per-user limit
			if (discount.maxUsesPerUser) {
				const userUsages = await db
					.select({ count: count() })
					.from(eventDiscountUsageTable)
					.where(
						and(
							eq(eventDiscountUsageTable.discountId, discount.id),
							eq(eventDiscountUsageTable.userEmail, input.userEmail),
						),
					);

				if (userUsages[0] && userUsages[0].count >= discount.maxUsesPerUser) {
					return {
						valid: false,
						errorMessage:
							"Ya has usado este código el máximo de veces permitido",
					};
				}
			}

			// Check minimum purchase amount
			if (
				discount.minPurchaseAmount &&
				input.originalPrice < discount.minPurchaseAmount
			) {
				return {
					valid: false,
					errorMessage: `El monto mínimo de compra es ${discount.minPurchaseAmount / 100}`,
				};
			}

			// Calculate discount amount
			let discountAmount: number;
			if (discount.discountValueType === DiscountValueType.percentage) {
				discountAmount = Math.round(
					(input.originalPrice * discount.discountValue) / 100,
				);
			} else {
				discountAmount = Math.min(discount.discountValue, input.originalPrice);
			}

			return {
				valid: true,
				discount,
				discountAmount,
				finalPrice: Math.max(0, input.originalPrice - discountAmount),
			};
		}),

	getApplicableAutomaticDiscounts: protectedOrganizationProcedure
		.input(getApplicableDiscountsSchema)
		.query(async ({ input }) => {
			const now = new Date();

			// Find all active automatic discounts for this event
			const discounts = await db.query.eventDiscountTable.findMany({
				where: and(
					eq(eventDiscountTable.eventId, input.eventId),
					eq(eventDiscountTable.discountMode, DiscountMode.automatic),
					eq(eventDiscountTable.isActive, true),
				),
				orderBy: [desc(eventDiscountTable.priority)],
			});

			// Filter applicable discounts
			const applicableDiscounts = [];

			for (const discount of discounts) {
				// Check date validity
				if (discount.validFrom && now < discount.validFrom) {
					continue;
				}

				if (discount.validUntil && now > discount.validUntil) {
					continue;
				}

				// Check total usage limit
				if (discount.maxUses && discount.currentUses >= discount.maxUses) {
					continue;
				}

				// Check per-user limit
				if (discount.maxUsesPerUser) {
					const userUsages = await db
						.select({ count: count() })
						.from(eventDiscountUsageTable)
						.where(
							and(
								eq(eventDiscountUsageTable.discountId, discount.id),
								eq(eventDiscountUsageTable.userEmail, input.userEmail),
							),
						);

					if (userUsages[0] && userUsages[0].count >= discount.maxUsesPerUser) {
						continue;
					}
				}

				// Check minimum purchase amount
				if (
					discount.minPurchaseAmount &&
					input.originalPrice < discount.minPurchaseAmount
				) {
					continue;
				}

				// Calculate discount amount
				let discountAmount: number;
				if (discount.discountValueType === DiscountValueType.percentage) {
					discountAmount = Math.round(
						(input.originalPrice * discount.discountValue) / 100,
					);
				} else {
					discountAmount = Math.min(
						discount.discountValue,
						input.originalPrice,
					);
				}

				applicableDiscounts.push({
					discount,
					discountAmount,
					finalPrice: Math.max(0, input.originalPrice - discountAmount),
				});
			}

			// Return the best discount (highest discount amount due to priority ordering)
			if (applicableDiscounts.length > 0) {
				// Already sorted by priority, but let's also sort by discountAmount
				applicableDiscounts.sort((a, b) => b.discountAmount - a.discountAmount);
				return applicableDiscounts[0];
			}

			return null;
		}),

	// List events the current user (as athlete) is registered for
	listMyEvents: protectedOrganizationProcedure.query(async ({ ctx }) => {
		// First, find the athlete record for the current user
		const athlete = await db.query.athleteTable.findFirst({
			where: and(
				eq(athleteTable.userId, ctx.user.id),
				eq(athleteTable.organizationId, ctx.organization.id),
			),
		});

		if (!athlete) {
			return { registrations: [], athlete: null };
		}

		// Get all event registrations for this athlete
		const registrations = await db.query.eventRegistrationTable.findMany({
			where: and(
				eq(eventRegistrationTable.athleteId, athlete.id),
				eq(eventRegistrationTable.organizationId, ctx.organization.id),
			),
			orderBy: desc(eventRegistrationTable.createdAt),
			with: {
				event: {
					columns: {
						id: true,
						title: true,
						description: true,
						startDate: true,
						endDate: true,
						venueDetails: true,
						status: true,
						coverImageUrl: true,
					},
				},
				ageCategory: true,
			},
		});

		return { registrations, athlete };
	}),
});
