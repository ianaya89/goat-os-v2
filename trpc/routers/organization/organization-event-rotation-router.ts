import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { EventTimeBlockType } from "@/lib/db/schema/enums";
import {
	eventGroupMemberTable,
	eventGroupTable,
	eventRegistrationTable,
	eventRotationAssignmentTable,
	eventRotationScheduleTable,
	eventStationStaffTable,
	eventStationTable,
	eventTimeBlockTable,
	sportsEventTable,
} from "@/lib/db/schema/tables";
import { env } from "@/lib/env";
import {
	generateStorageKey,
	getSignedUploadUrl,
	getSignedUrl,
} from "@/lib/storage/s3";
import {
	assignMembersToGroupSchema,
	assignStaffToStationSchema,
	autoAssignGroupsSchema,
	bulkSetRotationAssignmentsSchema,
	clearRotationAssignmentsSchema,
	createEventGroupSchema,
	createRotationScheduleSchema,
	createStationSchema,
	createTimeBlockSchema,
	deleteEventGroupSchema,
	deleteRotationScheduleSchema,
	deleteStationSchema,
	deleteTimeBlockSchema,
	generateScheduleSchema,
	getEventGroupSchema,
	getRotationOverviewSchema,
	getRotationScheduleSchema,
	getStationAttachmentDownloadUrlSchema,
	getStationAttachmentUploadUrlSchema,
	getStationSchema,
	listEventGroupsSchema,
	listStationsSchema,
	listTimeBlocksSchema,
	removeMemberFromGroupSchema,
	removeStaffFromStationSchema,
	setRotationAssignmentSchema,
	updateEventGroupSchema,
	updateRotationScheduleSchema,
	updateStationSchema,
	updateTimeBlockSchema,
} from "@/schemas/organization-event-rotation-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

// Helper to verify event belongs to organization
async function verifyEventOwnership(eventId: string, organizationId: string) {
	const event = await db.query.sportsEventTable.findFirst({
		where: and(
			eq(sportsEventTable.id, eventId),
			eq(sportsEventTable.organizationId, organizationId),
		),
	});
	if (!event) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
	}
	return event;
}

