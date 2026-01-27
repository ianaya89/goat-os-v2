"use client";

import NiceModal from "@ebay/nice-modal-react";
import { HomeIcon } from "lucide-react";
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
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/trpc/client";

const residenceSchema = z.object({
	residenceCity: z.string().trim().max(100).optional().nullable(),
	residenceCountry: z.string().trim().max(100).optional().nullable(),
	nationality: z.string().trim().max(100).optional().nullable(),
});

type ResidenceFormData = z.infer<typeof residenceSchema>;

interface OrgAthleteResidenceEditModalProps {
	athleteId: string;
	residenceCity: string | null;
	residenceCountry: string | null;
	nationality: string | null;
}

export const OrgAthleteResidenceEditModal = NiceModal.create(
	({
		athleteId,
		residenceCity,
		residenceCountry,
		nationality,
	}: OrgAthleteResidenceEditModalProps) => {
		const t = useTranslations("athletes");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: residenceSchema,
			defaultValues: {
				residenceCity: residenceCity ?? "",
				residenceCountry: residenceCountry ?? "",
				nationality: nationality ?? "",
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

		const onSubmit = form.handleSubmit((data: ResidenceFormData) => {
			updateMutation.mutate({
				id: athleteId,
				residenceCity: data.residenceCity || null,
				residenceCountry: data.residenceCountry || null,
				nationality: data.nationality || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("info.editResidence")}
				subtitle={t("editForm.residenceSubtitle")}
				icon={<HomeIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title={t("info.location")}>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="residenceCity"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("info.city")}</FormLabel>
											<FormControl>
												<Input
													placeholder="Buenos Aires"
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
								name="residenceCountry"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("info.country")}</FormLabel>
											<FormControl>
												<Input
													placeholder="Argentina"
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

					<ProfileEditSection title={t("info.nationalitySection")}>
						<FormField
							control={form.control}
							name="nationality"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("info.nationality")}</FormLabel>
										<FormControl>
											<Input
												placeholder="Argentina"
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
