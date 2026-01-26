"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import {
	ActivityIcon,
	Loader2Icon,
	MessageSquareIcon,
	SmileIcon,
} from "lucide-react";
import { useEffect } from "react";
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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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

		const upsertMutation = trpc.organization.sessionFeedback.upsert.useMutation(
			{
				onSuccess: () => {
					toast.success("Feedback enviado correctamente");
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
			},
		);

		const onSubmit = (values: FormValues) => {
			upsertMutation.mutate({
				sessionId,
				rpeRating: values.rpeRating,
				satisfactionRating: values.satisfactionRating,
				notes: values.notes || undefined,
			});
		};

		const canSubmitRpe = data?.canSubmitRpe ?? false;
		const hasExistingFeedback = !!data?.feedback;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => {
					if (!open) modal.hide();
				}}
			>
				<SheetContent className="overflow-y-auto sm:max-w-lg">
					<SheetHeader className="pb-4 border-b">
						<SheetTitle className="flex items-center gap-2 text-lg">
							<ActivityIcon className="size-5 text-primary" />
							{hasExistingFeedback ? "Editar Feedback" : "Dar Feedback"}
						</SheetTitle>
						<SheetDescription className="text-base">
							{sessionTitle}
						</SheetDescription>
					</SheetHeader>

					{isLoading ? (
						<div className="flex items-center justify-center py-16">
							<Loader2Icon className="size-8 animate-spin text-muted-foreground" />
						</div>
					) : (
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="mt-8 space-y-8"
							>
								{/* RPE Section */}
								<FormField
									control={form.control}
									name="rpeRating"
									render={({ field }) => (
										<FormItem className="space-y-4 p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30">
											<FormLabel className="flex items-center gap-2 text-base font-semibold">
												<ActivityIcon className="size-5 text-orange-500" />
												Esfuerzo Percibido (RPE)
											</FormLabel>
											{!canSubmitRpe && (
												<p className="text-muted-foreground text-sm bg-muted/50 p-3 rounded-lg">
													El RPE solo se puede enviar después de que la sesión
													haya comenzado.
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

								{/* Satisfaction Section */}
								<FormField
									control={form.control}
									name="satisfactionRating"
									render={({ field }) => (
										<FormItem className="space-y-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30">
											<FormLabel className="flex items-center gap-2 text-base font-semibold">
												<SmileIcon className="size-5 text-blue-500" />
												Satisfacción
											</FormLabel>
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

								{/* Notes */}
								<FormField
									control={form.control}
									name="notes"
									render={({ field }) => (
										<FormItem className="space-y-3">
											<FormLabel className="flex items-center gap-2 text-base">
												<MessageSquareIcon className="size-4 text-muted-foreground" />
												Comentarios (Opcional)
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="¿Cómo te sentiste? ¿Algún comentario sobre los ejercicios?"
													className="resize-none min-h-[100px]"
													rows={4}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<SheetFooter className="gap-3 pt-6 border-t">
									<Button
										type="button"
										variant="outline"
										onClick={() => modal.hide()}
										disabled={upsertMutation.isPending}
										className="flex-1 sm:flex-none"
									>
										Cancelar
									</Button>
									<Button
										type="submit"
										disabled={upsertMutation.isPending}
										className="flex-1 sm:flex-none"
									>
										{upsertMutation.isPending && (
											<Loader2Icon className="mr-2 size-4 animate-spin" />
										)}
										{hasExistingFeedback ? "Actualizar" : "Enviar Feedback"}
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
