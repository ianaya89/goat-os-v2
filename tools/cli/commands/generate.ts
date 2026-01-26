import { execSync } from "node:child_process";
import * as p from "@clack/prompts";

/**
 * Generate migration files based on schema changes.
 * This compares the current schema with the database and creates migration files.
 */
export async function generateMigrations(): Promise<void> {
	const spinner = p.spinner();
	spinner.start("Generating migrations...");

	try {
		// Pass current process.env to inherit the DATABASE_URL set by env selection
		const output = execSync(
			"npx drizzle-kit generate --config=drizzle.config.ts",
			{
				stdio: "pipe",
				cwd: process.cwd(),
				env: process.env,
				encoding: "utf-8",
			},
		);
		spinner.stop("Migrations generated successfully");

		if (output) {
			p.log.info(output.trim());
		}
	} catch (error) {
		spinner.stop("Migration generation failed");
		throw error;
	}
}
