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
	sum,
} from "drizzle-orm";
import { createCashMovementIfCash } from "@/lib/cash-register-helpers";
import { db } from "@/lib/db";
import {
	CashMovementReferenceType,
	CashMovementType,
	CoachPaymentType,
	ExpenseCategoryType,
	PayrollStaffType,
	PayrollStatus,
	TrainingSessionStatus,
} from "@/lib/db/schema/enums";
import {
	coachTable,
	expenseCategoryTable,
	expenseTable,
	staffPayrollTable,
	trainingSessionCoachTable,
	trainingSessionTable,
	userTable,
} from "@/lib/db/schema/tables";
import {
	approvePayrollSchema,
	bulkApprovePayrollSchema,
	bulkDeletePayrollSchema,
	cancelPayrollSchema,
	createPayrollSchema,
	deletePayrollSchema,
	exportPayrollSchema,
	getCoachSessionsSchema,
	getPayrollSchema,
	getPayrollSummarySchema,
	listPayrollSchema,
	markPayrollAsPaidSchema,
	updatePayrollSchema,
} from "@/schemas/organization-payroll-schemas";
import { createTRPCRouter, protectedOrgAdminProcedure } from "@/trpc/init";

export const organizationPayrollRouter = createTRPCRouter({
	// ============================================================================
	// LIST & GET
	// ============================================================================

	list: protectedOrgAdminProcedure
		.input(listPayrollSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(staffPayrollTable.organizationId, ctx.organization.id),
			];

			// Search query
			if (input.query) {
				conditions.push(
					or(
						ilike(staffPayrollTable.concept, `%${input.query}%`),
						ilike(staffPayrollTable.externalName, `%${input.query}%`),
						ilike(staffPayrollTable.notes, `%${input.query}%`),
					)!,
				);
			}

			// Status filter
			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(
					inArray(staffPayrollTable.status, input.filters.status),
				);
			}

			// Staff type filter
			if (input.filters?.staffType && input.filters.staffType.length > 0) {
				conditions.push(
					inArray(staffPayrollTable.staffType, input.filters.staffType),
				);
			}

			// Period type filter
			if (input.filters?.periodType && input.filters.periodType.length > 0) {
				conditions.push(
					inArray(staffPayrollTable.periodType, input.filters.periodType),
				);
			}

			// Coach filter
			if (input.filters?.coachId) {
				conditions.push(eq(staffPayrollTable.coachId, input.filters.coachId));
			}

			// User filter
			if (input.filters?.userId) {
				conditions.push(eq(staffPayrollTable.userId, input.filters.userId));
			}

			// Date range filter
			if (input.filters?.dateRange) {
				conditions.push(
					and(
						gte(staffPayrollTable.periodStart, input.filters.dateRange.from),
						lte(staffPayrollTable.periodEnd, input.filters.dateRange.to),
					)!,
				);
			}

			// Amount range filter
			if (input.filters?.amountRange) {
				if (input.filters.amountRange.min !== undefined) {
					conditions.push(
						gte(staffPayrollTable.totalAmount, input.filters.amountRange.min),
					);
				}
				if (input.filters.amountRange.max !== undefined) {
					conditions.push(
						lte(staffPayrollTable.totalAmount, input.filters.amountRange.max),
					);
				}
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "totalAmount":
					orderByColumn = sortDirection(staffPayrollTable.totalAmount);
					break;
				case "status":
					orderByColumn = sortDirection(staffPayrollTable.status);
					break;
				case "periodStart":
					orderByColumn = sortDirection(staffPayrollTable.periodStart);
					break;
				default:
					orderByColumn = sortDirection(staffPayrollTable.createdAt);
					break;
			}

			const [payrolls, countResult] = await Promise.all([
				db.query.staffPayrollTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						coach: {
							columns: { id: true, specialty: true },
							with: {
								user: { columns: { id: true, name: true, email: true } },
							},
						},
						user: { columns: { id: true, name: true, email: true } },
						createdByUser: { columns: { id: true, name: true } },
						approvedByUser: { columns: { id: true, name: true } },
						paidByUser: { columns: { id: true, name: true } },
					},
				}),
				db
					.select({ count: count() })
					.from(staffPayrollTable)
					.where(whereCondition),
			]);

			return { payrolls, total: countResult[0]?.count ?? 0 };
		}),

	get: protectedOrgAdminProcedure
		.input(getPayrollSchema)
		.query(async ({ ctx, input }) => {
			const payroll = await db.query.staffPayrollTable.findFirst({
				where: and(
					eq(staffPayrollTable.id, input.id),
					eq(staffPayrollTable.organizationId, ctx.organization.id),
				),
				with: {
					coach: {
						columns: { id: true, specialty: true },
						with: {
							user: { columns: { id: true, name: true, email: true } },
						},
					},
					user: { columns: { id: true, name: true, email: true } },
					expense: true,
					createdByUser: { columns: { id: true, name: true } },
					approvedByUser: { columns: { id: true, name: true } },
					paidByUser: { columns: { id: true, name: true } },
				},
			});

			if (!payroll) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payroll not found",
				});
			}

			return payroll;
		}),

	// ============================================================================
	// CREATE
	// ============================================================================

	create: protectedOrgAdminProcedure
		.input(createPayrollSchema)
		.mutation(async ({ ctx, input }) => {
			// Validate period
			if (input.periodEnd <= input.periodStart) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Period end must be after period start",
				});
			}

			let baseSalary = input.baseSalary;
			let sessionCount: number | null = null;
			let ratePerSession: number | null = null;
			let coachPaymentType: CoachPaymentType | null = null;

			// Validate staff reference based on type
			if (input.staffType === PayrollStaffType.coach) {
				const coach = await db.query.coachTable.findFirst({
					where: and(
						eq(coachTable.id, input.coachId),
						eq(coachTable.organizationId, ctx.organization.id),
					),
				});
				if (!coach) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Coach not found",
					});
				}

				// Handle coach payment type
				coachPaymentType = input.coachPaymentType;

				if (coachPaymentType === CoachPaymentType.perSession) {
					// For per_session: calculate sessions and use rate
					if (!input.ratePerSession || input.ratePerSession <= 0) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message:
								"Rate per session is required for per_session payment type",
						});
					}

					ratePerSession = input.ratePerSession;

					// Calculate sessions if not provided
					if (input.sessionCount !== undefined && input.sessionCount > 0) {
						sessionCount = input.sessionCount;
					} else {
						// Count completed sessions in the period
						const sessions = await db
							.select({ count: count() })
							.from(trainingSessionCoachTable)
							.innerJoin(
								trainingSessionTable,
								eq(
									trainingSessionCoachTable.sessionId,
									trainingSessionTable.id,
								),
							)
							.where(
								and(
									eq(trainingSessionCoachTable.coachId, input.coachId),
									eq(trainingSessionTable.organizationId, ctx.organization.id),
									gte(trainingSessionTable.startTime, input.periodStart),
									lte(trainingSessionTable.startTime, input.periodEnd),
									eq(
										trainingSessionTable.status,
										TrainingSessionStatus.completed,
									),
								),
							);

						sessionCount = sessions[0]?.count ?? 0;
					}

					// Calculate base salary from sessions
					baseSalary = sessionCount * ratePerSession;
				}
			} else if (input.staffType === PayrollStaffType.staff) {
				const user = await db.query.userTable.findFirst({
					where: eq(userTable.id, input.userId),
				});
				if (!user) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User not found",
					});
				}
			}

			// Calculate total
			const totalAmount = baseSalary + input.bonuses - input.deductions;

			const [payroll] = await db
				.insert(staffPayrollTable)
				.values({
					organizationId: ctx.organization.id,
					staffType: input.staffType,
					coachId:
						input.staffType === PayrollStaffType.coach ? input.coachId : null,
					userId:
						input.staffType === PayrollStaffType.staff ? input.userId : null,
					externalName:
						input.staffType === PayrollStaffType.external
							? input.externalName
							: null,
					externalEmail:
						input.staffType === PayrollStaffType.external
							? input.externalEmail
							: null,
					periodStart: input.periodStart,
					periodEnd: input.periodEnd,
					periodType: input.periodType,
					coachPaymentType,
					sessionCount,
					ratePerSession,
					baseSalary,
					bonuses: input.bonuses,
					deductions: input.deductions,
					totalAmount,
					currency: input.currency,
					concept: input.concept,
					notes: input.notes,
					status: PayrollStatus.pending,
					createdBy: ctx.user.id,
				})
				.returning();

			return payroll;
		}),

	// ============================================================================
	// UPDATE
	// ============================================================================

	update: protectedOrgAdminProcedure
		.input(updatePayrollSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.staffPayrollTable.findFirst({
				where: and(
					eq(staffPayrollTable.id, input.id),
					eq(staffPayrollTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payroll not found",
				});
			}

			// Can only update pending payrolls
			if (existing.status !== PayrollStatus.pending) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Can only update pending payrolls",
				});
			}

			// Calculate new values
			const baseSalary = input.baseSalary ?? existing.baseSalary;
			const bonuses = input.bonuses ?? existing.bonuses;
			const deductions = input.deductions ?? existing.deductions;
			const totalAmount = baseSalary + bonuses - deductions;

			const periodStart = input.periodStart ?? existing.periodStart;
			const periodEnd = input.periodEnd ?? existing.periodEnd;

			if (periodEnd <= periodStart) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Period end must be after period start",
				});
			}

			const [updated] = await db
				.update(staffPayrollTable)
				.set({
					periodStart,
					periodEnd,
					periodType: input.periodType ?? existing.periodType,
					baseSalary,
					bonuses,
					deductions,
					totalAmount,
					concept:
						input.concept !== undefined ? input.concept : existing.concept,
					notes: input.notes !== undefined ? input.notes : existing.notes,
				})
				.where(eq(staffPayrollTable.id, input.id))
				.returning();

			return updated;
		}),

	// ============================================================================
	// STATUS TRANSITIONS
	// ============================================================================

	approve: protectedOrgAdminProcedure
		.input(approvePayrollSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.staffPayrollTable.findFirst({
				where: and(
					eq(staffPayrollTable.id, input.id),
					eq(staffPayrollTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payroll not found",
				});
			}

			if (existing.status !== PayrollStatus.pending) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Can only approve pending payrolls",
				});
			}

			const [updated] = await db
				.update(staffPayrollTable)
				.set({
					status: PayrollStatus.approved,
					approvedBy: ctx.user.id,
					approvedAt: new Date(),
				})
				.where(eq(staffPayrollTable.id, input.id))
				.returning();

			return updated;
		}),

	markAsPaid: protectedOrgAdminProcedure
		.input(markPayrollAsPaidSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.staffPayrollTable.findFirst({
				where: and(
					eq(staffPayrollTable.id, input.id),
					eq(staffPayrollTable.organizationId, ctx.organization.id),
				),
				with: {
					coach: {
						with: { user: { columns: { name: true } } },
					},
					user: { columns: { name: true } },
				},
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payroll not found",
				});
			}

			if (existing.status !== PayrollStatus.approved) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Can only mark approved payrolls as paid",
				});
			}

			const paymentDate = input.paymentDate ?? new Date();
			let expenseId: string | null = null;

			// Create expense record if requested
			if (input.createExpense) {
				// Find or create personnel expense category
				let personnelCategory = await db.query.expenseCategoryTable.findFirst({
					where: and(
						eq(expenseCategoryTable.organizationId, ctx.organization.id),
						eq(expenseCategoryTable.type, ExpenseCategoryType.personnel),
					),
				});

				if (!personnelCategory) {
					const [newCategory] = await db
						.insert(expenseCategoryTable)
						.values({
							organizationId: ctx.organization.id,
							name: "Personal",
							description: "Sueldos y pagos al personal",
							type: ExpenseCategoryType.personnel,
						})
						.returning();
					personnelCategory = newCategory;
				}

				// Get recipient name
				let recipientName = existing.externalName ?? "Externo";
				if (existing.staffType === PayrollStaffType.coach && existing.coach) {
					recipientName = existing.coach.user?.name ?? "Coach";
				} else if (
					existing.staffType === PayrollStaffType.staff &&
					existing.user
				) {
					recipientName = existing.user.name ?? "Staff";
				}

				// Create expense
				const description =
					existing.concept ??
					`Pago a ${recipientName} - ${existing.periodStart.toLocaleDateString("es-AR")} al ${existing.periodEnd.toLocaleDateString("es-AR")}`;

				const [expense] = await db
					.insert(expenseTable)
					.values({
						organizationId: ctx.organization.id,
						categoryId: personnelCategory?.id,
						amount: existing.totalAmount,
						currency: existing.currency,
						description,
						expenseDate: paymentDate,
						paymentMethod: input.paymentMethod,
						vendor: recipientName,
						notes: `Liquidación ID: ${existing.id}`,
						recordedBy: ctx.user.id,
					})
					.returning();

				expenseId = expense?.id ?? null;

				// Create cash movement if payment is in cash
				if (expense) {
					await createCashMovementIfCash({
						organizationId: ctx.organization.id,
						paymentMethod: input.paymentMethod,
						amount: existing.totalAmount,
						description: recipientName,
						referenceType: CashMovementReferenceType.expense,
						referenceId: expense.id,
						recordedBy: ctx.user.id,
						type: CashMovementType.expense,
					});
				}
			}

			const [updated] = await db
				.update(staffPayrollTable)
				.set({
					status: PayrollStatus.paid,
					paymentMethod: input.paymentMethod,
					paymentDate,
					expenseId,
					paidBy: ctx.user.id,
				})
				.where(eq(staffPayrollTable.id, input.id))
				.returning();

			return updated;
		}),

	cancel: protectedOrgAdminProcedure
		.input(cancelPayrollSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.staffPayrollTable.findFirst({
				where: and(
					eq(staffPayrollTable.id, input.id),
					eq(staffPayrollTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payroll not found",
				});
			}

			if (existing.status === PayrollStatus.paid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot cancel paid payrolls",
				});
			}

			const [updated] = await db
				.update(staffPayrollTable)
				.set({
					status: PayrollStatus.cancelled,
				})
				.where(eq(staffPayrollTable.id, input.id))
				.returning();

			return updated;
		}),

	// ============================================================================
	// DELETE
	// ============================================================================

	delete: protectedOrgAdminProcedure
		.input(deletePayrollSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.staffPayrollTable.findFirst({
				where: and(
					eq(staffPayrollTable.id, input.id),
					eq(staffPayrollTable.organizationId, ctx.organization.id),
				),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Payroll not found",
				});
			}

			// Can only delete pending or cancelled payrolls
			if (
				existing.status !== PayrollStatus.pending &&
				existing.status !== PayrollStatus.cancelled
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Can only delete pending or cancelled payrolls",
				});
			}

			await db
				.delete(staffPayrollTable)
				.where(eq(staffPayrollTable.id, input.id));

			return { success: true };
		}),

	bulkDelete: protectedOrgAdminProcedure
		.input(bulkDeletePayrollSchema)
		.mutation(async ({ ctx, input }) => {
			// Only delete pending or cancelled
			await db
				.delete(staffPayrollTable)
				.where(
					and(
						eq(staffPayrollTable.organizationId, ctx.organization.id),
						inArray(staffPayrollTable.id, input.ids),
						or(
							eq(staffPayrollTable.status, PayrollStatus.pending),
							eq(staffPayrollTable.status, PayrollStatus.cancelled),
						),
					),
				);

			return { success: true };
		}),

	bulkApprove: protectedOrgAdminProcedure
		.input(bulkApprovePayrollSchema)
		.mutation(async ({ ctx, input }) => {
			await db
				.update(staffPayrollTable)
				.set({
					status: PayrollStatus.approved,
					approvedBy: ctx.user.id,
					approvedAt: new Date(),
				})
				.where(
					and(
						eq(staffPayrollTable.organizationId, ctx.organization.id),
						inArray(staffPayrollTable.id, input.ids),
						eq(staffPayrollTable.status, PayrollStatus.pending),
					),
				);

			return { success: true };
		}),

	// ============================================================================
	// EXPORT & STATS
	// ============================================================================

	exportCsv: protectedOrgAdminProcedure
		.input(exportPayrollSchema)
		.mutation(async ({ ctx, input }) => {
			const payrolls = await db.query.staffPayrollTable.findMany({
				where: and(
					eq(staffPayrollTable.organizationId, ctx.organization.id),
					inArray(staffPayrollTable.id, input.payrollIds),
				),
				with: {
					coach: {
						with: { user: { columns: { name: true, email: true } } },
					},
					user: { columns: { name: true, email: true } },
				},
				orderBy: desc(staffPayrollTable.periodStart),
			});

			// Build CSV
			const headers = [
				"Periodo Inicio",
				"Periodo Fin",
				"Tipo Periodo",
				"Tipo Staff",
				"Nombre",
				"Email",
				"Sueldo Base",
				"Bonos",
				"Deducciones",
				"Total",
				"Moneda",
				"Estado",
				"Concepto",
				"Fecha Pago",
				"Metodo Pago",
			];

			const rows = payrolls.map((p) => {
				let name = p.externalName ?? "";
				let email = p.externalEmail ?? "";
				if (p.staffType === PayrollStaffType.coach && p.coach) {
					name = p.coach.user?.name ?? "";
					email = p.coach.user?.email ?? "";
				} else if (p.staffType === PayrollStaffType.staff && p.user) {
					name = p.user.name ?? "";
					email = p.user.email ?? "";
				}

				return [
					p.periodStart.toISOString().split("T")[0],
					p.periodEnd.toISOString().split("T")[0],
					p.periodType,
					p.staffType,
					name,
					email,
					(p.baseSalary / 100).toFixed(2),
					(p.bonuses / 100).toFixed(2),
					(p.deductions / 100).toFixed(2),
					(p.totalAmount / 100).toFixed(2),
					p.currency,
					p.status,
					p.concept ?? "",
					p.paymentDate?.toISOString().split("T")[0] ?? "",
					p.paymentMethod ?? "",
				];
			});

			const csv = [
				headers.join(","),
				...rows.map((row) =>
					row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
				),
			].join("\n");

			return csv;
		}),

	getSummary: protectedOrgAdminProcedure
		.input(getPayrollSummarySchema)
		.query(async ({ ctx, input }) => {
			const conditions = [
				eq(staffPayrollTable.organizationId, ctx.organization.id),
			];

			if (input.dateRange) {
				conditions.push(
					and(
						gte(staffPayrollTable.periodStart, input.dateRange.from),
						lte(staffPayrollTable.periodEnd, input.dateRange.to),
					)!,
				);
			}

			const whereCondition = and(...conditions);

			// Get counts by status
			const statusCounts = await db
				.select({
					status: staffPayrollTable.status,
					count: count(),
					total: sum(staffPayrollTable.totalAmount),
				})
				.from(staffPayrollTable)
				.where(whereCondition)
				.groupBy(staffPayrollTable.status);

			// Get totals by staff type
			const staffTypeTotals = await db
				.select({
					staffType: staffPayrollTable.staffType,
					count: count(),
					total: sum(staffPayrollTable.totalAmount),
				})
				.from(staffPayrollTable)
				.where(whereCondition)
				.groupBy(staffPayrollTable.staffType);

			const summary = {
				byStatus: statusCounts.reduce(
					(acc, row) => {
						acc[row.status] = {
							count: Number(row.count),
							total: Number(row.total ?? 0),
						};
						return acc;
					},
					{} as Record<string, { count: number; total: number }>,
				),
				byStaffType: staffTypeTotals.reduce(
					(acc, row) => {
						acc[row.staffType] = {
							count: Number(row.count),
							total: Number(row.total ?? 0),
						};
						return acc;
					},
					{} as Record<string, { count: number; total: number }>,
				),
				totals: {
					pending:
						statusCounts.find((s) => s.status === PayrollStatus.pending)
							?.total ?? 0,
					approved:
						statusCounts.find((s) => s.status === PayrollStatus.approved)
							?.total ?? 0,
					paid:
						statusCounts.find((s) => s.status === PayrollStatus.paid)?.total ??
						0,
				},
			};

			return summary;
		}),

	// Get available staff for payroll (coaches and users with roles)
	getAvailableStaff: protectedOrgAdminProcedure.query(async ({ ctx }) => {
		// Get coaches
		const coaches = await db.query.coachTable.findMany({
			where: eq(coachTable.organizationId, ctx.organization.id),
			with: {
				user: { columns: { id: true, name: true, email: true } },
			},
		});

		return {
			coaches: coaches.map((c) => ({
				id: c.id,
				name: c.user?.name ?? "Sin nombre",
				email: c.user?.email ?? "",
				specialty: c.specialty,
			})),
		};
	}),

	// Get coach sessions count for a period (for calculating per_session payroll)
	getCoachSessions: protectedOrgAdminProcedure
		.input(getCoachSessionsSchema)
		.query(async ({ ctx, input }) => {
			// Validate coach exists
			const coach = await db.query.coachTable.findFirst({
				where: and(
					eq(coachTable.id, input.coachId),
					eq(coachTable.organizationId, ctx.organization.id),
				),
				with: {
					user: { columns: { name: true } },
				},
			});

			if (!coach) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach not found",
				});
			}

			// Count completed sessions in the period
			const completedSessions = await db
				.select({ count: count() })
				.from(trainingSessionCoachTable)
				.innerJoin(
					trainingSessionTable,
					eq(trainingSessionCoachTable.sessionId, trainingSessionTable.id),
				)
				.where(
					and(
						eq(trainingSessionCoachTable.coachId, input.coachId),
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						gte(trainingSessionTable.startTime, input.periodStart),
						lte(trainingSessionTable.startTime, input.periodEnd),
						eq(trainingSessionTable.status, TrainingSessionStatus.completed),
					),
				);

			// Count all sessions (including pending/scheduled)
			const allSessions = await db
				.select({ count: count() })
				.from(trainingSessionCoachTable)
				.innerJoin(
					trainingSessionTable,
					eq(trainingSessionCoachTable.sessionId, trainingSessionTable.id),
				)
				.where(
					and(
						eq(trainingSessionCoachTable.coachId, input.coachId),
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						gte(trainingSessionTable.startTime, input.periodStart),
						lte(trainingSessionTable.startTime, input.periodEnd),
					),
				);

			return {
				coachId: input.coachId,
				coachName: coach.user?.name ?? "Sin nombre",
				periodStart: input.periodStart,
				periodEnd: input.periodEnd,
				completedSessions: completedSessions[0]?.count ?? 0,
				totalSessions: allSessions[0]?.count ?? 0,
			};
		}),
});
