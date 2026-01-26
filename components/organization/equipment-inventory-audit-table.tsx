"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import {
	CalendarIcon,
	CheckCircleIcon,
	ClipboardListIcon,
	MoreHorizontalIcon,
	PencilIcon,
	PlayIcon,
	PlusIcon,
	Trash2Icon,
	XCircleIcon,
} from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { EquipmentInventoryAuditModal } from "@/components/organization/equipment-inventory-audit-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
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
import { Progress } from "@/components/ui/progress";
import { appConfig } from "@/config/app.config";
import {
	type EquipmentAuditStatus,
	EquipmentAuditStatuses,
	type EquipmentAuditType,
	type TrainingEquipmentCategory,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "scheduledDate", desc: true }];

interface Audit {
	id: string;
	organizationId: string;
	title: string | null;
	scheduledDate: Date;
	startedAt: Date | null;
	completedAt: Date | null;
	status: EquipmentAuditStatus;
	auditType: EquipmentAuditType;
	categoryFilter: TrainingEquipmentCategory | null;
	locationId: string | null;
	totalItems: number;
	countedItems: number;
	itemsWithDiscrepancy: number;
	totalExpectedQuantity: number;
	totalCountedQuantity: number;
	notes: string | null;
	createdAt: Date;
	location: {
		id: string;
		name: string;
	} | null;
	createdByUser: {
		id: string;
		name: string;
	} | null;
	performedByUser: {
		id: string;
		name: string;
	} | null;
}

const statusLabels: Record<EquipmentAuditStatus, string> = {
	scheduled: "Programada",
	in_progress: "En Curso",
	completed: "Completada",
	cancelled: "Cancelada",
};

const statusColors: Record<EquipmentAuditStatus, string> = {
	scheduled: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
	in_progress:
		"bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
	completed:
		"bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
	cancelled: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
};

const typeLabels: Record<EquipmentAuditType, string> = {
	full: "Completo",
	partial: "Parcial",
	spot: "Puntual",
};

