"use client";

import NiceModal from "@ebay/nice-modal-react";
import { PhoneIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { DatePicker } from "@/components/ui/custom/date-picker";
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
	phone: z.string().trim().max(30).optional().nullable(),
	birthDate: z.date().optional().nullable(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface CoachContactEditModalProps {
	phone: string | null;
	birthDate: Date | null;
}

export const CoachContactEditModal = NiceModal.create(
	({ phone, birthDate }: CoachContactEditModalProps) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: contactSchema,
			defaultValues: {
				phone: phone ?? "",
				birthDate: birthDate ?? undefined,
			},
		});

		const updateMutation = trpc.coach.updateMyProfile.useMutation({
			onSuccess: () => {
				toast.success("Informacion de contacto actualizada");
				utils.coach.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar");
			},
		});

		const onSubmit = form.handleSubmit((data: ContactFormData) => {
			updateMutation.mutate({
				phone: data.phone || null,
				birthDate: data.birthDate || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title="Informacion Personal"
				subtitle="Tu telefono y fecha de nacimiento"
				icon={<PhoneIcon className="size-5" />}
				accentColor="primary"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title="Datos personales">
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Telefono</FormLabel>
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
											<FormLabel>Fecha de nacimiento</FormLabel>
											<FormControl>
												<DatePicker
													date={field.value ?? undefined}
													onDateChange={field.onChange}
													placeholder="Seleccionar fecha"
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
