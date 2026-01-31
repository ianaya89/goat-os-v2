"use client";

import NiceModal from "@ebay/nice-modal-react";
import { differenceInYears, format } from "date-fns";
import {
	ArrowLeftIcon,
	BriefcaseIcon,
	CalendarIcon,
	CheckCircleIcon,
	ClipboardListIcon,
	GraduationCapIcon,
	MedalIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PhoneIcon,
	PlusIcon,
	StarIcon,
	Trash2Icon,
	TrendingUpIcon,
	TrophyIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { AddEvaluationModal } from "@/components/organization/add-evaluation-modal";
import { AttendanceMatrix } from "@/components/organization/attendance-matrix";
import { OrgCoachBioEditModal } from "@/components/organization/coach-info/org-coach-bio-edit-modal";
import { OrgCoachContactEditModal } from "@/components/organization/coach-info/org-coach-contact-edit-modal";
import { OrgCoachEducationEditModal } from "@/components/organization/coach-info/org-coach-education-edit-modal";
import { CoachExperienceEditModal } from "@/components/organization/coach-info/org-coach-experience-edit-modal";
import { OrgCoachProfessionalEditModal } from "@/components/organization/coach-info/org-coach-professional-edit-modal";
import { CoachProfileActions } from "@/components/organization/coach-profile-actions";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useSportLabels } from "@/components/ui/sport-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user/user-avatar";
import { trpc } from "@/trpc/client";

interface CoachProfileProps {
	coachId: string;
}