export function EquipmentInventoryAuditTable(): React.JSX.Element {
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

	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	);
	const [sorting, setSorting] = React.useState<SortingState>(DEFAULT_SORTING);

	const utils = trpc.useUtils();

	// Extract status filter from columnFilters
	const statusFilter = columnFilters.find((f) => f.id === "status")?.value as
		| string[]
		| undefined;
	const statusFilterValue = statusFilter?.[0] as
		| EquipmentAuditStatus
		| undefined;

	const { data: audits = [], isLoading } =
		trpc.organization.equipmentAudit.list.useQuery({
			status: statusFilterValue,
			limit: 100,
		});

	const deleteMutation = trpc.organization.equipmentAudit.delete.useMutation({
		onSuccess: () => {
			toast.success("Auditoria eliminada correctamente");
			utils.organization.equipmentAudit.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const startMutation = trpc.organization.equipmentAudit.start.useMutation({
		onSuccess: () => {
			toast.success("Auditoria iniciada correctamente");
			utils.organization.equipmentAudit.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const cancelMutation = trpc.organization.equipmentAudit.cancel.useMutation({
		onSuccess: () => {
			toast.success("Auditoria cancelada correctamente");
			utils.organization.equipmentAudit.list.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleCreate = () => {
		NiceModal.show(EquipmentInventoryAuditModal);
	};

	const handleEdit = (audit: Audit) => {
		NiceModal.show(EquipmentInventoryAuditModal, { audit });
	};

	const handleDelete = (audit: Audit) => {
		NiceModal.show(ConfirmationModal, {
			title: "Eliminar Auditoria",
			description: `¿Estas seguro de que deseas eliminar la auditoria "${audit.title || "Sin titulo"}"?`,
			confirmText: "Eliminar",
			cancelText: "Cancelar",
			variant: "destructive",
			onConfirm: () => deleteMutation.mutate({ id: audit.id }),
		});
	};

	const handleStart = (audit: Audit) => {
		NiceModal.show(ConfirmationModal, {
			title: "Iniciar Auditoria",
			description:
				"¿Estas seguro de que deseas iniciar esta auditoria? Se generaran los items a contar basados en el inventario actual.",
			confirmText: "Iniciar",
			cancelText: "Cancelar",
			onConfirm: () => startMutation.mutate({ id: audit.id }),
		});
	};

	const handleCancel = (audit: Audit) => {
		NiceModal.show(ConfirmationModal, {
			title: "Cancelar Auditoria",
			description: "¿Estas seguro de que deseas cancelar esta auditoria?",
			confirmText: "Cancelar Auditoria",
			cancelText: "Volver",
			variant: "destructive",
			onConfirm: () => cancelMutation.mutate({ id: audit.id }),
		});
	};

	const columns: ColumnDef<Audit>[] = [
		{
			accessorKey: "title",
			header: "Titulo",
			cell: ({ row }) => {
				const audit = row.original;
				return (
					<div className="flex flex-col">
						<span className="font-medium">{audit.title || "Sin titulo"}</span>
						<span className="text-muted-foreground text-xs">
							{typeLabels[audit.auditType]}
							{audit.location && ` - ${audit.location.name}`}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "scheduledDate",
			header: "Fecha Programada",
			cell: ({ row }) => {
				const date = row.original.scheduledDate;
				return (
					<div className="flex items-center gap-2">
						<CalendarIcon className="text-muted-foreground h-4 w-4" />
						<span>
							{new Date(date).toLocaleDateString("es-AR", {
								day: "2-digit",
								month: "short",
								year: "numeric",
							})}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "status",
			header: "Estado",
			cell: ({ row }) => {
				const status = row.original.status;
				return (
					<Badge className={cn("text-xs", statusColors[status])}>
						{statusLabels[status]}
					</Badge>
				);
			},
		},
		{
			accessorKey: "progress",
			header: "Progreso",
			cell: ({ row }) => {
				const audit = row.original;
				if (audit.status === "scheduled") {
					return <span className="text-muted-foreground text-sm">-</span>;
				}

				const progress =
					audit.totalItems > 0
						? Math.round((audit.countedItems / audit.totalItems) * 100)
						: 0;

				return (
					<div className="flex flex-col gap-1">
						<Progress value={progress} className="h-2 w-24" />
						<span className="text-muted-foreground text-xs">
							{audit.countedItems}/{audit.totalItems} items
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "discrepancies",
			header: "Discrepancias",
			cell: ({ row }) => {
				const audit = row.original;
				if (audit.status === "scheduled") {
					return <span className="text-muted-foreground text-sm">-</span>;
				}

				if (audit.itemsWithDiscrepancy === 0) {
					return (
						<Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
							Sin diferencias
						</Badge>
					);
				}

				return (
					<Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
						{audit.itemsWithDiscrepancy} item(s)
					</Badge>
				);
			},
		},
		{
			accessorKey: "performedByUser",
			header: "Realizado por",
			cell: ({ row }) => {
				const user = row.original.performedByUser;
				if (!user) {
					return <span className="text-muted-foreground text-sm">-</span>;
				}
				return <span className="text-sm">{user.name}</span>;
			},
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const audit = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Abrir menu</span>
								<MoreHorizontalIcon className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{audit.status === "scheduled" && (
								<>
									<DropdownMenuItem onClick={() => handleStart(audit)}>
										<PlayIcon className="mr-2 h-4 w-4" />
										Iniciar Auditoria
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => handleEdit(audit)}>
										<PencilIcon className="mr-2 h-4 w-4" />
										Editar
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => handleDelete(audit)}
										className="text-destructive"
									>
										<Trash2Icon className="mr-2 h-4 w-4" />
										Eliminar
									</DropdownMenuItem>
								</>
							)}
							{audit.status === "in_progress" && (
								<>
									<DropdownMenuItem asChild>
										<a
											href={`/dashboard/organization/equipment/audit/${audit.id}`}
										>
											<ClipboardListIcon className="mr-2 h-4 w-4" />
											Ver Conteo
										</a>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => handleCancel(audit)}
										className="text-destructive"
									>
										<XCircleIcon className="mr-2 h-4 w-4" />
										Cancelar Auditoria
									</DropdownMenuItem>
								</>
							)}
							{audit.status === "completed" && (
								<DropdownMenuItem asChild>
									<a
										href={`/dashboard/organization/equipment/audit/${audit.id}`}
									>
										<CheckCircleIcon className="mr-2 h-4 w-4" />
										Ver Resultados
									</a>
								</DropdownMenuItem>
							)}
							{audit.status === "cancelled" && (
								<DropdownMenuItem asChild>
									<a
										href={`/dashboard/organization/equipment/audit/${audit.id}`}
									>
										<ClipboardListIcon className="mr-2 h-4 w-4" />
										Ver Detalles
									</a>
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const filterConfig: FilterConfig[] = [
		{
			key: "status",
			title: "Estado",
			options: EquipmentAuditStatuses.map((status) => ({
				label: statusLabels[status],
				value: status,
			})),
		},
	];

	return (
		<DataTable<Audit>
			columns={columns}
			data={audits}
			totalCount={audits.length}
			loading={isLoading}
			searchPlaceholder="Buscar auditorias..."
			searchQuery={searchQuery ?? ""}
			onSearchQueryChange={setSearchQuery}
			filters={filterConfig}
			columnFilters={columnFilters}
			onFiltersChange={setColumnFilters}
			pageIndex={pageIndex ?? 0}
			pageSize={pageSize ?? appConfig.pagination.defaultLimit}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			onSortingChange={setSorting}
			enableFilters
			enablePagination
			enableSearch
			emptyMessage="No hay auditorias."
			toolbarActions={
				<Button onClick={handleCreate} size="sm">
					<PlusIcon className="mr-2 h-4 w-4" />
					Nueva Auditoria
				</Button>
			}
		/>
	);
}
