import { execSync } from "node:child_process";
import * as p from "@clack/prompts";

export async function runMigrations(): Promise<void> {
	const spinner = p.spinner();
	spinner.start("Running migrations...");

	try {
		// Pass current process.env to inherit the DATABASE_URL set by env selection
		execSync("npx drizzle-kit migrate --config=drizzle.config.ts", {
			stdio: "pipe",
			cwd: process.cwd(),
			env: process.env,
		});
		spinner.stop("Migrations completed successfully");
	} catch (error) {
		spinner.stop("Migration failed");
		throw error;
	}
}
