"use client";

import { UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { AthletesTable } from "@/components/organization/athletes-table";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/trpc/client";

export function CoachAthletesView() {
	const tCommon = useTranslations("common");
	const tTraining = useTranslations("training");

	// Check if user has a coach profile and get athlete IDs
	const { data: coachAthleteData, isLoading } =
		trpc.organization.trainingSession.getMyAthleteIdsAsCoach.useQuery();

	// Show message if user doesn't have coach profile
	if (!isLoading && !coachAthleteData?.coach) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">
						{tTraining("coachView.noCoachProfile")}
					</p>
					<p className="mt-2 text-muted-foreground text-sm">
						{tTraining("coachView.contactAdmin")}
					</p>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">{tCommon("loading")}</p>
				</CardContent>
			</Card>
		);
	}

	// Show empty state if coach has no athletes
	if (
		!coachAthleteData?.athleteIds ||
		coachAthleteData.athleteIds.length === 0
	) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-10">
					<UsersIcon className="mb-4 size-12 text-muted-foreground" />
					<p className="text-muted-foreground">
						{tTraining("coachView.noAthletes")}
					</p>
					<p className="mt-2 text-muted-foreground text-sm">
						{tTraining("coachView.noAthletesDescription")}
					</p>
				</CardContent>
			</Card>
		);
	}

	// Reuse the admin AthletesTable in coach mode (read-only)
	return <AthletesTable mode="coach" />;
}
