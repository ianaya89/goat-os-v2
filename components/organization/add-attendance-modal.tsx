"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	CalendarCheckIcon,
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	XCircleIcon,
} from "lucide-react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
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

interface AddAttendanceModalProps {
	athleteId: string;
	athleteName?: string;
	sessions: Session[];
}

const attendanceStatusOptions = [
	{
		value: "present",
		label: "Present",
		icon: CheckCircle2Icon,
		color: "text-green-600",
	},
	{
		value: "absent",
		label: "Absent",
		icon: XCircleIcon,
		color: "text-red-600",
	},
	{ value: "late", label: "Late", icon: ClockIcon, color: "text-yellow-600" },
	{
		value: "excused",
		label: "Excused",
		icon: CalendarCheckIcon,
		color: "text-blue-600",
	},
];

export const AddAttendanceModal = NiceModal.create<AddAttendanceModalProps>(
	({ athleteId, athleteName, sessions }) => {
		const modal = useModal();
		const utils = trpc.useUtils();

		const form = useForm<FormValues>({
			defaultValues: {
				sessionId: "",
				status: "present",
				notes: "",
			},
		});

		const recordMutation = trpc.organization.attendance.record.useMutation({
			onSuccess: () => {
				toast.success("Attendance recorded successfully");
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
				modal.hide();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = (values: FormValues) => {
			if (!values.sessionId) {
				toast.error("Please select a session");
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

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => {
					if (!open) modal.hide();
				}}
			>
				<SheetContent className="sm:max-w-lg p-0 flex flex-col">
					{/* Header */}
					<div className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent px-6 pt-6 pb-4">
						<SheetHeader>
							<SheetTitle className="flex items-center gap-3 text-xl">
								<div className="flex items-center justify-center size-10 rounded-full bg-green-500/10">
									<CalendarCheckIcon className="size-5 text-green-500" />
								</div>
								<div>
									<span>Record Attendance</span>
									{athleteName && (
										<p className="text-sm font-normal text-muted-foreground mt-0.5">
											for {athleteName}
										</p>
									)}
								</div>
							</SheetTitle>
						</SheetHeader>
					</div>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex-1 flex flex-col overflow-hidden"
						>
							<div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
								{/* Session Selector */}
								<FormField
									control={form.control}
									name="sessionId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Training Session</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="h-11">
														<SelectValue placeholder="Select a session..." />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{sessions.length === 0 ? (
														<div className="py-6 text-center text-muted-foreground text-sm">
															No sessions available
														</div>
													) : (
														sessions.map((session) => (
															<SelectItem key={session.id} value={session.id}>
																<div className="flex flex-col">
																	<span>{session.title}</span>
																	<span className="text-xs text-muted-foreground">
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

								<Separator />

								{/* Status Selection */}
								<FormField
									control={form.control}
									name="status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Attendance Status</FormLabel>
											<div className="grid grid-cols-2 gap-3">
												{attendanceStatusOptions.map((option) => {
													const Icon = option.icon;
													const isSelected = field.value === option.value;
													return (
														<button
															key={option.value}
															type="button"
															onClick={() => field.onChange(option.value)}
															className={cn(
																"flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
																isSelected
																	? "border-primary bg-primary/5"
																	: "border-muted hover:border-muted-foreground/30 hover:bg-muted/50",
															)}
														>
															<div
																className={cn(
																	"flex items-center justify-center size-10 rounded-full",
																	isSelected ? "bg-primary/10" : "bg-muted",
																)}
															>
																<Icon
																	className={cn(
																		"size-5",
																		isSelected
																			? option.color
																			: "text-muted-foreground",
																	)}
																/>
															</div>
															<span
																className={cn(
																	"font-medium",
																	isSelected
																		? "text-foreground"
																		: "text-muted-foreground",
																)}
															>
																{option.label}
															</span>
														</button>
													);
												})}
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Separator />

								{/* Notes */}
								<FormField
									control={form.control}
									name="notes"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-muted-foreground text-xs">
												Notes (Optional)
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder={
														selectedStatus === "absent"
															? "Reason for absence..."
															: selectedStatus === "late"
																? "Reason for being late..."
																: selectedStatus === "excused"
																	? "Reason for excused absence..."
																	: "Any additional notes..."
													}
													className="resize-none min-h-[80px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Footer */}
							<SheetFooter className="px-6 py-4 border-t bg-muted/30">
								<div className="flex gap-3 w-full">
									<Button
										type="button"
										variant="outline"
										className="flex-1"
										onClick={() => modal.hide()}
										disabled={recordMutation.isPending}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										className="flex-1"
										disabled={recordMutation.isPending || sessions.length === 0}
									>
										{recordMutation.isPending && (
											<Loader2Icon className="mr-2 size-4 animate-spin" />
										)}
										Record Attendance
									</Button>
								</div>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
