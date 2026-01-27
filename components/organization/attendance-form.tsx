"use client";

import { format } from "date-fns";
import {
	CheckIcon,
	ChevronDownIcon,
	ClockIcon,
	MessageSquareIcon,
	ShieldCheckIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user/user-avatar";
import { AttendanceStatus, AttendanceStatuses } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface AttendanceFormProps {
	sessionId: string;
}

const statusConfig: Record<
	string,
	{
		icon: React.ReactNode;
		activeClass: string;
		hoverClass: string;
	}
> = {
	present: {
		icon: <CheckIcon className="size-3.5" />,
		activeClass:
			"bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
		hoverClass:
			"hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/30",
	},
	absent: {
		icon: <XIcon className="size-3.5" />,
		activeClass:
			"bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800",
		hoverClass: "hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30",
	},
	late: {
		icon: <ClockIcon className="size-3.5" />,
		activeClass:
			"bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800",
		hoverClass:
			"hover:bg-yellow-50 hover:text-yellow-700 dark:hover:bg-yellow-900/30",
	},
	excused: {
		icon: <ShieldCheckIcon className="size-3.5" />,
		activeClass:
			"bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800",
		hoverClass:
			"hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30",
	},
};

export function AttendanceForm({ sessionId }: AttendanceFormProps) {
	const t = useTranslations("training.attendance");
	const utils = trpc.useUtils();
	const [expandedNotes, setExpandedNotes] = React.useState<string | null>(null);
	const [notesValues, setNotesValues] = React.useState<Record<string, string>>(
		{},
	);

	const { data: session, isLoading: sessionLoading } =
		trpc.organization.trainingSession.get.useQuery({ id: sessionId });

	const { data: attendanceRecords, isLoading: attendanceLoading } =
		trpc.organization.attendance.getSessionAttendance.useQuery({ sessionId });

	const recordAttendanceMutation =
		trpc.organization.attendance.record.useMutation({
			onSuccess: () => {
				toast.success(t("recorded"));
				utils.organization.attendance.getSessionAttendance.invalidate({
					sessionId,
				});
			},
			onError: (error) => {
				toast.error(error.message || t("recordFailed"));
			},
		});

	const bulkRecordMutation =
		trpc.organization.attendance.bulkRecord.useMutation({
			onSuccess: (result) => {
				toast.success(t("recordedBulk", { count: result.count }));
				utils.organization.attendance.getSessionAttendance.invalidate({
					sessionId,
				});
			},
			onError: (error) => {
				toast.error(error.message || t("recordFailed"));
			},
		});

	const athletes = React.useMemo(() => {
		if (!session) return [];

		if (session.athleteGroup?.members) {
			return session.athleteGroup.members.map((m) => ({
				id: m.athlete.id,
				name: m.athlete.user?.name ?? "Unknown",
				image: m.athlete.user?.image ?? null,
			}));
		}

		return session.athletes.map((a) => ({
			id: a.athlete.id,
			name: a.athlete.user?.name ?? "Unknown",
			image: a.athlete.user?.image ?? null,
		}));
	}, [session]);

	const attendanceMap = React.useMemo(() => {
		const map = new Map<
			string,
			{
				id: string;
				status: string;
				notes: string | null;
				checkedInAt: Date | null;
			}
		>();
		if (attendanceRecords) {
			for (const record of attendanceRecords) {
				map.set(record.athleteId, {
					id: record.id,
					status: record.status,
					notes: record.notes,
					checkedInAt: record.checkedInAt,
				});
			}
		}
		return map;
	}, [attendanceRecords]);

	if (sessionLoading || attendanceLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-20 w-full" />
				))}
			</div>
		);
	}

	const handleStatusChange = (athleteId: string, status: AttendanceStatus) => {
		recordAttendanceMutation.mutate({ sessionId, athleteId, status });
	};

	const handleNotesSubmit = (athleteId: string) => {
		const notes = notesValues[athleteId] ?? "";
		recordAttendanceMutation.mutate({
			sessionId,
			athleteId,
			status:
				(attendanceMap.get(athleteId)?.status as AttendanceStatus) ??
				AttendanceStatus.pending,
			notes,
		});
		setExpandedNotes(null);
	};

	const handleMarkAllPresent = () => {
		const records = athletes.map((athlete) => ({
			athleteId: athlete.id,
			status: AttendanceStatus.present as AttendanceStatus,
		}));
		bulkRecordMutation.mutate({ sessionId, records });
	};

	const handleMarkAllAbsent = () => {
		const records = athletes.map((athlete) => ({
			athleteId: athlete.id,
			status: AttendanceStatus.absent as AttendanceStatus,
		}));
		bulkRecordMutation.mutate({ sessionId, records });
	};

	if (athletes.length === 0) {
		return <EmptyState icon={UsersIcon} title={t("noAthletes")} />;
	}

	const presentCount = [...attendanceMap.values()].filter(
		(a) => a.status === "present",
	).length;
	const absentCount = [...attendanceMap.values()].filter(
		(a) => a.status === "absent",
	).length;

	const toggleNotes = (athleteId: string) => {
		if (expandedNotes === athleteId) {
			setExpandedNotes(null);
		} else {
			setExpandedNotes(athleteId);
			const existing = attendanceMap.get(athleteId)?.notes ?? "";
			setNotesValues((prev) => ({ ...prev, [athleteId]: existing }));
		}
	};

	return (
		<div className="space-y-4">
			{/* Summary + bulk actions */}
			<div className="flex items-center justify-between">
				<p className="text-muted-foreground text-sm">
					{t("summary", {
						present: presentCount,
						absent: absentCount,
						total: athletes.length,
					})}
				</p>
				<div className="flex gap-1.5">
					<Button
						variant="outline"
						size="sm"
						onClick={handleMarkAllPresent}
						disabled={bulkRecordMutation.isPending}
						className="h-7 gap-1.5 rounded-full px-3 text-xs"
					>
						<CheckIcon className="size-3" />
						{t("allPresent")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleMarkAllAbsent}
						disabled={bulkRecordMutation.isPending}
						className="h-7 gap-1.5 rounded-full px-3 text-xs"
					>
						<XIcon className="size-3" />
						{t("allAbsent")}
					</Button>
				</div>
			</div>

			{/* Athlete list */}
			<div className="divide-y rounded-lg border">
				{athletes.map((athlete) => {
					const attendance = attendanceMap.get(athlete.id);
					const currentStatus = attendance?.status ?? "pending";
					const isNotesExpanded = expandedNotes === athlete.id;
					const hasNotes = !!attendance?.notes;

					return (
						<div key={athlete.id} className="group">
							{/* Main row */}
							<div className="flex items-center gap-3 px-4 py-3">
								{/* Avatar + Name */}
								<div className="flex min-w-0 flex-1 items-center gap-3">
									<UserAvatar
										className="size-8 shrink-0"
										name={athlete.name}
										src={athlete.image ?? undefined}
									/>
									<div className="min-w-0">
										<p className="truncate font-medium text-sm">
											{athlete.name}
										</p>
										{attendance?.checkedInAt && (
											<p className="text-muted-foreground text-xs">
												{format(attendance.checkedInAt, "HH:mm")}
											</p>
										)}
									</div>
								</div>

								{/* Status toggle buttons */}
								<div className="flex items-center gap-1">
									{AttendanceStatuses.map((status) => {
										const config = statusConfig[status];
										const isActive = currentStatus === status;
										if (!config) return null;

										return (
											<button
												key={status}
												type="button"
												onClick={() =>
													handleStatusChange(
														athlete.id,
														status as AttendanceStatus,
													)
												}
												disabled={recordAttendanceMutation.isPending}
												className={cn(
													"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all disabled:opacity-50",
													isActive
														? config.activeClass
														: `border-transparent text-muted-foreground ${config.hoverClass}`,
												)}
											>
												{config.icon}
												<span className="hidden sm:inline">{t(status)}</span>
											</button>
										);
									})}
								</div>

								{/* Notes toggle */}
								<button
									type="button"
									onClick={() => toggleNotes(athlete.id)}
									className={cn(
										"flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
										hasNotes || isNotesExpanded
											? "text-foreground bg-muted"
											: "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50",
									)}
								>
									{isNotesExpanded ? (
										<ChevronDownIcon className="size-3.5" />
									) : (
										<MessageSquareIcon className="size-3.5" />
									)}
								</button>
							</div>

							{/* Expanded notes */}
							{isNotesExpanded && (
								<div className="border-t bg-muted/30 px-4 py-3">
									<Textarea
										value={notesValues[athlete.id] ?? ""}
										onChange={(e) =>
											setNotesValues((prev) => ({
												...prev,
												[athlete.id]: e.target.value,
											}))
										}
										placeholder={t("notesPlaceholder")}
										className="min-h-[60px] resize-none bg-background text-sm"
										rows={2}
									/>
									<div className="mt-2 flex justify-end gap-2">
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setExpandedNotes(null)}
											className="h-7 px-3 text-xs"
										>
											{t("cancel")}
										</Button>
										<Button
											size="sm"
											onClick={() => handleNotesSubmit(athlete.id)}
											disabled={recordAttendanceMutation.isPending}
											className="h-7 px-3 text-xs"
										>
											{t("save")}
										</Button>
									</div>
								</div>
							)}

							{/* Existing notes preview (when collapsed) */}
							{!isNotesExpanded && hasNotes && (
								<button
									type="button"
									onClick={() => toggleNotes(athlete.id)}
									className="w-full border-t bg-muted/20 px-4 py-2 text-left"
								>
									<p className="truncate text-muted-foreground text-xs">
										{attendance?.notes}
									</p>
								</button>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
