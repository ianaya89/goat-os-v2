import { z } from "zod/v4";

// Sortable fields for locations
export const LocationSortField = z.enum([
	"name",
	"city",
	"capacity",
	"isActive",
	"createdAt",
]);
export type LocationSortField = z.infer<typeof LocationSortField>;

// Get all locations with filters
export const listLocationsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: LocationSortField.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
	filters: z
		.object({
			isActive: z.boolean().optional(),
		})
		.optional(),
});

// Hex color validation regex
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Create location
export const createLocationSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(200, "Name is too long"),
	address: z.string().trim().max(500, "Address is too long").optional(),
	city: z.string().trim().max(100, "City is too long").optional(),
	state: z.string().trim().max(100, "State is too long").optional(),
	country: z.string().trim().max(100, "Country is too long").optional(),
	postalCode: z.string().trim().max(20, "Postal code is too long").optional(),
	capacity: z.number().int().min(1).max(100000).optional(),
	notes: z.string().trim().max(2000, "Notes is too long").optional(),
	color: z.string().regex(hexColorRegex, "Invalid color format").optional(),
	isActive: z.boolean().default(true),
});

// Update location
export const updateLocationSchema = z.object({
	id: z.string().uuid(),
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(200, "Name is too long")
		.optional(),
	address: z
		.string()
		.trim()
		.max(500, "Address is too long")
		.optional()
		.nullable(),
	city: z.string().trim().max(100, "City is too long").optional().nullable(),
	state: z.string().trim().max(100, "State is too long").optional().nullable(),
	country: z
		.string()
		.trim()
		.max(100, "Country is too long")
		.optional()
		.nullable(),
	postalCode: z
		.string()
		.trim()
		.max(20, "Postal code is too long")
		.optional()
		.nullable(),
	capacity: z.number().int().min(1).max(100000).optional().nullable(),
	notes: z.string().trim().max(2000, "Notes is too long").optional().nullable(),
	color: z
		.string()
		.regex(hexColorRegex, "Invalid color format")
		.optional()
		.nullable(),
	isActive: z.boolean().optional(),
});

// Delete location
export const deleteLocationSchema = z.object({
	id: z.string().uuid(),
});

// Bulk delete locations
export const bulkDeleteLocationsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk update locations active status
export const bulkUpdateLocationsActiveSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	isActive: z.boolean(),
});

// Type exports
export type ListLocationsInput = z.infer<typeof listLocationsSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type DeleteLocationInput = z.infer<typeof deleteLocationSchema>;
export type BulkDeleteLocationsInput = z.infer<
	typeof bulkDeleteLocationsSchema
>;
export type BulkUpdateLocationsActiveInput = z.infer<
	typeof bulkUpdateLocationsActiveSchema
>;
