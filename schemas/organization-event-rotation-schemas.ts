import { z } from "zod/v4";
import { EventTimeBlockType } from "@/lib/db/schema/enums";

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const eventIdSchema = z.object({
	eventId: z.string().uuid(),
});

// ============================================================================
// EVENT GROUP SCHEMAS
// ============================================================================

export const listEventGroupsSchema = z.object({
	eventId: z.string().uuid(),
});

export const getEventGroupSchema = z.object({
	id: z.string().uuid(),
});

export const createEventGroupSchema = z.object({
	eventId: z.string().uuid(),
	name: z.string().trim().min(1, "Name is required").max(200),
	description: z.string().trim().max(2000).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
		.default("#6366f1"),
	sortOrder: z.number().int().default(0),
	leaderId: z.string().uuid().optional(),
	maxCapacity: z.number().int().positive().optional(),
});

export const updateEventGroupSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	sortOrder: z.number().int().optional(),
	leaderId: z.string().uuid().optional().nullable(),
	maxCapacity: z.number().int().positive().optional().nullable(),
});

export const deleteEventGroupSchema = z.object({
	id: z.string().uuid(),
});

// Group member management
export const assignMembersToGroupSchema = z.object({
	groupId: z.string().uuid(),
	registrationIds: z.array(z.string().uuid()),
});

export const removeMemberFromGroupSchema = z.object({
	groupId: z.string().uuid(),
	registrationId: z.string().uuid(),
});

// Auto-assign athletes to groups
export const autoAssignGroupsSchema = z.object({
	eventId: z.string().uuid(),
	numberOfGroups: z.number().int().min(2).max(50),
	strategy: z
		.enum(["random", "alphabetical", "age_category"])
		.default("random"),
});

// ============================================================================
// EVENT STATION SCHEMAS
// ============================================================================

// Station content structure
const stationMaterialSchema = z.object({
	name: z.string(),
	quantity: z.number().int().positive(),
	checked: z.boolean().default(false),
});

const stationAttachmentSchema = z.object({
	key: z.string(),
	name: z.string(),
	type: z.string(),
});

const stationContentSchema = z.object({
	instructions: z.string().optional(),
	staffInstructions: z.string().optional(),
	materials: z.array(stationMaterialSchema).optional(),
	attachments: z.array(stationAttachmentSchema).optional(),
});

export type StationContent = z.infer<typeof stationContentSchema>;

export const listStationsSchema = z.object({
	eventId: z.string().uuid(),
	includeInactive: z.boolean().default(false),
});

export const getStationSchema = z.object({
	id: z.string().uuid(),
});

export const createStationSchema = z.object({
	eventId: z.string().uuid(),
	name: z.string().trim().min(1, "Name is required").max(200),
	description: z.string().trim().max(2000).optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
		.default("#10b981"),
	content: stationContentSchema.optional(),
	capacity: z.number().int().positive().optional(),
	zoneId: z.string().uuid().optional(),
	locationNotes: z.string().trim().max(500).optional(),
	sortOrder: z.number().int().default(0),
});

export const updateStationSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().min(1).max(200).optional(),
	description: z.string().trim().max(2000).optional().nullable(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
	content: stationContentSchema.optional().nullable(),
	capacity: z.number().int().positive().optional().nullable(),
	zoneId: z.string().uuid().optional().nullable(),
	locationNotes: z.string().trim().max(500).optional().nullable(),
	sortOrder: z.number().int().optional(),
	isActive: z.boolean().optional(),
});

export const deleteStationSchema = z.object({
	id: z.string().uuid(),
});

// Staff assignment to stations
export const assignStaffToStationSchema = z.object({
	stationId: z.string().uuid(),
	staffId: z.string().uuid(),
	roleAtStation: z.string().trim().max(100).optional(),
	isPrimary: z.boolean().default(false),
	notes: z.string().trim().max(500).optional(),
});

export const removeStaffFromStationSchema = z.object({
	stationId: z.string().uuid(),
	staffId: z.string().uuid(),
});

// Attachment upload for stations
export const getStationAttachmentUploadUrlSchema = z.object({
	stationId: z.string().uuid(),
	filename: z.string().min(1).max(255),
	contentType: z.enum([
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	]),
});

export const getStationAttachmentDownloadUrlSchema = z.object({
	stationId: z.string().uuid(),
	attachmentKey: z.string().min(1),
});

