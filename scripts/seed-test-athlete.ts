/**
 * Quick script to seed test athlete data
 * Run with: npx tsx scripts/seed-test-athlete.ts
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
	athleteGroupMemberTable,
	athleteGroupTable,
	athleteTable,
	eventPricingTierTable,
	eventRegistrationTable,
	sportsEventTable,
	trainingPaymentTable,
	trainingSessionTable,
} from "../lib/db/schema/tables";

const TEST_USER_ID = "cbe9bb3b-fa33-4c4f-9818-12984709ea11";
const ORG_ID = "20000000-0000-4000-8000-000000000001";

async function main() {
	console.log("🏃 Seeding test athlete data...");

	// Find the athlete profile for this user
	const athlete = await db.query.athleteTable.findFirst({
		where: and(
			eq(athleteTable.userId, TEST_USER_ID),
			eq(athleteTable.organizationId, ORG_ID),
		),
	});

	if (!athlete) {
		console.log("❌ Test athlete not found.");
		process.exit(1);
	}

	console.log(`✅ Found athlete: ${athlete.id}`);

	// Get existing groups
	const groups = await db.query.athleteGroupTable.findMany({
		where: eq(athleteGroupTable.organizationId, ORG_ID),
		limit: 3,
	});

	if (groups.length === 0) {
		console.log("❌ No groups found. Run general seed first.");
		process.exit(1);
	}

	// Add athlete to groups if not already a member
	for (const group of groups) {
		const existingMembership = await db.query.athleteGroupMemberTable.findFirst(
			{
				where: and(
					eq(athleteGroupMemberTable.groupId, group.id),
					eq(athleteGroupMemberTable.athleteId, athlete.id),
				),
			},
		);

		if (!existingMembership) {
			await db.insert(athleteGroupMemberTable).values({
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
		where: eq(trainingSessionTable.organizationId, ORG_ID),
		limit: 10,
	});

	// Create some payments for the athlete
	const existingPayments = await db.query.trainingPaymentTable.findMany({
		where: and(
			eq(trainingPaymentTable.athleteId, athlete.id),
			eq(trainingPaymentTable.organizationId, ORG_ID),
		),
	});

	if (existingPayments.length === 0 && sessions.length > 0) {
		const statuses = ["paid", "paid", "paid", "pending", "pending"] as const;

		for (let i = 0; i < Math.min(5, sessions.length); i++) {
			const session = sessions[i];
			if (!session) continue;
			const status = statuses[i] ?? "pending";
			await db.insert(trainingPaymentTable).values({
				organizationId: ORG_ID,
				athleteId: athlete.id,
				sessionId: session.id,
				amount: 5000 + i * 1000,
				currency: "ARS",
				status,
				description: `Pago sesión ${session.title}`,
				paidAmount: status === "paid" ? 5000 + i * 1000 : 0,
			});
		}
		console.log(`✅ Created ${Math.min(5, sessions.length)} payments`);
	} else {
		console.log(`⏭️ Athlete already has ${existingPayments.length} payments`);
	}

	// Check for event registrations
	const events = await db.query.sportsEventTable.findMany({
		where: eq(sportsEventTable.organizationId, ORG_ID),
		limit: 3,
	});

	if (events.length > 0) {
		for (let i = 0; i < events.length; i++) {
			const event = events[i];
			if (!event) continue;

			const existingRegistration =
				await db.query.eventRegistrationTable.findFirst({
					where: and(
						eq(eventRegistrationTable.eventId, event.id),
						eq(eventRegistrationTable.athleteId, athlete.id),
					),
				});

			if (!existingRegistration) {
				// Get the next registration number for this event
				const lastReg = await db.query.eventRegistrationTable.findFirst({
					where: eq(eventRegistrationTable.eventId, event.id),
					orderBy: (t, { desc }) => [desc(t.registrationNumber)],
				});
				const nextRegNumber = (lastReg?.registrationNumber ?? 0) + 1;

				// Get pricing from the first tier (or use default)
				const pricingTier = await db.query.eventPricingTierTable.findFirst({
					where: eq(eventPricingTierTable.eventId, event.id),
				});
				const price = pricingTier?.price ?? 10000; // Default 10000 centavos

				await db.insert(eventRegistrationTable).values({
					eventId: event.id,
					athleteId: athlete.id,
					organizationId: ORG_ID,
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
	process.exit(0);
}

main().catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
