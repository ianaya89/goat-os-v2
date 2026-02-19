import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import {
	ENTITY_EVENT,
	ENTITY_EVENT_DISCOUNT,
	ENTITY_EVENT_PAYMENT,
	ENTITY_EVENT_PRICING,
	ENTITY_EVENT_REGISTRATION,
	seedUUID,
} from "./utils";

const eventNames = [
	"Campus de Verano",
	"Clinic de Arqueros",
	"Torneo Interbarrial",
	"Showcase de Talentos",
	"Camp Intensivo",
	"Tryout Juvenil",
	"Campus de Invierno",
	"Clinic Técnico",
];

const descriptions = [
	"Evento de formación intensiva para jóvenes talentos",
	"Oportunidad única de desarrollo deportivo",
	"Competencia de alto nivel para todas las categorías",
	"Evaluación y selección de nuevos talentos",
];

const eventTypes = [
	"campus",
	"camp",
	"clinic",
	"showcase",
	"tournament",
	"tryout",
] as const;

// Public-accessible statuses first so seed events can be accessed via public pages
const eventStatuses = [
	"registration_open",
	"published",
	"registration_open",
	"in_progress",
	"draft",
	"registration_closed",
	"completed",
] as const;

const registrationStatuses = [
	"pending_payment",
	"confirmed",
	"waitlist",
	"cancelled",
] as const;

const paymentMethods = [
	"cash",
	"bank_transfer",
	"mercado_pago",
	"card",
] as const;

const _paymentStatuses = ["pending", "paid", "partial"] as const;

// Discount codes and automatic discounts
const discountCodes = [
	{ code: "EARLYBIRD20", name: "Early Bird 20%", percent: 20 },
	{ code: "FAMILIA15", name: "Descuento Familiar", percent: 15 },
	{ code: "SOCIO10", name: "Descuento Socios", percent: 10 },
	{ code: "BLACKFRIDAY30", name: "Black Friday", percent: 30 },
	{ code: "PROMO2024", name: "Promoción 2024", percent: 25 },
] as const;

const automaticDiscounts = [
	{ name: "Descuento de Lanzamiento", percent: 15, priority: 10 },
	{ name: "Promoción Especial", percent: 10, priority: 5 },
	{ name: "Black Friday Auto", percent: 20, priority: 15 },
] as const;

const firstNames = [
	"Juan",
	"María",
	"Carlos",
	"Ana",
	"Luis",
	"Laura",
	"Pedro",
	"Sofía",
	"Diego",
	"Valentina",
	"Martín",
	"Camila",
	"Nicolás",
	"Lucía",
	"Tomás",
	"Paula",
];

const lastNames = [
	"García",
	"Rodríguez",
	"Martínez",
	"López",
	"González",
	"Fernández",
	"Díaz",
	"Pérez",
	"Sánchez",
	"Romero",
	"Torres",
	"Álvarez",
	"Ruiz",
	"Jiménez",
	"Moreno",
	"Muñoz",
];

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function randomBirthDate(): Date {
	const now = new Date();
	const minAge = 6;
	const maxAge = 18;
	const age = minAge + Math.floor(Math.random() * (maxAge - minAge));
	return new Date(
		now.getFullYear() - age,
		Math.floor(Math.random() * 12),
		1 + Math.floor(Math.random() * 28),
	);
}

