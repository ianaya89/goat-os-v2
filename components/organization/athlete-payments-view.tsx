"use client";

import { format } from "date-fns";
import {
	BanknoteIcon,
	CheckCircleIcon,
	ClockIcon,
	WalletIcon,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/billing/utils";
import { trpc } from "@/trpc/client";

export function AthletePaymentsView() {
	const { data, isLoading } =
		trpc.organization.trainingPayment.listMyPayments.useQuery();

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="grid gap-4 md:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-24" />
					))}
				</div>
				<Skeleton className="h-96" />
			</div>
		);
	}

	const payments = data?.payments ?? [];
	const summary = data?.summary ?? { total: 0, paid: 0, pending: 0 };

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total</CardTitle>
						<WalletIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{formatCurrency(summary.total, "ARS")}
						</div>
						<p className="text-muted-foreground text-xs">
							{payments.length} pago{payments.length !== 1 ? "s" : ""}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Pagado</CardTitle>
						<CheckCircleIcon className="size-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{formatCurrency(summary.paid, "ARS")}
						</div>
						<p className="text-muted-foreground text-xs">
							{payments.filter((p) => p.status === "paid").length} completado
							{payments.filter((p) => p.status === "paid").length !== 1
								? "s"
								: ""}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Pendiente</CardTitle>
						<ClockIcon className="size-4 text-yellow-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-yellow-600">
							{formatCurrency(summary.pending, "ARS")}
						</div>
						<p className="text-muted-foreground text-xs">
							{payments.filter((p) => p.status === "pending").length} pendiente
							{payments.filter((p) => p.status === "pending").length !== 1
								? "s"
								: ""}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Payments Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BanknoteIcon className="size-5" />
						Historial de Pagos
					</CardTitle>
				</CardHeader>
				<CardContent>
					{payments.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12">
							<BanknoteIcon className="size-12 text-muted-foreground/50" />
							<h3 className="mt-4 font-semibold text-lg">
								Sin pagos registrados
							</h3>
							<p className="mt-2 text-center text-muted-foreground">
								Aun no tienes pagos registrados en esta organizacion.
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Fecha</TableHead>
									<TableHead>Descripcion</TableHead>
									<TableHead>Sesion</TableHead>
									<TableHead className="text-right">Monto</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead>Metodo</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{payments.map((payment) => (
									<TableRow key={payment.id}>
										<TableCell className="whitespace-nowrap">
											{format(new Date(payment.createdAt), "dd/MM/yyyy")}
										</TableCell>
										<TableCell>{payment.description || "-"}</TableCell>
										<TableCell>
											{payment.session ? (
												<div>
													<p className="font-medium">{payment.session.title}</p>
													<p className="text-muted-foreground text-xs">
														{format(
															new Date(payment.session.startTime),
															"dd/MM/yyyy HH:mm",
														)}
													</p>
												</div>
											) : (
												"-"
											)}
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(payment.amount, payment.currency)}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													payment.status === "paid"
														? "default"
														: payment.status === "pending"
															? "secondary"
															: "destructive"
												}
												className={
													payment.status === "paid"
														? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
														: payment.status === "pending"
															? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
															: ""
												}
											>
												{payment.status === "paid"
													? "Pagado"
													: payment.status === "pending"
														? "Pendiente"
														: payment.status === "cancelled"
															? "Cancelado"
															: payment.status}
											</Badge>
										</TableCell>
										<TableCell className="capitalize">
											{payment.paymentMethod?.replace("_", " ") || "-"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
