import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	lte,
	or,
	type SQL,
} from "drizzle-orm";
import { createCashMovementIfCash } from "@/lib/cash-register-helpers";
import { db } from "@/lib/db";
import {
	CashMovementReferenceType,
	CashMovementType,
} from "@/lib/db/schema/enums";
import { expenseCategoryTable, expenseTable } from "@/lib/db/schema/tables";
import {
	bulkDeleteExpensesSchema,
	createExpenseCategorySchema,
	createExpenseSchema,
	deleteExpenseCategorySchema,
	deleteExpenseSchema,
	exportExpensesSchema,
	getExpenseSchema,
	listExpenseCategoriesSchema,
	listExpensesSchema,
	updateExpenseCategorySchema,
	updateExpenseSchema,
} from "@/schemas/organization-expense-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationExpenseRouter = createTRPCRouter({
	// ============================================================================
	// EXPENSE CATEGORIES
	// ============================================================================

	listCategories: protectedOrganizationProcedure
		.input(listExpenseCategoriesSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(expenseCategoryTable.organizationId, ctx.organization.id),
			];

			if (!input.includeInactive) {
				conditions.push(eq(expenseCategoryTable.isActive, true));
			}

			return db.query.expenseCategoryTable.findMany({
				where: and(...conditions),
				orderBy: asc(expenseCategoryTable.name),
			});
		}),

	createCategory: protectedOrganizationProcedure
		.input(createExpenseCategorySchema)
		.mutation(async ({ ctx, input }) => {
			// Check for duplicate name
			const existing = await db.query.expenseCategoryTable.findFirst({
				where: and(
					eq(expenseCategoryTable.organizationId, ctx.organization.id),
					eq(expenseCategoryTable.name, input.name),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A category with this name already exists",
				});
			}

			const [category] = await db
				.insert(expenseCategoryTable)
				.values({
					organizationId: ctx.organization.id,
					name: input.name,
					description: input.description,
					type: input.type,
				})
				.returning();

			return category;
		}),

	updateCategory: protectedOrganizationProcedure
		.input(updateExpenseCategorySchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.expenseCategoryTable.findFirst({
				where: and(
					eq(expenseCategoryTable.id, input.id),
					eq(expenseCategoryTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			// Check for duplicate name if changing
			if (input.name && input.name !== existing.name) {
				const duplicate = await db.query.expenseCategoryTable.findFirst({
					where: and(
						eq(expenseCategoryTable.organizationId, ctx.organization.id),
						eq(expenseCategoryTable.name, input.name),
					),
				});

				if (duplicate) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A category with this name already exists",
					});
				}
			}

			const [updated] = await db
				.update(expenseCategoryTable)
				.set({
					name: input.name ?? existing.name,
					description:
						input.description !== undefined
							? input.description
							: existing.description,
					type: input.type ?? existing.type,
					isActive: input.isActive ?? existing.isActive,
				})
				.where(eq(expenseCategoryTable.id, input.id))
				.returning();

			return updated;
		}),

	deleteCategory: protectedOrganizationProcedure
		.input(deleteExpenseCategorySchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.expenseCategoryTable.findFirst({
				where: and(
					eq(expenseCategoryTable.id, input.id),
					eq(expenseCategoryTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			// Soft delete by marking inactive (expenses reference this)
			await db
				.update(expenseCategoryTable)
				.set({ isActive: false })
				.where(eq(expenseCategoryTable.id, input.id));

			return { success: true };
		}),

	// ============================================================================
	// EXPENSES
	// ============================================================================

	list: protectedOrganizationProcedure
		.input(listExpensesSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [eq(expenseTable.organizationId, ctx.organization.id)];

			// Search query
			if (input.query) {
				conditions.push(
					or(
						ilike(expenseTable.description, `%${input.query}%`),
						ilike(expenseTable.vendor, `%${input.query}%`),
						ilike(expenseTable.receiptNumber, `%${input.query}%`),
					)!,
				);
			}

			// Category filter
			if (input.filters?.categoryId) {
				conditions.push(eq(expenseTable.categoryId, input.filters.categoryId));
			}

			// Payment method filter
			if (
				input.filters?.paymentMethod &&
				input.filters.paymentMethod.length > 0
			) {
				conditions.push(
					inArray(expenseTable.paymentMethod, input.filters.paymentMethod),
				);
			}

			// Date range filter
			if (input.filters?.dateRange) {
				conditions.push(
					and(
						gte(expenseTable.expenseDate, input.filters.dateRange.from),
						lte(expenseTable.expenseDate, input.filters.dateRange.to),
					)!,
				);
			}

			// Amount range filter
			if (input.filters?.amountRange) {
				if (input.filters.amountRange.min !== undefined) {
					conditions.push(
						gte(expenseTable.amount, input.filters.amountRange.min),
					);
				}
				if (input.filters.amountRange.max !== undefined) {
					conditions.push(
						lte(expenseTable.amount, input.filters.amountRange.max),
					);
				}
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "amount":
					orderByColumn = sortDirection(expenseTable.amount);
					break;
				case "expenseDate":
					orderByColumn = sortDirection(expenseTable.expenseDate);
					break;
				default:
					orderByColumn = sortDirection(expenseTable.createdAt);
					break;
			}

			const [expenses, countResult] = await Promise.all([
				db.query.expenseTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						category: { columns: { id: true, name: true, type: true } },
						recordedByUser: { columns: { id: true, name: true } },
					},
				}),
				db.select({ count: count() }).from(expenseTable).where(whereCondition),
			]);

			return { expenses, total: countResult[0]?.count ?? 0 };
		}),

	get: protectedOrganizationProcedure
		.input(getExpenseSchema)
		.query(async ({ ctx, input }) => {
			const expense = await db.query.expenseTable.findFirst({
				where: and(
					eq(expenseTable.id, input.id),
					eq(expenseTable.organizationId, ctx.organization.id),
				),
				with: {
					category: true,
					recordedByUser: { columns: { id: true, name: true } },
				},
			});

			if (!expense) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense not found",
				});
			}

			return expense;
		}),

	create: protectedOrganizationProcedure
		.input(createExpenseSchema)
		.mutation(async ({ ctx, input }) => {
			// Validate category belongs to org if provided
			if (input.categoryId) {
				const category = await db.query.expenseCategoryTable.findFirst({
					where: and(
						eq(expenseCategoryTable.id, input.categoryId),
						eq(expenseCategoryTable.organizationId, ctx.organization.id),
					),
				});

				if (!category) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Category not found",
					});
				}
			}

			const [expense] = await db
				.insert(expenseTable)
				.values({
					organizationId: ctx.organization.id,
					categoryId: input.categoryId,
					amount: input.amount,
					currency: input.currency,
					description: input.description,
					expenseDate: input.expenseDate,
					paymentMethod: input.paymentMethod,
					receiptNumber: input.receiptNumber,
					vendor: input.vendor,
					notes: input.notes,
					recordedBy: ctx.user.id,
				})
				.returning();

			// Create cash movement if payment is in cash
			if (expense) {
				await createCashMovementIfCash({
					organizationId: ctx.organization.id,
					paymentMethod: input.paymentMethod,
					amount: input.amount,
					description: `Gasto: ${input.description}`,
					referenceType: CashMovementReferenceType.expense,
					referenceId: expense.id,
					recordedBy: ctx.user.id,
					type: CashMovementType.expense,
				});
			}

			return expense;
		}),

	update: protectedOrganizationProcedure
		.input(updateExpenseSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.expenseTable.findFirst({
				where: and(
					eq(expenseTable.id, input.id),
					eq(expenseTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense not found",
				});
			}

			// Validate category if changing
			if (input.categoryId) {
				const category = await db.query.expenseCategoryTable.findFirst({
					where: and(
						eq(expenseCategoryTable.id, input.categoryId),
						eq(expenseCategoryTable.organizationId, ctx.organization.id),
					),
				});

				if (!category) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Category not found",
					});
				}
			}

			const [updated] = await db
				.update(expenseTable)
				.set({
					categoryId:
						input.categoryId !== undefined
							? input.categoryId
							: existing.categoryId,
					amount: input.amount ?? existing.amount,
					description: input.description ?? existing.description,
					expenseDate: input.expenseDate ?? existing.expenseDate,
					paymentMethod: input.paymentMethod ?? existing.paymentMethod,
					receiptNumber:
						input.receiptNumber !== undefined
							? input.receiptNumber
							: existing.receiptNumber,
					vendor: input.vendor !== undefined ? input.vendor : existing.vendor,
					notes: input.notes !== undefined ? input.notes : existing.notes,
				})
				.where(eq(expenseTable.id, input.id))
				.returning();

			return updated;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteExpenseSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.expenseTable.findFirst({
				where: and(
					eq(expenseTable.id, input.id),
					eq(expenseTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense not found",
				});
			}

			await db.delete(expenseTable).where(eq(expenseTable.id, input.id));

			return { success: true };
		}),

	bulkDelete: protectedOrganizationProcedure
		.input(bulkDeleteExpensesSchema)
		.mutation(async ({ ctx, input }) => {
			await db
				.delete(expenseTable)
				.where(
					and(
						eq(expenseTable.organizationId, ctx.organization.id),
						inArray(expenseTable.id, input.ids),
					),
				);

			return { success: true, deletedCount: input.ids.length };
		}),

	exportCsv: protectedOrganizationProcedure
		.input(exportExpensesSchema)
		.mutation(async ({ ctx, input }) => {
			const expenses = await db.query.expenseTable.findMany({
				where: and(
					eq(expenseTable.organizationId, ctx.organization.id),
					inArray(expenseTable.id, input.expenseIds),
				),
				with: {
					category: { columns: { name: true } },
				},
				orderBy: desc(expenseTable.expenseDate),
			});

			// Build CSV
			const headers = [
				"Date",
				"Description",
				"Category",
				"Amount",
				"Payment Method",
				"Vendor",
				"Receipt Number",
				"Notes",
			];

			const rows = expenses.map((e) => [
				e.expenseDate.toISOString().split("T")[0],
				e.description,
				e.category?.name ?? "",
				(e.amount / 100).toFixed(2),
				e.paymentMethod ?? "",
				e.vendor ?? "",
				e.receiptNumber ?? "",
				e.notes ?? "",
			]);

			const csv = [
				headers.join(","),
				...rows.map((row) =>
					row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
				),
			].join("\n");

			return csv;
		}),
});
