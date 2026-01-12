#!/usr/bin/env tsx
/**
 * Direct reset script - non-interactive
 * Usage: npm run db:reset
 * WARNING: This will drop all tables and re-run migrations!
 */
import * as p from "@clack/prompts";
import { resetDatabase } from "./commands/reset";
import { getEnvConfig } from "./env";

async function main() {
	const env = getEnvConfig();

	p.intro("🐐 GOAT OS Database Reset");
	p.note(`Environment: ${env.name}`);

	if (env.name === "production") {
		p.log.error("Cannot reset production database!");
		process.exit(1);
	}

	if (env.name === "staging") {
		p.log.error("Cannot reset staging database with direct script!");
		p.log.info("Use 'npm run db:cli' for interactive mode with confirmation.");
		process.exit(1);
	}

	p.log.warn("Resetting database - this will DROP ALL TABLES!");

	await resetDatabase();

	p.outro("Database reset complete! 🎉");
}

main().catch((err) => {
	p.log.error(err instanceof Error ? err.message : String(err));
	process.exit(1);
});
