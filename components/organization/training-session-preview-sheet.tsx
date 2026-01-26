"use client";

import { format } from "date-fns";
import {
	CalendarIcon,
	ClockIcon,
	EditIcon,
	ExternalLinkIcon,
	LoaderIcon,
	MapPinIcon,
	RepeatIcon,
	Trash2Icon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";

interface SessionCoach {
	id: string;
	name: string;
	image: string | null;
	isPrimary: boolean;
}

interface SessionAthlete {
	id: string;
	name: string;
	image: string | null;
}

export interface SessionPreviewData {
	id: string;
	title: string;
	start: Date;
	end: Date;
	status: string;
	location?: string;
	athleteGroup?: string;
	athletes: SessionAthlete[];
	coaches: SessionCoach[];
	isRecurring?: boolean;
}

interface TrainingSessionPreviewSheetProps {
	session: SessionPreviewData | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onEdit?: () => void;
	onDelete?: () => void;
	isDeleting?: boolean;
}

const statusConfig: Record<string, { bg: string; dot: string; label: string }> =
	{
		pending: {
			bg: "bg-amber-50 dark:bg-amber-950",
			dot: "bg-amber-500",
			label: "Pending",
		},
		confirmed: {
			bg: "bg-blue-50 dark:bg-blue-950",
			dot: "bg-blue-500",
			label: "Confirmed",
		},
		completed: {
			bg: "bg-emerald-50 dark:bg-emerald-950",
			dot: "bg-emerald-500",
			label: "Completed",
		},
		cancelled: {
			bg: "bg-gray-50 dark:bg-gray-900",
			dot: "bg-gray-400",
			label: "Cancelled",
		},
	};

export function TrainingSessionPreviewSheet({
	session,
	open,
	onOpenChange,
	onEdit,
	onDelete,
	isDeleting,
}: TrainingSessionPreviewSheetProps) {
	if (!session) return null;

	const defaultStatus = {
		bg: "bg-amber-50 dark:bg-amber-950",
		dot: "bg-amber-500",
		label: "Pending",
	};
	const status = statusConfig[session.status] ?? defaultStatus;
	const duration = Math.round(
		(new Date(session.end).getTime() - new Date(session.start).getTime()) /
			60000,
	);
	const hours = Math.floor(duration / 60);
	const minutes = duration % 60;
	const durationText =
		hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ""}` : `${minutes}m`;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="sm:max-w-md p-0 flex flex-col">
				{/* Header with status background */}
				<div className={cn("px-6 pt-6 pb-4", status.bg)}>
					<SheetHeader className="space-y-3">
						<div className="flex items-start justify-between gap-4">
							<SheetTitle className="text-xl font-semibold leading-tight pr-8">
								{session.title}
							</SheetTitle>
						</div>

						<div className="flex items-center gap-2 flex-wrap">
							<div className="flex items-center gap-1.5">
								<span className={cn("size-2 rounded-full", status.dot)} />
								<span className="text-sm font-medium">{status.label}</span>
							</div>
							{session.isRecurring && (
								<Badge variant="secondary" className="gap-1 text-xs">
									<RepeatIcon className="size-3" />
									Recurring
								</Badge>
							)}
						</div>
					</SheetHeader>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto px-6 py-5">
					{/* Date & Time Card */}
					<div className="rounded-lg border bg-card p-4 space-y-3">
						<div className="flex items-center gap-3">
							<div className="flex items-center justify-center size-10 rounded-full bg-primary/10">
								<CalendarIcon className="size-5 text-primary" />
							</div>
							<div>
								<p className="font-medium">
									{format(session.start, "EEEE, MMM d")}
								</p>
								<p className="text-sm text-muted-foreground">
									{format(session.start, "yyyy")}
								</p>
							</div>
						</div>

						<Separator />

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex items-center justify-center size-10 rounded-full bg-muted">
									<ClockIcon className="size-5 text-muted-foreground" />
								</div>
								<div>
									<p className="font-medium">
										{format(session.start, "HH:mm")} -{" "}
										{format(session.end, "HH:mm")}
									</p>
									<p className="text-sm text-muted-foreground">
										Duration: {durationText}
									</p>
								</div>
							</div>
						</div>

						{session.location && (
							<>
								<Separator />
								<div className="flex items-center gap-3">
									<div className="flex items-center justify-center size-10 rounded-full bg-muted">
										<MapPinIcon className="size-5 text-muted-foreground" />
									</div>
									<p className="font-medium">{session.location}</p>
								</div>
							</>
						)}
					</div>

					{/* Coach Section */}
					{session.coaches.length > 0 && (
						<div className="mt-5">
							<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
								{session.coaches.length === 1 ? "Coach" : "Coaches"}
							</h3>
							<div className="space-y-2">
								{session.coaches.map((coach) => (
									<div
										key={coach.id}
										className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
									>
										<UserAvatar
											className="size-9"
											name={coach.name}
											src={coach.image ?? undefined}
										/>
										<div className="flex-1 min-w-0">
											<p className="font-medium truncate">{coach.name}</p>
											{coach.isPrimary && (
												<p className="text-xs text-muted-foreground">
													Primary coach
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Participants Section */}
					<div className="mt-5">
						<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
							Participants
						</h3>

						{session.athleteGroup ? (
							<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
								<div className="flex items-center justify-center size-10 rounded-full bg-background">
									<UsersIcon className="size-5 text-muted-foreground" />
								</div>
								<div>
									<p className="font-medium">{session.athleteGroup}</p>
									<p className="text-sm text-muted-foreground">Athlete Group</p>
								</div>
							</div>
						) : session.athletes.length > 0 ? (
							<div className="space-y-1">
								{session.athletes.slice(0, 4).map((athlete) => (
									<div
										key={athlete.id}
										className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
									>
										<UserAvatar
											className="size-9"
											name={athlete.name}
											src={athlete.image ?? undefined}
										/>
										<p className="font-medium truncate">{athlete.name}</p>
									</div>
								))}
								{session.athletes.length > 4 && (
									<div className="flex items-center gap-3 p-2 text-muted-foreground">
										<div className="flex items-center justify-center size-9 rounded-full bg-muted text-xs font-medium">
											+{session.athletes.length - 4}
										</div>
										<p className="text-sm">
											{session.athletes.length - 4} more athletes
										</p>
									</div>
								)}
							</div>
						) : (
							<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 text-muted-foreground">
								<UserIcon className="size-5" />
								<p className="text-sm">No participants assigned</p>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<SheetFooter className="px-6 py-4 border-t bg-muted/30">
					<div className="flex flex-col gap-3 w-full">
						<div className="flex gap-3 w-full">
							<Button variant="outline" className="flex-1" asChild>
								<Link
									href={`/dashboard/organization/training-sessions/${session.id}`}
								>
									<ExternalLinkIcon className="mr-2 size-4" />
									Details
								</Link>
							</Button>
							{onEdit && (
								<Button className="flex-1" onClick={onEdit}>
									<EditIcon className="mr-2 size-4" />
									Edit
								</Button>
							)}
						</div>
						{onDelete && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="outline"
										className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
										disabled={isDeleting}
									>
										{isDeleting ? (
											<LoaderIcon className="mr-2 size-4 animate-spin" />
										) : (
											<Trash2Icon className="mr-2 size-4" />
										)}
										Delete Session
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											Delete training session?
										</AlertDialogTitle>
										<AlertDialogDescription>
											This will permanently delete "{session.title}" scheduled
											for {format(session.start, "EEEE, MMM d")} at{" "}
											{format(session.start, "HH:mm")}. This action cannot be
											undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={onDelete}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											{isDeleting ? "Deleting..." : "Delete"}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
