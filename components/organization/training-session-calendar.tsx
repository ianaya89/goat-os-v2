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
import {
	CheckCircle2Icon,
	CircleDashedIcon,
	CircleIcon,
	FilterXIcon,
	RepeatIcon,
	UsersIcon,
	XCircleIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
	type SessionPreviewData,
	TrainingSessionPreviewSheet,
} from "@/components/organization/training-session-preview-sheet";
import { TrainingSessionsModal } from "@/components/organization/training-sessions-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user/user-avatar";
import { getLocationColor } from "@/lib/utils/location-colors";
import { trpc } from "@/trpc/client";

export function TrainingSessionCalendar() {
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

	const { data: sessions, isLoading } =
		trpc.organization.trainingSession.listForCalendar.useQuery({
			from: dateRange.from,
			to: dateRange.to,
			...filters,
		});

	// Delete mutation
	const deleteMutation = trpc.organization.trainingSession.delete.useMutation({
		onSuccess: () => {
			toast.success("Session deleted");
			utils.organization.trainingSession.listForCalendar.invalidate();
			setIsPreviewOpen(false);
			setSelectedSession(null);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete session");
		},
	});

	// Transform sessions to FullCalendar events with location-based colors
	const events: EventInput[] = React.useMemo(() => {
		if (!sessions) return [];

		return sessions.map((session) => {
			// Get location color (or fallback)
			const locationColor = session.location?.id
				? getLocationColor(session.location.id, session.location.color)
				: "#6b7280"; // Default gray for no location

			// Get athletes from group or direct assignment
			const athletesList = session.athleteGroup?.members
				? session.athleteGroup.members.map((m) => ({
						id: m.athlete.id,
						name: m.athlete.user?.name ?? "Unknown",
						image: m.athlete.user?.image ?? null,
					}))
				: (session.athletes?.map((a) => ({
						id: a.athlete.id,
						name: a.athlete.user?.name ?? "Unknown",
						image: a.athlete.user?.image ?? null,
					})) ?? []);

			// Get coach info
			const coachesList = session.coaches.map((c) => ({
				id: c.coach.id,
				name: c.coach.user?.name ?? "Unknown",
				image: c.coach.user?.image ?? null,
				isPrimary: c.isPrimary,
			}));

			// Get primary coach or first coach
			const primaryCoach =
				coachesList.find((c) => c.isPrimary) ?? coachesList[0];

			return {
				id: session.id,
				title: session.title,
				start: session.startTime,
				end: session.endTime,
				backgroundColor: locationColor,
				borderColor: locationColor,
				classNames: [
					session.status === "cancelled" ? "opacity-60" : "",
					session.status === "pending" ? "border-dashed" : "",
				].filter(Boolean),
				extendedProps: {
					status: session.status,
					location: session.location?.name,
					locationId: session.location?.id,
					athleteGroup: session.athleteGroup?.name,
					athletes: athletesList,
					coaches: coachesList,
					primaryCoach,
					isRecurring: session.isRecurring,
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
				NiceModal.show(TrainingSessionsModal, { session: sessionForModal });
			}
		}
	}, [selectedSession, sessions]);

	// Handle delete from preview sheet
	const handleDeleteFromPreview = React.useCallback(() => {
		if (selectedSession) {
			deleteMutation.mutate({ id: selectedSession.id });
		}
	}, [selectedSession, deleteMutation]);

	// Handle date click - create new session
	const handleDateClick = React.useCallback(
		(arg: { date: Date; dateStr: string; allDay: boolean }) => {
			// Set start time to the clicked date at current hour
			const startTime = new Date(arg.date);
			if (arg.allDay) {
				// For all-day clicks (month view), set to 9 AM
				startTime.setHours(9, 0, 0, 0);
			}

			// Open modal
			NiceModal.show(TrainingSessionsModal, {});
		},
		[],
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
			<Card>
				<CardContent className="p-6">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Skeleton className="h-8 w-32" />
							<div className="flex gap-2">
								<Skeleton className="h-8 w-20" />
								<Skeleton className="h-8 w-20" />
								<Skeleton className="h-8 w-20" />
							</div>
						</div>
						<Skeleton className="h-[600px] w-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardContent className="p-4">
				{/* Filters */}
				<div className="mb-4 flex flex-wrap items-center gap-3">
					<Select
						value={filters.locationId ?? "all"}
						onValueChange={(v) =>
							updateFilter("locationId", v === "all" ? undefined : v)
						}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="All Locations" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Locations</SelectItem>
							{locations.map((loc) => (
								<SelectItem key={loc.id} value={loc.id}>
									<div className="flex items-center gap-2">
										<div
											className="size-3 rounded-full shrink-0"
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

					<Select
						value={filters.coachId ?? "all"}
						onValueChange={(v) =>
							updateFilter("coachId", v === "all" ? undefined : v)
						}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="All Coaches" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Coaches</SelectItem>
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
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="All Athletes" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Athletes</SelectItem>
							{athletes.map((athlete) => (
								<SelectItem key={athlete.id} value={athlete.id}>
									{athlete.user?.name ?? "Unknown"}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearFilters}
							className="h-9 px-3 text-muted-foreground hover:text-foreground"
						>
							<FilterXIcon className="mr-1.5 size-4" />
							Clear
						</Button>
					)}

					{/* Session counter */}
					<div className="ml-auto">
						<Badge variant="secondary" className="font-medium">
							{activeSessionsCount} session
							{activeSessionsCount !== 1 ? "s" : ""}
						</Badge>
					</div>
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
						dateClick={handleDateClick}
						datesSet={handleDatesSet}
						editable={false}
						selectable={true}
						selectMirror={true}
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
							} = eventInfo.event.extendedProps;
							const isCancelled = status === "cancelled";
							const viewType = eventInfo.view.type;
							const isDetailedView =
								viewType === "timeGridWeek" || viewType === "timeGridDay";

							// Status icon helper
							const StatusIcon = () => {
								switch (status) {
									case "completed":
										return (
											<CheckCircle2Icon className="size-3 text-green-700" />
										);
									case "cancelled":
										return <XCircleIcon className="size-3 text-red-600" />;
									case "pending":
										return (
											<CircleDashedIcon className="size-3 text-amber-600" />
										);
									default:
										// "confirmed" or any other status
										return <CircleIcon className="size-3 text-blue-600" />;
								}
							};

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

							// For month view - compact display
							if (!isDetailedView) {
								return (
									<div
										className={`overflow-hidden p-1 ${isCancelled ? "line-through opacity-60" : ""}`}
									>
										<div className="flex items-center gap-1">
											<StatusIcon />
											{isRecurring && (
												<RepeatIcon className="size-3 text-purple-600 shrink-0" />
											)}
											<span className="truncate font-medium text-xs">
												{eventInfo.timeText} - {displayTitle}
											</span>
										</div>
										{location && (
											<div className="truncate text-[10px] opacity-80 ml-4">
												{location}
											</div>
										)}
									</div>
								);
							}

							// For day/week views - detailed display
							const coach = primaryCoach as
								| { id: string; name: string; image: string | null }
								| undefined;

							return (
								<div
									className={`overflow-hidden p-1.5 h-full ${isCancelled ? "opacity-60" : ""}`}
								>
									{/* Header: Status + Title */}
									<div className="flex items-center gap-1.5 mb-1">
										<StatusIcon />
										{isRecurring && (
											<RepeatIcon className="size-3 text-purple-600 shrink-0" />
										)}
										{athleteGroup && (
											<UsersIcon className="size-3 opacity-70 shrink-0" />
										)}
										<span
											className={`truncate font-semibold text-xs ${isCancelled ? "line-through" : ""}`}
										>
											{displayTitle}
										</span>
									</div>

									{/* Coach with avatar - prioritized */}
									{coach && (
										<div className="flex items-center gap-1.5 mb-1">
											<UserAvatar
												className="size-5 text-[9px]"
												name={coach.name}
												src={coach.image ?? undefined}
											/>
											<span className="truncate text-[11px] font-medium">
												{coach.name}
											</span>
										</div>
									)}

									{/* Location */}
									{location && (
										<div className="truncate text-[10px] opacity-80">
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
														className="size-4 border border-white text-[8px]"
														name={athlete.name}
														src={athlete.image ?? undefined}
													/>
												))}
											</div>
											{athletesList.length > 3 && (
												<span className="text-[10px] opacity-80 ml-0.5">
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

				{/* Combined Legend */}
				<div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground border-t pt-3">
					{/* Status Legend */}
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1">
							<CircleDashedIcon className="size-3 text-amber-600" />
							<span>Pending</span>
						</div>
						<div className="flex items-center gap-1">
							<CircleIcon className="size-3 text-blue-600" />
							<span>Confirmed</span>
						</div>
						<div className="flex items-center gap-1">
							<CheckCircle2Icon className="size-3 text-green-700" />
							<span>Completed</span>
						</div>
						<div className="flex items-center gap-1">
							<XCircleIcon className="size-3 text-red-600" />
							<span>Cancelled</span>
						</div>
						<div className="flex items-center gap-1">
							<RepeatIcon className="size-3 text-purple-600" />
							<span>Recurring</span>
						</div>
					</div>

					{/* Location Legend - separated by a subtle divider */}
					{locations.length > 0 && (
						<>
							<div className="hidden sm:block h-4 w-px bg-border" />
							<div className="flex items-center gap-3">
								{locations.slice(0, 5).map((loc) => (
									<div key={loc.id} className="flex items-center gap-1">
										<div
											className="size-2.5 rounded-full"
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
									<span className="text-muted-foreground/70">
										+{locations.length - 5}
									</span>
								)}
							</div>
						</>
					)}
				</div>
			</CardContent>

			{/* Session Preview Sheet */}
			<TrainingSessionPreviewSheet
				session={selectedSession}
				open={isPreviewOpen}
				onOpenChange={setIsPreviewOpen}
				onEdit={handleEditFromPreview}
				onDelete={handleDeleteFromPreview}
				isDeleting={deleteMutation.isPending}
			/>
		</Card>
	);
}
