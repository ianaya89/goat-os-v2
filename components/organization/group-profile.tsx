"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	ArrowLeftIcon,
	CalendarCheckIcon,
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	EditIcon,
	MapPinIcon,
	PlusIcon,
	UsersIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { AthleteGroupsModal } from "@/components/organization/athlete-groups-modal";
import { SessionAttendanceModal } from "@/components/organization/session-attendance-modal";
import { TrainingSessionsModal } from "@/components/organization/training-sessions-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user/user-avatar";
import { capitalize, cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface GroupProfileProps {
	groupId: string;
}

const statusColors: Record<string, string> = {
	active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
	inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

const sessionStatusColors: Record<string, string> = {
	pending:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
	confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
	completed:
		"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
	cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

const sportLabels: Record<string, string> = {
	football: "Football",
	basketball: "Basketball",
	tennis: "Tennis",
	swimming: "Swimming",
	athletics: "Athletics",
	volleyball: "Volleyball",
	hockey: "Hockey",
	rugby: "Rugby",
	baseball: "Baseball",
	golf: "Golf",
	boxing: "Boxing",
	martial_arts: "Martial Arts",
	gymnastics: "Gymnastics",
	cycling: "Cycling",
	other: "Other",
};

export function GroupProfile({ groupId }: GroupProfileProps) {
	const utils = trpc.useUtils();

	const {
		data: group,
		isLoading,
		error,
	} = trpc.organization.athleteGroup.get.useQuery({ id: groupId });

	const { data: sessionsData, isLoading: isLoadingSessions } =
		trpc.organization.trainingSession.list.useQuery(
			{
				limit: 50,
				offset: 0,
				filters: { athleteGroupId: groupId },
				sortBy: "startTime",
				sortOrder: "desc",
			},
			{ enabled: !!groupId },
		);

	const removeMemberMutation =
		trpc.organization.athleteGroup.removeMembers.useMutation({
			onSuccess: () => {
				toast.success("Member removed successfully");
				utils.organization.athleteGroup.get.invalidate({ id: groupId });
			},
			onError: (error) => {
				toast.error(error.message || "Failed to remove member");
			},
		});

	if (isLoading) {
		return <GroupProfileSkeleton />;
	}

	if (error || !group) {
		return (
			<Card>
				<CardContent className="py-10 text-center">
					<p className="text-muted-foreground">Group not found</p>
					<Button asChild className="mt-4" variant="outline">
						<Link href="/dashboard/organization/athlete-groups">
							<ArrowLeftIcon className="mr-2 size-4" />
							Back to Groups
						</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const sessions = sessionsData?.sessions ?? [];
	const upcomingSessions = sessions.filter(
		(s) => new Date(s.startTime) > new Date() && s.status !== "cancelled",
	);
	const completedSessions = sessions.filter((s) => s.status === "completed");

	const handleEditGroup = () => {
		NiceModal.show(AthleteGroupsModal, { group });
	};

	const handleRemoveMember = (athleteId: string, athleteName: string) => {
		NiceModal.show(ConfirmationModal, {
			title: "Remove member?",
			message: `Are you sure you want to remove ${athleteName} from this group?`,
			confirmLabel: "Remove",
			destructive: true,
			onConfirm: () =>
				removeMemberMutation.mutate({
					groupId,
					athleteIds: [athleteId],
				}),
		});
	};

	const handleCreateSession = () => {
		NiceModal.show(TrainingSessionsModal);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					<Button asChild size="icon" variant="ghost">
						<Link href="/dashboard/organization/athlete-groups">
							<ArrowLeftIcon className="size-5" />
						</Link>
					</Button>
					<div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
						<UsersIcon className="size-8 text-primary" />
					</div>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="font-bold text-2xl">{group.name}</h1>
							<Badge
								className={cn(
									"border-none",
									group.isActive ? statusColors.active : statusColors.inactive,
								)}
							>
								{group.isActive ? "Active" : "Inactive"}
							</Badge>
						</div>
						{group.description && (
							<p className="mt-1 text-muted-foreground">{group.description}</p>
						)}
						<div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
							{group.sport && (
								<span className="flex items-center gap-1">
									<span className="font-medium">
										{sportLabels[group.sport] ?? capitalize(group.sport)}
									</span>
								</span>
							)}
							{group.ageCategory && (
								<span className="flex items-center gap-1">
									<span>•</span>
									<span>{group.ageCategory.displayName}</span>
								</span>
							)}
							{group.maxCapacity && (
								<span className="flex items-center gap-1">
									<span>•</span>
									<span>Max {group.maxCapacity} members</span>
								</span>
							)}
						</div>
					</div>
				</div>
				<Button onClick={handleEditGroup} variant="outline">
					<EditIcon className="mr-2 size-4" />
					Edit Group
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">Members</CardTitle>
						<UsersIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{group.memberCount}</div>
						{group.maxCapacity && (
							<p className="text-muted-foreground text-xs">
								of {group.maxCapacity} max capacity
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Upcoming Sessions
						</CardTitle>
						<CalendarIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{upcomingSessions.length}</div>
						<p className="text-muted-foreground text-xs">
							scheduled this month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-sm">
							Completed Sessions
						</CardTitle>
						<CheckCircleIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{completedSessions.length}</div>
						<p className="text-muted-foreground text-xs">total sessions</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="members" className="space-y-4">
				<TabsList>
					<TabsTrigger value="members">
						<UsersIcon className="mr-2 size-4" />
						Members ({group.memberCount})
					</TabsTrigger>
					<TabsTrigger value="sessions">
						<CalendarIcon className="mr-2 size-4" />
						Sessions ({sessions.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="members" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Group Members</CardTitle>
							<Button onClick={handleEditGroup} size="sm" variant="outline">
								<PlusIcon className="mr-2 size-4" />
								Add Members
							</Button>
						</CardHeader>
						<CardContent>
							{group.members.length === 0 ? (
								<div className="py-8 text-center text-muted-foreground">
									<UsersIcon className="mx-auto mb-3 size-10 opacity-50" />
									<p>No members in this group yet</p>
									<Button
										onClick={handleEditGroup}
										className="mt-4"
										variant="outline"
									>
										Add Members
									</Button>
								</div>
							) : (
								<div className="space-y-3">
									{group.members.map((member) => (
										<div
											key={member.id}
											className="flex items-center justify-between rounded-lg border p-3"
										>
											<Link
												href={`/dashboard/organization/athletes/${member.athlete.id}`}
												className="flex items-center gap-3 hover:opacity-80"
											>
												<UserAvatar
													className="size-10"
													name={member.athlete.user?.name ?? ""}
													src={member.athlete.user?.image ?? undefined}
												/>
												<div>
													<p className="font-medium">
														{member.athlete.user?.name ?? "Unknown"}
													</p>
													<p className="text-muted-foreground text-sm">
														{member.athlete.user?.email ?? ""}
													</p>
												</div>
											</Link>
											<Button
												variant="ghost"
												size="icon"
												className="text-muted-foreground hover:text-destructive"
												onClick={() =>
													handleRemoveMember(
														member.athlete.id,
														member.athlete.user?.name ?? "this member",
													)
												}
											>
												<XCircleIcon className="size-4" />
											</Button>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="sessions" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Training Sessions</CardTitle>
							<Button onClick={handleCreateSession} size="sm">
								<PlusIcon className="mr-2 size-4" />
								New Session
							</Button>
						</CardHeader>
						<CardContent>
							{isLoadingSessions ? (
								<div className="space-y-3">
									{[1, 2, 3].map((i) => (
										<Skeleton key={i} className="h-16 w-full" />
									))}
								</div>
							) : sessions.length === 0 ? (
								<div className="py-8 text-center text-muted-foreground">
									<CalendarIcon className="mx-auto mb-3 size-10 opacity-50" />
									<p>No sessions for this group yet</p>
									<Button
										onClick={handleCreateSession}
										className="mt-4"
										variant="outline"
									>
										Create First Session
									</Button>
								</div>
							) : (
								<div className="space-y-3">
									{sessions.map((session) => (
										<div
											key={session.id}
											className="flex items-center justify-between rounded-lg border p-3"
										>
											<Link
												href={`/dashboard/organization/training-sessions/${session.id}`}
												className="flex items-center gap-3 flex-1 hover:opacity-80"
											>
												<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
													<CalendarIcon className="size-5 text-primary" />
												</div>
												<div>
													<p className="font-medium">{session.title}</p>
													<div className="flex items-center gap-2 text-muted-foreground text-sm">
														<CalendarIcon className="size-3" />
														<span>
															{format(
																new Date(session.startTime),
																"EEE, dd MMM yyyy",
															)}
														</span>
														<ClockIcon className="ml-2 size-3" />
														<span>
															{format(new Date(session.startTime), "HH:mm")} -{" "}
															{format(new Date(session.endTime), "HH:mm")}
														</span>
													</div>
													{session.location && (
														<div className="flex items-center gap-1 text-muted-foreground text-sm">
															<MapPinIcon className="size-3" />
															<span>{session.location.name}</span>
														</div>
													)}
												</div>
											</Link>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														NiceModal.show(SessionAttendanceModal, {
															sessionId: session.id,
															sessionTitle: session.title,
															sessionDate: session.startTime,
															locationName: session.location?.name,
														})
													}
												>
													<CalendarCheckIcon className="mr-1 size-4" />
													Attendance
												</Button>
												<Badge
													className={cn(
														"border-none",
														sessionStatusColors[session.status] ??
															"bg-gray-100 dark:bg-gray-800",
													)}
												>
													{capitalize(session.status)}
												</Badge>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function GroupProfileSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header Skeleton */}
			<div className="flex items-start gap-4">
				<Skeleton className="size-10 rounded-md" />
				<Skeleton className="size-16 rounded-full" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>

			{/* Stats Skeleton */}
			<div className="grid gap-4 md:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
							<Skeleton className="mt-1 h-3 w-32" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Tabs Skeleton */}
			<div className="space-y-4">
				<Skeleton className="h-10 w-64" />
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent className="space-y-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
