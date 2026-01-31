"use client";

import NiceModal from "@ebay/nice-modal-react";
import { differenceInYears, format } from "date-fns";
import {
	ActivityIcon,
	BedIcon,
	BriefcaseIcon,
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	FileHeartIcon,
	FlagIcon,
	GraduationCapIcon,
	HeartPulseIcon,
	MapPinIcon,
	MedalIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PercentIcon,
	PhoneIcon,
	PlusIcon,
	RulerIcon,
	ShieldIcon,
	StarIcon,
	Trash2Icon,
	TrendingUpIcon,
	TrophyIcon,
	UserIcon,
	UsersIcon,
	VideoIcon,
	WeightIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { AddAttendanceModal } from "@/components/organization/add-attendance-modal";
import { AddCareerHistoryModal } from "@/components/organization/add-career-history-modal";
import { AddEvaluationModal } from "@/components/organization/add-evaluation-modal";
import { AddFitnessTestModal } from "@/components/organization/add-fitness-test-modal";
import { AddPhysicalMetricsModal } from "@/components/organization/add-physical-metrics-modal";
import { AddWellnessModal } from "@/components/organization/add-wellness-modal";
import { AssignTeamModal } from "@/components/organization/assign-team-modal";
import { OrgAthleteBioEditModal } from "@/components/organization/athlete-info/org-athlete-bio-edit-modal";
import { OrgAthleteContactEditModal } from "@/components/organization/athlete-info/org-athlete-contact-edit-modal";
import { OrgAthleteEducationEditModal } from "@/components/organization/athlete-info/org-athlete-education-edit-modal";
import { OrgAthleteHealthEditModal } from "@/components/organization/athlete-info/org-athlete-health-edit-modal";
import { OrgAthletePhysicalProfileEditModal } from "@/components/organization/athlete-info/org-athlete-physical-profile-edit-modal";
import { OrgAthleteResidenceEditModal } from "@/components/organization/athlete-info/org-athlete-residence-edit-modal";
import { OrgAthleteVideosEditModal } from "@/components/organization/athlete-info/org-athlete-videos-edit-modal";
import { AthleteMedicalTab } from "@/components/organization/athlete-medical-tab";
import { AthleteEvaluationsTable } from "@/components/organization/evaluations-table";
import { OrgAchievementEditModal } from "@/components/organization/org-achievement-edit-modal";
import { ProfileImageUpload } from "@/components/organization/profile-image-upload";
import { SessionsListTable } from "@/components/organization/sessions-list-table";
import { TrainingSessionsModal } from "@/components/organization/training-sessions-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailtoLink, WhatsAppLink } from "@/components/ui/contact-links";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { LevelBadge } from "@/components/ui/level-badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user/user-avatar";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface AthleteProfileProps {
	athleteId: string;
}

