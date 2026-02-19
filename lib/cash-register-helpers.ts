import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	type CashMovementReferenceType,
	CashMovementType,
	CashRegisterStatus,
	TrainingPaymentMethod,
} from "@/lib/db/schema/enums";
import { cashMovementTable, cashRegisterTable } from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";

// Helper to get start of day
function getStartOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

type CreateCashMovementParams = {
	organizationId: string;
	paymentMethod: string | null | undefined;
	amount: number;
	description: string;
	referenceType: CashMovementReferenceType;
	referenceId: string;
	recordedBy: string;
	type?: CashMovementType;
};

/**
 * Creates a cash movement if the payment method is cash and a cash register is open.
 * Does not block the payment if no cash register is open (logs a warning instead).
 */
export async function createCashMovementIfCash({
	organizationId,
	paymentMethod,
	amount,
	description,
	referenceType,
	referenceId,
	recordedBy,
	type = CashMovementType.income,
}: CreateCashMovementParams): Promise<void> {
	// Only create movement for cash payments
	const isCash =
		paymentMethod === TrainingPaymentMethod.cash || paymentMethod === "cash";

	if (!isCash) {
		return;
	}

	const today = getStartOfDay(new Date());

	// Get today's open cash register
	const cashRegister = await db.query.cashRegisterTable.findFirst({
		where: and(
			eq(cashRegisterTable.organizationId, organizationId),
			eq(cashRegisterTable.date, today),
			eq(cashRegisterTable.status, CashRegisterStatus.open),
		),
	});

	if (!cashRegister) {
		logger.warn(
			{ organizationId, referenceType, referenceId },
			"Cash payment recorded but no open cash register for today",
		);
		return;
	}

	// Check for duplicate (in case of retry or idempotency)
	const existingMovement = await db.query.cashMovementTable.findFirst({
		where: and(
			eq(cashMovementTable.referenceType, referenceType),
			eq(cashMovementTable.referenceId, referenceId),
		),
	});

	if (existingMovement) {
		logger.info(
			{ organizationId, referenceType, referenceId },
			"Cash movement already exists for this reference",
		);
		return;
	}

	// Create the cash movement
	await db.insert(cashMovementTable).values({
		cashRegisterId: cashRegister.id,
		organizationId,
		type,
		amount,
		description,
		referenceType,
		referenceId,
		recordedBy,
	});

	logger.info(
		{ organizationId, referenceType, referenceId, amount },
		"Cash movement created automatically",
	);
}
