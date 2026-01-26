"use client";

import { differenceInMinutes, format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ZoomIn, ZoomOut } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { EventTimeBlockType } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface EventRotationTimelineProps {
	eventId: string;
}

export function EventRotationTimeline({
	eventId,
}: EventRotationTimelineProps): React.JSX.Element {
	const [pixelsPerMinute, setPixelsPerMinute] = React.useState(3);

	const { data, isPending } =
		trpc.organization.eventRotation.getOverview.useQuery({ eventId });

	if (isPending) {
		return <Skeleton className="h-96 w-full" />;
	}

	const { groups = [], stations = [], schedule } = data || {};

	if (!schedule) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12 text-center">
					<Clock className="mb-4 size-12 text-muted-foreground" />
					<h3 className="text-lg font-medium">No hay cronograma</h3>
					<p className="text-sm text-muted-foreground">
						Genera un cronograma primero en la pestana de Configuracion
					</p>
				</CardContent>
			</Card>
		);
	}

	const timeBlocks = schedule.timeBlocks || [];
	const scheduleStart = new Date(schedule.startTime);
	const scheduleEnd = new Date(schedule.endTime);
	const totalMinutes = differenceInMinutes(scheduleEnd, scheduleStart);
	const totalWidth = totalMinutes * pixelsPerMinute;

	// Generate time slots for header (every 30 min)
	const timeSlots: { time: Date; label: string }[] = [];
	let currentSlot = new Date(scheduleStart);
	while (currentSlot < scheduleEnd) {
		timeSlots.push({
			time: new Date(currentSlot),
			label: format(currentSlot, "HH:mm"),
		});
		currentSlot = new Date(currentSlot.getTime() + 30 * 60 * 1000);
	}

	// Get station assignments for a group in a time block
	const getAssignmentForGroup = (blockId: string, groupId: string) => {
		const block = timeBlocks.find((b) => b.id === blockId);
		if (!block || !block.assignments) return null;
		const assignment = block.assignments.find((a) => a.groupId === groupId);
		return assignment?.station || null;
	};

	// Get blocks that are breaks or activities (full-width)
	const getBreaksAndActivities = () => {
		return timeBlocks.filter(
			(b) =>
				b.blockType === EventTimeBlockType.break ||
				b.blockType === EventTimeBlockType.generalActivity,
		);
	};

	// Get rotation blocks
	const getRotationBlocks = () => {
		return timeBlocks.filter(
			(b) => b.blockType === EventTimeBlockType.stationRotation,
		);
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Timeline de Rotaciones</CardTitle>
					<CardDescription>
						{format(new Date(schedule.scheduleDate), "PPPP", { locale: es })}
					</CardDescription>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => setPixelsPerMinute((p) => Math.max(1, p - 1))}
						disabled={pixelsPerMinute <= 1}
					>
						<ZoomOut className="size-4" />
					</Button>
					<span className="text-sm text-muted-foreground">
						{pixelsPerMinute}x
					</span>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setPixelsPerMinute((p) => Math.min(10, p + 1))}
						disabled={pixelsPerMinute >= 10}
					>
						<ZoomIn className="size-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<ScrollArea className="w-full">
					<div className="relative" style={{ minWidth: totalWidth + 150 }}>
						{/* Time Header */}
						<div className="sticky top-0 z-20 flex border-b bg-background">
							<div className="w-32 shrink-0 border-r px-2 py-1 font-medium">
								Grupo
							</div>
							<div className="flex" style={{ width: totalWidth }}>
								{timeSlots.map((slot, index) => (
									<div
										key={index}
										className="border-l px-1 text-xs text-muted-foreground"
										style={{ width: 30 * pixelsPerMinute }}
									>
										{slot.label}
									</div>
								))}
							</div>
						</div>

						{/* Break/Activity Overlay */}
						{getBreaksAndActivities().map((block) => {
							const startOffset =
								differenceInMinutes(new Date(block.startTime), scheduleStart) *
								pixelsPerMinute;
							const width = block.durationMinutes * pixelsPerMinute;
							const isBreak = block.blockType === EventTimeBlockType.break;
							const zoneName = block.zone?.name;

							return (
								<div
									key={block.id}
									className={cn(
										"absolute z-10 flex flex-col items-center justify-center border-y text-xs font-medium",
										isBreak
											? "bg-gray-100/80 text-gray-600"
											: "bg-amber-100/80 text-amber-700",
									)}
									style={{
										left: 128 + startOffset,
										width,
										top: 33, // Below header
										height: groups.length * 56, // Full height
									}}
								>
									<div className="whitespace-nowrap">
										{block.name || (isBreak ? "Break" : "Actividad")}
									</div>
									{zoneName && (
										<div className="text-[10px] opacity-75 whitespace-nowrap">
											📍 {zoneName}
										</div>
									)}
								</div>
							);
						})}

						{/* Group Rows */}
						<TooltipProvider>
							{groups.map((group) => (
								<div
									key={group.id}
									className="flex border-b"
									style={{ height: 56 }}
								>
									{/* Group Label */}
									<div
										className="flex w-32 shrink-0 items-center gap-2 border-r px-2"
										style={{ borderLeftColor: group.color, borderLeftWidth: 4 }}
									>
										<div
											className="size-3 shrink-0 rounded-full"
											style={{ backgroundColor: group.color }}
										/>
										<span className="truncate text-sm font-medium">
											{group.name}
										</span>
									</div>

									{/* Time Blocks for this group */}
									<div
										className="relative flex-1"
										style={{ width: totalWidth }}
									>
										{getRotationBlocks().map((block) => {
											const station = getAssignmentForGroup(block.id, group.id);
											if (!station) return null;

											const startOffset =
												differenceInMinutes(
													new Date(block.startTime),
													scheduleStart,
												) * pixelsPerMinute;
											const width = block.durationMinutes * pixelsPerMinute;

											return (
												<Tooltip key={block.id}>
													<TooltipTrigger asChild>
														<div
															className="absolute top-2 flex h-10 cursor-pointer items-center justify-center rounded-md px-2 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90"
															style={{
																left: startOffset,
																width: Math.max(width - 4, 20),
																backgroundColor: station.color,
															}}
														>
															<span className="truncate">{station.name}</span>
														</div>
													</TooltipTrigger>
													<TooltipContent>
														<div className="space-y-1">
															<p className="font-medium">{station.name}</p>
															<p className="text-xs">
																{format(new Date(block.startTime), "HH:mm")} -{" "}
																{format(new Date(block.endTime), "HH:mm")}
															</p>
															<p className="text-xs text-muted-foreground">
																{block.durationMinutes} minutos
															</p>
														</div>
													</TooltipContent>
												</Tooltip>
											);
										})}
									</div>
								</div>
							))}
						</TooltipProvider>

						{/* Legend */}
						<div className="mt-4 flex flex-wrap gap-4 border-t pt-4">
							<div className="text-sm font-medium">Estaciones:</div>
							{stations.map((station) => (
								<div key={station.id} className="flex items-center gap-2">
									<div
										className="size-3 rounded-full"
										style={{ backgroundColor: station.color }}
									/>
									<span className="text-sm">{station.name}</span>
								</div>
							))}
							<div className="flex items-center gap-2">
								<div className="size-3 rounded-full bg-gray-300" />
								<span className="text-sm">Break</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="size-3 rounded-full bg-amber-300" />
								<span className="text-sm">Actividad General</span>
							</div>
						</div>
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
