"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	ActivityIcon,
	HeartIcon,
	SparklesIcon,
	StarIcon,
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
import { Label } from "@/components/ui/label";
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

interface EvaluationInitialValues {
	performanceRating: number | null;
	performanceNotes: string;
	attitudeRating: number | null;
	attitudeNotes: string;
	physicalFitnessRating: number | null;
	physicalFitnessNotes: string;
	generalNotes: string;
}

interface AddEvaluationModalProps {
	athleteId: string;
	athleteName?: string;
	sessions: Session[];
	/** Pre-select a session when opening the modal */
	initialSessionId?: string;
	/** Pre-fill form values for editing */
	initialValues?: EvaluationInitialValues;
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
		<div className="flex items-center justify-between">
			<Label className="flex items-center gap-1.5 text-sm font-medium">
				<Icon className="size-3.5 text-muted-foreground" />
				{label}
			</Label>
			<div className="flex items-center gap-0.5">
				{[1, 2, 3, 4, 5].map((star) => (
					<button
						key={star}
						type="button"
						onClick={() => onChange(value === star ? null : star)}
						className="rounded p-0.5 transition-colors hover:bg-muted"
					>
						<StarIcon
							className={cn(
								"size-5 transition-colors",
								value !== null && star <= value
									? "fill-yellow-400 text-yellow-400"
									: "text-muted-foreground/30",
							)}
						/>
					</button>
				))}
				{value !== null && (
					<span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
						{value}/5
					</span>
				)}
			</div>
		</div>
	);
}

export const AddEvaluationModal = NiceModal.create<AddEvaluationModalProps>(
	({ athleteId, athleteName, sessions, initialSessionId, initialValues }) => {
		const modal = useEnhancedModal();
		const t = useTranslations("athletes.evaluations");
		const utils = trpc.useUtils();

		const isEditing = !!initialValues;
		const hasPreselectedSession = !!initialSessionId;

		// Filter to only show completed sessions
		const completedSessions = sessions.filter((s) => s.status === "completed");

		// Find the pre-selected session for display
		const preselectedSession = hasPreselectedSession
			? completedSessions.find((s) => s.id === initialSessionId)
			: null;

		const form = useForm<FormValues>({
			defaultValues: {
				sessionId: initialSessionId ?? "",
				performanceRating: initialValues?.performanceRating ?? null,
				performanceNotes: initialValues?.performanceNotes ?? "",
				attitudeRating: initialValues?.attitudeRating ?? null,
				attitudeNotes: initialValues?.attitudeNotes ?? "",
				physicalFitnessRating: initialValues?.physicalFitnessRating ?? null,
				physicalFitnessNotes: initialValues?.physicalFitnessNotes ?? "",
				generalNotes: initialValues?.generalNotes ?? "",
			},
		});

		const upsertMutation =
			trpc.organization.athleteEvaluation.upsert.useMutation({
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

			if (
				!values.performanceRating &&
				!values.attitudeRating &&
				!values.physicalFitnessRating
			) {
				toast.error(t("modal.ratingRequiredError"));
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

		const isPending = upsertMutation.isPending;

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
									<StarIcon className="size-5" />
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
															{completedSessions.length === 0 ? (
																<div className="py-4 text-center text-muted-foreground text-sm">
																	{t("modal.noCompletedSessions")}
																</div>
															) : (
																completedSessions.map((session) => (
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

									{/* Rating sections */}
									<div className="space-y-2 rounded-lg border p-3">
										<FormField
											control={form.control}
											name="performanceRating"
											render={({ field }) => (
												<StarRating
													label={t("performance")}
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
															placeholder={t("modal.performanceNotes")}
															className="min-h-[48px] resize-none text-sm"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="space-y-2 rounded-lg border p-3">
										<FormField
											control={form.control}
											name="attitudeRating"
											render={({ field }) => (
												<StarRating
													label={t("attitude")}
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
															placeholder={t("modal.attitudeNotes")}
															className="min-h-[48px] resize-none text-sm"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="space-y-2 rounded-lg border p-3">
										<FormField
											control={form.control}
											name="physicalFitnessRating"
											render={({ field }) => (
												<StarRating
													label={t("physicalFitness")}
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
															placeholder={t("modal.fitnessNotes")}
															className="min-h-[48px] resize-none text-sm"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									{/* General Notes */}
									<FormField
										control={form.control}
										name="generalNotes"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm">
													{t("modal.generalNotes")}
												</FormLabel>
												<FormControl>
													<Textarea
														placeholder={t("modal.generalNotesPlaceholder")}
														className="min-h-[56px] resize-none text-sm"
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
									disabled={isPending || completedSessions.length === 0}
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
