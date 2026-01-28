"use client";

import NiceModal from "@ebay/nice-modal-react";
import {
	endOfDay,
	endOfMonth,
	endOfWeek,
	format,
	isWithinInterval,
	startOfDay,
	startOfMonth,
	startOfWeek,
	subMonths,
} from "date-fns";
import {
	CalendarCheckIcon,
	CalendarIcon,
	CheckCircleIcon,
	CheckIcon,
	CircleDotIcon,
	ClockIcon,
	EditIcon,
	EyeIcon,
	MapPinIcon,
	MoreHorizontalIcon,
	PlusCircleIcon,
	PlusIcon,
	RefreshCwIcon,
	StarIcon,
	Trash2Icon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { SessionAttendanceModal } from "@/components/organization/session-attendance-modal";
import { TrainingSessionsModal } from "@/components/organization/training-sessions-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user/user-avatar";
import { capitalize, cn } from "@/lib/utils";

const sessionStatusColors: Record<string, string> = {
	pending:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
	confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
	completed:
		"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
	cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

export interface SessionItem {
	id: string;
	title: string;
	startTime: Date | string;
	status: string;
	location?: { id: string; name: string } | null;
	// Fields needed for editing
	endTime?: Date | string;
	description?: string | null;
	athleteGroup?: { id: string; name: string } | null;
	coaches?: {
		id: string;
		isPrimary: boolean;
		coach: {
			id: string;
			user: { id: string; name: string; image: string | null } | null;
		};
	}[];
	athletes?: {
		id: string;
		athlete: {
			id: string;
			user: { id: string; name: string; image: string | null } | null;
		};
	}[];
	objectives?: string | null;
	planning?: string | null;
	postSessionNotes?: string | null;
	isRecurring?: boolean;
	rrule?: string | null;
	attachmentKey?: string | null;
}

const sessionStatusIcons: Record<string, React.ReactNode> = {
	pending: <ClockIcon className="mr-2 size-4" />,
	confirmed: <CircleDotIcon className="mr-2 size-4" />,
	completed: <CheckCircleIcon className="mr-2 size-4" />,
	cancelled: <XCircleIcon className="mr-2 size-4" />,
};

const SESSION_STATUSES = [
	"pending",
	"confirmed",
	"completed",
	"cancelled",
] as const;

type PeriodFilter = "day" | "week" | "month" | "lastMonth" | "all";

function getDateRangeForPeriod(
	period: PeriodFilter,
): { from: Date; to: Date } | undefined {
	const now = new Date();
	switch (period) {
		case "day":
			return { from: startOfDay(now), to: endOfDay(now) };
		case "week":
			return {
				from: startOfWeek(now, { weekStartsOn: 1 }),
				to: endOfWeek(now, { weekStartsOn: 1 }),
			};
		case "month":
			return { from: startOfMonth(now), to: endOfMonth(now) };
		case "lastMonth": {
			const lastMonth = subMonths(now, 1);
			return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
		}
		default:
			return undefined;
	}
}

interface SessionsListTableProps {
	sessions: SessionItem[];
	isLoading?: boolean;
	initialAthleteIds?: string[];
	initialGroupId?: string;
	emptyStateMessage?: string;
	createButtonLabel?: string;
	maxItems?: number;
	/** Optional callback for delete action. If not provided, delete option won't show */
	onDeleteSession?: (sessionId: string, sessionTitle: string) => void;
	/** Optional callback for add evaluation action. If not provided, option won't show. Only shown for completed sessions. */
	onAddEvaluation?: (sessionId: string) => void;
	/** Optional callback for add attendance action. If not provided, option won't show. */
	onAddAttendance?: (sessionId: string) => void;
	/** Optional callback for status change. If not provided, change status option won't show */
	onChangeStatus?: (sessionId: string, status: string) => void;
}

export function SessionsListTable({
	sessions,
	isLoading = false,
	initialAthleteIds,
	initialGroupId,
	emptyStateMessage,
	createButtonLabel,
	maxItems,
	onDeleteSession,
	onAddEvaluation,
	onAddAttendance,
	onChangeStatus,
}: SessionsListTableProps) {
	const t = useTranslations("athletes.groups.profile");
	const tTraining = useTranslations("training");
	const [periodFilter, setPeriodFilter] = React.useState<PeriodFilter>("all");

	const handleCreateSession = () => {
		NiceModal.show(TrainingSessionsModal, {
			initialAthleteIds,
			initialGroupId,
		});
	};

	// Filter sessions by period
	const filteredSessions = React.useMemo(() => {
		const dateRange = getDateRangeForPeriod(periodFilter);
		if (!dateRange) return sessions;

		return sessions.filter((session) => {
			const sessionDate =
				typeof session.startTime === "string"
					? new Date(session.startTime)
					: session.startTime;
			return isWithinInterval(sessionDate, {
				start: dateRange.from,
				end: dateRange.to,
			});
		});
	}, [sessions, periodFilter]);

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-16 w-full" />
				))}
			</div>
		);
	}

	if (sessions.length === 0) {
		return (
			<EmptyState
				icon={CalendarIcon}
				title={emptyStateMessage ?? t("noSessions")}
				action={
					<Button onClick={handleCreateSession} variant="outline" size="sm">
						<PlusIcon className="mr-2 size-4" />
						{createButtonLabel ?? t("createFirstSession")}
					</Button>
				}
			/>
		);
	}

	const displaySessions = maxItems
		? filteredSessions.slice(0, maxItems)
		: filteredSessions;

	const periodOptions: { value: PeriodFilter; label: string }[] = [
		{ value: "day", label: tTraining("table.today") },
		{ value: "week", label: tTraining("table.thisWeek") },
		{ value: "month", label: tTraining("table.thisMonth") },
		{ value: "lastMonth", label: tTraining("table.lastMonth") },
		{ value: "all", label: tTraining("table.allTime") },
	];

	const selectedOption = periodOptions.find((o) => o.value === periodFilter);

	return (
		<div className="space-y-3">
			{/* Period Filter */}
			<div className="flex items-center gap-2">
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="h-8 justify-start border-dashed"
						>
							<PlusCircleIcon />
							{tTraining("table.period")}
							{periodFilter !== "all" && selectedOption && (
								<>
									<Separator orientation="vertical" className="mx-2 h-4" />
									<Badge
										variant="secondary"
										className="rounded-sm px-1 font-normal"
									>
										{selectedOption.label}
									</Badge>
								</>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[200px] p-0" align="start">
						<Command>
							<CommandList>
								<CommandGroup>
									{periodOptions.map((option) => {
										const isSelected = periodFilter === option.value;
										return (
											<CommandItem
												key={option.value}
												onSelect={() => setPeriodFilter(option.value)}
											>
												<div
													className={cn(
														"flex size-4 items-center justify-center rounded-[4px] border",
														isSelected
															? "border-primary bg-primary text-primary-foreground"
															: "border-input [&_svg]:invisible",
													)}
												>
													<CheckIcon className="size-3.5 text-primary-foreground" />
												</div>
												<span>{option.label}</span>
											</CommandItem>
										);
									})}
								</CommandGroup>
								{periodFilter !== "all" && (
									<>
										<CommandSeparator />
										<CommandGroup>
											<CommandItem
												onSelect={() => setPeriodFilter("all")}
												className="justify-center text-center"
											>
												{tTraining("table.allTime")}
											</CommandItem>
										</CommandGroup>
									</>
								)}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>

			{filteredSessions.length === 0 ? (
				<EmptyState
					icon={CalendarIcon}
					title={t("noSessionsInPeriod")}
					action={
						<Button
							onClick={() => setPeriodFilter("all")}
							variant="outline"
							size="sm"
						>
							{tTraining("table.allTime")}
						</Button>
					}
				/>
			) : (
				<div className="rounded-lg border">
					<table className="w-full">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									{t("sessionTitle")}
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									{t("dateTime")}
								</th>
								<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
									{t("coach")}
								</th>
								<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">
									{t("location")}
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									{t("status")}
								</th>
								<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
									<span className="sr-only">{t("actions")}</span>
								</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{displaySessions.map((session) => {
								const sessionDate =
									typeof session.startTime === "string"
										? new Date(session.startTime)
										: session.startTime;

								return (
									<tr key={session.id} className="hover:bg-muted/30">
										<td className="px-4 py-3">
											<Link
												href={`/dashboard/organization/training-sessions/${session.id}`}
												className="font-medium text-sm hover:underline"
											>
												{session.title}
											</Link>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-2 text-sm">
												<CalendarIcon className="size-3.5 text-muted-foreground" />
												<span>{format(sessionDate, "dd MMM yyyy")}</span>
												<ClockIcon className="ml-1 size-3.5 text-muted-foreground" />
												<span>{format(sessionDate, "HH:mm")}</span>
											</div>
										</td>
										<td className="hidden px-4 py-3 md:table-cell">
											{(() => {
												const primaryCoach =
													session.coaches?.find((c) => c.isPrimary) ??
													session.coaches?.[0];
												if (!primaryCoach?.coach.user) {
													return (
														<span className="text-muted-foreground">-</span>
													);
												}
												return (
													<div className="flex items-center gap-2">
														<UserAvatar
															className="size-6 shrink-0"
															name={primaryCoach.coach.user.name}
															src={primaryCoach.coach.user.image ?? undefined}
														/>
														<span className="truncate text-sm">
															{primaryCoach.coach.user.name}
														</span>
													</div>
												);
											})()}
										</td>
										<td className="hidden px-4 py-3 sm:table-cell">
											{session.location ? (
												<div className="flex items-center gap-1 text-sm">
													<MapPinIcon className="size-3.5 text-muted-foreground" />
													<span>{session.location.name}</span>
												</div>
											) : (
												<span className="text-muted-foreground">-</span>
											)}
										</td>
										<td className="px-4 py-3">
											<Badge
												className={cn(
													"border-none",
													sessionStatusColors[session.status] ??
														"bg-gray-100 dark:bg-gray-800",
												)}
											>
												{capitalize(session.status)}
											</Badge>
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
															<span className="sr-only">Open menu</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem asChild>
															<Link
																href={`/dashboard/organization/training-sessions/${session.id}`}
															>
																<EyeIcon className="mr-2 size-4" />
																{t("actions.viewSession")}
															</Link>
														</DropdownMenuItem>
														{session.endTime &&
															session.coaches &&
															session.athletes && (
																<DropdownMenuItem
																	onClick={() => {
																		const sessionData = {
																			id: session.id,
																			title: session.title,
																			description: session.description ?? null,
																			startTime: new Date(session.startTime),
																			endTime: new Date(
																				session.endTime as
																					| string
																					| number
																					| Date,
																			),
																			status: session.status,
																			location: session.location ?? null,
																			athleteGroup:
																				session.athleteGroup ?? null,
																			coaches: session.coaches!,
																			athletes: session.athletes!,
																			objectives: session.objectives ?? null,
																			planning: session.planning ?? null,
																			postSessionNotes:
																				session.postSessionNotes ?? null,
																			isRecurring: session.isRecurring,
																			rrule: session.rrule ?? null,
																			attachmentKey:
																				session.attachmentKey ?? null,
																		};
																		NiceModal.show(TrainingSessionsModal, {
																			session: sessionData,
																		});
																	}}
																>
																	<EditIcon className="mr-2 size-4" />
																	{t("actions.editSession")}
																</DropdownMenuItem>
															)}
														<DropdownMenuItem
															onClick={() =>
																NiceModal.show(SessionAttendanceModal, {
																	sessionId: session.id,
																	sessionTitle: session.title,
																	sessionDate,
																	locationName: session.location?.name,
																})
															}
														>
															<CalendarCheckIcon className="mr-2 size-4" />
															{t("attendance")}
														</DropdownMenuItem>
														{onChangeStatus && (
															<DropdownMenuSub>
																<DropdownMenuSubTrigger>
																	<RefreshCwIcon className="mr-2 size-4" />
																	{t("actions.changeStatus")}
																</DropdownMenuSubTrigger>
																<DropdownMenuSubContent>
																	{SESSION_STATUSES.filter(
																		(s) => s !== session.status,
																	).map((status) => (
																		<DropdownMenuItem
																			key={status}
																			onClick={() =>
																				onChangeStatus(session.id, status)
																			}
																		>
																			{sessionStatusIcons[status]}
																			{t(`actions.statuses.${status}`)}
																		</DropdownMenuItem>
																	))}
																</DropdownMenuSubContent>
															</DropdownMenuSub>
														)}
														{onAddEvaluation &&
															session.status === "completed" && (
																<DropdownMenuItem
																	onClick={() => onAddEvaluation(session.id)}
																>
																	<StarIcon className="mr-2 size-4" />
																	{t("actions.addEvaluation")}
																</DropdownMenuItem>
															)}
														{onAddAttendance && (
															<DropdownMenuItem
																onClick={() => onAddAttendance(session.id)}
															>
																<CheckCircleIcon className="mr-2 size-4" />
																{t("actions.addAttendance")}
															</DropdownMenuItem>
														)}
														{onDeleteSession && (
															<>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	onClick={() =>
																		onDeleteSession(session.id, session.title)
																	}
																	variant="destructive"
																>
																	<Trash2Icon className="mr-2 size-4" />
																	{t("actions.deleteSession")}
																</DropdownMenuItem>
															</>
														)}
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
			{maxItems && filteredSessions.length > maxItems && (
				<p className="pt-2 text-center text-muted-foreground text-sm">
					Showing {maxItems} of {filteredSessions.length} sessions
				</p>
			)}
		</div>
	);
}
