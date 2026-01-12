"use client";

import { format } from "date-fns";
import { CheckIcon, ClockIcon, UserIcon, XIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user/user-avatar";
import { AttendanceStatus, AttendanceStatuses } from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface AttendanceFormProps {
	sessionId: string;
}

const statusColors: Record<string, string> = {
	pending: "bg-gray-100 dark:bg-gray-800",
	present: "bg-green-100 dark:bg-green-900",
	absent: "bg-red-100 dark:bg-red-900",
	late: "bg-yellow-100 dark:bg-yellow-900",
	excused: "bg-blue-100 dark:bg-blue-900",
};

const statusIcons: Record<string, React.ReactNode> = {
	present: <CheckIcon className="size-4 text-green-600" />,
	absent: <XIcon className="size-4 text-red-600" />,
	late: <ClockIcon className="size-4 text-yellow-600" />,
};

export function AttendanceForm({ sessionId }: AttendanceFormProps) {
	const utils = trpc.useUtils();
	const [editingNotes, setEditingNotes] = React.useState<string | null>(null);
	const [notesValue, setNotesValue] = React.useState("");

	// Get session with athletes
	const { data: session, isLoading: sessionLoading } =
		trpc.organization.trainingSession.get.useQuery({ id: sessionId });

	// Get existing attendance records
	const { data: attendanceRecords, isLoading: attendanceLoading } =
		trpc.organization.attendance.getSessionAttendance.useQuery({ sessionId });

	const recordAttendanceMutation =
		trpc.organization.attendance.record.useMutation({
			onSuccess: () => {
				toast.success("Attendance recorded");
				utils.organization.attendance.getSessionAttendance.invalidate({
					sessionId,
				});
			},
			onError: (error) => {
				toast.error(error.message || "Failed to record attendance");
			},
		});

	const bulkRecordMutation =
		trpc.organization.attendance.bulkRecord.useMutation({
			onSuccess: (result) => {
				toast.success(`Attendance recorded for ${result.count} athletes`);
				utils.organization.attendance.getSessionAttendance.invalidate({
					sessionId,
				});
			},
			onError: (error) => {
				toast.error(error.message || "Failed to record attendance");
			},
		});

	// Build list of athletes from session (either from group or individual assignments)
	// IMPORTANT: useMemo must be called before any early returns to follow React hooks rules
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

	// Build a map of existing attendance by athlete ID
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
			<Card>
				<CardHeader>
					<CardTitle>Attendance</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-12 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	const handleStatusChange = (athleteId: string, status: AttendanceStatus) => {
		recordAttendanceMutation.mutate({
			sessionId,
			athleteId,
			status,
		});
	};

	const handleNotesSubmit = (athleteId: string) => {
		recordAttendanceMutation.mutate({
			sessionId,
			athleteId,
			status:
				(attendanceMap.get(athleteId)?.status as AttendanceStatus) ??
				AttendanceStatus.pending,
			notes: notesValue,
		});
		setEditingNotes(null);
		setNotesValue("");
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
		return (
			<Card>
				<CardHeader>
					<CardTitle>Attendance</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground">
						No athletes assigned to this session.
					</p>
				</CardContent>
			</Card>
		);
	}

	const presentCount = [...attendanceMap.values()].filter(
		(a) => a.status === "present",
	).length;
	const absentCount = [...attendanceMap.values()].filter(
		(a) => a.status === "absent",
	).length;

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between space-y-0">
				<div>
					<CardTitle>Attendance</CardTitle>
					<p className="mt-1 text-muted-foreground text-sm">
						{presentCount} present, {absentCount} absent of {athletes.length}{" "}
						athletes
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleMarkAllPresent}
						disabled={bulkRecordMutation.isPending}
					>
						<CheckIcon className="mr-1 size-4" />
						All Present
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleMarkAllAbsent}
						disabled={bulkRecordMutation.isPending}
					>
						<XIcon className="mr-1 size-4" />
						All Absent
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Athlete</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Time</TableHead>
							<TableHead>Notes</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{athletes.map((athlete) => {
							const attendance = attendanceMap.get(athlete.id);
							const status = attendance?.status ?? "pending";
							const isEditing = editingNotes === athlete.id;

							return (
								<TableRow key={athlete.id}>
									<TableCell>
										<div className="flex items-center gap-2">
											<UserAvatar
												className="size-8"
												name={athlete.name}
												src={athlete.image ?? undefined}
											/>
											<span className="font-medium">{athlete.name}</span>
										</div>
									</TableCell>
									<TableCell>
										<Select
											value={status}
											onValueChange={(value) =>
												handleStatusChange(
													athlete.id,
													value as AttendanceStatus,
												)
											}
											disabled={recordAttendanceMutation.isPending}
										>
											<SelectTrigger className="w-[130px]">
												<SelectValue>
													<div className="flex items-center gap-2">
														{statusIcons[status]}
														<Badge
															className={cn(
																"border-none text-xs shadow-none",
																statusColors[status],
															)}
															variant="outline"
														>
															{capitalize(status)}
														</Badge>
													</div>
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{AttendanceStatuses.map((s) => (
													<SelectItem key={s} value={s}>
														{capitalize(s)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</TableCell>
									<TableCell>
										{attendance?.checkedInAt ? (
											<span className="text-muted-foreground text-sm">
												{format(attendance.checkedInAt, "HH:mm")}
											</span>
										) : (
											"-"
										)}
									</TableCell>
									<TableCell>
										{isEditing ? (
											<div className="flex gap-2">
												<Input
													value={notesValue}
													onChange={(e) => setNotesValue(e.target.value)}
													placeholder="Notes..."
													className="h-8"
												/>
												<Button
													size="sm"
													onClick={() => handleNotesSubmit(athlete.id)}
													disabled={recordAttendanceMutation.isPending}
												>
													Save
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => {
														setEditingNotes(null);
														setNotesValue("");
													}}
												>
													Cancel
												</Button>
											</div>
										) : (
											<button
												type="button"
												className="text-left text-muted-foreground text-sm hover:text-foreground"
												onClick={() => {
													setEditingNotes(athlete.id);
													setNotesValue(attendance?.notes ?? "");
												}}
											>
												{attendance?.notes || "Add notes..."}
											</button>
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
