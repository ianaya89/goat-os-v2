import type { db } from "./client";

/**
 * Type representing the Drizzle database client.
 * Use this instead of `any` when passing the database client around.
 */
export type DrizzleClient = typeof db;

/**
 * Type for database transaction client.
 * Use this for functions that accept a transaction.
 */
export type DrizzleTransaction = Parameters<
	Parameters<typeof db.transaction>[0]
>[0];

/**
 * Union type for either a database client or transaction.
 * Useful for functions that can work with both.
 */
export type DrizzleClientOrTransaction = DrizzleClient | DrizzleTransaction;
