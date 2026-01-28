import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { AthleteHomeDashboard } from "@/components/athlete/athlete-home-dashboard";
import { UserHomeDashboard } from "@/components/user/user-home-dashboard";
import { getOrganizationList, getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { athleteTable, coachTable, sessionTable } from "@/lib/db/schema/tables";

export const metadata: Metadata = {
	title: "Home",
};

/**
 * Dashboard home page.
 * - For athletes/coaches: Show their personal home dashboard
 * - For other users: Redirect to organization dashboard (auto-selecting first org if needed)
 * - Fallback: Show user home dashboard only if user has no organizations
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

	// Users with an active organization go straight to the organization dashboard
	if (session.session.activeOrganizationId) {
		redirect("/dashboard/organization");
	}

	// Non-athlete/non-coach users without active org: auto-select first organization
	const organizations = await getOrganizationList();

	const firstOrg = organizations?.[0];
	if (firstOrg) {
		await db
			.update(sessionTable)
			.set({ activeOrganizationId: firstOrg.id })
			.where(eq(sessionTable.id, session.session.id));

		redirect("/dashboard/organization");
	}

	// Fallback: user has no organizations — show home dashboard so they can create/join one
	return <UserHomeDashboard />;
}
