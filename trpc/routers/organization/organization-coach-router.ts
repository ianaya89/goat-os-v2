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
	MemberRole,
	TrainingSessionStatus,
} from "@/lib/db/schema/enums";
import {
	accountTable,
	athleteEvaluationTable,
	athleteGroupMemberTable,
	athleteGroupTable,
	attendanceTable,
	coachAchievementTable,
	coachEducationTable,
	coachSportsExperienceTable,
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
	createCoachAchievementSchema,
	deleteCoachAchievementSchema,
	listCoachAchievementsSchema,
	updateCoachAchievementSchema,
} from "@/schemas/organization-coach-achievement-schemas";
import {
	bulkDeleteCoachesSchema,
	bulkUpdateCoachesStatusSchema,
	createCoachEducationSchema,
	createCoachExperienceSchema,
	createCoachSchema,
	deleteCoachEducationSchema,
	deleteCoachExperienceSchema,
	deleteCoachSchema,
	exportCoachesSchema,
	listCoachEducationSchema,
	listCoachExperienceSchema,
	listCoachesSchema,
	updateCoachEducationSchema,
	updateCoachExperienceSchema,
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
								emailVerified: true,
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
							invitationMode: true,
						},
						"Created new user for coach (invitation mode)",
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
							"Sent password setup invitation to coach",
						);
					} catch (emailError) {
						logger.error(
							{ error: emailError, email: input.email },
							"Failed to send invitation email to coach",
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
							invitationMode: false,
						},
						"Created new user for coach (temporary password mode)",
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
				invitationSent: !existingUser && input.sendInvitation,
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

	// ============================================================================
	// COACH SPORTS EXPERIENCE PROCEDURES
	// ============================================================================

	// Create coach sports experience
	createSportsExperience: protectedOrganizationProcedure
		.input(createCoachExperienceSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify coach belongs to organization
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

			const result = await db
				.insert(coachSportsExperienceTable)
				.values({
					coachId: input.coachId,
					institutionName: input.institutionName,
					role: input.role,
					sport: input.sport ?? undefined,
					level: input.level ?? undefined,
					startDate: input.startDate ?? undefined,
					endDate: input.endDate ?? undefined,
					achievements: input.achievements ?? undefined,
					description: input.description ?? undefined,
				})
				.returning();

			const experience = result[0]!;

			logger.info(
				{ coachId: input.coachId, experienceId: experience.id },
				"Coach sports experience created",
			);

			return experience;
		}),

	// Update coach sports experience
	updateSportsExperience: protectedOrganizationProcedure
		.input(updateCoachExperienceSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify experience exists and coach belongs to organization
			const experience = await db.query.coachSportsExperienceTable.findFirst({
				where: eq(coachSportsExperienceTable.id, input.id),
				with: {
					coach: true,
				},
			});

			if (!experience) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Experience not found",
				});
			}

			if (experience.coach.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not authorized to update this experience",
				});
			}

			const [updated] = await db
				.update(coachSportsExperienceTable)
				.set({
					institutionName: input.institutionName,
					role: input.role,
					sport: input.sport,
					level: input.level,
					startDate: input.startDate,
					endDate: input.endDate,
					achievements: input.achievements,
					description: input.description,
				})
				.where(eq(coachSportsExperienceTable.id, input.id))
				.returning();

			logger.info(
				{ experienceId: input.id },
				"Coach sports experience updated",
			);

			return updated;
		}),

	// List coach sports experience
	listSportsExperience: protectedOrganizationProcedure
		.input(listCoachExperienceSchema)
		.query(async ({ ctx, input }) => {
			// Verify coach belongs to organization
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

			const experiences = await db.query.coachSportsExperienceTable.findMany({
				where: eq(coachSportsExperienceTable.coachId, input.coachId),
				orderBy: [desc(coachSportsExperienceTable.startDate)],
			});

			return experiences;
		}),

	// Delete coach sports experience
	deleteSportsExperience: protectedOrganizationProcedure
		.input(deleteCoachExperienceSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify experience exists and coach belongs to organization
			const experience = await db.query.coachSportsExperienceTable.findFirst({
				where: eq(coachSportsExperienceTable.id, input.id),
				with: {
					coach: true,
				},
			});

			if (!experience) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Experience not found",
				});
			}

			if (experience.coach.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not authorized to delete this experience",
				});
			}

			await db
				.delete(coachSportsExperienceTable)
				.where(eq(coachSportsExperienceTable.id, input.id));

			logger.info(
				{ experienceId: input.id },
				"Coach sports experience deleted",
			);

			return { success: true };
		}),

	// ============================================================================
	// ACHIEVEMENT MANAGEMENT
	// ============================================================================

	listAchievements: protectedOrganizationProcedure
		.input(listCoachAchievementsSchema)
		.query(async ({ ctx, input }) => {
			// Verify coach belongs to organization
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

			const whereConditions = [
				eq(coachAchievementTable.coachId, input.coachId),
			];

			if (input.publicOnly) {
				whereConditions.push(eq(coachAchievementTable.isPublic, true));
			}

			const achievements = await db.query.coachAchievementTable.findMany({
				where: and(...whereConditions),
				orderBy: [
					desc(coachAchievementTable.year),
					asc(coachAchievementTable.displayOrder),
				],
			});

			return achievements;
		}),

	createAchievement: protectedOrganizationProcedure
		.input(createCoachAchievementSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify coach belongs to organization
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

			const result = await db
				.insert(coachAchievementTable)
				.values({
					coachId: input.coachId,
					title: input.title,
					type: input.type as AchievementType,
					scope: input.scope as AchievementScope,
					year: input.year,
					organization: input.organization ?? null,
					team: input.team ?? null,
					competition: input.competition ?? null,
					position: input.position ?? null,
					description: input.description ?? null,
					isPublic: input.isPublic ?? true,
					displayOrder: input.displayOrder ?? 0,
				})
				.returning();

			const achievement = result[0]!;

			logger.info(
				{ achievementId: achievement.id, coachId: input.coachId },
				"Coach achievement created",
			);

			return achievement;
		}),

	updateAchievement: protectedOrganizationProcedure
		.input(updateCoachAchievementSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify achievement exists and coach belongs to organization
			const achievement = await db.query.coachAchievementTable.findFirst({
				where: eq(coachAchievementTable.id, input.id),
				with: {
					coach: true,
				},
			});

			if (!achievement) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Achievement not found",
				});
			}

			if (achievement.coach.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not authorized to update this achievement",
				});
			}

			const { id, type, scope, ...rest } = input;
			const result = await db
				.update(coachAchievementTable)
				.set({
					...rest,
					type: type as AchievementType | undefined,
					scope: scope as AchievementScope | undefined,
				})
				.where(eq(coachAchievementTable.id, id))
				.returning();

			const updatedAchievement = result[0]!;

			logger.info({ achievementId: id }, "Coach achievement updated");

			return updatedAchievement;
		}),

	deleteAchievement: protectedOrganizationProcedure
		.input(deleteCoachAchievementSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify achievement exists and coach belongs to organization
			const achievement = await db.query.coachAchievementTable.findFirst({
				where: eq(coachAchievementTable.id, input.id),
				with: {
					coach: true,
				},
			});

			if (!achievement) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Achievement not found",
				});
			}

			if (achievement.coach.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not authorized to delete this achievement",
				});
			}

			await db
				.delete(coachAchievementTable)
				.where(eq(coachAchievementTable.id, input.id));

			logger.info({ achievementId: input.id }, "Coach achievement deleted");

			return { success: true };
		}),

	// ============================================================================
	// EDUCATION MANAGEMENT
	// ============================================================================

	listEducation: protectedOrganizationProcedure
		.input(listCoachEducationSchema)
		.query(async ({ ctx, input }) => {
			// Verify coach belongs to organization
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

			const education = await db.query.coachEducationTable.findMany({
				where: eq(coachEducationTable.coachId, input.coachId),
				orderBy: [
					desc(coachEducationTable.isCurrent),
					desc(coachEducationTable.startDate),
				],
			});

			return education;
		}),

	addEducation: protectedOrganizationProcedure
		.input(createCoachEducationSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify coach belongs to organization
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

			const result = await db
				.insert(coachEducationTable)
				.values({
					coachId: input.coachId,
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

			const education = result[0]!;

			logger.info(
				{ educationId: education.id, coachId: input.coachId },
				"Coach education created",
			);

			return education;
		}),

	updateEducation: protectedOrganizationProcedure
		.input(updateCoachEducationSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify education exists and coach belongs to organization
			const education = await db.query.coachEducationTable.findFirst({
				where: eq(coachEducationTable.id, input.id),
				with: {
					coach: true,
				},
			});

			if (!education) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Education not found",
				});
			}

			if (education.coach.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not authorized to update this education",
				});
			}

			const [updated] = await db
				.update(coachEducationTable)
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
				.where(eq(coachEducationTable.id, input.id))
				.returning();

			logger.info({ educationId: input.id }, "Coach education updated");

			return updated;
		}),

	deleteEducation: protectedOrganizationProcedure
		.input(deleteCoachEducationSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify education exists and coach belongs to organization
			const education = await db.query.coachEducationTable.findFirst({
				where: eq(coachEducationTable.id, input.id),
				with: {
					coach: true,
				},
			});

			if (!education) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Education not found",
				});
			}

			if (education.coach.organizationId !== ctx.organization.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not authorized to delete this education",
				});
			}

			await db
				.delete(coachEducationTable)
				.where(eq(coachEducationTable.id, input.id));

			logger.info({ educationId: input.id }, "Coach education deleted");

			return { success: true };
		}),
});
