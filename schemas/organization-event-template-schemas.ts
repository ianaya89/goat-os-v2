import { z } from "zod/v4";
import {
	DiscountMode,
	DiscountValueType,
	EventBudgetStatus,
	EventPaymentMethod,
	EventRiskProbability,
	EventRiskSeverity,
	EventSponsorTier,
	EventStaffRole,
	EventTaskPriority,
	EventTaskStatus,
	EventType,
	PricingTierType,
} from "@/lib/db/schema/enums";

// ============================================================================
// TEMPLATE DATA SUB-SCHEMAS
// ============================================================================

export const templateAgeCategorySchema = z.object({
	ageCategoryId: z.string().uuid(),
	maxCapacity: z.number().int().positive().optional().nullable(),
});

export const templatePricingTierSchema = z.object({
	name: z.string().trim().min(1).max(100),
	description: z.string().trim().max(500).optional().nullable(),
	tierType: z.nativeEnum(PricingTierType),
	price: z.number().int().min(0),
	currency: z.string().default("ARS"),
	validFromDaysBeforeEvent: z.number().int().optional().nullable(),
	validUntilDaysBeforeEvent: z.number().int().optional().nullable(),
	capacityStart: z.number().int().min(1).optional().nullable(),
	capacityEnd: z.number().int().min(1).optional().nullable(),
	ageCategoryId: z.string().uuid().optional().nullable(),
	sortOrder: z.number().int().default(0),
});

export const templateDiscountSchema = z.object({
	name: z.string().trim().min(1).max(100),
	description: z.string().trim().max(500).optional().nullable(),
	discountMode: z.nativeEnum(DiscountMode),
	code: z.string().trim().max(50).optional().nullable(),
	discountValueType: z.nativeEnum(DiscountValueType),
	discountValue: z.number().int().min(1),
	maxUses: z.number().int().min(1).optional().nullable(),
	maxUsesPerUser: z.number().int().min(1).optional().nullable(),
	validFromDaysBeforeEvent: z.number().int().optional().nullable(),
	validUntilDaysBeforeEvent: z.number().int().optional().nullable(),
	minPurchaseAmount: z.number().int().min(0).optional().nullable(),
	priority: z.number().int().default(0),
});

export const templateChecklistSchema = z.object({
	title: z.string().trim().min(1).max(500),
	description: z.string().trim().max(2000).optional().nullable(),
	category: z.string().trim().max(100).optional().nullable(),
	dueDateDaysOffset: z.number().int().optional().nullable(),
	sortOrder: z.number().int().default(0),
});

export const templateTaskSchema = z.object({
	title: z.string().trim().min(1).max(500),
	description: z.string().trim().max(5000).optional().nullable(),
	status: z.nativeEnum(EventTaskStatus).default(EventTaskStatus.todo),
	priority: z.nativeEnum(EventTaskPriority).default(EventTaskPriority.medium),
	dueDateDaysOffset: z.number().int().optional().nullable(),
	tags: z.array(z.string()).optional().nullable(),
	estimatedHours: z.number().int().positive().optional().nullable(),
	columnPosition: z.number().int().default(0),
});

export const templateStaffRoleSchema = z.object({
	role: z.nativeEnum(EventStaffRole),
	roleTitle: z.string().trim().max(200).optional().nullable(),
	requiredCount: z.number().int().min(1).default(1),
	notes: z.string().trim().max(2000).optional().nullable(),
	specialSkills: z.string().trim().max(1000).optional().nullable(),
});

