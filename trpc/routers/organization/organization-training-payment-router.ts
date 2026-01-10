import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	lte,
	or,
	type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
	athleteTable,
	trainingPaymentTable,
	trainingSessionTable,
} from "@/lib/db/schema/tables";
import { TrainingPaymentStatus } from "@/lib/db/schema/enums";
import {
	bulkDeleteTrainingPaymentsSchema,
	bulkUpdateTrainingPaymentsStatusSchema,
	createTrainingPaymentSchema,
	deleteTrainingPaymentSchema,
	getAthletePaymentsSchema,
	getSessionPaymentsSchema,
	listTrainingPaymentsSchema,
	recordPaymentSchema,
	updateTrainingPaymentSchema,
} from "@/schemas/organization-training-payment-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationTrainingPaymentRouter = createTRPCRouter({
	list: protectedOrganizationProcedure
		.input(listTrainingPaymentsSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(trainingPaymentTable.organizationId, ctx.organization.id),
			];

			// Search query
			if (input.query) {
				conditions.push(
					or(
						ilike(trainingPaymentTable.description, `%${input.query}%`),
						ilike(trainingPaymentTable.receiptNumber, `%${input.query}%`),
					)!,
				);
			}

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(
					inArray(trainingPaymentTable.status, input.filters.status),
				);
			}

			// Payment method filter
			if (input.filters?.paymentMethod && input.filters.paymentMethod.length > 0) {
				conditions.push(
					inArray(trainingPaymentTable.paymentMethod, input.filters.paymentMethod),
				);
			}

			// Athlete filter
			if (input.filters?.athleteId) {
				conditions.push(
					eq(trainingPaymentTable.athleteId, input.filters.athleteId),
				);
			}

			// Session filter
			if (input.filters?.sessionId) {
				conditions.push(
					eq(trainingPaymentTable.sessionId, input.filters.sessionId),
				);
			}

			// Date range filter
			if (input.filters?.dateRange) {
				conditions.push(
					and(
						gte(trainingPaymentTable.paymentDate, input.filters.dateRange.from),
						lte(trainingPaymentTable.paymentDate, input.filters.dateRange.to),
					)!,
				);
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "amount":
					orderByColumn = sortDirection(trainingPaymentTable.amount);
					break;
				case "paymentDate":
					orderByColumn = sortDirection(trainingPaymentTable.paymentDate);
					break;
				case "status":
					orderByColumn = sortDirection(trainingPaymentTable.status);
					break;
				default:
					orderByColumn = sortDirection(trainingPaymentTable.createdAt);
					break;
			}

			// Run queries in parallel
			const [payments, countResult] = await Promise.all([
				db.query.trainingPaymentTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						athlete: {
							with: {
								user: {
									columns: { id: true, name: true, email: true, image: true },
								},
							},
						},
						session: {
							columns: { id: true, title: true, startTime: true },
						},
						recordedByUser: {
							columns: { id: true, name: true },
						},
					},
				}),
				db
					.select({ count: count() })
					.from(trainingPaymentTable)
					.where(whereCondition),
			]);

			return { payments, total: countResult[0]?.count ?? 0 };
		}),

	get: protectedOrganizationProcedure
		.input(deleteTrainingPaymentSchema)
		.query(async ({ ctx, input }) => {
			const payment = await db.query.trainingPaymentTable.findFirst({
				where: and(
					eq(trainingPaymentTable.id, input.id),
					eq(trainingPaymentTable.organizationId, ctx.organization.id),
				),
				with: {
					athlete: {
						with: {
							user: {
								columns: { id: true, name: true, email: true, image: true },
							},
						},
					},
					session: true,
					recordedByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			return payment;
		}),

	// Get payments for an athlete
	getAthletePayments: protectedOrganizationProcedure
		.input(getAthletePaymentsSchema)
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

			const payments = await db.query.trainingPaymentTable.findMany({
				where: and(
					eq(trainingPaymentTable.athleteId, input.athleteId),
					eq(trainingPaymentTable.organizationId, ctx.organization.id),
				),
				limit: input.limit,
				offset: input.offset,
				orderBy: desc(trainingPaymentTable.createdAt),
				with: {
					session: {
						columns: { id: true, title: true, startTime: true },
					},
				},
			});

			return payments;
		}),

	// Get payments for a session
	getSessionPayments: protectedOrganizationProcedure
		.input(getSessionPaymentsSchema)
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
					message: "Session not found",
				});
			}

			const payments = await db.query.trainingPaymentTable.findMany({
				where: eq(trainingPaymentTable.sessionId, input.sessionId),
				orderBy: desc(trainingPaymentTable.createdAt),
				with: {
					athlete: {
						with: {
							user: {
								columns: { id: true, name: true, email: true, image: true },
							},
						},
					},
				},
			});

			return payments;
		}),

	create: protectedOrganizationProcedure
		.input(createTrainingPaymentSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify session belongs to organization if provided
			if (input.sessionId) {
				const session = await db.query.trainingSessionTable.findFirst({
					where: and(
						eq(trainingSessionTable.id, input.sessionId),
						eq(trainingSessionTable.organizationId, ctx.organization.id),
					),
				});

				if (!session) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Session not found",
					});
				}
			}

			// Verify athlete belongs to organization if provided
			if (input.athleteId) {
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
			}

			const [payment] = await db
				.insert(trainingPaymentTable)
				.values({
					organizationId: ctx.organization.id,
					recordedBy: ctx.user.id,
					...input,
				})
				.returning();

			return payment;
		}),

	update: protectedOrganizationProcedure
		.input(updateTrainingPaymentSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Calculate status if paidAmount changes
			let status = data.status;
			if (data.paidAmount !== undefined && !data.status) {
				const payment = await db.query.trainingPaymentTable.findFirst({
					where: and(
						eq(trainingPaymentTable.id, id),
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
					),
				});

				if (payment) {
					const amount = data.amount ?? payment.amount;
					const paidAmount = data.paidAmount;

					if (paidAmount >= amount) {
						status = TrainingPaymentStatus.paid;
					} else if (paidAmount > 0) {
						status = TrainingPaymentStatus.partial;
					}
				}
			}

			const [updatedPayment] = await db
				.update(trainingPaymentTable)
				.set({ ...data, status })
				.where(
					and(
						eq(trainingPaymentTable.id, id),
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updatedPayment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			return updatedPayment;
		}),

	// Record a payment (convenience method to mark as paid)
	recordPayment: protectedOrganizationProcedure
		.input(recordPaymentSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const payment = await db.query.trainingPaymentTable.findFirst({
				where: and(
					eq(trainingPaymentTable.id, id),
					eq(trainingPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			const newPaidAmount = payment.paidAmount + data.paidAmount;
			const status =
				newPaidAmount >= payment.amount
					? TrainingPaymentStatus.paid
					: TrainingPaymentStatus.partial;

			const [updatedPayment] = await db
				.update(trainingPaymentTable)
				.set({
					paidAmount: newPaidAmount,
					status,
					paymentMethod: data.paymentMethod,
					paymentDate: data.paymentDate ?? new Date(),
					receiptNumber: data.receiptNumber,
					notes: data.notes,
					recordedBy: ctx.user.id,
				})
				.where(eq(trainingPaymentTable.id, id))
				.returning();

			return updatedPayment;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteTrainingPaymentSchema)
		.mutation(async ({ ctx, input }) => {
			const [deletedPayment] = await db
				.delete(trainingPaymentTable)
				.where(
					and(
						eq(trainingPaymentTable.id, input.id),
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!deletedPayment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			return { success: true };
		}),

	bulkDelete: protectedOrganizationProcedure
		.input(bulkDeleteTrainingPaymentsSchema)
		.mutation(async ({ ctx, input }) => {
			const deleted = await db
				.delete(trainingPaymentTable)
				.where(
					and(
						inArray(trainingPaymentTable.id, input.ids),
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: trainingPaymentTable.id });

			return { success: true, count: deleted.length };
		}),

	bulkUpdateStatus: protectedOrganizationProcedure
		.input(bulkUpdateTrainingPaymentsStatusSchema)
		.mutation(async ({ ctx, input }) => {
			const updated = await db
				.update(trainingPaymentTable)
				.set({ status: input.status })
				.where(
					and(
						inArray(trainingPaymentTable.id, input.ids),
						eq(trainingPaymentTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: trainingPaymentTable.id });

			return { success: true, count: updated.length };
		}),
});
