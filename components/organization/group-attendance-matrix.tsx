"use client";

import { format } from "date-fns";
import {
	CalendarIcon,
	CheckIcon,
	ClockIcon,
	Loader2Icon,
	ShieldCheckIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user/user-avatar";
import type { AttendanceStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface GroupAttendanceMatrixProps {
	groupId: string;
	members: Array<{
		id: string;
		athlete: {
			id: string;
			user: { id: string; name: string; image: string | null } | null;
		};
	}>;
}

const dotColors: Record<string, { bg: string; dot: string }> = {
	present: {
		bg: "bg-green-100 dark:bg-green-900/50",
		dot: "bg-green-500",
	},
	absent: {
		bg: "bg-red-100 dark:bg-red-900/50",
		dot: "bg-red-500",
	},
	late: {
		bg: "bg-yellow-100 dark:bg-yellow-900/50",
		dot: "bg-yellow-500",
	},
	excused: {
		bg: "bg-blue-100 dark:bg-blue-900/50",
		dot: "bg-blue-500",
	},
};

const statusOptions: Array<{
	value: AttendanceStatus;
	dot: string;
	icon: React.ComponentType<{ className?: string }>;
}> = [
	{ value: "present", dot: "bg-green-500", icon: CheckIcon },
	{ value: "absent", dot: "bg-red-500", icon: XIcon },
	{ value: "late", dot: "bg-yellow-500", icon: ClockIcon },
	{ value: "excused", dot: "bg-blue-500", icon: ShieldCheckIcon },
];

export function GroupAttendanceMatrix({
	groupId,
	members,
}: GroupAttendanceMatrixProps) {
	const t = useTranslations("athletes.groups.profile.attendanceMatrix");

	const utils = trpc.useUtils();

	const { data, isLoading } =
		trpc.organization.attendance.getGroupAttendance.useQuery({ groupId });

	const recordMutation = trpc.organization.attendance.record.useMutation({
		onSuccess: () => {
			utils.organization.attendance.getGroupAttendance.invalidate({
				groupId,
			});
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const attendanceMap = React.useMemo(() => {
		const map = new Map<string, string>();
		if (data?.records) {
			for (const record of data.records) {
				map.set(`${record.athleteId}-${record.sessionId}`, record.status);
			}
		}
		return map;
	}, [data?.records]);

	const handleStatusChange = (
		sessionId: string,
		athleteId: string,
		status: AttendanceStatus,
	) => {
		recordMutation.mutate({ sessionId, athleteId, status });
	};

	if (isLoading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-8 w-full" />
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-12 w-full" />
				))}
			</div>
		);
	}

	const sessions = data?.sessions ?? [];

	if (sessions.length === 0) {
		return <EmptyState icon={CalendarIcon} title={t("noSessions")} />;
	}

	return (
		<div className="space-y-3">
			{/* Matrix table */}
			<div className="overflow-x-auto rounded-lg border">
				<table className="w-full">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="sticky left-0 z-10 min-w-[180px] bg-muted/50 px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								{t("athlete")}
							</th>
							{sessions.map((session) => {
								const date = new Date(session.startTime);
								return (
									<th
										key={session.id}
										className="min-w-[70px] px-2 py-3 text-center text-xs font-medium text-muted-foreground"
									>
										<div className="flex flex-col items-center gap-0.5">
											<span>{format(date, "dd MMM")}</span>
											<span className="text-[10px] opacity-60">
												{format(date, "HH:mm")}
											</span>
										</div>
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody className="divide-y">
						{members.map((member) => (
							<tr key={member.id} className="hover:bg-muted/30">
								<td className="sticky left-0 z-10 bg-background px-4 py-2.5">
									<div className="flex items-center gap-2">
										<UserAvatar
											className="size-7 shrink-0"
											name={member.athlete.user?.name ?? ""}
											src={member.athlete.user?.image ?? undefined}
										/>
										<span className="max-w-[130px] truncate text-sm font-medium">
											{member.athlete.user?.name ?? "Unknown"}
										</span>
									</div>
								</td>
								{sessions.map((session) => {
									const status = attendanceMap.get(
										`${member.athlete.id}-${session.id}`,
									);
									const isMutating =
										recordMutation.isPending &&
										recordMutation.variables?.sessionId === session.id &&
										recordMutation.variables?.athleteId === member.athlete.id;
									return (
										<td key={session.id} className="px-2 py-2.5 text-center">
											<StatusDotPopover
												status={status}
												isMutating={isMutating}
												onStatusChange={(newStatus) =>
													handleStatusChange(
														session.id,
														member.athlete.id,
														newStatus,
													)
												}
												t={t}
											/>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Legend */}
			<div className="flex flex-wrap items-center gap-4 px-1 text-xs text-muted-foreground">
				{(
					[
						{ key: "present", color: "bg-green-500" },
						{ key: "absent", color: "bg-red-500" },
						{ key: "late", color: "bg-yellow-500" },
						{ key: "excused", color: "bg-blue-500" },
						{ key: "pending", color: "bg-gray-400" },
					] as const
				).map((item) => (
					<div key={item.key} className="flex items-center gap-1.5">
						<span className={cn("size-2 rounded-full", item.color)} />
						<span>{t(item.key)}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function StatusDotPopover({
	status,
	isMutating,
	onStatusChange,
	t,
}: {
	status?: string;
	isMutating: boolean;
	onStatusChange: (status: AttendanceStatus) => void;
	t: (key: string) => string;
}) {
	const [open, setOpen] = React.useState(false);
	const colors = status && status !== "pending" ? dotColors[status] : null;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"inline-flex size-7 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						colors?.bg ?? "bg-gray-100 dark:bg-gray-800",
					)}
				>
					{isMutating ? (
						<Loader2Icon className="size-3 animate-spin text-muted-foreground" />
					) : (
						<span
							className={cn(
								"size-2 rounded-full",
								colors?.dot ?? "bg-gray-400",
							)}
						/>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto min-w-[140px] p-1.5"
				side="bottom"
				align="center"
			>
				<div className="flex flex-col gap-0.5">
					{statusOptions.map((option) => {
						const isActive = status === option.value;
						const Icon = option.icon;
						return (
							<button
								key={option.value}
								type="button"
								className={cn(
									"flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent",
									isActive && "bg-accent font-medium",
								)}
								onClick={() => {
									onStatusChange(option.value);
									setOpen(false);
								}}
							>
								<span
									className={cn("size-2 shrink-0 rounded-full", option.dot)}
								/>
								<span className="flex-1">{t(option.value)}</span>
								{isActive && (
									<Icon className="size-3.5 text-muted-foreground" />
								)}
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
