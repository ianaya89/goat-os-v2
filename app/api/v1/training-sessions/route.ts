import { and, asc, count, eq, gte, lte, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { ApiAuthError, validateApiKey } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import type { TrainingSessionStatus } from "@/lib/db/schema/enums";
import { trainingSessionTable } from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const querySchema = z.object({
	from: z.coerce.date(),
	to: z.coerce.date(),
	status: z.string().optional(),
	athleteGroupId: z.string().uuid().optional(),
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

		const { from, to, status, athleteGroupId, limit, offset } = parsed.data;

		const conditions: SQL[] = [
			eq(trainingSessionTable.organizationId, organizationId),
			gte(trainingSessionTable.startTime, from),
			lte(trainingSessionTable.startTime, to),
		];

		if (status) {
			conditions.push(
				eq(trainingSessionTable.status, status as TrainingSessionStatus),
			);
		}

		if (athleteGroupId) {
			conditions.push(eq(trainingSessionTable.athleteGroupId, athleteGroupId));
		}

		const whereCondition = and(...conditions);

		const [sessions, totalResult] = await Promise.all([
			db.query.trainingSessionTable.findMany({
				where: whereCondition,
				limit,
				offset,
				orderBy: [asc(trainingSessionTable.startTime)],
				with: {
					location: { columns: { id: true, name: true, color: true } },
					athleteGroup: { columns: { id: true, name: true } },
					service: {
						columns: {
							id: true,
							name: true,
							currentPrice: true,
							currency: true,
						},
					},
					coaches: {
						with: {
							coach: {
								with: {
									user: { columns: { id: true, name: true, image: true } },
								},
							},
						},
					},
					athletes: {
						with: {
							athlete: {
								with: {
									user: { columns: { id: true, name: true, image: true } },
								},
							},
						},
					},
				},
			}),
			db
				.select({ count: count() })
				.from(trainingSessionTable)
				.where(whereCondition),
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
		logger.error({ error }, "Failed to fetch training sessions");
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
