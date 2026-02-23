import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export class ApiAuthError extends Error {
	constructor(
		public statusCode: number,
		message: string,
	) {
		super(message);
	}
}

/**
 * Validates the API key from the Authorization header.
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @returns The organization ID associated with the API key
 * @throws ApiAuthError if authentication fails
 */
export function validateApiKey(request: Request): { organizationId: string } {
	const secretKey = env.API_SECRET_KEY;
	const organizationId = env.API_ORGANIZATION_ID;

	if (!secretKey || !organizationId) {
		logger.error("API_SECRET_KEY or API_ORGANIZATION_ID not configured");
		throw new ApiAuthError(503, "API not configured");
	}

	const authHeader = request.headers.get("authorization");
	if (!authHeader) {
		throw new ApiAuthError(401, "Missing Authorization header");
	}

	const parts = authHeader.split(" ");
	if (parts.length !== 2 || parts[0] !== "Bearer") {
		throw new ApiAuthError(401, "Invalid Authorization header format");
	}

	const providedKey = parts[1] as string;

	// Timing-safe comparison
	const expectedBuffer = Buffer.from(secretKey, "utf-8");
	const providedBuffer = Buffer.from(providedKey, "utf-8");

	if (
		expectedBuffer.length !== providedBuffer.length ||
		!timingSafeEqual(expectedBuffer, providedBuffer)
	) {
		throw new ApiAuthError(401, "Invalid API key");
	}

	return { organizationId };
}
