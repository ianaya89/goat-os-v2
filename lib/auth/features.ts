import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
	OrganizationFeature,
	OrganizationFeatures,
	type OrganizationFeature as OrganizationFeatureType,
} from "@/lib/db/schema/enums";
import { organizationFeatureTable } from "@/lib/db/schema/tables";

/**
 * Check if a feature is enabled for an organization.
 * If no record exists for the feature, it's considered enabled by default.
 *
 * @param organizationId - The organization ID
 * @param feature - The feature to check
 * @returns true if the feature is enabled, false otherwise
 */
export async function isFeatureEnabled(
	organizationId: string,
	feature: OrganizationFeatureType,
): Promise<boolean> {
	const featureRecord = await db.query.organizationFeatureTable.findFirst({
		where: and(
			eq(organizationFeatureTable.organizationId, organizationId),
			eq(organizationFeatureTable.feature, feature),
		),
	});

	// If no record exists, the feature is enabled by default
	if (!featureRecord) {
		return true;
	}

	return featureRecord.enabled;
}

/**
 * Assert that a feature is enabled for an organization.
 * Throws a TRPCError with FORBIDDEN code if the feature is disabled.
 *
 * Use this in tRPC procedures to protect routes by feature flag.
 *
 * @param organizationId - The organization ID
 * @param feature - The feature to check
 * @throws TRPCError if the feature is disabled
 */
export async function assertFeatureEnabled(
	organizationId: string,
	feature: OrganizationFeatureType,
): Promise<void> {
	const enabled = await isFeatureEnabled(organizationId, feature);

	if (!enabled) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: `Feature "${feature}" is not enabled for this organization`,
		});
	}
}

/**
 * Get all enabled features for an organization.
 * Returns a Set of feature strings that are enabled.
 * Features without a record are considered enabled.
 *
 * @param organizationId - The organization ID
 * @returns Set of enabled feature strings
 */
export async function getEnabledFeatures(
	organizationId: string,
): Promise<Set<OrganizationFeatureType>> {
	const disabledFeatures = await db.query.organizationFeatureTable.findMany({
		where: and(
			eq(organizationFeatureTable.organizationId, organizationId),
			eq(organizationFeatureTable.enabled, false),
		),
	});

	const disabledSet = new Set(disabledFeatures.map((f) => f.feature));

	// Return all features except the disabled ones
	return new Set(
		OrganizationFeatures.filter(
			(f) => !disabledSet.has(f),
		) as OrganizationFeatureType[],
	);
}

/**
 * Get all feature records for an organization.
 * Useful for the settings UI to show toggle states.
 *
 * @param organizationId - The organization ID
 * @returns Array of feature records with their enabled state
 */
export async function getAllFeatureStates(
	organizationId: string,
): Promise<Array<{ feature: OrganizationFeatureType; enabled: boolean }>> {
	const records = await db.query.organizationFeatureTable.findMany({
		where: eq(organizationFeatureTable.organizationId, organizationId),
	});

	// Create a map of existing records
	const recordMap = new Map(records.map((r) => [r.feature, r.enabled]));

	// Return all features with their state (default to enabled if no record)
	return OrganizationFeatures.map((feature) => ({
		feature: feature as OrganizationFeatureType,
		enabled: recordMap.get(feature as OrganizationFeatureType) ?? true,
	}));
}

// Re-export for convenience
export { OrganizationFeature, OrganizationFeatures };
export type { OrganizationFeatureType };
