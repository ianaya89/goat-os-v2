"use client";

import NiceModal from "@ebay/nice-modal-react";
import { FileTextIcon } from "lucide-react";
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/trpc/client";

const basicSchema = z.object({
	title: z.string().trim().min(1, "Title is required").max(200),
	description: z.string().trim().max(5000).optional().nullable(),
});

interface SessionBasicEditModalProps {
	sessionId: string;
	title: string;
	description: string | null;
}

export const SessionBasicEditModal = NiceModal.create(
	({ sessionId, title, description }: SessionBasicEditModalProps) => {
		const t = useTranslations("training");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: basicSchema,
			defaultValues: {
				title,
				description: description ?? "",
			},
		});

		const updateMutation = trpc.organization.trainingSession.update.useMutation(
			{
				onSuccess: () => {
					toast.success(t("success.updated"));
					utils.organization.trainingSession.get.invalidate({
						id: sessionId,
					});
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.updateFailed"));
				},
			},
		);

		const onSubmit = form.handleSubmit((data) => {
			updateMutation.mutate({
				id: sessionId,
				title: data.title,
				description: data.description || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("modal.editBasicTitle")}
				subtitle={t("modal.editBasicSubtitle")}
				icon={<FileTextIcon className="size-5" />}
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
							name="title"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.title")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("modal.titlePlaceholder")}
												autoComplete="off"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.description")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("modal.descriptionPlaceholder")}
												className="min-h-[100px] resize-none"
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
