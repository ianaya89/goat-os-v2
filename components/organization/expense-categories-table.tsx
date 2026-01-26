"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
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
import { ExpenseCategoriesModal } from "@/components/organization/expense-categories-modal";
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
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface ExpenseCategory {
	id: string;
	organizationId: string;
	name: string;
	description: string | null;
	type: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const categoryTypeColors: Record<string, string> = {
	operational: "bg-blue-100 dark:bg-blue-900",
	personnel: "bg-purple-100 dark:bg-purple-900",
	other: "bg-gray-100 dark:bg-gray-800",
};

const categoryTypeLabels: Record<string, string> = {
	operational: "Operativo",
	personnel: "Personal",
	other: "Otro",
};

export function ExpenseCategoriesTable(): React.JSX.Element {
	const utils = trpc.useUtils();

	const { data, isPending } = trpc.organization.expense.listCategories.useQuery(
		{
			includeInactive: true,
		},
	);

	const deleteCategoryMutation =
		trpc.organization.expense.deleteCategory.useMutation({
			onSuccess: () => {
				toast.success("Categoria desactivada exitosamente");
				utils.organization.expense.listCategories.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al desactivar la categoria");
			},
		});

	const columns: ColumnDef<ExpenseCategory>[] = [
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
			accessorKey: "type",
			header: "Tipo",
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
						categoryTypeColors[row.original.type] ||
							"bg-gray-100 dark:bg-gray-800",
					)}
					variant="outline"
				>
					{categoryTypeLabels[row.original.type] ?? row.original.type}
				</Badge>
			),
		},
		{
			accessorKey: "isActive",
			header: "Estado",
			cell: ({ row }) =>
				row.original.isActive ? (
					<div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
						<CheckCircleIcon className="size-4" />
						<span className="text-sm">Activa</span>
					</div>
				) : (
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<XCircleIcon className="size-4" />
						<span className="text-sm">Inactiva</span>
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
									NiceModal.show(ExpenseCategoriesModal, {
										category: row.original,
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
												title: "Desactivar categoria?",
												message:
													"Los gastos existentes mantendran esta categoria pero no podras usarla para nuevos gastos.",
												confirmLabel: "Desactivar",
												destructive: true,
												onConfirm: () =>
													deleteCategoryMutation.mutate({
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
			data={(data as ExpenseCategory[]) || []}
			emptyMessage="No hay categorias de gastos."
			loading={isPending}
			toolbarActions={
				<Button
					onClick={() => NiceModal.show(ExpenseCategoriesModal)}
					size="sm"
				>
					<PlusIcon className="size-4 shrink-0" />
					Agregar Categoria
				</Button>
			}
			totalCount={data?.length ?? 0}
		/>
	);
}
