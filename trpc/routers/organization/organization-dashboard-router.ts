import { and, count, eq, gte, lte, sql, sum } from "drizzle-orm";
import {
	athleteGroupMemberTable,
	athleteGroupTable,
	athleteTable,
	attendanceTable,
	coachTable,
	db,
	locationTable,
	trainingSessionTable,
} from "@/lib/db";
import {
	AthleteStatus,
	AttendanceStatus,
	CoachStatus,
	TrainingPaymentStatus,
	TrainingSessionStatus,
	WaitlistEntryStatus,
} from "@/lib/db/schema";
import {
	sportsEventTable,
	trainingPaymentTable,
	waitlistEntryTable,
} from "@/lib/db/schema/tables";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

// Helper functions for date ranges
function getStartOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function getEndOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d;
}

function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function getEndOfWeek(date: Date): Date {
	const start = getStartOfWeek(date);
	const d = new Date(start);
	d.setDate(d.getDate() + 6);
	d.setHours(23, 59, 59, 999);
	return d;
}

export const organizationDashboardRouter = createTRPCRouter({
	getStats: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const organizationId = ctx.organization.id;

		// Get counts in parallel
		const [
			totalAthletes,
			activeAthletes,
			totalCoaches,
			activeCoaches,
			totalGroups,
			activeGroups,
			totalSessions,
			completedSessions,
			pendingSessions,
		] = await Promise.all([
			// Total athletes
			db
				.select({ count: count() })
				.from(athleteTable)
				.where(eq(athleteTable.organizationId, organizationId))
				.then((r) => r[0]?.count ?? 0),

			// Active athletes
			db
				.select({ count: count() })
				.from(athleteTable)
				.where(
					and(
						eq(athleteTable.organizationId, organizationId),
						eq(athleteTable.status, AthleteStatus.active),
					),
				)
				.then((r) => r[0]?.count ?? 0),

			// Total coaches
			db
				.select({ count: count() })
				.from(coachTable)
				.where(eq(coachTable.organizationId, organizationId))
				.then((r) => r[0]?.count ?? 0),

			// Active coaches
			db
				.select({ count: count() })
				.from(coachTable)
				.where(
					and(
						eq(coachTable.organizationId, organizationId),
						eq(coachTable.status, CoachStatus.active),
					),
				)
				.then((r) => r[0]?.count ?? 0),

			// Total groups
			db
				.select({ count: count() })
				.from(athleteGroupTable)
				.where(eq(athleteGroupTable.organizationId, organizationId))
				.then((r) => r[0]?.count ?? 0),

			// Active groups
			db
				.select({ count: count() })
				.from(athleteGroupTable)
				.where(
					and(
						eq(athleteGroupTable.organizationId, organizationId),
						eq(athleteGroupTable.isActive, true),
					),
				)
				.then((r) => r[0]?.count ?? 0),

			// Total sessions (non-recurring templates only)
			db
				.select({ count: count() })
				.from(trainingSessionTable)
				.where(
					and(
						eq(trainingSessionTable.organizationId, organizationId),
						eq(trainingSessionTable.isRecurring, false),
					),
				)
				.then((r) => r[0]?.count ?? 0),

			// Completed sessions
			db
				.select({ count: count() })
				.from(trainingSessionTable)
				.where(
					and(
						eq(trainingSessionTable.organizationId, organizationId),
						eq(trainingSessionTable.status, TrainingSessionStatus.completed),
						eq(trainingSessionTable.isRecurring, false),
					),
				)
				.then((r) => r[0]?.count ?? 0),

			// Pending/confirmed sessions
			db
				.select({ count: count() })
				.from(trainingSessionTable)
				.where(
					and(
						eq(trainingSessionTable.organizationId, organizationId),
						sql`${trainingSessionTable.status} IN ('pending', 'confirmed')`,
						eq(trainingSessionTable.isRecurring, false),
					),
				)
				.then((r) => r[0]?.count ?? 0),
		]);

		return {
			athletes: {
				total: totalAthletes,
				active: activeAthletes,
				inactive: totalAthletes - activeAthletes,
			},
			coaches: {
				total: totalCoaches,
				active: activeCoaches,
				inactive: totalCoaches - activeCoaches,
			},
			groups: {
				total: totalGroups,
				active: activeGroups,
				inactive: totalGroups - activeGroups,
			},
			sessions: {
				total: totalSessions,
				completed: completedSessions,
				pending: pendingSessions,
			},
		};
	}),

	getSessionsOverTime: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const organizationId = ctx.organization.id;

		// Get sessions for the last 12 weeks
		const twelveWeeksAgo = new Date();
		twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

		const sessions = await db
			.select({
				startTime: trainingSessionTable.startTime,
				status: trainingSessionTable.status,
			})
			.from(trainingSessionTable)
			.where(
				and(
					eq(trainingSessionTable.organizationId, organizationId),
					gte(trainingSessionTable.startTime, twelveWeeksAgo),
					eq(trainingSessionTable.isRecurring, false),
				),
			)
			.orderBy(trainingSessionTable.startTime);

		// Group by week
		const weeklyData: Record<
			string,
			{ completed: number; pending: number; cancelled: number }
		> = {};

		for (const session of sessions) {
			const weekStart = getWeekStart(session.startTime);
			const weekKey = weekStart.toISOString().split("T")[0] ?? "";

			if (!weeklyData[weekKey]) {
				weeklyData[weekKey] = { completed: 0, pending: 0, cancelled: 0 };
			}

			const weekData = weeklyData[weekKey];
			if (weekData) {
				if (session.status === TrainingSessionStatus.completed) {
					weekData.completed++;
				} else if (session.status === TrainingSessionStatus.cancelled) {
					weekData.cancelled++;
				} else {
					weekData.pending++;
				}
			}
		}

		// Convert to array and fill in missing weeks
		const result: Array<{
			week: string;
			completed: number;
			pending: number;
			cancelled: number;
		}> = [];

		const currentWeek = getWeekStart(new Date());
		for (let i = 11; i >= 0; i--) {
			const weekDate = new Date(currentWeek);
			weekDate.setDate(weekDate.getDate() - i * 7);
			const weekKey = weekDate.toISOString().split("T")[0] ?? "";
			const weekData = weeklyData[weekKey];

			result.push({
				week: weekKey,
				completed: weekData?.completed ?? 0,
				pending: weekData?.pending ?? 0,
				cancelled: weekData?.cancelled ?? 0,
			});
		}

		return result;
	}),

	getAttendanceStats: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const organizationId = ctx.organization.id;

		// Get attendance for the last 30 days
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		// Get sessions with attendance data
		const attendanceData = await db
			.select({
				status: attendanceTable.status,
				sessionStartTime: trainingSessionTable.startTime,
			})
			.from(attendanceTable)
			.innerJoin(
				trainingSessionTable,
				eq(attendanceTable.sessionId, trainingSessionTable.id),
			)
			.where(
				and(
					eq(trainingSessionTable.organizationId, organizationId),
					gte(trainingSessionTable.startTime, thirtyDaysAgo),
					eq(trainingSessionTable.isRecurring, false),
				),
			);

		// Calculate totals
		let present = 0;
		let absent = 0;
		let late = 0;
		let excused = 0;

		for (const record of attendanceData) {
			switch (record.status) {
				case AttendanceStatus.present:
					present++;
					break;
				case AttendanceStatus.absent:
					absent++;
					break;
				case AttendanceStatus.late:
					late++;
					break;
				case AttendanceStatus.excused:
					excused++;
					break;
			}
		}

		const total = present + absent + late + excused;
		const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

		return {
			present,
			absent,
			late,
			excused,
			total,
			attendanceRate: Math.round(attendanceRate * 10) / 10,
		};
	}),

	getUpcomingSessions: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const organizationId = ctx.organization.id;
		const now = new Date();
		const oneWeekFromNow = new Date();
		oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

		const sessions = await db
			.select({
				id: trainingSessionTable.id,
				title: trainingSessionTable.title,
				startTime: trainingSessionTable.startTime,
				endTime: trainingSessionTable.endTime,
				status: trainingSessionTable.status,
			})
			.from(trainingSessionTable)
			.where(
				and(
					eq(trainingSessionTable.organizationId, organizationId),
					gte(trainingSessionTable.startTime, now),
					lte(trainingSessionTable.startTime, oneWeekFromNow),
					eq(trainingSessionTable.isRecurring, false),
					sql`${trainingSessionTable.status} IN ('pending', 'confirmed')`,
				),
			)
			.orderBy(trainingSessionTable.startTime)
			.limit(5);

		return sessions;
	}),

	// Daily activity summary for the new dashboard
	getDailyActivity: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const organizationId = ctx.organization.id;
		const today = new Date();
		const dayStart = getStartOfDay(today);
		const dayEnd = getEndOfDay(today);

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStart = getStartOfDay(tomorrow);
		const tomorrowEnd = getEndOfDay(tomorrow);

		const weekStart = getStartOfWeek(today);
		const weekEnd = getEndOfWeek(today);

		const sessionWith = {
			location: { columns: { id: true, name: true } },
			athleteGroup: { columns: { id: true, name: true } },
			coaches: {
				with: {
					coach: {
						with: {
							user: { columns: { id: true, name: true } },
						},
					},
				},
			},
			athletes: {
				with: {
					athlete: {
						with: {
							user: { columns: { id: true, name: true } },
						},
					},
				},
			},
		} as const;

		// Get all data in parallel
		const [
			todaySessions,
			tomorrowSessions,
			weekSessions,
			todayAttendance,
			todayPayments,
			totalSessionsToday,
			completedSessionsToday,
		] = await Promise.all([
			// Today's sessions with details
			db.query.trainingSessionTable.findMany({
				where: and(
					eq(trainingSessionTable.organizationId, organizationId),
					gte(trainingSessionTable.startTime, dayStart),
					lte(trainingSessionTable.startTime, dayEnd),
					eq(trainingSessionTable.isRecurring, false),
				),
				with: sessionWith,
				orderBy: trainingSessionTable.startTime,
			}),

			// Tomorrow's sessions with details
			db.query.trainingSessionTable.findMany({
				where: and(
					eq(trainingSessionTable.organizationId, organizationId),
					gte(trainingSessionTable.startTime, tomorrowStart),
					lte(trainingSessionTable.startTime, tomorrowEnd),
					eq(trainingSessionTable.isRecurring, false),
				),
				with: sessionWith,
				orderBy: trainingSessionTable.startTime,
			}),

			// Week's sessions with details
			db.query.trainingSessionTable.findMany({
				where: and(
					eq(trainingSessionTable.organizationId, organizationId),
					gte(trainingSessionTable.startTime, weekStart),
					lte(trainingSessionTable.startTime, weekEnd),
					eq(trainingSessionTable.isRecurring, false),
				),
				with: sessionWith,
				orderBy: trainingSessionTable.startTime,
			}),

			// Today's attendance stats
			db
				.select({
					status: attendanceTable.status,
					count: count(),
				})
				.from(attendanceTable)
				.innerJoin(
					trainingSessionTable,
					eq(attendanceTable.sessionId, trainingSessionTable.id),
				)
				.where(
					and(
						eq(trainingSessionTable.organizationId, organizationId),
						gte(trainingSessionTable.startTime, dayStart),
						lte(trainingSessionTable.startTime, dayEnd),
						eq(trainingSessionTable.isRecurring, false),
					),
				)
				.groupBy(attendanceTable.status),

			// Today's payments
			db
				.select({
					totalAmount: sum(trainingPaymentTable.paidAmount),
					paymentCount: count(),
				})
				.from(trainingPaymentTable)
				.where(
					and(
						eq(trainingPaymentTable.organizationId, organizationId),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.paid),
						gte(trainingPaymentTable.paymentDate, dayStart),
						lte(trainingPaymentTable.paymentDate, dayEnd),
					),
				),

			// Total sessions count
			db
				.select({ count: count() })
				.from(trainingSessionTable)
				.where(
					and(
						eq(trainingSessionTable.organizationId, organizationId),
						gte(trainingSessionTable.startTime, dayStart),
						lte(trainingSessionTable.startTime, dayEnd),
						eq(trainingSessionTable.isRecurring, false),
					),
				)
				.then((r) => r[0]?.count ?? 0),

			// Completed sessions count
			db
				.select({ count: count() })
				.from(trainingSessionTable)
				.where(
					and(
						eq(trainingSessionTable.organizationId, organizationId),
						gte(trainingSessionTable.startTime, dayStart),
						lte(trainingSessionTable.startTime, dayEnd),
						eq(trainingSessionTable.isRecurring, false),
						eq(trainingSessionTable.status, TrainingSessionStatus.completed),
					),
				)
				.then((r) => r[0]?.count ?? 0),
		]);

		// Process attendance stats
		const attendanceStats = {
			present: 0,
			absent: 0,
			late: 0,
			excused: 0,
			total: 0,
		};

		for (const record of todayAttendance) {
			const cnt = Number(record.count);
			attendanceStats.total += cnt;
			switch (record.status) {
				case AttendanceStatus.present:
					attendanceStats.present = cnt;
					break;
				case AttendanceStatus.absent:
					attendanceStats.absent = cnt;
					break;
				case AttendanceStatus.late:
					attendanceStats.late = cnt;
					break;
				case AttendanceStatus.excused:
					attendanceStats.excused = cnt;
					break;
			}
		}

		const attendanceRate =
			attendanceStats.total > 0
				? ((attendanceStats.present + attendanceStats.late) /
						attendanceStats.total) *
					100
				: 0;

		return {
			date: today,
			sessions: {
				total: totalSessionsToday,
				completed: completedSessionsToday,
				pending: totalSessionsToday - completedSessionsToday,
				list: todaySessions,
			},
			tomorrow: {
				date: tomorrow,
				sessions: {
					total: tomorrowSessions.length,
					list: tomorrowSessions,
				},
			},
			week: {
				from: weekStart,
				to: weekEnd,
				sessions: {
					total: weekSessions.length,
					list: weekSessions,
				},
			},
			attendance: {
				...attendanceStats,
				rate: Math.round(attendanceRate * 10) / 10,
			},
			income: {
				total: Number(todayPayments[0]?.totalAmount ?? 0),
				count: Number(todayPayments[0]?.paymentCount ?? 0),
			},
		};
	}),

	// Weekly activity summary
	getWeeklyActivity: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const organizationId = ctx.organization.id;
		const today = new Date();
		const weekStart = getStartOfWeek(today);
		const weekEnd = getEndOfWeek(today);

		// Get all data in parallel
		const [weekSessions, weekAttendance, weekPayments, dailySessionCounts] =
			await Promise.all([
				// Week's sessions summary
				db
					.select({
						status: trainingSessionTable.status,
						count: count(),
					})
					.from(trainingSessionTable)
					.where(
						and(
							eq(trainingSessionTable.organizationId, organizationId),
							gte(trainingSessionTable.startTime, weekStart),
							lte(trainingSessionTable.startTime, weekEnd),
							eq(trainingSessionTable.isRecurring, false),
						),
					)
					.groupBy(trainingSessionTable.status),

				// Week's attendance stats
				db
					.select({
						status: attendanceTable.status,
						count: count(),
					})
					.from(attendanceTable)
					.innerJoin(
						trainingSessionTable,
						eq(attendanceTable.sessionId, trainingSessionTable.id),
					)
					.where(
						and(
							eq(trainingSessionTable.organizationId, organizationId),
							gte(trainingSessionTable.startTime, weekStart),
							lte(trainingSessionTable.startTime, weekEnd),
							eq(trainingSessionTable.isRecurring, false),
						),
					)
					.groupBy(attendanceTable.status),

				// Week's payments
				db
					.select({
						totalAmount: sum(trainingPaymentTable.paidAmount),
						paymentCount: count(),
					})
					.from(trainingPaymentTable)
					.where(
						and(
							eq(trainingPaymentTable.organizationId, organizationId),
							eq(trainingPaymentTable.status, TrainingPaymentStatus.paid),
							gte(trainingPaymentTable.paymentDate, weekStart),
							lte(trainingPaymentTable.paymentDate, weekEnd),
						),
					),

				// Sessions by day of week
				db
					.select({
						day: sql<string>`DATE(${trainingSessionTable.startTime})`.as("day"),
						count: count(),
					})
					.from(trainingSessionTable)
					.where(
						and(
							eq(trainingSessionTable.organizationId, organizationId),
							gte(trainingSessionTable.startTime, weekStart),
							lte(trainingSessionTable.startTime, weekEnd),
							eq(trainingSessionTable.isRecurring, false),
						),
					)
					.groupBy(sql`DATE(${trainingSessionTable.startTime})`),
			]);

		// Process session stats
		const sessionStats = {
			total: 0,
			completed: 0,
			pending: 0,
			cancelled: 0,
		};

		for (const record of weekSessions) {
			const cnt = Number(record.count);
			sessionStats.total += cnt;
			switch (record.status) {
				case TrainingSessionStatus.completed:
					sessionStats.completed = cnt;
					break;
				case TrainingSessionStatus.cancelled:
					sessionStats.cancelled = cnt;
					break;
				default:
					sessionStats.pending += cnt;
			}
		}

		// Process attendance stats
		const attendanceStats = {
			present: 0,
			absent: 0,
			late: 0,
			excused: 0,
			total: 0,
		};

		for (const record of weekAttendance) {
			const cnt = Number(record.count);
			attendanceStats.total += cnt;
			switch (record.status) {
				case AttendanceStatus.present:
					attendanceStats.present = cnt;
					break;
				case AttendanceStatus.absent:
					attendanceStats.absent = cnt;
					break;
				case AttendanceStatus.late:
					attendanceStats.late = cnt;
					break;
				case AttendanceStatus.excused:
					attendanceStats.excused = cnt;
					break;
			}
		}

		const attendanceRate =
			attendanceStats.total > 0
				? ((attendanceStats.present + attendanceStats.late) /
						attendanceStats.total) *
					100
				: 0;

		// Build daily breakdown
		const dailyBreakdown = dailySessionCounts.map((d) => ({
			date: d.day,
			sessions: Number(d.count),
		}));

		return {
			period: { from: weekStart, to: weekEnd },
			sessions: sessionStats,
			attendance: {
				...attendanceStats,
				rate: Math.round(attendanceRate * 10) / 10,
			},
			income: {
				total: Number(weekPayments[0]?.totalAmount ?? 0),
				count: Number(weekPayments[0]?.paymentCount ?? 0),
			},
			dailyBreakdown,
		};
	}),

	// Upcoming events (next 30 days)
	getUpcomingEvents: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const organizationId = ctx.organization.id;
		const now = new Date();
		const thirtyDaysFromNow = new Date();
		thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

		const events = await db.query.sportsEventTable.findMany({
			where: and(
				eq(sportsEventTable.organizationId, organizationId),
				gte(sportsEventTable.startDate, now),
				lte(sportsEventTable.startDate, thirtyDaysFromNow),
				sql`${sportsEventTable.status} IN ('draft', 'published', 'open', 'registration_closed')`,
			),
			orderBy: sportsEventTable.startDate,
			limit: 5,
			with: {
				location: { columns: { id: true, name: true } },
			},
		});

		// Get total count of upcoming events
		const totalCount = await db
			.select({ count: count() })
			.from(sportsEventTable)
			.where(
				and(
					eq(sportsEventTable.organizationId, organizationId),
					gte(sportsEventTable.startDate, now),
					sql`${sportsEventTable.status} IN ('draft', 'published', 'open', 'registration_closed')`,
				),
			)
			.then((r) => r[0]?.count ?? 0);

		return {
			events: events.map((e) => ({
				id: e.id,
				title: e.title,
				eventType: e.eventType,
				startDate: e.startDate,
				endDate: e.endDate,
				status: e.status,
				currentRegistrations: e.currentRegistrations,
				maxCapacity: e.maxCapacity,
				location: e.location,
			})),
			totalCount,
		};
	}),

	// Group occupancy stats - members vs max capacity per active group
	getGroupOccupancy: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const organizationId = ctx.organization.id;

		// Get active groups with their member counts
		const groups = await db
			.select({
				groupId: athleteGroupTable.id,
				name: athleteGroupTable.name,
				maxCapacity: athleteGroupTable.maxCapacity,
				memberCount: sql<number>`(
					SELECT COUNT(*) FROM ${athleteGroupMemberTable}
					WHERE ${athleteGroupMemberTable.groupId} = ${athleteGroupTable.id}
				)`.as("member_count"),
			})
			.from(athleteGroupTable)
			.where(
				and(
					eq(athleteGroupTable.organizationId, organizationId),
					eq(athleteGroupTable.isActive, true),
				),
			)
			.orderBy(athleteGroupTable.name);

		// Calculate occupancy stats
		let totalCapacity = 0;
		let totalMembers = 0;
		let groupsWithCapacity = 0;

		const groupDetails = groups.map((g) => {
			const capacity = g.maxCapacity ?? 0;
			const members = Number(g.memberCount) || 0;

			if (capacity > 0) {
				totalCapacity += capacity;
				totalMembers += members;
				groupsWithCapacity++;
			}

			return {
				id: g.groupId,
				name: g.name,
				capacity,
				members,
				occupancyRate: capacity > 0 ? (members / capacity) * 100 : 0,
			};
		});

		const averageOccupancy =
			totalCapacity > 0 ? (totalMembers / totalCapacity) * 100 : 0;

		// Sort by occupancy rate descending for the top 5
		const topGroups = [...groupDetails]
			.filter((g) => g.capacity > 0)
			.sort((a, b) => b.occupancyRate - a.occupancyRate)
			.slice(0, 5);

		return {
			totalGroups: groups.length,
			groupsWithCapacity,
			totalCapacity,
			totalMembers,
			averageOccupancy: Math.round(averageOccupancy * 10) / 10,
			groups: topGroups,
		};
	}),

	// Location usage stats - sessions per location this week
	getLocationUsage: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const organizationId = ctx.organization.id;
		const now = new Date();
		const weekStart = getStartOfWeek(now);
		const weekEnd = getEndOfWeek(now);

		// Get session counts per location for this week
		const locationSessions = await db
			.select({
				locationId: locationTable.id,
				locationName: locationTable.name,
				locationColor: locationTable.color,
				sessionCount: count(),
			})
			.from(trainingSessionTable)
			.innerJoin(
				locationTable,
				eq(trainingSessionTable.locationId, locationTable.id),
			)
			.where(
				and(
					eq(trainingSessionTable.organizationId, organizationId),
					gte(trainingSessionTable.startTime, weekStart),
					lte(trainingSessionTable.startTime, weekEnd),
					eq(trainingSessionTable.isRecurring, false),
				),
			)
			.groupBy(locationTable.id, locationTable.name, locationTable.color)
			.orderBy(sql`count(*) DESC`);

		// Total sessions this week (including those without a location)
		const totalSessions = await db
			.select({ count: count() })
			.from(trainingSessionTable)
			.where(
				and(
					eq(trainingSessionTable.organizationId, organizationId),
					gte(trainingSessionTable.startTime, weekStart),
					lte(trainingSessionTable.startTime, weekEnd),
					eq(trainingSessionTable.isRecurring, false),
				),
			)
			.then((r) => r[0]?.count ?? 0);

		const locations = locationSessions.map((l) => ({
			id: l.locationId,
			name: l.locationName,
			color: l.locationColor,
			sessionCount: Number(l.sessionCount),
		}));

		return {
			totalSessions,
			totalLocations: locations.length,
			locations: locations.slice(0, 5),
		};
	}),

	// Waitlist summary by group
	getWaitlistSummary: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const organizationId = ctx.organization.id;

		// Get waitlist counts by group
		const waitlistByGroup = await db
			.select({
				groupId: waitlistEntryTable.athleteGroupId,
				groupName: athleteGroupTable.name,
				count: count(),
			})
			.from(waitlistEntryTable)
			.leftJoin(
				athleteGroupTable,
				eq(waitlistEntryTable.athleteGroupId, athleteGroupTable.id),
			)
			.where(
				and(
					eq(waitlistEntryTable.organizationId, organizationId),
					eq(waitlistEntryTable.status, WaitlistEntryStatus.waiting),
				),
			)
			.groupBy(waitlistEntryTable.athleteGroupId, athleteGroupTable.name);

		// Get total waitlist count
		const totalCount = await db
			.select({ count: count() })
			.from(waitlistEntryTable)
			.where(
				and(
					eq(waitlistEntryTable.organizationId, organizationId),
					eq(waitlistEntryTable.status, WaitlistEntryStatus.waiting),
				),
			)
			.then((r) => r[0]?.count ?? 0);

		return {
			totalCount,
			byGroup: waitlistByGroup.map((w) => ({
				groupId: w.groupId,
				groupName: w.groupName ?? "Sin asignar",
				count: Number(w.count),
			})),
		};
	}),

	// Athlete retention metrics based on attendance this month
	getAthleteRetention: protectedOrganizationProcedure.query(async ({ ctx }) => {
		const organizationId = ctx.organization.id;

		// Get start of current month
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthEnd = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			0,
			23,
			59,
			59,
			999,
		);

		// Get start of previous month
		const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const prevMonthEnd = new Date(
			now.getFullYear(),
			now.getMonth(),
			0,
			23,
			59,
			59,
			999,
		);

		// Total active athletes (status = active)
		const totalActive = await db
			.select({ count: count() })
			.from(athleteTable)
			.where(
				and(
					eq(athleteTable.organizationId, organizationId),
					eq(athleteTable.status, AthleteStatus.active),
				),
			)
			.then((r) => r[0]?.count ?? 0);

		// Athletes with attendance this month (actively training)
		const athletesWithAttendanceThisMonth = await db
			.selectDistinct({ athleteId: attendanceTable.athleteId })
			.from(attendanceTable)
			.innerJoin(
				trainingSessionTable,
				eq(attendanceTable.sessionId, trainingSessionTable.id),
			)
			.where(
				and(
					eq(trainingSessionTable.organizationId, organizationId),
					gte(trainingSessionTable.startTime, monthStart),
					lte(trainingSessionTable.startTime, monthEnd),
				),
			);

		const activeThisMonth = athletesWithAttendanceThisMonth.length;

		// Athletes with attendance last month
		const athletesWithAttendanceLastMonth = await db
			.selectDistinct({ athleteId: attendanceTable.athleteId })
			.from(attendanceTable)
			.innerJoin(
				trainingSessionTable,
				eq(attendanceTable.sessionId, trainingSessionTable.id),
			)
			.where(
				and(
					eq(trainingSessionTable.organizationId, organizationId),
					gte(trainingSessionTable.startTime, prevMonthStart),
					lte(trainingSessionTable.startTime, prevMonthEnd),
				),
			);

		const activeLastMonth = athletesWithAttendanceLastMonth.length;

		// Inactive = total active athletes - those who trained this month
		const inactiveThisMonth = Math.max(0, totalActive - activeThisMonth);

		// New athletes this month
		const newAthletes = await db
			.select({ count: count() })
			.from(athleteTable)
			.where(
				and(
					eq(athleteTable.organizationId, organizationId),
					gte(athleteTable.createdAt, monthStart),
				),
			)
			.then((r) => r[0]?.count ?? 0);

		// Athletes who trained last month but not this month (churned)
		const lastMonthAthleteIds = new Set(
			athletesWithAttendanceLastMonth.map((a) => a.athleteId),
		);
		const thisMonthAthleteIds = new Set(
			athletesWithAttendanceThisMonth.map((a) => a.athleteId),
		);

		let churnedFromLastMonth = 0;
		for (const id of lastMonthAthleteIds) {
			if (!thisMonthAthleteIds.has(id)) {
				churnedFromLastMonth++;
			}
		}

		const retentionRate =
			totalActive > 0 ? (activeThisMonth / totalActive) * 100 : 0;
		const churnRate =
			activeLastMonth > 0 ? (churnedFromLastMonth / activeLastMonth) * 100 : 0;

		return {
			total: totalActive,
			active: activeThisMonth,
			inactive: inactiveThisMonth,
			churned: churnedFromLastMonth,
			newLast30Days: newAthletes,
			churnedLast30Days: churnedFromLastMonth,
			retentionRate: Math.round(retentionRate * 10) / 10,
			churnRate: Math.round(churnRate * 10) / 10,
		};
	}),
});

function getWeekStart(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}
