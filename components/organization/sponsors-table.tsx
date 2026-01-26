"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	CalendarIcon,
	CheckCircleIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	PowerOffIcon,
	XCircleIcon,
} from "lucide-react";
import type * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { SponsorsModal } from "@/components/organization/sponsors-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/custom/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EventSponsorTier, SponsorStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface Sponsor {
	id: string;
	organizationId: string;
	name: string;
	description: string | null;
	logoUrl: string | null;
	websiteUrl: string | null;
	contactName: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	tier: EventSponsorTier;
	contractStartDate: Date | null;
	contractEndDate: Date | null;
	contractValue: number | null;
	currency: string;
	contractNotes: string | null;
	status: SponsorStatus;
	notes: string | null;
	isActive: boolean;
	createdAt: Date;
}

const tierColors: Record<string, string> = {
	platinum:
		"bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
	gold: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
	silver: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
	bronze:
		"bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
	partner: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
	supporter:
		"bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
};

const tierLabels: Record<string, string> = {
	platinum: "Platino",
	gold: "Oro",
	silver: "Plata",
	bronze: "Bronce",
	partner: "Partner",
	supporter: "Supporter",
};

const statusColors: Record<string, string> = {
	active: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
	inactive: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
	pending:
		"bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
};

const statusLabels: Record<string, string> = {
	active: "Activo",
	inactive: "Inactivo",
	pending: "Pendiente",
};

function formatCurrency(amount: number, currency: string): string {
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: currency,
		minimumFractionDigits: 0,
	}).format(amount);
}

export function SponsorsTable(): React.JSX.Element {
	const utils = trpc.useUtils();

	const { data, isPending } = trpc.organization.sponsor.list.useQuery({
		includeInactive: true,
	});

	const deleteSponsorMutation = trpc.organization.sponsor.delete.useMutation({
		onSuccess: () => {
			toast.success("Sponsor desactivado exitosamente");
			utils.organization.sponsor.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Error al desactivar el sponsor");
		},
	});

	const columns: ColumnDef<Sponsor>[] = [
		{
			accessorKey: "name",
			header: "Nombre",
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<span className="font-medium text-foreground">
						{row.original.name}
					</span>
					{row.original.contactName && (
						<span className="text-foreground/70 text-xs">
							{row.original.contactName}
						</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "tier",
			header: "Nivel",
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-xs shadow-none",
						tierColors[row.original.tier],
					)}
					variant="outline"
				>
					{tierLabels[row.original.tier] ?? row.original.tier}
				</Badge>
			),
		},
		{
			accessorKey: "status",
			header: "Estado",
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-xs shadow-none",
						statusColors[row.original.status],
					)}
					variant="outline"
				>
					{statusLabels[row.original.status] ?? row.original.status}
				</Badge>
			),
		},
		{
			accessorKey: "contractValue",
			header: "Valor Contrato",
			cell: ({ row }) =>
				row.original.contractValue
					? formatCurrency(row.original.contractValue, row.original.currency)
					: "-",
		},
		{
			accessorKey: "contractEndDate",
			header: "Vigencia",
			cell: ({ row }) => {
				if (!row.original.contractStartDate && !row.original.contractEndDate) {
					return "-";
				}
				const endDate = row.original.contractEndDate;
				const isExpired = endDate && new Date(endDate) < new Date();
				return (
					<div className="flex items-center gap-1.5">
						<CalendarIcon
							className={cn(
								"size-4",
								isExpired ? "text-red-500" : "text-muted-foreground",
							)}
						/>
						<span className={cn(isExpired && "text-red-500")}>
							{endDate
								? format(new Date(endDate), "dd/MM/yyyy", { locale: es })
								: "Sin fecha"}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "isActive",
			header: "Activo",
			cell: ({ row }) =>
				row.original.isActive ? (
					<CheckCircleIcon className="size-4 text-green-600 dark:text-green-400" />
				) : (
					<XCircleIcon className="size-4 text-muted-foreground" />
				),
		},
		{
			id: "actions",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex justify-end">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
								size="icon"
								variant="ghost"
							>
								<MoreHorizontalIcon className="shrink-0" />
								<span className="sr-only">Abrir menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(SponsorsModal, {
										sponsor: row.original,
									});
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								Editar
							</DropdownMenuItem>
							{row.original.isActive && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => {
											NiceModal.show(ConfirmationModal, {
												title: "Desactivar sponsor?",
												message:
													"El sponsor sera desactivado pero sus datos se mantendran.",
												confirmLabel: "Desactivar",
												destructive: true,
												onConfirm: () =>
													deleteSponsorMutation.mutate({
														id: row.original.id,
													}),
											});
										}}
										variant="destructive"
									>
										<PowerOffIcon className="mr-2 size-4" />
										Desactivar
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	return (
		<DataTable
			columns={columns}
			data={(data as Sponsor[]) || []}
			emptyMessage="No hay sponsors registrados."
			loading={isPending}
			toolbarActions={
				<Button onClick={() => NiceModal.show(SponsorsModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					Agregar Sponsor
				</Button>
			}
			totalCount={data?.length ?? 0}
		/>
	);
}
