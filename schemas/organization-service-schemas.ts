import { z } from "zod/v4";
import { ServiceStatus } from "@/lib/db/schema/enums";

// Sortable fields for services
export const ServiceSortField = z.enum([
	"name",
	"currentPrice",
	"status",
	"createdAt",
]);
export type ServiceSortField = z.infer<typeof ServiceSortField>;

// List services with filters
export const listServicesSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: ServiceSortField.default("name"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
	filters: z
		.object({
			status: z.array(z.nativeEnum(ServiceStatus)).optional(),
		})
		.optional(),
});

// Create service
export const createServiceSchema = z.object({
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
	currentPrice: z.number().int().min(0, "Price must be non-negative"),
	currency: z.string().default("ARS"),
	status: z.nativeEnum(ServiceStatus).default(ServiceStatus.active),
	sortOrder: z.number().int().default(0),
});

// Update service (metadata only - price change via dedicated endpoint)
export const updateServiceSchema = z.object({
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
	status: z.nativeEnum(ServiceStatus).optional(),
	sortOrder: z.number().int().optional(),
});

// Update service price (creates a new price history entry)
export const updateServicePriceSchema = z.object({
	id: z.string().uuid(),
	price: z.number().int().min(0, "Price must be non-negative"),
	effectiveFrom: z.coerce.date(),
});

// Delete service
export const deleteServiceSchema = z.object({
	id: z.string().uuid(),
});

// Get service by ID
export const getServiceSchema = z.object({
	id: z.string().uuid(),
});

// Get price history for a service
export const getServicePriceHistorySchema = z.object({
	serviceId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(20),
});

// Bulk delete services
export const bulkDeleteServicesSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Type exports
export type ListServicesInput = z.infer<typeof listServicesSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type UpdateServicePriceInput = z.infer<typeof updateServicePriceSchema>;
export type DeleteServiceInput = z.infer<typeof deleteServiceSchema>;
export type GetServiceInput = z.infer<typeof getServiceSchema>;
export type GetServicePriceHistoryInput = z.infer<
	typeof getServicePriceHistorySchema
>;
export type BulkDeleteServicesInput = z.infer<typeof bulkDeleteServicesSchema>;
