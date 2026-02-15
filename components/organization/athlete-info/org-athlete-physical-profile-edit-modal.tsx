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

const physicalProfileSchema = z.object({
	height: z.string().optional(),
	wingspan: z.string().optional(),
	standingReach: z.string().optional(),
	dominantFoot: z.string().optional().nullable(),
	dominantHand: z.string().optional().nullable(),
});

type PhysicalProfileFormData = z.infer<typeof physicalProfileSchema>;

interface OrgAthletePhysicalProfileEditModalProps {
	athleteId: string;
	height: number | null;
	wingspan: number | null;
	standingReach: number | null;
	dominantFoot: string | null;
	dominantHand: string | null;
}

export const OrgAthletePhysicalProfileEditModal = NiceModal.create(
	({
		athleteId,
		height,
		wingspan,
		standingReach,
		dominantFoot,
		dominantHand,
	}: OrgAthletePhysicalProfileEditModalProps) => {
		const t = useTranslations("athletes");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: physicalProfileSchema,
			defaultValues: {
				height: height?.toString() ?? "",
				wingspan: wingspan?.toString() ?? "",
				standingReach: standingReach?.toString() ?? "",
				dominantFoot: dominantFoot ?? "",
				dominantHand: dominantHand ?? "",
			},
		});

		const updateMutation = trpc.organization.athlete.update.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const onSubmit = form.handleSubmit((data: PhysicalProfileFormData) => {
			updateMutation.mutate({
				id: athleteId,
				height: data.height ? Number.parseInt(data.height, 10) : null,
				wingspan: data.wingspan ? Number.parseInt(data.wingspan, 10) : null,
				standingReach: data.standingReach
					? Number.parseInt(data.standingReach, 10)
					: null,
				dominantFoot: (data.dominantFoot as DominantSide) || null,
				dominantHand: (data.dominantHand as DominantSide) || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("physical.profileTitle")}
				subtitle={t("physical.profileSubtitle")}
				icon={<RulerIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title={t("physical.measurements")}>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="height"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("physical.height")} (cm)</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="175"
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
								name="wingspan"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("physical.wingspan")} (cm)</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="180"
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
								name="standingReach"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("physical.standingReach")} (cm)</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="230"
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
					</ProfileEditSection>

					<ProfileEditSection title={t("physical.dominance")}>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="dominantFoot"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("physical.dominantFoot")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="-" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value={DominantSide.right}>
														{t("physical.right")}
													</SelectItem>
													<SelectItem value={DominantSide.left}>
														{t("physical.left")}
													</SelectItem>
													<SelectItem value={DominantSide.both}>
														{t("physical.both")}
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
											<FormLabel>{t("physical.dominantHand")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="-" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value={DominantSide.right}>
														{t("physical.right")}
													</SelectItem>
													<SelectItem value={DominantSide.left}>
														{t("physical.left")}
													</SelectItem>
													<SelectItem value={DominantSide.both}>
														{t("physical.both")}
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
				</div>
			</ProfileEditSheet>
		);
	},
);
