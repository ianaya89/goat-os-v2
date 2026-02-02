"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	DatesSetArg,
	EventClickArg,
	EventContentArg,
	EventInput,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { FilterXIcon, RepeatIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	type SessionPreviewData,
	TrainingSessionPreviewSheet,
} from "@/components/organization/training-session-preview-sheet";
import { trainingSessionStatusConfig } from "@/components/organization/training-session-status-badge";
import { TrainingSessionsModal } from "@/components/organization/training-sessions-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user/user-avatar";
import {
	getContrastTextColor,
	getLocationColor,
	getSafeEventColor,
} from "@/lib/utils/location-colors";
import { trpc } from "@/trpc/client";

export type SessionsCalendarMode = "admin" | "athlete" | "coach";

type TrainingSessionCalendarProps = {
	toolbarActions?: React.ReactNode;
	/**
	 * Mode determines which data source is used:
	 * - admin: All sessions in the organization
	 * - athlete: Only sessions where user is an athlete
	 * - coach: Only sessions where user is a coach
	 */
	mode?: SessionsCalendarMode;
};

export function TrainingSessionCalendar({
	toolbarActions,
	mode = "admin",
}: TrainingSessionCalendarProps) {
	const t = useTranslations("training");
	const calendarRef = React.useRef<FullCalendar>(null);
	const utils = trpc.useUtils();

	// Track current view type to prevent reset on re-render
	const [currentView, setCurrentView] = React.useState("timeGridWeek");

	// Session preview sheet state
	const [selectedSession, setSelectedSession] =
		React.useState<SessionPreviewData | null>(null);
	const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

	// Track the current date range for fetching sessions
	const [dateRange, setDateRange] = React.useState(() => {
		const now = new Date();
		return {
			from: startOfMonth(addMonths(now, -1)),
			to: endOfMonth(addMonths(now, 1)),
		};
	});

	// Filter states
	const [filters, setFilters] = React.useState<{
		locationId?: string;
		coachId?: string;
		athleteId?: string;
	}>({});

	// Fetch filter options
	const { data: locationsData } =
		trpc.organization.location.listActive.useQuery();
	const { data: coachesData } = trpc.organization.coach.list.useQuery({
		limit: 100,
		offset: 0,
	});
	const { data: athletesData } = trpc.organization.athlete.list.useQuery({
		limit: 100,
		offset: 0,
	});

	const locations = locationsData ?? [];
	const coaches = coachesData?.coaches ?? [];
	const athletes = athletesData?.athletes ?? [];

	// Use different queries based on mode
	const adminQuery = trpc.organization.trainingSession.listForCalendar.useQuery(
		{
			from: dateRange.from,
			to: dateRange.to,
			...filters,
		},
		{ enabled: mode === "admin" },
	);

	// For athlete/coach modes, use their specific queries with date range filter
	const athleteQuery =
		trpc.organization.trainingSession.listMySessionsAsAthlete.useQuery(
			{
				limit: 500, // Large limit for calendar
				offset: 0,
				filters: {
					dateRange: { from: dateRange.from, to: dateRange.to },
					locationId: filters.locationId,
				},
			},
			{ enabled: mode === "athlete" },
		);

	const coachQuery =
		trpc.organization.trainingSession.listMySessionsAsCoach.useQuery(
			{
				limit: 500, // Large limit for calendar
				offset: 0,
				filters: {
					dateRange: { from: dateRange.from, to: dateRange.to },
					locationId: filters.locationId,
				},
			},
			{ enabled: mode === "coach" },
		);

	// Select the appropriate data based on mode
	const sessions =
		mode === "admin"
			? adminQuery.data
			: mode === "athlete"
				? athleteQuery.data?.sessions
				: coachQuery.data?.sessions;
	const isLoading =
		mode === "admin"
			? adminQuery.isLoading
			: mode === "athlete"
				? athleteQuery.isLoading
				: coachQuery.isLoading;

	// Helper to invalidate the correct query based on mode
	const invalidateSessionsQuery = React.useCallback(() => {
		if (mode === "admin") {
			utils.organization.trainingSession.listForCalendar.invalidate();
		} else if (mode === "athlete") {
			utils.organization.trainingSession.listMySessionsAsAthlete.invalidate();
		} else {
			utils.organization.trainingSession.listMySessionsAsCoach.invalidate();
		}
	}, [mode, utils]);

	// Delete mutation - only available in admin mode
	const deleteMutation = trpc.organization.trainingSession.delete.useMutation({
		onSuccess: () => {
			toast.success(t("success.deleted"));
			invalidateSessionsQuery();
			setIsPreviewOpen(false);
			setSelectedSession(null);
		},
		onError: (error) => {
			toast.error(error.message || t("error.deleteFailed"));
		},
	});

	// Transform sessions to FullCalendar events with location-based colors
	const events: EventInput[] = React.useMemo(() => {
		if (!sessions) return [];

		return sessions.map((session) => {
			// Cast to unknown first to handle different query return types
			const s = session as {
				id: string;
				title: string;
				startTime: Date;
				endTime: Date;
				status: string;
				isRecurring?: boolean;
				location?: { id: string; name: string; color?: string | null } | null;
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
				athletes?: Array<{
					athlete: {
						id: string;
						user?: { id: string; name: string; image: string | null } | null;
					};
				}>;
				coaches: Array<{
					isPrimary: boolean;
					coach: {
						id: string;
						user?: { id: string; name: string; image: string | null } | null;
					};
				}>;
			};

			// Get location color, then normalize for safe calendar display
			const rawColor = s.location?.id
				? getLocationColor(s.location.id, s.location.color)
				: "#6b7280"; // Default gray for no location
			const locationColor = getSafeEventColor(rawColor);

			// Get athletes from group or direct assignment
			const athletesList = s.athleteGroup?.members
				? s.athleteGroup.members.map((m) => ({
						id: m.athlete.id,
						name: m.athlete.user?.name ?? "Unknown",
						image: m.athlete.user?.image ?? null,
					}))
				: (s.athletes?.map((a) => ({
						id: a.athlete.id,
						name: a.athlete.user?.name ?? "Unknown",
						image: a.athlete.user?.image ?? null,
					})) ?? []);

			// Get coach info
			const coachesList = s.coaches.map((c) => ({
				id: c.coach.id,
				name: c.coach.user?.name ?? "Unknown",
				image: c.coach.user?.image ?? null,
				isPrimary: c.isPrimary,
			}));

			// Get primary coach or first coach
			const primaryCoach =
				coachesList.find((c) => c.isPrimary) ?? coachesList[0];

			const textColor = getContrastTextColor(locationColor);

			return {
				id: s.id,
				title: s.title,
				start: s.startTime,
				end: s.endTime,
				backgroundColor: locationColor,
				borderColor: locationColor,
				textColor,
				classNames: [
					s.status === "cancelled" ? "opacity-60" : "",
					s.status === "pending" ? "border-dashed" : "",
				].filter(Boolean),
				extendedProps: {
					status: s.status,
					location: s.location?.name,
					locationId: s.location?.id,
					athleteGroup: s.athleteGroup?.name,
					athletes: athletesList,
					coaches: coachesList,
					primaryCoach,
					isRecurring: s.isRecurring,
					textColor,
				},
			};
		});
	}, [sessions]);

	// Handle date range and view changes
	const handleDatesSet = React.useCallback((dateInfo: DatesSetArg) => {
		setDateRange({
			from: dateInfo.start,
			to: dateInfo.end,
		});
		// Track view changes to prevent reset on re-render
		setCurrentView(dateInfo.view.type);
	}, []);

	// Handle event click - open preview sheet
	const handleEventClick = React.useCallback((clickInfo: EventClickArg) => {
		const event = clickInfo.event;
		const props = event.extendedProps;

		const sessionData: SessionPreviewData = {
			id: event.id,
			title: event.title,
			start: event.start ?? new Date(),
			end: event.end ?? new Date(),
			status: props.status,
			location: props.location,
			athleteGroup: props.athleteGroup,
			athletes: props.athletes ?? [],
			coaches: props.coaches ?? [],
			isRecurring: props.isRecurring,
		};

		setSelectedSession(sessionData);
		setIsPreviewOpen(true);
	}, []);

	// Handle edit from preview sheet
	const handleEditFromPreview = React.useCallback(() => {
		if (selectedSession) {
			setIsPreviewOpen(false);
			// Find the full session data to pass to modal
			const sessionForModal = sessions?.find(
				(s) => s.id === selectedSession.id,
			);
			if (sessionForModal) {
				// Cast to the expected type for the modal
				NiceModal.show(TrainingSessionsModal, {
					session: sessionForModal as Parameters<
						typeof TrainingSessionsModal
					>[0]["session"],
				});
			}
		}
	}, [selectedSession, sessions]);

	// Handle delete from preview sheet
	const handleDeleteFromPreview = React.useCallback(() => {
		if (selectedSession) {
			deleteMutation.mutate({ id: selectedSession.id });
		}
	}, [selectedSession, deleteMutation]);

	// Handle date click - create new session (only in admin mode)
	const handleDateClick = React.useCallback(
		(arg: { date: Date; dateStr: string; allDay: boolean }) => {
			// Only allow creating sessions in admin mode
			if (mode !== "admin") return;

			// Set start time to the clicked date at current hour
			const startTime = new Date(arg.date);
			if (arg.allDay) {
				// For all-day clicks (month view), set to 9 AM
				startTime.setHours(9, 0, 0, 0);
			}

			// Open modal
			NiceModal.show(TrainingSessionsModal, {});
		},
		[mode],
	);

	// Update filter
	const updateFilter = (
		key: keyof typeof filters,
		value: string | undefined,
	) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	// Check if any filters are active
	const hasActiveFilters = Boolean(
		filters.locationId || filters.coachId || filters.athleteId,
	);

	// Clear all filters
	const clearFilters = () => {
		setFilters({});
	};

	// Count sessions (excluding cancelled)
	const activeSessionsCount = React.useMemo(() => {
		if (!sessions) return 0;
		return sessions.filter((s) => s.status !== "cancelled").length;
	}, [sessions]);

	if (isLoading) {
		return (
			<div className="space-y-4">
				{/* Filter skeleton */}
				<div className="flex items-center gap-2">
					<Skeleton className="h-9 w-[140px] rounded-md" />
					<Skeleton className="h-9 w-[140px] rounded-md" />
					<Skeleton className="h-9 w-[140px] rounded-md" />
					<div className="ml-auto">
						<Skeleton className="h-6 w-24 rounded-full" />
					</div>
				</div>
				{/* Calendar toolbar skeleton */}
				<div className="flex items-center justify-between">
					<div className="flex gap-1">
						<Skeleton className="h-9 w-9 rounded-md" />
						<Skeleton className="h-9 w-9 rounded-md" />
						<Skeleton className="h-9 w-16 rounded-md" />
					</div>
					<Skeleton className="h-7 w-36" />
					<div className="flex gap-1">
						<Skeleton className="h-9 w-16 rounded-md" />
						<Skeleton className="h-9 w-16 rounded-md" />
						<Skeleton className="h-9 w-14 rounded-md" />
					</div>
				</div>
				{/* Calendar grid skeleton */}
				<div className="space-y-0">
					{/* Header row */}
					<div className="grid grid-cols-7 gap-px border-b pb-2">
						{Array.from({ length: 7 }).map((_, i) => (
							<Skeleton key={`h-${i}`} className="h-4 w-8 mx-auto" />
						))}
					</div>
					{/* Time slots */}
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							key={`r-${i}`}
							className="grid grid-cols-7 gap-px border-b border-muted/50 py-3"
						>
							{Array.from({ length: 7 }).map((_, j) => (
								<div key={`c-${j}`} className="px-1">
									{(i + j) % 3 === 0 && (
										<Skeleton className="h-5 w-full rounded-sm" />
									)}
								</div>
							))}
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div>
			{/* Actions row */}
			<div className="mb-3 flex items-center justify-between">
				<Badge variant="outline" className="font-medium text-xs">
					{t("calendar.sessionCount", { count: activeSessionsCount })}
				</Badge>
				<div className="flex items-center gap-2">{toolbarActions}</div>
			</div>

			{/* Filters */}
			<div className="mb-4 flex flex-wrap items-center gap-2">
				<Select
					value={filters.locationId ?? "all"}
					onValueChange={(v) =>
						updateFilter("locationId", v === "all" ? undefined : v)
					}
				>
					<SelectTrigger size="sm">
						<SelectValue placeholder={t("calendar.allLocations")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("calendar.allLocations")}</SelectItem>
						{locations.map((loc) => (
							<SelectItem key={loc.id} value={loc.id}>
								<div className="flex items-center gap-2">
									<div
										className="size-2.5 rounded-full shrink-0"
										style={{
											backgroundColor: getLocationColor(
												loc.id,
												(loc as { color?: string | null }).color,
											),
										}}
									/>
									{loc.name}
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Only show coach/athlete filters in admin mode */}
				{mode === "admin" && (
					<>
						<Select
							value={filters.coachId ?? "all"}
							onValueChange={(v) =>
								updateFilter("coachId", v === "all" ? undefined : v)
							}
						>
							<SelectTrigger size="sm">
								<SelectValue placeholder={t("calendar.allCoaches")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("calendar.allCoaches")}</SelectItem>
								{coaches.map((coach) => (
									<SelectItem key={coach.id} value={coach.id}>
										{coach.user?.name ?? "Unknown"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={filters.athleteId ?? "all"}
							onValueChange={(v) =>
								updateFilter("athleteId", v === "all" ? undefined : v)
							}
						>
							<SelectTrigger size="sm">
								<SelectValue placeholder={t("calendar.allAthletes")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("calendar.allAthletes")}</SelectItem>
								{athletes.map((athlete) => (
									<SelectItem key={athlete.id} value={athlete.id}>
										{athlete.user?.name ?? "Unknown"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</>
				)}

				{hasActiveFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearFilters}
						className="h-9 px-2.5 text-muted-foreground hover:text-foreground"
					>
						<FilterXIcon className="mr-1 size-3.5" />
						{t("calendar.clear")}
					</Button>
				)}
			</div>

			<div className="training-session-calendar">
				<FullCalendar
					key={`calendar-${filters.locationId ?? "all"}-${filters.coachId ?? "all"}-${filters.athleteId ?? "all"}`}
					ref={calendarRef}
					plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
					initialView={currentView}
					headerToolbar={{
						left: "prev,next today",
						center: "title",
						right: "dayGridMonth,timeGridWeek,timeGridDay",
					}}
					events={events}
					eventClick={handleEventClick}
					dateClick={mode === "admin" ? handleDateClick : undefined}
					datesSet={handleDatesSet}
					editable={false}
					selectable={mode === "admin"}
					selectMirror={mode === "admin"}
					dayMaxEvents={3}
					weekends={true}
					nowIndicator={true}
					height="auto"
					eventDisplay="block"
					eventTimeFormat={{
						hour: "numeric",
						minute: "2-digit",
						meridiem: "short",
					}}
					slotMinTime="06:00:00"
					slotMaxTime="22:00:00"
					slotDuration="00:30:00"
					slotLabelInterval="01:00:00"
					expandRows={true}
					allDaySlot={false}
					eventContent={(eventInfo: EventContentArg) => {
						const {
							location,
							status,
							primaryCoach,
							athletes,
							athleteGroup,
							isRecurring,
							textColor,
						} = eventInfo.event.extendedProps;
						const isCancelled = status === "cancelled";
						const viewType = eventInfo.view.type;
						const isDetailedView =
							viewType === "timeGridWeek" || viewType === "timeGridDay";

						// Status dot - subtle inline indicator
						const statusCfg =
							trainingSessionStatusConfig[
								status as keyof typeof trainingSessionStatusConfig
							] ?? trainingSessionStatusConfig.pending;
						const dotClass = statusCfg.dot;

						// Get display title - prefer athlete/group name over session title
						const athletesList = athletes as {
							id: string;
							name: string;
							image: string | null;
						}[];
						const getDisplayTitle = () => {
							if (athleteGroup) {
								return athleteGroup;
							}
							if (athletesList.length === 1) {
								return athletesList[0]?.name ?? eventInfo.event.title;
							}
							if (athletesList.length > 1) {
								return `${athletesList[0]?.name} +${athletesList.length - 1}`;
							}
							return eventInfo.event.title;
						};
						const displayTitle = getDisplayTitle();

						const eventTextColor = (textColor as string) ?? "#ffffff";

						// For month view - compact display
						if (!isDetailedView) {
							return (
								<div
									className={`overflow-hidden px-1.5 py-0.5 ${isCancelled ? "line-through opacity-50" : ""}`}
									style={{ color: eventTextColor }}
								>
									<div className="flex items-center gap-1.5">
										<span
											className={`size-2 rounded-full shrink-0 ${dotClass}`}
										/>
										{isRecurring && (
											<RepeatIcon className="size-2.5 opacity-70 shrink-0" />
										)}
										<span className="truncate font-medium text-[11px] leading-tight">
											{eventInfo.timeText} {displayTitle}
										</span>
									</div>
								</div>
							);
						}

						// For day/week views - detailed display
						const coach = primaryCoach as
							| { id: string; name: string; image: string | null }
							| undefined;

						return (
							<div
								className={`overflow-hidden p-1.5 h-full flex flex-col ${isCancelled ? "opacity-50" : ""}`}
								style={{ color: eventTextColor }}
							>
								{/* Header: Title + indicators */}
								<div className="flex items-center gap-1.5 mb-0.5">
									<span
										className={`size-2 rounded-full shrink-0 ${dotClass}`}
									/>
									{isRecurring && (
										<RepeatIcon className="size-2.5 opacity-70 shrink-0" />
									)}
									{athleteGroup && (
										<UsersIcon className="size-3 opacity-70 shrink-0" />
									)}
									<span
										className={`truncate font-semibold text-xs leading-tight ${isCancelled ? "line-through" : ""}`}
									>
										{displayTitle}
									</span>
								</div>

								{/* Coach with avatar */}
								{coach && (
									<div className="flex items-center gap-1.5 mt-0.5">
										<UserAvatar
											className="size-4 text-[8px]"
											name={coach.name}
											src={coach.image ?? undefined}
										/>
										<span className="truncate text-[10px] opacity-90">
											{coach.name}
										</span>
									</div>
								)}

								{/* Location */}
								{location && (
									<div className="truncate text-[10px] opacity-70 mt-auto pt-0.5">
										{location}
									</div>
								)}

								{/* Athletes avatars - only show if multiple athletes (not group) */}
								{!athleteGroup && athletesList.length > 1 && (
									<div className="flex items-center gap-1 mt-1">
										<div className="flex -space-x-1">
											{athletesList.slice(0, 3).map((athlete) => (
												<UserAvatar
													key={athlete.id}
													className="size-4 border border-white/50 text-[7px]"
													name={athlete.name}
													src={athlete.image ?? undefined}
												/>
											))}
										</div>
										{athletesList.length > 3 && (
											<span className="text-[9px] opacity-70 ml-0.5">
												+{athletesList.length - 3}
											</span>
										)}
									</div>
								)}
							</div>
						);
					}}
				/>
			</div>

			{/* Legend */}
			<div className="mt-4 pt-3 border-t border-border/50">
				<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
					{/* Status Legend */}
					{(["pending", "confirmed", "completed", "cancelled"] as const).map(
						(s) => (
							<div key={s} className="flex items-center gap-1.5">
								<span
									className={`size-2 rounded-full ${trainingSessionStatusConfig[s].dot}`}
								/>
								<span>{t(`calendar.${s}`)}</span>
							</div>
						),
					)}
					<div className="flex items-center gap-1.5">
						<RepeatIcon className="size-3 text-muted-foreground" />
						<span>{t("calendar.recurring")}</span>
					</div>

					{/* Location Legend */}
					{locations.length > 0 && (
						<>
							<div className="hidden sm:block h-3 w-px bg-border" />
							{locations.slice(0, 5).map((loc) => (
								<div key={loc.id} className="flex items-center gap-1.5">
									<span
										className="size-2 rounded-full"
										style={{
											backgroundColor: getLocationColor(
												loc.id,
												(loc as { color?: string | null }).color,
											),
										}}
									/>
									<span>{loc.name}</span>
								</div>
							))}
							{locations.length > 5 && (
								<span className="text-muted-foreground/60">
									+{locations.length - 5}
								</span>
							)}
						</>
					)}
				</div>
			</div>
			{/* Session Preview Sheet */}
			<TrainingSessionPreviewSheet
				session={selectedSession}
				open={isPreviewOpen}
				onOpenChange={setIsPreviewOpen}
				onEdit={
					mode === "admin" || mode === "coach"
						? handleEditFromPreview
						: undefined
				}
				onDelete={mode === "admin" ? handleDeleteFromPreview : undefined}
				isDeleting={deleteMutation.isPending}
			/>
		</div>
	);
}
