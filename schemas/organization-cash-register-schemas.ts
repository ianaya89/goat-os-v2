import { z } from "zod/v4";
import {
	CashMovementReferenceType,
	CashMovementType,
	CashRegisterStatus,
} from "@/lib/db/schema/enums";

// ============================================================================
// CASH REGISTER SCHEMAS
// ============================================================================

// Get current (today's) cash register
export const getCurrentCashRegisterSchema = z.object({});

// Get cash register by date
export const getCashRegisterByDateSchema = z.object({
	date: z.coerce.date(),
});

// Open cash register
export const openCashRegisterSchema = z.object({
	openingBalance: z
		.number()
		.int()
		.min(0, "Opening balance must be non-negative"),
	notes: z.string().trim().max(1000).optional(),
});

// Close cash register
export const closeCashRegisterSchema = z.object({
	id: z.string().uuid(),
	closingBalance: z
		.number()
		.int()
		.min(0, "Closing balance must be non-negative"),
	notes: z.string().trim().max(1000).optional(),
});

// Get cash register history
export const getCashRegisterHistorySchema = z.object({
	limit: z.number().min(1).max(100).default(30),
	offset: z.number().min(0).default(0),
	status: z.nativeEnum(CashRegisterStatus).optional(),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// ============================================================================
// CASH MOVEMENT SCHEMAS
// ============================================================================

// Get movements for a cash register
export const getCashMovementsSchema = z.object({
	cashRegisterId: z.string().uuid(),
	limit: z.number().min(1).max(200).default(100),
	offset: z.number().min(0).default(0),
	type: z.nativeEnum(CashMovementType).optional(),
});

// Add manual movement (adjustment)
export const addManualMovementSchema = z.object({
	type: z.nativeEnum(CashMovementType),
	amount: z.number().int().min(1, "Amount must be positive"),
	description: z.string().trim().min(1, "Description is required").max(500),
});

// Get daily summary
export const getDailySummarySchema = z.object({
	date: z.coerce.date().optional(), // Defaults to today
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GetCurrentCashRegisterInput = z.infer<
	typeof getCurrentCashRegisterSchema
>;
export type GetCashRegisterByDateInput = z.infer<
	typeof getCashRegisterByDateSchema
>;
export type OpenCashRegisterInput = z.infer<typeof openCashRegisterSchema>;
export type CloseCashRegisterInput = z.infer<typeof closeCashRegisterSchema>;
export type GetCashRegisterHistoryInput = z.infer<
	typeof getCashRegisterHistorySchema
>;
export type GetCashMovementsInput = z.infer<typeof getCashMovementsSchema>;
export type AddManualMovementInput = z.infer<typeof addManualMovementSchema>;
export type GetDailySummaryInput = z.infer<typeof getDailySummarySchema>;
