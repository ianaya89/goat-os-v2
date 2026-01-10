import { z } from "zod/v4";
import { AttendanceStatus } from "@/lib/db/schema/enums";

// Get attendance for a session
export const getSessionAttendanceSchema = z.object({
	sessionId: z.string().uuid(),
});

// Get attendance history for an athlete
export const getAthleteAttendanceSchema = z.object({
	athleteId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	dateRange: z
		.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		})
		.optional(),
});

// Record single attendance
export const recordAttendanceSchema = z.object({
	sessionId: z.string().uuid(),
	athleteId: z.string().uuid(),
	status: z.nativeEnum(AttendanceStatus),
	notes: z.string().trim().max(1000, "Notes is too long").optional(),
	checkedInAt: z.coerce.date().optional(),
});

// Bulk record attendance for a session (all athletes at once)
export const bulkRecordAttendanceSchema = z.object({
	sessionId: z.string().uuid(),
	records: z.array(
		z.object({
			athleteId: z.string().uuid(),
			status: z.nativeEnum(AttendanceStatus),
			notes: z.string().trim().max(1000).optional(),
		}),
	),
});

// Update attendance
export const updateAttendanceSchema = z.object({
	id: z.string().uuid(),
	status: z.nativeEnum(AttendanceStatus).optional(),
	notes: z.string().trim().max(1000, "Notes is too long").optional().nullable(),
	checkedInAt: z.coerce.date().optional().nullable(),
});

// Delete attendance
export const deleteAttendanceSchema = z.object({
	id: z.string().uuid(),
});

// Type exports
export type GetSessionAttendanceInput = z.infer<
	typeof getSessionAttendanceSchema
>;
export type GetAthleteAttendanceInput = z.infer<
	typeof getAthleteAttendanceSchema
>;
export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
export type BulkRecordAttendanceInput = z.infer<
	typeof bulkRecordAttendanceSchema
>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type DeleteAttendanceInput = z.infer<typeof deleteAttendanceSchema>;
