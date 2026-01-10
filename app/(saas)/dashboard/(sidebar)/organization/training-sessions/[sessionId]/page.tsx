import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { TrainingSessionDetail } from "@/components/organization/training-session-detail";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageContent,
	PageHeader,
	PagePrimaryBar,
} from "@/components/ui/custom/page";
import { getOrganizationById, getSession } from "@/lib/auth/server";

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
							{
								label: "Training Sessions",
								href: "/dashboard/organization/training-sessions",
							},
							{ label: "Session Details" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title="Session Details">
					<TrainingSessionDetail sessionId={resolvedParams.sessionId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
