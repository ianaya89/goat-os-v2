"use client";

import NiceModal from "@ebay/nice-modal-react";
import { ActivityIcon, CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
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
import { Input } from "@/components/ui/input";
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
import { FitnessTestType } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

const fitnessTestUnits: Record<string, string> = {
	[FitnessTestType.sprint40m]: "seconds",
	[FitnessTestType.sprint60m]: "seconds",
	[FitnessTestType.sprint100m]: "seconds",
	[FitnessTestType.verticalJump]: "cm",
	[FitnessTestType.standingLongJump]: "cm",
	[FitnessTestType.yoYoTest]: "level",
	[FitnessTestType.beepTest]: "level",
	[FitnessTestType.cooperTest]: "meters",
	[FitnessTestType.agilityTTest]: "seconds",
	[FitnessTestType.illinoisAgility]: "seconds",
	[FitnessTestType.maxSpeed]: "km/h",
	[FitnessTestType.reactionTime]: "ms",
	[FitnessTestType.flexibility]: "cm",
	[FitnessTestType.plankHold]: "seconds",
	[FitnessTestType.pushUps]: "reps",
	[FitnessTestType.sitUps]: "reps",
	[FitnessTestType.other]: "custom",
};

const fitnessTestSchema = z.object({
	testType: z.string().min(1),
	testDate: z.string().optional(),
	result: z.string().min(1),
	unit: z.string().min(1),
	notes: z.string().max(1000).optional(),
});

type FitnessTestFormData = z.infer<typeof fitnessTestSchema>;

interface AddFitnessTestModalProps {
	athleteId: string;
	initialValues?: {
		id: string;
		testType: string;
		testDate: Date | string | null;
		result: number;
		unit: string;
		notes: string | null;
	};
}

export const AddFitnessTestModal = NiceModal.create<AddFitnessTestModalProps>(
	({ athleteId, initialValues }) => {
		const t = useTranslations("athletes.fitness");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!initialValues;

		const form = useZodForm({
			schema: fitnessTestSchema,
			defaultValues: {
				testType: initialValues?.testType ?? FitnessTestType.sprint40m,
				testDate: initialValues?.testDate
					? new Date(initialValues.testDate).toISOString().split("T")[0]
					: "",
				result: initialValues?.result?.toString() ?? "",
				unit:
					initialValues?.unit ??
					fitnessTestUnits[FitnessTestType.sprint40m] ??
					"seconds",
				notes: initialValues?.notes ?? "",
			},
		});

		const selectedTestType = form.watch("testType");

		const handleTestTypeChange = (value: string) => {
			form.setValue("testType", value);
			const unit = fitnessTestUnits[value];
			if (unit && unit !== "custom") {
				form.setValue("unit", unit);
			}
		};

		const createMutation =
			trpc.organization.athlete.createFitnessTest.useMutation({
				onSuccess: () => {
					toast.success(t("recordSuccess"));
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
			trpc.organization.athlete.updateFitnessTest.useMutation({
				onSuccess: () => {
					toast.success(t("updateSuccess"));
					utils.organization.athlete.getProfile.invalidate({
						id: athleteId,
					});
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const onSubmit = form.handleSubmit((data: FitnessTestFormData) => {
			const result = Number.parseInt(data.result, 10);
			if (Number.isNaN(result)) {
				toast.error(t("invalidResult"));
				return;
			}

			const testDate = data.testDate ? new Date(data.testDate) : undefined;

			if (isEditing && initialValues) {
				updateMutation.mutate({
					id: initialValues.id,
					athleteId,
					testType: data.testType as FitnessTestType,
					testDate,
					result,
					unit: data.unit,
					notes: data.notes || undefined,
				});
			} else {
				createMutation.mutate({
					athleteId,
					testType: data.testType as FitnessTestType,
					testDate,
					result,
					unit: data.unit,
					notes: data.notes || undefined,
				});
			}
		});

		const isPending = createMutation.isPending || updateMutation.isPending;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={isEditing ? t("editTest") : t("addTest")}
				subtitle={t("subtitle")}
				icon={<ActivityIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title={t("testInfo")}>
						<FormField
							control={form.control}
							name="testType"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("testType")}</FormLabel>
										<Select
											value={field.value}
											onValueChange={handleTestTypeChange}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder={t("selectTestType")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.values(FitnessTestType).map((type) => (
													<SelectItem key={type} value={type}>
														{t(`testTypes.${type}`)}
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
							name="testDate"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel className="flex items-center gap-1.5">
											<CalendarIcon className="size-3.5" />
											{t("testDate")}
										</FormLabel>
										<FormControl>
											<Input type="date" {...field} value={field.value ?? ""} />
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</ProfileEditSection>

					<ProfileEditSection title={t("results")}>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="result"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("result")}</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder={t("resultPlaceholder")}
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
								name="unit"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("unit")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("unitPlaceholder")}
													{...field}
													value={field.value ?? ""}
													disabled={selectedTestType !== FitnessTestType.other}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection>
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("notes")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("notesPlaceholder")}
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
