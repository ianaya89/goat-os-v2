import { createHmac, timingSafeEqual } from "node:crypto";
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
 * Derives an API key for a given organization ID using HMAC-SHA256.
 * Key format: goat_sk_<orgId>.<signature_base64url>
 */
export function deriveApiKey(
	masterSecret: string,
	organizationId: string,
): string {
	const signature = createHmac("sha256", masterSecret)
		.update(organizationId)
		.digest("base64url");
	return `goat_sk_${organizationId}.${signature}`;
}

/**
 * Validates the API key from the Authorization header.
 * Keys are HMAC-derived: goat_sk_<orgId>.<signature>
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @returns The organization ID embedded in the API key
 * @throws ApiAuthError if authentication fails
 */
export function validateApiKey(request: Request): { organizationId: string } {
	const masterSecret = env.API_SECRET_KEY;

	if (!masterSecret) {
		logger.error("API_SECRET_KEY not configured");
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

	// Validate key format: goat_sk_<orgId>.<signature>
	if (!providedKey.startsWith("goat_sk_")) {
		throw new ApiAuthError(401, "Invalid API key format");
	}

	const payload = providedKey.slice("goat_sk_".length);
	const dotIndex = payload.lastIndexOf(".");
	if (dotIndex === -1) {
		throw new ApiAuthError(401, "Invalid API key format");
	}

	const organizationId = payload.slice(0, dotIndex);
	const providedSignature = payload.slice(dotIndex + 1);

	if (!organizationId || !providedSignature) {
		throw new ApiAuthError(401, "Invalid API key format");
	}

	// Recompute expected signature and compare
	const expectedSignature = createHmac("sha256", masterSecret)
		.update(organizationId)
		.digest("base64url");

	const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
	const providedBuffer = Buffer.from(providedSignature, "utf-8");

	if (
		expectedBuffer.length !== providedBuffer.length ||
		!timingSafeEqual(expectedBuffer, providedBuffer)
	) {
		throw new ApiAuthError(401, "Invalid API key");
	}

	return { organizationId };
}
