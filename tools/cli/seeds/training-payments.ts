import { eq } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import { ENTITY_PAYMENT, seedUUID } from "./utils";

const paymentMethods = [
	"cash",
	"bank_transfer",
	"mercado_pago",
	"card",
] as const;
const paymentStatuses = ["pending", "paid", "partial"] as const;

const descriptions = [
	"Cuota mensual de entrenamiento",
	"Clase particular",
	"Inscripción al programa",
	"Pago de sesión individual",
	"Cuota trimestral",
];

function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function seedTrainingPayments(
	db: DrizzleClient,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	if (context.athleteIds.length === 0) {
		return [];
	}

	// Check for existing seed payments
	const existingPayments = await db.query.trainingPaymentTable.findMany({
		where: eq(
			schema.trainingPaymentTable.organizationId,
			context.organizationId,
		),
	});

	if (existingPayments.length >= count) {
		return existingPayments.slice(0, count).map((p: any) => p.id);
	}

	const existingIds = new Set(existingPayments.map((p: any) => p.id));
	const payments: Array<typeof schema.trainingPaymentTable.$inferInsert> = [];
	const paymentIds: string[] = existingPayments.map((p: any) => p.id);
	const now = new Date();

	for (let i = 0; i < count; i++) {
		const paymentId = seedUUID(ENTITY_PAYMENT, i + 1);
		if (existingIds.has(paymentId)) continue;

		const athleteId = context.athleteIds[i % context.athleteIds.length];
		const sessionId =
			context.trainingSessionIds.length > 0
				? context.trainingSessionIds[i % context.trainingSessionIds.length]
				: null;

		const amount = (1000 + i * 500) * 100;
		const status = paymentStatuses[i % paymentStatuses.length];
		const paidAmount =
			status === "paid"
				? amount
				: status === "partial"
					? Math.floor(amount * 0.5)
					: 0;
		const paymentDate = status !== "pending" ? addDays(now, -(i % 60)) : null;

		payments.push({
			id: paymentId,
			organizationId: context.organizationId,
			sessionId,
			athleteId,
			amount,
			currency: "ARS",
			status,
			paymentMethod:
				status !== "pending" ? paymentMethods[i % paymentMethods.length] : null,
			paidAmount,
			paymentDate,
			description: descriptions[i % descriptions.length],
			recordedBy: context.seedUserId,
		});

		paymentIds.push(paymentId);
	}

	if (payments.length > 0) {
		await db
			.insert(schema.trainingPaymentTable)
			.values(payments)
			.onConflictDoNothing();
	}

	return paymentIds;
}
