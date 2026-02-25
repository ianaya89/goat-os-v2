import { and, count, desc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { ApiAuthError, validateApiKey } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import { memberTable, sessionTable, userTable } from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const querySchema = z.object({
	userId: z.string().uuid().optional(),
	dateFrom: z.string().datetime().optional(),
	dateTo: z.string().datetime().optional(),
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

		const { userId, dateFrom, dateTo, limit, offset } = parsed.data;

		// Get user IDs that are members of this organization
		const members = await db.query.memberTable.findMany({
			where: eq(memberTable.organizationId, organizationId),
			columns: { userId: true },
		});
		const memberUserIds = members.map((m) => m.userId);

		if (memberUserIds.length === 0) {
			return NextResponse.json({
				data: [],
				total: 0,
				limit,
				offset,
			});
		}

		const conditions: SQL[] = [inArray(sessionTable.userId, memberUserIds)];

		if (userId) {
			conditions.push(eq(sessionTable.userId, userId));
		}
		if (dateFrom) {
			conditions.push(gte(sessionTable.createdAt, new Date(dateFrom)));
		}
		if (dateTo) {
			conditions.push(lte(sessionTable.createdAt, new Date(dateTo)));
		}

		const where = and(...conditions);

		const [sessions, totalResult] = await Promise.all([
			db
				.select({
					id: sessionTable.id,
					userId: sessionTable.userId,
					userName: userTable.name,
					userEmail: userTable.email,
					userImage: userTable.image,
					ipAddress: sessionTable.ipAddress,
					userAgent: sessionTable.userAgent,
					createdAt: sessionTable.createdAt,
					updatedAt: sessionTable.updatedAt,
					expiresAt: sessionTable.expiresAt,
				})
				.from(sessionTable)
				.leftJoin(userTable, eq(sessionTable.userId, userTable.id))
				.where(where)
				.orderBy(desc(sessionTable.createdAt))
				.limit(limit)
				.offset(offset),
			db.select({ count: count() }).from(sessionTable).where(where),
		]);

		return NextResponse.json({
			data: sessions,
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
		logger.error({ error }, "Failed to fetch sessions");
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
