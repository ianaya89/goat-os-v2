"use client";

import dynamic from "next/dynamic";
import { CashRegisterStatusCard } from "@/components/organization/cash-register-status";
import { DailySummaryCard } from "@/components/organization/dashboard/daily-summary-card";
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
	return (
		<div className="fade-in flex animate-in flex-col space-y-4 duration-500">
			{/* Top Row: Daily Summary + Cash Register */}
			<div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<DailySummaryCard />
				</div>
				<div className="h-full">
					<CashRegisterStatus />
				</div>
			</div>

			{/* Bottom Row: Weekly Summary */}
			<WeeklySummaryCard />
		</div>
	);
}
