import { ClipboardListIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { CoachesTable } from "@/components/organization/coaches-table";
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
	title: "Coaches",
};

export default async function CoachesPage(): Promise<React.JSX.Element> {
	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const t = await getTranslations("coaches");
	const tDashboard = await getTranslations("dashboard");

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: tDashboard("breadcrumb.home"), href: "/dashboard" },
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{ label: t("title") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent
					title={t("title")}
					leftAction={
						<ClipboardListIcon className="size-5 text-muted-foreground" />
					}
				>
					<CoachesTable />
				</PageContent>
			</PageBody>
		</Page>
	);
}
