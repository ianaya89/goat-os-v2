import { createHmac, randomBytes } from "node:crypto";
import * as p from "@clack/prompts";
import { drizzle } from "drizzle-orm/node-postgres";
import { organizationTable } from "../../../lib/db/schema/tables";

function deriveApiKey(masterSecret: string, organizationId: string): string {
	const signature = createHmac("sha256", masterSecret)
		.update(organizationId)
		.digest("base64url");
	return `goat_sk_${organizationId}.${signature}`;
}

/**
 * Generate a new API key for external agent access.
 * Keys are derived via HMAC from a master secret + org ID.
 * If API_SECRET_KEY is already set, it uses that; otherwise it generates a new one.
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

	// Check for existing master secret or generate a new one
	let masterSecret = process.env.API_SECRET_KEY;
	let isNewSecret = false;

	if (!masterSecret) {
		masterSecret = randomBytes(32).toString("base64");
		isNewSecret = true;
		p.log.info("No API_SECRET_KEY found, generating a new master secret.");
	} else {
		p.log.info("Using existing API_SECRET_KEY from environment.");
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
	const apiKey = deriveApiKey(masterSecret, selectedOrgId as string);

	p.log.success("API key generated!");

	const lines = [`Organization: ${selectedOrg?.name} (${selectedOrgId})`, ""];

	if (isNewSecret) {
		lines.push(
			"Add to your .env file:",
			"",
			`API_SECRET_KEY="${masterSecret}"`,
			"",
			"API key for this organization:",
		);
	} else {
		lines.push("API key for this organization:");
	}

	lines.push("", apiKey);

	p.note(lines.join("\n"), "API Key");

	if (isNewSecret) {
		p.log.warn("Save the API_SECRET_KEY — all derived keys depend on it.");
	}

	p.log.info("Use with: Authorization: Bearer <api-key>");
}
