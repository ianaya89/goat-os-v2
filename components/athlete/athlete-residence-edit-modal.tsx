"use client";

import NiceModal from "@ebay/nice-modal-react";
import { HomeIcon } from "lucide-react";
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

interface AthleteResidenceEditModalProps {
	residenceCity: string | null;
	residenceCountry: string | null;
	nationality: string | null;
}

export const AthleteResidenceEditModal = NiceModal.create(
	({
		residenceCity,
		residenceCountry,
		nationality,
	}: AthleteResidenceEditModalProps) => {
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

		const updateMutation = trpc.athlete.updateMyProfile.useMutation({
			onSuccess: () => {
				toast.success("Informacion de residencia actualizada");
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar");
			},
		});

		const onSubmit = form.handleSubmit((data: ResidenceFormData) => {
			updateMutation.mutate({
				residenceCity: data.residenceCity || null,
				residenceCountry: data.residenceCountry || null,
				nationality: data.nationality || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title="Residencia"
				subtitle="Tu ubicacion actual y nacionalidad"
				icon={<HomeIcon className="size-5" />}
				accentColor="sky"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title="Ubicacion">
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="residenceCity"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Ciudad</FormLabel>
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
											<FormLabel>Pais</FormLabel>
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

					<ProfileEditSection title="Nacionalidad">
						<FormField
							control={form.control}
							name="nationality"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Nacionalidad</FormLabel>
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
