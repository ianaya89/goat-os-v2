"use client";

import NiceModal from "@ebay/nice-modal-react";
import { HeartPulseIcon } from "lucide-react";
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
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/trpc/client";

const healthSchema = z.object({
	dietaryRestrictions: z.string().trim().max(500).optional().nullable(),
	allergies: z.string().trim().max(500).optional().nullable(),
});

type HealthFormData = z.infer<typeof healthSchema>;

interface OrgAthleteHealthEditModalProps {
	athleteId: string;
	dietaryRestrictions: string | null;
	allergies: string | null;
}

export const OrgAthleteHealthEditModal = NiceModal.create(
	({
		athleteId,
		dietaryRestrictions,
		allergies,
	}: OrgAthleteHealthEditModalProps) => {
		const t = useTranslations("athletes");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: healthSchema,
			defaultValues: {
				dietaryRestrictions: dietaryRestrictions ?? "",
				allergies: allergies ?? "",
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

		const onSubmit = form.handleSubmit((data: HealthFormData) => {
			updateMutation.mutate({
				id: athleteId,
				dietaryRestrictions: data.dietaryRestrictions || null,
				allergies: data.allergies || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("info.editHealth")}
				subtitle={t("editForm.healthSubtitle")}
				icon={<HeartPulseIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection>
						<FormField
							control={form.control}
							name="dietaryRestrictions"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("info.dietaryRestrictions")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("editForm.dietaryPlaceholder")}
												className="resize-none"
												rows={3}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											{t("editForm.dietaryDescription")}
										</FormDescription>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</ProfileEditSection>

					<ProfileEditSection>
						<FormField
							control={form.control}
							name="allergies"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel className="text-destructive">
											{t("info.allergies")}
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("editForm.allergiesPlaceholder")}
												className="resize-none"
												rows={3}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											{t("editForm.allergiesDescription")}
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
