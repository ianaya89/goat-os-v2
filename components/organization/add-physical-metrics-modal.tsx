"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { CalendarIcon, WeightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import {
	FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const bodyCompositionSchema = z.object({
	measuredAt: z.string().optional(),
	weight: z.string().optional(),
	bodyFatPercentage: z.string().optional(),
	muscleMass: z.string().optional(),
	notes: z.string().max(1000).optional(),
});

type BodyCompositionFormData = z.infer<typeof bodyCompositionSchema>;

interface AddPhysicalMetricsModalProps {
	athleteId: string;
	initialValues?: {
		id: string;
		measuredAt: Date | string | null;
		weight: number | null;
		bodyFatPercentage: number | null;
		muscleMass: number | null;
		notes: string | null;
	};
}

export const AddPhysicalMetricsModal =
	NiceModal.create<AddPhysicalMetricsModalProps>(
		({ athleteId, initialValues }) => {
			const t = useTranslations("athletes");
			const modal = useEnhancedModal();
			const utils = trpc.useUtils();
			const isEditing = !!initialValues;

			const form = useZodForm({
				schema: bodyCompositionSchema,
				defaultValues: {
					measuredAt: initialValues?.measuredAt
						? new Date(initialValues.measuredAt).toISOString().split("T")[0]
						: "",
					weight: initialValues?.weight
						? (initialValues.weight / 1000).toString()
						: "",
					bodyFatPercentage: initialValues?.bodyFatPercentage
						? (initialValues.bodyFatPercentage / 10).toString()
						: "",
					muscleMass: initialValues?.muscleMass
						? (initialValues.muscleMass / 1000).toString()
						: "",
					notes: initialValues?.notes ?? "",
				},
			});

			const createMutation =
				trpc.organization.athlete.createPhysicalMetrics.useMutation({
					onSuccess: () => {
						toast.success(t("physical.recordSuccess"));
						utils.organization.athlete.getProfile.invalidate({
							id: athleteId,
						});
						modal.handleClose();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});

			const updateMutation =
				trpc.organization.athlete.updatePhysicalMetrics.useMutation({
					onSuccess: () => {
						toast.success(t("physical.updateSuccess"));
						utils.organization.athlete.getProfile.invalidate({
							id: athleteId,
						});
						modal.handleClose();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});

			const onSubmit = form.handleSubmit((data: BodyCompositionFormData) => {
				const weight = data.weight
					? Math.round(Number.parseFloat(data.weight) * 1000)
					: undefined;
				const bodyFatPercentage = data.bodyFatPercentage
					? Math.round(Number.parseFloat(data.bodyFatPercentage) * 10)
					: undefined;
				const muscleMass = data.muscleMass
					? Math.round(Number.parseFloat(data.muscleMass) * 1000)
					: undefined;
				const measuredAt = data.measuredAt
					? new Date(data.measuredAt)
					: undefined;

				if (isEditing && initialValues) {
					updateMutation.mutate({
						id: initialValues.id,
						athleteId,
						measuredAt,
						weight,
						bodyFatPercentage,
						muscleMass,
						notes: data.notes || undefined,
					});
				} else {
					createMutation.mutate({
						athleteId,
						measuredAt,
						weight,
						bodyFatPercentage,
						muscleMass,
						notes: data.notes || undefined,
					});
				}
			});

			const isPending = createMutation.isPending || updateMutation.isPending;

			return (
				<ProfileEditSheet
					open={modal.visible}
					onClose={modal.handleClose}
					title={
						isEditing
							? t("physical.editMeasurement")
							: t("physical.addMeasurement")
					}
					subtitle={t("physical.bodyCompositionDesc")}
					icon={<WeightIcon className="size-5" />}
					accentColor="slate"
					form={form}
					onSubmit={onSubmit}
					isPending={isPending}
					maxWidth="md"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<div className="space-y-6">
						<ProfileEditSection title={t("physical.measurementDate")}>
							<FormField
								control={form.control}
								name="measuredAt"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel className="flex items-center gap-1.5">
												<CalendarIcon className="size-3.5" />
												{t("physical.measurementDate")}
											</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full pl-3 text-left font-normal",
																!field.value && "text-muted-foreground",
															)}
														>
															{field.value ? (
																format(new Date(field.value), "dd MMM yyyy")
															) : (
																<span>{t("physical.selectDate")}</span>
															)}
															<CalendarIcon className="ml-auto size-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={
															field.value ? new Date(field.value) : undefined
														}
														onSelect={(date) =>
															field.onChange(
																date ? date.toISOString().split("T")[0] : "",
															)
														}
														disabled={(date) =>
															date > new Date() || date < new Date("1950-01-01")
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditSection>

						<ProfileEditSection title={t("physical.bodyCompositionHistory")}>
							<ProfileEditGrid cols={2}>
								<FormField
									control={form.control}
									name="weight"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("physical.weight")} (kg)</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.1"
														placeholder="72.5"
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
									name="bodyFatPercentage"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("physical.bodyFat")}</FormLabel>
												<FormControl>
													<Input
														type="number"
														step="0.1"
														placeholder="12.5"
														{...field}
														value={field.value ?? ""}
													/>
												</FormControl>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>
							</ProfileEditGrid>

							<FormField
								control={form.control}
								name="muscleMass"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("physical.muscleMass")} (kg)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.1"
													placeholder="35.2"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditSection>

						<ProfileEditSection>
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("physical.notes")}</FormLabel>
											<FormControl>
												<Textarea
													placeholder={t("physical.notesPlaceholder")}
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
						</ProfileEditSection>
					</div>
				</ProfileEditSheet>
			);
		},
	);
