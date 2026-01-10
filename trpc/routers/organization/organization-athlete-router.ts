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
import { nanoid } from "nanoid";
import { appConfig } from "@/config/app.config";
import { db } from "@/lib/db";
import {
	accountTable,
	athleteCareerHistoryTable,
	athleteEvaluationTable,
	athleteFitnessTestTable,
	athleteGroupMemberTable,
	athletePhysicalMetricsTable,
	athleteTable,
	athleteWellnessSurveyTable,
	attendanceTable,
	memberTable,
	trainingSessionAthleteTable,
	trainingSessionTable,
	userTable,
} from "@/lib/db/schema/tables";
import { AttendanceStatus, MemberRole } from "@/lib/db/schema/enums";
import { sendAthleteWelcomeEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { getBaseUrl } from "@/lib/utils";
import {
	bulkDeleteAthletesSchema,
	bulkUpdateAthletesStatusSchema,
	createAthleteSchema,
	createCareerHistorySchema,
	createFitnessTestSchema,
	createPhysicalMetricsSchema,
	deleteAthleteSchema,
	deleteCareerHistorySchema,
	deleteFitnessTestSchema,
	exportAthletesSchema,
	listAthletesSchema,
	listCareerHistorySchema,
	listFitnessTestsSchema,
	listPhysicalMetricsSchema,
	updateAthleteSchema,
	updateCareerHistorySchema,
} from "@/schemas/organization-athlete-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

// Generate a temporary password
function generateTemporaryPassword(): string {
	return `Temp${nanoid(12)}!`;
}

export const organizationAthleteRouter = createTRPCRouter({
	list: protectedOrganizationProcedure
		.input(listAthletesSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [eq(athleteTable.organizationId, ctx.organization.id)];

			// Search query handled separately since we need to join with user table
			if (input.query) {
				conditions.push(ilike(athleteTable.sport, `%${input.query}%`));
			}

			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(inArray(athleteTable.status, input.filters.status));
			}

			if (input.filters?.level && input.filters.level.length > 0) {
				conditions.push(inArray(athleteTable.level, input.filters.level));
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
									gte(athleteTable.createdAt, todayStart),
									lte(athleteTable.createdAt, todayEnd),
								);
							}
							case "this-week": {
								const weekStart = new Date(
									now.getFullYear(),
									now.getMonth(),
									now.getDate() - now.getDay(),
								);
								return gte(athleteTable.createdAt, weekStart);
							}
							case "this-month": {
								const monthStart = new Date(
									now.getFullYear(),
									now.getMonth(),
									1,
								);
								return gte(athleteTable.createdAt, monthStart);
							}
							case "older": {
								const monthAgo = new Date(
									now.getFullYear(),
									now.getMonth() - 1,
									now.getDate(),
								);
								return lte(athleteTable.createdAt, monthAgo);
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
				case "sport":
					orderByColumn = sortDirection(athleteTable.sport);
					break;
				case "level":
					orderByColumn = sortDirection(athleteTable.level);
					break;
				case "status":
					orderByColumn = sortDirection(athleteTable.status);
					break;
				case "birthDate":
					orderByColumn = sortDirection(athleteTable.birthDate);
					break;
				default:
					orderByColumn = sortDirection(athleteTable.createdAt);
					break;
			}

			// Run athletes and count queries in parallel
			const [athletes, countResult] = await Promise.all([
				db.query.athleteTable.findMany({
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
							},
						},
					},
				}),
				db.select({ count: count() }).from(athleteTable).where(whereCondition),
			]);

			return { athletes, total: countResult[0]?.count ?? 0 };
		}),

	get: protectedOrganizationProcedure
		.input(deleteAthleteSchema)
		.query(async ({ ctx, input }) => {
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.id, input.id),
					eq(athleteTable.organizationId, ctx.organization.id),
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

			if (!athlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete not found",
				});
			}

			return athlete;
		}),

	// Get full athlete profile with sessions, evaluations, attendance, etc.
	getProfile: protectedOrganizationProcedure
		.input(deleteAthleteSchema)
		.query(async ({ ctx, input }) => {
			// Get basic athlete info with user data
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.id, input.id),
					eq(athleteTable.organizationId, ctx.organization.id),
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

			if (!athlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete not found",
				});
			}

			// Get athlete groups
			const groupMemberships = await db.query.athleteGroupMemberTable.findMany({
				where: eq(athleteGroupMemberTable.athleteId, athlete.id),
				with: {
					group: {
						columns: { id: true, name: true },
					},
				},
			});

			// Get direct session assignments
			const directSessions =
				await db.query.trainingSessionAthleteTable.findMany({
					where: eq(trainingSessionAthleteTable.athleteId, athlete.id),
					columns: { sessionId: true },
				});
			const directSessionIds = directSessions.map((s) => s.sessionId);

			// Get sessions from groups
			const groupIds = groupMemberships.map((gm) => gm.groupId);
			let groupSessionIds: string[] = [];
			if (groupIds.length > 0) {
				const groupSessions = await db.query.trainingSessionTable.findMany({
					where: and(
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						inArray(trainingSessionTable.athleteGroupId, groupIds),
						eq(trainingSessionTable.isRecurring, false),
					),
					columns: { id: true },
				});
				groupSessionIds = groupSessions.map((s) => s.id);
			}

			const allSessionIds = [
				...new Set([...directSessionIds, ...groupSessionIds]),
			];

			// Get all sessions with details
			let sessions: Array<{
				id: string;
				title: string;
				startTime: Date;
				endTime: Date;
				status: string;
				location: { id: string; name: string } | null;
				athleteGroup: { id: string; name: string } | null;
				coaches: Array<{
					isPrimary: boolean;
					coach: {
						id: string;
						user: { id: string; name: string; image: string | null } | null;
					};
				}>;
			}> = [];

			if (allSessionIds.length > 0) {
				sessions = await db.query.trainingSessionTable.findMany({
					where: and(
						eq(trainingSessionTable.organizationId, ctx.organization.id),
						inArray(trainingSessionTable.id, allSessionIds),
					),
					orderBy: desc(trainingSessionTable.startTime),
					with: {
						location: { columns: { id: true, name: true } },
						athleteGroup: { columns: { id: true, name: true } },
						coaches: {
							with: {
								coach: {
									with: {
										user: { columns: { id: true, name: true, image: true } },
									},
								},
							},
						},
					},
				});
			}

			// Get all attendance records for this athlete
			const attendanceRecords = await db.query.attendanceTable.findMany({
				where: eq(attendanceTable.athleteId, athlete.id),
				orderBy: desc(attendanceTable.createdAt),
				with: {
					session: {
						columns: { id: true, title: true, startTime: true },
					},
				},
			});

			// Get all evaluations for this athlete
			const evaluations = await db.query.athleteEvaluationTable.findMany({
				where: eq(athleteEvaluationTable.athleteId, athlete.id),
				orderBy: desc(athleteEvaluationTable.createdAt),
				with: {
					session: {
						columns: { id: true, title: true, startTime: true },
					},
					evaluatedByUser: {
						columns: { id: true, name: true, image: true },
					},
				},
			});

			// Calculate stats
			const totalSessions = sessions.length;
			const completedSessions = sessions.filter(
				(s) => s.status === "completed",
			).length;
			const upcomingSessions = sessions.filter(
				(s) =>
					new Date(s.startTime) > new Date() &&
					s.status !== "cancelled" &&
					s.status !== "completed",
			).length;

			const presentCount = attendanceRecords.filter(
				(a) => a.status === AttendanceStatus.present,
			).length;
			const lateCount = attendanceRecords.filter(
				(a) => a.status === AttendanceStatus.late,
			).length;
			const absentCount = attendanceRecords.filter(
				(a) => a.status === AttendanceStatus.absent,
			).length;
			const excusedCount = attendanceRecords.filter(
				(a) => a.status === AttendanceStatus.excused,
			).length;

			const attendanceRate =
				attendanceRecords.length > 0
					? ((presentCount + lateCount) / attendanceRecords.length) * 100
					: 0;

			// Calculate average ratings
			let avgPerformance = 0;
			let avgAttitude = 0;
			let avgPhysicalFitness = 0;
			let ratingCount = 0;

			for (const evaluation of evaluations) {
				if (evaluation.performanceRating) {
					avgPerformance += evaluation.performanceRating;
					ratingCount++;
				}
				if (evaluation.attitudeRating) {
					avgAttitude += evaluation.attitudeRating;
				}
				if (evaluation.physicalFitnessRating) {
					avgPhysicalFitness += evaluation.physicalFitnessRating;
				}
			}

			if (ratingCount > 0) {
				avgPerformance /= ratingCount;
				avgAttitude /= ratingCount;
				avgPhysicalFitness /= ratingCount;
			}

			// Get physical metrics (last 10)
			const physicalMetrics =
				await db.query.athletePhysicalMetricsTable.findMany({
					where: eq(athletePhysicalMetricsTable.athleteId, athlete.id),
					orderBy: desc(athletePhysicalMetricsTable.measuredAt),
					limit: 10,
					with: {
						recordedByUser: {
							columns: { id: true, name: true },
						},
					},
				});

			// Get fitness tests (last 20)
			const fitnessTests = await db.query.athleteFitnessTestTable.findMany({
				where: eq(athleteFitnessTestTable.athleteId, athlete.id),
				orderBy: desc(athleteFitnessTestTable.testDate),
				limit: 20,
				with: {
					evaluatedByUser: {
						columns: { id: true, name: true },
					},
				},
			});

			// Get career history
			const careerHistory = await db.query.athleteCareerHistoryTable.findMany({
				where: eq(athleteCareerHistoryTable.athleteId, athlete.id),
				orderBy: desc(athleteCareerHistoryTable.startDate),
			});

			// Get wellness surveys (last 30)
			const wellnessSurveys =
				await db.query.athleteWellnessSurveyTable.findMany({
					where: eq(athleteWellnessSurveyTable.athleteId, athlete.id),
					orderBy: desc(athleteWellnessSurveyTable.surveyDate),
					limit: 30,
				});

			return {
				athlete,
				groups: groupMemberships.map((gm) => gm.group),
				sessions,
				attendanceRecords,
				evaluations,
				physicalMetrics,
				fitnessTests,
				careerHistory,
				wellnessSurveys,
				stats: {
					totalSessions,
					completedSessions,
					upcomingSessions,
					attendance: {
						present: presentCount,
						late: lateCount,
						absent: absentCount,
						excused: excusedCount,
						rate: Math.round(attendanceRate),
					},
					ratings: {
						performance: Math.round(avgPerformance * 10) / 10,
						attitude: Math.round(avgAttitude * 10) / 10,
						physicalFitness: Math.round(avgPhysicalFitness * 10) / 10,
						count: ratingCount,
					},
				},
			};
		}),

	create: protectedOrganizationProcedure
		.input(createAthleteSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user with this email already exists
			const existingUser = await db.query.userTable.findFirst({
				where: eq(userTable.email, input.email.toLowerCase()),
			});

			let userId: string;
			let temporaryPassword: string | null = null;

			if (existingUser) {
				// User exists - check if already an athlete in this organization
				const existingAthlete = await db.query.athleteTable.findFirst({
					where: and(
						eq(athleteTable.organizationId, ctx.organization.id),
						eq(athleteTable.userId, existingUser.id),
					),
				});

				if (existingAthlete) {
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"An athlete with this email already exists in this organization",
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
					// Add user as member of the organization with athlete role
					await db.insert(memberTable).values({
						organizationId: ctx.organization.id,
						userId: existingUser.id,
						role: MemberRole.athlete,
					});
				} else if (existingMember.role === MemberRole.member) {
					// Update existing member role to athlete
					await db
						.update(memberTable)
						.set({ role: MemberRole.athlete })
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

				// Add user as member of the organization with athlete role
				await db.insert(memberTable).values({
					organizationId: ctx.organization.id,
					userId: newUser.id,
					role: MemberRole.athlete,
				});

				logger.info(
					{
						userId: newUser.id,
						email: input.email,
						organizationId: ctx.organization.id,
					},
					"Created new user for athlete",
				);

				// Send welcome email to the new athlete
				const baseUrl = getBaseUrl();
				try {
					await sendAthleteWelcomeEmail({
						recipient: input.email.toLowerCase(),
						appName: appConfig.appName,
						athleteName: input.name,
						organizationName: ctx.organization.name,
						loginUrl: `${baseUrl}/auth/sign-in`,
						forgotPasswordUrl: `${baseUrl}/auth/forgot-password`,
					});
					logger.info(
						{ email: input.email, organizationId: ctx.organization.id },
						"Sent welcome email to athlete",
					);
				} catch (emailError) {
					// Log the error but don't fail the operation
					logger.error(
						{ error: emailError, email: input.email },
						"Failed to send welcome email to athlete",
					);
				}
			}

			// Create the athlete record
			const [athlete] = await db
				.insert(athleteTable)
				.values({
					organizationId: ctx.organization.id,
					userId,
					sport: input.sport,
					birthDate: input.birthDate,
					level: input.level,
					status: input.status,
					// Physical attributes
					height: input.height,
					weight: input.weight,
					dominantFoot: input.dominantFoot,
					dominantHand: input.dominantHand,
					// Profile information
					nationality: input.nationality,
					position: input.position,
					secondaryPosition: input.secondaryPosition,
					jerseyNumber: input.jerseyNumber,
					profilePhotoUrl: input.profilePhotoUrl,
					bio: input.bio,
					yearsOfExperience: input.yearsOfExperience,
				})
				.returning();

			return {
				athlete,
				temporaryPassword,
				isNewUser: !existingUser,
			};
		}),

	update: protectedOrganizationProcedure
		.input(updateAthleteSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			const [updatedAthlete] = await db
				.update(athleteTable)
				.set(data)
				.where(
					and(
						eq(athleteTable.id, id),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!updatedAthlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete not found",
				});
			}

			return updatedAthlete;
		}),

	delete: protectedOrganizationProcedure
		.input(deleteAthleteSchema)
		.mutation(async ({ ctx, input }) => {
			const [deletedAthlete] = await db
				.delete(athleteTable)
				.where(
					and(
						eq(athleteTable.id, input.id),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

			if (!deletedAthlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete not found",
				});
			}

			// Note: This does NOT delete the user or their membership
			// The user remains in the organization as a member
			// Only the athlete record is deleted

			return { success: true };
		}),

	bulkDelete: protectedOrganizationProcedure
		.input(bulkDeleteAthletesSchema)
		.mutation(async ({ ctx, input }) => {
			const deleted = await db
				.delete(athleteTable)
				.where(
					and(
						inArray(athleteTable.id, input.ids),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: athleteTable.id });

			return { success: true, count: deleted.length };
		}),

	bulkUpdateStatus: protectedOrganizationProcedure
		.input(bulkUpdateAthletesStatusSchema)
		.mutation(async ({ ctx, input }) => {
			const updated = await db
				.update(athleteTable)
				.set({ status: input.status })
				.where(
					and(
						inArray(athleteTable.id, input.ids),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
				)
				.returning({ id: athleteTable.id });

			return { success: true, count: updated.length };
		}),

	exportSelectedToCsv: protectedOrganizationProcedure
		.input(exportAthletesSchema)
		.mutation(async ({ ctx, input }) => {
			const athletes = await db.query.athleteTable.findMany({
				where: and(
					inArray(athleteTable.id, input.athleteIds),
					eq(athleteTable.organizationId, ctx.organization.id),
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

			const exportData = athletes.map((athlete) => ({
				id: athlete.id,
				name: athlete.user?.name ?? "",
				email: athlete.user?.email ?? "",
				sport: athlete.sport,
				birthDate: athlete.birthDate,
				level: athlete.level,
				status: athlete.status,
				createdAt: athlete.createdAt,
				updatedAt: athlete.updatedAt,
			}));

			const Papa = await import("papaparse");
			const csv = Papa.unparse(exportData);
			return csv;
		}),

	exportSelectedToExcel: protectedOrganizationProcedure
		.input(exportAthletesSchema)
		.mutation(async ({ ctx, input }) => {
			const athletes = await db.query.athleteTable.findMany({
				where: and(
					inArray(athleteTable.id, input.athleteIds),
					eq(athleteTable.organizationId, ctx.organization.id),
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
			const worksheet = workbook.addWorksheet("Athletes");

			if (athletes.length > 0) {
				const columns = [
					{ header: "ID", key: "id", width: 40 },
					{ header: "Name", key: "name", width: 25 },
					{ header: "Email", key: "email", width: 30 },
					{ header: "Sport", key: "sport", width: 20 },
					{ header: "Birth Date", key: "birthDate", width: 15 },
					{ header: "Level", key: "level", width: 15 },
					{ header: "Status", key: "status", width: 15 },
					{ header: "Created At", key: "createdAt", width: 25 },
					{ header: "Updated At", key: "updatedAt", width: 25 },
				];
				worksheet.columns = columns;

				for (const athlete of athletes) {
					worksheet.addRow({
						id: athlete.id,
						name: athlete.user?.name ?? "",
						email: athlete.user?.email ?? "",
						sport: athlete.sport,
						birthDate: athlete.birthDate,
						level: athlete.level,
						status: athlete.status,
						createdAt: athlete.createdAt,
						updatedAt: athlete.updatedAt,
					});
				}
			}

			const buffer = await workbook.xlsx.writeBuffer();
			const base64 = Buffer.from(buffer).toString("base64");
			return base64;
		}),

	// ============================================================================
	// PHYSICAL METRICS PROCEDURES
	// ============================================================================

	createPhysicalMetrics: protectedOrganizationProcedure
		.input(createPhysicalMetricsSchema)
		.mutation(async ({ ctx, input }) => {
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

			const [metrics] = await db
				.insert(athletePhysicalMetricsTable)
				.values({
					athleteId: input.athleteId,
					measuredAt: input.measuredAt ?? new Date(),
					height: input.height,
					weight: input.weight,
					bodyFatPercentage: input.bodyFatPercentage,
					muscleMass: input.muscleMass,
					wingspan: input.wingspan,
					standingReach: input.standingReach,
					notes: input.notes,
					recordedBy: ctx.user.id,
				})
				.returning();

			return metrics;
		}),

	listPhysicalMetrics: protectedOrganizationProcedure
		.input(listPhysicalMetricsSchema)
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

			const [metrics, countResult] = await Promise.all([
				db.query.athletePhysicalMetricsTable.findMany({
					where: eq(athletePhysicalMetricsTable.athleteId, input.athleteId),
					orderBy: desc(athletePhysicalMetricsTable.measuredAt),
					limit: input.limit,
					offset: input.offset,
					with: {
						recordedByUser: {
							columns: { id: true, name: true },
						},
					},
				}),
				db
					.select({ count: count() })
					.from(athletePhysicalMetricsTable)
					.where(eq(athletePhysicalMetricsTable.athleteId, input.athleteId)),
			]);

			return {
				metrics,
				total: countResult[0]?.count ?? 0,
			};
		}),

	// ============================================================================
	// FITNESS TEST PROCEDURES
	// ============================================================================

	createFitnessTest: protectedOrganizationProcedure
		.input(createFitnessTestSchema)
		.mutation(async ({ ctx, input }) => {
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

			const [test] = await db
				.insert(athleteFitnessTestTable)
				.values({
					athleteId: input.athleteId,
					testDate: input.testDate ?? new Date(),
					testType: input.testType,
					result: input.result,
					unit: input.unit,
					notes: input.notes,
					evaluatedBy: ctx.user.id,
				})
				.returning();

			return test;
		}),

	listFitnessTests: protectedOrganizationProcedure
		.input(listFitnessTestsSchema)
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

			const conditions = [
				eq(athleteFitnessTestTable.athleteId, input.athleteId),
			];
			if (input.testType) {
				conditions.push(eq(athleteFitnessTestTable.testType, input.testType));
			}

			const whereCondition = and(...conditions);

			const [tests, countResult] = await Promise.all([
				db.query.athleteFitnessTestTable.findMany({
					where: whereCondition,
					orderBy: desc(athleteFitnessTestTable.testDate),
					limit: input.limit,
					offset: input.offset,
					with: {
						evaluatedByUser: {
							columns: { id: true, name: true },
						},
					},
				}),
				db
					.select({ count: count() })
					.from(athleteFitnessTestTable)
					.where(whereCondition),
			]);

			return {
				tests,
				total: countResult[0]?.count ?? 0,
			};
		}),

	deleteFitnessTest: protectedOrganizationProcedure
		.input(deleteFitnessTestSchema)
		.mutation(async ({ ctx, input }) => {
			// Get the test and verify it belongs to an athlete in this organization
			const test = await db.query.athleteFitnessTestTable.findFirst({
				where: eq(athleteFitnessTestTable.id, input.id),
				with: {
					athlete: {
						columns: { organizationId: true },
					},
				},
			});

			if (!test || test.athlete.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Fitness test not found",
				});
			}

			await db
				.delete(athleteFitnessTestTable)
				.where(eq(athleteFitnessTestTable.id, input.id));

			return { success: true };
		}),

	// ============================================================================
	// CAREER HISTORY PROCEDURES
	// ============================================================================

	createCareerHistory: protectedOrganizationProcedure
		.input(createCareerHistorySchema)
		.mutation(async ({ ctx, input }) => {
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

			const [history] = await db
				.insert(athleteCareerHistoryTable)
				.values({
					athleteId: input.athleteId,
					clubName: input.clubName,
					startDate: input.startDate,
					endDate: input.endDate,
					position: input.position,
					achievements: input.achievements,
					wasNationalTeam: input.wasNationalTeam,
					nationalTeamLevel: input.nationalTeamLevel,
					notes: input.notes,
				})
				.returning();

			return history;
		}),

	updateCareerHistory: protectedOrganizationProcedure
		.input(updateCareerHistorySchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;

			// Get the history and verify it belongs to an athlete in this organization
			const history = await db.query.athleteCareerHistoryTable.findFirst({
				where: eq(athleteCareerHistoryTable.id, id),
				with: {
					athlete: {
						columns: { organizationId: true },
					},
				},
			});

			if (!history || history.athlete.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Career history not found",
				});
			}

			const [updated] = await db
				.update(athleteCareerHistoryTable)
				.set(data)
				.where(eq(athleteCareerHistoryTable.id, id))
				.returning();

			return updated;
		}),

	listCareerHistory: protectedOrganizationProcedure
		.input(listCareerHistorySchema)
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

			const [history, countResult] = await Promise.all([
				db.query.athleteCareerHistoryTable.findMany({
					where: eq(athleteCareerHistoryTable.athleteId, input.athleteId),
					orderBy: desc(athleteCareerHistoryTable.startDate),
					limit: input.limit,
					offset: input.offset,
				}),
				db
					.select({ count: count() })
					.from(athleteCareerHistoryTable)
					.where(eq(athleteCareerHistoryTable.athleteId, input.athleteId)),
			]);

			return {
				history,
				total: countResult[0]?.count ?? 0,
			};
		}),

	deleteCareerHistory: protectedOrganizationProcedure
		.input(deleteCareerHistorySchema)
		.mutation(async ({ ctx, input }) => {
			// Get the history and verify it belongs to an athlete in this organization
			const history = await db.query.athleteCareerHistoryTable.findFirst({
				where: eq(athleteCareerHistoryTable.id, input.id),
				with: {
					athlete: {
						columns: { organizationId: true },
					},
				},
			});

			if (!history || history.athlete.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Career history not found",
				});
			}

			await db
				.delete(athleteCareerHistoryTable)
				.where(eq(athleteCareerHistoryTable.id, input.id));

			return { success: true };
		}),
});