// ============================================================================
// ROTATION SCHEDULE SCHEMAS
// ============================================================================

export const getRotationScheduleSchema = z.object({
	eventId: z.string().uuid(),
});

export const createRotationScheduleSchema = z.object({
	eventId: z.string().uuid(),
	name: z.string().trim().max(200).optional(),
	scheduleDate: z.coerce.date(),
	startTime: z.coerce.date(),
	endTime: z.coerce.date(),
	defaultRotationDuration: z.number().int().min(5).max(180).default(30),
	notes: z.string().trim().max(2000).optional(),
});

export const updateRotationScheduleSchema = z.object({
	id: z.string().uuid(),
	name: z.string().trim().max(200).optional(),
	scheduleDate: z.coerce.date().optional(),
	startTime: z.coerce.date().optional(),
	endTime: z.coerce.date().optional(),
	defaultRotationDuration: z.number().int().min(5).max(180).optional(),
	isPublished: z.boolean().optional(),
	isLocked: z.boolean().optional(),
	notes: z.string().trim().max(2000).optional().nullable(),
});

export const deleteRotationScheduleSchema = z.object({
	eventId: z.string().uuid(),
});

// ============================================================================
// TIME BLOCK SCHEMAS
// ============================================================================

export const listTimeBlocksSchema = z.object({
	scheduleId: z.string().uuid(),
});

export const createTimeBlockSchema = z.object({
	scheduleId: z.string().uuid(),
	blockType: z.nativeEnum(EventTimeBlockType),
	name: z.string().trim().max(200).optional(),
	description: z.string().trim().max(2000).optional(),
	startTime: z.coerce.date(),
	endTime: z.coerce.date(),
	durationMinutes: z.number().int().min(1),
	blockOrder: z.number().int(),
	rotationNumber: z.number().int().positive().optional(),
	zoneId: z.string().uuid().optional(), // For breaks: which zone is this break in
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional(),
});

export const updateTimeBlockSchema = z.object({
	id: z.string().uuid(),
	blockType: z.nativeEnum(EventTimeBlockType).optional(),
	name: z.string().trim().max(200).optional().nullable(),
	description: z.string().trim().max(2000).optional().nullable(),
	startTime: z.coerce.date().optional(),
	endTime: z.coerce.date().optional(),
	durationMinutes: z.number().int().min(1).optional(),
	blockOrder: z.number().int().optional(),
	zoneId: z.string().uuid().optional().nullable(), // For breaks: which zone is this break in
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional()
		.nullable(),
});

export const deleteTimeBlockSchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// ROTATION ASSIGNMENT SCHEMAS
// ============================================================================

export const setRotationAssignmentSchema = z.object({
	timeBlockId: z.string().uuid(),
	groupId: z.string().uuid(),
	stationId: z.string().uuid(),
	notes: z.string().trim().max(500).optional(),
});

export const bulkSetRotationAssignmentsSchema = z.object({
	timeBlockId: z.string().uuid(),
	assignments: z.array(
		z.object({
			groupId: z.string().uuid(),
			stationId: z.string().uuid(),
		}),
	),
});

export const clearRotationAssignmentsSchema = z.object({
	timeBlockId: z.string().uuid(),
});

// ============================================================================
// SCHEDULE GENERATION SCHEMAS
// ============================================================================

const scheduleBreakSchema = z.object({
	name: z.string(),
	startTime: z.coerce.date(),
	endTime: z.coerce.date(),
});

const scheduleActivitySchema = z.object({
	name: z.string(),
	startTime: z.coerce.date(),
	endTime: z.coerce.date(),
	description: z.string().optional(),
});

export const generateScheduleSchema = z.object({
	eventId: z.string().uuid(),
	scheduleDate: z.coerce.date(),
	startTime: z.coerce.date(),
	endTime: z.coerce.date(),
	rotationDuration: z.number().int().min(5).max(180),
	breaks: z.array(scheduleBreakSchema).optional(),
	generalActivities: z.array(scheduleActivitySchema).optional(),
	rotationStrategy: z.enum(["sequential", "balanced"]).default("sequential"),
});

// ============================================================================
// OVERVIEW/FULL DATA SCHEMAS
// ============================================================================

export const getRotationOverviewSchema = z.object({
	eventId: z.string().uuid(),
});
