"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { format } from "date-fns";
import {
	FileTextIcon,
	MoreHorizontalIcon,
	Plus,
	ReceiptText,
	RotateCcwIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryState,
} from "nuqs";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { EventPaymentModal } from "@/components/organization/event-payment-modal";
import { EventPaymentReceiptModal } from "@/components/organization/receipt-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
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
	EventPaymentMethods,
	EventPaymentStatuses,
} from "@/lib/db/schema/enums";
import {
	formatEventPrice,
	getPaymentStatusColor,
	getPaymentStatusLabel,
} from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const methodKeys: Record<string, string> = {
	cash: "cash",
	bank_transfer: "bankTransfer",
	mercado_pago: "mercadoPago",
	stripe: "stripe",
	card: "card",
	other: "other",
};

interface Payment {
	id: string;
	registrationId: string;
	organizationId: string;
	amount: number;
	currency: string;
	status: string;
	paymentMethod: string;
	paymentDate: Date | null;
	receiptNumber: string | null;
	receiptImageKey: string | null;
	receiptImageUploadedAt: Date | null;
	notes: string | null;
	refundedAmount: number | null;
	refundedAt: Date | null;
	refundReason: string | null;
	createdAt: Date;
	registration?: {
		id: string;
		registrantName: string;
		registrantEmail: string;
	} | null;
}

interface EventPaymentsTableProps {
	eventId: string;
}

