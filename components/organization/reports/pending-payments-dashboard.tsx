"use client";

import type * as React from "react";
import { OutstandingPaymentsTable } from "./outstanding-payments-table";
import { PendingEventPaymentsTable } from "./pending-event-payments-table";
import { PendingSummaryCards } from "./pending-summary-cards";

export function PendingPaymentsDashboard(): React.JSX.Element {
	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<PendingSummaryCards />

			{/* Tables */}
			<div className="grid grid-cols-1 gap-6">
				{/* Training Payments Pending */}
				<OutstandingPaymentsTable />

				{/* Event Registrations Pending */}
				<PendingEventPaymentsTable />
			</div>
		</div>
	);
}
