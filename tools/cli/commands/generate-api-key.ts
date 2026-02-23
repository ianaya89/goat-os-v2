import { randomBytes } from "node:crypto";
import * as p from "@clack/prompts";
import { drizzle } from "drizzle-orm/node-postgres";
import { organizationTable } from "../../../lib/db/schema/tables";

/**
 * Generate a new API key for external agent access.
 * Queries the database for available organizations and lets the user pick one.
 */
export async function generateApiKey(): Promise<void> {
	p.log.step("Generating API key...");

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		p.log.error("DATABASE_URL is not set");
		return;
	}

	const db = drizzle(databaseUrl);

	const organizations = await db
		.select({
			id: organizationTable.id,
			name: organizationTable.name,
			slug: organizationTable.slug,
		})
		.from(organizationTable);

	if (organizations.length === 0) {
		p.log.error("No organizations found in the database.");
		return;
	}

	const orgOptions = organizations.map((org) => ({
		value: org.id,
		label: org.name,
		hint: org.slug ?? org.id,
	}));

	const selectedOrgId = await p.select({
		message: "Select organization for the API key:",
		options: orgOptions,
	});

	if (p.isCancel(selectedOrgId)) {
		p.cancel("Operation cancelled.");
		process.exit(0);
	}

	const selectedOrg = organizations.find((o) => o.id === selectedOrgId);
	const token = randomBytes(32).toString("base64url");
	const apiKey = `goat_sk_${token}`;

	p.log.success("API key generated!");

	p.note(
		[
			`Organization: ${selectedOrg?.name} (${selectedOrgId})`,
			"",
			"Add these to your .env file:",
			"",
			`API_SECRET_KEY="${apiKey}"`,
			`API_ORGANIZATION_ID="${selectedOrgId}"`,
		].join("\n"),
		"API Key",
	);

	p.log.warn("Save this key now — it cannot be retrieved later.");
}
