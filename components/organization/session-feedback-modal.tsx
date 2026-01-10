"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { ActivityIcon, Loader2Icon, SmileIcon, StarIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface FormValues {
	rpeRating: number | null;
	satisfactionRating: number | null;
	notes: string;
}

interface SessionFeedbackModalProps {
	sessionId: string;
	sessionTitle: string;
}

// RPE descriptions based on Borg CR10 scale
const rpeDescriptions: Record<number, string> = {
	1: "Very light - Rest",
	2: "Light",
	3: "Moderate",
	4: "Somewhat hard",
	5: "Hard",
	6: "Hard",
	7: "Very hard",
	8: "Very hard",
	9: "Extremely hard",
	10: "Maximum effort",
};

// Helper to get color based on RPE value
function getRpeColor(value: number): string {
	if (value <= 2) return "text-green-600";
	if (value <= 4) return "text-blue-600";
	if (value <= 6) return "text-yellow-600";
	if (value <= 8) return "text-orange-600";
	return "text-red-600";
}

function getRpeBgColor(value: number): string {
	if (value <= 2) return "bg-green-100 dark:bg-green-950";
	if (value <= 4) return "bg-blue-100 dark:bg-blue-950";
	if (value <= 6) return "bg-yellow-100 dark:bg-yellow-950";
	if (value <= 8) return "bg-orange-100 dark:bg-orange-950";
	return "bg-red-100 dark:bg-red-950";
}

// Helper to get satisfaction emoji
function getSatisfactionEmoji(value: number): string {
	if (value <= 2) return "😫";
	if (value <= 4) return "😕";
	if (value <= 6) return "😐";
	if (value <= 8) return "🙂";
	return "😊";
}

function getSatisfactionColor(value: number): string {
	if (value <= 2) return "text-red-600";
	if (value <= 4) return "text-orange-600";
	if (value <= 6) return "text-yellow-600";
	if (value <= 8) return "text-blue-600";
	return "text-green-600";
}

