import { randomUUID } from "node:crypto";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";

const orgNames = [
	"Club Atlético Tigre",
	"Academia Deportiva Elite",
	"Escuela de Fútbol Pro",
	"Club Social y Deportivo Norte",
	"Centro de Alto Rendimiento",
	"Instituto Deportivo Sur",
	"Club Atlético Platense",
	"Academia de Formación Integral",
	"Escuela de Talentos",
	"Club Deportivo Central",
];

const timezones = [
	"America/Argentina/Buenos_Aires",
	"America/Argentina/Cordoba",
	"America/Montevideo",
	"America/Santiago",
	"America/Sao_Paulo",
];

export async function seedOrganizations(
	db: any,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	const organizations: Array<typeof schema.organizationTable.$inferInsert> = [];
	const members: Array<typeof schema.memberTable.$inferInsert> = [];

	const timestamp = Date.now().toString(36);

	for (let i = 0; i < count; i++) {
		const id = randomUUID();
		const name = `${orgNames[i % orgNames.length]} ${i + 1}`;
		const slug = `${name
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "")}-${timestamp}`;

		organizations.push({
			id,
			name,
			slug,
			timezone: timezones[Math.floor(Math.random() * timezones.length)],
		});

		// Create owner membership if we have users
		if (context.userIds.length > 0) {
			const ownerId = context.userIds[i % context.userIds.length];
			members.push({
				id: randomUUID(),
				organizationId: id,
				userId: ownerId,
				role: "owner",
			});
		}
	}

	await db.insert(schema.organizationTable).values(organizations);

	if (members.length > 0) {
		await db.insert(schema.memberTable).values(members);
	}

	return organizations.map((o) => o.id as string);
}
