"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format, isAfter, isBefore, isToday, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
	ActivityIcon,
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	MapPinIcon,
	MessageSquarePlusIcon,
	StarIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { SessionFeedbackModal } from "@/components/organization/session-feedback-modal";
import { WellnessSurveyCard } from "@/components/organization/wellness-survey-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user/user-avatar";
import { AttendanceStatus, TrainingSessionStatus } from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const statusColors: Record<string, string> = {
	pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
	confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	completed:
		"bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
};

const attendanceColors: Record<string, string> = {
	present: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	absent: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
	late: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
	excused: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

export function AthleteSessionsView() {
	const t = useTranslations("training.athleteView");
	const [tab, setTab] = React.useState<"upcoming" | "past" | "all">("upcoming");

	const { data, isLoading } =
		trpc.organization.trainingSession.listMySessionsAsAthlete.useQuery({
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
					(isAfter(new Date(s.startTime), now) ||
						isToday(new Date(s.startTime))) &&
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

	// Calculate stats
	const stats = React.useMemo(() => {
		if (!data?.sessions) {
			return {
				todayCount: 0,
				upcomingCount: 0,
				attendedCount: 0,
				averageRating: 0,
			};
		}

		const now = startOfDay(new Date());

		const todayCount = data.sessions.filter(
			(s) =>
				isToday(new Date(s.startTime)) &&
				s.status !== TrainingSessionStatus.cancelled,
		).length;

		const upcomingCount = data.sessions.filter(
			(s) =>
				(isAfter(new Date(s.startTime), now) ||
					isToday(new Date(s.startTime))) &&
				s.status !== TrainingSessionStatus.cancelled &&
				s.status !== TrainingSessionStatus.completed,
		).length;

		const attendedCount = data.sessions.filter(
			(s) =>
				s.attendances?.[0]?.status === AttendanceStatus.present ||
				s.attendances?.[0]?.status === AttendanceStatus.late,
		).length;

		// Calculate average rating from evaluations
		let totalRating = 0;
		let ratingCount = 0;
		for (const session of data.sessions) {
			if (session.evaluations?.[0]?.performanceRating) {
				totalRating += session.evaluations[0].performanceRating;
				ratingCount++;
			}
		}
		const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

		return { todayCount, upcomingCount, attendedCount, averageRating };
	}, [data?.sessions]);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="grid gap-4 md:grid-cols-4">
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
					<Skeleton className="h-24" />
				</div>
				<Skeleton className="h-96" />
			</div>
		);
	}

	if (!data?.athlete) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">{t("noAthleteProfile")}</p>
					<p className="mt-2 text-muted-foreground text-sm">
						{t("contactAdmin")}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Stats */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("todaySessions")}
						</CardTitle>
						<CalendarIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.todayCount}</div>
						<p className="text-muted-foreground text-xs">
							{t("sessionScheduled", { count: stats.todayCount })}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("upcomingSessions")}
						</CardTitle>
						<ClockIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.upcomingCount}</div>
						<p className="text-muted-foreground text-xs">
							{t("pendingConfirmed")}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("sessionsAttended")}
						</CardTitle>
						<CheckCircleIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.attendedCount}</div>
						<p className="text-muted-foreground text-xs">{t("allTime")}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("averageRating")}
						</CardTitle>
						<StarIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "-"}
						</div>
						<p className="text-muted-foreground text-xs">
							{stats.averageRating > 0 ? t("outOf5") : t("noEvaluationsYet")}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Wellness Survey */}
			<WellnessSurveyCard />

			{/* Sessions List */}
			<Card>
				<CardHeader>
					<CardTitle>{t("myTrainingSessions")}</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
						<TabsList>
							<TabsTrigger value="upcoming">{t("upcoming")}</TabsTrigger>
							<TabsTrigger value="past">{t("past")}</TabsTrigger>
							<TabsTrigger value="all">{t("all")}</TabsTrigger>
						</TabsList>
						<TabsContent value={tab} className="mt-4">
							{sessions.length === 0 ? (
								<div className="py-10 text-center text-muted-foreground">
									{t("noSessionsFound", { filter: tab === "all" ? "" : tab })}
								</div>
							) : (
								<div className="divide-y">
									{sessions.map((session) => (
										<AthleteSessionCard
											key={session.id}
											session={session}
											t={t}
										/>
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

interface AthleteSessionCardProps {
	session: {
		id: string;
		title: string;
		startTime: Date;
		endTime: Date;
		status: string;
		location?: { id: string; name: string } | null;
		athleteGroup?: { id: string; name: string } | null;
		coaches: Array<{
			coach: {
				id: string;
				user?: { id: string; name: string; image: string | null } | null;
			};
		}>;
		attendances?: Array<{
			id: string;
			status: string;
		}>;
		evaluations?: Array<{
			id: string;
			performanceRating: number | null;
		}>;
		feedback?: Array<{
			id: string;
			rpeRating: number | null;
			satisfactionRating: number | null;
		}>;
	};
	t: ReturnType<typeof useTranslations<"training.athleteView">>;
}

function AthleteSessionCard({ session, t }: AthleteSessionCardProps) {
	const isTodaySession = isToday(new Date(session.startTime));
	const isPast =
		isBefore(new Date(session.startTime), new Date()) ||
		session.status === TrainingSessionStatus.completed;

	const attendance = session.attendances?.[0];
	const evaluation = session.evaluations?.[0];
	const feedback = session.feedback?.[0];

	// Get primary coach
	const primaryCoach = session.coaches[0]?.coach;

	const handleFeedbackClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		NiceModal.show(SessionFeedbackModal, {
			sessionId: session.id,
			sessionTitle: session.title,
		});
	};

	return (
		<Link href={`/dashboard/organization/training-sessions/${session.id}`}>
			<div
				className={cn(
					"flex flex-col gap-4 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between",
					isTodaySession && "bg-primary/5",
				)}
			>
				<div className="flex-1 space-y-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="font-medium">{session.title}</h3>
						<Badge className={cn("border-none", statusColors[session.status])}>
							{capitalize(session.status)}
						</Badge>
						{isTodaySession && (
							<Badge variant="outline" className="border-primary text-primary">
								{t("today")}
							</Badge>
						)}
						{isPast && attendance && (
							<Badge
								className={cn(
									"border-none",
									attendanceColors[attendance.status],
								)}
							>
								{capitalize(attendance.status)}
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

				<div className="flex items-center gap-3">
					{/* Coach info */}
					{primaryCoach && (
						<div className="flex items-center gap-2">
							<UserAvatar
								className="size-6"
								name={primaryCoach.user?.name ?? ""}
								src={primaryCoach.user?.image ?? undefined}
							/>
							<span className="text-muted-foreground text-sm">
								{primaryCoach.user?.name ?? t("unknownCoach")}
							</span>
						</div>
					)}

					{/* Evaluation rating */}
					{isPast && evaluation?.performanceRating && (
						<div className="flex items-center gap-1">
							<StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
							<span className="font-medium text-sm">
								{evaluation.performanceRating}/5
							</span>
						</div>
					)}

					{/* Feedback indicator */}
					{isPast &&
						(feedback?.rpeRating ? (
							<Badge
								variant="outline"
								className="gap-1 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
							>
								<ActivityIcon className="size-3" />
								RPE {feedback.rpeRating}/10
							</Badge>
						) : (
							<Button
								variant="outline"
								size="sm"
								className="h-7 gap-1 text-xs"
								onClick={handleFeedbackClick}
							>
								<MessageSquarePlusIcon className="size-3" />
								{t("addFeedback")}
							</Button>
						))}

					{session.athleteGroup && (
						<Badge variant="outline">{session.athleteGroup.name}</Badge>
					)}
				</div>
			</div>
		</Link>
	);
}
