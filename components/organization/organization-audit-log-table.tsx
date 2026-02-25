"use client";

import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DataTable,
	type FilterConfig,
} from "@/components/ui/custom/data-table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	type AuditAction,
	AuditActions,
	type AuditEntityType,
	AuditEntityTypes,
} from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

type AuditLogEntry = {
	id: string;
	action: string;
	entityType: string;
	entityId: string;
	changes: {
		before?: Record<string, unknown>;
		after?: Record<string, unknown>;
		diff?: Record<string, { from: unknown; to: unknown }>;
	} | null;
	metadata: {
		ipAddress?: string | null;
		userAgent?: string | null;
		impersonatedBy?: string | null;
		procedurePath?: string;
	} | null;
	createdAt: Date;
	userId: string;
	userName: string | null;
	userEmail: string | null;
	userImage: string | null;
};

function getActionVariant(action: string) {
	if (action.includes("delete")) return "destructive";
	if (action.includes("create")) return "default";
	if (action.includes("archive")) return "secondary";
	return "outline";
}

function AuditLogDetailDialog({
	entry,
	open,
	onOpenChange,
}: {
	entry: AuditLogEntry | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const t = useTranslations("auditLog");

	if (!entry) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t("detail.title")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="font-medium text-muted-foreground">
								{t("detail.user")}
							</span>
							<p>{entry.userName ?? entry.userEmail ?? entry.userId}</p>
						</div>
						<div>
							<span className="font-medium text-muted-foreground">
								{t("detail.date")}
							</span>
							<p>{new Date(entry.createdAt).toLocaleString()}</p>
						</div>
						<div>
							<span className="font-medium text-muted-foreground">
								{t("detail.action")}
							</span>
							<p>
								<Badge variant={getActionVariant(entry.action)}>
									{t(`actions.${entry.action}` as Parameters<typeof t>[0])}
								</Badge>
							</p>
						</div>
						<div>
							<span className="font-medium text-muted-foreground">
								{t("detail.entityType")}
							</span>
							<p>
								{t(
									`entityTypes.${entry.entityType}` as Parameters<typeof t>[0],
								)}
							</p>
						</div>
						<div className="col-span-2">
							<span className="font-medium text-muted-foreground">
								{t("detail.entityId")}
							</span>
							<p className="font-mono text-xs break-all">{entry.entityId}</p>
						</div>
					</div>

					{entry.metadata && (
						<div className="space-y-2">
							<h4 className="font-medium text-sm">{t("detail.metadata")}</h4>
							<div className="rounded-md border p-3 text-sm space-y-1">
								{entry.metadata.procedurePath && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											{t("detail.procedurePath")}
										</span>
										<span className="font-mono text-xs">
											{entry.metadata.procedurePath}
										</span>
									</div>
								)}
								{entry.metadata.ipAddress && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											{t("detail.ipAddress")}
										</span>
										<span className="font-mono text-xs">
											{entry.metadata.ipAddress}
										</span>
									</div>
								)}
								{entry.metadata.impersonatedBy && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											{t("detail.impersonatedBy")}
										</span>
										<span className="font-mono text-xs">
											{entry.metadata.impersonatedBy}
										</span>
									</div>
								)}
							</div>
						</div>
					)}

					{entry.changes?.diff &&
						Object.keys(entry.changes.diff).length > 0 && (
							<div className="space-y-2">
								<h4 className="font-medium text-sm">{t("detail.diff")}</h4>
								<div className="rounded-md border overflow-hidden">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b bg-muted/50">
												<th className="text-left p-2 font-medium">
													{t("detail.field")}
												</th>
												<th className="text-left p-2 font-medium">
													{t("detail.from")}
												</th>
												<th className="text-left p-2 font-medium">
													{t("detail.to")}
												</th>
											</tr>
										</thead>
										<tbody>
											{Object.entries(entry.changes.diff).map(
												([field, change]) => (
													<tr key={field} className="border-b last:border-b-0">
														<td className="p-2 font-mono text-xs">{field}</td>
														<td className="p-2 text-xs text-red-600 dark:text-red-400">
															{JSON.stringify(change.from)}
														</td>
														<td className="p-2 text-xs text-green-600 dark:text-green-400">
															{JSON.stringify(change.to)}
														</td>
													</tr>
												),
											)}
										</tbody>
									</table>
								</div>
							</div>
						)}

					{!entry.changes?.diff && (
						<p className="text-sm text-muted-foreground">
							{t("detail.noChanges")}
						</p>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function OrganizationAuditLogTable() {
	const t = useTranslations("auditLog");

	const [queryState, setQueryState] = useQueryStates({
		page: parseAsInteger.withDefault(0),
		pageSize: parseAsInteger.withDefault(25),
		action: parseAsString.withDefault(""),
		entityType: parseAsString.withDefault(""),
	});

	const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(
		null,
	);
	const [detailOpen, setDetailOpen] = useState(false);

	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

	const { data, isPending } = trpc.organization.auditLog.list.useQuery({
		limit: queryState.pageSize,
		offset: queryState.page * queryState.pageSize,
		action: (queryState.action || undefined) as AuditAction | undefined,
		entityType: (queryState.entityType || undefined) as
			| AuditEntityType
			| undefined,
	});

	const actionFilterOptions = useMemo(
		() =>
			AuditActions.map((action) => ({
				value: action,
				label: t(`actions.${action}` as Parameters<typeof t>[0]),
			})),
		[t],
	);

	const entityTypeFilterOptions = useMemo(
		() =>
			AuditEntityTypes.map((entityType) => ({
				value: entityType,
				label: t(`entityTypes.${entityType}` as Parameters<typeof t>[0]),
			})),
		[t],
	);

	const filters: FilterConfig[] = useMemo(
		() => [
			{
				key: "action",
				title: t("filters.action"),
				options: actionFilterOptions,
				singleSelect: true,
			},
			{
				key: "entityType",
				title: t("filters.entityType"),
				options: entityTypeFilterOptions,
				singleSelect: true,
			},
		],
		[t, actionFilterOptions, entityTypeFilterOptions],
	);

	const columns: ColumnDef<AuditLogEntry>[] = useMemo(
		() => [
			{
				accessorKey: "userName",
				header: t("table.columns.user"),
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<Avatar className="h-6 w-6">
							<AvatarImage src={row.original.userImage ?? undefined} />
							<AvatarFallback className="text-xs">
								{(row.original.userName ?? row.original.userEmail ?? "?")
									.charAt(0)
									.toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<span className="text-sm truncate max-w-[150px]">
							{row.original.userName ?? row.original.userEmail}
						</span>
					</div>
				),
			},
			{
				accessorKey: "action",
				header: t("table.columns.action"),
				cell: ({ row }) => (
					<Badge variant={getActionVariant(row.original.action)}>
						{t(`actions.${row.original.action}` as Parameters<typeof t>[0])}
					</Badge>
				),
			},
			{
				accessorKey: "entityType",
				header: t("table.columns.entityType"),
				cell: ({ row }) => (
					<span className="text-sm">
						{t(
							`entityTypes.${row.original.entityType}` as Parameters<
								typeof t
							>[0],
						)}
					</span>
				),
			},
			{
				accessorKey: "entityId",
				header: t("table.columns.entityId"),
				cell: ({ row }) => (
					<span className="font-mono text-xs truncate max-w-[120px] block">
						{row.original.entityId.length > 36
							? `${row.original.entityId.substring(0, 8)}... (${row.original.entityId.split(",").length})`
							: row.original.entityId.substring(0, 8)}
					</span>
				),
			},
			{
				accessorKey: "createdAt",
				header: t("table.columns.date"),
				cell: ({ row }) => (
					<span className="text-sm text-muted-foreground">
						{new Date(row.original.createdAt).toLocaleString()}
					</span>
				),
			},
			{
				id: "details",
				header: t("table.columns.details"),
				cell: ({ row }) => (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setSelectedEntry(row.original);
							setDetailOpen(true);
						}}
					>
						<EyeIcon className="size-4" />
					</Button>
				),
			},
		],
		[t],
	);

	return (
		<>
			<DataTable<AuditLogEntry>
				data={data?.logs ?? []}
				columns={columns}
				loading={isPending}
				totalCount={data?.total ?? 0}
				pageIndex={queryState.page}
				pageSize={queryState.pageSize}
				onPageIndexChange={(page) => setQueryState({ page })}
				onPageSizeChange={(pageSize) => setQueryState({ pageSize, page: 0 })}
				filters={filters}
				columnFilters={columnFilters}
				onFiltersChange={(newFilters) => {
					setColumnFilters(newFilters);
					const actionFilter = newFilters.find((f) => f.id === "action");
					const entityTypeFilter = newFilters.find(
						(f) => f.id === "entityType",
					);
					setQueryState({
						action: (actionFilter?.value as string[])?.at(0) ?? "",
						entityType: (entityTypeFilter?.value as string[])?.at(0) ?? "",
						page: 0,
					});
				}}
				enableRowSelection={false}
				enableSearch={false}
				emptyMessage={t("table.empty")}
			/>
			<AuditLogDetailDialog
				entry={selectedEntry}
				open={detailOpen}
				onOpenChange={setDetailOpen}
			/>
		</>
	);
}
