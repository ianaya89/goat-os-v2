"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
	BanknoteIcon,
	CalendarCheckIcon,
	CalendarIcon,
	ClockIcon,
	MailIcon,
	MessageSquareIcon,
	SendIcon,
	SmartphoneIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { LocationBadge } from "@/components/organization/location-badge";
import { TrainingSessionStatusSelect } from "@/components/organization/training-session-status-select";
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
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NotificationChannel } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

type SessionItem = {
	id: string;
	title: string;
	startTime: Date;
	endTime: Date;
	status: string;
	location: { id: string; name: string; color: string | null } | null;
	athleteGroup: { id: string; name: string } | null;
	coaches: Array<{
		isPrimary: boolean;
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
	onSendConfirmation,
	isSendingConfirmation,
}: {
	sessions: SessionItem[];
	emptyMessage: string;
	onSendConfirmation: (
		session: SessionItem,
		channel: NotificationChannel,
	) => void;
	isSendingConfirmation: boolean;
}) {
	const t = useTranslations("dashboard.daily");

	if (sessions.length === 0) {
		return (
			<div className="flex flex-col items-center py-6 text-center">
				<CalendarIcon className="size-10 text-muted-foreground/50 mb-2" />
				<p className="text-muted-foreground text-sm">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className="max-h-64 overflow-y-auto space-y-2 pr-1">
			{sessions.map((session) => {
				const primaryCoach = session.coaches?.find((c) => c.isPrimary)?.coach
					.user;
				const assistantCoaches = session.coaches
					?.filter((c) => !c.isPrimary)
					.map((c) => c.coach.user)
					.filter(Boolean);
				const athletes = session.athletes
					?.map((a) => a.athlete.user)
					.filter(Boolean);
				const athleteCount = athletes.length;

				return (
					<div
						key={session.id}
						className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/30"
					>
						{/* Header row: Title + Time + Status + Actions */}
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0 flex-1">
								<Link
									href={`/dashboard/organization/training-sessions/${session.id}`}
									className="font-medium text-sm hover:underline hover:text-primary leading-tight"
								>
									{session.title}
								</Link>
								<div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-xs">
									<ClockIcon className="size-3" />
									<span>
										{format(session.startTime, "HH:mm")} -{" "}
										{format(session.endTime, "HH:mm")}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-1.5 shrink-0">
								<TrainingSessionStatusSelect
									sessionId={session.id}
									currentStatus={session.status}
									size="sm"
								/>
								{athleteCount > 0 && (
									<DropdownMenu>
										<Tooltip>
											<TooltipTrigger asChild>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="size-7"
														disabled={isSendingConfirmation}
													>
														<SendIcon className="size-3.5" />
													</Button>
												</DropdownMenuTrigger>
											</TooltipTrigger>
											<TooltipContent>{t("sendConfirmation")}</TooltipContent>
										</Tooltip>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => onSendConfirmation(session, "email")}
												disabled={isSendingConfirmation}
											>
												<MailIcon className="mr-2 size-4" />
												{t("sendViaEmail")}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onSendConfirmation(session, "whatsapp")}
												disabled={isSendingConfirmation}
											>
												<MessageSquareIcon className="mr-2 size-4" />
												{t("sendViaWhatsApp")}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onSendConfirmation(session, "sms")}
												disabled={isSendingConfirmation}
											>
												<SmartphoneIcon className="mr-2 size-4" />
												{t("sendViaSms")}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						</div>

						{/* Content row: Location + Coach + Participants */}
						<div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
							{/* Location with color badge */}
							{session.location && (
								<LocationBadge
									locationId={session.location.id}
									name={session.location.name}
									color={session.location.color}
									className="text-[11px] px-1.5 py-0.5"
								/>
							)}

							{/* Primary Coach */}
							{primaryCoach && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Link
											href="/dashboard/organization/coaches"
											className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
										>
											<UserIcon className="size-2.5" />
											{primaryCoach.name}
										</Link>
									</TooltipTrigger>
									<TooltipContent>{t("primaryCoach")}</TooltipContent>
								</Tooltip>
							)}

							{/* Assistant Coaches */}
							{assistantCoaches && assistantCoaches.length > 0 && (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
											+{assistantCoaches.length}{" "}
											{assistantCoaches.length === 1
												? t("assistant")
												: t("assistants")}
										</span>
									</TooltipTrigger>
									<TooltipContent>
										{assistantCoaches.map((c) => c!.name).join(", ")}
									</TooltipContent>
								</Tooltip>
							)}

							{/* Divider */}
							{(session.location ||
								primaryCoach ||
								(assistantCoaches && assistantCoaches.length > 0)) &&
								(session.athleteGroup || athleteCount > 0) && (
									<span className="text-muted-foreground/50">|</span>
								)}

							{/* Group or Athletes */}
							{session.athleteGroup ? (
								<Link
									href={`/dashboard/organization/groups/${session.athleteGroup.id}`}
									className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
								>
									<UsersIcon className="size-3" />
									{session.athleteGroup.name}
								</Link>
							) : athleteCount > 0 ? (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="inline-flex items-center gap-1 text-muted-foreground">
											<UsersIcon className="size-3" />
											{athleteCount}{" "}
											{athleteCount === 1 ? t("athlete") : t("athletes")}
										</span>
									</TooltipTrigger>
									<TooltipContent>
										{athletes
											.slice(0, 5)
											.map((a) => a!.name)
											.join(", ")}
										{athleteCount > 5 && ` +${athleteCount - 5}`}
									</TooltipContent>
								</Tooltip>
							) : null}
						</div>
					</div>
				);
			})}
		</div>
	);
}

