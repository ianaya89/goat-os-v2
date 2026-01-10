import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import {
	athleteGroupTable,
	athleteTable,
	attendanceTable,
	coachTable,
	db,
	trainingSessionTable,
} from "@/lib/db";
import {
	AthleteStatus,
	AttendanceStatus,
	CoachStatus,
	TrainingSessionStatus,
} from "@/lib/db/schema";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

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
});

function getWeekStart(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}
