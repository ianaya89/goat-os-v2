import { initTRPC } from "@trpc/server";
import { computeDiff, logAudit } from "@/lib/audit";
import type { AuditAction, AuditEntityType } from "@/lib/db/schema/enums";
import { logger } from "@/lib/logger";
import type { Context } from "@/trpc/context";

const t = initTRPC.context<Context>().create();

type AuditMiddlewareConfig<TResult = unknown> = {
	entityType: AuditEntityType;
	action: AuditAction;
	/**
	 * Extract the entity ID from the mutation result.
	 * For bulk operations, return comma-separated IDs.
	 */
	getEntityId: (result: TResult, input: unknown) => string;
	/**
	 * Optional: extract "after" snapshot from the result for diff tracking.
	 */
	getAfter?: (result: TResult) => Record<string, unknown> | undefined;
	/**
	 * Optional: extract "before" snapshot. If provided, a diff will be computed.
	 * Typically set in the mutation itself by attaching to ctx.
	 */
	getBefore?: (ctx: unknown) => Record<string, unknown> | undefined;
};

/**
 * Creates a tRPC middleware that logs audit entries after successful mutations.
 * Fire-and-forget: audit failures don't affect the mutation response.
 */
export function createAuditMiddleware<TResult = unknown>(
	config: AuditMiddlewareConfig<TResult>,
) {
	return t.middleware(async ({ ctx, next, path, input }) => {
		const result = await next();

		// Only audit successful mutations
		if (!result.ok) return result;

		// Extract organization context (set by protectedOrganizationProcedure)
		const orgCtx = ctx as {
			organization?: { id: string };
			user?: { id: string };
			session?: { id: string; impersonatedBy?: string | null };
			ip?: string | null;
			userAgent?: string | null;
		};

		if (!orgCtx.organization?.id || !orgCtx.user?.id) {
			return result;
		}

		try {
			const data = (result as { data: TResult }).data;
			const entityId = config.getEntityId(data, input);

			let changes:
				| {
						before?: Record<string, unknown>;
						after?: Record<string, unknown>;
						diff?: Record<string, { from: unknown; to: unknown }>;
				  }
				| undefined;

			const after = config.getAfter?.(data);
			const before = config.getBefore?.(ctx);

			if (before || after) {
				changes = {};
				if (before) changes.before = before;
				if (after) changes.after = after;
				if (before && after) {
					changes.diff = computeDiff(before, after);
				}
			}

			// Fire-and-forget
			logAudit({
				organizationId: orgCtx.organization.id,
				userId: orgCtx.user.id,
				sessionId: orgCtx.session?.id,
				action: config.action,
				entityType: config.entityType,
				entityId,
				changes,
				metadata: {
					ipAddress: orgCtx.ip,
					userAgent: orgCtx.userAgent,
					impersonatedBy: orgCtx.session?.impersonatedBy,
					procedurePath: path,
				},
			}).catch((error) => {
				logger.error({ error, path }, "Audit middleware failed");
			});
		} catch (error) {
			logger.error({ error, path }, "Audit middleware extraction failed");
		}

		return result;
	});
}
