#!/usr/bin/env tsx
/**
 * Direct seed script - non-interactive
 * Usage: npm run db:seed -- --tables=users,organizations --count=10
 */
import * as p from "@clack/prompts";
import { runSeeds, seedOptions } from "./commands/seed";
import { getEnvConfig } from "./env";

async function main() {
	const args = process.argv.slice(2);
	const tablesArg = args.find((a) => a.startsWith("--tables="));
	const countArg = args.find((a) => a.startsWith("--count="));

	const tables = tablesArg
		? tablesArg.replace("--tables=", "").split(",")
		: ["all"];
	const count = countArg
		? Number.parseInt(countArg.replace("--count=", ""), 10)
		: 10;

	const env = getEnvConfig();

	p.intro("🐐 GOAT OS Database Seeder");
	p.note(
		`Environment: ${env.name}\nTables: ${tables.join(", ")}\nCount: ${count}`,
	);

	if (env.name === "production") {
		p.log.error("Cannot seed production database with direct script!");
		p.log.info("Use 'npm run db:cli' for interactive mode with confirmation.");
		process.exit(1);
	}

	// Validate tables
	const validTables = seedOptions.map((o) => o.value);
	for (const table of tables) {
		if (!validTables.includes(table)) {
			p.log.error(`Invalid table: ${table}`);
			p.log.info(`Valid tables: ${validTables.join(", ")}`);
			process.exit(1);
		}
	}

	await runSeeds(tables, count);

	p.outro("Done! 🎉");
}

main().catch((err) => {
	p.log.error(err instanceof Error ? err.message : String(err));
	process.exit(1);
});
