import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import { TrainingSessionDetail } from "@/components/organization/training-session-detail";
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
import { trpc } from "@/trpc/server";

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
	const { sessionId } = await params;
	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const t = await getTranslations("organization.pages");

	let sessionTitle = t("trainingSessions.detail");
	try {
		const data = await trpc.organization.trainingSession.get({
			id: sessionId,
		});
		sessionTitle = data.title ?? sessionTitle;
	} catch {
		// Fallback to default if fetch fails
	}

	const backButton = (
		<Button asChild size="icon" variant="ghost">
			<Link href="/dashboard/organization/training-sessions">
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
							{ label: t("home"), href: "/dashboard" },
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{
								label: t("trainingSessions.title"),
								href: "/dashboard/organization/training-sessions",
							},
							{ label: sessionTitle },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent
					title={t("trainingSessions.detail")}
					leftAction={backButton}
				>
					<TrainingSessionDetail sessionId={sessionId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
