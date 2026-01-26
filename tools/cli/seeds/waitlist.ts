import { eq } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import { ENTITY_WAITLIST, seedUUID } from "./utils";

const waitlistReasons = [
	"Grupo completo - solicita próxima vacante",
	"Horario preferido sin disponibilidad",
	"Cambio de grupo solicitado",
	"Reingreso al programa",
	"Esperando confirmación de pago",
	"Lista de espera para categoría específica",
	"Solicitud de turno adicional",
	"Transferencia desde otra sede",
];

const adminNotes = [
	"Contactar cuando haya lugar",
	"Prioridad alta - hermano ya inscripto",
	"Verificar documentación antes de asignar",
	"Tiene restricción de horario por escuela",
	"Padre solicitó grupo específico",
	"Viene recomendado por entrenador",
	"Segunda vez en lista de espera",
	null,
];

const priorities = ["high", "medium", "low"] as const;
const statuses = ["waiting", "assigned", "cancelled", "expired"] as const;
const referenceTypes = ["schedule", "athlete_group"] as const;
const daysOfWeek = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
] as const;

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function seedWaitlist(
	db: DrizzleClient,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	// Need athletes for waitlist
	if (context.athleteIds.length === 0) {
		return [];
	}

	// Check for existing waitlist entries
	const existingEntries = await db.query.waitlistEntryTable.findMany({
		where: eq(schema.waitlistEntryTable.organizationId, context.organizationId),
	});

	if (existingEntries.length >= count) {
		return existingEntries.slice(0, count).map((e: any) => e.id);
	}

	const entries: Array<typeof schema.waitlistEntryTable.$inferInsert> = [];
	const entryIds: string[] = existingEntries.map((e: any) => e.id);
	const now = new Date();

	// Track which athletes already have entries to avoid duplicates
	const athletesWithEntries = new Set(
		existingEntries.map((e: any) => e.athleteId),
	);

	let position = existingEntries.length + 1;

	for (let i = 0; i < count; i++) {
		// Get an athlete that doesn't have an entry yet
		const athleteId = context.athleteIds.find(
			(id) => !athletesWithEntries.has(id),
		);

		if (!athleteId) break; // No more available athletes

		athletesWithEntries.add(athleteId);

		const entryId = seedUUID(ENTITY_WAITLIST, i + 1);
		const referenceType =
			referenceTypes[i % referenceTypes.length] ?? "schedule";
		const status = statuses[i % statuses.length] ?? "waiting";
		const priority = priorities[i % priorities.length] ?? "medium";

		// Determine dates based on status
		let assignedAt: Date | null = null;
		let expiresAt: Date | null = null;

		if (status === "assigned") {
			assignedAt = addDays(now, -(i % 10));
		} else if (status === "expired") {
			expiresAt = addDays(now, -(i % 5));
		} else if (status === "waiting") {
			// Some waiting entries have expiration
			expiresAt = i % 3 === 0 ? addDays(now, 30 + (i % 60)) : null;
		}

		// For schedule type, add preferred days and times
		let preferredDays: (typeof daysOfWeek)[number][] | null = null;
		let preferredStartTime: string | null = null;
		let preferredEndTime: string | null = null;

		if (referenceType === "schedule") {
			// Pick 2-3 preferred days
			const numDays = 2 + (i % 2);
			preferredDays = [];
			for (let d = 0; d < numDays; d++) {
				const day = daysOfWeek[(i + d) % daysOfWeek.length];
				if (day && !preferredDays.includes(day)) {
					preferredDays.push(day);
				}
			}

			// Preferred time slots
			const startHour = 8 + (i % 10); // 8:00 to 17:00
			preferredStartTime = `${startHour.toString().padStart(2, "0")}:00`;
			preferredEndTime = `${(startHour + 2).toString().padStart(2, "0")}:00`;
		}

		// For athlete_group type, reference a group if available
		let athleteGroupId: string | null = null;
		if (
			referenceType === "athlete_group" &&
			context.athleteGroupIds.length > 0
		) {
			athleteGroupId =
				context.athleteGroupIds[i % context.athleteGroupIds.length] ?? null;
		}

		entries.push({
			id: entryId,
			organizationId: context.organizationId,
			athleteId,
			referenceType,
			preferredDays,
			preferredStartTime,
			preferredEndTime,
			athleteGroupId,
			priority,
			status,
			reason: waitlistReasons[i % waitlistReasons.length],
			notes: adminNotes[i % adminNotes.length],
			position: status === "waiting" ? position++ : null,
			assignedAt,
			assignedBy: status === "assigned" ? context.seedUserId : null,
			expiresAt,
			createdBy: context.seedUserId,
		});

		entryIds.push(entryId);
	}

	// Insert all data
	if (entries.length > 0) {
		await db
			.insert(schema.waitlistEntryTable)
			.values(entries)
			.onConflictDoNothing();
	}

	return entryIds;
}
