"use client";

import { CalendarIcon, MedalIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { capitalize } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export function AthleteGroupsView() {
	const t = useTranslations("athletes.groups");
	const { data, isLoading } =
		trpc.organization.athleteGroup.listMyGroups.useQuery();

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-48" />
				))}
			</div>
		);
	}

	const groups = data?.groups ?? [];

	if (groups.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<UsersIcon className="size-12 text-muted-foreground/50" />
					<h3 className="mt-4 font-semibold text-lg">
						{t("myGroups.noGroups")}
					</h3>
					<p className="mt-2 text-center text-muted-foreground">
						{t("myGroups.noGroupsDescription")}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{groups.map((group) => (
				<Card key={group.id} className="flex flex-col">
					<CardHeader>
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="text-lg">{group.name}</CardTitle>
								{group.description && (
									<CardDescription className="mt-1">
										{group.description}
									</CardDescription>
								)}
							</div>
							{group.sport && (
								<Badge variant="secondary">
									<MedalIcon className="mr-1 size-3" />
									{capitalize(group.sport.replace("_", " "))}
								</Badge>
							)}
						</div>
					</CardHeader>
					<CardContent className="flex-1">
						<div className="space-y-4">
							{/* Age Category */}
							{group.ageCategory && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<CalendarIcon className="size-4" />
									<span>{group.ageCategory.name}</span>
								</div>
							)}

							{/* Member Count */}
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<UsersIcon className="size-4" />
								<span>
									{group.memberCount}{" "}
									{group.memberCount !== 1
										? t("myGroups.members")
										: t("myGroups.member")}
									{group.maxCapacity &&
										` / ${group.maxCapacity} ${t("myGroups.max")}`}
								</span>
							</div>

							{/* Member Avatars */}
							{group.members && group.members.length > 0 && (
								<div className="pt-2">
									<p className="mb-2 text-muted-foreground text-xs">
										{t("myGroups.groupmates")}
									</p>
									<div className="flex -space-x-2">
										{group.members.slice(0, 8).map((member) => (
											<Avatar
												key={member.id}
												className="size-8 border-2 border-background"
											>
												<AvatarImage
													src={member.athlete?.user?.image ?? undefined}
													alt={member.athlete?.user?.name ?? ""}
												/>
												<AvatarFallback className="text-xs">
													{member.athlete?.user?.name
														?.split(" ")
														.map((n) => n[0])
														.join("")
														.toUpperCase()
														.slice(0, 2) ?? "?"}
												</AvatarFallback>
											</Avatar>
										))}
										{group.members.length > 8 && (
											<div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground text-xs">
												+{group.members.length - 8}
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
