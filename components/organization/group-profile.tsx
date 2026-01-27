"use client";

import NiceModal from "@ebay/nice-modal-react";
import { differenceInYears, format } from "date-fns";
import {
	ArrowLeftIcon,
	CalendarCheckIcon,
	CalendarIcon,
	CheckCircleIcon,
	EditIcon,
	MedalIcon,
	MoreHorizontalIcon,
	PlusIcon,
	Trash2Icon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { AthleteGroupsModal } from "@/components/organization/athlete-groups-modal";
import { GroupAttendanceMatrix } from "@/components/organization/group-attendance-matrix";
import { GroupMemberSearch } from "@/components/organization/group-member-search";
import { SessionsListTable } from "@/components/organization/sessions-list-table";
import { TrainingSessionsModal } from "@/components/organization/training-sessions-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { MailtoLink, WhatsAppLink } from "@/components/ui/contact-links";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LevelBadge } from "@/components/ui/level-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user/user-avatar";
import type { AthleteSport } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface GroupProfileProps {
	groupId: string;
}

/**
 * Generates a deterministic soft color based on a string (for group avatar)
 */
function stringToSoftColor(str: string): string {
	const colors = [
		"bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
		"bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
		"bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
		"bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
		"bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
		"bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
		"bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
		"bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
		"bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
		"bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
	];

	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}

	const index = Math.abs(hash) % colors.length;
	return colors[index]!;
}

/**
 * Gets initials from a string (max 2 characters)
 */
