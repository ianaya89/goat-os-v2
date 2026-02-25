import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { auditLogTable, db, organizationTable, userTable } from "@/lib/db";
import { adminListAuditLogsSchema } from "@/schemas/audit-log-schemas";
import { createTRPCRouter, protectedAdminProcedure } from "@/trpc/init";

export const adminAuditLogRouter = createTRPCRouter({
	list: protectedAdminProcedure
		.input(adminListAuditLogsSchema)
		.query(async ({ input }) => {
			const conditions: SQL[] = [];

			if (input.organizationId) {
				conditions.push(eq(auditLogTable.organizationId, input.organizationId));
			}
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

			const where = conditions.length > 0 ? and(...conditions) : undefined;

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
						organizationId: auditLogTable.organizationId,
						organizationName: organizationTable.name,
					})
					.from(auditLogTable)
					.leftJoin(userTable, eq(auditLogTable.userId, userTable.id))
					.leftJoin(
						organizationTable,
						eq(auditLogTable.organizationId, organizationTable.id),
					)
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
});
