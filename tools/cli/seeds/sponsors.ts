import { eq } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import { ENTITY_SPONSOR, ENTITY_SPONSOR_ASSIGNMENT, seedUUID } from "./utils";

const sponsorNames = [
	"Nike Argentina",
	"Adidas Sports",
	"Gatorade",
	"Red Bull",
	"Banco Santander",
	"YPF",
	"Personal",
	"Quilmes",
	"Arcor",
	"Molinos Rio de la Plata",
];

const sponsorDescriptions = [
	"Marca deportiva líder en equipamiento",
	"Patrocinador oficial de hidratación",
	"Sponsor energético principal",
	"Partner financiero exclusivo",
	"Proveedor de combustible oficial",
	"Partner de telecomunicaciones",
	"Sponsor de alimentación",
	"Proveedor de indumentaria oficial",
];

const sponsorTiers = [
	"platinum",
	"gold",
	"silver",
	"bronze",
	"partner",
	"supporter",
] as const;

const sponsorStatuses = ["active", "inactive", "pending"] as const;

const contactFirstNames = [
	"Roberto",
	"María",
	"Carlos",
	"Ana",
	"Fernando",
	"Luciana",
	"Martín",
	"Paula",
];

const contactLastNames = [
	"González",
	"Martínez",
	"López",
	"García",
	"Rodríguez",
	"Fernández",
	"Pérez",
	"Sánchez",
];

function _addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMonths(date: Date, months: number): Date {
	const result = new Date(date);
	result.setMonth(result.getMonth() + months);
	return result;
}

function generateEmail(companyName: string): string {
	const domain = companyName.toLowerCase().replace(/\s+/g, "");
	return `sponsorships@${domain}.com`;
}

function generatePhone(): string {
	return `+54 11 ${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function seedSponsors(
	db: DrizzleClient,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	// Check for existing sponsors
	const existingSponsors = await db.query.sponsorTable.findMany({
		where: eq(schema.sponsorTable.organizationId, context.organizationId),
	});

	if (existingSponsors.length >= count) {
		return existingSponsors.slice(0, count).map((s: any) => s.id);
	}

	const existingNames = new Set(existingSponsors.map((s: any) => s.name));
	const sponsors: Array<typeof schema.sponsorTable.$inferInsert> = [];
	const assignments: Array<
		typeof schema.eventSponsorAssignmentTable.$inferInsert
	> = [];

	const sponsorIds: string[] = existingSponsors.map((s: any) => s.id);
	const now = new Date();

	let assignmentIndex = 0;

	for (let i = 0; i < count; i++) {
		const baseName = sponsorNames[i % sponsorNames.length] ?? "Sponsor";
		if (existingNames.has(baseName)) continue;

		const sponsorId = seedUUID(ENTITY_SPONSOR, i + 1);
		const tier = sponsorTiers[i % sponsorTiers.length] ?? "partner";
		const status = sponsorStatuses[i % sponsorStatuses.length] ?? "pending";

		// Contract dates - some active, some expired, some future
		let contractStartDate: Date;
		let contractEndDate: Date;

		if (status === "active") {
			contractStartDate = addMonths(now, -6);
			contractEndDate = addMonths(now, 6);
		} else if (status === "inactive") {
			contractStartDate = addMonths(now, -18);
			contractEndDate = addMonths(now, -6);
		} else {
			// pending
			contractStartDate = addMonths(now, 1);
			contractEndDate = addMonths(now, 13);
		}

		// Contract value based on tier
		const tierValues: Record<string, number> = {
			platinum: 5000000,
			gold: 3000000,
			silver: 1500000,
			bronze: 750000,
			partner: 500000,
			supporter: 250000,
		};
		const contractValue = (tierValues[tier] ?? 250000) * 100; // In cents

		const firstName = contactFirstNames[i % contactFirstNames.length] ?? "Juan";
		const lastName = contactLastNames[i % contactLastNames.length] ?? "Pérez";

		const sponsorName =
			i >= sponsorNames.length
				? `${baseName} ${Math.floor(i / sponsorNames.length) + 1}`
				: baseName;

		sponsors.push({
			id: sponsorId,
			organizationId: context.organizationId,
			name: sponsorName,
			description: sponsorDescriptions[i % sponsorDescriptions.length],
			logoUrl: null,
			websiteUrl: `https://www.${baseName.toLowerCase().replace(/\s+/g, "")}.com`,
			contactName: `${firstName} ${lastName}`,
			contactEmail: generateEmail(baseName),
			contactPhone: generatePhone(),
			tier,
			contractStartDate,
			contractEndDate,
			contractValue,
			currency: "ARS",
			contractNotes:
				i % 3 === 0
					? "Incluye exclusividad en categoría"
					: i % 3 === 1
						? "Renovación automática si no hay aviso con 60 días"
						: null,
			status,
			notes:
				i % 4 === 0
					? "Contacto directo con gerente de marketing"
					: i % 4 === 1
						? "Requiere aprobación de diseños antes de usar logo"
						: null,
			isActive: status === "active",
			createdBy: context.seedUserId,
		});

		sponsorIds.push(sponsorId);

		// Create event sponsor assignments for active sponsors
		if (status === "active" && context.eventIds.length > 0) {
			// Assign to 1-3 events
			const numAssignments = Math.min(1 + (i % 3), context.eventIds.length);

			for (let a = 0; a < numAssignments; a++) {
				const eventId = context.eventIds[(i + a) % context.eventIds.length];
				if (!eventId) continue;

				const assignmentId = seedUUID(
					ENTITY_SPONSOR_ASSIGNMENT,
					++assignmentIndex,
				);

				assignments.push({
					id: assignmentId,
					eventId,
					sponsorId,
					tier, // Can override tier per event
					sponsorshipValue: Math.floor(contractValue / numAssignments),
					inKindDescription:
						a === 0 && i % 2 === 0
							? "Provisión de equipamiento deportivo"
							: null,
					isConfirmed: true,
					confirmedAt: new Date(),
					notes: null,
					sortOrder: a,
				});
			}
		}
	}

	// Insert all data
	if (sponsors.length > 0) {
		await db.insert(schema.sponsorTable).values(sponsors).onConflictDoNothing();
	}

	if (assignments.length > 0) {
		await db
			.insert(schema.eventSponsorAssignmentTable)
			.values(assignments)
			.onConflictDoNothing();
	}

	return sponsorIds;
}
