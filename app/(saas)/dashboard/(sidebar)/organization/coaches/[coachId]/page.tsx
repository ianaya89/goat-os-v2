import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { CoachProfile } from "@/components/organization/coach-profile";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
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
								label: t("coaches.title"),
								href: "/dashboard/organization/coaches",
							},
							{ label: t("coaches.profile") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title={t("coaches.profileTitle")}>
					<CoachProfile coachId={coachId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
