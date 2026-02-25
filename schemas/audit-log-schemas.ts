import { z } from "zod/v4";
import { AuditAction, AuditEntityType } from "@/lib/db/schema/enums";

export const listAuditLogsSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
	action: z.nativeEnum(AuditAction).optional(),
	entityType: z.nativeEnum(AuditEntityType).optional(),
	userId: z.string().uuid().optional(),
	dateFrom: z.date().optional(),
	dateTo: z.date().optional(),
});
export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;

export const getAuditLogSchema = z.object({
	id: z.string().uuid(),
});
export type GetAuditLogInput = z.infer<typeof getAuditLogSchema>;

export const adminListAuditLogsSchema = listAuditLogsSchema.extend({
	organizationId: z.string().uuid().optional(),
});
export type AdminListAuditLogsInput = z.infer<typeof adminListAuditLogsSchema>;
