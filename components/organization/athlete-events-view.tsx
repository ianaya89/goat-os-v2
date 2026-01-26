"use client";

import { format } from "date-fns";
import {
	CalendarDaysIcon,
	CheckCircleIcon,
	ClockIcon,
	MapPinIcon,
	XCircleIcon,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export function AthleteEventsView() {
	const { data, isLoading } =
		trpc.organization.sportsEvent.listMyEvents.useQuery();

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-64" />
				))}
			</div>
		);
	}

	const registrations = data?.registrations ?? [];

	if (registrations.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<CalendarDaysIcon className="size-12 text-muted-foreground/50" />
					<h3 className="mt-4 font-semibold text-lg">
						Sin eventos registrados
					</h3>
					<p className="mt-2 text-center text-muted-foreground">
						Aun no te has registrado a ningun evento.
					</p>
				</CardContent>
			</Card>
		);
	}

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "confirmed":
				return (
					<Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
						<CheckCircleIcon className="mr-1 size-3" />
						Confirmado
					</Badge>
				);
			case "pending":
				return (
					<Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
						<ClockIcon className="mr-1 size-3" />
						Pendiente
					</Badge>
				);
			case "waitlist":
				return (
					<Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
						<ClockIcon className="mr-1 size-3" />
						Lista de Espera
					</Badge>
				);
			case "cancelled":
				return (
					<Badge className="bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
						<XCircleIcon className="mr-1 size-3" />
						Cancelado
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{registrations.map((registration) => (
				<Card key={registration.id} className="flex flex-col overflow-hidden">
					{/* Cover Image */}
					{registration.event?.coverImageUrl ? (
						<div className="relative h-32 w-full">
							<img
								src={registration.event.coverImageUrl}
								alt={registration.event.title}
								className="h-full w-full object-cover"
							/>
							<div className="absolute right-2 top-2">
								{getStatusBadge(registration.status)}
							</div>
						</div>
					) : (
						<div className="relative flex h-32 w-full items-center justify-center bg-gradient-to-r from-primary/20 to-primary/10">
							<CalendarDaysIcon className="size-12 text-primary/50" />
							<div className="absolute right-2 top-2">
								{getStatusBadge(registration.status)}
							</div>
						</div>
					)}

					<CardHeader className="pb-2">
						<CardTitle className="text-lg">
							{registration.event?.title ?? "Evento"}
						</CardTitle>
						{registration.event?.description && (
							<CardDescription className="line-clamp-2">
								{registration.event.description}
							</CardDescription>
						)}
					</CardHeader>

					<CardContent className="flex-1 space-y-3">
						{/* Date */}
						{registration.event?.startDate && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<CalendarDaysIcon className="size-4" />
								<span>
									{format(
										new Date(registration.event.startDate),
										"dd MMM yyyy",
									)}
									{registration.event.endDate && (
										<>
											{" "}
											-{" "}
											{format(
												new Date(registration.event.endDate),
												"dd MMM yyyy",
											)}
										</>
									)}
								</span>
							</div>
						)}

						{/* Location */}
						{registration.event?.venueDetails && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<MapPinIcon className="size-4" />
								<span>{registration.event.venueDetails}</span>
							</div>
						)}

						{/* Age Category */}
						{registration.ageCategory && (
							<Badge variant="outline">{registration.ageCategory.name}</Badge>
						)}

						{/* Registration Date */}
						<div className="pt-2 text-muted-foreground text-xs">
							Registrado el{" "}
							{format(new Date(registration.createdAt), "dd/MM/yyyy")}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