function generateEmail(
	firstName: string,
	lastName: string,
	index: number,
): string {
	return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@email.com`;
}

function generatePhone(): string {
	return `+54 11 ${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function seedEvents(
	db: DrizzleClient,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	// Check for existing seed events
	const existingEvents = await db.query.sportsEventTable.findMany({
		where: eq(schema.sportsEventTable.organizationId, context.organizationId),
	});

	if (existingEvents.length >= count) {
		return existingEvents.slice(0, count).map((e: any) => e.id);
	}

	const existingSlugs = new Set(existingEvents.map((e: any) => e.slug));
	const events: Array<typeof schema.sportsEventTable.$inferInsert> = [];
	const pricingTiers: Array<typeof schema.eventPricingTierTable.$inferInsert> =
		[];
	const discounts: Array<typeof schema.eventDiscountTable.$inferInsert> = [];
	const registrations: Array<
		typeof schema.eventRegistrationTable.$inferInsert
	> = [];
	const payments: Array<typeof schema.trainingPaymentTable.$inferInsert> = [];
	const cashMovements: Array<typeof schema.cashMovementTable.$inferInsert> = [];

	const eventIds: string[] = existingEvents.map((e: any) => e.id);
	const now = new Date();

	// Get open cash register if exists (for cash payments)
	const openCashRegister = await db.query.cashRegisterTable.findFirst({
		where: and(
			eq(schema.cashRegisterTable.organizationId, context.organizationId),
			eq(schema.cashRegisterTable.status, "open"),
		),
	});

	let pricingIndex = 0;
	let discountIndex = 0;
	let registrationIndex = 0;
	let paymentIndex = 0;

	for (let i = 0; i < count; i++) {
		const slug = `seed-event-${i + 1}`;
		if (existingSlugs.has(slug)) continue;

		const eventId = seedUUID(ENTITY_EVENT, i + 1);
		const startDate = addDays(now, 10 + i * 5);
		const endDate = addDays(startDate, 1 + (i % 7));
		const registrationOpen = addDays(startDate, -30);
		const registrationClose = addDays(startDate, -3);
		const maxCapacity = 50 + i * 20;

		events.push({
			id: eventId,
			organizationId: context.organizationId,
			title: `${eventNames[i % eventNames.length]} ${2024 + Math.floor(i / eventNames.length)}`,
			slug,
			description: descriptions[i % descriptions.length],
			eventType: eventTypes[i % eventTypes.length],
			status: eventStatuses[i % eventStatuses.length],
			startDate,
			endDate,
			locationId:
				context.locationIds.length > 0
					? context.locationIds[i % context.locationIds.length]
					: null,
			registrationOpenDate: registrationOpen,
			registrationCloseDate: registrationClose,
			maxCapacity,
			currency: "ARS",
			requiresApproval: i % 3 === 0,
			allowPublicRegistration: true,
			enableWaitlist: true,
			createdBy: context.seedUserId,
		});

		eventIds.push(eventId);

		// Create pricing tiers for each event
		const earlyBirdPrice = (15000 + i * 2000) * 100; // en centavos
		const standardPrice = (20000 + i * 2500) * 100;
		const latePrice = (25000 + i * 3000) * 100;
		const firstSpotPrice = (12000 + i * 1500) * 100;

		// Early bird (date-based)
		const earlyBirdTierId = seedUUID(ENTITY_EVENT_PRICING, ++pricingIndex);
		pricingTiers.push({
			id: earlyBirdTierId,
			eventId,
			name: "Early Bird",
			description: "Precio especial para inscripciones anticipadas",
			tierType: "date_based",
			price: earlyBirdPrice,
			currency: "ARS",
			validFrom: registrationOpen,
			validUntil: addDays(registrationOpen, 10),
			isActive: true,
			sortOrder: 0,
		});

		// Standard (date-based)
		const standardTierId = seedUUID(ENTITY_EVENT_PRICING, ++pricingIndex);
		pricingTiers.push({
			id: standardTierId,
			eventId,
			name: "Precio Regular",
			description: "Precio estándar de inscripción",
			tierType: "date_based",
			price: standardPrice,
			currency: "ARS",
			validFrom: addDays(registrationOpen, 10),
			validUntil: addDays(registrationClose, -5),
			isActive: true,
			sortOrder: 1,
		});

		// Late (date-based)
		const lateTierId = seedUUID(ENTITY_EVENT_PRICING, ++pricingIndex);
		pricingTiers.push({
			id: lateTierId,
			eventId,
			name: "Última Hora",
			description: "Precio para inscripciones de último momento",
			tierType: "date_based",
			price: latePrice,
			currency: "ARS",
			validFrom: addDays(registrationClose, -5),
			validUntil: registrationClose,
			isActive: true,
			sortOrder: 2,
		});

		// First 10 spots (capacity-based)
		const firstSpotsTierId = seedUUID(ENTITY_EVENT_PRICING, ++pricingIndex);
		pricingTiers.push({
			id: firstSpotsTierId,
			eventId,
			name: "Primeros 10 Cupos",
			description: "Descuento especial para los primeros 10 inscriptos",
			tierType: "capacity_based",
			price: firstSpotPrice,
			currency: "ARS",
			capacityStart: 1,
			capacityEnd: 10,
			isActive: true,
			sortOrder: 0,
		});

		// Create discount codes for this event
		// Add 2-3 promotional codes per event
		const numCodes = 2 + (i % 2); // 2 or 3 codes
		for (let d = 0; d < numCodes; d++) {
			const discountData = discountCodes[(i + d) % discountCodes.length];
			if (!discountData) continue;

			const discountId = seedUUID(ENTITY_EVENT_DISCOUNT, ++discountIndex);
			discounts.push({
				id: discountId,
				eventId,
				organizationId: context.organizationId,
				name: discountData.name,
				description: `Código promocional: ${discountData.code}`,
				discountMode: "code",
				code: discountData.code,
				discountValueType: "percentage",
				discountValue: discountData.percent,
				maxUses: 50 + i * 10, // Different limits per event
				maxUsesPerUser: 1,
				currentUses: Math.floor(Math.random() * 10),
				validFrom: registrationOpen,
				validUntil: registrationClose,
				minPurchaseAmount: null,
				priority: 0,
				isActive: true,
			});
		}

		// Add 1 automatic discount per event (every other event)
		if (i % 2 === 0) {
			const autoDiscount = automaticDiscounts[i % automaticDiscounts.length];
			if (autoDiscount) {
				const discountId = seedUUID(ENTITY_EVENT_DISCOUNT, ++discountIndex);
				discounts.push({
					id: discountId,
					eventId,
					organizationId: context.organizationId,
					name: autoDiscount.name,
					description:
						"Descuento automático aplicado a todas las inscripciones",
					discountMode: "automatic",
					code: null,
					discountValueType: "percentage",
					discountValue: autoDiscount.percent,
					maxUses: 100,
					maxUsesPerUser: null,
					currentUses: Math.floor(Math.random() * 20),
					validFrom: registrationOpen,
					validUntil: addDays(registrationOpen, 15), // Only for first 15 days
					minPurchaseAmount: null,
					priority: autoDiscount.priority,
					isActive: true,
				});
			}
		}

		// Create registrations for this event
		// Mix of athletes from context and public registrations
		const registrationsPerEvent = Math.min(
			Math.max(5, Math.floor(maxCapacity * 0.3)),
			20,
		);

		for (let r = 0; r < registrationsPerEvent; r++) {
			const registrationId = seedUUID(
				ENTITY_EVENT_REGISTRATION,
				++registrationIndex,
			);
			const registrationNumber = r + 1;

			// Determine which pricing tier applies
			let appliedTierId: string;
			let price: number;

			if (registrationNumber <= 10) {
				// First 10 get capacity-based discount
				appliedTierId = firstSpotsTierId;
				price = firstSpotPrice;
			} else if (r % 3 === 0) {
				// Some early birds
				appliedTierId = earlyBirdTierId;
				price = earlyBirdPrice;
			} else if (r % 3 === 1) {
				// Some standard
				appliedTierId = standardTierId;
				price = standardPrice;
			} else {
				// Some late
				appliedTierId = lateTierId;
				price = latePrice;
			}

			// Status distribution
			const statusIdx = r % registrationStatuses.length;
			const status = registrationStatuses[statusIdx];

			// Mix of athlete-linked and public registrations
			const useAthlete = context.athleteIds.length > 0 && r % 2 === 0;
			const athleteId = useAthlete
				? context.athleteIds[r % context.athleteIds.length]
				: null;

			const firstName = firstNames[r % firstNames.length] as string;
			const lastName = lastNames[r % lastNames.length] as string;

			const paidAmount =
				status === "confirmed"
					? price
					: status === "pending_payment" && r % 2 === 0
						? Math.floor(price * 0.5)
						: 0;

			const registeredAt = addDays(registrationOpen, r % 20);

			registrations.push({
				id: registrationId,
				eventId,
				organizationId: context.organizationId,
				registrationNumber,
				athleteId,
				userId: null,
				registrantName: `${firstName} ${lastName}`,
				registrantEmail: generateEmail(firstName, lastName, r),
				registrantPhone: generatePhone(),
				registrantBirthDate: randomBirthDate(),
				emergencyContactName: `Padre/Madre de ${firstName}`,
				emergencyContactPhone: generatePhone(),
				emergencyContactRelation: r % 2 === 0 ? "Padre" : "Madre",
				ageCategoryId:
					context.ageCategoryIds.length > 0
						? context.ageCategoryIds[r % context.ageCategoryIds.length]
						: null,
				status,
				waitlistPosition: status === "waitlist" ? r : null,
				appliedPricingTierId: appliedTierId,
				price,
				currency: "ARS",
				paidAmount,
				notes:
					r % 5 === 0
						? "Solicita estar en grupo con amigos"
						: r % 7 === 0
							? "Tiene restricción alimentaria"
							: null,
				internalNotes: r % 4 === 0 ? "Verificar documentación" : null,
				termsAcceptedAt: registeredAt,
				registrationSource: useAthlete ? "member_portal" : "public",
				registeredAt,
				confirmedAt: status === "confirmed" ? addDays(registeredAt, 1) : null,
				cancelledAt: status === "cancelled" ? addDays(registeredAt, 2) : null,
			});

			// Create payment for registrations with paid amount > 0
			if (
				paidAmount > 0 ||
				status === "confirmed" ||
				status === "pending_payment"
			) {
				const paymentId = seedUUID(ENTITY_EVENT_PAYMENT, ++paymentIndex);
				const paymentMethod = paymentMethods[
					r % paymentMethods.length
				] as (typeof paymentMethods)[number];
				const paymentStatus =
					paidAmount === price
						? "paid"
						: paidAmount > 0
							? "partial"
							: "pending";

				const paymentDate =
					paymentStatus !== "pending" ? addDays(registeredAt, 1) : null;

				payments.push({
					id: paymentId,
					type: "event",
					registrationId,
					organizationId: context.organizationId,
					amount: paidAmount > 0 ? paidAmount : price,
					paidAmount:
						paymentStatus === "paid"
							? paidAmount > 0
								? paidAmount
								: price
							: paidAmount,
					currency: "ARS",
					status: paymentStatus,
					paymentMethod,
					paymentDate,
					receiptNumber:
						paymentStatus === "paid"
							? `REC-${eventId.slice(0, 8)}-${registrationNumber.toString().padStart(4, "0")}`
							: null,
					description: `${eventNames[i % eventNames.length]} - ${firstName} ${lastName}`,
					notes:
						paymentStatus === "partial"
							? `Pago parcial - resta $${((price - paidAmount) / 100).toLocaleString("es-AR")}`
							: null,
					recordedBy: paymentStatus !== "pending" ? context.seedUserId : null,
				});

				// Create cash movement for cash payments with open register
				if (
					paymentMethod === "cash" &&
					paymentStatus === "paid" &&
					openCashRegister
				) {
					cashMovements.push({
						id: randomUUID(),
						cashRegisterId: openCashRegister.id,
						organizationId: context.organizationId,
						type: "income",
						amount: paidAmount,
						description: `Pago evento: ${eventNames[i % eventNames.length]} - ${firstName} ${lastName}`,
						referenceType: "event_payment",
						referenceId: paymentId,
						recordedBy: context.seedUserId,
					});
				}
			}
		}
	}

	// Insert all data
	if (events.length > 0) {
		await db
			.insert(schema.sportsEventTable)
			.values(events)
			.onConflictDoNothing();
	}

	if (pricingTiers.length > 0) {
		await db
			.insert(schema.eventPricingTierTable)
			.values(pricingTiers)
			.onConflictDoNothing();
	}

	if (discounts.length > 0) {
		await db
			.insert(schema.eventDiscountTable)
			.values(discounts)
			.onConflictDoNothing();
	}

	if (registrations.length > 0) {
		await db
			.insert(schema.eventRegistrationTable)
			.values(registrations)
			.onConflictDoNothing();
	}

	if (payments.length > 0) {
		await db
			.insert(schema.trainingPaymentTable)
			.values(payments)
			.onConflictDoNothing();
	}

	if (cashMovements.length > 0) {
		await db
			.insert(schema.cashMovementTable)
			.values(cashMovements)
			.onConflictDoNothing();
	}

	return eventIds;
}
