import { z } from "zod";
import {
	ProductCategory,
	ProductStatus,
	SaleStatus,
	StockTransactionType,
} from "@/lib/db/schema/enums";

// ============================================================================
// PRODUCT SCHEMAS
// ============================================================================

export const listProductsSchema = z.object({
	category: z.nativeEnum(ProductCategory).optional(),
	status: z.nativeEnum(ProductStatus).optional(),
	search: z.string().optional(),
	lowStock: z.boolean().optional(),
});

export const createProductSchema = z.object({
	name: z.string().min(1, "El nombre es requerido"),
	description: z.string().optional(),
	sku: z.string().optional(),
	barcode: z.string().optional(),
	category: z.nativeEnum(ProductCategory).default(ProductCategory.other),
	costPrice: z.number().int().min(0).default(0),
	sellingPrice: z.number().int().min(0).default(0),
	currency: z.string().default("ARS"),
	trackStock: z.boolean().default(true),
	lowStockThreshold: z.number().int().min(0).optional(),
	currentStock: z.number().int().min(0).default(0),
	status: z.nativeEnum(ProductStatus).default(ProductStatus.active),
	imageUrl: z.string().url().optional().or(z.literal("")),
	taxRate: z.number().int().min(0).max(100).optional(),
	notes: z.string().optional(),
});

export const updateProductSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	sku: z.string().optional(),
	barcode: z.string().optional(),
	category: z.nativeEnum(ProductCategory).optional(),
	costPrice: z.number().int().min(0).optional(),
	sellingPrice: z.number().int().min(0).optional(),
	currency: z.string().optional(),
	trackStock: z.boolean().optional(),
	lowStockThreshold: z.number().int().min(0).optional(),
	status: z.nativeEnum(ProductStatus).optional(),
	imageUrl: z.string().url().optional().or(z.literal("")),
	taxRate: z.number().int().min(0).max(100).optional(),
	notes: z.string().optional(),
	isActive: z.boolean().optional(),
});

export const deleteProductSchema = z.object({
	id: z.string().uuid(),
});

export const getProductSchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// STOCK TRANSACTION SCHEMAS
// ============================================================================

export const listStockTransactionsSchema = z.object({
	productId: z.string().uuid().optional(),
	type: z.nativeEnum(StockTransactionType).optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	limit: z.number().int().min(1).max(100).default(50),
});

export const createStockAdjustmentSchema = z.object({
	productId: z.string().uuid(),
	type: z.nativeEnum(StockTransactionType),
	quantity: z.number().int(), // Can be positive or negative
	reason: z.string().optional(),
	notes: z.string().optional(),
});

// ============================================================================
// SALE SCHEMAS
// ============================================================================

export const listSalesSchema = z.object({
	athleteId: z.string().uuid().optional(),
	paymentStatus: z.nativeEnum(SaleStatus).optional(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	limit: z.number().int().min(1).max(100).default(50),
});

export const saleItemSchema = z.object({
	productId: z.string().uuid(),
	quantity: z.number().int().min(1),
	unitPrice: z.number().int().min(0).optional(), // If not provided, use product's selling price
	discountAmount: z.number().int().min(0).optional(),
});

export const createSaleSchema = z.object({
	athleteId: z.string().uuid().optional(),
	customerName: z.string().optional(),
	items: z.array(saleItemSchema).min(1, "Debe incluir al menos un producto"),
	discountAmount: z.number().int().min(0).optional(),
	paymentMethod: z.string().optional(),
	notes: z.string().optional(),
});

export const completeSaleSchema = z.object({
	id: z.string().uuid(),
	paymentMethod: z.string(),
});

export const cancelSaleSchema = z.object({
	id: z.string().uuid(),
	reason: z.string().optional(),
});

export const getSaleSchema = z.object({
	id: z.string().uuid(),
});

// Type exports
export type ListProductsInput = z.infer<typeof listProductsSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListStockTransactionsInput = z.infer<
	typeof listStockTransactionsSchema
>;
export type CreateStockAdjustmentInput = z.infer<
	typeof createStockAdjustmentSchema
>;
export type ListSalesInput = z.infer<typeof listSalesSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CompleteSaleInput = z.infer<typeof completeSaleSchema>;
