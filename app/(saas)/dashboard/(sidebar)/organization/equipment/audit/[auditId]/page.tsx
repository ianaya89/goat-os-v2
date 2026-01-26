import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { EquipmentAuditDetail } from "@/components/organization/equipment-audit-detail";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
} from "@/components/ui/custom/page";
import { getSession } from "@/lib/auth/server";

export const metadata: Metadata = {
	title: "Detalle de Auditoria",
};

interface Props {
	params: Promise<{
		auditId: string;
	}>;
}

export default async function EquipmentAuditDetailPage({
	params,
}: Props): Promise<React.JSX.Element> {
	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const { auditId } = await params;

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
							{
								label: "Auditorias",
								href: "/dashboard/organization/equipment/audit",
							},
							{ label: "Detalle" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 sm:px-6 sm:pt-6 sm:pb-24">
					<EquipmentAuditDetail auditId={auditId} />
				</div>
			</PageBody>
		</Page>
	);
}
