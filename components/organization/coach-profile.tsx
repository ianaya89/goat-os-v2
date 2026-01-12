"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	ArrowLeftIcon,
	CalendarIcon,
	CheckCircleIcon,
	ClipboardListIcon,
	ClockIcon,
	EditIcon,
	MapPinIcon,
	StarIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { CoachesModal } from "@/components/organization/coaches-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user/user-avatar";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface CoachProfileProps {
	coachId: string;
}

const statusColors: Record<string, string> = {
	active: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
	on_leave:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
};

const sessionStatusColors: Record<string, string> = {
	pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
	confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	completed:
		"bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
};

export function CoachProfile({ coachId }: CoachProfileProps) {
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
					<Button asChild size="icon" variant="ghost">
						<Link href="/dashboard/organization/coaches">
							<ArrowLeftIcon className="size-5" />
						</Link>
					</Button>
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
							<Badge className={cn("border-none", statusColors[coach.status])}>
								{capitalize(coach.status.replace("_", " "))}
							</Badge>
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
							<div className="flex items-center gap-1">
								<ClipboardListIcon className="size-4" />
								<span>{coach.specialty}</span>
							</div>
							{coach.user?.email && (
								<span className="text-muted-foreground">
									{coach.user.email}
								</span>
							)}
						</div>
						{coach.bio && (
							<p className="mt-2 max-w-xl text-muted-foreground text-sm">
								{coach.bio}
							</p>
						)}
					</div>
				</div>
				<Button
					variant="outline"
					onClick={() => NiceModal.show(CoachesModal, { coach })}
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
									{recentSessions.slice(0, 20).map((session) => (
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
												<div className="flex items-center gap-2">
													{session.athleteGroup && (
														<Badge variant="outline">
															<UsersIcon className="mr-1 size-3" />
															{session.athleteGroup.name}
														</Badge>
													)}
													<span className="text-muted-foreground text-xs">
														{session.athletes.length} athletes
													</span>
												</div>
											</div>
										</Link>
									))}
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
					<Card>
						<CardHeader>
							<CardTitle>Evaluations Given</CardTitle>
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
