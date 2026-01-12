import { eq } from "drizzle-orm";
import type { SeedContext } from "../commands/seed";
import { schema } from "../db";
import { ENTITY_GROUP, ENTITY_GROUP_MEMBER, seedUUID } from "./utils";

const groupNames = [
	"Sub-12",
	"Sub-14",
	"Sub-16",
	"Sub-18",
	"Primera División",
	"Reserva",
	"Femenino A",
	"Femenino B",
	"Equipo Especial",
	"Preselección Nacional",
];

const descriptions = [
	"Categoría formativa para jugadores en desarrollo",
	"Grupo de alto rendimiento con enfoque competitivo",
	"Equipo en preparación para torneos regionales",
	"Selección de talentos destacados",
];

export async function seedAthleteGroups(
	db: any,
	count: number,
	context: SeedContext,
): Promise<string[]> {
	// Check for existing seed groups
	const existingGroups = await db.query.athleteGroupTable.findMany({
		where: eq(schema.athleteGroupTable.organizationId, context.organizationId),
	});

	if (existingGroups.length >= count) {
		return existingGroups.slice(0, count).map((g: any) => g.id);
	}

	const existingNames = new Set(existingGroups.map((g: any) => g.name));
	const groups: Array<typeof schema.athleteGroupTable.$inferInsert> = [];
	const groupIds: string[] = existingGroups.map((g: any) => g.id);

	for (let i = 0; i < count; i++) {
		const name = `${groupNames[i % groupNames.length]} #${i + 1}`;
		if (existingNames.has(name)) continue;

		const groupId = seedUUID(ENTITY_GROUP, i + 1);
		groups.push({
			id: groupId,
			organizationId: context.organizationId,
			name,
			description: descriptions[i % descriptions.length],
			isActive: true,
		});

		groupIds.push(groupId);
	}

	if (groups.length > 0) {
		await db
			.insert(schema.athleteGroupTable)
			.values(groups)
			.onConflictDoNothing();
	}

	// Add athletes to groups if we have both and no existing members
	if (context.athleteIds.length > 0 && groupIds.length > 0) {
		const existingMembers = await db.query.athleteGroupMemberTable.findMany({
			where: eq(schema.athleteGroupMemberTable.groupId, groupIds[0]),
		});

		if (existingMembers.length === 0) {
			const members: Array<typeof schema.athleteGroupMemberTable.$inferInsert> =
				[];

			for (let g = 0; g < groupIds.length; g++) {
				const groupId = groupIds[g];
				// Add deterministic athletes to each group
				const numAthletes = Math.min(5, context.athleteIds.length);

				for (let i = 0; i < numAthletes; i++) {
					const athleteIndex = (g + i) % context.athleteIds.length;
					members.push({
						id: seedUUID(ENTITY_GROUP_MEMBER, g * 100 + i + 1),
						groupId,
						athleteId: context.athleteIds[athleteIndex],
					});
				}
			}

			if (members.length > 0) {
				await db
					.insert(schema.athleteGroupMemberTable)
					.values(members)
					.onConflictDoNothing();
			}
		}
	}

	return groupIds;
}
