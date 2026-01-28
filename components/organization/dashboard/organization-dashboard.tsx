"use client";

import { useOrganizationUserProfile } from "@/app/(saas)/dashboard/(sidebar)/organization/providers";
import { AthleteDashboard } from "@/components/organization/dashboard/athlete-dashboard";
import { DailySummaryCard } from "@/components/organization/dashboard/daily-summary-card";
import { PendingPaymentsCard } from "@/components/organization/dashboard/pending-payments-card";
import { RetentionCard } from "@/components/organization/dashboard/retention-card";
import { SessionOccupancyCard } from "@/components/organization/dashboard/session-occupancy-card";
import { WeeklySummaryCard } from "@/components/organization/dashboard/weekly-summary-card";
import { WelcomeSection } from "@/components/organization/dashboard/welcome-section";

export function OrganizationDashboard() {
	// Get user profile from context (set by server-side layout)
	const userProfile = useOrganizationUserProfile();

	// Use pre-computed capability from context
	const isRestrictedMember = userProfile.capabilities.isRestrictedMember;

	// Render athlete dashboard for restricted members
	if (isRestrictedMember) {
		return <AthleteDashboard />;
	}

	// Render admin dashboard for owners, admins, and coaches
	return (
		<div className="fade-in flex animate-in flex-col space-y-4 duration-500">
			{/* Row 0: Welcome Section */}
			<WelcomeSection variant="admin" />

			{/* Row 1: Daily Summary */}
			<DailySummaryCard />

			{/* Row 2: Actionable Metrics - Pending Payments + Session Occupancy + Retention */}
			<div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
				<PendingPaymentsCard />
				<SessionOccupancyCard />
				<RetentionCard />
			</div>

			{/* Row 3: Weekly Summary */}
			<WeeklySummaryCard />
		</div>
	);
}
