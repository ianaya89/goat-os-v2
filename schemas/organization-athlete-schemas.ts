import { z } from "zod/v4";
import {
	AthleteLevel,
	AthleteSex,
	AthleteSport,
	AthleteStatus,
	DominantSide,
	FitnessTestType,
} from "@/lib/db/schema/enums";

// Sortable fields for athletes
export const AthleteSortField = z.enum([
	"name",
	"email",
	"sport",
	"level",
	"status",
	"birthDate",
	"createdAt",
]);
export type AthleteSortField = z.infer<typeof AthleteSortField>;

// Get all athletes with filters
export const listAthletesSchema = z.object({
	limit: z.number().min(1).max(500).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: AthleteSortField.default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
	includeArchived: z.boolean().default(false),
	// Optional: filter by specific athlete IDs (used for coach's athletes view)
	athleteIds: z.array(z.string()).optional(),
	filters: z
		.object({
			status: z.array(z.nativeEnum(AthleteStatus)).optional(),
			level: z.array(z.nativeEnum(AthleteLevel)).optional(),
			sport: z.array(z.nativeEnum(AthleteSport)).optional(),
		})
		.optional(),
});

// Create athlete - includes user creation data
export const createAthleteSchema = z.object({
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
	// When true, sends an invitation email for the user to set their own password
	// When false (default), generates a temporary password shown to the admin
	sendInvitation: z.boolean().default(false),
	// Athlete specific data
	sport: z.nativeEnum(AthleteSport),
	birthDate: z.coerce.date().optional(),
	level: z.nativeEnum(AthleteLevel).default(AthleteLevel.beginner),
	status: z.nativeEnum(AthleteStatus).default(AthleteStatus.active),
	sex: z.nativeEnum(AthleteSex).optional(),
	// Physical attributes (optional on create)
	height: z.number().int().min(50).max(300).optional(), // cm
	weight: z.number().int().min(10000).max(300000).optional(), // grams
	dominantFoot: z.nativeEnum(DominantSide).optional(),
	dominantHand: z.nativeEnum(DominantSide).optional(),
	// Profile information
	nationality: z.string().trim().max(100).optional(),
	position: z.string().trim().max(100).optional(),
	secondaryPosition: z.string().trim().max(100).optional(),
	jerseyNumber: z.number().int().min(0).max(999).optional(),
	profilePhotoUrl: z.string().url().optional(),
	bio: z.string().trim().max(2000).optional(),
	yearsOfExperience: z.number().int().min(0).max(50).optional(),
	// Contact information
	phone: z.string().trim().min(1, "Phone is required").max(30),
	// Parent/Guardian contact (especially for minors)
	parentName: z.string().trim().max(200).optional(),
	parentPhone: z.string().trim().max(30).optional(),
	parentEmail: z.string().trim().email().max(255).optional(),
	parentRelationship: z.string().trim().max(100).optional(),
	// YouTube videos for highlight plays
	youtubeVideos: z.array(z.string().url()).max(10).optional(),
	// Education information (for student athletes)
	educationInstitution: z.string().trim().max(200).optional(),
	educationYear: z.string().trim().max(50).optional(),
	expectedGraduationDate: z.coerce.date().optional(),
	gpa: z.string().trim().max(10).optional(), // Stored as numeric string
	// Health & dietary information
	dietaryRestrictions: z.string().trim().max(500).optional(),
	allergies: z.string().trim().max(500).optional(),
	// Residence information
	residenceCity: z.string().trim().max(100).optional(),
	residenceCountry: z.string().trim().max(100).optional(),
});

