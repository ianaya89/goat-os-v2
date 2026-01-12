import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { EventEditForm } from "@/components/organization/event-edit-form";
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
	title: "Editar Evento",
};

interface EditEventPageProps {
	params: Promise<{ eventId: string }>;
}

export default async function EditEventPage({
	params,
}: EditEventPageProps): Promise<React.JSX.Element> {
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
							{
								label: "Detalle",
								href: `/dashboard/organization/events/${eventId}`,
							},
							{ label: "Editar" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title="Editar Evento">
					<div className="max-w-3xl">
						<EventEditForm eventId={eventId} />
					</div>
				</PageContent>
			</PageBody>
		</Page>
	);
}
