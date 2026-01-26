import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import { TrainingSessionDetail } from "@/components/organization/training-session-detail";
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
	title: "Session Details",
};

interface TrainingSessionDetailPageProps {
	params: Promise<{
		sessionId: string;
	}>;
}

export default async function TrainingSessionDetailPage({
	params,
}: TrainingSessionDetailPageProps): Promise<React.JSX.Element> {
	const resolvedParams = await params;
	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const t = await getTranslations("organization.pages");

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: t("home"), href: "/dashboard" },
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{
								label: t("trainingSessions.title"),
								href: "/dashboard/organization/training-sessions",
							},
							{ label: t("trainingSessions.detail") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title={t("trainingSessions.detail")}>
					<TrainingSessionDetail sessionId={resolvedParams.sessionId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
