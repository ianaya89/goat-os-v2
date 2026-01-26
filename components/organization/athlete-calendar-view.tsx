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
import { format } from "date-fns";
import {
	ActivityIcon,
	CheckCircle2Icon,
	CircleDashedIcon,
	CircleIcon,
	ClockIcon,
	MapPinIcon,
	RepeatIcon,
	UsersIcon,
	XCircleIcon,
} from "lucide-react";
import * as React from "react";
import { SessionFeedbackModal } from "@/components/organization/session-feedback-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user/user-avatar";
import { getLocationColor } from "@/lib/utils/location-colors";
import { trpc } from "@/trpc/client";

export function AthleteCalendarView() {
	const calendarRef = React.useRef<FullCalendar>(null);

	// Track current view type to prevent reset on re-render
	const [currentView, setCurrentView] = React.useState("timeGridWeek");

	// Session detail sheet state
	const [selectedSession, setSelectedSession] = React.useState<{
		id: string;
		title: string;
		startTime: Date;
		endTime: Date;
		status: string;
		location?: { id: string; name: string; color?: string | null } | null;
		athleteGroup?: { name: string } | null;
		coaches?: Array<{ name: string; image?: string | null }>;
		objectives?: string | null;
		planning?: string | null;
		isRecurring?: boolean;
	} | null>(null);
	const [isSheetOpen, setIsSheetOpen] = React.useState(false);

	// Fetch athlete's sessions (no date filter - fetch all and let calendar handle display)
	const { data, isLoading, error } =
		trpc.organization.trainingSession.listMySessionsAsAthlete.useQuery({
			limit: 100,
			offset: 0,
		});

	const sessions = data?.sessions ?? [];

	// DEBUG: Log what we're getting from the query
	React.useEffect(() => {
		console.log("[AthleteCalendar] data:", data);
		console.log("[AthleteCalendar] sessions count:", sessions.length);
		console.log("[AthleteCalendar] athlete:", data?.athlete);
		if (error) {
			console.error("[AthleteCalendar] error:", error);
		}
	}, [data, sessions.length, error]);

	// Get unique locations for the legend
	const locations = React.useMemo(() => {
		const locationMap = new Map<
			string,
			{ id: string; name: string; color?: string | null }
		>();
		for (const session of sessions) {
			if (session.location && !locationMap.has(session.location.name)) {
				locationMap.set(session.location.name, {
					id: session.location.name,
					name: session.location.name,
					color: (session.location as { color?: string | null }).color,
				});
			}
		}
		return Array.from(locationMap.values());
	}, [sessions]);

	// Transform sessions to FullCalendar events with same styling as admin calendar
	const events: EventInput[] = React.useMemo(() => {
		console.log(
			"[AthleteCalendar] Transforming",
			sessions.length,
			"sessions to events",
		);
		return sessions.map((session) => {
			const locationColor = session.location
				? getLocationColor(
						session.location.name,
						(session.location as { color?: string | null }).color,
					)
				: "#6b7280";

			// Get coaches from session
			const coachesList =
				session.coaches?.map((c) => ({
					name: c.coach?.user?.name ?? "Unknown",
					image: c.coach?.user?.image ?? null,
					isPrimary: c.isPrimary,
				})) ?? [];

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
					location: session.location,
					athleteGroup: session.athleteGroup,
					coaches: coachesList,
					primaryCoach,
					objectives: session.objectives,
					planning: session.planning,
					isRecurring: session.isRecurring,
				},
			};
		});
	}, [sessions]);

	const handleEventClick = (arg: EventClickArg) => {
		const session = sessions.find((s) => s.id === arg.event.id);
		if (session) {
			setSelectedSession({
				id: session.id,
				title: session.title,
				startTime: new Date(session.startTime),
				endTime: new Date(session.endTime),
				status: session.status,
				location: session.location
					? {
							id: session.location.name,
							name: session.location.name,
							color: (session.location as { color?: string | null }).color,
						}
					: null,
				athleteGroup: session.athleteGroup,
				coaches:
					session.coaches?.map((c) => ({
						name: c.coach?.user?.name ?? "Unknown",
						image: c.coach?.user?.image ?? null,
					})) ?? [],
				objectives: session.objectives,
				planning: session.planning,
				isRecurring: session.isRecurring,
			});
			setIsSheetOpen(true);
		}
	};

	const handleDatesSet = React.useCallback((arg: DatesSetArg) => {
		setCurrentView(arg.view.type);
	}, []);

	// Status icon helper - same as admin calendar
	const StatusIcon = ({ status }: { status: string }) => {
		switch (status) {
			case "completed":
				return <CheckCircle2Icon className="size-3 text-green-700" />;
			case "cancelled":
				return <XCircleIcon className="size-3 text-red-600" />;
			case "pending":
				return <CircleDashedIcon className="size-3 text-amber-600" />;
			default:
				return <CircleIcon className="size-3 text-blue-600" />;
		}
	};

	const renderEventContent = (eventInfo: EventContentArg) => {
		const { status, primaryCoach, athleteGroup, isRecurring } =
			eventInfo.event.extendedProps;
		const isCancelled = status === "cancelled";
		const viewType = eventInfo.view.type;
		const isDetailedView =
			viewType === "timeGridWeek" || viewType === "timeGridDay";

		// Get display title - prefer group name over session title
		const getDisplayTitle = () => {
			if (athleteGroup?.name) {
				return athleteGroup.name;
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
						<StatusIcon status={status} />
						{isRecurring && (
							<RepeatIcon className="size-3 text-purple-600 shrink-0" />
						)}
						<span className="truncate font-medium text-xs">
							{eventInfo.timeText} - {displayTitle}
						</span>
					</div>
				</div>
			);
		}

		// For day/week views - detailed display
		const coach = primaryCoach as
			| { name: string; image: string | null }
			| undefined;

		return (
			<div
				className={`overflow-hidden p-1.5 h-full ${isCancelled ? "opacity-60" : ""}`}
			>
				{/* Header: Status + Title */}
				<div className="flex items-center gap-1.5 mb-1">
					<StatusIcon status={status} />
					{isRecurring && (
						<RepeatIcon className="size-3 text-purple-600 shrink-0" />
					)}
					{athleteGroup && <UsersIcon className="size-3 opacity-70 shrink-0" />}
					<span
						className={`truncate font-semibold text-xs ${isCancelled ? "line-through" : ""}`}
					>
						{displayTitle}
					</span>
				</div>

				{/* Coach with avatar */}
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
				{eventInfo.event.extendedProps.location?.name && (
					<div className="truncate text-[10px] opacity-80">
						{eventInfo.event.extendedProps.location.name}
					</div>
				)}
			</div>
		);
	};

	// Count sessions (excluding cancelled)
	const activeSessionsCount = React.useMemo(() => {
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
		<>
			<Card>
				<CardContent className="p-4">
					{/* Session counter */}
					<div className="mb-4 flex items-center justify-end">
						<Badge variant="secondary" className="font-medium">
							{activeSessionsCount} sesión
							{activeSessionsCount !== 1 ? "es" : ""}
						</Badge>
					</div>

					<div className="training-session-calendar">
						<FullCalendar
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
							eventContent={renderEventContent}
							datesSet={handleDatesSet}
							editable={false}
							selectable={false}
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
						/>
					</div>

					{/* Combined Legend - same as admin calendar */}
					<div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground border-t pt-3">
						{/* Status Legend */}
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-1">
								<CircleDashedIcon className="size-3 text-amber-600" />
								<span>Pendiente</span>
							</div>
							<div className="flex items-center gap-1">
								<CircleIcon className="size-3 text-blue-600" />
								<span>Confirmada</span>
							</div>
							<div className="flex items-center gap-1">
								<CheckCircle2Icon className="size-3 text-green-700" />
								<span>Completada</span>
							</div>
							<div className="flex items-center gap-1">
								<XCircleIcon className="size-3 text-red-600" />
								<span>Cancelada</span>
							</div>
							<div className="flex items-center gap-1">
								<RepeatIcon className="size-3 text-purple-600" />
								<span>Recurrente</span>
							</div>
						</div>

						{/* Location Legend */}
						{locations.length > 0 && (
							<>
								<div className="hidden sm:block h-4 w-px bg-border" />
								<div className="flex items-center gap-3">
									{locations.slice(0, 5).map((loc) => (
										<div key={loc.id} className="flex items-center gap-1">
											<div
												className="size-2.5 rounded-full"
												style={{
													backgroundColor: getLocationColor(loc.id, loc.color),
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
			</Card>

			{/* Session Detail Sheet */}
			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>{selectedSession?.title}</SheetTitle>
						<SheetDescription>Detalle de la sesión</SheetDescription>
					</SheetHeader>

					{selectedSession && (
						<div className="mt-6 space-y-6">
							{/* Status Badge */}
							<div className="flex items-center gap-2">
								<Badge
									variant={
										selectedSession.status === "completed"
											? "default"
											: selectedSession.status === "cancelled"
												? "destructive"
												: "secondary"
									}
								>
									{selectedSession.status === "completed"
										? "Completada"
										: selectedSession.status === "pending"
											? "Pendiente"
											: selectedSession.status === "cancelled"
												? "Cancelada"
												: "Confirmada"}
								</Badge>
								{selectedSession.isRecurring && (
									<Badge variant="outline" className="gap-1">
										<RepeatIcon className="size-3" />
										Recurrente
									</Badge>
								)}
							</div>

							{/* Date and Time */}
							<div className="flex items-start gap-3">
								<ClockIcon className="mt-0.5 size-5 text-muted-foreground" />
								<div>
									<p className="font-medium">
										{format(selectedSession.startTime, "EEEE, d 'de' MMMM")}
									</p>
									<p className="text-muted-foreground text-sm">
										{format(selectedSession.startTime, "HH:mm")} -{" "}
										{format(selectedSession.endTime, "HH:mm")}
									</p>
								</div>
							</div>

							{/* Location */}
							{selectedSession.location && (
								<div className="flex items-start gap-3">
									<MapPinIcon className="mt-0.5 size-5 text-muted-foreground" />
									<div className="flex items-center gap-2">
										<div
											className="size-3 rounded-full shrink-0"
											style={{
												backgroundColor: getLocationColor(
													selectedSession.location.id,
													selectedSession.location.color,
												),
											}}
										/>
										<p className="font-medium">
											{selectedSession.location.name}
										</p>
									</div>
								</div>
							)}

							{/* Group */}
							{selectedSession.athleteGroup && (
								<div className="flex items-start gap-3">
									<UsersIcon className="mt-0.5 size-5 text-muted-foreground" />
									<div>
										<p className="font-medium">
											{selectedSession.athleteGroup.name}
										</p>
									</div>
								</div>
							)}

							{/* Coaches */}
							{selectedSession.coaches &&
								selectedSession.coaches.length > 0 && (
									<div>
										<h4 className="mb-2 font-medium text-sm">Entrenadores</h4>
										<div className="flex flex-wrap gap-2">
											{selectedSession.coaches.map((coach, idx) => (
												<div
													key={idx}
													className="flex items-center gap-2 bg-muted px-2 py-1 rounded-md"
												>
													<UserAvatar
														className="size-6 text-[10px]"
														name={coach.name}
														src={coach.image ?? undefined}
													/>
													<span className="text-sm">{coach.name}</span>
												</div>
											))}
										</div>
									</div>
								)}

							{/* Objectives */}
							{selectedSession.objectives && (
								<div>
									<h4 className="mb-2 font-medium text-sm">Objetivos</h4>
									<p className="text-muted-foreground text-sm whitespace-pre-wrap">
										{selectedSession.objectives}
									</p>
								</div>
							)}

							{/* Planning */}
							{selectedSession.planning && (
								<div>
									<h4 className="mb-2 font-medium text-sm">Planificación</h4>
									<p className="text-muted-foreground text-sm whitespace-pre-wrap">
										{selectedSession.planning}
									</p>
								</div>
							)}

							{/* Feedback button - only show for completed/confirmed sessions */}
							{(selectedSession.status === "completed" ||
								selectedSession.status === "confirmed") && (
								<div className="border-t pt-4 mt-4">
									<Button
										onClick={() => {
											NiceModal.show(SessionFeedbackModal, {
												sessionId: selectedSession.id,
												sessionTitle: selectedSession.title,
											});
										}}
										className="w-full"
										variant="outline"
									>
										<ActivityIcon className="mr-2 size-4" />
										{selectedSession.status === "completed"
											? "Dar Feedback de la Sesión"
											: "Evaluar Esfuerzo (RPE)"}
									</Button>
									<p className="text-muted-foreground text-xs mt-2 text-center">
										{selectedSession.status === "completed"
											? "Comparte cómo te sentiste durante el entrenamiento"
											: "Puedes registrar tu esfuerzo percibido después de la sesión"}
									</p>
								</div>
							)}
						</div>
					)}
				</SheetContent>
			</Sheet>
		</>
	);
}
