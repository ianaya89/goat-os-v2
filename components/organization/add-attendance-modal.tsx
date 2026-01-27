"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	CalendarCheckIcon,
	CheckCircle2Icon,
	ClockIcon,
	XCircleIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface FormValues {
	sessionId: string;
	status: string;
	notes: string;
}

interface Session {
	id: string;
	title: string;
	startTime: Date;
	status: string;
}

interface AttendanceInitialValues {
	status: string;
	notes: string;
}

interface AddAttendanceModalProps {
	athleteId: string;
	athleteName?: string;
	sessions: Session[];
	/** Pre-select a session when opening the modal */
	initialSessionId?: string;
	/** Pre-fill form values for editing */
	initialValues?: AttendanceInitialValues;
}

const attendanceStatusOptions = [
	{
		value: "present",
		labelKey: "modal.present",
		icon: CheckCircle2Icon,
		color: "text-green-600",
		bgSelected: "bg-green-50 dark:bg-green-950",
		borderSelected: "border-green-300 dark:border-green-700",
	},
	{
		value: "absent",
		labelKey: "modal.absent",
		icon: XCircleIcon,
		color: "text-red-600",
		bgSelected: "bg-red-50 dark:bg-red-950",
		borderSelected: "border-red-300 dark:border-red-700",
	},
	{
		value: "late",
		labelKey: "modal.late",
		icon: ClockIcon,
		color: "text-yellow-600",
		bgSelected: "bg-yellow-50 dark:bg-yellow-950",
		borderSelected: "border-yellow-300 dark:border-yellow-700",
	},
	{
		value: "excused",
		labelKey: "modal.excused",
		icon: CalendarCheckIcon,
		color: "text-blue-600",
		bgSelected: "bg-blue-50 dark:bg-blue-950",
		borderSelected: "border-blue-300 dark:border-blue-700",
	},
];

