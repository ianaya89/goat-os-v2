import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";

const movementDescriptions = {
	income: [
		"Pago de cuota mensual",
		"Inscripción nuevo atleta",
		"Venta de equipamiento",
		"Pago de clase particular",
		"Cobro de evento",
	],
	expense: [
		"Compra de materiales",
		"Pago de servicios",
		"Gastos de limpieza",
		"Reposición de insumos",
		"Pago a proveedor",
	],
	adjustment: ["Ajuste de caja", "Corrección de error", "Diferencia de arqueo"],
};

const movementTypes = ["income", "expense", "adjustment"] as const;

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	result.setHours(8, 0, 0, 0);
	return result;
}

function getDateOnly(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

export async function seedCashRegister(
	db: any,
	count: number,
	context: SeedContext,
): Promise<{ registerIds: string[]; movementIds: string[] }> {
	const registers: Array<typeof schema.cashRegisterTable.$inferInsert> = [];
	const movements: Array<typeof schema.cashMovementTable.$inferInsert> = [];
	const now = new Date();

	// Check existing registers
	const existingRegisters = await db.query.cashRegisterTable.findMany({
		where: eq(schema.cashRegisterTable.organizationId, context.organizationId),
	});

	const existingDates = new Set(
		existingRegisters.map((r: any) => getDateOnly(r.date).toISOString()),
	);

	const daysToCreate = Math.min(count, 30);
	let previousClosingBalance = 50000 * 100;

	for (let day = daysToCreate; day >= 0; day--) {
		const registerDate = addDays(now, -day);
		const dateKey = getDateOnly(registerDate).toISOString();

		// Skip if register exists for this date
		if (existingDates.has(dateKey)) continue;

		const registerId = randomUUID();
		const isToday = day === 0;
		const isClosed = !isToday;

		const openingBalance = previousClosingBalance;
		let runningBalance = openingBalance;

		registers.push({
			id: registerId,
			organizationId: context.organizationId,
			date: registerDate,
			openingBalance,
			closingBalance: isClosed ? null : null,
			status: isClosed ? "closed" : "open",
			openedBy: context.seedUserId,
			closedBy: isClosed ? context.seedUserId : null,
			openedAt: registerDate,
			closedAt: isClosed
				? new Date(registerDate.getTime() + 10 * 60 * 60 * 1000)
				: null,
		});

		// Create movements
		const numMovements = 3 + Math.floor(Math.random() * 6);
		for (let m = 0; m < numMovements; m++) {
			const type =
				movementTypes[Math.floor(Math.random() * movementTypes.length)];
			const descriptions = movementDescriptions[type];
			const description =
				descriptions[Math.floor(Math.random() * descriptions.length)];

			let amount: number;
			if (type === "income") {
				amount = (500 + Math.floor(Math.random() * 5000)) * 100;
				runningBalance += amount;
			} else if (type === "expense") {
				amount = (200 + Math.floor(Math.random() * 2000)) * 100;
				runningBalance -= amount;
			} else {
				amount = Math.floor(Math.random() * 1000) * 100;
				if (Math.random() > 0.5) {
					runningBalance += amount;
				} else {
					runningBalance -= amount;
				}
			}

			const movementTime = new Date(
				registerDate.getTime() + (m + 1) * 60 * 60 * 1000,
			);

			movements.push({
				id: randomUUID(),
				cashRegisterId: registerId,
				organizationId: context.organizationId,
				type,
				amount: Math.abs(amount),
				description,
				referenceType:
					type === "income"
						? "training_payment"
						: type === "expense"
							? "expense"
							: "manual",
				recordedBy: context.seedUserId,
				createdAt: movementTime,
			});
		}

		previousClosingBalance = runningBalance;
	}

	if (registers.length > 0) {
		await db
			.insert(schema.cashRegisterTable)
			.values(registers)
			.onConflictDoNothing();
	}

	const movementIds: string[] = [];
	if (movements.length > 0) {
		const result = await db
			.insert(schema.cashMovementTable)
			.values(movements)
			.onConflictDoNothing()
			.returning({ id: schema.cashMovementTable.id });
		movementIds.push(...result.map((r: { id: string }) => r.id));
	}

	return {
		registerIds: registers.map((r) => r.id as string),
		movementIds,
	};
}
