/**
 * Confirmation token utilities for session attendance
 *
 * Uses HMAC-based tokens that encode session/athlete info
 * and can be verified without database lookups.
 */

import { createHmac } from "node:crypto";
import { env } from "@/lib/env";

interface ConfirmationPayload {
	sessionId: string;
	athleteId: string;
	expiresAt: number; // Unix timestamp
}

/**
 * Generate a confirmation token for session attendance
 *
 * Token format: base64(payload).signature
 */
export function generateConfirmationToken(
	sessionId: string,
	athleteId: string,
	expiresInHours = 72, // Default: 3 days before session
): string {
	const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;

	const payload: ConfirmationPayload = {
		sessionId,
		athleteId,
		expiresAt,
	};

	const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
	const signature = createSignature(payloadStr);

	return `${payloadStr}.${signature}`;
}

/**
 * Verify and decode a confirmation token
 */
export function verifyConfirmationToken(
	token: string,
): ConfirmationPayload | null {
	try {
		const [payloadStr, signature] = token.split(".");

		if (!payloadStr || !signature) {
			return null;
		}

		// Verify signature
		const expectedSignature = createSignature(payloadStr);
		if (signature !== expectedSignature) {
			return null;
		}

		// Decode payload
		const payload = JSON.parse(
			Buffer.from(payloadStr, "base64url").toString("utf-8"),
		) as ConfirmationPayload;

		// Check expiration
		if (payload.expiresAt < Date.now()) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
}

/**
 * Create HMAC signature for token
 */
function createSignature(data: string): string {
	const secret = env.BETTER_AUTH_SECRET; // Reuse auth secret
	return createHmac("sha256", secret).update(data).digest("base64url");
}

/**
 * Generate confirmation URL for an athlete/session
 */
export function generateConfirmationUrl(
	baseUrl: string,
	sessionId: string,
	athleteId: string,
): string {
	const token = generateConfirmationToken(sessionId, athleteId);
	return `${baseUrl}/api/confirm-attendance?token=${encodeURIComponent(token)}`;
}
