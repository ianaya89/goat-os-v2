"use client";

import type * as React from "react";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";

/**
 * A wrapper component for the OrganizationSwitcher that can be used in breadcrumbs.
 * This is a client component that renders the breadcrumb variant of the org switcher.
 */
export function OrganizationBreadcrumbSwitcher(): React.JSX.Element {
	return <OrganizationSwitcher variant="breadcrumb" />;
}
