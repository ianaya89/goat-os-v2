import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { GroupProfile } from "@/components/organization/group-profile";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageContent,
	PageHeader,
	PagePrimaryBar,
} from "@/components/ui/custom/page";
import { getSession } from "@/lib/auth/server";

export const metadata: Metadata = {
	title: "Group Profile",
};

interface GroupProfilePageProps {
	params: Promise<{ groupId: string }>;
}

export default async function GroupProfilePage({
	params,
}: GroupProfilePageProps): Promise<React.JSX.Element> {
	const { groupId } = await params;

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
							{
								label: "Groups",
								href: "/dashboard/organization/athlete-groups",
							},
							{ label: "Profile" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title="Group Profile">
					<GroupProfile groupId={groupId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
