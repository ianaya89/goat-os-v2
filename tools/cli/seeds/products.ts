import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ProductCategory, ProductStatus } from "@/lib/db/schema/enums";
import { productTable } from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import { ENTITY_PRODUCT, seedUUID } from "./utils";

const PRODUCTS_DATA = [
	{
		name: "Gatorade 500ml",
		description: "Bebida isotonica sabor naranja",
		category: ProductCategory.beverage,
		costPrice: 80000, // $800
		sellingPrice: 150000, // $1500
		currentStock: 50,
		lowStockThreshold: 10,
		sku: "BEB-GAT-500",
	},
	{
		name: "Powerade 600ml",
		description: "Bebida deportiva sabor frutas",
		category: ProductCategory.beverage,
		costPrice: 90000, // $900
		sellingPrice: 160000, // $1600
		currentStock: 40,
		lowStockThreshold: 10,
		sku: "BEB-POW-600",
	},
	{
		name: "Agua Mineral 500ml",
		description: "Agua mineral sin gas",
		category: ProductCategory.beverage,
		costPrice: 30000, // $300
		sellingPrice: 70000, // $700
		currentStock: 100,
		lowStockThreshold: 20,
		sku: "BEB-AGU-500",
	},
	{
		name: "Barrita de Cereal",
		description: "Barrita energetica de avena y miel",
		category: ProductCategory.food,
		costPrice: 50000, // $500
		sellingPrice: 100000, // $1000
		currentStock: 30,
		lowStockThreshold: 10,
		sku: "ALI-BAR-001",
	},
	{
		name: "Banana",
		description: "Banana fresca",
		category: ProductCategory.food,
		costPrice: 20000, // $200
		sellingPrice: 50000, // $500
		currentStock: 25,
		lowStockThreshold: 10,
		sku: "ALI-BAN-001",
	},
	{
		name: "Remera del Club - S",
		description: "Remera oficial del club talle S",
		category: ProductCategory.apparel,
		costPrice: 500000, // $5000
		sellingPrice: 1200000, // $12000
		currentStock: 15,
		lowStockThreshold: 5,
		sku: "ROP-REM-S",
	},
	{
		name: "Remera del Club - M",
		description: "Remera oficial del club talle M",
		category: ProductCategory.apparel,
		costPrice: 500000, // $5000
		sellingPrice: 1200000, // $12000
		currentStock: 20,
		lowStockThreshold: 5,
		sku: "ROP-REM-M",
	},
	{
		name: "Remera del Club - L",
		description: "Remera oficial del club talle L",
		category: ProductCategory.apparel,
		costPrice: 500000, // $5000
		sellingPrice: 1200000, // $12000
		currentStock: 18,
		lowStockThreshold: 5,
		sku: "ROP-REM-L",
	},
	{
		name: "Short del Club",
		description: "Short oficial del club",
		category: ProductCategory.apparel,
		costPrice: 400000, // $4000
		sellingPrice: 1000000, // $10000
		currentStock: 25,
		lowStockThreshold: 8,
		sku: "ROP-SHO-001",
	},
	{
		name: "Medias Deportivas",
		description: "Medias deportivas blancas",
		category: ProductCategory.apparel,
		costPrice: 100000, // $1000
		sellingPrice: 250000, // $2500
		currentStock: 40,
		lowStockThreshold: 15,
		sku: "ROP-MED-001",
	},
	{
		name: "Pelota de Futbol N5",
		description: "Pelota de futbol reglamentaria tamano 5",
		category: ProductCategory.equipment,
		costPrice: 2000000, // $20000
		sellingPrice: 3500000, // $35000
		currentStock: 10,
		lowStockThreshold: 3,
		sku: "EQU-PEL-N5",
	},
	{
		name: "Botella de Agua 750ml",
		description: "Botella reutilizable con logo del club",
		category: ProductCategory.merchandise,
		costPrice: 150000, // $1500
		sellingPrice: 350000, // $3500
		currentStock: 30,
		lowStockThreshold: 10,
		sku: "MER-BOT-750",
	},
	{
		name: "Proteina Whey 1kg",
		description: "Suplemento proteico sabor vainilla",
		category: ProductCategory.supplement,
		costPrice: 3000000, // $30000
		sellingPrice: 4500000, // $45000
		currentStock: 8,
		lowStockThreshold: 3,
		sku: "SUP-PRO-1KG",
	},
];

export async function seedProducts(
	organizationId: string,
	userId: string,
): Promise<void> {
	logger.info("Seeding products...");

	for (let i = 0; i < PRODUCTS_DATA.length; i++) {
		const productData = PRODUCTS_DATA[i];
		if (!productData) continue;

		const productId = seedUUID(ENTITY_PRODUCT, i + 1);

		// Check if product already exists
		const existing = await db.query.productTable.findFirst({
			where: eq(productTable.id, productId),
		});

		if (existing) {
			logger.info(
				{ productId, name: productData.name },
				"Product already exists, skipping",
			);
			continue;
		}

		await db.insert(productTable).values({
			id: productId,
			organizationId,
			name: productData.name,
			description: productData.description,
			category: productData.category,
			costPrice: productData.costPrice,
			sellingPrice: productData.sellingPrice,
			currentStock: productData.currentStock,
			lowStockThreshold: productData.lowStockThreshold,
			sku: productData.sku,
			currency: "ARS",
			trackStock: true,
			status: ProductStatus.active,
			isActive: true,
			createdBy: userId,
		});

		logger.info({ productId, name: productData.name }, "Created product");
	}

	logger.info(`Seeded ${PRODUCTS_DATA.length} products`);
}
