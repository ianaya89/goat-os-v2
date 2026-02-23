import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { ApiAuthError, validateApiKey } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import type { ExpenseCategory } from "@/lib/db/schema/enums";
import { expenseTable } from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const querySchema = z.object({
	from: z.coerce.date().optional(),
	to: z.coerce.date().optional(),
	category: z.string().optional(),
	categoryId: z.string().uuid().optional(),
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

		const { from, to, category, categoryId, limit, offset } = parsed.data;

		const conditions: SQL[] = [eq(expenseTable.organizationId, organizationId)];

		if (category) {
			conditions.push(eq(expenseTable.category, category as ExpenseCategory));
		}

		if (categoryId) {
			conditions.push(eq(expenseTable.categoryId, categoryId));
		}

		if (from) {
			conditions.push(gte(expenseTable.expenseDate, from));
		}

		if (to) {
			conditions.push(lte(expenseTable.expenseDate, to));
		}

		const whereCondition = and(...conditions);

		const [expenses, totalResult] = await Promise.all([
			db.query.expenseTable.findMany({
				where: whereCondition,
				limit,
				offset,
				orderBy: [desc(expenseTable.expenseDate)],
				with: {
					categoryRef: { columns: { id: true, name: true, type: true } },
					recordedByUser: { columns: { id: true, name: true } },
					event: { columns: { id: true, title: true } },
				},
			}),
			db.select({ count: count() }).from(expenseTable).where(whereCondition),
		]);

		return NextResponse.json({
			data: expenses,
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
		logger.error({ error }, "Failed to fetch expenses");
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
