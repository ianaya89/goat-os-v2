import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { CashRegisterMovementsWrapper } from "@/components/organization/cash-register-movements-wrapper";
import { CashRegisterStatusCard } from "@/components/organization/cash-register-status";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
	PageTitle,
} from "@/components/ui/custom/page";
import { getOrganizationById, getSession } from "@/lib/auth/server";

export const metadata: Metadata = {
	title: "Caja",
};

export default async function CashRegisterPage(): Promise<React.JSX.Element> {
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

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: "Home", href: "/dashboard" },
							{ label: organization.name, href: "/dashboard/organization" },
							{ label: "Caja" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 sm:px-6 sm:pt-6 sm:pb-24">
					<div className="mx-auto w-full space-y-6">
						<div>
							<PageTitle>Caja</PageTitle>
							<p className="text-muted-foreground text-sm">
								Gestiona la caja diaria y los movimientos de efectivo
							</p>
						</div>
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							<div>
								<CashRegisterStatusCard />
							</div>
							<div className="lg:col-span-2">
								<CashRegisterMovementsWrapper />
							</div>
						</div>
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
