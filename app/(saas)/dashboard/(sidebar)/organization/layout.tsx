import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type * as React from "react";
import { AthleteRouteGuard } from "@/components/organization/athlete-route-guard";
import { FeatureRouteGuard } from "@/components/organization/feature-route-guard";
import { OrganizationMenuItems } from "@/components/organization/organization-menu-items";
import { SidebarLayout } from "@/components/sidebar-layout";
import { getEnabledFeatures } from "@/lib/auth/features";
import { computeCapabilities } from "@/lib/auth/permissions";
import { getOrganizationById, getSession } from "@/lib/auth/server";
import { shouldRedirectToChoosePlan } from "@/lib/billing/guards";
import { db } from "@/lib/db";
import { athleteTable, coachTable, memberTable } from "@/lib/db/schema/tables";
import { OrganizationProviders } from "./providers";

export type OrganizationLayoutProps = React.PropsWithChildren;

/**
 * Organization layout that requires an active organization in the session.
 * If no active organization is set, redirects to /dashboard to select one.
 * If billing requires a plan and none is active, redirects to /dashboard/choose-plan.
 */
export default async function OrganizationLayout({
	children,
}: OrganizationLayoutProps): Promise<React.JSX.Element> {
	const session = await getSession();

	// If no session, the auth middleware will handle redirect
	if (!session) {
		redirect("/auth/sign-in");
	}

	// If no active organization, redirect to dashboard to select one
	const activeOrganizationId = session.session.activeOrganizationId;
	if (!activeOrganizationId) {
		redirect("/dashboard");
	}

	// Get the active organization details
	const organization = await getOrganizationById(activeOrganizationId);
	if (!organization) {
		// Active organization no longer exists, redirect to dashboard
		redirect("/dashboard");
	}

	// Check if user needs to choose a plan before accessing organization
	const needsToChoosePlan = await shouldRedirectToChoosePlan(organization.id);
	if (needsToChoosePlan) {
		redirect("/dashboard/choose-plan");
	}

	// Get user's membership, profiles, and enabled features for this organization
	const userId = session.user.id;
	const [membership, coachProfile, athleteProfile, enabledFeatures] =
		await Promise.all([
			db.query.memberTable.findFirst({
				where: and(
					eq(memberTable.organizationId, activeOrganizationId),
					eq(memberTable.userId, userId),
				),
			}),
			db.query.coachTable.findFirst({
				where: and(
					eq(coachTable.organizationId, activeOrganizationId),
					eq(coachTable.userId, userId),
				),
			}),
			db.query.athleteTable.findFirst({
				where: and(
					eq(athleteTable.organizationId, activeOrganizationId),
					eq(athleteTable.userId, userId),
				),
			}),
			getEnabledFeatures(activeOrganizationId),
		]);

	// Build user capabilities for permission checks
	const role = membership?.role ?? "member";
	const isCoach = !!coachProfile;
	const isAthlete = !!athleteProfile;

	// User profile info for menu/dashboard with pre-computed capabilities
	const userProfile = {
		userId,
		role,
		isCoach,
		isAthlete,
		capabilities: computeCapabilities({ role, isCoach, isAthlete }),
		enabledFeatures,
	};

	const cookieStore = await cookies();

	return (
		<OrganizationProviders
			organization={organization}
			userProfile={userProfile}
		>
			<SidebarLayout
				defaultOpen={cookieStore.get("sidebar_state")?.value !== "false"}
				defaultWidth={cookieStore.get("sidebar_width")?.value}
				menuItems={<OrganizationMenuItems />}
			>
				<FeatureRouteGuard>
					<AthleteRouteGuard>{children}</AthleteRouteGuard>
				</FeatureRouteGuard>
			</SidebarLayout>
		</OrganizationProviders>
	);
}
