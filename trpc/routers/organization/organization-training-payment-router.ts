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
	sql,
	sum,
} from "drizzle-orm";
import { z } from "zod/v4";
import { createCashMovementIfCash } from "@/lib/cash-register-helpers";
import { db } from "@/lib/db";
import {
	AuditAction,
	AuditEntityType,
	CashMovementReferenceType,
	CashMovementType,
	TrainingPaymentStatus,
} from "@/lib/db/schema/enums";
import {
	athleteTable,
	eventRegistrationTable,
	serviceTable,
	trainingPaymentSessionTable,
	trainingPaymentTable,
	trainingSessionTable,
} from "@/lib/db/schema/tables";
import { env } from "@/lib/env";
import {
	deleteObject,
	generateStorageKey,
	getSignedUploadUrl,
	getSignedUrl,
} from "@/lib/storage";
import {
	addSessionsToPaymentSchema,
	bulkDeleteTrainingPaymentsSchema,
	bulkUpdateTrainingPaymentsStatusSchema,
	createTrainingPaymentSchema,
	deleteTrainingPaymentReceiptSchema,
	deleteTrainingPaymentSchema,
	getAthletePaymentsSchema,
	getPaymentSessionsSchema,
	getSessionPaymentsSchema,
	getTrainingPaymentReceiptDownloadUrlSchema,
	getTrainingPaymentReceiptUploadUrlSchema,
	listTrainingPaymentsSchema,
	recordPaymentSchema,
	removeSessionsFromPaymentSchema,
	updateTrainingPaymentReceiptSchema,
	updateTrainingPaymentSchema,
} from "@/schemas/organization-training-payment-schemas";
import {
	createTRPCRouter,
	protectedOrganizationProcedure,
	protectedOrgStaffProcedure,
} from "@/trpc/init";
import { createAuditMiddleware } from "@/trpc/middleware/audit-middleware";

