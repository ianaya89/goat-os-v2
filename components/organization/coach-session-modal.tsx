"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	CalendarIcon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	ClockIcon,
	MapPinIcon,
	UsersIcon,
} from "lucide-react";
import * as React from "react";
import { AttendanceForm } from "@/components/organization/attendance-form";
import { EvaluationForm } from "@/components/organization/evaluation-form";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { capitalize, cn } from "@/lib/utils";

interface CoachSessionModalProps {
	session: {
		id: string;
		title: string;
		startTime: Date;
		endTime: Date;
		status: string;
		location?: { name: string } | null;
		athleteGroup?: { name: string } | null;
	};
	defaultTab?: "attendance" | "evaluations";
}

const sessionStatusColors: Record<string, string> = {
	pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
	confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	completed:
		"bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
};

export const CoachSessionModal = NiceModal.create(
	({ session, defaultTab = "attendance" }: CoachSessionModalProps) => {
		const modal = useModal();

		return (
			<Dialog open={modal.visible} onOpenChange={modal.hide}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<DialogTitle className="text-xl">{session.title}</DialogTitle>
								<Badge
									className={cn(
										"border-none",
										sessionStatusColors[session.status],
									)}
								>
									{capitalize(session.status)}
								</Badge>
							</div>
							<div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
								<div className="flex items-center gap-1">
									<CalendarIcon className="size-4" />
									<span>
										{format(new Date(session.startTime), "EEEE, MMM d, yyyy")}
									</span>
								</div>
								<div className="flex items-center gap-1">
									<ClockIcon className="size-4" />
									<span>
										{format(new Date(session.startTime), "h:mm a")} -{" "}
										{format(new Date(session.endTime), "h:mm a")}
									</span>
								</div>
								{session.location && (
									<div className="flex items-center gap-1">
										<MapPinIcon className="size-4" />
										<span>{session.location.name}</span>
									</div>
								)}
								{session.athleteGroup && (
									<div className="flex items-center gap-1">
										<UsersIcon className="size-4" />
										<span>{session.athleteGroup.name}</span>
									</div>
								)}
							</div>
						</div>
					</DialogHeader>

					<Tabs defaultValue={defaultTab} className="mt-4">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="attendance" className="gap-2">
								<ClipboardCheckIcon className="size-4" />
								Attendance
							</TabsTrigger>
							<TabsTrigger value="evaluations" className="gap-2">
								<ClipboardListIcon className="size-4" />
								Evaluations
							</TabsTrigger>
						</TabsList>
						<TabsContent value="attendance" className="mt-4">
							<AttendanceForm sessionId={session.id} />
						</TabsContent>
						<TabsContent value="evaluations" className="mt-4">
							<EvaluationForm sessionId={session.id} />
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>
		);
	},
);
