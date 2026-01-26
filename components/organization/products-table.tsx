"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
	AlertTriangleIcon,
	BoxIcon,
	MoreHorizontalIcon,
	PackageIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { ProductsModal } from "@/components/organization/products-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	createSelectionColumn,
	DataTable,
	type FilterConfig,
	SortableColumnHeader,
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
	ProductCategories,
	type ProductCategory,
	type ProductStatus,
	ProductStatuses,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: true }];

interface Product {
	id: string;
	organizationId: string;
	name: string;
	description: string | null;
	sku: string | null;
	barcode: string | null;
	category: ProductCategory;
	costPrice: number;
	sellingPrice: number;
	currency: string;
	trackStock: boolean;
	lowStockThreshold: number | null;
	currentStock: number;
	status: ProductStatus;
	imageUrl: string | null;
	taxRate: number | null;
	notes: string | null;
	isActive: boolean;
	createdAt: Date;
	createdByUser: {
		id: string;
		name: string;
	} | null;
}

const categoryLabels: Record<ProductCategory, string> = {
	beverage: "Bebida",
	food: "Comida",
	apparel: "Ropa",
	equipment: "Equipamiento",
	merchandise: "Mercaderia",
	supplement: "Suplemento",
	other: "Otro",
};

const statusLabels: Record<ProductStatus, string> = {
	active: "Activo",
	inactive: "Inactivo",
	discontinued: "Descontinuado",
};

const statusColors: Record<ProductStatus, string> = {
	active: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
	inactive:
		"bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
	discontinued: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
};

export function ProductsTable(): React.JSX.Element {
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

	const { data, isPending } = trpc.organization.stock.listProducts.useQuery(
		{
			search: searchQuery || undefined,
		},
		{
			placeholderData: (prev) => prev,
		},
	);

	const deleteProductMutation =
		trpc.organization.stock.deleteProduct.useMutation({
			onSuccess: () => {
				toast.success("Producto eliminado exitosamente");
				utils.organization.stock.listProducts.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar el producto");
			},
		});

	const formatAmount = (amount: number, currency: string) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: currency,
		}).format(amount / 100);
	};

	const columns: ColumnDef<Product>[] = [
		createSelectionColumn<Product>(),
		{
			accessorKey: "name",
			header: "Producto",
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-muted">
						<PackageIcon className="size-5 text-muted-foreground" />
					</div>
					<div className="flex flex-col gap-0.5">
						<span className="font-medium text-foreground">
							{row.original.name}
						</span>
						{row.original.sku && (
							<span className="text-foreground/70 text-xs">
								SKU: {row.original.sku}
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
			accessorKey: "sellingPrice",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Precio" />
			),
			cell: ({ row }) => (
				<span className="font-medium text-foreground">
					{formatAmount(row.original.sellingPrice, row.original.currency)}
				</span>
			),
		},
		{
			accessorKey: "currentStock",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Stock" />
			),
			cell: ({ row }) => {
				const isLowStock =
					row.original.trackStock &&
					row.original.lowStockThreshold &&
					row.original.currentStock <= row.original.lowStockThreshold;
				return (
					<div className="flex items-center gap-2">
						<BoxIcon
							className={cn(
								"size-4",
								isLowStock ? "text-amber-500" : "text-muted-foreground",
							)}
						/>
						<span
							className={cn(
								"font-medium",
								isLowStock ? "text-amber-500" : "text-foreground",
							)}
						>
							{row.original.currentStock}
						</span>
						{isLowStock && (
							<AlertTriangleIcon className="size-4 text-amber-500" />
						)}
					</div>
				);
			},
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
									NiceModal.show(ProductsModal, { product: row.original });
								}}
							>
								<PencilIcon className="mr-2 size-4" />
								Editar
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(ConfirmationModal, {
										title: "Eliminar producto?",
										message:
											"Estas seguro de eliminar este producto? Esta accion no se puede deshacer.",
										confirmLabel: "Eliminar",
										destructive: true,
										onConfirm: () =>
											deleteProductMutation.mutate({ id: row.original.id }),
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

	const productFilters: FilterConfig[] = [
		{
			key: "category",
			title: "Categoria",
			options: ProductCategories.map((cat) => ({
				value: cat,
				label: categoryLabels[cat],
			})),
		},
		{
			key: "status",
			title: "Estado",
			options: ProductStatuses.map((status) => ({
				value: status,
				label: statusLabels[status],
			})),
		},
	];

	// Client-side pagination for simplicity
	const products = (data as Product[]) || [];
	const paginatedProducts = products.slice(
		(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
		((pageIndex || 0) + 1) * (pageSize || appConfig.pagination.defaultLimit),
	);

	return (
		<DataTable
			columns={columns}
			data={paginatedProducts}
			emptyMessage="No se encontraron productos."
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={productFilters}
			loading={isPending}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={setSearchQuery}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			rowSelection={rowSelection}
			searchPlaceholder="Buscar productos..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			toolbarActions={
				<Button onClick={() => NiceModal.show(ProductsModal)} size="sm">
					<PlusIcon className="size-4 shrink-0" />
					Agregar Producto
				</Button>
			}
			totalCount={products.length}
		/>
	);
}