// Update athlete
export const updateAthleteSchema = z.object({
	id: z.string().uuid(),
	// User data (synced to user table)
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(100, "Name is too long")
		.optional(),
	email: z
		.string()
		.trim()
		.email("Invalid email address")
		.max(255, "Email is too long")
		.optional(),
	// Athlete specific data
	sport: z.nativeEnum(AthleteSport).optional(),
	birthDate: z.coerce.date().optional().nullable(),
	level: z.nativeEnum(AthleteLevel).optional(),
	status: z.nativeEnum(AthleteStatus).optional(),
	sex: z.nativeEnum(AthleteSex).optional().nullable(),
	// Physical attributes
	height: z.number().int().min(50).max(300).optional().nullable(),
	weight: z.number().int().min(10000).max(300000).optional().nullable(),
	dominantFoot: z.nativeEnum(DominantSide).optional().nullable(),
	dominantHand: z.nativeEnum(DominantSide).optional().nullable(),
	wingspan: z.number().int().min(50).max(350).optional().nullable(),
	standingReach: z.number().int().min(100).max(400).optional().nullable(),
	// Profile information
	nationality: z.string().trim().max(100).optional().nullable(),
	position: z.string().trim().max(100).optional().nullable(),
	secondaryPosition: z.string().trim().max(100).optional().nullable(),
	jerseyNumber: z.number().int().min(0).max(999).optional().nullable(),
	profilePhotoUrl: z.string().url().optional().nullable(),
	bio: z.string().trim().max(2000).optional().nullable(),
	yearsOfExperience: z.number().int().min(0).max(50).optional().nullable(),
	// Contact information
	phone: z.string().trim().max(30).optional().nullable(),
	// Parent/Guardian contact (especially for minors)
	parentName: z.string().trim().max(200).optional().nullable(),
	parentPhone: z.string().trim().max(30).optional().nullable(),
	parentEmail: z.string().trim().email().max(255).optional().nullable(),
	parentRelationship: z.string().trim().max(100).optional().nullable(),
	// YouTube videos for highlight plays
	youtubeVideos: z.array(z.string().url()).max(10).optional().nullable(),
	// Education information (for student athletes)
	educationInstitution: z.string().trim().max(200).optional().nullable(),
	educationYear: z.string().trim().max(50).optional().nullable(),
	expectedGraduationDate: z.coerce.date().optional().nullable(),
	gpa: z.string().trim().max(10).optional().nullable(), // Stored as numeric string
	// Health & dietary information
	dietaryRestrictions: z.string().trim().max(500).optional().nullable(),
	allergies: z.string().trim().max(500).optional().nullable(),
	// Residence information
	residenceCity: z.string().trim().max(100).optional().nullable(),
	residenceCountry: z.string().trim().max(100).optional().nullable(),
	// Public profile settings
	isPublicProfile: z.boolean().optional(),
});

// Delete athlete
export const deleteAthleteSchema = z.object({
	id: z.string().uuid(),
});

// Archive athlete (soft delete)
export const archiveAthleteSchema = z.object({
	id: z.string().uuid(),
});

// Unarchive athlete (restore from archive)
export const unarchiveAthleteSchema = z.object({
	id: z.string().uuid(),
});

// Bulk archive athletes
export const bulkArchiveAthletesSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk unarchive athletes
export const bulkUnarchiveAthletesSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk delete athletes
export const bulkDeleteAthletesSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk update athletes status
export const bulkUpdateAthletesStatusSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	status: z.nativeEnum(AthleteStatus),
});

// Export athletes
export const exportAthletesSchema = z.object({
	athleteIds: z.array(z.string().uuid()).min(1),
});

// ============================================================================
// PHYSICAL METRICS SCHEMAS
// ============================================================================

export const createPhysicalMetricsSchema = z.object({
	athleteId: z.string().uuid(),
	measuredAt: z.coerce.date().optional(),
	weight: z.number().int().min(10000).max(300000).optional(), // grams
	bodyFatPercentage: z.number().int().min(0).max(600).optional(), // x10, e.g., 125 = 12.5%
	muscleMass: z.number().int().min(0).optional(), // grams
	notes: z.string().trim().max(1000).optional(),
});

