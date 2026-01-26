"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { trpc } from "@/trpc/client";

export function PendingEventPaymentsTable(): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getPendingEventRegistrations.useQuery({
			limit: 10,
			offset: 0,
		});

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount / 100);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<CalendarIcon className="h-5 w-5 text-purple-600" />
							Inscripciones a Eventos Pendientes
						</CardTitle>
						<CardDescription>
							{data?.total ?? 0} inscripciones por pagar - Total:{" "}
							{formatAmount(data?.totalOutstandingAmount ?? 0)}
						</CardDescription>
					</div>
					{(data?.total ?? 0) > 10 && (
						<Button variant="outline" size="sm" asChild>
							<a href="/dashboard/organization/events?status=pending">
								Ver todos
							</a>
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{(data?.registrations.length ?? 0) === 0 ? (
					<div className="flex h-[200px] items-center justify-center text-muted-foreground">
						No hay inscripciones pendientes de pago
					</div>
				) : (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Atleta</TableHead>
									<TableHead>Evento</TableHead>
									<TableHead>Fecha Evento</TableHead>
									<TableHead className="text-right">Precio</TableHead>
									<TableHead className="text-right">Pagado</TableHead>
									<TableHead className="text-right">Pendiente</TableHead>
									<TableHead>Registrado</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.registrations.map((registration) => {
									const outstanding =
										registration.price - registration.paidAmount;
									return (
										<TableRow key={registration.id}>
											<TableCell>
												<div className="font-medium">
													{registration.athleteName}
												</div>
												<div className="text-xs text-muted-foreground">
													{registration.athleteEmail}
												</div>
											</TableCell>
											<TableCell>
												<div className="font-medium">
													{registration.eventTitle}
												</div>
												{registration.eventType && (
													<Badge variant="outline" className="mt-1 text-xs">
														{registration.eventType}
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{registration.eventDate
													? format(
															new Date(registration.eventDate),
															"dd MMM yyyy",
															{ locale: es },
														)
													: "-"}
											</TableCell>
											<TableCell className="text-right">
												{formatAmount(registration.price)}
											</TableCell>
											<TableCell className="text-right text-green-600">
												{formatAmount(registration.paidAmount)}
											</TableCell>
											<TableCell className="text-right">
												<Badge variant="outline" className="text-purple-600">
													{formatAmount(outstanding)}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{format(
													new Date(registration.createdAt),
													"dd MMM yyyy",
													{ locale: es },
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
