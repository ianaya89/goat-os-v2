import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../../lib/db/schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
	if (db) return db;

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL environment variable is required");
	}

	const pool = new pg.Pool({ connectionString: databaseUrl });
	db = drizzle(pool, { schema });

	return db;
}

export { schema };
