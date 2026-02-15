"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { ActivityIcon, HeartIcon, SparklesIcon, StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Field } from "@/components/ui/field";
import {
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const evaluationSchema = z.object({
	sessionId: z.string().min(1),
	performanceRating: z.number().nullable(),
	performanceNotes: z.string().default(""),
	attitudeRating: z.number().nullable(),
	attitudeNotes: z.string().default(""),
	physicalFitnessRating: z.number().nullable(),
	physicalFitnessNotes: z.string().default(""),
	generalNotes: z.string().default(""),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

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

		const form = useZodForm({
			schema: evaluationSchema,
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
					utils.organization.athleteEvaluation.getSessionEvaluations.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const onSubmit = form.handleSubmit((values) => {
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
		});

		const isPending = upsertMutation.isPending;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={isEditing ? t("modal.editTitle") : t("modal.title")}
				subtitle={
					athleteName ? t("modal.for", { name: athleteName }) : undefined
				}
				icon={<StarIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={isPending}
				submitLabel={t("modal.save")}
				cancelLabel={t("modal.cancel")}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					{/* Session Selector */}
					<ProfileEditSection title={t("modal.trainingSession")}>
						{hasPreselectedSession ? (
							preselectedSession && (
								<div className="rounded-lg border bg-muted/30 px-3 py-2.5">
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
									<FormItem asChild>
										<Field>
											<FormLabel>{t("modal.selectSession")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="w-full">
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
															<SelectItem key={session.id} value={session.id}>
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
										</Field>
									</FormItem>
								)}
							/>
						)}
					</ProfileEditSection>

					{/* Rating sections */}
					<ProfileEditSection title={t("modal.ratings")}>
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
					</ProfileEditSection>

					{/* General Notes */}
					<ProfileEditSection title={t("modal.generalNotes")}>
						<FormField
							control={form.control}
							name="generalNotes"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormControl>
											<Textarea
												placeholder={t("modal.generalNotesPlaceholder")}
												className="min-h-[56px] resize-none text-sm"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
