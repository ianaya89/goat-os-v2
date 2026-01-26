import { z } from "zod/v4";
import {
	EventBudgetStatus,
	EventChecklistStatus,
	EventDocumentType,
	EventInventoryStatus,
	EventMilestoneStatus,
	EventNoteType,
	EventRiskProbability,
	EventRiskSeverity,
	EventRiskStatus,
	EventSponsorBenefitStatus,
	EventSponsorTier,
	EventStaffRole,
	EventStaffType,
	EventTaskPriority,
	EventTaskStatus,
} from "@/lib/db/schema/enums";

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const eventIdSchema = z.object({
	eventId: z.string().uuid(),
});

export const idSchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// VENDOR SCHEMAS (Organization-level)
// ============================================================================

export const listVendorsSchema = z.object({
	includeInactive: z.boolean().default(false),
	query: z.string().optional(),
});

export const createVendorSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(200),
	description: z.string().trim().max(2000).optional(),
	contactName: z.string().trim().max(200).optional(),
	email: z.string().email().optional().or(z.literal("")),
	phone: z.string().trim().max(50).optional(),
	address: z.string().trim().max(500).optional(),
	city: z.string().trim().max(100).optional(),
	websiteUrl: z.string().url().optional().or(z.literal("")),
	categories: z.array(z.string()).optional(),
	rating: z.number().int().min(1).max(5).optional(),
	taxId: z.string().trim().max(50).optional(),
	paymentTerms: z.string().trim().max(500).optional(),
	notes: z.string().trim().max(2000).optional(),
});

export const updateVendorSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	contactName: z.string().trim().max(200).optional().nullable(),
	email: z.string().email().optional().nullable().or(z.literal("")),
	phone: z.string().trim().max(50).optional().nullable(),
	address: z.string().trim().max(500).optional().nullable(),
	city: z.string().trim().max(100).optional().nullable(),
	websiteUrl: z.string().url().optional().nullable().or(z.literal("")),
	categories: z.array(z.string()).optional().nullable(),
	rating: z.number().int().min(1).max(5).optional().nullable(),
	taxId: z.string().trim().max(50).optional().nullable(),
	paymentTerms: z.string().trim().max(500).optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
	isActive: z.boolean().optional(),
});

// ============================================================================
// ZONE SCHEMAS
// ============================================================================

export const listZonesSchema = z.object({
	eventId: z.string().uuid(),
	includeInactive: z.boolean().default(false),
});

export const createZoneSchema = z.object({
	eventId: z.string().uuid(),
	name: z.string().trim().min(1, "Name is required").max(200),
	description: z.string().trim().max(2000).optional(),
	zoneType: z.string().trim().max(100).optional(),
	capacity: z.number().int().positive().optional(),
	locationDescription: z.string().trim().max(500).optional(),
	mapX: z.number().int().optional(),
	mapY: z.number().int().optional(),
	mapWidth: z.number().int().optional(),
	mapHeight: z.number().int().optional(),
	color: z.string().trim().max(50).optional(),
	notes: z.string().trim().max(2000).optional(),
});

export const updateZoneSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	zoneType: z.string().trim().max(100).optional().nullable(),
	capacity: z.number().int().positive().optional().nullable(),
	locationDescription: z.string().trim().max(500).optional().nullable(),
	mapX: z.number().int().optional().nullable(),
	mapY: z.number().int().optional().nullable(),
	mapWidth: z.number().int().optional().nullable(),
	mapHeight: z.number().int().optional().nullable(),
	color: z.string().trim().max(50).optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
	isActive: z.boolean().optional(),
});

// ============================================================================
// ZONE STAFF SCHEMAS
// ============================================================================

export const listZoneStaffSchema = z.object({
	zoneId: z.string().uuid(),
});

export const assignStaffToZoneSchema = z.object({
	zoneId: z.string().uuid(),
	staffId: z.string().uuid(),
	roleAtZone: z.string().trim().max(100).optional(),
	isPrimary: z.boolean().default(false),
	notes: z.string().trim().max(2000).optional(),
});

