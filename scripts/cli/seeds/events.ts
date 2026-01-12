import { eq } from "drizzle-orm";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import { ENTITY_EVENT, seedUUID } from "./utils";

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
const eventStatuses = [
	"draft",
	"published",
	"registration_open",
	"registration_closed",
	"completed",
] as const;

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function seedEvents(
	db: any,
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
	const eventIds: string[] = existingEvents.map((e: any) => e.id);
	const now = new Date();

	for (let i = 0; i < count; i++) {
		const slug = `seed-event-${i + 1}`;
		if (existingSlugs.has(slug)) continue;

		const eventId = seedUUID(ENTITY_EVENT, i + 1);
		const startDate = addDays(now, 10 + i * 5);
		const endDate = addDays(startDate, 1 + (i % 7));
		const registrationOpen = addDays(startDate, -30);
		const registrationClose = addDays(startDate, -3);

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
			maxCapacity: 50 + i * 20,
			currency: "ARS",
			requiresApproval: i % 3 === 0,
			allowPublicRegistration: true,
			enableWaitlist: true,
			createdBy: context.seedUserId,
		});

		eventIds.push(eventId);
	}

	if (events.length > 0) {
		await db
			.insert(schema.sportsEventTable)
			.values(events)
			.onConflictDoNothing();
	}

	return eventIds;
}
