import { DumbbellIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import { TrainingDashboard } from "@/components/organization/reports/training-dashboard";
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
	title: "Sports Reports",
};

export default async function SportsReportsPage(): Promise<React.JSX.Element> {
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
								label: t("reports.title"),
								href: "/dashboard/organization/reports",
							},
							{ label: t("reports.sports.title") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 sm:px-6 sm:pt-6 sm:pb-24">
					<div className="mx-auto w-full space-y-6">
						<div>
							<div className="flex items-center gap-2">
								<DumbbellIcon className="size-5 text-muted-foreground" />
								<PageTitle>{t("reports.sports.title")}</PageTitle>
							</div>
							<p className="text-muted-foreground text-sm">
								{t("reports.sports.description")}
							</p>
						</div>
						<TrainingDashboard />
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
