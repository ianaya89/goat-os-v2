import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	athleteGroupTable,
	coachTable,
	equipmentAssignmentTable,
	trainingEquipmentTable,
	trainingSessionTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import { ENTITY_EQUIPMENT_ASSIGNMENT, seedUUID } from "./utils";

export async function seedEquipmentAssignments(
	organizationId: string,
	userId: string,
): Promise<void> {
	logger.info("Seeding equipment assignments...");

	// Get equipment
	const equipment = await db.query.trainingEquipmentTable.findMany({
		where: eq(trainingEquipmentTable.organizationId, organizationId),
	});

	if (equipment.length === 0) {
		logger.warn("No equipment found, skipping assignments");
		return;
	}

	// Get athlete groups
	const groups = await db.query.athleteGroupTable.findMany({
		where: eq(athleteGroupTable.organizationId, organizationId),
		limit: 3,
	});

	// Get coaches
	const coaches = await db.query.coachTable.findMany({
		where: eq(coachTable.organizationId, organizationId),
		limit: 2,
	});

	// Get upcoming training sessions
	const sessions = await db.query.trainingSessionTable.findMany({
		where: eq(trainingSessionTable.organizationId, organizationId),
		limit: 3,
	});

	const equipmentByName = new Map(equipment.map((e) => [e.name, e]));

	let assignmentIndex = 1;

	// Create group assignments (permanent equipment for groups)
	const groupAssignments = [
		{ equipmentName: "Pelotas de Futbol N5", groupIndex: 0, quantity: 5 },
		{ equipmentName: "Conos de Entrenamiento", groupIndex: 0, quantity: 15 },
		{
			equipmentName: "Pecheras Entrenamiento - Amarillas",
			groupIndex: 0,
			quantity: 8,
		},
		{
			equipmentName: "Pecheras Entrenamiento - Azules",
			groupIndex: 0,
			quantity: 8,
		},
		{ equipmentName: "Pelotas de Futbol N5", groupIndex: 1, quantity: 5 },
		{ equipmentName: "Conos de Entrenamiento", groupIndex: 1, quantity: 15 },
		{
			equipmentName: "Pecheras Entrenamiento - Rojas",
			groupIndex: 1,
			quantity: 8,
		},
		{ equipmentName: "Escalera de Coordinacion", groupIndex: 1, quantity: 3 },
		{ equipmentName: "Arco Portatil 3x2m", groupIndex: 2, quantity: 2 },
		{ equipmentName: "Vallas de Velocidad 30cm", groupIndex: 2, quantity: 6 },
	];

	for (const assignment of groupAssignments) {
		const equipmentItem = equipmentByName.get(assignment.equipmentName);
		const group = groups[assignment.groupIndex];

		if (!equipmentItem || !group) continue;

		const assignmentId = seedUUID(
			ENTITY_EQUIPMENT_ASSIGNMENT,
			assignmentIndex++,
		);

		// Check if assignment already exists
		const existing = await db.query.equipmentAssignmentTable.findFirst({
			where: eq(equipmentAssignmentTable.id, assignmentId),
		});

		if (existing) {
			logger.info(
				{ assignmentId },
				"Equipment assignment already exists, skipping",
			);
			continue;
		}

		await db.insert(equipmentAssignmentTable).values({
			id: assignmentId,
			organizationId,
			equipmentId: equipmentItem.id,
			athleteGroupId: group.id,
			quantity: assignment.quantity,
			assignedAt: new Date(2024, 0, 20), // Jan 20, 2024
			notes: `Equipamiento asignado permanentemente al grupo ${group.name}`,
			assignedBy: userId,
		});

		logger.info(
			{ assignmentId, equipment: equipmentItem.name, group: group.name },
			"Created group equipment assignment",
		);
	}

	// Create coach assignments (personal equipment for coaches)
	const coachAssignments = [
		{ equipmentName: "Cronometros Digitales", coachIndex: 0, quantity: 1 },
		{
			equipmentName: "Botiquin de Primeros Auxilios",
			coachIndex: 0,
			quantity: 1,
		},
		{ equipmentName: "Cronometros Digitales", coachIndex: 1, quantity: 1 },
		{ equipmentName: "Bolsa de Equipamiento", coachIndex: 1, quantity: 1 },
	];

	for (const assignment of coachAssignments) {
		const equipmentItem = equipmentByName.get(assignment.equipmentName);
		const coach = coaches[assignment.coachIndex];

		if (!equipmentItem || !coach) continue;

		const assignmentId = seedUUID(
			ENTITY_EQUIPMENT_ASSIGNMENT,
			assignmentIndex++,
		);

		const existing = await db.query.equipmentAssignmentTable.findFirst({
			where: eq(equipmentAssignmentTable.id, assignmentId),
		});

		if (existing) {
			logger.info(
				{ assignmentId },
				"Equipment assignment already exists, skipping",
			);
			continue;
		}

		await db.insert(equipmentAssignmentTable).values({
			id: assignmentId,
			organizationId,
			equipmentId: equipmentItem.id,
			coachId: coach.id,
			quantity: assignment.quantity,
			assignedAt: new Date(2024, 1, 1), // Feb 1, 2024
			notes: `Equipamiento personal del entrenador`,
			assignedBy: userId,
		});

		logger.info(
			{ assignmentId, equipment: equipmentItem.name },
			"Created coach equipment assignment",
		);
	}

	// Create session assignments (temporary for specific sessions)
	const sessionAssignments = [
		{ equipmentName: "Postes de Slalom", sessionIndex: 0, quantity: 10 },
		{ equipmentName: "Bandas Elasticas - Set", sessionIndex: 0, quantity: 5 },
		{
			equipmentName: "Colchonetas de Entrenamiento",
			sessionIndex: 1,
			quantity: 6,
		},
		{ equipmentName: "Mancuernas 5kg (Par)", sessionIndex: 1, quantity: 4 },
		{ equipmentName: "Vallas de Velocidad 30cm", sessionIndex: 2, quantity: 8 },
		{ equipmentName: "Conos Marcadores Planos", sessionIndex: 2, quantity: 20 },
	];

	for (const assignment of sessionAssignments) {
		const equipmentItem = equipmentByName.get(assignment.equipmentName);
		const session = sessions[assignment.sessionIndex];

		if (!equipmentItem || !session) continue;

		const assignmentId = seedUUID(
			ENTITY_EQUIPMENT_ASSIGNMENT,
			assignmentIndex++,
		);

		const existing = await db.query.equipmentAssignmentTable.findFirst({
			where: eq(equipmentAssignmentTable.id, assignmentId),
		});

		if (existing) {
			logger.info(
				{ assignmentId },
				"Equipment assignment already exists, skipping",
			);
			continue;
		}

		// Session assignments are temporary - set expected return
		const expectedReturn = new Date(session.startTime);
		expectedReturn.setHours(expectedReturn.getHours() + 2);

		await db.insert(equipmentAssignmentTable).values({
			id: assignmentId,
			organizationId,
			equipmentId: equipmentItem.id,
			trainingSessionId: session.id,
			quantity: assignment.quantity,
			assignedAt: session.startTime,
			expectedReturnAt: expectedReturn,
			notes: `Equipamiento para sesion: ${session.title}`,
			assignedBy: userId,
		});

		logger.info(
			{ assignmentId, equipment: equipmentItem.name, session: session.title },
			"Created session equipment assignment",
		);
	}

	logger.info(`Seeded ${assignmentIndex - 1} equipment assignments`);
}
