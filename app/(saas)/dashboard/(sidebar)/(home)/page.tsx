import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { AthleteHomeDashboard } from "@/components/athlete/athlete-home-dashboard";
import { HomeAutoRedirect } from "@/components/organization/home-auto-redirect";
import { getOrganizationList, getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { athleteTable, coachTable } from "@/lib/db/schema/tables";

export const metadata: Metadata = {
	title: "Home",
};

/**
 * Dashboard home page.
 * - For athletes/coaches: Show their personal home dashboard
 * - For regular users with active organization: redirect to /dashboard/organization
 * - For regular users without active organization: auto-redirect component
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

	// Regular users: if they have an active organization, redirect immediately
	if (session.session.activeOrganizationId) {
		redirect("/dashboard/organization");
	}

	// Get list of organizations the user belongs to
	const organizations = await getOrganizationList();

	// Render the auto-redirect component which handles:
	// - Auto-activating first organization and redirecting
	// - Showing empty state for users without organizations
	return <HomeAutoRedirect organizations={organizations} />;
}
