"use client";

import NiceModal from "@ebay/nice-modal-react";
import { differenceInYears, format } from "date-fns";
import {
	ArrowLeftIcon,
	CalendarIcon,
	CheckCircleIcon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	ClockIcon,
	MapPinIcon,
	MedalIcon,
	PlusIcon,
	StarIcon,
	TrendingUpIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { CoachSessionModal } from "@/components/organization/coach-session-modal";
import { CoachesModal } from "@/components/organization/coaches-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailtoLink, WhatsAppLink } from "@/components/ui/contact-links";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user/user-avatar";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface CoachProfileProps {
	coachId: string;
}

const sessionStatusColors: Record<string, string> = {
	pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
	confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	completed:
		"bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
};

export function CoachProfile({ coachId }: CoachProfileProps) {
	const t = useTranslations("coaches");
	const { data, isLoading, error } =
		trpc.organization.coach.getProfile.useQuery({ id: coachId });

	if (isLoading) {
		return <CoachProfileSkeleton />;
	}

	if (error || !data) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">Coach not found</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard/organization/coaches">
							<ArrowLeftIcon className="mr-2 size-4" />
							Back to Coaches
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

	// Separate upcoming and past sessions
	const now = new Date();
	const upcomingSessions = sessions.filter(
		(s) => new Date(s.startTime) > now && s.status !== "cancelled",
	);
	const recentSessions = sessions.filter(
		(s) => new Date(s.startTime) <= now || s.status === "completed",
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<UserAvatar
						className="size-16"
						name={coach.user?.name ?? ""}
						src={coach.user?.image ?? undefined}
					/>
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
			</div>

			{/* Stats Overview */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Sessions
						</CardTitle>
						<CalendarIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.totalSessions}</div>
						<p className="text-muted-foreground text-xs">
							{stats.completedSessions} completed, {stats.upcomingSessions}{" "}
							upcoming
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Primary Coach</CardTitle>
						<CheckCircleIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.primarySessions}</div>
						<p className="text-muted-foreground text-xs">
							sessions as primary coach
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Athletes Coached
						</CardTitle>
						<UsersIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.totalAthletes}</div>
						<p className="text-muted-foreground text-xs">
							unique athletes trained
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Evaluations Given
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
									<span>avg {stats.avgRatingGiven}</span>
								</div>
							)}
						</div>
						<p className="text-muted-foreground text-xs">athlete evaluations</p>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Tabs */}
			<Tabs defaultValue="upcoming" className="space-y-4">
				<TabsList>
					<TabsTrigger value="upcoming">
						Upcoming ({upcomingSessions.length})
					</TabsTrigger>
					<TabsTrigger value="recent">
						Recent Sessions ({recentSessions.length})
					</TabsTrigger>
					<TabsTrigger value="attendance">
						Attendance ({stats.attendance?.total ?? 0})
					</TabsTrigger>
					<TabsTrigger value="athletes">
						Athletes ({athletes.length})
					</TabsTrigger>
					<TabsTrigger value="evaluations">
						Evaluations ({evaluations.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="upcoming">
					<Card>
						<CardHeader>
							<CardTitle>Upcoming Sessions</CardTitle>
						</CardHeader>
						<CardContent>
							{upcomingSessions.length === 0 ? (
								<p className="py-6 text-center text-muted-foreground">
									No upcoming sessions scheduled
								</p>
							) : (
								<div className="space-y-3">
									{upcomingSessions.slice(0, 20).map((session) => (
										<Link
											key={session.id}
											href={`/dashboard/organization/training-sessions/${session.id}`}
											className="block"
										>
											<div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<span className="font-medium">{session.title}</span>
														<Badge
															className={cn(
																"border-none",
																sessionStatusColors[session.status],
															)}
														>
															{capitalize(session.status)}
														</Badge>
														{session.isPrimary && (
															<Badge variant="secondary" className="text-xs">
																Primary
															</Badge>
														)}
													</div>
													<div className="flex items-center gap-4 text-muted-foreground text-sm">
														<div className="flex items-center gap-1">
															<CalendarIcon className="size-3.5" />
															<span>
																{format(
																	new Date(session.startTime),
																	"MMM d, yyyy",
																)}
															</span>
														</div>
														<div className="flex items-center gap-1">
															<ClockIcon className="size-3.5" />
															<span>
																{format(new Date(session.startTime), "h:mm a")}
															</span>
														</div>
														{session.location && (
															<div className="flex items-center gap-1">
																<MapPinIcon className="size-3.5" />
																<span>{session.location.name}</span>
															</div>
														)}
													</div>
												</div>
												{session.athleteGroup && (
													<Badge variant="outline">
														<UsersIcon className="mr-1 size-3" />
														{session.athleteGroup.name}
													</Badge>
												)}
											</div>
										</Link>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="recent">
					<Card>
						<CardHeader>
							<CardTitle>Recent Sessions</CardTitle>
						</CardHeader>
						<CardContent>
							{recentSessions.length === 0 ? (
								<p className="py-6 text-center text-muted-foreground">
									No past sessions found
								</p>
							) : (
								<div className="space-y-3">
									{recentSessions.slice(0, 20).map((session) => {
										const attendanceCount = session.attendances?.length ?? 0;
										const presentCount =
											session.attendances?.filter((a) => a.status === "present")
												.length ?? 0;

										return (
											<div
												key={session.id}
												className="flex items-center justify-between rounded-lg border p-3"
											>
												<Link
													href={`/dashboard/organization/training-sessions/${session.id}`}
													className="flex-1"
												>
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<span className="font-medium hover:underline">
																{session.title}
															</span>
															<Badge
																className={cn(
																	"border-none",
																	sessionStatusColors[session.status],
																)}
															>
																{capitalize(session.status)}
															</Badge>
															{session.isPrimary && (
																<Badge variant="secondary" className="text-xs">
																	Primary
																</Badge>
															)}
														</div>
														<div className="flex items-center gap-4 text-muted-foreground text-sm">
															<div className="flex items-center gap-1">
																<CalendarIcon className="size-3.5" />
																<span>
																	{format(
																		new Date(session.startTime),
																		"MMM d, yyyy",
																	)}
																</span>
															</div>
															<div className="flex items-center gap-1">
																<ClockIcon className="size-3.5" />
																<span>
																	{format(
																		new Date(session.startTime),
																		"h:mm a",
																	)}
																</span>
															</div>
															{session.location && (
																<div className="flex items-center gap-1">
																	<MapPinIcon className="size-3.5" />
																	<span>{session.location.name}</span>
																</div>
															)}
															{attendanceCount > 0 && (
																<div className="flex items-center gap-1">
																	<ClipboardCheckIcon className="size-3.5" />
																	<span>
																		{presentCount}/{attendanceCount} present
																	</span>
																</div>
															)}
														</div>
													</div>
												</Link>
												<div className="flex items-center gap-2">
													{session.athleteGroup && (
														<Badge variant="outline">
															<UsersIcon className="mr-1 size-3" />
															{session.athleteGroup.name}
														</Badge>
													)}
													<Button
														variant="outline"
														size="sm"
														onClick={(e) => {
															e.preventDefault();
															NiceModal.show(CoachSessionModal, {
																session,
																defaultTab: "attendance",
															});
														}}
													>
														<ClipboardCheckIcon className="size-4" />
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={(e) => {
															e.preventDefault();
															NiceModal.show(CoachSessionModal, {
																session,
																defaultTab: "evaluations",
															});
														}}
													>
														<ClipboardListIcon className="size-4" />
													</Button>
												</div>
											</div>
										);
									})}
									{recentSessions.length > 20 && (
										<p className="pt-2 text-center text-muted-foreground text-sm">
											Showing 20 of {recentSessions.length} sessions
										</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="attendance">
					<Card>
						<CardHeader>
							<CardTitle>Attendance Overview</CardTitle>
						</CardHeader>
						<CardContent>
							{stats.attendance && stats.attendance.total > 0 ? (
								<div className="space-y-6">
									{/* Summary Stats */}
									<div className="grid gap-4 sm:grid-cols-4">
										<div className="rounded-lg border p-4">
											<p className="text-muted-foreground text-sm">
												Total Records
											</p>
											<p className="font-bold text-2xl">
												{stats.attendance.total}
											</p>
										</div>
										<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
											<p className="text-muted-foreground text-sm">Present</p>
											<p className="font-bold text-2xl text-green-600 dark:text-green-400">
												{stats.attendance.present}
											</p>
											<p className="text-muted-foreground text-xs">
												{stats.attendance.total > 0
													? Math.round(
															(stats.attendance.present /
																stats.attendance.total) *
																100,
														)
													: 0}
												%
											</p>
										</div>
										<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
											<p className="text-muted-foreground text-sm">Absent</p>
											<p className="font-bold text-2xl text-red-600 dark:text-red-400">
												{stats.attendance.absent}
											</p>
											<p className="text-muted-foreground text-xs">
												{stats.attendance.total > 0
													? Math.round(
															(stats.attendance.absent /
																stats.attendance.total) *
																100,
														)
													: 0}
												%
											</p>
										</div>
										<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
											<p className="text-muted-foreground text-sm">
												Late / Excused
											</p>
											<p className="font-bold text-2xl text-yellow-600 dark:text-yellow-400">
												{stats.attendance.late + stats.attendance.excused}
											</p>
										</div>
									</div>

									{/* Sessions with Attendance */}
									<div>
										<h4 className="mb-3 font-medium">
											Sessions with Attendance
										</h4>
										<div className="space-y-2">
											{sessions
												.filter((s) => (s.attendances?.length ?? 0) > 0)
												.slice(0, 10)
												.map((session) => {
													const present =
														session.attendances?.filter(
															(a) => a.status === "present",
														).length ?? 0;
													const total = session.attendances?.length ?? 0;
													const percentage =
														total > 0 ? Math.round((present / total) * 100) : 0;

													return (
														<div
															key={session.id}
															className="flex items-center justify-between rounded-lg border p-3"
														>
															<div className="flex items-center gap-4">
																<div>
																	<p className="font-medium">{session.title}</p>
																	<p className="text-muted-foreground text-sm">
																		{format(
																			new Date(session.startTime),
																			"MMM d, yyyy",
																		)}
																	</p>
																</div>
															</div>
															<div className="flex items-center gap-4">
																<div className="text-right">
																	<p className="font-medium">
																		{present}/{total}
																	</p>
																	<p className="text-muted-foreground text-sm">
																		{percentage}% attendance
																	</p>
																</div>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() => {
																		NiceModal.show(CoachSessionModal, {
																			session,
																			defaultTab: "attendance",
																		});
																	}}
																>
																	View
																</Button>
															</div>
														</div>
													);
												})}
										</div>
									</div>
								</div>
							) : (
								<p className="py-6 text-center text-muted-foreground">
									No attendance records found
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="athletes">
					<Card>
						<CardHeader>
							<CardTitle>Athletes Coached</CardTitle>
						</CardHeader>
						<CardContent>
							{athletes.length === 0 ? (
								<p className="py-6 text-center text-muted-foreground">
									No athletes found
								</p>
							) : (
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{athletes.map((athlete) => (
										<Link
											key={athlete.id}
											href={`/dashboard/organization/athletes/${athlete.id}`}
											className="block"
										>
											<div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
												<UserAvatar
													className="size-10"
													name={athlete.name}
													src={athlete.image ?? undefined}
												/>
												<div className="flex-1 truncate">
													<p className="font-medium truncate">{athlete.name}</p>
													<p className="text-muted-foreground text-xs">
														{athlete.sessionCount} session
														{athlete.sessionCount !== 1 ? "s" : ""}
													</p>
												</div>
											</div>
										</Link>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="evaluations">
					<div className="space-y-4">
						{/* Sessions needing evaluations */}
						{recentSessions.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle>Add Evaluations</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="mb-4 text-muted-foreground text-sm">
										Select a session to add or edit evaluations for athletes
									</p>
									<div className="flex flex-wrap gap-2">
										{recentSessions.slice(0, 8).map((session) => (
											<Button
												key={session.id}
												variant="outline"
												size="sm"
												onClick={() => {
													NiceModal.show(CoachSessionModal, {
														session,
														defaultTab: "evaluations",
													});
												}}
											>
												<PlusIcon className="mr-1 size-3" />
												{session.title} (
												{format(new Date(session.startTime), "MMM d")})
											</Button>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Existing evaluations */}
						<Card>
							<CardHeader>
								<CardTitle>Evaluations Given</CardTitle>
							</CardHeader>
							<CardContent>
								{evaluations.length === 0 ? (
									<p className="py-6 text-center text-muted-foreground">
										No evaluations yet. Select a session above to add
										evaluations.
									</p>
								) : (
									<div className="space-y-4">
										{evaluations.map((evaluation) => (
											<div
												key={evaluation.id}
												className="rounded-lg border p-4"
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-3">
														<UserAvatar
															className="size-8"
															name={evaluation.athlete.user?.name ?? ""}
															src={evaluation.athlete.user?.image ?? undefined}
														/>
														<div>
															<Link
																href={`/dashboard/organization/athletes/${evaluation.athlete.id}`}
																className="font-medium hover:underline"
															>
																{evaluation.athlete.user?.name ?? "Unknown"}
															</Link>
															<p className="text-muted-foreground text-xs">
																{evaluation.session?.title} •{" "}
																{evaluation.session?.startTime
																	? format(
																			new Date(evaluation.session.startTime),
																			"MMM d, yyyy",
																		)
																	: ""}
															</p>
														</div>
													</div>
													<div className="flex items-center gap-4">
														{evaluation.performanceRating && (
															<div className="text-right">
																<p className="text-muted-foreground text-xs">
																	Performance
																</p>
																<div className="flex items-center gap-1">
																	<StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
																	<span className="font-medium">
																		{evaluation.performanceRating}/5
																	</span>
																</div>
															</div>
														)}
														{evaluation.attitudeRating && (
															<div className="text-right">
																<p className="text-muted-foreground text-xs">
																	Attitude
																</p>
																<div className="flex items-center gap-1">
																	<StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
																	<span className="font-medium">
																		{evaluation.attitudeRating}/5
																	</span>
																</div>
															</div>
														)}
													</div>
												</div>
												{(evaluation.performanceNotes ||
													evaluation.attitudeNotes ||
													evaluation.generalNotes) && (
													<div className="mt-3 space-y-1 text-sm">
														{evaluation.performanceNotes && (
															<p>
																<span className="font-medium">
																	Performance:{" "}
																</span>
																{evaluation.performanceNotes}
															</p>
														)}
														{evaluation.attitudeNotes && (
															<p>
																<span className="font-medium">Attitude: </span>
																{evaluation.attitudeNotes}
															</p>
														)}
														{evaluation.generalNotes && (
															<p>
																<span className="font-medium">Notes: </span>
																{evaluation.generalNotes}
															</p>
														)}
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
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
