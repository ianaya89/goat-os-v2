import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { OrganizationDashboard } from "@/components/organization/dashboard/organization-dashboard";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
	PageTitle,
} from "@/components/ui/custom/page";
import { getSession } from "@/lib/auth/server";

export const metadata: Metadata = {
	title: "Dashboard",
};

/**
 * Organization dashboard page.
 * The active organization is obtained from the session by the layout,
 * and TRPC procedures use protectedOrganizationProcedure which validates it.
 */
export default async function DashboardPage(): Promise<React.JSX.Element> {
	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const t = await getTranslations("dashboard");

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
							{ label: t("breadcrumb.dashboard") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 sm:px-6 sm:pt-6 sm:pb-24">
					<div className="mx-auto w-full space-y-4">
						<div>
							<PageTitle>{t("title")}</PageTitle>
						</div>
						<OrganizationDashboard />
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
