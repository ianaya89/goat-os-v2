import type { Metadata } from "next";
import { redirect } from "next/navigation";
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

export const metadata: Metadata = {
	title: "Detalle del Evento",
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

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{ label: "Home", href: "/dashboard" },
							{ label: <OrganizationBreadcrumbSwitcher />, isCustom: true },
							{ label: "Eventos", href: "/dashboard/organization/events" },
							{ label: "Detalle" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title="Detalle del Evento">
					<EventDetail eventId={eventId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
