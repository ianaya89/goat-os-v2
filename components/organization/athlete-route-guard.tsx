"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useOrganizationUserProfile } from "@/app/(saas)/dashboard/(sidebar)/organization/providers";

// Routes that restricted members (athletes) CAN access
const RESTRICTED_MEMBER_ALLOWED_ROUTES = [
	"/dashboard/organization", // Dashboard home (exact match)
	"/dashboard/organization/my-calendar",
	"/dashboard/organization/my-sessions",
	"/dashboard/organization/my-groups",
	"/dashboard/organization/my-payments",
	"/dashboard/organization/my-events",
	"/dashboard/organization/my-profile",
];

// Pattern for session detail pages (athletes can view their session details)
const SESSION_DETAIL_PATTERN =
	/^\/dashboard\/organization\/training-sessions\/[^/]+$/;

// Check if a path is allowed for restricted members
function isRestrictedMemberAllowedRoute(pathname: string): boolean {
	// Exact match for dashboard home
	if (pathname === "/dashboard/organization") {
		return true;
	}

	// Allow viewing individual training session details (for feedback, RPE, etc.)
	if (SESSION_DETAIL_PATTERN.test(pathname)) {
		return true;
	}

	// Check if path starts with any allowed route
	return RESTRICTED_MEMBER_ALLOWED_ROUTES.some(
		(route) =>
			route !== "/dashboard/organization" && pathname.startsWith(route),
	);
}

interface AthleteRouteGuardProps {
	children: React.ReactNode;
}

/**
 * Route guard for restricted members (athletes without staff access).
 * Restricts access to only "My" pages and allowed routes.
 *
 * Uses pre-computed capabilities from context instead of manual role checks.
 */
export function AthleteRouteGuard({ children }: AthleteRouteGuardProps) {
	const pathname = usePathname();
	const router = useRouter();
	const userProfile = useOrganizationUserProfile();

	// Use pre-computed capability from context
	const isRestrictedMember = userProfile.capabilities.isRestrictedMember;

	useEffect(() => {
		if (isRestrictedMember && !isRestrictedMemberAllowedRoute(pathname)) {
			// Redirect restricted members to dashboard if they try to access restricted routes
			router.replace("/dashboard/organization");
		}
	}, [isRestrictedMember, pathname, router]);

	// If restricted member is trying to access a restricted route, show nothing while redirecting
	if (isRestrictedMember && !isRestrictedMemberAllowedRoute(pathname)) {
		return null;
	}

	return <>{children}</>;
}
