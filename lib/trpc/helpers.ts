import { TRPCError } from "@trpc/server";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	inArray,
	lte,
	or,
	type SQL,
} from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";

// ============================================================================
// DATE FILTER HELPERS
// ============================================================================

export type DateFilterRange = "today" | "this-week" | "this-month" | "older";

/**
 * Build date filter conditions for a column based on predefined ranges.
 */
export function buildDateFilterConditions<T extends PgColumn>(
	column: T,
	ranges: DateFilterRange[],
): SQL | null {
	if (!ranges || ranges.length === 0) return null;

	const now = new Date();
	const dateConditions = ranges
		.map((range) => {
			switch (range) {
				case "today": {
					const todayStart = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate(),
					);
					const todayEnd = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate() + 1,
					);
					return and(gte(column, todayStart), lte(column, todayEnd));
				}
				case "this-week": {
					const weekStart = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate() - now.getDay(),
					);
					return gte(column, weekStart);
				}
				case "this-month": {
					const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
					return gte(column, monthStart);
				}
				case "older": {
					const monthAgo = new Date(
						now.getFullYear(),
						now.getMonth() - 1,
						now.getDate(),
					);
					return lte(column, monthAgo);
				}
				default:
					return null;
			}
		})
		.filter((v): v is NonNullable<typeof v> => v !== null);

	if (dateConditions.length === 0) return null;
	return or(...dateConditions) ?? null;
}

// ============================================================================
// SORT HELPERS
// ============================================================================

export type SortDirection = "asc" | "desc";

/**
 * Get the sort direction function based on sort order string.
 */
export function getSortDirection(order: SortDirection | undefined) {
	return order === "desc" ? desc : asc;
}

/**
 * Build an order by clause from a column map and sort field.
 */
export function buildOrderBy<T extends string>(
	sortBy: T | undefined,
	sortOrder: SortDirection | undefined,
	columnMap: Record<T, PgColumn>,
	defaultColumn: PgColumn,
): SQL {
	const direction = getSortDirection(sortOrder);
	if (sortBy && sortBy in columnMap) {
		return direction(columnMap[sortBy]);
	}
	return direction(defaultColumn);
}

// ============================================================================
// RESOURCE HELPERS
// ============================================================================

/**
 * Find a resource by ID ensuring it belongs to the organization.
 * Throws NOT_FOUND error if not found.
 *
 * Usage:
 * ```ts
 * const athlete = await findOrgResource(
 *   schema.athleteTable,
 *   input.id,
 *   ctx.organization.id,
 *   "Athlete"
 * );
 * ```
 */
export async function findOrgResource<T>(
	table: { id: PgColumn; organizationId: PgColumn },
	resourceId: string,
	organizationId: string,
	resourceName = "Resource",
): Promise<T> {
	const [resource] = await db
		.select()
		.from(
			table as Parameters<typeof db.select>["0"] extends undefined
				? never
				: Parameters<(typeof db)["select"]>[0] extends undefined
					? never
					: any,
		)
		.where(
			and(eq(table.id, resourceId), eq(table.organizationId, organizationId)),
		)
		.limit(1);

	if (!resource) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `${resourceName} not found`,
		});
	}

	return resource as T;
}

/**
 * Verify a resource exists in the organization.
 * Throws NOT_FOUND error if not found.
 */
export async function assertOrgResourceExists(
	table: { id: PgColumn; organizationId: PgColumn },
	resourceId: string,
	organizationId: string,
	resourceName = "Resource",
): Promise<void> {
	const [resource] = await db
		.select({ id: table.id })
		.from(table as any)
		.where(
			and(eq(table.id, resourceId), eq(table.organizationId, organizationId)),
		)
		.limit(1);

	if (!resource) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: `${resourceName} not found`,
		});
	}
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginatedResult<T> {
	items: T[];
	total: number;
}

/**
 * Execute a paginated query with count in parallel.
 */
export async function executePaginatedQuery<T>(
	itemsQuery: Promise<T[]>,
	countQuery: Promise<{ count: number }[]>,
): Promise<PaginatedResult<T>> {
	const [items, countResult] = await Promise.all([itemsQuery, countQuery]);
	return {
		items,
		total: countResult[0]?.count ?? 0,
	};
}

// ============================================================================
// FILTER HELPERS
// ============================================================================

/**
 * Add a status filter condition if statuses are provided.
 */
export function addStatusFilter<T extends PgColumn>(
	conditions: SQL[],
	column: T,
	statuses: string[] | undefined,
): void {
	if (statuses && statuses.length > 0) {
		conditions.push(inArray(column, statuses));
	}
}

/**
 * Add a date filter condition if ranges are provided.
 */
export function addDateFilter<T extends PgColumn>(
	conditions: SQL[],
	column: T,
	ranges: DateFilterRange[] | undefined,
): void {
	const dateCondition = buildDateFilterConditions(column, ranges ?? []);
	if (dateCondition) {
		conditions.push(dateCondition);
	}
}
