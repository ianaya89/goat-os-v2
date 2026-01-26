"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Grid3x3 } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { EventTimeBlockType } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface EventRotationMatrixProps {
	eventId: string;
}

export function EventRotationMatrix({
	eventId,
}: EventRotationMatrixProps): React.JSX.Element {
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
					<Grid3x3 className="mb-4 size-12 text-muted-foreground" />
					<h3 className="text-lg font-medium">No hay cronograma</h3>
					<p className="text-sm text-muted-foreground">
						Genera un cronograma primero en la pestana de Configuracion
					</p>
				</CardContent>
			</Card>
		);
	}

	const timeBlocks = schedule.timeBlocks || [];

	// Get only rotation blocks (exclude breaks and activities)
	const rotationBlocks = timeBlocks
		.filter((b) => b.blockType === EventTimeBlockType.stationRotation)
		.sort((a, b) => a.blockOrder - b.blockOrder);

	// Get break/activity blocks
	const interruptionBlocks = timeBlocks
		.filter(
			(b) =>
				b.blockType === EventTimeBlockType.break ||
				b.blockType === EventTimeBlockType.generalActivity,
		)
		.sort((a, b) => a.blockOrder - b.blockOrder);

	// Get station for a group in a time block
	const getStationForGroup = (blockId: string, groupId: string) => {
		const block = timeBlocks.find((b) => b.id === blockId);
		if (!block || !block.assignments) return null;
		const assignment = block.assignments.find((a) => a.groupId === groupId);
		return assignment?.station || null;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Matriz de Rotaciones</CardTitle>
				<CardDescription>
					Vista tabular de asignaciones grupo-estacion por rotacion
				</CardDescription>
			</CardHeader>
			<CardContent>
				{/* Interruptions summary */}
				{interruptionBlocks.length > 0 && (
					<div className="mb-4 rounded-lg bg-muted p-3">
						<p className="mb-2 text-sm font-medium">
							Pausas y Actividades Generales:
						</p>
						<div className="flex flex-wrap gap-2">
							{interruptionBlocks.map((block) => (
								<Badge
									key={block.id}
									variant="outline"
									className={cn(
										block.blockType === EventTimeBlockType.break
											? "bg-gray-100"
											: "bg-amber-100",
									)}
								>
									{block.name || "Sin nombre"} (
									{format(new Date(block.startTime), "HH:mm")} -{" "}
									{format(new Date(block.endTime), "HH:mm")})
								</Badge>
							))}
						</div>
					</div>
				)}

				<ScrollArea className="w-full">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="sticky left-0 z-10 w-32 bg-background">
									Grupo
								</TableHead>
								{rotationBlocks.map((block, index) => (
									<TableHead key={block.id} className="min-w-36 text-center">
										<div className="space-y-1">
											<div className="font-medium">
												Rotacion {block.rotationNumber || index + 1}
											</div>
											<div className="text-xs font-normal text-muted-foreground">
												{format(new Date(block.startTime), "HH:mm")} -{" "}
												{format(new Date(block.endTime), "HH:mm")}
											</div>
										</div>
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{groups.map((group) => (
								<TableRow key={group.id}>
									<TableCell
										className="sticky left-0 z-10 bg-background font-medium"
										style={{
											borderLeftColor: group.color,
											borderLeftWidth: 4,
										}}
									>
										<div className="flex items-center gap-2">
											<div
												className="size-3 rounded-full"
												style={{ backgroundColor: group.color }}
											/>
											{group.name}
										</div>
									</TableCell>
									{rotationBlocks.map((block) => {
										const station = getStationForGroup(block.id, group.id);
										return (
											<TableCell key={block.id} className="text-center">
												{station ? (
													<Badge
														className="text-white"
														style={{ backgroundColor: station.color }}
													>
														{station.name}
													</Badge>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>
										);
									})}
								</TableRow>
							))}
						</TableBody>
					</Table>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>

				{/* Station Legend */}
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
				</div>

				{/* Stats */}
				<div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-3">
					<div>
						<p className="text-sm text-muted-foreground">Total Rotaciones</p>
						<p className="text-lg font-bold">{rotationBlocks.length}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Duracion Total</p>
						<p className="text-lg font-bold">
							{rotationBlocks.reduce((acc, b) => acc + b.durationMinutes, 0)}{" "}
							min
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Tiempo por Estacion</p>
						<p className="text-lg font-bold">
							{schedule.defaultRotationDuration} min
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
