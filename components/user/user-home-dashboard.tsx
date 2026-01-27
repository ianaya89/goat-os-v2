"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	Building2Icon,
	ChevronRightIcon,
	MonitorSmartphoneIcon,
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
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Page,
	PageBody,
	PageBreadcrumb,
	PageHeader,
	PagePrimaryBar,
	PageTitle,
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
				<div className="p-4 pb-24 sm:px-6 sm:pt-6">
					<div className="mx-auto w-full max-w-5xl space-y-6">
						<div>
							<PageTitle>{t("title")}</PageTitle>
							<p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
						</div>

						{/* Quick Stats */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{/* Organizations Count */}
							<Card className="transition-shadow hover:shadow-md">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										{t("myOrganizations")}
									</CardTitle>
									<Building2Icon className="size-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									{isLoadingOrgs ? (
										<Skeleton className="h-8 w-16" />
									) : (
										<>
											<div className="font-bold text-2xl">
												{organizations?.length ?? 0}
											</div>
											<p className="text-muted-foreground text-xs">
												{t("organizationCount", {
													count: organizations?.length ?? 0,
												})}
											</p>
										</>
									)}
								</CardContent>
							</Card>

							{/* Quick Access */}
							<Card className="transition-shadow hover:shadow-md">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										{t("quickAccess")}
									</CardTitle>
									<UserIcon className="size-4 text-muted-foreground" />
								</CardHeader>
								<CardContent className="space-y-2">
									<Button
										asChild
										variant="outline"
										className="w-full justify-start"
									>
										<Link href="/dashboard/settings?tab=profile">
											<UserIcon className="mr-2 size-4" />
											{t("links.profile")}
										</Link>
									</Button>
									<Button
										asChild
										variant="outline"
										className="w-full justify-start"
									>
										<Link href="/dashboard/settings?tab=security">
											<ShieldIcon className="mr-2 size-4" />
											{t("links.security")}
										</Link>
									</Button>
									<Button
										asChild
										variant="outline"
										className="w-full justify-start"
									>
										<Link href="/dashboard/settings?tab=sessions">
											<MonitorSmartphoneIcon className="mr-2 size-4" />
											{t("links.sessions")}
										</Link>
									</Button>
								</CardContent>
							</Card>
						</div>

						{/* Organizations List */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Building2Icon className="size-5" />
									{t("myOrganizations")}
								</CardTitle>
								<CardDescription>
									{t("myOrganizationsDescription")}
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoadingOrgs ? (
									<div className="space-y-3">
										{[1, 2].map((i) => (
											<Skeleton key={i} className="h-16" />
										))}
									</div>
								) : !organizations || organizations.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-8 text-center">
										<Building2Icon className="size-10 text-muted-foreground/50" />
										<p className="mt-2 text-muted-foreground text-sm">
											{t("noOrganizations")}
										</p>
										<p className="text-muted-foreground text-xs">
											{t("noOrganizationsHint")}
										</p>
									</div>
								) : (
									<div className="space-y-2">
										{organizations.map((org) => {
											const isOrgAdmin =
												org.memberRole === "owner" ||
												org.memberRole === "admin";
											return (
												<div
													key={org.id}
													className="flex w-full items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
												>
													<button
														type="button"
														onClick={() => handleSelectOrganization(org.id)}
														className="flex flex-1 items-center gap-3 text-left"
													>
														<OrganizationLogo
															className="size-10"
															name={org.name}
															src={org.logo}
														/>
														<div>
															<p className="font-medium">{org.name}</p>
															<div className="flex items-center gap-2">
																<Badge variant="secondary" className="text-xs">
																	<UsersIcon className="mr-1 size-3" />
																	{org.membersCount}
																</Badge>
															</div>
														</div>
													</button>
													<div className="flex items-center gap-1">
														{isOrgAdmin && (
															<Button
																asChild
																variant="ghost"
																size="icon"
																className="size-8"
																title={t("links.orgSettings")}
															>
																<Link
																	href="/dashboard/organization/settings?tab=profile"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleSelectOrganization(org.id);
																	}}
																>
																	<SettingsIcon className="size-4 text-muted-foreground" />
																</Link>
															</Button>
														)}
														<ChevronRightIcon className="size-5 text-muted-foreground" />
													</div>
												</div>
											);
										})}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
