import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";

export type EnvironmentName = "local" | "staging" | "production";

export type Environment = {
	name: EnvironmentName;
	databaseUrl: string;
};

export type DatabaseUrls = {
	local?: string;
	staging?: string;
	production?: string;
};

const ENV_DB_FILE = ".env.db";

/**
 * Load database URLs from .env.db file
 */
export function loadDatabaseUrls(): DatabaseUrls {
	const envDbPath = path.resolve(process.cwd(), ENV_DB_FILE);

	if (!fs.existsSync(envDbPath)) {
		return {};
	}

	const envConfig = dotenv.parse(fs.readFileSync(envDbPath));

	return {
		local: envConfig.DATABASE_URL_LOCAL || undefined,
		staging: envConfig.DATABASE_URL_STAGING || undefined,
		production: envConfig.DATABASE_URL_PRODUCTION || undefined,
	};
}

/**
 * Get available environments (those with configured database URLs)
 */
export function getAvailableEnvironments(): {
	name: EnvironmentName;
	databaseUrl: string;
}[] {
	const urls = loadDatabaseUrls();
	const fallbackUrl = process.env.DATABASE_URL;

	const environments: { name: EnvironmentName; databaseUrl: string }[] = [];

	// Add local if available (from .env.db or fallback to DATABASE_URL from .env)
	if (urls.local) {
		environments.push({ name: "local", databaseUrl: urls.local });
	} else if (fallbackUrl && !urls.staging && !urls.production) {
		// Only use DATABASE_URL as local fallback if no other environments configured
		environments.push({ name: "local", databaseUrl: fallbackUrl });
	}

	if (urls.staging) {
		environments.push({ name: "staging", databaseUrl: urls.staging });
	}

	if (urls.production) {
		environments.push({ name: "production", databaseUrl: urls.production });
	}

	return environments;
}

/**
 * Get database URL for a specific environment
 */
export function getDatabaseUrl(envName: EnvironmentName): string | undefined {
	const urls = loadDatabaseUrls();

	switch (envName) {
		case "local":
			return urls.local || process.env.DATABASE_URL;
		case "staging":
			return urls.staging;
		case "production":
			return urls.production;
	}
}

/**
 * Set the DATABASE_URL environment variable for the selected environment
 */
export function setEnvironment(envName: EnvironmentName): Environment {
	const databaseUrl = getDatabaseUrl(envName);

	if (!databaseUrl) {
		throw new Error(
			`No database URL configured for ${envName} environment. ` +
				`Please configure DATABASE_URL_${envName.toUpperCase()} in ${ENV_DB_FILE}`,
		);
	}

	// Override the DATABASE_URL in process.env
	process.env.DATABASE_URL = databaseUrl;

	return {
		name: envName,
		databaseUrl,
	};
}

/**
 * Format database URL for display (hide credentials)
 */
export function formatDatabaseUrl(url: string): string {
	try {
		const parsed = new URL(url);
		return `${parsed.host}${parsed.pathname}`;
	} catch {
		// If URL parsing fails, just show last part after @
		return url.split("@")[1] ?? "****";
	}
}

/**
 * Check if .env.db file exists
 */
export function hasEnvDbFile(): boolean {
	const envDbPath = path.resolve(process.cwd(), ENV_DB_FILE);
	return fs.existsSync(envDbPath);
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use getAvailableEnvironments() and setEnvironment() instead
 */
export function getEnvConfig(): Environment {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL environment variable is required");
	}

	// Detect environment based on DATABASE_URL or explicit ENV variable
	const envName = process.env.ENV || process.env.NODE_ENV || "local";

	let name: Environment["name"];
	if (envName === "production" || databaseUrl.includes("prod")) {
		name = "production";
	} else if (envName === "staging" || databaseUrl.includes("staging")) {
		name = "staging";
	} else {
		name = "local";
	}

	return {
		name,
		databaseUrl,
	};
}
