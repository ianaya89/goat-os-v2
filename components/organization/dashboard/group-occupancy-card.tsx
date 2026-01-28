"use client";

import { ArrowRightIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export function GroupOccupancyCard(): React.JSX.Element {
	const t = useTranslations("dashboard.groupOccupancy");

	const { data, isLoading } =
		trpc.organization.dashboard.getGroupOccupancy.useQuery();

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-40 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("title")}</CardTitle>
					<CardDescription>{t("noData")}</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const getOccupancyColor = (rate: number) => {
		if (rate >= 80) return "text-green-600";
		if (rate >= 50) return "text-amber-600";
		return "text-muted-foreground";
	};

	return (
		<Card className="flex flex-col">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<UsersIcon className="size-5 text-muted-foreground" />
							{t("title")}
						</CardTitle>
						<CardDescription>{t("description")}</CardDescription>
					</div>
					<div className="flex flex-col items-center rounded-lg bg-muted/50 px-3 py-2">
						<span
							className={cn(
								"text-2xl font-bold",
								getOccupancyColor(data.averageOccupancy),
							)}
						>
							{data.averageOccupancy}%
						</span>
						<span className="text-xs text-muted-foreground">
							{t("average")}
						</span>
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col">
				{data.totalGroups > 0 ? (
					<div className="flex flex-1 flex-col space-y-4">
						{/* Summary Stats */}
						<div className="grid grid-cols-3 gap-2 text-center">
							<div className="rounded-lg bg-muted/50 p-2">
								<p className="text-lg font-bold">{data.totalGroups}</p>
								<p className="text-xs text-muted-foreground">{t("groups")}</p>
							</div>
							<div className="rounded-lg bg-muted/50 p-2">
								<p className="text-lg font-bold">{data.totalMembers}</p>
								<p className="text-xs text-muted-foreground">{t("members")}</p>
							</div>
							<div className="rounded-lg bg-muted/50 p-2">
								<p className="text-lg font-bold">{data.totalCapacity}</p>
								<p className="text-xs text-muted-foreground">{t("capacity")}</p>
							</div>
						</div>

						{/* Group List */}
						{data.groups.length > 0 && (
							<div className="space-y-2">
								<h4 className="text-xs font-medium text-muted-foreground">
									{t("topGroups")}
								</h4>
								{data.groups.map((group) => (
									<div
										key={group.id}
										className="flex items-center justify-between rounded-lg border p-2"
									>
										<div className="flex items-center gap-2 min-w-0">
											<div className="flex size-7 items-center justify-center rounded bg-muted/50">
												<UsersIcon
													className={cn(
														"size-3",
														getOccupancyColor(group.occupancyRate),
													)}
												/>
											</div>
											<div className="min-w-0">
												<p className="text-sm font-medium truncate">
													{group.name}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Progress
												value={Math.min(group.occupancyRate, 100)}
												className="w-16 h-2"
											/>
											<span className="text-xs w-12 text-right">
												{group.members}/{group.capacity}
											</span>
										</div>
									</div>
								))}
							</div>
						)}

						<Button
							variant="ghost"
							size="sm"
							asChild
							className="mt-auto w-full gap-1.5"
						>
							<Link href="/dashboard/organization/athlete-groups">
								{t("viewAllGroups")}
								<ArrowRightIcon className="size-3.5" />
							</Link>
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center py-6 text-center">
						<UsersIcon className="size-10 text-muted-foreground/50 mb-2" />
						<p className="text-muted-foreground text-sm">{t("noGroups")}</p>
						<Button variant="link" size="sm" asChild className="mt-2">
							<Link href="/dashboard/organization/athlete-groups">
								{t("manageGroups")}
							</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
