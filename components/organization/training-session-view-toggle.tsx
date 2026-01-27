"use client";

import { CalendarIcon, LayoutListIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "calendar";

export type TrainingSessionViewToggleProps = {
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
};

export function TrainingSessionViewToggle({
	viewMode,
	onViewModeChange,
}: TrainingSessionViewToggleProps): React.JSX.Element {
	const t = useTranslations("training.viewToggle");

	return (
		<div className="inline-flex items-center rounded-md border bg-muted p-0.5">
			<button
				type="button"
				onClick={() => onViewModeChange("table")}
				className={cn(
					"inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-sm font-medium transition-all",
					viewMode === "table"
						? "bg-background text-foreground shadow-sm"
						: "text-muted-foreground hover:text-foreground",
				)}
			>
				<LayoutListIcon className="size-3.5" />
				<span className="hidden sm:inline">{t("list")}</span>
			</button>
			<button
				type="button"
				onClick={() => onViewModeChange("calendar")}
				className={cn(
					"inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-sm font-medium transition-all",
					viewMode === "calendar"
						? "bg-background text-foreground shadow-sm"
						: "text-muted-foreground hover:text-foreground",
				)}
			>
				<CalendarIcon className="size-3.5" />
				<span className="hidden sm:inline">{t("calendar")}</span>
			</button>
		</div>
	);
}
