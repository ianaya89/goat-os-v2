import { z } from "zod";
import { OrganizationFeatures } from "@/lib/db/schema/enums";

/**
 * Schema for a single organization feature enum value
 */
export const organizationFeatureSchema = z.enum(
	OrganizationFeatures as [string, ...string[]],
);

/**
 * Schema for updating a single feature's enabled state
 */
export const updateFeatureSchema = z.object({
	feature: organizationFeatureSchema,
	enabled: z.boolean(),
});

/**
 * Schema for updating multiple features at once
 */
export const updateFeaturesSchema = z.object({
	features: z.array(updateFeatureSchema),
});

/**
 * Schema for checking if a feature is enabled
 */
export const checkFeatureSchema = z.object({
	feature: organizationFeatureSchema,
});

/**
 * Response schema for a feature state
 */
export const featureStateSchema = z.object({
	feature: organizationFeatureSchema,
	enabled: z.boolean(),
});

/**
 * Response schema for list of feature states
 */
export const featureStatesListSchema = z.array(featureStateSchema);

// Export types
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
export type UpdateFeaturesInput = z.infer<typeof updateFeaturesSchema>;
export type CheckFeatureInput = z.infer<typeof checkFeatureSchema>;
export type FeatureState = z.infer<typeof featureStateSchema>;
