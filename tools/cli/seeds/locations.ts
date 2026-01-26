import { eq } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import { ENTITY_LOCATION, seedUUID } from "./utils";

const locationNames = [
	"Cancha Principal",
	"Campo de Entrenamiento 1",
	"Gimnasio Central",
	"Cancha Auxiliar",
	"Polideportivo Norte",
	"Centro de Formación",
	"Estadio Municipal",
	"Complejo Deportivo Sur",
];

const cities = [
	"Buenos Aires",
	"Córdoba",
	"Rosario",
	"Mendoza",
	"La Plata",
	"Mar del Plata",
	"Tucumán",
];
const states = [
	"Buenos Aires",
	"Córdoba",
	"Santa Fe",
	"Mendoza",
	"Buenos Aires",
	"Buenos Aires",
	"Tucumán",
];

export async function seedLocations(
	db: DrizzleClient,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	// Check for existing seed locations
	const existingLocations = await db.query.locationTable.findMany({
		where: eq(schema.locationTable.organizationId, context.organizationId),
	});

	if (existingLocations.length >= count) {
		return existingLocations.slice(0, count).map((l: any) => l.id);
	}

	const existingNames = new Set(existingLocations.map((l: any) => l.name));
	const locations: Array<typeof schema.locationTable.$inferInsert> = [];
	const locationIds: string[] = existingLocations.map((l: any) => l.id);

	for (let i = 0; i < count; i++) {
		const name = `${locationNames[i % locationNames.length]} ${i + 1}`;
		if (existingNames.has(name)) continue;

		const cityIndex = i % cities.length;
		const locationId = seedUUID(ENTITY_LOCATION, i + 1);

		locations.push({
			id: locationId,
			organizationId: context.organizationId,
			name,
			address: `Calle ${100 + i} #${1000 + i * 100}`,
			city: cities[cityIndex],
			state: states[cityIndex],
			country: "Argentina",
			postalCode: `${1000 + i * 10}`,
			capacity: 20 + i * 20,
			isActive: true,
		});

		locationIds.push(locationId);
	}

	if (locations.length > 0) {
		await db
			.insert(schema.locationTable)
			.values(locations)
			.onConflictDoNothing();
	}

	return locationIds;
}
