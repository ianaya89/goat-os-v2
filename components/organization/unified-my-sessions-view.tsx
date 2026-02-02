"use client";

import { useOrganizationUserProfile } from "@/app/(saas)/dashboard/(sidebar)/organization/providers";
import { AthleteSessionsView } from "@/components/organization/athlete-sessions-view";
import { CoachSessionsView } from "@/components/organization/coach-sessions-view";

/**
 * Unified view for "My Sessions" that shows the appropriate content
 * based on the user's profile (athlete or coach).
 */
export function UnifiedMySessionsView() {
	const userProfile = useOrganizationUserProfile();

	const isRestrictedCoach = userProfile.capabilities.isRestrictedCoach;
	const isRestrictedMember = userProfile.capabilities.isRestrictedMember;

	// Restricted coach sees coach sessions view
	if (isRestrictedCoach) {
		return <CoachSessionsView />;
	}

	// Restricted member (athlete) sees athlete sessions view
	if (isRestrictedMember) {
		return <AthleteSessionsView />;
	}

	// For admin/owner who is also coach or athlete, show based on their primary role
	// If they're a coach, show coach view; otherwise show athlete view
	if (userProfile.isCoach) {
		return <CoachSessionsView />;
	}

	return <AthleteSessionsView />;
}
