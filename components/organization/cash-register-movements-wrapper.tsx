"use client";

import { CashMovementsTable } from "@/components/organization/cash-movements-table";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/trpc/client";

export function CashRegisterMovementsWrapper() {
	const { data: currentRegister } =
		trpc.organization.cashRegister.getCurrent.useQuery();

	if (!currentRegister) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Movimientos del Dia</CardTitle>
					<CardDescription>
						Abre la caja para registrar movimientos
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex h-32 items-center justify-center text-muted-foreground">
						No hay caja abierta para hoy
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Movimientos del Dia</CardTitle>
				<CardDescription>Todos los movimientos registrados hoy</CardDescription>
			</CardHeader>
			<CardContent>
				<CashMovementsTable cashRegisterId={currentRegister.id} />
			</CardContent>
		</Card>
	);
}
