import { eq, like } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import {
	ENTITY_ATHLETE,
	ENTITY_ATHLETE_MEMBER,
	ENTITY_ATHLETE_USER,
	seedUUID,
} from "./utils";

const sports = [
	"Fútbol",
	"Basketball",
	"Volleyball",
	"Tennis",
	"Hockey",
	"Rugby",
];
const positions = [
	"Arquero",
	"Defensor",
	"Mediocampista",
	"Delantero",
	"Lateral",
	"Central",
];
const nationalities = [
	"Argentina",
	"Uruguay",
	"Chile",
	"Brasil",
	"Paraguay",
	"Colombia",
];
const levels = ["beginner", "intermediate", "advanced", "elite"] as const;
const dominantSides = ["right", "left", "both"] as const;
const firstNames = [
	"Juan",
	"María",
	"Carlos",
	"Ana",
	"Pedro",
	"Laura",
	"Diego",
	"Sofía",
	"Martín",
	"Valentina",
];
const lastNames = [
	"González",
	"Rodríguez",
	"Martínez",
	"López",
	"Fernández",
	"García",
	"Pérez",
	"Sánchez",
];

// Generate deterministic birth date from index
function seedBirthDate(index: number): Date {
	const baseYear = 2005;
	const year = baseYear + (index % 10);
	const month = index % 12;
	const day = 1 + (index % 28);
	return new Date(year, month, day);
}

export async function seedAthletes(
	db: DrizzleClient,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	// Check for existing seed athletes
	const existingAthletes = await db.query.athleteTable.findMany({
		where: eq(schema.athleteTable.organizationId, context.organizationId),
	});

	const existingUserEmails = await db.query.userTable.findMany({
		where: like(schema.userTable.email, "athlete%@seed.goat-os.local"),
	});

	if (existingAthletes.length >= count) {
		return existingAthletes.slice(0, count).map((a: any) => a.id);
	}

	const existingEmails = new Set(existingUserEmails.map((u: any) => u.email));
	const athletes: Array<typeof schema.athleteTable.$inferInsert> = [];
	const users: Array<typeof schema.userTable.$inferInsert> = [];
	const members: Array<typeof schema.memberTable.$inferInsert> = [];
	const athleteIds: string[] = existingAthletes.map((a: any) => a.id);

	for (let i = 0; i < count; i++) {
		const email = `athlete${i + 1}@seed.goat-os.local`;
		if (existingEmails.has(email)) continue;

		const firstName = firstNames[i % firstNames.length];
		const lastName = lastNames[i % lastNames.length];
		const birthDate = seedBirthDate(i);
		const athleteId = seedUUID(ENTITY_ATHLETE, i + 1);
		const userId = seedUUID(ENTITY_ATHLETE_USER, i + 1);

		users.push({
			id: userId,
			name: `${firstName} ${lastName}`,
			email,
			emailVerified: true,
			role: "user",
			onboardingComplete: true,
		});

		members.push({
			id: seedUUID(ENTITY_ATHLETE_MEMBER, i + 1),
			organizationId: context.organizationId,
			userId,
			role: "member",
		});

		athletes.push({
			id: athleteId,
			organizationId: context.organizationId,
			userId,
			sport: sports[i % sports.length] ?? "football",
			birthDate,
			level: levels[i % levels.length] ?? "intermediate",
			status: "active",
			height: 140 + (i % 60),
			weight: 40000 + i * 1000,
			dominantFoot: dominantSides[i % dominantSides.length] ?? "right",
			nationality: nationalities[i % nationalities.length] ?? "AR",
			position: positions[i % positions.length] ?? "midfielder",
			jerseyNumber: (i % 99) + 1,
			yearsOfExperience: i % 10,
		});

		athleteIds.push(athleteId);
	}

	if (users.length > 0) {
		await db.insert(schema.userTable).values(users).onConflictDoNothing();
		await db.insert(schema.memberTable).values(members).onConflictDoNothing();
		await db.insert(schema.athleteTable).values(athletes).onConflictDoNothing();
	}

	return athleteIds;
}
