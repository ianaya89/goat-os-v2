import { z } from "zod/v4";
import {
	DiscountMode,
	DiscountValueType,
	EventPaymentMethod,
	EventPaymentStatus,
	EventRegistrationStatus,
	EventStatus,
	EventType,
	PricingTierType,
} from "@/lib/db/schema/enums";

// ============================================================================
// AGE CATEGORY SCHEMAS
// ============================================================================

export const listAgeCategoriesSchema = z.object({
	includeInactive: z.boolean().default(false),
});

export const createAgeCategorySchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(50),
	displayName: z.string().trim().min(1, "Display name is required").max(100),
	minBirthYear: z.number().int().min(1950).max(2050).optional(),
	maxBirthYear: z.number().int().min(1950).max(2050).optional(),
	isActive: z.boolean().default(true),
});

export const updateAgeCategorySchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(50).optional(),
	displayName: z.string().trim().min(1).max(100).optional(),
	minBirthYear: z.number().int().min(1950).max(2050).optional().nullable(),
	maxBirthYear: z.number().int().min(1950).max(2050).optional().nullable(),
	isActive: z.boolean().optional(),
});

export const deleteAgeCategorySchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// SPORTS EVENT SCHEMAS
// ============================================================================

export const EventSortField = z.enum([
	"title",
	"startDate",
	"endDate",
	"status",
	"eventType",
	"createdAt",
]);
export type EventSortField = z.infer<typeof EventSortField>;

export const listSportsEventsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: EventSortField.default("startDate"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
	filters: z
		.object({
			status: z.array(z.nativeEnum(EventStatus)).optional(),
			eventType: z.array(z.nativeEnum(EventType)).optional(),
			dateRange: z
				.object({
					from: z.coerce.date(),
					to: z.coerce.date(),
				})
				.optional(),
			ageCategoryId: z.string().uuid().optional(),
		})
		.optional(),
});

export const createSportsEventSchema = z
	.object({
		title: z.string().trim().min(1, "Title is required").max(200),
		slug: z
			.string()
			.trim()
			.min(1, "Slug is required")
			.max(200)
			.regex(
				/^[a-z0-9-]+$/,
				"Slug must contain only lowercase letters, numbers, and hyphens",
			),
		description: z.string().trim().max(5000).optional(),
		eventType: z.nativeEnum(EventType).default(EventType.campus),
		status: z.nativeEnum(EventStatus).default(EventStatus.draft),

		// Dates
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
		registrationOpenDate: z.coerce.date().optional(),
		registrationCloseDate: z.coerce.date().optional(),

		// Location
		locationId: z.string().uuid().optional().nullable(),
		venueDetails: z.string().trim().max(1000).optional(),

		// Capacity
		maxCapacity: z.number().int().min(1).optional(),
		enableWaitlist: z.boolean().default(true),
		maxWaitlistSize: z.number().int().min(1).optional().nullable(),

		// Registration options
		allowPublicRegistration: z.boolean().default(true),
		allowEarlyAccessForMembers: z.boolean().default(false),
		memberEarlyAccessDays: z.number().int().min(1).max(60).default(7),
		requiresApproval: z.boolean().default(false),

		// Payment settings
		currency: z.string().default("ARS"),
		acceptedPaymentMethods: z
			.array(z.nativeEnum(EventPaymentMethod))
			.optional(),

		// Contact
		contactEmail: z.string().email().optional(),
		contactPhone: z.string().max(30).optional(),

		// Media
		coverImageUrl: z.string().url().optional(),

		// Age categories to link
		ageCategoryIds: z.array(z.string().uuid()).optional(),

		// Coaches to assign
		coachIds: z.array(z.string().uuid()).optional(),
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: "End date must be after or equal to start date",
		path: ["endDate"],
	});

export const updateSportsEventSchema = z.object({
	id: z.string().uuid(),
	title: z.string().trim().min(1).max(200).optional(),
	slug: z
		.string()
		.trim()
		.min(1)
		.max(200)
		.regex(/^[a-z0-9-]+$/)
		.optional(),
	description: z.string().trim().max(5000).optional().nullable(),
	eventType: z.nativeEnum(EventType).optional(),
	status: z.nativeEnum(EventStatus).optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	registrationOpenDate: z.coerce.date().optional().nullable(),
	registrationCloseDate: z.coerce.date().optional().nullable(),
	locationId: z.string().uuid().optional().nullable(),
	venueDetails: z.string().trim().max(1000).optional().nullable(),
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
	ageCategoryIds: z.array(z.string().uuid()).optional(),
});

