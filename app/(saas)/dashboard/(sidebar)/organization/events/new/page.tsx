import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type * as React from "react";
import { EventForm } from "@/components/organization/event-form";
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
	title: "Nuevo Evento",
};

export default async function NewEventPage(): Promise<React.JSX.Element> {
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
							{ label: "Eventos", href: "/dashboard/organization/events" },
							{ label: "Nuevo Evento" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title="Nuevo Evento">
					<div className="max-w-3xl">
						<EventForm />
					</div>
				</PageContent>
			</PageBody>
		</Page>
	);
}