export const SessionFeedbackModal = NiceModal.create(
	({ sessionId, sessionTitle }: SessionFeedbackModalProps) => {
		const modal = useModal();
		const utils = trpc.useUtils();

		const { data, isLoading } =
			trpc.organization.sessionFeedback.getMyFeedback.useQuery({
				sessionId,
			});

		const form = useForm<FormValues>({
			defaultValues: {
				rpeRating: null,
				satisfactionRating: null,
				notes: "",
			},
		});

		// Update form when data loads
		useEffect(() => {
			if (data?.feedback) {
				form.reset({
					rpeRating: data.feedback.rpeRating,
					satisfactionRating: data.feedback.satisfactionRating,
					notes: data.feedback.notes ?? "",
				});
			}
		}, [data?.feedback, form]);

		const upsertMutation =
			trpc.organization.sessionFeedback.upsert.useMutation({
				onSuccess: () => {
					toast.success("Feedback submitted successfully!");
					utils.organization.sessionFeedback.getMyFeedback.invalidate({
						sessionId,
					});
					utils.organization.sessionFeedback.getSessionFeedback.invalidate({
						sessionId,
					});
					utils.organization.trainingSession.listMySessionsAsAthlete.invalidate();
					modal.hide();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const onSubmit = (values: FormValues) => {
			upsertMutation.mutate({
				sessionId,
				rpeRating: values.rpeRating,
				satisfactionRating: values.satisfactionRating,
				notes: values.notes || undefined,
			});
		};

		const canSubmitRpe = data?.canSubmitRpe ?? false;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => {
					if (!open) modal.hide();
				}}
			>
				<SheetContent className="overflow-y-auto sm:max-w-lg">
					<SheetHeader>
						<SheetTitle className="flex items-center gap-2">
							<ActivityIcon className="size-5 text-blue-500" />
							Session Feedback
						</SheetTitle>
						<SheetDescription>
							Share how you felt during "{sessionTitle}"
						</SheetDescription>
					</SheetHeader>

					{isLoading ? (
						<div className="flex items-center justify-center py-10">
							<Loader2Icon className="size-6 animate-spin text-muted-foreground" />
						</div>
					) : (
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="mt-6 space-y-6"
							>
								{/* RPE Section */}
								<div className="space-y-4 rounded-lg border p-4">
									<h3 className="flex items-center gap-2 font-medium">
										<ActivityIcon className="size-4" />
										Perceived Exertion (RPE)
									</h3>

									{!canSubmitRpe && (
										<p className="text-muted-foreground text-sm">
											RPE can only be submitted after the session has started.
										</p>
									)}

									<FormField
										control={form.control}
										name="rpeRating"
										render={({ field }) => (
											<div className="space-y-3">
												<div className="flex items-center justify-between">
													<Label
														className={cn(!canSubmitRpe && "text-muted-foreground")}
													>
														How hard was the session?
													</Label>
													{field.value && (
														<div
															className={cn(
																"flex items-center gap-2 rounded-lg px-3 py-1",
																getRpeBgColor(field.value),
															)}
														>
															<span
																className={cn(
																	"font-bold text-lg",
																	getRpeColor(field.value),
																)}
															>
																{field.value}/10
															</span>
														</div>
													)}
												</div>
												<Slider
													value={field.value ? [field.value] : [5]}
													onValueChange={([v]) =>
														v !== undefined && field.onChange(v)
													}
													min={1}
													max={10}
													step={1}
													className="py-2"
													disabled={!canSubmitRpe}
												/>
												<div className="flex justify-between text-muted-foreground text-xs">
													<span>Very light</span>
													<span>Maximum</span>
												</div>
												{field.value && (
													<p
														className={cn(
															"text-center text-sm",
															getRpeColor(field.value),
														)}
													>
														{rpeDescriptions[field.value]}
													</p>
												)}
											</div>
										)}
									/>
								</div>

								{/* Satisfaction Section */}
								<div className="space-y-4 rounded-lg border p-4">
									<h3 className="flex items-center gap-2 font-medium">
										<SmileIcon className="size-4" />
										Satisfaction
									</h3>

									<FormField
										control={form.control}
										name="satisfactionRating"
										render={({ field }) => (
											<div className="space-y-3">
												<div className="flex items-center justify-between">
													<Label>How satisfied are you with the session?</Label>
													{field.value && (
														<span className="text-2xl">
															{getSatisfactionEmoji(field.value)}
														</span>
													)}
												</div>
												<Slider
													value={field.value ? [field.value] : [5]}
													onValueChange={([v]) =>
														v !== undefined && field.onChange(v)
													}
													min={1}
													max={10}
													step={1}
													className="py-2"
												/>
												<div className="flex justify-between text-muted-foreground text-xs">
													<span>Very unsatisfied</span>
													<span>Very satisfied</span>
												</div>
												{field.value && (
													<p
														className={cn(
															"text-center font-medium",
															getSatisfactionColor(field.value),
														)}
													>
														{field.value}/10
													</p>
												)}
											</div>
										)}
									/>
								</div>

								{/* Notes */}
								<FormField
									control={form.control}
									name="notes"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Additional Notes (Optional)</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Any comments about the session..."
													className="resize-none"
													rows={3}
													{...field}
												/>
											</FormControl>
											<FormDescription className="text-xs">
												Share any feedback about the exercises, difficulty, or
												how you're feeling.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<SheetFooter>
									<Button
										type="button"
										variant="outline"
										onClick={() => modal.hide()}
										disabled={upsertMutation.isPending}
									>
										Cancel
									</Button>
									<Button type="submit" disabled={upsertMutation.isPending}>
										{upsertMutation.isPending && (
											<Loader2Icon className="mr-2 size-4 animate-spin" />
										)}
										Submit Feedback
									</Button>
								</SheetFooter>
							</form>
						</Form>
					)}
				</SheetContent>
			</Sheet>
		);
	},
);
