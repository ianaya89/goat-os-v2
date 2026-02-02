import { CalendarDaysIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { AthleteSessionsView } from "@/components/organization/athlete-sessions-view";
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
	title: "My Sessions - Athlete",
};

export default async function AthleteSessionsPage(): Promise<React.JSX.Element> {
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
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{ label: t("mySessions.athlete.title") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent
					title={t("mySessions.athlete.pageTitle")}
					icon={<CalendarDaysIcon className="size-5" />}
				>
					<AthleteSessionsView />
				</PageContent>
			</PageBody>
		</Page>
	);
}
