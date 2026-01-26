import * as p from "@clack/prompts";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

export async function resetDatabase(): Promise<void> {
	const spinner = p.spinner();
	const db = getDb();

	try {
		spinner.start("Dropping all tables...");

		// Drop all tables in the public schema
		await db.execute(sql`
			DO $$ DECLARE
				r RECORD;
			BEGIN
				FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
					EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
				END LOOP;
			END $$;
		`);

		spinner.stop("All tables dropped");

		spinner.start("Dropping all enums and types...");

		// Drop all custom types/enums in the public schema
		await db.execute(sql`
			DO $$ DECLARE
				r RECORD;
			BEGIN
				FOR r IN (
					SELECT typname FROM pg_type t
					JOIN pg_namespace n ON t.typnamespace = n.oid
					WHERE n.nspname = 'public' AND t.typtype = 'e'
				) LOOP
					EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
				END LOOP;
			END $$;
		`);

		spinner.stop("All enums and types dropped");

		spinner.start("Dropping all sequences...");

		// Drop all sequences in the public schema
		await db.execute(sql`
			DO $$ DECLARE
				r RECORD;
			BEGIN
				FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
					EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
				END LOOP;
			END $$;
		`);

		spinner.stop("All sequences dropped");

		p.log.step("Re-running migrations...");

		// Use drizzle-kit to run migrations
		// Pass current process.env to inherit the DATABASE_URL set by env selection
		const { execSync } = await import("node:child_process");
		execSync("npx drizzle-kit migrate --config=drizzle.config.ts", {
			stdio: "inherit",
			cwd: process.cwd(),
			env: process.env,
		});

		p.log.success("Database reset completed");
	} catch (error) {
		spinner.stop("Reset failed");
		throw error;
	}
}