function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function GroupProfile({ groupId }: GroupProfileProps) {
	const t = useTranslations("athletes.groups");
	const tCommon = useTranslations("common.sports");
	const utils = trpc.useUtils();

	// Translation helper for sports
	const translateSport = (sport: AthleteSport) => {
		const normalizedSport = sport.toLowerCase() as Parameters<
			typeof tCommon
		>[0];
		return tCommon(normalizedSport);
	};

	const {
		data: group,
		isLoading,
		error,
	} = trpc.organization.athleteGroup.get.useQuery({ id: groupId });

	const { data: sessionsData, isLoading: isLoadingSessions } =
		trpc.organization.trainingSession.list.useQuery(
			{
				limit: 50,
				offset: 0,
				filters: { athleteGroupId: groupId },
				sortBy: "startTime",
				sortOrder: "desc",
			},
			{ enabled: !!groupId },
		);

	const removeMemberMutation =
		trpc.organization.athleteGroup.removeMembers.useMutation({
			onSuccess: () => {
				toast.success(t("success.memberRemoved"));
				utils.organization.athleteGroup.get.invalidate({ id: groupId });
			},
			onError: (error) => {
				toast.error(error.message || t("error.memberRemoveFailed"));
			},
		});

	const addMembersMutation =
		trpc.organization.athleteGroup.addMembers.useMutation({
			onSuccess: () => {
				toast.success(t("success.memberAdded"));
				utils.organization.athleteGroup.get.invalidate({ id: groupId });
			},
			onError: (error) => {
				toast.error(error.message || t("error.memberAddFailed"));
			},
		});

	const deleteSessionMutation =
		trpc.organization.trainingSession.delete.useMutation({
			onSuccess: () => {
				toast.success(t("success.sessionDeleted"));
				utils.organization.trainingSession.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || t("error.sessionDeleteFailed"));
			},
		});

	const updateSessionStatusMutation =
		trpc.organization.trainingSession.bulkUpdateStatus.useMutation({
			onSuccess: () => {
				toast.success(t("profile.actions.statusChanged"));
				utils.organization.trainingSession.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	// Calculate age from birthDate
	const calculateAge = (birthDate: Date | null): number | null => {
		if (!birthDate) return null;
		return differenceInYears(new Date(), new Date(birthDate));
	};

	if (isLoading) {
		return <GroupProfileSkeleton />;
	}

	if (error || !group) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">{t("notFound")}</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard/organization/athlete-groups">
							<ArrowLeftIcon className="mr-2 size-4" />
							{t("backToGroups")}
						</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const sessions = sessionsData?.sessions ?? [];
	const upcomingSessions = sessions.filter(
		(s) => new Date(s.startTime) > new Date() && s.status !== "cancelled",
	);
	const completedSessions = sessions.filter((s) => s.status === "completed");

	const handleEditGroup = () => {
		NiceModal.show(AthleteGroupsModal, { group });
	};

	const handleRemoveMember = (athleteId: string, athleteName: string) => {
		NiceModal.show(ConfirmationModal, {
			title: t("profile.removeMember.title"),
			message: t("profile.removeMember.message", { name: athleteName }),
			confirmLabel: t("profile.removeMember.confirm"),
			destructive: true,
			onConfirm: () =>
				removeMemberMutation.mutate({
					groupId,
					athleteIds: [athleteId],
				}),
		});
	};

	const handleCreateSession = () => {
		NiceModal.show(TrainingSessionsModal, {
			initialGroupId: groupId,
		});
	};

	const handleDeleteSession = (sessionId: string, sessionTitle: string) => {
		NiceModal.show(ConfirmationModal, {
			title: t("profile.deleteSession.title"),
			message: t("profile.deleteSession.message", { name: sessionTitle }),
			confirmLabel: t("profile.deleteSession.confirm"),
			destructive: true,
			onConfirm: () => deleteSessionMutation.mutate({ id: sessionId }),
		});
	};

	const handleChangeSessionStatus = (sessionId: string, status: string) => {
		updateSessionStatusMutation.mutate({
			ids: [sessionId],
			status: status as "pending" | "confirmed" | "completed" | "cancelled",
		});
	};

	const handleAddMember = (athlete: {
		id: string;
		user: { name: string; image: string | null } | null;
	}) => {
		// Check if already a member
		const isAlreadyMember = group.members.some(
			(m) => m.athlete.id === athlete.id,
		);
		if (isAlreadyMember) {
			toast.info(t("profile.alreadyMember"));
			return;
		}
		addMembersMutation.mutate({
			groupId,
			athleteIds: [athlete.id],
		});
	};

	// Get current member IDs for the search component
	const currentMemberIds = group.members.map((m) => m.athlete.id);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<div
						className={cn(
							"flex size-16 shrink-0 items-center justify-center rounded-full font-bold text-xl",
							stringToSoftColor(group.name),
						)}
					>
						{getInitials(group.name)}
					</div>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-bold text-2xl">{group.name}</h1>
							<StatusBadge status={group.isActive ? "active" : "inactive"} />
							{group.ageCategory && (
								<CategoryBadge
									name={group.ageCategory.name ?? group.ageCategory.displayName}
								/>
							)}
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
							{group.sport && (
								<div className="flex items-center gap-1">
									<MedalIcon className="size-4" />
									<span>{translateSport(group.sport as AthleteSport)}</span>
								</div>
							)}
							<div className="flex items-center gap-1">
								<UsersIcon className="size-4" />
								<span>
									<span className="font-semibold">{group.memberCount}</span>
									{group.maxCapacity && (
										<span className="text-muted-foreground">
											/{group.maxCapacity}
										</span>
									)}
									{!group.maxCapacity && (
										<span className="text-muted-foreground">
											{" "}
											{t("table.members").toLowerCase()}
										</span>
									)}
								</span>
							</div>
							{group.description && (
								<>
									<span className="text-muted-foreground/50">•</span>
									<span className="font-medium text-foreground/80">
										{group.description}
									</span>
								</>
							)}
						</div>
					</div>
				</div>
				<Button size="sm" onClick={handleEditGroup}>
					<EditIcon className="mr-2 size-4" />
					{t("profile.editGroup")}
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("profile.members")}
						</CardTitle>
						<UsersIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{group.memberCount}</div>
						{group.maxCapacity ? (
							<p className="text-muted-foreground text-xs">
								{t("profile.ofMaxCapacity", { max: group.maxCapacity })}
							</p>
						) : (
							<p className="text-muted-foreground text-xs">
								{t("profile.noLimit")}
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("profile.upcomingSessions")}
						</CardTitle>
						<CalendarIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{upcomingSessions.length}</div>
						<p className="text-muted-foreground text-xs">
							{t("profile.scheduledThisMonth")}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("profile.completedSessions")}
						</CardTitle>
						<CheckCircleIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{completedSessions.length}</div>
						<p className="text-muted-foreground text-xs">
							{t("profile.totalSessions")}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="members" className="space-y-4">
				<TabsList className="h-auto p-1.5">
					<TabsTrigger value="members">
						<UsersIcon className="size-4" />
						{t("profile.membersTab", { count: group.memberCount })}
					</TabsTrigger>
					<TabsTrigger value="sessions">
						<CalendarIcon className="size-4" />
						{t("profile.sessionsTab", { count: sessions.length })}
					</TabsTrigger>
					<TabsTrigger value="attendance">
						<CalendarCheckIcon className="size-4" />
						{t("profile.attendanceTab")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="members" className="space-y-4">
					{/* Search to Add Members */}
					<GroupMemberSearch
						selectedAthleteIds={currentMemberIds}
						onToggleAthlete={handleAddMember}
					/>

					{/* Members Table */}
					{group.members.length === 0 ? (
						<div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
							<UsersIcon className="mx-auto mb-3 size-10 opacity-50" />
							<p>{t("profile.noMembers")}</p>
						</div>
					) : (
						<div className="rounded-lg border">
							<table className="w-full">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("table.name")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("table.level")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("table.contact")}
										</th>
										<th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
											{t("table.actions")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{group.members.map((member) => {
										const age = calculateAge(member.athlete.birthDate);
										return (
											<tr key={member.id} className="hover:bg-muted/30">
												<td className="px-4 py-3">
													<Link
														href={`/dashboard/organization/athletes/${member.athlete.id}`}
														className="flex items-center gap-3 hover:opacity-80"
													>
														<UserAvatar
															className="size-8 shrink-0"
															name={member.athlete.user?.name ?? ""}
															src={member.athlete.user?.image ?? undefined}
														/>
														<div className="min-w-0">
															<p className="truncate font-medium text-sm">
																{member.athlete.user?.name ?? "Unknown"}
															</p>
															{age !== null && (
																<p className="text-muted-foreground text-xs">
																	{age} {t("yearsOld")}
																</p>
															)}
														</div>
													</Link>
												</td>
												<td className="px-4 py-3">
													{member.athlete.level ? (
														<LevelBadge level={member.athlete.level} />
													) : (
														<span className="text-muted-foreground">-</span>
													)}
												</td>
												<td className="px-4 py-3">
													<div className="flex flex-col gap-1 text-sm">
														{member.athlete.user?.email && (
															<MailtoLink
																email={member.athlete.user.email}
																iconSize="size-3.5"
																truncate
																maxWidth="max-w-[160px]"
																onClick={(e) => e.stopPropagation()}
															/>
														)}
														{member.athlete.phone && (
															<WhatsAppLink
																phone={member.athlete.phone}
																iconSize="size-3.5"
																variant="whatsapp"
																onClick={(e) => e.stopPropagation()}
															/>
														)}
														{!member.athlete.user?.email &&
															!member.athlete.phone && (
																<span className="text-muted-foreground">-</span>
															)}
													</div>
												</td>
												<td className="px-4 py-3 text-right">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
																size="icon"
																variant="ghost"
															>
																<MoreHorizontalIcon className="shrink-0" />
																<span className="sr-only">Open menu</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem asChild>
																<Link
																	href={`/dashboard/organization/athletes/${member.athlete.id}`}
																>
																	<UserIcon className="mr-2 size-4" />
																	{t("profile.actions.viewProfile")}
																</Link>
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																onClick={() =>
																	handleRemoveMember(
																		member.athlete.id,
																		member.athlete.user?.name ?? "this member",
																	)
																}
																variant="destructive"
															>
																<Trash2Icon className="mr-2 size-4" />
																{t("profile.actions.removeMember")}
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</TabsContent>

				<TabsContent value="sessions" className="space-y-4">
					<div className="flex justify-end">
						<Button onClick={handleCreateSession} size="sm">
							<PlusIcon className="mr-2 size-4" />
							{t("profile.newSession")}
						</Button>
					</div>
					<SessionsListTable
						sessions={sessions}
						isLoading={isLoadingSessions}
						initialGroupId={groupId}
						emptyStateMessage={t("profile.noSessions")}
						createButtonLabel={t("profile.createFirstSession")}
						onDeleteSession={handleDeleteSession}
						onChangeStatus={handleChangeSessionStatus}
					/>
				</TabsContent>

				<TabsContent value="attendance" className="space-y-4">
					<GroupAttendanceMatrix groupId={groupId} members={group.members} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function GroupProfileSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header Skeleton */}
			<div className="flex items-start gap-4">
				<Skeleton className="size-10 rounded-md" />
				<Skeleton className="size-16 rounded-full" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>

			{/* Stats Skeleton */}
			<div className="grid gap-4 md:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
							<Skeleton className="mt-1 h-3 w-32" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Tabs Skeleton */}
			<div className="space-y-4">
				<Skeleton className="h-10 w-64" />
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent className="space-y-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
