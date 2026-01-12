import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { CoachProfile } from "@/components/organization/coach-profile";
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
	title: "Coach Profile",
};

interface CoachProfilePageProps {
	params: Promise<{ coachId: string }>;
}

export default async function CoachProfilePage({
	params,
}: CoachProfilePageProps): Promise<React.JSX.Element> {
	const { coachId } = await params;

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
							{ label: "Coaches", href: "/dashboard/organization/coaches" },
							{ label: "Profile" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title="Coach Profile">
					<CoachProfile coachId={coachId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
