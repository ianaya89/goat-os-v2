"use client";

import NiceModal from "@ebay/nice-modal-react";
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import {
	endOfDay,
	endOfMonth,
	endOfWeek,
	format,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import {
	AlertCircleIcon,
	CalendarDaysIcon,
	CalendarIcon,
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	MailIcon,
	MessageSquareIcon,
	PhoneIcon,
	RefreshCwIcon,
	SendIcon,
	XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
	parseAsInteger,
	parseAsString,
	parseAsStringEnum,
	useQueryState,
} from "nuqs";
import type * as React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DataTable,
	type FilterConfig,
} from "@/components/ui/custom/data-table";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { appConfig } from "@/config/app.config";
import { trpc } from "@/trpc/client";

type Channel = "email" | "sms" | "whatsapp";
type Scope = "today" | "week";
type Period = "today" | "thisWeek" | "thisMonth" | "allTime";
type ConfirmationStatusFilter = "sent" | "delivered" | "failed" | "confirmed";

interface ConfirmationHistoryItem {
	id: string;
	sessionId: string;
	athleteId: string;
	channel: string;
	status: string;
	sentAt: Date;
	confirmedAt: Date | null;
	errorMessage: string | null;
	batchId: string | null;
	session?: {
		title: string;
		startTime: Date;
	};
	athlete?: {
		name: string;
		email: string | null;
		phone: string | null;
	};
}

