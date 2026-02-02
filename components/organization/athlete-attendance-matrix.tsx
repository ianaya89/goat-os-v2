"use client";

import { format, getDaysInMonth, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
	CalendarIcon,
	CheckIcon,
	ClockIcon,
	Loader2Icon,
	ShieldCheckIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AttendanceStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";

interface Session {
	id: string;
	title: string;
	startTime: Date | string;
	status: string;
}

interface AttendanceRecord {
	id: string;
	sessionId: string;
	status: string;
}

export interface AthleteAttendanceMatrixProps {
	sessions: Session[];
	attendanceRecords: AttendanceRecord[];
	onStatusChange: (sessionId: string, status: AttendanceStatus) => void;
	isMutating?: boolean;
	mutatingSessionId?: string | null;
}

const dotColors: Record<string, { bg: string; dot: string }> = {
	present: {
		bg: "bg-green-100 dark:bg-green-900/50",
		dot: "bg-green-500",
	},
	absent: {
		bg: "bg-red-100 dark:bg-red-900/50",
		dot: "bg-red-500",
	},
	late: {
		bg: "bg-yellow-100 dark:bg-yellow-900/50",
		dot: "bg-yellow-500",
	},
	excused: {
		bg: "bg-blue-100 dark:bg-blue-900/50",
		dot: "bg-blue-500",
	},
};

const statusOptions: Array<{
	value: AttendanceStatus;
	dot: string;
	icon: React.ComponentType<{ className?: string }>;
}> = [
	{ value: "present", dot: "bg-green-500", icon: CheckIcon },
	{ value: "absent", dot: "bg-red-500", icon: XIcon },
	{ value: "late", dot: "bg-yellow-500", icon: ClockIcon },
	{ value: "excused", dot: "bg-blue-500", icon: ShieldCheckIcon },
];

const INITIAL_MONTHS_TO_SHOW = 6;
const DAYS_IN_GRID = 31;

interface MonthGroup {
	key: string;
	label: string;
	year: number;
	month: number;
	daysInMonth: number;
	sessions: Session[];
	sessionsByDay: Map<number, Session[]>;
}

export function AthleteAttendanceMatrix({
	sessions,
	attendanceRecords,
	onStatusChange,
	isMutating = false,
	mutatingSessionId,
}: AthleteAttendanceMatrixProps) {
	const t = useTranslations("athletes.attendance.matrix");
	const [monthsToShow, setMonthsToShow] = React.useState(
		INITIAL_MONTHS_TO_SHOW,
	);

	// Create attendance map for O(1) lookups
	const attendanceMap = React.useMemo(() => {
		const map = new Map<string, string>();
		for (const record of attendanceRecords) {
			map.set(record.sessionId, record.status);
		}
		return map;
	}, [attendanceRecords]);

	// Group sessions by month (sorted by date descending)
	const monthGroups = React.useMemo(() => {
		const sortedSessions = [...sessions].sort((a, b) => {
			const dateA = new Date(a.startTime);
			const dateB = new Date(b.startTime);
			return dateB.getTime() - dateA.getTime();
		});

		const groups: MonthGroup[] = [];
		let currentGroup: MonthGroup | null = null;

		for (const session of sortedSessions) {
			const sessionDate = new Date(session.startTime);
			const monthStart = startOfMonth(sessionDate);
			const monthKey = format(monthStart, "yyyy-MM");

			if (!currentGroup || currentGroup.key !== monthKey) {
				currentGroup = {
					key: monthKey,
					label: format(monthStart, "MMMM yyyy", { locale: es }),
					year: sessionDate.getFullYear(),
					month: sessionDate.getMonth(),
					daysInMonth: getDaysInMonth(sessionDate),
					sessions: [],
					sessionsByDay: new Map(),
				};
				groups.push(currentGroup);
			}

			currentGroup.sessions.push(session);

			// Group by day
			const day = sessionDate.getDate();
			const existingSessions = currentGroup.sessionsByDay.get(day) ?? [];
			existingSessions.push(session);
			currentGroup.sessionsByDay.set(day, existingSessions);
		}

		return groups;
	}, [sessions]);

	const visibleMonths = monthGroups.slice(0, monthsToShow);
	const hasMoreMonths = monthGroups.length > monthsToShow;

	const loadMoreMonths = () => {
		setMonthsToShow((prev) => prev + 6);
	};

	if (sessions.length === 0) {
		return <EmptyState icon={CalendarIcon} title={t("noSessions")} />;
	}

	// Generate day numbers 1-31
	const dayNumbers = Array.from({ length: DAYS_IN_GRID }, (_, i) => i + 1);

	return (
		<div className="space-y-3">
			{/* Matrix table */}
			<div className="overflow-x-auto rounded-lg border">
				<table className="w-full">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="sticky left-0 z-10 min-w-[140px] bg-muted/50 px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								{t("month")}
							</th>
							{dayNumbers.map((day) => (
								<th
									key={day}
									className="min-w-[36px] px-1 py-3 text-center text-xs font-medium text-muted-foreground"
								>
									{day}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y">
						{visibleMonths.map((group) => (
							<tr key={group.key} className="hover:bg-muted/30">
								<td className="sticky left-0 z-10 bg-background px-4 py-2.5">
									<div className="flex flex-col">
										<span className="text-sm font-medium capitalize">
											{group.label}
										</span>
										<span className="text-xs text-muted-foreground">
											{group.sessions.length}{" "}
											{group.sessions.length === 1
												? t("session")
												: t("sessions")}
										</span>
									</div>
								</td>
								{dayNumbers.map((day) => {
									const daySessions = group.sessionsByDay.get(day);
									const isValidDay = day <= group.daysInMonth;

									if (!isValidDay) {
										return (
											<td
												key={day}
												className="px-1 py-2.5 text-center bg-muted/20"
											/>
										);
									}

									const firstSession = daySessions?.[0];
									if (!firstSession) {
										return <td key={day} className="px-1 py-2.5 text-center" />;
									}

									// If multiple sessions on same day, show only first one
									// with a badge indicating count
									const status = attendanceMap.get(firstSession.id);
									const sessionDate = new Date(firstSession.startTime);
									const cellMutating =
										isMutating && mutatingSessionId === firstSession.id;

									return (
										<td key={day} className="px-1 py-2.5 text-center">
											<SessionDotPopover
												session={firstSession}
												sessionsCount={daySessions?.length ?? 1}
												status={status}
												date={sessionDate}
												isMutating={cellMutating}
												onStatusChange={(newStatus) =>
													onStatusChange(firstSession.id, newStatus)
												}
												t={t}
											/>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Load more button */}
			{hasMoreMonths && (
				<div className="flex justify-center">
					<Button variant="outline" size="sm" onClick={loadMoreMonths}>
						{t("loadMore")} ({monthGroups.length - monthsToShow}{" "}
						{t("moreMonths")})
					</Button>
				</div>
			)}

			{/* Legend */}
			<div className="flex flex-wrap items-center gap-4 px-1 text-xs text-muted-foreground">
				{(
					[
						{ key: "present", color: "bg-green-500" },
						{ key: "absent", color: "bg-red-500" },
						{ key: "late", color: "bg-yellow-500" },
						{ key: "excused", color: "bg-blue-500" },
						{ key: "pending", color: "bg-gray-400" },
					] as const
				).map((item) => (
					<div key={item.key} className="flex items-center gap-1.5">
						<span className={cn("size-2 rounded-full", item.color)} />
						<span>{t(item.key)}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function SessionDotPopover({
	session,
	sessionsCount,
	status,
	date,
	isMutating,
	onStatusChange,
	t,
}: {
	session: Session;
	sessionsCount: number;
	status?: string;
	date: Date;
	isMutating: boolean;
	onStatusChange: (status: AttendanceStatus) => void;
	t: (key: string) => string;
}) {
	const [open, setOpen] = React.useState(false);
	const colors = status && status !== "pending" ? dotColors[status] : null;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipTrigger asChild>
					<PopoverTrigger asChild>
						<button
							type="button"
							className={cn(
								"relative inline-flex size-7 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								colors?.bg ?? "bg-gray-100 dark:bg-gray-800",
							)}
						>
							{isMutating ? (
								<Loader2Icon className="size-3 animate-spin text-muted-foreground" />
							) : (
								<span
									className={cn(
										"size-2 rounded-full",
										colors?.dot ?? "bg-gray-400",
									)}
								/>
							)}
							{sessionsCount > 1 && (
								<span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
									{sessionsCount}
								</span>
							)}
						</button>
					</PopoverTrigger>
				</TooltipTrigger>
				<TooltipContent side="top" className="max-w-[200px]">
					<div className="space-y-1">
						<p className="font-medium">{session.title}</p>
						<p className="text-xs text-muted-foreground">
							{format(date, "EEEE d, HH:mm", { locale: es })}
						</p>
						{sessionsCount > 1 && (
							<p className="text-xs text-muted-foreground">
								+{sessionsCount - 1} {t("moreSessions")}
							</p>
						)}
					</div>
				</TooltipContent>
			</Tooltip>
			<PopoverContent
				className="w-auto min-w-[160px] p-1.5"
				side="bottom"
				align="center"
			>
				<div className="mb-2 border-b px-2 pb-2">
					<p className="font-medium text-sm truncate max-w-[180px]">
						{session.title}
					</p>
					<p className="text-xs text-muted-foreground">
						{format(date, "EEEE d, HH:mm", { locale: es })}
					</p>
				</div>
				<div className="flex flex-col gap-0.5">
					{statusOptions.map((option) => {
						const isActive = status === option.value;
						const Icon = option.icon;
						return (
							<button
								key={option.value}
								type="button"
								className={cn(
									"flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent",
									isActive && "bg-accent font-medium",
								)}
								onClick={() => {
									onStatusChange(option.value);
									setOpen(false);
								}}
							>
								<span
									className={cn("size-2 shrink-0 rounded-full", option.dot)}
								/>
								<span className="flex-1">{t(option.value)}</span>
								{isActive && (
									<Icon className="size-3.5 text-muted-foreground" />
								)}
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
