"use client";

import NiceModal from "@ebay/nice-modal-react";
import { ClipboardListIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/trpc/client";

const contentSchema = z.object({
	objectives: z.string().trim().max(5000).optional().nullable(),
	planning: z.string().trim().max(10000).optional().nullable(),
	description: z.string().trim().max(5000).optional().nullable(),
	postSessionNotes: z.string().trim().max(10000).optional().nullable(),
});

interface SessionContentEditModalProps {
	sessionId: string;
	objectives: string | null;
	planning: string | null;
	description: string | null;
	postSessionNotes: string | null;
	/** If true, only shows objectives and post-session notes (for coaches) */
	isCoachView?: boolean;
}

export const SessionContentEditModal = NiceModal.create(
	({
		sessionId,
		objectives,
		planning,
		description,
		postSessionNotes,
		isCoachView = false,
	}: SessionContentEditModalProps) => {
		const t = useTranslations("training");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: contentSchema,
			defaultValues: {
				objectives: objectives ?? "",
				planning: planning ?? "",
				description: description ?? "",
				postSessionNotes: postSessionNotes ?? "",
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
				objectives: data.objectives || null,
				planning: data.planning || null,
				description: data.description || null,
				postSessionNotes: data.postSessionNotes || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("modal.editContentTitle")}
				subtitle={t("modal.editContentSubtitle")}
				icon={<ClipboardListIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection>
						{!isCoachView && (
							<FormField
								control={form.control}
								name="planning"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("modal.planning")}</FormLabel>
											<FormControl>
												<Textarea
													placeholder={t("modal.planningPlaceholder")}
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
						)}

						<FormField
							control={form.control}
							name="objectives"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("modal.objectives")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("modal.objectivesPlaceholder")}
												className="min-h-[80px] resize-none"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						{!isCoachView && (
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
													className="min-h-[80px] resize-none"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						)}

						<FormField
							control={form.control}
							name="postSessionNotes"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("modal.postSessionNotes")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("modal.postNotesPlaceholder")}
												className="min-h-[80px] resize-none"
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
