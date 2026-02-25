import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { auditLogTable, db, userTable } from "@/lib/db";
import {
	getAuditLogSchema,
	listAuditLogsSchema,
} from "@/schemas/audit-log-schemas";
import { createTRPCRouter, protectedOrgAdminProcedure } from "@/trpc/init";

export const organizationAuditLogRouter = createTRPCRouter({
	list: protectedOrgAdminProcedure
		.input(listAuditLogsSchema)
		.query(async ({ ctx, input }) => {
			const conditions: SQL[] = [
				eq(auditLogTable.organizationId, ctx.organization.id),
			];

			if (input.action) {
				conditions.push(eq(auditLogTable.action, input.action));
			}
			if (input.entityType) {
				conditions.push(eq(auditLogTable.entityType, input.entityType));
			}
			if (input.userId) {
				conditions.push(eq(auditLogTable.userId, input.userId));
			}
			if (input.dateFrom) {
				conditions.push(gte(auditLogTable.createdAt, input.dateFrom));
			}
			if (input.dateTo) {
				conditions.push(lte(auditLogTable.createdAt, input.dateTo));
			}

			const where = and(...conditions);

			const [logs, [total]] = await Promise.all([
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
						userImage: userTable.image,
					})
					.from(auditLogTable)
					.leftJoin(userTable, eq(auditLogTable.userId, userTable.id))
					.where(where)
					.orderBy(desc(auditLogTable.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				db.select({ count: count() }).from(auditLogTable).where(where),
			]);

			return {
				logs,
				total: total?.count ?? 0,
			};
		}),

	get: protectedOrgAdminProcedure
		.input(getAuditLogSchema)
		.query(async ({ ctx, input }) => {
			const [log] = await db
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
					userImage: userTable.image,
				})
				.from(auditLogTable)
				.leftJoin(userTable, eq(auditLogTable.userId, userTable.id))
				.where(
					and(
						eq(auditLogTable.id, input.id),
						eq(auditLogTable.organizationId, ctx.organization.id),
					),
				)
				.limit(1);

			return log ?? null;
		}),
});
