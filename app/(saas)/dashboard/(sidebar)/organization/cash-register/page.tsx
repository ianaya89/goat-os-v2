import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { CashRegisterMovementsWrapper } from "@/components/organization/cash-register-movements-wrapper";
import { CashRegisterStatusCard } from "@/components/organization/cash-register-status";
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
	title: "Cash Register",
};

export default async function CashRegisterPage(): Promise<React.JSX.Element> {
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
							{ label: t("cashRegister.title") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 sm:px-6 sm:pt-6 sm:pb-24">
					<div className="mx-auto w-full space-y-6">
						<div>
							<PageTitle>{t("cashRegister.title")}</PageTitle>
							<p className="text-muted-foreground text-sm">
								{t("cashRegister.description")}
							</p>
						</div>
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<CashRegisterStatusCard />
							<CashRegisterMovementsWrapper />
						</div>
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
