"use client";

import {
	Calendar,
	Coffee,
	Grid3x3,
	LayoutGrid,
	Loader2,
	MapPin,
	Plus,
	RefreshCw,
	Settings,
	Users,
} from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { EventBreaksManager } from "./event-breaks-manager";
import { EventGroupsPanel } from "./event-groups-panel";
import { EventRotationMatrix } from "./event-rotation-matrix";
import { EventRotationTimeline } from "./event-rotation-timeline";
import { EventScheduleConfig } from "./event-schedule-config";
import { EventStationsPanel } from "./event-stations-panel";

interface EventRotationTabProps {
	eventId: string;
}

export function EventRotationTab({
	eventId,
}: EventRotationTabProps): React.JSX.Element {
	const { data, isPending } =
		trpc.organization.eventRotation.getOverview.useQuery({ eventId });

	if (isPending) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	const { groups = [], stations = [], schedule } = data || {};

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Grupos</CardTitle>
						<Users className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{groups.length}</div>
						<p className="text-xs text-muted-foreground">
							{groups.reduce((acc, g) => acc + g.members.length, 0)} atletas
							asignados
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Estaciones</CardTitle>
						<MapPin className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stations.length}</div>
						<p className="text-xs text-muted-foreground">
							{stations.filter((s) => s.staff && s.staff.length > 0).length} con
							staff
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Rotaciones</CardTitle>
						<RefreshCw className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{schedule?.totalRotations || 0}
						</div>
						<p className="text-xs text-muted-foreground">
							{schedule?.defaultRotationDuration || 30} min cada una
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Estado</CardTitle>
						<Calendar className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<Badge
							variant={schedule?.isPublished ? "default" : "secondary"}
							className="text-xs"
						>
							{schedule?.isPublished ? "Publicado" : "Borrador"}
						</Badge>
						{schedule?.isLocked && (
							<Badge variant="outline" className="ml-2 text-xs">
								Bloqueado
							</Badge>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Sub-tabs */}
			<Tabs defaultValue="config" className="space-y-4">
				<TabsList>
					<TabsTrigger value="config" className="gap-2">
						<Settings className="size-4" />
						Configuracion
					</TabsTrigger>
					<TabsTrigger value="groups" className="gap-2">
						<Users className="size-4" />
						Grupos
					</TabsTrigger>
					<TabsTrigger value="stations" className="gap-2">
						<MapPin className="size-4" />
						Estaciones
					</TabsTrigger>
					<TabsTrigger value="breaks" className="gap-2">
						<Coffee className="size-4" />
						Breaks
					</TabsTrigger>
					<TabsTrigger value="timeline" className="gap-2">
						<LayoutGrid className="size-4" />
						Timeline
					</TabsTrigger>
					<TabsTrigger value="matrix" className="gap-2">
						<Grid3x3 className="size-4" />
						Matriz
					</TabsTrigger>
				</TabsList>

				<TabsContent value="config">
					<EventScheduleConfig eventId={eventId} />
				</TabsContent>

				<TabsContent value="groups">
					<EventGroupsPanel eventId={eventId} />
				</TabsContent>

				<TabsContent value="stations">
					<EventStationsPanel eventId={eventId} />
				</TabsContent>

				<TabsContent value="breaks">
					<EventBreaksManager eventId={eventId} />
				</TabsContent>

				<TabsContent value="timeline">
					<EventRotationTimeline eventId={eventId} />
				</TabsContent>

				<TabsContent value="matrix">
					<EventRotationMatrix eventId={eventId} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
