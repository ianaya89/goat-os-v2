import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	EventBudgetStatus,
	EventChecklistStatus,
	EventInventoryStatus,
	EventMilestoneStatus,
	EventRiskStatus,
	EventTaskStatus,
} from "@/lib/db/schema/enums";
import {
	eventAgeCategoryTable,
	eventBudgetLineTable,
	eventChecklistTable,
	eventDiscountTable,
	eventInventoryTable,
	eventMilestoneTable,
	eventPricingTierTable,
	eventRiskTable,
	eventSponsorTable,
	eventStaffTable,
	eventTaskTable,
	eventTemplateTable,
	eventZoneTable,
	sportsEventTable,
} from "@/lib/db/schema/tables";
import {
	createEventFromTemplateSchema,
	createTemplateFromEventSchema,
	createTemplateSchema,
	deleteTemplateSchema,
	getTemplateSchema,
	listTemplatesSchema,
	type TemplateData,
	templateDataSchema,
	updateTemplateSchema,
} from "@/schemas/organization-event-template-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Aggregate staff into role requirements (without specific people)
 */
function aggregateStaffRoles(
	staff: (typeof eventStaffTable.$inferSelect)[],
): TemplateData["staffRoles"] {
	const roleMap = new Map<string, TemplateData["staffRoles"][number]>();

	for (const s of staff) {
		const key = `${s.role}-${s.roleTitle || ""}`;
		const existing = roleMap.get(key);
		if (existing) {
			existing.requiredCount++;
		} else {
			roleMap.set(key, {
				role: s.role,
				roleTitle: s.roleTitle,
				requiredCount: 1,
				notes: s.notes,
				specialSkills: s.specialSkills,
			});
		}
	}

	return Array.from(roleMap.values());
}

/**
 * Aggregate sponsors into tier templates
 */
function aggregateSponsorTiers(
	sponsors: (typeof eventSponsorTable.$inferSelect)[],
): TemplateData["sponsorTiers"] {
	const tierMap = new Map<string, TemplateData["sponsorTiers"][number]>();

	for (const s of sponsors) {
		if (!tierMap.has(s.tier)) {
			tierMap.set(s.tier, {
				tier: s.tier,
				minimumValue: s.sponsorshipValue,
				currency: s.currency,
				defaultBenefits: [],
			});
		} else {
			const existing = tierMap.get(s.tier)!;
			existing.minimumValue = Math.min(
				existing.minimumValue,
				s.sponsorshipValue,
			);
		}
	}

	return Array.from(tierMap.values());
}

/**
 * Calculate days offset from event start date
 */
