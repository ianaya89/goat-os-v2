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
import { appConfig } from "@/config/app.config";
import { db } from "@/lib/db";
import { MemberRole, TrainingSessionStatus } from "@/lib/db/schema/enums";
import {
	accountTable,
	athleteEvaluationTable,
	athleteGroupMemberTable,
	athleteGroupTable,
	attendanceTable,
	coachTable,
	memberTable,
	trainingSessionAthleteTable,
	trainingSessionCoachTable,
	trainingSessionTable,
	userTable,
} from "@/lib/db/schema/tables";
import { sendCoachWelcomeEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { generateTemporaryPassword, getBaseUrl } from "@/lib/utils";
import {
	bulkDeleteCoachesSchema,
	bulkUpdateCoachesStatusSchema,
	createCoachSchema,
	deleteCoachSchema,
	exportCoachesSchema,
	listCoachesSchema,
	updateCoachSchema,
} from "@/schemas/organization-coach-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationCoachRouter = createTRPCRouter({
	list: protectedOrganizationProcedure
		.input(listCoachesSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [eq(coachTable.organizationId, ctx.organization.id)];

			// Search query handled separately since we need to join with user table
			if (input.query) {
				conditions.push(ilike(coachTable.specialty, `%${input.query}%`));
			}

			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(inArray(coachTable.status, input.filters.status));
			}

			if (input.filters?.createdAt && input.filters.createdAt.length > 0) {
				const dateConditions = input.filters.createdAt
					.map((range) => {
						const now = new Date();
						switch (range) {
							case "today": {
								const todayStart = new Date(
									now.getFullYear(),
									now.getMonth(),
									now.getDate(),
								);
								const todayEnd = new Date(
									now.getFullYear(),
									now.getMonth(),
									now.getDate() + 1,
								);
								return and(
									gte(coachTable.createdAt, todayStart),
									lte(coachTable.createdAt, todayEnd),
								);
							}
							case "this-week": {
								const weekStart = new Date(
									now.getFullYear(),
									now.getMonth(),
									now.getDate() - now.getDay(),
								);
								return gte(coachTable.createdAt, weekStart);
							}
							case "this-month": {
								const monthStart = new Date(
									now.getFullYear(),
									now.getMonth(),
									1,
								);
								return gte(coachTable.createdAt, monthStart);
							}
							case "older": {
								const monthAgo = new Date(
									now.getFullYear(),
									now.getMonth() - 1,
									now.getDate(),
								);
								return lte(coachTable.createdAt, monthAgo);
							}
							default:
								return null;
						}
					})
					.filter((v): v is NonNullable<typeof v> => v !== null);
				if (dateConditions.length > 0) {
					conditions.push(or(...dateConditions)!);
				}
			}

			const whereCondition = and(...conditions);

			// Build sort order
			const sortDirection = input.sortOrder === "desc" ? desc : asc;
			let orderByColumn: SQL;
			switch (input.sortBy) {
				case "specialty":
					orderByColumn = sortDirection(coachTable.specialty);
					break;
				case "status":
					orderByColumn = sortDirection(coachTable.status);
					break;
				default:
					orderByColumn = sortDirection(coachTable.createdAt);
					break;
			}

			// Run coaches and count queries in parallel
			const [coaches, countResult] = await Promise.all([
				db.query.coachTable.findMany({
					where: whereCondition,
					limit: input.limit,
					offset: input.offset,
					orderBy: orderByColumn,
					with: {
						user: {
							columns: {
								id: true,
								name: true,
								email: true,
								image: true,
								imageKey: true,
							},
						},
					},
				}),
				db.select({ count: count() }).from(coachTable).where(whereCondition),
			]);

			return { coaches, total: countResult[0]?.count ?? 0 };
		}),

	get: protectedOrganizationProcedure
		.input(deleteCoachSchema)
		.query(async ({ ctx, input }) => {
			const coach = await db.query.coachTable.findFirst({
				where: and(
					eq(coachTable.id, input.id),
					eq(coachTable.organizationId, ctx.organization.id),
				),
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
				},
			});

			if (!coach) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach not found",
				});
			}

			return coach;
		}),

	getProfile: protectedOrganizationProcedure
		.input(deleteCoachSchema)
		.query(async ({ ctx, input }) => {
			// Get coach with user details
			const coach = await db.query.coachTable.findFirst({
				where: and(
					eq(coachTable.id, input.id),
					eq(coachTable.organizationId, ctx.organization.id),
				),
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							email: true,
							image: true,
							imageKey: true,
						},
					},
				},
			});

			if (!coach) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach not found",
				});
			}

			// Run independent queries in parallel for better performance
			const [coachSessions, evaluations] = await Promise.all([
				// Get sessions assigned to this coach
				db.query.trainingSessionCoachTable.findMany({
					where: eq(trainingSessionCoachTable.coachId, coach.id),
					with: {
						session: {
							with: {
								location: { columns: { id: true, name: true } },
								athleteGroup: { columns: { id: true, name: true } },
								athletes: {
									with: {
										athlete: {
											columns: {
												id: true,
												sport: true,
												birthDate: true,
												level: true,
												phone: true,
											},
											with: {
												user: {
													columns: {
														id: true,
														name: true,
														email: true,
														image: true,
													},
												},
											},
										},
									},
								},
								coaches: {
									with: {
										coach: {
											with: {
												user: {
													columns: { id: true, name: true, image: true },
												},
											},
										},
									},
								},
								attendances: {
									with: {
										athlete: {
											with: {
												user: {
													columns: { id: true, name: true, image: true },
												},
											},
										},
									},
								},
							},
						},
					},
				}),
				// Get evaluations made by this coach
				db.query.athleteEvaluationTable.findMany({
					where: eq(athleteEvaluationTable.evaluatedBy, coach.userId ?? ""),
					orderBy: desc(athleteEvaluationTable.createdAt),
					limit: 50,
					with: {
						athlete: {
							with: {
								user: { columns: { id: true, name: true, image: true } },
							},
						},
						session: {
							columns: { id: true, title: true, startTime: true },
						},
					},
				}),
			]);

			const sessions = coachSessions
				.map((cs) => ({
					...cs.session,
					isPrimary: cs.isPrimary,
				}))
				.filter((s) => !s.isRecurring)
				.sort(
					(a, b) =>
						new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
				);

			// Get unique athletes from all sessions
			const athleteMap = new Map<
				string,
				{
					id: string;
					name: string;
					image: string | null;
					email: string | null;
					phone: string | null;
					birthDate: Date | null;
					level: string | null;
					sport: string | null;
					sessionCount: number;
				}
			>();

			for (const session of sessions) {
				// From direct assignments
				for (const sa of session.athletes) {
					const athlete = sa.athlete;
					const existing = athleteMap.get(athlete.id);
					if (existing) {
						existing.sessionCount++;
					} else {
						athleteMap.set(athlete.id, {
							id: athlete.id,
							name: athlete.user?.name ?? "Unknown",
							image: athlete.user?.image ?? null,
							email: athlete.user?.email ?? null,
							phone: athlete.phone ?? null,
							birthDate: athlete.birthDate ?? null,
							level: athlete.level ?? null,
							sport: athlete.sport ?? null,
							sessionCount: 1,
						});
					}
				}
			}

			// Also get athletes from groups that coach has trained
			const groupIds = [
				...new Set(
					sessions
						.filter((s) => s.athleteGroupId)
						.map((s) => s.athleteGroupId!),
				),
			];

			if (groupIds.length > 0) {
				const groupMembers = await db.query.athleteGroupMemberTable.findMany({
					where: inArray(athleteGroupMemberTable.groupId, groupIds),
					with: {
						athlete: {
							columns: {
								id: true,
								sport: true,
								birthDate: true,
								level: true,
								phone: true,
							},
							with: {
								user: {
									columns: { id: true, name: true, email: true, image: true },
								},
							},
						},
					},
				});

				for (const gm of groupMembers) {
					const athlete = gm.athlete;
					if (!athleteMap.has(athlete.id)) {
						athleteMap.set(athlete.id, {
							id: athlete.id,
							name: athlete.user?.name ?? "Unknown",
							image: athlete.user?.image ?? null,
							email: athlete.user?.email ?? null,
							phone: athlete.phone ?? null,
							birthDate: athlete.birthDate ?? null,
							level: athlete.level ?? null,
							sport: athlete.sport ?? null,
							sessionCount: 0,
						});
					}
				}
			}

			const athletes = Array.from(athleteMap.values()).sort(
				(a, b) => b.sessionCount - a.sessionCount,
			);

			// Calculate stats
			const now = new Date();
			const totalSessions = sessions.length;
			const completedSessions = sessions.filter(
				(s) => s.status === TrainingSessionStatus.completed,
			).length;
			const upcomingSessions = sessions.filter(
				(s) =>
					new Date(s.startTime) > now &&
					s.status !== TrainingSessionStatus.cancelled,
			).length;
			const primarySessions = sessions.filter((s) => s.isPrimary).length;

			// Average ratings given
			const ratingsGiven = evaluations.filter(
				(e) => e.performanceRating !== null,
			);
			const avgRating =
				ratingsGiven.length > 0
					? ratingsGiven.reduce(
							(sum, e) => sum + (e.performanceRating ?? 0),
							0,
						) / ratingsGiven.length
					: 0;

			// Aggregate attendance data from sessions
			const allAttendance = sessions.flatMap((s) => s.attendances ?? []);
			const attendanceStats = {
				total: allAttendance.length,
				present: allAttendance.filter((a) => a.status === "present").length,
				absent: allAttendance.filter((a) => a.status === "absent").length,
				late: allAttendance.filter((a) => a.status === "late").length,
				excused: allAttendance.filter((a) => a.status === "excused").length,
			};

			const stats = {
				totalSessions,
				completedSessions,
				upcomingSessions,
				primarySessions,
				totalAthletes: athletes.length,
				evaluationsGiven: evaluations.length,
				avgRatingGiven: Math.round(avgRating * 10) / 10,
				attendance: attendanceStats,
			};

			return {
				coach,
				sessions,
				athletes,
				evaluations,
				stats,
			};
		}),

	create: protectedOrganizationProcedure
		.input(createCoachSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user with this email already exists
			const existingUser = await db.query.userTable.findFirst({
				where: eq(userTable.email, input.email.toLowerCase()),
			});

			let userId: string;
			let temporaryPassword: string | null = null;

			if (existingUser) {
				// User exists - check if already a coach in this organization
				const existingCoach = await db.query.coachTable.findFirst({
					where: and(
						eq(coachTable.organizationId, ctx.organization.id),
						eq(coachTable.userId, existingUser.id),
					),
				});

				if (existingCoach) {
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"A coach with this email already exists in this organization",
					});
				}

				userId = existingUser.id;

				// Check if user is already a member of the organization
				const existingMember = await db.query.memberTable.findFirst({
					where: and(
						eq(memberTable.organizationId, ctx.organization.id),
						eq(memberTable.userId, existingUser.id),
					),
				});

				if (!existingMember) {
					// Add user as member of the organization with coach role
					await db.insert(memberTable).values({
						organizationId: ctx.organization.id,
						userId: existingUser.id,
						role: MemberRole.staff,
					});
				} else if (existingMember.role === MemberRole.member) {
					// Update existing member role to coach
					await db
						.update(memberTable)
						.set({ role: MemberRole.staff })
						.where(eq(memberTable.id, existingMember.id));
				}
			} else {
				// Create new user with temporary password
				temporaryPassword = generateTemporaryPassword();
				const { hashPassword } = await import("better-auth/crypto");
				const hashedPassword = await hashPassword(temporaryPassword);

				// Create user
				const [newUser] = await db
					.insert(userTable)
					.values({
						name: input.name,
						email: input.email.toLowerCase(),
						emailVerified: false,
					})
					.returning();

				if (!newUser) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create user",
					});
				}

				userId = newUser.id;

				// Create account with password (Better Auth pattern)
				await db.insert(accountTable).values({
					userId: newUser.id,
					accountId: newUser.id,
					providerId: "credential",
					password: hashedPassword,
				});

				// Add user as member of the organization with coach role
				await db.insert(memberTable).values({
					organizationId: ctx.organization.id,
					userId: newUser.id,
					role: MemberRole.staff,
				});

				logger.info(
					{
						userId: newUser.id,
						email: input.email,
						organizationId: ctx.organization.id,
					},
					"Created new user for coach",
				);

				// Send welcome email to the new coach
				const baseUrl = getBaseUrl();
				try {
					await sendCoachWelcomeEmail({
						recipient: input.email.toLowerCase(),
						appName: appConfig.appName,
						coachName: input.name,
						organizationName: ctx.organization.name,
						loginUrl: `${baseUrl}/auth/sign-in`,
						forgotPasswordUrl: `${baseUrl}/auth/forgot-password`,
					});
					logger.info(
						{ email: input.email, organizationId: ctx.organization.id },
						"Sent welcome email to coach",
					);
				} catch (emailError) {
					// Log the error but don't fail the operation
					logger.error(
						{ error: emailError, email: input.email },
						"Failed to send welcome email to coach",
					);
				}
			}

			// Create the coach record
			const [coach] = await db
				.insert(coachTable)
				.values({
					organizationId: ctx.organization.id,
					userId,
					phone: input.phone,
					birthDate: input.birthDate,
					sport: input.sport,
					specialty: input.specialty,
					bio: input.bio,
					status: input.status,
				})
				.returning();

			return {
				coach,
				temporaryPassword,
				isNewUser: !existingUser,
			};
		}),

	update: protectedOrganizationProcedure
		.input(updateCoachSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updatedCoach] = await db
				.update(coachTable)
				.set(data)
				.where(
					and(
						eq(coachTable.id, id),
						eq(coachTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updatedCoach) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach not found",
				});
			}

			return updatedCoach;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteCoachSchema)
		.mutation(async ({ ctx, input }) => {
			const [deletedCoach] = await db
				.delete(coachTable)
				.where(
					and(
						eq(coachTable.id, input.id),
						eq(coachTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!deletedCoach) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Coach not found",
				});
			}

			// Note: This does NOT delete the user or their membership
			// The user remains in the organization as a member
			// Only the coach record is deleted

			return { success: true };
		}),

	bulkDelete: protectedOrganizationProcedure
		.input(bulkDeleteCoachesSchema)
		.mutation(async ({ ctx, input }) => {
			const deleted = await db
				.delete(coachTable)
				.where(
					and(
						inArray(coachTable.id, input.ids),
						eq(coachTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: coachTable.id });

			return { success: true, count: deleted.length };
		}),

	bulkUpdateStatus: protectedOrganizationProcedure
		.input(bulkUpdateCoachesStatusSchema)
		.mutation(async ({ ctx, input }) => {
			const updated = await db
				.update(coachTable)
				.set({ status: input.status })
				.where(
					and(
						inArray(coachTable.id, input.ids),
						eq(coachTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: coachTable.id });

			return { success: true, count: updated.length };
		}),

	exportSelectedToCsv: protectedOrganizationProcedure
		.input(exportCoachesSchema)
		.mutation(async ({ ctx, input }) => {
			const coaches = await db.query.coachTable.findMany({
				where: and(
					inArray(coachTable.id, input.coachIds),
					eq(coachTable.organizationId, ctx.organization.id),
				),
				with: {
					user: {
						columns: {
							name: true,
							email: true,
						},
					},
				},
			});

			const exportData = coaches.map((coach) => ({
				id: coach.id,
				name: coach.user?.name ?? "",
				email: coach.user?.email ?? "",
				specialty: coach.specialty,
				bio: coach.bio,
				status: coach.status,
				createdAt: coach.createdAt,
				updatedAt: coach.updatedAt,
			}));

			const Papa = await import("papaparse");
			const csv = Papa.unparse(exportData);
			return csv;
		}),

	exportSelectedToExcel: protectedOrganizationProcedure
		.input(exportCoachesSchema)
		.mutation(async ({ ctx, input }) => {
			const coaches = await db.query.coachTable.findMany({
				where: and(
					inArray(coachTable.id, input.coachIds),
					eq(coachTable.organizationId, ctx.organization.id),
				),
				with: {
					user: {
						columns: {
							name: true,
							email: true,
						},
					},
				},
			});

			const ExcelJS = await import("exceljs");
			const workbook = new ExcelJS.Workbook();
			const worksheet = workbook.addWorksheet("Coaches");

			if (coaches.length > 0) {
				const columns = [
					{ header: "ID", key: "id", width: 40 },
					{ header: "Name", key: "name", width: 25 },
					{ header: "Email", key: "email", width: 30 },
					{ header: "Specialty", key: "specialty", width: 30 },
					{ header: "Bio", key: "bio", width: 50 },
					{ header: "Status", key: "status", width: 15 },
					{ header: "Created At", key: "createdAt", width: 25 },
					{ header: "Updated At", key: "updatedAt", width: 25 },
				];
				worksheet.columns = columns;

				for (const coach of coaches) {
					worksheet.addRow({
						id: coach.id,
						name: coach.user?.name ?? "",
						email: coach.user?.email ?? "",
						specialty: coach.specialty,
						bio: coach.bio,
						status: coach.status,
						createdAt: coach.createdAt,
						updatedAt: coach.updatedAt,
					});
				}
			}

			const buffer = await workbook.xlsx.writeBuffer();
			const base64 = Buffer.from(buffer).toString("base64");
			return base64;
		}),
});
