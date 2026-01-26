import { and, asc, count, desc, eq, gte, lte, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	AttendanceStatus,
	EventPaymentStatus,
	EventRegistrationStatus,
	TrainingPaymentStatus,
	TrainingSessionStatus,
} from "@/lib/db/schema/enums";
import {
	athleteGroupTable,
	athleteTable,
	attendanceTable,
	coachTable,
	eventPaymentTable,
	eventRegistrationTable,
	expenseCategoryTable,
	expenseTable,
	locationTable,
	sportsEventTable,
	trainingPaymentTable,
	trainingSessionCoachTable,
	trainingSessionTable,
	userTable,
} from "@/lib/db/schema/tables";
import {
	getAttendanceByAthleteSchema,
	getAttendanceByGroupSchema,
	getAttendanceTrendSchema,
	getCashFlowReportSchema,
	getExpensesByCategorySchema,
	getExpensesByPeriodSchema,
	getFinancialSummarySchema,
	getOutstandingPaymentsSchema,
	getPendingEventRegistrationsSchema,
	getPendingSummarySchema,
	getRevenueByAthleteSchema,
	getRevenueByEventSchema,
	getRevenueByLocationSchema,
	getRevenueByPaymentMethodSchema,
	getRevenueByPeriodSchema,
	getRevenueWithCumulativeSchema,
	getSessionsByCoachSchema,
	getSessionsByPeriodSchema,
	getTrainingSummarySchema,
} from "@/schemas/organization-reports-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

// Helper to get default date range (last 12 months)
function getDefaultDateRange() {
	const to = new Date();
	const from = new Date();
	from.setMonth(from.getMonth() - 12);
	return { from, to };
}

