/**
 * Seed data for test athlete user
 * User ID: cbe9bb3b-fa33-4c4f-9818-12984709ea11
 */
import { and, eq } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";

const TEST_USER_ID = "cbe9bb3b-fa33-4c4f-9818-12984709ea11";

export async function seedTestAthlete(
	db: DrizzleClient,
	context: SeedContext,
): Promise<void> {
	console.log("🏃 Seeding test athlete data...");

	// Find the athlete profile for this user
	const athlete = await db.query.athleteTable.findFirst({
		where: and(
			eq(schema.athleteTable.userId, TEST_USER_ID),
			eq(schema.athleteTable.organizationId, context.organizationId),
		),
	});

	if (!athlete) {
		console.log("❌ Test athlete not found. Skipping test athlete seed.");
		return;
	}

	console.log(`✅ Found athlete: ${athlete.id}`);

	// Get existing groups
	const groups = await db.query.athleteGroupTable.findMany({
		where: eq(schema.athleteGroupTable.organizationId, context.organizationId),
		limit: 3,
	});

	if (groups.length === 0) {
		console.log("❌ No groups found. Run general seed first.");
		return;
	}

	// Add athlete to groups if not already a member
	for (const group of groups) {
		const existingMembership = await db.query.athleteGroupMemberTable.findFirst(
			{
				where: and(
					eq(schema.athleteGroupMemberTable.groupId, group.id),
					eq(schema.athleteGroupMemberTable.athleteId, athlete.id),
				),
			},
		);

		if (!existingMembership) {
			await db.insert(schema.athleteGroupMemberTable).values({
				groupId: group.id,
				athleteId: athlete.id,
			});
			console.log(`✅ Added athlete to group: ${group.name}`);
		} else {
			console.log(`⏭️ Already in group: ${group.name}`);
		}
	}

	// Get sessions for these groups to create payments
	const sessions = await db.query.trainingSessionTable.findMany({
		where: eq(
			schema.trainingSessionTable.organizationId,
			context.organizationId,
		),
		limit: 10,
	});

	// Create some payments for the athlete
	const existingPayments = await db.query.trainingPaymentTable.findMany({
		where: and(
			eq(schema.trainingPaymentTable.athleteId, athlete.id),
			eq(schema.trainingPaymentTable.organizationId, context.organizationId),
		),
	});

	if (existingPayments.length === 0 && sessions.length > 0) {
		const payments: Array<typeof schema.trainingPaymentTable.$inferInsert> = [];
		const statuses = ["paid", "paid", "paid", "pending", "pending"] as const;

		for (let i = 0; i < Math.min(5, sessions.length); i++) {
			const session = sessions[i];
			if (!session) continue;
			const status = statuses[i] ?? "pending";
			payments.push({
				organizationId: context.organizationId,
				athleteId: athlete.id,
				sessionId: session.id,
				amount: 5000 + i * 1000,
				currency: "ARS",
				status,
				description: `Pago sesión ${session.title}`,
				paidAmount: status === "paid" ? 5000 + i * 1000 : 0,
			});
		}

		if (payments.length > 0) {
			await db
				.insert(schema.trainingPaymentTable)
				.values(payments)
				.onConflictDoNothing();
			console.log(`✅ Created ${payments.length} payments`);
		}
	} else {
		console.log(`⏭️ Athlete already has ${existingPayments.length} payments`);
	}

	// Directly assign athlete to some sessions (for sessions without groups)
	const sessionsWithoutGroup = await db.query.trainingSessionTable.findMany({
		where: and(
			eq(schema.trainingSessionTable.organizationId, context.organizationId),
			eq(schema.trainingSessionTable.isRecurring, false),
		),
		limit: 15,
	});

	// Add direct session assignments
	for (const session of sessionsWithoutGroup) {
		const existingAssignment =
			await db.query.trainingSessionAthleteTable.findFirst({
				where: and(
					eq(schema.trainingSessionAthleteTable.sessionId, session.id),
					eq(schema.trainingSessionAthleteTable.athleteId, athlete.id),
				),
			});

		if (!existingAssignment) {
			await db.insert(schema.trainingSessionAthleteTable).values({
				sessionId: session.id,
				athleteId: athlete.id,
			});
			console.log(`✅ Assigned to session: ${session.title}`);
		}
	}

	// Add attendance for completed sessions
	const completedSessions = sessionsWithoutGroup.filter(
		(s: { status: string }) => s.status === "completed",
	);
	for (const session of completedSessions) {
		const existingAttendance = await db.query.attendanceTable.findFirst({
			where: and(
				eq(schema.attendanceTable.sessionId, session.id),
				eq(schema.attendanceTable.athleteId, athlete.id),
			),
		});

		if (!existingAttendance) {
			await db.insert(schema.attendanceTable).values({
				sessionId: session.id,
				athleteId: athlete.id,
				status: "present",
				recordedBy: context.seedUserId,
			});
			console.log(`✅ Added attendance for: ${session.title}`);
		}
	}

	// Add some feedback for completed sessions (RPE ratings)
	const sessionsNeedingFeedback = completedSessions.slice(0, 5);
	for (let i = 0; i < sessionsNeedingFeedback.length; i++) {
		const session = sessionsNeedingFeedback[i];
		if (!session) continue;

		const existingFeedback =
			await db.query.athleteSessionFeedbackTable.findFirst({
				where: and(
					eq(schema.athleteSessionFeedbackTable.sessionId, session.id),
					eq(schema.athleteSessionFeedbackTable.athleteId, athlete.id),
				),
			});

		if (!existingFeedback) {
			const rpeRating = 5 + (i % 5); // Ratings from 5-9
			const satisfactionRating = 6 + (i % 4); // Ratings from 6-9
			const notes = i % 2 === 0 ? "Buen entrenamiento, me sentí bien" : null;

			await db.insert(schema.athleteSessionFeedbackTable).values({
				sessionId: session.id,
				athleteId: athlete.id,
				rpeRating,
				satisfactionRating,
				notes,
			});
			console.log(
				`✅ Added feedback (RPE: ${rpeRating}) for: ${session.title}`,
			);
		}
	}

	// Check for event registrations
	const events = await db.query.sportsEventTable.findMany({
		where: eq(schema.sportsEventTable.organizationId, context.organizationId),
		limit: 3,
	});

	if (events.length > 0) {
		for (const event of events) {
			const existingRegistration =
				await db.query.eventRegistrationTable.findFirst({
					where: and(
						eq(schema.eventRegistrationTable.eventId, event.id),
						eq(schema.eventRegistrationTable.athleteId, athlete.id),
					),
				});

			if (!existingRegistration) {
				// Get next registration number
				const lastReg = await db.query.eventRegistrationTable.findFirst({
					where: eq(schema.eventRegistrationTable.eventId, event.id),
					orderBy: (t, { desc }) => [desc(t.registrationNumber)],
				});
				const nextRegNumber = (lastReg?.registrationNumber ?? 0) + 1;

				// Get pricing from the first tier (or use default)
				const pricingTier = await db.query.eventPricingTierTable.findFirst({
					where: eq(schema.eventPricingTierTable.eventId, event.id),
				});
				const price = pricingTier?.price ?? 10000;

				await db.insert(schema.eventRegistrationTable).values({
					eventId: event.id,
					athleteId: athlete.id,
					organizationId: context.organizationId,
					registrationNumber: nextRegNumber,
					registrantName: "Test Athlete",
					registrantEmail: "test@athlete.local",
					status: "confirmed",
					price,
					paidAmount: price,
					currency: "ARS",
				});
				console.log(`✅ Registered for event: ${event.title}`);
			} else {
				console.log(`⏭️ Already registered for: ${event.title}`);
			}
		}
	}

	console.log("✅ Test athlete seed complete!");
}
