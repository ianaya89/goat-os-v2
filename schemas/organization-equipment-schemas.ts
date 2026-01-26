import { z } from "zod";
import {
	EquipmentCondition,
	TrainingEquipmentCategory,
	TrainingEquipmentStatus,
} from "@/lib/db/schema/enums";

// ============================================================================
// TRAINING EQUIPMENT SCHEMAS
// ============================================================================

export const listEquipmentSchema = z.object({
	category: z.nativeEnum(TrainingEquipmentCategory).optional(),
	status: z.nativeEnum(TrainingEquipmentStatus).optional(),
	condition: z.nativeEnum(EquipmentCondition).optional(),
	locationId: z.string().uuid().optional(),
	search: z.string().optional(),
	needsMaintenance: z.boolean().optional(),
});

export const createEquipmentSchema = z.object({
	name: z.string().min(1, "El nombre es requerido"),
	description: z.string().optional(),
	brand: z.string().optional(),
	model: z.string().optional(),
	serialNumber: z.string().optional(),
	category: z
		.nativeEnum(TrainingEquipmentCategory)
		.default(TrainingEquipmentCategory.other),
	totalQuantity: z.number().int().min(1).default(1),
	availableQuantity: z.number().int().min(0).optional(),
	status: z
		.nativeEnum(TrainingEquipmentStatus)
		.default(TrainingEquipmentStatus.available),
	condition: z.nativeEnum(EquipmentCondition).default(EquipmentCondition.good),
	purchasePrice: z.number().int().min(0).optional(),
	purchaseDate: z.date().optional(),
	currency: z.string().default("ARS"),
	locationId: z.string().uuid().optional(),
	storageLocation: z.string().optional(),
	lastMaintenanceDate: z.date().optional(),
	nextMaintenanceDate: z.date().optional(),
	imageUrl: z.string().url().optional().or(z.literal("")),
	notes: z.string().optional(),
});

export const updateEquipmentSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	brand: z.string().optional(),
	model: z.string().optional(),
	serialNumber: z.string().optional(),
	category: z.nativeEnum(TrainingEquipmentCategory).optional(),
	totalQuantity: z.number().int().min(1).optional(),
	availableQuantity: z.number().int().min(0).optional(),
	status: z.nativeEnum(TrainingEquipmentStatus).optional(),
	condition: z.nativeEnum(EquipmentCondition).optional(),
	purchasePrice: z.number().int().min(0).optional(),
	purchaseDate: z.date().optional(),
	currency: z.string().optional(),
	locationId: z.string().uuid().nullable().optional(),
	storageLocation: z.string().optional(),
	lastMaintenanceDate: z.date().optional(),
	nextMaintenanceDate: z.date().optional(),
	imageUrl: z.string().url().optional().or(z.literal("")),
	notes: z.string().optional(),
	isActive: z.boolean().optional(),
});

export const deleteEquipmentSchema = z.object({
	id: z.string().uuid(),
});

export const getEquipmentSchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// EQUIPMENT ASSIGNMENT SCHEMAS
// ============================================================================

export const listAssignmentsSchema = z.object({
	equipmentId: z.string().uuid().optional(),
	athleteGroupId: z.string().uuid().optional(),
	trainingSessionId: z.string().uuid().optional(),
	coachId: z.string().uuid().optional(),
	activeOnly: z.boolean().optional(), // Not returned yet
});

export const createAssignmentSchema = z.object({
	equipmentId: z.string().uuid(),
	athleteGroupId: z.string().uuid().optional(),
	trainingSessionId: z.string().uuid().optional(),
	coachId: z.string().uuid().optional(),
	quantity: z.number().int().min(1).default(1),
	expectedReturnAt: z.date().optional(),
	notes: z.string().optional(),
});

export const returnAssignmentSchema = z.object({
	id: z.string().uuid(),
	notes: z.string().optional(),
});

export const deleteAssignmentSchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// EQUIPMENT MAINTENANCE SCHEMAS
// ============================================================================

export const listMaintenanceSchema = z.object({
	equipmentId: z.string().uuid(),
	limit: z.number().int().min(1).max(100).default(20),
});

export const createMaintenanceSchema = z.object({
	equipmentId: z.string().uuid(),
	maintenanceType: z.string().min(1, "El tipo de mantenimiento es requerido"),
	description: z.string().optional(),
	cost: z.number().int().min(0).optional(),
	currency: z.string().default("ARS"),
	newCondition: z.nativeEnum(EquipmentCondition).optional(),
	performedAt: z.date().optional(),
	notes: z.string().optional(),
});

// Type exports
export type ListEquipmentInput = z.infer<typeof listEquipmentSchema>;
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type ListAssignmentsInput = z.infer<typeof listAssignmentsSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type ReturnAssignmentInput = z.infer<typeof returnAssignmentSchema>;
export type ListMaintenanceInput = z.infer<typeof listMaintenanceSchema>;
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