export const removeStaffFromZoneSchema = z.object({
	zoneId: z.string().uuid(),
	staffId: z.string().uuid(),
});

// ============================================================================
// CHECKLIST SCHEMAS
// ============================================================================

export const listChecklistsSchema = z.object({
	eventId: z.string().uuid(),
	status: z.nativeEnum(EventChecklistStatus).optional(),
	category: z.string().optional(),
});

export const createChecklistItemSchema = z.object({
	eventId: z.string().uuid(),
	title: z.string().trim().min(1, "Title is required").max(500),
	description: z.string().trim().max(2000).optional(),
	category: z.string().trim().max(100).optional(),
	dueDate: z.coerce.date().optional(),
	sortOrder: z.number().int().default(0),
});

export const updateChecklistItemSchema = z.object({
	id: z.string().uuid(),
	title: z.string().trim().min(1).max(500).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	category: z.string().trim().max(100).optional().nullable(),
	status: z.nativeEnum(EventChecklistStatus).optional(),
	dueDate: z.coerce.date().optional().nullable(),
	sortOrder: z.number().int().optional(),
});

export const toggleChecklistItemSchema = z.object({
	id: z.string().uuid(),
	completed: z.boolean(),
});

export const reorderChecklistSchema = z.object({
	eventId: z.string().uuid(),
	items: z.array(
		z.object({
			id: z.string().uuid(),
			sortOrder: z.number().int(),
		}),
	),
});

// ============================================================================
// TASK (KANBAN) SCHEMAS
// ============================================================================

export const listTasksSchema = z.object({
	eventId: z.string().uuid(),
	status: z.nativeEnum(EventTaskStatus).optional(),
	assigneeId: z.string().uuid().optional(),
	priority: z.nativeEnum(EventTaskPriority).optional(),
});

export const createTaskSchema = z.object({
	eventId: z.string().uuid(),
	title: z.string().trim().min(1, "Title is required").max(500),
	description: z.string().trim().max(5000).optional(),
	status: z.nativeEnum(EventTaskStatus).default(EventTaskStatus.todo),
	priority: z.nativeEnum(EventTaskPriority).default(EventTaskPriority.medium),
	assigneeId: z.string().uuid().optional(),
	dueDate: z.coerce.date().optional(),
	tags: z.array(z.string()).optional(),
	estimatedHours: z.number().int().positive().optional(),
	columnPosition: z.number().int().default(0),
});

export const updateTaskSchema = z.object({
	id: z.string().uuid(),
	title: z.string().trim().min(1).max(500).optional(),
	description: z.string().trim().max(5000).optional().nullable(),
	status: z.nativeEnum(EventTaskStatus).optional(),
	priority: z.nativeEnum(EventTaskPriority).optional(),
	assigneeId: z.string().uuid().optional().nullable(),
	dueDate: z.coerce.date().optional().nullable(),
	tags: z.array(z.string()).optional().nullable(),
	estimatedHours: z.number().int().positive().optional().nullable(),
	actualHours: z.number().int().min(0).optional().nullable(),
	columnPosition: z.number().int().optional(),
});

export const moveTaskSchema = z.object({
	id: z.string().uuid(),
	status: z.nativeEnum(EventTaskStatus),
	columnPosition: z.number().int(),
});

export const reorderTasksSchema = z.object({
	eventId: z.string().uuid(),
	tasks: z.array(
		z.object({
			id: z.string().uuid(),
			status: z.nativeEnum(EventTaskStatus),
			columnPosition: z.number().int(),
		}),
	),
});

// ============================================================================
// STAFF/VOLUNTEER SCHEMAS
// ============================================================================

export const listStaffSchema = z.object({
	eventId: z.string().uuid(),
	role: z.nativeEnum(EventStaffRole).optional(),
	staffType: z.nativeEnum(EventStaffType).optional(),
	isConfirmed: z.boolean().optional(),
});

