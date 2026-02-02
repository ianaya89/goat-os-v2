"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { useOrganizationUserProfile } from "@/app/(saas)/dashboard/(sidebar)/organization/providers";
import { AthleteSessionsView } from "@/components/organization/athlete-sessions-view";
import { CoachSessionsView } from "@/components/organization/coach-sessions-view";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Unified sessions view that automatically shows the appropriate view
 * based on whether the user is a coach or athlete in the organization.
 *
 * Priority: Coach view if user is a coach, otherwise athlete view.
 */
export function UnifiedSessionsView() {
	const t = useTranslations("training");
	const userProfile = useOrganizationUserProfile();

	const isCoach = userProfile.isCoach;
	const isAthlete = userProfile.isAthlete;

	// If user is neither coach nor athlete, show a message
	if (!isCoach && !isAthlete) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">
						{t("athleteView.noAthleteProfile")}
					</p>
					<p className="mt-2 text-muted-foreground text-sm">
						{t("athleteView.contactAdmin")}
					</p>
				</CardContent>
			</Card>
		);
	}

	// Show coach view if user is a coach, otherwise show athlete view
	if (isCoach) {
		return <CoachSessionsView />;
	}

	return <AthleteSessionsView />;
}
