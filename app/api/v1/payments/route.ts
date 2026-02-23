import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { ApiAuthError, validateApiKey } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import type { TrainingPaymentStatus } from "@/lib/db/schema/enums";
import { trainingPaymentTable } from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const querySchema = z.object({
	from: z.coerce.date().optional(),
	to: z.coerce.date().optional(),
	status: z.string().optional(),
	athleteId: z.string().uuid().optional(),
	sessionId: z.string().uuid().optional(),
	type: z.enum(["training", "event"]).optional(),
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

		const { from, to, status, athleteId, sessionId, type, limit, offset } =
			parsed.data;

		const conditions: SQL[] = [
			eq(trainingPaymentTable.organizationId, organizationId),
		];

		if (status) {
			conditions.push(
				eq(trainingPaymentTable.status, status as TrainingPaymentStatus),
			);
		}

		if (athleteId) {
			conditions.push(eq(trainingPaymentTable.athleteId, athleteId));
		}

		if (sessionId) {
			conditions.push(eq(trainingPaymentTable.sessionId, sessionId));
		}

		if (type) {
			conditions.push(eq(trainingPaymentTable.type, type));
		}

		if (from) {
			conditions.push(gte(trainingPaymentTable.paymentDate, from));
		}

		if (to) {
			conditions.push(lte(trainingPaymentTable.paymentDate, to));
		}

		const whereCondition = and(...conditions);

		const [payments, totalResult] = await Promise.all([
			db.query.trainingPaymentTable.findMany({
				where: whereCondition,
				limit,
				offset,
				orderBy: [desc(trainingPaymentTable.createdAt)],
				with: {
					athlete: {
						with: {
							user: {
								columns: { id: true, name: true, email: true, image: true },
							},
						},
					},
					session: {
						columns: { id: true, title: true, startTime: true },
					},
					service: {
						columns: { id: true, name: true, currentPrice: true },
					},
					recordedByUser: { columns: { id: true, name: true } },
				},
			}),
			db
				.select({ count: count() })
				.from(trainingPaymentTable)
				.where(whereCondition),
		]);

		return NextResponse.json({
			data: payments,
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
		logger.error({ error }, "Failed to fetch payments");
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
