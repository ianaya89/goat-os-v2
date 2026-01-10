import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	athleteTable,
	attendanceTable,
	trainingSessionTable,
} from "@/lib/db/schema/tables";
import {
	bulkRecordAttendanceSchema,
	deleteAttendanceSchema,
	getAthleteAttendanceSchema,
	getSessionAttendanceSchema,
	recordAttendanceSchema,
	updateAttendanceSchema,
} from "@/schemas/organization-attendance-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationAttendanceRouter = createTRPCRouter({
	// Get attendance records for a session
	getSessionAttendance: protectedOrganizationProcedure
		.input(getSessionAttendanceSchema)
		.query(async ({ ctx, input }) => {
			// Verify session belongs to organization
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.sessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Training session not found",
				});
			}

			const attendance = await db.query.attendanceTable.findMany({
				where: eq(attendanceTable.sessionId, input.sessionId),
				with: {
					athlete: {
						with: {
							user: {
								columns: { id: true, name: true, email: true, image: true },
							},
						},
					},
					recordedByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			return attendance;
		}),

	// Get attendance history for an athlete
	getAthleteAttendance: protectedOrganizationProcedure
		.input(getAthleteAttendanceSchema)
		.query(async ({ ctx, input }) => {
			// Verify athlete belongs to organization
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.id, input.athleteId),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
			});

			if (!athlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete not found",
				});
			}

			const conditions = [eq(attendanceTable.athleteId, input.athleteId)];

			if (input.dateRange) {
				conditions.push(gte(attendanceTable.createdAt, input.dateRange.from));
				conditions.push(lte(attendanceTable.createdAt, input.dateRange.to));
			}

			const attendance = await db.query.attendanceTable.findMany({
				where: and(...conditions),
				limit: input.limit,
				offset: input.offset,
				orderBy: desc(attendanceTable.createdAt),
				with: {
					session: {
						columns: { id: true, title: true, startTime: true },
					},
				},
			});

			return attendance;
		}),

	// Record single attendance
	record: protectedOrganizationProcedure
		.input(recordAttendanceSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify session belongs to organization
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.sessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Training session not found",
				});
			}

			// Verify athlete belongs to organization
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.id, input.athleteId),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
			});

			if (!athlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete not found",
				});
			}

			// Check if attendance already exists
			const existingAttendance = await db.query.attendanceTable.findFirst({
				where: and(
					eq(attendanceTable.sessionId, input.sessionId),
					eq(attendanceTable.athleteId, input.athleteId),
				),
			});

			if (existingAttendance) {
				// Update existing
				const [updated] = await db
					.update(attendanceTable)
					.set({
						status: input.status,
						notes: input.notes,
						checkedInAt: input.checkedInAt,
						recordedBy: ctx.user.id,
					})
					.where(eq(attendanceTable.id, existingAttendance.id))
					.returning();

				return updated;
			}

			// Create new
			const [attendance] = await db
				.insert(attendanceTable)
				.values({
					sessionId: input.sessionId,
					athleteId: input.athleteId,
					status: input.status,
					notes: input.notes,
					checkedInAt: input.checkedInAt,
					recordedBy: ctx.user.id,
				})
				.returning();

			return attendance;
		}),

	// Bulk record attendance for a session
	bulkRecord: protectedOrganizationProcedure
		.input(bulkRecordAttendanceSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify session belongs to organization
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.sessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Training session not found",
				});
			}

			const athleteIds = input.records.map((r) => r.athleteId);

			// Verify all athletes belong to organization
			const athletes = await db.query.athleteTable.findMany({
				where: and(
					inArray(athleteTable.id, athleteIds),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
				columns: { id: true },
			});

			const validAthleteIds = new Set(athletes.map((a) => a.id));
			const validRecords = input.records.filter((r) =>
				validAthleteIds.has(r.athleteId),
			);

			if (validRecords.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No valid athletes provided",
				});
			}

			// Delete existing attendance for this session
			await db
				.delete(attendanceTable)
				.where(eq(attendanceTable.sessionId, input.sessionId));

			// Insert all records
			const inserted = await db
				.insert(attendanceTable)
				.values(
					validRecords.map((record) => ({
						sessionId: input.sessionId,
						athleteId: record.athleteId,
						status: record.status,
						notes: record.notes,
						recordedBy: ctx.user.id,
					})),
				)
				.returning();

			return { success: true, count: inserted.length };
		}),

	// Update attendance
	update: protectedOrganizationProcedure
		.input(updateAttendanceSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Verify attendance record exists and session belongs to organization
			const attendance = await db.query.attendanceTable.findFirst({
				where: eq(attendanceTable.id, id),
				with: {
					session: {
						columns: { organizationId: true },
					},
				},
			});

			if (!attendance || attendance.session.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attendance record not found",
				});
			}

			const [updated] = await db
				.update(attendanceTable)
				.set({
					...data,
					recordedBy: ctx.user.id,
				})
				.where(eq(attendanceTable.id, id))
				.returning();

			return updated;
		}),

	// Delete attendance
	delete: protectedOrganizationProcedure
		.input(deleteAttendanceSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify attendance record exists and session belongs to organization
			const attendance = await db.query.attendanceTable.findFirst({
				where: eq(attendanceTable.id, input.id),
				with: {
					session: {
						columns: { organizationId: true },
					},
				},
			});

			if (!attendance || attendance.session.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Attendance record not found",
				});
			}

			await db.delete(attendanceTable).where(eq(attendanceTable.id, input.id));

			return { success: true };
		}),
});
