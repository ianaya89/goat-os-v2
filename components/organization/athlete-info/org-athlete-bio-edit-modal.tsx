"use client";

import NiceModal from "@ebay/nice-modal-react";
import { UserIcon } from "lucide-react";
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

const bioSchema = z.object({
	bio: z.string().trim().max(2000).optional().nullable(),
});

type BioFormData = z.infer<typeof bioSchema>;

interface OrgAthleteBioEditModalProps {
	athleteId: string;
	bio: string | null;
}

export const OrgAthleteBioEditModal = NiceModal.create(
	({ athleteId, bio }: OrgAthleteBioEditModalProps) => {
		const t = useTranslations("athletes");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: bioSchema,
			defaultValues: {
				bio: bio ?? "",
			},
		});

		const bioValue = form.watch("bio") ?? "";

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

		const onSubmit = form.handleSubmit((data: BioFormData) => {
			updateMutation.mutate({
				id: athleteId,
				bio: data.bio || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("info.editBio")}
				subtitle={t("editForm.bioSubtitle")}
				icon={<UserIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection>
						<FormField
							control={form.control}
							name="bio"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("info.bioLabel")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("editForm.bioPlaceholder")}
												className="min-h-[200px] resize-none"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<div className="flex items-center justify-between">
											<FormDescription>
												{t("editForm.bioDescription")}
											</FormDescription>
											<span className="text-muted-foreground text-xs">
												{bioValue.length}/2000
											</span>
										</div>
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
