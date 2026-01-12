import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { ExpenseCategoriesTable } from "@/components/organization/expense-categories-table";
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
	title: "Categorias de Gastos",
};

export default async function ExpenseCategoriesPage(): Promise<React.JSX.Element> {
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
							{ label: "Gastos", href: "/dashboard/organization/expenses" },
							{ label: "Categorias" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 sm:px-6 sm:pt-6 sm:pb-24">
					<div className="mx-auto w-full space-y-4">
						<div>
							<PageTitle>Categorias de Gastos</PageTitle>
							<p className="text-muted-foreground text-sm">
								Configura las categorias para clasificar tus gastos
							</p>
						</div>
						<ExpenseCategoriesTable />
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
