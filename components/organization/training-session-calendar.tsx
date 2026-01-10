"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DatesSetArg, EventInput } from "@fullcalendar/core";
import NiceModal from "@ebay/nice-modal-react";
import { addMonths, startOfMonth, endOfMonth } from "date-fns";
import * as React from "react";
import { TrainingSessionsModal } from "@/components/organization/training-sessions-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrainingSessionStatus } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";

// Map session status to calendar event colors
const statusColors: Record<string, { backgroundColor: string; borderColor: string }> = {
	pending: { backgroundColor: "#6b7280", borderColor: "#4b5563" },
	confirmed: { backgroundColor: "#3b82f6", borderColor: "#2563eb" },
	completed: { backgroundColor: "#22c55e", borderColor: "#16a34a" },
	cancelled: { backgroundColor: "#ef4444", borderColor: "#dc2626" },
};

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

	const { data: sessions, isLoading } =
		trpc.organization.trainingSession.listForCalendar.useQuery({
			from: dateRange.from,
			to: dateRange.to,
		});

	// Transform sessions to FullCalendar events
	const events: EventInput[] = React.useMemo(() => {
		if (!sessions) return [];

		return sessions.map((session) => {
			const defaultColors = { backgroundColor: "#6b7280", borderColor: "#4b5563" };
			const colors = statusColors[session.status] ?? defaultColors;
			return {
				id: session.id,
				title: session.title,
				start: session.startTime,
				end: session.endTime,
				backgroundColor: colors.backgroundColor,
				borderColor: colors.borderColor,
				extendedProps: {
					status: session.status,
					location: session.location?.name,
					athleteGroup: session.athleteGroup?.name,
					coaches: session.coaches.map((c) => c.coach.user?.name).filter(Boolean),
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
			router.push(`/dashboard/organization/training-sessions/${clickInfo.event.id}`);
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

			// Calculate end time (1 hour later)
			const endTime = new Date(startTime);
			endTime.setHours(endTime.getHours() + 1);

			// Open modal with pre-filled dates
			NiceModal.show(TrainingSessionsModal, {
				// Pass default values through modal props if supported
			});
		},
		[],
	);

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
				<div className="training-session-calendar">
					<FullCalendar
						ref={calendarRef}
						plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
						initialView="dayGridMonth"
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
						eventContent={(eventInfo) => {
							const { location, coaches } = eventInfo.event.extendedProps;
							return (
								<div className="overflow-hidden p-1">
									<div className="truncate font-medium text-xs">
										{eventInfo.timeText} - {eventInfo.event.title}
									</div>
									{location && (
										<div className="truncate text-[10px] opacity-80">
											{location}
										</div>
									)}
								</div>
							);
						}}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
