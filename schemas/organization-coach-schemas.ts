import { z } from "zod/v4";
import { CoachStatus } from "@/lib/db/schema/enums";

// Sortable fields for coaches
export const CoachSortField = z.enum([
	"name",
	"email",
	"specialty",
	"status",
	"createdAt",
]);
export type CoachSortField = z.infer<typeof CoachSortField>;

// Get all coaches with filters
export const listCoachesSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: CoachSortField.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
	filters: z
		.object({
			status: z.array(z.nativeEnum(CoachStatus)).optional(),
			createdAt: z
				.array(z.enum(["today", "this-week", "this-month", "older"]))
				.optional(),
		})
		.optional(),
});

// Create coach - includes user creation data
export const createCoachSchema = z.object({
	// User data (for creating the linked user)
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(100, "Name is too long"),
	email: z
		.string()
		.trim()
		.email("Invalid email address")
		.max(255, "Email is too long"),
	// Coach specific data
	specialty: z
		.string()
		.trim()
		.min(1, "Specialty is required")
		.max(200, "Specialty is too long"),
	bio: z.string().trim().max(2000, "Bio is too long").optional(),
	status: z.nativeEnum(CoachStatus).default(CoachStatus.active),
});

// Update coach
export const updateCoachSchema = z.object({
	id: z.string().uuid(),
	specialty: z
		.string()
		.trim()
		.min(1, "Specialty is required")
		.max(200, "Specialty is too long")
		.optional(),
	bio: z.string().trim().max(2000, "Bio is too long").optional().nullable(),
	status: z.nativeEnum(CoachStatus).optional(),
});

// Delete coach
export const deleteCoachSchema = z.object({
	id: z.string().uuid(),
});

// Bulk delete coaches
export const bulkDeleteCoachesSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk update coaches status
export const bulkUpdateCoachesStatusSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	status: z.nativeEnum(CoachStatus),
});

// Export coaches
export const exportCoachesSchema = z.object({
	coachIds: z.array(z.string().uuid()).min(1),
});

// Type exports
export type ListCoachesInput = z.infer<typeof listCoachesSchema>;
export type CreateCoachInput = z.infer<typeof createCoachSchema>;
export type UpdateCoachInput = z.infer<typeof updateCoachSchema>;
export type DeleteCoachInput = z.infer<typeof deleteCoachSchema>;
export type BulkDeleteCoachesInput = z.infer<typeof bulkDeleteCoachesSchema>;
export type BulkUpdateCoachesStatusInput = z.infer<
	typeof bulkUpdateCoachesStatusSchema
>;
export type ExportCoachesInput = z.infer<typeof exportCoachesSchema>;
