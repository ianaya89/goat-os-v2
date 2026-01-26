import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import { OrganizationSettingsTabs } from "@/components/organization/organization-settings-tabs";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
	PageTitle,
} from "@/components/ui/custom/page";
import { getOrganizationById, getSession } from "@/lib/auth/server";
import { isOrganizationAdmin } from "@/lib/auth/utils";

export const metadata: Metadata = {
	title: "Organization Settings",
};

/**
 * Organization settings page.
 * Uses the active organization from the session (validated by layout).
 */
export default async function OrganizationSettingsPage(): Promise<React.JSX.Element> {
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

	const t = await getTranslations("organization.pages");

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: t("home"), href: "/dashboard" },
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{ label: t("settings.title") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 pb-24 sm:px-6 sm:pt-6">
					<div className="max-w-2xl">
						<div className="mb-2">
							<PageTitle>{t("settings.pageTitle")}</PageTitle>
						</div>
						<OrganizationSettingsTabs
							isAdmin={isOrganizationAdmin(organization, session?.user)}
						/>
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
