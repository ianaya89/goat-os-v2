import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	ProductStatus,
	SaleStatus,
	StockTransactionType,
	type TrainingPaymentMethod,
} from "@/lib/db/schema/enums";
import {
	athleteTable,
	productTable,
	saleItemTable,
	saleTable,
	stockTransactionTable,
} from "@/lib/db/schema/tables";
import {
	cancelSaleSchema,
	completeSaleSchema,
	createProductSchema,
	createSaleSchema,
	createStockAdjustmentSchema,
	deleteProductSchema,
	getProductSchema,
	getSaleSchema,
	listProductsSchema,
	listSalesSchema,
	listStockTransactionsSchema,
	updateProductSchema,
} from "@/schemas/organization-stock-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationStockRouter = createTRPCRouter({
	// ============================================================================
	// PRODUCT PROCEDURES
	// ============================================================================

	// List all products with filtering
	listProducts: protectedOrganizationProcedure
		.input(listProductsSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(productTable.organizationId, ctx.organization.id),
				eq(productTable.isActive, true),
			];

			if (input.category) {
				conditions.push(eq(productTable.category, input.category));
			}

			if (input.status) {
				conditions.push(eq(productTable.status, input.status));
			}

			if (input.search) {
				conditions.push(
					or(
						ilike(productTable.name, `%${input.search}%`),
						ilike(productTable.sku, `%${input.search}%`),
						ilike(productTable.barcode, `%${input.search}%`),
					) ?? eq(productTable.id, productTable.id),
				);
			}

			if (input.lowStock) {
				// Products where currentStock <= lowStockThreshold
				conditions.push(
					and(
						eq(productTable.trackStock, true),
						lte(productTable.currentStock, productTable.lowStockThreshold),
					) ?? eq(productTable.id, productTable.id),
				);
			}

			const products = await db.query.productTable.findMany({
				where: and(...conditions),
				orderBy: desc(productTable.createdAt),
				with: {
					createdByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			return products;
		}),

	// Get single product
	getProduct: protectedOrganizationProcedure
		.input(getProductSchema)
		.query(async ({ ctx, input }) => {
			const product = await db.query.productTable.findFirst({
				where: and(
					eq(productTable.id, input.id),
					eq(productTable.organizationId, ctx.organization.id),
				),
				with: {
					createdByUser: {
						columns: { id: true, name: true },
					},
					stockTransactions: {
						limit: 10,
						orderBy: desc(stockTransactionTable.createdAt),
					},
				},
			});

			if (!product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Producto no encontrado",
				});
			}

			return product;
		}),

	// Create new product
	createProduct: protectedOrganizationProcedure
		.input(createProductSchema)
		.mutation(async ({ ctx, input }) => {
			const [product] = await db
				.insert(productTable)
				.values({
					organizationId: ctx.organization.id,
					...input,
					createdBy: ctx.user.id,
				})
				.returning();

			if (!product) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Error al crear el producto",
				});
			}

			return product;
		}),

	// Update product
	updateProduct: protectedOrganizationProcedure
		.input(updateProductSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updated] = await db
				.update(productTable)
				.set(data)
				.where(
					and(
						eq(productTable.id, id),
						eq(productTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Producto no encontrado",
				});
			}

			return updated;
		}),

	// Delete product (soft delete)
	deleteProduct: protectedOrganizationProcedure
		.input(deleteProductSchema)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await db
				.update(productTable)
				.set({ isActive: false, status: ProductStatus.discontinued })
				.where(
					and(
						eq(productTable.id, input.id),
						eq(productTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Producto no encontrado",
				});
			}

			return { success: true };
		}),

	// ============================================================================
	// STOCK TRANSACTION PROCEDURES
	// ============================================================================

	// List stock transactions
	listStockTransactions: protectedOrganizationProcedure
		.input(listStockTransactionsSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(stockTransactionTable.organizationId, ctx.organization.id),
			];

			if (input.productId) {
				conditions.push(eq(stockTransactionTable.productId, input.productId));
			}

			if (input.type) {
				conditions.push(eq(stockTransactionTable.type, input.type));
			}

			if (input.startDate) {
				conditions.push(gte(stockTransactionTable.createdAt, input.startDate));
			}

			if (input.endDate) {
				conditions.push(lte(stockTransactionTable.createdAt, input.endDate));
			}

			const transactions = await db.query.stockTransactionTable.findMany({
				where: and(...conditions),
				limit: input.limit,
				orderBy: desc(stockTransactionTable.createdAt),
				with: {
					product: {
						columns: { id: true, name: true, sku: true },
					},
					recordedByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			return transactions;
		}),

	// Create stock adjustment
	createStockAdjustment: protectedOrganizationProcedure
		.input(createStockAdjustmentSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify product belongs to organization
			const product = await db.query.productTable.findFirst({
				where: and(
					eq(productTable.id, input.productId),
					eq(productTable.organizationId, ctx.organization.id),
				),
			});

			if (!product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Producto no encontrado",
				});
			}

			// Calculate new stock
			const previousStock = product.currentStock;
			const newStock = previousStock + input.quantity;

			if (newStock < 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "El stock no puede ser negativo",
				});
			}

			// Create transaction and update product stock
			const [transaction] = await db
				.insert(stockTransactionTable)
				.values({
					organizationId: ctx.organization.id,
					productId: input.productId,
					type: input.type,
					quantity: input.quantity,
					previousStock,
					newStock,
					reason: input.reason,
					notes: input.notes,
					recordedBy: ctx.user.id,
				})
				.returning();

			await db
				.update(productTable)
				.set({ currentStock: newStock })
				.where(eq(productTable.id, input.productId));

			return transaction;
		}),

	// ============================================================================
	// SALE PROCEDURES
	// ============================================================================

	// List sales
	listSales: protectedOrganizationProcedure
		.input(listSalesSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(saleTable.organizationId, ctx.organization.id),
			];

			if (input.athleteId) {
				conditions.push(eq(saleTable.athleteId, input.athleteId));
			}

			if (input.paymentStatus) {
				conditions.push(eq(saleTable.paymentStatus, input.paymentStatus));
			}

			if (input.startDate) {
				conditions.push(gte(saleTable.createdAt, input.startDate));
			}

			if (input.endDate) {
				conditions.push(lte(saleTable.createdAt, input.endDate));
			}

			const sales = await db.query.saleTable.findMany({
				where: and(...conditions),
				limit: input.limit,
				orderBy: desc(saleTable.createdAt),
				with: {
					athlete: {
						with: {
							user: {
								columns: { id: true, name: true, email: true },
							},
						},
					},
					soldByUser: {
						columns: { id: true, name: true },
					},
					items: {
						with: {
							product: {
								columns: { id: true, name: true },
							},
						},
					},
				},
			});

			return sales;
		}),

	// Get single sale
	getSale: protectedOrganizationProcedure
		.input(getSaleSchema)
		.query(async ({ ctx, input }) => {
			const sale = await db.query.saleTable.findFirst({
				where: and(
					eq(saleTable.id, input.id),
					eq(saleTable.organizationId, ctx.organization.id),
				),
				with: {
					athlete: {
						with: {
							user: {
								columns: { id: true, name: true, email: true },
							},
						},
					},
					soldByUser: {
						columns: { id: true, name: true },
					},
					cashMovement: true,
					items: {
						with: {
							product: true,
						},
					},
				},
			});

			if (!sale) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Venta no encontrada",
				});
			}

			return sale;
		}),

	// Create sale
	createSale: protectedOrganizationProcedure
		.input(createSaleSchema)
		.mutation(async ({ ctx, input }) => {
			// Validate athlete if provided
			if (input.athleteId) {
				const athlete = await db.query.athleteTable.findFirst({
					where: and(
						eq(athleteTable.id, input.athleteId),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
				});

				if (!athlete) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Atleta no encontrado",
					});
				}
			}

			// Get products and calculate totals
			const productIds = input.items.map((item) => item.productId);
			const products = await db.query.productTable.findMany({
				where: and(
					eq(productTable.organizationId, ctx.organization.id),
					or(...productIds.map((id) => eq(productTable.id, id))),
				),
			});

			const productMap = new Map(products.map((p) => [p.id, p]));

			let subtotal = 0;
			const saleItems: {
				productId: string;
				productName: string;
				quantity: number;
				unitPrice: number;
				discountAmount: number;
				totalPrice: number;
			}[] = [];

			for (const item of input.items) {
				const product = productMap.get(item.productId);
				if (!product) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Producto no encontrado: ${item.productId}`,
					});
				}

				// Check stock if tracking is enabled
				if (product.trackStock && product.currentStock < item.quantity) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Stock insuficiente para: ${product.name}`,
					});
				}

				const unitPrice = item.unitPrice ?? product.sellingPrice;
				const discountAmount = item.discountAmount ?? 0;
				const totalPrice = unitPrice * item.quantity - discountAmount;

				saleItems.push({
					productId: item.productId,
					productName: product.name,
					quantity: item.quantity,
					unitPrice,
					discountAmount,
					totalPrice,
				});

				subtotal += totalPrice;
			}

			const discountAmount = input.discountAmount ?? 0;
			const totalAmount = subtotal - discountAmount;

			// Create sale
			const [sale] = await db
				.insert(saleTable)
				.values({
					organizationId: ctx.organization.id,
					athleteId: input.athleteId,
					customerName: input.customerName,
					subtotal,
					discountAmount,
					totalAmount,
					paymentStatus: SaleStatus.pending,
					paymentMethod: input.paymentMethod as
						| TrainingPaymentMethod
						| undefined,
					notes: input.notes,
					soldBy: ctx.user.id,
				})
				.returning();

			if (!sale) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Error al crear la venta",
				});
			}

			// Create sale items
			await db.insert(saleItemTable).values(
				saleItems.map((item) => ({
					saleId: sale.id,
					...item,
				})),
			);

			// Update stock for each product
			for (const item of saleItems) {
				const product = productMap.get(item.productId);
				if (product?.trackStock) {
					await db
						.update(productTable)
						.set({
							currentStock: product.currentStock - item.quantity,
						})
						.where(eq(productTable.id, item.productId));

					// Create stock transaction
					await db.insert(stockTransactionTable).values({
						organizationId: ctx.organization.id,
						productId: item.productId,
						type: StockTransactionType.sale,
						quantity: -item.quantity,
						previousStock: product.currentStock,
						newStock: product.currentStock - item.quantity,
						referenceType: "sale",
						referenceId: sale.id,
						recordedBy: ctx.user.id,
					});
				}
			}

			return sale;
		}),

	// Complete sale (mark as paid)
	completeSale: protectedOrganizationProcedure
		.input(completeSaleSchema)
		.mutation(async ({ ctx, input }) => {
			const sale = await db.query.saleTable.findFirst({
				where: and(
					eq(saleTable.id, input.id),
					eq(saleTable.organizationId, ctx.organization.id),
				),
			});

			if (!sale) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Venta no encontrada",
				});
			}

			if (sale.paymentStatus !== SaleStatus.pending) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "La venta ya fue procesada",
				});
			}

			const [updated] = await db
				.update(saleTable)
				.set({
					paymentStatus: SaleStatus.completed,
					paymentMethod: input.paymentMethod as TrainingPaymentMethod,
					paidAt: new Date(),
				})
				.where(eq(saleTable.id, input.id))
				.returning();

			return updated;
		}),

	// Cancel sale
	cancelSale: protectedOrganizationProcedure
		.input(cancelSaleSchema)
		.mutation(async ({ ctx, input }) => {
			const sale = await db.query.saleTable.findFirst({
				where: and(
					eq(saleTable.id, input.id),
					eq(saleTable.organizationId, ctx.organization.id),
				),
				with: {
					items: true,
				},
			});

			if (!sale) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Venta no encontrada",
				});
			}

			if (sale.paymentStatus === SaleStatus.cancelled) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "La venta ya fue cancelada",
				});
			}

			// Restore stock for each item
			for (const item of sale.items) {
				const product = await db.query.productTable.findFirst({
					where: eq(productTable.id, item.productId),
				});

				if (product?.trackStock) {
					await db
						.update(productTable)
						.set({
							currentStock: product.currentStock + item.quantity,
						})
						.where(eq(productTable.id, item.productId));

					// Create return stock transaction
					await db.insert(stockTransactionTable).values({
						organizationId: ctx.organization.id,
						productId: item.productId,
						type: StockTransactionType.return,
						quantity: item.quantity,
						previousStock: product.currentStock,
						newStock: product.currentStock + item.quantity,
						referenceType: "sale",
						referenceId: sale.id,
						reason: input.reason ?? "Venta cancelada",
						recordedBy: ctx.user.id,
					});
				}
			}

			const [updated] = await db
				.update(saleTable)
				.set({
					paymentStatus: SaleStatus.cancelled,
				})
				.where(eq(saleTable.id, input.id))
				.returning();

			return updated;
		}),
});