const attendanceStatusColors: Record<string, string> = {
	present: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	absent: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
	late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
	excused: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

export function AthleteProfile({ athleteId }: AthleteProfileProps) {
	const t = useTranslations("athletes");
	const utils = trpc.useUtils();
	const { data, isLoading, error } =
		trpc.organization.athlete.getProfile.useQuery({ id: athleteId });

	const { data: teams } = trpc.organization.team.listByAthlete.useQuery(
		{ athleteId },
		{ enabled: !!athleteId },
	);

	const { data: achievements } =
		trpc.organization.athlete.listAchievements.useQuery(
			{ athleteId },
			{ enabled: !!athleteId },
		);

	const updateSessionStatusMutation =
		trpc.organization.trainingSession.bulkUpdateStatus.useMutation({
			onSuccess: () => {
				toast.success(t("groups.profile.actions.statusChanged"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteSessionMutation =
		trpc.organization.trainingSession.delete.useMutation({
			onSuccess: () => {
				toast.success(t("groups.success.sessionDeleted"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteAttendanceMutation =
		trpc.organization.attendance.delete.useMutation({
			onSuccess: () => {
				toast.success(t("attendance.deleted"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deletePhysicalMetricsMutation =
		trpc.organization.athlete.deletePhysicalMetrics.useMutation({
			onSuccess: () => {
				toast.success(t("physical.deleted"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteFitnessTestMutation =
		trpc.organization.athlete.deleteFitnessTest.useMutation({
			onSuccess: () => {
				toast.success(t("fitness.deleted"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const removeTeamMemberMutation =
		trpc.organization.team.removeMembers.useMutation({
			onSuccess: () => {
				toast.success(t("teams.removed"));
				utils.organization.team.listByAthlete.invalidate({ athleteId });
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteCareerHistoryMutation =
		trpc.organization.athlete.deleteCareerHistory.useMutation({
			onSuccess: () => {
				toast.success(t("career.deleted"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteWellnessSurveyMutation =
		trpc.organization.athleteWellness.deleteForAthlete.useMutation({
			onSuccess: () => {
				toast.success(t("wellness.deleted"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteAchievementMutation =
		trpc.organization.athlete.deleteAchievement.useMutation({
			onSuccess: () => {
				toast.success(t("achievements.deleted"));
				utils.organization.athlete.listAchievements.invalidate({ athleteId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteEducationMutation =
		trpc.organization.athlete.deleteEducation.useMutation({
			onSuccess: () => {
				toast.success(t("education.deleted"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	if (isLoading) {
		return <AthleteProfileSkeleton />;
	}

	if (error || !data) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">{t("notFound")}</p>
				</CardContent>
			</Card>
		);
	}

	const {
		athlete,
		groups,
		sessions,
		attendanceRecords,
		evaluations,
		stats,
		physicalMetrics,
		fitnessTests,
		careerHistory,
		wellnessSurveys,
		education,
	} = data;

	const age = athlete.birthDate
		? differenceInYears(new Date(), new Date(athlete.birthDate))
		: null;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					{athlete.user ? (
						<ProfileImageUpload
							userId={athlete.user.id}
							userName={athlete.user.name ?? ""}
							currentImageUrl={
								athlete.user.imageKey ? undefined : athlete.user.image
							}
							hasS3Image={!!athlete.user.imageKey}
							size="sm"
						/>
					) : (
						<UserAvatar className="size-16" name="" src={undefined} />
					)}
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-bold text-2xl">
								{athlete.user?.name ?? "Unknown"}
							</h1>
							<StatusBadge status={athlete.status} />
							<LevelBadge level={athlete.level} />
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
							<div className="flex items-center gap-1">
								<MedalIcon className="size-4" />
								<span>{athlete.sport}</span>
							</div>
							{age && (
								<div className="flex items-center gap-1">
									<UserIcon className="size-4" />
									<span>
										{age} {t("yearsOld")}
									</span>
								</div>
							)}
							{athlete.phone && (
								<WhatsAppLink
									phone={athlete.phone}
									variant="whatsapp"
									className="text-sm"
									iconSize="size-3.5"
								/>
							)}
							{athlete.user?.email && (
								<MailtoLink
									email={athlete.user.email}
									className="text-sm"
									iconSize="size-3.5"
								/>
							)}
						</div>
						{groups.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-1">
								{groups.map((group) => (
									<Badge key={group.id} variant="outline">
										<UsersIcon className="mr-1 size-3" />
										{group.name}
									</Badge>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Stats Overview */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("stats.totalSessions")}
						</CardTitle>
						<CalendarIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.totalSessions}</div>
						<p className="text-muted-foreground text-xs">
							{t("stats.completedUpcoming", {
								completed: stats.completedSessions,
								upcoming: stats.upcomingSessions,
							})}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("stats.attendanceRate")}
						</CardTitle>
						<PercentIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.attendance.rate}%</div>
						<Progress value={stats.attendance.rate} className="mt-2 h-2" />
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("stats.avgPerformance")}
						</CardTitle>
						<TrendingUpIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-1">
							<StarIcon className="size-5 fill-yellow-400 text-yellow-400" />
							<span className="font-bold text-2xl">
								{stats.ratings.performance > 0
									? stats.ratings.performance
									: "-"}
							</span>
							<span className="text-muted-foreground text-sm">/5</span>
						</div>
						<p className="text-muted-foreground text-xs">
							{stats.ratings.count} {t("stats.evaluations")}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("stats.attendanceSummary")}
						</CardTitle>
						<CheckCircleIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2 text-xs">
							<Badge variant="outline" className="bg-green-50">
								{t("stats.present")}: {stats.attendance.present}
							</Badge>
							<Badge variant="outline" className="bg-yellow-50">
								{t("stats.late")}: {stats.attendance.late}
							</Badge>
							<Badge variant="outline" className="bg-red-50">
								{t("stats.absent")}: {stats.attendance.absent}
							</Badge>
							<Badge variant="outline" className="bg-blue-50">
								{t("stats.excused")}: {stats.attendance.excused}
							</Badge>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Tabs */}
			<Tabs defaultValue="info" className="space-y-4">
				<div className="overflow-x-auto pb-2 -mb-2">
					<TabsList className="inline-flex w-max">
						<TabsTrigger value="info">
							<UserIcon className="mr-1 size-3.5" />
							{t("tabs.info")}
						</TabsTrigger>
						<TabsTrigger value="sessions">
							{t("tabs.sessions")} ({sessions.length})
						</TabsTrigger>
						<TabsTrigger value="evaluations">
							{t("tabs.evaluations")} ({evaluations.length})
						</TabsTrigger>
						<TabsTrigger value="attendance">
							{t("tabs.attendance")} ({attendanceRecords.length})
						</TabsTrigger>
						<TabsTrigger value="physical">
							<RulerIcon className="mr-1 size-3.5" />
							{t("tabs.physical")} ({physicalMetrics?.length ?? 0})
						</TabsTrigger>
						<TabsTrigger value="fitness">
							<ActivityIcon className="mr-1 size-3.5" />
							{t("tabs.fitness")} ({fitnessTests?.length ?? 0})
						</TabsTrigger>
						<TabsTrigger value="career">
							<BriefcaseIcon className="mr-1 size-3.5" />
							{t("tabs.career")} ({careerHistory?.length ?? 0})
						</TabsTrigger>
						<TabsTrigger value="achievements">
							<TrophyIcon className="mr-1 size-3.5" />
							{t("tabs.achievements")} ({achievements?.length ?? 0})
						</TabsTrigger>
						<TabsTrigger value="teams">
							<ShieldIcon className="mr-1 size-3.5" />
							{t("tabs.teams")} ({teams?.length ?? 0})
						</TabsTrigger>
						<TabsTrigger value="wellness">
							<HeartPulseIcon className="mr-1 size-3.5" />
							{t("tabs.wellness")} ({wellnessSurveys?.length ?? 0})
						</TabsTrigger>
						<TabsTrigger value="medical">
							<FileHeartIcon className="mr-1 size-3.5" />
							{t("tabs.medical")}
						</TabsTrigger>
						<TabsTrigger value="education">
							<GraduationCapIcon className="mr-1 size-3.5" />
							{t("tabs.education")} ({education?.length ?? 0})
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="sessions" className="space-y-4">
					<div className="flex justify-end">
						<Button
							size="sm"
							onClick={() =>
								NiceModal.show(TrainingSessionsModal, {
									initialAthleteIds: [athleteId],
								})
							}
						>
							<PlusIcon className="mr-2 size-4" />
							{t("sessions.newSession")}
						</Button>
					</div>
					<SessionsListTable
						sessions={sessions}
						initialAthleteIds={[athleteId]}
						emptyStateMessage={t("sessions.noSessions")}
						maxItems={20}
						onAddEvaluation={(sessionId) => {
							const completedSessions = sessions
								.filter((s) => s.status === "completed")
								.map((s) => ({
									id: s.id,
									title: s.title,
									startTime: new Date(s.startTime),
									status: s.status,
								}));
							NiceModal.show(AddEvaluationModal, {
								athleteId,
								athleteName: athlete.user?.name,
								sessions: completedSessions,
								initialSessionId: sessionId,
							});
						}}
						onAddAttendance={(sessionId) => {
							const availableSessions = sessions
								.filter((s) => s.status !== "cancelled")
								.map((s) => ({
									id: s.id,
									title: s.title,
									startTime: new Date(s.startTime),
									status: s.status,
								}));
							NiceModal.show(AddAttendanceModal, {
								athleteId,
								athleteName: athlete.user?.name,
								sessions: availableSessions,
								initialSessionId: sessionId,
							});
						}}
						onChangeStatus={(sessionId, status) => {
							updateSessionStatusMutation.mutate({
								ids: [sessionId],
								status: status as
									| "pending"
									| "confirmed"
									| "completed"
									| "cancelled",
							});
						}}
						onDeleteSession={(sessionId, sessionTitle) => {
							NiceModal.show(ConfirmationModal, {
								title: t("groups.profile.deleteSession.title"),
								message: t("groups.profile.deleteSession.message", {
									name: sessionTitle,
								}),
								confirmLabel: t("groups.profile.deleteSession.confirm"),
								destructive: true,
								onConfirm: () =>
									deleteSessionMutation.mutate({ id: sessionId }),
							});
						}}
					/>
				</TabsContent>

				<TabsContent value="evaluations" className="space-y-4">
					<AthleteEvaluationsTable
						athleteId={athleteId}
						athleteName={athlete.user?.name}
						evaluations={evaluations}
						sessions={sessions
							.filter((s) => s.status === "completed")
							.map((s) => ({
								id: s.id,
								title: s.title,
								startTime: new Date(s.startTime),
								status: s.status,
							}))}
						onEvaluationDeleted={() =>
							utils.organization.athlete.getProfile.invalidate({
								id: athleteId,
							})
						}
					/>
				</TabsContent>

				<TabsContent value="attendance" className="space-y-4">
					<div className="flex justify-end">
						<Button
							size="sm"
							onClick={() => {
								const availableSessions = sessions
									.filter((s) => s.status !== "cancelled")
									.map((s) => ({
										id: s.id,
										title: s.title,
										startTime: new Date(s.startTime),
										status: s.status,
									}));
								NiceModal.show(AddAttendanceModal, {
									athleteId,
									athleteName: athlete.user?.name,
									sessions: availableSessions,
								});
							}}
						>
							<PlusIcon className="mr-2 size-4" />
							{t("attendance.addAttendance")}
						</Button>
					</div>
					{attendanceRecords.length === 0 ? (
						<EmptyState
							icon={CheckCircleIcon}
							title={t("attendance.noRecords")}
						/>
					) : (
						<div className="rounded-lg border">
							<table className="w-full">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("attendance.table.session")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("attendance.table.date")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("attendance.table.status")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
											{t("attendance.table.checkedIn")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
											{t("attendance.table.notes")}
										</th>
										<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
											<span className="sr-only">
												{t("attendance.table.actions")}
											</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{attendanceRecords.map((record) => (
										<tr key={record.id} className="hover:bg-muted/30">
											<td className="px-4 py-3">
												<Link
													href={`/dashboard/organization/training-sessions/${record.session.id}`}
													className="font-medium text-sm hover:underline"
												>
													{record.session.title}
												</Link>
											</td>
											<td className="px-4 py-3 text-sm">
												{format(
													new Date(record.session.startTime),
													"dd MMM yyyy",
												)}
											</td>
											<td className="px-4 py-3">
												<Badge
													className={cn(
														"border-none",
														attendanceStatusColors[record.status],
													)}
												>
													{t(`attendance.statuses.${record.status}`)}
												</Badge>
											</td>
											<td className="hidden px-4 py-3 text-sm sm:table-cell">
												{record.checkedInAt ? (
													<span className="flex items-center gap-1 text-muted-foreground">
														<ClockIcon className="size-3.5" />
														{format(new Date(record.checkedInAt), "h:mm a")}
													</span>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</td>
											<td className="hidden px-4 py-3 text-sm md:table-cell">
												{record.notes ? (
													<span className="max-w-[200px] truncate block text-muted-foreground">
														{record.notes}
													</span>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</td>
											<td className="px-4 py-3">
												<div className="flex justify-end">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																className="size-8 text-muted-foreground data-[state=open]:bg-muted"
																size="icon"
																variant="ghost"
															>
																<MoreHorizontalIcon className="shrink-0" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => {
																	const availableSessions = sessions
																		.filter((s) => s.status !== "cancelled")
																		.map((s) => ({
																			id: s.id,
																			title: s.title,
																			startTime: new Date(s.startTime),
																			status: s.status,
																		}));
																	NiceModal.show(AddAttendanceModal, {
																		athleteId,
																		athleteName: athlete.user?.name,
																		sessions: availableSessions,
																		initialSessionId: record.session.id,
																		initialValues: {
																			status: record.status,
																			notes: record.notes ?? "",
																		},
																	});
																}}
															>
																<PencilIcon className="mr-2 size-4" />
																{t("attendance.actions.edit")}
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																variant="destructive"
																onClick={() => {
																	NiceModal.show(ConfirmationModal, {
																		title: t("attendance.deleteConfirm.title"),
																		message: t(
																			"attendance.deleteConfirm.message",
																			{ name: record.session.title },
																		),
																		confirmLabel: t(
																			"attendance.deleteConfirm.confirm",
																		),
																		destructive: true,
																		onConfirm: () =>
																			deleteAttendanceMutation.mutate({
																				id: record.id,
																			}),
																	});
																}}
															>
																<Trash2Icon className="mr-2 size-4" />
																{t("attendance.actions.delete")}
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</TabsContent>

				{/* Physical Metrics Tab */}
				<TabsContent value="physical" className="space-y-6">
					{/* Physical Profile Card */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="flex items-center gap-2 text-base">
								<RulerIcon className="size-4" />
								{t("physical.profileTitle")}
							</CardTitle>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => {
									NiceModal.show(OrgAthletePhysicalProfileEditModal, {
										athleteId,
										height: athlete.height,
										wingspan: athlete.wingspan,
										standingReach: athlete.standingReach,
										dominantFoot: athlete.dominantFoot,
										dominantHand: athlete.dominantHand,
									});
								}}
							>
								<PencilIcon className="size-4" />
							</Button>
						</CardHeader>
						<CardContent>
							{!athlete.height &&
							!athlete.wingspan &&
							!athlete.standingReach &&
							!athlete.dominantFoot &&
							!athlete.dominantHand ? (
								<p className="py-6 text-center text-muted-foreground">
									{t("physical.noProfile")}
								</p>
							) : (
								<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
									<div>
										<p className="text-muted-foreground text-xs">
											{t("physical.height")}
										</p>
										<p className="font-medium">
											{athlete.height ? `${athlete.height} cm` : "-"}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">
											{t("physical.wingspan")}
										</p>
										<p className="font-medium">
											{athlete.wingspan ? `${athlete.wingspan} cm` : "-"}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">
											{t("physical.standingReach")}
										</p>
										<p className="font-medium">
											{athlete.standingReach
												? `${athlete.standingReach} cm`
												: "-"}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">
											{t("physical.dominantFoot")}
										</p>
										<p className="font-medium capitalize">
											{athlete.dominantFoot
												? t(`physical.${athlete.dominantFoot}`)
												: "-"}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">
											{t("physical.dominantHand")}
										</p>
										<p className="font-medium capitalize">
											{athlete.dominantHand
												? t(`physical.${athlete.dominantHand}`)
												: "-"}
										</p>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Body Composition History */}
					<div className="space-y-4">
						<div className="flex items-center justify-end">
							<Button
								size="sm"
								onClick={() => {
									NiceModal.show(AddPhysicalMetricsModal, { athleteId });
								}}
							>
								<PlusIcon className="mr-1 size-4" />
								{t("physical.addMeasurement")}
							</Button>
						</div>

						{!physicalMetrics || physicalMetrics.length === 0 ? (
							<EmptyState icon={WeightIcon} title={t("physical.noMetrics")} />
						) : (
							<div className="overflow-hidden rounded-lg border">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/50">
											<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
												{t("physical.table.date")}
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
												{t("physical.table.weight")}
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
												{t("physical.table.bodyFat")}
											</th>
											<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
												{t("physical.table.muscleMass")}
											</th>
											<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
												{t("physical.table.notes")}
											</th>
											<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
												{t("physical.table.actions")}
											</th>
										</tr>
									</thead>
									<tbody className="divide-y">
										{physicalMetrics.map((metric) => (
											<tr
												key={metric.id}
												className="transition-colors hover:bg-muted/30"
											>
												<td className="px-4 py-3 font-medium">
													{format(new Date(metric.measuredAt), "MMM d, yyyy")}
												</td>
												<td className="px-4 py-3">
													{metric.weight
														? `${(metric.weight / 1000).toFixed(1)} kg`
														: "-"}
												</td>
												<td className="px-4 py-3">
													{metric.bodyFatPercentage
														? `${(metric.bodyFatPercentage / 10).toFixed(1)}%`
														: "-"}
												</td>
												<td className="px-4 py-3">
													{metric.muscleMass
														? `${(metric.muscleMass / 1000).toFixed(1)} kg`
														: "-"}
												</td>
												<td className="hidden max-w-[200px] truncate px-4 py-3 text-muted-foreground md:table-cell">
													{metric.notes || "-"}
												</td>
												<td className="px-4 py-3 text-right">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="size-8"
															>
																<MoreHorizontalIcon className="size-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => {
																	NiceModal.show(AddPhysicalMetricsModal, {
																		athleteId,
																		initialValues: {
																			id: metric.id,
																			measuredAt: metric.measuredAt,
																			weight: metric.weight,
																			bodyFatPercentage:
																				metric.bodyFatPercentage,
																			muscleMass: metric.muscleMass,
																			notes: metric.notes,
																		},
																	});
																}}
															>
																<PencilIcon className="mr-2 size-4" />
																{t("physical.actions.edit")}
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																className="text-destructive"
																onClick={() => {
																	NiceModal.show(ConfirmationModal, {
																		title: t("physical.deleteConfirm.title"),
																		message: t(
																			"physical.deleteConfirm.message",
																			{
																				date: format(
																					new Date(metric.measuredAt),
																					"MMM d, yyyy",
																				),
																			},
																		),
																		confirmLabel: t(
																			"physical.deleteConfirm.confirm",
																		),
																		onConfirm: () => {
																			deletePhysicalMetricsMutation.mutate({
																				id: metric.id,
																				athleteId,
																			});
																		},
																	});
																}}
															>
																<Trash2Icon className="mr-2 size-4" />
																{t("physical.actions.delete")}
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</TabsContent>

				{/* Fitness Tests Tab */}
				<TabsContent value="fitness" className="space-y-4">
					<div className="flex justify-end">
						<Button
							size="sm"
							onClick={() => {
								NiceModal.show(AddFitnessTestModal, { athleteId });
							}}
						>
							<PlusIcon className="mr-1 size-4" />
							{t("fitness.addTest")}
						</Button>
					</div>
					{!fitnessTests || fitnessTests.length === 0 ? (
						<EmptyState icon={ActivityIcon} title={t("fitness.noTests")} />
					) : (
						<div className="rounded-lg border">
							<table className="w-full">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("fitness.table.testType")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("fitness.table.date")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("fitness.table.result")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
											{t("fitness.table.notes")}
										</th>
										<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
											<span className="sr-only">
												{t("fitness.table.actions")}
											</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{fitnessTests.map((test) => (
										<tr key={test.id} className="hover:bg-muted/30">
											<td className="px-4 py-3">
												<span className="font-medium text-sm">
													{t(`fitness.testTypes.${test.testType}`)}
												</span>
											</td>
											<td className="px-4 py-3 text-sm">
												{format(new Date(test.testDate), "dd MMM yyyy")}
											</td>
											<td className="px-4 py-3">
												<span className="font-semibold tabular-nums">
													{test.result}
												</span>
												<span className="ml-1 text-muted-foreground text-sm">
													{test.unit}
												</span>
											</td>
											<td className="hidden px-4 py-3 text-sm md:table-cell">
												{test.notes ? (
													<span className="max-w-[200px] truncate block text-muted-foreground">
														{test.notes}
													</span>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</td>
											<td className="px-4 py-3">
												<div className="flex justify-end">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																className="size-8 text-muted-foreground data-[state=open]:bg-muted"
																size="icon"
																variant="ghost"
															>
																<MoreHorizontalIcon className="shrink-0" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => {
																	NiceModal.show(AddFitnessTestModal, {
																		athleteId,
																		initialValues: {
																			id: test.id,
																			testType: test.testType,
																			testDate: test.testDate,
																			result: test.result,
																			unit: test.unit,
																			notes: test.notes,
																		},
																	});
																}}
															>
																<PencilIcon className="mr-2 size-4" />
																{t("fitness.actions.edit")}
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																variant="destructive"
																onClick={() => {
																	NiceModal.show(ConfirmationModal, {
																		title: t("fitness.deleteConfirm.title"),
																		message: t(
																			"fitness.deleteConfirm.message",
																			{
																				name: t(
																					`fitness.testTypes.${test.testType}`,
																				),
																			},
																		),
																		confirmLabel: t(
																			"fitness.deleteConfirm.confirm",
																		),
																		destructive: true,
																		onConfirm: () => {
																			deleteFitnessTestMutation.mutate({
																				id: test.id,
																				athleteId,
																			});
																		},
																	});
																}}
															>
																<Trash2Icon className="mr-2 size-4" />
																{t("fitness.actions.delete")}
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</TabsContent>

				{/* Career History Tab */}
				<TabsContent value="career" className="space-y-4">
					<div className="flex items-center justify-end">
						<Button
							size="sm"
							onClick={() => {
								NiceModal.show(AddCareerHistoryModal, { athleteId });
							}}
						>
							<PlusIcon className="mr-1 size-4" />
							{t("career.addEntry")}
						</Button>
					</div>

					{!careerHistory || careerHistory.length === 0 ? (
						<EmptyState icon={BriefcaseIcon} title={t("career.noHistory")} />
					) : (
						<div className="overflow-hidden rounded-lg border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("career.table.team")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("career.table.period")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
											{t("career.table.position")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">
											{t("career.table.achievements")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("career.table.type")}
										</th>
										<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
											{t("career.table.actions")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{careerHistory.map((entry) => (
										<tr
											key={entry.id}
											className="transition-colors hover:bg-muted/30"
										>
											<td className="px-4 py-3">
												<div className="font-medium">
													{entry.club?.name || entry.nationalTeam?.name || "-"}
												</div>
												{entry.nationalTeam?.category && (
													<span className="text-muted-foreground text-xs">
														{entry.nationalTeam.category}
													</span>
												)}
											</td>
											<td className="px-4 py-3 text-muted-foreground">
												{entry.startDate
													? format(new Date(entry.startDate), "MMM yyyy")
													: "?"}
												{" — "}
												{entry.endDate
													? format(new Date(entry.endDate), "MMM yyyy")
													: t("career.present")}
											</td>
											<td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
												{entry.position || "-"}
											</td>
											<td className="hidden max-w-[200px] truncate px-4 py-3 text-muted-foreground lg:table-cell">
												{entry.achievements || "-"}
											</td>
											<td className="px-4 py-3">
												{entry.nationalTeam ? (
													<Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
														<FlagIcon className="mr-1 size-3" />
														{t("career.types.national")}
													</Badge>
												) : (
													<Badge variant="secondary">
														{t("career.types.club")}
													</Badge>
												)}
											</td>
											<td className="px-4 py-3 text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="size-8"
														>
															<MoreHorizontalIcon className="size-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => {
																NiceModal.show(AddCareerHistoryModal, {
																	athleteId,
																	initialValues: {
																		id: entry.id,
																		clubId: entry.clubId,
																		nationalTeamId: entry.nationalTeamId,
																		startDate: entry.startDate,
																		endDate: entry.endDate,
																		position: entry.position,
																		achievements: entry.achievements,
																		notes: entry.notes,
																	},
																});
															}}
														>
															<PencilIcon className="mr-2 size-4" />
															{t("career.actions.edit")}
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive"
															onClick={() => {
																NiceModal.show(ConfirmationModal, {
																	title: t("career.deleteConfirm.title"),
																	message: t("career.deleteConfirm.message", {
																		clubName:
																			entry.club?.name ||
																			entry.nationalTeam?.name ||
																			"-",
																	}),
																	confirmLabel: t(
																		"career.deleteConfirm.confirm",
																	),
																	onConfirm: () => {
																		deleteCareerHistoryMutation.mutate({
																			id: entry.id,
																		});
																	},
																});
															}}
														>
															<Trash2Icon className="mr-2 size-4" />
															{t("career.actions.delete")}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</TabsContent>

				{/* Achievements Tab */}
				<TabsContent value="achievements" className="space-y-4">
					<div className="flex items-center justify-end">
						<Button
							size="sm"
							onClick={() => {
								NiceModal.show(OrgAchievementEditModal, { athleteId });
							}}
						>
							<PlusIcon className="mr-1 size-4" />
							{t("achievements.addEntry")}
						</Button>
					</div>

					{!achievements || achievements.length === 0 ? (
						<EmptyState
							icon={TrophyIcon}
							title={t("achievements.noAchievements")}
						/>
					) : (
						<div className="overflow-hidden rounded-lg border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("achievements.table.title")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("achievements.table.type")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
											{t("achievements.table.year")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
											{t("achievements.table.competition")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">
											{t("achievements.table.position")}
										</th>
										<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
											{t("achievements.table.actions")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{achievements.map((achievement) => (
										<tr
											key={achievement.id}
											className="transition-colors hover:bg-muted/30"
										>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													<TrophyIcon className="size-4 text-amber-500" />
													<span className="font-medium">
														{achievement.title}
													</span>
												</div>
											</td>
											<td className="px-4 py-3">
												<Badge variant="secondary">
													{t(`achievements.types.${achievement.type}`)}
												</Badge>
											</td>
											<td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
												{achievement.year}
											</td>
											<td className="hidden max-w-[200px] truncate px-4 py-3 text-muted-foreground md:table-cell">
												{achievement.competition || "-"}
											</td>
											<td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
												{achievement.position || "-"}
											</td>
											<td className="px-4 py-3 text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="size-8"
														>
															<MoreHorizontalIcon className="size-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => {
																NiceModal.show(OrgAchievementEditModal, {
																	athleteId,
																	entry: {
																		id: achievement.id,
																		title: achievement.title,
																		type: achievement.type,
																		scope: achievement.scope,
																		year: achievement.year,
																		organization: achievement.organization,
																		team: achievement.team,
																		competition: achievement.competition,
																		position: achievement.position,
																		description: achievement.description,
																		isPublic: achievement.isPublic,
																	},
																});
															}}
														>
															<PencilIcon className="mr-2 size-4" />
															{t("achievements.actions.edit")}
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive"
															onClick={() => {
																NiceModal.show(ConfirmationModal, {
																	title: t("achievements.deleteConfirm.title"),
																	message: t(
																		"achievements.deleteConfirm.message",
																		{
																			title: achievement.title,
																		},
																	),
																	confirmLabel: t(
																		"achievements.deleteConfirm.confirm",
																	),
																	onConfirm: () => {
																		deleteAchievementMutation.mutate({
																			id: achievement.id,
																		});
																	},
																});
															}}
														>
															<Trash2Icon className="mr-2 size-4" />
															{t("achievements.actions.delete")}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</TabsContent>

				{/* Teams Tab */}
				<TabsContent value="teams" className="space-y-4">
					<div className="flex justify-end">
						<Button
							size="sm"
							onClick={() => {
								NiceModal.show(AssignTeamModal, {
									athleteId,
									existingTeamIds: teams?.map((t) => t.id) ?? [],
								});
							}}
						>
							<PlusIcon className="mr-1 size-4" />
							{t("teams.assignToTeam")}
						</Button>
					</div>
					{!teams || teams.length === 0 ? (
						<EmptyState icon={ShieldIcon} title={t("teams.noTeams")} />
					) : (
						<div className="rounded-lg border">
							<table className="w-full">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("teams.table.team")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
											{t("teams.table.season")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("teams.table.role")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
											{t("teams.table.jersey")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
											{t("teams.table.position")}
										</th>
										<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
											<span className="sr-only">
												{t("teams.table.actions")}
											</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{teams.map((team) => (
										<tr key={team.id} className="hover:bg-muted/30">
											<td className="px-4 py-3">
												<Link
													href={`/dashboard/organization/teams/${team.id}`}
													className="flex items-center gap-2.5 hover:underline"
												>
													<span
														className="flex size-7 shrink-0 items-center justify-center rounded-full"
														style={{
															backgroundColor: team.primaryColor ?? "#3B82F6",
														}}
													>
														<ShieldIcon className="size-3.5 text-white" />
													</span>
													<span className="font-medium text-sm">
														{team.name}
													</span>
												</Link>
											</td>
											<td className="hidden px-4 py-3 text-sm md:table-cell">
												{team.season ? (
													<span>{team.season.name}</span>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</td>
											<td className="px-4 py-3">
												<Badge variant="secondary">
													{team.membership.role === "captain"
														? t("captain")
														: team.membership.role === "vice_captain"
															? t("viceCaptain")
															: t("player")}
												</Badge>
											</td>
											<td className="hidden px-4 py-3 text-sm sm:table-cell">
												{team.membership.jerseyNumber ? (
													<Badge variant="outline" className="font-bold">
														#{team.membership.jerseyNumber}
													</Badge>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</td>
											<td className="hidden px-4 py-3 text-sm md:table-cell">
												{team.membership.position ? (
													<span>{team.membership.position}</span>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</td>
											<td className="px-4 py-3">
												<div className="flex justify-end">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																className="size-8 text-muted-foreground data-[state=open]:bg-muted"
																size="icon"
																variant="ghost"
															>
																<MoreHorizontalIcon className="shrink-0" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem asChild>
																<Link
																	href={`/dashboard/organization/teams/${team.id}`}
																>
																	<ShieldIcon className="mr-2 size-4" />
																	{t("teams.actions.viewTeam")}
																</Link>
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																variant="destructive"
																onClick={() => {
																	NiceModal.show(ConfirmationModal, {
																		title: t("teams.removeConfirm.title"),
																		message: t("teams.removeConfirm.message", {
																			name: team.name,
																		}),
																		confirmLabel: t(
																			"teams.removeConfirm.confirm",
																		),
																		destructive: true,
																		onConfirm: () => {
																			removeTeamMemberMutation.mutate({
																				teamId: team.id,
																				athleteIds: [athleteId],
																			});
																		},
																	});
																}}
															>
																<Trash2Icon className="mr-2 size-4" />
																{t("teams.actions.remove")}
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</TabsContent>

				{/* Wellness Tab */}
				<TabsContent value="wellness" className="space-y-4">
					<div className="flex items-center justify-end">
						<Button
							size="sm"
							onClick={() => {
								NiceModal.show(AddWellnessModal, { athleteId });
							}}
						>
							<PlusIcon className="mr-1 size-4" />
							{t("wellness.addSurvey")}
						</Button>
					</div>

					{!wellnessSurveys || wellnessSurveys.length === 0 ? (
						<EmptyState icon={HeartPulseIcon} title={t("wellness.noSurveys")} />
					) : (
						<div className="overflow-hidden rounded-lg border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("wellness.table.date")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("wellness.table.sleep")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("wellness.table.quality")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
											{t("wellness.table.energy")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
											{t("wellness.table.fatigue")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
											{t("wellness.table.soreness")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
											{t("wellness.table.mood")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
											{t("wellness.table.stress")}
										</th>
										<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
											<span className="sr-only">
												{t("wellness.table.actions")}
											</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{wellnessSurveys.map((survey) => (
										<tr key={survey.id} className="hover:bg-muted/30">
											<td className="px-4 py-3 font-medium text-sm">
												{format(new Date(survey.surveyDate), "MMM d, yyyy")}
											</td>
											<td className="px-4 py-3 text-sm">
												{(survey.sleepHours / 60).toFixed(1)}h
											</td>
											<td className="px-4 py-3">
												<span
													className={cn(
														"font-medium text-sm",
														getWellnessScoreColor(survey.sleepQuality),
													)}
												>
													{survey.sleepQuality}/10
												</span>
											</td>
											<td className="hidden px-4 py-3 sm:table-cell">
												<span
													className={cn(
														"font-medium text-sm",
														getWellnessScoreColor(survey.energy),
													)}
												>
													{survey.energy}/10
												</span>
											</td>
											<td className="hidden px-4 py-3 sm:table-cell">
												<span
													className={cn(
														"font-medium text-sm",
														getWellnessScoreColor(survey.fatigue, true),
													)}
												>
													{survey.fatigue}/10
												</span>
											</td>
											<td className="hidden px-4 py-3 md:table-cell">
												<span
													className={cn(
														"font-medium text-sm",
														getWellnessScoreColor(survey.muscleSoreness, true),
													)}
												>
													{survey.muscleSoreness}/10
												</span>
											</td>
											<td className="hidden px-4 py-3 md:table-cell">
												<span
													className={cn(
														"font-medium text-sm",
														getWellnessScoreColor(survey.mood),
													)}
												>
													{getMoodEmoji(survey.mood)} {survey.mood}/10
												</span>
											</td>
											<td className="hidden px-4 py-3 md:table-cell">
												<span
													className={cn(
														"font-medium text-sm",
														getWellnessScoreColor(survey.stressLevel, true),
													)}
												>
													{survey.stressLevel}/10
												</span>
											</td>
											<td className="px-4 py-3">
												<div className="flex justify-end">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																className="size-8 text-muted-foreground data-[state=open]:bg-muted"
																size="icon"
																variant="ghost"
															>
																<MoreHorizontalIcon className="shrink-0" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																onClick={() => {
																	NiceModal.show(AddWellnessModal, {
																		athleteId,
																		initialValues: {
																			id: survey.id,
																			surveyDate: survey.surveyDate,
																			sleepHours: survey.sleepHours,
																			sleepQuality: survey.sleepQuality,
																			fatigue: survey.fatigue,
																			muscleSoreness: survey.muscleSoreness,
																			mood: survey.mood,
																			stressLevel: survey.stressLevel,
																			energy: survey.energy,
																			notes: survey.notes,
																		},
																	});
																}}
															>
																<PencilIcon className="mr-2 size-4" />
																{t("wellness.actions.edit")}
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																variant="destructive"
																onClick={() => {
																	NiceModal.show(ConfirmationModal, {
																		title: t("wellness.deleteConfirm.title"),
																		message: t(
																			"wellness.deleteConfirm.message",
																		),
																		confirmLabel: t(
																			"wellness.deleteConfirm.confirm",
																		),
																		destructive: true,
																		onConfirm: () => {
																			deleteWellnessSurveyMutation.mutate({
																				id: survey.id,
																				athleteId,
																			});
																		},
																	});
																}}
															>
																<Trash2Icon className="mr-2 size-4" />
																{t("wellness.actions.delete")}
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</TabsContent>

				{/* Medical Tab */}
				<TabsContent value="medical">
					<AthleteMedicalTab
						athleteId={athleteId}
						hasMedicalCertificate={!!athlete.medicalCertificateKey}
						medicalCertificateUploadedAt={athlete.medicalCertificateUploadedAt}
						medicalCertificateExpiresAt={athlete.medicalCertificateExpiresAt}
					/>
				</TabsContent>

				{/* Education Tab */}
				<TabsContent value="education" className="space-y-4">
					<div className="flex items-center justify-end">
						<Button
							size="sm"
							onClick={() => {
								NiceModal.show(OrgAthleteEducationEditModal, { athleteId });
							}}
						>
							<PlusIcon className="mr-1 size-4" />
							{t("education.addEducation")}
						</Button>
					</div>

					{!education || education.length === 0 ? (
						<EmptyState
							icon={GraduationCapIcon}
							title={t("education.noEducation")}
							description={t("education.noEducationDescription")}
						/>
					) : (
						<div className="space-y-4">
							{education.map((edu) => (
								<Card key={edu.id} className="relative">
									<CardContent className="pt-6">
										<div className="flex items-start justify-between gap-4">
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<h4 className="font-semibold">{edu.institution}</h4>
													{edu.isCurrent && (
														<Badge variant="secondary">
															{t("education.current")}
														</Badge>
													)}
												</div>
												<p className="text-muted-foreground text-sm">
													{edu.degree}
													{edu.fieldOfStudy && (
														<span> &bull; {edu.fieldOfStudy}</span>
													)}
												</p>
												<p className="text-muted-foreground text-xs">
													{edu.startDate
														? format(new Date(edu.startDate), "MMM yyyy")
														: t("education.unknown")}
													{" - "}
													{edu.isCurrent
														? t("education.present")
														: edu.endDate
															? format(new Date(edu.endDate), "MMM yyyy")
															: t("education.unknown")}
												</p>
												{edu.gpa && (
													<p className="text-muted-foreground text-xs">
														{t("education.gpaLabel")}: {edu.gpa}
													</p>
												)}
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="size-8"
													>
														<MoreHorizontalIcon className="size-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => {
															NiceModal.show(OrgAthleteEducationEditModal, {
																athleteId,
																entry: {
																	id: edu.id,
																	institution: edu.institution,
																	degree: edu.degree,
																	fieldOfStudy: edu.fieldOfStudy,
																	academicYear: edu.academicYear,
																	startDate: edu.startDate
																		? new Date(edu.startDate)
																		: null,
																	endDate: edu.endDate
																		? new Date(edu.endDate)
																		: null,
																	expectedGraduationDate:
																		edu.expectedGraduationDate
																			? new Date(edu.expectedGraduationDate)
																			: null,
																	gpa: edu.gpa,
																	isCurrent: edu.isCurrent,
																	notes: edu.notes,
																},
															});
														}}
													>
														<PencilIcon className="mr-2 size-4" />
														{t("education.editEducation")}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="text-destructive"
														onClick={() => {
															NiceModal.show(ConfirmationModal, {
																title: t("education.deleteConfirmTitle"),
																message: t("education.deleteConfirmDesc"),
																confirmLabel: t("education.deleteConfirm"),
																onConfirm: () => {
																	deleteEducationMutation.mutate({
																		id: edu.id,
																	});
																},
															});
														}}
													>
														<Trash2Icon className="mr-2 size-4" />
														{t("education.deleteEducation")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
										{edu.notes && (
											<div className="mt-3">
												<p className="text-muted-foreground text-xs font-medium">
													{t("education.notesLabel")}
												</p>
												<p className="text-sm">{edu.notes}</p>
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				{/* Info Tab - Additional Profile Information */}
				<TabsContent value="info">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Contact & Residence Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<PhoneIcon className="size-4" />
									{t("info.contactResidence")}
								</CardTitle>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										NiceModal.show(OrgAthleteContactEditModal, {
											athleteId,
											phone: athlete.phone,
											parentName: athlete.parentName,
											parentRelationship: athlete.parentRelationship,
											parentPhone: athlete.parentPhone,
											parentEmail: athlete.parentEmail,
										})
									}
								>
									<PencilIcon className="size-4" />
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								{athlete.phone && (
									<div>
										<p className="text-muted-foreground text-xs">
											{t("info.phone")}
										</p>
										<WhatsAppLink
											phone={athlete.phone}
											variant="whatsapp"
											className="font-medium"
										/>
									</div>
								)}
								{athlete.parentName && (
									<div className="pt-2 border-t">
										<p className="text-muted-foreground text-xs font-medium mb-2">
											{t("info.parentContact")}
										</p>
										<div className="space-y-2">
											<div>
												<p className="text-muted-foreground text-xs">
													{t("info.name")}
												</p>
												<p className="font-medium">{athlete.parentName}</p>
											</div>
											{athlete.parentRelationship && (
												<div>
													<p className="text-muted-foreground text-xs">
														{t("info.relationship")}
													</p>
													<p className="font-medium capitalize">
														{athlete.parentRelationship}
													</p>
												</div>
											)}
											{athlete.parentPhone && (
												<div>
													<p className="text-muted-foreground text-xs">
														{t("info.phone")}
													</p>
													<WhatsAppLink
														phone={athlete.parentPhone}
														variant="whatsapp"
														className="font-medium"
													/>
												</div>
											)}
											{athlete.parentEmail && (
												<div>
													<p className="text-muted-foreground text-xs">Email</p>
													<MailtoLink
														email={athlete.parentEmail}
														className="font-medium"
													/>
												</div>
											)}
										</div>
									</div>
								)}
								{!athlete.phone && !athlete.parentName && (
									<EmptyState
										icon={PhoneIcon}
										title={t("info.noContactInfo")}
										size="sm"
									/>
								)}
							</CardContent>
						</Card>

						{/* Residence Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<MapPinIcon className="size-4" />
									{t("info.residence")}
								</CardTitle>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										NiceModal.show(OrgAthleteResidenceEditModal, {
											athleteId,
											residenceCity: athlete.residenceCity,
											residenceCountry: athlete.residenceCountry,
											nationality: athlete.nationality,
										})
									}
								>
									<PencilIcon className="size-4" />
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								{(athlete.residenceCity || athlete.residenceCountry) && (
									<div>
										<p className="text-muted-foreground text-xs">
											{t("info.residence")}
										</p>
										<p className="font-medium">
											{[athlete.residenceCity, athlete.residenceCountry]
												.filter(Boolean)
												.join(", ")}
										</p>
									</div>
								)}
								{athlete.nationality && (
									<div>
										<p className="text-muted-foreground text-xs">
											{t("info.nationality")}
										</p>
										<p className="font-medium">{athlete.nationality}</p>
									</div>
								)}
								{!athlete.residenceCity &&
									!athlete.residenceCountry &&
									!athlete.nationality && (
										<EmptyState
											icon={MapPinIcon}
											title={t("info.noContactInfo")}
											size="sm"
										/>
									)}
							</CardContent>
						</Card>

						{/* Health & Dietary */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<HeartPulseIcon className="size-4" />
									{t("info.healthDietary")}
								</CardTitle>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										NiceModal.show(OrgAthleteHealthEditModal, {
											athleteId,
											dietaryRestrictions: athlete.dietaryRestrictions,
											allergies: athlete.allergies,
										})
									}
								>
									<PencilIcon className="size-4" />
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								{athlete.dietaryRestrictions && (
									<div>
										<p className="text-muted-foreground text-xs">
											{t("info.dietaryRestrictions")}
										</p>
										<p className="font-medium">{athlete.dietaryRestrictions}</p>
									</div>
								)}
								{athlete.allergies && (
									<div>
										<p className="text-muted-foreground text-xs">
											{t("info.allergies")}
										</p>
										<p className="font-medium text-red-600">
											{athlete.allergies}
										</p>
									</div>
								)}
								{!athlete.dietaryRestrictions && !athlete.allergies && (
									<EmptyState
										icon={HeartPulseIcon}
										title={t("info.noHealthInfo")}
										size="sm"
									/>
								)}
							</CardContent>
						</Card>

						{/* Bio */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<UserIcon className="size-4" />
									{t("info.bioNotes")}
								</CardTitle>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										NiceModal.show(OrgAthleteBioEditModal, {
											athleteId,
											bio: athlete.bio,
										})
									}
								>
									<PencilIcon className="size-4" />
								</Button>
							</CardHeader>
							<CardContent>
								{athlete.bio ? (
									<p className="whitespace-pre-wrap">{athlete.bio}</p>
								) : (
									<EmptyState
										icon={UserIcon}
										title={t("info.bioNotes")}
										size="sm"
									/>
								)}
							</CardContent>
						</Card>

						{/* YouTube Videos */}
						<Card className="md:col-span-2">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<VideoIcon className="size-4" />
									{t("info.featuredVideos")}
								</CardTitle>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										NiceModal.show(OrgAthleteVideosEditModal, {
											athleteId,
											videos: athlete.youtubeVideos ?? [],
										})
									}
								>
									<PencilIcon className="size-4" />
								</Button>
							</CardHeader>
							<CardContent>
								{athlete.youtubeVideos && athlete.youtubeVideos.length > 0 ? (
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										{athlete.youtubeVideos.map((url, index) => {
											const videoId = getYoutubeVideoId(url);
											return (
												<a
													key={`video-${index}`}
													href={url}
													target="_blank"
													rel="noopener noreferrer"
													className="group relative overflow-hidden rounded-lg border"
												>
													{videoId ? (
														<img
															src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
															alt={`Video ${index + 1}`}
															className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
														/>
													) : (
														<div className="aspect-video w-full bg-muted flex items-center justify-center">
															<VideoIcon className="size-8 text-muted-foreground" />
														</div>
													)}
													<div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
														<div className="flex size-12 items-center justify-center rounded-full bg-red-600 text-white">
															▶
														</div>
													</div>
												</a>
											);
										})}
									</div>
								) : (
									<EmptyState
										icon={VideoIcon}
										title={t("info.featuredVideos")}
										size="sm"
									/>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

// Helper function to extract YouTube video ID
function getYoutubeVideoId(url: string): string | null {
	const match = url.match(
		/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/,
	);
	return match?.[1] ?? null;
}

// Helper function to get color based on wellness score
function getWellnessScoreColor(value: number, inverse = false): string {
	const score = inverse ? 11 - value : value;
	if (score <= 3) return "text-red-600";
	if (score <= 5) return "text-yellow-600";
	if (score <= 7) return "text-blue-600";
	return "text-green-600";
}

// Helper function to get mood emoji
function getMoodEmoji(value: number): string {
	if (value <= 2) return "😫";
	if (value <= 4) return "😕";
	if (value <= 6) return "😐";
	if (value <= 8) return "🙂";
	return "😊";
}

function AthleteProfileSkeleton() {
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
