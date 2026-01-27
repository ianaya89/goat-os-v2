"use client";

import { ClockIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
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
import { trpc } from "@/trpc/client";

export function WaitlistCard(): React.JSX.Element {
	const t = useTranslations("dashboard.waitlist");
	const { data, isLoading } =
		trpc.organization.dashboard.getWaitlistSummary.useQuery();

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-32 w-full" />
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

	// Calculate max for progress bar
	const maxCount = Math.max(...data.byGroup.map((g) => g.count), 1);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<ClockIcon className="size-5 text-violet-500" />
							{t("title")}
						</CardTitle>
						<CardDescription>{t("description")}</CardDescription>
					</div>
					{data.totalCount > 0 && (
						<Badge variant="secondary" className="flex items-center gap-1">
							<UsersIcon className="size-3" />
							{data.totalCount}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{data.totalCount > 0 ? (
					<div className="space-y-4">
						{/* Total Summary */}
						<div className="rounded-lg bg-violet-50 p-3 text-center dark:bg-violet-950">
							<p className="text-3xl font-bold text-violet-600">
								{data.totalCount}
							</p>
							<p className="text-sm text-muted-foreground">
								{t("peopleWaiting")}
							</p>
						</div>

						{/* By Group */}
						{data.byGroup.length > 0 && (
							<div className="space-y-3">
								<h4 className="text-xs font-medium text-muted-foreground">
									{t("byGroup")}
								</h4>
								{data.byGroup.slice(0, 5).map((group) => (
									<div
										key={group.groupId ?? "unassigned"}
										className="space-y-1"
									>
										<div className="flex items-center justify-between text-sm">
											<span className="truncate">{group.groupName}</span>
											<span className="font-medium">{group.count}</span>
										</div>
										<Progress
											value={(group.count / maxCount) * 100}
											className="h-2"
										/>
									</div>
								))}
							</div>
						)}

						<Button variant="outline" size="sm" asChild className="w-full">
							<Link href="/dashboard/organization/waitlist">{t("manage")}</Link>
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center py-6 text-center">
						<ClockIcon className="size-10 text-green-500/50 mb-2" />
						<p className="text-muted-foreground text-sm">{t("noPending")}</p>
						<p className="text-xs text-muted-foreground mt-1">
							{t("allAvailable")}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
