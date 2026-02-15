"use client";

import NiceModal from "@ebay/nice-modal-react";
import { RulerIcon } from "lucide-react";
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
	FormDescription,
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
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { DominantSide } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

const physicalSchema = z.object({
	height: z.coerce.number().min(50).max(300).optional().nullable(),
	weight: z.coerce.number().min(10000).max(300000).optional().nullable(), // in grams
	dominantFoot: z.nativeEnum(DominantSide).optional().nullable(),
	dominantHand: z.nativeEnum(DominantSide).optional().nullable(),
	yearsOfExperience: z.coerce.number().min(0).max(50).optional().nullable(),
});

interface AthletePhysicalEditModalProps {
	height: number | null;
	weight: number | null;
	dominantFoot: DominantSide | null;
	dominantHand: DominantSide | null;
	yearsOfExperience: number | null;
}

export const AthletePhysicalEditModal = NiceModal.create(
	({
		height,
		weight,
		dominantFoot,
		dominantHand,
		yearsOfExperience,
	}: AthletePhysicalEditModalProps) => {
		const modal = useEnhancedModal();
		const t = useTranslations("myProfile");
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: physicalSchema,
			defaultValues: {
				height: height ?? undefined,
				weight: weight ?? undefined,
				dominantFoot: dominantFoot ?? undefined,
				dominantHand: dominantHand ?? undefined,
				yearsOfExperience: yearsOfExperience ?? undefined,
			},
		});

		const updateMutation = trpc.athlete.updateMyProfile.useMutation({
			onSuccess: () => {
				toast.success(t("physicalModal.success"));
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("common.updateError"));
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			updateMutation.mutate({
				height: typeof data.height === "number" ? data.height : null,
				weight: typeof data.weight === "number" ? data.weight : null,
				dominantFoot: data.dominantFoot || null,
				dominantHand: data.dominantHand || null,
				yearsOfExperience:
					typeof data.yearsOfExperience === "number"
						? data.yearsOfExperience
						: null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("physicalModal.title")}
				subtitle={t("physicalModal.subtitle")}
				icon={<RulerIcon className="size-5" />}
				accentColor="primary"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				submitLabel={t("common.save")}
				cancelLabel={t("common.cancel")}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title={t("physicalModal.measurementsSection")}>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="height"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("physicalModal.height")}</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder={t("physicalModal.heightPlaceholder")}
													value={
														typeof field.value === "number" ? field.value : ""
													}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Number(e.target.value)
																: undefined,
														)
													}
													onBlur={field.onBlur}
													name={field.name}
													ref={field.ref}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="weight"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("physicalModal.weight")}</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.1"
													placeholder={t("physicalModal.weightPlaceholder")}
													value={
														typeof field.value === "number"
															? field.value / 1000
															: ""
													}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? Math.round(Number(e.target.value) * 1000)
																: undefined,
														)
													}
													onBlur={field.onBlur}
													name={field.name}
													ref={field.ref}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title={t("physicalModal.dominanceSection")}>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="dominantFoot"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("physicalModal.dominantFoot")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={t("common.select")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="right">
														{t("physicalModal.right")}
													</SelectItem>
													<SelectItem value="left">
														{t("physicalModal.left")}
													</SelectItem>
													<SelectItem value="both">
														{t("physicalModal.both")}
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="dominantHand"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("physicalModal.dominantHand")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={t("common.select")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="right">
														{t("physicalModal.rightHand")}
													</SelectItem>
													<SelectItem value="left">
														{t("physicalModal.leftHand")}
													</SelectItem>
													<SelectItem value="both">
														{t("physicalModal.bothHands")}
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title={t("physicalModal.experienceSection")}>
						<FormField
							control={form.control}
							name="yearsOfExperience"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>
											{t("physicalModal.yearsOfExperience")}
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder={t("physicalModal.yearsPlaceholder")}
												value={
													typeof field.value === "number" ? field.value : ""
												}
												onChange={(e) =>
													field.onChange(
														e.target.value ? Number(e.target.value) : undefined,
													)
												}
												onBlur={field.onBlur}
												name={field.name}
												ref={field.ref}
											/>
										</FormControl>
										<FormDescription>
											{t("physicalModal.yearsDescription")}
										</FormDescription>
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
