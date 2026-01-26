"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format, setHours, setMinutes } from "date-fns";
import {
	CalendarIcon,
	CheckIcon,
	ClockIcon,
	RepeatIcon,
	XIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { RecurringSessionForm } from "@/components/organization/recurring-session-form";
import { SessionAttachmentUpload } from "@/components/organization/session-attachment-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Field } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user/user-avatar";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	TrainingSessionStatus,
	TrainingSessionStatuses,
} from "@/lib/db/schema/enums";
import {
	createRRuleString,
	type RecurrenceConfig,
} from "@/lib/training/rrule-utils";
import { capitalize, cn } from "@/lib/utils";
import {
	createTrainingSessionSchema,
	updateTrainingSessionSchema,
} from "@/schemas/organization-training-session-schemas";
import { trpc } from "@/trpc/client";

interface SessionCoach {
	id: string;
	isPrimary: boolean;
	coach: {
		id: string;
		user: {
			id: string;
			name: string;
			image: string | null;
		} | null;
	};
}

interface SessionAthlete {
	id: string;
	athlete: {
		id: string;
		user: {
			id: string;
			name: string;
			image: string | null;
		} | null;
	};
}

export type TrainingSessionsModalProps = NiceModalHocProps & {
	session?: {
		id: string;
		title: string;
		description?: string | null;
		startTime: Date;
		endTime: Date;
		status: string;
		location?: { id: string; name: string } | null;
		athleteGroup?: { id: string; name: string } | null;
		coaches: SessionCoach[];
		athletes: SessionAthlete[];
		objectives?: string | null;
		planning?: string | null;
		postSessionNotes?: string | null;
		isRecurring?: boolean;
		rrule?: string | null;
		attachmentKey?: string | null;
	};
};