export const organizationEventRotationRouter = createTRPCRouter({
	// ============================================================================
	// EVENT GROUPS
	// ============================================================================

	listGroups: protectedOrganizationProcedure
		.input(listEventGroupsSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			return db.query.eventGroupTable.findMany({
				where: eq(eventGroupTable.eventId, input.eventId),
				orderBy: [asc(eventGroupTable.sortOrder), asc(eventGroupTable.name)],
				with: {
					leader: true,
					members: {
						with: {
							registration: true,
						},
					},
				},
			});
		}),

	getGroup: protectedOrganizationProcedure
		.input(getEventGroupSchema)
		.query(async ({ ctx, input }) => {
			const group = await db.query.eventGroupTable.findFirst({
				where: and(
					eq(eventGroupTable.id, input.id),
					eq(eventGroupTable.organizationId, ctx.organization.id),
				),
				with: {
					leader: true,
					members: {
						with: {
							registration: true,
						},
						orderBy: asc(eventGroupMemberTable.sortOrder),
					},
				},
			});

			if (!group) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
			}

			return group;
		}),

	createGroup: protectedOrganizationProcedure
		.input(createEventGroupSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			// Check for duplicate name
			const existing = await db.query.eventGroupTable.findFirst({
				where: and(
					eq(eventGroupTable.eventId, input.eventId),
					eq(eventGroupTable.name, input.name),
				),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A group with this name already exists for this event",
				});
			}

			const [group] = await db
				.insert(eventGroupTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
				})
				.returning();

			return group;
		}),

	updateGroup: protectedOrganizationProcedure
		.input(updateEventGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventGroupTable.findFirst({
				where: and(
					eq(eventGroupTable.id, input.id),
					eq(eventGroupTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventGroupTable)
				.set(updateData)
				.where(eq(eventGroupTable.id, id))
				.returning();

			return updated;
		}),

	deleteGroup: protectedOrganizationProcedure
		.input(deleteEventGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventGroupTable.findFirst({
				where: and(
					eq(eventGroupTable.id, input.id),
					eq(eventGroupTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
			}

			await db.delete(eventGroupTable).where(eq(eventGroupTable.id, input.id));
			return { success: true };
		}),

	// Group member management
	assignMembers: protectedOrganizationProcedure
		.input(assignMembersToGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const group = await db.query.eventGroupTable.findFirst({
				where: and(
					eq(eventGroupTable.id, input.groupId),
					eq(eventGroupTable.organizationId, ctx.organization.id),
				),
			});

			if (!group) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
			}

			// Verify all registrations exist and belong to the same event
			const registrations = await db.query.eventRegistrationTable.findMany({
				where: and(
					inArray(eventRegistrationTable.id, input.registrationIds),
					eq(eventRegistrationTable.eventId, group.eventId),
				),
			});

			if (registrations.length !== input.registrationIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Some registrations are invalid or do not belong to this event",
				});
			}

			// Get existing member count for sort order
			const existingCount = await db
				.select({ count: sql<number>`count(*)` })
				.from(eventGroupMemberTable)
				.where(eq(eventGroupMemberTable.groupId, input.groupId));

			let sortOrder = Number(existingCount[0]?.count || 0);

			// Insert members (ignore duplicates)
			const values = input.registrationIds.map((registrationId) => ({
				groupId: input.groupId,
				registrationId,
				sortOrder: sortOrder++,
				assignedBy: ctx.user.id,
			}));

			await db
				.insert(eventGroupMemberTable)
				.values(values)
				.onConflictDoNothing();

			return { success: true, assigned: values.length };
		}),

	removeMember: protectedOrganizationProcedure
		.input(removeMemberFromGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const group = await db.query.eventGroupTable.findFirst({
				where: and(
					eq(eventGroupTable.id, input.groupId),
					eq(eventGroupTable.organizationId, ctx.organization.id),
				),
			});

			if (!group) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
			}

			await db
				.delete(eventGroupMemberTable)
				.where(
					and(
						eq(eventGroupMemberTable.groupId, input.groupId),
						eq(eventGroupMemberTable.registrationId, input.registrationId),
					),
				);

			return { success: true };
		}),

	// Auto-assign athletes to groups
	autoAssignGroups: protectedOrganizationProcedure
		.input(autoAssignGroupsSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			// Get all confirmed registrations for this event
			const registrations = await db.query.eventRegistrationTable.findMany({
				where: and(
					eq(eventRegistrationTable.eventId, input.eventId),
					eq(eventRegistrationTable.status, "confirmed"),
				),
				orderBy:
					input.strategy === "alphabetical"
						? asc(eventRegistrationTable.registrantName)
						: undefined,
			});

			if (registrations.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No confirmed registrations found for this event",
				});
			}

			// Shuffle if random strategy
			const orderedRegistrations = [...registrations];
			if (input.strategy === "random") {
				for (let i = orderedRegistrations.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					const temp = orderedRegistrations[i]!;
					orderedRegistrations[i] = orderedRegistrations[j]!;
					orderedRegistrations[j] = temp;
				}
			}

			// Delete existing groups for this event
			await db
				.delete(eventGroupTable)
				.where(eq(eventGroupTable.eventId, input.eventId));

			// Create groups with colors
			const colors = [
				"#6366f1",
				"#10b981",
				"#f59e0b",
				"#ef4444",
				"#8b5cf6",
				"#06b6d4",
				"#ec4899",
				"#84cc16",
			];

			const groups = [];
			for (let i = 0; i < input.numberOfGroups; i++) {
				const [group] = await db
					.insert(eventGroupTable)
					.values({
						eventId: input.eventId,
						organizationId: ctx.organization.id,
						name: `Grupo ${String.fromCharCode(65 + i)}`, // A, B, C, ...
						color: colors[i % colors.length],
						sortOrder: i,
						createdBy: ctx.user.id,
					})
					.returning();
				groups.push(group);
			}

			// Distribute registrations across groups
			const membersPerGroup = Math.ceil(
				orderedRegistrations.length / input.numberOfGroups,
			);
			let groupIndex = 0;
			let memberCount = 0;

			for (const registration of orderedRegistrations) {
				if (memberCount >= membersPerGroup && groupIndex < groups.length - 1) {
					groupIndex++;
					memberCount = 0;
				}

				const currentGroup = groups[groupIndex];
				if (currentGroup) {
					await db.insert(eventGroupMemberTable).values({
						groupId: currentGroup.id,
						registrationId: registration.id,
						sortOrder: memberCount,
						assignedBy: ctx.user.id,
					});
				}

				memberCount++;
			}

			return { groups, totalAssigned: orderedRegistrations.length };
		}),

	// ============================================================================
	// STATIONS
	// ============================================================================

	listStations: protectedOrganizationProcedure
		.input(listStationsSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const conditions = [eq(eventStationTable.eventId, input.eventId)];
			if (!input.includeInactive) {
				conditions.push(eq(eventStationTable.isActive, true));
			}

			return db.query.eventStationTable.findMany({
				where: and(...conditions),
				orderBy: [
					asc(eventStationTable.sortOrder),
					asc(eventStationTable.name),
				],
				with: {
					zone: true,
					staff: {
						with: {
							staff: {
								with: {
									user: true,
								},
							},
						},
					},
				},
			});
		}),

	getStation: protectedOrganizationProcedure
		.input(getStationSchema)
		.query(async ({ ctx, input }) => {
			const station = await db.query.eventStationTable.findFirst({
				where: and(
					eq(eventStationTable.id, input.id),
					eq(eventStationTable.organizationId, ctx.organization.id),
				),
				with: {
					zone: true,
					staff: {
						with: {
							staff: {
								with: {
									user: true,
								},
							},
						},
					},
				},
			});

			if (!station) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Station not found",
				});
			}

			return station;
		}),

	createStation: protectedOrganizationProcedure
		.input(createStationSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const [station] = await db
				.insert(eventStationTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
				})
				.returning();

			return station;
		}),

	updateStation: protectedOrganizationProcedure
		.input(updateStationSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventStationTable.findFirst({
				where: and(
					eq(eventStationTable.id, input.id),
					eq(eventStationTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Station not found",
				});
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventStationTable)
				.set(updateData)
				.where(eq(eventStationTable.id, id))
				.returning();

			return updated;
		}),

	deleteStation: protectedOrganizationProcedure
		.input(deleteStationSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventStationTable.findFirst({
				where: and(
					eq(eventStationTable.id, input.id),
					eq(eventStationTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Station not found",
				});
			}

			await db
				.delete(eventStationTable)
				.where(eq(eventStationTable.id, input.id));
			return { success: true };
		}),

	// Staff assignment to stations
	assignStaffToStation: protectedOrganizationProcedure
		.input(assignStaffToStationSchema)
		.mutation(async ({ ctx, input }) => {
			const station = await db.query.eventStationTable.findFirst({
				where: and(
					eq(eventStationTable.id, input.stationId),
					eq(eventStationTable.organizationId, ctx.organization.id),
				),
			});

			if (!station) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Station not found",
				});
			}

			const [assignment] = await db
				.insert(eventStationStaffTable)
				.values({
					stationId: input.stationId,
					staffId: input.staffId,
					roleAtStation: input.roleAtStation,
					isPrimary: input.isPrimary,
					notes: input.notes,
				})
				.onConflictDoUpdate({
					target: [
						eventStationStaffTable.stationId,
						eventStationStaffTable.staffId,
					],
					set: {
						roleAtStation: input.roleAtStation,
						isPrimary: input.isPrimary,
						notes: input.notes,
					},
				})
				.returning();

			return assignment;
		}),

	removeStaffFromStation: protectedOrganizationProcedure
		.input(removeStaffFromStationSchema)
		.mutation(async ({ ctx, input }) => {
			const station = await db.query.eventStationTable.findFirst({
				where: and(
					eq(eventStationTable.id, input.stationId),
					eq(eventStationTable.organizationId, ctx.organization.id),
				),
			});

			if (!station) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Station not found",
				});
			}

			await db
				.delete(eventStationStaffTable)
				.where(
					and(
						eq(eventStationStaffTable.stationId, input.stationId),
						eq(eventStationStaffTable.staffId, input.staffId),
					),
				);

			return { success: true };
		}),

	// Station attachment upload
	getStationAttachmentUploadUrl: protectedOrganizationProcedure
		.input(getStationAttachmentUploadUrlSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify station belongs to organization
			const station = await db.query.eventStationTable.findFirst({
				where: and(
					eq(eventStationTable.id, input.stationId),
					eq(eventStationTable.organizationId, ctx.organization.id),
				),
			});

			if (!station) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Station not found",
				});
			}

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			// Generate unique storage key
			const key = generateStorageKey(
				"station-attachments",
				ctx.organization.id,
				input.filename,
			);

			// Generate signed upload URL
			const uploadUrl = await getSignedUploadUrl(key, bucket, {
				contentType: input.contentType,
				expiresIn: 300, // 5 minutes to upload
			});

			return {
				uploadUrl,
				key,
			};
		}),

	getStationAttachmentDownloadUrl: protectedOrganizationProcedure
		.input(getStationAttachmentDownloadUrlSchema)
		.query(async ({ ctx, input }) => {
			// Verify station belongs to organization
			const station = await db.query.eventStationTable.findFirst({
				where: and(
					eq(eventStationTable.id, input.stationId),
					eq(eventStationTable.organizationId, ctx.organization.id),
				),
			});

			if (!station) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Station not found",
				});
			}

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			// Generate signed download URL
			const downloadUrl = await getSignedUrl(input.attachmentKey, bucket, {
				expiresIn: 3600, // 1 hour
			});

			return { downloadUrl };
		}),

	// ============================================================================
	// ROTATION SCHEDULE
	// ============================================================================

	getSchedule: protectedOrganizationProcedure
		.input(getRotationScheduleSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			return db.query.eventRotationScheduleTable.findFirst({
				where: eq(eventRotationScheduleTable.eventId, input.eventId),
				with: {
					timeBlocks: {
						orderBy: asc(eventTimeBlockTable.blockOrder),
						with: {
							assignments: {
								with: {
									group: true,
									station: true,
								},
							},
						},
					},
				},
			});
		}),

	createSchedule: protectedOrganizationProcedure
		.input(createRotationScheduleSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			// Check if schedule already exists
			const existing = await db.query.eventRotationScheduleTable.findFirst({
				where: eq(eventRotationScheduleTable.eventId, input.eventId),
			});

			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A schedule already exists for this event",
				});
			}

			const [schedule] = await db
				.insert(eventRotationScheduleTable)
				.values({
					...input,
					organizationId: ctx.organization.id,
					createdBy: ctx.user.id,
				})
				.returning();

			return schedule;
		}),

	updateSchedule: protectedOrganizationProcedure
		.input(updateRotationScheduleSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventRotationScheduleTable.findFirst({
				where: and(
					eq(eventRotationScheduleTable.id, input.id),
					eq(eventRotationScheduleTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Schedule not found",
				});
			}

			if (existing.isLocked) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Schedule is locked and cannot be modified",
				});
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventRotationScheduleTable)
				.set(updateData)
				.where(eq(eventRotationScheduleTable.id, id))
				.returning();

			return updated;
		}),

	deleteSchedule: protectedOrganizationProcedure
		.input(deleteRotationScheduleSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventRotationScheduleTable.findFirst({
				where: and(
					eq(eventRotationScheduleTable.eventId, input.eventId),
					eq(eventRotationScheduleTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Schedule not found",
				});
			}

			await db
				.delete(eventRotationScheduleTable)
				.where(eq(eventRotationScheduleTable.id, existing.id));
			return { success: true };
		}),

	// ============================================================================
	// TIME BLOCKS
	// ============================================================================

	listTimeBlocks: protectedOrganizationProcedure
		.input(listTimeBlocksSchema)
		.query(async ({ ctx, input }) => {
			const schedule = await db.query.eventRotationScheduleTable.findFirst({
				where: and(
					eq(eventRotationScheduleTable.id, input.scheduleId),
					eq(eventRotationScheduleTable.organizationId, ctx.organization.id),
				),
			});

			if (!schedule) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Schedule not found",
				});
			}

			return db.query.eventTimeBlockTable.findMany({
				where: eq(eventTimeBlockTable.scheduleId, input.scheduleId),
				orderBy: asc(eventTimeBlockTable.blockOrder),
				with: {
					zone: true,
					assignments: {
						with: {
							group: true,
							station: true,
						},
					},
				},
			});
		}),

	createTimeBlock: protectedOrganizationProcedure
		.input(createTimeBlockSchema)
		.mutation(async ({ ctx, input }) => {
			const schedule = await db.query.eventRotationScheduleTable.findFirst({
				where: and(
					eq(eventRotationScheduleTable.id, input.scheduleId),
					eq(eventRotationScheduleTable.organizationId, ctx.organization.id),
				),
			});

			if (!schedule) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Schedule not found",
				});
			}

			if (schedule.isLocked) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Schedule is locked",
				});
			}

			const [block] = await db
				.insert(eventTimeBlockTable)
				.values(input)
				.returning();

			return block;
		}),

	updateTimeBlock: protectedOrganizationProcedure
		.input(updateTimeBlockSchema)
		.mutation(async ({ ctx, input }) => {
			const block = await db.query.eventTimeBlockTable.findFirst({
				where: eq(eventTimeBlockTable.id, input.id),
				with: {
					schedule: true,
				},
			});

			if (!block || block.schedule.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Time block not found",
				});
			}

			if (block.schedule.isLocked) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Schedule is locked",
				});
			}

			const { id, ...updateData } = input;

			const [updated] = await db
				.update(eventTimeBlockTable)
				.set(updateData)
				.where(eq(eventTimeBlockTable.id, id))
				.returning();

			return updated;
		}),

	deleteTimeBlock: protectedOrganizationProcedure
		.input(deleteTimeBlockSchema)
		.mutation(async ({ ctx, input }) => {
			const block = await db.query.eventTimeBlockTable.findFirst({
				where: eq(eventTimeBlockTable.id, input.id),
				with: {
					schedule: true,
				},
			});

			if (!block || block.schedule.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Time block not found",
				});
			}

			if (block.schedule.isLocked) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Schedule is locked",
				});
			}

			await db
				.delete(eventTimeBlockTable)
				.where(eq(eventTimeBlockTable.id, input.id));
			return { success: true };
		}),

	// ============================================================================
	// ROTATION ASSIGNMENTS
	// ============================================================================

	setAssignment: protectedOrganizationProcedure
		.input(setRotationAssignmentSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify time block exists and belongs to org
			const block = await db.query.eventTimeBlockTable.findFirst({
				where: eq(eventTimeBlockTable.id, input.timeBlockId),
				with: {
					schedule: true,
				},
			});

			if (!block || block.schedule.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Time block not found",
				});
			}

			if (block.schedule.isLocked) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Schedule is locked",
				});
			}

			// Upsert assignment
			const [assignment] = await db
				.insert(eventRotationAssignmentTable)
				.values({
					timeBlockId: input.timeBlockId,
					groupId: input.groupId,
					stationId: input.stationId,
					notes: input.notes,
				})
				.onConflictDoUpdate({
					target: [
						eventRotationAssignmentTable.timeBlockId,
						eventRotationAssignmentTable.groupId,
					],
					set: {
						stationId: input.stationId,
						notes: input.notes,
					},
				})
				.returning();

			return assignment;
		}),

	bulkSetAssignments: protectedOrganizationProcedure
		.input(bulkSetRotationAssignmentsSchema)
		.mutation(async ({ ctx, input }) => {
			const block = await db.query.eventTimeBlockTable.findFirst({
				where: eq(eventTimeBlockTable.id, input.timeBlockId),
				with: {
					schedule: true,
				},
			});

			if (!block || block.schedule.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Time block not found",
				});
			}

			if (block.schedule.isLocked) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Schedule is locked",
				});
			}

			// Clear existing assignments
			await db
				.delete(eventRotationAssignmentTable)
				.where(eq(eventRotationAssignmentTable.timeBlockId, input.timeBlockId));

			// Insert new assignments
			if (input.assignments.length > 0) {
				await db.insert(eventRotationAssignmentTable).values(
					input.assignments.map((a) => ({
						timeBlockId: input.timeBlockId,
						groupId: a.groupId,
						stationId: a.stationId,
					})),
				);
			}

			return { success: true, count: input.assignments.length };
		}),

	clearAssignments: protectedOrganizationProcedure
		.input(clearRotationAssignmentsSchema)
		.mutation(async ({ ctx, input }) => {
			const block = await db.query.eventTimeBlockTable.findFirst({
				where: eq(eventTimeBlockTable.id, input.timeBlockId),
				with: {
					schedule: true,
				},
			});

			if (!block || block.schedule.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Time block not found",
				});
			}

			if (block.schedule.isLocked) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Schedule is locked",
				});
			}

			await db
				.delete(eventRotationAssignmentTable)
				.where(eq(eventRotationAssignmentTable.timeBlockId, input.timeBlockId));

			return { success: true };
		}),

	// ============================================================================
	// SCHEDULE GENERATION
	// ============================================================================

	generateSchedule: protectedOrganizationProcedure
		.input(generateScheduleSchema)
		.mutation(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			// Get groups and stations
			const groups = await db.query.eventGroupTable.findMany({
				where: eq(eventGroupTable.eventId, input.eventId),
				orderBy: asc(eventGroupTable.sortOrder),
			});

			const stations = await db.query.eventStationTable.findMany({
				where: and(
					eq(eventStationTable.eventId, input.eventId),
					eq(eventStationTable.isActive, true),
				),
				orderBy: asc(eventStationTable.sortOrder),
			});

			if (groups.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No groups defined for this event",
				});
			}

			if (stations.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No active stations defined for this event",
				});
			}

			if (groups.length !== stations.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Number of groups (${groups.length}) must match number of stations (${stations.length})`,
				});
			}

			// Delete existing schedule if exists
			await db
				.delete(eventRotationScheduleTable)
				.where(eq(eventRotationScheduleTable.eventId, input.eventId));

			// Create schedule
			const [schedule] = await db
				.insert(eventRotationScheduleTable)
				.values({
					eventId: input.eventId,
					organizationId: ctx.organization.id,
					scheduleDate: input.scheduleDate,
					startTime: input.startTime,
					endTime: input.endTime,
					defaultRotationDuration: input.rotationDuration,
					createdBy: ctx.user.id,
				})
				.returning();

			if (!schedule) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create schedule",
				});
			}

			// Build time blocks
			type InterruptionBlock = {
				name: string;
				startTime: Date;
				endTime: Date;
				description?: string;
				type:
					| typeof EventTimeBlockType.break
					| typeof EventTimeBlockType.generalActivity;
			};
			const allInterruptions: InterruptionBlock[] = [
				...(input.breaks || []).map((b) => ({
					...b,
					type: EventTimeBlockType.break,
				})),
				...(input.generalActivities || []).map((a) => ({
					...a,
					type: EventTimeBlockType.generalActivity,
				})),
			].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

			let currentTime = input.startTime;
			let blockOrder = 0;
			let rotationNumber = 0;
			const timeBlocks: (typeof eventTimeBlockTable.$inferInsert)[] = [];

			while (currentTime < input.endTime) {
				// Check for interruption at current time
				const interruption = allInterruptions.find(
					(i) => i.startTime.getTime() === currentTime.getTime(),
				);

				if (interruption) {
					const durationMs =
						interruption.endTime.getTime() - interruption.startTime.getTime();
					const durationMinutes = Math.round(durationMs / 60000);

					timeBlocks.push({
						scheduleId: schedule.id,
						blockType: interruption.type,
						name: interruption.name,
						description:
							"description" in interruption ? interruption.description : null,
						startTime: interruption.startTime,
						endTime: interruption.endTime,
						durationMinutes,
						blockOrder: blockOrder++,
						color:
							interruption.type === EventTimeBlockType.break
								? "#9ca3af"
								: "#f59e0b",
					});

					currentTime = interruption.endTime;
				} else {
					// Create rotation block
					rotationNumber++;
					const blockEndTime = new Date(
						Math.min(
							currentTime.getTime() + input.rotationDuration * 60000,
							input.endTime.getTime(),
						),
					);

					// Check if there's an interruption before block end
					const nextInterruption = allInterruptions.find(
						(i) =>
							i.startTime.getTime() > currentTime.getTime() &&
							i.startTime.getTime() < blockEndTime.getTime(),
					);

					const actualEndTime = nextInterruption
						? nextInterruption.startTime
						: blockEndTime;
					const durationMs = actualEndTime.getTime() - currentTime.getTime();
					const durationMinutes = Math.round(durationMs / 60000);

					if (durationMinutes > 0) {
						timeBlocks.push({
							scheduleId: schedule.id,
							blockType: EventTimeBlockType.stationRotation,
							name: `Rotación ${rotationNumber}`,
							startTime: currentTime,
							endTime: actualEndTime,
							durationMinutes,
							blockOrder: blockOrder++,
							rotationNumber,
						});
					}

					currentTime = actualEndTime;
				}
			}

			// Insert time blocks
			const insertedBlocks = await db
				.insert(eventTimeBlockTable)
				.values(timeBlocks)
				.returning();

			// Generate rotation assignments for station_rotation blocks
			const rotationBlocks = insertedBlocks.filter(
				(b) => b.blockType === EventTimeBlockType.stationRotation,
			);

			const assignments: (typeof eventRotationAssignmentTable.$inferInsert)[] =
				[];

			for (const block of rotationBlocks) {
				const rotation = block.rotationNumber || 1;
				for (let i = 0; i < groups.length; i++) {
					// Circular rotation: shift by rotation number
					const stationIndex = (i + rotation - 1) % stations.length;
					const group = groups[i];
					const station = stations[stationIndex];
					if (group && station) {
						assignments.push({
							timeBlockId: block.id,
							groupId: group.id,
							stationId: station.id,
						});
					}
				}
			}

			if (assignments.length > 0) {
				await db.insert(eventRotationAssignmentTable).values(assignments);
			}

			// Update schedule with total rotations
			await db
				.update(eventRotationScheduleTable)
				.set({ totalRotations: rotationBlocks.length })
				.where(eq(eventRotationScheduleTable.id, schedule.id));

			return {
				schedule,
				timeBlocks: insertedBlocks,
				totalRotations: rotationBlocks.length,
			};
		}),

	// ============================================================================
	// OVERVIEW
	// ============================================================================

	getOverview: protectedOrganizationProcedure
		.input(getRotationOverviewSchema)
		.query(async ({ ctx, input }) => {
			await verifyEventOwnership(input.eventId, ctx.organization.id);

			const [groups, stations, schedule] = await Promise.all([
				db.query.eventGroupTable.findMany({
					where: eq(eventGroupTable.eventId, input.eventId),
					orderBy: asc(eventGroupTable.sortOrder),
					with: {
						leader: true,
						members: {
							with: {
								registration: true,
							},
						},
					},
				}),
				db.query.eventStationTable.findMany({
					where: and(
						eq(eventStationTable.eventId, input.eventId),
						eq(eventStationTable.isActive, true),
					),
					orderBy: asc(eventStationTable.sortOrder),
					with: {
						staff: {
							with: {
								staff: true,
							},
						},
					},
				}),
				db.query.eventRotationScheduleTable.findFirst({
					where: eq(eventRotationScheduleTable.eventId, input.eventId),
					with: {
						timeBlocks: {
							orderBy: asc(eventTimeBlockTable.blockOrder),
							with: {
								zone: true,
								assignments: {
									with: {
										group: true,
										station: true,
									},
								},
							},
						},
					},
				}),
			]);

			return {
				groups,
				stations,
				schedule,
			};
		}),
});