export const createStaffSchema = z.object({
	eventId: z.string().uuid(),
	staffType: z.nativeEnum(EventStaffType),
	// For system users
	userId: z.string().uuid().optional(),
	// For external people
	externalName: z.string().trim().max(200).optional(),
	externalEmail: z.string().email().optional().or(z.literal("")),
	externalPhone: z.string().trim().max(50).optional(),
	// Common fields
	role: z.nativeEnum(EventStaffRole).default(EventStaffRole.volunteer),
	roleTitle: z.string().trim().max(200).optional(),
	notes: z.string().trim().max(2000).optional(),
	specialSkills: z.string().trim().max(1000).optional(),
	emergencyContactName: z.string().trim().max(200).optional(),
	emergencyContactPhone: z.string().trim().max(50).optional(),
});

export const updateStaffSchema = z.object({
	id: z.string().uuid(),
	role: z.nativeEnum(EventStaffRole).optional(),
	roleTitle: z.string().trim().max(200).optional().nullable(),
	isConfirmed: z.boolean().optional(),
	notes: z.string().trim().max(2000).optional().nullable(),
	specialSkills: z.string().trim().max(1000).optional().nullable(),
	emergencyContactName: z.string().trim().max(200).optional().nullable(),
	emergencyContactPhone: z.string().trim().max(50).optional().nullable(),
	// External person fields (only if staffType is external)
	externalName: z.string().trim().max(200).optional(),
	externalEmail: z.string().email().optional().nullable().or(z.literal("")),
	externalPhone: z.string().trim().max(50).optional().nullable(),
});

export const confirmStaffSchema = z.object({
	id: z.string().uuid(),
	confirmed: z.boolean(),
});

// ============================================================================
// STAFF SHIFT SCHEMAS
// ============================================================================

export const listShiftsSchema = z.object({
	eventId: z.string().uuid(),
	staffId: z.string().uuid().optional(),
	zoneId: z.string().uuid().optional(),
	shiftDate: z.coerce.date().optional(),
});

export const createShiftSchema = z.object({
	staffId: z.string().uuid(),
	eventId: z.string().uuid(),
	shiftDate: z.coerce.date(),
	startTime: z.coerce.date(),
	endTime: z.coerce.date(),
	zoneId: z.string().uuid().optional(),
	notes: z.string().trim().max(2000).optional(),
});