export const TrainingSessionsModal =
	NiceModal.create<TrainingSessionsModalProps>(({ session }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!session;

		const [selectedCoachIds, setSelectedCoachIds] = React.useState<string[]>(
			session?.coaches.map((c) => c.coach.id) ?? [],
		);
		const [primaryCoachId, setPrimaryCoachId] = React.useState<string | null>(
			session?.coaches.find((c) => c.isPrimary)?.coach.id ?? null,
		);
		const [selectedAthleteIds, setSelectedAthleteIds] = React.useState<
			string[]
		>(session?.athletes.map((a) => a.athlete.id) ?? []);
		const [assignmentType, setAssignmentType] = React.useState<
			"group" | "athletes"
		>(session?.athleteGroup ? "group" : "athletes");
		const [coachPopoverOpen, setCoachPopoverOpen] = React.useState(false);
		const [athletePopoverOpen, setAthletePopoverOpen] = React.useState(false);
		const [isRecurring, setIsRecurring] = React.useState(
			session?.isRecurring ?? false,
		);
		const [recurrenceConfig, setRecurrenceConfig] =
			React.useState<RecurrenceConfig>({
				frequency: "weekly",
			});

		// Duration state (in minutes) - calculate from existing session or default to 60
		const [duration, setDuration] = React.useState<number>(() => {
			if (session?.startTime && session?.endTime) {
				const diff =
					new Date(session.endTime).getTime() -
					new Date(session.startTime).getTime();
				return Math.round(diff / (60 * 1000)); // Convert ms to minutes
			}
			return 60; // Default 1 hour
		});

		// Fetch data for dropdowns
		const { data: locationsData } =
			trpc.organization.location.listActive.useQuery();
		const { data: groupsData } =
			trpc.organization.athleteGroup.listActive.useQuery();
		const { data: coachesData } = trpc.organization.coach.list.useQuery({
			limit: 100,
			offset: 0,
		});
		const { data: athletesData } = trpc.organization.athlete.list.useQuery({
			limit: 100,
			offset: 0,
		});

		const locations = locationsData ?? [];
		const groups = groupsData ?? [];
		const coaches = coachesData?.coaches ?? [];
		const athletes = athletesData?.athletes ?? [];

		const createSessionMutation =
			trpc.organization.trainingSession.create.useMutation({
				onSuccess: () => {
					toast.success("Session created successfully");
					utils.organization.trainingSession.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Failed to create session");
				},
			});

		const updateSessionMutation =
			trpc.organization.trainingSession.update.useMutation({
				onSuccess: () => {
					toast.success("Session updated successfully");
					utils.organization.trainingSession.list.invalidate();
				},
				onError: (error) => {
					toast.error(error.message || "Failed to update session");
				},
			});

		const updateCoachesMutation =
			trpc.organization.trainingSession.updateCoaches.useMutation({
				onError: (error) => {
					toast.error(error.message || "Failed to update coaches");
				},
			});

		const updateAthletesMutation =
			trpc.organization.trainingSession.updateAthletes.useMutation({
				onSuccess: () => {
					utils.organization.trainingSession.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Failed to update athletes");
				},
			});

		// Generate time options in 15-minute intervals (from 05:00 to 23:00)
		const timeOptions = React.useMemo(() => {
			const options: { value: string; label: string }[] = [];
			for (let hour = 5; hour <= 23; hour++) {
				for (let minute = 0; minute < 60; minute += 15) {
					const h = hour.toString().padStart(2, "0");
					const m = minute.toString().padStart(2, "0");
					options.push({
						value: `${h}:${m}`,
						label: `${h}:${m}`,
					});
				}
			}
			return options;
		}, []);

		// Get current time value from form
		const getTimeFromDate = (date: Date | undefined): string => {
			if (!date) return "09:00";
			const d = new Date(date);
			const h = d.getHours().toString().padStart(2, "0");
			const m = ((Math.round(d.getMinutes() / 15) * 15) % 60)
				.toString()
				.padStart(2, "0");
			return `${h}:${m}`;
		};

		// Combine date and time into a single Date
		const combineDateAndTime = (date: Date, timeString: string): Date => {
			const parts = timeString.split(":");
			const hours = parseInt(parts[0] ?? "9", 10);
			const minutes = parseInt(parts[1] ?? "0", 10);
			return setMinutes(setHours(new Date(date), hours), minutes);
		};

		const form = useZodForm({
			schema: isEditing
				? updateTrainingSessionSchema
				: createTrainingSessionSchema,
			defaultValues: isEditing
				? {
						id: session.id,
						title: session.title,
						description: session.description ?? "",
						startTime: session.startTime,
						endTime: session.endTime,
						status: session.status as TrainingSessionStatus,
						locationId: session.location?.id ?? null,
						athleteGroupId: session.athleteGroup?.id ?? null,
						objectives: session.objectives ?? "",
						planning: session.planning ?? "",
						postSessionNotes: session.postSessionNotes ?? "",
					}
				: {
						title: "",
						description: "",
						startTime: new Date(),
						endTime: new Date(Date.now() + 60 * 60 * 1000), // +1 hour
						status: TrainingSessionStatus.pending,
						locationId: null,
						athleteGroupId: null,
						athleteIds: [],
						coachIds: [],
						objectives: "",
						planning: "",
					},
		});

		const onSubmit = form.handleSubmit(async (data) => {
			// Calculate endTime from startTime + duration
			const startTime = new Date(data.startTime as Date);
			const calculatedEndTime = new Date(
				startTime.getTime() + duration * 60 * 1000,
			);

			if (isEditing) {
				// Update session info with calculated endTime
				await updateSessionMutation.mutateAsync({
					...(data as Parameters<typeof updateSessionMutation.mutateAsync>[0]),
					endTime: calculatedEndTime,
				});
				// Update coaches
				await updateCoachesMutation.mutateAsync({
					sessionId: session.id,
					coachIds: selectedCoachIds,
					primaryCoachId: primaryCoachId ?? undefined,
				});
				// Update athletes (only if using individual athletes, not group)
				if (assignmentType === "athletes") {
					await updateAthletesMutation.mutateAsync({
						sessionId: session.id,
						athleteIds: selectedAthleteIds,
					});
				} else {
					modal.handleClose();
				}
			} else {
				// Generate rrule string if recurring
				const rrule = isRecurring
					? createRRuleString(startTime, recurrenceConfig)
					: undefined;

				createSessionMutation.mutate({
					...(data as Parameters<typeof createSessionMutation.mutate>[0]),
					endTime: calculatedEndTime,
					coachIds: selectedCoachIds,
					primaryCoachId: primaryCoachId ?? undefined,
					athleteIds:
						assignmentType === "athletes" ? selectedAthleteIds : undefined,
					athleteGroupId:
						assignmentType === "group"
							? (data as { athleteGroupId?: string | null }).athleteGroupId
							: null,
					isRecurring,
					rrule,
				});
			}
		});

		const isPending =
			createSessionMutation.isPending ||
			updateSessionMutation.isPending ||
			updateCoachesMutation.isPending ||
			updateAthletesMutation.isPending;

		const toggleCoach = (coachId: string) => {
			setSelectedCoachIds((prev) => {
				if (prev.includes(coachId)) {
					// If removing and this was primary, clear primary
					if (primaryCoachId === coachId) {
						setPrimaryCoachId(null);
					}
					return prev.filter((id) => id !== coachId);
				}
				return [...prev, coachId];
			});
		};

		const toggleAthlete = (athleteId: string) => {
			setSelectedAthleteIds((prev) =>
				prev.includes(athleteId)
					? prev.filter((id) => id !== athleteId)
					: [...prev, athleteId],
			);
		};

		const selectedCoaches = coaches.filter((c) =>
			selectedCoachIds.includes(c.id),
		);
		const selectedAthletes = athletes.filter((a) =>
			selectedAthleteIds.includes(a.id),
		);

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="sm:max-w-xl"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<SheetHeader>
						<SheetTitle>
							{isEditing ? "Edit Session" : "Create Session"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Update the session information below."
								: "Fill in the details to create a new training session."}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<ScrollArea className="flex-1">
								<Tabs defaultValue="basic" className="w-full">
									<TabsList className="mx-6 mt-4 grid w-auto grid-cols-4">
										<TabsTrigger value="basic">Basic</TabsTrigger>
										<TabsTrigger value="assignment">Assignment</TabsTrigger>
										<TabsTrigger value="recurring" disabled={isEditing}>
											<RepeatIcon className="mr-1 size-3" />
											Repeat
										</TabsTrigger>
										<TabsTrigger value="content">Content</TabsTrigger>
									</TabsList>

									<TabsContent value="basic" className="space-y-4 px-6 py-4">
										<FormField
											control={form.control}
											name="title"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Title</FormLabel>
														<FormControl>
															<Input
																placeholder="e.g., Morning Training"
																autoComplete="off"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="description"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Description</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Session description..."
																className="resize-none"
																rows={2}
																{...field}
																value={field.value ?? ""}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										{/* Date Picker */}
										<FormField
											control={form.control}
											name="startTime"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Date</FormLabel>
														<Popover>
															<PopoverTrigger asChild>
																<FormControl>
																	<Button
																		variant="outline"
																		className={cn(
																			"w-full justify-start text-left font-normal",
																			!field.value && "text-muted-foreground",
																		)}
																	>
																		<CalendarIcon className="mr-2 size-4" />
																		{field.value
																			? format(
																					new Date(
																						field.value as
																							| string
																							| number
																							| Date,
																					),
																					"EEE, dd MMM yyyy",
																				)
																			: "Select date"}
																	</Button>
																</FormControl>
															</PopoverTrigger>
															<PopoverContent
																className="w-auto p-0"
																align="start"
															>
																<Calendar
																	mode="single"
																	selected={
																		field.value
																			? new Date(
																					field.value as string | number | Date,
																				)
																			: undefined
																	}
																	onSelect={(date) => {
																		if (date) {
																			const currentTime = getTimeFromDate(
																				field.value
																					? new Date(
																							field.value as
																								| string
																								| number
																								| Date,
																						)
																					: undefined,
																			);
																			field.onChange(
																				combineDateAndTime(date, currentTime),
																			);
																		}
																	}}
																	initialFocus
																/>
															</PopoverContent>
														</Popover>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										{/* Time and Duration row */}
										<div className="grid grid-cols-2 gap-4">
											<FormField
												control={form.control}
												name="startTime"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Time</FormLabel>
															<Select
																value={getTimeFromDate(
																	field.value
																		? new Date(
																				field.value as string | number | Date,
																			)
																		: undefined,
																)}
																onValueChange={(time) => {
																	const currentDate = field.value
																		? new Date(
																				field.value as string | number | Date,
																			)
																		: new Date();
																	field.onChange(
																		combineDateAndTime(currentDate, time),
																	);
																}}
															>
																<FormControl>
																	<SelectTrigger>
																		<ClockIcon className="mr-2 size-4 text-muted-foreground" />
																		<SelectValue placeholder="Select time" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent className="max-h-[280px]">
																	{timeOptions.map((option) => (
																		<SelectItem
																			key={option.value}
																			value={option.value}
																		>
																			{option.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>

											<Field>
												<FormLabel>Duration</FormLabel>
												<Select
													onValueChange={(value) =>
														setDuration(parseInt(value, 10))
													}
													value={duration.toString()}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select duration" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="15">15 min</SelectItem>
														<SelectItem value="30">30 min</SelectItem>
														<SelectItem value="45">45 min</SelectItem>
														<SelectItem value="60">1 hour</SelectItem>
														<SelectItem value="75">1h 15min</SelectItem>
														<SelectItem value="90">1h 30min</SelectItem>
														<SelectItem value="105">1h 45min</SelectItem>
														<SelectItem value="120">2 hours</SelectItem>
														<SelectItem value="150">2h 30min</SelectItem>
														<SelectItem value="180">3 hours</SelectItem>
													</SelectContent>
												</Select>
											</Field>
										</div>

										<FormField
											control={form.control}
											name="locationId"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Location</FormLabel>
														<Select
															onValueChange={(value) =>
																field.onChange(value === "none" ? null : value)
															}
															value={field.value ?? "none"}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Select location" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="none">
																	No location
																</SelectItem>
																{locations.map((location) => (
																	<SelectItem
																		key={location.id}
																		value={location.id}
																	>
																		{location.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="status"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Status</FormLabel>
														<Select
															onValueChange={field.onChange}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Select status" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{TrainingSessionStatuses.map((status) => (
																	<SelectItem key={status} value={status}>
																		{capitalize(status)}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
									</TabsContent>

									<TabsContent
										value="assignment"
										className="space-y-4 px-6 py-4"
									>
										{/* Coaches */}
										<Field>
											<FormLabel>Coaches</FormLabel>
											<Popover
												open={coachPopoverOpen}
												onOpenChange={setCoachPopoverOpen}
											>
												<PopoverTrigger asChild>
													<Button
														variant="outline"
														className="w-full justify-start font-normal"
													>
														{selectedCoachIds.length > 0
															? `${selectedCoachIds.length} coach${selectedCoachIds.length > 1 ? "es" : ""} selected`
															: "Select coaches..."}
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-[300px] p-0" align="start">
													<Command>
														<CommandInput placeholder="Search coaches..." />
														<CommandList>
															{coaches.length === 0 ? (
																<div className="px-4 py-6 text-center text-muted-foreground text-sm">
																	No coaches available. Create a coach first.
																</div>
															) : (
																<>
																	<CommandEmpty>No coaches found.</CommandEmpty>
																	<CommandGroup>
																		{coaches.map((coach) => {
																			const isSelected =
																				selectedCoachIds.includes(coach.id);
																			return (
																				<CommandItem
																					key={coach.id}
																					value={coach.user?.name ?? coach.id}
																					onSelect={() => toggleCoach(coach.id)}
																				>
																					<div className="flex items-center gap-2">
																						<div
																							className={cn(
																								"flex size-4 items-center justify-center rounded-sm border",
																								isSelected
																									? "border-primary bg-primary text-primary-foreground"
																									: "border-muted-foreground",
																							)}
																						>
																							{isSelected && (
																								<CheckIcon className="size-3" />
																							)}
																						</div>
																						<UserAvatar
																							className="size-6"
																							name={coach.user?.name ?? ""}
																							src={
																								coach.user?.image ?? undefined
																							}
																						/>
																						<span className="truncate">
																							{coach.user?.name ?? "Unknown"}
																						</span>
																					</div>
																				</CommandItem>
																			);
																		})}
																	</CommandGroup>
																</>
															)}
														</CommandList>
													</Command>
												</PopoverContent>
											</Popover>

											{selectedCoaches.length > 0 && (
												<div className="mt-2 space-y-2">
													{selectedCoaches.map((coach) => (
														<div
															key={coach.id}
															className="flex items-center justify-between rounded-md border px-3 py-2"
														>
															<div className="flex items-center gap-2">
																<UserAvatar
																	className="size-6"
																	name={coach.user?.name ?? ""}
																	src={coach.user?.image ?? undefined}
																/>
																<span className="text-sm">
																	{coach.user?.name ?? "Unknown"}
																</span>
																{primaryCoachId === coach.id && (
																	<Badge
																		variant="secondary"
																		className="text-xs"
																	>
																		Primary
																	</Badge>
																)}
															</div>
															<div className="flex items-center gap-1">
																{primaryCoachId !== coach.id && (
																	<Button
																		type="button"
																		variant="ghost"
																		size="sm"
																		onClick={() => setPrimaryCoachId(coach.id)}
																	>
																		Set Primary
																	</Button>
																)}
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="size-6"
																	onClick={() => toggleCoach(coach.id)}
																>
																	<XIcon className="size-4" />
																</Button>
															</div>
														</div>
													))}
												</div>
											)}
										</Field>

										{/* Athletes assignment type */}
										<Field>
											<FormLabel>Assign Athletes By</FormLabel>
											<Select
												value={assignmentType}
												onValueChange={(value: "group" | "athletes") =>
													setAssignmentType(value)
												}
											>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="group">Athlete Group</SelectItem>
													<SelectItem value="athletes">
														Individual Athletes
													</SelectItem>
												</SelectContent>
											</Select>
										</Field>

										{assignmentType === "group" ? (
											<FormField
												control={form.control}
												name="athleteGroupId"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Athlete Group</FormLabel>
															<Select
																onValueChange={(value) =>
																	field.onChange(
																		value === "none" ? null : value,
																	)
																}
																value={field.value ?? "none"}
															>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue placeholder="Select group" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="none">No group</SelectItem>
																	{groups.map((group) => (
																		<SelectItem key={group.id} value={group.id}>
																			{group.name} ({group.memberCount} members)
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										) : (
											<Field>
												<FormLabel>Athletes</FormLabel>
												<Popover
													open={athletePopoverOpen}
													onOpenChange={setAthletePopoverOpen}
												>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															className="w-full justify-start font-normal"
														>
															{selectedAthleteIds.length > 0
																? `${selectedAthleteIds.length} athlete${selectedAthleteIds.length > 1 ? "s" : ""} selected`
																: "Select athletes..."}
														</Button>
													</PopoverTrigger>
													<PopoverContent
														className="w-[300px] p-0"
														align="start"
													>
														<Command>
															<CommandInput placeholder="Search athletes..." />
															<CommandList>
																{athletes.length === 0 ? (
																	<div className="px-4 py-6 text-center text-muted-foreground text-sm">
																		No athletes available. Create an athlete
																		first.
																	</div>
																) : (
																	<>
																		<CommandEmpty>
																			No athletes found.
																		</CommandEmpty>
																		<CommandGroup>
																			{athletes.map((athlete) => {
																				const isSelected =
																					selectedAthleteIds.includes(
																						athlete.id,
																					);
																				return (
																					<CommandItem
																						key={athlete.id}
																						value={
																							athlete.user?.name ?? athlete.id
																						}
																						onSelect={() =>
																							toggleAthlete(athlete.id)
																						}
																					>
																						<div className="flex items-center gap-2">
																							<div
																								className={cn(
																									"flex size-4 items-center justify-center rounded-sm border",
																									isSelected
																										? "border-primary bg-primary text-primary-foreground"
																										: "border-muted-foreground",
																								)}
																							>
																								{isSelected && (
																									<CheckIcon className="size-3" />
																								)}
																							</div>
																							<UserAvatar
																								className="size-6"
																								name={athlete.user?.name ?? ""}
																								src={
																									athlete.user?.image ??
																									undefined
																								}
																							/>
																							<span className="truncate">
																								{athlete.user?.name ??
																									"Unknown"}
																							</span>
																						</div>
																					</CommandItem>
																				);
																			})}
																		</CommandGroup>
																	</>
																)}
															</CommandList>
														</Command>
													</PopoverContent>
												</Popover>

												{selectedAthletes.length > 0 && (
													<div className="mt-2 flex flex-wrap gap-1">
														{selectedAthletes.map((athlete) => (
															<Badge
																key={athlete.id}
																variant="secondary"
																className="gap-1"
															>
																{athlete.user?.name ?? "Unknown"}
																<button
																	type="button"
																	onClick={() => toggleAthlete(athlete.id)}
																	className="ml-1 rounded-full hover:bg-muted-foreground/20"
																>
																	<XIcon className="size-3" />
																</button>
															</Badge>
														))}
													</div>
												)}
											</Field>
										)}
									</TabsContent>

									<TabsContent value="recurring" className="px-6 py-4">
										<RecurringSessionForm
											isRecurring={isRecurring}
											onIsRecurringChange={setIsRecurring}
											recurrenceConfig={recurrenceConfig}
											onRecurrenceConfigChange={setRecurrenceConfig}
										/>
									</TabsContent>

									<TabsContent value="content" className="space-y-4 px-6 py-4">
										<FormField
											control={form.control}
											name="objectives"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Objectives</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Training objectives..."
																className="resize-none"
																rows={3}
																{...field}
																value={field.value ?? ""}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="planning"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Planning</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Session planning and activities..."
																className="resize-none"
																rows={4}
																{...field}
																value={field.value ?? ""}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										{isEditing && (
											<FormField
												control={form.control}
												name="postSessionNotes"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Post-Session Notes</FormLabel>
															<FormControl>
																<Textarea
																	placeholder="Notes after the session..."
																	className="resize-none"
																	rows={3}
																	{...field}
																	value={field.value ?? ""}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										)}

										<Field>
											<FormLabel>Attachment</FormLabel>
											<SessionAttachmentUpload
												sessionId={session?.id}
												hasAttachment={!!session?.attachmentKey}
												onUploadComplete={() => {
													utils.organization.trainingSession.get.invalidate({
														id: session?.id,
													});
												}}
												disabled={isPending}
											/>
											<FormDescription>
												Attach a PDF or image (max 10MB)
											</FormDescription>
										</Field>
									</TabsContent>
								</Tabs>
							</ScrollArea>

							<SheetFooter className="flex-row justify-end gap-2 border-t">
								<Button
									type="button"
									variant="outline"
									onClick={modal.handleClose}
									disabled={isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isPending} loading={isPending}>
									{isEditing ? "Update Session" : "Create Session"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	});
