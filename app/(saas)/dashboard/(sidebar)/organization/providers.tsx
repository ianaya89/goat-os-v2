"use client";

import { createContext, type ReactNode, useContext } from "react";
import { ActiveOrganizationProvider } from "@/components/active-organization-provider";
import type { ComputedCapabilities } from "@/lib/auth/permissions";
import type { getOrganizationById } from "@/lib/auth/server";
import type { MemberRole, OrganizationFeature } from "@/lib/db/schema/enums";

// User profile context for organization-specific user info
export interface OrganizationUserProfile {
	userId: string;
	role: MemberRole;
	isCoach: boolean;
	isAthlete: boolean;
	/**
	 * Pre-computed capabilities for easy permission checks in components.
	 * Use these instead of manually checking role + isCoach + isAthlete.
	 */
	capabilities: ComputedCapabilities;
	/**
	 * Set of enabled features for this organization.
	 * Features not in this set are disabled.
	 */
	enabledFeatures: Set<OrganizationFeature>;
}

const UserProfileContext = createContext<OrganizationUserProfile | null>(null);

export function useOrganizationUserProfile(): OrganizationUserProfile {
	const context = useContext(UserProfileContext);
	if (!context) {
		throw new Error(
			"useOrganizationUserProfile must be used within OrganizationProviders",
		);
	}
	return context;
}

/**
 * Hook to check if a specific feature is enabled for the current organization.
 * @param feature - The feature to check
 * @returns true if the feature is enabled, false otherwise
 */
export function useFeatureEnabled(feature: OrganizationFeature): boolean {
	const profile = useOrganizationUserProfile();
	return profile.enabledFeatures.has(feature);
}

export function OrganizationProviders({
	organization,
	userProfile,
	children,
}: {
	organization: NonNullable<Awaited<ReturnType<typeof getOrganizationById>>>;
	userProfile: OrganizationUserProfile;
	children: ReactNode;
}): React.JSX.Element {
	return (
		<ActiveOrganizationProvider organization={organization}>
			<UserProfileContext.Provider value={userProfile}>
				{children}
			</UserProfileContext.Provider>
		</ActiveOrganizationProvider>
	);
}
