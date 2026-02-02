"use client";

import { redirect, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useOrganizationUserProfile } from "@/app/(saas)/dashboard/(sidebar)/organization/providers";
import { OrganizationFeature } from "@/lib/db/schema/enums";

/**
 * Mapping of route paths to required features.
 * If a route starts with a path in this map, the corresponding feature must be enabled.
 */
const ROUTE_FEATURE_MAP: Record<string, OrganizationFeature> = {
	// Sports
	"/dashboard/organization/athletes": OrganizationFeature.athletes,
	"/dashboard/organization/athlete-groups": OrganizationFeature.athleteGroups,
	"/dashboard/organization/coaches": OrganizationFeature.coaches,
	"/dashboard/organization/training-sessions":
		OrganizationFeature.trainingSessions,
	"/dashboard/organization/events/templates":
		OrganizationFeature.eventTemplates,
	"/dashboard/organization/events": OrganizationFeature.events,
	"/dashboard/organization/age-categories": OrganizationFeature.ageCategories,
	"/dashboard/organization/waitlist": OrganizationFeature.waitlist,
	"/dashboard/organization/equipment/audit": OrganizationFeature.equipmentAudit,
	"/dashboard/organization/equipment": OrganizationFeature.equipment,

	// Finance
	"/dashboard/organization/payments": OrganizationFeature.payments,
	"/dashboard/organization/expenses": OrganizationFeature.expenses,
	"/dashboard/organization/cash-register": OrganizationFeature.cashRegister,
	"/dashboard/organization/products": OrganizationFeature.products,
	"/dashboard/organization/payroll": OrganizationFeature.payroll,

	// Reports
	"/dashboard/organization/reports/financial":
		OrganizationFeature.financialReports,
	"/dashboard/organization/reports/sports": OrganizationFeature.sportsReports,
	"/dashboard/organization/reports/pending": OrganizationFeature.pendingReports,

	// General
	"/dashboard/organization/locations": OrganizationFeature.locations,
	"/dashboard/organization/vendors": OrganizationFeature.vendors,
	"/dashboard/organization/sponsors": OrganizationFeature.sponsors,
	"/dashboard/organization/chatbot": OrganizationFeature.chatbot,

	// My Area (for athletes/coaches) - these depend on the underlying feature
	"/dashboard/organization/sessions": OrganizationFeature.trainingSessions,
	"/dashboard/organization/my-groups": OrganizationFeature.athleteGroups,
	"/dashboard/organization/my-payments": OrganizationFeature.payments,
	"/dashboard/organization/my-events": OrganizationFeature.events,
	"/dashboard/organization/my-calendar": OrganizationFeature.trainingSessions,
	"/dashboard/organization/my-athletes": OrganizationFeature.athletes,

	// Competitions
	"/dashboard/organization/teams": OrganizationFeature.teams,
	"/dashboard/organization/seasons": OrganizationFeature.teams,
	"/dashboard/organization/competitions": OrganizationFeature.competitions,
	"/dashboard/organization/matches": OrganizationFeature.matches,
};

/**
 * Find the required feature for a given pathname.
 * Checks from most specific to least specific path.
 */
function getRequiredFeature(pathname: string): OrganizationFeature | null {
	// Sort routes by length (longest first) to match most specific route first
	const sortedRoutes = Object.keys(ROUTE_FEATURE_MAP).sort(
		(a, b) => b.length - a.length,
	);

	for (const route of sortedRoutes) {
		if (pathname.startsWith(route)) {
			return ROUTE_FEATURE_MAP[route] ?? null;
		}
	}

	return null;
}

/**
 * Route guard that redirects to dashboard if the current route's feature is disabled.
 * Wraps children and checks if the feature required for the current route is enabled.
 */
export function FeatureRouteGuard({
	children,
}: {
	children: ReactNode;
}): ReactNode {
	const pathname = usePathname();
	const userProfile = useOrganizationUserProfile();

	// Find the required feature for this route
	const requiredFeature = getRequiredFeature(pathname);

	// If a feature is required and it's not enabled, redirect to dashboard
	if (requiredFeature && !userProfile.enabledFeatures.has(requiredFeature)) {
		redirect("/dashboard/organization");
	}

	return children;
}
