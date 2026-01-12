import { z } from "zod/v4";
import {
	WaitlistEntryStatus,
	WaitlistPriority,
	WaitlistReferenceType,
} from "@/lib/db/schema/enums";

// Sortable fields for waitlist entries
export const WaitlistSortField = z.enum([
	"priority",
	"position",
	"status",
	"createdAt",
]);
export type WaitlistSortField = z.infer<typeof WaitlistSortField>;

// List waitlist entries with filters
export const listWaitlistEntriesSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(), // Search by athlete name
	sortBy: WaitlistSortField.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	filters: z
		.object({
			referenceType: z.nativeEnum(WaitlistReferenceType).optional(),
			status: z.array(z.nativeEnum(WaitlistEntryStatus)).optional(),
			priority: z.array(z.nativeEnum(WaitlistPriority)).optional(),
			trainingSessionId: z.string().uuid().optional(),
			athleteGroupId: z.string().uuid().optional(),
			athleteId: z.string().uuid().optional(),
		})
		.optional(),
});

// Create waitlist entry
export const createWaitlistEntrySchema = z
	.object({
		athleteId: z.string().uuid(),
		referenceType: z.nativeEnum(WaitlistReferenceType),
		trainingSessionId: z.string().uuid().optional(),
		athleteGroupId: z.string().uuid().optional(),
		priority: z.nativeEnum(WaitlistPriority).default(WaitlistPriority.medium),
		reason: z.string().trim().max(1000, "Reason is too long").optional(),
		notes: z.string().trim().max(2000, "Notes are too long").optional(),
		expiresAt: z.coerce.date().optional(),
	})
	.refine(
		(data) => {
			if (data.referenceType === WaitlistReferenceType.trainingSession) {
				return !!data.trainingSessionId && !data.athleteGroupId;
			}
			if (data.referenceType === WaitlistReferenceType.athleteGroup) {
				return !!data.athleteGroupId && !data.trainingSessionId;
			}
			return false;
		},
		{
			message:
				"Invalid reference: must provide correct ID based on reference type",
		},
	);

// Update waitlist entry
export const updateWaitlistEntrySchema = z.object({
	id: z.string().uuid(),
	priority: z.nativeEnum(WaitlistPriority).optional(),
	reason: z
		.string()
		.trim()
		.max(1000, "Reason is too long")
		.optional()
		.nullable(),
	notes: z
		.string()
		.trim()
		.max(2000, "Notes are too long")
		.optional()
		.nullable(),
	expiresAt: z.coerce.date().optional().nullable(),
});

// Get/delete waitlist entry
export const getWaitlistEntrySchema = z.object({
	id: z.string().uuid(),
});

// Bulk delete waitlist entries
export const bulkDeleteWaitlistEntriesSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk update waitlist priority
export const bulkUpdateWaitlistPrioritySchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	priority: z.nativeEnum(WaitlistPriority),
});

// Assign from waitlist (move athlete to session/group)
export const assignFromWaitlistSchema = z.object({
	id: z.string().uuid(), // Waitlist entry ID
});

// Get waitlist count for a reference
export const getWaitlistCountSchema = z.object({
	referenceType: z.nativeEnum(WaitlistReferenceType),
	referenceId: z.string().uuid(), // trainingSessionId or athleteGroupId
});

// Type exports
export type ListWaitlistEntriesInput = z.infer<
	typeof listWaitlistEntriesSchema
>;
export type CreateWaitlistEntryInput = z.infer<
	typeof createWaitlistEntrySchema
>;
export type UpdateWaitlistEntryInput = z.infer<
	typeof updateWaitlistEntrySchema
>;
export type GetWaitlistEntryInput = z.infer<typeof getWaitlistEntrySchema>;
export type BulkDeleteWaitlistEntriesInput = z.infer<
	typeof bulkDeleteWaitlistEntriesSchema
>;
export type BulkUpdateWaitlistPriorityInput = z.infer<
	typeof bulkUpdateWaitlistPrioritySchema
>;
export type AssignFromWaitlistInput = z.infer<typeof assignFromWaitlistSchema>;
export type GetWaitlistCountInput = z.infer<typeof getWaitlistCountSchema>;
