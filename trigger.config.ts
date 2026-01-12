import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
	project: "goat-os",
	runtime: "node",
	logLevel: "log",
	// Maximum duration for tasks (in seconds)
	maxDuration: 300,
	retries: {
		enabledInDev: true,
		default: {
			maxAttempts: 3,
			minTimeoutInMs: 1000,
			maxTimeoutInMs: 10000,
			factor: 2,
			randomize: true,
		},
	},
	dirs: ["./trigger"],
});
