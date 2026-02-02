"use client";

import NiceModal from "@ebay/nice-modal-react";
import { ActivityIcon, MessageSquareIcon, SmileIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const feedbackSchema = z.object({
	rpeRating: z.number().min(1).max(10).nullable(),
	satisfactionRating: z.number().min(1).max(10).nullable(),
	notes: z.string().trim().max(2000).optional(),
});

interface SessionFeedbackModalProps {
	sessionId: string;
	sessionTitle: string;
}

// RPE descriptions based on Borg CR10 scale
const rpeDescriptions: Record<number, { label: string; emoji: string }> = {
	1: { label: "Muy fácil", emoji: "😴" },
	2: { label: "Fácil", emoji: "😌" },
	3: { label: "Moderado", emoji: "🙂" },
	4: { label: "Algo difícil", emoji: "😐" },
	5: { label: "Difícil", emoji: "😤" },
	6: { label: "Difícil", emoji: "😤" },
	7: { label: "Muy difícil", emoji: "😰" },
	8: { label: "Muy difícil", emoji: "😰" },
	9: { label: "Extremo", emoji: "🥵" },
	10: { label: "Máximo", emoji: "💀" },
};

// Helper to get color based on RPE value
function getRpeColor(value: number): string {
	if (value <= 2) return "bg-green-500";
	if (value <= 4) return "bg-emerald-500";
	if (value <= 6) return "bg-yellow-500";
	if (value <= 8) return "bg-orange-500";
	return "bg-red-500";
}

function getRpeTextColor(value: number): string {
	if (value <= 2) return "text-green-600 dark:text-green-400";
	if (value <= 4) return "text-emerald-600 dark:text-emerald-400";
	if (value <= 6) return "text-yellow-600 dark:text-yellow-400";
	if (value <= 8) return "text-orange-600 dark:text-orange-400";
	return "text-red-600 dark:text-red-400";
}

// Satisfaction descriptions
const satisfactionDescriptions: Record<
	number,
	{ label: string; emoji: string }
> = {
	1: { label: "Muy insatisfecho", emoji: "😫" },
	2: { label: "Insatisfecho", emoji: "😞" },
	3: { label: "Algo insatisfecho", emoji: "😕" },
	4: { label: "Poco satisfecho", emoji: "😐" },
	5: { label: "Neutral", emoji: "😶" },
	6: { label: "Algo satisfecho", emoji: "🙂" },
	7: { label: "Satisfecho", emoji: "😊" },
	8: { label: "Muy satisfecho", emoji: "😄" },
	9: { label: "Excelente", emoji: "🤩" },
	10: { label: "Increíble", emoji: "🥳" },
};

function getSatisfactionColor(value: number): string {
	if (value <= 2) return "bg-red-500";
	if (value <= 4) return "bg-orange-500";
	if (value <= 6) return "bg-yellow-500";
	if (value <= 8) return "bg-emerald-500";
	return "bg-green-500";
}

function getSatisfactionTextColor(value: number): string {
	if (value <= 2) return "text-red-600 dark:text-red-400";
	if (value <= 4) return "text-orange-600 dark:text-orange-400";
	if (value <= 6) return "text-yellow-600 dark:text-yellow-400";
	if (value <= 8) return "text-emerald-600 dark:text-emerald-400";
	return "text-green-600 dark:text-green-400";
}

interface RatingButtonsProps {
	value: number | null;
	onChange: (value: number) => void;
	disabled?: boolean;
	type: "rpe" | "satisfaction";
}

function RatingButtons({
	value,
	onChange,
	disabled,
	type,
}: RatingButtonsProps) {
	const descriptions =
		type === "rpe" ? rpeDescriptions : satisfactionDescriptions;
	const getColor = type === "rpe" ? getRpeColor : getSatisfactionColor;

	return (
		<div className="space-y-4">
			{/* Number buttons */}
			<div className="grid grid-cols-10 gap-1.5">
				{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
					<button
						key={num}
						type="button"
						disabled={disabled}
						onClick={() => onChange(num)}
						className={cn(
							"flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition-all",
							"hover:scale-105 active:scale-95",
							"focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
							disabled && "opacity-50 cursor-not-allowed",
							value === num
								? cn(
										getColor(num),
										"text-white shadow-lg ring-2 ring-offset-2 ring-offset-background",
										type === "rpe" ? "ring-orange-300" : "ring-blue-300",
									)
								: "bg-muted hover:bg-muted/80 text-muted-foreground",
						)}
					>
						{num}
					</button>
				))}
			</div>

			{/* Labels */}
			<div className="flex justify-between text-xs text-muted-foreground px-1">
				<span>{type === "rpe" ? "Muy fácil" : "Muy mal"}</span>
				<span>{type === "rpe" ? "Máximo" : "Excelente"}</span>
			</div>

			{/* Selected value display */}
			{value && (
				<div className="flex items-center justify-center gap-4 rounded-xl bg-muted/50 py-4 px-6 border">
					<span className="text-4xl">{descriptions[value]?.emoji}</span>
					<div className="text-center">
						<p
							className={cn(
								"font-bold text-3xl",
								type === "rpe"
									? getRpeTextColor(value)
									: getSatisfactionTextColor(value),
							)}
						>
							{value}/10
						</p>
						<p className="text-sm text-muted-foreground font-medium">
							{descriptions[value]?.label}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

export const SessionFeedbackModal = NiceModal.create(
	({ sessionId, sessionTitle }: SessionFeedbackModalProps) => {
		const t = useTranslations("training");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const { data, isLoading } =
			trpc.organization.sessionFeedback.getMyFeedback.useQuery({
				sessionId,
			});

		const form = useZodForm({
			schema: feedbackSchema,
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

		const upsertMutation = trpc.organization.sessionFeedback.upsert.useMutation(
			{
				onSuccess: () => {
					toast.success(t("feedback.success"));
					utils.organization.sessionFeedback.getMyFeedback.invalidate({
						sessionId,
					});
					utils.organization.sessionFeedback.getSessionFeedback.invalidate({
						sessionId,
					});
					utils.organization.trainingSession.listMySessionsAsAthlete.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			},
		);

		const onSubmit = form.handleSubmit((values) => {
			upsertMutation.mutate({
				sessionId,
				rpeRating: values.rpeRating,
				satisfactionRating: values.satisfactionRating,
				notes: values.notes || undefined,
			});
		});

		const canSubmitRpe = data?.canSubmitRpe ?? false;
		const hasExistingFeedback = !!data?.feedback;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={
					hasExistingFeedback
						? t("feedback.editTitle")
						: t("feedback.createTitle")
				}
				subtitle={sessionTitle}
				icon={<ActivityIcon className="size-5" />}
				accentColor="amber"
				form={form}
				onSubmit={onSubmit}
				isPending={upsertMutation.isPending || isLoading}
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					{/* RPE Section */}
					<ProfileEditSection title={t("feedback.rpeTitle")}>
						<FormField
							control={form.control}
							name="rpeRating"
							render={({ field }) => (
								<FormItem>
									{!canSubmitRpe && (
										<p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg mb-4">
											{t("feedback.rpeDisabledMessage")}
										</p>
									)}
									<FormControl>
										<RatingButtons
											value={field.value}
											onChange={field.onChange}
											disabled={!canSubmitRpe}
											type="rpe"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</ProfileEditSection>

					{/* Satisfaction Section */}
					<ProfileEditSection title={t("feedback.satisfactionTitle")}>
						<FormField
							control={form.control}
							name="satisfactionRating"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<RatingButtons
											value={field.value}
											onChange={field.onChange}
											type="satisfaction"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</ProfileEditSection>

					{/* Notes */}
					<ProfileEditSection>
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel className="flex items-center gap-2">
											<MessageSquareIcon className="size-4 text-muted-foreground" />
											{t("feedback.notesLabel")}
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("feedback.notesPlaceholder")}
												className="resize-none min-h-[100px]"
												rows={4}
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
