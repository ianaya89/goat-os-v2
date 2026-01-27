"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	ArrowLeftIcon,
	CalendarIcon,
	InfoIcon,
	MapPinIcon,
	MoreHorizontalIcon,
	PaletteIcon,
	PencilIcon,
	PlusIcon,
	ShieldIcon,
	SwordsIcon,
	Trash2Icon,
	TrophyIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { TeamMemberModal } from "@/components/organization/team-member-modal";
import { TeamStaffModal } from "@/components/organization/team-staff-modal";
import { TeamsModal } from "@/components/organization/teams-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getInitials } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const statusColors: Record<string, string> = {
	active: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
	archived: "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100",
};

const matchStatusColors: Record<string, string> = {
	scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	in_progress:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
	completed:
		"bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	postponed:
		"bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100",
	cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
};

interface TeamProfileProps {
	teamId: string;
}

export function TeamProfile({ teamId }: TeamProfileProps): React.JSX.Element {
	const router = useRouter();
	const utils = trpc.useUtils();
	const t = useTranslations("teams");

	const { data: team, isPending } = trpc.organization.team.get.useQuery({
		id: teamId,
	});

	const { data: matches } = trpc.organization.match.listByTeam.useQuery(
		{ teamId, limit: 10 },
		{ enabled: !!teamId },
	);

	const deleteMutation = trpc.organization.team.delete.useMutation({
		onSuccess: () => {
			toast.success(t("success.deleted"));
			router.push("/dashboard/organization/teams");
		},
		onError: (error) => {
			toast.error(error.message || t("error.deleteFailed"));
		},
	});

	const removeMemberMutation = trpc.organization.team.removeMembers.useMutation(
		{
			onSuccess: () => {
				toast.success(t("success.memberRemoved"));
				utils.organization.team.get.invalidate({ id: teamId });
			},
			onError: (error: { message?: string }) => {
				toast.error(error.message || t("error.deleteFailed"));
			},
		},
	);

	const removeStaffMutation = trpc.organization.team.removeStaff.useMutation({
		onSuccess: () => {
			toast.success(t("success.staffRemoved"));
			utils.organization.team.get.invalidate({ id: teamId });
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message || t("error.deleteFailed"));
		},
	});

	const handleDelete = (): void => {
		if (!team) return;
		NiceModal.show(ConfirmationModal, {
			title: t("actions.delete"),
			description: t("actions.confirmDelete", { name: team.name }),
			confirmText: t("delete"),
			variant: "destructive",
			onConfirm: () => deleteMutation.mutate({ id: teamId }),
		});
	};

	const handleRemoveMember = (athleteId: string, name: string): void => {
		NiceModal.show(ConfirmationModal, {
			title: t("members.remove"),
			description: t("actions.confirmDelete", { name }),
			confirmText: t("delete"),
			variant: "destructive",
			onConfirm: () =>
				removeMemberMutation.mutate({ teamId, athleteIds: [athleteId] }),
		});
	};

	const handleRemoveStaff = (staffId: string, name: string): void => {
		NiceModal.show(ConfirmationModal, {
			title: t("staff.remove"),
			description: t("actions.confirmDelete", { name }),
			confirmText: t("delete"),
			variant: "destructive",
			onConfirm: () => removeStaffMutation.mutate({ id: staffId }),
		});
	};

	if (isPending) {
		return <TeamProfileSkeleton />;
	}

	if (!team) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">{t("error.notFound")}</p>
				<Button asChild className="mt-4">
					<Link href="/dashboard/organization/teams">{t("title")}</Link>
				</Button>
			</div>
		);
	}

	// Calculate stats
	const membersCount = team.members?.length ?? 0;
	const staffCount = team.staff?.length ?? 0;
	const competitionsCount = team.competitions?.length ?? 0;
	const matchesPlayed =
		matches?.filter((m) => m.status === "completed").length ?? 0;
	const matchesScheduled =
		matches?.filter((m) => m.status === "scheduled").length ?? 0;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<Button asChild size="icon" variant="ghost">
						<Link href="/dashboard/organization/teams">
							<ArrowLeftIcon className="size-5" />
						</Link>
					</Button>
					<div
						className="flex h-16 w-16 items-center justify-center rounded-full"
						style={{
							backgroundColor: team.primaryColor ?? "#3B82F6",
						}}
					>
						<ShieldIcon className="h-8 w-8 text-white" />
					</div>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-bold text-2xl">{team.name}</h1>
							<Badge className={cn("border-none", statusColors[team.status])}>
								{t(`status.${team.status}`)}
							</Badge>
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
							{team.season && (
								<div className="flex items-center gap-1">
									<CalendarIcon className="size-4" />
									<span>{team.season.name}</span>
								</div>
							)}
							{team.ageCategory && (
								<div className="flex items-center gap-1">
									<UsersIcon className="size-4" />
									<span>{team.ageCategory.name}</span>
								</div>
							)}
						</div>
					</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline">
							<MoreHorizontalIcon className="mr-2 h-4 w-4" />
							{t("actions.edit")}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={() => NiceModal.show(TeamsModal, { team })}
						>
							<PencilIcon className="mr-2 h-4 w-4" />
							{t("actions.edit")}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleDelete}
							className="text-destructive"
						>
							<Trash2Icon className="mr-2 h-4 w-4" />
							{t("actions.delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Stats Overview */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("stats.totalMembers")}
						</CardTitle>
						<UsersIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{membersCount}</div>
						<p className="text-muted-foreground text-xs">
							{t("tabs.members").toLowerCase()}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("stats.staff")}
						</CardTitle>
						<UserIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{staffCount}</div>
						<p className="text-muted-foreground text-xs">
							{t("tabs.staff").toLowerCase()}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("stats.matches")}
						</CardTitle>
						<SwordsIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{matchesPlayed}</div>
						<p className="text-muted-foreground text-xs">
							{matchesPlayed} {t("stats.matchesPlayed")}, {matchesScheduled}{" "}
							{t("stats.matchesScheduled")}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("stats.competitions")}
						</CardTitle>
						<TrophyIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{competitionsCount}</div>
						<p className="text-muted-foreground text-xs">
							{t("stats.competitionsActive")}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Tabs */}
			<Tabs defaultValue="members" className="space-y-4">
				<TabsList className="flex-wrap">
					<TabsTrigger value="members">
						<UsersIcon className="mr-1 size-3.5" />
						{t("tabs.members")} ({membersCount})
					</TabsTrigger>
					<TabsTrigger value="staff">
						<UserIcon className="mr-1 size-3.5" />
						{t("tabs.staff")} ({staffCount})
					</TabsTrigger>
					<TabsTrigger value="competitions">
						<TrophyIcon className="mr-1 size-3.5" />
						{t("tabs.competitions")}
					</TabsTrigger>
					<TabsTrigger value="matches">
						<SwordsIcon className="mr-1 size-3.5" />
						{t("tabs.matches")}
					</TabsTrigger>
					<TabsTrigger value="schedule">
						<CalendarIcon className="mr-1 size-3.5" />
						{t("tabs.schedule")}
					</TabsTrigger>
					<TabsTrigger value="info">
						<InfoIcon className="mr-1 size-3.5" />
						{t("tabs.info")}
					</TabsTrigger>
				</TabsList>

				{/* Members Tab */}
				<TabsContent value="members">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>{t("members.title")}</CardTitle>
								<CardDescription>{t("members.description")}</CardDescription>
							</div>
							<Button
								onClick={() =>
									NiceModal.show(TeamMemberModal, { teamId: team.id })
								}
							>
								<PlusIcon className="mr-2 h-4 w-4" />
								{t("members.add")}
							</Button>
						</CardHeader>
						<CardContent>
							{team.members && team.members.length > 0 ? (
								<div className="space-y-4">
									{team.members.map((member) => (
										<div
											key={member.id}
											className="flex items-center justify-between rounded-lg border p-4"
										>
											<div className="flex items-center gap-3">
												<Avatar>
													<AvatarImage
														src={member.athlete.user?.image ?? undefined}
													/>
													<AvatarFallback>
														{getInitials(member.athlete.user?.name ?? "")}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className="flex items-center gap-2">
														{member.jerseyNumber && (
															<span className="font-bold text-primary">
																#{member.jerseyNumber}
															</span>
														)}
														<span className="font-medium">
															{member.athlete.user?.name ?? "Sin nombre"}
														</span>
													</div>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<Badge variant="outline" className="text-xs">
															{t(`members.roles.${member.role}`)}
														</Badge>
														{member.position && <span>{member.position}</span>}
													</div>
												</div>
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm">
														<MoreHorizontalIcon className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															NiceModal.show(TeamMemberModal, {
																teamId: team.id,
																member,
															})
														}
													>
														<PencilIcon className="mr-2 h-4 w-4" />
														{t("members.edit")}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() =>
															handleRemoveMember(
																member.athlete.id,
																member.athlete.user?.name ?? "jugador",
															)
														}
														className="text-destructive"
													>
														<Trash2Icon className="mr-2 h-4 w-4" />
														{t("members.remove")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									))}
								</div>
							) : (
								<p className="text-center py-8 text-muted-foreground">
									{t("members.empty")}
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Staff Tab */}
				<TabsContent value="staff">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>{t("staff.title")}</CardTitle>
								<CardDescription>{t("staff.description")}</CardDescription>
							</div>
							<Button
								onClick={() =>
									NiceModal.show(TeamStaffModal, { teamId: team.id })
								}
							>
								<PlusIcon className="mr-2 h-4 w-4" />
								{t("staff.add")}
							</Button>
						</CardHeader>
						<CardContent>
							{team.staff && team.staff.length > 0 ? (
								<div className="space-y-4">
									{team.staff.map((staffMember) => (
										<div
											key={staffMember.id}
											className="flex items-center justify-between rounded-lg border p-4"
										>
											<div className="flex items-center gap-3">
												<Avatar>
													<AvatarImage
														src={
															staffMember.coach?.user?.image ??
															staffMember.user?.image ??
															undefined
														}
													/>
													<AvatarFallback>
														{getInitials(
															staffMember.coach?.user?.name ??
																staffMember.user?.name ??
																"",
														)}
													</AvatarFallback>
												</Avatar>
												<div>
													<span className="font-medium">
														{staffMember.coach?.user?.name ??
															staffMember.user?.name ??
															"Sin nombre"}
													</span>
													<div className="text-sm text-muted-foreground">
														<Badge variant="outline" className="text-xs">
															{t(`staff.roles.${staffMember.role}`)}
														</Badge>
													</div>
												</div>
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm">
														<MoreHorizontalIcon className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															NiceModal.show(TeamStaffModal, {
																teamId: team.id,
																staff: staffMember,
															})
														}
													>
														<PencilIcon className="mr-2 h-4 w-4" />
														{t("staff.edit")}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() =>
															handleRemoveStaff(
																staffMember.id,
																staffMember.coach?.user?.name ??
																	staffMember.user?.name ??
																	"staff",
															)
														}
														className="text-destructive"
													>
														<Trash2Icon className="mr-2 h-4 w-4" />
														{t("staff.remove")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									))}
								</div>
							) : (
								<p className="text-center py-8 text-muted-foreground">
									{t("staff.empty")}
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Competitions Tab */}
				<TabsContent value="competitions">
					<Card>
						<CardHeader>
							<CardTitle>{t("competitions.title")}</CardTitle>
							<CardDescription>{t("competitions.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							{team.competitions && team.competitions.length > 0 ? (
								<div className="space-y-4">
									{team.competitions.map((tc) => (
										<Link
											key={tc.id}
											href={`/dashboard/organization/competitions/${tc.competition.id}`}
											className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
										>
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
													<TrophyIcon className="h-5 w-5 text-primary" />
												</div>
												<div>
													<span className="font-medium">
														{tc.competition.name}
													</span>
													{tc.division && (
														<div className="text-sm text-muted-foreground">
															{t("competitions.division")}: {tc.division}
														</div>
													)}
												</div>
											</div>
											{tc.finalPosition && (
												<Badge variant="outline">
													{t("competitions.position")}: {tc.finalPosition}
												</Badge>
											)}
										</Link>
									))}
								</div>
							) : (
								<p className="text-center py-8 text-muted-foreground">
									{t("competitions.empty")}
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Matches Tab */}
				<TabsContent value="matches">
					<Card>
						<CardHeader>
							<CardTitle>{t("matches.title")}</CardTitle>
							<CardDescription>{t("matches.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							{matches && matches.length > 0 ? (
								<div className="space-y-4">
									{matches.map((match) => {
										const isHome = match.homeTeamId === teamId;
										const opponent = isHome
											? (match.awayTeam?.name ?? match.opponentName)
											: match.homeTeam?.name;
										const teamScore = isHome
											? match.homeScore
											: match.awayScore;
										const opponentScore = isHome
											? match.awayScore
											: match.homeScore;

										return (
											<div
												key={match.id}
												className="flex items-center justify-between rounded-lg border p-4"
											>
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
														<SwordsIcon className="h-5 w-5 text-muted-foreground" />
													</div>
													<div>
														<div className="flex items-center gap-2">
															<span className="font-medium">
																{t("matches.vs")} {opponent ?? "TBD"}
															</span>
															<Badge
																variant="outline"
																className={cn(
																	"text-xs",
																	matchStatusColors[match.status],
																)}
															>
																{match.status}
															</Badge>
														</div>
														<div className="flex items-center gap-4 text-sm text-muted-foreground">
															<span className="flex items-center gap-1">
																<CalendarIcon className="size-3.5" />
																{format(
																	new Date(match.scheduledAt),
																	"MMM d, yyyy HH:mm",
																)}
															</span>
															<Badge variant="secondary" className="text-xs">
																{isHome ? t("matches.home") : t("matches.away")}
															</Badge>
														</div>
													</div>
												</div>
												{match.status === "completed" &&
													teamScore !== null &&
													opponentScore !== null && (
														<div className="text-right">
															<div className="font-bold text-lg">
																{teamScore} - {opponentScore}
															</div>
														</div>
													)}
											</div>
										);
									})}
								</div>
							) : (
								<p className="text-center py-8 text-muted-foreground">
									{t("matches.empty")}
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Schedule Tab */}
				<TabsContent value="schedule">
					<Card>
						<CardHeader>
							<CardTitle>{t("schedule.title")}</CardTitle>
							<CardDescription>{t("schedule.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-center py-10">
								<CalendarIcon className="mx-auto size-12 text-muted-foreground/50" />
								<p className="mt-3 text-muted-foreground">
									{t("schedule.empty")}
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Info Tab */}
				<TabsContent value="info">
					<div className="grid gap-4 md:grid-cols-2">
						{/* General Information */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<InfoIcon className="size-4" />
									{t("info.title")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<p className="text-muted-foreground text-xs">
										{t("info.season")}
									</p>
									<p className="font-medium">
										{team.season?.name ?? t("info.noSeason")}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">
										{t("info.ageCategory")}
									</p>
									<p className="font-medium">
										{team.ageCategory?.name ?? t("info.noCategory")}
									</p>
								</div>
								{team.description && (
									<div>
										<p className="text-muted-foreground text-xs">
											{t("form.description")}
										</p>
										<p className="font-medium">{team.description}</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Venue & Colors */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MapPinIcon className="size-4" />
									{t("info.homeVenue")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<p className="text-muted-foreground text-xs">
										{t("info.homeVenue")}
									</p>
									<p className="font-medium">
										{team.homeVenue ?? t("info.noVenue")}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs mb-2">
										{t("info.colors")}
									</p>
									<div className="flex items-center gap-4">
										{team.primaryColor && (
											<div className="flex items-center gap-2">
												<div
													className="h-6 w-6 rounded-full border"
													style={{ backgroundColor: team.primaryColor }}
												/>
												<span className="text-sm">
													{t("info.primaryColor")}
												</span>
											</div>
										)}
										{team.secondaryColor && (
											<div className="flex items-center gap-2">
												<div
													className="h-6 w-6 rounded-full border"
													style={{ backgroundColor: team.secondaryColor }}
												/>
												<span className="text-sm">
													{t("info.secondaryColor")}
												</span>
											</div>
										)}
										{!team.primaryColor && !team.secondaryColor && (
											<div className="flex items-center gap-2 text-muted-foreground">
												<PaletteIcon className="size-4" />
												<span className="text-sm">
													{t("info.noDescription")}
												</span>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function TeamProfileSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-start gap-4">
				<Skeleton className="size-10" />
				<Skeleton className="size-16 rounded-full" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-4">
				<Skeleton className="h-28" />
				<Skeleton className="h-28" />
				<Skeleton className="h-28" />
				<Skeleton className="h-28" />
			</div>
			<Skeleton className="h-96" />
		</div>
	);
}
