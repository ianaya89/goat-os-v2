export type Environment = {
	name: "local" | "staging" | "production";
	databaseUrl: string;
};

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