export function ConfirmationsView(): React.JSX.Element {
	const t = useTranslations("confirmations");
	const [selectedChannel, setSelectedChannel] = useState<Channel>("email");
	const [sendingScope, setSendingScope] = useState<Scope | null>(null);

	// Query state for period filter with default "today"
	const [period, setPeriod] = useQueryState(
		"period",
		parseAsStringEnum<Period>(["today", "thisWeek", "thisMonth", "allTime"])
			.withDefault("today")
			.withOptions({ shallow: true }),
	);

	// Query state for status filter
	const [statusFilter, setStatusFilter] = useQueryState(
		"status",
		parseAsString.withDefault("").withOptions({ shallow: true }),
	);

	// Pagination state
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

	// Calculate date range based on period
	const dateRange = useMemo(() => {
		const now = new Date();

		switch (period) {
			case "today":
				return { from: startOfDay(now), to: endOfDay(now) };
			case "thisWeek":
				return {
					from: startOfWeek(now, { weekStartsOn: 1 }),
					to: endOfWeek(now, { weekStartsOn: 1 }),
				};
			case "thisMonth":
				return { from: startOfMonth(now), to: endOfMonth(now) };
			case "allTime":
			default:
				return undefined;
		}
	}, [period]);

	// Fetch stats
	const { data: stats, isLoading: isLoadingStats } =
		trpc.organization.confirmation.getStats.useQuery({
			dateRange,
		});

	// Fetch history with filters
	const { data: history, isLoading: isLoadingHistory } =
		trpc.organization.confirmation.getHistory.useQuery({
			limit: pageSize ?? appConfig.pagination.defaultLimit,
			offset:
				(pageIndex ?? 0) * (pageSize ?? appConfig.pagination.defaultLimit),
			status: (statusFilter || undefined) as
				| ConfirmationStatusFilter
				| undefined,
			dateRange,
		});

	// Preview counts for today and week
	const { data: previewToday } =
		trpc.organization.confirmation.previewBulk.useQuery({ scope: "today" });
	const { data: previewWeek } =
		trpc.organization.confirmation.previewBulk.useQuery({ scope: "week" });

	// Send bulk mutation
	const sendBulk = trpc.organization.confirmation.sendBulk.useMutation({
		onSuccess: (data) => {
			toast.success(t("bulkSend.success", { count: data.sent }));
			utils.organization.confirmation.getStats.invalidate();
			utils.organization.confirmation.getHistory.invalidate();
			utils.organization.confirmation.previewBulk.invalidate();
			setSendingScope(null);
		},
		onError: () => {
			toast.error(t("bulkSend.error"));
			setSendingScope(null);
		},
	});

	// Resend mutation
	const resend = trpc.organization.confirmation.resend.useMutation({
		onSuccess: () => {
			toast.success(t("history.resendSuccess"));
			utils.organization.confirmation.getHistory.invalidate();
		},
		onError: () => {
			toast.error(t("history.resendError"));
		},
	});

	const handleSendBulk = (scope: Scope) => {
		const preview = scope === "today" ? previewToday : previewWeek;
		const count = preview?.athleteCount ?? 0;

		if (count === 0) {
			toast.error(t("bulkSend.noSessions"));
			return;
		}

		NiceModal.show(ConfirmationModal, {
			title: t("bulkSend.confirmTitle"),
			message: t("bulkSend.confirmMessage", {
				count,
				channel: t(`channels.${selectedChannel}`),
			}),
			confirmLabel: t("bulkSend.confirmButton"),
			onConfirm: () => {
				setSendingScope(scope);
				sendBulk.mutate({ scope, channel: selectedChannel });
			},
		});
	};

	const handleResend = (historyId: string) => {
		resend.mutate({ historyId });
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "confirmed":
				return (
					<Badge variant="default" className="bg-green-500">
						<CheckCircle2Icon className="mr-1 size-3" />
						{t("status.confirmed")}
					</Badge>
				);
			case "sent":
				return (
					<Badge variant="secondary">
						<ClockIcon className="mr-1 size-3" />
						{t("status.sent")}
					</Badge>
				);
			case "failed":
				return (
					<Badge variant="destructive">
						<XCircleIcon className="mr-1 size-3" />
						{t("status.failed")}
					</Badge>
				);
			case "delivered":
				return (
					<Badge variant="outline">
						<CheckCircle2Icon className="mr-1 size-3" />
						{t("status.delivered")}
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	const getChannelIcon = (channel: string) => {
		switch (channel) {
			case "email":
				return <MailIcon className="size-4" />;
			case "whatsapp":
				return <PhoneIcon className="size-4" />;
			case "sms":
				return <MessageSquareIcon className="size-4" />;
			default:
				return <MailIcon className="size-4" />;
		}
	};

	// Column filters state
	const columnFilters: ColumnFiltersState = useMemo(() => {
		const filters: ColumnFiltersState = [];
		if (period && period !== "allTime") {
			filters.push({ id: "period", value: [period] });
		}
		if (statusFilter) {
			filters.push({ id: "status", value: [statusFilter] });
		}
		return filters;
	}, [period, statusFilter]);

	const handleFiltersChange = (filters: ColumnFiltersState): void => {
		const periodFilterValue = filters.find((f) => f.id === "period");
		const newPeriod = Array.isArray(periodFilterValue?.value)
			? (periodFilterValue.value[0] as Period)
			: "allTime";
		setPeriod(newPeriod);

		const statusFilterValue = filters.find((f) => f.id === "status");
		const newStatus = Array.isArray(statusFilterValue?.value)
			? (statusFilterValue.value[0] as string)
			: "";
		setStatusFilter(newStatus);

		if (pageIndex !== 0) {
			setPageIndex(0);
		}
	};

	// Define columns for DataTable
	const columns: ColumnDef<ConfirmationHistoryItem>[] = [
		{
			accessorKey: "session",
			header: t("history.session"),
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="font-medium">
						{row.original.session?.title ?? "-"}
					</span>
					{row.original.session?.startTime && (
						<span className="text-muted-foreground text-xs">
							{format(new Date(row.original.session.startTime), "MMM d, HH:mm")}
						</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "athlete",
			header: t("history.athlete"),
			cell: ({ row }) => (
				<span className="font-medium">{row.original.athlete?.name ?? "-"}</span>
			),
		},
		{
			accessorKey: "channel",
			header: t("history.channel"),
			cell: ({ row }) => {
				const channel = row.original.channel;
				const athlete = row.original.athlete;
				const contactInfo =
					channel === "email" ? athlete?.email : athlete?.phone;

				return (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							{getChannelIcon(channel)}
							<span>{t(`channels.${channel}`)}</span>
						</div>
						{contactInfo && (
							<span className="text-muted-foreground text-xs truncate max-w-[180px]">
								{contactInfo}
							</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: "status",
			header: t("history.status"),
			cell: ({ row }) => {
				const status = row.original.status;
				const errorMessage = row.original.errorMessage;

				if (status === "failed" && errorMessage) {
					return (
						<div className="flex items-center gap-2">
							{getStatusBadge(status)}
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="ghost" size="icon" className="size-6">
										<AlertCircleIcon className="size-4 text-destructive" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="max-w-sm" side="top" align="start">
									<div className="space-y-2">
										<p className="text-sm font-medium">Error Details</p>
										<p className="text-muted-foreground text-xs break-all">
											{errorMessage}
										</p>
									</div>
								</PopoverContent>
							</Popover>
						</div>
					);
				}

				return getStatusBadge(status);
			},
		},
		{
			accessorKey: "sentAt",
			header: t("history.sentAt"),
			cell: ({ row }) => (
				<span className="text-sm">
					{format(new Date(row.original.sentAt), "MMM d, HH:mm")}
				</span>
			),
		},
		{
			accessorKey: "confirmedAt",
			header: t("history.confirmedAt"),
			cell: ({ row }) => (
				<span className="text-sm">
					{row.original.confirmedAt
						? format(new Date(row.original.confirmedAt), "MMM d, HH:mm")
						: "-"}
				</span>
			),
		},
		{
			id: "actions",
			enableSorting: false,
			cell: ({ row }) =>
				row.original.status !== "confirmed" && (
					<div className="flex justify-end">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleResend(row.original.id)}
									disabled={resend.isPending}
								>
									<RefreshCwIcon className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("history.resend")}</TooltipContent>
						</Tooltip>
					</div>
				),
		},
	];

	// Filter configuration
	const filters: FilterConfig[] = [
		{
			key: "period",
			title: t("filters.period"),
			singleSelect: true,
			options: [
				{ value: "today", label: t("filters.today") },
				{ value: "thisWeek", label: t("filters.thisWeek") },
				{ value: "thisMonth", label: t("filters.thisMonth") },
				{ value: "allTime", label: t("filters.allTime") },
			],
		},
		{
			key: "status",
			title: t("history.status"),
			options: [
				{ value: "sent", label: t("status.sent") },
				{ value: "delivered", label: t("status.delivered") },
				{ value: "confirmed", label: t("status.confirmed") },
				{ value: "failed", label: t("status.failed") },
			],
		},
	];

	return (
		<div className="space-y-6">
			{/* Stats Row */}
			<div className="flex flex-wrap items-center gap-6 text-sm">
				{isLoadingStats ? (
					<>
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-5 w-24" />
						<Skeleton className="h-5 w-24" />
					</>
				) : (
					<>
						<div className="flex items-center gap-2">
							<SendIcon className="text-muted-foreground size-4" />
							<span className="text-muted-foreground">
								{t("stats.totalSent")}:
							</span>
							<span className="font-semibold">{stats?.totalSent ?? 0}</span>
						</div>
						<div className="flex items-center gap-2">
							<CheckCircle2Icon className="size-4 text-green-500" />
							<span className="text-muted-foreground">
								{t("stats.confirmed")}:
							</span>
							<span className="font-semibold">{stats?.confirmed ?? 0}</span>
						</div>
						<div className="flex items-center gap-2">
							<ClockIcon className="size-4 text-yellow-500" />
							<span className="text-muted-foreground">
								{t("stats.pending")}:
							</span>
							<span className="font-semibold">{stats?.pending ?? 0}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">
								{t("stats.confirmationRate")}:
							</span>
							<span className="font-semibold">
								{stats?.confirmationRate ?? 0}%
							</span>
						</div>
					</>
				)}
			</div>

			{/* Bulk Send Actions */}
			<div className="flex flex-wrap items-center gap-3">
				<Select
					value={selectedChannel}
					onValueChange={(v) => setSelectedChannel(v as Channel)}
				>
					<SelectTrigger className="h-9 w-[140px]">
						<SelectValue placeholder={t("bulkSend.channel")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="email">
							<div className="flex items-center gap-2">
								<MailIcon className="size-4" />
								{t("channels.email")}
							</div>
						</SelectItem>
						<SelectItem value="whatsapp">
							<div className="flex items-center gap-2">
								<PhoneIcon className="size-4" />
								{t("channels.whatsapp")}
							</div>
						</SelectItem>
						<SelectItem value="sms">
							<div className="flex items-center gap-2">
								<MessageSquareIcon className="size-4" />
								{t("channels.sms")}
							</div>
						</SelectItem>
					</SelectContent>
				</Select>

				<Button
					size="sm"
					onClick={() => handleSendBulk("today")}
					disabled={sendBulk.isPending}
				>
					{sendingScope === "today" ? (
						<Loader2Icon className="mr-1.5 size-4 animate-spin" />
					) : (
						<CalendarIcon className="mr-1.5 size-4" />
					)}
					{t("bulkSend.today")}
				</Button>

				<Button
					size="sm"
					variant="outline"
					onClick={() => handleSendBulk("week")}
					disabled={sendBulk.isPending}
				>
					{sendingScope === "week" ? (
						<Loader2Icon className="mr-1.5 size-4 animate-spin" />
					) : (
						<CalendarDaysIcon className="mr-1.5 size-4" />
					)}
					{t("bulkSend.week")}
				</Button>
			</div>

			{/* History Table with DataTable */}
			<div>
				<h3 className="mb-4 text-lg font-semibold">{t("history.title")}</h3>
				<DataTable
					columns={columns}
					data={(history?.items as ConfirmationHistoryItem[]) ?? []}
					emptyMessage={t("history.empty")}
					enableFilters
					enablePagination
					filters={filters}
					loading={isLoadingHistory}
					columnFilters={columnFilters}
					onFiltersChange={handleFiltersChange}
					onPageIndexChange={setPageIndex}
					onPageSizeChange={setPageSize}
					pageIndex={pageIndex ?? 0}
					pageSize={pageSize ?? appConfig.pagination.defaultLimit}
					totalCount={history?.total ?? 0}
					searchPlaceholder={t("table.searchPlaceholder")}
				/>
			</div>
		</div>
	);
}