export const listPhysicalMetricsSchema = z.object({
	athleteId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

export const updatePhysicalMetricsSchema = z.object({
	id: z.string().uuid(),
	athleteId: z.string().uuid(),
	measuredAt: z.coerce.date().optional(),
	weight: z.number().int().min(10000).max(300000).optional(),
	bodyFatPercentage: z.number().int().min(0).max(600).optional(),
	muscleMass: z.number().int().min(0).optional(),
	notes: z.string().trim().max(1000).optional(),
});

export const deletePhysicalMetricsSchema = z.object({
	id: z.string().uuid(),
	athleteId: z.string().uuid(),
});

// ============================================================================
// FITNESS TEST SCHEMAS
// ============================================================================

export const createFitnessTestSchema = z.object({
	athleteId: z.string().uuid(),
	testDate: z.coerce.date().optional(),
	testType: z.nativeEnum(FitnessTestType),
	result: z.number().int(), // Interpretation depends on test type
	unit: z.string().trim().min(1).max(50), // "seconds", "ms", "cm", "level", "reps"
	notes: z.string().trim().max(1000).optional(),
});

export const listFitnessTestsSchema = z.object({
	athleteId: z.string().uuid(),
	testType: z.nativeEnum(FitnessTestType).optional(),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

export const updateFitnessTestSchema = z.object({
	id: z.string().uuid(),
	athleteId: z.string().uuid(),
	testDate: z.coerce.date().optional(),
	testType: z.nativeEnum(FitnessTestType).optional(),
	result: z.number().int().optional(),
	unit: z.string().trim().min(1).max(50).optional(),
	notes: z.string().trim().max(1000).optional().nullable(),
});

export const deleteFitnessTestSchema = z.object({
	id: z.string().uuid(),
	athleteId: z.string().uuid(),
});

// ============================================================================
// CAREER HISTORY SCHEMAS
// ============================================================================

export const createCareerHistorySchema = z.object({
	athleteId: z.string().uuid(),
	clubId: z.string().uuid().optional(), // Either clubId OR nationalTeamId should be set
	nationalTeamId: z.string().uuid().optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	position: z.string().trim().max(100).optional(),
	achievements: z.string().trim().max(2000).optional(),
	notes: z.string().trim().max(1000).optional(),
});

export const updateCareerHistorySchema = z.object({
	id: z.string().uuid(),
	clubId: z.string().uuid().optional().nullable(),
	nationalTeamId: z.string().uuid().optional().nullable(),
	startDate: z.coerce.date().optional().nullable(),
	endDate: z.coerce.date().optional().nullable(),
	position: z.string().trim().max(100).optional().nullable(),
	achievements: z.string().trim().max(2000).optional().nullable(),
	notes: z.string().trim().max(1000).optional().nullable(),
});

export const listCareerHistorySchema = z.object({
	athleteId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

export const deleteCareerHistorySchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// EDUCATION SCHEMAS
// ============================================================================

export const createEducationSchema = z.object({
	athleteId: z.string().uuid(),
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

export const updateEducationSchema = z.object({
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

export const listEducationSchema = z.object({
	athleteId: z.string().uuid(),
});

export const deleteEducationSchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ListAthletesInput = z.infer<typeof listAthletesSchema>;
export type CreateAthleteInput = z.infer<typeof createAthleteSchema>;
export type UpdateAthleteInput = z.infer<typeof updateAthleteSchema>;
export type DeleteAthleteInput = z.infer<typeof deleteAthleteSchema>;
export type BulkDeleteAthletesInput = z.infer<typeof bulkDeleteAthletesSchema>;
export type BulkUpdateAthletesStatusInput = z.infer<
	typeof bulkUpdateAthletesStatusSchema
>;
export type ExportAthletesInput = z.infer<typeof exportAthletesSchema>;

// Physical metrics types
export type CreatePhysicalMetricsInput = z.infer<
	typeof createPhysicalMetricsSchema
>;
export type ListPhysicalMetricsInput = z.infer<
	typeof listPhysicalMetricsSchema
>;

// Fitness test types
export type CreateFitnessTestInput = z.infer<typeof createFitnessTestSchema>;
export type UpdateFitnessTestInput = z.infer<typeof updateFitnessTestSchema>;
export type ListFitnessTestsInput = z.infer<typeof listFitnessTestsSchema>;
export type DeleteFitnessTestInput = z.infer<typeof deleteFitnessTestSchema>;

// Career history types
export type CreateCareerHistoryInput = z.infer<
	typeof createCareerHistorySchema
>;
export type UpdateCareerHistoryInput = z.infer<
	typeof updateCareerHistorySchema
>;
export type ListCareerHistoryInput = z.infer<typeof listCareerHistorySchema>;
export type DeleteCareerHistoryInput = z.infer<
	typeof deleteCareerHistorySchema
>;

// Education types
export type CreateEducationInput = z.infer<typeof createEducationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
export type ListEducationInput = z.infer<typeof listEducationSchema>;
export type DeleteEducationInput = z.infer<typeof deleteEducationSchema>;
