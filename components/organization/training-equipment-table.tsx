"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
	HardHatIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	WrenchIcon,
} from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { TrainingEquipmentModal } from "@/components/organization/training-equipment-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	createSelectionColumn,
	DataTable,
	type FilterConfig,
} from "@/components/ui/custom/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appConfig } from "@/config/app.config";
import {
	type EquipmentCondition,
	EquipmentConditions,
	TrainingEquipmentCategories,
	type TrainingEquipmentCategory,
	type TrainingEquipmentStatus,
	TrainingEquipmentStatuses,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: true }];

interface Equipment {
	id: string;
	organizationId: string;
	name: string;
	description: string | null;
	brand: string | null;
	model: string | null;
	serialNumber: string | null;
	category: TrainingEquipmentCategory;
	totalQuantity: number;
	availableQuantity: number;
	status: TrainingEquipmentStatus;
	condition: EquipmentCondition;
	purchasePrice: number | null;
	purchaseDate: Date | null;
	currency: string;
	locationId: string | null;
	storageLocation: string | null;
	lastMaintenanceDate: Date | null;
	nextMaintenanceDate: Date | null;
	imageUrl: string | null;
	notes: string | null;
	isActive: boolean;
	createdAt: Date;
	location: {
		id: string;
		name: string;
	} | null;
	createdByUser: {
		id: string;
		name: string;
	} | null;
}

const categoryLabels: Record<TrainingEquipmentCategory, string> = {
	balls: "Pelotas",
	cones: "Conos",
	goals: "Arcos",
	nets: "Redes",
	hurdles: "Vallas",
	ladders: "Escaleras",
	markers: "Marcadores",
	bibs: "Pecheras",
	poles: "Postes",
	mats: "Colchonetas",
	weights: "Pesas",
	bands: "Bandas",
	medical: "Medico",
	electronics: "Electronica",
	storage: "Almacenamiento",
	other: "Otro",
};

const statusLabels: Record<TrainingEquipmentStatus, string> = {
	available: "Disponible",
	in_use: "En Uso",
	maintenance: "Mantenimiento",
	damaged: "Danado",
	retired: "Retirado",
};

const statusColors: Record<TrainingEquipmentStatus, string> = {
	available:
		"bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
	in_use: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
	maintenance:
		"bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
	damaged: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
	retired: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
};

const conditionLabels: Record<EquipmentCondition, string> = {
	new: "Nuevo",
	excellent: "Excelente",
	good: "Bueno",
	fair: "Regular",
	poor: "Malo",
};

const conditionColors: Record<EquipmentCondition, string> = {
	new: "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200",
	excellent:
		"bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
	good: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
	fair: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
	poor: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
};

export function TrainingEquipmentTable(): React.JSX.Element {
	const [rowSelection, setRowSelection] = React.useState({});

	const [searchQuery, setSearchQuery] = useQueryState(
		"query",
		parseAsString.withDefault("").withOptions({ shallow: true }),
	);

	const [pageIndex, setPageIndex] = useQueryState(
		"pageIndex",
		parseAsInteger.withDefault(0).withOptions({ shallow: true }),
	);

	const [pageSize, setPageSize] = useQueryState(
		"pageSize",
		parseAsInteger.withDefault(appConfig.pagination.defaultLimit).withOptions({
			shallow: true,
		}),
	);

	const utils = trpc.useUtils();

	const { data, isPending } = trpc.organization.equipment.list.useQuery(
		{
			search: searchQuery || undefined,
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteEquipmentMutation =
		trpc.organization.equipment.delete.useMutation({
			onSuccess: () => {
				toast.success("Equipamiento eliminado exitosamente");
				utils.organization.equipment.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar el equipamiento");
			},
		});

	const columns: ColumnDef<Equipment>[] = [
		createSelectionColumn<Equipment>(),
		{
			accessorKey: "name",
			header: "Equipamiento",
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-muted">
						<HardHatIcon className="size-5 text-muted-foreground" />
					</div>
					<div className="flex flex-col gap-0.5">
						<span className="font-medium text-foreground">
							{row.original.name}
						</span>
						{row.original.brand && (
							<span className="text-foreground/70 text-xs">
								{row.original.brand}
								{row.original.model ? ` - ${row.original.model}` : ""}
							</span>
						)}
					</div>
				</div>
			),
		},
		{
			accessorKey: "category",
			header: "Categoria",
			cell: ({ row }) => (
				<Badge variant="secondary">
					{categoryLabels[row.original.category]}
				</Badge>
			),
		},
		{
			accessorKey: "quantity",
			header: "Cantidad",
			cell: ({ row }) => (
				<div className="flex flex-col gap-0.5">
					<span className="font-medium text-foreground">
						{row.original.availableQuantity} / {row.original.totalQuantity}
					</span>
					<span className="text-muted-foreground text-xs">disponibles</span>
				</div>
			),
		},
		{
			accessorKey: "status",
			header: "Estado",
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none font-medium shadow-none",
						statusColors[row.original.status],
					)}
					variant="outline"
				>
					{statusLabels[row.original.status]}
				</Badge>
			),
		},
		{
			accessorKey: "condition",
			header: "Condicion",
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none font-medium shadow-none",
						conditionColors[row.original.condition],
					)}
					variant="outline"
				>
					{conditionLabels[row.original.condition]}
				</Badge>
			),
		},
		{
			accessorKey: "location",
			header: "Ubicacion",
			cell: ({ row }) =>
				row.original.location ? (
					<span className="text-foreground/80">
						{row.original.location.name}
					</span>
				) : (
					<span className="text-muted-foreground">-</span>
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
									NiceModal.show(TrainingEquipmentModal, {
										equipment: row.original,
									});
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								Editar
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									// TODO: Open maintenance modal
									toast.info("Registrar mantenimiento (proximamente)");
								}}
							>
								<WrenchIcon className="mr-2 size-4" />
								Mantenimiento
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "Eliminar equipamiento?",
										message:
											"Estas seguro de eliminar este equipamiento? Esta accion no se puede deshacer.",
										confirmLabel: "Eliminar",
										destructive: true,
										onConfirm: () =>
											deleteEquipmentMutation.mutate({ id: row.original.id }),
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

	const equipmentFilters: FilterConfig[] = [
		{
			key: "category",
			title: "Categoria",
			options: TrainingEquipmentCategories.map((cat) => ({
				value: cat,
				label: categoryLabels[cat],
			})),
		},
		{
			key: "status",
			title: "Estado",
			options: TrainingEquipmentStatuses.map((status) => ({
				value: status,
				label: statusLabels[status],
			})),
		},
		{
			key: "condition",
			title: "Condicion",
			options: EquipmentConditions.map((cond) => ({
				value: cond,
				label: conditionLabels[cond],
			})),
		},
	];

	// Client-side pagination for simplicity
	const equipment = (data as Equipment[]) || [];
	const paginatedEquipment = equipment.slice(
		(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
		((pageIndex || 0) + 1) * (pageSize || appConfig.pagination.defaultLimit),
	);

	return (
		<DataTable
			columns={columns}
			data={paginatedEquipment}
			emptyMessage="No se encontro equipamiento."
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={equipmentFilters}
			loading={isPending}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={setSearchQuery}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			rowSelection={rowSelection}
			searchPlaceholder="Buscar equipamiento..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			toolbarActions={
				<Button
					onClick={() => NiceModal.show(TrainingEquipmentModal)}
					size="sm"
				>
					<PlusIcon className="size-4 shrink-0" />
					Agregar Equipamiento
				</Button>
			}
			totalCount={equipment.length}
		/>
	);
}
