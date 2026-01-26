import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	EquipmentCondition,
	TrainingEquipmentCategory,
	TrainingEquipmentStatus,
} from "@/lib/db/schema/enums";
import { locationTable, trainingEquipmentTable } from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import { ENTITY_EQUIPMENT, seedUUID } from "./utils";

const EQUIPMENT_DATA = [
	{
		name: "Pelotas de Futbol N5",
		description: "Pelotas de futbol reglamentarias tamano 5",
		brand: "Nike",
		model: "Flight 2024",
		category: TrainingEquipmentCategory.balls,
		totalQuantity: 20,
		condition: EquipmentCondition.good,
		purchasePrice: 1500000, // $15000 each
	},
	{
		name: "Conos de Entrenamiento",
		description: "Conos plasticos de 23cm varios colores",
		brand: "Generic",
		category: TrainingEquipmentCategory.cones,
		totalQuantity: 50,
		condition: EquipmentCondition.excellent,
		purchasePrice: 50000, // $500 each
	},
	{
		name: "Vallas de Velocidad 30cm",
		description: "Vallas ajustables para entrenamiento de velocidad",
		brand: "Decathlon",
		model: "Kipsta",
		category: TrainingEquipmentCategory.hurdles,
		totalQuantity: 12,
		condition: EquipmentCondition.good,
		purchasePrice: 300000, // $3000 each
	},
	{
		name: "Escalera de Coordinacion",
		description: "Escalera de agilidad 6 metros",
		brand: "Generic",
		category: TrainingEquipmentCategory.ladders,
		totalQuantity: 8,
		condition: EquipmentCondition.excellent,
		purchasePrice: 200000, // $2000 each
	},
	{
		name: "Pecheras Entrenamiento - Amarillas",
		description: "Pecheras de entrenamiento color amarillo",
		brand: "Nike",
		category: TrainingEquipmentCategory.bibs,
		totalQuantity: 15,
		condition: EquipmentCondition.good,
		purchasePrice: 80000, // $800 each
	},
	{
		name: "Pecheras Entrenamiento - Azules",
		description: "Pecheras de entrenamiento color azul",
		brand: "Nike",
		category: TrainingEquipmentCategory.bibs,
		totalQuantity: 15,
		condition: EquipmentCondition.good,
		purchasePrice: 80000, // $800 each
	},
	{
		name: "Pecheras Entrenamiento - Rojas",
		description: "Pecheras de entrenamiento color rojo",
		brand: "Nike",
		category: TrainingEquipmentCategory.bibs,
		totalQuantity: 15,
		condition: EquipmentCondition.excellent,
		purchasePrice: 80000, // $800 each
	},
	{
		name: "Arco Portatil 3x2m",
		description: "Arco de futbol portatil para entrenamiento",
		brand: "Kipsta",
		model: "SG 500",
		category: TrainingEquipmentCategory.goals,
		totalQuantity: 4,
		condition: EquipmentCondition.good,
		purchasePrice: 5000000, // $50000 each
	},
	{
		name: "Red para Arco 3x2m",
		description: "Red de repuesto para arco portatil",
		brand: "Generic",
		category: TrainingEquipmentCategory.nets,
		totalQuantity: 6,
		condition: EquipmentCondition.excellent,
		purchasePrice: 150000, // $1500 each
	},
	{
		name: "Postes de Slalom",
		description: "Postes flexibles para slalom de 1.6m",
		brand: "Generic",
		category: TrainingEquipmentCategory.poles,
		totalQuantity: 20,
		condition: EquipmentCondition.good,
		purchasePrice: 100000, // $1000 each
	},
	{
		name: "Colchonetas de Entrenamiento",
		description: "Colchonetas plegables para ejercicios de suelo",
		brand: "Decathlon",
		category: TrainingEquipmentCategory.mats,
		totalQuantity: 10,
		condition: EquipmentCondition.fair,
		purchasePrice: 400000, // $4000 each
	},
	{
		name: "Bandas Elasticas - Set",
		description: "Set de bandas elasticas de resistencia variable",
		brand: "Generic",
		category: TrainingEquipmentCategory.bands,
		totalQuantity: 15,
		condition: EquipmentCondition.excellent,
		purchasePrice: 150000, // $1500 each
	},
	{
		name: "Mancuernas 5kg (Par)",
		description: "Par de mancuernas de 5kg",
		brand: "Ruster",
		category: TrainingEquipmentCategory.weights,
		totalQuantity: 8,
		condition: EquipmentCondition.excellent,
		purchasePrice: 500000, // $5000 per pair
	},
	{
		name: "Botiquin de Primeros Auxilios",
		description: "Botiquin completo para emergencias deportivas",
		brand: "Medical",
		category: TrainingEquipmentCategory.medical,
		totalQuantity: 3,
		condition: EquipmentCondition.excellent,
		purchasePrice: 800000, // $8000 each
	},
	{
		name: "Cronometros Digitales",
		description: "Cronometros digitales con memoria de vueltas",
		brand: "Casio",
		category: TrainingEquipmentCategory.electronics,
		totalQuantity: 5,
		condition: EquipmentCondition.good,
		purchasePrice: 300000, // $3000 each
	},
	{
		name: "Conos Marcadores Planos",
		description: "Marcadores planos para delimitar areas",
		brand: "Generic",
		category: TrainingEquipmentCategory.markers,
		totalQuantity: 30,
		condition: EquipmentCondition.excellent,
		purchasePrice: 20000, // $200 each
	},
	{
		name: "Bolsa de Equipamiento",
		description: "Bolsa grande para transportar equipamiento",
		brand: "Nike",
		category: TrainingEquipmentCategory.storage,
		totalQuantity: 4,
		condition: EquipmentCondition.good,
		purchasePrice: 400000, // $4000 each
	},
];

export async function seedTrainingEquipment(
	organizationId: string,
	userId: string,
): Promise<void> {
	logger.info("Seeding training equipment...");

	// Get first location for assignment
	const locations = await db.query.locationTable.findMany({
		where: eq(locationTable.organizationId, organizationId),
		limit: 2,
	});

	for (let i = 0; i < EQUIPMENT_DATA.length; i++) {
		const equipmentData = EQUIPMENT_DATA[i];
		if (!equipmentData) continue;

		const equipmentId = seedUUID(ENTITY_EQUIPMENT, i + 1);

		// Check if equipment already exists
		const existing = await db.query.trainingEquipmentTable.findFirst({
			where: eq(trainingEquipmentTable.id, equipmentId),
		});

		if (existing) {
			logger.info(
				{ equipmentId, name: equipmentData.name },
				"Equipment already exists, skipping",
			);
			continue;
		}

		// Assign to alternating locations
		const locationId = locations[i % locations.length]?.id;

		await db.insert(trainingEquipmentTable).values({
			id: equipmentId,
			organizationId,
			name: equipmentData.name,
			description: equipmentData.description,
			brand: equipmentData.brand,
			model: equipmentData.model,
			category: equipmentData.category,
			totalQuantity: equipmentData.totalQuantity,
			availableQuantity: equipmentData.totalQuantity, // All available initially
			status: TrainingEquipmentStatus.available,
			condition: equipmentData.condition,
			purchasePrice: equipmentData.purchasePrice,
			purchaseDate: new Date(2024, 0, 15), // Jan 15, 2024
			currency: "ARS",
			locationId,
			isActive: true,
			createdBy: userId,
		});

		logger.info(
			{ equipmentId, name: equipmentData.name },
			"Created training equipment",
		);
	}

	logger.info(`Seeded ${EQUIPMENT_DATA.length} training equipment items`);
}
