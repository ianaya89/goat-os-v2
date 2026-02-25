import { db } from "@/lib/db/client";
import type { AuditAction, AuditEntityType } from "@/lib/db/schema/enums";
import { auditLogTable } from "@/lib/db/schema/tables";
import { logger } from "@/lib/logger";

export type AuditLogEntry = {
	organizationId: string;
	userId: string;
	sessionId?: string | null;
	action: AuditAction;
	entityType: AuditEntityType;
	entityId: string;
	changes?: {
		before?: Record<string, unknown>;
		after?: Record<string, unknown>;
		diff?: Record<string, { from: unknown; to: unknown }>;
	} | null;
	metadata?: {
		ipAddress?: string | null;
		userAgent?: string | null;
		impersonatedBy?: string | null;
		procedurePath?: string;
	} | null;
};

/**
 * Compute a diff between two objects, returning only the changed fields.
 */
export function computeDiff(
	before: Record<string, unknown>,
	after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
	const diff: Record<string, { from: unknown; to: unknown }> = {};

	const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

	for (const key of allKeys) {
		const oldVal = before[key];
		const newVal = after[key];

		// Skip timestamp fields that auto-update
		if (key === "updatedAt" || key === "createdAt") continue;

		if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
			diff[key] = { from: oldVal, to: newVal };
		}
	}

	return diff;
}

/**
 * Log an audit entry. Fire-and-forget: errors are logged but not thrown.
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
	try {
		await db.insert(auditLogTable).values({
			organizationId: entry.organizationId,
			userId: entry.userId,
			sessionId: entry.sessionId ?? null,
			action: entry.action,
			entityType: entry.entityType,
			entityId: entry.entityId,
			changes: entry.changes ?? null,
			metadata: entry.metadata ?? null,
		});
	} catch (error) {
		logger.error({ error, entry }, "Failed to write audit log entry");
	}
}
