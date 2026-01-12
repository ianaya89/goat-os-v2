"use client";

import NiceModal from "@ebay/nice-modal-react";
import { CommandIcon, SearchIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { Button } from "@/components/ui/button";
import { CommandMenu } from "@/components/user/command-menu";
import { cn } from "@/lib/utils";

export type TopbarActionsProps = {
	className?: string;
	showOrgSwitcher?: boolean;
};

export function TopbarActions({
	className,
	showOrgSwitcher,
}: TopbarActionsProps): React.JSX.Element {
	const pathname = usePathname();
	const handleShowCommandMenu = React.useCallback((): void => {
		NiceModal.show(CommandMenu);
	}, []);

	// Hide org switcher in organization area (it's shown in breadcrumb instead)
	const isOrganizationArea = pathname?.startsWith("/dashboard/organization");
	const shouldShowOrgSwitcher =
		showOrgSwitcher ?? (!isOrganizationArea ? true : false);

	return (
		<div className={cn("flex items-center gap-3", className)}>
			{shouldShowOrgSwitcher && (
				<div className="hidden sm:block">
					<OrganizationSwitcher variant="topbar" />
				</div>
			)}
			<Button
				variant="outline"
				size="sm"
				onClick={handleShowCommandMenu}
				className="h-9 gap-2 rounded-lg border-border/50 bg-background/50 px-3 text-muted-foreground hover:bg-background/80 hover:text-foreground"
			>
				<SearchIcon className="size-4" />
				<span className="hidden sm:inline-flex">Search...</span>
				<kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono font-medium text-[10px] text-muted-foreground sm:inline-flex">
					<CommandIcon className="size-3" />K
				</kbd>
			</Button>
		</div>
	);
}
