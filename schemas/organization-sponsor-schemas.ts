import { z } from "zod/v4";
import { EventSponsorTier, SponsorStatus } from "@/lib/db/schema/enums";

// ============================================================================
// SPONSOR SCHEMAS (Organization-level)
// ============================================================================

export const listSponsorsOrgSchema = z.object({
	includeInactive: z.boolean().default(false),
	query: z.string().optional(),
	status: z.nativeEnum(SponsorStatus).optional(),
	tier: z.nativeEnum(EventSponsorTier).optional(),
});

export const createSponsorOrgSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(200),
	description: z.string().trim().max(2000).optional(),
	logoUrl: z.string().url().optional().or(z.literal("")),
	websiteUrl: z.string().url().optional().or(z.literal("")),
	contactName: z.string().trim().max(200).optional(),
	contactEmail: z.string().email().optional().or(z.literal("")),
	contactPhone: z.string().trim().max(50).optional(),
	tier: z.nativeEnum(EventSponsorTier).default(EventSponsorTier.partner),
	// Contract fields
	contractStartDate: z.coerce.date().optional(),
	contractEndDate: z.coerce.date().optional(),
	contractValue: z.number().int().min(0).optional(),
	currency: z.string().default("ARS"),
	contractNotes: z.string().trim().max(5000).optional(),
	// Status
	status: z.nativeEnum(SponsorStatus).default(SponsorStatus.pending),
	notes: z.string().trim().max(2000).optional(),
});

export const updateSponsorOrgSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	logoUrl: z.string().url().optional().nullable().or(z.literal("")),
	websiteUrl: z.string().url().optional().nullable().or(z.literal("")),
	contactName: z.string().trim().max(200).optional().nullable(),
	contactEmail: z.string().email().optional().nullable().or(z.literal("")),
	contactPhone: z.string().trim().max(50).optional().nullable(),
	tier: z.nativeEnum(EventSponsorTier).optional(),
	// Contract fields
	contractStartDate: z.coerce.date().optional().nullable(),
	contractEndDate: z.coerce.date().optional().nullable(),
	contractValue: z.number().int().min(0).optional().nullable(),
	currency: z.string().optional(),
	contractNotes: z.string().trim().max(5000).optional().nullable(),
	// Status
	status: z.nativeEnum(SponsorStatus).optional(),
	notes: z.string().trim().max(2000).optional().nullable(),
	isActive: z.boolean().optional(),
});

export const deleteSponsorOrgSchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// SPONSOR ASSIGNMENT SCHEMAS (Event-level)
// ============================================================================

export const listSponsorAssignmentsSchema = z.object({
	eventId: z.string().uuid(),
});

export const createSponsorAssignmentSchema = z.object({
	eventId: z.string().uuid(),
	sponsorId: z.string().uuid(),
	// Event-specific override (optional)
	tier: z.nativeEnum(EventSponsorTier).optional(),
	sponsorshipValue: z.number().int().min(0).default(0),
	currency: z.string().default("ARS"),
	inKindDescription: z.string().trim().max(2000).optional(),
	sortOrder: z.number().int().default(0),
	notes: z.string().trim().max(2000).optional(),
});

export const updateSponsorAssignmentSchema = z.object({
	id: z.string().uuid(),
	tier: z.nativeEnum(EventSponsorTier).optional().nullable(),
	sponsorshipValue: z.number().int().min(0).optional(),
	currency: z.string().optional(),
	inKindDescription: z.string().trim().max(2000).optional().nullable(),
	sortOrder: z.number().int().optional(),
	isConfirmed: z.boolean().optional(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const deleteSponsorAssignmentSchema = z.object({
	id: z.string().uuid(),
});

export const confirmSponsorAssignmentSchema = z.object({
	id: z.string().uuid(),
	confirmed: z.boolean(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Sponsors (org-level)
export type ListSponsorsOrgInput = z.infer<typeof listSponsorsOrgSchema>;
export type CreateSponsorOrgInput = z.infer<typeof createSponsorOrgSchema>;
export type UpdateSponsorOrgInput = z.infer<typeof updateSponsorOrgSchema>;
export type DeleteSponsorOrgInput = z.infer<typeof deleteSponsorOrgSchema>;

// Sponsor Assignments
export type ListSponsorAssignmentsInput = z.infer<
	typeof listSponsorAssignmentsSchema
>;
export type CreateSponsorAssignmentInput = z.infer<
	typeof createSponsorAssignmentSchema
>;
export type UpdateSponsorAssignmentInput = z.infer<
	typeof updateSponsorAssignmentSchema
>;
export type DeleteSponsorAssignmentInput = z.infer<
	typeof deleteSponsorAssignmentSchema
>;
export type ConfirmSponsorAssignmentInput = z.infer<
	typeof confirmSponsorAssignmentSchema
>;
