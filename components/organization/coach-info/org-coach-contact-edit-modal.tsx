"use client";

import NiceModal from "@ebay/nice-modal-react";
import { PhoneIcon } from "lucide-react";
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

const contactSchema = z.object({
	phone: z.string().trim().max(50).optional().nullable(),
	birthDate: z.string().optional().nullable(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface OrgCoachContactEditModalProps {
	coachId: string;
	phone: string | null;
	birthDate: Date | string | null;
}

export const OrgCoachContactEditModal = NiceModal.create(
	({ coachId, phone, birthDate }: OrgCoachContactEditModalProps) => {
		const t = useTranslations("coaches");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const birthDateStr = birthDate
			? new Date(birthDate).toISOString().split("T")[0]
			: "";

		const form = useZodForm({
			schema: contactSchema,
			defaultValues: {
				phone: phone ?? "",
				birthDate: birthDateStr,
			},
		});

		const updateMutation = trpc.organization.coach.update.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.coach.getProfile.invalidate({ id: coachId });
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const onSubmit = form.handleSubmit((data: ContactFormData) => {
			updateMutation.mutate({
				id: coachId,
				phone: data.phone || null,
				birthDate: data.birthDate ? new Date(data.birthDate) : null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("profile.info.editContact")}
				subtitle={t("profile.info.editContactSubtitle")}
				icon={<PhoneIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection>
						<ProfileEditGrid cols={1}>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("profile.info.phone")}</FormLabel>
											<FormControl>
												<Input
													placeholder="+54 11 1234-5678"
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
								name="birthDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("profile.info.birthDate")}</FormLabel>
											<FormControl>
												<Input
													type="date"
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
				</div>
			</ProfileEditSheet>
		);
	},
);
