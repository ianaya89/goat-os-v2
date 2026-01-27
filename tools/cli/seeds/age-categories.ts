import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";

const categories = [
	{
		name: "2019",
		displayName: "Nacidos en 2019",
		minBirthYear: 2019,
		maxBirthYear: 2019,
	},
	{
		name: "2018",
		displayName: "Nacidos en 2018",
		minBirthYear: 2018,
		maxBirthYear: 2018,
	},
	{
		name: "2017",
		displayName: "Nacidos en 2017",
		minBirthYear: 2017,
		maxBirthYear: 2017,
	},
	{
		name: "2016",
		displayName: "Nacidos en 2016",
		minBirthYear: 2016,
		maxBirthYear: 2016,
	},
	{
		name: "2015",
		displayName: "Nacidos en 2015",
		minBirthYear: 2015,
		maxBirthYear: 2015,
	},
	{
		name: "2014",
		displayName: "Nacidos en 2014",
		minBirthYear: 2014,
		maxBirthYear: 2014,
	},
	{
		name: "2013",
		displayName: "Nacidos en 2013",
		minBirthYear: 2013,
		maxBirthYear: 2013,
	},
	{
		name: "2012",
		displayName: "Nacidos en 2012",
		minBirthYear: 2012,
		maxBirthYear: 2012,
	},
	{
		name: "2011",
		displayName: "Nacidos en 2011",
		minBirthYear: 2011,
		maxBirthYear: 2011,
	},
	{
		name: "2010",
		displayName: "Nacidos en 2010",
		minBirthYear: 2010,
		maxBirthYear: 2010,
	},
	{
		name: "2009-2008",
		displayName: "Nacidos 2009-2008",
		minBirthYear: 2008,
		maxBirthYear: 2009,
	},
	{
		name: "Mayores",
		displayName: "2007 y anteriores",
		minBirthYear: 1980,
		maxBirthYear: 2007,
	},
];

export async function seedAgeCategoriesAndRegistrations(
	db: DrizzleClient,
	_count: number,
	context: SeedContext,
): Promise<string[]> {
	const ageCategories: Array<typeof schema.ageCategoryTable.$inferInsert> = [];
	const categoryIds: string[] = [];

	// Check existing categories for this org
	const existingCategories = await db.query.ageCategoryTable.findMany({
		where: eq(schema.ageCategoryTable.organizationId, context.organizationId),
	});

	const existingNames = new Set(existingCategories.map((c: any) => c.name));

	for (const cat of categories) {
		if (!existingNames.has(cat.name)) {
			const id = randomUUID();
			categoryIds.push(id);
			ageCategories.push({
				id,
				organizationId: context.organizationId,
				name: cat.name,
				displayName: cat.displayName,
				minBirthYear: cat.minBirthYear,
				maxBirthYear: cat.maxBirthYear,
				isActive: true,
			});
		} else {
			// Add existing category ID
			const existing = existingCategories.find((c: any) => c.name === cat.name);
			if (existing) categoryIds.push(existing.id);
		}
	}

	if (ageCategories.length > 0) {
		await db
			.insert(schema.ageCategoryTable)
			.values(ageCategories)
			.onConflictDoNothing();
	}

	// Create event age categories if we have events
	if (context.eventIds.length > 0 && categoryIds.length > 0) {
		const eventAgeCategories: Array<
			typeof schema.eventAgeCategoryTable.$inferInsert
		> = [];

		for (const eventId of context.eventIds) {
			const numCategories = 2 + Math.floor(Math.random() * 3);
			const shuffled = [...categoryIds]
				.sort(() => 0.5 - Math.random())
				.slice(0, numCategories);

			for (const ageCategoryId of shuffled) {
				eventAgeCategories.push({
					id: randomUUID(),
					eventId,
					ageCategoryId,
					maxCapacity: 20 + Math.floor(Math.random() * 30),
				});
			}
		}

		if (eventAgeCategories.length > 0) {
			await db
				.insert(schema.eventAgeCategoryTable)
				.values(eventAgeCategories)
				.onConflictDoNothing();
		}
	}

	return categoryIds;
}
