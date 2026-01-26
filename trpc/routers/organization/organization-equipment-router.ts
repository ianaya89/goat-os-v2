import { TRPCError } from "@trpc/server";
import {
	and,
	desc,
	eq,
	gte,
	ilike,
	isNull,
	lte,
	or,
	type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	type EquipmentCondition,
	TrainingEquipmentStatus,
} from "@/lib/db/schema/enums";
import {
	athleteGroupTable,
	coachTable,
	equipmentAssignmentTable,
	equipmentMaintenanceTable,
	locationTable,
	trainingEquipmentTable,
	trainingSessionTable,
} from "@/lib/db/schema/tables";
import {
	createAssignmentSchema,
	createEquipmentSchema,
	createMaintenanceSchema,
	deleteAssignmentSchema,
	deleteEquipmentSchema,
	getEquipmentSchema,
	listAssignmentsSchema,
	listEquipmentSchema,
	listMaintenanceSchema,
	returnAssignmentSchema,
	updateEquipmentSchema,
} from "@/schemas/organization-equipment-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationEquipmentRouter = createTRPCRouter({
	// ============================================================================
	// EQUIPMENT PROCEDURES
	// ============================================================================

	// List all equipment with filtering
	list: protectedOrganizationProcedure
		.input(listEquipmentSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(trainingEquipmentTable.organizationId, ctx.organization.id),
				eq(trainingEquipmentTable.isActive, true),
			];

			if (input.category) {
				conditions.push(eq(trainingEquipmentTable.category, input.category));
			}

			if (input.status) {
				conditions.push(eq(trainingEquipmentTable.status, input.status));
			}

			if (input.condition) {
				conditions.push(eq(trainingEquipmentTable.condition, input.condition));
			}

			if (input.locationId) {
				conditions.push(
					eq(trainingEquipmentTable.locationId, input.locationId),
				);
			}

			if (input.search) {
				conditions.push(
					or(
						ilike(trainingEquipmentTable.name, `%${input.search}%`),
						ilike(trainingEquipmentTable.brand, `%${input.search}%`),
						ilike(trainingEquipmentTable.model, `%${input.search}%`),
						ilike(trainingEquipmentTable.serialNumber, `%${input.search}%`),
					) ?? eq(trainingEquipmentTable.id, trainingEquipmentTable.id),
				);
			}

			if (input.needsMaintenance) {
				// Equipment where nextMaintenanceDate <= today
				conditions.push(
					lte(trainingEquipmentTable.nextMaintenanceDate, new Date()),
				);
			}

			const equipment = await db.query.trainingEquipmentTable.findMany({
				where: and(...conditions),
				orderBy: desc(trainingEquipmentTable.createdAt),
				with: {
					location: {
						columns: { id: true, name: true },
					},
					createdByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			return equipment;
		}),

	// Get single equipment
	get: protectedOrganizationProcedure
		.input(getEquipmentSchema)
		.query(async ({ ctx, input }) => {
			const equipment = await db.query.trainingEquipmentTable.findFirst({
				where: and(
					eq(trainingEquipmentTable.id, input.id),
					eq(trainingEquipmentTable.organizationId, ctx.organization.id),
				),
				with: {
					location: true,
					createdByUser: {
						columns: { id: true, name: true },
					},
					assignments: {
						where: isNull(equipmentAssignmentTable.returnedAt),
						with: {
							athleteGroup: {
								columns: { id: true, name: true },
							},
							trainingSession: {
								columns: { id: true, title: true },
							},
							coach: {
								with: {
									user: {
										columns: { id: true, name: true },
									},
								},
							},
						},
					},
					maintenanceRecords: {
						limit: 5,
						orderBy: desc(equipmentMaintenanceTable.performedAt),
					},
				},
			});

			if (!equipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Equipamiento no encontrado",
				});
			}

			return equipment;
		}),

	// Create new equipment
	create: protectedOrganizationProcedure
		.input(createEquipmentSchema)
		.mutation(async ({ ctx, input }) => {
			// Validate location if provided
			if (input.locationId) {
				const location = await db.query.locationTable.findFirst({
					where: and(
						eq(locationTable.id, input.locationId),
						eq(locationTable.organizationId, ctx.organization.id),
					),
				});

				if (!location) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Ubicación no encontrada",
					});
				}
			}

			const [equipment] = await db
				.insert(trainingEquipmentTable)
				.values({
					organizationId: ctx.organization.id,
					...input,
					availableQuantity: input.availableQuantity ?? input.totalQuantity,
					createdBy: ctx.user.id,
				})
				.returning();

			if (!equipment) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Error al crear el equipamiento",
				});
			}

			return equipment;
		}),

	// Update equipment
	update: protectedOrganizationProcedure
		.input(updateEquipmentSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Validate location if provided
			if (data.locationId) {
				const location = await db.query.locationTable.findFirst({
					where: and(
						eq(locationTable.id, data.locationId),
						eq(locationTable.organizationId, ctx.organization.id),
					),
				});

				if (!location) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Ubicación no encontrada",
					});
				}
			}

			const [updated] = await db
				.update(trainingEquipmentTable)
				.set(data)
				.where(
					and(
						eq(trainingEquipmentTable.id, id),
						eq(trainingEquipmentTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Equipamiento no encontrado",
				});
			}

			return updated;
		}),

	// Delete equipment (soft delete)
	delete: protectedOrganizationProcedure
		.input(deleteEquipmentSchema)
		.mutation(async ({ ctx, input }) => {
			const [updated] = await db
				.update(trainingEquipmentTable)
				.set({ isActive: false, status: TrainingEquipmentStatus.retired })
				.where(
					and(
						eq(trainingEquipmentTable.id, input.id),
						eq(trainingEquipmentTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Equipamiento no encontrado",
				});
			}

			return { success: true };
		}),

	// ============================================================================
	// ASSIGNMENT PROCEDURES
	// ============================================================================

	// List assignments
	listAssignments: protectedOrganizationProcedure
		.input(listAssignmentsSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(equipmentAssignmentTable.organizationId, ctx.organization.id),
			];

			if (input.equipmentId) {
				conditions.push(
					eq(equipmentAssignmentTable.equipmentId, input.equipmentId),
				);
			}

			if (input.athleteGroupId) {
				conditions.push(
					eq(equipmentAssignmentTable.athleteGroupId, input.athleteGroupId),
				);
			}

			if (input.trainingSessionId) {
				conditions.push(
					eq(
						equipmentAssignmentTable.trainingSessionId,
						input.trainingSessionId,
					),
				);
			}

			if (input.coachId) {
				conditions.push(eq(equipmentAssignmentTable.coachId, input.coachId));
			}

			if (input.activeOnly) {
				conditions.push(isNull(equipmentAssignmentTable.returnedAt));
			}

			const assignments = await db.query.equipmentAssignmentTable.findMany({
				where: and(...conditions),
				orderBy: desc(equipmentAssignmentTable.assignedAt),
				with: {
					equipment: {
						columns: { id: true, name: true, category: true },
					},
					athleteGroup: {
						columns: { id: true, name: true },
					},
					trainingSession: {
						columns: { id: true, title: true },
					},
					coach: {
						with: {
							user: {
								columns: { id: true, name: true },
							},
						},
					},
					assignedByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			return assignments;
		}),

	// Create assignment
	createAssignment: protectedOrganizationProcedure
		.input(createAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify equipment belongs to organization and is available
			const equipment = await db.query.trainingEquipmentTable.findFirst({
				where: and(
					eq(trainingEquipmentTable.id, input.equipmentId),
					eq(trainingEquipmentTable.organizationId, ctx.organization.id),
				),
			});

			if (!equipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Equipamiento no encontrado",
				});
			}

			if (equipment.availableQuantity < input.quantity) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Cantidad insuficiente. Disponible: ${equipment.availableQuantity}`,
				});
			}

			// Validate references
			if (input.athleteGroupId) {
				const group = await db.query.athleteGroupTable.findFirst({
					where: and(
						eq(athleteGroupTable.id, input.athleteGroupId),
						eq(athleteGroupTable.organizationId, ctx.organization.id),
					),
				});
				if (!group) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Grupo no encontrado",
					});
				}
			}

			if (input.trainingSessionId) {
				const session = await db.query.trainingSessionTable.findFirst({
					where: and(
						eq(trainingSessionTable.id, input.trainingSessionId),
						eq(trainingSessionTable.organizationId, ctx.organization.id),
					),
				});
				if (!session) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Sesión no encontrada",
					});
				}
			}

			if (input.coachId) {
				const coach = await db.query.coachTable.findFirst({
					where: and(
						eq(coachTable.id, input.coachId),
						eq(coachTable.organizationId, ctx.organization.id),
					),
				});
				if (!coach) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Entrenador no encontrado",
					});
				}
			}

			// Create assignment
			const [assignment] = await db
				.insert(equipmentAssignmentTable)
				.values({
					organizationId: ctx.organization.id,
					equipmentId: input.equipmentId,
					athleteGroupId: input.athleteGroupId,
					trainingSessionId: input.trainingSessionId,
					coachId: input.coachId,
					quantity: input.quantity,
					expectedReturnAt: input.expectedReturnAt,
					notes: input.notes,
					assignedBy: ctx.user.id,
				})
				.returning();

			// Update available quantity
			await db
				.update(trainingEquipmentTable)
				.set({
					availableQuantity: equipment.availableQuantity - input.quantity,
					status:
						equipment.availableQuantity - input.quantity === 0
							? TrainingEquipmentStatus.inUse
							: equipment.status,
				})
				.where(eq(trainingEquipmentTable.id, input.equipmentId));

			return assignment;
		}),

	// Return assignment
	returnAssignment: protectedOrganizationProcedure
		.input(returnAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			const assignment = await db.query.equipmentAssignmentTable.findFirst({
				where: and(
					eq(equipmentAssignmentTable.id, input.id),
					eq(equipmentAssignmentTable.organizationId, ctx.organization.id),
				),
			});

			if (!assignment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asignación no encontrada",
				});
			}

			if (assignment.returnedAt) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "El equipamiento ya fue devuelto",
				});
			}

			// Update assignment
			const [updated] = await db
				.update(equipmentAssignmentTable)
				.set({
					returnedAt: new Date(),
					notes: input.notes
						? `${assignment.notes ?? ""}\nDevolución: ${input.notes}`.trim()
						: assignment.notes,
				})
				.where(eq(equipmentAssignmentTable.id, input.id))
				.returning();

			// Update equipment available quantity
			const equipment = await db.query.trainingEquipmentTable.findFirst({
				where: eq(trainingEquipmentTable.id, assignment.equipmentId),
			});

			if (equipment) {
				const newAvailable = equipment.availableQuantity + assignment.quantity;
				await db
					.update(trainingEquipmentTable)
					.set({
						availableQuantity: newAvailable,
						status:
							newAvailable === equipment.totalQuantity
								? TrainingEquipmentStatus.available
								: equipment.status,
					})
					.where(eq(trainingEquipmentTable.id, assignment.equipmentId));
			}

			return updated;
		}),

	// Delete assignment
	deleteAssignment: protectedOrganizationProcedure
		.input(deleteAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			const assignment = await db.query.equipmentAssignmentTable.findFirst({
				where: and(
					eq(equipmentAssignmentTable.id, input.id),
					eq(equipmentAssignmentTable.organizationId, ctx.organization.id),
				),
			});

			if (!assignment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Asignación no encontrada",
				});
			}

			// If not returned, restore quantity
			if (!assignment.returnedAt) {
				const equipment = await db.query.trainingEquipmentTable.findFirst({
					where: eq(trainingEquipmentTable.id, assignment.equipmentId),
				});

				if (equipment) {
					const newAvailable =
						equipment.availableQuantity + assignment.quantity;
					await db
						.update(trainingEquipmentTable)
						.set({
							availableQuantity: newAvailable,
							status:
								newAvailable === equipment.totalQuantity
									? TrainingEquipmentStatus.available
									: equipment.status,
						})
						.where(eq(trainingEquipmentTable.id, assignment.equipmentId));
				}
			}

			await db
				.delete(equipmentAssignmentTable)
				.where(eq(equipmentAssignmentTable.id, input.id));

			return { success: true };
		}),

	// ============================================================================
	// MAINTENANCE PROCEDURES
	// ============================================================================

	// List maintenance records
	listMaintenance: protectedOrganizationProcedure
		.input(listMaintenanceSchema)
		.query(async ({ ctx, input }) => {
			const equipment = await db.query.trainingEquipmentTable.findFirst({
				where: and(
					eq(trainingEquipmentTable.id, input.equipmentId),
					eq(trainingEquipmentTable.organizationId, ctx.organization.id),
				),
			});

			if (!equipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Equipamiento no encontrado",
				});
			}

			const records = await db.query.equipmentMaintenanceTable.findMany({
				where: eq(equipmentMaintenanceTable.equipmentId, input.equipmentId),
				limit: input.limit,
				orderBy: desc(equipmentMaintenanceTable.performedAt),
				with: {
					performedByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			return records;
		}),

	// Create maintenance record
	createMaintenance: protectedOrganizationProcedure
		.input(createMaintenanceSchema)
		.mutation(async ({ ctx, input }) => {
			const equipment = await db.query.trainingEquipmentTable.findFirst({
				where: and(
					eq(trainingEquipmentTable.id, input.equipmentId),
					eq(trainingEquipmentTable.organizationId, ctx.organization.id),
				),
			});

			if (!equipment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Equipamiento no encontrado",
				});
			}

			const performedAt = input.performedAt ?? new Date();

			// Create maintenance record
			const [record] = await db
				.insert(equipmentMaintenanceTable)
				.values({
					equipmentId: input.equipmentId,
					maintenanceType: input.maintenanceType,
					description: input.description,
					cost: input.cost,
					currency: input.currency,
					previousCondition: equipment.condition,
					newCondition: input.newCondition ?? equipment.condition,
					performedAt,
					notes: input.notes,
					performedBy: ctx.user.id,
				})
				.returning();

			// Update equipment with new maintenance date and condition
			const updateData: {
				lastMaintenanceDate: Date;
				condition?: EquipmentCondition;
				status?: TrainingEquipmentStatus;
			} = {
				lastMaintenanceDate: performedAt,
			};

			if (input.newCondition) {
				updateData.condition = input.newCondition;
			}

			// If equipment was in maintenance status, set back to available
			if (equipment.status === TrainingEquipmentStatus.maintenance) {
				updateData.status = TrainingEquipmentStatus.available;
			}

			await db
				.update(trainingEquipmentTable)
				.set(updateData)
				.where(eq(trainingEquipmentTable.id, input.equipmentId));

			return record;
		}),
});
