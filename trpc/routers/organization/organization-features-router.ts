import { and, eq } from "drizzle-orm";
import { getAllFeatureStates, isFeatureEnabled } from "@/lib/auth/features";
import { db } from "@/lib/db";
import type { OrganizationFeature } from "@/lib/db/schema/enums";
import { organizationFeatureTable } from "@/lib/db/schema/tables";
import {
	checkFeatureSchema,
	updateFeatureSchema,
	updateFeaturesSchema,
} from "@/schemas/organization-features-schemas";
import {
	createTRPCRouter,
	protectedOrgAdminProcedure,
	protectedOrganizationProcedure,
} from "@/trpc/init";

/**
 * Organization Features Router
 *
 * Handles feature flag management for organizations.
 * List and check are available to any org member, but update is admin-only.
 */
export const organizationFeaturesRouter = createTRPCRouter({
	/**
	 * List all features with their enabled state for the organization.
	 * Available to any organization member.
	 */
	list: protectedOrganizationProcedure.query(async ({ ctx }) => {
		return getAllFeatureStates(ctx.organization.id);
	}),

	/**
	 * Check if a specific feature is enabled.
	 * Available to any organization member.
	 */
	check: protectedOrganizationProcedure
		.input(checkFeatureSchema)
		.query(async ({ ctx, input }) => {
			const feature = input.feature as OrganizationFeature;
			const enabled = await isFeatureEnabled(ctx.organization.id, feature);
			return { feature, enabled };
		}),

	/**
	 * Update a single feature's enabled state.
	 * Admin-only operation.
	 */
	update: protectedOrgAdminProcedure
		.input(updateFeatureSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = ctx.organization.id;
			const feature = input.feature as OrganizationFeature;

			// Check if a record exists
			const existing = await db.query.organizationFeatureTable.findFirst({
				where: and(
					eq(organizationFeatureTable.organizationId, organizationId),
					eq(organizationFeatureTable.feature, feature),
				),
			});

			if (existing) {
				// Update existing record
				await db
					.update(organizationFeatureTable)
					.set({
						enabled: input.enabled,
						updatedAt: new Date(),
					})
					.where(eq(organizationFeatureTable.id, existing.id));
			} else {
				// Create new record
				await db.insert(organizationFeatureTable).values({
					organizationId,
					feature,
					enabled: input.enabled,
				});
			}

			return { feature, enabled: input.enabled };
		}),

	/**
	 * Update multiple features at once.
	 * Admin-only operation.
	 */
	updateBatch: protectedOrgAdminProcedure
		.input(updateFeaturesSchema)
		.mutation(async ({ ctx, input }) => {
			const organizationId = ctx.organization.id;
			const results: Array<{ feature: OrganizationFeature; enabled: boolean }> =
				[];

			// Process each feature update
			for (const item of input.features) {
				const feature = item.feature as OrganizationFeature;
				const { enabled } = item;

				const existing = await db.query.organizationFeatureTable.findFirst({
					where: and(
						eq(organizationFeatureTable.organizationId, organizationId),
						eq(organizationFeatureTable.feature, feature),
					),
				});

				if (existing) {
					await db
						.update(organizationFeatureTable)
						.set({
							enabled,
							updatedAt: new Date(),
						})
						.where(eq(organizationFeatureTable.id, existing.id));
				} else {
					await db.insert(organizationFeatureTable).values({
						organizationId,
						feature,
						enabled,
					});
				}

				results.push({ feature, enabled });
			}

			return results;
		}),

	/**
	 * Reset all features to enabled (delete all feature records).
	 * This effectively enables all features since default is enabled.
	 * Admin-only operation.
	 */
	resetAll: protectedOrgAdminProcedure.mutation(async ({ ctx }) => {
		await db
			.delete(organizationFeatureTable)
			.where(eq(organizationFeatureTable.organizationId, ctx.organization.id));

		return { success: true };
	}),
});
