"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	Building2Icon,
	ChevronRightIcon,
	SettingsIcon,
	ShieldIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { OrganizationLogo } from "@/components/organization/organization-logo";
import { OrganizationSwitcher } from "@/components/organization/organization-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
} from "@/components/ui/custom/page";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgressRouter } from "@/hooks/use-progress-router";
import { authClient } from "@/lib/auth/client";
import { trpc } from "@/trpc/client";
import { clearOrganizationScopedQueries } from "@/trpc/query-client";

export function UserHomeDashboard() {
	const t = useTranslations("dashboard.home");
	const router = useProgressRouter();
	const queryClient = useQueryClient();

	const { data: organizations, isLoading: isLoadingOrgs } =
		trpc.organization.list.useQuery();

	const handleSelectOrganization = async (organizationId: string) => {
		try {
			await authClient.organization.setActive({ organizationId });
			clearOrganizationScopedQueries(queryClient);
			router.push("/dashboard/organization");
		} catch (error) {
			console.error("Failed to select organization:", error);
		}
	};

	const hasOrganizations = organizations && organizations.length > 0;

	return (
		<Page>
			<PageHeader>
				<PagePrimaryBar>
					<PageBreadcrumb
						segments={[
							{
								label: <OrganizationSwitcher variant="breadcrumb" />,
								isCustom: true,
							},
							{ label: t("title") },
						]}
					/>
				</PagePrimaryBar>
			</PageHeader>
			<PageBody>
				<div className="flex min-h-[calc(100vh-8rem)] flex-col p-4 sm:px-6 sm:pt-6">
					<div className="mx-auto w-full max-w-3xl flex-1">
						{isLoadingOrgs ? (
							<LoadingState />
						) : hasOrganizations ? (
							<OrganizationsView
								organizations={organizations}
								onSelect={handleSelectOrganization}
								t={t}
							/>
						) : (
							<EmptyState t={t} />
						)}
					</div>
				</div>
			</PageBody>
		</Page>
	);
}

function LoadingState() {
	return (
		<div className="space-y-4 pt-8">
			<Skeleton className="mx-auto h-8 w-48" />
			<Skeleton className="mx-auto h-4 w-64" />
			<div className="mt-8 space-y-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-20 w-full rounded-xl" />
				))}
			</div>
		</div>
	);
}

interface EmptyStateProps {
	t: ReturnType<typeof useTranslations<"dashboard.home">>;
}

function EmptyState({ t }: EmptyStateProps) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
			<div className="mb-6 flex size-20 items-center justify-center rounded-full bg-muted">
				<Building2Icon className="size-10 text-muted-foreground" />
			</div>
			<h2 className="font-semibold text-xl">{t("noOrganizations")}</h2>
			<p className="mt-2 max-w-sm text-muted-foreground">
				{t("noOrganizationsHint")}
			</p>

			{/* Quick Links */}
			<div className="mt-12 w-full max-w-sm">
				<p className="mb-4 font-medium text-muted-foreground text-sm">
					{t("quickAccess")}
				</p>
				<div className="flex flex-col gap-2">
					<Button
						asChild
						variant="outline"
						className="h-12 justify-start gap-3"
					>
						<Link href="/dashboard/settings?tab=profile">
							<UserIcon className="size-5" />
							{t("links.profile")}
						</Link>
					</Button>
					<Button
						asChild
						variant="outline"
						className="h-12 justify-start gap-3"
					>
						<Link href="/dashboard/settings?tab=security">
							<ShieldIcon className="size-5" />
							{t("links.security")}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

type OrganizationItem = {
	id: string;
	name: string;
	logo: string | null;
	membersCount: number;
	memberRole: string;
};

interface OrganizationsViewProps {
	organizations: OrganizationItem[];
	onSelect: (id: string) => Promise<void>;
	t: ReturnType<typeof useTranslations<"dashboard.home">>;
}

function OrganizationsView({
	organizations,
	onSelect,
	t,
}: OrganizationsViewProps) {
	return (
		<div className="py-8">
			{/* Header */}
			<div className="mb-8 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					{t("selectOrganization")}
				</h1>
				<p className="mt-1 text-muted-foreground">
					{t("myOrganizationsDescription")}
				</p>
			</div>

			{/* Organizations Grid */}
			<div className="space-y-3">
				{organizations.map((org) => {
					const isOrgAdmin =
						org.memberRole === "owner" || org.memberRole === "admin";
					return (
						<button
							key={org.id}
							type="button"
							onClick={() => onSelect(org.id)}
							className="group flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/50 hover:shadow-md"
						>
							<OrganizationLogo
								className="size-12 rounded-lg"
								name={org.name}
								src={org.logo}
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-base">{org.name}</p>
								<div className="mt-1 flex items-center gap-2">
									<Badge variant="secondary" className="font-normal text-xs">
										<UsersIcon className="mr-1 size-3" />
										{org.membersCount}{" "}
										{org.membersCount === 1 ? "miembro" : "miembros"}
									</Badge>
									{isOrgAdmin && (
										<Badge variant="outline" className="font-normal text-xs">
											{org.memberRole === "owner" ? "Propietario" : "Admin"}
										</Badge>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2">
								{isOrgAdmin && (
									<Link
										href="/dashboard/organization/settings?tab=profile"
										onClick={(e) => {
											e.stopPropagation();
											onSelect(org.id);
										}}
										className="rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-background hover:text-foreground group-hover:opacity-100"
										title={t("links.orgSettings")}
									>
										<SettingsIcon className="size-5" />
									</Link>
								)}
								<ChevronRightIcon className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
							</div>
						</button>
					);
				})}
			</div>

			{/* Quick Links */}
			<div className="mt-12 border-t pt-8">
				<div className="flex items-center justify-center gap-4">
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="text-muted-foreground"
					>
						<Link href="/dashboard/settings?tab=profile">
							<UserIcon className="mr-2 size-4" />
							{t("links.profile")}
						</Link>
					</Button>
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="text-muted-foreground"
					>
						<Link href="/dashboard/settings?tab=security">
							<ShieldIcon className="mr-2 size-4" />
							{t("links.security")}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
