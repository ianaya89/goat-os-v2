import { eq, like } from "drizzle-orm";
import type { DrizzleClient } from "@/lib/db/types";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import {
	ENTITY_COACH,
	ENTITY_COACH_MEMBER,
	ENTITY_COACH_USER,
	seedUUID,
} from "./utils";

const specialties = [
	"Preparación Física",
	"Técnica Individual",
	"Táctica Grupal",
	"Arqueros",
	"Formación Juvenil",
	"Alto Rendimiento",
	"Rehabilitación",
	"Nutrición Deportiva",
];

const bios = [
	"Entrenador con más de 10 años de experiencia en formación de juveniles.",
	"Especialista en desarrollo de talentos y técnica individual.",
	"Ex jugador profesional con enfoque en táctica y estrategia.",
	"Licenciado en Educación Física con posgrado en Alto Rendimiento.",
	"Preparador físico certificado FIFA.",
];

const firstNames = [
	"Roberto",
	"Marcelo",
	"Gabriel",
	"Fernando",
	"Alejandro",
	"Oscar",
	"Daniel",
	"Ricardo",
];
const lastNames = [
	"Bianchi",
	"Gallardo",
	"Gareca",
	"Almeyda",
	"Heinze",
	"Tabarez",
	"Scaloni",
	"Sampaoli",
];

export async function seedCoaches(
	db: DrizzleClient,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	// Check for existing seed coaches
	const existingCoaches = await db.query.coachTable.findMany({
		where: eq(schema.coachTable.organizationId, context.organizationId),
	});

	const existingUserEmails = await db.query.userTable.findMany({
		where: like(schema.userTable.email, "coach%@seed.goat-os.local"),
	});

	if (existingCoaches.length >= count) {
		return existingCoaches.slice(0, count).map((c: any) => c.id);
	}

	const existingEmails = new Set(existingUserEmails.map((u: any) => u.email));
	const coaches: Array<typeof schema.coachTable.$inferInsert> = [];
	const users: Array<typeof schema.userTable.$inferInsert> = [];
	const members: Array<typeof schema.memberTable.$inferInsert> = [];
	const coachIds: string[] = existingCoaches.map((c: any) => c.id);

	for (let i = 0; i < count; i++) {
		const email = `coach${i + 1}@seed.goat-os.local`;
		if (existingEmails.has(email)) continue;

		const firstName = firstNames[i % firstNames.length];
		const lastName = lastNames[i % lastNames.length];
		const coachId = seedUUID(ENTITY_COACH, i + 1);
		const userId = seedUUID(ENTITY_COACH_USER, i + 1);

		users.push({
			id: userId,
			name: `${firstName} ${lastName}`,
			email,
			emailVerified: true,
			role: "user",
			onboardingComplete: true,
		});

		members.push({
			id: seedUUID(ENTITY_COACH_MEMBER, i + 1),
			organizationId: context.organizationId,
			userId,
			role: "staff",
		});

		coaches.push({
			id: coachId,
			organizationId: context.organizationId,
			userId,
			specialty: specialties[i % specialties.length] ?? "fitness",
			bio: bios[i % bios.length] ?? "Entrenador profesional",
			status: "active",
		});

		coachIds.push(coachId);
	}

	if (users.length > 0) {
		await db.insert(schema.userTable).values(users).onConflictDoNothing();
		await db.insert(schema.memberTable).values(members).onConflictDoNothing();
		await db.insert(schema.coachTable).values(coaches).onConflictDoNothing();
	}

	return coachIds;
}
