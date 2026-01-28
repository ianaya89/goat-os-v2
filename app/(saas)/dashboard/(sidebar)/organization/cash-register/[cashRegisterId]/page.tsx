import { format, isToday } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { LandmarkIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type * as React from "react";
import { CashRegisterMovementsWrapper } from "@/components/organization/cash-register-movements-wrapper";
import { CashRegisterStatusCard } from "@/components/organization/cash-register-status";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import { Badge } from "@/components/ui/badge";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
	PageTitle,
} from "@/components/ui/custom/page";
import { getSession } from "@/lib/auth/server";
import { trpc } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Cash Register Detail",
};

interface CashRegisterDetailPageProps {
	params: Promise<{ cashRegisterId: string }>;
}

export default async function CashRegisterDetailPage({
	params,
}: CashRegisterDetailPageProps): Promise<React.JSX.Element> {
	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const { cashRegisterId } = await params;
	const t = await getTranslations("organization.pages");
	const tFinance = await getTranslations("finance.cashRegister");
	const locale = await getLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const register = await trpc.organization.cashRegister.getById({
		id: cashRegisterId,
	});

	const dateFormat = locale === "es" ? "EEEE, d 'de' MMMM" : "EEEE, MMMM d";
	const formattedDate = format(register.date, dateFormat, {
		locale: dateLocale,
	});
	const isHistorical = !isToday(register.date);

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: t("home"), href: "/dashboard" },
							{
								label: <OrganizationBreadcrumbSwitcher />,
								isCustom: true,
							},
							{
								label: t("cashRegister.history"),
								href: "/dashboard/organization/cash-register/history",
							},
							{ label: formattedDate },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 sm:px-6 sm:pt-6 sm:pb-24">
					<div className="mx-auto w-full space-y-4">
						<div className="flex items-center gap-3">
							<LandmarkIcon className="size-5 text-muted-foreground" />
							<PageTitle className="capitalize">{formattedDate}</PageTitle>
							{isHistorical && (
								<Badge
									variant="outline"
									className="border-muted-foreground/30 text-muted-foreground text-[10px] px-1.5 py-0 font-normal"
								>
									{tFinance("history.historicalIndicator")}
								</Badge>
							)}
						</div>
						<CashRegisterStatusCard cashRegisterId={cashRegisterId} />
						<CashRegisterMovementsWrapper cashRegisterId={cashRegisterId} />
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
