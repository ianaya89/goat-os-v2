"use client";

import { addDays, format } from "date-fns";
import { CalendarIcon, LayoutListIcon, MailIcon, SendIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { TrainingSessionCalendar } from "@/components/organization/training-session-calendar";
import { TrainingSessionsTable } from "@/components/organization/training-sessions-table";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

type ViewMode = "table" | "calendar";

export function TrainingSessionsView() {
	const [viewMode, setViewMode] = React.useState<ViewMode>("table");

	const sendDailySummaryMutation =
		trpc.organization.trainingSession.sendDailySummary.useMutation({
			onSuccess: (data) => {
				if (data.sent === 0 && data.message) {
					toast.info(data.message);
				} else {
					toast.success(
						`Daily summary sent to ${data.sent} coach${data.sent !== 1 ? "es" : ""} for ${data.date}`,
					);
				}
			},
			onError: (error) => {
				toast.error(error.message || "Failed to send daily summary");
			},
		});

	const handleSendSummary = (daysFromNow: number) => {
		const targetDate = addDays(new Date(), daysFromNow);
		const dateString = format(targetDate, "yyyy-MM-dd");
		sendDailySummaryMutation.mutate({ date: dateString });
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							disabled={sendDailySummaryMutation.isPending}
						>
							<MailIcon className="mr-2 size-4" />
							{sendDailySummaryMutation.isPending
								? "Sending..."
								: "Send Daily Summary"}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem onClick={() => handleSendSummary(0)}>
							<SendIcon className="mr-2 size-4" />
							Today's Sessions
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => handleSendSummary(1)}>
							<SendIcon className="mr-2 size-4" />
							Tomorrow's Sessions
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* View Toggle */}
				<div className="inline-flex items-center rounded-lg bg-muted p-1">
					<button
						type="button"
						onClick={() => setViewMode("table")}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
							viewMode === "table"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<LayoutListIcon className="size-4" />
						<span className="hidden sm:inline">List</span>
					</button>
					<button
						type="button"
						onClick={() => setViewMode("calendar")}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
							viewMode === "calendar"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<CalendarIcon className="size-4" />
						<span className="hidden sm:inline">Calendar</span>
					</button>
				</div>
			</div>

			{viewMode === "table" ? (
				<TrainingSessionsTable />
			) : (
				<TrainingSessionCalendar />
			)}
		</div>
	);
}
