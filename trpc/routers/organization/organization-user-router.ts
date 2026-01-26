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
	isNotNull,
	lte,
	or,
	type SQL,
} from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MemberRole } from "@/lib/db/schema/enums";
import {
	athleteTable,
	coachTable,
	memberTable,
	userTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import {
	deleteObject,
	generateStorageKey,
	getBucketName,
	getSignedUploadUrl,
	getSignedUrl,
} from "@/lib/storage/s3";
import {
	getOrganizationUserSchema,
	getProfileImageUploadUrlSchema,
	listOrganizationUsersSchema,
	removeOrganizationUserSchema,
	removeProfileImageSchema,
	resendVerificationEmailSchema,
	saveProfileImageSchema,
	sendPasswordResetSchema,
	updateOrganizationUserRoleSchema,
} from "@/schemas/organization-user-schemas";
import { createTRPCRouter, protectedOrganizationProcedure } from "@/trpc/init";

export const organizationUserRouter = createTRPCRouter({
	// Get current user's profile info (including coach/athlete profiles)
	me: protectedOrganizationProcedure.query(async ({ ctx }) => {
		// Get profiles for current user
		const [coachProfile, athleteProfile] = await Promise.all([
			db.query.coachTable.findFirst({
				where: and(
					eq(coachTable.organizationId, ctx.organization.id),
					eq(coachTable.userId, ctx.user.id),
				),
			}),
			db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.organizationId, ctx.organization.id),
					eq(athleteTable.userId, ctx.user.id),
				),
			}),
		]);

		return {
			userId: ctx.user.id,
			role: ctx.membership.role,
			isCoach: !!coachProfile,
			isAthlete: !!athleteProfile,
			coachProfile: coachProfile ?? null,
			athleteProfile: athleteProfile ?? null,
		};
	}),

	list: protectedOrganizationProcedure
		.input(listOrganizationUsersSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(memberTable.organizationId, ctx.organization.id),
			];

			// Role filter
			if (input.filters?.role && input.filters.role.length > 0) {
				conditions.push(inArray(memberTable.role, input.filters.role));
			}

			// Joined date filter
			if (input.filters?.joinedAt && input.filters.joinedAt.length > 0) {
				const dateConditions = input.filters.joinedAt
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
									gte(memberTable.createdAt, todayStart),
									lte(memberTable.createdAt, todayEnd),
								);
							}
							case "this-week": {
								const weekStart = new Date(
									now.getFullYear(),
									now.getMonth(),
									now.getDate() - now.getDay(),
								);
								return gte(memberTable.createdAt, weekStart);
							}
							case "this-month": {
								const monthStart = new Date(
									now.getFullYear(),
									now.getMonth(),
									1,
								);
								return gte(memberTable.createdAt, monthStart);
							}
							case "older": {
								const monthAgo = new Date(
									now.getFullYear(),
									now.getMonth() - 1,
									now.getDate(),
								);
								return lte(memberTable.createdAt, monthAgo);
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
				case "name":
					orderByColumn = sortDirection(userTable.name);
					break;
				case "email":
					orderByColumn = sortDirection(userTable.email);
					break;
				case "role":
					orderByColumn = sortDirection(memberTable.role);
					break;
				default:
					orderByColumn = sortDirection(memberTable.createdAt);
					break;
			}

			// Get members with users
			const membersWithUsers = await db
				.select({
					memberId: memberTable.id,
					memberRole: memberTable.role,
					joinedAt: memberTable.createdAt,
					userId: userTable.id,
					userName: userTable.name,
					userEmail: userTable.email,
					userImage: userTable.image,
					emailVerified: userTable.emailVerified,
					userCreatedAt: userTable.createdAt,
				})
				.from(memberTable)
				.innerJoin(userTable, eq(memberTable.userId, userTable.id))
				.where(
					input.query
						? and(
								whereCondition,
								or(
									ilike(userTable.name, `%${input.query}%`),
									ilike(userTable.email, `%${input.query}%`),
								),
							)
						: whereCondition,
				)
				.orderBy(orderByColumn)
				.limit(input.limit)
				.offset(input.offset);

			// Get total count
			const countResult = await db
				.select({ count: count() })
				.from(memberTable)
				.innerJoin(userTable, eq(memberTable.userId, userTable.id))
				.where(
					input.query
						? and(
								whereCondition,
								or(
									ilike(userTable.name, `%${input.query}%`),
									ilike(userTable.email, `%${input.query}%`),
								),
							)
						: whereCondition,
				);

			// Get user IDs to fetch profiles
			const userIds = membersWithUsers.map((m) => m.userId);

			// Fetch coach and athlete profiles for these users
			const [coachProfiles, athleteProfiles] = await Promise.all([
				userIds.length > 0
					? db
							.select({
								userId: coachTable.userId,
								id: coachTable.id,
								specialty: coachTable.specialty,
								status: coachTable.status,
							})
							.from(coachTable)
							.where(
								and(
									eq(coachTable.organizationId, ctx.organization.id),
									inArray(coachTable.userId, userIds),
									isNotNull(coachTable.userId),
								),
							)
					: [],
				userIds.length > 0
					? db
							.select({
								userId: athleteTable.userId,
								id: athleteTable.id,
								sport: athleteTable.sport,
								level: athleteTable.level,
								status: athleteTable.status,
							})
							.from(athleteTable)
							.where(
								and(
									eq(athleteTable.organizationId, ctx.organization.id),
									inArray(athleteTable.userId, userIds),
									isNotNull(athleteTable.userId),
								),
							)
					: [],
			]);

			// Create lookup maps
			const coachMap = new Map(coachProfiles.map((c) => [c.userId, c]));
			const athleteMap = new Map(athleteProfiles.map((a) => [a.userId, a]));

			// Filter by profile if needed
			let filteredMembers = membersWithUsers;
			if (input.filters?.hasCoachProfile !== undefined) {
				filteredMembers = filteredMembers.filter((m) =>
					input.filters?.hasCoachProfile
						? coachMap.has(m.userId)
						: !coachMap.has(m.userId),
				);
			}
			if (input.filters?.hasAthleteProfile !== undefined) {
				filteredMembers = filteredMembers.filter((m) =>
					input.filters?.hasAthleteProfile
						? athleteMap.has(m.userId)
						: !athleteMap.has(m.userId),
				);
			}
			if (input.filters?.emailVerified !== undefined) {
				filteredMembers = filteredMembers.filter(
					(m) => m.emailVerified === input.filters?.emailVerified,
				);
			}

			// Combine data
			const users = filteredMembers.map((member) => ({
				id: member.userId,
				memberId: member.memberId,
				name: member.userName,
				email: member.userEmail,
				image: member.userImage,
				emailVerified: member.emailVerified,
				role: member.memberRole,
				joinedAt: member.joinedAt,
				userCreatedAt: member.userCreatedAt,
				coachProfile: coachMap.get(member.userId) ?? null,
				athleteProfile: athleteMap.get(member.userId) ?? null,
			}));

			return {
				users,
				total: countResult[0]?.count ?? 0,
			};
		}),

	get: protectedOrganizationProcedure
		.input(getOrganizationUserSchema)
		.query(async ({ ctx, input }) => {
			// Get member with user
			const memberWithUser = await db
				.select({
					memberId: memberTable.id,
					memberRole: memberTable.role,
					joinedAt: memberTable.createdAt,
					userId: userTable.id,
					userName: userTable.name,
					userEmail: userTable.email,
					userImage: userTable.image,
					emailVerified: userTable.emailVerified,
					userCreatedAt: userTable.createdAt,
				})
				.from(memberTable)
				.innerJoin(userTable, eq(memberTable.userId, userTable.id))
				.where(
					and(
						eq(memberTable.organizationId, ctx.organization.id),
						eq(memberTable.userId, input.userId),
					),
				)
				.limit(1);

			const member = memberWithUser[0];
			if (!member) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this organization",
				});
			}

			// Get profiles
			const [coachProfile, athleteProfile] = await Promise.all([
				db.query.coachTable.findFirst({
					where: and(
						eq(coachTable.organizationId, ctx.organization.id),
						eq(coachTable.userId, input.userId),
					),
				}),
				db.query.athleteTable.findFirst({
					where: and(
						eq(athleteTable.organizationId, ctx.organization.id),
						eq(athleteTable.userId, input.userId),
					),
				}),
			]);

			return {
				id: member.userId,
				memberId: member.memberId,
				name: member.userName,
				email: member.userEmail,
				image: member.userImage,
				emailVerified: member.emailVerified,
				role: member.memberRole,
				joinedAt: member.joinedAt,
				userCreatedAt: member.userCreatedAt,
				coachProfile: coachProfile ?? null,
				athleteProfile: athleteProfile ?? null,
			};
		}),

	updateRole: protectedOrganizationProcedure
		.input(updateOrganizationUserRoleSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user is owner/admin
			if (
				ctx.membership.role !== MemberRole.owner &&
				ctx.membership.role !== MemberRole.admin
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only owners and admins can change member roles",
				});
			}

			// Can't change own role
			if (input.userId === ctx.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot change your own role",
				});
			}

			// Get target member
			const targetMember = await db.query.memberTable.findFirst({
				where: and(
					eq(memberTable.organizationId, ctx.organization.id),
					eq(memberTable.userId, input.userId),
				),
			});

			if (!targetMember) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this organization",
				});
			}

			// Can't change owner's role unless you're the owner
			if (
				targetMember.role === MemberRole.owner &&
				ctx.membership.role !== MemberRole.owner
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only owners can change another owner's role",
				});
			}

			// Can't promote to owner unless you're the owner
			if (
				input.role === MemberRole.owner &&
				ctx.membership.role !== MemberRole.owner
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only owners can promote members to owner",
				});
			}

			// Update role
			const [updatedMember] = await db
				.update(memberTable)
				.set({ role: input.role })
				.where(
					and(
						eq(memberTable.organizationId, ctx.organization.id),
						eq(memberTable.userId, input.userId),
					),
				)
				.returning();

			logger.info(
				{
					organizationId: ctx.organization.id,
					targetUserId: input.userId,
					oldRole: targetMember.role,
					newRole: input.role,
					changedBy: ctx.user.id,
				},
				"Updated member role",
			);

			return updatedMember;
		}),

	remove: protectedOrganizationProcedure
		.input(removeOrganizationUserSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user is owner/admin
			if (
				ctx.membership.role !== MemberRole.owner &&
				ctx.membership.role !== MemberRole.admin
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only owners and admins can remove members",
				});
			}

			// Can't remove yourself
			if (input.userId === ctx.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot remove yourself from the organization",
				});
			}

			// Get target member
			const targetMember = await db.query.memberTable.findFirst({
				where: and(
					eq(memberTable.organizationId, ctx.organization.id),
					eq(memberTable.userId, input.userId),
				),
			});

			if (!targetMember) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this organization",
				});
			}

			// Can't remove owner unless you're the owner
			if (
				targetMember.role === MemberRole.owner &&
				ctx.membership.role !== MemberRole.owner
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only owners can remove other owners",
				});
			}

			// Remove member (this will cascade delete their coach/athlete profiles due to FK constraints)
			await db
				.delete(memberTable)
				.where(
					and(
						eq(memberTable.organizationId, ctx.organization.id),
						eq(memberTable.userId, input.userId),
					),
				);

			logger.info(
				{
					organizationId: ctx.organization.id,
					removedUserId: input.userId,
					removedBy: ctx.user.id,
				},
				"Removed member from organization",
			);

			return { success: true };
		}),

	sendPasswordReset: protectedOrganizationProcedure
		.input(sendPasswordResetSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user is owner/admin
			if (
				ctx.membership.role !== MemberRole.owner &&
				ctx.membership.role !== MemberRole.admin
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only owners and admins can send password reset emails",
				});
			}

			// Verify user is a member of this organization
			const targetMember = await db.query.memberTable.findFirst({
				where: and(
					eq(memberTable.organizationId, ctx.organization.id),
					eq(memberTable.userId, input.userId),
				),
			});

			if (!targetMember) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this organization",
				});
			}

			// Get user email
			const user = await db.query.userTable.findFirst({
				where: eq(userTable.id, input.userId),
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Send password reset email using Better Auth API
			try {
				await auth.api.requestPasswordReset({
					body: {
						email: user.email,
						redirectTo: "/auth/reset-password",
					},
				});

				logger.info(
					{
						organizationId: ctx.organization.id,
						targetUserId: input.userId,
						targetEmail: user.email,
						requestedBy: ctx.user.id,
					},
					"Password reset email sent",
				);

				return { success: true };
			} catch (error) {
				logger.error(
					{ error, userId: input.userId },
					"Failed to send password reset email",
				);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to send password reset email",
				});
			}
		}),

	resendVerificationEmail: protectedOrganizationProcedure
		.input(resendVerificationEmailSchema)
		.mutation(async ({ ctx, input }) => {
			// Check if user is owner/admin
			if (
				ctx.membership.role !== MemberRole.owner &&
				ctx.membership.role !== MemberRole.admin
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only owners and admins can resend verification emails",
				});
			}

			// Verify user is a member of this organization
			const targetMember = await db.query.memberTable.findFirst({
				where: and(
					eq(memberTable.organizationId, ctx.organization.id),
					eq(memberTable.userId, input.userId),
				),
			});

			if (!targetMember) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this organization",
				});
			}

			// Get user
			const user = await db.query.userTable.findFirst({
				where: eq(userTable.id, input.userId),
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Check if already verified
			if (user.emailVerified) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "User email is already verified",
				});
			}

			// Send verification email using Better Auth API
			try {
				await auth.api.sendVerificationEmail({
					body: {
						email: user.email,
						callbackURL: "/dashboard",
					},
				});

				logger.info(
					{
						organizationId: ctx.organization.id,
						targetUserId: input.userId,
						targetEmail: user.email,
						requestedBy: ctx.user.id,
					},
					"Verification email resent",
				);

				return { success: true };
			} catch (error) {
				logger.error(
					{ error, userId: input.userId },
					"Failed to resend verification email",
				);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to resend verification email",
				});
			}
		}),

	// ============================================================================
	// PROFILE IMAGE
	// ============================================================================

	getProfileImageUploadUrl: protectedOrganizationProcedure
		.input(getProfileImageUploadUrlSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify user is in this organization
			const targetMember = await db.query.memberTable.findFirst({
				where: and(
					eq(memberTable.organizationId, ctx.organization.id),
					eq(memberTable.userId, input.userId),
				),
			});

			if (!targetMember) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this organization",
				});
			}

			// Check permissions: only self or admin/owner can change profile image
			const canEdit =
				input.userId === ctx.user.id ||
				ctx.membership.role === MemberRole.owner ||
				ctx.membership.role === MemberRole.admin;

			if (!canEdit) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You don't have permission to change this user's profile image",
				});
			}

			const storageKey = generateStorageKey(
				"profile-images",
				ctx.organization.id,
				input.fileName,
			);

			const uploadUrl = await getSignedUploadUrl(storageKey, getBucketName(), {
				contentType: input.contentType || "image/jpeg",
				expiresIn: 3600, // 1 hour
			});

			return { uploadUrl, imageKey: storageKey };
		}),

	saveProfileImage: protectedOrganizationProcedure
		.input(saveProfileImageSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify user is in this organization
			const targetMember = await db.query.memberTable.findFirst({
				where: and(
					eq(memberTable.organizationId, ctx.organization.id),
					eq(memberTable.userId, input.userId),
				),
			});

			if (!targetMember) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this organization",
				});
			}

			// Check permissions
			const canEdit =
				input.userId === ctx.user.id ||
				ctx.membership.role === MemberRole.owner ||
				ctx.membership.role === MemberRole.admin;

			if (!canEdit) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You don't have permission to change this user's profile image",
				});
			}

			// Get current user to delete old image if exists
			const user = await db.query.userTable.findFirst({
				where: eq(userTable.id, input.userId),
			});

			if (user?.imageKey) {
				try {
					await deleteObject(user.imageKey, getBucketName());
				} catch (error) {
					logger.error(
						{ error, oldImageKey: user.imageKey },
						"Failed to delete old profile image",
					);
				}
			}

			// Update user with new image key
			const [updatedUser] = await db
				.update(userTable)
				.set({ imageKey: input.imageKey })
				.where(eq(userTable.id, input.userId))
				.returning();

			logger.info(
				{
					userId: input.userId,
					imageKey: input.imageKey,
					updatedBy: ctx.user.id,
				},
				"Profile image updated",
			);

			return updatedUser;
		}),

	removeProfileImage: protectedOrganizationProcedure
		.input(removeProfileImageSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify user is in this organization
			const targetMember = await db.query.memberTable.findFirst({
				where: and(
					eq(memberTable.organizationId, ctx.organization.id),
					eq(memberTable.userId, input.userId),
				),
			});

			if (!targetMember) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this organization",
				});
			}

			// Check permissions
			const canEdit =
				input.userId === ctx.user.id ||
				ctx.membership.role === MemberRole.owner ||
				ctx.membership.role === MemberRole.admin;

			if (!canEdit) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message:
						"You don't have permission to change this user's profile image",
				});
			}

			// Get current user to delete image
			const user = await db.query.userTable.findFirst({
				where: eq(userTable.id, input.userId),
			});

			if (user?.imageKey) {
				try {
					await deleteObject(user.imageKey, getBucketName());
				} catch (error) {
					logger.error(
						{ error, imageKey: user.imageKey },
						"Failed to delete profile image from S3",
					);
				}
			}

			// Clear image key
			const [updatedUser] = await db
				.update(userTable)
				.set({ imageKey: null })
				.where(eq(userTable.id, input.userId))
				.returning();

			logger.info(
				{
					userId: input.userId,
					removedBy: ctx.user.id,
				},
				"Profile image removed",
			);

			return updatedUser;
		}),

	getProfileImageUrl: protectedOrganizationProcedure
		.input(getOrganizationUserSchema)
		.query(async ({ ctx, input }) => {
			// Verify user is in this organization
			const targetMember = await db.query.memberTable.findFirst({
				where: and(
					eq(memberTable.organizationId, ctx.organization.id),
					eq(memberTable.userId, input.userId),
				),
			});

			if (!targetMember) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found in this organization",
				});
			}

			const user = await db.query.userTable.findFirst({
				where: eq(userTable.id, input.userId),
				columns: { image: true, imageKey: true },
			});

			if (!user) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Prioritize S3 image over OAuth image
			if (user.imageKey) {
				const signedUrl = await getSignedUrl(user.imageKey, getBucketName());
				return { imageUrl: signedUrl, source: "s3" as const };
			}

			if (user.image) {
				return { imageUrl: user.image, source: "oauth" as const };
			}

			return { imageUrl: null, source: null };
		}),
});
