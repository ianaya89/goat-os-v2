"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
	CheckCircleIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	PowerOffIcon,
	StarIcon,
	XCircleIcon,
} from "lucide-react";
import type * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { VendorsModal } from "@/components/organization/vendors-modal";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/custom/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/trpc/client";

interface Vendor {
	id: string;
	organizationId: string;
	name: string;
	description: string | null;
	contactName: string | null;
	email: string | null;
	phone: string | null;
	address: string | null;
	city: string | null;
	websiteUrl: string | null;
	categories: string | null;
	rating: number | null;
	isActive: boolean;
	createdAt: Date;
}

export function VendorsTable(): React.JSX.Element {
	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listVendors.useQuery({
			includeInactive: true,
		});

	const deleteVendorMutation =
		trpc.organization.eventOrganization.deleteVendor.useMutation({
			onSuccess: () => {
				toast.success("Proveedor desactivado exitosamente");
				utils.organization.eventOrganization.listVendors.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al desactivar el proveedor");
			},
		});

	const columns: ColumnDef<Vendor>[] = [
		{
			accessorKey: "name",
			header: "Nombre",
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<span className="font-medium text-foreground">
						{row.original.name}
					</span>
					{row.original.description && (
						<span className="text-foreground/70 text-xs max-w-[300px] truncate">
							{row.original.description}
						</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "contactName",
			header: "Contacto",
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<span>{row.original.contactName || "-"}</span>
					{row.original.email && (
						<span className="text-foreground/70 text-xs">
							{row.original.email}
						</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "phone",
			header: "Telefono",
			cell: ({ row }) => row.original.phone || "-",
		},
		{
			accessorKey: "rating",
			header: "Calificacion",
			cell: ({ row }) =>
				row.original.rating ? (
					<div className="flex items-center gap-1">
						<StarIcon className="size-4 fill-yellow-400 text-yellow-400" />
						<span>{row.original.rating}</span>
					</div>
				) : (
					"-"
				),
		},
		{
			accessorKey: "isActive",
			header: "Estado",
			cell: ({ row }) =>
				row.original.isActive ? (
					<div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
						<CheckCircleIcon className="size-4" />
						<span className="text-sm">Activo</span>
					</div>
				) : (
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<XCircleIcon className="size-4" />
						<span className="text-sm">Inactivo</span>
					</div>
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
									NiceModal.show(VendorsModal, {
										vendor: row.original,
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
												title: "Desactivar proveedor?",
												message:
													"El proveedor sera desactivado pero sus datos se mantendran.",
												confirmLabel: "Desactivar",
												destructive: true,
												onConfirm: () =>
													deleteVendorMutation.mutate({
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
			data={(data as Vendor[]) || []}
			emptyMessage="No hay proveedores registrados."
			loading={isPending}
			toolbarActions={
				<Button onClick={() => NiceModal.show(VendorsModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					Agregar Proveedor
				</Button>
			}
			totalCount={data?.length ?? 0}
		/>
	);
}
