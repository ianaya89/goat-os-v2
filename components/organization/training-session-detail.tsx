"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	ActivityIcon,
	ArrowLeftIcon,
	BellIcon,
	CalendarIcon,
	CheckCircleIcon,
	ChevronDownIcon,
	ClockIcon,
	EditIcon,
	MailIcon,
	MapPinIcon,
	MessageSquareIcon,
	PhoneIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { useOrganizationUserProfile } from "@/app/(saas)/dashboard/(sidebar)/organization/providers";
import { AttendanceForm } from "@/components/organization/attendance-form";
import { EvaluationForm } from "@/components/organization/evaluation-form";
import { SessionFeedbackModal } from "@/components/organization/session-feedback-modal";
import { SessionFeedbackView } from "@/components/organization/session-feedback-view";
import { TrainingSessionsModal } from "@/components/organization/training-sessions-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user/user-avatar";
import { TrainingSessionStatus } from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface TrainingSessionDetailProps {
	sessionId: string;
}

const statusColors: Record<string, string> = {
	pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
	confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
	completed:
		"bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
	cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
};

export function TrainingSessionDetail({
	sessionId,
}: TrainingSessionDetailProps) {
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

	const completeMutation =
		trpc.organization.trainingSession.complete.useMutation({
			onSuccess: () => {
				toast.success("Session marked as completed");
				utils.organization.trainingSession.get.invalidate({ id: sessionId });
				setIsCompletingSession(false);
			},
			onError: (error) => {
				toast.error(error.message || "Failed to complete session");
			},
		});

	const sendReminderMutation =
		trpc.organization.trainingSession.sendReminder.useMutation({
			onSuccess: (data) => {
				toast.success(
					`Reminder sent to ${data.sent} athlete${data.sent !== 1 ? "s" : ""}`,
				);
			},
			onError: (error) => {
				toast.error(error.message || "Failed to send reminder");
			},
		});

	React.useEffect(() => {
		if (session?.postSessionNotes) {
			setPostNotes(session.postSessionNotes);
		}
	}, [session?.postSessionNotes]);

	const handleEdit = () => {
		if (session) {
			NiceModal.show(TrainingSessionsModal, { session });
		}
	};

	const handleComplete = () => {
		completeMutation.mutate({
			id: sessionId,
			postSessionNotes: postNotes || undefined,
		});
	};

	const handleSendReminder = (channel: "email" | "sms" | "whatsapp") => {
		sendReminderMutation.mutate({ id: sessionId, channel });
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
					<p className="text-muted-foreground">Session not found</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard/organization/training-sessions">
							<ArrowLeftIcon className="mr-2 size-4" />
							Back to Sessions
						</Link>
					</Button>
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
			}))
		: session.athletes.map((a) => ({
				id: a.athlete.id,
				name: a.athlete.user?.name ?? "Unknown",
				image: a.athlete.user?.image ?? null,
			}));

	const coaches = session.coaches.map((c) => ({
		id: c.coach.id,
		name: c.coach.user?.name ?? "Unknown",
		image: c.coach.user?.image ?? null,
		isPrimary: c.isPrimary,
	}));

	const isCompleted = session.status === TrainingSessionStatus.completed;
	const isCancelled = session.status === TrainingSessionStatus.cancelled;
	const isFutureSession = new Date(session.startTime) > new Date();
	const canSendReminder =
		isFutureSession && !isCancelled && athletes.length > 0;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<Button asChild size="icon" variant="ghost">
						<Link href="/dashboard/organization/training-sessions">
							<ArrowLeftIcon className="size-5" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-bold text-2xl">{session.title}</h1>
							<Badge
								className={cn("border-none", statusColors[session.status])}
							>
								{capitalize(session.status)}
							</Badge>
						</div>
						{session.description && (
							<p className="mt-1 text-muted-foreground">
								{session.description}
							</p>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					{/* Admin/Coach actions */}
					{!isRestrictedMember && (
						<>
							{canSendReminder && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											disabled={sendReminderMutation.isPending}
										>
											<BellIcon className="mr-2 size-4" />
											{sendReminderMutation.isPending
												? "Sending..."
												: "Send Reminder"}
											<ChevronDownIcon className="ml-2 size-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() => handleSendReminder("email")}
										>
											<MailIcon className="mr-2 size-4" />
											Send via Email
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handleSendReminder("sms")}>
											<PhoneIcon className="mr-2 size-4" />
											Send via SMS
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => handleSendReminder("whatsapp")}
										>
											<MessageSquareIcon className="mr-2 size-4" />
											Send via WhatsApp
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
							<Button onClick={handleEdit} variant="outline">
								<EditIcon className="mr-2 size-4" />
								Edit
							</Button>
							{!isCompleted && !isCancelled && (
								<Button
									onClick={() => setIsCompletingSession(true)}
									variant="default"
								>
									<CheckCircleIcon className="mr-2 size-4" />
									Complete Session
								</Button>
							)}
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
						>
							<ActivityIcon className="mr-2 size-4" />
							Dar Feedback
						</Button>
					)}
				</div>
			</div>

			{/* Complete Session Dialog - Admin/Coach only */}
			{!isRestrictedMember && isCompletingSession && (
				<Card className="border-primary">
					<CardHeader>
						<CardTitle className="text-lg">Complete Session</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="post-notes" className="font-medium text-sm">
								Post-Session Notes (optional)
							</label>
							<Textarea
								id="post-notes"
								placeholder="Enter any notes about how the session went..."
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
								Cancel
							</Button>
							<Button
								onClick={handleComplete}
								loading={completeMutation.isPending}
							>
								Mark as Completed
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Session Info Grid */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Date & Time */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<CalendarIcon className="size-4" />
							Schedule
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center gap-2 text-sm">
							<span className="text-muted-foreground">Date:</span>
							<span className="font-medium">
								{format(new Date(session.startTime), "EEEE, MMMM d, yyyy")}
							</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<ClockIcon className="size-4 text-muted-foreground" />
							<span>
								{format(new Date(session.startTime), "h:mm a")} -{" "}
								{format(new Date(session.endTime), "h:mm a")}
							</span>
						</div>
						{session.location && (
							<div className="flex items-center gap-2 text-sm">
								<MapPinIcon className="size-4 text-muted-foreground" />
								<span>{session.location.name}</span>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Coaches */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<UserIcon className="size-4" />
							Coaches ({coaches.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{coaches.map((coach) => (
								<div key={coach.id} className="flex items-center gap-3">
									<UserAvatar
										className="size-8"
										name={coach.name}
										src={coach.image ?? undefined}
									/>
									<span className="font-medium text-sm">{coach.name}</span>
									{coach.isPrimary && (
										<Badge variant="secondary" className="text-xs">
											Primary
										</Badge>
									)}
								</div>
							))}
							{coaches.length === 0 && (
								<p className="text-muted-foreground text-sm">
									No coaches assigned
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Athletes */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<UsersIcon className="size-4" />
						Athletes ({athletes.length})
						{session.athleteGroup && (
							<Badge variant="outline" className="ml-2">
								{session.athleteGroup.name}
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-3">
						{athletes.map((athlete) => (
							<div
								key={athlete.id}
								className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2"
							>
								<UserAvatar
									className="size-6"
									name={athlete.name}
									src={athlete.image ?? undefined}
								/>
								<span className="text-sm">{athlete.name}</span>
							</div>
						))}
						{athletes.length === 0 && (
							<p className="text-muted-foreground text-sm">
								No athletes assigned
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Objectives and Planning */}
			{(session.objectives || session.planning) && (
				<div className="grid gap-6 md:grid-cols-2">
					{session.objectives && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Objectives</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="whitespace-pre-wrap text-sm">
									{session.objectives}
								</p>
							</CardContent>
						</Card>
					)}
					{session.planning && (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Planning</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="whitespace-pre-wrap text-sm">
									{session.planning}
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* Post-Session Notes (if completed) */}
			{session.postSessionNotes && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Post-Session Notes</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="whitespace-pre-wrap text-sm">
							{session.postSessionNotes}
						</p>
					</CardContent>
				</Card>
			)}

			{/* Attendance, Evaluations & Feedback Tabs */}
			{isRestrictedMember ? (
				/* Athlete view - only show feedback */
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Mi Feedback</CardTitle>
					</CardHeader>
					<CardContent>
						<SessionFeedbackView sessionId={sessionId} athleteView />
					</CardContent>
				</Card>
			) : (
				/* Admin/Coach view - show all tabs */
				<Tabs defaultValue="attendance" className="space-y-4">
					<TabsList>
						<TabsTrigger value="attendance">Attendance</TabsTrigger>
						<TabsTrigger value="evaluations">Evaluations</TabsTrigger>
						<TabsTrigger value="feedback">Athlete Feedback</TabsTrigger>
					</TabsList>
					<TabsContent value="attendance">
						<AttendanceForm sessionId={sessionId} />
					</TabsContent>
					<TabsContent value="evaluations">
						<EvaluationForm sessionId={sessionId} />
					</TabsContent>
					<TabsContent value="feedback">
						<SessionFeedbackView sessionId={sessionId} />
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