export const deleteSportsEventSchema = z.object({
	id: z.string().uuid(),
});

export const updateSportsEventStatusSchema = z.object({
	id: z.string().uuid(),
	status: z.nativeEnum(EventStatus),
});

export const duplicateSportsEventSchema = z.object({
	id: z.string().uuid(),
	newTitle: z.string().trim().min(1).max(200),
	newSlug: z
		.string()
		.trim()
		.min(1)
		.max(200)
		.regex(/^[a-z0-9-]+$/),
	newStartDate: z.coerce.date(),
	newEndDate: z.coerce.date(),
});

// ============================================================================
// EVENT AGE CATEGORY SCHEMAS
// ============================================================================

export const updateEventAgeCategoriesSchema = z.object({
	eventId: z.string().uuid(),
	ageCategoryIds: z.array(z.string().uuid()),
});

// ============================================================================
// PRICING TIER SCHEMAS
// ============================================================================

export const listPricingTiersSchema = z.object({
	eventId: z.string().uuid(),
	includeInactive: z.boolean().default(false),
});

export const createPricingTierSchema = z.object({
	eventId: z.string().uuid(),
	name: z.string().trim().min(1, "Name is required").max(100),
	description: z.string().trim().max(500).optional(),
	tierType: z.nativeEnum(PricingTierType),
	price: z.number().int().min(0, "Price must be positive"),
	currency: z.string().default("ARS"),
	validFrom: z.coerce.date().optional(),
	validUntil: z.coerce.date().optional(),
	capacityStart: z.number().int().min(1).optional(),
	capacityEnd: z.number().int().min(1).optional(),
	ageCategoryId: z.string().uuid().optional().nullable(),
	isActive: z.boolean().default(true),
	sortOrder: z.number().int().default(0),
});

export const updatePricingTierSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(100).optional(),
	description: z.string().trim().max(500).optional().nullable(),
	price: z.number().int().min(0).optional(),
	validFrom: z.coerce.date().optional().nullable(),
	validUntil: z.coerce.date().optional().nullable(),
	capacityStart: z.number().int().min(1).optional().nullable(),
	capacityEnd: z.number().int().min(1).optional().nullable(),
	ageCategoryId: z.string().uuid().optional().nullable(),
	isActive: z.boolean().optional(),
	sortOrder: z.number().int().optional(),
});

export const deletePricingTierSchema = z.object({
	id: z.string().uuid(),
});

export const calculatePriceSchema = z.object({
	eventId: z.string().uuid(),
	ageCategoryId: z.string().uuid().optional(),
});

// ============================================================================
// EVENT REGISTRATION SCHEMAS
// ============================================================================

export const RegistrationSortField = z.enum([
	"registrantName",
	"registrantEmail",
	"status",
	"registrationNumber",
	"registeredAt",
	"price",
]);
export type RegistrationSortField = z.infer<typeof RegistrationSortField>;

export const listEventRegistrationsSchema = z.object({
	eventId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: RegistrationSortField.default("registrationNumber"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
	filters: z
		.object({
			status: z.array(z.nativeEnum(EventRegistrationStatus)).optional(),
			ageCategoryId: z.string().uuid().optional(),
			isWaitlist: z.boolean().optional(),
		})
		.optional(),
});

export const getEventRegistrationSchema = z.object({
	id: z.string().uuid(),
});

// Admin creates registration for someone
export const createEventRegistrationSchema = z.object({
	eventId: z.string().uuid(),

	// Either link to existing athlete or provide registrant data
	athleteId: z.string().uuid().optional(),

	// Registrant info (required if no athleteId)
	registrantName: z.string().trim().min(1).max(200),
	registrantEmail: z.string().trim().email(),
	registrantPhone: z.string().trim().max(30).optional(),
	registrantBirthDate: z.coerce.date().optional(),

	// Emergency contact
	emergencyContactName: z.string().trim().max(200).optional(),
	emergencyContactPhone: z.string().trim().max(30).optional(),
	emergencyContactRelation: z.string().trim().max(100).optional(),

	// Age category
	ageCategoryId: z.string().uuid().optional(),

	// Status and pricing
	status: z
		.nativeEnum(EventRegistrationStatus)
		.default(EventRegistrationStatus.pendingPayment),
	overridePrice: z.number().int().min(0).optional(), // Manual price override

	// Notes
	notes: z.string().trim().max(2000).optional(),
	internalNotes: z.string().trim().max(2000).optional(),
});

export const updateEventRegistrationSchema = z.object({
	id: z.string().uuid(),
	status: z.nativeEnum(EventRegistrationStatus).optional(),
	ageCategoryId: z.string().uuid().optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
	internalNotes: z.string().trim().max(2000).optional().nullable(),
	emergencyContactName: z.string().trim().max(200).optional().nullable(),
	emergencyContactPhone: z.string().trim().max(30).optional().nullable(),
	emergencyContactRelation: z.string().trim().max(100).optional().nullable(),
});

export const cancelEventRegistrationSchema = z.object({
	id: z.string().uuid(),
	reason: z.string().trim().max(500).optional(),
});

export const confirmFromWaitlistSchema = z.object({
	id: z.string().uuid(),
});

export const bulkUpdateRegistrationStatusSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	status: z.nativeEnum(EventRegistrationStatus),
});

