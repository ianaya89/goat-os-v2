"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClockIcon } from "lucide-react";
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

export function OutstandingPaymentsTable(): React.JSX.Element {
	const { data, isLoading } =
		trpc.organization.reports.getOutstandingPayments.useQuery({
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
							<ClockIcon className="h-5 w-5 text-yellow-600" />
							Pagos Pendientes
						</CardTitle>
						<CardDescription>
							{data?.total ?? 0} pagos por cobrar - Total:{" "}
							{formatAmount(data?.totalOutstandingAmount ?? 0)}
						</CardDescription>
					</div>
					{(data?.total ?? 0) > 10 && (
						<Button variant="outline" size="sm" asChild>
							<a href="/dashboard/organization/payments?status=pending">
								Ver todos
							</a>
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{(data?.payments.length ?? 0) === 0 ? (
					<div className="flex h-[200px] items-center justify-center text-muted-foreground">
						No hay pagos pendientes
					</div>
				) : (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Atleta</TableHead>
									<TableHead>Sesion</TableHead>
									<TableHead className="text-right">Monto</TableHead>
									<TableHead className="text-right">Pagado</TableHead>
									<TableHead className="text-right">Pendiente</TableHead>
									<TableHead>Fecha</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data?.payments.map((payment) => {
									const outstanding = payment.amount - payment.paidAmount;
									return (
										<TableRow key={payment.id}>
											<TableCell className="font-medium">
												{payment.athlete?.user?.name ?? "Sin atleta"}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{payment.session?.title ?? "Sin sesion"}
											</TableCell>
											<TableCell className="text-right">
												{formatAmount(payment.amount)}
											</TableCell>
											<TableCell className="text-right text-green-600">
												{formatAmount(payment.paidAmount)}
											</TableCell>
											<TableCell className="text-right">
												<Badge variant="outline" className="text-yellow-600">
													{formatAmount(outstanding)}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{format(new Date(payment.createdAt), "dd MMM yyyy", {
													locale: es,
												})}
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
