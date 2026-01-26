"use client";

import NiceModal from "@ebay/nice-modal-react";
import { differenceInYears, format } from "date-fns";
import {
	ActivityIcon,
	ArrowLeftIcon,
	BedIcon,
	BriefcaseIcon,
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	EditIcon,
	FileHeartIcon,
	FlagIcon,
	HeartPulseIcon,
	MapPinIcon,
	MedalIcon,
	PercentIcon,
	PlusIcon,
	RulerIcon,
	ShieldIcon,
	StarIcon,
	TrendingUpIcon,
	TrophyIcon,
	UserIcon,
	UsersIcon,
	WeightIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { AddAttendanceModal } from "@/components/organization/add-attendance-modal";
import { AddCareerHistoryModal } from "@/components/organization/add-career-history-modal";
import { AddEvaluationModal } from "@/components/organization/add-evaluation-modal";
import { AddFitnessTestModal } from "@/components/organization/add-fitness-test-modal";
import { AddPhysicalMetricsModal } from "@/components/organization/add-physical-metrics-modal";
import { AddWellnessModal } from "@/components/organization/add-wellness-modal";
import { AthleteMedicalTab } from "@/components/organization/athlete-medical-tab";
import { AthleteProfileEditModal } from "@/components/organization/athlete-profile-edit-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user/user-avatar";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface AthleteProfileProps {
	athleteId: string;
}

const statusColors: Record<string, string> = {
	active: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
	injured: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
	suspended:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
};

const levelColors: Record<string, string> = {
	beginner: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	intermediate:
		"bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
	advanced:
		"bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100",
	elite:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
};

const sessionStatusColors: Record<string, string> = {
	pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
	confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	completed:
		"bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
};

const attendanceStatusColors: Record<string, string> = {
	present: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	absent: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
	late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
	excused: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

export function AthleteProfile({ athleteId }: AthleteProfileProps) {
	const { data, isLoading, error } =
		trpc.organization.athlete.getProfile.useQuery({ id: athleteId });

	const { data: teams } = trpc.organization.team.listByAthlete.useQuery(
		{ athleteId },
		{ enabled: !!athleteId },
	);

	if (isLoading) {
		return <AthleteProfileSkeleton />;
	}

	if (error || !data) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">Athlete not found</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard/organization/athletes">
							<ArrowLeftIcon className="mr-2 size-4" />
							Back to Athletes
						</Link>
					</Button>
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
	} = data;

	const age = athlete.birthDate
		? differenceInYears(new Date(), new Date(athlete.birthDate))
		: null;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<Button asChild size="icon" variant="ghost">
						<Link href="/dashboard/organization/athletes">
							<ArrowLeftIcon className="size-5" />
						</Link>
					</Button>
					<UserAvatar
						className="size-16"
						name={athlete.user?.name ?? ""}
						src={athlete.user?.image ?? undefined}
					/>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-bold text-2xl">
								{athlete.user?.name ?? "Unknown"}
							</h1>
							<Badge
								className={cn("border-none", statusColors[athlete.status])}
							>
								{capitalize(athlete.status)}
							</Badge>
							<Badge className={cn("border-none", levelColors[athlete.level])}>
								{capitalize(athlete.level)}
							</Badge>
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
							<div className="flex items-center gap-1">
								<MedalIcon className="size-4" />
								<span>{athlete.sport}</span>
							</div>
							{age && (
								<div className="flex items-center gap-1">
									<UserIcon className="size-4" />
									<span>{age} years old</span>
								</div>
							)}
							{athlete.user?.email && (
								<span className="text-muted-foreground">
									{athlete.user.email}
								</span>
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
				<Button
					variant="outline"
					onClick={() => NiceModal.show(AthleteProfileEditModal, { athlete })}
				>
					<EditIcon className="mr-2 size-4" />
					Edit Profile
				</Button>
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
						<CardTitle className="font-medium text-sm">
							Attendance Rate
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
							Avg Performance
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
							{stats.ratings.count} evaluations
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Attendance Summary
						</CardTitle>
						<CheckCircleIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2 text-xs">
							<Badge variant="outline" className="bg-green-50">
								Present: {stats.attendance.present}
							</Badge>
							<Badge variant="outline" className="bg-yellow-50">
								Late: {stats.attendance.late}
							</Badge>
							<Badge variant="outline" className="bg-red-50">
								Absent: {stats.attendance.absent}
							</Badge>
							<Badge variant="outline" className="bg-blue-50">
								Excused: {stats.attendance.excused}
							</Badge>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Tabs */}
			<Tabs defaultValue="sessions" className="space-y-4">
				<TabsList className="flex-wrap">
					<TabsTrigger value="sessions">
						Sessions ({sessions.length})
					</TabsTrigger>
					<TabsTrigger value="evaluations">
						Evaluations ({evaluations.length})
					</TabsTrigger>
					<TabsTrigger value="attendance">
						Attendance ({attendanceRecords.length})
					</TabsTrigger>
					<TabsTrigger value="physical">
						<RulerIcon className="mr-1 size-3.5" />
						Physical ({physicalMetrics?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="fitness">
						<ActivityIcon className="mr-1 size-3.5" />
						Fitness Tests ({fitnessTests?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="career">
						<BriefcaseIcon className="mr-1 size-3.5" />
						Career ({careerHistory?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="teams">
						<ShieldIcon className="mr-1 size-3.5" />
						Teams ({teams?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="wellness">
						<HeartPulseIcon className="mr-1 size-3.5" />
						Wellness ({wellnessSurveys?.length ?? 0})
					</TabsTrigger>
					<TabsTrigger value="medical">
						<FileHeartIcon className="mr-1 size-3.5" />
						Medical
					</TabsTrigger>
					<TabsTrigger value="info">
						<UserIcon className="mr-1 size-3.5" />
						Info
					</TabsTrigger>
				</TabsList>

				<TabsContent value="sessions">
					<Card>
						<CardHeader>
							<CardTitle>Training Sessions</CardTitle>
						</CardHeader>
						<CardContent>
							{sessions.length === 0 ? (
								<p className="py-6 text-center text-muted-foreground">
									No sessions found
								</p>
							) : (
								<div className="space-y-3">
									{sessions.slice(0, 20).map((session) => (
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
												{session.coaches[0] && (
													<div className="flex items-center gap-2">
														<UserAvatar
															className="size-6"
															name={session.coaches[0].coach.user?.name ?? ""}
															src={
																session.coaches[0].coach.user?.image ??
																undefined
															}
														/>
														<span className="text-muted-foreground text-sm">
															{session.coaches[0].coach.user?.name}
														</span>
													</div>
												)}
											</div>
										</Link>
									))}
									{sessions.length > 20 && (
										<p className="pt-2 text-center text-muted-foreground text-sm">
											Showing 20 of {sessions.length} sessions
										</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="evaluations">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Performance Evaluations</CardTitle>
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
									NiceModal.show(AddEvaluationModal, {
										athleteId,
										athleteName: athlete.user?.name,
										sessions: completedSessions,
									});
								}}
							>
								<PlusIcon className="mr-2 size-4" />
								Add Evaluation
							</Button>
						</CardHeader>
						<CardContent>
							{evaluations.length === 0 ? (
								<p className="py-6 text-center text-muted-foreground">
									No evaluations yet
								</p>
							) : (
								<div className="space-y-4">
									{evaluations.map((evaluation) => (
										<div key={evaluation.id} className="rounded-lg border p-4">
											<div className="flex items-center justify-between">
												<div>
													<Link
														href={`/dashboard/organization/training-sessions/${evaluation.session.id}`}
														className="font-medium hover:underline"
													>
														{evaluation.session.title}
													</Link>
													<p className="text-muted-foreground text-sm">
														{format(
															new Date(evaluation.session.startTime),
															"MMM d, yyyy",
														)}
													</p>
												</div>
												{evaluation.evaluatedByUser && (
													<div className="flex items-center gap-2 text-sm">
														<span className="text-muted-foreground">by</span>
														<UserAvatar
															className="size-5"
															name={evaluation.evaluatedByUser.name ?? ""}
															src={
																evaluation.evaluatedByUser.image ?? undefined
															}
														/>
														<span>{evaluation.evaluatedByUser.name}</span>
													</div>
												)}
											</div>
											<div className="mt-3 flex flex-wrap gap-6">
												{evaluation.performanceRating && (
													<div>
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
													<div>
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
												{evaluation.physicalFitnessRating && (
													<div>
														<p className="text-muted-foreground text-xs">
															Physical Fitness
														</p>
														<div className="flex items-center gap-1">
															<StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
															<span className="font-medium">
																{evaluation.physicalFitnessRating}/5
															</span>
														</div>
													</div>
												)}
											</div>
											{(evaluation.performanceNotes ||
												evaluation.attitudeNotes ||
												evaluation.generalNotes) && (
												<div className="mt-3 space-y-2 text-sm">
													{evaluation.performanceNotes && (
														<p>
															<span className="font-medium">Performance: </span>
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
				</TabsContent>

				<TabsContent value="attendance">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Attendance History</CardTitle>
							<Button
								size="sm"
								onClick={() => {
									const upcomingSessions = sessions
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
										sessions: upcomingSessions,
									});
								}}
							>
								<PlusIcon className="mr-2 size-4" />
								Add Attendance
							</Button>
						</CardHeader>
						<CardContent>
							{attendanceRecords.length === 0 ? (
								<p className="py-6 text-center text-muted-foreground">
									No attendance records
								</p>
							) : (
								<div className="space-y-2">
									{attendanceRecords.map((record) => (
										<div
											key={record.id}
											className="flex items-center justify-between rounded-lg border p-3"
										>
											<div className="space-y-1">
												<Link
													href={`/dashboard/organization/training-sessions/${record.session.id}`}
													className="font-medium hover:underline"
												>
													{record.session.title}
												</Link>
												<p className="text-muted-foreground text-sm">
													{format(
														new Date(record.session.startTime),
														"MMM d, yyyy 'at' h:mm a",
													)}
												</p>
											</div>
											<div className="flex items-center gap-3">
												<Badge
													className={cn(
														"border-none",
														attendanceStatusColors[record.status],
													)}
												>
													{capitalize(record.status)}
												</Badge>
												{record.checkedInAt && (
													<span className="text-muted-foreground text-sm">
														Checked in:{" "}
														{format(new Date(record.checkedInAt), "h:mm a")}
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Physical Metrics Tab */}
				<TabsContent value="physical">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Physical Metrics History</CardTitle>
							<Button
								size="sm"
								onClick={() => {
									NiceModal.show(AddPhysicalMetricsModal, { athleteId });
								}}
							>
								<PlusIcon className="mr-2 size-4" />
								Add Measurement
							</Button>
						</CardHeader>
						<CardContent>
							{!physicalMetrics || physicalMetrics.length === 0 ? (
								<p className="py-6 text-center text-muted-foreground">
									No physical metrics recorded yet
								</p>
							) : (
								<div className="space-y-3">
									{physicalMetrics.map((metric) => (
										<div key={metric.id} className="rounded-lg border p-4">
											<div className="flex items-center justify-between">
												<p className="font-medium text-sm">
													{format(new Date(metric.measuredAt), "MMMM d, yyyy")}
												</p>
											</div>
											<div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
												{metric.height && (
													<div className="flex items-center gap-2">
														<RulerIcon className="size-4 text-muted-foreground" />
														<div>
															<p className="text-muted-foreground text-xs">
																Height
															</p>
															<p className="font-medium">{metric.height} cm</p>
														</div>
													</div>
												)}
												{metric.weight && (
													<div className="flex items-center gap-2">
														<WeightIcon className="size-4 text-muted-foreground" />
														<div>
															<p className="text-muted-foreground text-xs">
																Weight
															</p>
															<p className="font-medium">
																{(metric.weight / 1000).toFixed(1)} kg
															</p>
														</div>
													</div>
												)}
												{metric.bodyFatPercentage && (
													<div className="flex items-center gap-2">
														<PercentIcon className="size-4 text-muted-foreground" />
														<div>
															<p className="text-muted-foreground text-xs">
																Body Fat
															</p>
															<p className="font-medium">
																{(metric.bodyFatPercentage / 10).toFixed(1)}%
															</p>
														</div>
													</div>
												)}
												{metric.muscleMass && (
													<div className="flex items-center gap-2">
														<ActivityIcon className="size-4 text-muted-foreground" />
														<div>
															<p className="text-muted-foreground text-xs">
																Muscle Mass
															</p>
															<p className="font-medium">
																{(metric.muscleMass / 1000).toFixed(1)} kg
															</p>
														</div>
													</div>
												)}
												{metric.wingspan && (
													<div className="flex items-center gap-2">
														<RulerIcon className="size-4 text-muted-foreground" />
														<div>
															<p className="text-muted-foreground text-xs">
																Wingspan
															</p>
															<p className="font-medium">
																{metric.wingspan} cm
															</p>
														</div>
													</div>
												)}
												{metric.standingReach && (
													<div className="flex items-center gap-2">
														<TrendingUpIcon className="size-4 text-muted-foreground" />
														<div>
															<p className="text-muted-foreground text-xs">
																Standing Reach
															</p>
															<p className="font-medium">
																{metric.standingReach} cm
															</p>
														</div>
													</div>
												)}
											</div>
											{metric.notes && (
												<p className="mt-3 text-muted-foreground text-sm">
													{metric.notes}
												</p>
											)}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Fitness Tests Tab */}
				<TabsContent value="fitness">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Fitness Tests</CardTitle>
							<Button
								size="sm"
								onClick={() => {
									NiceModal.show(AddFitnessTestModal, { athleteId });
								}}
							>
								<PlusIcon className="mr-2 size-4" />
								Add Test Result
							</Button>
						</CardHeader>
						<CardContent>
							{!fitnessTests || fitnessTests.length === 0 ? (
								<p className="py-6 text-center text-muted-foreground">
									No fitness tests recorded yet
								</p>
							) : (
								<div className="space-y-3">
									{fitnessTests.map((test) => (
										<div
											key={test.id}
											className="flex items-center justify-between rounded-lg border p-4"
										>
											<div className="flex items-center gap-4">
												<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
													<ActivityIcon className="size-5 text-primary" />
												</div>
												<div>
													<p className="font-medium">
														{formatTestType(test.testType)}
													</p>
													<p className="text-muted-foreground text-sm">
														{format(new Date(test.testDate), "MMM d, yyyy")}
													</p>
												</div>
											</div>
											<div className="text-right">
												<p className="font-bold text-lg">
													{test.result} {test.unit}
												</p>
												{test.notes && (
													<p className="max-w-[200px] truncate text-muted-foreground text-xs">
														{test.notes}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Career History Tab */}
				<TabsContent value="career">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Career History</CardTitle>
							<Button
								size="sm"
								onClick={() => {
									NiceModal.show(AddCareerHistoryModal, { athleteId });
								}}
							>
								<PlusIcon className="mr-2 size-4" />
								Add Entry
							</Button>
						</CardHeader>
						<CardContent>
							{!careerHistory || careerHistory.length === 0 ? (
								<div className="py-10 text-center">
									<BriefcaseIcon className="mx-auto size-12 text-muted-foreground/50" />
									<p className="mt-3 text-muted-foreground">
										No career history recorded yet
									</p>
									<Button
										variant="outline"
										size="sm"
										className="mt-4"
										onClick={() => {
											NiceModal.show(AddCareerHistoryModal, { athleteId });
										}}
									>
										<PlusIcon className="mr-2 size-4" />
										Add First Entry
									</Button>
								</div>
							) : (
								<div className="space-y-8">
									{/* Clubs Section */}
									<CareerClubsSection careerHistory={careerHistory} />
									{/* National Teams Section */}
									<CareerNationalTeamsSection careerHistory={careerHistory} />
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Teams Tab */}
				<TabsContent value="teams">
					<Card>
						<CardHeader>
							<CardTitle>Teams</CardTitle>
						</CardHeader>
						<CardContent>
							{!teams || teams.length === 0 ? (
								<div className="py-10 text-center">
									<ShieldIcon className="mx-auto size-12 text-muted-foreground/50" />
									<p className="mt-3 text-muted-foreground">
										Not a member of any team
									</p>
								</div>
							) : (
								<div className="space-y-4">
									{teams.map((team) => (
										<Link
											key={team.id}
											href={`/dashboard/organization/teams/${team.id}`}
											className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
										>
											<div className="flex items-center gap-3">
												<div
													className="flex h-10 w-10 items-center justify-center rounded-full"
													style={{
														backgroundColor: team.primaryColor ?? "#3B82F6",
													}}
												>
													<ShieldIcon className="h-5 w-5 text-white" />
												</div>
												<div>
													<div className="font-medium">{team.name}</div>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														{team.season && <span>{team.season.name}</span>}
														{team.ageCategory && (
															<span className="flex items-center gap-1">
																<UsersIcon className="h-3 w-3" />
																{team.ageCategory.name}
															</span>
														)}
													</div>
												</div>
											</div>
											<div className="flex items-center gap-2">
												{team.membership.jerseyNumber && (
													<Badge variant="outline" className="font-bold">
														#{team.membership.jerseyNumber}
													</Badge>
												)}
												<Badge variant="secondary">
													{team.membership.role === "captain"
														? "Capitán"
														: team.membership.role === "vice_captain"
															? "Vice-capitán"
															: team.membership.position || "Jugador"}
												</Badge>
											</div>
										</Link>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Wellness Tab */}
				<TabsContent value="wellness">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Wellness History</CardTitle>
							<Button
								size="sm"
								onClick={() => {
									NiceModal.show(AddWellnessModal, {
										athleteId,
										athleteName: athlete.user?.name,
									});
								}}
							>
								<PlusIcon className="mr-2 size-4" />
								Add Survey
							</Button>
						</CardHeader>
						<CardContent>
							{!wellnessSurveys || wellnessSurveys.length === 0 ? (
								<div className="py-10 text-center">
									<HeartPulseIcon className="mx-auto size-12 text-muted-foreground/50" />
									<p className="mt-3 text-muted-foreground">
										No wellness surveys recorded yet
									</p>
									<Button
										variant="outline"
										size="sm"
										className="mt-4"
										onClick={() => {
											NiceModal.show(AddWellnessModal, {
												athleteId,
												athleteName: athlete.user?.name,
											});
										}}
									>
										<PlusIcon className="mr-2 size-4" />
										Add First Survey
									</Button>
								</div>
							) : (
								<div className="space-y-3">
									{wellnessSurveys.map((survey) => (
										<div key={survey.id} className="rounded-lg border p-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<HeartPulseIcon className="size-4 text-red-500" />
													<p className="font-medium text-sm">
														{format(
															new Date(survey.surveyDate),
															"EEEE, MMMM d, yyyy",
														)}
													</p>
												</div>
												<p className="text-muted-foreground text-xs">
													{format(new Date(survey.createdAt), "h:mm a")}
												</p>
											</div>
											<div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
												<div className="flex flex-col items-center rounded-lg bg-muted/50 p-2">
													<BedIcon className="size-4 text-muted-foreground" />
													<p className="text-muted-foreground text-xs">Sleep</p>
													<p className="font-medium text-sm">
														{(survey.sleepHours / 60).toFixed(1)}h
													</p>
												</div>
												<div className="flex flex-col items-center rounded-lg bg-muted/50 p-2">
													<StarIcon className="size-4 text-muted-foreground" />
													<p className="text-muted-foreground text-xs">
														Quality
													</p>
													<p
														className={cn(
															"font-medium text-sm",
															getWellnessScoreColor(survey.sleepQuality),
														)}
													>
														{survey.sleepQuality}/10
													</p>
												</div>
												<div className="flex flex-col items-center rounded-lg bg-muted/50 p-2">
													<ActivityIcon className="size-4 text-muted-foreground" />
													<p className="text-muted-foreground text-xs">
														Energy
													</p>
													<p
														className={cn(
															"font-medium text-sm",
															getWellnessScoreColor(survey.energy),
														)}
													>
														{survey.energy}/10
													</p>
												</div>
												<div className="flex flex-col items-center rounded-lg bg-muted/50 p-2">
													<span className="text-sm">😴</span>
													<p className="text-muted-foreground text-xs">
														Fatigue
													</p>
													<p
														className={cn(
															"font-medium text-sm",
															getWellnessScoreColor(survey.fatigue, true),
														)}
													>
														{survey.fatigue}/10
													</p>
												</div>
												<div className="flex flex-col items-center rounded-lg bg-muted/50 p-2">
													<span className="text-sm">💪</span>
													<p className="text-muted-foreground text-xs">
														Soreness
													</p>
													<p
														className={cn(
															"font-medium text-sm",
															getWellnessScoreColor(
																survey.muscleSoreness,
																true,
															),
														)}
													>
														{survey.muscleSoreness}/10
													</p>
												</div>
												<div className="flex flex-col items-center rounded-lg bg-muted/50 p-2">
													<span className="text-sm">
														{getMoodEmoji(survey.mood)}
													</span>
													<p className="text-muted-foreground text-xs">Mood</p>
													<p
														className={cn(
															"font-medium text-sm",
															getWellnessScoreColor(survey.mood),
														)}
													>
														{survey.mood}/10
													</p>
												</div>
												<div className="flex flex-col items-center rounded-lg bg-muted/50 p-2">
													<span className="text-sm">😰</span>
													<p className="text-muted-foreground text-xs">
														Stress
													</p>
													<p
														className={cn(
															"font-medium text-sm",
															getWellnessScoreColor(survey.stressLevel, true),
														)}
													>
														{survey.stressLevel}/10
													</p>
												</div>
											</div>
											{survey.notes && (
												<p className="mt-3 text-muted-foreground text-sm">
													<span className="font-medium">Notes:</span>{" "}
													{survey.notes}
												</p>
											)}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
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

				{/* Info Tab - Additional Profile Information */}
				<TabsContent value="info">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Contact Information */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<MapPinIcon className="size-4" />
									Contacto y Residencia
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{athlete.phone && (
									<div>
										<p className="text-muted-foreground text-xs">Teléfono</p>
										<p className="font-medium">{athlete.phone}</p>
									</div>
								)}
								{(athlete.residenceCity || athlete.residenceCountry) && (
									<div>
										<p className="text-muted-foreground text-xs">Residencia</p>
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
											Nacionalidad
										</p>
										<p className="font-medium">{athlete.nationality}</p>
									</div>
								)}
								{!athlete.phone &&
									!athlete.residenceCity &&
									!athlete.residenceCountry &&
									!athlete.nationality && (
										<p className="text-muted-foreground text-sm">
											No hay información de contacto disponible
										</p>
									)}
							</CardContent>
						</Card>

						{/* Parent/Guardian Contact */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<UsersIcon className="size-4" />
									Contacto de Padre/Tutor
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{athlete.parentName ? (
									<>
										<div>
											<p className="text-muted-foreground text-xs">Nombre</p>
											<p className="font-medium">{athlete.parentName}</p>
										</div>
										{athlete.parentRelationship && (
											<div>
												<p className="text-muted-foreground text-xs">
													Relación
												</p>
												<p className="font-medium capitalize">
													{athlete.parentRelationship}
												</p>
											</div>
										)}
										{athlete.parentPhone && (
											<div>
												<p className="text-muted-foreground text-xs">
													Teléfono
												</p>
												<p className="font-medium">{athlete.parentPhone}</p>
											</div>
										)}
										{athlete.parentEmail && (
											<div>
												<p className="text-muted-foreground text-xs">Email</p>
												<p className="font-medium">{athlete.parentEmail}</p>
											</div>
										)}
									</>
								) : (
									<p className="text-muted-foreground text-sm">
										No hay información de padre/tutor disponible
									</p>
								)}
							</CardContent>
						</Card>

						{/* Education */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<StarIcon className="size-4" />
									Educación
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{athlete.educationInstitution ? (
									<>
										<div>
											<p className="text-muted-foreground text-xs">
												Institución Educativa
											</p>
											<p className="font-medium">
												{athlete.educationInstitution}
											</p>
										</div>
										{athlete.educationYear && (
											<div>
												<p className="text-muted-foreground text-xs">
													Año Académico
												</p>
												<p className="font-medium">{athlete.educationYear}</p>
											</div>
										)}
										{athlete.expectedGraduationDate && (
											<div>
												<p className="text-muted-foreground text-xs">
													Graduación Estimada
												</p>
												<p className="font-medium">
													{format(
														new Date(athlete.expectedGraduationDate),
														"MMMM yyyy",
													)}
												</p>
											</div>
										)}
										{athlete.gpa && (
											<div>
												<p className="text-muted-foreground text-xs">
													Promedio (GPA)
												</p>
												<p className="font-medium">{athlete.gpa}</p>
											</div>
										)}
									</>
								) : (
									<p className="text-muted-foreground text-sm">
										No hay información educativa disponible
									</p>
								)}
							</CardContent>
						</Card>

						{/* Health & Dietary */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<HeartPulseIcon className="size-4" />
									Salud y Alimentación
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{athlete.dietaryRestrictions && (
									<div>
										<p className="text-muted-foreground text-xs">
											Restricciones Alimenticias
										</p>
										<p className="font-medium">{athlete.dietaryRestrictions}</p>
									</div>
								)}
								{athlete.allergies && (
									<div>
										<p className="text-muted-foreground text-xs">Alergias</p>
										<p className="font-medium text-red-600">
											{athlete.allergies}
										</p>
									</div>
								)}
								{!athlete.dietaryRestrictions && !athlete.allergies && (
									<p className="text-muted-foreground text-sm">
										No hay restricciones ni alergias registradas
									</p>
								)}
							</CardContent>
						</Card>

						{/* Bio */}
						{athlete.bio && (
							<Card className="md:col-span-2">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<UserIcon className="size-4" />
										Biografía / Notas
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="whitespace-pre-wrap">{athlete.bio}</p>
								</CardContent>
							</Card>
						)}

						{/* YouTube Videos */}
						{athlete.youtubeVideos && athlete.youtubeVideos.length > 0 && (
							<Card className="md:col-span-2">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<TrendingUpIcon className="size-4" />
										Videos Destacados
									</CardTitle>
								</CardHeader>
								<CardContent>
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
															<TrendingUpIcon className="size-8 text-muted-foreground" />
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
								</CardContent>
							</Card>
						)}
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

// Helper function to format fitness test type for display
function formatTestType(testType: string): string {
	const testTypeLabels: Record<string, string> = {
		sprint_40m: "40m Sprint",
		sprint_60m: "60m Sprint",
		sprint_100m: "100m Sprint",
		vertical_jump: "Vertical Jump",
		standing_long_jump: "Standing Long Jump",
		yo_yo_test: "Yo-Yo Test",
		beep_test: "Beep Test",
		cooper_test: "Cooper Test",
		agility_t_test: "Agility T-Test",
		illinois_agility: "Illinois Agility",
		max_speed: "Max Speed",
		reaction_time: "Reaction Time",
		flexibility: "Flexibility",
		plank_hold: "Plank Hold",
		push_ups: "Push Ups",
		sit_ups: "Sit Ups",
		other: "Other",
	};
	return testTypeLabels[testType] ?? testType;
}

// Career Entry types and components
interface CareerEntry {
	id: string;
	clubName: string;
	startDate: Date | null;
	endDate: Date | null;
	position: string | null;
	achievements: string | null;
	wasNationalTeam: boolean;
	nationalTeamLevel: string | null;
	notes: string | null;
}

// Career Sections - extracted from IIFEs for better performance
function CareerClubsSection({
	careerHistory,
}: {
	careerHistory: CareerEntry[];
}) {
	const clubs = careerHistory.filter((e) => !e.wasNationalTeam);
	if (clubs.length === 0) return null;
	return (
		<div>
			<div className="flex items-center gap-2 mb-4">
				<div className="flex items-center justify-center size-8 rounded-full bg-primary/10">
					<BriefcaseIcon className="size-4 text-primary" />
				</div>
				<h3 className="font-semibold">Clubs & Teams</h3>
				<Badge variant="secondary" className="ml-auto">
					{clubs.length}
				</Badge>
			</div>
			<div className="relative ml-4 space-y-0 border-l-2 border-primary/20 pl-6">
				{clubs.map((entry) => (
					<CareerEntryCard key={entry.id} entry={entry} />
				))}
			</div>
		</div>
	);
}

function CareerNationalTeamsSection({
	careerHistory,
}: {
	careerHistory: CareerEntry[];
}) {
	const nationalTeams = careerHistory.filter((e) => e.wasNationalTeam);
	if (nationalTeams.length === 0) return null;
	return (
		<div>
			<div className="flex items-center gap-2 mb-4">
				<div className="flex items-center justify-center size-8 rounded-full bg-yellow-500/10">
					<FlagIcon className="size-4 text-yellow-600" />
				</div>
				<h3 className="font-semibold">National Team Selections</h3>
				<Badge
					variant="secondary"
					className="ml-auto bg-yellow-100 text-yellow-700"
				>
					{nationalTeams.length}
				</Badge>
			</div>
			<div className="relative ml-4 space-y-0 border-l-2 border-yellow-500/30 pl-6">
				{nationalTeams.map((entry) => (
					<CareerEntryCard key={entry.id} entry={entry} isNationalTeam />
				))}
			</div>
		</div>
	);
}

// Career Entry Card component
function CareerEntryCard({
	entry,
	isNationalTeam = false,
}: {
	entry: CareerEntry;
	isNationalTeam?: boolean;
}) {
	return (
		<div className="relative pb-6 last:pb-0">
			{/* Timeline dot */}
			<div
				className={cn(
					"absolute -left-[31px] top-1 flex size-4 items-center justify-center rounded-full",
					isNationalTeam ? "bg-yellow-500" : "bg-primary",
				)}
			/>

			<div className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
				<div className="flex flex-wrap items-start justify-between gap-2">
					<div className="space-y-1">
						<div className="flex items-center gap-2 flex-wrap">
							<h4 className="font-semibold">{entry.clubName}</h4>
							{isNationalTeam && entry.nationalTeamLevel && (
								<Badge
									variant="outline"
									className="border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
								>
									{entry.nationalTeamLevel}
								</Badge>
							)}
						</div>
						{entry.position && (
							<p className="text-muted-foreground text-sm">{entry.position}</p>
						)}
					</div>
					<Badge variant="secondary" className="font-normal">
						{entry.startDate
							? format(new Date(entry.startDate), "MMM yyyy")
							: "?"}
						{" — "}
						{entry.endDate
							? format(new Date(entry.endDate), "MMM yyyy")
							: "Present"}
					</Badge>
				</div>

				{entry.achievements && (
					<div className="mt-3 flex items-start gap-2 rounded-md bg-muted/50 p-2">
						<TrophyIcon className="size-4 text-yellow-600 shrink-0 mt-0.5" />
						<p className="text-sm">{entry.achievements}</p>
					</div>
				)}

				{entry.notes && (
					<p className="mt-2 text-muted-foreground text-sm italic">
						{entry.notes}
					</p>
				)}
			</div>
		</div>
	);
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
