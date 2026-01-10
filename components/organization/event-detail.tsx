"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	Calendar,
	Clock,
	Copy,
	Edit,
	Mail,
	MapPin,
	MoreHorizontal,
	Phone,
	Trash2,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { EventPaymentsTable } from "@/components/organization/event-payments-table";
import { EventPricingConfig } from "@/components/organization/event-pricing-config";
import { EventRegistrationsTable } from "@/components/organization/event-registrations-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EventStatus, EventType } from "@/lib/db/schema/enums";
import {
	formatEventCapacity,
	formatEventDateRange,
	formatEventPrice,
	getCapacityPercentage,
	getEventStatusColor,
	getEventStatusLabel,
	getEventTypeColor,
	getEventTypeIcon,
	getEventTypeLabel,
} from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface EventDetailProps {
	eventId: string;
}

export function EventDetail({ eventId }: EventDetailProps): React.JSX.Element {
	const router = useRouter();
	const utils = trpc.useUtils();

	const { data, isPending, error } = trpc.organization.sportsEvent.get.useQuery(
		{ id: eventId },
		{ retry: false },
	);

	const deleteEventMutation = trpc.organization.sportsEvent.delete.useMutation({
		onSuccess: () => {
			toast.success("Evento eliminado");
			utils.organization.sportsEvent.list.invalidate();
			router.push("/dashboard/organization/events");
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message || "Error al eliminar el evento");
		},
	});

	const duplicateEventMutation = trpc.organization.sportsEvent.duplicate.useMutation({
		onSuccess: (result) => {
			toast.success("Evento duplicado");
			utils.organization.sportsEvent.list.invalidate();
			router.push(`/dashboard/organization/events/${result.id}`);
		},
		onError: (error: { message?: string }) => {
			toast.error(error.message || "Error al duplicar el evento");
		},
	});

	if (isPending) {
		return <EventDetailSkeleton />;
	}

	if (error || !data) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted-foreground">Evento no encontrado</p>
				<Button
					variant="link"
					onClick={() => router.push("/dashboard/organization/events")}
				>
					Volver a eventos
				</Button>
			</div>
		);
	}

	const event = data;
	const TypeIcon = getEventTypeIcon(event.eventType as EventType);
	const capacityPercentage = getCapacityPercentage(
		event.currentRegistrations,
		event.maxCapacity,
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<TypeIcon className="size-5 text-muted-foreground" />
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
					<h1 className="text-2xl font-bold">{event.title}</h1>
					{event.description && (
						<p className="text-muted-foreground max-w-2xl">
							{event.description}
						</p>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" asChild>
						<Link href={`/dashboard/organization/events/${eventId}/edit`}>
							<Edit className="size-4" />
							Editar
						</Link>
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon">
								<MoreHorizontal className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									const now = new Date();
									const newTitle = `${event.title} (Copia)`;
									const newSlug = `${event.slug}-copia-${now.getTime()}`;
									NiceModal.show(ConfirmationModal, {
										title: "¿Duplicar evento?",
										message:
											"Se creará una copia del evento con las mismas configuraciones.",
										confirmLabel: "Duplicar",
										onConfirm: () =>
											duplicateEventMutation.mutate({
												id: eventId,
												newTitle,
												newSlug,
												newStartDate: event.startDate,
												newEndDate: event.endDate,
											}),
									});
								}}
							>
								<Copy className="size-4" />
								Duplicar
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "¿Eliminar evento?",
										message:
											"Esta acción no se puede deshacer y eliminará todas las inscripciones.",
										confirmLabel: "Eliminar",
										destructive: true,
										onConfirm: () =>
											deleteEventMutation.mutate({ id: eventId }),
									});
								}}
								variant="destructive"
							>
								<Trash2 className="size-4" />
								Eliminar
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Fechas</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<Calendar className="size-4 text-muted-foreground" />
							<span className="font-medium">
								{formatEventDateRange(event.startDate, event.endDate)}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Capacidad</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Users className="size-4 text-muted-foreground" />
								<span className="font-medium">
									{formatEventCapacity(
										event.currentRegistrations,
										event.maxCapacity,
									)}
								</span>
							</div>
							{event.maxCapacity && (
								<Progress value={capacityPercentage} className="h-2" />
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Inscripciones</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<Clock className="size-4 text-muted-foreground" />
							<span className="font-medium">
								{event.registrationOpenDate
									? `Desde ${format(event.registrationOpenDate, "dd MMM")}`
									: "Abiertas"}
								{event.registrationCloseDate
									? ` hasta ${format(event.registrationCloseDate, "dd MMM")}`
									: ""}
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Moneda</CardDescription>
					</CardHeader>
					<CardContent>
						<span className="font-medium">{event.currency}</span>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Resumen</TabsTrigger>
					<TabsTrigger value="registrations">Inscripciones</TabsTrigger>
					<TabsTrigger value="payments">Pagos</TabsTrigger>
					<TabsTrigger value="pricing">Precios</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Event Details */}
						<Card>
							<CardHeader>
								<CardTitle>Detalles del Evento</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{event.location && (
									<div className="flex items-start gap-3">
										<MapPin className="size-4 text-muted-foreground mt-0.5" />
										<div>
											<p className="font-medium">{event.location.name}</p>
											{event.location.address && (
												<p className="text-sm text-muted-foreground">
													{event.location.address}
												</p>
											)}
										</div>
									</div>
								)}
								{event.venueDetails && (
									<div className="flex items-start gap-3">
										<MapPin className="size-4 text-muted-foreground mt-0.5" />
										<p className="text-sm">{event.venueDetails}</p>
									</div>
								)}
								{event.contactEmail && (
									<div className="flex items-center gap-3">
										<Mail className="size-4 text-muted-foreground" />
										<a
											href={`mailto:${event.contactEmail}`}
											className="text-sm hover:underline"
										>
											{event.contactEmail}
										</a>
									</div>
								)}
								{event.contactPhone && (
									<div className="flex items-center gap-3">
										<Phone className="size-4 text-muted-foreground" />
										<a
											href={`tel:${event.contactPhone}`}
											className="text-sm hover:underline"
										>
											{event.contactPhone}
										</a>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Registration Options */}
						<Card>
							<CardHeader>
								<CardTitle>Opciones de Inscripción</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm">Inscripción pública</span>
									<Badge variant={event.allowPublicRegistration ? "default" : "secondary"}>
										{event.allowPublicRegistration ? "Sí" : "No"}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Lista de espera</span>
									<Badge variant={event.enableWaitlist ? "default" : "secondary"}>
										{event.enableWaitlist ? "Sí" : "No"}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Requiere aprobación</span>
									<Badge variant={event.requiresApproval ? "default" : "secondary"}>
										{event.requiresApproval ? "Sí" : "No"}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Acceso anticipado</span>
									<Badge variant={event.allowEarlyAccessForMembers ? "default" : "secondary"}>
										{event.allowEarlyAccessForMembers
											? `${event.memberEarlyAccessDays} días`
											: "No"}
									</Badge>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="registrations">
					<Card>
						<CardHeader>
							<CardTitle>Inscripciones</CardTitle>
							<CardDescription>
								Lista de atletas inscritos al evento
							</CardDescription>
						</CardHeader>
						<CardContent>
							<EventRegistrationsTable eventId={eventId} />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="payments">
					<Card>
						<CardHeader>
							<CardTitle>Pagos</CardTitle>
							<CardDescription>
								Gestiona los pagos de las inscripciones
							</CardDescription>
						</CardHeader>
						<CardContent>
							<EventPaymentsTable eventId={eventId} />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="pricing">
					<EventPricingConfig eventId={eventId} currency={event.currency} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function EventDetailSkeleton(): React.JSX.Element {
	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-20" />
						<Skeleton className="h-5 w-24" />
					</div>
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-10" />
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<Skeleton className="h-4 w-16" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-6 w-24" />
						</CardContent>
					</Card>
				))}
			</div>

			<Skeleton className="h-10 w-64" />
			<Skeleton className="h-64 w-full" />
		</div>
	);
}
