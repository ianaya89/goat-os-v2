"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import {
	BotIcon,
	CreditCardIcon,
	HomeIcon,
	LayoutDashboardIcon,
	MonitorSmartphoneIcon,
	SettingsIcon,
	ShieldIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type * as React from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";

type NavItem = {
	titleKey: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
};

const userNavItems: NavItem[] = [
	{
		titleKey: "home",
		href: "/dashboard",
		icon: HomeIcon,
	},
	{
		titleKey: "profile",
		href: "/dashboard/settings?tab=profile",
		icon: UserIcon,
	},
	{
		titleKey: "security",
		href: "/dashboard/settings?tab=security",
		icon: ShieldIcon,
	},
	{
		titleKey: "sessions",
		href: "/dashboard/settings?tab=sessions",
		icon: MonitorSmartphoneIcon,
	},
];

const organizationNavItems: NavItem[] = [
	{
		titleKey: "dashboard",
		href: "/dashboard/organization",
		icon: LayoutDashboardIcon,
	},
	{
		titleKey: "aiChatbot",
		href: "/dashboard/organization/chatbot",
		icon: BotIcon,
	},
	{
		titleKey: "generalSettings",
		href: "/dashboard/organization/settings?tab=general",
		icon: SettingsIcon,
	},
	{
		titleKey: "members",
		href: "/dashboard/organization/settings?tab=members",
		icon: UsersIcon,
	},
	{
		titleKey: "subscription",
		href: "/dashboard/organization/settings?tab=subscription",
		icon: CreditCardIcon,
	},
];

export type CommandMenuProps = NiceModalHocProps;

export const CommandMenu = NiceModal.create<CommandMenuProps>(() => {
	const modal = useEnhancedModal();
	const router = useRouter();
	const t = useTranslations("common.commandMenu");
	const tSearch = useTranslations("common.search");

	const navigationGroups = [
		{
			heading: t("account"),
			items: userNavItems,
		},
		{
			heading: t("organization"),
			items: organizationNavItems,
		},
	];

	return (
		<CommandDialog
			open={modal.visible}
			onOpenChange={modal.handleOpenChange}
			className="max-w-lg"
		>
			<CommandInput placeholder={tSearch("commandPlaceholder")} />
			<CommandList>
				<CommandEmpty>{tSearch("noResults")}</CommandEmpty>
				{navigationGroups.map((group) => (
					<CommandGroup key={group.heading} heading={group.heading}>
						{group.items.map((item) => (
							<CommandItem
								key={item.href}
								onSelect={() => {
									router.push(item.href);
									modal.handleClose();
								}}
							>
								<item.icon className="mr-2 size-4 shrink-0 text-muted-foreground" />
								<span>{t(item.titleKey as Parameters<typeof t>[0])}</span>
							</CommandItem>
						))}
					</CommandGroup>
				))}
			</CommandList>
		</CommandDialog>
	);
});
