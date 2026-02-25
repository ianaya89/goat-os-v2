import type { Metadata } from "next";
import type * as React from "react";
import { AdminAuditLogTable } from "@/components/admin/admin-audit-log-table";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageContent,
	PageHeader,
	PagePrimaryBar,
} from "@/components/ui/custom/page";

export const metadata: Metadata = {
	title: "Audit Log",
};

export default function AdminAuditLogPage(): React.JSX.Element {
	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: "Home", href: "/dashboard" },
							{ label: "Admin", href: "/dashboard/admin" },
							{ label: "Audit Log" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title="Platform Audit Log">
					<AdminAuditLogTable />
				</PageContent>
			</PageBody>
		</Page>
	);
}
