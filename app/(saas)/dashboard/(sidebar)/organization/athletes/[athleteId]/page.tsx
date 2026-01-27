import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type * as React from "react";
import { AthleteProfile } from "@/components/organization/athlete-profile";
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
	title: "Athlete Profile",
};

interface AthleteProfilePageProps {
	params: Promise<{ athleteId: string }>;
}

export default async function AthleteProfilePage({
	params,
}: AthleteProfilePageProps): Promise<React.JSX.Element> {
	const { athleteId } = await params;

	const session = await getSession();
	if (!session?.session.activeOrganizationId) {
		redirect("/dashboard");
	}

	const t = await getTranslations("organization.pages");

	// Fetch athlete name for breadcrumb
	let athleteName = t("athletes.profile");
	try {
		const data = await trpc.organization.athlete.getProfile({ id: athleteId });
		athleteName = data.athlete.user?.name ?? t("athletes.profile");
	} catch {
		// Fallback to default if fetch fails
	}

	const backButton = (
		<Button asChild size="icon" variant="ghost">
			<Link href="/dashboard/organization/athletes">
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
								label: t("athletes.title"),
								href: "/dashboard/organization/athletes",
							},
							{ label: athleteName },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<PageContent title={t("athletes.profileTitle")} leftAction={backButton}>
					<AthleteProfile athleteId={athleteId} />
				</PageContent>
			</PageBody>
		</Page>
	);
}
