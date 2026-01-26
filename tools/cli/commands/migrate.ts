import { execSync } from "node:child_process";
import * as p from "@clack/prompts";

export async function runMigrations(): Promise<void> {
	p.log.step("Running migrations...");

	try {
		// Use stdio: "inherit" to show real-time output from drizzle-kit
		execSync("npx drizzle-kit migrate --config=drizzle.config.ts", {
			stdio: "inherit",
			cwd: process.cwd(),
			env: process.env,
		});
		p.log.success("Migrations completed successfully");
	} catch (error) {
		p.log.error("Migration failed");
		throw error;
	}
}
