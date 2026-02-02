"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { TrainingSessionCalendar } from "@/components/organization/training-session-calendar";
import { TrainingSessionViewToggle } from "@/components/organization/training-session-view-toggle";
import { TrainingSessionsTable } from "@/components/organization/training-sessions-table";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/trpc/client";

type ViewMode = "table" | "calendar";

function isViewMode(value: string | null): value is ViewMode {
	return value === "table" || value === "calendar";
}

export function CoachSessionsView() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const t = useTranslations("training");

	const viewParam = searchParams.get("view");
	const [viewMode, setViewModeState] = React.useState<ViewMode>(
		isViewMode(viewParam) ? viewParam : "table",
	);

	// Check if user has a coach profile
	const { data: coachCheck, isLoading: isCheckingCoach } =
		trpc.organization.trainingSession.listMySessionsAsCoach.useQuery({
			limit: 1,
			offset: 0,
		});

	const setViewMode = React.useCallback(
		(mode: ViewMode) => {
			setViewModeState(mode);
			const params = new URLSearchParams(searchParams.toString());
			if (mode === "table") {
				params.delete("view");
			} else {
				params.set("view", mode);
			}
			const qs = params.toString();
			router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
		},
		[searchParams, router, pathname],
	);

	// Toolbar with only view toggle (coaches can't create sessions from this view)
	const toolbarActions = (
		<TrainingSessionViewToggle
			viewMode={viewMode}
			onViewModeChange={setViewMode}
		/>
	);

	// Show message if user doesn't have coach profile
	if (!isCheckingCoach && !coachCheck?.coach) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">
						{t("coachView.noCoachProfile")}
					</p>
					<p className="mt-2 text-muted-foreground text-sm">
						{t("coachView.contactAdmin")}
					</p>
				</CardContent>
			</Card>
		);
	}

	return viewMode === "table" ? (
		<TrainingSessionsTable mode="coach" toolbarActions={toolbarActions} />
	) : (
		<TrainingSessionCalendar mode="coach" toolbarActions={toolbarActions} />
	);
}
