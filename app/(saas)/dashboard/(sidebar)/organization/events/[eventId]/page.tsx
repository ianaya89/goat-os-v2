import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { EventDetail } from "@/components/organization/event-detail";
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
import { db } from "@/lib/db";
import { sportsEventTable } from "@/lib/db/schema/tables";

export const metadata: Metadata = {
	title: "Event Detail",
};

interface EventDetailPageProps {
	params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({
	params,
}: EventDetailPageProps): Promise<React.JSX.Element> {
	const { eventId } = await params;

	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const t = await getTranslations("organization.pages");

	const event = await db.query.sportsEventTable.findFirst({
		where: eq(sportsEventTable.id, eventId),
		columns: { title: true },
	});

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: t("home"), href: "/dashboard" },
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{
								label: t("events.title"),
								href: "/dashboard/organization/events",
							},
							{ label: event?.title ?? t("events.eventFallback") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title={event?.title ?? t("events.detail")}>
					<EventDetail eventId={eventId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