// Bulk register existing athletes from the organization
export const registerExistingAthletesSchema = z.object({
	eventId: z.string().uuid(),
	athleteIds: z.array(z.string().uuid()).min(1).max(100),
	status: z
		.nativeEnum(EventRegistrationStatus)
		.default(EventRegistrationStatus.confirmed),
	notes: z.string().trim().max(2000).optional(),
});

// ============================================================================
// EVENT PAYMENT SCHEMAS
// ============================================================================

export const listEventPaymentsSchema = z.object({
	registrationId: z.string().uuid().optional(),
	eventId: z.string().uuid().optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	filters: z
		.object({
			status: z.array(z.nativeEnum(EventPaymentStatus)).optional(),
			paymentMethod: z.array(z.nativeEnum(EventPaymentMethod)).optional(),
		})
		.optional(),
});

export const createEventPaymentSchema = z.object({
	registrationId: z.string().uuid(),
	amount: z.number().int().min(1, "Amount must be at least 1"),
	paymentMethod: z.nativeEnum(EventPaymentMethod),
	paymentDate: z.coerce.date().optional(),
	receiptNumber: z.string().trim().max(100).optional(),
	notes: z.string().trim().max(2000).optional(),
});

export const updateEventPaymentSchema = z.object({
	id: z.string().uuid(),
	status: z.nativeEnum(EventPaymentStatus).optional(),
	paymentDate: z.coerce.date().optional().nullable(),
	receiptNumber: z.string().trim().max(100).optional().nullable(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const processRefundSchema = z.object({
	paymentId: z.string().uuid(),
	refundAmount: z.number().int().min(1),
	reason: z.string().trim().max(500).optional(),
});

export const getReceiptUploadUrlSchema = z.object({
	paymentId: z.string().uuid(),
	filename: z.string().trim().min(1).max(255),
	contentType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
});

export const updatePaymentReceiptSchema = z.object({
	paymentId: z.string().uuid(),
	receiptImageKey: z.string().trim().min(1).max(500),
});

export const deletePaymentReceiptSchema = z.object({
	paymentId: z.string().uuid(),
});

export const getReceiptDownloadUrlSchema = z.object({
	paymentId: z.string().uuid(),
});

// ============================================================================
// EVENT COACH SCHEMAS
// ============================================================================

export const listEventCoachesSchema = z.object({
	eventId: z.string().uuid(),
});

export const assignEventCoachSchema = z.object({
	eventId: z.string().uuid(),
	coachId: z.string().uuid(),
	role: z.string().trim().max(50).default("coach"),
});

export const removeEventCoachSchema = z.object({
	eventId: z.string().uuid(),
	coachId: z.string().uuid(),
});

// ============================================================================
// EVENT DISCOUNT SCHEMAS
// ============================================================================

export const listDiscountsSchema = z.object({
	eventId: z.string().uuid(),
	includeInactive: z.boolean().default(false),
});

export const createDiscountSchema = z
	.object({
		eventId: z.string().uuid(),
		name: z.string().trim().min(1, "El nombre es requerido").max(100),
		description: z.string().trim().max(500).optional(),

		// Mode
		discountMode: z.nativeEnum(DiscountMode),
		code: z
			.string()
			.trim()
			.min(1)
			.max(50)
			.transform((val) => val.toUpperCase())
			.optional()
			.nullable(),

		// Value
		discountValueType: z.nativeEnum(DiscountValueType),
		discountValue: z.number().int().min(1, "El valor debe ser mayor a 0"),

		// Limits
		maxUses: z.number().int().min(1).optional().nullable(),
		maxUsesPerUser: z.number().int().min(1).optional().nullable(),

		// Dates
		validFrom: z.coerce.date().optional().nullable(),
		validUntil: z.coerce.date().optional().nullable(),

		// Restrictions
		minPurchaseAmount: z.number().int().min(0).optional().nullable(),
		priority: z.number().int().default(0),

		isActive: z.boolean().default(true),
	})
	.refine(
		(data) => {
			// If mode is "code", code is required
			if (data.discountMode === DiscountMode.code && !data.code) {
				return false;
			}
			return true;
		},
		{
			message: "El código es requerido para descuentos con código",
			path: ["code"],
		},
	)
	.refine(
		(data) => {
			// If percentage, value must be 1-100
			if (
				data.discountValueType === DiscountValueType.percentage &&
				data.discountValue > 100
			) {
				return false;
			}
			return true;
		},
		{
			message: "El porcentaje debe estar entre 1 y 100",
			path: ["discountValue"],
		},
	);

export const updateDiscountSchema = z
	.object({
		id: z.string().uuid(),
		name: z.string().trim().min(1).max(100).optional(),
		description: z.string().trim().max(500).optional().nullable(),
		discountMode: z.nativeEnum(DiscountMode).optional(),
		code: z
			.string()
			.trim()
			.min(1)
			.max(50)
			.transform((val) => val.toUpperCase())
			.optional()
			.nullable(),
		discountValueType: z.nativeEnum(DiscountValueType).optional(),
		discountValue: z.number().int().min(1).optional(),
		maxUses: z.number().int().min(1).optional().nullable(),
		maxUsesPerUser: z.number().int().min(1).optional().nullable(),
		validFrom: z.coerce.date().optional().nullable(),
		validUntil: z.coerce.date().optional().nullable(),
		minPurchaseAmount: z.number().int().min(0).optional().nullable(),
		priority: z.number().int().optional(),
		isActive: z.boolean().optional(),
	})
	.refine(
		(data) => {
			// If both mode and code are provided, validate
			if (
				data.discountMode === DiscountMode.code &&
				data.code !== undefined &&
				!data.code
			) {
				return false;
			}
			return true;
		},
		{
			message: "El código es requerido para descuentos con código",
			path: ["code"],
		},
	)
	.refine(
		(data) => {
			// If both type and value are provided, validate percentage
			if (
				data.discountValueType === DiscountValueType.percentage &&
				data.discountValue !== undefined &&
				data.discountValue > 100
			) {
				return false;
			}
			return true;
		},
		{
			message: "El porcentaje debe estar entre 1 y 100",
			path: ["discountValue"],
		},
	);

export const deleteDiscountSchema = z.object({
	id: z.string().uuid(),
});

// Validate a discount code (for registration with code)
export const validateDiscountCodeSchema = z.object({
	eventId: z.string().uuid(),
	code: z
		.string()
		.trim()
		.transform((val) => val.toUpperCase()),
	userEmail: z.string().trim().email(),
	originalPrice: z.number().int().min(0),
});

// Get applicable automatic discounts
export const getApplicableDiscountsSchema = z.object({
	eventId: z.string().uuid(),
	userEmail: z.string().trim().email(),
	originalPrice: z.number().int().min(0),
});

// ============================================================================
// PUBLIC EVENT SCHEMAS (for public pages, no auth required)
// ============================================================================

export const getPublicEventSchema = z.object({
	organizationSlug: z.string(),
	eventSlug: z.string(),
});

export const listPublicEventsSchema = z.object({
	organizationSlug: z.string(),
	limit: z.number().min(1).max(50).default(20),
	offset: z.number().min(0).default(0),
	eventType: z.nativeEnum(EventType).optional(),
});

export const publicEventRegistrationSchema = z.object({
	organizationSlug: z.string(),
	eventSlug: z.string(),

	// Registrant info
	registrantName: z.string().trim().min(1, "Name is required").max(200),
	registrantEmail: z.string().trim().email("Valid email is required"),
	registrantPhone: z.string().trim().max(30).optional(),
	registrantBirthDate: z.coerce.date().optional(),

	// Emergency contact
	emergencyContactName: z.string().trim().max(200).optional(),
	emergencyContactPhone: z.string().trim().max(30).optional(),
	emergencyContactRelation: z.string().trim().max(100).optional(),

	// Parent/Guardian info (required for minors)
	parentName: z.string().trim().max(200).optional(),
	parentPhone: z.string().trim().max(30).optional(),
	parentEmail: z.string().trim().email().max(255).optional(),
	parentRelationship: z.string().trim().max(100).optional(),

	// Age category
	ageCategoryId: z.string().uuid().optional(),

	// Notes
	notes: z.string().trim().max(2000).optional(),

	// Terms acceptance
	acceptTerms: z.boolean().refine((val) => val === true, {
		message: "You must accept the terms and conditions",
	}),

	// Medical fitness confirmation
	confirmMedicalFitness: z.boolean().refine((val) => val === true, {
		message: "You must confirm medical fitness",
	}),

	// Parental consent (for minors)
	parentalConsent: z.boolean().optional(),
});

export const checkRegistrationEmailSchema = z.object({
	eventId: z.string().uuid(),
	email: z.string().trim().email(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ListAgeCategoriesInput = z.infer<typeof listAgeCategoriesSchema>;
export type CreateAgeCategoryInput = z.infer<typeof createAgeCategorySchema>;
export type UpdateAgeCategoryInput = z.infer<typeof updateAgeCategorySchema>;
export type DeleteAgeCategoryInput = z.infer<typeof deleteAgeCategorySchema>;

export type ListSportsEventsInput = z.infer<typeof listSportsEventsSchema>;
export type CreateSportsEventInput = z.infer<typeof createSportsEventSchema>;
export type UpdateSportsEventInput = z.infer<typeof updateSportsEventSchema>;
export type DeleteSportsEventInput = z.infer<typeof deleteSportsEventSchema>;
export type UpdateSportsEventStatusInput = z.infer<
	typeof updateSportsEventStatusSchema
>;
export type DuplicateSportsEventInput = z.infer<
	typeof duplicateSportsEventSchema
>;

export type ListPricingTiersInput = z.infer<typeof listPricingTiersSchema>;
export type CreatePricingTierInput = z.infer<typeof createPricingTierSchema>;
export type UpdatePricingTierInput = z.infer<typeof updatePricingTierSchema>;
export type DeletePricingTierInput = z.infer<typeof deletePricingTierSchema>;
export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;

export type ListEventRegistrationsInput = z.infer<
	typeof listEventRegistrationsSchema
>;
export type GetEventRegistrationInput = z.infer<
	typeof getEventRegistrationSchema
>;
export type CreateEventRegistrationInput = z.infer<
	typeof createEventRegistrationSchema
>;
export type UpdateEventRegistrationInput = z.infer<
	typeof updateEventRegistrationSchema
>;
export type CancelEventRegistrationInput = z.infer<
	typeof cancelEventRegistrationSchema
>;
export type ConfirmFromWaitlistInput = z.infer<
	typeof confirmFromWaitlistSchema
>;
export type BulkUpdateRegistrationStatusInput = z.infer<
	typeof bulkUpdateRegistrationStatusSchema
>;
export type RegisterExistingAthletesInput = z.infer<
	typeof registerExistingAthletesSchema
>;

export type ListEventPaymentsInput = z.infer<typeof listEventPaymentsSchema>;
export type CreateEventPaymentInput = z.infer<typeof createEventPaymentSchema>;
export type UpdateEventPaymentInput = z.infer<typeof updateEventPaymentSchema>;
export type ProcessRefundInput = z.infer<typeof processRefundSchema>;

export type ListEventCoachesInput = z.infer<typeof listEventCoachesSchema>;
export type AssignEventCoachInput = z.infer<typeof assignEventCoachSchema>;
export type RemoveEventCoachInput = z.infer<typeof removeEventCoachSchema>;

export type ListDiscountsInput = z.infer<typeof listDiscountsSchema>;
export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
export type DeleteDiscountInput = z.infer<typeof deleteDiscountSchema>;
export type ValidateDiscountCodeInput = z.infer<
	typeof validateDiscountCodeSchema
>;
export type GetApplicableDiscountsInput = z.infer<
	typeof getApplicableDiscountsSchema
>;

export type GetPublicEventInput = z.infer<typeof getPublicEventSchema>;
export type ListPublicEventsInput = z.infer<typeof listPublicEventsSchema>;
export type PublicEventRegistrationInput = z.infer<
	typeof publicEventRegistrationSchema
>;
export type CheckRegistrationEmailInput = z.infer<
	typeof checkRegistrationEmailSchema
>;
