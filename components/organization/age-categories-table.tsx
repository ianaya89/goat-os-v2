"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { AgeCategoriesModal } from "@/components/organization/age-categories-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	createSelectionColumn,
	DataTable,
} from "@/components/ui/custom/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBirthYearRange } from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface AgeCategory {
	id: string;
	organizationId: string;
	name: string;
	displayName: string;
	minBirthYear: number | null;
	maxBirthYear: number | null;
	sortOrder: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const statusColors: Record<string, string> = {
	active: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
	inactive: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
};

export function AgeCategoriesTable(): React.JSX.Element {
	const [rowSelection, setRowSelection] = React.useState({});
	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.sportsEvent.listAgeCategories.useQuery(
			{ includeInactive: true },
			{ placeholderData: (prev) => prev },
		);

	const deleteAgeCategoryMutation =
		trpc.organization.sportsEvent.deleteAgeCategory.useMutation({
			onSuccess: () => {
				toast.success("Categoría de edad eliminada");
				utils.organization.sportsEvent.listAgeCategories.invalidate();
			},
			onError: (error: { message?: string }) => {
				toast.error(error.message || "Error al eliminar la categoría");
			},
		});

	const columns: ColumnDef<AgeCategory>[] = [
		createSelectionColumn<AgeCategory>(),
		{
			accessorKey: "displayName",
			header: "Nombre",
			cell: ({ row }) => (
				<span className="font-medium text-foreground">
					{row.original.displayName}
				</span>
			),
		},
		{
			accessorKey: "name",
			header: "Código",
			cell: ({ row }) => (
				<span className="text-foreground/80 font-mono text-sm">
					{row.original.name}
				</span>
			),
		},
		{
			id: "birthYearRange",
			header: "Años de nacimiento",
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{formatBirthYearRange(
						row.original.minBirthYear,
						row.original.maxBirthYear,
					)}
				</span>
			),
		},
		{
			accessorKey: "sortOrder",
			header: "Orden",
			cell: ({ row }) => (
				<span className="text-foreground/80">{row.original.sortOrder}</span>
			),
		},
		{
			accessorKey: "isActive",
			header: "Estado",
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-xs shadow-none",
						row.original.isActive ? statusColors.active : statusColors.inactive,
					)}
					variant="outline"
				>
					{row.original.isActive ? "Activo" : "Inactivo"}
				</Badge>
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
								<span className="sr-only">Abrir menú</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(AgeCategoriesModal, {
										ageCategory: row.original,
									});
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								Editar
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "¿Eliminar categoría?",
										message:
											"¿Estás seguro de que deseas eliminar esta categoría de edad? Esta acción no se puede deshacer.",
										confirmLabel: "Eliminar",
										destructive: true,
										onConfirm: () =>
											deleteAgeCategoryMutation.mutate({ id: row.original.id }),
									});
								}}
								variant="destructive"
							>
								<Trash2Icon className="mr-2 size-4" />
								Eliminar
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	return (
		<DataTable
			columns={columns}
			data={(data as AgeCategory[] | undefined) || []}
			emptyMessage="No hay categorías de edad."
			enableRowSelection
			loading={isPending}
			onRowSelectionChange={setRowSelection}
			rowSelection={rowSelection}
			toolbarActions={
				<Button onClick={() => NiceModal.show(AgeCategoriesModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					Nueva Categoría
				</Button>
			}
			totalCount={data?.length ?? 0}
		/>
	);
}