export function EventPaymentsTable({
	eventId,
}: EventPaymentsTableProps): React.JSX.Element {
	const t = useTranslations("finance.eventPayments");

	const [pageIndex, setPageIndex] = useQueryState(
		"payPageIndex",
		parseAsInteger.withDefault(0).withOptions({ shallow: true }),
	);

	const [pageSize, setPageSize] = useQueryState(
		"payPageSize",
		parseAsInteger
			.withDefault(appConfig.pagination.defaultLimit)
			.withOptions({ shallow: true }),
	);

	const [statusFilter, setStatusFilter] = useQueryState(
		"payStatus",
		parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({ shallow: true }),
	);

	const [methodFilter, setMethodFilter] = useQueryState(
		"payMethod",
		parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({ shallow: true }),
	);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.sportsEvent.listPayments.useQuery(
			{
				eventId,
				limit: pageSize || appConfig.pagination.defaultLimit,
				offset:
					(pageIndex || 0) * (pageSize || appConfig.pagination.defaultLimit),
				filters: {
					status:
						statusFilter && statusFilter.length > 0
							? (statusFilter as typeof EventPaymentStatuses)
							: undefined,
					paymentMethod:
						methodFilter && methodFilter.length > 0
							? (methodFilter as typeof EventPaymentMethods)
							: undefined,
				},
			},
			{
				placeholderData: (prev) => prev,
			},
		);

	const processRefundMutation =
		trpc.organization.sportsEvent.processRefund.useMutation({
			onSuccess: () => {
				toast.success(t("refund.success"));
				utils.organization.sportsEvent.listPayments.invalidate();
				utils.organization.sportsEvent.listRegistrations.invalidate();
				utils.organization.eventOrganization.getProjection.invalidate();
			},
			onError: (error: { message?: string }) => {
				toast.error(error.message || t("refund.error"));
			},
		});

	const columnFilters: ColumnFiltersState = React.useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (statusFilter && statusFilter.length > 0) {
			filters.push({ id: "status", value: statusFilter });
		}
		if (methodFilter && methodFilter.length > 0) {
			filters.push({ id: "paymentMethod", value: methodFilter });
		}
		return filters;
	}, [statusFilter, methodFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const getFilterValue = (id: string): string[] => {
			const filter = filters.find((f) => f.id === id);
			return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
		};

		setStatusFilter(getFilterValue("status"));
		setMethodFilter(getFilterValue("paymentMethod"));

		if (pageIndex !== 0) {
			setPageIndex(0);
		}
	};

	const handleCreatePayment = (): void => {
		NiceModal.show(EventPaymentModal, { eventId });
	};

	const columns: ColumnDef<Payment>[] = [
		{
			accessorKey: "registration",
			header: t("table.registration"),
			cell: ({ row }) => (
				<div className="max-w-[180px]">
					<p className="font-medium text-foreground truncate">
						{row.original.registration?.registrantName ?? "-"}
					</p>
					<p className="text-sm text-muted-foreground truncate">
						{row.original.registration?.registrantEmail ?? "-"}
					</p>
				</div>
			),
		},
		{
			accessorKey: "amount",
			header: ({ column }) => (
				<SortableColumnHeader column={column} title={t("table.amount")} />
			),
			cell: ({ row }) => (
				<span className="font-medium">
					{formatEventPrice(row.original.amount, row.original.currency)}
				</span>
			),
		},
		{
			accessorKey: "paymentMethod",
			header: t("table.method"),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{t(
						`methods.${methodKeys[row.original.paymentMethod] ?? row.original.paymentMethod}`,
					)}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: t("table.status"),
			cell: ({ row }) => (
				<Badge
					className={cn(
						"border-none px-2 py-0.5 font-medium text-xs shadow-none whitespace-nowrap",
						getPaymentStatusColor(row.original.status),
					)}
					variant="outline"
				>
					{getPaymentStatusLabel(row.original.status)}
				</Badge>
			),
		},
		{
			accessorKey: "paymentDate",
			header: t("table.date"),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.paymentDate
						? format(row.original.paymentDate, "dd MMM yyyy")
						: "-"}
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
								<span className="sr-only">{t("table.openMenu")}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{row.original.receiptNumber && (
								<DropdownMenuItem disabled>
									<ReceiptText className="size-4 mr-2" />
									{row.original.receiptNumber}
								</DropdownMenuItem>
							)}
							<DropdownMenuItem
								onClick={() => {
									NiceModal.show(EventPaymentReceiptModal, {
										paymentId: row.original.id,
										hasReceipt: !!row.original.receiptImageKey,
									});
								}}
							>
								<FileTextIcon className="mr-2 size-4" />
								{t("receipt.manage")}
							</DropdownMenuItem>
							{row.original.status === "paid" &&
								(row.original.refundedAmount ?? 0) < row.original.amount && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => {
												NiceModal.show(ConfirmationModal, {
													title: t("refund.confirmTitle"),
													message: t("refund.confirmMessage", {
														amount: formatEventPrice(
															row.original.amount -
																(row.original.refundedAmount ?? 0),
															row.original.currency,
														),
													}),
													confirmLabel: t("refund.confirmLabel"),
													destructive: true,
													onConfirm: () =>
														processRefundMutation.mutate({
															paymentId: row.original.id,
															refundAmount:
																row.original.amount -
																(row.original.refundedAmount ?? 0),
														}),
												});
											}}
											variant="destructive"
										>
											<RotateCcwIcon className="mr-2 size-4" />
											{t("refund.action")}
										</DropdownMenuItem>
									</>
								)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const paymentFilters: FilterConfig[] = [
		{
			key: "status",
			title: t("table.status"),
			options: EventPaymentStatuses.map((status) => ({
				value: status,
				label: getPaymentStatusLabel(status),
			})),
		},
		{
			key: "paymentMethod",
			title: t("table.method"),
			options: EventPaymentMethods.map((method) => ({
				value: method,
				label: t(`methods.${methodKeys[method] ?? method}`),
			})),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button onClick={handleCreatePayment}>
					<Plus className="size-4 mr-2" />
					{t("add")}
				</Button>
			</div>

			<DataTable
				columnFilters={columnFilters}
				columns={columns}
				data={(data?.payments as Payment[]) || []}
				emptyMessage={t("noPayments")}
				enableFilters
				enablePagination
				filters={paymentFilters}
				loading={isPending}
				onFiltersChange={handleFiltersChange}
				onPageIndexChange={setPageIndex}
				onPageSizeChange={setPageSize}
				pageIndex={pageIndex || 0}
				pageSize={pageSize || appConfig.pagination.defaultLimit}
				totalCount={data?.total ?? 0}
			/>
		</div>
	);
}
