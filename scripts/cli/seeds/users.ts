import { like } from "drizzle-orm";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import { ENTITY_USER, ENTITY_USER_MEMBER, seedUUID } from "./utils";

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
	"Lucas",
	"Camila",
	"Mateo",
	"Isabella",
	"Nicolás",
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
	"Romero",
	"Torres",
	"Díaz",
	"Alvarez",
	"Ruiz",
	"Gómez",
	"Castro",
];

export async function seedUsers(
	db: any,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	// Check for existing seed users
	const existingUsers = await db.query.userTable.findMany({
		where: like(schema.userTable.email, "user%@seed.goat-os.local"),
	});

	if (existingUsers.length >= count) {
		return existingUsers.slice(0, count).map((u: any) => u.id);
	}

	const existingEmails = new Set(existingUsers.map((u: any) => u.email));
	const users: Array<typeof schema.userTable.$inferInsert> = [];
	const members: Array<typeof schema.memberTable.$inferInsert> = [];
	const userIds: string[] = existingUsers.map((u: any) => u.id);

	for (let i = 0; i < count; i++) {
		const email = `user${i + 1}@seed.goat-os.local`;
		if (existingEmails.has(email)) continue;

		const firstName = firstNames[i % firstNames.length];
		const lastName = lastNames[i % lastNames.length];
		const name = `${firstName} ${lastName}`;
		const userId = seedUUID(ENTITY_USER, i + 1);

		users.push({
			id: userId,
			name,
			email,
			emailVerified: true,
			role: "user",
			onboardingComplete: true,
		});

		members.push({
			id: seedUUID(ENTITY_USER_MEMBER, i + 1),
			organizationId: context.organizationId,
			userId,
			role: "member",
		});

		userIds.push(userId);
	}

	if (users.length > 0) {
		await db.insert(schema.userTable).values(users).onConflictDoNothing();
		await db.insert(schema.memberTable).values(members).onConflictDoNothing();
	}

	return userIds;
}
