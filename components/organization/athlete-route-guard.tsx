"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useOrganizationUserProfile } from "@/app/(saas)/dashboard/(sidebar)/organization/providers";

// Routes that restricted members (athletes) CAN access
const RESTRICTED_MEMBER_ALLOWED_ROUTES = [
	"/dashboard/organization", // Dashboard home (exact match)
	"/dashboard/organization/my-sessions",
	"/dashboard/organization/my-groups",
	"/dashboard/organization/my-payments",
	"/dashboard/organization/my-profile",
	// Calendar and events temporarily hidden
	// "/dashboard/organization/my-calendar",
	// "/dashboard/organization/my-events",
];

// Routes that restricted coaches CAN access
const RESTRICTED_COACH_ALLOWED_ROUTES = [
	"/dashboard/organization", // Dashboard home (exact match)
	"/dashboard/organization/my-sessions",
	"/dashboard/organization/my-athletes",
	"/dashboard/organization/my-profile",
];

// Routes that staff members CANNOT access (deny-list approach)
const STAFF_BLOCKED_ROUTES = [
	"/dashboard/organization/reports",
	"/dashboard/organization/expenses",
	"/dashboard/organization/payroll",
	"/dashboard/organization/users",
	"/dashboard/organization/settings",
];

// Check if a path is blocked for staff members
function isStaffBlockedRoute(pathname: string): boolean {
	return STAFF_BLOCKED_ROUTES.some((route) => pathname.startsWith(route));
}

// Pattern for session detail pages (athletes can view their session details)
const SESSION_DETAIL_PATTERN =
	/^\/dashboard\/organization\/training-sessions\/[^/]+$/;

// Pattern for athlete detail pages (coaches can view their athlete details)
const ATHLETE_DETAIL_PATTERN = /^\/dashboard\/organization\/athletes\/[^/]+$/;

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

// Check if a path is allowed for restricted coaches
function isRestrictedCoachAllowedRoute(pathname: string): boolean {
	// Exact match for dashboard home
	if (pathname === "/dashboard/organization") {
		return true;
	}

	// Allow viewing individual training session details
	if (SESSION_DETAIL_PATTERN.test(pathname)) {
		return true;
	}

	// Allow viewing individual athlete details (for their athletes)
	if (ATHLETE_DETAIL_PATTERN.test(pathname)) {
		return true;
	}

	// Check if path starts with any allowed route
	return RESTRICTED_COACH_ALLOWED_ROUTES.some(
		(route) =>
			route !== "/dashboard/organization" && pathname.startsWith(route),
	);
}

interface AthleteRouteGuardProps {
	children: React.ReactNode;
}

/**
 * Route guard for restricted members (athletes, coaches, and staff without admin access).
 * Restricts access based on role:
 * - Restricted members: only "My" pages
 * - Restricted coaches: only their sessions and athletes
 * - Staff (not admin): blocked from reports, expenses, payroll, users, settings
 *
 * Uses pre-computed capabilities from context instead of manual role checks.
 */
export function AthleteRouteGuard({ children }: AthleteRouteGuardProps) {
	const pathname = usePathname();
	const router = useRouter();
	const userProfile = useOrganizationUserProfile();

	// Use pre-computed capabilities from context
	const isRestrictedMember = userProfile.capabilities.isRestrictedMember;
	const isRestrictedCoach = userProfile.capabilities.isRestrictedCoach;
	const isStaff = userProfile.capabilities.isStaff;
	const isAdmin = userProfile.capabilities.isAdmin;

	const isStaffOnly = isStaff && !isAdmin;

	useEffect(() => {
		if (isRestrictedMember && !isRestrictedMemberAllowedRoute(pathname)) {
			router.replace("/dashboard/organization");
		} else if (isRestrictedCoach && !isRestrictedCoachAllowedRoute(pathname)) {
			router.replace("/dashboard/organization");
		} else if (isStaffOnly && isStaffBlockedRoute(pathname)) {
			router.replace("/dashboard/organization");
		}
	}, [isRestrictedMember, isRestrictedCoach, isStaffOnly, pathname, router]);

	// Show nothing while redirecting
	if (isRestrictedMember && !isRestrictedMemberAllowedRoute(pathname)) {
		return null;
	}

	if (isRestrictedCoach && !isRestrictedCoachAllowedRoute(pathname)) {
		return null;
	}

	if (isStaffOnly && isStaffBlockedRoute(pathname)) {
		return null;
	}

	return <>{children}</>;
}
