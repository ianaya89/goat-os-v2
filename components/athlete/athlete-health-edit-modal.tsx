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

interface AthleteHealthEditModalProps {
	dietaryRestrictions: string | null;
	allergies: string | null;
}

export const AthleteHealthEditModal = NiceModal.create(
	({ dietaryRestrictions, allergies }: AthleteHealthEditModalProps) => {
		const modal = useEnhancedModal();
		const t = useTranslations("myProfile");
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: healthSchema,
			defaultValues: {
				dietaryRestrictions: dietaryRestrictions ?? "",
				allergies: allergies ?? "",
			},
		});

		const updateMutation = trpc.athlete.updateMyProfile.useMutation({
			onSuccess: () => {
				toast.success(t("healthModal.success"));
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("common.updateError"));
			},
		});

		const onSubmit = form.handleSubmit((data: HealthFormData) => {
			updateMutation.mutate({
				dietaryRestrictions: data.dietaryRestrictions || null,
				allergies: data.allergies || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("healthModal.title")}
				subtitle={t("healthModal.subtitle")}
				icon={<HeartPulseIcon className="size-5" />}
				accentColor="rose"
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
										<FormLabel>
											{t("healthModal.dietaryRestrictions")}
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("healthModal.dietaryPlaceholder")}
												className="resize-none"
												rows={3}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											Indica si sigues alguna dieta especial o tienes
											restricciones alimenticias.
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
										<FormLabel className="text-rose-600 dark:text-rose-400">
											{t("healthModal.allergies")}
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("healthModal.allergiesPlaceholder")}
												className="resize-none border-rose-200 focus-visible:ring-rose-500 dark:border-rose-800"
												rows={3}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											Es importante registrar cualquier alergia para tu
											seguridad.
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