export const templateBudgetLineSchema = z.object({
	name: z.string().trim().min(1).max(200),
	description: z.string().trim().max(2000).optional().nullable(),
	categoryId: z.string().uuid().optional().nullable(),
	plannedAmount: z.number().int().min(0).default(0),
	currency: z.string().default("ARS"),
	isRevenue: z.boolean().default(false),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const templateMilestoneSchema = z.object({
	title: z.string().trim().min(1).max(500),
	description: z.string().trim().max(2000).optional().nullable(),
	targetDateDaysOffset: z.number().int(),
	color: z.string().trim().max(50).optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const templateZoneSchema = z.object({
	name: z.string().trim().min(1).max(200),
	description: z.string().trim().max(2000).optional().nullable(),
	zoneType: z.string().trim().max(100).optional().nullable(),
	capacity: z.number().int().positive().optional().nullable(),
	locationDescription: z.string().trim().max(500).optional().nullable(),
	color: z.string().trim().max(50).optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const templateInventorySchema = z.object({
	name: z.string().trim().min(1).max(200),
	description: z.string().trim().max(2000).optional().nullable(),
	category: z.string().trim().max(100).optional().nullable(),
	quantityNeeded: z.number().int().positive().default(1),
	source: z.string().trim().max(100).optional().nullable(),
	unitCost: z.number().int().min(0).optional().nullable(),
	storageLocation: z.string().trim().max(200).optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const templateRiskSchema = z.object({
	title: z.string().trim().min(1).max(500),
	description: z.string().trim().max(5000).optional().nullable(),
	category: z.string().trim().max(100).optional().nullable(),
	severity: z.nativeEnum(EventRiskSeverity).default(EventRiskSeverity.medium),
	probability: z
		.nativeEnum(EventRiskProbability)
		.default(EventRiskProbability.possible),
	mitigationPlan: z.string().trim().max(5000).optional().nullable(),
	mitigationCost: z.number().int().min(0).optional().nullable(),
	contingencyPlan: z.string().trim().max(5000).optional().nullable(),
	triggerConditions: z.string().trim().max(2000).optional().nullable(),
	potentialImpact: z.string().trim().max(2000).optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const templateSponsorBenefitSchema = z.object({
	title: z.string().trim().min(1).max(200),
	description: z.string().trim().max(2000).optional().nullable(),
	quantity: z.number().int().min(1).default(1),
});

export const templateSponsorTierSchema = z.object({
	tier: z.nativeEnum(EventSponsorTier),
	minimumValue: z.number().int().min(0).default(0),
	currency: z.string().default("ARS"),
	defaultBenefits: z.array(templateSponsorBenefitSchema).default([]),
});

// ============================================================================
// FULL TEMPLATE DATA SCHEMA
// ============================================================================

export const templateDataSchema = z.object({
	ageCategories: z.array(templateAgeCategorySchema).default([]),
	pricingTiers: z.array(templatePricingTierSchema).default([]),
	discounts: z.array(templateDiscountSchema).default([]),
	checklists: z.array(templateChecklistSchema).default([]),
	tasks: z.array(templateTaskSchema).default([]),
	staffRoles: z.array(templateStaffRoleSchema).default([]),
	budgetLines: z.array(templateBudgetLineSchema).default([]),
	milestones: z.array(templateMilestoneSchema).default([]),
	zones: z.array(templateZoneSchema).default([]),
	inventory: z.array(templateInventorySchema).default([]),
	risks: z.array(templateRiskSchema).default([]),
	sponsorTiers: z.array(templateSponsorTierSchema).default([]),
});

export type TemplateData = z.infer<typeof templateDataSchema>;

// ============================================================================
// CRUD SCHEMAS
// ============================================================================

export const TemplateSortField = z.enum([
	"name",
	"category",
	"eventType",
	"usageCount",
	"createdAt",
	"updatedAt",
]);
export type TemplateSortField = z.infer<typeof TemplateSortField>;

export const listTemplatesSchema = z.object({
	includeInactive: z.boolean().default(false),
	category: z.string().optional(),
	eventType: z.nativeEnum(EventType).optional(),
	query: z.string().optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	sortBy: TemplateSortField.default("usageCount"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const getTemplateSchema = z.object({
	id: z.string().uuid(),
});

export const createTemplateSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(200),
	description: z.string().trim().max(2000).optional(),
	category: z.string().trim().max(100).optional(),
	eventType: z.nativeEnum(EventType).default(EventType.campus),
	defaultTitle: z.string().trim().max(200).optional(),
	defaultDescription: z.string().trim().max(5000).optional(),
	defaultDurationDays: z.number().int().min(1).default(1),
	maxCapacity: z.number().int().min(1).optional().nullable(),
	enableWaitlist: z.boolean().default(true),
	maxWaitlistSize: z.number().int().min(1).optional().nullable(),
	allowPublicRegistration: z.boolean().default(true),
	allowEarlyAccessForMembers: z.boolean().default(false),
	memberEarlyAccessDays: z.number().int().min(1).max(60).default(7),
	requiresApproval: z.boolean().default(false),
	currency: z.string().default("ARS"),
	acceptedPaymentMethods: z.array(z.nativeEnum(EventPaymentMethod)).optional(),
	contactEmail: z.string().email().optional(),
	contactPhone: z.string().max(30).optional(),
	coverImageUrl: z.string().url().optional(),
	templateData: templateDataSchema.optional(),
});

export const updateTemplateSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	category: z.string().trim().max(100).optional().nullable(),
	eventType: z.nativeEnum(EventType).optional(),
	defaultTitle: z.string().trim().max(200).optional().nullable(),
	defaultDescription: z.string().trim().max(5000).optional().nullable(),
	defaultDurationDays: z.number().int().min(1).optional(),
	maxCapacity: z.number().int().min(1).optional().nullable(),
	enableWaitlist: z.boolean().optional(),
	maxWaitlistSize: z.number().int().min(1).optional().nullable(),
	allowPublicRegistration: z.boolean().optional(),
	allowEarlyAccessForMembers: z.boolean().optional(),
	memberEarlyAccessDays: z.number().int().min(1).max(60).optional(),
	requiresApproval: z.boolean().optional(),
	currency: z.string().optional(),
	acceptedPaymentMethods: z
		.array(z.nativeEnum(EventPaymentMethod))
		.optional()
		.nullable(),
	contactEmail: z.string().email().optional().nullable(),
	contactPhone: z.string().max(30).optional().nullable(),
	coverImageUrl: z.string().url().optional().nullable(),
	isActive: z.boolean().optional(),
	templateData: templateDataSchema.optional(),
});

export const deleteTemplateSchema = z.object({
	id: z.string().uuid(),
});

// Create template from existing event
export const createTemplateFromEventSchema = z.object({
	eventId: z.string().uuid(),
	name: z.string().trim().min(1, "Name is required").max(200),
	description: z.string().trim().max(2000).optional(),
	category: z.string().trim().max(100).optional(),
});

// Create event from template
export const createEventFromTemplateSchema = z
	.object({
		templateId: z.string().uuid(),
		title: z.string().trim().min(1, "Title is required").max(200),
		slug: z
			.string()
			.trim()
			.min(1)
			.max(200)
			.regex(
				/^[a-z0-9-]+$/,
				"Slug must contain only lowercase letters, numbers, and hyphens",
			),
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
		locationId: z.string().uuid().optional().nullable(),
		// Optional overrides
		overrideMaxCapacity: z.number().int().min(1).optional(),
		overrideDescription: z.string().trim().max(5000).optional(),
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: "End date must be after or equal to start date",
		path: ["endDate"],
	});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ListTemplatesInput = z.infer<typeof listTemplatesSchema>;
export type GetTemplateInput = z.infer<typeof getTemplateSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type DeleteTemplateInput = z.infer<typeof deleteTemplateSchema>;
export type CreateTemplateFromEventInput = z.infer<
	typeof createTemplateFromEventSchema
>;
export type CreateEventFromTemplateInput = z.infer<
	typeof createEventFromTemplateSchema
>;
