import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";

const categories = [
	{ name: "Sub-8", displayName: "8 años y menores", minAge: 0, maxAge: 8 },
	{ name: "Sub-10", displayName: "10 años y menores", minAge: 9, maxAge: 10 },
	{ name: "Sub-12", displayName: "12 años y menores", minAge: 11, maxAge: 12 },
	{ name: "Sub-14", displayName: "14 años y menores", minAge: 13, maxAge: 14 },
	{ name: "Sub-16", displayName: "16 años y menores", minAge: 15, maxAge: 16 },
	{ name: "Sub-18", displayName: "18 años y menores", minAge: 17, maxAge: 18 },
	{ name: "Mayores", displayName: "19 años y mayores", minAge: 19, maxAge: 99 },
];

export async function seedAgeCategoriesAndRegistrations(
	db: any,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	const ageCategories: Array<typeof schema.ageCategoryTable.$inferInsert> = [];
	const categoryIds: string[] = [];

	// Check existing categories for this org
	const existingCategories = await db.query.ageCategoryTable.findMany({
		where: eq(schema.ageCategoryTable.organizationId, context.organizationId),
	});

	const existingNames = new Set(existingCategories.map((c: any) => c.name));

	let sortOrder = existingCategories.length;
	for (const cat of categories) {
		if (!existingNames.has(cat.name)) {
			const id = randomUUID();
			categoryIds.push(id);
			ageCategories.push({
				id,
				organizationId: context.organizationId,
				name: cat.name,
				displayName: cat.displayName,
				minAge: cat.minAge,
				maxAge: cat.maxAge,
				sortOrder: sortOrder++,
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
