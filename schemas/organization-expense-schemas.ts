import { z } from "zod/v4";
import {
	ExpenseCategory,
	ExpenseCategoryType,
	TrainingPaymentMethod,
} from "@/lib/db/schema/enums";

// ============================================================================
// EXPENSE CATEGORY SCHEMAS
// ============================================================================

export const listExpenseCategoriesSchema = z.object({
	includeInactive: z.boolean().default(false),
});

export const createExpenseCategorySchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(100),
	description: z.string().trim().max(500).optional(),
	type: z
		.nativeEnum(ExpenseCategoryType)
		.default(ExpenseCategoryType.operational),
});

export const updateExpenseCategorySchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(100).optional(),
	description: z.string().trim().max(500).optional().nullable(),
	type: z.nativeEnum(ExpenseCategoryType).optional(),
	isActive: z.boolean().optional(),
});

export const deleteExpenseCategorySchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// EXPENSE SCHEMAS
// ============================================================================

// Sortable fields for expenses
export const ExpenseSortField = z.enum(["amount", "expenseDate", "createdAt"]);
export type ExpenseSortField = z.infer<typeof ExpenseSortField>;

// List expenses with filters
export const listExpensesSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: ExpenseSortField.default("expenseDate"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	filters: z
		.object({
			categoryId: z.string().uuid().optional(),
			category: z.array(z.nativeEnum(ExpenseCategory)).optional(),
			categoryType: z.nativeEnum(ExpenseCategoryType).optional(),
			paymentMethod: z.array(z.nativeEnum(TrainingPaymentMethod)).optional(),
			dateRange: z
				.object({
					from: z.coerce.date(),
					to: z.coerce.date(),
				})
				.optional(),
			amountRange: z
				.object({
					min: z.number().int().min(0).optional(),
					max: z.number().int().min(0).optional(),
				})
				.optional(),
		})
		.optional(),
});

// Get single expense
export const getExpenseSchema = z.object({
	id: z.string().uuid(),
});

// Create expense
export const createExpenseSchema = z.object({
	categoryId: z.string().uuid().optional().nullable(),
	category: z.nativeEnum(ExpenseCategory).optional().nullable(),
	amount: z.number().int().min(1, "Amount must be positive"),
	currency: z.string().default("ARS"),
	description: z.string().trim().min(1, "Description is required").max(500),
	expenseDate: z.coerce.date(),
	paymentMethod: z
		.nativeEnum(TrainingPaymentMethod)
		.default(TrainingPaymentMethod.cash),
	receiptNumber: z.string().trim().max(100).optional(),
	vendor: z.string().trim().max(200).optional(),
	notes: z.string().trim().max(2000).optional(),
});

// Update expense
export const updateExpenseSchema = z.object({
	id: z.string().uuid(),
	categoryId: z.string().uuid().optional().nullable(),
	category: z.nativeEnum(ExpenseCategory).optional().nullable(),
	amount: z.number().int().min(1).optional(),
	description: z.string().trim().min(1).max(500).optional(),
	expenseDate: z.coerce.date().optional(),
	paymentMethod: z.nativeEnum(TrainingPaymentMethod).optional(),
	receiptNumber: z.string().trim().max(100).optional().nullable(),
	vendor: z.string().trim().max(200).optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

// Delete expense
export const deleteExpenseSchema = z.object({
	id: z.string().uuid(),
});

// Receipt upload URL
export const getExpenseReceiptUploadUrlSchema = z.object({
	expenseId: z.string().uuid(),
	filename: z.string().min(1),
	contentType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
});

// Update expense receipt
export const updateExpenseReceiptSchema = z.object({
	expenseId: z.string().uuid(),
	receiptImageKey: z.string().min(1),
});

// Delete expense receipt
export const deleteExpenseReceiptSchema = z.object({
	expenseId: z.string().uuid(),
});

// Get receipt download URL
export const getExpenseReceiptDownloadUrlSchema = z.object({
	expenseId: z.string().uuid(),
});

// Bulk delete expenses
export const bulkDeleteExpensesSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Export expenses to CSV
export const exportExpensesSchema = z.object({
	expenseIds: z.array(z.string().uuid()).min(1),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ListExpenseCategoriesInput = z.infer<
	typeof listExpenseCategoriesSchema
>;
export type CreateExpenseCategoryInput = z.infer<
	typeof createExpenseCategorySchema
>;
export type UpdateExpenseCategoryInput = z.infer<
	typeof updateExpenseCategorySchema
>;
export type DeleteExpenseCategoryInput = z.infer<
	typeof deleteExpenseCategorySchema
>;

export type ListExpensesInput = z.infer<typeof listExpensesSchema>;
export type GetExpenseInput = z.infer<typeof getExpenseSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type DeleteExpenseInput = z.infer<typeof deleteExpenseSchema>;
export type BulkDeleteExpensesInput = z.infer<typeof bulkDeleteExpensesSchema>;
export type ExportExpensesInput = z.infer<typeof exportExpensesSchema>;
