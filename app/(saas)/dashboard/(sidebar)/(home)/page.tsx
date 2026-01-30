import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { AthleteHomeDashboard } from "@/components/athlete/athlete-home-dashboard";
import { UserHomeDashboard } from "@/components/user/user-home-dashboard";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { athleteTable, coachTable } from "@/lib/db/schema/tables";

export const metadata: Metadata = {
	title: "Home",
};

/**
 * Dashboard home page.
 * - For athletes/coaches: Show their personal home dashboard with organization selector
 * - For other users: Show user home dashboard with organization selector
 *
 * This page is always accessible and never redirects automatically.
 * Users can select an organization from the list to navigate to its dashboard.
 */
export default async function AccountPage(): Promise<React.JSX.Element> {
	const session = await getSession();

	if (!session) {
		redirect("/auth/sign-in");
	}

	const userId = session.user.id;

	// Check if user is an athlete or coach (personal profile types)
	const [athleteProfile, coachProfile] = await Promise.all([
		db.query.athleteTable.findFirst({
			where: eq(athleteTable.userId, userId),
			columns: { id: true },
		}),
		db.query.coachTable.findFirst({
			where: eq(coachTable.userId, userId),
			columns: { id: true },
		}),
	]);

	const isAthlete = !!athleteProfile;
	const isCoach = !!coachProfile;

	// Athletes and coaches get their personal home dashboard
	if (isAthlete || isCoach) {
		return <AthleteHomeDashboard isAthlete={isAthlete} isCoach={isCoach} />;
	}

	// All other users get the user home dashboard with organization selector
	return <UserHomeDashboard />;
}
