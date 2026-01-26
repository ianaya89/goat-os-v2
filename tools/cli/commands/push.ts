import { execSync } from "node:child_process";
import * as p from "@clack/prompts";

/**
 * Push schema directly to database without creating migration files.
 * This is useful for rapid development but should NOT be used in production.
 */
export async function pushSchema(): Promise<void> {
	const spinner = p.spinner();
	spinner.start("Pushing schema to database...");

	try {
		// Pass current process.env to inherit the DATABASE_URL set by env selection
		execSync("npx drizzle-kit push --config=drizzle.config.ts", {
			stdio: "inherit",
			encoding: "utf-8",
			env: process.env,
		});
		spinner.stop("Schema pushed successfully!");
	} catch (error) {
		spinner.stop("Failed to push schema");
		throw error;
	}
}
