import { execSync } from "node:child_process";
import * as p from "@clack/prompts";

export async function runMigrations(): Promise<void> {
	const spinner = p.spinner();
	spinner.start("Running migrations...");

	try {
		execSync("npm run db:migrate", {
			stdio: "pipe",
			cwd: process.cwd(),
		});
		spinner.stop("Migrations completed successfully");
	} catch (error) {
		spinner.stop("Migration failed");
		throw error;
	}
}
