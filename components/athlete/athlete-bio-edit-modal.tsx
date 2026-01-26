"use client";

import NiceModal from "@ebay/nice-modal-react";
import { UserIcon } from "lucide-react";
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

interface AthleteBioEditModalProps {
	bio: string | null;
}

export const AthleteBioEditModal = NiceModal.create(
	({ bio }: AthleteBioEditModalProps) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: bioSchema,
			defaultValues: {
				bio: bio ?? "",
			},
		});

		const bioValue = form.watch("bio") ?? "";

		const updateMutation = trpc.athlete.updateMyProfile.useMutation({
			onSuccess: () => {
				toast.success("Biografia actualizada");
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar");
			},
		});

		const onSubmit = form.handleSubmit((data: BioFormData) => {
			updateMutation.mutate({
				bio: data.bio || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title="Biografia"
				subtitle="Cuenta tu historia deportiva"
				icon={<UserIcon className="size-5" />}
				accentColor="violet"
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
										<FormLabel>Tu historia</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Cuenta tu trayectoria, logros, motivaciones y objetivos..."
												className="min-h-[200px] resize-none"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<div className="flex items-center justify-between">
											<FormDescription>
												Una buena biografia ayuda a scouts y reclutadores a
												conocerte mejor.
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