export const AddAttendanceModal = NiceModal.create<AddAttendanceModalProps>(
	({ athleteId, athleteName, sessions, initialSessionId, initialValues }) => {
		const modal = useEnhancedModal();
		const t = useTranslations("athletes.attendance");
		const utils = trpc.useUtils();

		const isEditing = !!initialValues;
		const hasPreselectedSession = !!initialSessionId;

		// Find the pre-selected session for display
		const preselectedSession = hasPreselectedSession
			? sessions.find((s) => s.id === initialSessionId)
			: null;

		const form = useForm<FormValues>({
			defaultValues: {
				sessionId: initialSessionId ?? "",
				status: initialValues?.status ?? "present",
				notes: initialValues?.notes ?? "",
			},
		});

		const recordMutation = trpc.organization.attendance.record.useMutation({
			onSuccess: () => {
				toast.success(t("modal.savedSuccess"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = (values: FormValues) => {
			if (!values.sessionId) {
				toast.error(t("modal.selectSessionError"));
				return;
			}

			recordMutation.mutate({
				sessionId: values.sessionId,
				athleteId,
				status: values.status as
					| "present"
					| "absent"
					| "late"
					| "excused"
					| "pending",
				notes: values.notes || undefined,
				checkedInAt:
					values.status === "present" || values.status === "late"
						? new Date()
						: undefined,
			});
		};

		const selectedStatus = form.watch("status");
		const isPending = recordMutation.isPending;

		const getNotesPlaceholder = () => {
			switch (selectedStatus) {
				case "absent":
					return t("modal.notesPlaceholderAbsent");
				case "late":
					return t("modal.notesPlaceholderLate");
				case "excused":
					return t("modal.notesPlaceholderExcused");
				default:
					return t("modal.notesPlaceholderDefault");
			}
		};

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="flex flex-col p-0 sm:max-w-md"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
					hideDefaultHeader
				>
					{/* Custom Header with accent stripe */}
					<div className="relative shrink-0">
						{/* Accent stripe */}
						<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-500" />

						{/* Header content */}
						<div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm">
									<CalendarCheckIcon className="size-5" />
								</div>
								<div>
									<h2 className="font-semibold text-lg tracking-tight">
										{isEditing ? t("modal.editTitle") : t("modal.title")}
									</h2>
									{athleteName && (
										<p className="mt-0.5 text-muted-foreground text-sm">
											{t("modal.for", { name: athleteName })}
										</p>
									)}
								</div>
							</div>
							<button
								type="button"
								onClick={modal.handleClose}
								disabled={isPending}
								className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
							>
								<XIcon className="size-4" />
								<span className="sr-only">{t("modal.close")}</span>
							</button>
						</div>

						{/* Separator */}
						<div className="h-px bg-border" />
					</div>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex min-h-0 flex-1 flex-col"
						>
							<ScrollArea className="min-h-0 flex-1">
								<div className="space-y-4 px-6 py-4">
									{/* Session Selector - only show if not pre-selected */}
									{hasPreselectedSession ? (
										preselectedSession && (
											<div className="rounded-lg border bg-muted/30 px-3 py-2.5">
												<p className="text-xs text-muted-foreground">
													{t("modal.trainingSession")}
												</p>
												<p className="text-sm font-medium mt-0.5">
													{preselectedSession.title}
												</p>
												<p className="text-xs text-muted-foreground">
													{format(
														new Date(preselectedSession.startTime),
														"MMM d, yyyy 'at' h:mm a",
													)}
												</p>
											</div>
										)
									) : (
										<FormField
											control={form.control}
											name="sessionId"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm">
														{t("modal.trainingSession")}
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
													>
														<FormControl>
															<SelectTrigger className="h-9 w-full">
																<SelectValue
																	placeholder={t("modal.selectSession")}
																/>
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{sessions.length === 0 ? (
																<div className="py-4 text-center text-muted-foreground text-sm">
																	{t("modal.noSessions")}
																</div>
															) : (
																sessions.map((session) => (
																	<SelectItem
																		key={session.id}
																		value={session.id}
																	>
																		<div className="flex flex-col">
																			<span>{session.title}</span>
																			<span className="text-muted-foreground text-xs">
																				{format(
																					new Date(session.startTime),
																					"MMM d, yyyy 'at' h:mm a",
																				)}
																			</span>
																		</div>
																	</SelectItem>
																))
															)}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}

									{/* Status Selection */}
									<FormField
										control={form.control}
										name="status"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm">
													{t("modal.attendanceStatus")}
												</FormLabel>
												<div className="grid grid-cols-2 gap-2">
													{attendanceStatusOptions.map((option) => {
														const Icon = option.icon;
														const isSelected = field.value === option.value;
														return (
															<button
																key={option.value}
																type="button"
																onClick={() => field.onChange(option.value)}
																className={cn(
																	"flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
																	isSelected
																		? `${option.borderSelected} ${option.bgSelected}`
																		: "border-muted hover:border-muted-foreground/30 hover:bg-muted/50",
																)}
															>
																<Icon
																	className={cn(
																		"size-4",
																		isSelected
																			? option.color
																			: "text-muted-foreground",
																	)}
																/>
																<span
																	className={cn(
																		"font-medium text-sm",
																		isSelected
																			? "text-foreground"
																			: "text-muted-foreground",
																	)}
																>
																	{t(option.labelKey)}
																</span>
															</button>
														);
													})}
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Notes */}
									<FormField
										control={form.control}
										name="notes"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm">
													{t("modal.notes")}
												</FormLabel>
												<FormControl>
													<Textarea
														placeholder={getNotesPlaceholder()}
														className="min-h-[48px] resize-none text-sm"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</ScrollArea>

							{/* Footer */}
							<SheetFooter className="flex-row justify-end gap-3 border-t bg-muted/30 px-6 py-4">
								<Button
									type="button"
									variant="ghost"
									onClick={modal.handleClose}
									disabled={isPending}
								>
									{t("modal.cancel")}
								</Button>
								<Button
									type="submit"
									disabled={isPending || sessions.length === 0}
									loading={isPending}
								>
									{t("modal.save")}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
