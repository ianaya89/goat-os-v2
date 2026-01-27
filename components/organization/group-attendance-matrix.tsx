"use client";

import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { AttendanceMatrix } from "@/components/organization/attendance-matrix";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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

	const athletes = members.map((m) => ({
		id: m.athlete.id,
		name: m.athlete.user?.name ?? "Unknown",
		image: m.athlete.user?.image ?? null,
	}));

	return (
		<AttendanceMatrix
			sessions={sessions}
			athletes={athletes}
			records={data?.records ?? []}
			onStatusChange={(sessionId, athleteId, status) => {
				recordMutation.mutate({ sessionId, athleteId, status });
			}}
			isMutating={recordMutation.isPending}
			mutatingVariables={recordMutation.variables ?? null}
		/>
	);
}
