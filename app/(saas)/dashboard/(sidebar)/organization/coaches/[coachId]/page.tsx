import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { CoachProfile } from "@/components/organization/coach-profile";
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
import { trpc } from "@/trpc/server";

export const metadata: Metadata = {
	title: "Coach Profile",
};

interface CoachProfilePageProps {
	params: Promise<{ coachId: string }>;
}

export default async function CoachProfilePage({
	params,
}: CoachProfilePageProps): Promise<React.JSX.Element> {
	const { coachId } = await params;

	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const t = await getTranslations("organization.pages");

	// Fetch coach name for breadcrumb
	let coachName = t("coaches.profile");
	try {
		const data = await trpc.organization.coach.getProfile({ id: coachId });
		coachName = data.coach.user?.name ?? t("coaches.profile");
	} catch {
		// Fallback to default if fetch fails
	}

	const backButton = (
		<Button asChild size="icon" variant="ghost">
			<Link href="/dashboard/organization/coaches">
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
								label: t("coaches.title"),
								href: "/dashboard/organization/coaches",
							},
							{ label: coachName },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title={t("coaches.profileTitle")} leftAction={backButton}>
					<CoachProfile coachId={coachId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
