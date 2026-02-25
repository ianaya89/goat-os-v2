import { createTRPCRouter } from "@/trpc/init";
import { adminAuditLogRouter } from "@/trpc/routers/admin/admin-audit-log-router";
import { adminOrganizationRouter } from "@/trpc/routers/admin/admin-organization-router";
import { adminUserRouter } from "@/trpc/routers/admin/admin-user-router";

export const adminRouter = createTRPCRouter({
	auditLog: adminAuditLogRouter,
	organization: adminOrganizationRouter,
	user: adminUserRouter,
});
