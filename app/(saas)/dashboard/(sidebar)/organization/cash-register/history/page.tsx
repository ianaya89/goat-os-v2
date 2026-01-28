import { HistoryIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { CashRegisterHistory } from "@/components/organization/cash-register-history";
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
	title: "Cash Register History",
};

export default async function CashRegisterHistoryPage(): Promise<React.JSX.Element> {
	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const t = await getTranslations("organization.pages");
	const tFinance = await getTranslations("finance.cashRegister");

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: t("home"), href: "/dashboard" },
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{ label: t("cashRegister.history") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 sm:px-6 sm:pt-6 sm:pb-24">
					<div className="mx-auto w-full space-y-4">
						<div className="flex items-center gap-2">
							<HistoryIcon className="size-5 text-muted-foreground" />
							<PageTitle>{tFinance("history.title")}</PageTitle>
						</div>
						<CashRegisterHistory />
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
