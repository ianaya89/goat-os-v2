"use client";

import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
	BanknoteIcon,
	CalendarCheckIcon,
	CalendarIcon,
	ClockIcon,
	MapPinIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { TrainingSessionStatusSelect } from "@/components/organization/training-session-status-select";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/trpc/client";

type SessionItem = {
	id: string;
	title: string;
	startTime: Date;
	endTime: Date;
	status: string;
	location: { id: string; name: string } | null;
	athleteGroup: { id: string; name: string } | null;
	coaches: Array<{
		coach: {
			user: { id: string; name: string } | null;
		};
	}>;
	athletes: Array<{
		athlete: {
			user: { id: string; name: string } | null;
		};
	}>;
};

function SessionList({
	sessions,
	emptyMessage,
}: {
	sessions: SessionItem[];
	emptyMessage: string;
}) {
	if (sessions.length === 0) {
		return (
			<div className="flex flex-col items-center py-6 text-center">
				<CalendarIcon className="size-10 text-muted-foreground/50 mb-2" />
				<p className="text-muted-foreground text-sm">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
			{sessions.map((session) => {
				const coaches = session.coaches
					?.map((c) => c.coach.user)
					.filter(Boolean);
				const athletes = session.athletes
					?.map((a) => a.athlete.user)
					.filter(Boolean);
				const hasMetadata =
					session.location ||
					coaches.length > 0 ||
					session.athleteGroup ||
					athletes.length > 0;

				return (
					<div key={session.id} className="rounded-md border p-2 space-y-1">
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2 min-w-0">
								<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
									<ClockIcon className="size-3.5 text-muted-foreground" />
								</div>
								<div className="min-w-0">
									<Link
										href={`/dashboard/organization/training-sessions/${session.id}`}
										className="font-medium text-xs hover:underline leading-tight"
									>
										{session.title}
									</Link>
									<p className="text-muted-foreground text-[11px]">
										{format(session.startTime, "HH:mm")} -{" "}
										{format(session.endTime, "HH:mm")}
									</p>
								</div>
							</div>
							<TrainingSessionStatusSelect
								sessionId={session.id}
								currentStatus={session.status}
								size="sm"
							/>
						</div>
						{hasMetadata && (
							<div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pl-9 text-[11px] text-muted-foreground">
								{session.location && (
									<Badge
										variant="outline"
										className="gap-0.5 font-normal text-[11px] px-1.5 py-0"
									>
										<MapPinIcon className="size-2.5" />
										{session.location.name}
									</Badge>
								)}
								{coaches.length > 0 && (
									<>
										{session.location && <span>·</span>}
										{coaches.map((user, idx) => (
											<span key={user!.id}>
												<Link
													href="/dashboard/organization/coaches"
													className="hover:text-foreground hover:underline"
												>
													{user!.name}
												</Link>
												{idx < coaches.length - 1 && <span>, </span>}
											</span>
										))}
									</>
								)}
								{session.athleteGroup && (
									<>
										{(session.location || coaches.length > 0) && <span>·</span>}
										<Link
											href={`/dashboard/organization/groups/${session.athleteGroup.id}`}
											className="hover:text-foreground hover:underline"
										>
											{session.athleteGroup.name}
										</Link>
									</>
								)}
								{athletes.length > 0 && !session.athleteGroup && (
									<>
										{(session.location || coaches.length > 0) && <span>·</span>}
										{athletes.slice(0, 2).map((user, idx) => (
											<span key={user!.id}>
												<Link
													href="/dashboard/organization/athletes"
													className="hover:text-foreground hover:underline"
												>
													{user!.name}
												</Link>
												{idx < Math.min(athletes.length, 2) - 1 && (
													<span>, </span>
												)}
											</span>
										))}
										{athletes.length > 2 && (
											<span> +{athletes.length - 2}</span>
										)}
									</>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

export function DailySummaryCard(): React.JSX.Element {
	const t = useTranslations("dashboard.daily");
	const locale = useLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const { data, isLoading } =
		trpc.organization.dashboard.getDailyActivity.useQuery();

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
			style: "currency",
			currency: "ARS",
		}).format(amount / 100);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-48 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("title")}</CardTitle>
					<CardDescription>{t("noData")}</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const dateFormat =
		locale === "es" ? "EEEE, d 'de' MMMM 'de' yyyy" : "EEEE, MMMM d, yyyy";

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<CalendarIcon className="size-5 text-primary" />
							{t("title")}
						</CardTitle>
						<CardDescription>
							{format(data.date, dateFormat, { locale: dateLocale })}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Stats Summary */}
				<div className="grid grid-cols-3 gap-4">
					<div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
						<CalendarCheckIcon className="size-5 text-muted-foreground mb-1" />
						<span className="text-2xl font-bold">{data.sessions.total}</span>
						<span className="text-muted-foreground text-xs">
							{t("sessions")}
						</span>
						<span className="text-muted-foreground text-xs">
							{data.sessions.completed} {t("completed")}
						</span>
					</div>
					<div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
						<UsersIcon className="size-5 text-muted-foreground mb-1" />
						<span className="text-2xl font-bold">{data.attendance.total}</span>
						<span className="text-muted-foreground text-xs">
							{t("attendance")}
						</span>
						<span className="text-muted-foreground text-xs">
							{data.attendance.rate}% {t("present")}
						</span>
					</div>
					<div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
						<BanknoteIcon className="size-5 text-muted-foreground mb-1" />
						<span className="text-xl font-bold text-green-600">
							{formatAmount(data.income.total)}
						</span>
						<span className="text-muted-foreground text-xs">{t("income")}</span>
						<span className="text-muted-foreground text-xs">
							{data.income.count} {t("payments")}
						</span>
					</div>
				</div>

				{/* Sessions Tabs: Today + Tomorrow + Week */}
				<Tabs defaultValue="today">
					<TabsList className="w-full">
						<TabsTrigger value="today" className="flex-1 gap-1.5">
							{t("today")}
							<Badge variant="secondary" className="text-xs px-1.5 py-0">
								{data.sessions.list.length}
							</Badge>
						</TabsTrigger>
						<TabsTrigger value="tomorrow" className="flex-1 gap-1.5">
							{t("tomorrow")}
							<Badge variant="secondary" className="text-xs px-1.5 py-0">
								{data.tomorrow.sessions.list.length}
							</Badge>
						</TabsTrigger>
						<TabsTrigger value="week" className="flex-1 gap-1.5">
							{t("week")}
							<Badge variant="secondary" className="text-xs px-1.5 py-0">
								{data.week.sessions.list.length}
							</Badge>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="today">
						<SessionList
							sessions={data.sessions.list as SessionItem[]}
							emptyMessage={t("noSessions")}
						/>
					</TabsContent>

					<TabsContent value="tomorrow">
						<SessionList
							sessions={data.tomorrow.sessions.list as SessionItem[]}
							emptyMessage={t("noSessionsTomorrow")}
						/>
					</TabsContent>

					<TabsContent value="week">
						<SessionList
							sessions={data.week.sessions.list as SessionItem[]}
							emptyMessage={t("noSessionsWeek")}
						/>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
