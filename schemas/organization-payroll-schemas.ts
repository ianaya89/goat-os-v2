import { z } from "zod/v4";
import {
	CoachPaymentType,
	PayrollPeriodType,
	PayrollStaffType,
	PayrollStatus,
	TrainingPaymentMethod,
} from "@/lib/db/schema/enums";

// ============================================================================
// STAFF PAYROLL SCHEMAS
// ============================================================================

// Sortable fields for payroll
export const PayrollSortField = z.enum([
	"periodStart",
	"totalAmount",
	"status",
	"createdAt",
]);
export type PayrollSortField = z.infer<typeof PayrollSortField>;

// List payroll with filters
export const listPayrollSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: PayrollSortField.default("periodStart"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	filters: z
		.object({
			status: z.array(z.nativeEnum(PayrollStatus)).optional(),
			staffType: z.array(z.nativeEnum(PayrollStaffType)).optional(),
			periodType: z.array(z.nativeEnum(PayrollPeriodType)).optional(),
			coachId: z.string().uuid().optional(),
			userId: z.string().uuid().optional(),
			dateRange: z
				.object({
					from: z.coerce.date(),
					to: z.coerce.date(),
				})
				.optional(),
			amountRange: z
				.object({
					min: z.number().int().min(0).optional(),
					max: z.number().int().min(0).optional(),
				})
				.optional(),
		})
		.optional(),
});

// Get single payroll
export const getPayrollSchema = z.object({
	id: z.string().uuid(),
});

// Create payroll - base schema for all staff types
const baseCreatePayrollSchema = z.object({
	// Period
	periodStart: z.coerce.date(),
	periodEnd: z.coerce.date(),
	periodType: z
		.nativeEnum(PayrollPeriodType)
		.default(PayrollPeriodType.monthly),

	// Amounts (in centavos)
	baseSalary: z.number().int().min(0).default(0),
	bonuses: z.number().int().min(0).default(0),
	deductions: z.number().int().min(0).default(0),
	currency: z.string().default("ARS"),

	// Concept/description
	concept: z.string().trim().max(500).optional(),
	notes: z.string().trim().max(2000).optional(),
});

// Create payroll for coach
export const createPayrollForCoachSchema = baseCreatePayrollSchema.extend({
	staffType: z.literal(PayrollStaffType.coach),
	coachId: z.string().uuid(),
	// Coach payment type: per_session or fixed
	coachPaymentType: z
		.nativeEnum(CoachPaymentType)
		.default(CoachPaymentType.fixed),
	// For per_session type: rate per session (in centavos)
	ratePerSession: z.number().int().min(0).optional(),
	// Session count (calculated automatically, can be overridden)
	sessionCount: z.number().int().min(0).optional(),
});

// Create payroll for staff (user)
export const createPayrollForStaffSchema = baseCreatePayrollSchema.extend({
	staffType: z.literal(PayrollStaffType.staff),
	userId: z.string().uuid(),
});

// Create payroll for external contractor
export const createPayrollForExternalSchema = baseCreatePayrollSchema.extend({
	staffType: z.literal(PayrollStaffType.external),
	externalName: z.string().trim().min(1, "Name is required").max(200),
	externalEmail: z.string().email().optional(),
});

// Union of all create schemas
export const createPayrollSchema = z.discriminatedUnion("staffType", [
	createPayrollForCoachSchema,
	createPayrollForStaffSchema,
	createPayrollForExternalSchema,
]);

// Update payroll
export const updatePayrollSchema = z.object({
	id: z.string().uuid(),
	periodStart: z.coerce.date().optional(),
	periodEnd: z.coerce.date().optional(),
	periodType: z.nativeEnum(PayrollPeriodType).optional(),
	baseSalary: z.number().int().min(0).optional(),
	bonuses: z.number().int().min(0).optional(),
	deductions: z.number().int().min(0).optional(),
	concept: z.string().trim().max(500).optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

// Approve payroll
export const approvePayrollSchema = z.object({
	id: z.string().uuid(),
});

// Mark payroll as paid (with payment details)
export const markPayrollAsPaidSchema = z.object({
	id: z.string().uuid(),
	paymentMethod: z.nativeEnum(TrainingPaymentMethod),
	paymentDate: z.coerce.date().optional(), // Defaults to now
	createExpense: z.boolean().default(true), // Whether to create an expense record
});

// Cancel payroll
export const cancelPayrollSchema = z.object({
	id: z.string().uuid(),
});

// Delete payroll
export const deletePayrollSchema = z.object({
	id: z.string().uuid(),
});

// Bulk delete payroll
export const bulkDeletePayrollSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk approve payroll
export const bulkApprovePayrollSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Export payroll to CSV
export const exportPayrollSchema = z.object({
	payrollIds: z.array(z.string().uuid()).min(1),
});

// Summary/stats schema
export const getPayrollSummarySchema = z.object({
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Get coach sessions for a period (for calculating per-session payroll)
export const getCoachSessionsSchema = z.object({
	coachId: z.string().uuid(),
	periodStart: z.coerce.date(),
	periodEnd: z.coerce.date(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ListPayrollInput = z.infer<typeof listPayrollSchema>;
export type GetPayrollInput = z.infer<typeof getPayrollSchema>;
export type CreatePayrollInput = z.infer<typeof createPayrollSchema>;
export type CreatePayrollForCoachInput = z.infer<
	typeof createPayrollForCoachSchema
>;
export type CreatePayrollForStaffInput = z.infer<
	typeof createPayrollForStaffSchema
>;
export type CreatePayrollForExternalInput = z.infer<
	typeof createPayrollForExternalSchema
>;
export type UpdatePayrollInput = z.infer<typeof updatePayrollSchema>;
export type ApprovePayrollInput = z.infer<typeof approvePayrollSchema>;
export type MarkPayrollAsPaidInput = z.infer<typeof markPayrollAsPaidSchema>;
export type CancelPayrollInput = z.infer<typeof cancelPayrollSchema>;
export type DeletePayrollInput = z.infer<typeof deletePayrollSchema>;
export type BulkDeletePayrollInput = z.infer<typeof bulkDeletePayrollSchema>;
export type BulkApprovePayrollInput = z.infer<typeof bulkApprovePayrollSchema>;
export type ExportPayrollInput = z.infer<typeof exportPayrollSchema>;
export type GetPayrollSummaryInput = z.infer<typeof getPayrollSummarySchema>;
