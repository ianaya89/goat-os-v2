import { z } from "zod/v4";

// Sortable fields for seasons
export const SeasonSortField = z.enum([
	"name",
	"startDate",
	"endDate",
	"isActive",
	"createdAt",
]);
export type SeasonSortField = z.infer<typeof SeasonSortField>;

// List seasons with filters
export const listSeasonsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: SeasonSortField.default("startDate"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	filters: z
		.object({
			isActive: z.boolean().optional(),
			isCurrent: z.boolean().optional(),
		})
		.optional(),
});

// Get single season
export const getSeasonSchema = z.object({
	id: z.string().uuid(),
});

// Create season
export const createSeasonSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(100, "Name is too long"),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	isActive: z.boolean().default(true),
	isCurrent: z.boolean().default(false),
});

// Update season
export const updateSeasonSchema = z.object({
	id: z.string().uuid(),
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(100, "Name is too long")
		.optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	isActive: z.boolean().optional(),
	isCurrent: z.boolean().optional(),
});

// Delete season
export const deleteSeasonSchema = z.object({
	id: z.string().uuid(),
});

// Set current season
export const setCurrentSeasonSchema = z.object({
	id: z.string().uuid(),
});

// Type exports
export type ListSeasonsInput = z.infer<typeof listSeasonsSchema>;
export type GetSeasonInput = z.infer<typeof getSeasonSchema>;
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
export type DeleteSeasonInput = z.infer<typeof deleteSeasonSchema>;
export type SetCurrentSeasonInput = z.infer<typeof setCurrentSeasonSchema>;
