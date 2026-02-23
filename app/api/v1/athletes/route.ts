import {
	and,
	count,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
	or,
	type SQL,
} from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { ApiAuthError, validateApiKey } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import type { AthleteStatus } from "@/lib/db/schema/enums";
import {
	athleteGroupMemberTable,
	athleteTable,
	userTable,
} from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const querySchema = z.object({
	query: z.string().optional(),
	status: z.string().optional(),
	groupId: z.string().uuid().optional(),
	limit: z.coerce.number().min(1).max(100).default(50),
	offset: z.coerce.number().min(0).default(0),
});

export async function GET(request: Request) {
	try {
		const { organizationId } = validateApiKey(request);

		const url = new URL(request.url);
		const params = Object.fromEntries(url.searchParams.entries());
		const parsed = querySchema.safeParse(params);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid query parameters", details: parsed.error.issues },
				{ status: 400 },
			);
		}

		const { query, status, groupId, limit, offset } = parsed.data;

		const conditions: SQL[] = [
			eq(athleteTable.organizationId, organizationId),
			isNull(athleteTable.archivedAt),
		];

		if (status) {
			conditions.push(eq(athleteTable.status, status as AthleteStatus));
		}

		if (query) {
			// Search by user name or email - find matching user IDs first
			const searchPattern = `%${query}%`;
			const matchingUsers = await db.query.userTable.findMany({
				where: or(
					ilike(userTable.name, searchPattern),
					ilike(userTable.email, searchPattern),
				),
				columns: { id: true },
			});
			const userIds = matchingUsers.map((u) => u.id);

			if (userIds.length > 0) {
				conditions.push(inArray(athleteTable.userId, userIds));
			} else {
				// No matching users, return empty
				return NextResponse.json({
					data: [],
					total: 0,
					limit,
					offset,
				});
			}
		}

		if (groupId) {
			const groupMembers = await db.query.athleteGroupMemberTable.findMany({
				where: eq(athleteGroupMemberTable.groupId, groupId),
				columns: { athleteId: true },
			});
			const athleteIds = groupMembers.map((m) => m.athleteId);
			if (athleteIds.length > 0) {
				conditions.push(inArray(athleteTable.id, athleteIds));
			} else {
				return NextResponse.json({
					data: [],
					total: 0,
					limit,
					offset,
				});
			}
		}

		const whereCondition = and(...conditions);

		const [athletes, totalResult] = await Promise.all([
			db.query.athleteTable.findMany({
				where: whereCondition,
				limit,
				offset,
				orderBy: [desc(athleteTable.createdAt)],
				with: {
					user: {
						columns: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
					groupMemberships: {
						with: {
							group: { columns: { id: true, name: true } },
						},
					},
				},
			}),
			db.select({ count: count() }).from(athleteTable).where(whereCondition),
		]);

		// Transform groupMemberships to groups for cleaner API response
		const transformedAthletes = athletes.map(
			({ groupMemberships, ...athlete }) => ({
				...athlete,
				groups: groupMemberships.map((m) => m.group),
			}),
		);

		return NextResponse.json({
			data: transformedAthletes,
			total: totalResult[0]?.count ?? 0,
			limit,
			offset,
		});
	} catch (error) {
		if (error instanceof ApiAuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.statusCode },
			);
		}
		logger.error({ error }, "Failed to fetch athletes");
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
