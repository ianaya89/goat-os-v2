import { z } from "zod/v4";
import { AthleteSport } from "@/lib/db/schema/enums";

// Sortable fields for athlete groups
export const AthleteGroupSortField = z.enum([
	"name",
	"sport",
	"memberCount",
	"isActive",
	"createdAt",
]);
export type AthleteGroupSortField = z.infer<typeof AthleteGroupSortField>;

// Get all athlete groups with filters
export const listAthleteGroupsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: AthleteGroupSortField.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
	includeArchived: z.boolean().default(false),
	filters: z
		.object({
			isActive: z.boolean().optional(),
			sport: z.array(z.nativeEnum(AthleteSport)).optional(),
			ageCategoryId: z.string().uuid().optional(),
			ageCategoryIds: z.array(z.string().uuid()).optional(),
		})
		.optional(),
});

// Create athlete group
export const createAthleteGroupSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(200, "Name is too long"),
	description: z
		.string()
		.trim()
		.max(2000, "Description is too long")
		.optional(),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	ageCategoryId: z.string().uuid().optional().nullable(),
	maxCapacity: z.number().int().positive().optional().nullable(),
	serviceId: z.string().uuid().optional().nullable(),
	isActive: z.boolean().default(true),
	// Initial member IDs (optional)
	memberIds: z.array(z.string().uuid()).optional(),
});

// Update athlete group
export const updateAthleteGroupSchema = z.object({
	id: z.string().uuid(),
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(200, "Name is too long")
		.optional(),
	description: z
		.string()
		.trim()
		.max(2000, "Description is too long")
		.optional()
		.nullable(),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	ageCategoryId: z.string().uuid().optional().nullable(),
	maxCapacity: z.number().int().positive().optional().nullable(),
	serviceId: z.string().uuid().optional().nullable(),
	isActive: z.boolean().optional(),
});

// Delete athlete group
export const deleteAthleteGroupSchema = z.object({
	id: z.string().uuid(),
});

// Archive athlete group (soft delete)
export const archiveAthleteGroupSchema = z.object({
	id: z.string().uuid(),
});

// Unarchive athlete group (restore from archive)
export const unarchiveAthleteGroupSchema = z.object({
	id: z.string().uuid(),
});

// Bulk archive athlete groups
export const bulkArchiveAthleteGroupsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk unarchive athlete groups
export const bulkUnarchiveAthleteGroupsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk delete athlete groups
export const bulkDeleteAthleteGroupsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk update athlete groups active status
export const bulkUpdateAthleteGroupsActiveSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	isActive: z.boolean(),
});

// Add members to group
export const addMembersToGroupSchema = z.object({
	groupId: z.string().uuid(),
	athleteIds: z.array(z.string().uuid()).min(1),
});

// Remove members from group
export const removeMembersFromGroupSchema = z.object({
	groupId: z.string().uuid(),
	athleteIds: z.array(z.string().uuid()).min(1),
});

// Set group members (replace all)
export const setGroupMembersSchema = z.object({
	groupId: z.string().uuid(),
	athleteIds: z.array(z.string().uuid()),
});

// Type exports
export type ListAthleteGroupsInput = z.infer<typeof listAthleteGroupsSchema>;
export type CreateAthleteGroupInput = z.infer<typeof createAthleteGroupSchema>;
export type UpdateAthleteGroupInput = z.infer<typeof updateAthleteGroupSchema>;
export type DeleteAthleteGroupInput = z.infer<typeof deleteAthleteGroupSchema>;
export type BulkDeleteAthleteGroupsInput = z.infer<
	typeof bulkDeleteAthleteGroupsSchema
>;
export type BulkUpdateAthleteGroupsActiveInput = z.infer<
	typeof bulkUpdateAthleteGroupsActiveSchema
>;
export type AddMembersToGroupInput = z.infer<typeof addMembersToGroupSchema>;
export type RemoveMembersFromGroupInput = z.infer<
	typeof removeMembersFromGroupSchema
>;
export type SetGroupMembersInput = z.infer<typeof setGroupMembersSchema>;
