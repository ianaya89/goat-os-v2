import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { CashRegisterHistory } from "@/components/organization/cash-register-history";
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
	title: "Historial de Caja",
};

export default async function CashRegisterHistoryPage(): Promise<React.JSX.Element> {
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
							{ label: "Caja", href: "/dashboard/organization/cash-register" },
							{ label: "Historial" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 sm:px-6 sm:pt-6 sm:pb-24">
					<div className="mx-auto w-full space-y-4">
						<div>
							<PageTitle>Historial de Caja</PageTitle>
							<p className="text-muted-foreground text-sm">
								Consulta el historial de cajas cerradas
							</p>
						</div>
						<CashRegisterHistory />
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
