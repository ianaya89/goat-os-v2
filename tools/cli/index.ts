#!/usr/bin/env tsx
import * as p from "@clack/prompts";
import { runMigrations } from "./commands/migrate";
import { pushSchema } from "./commands/push";
import { resetDatabase } from "./commands/reset";
import { runSeeds, seedOptions } from "./commands/seed";
import { type Environment, getEnvConfig } from "./env";
import { runRealLifeSeed } from "./seeds/real-life";

async function main() {
	p.intro("🐐 GOAT OS Database CLI");

	const env = getEnvConfig();
	p.note(
		`Environment: ${env.name}\nDatabase: ${env.databaseUrl.split("@")[1] ?? "****"}`,
	);

	const action = await p.select({
		message: "What do you want to do?",
		options: [
			{
				value: "seed",
				label: "Run Seeds",
				hint: "Populate database with sample data",
			},
			{
				value: "migrate",
				label: "Run Migrations",
				hint: "Apply pending migrations",
			},
			{
				value: "push",
				label: "Push Schema",
				hint: "Push schema directly (no migration files)",
			},
			{
				value: "reset",
				label: "Reset Database",
				hint: "Drop all tables and re-migrate (dangerous!)",
			},
		],
	});

	if (p.isCancel(action)) {
		p.cancel("Operation cancelled.");
		process.exit(0);
	}

	switch (action) {
		case "seed":
			await handleSeed(env);
			break;
		case "migrate":
			await handleMigrate(env);
			break;
		case "push":
			await handlePush(env);
			break;
		case "reset":
			await handleReset(env);
			break;
	}

	p.outro("Done! 🎉");
}

async function handleSeed(env: Environment) {
	const seedMode = await p.select({
		message: "Select seed mode:",
		options: [
			{
				value: "random",
				label: "Random Data",
				hint: "Generate random test data",
			},
			{
				value: "real-life",
				label: "Real Life",
				hint: "GOAT Sports org with nacho@goat.ar, 2 locations, 3 coaches",
			},
		],
	});

	if (p.isCancel(seedMode)) {
		p.cancel("Operation cancelled.");
		process.exit(0);
	}

	if (env.name === "production") {
		const confirm = await p.confirm({
			message: "⚠️ You are about to seed PRODUCTION database. Are you sure?",
			initialValue: false,
		});

		if (p.isCancel(confirm) || !confirm) {
			p.cancel("Operation cancelled.");
			process.exit(0);
		}
	}

	if (seedMode === "real-life") {
		await runRealLifeSeed();
		return;
	}

	// Random data mode - original flow
	const tables = await p.multiselect({
		message: "Select tables to seed:",
		options: seedOptions,
		required: true,
		initialValues: ["all"],
	});

	if (p.isCancel(tables)) {
		p.cancel("Operation cancelled.");
		process.exit(0);
	}

	const count = await p.text({
		message: "How many records per table?",
		placeholder: "10",
		defaultValue: "10",
		validate: (value) => {
			const num = Number.parseInt(value, 10);
			if (Number.isNaN(num) || num < 1 || num > 1000) {
				return "Please enter a number between 1 and 1000";
			}
		},
	});

	if (p.isCancel(count)) {
		p.cancel("Operation cancelled.");
		process.exit(0);
	}

	await runSeeds(tables as string[], Number.parseInt(count as string, 10));
}

async function handleMigrate(env: Environment) {
	if (env.name === "production") {
		const confirm = await p.confirm({
			message:
				"⚠️ You are about to run migrations on PRODUCTION database. Are you sure?",
			initialValue: false,
		});

		if (p.isCancel(confirm) || !confirm) {
			p.cancel("Operation cancelled.");
			process.exit(0);
		}
	}

	await runMigrations();
}

async function handlePush(env: Environment) {
	if (env.name === "production") {
		p.log.error("Cannot push schema to production! Use migrations instead.");
		process.exit(1);
	}

	const confirm = await p.confirm({
		message:
			"⚠️ This will push schema changes directly without migration files. Continue?",
		initialValue: true,
	});

	if (p.isCancel(confirm) || !confirm) {
		p.cancel("Operation cancelled.");
		process.exit(0);
	}

	await pushSchema();
}

async function handleReset(env: Environment) {
	if (env.name === "production") {
		p.log.error("Cannot reset production database from CLI!");
		process.exit(1);
	}

	const confirm = await p.confirm({
		message: "⚠️ This will DROP ALL TABLES and re-run migrations. Are you sure?",
		initialValue: false,
	});

	if (p.isCancel(confirm) || !confirm) {
		p.cancel("Operation cancelled.");
		process.exit(0);
	}

	const doubleConfirm = await p.text({
		message: 'Type "RESET" to confirm:',
		validate: (value) => {
			if (value !== "RESET") {
				return 'Please type "RESET" to confirm';
			}
		},
	});

	if (p.isCancel(doubleConfirm)) {
		p.cancel("Operation cancelled.");
		process.exit(0);
	}

	await resetDatabase();
}

main().catch((err) => {
	p.log.error(err instanceof Error ? err.message : String(err));
	process.exit(1);
});
