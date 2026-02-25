import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { ApiAuthError, validateApiKey } from "@/lib/api/auth";
import { db } from "@/lib/db/client";
import {
	type AuditAction,
	AuditActions,
	type AuditEntityType,
	AuditEntityTypes,
} from "@/lib/db/schema/enums";
import { auditLogTable, userTable } from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const querySchema = z.object({
	action: z
		.string()
		.refine((v) => AuditActions.includes(v as AuditAction))
		.optional(),
	entityType: z
		.string()
		.refine((v) => AuditEntityTypes.includes(v as AuditEntityType))
		.optional(),
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

		const { action, entityType, userId, dateFrom, dateTo, limit, offset } =
			parsed.data;

		const conditions: SQL[] = [
			eq(auditLogTable.organizationId, organizationId),
		];

		if (action) {
			conditions.push(eq(auditLogTable.action, action as AuditAction));
		}
		if (entityType) {
			conditions.push(
				eq(auditLogTable.entityType, entityType as AuditEntityType),
			);
		}
		if (userId) {
			conditions.push(eq(auditLogTable.userId, userId));
		}
		if (dateFrom) {
			conditions.push(gte(auditLogTable.createdAt, new Date(dateFrom)));
		}
		if (dateTo) {
			conditions.push(lte(auditLogTable.createdAt, new Date(dateTo)));
		}

		const where = and(...conditions);

		const [logs, totalResult] = await Promise.all([
			db
				.select({
					id: auditLogTable.id,
					action: auditLogTable.action,
					entityType: auditLogTable.entityType,
					entityId: auditLogTable.entityId,
					changes: auditLogTable.changes,
					metadata: auditLogTable.metadata,
					createdAt: auditLogTable.createdAt,
					userId: auditLogTable.userId,
					userName: userTable.name,
					userEmail: userTable.email,
				})
				.from(auditLogTable)
				.leftJoin(userTable, eq(auditLogTable.userId, userTable.id))
				.where(where)
				.orderBy(desc(auditLogTable.createdAt))
				.limit(limit)
				.offset(offset),
			db.select({ count: count() }).from(auditLogTable).where(where),
		]);

		return NextResponse.json({
			data: logs,
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
		logger.error({ error }, "Failed to fetch audit logs");
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
