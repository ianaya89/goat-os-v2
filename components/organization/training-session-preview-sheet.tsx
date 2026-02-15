"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	CalendarDaysIcon,
	CalendarIcon,
	ChevronDownIcon,
	ClockIcon,
	EditIcon,
	ExternalLinkIcon,
	LoaderIcon,
	MailIcon,
	MapPinIcon,
	MessageSquareIcon,
	RepeatIcon,
	SmartphoneIcon,
	Trash2Icon,
	UserIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { TrainingSessionStatusSelect } from "@/components/organization/training-session-status-select";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/user/user-avatar";
import type { NotificationChannel } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

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

export function TrainingSessionPreviewSheet({
	session,
	open,
	onOpenChange,
	onEdit,
	onDelete,
	isDeleting,
}: TrainingSessionPreviewSheetProps) {
	const t = useTranslations("training");
	const tConfirmations = useTranslations("confirmations");
	const utils = trpc.useUtils();

	const sendConfirmationsMutation =
		trpc.organization.confirmation.sendForSessions.useMutation({
			onSuccess: (data) => {
				toast.success(t("bulk.confirmationsSent", { count: data.sent }));
				utils.organization.confirmation.getHistory.invalidate();
				utils.organization.confirmation.getStats.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || t("preview.confirmationsFailed"));
			},
		});

	const handleSendConfirmations = (channel: NotificationChannel) => {
		if (!session) return;

		const athleteCount =
			session.athletes.length > 0 ? session.athletes.length : 0;
		const channelLabel =
			channel === "email"
				? "Email"
				: channel === "whatsapp"
					? "WhatsApp"
					: "SMS";

		NiceModal.show(ConfirmationModal, {
			title: tConfirmations("bulkSend.confirmTitle"),
			message: tConfirmations("bulkSend.confirmMessage", {
				count: athleteCount,
				channel: channelLabel,
			}),
			confirmLabel: tConfirmations("bulkSend.confirmButton"),
			onConfirm: () => {
				sendConfirmationsMutation.mutate({
					sessionIds: [session.id],
					channel,
				});
			},
		});
	};

	if (!session) return null;

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
			<SheetContent className="sm:max-w-md" hideDefaultHeader>
				{/* Custom Header with accent stripe */}
				<div className="relative shrink-0">
					{/* Accent stripe */}
					<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-500" />

					{/* Header content */}
					<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
						<div className="flex items-start gap-3">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm">
								<CalendarDaysIcon className="size-5" />
							</div>
							<div>
								<h2 className="font-semibold text-lg tracking-tight">
									{session.title}
								</h2>
								{session.isRecurring && (
									<Badge variant="secondary" className="gap-1 text-xs mt-1">
										<RepeatIcon className="size-3" />
										{t("preview.recurring")}
									</Badge>
								)}
							</div>
						</div>
						<button
							type="button"
							onClick={() => onOpenChange(false)}
							className="flex size-8 items-center justify-center rounded-lg transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<XIcon className="size-4" />
							<span className="sr-only">{t("preview.close")}</span>
						</button>
					</div>

					{/* Separator */}
					<div className="h-px bg-border" />
				</div>

				<ScrollArea className="flex-1">
					<div className="space-y-6 px-6 py-4">
						{/* Session Details */}
						<div className="space-y-3">
							<h4 className="font-medium text-sm">
								{t("preview.sessionDetails")}
							</h4>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="text-muted-foreground font-medium flex items-center gap-1.5">
										<CalendarIcon className="size-3.5" />
										{t("preview.date")}
									</span>
									<p className="mt-1">
										{format(session.start, "EEEE, MMM d, yyyy")}
									</p>
								</div>
								<div>
									<span className="text-muted-foreground font-medium flex items-center gap-1.5">
										<ClockIcon className="size-3.5" />
										{t("preview.time")}
									</span>
									<p className="mt-1">
										{format(session.start, "HH:mm")} -{" "}
										{format(session.end, "HH:mm")}
									</p>
								</div>
								<div>
									<span className="text-muted-foreground font-medium">
										{t("preview.durationLabel")}
									</span>
									<p className="mt-1">{durationText}</p>
								</div>
								{session.location && (
									<div>
										<span className="text-muted-foreground font-medium flex items-center gap-1.5">
											<MapPinIcon className="size-3.5" />
											{t("preview.location")}
										</span>
										<p className="mt-1">{session.location}</p>
									</div>
								)}
								<div>
									<span className="text-muted-foreground font-medium">
										{t("form.status")}
									</span>
									<div className="mt-1">
										<TrainingSessionStatusSelect
											sessionId={session.id}
											currentStatus={session.status}
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Coach Section */}
						{session.coaches.length > 0 && (
							<>
								<Separator />
								<div className="space-y-3">
									<h4 className="font-medium text-sm">
										{session.coaches.length === 1
											? t("preview.coach")
											: t("preview.coaches")}
									</h4>
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
													<p className="font-medium text-sm truncate">
														{coach.name}
													</p>
													{coach.isPrimary && (
														<p className="text-xs text-muted-foreground">
															{t("preview.primaryCoach")}
														</p>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							</>
						)}

						{/* Participants Section */}
						<Separator />
						<div className="space-y-3">
							<h4 className="font-medium text-sm">
								{t("preview.participants")}
							</h4>

							{session.athleteGroup ? (
								<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
									<UsersIcon className="size-5 text-muted-foreground shrink-0" />
									<div>
										<p className="font-medium text-sm">
											{session.athleteGroup}
										</p>
										<p className="text-xs text-muted-foreground">
											{t("preview.athleteGroup")}
										</p>
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
											<p className="font-medium text-sm truncate">
												{athlete.name}
											</p>
										</div>
									))}
									{session.athletes.length > 4 && (
										<div className="flex items-center gap-3 p-2 text-muted-foreground">
											<div className="flex items-center justify-center size-9 rounded-full bg-muted text-xs font-medium">
												+{session.athletes.length - 4}
											</div>
											<p className="text-sm">
												{t("preview.moreAthletes", {
													count: session.athletes.length - 4,
												})}
											</p>
										</div>
									)}
								</div>
							) : (
								<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 text-muted-foreground">
									<UserIcon className="size-5" />
									<p className="text-sm">{t("preview.noParticipants")}</p>
								</div>
							)}
						</div>

						{/* Actions Section */}
						<Separator />
						<div className="space-y-3">
							<h4 className="font-medium text-sm">{t("preview.actions")}</h4>
							<div className="flex flex-wrap gap-2">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											disabled={sendConfirmationsMutation.isPending}
										>
											{sendConfirmationsMutation.isPending ? (
												<LoaderIcon className="size-4 animate-spin" />
											) : (
												<MailIcon className="size-4" />
											)}
											{t("bulk.sendConfirmations")}
											<ChevronDownIcon className="size-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start">
										<DropdownMenuItem
											onClick={() => handleSendConfirmations("email")}
										>
											<MailIcon className="size-4" />
											{t("bulk.viaEmail")}
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => handleSendConfirmations("whatsapp")}
										>
											<MessageSquareIcon className="size-4" />
											{t("bulk.viaWhatsApp")}
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => handleSendConfirmations("sms")}
										>
											<SmartphoneIcon className="size-4" />
											{t("bulk.viaSms")}
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
								{onEdit && (
									<Button variant="outline" size="sm" onClick={onEdit}>
										<EditIcon className="size-4" />
										{t("edit")}
									</Button>
								)}
								<Button variant="outline" size="sm" asChild>
									<Link
										href={`/dashboard/organization/training-sessions/${session.id}`}
									>
										<ExternalLinkIcon className="size-4" />
										{t("preview.details")}
									</Link>
								</Button>
								{onDelete && (
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												className="text-destructive hover:text-destructive"
												disabled={isDeleting}
											>
												{isDeleting ? (
													<LoaderIcon className="size-4 animate-spin" />
												) : (
													<Trash2Icon className="size-4" />
												)}
												{t("preview.deleteSession")}
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>
													{t("preview.deleteTitle")}
												</AlertDialogTitle>
												<AlertDialogDescription>
													{t("preview.deleteDescription", {
														title: session.title,
														date: format(session.start, "EEEE, MMM d"),
														time: format(session.start, "HH:mm"),
													})}
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>
													{t("preview.deleteCancel")}
												</AlertDialogCancel>
												<AlertDialogAction
													onClick={onDelete}
													className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
												>
													{isDeleting
														? t("preview.deleting")
														: t("preview.deleteConfirm")}
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								)}
							</div>
						</div>
					</div>
				</ScrollArea>

				{/* Footer */}
				<SheetFooter className="flex-row justify-end">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("preview.close")}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