export const organizationReportsRouter = createTRPCRouter({
	// Financial summary for a period
	getFinancialSummary: protectedOrganizationProcedure
		.input(getFinancialSummarySchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange;

			// Get total revenue (paid payments)
			const revenueResult = await db
				.select({
					totalRevenue: sum(trainingPaymentTable.paidAmount),
					paymentCount: count(),
				})
				.from(trainingPaymentTable)
				.where(
					and(
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.paid),
						gte(trainingPaymentTable.paymentDate, from),
						lte(trainingPaymentTable.paymentDate, to),
					),
				);

			// Get total expenses
			const expenseResult = await db
				.select({
					totalExpenses: sum(expenseTable.amount),
					expenseCount: count(),
				})
				.from(expenseTable)
				.where(
					and(
						eq(expenseTable.organizationId, ctx.organization.id),
						gte(expenseTable.expenseDate, from),
						lte(expenseTable.expenseDate, to),
					),
				);

			// Get pending payments
			const pendingResult = await db
				.select({
					totalPending: sum(
						sql`${trainingPaymentTable.amount} - ${trainingPaymentTable.paidAmount}`,
					),
					pendingCount: count(),
				})
				.from(trainingPaymentTable)
				.where(
					and(
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.pending),
					),
				);

			const totalRevenue = Number(revenueResult[0]?.totalRevenue ?? 0);
			const totalExpenses = Number(expenseResult[0]?.totalExpenses ?? 0);
			const totalPending = Number(pendingResult[0]?.totalPending ?? 0);

			return {
				period: { from, to },
				revenue: {
					total: totalRevenue,
					count: Number(revenueResult[0]?.paymentCount ?? 0),
				},
				expenses: {
					total: totalExpenses,
					count: Number(expenseResult[0]?.expenseCount ?? 0),
				},
				pending: {
					total: totalPending,
					count: Number(pendingResult[0]?.pendingCount ?? 0),
				},
				netProfit: totalRevenue - totalExpenses,
				profitMargin:
					totalRevenue > 0
						? ((totalRevenue - totalExpenses) / totalRevenue) * 100
						: 0,
			};
		}),

	// Revenue by period (month, week, etc.)
	getRevenueByPeriod: protectedOrganizationProcedure
		.input(getRevenueByPeriodSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			// Use SQL date truncation based on period
			let dateTrunc: ReturnType<typeof sql>;
			switch (input.period) {
				case "day":
					dateTrunc = sql`DATE_TRUNC('day', ${trainingPaymentTable.paymentDate})`;
					break;
				case "week":
					dateTrunc = sql`DATE_TRUNC('week', ${trainingPaymentTable.paymentDate})`;
					break;
				case "year":
					dateTrunc = sql`DATE_TRUNC('year', ${trainingPaymentTable.paymentDate})`;
					break;
				default:
					dateTrunc = sql`DATE_TRUNC('month', ${trainingPaymentTable.paymentDate})`;
			}

			const result = await db
				.select({
					period: dateTrunc,
					total: sum(trainingPaymentTable.paidAmount),
					count: count(),
				})
				.from(trainingPaymentTable)
				.where(
					and(
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.paid),
						gte(trainingPaymentTable.paymentDate, from),
						lte(trainingPaymentTable.paymentDate, to),
					),
				)
				.groupBy(dateTrunc)
				.orderBy(dateTrunc);

			return result.map((r) => ({
				period: r.period as Date,
				total: Number(r.total ?? 0),
				count: Number(r.count ?? 0),
			}));
		}),

	// Revenue by athlete
	getRevenueByAthlete: protectedOrganizationProcedure
		.input(getRevenueByAthleteSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			const result = await db
				.select({
					athleteId: trainingPaymentTable.athleteId,
					athleteName: athleteTable.id, // We'll join
					total: sum(trainingPaymentTable.paidAmount),
					count: count(),
				})
				.from(trainingPaymentTable)
				.leftJoin(
					athleteTable,
					eq(trainingPaymentTable.athleteId, athleteTable.id),
				)
				.where(
					and(
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.paid),
						gte(trainingPaymentTable.paymentDate, from),
						lte(trainingPaymentTable.paymentDate, to),
					),
				)
				.groupBy(trainingPaymentTable.athleteId, athleteTable.id)
				.orderBy(desc(sum(trainingPaymentTable.paidAmount)))
				.limit(input.limit);

			// Get athlete details
			const athleteIds = result
				.map((r) => r.athleteId)
				.filter((id): id is string => id !== null);

			const athletes =
				athleteIds.length > 0
					? await db.query.athleteTable.findMany({
							where: and(
								eq(athleteTable.organizationId, ctx.organization.id),
								sql`${athleteTable.id} = ANY(${athleteIds})`,
							),
							with: {
								user: { columns: { id: true, name: true } },
							},
						})
					: [];

			const athleteMap = new Map(athletes.map((a) => [a.id, a]));

			return result.map((r) => {
				const athlete = r.athleteId ? athleteMap.get(r.athleteId) : null;
				return {
					athleteId: r.athleteId,
					athleteName: athlete?.user?.name ?? "Unknown",
					total: Number(r.total ?? 0),
					count: Number(r.count ?? 0),
				};
			});
		}),

	// Expenses by category
	getExpensesByCategory: protectedOrganizationProcedure
		.input(getExpensesByCategorySchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			const result = await db
				.select({
					categoryId: expenseTable.categoryId,
					categoryName: expenseCategoryTable.name,
					categoryType: expenseCategoryTable.type,
					total: sum(expenseTable.amount),
					count: count(),
				})
				.from(expenseTable)
				.leftJoin(
					expenseCategoryTable,
					eq(expenseTable.categoryId, expenseCategoryTable.id),
				)
				.where(
					and(
						eq(expenseTable.organizationId, ctx.organization.id),
						gte(expenseTable.expenseDate, from),
						lte(expenseTable.expenseDate, to),
					),
				)
				.groupBy(
					expenseTable.categoryId,
					expenseCategoryTable.name,
					expenseCategoryTable.type,
				)
				.orderBy(desc(sum(expenseTable.amount)));

			return result.map((r) => ({
				categoryId: r.categoryId,
				categoryName: r.categoryName ?? "Uncategorized",
				categoryType: r.categoryType,
				total: Number(r.total ?? 0),
				count: Number(r.count ?? 0),
			}));
		}),

	// Expenses by period
	getExpensesByPeriod: protectedOrganizationProcedure
		.input(getExpensesByPeriodSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			let dateTrunc: ReturnType<typeof sql>;
			switch (input.period) {
				case "day":
					dateTrunc = sql`DATE_TRUNC('day', ${expenseTable.expenseDate})`;
					break;
				case "week":
					dateTrunc = sql`DATE_TRUNC('week', ${expenseTable.expenseDate})`;
					break;
				case "year":
					dateTrunc = sql`DATE_TRUNC('year', ${expenseTable.expenseDate})`;
					break;
				default:
					dateTrunc = sql`DATE_TRUNC('month', ${expenseTable.expenseDate})`;
			}

			const result = await db
				.select({
					period: dateTrunc,
					total: sum(expenseTable.amount),
					count: count(),
				})
				.from(expenseTable)
				.where(
					and(
						eq(expenseTable.organizationId, ctx.organization.id),
						gte(expenseTable.expenseDate, from),
						lte(expenseTable.expenseDate, to),
					),
				)
				.groupBy(dateTrunc)
				.orderBy(dateTrunc);

			return result.map((r) => ({
				period: r.period as Date,
				total: Number(r.total ?? 0),
				count: Number(r.count ?? 0),
			}));
		}),

	// Cash flow report (revenue - expenses by period)
	getCashFlowReport: protectedOrganizationProcedure
		.input(getCashFlowReportSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			// Get revenue by period
			let revenueDateTrunc: ReturnType<typeof sql>;
			let expenseDateTrunc: ReturnType<typeof sql>;
			switch (input.period) {
				case "day":
					revenueDateTrunc = sql`DATE_TRUNC('day', ${trainingPaymentTable.paymentDate})`;
					expenseDateTrunc = sql`DATE_TRUNC('day', ${expenseTable.expenseDate})`;
					break;
				case "week":
					revenueDateTrunc = sql`DATE_TRUNC('week', ${trainingPaymentTable.paymentDate})`;
					expenseDateTrunc = sql`DATE_TRUNC('week', ${expenseTable.expenseDate})`;
					break;
				case "year":
					revenueDateTrunc = sql`DATE_TRUNC('year', ${trainingPaymentTable.paymentDate})`;
					expenseDateTrunc = sql`DATE_TRUNC('year', ${expenseTable.expenseDate})`;
					break;
				default:
					revenueDateTrunc = sql`DATE_TRUNC('month', ${trainingPaymentTable.paymentDate})`;
					expenseDateTrunc = sql`DATE_TRUNC('month', ${expenseTable.expenseDate})`;
			}

			const [revenueByPeriod, expensesByPeriod] = await Promise.all([
				db
					.select({
						period: revenueDateTrunc,
						total: sum(trainingPaymentTable.paidAmount),
					})
					.from(trainingPaymentTable)
					.where(
						and(
							eq(trainingPaymentTable.organizationId, ctx.organization.id),
							eq(trainingPaymentTable.status, TrainingPaymentStatus.paid),
							gte(trainingPaymentTable.paymentDate, from),
							lte(trainingPaymentTable.paymentDate, to),
						),
					)
					.groupBy(revenueDateTrunc),
				db
					.select({
						period: expenseDateTrunc,
						total: sum(expenseTable.amount),
					})
					.from(expenseTable)
					.where(
						and(
							eq(expenseTable.organizationId, ctx.organization.id),
							gte(expenseTable.expenseDate, from),
							lte(expenseTable.expenseDate, to),
						),
					)
					.groupBy(expenseDateTrunc),
			]);

			// Combine periods
			const periodMap = new Map<
				string,
				{ revenue: number; expenses: number }
			>();

			for (const r of revenueByPeriod) {
				const key = (r.period as Date).toISOString();
				const existing = periodMap.get(key) ?? { revenue: 0, expenses: 0 };
				existing.revenue = Number(r.total ?? 0);
				periodMap.set(key, existing);
			}

			for (const e of expensesByPeriod) {
				const key = (e.period as Date).toISOString();
				const existing = periodMap.get(key) ?? { revenue: 0, expenses: 0 };
				existing.expenses = Number(e.total ?? 0);
				periodMap.set(key, existing);
			}

			// Sort by period and calculate net
			const result = Array.from(periodMap.entries())
				.map(([periodKey, data]) => ({
					period: new Date(periodKey),
					revenue: data.revenue,
					expenses: data.expenses,
					net: data.revenue - data.expenses,
				}))
				.sort((a, b) => a.period.getTime() - b.period.getTime());

			return result;
		}),

	// Outstanding (pending) payments
	getOutstandingPayments: protectedOrganizationProcedure
		.input(getOutstandingPaymentsSchema)
		.query(async ({ ctx, input }) => {
			const [payments, countResult] = await Promise.all([
				db.query.trainingPaymentTable.findMany({
					where: and(
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.pending),
					),
					limit: input.limit,
					offset: input.offset,
					orderBy: desc(trainingPaymentTable.createdAt),
					with: {
						athlete: {
							with: {
								user: { columns: { id: true, name: true } },
							},
						},
						session: { columns: { id: true, title: true } },
					},
				}),
				db
					.select({ count: count() })
					.from(trainingPaymentTable)
					.where(
						and(
							eq(trainingPaymentTable.organizationId, ctx.organization.id),
							eq(trainingPaymentTable.status, TrainingPaymentStatus.pending),
						),
					),
			]);

			// Calculate total outstanding
			const totalOutstanding = await db
				.select({
					total: sum(
						sql`${trainingPaymentTable.amount} - ${trainingPaymentTable.paidAmount}`,
					),
				})
				.from(trainingPaymentTable)
				.where(
					and(
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.pending),
					),
				);

			return {
				payments,
				total: countResult[0]?.count ?? 0,
				totalOutstandingAmount: Number(totalOutstanding[0]?.total ?? 0),
			};
		}),

	// Revenue by payment method
	getRevenueByPaymentMethod: protectedOrganizationProcedure
		.input(getRevenueByPaymentMethodSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			const result = await db
				.select({
					paymentMethod: trainingPaymentTable.paymentMethod,
					total: sum(trainingPaymentTable.paidAmount),
					count: count(),
				})
				.from(trainingPaymentTable)
				.where(
					and(
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.paid),
						gte(trainingPaymentTable.paymentDate, from),
						lte(trainingPaymentTable.paymentDate, to),
					),
				)
				.groupBy(trainingPaymentTable.paymentMethod)
				.orderBy(desc(sum(trainingPaymentTable.paidAmount)));

			return result.map((r) => ({
				paymentMethod: r.paymentMethod ?? "unknown",
				total: Number(r.total ?? 0),
				count: Number(r.count ?? 0),
			}));
		}),

	// Revenue with cumulative totals
	getRevenueWithCumulative: protectedOrganizationProcedure
		.input(getRevenueWithCumulativeSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			let dateTrunc: ReturnType<typeof sql>;
			switch (input.period) {
				case "day":
					dateTrunc = sql`DATE_TRUNC('day', ${trainingPaymentTable.paymentDate})`;
					break;
				case "week":
					dateTrunc = sql`DATE_TRUNC('week', ${trainingPaymentTable.paymentDate})`;
					break;
				case "year":
					dateTrunc = sql`DATE_TRUNC('year', ${trainingPaymentTable.paymentDate})`;
					break;
				default:
					dateTrunc = sql`DATE_TRUNC('month', ${trainingPaymentTable.paymentDate})`;
			}

			const result = await db
				.select({
					period: dateTrunc,
					total: sum(trainingPaymentTable.paidAmount),
					count: count(),
				})
				.from(trainingPaymentTable)
				.where(
					and(
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.paid),
						gte(trainingPaymentTable.paymentDate, from),
						lte(trainingPaymentTable.paymentDate, to),
					),
				)
				.groupBy(dateTrunc)
				.orderBy(dateTrunc);

			// Calculate cumulative totals
			let cumulative = 0;
			return result.map((r) => {
				const periodTotal = Number(r.total ?? 0);
				cumulative += periodTotal;
				return {
					period: r.period as Date,
					total: periodTotal,
					cumulative,
					count: Number(r.count ?? 0),
				};
			});
		}),

	// Revenue by sports event
	getRevenueByEvent: protectedOrganizationProcedure
		.input(getRevenueByEventSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			const result = await db
				.select({
					eventId: sportsEventTable.id,
					eventTitle: sportsEventTable.title,
					eventType: sportsEventTable.eventType,
					eventDate: sportsEventTable.startDate,
					total: sum(eventPaymentTable.amount),
					count: count(),
				})
				.from(eventPaymentTable)
				.innerJoin(
					eventRegistrationTable,
					eq(eventPaymentTable.registrationId, eventRegistrationTable.id),
				)
				.innerJoin(
					sportsEventTable,
					eq(eventRegistrationTable.eventId, sportsEventTable.id),
				)
				.where(
					and(
						eq(eventPaymentTable.organizationId, ctx.organization.id),
						eq(eventPaymentTable.status, EventPaymentStatus.paid),
						gte(eventPaymentTable.paymentDate, from),
						lte(eventPaymentTable.paymentDate, to),
					),
				)
				.groupBy(
					sportsEventTable.id,
					sportsEventTable.title,
					sportsEventTable.eventType,
					sportsEventTable.startDate,
				)
				.orderBy(desc(sum(eventPaymentTable.amount)))
				.limit(input.limit);

			return result.map((r) => ({
				eventId: r.eventId,
				eventTitle: r.eventTitle,
				eventType: r.eventType,
				eventDate: r.eventDate,
				total: Number(r.total ?? 0),
				count: Number(r.count ?? 0),
			}));
		}),

	// Revenue by location (from training sessions)
	getRevenueByLocation: protectedOrganizationProcedure
		.input(getRevenueByLocationSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			const result = await db
				.select({
					locationId: locationTable.id,
					locationName: locationTable.name,
					locationAddress: locationTable.address,
					total: sum(trainingPaymentTable.paidAmount),
					count: count(),
				})
				.from(trainingPaymentTable)
				.innerJoin(
					trainingSessionTable,
					eq(trainingPaymentTable.sessionId, trainingSessionTable.id),
				)
				.innerJoin(
					locationTable,
					eq(trainingSessionTable.locationId, locationTable.id),
				)
				.where(
					and(
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.paid),
						gte(trainingPaymentTable.paymentDate, from),
						lte(trainingPaymentTable.paymentDate, to),
					),
				)
				.groupBy(locationTable.id, locationTable.name, locationTable.address)
				.orderBy(desc(sum(trainingPaymentTable.paidAmount)))
				.limit(input.limit);

			return result.map((r) => ({
				locationId: r.locationId,
				locationName: r.locationName,
				locationAddress: r.locationAddress,
				total: Number(r.total ?? 0),
				count: Number(r.count ?? 0),
			}));
		}),

	// ============================================================================
	// TRAINING REPORTS
	// ============================================================================

	// Training summary (sessions stats)
	getTrainingSummary: protectedOrganizationProcedure
		.input(getTrainingSummarySchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange;

			// Get session stats
			const sessionStats = await db
				.select({
					status: trainingSessionTable.status,
					count: count(),
				})
				.from(trainingSessionTable)
				.where(
					and(
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						gte(trainingSessionTable.startTime, from),
						lte(trainingSessionTable.startTime, to),
					),
				)
				.groupBy(trainingSessionTable.status);

			const total = sessionStats.reduce((acc, s) => acc + Number(s.count), 0);
			const completed = sessionStats.find(
				(s) => s.status === TrainingSessionStatus.completed,
			);
			const cancelled = sessionStats.find(
				(s) => s.status === TrainingSessionStatus.cancelled,
			);
			const pending = sessionStats.find(
				(s) => s.status === TrainingSessionStatus.pending,
			);
			const confirmed = sessionStats.find(
				(s) => s.status === TrainingSessionStatus.confirmed,
			);

			// Get attendance stats
			const attendanceStats = await db
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
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						gte(trainingSessionTable.startTime, from),
						lte(trainingSessionTable.startTime, to),
					),
				)
				.groupBy(attendanceTable.status);

			const totalAttendance = attendanceStats.reduce(
				(acc, a) => acc + Number(a.count),
				0,
			);
			const present = attendanceStats.find(
				(a) => a.status === AttendanceStatus.present,
			);
			const absent = attendanceStats.find(
				(a) => a.status === AttendanceStatus.absent,
			);
			const late = attendanceStats.find(
				(a) => a.status === AttendanceStatus.late,
			);
			const excused = attendanceStats.find(
				(a) => a.status === AttendanceStatus.excused,
			);

			const attendedCount =
				Number(present?.count ?? 0) + Number(late?.count ?? 0);
			const attendanceRate =
				totalAttendance > 0 ? (attendedCount / totalAttendance) * 100 : 0;

			return {
				period: { from, to },
				sessions: {
					total,
					completed: Number(completed?.count ?? 0),
					cancelled: Number(cancelled?.count ?? 0),
					pending: Number(pending?.count ?? 0),
					confirmed: Number(confirmed?.count ?? 0),
					completionRate:
						total > 0 ? (Number(completed?.count ?? 0) / total) * 100 : 0,
				},
				attendance: {
					total: totalAttendance,
					present: Number(present?.count ?? 0),
					absent: Number(absent?.count ?? 0),
					late: Number(late?.count ?? 0),
					excused: Number(excused?.count ?? 0),
					rate: attendanceRate,
				},
			};
		}),

	// Sessions by period
	getSessionsByPeriod: protectedOrganizationProcedure
		.input(getSessionsByPeriodSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			let dateTrunc: ReturnType<typeof sql>;
			switch (input.period) {
				case "day":
					dateTrunc = sql`DATE_TRUNC('day', ${trainingSessionTable.startTime})`;
					break;
				case "week":
					dateTrunc = sql`DATE_TRUNC('week', ${trainingSessionTable.startTime})`;
					break;
				case "year":
					dateTrunc = sql`DATE_TRUNC('year', ${trainingSessionTable.startTime})`;
					break;
				default:
					dateTrunc = sql`DATE_TRUNC('month', ${trainingSessionTable.startTime})`;
			}

			const result = await db
				.select({
					period: dateTrunc,
					total: count(),
					completed: sql<number>`COUNT(*) FILTER (WHERE ${trainingSessionTable.status} = ${TrainingSessionStatus.completed})`,
					cancelled: sql<number>`COUNT(*) FILTER (WHERE ${trainingSessionTable.status} = ${TrainingSessionStatus.cancelled})`,
					pending: sql<number>`COUNT(*) FILTER (WHERE ${trainingSessionTable.status} = ${TrainingSessionStatus.pending})`,
				})
				.from(trainingSessionTable)
				.where(
					and(
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						gte(trainingSessionTable.startTime, from),
						lte(trainingSessionTable.startTime, to),
					),
				)
				.groupBy(dateTrunc)
				.orderBy(dateTrunc);

			return result.map((r) => ({
				period: r.period as Date,
				total: Number(r.total ?? 0),
				completed: Number(r.completed ?? 0),
				cancelled: Number(r.cancelled ?? 0),
				pending: Number(r.pending ?? 0),
			}));
		}),

	// Attendance by athlete
	getAttendanceByAthlete: protectedOrganizationProcedure
		.input(getAttendanceByAthleteSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			const result = await db
				.select({
					athleteId: attendanceTable.athleteId,
					total: count(),
					present: sql<number>`COUNT(*) FILTER (WHERE ${attendanceTable.status} = ${AttendanceStatus.present})`,
					late: sql<number>`COUNT(*) FILTER (WHERE ${attendanceTable.status} = ${AttendanceStatus.late})`,
					absent: sql<number>`COUNT(*) FILTER (WHERE ${attendanceTable.status} = ${AttendanceStatus.absent})`,
					excused: sql<number>`COUNT(*) FILTER (WHERE ${attendanceTable.status} = ${AttendanceStatus.excused})`,
				})
				.from(attendanceTable)
				.innerJoin(
					trainingSessionTable,
					eq(attendanceTable.sessionId, trainingSessionTable.id),
				)
				.where(
					and(
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						gte(trainingSessionTable.startTime, from),
						lte(trainingSessionTable.startTime, to),
					),
				)
				.groupBy(attendanceTable.athleteId)
				.orderBy(
					input.sortBy === "best"
						? desc(
								sql`(COUNT(*) FILTER (WHERE ${attendanceTable.status} IN (${AttendanceStatus.present}, ${AttendanceStatus.late})))::float / NULLIF(COUNT(*), 0)`,
							)
						: asc(
								sql`(COUNT(*) FILTER (WHERE ${attendanceTable.status} IN (${AttendanceStatus.present}, ${AttendanceStatus.late})))::float / NULLIF(COUNT(*), 0)`,
							),
				)
				.limit(input.limit);

			// Get athlete details
			const athleteIds = result.map((r) => r.athleteId);
			const athletes =
				athleteIds.length > 0
					? await db.query.athleteTable.findMany({
							where: and(
								eq(athleteTable.organizationId, ctx.organization.id),
								sql`${athleteTable.id} = ANY(${athleteIds})`,
							),
							with: {
								user: { columns: { id: true, name: true } },
							},
						})
					: [];

			const athleteMap = new Map(athletes.map((a) => [a.id, a]));

			return result.map((r) => {
				const athlete = athleteMap.get(r.athleteId);
				const attended = Number(r.present) + Number(r.late);
				const total = Number(r.total);
				return {
					athleteId: r.athleteId,
					athleteName: athlete?.user?.name ?? "Unknown",
					total,
					present: Number(r.present),
					late: Number(r.late),
					absent: Number(r.absent),
					excused: Number(r.excused),
					rate: total > 0 ? (attended / total) * 100 : 0,
				};
			});
		}),

	// Attendance by group
	getAttendanceByGroup: protectedOrganizationProcedure
		.input(getAttendanceByGroupSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			const result = await db
				.select({
					groupId: trainingSessionTable.athleteGroupId,
					groupName: athleteGroupTable.name,
					total: count(),
					present: sql<number>`COUNT(*) FILTER (WHERE ${attendanceTable.status} = ${AttendanceStatus.present})`,
					late: sql<number>`COUNT(*) FILTER (WHERE ${attendanceTable.status} = ${AttendanceStatus.late})`,
					absent: sql<number>`COUNT(*) FILTER (WHERE ${attendanceTable.status} = ${AttendanceStatus.absent})`,
				})
				.from(attendanceTable)
				.innerJoin(
					trainingSessionTable,
					eq(attendanceTable.sessionId, trainingSessionTable.id),
				)
				.leftJoin(
					athleteGroupTable,
					eq(trainingSessionTable.athleteGroupId, athleteGroupTable.id),
				)
				.where(
					and(
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						gte(trainingSessionTable.startTime, from),
						lte(trainingSessionTable.startTime, to),
					),
				)
				.groupBy(trainingSessionTable.athleteGroupId, athleteGroupTable.name)
				.orderBy(desc(count()));

			return result.map((r) => {
				const attended = Number(r.present) + Number(r.late);
				const total = Number(r.total);
				return {
					groupId: r.groupId,
					groupName: r.groupName ?? "Sin grupo",
					total,
					present: Number(r.present),
					late: Number(r.late),
					absent: Number(r.absent),
					rate: total > 0 ? (attended / total) * 100 : 0,
				};
			});
		}),

	// Sessions by coach
	getSessionsByCoach: protectedOrganizationProcedure
		.input(getSessionsByCoachSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			const result = await db
				.select({
					coachId: coachTable.id,
					coachName: userTable.name,
					total: count(),
					completed: sql<number>`COUNT(*) FILTER (WHERE ${trainingSessionTable.status} = ${TrainingSessionStatus.completed})`,
					cancelled: sql<number>`COUNT(*) FILTER (WHERE ${trainingSessionTable.status} = ${TrainingSessionStatus.cancelled})`,
				})
				.from(trainingSessionCoachTable)
				.innerJoin(
					trainingSessionTable,
					eq(trainingSessionCoachTable.sessionId, trainingSessionTable.id),
				)
				.innerJoin(
					coachTable,
					eq(trainingSessionCoachTable.coachId, coachTable.id),
				)
				.innerJoin(userTable, eq(coachTable.userId, userTable.id))
				.where(
					and(
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						gte(trainingSessionTable.startTime, from),
						lte(trainingSessionTable.startTime, to),
					),
				)
				.groupBy(coachTable.id, userTable.name)
				.orderBy(desc(count()));

			return result.map((r) => ({
				coachId: r.coachId,
				coachName: r.coachName ?? "Unknown",
				total: Number(r.total),
				completed: Number(r.completed),
				cancelled: Number(r.cancelled),
				completionRate:
					Number(r.total) > 0
						? (Number(r.completed) / Number(r.total)) * 100
						: 0,
			}));
		}),

	// Attendance trend over time
	getAttendanceTrend: protectedOrganizationProcedure
		.input(getAttendanceTrendSchema)
		.query(async ({ ctx, input }) => {
			const { from, to } = input.dateRange ?? getDefaultDateRange();

			let dateTrunc: ReturnType<typeof sql>;
			switch (input.period) {
				case "day":
					dateTrunc = sql`DATE_TRUNC('day', ${trainingSessionTable.startTime})`;
					break;
				case "week":
					dateTrunc = sql`DATE_TRUNC('week', ${trainingSessionTable.startTime})`;
					break;
				case "year":
					dateTrunc = sql`DATE_TRUNC('year', ${trainingSessionTable.startTime})`;
					break;
				default:
					dateTrunc = sql`DATE_TRUNC('month', ${trainingSessionTable.startTime})`;
			}

			const result = await db
				.select({
					period: dateTrunc,
					total: count(),
					present: sql<number>`COUNT(*) FILTER (WHERE ${attendanceTable.status} = ${AttendanceStatus.present})`,
					late: sql<number>`COUNT(*) FILTER (WHERE ${attendanceTable.status} = ${AttendanceStatus.late})`,
					absent: sql<number>`COUNT(*) FILTER (WHERE ${attendanceTable.status} = ${AttendanceStatus.absent})`,
				})
				.from(attendanceTable)
				.innerJoin(
					trainingSessionTable,
					eq(attendanceTable.sessionId, trainingSessionTable.id),
				)
				.where(
					and(
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						gte(trainingSessionTable.startTime, from),
						lte(trainingSessionTable.startTime, to),
					),
				)
				.groupBy(dateTrunc)
				.orderBy(dateTrunc);

			return result.map((r) => {
				const attended = Number(r.present) + Number(r.late);
				const total = Number(r.total);
				return {
					period: r.period as Date,
					total,
					present: Number(r.present),
					late: Number(r.late),
					absent: Number(r.absent),
					rate: total > 0 ? (attended / total) * 100 : 0,
				};
			});
		}),

	// ============================================================================
	// PENDING PAYMENTS REPORTS
	// ============================================================================

	// Pending event registrations
	getPendingEventRegistrations: protectedOrganizationProcedure
		.input(getPendingEventRegistrationsSchema)
		.query(async ({ ctx, input }) => {
			const [registrations, countResult] = await Promise.all([
				db.query.eventRegistrationTable.findMany({
					where: and(
						eq(eventRegistrationTable.organizationId, ctx.organization.id),
						eq(
							eventRegistrationTable.status,
							EventRegistrationStatus.pendingPayment,
						),
					),
					limit: input.limit,
					offset: input.offset,
					orderBy: desc(eventRegistrationTable.createdAt),
					with: {
						event: {
							columns: {
								id: true,
								title: true,
								startDate: true,
								eventType: true,
							},
						},
						athlete: {
							with: {
								user: { columns: { id: true, name: true, email: true } },
							},
						},
					},
				}),
				db
					.select({ count: count() })
					.from(eventRegistrationTable)
					.where(
						and(
							eq(eventRegistrationTable.organizationId, ctx.organization.id),
							eq(
								eventRegistrationTable.status,
								EventRegistrationStatus.pendingPayment,
							),
						),
					),
			]);

			// Calculate total outstanding for events
			const totalOutstanding = await db
				.select({
					total: sum(
						sql`${eventRegistrationTable.price} - ${eventRegistrationTable.paidAmount}`,
					),
				})
				.from(eventRegistrationTable)
				.where(
					and(
						eq(eventRegistrationTable.organizationId, ctx.organization.id),
						eq(
							eventRegistrationTable.status,
							EventRegistrationStatus.pendingPayment,
						),
					),
				);

			return {
				registrations: registrations.map((r) => ({
					id: r.id,
					eventId: r.eventId,
					eventTitle: r.event?.title ?? "Evento desconocido",
					eventDate: r.event?.startDate,
					eventType: r.event?.eventType,
					athleteId: r.athleteId,
					athleteName:
						r.athlete?.user?.name ?? r.registrantName ?? "Sin nombre",
					athleteEmail:
						r.athlete?.user?.email ?? r.registrantEmail ?? "Sin email",
					price: r.price,
					paidAmount: r.paidAmount,
					currency: r.currency,
					discountAmount: r.discountAmount ?? 0,
					registeredAt: r.registeredAt,
					createdAt: r.createdAt,
				})),
				total: countResult[0]?.count ?? 0,
				totalOutstandingAmount: Number(totalOutstanding[0]?.total ?? 0),
			};
		}),

	// Combined pending payments summary
	getPendingSummary: protectedOrganizationProcedure
		.input(getPendingSummarySchema)
		.query(async ({ ctx }) => {
			// Get pending training payments summary
			const trainingPending = await db
				.select({
					totalPending: sum(
						sql`${trainingPaymentTable.amount} - ${trainingPaymentTable.paidAmount}`,
					),
					pendingCount: count(),
				})
				.from(trainingPaymentTable)
				.where(
					and(
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
						eq(trainingPaymentTable.status, TrainingPaymentStatus.pending),
					),
				);

			// Get pending event registrations summary
			const eventPending = await db
				.select({
					totalPending: sum(
						sql`${eventRegistrationTable.price} - ${eventRegistrationTable.paidAmount}`,
					),
					pendingCount: count(),
				})
				.from(eventRegistrationTable)
				.where(
					and(
						eq(eventRegistrationTable.organizationId, ctx.organization.id),
						eq(
							eventRegistrationTable.status,
							EventRegistrationStatus.pendingPayment,
						),
					),
				);

			const trainingAmount = Number(trainingPending[0]?.totalPending ?? 0);
			const trainingCount = Number(trainingPending[0]?.pendingCount ?? 0);
			const eventAmount = Number(eventPending[0]?.totalPending ?? 0);
			const eventCount = Number(eventPending[0]?.pendingCount ?? 0);

			return {
				training: {
					totalAmount: trainingAmount,
					count: trainingCount,
				},
				events: {
					totalAmount: eventAmount,
					count: eventCount,
				},
				combined: {
					totalAmount: trainingAmount + eventAmount,
					count: trainingCount + eventCount,
				},
			};
		}),
});
