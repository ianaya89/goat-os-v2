"use client";

import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, RefreshCwIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
	DataTable,
	type FilterConfig,
} from "@/components/ui/custom/data-table";
import {
	type CashMovementReferenceType,
	CashMovementReferenceTypes,
	CashMovementType,
	CashMovementTypes,
} from "@/lib/db/schema/enums";
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

const movementTypeIcons: Record<string, React.ReactNode> = {
	income: <ArrowUpIcon className="size-4" />,
	expense: <ArrowDownIcon className="size-4" />,
	adjustment: <RefreshCwIcon className="size-4" />,
};

const movementTypeColors: Record<string, string> = {
	income: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	expense: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
	adjustment: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};

const referenceTypeColors: Record<string, string> = {
	payment:
		"bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
	event_payment:
		"bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
	expense:
		"bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
	manual: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
	product_sale: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
};

interface CashMovementsTableProps {
	cashRegisterId: string;
}

export function CashMovementsTable({
	cashRegisterId,
}: CashMovementsTableProps): React.JSX.Element {
	const t = useTranslations("finance.cashRegister");
	const locale = useLocale();

	const [typeFilter, setTypeFilter] = React.useState<string[]>([]);
	const [referenceTypeFilter, setReferenceTypeFilter] = React.useState<
		string[]
	>([]);

	const { data, isPending } =
		trpc.organization.cashRegister.getMovements.useQuery({
			cashRegisterId,
			limit: 100,
			offset: 0,
			type:
				typeFilter.length > 0 ? (typeFilter as CashMovementType[]) : undefined,
			referenceType:
				referenceTypeFilter.length > 0
					? (referenceTypeFilter as CashMovementReferenceType[])
					: undefined,
		});

	const formatAmount = (amount: number, type: string) => {
		const formatted = new Intl.NumberFormat(
			locale === "es" ? "es-AR" : "en-US",
			{
				style: "currency",
				currency: "ARS",
			},
		).format(amount / 100);
		return type === CashMovementType.expense ? `-${formatted}` : formatted;
	};

	const columnFilters: ColumnFiltersState = React.useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (typeFilter.length > 0) {
			filters.push({ id: "type", value: typeFilter });
		}
		if (referenceTypeFilter.length > 0) {
			filters.push({ id: "referenceType", value: referenceTypeFilter });
		}
		return filters;
	}, [typeFilter, referenceTypeFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const typeValues = filters.find((f) => f.id === "type");
		setTypeFilter(
			Array.isArray(typeValues?.value) ? (typeValues.value as string[]) : [],
		);
		const refValues = filters.find((f) => f.id === "referenceType");
		setReferenceTypeFilter(
			Array.isArray(refValues?.value) ? (refValues.value as string[]) : [],
		);
	};

	const movementFilters: FilterConfig[] = [
		{
			key: "type",
			title: t("filterType"),
			options: CashMovementTypes.map((type) => ({
				value: type,
				label: t.has(`types.${type}`)
					? t(`types.${type}` as "types.income")
					: type,
			})),
		},
		{
			key: "referenceType",
			title: t("filterOrigin"),
			options: CashMovementReferenceTypes.map((refType) => ({
				value: refType,
				label: t.has(`referenceTypes.${refType}`)
					? t(`referenceTypes.${refType}` as "referenceTypes.manual")
					: refType,
			})),
		},
	];

	const columns: ColumnDef<CashMovement>[] = [
		{
			accessorKey: "type",
			header: t("table.type"),
			cell: ({ row }) => {
				const type = row.original.type;
				const icon = movementTypeIcons[type];
				const color = movementTypeColors[type];
				const label = t.has(`types.${type}`)
					? t(`types.${type}` as "types.income")
					: type;
				return icon ? (
					<Badge
						className={cn(
							"flex w-fit items-center gap-1.5 border-none px-2 py-0.5 font-medium text-xs shadow-none",
							color,
						)}
						variant="outline"
					>
						{icon}
						{label}
					</Badge>
				) : (
					<span>{type}</span>
				);
			},
		},
		{
			accessorKey: "description",
			header: t("table.description"),
			cell: ({ row }) => {
				const refType = row.original.referenceType;
				const refLabel = t.has(`referenceTypeBadge.${refType}`)
					? t(`referenceTypeBadge.${refType}` as "referenceTypeBadge.manual")
					: refType;
				const refColor =
					referenceTypeColors[refType] ?? referenceTypeColors.manual;
				return (
					<div className="flex flex-col gap-1">
						<span
							className="block max-w-[200px] truncate font-medium text-foreground"
							title={row.original.description}
						>
							{row.original.description}
						</span>
						<Badge
							className={cn(
								"w-fit border-none px-1.5 py-0 font-normal text-[11px] shadow-none",
								refColor,
							)}
							variant="outline"
						>
							{refLabel}
						</Badge>
					</div>
				);
			},
		},
		{
			accessorKey: "amount",
			header: t("table.amount"),
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
			header: t("table.time"),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{format(row.original.createdAt, "HH:mm")}
				</span>
			),
		},
		{
			accessorKey: "recordedByUser",
			header: t("table.recordedBy"),
			cell: ({ row }) => (
				<span className="text-foreground/80">
					{row.original.recordedByUser?.name ?? "-"}
				</span>
			),
		},
	];

	return (
		<DataTable
			columnFilters={columnFilters}
			columns={columns}
			data={(data?.movements as CashMovement[]) || []}
			emptyMessage={t("movements.empty")}
			enableFilters
			enableSearch
			filters={movementFilters}
			loading={isPending}
			onFiltersChange={handleFiltersChange}
			searchPlaceholder={t("search")}
			totalCount={data?.total ?? 0}
		/>
	);
}
