import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { EquipmentCondition } from "@/lib/db/schema/enums";
import {
	equipmentMaintenanceTable,
	trainingEquipmentTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import { ENTITY_EQUIPMENT_MAINTENANCE, seedUUID } from "./utils";

// Maintenance types
const MaintenanceType = {
	repair: "repair",
	cleaning: "cleaning",
	inspection: "inspection",
	replacement: "replacement",
} as const;

const MAINTENANCE_DATA = [
	{
		equipmentName: "Pelotas de Futbol N5",
		type: MaintenanceType.inspection,
		description: "Inspeccion mensual de presion y estado",
		previousCondition: EquipmentCondition.good,
		newCondition: EquipmentCondition.good,
		daysAgo: 30,
	},
	{
		equipmentName: "Pelotas de Futbol N5",
		type: MaintenanceType.repair,
		description: "Reparacion de 2 pelotas con perdida de aire",
		cost: 50000, // $500
		previousCondition: EquipmentCondition.fair,
		newCondition: EquipmentCondition.good,
		daysAgo: 15,
	},
	{
		equipmentName: "Arco Portatil 3x2m",
		type: MaintenanceType.inspection,
		description: "Revision de estructura y estabilidad",
		previousCondition: EquipmentCondition.good,
		newCondition: EquipmentCondition.good,
		daysAgo: 45,
	},
	{
		equipmentName: "Red para Arco 3x2m",
		type: MaintenanceType.replacement,
		description: "Reemplazo de red danada por uso",
		cost: 150000, // $1500
		previousCondition: EquipmentCondition.poor,
		newCondition: EquipmentCondition.excellent,
		daysAgo: 20,
	},
	{
		equipmentName: "Colchonetas de Entrenamiento",
		type: MaintenanceType.cleaning,
		description: "Limpieza y desinfeccion profunda",
		cost: 20000, // $200
		previousCondition: EquipmentCondition.fair,
		newCondition: EquipmentCondition.fair,
		daysAgo: 7,
	},
	{
		equipmentName: "Pecheras Entrenamiento - Amarillas",
		type: MaintenanceType.cleaning,
		description: "Lavado y secado de pecheras",
		cost: 15000, // $150
		previousCondition: EquipmentCondition.good,
		newCondition: EquipmentCondition.good,
		daysAgo: 3,
	},
	{
		equipmentName: "Pecheras Entrenamiento - Azules",
		type: MaintenanceType.cleaning,
		description: "Lavado y secado de pecheras",
		cost: 15000, // $150
		previousCondition: EquipmentCondition.good,
		newCondition: EquipmentCondition.good,
		daysAgo: 3,
	},
	{
		equipmentName: "Pecheras Entrenamiento - Rojas",
		type: MaintenanceType.cleaning,
		description: "Lavado y secado de pecheras",
		cost: 15000, // $150
		previousCondition: EquipmentCondition.excellent,
		newCondition: EquipmentCondition.excellent,
		daysAgo: 3,
	},
	{
		equipmentName: "Vallas de Velocidad 30cm",
		type: MaintenanceType.repair,
		description: "Reparacion de ajustadores de altura",
		cost: 80000, // $800
		previousCondition: EquipmentCondition.fair,
		newCondition: EquipmentCondition.good,
		daysAgo: 25,
	},
	{
		equipmentName: "Escalera de Coordinacion",
		type: MaintenanceType.inspection,
		description: "Verificacion de correas y peldanos",
		previousCondition: EquipmentCondition.excellent,
		newCondition: EquipmentCondition.excellent,
		daysAgo: 14,
	},
	{
		equipmentName: "Cronometros Digitales",
		type: MaintenanceType.replacement,
		description: "Cambio de baterias",
		cost: 10000, // $100
		previousCondition: EquipmentCondition.good,
		newCondition: EquipmentCondition.good,
		daysAgo: 10,
	},
	{
		equipmentName: "Botiquin de Primeros Auxilios",
		type: MaintenanceType.inspection,
		description: "Revision de inventario y fechas de vencimiento",
		previousCondition: EquipmentCondition.excellent,
		newCondition: EquipmentCondition.excellent,
		daysAgo: 5,
		notes: "Se reemplazaron gasas y vendas vencidas",
	},
	{
		equipmentName: "Conos de Entrenamiento",
		type: MaintenanceType.inspection,
		description: "Conteo y revision de estado",
		previousCondition: EquipmentCondition.excellent,
		newCondition: EquipmentCondition.excellent,
		daysAgo: 30,
		notes: "3 conos danados, se descartaron",
	},
	{
		equipmentName: "Bolsa de Equipamiento",
		type: MaintenanceType.repair,
		description: "Reparacion de cierre y correas",
		cost: 30000, // $300
		previousCondition: EquipmentCondition.fair,
		newCondition: EquipmentCondition.good,
		daysAgo: 40,
	},
];

export async function seedEquipmentMaintenance(
	organizationId: string,
	userId: string,
): Promise<void> {
	logger.info("Seeding equipment maintenance records...");

	// Get equipment
	const equipment = await db.query.trainingEquipmentTable.findMany({
		where: eq(trainingEquipmentTable.organizationId, organizationId),
	});

	if (equipment.length === 0) {
		logger.warn("No equipment found, skipping maintenance records");
		return;
	}

	const equipmentByName = new Map(equipment.map((e) => [e.name, e]));

	for (let i = 0; i < MAINTENANCE_DATA.length; i++) {
		const maintenanceData = MAINTENANCE_DATA[i];
		if (!maintenanceData) continue;

		const equipmentItem = equipmentByName.get(maintenanceData.equipmentName);
		if (!equipmentItem) {
			logger.warn(
				{ name: maintenanceData.equipmentName },
				"Equipment not found, skipping maintenance",
			);
			continue;
		}

		const maintenanceId = seedUUID(ENTITY_EQUIPMENT_MAINTENANCE, i + 1);

		// Check if maintenance record already exists
		const existing = await db.query.equipmentMaintenanceTable.findFirst({
			where: eq(equipmentMaintenanceTable.id, maintenanceId),
		});

		if (existing) {
			logger.info(
				{ maintenanceId },
				"Maintenance record already exists, skipping",
			);
			continue;
		}

		// Calculate performed date
		const performedAt = new Date();
		performedAt.setDate(performedAt.getDate() - maintenanceData.daysAgo);

		await db.insert(equipmentMaintenanceTable).values({
			id: maintenanceId,
			equipmentId: equipmentItem.id,
			maintenanceType: maintenanceData.type,
			description: maintenanceData.description,
			cost: maintenanceData.cost,
			currency: "ARS",
			previousCondition: maintenanceData.previousCondition,
			newCondition: maintenanceData.newCondition,
			performedAt,
			performedBy: userId,
			notes: maintenanceData.notes,
		});

		logger.info(
			{
				maintenanceId,
				equipment: equipmentItem.name,
				type: maintenanceData.type,
			},
			"Created maintenance record",
		);
	}

	logger.info(
		`Seeded ${MAINTENANCE_DATA.length} equipment maintenance records`,
	);
}
