import { TRPCError } from "@trpc/server";
import {
	and,
	desc,
	eq,
	gte,
	ilike,
	isNotNull,
	lte,
	ne,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	EquipmentAuditStatus,
	EquipmentCountStatus,
} from "@/lib/db/schema/enums";
import {
	equipmentInventoryAuditTable,
	equipmentInventoryCountTable,
	locationTable,
	trainingEquipmentTable,
} from "@/lib/db/schema/tables";
import {
	approveAdjustmentSchema,
	batchRecordCountsSchema,
	bulkApproveAdjustmentsSchema,
	cancelAuditSchema,
	completeAuditSchema,
	createAuditSchema,
	deleteAuditSchema,
	getAuditSchema,
	getCountSchema,
	listAuditsSchema,
	listCountsSchema,
	recordCountSchema,
	rejectAdjustmentSchema,
	skipCountSchema,
	startAuditSchema,
	updateAuditSchema,
	verifyCountSchema,
} from "@/schemas/organization-equipment-audit-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationEquipmentAuditRouter = createTRPCRouter({
	// ============================================================================
	// AUDIT PROCEDURES
	// ============================================================================

	// List audits with filtering
	list: protectedOrganizationProcedure
		.input(listAuditsSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(equipmentInventoryAuditTable.organizationId, ctx.organization.id),
			];

			if (input.status) {
				conditions.push(eq(equipmentInventoryAuditTable.status, input.status));
			}

			if (input.auditType) {
				conditions.push(
					eq(equipmentInventoryAuditTable.auditType, input.auditType),
				);
			}

			if (input.fromDate) {
				conditions.push(
					gte(equipmentInventoryAuditTable.scheduledDate, input.fromDate),
				);
			}

			if (input.toDate) {
				conditions.push(
					lte(equipmentInventoryAuditTable.scheduledDate, input.toDate),
				);
			}

			const audits = await db.query.equipmentInventoryAuditTable.findMany({
				where: and(...conditions),
				orderBy: desc(equipmentInventoryAuditTable.scheduledDate),
				limit: input.limit,
				offset: input.offset,
				with: {
					location: {
						columns: { id: true, name: true },
					},
					createdByUser: {
						columns: { id: true, name: true },
					},
					performedByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			return audits;
		}),

	// Get single audit with counts
	get: protectedOrganizationProcedure
		.input(getAuditSchema)
		.query(async ({ ctx, input }) => {
			const audit = await db.query.equipmentInventoryAuditTable.findFirst({
				where: and(
					eq(equipmentInventoryAuditTable.id, input.id),
					eq(equipmentInventoryAuditTable.organizationId, ctx.organization.id),
				),
				with: {
					location: true,
					createdByUser: {
						columns: { id: true, name: true },
					},
					performedByUser: {
						columns: { id: true, name: true },
					},
					approvedByUser: {
						columns: { id: true, name: true },
					},
					counts: {
						with: {
							equipment: {
								columns: {
									id: true,
									name: true,
									category: true,
									totalQuantity: true,
									condition: true,
								},
							},
							countedByUser: {
								columns: { id: true, name: true },
							},
						},
						orderBy: desc(equipmentInventoryCountTable.createdAt),
					},
				},
			});

			if (!audit) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Auditoría no encontrada",
				});
			}

			return audit;
		}),

	// Create new audit
	create: protectedOrganizationProcedure
		.input(createAuditSchema)
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

			const [audit] = await db
				.insert(equipmentInventoryAuditTable)
				.values({
					organizationId: ctx.organization.id,
					title: input.title,
					scheduledDate: input.scheduledDate,
					auditType: input.auditType,
					categoryFilter: input.categoryFilter,
					locationId: input.locationId,
					notes: input.notes,
					createdBy: ctx.user.id,
				})
				.returning();

			if (!audit) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Error al crear la auditoría",
				});
			}

			return audit;
		}),

	// Update audit (only if scheduled)
	update: protectedOrganizationProcedure
		.input(updateAuditSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const existing = await db.query.equipmentInventoryAuditTable.findFirst({
				where: and(
					eq(equipmentInventoryAuditTable.id, id),
					eq(equipmentInventoryAuditTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Auditoría no encontrada",
				});
			}

			if (existing.status !== EquipmentAuditStatus.scheduled) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Solo se pueden editar auditorías programadas",
				});
			}

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
				.update(equipmentInventoryAuditTable)
				.set(data)
				.where(eq(equipmentInventoryAuditTable.id, id))
				.returning();

			return updated;
		}),

	// Delete audit (only if scheduled)
	delete: protectedOrganizationProcedure
		.input(deleteAuditSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.equipmentInventoryAuditTable.findFirst({
				where: and(
					eq(equipmentInventoryAuditTable.id, input.id),
					eq(equipmentInventoryAuditTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Auditoría no encontrada",
				});
			}

			if (existing.status !== EquipmentAuditStatus.scheduled) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Solo se pueden eliminar auditorías programadas",
				});
			}

			await db
				.delete(equipmentInventoryAuditTable)
				.where(eq(equipmentInventoryAuditTable.id, input.id));

			return { success: true };
		}),

	// Start an audit - generates count items for all equipment
	start: protectedOrganizationProcedure
		.input(startAuditSchema)
		.mutation(async ({ ctx, input }) => {
			const audit = await db.query.equipmentInventoryAuditTable.findFirst({
				where: and(
					eq(equipmentInventoryAuditTable.id, input.id),
					eq(equipmentInventoryAuditTable.organizationId, ctx.organization.id),
				),
			});

			if (!audit) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Auditoría no encontrada",
				});
			}

			if (audit.status !== EquipmentAuditStatus.scheduled) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Solo se pueden iniciar auditorías programadas",
				});
			}

			// Build conditions for equipment query
			const equipmentConditions: SQL[] = [
				eq(trainingEquipmentTable.organizationId, ctx.organization.id),
				eq(trainingEquipmentTable.isActive, true),
			];

			if (audit.categoryFilter) {
				equipmentConditions.push(
					eq(trainingEquipmentTable.category, audit.categoryFilter),
				);
			}

			if (audit.locationId) {
				equipmentConditions.push(
					eq(trainingEquipmentTable.locationId, audit.locationId),
				);
			}

			// Get equipment to audit
			const equipment = await db.query.trainingEquipmentTable.findMany({
				where: and(...equipmentConditions),
			});

			if (equipment.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"No hay equipamiento para auditar con los filtros seleccionados",
				});
			}

			// Create count items for each equipment
			await db.insert(equipmentInventoryCountTable).values(
				equipment.map((e) => ({
					auditId: audit.id,
					equipmentId: e.id,
					expectedQuantity: e.totalQuantity,
					status: EquipmentCountStatus.pending,
				})),
			);

			// Calculate totals
			const totalExpectedQuantity = equipment.reduce(
				(sum, e) => sum + e.totalQuantity,
				0,
			);

			// Update audit status
			const [updated] = await db
				.update(equipmentInventoryAuditTable)
				.set({
					status: EquipmentAuditStatus.inProgress,
					startedAt: new Date(),
					performedBy: ctx.user.id,
					totalItems: equipment.length,
					totalExpectedQuantity,
				})
				.where(eq(equipmentInventoryAuditTable.id, input.id))
				.returning();

			return updated;
		}),

	// Complete an audit
	complete: protectedOrganizationProcedure
		.input(completeAuditSchema)
		.mutation(async ({ ctx, input }) => {
			const audit = await db.query.equipmentInventoryAuditTable.findFirst({
				where: and(
					eq(equipmentInventoryAuditTable.id, input.id),
					eq(equipmentInventoryAuditTable.organizationId, ctx.organization.id),
				),
				with: {
					counts: true,
				},
			});

			if (!audit) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Auditoría no encontrada",
				});
			}

			if (audit.status !== EquipmentAuditStatus.inProgress) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Solo se pueden completar auditorías en curso",
				});
			}

			// Check if all items have been counted or skipped
			const pendingCounts = audit.counts.filter(
				(c) => c.status === EquipmentCountStatus.pending,
			);

			if (pendingCounts.length > 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Hay ${pendingCounts.length} items pendientes de contar`,
				});
			}

			// Calculate summary
			const countedCounts = audit.counts.filter(
				(c) => c.status !== EquipmentCountStatus.skipped,
			);
			const withDiscrepancy = countedCounts.filter(
				(c) => c.discrepancy !== null && c.discrepancy !== 0,
			);
			const totalCounted = countedCounts.reduce(
				(sum, c) => sum + (c.countedQuantity ?? 0),
				0,
			);

			// Update audit
			const [updated] = await db
				.update(equipmentInventoryAuditTable)
				.set({
					status: EquipmentAuditStatus.completed,
					completedAt: new Date(),
					countedItems: countedCounts.length,
					itemsWithDiscrepancy: withDiscrepancy.length,
					totalCountedQuantity: totalCounted,
					notes: input.notes
						? `${audit.notes ?? ""}\n\nNotas al completar: ${input.notes}`.trim()
						: audit.notes,
				})
				.where(eq(equipmentInventoryAuditTable.id, input.id))
				.returning();

			return updated;
		}),

	// Cancel an audit
	cancel: protectedOrganizationProcedure
		.input(cancelAuditSchema)
		.mutation(async ({ ctx, input }) => {
			const audit = await db.query.equipmentInventoryAuditTable.findFirst({
				where: and(
					eq(equipmentInventoryAuditTable.id, input.id),
					eq(equipmentInventoryAuditTable.organizationId, ctx.organization.id),
				),
			});

			if (!audit) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Auditoría no encontrada",
				});
			}

			if (audit.status === EquipmentAuditStatus.completed) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No se puede cancelar una auditoría completada",
				});
			}

			const [updated] = await db
				.update(equipmentInventoryAuditTable)
				.set({
					status: EquipmentAuditStatus.cancelled,
					notes: input.reason
						? `${audit.notes ?? ""}\n\nRazón de cancelación: ${input.reason}`.trim()
						: audit.notes,
				})
				.where(eq(equipmentInventoryAuditTable.id, input.id))
				.returning();

			return updated;
		}),

	// ============================================================================
	// COUNT PROCEDURES
	// ============================================================================

	// List counts for an audit
	listCounts: protectedOrganizationProcedure
		.input(listCountsSchema)
		.query(async ({ ctx, input }) => {
			// First verify the audit belongs to the organization
			const audit = await db.query.equipmentInventoryAuditTable.findFirst({
				where: and(
					eq(equipmentInventoryAuditTable.id, input.auditId),
					eq(equipmentInventoryAuditTable.organizationId, ctx.organization.id),
				),
			});

			if (!audit) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Auditoría no encontrada",
				});
			}

			const conditions: SQL[] = [
				eq(equipmentInventoryCountTable.auditId, input.auditId),
			];

			if (input.status) {
				conditions.push(eq(equipmentInventoryCountTable.status, input.status));
			}

			if (input.hasDiscrepancy === true) {
				conditions.push(
					and(
						isNotNull(equipmentInventoryCountTable.discrepancy),
						ne(equipmentInventoryCountTable.discrepancy, 0),
					) ?? sql`true`,
				);
			} else if (input.hasDiscrepancy === false) {
				conditions.push(
					or(
						eq(equipmentInventoryCountTable.discrepancy, 0),
						sql`${equipmentInventoryCountTable.discrepancy} IS NULL`,
					) ?? sql`true`,
				);
			}

			// Get counts with equipment info
			const counts = await db.query.equipmentInventoryCountTable.findMany({
				where: and(...conditions),
				with: {
					equipment: {
						columns: {
							id: true,
							name: true,
							category: true,
							brand: true,
							model: true,
							totalQuantity: true,
							condition: true,
							storageLocation: true,
						},
						with: {
							location: {
								columns: { id: true, name: true },
							},
						},
					},
					countedByUser: {
						columns: { id: true, name: true },
					},
					adjustedByUser: {
						columns: { id: true, name: true },
					},
				},
				orderBy: desc(equipmentInventoryCountTable.createdAt),
			});

			// Filter by search if provided (in memory since we need to search equipment fields)
			if (input.search) {
				const searchLower = input.search.toLowerCase();
				return counts.filter(
					(c) =>
						c.equipment.name.toLowerCase().includes(searchLower) ||
						c.equipment.brand?.toLowerCase().includes(searchLower) ||
						c.equipment.model?.toLowerCase().includes(searchLower),
				);
			}

			return counts;
		}),

	// Get single count
	getCount: protectedOrganizationProcedure
		.input(getCountSchema)
		.query(async ({ ctx, input }) => {
			const count = await db.query.equipmentInventoryCountTable.findFirst({
				where: eq(equipmentInventoryCountTable.id, input.id),
				with: {
					audit: {
						columns: { id: true, organizationId: true, status: true },
					},
					equipment: true,
					countedByUser: {
						columns: { id: true, name: true },
					},
					adjustedByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			if (!count || count.audit.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Conteo no encontrado",
				});
			}

			return count;
		}),

	// Record a count for an item
	recordCount: protectedOrganizationProcedure
		.input(recordCountSchema)
		.mutation(async ({ ctx, input }) => {
			const count = await db.query.equipmentInventoryCountTable.findFirst({
				where: eq(equipmentInventoryCountTable.id, input.id),
				with: {
					audit: {
						columns: { id: true, organizationId: true, status: true },
					},
				},
			});

			if (!count || count.audit.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Conteo no encontrado",
				});
			}

			if (count.audit.status !== EquipmentAuditStatus.inProgress) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "La auditoría no está en curso",
				});
			}

			const discrepancy = input.countedQuantity - count.expectedQuantity;

			const [updated] = await db
				.update(equipmentInventoryCountTable)
				.set({
					countedQuantity: input.countedQuantity,
					discrepancy,
					observedCondition: input.observedCondition,
					status: EquipmentCountStatus.counted,
					notes: input.notes,
					countedBy: ctx.user.id,
					countedAt: new Date(),
				})
				.where(eq(equipmentInventoryCountTable.id, input.id))
				.returning();

			return updated;
		}),

	// Batch record counts
	batchRecordCounts: protectedOrganizationProcedure
		.input(batchRecordCountsSchema)
		.mutation(async ({ ctx, input }) => {
			const results = [];

			for (const countInput of input.counts) {
				const count = await db.query.equipmentInventoryCountTable.findFirst({
					where: eq(equipmentInventoryCountTable.id, countInput.id),
					with: {
						audit: {
							columns: { id: true, organizationId: true, status: true },
						},
					},
				});

				if (!count || count.audit.organizationId !== ctx.organization.id) {
					continue; // Skip invalid counts
				}

				if (count.audit.status !== EquipmentAuditStatus.inProgress) {
					continue; // Skip if audit not in progress
				}

				const discrepancy = countInput.countedQuantity - count.expectedQuantity;

				const [updated] = await db
					.update(equipmentInventoryCountTable)
					.set({
						countedQuantity: countInput.countedQuantity,
						discrepancy,
						observedCondition: countInput.observedCondition,
						status: EquipmentCountStatus.counted,
						notes: countInput.notes,
						countedBy: ctx.user.id,
						countedAt: new Date(),
					})
					.where(eq(equipmentInventoryCountTable.id, countInput.id))
					.returning();

				if (updated) {
					results.push(updated);
				}
			}

			return { updated: results.length };
		}),

	// Skip a count item
	skipCount: protectedOrganizationProcedure
		.input(skipCountSchema)
		.mutation(async ({ ctx, input }) => {
			const count = await db.query.equipmentInventoryCountTable.findFirst({
				where: eq(equipmentInventoryCountTable.id, input.id),
				with: {
					audit: {
						columns: { id: true, organizationId: true, status: true },
					},
				},
			});

			if (!count || count.audit.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Conteo no encontrado",
				});
			}

			if (count.audit.status !== EquipmentAuditStatus.inProgress) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "La auditoría no está en curso",
				});
			}

			const [updated] = await db
				.update(equipmentInventoryCountTable)
				.set({
					status: EquipmentCountStatus.skipped,
					notes: input.reason
						? `${count.notes ?? ""}\nOmitido: ${input.reason}`.trim()
						: count.notes,
					countedBy: ctx.user.id,
					countedAt: new Date(),
				})
				.where(eq(equipmentInventoryCountTable.id, input.id))
				.returning();

			return updated;
		}),

	// Verify a count (mark as verified after review)
	verifyCount: protectedOrganizationProcedure
		.input(verifyCountSchema)
		.mutation(async ({ ctx, input }) => {
			const count = await db.query.equipmentInventoryCountTable.findFirst({
				where: eq(equipmentInventoryCountTable.id, input.id),
				with: {
					audit: {
						columns: { id: true, organizationId: true, status: true },
					},
				},
			});

			if (!count || count.audit.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Conteo no encontrado",
				});
			}

			if (count.status !== EquipmentCountStatus.counted) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Solo se pueden verificar items contados",
				});
			}

			const [updated] = await db
				.update(equipmentInventoryCountTable)
				.set({
					status: EquipmentCountStatus.verified,
					notes: input.notes
						? `${count.notes ?? ""}\nVerificado: ${input.notes}`.trim()
						: count.notes,
				})
				.where(eq(equipmentInventoryCountTable.id, input.id))
				.returning();

			return updated;
		}),

	// Approve adjustment and update inventory
	approveAdjustment: protectedOrganizationProcedure
		.input(approveAdjustmentSchema)
		.mutation(async ({ ctx, input }) => {
			const count = await db.query.equipmentInventoryCountTable.findFirst({
				where: eq(equipmentInventoryCountTable.id, input.id),
				with: {
					audit: {
						columns: { id: true, organizationId: true, status: true },
					},
					equipment: true,
				},
			});

			if (!count || count.audit.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Conteo no encontrado",
				});
			}

			if (count.countedQuantity === null) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "El item no ha sido contado",
				});
			}

			if (count.discrepancy === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No hay discrepancia que ajustar",
				});
			}

			if (count.adjustmentApproved) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "El ajuste ya fue aprobado",
				});
			}

			// Update equipment quantity
			const newTotal = count.countedQuantity;
			const quantityDiff = newTotal - count.equipment.totalQuantity;

			await db
				.update(trainingEquipmentTable)
				.set({
					totalQuantity: newTotal,
					availableQuantity: sql`${trainingEquipmentTable.availableQuantity} + ${quantityDiff}`,
					// Update condition if observed condition differs
					...(count.observedCondition &&
						count.observedCondition !== count.equipment.condition && {
							condition: count.observedCondition,
						}),
				})
				.where(eq(trainingEquipmentTable.id, count.equipmentId));

			// Mark count as adjusted
			const [updated] = await db
				.update(equipmentInventoryCountTable)
				.set({
					status: EquipmentCountStatus.adjusted,
					adjustmentApproved: true,
					adjustmentReason: input.reason,
					adjustedBy: ctx.user.id,
					adjustedAt: new Date(),
				})
				.where(eq(equipmentInventoryCountTable.id, input.id))
				.returning();

			return updated;
		}),

	// Reject adjustment (keep system quantity)
	rejectAdjustment: protectedOrganizationProcedure
		.input(rejectAdjustmentSchema)
		.mutation(async ({ ctx, input }) => {
			const count = await db.query.equipmentInventoryCountTable.findFirst({
				where: eq(equipmentInventoryCountTable.id, input.id),
				with: {
					audit: {
						columns: { id: true, organizationId: true },
					},
				},
			});

			if (!count || count.audit.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Conteo no encontrado",
				});
			}

			const [updated] = await db
				.update(equipmentInventoryCountTable)
				.set({
					status: EquipmentCountStatus.verified,
					adjustmentApproved: false,
					adjustmentReason: input.reason
						? `Rechazado: ${input.reason}`
						: "Ajuste rechazado",
					adjustedBy: ctx.user.id,
					adjustedAt: new Date(),
				})
				.where(eq(equipmentInventoryCountTable.id, input.id))
				.returning();

			return updated;
		}),

	// Bulk approve adjustments
	bulkApproveAdjustments: protectedOrganizationProcedure
		.input(bulkApproveAdjustmentsSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify audit ownership
			const audit = await db.query.equipmentInventoryAuditTable.findFirst({
				where: and(
					eq(equipmentInventoryAuditTable.id, input.auditId),
					eq(equipmentInventoryAuditTable.organizationId, ctx.organization.id),
				),
			});

			if (!audit) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Auditoría no encontrada",
				});
			}

			let approvedCount = 0;

			for (const countId of input.countIds) {
				const count = await db.query.equipmentInventoryCountTable.findFirst({
					where: and(
						eq(equipmentInventoryCountTable.id, countId),
						eq(equipmentInventoryCountTable.auditId, input.auditId),
					),
					with: {
						equipment: true,
					},
				});

				if (
					!count ||
					count.countedQuantity === null ||
					count.discrepancy === 0 ||
					count.adjustmentApproved
				) {
					continue;
				}

				// Update equipment quantity
				const newTotal = count.countedQuantity;
				const quantityDiff = newTotal - count.equipment.totalQuantity;

				await db
					.update(trainingEquipmentTable)
					.set({
						totalQuantity: newTotal,
						availableQuantity: sql`${trainingEquipmentTable.availableQuantity} + ${quantityDiff}`,
						...(count.observedCondition &&
							count.observedCondition !== count.equipment.condition && {
								condition: count.observedCondition,
							}),
					})
					.where(eq(trainingEquipmentTable.id, count.equipmentId));

				// Mark count as adjusted
				await db
					.update(equipmentInventoryCountTable)
					.set({
						status: EquipmentCountStatus.adjusted,
						adjustmentApproved: true,
						adjustmentReason: input.reason,
						adjustedBy: ctx.user.id,
						adjustedAt: new Date(),
					})
					.where(eq(equipmentInventoryCountTable.id, countId));

				approvedCount++;
			}

			return { approved: approvedCount };
		}),

	// ============================================================================
	// SUMMARY PROCEDURES
	// ============================================================================

	// Get audit summary statistics
	getSummary: protectedOrganizationProcedure
		.input(getAuditSchema)
		.query(async ({ ctx, input }) => {
			const audit = await db.query.equipmentInventoryAuditTable.findFirst({
				where: and(
					eq(equipmentInventoryAuditTable.id, input.id),
					eq(equipmentInventoryAuditTable.organizationId, ctx.organization.id),
				),
				with: {
					counts: true,
				},
			});

			if (!audit) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Auditoría no encontrada",
				});
			}

			const counts = audit.counts;

			const pending = counts.filter(
				(c) => c.status === EquipmentCountStatus.pending,
			).length;
			const counted = counts.filter(
				(c) => c.status === EquipmentCountStatus.counted,
			).length;
			const verified = counts.filter(
				(c) => c.status === EquipmentCountStatus.verified,
			).length;
			const adjusted = counts.filter(
				(c) => c.status === EquipmentCountStatus.adjusted,
			).length;
			const skipped = counts.filter(
				(c) => c.status === EquipmentCountStatus.skipped,
			).length;

			const withDiscrepancy = counts.filter(
				(c) => c.discrepancy !== null && c.discrepancy !== 0,
			);
			const positiveDiscrepancies = withDiscrepancy.filter(
				(c) => c.discrepancy! > 0,
			);
			const negativeDiscrepancies = withDiscrepancy.filter(
				(c) => c.discrepancy! < 0,
			);

			const totalExpected = counts.reduce(
				(sum, c) => sum + c.expectedQuantity,
				0,
			);
			const totalCounted = counts.reduce(
				(sum, c) => sum + (c.countedQuantity ?? 0),
				0,
			);

			const pendingAdjustment = withDiscrepancy.filter(
				(c) =>
					!c.adjustmentApproved && c.status !== EquipmentCountStatus.adjusted,
			).length;

			return {
				totalItems: counts.length,
				byStatus: {
					pending,
					counted,
					verified,
					adjusted,
					skipped,
				},
				discrepancies: {
					total: withDiscrepancy.length,
					positive: positiveDiscrepancies.length,
					negative: negativeDiscrepancies.length,
					pendingAdjustment,
				},
				quantities: {
					expected: totalExpected,
					counted: totalCounted,
					difference: totalCounted - totalExpected,
				},
				progress:
					counts.length > 0
						? Math.round(((counts.length - pending) / counts.length) * 100)
						: 0,
			};
		}),
});
