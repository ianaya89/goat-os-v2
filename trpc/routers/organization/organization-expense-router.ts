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
	sql,
	sum,
} from "drizzle-orm";
import { createCashMovementIfCash } from "@/lib/cash-register-helpers";
import { db } from "@/lib/db";
import {
	CashMovementReferenceType,
	CashMovementType,
} from "@/lib/db/schema/enums";
import {
	expenseCategoryTable,
	expenseTable,
	sportsEventTable,
} from "@/lib/db/schema/tables";
import { env } from "@/lib/env";
import {
	deleteObject,
	generateStorageKey,
	getSignedUploadUrl,
	getSignedUrl,
} from "@/lib/storage";
import {
	bulkDeleteExpensesSchema,
	createExpenseCategorySchema,
	createExpenseSchema,
	deleteExpenseCategorySchema,
	deleteExpenseReceiptSchema,
	deleteExpenseSchema,
	exportExpensesSchema,
	getExpenseReceiptDownloadUrlSchema,
	getExpenseReceiptUploadUrlSchema,
	getExpenseSchema,
	listExpenseCategoriesSchema,
	listExpensesSchema,
	updateExpenseCategorySchema,
	updateExpenseReceiptSchema,
	updateExpenseSchema,
} from "@/schemas/organization-expense-schemas";
import { createTRPCRouter, protectedOrgAdminProcedure } from "@/trpc/init";