export function CoachProfile({ coachId }: CoachProfileProps) {
	const t = useTranslations("coaches");
	const { getSportLabel } = useSportLabels();
	const utils = trpc.useUtils();
	const { data, isLoading, error } =
		trpc.organization.coach.getProfile.useQuery({ id: coachId });

	const { data: experienceData } =
		trpc.organization.coach.listSportsExperience.useQuery({ coachId });

	const { data: achievementsData } =
		trpc.organization.coach.listAchievements.useQuery({ coachId });

	const { data: educationData } =
		trpc.organization.coach.listEducation.useQuery({ coachId });

	const updateSessionStatusMutation =
		trpc.organization.trainingSession.bulkUpdateStatus.useMutation({
			onSuccess: () => {
				toast.success(t("profile.sessions.statusChanged"));
				utils.organization.coach.getProfile.invalidate({ id: coachId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteSessionMutation =
		trpc.organization.trainingSession.delete.useMutation({
			onSuccess: () => {
				toast.success(t("profile.sessions.deleted"));
				utils.organization.coach.getProfile.invalidate({ id: coachId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const recordAttendanceMutation =
		trpc.organization.attendance.record.useMutation({
			onSuccess: () => {
				utils.organization.coach.getProfile.invalidate({ id: coachId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteEvaluationMutation =
		trpc.organization.athleteEvaluation.delete.useMutation({
			onSuccess: () => {
				toast.success(t("profile.evaluations.deleted"));
				utils.organization.coach.getProfile.invalidate({ id: coachId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteAchievementMutation =
		trpc.organization.coach.deleteAchievement.useMutation({
			onSuccess: () => {
				toast.success(t("achievements.deleted"));
				utils.organization.coach.listAchievements.invalidate({ coachId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	const deleteEducationMutation =
		trpc.organization.coach.deleteEducation.useMutation({
			onSuccess: () => {
				toast.success(t("education.deleteSuccess"));
				utils.organization.coach.listEducation.invalidate({ coachId });
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

	if (isLoading) {
		return <CoachProfileSkeleton />;
	}

	if (error || !data) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">{t("profile.notFound")}</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard/organization/coaches">
							<ArrowLeftIcon className="mr-2 size-4" />
							{t("profile.backToCoaches")}
						</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const { coach, sessions, athletes, evaluations, stats } = data;

	const age = coach.birthDate
		? differenceInYears(new Date(), new Date(coach.birthDate))
		: null;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					{coach.user ? (
						<ProfileImageUpload
							userId={coach.user.id}
							userName={coach.user.name ?? ""}
							currentImageUrl={
								coach.user.imageKey ? undefined : coach.user.image
							}
							hasS3Image={!!coach.user.imageKey}
							size="sm"
						/>
					) : (
						<UserAvatar className="size-16" name="" src={undefined} />
					)}
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-bold text-2xl">
								{coach.user?.name ?? "Unknown"}
							</h1>
							<StatusBadge status={coach.status} />
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
							{coach.sport && (
								<div className="flex items-center gap-1">
									<MedalIcon className="size-4" />
									<span>{coach.sport}</span>
								</div>
							)}
							<div className="flex items-center gap-1">
								<ClipboardListIcon className="size-4" />
								<span>{coach.specialty}</span>
							</div>
							{age && (
								<div className="flex items-center gap-1">
									<UserIcon className="size-4" />
									<span>
										{age} {t("yearsOld")}
									</span>
								</div>
							)}
							{coach.phone && (
								<WhatsAppLink
									phone={coach.phone}
									variant="whatsapp"
									className="text-sm"
									iconSize="size-3.5"
								/>
							)}
							{coach.user?.email && (
								<MailtoLink
									email={coach.user.email}
									className="text-sm"
									iconSize="size-3.5"
								/>
							)}
						</div>
					</div>
				</div>
				<CoachProfileActions
					coachId={coachId}
					coachName={coach.user?.name ?? ""}
					isArchived={coach.archivedAt !== null}
				/>
			</div>

			{/* Stats Overview */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("profile.stats.totalSessions")}
						</CardTitle>
						<CalendarIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.totalSessions}</div>
						<p className="text-muted-foreground text-xs">
							{t("profile.stats.completedUpcoming", {
								completed: stats.completedSessions,
								upcoming: stats.upcomingSessions,
							})}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("profile.stats.primaryCoach")}
						</CardTitle>
						<CheckCircleIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.primarySessions}</div>
						<p className="text-muted-foreground text-xs">
							{t("profile.stats.sessionsAsPrimary")}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("profile.stats.athletesCoached")}
						</CardTitle>
						<UsersIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.totalAthletes}</div>
						<p className="text-muted-foreground text-xs">
							{t("profile.stats.uniqueAthletes")}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("profile.stats.evaluationsGiven")}
						</CardTitle>
						<TrendingUpIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<span className="font-bold text-2xl">
								{stats.evaluationsGiven}
							</span>
							{stats.avgRatingGiven > 0 && (
								<div className="flex items-center gap-1 text-muted-foreground text-sm">
									<StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
									<span>
										{t("profile.stats.avg", { rating: stats.avgRatingGiven })}
									</span>
								</div>
							)}
						</div>
						<p className="text-muted-foreground text-xs">
							{t("profile.stats.athleteEvaluations")}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Tabs */}
			<Tabs defaultValue="info" className="space-y-4">
				<TabsList>
					<TabsTrigger value="info">{t("profile.tabs.info")}</TabsTrigger>
					<TabsTrigger value="sessions">
						{t("profile.tabs.sessions", { count: sessions.length })}
					</TabsTrigger>
					<TabsTrigger value="attendance">
						{t("profile.tabs.attendance", {
							count: stats.attendance?.total ?? 0,
						})}
					</TabsTrigger>
					<TabsTrigger value="evaluations">
						{t("profile.tabs.evaluations", { count: evaluations.length })}
					</TabsTrigger>
					<TabsTrigger value="athletes">
						{t("profile.tabs.athletes", { count: athletes.length })}
					</TabsTrigger>
					<TabsTrigger value="experience">
						{t("profile.tabs.experience", {
							count: experienceData?.length ?? 0,
						})}
					</TabsTrigger>
					<TabsTrigger value="achievements">
						<TrophyIcon className="mr-1 size-3.5" />
						{t("achievements.tab", {
							count: achievementsData?.length ?? 0,
						})}
					</TabsTrigger>
					<TabsTrigger value="education">
						<GraduationCapIcon className="mr-1 size-3.5" />
						{t("education.tab", {
							count: educationData?.length ?? 0,
						})}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="info">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Personal & Contact */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<PhoneIcon className="size-4" />
									{t("profile.info.personalContact")}
								</CardTitle>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										NiceModal.show(OrgCoachContactEditModal, {
											coachId: coach.id,
											phone: coach.phone,
											birthDate: coach.birthDate,
										})
									}
								>
									<PencilIcon className="size-4" />
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								{coach.phone && (
									<div>
										<p className="text-muted-foreground text-xs">
											{t("profile.info.phone")}
										</p>
										<WhatsAppLink
											phone={coach.phone}
											variant="whatsapp"
											className="font-medium"
										/>
									</div>
								)}
								{coach.user?.email && (
									<div>
										<p className="text-muted-foreground text-xs">
											{t("profile.info.email")}
										</p>
										<MailtoLink
											email={coach.user.email}
											className="font-medium"
										/>
									</div>
								)}
								{coach.birthDate && (
									<div>
										<p className="text-muted-foreground text-xs">
											{t("profile.info.birthDate")}
										</p>
										<p className="font-medium">
											{format(new Date(coach.birthDate), "MMM d, yyyy")}
											{age && (
												<span className="ml-1 text-muted-foreground">
													({age} {t("yearsOld")})
												</span>
											)}
										</p>
									</div>
								)}
								{!coach.phone && !coach.user?.email && !coach.birthDate && (
									<EmptyState
										icon={PhoneIcon}
										title={t("profile.info.noContactInfo")}
										size="sm"
									/>
								)}
							</CardContent>
						</Card>

						{/* Professional Info */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<BriefcaseIcon className="size-4" />
									{t("profile.info.professionalInfo")}
								</CardTitle>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										NiceModal.show(OrgCoachProfessionalEditModal, {
											coachId: coach.id,
											sport: coach.sport,
											specialty: coach.specialty,
											status: coach.status,
										})
									}
								>
									<PencilIcon className="size-4" />
								</Button>
							</CardHeader>
							<CardContent className="space-y-3">
								{coach.sport && (
									<div>
										<p className="text-muted-foreground text-xs">
											{t("profile.info.sport")}
										</p>
										<p className="font-medium">{getSportLabel(coach.sport)}</p>
									</div>
								)}
								{coach.specialty && (
									<div>
										<p className="text-muted-foreground text-xs">
											{t("profile.info.specialty")}
										</p>
										<div className="flex flex-wrap gap-1.5 pt-1">
											{coach.specialty
												.split(",")
												.map((s) => s.trim())
												.filter(Boolean)
												.map((tag) => (
													<Badge key={tag} variant="secondary">
														{tag}
													</Badge>
												))}
										</div>
									</div>
								)}
								<div>
									<p className="text-muted-foreground text-xs">
										{t("profile.info.status")}
									</p>
									<div className="pt-1">
										<StatusBadge status={coach.status} />
									</div>
								</div>
								{!coach.sport && !coach.specialty && (
									<EmptyState
										icon={BriefcaseIcon}
										title={t("profile.info.noProfessionalInfo")}
										size="sm"
									/>
								)}
							</CardContent>
						</Card>

						{/* Bio */}
						<Card className="md:col-span-2">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<UserIcon className="size-4" />
									{t("profile.info.bioNotes")}
								</CardTitle>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										NiceModal.show(OrgCoachBioEditModal, {
											coachId: coach.id,
											bio: coach.bio,
										})
									}
								>
									<PencilIcon className="size-4" />
								</Button>
							</CardHeader>
							<CardContent>
								{coach.bio ? (
									<p className="whitespace-pre-wrap">{coach.bio}</p>
								) : (
									<EmptyState
										icon={UserIcon}
										title={t("profile.info.noBio")}
										size="sm"
									/>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="sessions" className="space-y-4">
					<div className="flex justify-end">
						<Button
							size="sm"
							onClick={() => NiceModal.show(TrainingSessionsModal, {})}
						>
							<PlusIcon className="mr-2 size-4" />
							{t("profile.sessions.newSession")}
						</Button>
					</div>
					<SessionsListTable
						sessions={sessions}
						emptyStateMessage={t("profile.sessions.noSessions")}
						maxItems={20}
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
								title: t("profile.sessions.deleteTitle"),
								message: t("profile.sessions.deleteMessage", {
									name: sessionTitle,
								}),
								confirmLabel: t("profile.sessions.deleteConfirm"),
								destructive: true,
								onConfirm: () =>
									deleteSessionMutation.mutate({ id: sessionId }),
							});
						}}
					/>
				</TabsContent>

				<TabsContent value="attendance" className="space-y-4">
					<AttendanceMatrix
						sessions={sessions
							.filter((s) => (s.attendances?.length ?? 0) > 0)
							.sort(
								(a, b) =>
									new Date(a.startTime).getTime() -
									new Date(b.startTime).getTime(),
							)}
						athletes={athletes.map((a) => ({
							id: a.id,
							name: a.name,
							image: a.image,
						}))}
						records={sessions.flatMap((s) =>
							(s.attendances ?? []).map((att) => ({
								sessionId: s.id,
								athleteId: att.athleteId,
								status: att.status,
							})),
						)}
						onStatusChange={(sessionId, athleteId, status) => {
							recordAttendanceMutation.mutate({
								sessionId,
								athleteId,
								status,
							});
						}}
						isMutating={recordAttendanceMutation.isPending}
						mutatingVariables={recordAttendanceMutation.variables ?? null}
					/>
				</TabsContent>

				<TabsContent value="evaluations" className="space-y-4">
					<div className="flex justify-end">
						<Button
							size="sm"
							onClick={() => {
								const completedSessions = sessions
									.filter((s) => s.status === "completed")
									.map((s) => ({
										id: s.id,
										title: s.title,
										startTime: new Date(s.startTime),
										status: s.status,
									}));
								const firstAthlete = athletes[0];
								if (completedSessions.length > 0 && firstAthlete) {
									NiceModal.show(AddEvaluationModal, {
										athleteId: firstAthlete.id,
										athleteName: firstAthlete.name,
										sessions: completedSessions,
									});
								}
							}}
						>
							<PlusIcon className="mr-2 size-4" />
							{t("profile.evaluations.addEvaluation")}
						</Button>
					</div>
					{evaluations.length === 0 ? (
						<EmptyState
							icon={StarIcon}
							title={t("profile.evaluations.empty")}
						/>
					) : (
						<div className="rounded-lg border">
							<table className="w-full">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("profile.evaluations.table.athlete")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("profile.evaluations.table.session")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("profile.evaluations.table.date")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("profile.evaluations.table.ratings")}
										</th>
										<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
											<span className="sr-only">
												{t("profile.evaluations.table.actions")}
											</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{evaluations.map((evaluation) => (
										<tr key={evaluation.id} className="hover:bg-muted/30">
											<td className="px-4 py-3">
												<Link
													href={`/dashboard/organization/athletes/${evaluation.athlete.id}`}
													className="flex items-center gap-2 hover:opacity-80"
												>
													<UserAvatar
														className="size-6 shrink-0"
														name={evaluation.athlete.user?.name ?? ""}
														src={evaluation.athlete.user?.image ?? undefined}
													/>
													<span className="font-medium text-sm">
														{evaluation.athlete.user?.name ?? "Unknown"}
													</span>
												</Link>
											</td>
											<td className="px-4 py-3">
												{evaluation.session?.title && (
													<span className="text-sm">
														{evaluation.session.title}
													</span>
												)}
											</td>
											<td className="px-4 py-3 text-sm">
												{evaluation.session?.startTime
													? format(
															new Date(evaluation.session.startTime),
															"dd MMM yyyy",
														)
													: ""}
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center gap-3">
													{evaluation.performanceRating && (
														<div
															className="flex items-center gap-1 text-sm"
															title={t("profile.evaluations.performance")}
														>
															<StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
															<span className="tabular-nums">
																{evaluation.performanceRating}
																/5
															</span>
														</div>
													)}
													{evaluation.attitudeRating && (
														<div
															className="flex items-center gap-1 text-sm"
															title={t("profile.evaluations.attitude")}
														>
															<StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
															<span className="tabular-nums">
																{evaluation.attitudeRating}/5
															</span>
														</div>
													)}
													{evaluation.physicalFitnessRating && (
														<div
															className="flex items-center gap-1 text-sm"
															title={t("profile.evaluations.physicalFitness")}
														>
															<StarIcon className="size-3.5 fill-yellow-400 text-yellow-400" />
															<span className="tabular-nums">
																{evaluation.physicalFitnessRating}
																/5
															</span>
														</div>
													)}
												</div>
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
																	const completedSessions = sessions
																		.filter((s) => s.status === "completed")
																		.map((s) => ({
																			id: s.id,
																			title: s.title,
																			startTime: new Date(s.startTime),
																			status: s.status,
																		}));
																	NiceModal.show(AddEvaluationModal, {
																		athleteId: evaluation.athlete.id,
																		athleteName: evaluation.athlete.user?.name,
																		sessions: completedSessions,
																		initialSessionId: evaluation.session?.id,
																		initialValues: {
																			performanceRating:
																				evaluation.performanceRating,
																			performanceNotes:
																				evaluation.performanceNotes ?? "",
																			attitudeRating: evaluation.attitudeRating,
																			attitudeNotes:
																				evaluation.attitudeNotes ?? "",
																			physicalFitnessRating:
																				evaluation.physicalFitnessRating,
																			physicalFitnessNotes:
																				evaluation.physicalFitnessNotes ?? "",
																			generalNotes:
																				evaluation.generalNotes ?? "",
																		},
																	});
																}}
															>
																<PencilIcon className="mr-2 size-4" />
																{t("profile.evaluations.actions.edit")}
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																variant="destructive"
																onClick={() => {
																	NiceModal.show(ConfirmationModal, {
																		title: t(
																			"profile.evaluations.deleteConfirm.title",
																		),
																		message: t(
																			"profile.evaluations.deleteConfirm.message",
																			{
																				name: evaluation.session?.title ?? "",
																			},
																		),
																		confirmLabel: t(
																			"profile.evaluations.deleteConfirm.confirm",
																		),
																		destructive: true,
																		onConfirm: () =>
																			deleteEvaluationMutation.mutate({
																				id: evaluation.id,
																			}),
																	});
																}}
															>
																<Trash2Icon className="mr-2 size-4" />
																{t("profile.evaluations.actions.delete")}
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

				<TabsContent value="athletes" className="space-y-4">
					{athletes.length === 0 ? (
						<EmptyState icon={UsersIcon} title={t("profile.athletes.empty")} />
					) : (
						<div className="rounded-lg border">
							<table className="w-full">
								<thead>
									<tr className="border-b bg-muted/50">
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("profile.athletes.table.name")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("profile.athletes.table.level")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
											{t("profile.athletes.table.sport")}
										</th>
										<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
											{t("profile.athletes.table.contact")}
										</th>
										<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
											{t("profile.athletes.table.sessions")}
										</th>
										<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
											<span className="sr-only">
												{t("profile.athletes.table.actions")}
											</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{athletes.map((athlete) => {
										const athleteAge = athlete.birthDate
											? differenceInYears(
													new Date(),
													new Date(athlete.birthDate),
												)
											: null;
										return (
											<tr key={athlete.id} className="hover:bg-muted/30">
												<td className="px-4 py-3">
													<Link
														href={`/dashboard/organization/athletes/${athlete.id}`}
														className="flex items-center gap-3 hover:opacity-80"
													>
														<UserAvatar
															className="size-8 shrink-0"
															name={athlete.name}
															src={athlete.image ?? undefined}
														/>
														<div className="min-w-0">
															<p className="truncate font-medium text-sm">
																{athlete.name}
															</p>
															{athleteAge !== null && (
																<p className="text-muted-foreground text-xs">
																	{athleteAge} {t("yearsOld")}
																</p>
															)}
														</div>
													</Link>
												</td>
												<td className="px-4 py-3">
													{athlete.level ? (
														<LevelBadge level={athlete.level} />
													) : (
														<span className="text-muted-foreground">-</span>
													)}
												</td>
												<td className="hidden px-4 py-3 sm:table-cell">
													{athlete.sport ? (
														<span className="text-sm">
															{getSportLabel(athlete.sport)}
														</span>
													) : (
														<span className="text-muted-foreground">-</span>
													)}
												</td>
												<td className="hidden px-4 py-3 md:table-cell">
													<div className="flex flex-col gap-1 text-sm">
														{athlete.email && (
															<MailtoLink
																email={athlete.email}
																iconSize="size-3.5"
																truncate
																maxWidth="max-w-[160px]"
																onClick={(e) => e.stopPropagation()}
															/>
														)}
														{athlete.phone && (
															<WhatsAppLink
																phone={athlete.phone}
																iconSize="size-3.5"
																variant="whatsapp"
																onClick={(e) => e.stopPropagation()}
															/>
														)}
														{!athlete.email && !athlete.phone && (
															<span className="text-muted-foreground">-</span>
														)}
													</div>
												</td>
												<td className="px-4 py-3 text-sm">
													{athlete.sessionCount === 1
														? t("profile.athletes.session", {
																count: athlete.sessionCount,
															})
														: t("profile.athletes.sessions", {
																count: athlete.sessionCount,
															})}
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
																		href={`/dashboard/organization/athletes/${athlete.id}`}
																	>
																		<UserIcon className="mr-2 size-4" />
																		{t("profile.athletes.viewProfile")}
																	</Link>
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</TabsContent>

				<TabsContent value="experience" className="space-y-4">
					<div className="flex items-center justify-end">
						<Button
							size="sm"
							onClick={() =>
								NiceModal.show(CoachExperienceEditModal, { coachId })
							}
						>
							<PlusIcon className="mr-2 size-4" />
							{t("profile.experience.add")}
						</Button>
					</div>

					{!experienceData || experienceData.length === 0 ? (
						<EmptyState
							icon={BriefcaseIcon}
							title={t("profile.experience.empty")}
							description={t("profile.experience.emptyDescription")}
						/>
					) : (
						<div className="space-y-4">
							{experienceData.map((experience) => (
								<Card key={experience.id} className="relative">
									<CardContent className="pt-6">
										<div className="flex items-start justify-between gap-4">
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<h4 className="font-semibold">
														{experience.club?.name ||
															experience.nationalTeam?.name ||
															"-"}
													</h4>
													{experience.level && (
														<Badge variant="secondary">
															{t(`experience.levels.${experience.level}`)}
														</Badge>
													)}
												</div>
												<p className="text-muted-foreground text-sm">
													{experience.role}
													{experience.sport && (
														<span>
															{" "}
															&bull; {getSportLabel(experience.sport)}
														</span>
													)}
												</p>
												<p className="text-muted-foreground text-xs">
													{experience.startDate
														? format(new Date(experience.startDate), "MMM yyyy")
														: t("profile.experience.unknown")}
													{" - "}
													{experience.endDate
														? format(new Date(experience.endDate), "MMM yyyy")
														: t("profile.experience.present")}
												</p>
											</div>
											<Button
												size="sm"
												variant="ghost"
												onClick={() =>
													NiceModal.show(CoachExperienceEditModal, {
														coachId,
														initialValues: {
															id: experience.id,
															clubId: experience.clubId,
															nationalTeamId: experience.nationalTeamId,
															role: experience.role,
															sport: experience.sport,
															level: experience.level,
															startDate: experience.startDate,
															endDate: experience.endDate,
															achievements: experience.achievements,
															description: experience.description,
														},
													})
												}
											>
												<PencilIcon className="size-4" />
											</Button>
										</div>
										{experience.achievements && (
											<div className="mt-3">
												<p className="text-xs font-medium text-muted-foreground">
													{t("profile.experience.achievements")}
												</p>
												<p className="text-sm">{experience.achievements}</p>
											</div>
										)}
										{experience.description && (
											<div className="mt-2">
												<p className="text-xs font-medium text-muted-foreground">
													{t("profile.experience.description")}
												</p>
												<p className="text-sm">{experience.description}</p>
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				{/* Achievements Tab */}
				<TabsContent value="achievements" className="space-y-4">
					<div className="flex items-center justify-end">
						<Button
							size="sm"
							onClick={() => {
								NiceModal.show(OrgAchievementEditModal, { coachId });
							}}
						>
							<PlusIcon className="mr-1 size-4" />
							{t("achievements.addEntry")}
						</Button>
					</div>

					{!achievementsData || achievementsData.length === 0 ? (
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
									{achievementsData.map((achievement) => (
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
																	coachId,
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

				{/* Education Tab */}
				<TabsContent value="education" className="space-y-4">
					<div className="flex items-center justify-end">
						<Button
							size="sm"
							onClick={() => {
								NiceModal.show(OrgCoachEducationEditModal, { coachId });
							}}
						>
							<PlusIcon className="mr-1 size-4" />
							{t("education.addEntry")}
						</Button>
					</div>

					{!educationData || educationData.length === 0 ? (
						<EmptyState
							icon={GraduationCapIcon}
							title={t("education.noEducation")}
							description={t("education.noEducationDescription")}
						/>
					) : (
						<div className="space-y-4">
							{educationData.map((education) => (
								<Card key={education.id} className="relative">
									<CardContent className="pt-6">
										<div className="flex items-start justify-between gap-4">
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<h4 className="font-semibold">
														{education.institution}
													</h4>
													{education.isCurrent && (
														<Badge variant="secondary">
															{t("education.current")}
														</Badge>
													)}
												</div>
												<p className="text-muted-foreground text-sm">
													{education.degree}
													{education.fieldOfStudy && (
														<span> &bull; {education.fieldOfStudy}</span>
													)}
												</p>
												<p className="text-muted-foreground text-xs">
													{education.startDate
														? format(new Date(education.startDate), "MMM yyyy")
														: t("education.unknown")}
													{" - "}
													{education.isCurrent
														? t("education.present")
														: education.endDate
															? format(new Date(education.endDate), "MMM yyyy")
															: t("education.unknown")}
												</p>
												{education.gpa && (
													<p className="text-muted-foreground text-xs">
														{t("education.gpaLabel")}: {education.gpa}
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
															NiceModal.show(OrgCoachEducationEditModal, {
																coachId,
																entry: {
																	id: education.id,
																	institution: education.institution,
																	degree: education.degree,
																	fieldOfStudy: education.fieldOfStudy,
																	academicYear: education.academicYear,
																	startDate: education.startDate
																		? new Date(education.startDate)
																		: null,
																	endDate: education.endDate
																		? new Date(education.endDate)
																		: null,
																	expectedGraduationDate:
																		education.expectedGraduationDate
																			? new Date(
																					education.expectedGraduationDate,
																				)
																			: null,
																	gpa: education.gpa,
																	isCurrent: education.isCurrent,
																	notes: education.notes,
																},
															});
														}}
													>
														<PencilIcon className="mr-2 size-4" />
														{t("education.actions.edit")}
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
																		id: education.id,
																	});
																},
															});
														}}
													>
														<Trash2Icon className="mr-2 size-4" />
														{t("education.actions.delete")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
										{education.notes && (
											<div className="mt-3">
												<p className="text-xs font-medium text-muted-foreground">
													{t("education.notesLabel")}
												</p>
												<p className="text-sm">{education.notes}</p>
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

function CoachProfileSkeleton() {
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
