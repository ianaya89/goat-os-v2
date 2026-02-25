import { z } from "zod/v4";
import { TrainingSessionStatus } from "@/lib/db/schema/enums";

// Sortable fields for training sessions
export const TrainingSessionSortField = z.enum([
	"title",
	"startTime",
	"endTime",
	"status",
	"createdAt",
]);
export type TrainingSessionSortField = z.infer<typeof TrainingSessionSortField>;

// Get all training sessions with filters
export const listTrainingSessionsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	query: z.string().optional(),
	sortBy: TrainingSessionSortField.default("startTime"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
	filters: z
		.object({
			status: z.array(z.nativeEnum(TrainingSessionStatus)).optional(),
			locationId: z.string().uuid().optional(),
			athleteGroupId: z.string().uuid().optional(),
			coachId: z.string().uuid().optional(),
			athleteId: z.string().uuid().optional(),
			dateRange: z
				.object({
					from: z.coerce.date(),
					to: z.coerce.date(),
				})
				.optional(),
			isRecurring: z.boolean().optional(),
		})
		.optional(),
});

// Get sessions for calendar view (date range required)
export const listTrainingSessionsForCalendarSchema = z.object({
	from: z.coerce.date(),
	to: z.coerce.date(),
	locationId: z.string().uuid().optional(),
	athleteGroupId: z.string().uuid().optional(),
	coachId: z.string().uuid().optional(),
	athleteId: z.string().uuid().optional(),
});

// Create training session
export const createTrainingSessionSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, "Title is required")
		.max(200, "Title is too long"),
	description: z
		.string()
		.trim()
		.max(5000, "Description is too long")
		.optional(),
	startTime: z.coerce.date(),
	endTime: z.coerce.date(),
	status: z
		.nativeEnum(TrainingSessionStatus)
		.default(TrainingSessionStatus.pending),
	locationId: z.string().uuid().optional().nullable(),
	// Assignment - either athleteGroupId OR athleteIds, not both
	athleteGroupId: z.string().uuid().optional().nullable(),
	// Service for this session (overrides group default)
	serviceId: z.string().uuid().optional().nullable(),
	athleteIds: z.array(z.string().uuid()).optional(),
	// Coaches (optional)
	coachIds: z.array(z.string().uuid()).optional(),
	primaryCoachId: z.string().uuid().optional(),
	// Recurring session config
	isRecurring: z.boolean().default(false),
	rrule: z.string().optional(), // RRule string for recurrence
	// Training content
	objectives: z.string().trim().max(5000, "Objectives is too long").optional(),
	planning: z.string().trim().max(10000, "Planning is too long").optional(),
});

// Update training session
export const updateTrainingSessionSchema = z.object({
	id: z.string().uuid(),
	title: z
		.string()
		.trim()
		.min(1, "Title is required")
		.max(200, "Title is too long")
		.optional(),
	description: z
		.string()
		.trim()
		.max(5000, "Description is too long")
		.optional()
		.nullable(),
	startTime: z.coerce.date().optional(),
	endTime: z.coerce.date().optional(),
	status: z.nativeEnum(TrainingSessionStatus).optional(),
	locationId: z.string().uuid().optional().nullable(),
	athleteGroupId: z.string().uuid().optional().nullable(),
	serviceId: z.string().uuid().optional().nullable(),
	objectives: z
		.string()
		.trim()
		.max(5000, "Objectives is too long")
		.optional()
		.nullable(),
	planning: z
		.string()
		.trim()
		.max(10000, "Planning is too long")
		.optional()
		.nullable(),
	postSessionNotes: z
		.string()
		.trim()
		.max(10000, "Notes is too long")
		.optional()
		.nullable(),
});

// Update session athletes
export const updateSessionAthletesSchema = z.object({
	sessionId: z.string().uuid(),
	athleteIds: z.array(z.string().uuid()),
});

// Update session coaches
export const updateSessionCoachesSchema = z.object({
	sessionId: z.string().uuid(),
	coachIds: z.array(z.string().uuid()),
	primaryCoachId: z.string().uuid().optional(),
});

// Delete training session
export const deleteTrainingSessionSchema = z.object({
	id: z.string().uuid(),
});

// Bulk delete training sessions
export const bulkDeleteTrainingSessionsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

// Bulk update training sessions status
export const bulkUpdateTrainingSessionsStatusSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
	status: z.nativeEnum(TrainingSessionStatus),
});

// Cancel a single occurrence of recurring session
export const cancelRecurringOccurrenceSchema = z.object({
	recurringSessionId: z.string().uuid(),
	occurrenceDate: z.coerce.date(),
});

