import { z } from "zod/v4";
import {
	AthleteSport,
	CoachExperienceLevel,
	CoachStatus,
} from "@/lib/db/schema/enums";

// Sortable fields for coaches
export const CoachSortField = z.enum([
	"name",
	"email",
	"specialty",
	"status",
	"createdAt",
]);
export type CoachSortField = z.infer<typeof CoachSortField>;

// Get all coaches with filters
export const listCoachesSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: CoachSortField.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
	filters: z
		.object({
			status: z.array(z.nativeEnum(CoachStatus)).optional(),
			createdAt: z
				.array(z.enum(["today", "this-week", "this-month", "older"]))
				.optional(),
		})
		.optional(),
});

// Create coach - includes user creation data
export const createCoachSchema = z.object({
	// User data (for creating the linked user)
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(100, "Name is too long"),
	email: z
		.string()
		.trim()
		.email("Invalid email address")
		.max(255, "Email is too long"),
	phone: z
		.string()
		.trim()
		.min(1, "Phone is required")
		.max(50, "Phone is too long"),
	// When true, sends an invitation email for the user to set their own password
	// When false (default), generates a temporary password shown to the admin
	sendInvitation: z.boolean().default(false),
	// Coach specific data
	birthDate: z.coerce.date().optional(),
	sport: z.nativeEnum(AthleteSport),
	specialty: z
		.string()
		.trim()
		.min(1, "Specialty is required")
		.max(500, "Specialty is too long"),
	bio: z.string().trim().max(2000, "Bio is too long").optional(),
	status: z.nativeEnum(CoachStatus).default(CoachStatus.active),
});

// Update coach
export const updateCoachSchema = z.object({
	id: z.string().uuid(),
	phone: z.string().trim().max(50, "Phone is too long").optional().nullable(),
	birthDate: z.coerce.date().optional().nullable(),
	sport: z.nativeEnum(AthleteSport).optional(),
	specialty: z
		.string()
		.trim()
		.min(1, "Specialty is required")
		.max(500, "Specialty is too long")
		.optional(),
	bio: z.string().trim().max(2000, "Bio is too long").optional().nullable(),
	status: z.nativeEnum(CoachStatus).optional(),
});

// Delete coach
export const deleteCoachSchema = z.object({
	id: z.string().uuid(),
});

// Bulk delete coaches
export const bulkDeleteCoachesSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk update coaches status
export const bulkUpdateCoachesStatusSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	status: z.nativeEnum(CoachStatus),
});

// Export coaches
export const exportCoachesSchema = z.object({
	coachIds: z.array(z.string().uuid()).min(1),
});

// Type exports
export type ListCoachesInput = z.infer<typeof listCoachesSchema>;
export type CreateCoachInput = z.infer<typeof createCoachSchema>;
export type UpdateCoachInput = z.infer<typeof updateCoachSchema>;
export type DeleteCoachInput = z.infer<typeof deleteCoachSchema>;
export type BulkDeleteCoachesInput = z.infer<typeof bulkDeleteCoachesSchema>;
export type BulkUpdateCoachesStatusInput = z.infer<
	typeof bulkUpdateCoachesStatusSchema
>;
export type ExportCoachesInput = z.infer<typeof exportCoachesSchema>;

// ============================================================================
// COACH SPORTS EXPERIENCE SCHEMAS
// ============================================================================

// Create coach sports experience
export const createCoachExperienceSchema = z.object({
	coachId: z.string().uuid(),
	institutionName: z
		.string()
		.trim()
		.min(1, "Institution name is required")
		.max(200, "Institution name is too long"),
	role: z
		.string()
		.trim()
		.min(1, "Role is required")
		.max(100, "Role is too long"),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	level: z.nativeEnum(CoachExperienceLevel).optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	achievements: z
		.string()
		.trim()
		.max(2000, "Achievements is too long")
		.optional()
		.nullable(),
	description: z
		.string()
		.trim()
		.max(2000, "Description is too long")
		.optional()
		.nullable(),
});

// Update coach sports experience
export const updateCoachExperienceSchema = z.object({
	id: z.string().uuid(),
	institutionName: z
		.string()
		.trim()
		.min(1, "Institution name is required")
		.max(200, "Institution name is too long")
		.optional(),
	role: z
		.string()
		.trim()
		.min(1, "Role is required")
		.max(100, "Role is too long")
		.optional(),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	level: z.nativeEnum(CoachExperienceLevel).optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	achievements: z
		.string()
		.trim()
		.max(2000, "Achievements is too long")
		.optional()
		.nullable(),
	description: z
		.string()
		.trim()
		.max(2000, "Description is too long")
		.optional()
		.nullable(),
});

// List coach sports experience
export const listCoachExperienceSchema = z.object({
	coachId: z.string().uuid(),
});

// Delete coach sports experience
export const deleteCoachExperienceSchema = z.object({
	id: z.string().uuid(),
});

// Type exports for coach experience
export type CreateCoachExperienceInput = z.infer<
	typeof createCoachExperienceSchema
>;
export type UpdateCoachExperienceInput = z.infer<
	typeof updateCoachExperienceSchema
>;
export type ListCoachExperienceInput = z.infer<
	typeof listCoachExperienceSchema
>;
export type DeleteCoachExperienceInput = z.infer<
	typeof deleteCoachExperienceSchema
>;

// ============================================================================
// COACH EDUCATION SCHEMAS
// ============================================================================

// Create coach education
export const createCoachEducationSchema = z.object({
	coachId: z.string().uuid(),
	institution: z.string().trim().min(2, "Institution is required").max(200),
	degree: z.string().trim().max(100).optional().nullable(),
	fieldOfStudy: z.string().trim().max(100).optional().nullable(),
	academicYear: z.string().trim().max(50).optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	expectedGraduationDate: z.coerce.date().optional().nullable(),
	gpa: z.string().trim().max(10).optional().nullable(),
	isCurrent: z.boolean().default(false),
	notes: z.string().trim().max(500).optional().nullable(),
});

// Update coach education
export const updateCoachEducationSchema = z.object({
	id: z.string().uuid(),
	institution: z.string().trim().min(2, "Institution is required").max(200),
	degree: z.string().trim().max(100).optional().nullable(),
	fieldOfStudy: z.string().trim().max(100).optional().nullable(),
	academicYear: z.string().trim().max(50).optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	expectedGraduationDate: z.coerce.date().optional().nullable(),
	gpa: z.string().trim().max(10).optional().nullable(),
	isCurrent: z.boolean().default(false),
	notes: z.string().trim().max(500).optional().nullable(),
});

// List coach education
export const listCoachEducationSchema = z.object({
	coachId: z.string().uuid(),
});

// Delete coach education
export const deleteCoachEducationSchema = z.object({
	id: z.string().uuid(),
});

// Type exports for coach education
export type CreateCoachEducationInput = z.infer<
	typeof createCoachEducationSchema
>;
export type UpdateCoachEducationInput = z.infer<
	typeof updateCoachEducationSchema
>;
export type ListCoachEducationInput = z.infer<typeof listCoachEducationSchema>;
export type DeleteCoachEducationInput = z.infer<
	typeof deleteCoachEducationSchema
>;