export const updateShiftSchema = z.object({
	id: z.string().uuid(),
	shiftDate: z.coerce.date().optional(),
	startTime: z.coerce.date().optional(),
	endTime: z.coerce.date().optional(),
	zoneId: z.string().uuid().optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const checkInOutShiftSchema = z.object({
	id: z.string().uuid(),
	action: z.enum(["checkin", "checkout"]),
});

// ============================================================================
// BUDGET SCHEMAS
// ============================================================================

export const listBudgetLinesSchema = z.object({
	eventId: z.string().uuid(),
	categoryId: z.string().uuid().optional(),
	status: z.nativeEnum(EventBudgetStatus).optional(),
	isRevenue: z.boolean().optional(),
});

export const createBudgetLineSchema = z.object({
	eventId: z.string().uuid(),
	categoryId: z.string().uuid().optional(),
	name: z.string().trim().min(1, "Name is required").max(200),
	description: z.string().trim().max(2000).optional(),
	plannedAmount: z.number().int().min(0).default(0),
	actualAmount: z.number().int().min(0).default(0),
	currency: z.string().default("ARS"),
	status: z.nativeEnum(EventBudgetStatus).default(EventBudgetStatus.planned),
	isRevenue: z.boolean().default(false),
	vendorId: z.string().uuid().optional(),
	notes: z.string().trim().max(2000).optional(),
});

export const updateBudgetLineSchema = z.object({
	id: z.string().uuid(),
	categoryId: z.string().uuid().optional().nullable(),
	name: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	plannedAmount: z.number().int().min(0).optional(),
	actualAmount: z.number().int().min(0).optional(),
	status: z.nativeEnum(EventBudgetStatus).optional(),
	vendorId: z.string().uuid().optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const approveBudgetLineSchema = z.object({
	id: z.string().uuid(),
});

export const linkBudgetToExpenseSchema = z.object({
	id: z.string().uuid(),
	expenseId: z.string().uuid(),
});

// ============================================================================
// SPONSOR SCHEMAS
// ============================================================================

export const listSponsorsSchema = z.object({
	eventId: z.string().uuid(),
	tier: z.nativeEnum(EventSponsorTier).optional(),
});

export const createSponsorSchema = z.object({
	eventId: z.string().uuid(),
	name: z.string().trim().min(1, "Name is required").max(200),
	description: z.string().trim().max(2000).optional(),
	logoUrl: z.string().url().optional().or(z.literal("")),
	websiteUrl: z.string().url().optional().or(z.literal("")),
	contactName: z.string().trim().max(200).optional(),
	contactEmail: z.string().email().optional().or(z.literal("")),
	contactPhone: z.string().trim().max(50).optional(),
	tier: z.nativeEnum(EventSponsorTier).default(EventSponsorTier.partner),
	sponsorshipValue: z.number().int().min(0).default(0),
	currency: z.string().default("ARS"),
	inKindDescription: z.string().trim().max(2000).optional(),
	sortOrder: z.number().int().default(0),
	notes: z.string().trim().max(2000).optional(),
});

export const updateSponsorSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	logoUrl: z.string().url().optional().nullable().or(z.literal("")),
	websiteUrl: z.string().url().optional().nullable().or(z.literal("")),
	contactName: z.string().trim().max(200).optional().nullable(),
	contactEmail: z.string().email().optional().nullable().or(z.literal("")),
	contactPhone: z.string().trim().max(50).optional().nullable(),
	tier: z.nativeEnum(EventSponsorTier).optional(),
	sponsorshipValue: z.number().int().min(0).optional(),
	inKindDescription: z.string().trim().max(2000).optional().nullable(),
	contractSigned: z.boolean().optional(),
	sortOrder: z.number().int().optional(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

// ============================================================================
// SPONSOR BENEFIT SCHEMAS
// ============================================================================

export const listBenefitsSchema = z.object({
	sponsorId: z.string().uuid(),
	status: z.nativeEnum(EventSponsorBenefitStatus).optional(),
});

export const createBenefitSchema = z.object({
	sponsorId: z.string().uuid(),
	title: z.string().trim().min(1, "Title is required").max(200),
	description: z.string().trim().max(2000).optional(),
	quantity: z.number().int().positive().default(1),
	estimatedValue: z.number().int().min(0).optional(),
	dueDate: z.coerce.date().optional(),
});

export const updateBenefitSchema = z.object({
	id: z.string().uuid(),
	title: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	quantity: z.number().int().positive().optional(),
	estimatedValue: z.number().int().min(0).optional().nullable(),
	status: z.nativeEnum(EventSponsorBenefitStatus).optional(),
	dueDate: z.coerce.date().optional().nullable(),
	deliveryNotes: z.string().trim().max(2000).optional().nullable(),
});

export const markBenefitDeliveredSchema = z.object({
	id: z.string().uuid(),
	deliveryNotes: z.string().trim().max(2000).optional(),
});

// ============================================================================
// MILESTONE SCHEMAS
// ============================================================================

export const listMilestonesSchema = z.object({
	eventId: z.string().uuid(),
	status: z.nativeEnum(EventMilestoneStatus).optional(),
	responsibleId: z.string().uuid().optional(),
});

export const createMilestoneSchema = z.object({
	eventId: z.string().uuid(),
	title: z.string().trim().min(1, "Title is required").max(500),
	description: z.string().trim().max(2000).optional(),
	targetDate: z.coerce.date(),
	status: z
		.nativeEnum(EventMilestoneStatus)
		.default(EventMilestoneStatus.pending),
	responsibleId: z.string().uuid().optional(),
	dependsOn: z.array(z.string().uuid()).optional(),
	color: z.string().trim().max(50).optional(),
	notes: z.string().trim().max(2000).optional(),
});

export const updateMilestoneSchema = z.object({
	id: z.string().uuid(),
	title: z.string().trim().min(1).max(500).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	targetDate: z.coerce.date().optional(),
	status: z.nativeEnum(EventMilestoneStatus).optional(),
	responsibleId: z.string().uuid().optional().nullable(),
	dependsOn: z.array(z.string().uuid()).optional().nullable(),
	color: z.string().trim().max(50).optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const completeMilestoneSchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

export const listDocumentsSchema = z.object({
	eventId: z.string().uuid(),
	documentType: z.nativeEnum(EventDocumentType).optional(),
});

export const createDocumentSchema = z.object({
	eventId: z.string().uuid(),
	name: z.string().trim().min(1, "Name is required").max(500),
	description: z.string().trim().max(2000).optional(),
	documentType: z
		.nativeEnum(EventDocumentType)
		.default(EventDocumentType.other),
	storageKey: z.string().min(1),
	fileName: z.string().min(1).max(500),
	fileSize: z.number().int().positive().optional(),
	mimeType: z.string().max(200).optional(),
	tags: z.array(z.string()).optional(),
	isPublic: z.boolean().default(false),
});

export const updateDocumentSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(500).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	documentType: z.nativeEnum(EventDocumentType).optional(),
	tags: z.array(z.string()).optional().nullable(),
	isPublic: z.boolean().optional(),
});

export const getDocumentUploadUrlSchema = z.object({
	eventId: z.string().uuid(),
	fileName: z.string().min(1).max(500),
	mimeType: z.string().max(200),
});

export const getDocumentDownloadUrlSchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// NOTE SCHEMAS
// ============================================================================

export const listNotesSchema = z.object({
	eventId: z.string().uuid(),
	noteType: z.nativeEnum(EventNoteType).optional(),
	relatedEntityType: z.string().optional(),
	relatedEntityId: z.string().uuid().optional(),
});

export const createNoteSchema = z.object({
	eventId: z.string().uuid(),
	content: z.string().trim().min(1, "Content is required").max(10000),
	noteType: z.nativeEnum(EventNoteType).default(EventNoteType.comment),
	parentNoteId: z.string().uuid().optional(),
	mentions: z.array(z.string().uuid()).optional(),
	relatedEntityType: z.string().optional(),
	relatedEntityId: z.string().uuid().optional(),
});

export const updateNoteSchema = z.object({
	id: z.string().uuid(),
	content: z.string().trim().min(1).max(10000).optional(),
	noteType: z.nativeEnum(EventNoteType).optional(),
});

export const pinNoteSchema = z.object({
	id: z.string().uuid(),
	pinned: z.boolean(),
});

// ============================================================================
// INVENTORY SCHEMAS
// ============================================================================

export const listInventorySchema = z.object({
	eventId: z.string().uuid(),
	category: z.string().optional(),
	status: z.nativeEnum(EventInventoryStatus).optional(),
	zoneId: z.string().uuid().optional(),
});

export const createInventoryItemSchema = z.object({
	eventId: z.string().uuid(),
	name: z.string().trim().min(1, "Name is required").max(200),
	description: z.string().trim().max(2000).optional(),
	category: z.string().trim().max(100).optional(),
	quantityNeeded: z.number().int().positive().default(1),
	quantityAvailable: z.number().int().min(0).default(0),
	status: z
		.nativeEnum(EventInventoryStatus)
		.default(EventInventoryStatus.needed),
	source: z.string().trim().max(100).optional(),
	vendorId: z.string().uuid().optional(),
	unitCost: z.number().int().min(0).optional(),
	totalCost: z.number().int().min(0).optional(),
	currency: z.string().default("ARS"),
	zoneId: z.string().uuid().optional(),
	storageLocation: z.string().trim().max(200).optional(),
	responsibleId: z.string().uuid().optional(),
	notes: z.string().trim().max(2000).optional(),
});

export const updateInventoryItemSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	category: z.string().trim().max(100).optional().nullable(),
	quantityNeeded: z.number().int().positive().optional(),
	quantityAvailable: z.number().int().min(0).optional(),
	status: z.nativeEnum(EventInventoryStatus).optional(),
	source: z.string().trim().max(100).optional().nullable(),
	vendorId: z.string().uuid().optional().nullable(),
	unitCost: z.number().int().min(0).optional().nullable(),
	totalCost: z.number().int().min(0).optional().nullable(),
	zoneId: z.string().uuid().optional().nullable(),
	storageLocation: z.string().trim().max(200).optional().nullable(),
	responsibleId: z.string().uuid().optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateInventoryStatusSchema = z.object({
	id: z.string().uuid(),
	status: z.nativeEnum(EventInventoryStatus),
});

// ============================================================================
// VENDOR ASSIGNMENT SCHEMAS
// ============================================================================

export const listVendorAssignmentsSchema = z.object({
	eventId: z.string().uuid(),
});

export const createVendorAssignmentSchema = z.object({
	eventId: z.string().uuid(),
	vendorId: z.string().uuid(),
	serviceDescription: z.string().trim().max(2000).optional(),
	contractValue: z.number().int().min(0).optional(),
	currency: z.string().default("ARS"),
	notes: z.string().trim().max(2000).optional(),
});

export const updateVendorAssignmentSchema = z.object({
	id: z.string().uuid(),
	serviceDescription: z.string().trim().max(2000).optional().nullable(),
	contractValue: z.number().int().min(0).optional().nullable(),
	isConfirmed: z.boolean().optional(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const confirmVendorAssignmentSchema = z.object({
	id: z.string().uuid(),
	confirmed: z.boolean(),
});

// ============================================================================
// RISK SCHEMAS
// ============================================================================

export const listRisksSchema = z.object({
	eventId: z.string().uuid(),
	category: z.string().optional(),
	status: z.nativeEnum(EventRiskStatus).optional(),
	severity: z.nativeEnum(EventRiskSeverity).optional(),
	ownerId: z.string().uuid().optional(),
});

export const createRiskSchema = z.object({
	eventId: z.string().uuid(),
	title: z.string().trim().min(1, "Title is required").max(500),
	description: z.string().trim().max(5000).optional(),
	category: z.string().trim().max(100).optional(),
	severity: z.nativeEnum(EventRiskSeverity).default(EventRiskSeverity.medium),
	probability: z
		.nativeEnum(EventRiskProbability)
		.default(EventRiskProbability.possible),
	status: z.nativeEnum(EventRiskStatus).default(EventRiskStatus.identified),
	mitigationPlan: z.string().trim().max(5000).optional(),
	mitigationCost: z.number().int().min(0).optional(),
	contingencyPlan: z.string().trim().max(5000).optional(),
	triggerConditions: z.string().trim().max(2000).optional(),
	potentialImpact: z.string().trim().max(2000).optional(),
	ownerId: z.string().uuid().optional(),
	nextReviewDate: z.coerce.date().optional(),
	notes: z.string().trim().max(2000).optional(),
});

export const updateRiskSchema = z.object({
	id: z.string().uuid(),
	title: z.string().trim().min(1).max(500).optional(),
	description: z.string().trim().max(5000).optional().nullable(),
	category: z.string().trim().max(100).optional().nullable(),
	severity: z.nativeEnum(EventRiskSeverity).optional(),
	probability: z.nativeEnum(EventRiskProbability).optional(),
	status: z.nativeEnum(EventRiskStatus).optional(),
	mitigationPlan: z.string().trim().max(5000).optional().nullable(),
	mitigationCost: z.number().int().min(0).optional().nullable(),
	contingencyPlan: z.string().trim().max(5000).optional().nullable(),
	triggerConditions: z.string().trim().max(2000).optional().nullable(),
	potentialImpact: z.string().trim().max(2000).optional().nullable(),
	ownerId: z.string().uuid().optional().nullable(),
	nextReviewDate: z.coerce.date().optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const reviewRiskSchema = z.object({
	id: z.string().uuid(),
	notes: z.string().trim().max(2000).optional(),
	nextReviewDate: z.coerce.date().optional(),
});

export const listRiskLogsSchema = z.object({
	riskId: z.string().uuid(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Vendors
export type ListVendorsInput = z.infer<typeof listVendorsSchema>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

// Zones
export type ListZonesInput = z.infer<typeof listZonesSchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;

// Zone Staff
export type ListZoneStaffInput = z.infer<typeof listZoneStaffSchema>;
export type AssignStaffToZoneInput = z.infer<typeof assignStaffToZoneSchema>;
export type RemoveStaffFromZoneInput = z.infer<
	typeof removeStaffFromZoneSchema
>;

// Checklists
export type ListChecklistsInput = z.infer<typeof listChecklistsSchema>;
export type CreateChecklistItemInput = z.infer<
	typeof createChecklistItemSchema
>;
export type UpdateChecklistItemInput = z.infer<
	typeof updateChecklistItemSchema
>;
export type ToggleChecklistItemInput = z.infer<
	typeof toggleChecklistItemSchema
>;
export type ReorderChecklistInput = z.infer<typeof reorderChecklistSchema>;

// Tasks
export type ListTasksInput = z.infer<typeof listTasksSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;

// Staff
export type ListStaffInput = z.infer<typeof listStaffSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type ConfirmStaffInput = z.infer<typeof confirmStaffSchema>;

// Shifts
export type ListShiftsInput = z.infer<typeof listShiftsSchema>;
export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type CheckInOutShiftInput = z.infer<typeof checkInOutShiftSchema>;

// Budget
export type ListBudgetLinesInput = z.infer<typeof listBudgetLinesSchema>;
export type CreateBudgetLineInput = z.infer<typeof createBudgetLineSchema>;
export type UpdateBudgetLineInput = z.infer<typeof updateBudgetLineSchema>;
export type ApproveBudgetLineInput = z.infer<typeof approveBudgetLineSchema>;
export type LinkBudgetToExpenseInput = z.infer<
	typeof linkBudgetToExpenseSchema
>;

// Sponsors
export type ListSponsorsInput = z.infer<typeof listSponsorsSchema>;
export type CreateSponsorInput = z.infer<typeof createSponsorSchema>;
export type UpdateSponsorInput = z.infer<typeof updateSponsorSchema>;

// Benefits
export type ListBenefitsInput = z.infer<typeof listBenefitsSchema>;
export type CreateBenefitInput = z.infer<typeof createBenefitSchema>;
export type UpdateBenefitInput = z.infer<typeof updateBenefitSchema>;
export type MarkBenefitDeliveredInput = z.infer<
	typeof markBenefitDeliveredSchema
>;

// Milestones
export type ListMilestonesInput = z.infer<typeof listMilestonesSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type CompleteMilestoneInput = z.infer<typeof completeMilestoneSchema>;

// Documents
export type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type GetDocumentUploadUrlInput = z.infer<
	typeof getDocumentUploadUrlSchema
>;
export type GetDocumentDownloadUrlInput = z.infer<
	typeof getDocumentDownloadUrlSchema
>;

// Notes
export type ListNotesInput = z.infer<typeof listNotesSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type PinNoteInput = z.infer<typeof pinNoteSchema>;

// Inventory
export type ListInventoryInput = z.infer<typeof listInventorySchema>;
export type CreateInventoryItemInput = z.infer<
	typeof createInventoryItemSchema
>;
export type UpdateInventoryItemInput = z.infer<
	typeof updateInventoryItemSchema
>;
export type UpdateInventoryStatusInput = z.infer<
	typeof updateInventoryStatusSchema
>;

// Vendor Assignments
export type ListVendorAssignmentsInput = z.infer<
	typeof listVendorAssignmentsSchema
>;
export type CreateVendorAssignmentInput = z.infer<
	typeof createVendorAssignmentSchema
>;
export type UpdateVendorAssignmentInput = z.infer<
	typeof updateVendorAssignmentSchema
>;
export type ConfirmVendorAssignmentInput = z.infer<
	typeof confirmVendorAssignmentSchema
>;

// Risks
export type ListRisksInput = z.infer<typeof listRisksSchema>;
export type CreateRiskInput = z.infer<typeof createRiskSchema>;
export type UpdateRiskInput = z.infer<typeof updateRiskSchema>;
export type ReviewRiskInput = z.infer<typeof reviewRiskSchema>;
export type ListRiskLogsInput = z.infer<typeof listRiskLogsSchema>;
