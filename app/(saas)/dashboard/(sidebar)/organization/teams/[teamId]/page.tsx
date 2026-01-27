import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import { TeamProfile } from "@/components/organization/team-profile";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageContent,
	PageHeader,
	PagePrimaryBar,
} from "@/components/ui/custom/page";
import { getSession } from "@/lib/auth/server";

export const metadata: Metadata = {
	title: "Team Profile",
};

interface TeamDetailPageProps {
	params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({
	params,
}: TeamDetailPageProps): Promise<React.JSX.Element> {
	const { teamId } = await params;

	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const t = await getTranslations("organization.pages");

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: t("home"), href: "/dashboard" },
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{
								label: t("teams.title"),
								href: "/dashboard/organization/teams",
							},
							{ label: t("teams.profile") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title={t("teams.profileTitle")}>
					<TeamProfile teamId={teamId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