function calculateDaysOffset(
	eventStartDate: Date,
	date: Date | null,
): number | null {
	if (!date) return null;
	const diffTime = eventStartDate.getTime() - new Date(date).getTime();
	return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate date from days offset
 */
function calculateDateFromOffset(
	eventStartDate: Date,
	daysOffset: number | null | undefined,
): Date | null {
	if (daysOffset === null || daysOffset === undefined) return null;
	const date = new Date(eventStartDate);
	date.setDate(date.getDate() - daysOffset);
	return date;
}

// ============================================================================
// ROUTER
// ============================================================================

export const organizationEventTemplateRouter = createTRPCRouter({
	// List all templates for organization
	list: protectedOrganizationProcedure
		.input(listTemplatesSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(eventTemplateTable.organizationId, ctx.organization.id),
			];

			if (!input.includeInactive) {
				conditions.push(eq(eventTemplateTable.isActive, true));
			}

			if (input.category) {
				conditions.push(eq(eventTemplateTable.category, input.category));
			}

			if (input.eventType) {
				conditions.push(eq(eventTemplateTable.eventType, input.eventType));
			}

			if (input.query) {
				conditions.push(
					or(
						ilike(eventTemplateTable.name, `%${input.query}%`),
						ilike(eventTemplateTable.description, `%${input.query}%`),
					)!,
				);
			}

			const whereCondition = and(...conditions);

			// Determine sort column
			const sortColumn = {
				name: eventTemplateTable.name,
				category: eventTemplateTable.category,
				eventType: eventTemplateTable.eventType,
				usageCount: eventTemplateTable.usageCount,
				createdAt: eventTemplateTable.createdAt,
				updatedAt: eventTemplateTable.updatedAt,
			}[input.sortBy];

			const sortFn = input.sortOrder === "asc" ? asc : desc;

			const [templates, countResult] = await Promise.all([
				db.query.eventTemplateTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: [sortFn(sortColumn)],
					with: {
						sourceEvent: {
							columns: { id: true, title: true, slug: true },
						},
						createdByUser: {
							columns: { id: true, name: true, image: true },
						},
					},
				}),
				db
					.select({ count: count() })
					.from(eventTemplateTable)
					.where(whereCondition),
			]);

			return {
				templates,
				total: countResult[0]?.count ?? 0,
			};
		}),

	// Get single template with full data
	get: protectedOrganizationProcedure
		.input(getTemplateSchema)
		.query(async ({ ctx, input }) => {
			const template = await db.query.eventTemplateTable.findFirst({
				where: and(
					eq(eventTemplateTable.id, input.id),
					eq(eventTemplateTable.organizationId, ctx.organization.id),
				),
				with: {
					sourceEvent: {
						columns: { id: true, title: true, slug: true },
					},
					createdByUser: {
						columns: { id: true, name: true, image: true },
					},
				},
			});

			if (!template) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found",
				});
			}

			// Parse templateData JSON
			const templateData = template.templateData
				? templateDataSchema.parse(JSON.parse(template.templateData))
				: {};

			return {
				...template,
				templateData,
			};
		}),

	// Create template from scratch
	create: protectedOrganizationProcedure
		.input(createTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			// Check for duplicate name
			const existing = await db.query.eventTemplateTable.findFirst({
				where: and(
					eq(eventTemplateTable.organizationId, ctx.organization.id),
					eq(eventTemplateTable.name, input.name),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A template with this name already exists",
				});
			}

			const { templateData, acceptedPaymentMethods, ...restInput } = input;

			const [template] = await db
				.insert(eventTemplateTable)
				.values({
					organizationId: ctx.organization.id,
					...restInput,
					acceptedPaymentMethods: acceptedPaymentMethods
						? JSON.stringify(acceptedPaymentMethods)
						: null,
					templateData: JSON.stringify(templateData),
					createdBy: ctx.user.id,
				})
				.returning();

			return template;
		}),

	// Update template
	update: protectedOrganizationProcedure
		.input(updateTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventTemplateTable.findFirst({
				where: and(
					eq(eventTemplateTable.id, input.id),
					eq(eventTemplateTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found",
				});
			}

			// Check for name conflict if changing name
			if (input.name && input.name !== existing.name) {
				const nameConflict = await db.query.eventTemplateTable.findFirst({
					where: and(
						eq(eventTemplateTable.organizationId, ctx.organization.id),
						eq(eventTemplateTable.name, input.name),
					),
				});
				if (nameConflict) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A template with this name already exists",
					});
				}
			}

			const { id, templateData, acceptedPaymentMethods, ...updateData } = input;

			const updateValues: Record<string, unknown> = { ...updateData };

			if (templateData !== undefined) {
				updateValues.templateData = JSON.stringify(templateData);
			}

			if (acceptedPaymentMethods !== undefined) {
				updateValues.acceptedPaymentMethods = acceptedPaymentMethods
					? JSON.stringify(acceptedPaymentMethods)
					: null;
			}

			const [updated] = await db
				.update(eventTemplateTable)
				.set(updateValues)
				.where(eq(eventTemplateTable.id, id))
				.returning();

			return updated;
		}),

	// Delete template
	delete: protectedOrganizationProcedure
		.input(deleteTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventTemplateTable.findFirst({
				where: and(
					eq(eventTemplateTable.id, input.id),
					eq(eventTemplateTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found",
				});
			}

			await db
				.delete(eventTemplateTable)
				.where(eq(eventTemplateTable.id, input.id));

			return { success: true };
		}),

	// Create template from existing event
	createFromEvent: protectedOrganizationProcedure
		.input(createTemplateFromEventSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify event belongs to organization and get all related data
			const event = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.id, input.eventId),
					eq(sportsEventTable.organizationId, ctx.organization.id),
				),
				with: {
					ageCategories: true,
					pricingTiers: true,
				},
			});

			if (!event) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
			}

			// Check for duplicate template name
			const existingTemplate = await db.query.eventTemplateTable.findFirst({
				where: and(
					eq(eventTemplateTable.organizationId, ctx.organization.id),
					eq(eventTemplateTable.name, input.name),
				),
			});

			if (existingTemplate) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A template with this name already exists",
				});
			}

			// Fetch all related event data in parallel
			const [
				discounts,
				checklists,
				tasks,
				staff,
				budgetLines,
				milestones,
				zones,
				inventory,
				risks,
				sponsors,
			] = await Promise.all([
				db.query.eventDiscountTable.findMany({
					where: eq(eventDiscountTable.eventId, input.eventId),
				}),
				db.query.eventChecklistTable.findMany({
					where: eq(eventChecklistTable.eventId, input.eventId),
				}),
				db.query.eventTaskTable.findMany({
					where: eq(eventTaskTable.eventId, input.eventId),
				}),
				db.query.eventStaffTable.findMany({
					where: eq(eventStaffTable.eventId, input.eventId),
				}),
				db.query.eventBudgetLineTable.findMany({
					where: eq(eventBudgetLineTable.eventId, input.eventId),
				}),
				db.query.eventMilestoneTable.findMany({
					where: eq(eventMilestoneTable.eventId, input.eventId),
				}),
				db.query.eventZoneTable.findMany({
					where: eq(eventZoneTable.eventId, input.eventId),
				}),
				db.query.eventInventoryTable.findMany({
					where: eq(eventInventoryTable.eventId, input.eventId),
				}),
				db.query.eventRiskTable.findMany({
					where: eq(eventRiskTable.eventId, input.eventId),
				}),
				db.query.eventSponsorTable.findMany({
					where: eq(eventSponsorTable.eventId, input.eventId),
				}),
			]);

			const eventStartDate = new Date(event.startDate);

			// Build template data
			const templateData: TemplateData = {
				ageCategories: event.ageCategories.map((ac) => ({
					ageCategoryId: ac.ageCategoryId,
					maxCapacity: ac.maxCapacity,
				})),
				pricingTiers: event.pricingTiers.map((tier) => ({
					name: tier.name,
					description: tier.description,
					tierType: tier.tierType,
					price: tier.price,
					currency: tier.currency,
					validFromDaysBeforeEvent: calculateDaysOffset(
						eventStartDate,
						tier.validFrom,
					),
					validUntilDaysBeforeEvent: calculateDaysOffset(
						eventStartDate,
						tier.validUntil,
					),
					capacityStart: tier.capacityStart,
					capacityEnd: tier.capacityEnd,
					ageCategoryId: tier.ageCategoryId,
					sortOrder: tier.sortOrder,
				})),
				discounts: discounts.map((d) => ({
					name: d.name,
					description: d.description,
					discountMode: d.discountMode,
					code: d.code,
					discountValueType: d.discountValueType,
					discountValue: d.discountValue,
					maxUses: d.maxUses,
					maxUsesPerUser: d.maxUsesPerUser,
					validFromDaysBeforeEvent: calculateDaysOffset(
						eventStartDate,
						d.validFrom,
					),
					validUntilDaysBeforeEvent: calculateDaysOffset(
						eventStartDate,
						d.validUntil,
					),
					minPurchaseAmount: d.minPurchaseAmount,
					priority: d.priority,
				})),
				checklists: checklists.map((c) => ({
					title: c.title,
					description: c.description,
					category: c.category,
					dueDateDaysOffset: calculateDaysOffset(eventStartDate, c.dueDate),
					sortOrder: c.sortOrder,
				})),
				tasks: tasks.map((t) => ({
					title: t.title,
					description: t.description,
					status: EventTaskStatus.todo, // Reset to todo for template
					priority: t.priority,
					dueDateDaysOffset: calculateDaysOffset(eventStartDate, t.dueDate),
					tags: t.tags ? JSON.parse(t.tags) : null,
					estimatedHours: t.estimatedHours,
					columnPosition: t.columnPosition,
				})),
				staffRoles: aggregateStaffRoles(staff),
				budgetLines: budgetLines.map((b) => ({
					name: b.name,
					description: b.description,
					categoryId: b.categoryId,
					plannedAmount: b.plannedAmount,
					currency: b.currency,
					isRevenue: b.isRevenue,
					notes: b.notes,
				})),
				milestones: milestones.map((m) => ({
					title: m.title,
					description: m.description,
					targetDateDaysOffset:
						calculateDaysOffset(eventStartDate, m.targetDate) ?? 0,
					color: m.color,
					notes: m.notes,
				})),
				zones: zones.map((z) => ({
					name: z.name,
					description: z.description,
					zoneType: z.zoneType,
					capacity: z.capacity,
					locationDescription: z.locationDescription,
					color: z.color,
					notes: z.notes,
				})),
				inventory: inventory.map((i) => ({
					name: i.name,
					description: i.description,
					category: i.category,
					quantityNeeded: i.quantityNeeded,
					source: i.source,
					unitCost: i.unitCost,
					storageLocation: i.storageLocation,
					notes: i.notes,
				})),
				risks: risks.map((r) => ({
					title: r.title,
					description: r.description,
					category: r.category,
					severity: r.severity,
					probability: r.probability,
					mitigationPlan: r.mitigationPlan,
					mitigationCost: r.mitigationCost,
					contingencyPlan: r.contingencyPlan,
					triggerConditions: r.triggerConditions,
					potentialImpact: r.potentialImpact,
					notes: r.notes,
				})),
				sponsorTiers: aggregateSponsorTiers(sponsors),
			};

			// Calculate default duration
			const durationMs = event.endDate.getTime() - event.startDate.getTime();
			const defaultDurationDays = Math.max(
				1,
				Math.ceil(durationMs / (1000 * 60 * 60 * 24)),
			);

			// Create the template
			const [template] = await db
				.insert(eventTemplateTable)
				.values({
					organizationId: ctx.organization.id,
					name: input.name,
					description: input.description,
					category: input.category,
					eventType: event.eventType,
					defaultTitle: event.title,
					defaultDescription: event.description,
					defaultDurationDays,
					maxCapacity: event.maxCapacity,
					enableWaitlist: event.enableWaitlist,
					maxWaitlistSize: event.maxWaitlistSize,
					allowPublicRegistration: event.allowPublicRegistration,
					allowEarlyAccessForMembers: event.allowEarlyAccessForMembers,
					memberEarlyAccessDays: event.memberEarlyAccessDays,
					requiresApproval: event.requiresApproval,
					currency: event.currency,
					acceptedPaymentMethods: event.acceptedPaymentMethods,
					contactEmail: event.contactEmail,
					contactPhone: event.contactPhone,
					coverImageUrl: event.coverImageUrl,
					sourceEventId: event.id,
					templateData: JSON.stringify(templateData),
					createdBy: ctx.user.id,
				})
				.returning();

			return template;
		}),

	// Create event from template
	createEventFromTemplate: protectedOrganizationProcedure
		.input(createEventFromTemplateSchema)
		.mutation(async ({ ctx, input }) => {
			// Get template
			const template = await db.query.eventTemplateTable.findFirst({
				where: and(
					eq(eventTemplateTable.id, input.templateId),
					eq(eventTemplateTable.organizationId, ctx.organization.id),
				),
			});

			if (!template) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found",
				});
			}

			// Check slug uniqueness
			const existingSlug = await db.query.sportsEventTable.findFirst({
				where: and(
					eq(sportsEventTable.organizationId, ctx.organization.id),
					eq(sportsEventTable.slug, input.slug),
				),
			});

			if (existingSlug) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "An event with this slug already exists",
				});
			}

			// Parse template data
			const templateData = template.templateData
				? templateDataSchema.parse(JSON.parse(template.templateData))
				: ({} as TemplateData);

			const startDate = new Date(input.startDate);

			// Create the event in a transaction
			const result = await db.transaction(async (tx) => {
				// Create main event
				const [event] = await tx
					.insert(sportsEventTable)
					.values({
						organizationId: ctx.organization.id,
						title: input.title,
						slug: input.slug,
						description:
							input.overrideDescription ?? template.defaultDescription,
						eventType: template.eventType,
						status: "draft",
						startDate: input.startDate,
						endDate: input.endDate,
						locationId: input.locationId,
						maxCapacity: input.overrideMaxCapacity ?? template.maxCapacity,
						enableWaitlist: template.enableWaitlist,
						maxWaitlistSize: template.maxWaitlistSize,
						allowPublicRegistration: template.allowPublicRegistration,
						allowEarlyAccessForMembers: template.allowEarlyAccessForMembers,
						memberEarlyAccessDays: template.memberEarlyAccessDays,
						requiresApproval: template.requiresApproval,
						currency: template.currency,
						acceptedPaymentMethods: template.acceptedPaymentMethods,
						contactEmail: template.contactEmail,
						contactPhone: template.contactPhone,
						coverImageUrl: template.coverImageUrl,
						createdBy: ctx.user.id,
					})
					.returning();

				if (!event) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create event",
					});
				}

				// Create age categories
				if (
					templateData.ageCategories &&
					templateData.ageCategories.length > 0
				) {
					await tx.insert(eventAgeCategoryTable).values(
						templateData.ageCategories.map((ac) => ({
							eventId: event.id,
							ageCategoryId: ac.ageCategoryId,
							maxCapacity: ac.maxCapacity,
						})),
					);
				}

				// Create pricing tiers
				if (templateData.pricingTiers && templateData.pricingTiers.length > 0) {
					await tx.insert(eventPricingTierTable).values(
						templateData.pricingTiers.map((tier) => ({
							eventId: event.id,
							name: tier.name,
							description: tier.description,
							tierType: tier.tierType,
							price: tier.price,
							currency: tier.currency,
							validFrom: calculateDateFromOffset(
								startDate,
								tier.validFromDaysBeforeEvent,
							),
							validUntil: calculateDateFromOffset(
								startDate,
								tier.validUntilDaysBeforeEvent,
							),
							capacityStart: tier.capacityStart,
							capacityEnd: tier.capacityEnd,
							ageCategoryId: tier.ageCategoryId,
							sortOrder: tier.sortOrder,
							isActive: true,
						})),
					);
				}

				// Create discounts
				if (templateData.discounts && templateData.discounts.length > 0) {
					await tx.insert(eventDiscountTable).values(
						templateData.discounts.map((d) => ({
							eventId: event.id,
							organizationId: ctx.organization.id,
							name: d.name,
							description: d.description,
							discountMode: d.discountMode,
							code: d.code,
							discountValueType: d.discountValueType,
							discountValue: d.discountValue,
							maxUses: d.maxUses,
							maxUsesPerUser: d.maxUsesPerUser,
							validFrom: calculateDateFromOffset(
								startDate,
								d.validFromDaysBeforeEvent,
							),
							validUntil: calculateDateFromOffset(
								startDate,
								d.validUntilDaysBeforeEvent,
							),
							minPurchaseAmount: d.minPurchaseAmount,
							priority: d.priority,
							isActive: true,
						})),
					);
				}

				// Create checklists
				if (templateData.checklists && templateData.checklists.length > 0) {
					await tx.insert(eventChecklistTable).values(
						templateData.checklists.map((c) => ({
							eventId: event.id,
							organizationId: ctx.organization.id,
							title: c.title,
							description: c.description,
							category: c.category,
							dueDate: calculateDateFromOffset(startDate, c.dueDateDaysOffset),
							sortOrder: c.sortOrder,
							status: EventChecklistStatus.pending,
							createdBy: ctx.user.id,
						})),
					);
				}

				// Create tasks
				if (templateData.tasks && templateData.tasks.length > 0) {
					await tx.insert(eventTaskTable).values(
						templateData.tasks.map((t) => ({
							eventId: event.id,
							organizationId: ctx.organization.id,
							title: t.title,
							description: t.description,
							status: EventTaskStatus.todo,
							priority: t.priority,
							dueDate: calculateDateFromOffset(startDate, t.dueDateDaysOffset),
							tags: t.tags ? JSON.stringify(t.tags) : null,
							estimatedHours: t.estimatedHours,
							columnPosition: t.columnPosition,
							createdBy: ctx.user.id,
						})),
					);
				}

				// Create budget lines
				if (templateData.budgetLines && templateData.budgetLines.length > 0) {
					await tx.insert(eventBudgetLineTable).values(
						templateData.budgetLines.map((b) => ({
							eventId: event.id,
							organizationId: ctx.organization.id,
							name: b.name,
							description: b.description,
							categoryId: b.categoryId,
							plannedAmount: b.plannedAmount,
							currency: b.currency,
							isRevenue: b.isRevenue,
							notes: b.notes,
							status: EventBudgetStatus.planned,
							createdBy: ctx.user.id,
						})),
					);
				}

				// Create milestones
				if (templateData.milestones && templateData.milestones.length > 0) {
					await tx.insert(eventMilestoneTable).values(
						templateData.milestones.map((m) => ({
							eventId: event.id,
							organizationId: ctx.organization.id,
							title: m.title,
							description: m.description,
							targetDate: calculateDateFromOffset(
								startDate,
								m.targetDateDaysOffset,
							)!,
							color: m.color,
							notes: m.notes,
							status: EventMilestoneStatus.pending,
							createdBy: ctx.user.id,
						})),
					);
				}

				// Create zones
				if (templateData.zones && templateData.zones.length > 0) {
					await tx.insert(eventZoneTable).values(
						templateData.zones.map((z) => ({
							eventId: event.id,
							organizationId: ctx.organization.id,
							name: z.name,
							description: z.description,
							zoneType: z.zoneType,
							capacity: z.capacity,
							locationDescription: z.locationDescription,
							color: z.color,
							notes: z.notes,
							isActive: true,
							createdBy: ctx.user.id,
						})),
					);
				}

				// Create inventory items
				if (templateData.inventory && templateData.inventory.length > 0) {
					await tx.insert(eventInventoryTable).values(
						templateData.inventory.map((i) => ({
							eventId: event.id,
							organizationId: ctx.organization.id,
							name: i.name,
							description: i.description,
							category: i.category,
							quantityNeeded: i.quantityNeeded,
							quantityAvailable: 0,
							source: i.source,
							unitCost: i.unitCost,
							storageLocation: i.storageLocation,
							notes: i.notes,
							status: EventInventoryStatus.needed,
							createdBy: ctx.user.id,
						})),
					);
				}

				// Create risks
				if (templateData.risks && templateData.risks.length > 0) {
					await tx.insert(eventRiskTable).values(
						templateData.risks.map((r) => ({
							eventId: event.id,
							organizationId: ctx.organization.id,
							title: r.title,
							description: r.description,
							category: r.category,
							severity: r.severity,
							probability: r.probability,
							mitigationPlan: r.mitigationPlan,
							mitigationCost: r.mitigationCost,
							contingencyPlan: r.contingencyPlan,
							triggerConditions: r.triggerConditions,
							potentialImpact: r.potentialImpact,
							notes: r.notes,
							status: EventRiskStatus.identified,
							createdBy: ctx.user.id,
						})),
					);
				}

				// Increment template usage count
				await tx
					.update(eventTemplateTable)
					.set({ usageCount: template.usageCount + 1 })
					.where(eq(eventTemplateTable.id, template.id));

				return event;
			});

			return result;
		}),

	// Get template categories (for filtering)
	getCategories: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const templates = await db.query.eventTemplateTable.findMany({
			where: and(
				eq(eventTemplateTable.organizationId, ctx.organization.id),
				eq(eventTemplateTable.isActive, true),
			),
			columns: { category: true },
		});

		const categories = [
			...new Set(templates.map((t) => t.category).filter(Boolean)),
		];
		return categories as string[];
	}),
});
