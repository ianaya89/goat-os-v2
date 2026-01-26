import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { EquipmentInventoryAuditTable } from "@/components/organization/equipment-inventory-audit-table";
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
	title: "Auditorias de Inventario",
};

export default async function EquipmentAuditPage(): Promise<React.JSX.Element> {
	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: "Inicio", href: "/dashboard" },
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{
								label: "Equipamiento",
								href: "/dashboard/organization/equipment",
							},
							{ label: "Auditorias" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 sm:px-6 sm:pt-6 sm:pb-24">
					<div className="mx-auto w-full space-y-4">
						<div>
							<PageTitle>Auditorias de Inventario</PageTitle>
							<p className="text-muted-foreground text-sm">
								Programa y realiza controles periodicos de inventario de
								equipamiento
							</p>
						</div>
						<EquipmentInventoryAuditTable />
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
