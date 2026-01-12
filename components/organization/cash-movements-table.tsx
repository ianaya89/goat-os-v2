"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, RefreshCwIcon } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/custom/data-table";
import { CashMovementType } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface CashMovement {
	id: string;
	type: string;
	amount: number;
	description: string;
	referenceType: string;
	createdAt: Date;
	recordedByUser: {
		id: string;
		name: string;
	} | null;
}

const movementTypeConfig: Record<
	string,
	{ label: string; icon: React.ReactNode; color: string }
> = {
	income: {
		label: "Ingreso",
		icon: <ArrowUpIcon className="size-4" />,
		color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	},
	expense: {
		label: "Egreso",
		icon: <ArrowDownIcon className="size-4" />,
		color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
	},
	adjustment: {
		label: "Ajuste",
		icon: <RefreshCwIcon className="size-4" />,
		color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	},
};

const referenceTypeLabels: Record<string, string> = {
	training_payment: "Pago de Entrenamiento",
	event_payment: "Pago de Evento",
	expense: "Gasto",
	manual: "Manual",
};

interface CashMovementsTableProps {
	cashRegisterId: string;
}

export function CashMovementsTable({
	cashRegisterId,
}: CashMovementsTableProps): React.JSX.Element {
	const { data, isPending } =
		trpc.organization.cashRegister.getMovements.useQuery({
			cashRegisterId,
			limit: 100,
			offset: 0,
		});

	const formatAmount = (amount: number, type: string) => {
		const formatted = new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
		}).format(amount / 100);
		return type === CashMovementType.expense ? `-${formatted}` : formatted;
	};

	const columns: ColumnDef<CashMovement>[] = [
		{
			accessorKey: "type",
			header: "Tipo",
			cell: ({ row }) => {
				const config = movementTypeConfig[row.original.type];
				return config ? (
					<Badge
						className={cn(
							"flex w-fit items-center gap-1.5 border-none px-2 py-0.5 font-medium text-xs shadow-none",
							config.color,
						)}
						variant="outline"
					>
						{config.icon}
						{config.label}
					</Badge>
				) : (
					<span>{row.original.type}</span>
				);
			},
		},
		{
			accessorKey: "description",
			header: "Descripcion",
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<span className="font-medium text-foreground">
						{row.original.description}
					</span>
					<span className="text-muted-foreground text-xs">
						{referenceTypeLabels[row.original.referenceType] ??
							row.original.referenceType}
					</span>
				</div>
			),
		},
		{
			accessorKey: "amount",
			header: "Monto",
			cell: ({ row }) => (
				<span
					className={cn(
						"font-medium",
						row.original.type === CashMovementType.income
							? "text-green-600"
							: row.original.type === CashMovementType.expense
								? "text-red-600"
								: "text-blue-600",
					)}
				>
					{formatAmount(row.original.amount, row.original.type)}
				</span>
			),
		},
		{
			accessorKey: "createdAt",
			header: "Hora",
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{format(row.original.createdAt, "HH:mm")}
				</span>
			),
		},
		{
			accessorKey: "recordedByUser",
			header: "Registrado por",
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.recordedByUser?.name ?? "-"}
				</span>
			),
		},
	];

	return (
		<DataTable
			columns={columns}
			data={(data?.movements as CashMovement[]) || []}
			emptyMessage="No hay movimientos registrados."
			loading={isPending}
			totalCount={data?.total ?? 0}
		/>
	);
}
