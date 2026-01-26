import { z } from "zod";
import {
	EquipmentAuditStatus,
	EquipmentAuditType,
	EquipmentCondition,
	EquipmentCountStatus,
	TrainingEquipmentCategory,
} from "@/lib/db/schema/enums";

// ============================================================================
// EQUIPMENT INVENTORY AUDIT SCHEMAS
// ============================================================================

export const listAuditsSchema = z.object({
	status: z.nativeEnum(EquipmentAuditStatus).optional(),
	auditType: z.nativeEnum(EquipmentAuditType).optional(),
	fromDate: z.date().optional(),
	toDate: z.date().optional(),
	limit: z.number().int().min(1).max(100).default(20),
	offset: z.number().int().min(0).default(0),
});

export const getAuditSchema = z.object({
	id: z.string().uuid(),
});

export const createAuditSchema = z.object({
	title: z.string().min(1, "El título es requerido").optional(),
	scheduledDate: z.date(),
	auditType: z.nativeEnum(EquipmentAuditType).default(EquipmentAuditType.full),
	categoryFilter: z.nativeEnum(TrainingEquipmentCategory).optional(),
	locationId: z.string().uuid().optional(),
	notes: z.string().optional(),
});

export const updateAuditSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(1).optional(),
	scheduledDate: z.date().optional(),
	auditType: z.nativeEnum(EquipmentAuditType).optional(),
	categoryFilter: z.nativeEnum(TrainingEquipmentCategory).nullable().optional(),
	locationId: z.string().uuid().nullable().optional(),
	notes: z.string().optional(),
});

export const deleteAuditSchema = z.object({
	id: z.string().uuid(),
});

// Start an audit (generates count items)
export const startAuditSchema = z.object({
	id: z.string().uuid(),
});

// Complete an audit
export const completeAuditSchema = z.object({
	id: z.string().uuid(),
	notes: z.string().optional(),
});

// Cancel an audit
export const cancelAuditSchema = z.object({
	id: z.string().uuid(),
	reason: z.string().optional(),
});

// ============================================================================
// EQUIPMENT INVENTORY COUNT SCHEMAS
// ============================================================================

export const listCountsSchema = z.object({
	auditId: z.string().uuid(),
	status: z.nativeEnum(EquipmentCountStatus).optional(),
	hasDiscrepancy: z.boolean().optional(),
	search: z.string().optional(),
});

export const getCountSchema = z.object({
	id: z.string().uuid(),
});

// Record a count for an item
export const recordCountSchema = z.object({
	id: z.string().uuid(),
	countedQuantity: z.number().int().min(0),
	observedCondition: z.nativeEnum(EquipmentCondition).optional(),
	notes: z.string().optional(),
});

// Batch record counts
export const batchRecordCountsSchema = z.object({
	counts: z.array(
		z.object({
			id: z.string().uuid(),
			countedQuantity: z.number().int().min(0),
			observedCondition: z.nativeEnum(EquipmentCondition).optional(),
			notes: z.string().optional(),
		}),
	),
});

// Skip a count item
export const skipCountSchema = z.object({
	id: z.string().uuid(),
	reason: z.string().optional(),
});

// Verify a count (after review)
export const verifyCountSchema = z.object({
	id: z.string().uuid(),
	notes: z.string().optional(),
});

// Approve adjustment and update inventory
export const approveAdjustmentSchema = z.object({
	id: z.string().uuid(),
	reason: z.string().min(1, "Se requiere una razón para el ajuste"),
});

// Reject adjustment (keep system quantity)
export const rejectAdjustmentSchema = z.object({
	id: z.string().uuid(),
	reason: z.string().optional(),
});

// Bulk approve adjustments
export const bulkApproveAdjustmentsSchema = z.object({
	auditId: z.string().uuid(),
	countIds: z.array(z.string().uuid()),
	reason: z.string().min(1, "Se requiere una razón para el ajuste"),
});

// ============================================================================
// AUDIT SUMMARY SCHEMA (for dashboard)
// ============================================================================

export const getAuditSummarySchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ListAuditsInput = z.infer<typeof listAuditsSchema>;
export type GetAuditInput = z.infer<typeof getAuditSchema>;
export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type UpdateAuditInput = z.infer<typeof updateAuditSchema>;
export type DeleteAuditInput = z.infer<typeof deleteAuditSchema>;
export type StartAuditInput = z.infer<typeof startAuditSchema>;
export type CompleteAuditInput = z.infer<typeof completeAuditSchema>;
export type CancelAuditInput = z.infer<typeof cancelAuditSchema>;

export type ListCountsInput = z.infer<typeof listCountsSchema>;
export type GetCountInput = z.infer<typeof getCountSchema>;
export type RecordCountInput = z.infer<typeof recordCountSchema>;
export type BatchRecordCountsInput = z.infer<typeof batchRecordCountsSchema>;
export type SkipCountInput = z.infer<typeof skipCountSchema>;
export type VerifyCountInput = z.infer<typeof verifyCountSchema>;
export type ApproveAdjustmentInput = z.infer<typeof approveAdjustmentSchema>;
export type RejectAdjustmentInput = z.infer<typeof rejectAdjustmentSchema>;
export type BulkApproveAdjustmentsInput = z.infer<
	typeof bulkApproveAdjustmentsSchema
>;