export const organizationExpenseRouter = createTRPCRouter({
	// ============================================================================
	// EXPENSE CATEGORIES
	// ============================================================================

	listCategories: protectedOrgAdminProcedure
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

	createCategory: protectedOrgAdminProcedure
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

	updateCategory: protectedOrgAdminProcedure
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

	deleteCategory: protectedOrgAdminProcedure
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

	list: protectedOrgAdminProcedure
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

			// Category filter (fixed enum)
			if (input.filters?.category && input.filters.category.length > 0) {
				conditions.push(inArray(expenseTable.category, input.filters.category));
			}

			// Category filter (legacy FK)
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

			// Event filter
			if (input.filters?.eventId) {
				conditions.push(eq(expenseTable.eventId, input.filters.eventId));
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
						categoryRef: { columns: { id: true, name: true, type: true } },
						recordedByUser: { columns: { id: true, name: true } },
						event: { columns: { id: true, title: true } },
					},
				}),
				db.select({ count: count() }).from(expenseTable).where(whereCondition),
			]);

			return { expenses, total: countResult[0]?.count ?? 0 };
		}),

	get: protectedOrgAdminProcedure
		.input(getExpenseSchema)
		.query(async ({ ctx, input }) => {
			const expense = await db.query.expenseTable.findFirst({
				where: and(
					eq(expenseTable.id, input.id),
					eq(expenseTable.organizationId, ctx.organization.id),
				),
				with: {
					categoryRef: true,
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

	create: protectedOrgAdminProcedure
		.input(createExpenseSchema)
		.mutation(async ({ ctx, input }) => {
			// Validate event belongs to org if provided
			if (input.eventId) {
				const event = await db.query.sportsEventTable.findFirst({
					where: and(
						eq(sportsEventTable.id, input.eventId),
						eq(sportsEventTable.organizationId, ctx.organization.id),
					),
				});

				if (!event) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Event not found",
					});
				}
			}

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
					category: input.category,
					amount: input.amount,
					currency: input.currency,
					description: input.description,
					expenseDate: input.expenseDate,
					paymentMethod: input.paymentMethod,
					receiptNumber: input.receiptNumber,
					vendor: input.vendor,
					notes: input.notes,
					eventId: input.eventId,
					recordedBy: ctx.user.id,
				})
				.returning();

			// Create cash movement if payment is in cash
			if (expense) {
				await createCashMovementIfCash({
					organizationId: ctx.organization.id,
					paymentMethod: input.paymentMethod,
					amount: input.amount,
					description: input.description,
					referenceType: CashMovementReferenceType.expense,
					referenceId: expense.id,
					recordedBy: ctx.user.id,
					type: CashMovementType.expense,
				});
			}

			return expense;
		}),

	update: protectedOrgAdminProcedure
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
					category:
						input.category !== undefined ? input.category : existing.category,
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
					eventId:
						input.eventId !== undefined ? input.eventId : existing.eventId,
				})
				.where(eq(expenseTable.id, input.id))
				.returning();

			return updated;
		}),

	delete: protectedOrgAdminProcedure
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

	bulkDelete: protectedOrgAdminProcedure
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

	exportCsv: protectedOrgAdminProcedure
		.input(exportExpensesSchema)
		.mutation(async ({ ctx, input }) => {
			const expenses = await db.query.expenseTable.findMany({
				where: and(
					eq(expenseTable.organizationId, ctx.organization.id),
					inArray(expenseTable.id, input.expenseIds),
				),
				with: {
					categoryRef: { columns: { name: true } },
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
				e.category ?? "",
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

	// ============================================================================
	// EXPENSE RECEIPTS
	// ============================================================================

	getReceiptUploadUrl: protectedOrgAdminProcedure
		.input(getExpenseReceiptUploadUrlSchema)
		.mutation(async ({ ctx, input }) => {
			const expense = await db.query.expenseTable.findFirst({
				where: and(
					eq(expenseTable.id, input.expenseId),
					eq(expenseTable.organizationId, ctx.organization.id),
				),
			});

			if (!expense) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense not found",
				});
			}

			const key = generateStorageKey(
				"expense-receipts",
				ctx.organization.id,
				input.filename,
			);

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			const uploadUrl = await getSignedUploadUrl(key, bucket, {
				contentType: input.contentType,
				expiresIn: 300,
			});

			return { uploadUrl, key };
		}),

	updateExpenseReceipt: protectedOrgAdminProcedure
		.input(updateExpenseReceiptSchema)
		.mutation(async ({ ctx, input }) => {
			const expense = await db.query.expenseTable.findFirst({
				where: and(
					eq(expenseTable.id, input.expenseId),
					eq(expenseTable.organizationId, ctx.organization.id),
				),
			});

			if (!expense) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense not found",
				});
			}

			if (expense.receiptImageKey) {
				const bucket = env.S3_BUCKET;
				if (bucket) {
					try {
						await deleteObject(expense.receiptImageKey, bucket);
					} catch {
						// Ignore deletion errors
					}
				}
			}

			const [updated] = await db
				.update(expenseTable)
				.set({ receiptImageKey: input.receiptImageKey })
				.where(eq(expenseTable.id, input.expenseId))
				.returning();

			return updated;
		}),

	deleteExpenseReceipt: protectedOrgAdminProcedure
		.input(deleteExpenseReceiptSchema)
		.mutation(async ({ ctx, input }) => {
			const expense = await db.query.expenseTable.findFirst({
				where: and(
					eq(expenseTable.id, input.expenseId),
					eq(expenseTable.organizationId, ctx.organization.id),
				),
			});

			if (!expense) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense not found",
				});
			}

			if (!expense.receiptImageKey) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Expense has no receipt image",
				});
			}

			const bucket = env.S3_BUCKET;
			if (bucket) {
				try {
					await deleteObject(expense.receiptImageKey, bucket);
				} catch {
					// Ignore deletion errors
				}
			}

			const [updated] = await db
				.update(expenseTable)
				.set({ receiptImageKey: null })
				.where(eq(expenseTable.id, input.expenseId))
				.returning();

			return updated;
		}),

	getReceiptDownloadUrl: protectedOrgAdminProcedure
		.input(getExpenseReceiptDownloadUrlSchema)
		.query(async ({ ctx, input }) => {
			const expense = await db.query.expenseTable.findFirst({
				where: and(
					eq(expenseTable.id, input.expenseId),
					eq(expenseTable.organizationId, ctx.organization.id),
				),
			});

			if (!expense) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Expense not found",
				});
			}

			if (!expense.receiptImageKey) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Expense has no receipt image",
				});
			}

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			const downloadUrl = await getSignedUrl(expense.receiptImageKey, bucket, {
				expiresIn: 3600,
			});

			return { downloadUrl };
		}),

	// Get expenses summary (today, week, month, top category, total)
	getExpensesSummary: protectedOrgAdminProcedure.query(async ({ ctx }) => {
		const now = new Date();

		const todayStart = new Date(now);
		todayStart.setHours(0, 0, 0, 0);

		const todayEnd = new Date(now);
		todayEnd.setHours(23, 59, 59, 999);

		// Monday-based week start
		const weekStart = new Date(now);
		const day = weekStart.getDay();
		const diff = day === 0 ? 6 : day - 1;
		weekStart.setDate(weekStart.getDate() - diff);
		weekStart.setHours(0, 0, 0, 0);

		const monthStart = new Date(now);
		monthStart.setDate(1);
		monthStart.setHours(0, 0, 0, 0);

		const orgFilter = eq(expenseTable.organizationId, ctx.organization.id);

		const [
			todayResult,
			weekResult,
			monthResult,
			totalResult,
			topCategoryResult,
		] = await Promise.all([
			// Spent today
			db
				.select({
					total: sum(expenseTable.amount),
					count: count(),
				})
				.from(expenseTable)
				.where(
					and(
						orgFilter,
						gte(expenseTable.expenseDate, todayStart),
						lte(expenseTable.expenseDate, todayEnd),
					),
				),

			// Spent this week (Mon-Sun)
			db
				.select({
					total: sum(expenseTable.amount),
					count: count(),
				})
				.from(expenseTable)
				.where(
					and(
						orgFilter,
						gte(expenseTable.expenseDate, weekStart),
						lte(expenseTable.expenseDate, todayEnd),
					),
				),

			// Spent this month
			db
				.select({
					total: sum(expenseTable.amount),
					count: count(),
				})
				.from(expenseTable)
				.where(
					and(
						orgFilter,
						gte(expenseTable.expenseDate, monthStart),
						lte(expenseTable.expenseDate, todayEnd),
					),
				),

			// Total spent (all time)
			db
				.select({
					total: sum(expenseTable.amount),
					count: count(),
				})
				.from(expenseTable)
				.where(orgFilter),

			// Top category this month
			db
				.select({
					category: expenseTable.category,
					total: sum(expenseTable.amount),
					count: count(),
				})
				.from(expenseTable)
				.where(
					and(
						orgFilter,
						gte(expenseTable.expenseDate, monthStart),
						lte(expenseTable.expenseDate, todayEnd),
						sql`${expenseTable.category} IS NOT NULL`,
					),
				)
				.groupBy(expenseTable.category)
				.orderBy(desc(sql`sum(${expenseTable.amount})`))
				.limit(1),
		]);

		return {
			today: {
				total: Number(todayResult[0]?.total ?? 0),
				count: Number(todayResult[0]?.count ?? 0),
			},
			week: {
				total: Number(weekResult[0]?.total ?? 0),
				count: Number(weekResult[0]?.count ?? 0),
			},
			month: {
				total: Number(monthResult[0]?.total ?? 0),
				count: Number(monthResult[0]?.count ?? 0),
			},
			total: {
				total: Number(totalResult[0]?.total ?? 0),
				count: Number(totalResult[0]?.count ?? 0),
			},
			topCategory: topCategoryResult[0]
				? {
						category: topCategoryResult[0].category,
						total: Number(topCategoryResult[0].total ?? 0),
						count: Number(topCategoryResult[0].count ?? 0),
					}
				: null,
		};
	}),
});
