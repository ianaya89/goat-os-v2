"use client";

import {
	AlertTriangle,
	Box,
	CheckSquare,
	Clock,
	DollarSign,
	FileText,
	LayoutGrid,
	LineChart,
	MapPin,
	MessageSquare,
	Sparkles,
	Truck,
	Users,
} from "lucide-react";
import type * as React from "react";
import { EventBudgetTab } from "@/components/organization/event-organization/event-budget-tab";
import { EventChecklistsTab } from "@/components/organization/event-organization/event-checklists-tab";
import { EventDocumentsTab } from "@/components/organization/event-organization/event-documents-tab";
import { EventInventoryTab } from "@/components/organization/event-organization/event-inventory-tab";
import { EventNotesTab } from "@/components/organization/event-organization/event-notes-tab";
import { EventProjectionTab } from "@/components/organization/event-organization/event-projection-tab";
import { EventRisksTab } from "@/components/organization/event-organization/event-risks-tab";
import { EventSponsorsTab } from "@/components/organization/event-organization/event-sponsors-tab";
import { EventStaffTab } from "@/components/organization/event-organization/event-staff-tab";
import { EventTasksTab } from "@/components/organization/event-organization/event-tasks-tab";
import { EventTimelineTab } from "@/components/organization/event-organization/event-timeline-tab";
import { EventVendorsTab } from "@/components/organization/event-organization/event-vendors-tab";
import { EventZonesTab } from "@/components/organization/event-organization/event-zones-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface EventOrganizationProps {
	eventId: string;
}

const tabs = [
	{ id: "checklists", label: "Checklists", icon: CheckSquare },
	{ id: "tasks", label: "Tareas", icon: LayoutGrid },
	{ id: "staff", label: "Staff", icon: Users },
	{ id: "budget", label: "Presupuesto", icon: DollarSign },
	{ id: "projection", label: "Proyección", icon: LineChart },
	{ id: "sponsors", label: "Sponsors", icon: Sparkles },
	{ id: "timeline", label: "Timeline", icon: Clock },
	{ id: "documents", label: "Documentos", icon: FileText },
	{ id: "notes", label: "Notas", icon: MessageSquare },
	{ id: "inventory", label: "Inventario", icon: Box },
	{ id: "vendors", label: "Proveedores", icon: Truck },
	{ id: "zones", label: "Zonas", icon: MapPin },
	{ id: "risks", label: "Riesgos", icon: AlertTriangle },
] as const;

export function EventOrganization({
	eventId,
}: EventOrganizationProps): React.JSX.Element {
	return (
		<Tabs defaultValue="checklists" className="space-y-4">
			<TabsList className="flex-wrap h-auto gap-1 p-1">
				{tabs.map((tab) => (
					<TabsTrigger
						key={tab.id}
						value={tab.id}
						className={cn(
							"gap-1.5 text-xs px-2.5 py-1.5",
							"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
						)}
					>
						<tab.icon className="size-3.5" />
						{tab.label}
					</TabsTrigger>
				))}
			</TabsList>

			<TabsContent value="checklists">
				<EventChecklistsTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="tasks">
				<EventTasksTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="staff">
				<EventStaffTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="budget">
				<EventBudgetTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="projection">
				<EventProjectionTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="sponsors">
				<EventSponsorsTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="timeline">
				<EventTimelineTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="documents">
				<EventDocumentsTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="notes">
				<EventNotesTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="inventory">
				<EventInventoryTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="vendors">
				<EventVendorsTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="zones">
				<EventZonesTab eventId={eventId} />
			</TabsContent>

			<TabsContent value="risks">
				<EventRisksTab eventId={eventId} />
			</TabsContent>
		</Tabs>
	);
}
