"use client";

import NiceModal from "@ebay/nice-modal-react";
import type {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
	CreditCardIcon,
	EyeIcon,
	MoreHorizontalIcon,
	XCircleIcon,
} from "lucide-react";
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsJson,
	parseAsString,
	useQueryState,
} from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { PaymentsModal } from "@/components/organization/payments-modal";
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
import { Progress } from "@/components/ui/progress";
import { appConfig } from "@/config/app.config";
import { EventRegistrationStatuses } from "@/lib/db/schema/enums";
import {
	formatEventPrice,
	getRegistrationStatusColor,
	getRegistrationStatusLabel,
} from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const DEFAULT_SORTING: SortingState = [{ id: "registeredAt", desc: true }];

interface Registration {
	id: string;
	eventId: string;
	organizationId: string;
	registrationNumber: number;
	athleteId: string | null;
	userId: string | null;
	registrantName: string;
	registrantEmail: string;
	registrantPhone: string | null;
	registrantBirthDate: Date | null;
	emergencyContactName: string | null;
	emergencyContactPhone: string | null;
	emergencyContactRelation: string | null;
	ageCategoryId: string | null;
	status: string;
	waitlistPosition: number | null;
	appliedPricingTierId: string | null;
	price: number;
	currency: string;
	paidAmount: number;
	notes: string | null;
	internalNotes: string | null;
	termsAcceptedAt: Date | null;
	registrationSource: string | null;
	registeredAt: Date;
	confirmedAt: Date | null;
	cancelledAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	ageCategory?: {
		id: string;
		displayName: string;
	} | null;
}

interface EventRegistrationsTableProps {
	eventId: string;
}

