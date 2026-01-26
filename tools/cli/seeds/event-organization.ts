import { eq } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import {
	ENTITY_EVENT_BUDGET_LINE,
	ENTITY_EVENT_CHECKLIST,
	ENTITY_EVENT_DOCUMENT,
	ENTITY_EVENT_INVENTORY,
	ENTITY_EVENT_MILESTONE,
	ENTITY_EVENT_NOTE,
	ENTITY_EVENT_ORG_SPONSOR,
	ENTITY_EVENT_RISK,
	ENTITY_EVENT_RISK_LOG,
	ENTITY_EVENT_SPONSOR_BENEFIT,
	ENTITY_EVENT_STAFF,
	ENTITY_EVENT_STAFF_SHIFT,
	ENTITY_EVENT_TASK,
	ENTITY_EVENT_VENDOR_ASSIGNMENT,
	ENTITY_EVENT_ZONE,
	seedUUID,
} from "./utils";

// Zone types and names
const zoneTypes = [
	"main",
	"warmup",
	"rest",
	"registration",
	"medical",
	"vip",
	"parking",
	"catering",
];
const zoneNames = [
	"Cancha Principal",
	"Zona de Calentamiento",
	"Área de Descanso",
	"Acreditación",
	"Puesto Médico",
	"Tribuna VIP",
	"Estacionamiento",
	"Zona de Catering",
	"Control de Acceso",
	"Sala de Prensa",
];
const zoneColors = [
	"#3B82F6",
	"#10B981",
	"#F59E0B",
	"#EF4444",
	"#8B5CF6",
	"#EC4899",
	"#6B7280",
	"#14B8A6",
];

// Checklist categories and items
const checklistCategories = [
	"logistics",
	"communication",
	"safety",
	"vendors",
	"registrations",
];
const checklistItems = [
	"Confirmar reserva del venue",
	"Enviar comunicación a participantes",
	"Contratar seguridad",
	"Confirmar catering",
	"Verificar equipamiento médico",
	"Preparar credenciales",
	"Confirmar transporte",
	"Revisar sistema de inscripción",
	"Preparar señalética",
	"Coordinar cobertura de prensa",
	"Verificar equipos de audio",
	"Confirmar arbitraje",
	"Preparar premios/medallas",
	"Coordinar voluntarios",
	"Revisar plan de contingencia",
];

// Task data
const taskTitles = [
	"Diseñar flyer promocional",
	"Actualizar redes sociales",
	"Enviar invitaciones VIP",
	"Coordinar con sponsors",
	"Preparar briefing para staff",
	"Revisar contrato del venue",
	"Configurar punto de venta",
	"Preparar kits de participantes",
	"Coordinar estacionamiento",
	"Preparar programa del evento",
	"Armar cronograma de premiación",
	"Verificar seguros",
];
const taskStatuses = ["todo", "in_progress", "done"] as const;
const taskPriorities = ["low", "medium", "high", "urgent"] as const;

// Staff roles and names
const staffRoles = [
	"coordinator",
	"volunteer",
	"security",
	"medical",
	"referee",
	"photographer",
	"technician",
] as const;
const externalNames = [
	"Martín López",
	"Ana García",
	"Carlos Rodríguez",
	"Lucía Fernández",
	"Diego Martínez",
	"Valentina Pérez",
	"Nicolás Sánchez",
	"Camila Torres",
	"Tomás Ruiz",
	"Paula Álvarez",
];

// Budget categories
const budgetItems = [
	{ name: "Alquiler de venue", isRevenue: false },
	{ name: "Catering participantes", isRevenue: false },
	{ name: "Seguridad", isRevenue: false },
	{ name: "Equipamiento médico", isRevenue: false },
	{ name: "Material promocional", isRevenue: false },
	{ name: "Premios y medallas", isRevenue: false },
	{ name: "Transporte", isRevenue: false },
	{ name: "Inscripciones", isRevenue: true },
	{ name: "Sponsorship Platinum", isRevenue: true },
	{ name: "Venta de merchandise", isRevenue: true },
];

