"use client";

import dynamic from "next/dynamic";
import { useOrganizationUserProfile } from "@/app/(saas)/dashboard/(sidebar)/organization/providers";
import { AthleteDashboard } from "@/components/organization/dashboard/athlete-dashboard";
import { DailySummaryCard } from "@/components/organization/dashboard/daily-summary-card";
import { IncomeExpensesChart } from "@/components/organization/dashboard/income-expenses-chart";
import { LowStockCard } from "@/components/organization/dashboard/low-stock-card";
import { PendingPaymentsCard } from "@/components/organization/dashboard/pending-payments-card";
import { RetentionCard } from "@/components/organization/dashboard/retention-card";
import { SessionOccupancyCard } from "@/components/organization/dashboard/session-occupancy-card";
import { UpcomingEventsCard } from "@/components/organization/dashboard/upcoming-events-card";
import { WaitlistCard } from "@/components/organization/dashboard/waitlist-card";
import { WeeklyAttendanceChart } from "@/components/organization/dashboard/weekly-attendance-chart";
import { WeeklySummaryCard } from "@/components/organization/dashboard/weekly-summary-card";
import { CenteredSpinner } from "@/components/ui/custom/centered-spinner";

// Dynamically import cash register to avoid SSR issues
const CashRegisterStatus = dynamic(
	() =>
		import("@/components/organization/cash-register-status").then(
			(mod) => mod.CashRegisterStatusCard,
		),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-64 items-center justify-center">
				<CenteredSpinner />
			</div>
		),
	},
);

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
			{/* Row 1: Daily Summary + Cash Register */}
			<div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<DailySummaryCard />
				</div>
				<div className="h-full">
					<CashRegisterStatus />
				</div>
			</div>

			{/* Row 2: Pending Payments + Upcoming Events + Low Stock */}
			<div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
				<PendingPaymentsCard />
				<UpcomingEventsCard />
				<LowStockCard />
			</div>

			{/* Row 3: Charts - Attendance + Income/Expenses */}
			<div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
				<WeeklyAttendanceChart />
				<IncomeExpensesChart />
			</div>

			{/* Row 4: Session Occupancy + Waitlist + Retention */}
			<div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
				<SessionOccupancyCard />
				<WaitlistCard />
				<RetentionCard />
			</div>

			{/* Row 5: Weekly Summary */}
			<WeeklySummaryCard />
		</div>
	);
}
