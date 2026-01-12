import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
	title: "Reportes Deportivos",
};

export default async function SportsReportsPage(): Promise<React.JSX.Element> {
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
							{ label: "Home", href: "/dashboard" },
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{ label: "Reportes", href: "/dashboard/organization/reports" },
							{ label: "Deportivos" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 sm:px-6 sm:pt-6 sm:pb-24">
					<div className="mx-auto w-full space-y-6">
						<div>
							<PageTitle>Reportes Deportivos</PageTitle>
							<p className="text-muted-foreground text-sm">
								Analisis de entrenamientos, asistencia y rendimiento de atletas
							</p>
						</div>
						<TrainingDashboard />
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
