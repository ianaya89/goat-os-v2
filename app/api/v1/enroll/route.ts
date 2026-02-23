import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ApiAuthError, validateApiKey } from "@/lib/api/auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { AthleteStatus, MemberRole } from "@/lib/db/schema/enums";
import {
	accountTable,
	athleteGroupMemberTable,
	athleteGroupTable,
	athleteTable,
	memberTable,
	userTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";
import { enrollSchema } from "@/schemas/enroll-schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
	try {
		const { organizationId } = validateApiKey(request);

		const body = await request.json();
		const parsed = enrollSchema.safeParse(body);

		if (!parsed.success) {
			const missingFields = parsed.error.issues.map((issue) => ({
				path: issue.path.join("."),
				message: issue.message,
				code: issue.code,
			}));

			logger.warn(
				{ organizationId, missingFields, body },
				"Enroll validation failed: invalid request body",
			);

			return NextResponse.json(
				{ error: "Invalid request body", details: parsed.error.issues },
				{ status: 400 },
			);
		}

		const data = parsed.data;

		// Validate that the group exists and belongs to the organization
		const group = await db.query.athleteGroupTable.findFirst({
			where: and(
				eq(athleteGroupTable.id, data.groupId),
				eq(athleteGroupTable.organizationId, organizationId),
				eq(athleteGroupTable.isActive, true),
				isNull(athleteGroupTable.archivedAt),
			),
			columns: { id: true },
		});

		if (!group) {
			logger.warn(
				{ organizationId, groupId: data.groupId },
				"Enroll failed: group not found or inactive",
			);
			return NextResponse.json(
				{ error: "Group not found or inactive" },
				{ status: 400 },
			);
		}

		// Look up existing user by email
		const existingUser = await db.query.userTable.findFirst({
			where: eq(userTable.email, data.email.toLowerCase()),
			columns: { id: true, name: true },
		});

		let athleteId: string;
		let isNewAthlete = false;
		let isNewUser = false;
		let addedToGroup = false;

		if (existingUser) {
			// User exists — check if they already have an athlete profile in this org
			const existingAthlete = await db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.userId, existingUser.id),
					eq(athleteTable.organizationId, organizationId),
					isNull(athleteTable.archivedAt),
				),
				columns: { id: true },
			});

			if (existingAthlete) {
				// Case A: User + Athlete exist → just add to group
				athleteId = existingAthlete.id;
			} else {
				// Case B: User exists but no athlete in org → create athlete + membership
				const [newAthlete] = await db
					.insert(athleteTable)
					.values({
						userId: existingUser.id,
						organizationId,
						sport: data.sport,
						birthDate: data.birthDate,
						level: data.level,
						status: AthleteStatus.active,
						phone: data.phone,
						category: data.category,
						position: data.position,
						jerseyNumber: data.jerseyNumber ?? null,
						yearsOfExperience: data.yearsOfExperience ?? null,
						parentName: data.parentName ?? null,
						parentPhone: data.parentPhone ?? null,
						parentEmail: data.parentEmail ?? null,
						parentRelationship: data.parentRelationship ?? null,
						parentalConsentAt: data.parentalConsent ? new Date() : null,
						termsAcceptedAt: new Date(),
						medicalFitnessConfirmedAt: new Date(),
					})
					.returning({ id: athleteTable.id });

				if (!newAthlete) {
					return NextResponse.json(
						{ error: "Failed to create athlete" },
						{ status: 500 },
					);
				}

				athleteId = newAthlete.id;
				isNewAthlete = true;

				// Ensure user is member of the org
				await db
					.insert(memberTable)
					.values({
						organizationId,
						userId: existingUser.id,
						role: MemberRole.member,
					})
					.onConflictDoNothing();

				logger.info(
					{
						userId: existingUser.id,
						athleteId,
						organizationId,
					},
					"Created athlete for existing user via enrollment",
				);
			}
		} else if (data.createAccount) {
			// Case C1: No user → create user + account (invitation mode) + athlete
			const { hashPassword } = await import("better-auth/crypto");

			let hashedPassword: string;
			let sendPasswordReset = false;

			if (data.password) {
				hashedPassword = await hashPassword(data.password);
			} else {
				// Invitation mode: placeholder password, user sets their own via reset
				hashedPassword = await hashPassword(
					`INVITATION_PENDING_${Date.now()}_${Math.random()}`,
				);
				sendPasswordReset = true;
			}

			const [newUser] = await db
				.insert(userTable)
				.values({
					name: data.name,
					email: data.email.toLowerCase(),
					emailVerified: false,
				})
				.returning({ id: userTable.id });

			if (!newUser) {
				return NextResponse.json(
					{ error: "Failed to create user" },
					{ status: 500 },
				);
			}

			isNewUser = true;

			// Create credential account (Better Auth pattern)
			await db.insert(accountTable).values({
				userId: newUser.id,
				accountId: newUser.id,
				providerId: "credential",
				password: hashedPassword,
			});

			// Add as org member
			await db.insert(memberTable).values({
				organizationId,
				userId: newUser.id,
				role: MemberRole.member,
			});

			// Create athlete
			const [newAthlete] = await db
				.insert(athleteTable)
				.values({
					userId: newUser.id,
					organizationId,
					sport: data.sport,
					birthDate: data.birthDate,
					level: data.level,
					status: AthleteStatus.active,
					phone: data.phone,
					category: data.category,
					position: data.position,
					jerseyNumber: data.jerseyNumber ?? null,
					yearsOfExperience: data.yearsOfExperience ?? null,
					parentName: data.parentName ?? null,
					parentPhone: data.parentPhone ?? null,
					parentEmail: data.parentEmail ?? null,
					parentRelationship: data.parentRelationship ?? null,
					parentalConsentAt: data.parentalConsent ? new Date() : null,
					termsAcceptedAt: new Date(),
					medicalFitnessConfirmedAt: new Date(),
				})
				.returning({ id: athleteTable.id });

			if (!newAthlete) {
				return NextResponse.json(
					{ error: "Failed to create athlete" },
					{ status: 500 },
				);
			}

			athleteId = newAthlete.id;
			isNewAthlete = true;

			// Send password reset email if invitation mode
			if (sendPasswordReset) {
				try {
					await auth.api.requestPasswordReset({
						body: {
							email: data.email.toLowerCase(),
							redirectTo: "/auth/reset-password",
						},
					});
					logger.info(
						{ email: data.email, organizationId },
						"Sent password setup email via enrollment",
					);
				} catch (emailError) {
					logger.error(
						{ error: emailError, email: data.email },
						"Failed to send password setup email via enrollment",
					);
				}
			}

			logger.info(
				{
					userId: newUser.id,
					athleteId,
					organizationId,
					invitationMode: sendPasswordReset,
				},
				"Created new user + athlete via enrollment",
			);
		} else {
			// Case C2: No user, no account creation → athlete without userId
			const [newAthlete] = await db
				.insert(athleteTable)
				.values({
					userId: null,
					organizationId,
					sport: data.sport,
					birthDate: data.birthDate,
					level: data.level,
					status: AthleteStatus.active,
					phone: data.phone,
					category: data.category,
					position: data.position,
					jerseyNumber: data.jerseyNumber ?? null,
					yearsOfExperience: data.yearsOfExperience ?? null,
					parentName: data.parentName ?? null,
					parentPhone: data.parentPhone ?? null,
					parentEmail: data.parentEmail ?? null,
					parentRelationship: data.parentRelationship ?? null,
					parentalConsentAt: data.parentalConsent ? new Date() : null,
					termsAcceptedAt: new Date(),
					medicalFitnessConfirmedAt: new Date(),
				})
				.returning({ id: athleteTable.id });

			if (!newAthlete) {
				return NextResponse.json(
					{ error: "Failed to create athlete" },
					{ status: 500 },
				);
			}

			athleteId = newAthlete.id;
			isNewAthlete = true;

			logger.info(
				{ athleteId, organizationId, email: data.email },
				"Created athlete without user account via enrollment",
			);
		}

		// Add athlete to group (idempotent)
		const groupInsertResult = await db
			.insert(athleteGroupMemberTable)
			.values({
				groupId: data.groupId,
				athleteId,
			})
			.onConflictDoNothing()
			.returning({ id: athleteGroupMemberTable.id });

		addedToGroup = groupInsertResult.length > 0;

		logger.info(
			{
				athleteId,
				groupId: data.groupId,
				organizationId,
				addedToGroup,
				isNewAthlete,
				isNewUser,
			},
			"Enrollment completed",
		);

		return NextResponse.json({
			success: true,
			athleteId,
			isNewAthlete,
			isNewUser,
			addedToGroup,
		});
	} catch (error) {
		if (error instanceof ApiAuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.statusCode },
			);
		}

		logger.error({ error }, "Error in enrollment endpoint");
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
