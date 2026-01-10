import { z } from "zod/v4";
import {
	TrainingPaymentMethod,
	TrainingPaymentStatus,
} from "@/lib/db/schema/enums";

// Sortable fields for payments
export const TrainingPaymentSortField = z.enum([
	"amount",
	"paymentDate",
	"status",
	"createdAt",
]);
export type TrainingPaymentSortField = z.infer<typeof TrainingPaymentSortField>;

// List payments with filters
export const listTrainingPaymentsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: TrainingPaymentSortField.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	filters: z
		.object({
			status: z.array(z.nativeEnum(TrainingPaymentStatus)).optional(),
			paymentMethod: z.array(z.nativeEnum(TrainingPaymentMethod)).optional(),
			athleteId: z.string().uuid().optional(),
			sessionId: z.string().uuid().optional(),
			dateRange: z
				.object({
					from: z.coerce.date(),
					to: z.coerce.date(),
				})
				.optional(),
		})
		.optional(),
});

// Get payments for an athlete
export const getAthletePaymentsSchema = z.object({
	athleteId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

// Get payments for a session
export const getSessionPaymentsSchema = z.object({
	sessionId: z.string().uuid(),
});

// Create payment
export const createTrainingPaymentSchema = z.object({
	sessionId: z.string().uuid().optional().nullable(),
	athleteId: z.string().uuid().optional().nullable(),
	amount: z.number().int().min(1, "Amount must be positive"),
	currency: z.string().default("ARS"),
	status: z
		.nativeEnum(TrainingPaymentStatus)
		.default(TrainingPaymentStatus.pending),
	paymentMethod: z.nativeEnum(TrainingPaymentMethod).optional(),
	paidAmount: z.number().int().min(0).default(0),
	paymentDate: z.coerce.date().optional(),
	receiptNumber: z.string().trim().max(100).optional(),
	description: z.string().trim().max(500).optional(),
	notes: z.string().trim().max(2000).optional(),
});

// Update payment
export const updateTrainingPaymentSchema = z.object({
	id: z.string().uuid(),
	amount: z.number().int().min(1).optional(),
	status: z.nativeEnum(TrainingPaymentStatus).optional(),
	paymentMethod: z.nativeEnum(TrainingPaymentMethod).optional().nullable(),
	paidAmount: z.number().int().min(0).optional(),
	paymentDate: z.coerce.date().optional().nullable(),
	receiptNumber: z.string().trim().max(100).optional().nullable(),
	description: z.string().trim().max(500).optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

// Record payment (mark as paid)
export const recordPaymentSchema = z.object({
	id: z.string().uuid(),
	paymentMethod: z.nativeEnum(TrainingPaymentMethod),
	paidAmount: z.number().int().min(1),
	paymentDate: z.coerce.date().optional(),
	receiptNumber: z.string().trim().max(100).optional(),
	notes: z.string().trim().max(2000).optional(),
});

// Delete payment
export const deleteTrainingPaymentSchema = z.object({
	id: z.string().uuid(),
});

// Bulk delete payments
export const bulkDeleteTrainingPaymentsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk update payment status
export const bulkUpdateTrainingPaymentsStatusSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	status: z.nativeEnum(TrainingPaymentStatus),
});

// Type exports
export type ListTrainingPaymentsInput = z.infer<
	typeof listTrainingPaymentsSchema
>;
export type GetAthletePaymentsInput = z.infer<typeof getAthletePaymentsSchema>;
export type GetSessionPaymentsInput = z.infer<typeof getSessionPaymentsSchema>;
export type CreateTrainingPaymentInput = z.infer<
	typeof createTrainingPaymentSchema
>;
export type UpdateTrainingPaymentInput = z.infer<
	typeof updateTrainingPaymentSchema
>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type DeleteTrainingPaymentInput = z.infer<
	typeof deleteTrainingPaymentSchema
>;
export type BulkDeleteTrainingPaymentsInput = z.infer<
	typeof bulkDeleteTrainingPaymentsSchema
>;
export type BulkUpdateTrainingPaymentsStatusInput = z.infer<
	typeof bulkUpdateTrainingPaymentsStatusSchema
>;