// Sponsor data
const sponsorNames = [
	"Deportes Pro SA",
	"Banco Regional",
	"Agua Vital",
	"Indumentaria Sport",
	"Tecnología Plus",
	"Seguros del Sur",
	"Automotriz Centro",
	"Medios Digitales",
];
const sponsorTiers = [
	"platinum",
	"gold",
	"silver",
	"bronze",
	"partner",
	"supporter",
] as const;
const benefitTitles = [
	"Logo en remeras",
	"Banner en venue",
	"Mención en redes",
	"Stand promocional",
	"Entradas VIP",
	"Espacio publicitario web",
	"Mención en premiación",
	"Acceso a base de datos",
];

// Milestone titles
const milestoneTitles = [
	"Apertura de inscripciones",
	"Cierre early bird",
	"Confirmar sponsors",
	"Cierre de inscripciones",
	"Entrega de kits",
	"Día del evento",
	"Entrega de resultados",
	"Cierre administrativo",
];

// Document types (using the values from the enum, not the keys)
const documentTypes = [
	"contract",
	"permit",
	"insurance",
	"floor_plan",
	"schedule",
	"budget",
	"report",
	"other",
] as const;
const documentNames = [
	"Contrato venue",
	"Permiso municipal",
	"Póliza de seguro",
	"Plano del evento",
	"Cronograma general",
	"Presupuesto aprobado",
	"Reporte de evento",
	"Reglamento competencia",
];

// Note types and content
const noteTypes = [
	"comment",
	"update",
	"issue",
	"decision",
	"reminder",
] as const;
const noteContents = [
	"Se confirmó la reserva del venue para las fechas solicitadas.",
	"Pendiente confirmar cantidad exacta de participantes.",
	"El sponsor principal solicitó cambios en la ubicación del banner.",
	"Se decidió ampliar el horario de acreditación.",
	"Recordar enviar confirmación a los voluntarios.",
	"Problema con el proveedor de catering - buscar alternativa.",
	"Actualización: se sumaron 20 inscriptos más.",
	"Decisión: premios se entregarán al finalizar cada categoría.",
];

// Inventory items
const inventoryItems = [
	{ name: "Conos de entrenamiento", category: "equipment" },
	{ name: "Balones", category: "equipment" },
	{ name: "Botiquín primeros auxilios", category: "medical" },
	{ name: "Mesas plegables", category: "furniture" },
	{ name: "Sillas", category: "furniture" },
	{ name: "Carpas", category: "structures" },
	{ name: "Banners", category: "signage" },
	{ name: "Credenciales", category: "supplies" },
	{ name: "Botellas de agua", category: "catering" },
	{ name: "Radios comunicación", category: "tech" },
];
const _inventoryStatuses = [
	"needed",
	"reserved",
	"acquired",
	"deployed",
	"returned",
] as const;

// Risk data
const riskTitles = [
	"Lluvia durante el evento",
	"Baja asistencia",
	"Problemas con el sonido",
	"Lesiones de participantes",
	"Falla eléctrica",
	"Cancelación de sponsor",
	"Problemas de tránsito",
	"Conflictos con vecinos",
];
const riskSeverities = ["low", "medium", "high", "critical"] as const;
const riskProbabilities = [
	"unlikely",
	"possible",
	"likely",
	"almost_certain",
] as const;
const riskStatuses = [
	"identified",
	"mitigating",
	"mitigated",
	"occurred",
	"closed",
] as const;

