"use client";

import {
	AlertTriangle,
	ArrowLeft,
	Box,
	CheckSquare,
	Clock,
	DollarSign,
	FileText,
	LayoutGrid,
	MapPin,
	MessageSquare,
	RefreshCw,
	Sparkles,
	TrendingUp,
	Truck,
	Users,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { EventBudgetTab } from "@/components/organization/event-organization/event-budget-tab";
import { EventChecklistsTab } from "@/components/organization/event-organization/event-checklists-tab";
import { EventDocumentsTab } from "@/components/organization/event-organization/event-documents-tab";
import { EventInventoryTab } from "@/components/organization/event-organization/event-inventory-tab";
import { EventNotesTab } from "@/components/organization/event-organization/event-notes-tab";
import { EventProjectionTab } from "@/components/organization/event-organization/event-projection-tab";
import { EventRisksTab } from "@/components/organization/event-organization/event-risks-tab";
import { EventRotationTab } from "@/components/organization/event-organization/event-rotation-tab";
import { EventSponsorsTab } from "@/components/organization/event-organization/event-sponsors-tab";
import { EventStaffTab } from "@/components/organization/event-organization/event-staff-tab";
import { EventTasksTab } from "@/components/organization/event-organization/event-tasks-tab";
import { EventTimelineTab } from "@/components/organization/event-organization/event-timeline-tab";
import { EventVendorsTab } from "@/components/organization/event-organization/event-vendors-tab";
import { EventZonesTab } from "@/components/organization/event-organization/event-zones-tab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EventStatus, EventType } from "@/lib/db/schema/enums";
import {
	getEventStatusColor,
	getEventStatusLabel,
	getEventTypeColor,
	getEventTypeIcon,
	getEventTypeLabel,
} from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface EventOrganizationPageProps {
	eventId: string;
}

const tabs = [
	{ id: "rotation", label: "Rotaciones", icon: RefreshCw },
	{ id: "checklists", label: "Checklists", icon: CheckSquare },
	{ id: "tasks", label: "Tareas", icon: LayoutGrid },
	{ id: "staff", label: "Staff", icon: Users },
	{ id: "budget", label: "Presupuesto", icon: DollarSign },
	{ id: "projection", label: "Proyección", icon: TrendingUp },
	{ id: "sponsors", label: "Sponsors", icon: Sparkles },
	{ id: "timeline", label: "Timeline", icon: Clock },
	{ id: "documents", label: "Documentos", icon: FileText },
	{ id: "notes", label: "Notas", icon: MessageSquare },
	{ id: "inventory", label: "Inventario", icon: Box },
	{ id: "vendors", label: "Proveedores", icon: Truck },
	{ id: "zones", label: "Zonas", icon: MapPin },
	{ id: "risks", label: "Riesgos", icon: AlertTriangle },
] as const;

export function EventOrganizationPage({
	eventId,
}: EventOrganizationPageProps): React.JSX.Element {
	const { data: event, isPending } = trpc.organization.sportsEvent.get.useQuery(
		{ id: eventId },
		{ retry: false },
	);

	if (isPending) {
		return (
			<div className="space-y-6 p-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-10" />
					<div className="space-y-2">
						<Skeleton className="h-6 w-64" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<Skeleton className="h-12 w-full" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!event) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted-foreground">Evento no encontrado</p>
				<Button variant="link" asChild>
					<Link href="/dashboard/organization/events">Volver a eventos</Link>
				</Button>
			</div>
		);
	}

	const TypeIcon = getEventTypeIcon(event.eventType as EventType);

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-start gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href={`/dashboard/organization/events/${eventId}`}>
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<TypeIcon className="size-5 text-muted-foreground" />
							<h1 className="text-xl font-semibold">{event.title}</h1>
							<Badge
								className={cn(
									"border-none px-2 py-0.5 font-medium text-xs shadow-none",
									getEventTypeColor(event.eventType as EventType),
								)}
								variant="outline"
							>
								{getEventTypeLabel(event.eventType as EventType)}
							</Badge>
							<Badge
								className={cn(
									"border-none px-2 py-0.5 font-medium text-xs shadow-none",
									getEventStatusColor(event.status as EventStatus),
								)}
								variant="outline"
							>
								{getEventStatusLabel(event.status as EventStatus)}
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground">
							Gestiona la organización y logística del evento
						</p>
					</div>
				</div>
			</div>

			{/* Tabs - Full width layout */}
			<Tabs defaultValue="rotation" className="space-y-6">
				<TabsList className="w-full justify-start gap-1 p-1 h-auto flex-wrap">
					{tabs.map((tab) => (
						<TabsTrigger
							key={tab.id}
							value={tab.id}
							className={cn(
								"gap-2 px-4 py-2",
								"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
							)}
						>
							<tab.icon className="size-4" />
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="rotation" className="mt-6">
					<EventRotationTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="checklists" className="mt-6">
					<EventChecklistsTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="tasks" className="mt-6">
					<EventTasksTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="staff" className="mt-6">
					<EventStaffTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="budget" className="mt-6">
					<EventBudgetTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="projection" className="mt-6">
					<EventProjectionTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="sponsors" className="mt-6">
					<EventSponsorsTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="timeline" className="mt-6">
					<EventTimelineTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="documents" className="mt-6">
					<EventDocumentsTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="notes" className="mt-6">
					<EventNotesTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="inventory" className="mt-6">
					<EventInventoryTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="vendors" className="mt-6">
					<EventVendorsTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="zones" className="mt-6">
					<EventZonesTab eventId={eventId} />
				</TabsContent>

				<TabsContent value="risks" className="mt-6">
					<EventRisksTab eventId={eventId} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
