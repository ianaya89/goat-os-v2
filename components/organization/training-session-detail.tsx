"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	ActivityIcon,
	BanknoteIcon,
	BellIcon,
	CalendarDaysIcon,
	CalendarIcon,
	ChevronDownIcon,
	ClipboardListIcon,
	ClockIcon,
	EditIcon,
	EyeIcon,
	FileTextIcon,
	InfoIcon,
	LayersIcon,
	MailIcon,
	MapPinIcon,
	MessageSquareIcon,
	MoreHorizontalIcon,
	PaperclipIcon,
	PhoneIcon,
	PlusIcon,
	TargetIcon,
	Trash2Icon,
	UploadIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { useOrganizationUserProfile } from "@/app/(saas)/dashboard/(sidebar)/organization/providers";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { AttendanceMatrix } from "@/components/organization/attendance-matrix";
import { SessionEvaluationsTable } from "@/components/organization/evaluations-table";
import { LocationBadge } from "@/components/organization/location-badge";
import { PaymentsModal } from "@/components/organization/payments-modal";
import { SessionAthletesEditModal } from "@/components/organization/session-athletes-edit-modal";
import { SessionAttachmentUpload } from "@/components/organization/session-attachment-upload";
import { SessionBasicEditModal } from "@/components/organization/session-basic-edit-modal";
import { SessionCoachesEditModal } from "@/components/organization/session-coaches-edit-modal";
import { SessionContentEditModal } from "@/components/organization/session-content-edit-modal";
import { SessionFeedbackModal } from "@/components/organization/session-feedback-modal";
import { SessionFeedbackView } from "@/components/organization/session-feedback-view";
import { SessionScheduleEditModal } from "@/components/organization/session-schedule-edit-modal";
import { TrainingSessionStatusBadge } from "@/components/organization/training-session-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user/user-avatar";
import {
	TrainingSessionStatus,
	TrainingSessionStatuses,
} from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface TrainingSessionDetailProps {
	sessionId: string;
}

