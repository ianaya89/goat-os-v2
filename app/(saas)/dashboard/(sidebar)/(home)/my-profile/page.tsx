import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { AthleteMyProfile } from "@/components/athlete/athlete-my-profile";
import { CoachMyProfile } from "@/components/coach/coach-my-profile";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import { ProfileSelector } from "@/components/profile/profile-selector";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
} from "@/components/ui/custom/page";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { athleteTable, coachTable } from "@/lib/db/schema/tables";

export const metadata: Metadata = {
	title: "Mi Perfil Deportivo",
};

export default async function MyProfilePage(): Promise<React.JSX.Element> {
	const session = await getSession();

	if (!session) {
		redirect("/auth/sign-in");
	}

	const userId = session.user.id;

	// Check if user is an athlete or coach
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

	// Determine which profile component to show
	const renderProfile = () => {
		// If both profiles exist, show selector with tabs
		if (isAthlete && isCoach) {
			return <ProfileSelector isAthlete={isAthlete} isCoach={isCoach} />;
		}

		// If only coach, show coach profile
		if (isCoach) {
			return <CoachMyProfile />;
		}

		// Default: show athlete profile (even if they don't have one, it will show appropriate message)
		return <AthleteMyProfile />;
	};

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{
								label: <OrganizationBreadcrumbSwitcher />,
								isCustom: true,
							},
							{ label: "Perfil Deportivo" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 pb-24 sm:px-6 sm:pt-6">{renderProfile()}</div>
			</PageBody>
		</Page>
	);
}
