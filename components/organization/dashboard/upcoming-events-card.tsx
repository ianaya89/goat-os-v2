"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, MapPinIcon, TrophyIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const eventTypeLabels: Record<string, string> = {
	competition: "Competencia",
	tournament: "Torneo",
	exhibition: "Exhibicion",
	training_camp: "Campus",
	workshop: "Taller",
	social: "Social",
	other: "Otro",
};

const statusColors: Record<string, string> = {
	draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	published: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	open: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	registration_closed:
		"bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

export function UpcomingEventsCard(): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.dashboard.getUpcomingEvents.useQuery();

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-40 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Proximos Eventos</CardTitle>
					<CardDescription>No hay datos disponibles</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<TrophyIcon className="size-5 text-yellow-500" />
							Proximos Eventos
						</CardTitle>
						<CardDescription>Eventos en los proximos 30 dias</CardDescription>
					</div>
					{data.totalCount > 0 && (
						<Badge variant="secondary">{data.totalCount} eventos</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{data.events.length > 0 ? (
					<div className="space-y-3">
						{data.events.map((event) => {
							const occupancy =
								event.maxCapacity && event.maxCapacity > 0
									? (event.currentRegistrations / event.maxCapacity) * 100
									: 0;

							return (
								<Link
									key={event.id}
									href={`/dashboard/organization/events/${event.id}`}
									className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<p className="font-medium text-sm truncate">
												{event.title}
											</p>
											<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
												<CalendarIcon className="size-3" />
												<span>
													{format(new Date(event.startDate), "d MMM", {
														locale: es,
													})}
												</span>
												{event.location && (
													<>
														<span>|</span>
														<MapPinIcon className="size-3" />
														<span className="truncate">
															{event.location.name}
														</span>
													</>
												)}
											</div>
										</div>
										<Badge
											variant="outline"
											className={cn(
												"text-xs shrink-0",
												statusColors[event.status] ?? "",
											)}
										>
											{eventTypeLabels[event.eventType] ?? event.eventType}
										</Badge>
									</div>

									{event.maxCapacity && event.maxCapacity > 0 && (
										<div className="mt-2">
											<div className="flex items-center justify-between text-xs mb-1">
												<span className="flex items-center gap-1 text-muted-foreground">
													<UsersIcon className="size-3" />
													{event.currentRegistrations}/{event.maxCapacity}
												</span>
												<span className="text-muted-foreground">
													{Math.round(occupancy)}%
												</span>
											</div>
											<Progress value={occupancy} className="h-1.5" />
										</div>
									)}
								</Link>
							);
						})}

						{data.totalCount > 5 && (
							<Button variant="ghost" size="sm" asChild className="w-full">
								<Link href="/dashboard/organization/events">
									Ver todos ({data.totalCount} eventos)
								</Link>
							</Button>
						)}
					</div>
				) : (
					<div className="flex flex-col items-center py-6 text-center">
						<TrophyIcon className="size-10 text-muted-foreground/50 mb-2" />
						<p className="text-muted-foreground text-sm">
							No hay eventos programados
						</p>
						<Button variant="link" size="sm" asChild className="mt-2">
							<Link href="/dashboard/organization/events/new">
								Crear evento
							</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