export function EventRegistrationsTable({
	eventId,
}: EventRegistrationsTableProps): React.JSX.Element {
	const [rowSelection, setRowSelection] = React.useState({});

	const [searchQuery, setSearchQuery] = useQueryState(
		"regQuery",
		parseAsString.withDefault("").withOptions({
			shallow: true,
		}),
	);

	const [pageIndex, setPageIndex] = useQueryState(
		"regPageIndex",
		parseAsInteger.withDefault(0).withOptions({
			shallow: true,
		}),
	);

	const [pageSize, setPageSize] = useQueryState(
		"regPageSize",
		parseAsInteger.withDefault(appConfig.pagination.defaultLimit).withOptions({
			shallow: true,
		}),
	);

	const [statusFilter, setStatusFilter] = useQueryState(
		"regStatus",
		parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			shallow: true,
		}),
	);

	const [sorting, setSorting] = useQueryState<SortingState>(
		"regSort",
		parseAsJson<SortingState>((value) => {
			if (!Array.isArray(value)) return DEFAULT_SORTING;
			return value.filter(
				(item) =>
					item &&
					typeof item === "object" &&
					"id" in item &&
					typeof item.desc === "boolean",
			) as SortingState;
		})
			.withDefault(DEFAULT_SORTING)
			.withOptions({ shallow: true }),
	);

	const utils = trpc.useUtils();

	const columnFilters: ColumnFiltersState = React.useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (statusFilter && statusFilter.length > 0) {
			filters.push({ id: "status", value: statusFilter });
		}
		return filters;
	}, [statusFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("status"));

		if (pageIndex !== 0) {
			setPageIndex(0);
		}
	};

	const handleSortingChange = (newSorting: SortingState): void => {
		setSorting(newSorting.length > 0 ? newSorting : DEFAULT_SORTING);
		if (pageIndex !== 0) {
			setPageIndex(0);
		}
	};

	const sortParams = React.useMemo(() => {
		const fallbackSort = { id: "registeredAt", desc: true } as const;
		const currentSort = sorting?.[0] ?? DEFAULT_SORTING[0] ?? fallbackSort;
		const sortOrder = currentSort.desc ? ("desc" as const) : ("asc" as const);
		return { sortBy: "registeredAt" as const, sortOrder };
	}, [sorting]);

	const { data, isPending } =
		trpc.organization.sportsEvent.listRegistrations.useQuery(
			{
				eventId,
				limit: pageSize || appConfig.pagination.defaultLimit,
				offset:
					(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
				query: searchQuery || undefined,
				sortBy: sortParams.sortBy,
				sortOrder: sortParams.sortOrder,
				filters: {
					status: (statusFilter ||
						[]) as (typeof EventRegistrationStatuses)[number][],
				},
			},
			{
				placeholderData: (prev) => prev,
			},
		);

	const cancelRegistrationMutation =
		trpc.organization.sportsEvent.cancelRegistration.useMutation({
			onSuccess: () => {
				toast.success("Inscripción cancelada");
				utils.organization.sportsEvent.listRegistrations.invalidate();
				utils.organization.sportsEvent.get.invalidate();
				utils.organization.eventOrganization.getProjection.invalidate();
			},
			onError: (error: { message?: string }) => {
				toast.error(error.message || "Error al cancelar la inscripción");
			},
		});

	const handleSearchQueryChange = (value: string): void => {
		if (value !== searchQuery) {
			setSearchQuery(value);
			if (pageIndex !== 0) {
				setPageIndex(0);
			}
		}
	};

	const columns: ColumnDef<Registration>[] = [
		createSelectionColumn<Registration>(),
		{
			accessorKey: "registrationNumber",
			header: "#",
			cell: ({ row }) => (
				<span className="text-muted-foreground font-mono text-sm">
					{row.original.registrationNumber}
				</span>
			),
		},
		{
			accessorKey: "registrantName",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Nombre" />
			),
			cell: ({ row }) => (
				<div className="max-w-[180px]">
					<p className="font-medium text-foreground truncate">
						{row.original.registrantName}
					</p>
					<p className="text-sm text-muted-foreground truncate">
						{row.original.registrantEmail}
					</p>
				</div>
			),
		},
		{
			id: "ageCategory",
			header: "Categoría",
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.ageCategory?.displayName ?? "-"}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "Estado",
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-xs shadow-none whitespace-nowrap",
						getRegistrationStatusColor(row.original.status),
					)}
					variant="outline"
				>
					{getRegistrationStatusLabel(row.original.status)}
				</Badge>
			),
		},
		{
			id: "payment",
			header: "Pago",
			cell: ({ row }) => {
				const percentage =
					row.original.price > 0
						? Math.min(
								100,
								Math.round(
									(row.original.paidAmount / row.original.price) * 100,
								),
							)
						: 100;
				return (
					<div className="min-w-[100px] space-y-1">
						<span className="text-foreground/80 text-sm">
							{formatEventPrice(row.original.paidAmount, row.original.currency)}{" "}
							/ {formatEventPrice(row.original.price, row.original.currency)}
						</span>
						<Progress value={percentage} className="h-1.5" />
					</div>
				);
			},
		},
		{
			accessorKey: "registeredAt",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title="Fecha" />
			),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{format(row.original.registeredAt, "dd MMM yyyy")}
				</span>
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
									// TODO: View registration details
									toast.info("Función próximamente disponible");
								}}
							>
								<EyeIcon className="mr-2 size-4" />
								Ver detalles
							</DropdownMenuItem>
							{row.original.price > row.original.paidAmount && (
								<DropdownMenuItem
									onClick={() => {
										NiceModal.show(PaymentsModal, {
											fixedEventId: eventId,
										});
									}}
								>
									<CreditCardIcon className="mr-2 size-4" />
									Registrar Pago
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							{row.original.status !== "cancelled" && (
								<DropdownMenuItem
									onClick={() => {
										NiceModal.show(ConfirmationModal, {
											title: "¿Cancelar inscripción?",
											message:
												"¿Estás seguro de que deseas cancelar esta inscripción?",
											confirmLabel: "Cancelar inscripción",
											destructive: true,
											onConfirm: () =>
												cancelRegistrationMutation.mutate({
													id: row.original.id,
												}),
										});
									}}
									variant="destructive"
								>
									<XCircleIcon className="mr-2 size-4" />
									Cancelar inscripción
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const registrationFilters: FilterConfig[] = [
		{
			key: "status",
			title: "Estado",
			options: EventRegistrationStatuses.map((status) => ({
				value: status,
				label: getRegistrationStatusLabel(status),
			})),
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.registrations as Registration[]) || []}
			emptyMessage="No hay inscripciones."
			enableFilters
			enablePagination
			enableRowSelection
			enableSearch
			filters={registrationFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			onPageIndexChange={setPageIndex}
			onPageSizeChange={setPageSize}
			onRowSelectionChange={setRowSelection}
			onSearchQueryChange={handleSearchQueryChange}
			onSortingChange={handleSortingChange}
			pageIndex={pageIndex || 0}
			pageSize={pageSize || appConfig.pagination.defaultLimit}
			rowSelection={rowSelection}
			searchPlaceholder="Buscar inscripciones..."
			searchQuery={searchQuery || ""}
			defaultSorting={DEFAULT_SORTING}
			sorting={sorting}
			totalCount={data?.total ?? 0}
		/>
	);
}
