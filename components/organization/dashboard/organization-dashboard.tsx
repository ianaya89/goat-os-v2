"use client";

import { useOrganizationUserProfile } from "@/app/(saas)/dashboard/(sidebar)/organization/providers";
import { AthleteDashboard } from "@/components/organization/dashboard/athlete-dashboard";
import { CoachDashboard } from "@/components/organization/dashboard/coach-dashboard";
import { DailySummaryCard } from "@/components/organization/dashboard/daily-summary-card";
import { GroupOccupancyCard } from "@/components/organization/dashboard/group-occupancy-card";
import { LocationUsageCard } from "@/components/organization/dashboard/location-usage-card";
import { PendingPaymentsCard } from "@/components/organization/dashboard/pending-payments-card";
import { RetentionCard } from "@/components/organization/dashboard/retention-card";
import { WeeklySummaryCard } from "@/components/organization/dashboard/weekly-summary-card";
import { WelcomeSection } from "@/components/organization/dashboard/welcome-section";

export function OrganizationDashboard() {
	// Get user profile from context (set by server-side layout)
	const userProfile = useOrganizationUserProfile();

	// Use pre-computed capabilities from context
	const isRestrictedMember = userProfile.capabilities.isRestrictedMember;
	const isRestrictedCoach = userProfile.capabilities.isRestrictedCoach;

	// Render athlete dashboard for restricted members (athletes without coach/staff role)
	if (isRestrictedMember) {
		return <AthleteDashboard />;
	}

	// Render coach dashboard for coaches who are not admins
	if (isRestrictedCoach) {
		return <CoachDashboard />;
	}

	// Render admin dashboard for owners and admins
	return (
		<div className="fade-in flex animate-in flex-col space-y-4 duration-500">
			{/* Row 0: Welcome Section */}
			<WelcomeSection variant="admin" />

			{/* Row 1: Daily Summary */}
			<DailySummaryCard />

			{/* Row 2: Actionable Metrics */}
			<div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
				<PendingPaymentsCard />
				<GroupOccupancyCard />
				<LocationUsageCard />
				<RetentionCard />
			</div>

			{/* Row 3: Weekly Summary */}
			<WeeklySummaryCard />
		</div>
	);
}
