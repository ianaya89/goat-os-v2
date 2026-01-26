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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

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
						<CalendarCheckIcon className="size-5 text-blue-500 mb-1" />
						<span className="text-2xl font-bold">{data.sessions.total}</span>
						<span className="text-muted-foreground text-xs">
							{t("sessions")}
						</span>
						<span className="text-green-600 text-xs">
							{data.sessions.completed} {t("completed")}
						</span>
					</div>
					<div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
						<UsersIcon className="size-5 text-purple-500 mb-1" />
						<span className="text-2xl font-bold">{data.attendance.total}</span>
						<span className="text-muted-foreground text-xs">
							{t("attendance")}
						</span>
						<span className="text-green-600 text-xs">
							{data.attendance.rate}% {t("present")}
						</span>
					</div>
					<div className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
						<BanknoteIcon className="size-5 text-green-500 mb-1" />
						<span className="text-xl font-bold">
							{formatAmount(data.income.total)}
						</span>
						<span className="text-muted-foreground text-xs">{t("income")}</span>
						<span className="text-muted-foreground text-xs">
							{data.income.count} {t("payments")}
						</span>
					</div>
				</div>

				{/* Today's Sessions List */}
				{data.sessions.list.length > 0 ? (
					<div className="space-y-2">
						<h4 className="text-sm font-medium text-muted-foreground">
							{t("todaySessions")}
						</h4>
						<div className="space-y-2">
							{data.sessions.list.slice(0, 5).map((session) => (
								<Link
									key={session.id}
									href={`/dashboard/organization/training-sessions/${session.id}`}
									className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
								>
									<div className="flex items-center gap-3">
										<div
											className={cn(
												"flex size-9 items-center justify-center rounded-lg",
												session.status === "completed"
													? "bg-green-100 dark:bg-green-900"
													: "bg-blue-100 dark:bg-blue-900",
											)}
										>
											<ClockIcon
												className={cn(
													"size-4",
													session.status === "completed"
														? "text-green-600"
														: "text-blue-600",
												)}
											/>
										</div>
										<div>
											<p className="font-medium text-sm">{session.title}</p>
											<div className="flex items-center gap-2 text-muted-foreground text-xs">
												<span>
													{format(session.startTime, "HH:mm")} -{" "}
													{format(session.endTime, "HH:mm")}
												</span>
												{session.location && (
													<>
														<span>|</span>
														<span className="flex items-center gap-1">
															<MapPinIcon className="size-3" />
															{session.location.name}
														</span>
													</>
												)}
											</div>
										</div>
									</div>
									<Badge
										variant={
											session.status === "completed" ? "default" : "secondary"
										}
										className="text-xs"
									>
										{session.status === "completed"
											? t("statusCompleted")
											: session.status === "confirmed"
												? t("statusConfirmed")
												: t("statusPending")}
									</Badge>
								</Link>
							))}
						</div>
						{data.sessions.list.length > 5 && (
							<Button variant="ghost" size="sm" asChild className="w-full">
								<Link href="/dashboard/organization/training-sessions">
									{t("viewAll", { count: data.sessions.list.length })}
								</Link>
							</Button>
						)}
					</div>
				) : (
					<div className="flex flex-col items-center py-6 text-center">
						<CalendarIcon className="size-10 text-muted-foreground/50 mb-2" />
						<p className="text-muted-foreground text-sm">{t("noSessions")}</p>
						<Button variant="link" size="sm" asChild className="mt-2">
							<Link href="/dashboard/organization/training-sessions">
								{t("viewCalendar")}
							</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