export const organizationTrainingPaymentRouter = createTRPCRouter({
	list: protectedOrgStaffProcedure
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
			if (
				input.filters?.paymentMethod &&
				input.filters.paymentMethod.length > 0
			) {
				conditions.push(
					inArray(
						trainingPaymentTable.paymentMethod,
						input.filters.paymentMethod,
					),
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

			// Service filter
			if (input.filters?.serviceId) {
				conditions.push(
					eq(trainingPaymentTable.serviceId, input.filters.serviceId),
				);
			}

			// Type filter
			if (input.filters?.type) {
				conditions.push(eq(trainingPaymentTable.type, input.filters.type));
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
						// Include linked sessions count (for package payments)
						sessions: {
							columns: { id: true },
							with: {
								session: {
									columns: { id: true, title: true, startTime: true },
								},
							},
						},
						service: {
							columns: { id: true, name: true, currentPrice: true },
						},
						registration: {
							columns: { id: true, registrantName: true },
							with: {
								event: {
									columns: { id: true, title: true },
								},
							},
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

	get: protectedOrgStaffProcedure
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
					// Include linked sessions (for package payments)
					sessions: {
						with: {
							session: {
								columns: { id: true, title: true, startTime: true },
							},
						},
					},
					service: {
						columns: { id: true, name: true, currentPrice: true },
					},
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
	getAthletePayments: protectedOrgStaffProcedure
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
	getSessionPayments: protectedOrgStaffProcedure
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

	create: protectedOrgStaffProcedure
		.input(createTrainingPaymentSchema)
		.use(
			createAuditMiddleware({
				entityType: AuditEntityType.trainingPayment,
				action: AuditAction.create,
				getEntityId: (result: { id: string }) => result.id,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { sessionIds, ...paymentData } = input;

			// Verify registration belongs to organization if provided (event payments)
			if (paymentData.registrationId) {
				const registration = await db.query.eventRegistrationTable.findFirst({
					where: and(
						eq(eventRegistrationTable.id, paymentData.registrationId),
						eq(eventRegistrationTable.organizationId, ctx.organization.id),
					),
				});

				if (!registration) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Registration not found",
					});
				}
			}

			// Verify single session belongs to organization if provided (legacy)
			if (paymentData.sessionId) {
				const session = await db.query.trainingSessionTable.findFirst({
					where: and(
						eq(trainingSessionTable.id, paymentData.sessionId),
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

			// Verify multiple sessions belong to organization if provided (package)
			if (sessionIds && sessionIds.length > 0) {
				const sessions = await db.query.trainingSessionTable.findMany({
					where: and(
						inArray(trainingSessionTable.id, sessionIds),
						eq(trainingSessionTable.organizationId, ctx.organization.id),
					),
				});

				if (sessions.length !== sessionIds.length) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "One or more sessions not found",
					});
				}
			}

			// Verify athlete belongs to organization if provided
			if (paymentData.athleteId) {
				const athlete = await db.query.athleteTable.findFirst({
					where: and(
						eq(athleteTable.id, paymentData.athleteId),
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

			// Verify service belongs to organization if provided
			if (paymentData.serviceId) {
				const service = await db.query.serviceTable.findFirst({
					where: and(
						eq(serviceTable.id, paymentData.serviceId),
						eq(serviceTable.organizationId, ctx.organization.id),
					),
				});

				if (!service) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Service not found",
					});
				}
			}

			const [payment] = await db
				.insert(trainingPaymentTable)
				.values({
					organizationId: ctx.organization.id,
					recordedBy: ctx.user.id,
					...paymentData,
				})
				.returning();

			if (payment) {
				// Link multiple sessions if provided (package payment)
				if (sessionIds && sessionIds.length > 0) {
					await db.insert(trainingPaymentSessionTable).values(
						sessionIds.map((sessionId) => ({
							paymentId: payment.id,
							sessionId,
						})),
					);
				}

				await createCashMovementIfCash({
					organizationId: ctx.organization.id,
					paymentMethod: paymentData.paymentMethod,
					amount: paymentData.paidAmount,
					description: paymentData.description ?? "Entrenamiento",
					referenceType: CashMovementReferenceType.payment,
					referenceId: payment.id,
					recordedBy: ctx.user.id,
					type: CashMovementType.income,
				});
			}

			return payment;
		}),

	update: protectedOrgStaffProcedure
		.input(updateTrainingPaymentSchema)
		.use(
			createAuditMiddleware({
				entityType: AuditEntityType.trainingPayment,
				action: AuditAction.update,
				getEntityId: (_result: unknown, input: unknown) =>
					(input as { id: string }).id,
			}),
		)
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
	recordPayment: protectedOrgStaffProcedure
		.input(recordPaymentSchema)
		.use(
			createAuditMiddleware({
				entityType: AuditEntityType.trainingPayment,
				action: AuditAction.update,
				getEntityId: (_result: unknown, input: unknown) =>
					(input as { id: string }).id,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const payment = await db.query.trainingPaymentTable.findFirst({
				where: and(
					eq(trainingPaymentTable.id, id),
					eq(trainingPaymentTable.organizationId, ctx.organization.id),
				),
				with: {
					athlete: {
						with: {
							user: { columns: { name: true } },
						},
					},
				},
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

			// Create cash movement if payment is in cash
			const athleteName = payment.athlete?.user?.name ?? "Atleta";
			await createCashMovementIfCash({
				organizationId: ctx.organization.id,
				paymentMethod: data.paymentMethod,
				amount: data.paidAmount,
				description: athleteName,
				referenceType: CashMovementReferenceType.payment,
				referenceId: id,
				recordedBy: ctx.user.id,
			});

			return updatedPayment;
		}),

	delete: protectedOrgStaffProcedure
		.input(deleteTrainingPaymentSchema)
		.use(
			createAuditMiddleware({
				entityType: AuditEntityType.trainingPayment,
				action: AuditAction.delete,
				getEntityId: (_result: unknown, input: unknown) =>
					(input as { id: string }).id,
			}),
		)
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

	bulkDelete: protectedOrgStaffProcedure
		.input(bulkDeleteTrainingPaymentsSchema)
		.use(
			createAuditMiddleware({
				entityType: AuditEntityType.trainingPayment,
				action: AuditAction.bulkDelete,
				getEntityId: (_result: unknown, input: unknown) =>
					(input as { ids: string[] }).ids.join(","),
			}),
		)
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

	bulkUpdateStatus: protectedOrgStaffProcedure
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

	// ============================================================================
	// RECEIPT UPLOAD ENDPOINTS
	// ============================================================================

	getReceiptUploadUrl: protectedOrgStaffProcedure
		.input(getTrainingPaymentReceiptUploadUrlSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify payment belongs to organization
			const payment = await db.query.trainingPaymentTable.findFirst({
				where: and(
					eq(trainingPaymentTable.id, input.paymentId),
					eq(trainingPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			// Generate unique storage key
			const key = generateStorageKey(
				"training-payment-receipts",
				ctx.organization.id,
				input.filename,
			);

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

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

	updatePaymentReceipt: protectedOrgStaffProcedure
		.input(updateTrainingPaymentReceiptSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify payment belongs to organization
			const payment = await db.query.trainingPaymentTable.findFirst({
				where: and(
					eq(trainingPaymentTable.id, input.paymentId),
					eq(trainingPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			// Delete old receipt if exists
			if (payment.receiptImageKey) {
				const bucket = env.S3_BUCKET;
				if (bucket) {
					try {
						await deleteObject(payment.receiptImageKey, bucket);
					} catch {
						// Ignore deletion errors
					}
				}
			}

			// Update payment with new receipt
			const [updated] = await db
				.update(trainingPaymentTable)
				.set({
					receiptImageKey: input.receiptImageKey,
				})
				.where(eq(trainingPaymentTable.id, input.paymentId))
				.returning();

			return updated;
		}),

	deletePaymentReceipt: protectedOrgStaffProcedure
		.input(deleteTrainingPaymentReceiptSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify payment belongs to organization
			const payment = await db.query.trainingPaymentTable.findFirst({
				where: and(
					eq(trainingPaymentTable.id, input.paymentId),
					eq(trainingPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			if (!payment.receiptImageKey) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Payment has no receipt image",
				});
			}

			const bucket = env.S3_BUCKET;
			if (bucket) {
				try {
					await deleteObject(payment.receiptImageKey, bucket);
				} catch {
					// Ignore deletion errors
				}
			}

			// Update payment to remove receipt
			const [updated] = await db
				.update(trainingPaymentTable)
				.set({
					receiptImageKey: null,
				})
				.where(eq(trainingPaymentTable.id, input.paymentId))
				.returning();

			return updated;
		}),

	getReceiptDownloadUrl: protectedOrgStaffProcedure
		.input(getTrainingPaymentReceiptDownloadUrlSchema)
		.query(async ({ ctx, input }) => {
			// Verify payment belongs to organization
			const payment = await db.query.trainingPaymentTable.findFirst({
				where: and(
					eq(trainingPaymentTable.id, input.paymentId),
					eq(trainingPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			if (!payment.receiptImageKey) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Payment has no receipt image",
				});
			}

			const bucket = env.S3_BUCKET;
			if (!bucket) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Storage not configured",
				});
			}

			// Generate signed download URL (valid for 1 hour)
			const downloadUrl = await getSignedUrl(payment.receiptImageKey, bucket, {
				expiresIn: 3600,
			});

			return {
				downloadUrl,
				key: payment.receiptImageKey,
			};
		}),

	// List payments for the current user as athlete
	listMyPayments: protectedOrganizationProcedure.query(async ({ ctx }) => {
		// First, find the athlete record for the current user
		const athlete = await db.query.athleteTable.findFirst({
			where: and(
				eq(athleteTable.userId, ctx.user.id),
				eq(athleteTable.organizationId, ctx.organization.id),
			),
		});

		if (!athlete) {
			return {
				payments: [],
				athlete: null,
				summary: { total: 0, paid: 0, pending: 0 },
			};
		}

		const payments = await db.query.trainingPaymentTable.findMany({
			where: and(
				eq(trainingPaymentTable.athleteId, athlete.id),
				eq(trainingPaymentTable.organizationId, ctx.organization.id),
			),
			orderBy: desc(trainingPaymentTable.createdAt),
			with: {
				session: {
					columns: { id: true, title: true, startTime: true },
				},
				// Include linked sessions (for package payments)
				sessions: {
					columns: { id: true },
					with: {
						session: {
							columns: { id: true, title: true, startTime: true },
						},
					},
				},
			},
		});

		// Calculate summary
		const summary = payments.reduce(
			(acc, p) => {
				acc.total += p.amount;
				if (p.status === "paid") {
					acc.paid += p.paidAmount;
				} else {
					acc.pending += p.amount - p.paidAmount;
				}
				return acc;
			},
			{ total: 0, paid: 0, pending: 0 },
		);

		return { payments, athlete, summary };
	}),

	// Get payments summary (today, week, month, pending, total)
	getPaymentsSummary: protectedOrgStaffProcedure.query(async ({ ctx }) => {
		const now = new Date();

		const todayStart = new Date(now);
		todayStart.setHours(0, 0, 0, 0);

		const todayEnd = new Date(now);
		todayEnd.setHours(23, 59, 59, 999);

		// Monday-based week start
		const weekStart = new Date(now);
		const day = weekStart.getDay();
		const diff = day === 0 ? 6 : day - 1;
		weekStart.setDate(weekStart.getDate() - diff);
		weekStart.setHours(0, 0, 0, 0);

		const monthStart = new Date(now);
		monthStart.setDate(1);
		monthStart.setHours(0, 0, 0, 0);

		const orgFilter = eq(
			trainingPaymentTable.organizationId,
			ctx.organization.id,
		);
		const paidStatus = eq(
			trainingPaymentTable.status,
			TrainingPaymentStatus.paid,
		);

		const [todayResult, weekResult, monthResult, pendingResult, totalResult] =
			await Promise.all([
				// Collected today
				db
					.select({
						total: sum(trainingPaymentTable.paidAmount),
						count: count(),
					})
					.from(trainingPaymentTable)
					.where(
						and(
							orgFilter,
							paidStatus,
							gte(trainingPaymentTable.paymentDate, todayStart),
							lte(trainingPaymentTable.paymentDate, todayEnd),
						),
					),

				// Collected this week (Mon-Sun)
				db
					.select({
						total: sum(trainingPaymentTable.paidAmount),
						count: count(),
					})
					.from(trainingPaymentTable)
					.where(
						and(
							orgFilter,
							paidStatus,
							gte(trainingPaymentTable.paymentDate, weekStart),
							lte(trainingPaymentTable.paymentDate, todayEnd),
						),
					),

				// Collected this month
				db
					.select({
						total: sum(trainingPaymentTable.paidAmount),
						count: count(),
					})
					.from(trainingPaymentTable)
					.where(
						and(
							orgFilter,
							paidStatus,
							gte(trainingPaymentTable.paymentDate, monthStart),
							lte(trainingPaymentTable.paymentDate, todayEnd),
						),
					),

				// Pending (outstanding balance)
				db
					.select({
						total: sum(
							sql`${trainingPaymentTable.amount} - ${trainingPaymentTable.paidAmount}`,
						),
						count: count(),
					})
					.from(trainingPaymentTable)
					.where(
						and(
							orgFilter,
							or(
								eq(trainingPaymentTable.status, TrainingPaymentStatus.pending),
								eq(trainingPaymentTable.status, TrainingPaymentStatus.partial),
							),
						),
					),

				// Total collected (all time)
				db
					.select({
						total: sum(trainingPaymentTable.paidAmount),
						count: count(),
					})
					.from(trainingPaymentTable)
					.where(and(orgFilter, paidStatus)),
			]);

		return {
			today: {
				total: Number(todayResult[0]?.total ?? 0),
				count: Number(todayResult[0]?.count ?? 0),
			},
			week: {
				total: Number(weekResult[0]?.total ?? 0),
				count: Number(weekResult[0]?.count ?? 0),
			},
			month: {
				total: Number(monthResult[0]?.total ?? 0),
				count: Number(monthResult[0]?.count ?? 0),
			},
			pending: {
				total: Number(pendingResult[0]?.total ?? 0),
				count: Number(pendingResult[0]?.count ?? 0),
			},
			totalCollected: {
				total: Number(totalResult[0]?.total ?? 0),
				count: Number(totalResult[0]?.count ?? 0),
			},
		};
	}),

	// Get service price for a session (used by payment form for auto-fill)
	getServicePriceForSession: protectedOrgStaffProcedure
		.input(z.object({ sessionId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const session = await db.query.trainingSessionTable.findFirst({
				where: and(
					eq(trainingSessionTable.id, input.sessionId),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
				columns: { id: true, serviceId: true },
				with: {
					service: {
						columns: {
							id: true,
							name: true,
							currentPrice: true,
							currency: true,
						},
					},
					athleteGroup: {
						columns: { id: true, serviceId: true },
						with: {
							service: {
								columns: {
									id: true,
									name: true,
									currentPrice: true,
									currency: true,
								},
							},
						},
					},
				},
			});

			if (!session) return null;

			// Session's own service takes priority, then group default
			const service = session.service ?? session.athleteGroup?.service;
			if (!service) return null;

			return {
				serviceId: service.id,
				serviceName: service.name,
				price: service.currentPrice,
				currency: service.currency,
			};
		}),

	// Get service price directly (used when creating a payment without a session)
	getServicePrice: protectedOrgStaffProcedure
		.input(z.object({ serviceId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const service = await db.query.serviceTable.findFirst({
				where: and(
					eq(serviceTable.id, input.serviceId),
					eq(serviceTable.organizationId, ctx.organization.id),
				),
				columns: {
					id: true,
					name: true,
					currentPrice: true,
					currency: true,
				},
			});

			if (!service) return null;

			return {
				serviceId: service.id,
				serviceName: service.name,
				price: service.currentPrice,
				currency: service.currency,
			};
		}),

	// List events (registrations) for a specific athlete (used by payment form)
	listEventsForAthlete: protectedOrgStaffProcedure
		.input(z.object({ athleteId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const registrations = await db.query.eventRegistrationTable.findMany({
				where: and(
					eq(eventRegistrationTable.athleteId, input.athleteId),
					eq(eventRegistrationTable.organizationId, ctx.organization.id),
				),
				columns: {
					id: true,
					registrantName: true,
					price: true,
					paidAmount: true,
				},
				with: {
					event: {
						columns: { id: true, title: true, startDate: true },
					},
				},
			});
			return registrations;
		}),

	// ============================================================================
	// PAYMENT SESSIONS ENDPOINTS (for package payments)
	// ============================================================================

	// Get sessions linked to a payment
	getPaymentSessions: protectedOrgStaffProcedure
		.input(getPaymentSessionsSchema)
		.query(async ({ ctx, input }) => {
			// Verify payment belongs to organization
			const payment = await db.query.trainingPaymentTable.findFirst({
				where: and(
					eq(trainingPaymentTable.id, input.paymentId),
					eq(trainingPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			const paymentSessions =
				await db.query.trainingPaymentSessionTable.findMany({
					where: eq(trainingPaymentSessionTable.paymentId, input.paymentId),
					with: {
						session: {
							columns: {
								id: true,
								title: true,
								startTime: true,
								endTime: true,
							},
							with: {
								location: {
									columns: { id: true, name: true },
								},
							},
						},
					},
				});

			return paymentSessions.map((ps) => ps.session);
		}),

	// Add sessions to a payment (for package payments)
	addSessionsToPayment: protectedOrgStaffProcedure
		.input(addSessionsToPaymentSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify payment belongs to organization
			const payment = await db.query.trainingPaymentTable.findFirst({
				where: and(
					eq(trainingPaymentTable.id, input.paymentId),
					eq(trainingPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			// Verify all sessions belong to organization
			const sessions = await db.query.trainingSessionTable.findMany({
				where: and(
					inArray(trainingSessionTable.id, input.sessionIds),
					eq(trainingSessionTable.organizationId, ctx.organization.id),
				),
			});

			if (sessions.length !== input.sessionIds.length) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "One or more sessions not found",
				});
			}

			// Insert payment-session links (ignore duplicates)
			await db
				.insert(trainingPaymentSessionTable)
				.values(
					input.sessionIds.map((sessionId) => ({
						paymentId: input.paymentId,
						sessionId,
					})),
				)
				.onConflictDoNothing();

			return { success: true, count: input.sessionIds.length };
		}),

	// Remove sessions from a payment
	removeSessionsFromPayment: protectedOrgStaffProcedure
		.input(removeSessionsFromPaymentSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify payment belongs to organization
			const payment = await db.query.trainingPaymentTable.findFirst({
				where: and(
					eq(trainingPaymentTable.id, input.paymentId),
					eq(trainingPaymentTable.organizationId, ctx.organization.id),
				),
			});

			if (!payment) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payment not found",
				});
			}

			// Delete payment-session links
			const deleted = await db
				.delete(trainingPaymentSessionTable)
				.where(
					and(
						eq(trainingPaymentSessionTable.paymentId, input.paymentId),
						inArray(trainingPaymentSessionTable.sessionId, input.sessionIds),
					),
				)
				.returning({ id: trainingPaymentSessionTable.id });

			return { success: true, count: deleted.length };
		}),
});
