import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { SaleStatus, StockTransactionType } from "@/lib/db/schema/enums";
import {
	athleteTable,
	productTable,
	saleItemTable,
	saleTable,
	stockTransactionTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import {
	ENTITY_SALE,
	ENTITY_SALE_ITEM,
	ENTITY_STOCK_TRANSACTION,
	seedUUID,
} from "./utils";

// Sample sales data - each sale has items
const SALES_DATA = [
	{
		customerName: "Juan Perez",
		items: [
			{ productSku: "BEB-GAT-500", quantity: 2 },
			{ productSku: "ALI-BAR-001", quantity: 1 },
		],
		paymentMethod: "cash",
		completed: true,
	},
	{
		customerName: "Maria Garcia",
		items: [
			{ productSku: "BEB-AGU-500", quantity: 3 },
			{ productSku: "ALI-BAN-001", quantity: 2 },
		],
		paymentMethod: "mercado_pago",
		completed: true,
	},
	{
		customerName: null, // Anonymous sale
		items: [{ productSku: "BEB-POW-600", quantity: 1 }],
		paymentMethod: "cash",
		completed: true,
	},
	{
		customerName: "Carlos Rodriguez",
		items: [
			{ productSku: "ROP-REM-M", quantity: 1 },
			{ productSku: "ROP-SHO-001", quantity: 1 },
			{ productSku: "ROP-MED-001", quantity: 2 },
		],
		paymentMethod: "card",
		completed: true,
	},
	{
		customerName: "Ana Martinez",
		items: [
			{ productSku: "MER-BOT-750", quantity: 2 },
			{ productSku: "BEB-GAT-500", quantity: 1 },
		],
		paymentMethod: "bank_transfer",
		completed: true,
	},
	{
		customerName: "Pedro Sanchez",
		items: [{ productSku: "SUP-PRO-1KG", quantity: 1 }],
		paymentMethod: null,
		completed: false, // Pending sale
	},
	{
		customerName: "Laura Lopez",
		items: [
			{ productSku: "BEB-AGU-500", quantity: 5 },
			{ productSku: "ALI-BAR-001", quantity: 3 },
		],
		paymentMethod: "cash",
		completed: true,
	},
	{
		customerName: null,
		items: [
			{ productSku: "BEB-GAT-500", quantity: 1 },
			{ productSku: "BEB-POW-600", quantity: 1 },
		],
		paymentMethod: "mercado_pago",
		completed: true,
	},
];

export async function seedSales(
	organizationId: string,
	userId: string,
): Promise<string[]> {
	logger.info("Seeding sales...");

	// Get products by SKU
	const products = await db.query.productTable.findMany({
		where: eq(productTable.organizationId, organizationId),
	});

	const productBySku = new Map(products.map((p) => [p.sku, p]));

	// Get some athletes for linking sales
	const athletes = await db.query.athleteTable.findMany({
		where: eq(athleteTable.organizationId, organizationId),
		limit: 5,
	});

	const saleIds: string[] = [];
	let stockTransactionIndex = 1;

	for (let i = 0; i < SALES_DATA.length; i++) {
		const saleData = SALES_DATA[i];
		if (!saleData) continue;

		const saleId = seedUUID(ENTITY_SALE, i + 1);

		// Check if sale already exists
		const existing = await db.query.saleTable.findFirst({
			where: eq(saleTable.id, saleId),
		});

		if (existing) {
			logger.info({ saleId }, "Sale already exists, skipping");
			saleIds.push(saleId);
			continue;
		}

		// Calculate totals
		let subtotal = 0;
		const saleItems: {
			productId: string;
			productName: string;
			quantity: number;
			unitPrice: number;
			totalPrice: number;
		}[] = [];

		for (const item of saleData.items) {
			const product = productBySku.get(item.productSku);
			if (!product) {
				logger.warn(
					{ sku: item.productSku },
					"Product not found, skipping item",
				);
				continue;
			}

			const totalPrice = product.sellingPrice * item.quantity;
			subtotal += totalPrice;

			saleItems.push({
				productId: product.id,
				productName: product.name,
				quantity: item.quantity,
				unitPrice: product.sellingPrice,
				totalPrice,
			});
		}

		if (saleItems.length === 0) {
			logger.warn({ saleId }, "No valid items for sale, skipping");
			continue;
		}

		// Optionally link to an athlete
		const athleteId = i < athletes.length ? athletes[i]?.id : null;

		// Create sale
		await db.insert(saleTable).values({
			id: saleId,
			organizationId,
			saleNumber: `VTA-${String(i + 1).padStart(4, "0")}`,
			athleteId,
			customerName: saleData.customerName,
			subtotal,
			taxAmount: 0,
			discountAmount: 0,
			totalAmount: subtotal,
			currency: "ARS",
			paymentMethod: saleData.paymentMethod as
				| "cash"
				| "bank_transfer"
				| "mercado_pago"
				| "card"
				| "other"
				| null,
			paymentStatus: saleData.completed
				? SaleStatus.completed
				: SaleStatus.pending,
			paidAt: saleData.completed ? new Date() : null,
			soldBy: userId,
		});

		// Create sale items
		for (let j = 0; j < saleItems.length; j++) {
			const item = saleItems[j];
			if (!item) continue;

			const saleItemId = seedUUID(ENTITY_SALE_ITEM, i * 10 + j + 1);

			await db.insert(saleItemTable).values({
				id: saleItemId,
				saleId,
				productId: item.productId,
				productName: item.productName,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				totalPrice: item.totalPrice,
				discountAmount: 0,
			});

			// Create stock transaction for each item (only for completed sales)
			if (saleData.completed) {
				const product = products.find((p) => p.id === item.productId);
				if (product?.trackStock) {
					const transactionId = seedUUID(
						ENTITY_STOCK_TRANSACTION,
						stockTransactionIndex++,
					);

					await db.insert(stockTransactionTable).values({
						id: transactionId,
						organizationId,
						productId: item.productId,
						type: StockTransactionType.sale,
						quantity: -item.quantity,
						previousStock: product.currentStock,
						newStock: product.currentStock - item.quantity,
						referenceType: "sale",
						referenceId: saleId,
						recordedBy: userId,
					});

					// Update product stock
					await db
						.update(productTable)
						.set({
							currentStock: product.currentStock - item.quantity,
						})
						.where(eq(productTable.id, item.productId));

					// Update local reference
					product.currentStock -= item.quantity;
				}
			}
		}

		saleIds.push(saleId);
		logger.info(
			{ saleId, items: saleItems.length, total: subtotal },
			"Created sale",
		);
	}

	logger.info(`Seeded ${saleIds.length} sales`);
	return saleIds;
}
