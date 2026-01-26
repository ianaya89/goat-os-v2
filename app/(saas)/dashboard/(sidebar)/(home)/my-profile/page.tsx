import type { Metadata } from "next";
import type * as React from "react";
import { AthleteMyProfile } from "@/components/athlete/athlete-my-profile";
import { OrganizationBreadcrumbSwitcher } from "@/components/organization/organization-breadcrumb-switcher";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
} from "@/components/ui/custom/page";

export const metadata: Metadata = {
	title: "Mi Perfil Deportivo",
};

export default function MyProfilePage(): React.JSX.Element {
	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{
								label: <OrganizationBreadcrumbSwitcher />,
								isCustom: true,
							},
							{ label: "Perfil Deportivo" },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="p-4 pb-24 sm:px-6 sm:pt-6">
					<AthleteMyProfile />
				</div>
			</PageBody>
		</Page>
	);
}
