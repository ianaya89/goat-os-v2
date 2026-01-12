import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";

const expenseCategories = [
	{ name: "Alquiler de Canchas", type: "operational" as const },
	{ name: "Equipamiento", type: "operational" as const },
	{ name: "Material Deportivo", type: "operational" as const },
	{ name: "Transporte", type: "operational" as const },
	{ name: "Salarios Entrenadores", type: "personnel" as const },
	{ name: "Comisiones", type: "personnel" as const },
	{ name: "Servicios (Luz, Gas)", type: "operational" as const },
	{ name: "Marketing", type: "other" as const },
	{ name: "Seguros", type: "other" as const },
	{ name: "Mantenimiento", type: "operational" as const },
];

const expenseDescriptions = [
	"Pago mensual",
	"Compra de materiales",
	"Renovación de equipos",
	"Gastos de competencia",
	"Pago de servicios",
];

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function seedExpenses(
	db: any,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	// Check existing categories
	const existingCategories = await db.query.expenseCategoryTable.findMany({
		where: eq(
			schema.expenseCategoryTable.organizationId,
			context.organizationId,
		),
	});

	const existingNames = new Set(existingCategories.map((c: any) => c.name));
	const categoriesToCreate: Array<
		typeof schema.expenseCategoryTable.$inferInsert
	> = [];
	const categoryIds: string[] = existingCategories.map((c: any) => c.id);

	// Create missing categories
	for (const cat of expenseCategories) {
		if (!existingNames.has(cat.name)) {
			const id = randomUUID();
			categoryIds.push(id);
			categoriesToCreate.push({
				id,
				organizationId: context.organizationId,
				name: cat.name,
				type: cat.type,
				description: `Categoría para ${cat.name.toLowerCase()}`,
				isActive: true,
			});
		}
	}

	if (categoriesToCreate.length > 0) {
		await db
			.insert(schema.expenseCategoryTable)
			.values(categoriesToCreate)
			.onConflictDoNothing();
	}

	// Create expenses
	const expenses: Array<typeof schema.expenseTable.$inferInsert> = [];
	const now = new Date();

	for (let i = 0; i < count; i++) {
		if (categoryIds.length === 0) continue;

		const expenseDate = addDays(now, -Math.floor(Math.random() * 90));

		expenses.push({
			id: randomUUID(),
			organizationId: context.organizationId,
			categoryId: categoryIds[Math.floor(Math.random() * categoryIds.length)],
			amount: (100 + Math.floor(Math.random() * 10000)) * 100,
			currency: "ARS",
			description:
				expenseDescriptions[
					Math.floor(Math.random() * expenseDescriptions.length)
				],
			expenseDate,
			recordedBy: context.seedUserId,
		});
	}

	if (expenses.length > 0) {
		await db.insert(schema.expenseTable).values(expenses).onConflictDoNothing();
	}

	return categoryIds;
}
