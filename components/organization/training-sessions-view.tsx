"use client";

import { CalendarIcon, ListIcon } from "lucide-react";
import * as React from "react";
import { TrainingSessionCalendar } from "@/components/organization/training-session-calendar";
import { TrainingSessionsTable } from "@/components/organization/training-sessions-table";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ViewMode = "table" | "calendar";

export function TrainingSessionsView() {
	const [viewMode, setViewMode] = React.useState<ViewMode>("table");

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-end">
				<ToggleGroup
					type="single"
					value={viewMode}
					onValueChange={(value) => {
						if (value) setViewMode(value as ViewMode);
					}}
					className="bg-muted rounded-lg p-1"
				>
					<ToggleGroupItem
						value="table"
						aria-label="Table view"
						className="data-[state=on]:bg-background"
					>
						<ListIcon className="size-4" />
						<span className="ml-2 hidden sm:inline">Table</span>
					</ToggleGroupItem>
					<ToggleGroupItem
						value="calendar"
						aria-label="Calendar view"
						className="data-[state=on]:bg-background"
					>
						<CalendarIcon className="size-4" />
						<span className="ml-2 hidden sm:inline">Calendar</span>
					</ToggleGroupItem>
				</ToggleGroup>
			</div>

			{viewMode === "table" ? (
				<TrainingSessionsTable />
			) : (
				<TrainingSessionCalendar />
			)}
		</div>
	);
}
