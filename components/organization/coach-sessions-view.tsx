"use client";

import { format, isAfter, isBefore, isToday, startOfDay } from "date-fns";
import {
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	MapPinIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user/user-avatar";
import { TrainingSessionStatus } from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const statusColors: Record<string, string> = {
	pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
	confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	completed: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
};

export function CoachSessionsView() {
	const [tab, setTab] = React.useState<"upcoming" | "past" | "all">("upcoming");

	const { data, isLoading, error } =
		trpc.organization.trainingSession.listMySessionsAsCoach.useQuery({
			limit: 100,
			offset: 0,
			sortBy: "startTime",
			sortOrder: tab === "past" ? "desc" : "asc",
		});

	const sessions = React.useMemo(() => {
		if (!data?.sessions) return [];

		const now = startOfDay(new Date());

		if (tab === "upcoming") {
			return data.sessions.filter(
				(s) =>
					(isAfter(new Date(s.startTime), now) || isToday(new Date(s.startTime))) &&
					s.status !== TrainingSessionStatus.cancelled &&
					s.status !== TrainingSessionStatus.completed,
			);
		}
		if (tab === "past") {
			return data.sessions.filter(
				(s) =>
					isBefore(new Date(s.startTime), now) ||
					s.status === TrainingSessionStatus.completed,
			);
		}
		return data.sessions;
	}, [data?.sessions, tab]);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="grid gap-4 md:grid-cols-3">
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
				</div>
				<Skeleton className="h-96" />
			</div>
		);
	}

	if (!data?.coach) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">
						No coach profile found for your account in this organization.
					</p>
					<p className="mt-2 text-muted-foreground text-sm">
						Contact your organization administrator to be added as a coach.
					</p>
				</CardContent>
			</Card>
		);
	}

	const upcomingCount =
		data.sessions.filter(
			(s) =>
				(isAfter(new Date(s.startTime), startOfDay(new Date())) ||
					isToday(new Date(s.startTime))) &&
				s.status !== TrainingSessionStatus.cancelled &&
				s.status !== TrainingSessionStatus.completed,
		).length ?? 0;

	const completedCount =
		data.sessions.filter(
			(s) => s.status === TrainingSessionStatus.completed,
		).length ?? 0;

	const todayCount =
		data.sessions.filter(
			(s) =>
				isToday(new Date(s.startTime)) &&
				s.status !== TrainingSessionStatus.cancelled,
		).length ?? 0;

	return (
		<div className="space-y-6">
			{/* Stats */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Today's Sessions
						</CardTitle>
						<CalendarIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{todayCount}</div>
						<p className="text-muted-foreground text-xs">
							{todayCount === 1 ? "session" : "sessions"} scheduled
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Upcoming Sessions
						</CardTitle>
						<ClockIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{upcomingCount}</div>
						<p className="text-muted-foreground text-xs">
							pending & confirmed
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Completed Sessions
						</CardTitle>
						<CheckCircleIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{completedCount}</div>
						<p className="text-muted-foreground text-xs">all time</p>
					</CardContent>
				</Card>
			</div>

			{/* Sessions List */}
			<Card>
				<CardHeader>
					<CardTitle>My Sessions</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
						<TabsList>
							<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
							<TabsTrigger value="past">Past</TabsTrigger>
							<TabsTrigger value="all">All</TabsTrigger>
						</TabsList>
						<TabsContent value={tab} className="mt-4">
							{sessions.length === 0 ? (
								<div className="py-10 text-center text-muted-foreground">
									No {tab === "all" ? "" : tab} sessions found.
								</div>
							) : (
								<div className="space-y-3">
									{sessions.map((session) => (
										<SessionCard key={session.id} session={session} />
									))}
								</div>
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}

interface SessionCardProps {
	session: {
		id: string;
		title: string;
		startTime: Date;
		endTime: Date;
		status: string;
		location?: { id: string; name: string } | null;
		athleteGroup?: {
			id: string;
			name: string;
			members?: Array<{
				athlete: {
					id: string;
					user?: { id: string; name: string; image: string | null } | null;
				};
			}>;
		} | null;
		athletes: Array<{
			athlete: {
				id: string;
				user?: { id: string; name: string; image: string | null } | null;
			};
		}>;
	};
}

function SessionCard({ session }: SessionCardProps) {
	const isUpcoming = isAfter(new Date(session.startTime), new Date());
	const isTodaySession = isToday(new Date(session.startTime));

	// Get athletes from either group or direct assignment
	const athletes = session.athleteGroup?.members
		? session.athleteGroup.members.map((m) => ({
				id: m.athlete.id,
				name: m.athlete.user?.name ?? "Unknown",
				image: m.athlete.user?.image ?? null,
			}))
		: session.athletes.map((a) => ({
				id: a.athlete.id,
				name: a.athlete.user?.name ?? "Unknown",
				image: a.athlete.user?.image ?? null,
			}));

	return (
		<Link href={`/dashboard/organization/training-sessions/${session.id}`}>
			<div
				className={cn(
					"flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between",
					isTodaySession && "border-primary bg-primary/5",
				)}
			>
				<div className="flex-1 space-y-1">
					<div className="flex items-center gap-2">
						<h3 className="font-medium">{session.title}</h3>
						<Badge className={cn("border-none", statusColors[session.status])}>
							{capitalize(session.status)}
						</Badge>
						{isTodaySession && (
							<Badge variant="outline" className="border-primary text-primary">
								Today
							</Badge>
						)}
					</div>
					<div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
						<div className="flex items-center gap-1">
							<CalendarIcon className="size-3.5" />
							<span>
								{format(new Date(session.startTime), "EEE, MMM d, yyyy")}
							</span>
						</div>
						<div className="flex items-center gap-1">
							<ClockIcon className="size-3.5" />
							<span>
								{format(new Date(session.startTime), "h:mm a")} -{" "}
								{format(new Date(session.endTime), "h:mm a")}
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
						<Badge variant="outline">{session.athleteGroup.name}</Badge>
					)}
					{athletes.length > 0 && (
						<div className="flex items-center gap-1">
							<UsersIcon className="size-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">
								{athletes.length}
							</span>
							<div className="ml-1 flex -space-x-2">
								{athletes.slice(0, 3).map((athlete) => (
									<UserAvatar
										key={athlete.id}
										className="size-6 border-2 border-background"
										name={athlete.name}
										src={athlete.image ?? undefined}
									/>
								))}
								{athletes.length > 3 && (
									<div className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
										+{athletes.length - 3}
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</Link>
	);
}
