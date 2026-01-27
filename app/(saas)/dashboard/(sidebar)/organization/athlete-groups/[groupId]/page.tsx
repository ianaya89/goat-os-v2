import { and, eq } from "drizzle-orm";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { GroupProfile } from "@/components/organization/group-profile";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import { Button } from "@/components/ui/button";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageContent,
	PageHeader,
	PagePrimaryBar,
} from "@/components/ui/custom/page";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { athleteGroupTable } from "@/lib/db/schema/tables";

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

	const t = await getTranslations("athletes.groups");
	const tOrg = await getTranslations("organization.pages");

	// Fetch group name for breadcrumb
	const group = await db.query.athleteGroupTable.findFirst({
		where: and(
			eq(athleteGroupTable.id, groupId),
			eq(
				athleteGroupTable.organizationId,
				session.session.activeOrganizationId,
			),
		),
		columns: { name: true },
	});

	const backButton = (
		<Button asChild size="icon" variant="ghost">
			<Link href="/dashboard/organization/athlete-groups">
				<ArrowLeftIcon className="size-5" />
			</Link>
		</Button>
	);

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: tOrg("home"), href: "/dashboard" },
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{
								label: tOrg("athleteGroups.title"),
								href: "/dashboard/organization/athlete-groups",
							},
							{ label: group?.name ?? "..." },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title={t("groupProfile")} leftAction={backButton}>
					<GroupProfile groupId={groupId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
