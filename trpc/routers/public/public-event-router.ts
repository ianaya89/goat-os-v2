import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
	EventRegistrationStatus,
	EventStatus,
	PricingTierType,
} from "@/lib/db/schema/enums";
import {
	accountTable,
	ageCategoryTable,
	athleteTable,
	eventAgeCategoryTable,
	eventPricingTierTable,
	eventRegistrationTable,
	organizationTable,
	sportsEventTable,
	userTable,
} from "@/lib/db/schema/tables";
import {
	checkRegistrationEmailSchema,
	getPublicEventSchema,
	listPublicEventsSchema,
	publicEventRegistrationSchema,
} from "@/schemas/organization-sports-event-schemas";
import { lookupAthleteByEmailSchema } from "@/schemas/public-event-registration-wizard-schemas";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";

/**
 * Calculate the applicable price for a registration
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
		if (tier.ageCategoryId && tier.ageCategoryId !== ageCategoryId) {
			return false;
		}

		if (tier.tierType === PricingTierType.dateBased) {
			if (tier.validFrom && now < tier.validFrom) return false;
			if (tier.validUntil && now > tier.validUntil) return false;
		}

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

export const publicEventRouter = createTRPCRouter({
	/**
	 * Get a public event by organization and event slug
	 */
	getBySlug: publicProcedure
		.input(getPublicEventSchema)
		.query(async ({ input }) => {
			// Find organization by slug
			const organization = await db.query.organizationTable.findFirst({
				where: eq(organizationTable.slug, input.organizationSlug),
			});

			if (!organization) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organization not found",
				});
			}

			// Find event by slug within organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.organizationId, organization.id),
					eq(sportsEventTable.slug, input.eventSlug),
					// Only show published or registration_open events
					inArray(sportsEventTable.status, [
						EventStatus.published,
						EventStatus.registrationOpen,
						EventStatus.inProgress,
					]),
				),
				with: {
					location: {
						columns: { id: true, name: true, address: true, city: true },
					},
					ageCategories: {
						with: {
							ageCategory: true,
						},
					},
					pricingTiers: {
						where: eq(eventPricingTierTable.isActive, true),
						orderBy: asc(eventPricingTierTable.sortOrder),
					},
				},
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			// Calculate availability
			const spotsAvailable = event.maxCapacity
				? event.maxCapacity - event.currentRegistrations
				: null;

			// Get waitlist count if event is full
			let waitlistCount = 0;
			if (spotsAvailable !== null && spotsAvailable <= 0) {
				const [waitlistResult] = await db
					.select({ count: count() })
					.from(eventRegistrationTable)
					.where(
						and(
							eq(eventRegistrationTable.eventId, event.id),
							eq(
								eventRegistrationTable.status,
								EventRegistrationStatus.waitlist,
							),
						),
					);
				waitlistCount = waitlistResult?.count ?? 0;
			}

			return {
				...event,
				organization: {
					id: organization.id,
					name: organization.name,
					slug: organization.slug,
					logo: organization.logo,
				},
				spotsAvailable,
				waitlistCount,
				isRegistrationOpen:
					event.status === EventStatus.registrationOpen &&
					(!event.registrationCloseDate ||
						new Date() < event.registrationCloseDate),
			};
		}),

	/**
	 * List public events for an organization
	 */
	list: publicProcedure
		.input(listPublicEventsSchema)
		.query(async ({ input }) => {
			// Find organization by slug
			const organization = await db.query.organizationTable.findFirst({
				where: eq(organizationTable.slug, input.organizationSlug),
			});

			if (!organization) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organization not found",
				});
			}

			const conditions = [
				eq(sportsEventTable.organizationId, organization.id),
				inArray(sportsEventTable.status, [
					EventStatus.published,
					EventStatus.registrationOpen,
					EventStatus.inProgress,
				]),
				// Only show future or ongoing events
				gte(sportsEventTable.endDate, new Date()),
			];

			if (input.eventType) {
				conditions.push(eq(sportsEventTable.eventType, input.eventType));
			}

			const whereCondition = and(...conditions);

			const [events, countResult] = await Promise.all([
				db.query.sportsEventTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: asc(sportsEventTable.startDate),
					columns: {
						id: true,
						title: true,
						slug: true,
						description: true,
						eventType: true,
						status: true,
						startDate: true,
						endDate: true,
						maxCapacity: true,
						currentRegistrations: true,
						coverImageUrl: true,
						currency: true,
					},
					with: {
						location: {
							columns: { id: true, name: true, city: true },
						},
						pricingTiers: {
							where: eq(eventPricingTierTable.isActive, true),
							orderBy: asc(eventPricingTierTable.price),
							limit: 1, // Just get the lowest price
						},
					},
				}),
				db
					.select({ count: count() })
					.from(sportsEventTable)
					.where(whereCondition),
			]);

			return {
				events: events.map((event) => ({
					...event,
					lowestPrice: event.pricingTiers[0]?.price ?? null,
					spotsAvailable: event.maxCapacity
						? event.maxCapacity - event.currentRegistrations
						: null,
				})),
				total: countResult[0]?.count ?? 0,
				organization: {
					id: organization.id,
					name: organization.name,
					slug: organization.slug,
					logo: organization.logo,
				},
			};
		}),

	/**
	 * Get available age categories for an event
	 */
	getEventCategories: publicProcedure
		.input(getPublicEventSchema)
		.query(async ({ input }) => {
			// Find organization
			const organization = await db.query.organizationTable.findFirst({
				where: eq(organizationTable.slug, input.organizationSlug),
			});

			if (!organization) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organization not found",
				});
			}

			// Find event
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.organizationId, organization.id),
					eq(sportsEventTable.slug, input.eventSlug),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			// Get linked age categories
			const eventCategories = await db.query.eventAgeCategoryTable.findMany({
				where: eq(eventAgeCategoryTable.eventId, event.id),
				with: {
					ageCategory: true,
				},
			});

			return eventCategories.map((ec) => ({
				...ec.ageCategory,
				maxCapacity: ec.maxCapacity,
				currentRegistrations: ec.currentRegistrations,
			}));
		}),

	/**
	 * Calculate price for a potential registration
	 */
	calculatePrice: publicProcedure
		.input(
			getPublicEventSchema.extend({
				ageCategoryId: publicEventRegistrationSchema.shape.ageCategoryId,
			}),
		)
		.query(async ({ input }) => {
			// Find organization
			const organization = await db.query.organizationTable.findFirst({
				where: eq(organizationTable.slug, input.organizationSlug),
			});

			if (!organization) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organization not found",
				});
			}

			// Find event
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.organizationId, organization.id),
					eq(sportsEventTable.slug, input.eventSlug),
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
				event.id,
				nextRegistrationNumber,
				input.ageCategoryId ?? null,
			);

			return {
				...result,
				currency: event.currency,
				registrationNumber: nextRegistrationNumber,
			};
		}),

	/**
	 * Check if an email is already registered for an event
	 */
	checkEmail: publicProcedure
		.input(checkRegistrationEmailSchema)
		.query(async ({ input }) => {
			const existing = await db.query.eventRegistrationTable.findFirst({
				where: and(
					eq(eventRegistrationTable.eventId, input.eventId),
					eq(eventRegistrationTable.registrantEmail, input.email.toLowerCase()),
				),
				columns: {
					id: true,
					status: true,
					registrationNumber: true,
				},
			});

			return {
				isRegistered: !!existing,
				registration: existing,
			};
		}),

	/**
	 * Lookup athlete by email for the registration wizard
	 * Returns existing user/athlete data if found, for pre-filling the form
	 */
	lookupAthleteByEmail: publicProcedure
		.input(lookupAthleteByEmailSchema)
		.query(async ({ input }) => {
			// Find organization by slug
			const organization = await db.query.organizationTable.findFirst({
				where: eq(organizationTable.slug, input.organizationSlug),
			});

			if (!organization) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organization not found",
				});
			}

			// Find event by slug within organization
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.organizationId, organization.id),
					eq(sportsEventTable.slug, input.eventSlug),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found",
				});
			}

			const email = input.email.toLowerCase();

			// Check if already registered for THIS event
			const existingRegistration =
				await db.query.eventRegistrationTable.findFirst({
					where: and(
						eq(eventRegistrationTable.eventId, event.id),
						eq(eventRegistrationTable.registrantEmail, email),
					),
					columns: {
						id: true,
						registrationNumber: true,
						status: true,
					},
				});

			if (existingRegistration) {
				return {
					isAlreadyRegistered: true,
					existingRegistration: {
						id: existingRegistration.id,
						registrationNumber: existingRegistration.registrationNumber,
						status: existingRegistration.status,
					},
					user: null,
					athlete: null,
				};
			}

			// Look up user by email
			const existingUser = await db.query.userTable.findFirst({
				where: eq(userTable.email, email),
				columns: {
					id: true,
					name: true,
					email: true,
				},
			});

			if (!existingUser) {
				return {
					isAlreadyRegistered: false,
					existingRegistration: null,
					user: null,
					athlete: null,
				};
			}

			// Look up athlete profile for this organization
			const existingAthlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.organizationId, organization.id),
					eq(athleteTable.userId, existingUser.id),
				),
				columns: {
					id: true,
					sport: true,
					level: true,
					position: true,
					secondaryPosition: true,
					birthDate: true,
					phone: true,
					nationality: true,
					currentClub: true,
					jerseyNumber: true,
					yearsOfExperience: true,
				},
			});

			return {
				isAlreadyRegistered: false,
				existingRegistration: null,
				user: {
					id: existingUser.id,
					name: existingUser.name,
					email: existingUser.email,
				},
				athlete: existingAthlete
					? {
							id: existingAthlete.id,
							sport: existingAthlete.sport,
							level: existingAthlete.level,
							position: existingAthlete.position,
							secondaryPosition: existingAthlete.secondaryPosition,
							birthDate: existingAthlete.birthDate,
							phone: existingAthlete.phone,
							nationality: existingAthlete.nationality,
							currentClub: existingAthlete.currentClub,
							jerseyNumber: existingAthlete.jerseyNumber,
							yearsOfExperience: existingAthlete.yearsOfExperience,
						}
					: null,
			};
		}),

	/**
	 * Public registration for an event
	 * Creates user/athlete if they don't exist
	 */
	register: publicProcedure
		.input(publicEventRegistrationSchema)
		.mutation(async ({ input }) => {
			// Find organization
			const organization = await db.query.organizationTable.findFirst({
				where: eq(organizationTable.slug, input.organizationSlug),
			});

			if (!organization) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Organization not found",
				});
			}

			// Find event
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.organizationId, organization.id),
					eq(sportsEventTable.slug, input.eventSlug),
					eq(sportsEventTable.status, EventStatus.registrationOpen),
				),
			});

			if (!event) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found or registration is closed",
				});
			}

			// Check if registration is open (date-wise)
			const now = new Date();
			if (event.registrationOpenDate && now < event.registrationOpenDate) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Registration has not opened yet",
				});
			}

			if (event.registrationCloseDate && now > event.registrationCloseDate) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Registration has closed",
				});
			}

			const email = input.registrantEmail.toLowerCase();

			// Check if already registered
			const existingRegistration =
				await db.query.eventRegistrationTable.findFirst({
					where: and(
						eq(eventRegistrationTable.eventId, event.id),
						eq(eventRegistrationTable.registrantEmail, email),
					),
				});

			if (existingRegistration) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "This email is already registered for this event",
				});
			}

			// Use transaction to prevent race conditions
			const result = await db.transaction(async (tx) => {
				// Get current registration count
				const [countResult] = await tx
					.select({ count: count() })
					.from(eventRegistrationTable)
					.where(eq(eventRegistrationTable.eventId, event.id));

				const currentCount = countResult?.count ?? 0;
				const registrationNumber = currentCount + 1;

				// Check capacity
				let status: EventRegistrationStatus =
					EventRegistrationStatus.pendingPayment;
				let waitlistPosition: number | null = null;

				if (event.maxCapacity && currentCount >= event.maxCapacity) {
					if (event.enableWaitlist) {
						status = EventRegistrationStatus.waitlist;
						// Get next waitlist position
						const [waitlistCount] = await tx
							.select({ count: count() })
							.from(eventRegistrationTable)
							.where(
								and(
									eq(eventRegistrationTable.eventId, event.id),
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
				const priceResult = await calculateRegistrationPrice(
					event.id,
					registrationNumber,
					input.ageCategoryId ?? null,
				);

				// Check if user exists
				let userId: string | null = null;
				let athleteId: string | null = null;

				const existingUser = await tx.query.userTable.findFirst({
					where: eq(userTable.email, email),
				});

				if (existingUser) {
					userId = existingUser.id;

					// Check if athlete exists for this organization
					const existingAthlete = await tx.query.athleteTable.findFirst({
						where: and(
							eq(athleteTable.organizationId, organization.id),
							eq(athleteTable.userId, userId),
						),
					});

					if (existingAthlete) {
						athleteId = existingAthlete.id;
					} else {
						// Create athlete for this organization
						const [newAthlete] = await tx
							.insert(athleteTable)
							.values({
								organizationId: organization.id,
								userId,
								sport: "general",
								birthDate: input.registrantBirthDate,
							})
							.returning();
						if (!newAthlete) {
							throw new TRPCError({
								code: "INTERNAL_SERVER_ERROR",
								message: "Failed to create athlete profile",
							});
						}
						athleteId = newAthlete.id;
					}
				} else {
					// Create new user
					const [newUser] = await tx
						.insert(userTable)
						.values({
							email,
							name: input.registrantName,
							emailVerified: false,
						})
						.returning();

					if (!newUser) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to create user",
						});
					}

					userId = newUser.id;

					// Create account with temporary password
					const tempPassword = nanoid(12);
					await tx.insert(accountTable).values({
						userId: newUser.id,
						providerId: "credential",
						accountId: newUser.id,
						password: tempPassword, // In production, this should be hashed
					});

					// Create athlete for new user
					const [newAthlete] = await tx
						.insert(athleteTable)
						.values({
							organizationId: organization.id,
							userId,
							sport: "general",
							birthDate: input.registrantBirthDate,
						})
						.returning();
					if (!newAthlete) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to create athlete profile",
						});
					}
					athleteId = newAthlete.id;
				}

				// Create registration
				const [registration] = await tx
					.insert(eventRegistrationTable)
					.values({
						eventId: event.id,
						organizationId: organization.id,
						registrationNumber,
						athleteId,
						userId,
						registrantName: input.registrantName,
						registrantEmail: email,
						registrantPhone: input.registrantPhone,
						registrantBirthDate: input.registrantBirthDate,
						emergencyContactName: input.emergencyContactName,
						emergencyContactPhone: input.emergencyContactPhone,
						emergencyContactRelation: input.emergencyContactRelation,
						ageCategoryId: input.ageCategoryId,
						status,
						waitlistPosition,
						appliedPricingTierId: priceResult.tierId,
						price: priceResult.price,
						currency: event.currency,
						notes: input.notes,
						termsAcceptedAt: new Date(),
						registrationSource: "public",
					})
					.returning();

				if (!registration) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create registration",
					});
				}

				// Update event registration count if not waitlist
				if (status !== EventRegistrationStatus.waitlist) {
					await tx
						.update(sportsEventTable)
						.set({
							currentRegistrations: sql`${sportsEventTable.currentRegistrations} + 1`,
						})
						.where(eq(sportsEventTable.id, event.id));
				}

				// Update age category registration count if applicable
				if (input.ageCategoryId) {
					await tx
						.update(eventAgeCategoryTable)
						.set({
							currentRegistrations: sql`${eventAgeCategoryTable.currentRegistrations} + 1`,
						})
						.where(
							and(
								eq(eventAgeCategoryTable.eventId, event.id),
								eq(eventAgeCategoryTable.ageCategoryId, input.ageCategoryId),
							),
						);
				}

				return {
					registration,
					price: priceResult.price,
					tierName: priceResult.tierName,
					isWaitlist: status === EventRegistrationStatus.waitlist,
					waitlistPosition,
				};
			});

			return {
				success: true,
				registrationId: result.registration.id,
				registrationNumber: result.registration.registrationNumber,
				price: result.price,
				currency: event.currency,
				tierName: result.tierName,
				isWaitlist: result.isWaitlist,
				waitlistPosition: result.waitlistPosition,
				event: {
					id: event.id,
					title: event.title,
					slug: event.slug,
					startDate: event.startDate,
					endDate: event.endDate,
				},
			};
		}),
});
