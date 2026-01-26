import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
	PageTitle,
} from "@/components/ui/custom/page";
import { AccountSettingsTabs } from "@/components/user/account-settings-tabs";
import { trpc } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Account",
};

export default async function AccountSettingsPage(): Promise<React.JSX.Element> {
	const t = await getTranslations("settings");
	const userAccounts = await trpc.user.getAccounts();
	const userHasPassword = userAccounts?.some(
		(account) => account.providerId === "credential",
	);
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
							{ label: t("title") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 pb-24 sm:px-6 sm:pt-6">
					<div className="max-w-2xl">
						<div className="mb-2">
							<PageTitle>{t("user.title")}</PageTitle>
						</div>
						<AccountSettingsTabs userHasPassword={userHasPassword} />
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