// Modify a single occurrence of recurring session (creates a new session as replacement)
export const modifyRecurringOccurrenceSchema = z.object({
	recurringSessionId: z.string().uuid(),
	originalDate: z.coerce.date(),
	// New session data
	title: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(5000).optional().nullable(),
	startTime: z.coerce.date(),
	endTime: z.coerce.date(),
	locationId: z.string().uuid().optional().nullable(),
	objectives: z.string().trim().max(5000).optional().nullable(),
	planning: z.string().trim().max(10000).optional().nullable(),
});

// Complete session with post-session notes
export const completeSessionSchema = z.object({
	id: z.string().uuid(),
	postSessionNotes: z.string().trim().max(10000).optional(),
});

// ============================================================================
// ATTACHMENT SCHEMAS
// ============================================================================

// Allowed content types for attachments
export const AttachmentContentType = z.enum([
	"image/jpeg",
	"image/png",
	"application/pdf",
]);
export type AttachmentContentType = z.infer<typeof AttachmentContentType>;

// Get signed upload URL for session attachment
export const getSessionAttachmentUploadUrlSchema = z.object({
	sessionId: z.string().uuid(),
	filename: z.string().trim().min(1).max(255),
	contentType: AttachmentContentType,
});

// Update session attachment key after upload
export const updateSessionAttachmentSchema = z.object({
	sessionId: z.string().uuid(),
	attachmentKey: z.string().trim().min(1).max(500),
});

// Delete session attachment
export const deleteSessionAttachmentSchema = z.object({
	sessionId: z.string().uuid(),
});

// Get signed download URL for session attachment
export const getSessionAttachmentDownloadUrlSchema = z.object({
	sessionId: z.string().uuid(),
});

// Delete entire recurring series (template + all children)
export const deleteRecurringSeriesSchema = z.object({
	recurringSessionId: z.string().uuid(),
});

// Delete future occurrences of a recurring series
export const deleteFutureOccurrencesSchema = z.object({
	recurringSessionId: z.string().uuid(),
	afterDate: z.coerce.date(),
});

// Update recurring series (propagate changes to children)
export const updateRecurringSeriesSchema = z.object({
	recurringSessionId: z.string().uuid(),
	title: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(5000).optional().nullable(),
	locationId: z.string().uuid().optional().nullable(),
	objectives: z.string().trim().max(5000).optional().nullable(),
	planning: z.string().trim().max(10000).optional().nullable(),
	status: z.nativeEnum(TrainingSessionStatus).optional(),
	applyToFutureOnly: z.boolean().default(true),
});

// Type exports
export type ListTrainingSessionsInput = z.infer<
	typeof listTrainingSessionsSchema
>;
export type ListTrainingSessionsForCalendarInput = z.infer<
	typeof listTrainingSessionsForCalendarSchema
>;
export type CreateTrainingSessionInput = z.infer<
	typeof createTrainingSessionSchema
>;
export type UpdateTrainingSessionInput = z.infer<
	typeof updateTrainingSessionSchema
>;
export type UpdateSessionAthletesInput = z.infer<
	typeof updateSessionAthletesSchema
>;
export type UpdateSessionCoachesInput = z.infer<
	typeof updateSessionCoachesSchema
>;
export type DeleteTrainingSessionInput = z.infer<
	typeof deleteTrainingSessionSchema
>;
export type BulkDeleteTrainingSessionsInput = z.infer<
	typeof bulkDeleteTrainingSessionsSchema
>;
export type BulkUpdateTrainingSessionsStatusInput = z.infer<
	typeof bulkUpdateTrainingSessionsStatusSchema
>;
export type CancelRecurringOccurrenceInput = z.infer<
	typeof cancelRecurringOccurrenceSchema
>;
export type ModifyRecurringOccurrenceInput = z.infer<
	typeof modifyRecurringOccurrenceSchema
>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
export type GetSessionAttachmentUploadUrlInput = z.infer<
	typeof getSessionAttachmentUploadUrlSchema
>;
export type UpdateSessionAttachmentInput = z.infer<
	typeof updateSessionAttachmentSchema
>;
export type DeleteSessionAttachmentInput = z.infer<
	typeof deleteSessionAttachmentSchema
>;
export type GetSessionAttachmentDownloadUrlInput = z.infer<
	typeof getSessionAttachmentDownloadUrlSchema
>;
export type DeleteRecurringSeriesInput = z.infer<
	typeof deleteRecurringSeriesSchema
>;
export type DeleteFutureOccurrencesInput = z.infer<
	typeof deleteFutureOccurrencesSchema
>;
export type UpdateRecurringSeriesInput = z.infer<
	typeof updateRecurringSeriesSchema
>;
