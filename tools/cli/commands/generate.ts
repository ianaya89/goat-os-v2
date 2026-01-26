import { execSync } from "node:child_process";
import * as p from "@clack/prompts";

/**
 * Generate migration files based on schema changes.
 * This compares the current schema with the database and creates migration files.
 */
export async function generateMigrations(): Promise<void> {
	p.log.step("Generating migrations...");

	try {
		// Use stdio: "inherit" to show real-time output from drizzle-kit
		execSync("npx drizzle-kit generate --config=drizzle.config.ts", {
			stdio: "inherit",
			cwd: process.cwd(),
			env: process.env,
		});
		p.log.success("Migrations generated successfully");
	} catch (error) {
		p.log.error("Migration generation failed");
		throw error;
	}
}
