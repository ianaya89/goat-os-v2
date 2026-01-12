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
	UsersIcon,
	XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { TrainingSessionsModal } from "@/components/organization/training-sessions-modal";
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
	const router = useRouter();
	const calendarRef = React.useRef<FullCalendar>(null);

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
				},
			};
		});
	}, [sessions]);

	// Handle date range changes (when navigating months)
	const handleDatesSet = React.useCallback((dateInfo: DatesSetArg) => {
		setDateRange({
			from: dateInfo.start,
			to: dateInfo.end,
		});
	}, []);

	// Handle event click - navigate to session detail
	const handleEventClick = React.useCallback(
		(clickInfo: EventClickArg) => {
			router.push(
				`/dashboard/organization/training-sessions/${clickInfo.event.id}`,
			);
		},
		[router],
	);

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
				<div className="mb-4 flex flex-wrap gap-3">
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
				</div>

				{/* Location Color Legend */}
				{locations.length > 0 && (
					<div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
						<span className="text-muted-foreground font-medium">
							Locations:
						</span>
						{locations.slice(0, 6).map((loc) => (
							<div key={loc.id} className="flex items-center gap-1.5">
								<div
									className="size-3 rounded-full"
									style={{
										backgroundColor: getLocationColor(
											loc.id,
											(loc as { color?: string | null }).color,
										),
									}}
								/>
								<span className="text-muted-foreground">{loc.name}</span>
							</div>
						))}
						{locations.length > 6 && (
							<span className="text-muted-foreground">
								+{locations.length - 6} more
							</span>
						)}
					</div>
				)}

				<div className="training-session-calendar">
					<FullCalendar
						ref={calendarRef}
						plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
						initialView="timeGridWeek"
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
						allDaySlot={false}
						eventContent={(eventInfo: EventContentArg) => {
							const { location, status, primaryCoach, athletes, athleteGroup } =
								eventInfo.event.extendedProps;
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

							// For month view - compact display
							if (!isDetailedView) {
								return (
									<div
										className={`overflow-hidden p-1 ${isCancelled ? "line-through opacity-60" : ""}`}
									>
										<div className="flex items-center gap-1">
											<StatusIcon />
											<span className="truncate font-medium text-xs">
												{eventInfo.timeText} - {eventInfo.event.title}
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

							// Status badge colors for day/week views
							const statusBadgeColors: Record<
								string,
								{ bg: string; text: string; label: string }
							> = {
								pending: {
									bg: "bg-amber-100",
									text: "text-amber-700",
									label: "Pendiente",
								},
								confirmed: {
									bg: "bg-blue-100",
									text: "text-blue-700",
									label: "Confirmado",
								},
								completed: {
									bg: "bg-green-100",
									text: "text-green-700",
									label: "Completado",
								},
								cancelled: {
									bg: "bg-red-100",
									text: "text-red-700",
									label: "Cancelado",
								},
							};

							// For day/week views - detailed display
							const athletesList = athletes as {
								id: string;
								name: string;
								image: string | null;
							}[];
							const coach = primaryCoach as
								| { id: string; name: string; image: string | null }
								| undefined;

							const defaultBadge = {
								bg: "bg-blue-100",
								text: "text-blue-700",
								label: "Confirmado",
							};
							const badgeStyle =
								statusBadgeColors[status as keyof typeof statusBadgeColors] ??
								defaultBadge;

							return (
								<div
									className={`overflow-hidden p-1.5 h-full ${isCancelled ? "opacity-60" : ""}`}
								>
									{/* Status badge */}
									<div
										className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium mb-1 ${badgeStyle.bg} ${badgeStyle.text}`}
									>
										<StatusIcon />
										<span>{badgeStyle.label}</span>
									</div>

									{/* Title */}
									<div className="flex items-center gap-1">
										<span
											className={`truncate font-semibold text-xs ${isCancelled ? "line-through" : ""}`}
										>
											{eventInfo.event.title}
										</span>
									</div>

									{/* Location */}
									{location && (
										<div className="truncate text-[10px] opacity-80 mt-0.5">
											{location}
										</div>
									)}

									{/* Coach with avatar */}
									{coach && (
										<div className="flex items-center gap-1 mt-1.5">
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

									{/* Athletes/Group */}
									{(athleteGroup || athletesList.length > 0) && (
										<div className="flex items-center gap-1 mt-1">
											{athleteGroup ? (
												<>
													<UsersIcon className="size-3 opacity-70" />
													<span className="truncate text-[10px] opacity-80">
														{athleteGroup}
													</span>
												</>
											) : athletesList.length > 0 ? (
												<>
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
													{athletesList.length <= 3 && (
														<span className="truncate text-[10px] opacity-80">
															{athletesList.length === 1
																? athletesList[0]?.name
																: `${athletesList.length} athletes`}
														</span>
													)}
												</>
											) : null}
										</div>
									)}
								</div>
							);
						}}
					/>
				</div>

				{/* Status Legend */}
				<div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground border-t pt-3">
					<span className="font-medium">Status:</span>
					<div className="flex items-center gap-1.5">
						<CircleDashedIcon className="size-3.5 text-amber-600" />
						<span>Pending</span>
					</div>
					<div className="flex items-center gap-1.5">
						<CircleIcon className="size-3.5 text-blue-600" />
						<span>Confirmed</span>
					</div>
					<div className="flex items-center gap-1.5">
						<CheckCircle2Icon className="size-3.5 text-green-700" />
						<span>Completed</span>
					</div>
					<div className="flex items-center gap-1.5">
						<XCircleIcon className="size-3.5 text-red-600" />
						<span>Cancelled</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
