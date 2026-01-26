import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { AthleteProfile } from "@/components/organization/athlete-profile";
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
								label: t("athletes.title"),
								href: "/dashboard/organization/athletes",
							},
							{ label: t("athletes.profile") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title={t("athletes.profileTitle")}>
					<AthleteProfile athleteId={athleteId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
