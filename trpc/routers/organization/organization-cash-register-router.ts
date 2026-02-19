import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	inArray,
	lte,
	sql,
	sum,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	CashMovementReferenceType,
	CashMovementType,
	CashRegisterStatus,
	StockTransactionType,
	TrainingPaymentStatus,
} from "@/lib/db/schema/enums";
import {
	cashMovementTable,
	cashRegisterTable,
	productTable,
	stockTransactionTable,
	trainingPaymentTable,
} from "@/lib/db/schema/tables";
import {
	addManualMovementSchema,
	closeCashRegisterSchema,
	getCashMovementsSchema,
	getCashRegisterByIdSchema,
	getCashRegisterHistorySchema,
	getDailySummarySchema,
	openCashRegisterSchema,
} from "@/schemas/organization-cash-register-schemas";
import { createTRPCRouter, protectedOrgStaffProcedure } from "@/trpc/init";

// Helper to get start of day in org timezone
function getStartOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function getEndOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d;
}

export const organizationCashRegisterRouter = createTRPCRouter({
	// Get current (today's) cash register
	getCurrent: protectedOrgStaffProcedure.query(async ({ ctx }) => {
		const today = getStartOfDay(new Date());

		const cashRegister = await db.query.cashRegisterTable.findFirst({
			where: and(
				eq(cashRegisterTable.organizationId, ctx.organization.id),
				eq(cashRegisterTable.date, today),
			),
			with: {
				openedByUser: { columns: { id: true, name: true } },
				closedByUser: { columns: { id: true, name: true } },
			},
		});

		return cashRegister ?? null;
	}),

	// Get cash register by ID
	getById: protectedOrgStaffProcedure
		.input(getCashRegisterByIdSchema)
		.query(async ({ ctx, input }) => {
			const cashRegister = await db.query.cashRegisterTable.findFirst({
				where: and(
					eq(cashRegisterTable.id, input.id),
					eq(cashRegisterTable.organizationId, ctx.organization.id),
				),
				with: {
					openedByUser: { columns: { id: true, name: true } },
					closedByUser: { columns: { id: true, name: true } },
				},
			});

			if (!cashRegister) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Cash register not found",
				});
			}

			return cashRegister;
		}),

	// Open cash register for today
	open: protectedOrgStaffProcedure
		.input(openCashRegisterSchema)
		.mutation(async ({ ctx, input }) => {
			const today = getStartOfDay(new Date());

			// Check if already exists
			const existing = await db.query.cashRegisterTable.findFirst({
				where: and(
					eq(cashRegisterTable.organizationId, ctx.organization.id),
					eq(cashRegisterTable.date, today),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Cash register for today already exists",
				});
			}

			const [cashRegister] = await db
				.insert(cashRegisterTable)
				.values({
					organizationId: ctx.organization.id,
					date: today,
					openingBalance: input.openingBalance,
					status: CashRegisterStatus.open,
					openedBy: ctx.user.id,
					notes: input.notes,
				})
				.returning();

			return cashRegister;
		}),

	// Close cash register
	close: protectedOrgStaffProcedure
		.input(closeCashRegisterSchema)
		.mutation(async ({ ctx, input }) => {
			const cashRegister = await db.query.cashRegisterTable.findFirst({
				where: and(
					eq(cashRegisterTable.id, input.id),
					eq(cashRegisterTable.organizationId, ctx.organization.id),
				),
			});

			if (!cashRegister) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Cash register not found",
				});
			}

			if (cashRegister.status === CashRegisterStatus.closed) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cash register is already closed",
				});
			}

			const [updated] = await db
				.update(cashRegisterTable)
				.set({
					status: CashRegisterStatus.closed,
					closingBalance: input.closingBalance,
					closedBy: ctx.user.id,
					closedAt: new Date(),
					notes: input.notes ?? cashRegister.notes,
				})
				.where(eq(cashRegisterTable.id, input.id))
				.returning();

			return updated;
		}),

	// Get cash register history
	getHistory: protectedOrgStaffProcedure
		.input(getCashRegisterHistorySchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(cashRegisterTable.organizationId, ctx.organization.id),
			];

			if (input.status && input.status.length > 0) {
				conditions.push(inArray(cashRegisterTable.status, input.status));
			}

			if (input.dateRange) {
				conditions.push(
					and(
						gte(cashRegisterTable.date, input.dateRange.from),
						lte(cashRegisterTable.date, input.dateRange.to),
					)!,
				);
			}

			const whereCondition = and(...conditions);

			const [registers, countResult] = await Promise.all([
				db.query.cashRegisterTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: desc(cashRegisterTable.date),
					with: {
						openedByUser: { columns: { id: true, name: true } },
						closedByUser: { columns: { id: true, name: true } },
					},
				}),
				db
					.select({ count: count() })
					.from(cashRegisterTable)
					.where(whereCondition),
			]);

			return { registers, total: countResult[0]?.count ?? 0 };
		}),

	// Get movements for a cash register
	getMovements: protectedOrgStaffProcedure
		.input(getCashMovementsSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(cashMovementTable.cashRegisterId, input.cashRegisterId),
				eq(cashMovementTable.organizationId, ctx.organization.id),
			];

			if (input.type && input.type.length > 0) {
				conditions.push(inArray(cashMovementTable.type, input.type));
			}

			if (input.referenceType && input.referenceType.length > 0) {
				conditions.push(
					inArray(cashMovementTable.referenceType, input.referenceType),
				);
			}

			const whereCondition = and(...conditions);

			const [movements, countResult] = await Promise.all([
				db.query.cashMovementTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: desc(cashMovementTable.createdAt),
					with: {
						recordedByUser: { columns: { id: true, name: true } },
					},
				}),
				db
					.select({ count: count() })
					.from(cashMovementTable)
					.where(whereCondition),
			]);

			return { movements, total: countResult[0]?.count ?? 0 };
		}),

	// Add manual movement
	addManualMovement: protectedOrgStaffProcedure
		.input(addManualMovementSchema)
		.mutation(async ({ ctx, input }) => {
			const today = getStartOfDay(new Date());

			// Get or create today's cash register
			const cashRegister = await db.query.cashRegisterTable.findFirst({
				where: and(
					eq(cashRegisterTable.organizationId, ctx.organization.id),
					eq(cashRegisterTable.date, today),
				),
			});

			if (!cashRegister) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message:
						"No cash register open for today. Please open the cash register first.",
				});
			}

			if (cashRegister.status === CashRegisterStatus.closed) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cash register is closed. Cannot add movements.",
				});
			}

			// If products are included, validate stock availability
			let productsMap: Map<string, typeof productTable.$inferSelect> | null =
				null;

			if (input.products && input.products.length > 0) {
				const productIds = input.products.map((p) => p.productId);

				const products = await db.query.productTable.findMany({
					where: and(
						eq(productTable.organizationId, ctx.organization.id),
						inArray(productTable.id, productIds),
						eq(productTable.isActive, true),
					),
				});

				productsMap = new Map(products.map((p) => [p.id, p]));

				// Validate all products exist and have sufficient stock
				for (const item of input.products) {
					const product = productsMap.get(item.productId);

					if (!product) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: `Producto no encontrado: ${item.productId}`,
						});
					}

					if (product.trackStock && product.currentStock < item.quantity) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: `Stock insuficiente para "${product.name}". Disponible: ${product.currentStock}, Solicitado: ${item.quantity}`,
						});
					}
				}
			}

			// Create the cash movement
			const [movement] = await db
				.insert(cashMovementTable)
				.values({
					cashRegisterId: cashRegister.id,
					organizationId: ctx.organization.id,
					type: input.type,
					amount: input.amount,
					description: input.description,
					referenceType:
						input.products && input.products.length > 0
							? CashMovementReferenceType.productSale
							: CashMovementReferenceType.manual,
					recordedBy: ctx.user.id,
				})
				.returning();

			if (!movement) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Error al crear el movimiento de caja",
				});
			}

			// If products were included, decrement stock and create transaction records
			if (input.products && input.products.length > 0 && productsMap) {
				for (const item of input.products) {
					const product = productsMap.get(item.productId);

					if (product?.trackStock) {
						const newStock = product.currentStock - item.quantity;

						// Update product stock
						await db
							.update(productTable)
							.set({ currentStock: newStock })
							.where(eq(productTable.id, item.productId));

						// Create stock transaction record for audit
						await db.insert(stockTransactionTable).values({
							organizationId: ctx.organization.id,
							productId: item.productId,
							type: StockTransactionType.sale,
							quantity: -item.quantity,
							previousStock: product.currentStock,
							newStock: newStock,
							referenceType: "cash_movement",
							referenceId: movement.id,
							recordedBy: ctx.user.id,
						});
					}
				}
			}

			return movement;
		}),

	// Get daily summary
	getDailySummary: protectedOrgStaffProcedure
		.input(getDailySummarySchema)
		.query(async ({ ctx, input }) => {
			const targetDate = input.date
				? getStartOfDay(input.date)
				: getStartOfDay(new Date());
			const dayEnd = getEndOfDay(targetDate);

			// Get cash register for the day
			const cashRegister = await db.query.cashRegisterTable.findFirst({
				where: and(
					eq(cashRegisterTable.organizationId, ctx.organization.id),
					eq(cashRegisterTable.date, targetDate),
				),
			});

			// Get movements for the day
			const movementStats = cashRegister
				? await db
						.select({
							type: cashMovementTable.type,
							total: sum(cashMovementTable.amount),
							count: count(),
						})
						.from(cashMovementTable)
						.where(eq(cashMovementTable.cashRegisterId, cashRegister.id))
						.groupBy(cashMovementTable.type)
				: [];

			// Get payments received today (cash payments)
			const paymentsToday = await db
				.select({
					total: sum(trainingPaymentTable.paidAmount),
					count: count(),
				})
				.from(trainingPaymentTable)
				.where(
					and(
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.paid),
						gte(trainingPaymentTable.paymentDate, targetDate),
						lte(trainingPaymentTable.paymentDate, dayEnd),
					),
				);

			const incomeMovements = movementStats.find(
				(m) => m.type === CashMovementType.income,
			);
			const expenseMovements = movementStats.find(
				(m) => m.type === CashMovementType.expense,
			);
			const adjustmentMovements = movementStats.find(
				(m) => m.type === CashMovementType.adjustment,
			);

			return {
				date: targetDate,
				cashRegister: cashRegister
					? {
							id: cashRegister.id,
							status: cashRegister.status,
							openingBalance: cashRegister.openingBalance,
							closingBalance: cashRegister.closingBalance,
						}
					: null,
				movements: {
					income: {
						total: Number(incomeMovements?.total ?? 0),
						count: Number(incomeMovements?.count ?? 0),
					},
					expense: {
						total: Number(expenseMovements?.total ?? 0),
						count: Number(expenseMovements?.count ?? 0),
					},
					adjustment: {
						total: Number(adjustmentMovements?.total ?? 0),
						count: Number(adjustmentMovements?.count ?? 0),
					},
				},
				paymentsReceived: {
					total: Number(paymentsToday[0]?.total ?? 0),
					count: Number(paymentsToday[0]?.count ?? 0),
				},
				netCashFlow:
					Number(incomeMovements?.total ?? 0) -
					Number(expenseMovements?.total ?? 0) +
					Number(adjustmentMovements?.total ?? 0),
			};
		}),
});
