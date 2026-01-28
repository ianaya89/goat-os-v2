import { z } from "zod/v4";

// ============================================================================
// FINANCIAL REPORTS SCHEMAS
// ============================================================================

// Period type for aggregation
export const ReportPeriod = z.enum(["day", "week", "month", "year"]);
export type ReportPeriod = z.infer<typeof ReportPeriod>;

// Financial summary (totals for a period)
export const getFinancialSummarySchema = z.object({
	dateRange: z.object({
		from: z.coerce.date(),
		to: z.coerce.date(),
	}),
});

// Revenue by period (grouped data)
export const getRevenueByPeriodSchema = z.object({
	period: ReportPeriod.default("month"),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(), // Defaults to last 12 months
});

// Revenue by athlete
export const getRevenueByAthleteSchema = z.object({
	limit: z.number().min(1).max(100).default(20),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Expenses by category
export const getExpensesByCategorySchema = z.object({
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Expenses by period
export const getExpensesByPeriodSchema = z.object({
	period: ReportPeriod.default("month"),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Cash flow report
export const getCashFlowReportSchema = z.object({
	period: ReportPeriod.default("month"),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Outstanding payments
export const getOutstandingPaymentsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

// Revenue by payment method
export const getRevenueByPaymentMethodSchema = z.object({
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Revenue with cumulative (monthly + running total)
export const getRevenueWithCumulativeSchema = z.object({
	period: ReportPeriod.default("month"),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Revenue by event (sports events)
export const getRevenueByEventSchema = z.object({
	limit: z.number().min(1).max(50).default(10),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Revenue by location
export const getRevenueByLocationSchema = z.object({
	limit: z.number().min(1).max(50).default(10),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Revenue by service
export const getRevenueByServiceSchema = z.object({
	limit: z.number().min(1).max(50).default(10),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Revenue composition (training vs events)
export const getRevenueCompositionSchema = z.object({
	period: ReportPeriod.default("month"),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// ============================================================================
// PENDING PAYMENTS REPORTS SCHEMAS
// ============================================================================

// Pending event registrations (inscriptions pending payment)
export const getPendingEventRegistrationsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

// Pending payments summary (combined training + events)
export const getPendingSummarySchema = z.object({});

// ============================================================================
// TRAINING REPORTS SCHEMAS
// ============================================================================

// Training summary (sessions stats for a period)
export const getTrainingSummarySchema = z.object({
	dateRange: z.object({
		from: z.coerce.date(),
		to: z.coerce.date(),
	}),
});

// Sessions by period
export const getSessionsByPeriodSchema = z.object({
	period: ReportPeriod.default("month"),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Attendance by athlete (top/worst attendance)
export const getAttendanceByAthleteSchema = z.object({
	limit: z.number().min(1).max(100).default(20),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
	sortBy: z.enum(["best", "worst"]).default("best"),
});

// Attendance by group
export const getAttendanceByGroupSchema = z.object({
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Sessions by coach
export const getSessionsByCoachSchema = z.object({
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Attendance trend (over time)
export const getAttendanceTrendSchema = z.object({
	period: ReportPeriod.default("month"),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type GetFinancialSummaryInput = z.infer<
	typeof getFinancialSummarySchema
>;
export type GetRevenueByPeriodInput = z.infer<typeof getRevenueByPeriodSchema>;
export type GetRevenueByAthleteInput = z.infer<
	typeof getRevenueByAthleteSchema
>;
export type GetExpensesByCategoryInput = z.infer<
	typeof getExpensesByCategorySchema
>;
export type GetExpensesByPeriodInput = z.infer<
	typeof getExpensesByPeriodSchema
>;
export type GetCashFlowReportInput = z.infer<typeof getCashFlowReportSchema>;
export type GetOutstandingPaymentsInput = z.infer<
	typeof getOutstandingPaymentsSchema
>;
export type GetRevenueByPaymentMethodInput = z.infer<
	typeof getRevenueByPaymentMethodSchema
>;
export type GetRevenueWithCumulativeInput = z.infer<
	typeof getRevenueWithCumulativeSchema
>;
export type GetRevenueByEventInput = z.infer<typeof getRevenueByEventSchema>;
export type GetRevenueByLocationInput = z.infer<
	typeof getRevenueByLocationSchema
>;
export type GetTrainingSummaryInput = z.infer<typeof getTrainingSummarySchema>;
export type GetSessionsByPeriodInput = z.infer<
	typeof getSessionsByPeriodSchema
>;
export type GetAttendanceByAthleteInput = z.infer<
	typeof getAttendanceByAthleteSchema
>;
export type GetAttendanceByGroupInput = z.infer<
	typeof getAttendanceByGroupSchema
>;
export type GetSessionsByCoachInput = z.infer<typeof getSessionsByCoachSchema>;
export type GetAttendanceTrendInput = z.infer<typeof getAttendanceTrendSchema>;
export type GetPendingEventRegistrationsInput = z.infer<
	typeof getPendingEventRegistrationsSchema
>;
export type GetRevenueByServiceInput = z.infer<
	typeof getRevenueByServiceSchema
>;
export type GetRevenueCompositionInput = z.infer<
	typeof getRevenueCompositionSchema
>;
export type GetPendingSummaryInput = z.infer<typeof getPendingSummarySchema>;
