import { UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { AthleteGroupsTable } from "@/components/organization/athlete-groups-table";
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
	title: "Athlete Groups",
};

export default async function AthleteGroupsPage(): Promise<React.JSX.Element> {
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
							{ label: t("athleteGroups.title") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent
					title={t("athleteGroups.title")}
					leftAction={<UsersIcon className="size-5 text-muted-foreground" />}
				>
					<AthleteGroupsTable />
				</PageContent>
			</PageBody>
		</Page>
	);
}