// Helper functions
function addDays(date: Date, days: number): Date {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addHours(date: Date, hours: number): Date {
	return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function generatePhone(): string {
	return `+54 11 ${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateEmail(name: string): string {
	return `${name.toLowerCase().replace(/\s+/g, ".")}@email.com`;
}

/**
 * Seed event organization data for all events
 * This function creates zones, checklists, tasks, staff, budget, sponsors,
 * milestones, documents, notes, inventory, vendor assignments, and risks
 */
export async function seedEventOrganization(
	db: DrizzleClient,
	_count: number,
	context: SeedContext,
): Promise<void> {
	if (context.eventIds.length === 0) {
		return;
	}

	// Counters for deterministic IDs
	let zoneIndex = 0;
	let checklistIndex = 0;
	let taskIndex = 0;
	let staffIndex = 0;
	let shiftIndex = 0;
	let budgetIndex = 0;
	let sponsorIndex = 0;
	let benefitIndex = 0;
	let milestoneIndex = 0;
	let documentIndex = 0;
	let noteIndex = 0;
	let inventoryIndex = 0;
	let vendorAssignmentIndex = 0;
	let riskIndex = 0;
	let riskLogIndex = 0;

	// Check for existing data to avoid duplicates
	const existingZones = await db.query.eventZoneTable.findMany({
		where: eq(schema.eventZoneTable.organizationId, context.organizationId),
	});

	if (existingZones.length > 0) {
		// Already seeded
		return;
	}

	// Arrays to collect all records for batch insert
	const zones: Array<typeof schema.eventZoneTable.$inferInsert> = [];
	const checklists: Array<typeof schema.eventChecklistTable.$inferInsert> = [];
	const tasks: Array<typeof schema.eventTaskTable.$inferInsert> = [];
	const staffMembers: Array<typeof schema.eventStaffTable.$inferInsert> = [];
	const staffShifts: Array<typeof schema.eventStaffShiftTable.$inferInsert> =
		[];
	const budgetLines: Array<typeof schema.eventBudgetLineTable.$inferInsert> =
		[];
	const sponsors: Array<typeof schema.eventSponsorTable.$inferInsert> = [];
	const benefits: Array<typeof schema.eventSponsorBenefitTable.$inferInsert> =
		[];
	const milestones: Array<typeof schema.eventMilestoneTable.$inferInsert> = [];
	const documents: Array<typeof schema.eventDocumentTable.$inferInsert> = [];
	const notes: Array<typeof schema.eventNoteTable.$inferInsert> = [];
	const inventoryRecords: Array<
		typeof schema.eventInventoryTable.$inferInsert
	> = [];
	const vendorAssignments: Array<
		typeof schema.eventVendorAssignmentTable.$inferInsert
	> = [];
	const risks: Array<typeof schema.eventRiskTable.$inferInsert> = [];
	const riskLogs: Array<typeof schema.eventRiskLogTable.$inferInsert> = [];

	const now = new Date();

	// Process each event
	for (let eventIdx = 0; eventIdx < context.eventIds.length; eventIdx++) {
		const eventId = context.eventIds[eventIdx];
		if (!eventId) continue;

		const eventStartDate = addDays(now, 10 + eventIdx * 5);

		// Create zones for this event (3-5 per event)
		const numZones = 3 + (eventIdx % 3);
		const eventZoneIds: string[] = [];
		for (let z = 0; z < numZones; z++) {
			const zoneId = seedUUID(ENTITY_EVENT_ZONE, ++zoneIndex);
			eventZoneIds.push(zoneId);
			zones.push({
				id: zoneId,
				eventId,
				organizationId: context.organizationId,
				name: zoneNames[z % zoneNames.length] ?? `Zona ${z + 1}`,
				description: `Zona designada para ${zoneTypes[z % zoneTypes.length]}`,
				zoneType: zoneTypes[z % zoneTypes.length],
				capacity: 50 + z * 25,
				locationDescription: `Sector ${String.fromCharCode(65 + z)}`,
				color: zoneColors[z % zoneColors.length],
				isActive: true,
				createdBy: context.seedUserId,
			});
		}

		// Create checklists for this event (5-8 per event)
		const numChecklists = 5 + (eventIdx % 4);
		for (let c = 0; c < numChecklists; c++) {
			const status = c < numChecklists / 2 ? "completed" : "pending";
			checklists.push({
				id: seedUUID(ENTITY_EVENT_CHECKLIST, ++checklistIndex),
				eventId,
				organizationId: context.organizationId,
				title: checklistItems[c % checklistItems.length] ?? `Item ${c + 1}`,
				category: checklistCategories[c % checklistCategories.length],
				status: status as "completed" | "pending",
				completedAt: status === "completed" ? addDays(now, -5 + c) : null,
				completedBy: status === "completed" ? context.seedUserId : null,
				dueDate: addDays(eventStartDate, -7 + c),
				sortOrder: c,
				createdBy: context.seedUserId,
			});
		}

		// Create tasks for this event (6-10 per event)
		const numTasks = 6 + (eventIdx % 5);
		for (let t = 0; t < numTasks; t++) {
			const status = taskStatuses[t % taskStatuses.length] ?? "todo";
			const priority = taskPriorities[t % taskPriorities.length] ?? "medium";
			const assigneeId =
				context.userIds.length > 0
					? context.userIds[t % context.userIds.length]
					: null;

			tasks.push({
				id: seedUUID(ENTITY_EVENT_TASK, ++taskIndex),
				eventId,
				organizationId: context.organizationId,
				title: taskTitles[t % taskTitles.length] ?? `Tarea ${t + 1}`,
				description: `Descripción detallada de la tarea #${t + 1}`,
				status,
				priority,
				assigneeId,
				dueDate: addDays(eventStartDate, -10 + t),
				startedAt: status !== "todo" ? addDays(now, -3) : null,
				completedAt: status === "done" ? addDays(now, -1) : null,
				columnPosition: t,
				createdBy: context.seedUserId,
			});
		}

		// Create staff for this event (5-10 per event)
		const numStaff = 5 + (eventIdx % 6);
		const eventStaffIds: string[] = [];
		for (let s = 0; s < numStaff; s++) {
			const staffId = seedUUID(ENTITY_EVENT_STAFF, ++staffIndex);
			eventStaffIds.push(staffId);

			// Mix of system users and external staff
			const isSystemUser = s < 2 && context.userIds.length > s;
			const role = staffRoles[s % staffRoles.length] ?? "volunteer";
			const externalName = externalNames[s % externalNames.length] ?? "Staff";

			staffMembers.push({
				id: staffId,
				eventId,
				organizationId: context.organizationId,
				staffType: isSystemUser ? "system_user" : "external",
				userId: isSystemUser ? context.userIds[s] : null,
				externalName: isSystemUser ? null : externalName,
				externalEmail: isSystemUser ? null : generateEmail(externalName),
				externalPhone: isSystemUser ? null : generatePhone(),
				role,
				roleTitle: `${role.charAt(0).toUpperCase()}${role.slice(1)} - ${zoneNames[s % numZones]}`,
				isConfirmed: s % 3 !== 0,
				confirmedAt: s % 3 !== 0 ? addDays(now, -5) : null,
				notes: s % 4 === 0 ? "Disponible sólo por la mañana" : null,
				createdBy: context.seedUserId,
			});

			// Create 1-2 shifts per staff member
			const numShifts = 1 + (s % 2);
			for (let sh = 0; sh < numShifts; sh++) {
				const shiftDate = addDays(eventStartDate, sh);
				staffShifts.push({
					id: seedUUID(ENTITY_EVENT_STAFF_SHIFT, ++shiftIndex),
					staffId,
					eventId,
					shiftDate,
					startTime: addHours(shiftDate, 8 + sh * 4),
					endTime: addHours(shiftDate, 12 + sh * 4),
					zoneId: eventZoneIds[sh % eventZoneIds.length],
					checkedInAt:
						sh === 0 && s < numStaff / 2 ? addHours(shiftDate, 8) : null,
					checkedOutAt: null,
					notes: null,
				});
			}
		}

		// Create budget lines for this event (6-10 per event)
		const numBudgetLines = 6 + (eventIdx % 5);
		for (let b = 0; b < numBudgetLines; b++) {
			const item = budgetItems[b % budgetItems.length];
			if (!item) continue;

			const plannedAmount = (10000 + b * 5000) * 100; // In cents
			const actualAmount = item.isRevenue
				? Math.floor(plannedAmount * (0.8 + Math.random() * 0.4))
				: Math.floor(plannedAmount * (0.7 + Math.random() * 0.5));

			const status = actualAmount > 0 ? "spent" : "planned";

			budgetLines.push({
				id: seedUUID(ENTITY_EVENT_BUDGET_LINE, ++budgetIndex),
				eventId,
				organizationId: context.organizationId,
				categoryId:
					context.expenseCategoryIds.length > 0
						? context.expenseCategoryIds[b % context.expenseCategoryIds.length]
						: null,
				name: item.name,
				description: `${item.name} para el evento`,
				plannedAmount,
				actualAmount,
				currency: "ARS",
				status: status as "planned" | "spent" | "approved" | "cancelled",
				isRevenue: item.isRevenue,
				notes: b % 3 === 0 ? "Precio negociado con descuento" : null,
				createdBy: context.seedUserId,
			});
		}

		// Create sponsors for this event (2-4 per event)
		const numSponsors = 2 + (eventIdx % 3);
		for (let sp = 0; sp < numSponsors; sp++) {
			const sponsorId = seedUUID(ENTITY_EVENT_ORG_SPONSOR, ++sponsorIndex);
			const tier = sponsorTiers[sp % sponsorTiers.length] ?? "partner";
			const sponsorName =
				sponsorNames[sp % sponsorNames.length] ?? `Sponsor ${sp + 1}`;
			const sponsorValue =
				tier === "platinum"
					? 500000
					: tier === "gold"
						? 300000
						: tier === "silver"
							? 150000
							: 50000;

			sponsors.push({
				id: sponsorId,
				eventId,
				organizationId: context.organizationId,
				name: sponsorName,
				description: `${sponsorName} - Sponsor ${tier}`,
				logoUrl: null,
				websiteUrl: `https://www.${sponsorName.toLowerCase().replace(/\s+/g, "")}.com`,
				contactName: externalNames[sp % externalNames.length],
				contactEmail: generateEmail(sponsorName),
				contactPhone: generatePhone(),
				tier,
				sponsorshipValue: sponsorValue * 100,
				currency: "ARS",
				inKindDescription:
					sp % 2 === 0 ? "Incluye productos para sorteo" : null,
				contractSigned: sp < numSponsors - 1,
				contractSignedAt:
					sp < numSponsors - 1 ? addDays(now, -30 + sp * 5) : null,
				sortOrder: sp,
				notes: sp === 0 ? "Sponsor principal - prioridad en visibilidad" : null,
				createdBy: context.seedUserId,
			});

			// Create 2-3 benefits per sponsor
			const numBenefits = 2 + (sp % 2);
			for (let bf = 0; bf < numBenefits; bf++) {
				const benefitStatus =
					bf === 0 ? "delivered" : bf === 1 ? "pending" : "cancelled";
				benefits.push({
					id: seedUUID(ENTITY_EVENT_SPONSOR_BENEFIT, ++benefitIndex),
					sponsorId,
					title:
						benefitTitles[(sp * 3 + bf) % benefitTitles.length] ??
						`Beneficio ${bf + 1}`,
					description: `Descripción del beneficio para ${sponsorName}`,
					quantity: 1 + bf,
					estimatedValue: (5000 + bf * 2000) * 100,
					status: benefitStatus as "pending" | "delivered" | "cancelled",
					deliveredAt: benefitStatus === "delivered" ? addDays(now, -5) : null,
					deliveryNotes:
						benefitStatus === "delivered"
							? "Entregado según lo acordado"
							: null,
					dueDate: addDays(eventStartDate, -3 + bf),
				});
			}
		}

		// Create milestones for this event (5-8 per event)
		const numMilestones = 5 + (eventIdx % 4);
		for (let m = 0; m < numMilestones; m++) {
			const targetDate = addDays(eventStartDate, -30 + m * 5);
			const isPast = targetDate < now;
			const status =
				isPast && m < numMilestones / 2
					? "completed"
					: isPast
						? "delayed"
						: "pending";

			milestones.push({
				id: seedUUID(ENTITY_EVENT_MILESTONE, ++milestoneIndex),
				eventId,
				organizationId: context.organizationId,
				title: milestoneTitles[m % milestoneTitles.length] ?? `Hito ${m + 1}`,
				description: `Descripción del hito #${m + 1}`,
				targetDate,
				completedAt: status === "completed" ? targetDate : null,
				status: status as
					| "pending"
					| "completed"
					| "delayed"
					| "in_progress"
					| "cancelled",
				responsibleId:
					context.userIds.length > 0
						? context.userIds[m % context.userIds.length]
						: null,
				color: zoneColors[m % zoneColors.length],
				notes: m % 3 === 0 ? "Hito crítico - requiere seguimiento" : null,
				createdBy: context.seedUserId,
			});
		}

		// Create documents for this event (3-5 per event)
		const numDocuments = 3 + (eventIdx % 3);
		for (let d = 0; d < numDocuments; d++) {
			const docType = documentTypes[d % documentTypes.length] ?? "other";
			const docName =
				documentNames[d % documentNames.length] ?? `Documento ${d + 1}`;

			documents.push({
				id: seedUUID(ENTITY_EVENT_DOCUMENT, ++documentIndex),
				eventId,
				organizationId: context.organizationId,
				name: docName,
				description: `${docName} del evento`,
				documentType: docType,
				storageKey: `events/${eventId}/documents/doc-${d + 1}.pdf`,
				fileName: `${docName.toLowerCase().replace(/\s+/g, "-")}.pdf`,
				fileSize: 1024 * (100 + d * 50),
				mimeType: "application/pdf",
				version: 1,
				tags: JSON.stringify([docType, "evento"]),
				isPublic: d % 3 === 0,
				uploadedBy: context.seedUserId,
			});
		}

		// Create notes for this event (5-10 per event)
		const numNotes = 5 + (eventIdx % 6);
		for (let n = 0; n < numNotes; n++) {
			const noteType = noteTypes[n % noteTypes.length] ?? "comment";
			const isPinned = n === 0;

			notes.push({
				id: seedUUID(ENTITY_EVENT_NOTE, ++noteIndex),
				eventId,
				organizationId: context.organizationId,
				content: noteContents[n % noteContents.length] ?? `Nota #${n + 1}`,
				noteType,
				parentNoteId: null,
				mentions: null,
				isPinned,
				pinnedAt: isPinned ? now : null,
				pinnedBy: isPinned ? context.seedUserId : null,
				relatedEntityType: n % 4 === 0 ? "task" : null,
				relatedEntityId: null,
				authorId: context.seedUserId,
			});
		}

		// Create inventory for this event (5-8 per event)
		const numInventory = 5 + (eventIdx % 4);
		for (let i = 0; i < numInventory; i++) {
			const item = inventoryItems[i % inventoryItems.length];
			if (!item) continue;

			const quantityNeeded = 10 + i * 5;
			const quantityAvailable = Math.floor(
				quantityNeeded * (0.5 + Math.random() * 0.7),
			);
			const status =
				quantityAvailable >= quantityNeeded
					? "acquired"
					: quantityAvailable > 0
						? "reserved"
						: "needed";

			inventoryRecords.push({
				id: seedUUID(ENTITY_EVENT_INVENTORY, ++inventoryIndex),
				eventId,
				organizationId: context.organizationId,
				name: item.name,
				description: `${item.name} para el evento`,
				category: item.category,
				quantityNeeded,
				quantityAvailable,
				status: status as
					| "needed"
					| "reserved"
					| "acquired"
					| "deployed"
					| "returned",
				source:
					i % 3 === 0 ? "Compra" : i % 3 === 1 ? "Alquiler" : "Stock propio",
				vendorId:
					context.vendorIds.length > 0 && i % 2 === 0
						? context.vendorIds[i % context.vendorIds.length]
						: null,
				unitCost: (500 + i * 100) * 100,
				totalCost: (500 + i * 100) * 100 * quantityNeeded,
				currency: "ARS",
				zoneId:
					eventZoneIds.length > 0
						? eventZoneIds[i % eventZoneIds.length]
						: null,
				notes: i % 4 === 0 ? "Verificar disponibilidad" : null,
				createdBy: context.seedUserId,
			});
		}

		// Create vendor assignments for this event (2-4 per event)
		if (context.vendorIds.length > 0) {
			const numAssignments = Math.min(
				2 + (eventIdx % 3),
				context.vendorIds.length,
			);
			for (let va = 0; va < numAssignments; va++) {
				const vendorId = context.vendorIds[va % context.vendorIds.length];
				if (!vendorId) continue;

				vendorAssignments.push({
					id: seedUUID(ENTITY_EVENT_VENDOR_ASSIGNMENT, ++vendorAssignmentIndex),
					eventId,
					vendorId,
					serviceDescription: `Servicio contratado para el evento #${eventIdx + 1}`,
					contractValue: (20000 + va * 10000) * 100,
					currency: "ARS",
					isConfirmed: va < numAssignments - 1,
					confirmedAt: va < numAssignments - 1 ? addDays(now, -10 + va) : null,
					notes: va === 0 ? "Proveedor principal" : null,
				});
			}
		}

		// Create risks for this event (3-5 per event)
		const numRisks = 3 + (eventIdx % 3);
		for (let r = 0; r < numRisks; r++) {
			const riskId = seedUUID(ENTITY_EVENT_RISK, ++riskIndex);
			const severity = riskSeverities[r % riskSeverities.length] ?? "medium";
			const probability =
				riskProbabilities[r % riskProbabilities.length] ?? "possible";
			const status = riskStatuses[r % riskStatuses.length] ?? "identified";

			// Calculate risk score (severity * probability)
			const severityScore =
				{ low: 1, medium: 2, high: 3, critical: 4 }[severity] ?? 2;
			const probabilityScore =
				{ unlikely: 1, possible: 2, likely: 3, almost_certain: 4 }[
					probability
				] ?? 2;
			const riskScore = severityScore * probabilityScore;

			risks.push({
				id: riskId,
				eventId,
				organizationId: context.organizationId,
				title: riskTitles[r % riskTitles.length] ?? `Riesgo ${r + 1}`,
				description: `Descripción detallada del riesgo #${r + 1}`,
				category: r % 2 === 0 ? "operational" : "external",
				severity,
				probability,
				riskScore,
				status,
				mitigationPlan: `Plan de mitigación para el riesgo #${r + 1}`,
				contingencyPlan:
					r % 2 === 0 ? `Plan de contingencia para el riesgo #${r + 1}` : null,
				ownerId:
					context.userIds.length > 0
						? context.userIds[r % context.userIds.length]
						: context.seedUserId,
				nextReviewDate: addDays(eventStartDate, -7),
				notes: r % 3 === 0 ? "Requiere revisión semanal" : null,
				createdBy: context.seedUserId,
			});

			// Create 1-2 risk log entries per risk
			const numLogs = 1 + (r % 2);
			for (let rl = 0; rl < numLogs; rl++) {
				const previousStatus =
					rl === 0 ? null : riskStatuses[(r + rl - 1) % riskStatuses.length];
				const newStatus = riskStatuses[(r + rl) % riskStatuses.length];

				riskLogs.push({
					id: seedUUID(ENTITY_EVENT_RISK_LOG, ++riskLogIndex),
					riskId,
					action: rl === 0 ? "created" : "status_change",
					previousStatus,
					newStatus,
					description:
						rl === 0
							? "Riesgo identificado y registrado"
							: `Estado actualizado de ${previousStatus} a ${newStatus}`,
					userId: context.seedUserId,
				});
			}
		}
	}

	// Batch insert all records
	if (zones.length > 0) {
		await db.insert(schema.eventZoneTable).values(zones).onConflictDoNothing();
	}

	if (checklists.length > 0) {
		await db
			.insert(schema.eventChecklistTable)
			.values(checklists)
			.onConflictDoNothing();
	}

	if (tasks.length > 0) {
		await db.insert(schema.eventTaskTable).values(tasks).onConflictDoNothing();
	}

	if (staffMembers.length > 0) {
		await db
			.insert(schema.eventStaffTable)
			.values(staffMembers)
			.onConflictDoNothing();
	}

	if (staffShifts.length > 0) {
		await db
			.insert(schema.eventStaffShiftTable)
			.values(staffShifts)
			.onConflictDoNothing();
	}

	if (budgetLines.length > 0) {
		await db
			.insert(schema.eventBudgetLineTable)
			.values(budgetLines)
			.onConflictDoNothing();
	}

	if (sponsors.length > 0) {
		await db
			.insert(schema.eventSponsorTable)
			.values(sponsors)
			.onConflictDoNothing();
	}

	if (benefits.length > 0) {
		await db
			.insert(schema.eventSponsorBenefitTable)
			.values(benefits)
			.onConflictDoNothing();
	}

	if (milestones.length > 0) {
		await db
			.insert(schema.eventMilestoneTable)
			.values(milestones)
			.onConflictDoNothing();
	}

	if (documents.length > 0) {
		await db
			.insert(schema.eventDocumentTable)
			.values(documents)
			.onConflictDoNothing();
	}

	if (notes.length > 0) {
		await db.insert(schema.eventNoteTable).values(notes).onConflictDoNothing();
	}

	if (inventoryRecords.length > 0) {
		await db
			.insert(schema.eventInventoryTable)
			.values(inventoryRecords)
			.onConflictDoNothing();
	}

	if (vendorAssignments.length > 0) {
		await db
			.insert(schema.eventVendorAssignmentTable)
			.values(vendorAssignments)
			.onConflictDoNothing();
	}

	if (risks.length > 0) {
		await db.insert(schema.eventRiskTable).values(risks).onConflictDoNothing();
	}

	if (riskLogs.length > 0) {
		await db
			.insert(schema.eventRiskLogTable)
			.values(riskLogs)
			.onConflictDoNothing();
	}
}