export function TrainingSessionDetail({
	sessionId,
}: TrainingSessionDetailProps) {
	const t = useTranslations("training");
	const router = useRouter();
	const utils = trpc.useUtils();
	const userProfile = useOrganizationUserProfile();
	const [postNotes, setPostNotes] = React.useState("");
	const [isCompletingSession, setIsCompletingSession] = React.useState(false);

	// Use pre-computed capability from context
	const isRestrictedMember = userProfile.capabilities.isRestrictedMember;

	const {
		data: session,
		isLoading,
		error,
	} = trpc.organization.trainingSession.get.useQuery({ id: sessionId });

	const { data: sessionEvaluations } =
		trpc.organization.athleteEvaluation.getSessionEvaluations.useQuery({
			sessionId,
		});

	const completeMutation =
		trpc.organization.trainingSession.complete.useMutation({
			onSuccess: () => {
				toast.success(t("success.completed"));
				utils.organization.trainingSession.get.invalidate({ id: sessionId });
				setIsCompletingSession(false);
			},
			onError: (error) => {
				toast.error(error.message || t("error.completeFailed"));
			},
		});

	const deleteMutation = trpc.organization.trainingSession.delete.useMutation({
		onSuccess: () => {
			toast.success(t("success.deleted"));
			router.push("/dashboard/organization/training-sessions");
		},
		onError: (error) => {
			toast.error(error.message || t("error.deleteFailed"));
		},
	});

	const statusMutation =
		trpc.organization.trainingSession.bulkUpdateStatus.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.trainingSession.get.invalidate({
					id: sessionId,
				});
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

	const sendConfirmationMutation =
		trpc.organization.confirmation.sendForSessions.useMutation({
			onSuccess: (data) => {
				toast.success(t("success.reminderSent", { count: data.sent }));
				utils.organization.confirmation.getStats.invalidate();
			},
			onError: () => {
				toast.error(t("error.reminderFailed"));
			},
		});

	React.useEffect(() => {
		if (session?.postSessionNotes) {
			setPostNotes(session.postSessionNotes);
		}
	}, [session?.postSessionNotes]);

	const handleComplete = () => {
		completeMutation.mutate({
			id: sessionId,
			postSessionNotes: postNotes || undefined,
		});
	};

	const handleDelete = () => {
		if (!session) return;
		NiceModal.show(ConfirmationModal, {
			title: t("preview.deleteTitle"),
			message: t("preview.deleteDescription", {
				title: session.title,
				date: format(new Date(session.startTime), "EEEE, MMMM d, yyyy"),
				time: format(new Date(session.startTime), "h:mm a"),
			}),
			confirmLabel: t("preview.deleteConfirm"),
			destructive: true,
			onConfirm: () => deleteMutation.mutate({ id: sessionId }),
		});
	};

	const handleSendReminder = (
		channel: "email" | "sms" | "whatsapp" | "all",
	) => {
		if (!session) return;

		const athleteCount =
			session.athleteGroup?.members?.length ?? session.athletes.length;
		const channelLabel =
			channel === "email"
				? "Email"
				: channel === "whatsapp"
					? "WhatsApp"
					: channel === "sms"
						? "SMS"
						: t("detail.allChannels");

		NiceModal.show(ConfirmationModal, {
			title: t("detail.sendReminder"),
			message: t("success.reminderSent", { count: athleteCount }).replace(
				/\./,
				` via ${channelLabel}.`,
			),
			confirmLabel: t("detail.sendReminder"),
			onConfirm: () => {
				sendConfirmationMutation.mutate({
					sessionIds: [sessionId],
					channel,
				});
			},
		});
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-10" />
					<div className="space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<div className="grid gap-6 md:grid-cols-2">
					<Skeleton className="h-64" />
					<Skeleton className="h-64" />
				</div>
			</div>
		);
	}

	if (error || !session) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">{t("detail.sessionNotFound")}</p>
				</CardContent>
			</Card>
		);
	}

	// Get athletes list - either from group or individual assignments
	const athletes = session.athleteGroup?.members
		? session.athleteGroup.members.map((m) => ({
				id: m.athlete.id,
				name: m.athlete.user?.name ?? "Unknown",
				image: m.athlete.user?.image ?? null,
				email: m.athlete.user?.email ?? null,
				phone: m.athlete.phone ?? null,
			}))
		: session.athletes.map((a) => ({
				id: a.athlete.id,
				name: a.athlete.user?.name ?? "Unknown",
				image: a.athlete.user?.image ?? null,
				email: a.athlete.user?.email ?? null,
				phone: a.athlete.phone ?? null,
			}));

	const coaches = session.coaches.map((c) => ({
		id: c.coach.id,
		name: c.coach.user?.name ?? "Unknown",
		image: c.coach.user?.image ?? null,
		email: c.coach.user?.email ?? null,
		phone: c.coach.phone ?? null,
		isPrimary: c.isPrimary,
	}));

	const isCompleted = session.status === TrainingSessionStatus.completed;
	const isFutureSession = new Date(session.startTime) > new Date();
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
						<CalendarDaysIcon className="size-7 text-neutral-600 dark:text-neutral-300" />
					</div>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-bold text-2xl">{session.title}</h1>
							<TrainingSessionStatusBadge status={session.status} />
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
							<div className="flex items-center gap-1">
								<CalendarIcon className="size-4" />
								<span>
									{format(new Date(session.startTime), "EEEE, MMMM d, yyyy")}
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
								<LocationBadge
									locationId={session.location.id}
									name={session.location.name}
									color={session.location.color}
								/>
							)}
						</div>
						{session.description && (
							<p className="mt-1.5 text-muted-foreground text-sm">
								{session.description}
							</p>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					{/* Admin/Coach actions */}
					{!isRestrictedMember && (
						<>
							{/* Send Reminder Dropdown - only for future sessions */}
							{isFutureSession &&
								session.status !== TrainingSessionStatus.cancelled && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												disabled={sendConfirmationMutation.isPending}
											>
												<BellIcon className="mr-1.5 size-4" />
												{sendConfirmationMutation.isPending
													? t("detail.sending")
													: t("detail.sendReminder")}
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => handleSendReminder("all")}
												disabled={sendConfirmationMutation.isPending}
											>
												<LayersIcon className="mr-2 size-4" />
												{t("detail.sendViaAllChannels")}
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() => handleSendReminder("email")}
												disabled={sendConfirmationMutation.isPending}
											>
												<MailIcon className="mr-2 size-4" />
												{t("detail.sendViaEmail")}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleSendReminder("whatsapp")}
												disabled={sendConfirmationMutation.isPending}
											>
												<MessageSquareIcon className="mr-2 size-4" />
												{t("detail.sendViaWhatsApp")}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleSendReminder("sms")}
												disabled={sendConfirmationMutation.isPending}
											>
												<PhoneIcon className="mr-2 size-4" />
												{t("detail.sendViaSms")}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}

							{/* Status Dropdown */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										disabled={statusMutation.isPending}
									>
										<TrainingSessionStatusBadge status={session.status} />
										<ChevronDownIcon className="ml-1 size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{TrainingSessionStatuses.map((s) => (
										<DropdownMenuItem
											key={s}
											disabled={s === session.status}
											onClick={() =>
												statusMutation.mutate({
													ids: [sessionId],
													status: s,
												})
											}
										>
											<TrainingSessionStatusBadge status={s} />
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							{/* More Actions Dropdown */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="size-8">
										<MoreHorizontalIcon className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={handleDelete}
										variant="destructive"
									>
										<Trash2Icon className="mr-2 size-4" />
										{t("delete")}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					)}
					{/* Athlete feedback button */}
					{isRestrictedMember && (isCompleted || !isFutureSession) && (
						<Button
							onClick={() => {
								NiceModal.show(SessionFeedbackModal, {
									sessionId,
									sessionTitle: session.title,
								});
							}}
							variant="default"
							size="sm"
						>
							<ActivityIcon className="mr-2 size-4" />
							{t("detail.giveFeedback")}
						</Button>
					)}
				</div>
			</div>

			{/* Complete Session Dialog - Admin/Coach only */}
			{!isRestrictedMember && isCompletingSession && (
				<Card className="border-primary">
					<CardHeader>
						<CardTitle className="text-lg">
							{t("detail.completeSession")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="post-notes" className="font-medium text-sm">
								{t("detail.postNotesOptional")}
							</label>
							<Textarea
								id="post-notes"
								placeholder={t("detail.postNotesPlaceholder")}
								value={postNotes}
								onChange={(e) => setPostNotes(e.target.value)}
								rows={4}
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setIsCompletingSession(false)}
							>
								{t("cancel")}
							</Button>
							<Button
								onClick={handleComplete}
								loading={completeMutation.isPending}
							>
								{t("detail.markAsCompleted")}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Session Info Grid */}
			<div className="grid gap-6 md:grid-cols-3">
				{/* Schedule */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-base">
								<CalendarIcon className="size-4" />
								{t("detail.schedule")}
							</CardTitle>
							{!isRestrictedMember && (
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									onClick={() =>
										NiceModal.show(SessionScheduleEditModal, {
											sessionId,
											startTime: session.startTime,
											endTime: session.endTime,
											locationId: session.location?.id ?? null,
										})
									}
								>
									<EditIcon className="size-3.5" />
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
								<span>
									{format(new Date(session.startTime), "EEEE, MMMM d, yyyy")}
								</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<ClockIcon className="size-4 shrink-0 text-muted-foreground" />
								<span>
									{format(new Date(session.startTime), "h:mm a")} -{" "}
									{format(new Date(session.endTime), "h:mm a")}
								</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<ClockIcon className="size-4 shrink-0 text-muted-foreground" />
								<span>
									{(() => {
										const ms =
											new Date(session.endTime).getTime() -
											new Date(session.startTime).getTime();
										const mins = Math.round(ms / 60000);
										const h = Math.floor(mins / 60);
										const m = mins % 60;
										return h > 0 ? `${h}h ${m}m` : `${m}m`;
									})()}
								</span>
							</div>
							{session.location && (
								<div className="flex items-center gap-2 text-sm">
									<MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
									<LocationBadge
										locationId={session.location.id}
										name={session.location.name}
										color={session.location.color}
									/>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Coaches */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-base">
								<UserIcon className="size-4" />
								{t("detail.coaches", { count: coaches.length })}
							</CardTitle>
							{!isRestrictedMember && (
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									onClick={() =>
										NiceModal.show(SessionCoachesEditModal, {
											sessionId,
											currentCoachIds: session.coaches.map((c) => c.coach.id),
											currentPrimaryCoachId:
												session.coaches.find((c) => c.isPrimary)?.coach.id ??
												null,
										})
									}
								>
									<EditIcon className="size-3.5" />
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{coaches.map((coach) => (
								<Link
									key={coach.id}
									href={`/dashboard/organization/coaches/${coach.id}`}
									className="flex items-center gap-3 hover:opacity-80 transition-opacity"
								>
									<UserAvatar
										className="size-8"
										name={coach.name}
										src={coach.image ?? undefined}
									/>
									<div className="flex items-center gap-2">
										<span className="font-medium text-sm">{coach.name}</span>
										{coach.isPrimary && (
											<Badge variant="secondary" className="text-xs">
												{t("detail.primary")}
											</Badge>
										)}
									</div>
								</Link>
							))}
							{coaches.length === 0 && (
								<p className="text-muted-foreground text-sm">
									{t("detail.noCoaches")}
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Athletes */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-base">
								<UsersIcon className="size-4" />
								{t("detail.athletes", { count: athletes.length })}
								{session.athleteGroup && (
									<Badge variant="outline" className="ml-2">
										{session.athleteGroup.name}
									</Badge>
								)}
							</CardTitle>
							{!isRestrictedMember && (
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									onClick={() =>
										NiceModal.show(SessionAthletesEditModal, {
											sessionId,
											currentAthleteIds: session.athletes.map(
												(a) => a.athlete.id,
											),
											currentGroupId: session.athleteGroup?.id ?? null,
										})
									}
								>
									<EditIcon className="size-3.5" />
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{athletes.map((athlete) => (
								<div
									key={athlete.id}
									className="flex items-center justify-between"
								>
									<Link
										href={`/dashboard/organization/athletes/${athlete.id}`}
										className="flex items-center gap-3 hover:opacity-80 transition-opacity"
									>
										<UserAvatar
											className="size-8"
											name={athlete.name}
											src={athlete.image ?? undefined}
										/>
										<span className="font-medium text-sm">{athlete.name}</span>
									</Link>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="size-7 text-muted-foreground"
											>
												<MoreHorizontalIcon className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() =>
													NiceModal.show(PaymentsModal, {
														fixedSessionId: sessionId,
														fixedSessionIds: [sessionId],
														fixedAthletes: [
															{ id: athlete.id, name: athlete.name },
														],
													})
												}
											>
												<BanknoteIcon className="mr-2 size-4" />
												{t("detail.recordPayment")}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							))}
							{athletes.length === 0 && (
								<p className="text-muted-foreground text-sm">
									{t("detail.noAthletes")}
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs: Info, Attendance, Evaluations, Feedback */}
			{isRestrictedMember ? (
				/* Athlete view - only show info and feedback */
				<Tabs defaultValue="info" className="space-y-4">
					<TabsList>
						<TabsTrigger value="info">
							<InfoIcon className="mr-1 size-3.5" />
							{t("detail.info")}
						</TabsTrigger>
						<TabsTrigger value="feedback">{t("detail.myFeedback")}</TabsTrigger>
					</TabsList>
					<TabsContent value="info">
						<SessionInfoGrid
							session={session}
							sessionId={sessionId}
							t={t}
							isRestrictedMember={isRestrictedMember}
						/>
					</TabsContent>
					<TabsContent value="feedback">
						<Card>
							<CardContent className="pt-6">
								<SessionFeedbackView sessionId={sessionId} athleteView />
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			) : (
				/* Admin/Coach view - show all tabs */
				<Tabs defaultValue="info" className="space-y-4">
					<TabsList className="flex-wrap">
						<TabsTrigger value="info">
							<InfoIcon className="mr-1 size-3.5" />
							{t("detail.info")}
						</TabsTrigger>
						<TabsTrigger value="attendance">
							{t("detail.attendance")}
						</TabsTrigger>
						<TabsTrigger value="evaluations">
							{t("detail.evaluations")}
						</TabsTrigger>
						<TabsTrigger value="feedback">
							{t("detail.athleteFeedback")}
						</TabsTrigger>
						<TabsTrigger value="payments">{t("detail.payments")}</TabsTrigger>
					</TabsList>
					<TabsContent value="info">
						<SessionInfoGrid
							session={session}
							sessionId={sessionId}
							t={t}
							isRestrictedMember={isRestrictedMember}
						/>
					</TabsContent>
					<TabsContent value="attendance">
						<SessionAttendanceView
							sessionId={sessionId}
							session={session}
							athletes={athletes}
						/>
					</TabsContent>
					<TabsContent value="evaluations">
						<SessionEvaluationsTable
							sessionId={sessionId}
							sessionTitle={session.title}
							evaluations={sessionEvaluations ?? []}
							athletes={athletes}
							onEvaluationDeleted={() =>
								utils.organization.athleteEvaluation.getSessionEvaluations.invalidate(
									{ sessionId },
								)
							}
						/>
					</TabsContent>
					<TabsContent value="feedback">
						<SessionFeedbackView sessionId={sessionId} />
					</TabsContent>
					<TabsContent value="payments">
						<SessionPaymentsView sessionId={sessionId} athletes={athletes} />
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}

/** Info grid for the session detail – two-column layout: info cards left, attachment right */
function SessionInfoGrid({
	session,
	sessionId,
	t,
	isRestrictedMember,
}: {
	session: {
		title: string;
		description: string | null;
		objectives: string | null;
		planning: string | null;
		postSessionNotes: string | null;
		attachmentKey: string | null;
	};
	sessionId: string;
	t: ReturnType<typeof useTranslations<"training">>;
	isRestrictedMember: boolean;
}) {
	const utils = trpc.useUtils();

	const { refetch: fetchDownloadUrl } =
		trpc.organization.trainingSession.getAttachmentDownloadUrl.useQuery(
			{ sessionId },
			{ enabled: false },
		);

	const deleteAttachmentMutation =
		trpc.organization.trainingSession.deleteAttachment.useMutation({
			onSuccess: () => {
				utils.organization.trainingSession.get.invalidate({ id: sessionId });
			},
		});

	const handleViewAttachment = async () => {
		try {
			const result = await fetchDownloadUrl();
			if (result.data?.downloadUrl) {
				window.open(result.data.downloadUrl, "_blank");
			}
		} catch {
			// silently fail
		}
	};

	const handleDeleteAttachment = () => {
		deleteAttachmentMutation.mutate({ sessionId });
	};

	return (
		<div className="grid gap-4 md:grid-cols-2">
			{/* Left column: info cards stacked */}
			<div className="flex flex-col gap-4">
				{/* Session Info Card with Title and Description */}
				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-base">
								<InfoIcon className="size-4" />
								{t("detail.sessionInfo")}
							</CardTitle>
							{!isRestrictedMember && (
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									onClick={() =>
										NiceModal.show(SessionBasicEditModal, {
											sessionId,
											title: session.title,
											description: session.description,
										})
									}
								>
									<EditIcon className="size-3.5" />
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
								{t("form.title")}
							</span>
							<p className="mt-1 font-medium">{session.title}</p>
						</div>
						<div>
							<span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
								{t("form.description")}
							</span>
							{session.description ? (
								<p className="mt-1 whitespace-pre-wrap text-sm">
									{session.description}
								</p>
							) : (
								<p className="mt-1 text-muted-foreground text-sm">
									{t("detail.noDescription")}
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2 text-base">
								<ClipboardListIcon className="size-4" />
								{t("detail.planning")}
							</CardTitle>
							{!isRestrictedMember && (
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									onClick={() =>
										NiceModal.show(SessionContentEditModal, {
											sessionId,
											objectives: session.objectives,
											planning: session.planning,
											description: session.description,
											postSessionNotes: session.postSessionNotes,
										})
									}
								>
									<EditIcon className="size-3.5" />
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						{session.planning ? (
							<p className="whitespace-pre-wrap text-sm">{session.planning}</p>
						) : (
							<p className="text-muted-foreground text-sm">
								{t("detail.noPlanning")}
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<TargetIcon className="size-4" />
							{t("detail.objectives")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{session.objectives ? (
							<p className="whitespace-pre-wrap text-sm">
								{session.objectives}
							</p>
						) : (
							<p className="text-muted-foreground text-sm">
								{t("detail.noObjectives")}
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<FileTextIcon className="size-4" />
							{t("detail.postSessionNotes")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{session.postSessionNotes ? (
							<p className="whitespace-pre-wrap text-sm">
								{session.postSessionNotes}
							</p>
						) : (
							<p className="text-muted-foreground text-sm">
								{t("detail.noPostSessionNotes")}
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Right column: attachment card spanning full height */}
			<Card className="flex flex-col">
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2 text-base">
							<PaperclipIcon className="size-4" />
							{t("modal.attachment")}
						</CardTitle>
						{session.attachmentKey && (
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									onClick={handleViewAttachment}
								>
									<EyeIcon className="size-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="size-7 text-destructive hover:text-destructive"
									onClick={handleDeleteAttachment}
									disabled={deleteAttachmentMutation.isPending}
								>
									<Trash2Icon className="size-3.5" />
								</Button>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent className="flex flex-1 flex-col">
					<AttachmentPreview
						sessionId={sessionId}
						attachmentKey={session.attachmentKey}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

/** Inline attachment preview – shows image, PDF placeholder, or upload area */
function AttachmentPreview({
	sessionId,
	attachmentKey,
}: {
	sessionId: string;
	attachmentKey: string | null;
}) {
	const t = useTranslations("training");
	const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
	const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);

	const { refetch: fetchDownloadUrl } =
		trpc.organization.trainingSession.getAttachmentDownloadUrl.useQuery(
			{ sessionId },
			{ enabled: false },
		);

	const isPdf = attachmentKey?.toLowerCase().endsWith(".pdf") ?? false;
	const isImage = attachmentKey ? /\.(jpe?g|png)$/i.test(attachmentKey) : false;

	React.useEffect(() => {
		if (!attachmentKey) return;

		let cancelled = false;
		setIsLoadingPreview(true);

		fetchDownloadUrl()
			.then((result) => {
				if (!cancelled && result.data?.downloadUrl) {
					setPreviewUrl(result.data.downloadUrl);
				}
				setIsLoadingPreview(false);
			})
			.catch(() => {
				setIsLoadingPreview(false);
			});

		return () => {
			cancelled = true;
		};
	}, [attachmentKey, fetchDownloadUrl]);

	if (!attachmentKey) {
		return (
			<EmptyState
				icon={PaperclipIcon}
				title={t("detail.noAttachment")}
				size="sm"
				className="flex-1 rounded-md border bg-muted/30"
				action={
					<SessionAttachmentUpload
						sessionId={sessionId}
						hasAttachment={false}
					/>
				}
			/>
		);
	}

	return (
		<div className="flex flex-1 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
			{isLoadingPreview && (
				<div className="flex flex-col items-center gap-2 text-muted-foreground">
					<div className="size-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
				</div>
			)}
			{isImage && previewUrl && (
				<img
					src={previewUrl}
					alt={t("detail.attachmentPreview")}
					className="max-h-full max-w-full object-contain p-2"
				/>
			)}
			{isPdf && previewUrl && (
				<iframe
					src={`${previewUrl}#toolbar=0&navpanes=0`}
					className="h-full w-full"
					title="PDF adjunto"
				/>
			)}
		</div>
	);
}

/** Attendance view using AttendanceMatrix – same component used in group profiles */
function SessionAttendanceView({
	sessionId,
	session,
	athletes,
}: {
	sessionId: string;
	session: { title: string; startTime: Date };
	athletes: Array<{
		id: string;
		name: string;
		image: string | null;
	}>;
}) {
	const utils = trpc.useUtils();

	const { data: attendanceRecords, isLoading } =
		trpc.organization.attendance.getSessionAttendance.useQuery({ sessionId });

	const recordMutation = trpc.organization.attendance.record.useMutation({
		onSuccess: () => {
			utils.organization.attendance.getSessionAttendance.invalidate({
				sessionId,
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

	const records = (attendanceRecords ?? []).map((r) => ({
		sessionId,
		athleteId: r.athleteId,
		status: r.status,
	}));

	return (
		<AttendanceMatrix
			sessions={[
				{
					id: sessionId,
					title: session.title,
					startTime: session.startTime,
				},
			]}
			athletes={athletes}
			records={records}
			onStatusChange={(sid, athleteId, status) => {
				recordMutation.mutate({ sessionId: sid, athleteId, status });
			}}
			isMutating={recordMutation.isPending}
			mutatingVariables={recordMutation.variables ?? null}
		/>
	);
}

const paymentStatusColors: Record<string, string> = {
	pending: "bg-yellow-100 dark:bg-yellow-900",
	paid: "bg-green-100 dark:bg-green-900",
	partial: "bg-blue-100 dark:bg-blue-900",
	cancelled: "bg-gray-100 dark:bg-gray-800",
};

/** Payments view for a specific session */
function SessionPaymentsView({
	sessionId,
	athletes,
}: {
	sessionId: string;
	athletes: { id: string; name: string }[];
}) {
	const t = useTranslations("training");
	const tp = useTranslations("finance.payments");
	const utils = trpc.useUtils();

	const { data: payments, isLoading } =
		trpc.organization.trainingPayment.getSessionPayments.useQuery({
			sessionId,
		});

	const deleteMutation = trpc.organization.trainingPayment.delete.useMutation({
		onSuccess: () => {
			toast.success(tp("success.deleted"));
			utils.organization.trainingPayment.getSessionPayments.invalidate({
				sessionId,
			});
		},
		onError: (error) => {
			toast.error(error.message || tp("error.deleteFailed"));
		},
	});

	const formatAmount = (amount: number, currency: string) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency,
		}).format(amount / 100);
	};

	const methodKeys: Record<string, string> = {
		cash: "cash",
		bank_transfer: "bankTransfer",
		mercado_pago: "mercadoPago",
		card: "card",
		other: "other",
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

	const paymentsList = payments ?? [];

	const totalAmount = paymentsList.reduce((sum, p) => sum + p.amount, 0);
	const totalPaid = paymentsList.reduce((sum, p) => sum + p.paidAmount, 0);
	const pendingCount = paymentsList.filter(
		(p) => p.status === "pending",
	).length;
	const currency = paymentsList[0]?.currency ?? "ARS";

	return (
		<div className="space-y-4">
			{/* Summary + Add button */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-wrap gap-4">
					{paymentsList.length > 0 && (
						<>
							<div className="flex items-center gap-2 text-sm">
								<span className="text-muted-foreground">
									{t("detail.totalAmount")}:
								</span>
								<span className="font-semibold">
									{formatAmount(totalAmount, currency)}
								</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<span className="text-muted-foreground">
									{t("detail.paidAmount")}:
								</span>
								<span className="font-semibold text-green-600 dark:text-green-400">
									{formatAmount(totalPaid, currency)}
								</span>
							</div>
							{pendingCount > 0 && (
								<div className="flex items-center gap-2 text-sm">
									<span className="text-muted-foreground">
										{t("detail.pendingPayments")}:
									</span>
									<Badge
										variant="outline"
										className="border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
									>
										{pendingCount}
									</Badge>
								</div>
							)}
						</>
					)}
				</div>
				<Button
					size="sm"
					onClick={() =>
						NiceModal.show(PaymentsModal, {
							payment: undefined,
							fixedSessionId: sessionId,
							fixedAthletes: athletes,
						})
					}
				>
					<PlusIcon className="mr-1 size-4" />
					{t("detail.addPayment")}
				</Button>
			</div>

			{/* Payments table or empty state */}
			{paymentsList.length === 0 ? (
				<EmptyState
					icon={BanknoteIcon}
					title={t("detail.noPayments")}
					size="sm"
				/>
			) : (
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{tp("table.athlete")}</TableHead>
								<TableHead>{tp("table.amount")}</TableHead>
								<TableHead>{tp("table.status")}</TableHead>
								<TableHead className="hidden sm:table-cell">
									{tp("table.method")}
								</TableHead>
								<TableHead className="hidden md:table-cell">
									{tp("table.date")}
								</TableHead>
								<TableHead className="w-[50px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{paymentsList.map((payment) => (
								<TableRow key={payment.id}>
									<TableCell>
										{payment.athlete ? (
											<div className="flex items-center gap-2">
												<UserAvatar
													className="size-6"
													name={payment.athlete.user?.name ?? "Unknown"}
													src={payment.athlete.user?.image ?? undefined}
												/>
												<span className="max-w-[120px] truncate text-sm">
													{payment.athlete.user?.name ?? "Unknown"}
												</span>
											</div>
										) : (
											<span className="text-muted-foreground">-</span>
										)}
									</TableCell>
									<TableCell>
										<div className="flex flex-col gap-0.5">
											<span className="font-medium">
												{formatAmount(payment.amount, payment.currency)}
											</span>
											{payment.status === "partial" && (
												<span className="text-muted-foreground text-xs">
													{t("detail.paidAmount")}:{" "}
													{formatAmount(payment.paidAmount, payment.currency)}
												</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											className={cn(
												"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
												paymentStatusColors[payment.status] ??
													"bg-gray-100 dark:bg-gray-800",
											)}
											variant="outline"
										>
											{tp(`status.${payment.status}`)}
										</Badge>
									</TableCell>
									<TableCell className="hidden sm:table-cell">
										{payment.paymentMethod ? (
											<div className="flex items-center gap-1.5 text-sm">
												<BanknoteIcon className="size-3.5 text-muted-foreground" />
												<span>
													{tp(
														`methods.${methodKeys[payment.paymentMethod] ?? payment.paymentMethod}`,
													)}
												</span>
											</div>
										) : (
											<span className="text-muted-foreground">-</span>
										)}
									</TableCell>
									<TableCell className="hidden md:table-cell">
										<span className="text-sm">
											{payment.paymentDate
												? format(new Date(payment.paymentDate), "dd MMM, yyyy")
												: "-"}
										</span>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
													size="icon"
													variant="ghost"
												>
													<MoreHorizontalIcon className="shrink-0" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() =>
														NiceModal.show(PaymentsModal, {
															payment: {
																id: payment.id,
																sessionId: payment.sessionId,
																athleteId: payment.athleteId,
																amount: payment.amount,
																currency: payment.currency,
																status: payment.status,
																paymentMethod: payment.paymentMethod,
																paidAmount: payment.paidAmount,
																paymentDate: payment.paymentDate,
																receiptNumber: payment.receiptNumber,
																description: payment.description,
																notes: payment.notes,
																receiptImageKey: payment.receiptImageKey,
															},
															fixedAthletes: athletes,
														})
													}
												>
													<EditIcon className="mr-2 size-4" />
													{tp("edit")}
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() =>
														NiceModal.show(ConfirmationModal, {
															title: tp("deleteConfirm.title"),
															message: tp("deleteConfirm.message"),
															confirmLabel: tp("deleteConfirm.confirm"),
															destructive: true,
															onConfirm: () =>
																deleteMutation.mutate({
																	id: payment.id,
																}),
														})
													}
													variant="destructive"
												>
													<Trash2Icon className="mr-2 size-4" />
													{tp("delete")}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>
			)}
		</div>
	);
}
