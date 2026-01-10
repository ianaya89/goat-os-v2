import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { AthleteProfile } from "@/components/organization/athlete-profile";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageContent,
	PageHeader,
	PagePrimaryBar,
} from "@/components/ui/custom/page";
import { getOrganizationById, getSession } from "@/lib/auth/server";

export const metadata: Metadata = {
	title: "Athlete Profile",
};

interface AthleteProfilePageProps {
	params: Promise<{ athleteId: string }>;
}

export default async function AthleteProfilePage({
	params,
}: AthleteProfilePageProps): Promise<React.JSX.Element> {
	const { athleteId } = await params;

	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const organization = await getOrganizationById(
		session.session.activeOrganizationId,
	);
	if (!organization) {
		redirect("/dashboard");
	}

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: "Home", href: "/dashboard" },
							{ label: organization.name, href: "/dashboard/organization" },
							{ label: "Athletes", href: "/dashboard/organization/athletes" },
							{ label: "Profile" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title="Athlete Profile">
					<AthleteProfile athleteId={athleteId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
