"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	ActivityIcon,
	HeartIcon,
	Loader2Icon,
	SparklesIcon,
	StarIcon,
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
import { Label } from "@/components/ui/label";
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
	performanceRating: number | null;
	performanceNotes: string;
	attitudeRating: number | null;
	attitudeNotes: string;
	physicalFitnessRating: number | null;
	physicalFitnessNotes: string;
	generalNotes: string;
}

interface Session {
	id: string;
	title: string;
	startTime: Date;
	status: string;
}

interface AddEvaluationModalProps {
	athleteId: string;
	athleteName?: string;
	sessions: Session[];
}

function StarRating({
	label,
	icon: Icon,
	value,
	onChange,
}: {
	label: string;
	icon: React.ElementType;
	value: number | null;
	onChange: (value: number | null) => void;
}) {
	return (
		<div className="space-y-2">
			<Label className="flex items-center gap-2 text-sm">
				<Icon className="size-4 text-muted-foreground" />
				{label}
			</Label>
			<div className="flex items-center gap-1">
				{[1, 2, 3, 4, 5].map((star) => (
					<button
						key={star}
						type="button"
						onClick={() => onChange(value === star ? null : star)}
						className="p-1 rounded hover:bg-muted transition-colors"
					>
						<StarIcon
							className={cn(
								"size-6 transition-colors",
								value !== null && star <= value
									? "fill-yellow-400 text-yellow-400"
									: "text-muted-foreground/30",
							)}
						/>
					</button>
				))}
				{value && (
					<span className="ml-2 text-sm font-medium text-muted-foreground">
						{value}/5
					</span>
				)}
			</div>
		</div>
	);
}

export const AddEvaluationModal = NiceModal.create<AddEvaluationModalProps>(
	({ athleteId, athleteName, sessions }) => {
		const modal = useModal();
		const utils = trpc.useUtils();

		// Filter to only show completed sessions
		const completedSessions = sessions.filter((s) => s.status === "completed");

		const form = useForm<FormValues>({
			defaultValues: {
				sessionId: "",
				performanceRating: null,
				performanceNotes: "",
				attitudeRating: null,
				attitudeNotes: "",
				physicalFitnessRating: null,
				physicalFitnessNotes: "",
				generalNotes: "",
			},
		});

		const upsertMutation =
			trpc.organization.athleteEvaluation.upsert.useMutation({
				onSuccess: () => {
					toast.success("Evaluation saved successfully");
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

			if (
				!values.performanceRating &&
				!values.attitudeRating &&
				!values.physicalFitnessRating
			) {
				toast.error("Please provide at least one rating");
				return;
			}

			upsertMutation.mutate({
				sessionId: values.sessionId,
				athleteId,
				performanceRating: values.performanceRating,
				performanceNotes: values.performanceNotes || undefined,
				attitudeRating: values.attitudeRating,
				attitudeNotes: values.attitudeNotes || undefined,
				physicalFitnessRating: values.physicalFitnessRating,
				physicalFitnessNotes: values.physicalFitnessNotes || undefined,
				generalNotes: values.generalNotes || undefined,
			});
		};

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => {
					if (!open) modal.hide();
				}}
			>
				<SheetContent className="sm:max-w-lg p-0 flex flex-col">
					{/* Header */}
					<div className="bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent px-6 pt-6 pb-4">
						<SheetHeader>
							<SheetTitle className="flex items-center gap-3 text-xl">
								<div className="flex items-center justify-center size-10 rounded-full bg-yellow-500/10">
									<StarIcon className="size-5 text-yellow-500" />
								</div>
								<div>
									<span>Add Evaluation</span>
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
														<SelectValue placeholder="Select a completed session..." />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{completedSessions.length === 0 ? (
														<div className="py-6 text-center text-muted-foreground text-sm">
															No completed sessions available
														</div>
													) : (
														completedSessions.map((session) => (
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

								{/* Performance */}
								<div className="space-y-3">
									<FormField
										control={form.control}
										name="performanceRating"
										render={({ field }) => (
											<StarRating
												label="Performance"
												icon={SparklesIcon}
												value={field.value}
												onChange={field.onChange}
											/>
										)}
									/>
									<FormField
										control={form.control}
										name="performanceNotes"
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<Textarea
														placeholder="Performance notes..."
														className="resize-none min-h-[60px]"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<Separator />

								{/* Attitude */}
								<div className="space-y-3">
									<FormField
										control={form.control}
										name="attitudeRating"
										render={({ field }) => (
											<StarRating
												label="Attitude"
												icon={HeartIcon}
												value={field.value}
												onChange={field.onChange}
											/>
										)}
									/>
									<FormField
										control={form.control}
										name="attitudeNotes"
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<Textarea
														placeholder="Attitude notes..."
														className="resize-none min-h-[60px]"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<Separator />

								{/* Physical Fitness */}
								<div className="space-y-3">
									<FormField
										control={form.control}
										name="physicalFitnessRating"
										render={({ field }) => (
											<StarRating
												label="Physical Fitness"
												icon={ActivityIcon}
												value={field.value}
												onChange={field.onChange}
											/>
										)}
									/>
									<FormField
										control={form.control}
										name="physicalFitnessNotes"
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<Textarea
														placeholder="Physical fitness notes..."
														className="resize-none min-h-[60px]"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<Separator />

								{/* General Notes */}
								<FormField
									control={form.control}
									name="generalNotes"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-muted-foreground text-xs">
												General Notes
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Any additional observations..."
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
										disabled={upsertMutation.isPending}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										className="flex-1"
										disabled={
											upsertMutation.isPending || completedSessions.length === 0
										}
									>
										{upsertMutation.isPending && (
											<Loader2Icon className="mr-2 size-4 animate-spin" />
										)}
										Save Evaluation
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
