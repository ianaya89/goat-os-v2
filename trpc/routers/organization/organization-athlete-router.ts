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
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	type AchievementScope,
	type AchievementType,
	AttendanceStatus,
	MemberRole,
} from "@/lib/db/schema/enums";
import {
	accountTable,
	athleteAchievementTable,
	athleteCareerHistoryTable,
	athleteEducationTable,
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
import { sendAthleteWelcomeEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { generateTemporaryPassword, getBaseUrl } from "@/lib/utils";
import {
	createAchievementSchema,
	deleteAchievementSchema,
	listAchievementsSchema,
	updateAchievementSchema,
} from "@/schemas/organization-athlete-achievement-schemas";
import {
	bulkDeleteAthletesSchema,
	bulkUpdateAthletesStatusSchema,
	createAthleteSchema,
	createCareerHistorySchema,
	createEducationSchema,
	createFitnessTestSchema,
	createPhysicalMetricsSchema,
	deleteAthleteSchema,
	deleteCareerHistorySchema,
	deleteEducationSchema,
	deleteFitnessTestSchema,
	deletePhysicalMetricsSchema,
	exportAthletesSchema,
	listAthletesSchema,
	listCareerHistorySchema,
	listEducationSchema,
	listFitnessTestsSchema,
	listPhysicalMetricsSchema,
	updateAthleteSchema,
	updateCareerHistorySchema,
	updateEducationSchema,
	updateFitnessTestSchema,
	updatePhysicalMetricsSchema,
} from "@/schemas/organization-athlete-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationAthleteRouter = createTRPCRouter({
	list: protectedOrganizationProcedure
		.input(listAthletesSchema)
		.query(async ({ ctx, input }) => {
			const conditions = [eq(athleteTable.organizationId, ctx.organization.id)];

			// Search query - search by user name, email, or sport
			if (input.query && input.query.trim() !== "") {
				const searchTerm = `%${input.query.trim()}%`;

				// Find user IDs that match the search query
				const matchingUsers = await db
					.select({ id: userTable.id })
					.from(userTable)
					.where(
						or(
							ilike(userTable.name, searchTerm),
							ilike(userTable.email, searchTerm),
						),
					);

				const matchingUserIds = matchingUsers.map((u) => u.id);

				// Search by sport OR matching user IDs
				if (matchingUserIds.length > 0) {
					conditions.push(
						or(
							ilike(athleteTable.sport, searchTerm),
							inArray(athleteTable.userId, matchingUserIds),
						)!,
					);
				} else {
					// No matching users, just search by sport
					conditions.push(ilike(athleteTable.sport, searchTerm));
				}
			}

			if (input.filters?.status && input.filters.status.length > 0) {
				conditions.push(inArray(athleteTable.status, input.filters.status));
			}

			if (input.filters?.level && input.filters.level.length > 0) {
				conditions.push(inArray(athleteTable.level, input.filters.level));
			}

			if (input.filters?.sport && input.filters.sport.length > 0) {
				conditions.push(inArray(athleteTable.sport, input.filters.sport));
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
								imageKey: true,
								emailVerified: true,
							},
						},
						groupMemberships: {
							with: {
								group: {
									columns: {
										id: true,
										name: true,
									},
								},
							},
						},
					},
				}),
				db.select({ count: count() }).from(athleteTable).where(whereCondition),
			]);

			// Transform to include groups directly on athlete
			const athletesWithGroups = athletes.map((athlete) => ({
				...athlete,
				groups: athlete.groupMemberships.map((gm) => gm.group),
			}));

			return {
				athletes: athletesWithGroups,
				total: countResult[0]?.count ?? 0,
			};
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
							imageKey: true,
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

			// Run independent queries in parallel for better performance
			const [
				groupMemberships,
				directSessions,
				evaluations,
				physicalMetrics,
				fitnessTests,
				careerHistory,
				wellnessSurveys,
				education,
			] = await Promise.all([
				// Get athlete groups
				db.query.athleteGroupMemberTable.findMany({
					where: eq(athleteGroupMemberTable.athleteId, athlete.id),
					with: {
						group: {
							columns: { id: true, name: true },
						},
					},
				}),
				// Get direct session assignments
				db.query.trainingSessionAthleteTable.findMany({
					where: eq(trainingSessionAthleteTable.athleteId, athlete.id),
					columns: { sessionId: true },
				}),
				// Get all evaluations for this athlete
				db.query.athleteEvaluationTable.findMany({
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
				}),
				// Get physical metrics (last 10)
				db.query.athletePhysicalMetricsTable.findMany({
					where: eq(athletePhysicalMetricsTable.athleteId, athlete.id),
					orderBy: desc(athletePhysicalMetricsTable.measuredAt),
					limit: 10,
					with: {
						recordedByUser: {
							columns: { id: true, name: true },
						},
					},
				}),
				// Get fitness tests (last 20)
				db.query.athleteFitnessTestTable.findMany({
					where: eq(athleteFitnessTestTable.athleteId, athlete.id),
					orderBy: desc(athleteFitnessTestTable.testDate),
					limit: 20,
					with: {
						evaluatedByUser: {
							columns: { id: true, name: true },
						},
					},
				}),
				// Get career history
				db.query.athleteCareerHistoryTable.findMany({
					where: eq(athleteCareerHistoryTable.athleteId, athlete.id),
					orderBy: desc(athleteCareerHistoryTable.startDate),
				}),
				// Get wellness surveys (last 30)
				db.query.athleteWellnessSurveyTable.findMany({
					where: eq(athleteWellnessSurveyTable.athleteId, athlete.id),
					orderBy: desc(athleteWellnessSurveyTable.surveyDate),
					limit: 30,
				}),
				// Get education history
				db.query.athleteEducationTable.findMany({
					where: eq(athleteEducationTable.athleteId, athlete.id),
					orderBy: [
						desc(athleteEducationTable.isCurrent),
						desc(athleteEducationTable.startDate),
					],
				}),
			]);

			const directSessionIds = directSessions.map((s) => s.sessionId);

			// Get sessions from groups (depends on groupMemberships)
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
				description: string | null;
				startTime: Date;
				endTime: Date;
				status: string;
				objectives: string | null;
				planning: string | null;
				postSessionNotes: string | null;
				isRecurring: boolean;
				rrule: string | null;
				attachmentKey: string | null;
				location: { id: string; name: string } | null;
				athleteGroup: { id: string; name: string } | null;
				coaches: Array<{
					id: string;
					isPrimary: boolean;
					coach: {
						id: string;
						user: { id: string; name: string; image: string | null } | null;
					};
				}>;
				athletes: Array<{
					id: string;
					athlete: {
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
						athletes: {
							with: {
								athlete: {
									with: {
										user: { columns: { id: true, name: true, image: true } },
									},
								},
							},
						},
					},
				});
			}

			// Get all attendance records for this athlete (filtered by organization via session)
			// Only include attendance for sessions that belong to this organization
			const orgSessionIds = sessions.map((s) => s.id);
			const attendanceRecords =
				orgSessionIds.length > 0
					? await db.query.attendanceTable.findMany({
							where: and(
								eq(attendanceTable.athleteId, athlete.id),
								inArray(attendanceTable.sessionId, orgSessionIds),
							),
							orderBy: desc(attendanceTable.createdAt),
							with: {
								session: {
									columns: { id: true, title: true, startTime: true },
								},
							},
						})
					: [];

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

			// Calculate average ratings (each with its own counter)
			let performanceSum = 0;
			let performanceCount = 0;
			let attitudeSum = 0;
			let attitudeCount = 0;
			let physicalFitnessSum = 0;
			let physicalFitnessCount = 0;

			for (const evaluation of evaluations) {
				if (evaluation.performanceRating) {
					performanceSum += evaluation.performanceRating;
					performanceCount++;
				}
				if (evaluation.attitudeRating) {
					attitudeSum += evaluation.attitudeRating;
					attitudeCount++;
				}
				if (evaluation.physicalFitnessRating) {
					physicalFitnessSum += evaluation.physicalFitnessRating;
					physicalFitnessCount++;
				}
			}

			const avgPerformance =
				performanceCount > 0 ? performanceSum / performanceCount : 0;
			const avgAttitude = attitudeCount > 0 ? attitudeSum / attitudeCount : 0;
			const avgPhysicalFitness =
				physicalFitnessCount > 0
					? physicalFitnessSum / physicalFitnessCount
					: 0;
			const ratingCount = evaluations.length;

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
				education,
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
						role: MemberRole.member,
					});
				} else if (existingMember.role === MemberRole.member) {
					// Update existing member role to athlete
					await db
						.update(memberTable)
						.set({ role: MemberRole.member })
						.where(eq(memberTable.id, existingMember.id));
				}
			} else {
				// Create new user
				const { hashPassword } = await import("better-auth/crypto");

				if (input.sendInvitation) {
					// Invitation mode: Create user without usable password
					// User will set their own password via the reset password flow
					const placeholderPassword = await hashPassword(
						`INVITATION_PENDING_${Date.now()}_${Math.random()}`,
					);

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

					// Create account with placeholder password (Better Auth pattern)
					await db.insert(accountTable).values({
						userId: newUser.id,
						accountId: newUser.id,
						providerId: "credential",
						password: placeholderPassword,
					});

					// Add user as member of the organization with athlete role
					await db.insert(memberTable).values({
						organizationId: ctx.organization.id,
						userId: newUser.id,
						role: MemberRole.member,
					});

					logger.info(
						{
							userId: newUser.id,
							email: input.email,
							organizationId: ctx.organization.id,
							invitationMode: true,
						},
						"Created new user for athlete (invitation mode)",
					);

					// Send password reset email so user can set their own password
					try {
						await auth.api.requestPasswordReset({
							body: {
								email: input.email.toLowerCase(),
								redirectTo: "/auth/reset-password",
							},
						});
						logger.info(
							{ email: input.email, organizationId: ctx.organization.id },
							"Sent password setup invitation to athlete",
						);
					} catch (emailError) {
						logger.error(
							{ error: emailError, email: input.email },
							"Failed to send invitation email to athlete",
						);
					}
				} else {
					// Temporary password mode: Generate password and show to admin
					temporaryPassword = generateTemporaryPassword();
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
						role: MemberRole.member,
					});

					logger.info(
						{
							userId: newUser.id,
							email: input.email,
							organizationId: ctx.organization.id,
							invitationMode: false,
						},
						"Created new user for athlete (temporary password mode)",
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
				invitationSent: !existingUser && input.sendInvitation,
			};
		}),

	update: protectedOrganizationProcedure
		.input(updateAthleteSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, name, email, ...athleteData } = input;

			// First, get the athlete to verify ownership and get userId
			const existingAthlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.id, id),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
			});

			if (!existingAthlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete not found",
				});
			}

			// If email is being changed, check if it's already in use by another user
			if (email) {
				const _existingUserWithEmail = await db.query.userTable.findFirst({
					where: and(
						eq(userTable.email, email.toLowerCase()),
						// Exclude the current user
						existingAthlete.userId
							? eq(userTable.id, existingAthlete.userId)
							: undefined,
					),
				});

				// Check if another user has this email
				const anotherUserWithEmail = await db.query.userTable.findFirst({
					where: eq(userTable.email, email.toLowerCase()),
				});

				if (
					anotherUserWithEmail &&
					anotherUserWithEmail.id !== existingAthlete.userId
				) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Email already in use by another user",
					});
				}
			}

			// Update user table if name or email are provided
			if ((name || email) && existingAthlete.userId) {
				const userUpdateData: { name?: string; email?: string } = {};
				if (name) userUpdateData.name = name;
				if (email) userUpdateData.email = email.toLowerCase();

				await db
					.update(userTable)
					.set(userUpdateData)
					.where(eq(userTable.id, existingAthlete.userId));

				logger.info(
					{
						userId: existingAthlete.userId,
						athleteId: id,
						updatedFields: Object.keys(userUpdateData),
					},
					"Updated user data for athlete",
				);
			}

			// Update athlete table
			const [updatedAthlete] = await db
				.update(athleteTable)
				.set(athleteData)
				.where(
					and(
						eq(athleteTable.id, id),
						eq(athleteTable.organizationId, ctx.organization.id),
					),
				)
				.returning();

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
					weight: input.weight,
					bodyFatPercentage: input.bodyFatPercentage,
					muscleMass: input.muscleMass,
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

	updatePhysicalMetrics: protectedOrganizationProcedure
		.input(updatePhysicalMetricsSchema)
		.mutation(async ({ ctx, input }) => {
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

			const existingMetric =
				await db.query.athletePhysicalMetricsTable.findFirst({
					where: and(
						eq(athletePhysicalMetricsTable.id, input.id),
						eq(athletePhysicalMetricsTable.athleteId, input.athleteId),
					),
				});

			if (!existingMetric) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Physical metric not found",
				});
			}

			const [updatedMetric] = await db
				.update(athletePhysicalMetricsTable)
				.set({
					measuredAt: input.measuredAt ?? existingMetric.measuredAt,
					weight: input.weight,
					bodyFatPercentage: input.bodyFatPercentage,
					muscleMass: input.muscleMass,
					notes: input.notes,
				})
				.where(eq(athletePhysicalMetricsTable.id, input.id))
				.returning();

			return updatedMetric;
		}),

	deletePhysicalMetrics: protectedOrganizationProcedure
		.input(deletePhysicalMetricsSchema)
		.mutation(async ({ ctx, input }) => {
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

			const [deletedMetric] = await db
				.delete(athletePhysicalMetricsTable)
				.where(
					and(
						eq(athletePhysicalMetricsTable.id, input.id),
						eq(athletePhysicalMetricsTable.athleteId, input.athleteId),
					),
				)
				.returning();

			if (!deletedMetric) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Physical metric not found",
				});
			}

			return { success: true };
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

	updateFitnessTest: protectedOrganizationProcedure
		.input(updateFitnessTestSchema)
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

			// Verify test exists and belongs to athlete
			const existingTest = await db.query.athleteFitnessTestTable.findFirst({
				where: and(
					eq(athleteFitnessTestTable.id, input.id),
					eq(athleteFitnessTestTable.athleteId, input.athleteId),
				),
			});

			if (!existingTest) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Fitness test not found",
				});
			}

			const [updated] = await db
				.update(athleteFitnessTestTable)
				.set({
					...(input.testDate && { testDate: input.testDate }),
					...(input.testType && { testType: input.testType }),
					...(input.result !== undefined && { result: input.result }),
					...(input.unit && { unit: input.unit }),
					...(input.notes !== undefined && { notes: input.notes }),
				})
				.where(eq(athleteFitnessTestTable.id, input.id))
				.returning();

			return updated;
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

			// Verify test exists and belongs to athlete
			const test = await db.query.athleteFitnessTestTable.findFirst({
				where: and(
					eq(athleteFitnessTestTable.id, input.id),
					eq(athleteFitnessTestTable.athleteId, input.athleteId),
				),
			});

			if (!test) {
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

	// ============================================================================
	// EDUCATION ENDPOINTS
	// ============================================================================

	listEducation: protectedOrganizationProcedure
		.input(listEducationSchema)
		.query(async ({ ctx, input }) => {
			// Verify athlete belongs to organization
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.id, input.athleteId),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
				columns: { id: true },
			});

			if (!athlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete not found",
				});
			}

			const education = await db.query.athleteEducationTable.findMany({
				where: eq(athleteEducationTable.athleteId, input.athleteId),
				orderBy: [
					desc(athleteEducationTable.isCurrent),
					desc(athleteEducationTable.startDate),
				],
			});

			return education;
		}),

	addEducation: protectedOrganizationProcedure
		.input(createEducationSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify athlete belongs to organization
			const athlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.id, input.athleteId),
					eq(athleteTable.organizationId, ctx.organization.id),
				),
				columns: { id: true },
			});

			if (!athlete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Athlete not found",
				});
			}

			const [education] = await db
				.insert(athleteEducationTable)
				.values({
					athleteId: input.athleteId,
					institution: input.institution,
					degree: input.degree ?? null,
					fieldOfStudy: input.fieldOfStudy ?? null,
					academicYear: input.academicYear ?? null,
					startDate: input.startDate ?? null,
					endDate: input.isCurrent ? null : (input.endDate ?? null),
					expectedGraduationDate: input.expectedGraduationDate ?? null,
					gpa: input.gpa ?? null,
					isCurrent: input.isCurrent ?? false,
					notes: input.notes ?? null,
				})
				.returning();

			return education;
		}),

	updateEducation: protectedOrganizationProcedure
		.input(updateEducationSchema)
		.mutation(async ({ ctx, input }) => {
			// Get education and verify it belongs to an athlete in this organization
			const education = await db.query.athleteEducationTable.findFirst({
				where: eq(athleteEducationTable.id, input.id),
				with: {
					athlete: {
						columns: { organizationId: true },
					},
				},
			});

			if (
				!education ||
				education.athlete.organizationId !== ctx.organization.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Education not found",
				});
			}

			const [updated] = await db
				.update(athleteEducationTable)
				.set({
					institution: input.institution,
					degree: input.degree ?? null,
					fieldOfStudy: input.fieldOfStudy ?? null,
					academicYear: input.academicYear ?? null,
					startDate: input.startDate ?? null,
					endDate: input.isCurrent ? null : (input.endDate ?? null),
					expectedGraduationDate: input.expectedGraduationDate ?? null,
					gpa: input.gpa ?? null,
					isCurrent: input.isCurrent ?? false,
					notes: input.notes ?? null,
				})
				.where(eq(athleteEducationTable.id, input.id))
				.returning();

			return updated;
		}),

	deleteEducation: protectedOrganizationProcedure
		.input(deleteEducationSchema)
		.mutation(async ({ ctx, input }) => {
			// Get education and verify it belongs to an athlete in this organization
			const education = await db.query.athleteEducationTable.findFirst({
				where: eq(athleteEducationTable.id, input.id),
				with: {
					athlete: {
						columns: { organizationId: true },
					},
				},
			});

			if (
				!education ||
				education.athlete.organizationId !== ctx.organization.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Education not found",
				});
			}

			await db
				.delete(athleteEducationTable)
				.where(eq(athleteEducationTable.id, input.id));

			return { success: true };
		}),

	// ============================================================================
	// ATHLETE ACHIEVEMENTS PROCEDURES
	// ============================================================================

	listAchievements: protectedOrganizationProcedure
		.input(listAchievementsSchema)
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

			const achievements = await db.query.athleteAchievementTable.findMany({
				where: eq(athleteAchievementTable.athleteId, input.athleteId),
				orderBy: [
					desc(athleteAchievementTable.year),
					asc(athleteAchievementTable.displayOrder),
				],
			});

			return achievements;
		}),

	createAchievement: protectedOrganizationProcedure
		.input(createAchievementSchema)
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

			// Get max displayOrder for this athlete
			const maxOrderResult = await db
				.select({ maxOrder: athleteAchievementTable.displayOrder })
				.from(athleteAchievementTable)
				.where(eq(athleteAchievementTable.athleteId, input.athleteId))
				.orderBy(desc(athleteAchievementTable.displayOrder))
				.limit(1);

			const nextOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

			const result = await db
				.insert(athleteAchievementTable)
				.values({
					athleteId: input.athleteId,
					title: input.title,
					type: input.type as AchievementType,
					scope: input.scope as AchievementScope,
					year: input.year,
					organization: input.organization,
					team: input.team,
					competition: input.competition,
					position: input.position,
					description: input.description,
					isPublic: input.isPublic,
					displayOrder: nextOrder,
				})
				.returning();

			const achievement = result[0]!;

			logger.info(
				{ athleteId: input.athleteId, achievementId: achievement.id },
				"Athlete achievement created",
			);

			return achievement;
		}),

	updateAchievement: protectedOrganizationProcedure
		.input(updateAchievementSchema)
		.mutation(async ({ ctx, input }) => {
			// Get achievement and verify it belongs to an athlete in this organization
			const achievement = await db.query.athleteAchievementTable.findFirst({
				where: eq(athleteAchievementTable.id, input.id),
				with: {
					athlete: {
						columns: { organizationId: true },
					},
				},
			});

			if (
				!achievement ||
				achievement.athlete.organizationId !== ctx.organization.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Achievement not found",
				});
			}

			const [updated] = await db
				.update(athleteAchievementTable)
				.set({
					title: input.title,
					type: input.type as AchievementType | undefined,
					scope: input.scope as AchievementScope | undefined,
					year: input.year,
					organization: input.organization,
					team: input.team,
					competition: input.competition,
					position: input.position,
					description: input.description,
					isPublic: input.isPublic,
					displayOrder: input.displayOrder,
				})
				.where(eq(athleteAchievementTable.id, input.id))
				.returning();

			logger.info({ achievementId: input.id }, "Athlete achievement updated");

			return updated;
		}),

	deleteAchievement: protectedOrganizationProcedure
		.input(deleteAchievementSchema)
		.mutation(async ({ ctx, input }) => {
			// Get achievement and verify it belongs to an athlete in this organization
			const achievement = await db.query.athleteAchievementTable.findFirst({
				where: eq(athleteAchievementTable.id, input.id),
				with: {
					athlete: {
						columns: { organizationId: true },
					},
				},
			});

			if (
				!achievement ||
				achievement.athlete.organizationId !== ctx.organization.id
			) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Achievement not found",
				});
			}

			await db
				.delete(athleteAchievementTable)
				.where(eq(athleteAchievementTable.id, input.id));

			logger.info({ achievementId: input.id }, "Athlete achievement deleted");

			return { success: true };
		}),
});