export function DailySummaryCard(): React.JSX.Element {
	const t = useTranslations("dashboard.daily");
	const tTraining = useTranslations("training");
	const locale = useLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const utils = trpc.useUtils();

	const { data, isLoading } =
		trpc.organization.dashboard.getDailyActivity.useQuery();

	const sendConfirmationMutation =
		trpc.organization.confirmation.sendForSessions.useMutation({
			onSuccess: (result) => {
				toast.success(
					tTraining("success.reminderSent", { count: result.sent }),
				);
				utils.organization.confirmation.getStats.invalidate();
				utils.organization.confirmation.getHistory.invalidate();
			},
			onError: () => {
				toast.error(tTraining("error.reminderFailed"));
			},
		});

	const handleSendConfirmation = (
		session: SessionItem,
		channel: NotificationChannel,
	) => {
		const athleteCount = session.athletes.length;
		const channelLabel =
			channel === "email"
				? "Email"
				: channel === "whatsapp"
					? "WhatsApp"
					: "SMS";

		NiceModal.show(ConfirmationModal, {
			title: t("sendConfirmation"),
			message: t("confirmationMessage", {
				count: athleteCount,
				channel: channelLabel,
			}),
			confirmLabel: t("sendConfirmation"),
			onConfirm: () => {
				sendConfirmationMutation.mutate({
					sessionIds: [session.id],
					channel,
				});
			},
		});
	};

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
							onSendConfirmation={handleSendConfirmation}
							isSendingConfirmation={sendConfirmationMutation.isPending}
						/>
					</TabsContent>

					<TabsContent value="tomorrow">
						<SessionList
							sessions={data.tomorrow.sessions.list as SessionItem[]}
							emptyMessage={t("noSessionsTomorrow")}
							onSendConfirmation={handleSendConfirmation}
							isSendingConfirmation={sendConfirmationMutation.isPending}
						/>
					</TabsContent>

					<TabsContent value="week">
						<SessionList
							sessions={data.week.sessions.list as SessionItem[]}
							emptyMessage={t("noSessionsWeek")}
							onSendConfirmation={handleSendConfirmation}
							isSendingConfirmation={sendConfirmationMutation.isPending}
						/>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
